// Layer 2, client state. What GET /api/literature answers, read through zod before anything draws
// it: the list of sources, one source's answer to one search, a refusal, and one BibTeX entry.
//
// A hit that does not read is dropped by itself, so one damaged hit never takes its source's page
// with it; an answer that does not read at all is that source's `failed`.

import { z } from 'zod';
import {
    DOC_TYPES,
    LITERATURE_REFUSALS,
    LITERATURE_SOURCES,
    SOURCE_STATES,
    type LiteratureHit,
    type LiteratureRefusal,
    type SourceInfo
} from '../../../data/model/index.ts';
import { readAs, readJson } from '../../../data/shapes/shapes.ts';

/** The route, which every request here is made to. */
const LITERATURE_ROUTE = '/api/literature';

const sourceShape = z.enum(LITERATURE_SOURCES);

const hitShape = z.object({
    source: sourceShape,
    id: z.string(),
    doi: z.string().optional(),
    pmid: z.string().optional(),
    arxiv: z.string().optional(),
    title: z.string(),
    authors: z.array(z.string()),
    venue: z.string().optional(),
    year: z.number().optional(),
    date: z.string().optional(),
    type: z.enum([...DOC_TYPES.filter((type) => type !== 'any'), 'other']),
    abstract: z.string().optional(),
    cites: z.number().optional(),
    oa: z.boolean().optional(),
    pdf: z.string().optional(),
    url: z.string().optional(),
    rank: z.number(),
    bibtex: z.string().optional()
}) satisfies z.ZodType<LiteratureHit>;

const okShape = z.object({
    state: z.literal('ok'),
    source: sourceShape,
    total: z.number().nullable(),
    more: z.boolean(),
    cursor: z.string().nullable(),
    cached: z.boolean(),
    hits: z.array(z.unknown())
});

const stoppedShape = z.object({
    state: z.enum(SOURCE_STATES.filter((state) => state !== 'ok')),
    source: sourceShape,
    status: z.number().optional(),
    wait_s: z.number().optional()
});

/** One source's answer to one search, as the page uses it. */
export type Answer =
    | {
          state: 'ok';
          total: number | null;
          more: boolean;
          cursor: string | null;
          cached: boolean;
          hits: LiteratureHit[];
      }
    | { state: Exclude<(typeof SOURCE_STATES)[number], 'ok'>; status?: number; wait?: number };

/** The answer a body holds, or null when it is neither shape of the route's answers. */
export function answerOf(body: unknown): Answer | null {
    const ok = readAs(okShape, body);
    if (ok !== null) {
        const hits = ok.hits.flatMap((raw) => {
            const hit = readAs(hitShape, raw);
            return hit === null ? [] : [hit];
        });
        return {
            state: 'ok',
            total: ok.total,
            more: ok.more,
            cursor: ok.cursor,
            cached: ok.cached,
            hits
        };
    }
    const stopped = readAs(stoppedShape, body);
    if (stopped === null) return null;
    return {
        state: stopped.state,
        ...(stopped.status === undefined ? {} : { status: stopped.status }),
        ...(stopped.wait_s === undefined ? {} : { wait: stopped.wait_s })
    };
}

const refusalShape = z.object({ error: z.enum(LITERATURE_REFUSALS) });

/** The word a refusal body names, or null for a body that is not one of the route's refusals. */
export function refusalOf(body: unknown): LiteratureRefusal | null {
    return readAs(refusalShape, body)?.error ?? null;
}

const listShape = z.object({
    sources: z.array(
        z.object({
            id: sourceShape,
            keyed: z.boolean(),
            available: z.boolean(),
            key: z.string().nullable()
        })
    )
});

/** The sources a `?sources` body lists, or null when it is not a list. */
export function sourceList(body: unknown): SourceInfo[] | null {
    return readAs(listShape, body)?.sources ?? null;
}

const bibtexShape = z.object({
    bibtex: z.string().nullable(),
    from: z.enum(['doi', 'semantic_scholar', 'arxiv']).optional()
});

/** The entry a `?bibtex` body holds and where it came from, or null for none. */
export function bibtexAnswer(
    body: unknown
): { bibtex: string; from: 'doi' | 'semantic_scholar' | 'arxiv' } | null {
    const held = readAs(bibtexShape, body);
    const bibtex = held?.bibtex;
    const from = held?.from;
    if (typeof bibtex !== 'string' || from === undefined) return null;
    return { bibtex, from };
}

/** The address of one source's search. */
export function searchUrl(params: URLSearchParams): string {
    return `${LITERATURE_ROUTE}?${params.toString()}`;
}

/** The address of the list of sources. */
export const SOURCES_URL = `${LITERATURE_ROUTE}?sources`;

/** The address of one BibTeX entry, asked by the identifier the source takes. */
export function bibtexUrl(by: 'doi' | 's2' | 'arxiv', id: string): string {
    return `${LITERATURE_ROUTE}?${new URLSearchParams({ bibtex: '', [by]: id }).toString()}`;
}

/** The JSON body a tokened GET answers, undefined when the request or the body fails. */
export async function routeBody(
    url: string,
    token: string,
    signal?: AbortSignal
): Promise<unknown> {
    try {
        const response = await fetch(url, {
            headers: { 'x-oculus-token': token },
            ...(signal === undefined ? {} : { signal })
        });
        return await readJson(response);
    } catch {
        return undefined;
    }
}
