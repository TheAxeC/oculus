// Layer 2, server. What the relay hands an entry that answers a request of the page itself
// (`ServerEntry.answers`) or adds a result of its own to its server's (`ServerEntry.adds`): a view
// of the page it answers, made when the request arrives. The view holds the served roots, the
// reference index of the latest build, the catalog, and every document of the entry's servers the
// page has open with the text the page holds it at, one for each file whatever name the page opened
// it under. A file the answer needs that no tab holds is read from the disk, up to the most a write
// by a language server's edit may be, and only when its bytes are UTF-8 text throughout by the rule
// every layer uses (`isWholeText`).

import { readFileSync, statSync } from 'node:fs';
import { WRITE_MAX_BYTES } from '../../../../data/file-ops.ts';
import { isWholeText } from '../../../../data/helpers/files/text-kind.ts';
import type { FileText } from '../../../../data/snapshot/references/rename.ts';
import type { SchemaFeed } from '../schema-feed.ts';
import type { OpenDocument, PageAnswer, PageRequest, PageView, ServerEntry } from '../servers.ts';
import type { ServedRoot } from '../uris.ts';
import { isHeldElsewhere } from './elsewhere.ts';
import type { Doc, Page } from './held.ts';

/** What the relay holds that an entry's answers read. */
export type Answering = {
    roots: readonly ServedRoot[];
    /** The latest schemas and index; absent, no entry answers. */
    feed: SchemaFeed | undefined;
    /** The flat text catalog; absent, no entry answers. */
    catalog: (() => Record<string, string>) | undefined;
    /** Every page the relay serves. */
    pages: () => Iterable<Page>;
};

/**
 * The text of a file on disk: the text, that it is over the limit, or null when unreadable or not
 * UTF-8 text throughout.
 */
function readText(real: string): FileText {
    try {
        const info = statSync(real);
        if (!info.isFile()) return null;
        if (info.size > WRITE_MAX_BYTES) return { large: true };
        const bytes = readFileSync(real);
        return isWholeText(bytes) ? { text: bytes.toString('utf8') } : null;
    } catch {
        return null;
    }
}

/** A document as the page holds it open: the version is the page's, not the server's. */
function openDocument(doc: Doc): OpenDocument {
    return {
        real: doc.real,
        pageUri: doc.pageUri,
        version: doc.version - doc.shift,
        text: doc.text
    };
}

/** The view an entry's answer reads, or null while the relay holds no index or catalog. */
function viewOf(entry: ServerEntry, page: Page, answering: Answering): PageView | null {
    const { feed, catalog } = answering;
    if (feed === undefined || catalog === undefined) return null;
    const docs = new Set<Doc>();
    for (const open of page.docs.values()) {
        if (open.held.entry === entry) docs.add(open.doc);
    }
    const view: PageView = {
        roots: answering.roots,
        references: feed.references(),
        catalog: catalog(),
        documents: [...docs].map(openDocument),
        document: (uri) => {
            const open = typeof uri === 'string' ? page.docs.get(uri) : undefined;
            return open?.held.entry === entry ? openDocument(open.doc) : undefined;
        },
        read: readText,
        heldElsewhere: (real) => isHeldElsewhere(answering.pages(), page, real)
    };
    return view;
}

/** The answer an entry gives to a request of a page, or undefined to send the request on. */
export function answerFor(
    entry: ServerEntry,
    page: Page,
    answering: Answering,
    request: PageRequest
): PageAnswer | undefined {
    if (entry.answers === undefined) return undefined;
    const view = viewOf(entry, page, answering);
    return view === null ? undefined : entry.answers(request, view);
}

/** The result an entry adds to its server's answer to a request of a page, or undefined. */
export function addedFor(
    entry: ServerEntry,
    page: Page,
    answering: Answering,
    request: PageRequest
): unknown {
    if (entry.adds === undefined) return undefined;
    const view = viewOf(entry, page, answering);
    return view === null ? undefined : entry.adds(request, view);
}
