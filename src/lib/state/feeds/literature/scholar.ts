// Layer 2, client state. The Google Scholar link of a search. Scholar has no API and its terms
// forbid scraping, so the page never asks it for anything: it offers the address that opens the
// same query on its site. Only the query, the author and the years have a Scholar parameter, and
// the other filters are not carried.

import { wholeNumber } from '../../../data/prose/literature.ts';
import type { LiteratureForm } from './form.ts';

/** The address of Scholar's search for the form's query, author and years. */
export function scholarUrl(form: LiteratureForm): string {
    const author = form.author.trim().replace(/"/g, ' ').replace(/\s+/g, ' ').trim();
    const query = author === '' ? form.q.trim() : `${form.q.trim()} author:"${author}"`;
    let url = `https://scholar.google.com/scholar?q=${encodeURIComponent(query)}`;
    const from = wholeNumber(form.from.trim());
    const to = wholeNumber(form.to.trim());
    if (from !== null) url += `&as_ylo=${String(from)}`;
    if (to !== null) url += `&as_yhi=${String(to)}`;
    return url;
}
