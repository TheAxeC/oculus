// Layer 2, server. The `git` channel: the read-only state of every root the file browser knows and
// of every workspace the `sessions` channel names, re-read when that root changes.
// It watches each workspace's .git and worktree and re-reads on change, no more often
// than every two seconds.
//
// The file browser's roots are the second source because the Repositories view lists every
// repository the reader has told oculus about, not only the ones an agent happens to be working in.
// A session's workspace is read too, for the Changes of its session detail, and is told apart from
// the rest by `inWorkspace` in its state: the roots of the workspace (the file browser's roots, the
// repositories below them, the cloned folders and the always-watched root) carry it true, a root
// only a session names carries it false, and the list of repositories holds the first kind alone.
// They are read through the `roots` option at start, again on a `config` push, which is what says
// the folders of the workspace moved, and again whenever the open workspace moves (the `follow`
// option), which is the way a folder is added while the server runs. The text catalog a failed read
// is worded from and the depth the repositories are looked for at are read with them.
//
// The open workspace's own poll (workspace/follow.ts) tells this watcher of a move, so a folder the
// page adds just as the server starts is seen at the next tick. A root that could not be watched
// (missing at its first watch, or one the watch refused) is tried again at each move and each
// config push, so a root that appears later is watched from then on.
//
// Which workspaces those are is the sessions payload's answer, and this watcher takes it from the
// hub rather than from the sessions watcher: it subscribes a sink of its own to the `sessions` and
// `config` channels, so the watchers meet on the socket protocol and none imports another. A
// subscription is answered with the channel's current message, so a git watcher started after the
// first scan reads the workspaces immediately.
//
// A configured root holds repositories below it as well as, when it is one, itself (a `~/workspace`
// of clones, a monorepo with repositories inside). Every folder down to `repository_scan_depth`
// levels under such a root that holds a `.git`, a folder or a file, is on the channel after it. The
// depth is the root's own (the `repository_scan_depth` of its workspace entry, -1 for no limit) and
// the global one for a root with none. The walk skips links, `.git` and the ignored folders below,
// and runs when the roots are read (at start, on a config push and when the open workspace moves)
// and when a `rename` event names a path of at most `depth` segments, or a path ending in `/.git`
// of at most `depth + 1` segments, which is how a repository cloned or initialised while the server
// runs is found. Under no limit a `rename` event asks for the walk when it names a folder (or a
// path that is gone) or a `.git`, since a file made or moved cannot be a repository.
//
// A hub is also walked at any depth for the repositories inside it (nested.ts), whatever its
// `repository_scan_depth` is, when the roots are read and when a `rename` event names a folder made
// or moved, a `.git`, or a repository that is gone. The `found` option is called with the lists of
// each hub and the repositories of the workspace as the Repositories view lists them, once for
// every change of them.
//
// The root the `always` option names is on the channel whether or not a session names it; it is
// opened before the first sessions message and never dropped for one.
//
// Two handles per workspace. `<root>/.git` non-recursively catches the index, HEAD and the refs,
// which is what a commit or a checkout moves; the worktree recursively catches an edit to a file.
// The worktree of a research hub holds build output and virtual environments whose writes say
// nothing about the working tree's state, so an event is dropped from the git re-read when any
// segment of its path is one of the ignored folders, and .git/objects is dropped with them: a pack
// being written is a second event for the index change that is already coming.
//
// The recursive watch over each root answers a second question, on the `files` channel: which
// folders of which root a write just landed in. Every event adds the folder that holds the path it
// names, relevant to git or not, to the root's window; the root's throttle timer publishes the
// window as `{ root, folders }` (or `{ root }` when more than 64 folders came in it) when it fires,
// and a read of the state is asked for when a relevant event came in the window, or when the root's
// last read ran out of time. An event at a folder's `project.yml` or `.oculus` adds the folder
// above that folder too, whose listing carries what the folder holds for the make controls
// (files/project/make.ts, `markedBy`). For the root's own, and for the root's own
// `.oculus/settings.yml`, the timer says the workspaces may have changed, since their answer
// carries the root's marks and that file's text (files/fs.ts). The message is published by the
// timer and not by the read, so a file listing is never held behind git. It is this watcher's
// because it already watches every root recursively and already throttles the burst a save makes,
// so no second watcher and no second throttle are needed.
//
// The reads run git as child processes (server/core/git/run.ts), so the event loop serves requests
// while they work. Each root has at most one read running and at most one waiting: a read asked for
// while one runs waits for it and every later ask joins the waiting one, so a burst of events or
// refreshes during a long read costs one more read. Reads of different roots run at the same time.
// A read that answers for a root dropped while it ran, or after `close`, keeps nothing.
//
// An event is also dropped when the path it names last changed before the newest read of its root
// that answered began; a read that failed, a git that timed out, saw nothing and moves nothing on.
// An FSEvents stream is served by fseventsd, which stamps an event when it gets to it rather than
// when the write happened; while it is behind, the writes that made a root just before its watch
// opened reach the new stream as events, seconds after the first read already saw them. Each of
// those would schedule a read that finds nothing new and name the root on the files channel for a
// write that is not news.
//
// A read in which a git command ran out of time is asked for again when the root's throttle window
// ends, as an event would ask for it, and so on until a read finishes: a root git is slow over for
// a while (a large worktree while the machine is busy) is shown unreadable only for that while, and
// nothing else would read it again, since a root nobody writes in sends no event.

import { existsSync, lstatSync, readdirSync, watch } from 'node:fs';
import type { FSWatcher, Stats } from 'node:fs';
import { dirname, join } from 'node:path';
import { REPO_SETTINGS } from '../../../data/helpers/editor/editor.ts';
import { byKey } from '../../../data/helpers/guards.ts';
import type {
    FilesPayload,
    GitPayload,
    Message,
    SessionsPayload
} from '../../../data/model/index.ts';
import type { Hub, Sink } from '../../core/channels.ts';
import { systemClock, type Clock, type Timer } from '../../core/file-poll.ts';
import { readState, type StateRead } from '../../core/git/state.ts';
import { TIMEOUT_MS } from '../../core/git/run.ts';
import { APP_FOLDERS, PLAIN_FOLDERS } from '../process/build-folders.ts';
import { markedBy } from '../../files/project/make.ts';
import type { HubRepositories } from '../../git/clone/exclude.ts';
import {
    composeFound,
    mayChangeNested,
    nestedRepositories,
    type NestedFound
} from './repos/nested.ts';
import { mayChangeRepositories } from './repos/depth.ts';
import type { Watcher } from './portfolio.ts';

/** Milliseconds one root is re-read at most once in. */
export const THROTTLE = 2000;

/** How many folders one window names before it names the whole root instead. */
const MOST_FOLDERS = 64;

/** Path segments whose writes never change what git reports about the working tree. */
export const IGNORED = [
    'node_modules',
    ...Object.values(PLAIN_FOLDERS),
    ...Object.values(APP_FOLDERS),
    '__pycache__'
];

export type GitWatchOptions = {
    /** Milliseconds one root is re-read at most once in. */
    throttle?: number;
    /** The timer pair the throttle runs on; the globals when absent. */
    clock?: Clock;
    /** Milliseconds one git command is given; server/core/git/run.ts's default when absent. */
    timeout?: number;
    /**
     * A root watched whether or not a session names it, so a folder nobody has a session in shows
     * the state it has now and not the one it had when the page opened.
     */
    always?: string;
    /**
     * The directories the file browser serves, in the order it lists them, asked again on a config
     * push and whenever the open workspace moves. It reads the configuration as it is at the call
     * rather than a copy taken at start. They come before the sessions' workspaces, so the
     * payload's keys are in the order the Repositories view draws its sections.
     */
    roots?: () => string[];
    /**
     * The text catalog a read that failed is worded from, asked again with the roots. Empty when
     * absent, which words nothing: a caller that reads failures names it.
     */
    text?: () => Record<string, string>;
    /**
     * How many levels below a root its repositories are looked for, asked again with the roots;
     * `repository_scan_depth` of the merged config in the running server, 1 when absent.
     */
    depth?: () => number;
    /**
     * The depth of the roots that carry their own, by directory: a whole number of levels, or -1
     * for no limit. A root not in the map is looked into down to the `depth` option. Asked again
     * with the roots.
     */
    rootDepths?: () => ReadonlyMap<string, number>;
    /**
     * The folders that hold the repository of a project cloned into it, asked again with the roots
     * and whenever the portfolio is published. Each is a root of its own, whatever the depth of the
     * folder it lies in, so a repository cloned at the bottom of a hub is on the channel.
     */
    cloned?: () => string[];
    /**
     * The folders of the workspace that are hubs. The repositories inside each are looked for at
     * any depth (nested.ts), whatever the scan depth of the folder says.
     */
    hubs?: () => string[];
    /**
     * Called with the repositories of the workspace and of each hub when the lists changed: at the
     * first walk, when the roots are read again, and when a folder is made, moved or removed in a
     * hub or a repository is made or removed in a folder of the workspace. Not called when the
     * lists are as they were.
     */
    found?: (found: NestedFound) => void;
    /**
     * Call the listener when the open workspace moves, so a folder added in the page is watched
     * from the next tick; the answer takes the listener away.
     */
    follow?: (listener: () => void) => () => void;
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

/**
 * The repositories below a root, by path in name order: every folder down to `depth` levels under
 * it that holds a `.git`, a folder or a file. The walk enters repositories too (a repository inside
 * one is found), skips links, `.git` and the ignored folders, and enters every other folder, dot
 * folders included. A folder that cannot be listed is skipped and the rest of the walk goes on. A
 * depth of 0 finds nothing, and `Infinity` has no limit.
 */
export function subrepositories(root: string, depth: number): string[] {
    const found: string[] = [];
    const walk = (dir: string, level: number): void => {
        if (level >= depth) return;
        let entries;
        try {
            entries = readdirSync(dir, { withFileTypes: true });
        } catch {
            return;
        }
        for (const entry of entries) {
            if (!entry.isDirectory() || entry.name === '.git' || IGNORED.includes(entry.name)) {
                continue;
            }
            const path = join(dir, entry.name);
            if (existsSync(join(path, '.git'))) found.push(path);
            walk(path, level + 1);
        }
    };
    walk(root, 0);
    return found.sort();
}

function reason(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
}

/**
 * What a stat says of a path itself, or nothing when there is no entry there to say it of: a path
 * that is gone, and one under a file (a worktree's `.git` is one), which the stat refuses with
 * ENOTDIR. A symbolic link is dated by its own change time, not its target's: a link made or
 * pointed elsewhere now, at a file that is old, is a new entry git reports.
 */
function statOf(path: string): Stats | undefined {
    try {
        return lstatSync(path, { throwIfNoEntry: false });
    } catch {
        return undefined;
    }
}

/** The folder that holds a path, relative to the root: `''` for the root's own top. */
function parentOf(path: string): string {
    const at = Math.max(path.lastIndexOf('/'), path.lastIndexOf('\\'));
    return at === -1 ? '' : path.slice(0, at);
}

/**
 * A git watcher: a portfolio watcher that can also be told to re-read one root at once.
 */
export type GitWatcher = Watcher & {
    /**
     * Re-read one root now, for a write that has just changed it. The promise settles once a read
     * of the root that began after the call has ended: published, found unchanged, or kept nothing
     * because the root was dropped or the watcher closed. It settles at once for a root that is not
     * watched, and never rejects.
     */
    refresh(root: string): Promise<void>;
};

/** One root's reads: whether one runs, and the callers of the one that waits behind it. */
type Slot = { running: boolean; waiting: { settle: () => void; announce: boolean }[] | null };

/**
 * Watch the workspaces the `sessions` channel names and publish on the `git` channel. A root that
 * stops being named is unwatched and drops out of the payload; a root that cannot be watched still
 * gets its state read once, since server/core/git/state.ts answers for a directory that is not a
 * repository. The same watch publishes the `files` channel: at the end of each throttle window, the
 * folders its events landed in.
 */
export function watchGit(hub: Hub, options: GitWatchOptions = {}): GitWatcher {
    const throttle = options.throttle ?? THROTTLE;
    const clock = options.clock ?? systemClock;
    const timeout = options.timeout ?? TIMEOUT_MS;
    const always = options.always ?? '';
    const configured = options.roots ?? ((): string[] => []);
    const catalogOf = options.text ?? ((): Record<string, string> => ({}));
    const depthOf = options.depth ?? ((): number => 1);
    const depthsOf = options.rootDepths ?? ((): ReadonlyMap<string, number> => new Map());
    const clonedOf = options.cloned ?? ((): string[] => []);
    const hubsOf = options.hubs ?? ((): string[] => []);
    /** The roots the newest sessions payload named, kept so a rescan can compose the whole list. */
    let named: string[] = [];
    /**
     * The file browser's roots as last read. Reading them parses the configuration, so they are
     * read at start, on a config push and when the open workspace moves, and a sessions push
     * composes its list from this copy.
     */
    let browser: string[] = [];
    /** The text catalog and the repository depths, read with the roots. */
    let text: Record<string, string> = {};
    let depth = 1;
    let depths: ReadonlyMap<string, number> = new Map();
    /** The folders of the repositories cloned for projects, as the portfolio last named them. */
    let cloned: string[] = [];
    /** The repositories found below each of the file browser's roots. */
    const inside = new Map<string, string[]>();
    /** The repositories found at any depth below each hub, as the last walk of it listed them. */
    const deep = new Map<string, string[]>();
    /** The hubs an event says may have made, moved or removed a repository below them. */
    const deepWants = new Set<string>();
    /** The lists last handed on, to know whether a walk changed them. */
    let handedOn = '';
    let walking = false;
    let walkAgain = false;
    /** The hubs of the workspace, read with the roots. */
    let hubDirs: string[] = [];
    /** The roots an event says may hold a repository that is not listed yet. */
    const rescan = new Set<string>();
    /** The listener the open workspace calls on a move, taken away at close. */
    let unfollow: (() => void) | null = null;
    const handles = new Map<string, FSWatcher[]>();
    /**
     * Which opening of a root a read began under and when that watch was opened, so a read of a
     * root dropped or opened again meanwhile is known, and the first read of a root begins at the
     * moment its watch did.
     */
    const opened = new Map<string, { id: number; at: number }>();
    let openings = 0;
    const timers = new Map<string, Timer>();
    const last = new Map<string, number>();
    /**
     * The folders each root's window has heard writes in, and whether the window names the root.
     */
    const windows = new Map<string, { folders: Set<string>; whole: boolean }>();
    /** The roots a relevant event came for in the window, which the timer reads. */
    const wants = new Set<string>();
    /** The roots a write may have changed the make marks of, which the workspaces answer holds. */
    const marked = new Set<string>();
    /** The roots a failed watch is said of once. */
    const said = new Set<string>();
    const slots = new Map<string, Slot>();
    /**
     * When the newest read of each root that answered began, which an event must postdate to be
     * news.
     */
    const readFrom = new Map<string, number>();
    let state: GitPayload = {};
    /** The roots marked as the workspace's in the payload last published, as one text. */
    let marks = '';
    /** Whether a read changed the payload since it was last published. */
    let changed = false;
    let closed = false;

    /** Publish a copy, in root order, so a later re-read cannot change a payload on the wire. */
    const publish = (): void => {
        reorder(wanted());
        changed = false;
        const marked = workspaceRoots();
        marks = marksOf(marked);
        hub.publish(
            'git',
            Object.fromEntries(
                Object.entries(state).map(([root, one]) => [
                    root,
                    { ...one, inWorkspace: marked.has(root) }
                ])
            )
        );
    };

    /**
     * When the newest read of a root that answered began. A read that came back with `error` set
     * (a root that is no repository) or with a git that ran out of time saw nothing, so the events
     * it would otherwise hide are still read for.
     */
    const answered = (root: string, began: number, read: StateRead): void => {
        if (read.state.error !== null || !read.finished) return;
        readFrom.set(root, Math.max(began, readFrom.get(root) ?? 0));
    };

    /** The `files` channel carries the event: where a window of writes landed. */
    const announceFiles = (root: string, folders: string[] | null): void => {
        hub.publish(
            'files',
            (folders === null ? { root } : { root, folders }) satisfies FilesPayload
        );
    };

    /** The workspaces may have changed: the page marks them and the bookmarks. */
    const announceWorkspaces = (): void => {
        hub.publish('files', { root: '', workspaces: true } satisfies FilesPayload);
    };

    /** Whether `born` is still the open watch of `root` and the watcher is not closed. */
    const stillOpen = (root: string, born: unknown): boolean =>
        !closed && opened.get(root) === born;

    /**
     * One read of a root, which keeps its answer when the root is still the one that was opened. A
     * change of state is published when `announce` is set; the first read of new roots of one
     * `follow` is published once, by `follow`, after they have all answered.
     */
    const readOnce = async (root: string, announce: boolean, first: boolean): Promise<void> => {
        const born = opened.get(root);
        if (closed || born === undefined) return;
        if (rescan.delete(root) && scan(root)) {
            follow();
            void renewNested();
        }
        const began = first ? born.at : Date.now();
        const read = await readState(root, text, timeout);
        if (!stillOpen(root, born)) return;
        const next = read.state;
        answered(root, began, read);
        if (first) last.set(root, Date.now());
        // No event comes for a root nobody writes in, so the watcher asks for the next read itself.
        if (!read.finished) {
            wants.add(root);
            touch(root);
        }
        const held = byKey(state, root);
        if (held === undefined || JSON.stringify(held) !== JSON.stringify(next)) {
            state[root] = next;
            changed = true;
        }
        if (announce && changed) publish();
    };

    /** Start a root's read, and the one that waited behind it when this one ends. */
    const run = async (
        root: string,
        slot: Slot,
        announce: boolean,
        first: boolean
    ): Promise<void> => {
        slot.running = true;
        try {
            await readOnce(root, announce, first);
        } finally {
            slot.running = false;
            const next = slots.get(root) === slot ? slot.waiting : null;
            slot.waiting = null;
            if (next !== null) {
                if (closed || !handles.has(root)) {
                    for (const waiter of next) waiter.settle();
                } else {
                    void run(
                        root,
                        slot,
                        next.some((waiter) => waiter.announce),
                        false
                    ).finally(() => {
                        for (const waiter of next) waiter.settle();
                    });
                }
            }
        }
    };

    /**
     * Ask for a read of a root. It starts at once when none runs; otherwise it waits for the one
     * that does, with every other ask made meanwhile. The promise settles when a read that began
     * after the call has ended, and never rejects.
     */
    const ask = (root: string, announce: boolean, first = false): Promise<void> => {
        if (closed || !handles.has(root)) return Promise.resolve();
        let slot = slots.get(root);
        if (slot === undefined) {
            slot = { running: false, waiting: null };
            slots.set(root, slot);
        }
        if (!slot.running) return run(root, slot, announce, first).catch(() => undefined);
        const held = slot;
        return new Promise<void>((settle) => {
            (held.waiting ??= []).push({ settle, announce });
        });
    };

    /**
     * A trailing-edge throttle, per root: the first event after a quiet period is acted on at once,
     * and every event inside the next two seconds collapses into one act at the end of that window.
     * The act is the `files` message naming the folders the window heard, then the read of the
     * state when a relevant event came.
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
                const heard = windows.get(root);
                windows.delete(root);
                if (heard !== undefined) {
                    const named = heard.whole || heard.folders.size > MOST_FOLDERS;
                    announceFiles(root, named ? null : [...heard.folders].sort());
                }
                if (marked.delete(root)) announceWorkspaces();
                if (wants.delete(root)) void ask(root, true);
                if (deepWants.delete(root)) void renewNested();
            }, wait)
        );
    };

    /**
     * Whether an event is for a change the newest answered read of its root already saw: the
     * change time of the path, or of the nearest folder above it that is still there, is before
     * that read began. Taking an entry out of a folder moves that folder's change time, so a path
     * that is gone is dated by the folder it left. The watch over `.git` names the folder itself
     * `.git`, and `.git/.git` is dated by `.git` the same way.
     */
    const seenBy = (root: string, path: string): boolean => {
        const from = readFrom.get(root);
        if (from === undefined) return false;
        let at = join(root, path);
        for (;;) {
            const stat = statOf(at);
            if (stat !== undefined) return stat.ctimeMs < from;
            const up = dirname(at);
            if (at === root || !up.startsWith(root)) return false;
            at = up;
        }
    };

    /**
     * One event under a root. The folder that holds the path joins the window whatever the path is,
     * since a listing of it is stale for an ignored folder as for any other, and so does the folder
     * whose listing carries the make marks the path may change; a path git reports
     * nothing for asks for no read. An event for a change a read already saw is dropped, which the
     * stat is spared when a window is already open.
     */
    const heard = (root: string, path: string | null, type: string): void => {
        if (path === null || path === '') return;
        if (!timers.has(root) && seenBy(root, path)) return;
        const span = windows.get(root) ?? { folders: new Set<string>(), whole: false };
        windows.set(root, span);
        span.folders.add(parentOf(path));
        const owner = markedBy(path);
        if (owner === '' || path === REPO_SETTINGS) marked.add(root);
        else if (owner !== null) span.folders.add(parentOf(owner));
        if (span.folders.size > MOST_FOLDERS) span.whole = true;
        if (relevant(path)) {
            wants.add(root);
            if (type === 'rename' && inside.has(root)) {
                const folderOrGone = (): boolean => {
                    const stat = statOf(join(root, path));
                    return stat === undefined || stat.isDirectory();
                };
                if (mayChangeRepositories(path, depthFor(root), folderOrGone)) rescan.add(root);
            }
            if (type === 'rename' && hubDirs.includes(root)) {
                const stat = statOf(join(root, path));
                const known = deep.get(root) ?? [];
                if (mayChangeNested(root, path, stat?.isDirectory(), known)) deepWants.add(root);
            }
        }
        touch(root);
    };

    const open = (root: string): void => {
        const watching: FSWatcher[] = [];
        // The first read of a new root follows its watch, so it sees every write made before now.
        readFrom.delete(root);
        openings += 1;
        opened.set(root, { id: openings, at: Date.now() });
        // A root nothing can be opened at is still a root the payload names: a workspace the reader
        // deleted, a link whose target was never made, a folder under a parent nothing may enter.
        // There is nothing to watch at any of them, so no watcher is made and no error is logged;
        // what each one is, readState says on its own, read once below, and the views draw that.
        // The watch is tried again at the next poll and config push.
        if (!existsSync(root)) {
            handles.set(root, watching);
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
            // state is the empty shape readState gives a directory that is not a repository, and a
            // line per start saying so is noise. Only a target that is there and still refuses the
            // watch is worth saying, once.
            if (!existsSync(target)) continue;
            try {
                watching.push(
                    watch(target, { recursive }, (event, filename) => {
                        heard(root, typeof filename === 'string' ? prefix + filename : null, event);
                    })
                );
            } catch (error) {
                if (!said.has(target)) {
                    said.add(target);
                    console.error(`git watch: cannot watch ${target}: ${reason(error)}`);
                }
            }
        }
        handles.set(root, watching);
    };

    /** Settle every read waiting on a root, which will not start now. */
    const settleWaiting = (root: string): void => {
        const slot = slots.get(root);
        const waiting = slot?.waiting ?? null;
        if (slot !== undefined) slot.waiting = null;
        for (const waiter of waiting ?? []) waiter.settle();
    };

    const drop = (root: string): void => {
        for (const handle of handles.get(root) ?? []) handle.close();
        handles.delete(root);
        opened.delete(root);
        const timer = timers.get(root);
        if (timer !== undefined) clock.clearTimeout(timer);
        timers.delete(root);
        windows.delete(root);
        wants.delete(root);
        rescan.delete(root);
        deepWants.delete(root);
        last.delete(root);
        readFrom.delete(root);
        settleWaiting(root);
        slots.delete(root);
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete -- a Map here would change the shape every reader of this record depends on
        delete state[root];
    };

    /**
     * Every root on the channel, in the order the page draws them: the always-watched root, the
     * file browser's, the repositories below them down to the scan depth, then the sessions'
     * workspaces, each named once.
     */
    const readRoots = (): void => {
        // The file browser's roots, the catalog and the depth are read off config and a file the
        // reader edits, so a broken one leaves the channel with what it can name rather than
        // stopping the watcher.
        try {
            browser = configured();
            text = catalogOf();
            depth = depthOf();
            depths = depthsOf();
            cloned = clonedOf();
            hubDirs = hubsOf();
        } catch (error) {
            console.error(`git watch: reading the roots failed: ${reason(error)}`);
        }
        for (const root of [...inside.keys()]) {
            if (!browser.includes(root)) inside.delete(root);
        }
        for (const root of browser) scan(root);
        void renewNested();
    };
    /**
     * Read again which repositories one folder of the file browser holds, answering whether the
     * list changed.
     */
    const depthFor = (root: string): number => {
        const own = depths.get(root) ?? depth;
        return own < 0 ? Infinity : own;
    };
    const scan = (root: string): boolean => {
        const before = inside.get(root) ?? [];
        const found = subrepositories(root, depthFor(root));
        inside.set(root, found);
        return found.length !== before.length || found.some((one, at) => one !== before[at]);
    };
    /** Whether the watcher is open, read again after each await of a walk. */
    const watching = (): boolean => !closed;
    /** Whether an ask came in while a walk ran, read again at the end of each pass. */
    const askedAgain = (): boolean => walkAgain;
    /**
     * Walk every hub for the repositories below it and hand on the lists when they are not the ones
     * handed on last. One walk runs at a time; an ask made meanwhile is answered by one more walk
     * when it ends. A walk that fails keeps the lists as they were.
     */
    const renewNested = async (): Promise<void> => {
        if (options.found === undefined || closed) return;
        if (walking) {
            walkAgain = true;
            return;
        }
        walking = true;
        try {
            do {
                walkAgain = false;
                const hubs: HubRepositories[] = [];
                for (const hubDir of hubDirs) {
                    const repositories = await nestedRepositories(hubDir, IGNORED);
                    deep.set(hubDir, repositories);
                    hubs.push({ hub: hubDir, repositories });
                }
                for (const hubDir of [...deep.keys()]) {
                    if (!hubDirs.includes(hubDir)) deep.delete(hubDir);
                }
                const folders = [...browser, ...hubDirs.filter((one) => !browser.includes(one))];
                const found = await composeFound(folders, (root) => inside.get(root) ?? [], hubs);
                const signature = JSON.stringify(found);
                if (watching() && signature !== handedOn) {
                    handedOn = signature;
                    options.found(found);
                }
            } while (askedAgain() && watching());
        } catch (error) {
            console.error(`git watch: the nested repositories were not read: ${reason(error)}`);
        } finally {
            walking = false;
        }
    };
    /**
     * The roots that belong to the workspace: the always-watched root, the file browser's roots,
     * the repositories found below them and the folders the projects are cloned into. A root only a
     * session names is not among them.
     */
    const workspaceRoots = (): Set<string> => {
        const listed = browser.flatMap((root) => [root, ...(inside.get(root) ?? [])]);
        return new Set([always, ...listed, ...cloned].filter((root) => root !== ''));
    };
    const marksOf = (marked: Set<string>): string => JSON.stringify([...marked].sort());
    const wanted = (): string[] => {
        const roots: string[] = [];
        for (const root of [...workspaceRoots(), ...named]) {
            if (root !== '' && !roots.includes(root)) roots.push(root);
        }
        return roots;
    };

    /** The payload, rebuilt in root order, so its keys say what order the sections are drawn in. */
    const reorder = (roots: string[]): void => {
        const held = state;
        state = {};
        for (const root of roots) {
            const one = byKey(held, root);
            if (one !== undefined) state[root] = one;
        }
    };

    /**
     * The first reads of the roots one `follow` opened, one after another in the order given, each
     * through the root's own queue; the payload is published once they have all answered.
     */
    const firstReads = async (fresh: string[]): Promise<void> => {
        for (const root of fresh) await ask(root, false, true);
        if (!closed && changed) publish();
    };

    /**
     * Open what is new, drop what is gone, try again the roots a watch could not be opened at, read
     * the new ones, and publish when the set or its order moved. The order is part of the payload:
     * the view draws its sections in the order the keys come in, so a root that only changed place
     * is a publish like any other. A new root is on the channel once its first read has answered.
     */
    function follow(): void {
        if (closed) return;
        const roots = wanted();
        const before = Object.keys(state);
        for (const root of [...handles.keys()]) {
            if (roots.includes(root)) continue;
            drop(root);
        }
        const fresh = roots.filter((root) => !handles.has(root));
        for (const root of fresh) open(root);
        // A root nothing could be watched at is tried again, and read again once a watch holds.
        const retried: string[] = [];
        for (const root of roots) {
            if (fresh.includes(root) || handles.get(root)?.length !== 0 || !existsSync(root))
                continue;
            handles.delete(root);
            open(root);
            if ((handles.get(root)?.length ?? 0) > 0) retried.push(root);
        }
        reorder(roots);
        const after = Object.keys(state);
        const moved =
            before.length !== after.length ||
            before.some((root, at) => root !== after[at]) ||
            (after.length > 0 && marks !== marksOf(workspaceRoots()));
        if (moved) publish();
        const reads = [...fresh, ...retried];
        if (reads.length > 0) void firstReads(reads);
    }

    // The sink is this watcher's own end of the `sessions` channel. It sends nothing back and is
    // never closed by the hub, so `close` below is what removes it.
    const sink: Sink = {
        send: (message: string) => {
            try {
                const held = JSON.parse(message) as Message;
                if (held.channel === 'sessions') {
                    named = rootsOf(held.payload as SessionsPayload);
                    follow();
                }
                // A portfolio push is how a repository cloned for a project reaches the channel:
                // the folders the projects clone into are read again, and only those.
                if (held.channel === 'portfolio') {
                    cloned = clonedOf();
                    follow();
                }
                // A config push is how a changed configuration reaches this watcher: the roots
                // option reads the workspace as it is now, so reading it again and following is the
                // whole work. A sessions push keeps the copy: it says nothing about config. The
                // workspaces are said to have moved too, since the folders of the workspace are
                // what the file browser serves.
                if (held.channel === 'config') {
                    readRoots();
                    follow();
                    announceWorkspaces();
                }
            } catch (error) {
                console.error(`git watch: unreadable message: ${reason(error)}`);
            }
            return Promise.resolve();
        },
        close: () => {
            // The probe holds no handle, so closing it frees nothing.
        }
    };
    // The folders are read again when the open workspace moves, so a folder added by the page or by
    // hand is watched at the next tick.
    unfollow =
        options.follow?.(() => {
            readRoots();
            follow();
            announceWorkspaces();
        }) ?? null;
    // The always-watched root and the file browser's are opened before the first sessions message,
    // so a hub nobody has a session in is on the channel from the start.
    try {
        text = catalogOf();
        depth = depthOf();
        depths = depthsOf();
        cloned = clonedOf();
        hubDirs = hubsOf();
    } catch (error) {
        console.error(`git watch: reading the settings failed: ${reason(error)}`);
    }
    if (always !== '' || options.roots !== undefined) {
        readRoots();
        follow();
    }
    hub.subscribe(sink, ['sessions', 'config', 'portfolio']);

    return {
        refresh(root: string): Promise<void> {
            if (closed || !handles.has(root)) return Promise.resolve();
            announceFiles(root, null);
            return ask(root, true);
        },
        close(): void {
            closed = true;
            hub.remove(sink);
            unfollow?.();
            unfollow = null;
            for (const root of [...handles.keys()]) drop(root);
            slots.clear();
            state = {};
        }
    };
}
