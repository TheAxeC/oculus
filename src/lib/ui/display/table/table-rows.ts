// Layer 3, primitive. The table's contract, its ordering and its fitting: what one column declares,
// how rows are sorted by one of them, and which of the columns a list's Columns menu lists
// (`ListedColumn`, declared in data/shapes/boards/columns.ts) are drawn in the list's width
// (`fittedColumns`). Apart from the component so the comparison and the fitting can be read without
// a rendering.

import type { ListedColumn } from '../../../data/shapes/boards/columns.ts';

/** One column: the key it reads from a row, its heading, and how its cells are drawn. */
export type Column = {
    key: string;
    /** The heading's words, already translated by the view. */
    label: string;
    align?: 'left' | 'right';
    /** A CSS width, for a column that should not share the table's free space. */
    width?: string;
    /** Counts, dates and ids: drawn in the numeric font and right-aligned. */
    numeric?: boolean;
};

/**
 * One cell as the text it is drawn with: a string as it is, a number or a boolean written out, and
 * anything else as nothing, so a row holding a map or a list draws a blank cell rather than
 * `[object Object]`.
 */
export function cellText(value: unknown): string {
    if (typeof value === 'string') return value;
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);
    return '';
}

/** Which column the rows are ordered by, and which way. */
export type Sort = { key: string; direction: 'asc' | 'desc' };

/**
 * Rows ordered by one column. Numbers compare by value and everything else by locale, so a
 * column of counts does not sort 10 before 9 and a column of words sorts the way a reader
 * expects. A value the row does not hold sorts last whichever way the column is turned.
 */
export function order(
    rows: Record<string, unknown>[],
    sort: Sort | null
): Record<string, unknown>[] {
    if (sort === null) return rows;
    const sign = sort.direction === 'asc' ? 1 : -1;
    return [...rows].sort((left, right) => {
        const a = left[sort.key];
        const b = right[sort.key];
        if (a === undefined || a === null) return b === undefined || b === null ? 0 : 1;
        if (b === undefined || b === null) return -1;
        if (typeof a === 'number' && typeof b === 'number') return sign * (a - b);
        return sign * cellText(a).localeCompare(cellText(b));
    });
}

export type { ListedColumn };

/**
 * The columns a list draws in its width: every listed column that is shown, less the rightmost
 * ones whose minimum widths (`least`) do not fit, but the column `kept`, which is drawn always.
 * The columns drawn share the width in proportion to their minimums. A width of 0, a render with
 * no layout, draws them all.
 */
export function fittedColumns(
    listed: readonly ListedColumn[],
    width: number,
    least: (key: string) => number,
    kept: string
): Column[] {
    const drawn = listed.filter((one) => one.shown);
    let total = drawn.reduce((sum, one) => sum + least(one.key), 0);
    while (width > 0 && total > width) {
        const at = drawn.findLastIndex((one) => one.key !== kept);
        if (at < 0) break;
        total -= least(drawn[at].key);
        drawn.splice(at, 1);
    }
    return drawn.map((one) => ({
        key: one.key,
        label: one.label,
        width: `${((least(one.key) / total) * 100).toFixed(3)}%`
    }));
}
