// Layer 1, data. The plain rules of the literature search that both sides read: a source's text as
// plain text, that text as the Lit Watch file takes it, and the identifiers two hits are merged on.
//
// The server reads a hit out of a source's answer with them (server/content/literature/), the page
// merges the hits with them (state/feeds/literature/), and the Lit Watch and Literature writers
// clean an entry's text and find a paper the file holds with them (server/edit/feeds/), so one rule
// decides what a DOI or a title is. The bounds of a request are here too, so the page refuses a
// request with the rule the route refuses it by.

import { decodeHTML } from 'entities';
import { FIELD_MAX, QUERY_MAX, type LiteratureRefusal } from '../model/index.ts';

/** A tag, a comment or a declaration, and no lone `<` standing in a sentence (`p < 0.05`). */
const MARKUP = /<\/?[A-Za-z][^>]*>|<![^>]*>/g;

/** An element whose content is never text: it is dropped with its tags. */
const SILENT = /<(script|style)\b[^>]*>[\s\S]*?<\/\1\s*>/gi;

/**
 * A source's text as plain text: the elements that hold no text dropped, the other tags removed,
 * the entities decoded and every run of white space one space. Markup written as an entity
 * (`&lt;i&gt;`) is text and stays text.
 */
export function plainText(raw: string): string {
    return decodeHTML(raw.replace(SILENT, ' ').replace(MARKUP, ' ')).replace(/\s+/g, ' ').trim();
}

/** An address as Lit Watch compares it: lower case, a trailing slash ignored. */
export function addressKey(url: string): string {
    return url.trim().toLowerCase().replace(/\/+$/, '');
}

/** A title as two titles are compared: lower cased, every character but a letter or digit out. */
function titleKey(title: string): string {
    return title.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
}

/**
 * Whether two titles are one paper's, for Lit Watch and for the Literature collection: equal once
 * lower cased and every character that is not a letter or a digit is dropped. Two titles that hold
 * no letter or digit at all are no paper's.
 */
export function sameTitle(left: string, right: string): boolean {
    const key = titleKey(left);
    return key !== '' && key === titleKey(right);
}

/** What the Literature collection compares two papers by: the DOI, else the title. */
export type PaperIds = { doi?: string; title: string };

/**
 * Whether two papers are one for the Literature collection: the same DOI as normalDoi spells it,
 * or, when either has no DOI, the same title by sameTitle. Two papers with different DOIs are two
 * papers whatever their titles.
 */
export function samePaper(left: PaperIds, right: PaperIds): boolean {
    const one = normalDoi(left.doi);
    const other = normalDoi(right.doi);
    if (one !== undefined && other !== undefined) return one === other;
    return sameTitle(left.title, right.title);
}

/** What the Lit Watch file takes in place of a character outside printable ASCII. */
const RADAR_MAP: [RegExp, string][] = [
    [/[\u2018\u2019\u201A\u201B]/g, "'"],
    [/[\u201C\u201D\u201E\u201F]/g, '"'],
    [/[\u2013\u2014]/g, '-'],
    [/\u2026/g, '...'],
    [/\u00A0/g, ' ']
];

/**
 * A text as the Lit Watch file holds it: plain text, then curly quotes straight, an en or em dash
 * a hyphen, the ellipsis character three dots and a non-breaking space a space. Every other
 * character is kept, accented and Greek letters included.
 */
export function radarText(raw: string): string {
    let text = plainText(raw);
    for (const [from, to] of RADAR_MAP) text = text.replace(from, to);
    return text;
}

const DOI = /^10\.\d{4,9}\/\S+$/;

/**
 * A DOI as one spelling: the address or `doi:` prefix off, percent escapes decoded, lowercase,
 * trimmed, a trailing period dropped. Undefined for a text that is no DOI.
 */
export function normalDoi(raw: string | null | undefined): string | undefined {
    if (typeof raw !== 'string') return undefined;
    let text = raw.trim().replace(/^(?:https?:\/\/(?:dx\.)?doi\.org\/|doi:\s*)/i, '');
    try {
        text = decodeURIComponent(text);
    } catch {
        // A stray percent sign stays as it is written.
    }
    text = text.trim().toLowerCase().replace(/\.+$/, '');
    return DOI.test(text) ? text : undefined;
}

/** A query that is a DOI, with or without its address or prefix. */
const DOI_QUERY = /^(https?:\/\/(dx\.)?doi\.org\/|doi:)?10\.\d{4,9}\/\S+$/;

/** The DOI a query is, or undefined when the query is anything else. */
export function queryDoi(query: string): string | undefined {
    const text = query.trim();
    return DOI_QUERY.test(text) ? normalDoi(text) : undefined;
}

const ARXIV_NEW = /^\d{4}\.\d{4,5}$/;
const ARXIV_OLD = /^[a-z-]+(?:\.[A-Za-z]{2})?\/\d{7}$/;

/**
 * An arXiv identifier without its version, from the bare identifier, an `arxiv:` prefix or an
 * arXiv address (abstract or PDF page). Undefined for a text that is none.
 */
export function arxivId(raw: string | null | undefined): string | undefined {
    if (typeof raw !== 'string') return undefined;
    const text = raw
        .trim()
        .replace(/^(?:https?:\/\/(?:www\.)?arxiv\.org\/(?:abs|pdf)\/|arxiv:\s*)/i, '')
        .replace(/\.pdf$/i, '')
        .replace(/v\d+$/i, '');
    return ARXIV_NEW.test(text) || ARXIV_OLD.test(text) ? text : undefined;
}

/** The arXiv identifier a DataCite DOI of arXiv (`10.48550/arxiv.<id>`) names. */
export function arxivOfDoi(doi: string | undefined): string | undefined {
    const match = doi === undefined ? null : /^10\.48550\/arxiv\.(.+)$/.exec(doi);
    return match === null ? undefined : arxivId(match[1]);
}

/** A PubMed identifier: digits alone. */
export function pubmedId(raw: string | number | null | undefined): string | undefined {
    const text = String(raw ?? '').trim();
    return /^\d{1,9}$/.test(text) ? text : undefined;
}

/** The earliest year a filter may name. */
const YEAR_MIN = 1000;

/** The year after this one, the latest a filter may name. */
export function latestYear(now: number): number {
    return new Date(now).getFullYear() + 1;
}

/** A whole number written in digits, and no more digits than a count or a year needs. */
export function wholeNumber(text: string): number | null {
    return /^\d{1,9}$/.test(text) ? Number(text) : null;
}

/**
 * The closed year range two year texts name, null when neither is given, and `wrong` when a text is
 * not a whole year from 1000 to the year after this one or `from` is after `to`. A one-sided range
 * is closed at 1000 or at the year after this one.
 */
export function yearRange(
    from: string | null,
    to: string | null,
    now: number
): { from: number; to: number } | null | 'wrong' {
    const last = latestYear(now);
    const given = (text: string | null): number | null | 'wrong' => {
        if (text === null) return null;
        const year = wholeNumber(text);
        return year === null || year < YEAR_MIN || year > last ? 'wrong' : year;
    };
    const first = given(from);
    const second = given(to);
    if (first === 'wrong' || second === 'wrong') return 'wrong';
    if (first === null && second === null) return null;
    const range = { from: first ?? YEAR_MIN, to: second ?? last };
    return range.from > range.to ? 'wrong' : range;
}

/** The fields of a request whose bounds are checked before any source is asked. */
export type RequestFields = {
    q: string;
    /** The year texts, null for one that is not given. */
    from: string | null;
    to: string | null;
    /** The citation minimum text, null when it is not given. */
    minCites: string | null;
    venue: string;
    author: string;
};

/** The first bound a request breaks, in the order the route checks them, or null for none. */
export function boundsRefusal(fields: RequestFields, now: number): LiteratureRefusal | null {
    const q = fields.q.trim();
    if (q === '') return 'query_empty';
    if (q.length > QUERY_MAX) return 'query_long';
    if (yearRange(fields.from, fields.to, now) === 'wrong') return 'year';
    if (fields.minCites !== null && wholeNumber(fields.minCites) === null) return 'cites';
    if (fields.venue.trim().length > FIELD_MAX) return 'venue_long';
    if (fields.author.trim().length > FIELD_MAX) return 'author_long';
    return null;
}
