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
    context.send(page, doc.channel, {
        jsonrpc: '2.0',
        method: message.method,
        params: mapped.value
    });
    // The other names the page has for the document are told the same.
    const first = isRecord(mapped.value) ? mapped.value.uri : undefined;
    for (const [name, open] of page.docs) {
        if (open.doc !== doc || name === first || !isRecord(mapped.value)) continue;
        context.send(page, doc.channel, {
            jsonrpc: '2.0',
            method: message.method,
            params: { ...mapped.value, uri: name }
        });
    }
}
