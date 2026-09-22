// Layer 3, primitive. The table's contract and its ordering: what one column declares, and how
// rows are sorted by one of them. Apart from the component so the comparison can be read without a
// rendering.

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
