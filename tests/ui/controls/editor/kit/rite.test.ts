// The language settings given to Monaco for the languages it does not know: the comment, the
// brackets and the auto-closing pairs of rite, cmake, both forms of Fortran, jinja and svelte, over
// a Monaco stand-in that records each `setLanguageConfiguration`. The cases over the values are
// audits of what is handed to Monaco: that Cmd+/ toggles a comment, a bracket auto-closes and a
// pair matches is what Monaco does with them, which the look on a rite file shows.

import { describe, expect, it } from 'vitest';
import {
    RITE_CONFIGURATION,
    RITE_GRAMMAR
} from '../../../../../src/lib/ui/controls/editor/kit/rite/rite.ts';
import { registerSettings } from '../../../../../src/lib/ui/controls/editor/kit/rite/settings.ts';

type Configuration = {
    comments?: { lineComment?: string; blockComment?: [string, string] };
    brackets?: [string, string][];
    autoClosingPairs?: { open: string; close: string; notIn?: string[] }[];
    surroundingPairs?: { open: string; close: string }[] | [string, string][];
    wordPattern?: RegExp;
};

/** The configuration each language id was given, in the order of the calls. */
function registered(): Map<string, Configuration> {
    const given = new Map<string, Configuration>();
    registerSettings({
        languages: {
            setLanguageConfiguration: (id: string, configuration: Configuration) =>
                void given.set(id, configuration)
        }
    } as never);
    return given;
}

const BRACKETS = [
    ['(', ')'],
    ['[', ']'],
    ['{', '}']
];

describe('the rite settings', () => {
    // Audit: asserts the values handed to Monaco, not the editing they cause.
    it('give a rite file the semicolon comment, the three bracket pairs and the word pattern', () => {
        const given = registered().get('rite');
        expect(given?.comments?.lineComment).toBe(';');
        expect(given?.brackets).toEqual(BRACKETS);
        expect(given?.wordPattern).toBeInstanceOf(RegExp);
        expect(given?.wordPattern?.source).toBe('[^\\s()\\[\\]{}";]+');
        expect(given?.autoClosingPairs?.map((pair) => pair.open)).toEqual(['(', '[', '{', '"']);
        expect(given?.autoClosingPairs?.at(-1)).toEqual({
            open: '"',
            close: '"',
            notIn: ['string', 'comment']
        });
        expect(given).toMatchObject({
            comments: RITE_CONFIGURATION.comments,
            brackets: RITE_CONFIGURATION.brackets,
            autoClosingPairs: RITE_CONFIGURATION.autoClosingPairs,
            wordPattern: RITE_CONFIGURATION.wordPattern
        });
    });

    // Monaco reads `pair.open` of a surrounding pair, so a pair given as the file's array would
    // surround nothing.
    it("give Monaco the surrounding pairs as objects, the file's four in order", () => {
        expect(registered().get('rite')?.surroundingPairs).toEqual([
            { open: '(', close: ')' },
            { open: '[', close: ']' },
            { open: '{', close: '}' },
            { open: '"', close: '"' }
        ]);
        expect(RITE_CONFIGURATION.surroundingPairs).toHaveLength(4);
    });

    it('carry the grammar by the name and the scope the editor loads it under', () => {
        expect(RITE_GRAMMAR).toMatchObject({ name: 'rite', scopeName: 'source.rite' });
    });
});

describe('the settings of the languages Monaco does not know', () => {
    // Audit: asserts the values handed to Monaco.
    it('give each its comment and the three bracket pairs with their auto-closing pairs', () => {
        const given = registered();
        const comment = (id: string) => given.get(id)?.comments;
        expect(comment('cmake')).toEqual({ lineComment: '#' });
        expect(comment('fortran-free-form')).toEqual({ lineComment: '!' });
        expect(comment('fortran-fixed-form')).toEqual({ lineComment: '!' });
        expect(comment('jinja')).toEqual({ blockComment: ['{#', '#}'] });
        expect(comment('svelte')).toEqual({ blockComment: ['<!--', '-->'] });
        for (const id of ['cmake', 'fortran-free-form', 'fortran-fixed-form', 'jinja', 'svelte']) {
            expect(given.get(id)?.brackets).toEqual(BRACKETS);
            expect(given.get(id)?.autoClosingPairs).toEqual([
                { open: '(', close: ')' },
                { open: '[', close: ']' },
                { open: '{', close: '}' }
            ]);
        }
    });

    it('leave the languages Monaco has its own settings for alone', () => {
        const ids = [...registered().keys()].sort();
        expect(ids).toEqual(
            ['cmake', 'fortran-fixed-form', 'fortran-free-form', 'jinja', 'rite', 'svelte'].sort()
        );
    });
});
