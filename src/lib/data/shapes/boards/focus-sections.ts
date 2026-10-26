// Layer 1, data, pure. The sections of the Focus board as `focus.sections` of the merged config
// lists them (config/defaults/behavior.yml), read against the options-catalog entry that names the
// sections the board draws: the sections drawn, in drawing order, each once, and what is wrong with
// the list. Focus.svelte draws its sections by this reading (through state/boards/focus.ts) and the
// config check words its findings from it (data/sources/config/sections/focus.ts), each handing it
// the entry from the options catalog, so the two read the list one way.

import { focusBlock } from '../../helpers/guards.ts';

/** The key of the Focus board's sections under `focus:`. */
const SECTIONS = 'sections';

/** The options-catalog entry of the sections, whose `options` are the sections the board draws. */
export const FOCUS_SECTIONS = `focus.${SECTIONS}`;

/** The fields of the options-catalog entry of `focus.sections` this reading takes. */
type SectionsEntry = { options?: readonly string[]; default?: unknown };

/**
 * The Focus board's sections as `focus.sections` gives them: `sections`, the ones drawn in drawing
 * order, each a section of the board (a word of the entry's `options`) once; `unknown`, each listed
 * word that is no section; `twice`, each section listed again after its first place; `listed`,
 * false when the value is no list, in which case the sections are the entry's `default`, oculus's
 * list; and `held`, whether the `focus:` block names `sections` at all.
 */
type FocusSections = {
    sections: string[];
    unknown: string[];
    twice: string[];
    listed: boolean;
    held: boolean;
};

/**
 * The Focus board's sections drawn, in drawing order, and what is wrong with the list, read against
 * `entry`, the options-catalog entry of `focus.sections`.
 */
export function focusSections(
    config: Record<string, unknown>,
    entry: SectionsEntry | undefined
): FocusSections {
    const known = entry?.options ?? [];
    const block = focusBlock(config);
    const value = block[SECTIONS];
    const listed = Array.isArray(value);
    const shipped = entry?.default;
    const words: unknown[] = Array.isArray(value) ? value : Array.isArray(shipped) ? shipped : [];
    const read: FocusSections = {
        sections: [],
        unknown: [],
        twice: [],
        listed,
        held: Object.hasOwn(block, SECTIONS)
    };
    for (const word of words) {
        if (typeof word !== 'string' || !known.includes(word)) {
            if (listed) read.unknown.push(String(word));
        } else if (read.sections.includes(word)) {
            if (listed) read.twice.push(word);
        } else {
            read.sections.push(word);
        }
    }
    return read;
}
