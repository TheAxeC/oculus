// Layer 2, server. The life of the language servers a relay holds. A server's page is its owner: a
// page that closes leaves its servers to end 60 s later unless a page opens the same root and takes
// them over (relay-pages.ts). A root that is no longer served ends its servers and each page is
// told `root_gone`, and told again when the root is served again so that it sends its open
// documents once more (`reconcile`); a changed `lsp` folder is `reload`'s. When the shipped
// settings or the schemas change, a running server that follows them asks its settings again. A
// server whose process ended answers what waited on it with an error, and one that is gone is
// forgotten by the relay and its page.

import { heldKey, type Held, type Page } from '../held/held.ts';
import { reconfigure } from '../choices.ts';
import { normal } from '../uris.ts';
import { envOf } from './relay-make.ts';
import { appInfo } from './relay-apps.ts';
import { attachMore } from './relay-route.ts';
import { refreshCollections, retired, settleJoin } from './relay-server.ts';
import { channelsOf, fail, rootsOf, send } from './relay-pages.ts';
import { REQUEST_CANCELLED, type RelayState } from './relay-state.ts';

/**
 * The shipped settings changed: a running server that follows a section of them, and would now
 * be answered differently, is told its settings changed and asks again. A server whose answer is
 * the same is told nothing.
 */
export function settingsChanged(state: RelayState): void {
    for (const held of state.helds) {
        if (held.takeSettingsChange()) {
            void reconfigure(held.entry.adapter, envOf(state, held.root), held);
        }
    }
}

/** The schemas changed: each running server that is answered from them asks its settings. */
export function schemasChanged(state: RelayState): void {
    for (const held of state.helds) {
        if (held.entry.requests === undefined || !held.running) continue;
        void reconfigure(held.entry.adapter, envOf(state, held.root), held);
    }
}

/**
 * The served roots changed. The server of a root that is not served any more ends, and its page
 * is told `root_gone` for each root key it used it under; a root key that is served again is
 * told to the page that was told it was gone, so the page re-sends its open documents.
 */
export function reconcile(state: RelayState): void {
    state.served = null;
    const served = rootsOf(state);
    const has = (real: string): boolean =>
        served.some((root) => normal(root.real) === normal(real));
    for (const held of state.helds) {
        if (has(held.root.real)) continue;
        const page = held.owner as Page | null;
        const roots = new Set([...held.docs.values()].map((doc) => doc.pageRoot));
        if (page !== null && roots.size > 0) {
            page.stranded.set(heldKey(held.entry, held.root), { entry: held.entry, roots });
        }
        // The page's names for the lost server's documents leave now, not when its stop ends,
        // so a document the page opens again while it stops starts a new server.
        release(held);
        void held.lose();
    }
    for (const page of state.pages.values()) {
        for (const [key, one] of page.stranded) {
            for (const root of [...one.roots]) {
                if (!served.some((now) => now.key === root)) continue;
                one.roots.delete(root);
                for (const channel of channelsOf(page, one.entry)) {
                    send(state, page, channel, { oculus: 'state', root, state: 'starting' });
                }
            }
            if (one.roots.size === 0) page.stranded.delete(key);
        }
    }
}

/**
 * A changed `lsp` folder ends every server and clears the wait to end of each. One a page has
 * documents open in starts again at once under the new folder and is given them again; every
 * other server (one waiting to end, one that was not found, one stopped after two exits) is left
 * ended and starts on its next document.
 */
export function reload(state: RelayState): void {
    for (const held of state.helds) {
        if (held.owner === null || held.docs.size === 0) void held.close();
        else void held.reload(!held.blocked && held.state.state !== 'not_found');
    }
}

/** A server's process ended: what waited on it is answered with an error, or dropped. */
export function stopped(state: RelayState, held: Held): void {
    for (const [id, pending] of state.pending) {
        if (pending.held !== held) continue;
        state.pending.delete(id);
        const join = pending.join;
        if (join !== undefined) {
            const part = join.parts.find((one) => one.relayId === id);
            if (part !== undefined) part.answered = true;
            settleJoin(state, join, join.timer === null);
            continue;
        }
        fail(
            state,
            pending.page,
            pending.channel,
            pending.id,
            REQUEST_CANCELLED,
            'the server ended'
        );
    }
    for (const [id, ask] of state.asks) if (ask.held === held) state.asks.delete(id);
}

/** A server is gone for good: nothing refers to it. */
export function gone(state: RelayState, held: Held): void {
    state.helds.delete(held);
    state.orphans.delete(held);
    stopped(state, held);
    const page = held.owner as Page | null;
    if (page === null) return;
    page.outputs.delete(held);
    release(held);
}

/**
 * Drop the owning page's server entry and its names for that server's documents. A document that
 * is open on other servers too stays, on them. The answer lists the page's names of the documents
 * that were open on the server, with the channel each was opened on.
 */
function release(held: Held): { uri: string; channel: string }[] {
    const page = held.owner as Page | null;
    const touched: { uri: string; channel: string }[] = [];
    if (page === null) return touched;
    const key = heldKey(held.entry, held.root);
    if (page.helds.get(key) === held) page.helds.delete(key);
    for (const [uri, open] of page.docs) {
        const all = [open, ...open.also];
        const rest = all.filter((one) => one.held !== held);
        if (rest.length === all.length) continue;
        touched.push({ uri, channel: open.doc.channel });
        page.joined.get(uri)?.delete(held);
        if (rest.length > 0) {
            open.held = rest[0].held;
            open.doc = rest[0].doc;
            open.also = rest.slice(1);
            continue;
        }
        page.docs.delete(uri);
        if (page.opened.get(normal(open.doc.real)) === uri)
            page.opened.delete(normal(open.doc.real));
    }
    return touched;
}

/**
 * The servers apps registered changed, or an app stopped acting. A server that is not registered
 * any more ends, and the documents the pages hold open are put on the servers that serve them now.
 */
export function appsChanged(state: RelayState): void {
    if (state.apps === undefined) return;
    const current = new Set(state.apps.all());
    for (const held of [...state.helds]) {
        if (appInfo(held.entry) === undefined || current.has(held.entry)) continue;
        const roots = [...new Set([...held.docs.values()].map((doc) => doc.pageRoot))];
        const touched = release(held);
        retired(state, held, roots, touched);
        void held.close();
    }
    for (const page of state.pages.values()) {
        for (const open of new Set(page.docs.values())) attachMore(state, page, open);
    }
    refreshCollections(state);
}
