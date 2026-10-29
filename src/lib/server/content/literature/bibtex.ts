// Layer 2, server. One BibTeX entry as a service serves it, for the Copy BibTeX control: the
// address of the `doi` row of `links` asked with the BibTeX media type for a paper's DOI, or the
// `query.id` of a `literature.sources` row for a paper the row knows by its own id.
//
// The entry is returned as served, with the service's key and any non-ASCII text, and is never
// written to a file. A row that has none, answers a refusal or serves something that is not BibTeX
// gives `null`, and the page goes on to the next row in its order. Two requests of one lane start
// at least a second apart, the lane being the DOI link's or the row's own.

import type { LinkRow, ReaderRow } from '../../../data/sources/config/settings/rows/grammar.ts';
import { linkAddress } from '../../../data/sources/config/settings/rows/links.ts';
import { ReaderStop, send, type Sender } from '../../core/reader/call.ts';
import { readLookup, type Setup } from '../../core/reader/reader.ts';
import type { Account } from '../../core/reader/request.ts';
import type { LiteratureDesk } from './desk.ts';
import type { BibtexQuery } from './request.ts';

/** The longest entry taken. */
const ENTRY_MAX = 100_000;

/** The least milliseconds between two requests of the lane that serves an entry. */
const GAP_MS = 1000;

/** The lane of the DOI link's requests. */
const DOI_LANE = 'links.doi';

/** The row the request of the DOI link is sent as: its stops are named by the link's key. */
const DOI_ROW: ReaderRow = { key: 'doi', name: 'doi', format: 'text' };

/** What a BibTeX request is given to run with. */
export type BibtexContext = {
    sender: Sender;
    desk: LiteratureDesk;
    links: readonly LinkRow[];
    downloads: readonly Account[];
    contact?: string;
    signal: AbortSignal;
};

/** What a BibTeX request answers: the entry, and the row it came from with that row's name. */
export type BibtexAnswer = { bibtex: string | null; from?: string; name?: string };

/** An entry as served, or null for one that is not BibTeX or is too long. */
function entryOf(text: unknown): string | null {
    if (typeof text !== 'string') return null;
    const entry = text.trim();
    return entry.startsWith('@') && entry.length <= ENTRY_MAX ? entry : null;
}

/** The entry the DOI link serves for a DOI. */
async function byDoi(doi: string, context: BibtexContext): Promise<BibtexAnswer> {
    const url = linkAddress(context.links, 'doi', doi);
    if (url === undefined) return { bibtex: null };
    const request = { url, headers: { accept: 'application/x-bibtex' } };
    const reply = await context.desk.run(DOI_LANE, GAP_MS, context.signal, () =>
        send(context.sender, request, DOI_ROW)
    );
    const bibtex = entryOf(reply.text);
    return bibtex === null ? { bibtex: null } : { bibtex, from: 'doi' };
}

/** The entry a row's `query.id` serves for the row's own paper id. */
async function byId(
    query: Extract<BibtexQuery, { by: 'id' }>,
    context: BibtexContext
): Promise<BibtexAnswer> {
    const { row, term, id } = query;
    const setup: Setup = {
        sender: context.sender,
        downloads: context.downloads,
        links: context.links,
        ...(context.contact === undefined ? {} : { contact: context.contact }),
        run: (task) => context.desk.run(row.key, GAP_MS, context.signal, task)
    };
    const items = await readLookup(row, term, (name) => (name === 'id' ? id : undefined), setup);
    const bibtex = entryOf(items[0]?.fields.bibtex);
    return bibtex === null ? { bibtex: null } : { bibtex, from: row.key, name: row.name };
}

/** The entry for a query and where it came from, or `bibtex: null` when the row has none. */
export async function bibtexFor(query: BibtexQuery, context: BibtexContext): Promise<BibtexAnswer> {
    try {
        return query.by === 'doi' ? await byDoi(query.doi, context) : await byId(query, context);
    } catch (error) {
        if (error instanceof ReaderStop) return { bibtex: null };
        throw error;
    }
}
