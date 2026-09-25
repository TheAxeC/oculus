// Layer 2, client state. Public Usage channel types for the view, kept behind the state-to-data
// boundary, and the two folds the view draws from them: an account's rate windows in their order,
// and the token counts of the day rows summed.

import type { UsageDay, UsageWindow } from '../../data/model/index.ts';

export type { UsageAccount, UsageDay, UsageWindow } from '../../data/model/index.ts';

/** Where each rate window sorts: the short window first, then the week, then a model's own week. */
const WINDOW_ORDER: Record<UsageWindow['name'], number> = {
    five_hour: 0,
    seven_day: 1,
    weekly_model: 2,
    primary: 0,
    secondary: 1
};

/** An account's rate windows, the shortest first. */
export function orderedWindows(windows: UsageWindow[]): UsageWindow[] {
    return [...windows].sort((left, right) => WINDOW_ORDER[left.name] - WINDOW_ORDER[right.name]);
}

/** The token counts of the day rows, summed. */
export function usageTotals(
    rows: UsageDay[]
): Pick<UsageDay, 'input' | 'output' | 'cacheRead' | 'cacheCreation'> {
    return {
        input: rows.reduce((sum, row) => sum + row.input, 0),
        output: rows.reduce((sum, row) => sum + row.output, 0),
        cacheRead: rows.reduce((sum, row) => sum + row.cacheRead, 0),
        cacheCreation: rows.reduce((sum, row) => sum + row.cacheCreation, 0)
    };
}

/** Whether an account has anything to say of its limits: a rate window, or a live session. */
export function hasUsageStatus(account: {
    windows: readonly unknown[];
    live: readonly unknown[];
}): boolean {
    return account.windows.length > 0 || account.live.length > 0;
}
