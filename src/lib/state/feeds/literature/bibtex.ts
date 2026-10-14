// Layer 2, client state. The BibTeX entry Copy BibTeX puts on the clipboard, and where it came
// from. The entry is asked of the sources in this order, each source's entry copied as it serves it
// (its key and its non-ASCII text included): `doi.org` for a paper with a DOI, Semantic Scholar's
// own entry for a paper it found, `doi.org` for an arXiv paper's DataCite DOI. A paper none of them
// serves is formatted by citation-js from CSL-JSON built from the hit, which does the escaping,
// the name formatting and the entry type; no BibTeX text is written here.
//
// The key of a formatted entry of the search is citation-js's own: the plugin's `useIdAsLabel`
// option is off, so the key is made from the first author, the year and the first word of the
// title, where the option on would use the identifier of the hit, which is an OpenAlex or Semantic
// Scholar id. An entry of the Literature collection is copied under its own key whichever way it
// was made: the served entry has its key replaced, and the formatted one is made with the option
// on and the entry's key as the item's id. citation-js is loaded when the first entry is
// formatted, so the page does not carry it until a paper needs it.

import type { HitType } from '../../../data/model/index.ts';
import { bibtexAnswer, bibtexUrl } from './answers.ts';
import type { MergedHit } from './merge.ts';

/** Where an entry came from. */
export type EntrySource = 'doi' | 'semantic_scholar' | 'arxiv' | 'citation_js';

/** One entry and where it came from. */
export type Entry = { text: string; from: EntrySource };

/** How the page asks the route for one address: the body it answered with, undefined for none. */
export type AskRoute = (url: string) => Promise<unknown>;

/** The CSL type of each type a hit has. */
const CSL_TYPE: Record<HitType, string> = {
    article: 'article-journal',
    review: 'article-journal',
    preprint: 'article',
    conference: 'paper-conference',
    book: 'book',
    chapter: 'chapter',
    other: 'article'
};

/** The `date-parts` of a `YYYY`, `YYYY-MM` or `YYYY-MM-DD` date, or of the year alone. */
function issuedOf(hit: MergedHit): { 'date-parts': number[][] } | undefined {
    const parts = /^(\d{4})(?:-(\d{2}))?(?:-(\d{2}))?$/.exec(hit.date ?? '');
    if (parts !== null) {
        return { 'date-parts': [parts.slice(1).filter(Boolean).map(Number)] };
    }
    return hit.year === undefined ? undefined : { 'date-parts': [[hit.year]] };
}

/** The CSL-JSON item of a hit: the fields it has, a name as the source gave it whole. */
function cslOf(hit: MergedHit): Record<string, unknown> {
    const item: Record<string, unknown> = {
        id: hit.key,
        type: CSL_TYPE[hit.type],
        title: hit.title,
        author: hit.authors.map((literal) => ({ literal }))
    };
    const issued = issuedOf(hit);
    if (hit.venue !== undefined) item['container-title'] = hit.venue;
    if (issued !== undefined) item.issued = issued;
    if (hit.doi !== undefined) item.DOI = hit.doi;
    if (hit.url !== undefined) item.URL = hit.url;
    if (hit.pmid !== undefined) item.PMID = hit.pmid;
    return item;
}

/** The entry citation-js formats from one CSL item, its key the item's id when `byId`. */
async function formatted(item: Record<string, unknown>, byId: boolean): Promise<string> {
    const [{ Cite, plugins }] = await Promise.all([
        import('@citation-js/core'),
        import('@citation-js/plugin-bibtex')
    ]);
    plugins.config.get('@bibtex').format.useIdAsLabel = byId;
    return new Cite([item]).format('bibtex', { format: 'text' }).trim();
}

/** The entry for a paper: the first source that serves one, else the one citation-js formats. */
export async function entryFor(hit: MergedHit, ask: AskRoute): Promise<Entry> {
    const asks: string[] = [];
    if (hit.doi !== undefined) asks.push(bibtexUrl('doi', hit.doi));
    if (hit.s2 !== undefined) asks.push(bibtexUrl('s2', hit.s2));
    if (hit.arxiv !== undefined) asks.push(bibtexUrl('arxiv', hit.arxiv));
    for (const url of asks) {
        const served = bibtexAnswer(await ask(url));
        if (served !== null) return { text: served.bibtex, from: served.from };
    }
    return { text: await formatted(cslOf(hit), false), from: 'citation_js' };
}

/** The fields of a Literature entry a BibTeX entry is made from. */
export type SavedPaper = {
    key: string;
    title: string;
    authors: string[];
    venue: string;
    year: string;
    doi: string;
    url: string;
};

/** The opening of a BibTeX entry up to its key: `@type{`, and the key after it. */
const OPENING = /^(\s*@[A-Za-z]+\s*\{\s*)[^,\s]*/;

/** A BibTeX entry with its key replaced by `key`. */
function rekeyed(text: string, key: string): string {
    return text.replace(OPENING, (_whole, opening: string) => `${opening}${key}`);
}

/** The CSL-JSON item of a saved paper, its id the entry's key. */
function savedCsl(paper: SavedPaper): Record<string, unknown> {
    const item: Record<string, unknown> = {
        id: paper.key,
        type: 'article-journal',
        title: paper.title,
        author: paper.authors.map((literal) => ({ literal }))
    };
    const year = /^\d{1,4}$/.test(paper.year) ? Number(paper.year) : undefined;
    if (paper.venue !== '') item['container-title'] = paper.venue;
    if (year !== undefined) item.issued = { 'date-parts': [[year]] };
    if (paper.doi !== '') item.DOI = paper.doi;
    if (paper.url !== '') item.URL = paper.url;
    return item;
}

/**
 * The entry for a saved paper, under the paper's own key: the one `doi.org` serves for its DOI,
 * else the one citation-js formats from its fields.
 */
async function savedEntryFor(paper: SavedPaper, ask: AskRoute): Promise<Entry> {
    if (paper.doi !== '') {
        const served = bibtexAnswer(await ask(bibtexUrl('doi', paper.doi)));
        if (served !== null) return { text: rekeyed(served.bibtex, paper.key), from: served.from };
    }
    return { text: await formatted(savedCsl(paper), true), from: 'citation_js' };
}

/** What a copy of several entries came to: the text, and the keys copied and not copied. */
export type Copied = { text: string; copied: string[]; failed: string[] };

/**
 * The BibTeX entries of several saved papers, in the order given, one blank line between two. A
 * paper whose entry could not be made is left out and named in `failed`.
 */
export async function savedEntriesFor(papers: SavedPaper[], ask: AskRoute): Promise<Copied> {
    const made = await Promise.all(
        papers.map(async (paper) => {
            try {
                return (await savedEntryFor(paper, ask)).text;
            } catch {
                return null;
            }
        })
    );
    const copied = papers.filter((_paper, at) => made[at] !== null).map((one) => one.key);
    const failed = papers.filter((_paper, at) => made[at] === null).map((one) => one.key);
    const text = made.filter((one) => one !== null).join('\n\n');
    return { text, copied, failed };
}
