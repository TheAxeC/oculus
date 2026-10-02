// Layer 2, client state. The rows of a status vocabulary in config/catalogs/vocab.yml as a view
// draws them: the value a record carries, its words, its glyph name and its tone. The career
// panel's host statuses and the Personal board's side-project statuses are read by this one
// function, so the two vocabularies cannot be read two ways.

import { z } from 'zod';
import { mapShape, readAs, wordShape } from '../../../data/shapes/shapes.ts';
import { UNKNOWN_TONE, toneOf } from './tones.ts';

/** One status of a vocabulary: the value a record carries, its words, its glyph and its hue. */
export type StatusRow = {
    key: string;
    label: string;
    glyph: string;
    tone: string;
};

/** The label, icon and colour of one vocabulary row, each the empty text if absent. */
const rowShape = z.object({ label: wordShape, icon: wordShape, color: wordShape });

/**
 * The rows of one vocabulary in the config's order, each icon kept as a glyph name and each hue
 * already resolved to a tone. A row that is no map is skipped, as is each key named in `skip`; a
 * vocabulary that is no map has no rows.
 */
export function statusRows(
    config: Record<string, unknown>,
    vocabulary: string,
    skip: string[] = []
): StatusRow[] {
    const rows = readAs(mapShape, config[vocabulary]);
    if (rows === null) return [];
    return Object.entries(rows).flatMap(([key, row]) => {
        if (skip.includes(key)) return [];
        const held = readAs(rowShape, row);
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
