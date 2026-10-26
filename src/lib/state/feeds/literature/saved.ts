// Layer 2, client state. How a paper meets the Literature collection: whether a collection holds
// it already, the fields Save to Literature sends for a hit of the search and for a Lit Watch
// entry, the venue record a saved paper names, and a saved paper's fields as its BibTeX entry is
// made from them. The hubs Save to Literature offers are those that could take a new entry of the
// collection (`hubsTaking` of state/shared/page/hubs.ts). The refusal of a paper the file holds is
// the server's (server/edit/feeds/literature.ts); this asks the same question of the entries the
// page already has, by the same rule (`samePaper` of data/prose/literature.ts), so a card can say
// `In Literature` without a request.

import { samePaper } from '../../../data/prose/literature.ts';
import { textOrNumber } from '../../../data/shapes/shapes.ts';
import type { SavedPaper } from './bibtex.ts';
import type { MergedHit } from './merge.ts';

/** What a paper is compared by: its DOI when it has one, and its title. */
export type PaperIds = { doi?: string; title: string };

/** Whether the collection's entries hold the paper already. */
export function inLiterature(paper: PaperIds, entries: Record<string, unknown>[]): boolean {
    return entries.some((entry) =>
        samePaper({ doi: textOrNumber(entry.doi), title: textOrNumber(entry.title) }, paper)
    );
}

/** The fields Save to Literature sends for a hit of the search; the server cleans and keys them. */
export function hitPaper(hit: MergedHit): Record<string, unknown> {
    return {
        title: hit.title,
        authors: hit.authors,
        ...(hit.venue === undefined ? {} : { venue: hit.venue }),
        ...(hit.year === undefined ? {} : { year: hit.year }),
        ...(hit.doi === undefined ? {} : { doi: hit.doi }),
        ...(hit.url === undefined ? {} : { url: hit.url }),
        ...(hit.abstract === undefined ? {} : { abstract: hit.abstract })
    };
}

/**
 * The fields Save to Literature sends for a Lit Watch entry: its title, venue, year and address,
 * and its authors as the names of its one line, which Lit Watch writes joined by commas.
 */
export function radarPaper(entry: Record<string, unknown>): Record<string, unknown> {
    const authors = textOrNumber(entry.authors)
        .split(',')
        .map((one) => one.trim())
        .filter((one) => one !== '');
    return {
        title: textOrNumber(entry.title),
        authors,
        venue: textOrNumber(entry.venue),
        year: textOrNumber(entry.year),
        url: textOrNumber(entry.url)
    };
}

/** The venue record a saved paper's venue names: the one of that name, ignoring case. */
export function venueNamed<V extends { name: string }>(name: string, venues: V[]): V | undefined {
    const wanted = name.trim().toLowerCase();
    return wanted === ''
        ? undefined
        : venues.find((one) => one.name.trim().toLowerCase() === wanted);
}

/** A saved paper's fields as its BibTeX entry is made from them, as text, its key the file's. */
export function savedPaperOf(fields: Record<string, unknown>): SavedPaper {
    const authors = Array.isArray(fields.authors)
        ? fields.authors.map((one) => textOrNumber(one)).filter((one) => one !== '')
        : [];
    return {
        key: textOrNumber(fields.key),
        title: textOrNumber(fields.title),
        authors,
        venue: textOrNumber(fields.venue),
        year: textOrNumber(fields.year),
        doi: textOrNumber(fields.doi),
        url: textOrNumber(fields.url)
    };
}
