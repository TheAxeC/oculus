// Layer 4, server test. The deck's two saved lists rewritten inside config/present.yml.
//
// The point of the edit is what it leaves alone, so every case asserts the bytes outside the one
// list rather than only the list itself, and reads the result back with the YAML parser so a key
// written plain that no longer parses as itself fails here.

import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';
import { setDeckList } from '../../../src/lib/server/edit/deck-edit.ts';

/** A deck file with comments before, between and after the two lists it holds. */
const BOTH = `# the deck
deck:
    # what the deck shows
    selection:
        - title
        - framing:engine
    # where each of them sits
    slide_order:
        - title
        - framing:engine
        - closing
    # the order the file was written in
    order:
        - { slide: title }
`;

/** What the two lists hold, read back through the parser. */
function listsOf(source: string): { selection: unknown; order: unknown } {
    const deck = (parse(source) as { deck: Record<string, unknown> }).deck;
    return { selection: deck.selection, order: deck.slide_order };
}

describe('setDeckList', () => {
    it('replaces a list in place and keeps every comment around it', () => {
        const out = setDeckList(BOTH, 'selection', ['closing', 'title']);
        expect(out).toContain('# the deck\n');
        expect(out).toContain('    # what the deck shows\n');
        expect(out).toContain('    # where each of them sits\n');
        expect(out).toContain('    # the order the file was written in\n');
        expect(out).toContain('        - { slide: title }\n');
        expect(listsOf(out).selection).toEqual(['closing', 'title']);
        // Nothing but the one list moved: the rest of the file is byte-identical.
        const withoutList = / {4}selection:\n(?: {8}- .*\n)+/;
        expect(out.replace(withoutList, '')).toBe(BOTH.replace(withoutList, ''));
    });
});
