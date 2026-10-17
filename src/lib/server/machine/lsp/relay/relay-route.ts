// Layer 2, server. The routing of a page's messages: one text from a socket on an `lsp:` channel is
// read as a frame, and its message is answered by the relay (`initialize`, `shutdown`), applied to
// the page's documents (`didOpen`, `didChange`, `didClose`, `didSave`), turned into an answer of
// the entry's own (`answers`), or routed by the document it names to the server that holds the
// document, with the addresses turned into the server's and the id into one of the relay's, the
// entry's own result for it (`adds`) kept to be joined to the server's answer. A request about the
// workspace (its symbols) and a follow-up of a hierarchy item name a root and a file that may be
// open in no tab, and go to the server of that root. A request for a feature no server of an app it
// would go to declared is answered with no result (relay-join.ts), and each `initialize` of the
// page's client is followed by the registrations of the features the page's servers of apps declare
// (relay-server.ts).

import type { LspRpc } from '../../../../data/model/index.ts';
import { WORKSPACE_LANGUAGE } from '../../../../data/prose/lsp-servers.ts';
import type { Sink } from '../../../core/channels.ts';
import { addedFor, answerFor, type Answering } from '../held/answers.ts';
import { merged } from '../held/requests/merged.ts';
import {
    adoptHeld,
    changeDocument,
    closeDocument,
    openingTarget,
    saveDocument
} from '../held/documents.ts';
import { workspaceMessage } from '../held/elsewhere.ts';
import { askLinks, type LinksContext } from '../held/requests/links.ts';
import { handleOculus, heldOf, type OculusContext } from '../held/oculus.ts';
import {
    docKey,
    heldKey,
    type Doc,
    type Held,
    type Open,
    type Page,
    type Session
} from '../held/held.ts';
import { libraryFile } from '../library/pages.ts';
import type { PageAnswer, ServerEntry } from '../servers.ts';
import { appInfo, entriesFor, selects } from './relay-apps.ts';
import {
    JOIN_MS,
    declares,
    declaring,
    joinKind,
    resolveOf,
    untagged,
    type Join
} from './relay-join.ts';
import { normal, parsePageUri, toServer } from '../uris.ts';
import { HIERARCHY, addressOf, isRecord, languageOf, readFrame, type Inbound } from '../wire.ts';
import { envOf, makeHeld } from './relay-make.ts';
import { initialized, ready, replayCollections, settleJoin } from './relay-server.ts';
import { fail, mapperOf, pageOf, publishState, reply, rootsOf, send } from './relay-pages.ts';
import {
    INVALID_PARAMS,
    METHOD_NOT_FOUND,
    REQUEST_CANCELLED,
    type RelayState
} from './relay-state.ts';

/**
 * One text from a socket. Answers whether it was a frame of an `lsp:` channel, which the
 * terminals then leave alone; a frame from a socket that did not carry the token is read and
 * dropped.
 */
export function inbound(state: RelayState, sink: Sink, data: string): boolean {
    const frame = readFrame(data);
    if (frame === null) return false;
    if (!state.canWrite(sink) || frame.payload === null) return true;
    const language = languageOf(frame.channel);
    const entries = language === null ? [] : entriesFor(state, language);
    if (language === null || (entries.length === 0 && language !== WORKSPACE_LANGUAGE)) {
        return true;
    }
    const page = pageOf(state, sink);
    let session = page.sessions.get(frame.channel);
    if (session === undefined) {
        session = { version: 0, capabilities: {} };
        page.sessions.set(frame.channel, session);
    }
    if (entries.length === 0) {
        workspaceMessage(state.pages.values(), page, rootsOf(state), frame.payload, (payload) =>
            send(state, page, frame.channel, payload)
        );
        return true;
    }
    const payload: Inbound = frame.payload;
    if (payload.kind === 'oculus' && payload.message.oculus === 'links') {
        void askLinks(linksContext(state), page, frame.channel, entries[0], payload.message);
    } else if (payload.kind === 'oculus') {
        const server = 'server' in payload.message ? payload.message.server : undefined;
        const entry = entries.find((one) => one.id === server) ?? entries[0];
        handleOculus(oculusContext(state), page, frame.channel, entry, payload.message).catch(
            () => undefined
        );
    } else {
        rpc(state, page, frame.channel, language, entries, session, payload.message);
    }
    return true;
}

/** What the oculus messages of the page read of the relay. */
function oculusContext(state: RelayState): OculusContext {
    return {
        roots: () => rootsOf(state),
        env: (root) => envOf(state, root),
        changes: () => state.options.changes?.(),
        send: (page, channel, payload) => send(state, page, channel, payload)
    };
}

/** What the link rewrite of a move reads of the relay. */
function linksContext(state: RelayState): LinksContext {
    return {
        ...oculusContext(state),
        extensions: () => state.options.markdown?.() ?? ['md'],
        orphans: state.orphans,
        make: (page, entry, root, key) => makeHeld(state, page, entry, root, key),
        mapper: (page, held) => mapperOf(state, page, held)
    };
}

function rpc(
    state: RelayState,
    page: Page,
    channel: string,
    language: string,
    entries: readonly ServerEntry[],
    session: Session,
    message: LspRpc
): void {
    const entry = entries[0];
    const method = message.method;
    if (method === undefined) {
        answered(state, message);
        return;
    }
    switch (method) {
        // Each one is answered, a client the page makes again on the same socket included, and
        // none reaches a server, which was initialized when it started.
        case 'initialize':
            session.capabilities = isRecord(message.params)
                ? ((message.params.capabilities as Record<string, unknown> | undefined) ?? {})
                : {};
            reply(state, page, channel, message.id, {
                capabilities: entry.capabilities(language),
                serverInfo: { name: 'oculus' }
            });
            initialized(state, page, channel);
            return;
        case 'shutdown':
            reply(state, page, channel, message.id, null);
            return;
        case 'initialized':
        case 'exit':
        case 'workspace/didChangeWorkspaceFolders':
        case 'workspace/didChangeWatchedFiles':
            return;
        case '$/cancelRequest':
            cancel(state, page, channel, message.params);
            return;
        case 'textDocument/didOpen':
            didOpen(state, page, channel, language, entries, message.params);
            return;
        case 'textDocument/didChange':
            changeDocument(page, message.params);
            return;
        case 'textDocument/didClose':
            closeDocument(page, message.params);
            return;
        case 'textDocument/didSave':
            saveDocument(page, message.params);
            return;
        default:
            route(state, page, channel, language, entries, message);
    }
}

/** The page's answer to something a server asked it: sent on to the server it came from. */
function answered(state: RelayState, message: LspRpc): void {
    const key = String(message.id);
    const ask = state.asks.get(key);
    if (ask === undefined) return;
    state.asks.delete(key);
    if (ask.id === null) return;
    const answer: LspRpc = { jsonrpc: '2.0', id: ask.id };
    if (message.error !== undefined) answer.error = message.error;
    else answer.result = message.result ?? null;
    ask.held.notify(answer);
}

/** A page's `$/cancelRequest`: its id, turned into the one its server was given. */
function cancel(state: RelayState, page: Page, channel: string, params: unknown): void {
    const id = isRecord(params) ? params.id : undefined;
    for (const [relayId, pending] of state.pending) {
        if (pending.page === page && pending.channel === channel && pending.id === id) {
            pending.held.notify({
                jsonrpc: '2.0',
                method: '$/cancelRequest',
                params: { id: relayId }
            });
        }
    }
}

/** A request or notification that names a document: routed to the servers the document is on. */
function route(
    state: RelayState,
    page: Page,
    channel: string,
    language: string,
    entries: readonly ServerEntry[],
    message: LspRpc
): void {
    const method = message.method ?? '';
    const isRequest = message.id !== undefined && message.id !== null;
    const entry = entries[0];
    const resolved = untagged(method, message.params);
    const given =
        isRequest && appInfo(entry) === undefined
            ? givenBy(state, page, entry, method, resolved.params)
            : undefined;
    if (given !== undefined) {
        if ('result' in given) reply(state, page, channel, message.id, given.result);
        else fail(state, page, channel, message.id, given.error.code, given.error.message);
        return;
    }
    const adds =
        isRequest && appInfo(entry) === undefined
            ? addedFor(entry, page, answeringOf(state), { method, params: resolved.params })
            : undefined;
    const alone = (): void => reply(state, page, channel, message.id, merged(method, adds, null));
    const address = addressOf(method, resolved.params);
    const open = address === null ? undefined : page.docs.get(address);
    const targets = open === undefined ? [] : [open.held, ...open.also.map((one) => one.held)];
    let held: Held | undefined;
    let joinWith: Held[] = [];
    if (open !== undefined) {
        const asked = resolveOf(method) ?? method;
        const offering = declaring(targets, asked, language);
        if (resolved.entryId !== null) {
            held = targets.find((one) => one.entry.id === resolved.entryId) ?? open.held;
        } else if (resolveOf(method) !== undefined) {
            held = targets[0];
        } else if (offering.length === 0) {
            held = open.held;
        } else if (offering.length === 1 || joinKind(method) === 'first') {
            held = offering[0];
        } else {
            held = offering[0];
            joinWith = offering;
        }
    } else {
        held = heldFor(state, page, entries, method, language, resolved.params, address);
    }
    // A server of an app is asked only for a feature it declared; when the server a request would
    // go to is an app's that did not, no server declared it and the page is answered with no
    // result. What a starting server declares is known once it answered `initialize`, so the
    // request is routed then, and answered with no result when the server ends without an answer.
    if (
        held !== undefined &&
        isRequest &&
        appInfo(held.entry) !== undefined &&
        !declares(held, resolveOf(method) ?? method, language)
    ) {
        const starting = held;
        held.whenDeclared((known) => {
            if (known && declares(starting, resolveOf(method) ?? method, language)) {
                route(state, page, channel, language, entries, message);
            } else alone();
        });
        return;
    }
    if (held === undefined) {
        if (isRequest && adds !== undefined) alone();
        else if (isRequest) {
            const text =
                address === null ? `${method} names no document` : 'the document is not open';
            fail(
                state,
                page,
                channel,
                message.id,
                address === null ? METHOD_NOT_FOUND : INVALID_PARAMS,
                text
            );
        }
        return;
    }
    const sendTo = (to: Held): { value: unknown } | null =>
        toServer(asked(method, resolved.params), rootsOf(state), (uri) =>
            libraryFile(page, to, uri)
        );
    if (!isRequest) {
        for (const to of joinWith.length > 1 ? joinWith : [held]) {
            const params = sendTo(to);
            if (params !== null) to.notify({ jsonrpc: '2.0', method, params: params.value });
        }
        return;
    }
    if (joinWith.length > 1) {
        requestJoined(state, page, channel, message, joinWith, address ?? '', sendTo, adds);
        return;
    }
    const params = sendTo(held);
    if (params === null) {
        fail(state, page, channel, message.id, INVALID_PARAMS, 'an address is refused');
        return;
    }
    state.next += 1;
    const accepted = held.request({
        jsonrpc: '2.0',
        id: state.next,
        method,
        params: params.value
    });
    if (!accepted && adds !== undefined) alone();
    if (!accepted) {
        if (adds === undefined) {
            fail(state, page, channel, message.id, REQUEST_CANCELLED, 'the server is not running');
        }
        return;
    }
    state.pending.set(state.next, {
        page,
        channel,
        id: message.id ?? null,
        held,
        method,
        address: address ?? '',
        adds
    });
}

/**
 * A request several servers answer: each is asked, and the page is answered once, when all have
 * answered or when the bound has passed for the apps' servers (relay-join.ts).
 */
function requestJoined(
    state: RelayState,
    page: Page,
    channel: string,
    message: LspRpc,
    helds: readonly Held[],
    address: string,
    sendTo: (held: Held) => { value: unknown } | null,
    adds: unknown
): void {
    const method = message.method ?? '';
    const join: Join = {
        page,
        channel,
        id: message.id ?? null,
        method,
        parts: [],
        timer: null,
        replied: false,
        errors: [],
        adds
    };
    for (const held of helds) {
        const params = sendTo(held);
        if (params === null) continue;
        state.next += 1;
        const part = { held, relayId: state.next, answered: false, result: null as unknown };
        join.parts.push(part);
        const accepted = held.request({
            jsonrpc: '2.0',
            id: state.next,
            method,
            params: params.value
        });
        if (!accepted) {
            part.answered = true;
            continue;
        }
        state.pending.set(state.next, { page, channel, id: join.id, held, method, address, join });
    }
    if (join.parts.length === 0) {
        fail(state, page, channel, message.id, INVALID_PARAMS, 'an address is refused');
        return;
    }
    join.timer = setTimeout(() => {
        join.timer = null;
        for (const part of join.parts) {
            if (part.answered || appInfo(part.held.entry) === undefined) continue;
            part.held.notify({
                jsonrpc: '2.0',
                method: '$/cancelRequest',
                params: { id: part.relayId }
            });
            part.answered = true;
            state.pending.delete(part.relayId);
        }
        settleJoin(state, join, true);
    }, JOIN_MS);
    if (typeof join.timer === 'object' && typeof join.timer.unref === 'function')
        join.timer.unref();
    settleJoin(state, join, false);
}

/** What an entry's own answers read of the relay: the latest build and the page's tabs. */
function answeringOf(state: RelayState): Answering {
    return {
        roots: rootsOf(state),
        feed: state.options.schemas,
        catalog: state.options.catalog,
        pages: () => state.pages.values()
    };
}

/** What the entry answers to a request itself, from the latest build and the page's tabs. */
function givenBy(
    state: RelayState,
    page: Page,
    entry: ServerEntry,
    method: string,
    params: unknown
): PageAnswer | undefined {
    return answerFor(entry, page, answeringOf(state), { method, params });
}

/** The server of the root a page names by its key, if the page holds one of the entry. */
function heldOfRoot(state: RelayState, page: Page, entry: ServerEntry, key: string) {
    return heldOf(rootsOf(state), page, entry, key).held;
}

/**
 * The server a request that names no open document is for: the one of the root a
 * `workspace/symbol` names, or of the file a hierarchy follow-up's item names, the first entry's
 * that declared the feature, else the first entry's that has one; or the server that offers the
 * command a `workspace/executeCommand` names.
 */
function heldFor(
    state: RelayState,
    page: Page,
    entries: readonly ServerEntry[],
    method: string,
    language: string,
    params: unknown,
    address: string | null
): Held | undefined {
    const ofRoot = (key: string): Held | undefined => {
        const helds = entries
            .map((entry) => heldOfRoot(state, page, entry, key))
            .filter((one): one is Held => one !== undefined);
        return declaring(helds, method, language)[0] ?? helds[0];
    };
    if (method === 'workspace/symbol') {
        const key = isRecord(params) && typeof params.root === 'string' ? params.root : null;
        return key === null ? undefined : ofRoot(key);
    }
    if (method === 'workspace/executeCommand' && address === null && isRecord(params)) {
        return [...page.helds.values()].find(
            (held) =>
                entries.includes(held.entry) &&
                offeredCommands(held).includes(String(params.command))
        );
    }
    if (!HIERARCHY.includes(method) || address === null) return undefined;
    const named = parsePageUri(address);
    return named === null ? undefined : ofRoot(named.root);
}

/** The commands a server can be asked to run: its entry's, or those its `initialize` declared. */
function offeredCommands(held: Held): readonly string[] {
    if (appInfo(held.entry) === undefined) return held.entry.commands;
    const provider = held.capabilities.executeCommandProvider;
    const list = isRecord(provider) ? provider.commands : undefined;
    return Array.isArray(list) ? list.filter((one): one is string => typeof one === 'string') : [];
}

/** What a request carries to its server: `workspace/symbol` without the root that routed it. */
function asked(method: string, params: unknown): unknown {
    if (method !== 'workspace/symbol' || !isRecord(params)) return params;
    const sent = { ...params };
    delete sent.root;
    return sent;
}

/**
 * A document opened in a tab: resolved, put on the server of its root for each entry that serves
 * the language and selects the file, and the servers are started. A library document is put on
 * the server of the root that named it. An app's server takes only a document under a root of the
 * app's scope.
 */
function didOpen(
    state: RelayState,
    page: Page,
    channel: string,
    language: string,
    entries: readonly ServerEntry[],
    params: unknown
): void {
    const document = isRecord(params) ? params.textDocument : null;
    if (!isRecord(document) || typeof document.uri !== 'string') return;
    const { uri, languageId, version, text } = document;
    if (typeof languageId !== 'string' || typeof version !== 'number') return;
    if (typeof text !== 'string' || page.docs.has(uri)) return;
    const opens: { held: Held; existed: boolean; doc: Doc }[] = [];
    for (const entry of entries) {
        const placed = place(state, page, channel, language, entry, {
            uri,
            languageId,
            version,
            text
        });
        if (placed !== null) opens.push(placed);
    }
    if (opens.length === 0) return;
    openOn(state, page, opens);
    replayCollections(state, page);
}

/** The text a document is opened with on a server, as the page holds it. */
type Opening = { uri: string; languageId: string; version: number; text: string };

/**
 * The server of an entry for a document, made or taken over, with the document as that server
 * holds it; null when the entry does not take the file: it refuses it, the root is outside the
 * app's scope or the app's selector does not select it.
 */
function place(
    state: RelayState,
    page: Page,
    channel: string,
    language: string,
    entry: ServerEntry,
    opening: Opening
): { held: Held; existed: boolean; doc: Doc } | null {
    const target = openingTarget(rootsOf(state), page, channel, entry, opening.uri);
    if (target === null || entry.refuses?.(target.real, rootsOf(state)) === true) return null;
    const info = appInfo(entry);
    if (info !== undefined) {
        if (info.root !== '' && info.root !== target.root.key) return null;
        if (!selects(info, language, target.real)) return null;
    }
    const key = heldKey(entry, target.root);
    const old = page.helds.get(key) ?? adoptHeld(page, key, state.orphans);
    return {
        held: old ?? makeHeld(state, page, entry, target.root, key),
        existed: old !== null,
        doc: {
            real: target.real,
            fileUri: target.fileUri,
            pageRoot: target.pageRoot,
            pageUri: opening.uri,
            channel,
            languageId: opening.languageId,
            version: opening.version,
            shift: 0,
            text: opening.text
        }
    };
}

/**
 * Open a document that is already open on some servers on the ones that serve it now and do not
 * hold it: an app registered a server, or a host started, while the page held the document.
 */
export function attachMore(state: RelayState, page: Page, open: Open): void {
    const language = languageOf(open.doc.channel);
    if (language === null) return;
    const have = new Set([open.held, ...open.also.map((one) => one.held)].map((one) => one.entry));
    for (const entry of entriesFor(state, language)) {
        if (have.has(entry)) continue;
        const placed = place(state, page, open.doc.channel, language, entry, {
            uri: open.doc.pageUri,
            languageId: open.doc.languageId,
            version: open.doc.version - open.doc.shift,
            text: open.doc.text
        });
        if (placed === null || placed.held.docs.has(docKey(placed.doc.fileUri))) continue;
        placed.held.keep();
        placed.held.open(placed.doc);
        open.also.push({ held: placed.held, doc: placed.doc, also: [] });
        if (placed.existed) {
            ready(state, placed.held);
            publishState(state, placed.held);
        }
    }
}

/**
 * A lent document the page opens, made the page's: under the page's address and channel, and with
 * the text the page opens it with put on its server at a version above the one it was lent at,
 * from which the page's own versions follow.
 */
function takeText(open: Open, opening: Doc): Open {
    const { held, doc } = open;
    doc.pageUri = opening.pageUri;
    doc.pageRoot = opening.pageRoot;
    doc.channel = opening.channel;
    doc.shift = Math.max(doc.shift, doc.version + 1 - opening.version);
    if (doc.text === opening.text) {
        held.versioned(doc, opening.version);
        return open;
    }
    doc.text = opening.text;
    held.notify({
        jsonrpc: '2.0',
        method: 'textDocument/didChange',
        params: {
            textDocument: { uri: doc.fileUri, version: held.versioned(doc, opening.version) },
            contentChanges: [{ text: opening.text }]
        }
    });
    return open;
}

/**
 * Put a document on its servers. `existed` is whether a server was there before this document:
 * one that was says where it stands to the channel and root key the document opens on, and one
 * made now announces its state as it starts.
 */
function openOn(
    state: RelayState,
    page: Page,
    opens: { held: Held; existed: boolean; doc: Doc }[]
): void {
    const [first] = opens;
    if (first.held.docs.has(docKey(first.doc.fileUri))) {
        // The same file under another root key of an overlapping root: one document on the
        // server, and this address is another name for it. A document a link request lent the
        // server under this address (held/requests/links.ts) is the page's from now on, at the
        // text the page opens it with.
        const real = normal(first.doc.real);
        const known = page.opened.get(real);
        const lent = first.held.docs.get(docKey(first.doc.fileUri));
        const open =
            known !== undefined
                ? page.docs.get(known)
                : lent === undefined
                  ? undefined
                  : takeText({ held: first.held, doc: lent, also: [] }, first.doc);
        if (open === undefined) return;
        page.docs.set(first.doc.pageUri, open);
        page.opened.set(real, page.opened.get(real) ?? first.doc.pageUri);
        return;
    }
    const made: Open[] = opens.map(({ held, doc }) => ({ held, doc, also: [] }));
    const open = made[0];
    open.also = made.slice(1);
    page.docs.set(first.doc.pageUri, open);
    page.opened.set(normal(first.doc.real), first.doc.pageUri);
    for (const { held, existed, doc } of opens) {
        held.keep();
        held.open(doc);
        if (existed) {
            held.legendDue = held.legend !== null;
            // A server taken over from a page that went has its features registered with that
            // page's client only, so they are registered with this page's.
            ready(state, held);
            publishState(state, held);
        }
    }
}
