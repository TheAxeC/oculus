// Layer 2, server. Europe PMC's REST search in its `core` result type, queried on title and
// abstract (a bare query matches the body of full texts). It pages by cursor: the answer's
// `nextCursorMark` is the next page's `cursorMark`. The open PDF is the full text link that is a
// PDF and open access.

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

const BASE = 'https://www.ebi.ac.uk/europepmc/webservices/rest/search';

/** The clause of the query for each document type it can be asked for. */
const ASKED: Partial<Record<DocType, string>> = {
    article: 'PUB_TYPE:"journal article"',
    review: 'PUB_TYPE:"review"',
    preprint: 'SRC:PPR'
};

const entry = z.object({
    id: looseText,
    source: z.string().nullish().catch(undefined),
    pmid: looseText.catch(undefined),
    doi: z.string().nullish().catch(undefined),
    title: z.string().nullish().catch(undefined),
    authorString: z.string().nullish().catch(undefined),
    pubYear: looseText.catch(undefined),
    firstPublicationDate: z.string().nullish().catch(undefined),
    citedByCount: looseCount,
    isOpenAccess: z.string().nullish().catch(undefined),
    pubTypeList: z
        .object({ pubType: z.array(z.string()).nullish() })
        .nullish()
        .catch(undefined),
    journalInfo: z
        .object({ journal: z.object({ title: z.string().nullish() }).nullish() })
        .nullish()
        .catch(undefined),
    abstractText: z.string().nullish().catch(undefined),
    fullTextUrlList: z
        .object({
            fullTextUrl: z
                .array(
                    z.object({
                        documentStyle: z.string().nullish(),
                        availabilityCode: z.string().nullish(),
                        url: z.string().nullish()
                    })
                )
                .nullish()
        })
        .nullish()
        .catch(undefined)
});

const answer = z.object({
    hitCount: z.number().nullish().catch(undefined),
    nextCursorMark: z.string().nullish().catch(undefined),
    resultList: z.object({ result: z.array(z.unknown()).nullish() }).nullish()
});

function typeOf(one: z.infer<typeof entry>): HitType {
    if (one.source === 'PPR') return 'preprint';
    const listed = (one.pubTypeList?.pubType ?? []).map((word) => word.toLowerCase());
    if (listed.includes('review')) return 'review';
    if (listed.includes('journal article') || listed.includes('research-article')) return 'article';
    return 'other';
}

/** "Faes A, Van Hulle MM." as its names. */
function authorsOf(text: string | null | undefined): string[] {
    return (text ?? '')
        .replace(/\.$/, '')
        .split(/,\s*/)
        .filter((name) => name !== '');
}

function queryOf({ query }: Ask): string {
    if (query.doi !== undefined) return `DOI:"${query.doi}"`;
    const quoted = (text: string): string => text.replace(/"/g, '');
    const clauses = [`TITLE_ABS:(${query.q})`];
    if (query.years !== null) {
        clauses.push(`PUB_YEAR:[${String(query.years.from)} TO ${String(query.years.to)}]`);
    }
    const type = ASKED[query.type];
    if (type !== undefined) clauses.push(type);
    if (query.oa) clauses.push('OPEN_ACCESS:y');
    if (query.venue !== '') clauses.push(`JOURNAL:"${quoted(query.venue)}"`);
    if (query.author !== '') clauses.push(`AUTH:"${quoted(query.author)}"`);
    return clauses.join(' AND ');
}

async function ask(given: Ask): Promise<Page> {
    const { query, size, call } = given;
    // The cursor this adapter hands out is `<hits so far>|<cursorMark>`, so a later page keeps its
    // place in the source's order; a bare cursorMark is read as a page that starts at 0.
    const held = /^(\d{1,9})\|(.+)$/.exec(query.page ?? '');
    const offset = held === null ? 0 : Number(held[1]);
    const cursor = held === null ? (query.page ?? '*') : held[2];
    const reply = await call(
        addressOf(BASE, [
            ['query', queryOf(given)],
            ['format', 'json'],
            ['resultType', 'core'],
            ['pageSize', String(size)],
            ['cursorMark', cursor]
        ])
    );
    const body = readJson('europe_pmc', reply.status, reply.text, answer);
    const rows = readRows('europe_pmc', reply.status, body.resultList?.result ?? [], entry);
    const hits = rows.flatMap(({ row: one, at }) => {
        const pdf = (one.fullTextUrlList?.fullTextUrl ?? []).find(
            (link) => link.documentStyle === 'pdf' && link.availabilityCode === 'OA'
        )?.url;
        const hit = hitOf(
            'europe_pmc',
            {
                id: `${one.source ?? 'MED'}:${one.id ?? ''}`,
                doi: one.doi,
                pmid: one.source === 'MED' ? (one.pmid ?? one.id) : one.pmid,
                title: one.title,
                authors: authorsOf(one.authorString),
                venue: one.journalInfo?.journal?.title,
                year: one.pubYear,
                date: one.firstPublicationDate,
                type: typeOf(one),
                abstract: one.abstractText,
                cites: one.citedByCount,
                oa: one.isOpenAccess === 'Y',
                pdf,
                url: `https://europepmc.org/article/${one.source ?? 'MED'}/${one.id ?? ''}`
            },
            offset + at + 1,
            given.now
        );
        return hit === null ? [] : [hit];
    });
    const got = body.resultList?.result?.length ?? 0;
    const total = body.hitCount ?? null;
    const next = body.nextCursorMark ?? null;
    const more =
        next !== null && next !== cursor && got > 0 && (total === null || offset + got < total);
    return { total, more, cursor: more ? `${String(offset + got)}|${next}` : null, hits };
}

export const europePmc: Adapter = {
    id: 'europe_pmc',
    gap: () => 0,
    skips: () => false,
    ask
};
