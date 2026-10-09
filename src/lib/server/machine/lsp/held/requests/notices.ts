// Layer 2, server. The notices of changes on disk a held server is sent, one list at a time in the
// order the root watch saw them. Ahead of each list, the requests the entry words for it
// (`introduce`) are asked of the server and answered or given up on after INTRODUCE_MS, so a server
// that takes a created file only when it already holds it has read the file. The files inside a
// folder that was created or deleted raise no event of their own: the folder's files are listed
// from disk (created) or from the files the server has read (deleted) and told as such. A link
// rewrite waits in `caughtUp` until the server has been told of every Markdown file written since
// its last rewrite, including a write the platform's watch has not reported yet, and has read
// each file it was told of.

import { sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import type { LspRpc } from '../../../../../data/model/index.ts';
import type { Introduction } from '../../adapters/asks.ts';
import { writtenSince, type FileChange, type Written } from '../watch.ts';

/** The bound on the wait for the server to read what it was told changed. */
const SETTLE_MAX_MS = 2000;

/** The longest the server is given to answer the requests made ahead of the notice of changes. */
const INTRODUCE_MS = 10_000;

/** The types of change a `didChangeWatchedFiles` carries. */
const CREATED = 1;
const CHANGED = 2;
const DELETED = 3;

/** What the notices need of the held server they are sent to. */
type NoticeHost = {
    /** The requests the entry words for a list of changes. */
    introduce(changes: readonly FileChange[]): Introduction[];
    /** The files of the entry's kind under a folder, as real paths, read from disk. */
    filesUnder(folder: string): Promise<string[]>;
    /** Ask the server and wait for its answer, which is null when it did not take the request. */
    call(method: string, params: unknown): Promise<LspRpc | null>;
    /** Write a message to the server. */
    notify(message: LspRpc): void;
    /** Hand over the changes the root watch holds back at once. */
    flush(): void;
    /** Whether a file is held open by a tab, by its real path. */
    open(real: string): boolean;
};

/** A request of the server to the relay that is open: the file it reads, and its end. */
type Asked = {
    /** The request reads the file at this address. */
    read(uri: unknown): void;
    /** The request has been answered. */
    end(): void;
};

/** The real path of a `file:` address, or null for any other. */
function realOf(uri: unknown): string | null {
    if (typeof uri !== 'string' || !uri.startsWith('file:')) return null;
    try {
        return fileURLToPath(uri);
    } catch {
        return null;
    }
}

export class Notices {
    readonly #host: NoticeHost;
    #telling: Promise<void> = Promise.resolve();
    /** How many requests of the server to the relay are open. */
    #asks = 0;
    /** The files the server has read through the relay, by real path. */
    readonly #seen = new Set<string>();
    /** The files it was told changed or created and has not read since, with when it was told. */
    readonly #unread = new Map<string, number>();
    /** The calls of `caughtUp` waiting for the server to read them. */
    #waiting: (() => void)[] = [];
    /** The time each Markdown file was last written when `caughtUp` last looked; null until it. */
    #written: Written | null = null;

    constructor(host: NoticeHost) {
        this.#host = host;
    }

    /** Send a list of changes after the lists ahead of it. */
    tell(changes: FileChange[]): void {
        this.#telling = this.#telling.then(() => this.#send(changes));
    }

    /**
     * Tell the server of the files under folders the root watch saw, each with whether it is there
     * now: the files of a folder that is there and that the server has not read are created, the
     * files the server has read under a folder that is not there are deleted.
     */
    folders(folders: ReadonlyMap<string, boolean>): void {
        this.#telling = this.#telling.then(async () => {
            const changes: FileChange[] = [];
            for (const [folder, there] of folders) {
                changes.push(...(there ? await this.#created(folder) : this.#deleted(folder)));
            }
            if (changes.length > 0) await this.#send(changes);
        });
    }

    /** Drop what is kept of a file that is gone, told to the server apart from the lists. */
    forget(real: string): void {
        this.#seen.delete(real);
        this.#unread.delete(real);
        this.#written?.delete(real);
    }

    /**
     * A request of the server to the relay begins; the object returned ends it. The server asks for
     * the files it was told changed, and `caughtUp` waits for those requests.
     */
    asked(): Asked {
        this.#asks += 1;
        let fresh: string | null = null;
        return {
            read: (uri) => {
                const real = realOf(uri);
                if (real === null) return;
                this.#seen.add(real);
                if (this.#unread.has(real)) fresh = real;
            },
            end: () => {
                this.#asks -= 1;
                if (fresh !== null) this.#unread.delete(fresh);
                this.#check();
            }
        };
    }

    /**
     * Wait until the server has been told of every change to `files` (real paths): those the root
     * watch has seen, those in its quiet, and those written since the last call that the platform
     * has not reported yet. The first call tells the server of the files it has not read and takes
     * the times of the others. It then waits until the server has read, through the relay, each
     * file it was told changed or created, and has no request to the relay open, or SETTLE_MAX_MS
     * has passed. A request that depends on what the server holds of the files then sees them as
     * they are on disk.
     */
    async caughtUp(files: readonly string[]): Promise<void> {
        this.#host.flush();
        const present = files.filter((real) => !this.#host.open(real));
        const first = this.#written === null;
        const { changes, written } = writtenSince(present, this.#written);
        this.#written = written;
        if (first && this.#seen.size > 0) {
            for (const real of present) {
                if (!this.#seen.has(real)) {
                    changes.push({ uri: pathToFileURL(real).href, type: CREATED });
                }
            }
        }
        if (changes.length > 0) this.tell(changes);
        await this.#telling;
        await this.#read();
    }

    /** The created files under a folder that is there, among those the server has not read. */
    async #created(folder: string): Promise<FileChange[]> {
        if (this.#seen.size === 0) return [];
        let files: string[];
        try {
            files = await this.#host.filesUnder(folder);
        } catch {
            return [];
        }
        const fresh = files.filter((real) => !this.#seen.has(real) && !this.#host.open(real));
        if (this.#written !== null) {
            for (const [real, time] of writtenSince(fresh, null).written) {
                this.#written.set(real, time);
            }
        }
        return fresh.map((real) => ({ uri: pathToFileURL(real).href, type: CREATED }));
    }

    /** The deleted files under a folder that is not there, among those the server has read. */
    #deleted(folder: string): FileChange[] {
        return [...this.#seen]
            .filter((real) => real.startsWith(folder + sep))
            .map((real) => ({ uri: pathToFileURL(real).href, type: DELETED }));
    }

    /**
     * Ask what the entry words for the changes, each answered or given up on after INTRODUCE_MS,
     * then send the notice. The notice goes whatever the answers were. A changed file the server
     * has read is noted as unread ahead of the asks, and a created file once the asks are done, so
     * `caughtUp` waits for the read the server makes on taking the notice, never for the read an
     * ask caused before it.
     */
    async #send(changes: FileChange[]): Promise<void> {
        const asks = this.#host.introduce(changes);
        const created: string[] = [];
        for (const change of changes) {
            const real = realOf(change.uri);
            if (real === null) continue;
            if (change.type === DELETED) this.forget(real);
            else if (change.type === CHANGED && this.#seen.has(real)) {
                this.#unread.set(real, Date.now());
            } else if (change.type === CREATED && asks.length > 0) created.push(real);
        }
        if (asks.length > 0) {
            let handle: ReturnType<typeof setTimeout> | undefined;
            const bound = new Promise<void>((resolve) => {
                handle = setTimeout(resolve, INTRODUCE_MS);
                if (typeof handle === 'object' && typeof handle.unref === 'function') {
                    handle.unref();
                }
            });
            await Promise.race([
                Promise.all(asks.map((one) => this.#host.call(one.method, one.params))),
                bound
            ]);
            clearTimeout(handle);
        }
        const at = Date.now();
        for (const real of created) this.#unread.set(real, at);
        this.#host.notify({
            jsonrpc: '2.0',
            method: 'workspace/didChangeWatchedFiles',
            params: { changes }
        });
    }

    /**
     * Wait until the server has read each file it was told changed or created, as it asks the
     * relay for the bytes of a file, and has no request to the relay open: it answers requests
     * from what it has read only after that. A file it was told of longer ago than SETTLE_MAX_MS
     * is not waited for, and the wait itself ends after SETTLE_MAX_MS.
     */
    async #read(): Promise<void> {
        const now = Date.now();
        for (const [real, at] of this.#unread) {
            if (now - at > SETTLE_MAX_MS) this.#unread.delete(real);
        }
        if (this.#unread.size === 0) return;
        await new Promise<void>((resolve) => {
            const handle = setTimeout(resolve, SETTLE_MAX_MS);
            if (typeof handle === 'object' && typeof handle.unref === 'function') handle.unref();
            this.#waiting.push(() => {
                clearTimeout(handle);
                resolve();
            });
            this.#check();
        });
        this.#unread.clear();
    }

    /** End the waits of `caughtUp` once nothing is unread and no request is open. */
    #check(): void {
        if (this.#unread.size > 0 || this.#asks > 0) return;
        const waiting = this.#waiting;
        this.#waiting = [];
        for (const done of waiting) done();
    }
}
