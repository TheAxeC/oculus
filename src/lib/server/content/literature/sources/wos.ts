// Layer 2, server. Web of Science through Clarivate's Starter API, with the machine's key in the
// `X-ApiKey` header. A Starter record has no abstract and no open access flag; it carries the WoS
// citation count, the DOI and the PubMed identifier. The API pages by page number from 1 and
// answers at most 50 records a page.

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

const BASE = 'https://api.clarivate.com/apis/wos-starter/v1/documents';

/** The most records one page of the API holds. */
const PAGE_MAX = 50;

/** The `DT` value for each document type it can be asked for. */
const ASKED: Partial<Record<DocType, string>> = {
    article: 'Article',
    review: 'Review',
    conference: '"Proceedings Paper"'
};

const TYPES: Record<string, HitType> = {
    Article: 'article',
    Review: 'review',
    'Proceedings Paper': 'conference'
};

const record = z.object({
    uid: z.string(),
    title: z.string().nullish().catch(undefined),
    types: z.array(z.string()).nullish().catch(undefined),
    source: z
        .object({
            sourceTitle: z.string().nullish().catch(undefined),
            publishYear: looseText.catch(undefined)
        })
        .nullish()
        .catch(undefined),
    names: z
        .object({
            authors: z.array(z.object({ displayName: z.string().nullish() })).nullish()
        })
        .nullish()
        .catch(undefined),
    links: z.object({ record: z.string().nullish() }).nullish().catch(undefined),
    citations: z
        .array(z.object({ db: z.string().nullish(), count: looseCount }))
        .nullish()
        .catch(undefined),
    identifiers: z
        .object({ doi: z.string().nullish(), pmid: looseText.catch(undefined) })
        .nullish()
        .catch(undefined)
});

const answer = z.object({
    metadata: z
        .object({ total: z.number().nullish().catch(undefined) })
        .nullish()
        .catch(undefined),
    hits: z.array(z.unknown())
});

function queryOf({ query }: Ask): string {
    if (query.doi !== undefined) return `DO=(${query.doi})`;
    const plain = (text: string): string => text.replace(/"/g, ' ').replace(/\s+/g, ' ').trim();
    const parts = [`TS=(${query.q})`];
    if (query.years !== null)
        parts.push(`PY=${String(query.years.from)}-${String(query.years.to)}`);
    const type = ASKED[query.type];
    if (type !== undefined) parts.push(`DT=(${type})`);
    if (query.venue !== '') parts.push(`SO=(${plain(query.venue)})`);
    if (query.author !== '') parts.push(`AU=(${plain(query.author)})`);
    return parts.join(' AND ');
}

async function ask(given: Ask): Promise<Page> {
    const { query, size, keys, call } = given;
    const limit = Math.min(size, PAGE_MAX);
    const index = query.page === null ? 0 : Number(query.page);
    const reply = await call(
        addressOf(BASE, [
            ['q', queryOf(given)],
            ['db', 'WOS'],
            ['limit', String(limit)],
            ['page', String(index + 1)],
            ['sortField', 'RS D']
        ]),
        { 'X-ApiKey': keys.wosKey ?? '' }
    );
    const body = readJson('wos', reply.status, reply.text, answer);
    const total = body.metadata?.total ?? null;
    const hits = readRows('wos', reply.status, body.hits, record).flatMap(({ row: one, at }) => {
        const hit = hitOf(
            'wos',
            {
                id: one.uid,
                doi: one.identifiers?.doi,
                pmid: one.identifiers?.pmid,
                title: one.title,
                authors: (one.names?.authors ?? []).map((a) => a.displayName),
                venue: one.source?.sourceTitle,
                year: one.source?.publishYear,
                type: TYPES[one.types?.[0] ?? ''] ?? 'other',
                cites: one.citations?.find((c) => c.db === 'WOS')?.count,
                url: one.links?.record
            },
            index * limit + at + 1,
            given.now
        );
        return hit === null ? [] : [hit];
    });
    const more = body.hits.length > 0 && total !== null && (index + 1) * limit < total;
    return { total, more, cursor: more ? String(index + 1) : null, hits };
}

export const wos: Adapter = {
    id: 'wos',
    key: { name: 'wos_key', value: (keys) => keys.wosKey },
    gap: () => 0,
    skips: () => false,
    ask
};
