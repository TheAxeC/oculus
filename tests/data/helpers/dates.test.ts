// The calendar helpers of data/helpers/dates.ts: how long ago a stamp was, as a count of the
// largest unit that fits, and a moment's local calendar day.
//
// `ago` counts weeks of 7 days, months of 30 and years of 365, stops at the largest unit it is
// asked for, reads under a minute (a clock up to a minute ahead included) as now, and answers null
// for a stamp it cannot read or one more than a minute in the future. `localDate` takes a moment
// as a timestamp or a Date and writes the machine's own calendar day.

import { describe, expect, it } from 'vitest';
import { ago, localDate } from '../../../src/lib/data/helpers/dates.ts';

describe('ago', () => {
    const NOW = Date.parse('2026-09-28T12:00:00Z');

    it('is now under a minute, then the largest unit that fits', () => {
        expect(ago('2026-09-28T11:59:30Z', NOW, 'year')).toEqual({ unit: 'now', count: 0 });
        expect(ago('2026-09-28T11:00:00Z', NOW, 'year')).toEqual({ unit: 'hour', count: 1 });
        expect(ago('2026-09-28T11:55:00Z', NOW, 'year')).toEqual({ unit: 'minute', count: 5 });
        expect(ago('2026-08-01T12:00:00Z', NOW, 'year')).toEqual({ unit: 'month', count: 1 });
        expect(ago('2024-09-28T12:00:00Z', NOW, 'year')).toEqual({ unit: 'year', count: 2 });
    });

    it('stops at the largest unit it is asked for', () => {
        expect(ago('2026-09-14T12:00:00Z', NOW, 'day')).toEqual({ unit: 'day', count: 14 });
        expect(ago('2026-09-14T12:00:00Z', NOW, 'year')).toEqual({ unit: 'week', count: 2 });
        expect(ago('2026-09-28T09:00:00Z', NOW, 'day')).toEqual({ unit: 'hour', count: 3 });
        expect(ago('2026-09-25T12:00:00Z', NOW, 'day')).toEqual({ unit: 'day', count: 3 });
        expect(ago('2025-09-28T12:00:00Z', NOW, 'month')).toEqual({ unit: 'month', count: 12 });
    });

    it('is now for a clock up to a minute ahead, and nothing further ahead', () => {
        expect(ago('2026-09-28T12:00:20Z', NOW, 'year')).toEqual({ unit: 'now', count: 0 });
        expect(ago('2026-09-28T12:05:00Z', NOW, 'year')).toBe(null);
    });

    it('is nothing for a stamp it cannot read', () => {
        expect(ago('nonsense', NOW, 'year')).toBe(null);
        expect(ago('', NOW, 'day')).toBe(null);
        expect(ago(null, NOW, 'day')).toBe(null);
    });
});

describe('localDate', () => {
    it('writes the local day of a Date and of a timestamp alike', () => {
        expect(localDate(new Date(2026, 8, 28, 23, 59))).toBe('2026-09-28');
        expect(localDate(new Date(2026, 8, 28, 23, 59).getTime())).toBe('2026-09-28');
        expect(localDate(new Date(2026, 0, 2, 0, 0))).toBe('2026-01-02');
    });
});
