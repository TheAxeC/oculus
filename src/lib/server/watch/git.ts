// Layer 2, server. The `git` channel: the read-only state of every workspace the `sessions` channel
// names, re-read when that workspace changes. DESIGN.md, "Watchers": git watches each workspace's
// .git and worktree and re-reads on change, no more often than every two seconds.
//
// Which workspaces those are is the sessions payload's answer, and this watcher takes it from the
// hub rather than from the sessions watcher: it subscribes a sink of its own to the `sessions`
// channel, so the two watchers meet on the socket protocol and neither imports the other. A
// subscription is answered with the channel's current message, so a git watcher started after the
// first scan reads the workspaces immediately.
//
// Two handles per workspace. `<root>/.git` non-recursively catches the index, HEAD and the refs,
// which is what a commit or a checkout moves; the worktree recursively catches an edit to a file.
// The worktree of a research hub holds build output and virtual environments whose writes say
// nothing about the working tree's state, so an event is dropped when any segment of its path is
// one of the ignored folders, and .git/objects is dropped with them: a pack being written is a
// second event for the index change that is already coming.

import { watch } from 'node:fs';
import type { FSWatcher } from 'node:fs';
import { join } from 'node:path';
import type { GitPayload, Message, SessionsPayload } from '../../data/model.ts';
import type { Hub, Sink } from '../channels.ts';
import { statusFor, TIMEOUT_MS } from '../git.ts';
import type { Watcher } from './portfolio.ts';

/** Milliseconds one root is re-read at most once in. */
export const THROTTLE = 2000;

/** Path segments whose writes never change what git reports about the working tree. */
export const IGNORED = ['node_modules', '.svelte-kit', 'build', '__pycache__'];

export type GitWatchOptions = {
    /** Milliseconds one root is re-read at most once in. */
    throttle?: number;
    /** Milliseconds one git command is given; server/git.ts's default when absent. */
    timeout?: number;
};

/**
 * Whether an event is one of ours: outside .git/objects, outside every ignored folder, and not a
 * lock file inside .git.
 *
 * The lock is the one that matters. `git status` takes .git/index.lock every single time it runs,
 * and renames it away again, whether or not it changed anything. Without this line the watcher feeds
 * itself: a read makes a lock, the lock is an event, the event schedules a read, and every workspace
 * runs two git processes every two seconds for as long as the server is up. A real index change
 * announces itself with an event on .git/index, which is not filtered.
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
    if (!Array.isArray(payload?.workspaces)) return roots;
    for (const workspace of payload.workspaces) {
        const key = workspace?.key;
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
export function watchGit(hub: Hub, options: GitWatchOptions = {}): Watcher {
    const throttle = options.throttle ?? THROTTLE;
    const timeout = options.timeout ?? TIMEOUT_MS;
    const handles = new Map<string, FSWatcher[]>();
    const timers = new Map<string, ReturnType<typeof setTimeout>>();
    const last = new Map<string, number>();
    let state: GitPayload = {};
    let closed = false;

    /** Publish a copy, so a later re-read cannot change a payload already on the wire. */
    const publish = (): void => {
        hub.publish('git', { ...state });
    };

    // A write inside a worktree often leaves git's answer exactly as it was: saving a file that was
    // already modified, or a build touching an ignored path the filter did not name. The channel
    // carries state, not events, so an unchanged state is not published.
    const reread = (root: string): void => {
        if (closed || !handles.has(root)) return;
        try {
            const next = statusFor([root], timeout)[root];
            if (next === undefined) return;
            const held = state[root];
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
            setTimeout(() => {
                timers.delete(root);
                last.set(root, Date.now());
                reread(root);
            }, wait)
        );
    };

    const open = (root: string): void => {
        const opened: FSWatcher[] = [];
        // The .git of a git worktree is a file, not a directory; fs.watch takes either. Its events
        // name a path inside .git, so the prefix is added back before the filter reads it, and the
        // one filter then covers both handles.
        const targets: [string, boolean, string][] = [
            [join(root, '.git'), false, '.git/'],
            [root, true, '']
        ];
        for (const [target, recursive, prefix] of targets) {
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
        if (timer !== undefined) clearTimeout(timer);
        timers.delete(root);
        last.delete(root);
        delete state[root];
    };

    /** The roots of the newest sessions payload: open what is new, drop what is gone, read once. */
    const follow = (roots: string[]): void => {
        if (closed) return;
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
                    if (found[root] !== undefined) state[root] = found[root];
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
        close: () => {}
    };
    hub.subscribe(sink, ['sessions']);

    return {
        close(): void {
            closed = true;
            hub.remove(sink);
            for (const root of [...handles.keys()]) drop(root);
            state = {};
        }
    };
}
