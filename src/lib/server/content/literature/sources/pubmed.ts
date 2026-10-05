// Layer 2, server. PubMed through NCBI's E-utilities: `esearch` for the identifiers of one page in
// PubMed's relevance order, then `efetch` for their records as XML, which is read with
// fast-xml-parser and a schema (`esummary` carries no abstract). PubMed gives no citation count and
// no open access flag. A key and the contact address are query parameters of both requests.
//
// The title and the abstract can hold inline markup (`<i>`, `<sub>`), so those two elements are
// read as the text they hold and cleaned with plainText; every other value is an element's text.

import { XMLParser } from 'fast-xml-parser';
import { z } from 'zod';
import { SourceStop } from '../ask.ts';
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

const BASE = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils';

/** PubMed's publication type term for each document type it can be asked for. */
const ASKED: Partial<Record<DocType, string>> = {
    article: 'journal article',
    review: 'review',
    preprint: 'preprint'
};

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    parseTagValue: false,
    parseAttributeValue: false,
    processEntities: false,
    stopNodes: ['*.ArticleTitle', '*.AbstractText'],
    isArray: (name) =>
        ['PubmedArticle', 'Author', 'ArticleId', 'PublicationType', 'AbstractText'].includes(name)
});

/** An element's text: the text itself, or the text of an element that also has attributes. */
const element = z
    .union([z.string(), z.object({ '#text': looseText.catch(undefined) })])
    .nullish()
    .catch(undefined)
    .transform((value) => (typeof value === 'object' && value !== null ? value['#text'] : value));

const pubDate = z
    .object({
        Year: looseText.catch(undefined),
        Month: looseText.catch(undefined),
        Day: looseText.catch(undefined),
        MedlineDate: looseText.catch(undefined)
    })
    .nullish()
    .catch(undefined);

const author = z.object({
    LastName: looseText.catch(undefined),
    ForeName: looseText.catch(undefined),
    CollectiveName: looseText.catch(undefined)
});

const articleId = z.object({
    '#text': looseText.catch(undefined),
    '@_IdType': z.string().nullish()
});

const article = z.object({
    MedlineCitation: z.object({
        PMID: element,
        Article: z.object({
            ArticleTitle: element,
            Abstract: z
                .object({ AbstractText: z.array(element).nullish() })
                .nullish()
                .catch(undefined),
            AuthorList: z
                .object({ Author: z.array(author).nullish() })
                .nullish()
                .catch(undefined),
            Journal: z
                .object({
                    Title: looseText.catch(undefined),
                    JournalIssue: z.object({ PubDate: pubDate }).nullish().catch(undefined)
                })
                .nullish()
                .catch(undefined),
            PublicationTypeList: z
                .object({ PublicationType: z.array(element).nullish() })
                .nullish()
                .catch(undefined)
        })
    }),
    PubmedData: z
        .object({
            ArticleIdList: z
                .object({ ArticleId: z.array(articleId).nullish() })
                .nullish()
                .catch(undefined)
        })
        .nullish()
        .catch(undefined)
});

const found = z.object({
    esearchresult: z.object({
        count: looseText.catch(undefined),
        idlist: z.array(z.string()).nullish()
    })
});

const fetched = z.object({
    PubmedArticleSet: z
        .object({ PubmedArticle: z.array(z.unknown()).nullish() })
        .nullish()
        .catch(undefined)
});

/** PubMed's publication types as the document type; a review outranks a preprint and an article. */
function typeOf(listed: (string | null | undefined)[]): HitType {
    const has = (word: string): boolean => listed.some((one) => one?.toLowerCase() === word);
    if (has('review')) return 'review';
    if (has('preprint')) return 'preprint';
    if (has('journal article')) return 'article';
    return 'other';
}

/** The date of a publication: its year, month and day as far as they are numbers or months. */
function dateOf(date: z.infer<typeof pubDate>): string | undefined {
    const year = date?.Year ?? date?.MedlineDate?.match(/\d{4}/)?.[0];
    if (year === undefined) return undefined;
    const named = MONTHS.indexOf((date?.Month ?? '').slice(0, 3).toLowerCase()) + 1;
    const month = /^\d{1,2}$/.test(date?.Month ?? '') ? Number(date?.Month) : named;
    if (date?.Year === undefined || month < 1 || month > 12) return year;
    const two = (n: number): string => String(n).padStart(2, '0');
    const day = /^\d{1,2}$/.test(date.Day ?? '') ? Number(date.Day) : 0;
    return day >= 1 && day <= 31 ? `${year}-${two(month)}-${two(day)}` : `${year}-${two(month)}`;
}

/** The term esearch is asked, one clause per filter. */
function termOf({ query }: Ask): string {
    if (query.doi !== undefined) return `${query.doi}[doi]`;
    const parts = [query.q];
    if (query.years !== null) {
        parts.push(`${String(query.years.from)}:${String(query.years.to)}[dp]`);
    }
    const type = ASKED[query.type];
    if (type !== undefined) parts.push(`${type}[pt]`);
    if (query.oa) parts.push('free full text[sb]');
    if (query.venue !== '') parts.push(`"${query.venue.replace(/"/g, '')}"[ta]`);
    if (query.author !== '') {
        // An author is not quoted: PubMed finds nothing for a quoted name before `[au]`, and the
        // characters that open or close a clause or a field tag are taken out of it.
        parts.push(`${query.author.replace(/["[\]()]/g, '')}[au]`);
    }
    return parts.join(' AND ');
}

async function ask(given: Ask): Promise<Page> {
    const { query, size, keys, call } = given;
    const offset = query.page === null ? 0 : Number(query.page);
    const common: [string, string | undefined][] = [
        ['tool', 'oculus'],
        ['email', keys.mailto],
        ['api_key', keys.ncbiKey]
    ];
    const searched = await call(
        addressOf(`${BASE}/esearch.fcgi`, [
            ['db', 'pubmed'],
            ['term', termOf(given)],
            ['retmode', 'json'],
            ['retmax', String(size)],
            ['retstart', String(offset)],
            ['sort', 'relevance'],
            ...common
        ])
    );
    const result = readJson('pubmed', searched.status, searched.text, found).esearchresult;
    const ids = result.idlist ?? [];
    const total = result.count === undefined ? null : Number(result.count);
    const more = ids.length > 0 && total !== null && offset + ids.length < total;
    const cursor = more ? String(offset + ids.length) : null;
    if (ids.length === 0) return { total, more: false, cursor: null, hits: [] };

    const records = await call(
        addressOf(`${BASE}/efetch.fcgi`, [
            ['db', 'pubmed'],
            ['id', ids.join(',')],
            ['retmode', 'xml'],
            ...common
        ])
    );
    let tree: unknown;
    try {
        tree = parser.parse(records.text);
    } catch {
        throw new SourceStop('pubmed', 'failed', { status: records.status });
    }
    const set = fetched.safeParse(tree);
    if (!set.success) throw new SourceStop('pubmed', 'failed', { status: records.status });
    const rows = readRows(
        'pubmed',
        records.status,
        set.data.PubmedArticleSet?.PubmedArticle ?? [],
        article
    );

    // The records come in the order of the identifiers esearch ranked them.
    const byId = new Map(rows.map(({ row }) => [row.MedlineCitation.PMID ?? '', row]));
    const hits = ids.flatMap((id, at) => {
        const one = byId.get(id);
        if (one === undefined) return [];
        const cited = one.MedlineCitation.Article;
        const doi = (one.PubmedData?.ArticleIdList?.ArticleId ?? []).find(
            (entry) => entry['@_IdType'] === 'doi'
        )?.['#text'];
        const abstract = (cited.Abstract?.AbstractText ?? []).filter(Boolean).join(' ');
        const hit = hitOf(
            'pubmed',
            {
                id,
                doi,
                pmid: id,
                title: cited.ArticleTitle,
                authors: (cited.AuthorList?.Author ?? []).map(
                    (a) => a.CollectiveName ?? [a.ForeName, a.LastName].filter(Boolean).join(' ')
                ),
                venue: cited.Journal?.Title,
                date: dateOf(cited.Journal?.JournalIssue?.PubDate),
                type: typeOf(cited.PublicationTypeList?.PublicationType ?? []),
                abstract: abstract === '' ? undefined : abstract,
                url: `https://pubmed.ncbi.nlm.nih.gov/${id}/`
            },
            offset + at + 1,
            given.now
        );
        return hit === null ? [] : [hit];
    });
    return { total, more, cursor, hits };
}

export const pubmed: Adapter = {
    id: 'pubmed',
    gap: (keys) => (keys.ncbiKey === undefined ? 340 : 100),
    skips: () => false,
    ask
};
