// Layer 2, client state. The hits of the sources made into one list: the merge, the filters applied
// again after the fetch, and the sort. All of it is a function of the hits and the form, so the
// list is drawn from the answers kept and a change of sort or of a filter asks nothing.
//
// Two hits are one when they share a DOI, a PubMed id or an arXiv id, each compared exactly after
// it is written the one way (data/prose/literature.ts). A DataCite DOI of arXiv
// (`10.48550/arxiv.<id>`) counts as the arXiv id it names. A preprint and its published version
// are one hit when some hit names both identifiers, because that hit then shares the DOI with the
// published hit and the arXiv id with the preprint, and the chain joins them. No title is ever
// compared. A hit that carries none of the three is one hit with itself alone, and with a later
// copy of itself from the same source.
//
// Which source's field a merged hit shows is a fixed order of sources, the published hits taken
// before the preprints for the fields that describe the paper (title, venue, year, date, type), so
// a published version's title is never replaced by its preprint's.

import {
    LITERATURE_SOURCES,
    type DocType,
    type HitType,
    type LiteratureHit,
    type LiteratureSource
} from '../../../data/model/index.ts';
import {
    arxivId,
    arxivOfDoi,
    latestYear,
    normalDoi,
    pubmedId,
    wholeNumber
} from '../../../data/prose/literature.ts';
import type { LiteratureForm, LiteratureSort } from './form.ts';

/** The constant of reciprocal rank fusion: a hit's score from one source is 1 / (60 + rank). */
const FUSION = 60;

/** The sources whose title, venue, year, date and type are taken first, in order. */
const FIELD_ORDER: LiteratureSource[] = [
    'crossref',
    'pubmed',
    'europe_pmc',
    'scopus',
    'wos',
    'openalex',
    'semantic_scholar',
    'arxiv'
];

/** The sources whose abstract is taken first, in order. */
const ABSTRACT_ORDER: LiteratureSource[] = [
    'pubmed',
    'europe_pmc',
    'semantic_scholar',
    'openalex',
    'arxiv',
    'crossref',
    'scopus'
];

/** The sources whose open PDF is taken first, in order. */
const PDF_ORDER: LiteratureSource[] = ['openalex', 'europe_pmc', 'semantic_scholar', 'arxiv'];

/** One paper, with what every source that found it says. */
export type MergedHit = {
    /** Stable between searches, so a list keyed by it keeps its cards. */
    key: string;
    title: string;
    authors: string[];
    venue?: string;
    year?: number;
    date?: string;
    type: HitType;
    abstract?: string;
    /** The highest count any source gives. */
    cites?: number;
    /** Each source's own count. */
    citesBy: Partial<Record<LiteratureSource, number>>;
    oa: boolean;
    pdf?: string;
    url?: string;
    doi?: string;
    pmid?: string;
    arxiv?: string;
    /** The Semantic Scholar paper id, when Semantic Scholar found it. */
    s2?: string;
    /** The sources that found it, in the route's order. */
    sources: LiteratureSource[];
    /** The fused relevance: the higher, the earlier. */
    relevance: number;
};

/**
 * The hit with its identifiers written the one way, so a DOI with its address or in capitals is the
 * DOI it names. The server writes them this way already; the merge does not rely on it.
 */
function tidy(hit: LiteratureHit): LiteratureHit {
    const { doi, pmid, arxiv, ...rest } = hit;
    const tidied: LiteratureHit = { ...rest };
    const doiText = normalDoi(doi);
    const pmidText = pubmedId(pmid);
    const arxivText = arxivId(arxiv);
    if (doiText !== undefined) tidied.doi = doiText;
    if (pmidText !== undefined) tidied.pmid = pmidText;
    if (arxivText !== undefined) tidied.arxiv = arxivText;
    return tidied;
}

/** The identifiers a hit is joined to others by. */
function identifiersOf(hit: LiteratureHit): string[] {
    const keys: string[] = [];
    if (hit.doi !== undefined) keys.push(`doi:${hit.doi}`);
    if (hit.pmid !== undefined) keys.push(`pmid:${hit.pmid}`);
    const arxiv = hit.arxiv ?? arxivOfDoi(hit.doi);
    if (arxiv !== undefined) keys.push(`arxiv:${arxiv}`);
    keys.push(`own:${hit.source}:${hit.id}`);
    return keys;
}

/** The hits grouped by every identifier two of them share, each group in the order first seen. */
function groupsOf(hits: LiteratureHit[]): LiteratureHit[][] {
    const parent = hits.map((_hit, at) => at);
    const find = (at: number): number => {
        let root = at;
        while (parent[root] !== root) root = parent[root];
        while (parent[at] !== root) {
            const next = parent[at];
            parent[at] = root;
            at = next;
        }
        return root;
    };
    const seen = new Map<string, number>();
    hits.forEach((hit, at) => {
        for (const key of identifiersOf(hit)) {
            const earlier = seen.get(key);
            if (earlier === undefined) seen.set(key, at);
            else parent[find(at)] = find(earlier);
        }
    });
    const groups = new Map<number, LiteratureHit[]>();
    hits.forEach((hit, at) => {
        const root = find(at);
        groups.set(root, [...(groups.get(root) ?? []), hit]);
    });
    return [...groups.values()];
}

/** The hits ordered by the sources' order, a hit of the same source keeping its place. */
function inOrder(hits: LiteratureHit[], order: LiteratureSource[]): LiteratureHit[] {
    const place = (hit: LiteratureHit): number => {
        const at = order.indexOf(hit.source);
        return at < 0 ? order.length : at;
    };
    return [...hits].sort((left, right) => place(left) - place(right));
}

/** The first value `pick` finds on the hits, in order. */
function firstOf<T>(
    hits: LiteratureHit[],
    pick: (hit: LiteratureHit) => T | undefined
): T | undefined {
    for (const hit of hits) {
        const value = pick(hit);
        if (value !== undefined) return value;
    }
    return undefined;
}

/** A text that says something. */
function filled(text: string | undefined): string | undefined {
    return text === undefined || text.trim() === '' ? undefined : text;
}

/** The hits of one group as one paper. */
function mergeGroup(group: LiteratureHit[]): MergedHit {
    const published = group.filter((hit) => hit.type !== 'preprint');
    const describing = inOrder(published.length > 0 ? published : group, FIELD_ORDER);
    const all = inOrder(group, FIELD_ORDER);
    const authors = describing.reduce<string[]>(
        (longest, hit) => (hit.authors.length > longest.length ? hit.authors : longest),
        []
    );
    const doi = firstOf(describing, (hit) => hit.doi) ?? firstOf(all, (hit) => hit.doi);
    const pmid = firstOf(all, (hit) => hit.pmid);
    const arxiv = firstOf(all, (hit) => hit.arxiv) ?? firstOf(all, (hit) => arxivOfDoi(hit.doi));
    const best = new Map<LiteratureSource, number>();
    const citesBy: Partial<Record<LiteratureSource, number>> = {};
    for (const hit of group) {
        best.set(hit.source, Math.min(best.get(hit.source) ?? Infinity, hit.rank));
        if (hit.cites !== undefined) {
            citesBy[hit.source] = Math.max(citesBy[hit.source] ?? 0, hit.cites);
        }
    }
    const counts = Object.values(citesBy);
    const pdf = firstOf(
        inOrder(group, PDF_ORDER).filter((hit) => PDF_ORDER.includes(hit.source)),
        (hit) => hit.pdf
    );
    const sources = LITERATURE_SOURCES.filter((source) => best.has(source));
    const merged: MergedHit = {
        key:
            doi !== undefined
                ? `doi:${doi}`
                : pmid !== undefined
                  ? `pmid:${pmid}`
                  : arxiv !== undefined
                    ? `arxiv:${arxiv}`
                    : `own:${group[0].source}:${group[0].id}`,
        title: firstOf(describing, (hit) => filled(hit.title)) ?? '',
        authors,
        type:
            firstOf(describing, (hit) => (hit.type === 'other' ? undefined : hit.type)) ??
            describing[0].type,
        citesBy,
        oa: group.some((hit) => hit.oa === true || hit.pdf !== undefined),
        sources,
        relevance: [...best.values()].reduce((sum, rank) => sum + 1 / (FUSION + rank), 0)
    };
    const venue = firstOf(describing, (hit) => filled(hit.venue));
    const year = firstOf(describing, (hit) => hit.year);
    const date = firstOf(describing, (hit) => hit.date);
    const abstract = firstOf(inOrder(group, ABSTRACT_ORDER), (hit) => filled(hit.abstract));
    const url =
        doi !== undefined
            ? `https://doi.org/${doi}`
            : arxiv !== undefined
              ? `https://arxiv.org/abs/${arxiv}`
              : pmid !== undefined
                ? `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`
                : firstOf(all, (hit) => hit.url);
    const s2 = group.find((hit) => hit.source === 'semantic_scholar')?.id;
    if (venue !== undefined) merged.venue = venue;
    if (year !== undefined) merged.year = year;
    if (date !== undefined) merged.date = date;
    if (abstract !== undefined) merged.abstract = abstract;
    if (counts.length > 0) merged.cites = Math.max(...counts);
    if (pdf !== undefined) merged.pdf = pdf;
    if (url !== undefined) merged.url = url;
    if (doi !== undefined) merged.doi = doi;
    if (pmid !== undefined) merged.pmid = pmid;
    if (arxiv !== undefined) merged.arxiv = arxiv;
    if (s2 !== undefined) merged.s2 = s2;
    return merged;
}

/** The date a paper is ordered by: its date, else its year. */
function dateOf(hit: MergedHit): string | undefined {
    return hit.date ?? (hit.year === undefined ? undefined : String(hit.year));
}

/** The hits of every source as one list of papers, the most relevant first. */
export function mergeHits(hits: LiteratureHit[]): MergedHit[] {
    return groupsOf(hits.map(tidy))
        .map(mergeGroup)
        .sort((left, right) => right.relevance - left.relevance);
}

/** The filters of the form, read once for a list. */
export type Filters = {
    years: { from: number; to: number } | null;
    type: DocType;
    oa: boolean;
    venue: string[];
    author: string[];
    minCites: number;
};

/** The words of a filter text, a double quote read as a space. */
function wordsOf(text: string): string[] {
    return text.replace(/"/g, ' ').toLowerCase().split(/\s+/).filter(Boolean);
}

/** The filters a form names. A year that is not a whole number is no bound. */
export function filtersOf(form: LiteratureForm, now: number): Filters {
    const from = wholeNumber(form.from.trim());
    const to = wholeNumber(form.to.trim());
    return {
        years:
            from === null && to === null ? null : { from: from ?? 1000, to: to ?? latestYear(now) },
        type: form.type,
        oa: form.oa,
        venue: wordsOf(form.venue),
        author: wordsOf(form.author),
        minCites: wholeNumber(form.minCites.trim()) ?? 0
    };
}

/** Whether a paper is inside every filter. A paper without the field a filter is set on is not. */
export function passes(hit: MergedHit, filters: Filters): boolean {
    const { years } = filters;
    if (
        years !== null &&
        (hit.year === undefined || hit.year < years.from || hit.year > years.to)
    ) {
        return false;
    }
    if (filters.type !== 'any' && hit.type !== filters.type) return false;
    if (filters.oa && !hit.oa) return false;
    const venue = (hit.venue ?? '').toLowerCase();
    if (!filters.venue.every((word) => venue.includes(word))) return false;
    const authors = hit.authors.join(' ').toLowerCase();
    if (!filters.author.every((word) => authors.includes(word))) return false;
    return filters.minCites === 0 || (hit.cites !== undefined && hit.cites >= filters.minCites);
}

/**
 * The papers in the order asked for. Relevance is the order they come in; date and citations put
 * a paper without the field last, and a tie keeps the relevance order.
 */
export function sortHits(hits: MergedHit[], sort: LiteratureSort): MergedHit[] {
    const byRelevance = [...hits].sort((left, right) => right.relevance - left.relevance);
    if (sort === 'relevance') return byRelevance;
    if (sort === 'date') {
        return byRelevance.sort((left, right) => {
            const [one, other] = [dateOf(left), dateOf(right)];
            if (one === undefined || other === undefined) {
                return Number(one === undefined) - Number(other === undefined);
            }
            return one === other ? 0 : one < other ? 1 : -1;
        });
    }
    return byRelevance.sort((left, right) => {
        if (left.cites === undefined || right.cites === undefined) {
            return Number(left.cites === undefined) - Number(right.cites === undefined);
        }
        return right.cites - left.cites;
    });
}
