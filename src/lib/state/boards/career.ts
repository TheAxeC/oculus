// Layer 2, client state. The career panel's arithmetic: the host statuses and their tones, the
// score dimensions a host row draws a chip for, which tier a score value falls in, how many hosts
// are in flight, and the short milestone the collapsed summary carries.
//
// Pure over the merged config and the career entity. No words live here: a status carries its own
// label and glyph name out of config/catalogs/vocab.yml, and every other panel string comes from
// the catalog.

import type { Career, Host } from '../../data/model/index.ts';
import { z } from 'zod';
import { scalar } from '../../data/helpers/guards.ts';
import { mapShape, readAs, rowsShape, wordShape } from '../../data/shapes/shapes.ts';

// The boundary table lets `views/` import `state/` and nothing of `data/`, so the two model types
// the career panel names reach it from here.
export type { Career, Host } from '../../data/model/index.ts';
import { UNKNOWN_TONE, toneOf } from '../shared/words/tones.ts';

/** The statuses that count as outreach in progress: sent and waiting, or already in dialogue. */
export const IN_FLIGHT = ['awaiting', 'warm'];

/** One status of `career_host_status`: the value a host carries, its words and its hue. */
export type HostStatus = {
    key: string;
    label: string;
    glyph: string;
    tone: string;
};

/** One scored axis of `career_score_dims`: the host key it reads, its chip letter and its words. */
export type ScoreDim = {
    field: string;
    badge: string;
    label: string;
};

/** The label, icon and colour of one `career_host_status` row, each the empty text if absent. */
const hostStatusShape = z.object({ label: wordShape, icon: wordShape, color: wordShape });

/**
 * The host statuses of `career_host_status`, in the config's order, each icon kept as a glyph name
 * and each hue already resolved to a tone.
 */
export function hostStatuses(config: Record<string, unknown>): HostStatus[] {
    const rows = readAs(mapShape, config.career_host_status);
    if (rows === null) return [];
    return Object.entries(rows).flatMap(([key, row]) => {
        const held = readAs(hostStatusShape, row);
        if (held === null) return [];
        return [
            {
                key,
                label: held.label === '' ? key : held.label,
                glyph: held.icon,
                tone: held.color === '' ? UNKNOWN_TONE : toneOf(held.color)
            }
        ];
    });
}

/** One row of `career_score_dims`: a map with a field; the badge is the field's first letter. */
const scoreDimShape = z
    .object({
        field: wordShape.refine((field) => field !== ''),
        badge: wordShape,
        label: wordShape
    })
    .transform((row): ScoreDim => ({
        field: row.field,
        badge: row.badge === '' ? row.field.slice(0, 1).toUpperCase() : row.badge,
        label: row.label === '' ? row.field : row.label
    }));

const scoreDimsShape = rowsShape(scoreDimShape);

/** The scored axes of `career_score_dims`, in the config's order. */
export function scoreDims(config: Record<string, unknown>): ScoreDim[] {
    return readAs(scoreDimsShape, config.career_score_dims) ?? [];
}

/**
 * Which tier a score value falls in. The values are the file's own words ("Strong", "Med-high",
 * "Weak clinic"), so the rule reads them rather than enumerating every string the file may write.
 */
export function scoreTier(value: unknown): string {
    const text = scalar(value).trim().toLowerCase();
    if (['strong', 'high'].includes(text)) return 'strong';
    if (['good', 'med-high', 'high clout'].includes(text)) return 'good';
    if (text.startsWith('weak')) return 'weak';
    return 'mid';
}

/** How many hosts are out for an answer or in dialogue, which is the summary's count. */
export function inFlight(hosts: Host[]): number {
    return hosts.filter((host) => IN_FLIGHT.includes(host.status.trim().toLowerCase())).length;
}

/**
 * The milestone as the collapsed summary carries it: everything before the first parenthesis, so a
 * milestone that spells out its dates in brackets still fits on the one line of the summary.
 */
export function summaryOf(career: Career | null): string {
    const milestone = career?.milestone ?? '';
    return milestone.split(' (')[0].trim();
}
