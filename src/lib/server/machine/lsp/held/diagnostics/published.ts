// Layer 2, server. What a server publishes about a document, on its own or as the relay pulled it
// (`textDocument/publishDiagnostics`, clangd's inactive regions): the message goes through the
// entry's filter for the file's diagnostics, its addresses and versions are put back to the page's,
// and it is sent to the channel the document was opened on, once under each name the page has for
// the document.

import type { DiagnosticView } from '../../servers.ts';
import type { LspRpc, LspToPage } from '../../../../../data/model/index.ts';
import type { Mapper, ServedRoot } from '../../uris.ts';
import { toPage } from '../../uris.ts';
import { isRecord } from '../../wire.ts';
import { docKey, type Held, type Page } from '../held.ts';

/** What the relay gives a published message's way to the page. */
export type Publishing = {
    roots(): readonly ServedRoot[];
    catalog(): Record<string, string>;
    mapper(page: Page, held: Held): Mapper;
    send(page: Page, channel: string, payload: LspRpc | LspToPage): void;
};

/** The notifications about a document that reach the page. */
export const PUBLISHED = ['textDocument/publishDiagnostics', 'textDocument/inactiveRegions'];

/** Send the page a server's publication about a document. */
export function publish(context: Publishing, held: Held, message: LspRpc): void {
    const params = isRecord(message.params) ? message.params : {};
    const page = held.owner as Page | null;
    const named = isRecord(params.textDocument) ? params.textDocument.uri : params.uri;
    const doc = held.docs.get(docKey(String(named)));
    if (page === null || doc === undefined) return;
    const view: DiagnosticView = {
        real: doc.real,
        text: doc.text,
        root: held.root,
        roots: context.roots(),
        catalog: context.catalog()
    };
    const shown =
        message.method === 'textDocument/publishDiagnostics' && held.entry.diagnostics
            ? held.entry.diagnostics(params, view)
            : message.params;
    const mapped = toPage(held.pageVersions(shown), context.mapper(page, held));
    if (mapped === null) return;
    const value =
        message.method === 'textDocument/publishDiagnostics'
            ? joinedDiagnostics(page, held, mapped.value)
            : mapped.value;
    context.send(page, doc.channel, {
        jsonrpc: '2.0',
        method: message.method,
        params: value
    });
    // The other names the page has for the document are told the same.
    const first = isRecord(value) ? value.uri : undefined;
    for (const [name, open] of page.docs) {
        if (open.doc !== doc || name === first || !isRecord(value)) continue;
        context.send(page, doc.channel, {
            jsonrpc: '2.0',
            method: message.method,
            params: { ...value, uri: name }
        });
    }
}

/** A diagnostic with the source a server of an app is named by when the server named none. */
function sourced(diagnostic: unknown, source: string | undefined): unknown {
    if (source === undefined || !isRecord(diagnostic) || typeof diagnostic.source === 'string') {
        return diagnostic;
    }
    return { ...diagnostic, source };
}

/**
 * The diagnostics a document shows from the servers and collections that remain, in the order
 * `joinedDiagnostics` joins them, or null when the document has none kept apart.
 */
export function remainingDiagnostics(page: Page, uri: string): unknown[] | null {
    const kept = page.joined.get(uri);
    if (kept === undefined) return null;
    const open = page.docs.get(uri);
    const helds = open === undefined ? [] : [open.held, ...open.also.map((one) => one.held)];
    const order = [
        ...helds.filter((one) => kept.has(one)),
        ...[...kept.keys()].filter((key) => typeof key === 'string')
    ];
    return order.flatMap((key) => kept.get(key) ?? []);
}

/**
 * The diagnostics a document shows when it is open on several servers, or has diagnostics from an
 * app's collection: those of every server and collection, oculus's server first, then the apps'
 * in the order they were opened, then the collections. A document on one shipped server alone is
 * published as the server gave it.
 */
export function joinedDiagnostics(page: Page, from: Held | string, params: unknown): unknown {
    if (!isRecord(params) || typeof params.uri !== 'string') return params;
    const open = page.docs.get(params.uri);
    const held = typeof from === 'string' ? undefined : from;
    const named = held?.entry.source;
    if (
        held !== undefined &&
        named === undefined &&
        open?.also.length === 0 &&
        !page.joined.has(params.uri)
    ) {
        return params;
    }
    const list = Array.isArray(params.diagnostics) ? params.diagnostics : [];
    const kept = page.joined.get(params.uri) ?? new Map<Held | string, unknown[]>();
    page.joined.set(params.uri, kept);
    kept.set(
        from,
        list.map((one) => sourced(one, named))
    );
    return { ...params, diagnostics: remainingDiagnostics(page, params.uri) ?? [] };
}
