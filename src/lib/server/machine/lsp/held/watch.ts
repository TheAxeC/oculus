// Layer 2, server. The file watching a language server asks for. A server that registers
// `workspace/didChangeWatchedFiles` wants to hear of a file that changes on disk and that no
// client holds open: pyright keeps a stale answer for a file it read from disk until it is told.
// One recursive `fs.watch` of the root's real path serves every watcher a server registered; its
// events are matched against the registered globs with `path.matchesGlob`, debounced 200 ms, and
// sent as one list of created, changed and deleted files; a folder whose own name is in an event
// no registration matches is handed over apart, after a quiet of its own so that other files
// created around it do not hold back the list, since the files inside it raise none. A link to a
// folder is not handed over: the files under it are not the root's. A request
// that depends on what the server holds of the files does not wait out the quiet: `flush` hands
// the changes over at once, and `writtenSince` reads the disk for a write the platform has not
// reported yet.
//
// A document open in a tab is the tab's text and not the disk's, so its own path's events are not
// sent. The library audit kept `fs.watch` over a watching library, as the other watchers of this
// server use it.
//
// `followRoots` is the other watch of this folder: it tells the relay that the roots the file
// browser serves moved, from a config push and from the open workspace, so the relay ends the
// servers of a root that is not served any more and tells a page a root is served again.

import { existsSync, lstatSync, statSync, watch, type FSWatcher } from 'node:fs';
import { join, matchesGlob, sep } from 'node:path';
import { pathToFileURL } from 'node:url';
import type { Hub, Sink } from '../../../core/channels.ts';

/** The kinds of change a `didChangeWatchedFiles` carries. */
const CREATED = 1;
const CHANGED = 2;
const DELETED = 3;

/** The milliseconds a burst of events waits for its end. */
const WATCH_QUIET_MS = 200;

/** One file the disk says changed, as the protocol carries it. */
export type FileChange = { uri: string; type: number };

/** What a watch of one root is told and what it answers. */
export type WatchOptions = {
    /** The root's real path. */
    root: string;
    /** Whether a file is held open by a tab, by its real path. */
    open: (real: string) => boolean;
    /** The changes of one quiet, in the order they were seen. */
    changed: (changes: FileChange[]) => void;
    /**
     * The folders of one quiet whose own name was in an event that no registration matches, with
     * whether each is there now: the files inside a renamed folder raise no event of their own.
     */
    folders?: (folders: Map<string, boolean>) => void;
    /** The watch of the platform; `fs.watch` unless a test says otherwise. */
    watchFolder?: typeof watch;
};

/** Whether a path relative to the root is one a registration wants to hear of. */
export type Match = (relative: string) => boolean;

/** The globs one server registered, by registration id, and the watch they share. */
export class RootWatch {
    #options: WatchOptions;
    #globs = new Map<string, Match>();
    #handle: FSWatcher | null = null;
    #pending = new Map<string, number>();
    #folders = new Map<string, boolean>();
    #timer: ReturnType<typeof setTimeout> | null = null;
    #folderTimer: ReturnType<typeof setTimeout> | null = null;
    #closed = false;

    constructor(options: WatchOptions) {
        this.#options = options;
    }

    /** Take the globs of a registration, starting the watch of the root with the first one. */
    register(id: string, globs: string[]): void {
        this.registerMatch(id, (relative) => globs.some((glob) => matches(relative, glob)));
    }

    /** Take a registration that names the paths it wants by a test of the path under the root. */
    registerMatch(id: string, match: Match): void {
        if (this.#closed) return;
        this.#globs.set(id, match);
        if (this.#handle !== null) return;
        const watchFolder = this.#options.watchFolder ?? watch;
        try {
            this.#handle = watchFolder(this.#options.root, { recursive: true }, (event, name) =>
                this.#event(event, name)
            );
            this.#handle.on('error', () => undefined);
        } catch {
            this.#handle = null;
        }
    }

    /** Take a registration away; the watch ends with the last one. */
    unregister(id: string): void {
        this.#globs.delete(id);
        if (this.#globs.size === 0) this.#stop();
    }

    /** End the watch and drop what is waiting. */
    close(): void {
        this.#closed = true;
        this.#globs.clear();
        this.#stop();
    }

    /**
     * One event of the platform: remember the file for the end of the quiet. A file created in
     * the quiet stays created whatever is written to it after.
     */
    #event(event: string, name: string | Buffer | null): void {
        if (name === null || this.#closed) return;
        const raw = String(name);
        const relative = raw.normalize('NFC');
        if (relative.split(sep).includes('.git')) return;
        const real = join(this.#options.root, raw);
        if (![...this.#globs.values()].some((match) => match(relative))) {
            const hidden = relative
                .split(sep)
                .some((part) => part.startsWith('.') || part === 'node_modules');
            if (event === 'rename' && this.#options.folders !== undefined && !hidden) {
                const there = existsSync(real);
                if (there && !isFolder(real)) return;
                this.#folders.set(real, there);
                this.#laterFolders();
            }
            return;
        }
        if (this.#options.open(real)) return;
        const type = existsSync(real) ? (event === 'rename' ? CREATED : CHANGED) : DELETED;
        const created = type === CHANGED && this.#pending.get(real) === CREATED;
        this.#pending.set(real, created ? CREATED : type);
        this.#later();
    }

    /** End the quiet of the files 200 ms after their last event. */
    #later(): void {
        if (this.#timer !== null) clearTimeout(this.#timer);
        this.#timer = quiet(() => this.#flushFiles());
    }

    /** End the quiet of the folders 200 ms after their last event. */
    #laterFolders(): void {
        if (this.#folderTimer !== null) clearTimeout(this.#folderTimer);
        this.#folderTimer = quiet(() => this.#flushFolders());
    }

    /** Hand over the changes seen so far at once, without waiting out the quiet. */
    flush(): void {
        if (this.#timer !== null) clearTimeout(this.#timer);
        if (this.#folderTimer !== null) clearTimeout(this.#folderTimer);
        this.#flushFiles();
        this.#flushFolders();
    }

    #flushFiles(): void {
        this.#timer = null;
        const changes = [...this.#pending].map(([real, type]) => ({
            uri: pathToFileURL(real).href,
            type
        }));
        this.#pending.clear();
        if (this.#closed) return;
        if (changes.length > 0) this.#options.changed(changes);
    }

    #flushFolders(): void {
        this.#folderTimer = null;
        const folders = new Map(this.#folders);
        this.#folders.clear();
        if (this.#closed) return;
        if (folders.size > 0) this.#options.folders?.(folders);
    }

    #stop(): void {
        this.#handle?.close();
        this.#handle = null;
        if (this.#timer !== null) clearTimeout(this.#timer);
        this.#timer = null;
        if (this.#folderTimer !== null) clearTimeout(this.#folderTimer);
        this.#folderTimer = null;
        this.#pending.clear();
        this.#folders.clear();
    }
}

/** A timer of WATCH_QUIET_MS that does not keep the process alive. */
function quiet(end: () => void): ReturnType<typeof setTimeout> {
    const timer = setTimeout(end, WATCH_QUIET_MS);
    if (typeof timer === 'object' && typeof timer.unref === 'function') timer.unref();
    return timer;
}

/** Whether a path is a folder now, a link to a folder not counted. */
function isFolder(real: string): boolean {
    try {
        return lstatSync(real).isDirectory();
    } catch {
        return false;
    }
}

/** The time each file was last written, by real path. */
export type Written = Map<string, number>;

/**
 * The files among `files` written since `known` was taken, as the changes a server is told of:
 * Changed for each file whose time moved, and Created ahead of it for a file `known` does not hold,
 * since a server keeps what it read of a known file until told it changed and takes a file it does
 * not know only as created. With no `known` there are no changes: the times are only taken. The
 * platform's watch reports a write a moment after it; this reads the disk, so a request made at
 * once sees it.
 */
export function writtenSince(
    files: readonly string[],
    known: Written | null
): { changes: FileChange[]; written: Written } {
    const changes: FileChange[] = [];
    const written: Written = new Map();
    for (const real of files) {
        let time: number;
        try {
            time = statSync(real).mtimeMs;
        } catch {
            continue;
        }
        written.set(real, time);
        if (known === null) continue;
        const last = known.get(real);
        if (last === time) continue;
        const uri = pathToFileURL(real).href;
        if (last === undefined) changes.push({ uri, type: CREATED });
        changes.push({ uri, type: CHANGED });
    }
    return { changes, written };
}

/**
 * The files of an entry's own file events a watch tells its server of: a path under the root that
 * matches one of the globs, lies in no folder whose name starts with a dot and no `node_modules`,
 * and is not a file the entry keeps from its server.
 */
export function entryFiles(
    globs: readonly string[],
    refused: (relative: string) => boolean
): Match {
    return (relative) => {
        const folders = relative.split(sep).slice(0, -1);
        if (folders.some((part) => part.startsWith('.') || part === 'node_modules')) return false;
        return globs.some((glob) => matches(relative, glob)) && !refused(relative);
    };
}

/** Whether a path relative to the root matches a glob a server registered. */
function matches(relative: string, glob: string): boolean {
    try {
        return matchesGlob(relative, glob);
    } catch {
        return false;
    }
}

/** What a change of the disk is called in the protocol of a server that watches paths. */
export function kindOf(type: number): 'create' | 'change' | 'delete' {
    return type === CREATED ? 'create' : type === DELETED ? 'delete' : 'change';
}

/**
 * The globs of one `workspace/didChangeWatchedFiles` registration. A watcher's pattern is a string
 * or a relative pattern with a base folder; only the pattern is matched, against the path under
 * the root, since the root is the one folder watched.
 */
export function globsOf(options: unknown): string[] {
    const watchers = (options as { watchers?: unknown } | null)?.watchers;
    if (!Array.isArray(watchers)) return [];
    const globs: string[] = [];
    for (const one of watchers) {
        const pattern = (one as { globPattern?: unknown } | null)?.globPattern;
        if (typeof pattern === 'string') globs.push(pattern);
        else if (typeof (pattern as { pattern?: unknown } | null)?.pattern === 'string') {
            globs.push((pattern as { pattern: string }).pattern);
        }
    }
    return globs;
}

/**
 * Follow the served roots for `relay`: a config push and a move of the open workspace (`follow`
 * calls its listener on one) each reconcile it. The answer closes both.
 */
export function followRoots(
    relay: { reconcile(): void },
    hub: Hub,
    follow: (listener: () => void) => () => void
): { close(): void } {
    const sink: Sink = {
        send: () => {
            relay.reconcile();
            return Promise.resolve();
        },
        close: () => undefined
    };
    const unfollow = follow(() => relay.reconcile());
    hub.subscribe(sink, ['config']);
    return {
        close: () => {
            hub.remove(sink);
            unfollow();
        }
    };
}
