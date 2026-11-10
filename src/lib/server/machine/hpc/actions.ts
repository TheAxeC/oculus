// Layer 2, server. Explicit Live HPC actions, each on the connection of the cluster the job's row
// came from. IDs, remembered log paths and the folders of `slurm.log_dirs` are validated before
// any of them can enter a remote command.
import { FORM_PATTERNS } from '../../../data/sources/config/catalog/value-rule.ts';
import { run, type Connection, type Runner } from './ssh.ts';

export const JOB_ID = /^\d+(_\d+)?(\.\w+)?$/;
export const SAFE_PATH = /^\/[^'"\\\s][^'"\\\n]*$/;
/**
 * The log path found per job id on one cluster, kept by the owning server context so the search
 * runs once per job.
 */
export type LogPaths = Map<string, string>;

/**
 * The remembered log paths of every cluster, by the cluster's key: a job id names one job on one
 * cluster only, so a log of job 123 on one cluster never reads the path found for 123 on another.
 */
export type ClusterLogPaths = Map<string, LogPaths>;

/** The remembered log paths of one cluster, made empty the first time the cluster is asked for. */
export function logPathsOf(all: ClusterLogPaths, resource: string): LogPaths {
    const held = all.get(resource);
    if (held !== undefined) return held;
    const made: LogPaths = new Map();
    all.set(resource, made);
    return made;
}
const PATH = '@@oculus:logpath=';
const TIMEOUT = '@@oculus:logtimeout@@';

/**
 * Milliseconds the log search is given. The search inside it is bounded by its own `timeout 20`,
 * and what is left is one scontrol, one sacct and a tail, so a call that has not answered in five
 * seconds more than the inner bound is a login node that is not answering rather than a search
 * still running. The page waits this long the first time it opens a job's log.
 */
const LOG_TIMEOUT_MS = 25000;

/** Milliseconds a scancel is given: one command that either runs or does not. */
const CANCEL_TIMEOUT_MS = 20000;

export function validId(id: string): boolean {
    return JOB_ID.test(id);
}

/**
 * One rung of the search for a finished job's log under its working folder: a folder pattern of
 * `slurm.log_dirs` whose files are matched by the job id in their name, or, for the entry `.`, the
 * working folder itself with Slurm's own `slurm-<id>.out` and then any `.out` file with the id.
 */
export type LogRung = { kind: 'folder'; dir: string } | { kind: 'slurm' } | { kind: 'out' };

/**
 * The rungs of `slurm.log_dirs` in order. An entry the setting's form refuses is left out here too,
 * since a folder pattern is written into a remote shell's command unquoted, so that it expands.
 */
export function logRungs(dirs: readonly string[]): LogRung[] {
    return dirs.flatMap((dir): LogRung[] => {
        if (dir === '.') return [{ kind: 'slurm' }, { kind: 'out' }];
        return FORM_PATTERNS.folder_glob.test(dir) ? [{ kind: 'folder', dir }] : [];
    });
}

/** The glob of one rung for one job, in the remote shell whose `wd` and `jid` name them. */
function rungGlob(rung: LogRung): string {
    if (rung.kind === 'slurm') return '"$wd"/slurm-"$jid".out';
    if (rung.kind === 'out') return '"$wd"/*"$jid"*.out';
    return `"$wd"/${rung.dir}/*"$jid"*`;
}

/**
 * The remote search of the working folder, run under `timeout 20` with the working folder and the
 * job id as its two arguments: the newest file of the first rung that holds one, or the empty line.
 */
function searchCommand(rungs: readonly LogRung[]): string {
    const tried = rungs.map(
        (rung) => `[ -z "$p" ] && p=$(ls -t ${rungGlob(rung)} 2>/dev/null | head -1); `
    );
    return `timeout 20 sh -c 'wd=$1; jid=$2; p=""; ${tried.join('')}echo "$p"' _ "$wd" "$jid"`;
}

export function safePath(path: string): string {
    const value = path.trim();
    return SAFE_PATH.test(value) ? value : '';
}

export async function cancel(
    connection: Connection,
    id: string,
    runner: Runner = run
): Promise<{ status: string; hint?: string }> {
    if (!validId(id)) return { status: 'error', hint: 'invalid job id' };
    const result = await runner(connection, `scancel ${id}`, CANCEL_TIMEOUT_MS);
    return result.code === 0
        ? { status: 'ok' }
        : { status: 'error', hint: result.stderr.trim() || 'scancel failed' };
}

/**
 * The log of one job: the path remembered for it, else the StdOut Slurm still holds, else the
 * search of its working folder by the rungs of `slurm.log_dirs` (`logDirs`), and its last 200
 * lines.
 */
export async function log(
    connection: Connection,
    id: string,
    paths: LogPaths,
    logDirs: readonly string[],
    runner: Runner = run
): Promise<{ status: string; log: string; path: string }> {
    if (!validId(id)) return { status: 'error', log: '', path: '' };
    const held = safePath(paths.get(id) ?? '');
    const search = searchCommand(logRungs(logDirs));
    const remote = `jid=${id}; p='${held}'; tmo=0; [ -n "$p" ] && [ ! -f "$p" ] && p=""; if [ -z "$p" ]; then p=$(scontrol show job "$jid" 2>/dev/null | tr " " "\\n" | sed -n "s/^StdOut=//p" | head -1); [ -n "$p" ] && [ ! -f "$p" ] && p=""; fi; if [ -z "$p" ]; then wd=$(sacct -X -j "$jid" -o WorkDir%600 -Pn 2>/dev/null | head -1); if [ -n "$wd" ]; then p=$(${search}); [ $? = 124 ] && tmo=1; fi; fi; if [ -n "$p" ] && [ -f "$p" ]; then echo "${PATH}$p"; tail -n 200 "$p"; elif [ "$tmo" = 1 ]; then echo "${TIMEOUT}"; fi`;
    try {
        const result = await runner(connection, remote, LOG_TIMEOUT_MS);
        const lines = result.stdout.split('\n');
        const path = safePath(
            lines.find((line) => line.startsWith(PATH))?.slice(PATH.length) ?? ''
        );
        if (path) paths.set(id, path);
        if (lines.includes(TIMEOUT)) return { status: 'timeout', log: '', path: '' };
        return {
            status: result.code === 0 ? 'ok' : 'error',
            path,
            log: lines
                .filter((line) => !line.startsWith(PATH))
                .join('\n')
                .trim()
        };
    } catch (error) {
        return {
            status:
                error instanceof Error && error.message.includes('timeout') ? 'timeout' : 'error',
            log: '',
            path: ''
        };
    }
}
