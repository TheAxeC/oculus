// Layer 2, client-state tests. The folds the Usage view draws from: an account's rate windows in
// their order, the token counts of the day rows summed, the history's table rows with their total,
// and when a refresher refreshes next.

import { describe, expect, it } from 'vitest';

import { orderedWindows, usageTotals } from '../../../../src/lib/state/system/machine/usage.ts';
import {
    hasUsageStatus,
    nextRefresh,
    usageRows
} from '../../../../src/lib/state/system/machine/usage.ts';

describe('the usage folds', () => {
    it('order an account windows from the shortest', () => {
        const windows = ['weekly_model', 'seven_day', 'five_hour'].map((name) => ({
            name
        })) as unknown as Parameters<typeof orderedWindows>[0];
        expect(orderedWindows(windows).map((one) => one.name)).toEqual([
            'five_hour',
            'seven_day',
            'weekly_model'
        ]);
    });

    it('sum the token counts of the day rows', () => {
        const rows = [
            { input: 1, output: 2, cacheRead: 3, cacheCreation: 4 },
            { input: 10, output: 20, cacheRead: 30, cacheCreation: 40 }
        ] as unknown as Parameters<typeof usageTotals>[0];
        expect(usageTotals(rows)).toEqual({
            input: 11,
            output: 22,
            cacheRead: 33,
            cacheCreation: 44
        });
    });
});

describe('whether an account has anything to say of its limits', () => {
    it('is a rate window or a live session', () => {
        expect(hasUsageStatus({ windows: [], live: [{}] })).toBe(true);
        expect(hasUsageStatus({ windows: [{}], live: [] })).toBe(true);
        expect(hasUsageStatus({ windows: [], live: [] })).toBe(false);
    });
});

describe('the usage history rows and the next refresh', () => {
    it('key each day row by its tool, account, day and model, and total them under the word given', () => {
        const days = [
            {
                tool: 'claude',
                account: 'a',
                day: 'd1',
                model: 'm',
                input: 1,
                output: 2,
                cacheRead: 3,
                cacheCreation: 4
            },
            {
                tool: 'claude',
                account: 'a',
                day: 'd1',
                model: 'n',
                input: 10,
                output: 20,
                cacheRead: 30,
                cacheCreation: 40
            }
        ] as unknown as Parameters<typeof usageRows>[0];
        const rows = usageRows(days, 'Total');
        expect(rows.map((one) => one.rowKey)).toEqual(['claude:a:d1:m', 'claude:a:d1:n', 'total']);
        expect(rows[2]).toEqual({
            rowKey: 'total',
            day: 'Total',
            tool: '',
            account: '',
            model: '',
            input: 11,
            output: 22,
            cacheRead: 33,
            cacheCreation: 44
        });
        // No day rows is no history, so there is nothing to total.
        expect(usageRows([], 'Total')).toEqual([]);
    });

    it('is the last refresh plus the cadence, and nothing while either is unknown', () => {
        expect(nextRefresh('2026-09-25T10:00:00.000Z', 15)).toBe('2026-09-25T10:15:00.000Z');
        // Before the first refresh, before the cadence arrives, or over a time that does not parse,
        // there is no next time to name.
        expect(nextRefresh('', 15)).toBe('');
        expect(nextRefresh('2026-09-25T10:00:00.000Z', 0)).toBe('');
        expect(nextRefresh('not a time', 15)).toBe('');
    });
});
