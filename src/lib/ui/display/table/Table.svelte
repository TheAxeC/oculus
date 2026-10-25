<script lang="ts">
    // Layer 3, primitive. A table of rows the caller has already joined and filtered. It holds one
    // thing of its own, which column it is sorted by: the order is a property of this table on this
    // screen and not of the data, so two tables over the same rows sort apart.
    //
    // A cell is the value as text unless the caller passes the `cell` snippet, which is how a
    // column of chips or of links is drawn without this component learning what either is.

    import { type Column, type Sort, cellText, order } from '$lib/ui/display/table/table-rows';
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
        /**
         * Every table's header row is sticky: it stays at the top of the box that scrolls the
         * table up and down, and scrolls away with its rows inside a box that never scrolls up or
         * down. `stays` sets the grounds over a wallpaper of a table whose header row stays over
         * its rows while they scroll under it (Problems, Gallery): the header row and the rows
         * paint the panel at the wallpaper's opacity with the wallpaper's blur behind them, the
         * rows painting nothing inside a surface. Without it, the header row over a wallpaper
         * paints nothing.
         */
        stays?: boolean;
    };

    let { columns, rows, rowKey, cell, sortable = false, stays = false }: Props = $props();

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
        if (!sortable || sort?.key !== key) return 'none';
        return sort.direction === 'asc' ? 'ascending' : 'descending';
    }
</script>

<table class:stays>
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
        {#each shown as row (cellText(row[rowKey]))}
            <tr>
                {#each columns as column (column.key)}
                    <td
                        class:numeric={column.numeric === true}
                        class:right={column.align === 'right'}
                    >
                        {#if cell}
                            {@render cell(row, column)}
                        {:else}
                            {cellText(row[column.key])}
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
        line-height: calc(var(--button-line) * var(--text-scale, 1));
        text-align: left;
        font-size: var(--fs-xs);
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: var(--muted-txt, var(--muted));
        white-space: nowrap;
    }

    /* Over a wallpaper the table is read off the surface it sits on (a tinted box, a `Surface`, a
       slide's frame), so its header row paints nothing. A header row that stays over its rows
       while they scroll under it (`stays`) is the strip of `tokens.css` that keeps a mix of its
       own, the panel at the wallpaper's opacity, so the rows do not read through its words. Its
       rows then carry the same surface wherever nothing under the table paints one, so the
       header row is never a second layer over a surface behind it; inside a surface they paint
       nothing. */
    :global(body.wall) th {
        background: transparent;
    }

    :global(body.wall) .stays th {
        background: var(--panel-on-wall);
        backdrop-filter: blur(var(--wall-blur));
    }

    :global(body.wall) .stays tbody tr:not(:hover) td {
        background: var(--panel-on-wall);
        backdrop-filter: blur(var(--wall-blur));
    }

    :global(body.wall [data-surface]) .stays tbody tr:not(:hover) td {
        background: transparent;
        backdrop-filter: none;
    }

    th button {
        width: 100%;
        border: none;
        background: none;
        color: inherit;
        font: inherit;
        text-align: inherit;
        padding: 3px 8px 2px;
        cursor: pointer;
    }

    th button:hover {
        color: var(--accent-txt, var(--accent));
    }

    th button:focus-visible {
        outline: 1px solid var(--accent);
        outline-offset: -1px;
    }

    th:not(:has(button)) {
        padding: 3px 8px 2px;
    }

    td {
        padding: 3px 8px 2px;
        line-height: calc(var(--button-line) * var(--text-scale, 1));
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

    /* The terminal shape: a hairline under the heading row only, and no banding under the
       pointer. */
    :global(body.rice) th {
        text-transform: none;
    }

    :global(body.rice) td {
        border-bottom-style: dotted;
    }
</style>
