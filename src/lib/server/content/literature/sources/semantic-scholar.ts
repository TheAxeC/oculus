// Layer 2, server. Semantic Scholar's Graph API: `GET /paper/search`, and `GET /paper/DOI:<doi>`
// for a query that is a DOI. Its search has no sort, so the page's relevance order is the one
// asked for. The key, when there is one, is the `x-api-key` header; without it the source answers
// 429 to most requests, which is its `limited` state.

import { z } from 'zod';
import type { DocType, HitType } from '../../../../data/model/index.ts';
import {
    addressOf,
    hitOf,
    looseCount,
    fetchByDoi,
    looseText,
    pathOf,
    readJson,
    readRows,
    type Adapter,
    type Ask,
    type Page
} from './common.ts';

const BASE = 'https://api.semanticscholar.org/graph/v1/paper';

const FIELDS =
    'title,abstract,year,venue,authors,externalIds,citationCount,isOpenAccess,openAccessPdf,publicationTypes,publicationDate,journal,url,citationStyles';

/** Semantic Scholar's publication type for each document type it can be asked for. */
const ASKED: Partial<Record<DocType, string>> = {
    article: 'JournalArticle',
    review: 'Review',
    conference: 'Conference',
    book: 'Book',
    chapter: 'BookSection'
};

/** The types a paper lists, each with the document type it is; a review outranks an article. */
const TYPES: [string, HitType][] = [
    ['Review', 'review'],
    ['JournalArticle', 'article'],
    ['Conference', 'conference'],
    ['Book', 'book'],
    ['BookSection', 'chapter']
];

const paper = z.object({
    paperId: z.string(),
    title: z.string().nullish().catch(undefined),
    abstract: z.string().nullish().catch(undefined),
    year: looseText.catch(undefined),
    venue: z.string().nullish().catch(undefined),
    authors: z
        .array(z.object({ name: z.string().nullish() }))
        .nullish()
        .catch(undefined),
    externalIds: z
        .object({
            DOI: z.string().nullish().catch(undefined),
            ArXiv: z.string().nullish().catch(undefined),
            PubMed: looseText.catch(undefined)
        })
        .nullish()
        .catch(undefined),
    citationCount: looseCount,
    isOpenAccess: z.boolean().nullish().catch(undefined),
    openAccessPdf: z.object({ url: z.string().nullish() }).nullish().catch(undefined),
    publicationTypes: z.array(z.string()).nullish().catch(undefined),
    publicationDate: z.string().nullish().catch(undefined),
    journal: z.object({ name: z.string().nullish() }).nullish().catch(undefined),
    url: z.string().nullish().catch(undefined),
    citationStyles: z.object({ bibtex: z.string().nullish() }).nullish().catch(undefined)
});

const search = z.object({
    total: z.number().nullish().catch(undefined),
    next: z.number().nullish().catch(undefined),
    data: z.array(z.unknown()).nullish()
});

function typeOf(listed: string[] | null | undefined): HitType {
    for (const [word, type] of TYPES) if (listed?.includes(word) === true) return type;
    return 'other';
}

async function ask(given: Ask): Promise<Page> {
    const { query, size, keys, call } = given;
    const headers: Record<string, string> =
        keys.semanticScholarKey === undefined ? {} : { 'x-api-key': keys.semanticScholarKey };
    const offset = query.page === null ? 0 : Number(query.page);
    let papers: unknown[];
    let total: number | null;
    let next: number | null = null;
    let status: number;
    if (query.doi === undefined) {
        const asked = ASKED[query.type];
        const url = addressOf(`${BASE}/search`, [
            ['query', query.q],
            ['offset', String(offset)],
            ['limit', String(size)],
            ['fields', FIELDS],
            [
                'year',
                query.years === null
                    ? undefined
                    : `${String(query.years.from)}-${String(query.years.to)}`
            ],
            ['publicationTypes', asked],
            ['openAccessPdf', query.oa ? '' : undefined],
            ['minCitationCount', query.minCites > 0 ? String(query.minCites) : undefined],
            ['venue', query.venue === '' ? undefined : query.venue]
        ]);
        const reply = await call(url, headers);
        status = reply.status;
        const body = readJson('semantic_scholar', status, reply.text, search);
        papers = body.data ?? [];
        total = body.total ?? null;
        next = body.next ?? null;
    } else {
        const url = addressOf(`${BASE}/DOI:${pathOf(query.doi)}`, [['fields', FIELDS]]);
        const reply = await fetchByDoi(call, url, headers);
        if (reply === null) return { total: 0, more: false, cursor: null, hits: [] };
        status = reply.status;
        papers = [readJson('semantic_scholar', status, reply.text, z.unknown())];
        total = 1;
    }
    const rows = readRows('semantic_scholar', status, papers, paper);
    const hits = rows.flatMap(({ row: one, at }) => {
        const hit = hitOf(
            'semantic_scholar',
            {
                id: one.paperId,
                doi: one.externalIds?.DOI,
                pmid: one.externalIds?.PubMed,
                arxiv: one.externalIds?.ArXiv,
                title: one.title,
                authors: (one.authors ?? []).map((a) => a.name),
                venue: one.journal?.name ?? one.venue,
                year: one.year,
                date: one.publicationDate,
                type: typeOf(one.publicationTypes),
                abstract: one.abstract,
                cites: one.citationCount,
                oa: one.isOpenAccess,
                pdf: one.openAccessPdf?.url,
                url: one.url,
                bibtex: one.citationStyles?.bibtex
            },
            offset + at + 1,
            given.now
        );
        return hit === null ? [] : [hit];
    });
    const more = next !== null && papers.length > 0;
    return { total, more, cursor: more ? String(next) : null, hits };
}

export const semanticScholar: Adapter = {
    id: 'semantic_scholar',
    gap: () => 1000,
    skips: () => false,
    ask
};
