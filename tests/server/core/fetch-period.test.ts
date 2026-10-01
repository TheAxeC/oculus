// Layer 2, server tests. The reader of `git.autofetch_minutes`: a whole number of minutes, 0 or
// more, read from a configuration of any shape without a cast, and the start check that says so in
// one sentence. The timer that uses the number is tests/server/git/autofetch.test.ts; the refusal
// of a write of a wrong value is tests/server/edit/config-key.test.ts.

import { describe, expect, it } from 'vitest';
import { autofetchMinutes, requireAutofetch } from '../../../src/lib/server/core/fetch-period.ts';

const SENTENCE =
    'config/behavior.yml: git.autofetch_minutes must be a whole number of minutes, 0 or more';

/** The configurations that cannot hold the key as a whole number of minutes, by what is wrong. */
const WRONG: [string, unknown][] = [
    ['a negative number', { git: { autofetch_minutes: -1 } }],
    ['a fractional number', { git: { autofetch_minutes: 1.5 } }],
    ['text', { git: { autofetch_minutes: '5' } }],
    ['null', { git: { autofetch_minutes: null } }],
    ['infinity', { git: { autofetch_minutes: Infinity } }],
    ['not a number', { git: { autofetch_minutes: NaN } }],
    ['a missing key', { git: { message_model: '' } }],
    ['a git block that is a list', { git: [] }],
    ['a git block that is text', { git: 'x' }],
    ['no git block', {}],
    ['a configuration that is a list', []],
    ['a configuration that is text', 'x'],
    ['a configuration that is null', null],
    ['a configuration that is missing', undefined]
];

describe('autofetchMinutes', () => {
    it('answers the number of minutes for a whole number of 0 or more', () => {
        for (const minutes of [0, 1, 5, 10, 1440]) {
            expect(autofetchMinutes({ git: { autofetch_minutes: minutes } })).toBe(minutes);
        }
    });

    it('answers null for every value and shape that is not one', () => {
        for (const [, config] of WRONG) expect(autofetchMinutes(config)).toBeNull();
    });

    it('reads the key whatever else the configuration holds', () => {
        const config = {
            git: { message_model: '', autofetch_minutes: 3 },
            search: { max_hits: 1 }
        };
        expect(autofetchMinutes(config)).toBe(3);
    });
});

describe('requireAutofetch', () => {
    it('answers the number for 0 and for 10', () => {
        expect(requireAutofetch({ git: { autofetch_minutes: 0 } })).toBe(0);
        expect(requireAutofetch({ git: { autofetch_minutes: 10 } })).toBe(10);
    });

    it('throws one sentence naming the key for every wrong value and shape', () => {
        for (const [what, config] of WRONG) {
            expect(() => requireAutofetch(config), what).toThrow(new Error(SENTENCE));
        }
    });
});
