// Layer 2, server. OpenAlex: `GET /works` filtered on title and abstract, in its own relevance
// order. The abstract comes as an inverted index (each word with the places it stands at) and is
// put back in order here. The key, when the machine has one, is the `api_key` parameter, which is
// why no address of this source is ever logged.

import { z } from 'zod';
import { httpsLink } from '../../../accounts/connect/api.ts';
import { arxivId } from '../../../../data/prose/literature.ts';
import type { DocType, HitType } from '../../../../data/model/index.ts';
import {
    addressOf,
    hitOf,
    looseText,
    readJson,
    readRows,
    type Adapter,
    type Ask,
    type Page
} from './common.ts';

const BASE = 'https://api.openalex.org/works';

const SELECT =
    'id,doi,display_name,publication_year,publication_date,type,cited_by_count,open_access,best_oa_location,primary_location,authorships,ids,abstract_inverted_index,locations';

/** OpenAlex's own `type` for each document type it can be asked for. */
const ASKED: Partial<Record<DocType, string>> = {
    article: 'article',
    review: 'review',
    preprint: 'preprint',
    conference: 'conference-paper',
    book: 'book',
    chapter: 'book-chapter'
};

/** The document type a work's `type` is. */
const TYPES: Record<string, HitType> = {
    article: 'article',
    review: 'review',
    preprint: 'preprint',
    'conference-paper': 'conference',
    book: 'book',
    'book-chapter': 'chapter'
};

const location = z
    .object({
        landing_page_url: z.string().nullish().catch(undefined),
        pdf_url: z.string().nullish().catch(undefined),
        source: z.object({ display_name: z.string().nullish() }).nullish().catch(undefined)
    })
    .nullish()
    .catch(undefined);

const work = z.object({
    id: z.string(),
    doi: z.string().nullish().catch(undefined),
    display_name: z.string().nullish().catch(undefined),
    publication_year: looseText.catch(undefined),
    publication_date: z.string().nullish().catch(undefined),
    type: z.string().nullish().catch(undefined),
    cited_by_count: z.number().nullish().catch(undefined),
    open_access: z.object({ is_oa: z.boolean().nullish() }).nullish().catch(undefined),
    best_oa_location: location,
    primary_location: location,
    locations: z.array(location).nullish().catch(undefined),
    authorships: z
        .array(z.object({ author: z.object({ display_name: z.string().nullish() }).nullish() }))
        .nullish()
        .catch(undefined),
    ids: z.object({ pmid: z.string().nullish() }).nullish().catch(undefined),
    abstract_inverted_index: z.record(z.string(), z.array(z.number())).nullish().catch(undefined)
});

const answer = z.object({
    meta: z
        .object({ count: z.number().nullish().catch(undefined) })
        .nullish()
        .catch(undefined),
    results: z.array(z.unknown())
});

/** The words of an inverted index in the order of their places. */
function abstractOf(index: Record<string, number[]> | null | undefined): string | undefined {
    if (index === null || index === undefined) return undefined;
    const places: (string | undefined)[] = [];
    for (const [word, at] of Object.entries(index)) {
        for (const place of at) if (place >= 0 && place < 100_000) places[place] = word;
    }
    const text = places.filter((word): word is string => word !== undefined).join(' ');
    return text === '' ? undefined : text;
}

/** The arXiv identifier a work's locations name, when one of them is an arXiv page. */
function arxivOf(locations: z.infer<typeof location>[] | null | undefined): string | undefined {
    for (const one of locations ?? []) {
        const found = arxivId(one?.landing_page_url ?? undefined);
        if (found !== undefined && /arxiv\.org\//i.test(one?.landing_page_url ?? '')) return found;
    }
    return undefined;
}

/** The filter OpenAlex is asked with: the clauses joined by commas, a comma in a value a space. */
function filterOf({ query }: Ask): string {
    const flat = (text: string): string => text.replace(/,/g, ' ');
    const clauses = [
        query.doi === undefined ? `title_and_abstract.search:${flat(query.q)}` : `doi:${query.doi}`
    ];
    if (query.years !== null) {
        clauses.push(`publication_year:${String(query.years.from)}-${String(query.years.to)}`);
    }
    const type = ASKED[query.type];
    if (type !== undefined) clauses.push(`type:${type}`);
    if (query.oa) clauses.push('is_oa:true');
    if (query.minCites > 0) clauses.push(`cited_by_count:>${String(query.minCites - 1)}`);
    if (query.author !== '') clauses.push(`raw_author_name.search:${flat(query.author)}`);
    return clauses.join(',');
}

async function ask(given: Ask): Promise<Page> {
    const { query, size, keys, call } = given;
    const index = query.page === null ? 0 : Number(query.page);
    const url = addressOf(BASE, [
        ['filter', filterOf(given)],
        ['per-page', String(size)],
        ['page', String(index + 1)],
        ['select', SELECT],
        ['mailto', keys.mailto],
        ['api_key', keys.openalexKey]
    ]);
    const reply = await call(url);
    const body = readJson('openalex', reply.status, reply.text, answer);
    const total = body.meta?.count ?? null;
    const rows = readRows('openalex', reply.status, body.results, work);
    const hits = rows.flatMap(({ row: one, at }) => {
        const hit = hitOf(
            'openalex',
            {
                id: one.id,
                doi: one.doi,
                pmid: one.ids?.pmid?.match(/(\d+)\/?$/)?.[1],
                arxiv: arxivOf(one.locations),
                title: one.display_name,
                authors: (one.authorships ?? []).map((a) => a.author?.display_name),
                venue: one.primary_location?.source?.display_name,
                year: one.publication_year,
                date: one.publication_date,
                type: TYPES[one.type ?? ''] ?? 'other',
                abstract: abstractOf(one.abstract_inverted_index),
                cites: one.cited_by_count,
                oa: one.open_access?.is_oa,
                pdf: one.best_oa_location?.pdf_url,
                url: httpsLink(one.primary_location?.landing_page_url ?? undefined) ?? one.id
            },
            index * size + at + 1,
            given.now
        );
        return hit === null ? [] : [hit];
    });
    const more = total !== null && (index + 1) * size < total && body.results.length > 0;
    return { total, more, cursor: more ? String(index + 1) : null, hits };
}

export const openalex: Adapter = {
    id: 'openalex',
    gap: () => 0,
    skips: () => false,
    ask
};
