// Layer 2, server. Recover on one cluster of `slurm.resource`, every command through the HPC
// `Runner` (one remote command string over ssh, on that cluster's connection) and every file sent
// by the HPC copier, so a test replaces both and nothing here opens a connection. Every value in a
// remote command string is one shell word (`shellWord`, and `pathWord` for a path under the home
// folder).
//
// A Fetch is the fetch script of plan.ts run on the login node inside
// `tmux -L oculus-recover new-session -d -s <hub>-<key>`, its log `recover.log` in the dataset's
// folder; it is found again by `tmux -L oculus-recover ls`. Its curl config files are written here
// with mode 600, sent into `~/.oculus/recover/<hub>/` on the cluster, and removed here once sent;
// the script's trap removes them there when the run ends, and the next run removes any left
// before it starts.
//
// Verify and Unpack are compute, so each press is one `sbatch` job whose script is written here,
// passes the scratch rule's text check, is sent to `~/.oculus/recover/jobs/` and is submitted
// through the runner; its work is under `/local/$SLURM_JOB_ID`. The job checks with `sha256sum`,
// `md5sum` or `sha1sum`, appending a line per file to `~/.oculus/recover/<hub>/<key>.checks.txt`,
// and unpacks with 7z-wasm under the official Node build of the server's own version, which the
// login node fetches once, from the address the hub's `recover.node_download` names, into
// `~/.oculus/recover/node/<version>/` with its `SHASUMS256.txt` and the job checks before
// unpacking it; with no such address an Unpack is refused. The job's id is kept here in
// `clusters/<resource>/<key>.job.json` of the hub's Recover folder, one record per cluster.

import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { DownloadAccount, DownloadService } from '../../../../data/sources/config.ts';
import { cancel, validId } from '../../hpc/actions.ts';
import { scratchText } from '../../hpc/scratch.ts';
import type { Connection, Runner } from '../../hpc/ssh.ts';
import { copyVector, type Copier } from '../../hpc/transfer.ts';
import { shellWord } from '../../pty/shell-word.ts';
import { CLUSTER_LOG, lastLines, LOG_LINES } from './live/log.ts';
import type { RunAction, RunState } from './local.ts';
import { recoverFiles } from './local.ts';
import {
    curlConfig,
    dataPart,
    fetchScript,
    pathWord,
    validName,
    type FetchItem,
    type OnDisk,
    type PlanRow
} from './plan.ts';
import { checksFromLines } from './verify.ts';
import { SEVEN_ZIP_FILES, UNPACK_PROGRAM } from './unpack.ts';
import type { CheckRow } from './plan.ts';

/** The tmux socket of oculus's Recover sessions on the login node. */
export const SOCKET = 'oculus-recover';

/** How long one remote command is given. */
const COMMAND_MS = 60000;

/** The partition of the check and unpack jobs, open to every user (docs/HPC-UTwente-howto.md). */
const PARTITION = 'main-cpu';

/** What the runs on one cluster are handed. */
export type ClusterDeps = {
    /** The cluster's key in `slurm.resource`, which names its job records here. */
    resource: string;
    connection: Connection;
    runner: Runner;
    copy: Copier;
    /** This Mac's home folder, where the files sent are written first. */
    home: string;
    /** The Node version the job unpacks with, the server's own (`process.version`). */
    nodeVersion: string;
    /**
     * The hub's `recover.node_download`: the address the official Node builds are listed under, one
     * folder per version, or '' when the hub names none.
     */
    nodeDownload: string;
    sevenZip: () => string;
};

/** One dataset on the cluster: its hub, key and folder as a path under the home folder. */
export type ClusterPlace = { hub: string; key: string; folder: string };

/** The dataset's place on the cluster, or null when its names or its `path:` are unusable. */
export function clusterPlace(
    hub: string,
    key: string,
    path: string | undefined
): ClusterPlace | null {
    const part = dataPart(path);
    if (!validName(hub) || !validName(key) || part === null) return null;
    return { hub, key, folder: `~/data/${part}` };
}

/** The session of a dataset: the hub and the key, so two hubs with one key never share one. */
export function sessionName(hub: string, key: string): string {
    return `${hub}-${key}`;
}

/** The files of a dataset under `~/.oculus/recover/` on the cluster, as `~/` paths. */
function remoteFiles(hub: string, key: string) {
    const dir = `~/.oculus/recover/${hub}`;
    return {
        dir,
        script: `${dir}/${key}.fetch.sh`,
        checks: `${dir}/${key}.checks.txt`,
        config: (service: DownloadService) => `${dir}/${key}.${service}.curl`
    };
}

/** The names of oculus's sessions on the socket; none when no tmux server runs there. */
async function clusterSessions(deps: ClusterDeps): Promise<string[]> {
    const done = await deps.runner(
        deps.connection,
        `tmux -L ${SOCKET} ls -F '#{session_name}'`,
        COMMAND_MS
    );
    if (done.code !== 0) return [];
    return done.stdout.split('\n').filter((line) => line !== '');
}

/** What the cluster holds of a dataset: its files' sizes and times, the free space, the checks. */
export type ClusterDisk = { disk: Map<string, OnDisk>; free: number | null; checks: CheckRow[] };

const DF = '@@oculus:df';
const CHECKS = '@@oculus:checks';

/**
 * Read the folder's files, the free space of its disk and the check lines, in one command; null
 * when the command did not reach the login node's shell, whose output then lacks the marker.
 */
export async function clusterDisk(
    place: ClusterPlace,
    deps: ClusterDeps
): Promise<ClusterDisk | null> {
    const folder = pathWord(place.folder);
    const remote = [
        `f=${folder}`,
        `[ -d "$f" ] && find "$f" -type f -printf '%s %T@ %P\\n'`,
        `echo ${DF}`,
        'p=$f; while [ ! -d "$p" ]; do p=$(dirname "$p"); done; df -Pk "$p" | tail -n 1',
        `echo ${CHECKS}`,
        `cat ${pathWord(remoteFiles(place.hub, place.key).checks)} 2>/dev/null`,
        'true'
    ].join('; ');
    const done = await deps.runner(deps.connection, remote, COMMAND_MS);
    if (!done.stdout.includes(`${DF}\n`)) return null;
    const [files = '', rest = ''] = done.stdout.split(`${DF}\n`);
    const [df = '', checks = ''] = rest.split(`${CHECKS}\n`);
    const disk = new Map<string, OnDisk>();
    for (const line of files.split('\n')) {
        const found = /^(\d+) (\d+)(?:\.\d+)? (.+)$/.exec(line);
        if (found !== null) disk.set(found[3], { size: Number(found[1]), mtime: Number(found[2]) });
    }
    const avail = df.trim().split(/\s+/).at(3);
    return {
        disk,
        free: avail !== undefined && /^\d+$/.test(avail) ? Number(avail) * 1024 : null,
        checks: checksFromLines(checks)
    };
}

/**
 * The remote command printing the last lines of the fetch log in the dataset's folder and of the
 * latest job's output on the cluster `resource`; the Live HPC batch of that cluster runs it for a
 * run Recover follows there (live/batch.ts).
 */
export function clusterLogTails(place: ClusterPlace, home: string, resource: string): string {
    const job = readJob(home, place, resource);
    const output =
        job === null
            ? ''
            : `; tail -n ${LOG_LINES} ${pathWord(jobOutput(place, job.id))} 2>/dev/null`;
    return `tail -n ${LOG_LINES} ${pathWord(`${place.folder}/${CLUSTER_LOG}`)} 2>/dev/null${output}`;
}

/** The last lines of the fetch log in the dataset's folder and of the latest job's output. */
export async function clusterLog(place: ClusterPlace, deps: ClusterDeps): Promise<string[]> {
    const done = await deps.runner(
        deps.connection,
        `${clusterLogTails(place, deps.home, deps.resource)}; true`,
        COMMAND_MS
    );
    return lastLines(done.stdout);
}

/** A job of a dataset as it is kept here: its id and what it does. */
type JobRecord = { id: string; action: RunAction };

/** The folder of a hub's job records, one folder per cluster below it. */
export function jobsRoot(home: string, hub: string): string {
    return join(recoverFiles(home, hub, '').dir, 'clusters');
}

/** The folder of a hub's job records of one cluster. */
export function jobFolder(home: string, hub: string, resource: string): string {
    return join(jobsRoot(home, hub), resource);
}

function jobFile(home: string, place: ClusterPlace, resource: string): string {
    return join(jobFolder(home, place.hub, resource), `${place.key}.job.json`);
}

/** The job of a dataset kept for the cluster `resource`, or null. */
export function readJob(home: string, place: ClusterPlace, resource: string): JobRecord | null {
    try {
        const held = JSON.parse(
            readFileSync(jobFile(home, place, resource), 'utf8')
        ) as Partial<JobRecord>;
        return typeof held.id === 'string' &&
            validId(held.id) &&
            (held.action === 'verify' || held.action === 'unpack')
            ? { id: held.id, action: held.action }
            : null;
    } catch {
        return null;
    }
}

/** The output file of a job, in the jobs folder sbatch is run from. */
function jobOutput(place: ClusterPlace, id: string): string {
    return `~/.oculus/recover/jobs/${place.hub}-${place.key}-${id}.log`;
}

/** The dataset's run on the cluster: its session, else its job while the queue holds it. */
export async function clusterState(
    place: ClusterPlace,
    deps: ClusterDeps,
    sessions?: string[]
): Promise<RunState | null> {
    const live = sessions ?? (await clusterSessions(deps));
    if (live.includes(sessionName(place.hub, place.key))) return { action: 'fetch' };
    const job = readJob(deps.home, place, deps.resource);
    if (job === null) return null;
    const done = await deps.runner(deps.connection, `squeue -h -j ${job.id} -o %T`, COMMAND_MS);
    return done.code === 0 && done.stdout.trim() !== ''
        ? { action: job.action, job: job.id }
        : null;
}

/** Why a cluster run did not start. */
export type ClusterRefusal =
    'running' | 'credential' | 'nothing' | 'send' | 'scratch' | 'submit' | 'download';

/** Send files of a local folder to a folder under the cluster's home, made first. */
async function send(
    deps: ClusterDeps,
    from: string,
    files: string[],
    to: string
): Promise<boolean> {
    const made = await deps.runner(
        deps.connection,
        `mkdir -p ${pathWord(to)} && chmod 700 ${pathWord(to)}`,
        COMMAND_MS
    );
    if (made.code !== 0) return false;
    const sent = await deps.copy({
        cwd: from,
        vector: copyVector(deps.connection, to.replace(/^~\//, '')),
        files,
        signal: AbortSignal.timeout(COMMAND_MS * 5)
    });
    return sent.code === 0;
}

/**
 * Start a Fetch on the login node: the config files and the script sent, then the tmux session.
 * Refused while a run of the dataset goes, when a row's value cannot go in a config file, and
 * when there is nothing to fetch.
 */
export async function startClusterFetch(
    place: ClusterPlace,
    items: FetchItem[],
    downloads: DownloadAccount[],
    deps: ClusterDeps
): Promise<ClusterRefusal | null> {
    if ((await clusterState(place, deps)) !== null) return 'running';
    if (items.length === 0) return 'nothing';
    const remote = remoteFiles(place.hub, place.key);
    const cleared = await deps.runner(
        deps.connection,
        `rm -f ${(['physionet', 'kaggle', 'synapse'] as const).map((one) => pathWord(remote.config(one))).join(' ')} ${pathWord(remote.script)}`,
        COMMAND_MS
    );
    if (cleared.code !== 0) return 'send';
    const stage = stageOf(deps, place);
    rmSync(stage, { recursive: true, force: true });
    mkdirSync(stage, { recursive: true, mode: 0o700 });
    try {
        const configs: Partial<Record<DownloadService, string>> = {};
        const names: string[] = [];
        for (const service of new Set(items.flatMap(({ row }) => row.service ?? []))) {
            const account = downloads.find((row) => row.service === service);
            const text = account === undefined ? null : curlConfig(account);
            if (text === null) return 'credential';
            const name = `${place.key}.${service}.curl`;
            writeFileSync(join(stage, name), text, { mode: 0o600, flag: 'wx' });
            names.push(name);
            configs[service] = remote.config(service);
        }
        const title = `oculus Recover: the fetch of ${place.hub}/${place.key}, removed when it ends`;
        const script = `${place.key}.fetch.sh`;
        writeFileSync(
            join(stage, script),
            fetchScript(
                items,
                {
                    folder: place.folder,
                    log: `${place.folder}/${CLUSTER_LOG}`,
                    script: remote.script,
                    configs
                },
                title
            ),
            { mode: 0o600 }
        );
        if (!(await send(deps, stage, [...names, script], remote.dir))) return 'send';
    } finally {
        rmSync(stage, { recursive: true, force: true });
    }
    const started = await deps.runner(
        deps.connection,
        `tmux -L ${SOCKET} new-session -d -s ${shellWord(sessionName(place.hub, place.key))} ${shellWord(`sh ${pathWord(remote.script)}`)}`,
        COMMAND_MS
    );
    return started.code === 0 ? null : 'send';
}

/**
 * The folder a run's files are written to here before they are sent: one per dataset and cluster,
 * so two runs pressed at once never write into one.
 */
function stageOf(deps: ClusterDeps, place: ClusterPlace): string {
    return join(jobFolder(deps.home, place.hub, deps.resource), `${place.key}.stage`);
}

/**
 * The official Node build for Linux of a version, its folder on the cluster, and its address
 * under `download` (`recover.node_download`), one folder per version.
 */
function nodeBuild(version: string, download = '') {
    const name = `node-${version}-linux-x64`;
    return {
        name,
        tarball: `${name}.tar.xz`,
        folder: `~/.oculus/recover/node/${version}`,
        url: `${download.replace(/\/+$/, '')}/${version}/`
    };
}

/**
 * The job script of a Verify or an Unpack. Its work is under `/local/$SLURM_JOB_ID`, removed when
 * it ends. Verify appends a check line per file; Unpack checks the Node tarball against its
 * `SHASUMS256.txt` before unpacking it into the work folder, copies each archive there and runs
 * the unpack program on the copy into the archive's folder, with its source's strip and folder.
 */
function jobScript(
    action: 'verify' | 'unpack',
    rows: PlanRow[],
    place: ClusterPlace,
    nodeVersion: string
): string {
    const node = nodeBuild(nodeVersion);
    const head = [
        '#!/bin/sh',
        '#SBATCH --job-name=oculus-recover',
        `#SBATCH --partition=${PARTITION}`,
        '#SBATCH --cpus-per-task=2',
        '#SBATCH --mem=4G',
        '#SBATCH --time=24:00:00',
        `#SBATCH --output=${place.hub}-${place.key}-%j.log`,
        `# oculus Recover: the ${action} of ${place.hub}/${place.key}`,
        'WORK=/local/$SLURM_JOB_ID',
        'mkdir -p "$WORK" || exit 1',
        'trap \'rm -rf "$WORK"\' EXIT',
        'say() { printf \'%s %s\\n\' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$*"; }',
        `cd ${pathWord(place.folder)} || { say ${shellWord(`${action}: the folder is not there`)}; exit 1; }`
    ];
    if (action === 'verify') {
        const checks = pathWord(remoteFiles(place.hub, place.key).checks);
        return [
            ...head,
            'check() {',
            '    got=$("$1"sum -- "$3" | cut -d " " -f 1) || { say "verify: cannot read $3"; return; }',
            `    printf '%s %s %s %s\\n' "$(stat -c '%s %Y' -- "$3")" "$1" "$got" "$3" >> ${checks}`,
            '    if [ "$got" = "$2" ]; then say "verify: matches $3"; else say "verify: does not match $3"; fi',
            '}',
            ...rows.flatMap((row) =>
                row.checksum === null
                    ? []
                    : [
                          `check ${row.checksum.kind} ${shellWord(row.checksum.value.toLowerCase())} ${shellWord(row.name)}`
                      ]
            ),
            "say 'verify: done'",
            ''
        ].join('\n');
    }
    return [
        ...head,
        `NODE_DIR=${pathWord(node.folder)}`,
        `( cd "$NODE_DIR" && grep ${shellWord(` ${node.tarball}`)}'$' SHASUMS256.txt | sha256sum -c --status - ) || { rm -f "$NODE_DIR"/${shellWord(node.tarball)}; say 'unpack: the Node build does not match its SHASUMS256.txt and is removed; press Unpack again'; exit 1; }`,
        `tar -xJf "$NODE_DIR"/${shellWord(node.tarball)} -C "$WORK" || exit 1`,
        `NODE="$WORK"/${shellWord(`${node.name}/bin/node`)}`,
        'unpack() {',
        '    mkdir -p "$WORK/a" && cp -- "$1" "$WORK/a/" || { say "unpack: cannot copy $1"; return 1; }',
        '    "$NODE" "$HOME/.oculus/recover/jobs/unpack.cjs" "$HOME/.oculus/recover/7z-wasm" "$WORK/a/$(basename -- "$1")" "$WORK/u" "$(cd "$(dirname -- "$1")" && pwd)" "$2" "$3"',
        '    code=$?',
        '    rm -rf "$WORK/a"',
        '    return $code',
        '}',
        ...rows.map(
            (row) =>
                `unpack ${shellWord(row.name)} ${row.unpack?.strip ?? 0} ${shellWord(row.unpack?.folder ?? '')} || exit 1`
        ),
        "say 'unpack: done'",
        ''
    ].join('\n');
}

/**
 * The login node's part before an Unpack: the Node build and its `SHASUMS256.txt` fetched by curl
 * when absent, and the 7z-wasm files sent. A build the job finds wrong is removed by the job, so
 * the next press fetches it again.
 */
async function prepareUnpack(deps: ClusterDeps): Promise<boolean> {
    const node = nodeBuild(deps.nodeVersion, deps.nodeDownload);
    const folder = pathWord(node.folder);
    const fetched = await deps.runner(
        deps.connection,
        [
            `mkdir -p ${folder}`,
            `cd ${folder}`,
            `{ [ -f ${shellWord(node.tarball)} ] || curl --fail -L -sS -o ${shellWord(node.tarball)} ${shellWord(node.url + node.tarball)}; }`,
            `{ [ -f SHASUMS256.txt ] || curl --fail -L -sS -o SHASUMS256.txt ${shellWord(`${node.url}SHASUMS256.txt`)}; }`
        ].join(' && '),
        COMMAND_MS * 10
    );
    if (fetched.code !== 0) return false;
    return send(deps, deps.sevenZip(), SEVEN_ZIP_FILES, '~/.oculus/recover/7z-wasm');
}

/**
 * Start a Verify or an Unpack as one `sbatch` job: the script written and checked against the
 * scratch rule, sent with the unpack program to `~/.oculus/recover/jobs/`, and submitted there.
 */
export async function startClusterJob(
    action: 'verify' | 'unpack',
    place: ClusterPlace,
    rows: PlanRow[],
    deps: ClusterDeps
): Promise<ClusterRefusal | null> {
    if ((await clusterState(place, deps)) !== null) return 'running';
    if (rows.length === 0) return 'nothing';
    if (action === 'unpack' && deps.nodeDownload === '') return 'download';
    const script = jobScript(action, rows, place, deps.nodeVersion);
    if (!(await scratchText(script))) return 'scratch';
    if (action === 'unpack' && !(await prepareUnpack(deps))) return 'send';
    const stage = stageOf(deps, place);
    rmSync(stage, { recursive: true, force: true });
    mkdirSync(stage, { recursive: true, mode: 0o700 });
    const name = `${place.hub}-${place.key}-${action}.sh`;
    try {
        writeFileSync(join(stage, name), script, { mode: 0o600 });
        writeFileSync(join(stage, 'unpack.cjs'), UNPACK_PROGRAM, { mode: 0o600 });
        if (!(await send(deps, stage, [name, 'unpack.cjs'], '~/.oculus/recover/jobs')))
            return 'send';
    } finally {
        rmSync(stage, { recursive: true, force: true });
    }
    const done = await deps.runner(
        deps.connection,
        `cd ${pathWord('~/.oculus/recover/jobs')} && sbatch --parsable ${shellWord(name)}`,
        COMMAND_MS
    );
    const id = done.stdout.trim().split(';')[0];
    if (done.code !== 0 || !validId(id)) return 'submit';
    mkdirSync(jobFolder(deps.home, place.hub, deps.resource), { recursive: true, mode: 0o700 });
    writeFileSync(jobFile(deps.home, place, deps.resource), `${JSON.stringify({ id, action })}\n`, {
        mode: 0o600
    });
    return null;
}

/**
 * Stop the dataset's run on the cluster: its own session, by its exact name, or its job by the id
 * kept here. A session of another hub or key is never named. Answers whether a run was stopped.
 */
export async function stopCluster(place: ClusterPlace, deps: ClusterDeps): Promise<boolean> {
    const state = await clusterState(place, deps);
    if (state === null) return false;
    if (state.action === 'fetch') {
        const done = await deps.runner(
            deps.connection,
            `tmux -L ${SOCKET} kill-session -t ${shellWord(`=${sessionName(place.hub, place.key)}`)}`,
            COMMAND_MS
        );
        return done.code === 0;
    }
    return (
        state.job !== undefined &&
        (await cancel(deps.connection, state.job, deps.runner)).status === 'ok'
    );
}
