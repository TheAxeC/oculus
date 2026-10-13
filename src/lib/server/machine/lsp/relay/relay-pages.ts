// Layer 2, server. The page sessions of the relay: one `Page` for each socket that spoke on an
// `lsp:` channel, the frames sent to it (one socket, in order, never merged), the roots it is
// served under, the mapper that turns a server's addresses into the page's, and what happens to a
// page's servers when its socket closes (they wait 60 s for another page to take them over).

import type { LspRpc, LspToPage } from '../../../../data/model/index.ts';
import type { Sink } from '../../../core/channels.ts';
import { LINGER_MS, type Held, type Page, type Pending } from '../held/held.ts';
import { libraryAddresses } from '../library/pages.ts';
import type { ServerEntry } from '../servers.ts';
import { normal, servedRoots, type Mapper, type ServedRoot } from '../uris.ts';
import { LSP_PREFIX, writeFrame } from '../wire.ts';
import { ROOTS_MS, emptyPage, type RelayState } from './relay-state.ts';

/** The page of a socket, made on its first frame. */
export function pageOf(state: RelayState, sink: Sink): Page {
    let page = state.pages.get(sink);
    if (page === undefined) {
        page = emptyPage(sink);
        state.pages.set(sink, page);
    }
    return page;
}

/** The served roots, read again when the last read is a second old. */
export function rootsOf(state: RelayState): ServedRoot[] {
    const at = state.now();
    if (state.served === null || at - state.served.at >= ROOTS_MS) {
        state.served = { at, roots: servedRoots(state.options.roots()) };
    }
    return state.served.roots;
}

/**
 * What turns a server's addresses into the page's. For the messages of `held`, a file outside
 * every root has the address of a token the page holds; when `asked` is the request the message
 * answers, a token is made for it too if the rules allow.
 */
export function mapperOf(state: RelayState, page: Page, held?: Held, asked?: Pending): Mapper {
    return {
        roots: rootsOf(state),
        opened: (real) => page.opened.get(normal(real)),
        alias: (root) => root.key,
        library: held === undefined ? undefined : libraryAddresses(state.library, page, held, asked)
    };
}

/** One frame to a page on a channel it has a session for. */
export function send(
    state: RelayState,
    page: Page,
    channel: string,
    payload: LspRpc | LspToPage
): void {
    const session = page.sessions.get(channel);
    if (session === undefined || state.pages.get(page.sink) !== page) return;
    session.version += 1;
    page.sink.send(writeFrame(channel, session.version, payload)).catch(() => undefined);
}

/** The result of a request of the page. */
export function reply(
    state: RelayState,
    page: Page,
    channel: string,
    id: LspRpc['id'],
    result: unknown
): void {
    send(state, page, channel, { jsonrpc: '2.0', id, result });
}

/** The error that answers a request of the page. */
export function fail(
    state: RelayState,
    page: Page,
    channel: string,
    id: LspRpc['id'],
    code: number,
    message: string
): void {
    send(state, page, channel, { jsonrpc: '2.0', id, error: { code, message } });
}

/** The channels of a page that speak a language the entry serves. */
export function channelsOf(page: Page, entry: ServerEntry): string[] {
    return entry.languages
        .map((language) => `${LSP_PREFIX}${language}`)
        .filter((channel) => page.sessions.has(channel));
}

/**
 * The id and name that tell a page which server of an app a message is about; none for oculus's.
 */
function nameOf(held: Held): { server?: string; name?: string } {
    return held.entry.source === undefined
        ? {}
        : { server: held.entry.id, name: held.entry.program };
}

/** A server's state, to each channel and root key its page uses it under. */
export function publishState(state: RelayState, held: Held): void {
    const page = held.owner as Page | null;
    if (page === null) return;
    const keys = new Set([...held.docs.values()].map((doc) => doc.pageRoot));
    const { state: now, done, total, code, program } = held.state;
    const legend = held.legendDue ? held.legend : null;
    const named = nameOf(held);
    held.legendDue = false;
    for (const channel of channelsOf(page, held.entry)) {
        for (const root of keys) {
            send(state, page, channel, {
                oculus: 'state',
                root,
                ...named,
                state: now,
                done,
                total,
                code,
                program
            });
            if (legend !== null) {
                send(state, page, channel, { oculus: 'legend', root, ...named, ...legend });
            }
        }
    }
}

/** New lines of a server's output, to the pages that asked for them. */
export function appendedOutput(state: RelayState, held: Held, lines: string[]): void {
    const page = held.owner as Page | null;
    if (page === null) return;
    for (const ask of page.outputs.get(held) ?? []) {
        send(state, page, ask.channel, {
            oculus: 'output',
            root: ask.root,
            ...nameOf(held),
            lines,
            append: true
        });
    }
}

/** A socket closed: its servers wait 60 s for another page to take them over. */
export function removePage(state: RelayState, sink: Sink): void {
    const page = state.pages.get(sink);
    if (page === undefined) return;
    state.pages.delete(sink);
    state.holding.delete(sink);
    for (const [id, pending] of state.pending) {
        if (pending.page !== page) continue;
        state.pending.delete(id);
        if (pending.join?.timer != null) clearTimeout(pending.join.timer);
        if (pending.join !== undefined) pending.join.replied = true;
    }
    for (const held of page.helds.values()) {
        for (const [id, ask] of state.asks) if (ask.held === held) state.asks.delete(id);
        held.owner = null;
        state.orphans.add(held);
        held.armEnd(LINGER_MS);
    }
    page.helds.clear();
    page.docs.clear();
    page.outputs.clear();
}
