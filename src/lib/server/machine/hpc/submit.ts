// Layer 2, server. Submit on a job script: the plan of what will be copied and run, and the run of
// a plan the reader confirmed. The plan names the code folder of the script's project, the folder
// on the cluster it is copied to, the files sent, the rsync arguments and the one remote command,
// and warns when the script never names the cluster's per-job scratch folder (scratch.ts). The run
// computes the plan again at the press and runs it only when it equals the plan the reader
// confirmed, so what runs is what the confirm showed.
//
// The only processes started are rsync (transfer.ts) and one ssh that runs
// `cd <folder> && sbatch --parsable <script>` (ssh.ts), both injected so a test starts neither. One
// run per `<host>:<folder>` at a time: its key is held, with the run's AbortController, until the
// run ends whatever the end, and the state's `close()` aborts every run in flight, which ends the
// child being waited on and starts no sbatch after a copy it ended. Nothing in the module is
// global; the state is made once per server (server/root/context.ts).

import { createHash } from 'node:crypto';
import { lstatSync } from 'node:fs';
import { resolve } from 'node:path';
import { isDeepStrictEqual } from 'node:util';
import { clusterFolder } from '../../../data/shapes/shapes.ts';
import type { Finding, Project, SubmitPlan } from '../../../data/model/index.ts';
import { errorLine, readYamlMap } from '../../../data/sources/yaml-file.ts';
import type { TextCatalog } from '../../../data/helpers/finding-text.ts';
import { deepestHolding } from '../../../data/helpers/files/paths.ts';
import { HUB_ROOT, bareId, rootOf } from '../../../data/helpers/hub-names.ts';
import { inside, realPath } from '../../core/paths.ts';
import type { Read } from '../../core/git/run.ts';
import { projectDirectory, resolveRootPath, type Root } from '../../files/files.ts';
import { shellWord } from '../pty/shell-word.ts';
import { validId } from './actions.ts';
import { scratchRule } from './scratch.ts';
import type { Runner } from './ssh.ts';
import { copyVector, type Copier } from './transfer.ts';

/** Milliseconds the remote `sbatch` is given: one command that queues the job or does not. */
const SUBMIT_TIMEOUT_MS = 30000;

/** The words a refusal comes in. `outside`: the path is no file under a served root. */
type SubmitReason =
    | 'outside'
    | 'not-slurm'
    | 'no-project'
    | 'outside-code'
    | 'bad-cluster'
    | 'no-host'
    | 'no-files'
    | 'not-sent'
    | 'unconfirmed'
    | 'changed'
    | 'busy'
    | 'closed'
    | 'copy-failed'
    | 'submit-failed'
    | 'no-job-id';

/** A refusal: its word, and the line it carries when it has one (a sentence, a value, a stderr). */
type SubmitRefused = { status: 'refused'; reason: SubmitReason; detail?: string };

/** What a plan answers, and what a run answers. */
export type PlanAnswer = { status: 'ok'; plan: SubmitPlan } | SubmitRefused;
export type RunAnswer = { status: 'ok'; job: string } | SubmitRefused;

/**
 * The runs in flight: the `<host>:<folder>` of each with the controller that ends its children,
 * and whether the state is closed, after which no run starts.
 */
export type SubmitState = {
    running: Map<string, AbortController>;
    readonly closed: boolean;
    close: () => void;
};

/** A state with no run in flight, for a ServerContext being built. */
export function submitState(): SubmitState {
    const running = new Map<string, AbortController>();
    let closed = false;
    return {
        running,
        get closed() {
            return closed;
        },
        close() {
            closed = true;
            for (const controller of running.values()) controller.abort();
        }
    };
}

/** What a plan reads of the machine and the hub, all of it injected. */
export type PlanDeps = {
    /** The roots the request may name. */
    roots: () => Root[];
    /** The projects of the latest portfolio snapshot. */
    projects: () => Project[];
    /** The hub folder, which a project's folder is relative to. */
    hub: string;
    /** The text catalog the manifest reader words its findings from. */
    catalog: () => TextCatalog;
    /** The ssh alias to run against, or none and the sentence for why (host.ts). */
    where: () => { host: string; missing?: string };
    /** The paths git keeps under a folder (`keptFiles`), its refusals worded from the catalog. */
    kept: (code: string, text: TextCatalog) => Promise<Read<string[]>>;
};

/** What a run adds: the two runners, the state, the poll to follow with and the console line. */
export type SubmitDeps = PlanDeps & {
    copy: Copier;
    ssh: Runner;
    submits: SubmitState;
    refresh: () => Promise<void>;
    say: (line: string) => void;
};

/** The plan with what the run needs and the plan does not carry: the files and the key. */
type Planned = { plan: SubmitPlan; files: string[] };
type Computed = Planned | SubmitRefused;

const refuse = (reason: SubmitReason, detail?: string): SubmitRefused => ({
    status: 'refused',
    reason,
    ...(detail === undefined ? {} : { detail })
});

/** The cluster folder of a project: the manifest's `paths.cluster`, else `~/projects/<id>`. */
function clusterOf(project: Project, catalog: TextCatalog): { folder: string } | SubmitRefused {
    const findings: Finding[] = [];
    const manifest = readYamlMap(project.file, catalog, findings, errorLine);
    if (manifest === null) return refuse('bad-cluster', findings[0]?.message);
    const paths = manifest.paths;
    const written =
        typeof paths === 'object' && paths !== null && Object.hasOwn(paths, 'cluster')
            ? (paths as Record<string, unknown>).cluster
            : `~/projects/${bareId(project)}`;
    const folder = clusterFolder(written);
    return folder === null
        ? refuse('bad-cluster', typeof written === 'string' ? written : JSON.stringify(written))
        : { folder };
}

/** The remote command: the cluster folder, so `$SLURM_SUBMIT_DIR` is it, then sbatch. */
function remoteOf(folder: string, script: string): string {
    const where = folder.startsWith('~/') ? `~/${shellWord(folder.slice(2))}` : shellWord(folder);
    // A name that opens with a dash is made a path, so sbatch does not read it as an option.
    return `cd ${where} && sbatch --parsable ${shellWord(script.startsWith('-') ? `./${script}` : script)}`;
}

/**
 * The folder of a project: the repository it is read from, else its folder under the hub it is of.
 * Null when that hub is served nowhere.
 */
function folderOf(project: Project, deps: PlanDeps): string | null {
    const key = rootOf(project);
    const hub = key === HUB_ROOT ? deps.hub : deps.roots().find((one) => one.key === key)?.dir;
    return hub === undefined ? null : projectDirectory(hub, project);
}

/** The project whose folder holds the path as it was asked, most closely, or null. */
function projectOf(asked: string, deps: PlanDeps): Project | null {
    const held = new Map<string, Project>();
    for (const project of deps.projects()) {
        if (project.ghost) continue;
        try {
            const folder = folderOf(project, deps);
            const real = folder === null ? null : realPath(folder, true);
            if (real !== null) held.set(real, project);
        } catch {
            // A folder outside the hub is no project folder.
        }
    }
    const deepest = deepestHolding([...held.keys()], (one) => one, asked);
    return deepest === null ? null : (held.get(deepest.item) ?? null);
}

/**
 * The path as the request wrote it under its root's real folder, with no link followed. The project
 * is chosen from it, so a `code/` that links into another project or out of the hub is judged
 * against the project the script was asked under.
 */
function asked(roots: Root[], input: { root: string; path: string }): string {
    const dir = roots.find((one) => one.key === input.root)?.dir ?? '';
    return resolve(realPath(dir, true) ?? dir, input.path);
}

/** The files to send, from git's list: the code, without caches, results, logs or missing paths. */
function sentFiles(code: string, listed: string[]): { files: string[]; bytes: number } {
    let bytes = 0;
    const files = listed
        .filter((path) => {
            const parts = path.split('/');
            return (
                !parts.includes('__pycache__') &&
                !path.endsWith('.npy') &&
                parts[0] !== 'results' &&
                parts[0] !== 'logs'
            );
        })
        .filter((path) => {
            try {
                bytes += lstatSync(`${code}/${path}`).size;
                return true;
            } catch {
                return false;
            }
        })
        .sort();
    return { files, bytes };
}

/** The plan for the script `path` under the root `root`, or the one refusal, running nothing. */
async function compute(input: { root: string; path: string }, deps: PlanDeps): Promise<Computed> {
    const found = resolveRootPath(deps.roots(), input.root, input.path);
    if ('error' in found) return refuse('outside');
    const file = realPath(found.path, true);
    if (file === null || !file.toLowerCase().endsWith('.slurm') || !isFile(file)) {
        return refuse('not-slurm');
    }
    const project = projectOf(asked(deps.roots(), input), deps);
    if (project === null) return refuse('no-project');
    const folder = folderOf(project, deps);
    const home = folder === null ? null : realPath(folder, true);
    const code = home === null ? null : realPath(`${home}/code`, true);
    if (home === null || code === null || !inside(code, home) || !inside(file, code)) {
        return refuse('outside-code');
    }
    const cluster = clusterOf(project, deps.catalog());
    if ('status' in cluster) return cluster;
    const { host, missing } = deps.where();
    if (host === '') return refuse('no-host', missing);
    const listed = await deps.kept(code, deps.catalog());
    if (!listed.ok) return refuse('no-files', listed.error);
    const { files, bytes } = sentFiles(code, listed.value);
    const script = file.slice(code.length + 1);
    if (!files.includes(script)) return refuse('not-sent');
    const target = `${host}:${cluster.folder}/`;
    const plan: SubmitPlan = {
        root: input.root,
        path: input.path,
        project: project.id,
        host,
        source: `${code}/`,
        target,
        files: files.length,
        bytes,
        digest: createHash('sha256').update(files.join('\0')).digest('hex'),
        rsync: copyVector(target),
        remote: remoteOf(cluster.folder, script),
        scratch: await scratchRule(file, code, cluster.folder)
    };
    return { plan, files };
}

/** Whether the path is a file. */
function isFile(path: string): boolean {
    try {
        return lstatSync(path).isFile();
    } catch {
        return false;
    }
}

/** What Submit will do with the script `path` under `root`, or why it will not. */
export async function planSubmit(
    input: { root: string; path: string },
    deps: PlanDeps
): Promise<PlanAnswer> {
    const computed = await compute(input, deps);
    return 'plan' in computed ? { status: 'ok', plan: computed.plan } : computed;
}

/** The last line a program wrote, or the word for why it wrote none. */
function lastLine(stderr: string, fallback: string): string {
    const lines = stderr.split('\n').filter((line) => line.trim() !== '');
    return lines.length === 0 ? fallback : lines[lines.length - 1].trim();
}

/**
 * The one line that says why a copy failed: the first line ssh wrote (`ssh: connect to host ...`),
 * which names an unreachable host whatever rsync wrote after it, else the last line rsync wrote.
 */
function copyFailureLine(stderr: string, fallback: string): string {
    const ssh = stderr.split('\n').find((line) => line.startsWith('ssh:'));
    return ssh === undefined ? lastLine(stderr, fallback) : ssh.trim();
}

/**
 * Run the plan the reader confirmed: the copy, then `sbatch`, then the poll. `request.confirm` must
 * be the boolean `true`, and the plan computed again from the plan's own root and path must equal
 * the plan sent, or nothing runs. The job id is the first field of the first line `--parsable`
 * printed. One line goes to the server's console for each run.
 */
export async function runSubmit(
    request: { plan: { root: string; path: string; project?: unknown }; confirm: unknown },
    deps: SubmitDeps
): Promise<RunAnswer> {
    const answer = await attempt(request, deps);
    const project = typeof request.plan.project === 'string' ? request.plan.project : '-';
    const where = `${project} ${request.plan.path}`;
    deps.say(
        answer.status === 'ok'
            ? `hpc submit: ${where} job ${answer.job}`
            : `hpc submit: ${where} ${answer.reason}`
    );
    return answer;
}

/** Whether the state is closed now; read through a call, since it changes while a plan computes. */
function closedOf(deps: SubmitDeps): boolean {
    return deps.submits.closed;
}

/** The checks before the copy, the key held while it runs, and the run itself. */
async function attempt(
    request: { plan: { root: string; path: string }; confirm: unknown },
    deps: SubmitDeps
): Promise<RunAnswer> {
    if (request.confirm !== true) return refuse('unconfirmed');
    if (closedOf(deps)) return refuse('closed');
    const computed = await compute(request.plan, deps);
    if (!('plan' in computed)) return computed;
    if (!isDeepStrictEqual(computed.plan, request.plan)) return refuse('changed');
    // The plan took time; a state closed meanwhile starts nothing.
    if (closedOf(deps)) return refuse('closed');
    const { plan, files } = computed;
    const key = plan.target.slice(0, -1);
    if (deps.submits.running.has(key)) return refuse('busy');
    const controller = new AbortController();
    deps.submits.running.set(key, controller);
    try {
        return await execute(plan, files, controller.signal, deps);
    } finally {
        if (deps.submits.running.get(key) === controller) deps.submits.running.delete(key);
    }
}

/** The copy and the sbatch of one confirmed plan, under the signal of its run. */
async function execute(
    plan: SubmitPlan,
    files: string[],
    signal: AbortSignal,
    deps: SubmitDeps
): Promise<RunAnswer> {
    const copied = await deps.copy({ cwd: plan.source, vector: plan.rsync, files, signal });
    if (copied.code !== 0)
        return refuse('copy-failed', copyFailureLine(copied.stderr, `exit ${copied.code}`));
    if (signal.aborted) return refuse('submit-failed', 'aborted');
    let printed: string;
    try {
        const queued = await deps.ssh(plan.host, plan.remote, SUBMIT_TIMEOUT_MS, signal);
        if (queued.code !== 0) {
            return refuse('submit-failed', lastLine(queued.stderr, `exit ${queued.code}`));
        }
        printed = queued.stdout;
    } catch (error) {
        return refuse('submit-failed', error instanceof Error ? error.message : 'failed');
    }
    const first = printed.split('\n')[0] ?? '';
    const job = first.split(';')[0].trim();
    if (!validId(job)) return refuse('no-job-id', first);
    // The job is queued whatever the poll does; the next poll lists it.
    await deps.refresh().catch(() => undefined);
    return { status: 'ok', job };
}
