// Layer 2, server. The git writes in flight, one per root, so Cancel can end the one a root is
// running. A registry is built once per server (server/root/context.ts) and handed to the git and
// deposit routes; it holds no state of its own beyond the runs it lists, and none at module level.
//
// `begin` registers a run and answers the signal its commands hand to `endWith`; `end` takes the
// run off when the write has answered; `cancel` aborts the run a key has. A run that begins while
// another is registered for the same key is not registered: the page refuses a second write on a
// busy root, and the registry keeps the first, so Cancel always reaches the run that was begun
// first. Such a second run is answered a signal nothing can abort. A command ended by Cancel, by
// its time limit or by its output limit ends the processes it started below git (a hook, the ssh
// of a fetch) and leaves git to end on its own (`endWith`), so a hook does not outlive the command
// and a merge cancelled during its hook is left in progress with its MERGE_HEAD.

import { execFileSync, type ChildProcess } from 'node:child_process';
import { basename } from 'node:path';

/** The runs in flight, by the root (git) or the mirror (deposit) each is about. */
export type RunningGit = {
    /** Register a run of `key` and answer the signal its commands hand to `endWith`. */
    begin: (key: string) => AbortSignal;
    /** Take the run `begin` answered this signal for off the list, if it is the one registered. */
    end: (key: string, signal: AbortSignal) => void;
    /** Abort the run of `key`. Answers whether a run was in flight to abort. */
    cancel: (key: string) => boolean;
};

/** A registry with no run in flight. */
export function createRunningGit(): RunningGit {
    const runs = new Map<string, AbortController>();
    return {
        begin(key) {
            if (runs.has(key)) return new AbortController().signal;
            const run = new AbortController();
            runs.set(key, run);
            return run.signal;
        },
        end(key, signal) {
            if (runs.get(key)?.signal === signal) runs.delete(key);
        },
        cancel(key) {
            const run = runs.get(key);
            if (run === undefined) return false;
            run.abort();
            return true;
        }
    };
}

/** How long a process asked to end is given before it is sent SIGKILL. */
const GRACE_MS = 2000;

/** The error a command ended by Cancel answers, which `classifyFailure` reads as `cancelled`. */
function cancelled(): Error {
    return Object.assign(new Error('cancelled'), { name: 'AbortError', code: 'ABORT_ERR' });
}

/**
 * Make a kill of `child` (Cancel, its time limit, its output limit) end the processes it started
 * and leave git to end on its own, and end `child` that way when `signal` aborts. Answers the
 * error the command's answer classifies: the one `execFile` gave, or `cancelled` when Cancel ended
 * the command.
 *
 * A merge whose pre-merge-commit hook is running already holds the merge's result in the index,
 * and git writes MERGE_HEAD only once the hook has failed. So a kill signals the processes below
 * git's own (a hook, the ssh of a fetch), passing over the git processes between them (the merge
 * a pull runs), and git, seeing its hook fail, writes the merge state and exits; a git signalled
 * itself there would leave the result with no merge in progress. A process still running
 * `GRACE_MS` later is sent SIGKILL, and `child` is signalled itself when nothing below it is left.
 * A command that started nothing is signalled at once.
 *
 * Cancel is listened for here rather than handed to `execFile` as its `signal`: on an abort
 * `execFile` answers at once and closes the command's pipes, so git would die of SIGPIPE writing
 * its reason, before it writes the merge state, and the answer would read the repository while git
 * still runs. Handled here, the answer comes when git has exited.
 */
export function endWith(
    child: ChildProcess,
    signal?: AbortSignal
): (error: Error | null) => Error | null {
    const kill = child.kill.bind(child);
    child.kill = (sent) => {
        if (endBelow(child.pid, 'SIGTERM') === 0) return kill(sent);
        const late = setInterval(() => {
            if (endBelow(child.pid, 'SIGKILL') === 0) kill(sent);
        }, GRACE_MS);
        late.unref();
        child.once('exit', () => clearInterval(late));
        return true;
    };
    const cancel = (): void => void child.kill();
    if (signal?.aborted === true) cancel();
    else signal?.addEventListener('abort', cancel, { once: true });
    child.once('exit', () => signal?.removeEventListener('abort', cancel));
    return (error) => (error !== null && signal?.aborted === true ? cancelled() : error);
}

/**
 * Signal the processes below `root` that are not git, each with every process below it, passing
 * over the git processes on the way, as the process table holds them at this moment. Answers how
 * many were signalled; none when the table cannot be read.
 */
function endBelow(root: number | undefined, sent: NodeJS.Signals): number {
    if (root === undefined) return 0;
    let table: string;
    try {
        table = execFileSync('ps', ['-A', '-o', 'pid=', '-o', 'ppid=', '-o', 'comm='], {
            encoding: 'utf8'
        });
    } catch {
        return 0;
    }
    const children = new Map<number, number[]>();
    const names = new Map<number, string>();
    for (const row of table.split('\n')) {
        const found = /^\s*(\d+)\s+(\d+)\s+(.*)$/.exec(row);
        if (found === null) continue;
        const [pid, parent] = [Number(found[1]), Number(found[2])];
        children.set(parent, [...(children.get(parent) ?? []), pid]);
        names.set(pid, basename(found[3].trim()));
    }
    const ending: number[] = [];
    const below = (pid: number): number[] => children.get(pid) ?? [];
    for (let next = below(root); next.length > 0;) {
        const gits = next.filter((pid) => names.get(pid) === 'git');
        for (let tree = next.filter((pid) => names.get(pid) !== 'git'); tree.length > 0;) {
            ending.push(...tree);
            tree = tree.flatMap(below);
        }
        next = gits.flatMap(below);
    }
    for (const pid of ending) {
        try {
            process.kill(pid, sent);
        } catch {
            // The process has already ended.
        }
    }
    return ending.length;
}
