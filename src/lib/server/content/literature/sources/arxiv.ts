// Layer 2, server. arXiv's query API, which answers Atom. Every hit is a preprint and open, with
// the abstract page and the PDF built from the identifier (an entry's own `<id>` is an `http`
// address). A search it cannot hold is `skipped`: arXiv has no venue, no citation count and no
// document type other than the preprint. An arXiv DOI (`10.48550/arXiv.<id>`) is looked up by
// identifier; any other DOI is not asked here. The query is sent as its words and quoted phrases,
// each as an `all:` term.

import { XMLParser } from 'fast-xml-parser';
import { z } from 'zod';
import { arxivId, arxivOfDoi } from '../../../../data/prose/literature.ts';
import { SourceStop } from '../ask.ts';
import type { LiteratureQuery } from '../request.ts';
import {
    addressOf,
    hitOf,
    looseText,
    readRows,
    type Adapter,
    type Ask,
    type Page
} from './common.ts';

const BASE = 'https://export.arxiv.org/api/query';

const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    parseTagValue: false,
    parseAttributeValue: false,
    processEntities: false,
    isArray: (name) => name === 'entry' || name === 'author' || name === 'link'
});

const entry = z.object({
    id: z.string(),
    title: looseText.catch(undefined),
    summary: looseText.catch(undefined),
    published: looseText.catch(undefined),
    author: z
        .array(z.object({ name: looseText.catch(undefined) }))
        .nullish()
        .catch(undefined),
    'arxiv:doi': z
        .union([z.string(), z.object({ '#text': looseText.catch(undefined) })])
        .nullish()
        .catch(undefined)
});

const feed = z.object({
    feed: z.object({
        'opensearch:totalResults': looseText.catch(undefined),
        entry: z.array(z.unknown()).nullish()
    })
});

/** A word or quoted phrase of the query as an `all:` term. */
function termsOf(q: string): string {
    const terms = [...q.matchAll(/"([^"]+)"|(\S+)/g)].map((found) =>
        found[1] ? `all:"${found[1]}"` : `all:${found[2]}`
    );
    return terms.join(' AND ');
}

/** An author as the `au:` term takes it: quoted when it is more than one word. */
function authorTerm(author: string): string {
    const name = author.replace(/"/g, ' ').replace(/\s+/g, ' ').trim();
    return /\s/.test(name) ? `au:"${name}"` : `au:${name}`;
}

function skips(query: LiteratureQuery): boolean {
    if (query.type !== 'any' && query.type !== 'preprint') return true;
    if (query.venue !== '' || query.minCites > 0) return true;
    return query.doi !== undefined && arxivOfDoi(query.doi) === undefined;
}

async function ask(given: Ask): Promise<Page> {
    const { query, size, call } = given;
    const offset = query.page === null ? 0 : Number(query.page);
    const byId = query.doi === undefined ? undefined : arxivOfDoi(query.doi);
    const clauses = [termsOf(query.q)];
    if (query.years !== null) {
        clauses.push(
            `submittedDate:[${String(query.years.from)}01010000 TO ${String(query.years.to)}12312359]`
        );
    }
    if (query.author !== '') clauses.push(authorTerm(query.author));
    const url = addressOf(BASE, [
        byId === undefined ? ['search_query', clauses.join(' AND ')] : ['id_list', byId],
        ['start', String(offset)],
        ['max_results', String(size)],
        ['sortBy', 'relevance'],
        ['sortOrder', 'descending']
    ]);
    const reply = await call(url);
    let tree: unknown;
    try {
        tree = parser.parse(reply.text);
    } catch {
        throw new SourceStop('arxiv', 'failed', { status: reply.status });
    }
    const read = feed.safeParse(tree);
    if (!read.success) throw new SourceStop('arxiv', 'failed', { status: reply.status });
    const entries = read.data.feed.entry ?? [];
    const total =
        read.data.feed['opensearch:totalResults'] === undefined
            ? null
            : Number(read.data.feed['opensearch:totalResults']);
    const hits = readRows('arxiv', reply.status, entries, entry).flatMap(({ row: one, at }) => {
        const id = arxivId(one.id);
        if (id === undefined) return [];
        const doi =
            typeof one['arxiv:doi'] === 'object' ? one['arxiv:doi']?.['#text'] : one['arxiv:doi'];
        const hit = hitOf(
            'arxiv',
            {
                id,
                arxiv: id,
                doi,
                title: one.title,
                authors: (one.author ?? []).map((a) => a.name),
                date: one.published,
                type: 'preprint',
                abstract: one.summary,
                oa: true,
                pdf: `https://arxiv.org/pdf/${id}`,
                url: `https://arxiv.org/abs/${id}`
            },
            offset + at + 1,
            given.now
        );
        return hit === null ? [] : [hit];
    });
    const next = offset + entries.length;
    const more = byId === undefined && entries.length > 0 && total !== null && next < total;
    return { total, more, cursor: more ? String(next) : null, hits };
}

export const arxiv: Adapter = {
    id: 'arxiv',
    gap: () => 3000,
    skips,
    ask
};
