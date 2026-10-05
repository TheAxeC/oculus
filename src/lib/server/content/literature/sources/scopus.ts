// Layer 2, server. Scopus through Elsevier's Search API, with the machine's key in `X-ELS-APIKey`
// and, when it has one, its institution token in `X-ELS-Insttoken`. A search answers JSON whose
// `entry` list holds the records; an empty result is one entry carrying an `error`. The standard
// view gives the first author alone (`dc:creator`) and the complete view the whole list. The count
// per page is at most 25 in the standard view.

import { z } from 'zod';
import type { DocType, HitType } from '../../../../data/model/index.ts';
import {
    addressOf,
    hitOf,
    looseCount,
    looseText,
    readJson,
    readRows,
    type Adapter,
    type Ask,
    type Page
} from './common.ts';

const BASE = 'https://api.elsevier.com/content/search/scopus';

/** The most records one page of the standard view holds. */
const PAGE_MAX = 25;

/** The `DOCTYPE` code for each document type it can be asked for. */
const ASKED: Partial<Record<DocType, string>> = {
    article: 'ar',
    review: 're',
    conference: 'cp',
    book: 'bk',
    chapter: 'ch'
};

const TYPES: Record<string, HitType> = {
    ar: 'article',
    re: 'review',
    cp: 'conference',
    bk: 'book',
    ch: 'chapter'
};

const record = z.object({
    'dc:identifier': looseText.catch(undefined),
    eid: looseText.catch(undefined),
    'dc:title': z.string().nullish().catch(undefined),
    'dc:creator': z.string().nullish().catch(undefined),
    author: z
        .array(z.object({ authname: z.string().nullish().catch(undefined) }))
        .nullish()
        .catch(undefined),
    'prism:publicationName': z.string().nullish().catch(undefined),
    'prism:coverDate': z.string().nullish().catch(undefined),
    'prism:doi': z.string().nullish().catch(undefined),
    'dc:description': z.string().nullish().catch(undefined),
    'citedby-count': looseCount,
    subtype: z.string().nullish().catch(undefined),
    openaccessFlag: z.union([z.boolean(), z.string(), z.number()]).nullish().catch(undefined),
    'pubmed-id': looseText.catch(undefined),
    link: z
        .array(
            z.object({
                '@ref': z.string().nullish().catch(undefined),
                '@href': z.string().nullish().catch(undefined)
            })
        )
        .nullish()
        .catch(undefined)
});

const answer = z.object({
    'search-results': z.object({
        'opensearch:totalResults': looseText.catch(undefined),
        entry: z.array(z.unknown()).nullish()
    })
});

/** An `error` entry: the one record Scopus answers for a result set that is empty. */
const empty = z.object({ error: z.string() });

/** Whether the open access flag says open. */
function isOpen(flag: boolean | string | number | null | undefined): boolean {
    return flag === true || flag === 1 || flag === '1' || flag === 'true';
}

/**
 * The address of the record page among a hit's links. Elsevier writes its own host `www.scopus.com`
 * as `http:`, and that host serves the same page over `https:`, so the address is read with the
 * scheme changed; an `http:` link to any other host is left for the hit reader to drop.
 */
function recordLink(
    links:
        | { '@ref'?: string | null | undefined; '@href'?: string | null | undefined }[]
        | null
        | undefined
): string | undefined {
    const href = (links ?? []).find((link) => link['@ref'] === 'scopus')?.['@href'];
    if (typeof href !== 'string') return undefined;
    try {
        const address = new URL(href);
        if (address.protocol !== 'http:' || address.hostname !== 'www.scopus.com') return href;
        if (address.port !== '') return href;
        address.protocol = 'https:';
        return address.href;
    } catch {
        return undefined;
    }
}

function queryOf({ query }: Ask): string {
    if (query.doi !== undefined) return `DOI(${query.doi})`;
    const plain = (text: string): string => text.replace(/"/g, ' ').replace(/\s+/g, ' ').trim();
    const parts = [`TITLE-ABS-KEY(${query.q})`];
    if (query.years !== null) {
        parts.push(
            `PUBYEAR > ${String(query.years.from - 1)} AND PUBYEAR < ${String(query.years.to + 1)}`
        );
    }
    const type = ASKED[query.type];
    if (type !== undefined) parts.push(`DOCTYPE(${type})`);
    if (query.oa) parts.push('OPENACCESS(1)');
    if (query.venue !== '') parts.push(`SRCTITLE(${plain(query.venue)})`);
    if (query.author !== '') parts.push(`AUTH(${plain(query.author)})`);
    return parts.join(' AND ');
}

async function ask(given: Ask): Promise<Page> {
    const { query, size, keys, call } = given;
    const count = Math.min(size, PAGE_MAX);
    const offset = query.page === null ? 0 : Number(query.page);
    const headers: Record<string, string> = {
        'X-ELS-APIKey': keys.scopusKey ?? '',
        accept: 'application/json'
    };
    if (keys.scopusInsttoken !== undefined) headers['X-ELS-Insttoken'] = keys.scopusInsttoken;
    const reply = await call(
        addressOf(BASE, [
            ['query', queryOf(given)],
            ['count', String(count)],
            ['start', String(offset)],
            ['sort', 'relevancy']
        ]),
        headers
    );
    const body = readJson('scopus', reply.status, reply.text, answer)['search-results'];
    const entries = (body.entry ?? []).filter((one) => !empty.safeParse(one).success);
    const total =
        body['opensearch:totalResults'] === undefined
            ? null
            : Number(body['opensearch:totalResults']);
    const hits = readRows('scopus', reply.status, entries, record).flatMap(({ row: one, at }) => {
        const listed = (one.author ?? []).map((a) => a.authname);
        const hit = hitOf(
            'scopus',
            {
                id: one.eid ?? one['dc:identifier'] ?? '',
                doi: one['prism:doi'],
                pmid: one['pubmed-id'],
                title: one['dc:title'],
                authors: listed.length > 0 ? listed : [one['dc:creator']],
                venue: one['prism:publicationName'],
                date: one['prism:coverDate'],
                type: TYPES[one.subtype ?? ''] ?? 'other',
                abstract: one['dc:description'],
                url: recordLink(one.link),
                cites: one['citedby-count'],
                oa: isOpen(one.openaccessFlag)
            },
            offset + at + 1,
            given.now
        );
        return hit === null ? [] : [hit];
    });
    const next = offset + entries.length;
    const more = entries.length > 0 && total !== null && next < total;
    return { total, more, cursor: more ? String(next) : null, hits };
}

export const scopus: Adapter = {
    id: 'scopus',
    key: { name: 'scopus_key', value: (keys) => keys.scopusKey },
    gap: () => 0,
    skips: () => false,
    ask
};
