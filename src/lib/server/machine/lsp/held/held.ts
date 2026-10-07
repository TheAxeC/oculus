// Layer 2, server. One language server as one page holds it: a registry entry running over one
// served root, with the documents the page has open on it, the state the status bar shows, the
// output of its stderr, and what it takes to keep it alive or end it.
//
// The relay (relay.ts) makes one of these for each page, root and registry entry, so
// a clangd serves the `c` and the `cpp` tabs of a root together and a pyright the Python tabs. It
// holds the text of every open document, kept up to date from the page's changes, because that
// text is what a server started again is opened with.
//
// A server ends 60 s after the last document of its root closes on the page unless a document
// opens inside the 60 s, and 60 s after its page's socket closes unless another page opens the
// same root and takes it over; the relay ends it at once when its root is no longer served (the
// page is told `root_gone`) and with the oculus server. A changed `lsp` folder ends it and, when
// its page has documents open in it, starts it again at once. One that exits on its own is started
// again on the next request of its page; a second exit within three minutes leaves it failed until
// the reader presses Restart.

import { basename } from 'node:path';
import type { watch } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import type { LspCode, LspRpc, LspState } from '../../../../data/model/index.ts';
import { OUTPUT_LINES, ServerProcess, type Spawn } from '../process.ts';
import type { Sink } from '../../../core/channels.ts';
import type { Library } from '../library/tokens.ts';
import type { Prepared, ServerEntry, Setup } from '../servers.ts';
import { RootWatch, globsOf, type FileChange } from './watch.ts';
import { normal, type ServedRoot } from '../uris.ts';

/** The milliseconds a server outlives its last document or its page. */
export const LINGER_MS = 60_000;

/** The span in which a second exit is not started again. */
const EXIT_SPAN_MS = 3 * 60_000;

/**
 * What a document is looked up by when a server names it: the path its `file://` address spells. A
 * server may write the same address with other percent-escapes than the ones it was given (pyright
 * writes `(` and `)` as `%28` and `%29`), so the address itself is not the key.
 */
export function docKey(fileUri: string): string {
    try {
        return fileURLToPath(fileUri);
    } catch {
        return fileUri;
    }
}

/** One document the page has open on a server. */
export type Doc = {
    /** The file's real path, in the operating system's spelling. */
    real: string;
    /** The `file://` URI a server knows it by. */
    fileUri: string;
    /** The page's URI, which locations in the file are answered in. */
    pageUri: string;
    /** The root key the page named. */
    pageRoot: string;
    /** The channel, `lsp:<language>`, of the language it was opened under. */
    channel: string;
    languageId: string;
    version: number;
    text: string;
};

/** What a held server asks of the relay. */
export type HeldHost = {
    spawn: Spawn;
    watchFolder?: typeof watch;
    /** The client capabilities the page sent, for the server's own `initialize`. */
    initialize(held: Held, setup: Setup): Record<string, unknown>;
    /** Find the program and read the root's settings for it. */
    prepare(held: Held): Promise<Prepared>;
    /** The state or the output changed. */
    changed(held: Held): void;
    /** Lines were appended to the output. */
    appended(held: Held, lines: string[]): void;
    /** A message from the server that is not the answer to something this module sent. */
    message(held: Held, message: LspRpc): void;
    /** The held server's process ended, for whatever reason, and what waited on it is answered. */
    stopped(held: Held): void;
    /** The held server is gone and will not come back. */
    gone(held: Held): void;
};

/** The state a status item shows, with what goes with it. */
export type HeldState = {
    state: LspState;
    code?: LspCode;
    program?: string;
    done?: number;
    total?: number;
};

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** The semantic tokens legend a server's `initialize` result declares, or null for none. */
function legendOf(result: unknown): { types: string[]; modifiers: string[] } | null {
    const capabilities = isRecord(result) ? result.capabilities : null;
    const provider = isRecord(capabilities) ? capabilities.semanticTokensProvider : null;
    const legend = isRecord(provider) ? provider.legend : null;
    if (!isRecord(legend)) return null;
    const strings = (value: unknown): string[] =>
        Array.isArray(value) ? value.filter((one): one is string => typeof one === 'string') : [];
    return { types: strings(legend.tokenTypes), modifiers: strings(legend.tokenModifiers) };
}

export class Held {
    readonly entry: ServerEntry;
    readonly root: ServedRoot;
    /** The page that holds it, null while no page does (the minute it waits to be taken over). */
    owner: object | null;
    state: HeldState = { state: 'starting' };
    /** The token types and modifiers the server answers semantic tokens in, once it is ready. */
    legend: { types: string[]; modifiers: string[] } | null = null;
    /** Whether the page has yet to be told the legend: set when the server is ready or adopted. */
    legendDue = false;
    readonly docs = new Map<string, Doc>();
    /** The last lines of the server's output. */
    readonly output: string[] = [];
    /** What the server last registered, by the id it registered with. */
    readonly registrations = new Map<string, string>();
    #host: HeldHost;
    #proc: ServerProcess | null = null;
    #setup: Setup | null = null;
    #early: LspRpc[] = [];
    #generation = 0;
    #timer: ReturnType<typeof setTimeout> | null = null;
    #exits: number[] = [];
    /** The server needs the reader's Restart: it exited twice within three minutes. */
    blocked = false;
    #wantsStart = false;
    #closed = false;
    #now: () => number;
    #progress = new Map<string, boolean>();
    #watch: RootWatch | null = null;

    constructor(
        entry: ServerEntry,
        root: ServedRoot,
        owner: object | null,
        host: HeldHost,
        now: () => number
    ) {
        this.entry = entry;
        this.root = root;
        this.owner = owner;
        this.#host = host;
        this.#now = now;
    }

    /** The server's pid, undefined while there is no process. */
    get pid(): number | undefined {
        return this.#proc?.pid;
    }

    /** Whether the server is running or about to: a message for it is held or sent. */
    get running(): boolean {
        return this.#proc?.alive === true || this.#wantsStart;
    }

    /** Whether the held server has ended for good. */
    get closed(): boolean {
        return this.#closed;
    }

    /** The setup the server was started with, null before it was prepared. */
    get setup(): Setup | null {
        return this.#setup;
    }

    /** Start the server, or start it again after it ended. */
    start(): void {
        if (this.#closed || this.#wantsStart) return;
        this.#wantsStart = true;
        this.#generation += 1;
        const mine = this.#generation;
        this.#set({ state: 'starting' });
        void this.#host.prepare(this).then((prepared) => {
            if (mine !== this.#generation || this.#closed) return;
            this.#wantsStart = false;
            if (!prepared.ok) {
                this.note(prepared.note);
                this.#set({
                    state: prepared.state,
                    code: prepared.code,
                    program: prepared.program
                });
                return;
            }
            if (prepared.note !== undefined) this.note(prepared.note);
            this.#spawn(prepared);
        });
    }

    /** The reader's Restart, and a change of what the server is started with. */
    async restart(): Promise<void> {
        this.blocked = false;
        this.#exits = [];
        await this.#stop();
        this.start();
    }

    /**
     * A changed `lsp` folder: the process and the wait to end are ended. With `again` the server
     * starts under the new folder at once and is given its documents again; without, it stays
     * ended and starts on the next request or document of its page, with no wait for a second exit
     * or for the reader's Restart left over.
     */
    async reload(again: boolean): Promise<void> {
        this.#clear();
        this.blocked = false;
        this.#exits = [];
        await this.#stop();
        if (again) this.start();
        else this.#set({ state: 'starting' });
    }

    /** The root is no longer served: the page is told so, and the server ends for good. */
    async lose(): Promise<void> {
        this.#set({ state: 'failed', code: 'root_gone' });
        await this.close();
    }

    /** End the server and everything of the held server, for good. */
    async close(): Promise<void> {
        this.#closed = true;
        this.#clear();
        this.docs.clear();
        await this.#stop();
        this.#host.gone(this);
    }

    /** Whether the server can be started again by a request: it never ran, or it exited once. */
    get #restartable(): boolean {
        if (this.blocked || this.#closed) return false;
        const { state, code } = this.state;
        return state === 'starting' || (state === 'failed' && code === 'exited');
    }

    /**
     * A request for the server, held until the process has answered `initialize`. A server that
     * exited is started again by the first request that finds it so, unless it exited twice in
     * three minutes. The answer is whether the request was accepted.
     */
    request(message: LspRpc): boolean {
        if (this.#proc?.alive === true) {
            this.#proc.send(message);
            return true;
        }
        if (!this.#restartable) return false;
        this.#early.push(message);
        this.start();
        return true;
    }

    /**
     * A notification for the server. One that finds no process is dropped: the documents hold the
     * text a started server is opened with, so nothing a notification carried is lost.
     */
    notify(message: LspRpc): void {
        if (this.#proc?.alive === true) this.#proc.send(message);
    }

    /** Put a document into the server, starting the server when it has none to put it into. */
    open(doc: Doc): void {
        this.docs.set(docKey(doc.fileUri), doc);
        if (this.#proc?.alive === true) this.#proc.send(openOf(doc));
        else if (this.#restartable) this.start();
    }

    /** What the server is given from now on: a change of the interpreter, for one. */
    update(setup: Setup): void {
        this.#setup = setup;
    }

    /**
     * A request of the server that is the registry's and the root's to answer and no page's: its
     * settings, its registrations, a progress token, the folders it serves. False for a request
     * that is the page's or that nothing handles, which the relay answers.
     */
    answer(message: LspRpc): boolean {
        const params = isRecord(message.params) ? message.params : {};
        const reply = (result: unknown): true => {
            this.notify({ jsonrpc: '2.0', id: message.id, result });
            return true;
        };
        switch (message.method) {
            case 'workspace/configuration': {
                const items = Array.isArray(params.items) ? params.items : [];
                const setup = this.#setup;
                return reply(
                    items.map((item) => {
                        const section = isRecord(item) ? item.section : undefined;
                        return setup === null || typeof section !== 'string'
                            ? null
                            : this.entry.configuration(section, setup);
                    })
                );
            }
            case 'client/registerCapability':
                this.#registered(params.registrations, true);
                return reply(null);
            case 'client/unregisterCapability':
                this.#registered(params.unregisterations, false);
                return reply(null);
            case 'window/workDoneProgress/create':
            case 'workspace/diagnostic/refresh':
            case 'window/showMessageRequest':
                return reply(null);
            case 'window/showDocument':
                return reply({ success: false });
            case 'workspace/workspaceFolders':
                return reply([
                    { uri: pathToFileURL(this.root.real).href, name: basename(this.root.real) }
                ]);
            default:
                return false;
        }
    }

    /** A notification of the server that is progress or a log line; false for any other. */
    notice(message: LspRpc): boolean {
        const params = isRecord(message.params) ? message.params : {};
        switch (message.method) {
            case '$/progress':
                this.progress(String(params.token), params.value);
                return true;
            case 'window/logMessage':
            case 'window/showMessage':
                this.note(
                    ...(typeof params.message === 'string' ? params.message : '').split('\n')
                );
                return true;
            default:
                return false;
        }
    }

    /** The server registered or dropped capabilities: only its file watchers matter here. */
    #registered(list: unknown, add: boolean): void {
        for (const one of Array.isArray(list) ? list : []) {
            if (!isRecord(one) || typeof one.id !== 'string') continue;
            if (one.method !== 'workspace/didChangeWatchedFiles') continue;
            if (!add) {
                this.#watch?.unregister(one.id);
                continue;
            }
            this.#watch ??= new RootWatch({
                root: this.root.real,
                open: (real) => this.docs.has(docKey(pathToFileURL(real).href)),
                changed: (changes: FileChange[]) =>
                    this.notify({
                        jsonrpc: '2.0',
                        method: 'workspace/didChangeWatchedFiles',
                        params: { changes }
                    }),
                watchFolder: this.#host.watchFolder
            });
            this.#watch.register(one.id, globsOf(one.registerOptions));
        }
    }

    /** Add lines to the output and tell the relay. */
    note(...lines: string[]): void {
        this.#append(lines);
    }

    /** One `$/progress` of the server: indexing is a title that begins and ends. */
    progress(token: string, value: unknown): void {
        const body = value as { kind?: string; message?: string; percentage?: number } | null;
        if (body === null || typeof body !== 'object') return;
        if (body.kind === 'end') {
            this.#progress.delete(token);
            if (this.#progress.size === 0 && this.state.state === 'indexing') {
                this.#set({ state: 'ready' });
            }
            return;
        }
        this.#progress.set(token, true);
        const counted = /^(\d+)\s*\/\s*(\d+)/.exec(body.message ?? '');
        const next: HeldState = { state: 'indexing' };
        if (counted !== null) {
            next.done = Number(counted[1]);
            next.total = Number(counted[2]);
        }
        this.#set(next);
    }

    /** Keep the server alive: it ends `ms` after this unless a document or a page keeps it. */
    armEnd(ms: number = LINGER_MS): void {
        this.#clear();
        this.#timer = setTimeout(() => {
            this.#timer = null;
            void this.close();
        }, ms);
        if (typeof this.#timer === 'object' && typeof this.#timer.unref === 'function') {
            this.#timer.unref();
        }
    }

    /** Take back the wait to end. */
    keep(): void {
        this.#clear();
    }

    /** Whether a wait to end is running. */
    get waiting(): boolean {
        return this.#timer !== null;
    }

    #clear(): void {
        if (this.#timer !== null) clearTimeout(this.#timer);
        this.#timer = null;
    }

    /** Make the process and open the documents in it. */
    #spawn(prepared: Extract<Prepared, { ok: true }>): void {
        this.#setup = prepared.setup;
        this.#progress.clear();
        const proc = new ServerProcess({
            launch: prepared.launch,
            spawn: this.#host.spawn,
            initialize: this.#host.initialize(this, prepared.setup),
            events: {
                message: (message) => {
                    if (this.#proc === proc) this.#host.message(this, message);
                },
                output: (lines) => this.#append(lines),
                ready: (result) => {
                    if (this.#proc !== proc) return;
                    this.legend = legendOf(result);
                    this.legendDue = this.legend !== null;
                    if (this.state.state === 'starting') this.#set({ state: 'ready' });
                },
                failed: (code, program) => {
                    if (this.#proc !== proc) return;
                    this.note(`${program}: ${code}`);
                    this.#set({
                        state: code === 'not_found' ? 'not_found' : 'failed',
                        code,
                        program
                    });
                },
                exited: (asked) => {
                    if (this.#proc !== proc) return;
                    this.#proc = null;
                    this.#host.stopped(this);
                    if (asked || this.#closed) return;
                    if (this.state.state === 'failed' || this.state.state === 'not_found') return;
                    this.#unexpected();
                }
            }
        });
        this.#proc = proc;
        proc.start();
        for (const doc of this.docs.values()) proc.send(openOf(doc));
        for (const message of this.#early.splice(0)) proc.send(message);
    }

    /** The server exited by itself: start it again on the next request, once. */
    #unexpected(): void {
        const now = this.#now();
        this.#exits = [...this.#exits.filter((at) => now - at < EXIT_SPAN_MS), now];
        this.blocked = this.#exits.length >= 2;
        this.note(
            `the server exited${this.blocked ? ' again, so it stays stopped until Restart' : ''}`
        );
        this.#set({ state: 'failed', code: 'exited' });
    }

    /** End the process of this server, if there is one. */
    async #stop(): Promise<void> {
        this.#generation += 1;
        this.#wantsStart = false;
        this.#early = [];
        this.#watch?.close();
        this.#watch = null;
        const proc = this.#proc;
        if (proc === null) return;
        await proc.end();
        if (this.#proc === proc) this.#proc = null;
    }

    #set(state: HeldState): void {
        this.state = state;
        this.#host.changed(this);
    }

    #append(lines: string[]): void {
        if (lines.length === 0) return;
        this.output.push(...lines);
        if (this.output.length > OUTPUT_LINES)
            this.output.splice(0, this.output.length - OUTPUT_LINES);
        this.#host.appended(this, lines);
    }
}

/** The `didOpen` that puts a document into a server. */
function openOf(doc: Doc): LspRpc {
    return {
        jsonrpc: '2.0',
        method: 'textDocument/didOpen',
        params: {
            textDocument: {
                uri: doc.fileUri,
                languageId: doc.languageId,
                version: doc.version,
                text: doc.text
            }
        }
    };
}

/** One change of a `didChange`: a range and its new text, or the whole text. */
export type ContentChange = {
    range?: {
        start: { line: number; character: number };
        end: { line: number; character: number };
    };
    text: string;
};

/** The offset of a position in a text, clamped to the text. */
function offsetOf(text: string, line: number, character: number): number {
    let at = 0;
    for (let row = 0; row < line; row += 1) {
        const next = text.indexOf('\n', at);
        if (next < 0) return text.length;
        at = next + 1;
    }
    return Math.min(at + character, text.length);
}

/** A text with the changes of one `didChange` applied in order. */
export function applyChanges(text: string, changes: readonly ContentChange[]): string {
    let result = text;
    for (const change of changes) {
        if (change.range === undefined) {
            result = change.text;
            continue;
        }
        const from = offsetOf(result, change.range.start.line, change.range.start.character);
        const to = offsetOf(result, change.range.end.line, change.range.end.character);
        result = result.slice(0, from) + change.text + result.slice(to);
    }
    return result;
}

// ------------------------------------------------------------------ what a page holds
// The relay (relay.ts) keeps these for each socket beside the servers above.

/** One client session of a page: the channel's frame count and what the page's client can do. */
export type Session = {
    version: number;
    capabilities: Record<string, unknown>;
};

/** A document of a page and the server it is open on. */
type Open = { held: Held; doc: Doc };

/** One socket's state. */
export type Page = {
    sink: Sink;
    sessions: Map<string, Session>;
    /** Its servers, by `heldKey`. */
    helds: Map<string, Held>;
    /** Its open documents, by the page's address. */
    docs: Map<string, Open>;
    /** The page's address of an open document, by its real path. */
    opened: Map<string, string>;
    /** The servers whose output the page asked for, with the channel and root key it asked on. */
    outputs: Map<Held, { channel: string; root: string }[]>;
    /** The servers ended because their root stopped being served, by `heldKey`. */
    stranded: Map<string, { entry: ServerEntry; roots: Set<string> }>;
    /** The library files the page was given addresses for, which end with the page. */
    library: Library;
};

/**
 * A page's request that is waiting for its server's answer, with the page's address of the document
 * it was made for, which a library file the answer names is minted under.
 */
export type Pending = {
    page: Page;
    channel: string;
    id: number | string | null;
    held: Held;
    address: string;
};

/** A server's request waiting for the page's answer, or one nobody waits for. */
export type Ask = { held: Held; id: number | string | null };

/** The key a server is held by: its entry and its root's real path. */
export function heldKey(entry: ServerEntry, root: ServedRoot): string {
    return `${entry.id}\0${normal(root.real)}`;
}
