// Layer 2, client state. What a Literature search tab keeps of what the reader typed: the query,
// the filters, the sort and the source toggles. It is the tab's instance state, saved with the
// layout, and a value of the wrong type is read as the default of its field, so a layout saved
// without it or with a damaged copy draws an empty form and refuses nothing.
//
// The year and citation fields are kept as typed, so a half-typed year is not rewritten under the
// reader's hands; the request is made from them only when the search runs, and a value the route
// would refuse is said in the view first (data/prose/literature.ts holds the bounds both share).
// Which sources are on is kept only where the reader pressed a toggle: a source never pressed is
// on when the server lists it as one it can ask (a row of `literature.sources` whose required
// `downloads` row the machine holds). The sources are the rows the server lists, in their order,
// so a toggle of a row the hub does not name is kept and draws nothing.

import { z } from 'zod';
import {
    DOC_TYPES,
    type DocType,
    type HitType,
    type LiteratureRefusal,
    type LiteratureSource,
    type SourceInfo
} from '../../../data/model/index.ts';
import { boundsRefusal } from '../../../data/prose/literature.ts';
import { readAs } from '../../../data/shapes/shapes.ts';

// The vocabulary the view draws its lists from, handed on from the data layer which a view does
// not import.
export { DOC_TYPES };
export type { DocType, HitType, LiteratureRefusal, LiteratureSource, SourceInfo };

/** The orders the merged list can be put in. */
export const SORTS = ['relevance', 'date', 'citations'] as const;

/** One order of the list. */
export type LiteratureSort = (typeof SORTS)[number];

/** What a tab keeps. */
export type LiteratureForm = {
    q: string;
    /** The year texts, empty for none. */
    from: string;
    to: string;
    type: DocType;
    oa: boolean;
    venue: string;
    author: string;
    /** The citation minimum text, empty for none. */
    minCites: string;
    sort: LiteratureSort;
    /** The toggles the reader pressed, by source; a source not named here is on by its default. */
    toggled: Record<LiteratureSource, boolean>;
};

const formShape = z.object({
    q: z.string().catch(''),
    from: z.string().catch(''),
    to: z.string().catch(''),
    type: z.enum(DOC_TYPES).catch('any'),
    oa: z.boolean().catch(false),
    venue: z.string().catch(''),
    author: z.string().catch(''),
    minCites: z.string().catch(''),
    sort: z.enum(SORTS).catch('relevance'),
    toggled: z.record(z.string(), z.boolean()).catch({})
});

/** The tab's saved state as a form; any field of the wrong type takes its default. */
export function parseForm(raw: unknown): LiteratureForm {
    const held = readAs(formShape, raw);
    if (held !== null) return held;
    return formShape.parse({});
}

/** Whether a listed source is on: the reader's toggle, else on when the machine can ask it. */
export function sourceOn(form: LiteratureForm, source: SourceInfo): boolean {
    return source.available && (form.toggled[source.id] ?? true);
}

/** The sources a search is sent to, in the order the server lists them. */
export function sourcesOn(
    form: LiteratureForm,
    sources: readonly SourceInfo[]
): LiteratureSource[] {
    return sources.filter((source) => sourceOn(form, source)).map((source) => source.id);
}

/** The first bound the form breaks, as the route would refuse it, or null for none. */
export function formRefusal(form: LiteratureForm, now: number): ReturnType<typeof boundsRefusal> {
    return boundsRefusal(
        {
            q: form.q,
            from: form.from.trim() === '' ? null : form.from.trim(),
            to: form.to.trim() === '' ? null : form.to.trim(),
            minCites: form.minCites.trim() === '' ? null : form.minCites.trim(),
            venue: form.venue,
            author: form.author
        },
        now
    );
}

/** The parameters of a search of one source, the page's own filters as the route reads them. */
export function searchParams(form: LiteratureForm, source: LiteratureSource): URLSearchParams {
    const params = new URLSearchParams({ source, q: form.q.trim() });
    const fields: [string, string][] = [
        ['from', form.from.trim()],
        ['to', form.to.trim()],
        ['venue', form.venue.trim()],
        ['author', form.author.trim()],
        ['min_cites', form.minCites.trim()]
    ];
    for (const [name, value] of fields) if (value !== '') params.set(name, value);
    if (form.type !== 'any') params.set('type', form.type);
    if (form.oa) params.set('oa', '1');
    return params;
}

const timeoutShape = z.object({
    literature: z.object({ timeout_s: z.number().positive() })
});

/**
 * The seconds one source is given, `literature.timeout_s` of the merged config as the page last
 * received it, and null until the configuration has spoken or when it names no positive number.
 */
export function timeoutSeconds(config: Record<string, unknown>): number | null {
    return readAs(timeoutShape, config)?.literature.timeout_s ?? null;
}
