// Layer 2, client-state tests. The two folds the Usage view draws from: an account's rate windows
// in their order, and the token counts of the day rows summed.

import { describe, expect, it } from 'vitest';

import { orderedWindows, usageTotals } from '../../../src/lib/state/system/usage.ts';
import { hasUsageStatus } from '../../../src/lib/state/system/usage.ts';

describe('the usage folds', () => {
    // revert: src/lib/state/system/usage.ts:20 => return [...windows];
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

    // revert: src/lib/state/system/usage.ts:30 => cacheRead: 0,
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
    // revert: src/lib/state/system/usage.ts:40 => return account.windows.length > 0;
    it('is a rate window or a live session', () => {
        expect(hasUsageStatus({ windows: [], live: [{}] })).toBe(true);
        expect(hasUsageStatus({ windows: [{}], live: [] })).toBe(true);
        expect(hasUsageStatus({ windows: [], live: [] })).toBe(false);
    });
});
