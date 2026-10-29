// Layer 2, client state. Add on the Literature view: the one value the reader typed, read as a DOI,
// an arXiv paper or a PubMed paper, looked up through the sources the Literature search asks, and
// the paper the hits merge into. A value that is none of the three is an address and is saved as it
// is; the server makes the key of either (server/edit/feeds/literature-key.ts).
//
// Every source the search would ask is asked at once with the identifier as its query, the hits are
// merged as the search merges them (merge.ts), and the merged paper that carries the identifier is
// the one found: a source that searched the identifier as words may answer other papers, and they
// are left out. A lookup whose sources all fail finds nothing and names the sources that failed, so
// the reader can try again; one where a source answered and none found the paper is the address's
// entry, the address of the identifier's row of the primary hub's `links` (`doi`, `arxiv` or
// `pubmed`), or none when the hub names no such row.

import { arxivId, pubmedId, queryDoi } from '../../../data/prose/literature.ts';
import { readJson } from '../../../data/shapes/shapes.ts';
import type { LinkRow } from '../../../data/sources/config/settings/rows/grammar.ts';
import { linkAddress } from '../../../data/sources/config/settings/rows/links.ts';
import { SOURCES_URL, answerOf, routeBody, searchUrl, sourceList } from './answers.ts';
import {
    parseForm,
    searchParams,
    sourceOn,
    type LiteratureSource,
    type SourceInfo
} from './form.ts';
import { mergeHits, type MergedHit, type MergeOrder } from './merge.ts';
import type { LiteratureHit } from '../../../data/model/index.ts';

/** What a typed value names: a paper by one identifier, with the query that asks for it. */
type Lookup = {
    by: 'doi' | 'arxiv' | 'pubmed';
    /** The identifier as the merge writes it. */
    id: string;
    /** What the search route is asked. */
    q: string;
    /** The address the paper's entry gets when no source finds it, absent with no `links` row. */
    url?: string;
};

/** A PubMed address: the PubMed site or the NCBI one, the identifier as the last path word. */
const PUBMED =
    /^https?:\/\/(?:pubmed\.ncbi\.nlm\.nih\.gov|(?:www\.)?ncbi\.nlm\.nih\.gov\/pubmed)\/(\d+)\/?$/i;

/** An arXiv address or identifier, as arxivId reads one; a bare number of digits is no arXiv id. */
const ARXIV =
    /^(?:https?:\/\/(?:www\.)?arxiv\.org\/|arxiv:|\d{4}\.\d{4,5}|[a-z-]+(?:\.[A-Za-z]{2})?\/\d{7})/i;

/** A lookup with the address of its identifier's `links` row, when the hub names one. */
function linked(lookup: Omit<Lookup, 'url'>, links: readonly LinkRow[]): Lookup {
    const url = linkAddress(links, lookup.by, lookup.id);
    return url === undefined ? lookup : { ...lookup, url };
}

/** The paper a typed value names, or null for a value that is an address of anything else. */
export function lookupOf(typed: string, links: readonly LinkRow[]): Lookup | null {
    const text = typed.trim();
    const doi = queryDoi(text);
    if (doi !== undefined) return linked({ by: 'doi', id: doi, q: doi }, links);
    const arxiv = ARXIV.test(text) ? arxivId(text) : undefined;
    if (arxiv !== undefined) {
        return linked({ by: 'arxiv', id: arxiv, q: `10.48550/arxiv.${arxiv}` }, links);
    }
    const pmid = pubmedId(PUBMED.exec(text)?.[1] ?? text);
    if (pmid !== undefined) return linked({ by: 'pubmed', id: pmid, q: pmid }, links);
    return null;
}

/** Whether a merged paper carries the identifier a lookup names. */
function carries(paper: MergedHit, lookup: Lookup): boolean {
    if (lookup.by === 'doi') return paper.doi === lookup.id;
    if (lookup.by === 'arxiv') return paper.arxiv === lookup.id;
    return paper.pmid === lookup.id;
}

/** What a lookup came to: the paper, the names of the sources that all failed, or nothing found. */
export type Found = { paper: MergedHit } | { failed: string[] } | { none: true };

/** What a lookup needs of the page: the write token and `fetch`. */
type LookupOptions = { token: string; fetcher?: typeof fetch };

/** One source's hits, or null when it failed, was limited, timed out or was refused. */
async function askOne(
    source: LiteratureSource,
    q: string,
    options: LookupOptions
): Promise<LiteratureHit[] | null> {
    const fetcher = options.fetcher ?? fetch;
    try {
        const response = await fetcher(searchUrl(searchParams(parseForm({ q }), source)), {
            headers: { 'x-oculus-token': options.token }
        });
        const answer = answerOf(await readJson(response));
        return response.ok && answer?.state === 'ok' ? answer.hits : null;
    } catch {
        return null;
    }
}

/**
 * Ask every source for the paper a lookup names and merge what they answer, in `order` (the
 * sources' order of the merge is that of `sources`).
 */
export async function lookUp(
    lookup: Lookup,
    sources: readonly SourceInfo[],
    order: Omit<MergeOrder, 'sources'>,
    options: LookupOptions
): Promise<Found> {
    const answers = await Promise.all(sources.map((one) => askOne(one.id, lookup.q, options)));
    const failed = sources.filter((_one, at) => answers[at] === null).map((one) => one.name);
    const hits = answers.flatMap((one) => one ?? []);
    const merged = mergeHits(hits, { ...order, sources: sources.map((one) => one.id) });
    const paper = merged.find((one) => carries(one, lookup));
    if (paper !== undefined) return { paper };
    if (sources.length > 0 && failed.length === sources.length) return { failed };
    return { none: true };
}

/**
 * The sources a search the reader has not touched asks: those the server lists as ones the
 * machine can ask, in its order; none when the list does not answer.
 */
export async function sourcesAsked(token: string): Promise<SourceInfo[]> {
    const listing = sourceList(await routeBody(SOURCES_URL, token)) ?? [];
    const form = parseForm({});
    return listing.filter((one) => sourceOn(form, one));
}
