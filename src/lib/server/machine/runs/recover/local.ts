// Layer 2, server. Recover on this Mac. Its files are under `~/.oculus/recover/<hub>/`, one set
// per dataset key: the listing (`<key>.list.json`), the check rows (`<key>.checks.json`), the log
// (`<key>.log`), and while a fetch runs its script (`<key>.fetch.sh`), its pid file
// (`<key>.pid`) and a curl config file per service (`<key>.<service>.curl`, mode 600).
//
// A fetch is the script of plan.ts run by `sh` as a process group of its own, detached, so it
// outlives the server. Its pid file records the pid, the process's start time and its command
// line; after a restart the run reads as running only when a process with that pid has the same
// start time and command, and Stop signals only such a process. Verify and Unpack run inside the
// server (the hash) and in a child it starts (the unpack), held in a table of runs that ends with
// the server. One dataset has one run at a time: a second is refused while one goes.

import { spawn, spawnSync } from 'node:child_process';
import {
    existsSync,
    mkdirSync,
    readFileSync,
    rmSync,
    statfsSync,
    statSync,
    writeFileSync
} from 'node:fs';
import { dirname, join } from 'node:path';
import type { RecoverRun } from '../../../../data/model/index.ts';
import type { DownloadAccount, DownloadService } from '../../../../data/sources/config.ts';
import { logLine } from './live/log.ts';
import {
    curlConfig,
    dataPart,
    fetchScript,
    validName,
    type FetchItem,
    type OnDisk,
    type PlanRow
} from './plan.ts';
import { verifyRows } from './verify.ts';
import { sevenZipFolder, startUnpack, unpackVector, type UnpackStart } from './unpack.ts';

/** The run of a dataset as the view is told it: what it does and, in the server, how far it is. */
export type RunState = RecoverRun;

/** What a run does. */
export type RunAction = RecoverRun['action'];

/** A run inside the server: what it does, how far it is, and how it is stopped. */
type LocalRun = { action: RunAction; done: number; total: number; stop: () => void };

/** The runs inside the server, by `<hub>/<key>`. */
export type LocalRuns = Map<string, LocalRun>;

/** A process as `ps` reports it: its start time and its whole command line. */
type ProcessInfo = { start: string; command: string };

/** The start time and command of a pid, or null when no process has it. */
type ProcessOf = (pid: number) => ProcessInfo | null;

/** How long one `ps` is given. */
const PS_MS = 5000;

/** The real reading: one `ps` with an argument vector, in the C locale for a fixed date form. */
const systemProcessOf: ProcessOf = (pid) => {
    const done = spawnSync('ps', ['-ww', '-o', 'lstart=,command=', '-p', String(pid)], {
        encoding: 'utf8',
        timeout: PS_MS,
        env: { ...process.env, LC_ALL: 'C' }
    });
    if (done.status !== 0 || typeof done.stdout !== 'string') return null;
    const line = done.stdout.trim();
    const parts = line.split(/\s+/);
    if (parts.length < 6) return null;
    return { start: parts.slice(0, 5).join(' '), command: parts.slice(5).join(' ') };
};

/**
 * Starts a fetch script detached, as a process group of its own, and answers its pid; `exited` is
 * called when the process ends while this server runs.
 */
type StartDetached = (script: string, exited: () => void) => number | null;

const startDetached: StartDetached = (script, exited) => {
    const child = spawn('sh', [script], { detached: true, stdio: 'ignore' });
    child.on('exit', exited);
    child.unref();
    return child.pid ?? null;
};

/** What the runs of this Mac are handed; each has its real value in the route. */
export type LocalDeps = {
    home: string;
    runs: LocalRuns;
    processOf: ProcessOf;
    startDetached: StartDetached;
    startUnpack: UnpackStart;
    /** Signals a process group. */
    signal: (pid: number) => void;
    sevenZip: () => string;
    /** Told when a run this server started ends: its fetch's process, or its check or unpack. */
    ended: (hub: string, key: string) => void;
};

/**
 * The real dependencies, over the home folder and the server's table of runs; `ended` is the
 * Recover watcher's, which pushes the end of a run at once.
 */
export function localDeps(
    home: string,
    runs: LocalRuns,
    ended: (hub: string, key: string) => void = () => undefined
): LocalDeps {
    return {
        home,
        runs,
        processOf: systemProcessOf,
        startDetached,
        startUnpack,
        signal: (pid) => process.kill(-pid, 'SIGTERM'),
        sevenZip: sevenZipFolder,
        ended
    };
}

/** Take a run inside the server out of the table, and tell the deps that it ended. */
function finished(place: LocalPlace, deps: LocalDeps): void {
    deps.runs.delete(`${place.hub}/${place.key}`);
    deps.ended(place.hub, place.key);
}

/** One dataset on this Mac: its hub, key and folder, each checked. */
export type LocalPlace = { hub: string; key: string; folder: string };

/**
 * The dataset's place on this Mac, or null when the hub's name or the key is unusable or `path:`
 * is not under `~/data`: nothing is written or started for such a set.
 */
export function localPlace(
    home: string,
    hub: string,
    key: string,
    path: string | undefined
): LocalPlace | null {
    const part = dataPart(path);
    if (!validName(hub) || !validName(key) || part === null) return null;
    return { hub, key, folder: join(home, 'data', part) };
}

/** The files Recover keeps for a dataset under `~/.oculus/recover/<hub>/`. */
export function recoverFiles(home: string, hub: string, key: string) {
    const dir = join(home, '.oculus', 'recover', hub);
    return {
        dir,
        list: join(dir, `${key}.list.json`),
        checks: join(dir, `${key}.checks.json`),
        log: join(dir, `${key}.log`),
        pid: join(dir, `${key}.pid`),
        script: join(dir, `${key}.fetch.sh`),
        config: (service: DownloadService) => join(dir, `${key}.${service}.curl`)
    };
}

/** The services a credential file may be written for. */
const SERVICES: DownloadService[] = ['physionet', 'kaggle', 'synapse'];

/** The folder of Recover's files for a hub, made with mode 700 when absent. */
function ownDir(home: string, hub: string): string {
    const dir = recoverFiles(home, hub, 'x').dir;
    mkdirSync(dir, { recursive: true, mode: 0o700 });
    return dir;
}

/** The size and time of each listed file the folder holds. */
export function diskOf(folder: string, names: string[]): Map<string, OnDisk> {
    const disk = new Map<string, OnDisk>();
    for (const name of names) {
        try {
            const stat = statSync(join(folder, name));
            if (stat.isFile()) {
                disk.set(name, { size: stat.size, mtime: Math.floor(stat.mtimeMs / 1000) });
            }
        } catch {
            // A file that is not there is missing, which the plan states.
        }
    }
    return disk;
}

/** Bytes free on the disk that holds the folder, or its nearest folder that exists. */
export function freeOf(folder: string): number | null {
    let at = folder;
    while (!existsSync(at) && dirname(at) !== at) at = dirname(at);
    try {
        const stat = statfsSync(at);
        return stat.bavail * stat.bsize;
    } catch {
        return null;
    }
}

/** A pid file's record. */
type PidRecord = { pid: number; start: string; command: string };

function readPid(file: string): PidRecord | null {
    try {
        const held = JSON.parse(readFileSync(file, 'utf8')) as Partial<PidRecord>;
        return typeof held.pid === 'number' &&
            typeof held.start === 'string' &&
            typeof held.command === 'string'
            ? { pid: held.pid, start: held.start, command: held.command }
            : null;
    } catch {
        return null;
    }
}

/** The fetch the pid file names, when a process with its pid, start and command still runs. */
function liveFetch(place: LocalPlace, deps: LocalDeps): PidRecord | null {
    const record = readPid(recoverFiles(deps.home, place.hub, place.key).pid);
    if (record === null || record.start === '') return null;
    const now = deps.processOf(record.pid);
    return now !== null && now.start === record.start && now.command === record.command
        ? record
        : null;
}

/** The dataset's run on this Mac, or null when none goes. */
export function localState(place: LocalPlace, deps: LocalDeps): RunState | null {
    const inside = deps.runs.get(`${place.hub}/${place.key}`);
    if (inside !== undefined) {
        return { action: inside.action, done: inside.done, total: inside.total };
    }
    return liveFetch(place, deps) === null ? null : { action: 'fetch' };
}

/** Why a run did not start. */
export type StartRefusal = 'running' | 'credential' | 'nothing' | 'start';

/** Remove the credential files and the script an earlier fetch left. */
function clearLeftovers(home: string, hub: string, key: string): void {
    const files = recoverFiles(home, hub, key);
    for (const service of SERVICES) rmSync(files.config(service), { force: true });
    rmSync(files.script, { force: true });
}

/**
 * Start a Fetch of the items: the credential files of the services they need, written with mode
 * 600, the script, and `sh` running it detached. Refused while a run of the dataset goes, when a
 * row's value cannot go in a config file, and when there is nothing to fetch.
 */
export function startLocalFetch(
    place: LocalPlace,
    items: FetchItem[],
    downloads: DownloadAccount[],
    deps: LocalDeps
): StartRefusal | null {
    if (localState(place, deps) !== null) return 'running';
    if (items.length === 0) return 'nothing';
    ownDir(deps.home, place.hub);
    clearLeftovers(deps.home, place.hub, place.key);
    const files = recoverFiles(deps.home, place.hub, place.key);
    const configs: Partial<Record<DownloadService, string>> = {};
    for (const service of new Set(items.flatMap(({ row }) => row.service ?? []))) {
        const account = downloads.find((row) => row.service === service);
        const text = account === undefined ? null : curlConfig(account);
        if (text === null) {
            clearLeftovers(deps.home, place.hub, place.key);
            return 'credential';
        }
        writeFileSync(files.config(service), text, { mode: 0o600, flag: 'wx' });
        configs[service] = files.config(service);
    }
    const title = `oculus Recover: the fetch of ${place.hub}/${place.key}, removed when it ends`;
    writeFileSync(
        files.script,
        fetchScript(
            items,
            { folder: place.folder, log: files.log, script: files.script, configs },
            title
        ),
        { mode: 0o600 }
    );
    logLine(files.log, `fetch: started for ${items.length} files`);
    const pid = deps.startDetached(files.script, () => deps.ended(place.hub, place.key));
    if (pid === null) {
        clearLeftovers(deps.home, place.hub, place.key);
        logLine(files.log, 'fetch: sh did not start');
        return 'start';
    }
    const seen = deps.processOf(pid);
    const record: PidRecord = { pid, start: seen?.start ?? '', command: seen?.command ?? '' };
    writeFileSync(files.pid, `${JSON.stringify(record)}\n`, { mode: 0o600 });
    return null;
}

/** Start Verify of the rows inside the server; refused while a run of the dataset goes. */
export function startLocalVerify(
    place: LocalPlace,
    rows: PlanRow[],
    deps: LocalDeps
): StartRefusal | null {
    if (localState(place, deps) !== null) return 'running';
    if (rows.length === 0) return 'nothing';
    ownDir(deps.home, place.hub);
    const files = recoverFiles(deps.home, place.hub, place.key);
    const id = `${place.hub}/${place.key}`;
    const stop = new AbortController();
    const run: LocalRun = {
        action: 'verify',
        done: 0,
        total: rows.reduce((sum, row) => sum + (row.size ?? 0), 0),
        stop: () => stop.abort()
    };
    deps.runs.set(id, run);
    logLine(files.log, `verify: started for ${rows.length} files`);
    void verifyRows(
        place.folder,
        rows,
        files.checks,
        {
            bytes: (done) => (run.done = done),
            checked: (name, matched) =>
                logLine(files.log, `verify: ${matched ? 'matches' : 'does not match'} ${name}`)
        },
        stop.signal
    )
        .then(() => logLine(files.log, stop.signal.aborted ? 'verify: stopped' : 'verify: done'))
        .catch((error: unknown) =>
            logLine(files.log, `verify: failed, ${error instanceof Error ? error.message : ''}`)
        )
        .finally(() => finished(place, deps));
    return null;
}

/**
 * Start Unpack of the archives, one child after another, each into its own folder with its
 * source's strip; refused while a run of the dataset goes.
 */
export function startLocalUnpack(
    place: LocalPlace,
    rows: PlanRow[],
    deps: LocalDeps
): StartRefusal | null {
    if (localState(place, deps) !== null) return 'running';
    if (rows.length === 0) return 'nothing';
    ownDir(deps.home, place.hub);
    const files = recoverFiles(deps.home, place.hub, place.key);
    const id = `${place.hub}/${place.key}`;
    let stopped = false;
    let current: ReturnType<UnpackStart> | null = null;
    const run: LocalRun = {
        action: 'unpack',
        done: 0,
        total: rows.length,
        stop: () => {
            stopped = true;
            current?.kill('SIGTERM');
        }
    };
    deps.runs.set(id, run);
    logLine(files.log, `unpack: started for ${rows.length} archives`);
    const next = (at: number): void => {
        const row = rows.at(at);
        if (row === undefined || stopped) {
            logLine(files.log, stopped ? 'unpack: stopped' : 'unpack: done');
            finished(place, deps);
            return;
        }
        const archive = join(place.folder, row.name);
        const child = deps.startUnpack(
            unpackVector(
                {
                    archive,
                    work: join(dirname(archive), `.recover-unpack-${place.key}`),
                    target: dirname(archive),
                    strip: row.unpack?.strip ?? 0
                },
                deps.sevenZip()
            )
        );
        current = child;
        const said = (chunk: unknown): void => {
            for (const line of String(chunk).split('\n')) {
                if (line.startsWith('unpack') || line.startsWith('skipped')) {
                    logLine(files.log, `unpack: ${line}`);
                }
            }
        };
        child.stdout?.on('data', said);
        child.stderr?.on('data', said);
        child.on('error', () => {
            logLine(files.log, `unpack: Node did not start for ${row.name}`);
            finished(place, deps);
        });
        child.on('close', (code) => {
            run.done = at + 1;
            if (code !== 0) {
                logLine(files.log, `unpack: ended with code ${code ?? 'none'} on ${row.name}`);
                finished(place, deps);
                return;
            }
            next(at + 1);
        });
    };
    next(0);
    return null;
}

/**
 * Stop the dataset's run on this Mac: the run inside the server, or the fetch whose pid file names
 * a process with the same start and command, whose group is signalled. A pid file whose process is
 * gone, or whose pid now belongs to another process, signals nothing. Answers whether a run ended.
 */
export function stopLocal(place: LocalPlace, deps: LocalDeps): boolean {
    const inside = deps.runs.get(`${place.hub}/${place.key}`);
    if (inside !== undefined) {
        inside.stop();
        return true;
    }
    const files = recoverFiles(deps.home, place.hub, place.key);
    const fetch = liveFetch(place, deps);
    if (fetch === null) return false;
    deps.signal(fetch.pid);
    logLine(files.log, 'fetch: stopped');
    return true;
}
