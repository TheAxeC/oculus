// Layer 2, server. What the relay does with the messages a language server sends: the answer to a
// page's request, with the page's id put back and the addresses turned into the page's; a request
// of the server to its client, which is answered here and not forwarded (`workspace/configuration`
// from the registry, `client/registerCapability` as file watchers and as features the server
// declares, progress as `state` messages), except `workspace/applyEdit` and the two refreshes,
// which reach the page; and the diagnostics a server publishes.
//
// The features the servers of apps declare are registered with the page's client of each channel
// they serve, and withdrawn when no server of the page declares them: when a server answers
// `initialize`, registers or withdraws a feature, or is retired, and in full each time the page's
// client initializes the channel, since a new client the page makes on the same socket holds none
// of the registrations of the client it replaces.

import type { LspRpc } from '../../../../data/model/index.ts';
import { PUBLISHED, publish, type Publishing } from '../held/diagnostics/published.ts';
import { docKey, type Held, type Page, type Pending } from '../held/held.ts';
import { normal, toPage } from '../uris.ts';
import { editAddress, isRecord, languageOf } from '../wire.ts';
import { fileURLToPath } from 'node:url';
import { joinedDiagnostics, remainingDiagnostics } from '../held/diagnostics/published.ts';
import { appInfo, type CollectionHeard } from './relay-apps.ts';
import {
    complete,
    joinKind,
    joined,
    registrationsFor,
    tagged as tagItems,
    type Join
} from './relay-join.ts';
import { channelsOf, mapperOf, reply, rootsOf, send } from './relay-pages.ts';
import { METHOD_NOT_FOUND, type RelayState } from './relay-state.ts';

/** A message of a server, by what it is: an answer, a request of the client or a notification. */
export function fromServer(state: RelayState, held: Held, message: LspRpc): void {
    if (message.method === undefined) response(state, held, message);
    else if (message.id !== undefined && message.id !== null) serverRequest(state, held, message);
    else serverNotification(state, held, message);
}

/** What a server answered to a request, mapped to the page's addresses. */
function mappedResult(state: RelayState, held: Held, pending: Pending, answer: unknown): unknown {
    const shaped = held.pageVersions(
        held.entry.results === undefined
            ? answer
            : held.entry.results(pending.method, answer, held.root)
    );
    const tagged = appInfo(held.entry) !== undefined && joinKind(pending.method) === 'list';
    const result = toPage(
        tagged ? tagItems(shaped, held.entry.id) : shaped,
        mapperOf(state, pending.page, held, pending)
    );
    return result === null ? null : result.value;
}

/** A server's answer to one of the page's requests, with the page's id put back. */
function response(state: RelayState, held: Held, message: LspRpc): void {
    const pending = state.pending.get(Number(message.id));
    if (pending?.held !== held) return;
    state.pending.delete(Number(message.id));
    const join = pending.join;
    if (join !== undefined) {
        const part = join.parts.find((one) => one.relayId === Number(message.id));
        if (part === undefined) return;
        part.answered = true;
        if (message.error !== undefined) join.errors.push(message.error);
        else part.result = mappedResult(state, held, pending, message.result ?? null);
        settleJoin(state, join, join.timer === null);
        return;
    }
    if (message.error !== undefined) {
        send(state, pending.page, pending.channel, {
            jsonrpc: '2.0',
            id: pending.id,
            error: message.error
        });
        return;
    }
    reply(
        state,
        pending.page,
        pending.channel,
        pending.id,
        mappedResult(state, held, pending, message.result ?? null)
    );
}

/**
 * Answer a joined request when it can be answered: every server answered, or the bound passed and
 * the servers of oculus answered. Only errors from every server is an error.
 */
export function settleJoin(state: RelayState, join: Join, late: boolean): void {
    if (join.replied || !complete(join, late)) return;
    join.replied = true;
    if (join.timer !== null) clearTimeout(join.timer);
    join.timer = null;
    for (const part of join.parts) state.pending.delete(part.relayId);
    const answered = join.parts.some((part) => part.result !== null && part.result !== undefined);
    if (!answered && join.errors.length === join.parts.length && join.errors.length > 0) {
        const error = join.errors[0] as { code: number; message: string };
        send(state, join.page, join.channel, { jsonrpc: '2.0', id: join.id, error });
        return;
    }
    reply(state, join.page, join.channel, join.id, joined(join));
}

/** The page's channel for a document a server names, or its first channel of the entry. */
function channelFor(state: RelayState, held: Held, uri: unknown): string | null {
    const doc = typeof uri === 'string' ? held.docs.get(docKey(uri)) : undefined;
    const page = held.owner as Page | null;
    return doc?.channel ?? (page === null ? null : (channelsOf(page, held.entry)[0] ?? null));
}

function serverRequest(state: RelayState, held: Held, message: LspRpc): void {
    if (held.answer(message)) return;
    const params = isRecord(message.params) ? message.params : {};
    const page = held.owner as Page | null;
    const answer = (result: unknown): void =>
        held.notify({ jsonrpc: '2.0', id: message.id, result });
    switch (message.method) {
        case 'workspace/inlayHint/refresh':
        case 'workspace/semanticTokens/refresh':
            answer(null);
            toPageRequest(state, held, message, { value: message.params }, null);
            return;
        case 'workspace/applyEdit': {
            const edit = toPage(
                held.pageVersions(message.params),
                page === null
                    ? { roots: [], opened: () => undefined, alias: (root) => root.key }
                    : mapperOf(state, page, held)
            );
            if (
                edit === null ||
                !toPageRequest(state, held, message, edit, editAddress(params.edit))
            ) {
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
function toPageRequest(
    state: RelayState,
    held: Held,
    message: LspRpc,
    params: { value: unknown },
    uri: unknown
): boolean {
    const page = held.owner as Page | null;
    const channel = channelFor(state, held, uri);
    if (page === null || channel === null) return false;
    const waits = message.method === 'workspace/applyEdit' ? (message.id ?? null) : null;
    state.next += 1;
    const id = `oculus:${state.next}`;
    state.asks.set(id, { held, id: waits });
    send(state, page, channel, {
        jsonrpc: '2.0',
        id,
        method: message.method,
        params: params.value
    });
    return true;
}

function serverNotification(state: RelayState, held: Held, message: LspRpc): void {
    if (held.notice(message) || !PUBLISHED.includes(message.method ?? '')) return;
    publish(publishing(state), held, message);
}

function publishing(state: RelayState): Publishing {
    return {
        roots: () => rootsOf(state),
        catalog: () => state.options.catalog?.() ?? {},
        mapper: (page, held) => mapperOf(state, page, held),
        send: (page, channel, payload) => send(state, page, channel, payload)
    };
}

/**
 * A server answered `initialize`, registered or withdrew a feature after it, or was given a
 * document of a page that took it over. When it is an app's, the registrations of each language
 * channel it serves are brought in line with what the page's servers of apps declare.
 */
export function ready(state: RelayState, held: Held): void {
    if (appInfo(held.entry) === undefined) return;
    const page = held.owner as Page | null;
    if (page === null) return;
    for (const channel of channelsOf(page, held.entry)) align(state, page, channel, null);
}

/**
 * The page's client initialized a channel: every feature the page's servers of apps declare for
 * its language is registered with it, since it holds none yet.
 */
export function initialized(state: RelayState, page: Page, channel: string): void {
    page.registered.delete(channel);
    align(state, page, channel, null);
}

/**
 * Register with the page's client of a channel each feature a server of an app of the page declares
 * for the channel's language that oculus's own server of it does not and that is not registered
 * yet, and withdraw each registered one that no such server declares; `leaving` is a server being
 * retired, whose features are not counted.
 */
function align(state: RelayState, page: Page, channel: string, leaving: Held | null): void {
    const language = languageOf(channel);
    if (language === null) return;
    const own = state.servers.forLanguage(language);
    const present = own === undefined ? {} : own.capabilities(language);
    const wanted = new Map(
        [...new Set(page.helds.values())]
            .filter((one) => one !== leaving && appInfo(one.entry) !== undefined)
            .filter((one) => one.entry.languages.includes(language))
            .flatMap((one) => registrationsFor(one.capabilities, present, language))
            .map((one) => [one.id, one] as const)
    );
    const done = page.registered.get(channel) ?? new Map<string, string>();
    page.registered.set(channel, done);
    const registrations = [...wanted.values()].filter((one) => !done.has(one.id));
    const withdrawn = [...done].filter(([id]) => !wanted.has(id));
    for (const one of registrations) done.set(one.id, one.method);
    for (const [id] of withdrawn) done.delete(id);
    // The client's answers to these name no server that waits on them, and are dropped.
    if (registrations.length > 0) {
        state.next += 1;
        send(state, page, channel, {
            jsonrpc: '2.0',
            id: `oculus:${state.next}`,
            method: 'client/registerCapability',
            params: { registrations }
        });
    }
    if (withdrawn.length > 0) {
        state.next += 1;
        send(state, page, channel, {
            jsonrpc: '2.0',
            id: `oculus:${state.next}`,
            method: 'client/unregisterCapability',
            params: { unregisterations: withdrawn.map(([id, method]) => ({ id, method })) }
        });
    }
}

/**
 * A server of an app is not registered any more, or its app stopped acting. Its page is told it is
 * gone for each root and channel it was used under, the diagnostics of the documents it served
 * are replaced by those of the servers and collections that remain, and the capabilities it had
 * registered with the page's client are withdrawn unless another server of the page still
 * declares them.
 */
export function retired(
    state: RelayState,
    held: Held,
    roots: string[],
    documents: { uri: string; channel: string }[]
): void {
    const page = held.owner as Page | null;
    const info = appInfo(held.entry);
    if (page === null || info === undefined) return;
    for (const channel of channelsOf(page, held.entry)) {
        for (const root of roots) {
            send(state, page, channel, { oculus: 'gone', root, server: held.entry.id });
        }
        align(state, page, channel, held);
    }
    for (const { uri, channel } of documents) {
        const diagnostics = remainingDiagnostics(page, uri);
        if (diagnostics === null) continue;
        send(state, page, channel, {
            jsonrpc: '2.0',
            method: 'textDocument/publishDiagnostics',
            params: { uri, diagnostics }
        });
    }
}

/** The key a collection's diagnostics are kept under in a page's joined diagnostics. */
function collectionKey(heard: Pick<CollectionHeard, 'app' | 'collection'>): string {
    return `collection:${heard.app}:${heard.collection}`;
}

/** The diagnostics of a collection, sent to a page that holds the file open. */
function sendCollection(state: RelayState, page: Page, heard: CollectionHeard): void {
    let real: string;
    try {
        real = fileURLToPath(heard.uri);
    } catch {
        return;
    }
    const uri = page.opened.get(normal(real));
    const open = uri === undefined ? undefined : page.docs.get(uri);
    if (uri === undefined || open === undefined) return;
    const params = joinedDiagnostics(page, collectionKey(heard), {
        uri,
        diagnostics: heard.diagnostics.map((one) =>
            typeof one.source === 'string' ? one : { ...one, source: heard.collection }
        )
    });
    send(state, page, open.doc.channel, {
        jsonrpc: '2.0',
        method: 'textDocument/publishDiagnostics',
        params
    });
}

/** An app's collection was given diagnostics for a file: every page that holds it is told. */
export function collectionHeard(state: RelayState, heard: CollectionHeard): void {
    for (const page of state.pages.values()) sendCollection(state, page, heard);
}

/** A page opened a document: the diagnostics the collections hold for it are sent. */
export function replayCollections(state: RelayState, page: Page): void {
    for (const heard of state.appFeed?.collections() ?? []) sendCollection(state, page, heard);
}

/** A collection or a host went: the diagnostics of the ones that are gone leave the pages. */
export function refreshCollections(state: RelayState): void {
    const now = new Set((state.appFeed?.collections() ?? []).map(collectionKey));
    for (const page of state.pages.values()) {
        for (const [uri, kept] of page.joined) {
            const gone = [...kept.keys()].filter((key) => typeof key === 'string' && !now.has(key));
            if (gone.length === 0) continue;
            for (const key of gone) kept.delete(key);
            const open = page.docs.get(uri);
            if (open === undefined) continue;
            const params = joinedDiagnostics(page, gone[0], { uri, diagnostics: [] });
            kept.delete(gone[0]);
            const union = isRecord(params) ? params.diagnostics : [];
            send(state, page, open.doc.channel, {
                jsonrpc: '2.0',
                method: 'textDocument/publishDiagnostics',
                params: { uri, diagnostics: union }
            });
        }
    }
}
