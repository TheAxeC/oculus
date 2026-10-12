// Layer 2, server. The language server relay: the page talks LSP over its one socket on the channel
// `lsp:<language>`, and this holds the servers behind those channels. It is what
// server/root/socket.ts hands every frame of an `lsp:` channel to, and it is made once per server
// context.
//
// Per page it holds one client session for each language the page speaks and, below them, one
// language server for each served root and registry entry (held/held.ts), shared by the sessions of
// the languages the entry serves. It answers the page's `initialize` itself from the registry
// (servers.ts), starts a root's server on the first `didOpen` under that root, routes each message
// by the document it names, and rewrites the document addresses in both directions (uris.ts): the
// page speaks `oculus-file:` addresses and a server `file:` ones. Ids are remapped, so a page's ids
// and each server's own never meet. A frame is read only from a socket whose subscription carried
// the write token, and every frame goes to the one socket it is for, in order, never merged.
//
// A file outside every served root that a server names in an answer reaches the page as a library
// address, `oculus-lib:///<token>/<file name>` (library/), and the page reads it over the same
// channel with `{ oculus: 'read' }`; the tokens are the page's, minted only in answers.
//
// An entry may answer a request of the page itself (`answers`) before it reaches a server, from the
// reference index of the latest build and the texts of the page's tabs (held/answers.ts): the YAML
// entry for a hub key, the Markdown for a backticked path, with its server running or not.
//
// What a server asks of its client is answered here and not forwarded: `workspace/configuration`
// from the registry, `client/registerCapability` (the file watchers become held/watch.ts's),
// progress as `state` messages. Only `workspace/applyEdit` and the two refreshes reach the page.
//
// An entry may refuse a file (`refuses`: texlab's Sweave files), and may filter the diagnostics of
// a file before the page sees them (`diagnostics`: texlab's own are kept, those it reads from the
// build log are dropped; texlab runs no ChkTeX, whose findings are the linter's). A server whose
// answer to a section of `workspace/configuration` follows the shipped settings (texlab's build
// folders) is told `workspace/didChangeConfiguration` once when `settingsChanged` finds the answer
// would now differ, and nothing when it would not.
//
// A server's page is its owner. A page that closes leaves its servers to end 60 s later unless a
// page opens the same root and takes them over. A root that is no longer served ends its servers
// and each page is told `root_gone`, and told again when the root is served again so that it sends
// its open documents once more (`reconcile`); a changed `lsp` folder is `reload`'s. The choices of
// the interpreter and the compile database are choices.ts's, read when a server is made and written
// when the page chooses.

import type { LspRpc, LspToPage } from '../../../data/model/index.ts';
import type { Sink } from '../../core/channels.ts';
import { WORKSPACE_LANGUAGE } from '../../../data/prose/lsp-servers.ts';
import { reconfigure } from './choices.ts';
import { answerFor } from './held/answers.ts';
import { adoptHeld, changeDocument, closeDocument, openingTarget } from './held/documents.ts';
import { PUBLISHED, publish, type Publishing } from './held/diagnostics/published.ts';
import { workspaceMessage } from './held/elsewhere.ts';
import { askLinks, type LinksContext } from './held/requests/links.ts';
import { handleOculus, heldOf, type OculusContext } from './held/oculus.ts';
import {
    Held,
    LINGER_MS,
    docKey,
    heldKey,
    type Ask,
    type Doc,
    type HeldHost,
    type Page,
    type Pending,
    type Session
} from './held/held.ts';
import { libraryAddresses, libraryFile, type LibraryContext } from './library/pages.ts';
import { Library } from './library/tokens.ts';
import { spawnChild, type Spawn } from './held/process.ts';
import type { RelayOptions } from './relay-options.ts';
import {
    createServers,
    initializeParams,
    type PageAnswer,
    type RootEnv,
    type ServerEntry,
    type Servers,
    type Setup
} from './servers.ts';
import {
    normal,
    parsePageUri,
    servedRoots,
    toPage,
    toServer,
    type Mapper,
    type ServedRoot
} from './uris.ts';
import {
    HIERARCHY,
    LSP_PREFIX,
    addressOf,
    editAddress,
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

/** How long the served roots are remembered between two messages. */
const ROOTS_MS = 1000;

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
    #library: LibraryContext;
    #canWrite: (sink: Sink) => boolean = () => false;
    #unsubscribe: (() => void) | undefined;

    constructor(options: RelayOptions) {
        this.#options = options;
        this.#servers =
            options.servers ??
            createServers({
                oculus: options.oculus,
                node: options.node,
                latex: options.latex,
                markdown: options.markdown
            });
        this.#spawn = options.spawn ?? spawnChild;
        this.#now = options.now ?? Date.now;
        this.#library = { roots: () => this.#roots(), rules: options.library };
        const feed = options.schemas;
        this.#host = {
            spawn: this.#spawn,
            roots: () => this.#roots(),
            initialize: (held, setup) => this.#initializeParams(held, setup),
            prepare: async (held) =>
                await held.entry.adapter.prepare(held.entry, this.#env(held.root)),
            changed: (held) => this.#publish(held),
            appended: (held, lines) => this.#appended(held, lines),
            message: (held, message) => this.#fromServer(held, message),
            watchFolder: options.watchFolder,
            schemas: feed === undefined ? undefined : () => feed.current(),
            stopped: (held) => this.#stopped(held),
            gone: (held) => this.#gone(held)
        };
        this.#unsubscribe = feed?.subscribe(() => this.#schemasChanged());
    }

    /**
     * The shipped settings changed: a running server that follows a section of them, and would now
     * be answered differently, is told its settings changed and asks again. A server whose answer
     * is the same is told nothing.
     */
    settingsChanged(): void {
        for (const held of this.#helds) {
            if (held.takeSettingsChange()) {
                void reconfigure(held.entry.adapter, this.#env(held.root), held);
            }
        }
    }

    /** The schemas changed: each running server that is answered from them asks its settings. */
    #schemasChanged(): void {
        for (const held of this.#helds) {
            if (held.entry.requests === undefined || !held.running) continue;
            void reconfigure(held.entry.adapter, this.#env(held.root), held);
        }
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
        if (language === null || (entry === undefined && language !== WORKSPACE_LANGUAGE)) {
            return true;
        }
        const page = this.#page(sink);
        let session = page.sessions.get(frame.channel);
        if (session === undefined) {
            session = { version: 0, capabilities: {} };
            page.sessions.set(frame.channel, session);
        }
        if (entry === undefined) {
            workspaceMessage(this.#pages.values(), page, this.#roots(), frame.payload, (payload) =>
                this.#send(page, frame.channel, payload)
            );
            return true;
        }
        const payload: Inbound = frame.payload;
        if (payload.kind === 'oculus' && payload.message.oculus === 'links') {
            void askLinks(this.#linksContext(), page, frame.channel, entry, payload.message);
        } else if (payload.kind === 'oculus') {
            handleOculus(this.#oculusContext(), page, frame.channel, entry, payload.message).catch(
                () => undefined
            );
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
        this.#unsubscribe?.();
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
                stranded: new Map(),
                library: new Library(),
                tabs: new Set()
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

    /**
     * What turns a server's addresses into the page's. For the messages of `held`, a file outside
     * every root has the address of a token the page holds; when `asked` is the request the
     * message answers, a token is made for it too if the rules allow.
     */
    #mapper(page: Page, held?: Held, asked?: Pending): Mapper {
        return {
            roots: this.#roots(),
            opened: (real) => page.opened.get(normal(real)),
            alias: (root) => root.key,
            library:
                held === undefined ? undefined : libraryAddresses(this.#library, page, held, asked)
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
                changeDocument(page, message.params);
                return;
            case 'textDocument/didClose':
                closeDocument(page, message.params);
                return;
            default:
                this.#route(page, channel, entry, message);
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

    /**
     * A request or notification that names a document: routed to the server the document is on. A
     * request about the workspace (its symbols) and a follow-up of a hierarchy item name a root and
     * a file that may be open in no tab, and go to the server of that root.
     */
    #route(page: Page, channel: string, entry: ServerEntry, message: LspRpc): void {
        const method = message.method ?? '';
        const isRequest = message.id !== undefined && message.id !== null;
        const given = isRequest ? this.#givenBy(page, entry, method, message.params) : undefined;
        if (given !== undefined) {
            if ('result' in given) this.#reply(page, channel, message.id, given.result);
            else this.#fail(page, channel, message.id, given.error.code, given.error.message);
            return;
        }
        const address = addressOf(method, message.params);
        const open = address === null ? undefined : page.docs.get(address);
        const held = open?.held ?? this.#heldFor(page, entry, method, message.params, address);
        if (held === undefined) {
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
        const params = toServer(this.#asked(method, message.params), this.#roots(), (uri) =>
            libraryFile(page, held, uri)
        );
        if (params === null) {
            if (isRequest)
                this.#fail(page, channel, message.id, INVALID_PARAMS, 'an address is refused');
            return;
        }
        if (!isRequest) {
            held.notify({ jsonrpc: '2.0', method, params: params.value });
            return;
        }
        this.#next += 1;
        const accepted = held.request({
            jsonrpc: '2.0',
            id: this.#next,
            method,
            params: params.value
        });
        if (!accepted) {
            this.#fail(page, channel, message.id, REQUEST_CANCELLED, 'the server is not running');
            return;
        }
        this.#pending.set(this.#next, {
            page,
            channel,
            id: message.id ?? null,
            held,
            method,
            address: address ?? ''
        });
    }

    /** What the entry answers to a request itself, from the latest build and the page's tabs. */
    #givenBy(
        page: Page,
        entry: ServerEntry,
        method: string,
        params: unknown
    ): PageAnswer | undefined {
        const answering = {
            roots: this.#roots(),
            feed: this.#options.schemas,
            catalog: this.#options.catalog,
            pages: () => this.#pages.values()
        };
        return answerFor(entry, page, answering, { method, params });
    }

    /**
     * The server a request that names no open document is for: the one of the root a
     * `workspace/symbol` names, or of the file a hierarchy follow-up's item names.
     */
    #heldFor(
        page: Page,
        entry: ServerEntry,
        method: string,
        params: unknown,
        address: string | null
    ): Held | undefined {
        if (method === 'workspace/symbol') {
            const key = isRecord(params) && typeof params.root === 'string' ? params.root : null;
            return key === null ? undefined : heldOf(this.#roots(), page, entry, key).held;
        }
        if (!HIERARCHY.includes(method) || address === null) return undefined;
        const named = parsePageUri(address);
        return named === null ? undefined : heldOf(this.#roots(), page, entry, named.root).held;
    }

    /** What a request carries to its server: `workspace/symbol` without the root that routed it. */
    #asked(method: string, params: unknown): unknown {
        if (method !== 'workspace/symbol' || !isRecord(params)) return params;
        const sent = { ...params };
        delete sent.root;
        return sent;
    }

    /**
     * A document opened in a tab: resolved, put on its root's server, which is started. A library
     * document is put on the server of the root that named it.
     */
    #didOpen(page: Page, channel: string, entry: ServerEntry, params: unknown): void {
        const document = isRecord(params) ? params.textDocument : null;
        if (!isRecord(document) || typeof document.uri !== 'string') return;
        const { uri, languageId, version, text } = document;
        if (typeof languageId !== 'string' || typeof version !== 'number') return;
        if (typeof text !== 'string' || page.docs.has(uri)) return;
        const target = openingTarget(this.#roots(), page, channel, entry, uri);
        if (target === null || entry.refuses?.(target.real, this.#roots()) === true) return;
        const key = heldKey(entry, target.root);
        const old = page.helds.get(key) ?? adoptHeld(page, key, this.#orphans);
        const held = old ?? this.#make(page, entry, target.root, key);
        this.#openOn(page, held, old !== null, {
            real: target.real,
            fileUri: target.fileUri,
            pageRoot: target.pageRoot,
            pageUri: uri,
            channel,
            languageId,
            version,
            shift: 0,
            text
        });
    }

    /**
     * Put a document on a server. `existed` is whether the server was there before this document:
     * one that was says where it stands to the channel and root key the document opens on, and one
     * made now announces its state as it starts.
     */
    #openOn(page: Page, held: Held, existed: boolean, doc: Doc): void {
        if (held.docs.has(docKey(doc.fileUri))) {
            // The same file under another root key of an overlapping root: one document on the
            // server, and this address is another name for it.
            const first = page.opened.get(normal(doc.real));
            const known = first === undefined ? undefined : page.docs.get(first);
            if (known !== undefined) page.docs.set(doc.pageUri, known);
            return;
        }
        held.keep();
        page.docs.set(doc.pageUri, { held, doc });
        page.opened.set(normal(doc.real), doc.pageUri);
        held.open(doc);
        if (existed) {
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

    // ------------------------------------------------------------------ the oculus messages

    #oculusContext(): OculusContext {
        return {
            roots: () => this.#roots(),
            env: (root) => this.#env(root),
            changes: () => this.#options.changes?.(),
            send: (page, channel, payload) => this.#send(page, channel, payload)
        };
    }

    #linksContext(): LinksContext {
        return {
            ...this.#oculusContext(),
            extensions: () => this.#options.markdown?.() ?? ['md'],
            orphans: this.#orphans,
            make: (page, entry, root, key) => this.#make(page, entry, root, key),
            mapper: (page, held) => this.#mapper(page, held)
        };
    }

    #env(root: ServedRoot): RootEnv {
        return {
            root: root.real,
            lsp: this.#options.lspFolder(),
            approvals: this.#options.approvals(),
            env: this.#options.env ?? process.env,
            run: this.#options.run,
            exists: this.#options.exists
        };
    }

    // ------------------------------------------------------------------ making a server

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
        const answer = message.result ?? null;
        const result = held.pageVersions(
            held.entry.results === undefined
                ? answer
                : held.entry.results(pending.method, answer, held.root)
        );
        const mapped = toPage(result, this.#mapper(pending.page, held, pending));
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
                    held.pageVersions(message.params),
                    page === null
                        ? { roots: [], opened: () => undefined, alias: (root) => root.key }
                        : this.#mapper(page, held)
                );
                if (edit === null || !this.#toPage(held, message, edit, editAddress(params.edit))) {
                    answer({
                        applied: false,
                        failureReason: 'the edit names a file the page lacks'
                    });
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
        if (held.notice(message) || !PUBLISHED.includes(message.method ?? '')) return;
        publish(this.#publishing(), held, message);
    }

    #publishing(): Publishing {
        return {
            roots: () => this.#roots(),
            catalog: () => this.#options.catalog?.() ?? {},
            mapper: (page, held) => this.#mapper(page, held),
            send: (page, channel, payload) => this.#send(page, channel, payload)
        };
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
