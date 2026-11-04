// Layer 1, data tests. The reader and the order of a period (src/lib/data/helpers/dates.ts): EDTF
// level 0 with level 1's open end. Each form a `period` field takes is read to its start, its end
// and their precision; each value it refuses reads as null; and periods order newest first, a value
// the reader refuses and no value after them. A wrong period accepted or refused is a wrong value
// written to a hub or a finding missed.
//
// It does not cover the schema check, the editors or the card sort that call the reader.

import { describe, expect, it } from 'vitest';
import { periodValueOrder, readPeriod } from '../../../src/lib/data/helpers/dates.ts';

/** One end of a period as the test writes it: precision, first day and last day. */
function end(precision: string, first: string, last: string = first): unknown {
    return expect.objectContaining({ precision, first, last }) as unknown;
}

const YEAR_2025 = end('year', '2025-01-01', '2025-12-31');

describe('a period', () => {
    it.each([
        { row: 'the text 2025', value: '2025', start: YEAR_2025, last: YEAR_2025 },
        { row: 'the whole number 2025', value: 2025, start: YEAR_2025, last: YEAR_2025 },
        {
            row: 'a month',
            value: '2025-09',
            start: end('month', '2025-09-01', '2025-09-30'),
            last: end('month', '2025-09-01', '2025-09-30')
        },
        {
            row: 'a day',
            value: '2026-10-27',
            start: end('day', '2026-10-27'),
            last: end('day', '2026-10-27')
        },
        {
            row: 'a date-time',
            value: '2026-10-27T11:00:00',
            start: end('time', '2026-10-27'),
            last: end('time', '2026-10-27')
        },
        {
            row: 'a date-time in UTC',
            value: '2026-10-27T11:00:00Z',
            start: end('time', '2026-10-27'),
            last: end('time', '2026-10-27')
        },
        {
            row: 'a date-time with a zone',
            value: '2026-10-27T11:00:00+01:00',
            start: end('time', '2026-10-27'),
            last: end('time', '2026-10-27')
        },
        {
            row: 'a span of months',
            value: '2025-09/2026-09',
            start: end('month', '2025-09-01', '2025-09-30'),
            last: end('month', '2026-09-01', '2026-09-30')
        },
        {
            row: 'a span of days',
            value: '2026-10-27/2026-10-30',
            start: end('day', '2026-10-27'),
            last: end('day', '2026-10-30')
        },
        {
            row: 'a span from a month to a year',
            value: '2015-09/2024',
            start: end('month', '2015-09-01', '2015-09-30'),
            last: end('year', '2024-01-01', '2024-12-31')
        },
        { row: 'an open end', value: '2025/..', start: YEAR_2025, last: null },
        {
            row: 'a leap day',
            value: '2024-02-29',
            start: end('day', '2024-02-29'),
            last: end('day', '2024-02-29')
        }
    ])('reads $row', ({ value, start, last }) => {
        expect(readPeriod(value)).toEqual({ start, end: last });
    });

    it.each([
        { row: 'an empty text', value: '' },
        { row: 'two digits', value: '25' },
        { row: 'month 13', value: '2025-13' },
        { row: 'the 30th of February', value: '2026-02-30' },
        { row: 'a leap day in a common year', value: '2025-02-29' },
        { row: 'hour 24', value: '2026-10-27T24:00:00' },
        { row: 'a date-time without seconds', value: '2026-10-27T11:00' },
        { row: 'a span from a date-time', value: '2026-10-27T11:00:00/2026-10-28' },
        { row: 'a span of years backwards', value: '2026/2025' },
        { row: 'a span of months backwards', value: '2026-10/2026-09' },
        { row: 'an open start', value: '../2025' },
        { row: 'an uncertain year', value: '2025?' },
        { row: 'an approximate year', value: '2025~' },
        { row: 'a season', value: '2025-21' },
        { row: 'two years joined by a dash', value: '2025-2026' },
        { row: 'two years joined by a spaced dash', value: '2025 - 2026' },
        { row: 'a month in words', value: 'Sept. 2025' },
        { row: 'a day and a time joined by a space', value: '2026-10-27 11:00' },
        { row: 'the whole number 20250', value: 20250 },
        { row: 'the whole number 999', value: 999 },
        { row: 'the whole number 0', value: 0 }
    ])('refuses $row', ({ value }) => {
        expect(readPeriod(value)).toBeNull();
    });

    it('orders newest first', () => {
        const ordered: unknown[] = [
            '2026-10-27/2026-10-30',
            '2026',
            '2025-09/2026-09',
            '2025-09/2025-12',
            '2025/..',
            2025,
            '2025 - 2026',
            null
        ];
        const inputs = [
            ordered,
            [...ordered].reverse(),
            [3, 7, 0, 6, 5, 1, 4, 2].map((at) => ordered[at])
        ];
        for (const input of inputs) {
            expect([...input].sort(periodValueOrder)).toEqual(ordered);
        }
    });
});
