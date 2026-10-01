// Layer 4, test. The cases of the facets a saved tab turns off, shared by the two tabs that save
// them in a list called `off`: what the list holds when what was saved is a list, and what it holds
// when it is anything else.

import { describe, expect, it } from 'vitest';

/** The `off` list that a saved state of one tab reads as, from the state's `off` field. */
export function describeOffFacets(tab: string, readOff: (off: unknown) => string[]): void {
    describe(`the facets a saved ${tab} tab turns off`, () => {
        it.each([
            ['a map', {}],
            ['a map keyed by position', { 0: 'a' }],
            ['text', 'ab'],
            ['null', null],
            ['absent', undefined],
            ['an empty list', []]
        ])('reads %s as none', (_label, off) => {
            expect(readOff(off)).toEqual([]);
        });

        it('keeps the text items of a list, in order, with the empty and the repeated ones', () => {
            expect(readOff([null, ['a'], 'a', '', 'a', 3])).toEqual(['a', '', 'a']);
        });
    });
}
