// Layer 2, server. The one place a record a `literature.sources` row reads becomes a hit of the
// Literature search, whatever row it came from.
//
// The reader hands the fields the row names (`id`, `doi`, `pmid`, `arxiv`, `title`, `authors`,
// `venue`, `year`, `date`, `type`, `abstract`, `cites`, `oa`, `pdf`, `url`, `bibtex`), each as the
// answer held it. Nothing of a record is trusted past this file: the text is plain text, the DOI is
// one spelling, a date and a year are in range, a count is a whole number, and an address is
// `https:` or gone. A record with no id, or with no title and no identifier, is no hit.
//
// A record's type is the key of the row's `types` whose value equals the type it holds (or one of
// the types it lists), compared without case, the keys taken in the row's order; else the type it
// holds when that is a hit type; else `other`.

import type { ReaderRow } from '../../../data/sources/config/settings/rows/grammar.ts';
import { valueText } from '../../../data/sources/config/settings/rows/holes.ts';
import { DOC_TYPES, type HitType, type LiteratureHit } from '../../../data/model/index.ts';
import {
    arxivId,
    arxivOfDoi,
    latestYear,
    normalDoi,
    plainText,
    pubmedId
} from '../../../data/prose/literature.ts';
import { httpsLink } from '../../accounts/connect/api.ts';
import type { Item } from '../../core/reader/reader.ts';

/** The types a hit may have. */
const HIT_TYPES: readonly string[] = [...DOC_TYPES.filter((type) => type !== 'any'), 'other'];

/** A value as plain text, or undefined when nothing is left. */
function plainOf(value: unknown): string | undefined {
    const text = valueText(value);
    if (text === undefined) return undefined;
    const plain = plainText(text);
    return plain === '' ? undefined : plain;
}

/** A value as a list of its texts: a list's elements, or the one value. */
function textsOf(value: unknown): string[] {
    const values = Array.isArray(value) ? (value as unknown[]) : value === undefined ? [] : [value];
    return values.flatMap((one) => plainOf(one) ?? []);
}

/** A year inside 1000 to next year, from a number or its text. */
function yearIn(value: unknown, now: number): number | undefined {
    const text = valueText(value)?.trim();
    const year = text === undefined || text === '' ? NaN : Number(text);
    if (!Number.isInteger(year)) return undefined;
    return year >= 1000 && year <= latestYear(now) ? year : undefined;
}

/** A date as `YYYY-MM-DD`, `YYYY-MM` or `YYYY`, when it names a year in range. */
function dateIn(value: unknown, now: number): string | undefined {
    const match = /^(\d{4})(?:-(\d{2})(?:-(\d{2}))?)?/.exec((valueText(value) ?? '').trim());
    if (match === null || yearIn(match[1], now) === undefined) return undefined;
    const month = match[2] ? `-${match[2]}` : '';
    const day = match[3] ? `-${match[3]}` : '';
    return `${match[1]}${month}${month === '' ? '' : day}`;
}

/** A count, whole and not negative. */
function countOf(value: unknown): number | undefined {
    const text = valueText(value)?.trim();
    const count = text === undefined || text === '' ? NaN : Number(text);
    return Number.isInteger(count) && count >= 0 ? count : undefined;
}

/** Whether a value says yes: true, 1, or the text of either. */
function yes(value: unknown): boolean {
    return value === true || value === 1 || value === '1' || value === 'true';
}

/** The type of a record: by the row's `types`, else the type it holds, else `other`. */
function typeOf(row: ReaderRow, value: unknown): HitType {
    const held = textsOf(value).map((one) => one.toLowerCase());
    for (const [key, text] of Object.entries(row.types ?? {})) {
        if (text !== '' && held.includes(text.toLowerCase())) return key as HitType;
    }
    const own = held.find((one) => HIT_TYPES.includes(one));
    return (own as HitType | undefined) ?? 'other';
}

/**
 * The hit an item of a row is, or null for one with no id, or with no title and no identifier.
 * `rank` is the place in the source's answer, from 1.
 */
function hitOf(row: ReaderRow, item: Item, rank: number, now: number): LiteratureHit | null {
    const fields = item.fields;
    const id = valueText(fields.id);
    if (id === undefined || id === '') return null;
    const doi = normalDoi(valueText(fields.doi));
    const arxiv = arxivId(valueText(fields.arxiv)) ?? arxivOfDoi(doi);
    const pmid = pubmedId(valueText(fields.pmid));
    const title = plainOf(fields.title) ?? '';
    if (title === '' && doi === undefined && arxiv === undefined && pmid === undefined) return null;
    const hit: LiteratureHit = {
        source: row.key,
        id,
        title,
        authors: textsOf(fields.authors),
        type: typeOf(row, fields.type),
        rank
    };
    const set = <K extends keyof LiteratureHit>(
        key: K,
        value: LiteratureHit[K] | undefined
    ): void => {
        if (value !== undefined) hit[key] = value;
    };
    const date = valueText(fields.date);
    set('doi', doi);
    set('pmid', pmid);
    set('arxiv', arxiv);
    set('venue', plainOf(fields.venue));
    set('year', yearIn(fields.year, now) ?? yearIn(date?.slice(0, 4), now));
    set('date', dateIn(date, now));
    set('abstract', plainOf(fields.abstract));
    set('cites', countOf(fields.cites));
    set('oa', yes(fields.oa) ? true : undefined);
    set('pdf', httpsLink(valueText(fields.pdf)));
    set('url', httpsLink(valueText(fields.url)));
    const bibtex = valueText(fields.bibtex);
    set('bibtex', bibtex !== undefined && bibtex.trim() !== '' ? bibtex : undefined);
    return hit;
}

/**
 * The hits of a page's items, ranked from `start`; null for a page whose items all fail to read,
 * which is a source whose answer changed shape.
 */
export function hitsOf(row: ReaderRow, items: Item[], now: number): LiteratureHit[] | null {
    const hits = items.flatMap((item) => hitOf(row, item, item.at + 1, now) ?? []);
    return items.length > 0 && hits.length === 0 ? null : hits;
}
