// Layer 1, data tests. The typed readers of single settings out of the merged map (slurm, calendar,
// search, open, mail, the change log's length, the usage tiers, the Processes view's program names
// and the LaTeX formatter) over keys of every wrong shape. Each case names the sentence it throws.

import { describe, expect, it } from 'vitest';
import {
    calendarSettings,
    changesKeep,
    latexFormatting,
    mailSettings,
    openSettings,
    processesSettings,
    searchSettings,
    slurmSettings,
    usageTiers
} from '../../../../src/lib/data/sources/config.ts';

/** What a reader answers, or the sentence it throws. */
function outcome(read: () => unknown): { value: unknown } | { threw: string } {
    try {
        return { value: read() };
    } catch (error) {
        return { threw: error instanceof Error ? error.message : String(error) };
    }
}

const FILE = 'config/behavior.yml';
const threw = (sentence: string) => ({ threw: `${FILE}: ${sentence}` });

/** The numbers a reader of a finite number takes and refuses, in the order the cases try them. */
const NOT_FINITE = [Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY, '5', null];

/** What a cadence, a day window and a mail count are refused with. */
const CADENCE = 'a number from 1 to 35791';
const DAY_WINDOW = 'a whole number from 0 to 3650';
const PER_SIGNAL = 'a whole number from 1 to 500';
const PAST_CADENCE = [0, 0.5, -1, 35792];
const PAST_DAY_WINDOW = [-1, 1.5, 3651];
const PAST_PER_SIGNAL = [0, 2.5, -1, 501];

describe('slurmSettings', () => {
    const BLOCK = { resource: 'h', days: 7, poll_min: 5, quota_min: 30, prewarm: true };
    const read = (slurm: unknown) => outcome(() => slurmSettings({ slurm }));

    it.each([
        ['days', DAY_WINDOW, PAST_DAY_WINDOW],
        ['poll_min', CADENCE, PAST_CADENCE],
        ['quota_min', CADENCE, PAST_CADENCE]
    ])('refuses a %s that is not a number or is past its bound', (key, words, past) => {
        for (const bad of [...NOT_FINITE, ...past]) {
            expect(read({ ...BLOCK, [key]: bad })).toStrictEqual(
                threw(`slurm.${key} must be ${words}`)
            );
        }
    });
});

describe('calendarSettings', () => {
    const BLOCK = { poll_min: 5, days_back: 7, days_ahead: 30 };
    const read = (calendar: unknown) => outcome(() => calendarSettings({ calendar }));

    it('refuses each number that is not a number or is past its bound, naming the key', () => {
        const kinds: [string, string, number[]][] = [
            ['poll_min', CADENCE, PAST_CADENCE],
            ['days_back', DAY_WINDOW, PAST_DAY_WINDOW],
            ['days_ahead', DAY_WINDOW, PAST_DAY_WINDOW]
        ];
        for (const [key, words, past] of kinds) {
            for (const bad of [...NOT_FINITE, ...past]) {
                expect(read({ ...BLOCK, [key]: bad })).toStrictEqual(
                    threw(`calendar.${key} must be ${words}`)
                );
            }
        }
    });
});

describe('searchSettings', () => {
    const BLOCK = { max_hits: 100, timeout_s: 20 };
    const read = (search: unknown) => outcome(() => searchSettings({ search }));

    it('refuses each number that is not finite and above zero, naming the key', () => {
        for (const key of Object.keys(BLOCK)) {
            for (const bad of [...NOT_FINITE, -1, 0]) {
                expect(read({ ...BLOCK, [key]: bad })).toStrictEqual(
                    threw(`search.${key} must be a number above zero`)
                );
            }
        }
    });
});

describe('mailSettings', () => {
    const BLOCK = { poll_min: 5, per_signal: 10 };
    const read = (mail: unknown) => outcome(() => mailSettings({ mail }));

    it('refuses each number that is not a number or is past its bound, naming the key', () => {
        const kinds: [string, string, number[]][] = [
            ['poll_min', CADENCE, PAST_CADENCE],
            ['per_signal', PER_SIGNAL, PAST_PER_SIGNAL]
        ];
        for (const [key, words, past] of kinds) {
            for (const bad of [...NOT_FINITE, ...past]) {
                expect(read({ ...BLOCK, [key]: bad })).toStrictEqual(
                    threw(`mail.${key} must be ${words}`)
                );
            }
        }
    });
});

describe('changesKeep', () => {
    const read = (changes: unknown) => outcome(() => changesKeep({ changes }));

    it('refuses a keep that is not a whole number above zero', () => {
        for (const keep of [...NOT_FINITE, -1, 0, 1.5, undefined]) {
            expect(read({ keep })).toStrictEqual(
                threw('changes.keep must be a whole number above zero')
            );
        }
    });
});

describe('openSettings', () => {
    const MESSAGE = 'open.program_ext must map extensions, each with its dot, to bundle ids';
    const read = (open: unknown) => outcome(() => openSettings({ open }));

    it.each([[{ program_ext: { '.pdf': 3 } }]])('refuses an open key of %j', (open) => {
        expect(read(open)).toStrictEqual(threw(MESSAGE));
    });
});

describe('latexFormatting', () => {
    const PATHS = { latexindent_path: '', tex_fmt_path: '', badness_path: '' };
    const read = (latex: unknown) => outcome(() => latexFormatting({ latex }));

    it.each([['prettier']])('refuses a formatter of %j', (formatter) => {
        expect(read({ formatter, ...PATHS })).toStrictEqual(
            threw('latex.formatter must be one of none, latexindent, tex-fmt, badness')
        );
    });
});

describe('usageTiers', () => {
    const read = (usage_tiers: unknown) => outcome(() => usageTiers({ usage_tiers }));

    it('refuses the first value that is not text, naming its key', () => {
        expect(read({ a: 'A', b: 5, c: null })).toStrictEqual(
            threw('usage_tiers.b must be a string')
        );
    });
});

describe('processesSettings', () => {
    const WORDS = 'a list of program names, each without a slash or a space';
    const read = (processes: unknown) => outcome(() => processesSettings({ processes }, []));

    it.each([[{ patterns: ['a/b'] }]])('refuses a processes block of %j', (processes) => {
        expect(read(processes)).toStrictEqual(threw(`processes.patterns must be ${WORDS}`));
    });
});
