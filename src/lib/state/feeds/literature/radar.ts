// Layer 2, client state. How a paper of the Literature search meets Lit Watch: whether the radar
// holds it already, and the fields an Add to Lit Watch sends. The refusal of a paper the file holds
// is the server's (server/edit/feeds/feeds.ts, `addRadarEntry`); this asks the same question of the
// feed the page already has, with the same two rules (data/prose/literature.ts), so the card can
// say `In Lit Watch` without a request.

import { addressKey, sameTitle } from '../../../data/prose/literature.ts';
import { textOrNumber } from '../../../data/shapes/shapes.ts';
import type { MergedHit } from './merge.ts';

/** The authors as the radar file holds them: one line, the names joined by a comma. */
function authorsLine(hit: MergedHit): string {
    return hit.authors.join(', ');
}

/** Whether a feed entry of the radar is this paper, by its title or its address. */
function isEntryOf(hit: MergedHit, entry: Record<string, unknown>): boolean {
    if (hit.title !== '' && sameTitle(textOrNumber(entry.title), hit.title)) return true;
    return hit.url !== undefined && addressKey(textOrNumber(entry.url)) === addressKey(hit.url);
}

/** Whether the radar holds the paper already. */
export function inRadar(hit: MergedHit, entries: Record<string, unknown>[]): boolean {
    return entries.some((entry) => isEntryOf(hit, entry));
}

/** What the Add form asks the reader for. */
export type RadarChoice = {
    bucket: string;
    project: string;
    relevance: string;
    why: string;
};

/** The write's fields for a paper and the reader's choices; the server orders and cleans them. */
export function radarFields(hit: MergedHit, choice: RadarChoice): Record<string, unknown> {
    return {
        title: hit.title,
        authors: authorsLine(hit),
        venue: hit.venue ?? '',
        year: hit.year ?? '',
        url: hit.url ?? '',
        bucket: choice.bucket,
        project: choice.project,
        relevance: choice.relevance,
        why: choice.why
    };
}
