// Layer 2, server. The automatic fetch: while `git.autofetch_minutes` of the merged config is
// above 0, every repository on the `git` channel that has a remote is fetched (`git fetch
// --prune`) once each period, one after the other. It owns no channel and no file handle; it looks
// at the `config` and `git` channels once a minute and acts on what they hold then.
//
// The key is read from the `config` channel at every look and again before each repository, so a
// change saved in the Settings view takes effect within a minute with no restart, and a key turned
// to 0 stops a round between two repositories. A value the options catalog's rule refuses is read
// as the entry's default, 0, and is a finding (settingFindings); a catalog with no rule for the key
// stops the fetching and is said once on standard error until the key reads again. A configuration
// whose merge dropped behavior.yml keeps the minutes last read.
//
// Each look arms the next one before it works, so looks go on while a round runs; a look that finds
// a round running does nothing. A round starts when the period has passed since the last one
// started. A repository has a remote when `git remote` names one, which the `git` channel's own
// `remotes` list cannot say (it is filled only for a branch with no upstream). Roots that are
// worktrees of one repository, or folders inside it, are one repository: they are grouped by the
// first path of the state's `worktrees` list and only the first root of each group is fetched.
//
// The fetch is unattended: git is told never to ask for a user name or password, and ssh is run
// with `-o BatchMode=yes` appended to the command git would have used, which is the environment's
// `GIT_SSH_COMMAND`, else the repository's `core.sshCommand`, else `ssh`. A repository that still
// needs a person fails, is said on standard error, and is tried again the next period. When the
// older `GIT_SSH` program is the only ssh setting, nothing is added for ssh.
//
// A fetch that fails is also kept for the root's state as `fetchFailure`, told apart by the hub's
// `connections.failures` (core/git/state.ts, `fetchFailureOf`), and a fetch that succeeds clears
// it, before the root's state is read again.
//
// This module runs no process of its own. It calls `remoteNames`, `fetchIn` and the one read
// `sshCommand`, the call sites that server/git/git-write.ts and server/core/git/run.ts own, and it
// takes the repositories to fetch from the published `git` payload, which is the rule that
// git-write.ts states for a write's root.

import { z } from 'zod';
import type { GitFetchFailure } from '../../../data/model/index.ts';
import {
    autofetchMin,
    droppedFile,
    failureRows,
    textCatalog,
    type FailureRow
} from '../../../data/sources/config.ts';
import { mapShape, readAs } from '../../../data/shapes/shapes.ts';
import type { Hub } from '../../core/channels.ts';
import { systemClock, type Clock, type Timer } from '../../core/files/file-poll.ts';
import type { GitCredentials } from '../../core/git/credentials.ts';
import { failureLine } from '../../core/git/failure.ts';
import { sshCommand } from '../../core/git/reads.ts';
import { fetchFailureOf, type FetchFailures } from '../../core/git/state.ts';
import { failed, fetchIn, remoteNames, type GitAt } from '../../git/git-write.ts';

/** Milliseconds between two looks. Fixed: the period itself is the key's. */
export const TICK = 60000;

const MINUTE = 60000;

/** What a remote listing and a fetch answer. */
type Answer = Awaited<ReturnType<typeof fetchIn>>;

export type AutofetchOptions = {
    /** The timer pair the looks run on; the globals when absent. */
    clock?: Clock;
    /** The current time in milliseconds; `Date.now` when absent. */
    now?: () => number;
    /** Milliseconds between two looks. */
    tick?: number;
    /**
     * Re-read one root's git state at once, after a fetch has changed its refs; settles when done.
     */
    refresh: (root: string) => Promise<void>;
    /** The remotes of a repository, one name a line; `git remote` when absent. */
    remotes?: (root: string) => Promise<Answer>;
    /** The fetch of a repository; an unattended `git fetch --prune` when absent. */
    fetch?: (root: string) => Promise<Answer>;
    /**
     * Where a fetch's outcome is kept for the root's state: a failure set, told apart by the hub's
     * `connections.failures` as the newest `config` message holds them, and a success cleared.
     */
    failures?: FetchFailures;
    /** Where a line of the module's own is said; standard error when absent. */
    log?: (line: string) => void;
    /** The server context's git credentials, which the default listing and fetch run git with. */
    credentials: GitCredentials;
};

export type AutofetchWatcher = { close(): void };

/** The part of a `config` payload this module reads. */
const configShape = z.object({
    config: z.unknown(),
    findings: z.array(z.object({ file: z.string(), key: z.string() })).catch([])
});

/** The `git` payload as a map from root to state, and the part of a state this module reads. */
const payloadShape = z.record(z.string(), z.unknown());
const stateShape = z.object({
    repository: z.boolean(),
    worktrees: z.array(z.object({ path: z.string() })).optional()
});

/** Why a failed `core.sshCommand` read says no more: the read answers only that it failed. */
const UNREADABLE = 'git timed out, did not run or exited with an error';

/**
 * The ssh command an unattended fetch runs with: the command git would have used with BatchMode
 * appended, so ssh asks for nothing. The environment's command comes first, then the repository's
 * `core.sshCommand`, then `ssh`, as git itself orders them; with none of the first two and the
 * older `GIT_SSH` set, git runs that program, which takes no options, so nothing is answered.
 */
export function unattendedSsh(env: NodeJS.ProcessEnv, configured: string): string | undefined {
    const named = env.GIT_SSH_COMMAND ?? '';
    const base = named !== '' ? named : configured;
    if (base !== '') return `${base} -o BatchMode=yes`;
    if ((env.GIT_SSH ?? '') !== '') return undefined;
    return 'ssh -o BatchMode=yes';
}

function reason(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
}

/** Whether a `git remote` answer names at least one remote. */
function hasRemote(output: string): boolean {
    return output.split('\n').some((line) => line.trim() !== '');
}

/**
 * The default fetch: unattended, with the ssh command from `unattendedSsh`. The repository's
 * `core.sshCommand` is read only when the environment names no `GIT_SSH_COMMAND`, which comes first
 * in git's order. A read that fails skips the repository, so a fetch never runs with the command
 * the repository names left out, and the answer says so without a refresh.
 */
async function unattendedFetch(at: GitAt): Promise<Answer> {
    const named = (process.env.GIT_SSH_COMMAND ?? '') !== '';
    const configured = named ? '' : await sshCommand(at.credentials, at.root);
    if (configured === null) throw new Error(`core.sshCommand could not be read: ${UNREADABLE}`);
    return fetchIn(at, {
        unattended: true,
        sshCommand: unattendedSsh(process.env, configured)
    });
}

export function watchAutofetch(hub: Hub, options: AutofetchOptions): AutofetchWatcher {
    const clock = options.clock ?? systemClock;
    const now = options.now ?? Date.now;
    const tick = options.tick ?? TICK;
    const { credentials } = options;
    const remotes = options.remotes ?? ((root: string) => remoteNames({ root, credentials }));
    const fetch = options.fetch ?? ((root: string) => unattendedFetch({ root, credentials }));
    const log = options.log ?? ((line: string) => console.error(line));
    let timer: Timer | null = null;
    let closed = false;
    /** Whether `close` was called, read through a call so a check before an await is not reused. */
    const stopped = (): boolean => closed;
    let running = false;
    let lastStart: number | null = null;
    let said = false;
    /** The minutes last read, which a message whose merge dropped behavior.yml leaves in force. */
    let lastMinutes: number | undefined;

    /**
     * The minutes the newest `config` message holds, the key's default when its value is refused:
     * undefined before any message, null for a catalog with no rule for the key (said once until
     * the key reads again).
     */
    function minutes(): number | null | undefined {
        const message = hub.latest('config');
        if (message === undefined) return undefined;
        const shaped = configShape.safeParse(message.payload);
        const config = shaped.success ? readAs(mapShape, shaped.data.config) : null;
        if (
            shaped.success &&
            lastMinutes !== undefined &&
            droppedFile(shaped.data.findings, 'behavior.yml')
        ) {
            return lastMinutes;
        }
        let held: number | null = null;
        let why = 'the configuration is not a map';
        if (config !== null) {
            try {
                held = autofetchMin(config);
            } catch (error) {
                why = reason(error);
            }
        }
        if (held === null) {
            if (!said) log(`autofetch: ${why}; nothing is fetched`);
            said = true;
        } else {
            said = false;
            lastMinutes = held;
        }
        return held;
    }

    /** The first root of each repository the newest `git` payload names, in the payload's order. */
    function repositories(): string[] {
        const message = hub.latest('git');
        if (message === undefined) return [];
        const payload = payloadShape.safeParse(message.payload);
        if (!payload.success) return [];
        const groups = new Set<string>();
        const roots: string[] = [];
        for (const [root, value] of Object.entries(payload.data)) {
            const state = stateShape.safeParse(value);
            if (!state.success || !state.data.repository) continue;
            const group = state.data.worktrees?.[0]?.path ?? root;
            if (groups.has(group)) continue;
            groups.add(group);
            roots.push(root);
        }
        return roots;
    }

    /**
     * A failed fetch as the root's state carries it: told apart by the hub's
     * `connections.failures`, else said by git's reason, a fetch that ended with no reason of git's
     * own worded from the text catalog, each as the newest `config` message holds them.
     */
    function failureOf(fetched: Answer): GitFetchFailure {
        const shaped = configShape.safeParse(hub.latest('config')?.payload);
        const config = shaped.success ? readAs(mapShape, shaped.data.config) : null;
        let rows: FailureRow[] = [];
        let said = fetched.error;
        if (config !== null) {
            try {
                rows = failureRows(config);
                if (fetched.failure !== undefined) {
                    said = failureLine(fetched.failure, textCatalog(config));
                }
            } catch (error) {
                log(`autofetch: ${reason(error)}`);
            }
        }
        return fetchFailureOf(fetched.stderr ?? '', said, rows, new Date(now()));
    }

    /**
     * One repository: its remotes, then one fetch if it has any, its outcome kept for the root's
     * state, then a re-read of that state. A fetch that throws before git answers is a failed one.
     */
    async function visit(root: string): Promise<void> {
        try {
            const listed = await remotes(root);
            if (stopped()) return;
            if (!listed.ok) {
                log(`autofetch: ${root}: ${listed.error}`);
                return;
            }
            if (!hasRemote(listed.output)) return;
            const fetched = await fetch(root).catch((error: unknown) => failed(reason(error)));
            if (stopped()) return;
            if (fetched.ok) options.failures?.clear(root);
            else {
                log(`autofetch: ${root}: ${fetched.error}`);
                options.failures?.set(root, failureOf(fetched));
            }
            await options.refresh(root);
        } catch (error) {
            if (!stopped()) log(`autofetch: ${root}: ${reason(error)}`);
        }
    }

    async function round(at: number): Promise<void> {
        const roots = repositories();
        if (roots.length === 0) return;
        lastStart = at;
        for (const root of roots) {
            if (stopped()) return;
            const minutesNow = minutes();
            if (minutesNow === undefined || minutesNow === null || minutesNow === 0) return;
            await visit(root);
        }
    }

    function look(): void {
        if (stopped()) return;
        timer = clock.setTimeout(look, tick);
        const period = minutes();
        if (period === undefined || period === null || period === 0 || running) return;
        const at = now();
        if (lastStart !== null && at - lastStart < period * MINUTE) return;
        running = true;
        void round(at)
            .catch((error: unknown) => log(`autofetch: ${reason(error)}`))
            .finally(() => {
                running = false;
            });
    }

    timer = clock.setTimeout(look, tick);

    return {
        close(): void {
            closed = true;
            if (timer !== null) clock.clearTimeout(timer);
            timer = null;
        }
    };
}
