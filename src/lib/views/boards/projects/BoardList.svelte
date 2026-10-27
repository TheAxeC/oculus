<script lang="ts">
    // Layer 3, view partial of views/boards/projects/Projects.svelte. One section of a project
    // board's list: a table of its projects, one row each, under the section's heading, which the
    // board draws. Its columns are the cells of the board's list the Columns menu draws
    // (state/boards/board/filter-menu.ts, `listCells`): Project, the stage as a chip in the stage's
    // colour with its words cut at the first " (", the venue, the Focus lane, the first sentence of
    // `next`, "with" and the team without the user, the domain, the pillars and the funding.
    //
    // Every row is one line high: a cell's text does not wrap and is cut with an ellipsis at the
    // cell's edge, its whole text in its tip. Nothing scrolls sideways: each column counts at a
    // minimum width (`MIN_WIDTH`), and the columns that do not fit in the list's width, read from
    // its box as it resizes, are dropped from the right until the rest fit, Project kept always;
    // the columns drawn share the width in proportion to their minimums. The table's header row
    // scrolls with its rows: its box clips the table, so the header, which the table draws sticky,
    // has nothing to stick to, and the section's heading is the one that stays at the pane's top.
    //
    // A web address written in a cell, the next line's among them, is a link
    // (ui/display/text/LinkedText.svelte).

    import Chip from '$lib/ui/controls/Chip.svelte';
    import LinkedText from '$lib/ui/display/text/LinkedText.svelte';
    import Table from '$lib/ui/display/table/Table.svelte';
    import {
        type Column,
        type ListedColumn,
        cellText,
        fittedColumns
    } from '$lib/ui/display/table/table-rows';
    import { firstSentence, shortWords, type BoardItem } from '$lib/state/boards/board';
    import { projectLane } from '$lib/state/boards/focus';
    import { rootOf } from '$lib/state/shared/page/hubs';
    import { t } from '$lib/state/shared/words/text';
    import { stageLabel, stageTone, vocabOf } from '$lib/state/shared/words/tones';

    type Props = {
        /** The section's projects, in the order drawn. */
        items: BoardItem[];
        /** The cells the Columns menu draws, in its order. */
        cells: ListedColumn[];
        /** The words a row's Project cell reads: the short handle or the full title. */
        label: (item: BoardItem) => string;
    };

    let { items, cells, label }: Props = $props();

    /** The narrowest a column is drawn, in pixels, by cell: Project, Next, and every other one. */
    const MIN_WIDTH: Record<string, number> = { title: 160, next: 200 };
    const MIN_OTHER = 90;

    /** The list's width, 0 until it is laid out. */
    let width = $state(0);

    function least(key: string): number {
        return MIN_WIDTH[key] ?? MIN_OTHER;
    }

    /** The columns drawn: the cells the menu draws that fit, Project always (`fittedColumns`). */
    const columns: Column[] = $derived(fittedColumns(cells, width, least, 'title'));

    const rows = $derived(items.map(row));

    /** One row: the words of each cell, and the stage's hue and whole label for its chip. */
    function row(item: BoardItem): Record<string, unknown> {
        const hub = rootOf(item.project);
        const next = item.project.next;
        const stage = item.project.stage === undefined ? '' : stageLabel(item.project.stage, hub);
        return {
            id: item.id,
            title: label(item),
            stage: shortWords(stage),
            stageTip: stage,
            stageTone: stageTone(item.project.stage, hub),
            venue: item.venue?.short ?? '',
            lane: projectLane(item.project, vocabOf)?.label ?? '',
            next: next === undefined ? '' : firstSentence(next, Number.POSITIVE_INFINITY),
            with: item.teamLine === '' ? '' : t('board.with', item.teamLine),
            domain: item.domain?.label ?? '',
            pillar: item.pillars.map((tag) => tag.label).join(' | '),
            funding: item.funding.map((tag) => tag.label).join(' | ')
        };
    }
</script>

{#snippet cell(row: Record<string, unknown>, column: Column)}
    {#if column.key === 'stage' && cellText(row.stage) !== ''}
        <span class="cut" title={cellText(row.stageTip)}>
            <Chip label={cellText(row.stage)} tone={cellText(row.stageTone)} filled />
        </span>
    {:else}
        <span class="cut" title={cellText(row[column.key])}>
            <LinkedText text={cellText(row[column.key])} />
        </span>
    {/if}
{/snippet}

<div class="list" bind:clientWidth={width}>
    <Table {columns} {rows} rowKey="id" sortable {cell} />
</div>

<style>
    /* The table's box: as wide as the section, and clipping, so the table never scrolls sideways
       and its header row scrolls with it. */
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
</style>
