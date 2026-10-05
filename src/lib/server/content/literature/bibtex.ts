// Layer 2, server. One BibTeX entry as a source serves it, for the Copy BibTeX control: `doi.org`
// with the BibTeX media type (Crossref and DataCite answer it), Semantic Scholar's own
// `citationStyles.bibtex` for a paper it holds, and `doi.org` for an arXiv paper's DataCite DOI.
//
// The entry is returned as served, with the source's key and any non-ASCII text, and is never
// written to a file. A source that has none, answers a refusal or serves something that is not
// BibTeX gives `null`, and the page goes on to the next source in its order.

import { z } from 'zod';
import type { Fetcher } from '../../accounts/connect/oauth.ts';
import { callFor, SourceStop } from './ask.ts';
import type { LiteratureDesk } from './desk.ts';
import type { BibtexQuery } from './request.ts';
import { addressOf, pathOf, readJson, type Keys } from './sources/common.ts';

/** The longest entry taken. */
const ENTRY_MAX = 100_000;

/** The least milliseconds between two requests of the source that serves an entry. */
const GAP_MS = 1000;

const style = z.object({
    citationStyles: z.object({ bibtex: z.string().nullish() }).nullish()
});

/** Where an entry is asked and which of the page's sources it belongs to. */
type Target = {
    url: string;
    headers: Record<string, string>;
    lane: 'crossref' | 'semantic_scholar';
    from: 'doi' | 'semantic_scholar' | 'arxiv';
};

/** The address and headers a BibTeX query is asked at. */
function targetOf(query: BibtexQuery, keys: Keys): Target {
    const bibtex = { accept: 'application/x-bibtex' };
    if (query.by === 'doi') {
        return {
            url: `https://doi.org/${pathOf(query.doi)}`,
            headers: bibtex,
            lane: 'crossref',
            from: 'doi'
        };
    }
    if (query.by === 'arxiv') {
        return {
            url: `https://doi.org/10.48550/arXiv.${pathOf(query.id)}`,
            headers: bibtex,
            lane: 'crossref',
            from: 'arxiv'
        };
    }
    return {
        url: addressOf(`https://api.semanticscholar.org/graph/v1/paper/${query.id}`, [
            ['fields', 'citationStyles']
        ]),
        headers:
            keys.semanticScholarKey === undefined ? {} : { 'x-api-key': keys.semanticScholarKey },
        lane: 'semantic_scholar',
        from: 'semantic_scholar'
    };
}

/** What a BibTeX request is given to run with. */
export type BibtexContext = {
    fetcher: Fetcher;
    desk: LiteratureDesk;
    keys: Keys;
    timeoutMs: number;
    signal: AbortSignal;
};

/** The entry for a query and where it came from, or `bibtex: null` when the source has none. */
export async function bibtexFor(
    query: BibtexQuery,
    context: BibtexContext
): Promise<{ bibtex: string | null; from?: string }> {
    const { url, headers, lane, from } = targetOf(query, context.keys);
    const call = callFor(lane, context.fetcher, context.timeoutMs, context.signal, [
        context.keys.semanticScholarKey ?? ''
    ]);
    try {
        const reply = await context.desk.run(lane, GAP_MS, context.signal, () =>
            call(url, headers)
        );
        const text =
            query.by === 's2'
                ? (readJson('semantic_scholar', reply.status, reply.text, style).citationStyles
                      ?.bibtex ?? '')
                : reply.text;
        const entry = text.trim();
        if (!entry.startsWith('@') || entry.length > ENTRY_MAX) return { bibtex: null };
        return { bibtex: entry, from };
    } catch (error) {
        if (error instanceof SourceStop) return { bibtex: null };
        throw error;
    }
}
