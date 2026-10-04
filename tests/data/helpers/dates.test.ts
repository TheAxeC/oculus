// Layer 1, data tests. The calendar helpers of data/helpers/dates.ts: how long ago a stamp was, as
// a count of the largest unit that fits, and a moment's local calendar day.
//
// `ago` counts weeks of 7 days, months of 30 and years of 365, stops at the largest unit it is
// asked for, reads under a minute (a clock up to a minute ahead included) as now, and answers null
// for a stamp it cannot read or one more than a minute in the future. `localDate` takes a moment
// as a timestamp or a Date and writes the machine's own calendar day.

import { describe, expect, it } from 'vitest';
import { ago, localDate } from '../../../src/lib/data/helpers/dates.ts';

describe('ago', () => {
    const NOW = Date.parse('2026-09-28T12:00:00Z');

    it.each([
        ['30 seconds', '2026-09-28T11:59:30Z', 'year', { unit: 'now', count: 0 }],
        ['5 minutes', '2026-09-28T11:55:00Z', 'year', { unit: 'minute', count: 5 }],
        ['1 hour', '2026-09-28T11:00:00Z', 'year', { unit: 'hour', count: 1 }],
        ['2 weeks', '2026-09-14T12:00:00Z', 'year', { unit: 'week', count: 2 }],
        ['1 month', '2026-08-01T12:00:00Z', 'year', { unit: 'month', count: 1 }],
        ['2 years', '2024-09-28T12:00:00Z', 'year', { unit: 'year', count: 2 }],
        ['14 days up to days', '2026-09-14T12:00:00Z', 'day', { unit: 'day', count: 14 }],
        ['3 hours up to days', '2026-09-28T09:00:00Z', 'day', { unit: 'hour', count: 3 }],
        ['3 days up to days', '2026-09-25T12:00:00Z', 'day', { unit: 'day', count: 3 }],
        ['12 months up to months', '2025-09-28T12:00:00Z', 'month', { unit: 'month', count: 12 }],
        ['a clock 20 seconds ahead', '2026-09-28T12:00:20Z', 'year', { unit: 'now', count: 0 }],
        ['a clock 5 minutes ahead', '2026-09-28T12:05:00Z', 'year', null],
        ['text that is no time', 'nonsense', 'year', null],
        ['an empty stamp', '', 'day', null],
        ['no stamp', null, 'day', null]
    ] as const)('reads %s as the count and unit it names', (_row, stamp, largest, answer) => {
        expect(ago(stamp, NOW, largest)).toEqual(answer);
    });
});

describe('localDate', () => {
    it.each([
        ['a Date late in the day', new Date(2026, 8, 28, 23, 59), '2026-09-28'],
        ['a timestamp late in the day', new Date(2026, 8, 28, 23, 59).getTime(), '2026-09-28'],
        ['a Date just after midnight', new Date(2026, 0, 2, 0, 0), '2026-01-02']
    ])('writes the local day of %s', (_row, moment, day) => {
        expect(localDate(moment)).toBe(day);
    });
});
