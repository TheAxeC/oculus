// Layer 2, server. The literature route's request, read from the address and refused with one word
// before any source is asked.
//
// A request is one of three forms: `?sources`, `?source=<key>&q=...` and `?bibtex&doi=...` or
// `?bibtex&source=<key>&id=...`. The key is a row of `literature.sources`. This file reads the
// second and the third into values the reader takes; the first has nothing to read. The order of
// the refusals is the order of the checks below, and a value that passed is the value the reader
// is given, so nothing after it re-checks a bound.

import { DOC_TYPES, type DocType, type LiteratureRefusal } from '../../../data/model/index.ts';
import type { ReaderRow, Term } from '../../../data/sources/config/settings/rows/grammar.ts';
import {
    boundsRefusal,
    normalDoi,
    queryDoi,
    wholeNumber,
    yearRange
} from '../../../data/prose/literature.ts';
import { pageOfToken } from '../../core/reader/paging.ts';
import type { Terms } from '../../core/reader/request.ts';

/** One search over one source, read and bounded. */
export type LiteratureQuery = {
    /** The row of `literature.sources` the search asks. */
    row: ReaderRow;
    /** The query as typed, trimmed. */
    q: string;
    /** The DOI the query is, when it is one. */
    doi: string | undefined;
    /** The closed year range, or null when the request names neither year. */
    years: { from: number; to: number } | null;
    type: DocType;
    oa: boolean;
    venue: string;
    author: string;
    minCites: number;
    /** The page this source is asked for: its token, null for the first. */
    page: string | null;
};

/** One BibTeX request: a DOI, or a row's own paper id asked through its `query.id`. */
export type BibtexQuery =
    { by: 'doi'; doi: string } | { by: 'id'; row: ReaderRow; term: Term; id: string };

/** A refusal word, or the value read. */
export type Read<T> = { refused: LiteratureRefusal } | { value: T };

/** The row a request names: exactly one key, one of the rows'. */
function rowOf(params: URLSearchParams, rows: readonly ReaderRow[]): ReaderRow | null {
    const all = params.getAll('source');
    if (all.length !== 1) return null;
    return rows.find((row) => row.key === all[0]) ?? null;
}

/** Read the search form of the route, or the word that refuses it. */
export function searchOf(
    params: URLSearchParams,
    rows: readonly ReaderRow[],
    now = Date.now()
): Read<LiteratureQuery> {
    const row = rowOf(params, rows);
    if (row === null) return { refused: 'source' };
    const q = (params.get('q') ?? '').trim();
    const venue = (params.get('venue') ?? '').trim();
    const author = (params.get('author') ?? '').trim();
    const citesText = params.get('min_cites');
    const refused = boundsRefusal(
        {
            q,
            from: params.get('from'),
            to: params.get('to'),
            minCites: citesText,
            venue,
            author
        },
        now
    );
    if (refused !== null) return { refused };
    const type = params.get('type') ?? 'any';
    if (!(DOC_TYPES as readonly string[]).includes(type)) return { refused: 'type' };
    const oa = params.get('oa');
    if (oa !== null && oa !== '1' && oa !== '0') return { refused: 'oa' };
    const years = yearRange(params.get('from'), params.get('to'), now);
    const page = params.get('page');
    if (page !== null && pageOfToken(row, page, 1) === null) return { refused: 'page' };

    return {
        value: {
            row,
            q,
            doi: queryDoi(q),
            years: years === 'wrong' ? null : years,
            type: type as DocType,
            oa: oa === '1',
            venue,
            author,
            minCites: citesText === null ? 0 : (wholeNumber(citesText) ?? 0),
            page
        }
    };
}

/** The terms a search sends, as the reader's `query` maps them. */
export function termsOf(query: LiteratureQuery): Terms {
    const terms: Terms = {};
    if (query.doi !== undefined) terms.doi = query.doi;
    else terms.words = query.q;
    if (query.years !== null) terms.years = query.years;
    if (query.type !== 'any') terms.type = query.type;
    if (query.oa) terms.open_access = true;
    if (query.venue !== '') terms.venue = query.venue;
    if (query.author !== '') terms.author = query.author;
    if (query.minCites > 0) terms.min_cited = query.minCites;
    return terms;
}

/** A paper id as a row's `query.id` takes it: printable, short, fitting the term's `match`. */
function idOf(term: Term, raw: string): string | undefined {
    if (!/^[\x21-\x7e]{1,200}$/.test(raw)) return undefined;
    if (term.match === undefined) return raw;
    const found = new RegExp(term.match).exec(raw);
    return found === null ? undefined : (found.at(1) ?? found[0]);
}

/** Read the BibTeX form of the route, or the word that refuses it. */
export function bibtexOf(params: URLSearchParams, rows: readonly ReaderRow[]): Read<BibtexQuery> {
    const doi = params.get('doi');
    if (doi !== null) {
        const text = normalDoi(doi);
        return text === undefined ? { refused: 'doi' } : { value: { by: 'doi', doi: text } };
    }
    const row = rowOf(params, rows);
    const term = row?.query?.id;
    if (row === null || term?.address === undefined) return { refused: 'source' };
    const id = idOf(term, params.get('id') ?? '');
    return id === undefined ? { refused: 'id' } : { value: { by: 'id', row, term, id } };
}
