// Layer 2, server. What every source adapter shares: the request an adapter is given, the page it
// answers, and the one place a source's fields become a hit.
//
// An adapter builds its source's address with URLSearchParams, asks it through the `call` it was
// given, reads the answer through a zod schema beside it and hands each record to `hitOf`. A record
// is never trusted past that call: the text is plain text, the DOI is one spelling, a date and a
// year are in range, and an address is `https` or gone.

import { z } from 'zod';
import { httpsLink } from '../../../accounts/connect/api.ts';
import type { LocalConfig } from '../../../../data/sources/config/local.ts';
import type { HitType, LiteratureHit, LiteratureSource } from '../../../../data/model/index.ts';
import {
    arxivId,
    arxivOfDoi,
    latestYear,
    normalDoi,
    plainText,
    pubmedId
} from '../../../../data/prose/literature.ts';
import { SourceStop, type Call, type Reply } from '../ask.ts';
import type { LiteratureQuery } from '../request.ts';

/** The keys the machine sets for the sources. */
export type Keys = NonNullable<LocalConfig['literature']>;

/** What an adapter is given for one search. */
export type Ask = {
    query: LiteratureQuery;
    /** Hits asked of the source for this page. */
    size: number;
    keys: Keys;
    call: Call;
    /** The current time, for the range a date may fall in. */
    now: number;
};

/** What an adapter answers: the hits of one page and where the next is. */
export type Page = {
    total: number | null;
    more: boolean;
    cursor: string | null;
    hits: LiteratureHit[];
};

/** One source: how it is paced, what it needs, when it is not asked, and how it is asked. */
export type Adapter = {
    id: LiteratureSource;
    /** The `local.yml` key the source needs, and the key's value on this machine. */
    key?: { name: string; value: (keys: Keys) => string | undefined };
    /** The least milliseconds between the starts of two of its requests. */
    gap: (keys: Keys) => number;
    /** True for a search the source cannot hold, which is then answered `skipped`. */
    skips: (query: LiteratureQuery) => boolean;
    ask: (ask: Ask) => Promise<Page>;
};

/** One record before it is a hit: what an adapter read out of the source's answer. */
export type Raw = {
    id: string;
    doi?: string | null | undefined;
    pmid?: string | number | null | undefined;
    arxiv?: string | null | undefined;
    title?: string | null | undefined;
    authors?: (string | null | undefined)[] | undefined;
    venue?: string | null | undefined;
    year?: number | string | null | undefined;
    date?: string | null | undefined;
    type: HitType;
    abstract?: string | null | undefined;
    cites?: number | string | null | undefined;
    oa?: boolean | null | undefined;
    pdf?: string | null | undefined;
    url?: string | null | undefined;
    bibtex?: string | null | undefined;
};

/** Text as plain text, or undefined when nothing is left. */
function text(raw: string | null | undefined): string | undefined {
    if (typeof raw !== 'string') return undefined;
    const plain = plainText(raw);
    return plain === '' ? undefined : plain;
}

/** A year inside 1000 to next year, from a number or its text. */
function yearIn(raw: number | string | null | undefined, now: number): number | undefined {
    const year = typeof raw === 'string' ? Number(raw.trim()) : raw;
    if (typeof year !== 'number' || !Number.isInteger(year)) return undefined;
    return year >= 1000 && year <= latestYear(now) ? year : undefined;
}

/** A date as `YYYY-MM-DD`, `YYYY-MM` or `YYYY`, when it names a year in range. */
function dateIn(raw: string | null | undefined, now: number): string | undefined {
    const match = /^(\d{4})(?:-(\d{2})(?:-(\d{2}))?)?/.exec((raw ?? '').trim());
    if (match === null || yearIn(match[1], now) === undefined) return undefined;
    const month = match[2] ? `-${match[2]}` : '';
    const day = match[3] ? `-${match[3]}` : '';
    return `${match[1]}${month}${month === '' ? '' : day}`;
}

/** A count of citations, whole and not negative. */
function countOf(raw: number | string | null | undefined): number | undefined {
    const count = typeof raw === 'string' ? Number(raw.trim()) : raw;
    return typeof count === 'number' && Number.isInteger(count) && count >= 0 ? count : undefined;
}

/**
 * One record as a hit, or null for a record with no title and no identifier. `rank` is the place
 * in the source's answer, from 1.
 */
export function hitOf(
    source: LiteratureSource,
    raw: Raw,
    rank: number,
    now: number
): LiteratureHit | null {
    const doi = normalDoi(raw.doi);
    const arxiv = arxivId(raw.arxiv) ?? arxivOfDoi(doi);
    const pmid = pubmedId(raw.pmid);
    const title = text(raw.title) ?? '';
    if (title === '' && doi === undefined && arxiv === undefined && pmid === undefined) return null;
    const authors = (raw.authors ?? []).flatMap((one) => text(one) ?? []);
    const hit: LiteratureHit = { source, id: raw.id, title, authors, type: raw.type, rank };
    const set = <K extends keyof LiteratureHit>(
        key: K,
        value: LiteratureHit[K] | undefined
    ): void => {
        if (value !== undefined) hit[key] = value;
    };
    set('doi', doi);
    set('pmid', pmid);
    set('arxiv', arxiv);
    set('venue', text(raw.venue));
    set('year', yearIn(raw.year, now) ?? yearIn(raw.date?.slice(0, 4), now));
    set('date', dateIn(raw.date, now));
    set('abstract', text(raw.abstract));
    set('cites', countOf(raw.cites));
    set('oa', raw.oa === true ? true : undefined);
    set('pdf', httpsLink(raw.pdf ?? undefined));
    set('url', httpsLink(raw.url ?? undefined));
    set(
        'bibtex',
        typeof raw.bibtex === 'string' && raw.bibtex.trim() !== '' ? raw.bibtex : undefined
    );
    return hit;
}

/** The address of `base` with the parameters given, each value percent-encoded. */
export function addressOf(base: string, params: [string, string | undefined][]): string {
    const query = new URLSearchParams();
    for (const [name, value] of params) if (value !== undefined) query.append(name, value);
    const text = query.toString();
    return text === '' ? base : `${base}?${text}`;
}

/** A DOI as the tail of an address: each part encoded, the slashes between them kept. */
export function pathOf(doi: string): string {
    return doi.split('/').map(encodeURIComponent).join('/');
}

/** One answer's text read as JSON through a schema; an answer that does not read is `failed`. */
export function readJson<S extends z.ZodType>(
    source: LiteratureSource,
    status: number,
    body: string,
    schema: S
): z.infer<S> {
    let parsed: unknown;
    try {
        parsed = JSON.parse(body);
    } catch {
        throw new SourceStop(source, 'failed', { status });
    }
    const read = schema.safeParse(parsed);
    if (!read.success) throw new SourceStop(source, 'failed', { status });
    return read.data;
}

/**
 * The records of a page read one by one through a schema, each with its place in the page. A
 * record that does not read is left out; a page none of whose records read is a source whose
 * answer changed shape, and it is `failed`.
 */
export function readRows<S extends z.ZodType>(
    source: LiteratureSource,
    status: number,
    rows: unknown[],
    schema: S
): { at: number; row: z.infer<S> }[] {
    const read = rows.flatMap((raw, at) => {
        const one = schema.safeParse(raw);
        return one.success ? [{ at, row: one.data }] : [];
    });
    if (rows.length > 0 && read.length === 0) throw new SourceStop(source, 'failed', { status });
    return read;
}

/** A value that is a string, a number or absent, read as its text. */
export const looseText = z
    .union([z.string(), z.number()])
    .nullish()
    .transform((value) => (value === null || value === undefined ? undefined : String(value)));

/** A count that is a number or its text, else absent. */
export const looseCount = z
    .union([z.number(), z.string()])
    .nullish()
    .catch(undefined)
    .transform((value) => value ?? undefined);

/** The answer to a lookup by DOI, or null when the source holds no such work (its 404). */
export async function fetchByDoi(
    call: Call,
    url: string,
    headers?: Record<string, string>
): Promise<Reply | null> {
    try {
        return await call(url, headers);
    } catch (error) {
        if (error instanceof SourceStop && error.status === 404) return null;
        throw error;
    }
}
