// Layer 1, data. What a search across files answers: the hits of one file, the files of one run,
// and what the run cost. The literature search's vocabulary is here too: the sources, the states a
// source answers in, the document types, the refusal words of its route, and the hit a source's
// adapter reads out of its answer.
//
// A hit is one match, so a line holding two matches is two hits. It carries the line's own text
// rather than an offset into the file, so the page draws a result without reading the file, and it
// carries where the match sits in that text so the page emboldens the match without matching the
// pattern again. `length` is the matched text's own length, which is the only way a
// regular-expression hit can be emboldened at all: the page knows the pattern, not what it matched.
// `at` places the match in the whole line, which is what names it to a replace, and `groups` is the
// text of every group of the pattern, which is what a replace text with `$1` in it is read over.
//
// A names answer is the other thing the search route answers: the paths ripgrep lists under each
// served root, with no match in them, which the palette's file mode matches on the page as the
// reader types.

/** One match: where its line is, where the match sits in the line and in the text, and the text. */
export type SearchHit = {
    /** The line's number in the file, counting from one. */
    line: number;
    /** Where the match starts in `text`, counting from one. */
    column: number;
    /** How many characters the match took. */
    length: number;
    /** The matching line, cut to a window around the match. */
    text: string;
    /** Where the match starts in the whole line, in UTF-16 units counted from zero. */
    at: number;
    /**
     * The text of every group of a regular-expression pattern, by number and by name, group 0 being
     * the match. A literal search has no groups, and its hit carries group 0 alone when the match
     * is longer than the window `text` is cut to, since `text` then holds only the start of it.
     */
    groups?: Record<string, string>;
};

/** The hits of one file, under the root it was found in. */
export type SearchFile = {
    root: string;
    /** The file's path inside that root. */
    path: string;
    hits: SearchHit[];
    /**
     * Set by the page on a file it wrote, when the hits the file holds now could not be read: the
     * file keeps its place in the list with no hits, and its row asks for a new search.
     */
    rereadFailed?: boolean;
};

/** A root whose search did not run, and why, so a missing directory is never silence. */
export type SearchFailure = {
    root: string;
    /** Whether the root's search ran out of time or ripgrep could not run it. */
    why: 'timed-out' | 'failed';
    /** ripgrep's own one-line reason, or that the root's search ran out of time. */
    reason: string;
};

/** One run's whole answer. */
export type SearchAnswer = {
    files: SearchFile[];
    /** How many hits the files carry. */
    total: number;
    /** Whether the run stopped at the cap, so the file list is not every hit there is. */
    truncated: boolean;
    /** How long the run took, in milliseconds. */
    ms: number;
    /** The roots that answered nothing because their search failed or timed out. */
    failed: SearchFailure[];
};

/** Why a root's list of names stopped before it was whole. */
type NamesFailure = 'timed_out' | 'failed';

/** The names under one served root: each path inside that root, and why the list is not whole. */
export type NamesRoot = {
    root: string;
    paths: string[];
    error?: NamesFailure;
};

/**
 * What `GET /api/search?list=names` answers: the names of each root asked, and whether the list
 * was cut at the configured number of names in all.
 */
export type NamesAnswer = {
    roots: NamesRoot[];
    cut: boolean;
};

/** The eight scholarly sources, in the order the route lists them. */
export const LITERATURE_SOURCES = [
    'openalex',
    'semantic_scholar',
    'crossref',
    'pubmed',
    'europe_pmc',
    'arxiv',
    'wos',
    'scopus'
] as const;

/** One scholarly source. */
export type LiteratureSource = (typeof LITERATURE_SOURCES)[number];

/** The document type a reader filters on; `any` is no filter. */
export const DOC_TYPES = [
    'any',
    'article',
    'review',
    'preprint',
    'conference',
    'book',
    'chapter'
] as const;

/** One document type of the filter. */
export type DocType = (typeof DOC_TYPES)[number];

/** The type a hit has: a document type, or `other` for a source type outside the map. */
export type HitType = Exclude<DocType, 'any'> | 'other';

/**
 * What a source answered with: `ok`, `limited` (429), `timeout` (no answer within the time given),
 * `refused` (401 or 403), `failed` (any other status, an answer that does not read, or one above
 * the size cap), `no-key` (a keyed source with no key) and `skipped` (a filter it cannot hold).
 */
export const SOURCE_STATES = [
    'ok',
    'limited',
    'timeout',
    'refused',
    'failed',
    'no-key',
    'skipped'
] as const;

/** One state a source answers in. */
export type SourceState = (typeof SOURCE_STATES)[number];

/** The longest query, in characters. */
export const QUERY_MAX = 1000;

/** The longest venue or author, in characters. */
export const FIELD_MAX = 200;

/** Why the literature route refused a request before any source was asked. */
export const LITERATURE_REFUSALS = [
    'token',
    'query_empty',
    'query_long',
    'source',
    'year',
    'cites',
    'type',
    'oa',
    'venue_long',
    'author_long',
    'page',
    'doi',
    'id'
] as const;

/** One refusal word of the literature route. */
export type LiteratureRefusal = (typeof LITERATURE_REFUSALS)[number];

/** One hit as one source's adapter reads it. */
export type LiteratureHit = {
    source: LiteratureSource;
    /** The source's own identifier for the work. */
    id: string;
    /** Lowercase, without the address or the `doi:` prefix. */
    doi?: string;
    pmid?: string;
    /** The arXiv identifier without its version. */
    arxiv?: string;
    title: string;
    authors: string[];
    venue?: string;
    year?: number;
    /** `YYYY-MM-DD`, `YYYY-MM` or `YYYY`. */
    date?: string;
    type: HitType;
    abstract?: string;
    cites?: number;
    oa?: boolean;
    pdf?: string;
    url?: string;
    /** The place in the source's answer, from 1 over the pages. */
    rank: number;
    /** The BibTeX entry the source serves for the work. */
    bibtex?: string;
};

/** What a source that answered `ok` says. */
export type SourceHits = {
    ok: true;
    source: LiteratureSource;
    state: 'ok';
    /** The count the source reports, null when it reports none. */
    total: number | null;
    /** Whether the source holds a page after this one. */
    more: boolean;
    /** What the next page is asked with, null with `more: false`. */
    cursor: string | null;
    /** Whether the answer came from the cache. */
    cached: boolean;
    hits: LiteratureHit[];
};

/** What a source that did not answer `ok` says. */
export type SourceNotOk = {
    ok: true;
    source: LiteratureSource;
    state: Exclude<SourceState, 'ok'>;
    /** The status the source answered with, when it answered. */
    status?: number;
    /** The seconds to wait, when the source named them. */
    wait_s?: number;
};

/** One source's whole answer to one request. */
export type SourceAnswer = SourceHits | SourceNotOk;

/** One source in the route's list: whether it needs a key, whether it can be asked, and the key. */
export type SourceInfo = {
    id: LiteratureSource;
    keyed: boolean;
    available: boolean;
    /** The `local.yml` key a keyed source needs, never a value. */
    key: string | null;
};
