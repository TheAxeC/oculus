// Layer 2, server. Crossref: `GET /works` with `query.bibliographic`, and `GET /works/<doi>` for a
// query that is a DOI (that path takes no `select`). Crossref names no open access, and its `link`
// entries are text-mining links, so none of them is offered as the open PDF. A work dated far in
// the future (a placeholder year) loses the date and the year in `hitOf`.

import { z } from 'zod';
import type { DocType, HitType } from '../../../../data/model/index.ts';
import {
    addressOf,
    hitOf,
    looseCount,
    fetchByDoi,
    pathOf,
    readJson,
    readRows,
    type Adapter,
    type Ask,
    type Page
} from './common.ts';

const BASE = 'https://api.crossref.org/works';

const SELECT =
    'DOI,title,author,published,type,is-referenced-by-count,container-title,abstract,link,license';

/** Crossref's own `type` for each document type it can be asked for. */
const ASKED: Partial<Record<DocType, string>> = {
    article: 'journal-article',
    preprint: 'posted-content',
    conference: 'proceedings-article',
    book: 'book',
    chapter: 'book-chapter'
};

const TYPES: Record<string, HitType> = {
    'journal-article': 'article',
    'posted-content': 'preprint',
    'proceedings-article': 'conference',
    book: 'book',
    'book-chapter': 'chapter'
};

const work = z.object({
    DOI: z.string(),
    title: z.array(z.string()).nullish().catch(undefined),
    author: z
        .array(
            z.object({
                given: z.string().nullish().catch(undefined),
                family: z.string().nullish().catch(undefined),
                name: z.string().nullish().catch(undefined)
            })
        )
        .nullish()
        .catch(undefined),
    published: z
        .object({ 'date-parts': z.array(z.array(z.number().nullable())).nullish() })
        .nullish()
        .catch(undefined),
    type: z.string().nullish().catch(undefined),
    'is-referenced-by-count': looseCount,
    'container-title': z.array(z.string()).nullish().catch(undefined),
    abstract: z.string().nullish().catch(undefined)
});

const list = z.object({
    message: z.object({
        'total-results': z.number().nullish().catch(undefined),
        items: z.array(z.unknown())
    })
});

const single = z.object({ message: z.unknown() });

/** A `date-parts` entry as `YYYY`, `YYYY-MM` or `YYYY-MM-DD`. */
function dateOf(parts: (number | null)[] | undefined): string | undefined {
    const year = parts?.[0];
    if (typeof year !== 'number') return undefined;
    const two = (n: number): string => String(n).padStart(2, '0');
    const month = parts?.[1];
    const day = parts?.[2];
    if (typeof month !== 'number') return String(year);
    if (typeof day !== 'number') return `${String(year)}-${two(month)}`;
    return `${String(year)}-${two(month)}-${two(day)}`;
}

function filterOf({ query }: Ask): string | undefined {
    const clauses: string[] = [];
    if (query.years !== null) {
        clauses.push(
            `from-pub-date:${String(query.years.from)}`,
            `until-pub-date:${String(query.years.to)}`
        );
    }
    const type = ASKED[query.type];
    if (type !== undefined) clauses.push(`type:${type}`);
    return clauses.length === 0 ? undefined : clauses.join(',');
}

async function ask(given: Ask): Promise<Page> {
    const { query, size, keys, call } = given;
    const offset = query.page === null ? 0 : Number(query.page);
    let items: unknown[];
    let total: number | null;
    let status: number;
    if (query.doi === undefined) {
        const url = addressOf(BASE, [
            ['query.bibliographic', query.q],
            ['rows', String(size)],
            ['offset', String(offset)],
            ['select', SELECT],
            ['filter', filterOf(given)],
            ['query.author', query.author === '' ? undefined : query.author],
            ['query.container-title', query.venue === '' ? undefined : query.venue],
            ['mailto', keys.mailto]
        ]);
        const reply = await call(url);
        status = reply.status;
        const body = readJson('crossref', status, reply.text, list);
        items = body.message.items;
        total = body.message['total-results'] ?? null;
    } else {
        const reply = await fetchByDoi(
            call,
            addressOf(`${BASE}/${pathOf(query.doi)}`, [['mailto', keys.mailto]])
        );
        if (reply === null) return { total: 0, more: false, cursor: null, hits: [] };
        status = reply.status;
        items = [readJson('crossref', status, reply.text, single).message];
        total = 1;
    }
    const hits = readRows('crossref', status, items, work).flatMap(({ row: one, at }) => {
        const hit = hitOf(
            'crossref',
            {
                id: one.DOI,
                doi: one.DOI,
                title: one.title?.[0],
                authors: (one.author ?? []).map(
                    (a) => a.name ?? [a.given, a.family].filter(Boolean).join(' ')
                ),
                venue: one['container-title']?.[0],
                date: dateOf(one.published?.['date-parts']?.[0]),
                type: TYPES[one.type ?? ''] ?? 'other',
                abstract: one.abstract,
                cites: one['is-referenced-by-count'],
                url: `https://doi.org/${one.DOI}`
            },
            offset + at + 1,
            given.now
        );
        return hit === null ? [] : [hit];
    });
    const next = offset + items.length;
    const more = query.doi === undefined && items.length > 0 && total !== null && next < total;
    return { total, more, cursor: more ? String(next) : null, hits };
}

export const crossref: Adapter = {
    id: 'crossref',
    gap: () => 1000,
    skips: () => false,
    ask
};
