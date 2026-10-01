<script module lang="ts">
    // Layer 3, partial support. What one side of the merge editor is handed per conflict.
    import type { Choice, Span } from '$lib/state/sources/repositories/merge-regions';

    /** One conflict as this side draws it: where its lines are here and how it is settled. */
    export type SideConflict = { region: number; span: Span; choice: Choice };
</script>

<script lang="ts">
    // Layer 3, partial of views/sources/repositories/merge/Merge.svelte. One input of the three-way
    // merge editor, Incoming or Current: the whole version git holds for that side in a read-only
    // Monaco editor (ui/controls/editor/Editor.svelte), each conflict's lines tinted, and above
    // each conflict a bar with the choices this side offers for it (this side's lines, both with
    // this side's first, or neither). A conflict with no lines on this side draws its bar where its
    // lines would sit and tints none. A conflict already settled says how, so the reader sees which
    // have been handled.

    import Editor from '$lib/ui/controls/editor/Editor.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import { t } from '$lib/state/shared/words/text';

    type Props = {
        /** Which input this is, which picks its words and the choices it offers. */
        side: 'incoming' | 'current';
        text: string;
        conflicts: SideConflict[];
        /** A name unique to the pane instance and this side, which names the editor's model. */
        model: string;
        path: string;
        language: string;
        look: string;
        codeTheme: string;
        onchoose: (region: number, choice: Choice) => void;
    };

    let { side, text, conflicts, model, path, language, look, codeTheme, onchoose }: Props =
        $props();

    /** Each conflict's bar, above its first line here (a span counts lines from 0). */
    const bars = $derived(
        conflicts.map((one) => ({ id: String(one.region), after: one.span.start }))
    );
    const highlights = $derived(
        conflicts
            .filter((one) => one.span.count > 0)
            .map((one) => ({ line: one.span.start + 1, count: one.span.count }))
    );

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

{#snippet conflictBar(id: string)}
    {@const conflict = conflicts.find((one) => String(one.region) === id)}
    {#if conflict !== undefined}
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
    {/if}
{/snippet}

<section class="side" data-merge-side={side}>
    <p class="head">
        {side === 'incoming' ? t('repositories.merge_incoming') : t('repositories.merge_current')}
    </p>
    <div class="text">
        <Editor
            {text}
            {language}
            writable={false}
            {model}
            {path}
            {look}
            {codeTheme}
            {highlights}
            {bars}
            bar={conflictBar}
        />
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
        border: 1px solid var(--line);
        border-radius: var(--radius-sm);
        overflow: hidden;
    }

    .bar {
        display: flex;
        align-items: center;
        gap: 4px;
        padding: 1px 6px;
        border-top: 1px solid var(--line);
        background: var(--chip);
        white-space: nowrap;
    }

    .bar.open {
        border-top-color: var(--c-scm-conflict);
    }

    .said {
        color: var(--muted-txt, var(--muted));
    }

    :global(body.wall) .bar {
        background: var(--chip-on-wall);
    }
</style>
