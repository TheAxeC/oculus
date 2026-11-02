<script lang="ts">
    // Layer 3, view partial of TurnList.svelte. One row of a run of tool calls, muted and small:
    // the press of two or more calls, with the run's words, which says while closed whether the
    // run holds a failed call or one that has not come back, or one call. An open run's calls are
    // rows of their own (turn-rows.ts, `flatRows`), so the window holds them as it holds any row;
    // they take no space above them, so they stand together under the press. A single call is its
    // own row, with no press. The tab keeps what a press chose (tab-session.svelte.ts), since a
    // choice outlives a draw of this row and clears with the tab's target (turn-rows.ts, `runKey`).
    //
    // A call that came back draws no word; only `error` and `running` do, in one box that does not
    // shrink, so the summary alone is cut. A row draws the short name of a tool, and its title
    // holds the whole one.

    import Glyph from '$lib/ui/display/Glyph.svelte';
    import RowButton from '$lib/ui/controls/RowButton.svelte';
    import Tag from '$lib/ui/controls/Tag.svelte';
    import { clock } from '$lib/state/shared/words/format';
    import { t } from '$lib/state/shared/words/text';
    import {
        displayName,
        runHolds,
        runWords,
        toolWord,
        type CallFlat,
        type PressFlat
    } from './turn-rows';

    type Props = {
        /** The row: a run's press or one call. */
        row: PressFlat | CallFlat;
        /** A press on the run's line. */
        onpress: () => void;
    };

    let { row, onpress }: Props = $props();

    const words = $derived(row.kind === 'press' ? runWords(row.calls, t) : '');
</script>

{#snippet outcome(failed: boolean, running: boolean)}
    {#if failed || running}
        <span class="outcome">
            {#if failed}
                <Tag label={t('sessions.turn_error')} tone="red" />
            {/if}
            {#if running}
                <Tag label={t('sessions.turn_running')} />
            {/if}
        </span>
    {/if}
{/snippet}

<div class="calls">
    {#if row.kind === 'press'}
        <div class="run">
            <RowButton expanded={row.open} title={words} onclick={onpress}>
                <span class="line">
                    <span class="mark" class:open={row.open}>
                        <Glyph name="disclosure" />
                    </span>
                    <span class="ts">{clock(row.calls[0]?.at)}</span>
                    <span class="words">{words}</span>
                    {#if !row.open}
                        <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
                        {@render outcome(runHolds(row.calls, false), runHolds(row.calls, null))}
                    {/if}
                </span>
            </RowButton>
        </div>
    {:else if row.kind === 'call'}
        {@const call = row.call}
        {@const name = call.tool?.name ?? ''}
        {@const summary = call.tool?.summary ?? ''}
        <div class="line call">
            <span class="mark"></span>
            <span class="ts">{clock(call.at)}</span>
            <span class="name" title={displayName(name) === name ? undefined : name}>
                {toolWord(name, t)}
            </span>
            {#if summary !== ''}
                <span class="sum" title={summary}>{summary}</span>
            {/if}
            <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
            {@render outcome(call.tool?.ok === false, call.tool?.ok === null)}
        </div>
    {/if}
</div>

<style>
    /* Tool calls are the muted, small words of the list, held to the prose's width so an outcome
       stands near its name on a wide pane. */
    .calls {
        min-width: 0;
        max-width: 80ch;
        font-size: var(--fs-sm);
        color: var(--muted-txt, var(--muted));
    }

    /* A flex row, so the button inside takes the width and the outcome stands at its right. */
    .run {
        display: flex;
        min-width: 0;
    }

    .line {
        display: flex;
        align-items: center;
        gap: 6px;
        min-width: 0;
        min-height: calc(var(--tree-row) * var(--text-scale, 1));
        color: var(--muted-txt, var(--muted));
    }

    /* A call's row stands where the button's padding puts the words of a closed run. */
    .call {
        padding: 0 6px;
    }

    .run:hover .words {
        color: var(--ink-txt, var(--ink));
    }

    /* The disclosure's column, kept in a call's row too, so the clocks stand in one line. */
    .mark {
        display: inline-flex;
        flex: none;
        justify-content: center;
        width: var(--fs-md);
        transform: rotate(-90deg);
    }

    .mark.open {
        transform: none;
    }

    .ts {
        flex: 0 0 auto;
        font-family: var(--font-num);
    }

    .name {
        flex: 0 0 auto;
        font-family: var(--font-mono);
    }

    .sum,
    .words {
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    /* A long summary is what gives: the outcome keeps its whole words at the row's right, a failed
       and a running call together. */
    .outcome {
        display: inline-flex;
        flex: none;
        gap: 6px;
        margin-left: auto;
    }
</style>
