<script lang="ts">
    // Layer 3, view partial of Career.svelte. One card of the career page, the strategy or one row
    // of a list of the file, as the record card (views/shared/card/record/RecordCard.svelte): its
    // title, a Tag on a row the file keeps off the CV, its labelled lines, and Edit, in the menu
    // and the strip, which opens the editor on the career file. A web address in a line is a link
    // (ui/display/text/LinkedText.svelte).

    import Tag from '$lib/ui/controls/Tag.svelte';
    import LinkedText from '$lib/ui/display/text/LinkedText.svelte';
    import RecordCard from '$lib/views/shared/card/record/RecordCard.svelte';
    import { editorAction } from '$lib/views/shared/card/record/record-menu';
    import type { CareerLine } from '$lib/state/forms/career-view';
    import { t } from '$lib/state/shared/words/text';

    type Props = {
        id: string;
        title: string;
        /** Whether the file keeps the row off the CV. */
        hidden?: boolean;
        lines: CareerLine[];
        /** Open the editor on the career file. */
        onedit: () => void;
    };

    let { id, title, hidden = false, lines, onedit }: Props = $props();
</script>

{#snippet meta()}
    {#if hidden}
        <Tag label={t('career.hidden')} />
    {/if}
{/snippet}

{#snippet shown()}
    {#if lines.length > 0}
        <dl class="lines">
            {#each lines as line, at (at)}
                <dt>{line.label}</dt>
                <dd><LinkedText text={line.text} /></dd>
            {/each}
        </dl>
    {/if}
{/snippet}

<div class="slot" data-career-card={id}>
    <RecordCard
        {id}
        cursor={false}
        {title}
        actions={[editorAction(onedit)]}
        strip={['editor']}
        {meta}
        lines={shown}
    />
</div>

<style>
    .slot {
        display: flex;
        flex-direction: column;
        min-width: 0;
    }

    /* Every line is the tree's row height, and a longer value grows by whole lines. */
    .lines {
        display: grid;
        grid-template-columns: max-content 1fr;
        column-gap: 12px;
        margin: 0;
        font-size: var(--fs-md);
        line-height: calc(var(--tree-row) * var(--text-scale, 1));
    }

    .lines dt {
        font-size: var(--fs-xs);
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: var(--muted-txt, var(--muted));
    }

    .lines dd {
        margin: 0;
        min-width: 0;
        overflow-wrap: anywhere;
    }
</style>
