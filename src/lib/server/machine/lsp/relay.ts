// Layer 2, server. The language server relay: the page talks LSP over its one socket on the channel
// `lsp:<language>`, and this holds the servers behind those channels. It is what
// server/root/socket.ts hands every frame of an `lsp:` channel to, and it is made once per server
// context.
//
// Per page it holds one client session for each language the page speaks and, below them, one
// language server for each served root and registry entry (held.ts), shared by the sessions of the
// languages the entry serves. It answers the page's `initialize` itself from the registry
// (servers.ts), starts a root's server on the first `didOpen` under that root, routes each message
// by the document it names, and rewrites the document addresses in both directions (uris.ts): the
// page speaks `oculus-file:` addresses and a server `file:` ones. Ids are remapped, so a page's ids
// and each server's own never meet. A frame is read only from a socket whose subscription carried
// the write token, and every frame goes to the one socket it is for, in order, never merged.
//
// What a server asks of its client is answered here and not forwarded: `workspace/configuration`
// from the registry, `client/registerCapability` (the file watchers become watch.ts's), progress
// as `state` messages. Only `workspace/applyEdit` and the two refreshes reach the page.
//
// A server's page is its owner. A page that closes leaves its servers to end 60 s later unless a
// page opens the same root and takes them over. A root that is no longer served ends its servers
// and each page is told `root_gone`, and told again when the root is served again so that it sends
// its open documents once more (`reconcile`); a changed `lsp` folder is `reload`'s. The choices of
// the interpreter and the compile database are choices.ts's, read when a server is made and written
// when the page chooses.

import type { watch } from 'node:fs';
import type { LspRpc, LspToPage, LspToServer } from '../../../data/model/index.ts';
import type { Sink } from '../../core/channels.ts';
import type { ChangeLog } from '../../core/changes.ts';
import type { Root } from '../../files/files.ts';
import { clangdAdapter } from './clangd/adapter.ts';
import { applyApprove, applyChoose, sendChoices } from './choices.ts';
import {
    Held,
    LINGER_MS,
    applyChanges,
    docKey,
    heldKey,
    type Ask,
    type Doc,
    type HeldHost,
    type Page,
    type Pending,
    type Session
} from './held.ts';
import { pyrightAdapter } from './pyright/adapter.ts';
import type { Run } from './pyright/interpreter.ts';
import { spawnChild, type Spawn } from './process.ts';
import {
    createServers,
    initializeParams,
    type Adapter,
    type Prepared,
    type RootEnv,
    type ServerEntry,
    type ServerId,
    type Servers,
    type Setup
} from './servers.ts';
import {
    normal,
    resolvePageUri,
    servedRoots,
    toPage,
    toServer,
    type Mapper,
    type ServedRoot
} from './uris.ts';
import {
    LSP_PREFIX,
    addressOf,
    isRecord,
    languageOf,
    readFrame,
    writeFrame,
    type Inbound
} from './wire.ts';

/** JSON-RPC error codes this module answers with. */
const METHOD_NOT_FOUND = -32601;
const INVALID_PARAMS = -32602;
const REQUEST_CANCELLED = -32800;

/** What each registry entry needs of a root. */
const ADAPTERS: Record<ServerId, Adapter> = { pyright: pyrightAdapter, clangd: clangdAdapter };

/** How long the served roots are remembered between two messages. */
const ROOTS_MS = 1000;

/** What the relay needs of the machine. */
export type RelayOptions = {
    /** The oculus folder, which holds `node_modules/pyright`. */
    oculus: string;
    /** The node that runs oculus. */
    node: string;
    /** The roots the file browser serves now. */
    roots: () => Root[];
    /** The folder the lsp key names, read at each use so a changed key is followed. */
    lspFolder: () => string;
    /** The approvals file. */
    approvals: () => string;
    /** The change log a choice is recorded in. */
    changes?: () => ChangeLog | undefined;
    /** How a child is made; the `node:child_process` one unless a test hands a stub. */
    spawn?: Spawn;
    /** The registry; `createServers` over `oculus` and `node` unless a test hands one. */
    servers?: Servers;
    /** How an interpreter is asked its version. */
    run?: Run;
    exists?: (path: string) => boolean;
    now?: () => number;
    watchFolder?: typeof watch;
};

export class Relay {
    #options: RelayOptions;
    #servers: Servers;
    #spawn: Spawn;
    #now: () => number;
    #pages = new Map<Sink, Page>();
    /** Every server there is, whoever holds it. */
    #helds = new Set<Held>();
    /** The servers whose page closed and that wait to be taken over or to end. */
    #orphans = new Set<Held>();
    #pending = new Map<number, Pending>();
    #asks = new Map<string, Ask>();
    #next = 0;
    #served: { at: number; roots: ServedRoot[] } | null = null;
    #host: HeldHost;
    #canWrite: (sink: Sink) => boolean = () => false;

    constructor(options: RelayOptions) {
        this.#options = options;
        this.#servers =
            options.servers ?? createServers({ oculus: options.oculus, node: options.node });
        this.#spawn = options.spawn ?? spawnChild;
        this.#now = options.now ?? Date.now;
        this.#host = {
            spawn: this.#spawn,
            initialize: (held, setup) => this.#initializeParams(held, setup),
            prepare: (held) => this.#prepare(held),
            changed: (held) => this.#publish(held),
            appended: (held, lines) => this.#appended(held, lines),
            message: (held, message) => this.#fromServer(held, message),
            watchFolder: options.watchFolder,
            stopped: (held) => this.#stopped(held),
            gone: (held) => this.#gone(held)
        };
    }

    // ------------------------------------------------------------------ what the socket calls

    /**
     * The socket's answer to whether a sink carried the write token, asked at each message. Until
     * the socket gives it, no sink may write.
     */
    gate(canWrite: (sink: Sink) => boolean): void {
        this.#canWrite = canWrite;
    }

    /**
     * One text from a socket. Answers whether it was a frame of an `lsp:` channel, which the
     * terminals then leave alone; a frame from a socket that did not carry the token is read and
     * dropped.
     */
    inbound(sink: Sink, data: string): boolean {
        const frame = readFrame(data);
        if (frame === null) return false;
        if (!this.#canWrite(sink) || frame.payload === null) return true;
        const language = languageOf(frame.channel);
        const entry = language === null ? undefined : this.#servers.forLanguage(language);
        if (language === null || entry === undefined) return true;
        const page = this.#page(sink);
        let session = page.sessions.get(frame.channel);
        if (session === undefined) {
            session = { version: 0, capabilities: {} };
            page.sessions.set(frame.channel, session);
        }
        const payload: Inbound = frame.payload;
        if (payload.kind === 'oculus') {
            this.#oculus(page, frame.channel, entry, payload.message).catch(() => undefined);
        } else {
            this.#rpc(page, frame.channel, language, entry, session, payload.message);
        }
        return true;
    }

    /** A socket closed: its servers wait 60 s for another page to take them over. */
    remove(sink: Sink): void {
        const page = this.#pages.get(sink);
        if (page === undefined) return;
        this.#pages.delete(sink);
        for (const [id, pending] of this.#pending)
            if (pending.page === page) this.#pending.delete(id);
        for (const held of page.helds.values()) {
            for (const [id, ask] of this.#asks) if (ask.held === held) this.#asks.delete(id);
            held.owner = null;
            this.#orphans.add(held);
            held.armEnd(LINGER_MS);
        }
        page.helds.clear();
        page.docs.clear();
        page.outputs.clear();
    }

    /**
     * The served roots changed. The server of a root that is not served any more ends, and its page
     * is told `root_gone` for each root key it used it under; a root key that is served again is
     * told to the page that was told it was gone, so the page re-sends its open documents.
     */
    reconcile(): void {
        this.#served = null;
        const served = this.#roots();
        const has = (real: string): boolean =>
            served.some((root) => normal(root.real) === normal(real));
        for (const held of this.#helds) {
            if (has(held.root.real)) continue;
            const page = held.owner as Page | null;
            const roots = new Set([...held.docs.values()].map((doc) => doc.pageRoot));
            if (page !== null && roots.size > 0) {
                page.stranded.set(heldKey(held.entry, held.root), { entry: held.entry, roots });
            }
            // The page's names for the lost server's documents leave now, not when its stop ends,
            // so a document the page opens again while it stops starts a new server.
            this.#release(held);
            void held.lose();
        }
        for (const page of this.#pages.values()) {
            for (const [key, one] of page.stranded) {
                for (const root of [...one.roots]) {
                    if (!served.some((now) => now.key === root)) continue;
                    one.roots.delete(root);
                    for (const channel of this.#channelsOf(page, one.entry)) {
                        this.#send(page, channel, { oculus: 'state', root, state: 'starting' });
                    }
                }
                if (one.roots.size === 0) page.stranded.delete(key);
            }
        }
    }

    /**
     * A changed `lsp` folder ends every server and clears the wait to end of each. One a page has
     * documents open in starts again at once under the new folder and is given them again; every
     * other server (one waiting to end, one that was not found, one stopped after two exits) is
     * left ended and starts on its next document.
     */
    reload(): void {
        for (const held of this.#helds) {
            if (held.owner === null || held.docs.size === 0) void held.close();
            else void held.reload(!held.blocked && held.state.state !== 'not_found');
        }
    }

    /** End every server and wait for them to be gone. */
    async close(): Promise<void> {
        await Promise.all([...this.#helds].map((held) => held.close()));
        this.#pages.clear();
    }

    /** The processes of the servers that are running, for a caller that counts them. */
    pids(): number[] {
        return [...this.#helds].flatMap((held) => (held.pid === undefined ? [] : [held.pid]));
    }

    // ------------------------------------------------------------------ pages and roots

    #page(sink: Sink): Page {
        let page = this.#pages.get(sink);
        if (page === undefined) {
            page = {
                sink,
                sessions: new Map(),
                helds: new Map(),
                docs: new Map(),
                opened: new Map(),
                outputs: new Map(),
                stranded: new Map()
            };
            this.#pages.set(sink, page);
        }
        return page;
    }

    /** The served roots, read again when the last read is a second old. */
    #roots(): ServedRoot[] {
        const at = this.#now();
        if (this.#served === null || at - this.#served.at >= ROOTS_MS) {
            this.#served = { at, roots: servedRoots(this.#options.roots()) };
        }
        return this.#served.roots;
    }

    #mapper(page: Page): Mapper {
        return {
            roots: this.#roots(),
            opened: (real) => page.opened.get(normal(real)),
            alias: (root) => root.key
        };
    }

    // ------------------------------------------------------------------ to the page

    #send(page: Page, channel: string, payload: LspRpc | LspToPage): void {
        const session = page.sessions.get(channel);
        if (session === undefined || this.#pages.get(page.sink) !== page) return;
        session.version += 1;
        page.sink.send(writeFrame(channel, session.version, payload)).catch(() => undefined);
    }

    #reply(page: Page, channel: string, id: LspRpc['id'], result: unknown): void {
        this.#send(page, channel, { jsonrpc: '2.0', id, result });
    }

    #fail(page: Page, channel: string, id: LspRpc['id'], code: number, message: string): void {
        this.#send(page, channel, { jsonrpc: '2.0', id, error: { code, message } });
    }

    /** The channels of a page that speak a language the entry serves. */
    #channelsOf(page: Page, entry: ServerEntry): string[] {
        return entry.languages
            .map((language) => `${LSP_PREFIX}${language}`)
            .filter((channel) => page.sessions.has(channel));
    }

    /** A server's state, to each channel and root key its page uses it under. */
    #publish(held: Held): void {
        const page = held.owner as Page | null;
        if (page === null) return;
        const keys = new Set([...held.docs.values()].map((doc) => doc.pageRoot));
        const { state, done, total, code, program } = held.state;
        const legend = held.legendDue ? held.legend : null;
        held.legendDue = false;
        for (const channel of this.#channelsOf(page, held.entry)) {
            for (const root of keys) {
                this.#send(page, channel, {
                    oculus: 'state',
                    root,
                    state,
                    done,
                    total,
                    code,
                    program
                });
                if (legend !== null) {
                    this.#send(page, channel, { oculus: 'legend', root, ...legend });
                }
            }
        }
    }

    /** New lines of a server's output, to the pages that asked for them. */
    #appended(held: Held, lines: string[]): void {
        const page = held.owner as Page | null;
        if (page === null) return;
        for (const ask of page.outputs.get(held) ?? []) {
            this.#send(page, ask.channel, {
                oculus: 'output',
                root: ask.root,
                lines,
                append: true
            });
        }
    }

    // ------------------------------------------------------------------ from the page

    #rpc(
        page: Page,
        channel: string,
        language: string,
        entry: ServerEntry,
        session: Session,
        message: LspRpc
    ): void {
        const method = message.method;
        if (method === undefined) {
            this.#answered(message);
            return;
        }
        switch (method) {
            // Each one is answered, a client the page makes again on the same socket included, and
            // none reaches a server, which was initialized when it started.
            case 'initialize':
                session.capabilities = isRecord(message.params)
                    ? ((message.params.capabilities as Record<string, unknown> | undefined) ?? {})
                    : {};
                this.#reply(page, channel, message.id, {
                    capabilities: entry.capabilities(language),
                    serverInfo: { name: 'oculus' }
                });
                return;
            case 'shutdown':
                this.#reply(page, channel, message.id, null);
                return;
            case 'initialized':
            case 'exit':
            case 'workspace/didChangeWorkspaceFolders':
            case 'workspace/didChangeWatchedFiles':
                return;
            case '$/cancelRequest':
                this.#cancel(page, channel, message.params);
                return;
            case 'textDocument/didOpen':
                this.#didOpen(page, channel, entry, message.params);
                return;
            case 'textDocument/didChange':
                this.#didChange(page, message.params);
                return;
            case 'textDocument/didClose':
                this.#didClose(page, message.params);
                return;
            default:
                this.#route(page, channel, message);
        }
    }

    /** The page's answer to something a server asked it: sent on to the server it came from. */
    #answered(message: LspRpc): void {
        const key = String(message.id);
        const ask = this.#asks.get(key);
        if (ask === undefined) return;
        this.#asks.delete(key);
        if (ask.id === null) return;
        const answer: LspRpc = { jsonrpc: '2.0', id: ask.id };
        if (message.error !== undefined) answer.error = message.error;
        else answer.result = message.result ?? null;
        ask.held.notify(answer);
    }

    /** A page's `$/cancelRequest`: its id, turned into the one its server was given. */
    #cancel(page: Page, channel: string, params: unknown): void {
        const id = isRecord(params) ? params.id : undefined;
        for (const [relayId, pending] of this.#pending) {
            if (pending.page === page && pending.channel === channel && pending.id === id) {
                pending.held.notify({
                    jsonrpc: '2.0',
                    method: '$/cancelRequest',
                    params: { id: relayId }
                });
            }
        }
    }

    /** A request or notification that names a document: routed to the server the document is on. */
    #route(page: Page, channel: string, message: LspRpc): void {
        const method = message.method ?? '';
        const isRequest = message.id !== undefined && message.id !== null;
        const address = addressOf(method, message.params);
        const open = address === null ? undefined : page.docs.get(address);
        if (open === undefined) {
            if (isRequest) {
                const text =
                    address === null ? `${method} names no document` : 'the document is not open';
                this.#fail(
                    page,
                    channel,
                    message.id,
                    address === null ? METHOD_NOT_FOUND : INVALID_PARAMS,
                    text
                );
            }
            return;
        }
        const params = toServer(message.params, this.#roots());
        if (params === null) {
            if (isRequest)
                this.#fail(page, channel, message.id, INVALID_PARAMS, 'an address is refused');
            return;
        }
        if (!isRequest) {
            open.held.notify({ jsonrpc: '2.0', method, params: params.value });
            return;
        }
        this.#next += 1;
        const accepted = open.held.request({
            jsonrpc: '2.0',
            id: this.#next,
            method,
            params: params.value
        });
        if (!accepted) {
            this.#fail(page, channel, message.id, REQUEST_CANCELLED, 'the server is not running');
            return;
        }
        this.#pending.set(this.#next, { page, channel, id: message.id ?? null, held: open.held });
    }

    /** A document opened in a tab: resolved, put on its root's server, which is started. */
    #didOpen(page: Page, channel: string, entry: ServerEntry, params: unknown): void {
        const document = isRecord(params) ? params.textDocument : null;
        if (!isRecord(document) || typeof document.uri !== 'string') return;
        const { uri, languageId, version, text } = document;
        if (typeof languageId !== 'string' || typeof version !== 'number') return;
        if (typeof text !== 'string' || page.docs.has(uri)) return;
        const resolved = resolvePageUri(uri, this.#roots());
        if (resolved === null) return;
        const key = heldKey(entry, resolved.root);
        const old = page.helds.get(key) ?? this.#adopt(page, key);
        const held = old ?? this.#make(page, entry, resolved.root, key);
        if (held.docs.has(docKey(resolved.fileUri))) {
            // The same file under another root key of an overlapping root: one document on the
            // server, and this address is another name for it.
            const first = page.opened.get(normal(resolved.real));
            const known = first === undefined ? undefined : page.docs.get(first);
            if (known !== undefined) page.docs.set(uri, known);
            return;
        }
        held.keep();
        const doc: Doc = {
            real: resolved.real,
            fileUri: resolved.fileUri,
            pageUri: uri,
            pageRoot: resolved.pageRoot,
            channel,
            languageId,
            version,
            text
        };
        page.docs.set(uri, { held, doc });
        page.opened.set(normal(resolved.real), uri);
        held.open(doc);
        // A server made now announces its state as it starts; one that was there already says
        // where it stands to the channel and root key this document opens on.
        if (old !== null) {
            held.legendDue = held.legend !== null;
            this.#publish(held);
        }
    }

    #make(page: Page, entry: ServerEntry, root: ServedRoot, key: string): Held {
        const held = new Held(entry, root, page, this.#host, this.#now);
        page.helds.set(key, held);
        this.#helds.add(held);
        return held;
    }

    /** A server whose page closed, taken over by the page that opens the same root: its old page's
     * documents are closed in it first. */
    #adopt(page: Page, key: string): Held | null {
        for (const held of this.#orphans) {
            if (`${held.entry.id}\0${normal(held.root.real)}` !== key) continue;
            this.#orphans.delete(held);
            held.keep();
            held.owner = page;
            for (const doc of held.docs.values()) {
                held.notify({
                    jsonrpc: '2.0',
                    method: 'textDocument/didClose',
                    params: { textDocument: { uri: doc.fileUri } }
                });
            }
            held.docs.clear();
            page.helds.set(key, held);
            return held;
        }
        return null;
    }

    #didChange(page: Page, params: unknown): void {
        if (!isRecord(params) || !isRecord(params.textDocument)) return;
        const uri = String(params.textDocument.uri);
        const open = page.docs.get(uri);
        const changes = params.contentChanges;
        if (open === undefined || !Array.isArray(changes)) return;
        // Only the address the document was opened under edits it; another name for it reads.
        if (page.opened.get(normal(open.doc.real)) !== uri) return;
        const version = Number(params.textDocument.version);
        open.doc.text = applyChanges(open.doc.text, changes);
        open.doc.version = version;
        open.held.notify({
            jsonrpc: '2.0',
            method: 'textDocument/didChange',
            params: {
                textDocument: { uri: open.doc.fileUri, version },
                contentChanges: changes
            }
        });
    }

    #didClose(page: Page, params: unknown): void {
        if (!isRecord(params) || !isRecord(params.textDocument)) return;
        const uri = String(params.textDocument.uri);
        const open = page.docs.get(uri);
        if (open === undefined) return;
        page.docs.delete(uri);
        const names = [...page.docs].filter(([, one]) => one === open).map(([name]) => name);
        if (names.length > 0) {
            // Another name of the document stays open, and takes over its edits.
            if (page.opened.get(normal(open.doc.real)) === uri)
                page.opened.set(normal(open.doc.real), names[0]);
            return;
        }
        page.opened.delete(normal(open.doc.real));
        open.held.docs.delete(docKey(open.doc.fileUri));
        open.held.notify({
            jsonrpc: '2.0',
            method: 'textDocument/didClose',
            params: { textDocument: { uri: open.doc.fileUri } }
        });
        if (open.held.docs.size === 0) open.held.armEnd();
    }

    // ------------------------------------------------------------------ the oculus messages

    /** The server of a root key the page named, and the root. */
    #heldOf(
        page: Page,
        entry: ServerEntry,
        key: string
    ): { root: ServedRoot | undefined; held: Held | undefined } {
        const root = this.#roots().find((one) => one.key === key);
        return {
            root,
            held: root === undefined ? undefined : page.helds.get(heldKey(entry, root))
        };
    }

    async #oculus(
        page: Page,
        channel: string,
        entry: ServerEntry,
        message: LspToServer
    ): Promise<void> {
        const { root, held } = this.#heldOf(page, entry, message.root);
        if (root === undefined) return;
        const adapter = ADAPTERS[entry.id];
        const env = this.#env(root);
        const send = (payload: LspToPage): void => this.#send(page, channel, payload);
        switch (message.oculus) {
            case 'restart':
                await held?.restart();
                return;
            case 'output':
            case 'output_off': {
                if (held === undefined) return;
                const asks = (page.outputs.get(held) ?? []).filter(
                    (ask) => ask.channel !== channel || ask.root !== message.root
                );
                if (message.oculus === 'output') {
                    asks.push({ channel, root: message.root });
                    this.#send(page, channel, {
                        oculus: 'output',
                        root: message.root,
                        lines: held.output,
                        append: false
                    });
                }
                page.outputs.set(held, asks);
                return;
            }
            case 'choices':
                await sendChoices(adapter, env, message.root, send);
                return;
            case 'choose':
                await applyChoose(adapter, env, message, held, this.#options.changes?.(), send);
                return;
            case 'approve':
                await applyApprove(adapter, env, message, held, send);
        }
    }

    #env(root: ServedRoot): RootEnv {
        return {
            root: root.real,
            lsp: this.#options.lspFolder(),
            approvals: this.#options.approvals(),
            run: this.#options.run,
            exists: this.#options.exists
        };
    }

    // ------------------------------------------------------------------ making a server

    /** What a server is started with: its program, and what its root's settings give it. */
    async #prepare(held: Held): Promise<Prepared> {
        return await ADAPTERS[held.entry.id].prepare(held.entry, this.#env(held.root));
    }

    /** The `initialize` request a server is given: the page's capabilities with what it needs. */
    #initializeParams(held: Held, setup: Setup): Record<string, unknown> {
        const page = held.owner as Page | null;
        const caps =
            (page === null ? [] : [...page.sessions])
                .filter(
                    ([channel]) =>
                        page !== null && this.#channelsOf(page, held.entry).includes(channel)
                )
                .map(([, session]) => session.capabilities)
                .find((one) => Object.keys(one).length > 0) ?? {};
        return initializeParams(held.entry, held.root.real, caps, setup);
    }

    // ------------------------------------------------------------------ from a server

    #fromServer(held: Held, message: LspRpc): void {
        if (message.method === undefined) this.#response(held, message);
        else if (message.id !== undefined && message.id !== null)
            this.#serverRequest(held, message);
        else this.#serverNotification(held, message);
    }

    /** A server's answer to one of the page's requests, with the page's id put back. */
    #response(held: Held, message: LspRpc): void {
        const pending = this.#pending.get(Number(message.id));
        if (pending?.held !== held) return;
        this.#pending.delete(Number(message.id));
        if (message.error !== undefined) {
            this.#send(pending.page, pending.channel, {
                jsonrpc: '2.0',
                id: pending.id,
                error: message.error
            });
            return;
        }
        const mapped = toPage(message.result ?? null, this.#mapper(pending.page));
        this.#reply(
            pending.page,
            pending.channel,
            pending.id,
            mapped === null ? null : mapped.value
        );
    }

    /** The page's channel for a document a server names, or its first channel of the entry. */
    #channelFor(held: Held, uri: unknown): string | null {
        const doc = typeof uri === 'string' ? held.docs.get(docKey(uri)) : undefined;
        const page = held.owner as Page | null;
        return (
            doc?.channel ?? (page === null ? null : (this.#channelsOf(page, held.entry)[0] ?? null))
        );
    }

    #serverRequest(held: Held, message: LspRpc): void {
        if (held.answer(message)) return;
        const params = isRecord(message.params) ? message.params : {};
        const page = held.owner as Page | null;
        const answer = (result: unknown): void =>
            held.notify({ jsonrpc: '2.0', id: message.id, result });
        switch (message.method) {
            case 'workspace/inlayHint/refresh':
            case 'workspace/semanticTokens/refresh':
                answer(null);
                this.#toPage(held, message, { value: message.params }, null);
                return;
            case 'workspace/applyEdit': {
                const edit = toPage(
                    message.params,
                    page === null
                        ? { roots: [], opened: () => undefined, alias: (root) => root.key }
                        : this.#mapper(page)
                );
                const uri =
                    isRecord(params.edit) && isRecord(params.edit.changes)
                        ? Object.keys(params.edit.changes)[0]
                        : undefined;
                if (edit === null || !this.#toPage(held, message, edit, uri)) {
                    answer({ applied: false, failureReason: 'the page holds no such document' });
                }
                return;
            }
            default:
                held.notify({
                    jsonrpc: '2.0',
                    id: message.id,
                    error: { code: METHOD_NOT_FOUND, message: `${message.method} is not handled` }
                });
        }
    }

    /**
     * Send a server's request to its page under an id of this relay's. `waits` is the server's id
     * when its answer is the page's, null for a refresh nobody waits on. False when there is no
     * channel to send it on.
     */
    #toPage(held: Held, message: LspRpc, params: { value: unknown }, uri: unknown): boolean {
        const page = held.owner as Page | null;
        const channel = this.#channelFor(held, uri);
        if (page === null || channel === null) return false;
        const waits = message.method === 'workspace/applyEdit' ? (message.id ?? null) : null;
        this.#next += 1;
        const id = `oculus:${this.#next}`;
        this.#asks.set(id, { held, id: waits });
        this.#send(page, channel, {
            jsonrpc: '2.0',
            id,
            method: message.method,
            params: params.value
        });
        return true;
    }

    #serverNotification(held: Held, message: LspRpc): void {
        if (held.notice(message)) return;
        if (
            message.method !== 'textDocument/publishDiagnostics' &&
            message.method !== 'textDocument/inactiveRegions'
        ) {
            return;
        }
        const params = isRecord(message.params) ? message.params : {};
        const page = held.owner as Page | null;
        const named = isRecord(params.textDocument) ? params.textDocument.uri : params.uri;
        const doc = held.docs.get(docKey(String(named)));
        const mapped = page === null ? null : toPage(message.params, this.#mapper(page));
        if (doc === undefined || page === null || mapped === null) return;
        this.#send(page, doc.channel, {
            jsonrpc: '2.0',
            method: message.method,
            params: mapped.value
        });
        // The other names the page has for the document are told the same.
        const first = isRecord(mapped.value) ? mapped.value.uri : undefined;
        for (const [name, open] of page.docs) {
            if (open.doc !== doc || name === first || !isRecord(mapped.value)) continue;
            this.#send(page, doc.channel, {
                jsonrpc: '2.0',
                method: message.method,
                params: { ...mapped.value, uri: name }
            });
        }
    }

    /** A server's process ended: what waited on it is answered with an error, or dropped. */
    #stopped(held: Held): void {
        for (const [id, pending] of this.#pending) {
            if (pending.held !== held) continue;
            this.#pending.delete(id);
            this.#fail(
                pending.page,
                pending.channel,
                pending.id,
                REQUEST_CANCELLED,
                'the server ended'
            );
        }
        for (const [id, ask] of this.#asks) if (ask.held === held) this.#asks.delete(id);
    }

    /** A server is gone for good: nothing refers to it. */
    #gone(held: Held): void {
        this.#helds.delete(held);
        this.#orphans.delete(held);
        this.#stopped(held);
        const page = held.owner as Page | null;
        if (page === null) return;
        page.outputs.delete(held);
        this.#release(held);
    }

    /** Drop the owning page's server entry and its names for that server's documents. */
    #release(held: Held): void {
        const page = held.owner as Page | null;
        if (page === null) return;
        const key = heldKey(held.entry, held.root);
        if (page.helds.get(key) === held) page.helds.delete(key);
        for (const [uri, open] of page.docs) {
            if (open.held !== held) continue;
            page.docs.delete(uri);
            if (page.opened.get(normal(open.doc.real)) === uri)
                page.opened.delete(normal(open.doc.real));
        }
    }
}

/** Make the relay of one server context. */
export function createRelay(options: RelayOptions): Relay {
    return new Relay(options);
}
