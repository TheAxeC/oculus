// Layer 4, server test. One group's `slides:` list rewritten inside a deck's present.yml.
//
// The point of the edit is what it leaves alone, so every case asserts the bytes outside the one
// list rather than only the list itself, and reads the result back with the YAML parser so a name
// written plain that no longer parses as itself fails here.

import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';
import { setGroupSlides } from '../../../src/lib/server/edit/deck-edit.ts';

/** A deck file with comments before, between and after the lists of its two groups. */
const BOTH = `# the deck
deck:
    title: A deck

groups:
    # the pillars
    pillars:
        find: { folders: projects/*/*/present, tiers: [active] }
        # named by hand
        slides:
            - alpha
            - beta
    # the rest
    more:
        find: { folders: projects/*/*/present }
        discover: true

# what is shown
order:
    - { slides: pillars }
    - { slides: more }
`;

/** What a group's list holds, read back through the parser. */
function listOf(source: string, group: string): unknown {
    const groups = (parse(source) as { groups: Record<string, { slides?: unknown }> }).groups;
    return groups[group].slides;
}

describe('setGroupSlides', () => {
    it('replaces a list in place and keeps every comment around it', () => {
        const flow = 'groups:\n    g:\n        slides: [a, b]\norder:\n    - { slides: g }\n';
        const withoutList = / {8}slides:\n(?: {12}- .*\n)+/;
        const rows: {
            row: string;
            source: string;
            group: string;
            names: string[];
            /** What is left in the text, and whether every byte outside the one list is. */
            kept: string[];
            outside: boolean;
        }[] = [
            {
                row: 'a block list with comments around it',
                source: BOTH,
                group: 'pillars',
                names: ['beta', 'gamma', 'alpha'],
                kept: [
                    '# the deck\n',
                    '    # the pillars\n',
                    '        # named by hand\n',
                    '    # the rest\n',
                    '# what is shown\n'
                ],
                outside: true
            },
            {
                row: 'a group that holds no list',
                source: BOTH,
                group: 'more',
                names: ['one', 'two'],
                kept: ['# what is shown\n', '    # the rest\n', 'discover: true'],
                outside: false
            },
            {
                row: 'a list written as a flow',
                source: flow,
                group: 'g',
                names: ['b', 'a'],
                kept: ['order:\n    - { slides: g }\n'],
                outside: false
            },
            {
                row: 'names YAML would read as another value',
                source: BOTH,
                group: 'pillars',
                names: ['yes', '2026', 'null'],
                kept: ['# what is shown\n'],
                outside: true
            },
            {
                row: 'a list equal to the one held',
                source: BOTH,
                group: 'pillars',
                names: ['alpha', 'beta'],
                kept: [BOTH],
                outside: false
            }
        ];
        for (const { row, source, group, names, kept, outside } of rows) {
            const out = setGroupSlides(source, group, names);
            expect(out, row).not.toBeNull();
            const text = out ?? '';
            expect(listOf(text, group), row).toEqual(names);
            for (const piece of kept) expect(text, row).toContain(piece);
            if (outside)
                expect(text.replace(withoutList, ''), row).toBe(source.replace(withoutList, ''));
        }
        const more = (
            parse(setGroupSlides(BOTH, 'more', ['one']) ?? '') as {
                groups: Record<string, Record<string, unknown>>;
            }
        ).groups.more;
        expect(more.discover).toBe(true);
        expect(more.find).toEqual({ folders: 'projects/*/*/present' });

        const refused: { row: string; source: string; group: string; names: string[] }[] = [
            { row: 'a group the file does not hold', source: BOTH, group: 'nothing', names: ['a'] },
            {
                row: 'a file that does not parse',
                source: 'groups: [unclosed\n',
                group: 'pillars',
                names: ['a']
            },
            {
                row: 'a group that is not a map',
                source: 'groups:\n  g: not a map\n',
                group: 'g',
                names: ['a']
            },
            {
                row: 'a group written in flow, which the edit does not read back as the original',
                source: 'groups: { g: { slides: [a] } }\n',
                group: 'g',
                names: ['b']
            }
        ];
        for (const { row, source, group, names } of refused) {
            expect(setGroupSlides(source, group, names), row).toBeNull();
        }
    });
});
