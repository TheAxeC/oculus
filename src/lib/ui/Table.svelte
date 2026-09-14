<script module lang="ts">
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

    /** Which column the rows are ordered by, and which way. */
    type Sort = { key: string; direction: 'asc' | 'desc' };

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
            return sign * String(a).localeCompare(String(b));
        });
    }
</script>

<script lang="ts">
    // Layer 3, primitive. A table of rows the caller has already joined and filtered. It holds one
    // thing of its own, which column it is sorted by: the order is a property of this table on this
    // screen and not of the data, so two tables over the same rows sort apart.
    //
    // A cell is the value as text unless the caller passes the `cell` snippet, which is how a column
    // of chips or of links is drawn without this component learning what either is.

    import type { Snippet } from 'svelte';

    type Props = {
        columns: Column[];
        rows: Record<string, unknown>[];
        /** The key whose value identifies a row, for the keyed each and for nothing else. */
        rowKey: string;
        /** Draws one cell. Without it a cell is its value as text. */
        cell?: Snippet<[Record<string, unknown>, Column]>;
        /** Whether a click on a heading sorts by that column. */
        sortable?: boolean;
    };

    let { columns, rows, rowKey, cell, sortable = false }: Props = $props();

    let sort: Sort | null = $state(null);

    const shown = $derived(order(rows, sortable ? sort : null));

    /** The first click on a column sorts it up, the next one turns it round. */
    function clicked(key: string): void {
        if (sort !== null && sort.key === key) {
            sort = { key, direction: sort.direction === 'asc' ? 'desc' : 'asc' };
            return;
        }
        sort = { key, direction: 'asc' };
    }

    function sorted(key: string): 'ascending' | 'descending' | 'none' {
        if (!sortable || sort === null || sort.key !== key) return 'none';
        return sort.direction === 'asc' ? 'ascending' : 'descending';
    }

    function text(value: unknown): string {
        return value === undefined || value === null ? '' : String(value);
    }
</script>

<table>
    <thead>
        <tr>
            {#each columns as column (column.key)}
                <th
                    scope="col"
                    class:numeric={column.numeric === true}
                    class:right={column.align === 'right'}
                    style={column.width === undefined ? undefined : `width: ${column.width}`}
                    aria-sort={sorted(column.key)}
                >
                    {#if sortable}
                        <button type="button" onclick={() => clicked(column.key)}>
                            {column.label}
                        </button>
                    {:else}
                        {column.label}
                    {/if}
                </th>
            {/each}
        </tr>
    </thead>
    <tbody>
        {#each shown as row (text(row[rowKey]))}
            <tr>
                {#each columns as column (column.key)}
                    <td
                        class:numeric={column.numeric === true}
                        class:right={column.align === 'right'}
                    >
                        {#if cell}
                            {@render cell(row, column)}
                        {:else}
                            {text(row[column.key])}
                        {/if}
                    </td>
                {/each}
            </tr>
        {/each}
    </tbody>
</table>

<style>
    table {
        width: 100%;
        border-collapse: collapse;
        font-size: var(--fs-md);
        color: var(--ink-txt, var(--ink));
    }

    /* The header stays put while the body scrolls: the scroller is the view's, and this is what
       keeps the headings on screen inside it. */
    th {
        position: sticky;
        top: 0;
        z-index: 1;
        background: var(--panel);
        border-bottom: 1px solid var(--line);
        padding: 0;
        text-align: left;
        font-size: var(--fs-xs);
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: var(--muted-txt, var(--muted));
        white-space: nowrap;
    }

    /* A sticky heading sits over the rows it labels, so it keeps a pane's fraction of the panel colour rather than going clear. */
    :global(body.wall) th {
        background: color-mix(in srgb, var(--panel) var(--wall-panel), transparent);
        backdrop-filter: blur(var(--wall-blur));
    }

    th button {
        width: 100%;
        border: none;
        background: none;
        color: inherit;
        font: inherit;
        text-align: inherit;
        padding: 5px 8px;
        cursor: pointer;
    }

    th button:hover {
        color: var(--accent-txt, var(--accent));
    }

    th button:focus-visible {
        outline: 2px solid var(--accent);
        outline-offset: -2px;
    }

    th:not(:has(button)) {
        padding: 5px 8px;
    }

    td {
        padding: 5px 8px;
        border-bottom: 1px solid var(--line);
        vertical-align: top;
    }

    tbody tr:hover td {
        background: var(--chip);
    }

    .numeric,
    .right {
        text-align: right;
    }

    .numeric {
        font-family: var(--font-num);
        font-variant-numeric: tabular-nums;
    }

    /* The terminal shape: a hairline under the heading row only, and no banding under the pointer. */
    :global(body.rice) th {
        text-transform: none;
    }

    :global(body.rice) td {
        border-bottom-style: dotted;
    }
</style>
