// Layer 2, server. The `git` channel: the read-only state of the hub root and of every workspace the
// `sessions` channel names, re-read when that root changes. DESIGN.md, "Watchers": git watches each
// workspace's .git and worktree and re-reads on change, no more often than every two seconds.
//
// The same watch answers a second question, on the `files` channel: which root a write just landed
// under. It is this watcher's because it already watches every root recursively and already
// throttles the burst a save makes, so no second watcher and no second throttle are needed.
//
// Which workspaces those are is the sessions payload's answer, and this watcher takes it from the
// hub rather than from the sessions watcher: it subscribes a sink of its own to the `sessions`
// channel, so the two watchers meet on the socket protocol and neither imports the other. A
// subscription is answered with the channel's current message, so a git watcher started after the
// first scan reads the workspaces immediately.
//
// The hub root is on the channel whether or not a session names it, since the deposit and the pin
// controls read the hub's own git state; the `always` option is what names it, and the root it names
// is opened before the first sessions message and never dropped for one.
//
// Two handles per workspace. `<root>/.git` non-recursively catches the index, HEAD and the refs,
// which is what a commit or a checkout moves; the worktree recursively catches an edit to a file.
// The worktree of a research hub holds build output and virtual environments whose writes say
// nothing about the working tree's state, so an event is dropped when any segment of its path is
// one of the ignored folders, and .git/objects is dropped with them: a pack being written is a
// second event for the index change that is already coming.

import { existsSync, watch } from 'node:fs';
import type { FSWatcher } from 'node:fs';
import { join } from 'node:path';
import { byKey } from '../../data/guards.ts';
import type { FilesPayload, GitPayload, Message, SessionsPayload } from '../../data/model.ts';
import type { Hub, Sink } from '../channels.ts';
import { statusFor, TIMEOUT_MS } from '../git.ts';
import type { Watcher } from './portfolio.ts';

/** Milliseconds one root is re-read at most once in. */
export const THROTTLE = 2000;

/** Path segments whose writes never change what git reports about the working tree. */
export const IGNORED = ['node_modules', '.svelte-kit', 'build', '__pycache__'];

/** What a clock's `setTimeout` gives back: a handle its own `clearTimeout` understands. */
export type Timer = ReturnType<typeof setTimeout> | number;

/**
 * The timer pair the throttle runs on. The window is wall-clock time, so a caller that has to know
 * when it closes passes its own pair and closes it itself.
 */
export type Clock = {
    setTimeout(run: () => void, ms: number): Timer;
    clearTimeout(timer: Timer): void;
};

/** The globals, which is what the server runs on. */
export const systemClock: Clock = {
    setTimeout: (run, ms) => setTimeout(run, ms),
    clearTimeout: (timer) => clearTimeout(timer)
};

export type GitWatchOptions = {
    /** Milliseconds one root is re-read at most once in. */
    throttle?: number;
    /** The timer pair the throttle runs on; the globals when absent. */
    clock?: Clock;
    /** Milliseconds one git command is given; server/git.ts's default when absent. */
    timeout?: number;
    /**
     * A root watched whether or not a session names it. The hub itself is one: the deposit and the
     * pin controls read the hub's own git state, and a hub nobody has a session in would otherwise
     * show the state it had when the page opened.
     */
    always?: string;
};

/**
 * Whether an event is one of ours: outside .git/objects, outside every ignored folder, and not a
 * lock file inside .git.
 *
 * The lock is the one that matters. The module's own reads run without optional locks and write
 * none, but another git process in the same repository (the owner's commit, an editor) takes
 * .git/index.lock and renames it away again, and without this line each of those would schedule a
 * read. A real index change announces itself with an event on .git/index, which is not filtered.
 */
export function relevant(filename: string | null): boolean {
    if (filename === null || filename === '') return false;
    const parts = filename.split(/[/\\]/);
    if (parts.some((part) => IGNORED.includes(part))) return false;
    if (parts[0] !== '.git') return true;
    if (parts[1] === 'objects') return false;
    return !parts[parts.length - 1].endsWith('.lock');
}

/** The workspace roots a sessions payload names, without the unknown workspace's empty key. */
export function rootsOf(payload: SessionsPayload): string[] {
    const roots: string[] = [];
    if (!Array.isArray(payload.workspaces)) return roots;
    for (const workspace of payload.workspaces) {
        const key = workspace.key;
        if (typeof key === 'string' && key !== '' && !roots.includes(key)) roots.push(key);
    }
    return roots;
}

function reason(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
}

/**
 * Watch the workspaces the `sessions` channel names and publish on the `git` channel. A root that
 * stops being named is unwatched and drops out of the payload; a root that cannot be watched still
 * gets its state read once, since server/git.ts answers for a directory that is not a repository.
 */
/** A git watcher: a portfolio watcher that can also be told to re-read one root at once. */
export type GitWatcher = Watcher & {
    /** Re-read one root now, for a write that has just changed it. */
    refresh(root: string): void;
};

export function watchGit(hub: Hub, options: GitWatchOptions = {}): GitWatcher {
    const throttle = options.throttle ?? THROTTLE;
    const clock = options.clock ?? systemClock;
    const timeout = options.timeout ?? TIMEOUT_MS;
    const always = options.always ?? '';
    const handles = new Map<string, FSWatcher[]>();
    const timers = new Map<string, Timer>();
    const last = new Map<string, number>();
    let state: GitPayload = {};
    let closed = false;

    /** Publish a copy, so a later re-read cannot change a payload already on the wire. */
    const publish = (): void => {
        hub.publish('git', { ...state });
    };

    // A write inside a worktree often leaves git's answer exactly as it was: saving a file that was
    // already modified, or a build touching an ignored path the filter did not name. The `git`
    // channel carries state, not events, so an unchanged state is not published.
    //
    // The `files` channel carries the event instead, and every re-read publishes one: a re-read is a
    // write that landed under this root, and the file listings taken under it are stale whether or
    // not git's answer moved. Nothing else on the wire says so for a file inside a project folder.
    const reread = (root: string): void => {
        if (closed || !handles.has(root)) return;
        hub.publish('files', { root } satisfies FilesPayload);
        try {
            const next = byKey(statusFor([root], timeout), root);
            if (next === undefined) return;
            const held = byKey(state, root);
            if (held !== undefined && JSON.stringify(held) === JSON.stringify(next)) return;
            state[root] = next;
            publish();
        } catch (error) {
            console.error(`git watch: reading ${root} failed: ${reason(error)}`);
        }
    };

    /**
     * A trailing-edge throttle, per root: the first event after a quiet period is read at once, and
     * every event inside the next two seconds collapses into one read at the end of that window.
     */
    const touch = (root: string): void => {
        if (closed || timers.has(root)) return;
        const since = Date.now() - (last.get(root) ?? 0);
        const wait = since >= throttle ? 0 : throttle - since;
        timers.set(
            root,
            clock.setTimeout(() => {
                timers.delete(root);
                last.set(root, Date.now());
                reread(root);
            }, wait)
        );
    };

    const open = (root: string): void => {
        const opened: FSWatcher[] = [];
        // A session's workspace that has since been deleted is still a root the payload names. There
        // is nothing to watch and nothing to say about it: its state is the empty shape statusFor
        // gives a directory that is not a repository, read once below, and no error is logged.
        if (!existsSync(root)) {
            handles.set(root, opened);
            return;
        }
        // The .git of a git worktree is a file, not a directory; fs.watch takes either. Its events
        // name a path inside .git, so the prefix is added back before the filter reads it, and the
        // one filter then covers both handles.
        const targets: [string, boolean, string][] = [
            [join(root, '.git'), false, '.git/'],
            [root, true, '']
        ];
        for (const [target, recursive, prefix] of targets) {
            // A workspace directory that holds no `.git` is an ordinary folder, not a failure: its
            // state is the empty shape statusFor gives a directory that is not a repository, and a
            // line per start saying so is noise. Only a target that is there and still refuses the
            // watch is worth saying.
            if (!existsSync(target)) continue;
            try {
                opened.push(
                    watch(target, { recursive }, (_event, filename) => {
                        const name = typeof filename === 'string' ? filename : null;
                        if (relevant(name === null ? null : prefix + name)) touch(root);
                    })
                );
            } catch (error) {
                console.error(`git watch: cannot watch ${target}: ${reason(error)}`);
            }
        }
        handles.set(root, opened);
    };

    const drop = (root: string): void => {
        for (const handle of handles.get(root) ?? []) handle.close();
        handles.delete(root);
        const timer = timers.get(root);
        if (timer !== undefined) clock.clearTimeout(timer);
        timers.delete(root);
        last.delete(root);
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete -- a Map here would change the shape every reader of this record depends on
        delete state[root];
    };

    /** The roots of the newest sessions payload: open what is new, drop what is gone, read once. */
    const follow = (named: string[]): void => {
        if (closed) return;
        const roots = always === '' ? named : [always, ...named.filter((one) => one !== always)];
        let changed = false;
        for (const root of [...handles.keys()]) {
            if (roots.includes(root)) continue;
            drop(root);
            changed = true;
        }
        const fresh = roots.filter((root) => !handles.has(root));
        for (const root of fresh) open(root);
        if (fresh.length > 0) {
            try {
                const found = statusFor(fresh, timeout);
                for (const root of fresh) {
                    const one = byKey(found, root);
                    if (one !== undefined) state[root] = one;
                    last.set(root, Date.now());
                }
                changed = true;
            } catch (error) {
                console.error(`git watch: first read failed: ${reason(error)}`);
            }
        }
        if (changed) publish();
    };

    // The sink is this watcher's own end of the `sessions` channel. It sends nothing back and is
    // never closed by the hub, so `close` below is what removes it.
    const sink: Sink = {
        send: (text: string) => {
            try {
                const message = JSON.parse(text) as Message;
                if (message.channel === 'sessions') {
                    follow(rootsOf(message.payload as SessionsPayload));
                }
            } catch (error) {
                console.error(`git watch: unreadable sessions message: ${reason(error)}`);
            }
            return Promise.resolve();
        },
        close: () => {
            // The probe holds no handle, so closing it frees nothing.
        }
    };
    // The always-watched root is opened before the first sessions message, so a hub nobody has a
    // session in is on the channel from the start.
    if (always !== '') follow([]);
    hub.subscribe(sink, ['sessions']);

    return {
        refresh(root: string): void {
            reread(root);
        },
        close(): void {
            closed = true;
            hub.remove(sink);
            for (const root of [...handles.keys()]) drop(root);
            state = {};
        }
    };
}
