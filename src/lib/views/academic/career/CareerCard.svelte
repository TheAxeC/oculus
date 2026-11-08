<script module lang="ts">
    // Layer 3, view partial of Career.svelte. What a card's line may be marked as, beside the words
    // state/forms/career-view.ts gives every line.
    import type { CareerLine } from '$lib/state/forms/career-view';

    /** One labelled line of a card: `long` marks a field written line by line. */
    export type CardLine = CareerLine & { long?: boolean };
</script>

<script lang="ts">
    // Layer 3, view partial of Career.svelte. One card of the career page, the strategy or one row
    // of a list of the file, as the record card (views/shared/card/record/RecordCard.svelte): its
    // title, a Tag on a row the file keeps off the CV, its labelled lines, and Edit, in the menu
    // and the strip, which opens the editor on the career file. A web address in a line is a link
    // (ui/display/text/LinkedText.svelte); a line marked long is its Markdown
    // (views/shared/card/text/FieldMarkdown.svelte). The page hands it its bar's hue and whether it
    // holds the keyboard cursor. The Tag is the only thing its meta row draws at rest, so a card
    // with none has its controls over its top right corner (ui/frame/card/Card.svelte).

    import Tag from '$lib/ui/controls/Tag.svelte';
    import LinkedText from '$lib/ui/display/text/LinkedText.svelte';
    import FieldMarkdown from '$lib/views/shared/card/text/FieldMarkdown.svelte';
    import RecordCard from '$lib/views/shared/card/record/RecordCard.svelte';
    import { editorAction } from '$lib/views/shared/card/record/record-menu';
    import { t } from '$lib/state/shared/words/text';

    type Props = {
        id: string;
        /** Whether this card is the instance's current keyboard cursor. */
        cursor: boolean;
        title: string;
        /** The hue name of the card's bar (state/forms/career-view.ts). */
        tone: string;
        /** Whether the file keeps the row off the CV. */
        hidden?: boolean;
        lines: CardLine[];
        /** Open the editor on the career file. */
        onedit: () => void;
    };

    let { id, cursor, title, tone, hidden = false, lines, onedit }: Props = $props();
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
                <dd>
                    {#if line.long === true}
                        <FieldMarkdown text={line.text} />
                    {:else}
                        <LinkedText text={line.text} />
                    {/if}
                </dd>
            {/each}
        </dl>
    {/if}
{/snippet}

<div class="slot" data-career-card={id}>
    <RecordCard
        {id}
        {cursor}
        {title}
        {tone}
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
