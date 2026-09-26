<script module lang="ts">
    // Layer 3, partial support. What one side of the merge editor is handed per conflict.
    import type { Choice, Span } from '$lib/state/sources/repositories/merge-regions';

    /** One conflict as this side draws it: where its lines are here and how it is settled. */
    export type SideConflict = { region: number; span: Span; choice: Choice };
</script>

<script lang="ts">
    // Layer 3, partial of views/sources/repositories/merge/Merge.svelte. One input of the three-way
    // merge editor, Incoming or Current: the whole version git holds for that side, its line
    // numbers down the left, each conflict's lines marked, and above each conflict the choices this
    // side offers for it (this side's lines, both with this side's first, or neither). A conflict
    // already settled says how, so the reader sees which have been handled.

    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import { linesOf } from '$lib/state/sources/repositories/merge-regions';
    import { t } from '$lib/state/shared/words/text';

    type Props = {
        /** Which input this is, which picks its words and the choices it offers. */
        side: 'incoming' | 'current';
        text: string;
        conflicts: SideConflict[];
        onchoose: (region: number, choice: Choice) => void;
    };

    let { side, text, conflicts, onchoose }: Props = $props();

    const lines = $derived(linesOf(text));

    /** The conflict whose lines start at a line, or undefined. */
    function startingAt(line: number): SideConflict | undefined {
        return conflicts.find((one) => one.span.start === line);
    }

    /** The conflict a line is inside, or undefined. */
    function inside(line: number): SideConflict | undefined {
        return conflicts.find(
            (one) => line >= one.span.start && line < one.span.start + one.span.count
        );
    }

    /** The words saying how a conflict is settled, the empty string for one still open. */
    function settledAs(choice: Choice): string {
        if (choice === 'incoming') return t('repositories.merge_took_incoming');
        if (choice === 'current') return t('repositories.merge_took_current');
        if (choice === 'both-current' || choice === 'both-incoming') {
            return t('repositories.merge_took_both');
        }
        if (choice === 'base') return t('repositories.merge_took_none');
        if (choice === 'edited') return t('repositories.merge_took_edited');
        return '';
    }
</script>

{#snippet bar(conflict: SideConflict)}
    <div class="bar" data-conflict={conflict.region} class:open={conflict.choice === 'open'}>
        {#if side === 'incoming'}
            <ToolButton
                label={t('repositories.accept_incoming')}
                onclick={() => onchoose(conflict.region, 'incoming')}
            />
            <ToolButton
                label={t('repositories.accept_both_incoming')}
                onclick={() => onchoose(conflict.region, 'both-incoming')}
            />
        {:else}
            <ToolButton
                label={t('repositories.accept_current')}
                onclick={() => onchoose(conflict.region, 'current')}
            />
            <ToolButton
                label={t('repositories.accept_both_current')}
                onclick={() => onchoose(conflict.region, 'both-current')}
            />
        {/if}
        <ToolButton
            label={t('repositories.accept_none')}
            title={t('repositories.accept_none_title')}
            onclick={() => onchoose(conflict.region, 'base')}
        />
        <span class="said">{settledAs(conflict.choice)}</span>
    </div>
{/snippet}

<section class="side" data-merge-side={side}>
    <p class="head">
        {side === 'incoming' ? t('repositories.merge_incoming') : t('repositories.merge_current')}
    </p>
    <div class="text">
        {#each lines as line, at (at)}
            {@const starts = startingAt(at)}
            {#if starts !== undefined}
                <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
                {@render bar(starts)}
            {/if}
            <div class="line" class:conflict={inside(at) !== undefined}>
                <span class="num">{at + 1}</span>
                <span class="cell">{line}</span>
            </div>
        {/each}
        {#each conflicts.filter((one) => one.span.count === 0 && one.span.start >= lines.length) as conflict (conflict.region)}
            <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
            {@render bar(conflict)}
        {/each}
    </div>
</section>

<style>
    .side {
        display: flex;
        flex-direction: column;
        min-width: 0;
        min-height: 0;
    }

    .head {
        margin: 0 0 2px;
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-xs);
        text-transform: uppercase;
    }

    .text {
        flex: 1 1 auto;
        min-height: 0;
        overflow: auto;
        border: 1px solid var(--line);
        border-radius: var(--radius-sm);
        background: var(--chip);
        font-family: var(--font-mono);
        font-size: var(--fs-sm);
        line-height: 1.45;
    }

    :global(body.wall) .text {
        background: color-mix(in srgb, var(--chip) var(--wall-panel), transparent);
    }

    .line {
        display: grid;
        grid-template-columns: 3.5em minmax(0, 1fr);
    }

    .line.conflict {
        background: var(--c-scm-conflict-bg);
    }

    .num {
        padding: 0 6px;
        color: var(--muted-txt, var(--muted));
        text-align: right;
        user-select: none;
    }

    .cell {
        white-space: pre;
    }

    .bar {
        display: flex;
        align-items: center;
        gap: 4px;
        padding: 1px 6px;
        border-top: 1px solid var(--line);
        font-family: var(--font-sans, inherit);
    }

    .bar.open {
        border-top-color: var(--c-scm-conflict);
    }

    .said {
        color: var(--muted-txt, var(--muted));
    }
</style>
