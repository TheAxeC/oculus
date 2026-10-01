// The typed readers of single settings out of the merged map (slurm, calendar, search, open, mail,
// the change log's length and the usage tiers) over keys of every wrong shape. Each case names the
// value the reader answers or the sentence it throws, and the order in which two wrong keys are
// refused.

import { describe, expect, it } from 'vitest';
import {
    calendarSettings,
    changesKeep,
    mailSettings,
    openSettings,
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
const FINITE = [-1, 0, 1.5];

describe('slurmSettings', () => {
    const BLOCK = { host: 'h', days: 7, poll_min: 5, quota_min: 30, prewarm: true };
    const read = (slurm: unknown) => outcome(() => slurmSettings({ slurm }));

    it.each([[[]], ['x'], [null], [3]])('refuses a slurm key of %j', (slurm) => {
        expect(read(slurm)).toStrictEqual(threw('slurm must be a map'));
    });

    it.each([
        ['days', 'days'],
        ['poll_min', 'poll_min'],
        ['quota_min', 'quota_min']
    ])('refuses a %s that is not a finite number', (field, key) => {
        for (const bad of NOT_FINITE) {
            expect(read({ ...BLOCK, [field]: bad })).toStrictEqual(
                threw(`slurm.${key} must be a number`)
            );
        }
    });

    it('reads a number of any finite value', () => {
        for (const days of FINITE) {
            expect(read({ ...BLOCK, days })).toStrictEqual({
                value: { host: 'h', days, pollMin: 5, quotaMin: 30, prewarm: true }
            });
        }
    });

    it.each([[''], [3], [null], [[]]])('refuses a host of %j', (host) => {
        expect(read({ ...BLOCK, host })).toStrictEqual(
            threw('slurm.host must be a non-empty string')
        );
    });

    it('refuses a prewarm that is not a boolean', () => {
        for (const prewarm of ['true', 1, null]) {
            expect(read({ ...BLOCK, prewarm })).toStrictEqual(
                threw('slurm.prewarm must be true or false')
            );
        }
    });

    it('refuses the host before the prewarm and the prewarm before the numbers', () => {
        expect(read({ ...BLOCK, host: 3, prewarm: 'x', days: 'x' })).toStrictEqual(
            threw('slurm.host must be a non-empty string')
        );
        expect(read({ ...BLOCK, prewarm: 'x', days: 'x' })).toStrictEqual(
            threw('slurm.prewarm must be true or false')
        );
        expect(read({ ...BLOCK, days: 'x', poll_min: 'x' })).toStrictEqual(
            threw('slurm.days must be a number')
        );
    });
});

describe('calendarSettings', () => {
    const BLOCK = { poll_min: 5, days_back: 7, days_ahead: 30 };
    const read = (calendar: unknown) => outcome(() => calendarSettings({ calendar }));

    it.each([[[]], ['x'], [null], [3]])('refuses a calendar key of %j', (calendar) => {
        expect(read(calendar)).toStrictEqual(threw('calendar must be a map'));
    });

    it('refuses each number that is not finite, naming the key', () => {
        for (const key of Object.keys(BLOCK)) {
            for (const bad of NOT_FINITE) {
                expect(read({ ...BLOCK, [key]: bad })).toStrictEqual(
                    threw(`calendar.${key} must be a number`)
                );
            }
        }
    });

    it('reads any finite number', () => {
        for (const days of FINITE) {
            expect(read({ ...BLOCK, days_back: days })).toStrictEqual({
                value: { pollMin: 5, daysBack: days, daysAhead: 30 }
            });
        }
    });
});

describe('searchSettings', () => {
    const BLOCK = { max_hits: 100, timeout_s: 20 };
    const read = (search: unknown) => outcome(() => searchSettings({ search }));

    it.each([[[]], ['x'], [null], [3]])('refuses a search key of %j', (search) => {
        expect(read(search)).toStrictEqual(threw('search must be a map'));
    });

    it('refuses each number that is not finite and above zero, naming the key', () => {
        for (const key of Object.keys(BLOCK)) {
            for (const bad of [...NOT_FINITE, -1, 0]) {
                expect(read({ ...BLOCK, [key]: bad })).toStrictEqual(
                    threw(`search.${key} must be a number above zero`)
                );
            }
        }
    });

    it('reads a fractional number as it is', () => {
        expect(read({ max_hits: 1.5, timeout_s: 0.5 })).toStrictEqual({
            value: { maxHits: 1.5, timeoutS: 0.5 }
        });
    });
});

describe('mailSettings', () => {
    const BLOCK = { poll_min: 5, per_signal: 10 };
    const read = (mail: unknown) => outcome(() => mailSettings({ mail }));

    it.each([[[]], ['x'], [null], [3]])('refuses a mail key of %j', (mail) => {
        expect(read(mail)).toStrictEqual(threw('mail must be a map'));
    });

    it('refuses each number that is not finite, naming the key', () => {
        for (const key of Object.keys(BLOCK)) {
            for (const bad of NOT_FINITE) {
                expect(read({ ...BLOCK, [key]: bad })).toStrictEqual(
                    threw(`mail.${key} must be a number`)
                );
            }
        }
    });

    it('reads any finite number', () => {
        for (const per of FINITE) {
            expect(read({ ...BLOCK, per_signal: per })).toStrictEqual({
                value: { pollMin: 5, perSignal: per }
            });
        }
    });
});

describe('changesKeep', () => {
    const read = (changes: unknown) => outcome(() => changesKeep({ changes }));

    it.each([[[]], ['x'], [null], [3]])('refuses a changes key of %j', (changes) => {
        expect(read(changes)).toStrictEqual(threw('changes must be a map'));
    });

    it('refuses a keep that is not a whole number above zero', () => {
        for (const keep of [...NOT_FINITE, -1, 0, 1.5, undefined]) {
            expect(read({ keep })).toStrictEqual(
                threw('changes.keep must be a whole number above zero')
            );
        }
    });

    it('reads a whole number above zero', () => {
        expect(read({ keep: 500 })).toStrictEqual({ value: 500 });
    });
});

describe('openSettings', () => {
    const MESSAGE = 'open.program_ext must map extensions, each with its dot, to bundle ids';
    const read = (open: unknown) => outcome(() => openSettings({ open }));

    it.each([
        [[]],
        ['x'],
        [{}],
        [{ program_ext: [] }],
        [{ program_ext: { pdf: 'com.apple.Preview' } }],
        [{ program_ext: { '.pdf': 3 } }],
        [{ program_ext: { '.pdf': 'Preview' } }]
    ])('refuses an open key of %j', (open) => {
        expect(read(open)).toStrictEqual(threw(MESSAGE));
    });

    it('reads the extensions lowercased', () => {
        expect(read({ program_ext: { '.PDF': 'com.apple.Preview' } })).toStrictEqual({
            value: { programApps: { '.pdf': 'com.apple.Preview' } }
        });
    });
});

describe('usageTiers', () => {
    const read = (usage_tiers: unknown) => outcome(() => usageTiers({ usage_tiers }));

    it.each([[[]], ['x'], [null], [3]])('refuses a usage_tiers key of %j', (tiers) => {
        expect(read(tiers)).toStrictEqual(threw('usage_tiers must be a map'));
    });

    it('refuses the first value that is not text, naming its key', () => {
        expect(read({ a: 'A', b: 5, c: null })).toStrictEqual(
            threw('usage_tiers.b must be a string')
        );
    });

    it('answers the map it was given', () => {
        const tiers = { max5: 'Max 5x', pro: 'Pro' };
        expect(usageTiers({ usage_tiers: tiers })).toBe(tiers);
    });
});
