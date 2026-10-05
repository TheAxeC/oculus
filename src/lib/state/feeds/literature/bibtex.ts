// Layer 2, client state. The BibTeX entry Copy BibTeX puts on the clipboard, and where it came
// from. The entry is asked of the sources in this order, each source's entry copied as it serves it
// (its key and its non-ASCII text included): `doi.org` for a paper with a DOI, Semantic Scholar's
// own entry for a paper it found, `doi.org` for an arXiv paper's DataCite DOI. A paper none of them
// serves is formatted by citation-js from CSL-JSON built from the hit, which does the escaping,
// the name formatting and the entry type; no BibTeX text is written here.
//
// The key of a formatted entry is citation-js's own: the plugin's `useIdAsLabel` option is off, so
// the key is made from the first author, the year and the first word of the title, where the
// option on would use the identifier of the hit, which is an OpenAlex or Semantic Scholar id.
// citation-js is loaded when the first entry is formatted, so the page does not carry it until a
// paper needs it.

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

/** The entry citation-js formats from a hit. */
async function formatted(hit: MergedHit): Promise<string> {
    const [{ Cite, plugins }] = await Promise.all([
        import('@citation-js/core'),
        import('@citation-js/plugin-bibtex')
    ]);
    plugins.config.get('@bibtex').format.useIdAsLabel = false;
    return new Cite([cslOf(hit)]).format('bibtex', { format: 'text' }).trim();
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
    return { text: await formatted(hit), from: 'citation_js' };
}
