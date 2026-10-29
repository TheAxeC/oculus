// Layer 2, client state. The Google Scholar link of a search. Scholar has no API and its terms
// forbid scraping, so the page never asks it for anything: it offers the address that opens the
// same query on its site, built from the `scholar` row of the primary hub's `links`, its `{id}`
// the query and its `{from}` and `{to}` the years. Only the query, the author and the years are
// carried, and with no `scholar` row there is no link.

import type { LinkRow } from '../../../data/sources/config/settings/rows/grammar.ts';
import { linkWithOptional } from '../../../data/sources/config/settings/rows/links.ts';
import { wholeNumber } from '../../../data/prose/literature.ts';
import type { LiteratureForm } from './form.ts';

/** The address of Scholar's search for the form's query, author and years, or undefined. */
export function scholarUrl(form: LiteratureForm, links: readonly LinkRow[]): string | undefined {
    const author = form.author.trim().replace(/"/g, ' ').replace(/\s+/g, ' ').trim();
    const query = author === '' ? form.q.trim() : `${form.q.trim()} author:"${author}"`;
    const from = wholeNumber(form.from.trim());
    const to = wholeNumber(form.to.trim());
    return linkWithOptional(links, 'scholar', query, {
        from: from === null ? undefined : String(from),
        to: to === null ? undefined : String(to)
    });
}
