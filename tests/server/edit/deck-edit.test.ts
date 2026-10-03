// Layer 4, server test. The deck's two saved lists rewritten inside config/present.yml.
//
// The point of the edit is what it leaves alone, so every case asserts the bytes outside the one
// list rather than only the list itself, and reads the result back with the YAML parser so a key
// written plain that no longer parses as itself fails here.

import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';
import { setDeckList, setDeckLists } from '../../../src/lib/server/edit/deck-edit.ts';

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

/** A deck file holding neither list, with a comment after the map. */
const NEITHER = `deck:
    tag_tones: { measured: green }
    order:
        - { slide: title }
# a comment after the deck
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

    it('appends a list the file does not hold, inside the deck map', () => {
        const out = setDeckList(NEITHER, 'selection', ['title']);
        expect(listsOf(out).selection).toEqual(['title']);
        expect(out).toContain('# a comment after the deck\n');
        expect(out).toContain('    tag_tones: { measured: green }\n');
        expect(out.endsWith('# a comment after the deck\n')).toBe(true);
    });

    it('appends both lists to a file holding neither, each under the deck', () => {
        const out = setDeckList(setDeckList(NEITHER, 'selection', ['title']), 'slide_order', [
            'title',
            'closing'
        ]);
        expect(listsOf(out)).toEqual({ selection: ['title'], order: ['title', 'closing'] });
    });

    it('replaces a list the file wrote in flow style', () => {
        const flow = 'deck:\n    selection: [title, closing] # a note\n    a: 1\n';
        const out = setDeckList(flow, 'selection', ['closing']);
        expect(listsOf(out).selection).toEqual(['closing']);
        expect(out).toContain('# a note\n');
        expect(out).toContain('    a: 1\n');
    });

    it('replaces a key the file wrote with no value at all', () => {
        const bare = 'deck:\n    selection:\n    a: 1\n';
        const out = setDeckList(bare, 'selection', ['title']);
        expect(listsOf(out).selection).toEqual(['title']);
        expect(out).toContain('    a: 1\n');
    });

    it('writes an empty list as a flow list rather than as a key with nothing under it', () => {
        const out = setDeckList(BOTH, 'selection', []);
        expect(out).toContain('    selection: []\n');
        expect(listsOf(out).selection).toEqual([]);
    });

    it.each([
        {
            name: 'a colon inside a key',
            field: 'slide_order',
            read: 'order',
            keys: ['summary:summary1', 'framing:engine']
        },
        {
            name: 'a colon followed by a space',
            field: 'selection',
            read: 'selection',
            keys: ['one: two']
        }
    ] as const)('writes $name so the parser reads each key back whole', ({ field, read, keys }) => {
        const out = setDeckList(BOTH, field, [...keys]);
        expect(listsOf(out)[read]).toEqual(keys);
    });

    it('leaves a source with no deck map exactly as it was', () => {
        for (const source of ['a: 1\n', '- one\n- two\n', '']) {
            expect(setDeckList(source, 'selection', ['title'])).toBe(source);
        }
    });
});

describe('setDeckLists', () => {
    it('sets both lists at once and keeps the file around them', () => {
        const out = setDeckLists(BOTH, {
            selection: ['closing'],
            slideOrder: ['closing', 'title']
        });
        expect(out).not.toBeNull();
        expect(listsOf(out ?? '')).toEqual({
            selection: ['closing'],
            order: ['closing', 'title']
        });
        expect(out).toContain('    # the order the file was written in\n');
    });

    it('refuses a deck map written in flow style, which a line edit cannot keep', () => {
        for (const source of [
            'deck:\n    { selection: [title], a: 1 }\n',
            'deck: { selection: [title], a: 1 }\n',
            'deck: {}\n'
        ]) {
            expect(
                setDeckLists(source, { selection: ['title'], slideOrder: ['title'] })
            ).toBeNull();
        }
    });

    it('keeps a CRLF file on one line ending throughout', () => {
        const source = BOTH.split('\n').join('\r\n');
        const out = setDeckLists(source, {
            selection: ['closing'],
            slideOrder: ['closing', 'title', 'framing:engine']
        });
        expect(out).not.toBeNull();
        const text = out ?? '';
        expect(listsOf(text).selection).toEqual(['closing']);
        expect(text.split('\n').length - 1).toBe(text.split('\r\n').length - 1);
        expect(text).toContain('\r\n        - closing\r\n');
    });
});
