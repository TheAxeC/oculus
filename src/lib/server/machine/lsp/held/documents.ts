// Layer 2, server. What the page's `didChange`, `didClose` and `didSave` do to the documents it
// holds, and a server a closed page left taken over by the page that opens the same root. The relay
// (relay/relay.ts) routes the messages; these keep the page's table of open documents (held.ts
// `Page`) and the text each server holds for them in step, whichever address a document was opened
// under.

import { pathToFileURL } from 'node:url';
import { isLibraryAddress } from '../library/address.ts';
import type { ServerEntry } from '../servers.ts';
import { normal, resolvePageUri, type ServedRoot } from '../uris.ts';
import { isRecord, languageOf } from '../wire.ts';
import { Held, applyChanges, docKey, heldKey, type Page } from './held.ts';

/**
 * What a document address names: the file, the root key the page used, and the root whose server
 * holds it.
 */
export type Target = { root: ServedRoot; real: string; fileUri: string; pageRoot: string };

/**
 * What the address of a document the page opens names, or null for one that does not resolve. A
 * library address is the page's own token, for the channel's language and the root of the server
 * that named the file, and it opens no document on another server.
 */
export function openingTarget(
    roots: readonly ServedRoot[],
    page: Page,
    channel: string,
    entry: ServerEntry,
    uri: string
): Target | null {
    if (!isLibraryAddress(uri)) {
        const resolved = resolvePageUri(uri, roots);
        if (resolved === null) return null;
        const { root, real, fileUri, pageRoot } = resolved;
        return { root, real, fileUri, pageRoot };
    }
    const token = page.library.get(uri);
    if (token === undefined) return null;
    if (token.language !== languageOf(channel)) return null;
    const root = roots.find((one) => heldKey(entry, one) === token.server);
    if (root === undefined) return null;
    return {
        root,
        real: token.real,
        fileUri: pathToFileURL(token.real).href,
        pageRoot: token.root
    };
}

/**
 * The page's `textDocument/didChange`: the text the server holds follows it, and the server is
 * told.
 */
export function changeDocument(page: Page, params: unknown): void {
    if (!isRecord(params) || !isRecord(params.textDocument)) return;
    const uri = String(params.textDocument.uri);
    const open = page.docs.get(uri);
    const changes = params.contentChanges;
    if (open === undefined || !Array.isArray(changes)) return;
    // Only the address the document was opened under edits it; another name for it reads.
    if (page.opened.get(normal(open.doc.real)) !== uri) return;
    for (const one of [open, ...open.also]) {
        const version = one.held.versioned(one.doc, Number(params.textDocument.version));
        one.doc.text = applyChanges(one.doc.text, changes);
        one.held.notify({
            jsonrpc: '2.0',
            method: 'textDocument/didChange',
            params: {
                textDocument: { uri: one.doc.fileUri, version },
                contentChanges: changes
            }
        });
        one.held.edited(one.doc);
    }
}

/**
 * The page's `textDocument/didSave`: each server the document is on whose `initialize` declared
 * `save` in its `textDocumentSync` is told, with the text when it asks for it (`includeText`).
 */
export function saveDocument(page: Page, params: unknown): void {
    if (!isRecord(params) || !isRecord(params.textDocument)) return;
    const open = page.docs.get(String(params.textDocument.uri));
    if (open === undefined) return;
    const text = typeof params.text === 'string' ? params.text : undefined;
    for (const one of [open, ...open.also]) {
        const sync = one.held.capabilities.textDocumentSync;
        const save = isRecord(sync) ? sync.save : undefined;
        if (save === undefined || save === null || save === false) continue;
        const wanted = isRecord(save) && save.includeText === true && text !== undefined;
        one.held.notify({
            jsonrpc: '2.0',
            method: 'textDocument/didSave',
            params: { textDocument: { uri: one.doc.fileUri }, ...(wanted ? { text } : {}) }
        });
    }
}

/** The page's `textDocument/didClose`: the server drops the document with the last name for it. */
export function closeDocument(page: Page, params: unknown): void {
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
    page.joined.delete(uri);
    for (const one of [open, ...open.also]) {
        one.held.docs.delete(docKey(one.doc.fileUri));
        one.held.dropped(one.doc);
        one.held.notify({
            jsonrpc: '2.0',
            method: 'textDocument/didClose',
            params: { textDocument: { uri: one.doc.fileUri } }
        });
        if (one.held.docs.size === 0) one.held.armEnd();
    }
}

/**
 * A server whose page closed, taken over by the page that opens the same root: its old page's
 * documents are closed in it first. The server leaves `orphans`; null when none matches the key.
 */
export function adoptHeld(page: Page, key: string, orphans: Set<Held>): Held | null {
    for (const held of orphans) {
        if (`${held.entry.id}\0${normal(held.root.real)}` !== key) continue;
        orphans.delete(held);
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
