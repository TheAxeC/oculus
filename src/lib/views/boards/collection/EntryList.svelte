<script lang="ts">
    // Layer 3, view partial of views/boards/collection/Collection.svelte. A collection's list: one
    // table of the entries the bar keeps, one row each, its columns those the Columns menu draws
    // (state/boards/collection/ `entryColumns`): the title, always drawn, which opens the entry's
    // page as a card's title does, then one column per field of the schemas. A cell holds the
    // field's words: an option by its label, a list joined by ", ", a person by name where the
    // people registry holds the key (state/boards/person.ts `personName`), and its key otherwise.
    //
    // It is laid out as a project board's list is (views/boards/projects/BoardList.svelte): every
    // row is one line high, a cell's text cut at the cell's edge with its whole text in its tip,
    // and the columns that do not fit in the list's width, read from its box as it resizes, dropped
    // from the right until the rest fit, the title kept always. The palette's reveal scrolls the
    // entry's row into view and marks its title as a revealed card is marked
    // (views/shared/card/Reveal.svelte).

    import RowButton from '$lib/ui/controls/RowButton.svelte';
    import Table from '$lib/ui/display/table/Table.svelte';
    import {
        type Column,
        type ListedColumn,
        cellText,
        fittedColumns
    } from '$lib/ui/display/table/table-rows';
    import Reveal from '../../shared/card/Reveal.svelte';
    import {
        TITLE_COLUMN,
        fieldWords,
        optionLabel,
        type Entry,
        type SchemaField
    } from '$lib/state/boards/collection';
    import { personName } from '$lib/state/boards/person';
    import { holdersOf, resolvedId, rootOf } from '$lib/state/shared/page/hubs';
    import { useState } from '$lib/state/client/use';

    type Props = {
        /** The entries kept, in the order drawn, each with its own file's schema. */
        rows: { entry: Entry; schema: SchemaField[] | undefined }[];
        /** The columns the Columns menu lists, in its order. */
        columns: ListedColumn[];
        /** Open one entry's page. */
        onpage: (entry: Entry) => void;
        /** The palette destination, and its clearing once the row is revealed. */
        reveal?: string;
        onrevealed: () => void;
    };

    let { rows, columns: cells, onpage, reveal, onrevealed }: Props = $props();

    const {
        entities: { portfolio },
        selectors: { namesPeople }
    } = useState();

    /** The narrowest a column is drawn, in pixels: the title, and every other one. */
    const MIN_TITLE = 160;
    const MIN_OTHER = 90;

    /** The list's width, 0 until it is laid out. */
    let width = $state(0);

    function least(key: string): number {
        return key === TITLE_COLUMN ? MIN_TITLE : MIN_OTHER;
    }

    /** The columns drawn: those the menu draws that fit, the title always (`fittedColumns`). */
    const columns: Column[] = $derived(fittedColumns(cells, width, least, TITLE_COLUMN));

    const holders = $derived(holdersOf(Object.values(portfolio()?.entities.people ?? {})));
    const byId = $derived(new Map(rows.map((one) => [one.entry.id, one.entry])));
    const table = $derived(rows.map(row));

    /** Whether a field's `foreign_key` names the people registry of the entry's hub. */
    function picksPeople(field: SchemaField, root: string): boolean {
        const keys = Array.isArray(field.foreign_key) ? field.foreign_key : [];
        return keys.some((target) => namesPeople(target, root === '' ? undefined : root));
    }

    /** One value of a field as its words: a person by name, an option by its label. */
    function valueWords(field: SchemaField, value: string, root: string): string {
        if (!picksPeople(field, root)) return optionLabel(field, value);
        const id = resolvedId(holders, root, value);
        return id === null ? value : personName(portfolio(), id);
    }

    /**
     * One row: the entry's id, its title and the words of each field the schema names, each value
     * the field holds (`fieldWords`, as the bar counts them) in its words, joined by ", ".
     */
    function row(one: {
        entry: Entry;
        schema: SchemaField[] | undefined;
    }): Record<string, unknown> {
        const { entry, schema } = one;
        const words: Record<string, unknown> = {
            id: entry.id,
            [TITLE_COLUMN]: entry.title === '' ? entry.id : entry.title
        };
        for (const field of schema ?? []) {
            if (cells.some((cell) => cell.key === field.field)) {
                words[field.field] = fieldWords(entry.fields[field.field])
                    .map((value) => valueWords(field, value, rootOf(entry)))
                    .join(', ');
            }
        }
        return words;
    }
</script>

{#snippet cell(row: Record<string, unknown>, column: Column)}
    {#if column.key === TITLE_COLUMN}
        {@const entry = byId.get(cellText(row.id))}
        <Reveal id={cellText(row.id)} wanted={reveal} {onrevealed}>
            <span class="cut" title={cellText(row[column.key])}>
                <RowButton onclick={() => entry !== undefined && onpage(entry)}>
                    <span class="title">{cellText(row[column.key])}</span>
                </RowButton>
            </span>
        </Reveal>
    {:else}
        <span class="cut" title={cellText(row[column.key])}>{cellText(row[column.key])}</span>
    {/if}
{/snippet}

<div class="list" bind:clientWidth={width}>
    <Table {columns} rows={table} rowKey="id" sortable {cell} />
</div>

<style>
    /* The table's box: as wide as the view, and clipping, so the table never scrolls sideways and
       its header row scrolls with it. */
    .list {
        min-width: 0;
        overflow: hidden;
    }

    /* A cell's words on one line, cut at the cell's edge. Its width of nothing gives the column
       none of the text's width, so the columns keep the widths the list gives them, and its
       minimum of the whole cell lets it fill the cell. */
    .cut {
        display: block;
        width: 0;
        min-width: 100%;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
    }

    /* The title reads as the link a card's title is. */
    .title {
        color: var(--accent-txt, var(--accent));
    }
</style>
