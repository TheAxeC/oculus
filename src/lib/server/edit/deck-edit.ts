// Layer 2, server, pure. One group's `slides:` list rewritten inside a deck's present.yml.
//
// The line edit itself is server/edit/list-edit.ts's, shared with the audit's mute list: the list
// is found under its map, `groups:` then the group, and replaced, or appended to the end of the
// group when it holds none yet, and every other line of the file stays as it was, comments
// included. What is here is the deck's own half: which key is written, and the guard that says
// whether the result means what the file meant.
//
// Rather than knowing every shape it cannot keep, setGroupSlides reads its own result back and
// compares it with the original: the parsed file must be the original with that one list replaced,
// or nothing is written and the caller refuses. A list written as a flow (`[a, b]`) is rewritten as
// a block list that reads back to the same names.

import { isDeepStrictEqual } from 'node:util';
import { parse } from 'yaml';
import { fields, strings } from '../../data/helpers/guards.ts';
import { readBack, setList } from './list-edit.ts';

/** The key of a deck's groups and the key of the list a group holds. */
const GROUPS = 'groups';
const SLIDES = 'slides';

/** The names a group's `slides:` holds in a deck file, or null when it holds no such group. */
export function groupSlides(source: string, group: string): string[] | null {
    let parsed: unknown;
    try {
        parsed = parse(source);
    } catch {
        return null;
    }
    const held = fields(fields(parsed)[GROUPS])[group];
    if (typeof held !== 'object' || held === null || Array.isArray(held)) return null;
    return strings(fields(held)[SLIDES]);
}

/**
 * Whether the edited source is the original with the one list replaced: it must parse, and every
 * other key of the document, of `groups:` and of the group must be as it was.
 */
function kept(source: string, edited: string, group: string, slides: string[]): boolean {
    const read = readBack(source, edited);
    if (read === null) return false;
    const expected = structuredClone(read.before);
    const held = fields(fields(expected[GROUPS])[group]);
    held[SLIDES] = slides;
    return isDeepStrictEqual(read.after, expected);
}

/**
 * The source with one group's `slides:` set to `slides`, or null when the edit could not keep the
 * file as it was: the group is not a map of the file, or the way the file is written cannot be
 * edited in place. A list equal to the one held returns the source itself.
 */
export function setGroupSlides(source: string, group: string, slides: string[]): string | null {
    if (groupSlides(source, group) === null) return null;
    const edited = setList(source, [GROUPS, group], SLIDES, slides);
    return kept(source, edited, group, slides) ? edited : null;
}
