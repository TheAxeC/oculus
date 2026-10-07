// Layer 2, server. The file watching a language server asks for. A server that registers
// `workspace/didChangeWatchedFiles` wants to hear of a file that changes on disk and that no
// client holds open: pyright keeps a stale answer for a file it read from disk until it is told.
// One recursive `fs.watch` of the root's real path serves every watcher a server registered; its
// events are matched against the registered globs with `path.matchesGlob`, debounced 200 ms, and
// sent as one list of created, changed and deleted files.
//
// A document open in a tab is the tab's text and not the disk's, so its own path's events are not
// sent. The library audit kept `fs.watch` over a watching library, as the other watchers of this
// server use it.
//
// `followRoots` is the other watch of this folder: it tells the relay that the roots the file
// browser serves moved, from a config push and from the saved workspaces file, so the relay ends
// the servers of a root that is not served any more and tells a page a root is served again.

import { existsSync, watch, type FSWatcher } from 'node:fs';
import { join, matchesGlob, sep } from 'node:path';
import { pathToFileURL } from 'node:url';
import type { Hub, Sink } from '../../../core/channels.ts';
import { POLL, pollFile, systemClock, type Clock } from '../../../core/file-poll.ts';

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
    /** The watch of the platform; `fs.watch` unless a test says otherwise. */
    watchFolder?: typeof watch;
};

/** The globs one server registered, by registration id, and the watch they share. */
export class RootWatch {
    #options: WatchOptions;
    #globs = new Map<string, string[]>();
    #handle: FSWatcher | null = null;
    #pending = new Map<string, number>();
    #timer: ReturnType<typeof setTimeout> | null = null;
    #closed = false;

    constructor(options: WatchOptions) {
        this.#options = options;
    }

    /** Take the globs of a registration, starting the watch of the root with the first one. */
    register(id: string, globs: string[]): void {
        if (this.#closed) return;
        this.#globs.set(id, globs);
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

    /** One event of the platform: remember the file for the end of the quiet. */
    #event(event: string, name: string | Buffer | null): void {
        if (name === null || this.#closed) return;
        const raw = String(name);
        const relative = raw.normalize('NFC');
        if (relative.split(sep).includes('.git')) return;
        if (
            ![...this.#globs.values()].some((globs) =>
                globs.some((glob) => matches(relative, glob))
            )
        ) {
            return;
        }
        const real = join(this.#options.root, raw);
        if (this.#options.open(real)) return;
        const type = existsSync(real) ? (event === 'rename' ? CREATED : CHANGED) : DELETED;
        this.#pending.set(real, type);
        if (this.#timer !== null) clearTimeout(this.#timer);
        this.#timer = setTimeout(() => this.#flush(), WATCH_QUIET_MS);
        if (typeof this.#timer === 'object' && typeof this.#timer.unref === 'function') {
            this.#timer.unref();
        }
    }

    #flush(): void {
        this.#timer = null;
        const changes = [...this.#pending].map(([real, type]) => ({
            uri: pathToFileURL(real).href,
            type
        }));
        this.#pending.clear();
        if (changes.length > 0 && !this.#closed) this.#options.changed(changes);
    }

    #stop(): void {
        this.#handle?.close();
        this.#handle = null;
        if (this.#timer !== null) clearTimeout(this.#timer);
        this.#timer = null;
        this.#pending.clear();
    }
}

/** Whether a path relative to the root matches a glob a server registered. */
function matches(relative: string, glob: string): boolean {
    try {
        return matchesGlob(relative, glob);
    } catch {
        return false;
    }
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

/** Follow the served roots for `relay`. The answer closes both the subscription and the poll. */
export function followRoots(
    relay: { reconcile(): void },
    hub: Hub,
    workspacesFile: string,
    clock: Clock = systemClock
): { close(): void } {
    const sink: Sink = {
        send: () => {
            relay.reconcile();
            return Promise.resolve();
        },
        close: () => undefined
    };
    const poll = pollFile(workspacesFile, { clock, every: POLL }, () => {
        poll.reading();
        relay.reconcile();
    });
    poll.reading();
    hub.subscribe(sink, ['config']);
    return {
        close: () => {
            hub.remove(sink);
            poll.close();
        }
    };
}
