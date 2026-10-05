// Layer 2, server. The literature route's request, read from the address and refused with one word
// before any source is asked.
//
// A request is one of three forms: `?sources`, `?source=<id>&q=...` and `?bibtex&doi=...`. This
// file reads the second and the third into values the adapters take; the first has nothing to
// read. The order of the refusals is the order of the checks below, and a value that passed is the
// value an adapter is given, so no adapter re-checks a bound.

import {
    DOC_TYPES,
    LITERATURE_SOURCES,
    type DocType,
    type LiteratureRefusal,
    type LiteratureSource
} from '../../../data/model/index.ts';
import {
    arxivId,
    boundsRefusal,
    normalDoi,
    queryDoi,
    wholeNumber,
    yearRange
} from '../../../data/prose/literature.ts';

/** One search over one source, read and bounded. */
export type LiteratureQuery = {
    source: LiteratureSource;
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
    /** The page this source is asked for: its cursor, null for the first. */
    page: string | null;
};

/** One BibTeX request: the identifier it is made from. */
export type BibtexQuery =
    { by: 'doi'; doi: string } | { by: 's2'; id: string } | { by: 'arxiv'; id: string };

/** A refusal word, or the value read. */
export type Read<T> = { refused: LiteratureRefusal } | { value: T };

/** Whether a cursor is of the form the source's answers carry. */
function pageFits(source: LiteratureSource, page: string): boolean {
    if (source === 'europe_pmc') return /^[\x20-\x7e]{1,200}$/.test(page);
    return /^\d{1,9}$/.test(page);
}

/** The source id a request names: exactly one, one of the eight. */
function sourceOf(params: URLSearchParams): LiteratureSource | null {
    const all = params.getAll('source');
    if (all.length !== 1) return null;
    return (LITERATURE_SOURCES as readonly string[]).includes(all[0])
        ? (all[0] as LiteratureSource)
        : null;
}

/** Read the search form of the route, or the word that refuses it. */
export function searchOf(params: URLSearchParams, now = Date.now()): Read<LiteratureQuery> {
    const source = sourceOf(params);
    if (source === null) return { refused: 'source' };
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
    if (page !== null && !pageFits(source, page)) return { refused: 'page' };

    return {
        value: {
            source,
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

/** Read the BibTeX form of the route, or the word that refuses it. */
export function bibtexOf(params: URLSearchParams): Read<BibtexQuery> {
    const doi = params.get('doi');
    if (doi !== null) {
        const text = normalDoi(doi);
        return text === undefined ? { refused: 'doi' } : { value: { by: 'doi', doi: text } };
    }
    const s2 = params.get('s2');
    if (s2 !== null) {
        return /^[0-9a-f]{40}$/i.test(s2)
            ? { value: { by: 's2', id: s2.toLowerCase() } }
            : { refused: 'id' };
    }
    const arxiv = params.get('arxiv');
    const id = arxivId(arxiv);
    return arxiv !== null && id !== undefined ? { value: { by: 'arxiv', id } } : { refused: 'id' };
}
