// Layer 1, data. The letters that start a chord of the rail: the `chord` of each group of
// `nav_groups` and the `direct_chord` of config/layout.yml. The page reads the same letters into
// the keys of the rail's `chords` (state/workbench/navigation/catalogue.ts), and the workbench
// holds a bare press of one as the start of a chord (resolve.ts), so an app's key on one is a key
// oculus takes.

import { z } from 'zod';
import { isMap } from '../../guards.ts';

/** A chord: one lowercase letter. */
export const chordShape = z.string().regex(/^[a-z]$/);

/** Every chord letter a configuration names, each once. */
export function railChordLetters(config: Record<string, unknown>): string[] {
    const raw = config.nav_groups;
    const groups: unknown[] = isMap(raw) ? Object.values(raw) : [];
    const named = [
        ...groups.map((group) => (isMap(group) ? group.chord : undefined)),
        config.direct_chord
    ];
    const letters = named.flatMap((one) => {
        const read = chordShape.safeParse(one);
        return read.success ? [read.data] : [];
    });
    return [...new Set(letters)];
}
