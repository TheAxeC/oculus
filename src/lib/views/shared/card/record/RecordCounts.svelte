<script lang="ts">
    // Layer 3, shared view. The row of count buttons a record's page draws under the record's card
    // (RecordPage.svelte beside this file): one button per row of `categories:` that holds one of
    // the record's projects, in the rows' order and "other" last, each "<n> <row label>" in the
    // row's colour as a board's section heading is; then the total, "1 project" or "<n> projects";
    // then, for a person whom projects wait on, "<n> waiting on <name>". The row is the record's
    // join of state/boards/record-board.ts (`recordRow`), which the record's board reads too.
    //
    // A press opens the record's board, one tab per record and kind of board, a second press
    // bringing that tab forward: a category's button with every slice of its projects picked on
    // the board's second line, the total and the waiting button with none, each press setting the
    // tab's whole board state so the board shows exactly the projects the button counts
    // (`pressedState`). A button is a plain press in the box PressBox.svelte draws, holding a tag,
    // as the presses of a project card are.

    import Tag from '$lib/ui/controls/Tag.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import PressBox from '../project/PressBox.svelte';
    import { projectCount } from '../card';
    import { RECORD_VIEW } from '$lib/state/boards/board';
    import {
        pressedState,
        recordTab,
        type RecordBoard,
        type RecordButton,
        type RecordRow
    } from '$lib/state/boards/record-board';
    import { t } from '$lib/state/shared/words/text';
    import { toneOf } from '$lib/state/shared/words/tones';
    import { useState } from '$lib/state/client/use';

    const {
        layout: { openView },
        ui: { instanceState, setInstanceState }
    } = useState();

    let { row }: { row: RecordRow } = $props();

    /** Open the record's board of the kind `board`, titled `label`, with `slices` picked. */
    function open(board: RecordBoard, label: string, slices: readonly string[]): void {
        const id = openView(RECORD_VIEW, recordTab(board, row.record, label));
        if (id !== '') setInstanceState(id, pressedState(instanceState(id), slices));
    }

    /** The words of a category's button. */
    function words(button: RecordButton): string {
        return t('board.record_count', String(button.count), button.label);
    }

    const projectsTitle = $derived(t('board.record_title', row.name));
</script>

<div class="row" role="group" aria-label={t('board.record_row', row.name)}>
    {#each row.buttons as button (button.key)}
        <PressBox>
            <ToolButton
                plain
                label={words(button)}
                title={t('board.record_count_tip', row.name, button.label)}
                onclick={() => open('projects', projectsTitle, button.slices)}
            >
                <Tag
                    label={words(button)}
                    tone={button.color === '' ? undefined : toneOf(button.color)}
                />
            </ToolButton>
        </PressBox>
    {/each}
    {#if row.total > 0}
        <PressBox>
            <ToolButton
                plain
                label={projectCount(row.total)}
                title={t('board.record_total_tip', row.name)}
                onclick={() => open('projects', projectsTitle, [])}
            >
                <Tag label={projectCount(row.total)} />
            </ToolButton>
        </PressBox>
    {/if}
    {#if row.waiting > 0}
        {@const waiting = t('board.record_waiting', String(row.waiting), row.name)}
        <PressBox>
            <ToolButton
                plain
                label={waiting}
                title={t('board.record_waiting_tip', row.name)}
                onclick={() => open('waiting', t('board.record_waiting_title', row.name), [])}
            >
                <Tag label={waiting} glyph="waiting" />
            </ToolButton>
        </PressBox>
    {/if}
</div>

<style>
    .row {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 6px;
    }
</style>
