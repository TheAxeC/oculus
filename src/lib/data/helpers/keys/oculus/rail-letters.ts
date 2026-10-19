// Layer 1, data. The letters that start a chord of the rail: the `chord` of each `rail:` entry and
// of each group of `nav_groups`, and the `direct_chord` of config/layout.yml. The page reads the
// same letters into the keys of the rail's `chords` (state/workbench/navigation/catalogue.ts), and
// the workbench holds a bare press of one as the start of a chord (resolve.ts), so an app's key on
// one is a key oculus takes.

import { z } from 'zod';
import { isMap } from '../../guards.ts';

/** A chord: one lowercase letter. */
export const chordShape = z.string().regex(/^[a-z]$/);

/** Every chord letter a configuration names, each once. */
export function railChordLetters(config: Record<string, unknown>): string[] {
    const rail: unknown[] = Array.isArray(config.rail) ? config.rail : [];
    const raw = config.nav_groups;
    const groups: unknown[] = isMap(raw) ? Object.values(raw) : [];
    const named = [
        ...[...rail, ...groups].map((group) => (isMap(group) ? group.chord : undefined)),
        config.direct_chord
    ];
    const letters = named.flatMap((one) => {
        const read = chordShape.safeParse(one);
        return read.success ? [read.data] : [];
    });
    return [...new Set(letters)];
}

/**
 * The ids of the view catalogue's groups a configuration names: the `page` of each `rail:` entry,
 * then each key of `nav_groups`. A `docs:` entry names its group by one of these.
 */
export function catalogueGroupIds(config: Record<string, unknown>): string[] {
    const rail: unknown[] = Array.isArray(config.rail) ? config.rail : [];
    const pages = rail.flatMap((row) =>
        isMap(row) && typeof row.page === 'string' ? [row.page] : []
    );
    const raw = config.nav_groups;
    return [...new Set([...pages, ...(isMap(raw) ? Object.keys(raw) : [])])];
}
