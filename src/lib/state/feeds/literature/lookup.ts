// Layer 2, client state. Add on the Literature view: the one value the reader typed, read as a DOI,
// an arXiv paper or a PubMed paper, looked up through the sources the Literature search asks, and
// the paper the hits merge into. A value that is none of the three is an address and is saved as it
// is; the server makes the key of either (server/edit/feeds/literature-key.ts).
//
// Every source the search would ask is asked at once with the identifier as its query, the hits are
// merged as the search merges them (merge.ts), and the merged paper that carries the identifier is
// the one found: a source that searched the identifier as words may answer other papers, and they
// are left out. A lookup whose sources all fail finds nothing and says which failed, so the reader
// can try again; one where a source answered and none found the paper is the address's entry.

import { arxivId, pubmedId, queryDoi } from '../../../data/prose/literature.ts';
import { readJson } from '../../../data/shapes/shapes.ts';
import { t } from '../../shared/words/text.ts';
import { SOURCES_URL, answerOf, routeBody, searchUrl, sourceList } from './answers.ts';
import {
    parseForm,
    searchParams,
    sourcesOn,
    type Availability,
    type LiteratureSource
} from './form.ts';
import { mergeHits, type MergedHit } from './merge.ts';
import type { LiteratureHit } from '../../../data/model/index.ts';

/** What a typed value names: a paper by one identifier, with the query that asks for it. */
type Lookup = {
    by: 'doi' | 'arxiv' | 'pubmed';
    /** The identifier as the merge writes it. */
    id: string;
    /** What the search route is asked. */
    q: string;
    /** The address the paper's entry gets when no source finds it. */
    url: string;
};

/** A PubMed address: the PubMed site or the NCBI one, the identifier as the last path word. */
const PUBMED =
    /^https?:\/\/(?:pubmed\.ncbi\.nlm\.nih\.gov|(?:www\.)?ncbi\.nlm\.nih\.gov\/pubmed)\/(\d+)\/?$/i;

/** An arXiv address or identifier, as arxivId reads one; a bare number of digits is no arXiv id. */
const ARXIV =
    /^(?:https?:\/\/(?:www\.)?arxiv\.org\/|arxiv:|\d{4}\.\d{4,5}|[a-z-]+(?:\.[A-Za-z]{2})?\/\d{7})/i;

/** The paper a typed value names, or null for a value that is an address of anything else. */
export function lookupOf(typed: string): Lookup | null {
    const text = typed.trim();
    const doi = queryDoi(text);
    if (doi !== undefined) return { by: 'doi', id: doi, q: doi, url: `https://doi.org/${doi}` };
    const arxiv = ARXIV.test(text) ? arxivId(text) : undefined;
    if (arxiv !== undefined) {
        const url = `https://arxiv.org/abs/${arxiv}`;
        return { by: 'arxiv', id: arxiv, q: `10.48550/arxiv.${arxiv}`, url };
    }
    const pmid = pubmedId(PUBMED.exec(text)?.[1] ?? text);
    if (pmid !== undefined) {
        const url = `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`;
        return { by: 'pubmed', id: pmid, q: pmid, url };
    }
    return null;
}

/** Whether a merged paper carries the identifier a lookup names. */
function carries(paper: MergedHit, lookup: Lookup): boolean {
    if (lookup.by === 'doi') return paper.doi === lookup.id;
    if (lookup.by === 'arxiv') return paper.arxiv === lookup.id;
    return paper.pmid === lookup.id;
}

/** What a lookup came to: the paper, the sources that all failed, or nothing found. */
export type Found = { paper: MergedHit } | { failed: LiteratureSource[] } | { none: true };

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

/** Ask every source for the paper a lookup names and merge what they answer. */
export async function lookUp(
    lookup: Lookup,
    sources: LiteratureSource[],
    options: LookupOptions
): Promise<Found> {
    const answers = await Promise.all(sources.map((one) => askOne(one, lookup.q, options)));
    const failed = sources.filter((_one, at) => answers[at] === null);
    const hits = answers.flatMap((one) => one ?? []);
    const paper = mergeHits(hits).find((one) => carries(one, lookup));
    if (paper !== undefined) return { paper };
    if (sources.length > 0 && failed.length === sources.length) return { failed };
    return { none: true };
}

/** The name of a source. */
export function sourceName(source: LiteratureSource): string {
    if (source === 'openalex') return t('literature.source_openalex');
    if (source === 'semantic_scholar') return t('literature.source_semantic_scholar');
    if (source === 'crossref') return t('literature.source_crossref');
    if (source === 'pubmed') return t('literature.source_pubmed');
    if (source === 'europe_pmc') return t('literature.source_europe_pmc');
    if (source === 'arxiv') return t('literature.source_arxiv');
    if (source === 'wos') return t('literature.source_wos');
    return t('literature.source_scopus');
}

/** What the page takes a source to be before the server lists them: the keyless ones open. */
const KEYLESS: Availability = {
    openalex: true,
    semantic_scholar: true,
    crossref: true,
    pubmed: true,
    europe_pmc: true,
    arxiv: true,
    wos: false,
    scopus: false
};

/**
 * The sources a search the reader has not touched asks: those the machine can ask, by the server's
 * list of them, and the keyless ones when the list does not answer.
 */
export async function sourcesAsked(token: string): Promise<LiteratureSource[]> {
    const listing = sourceList(await routeBody(SOURCES_URL, token)) ?? [];
    const listed = Object.fromEntries(listing.map((one) => [one.id, one.available]));
    return sourcesOn(parseForm({}), { ...KEYLESS, ...listed });
}
