<script lang="ts">
    // Layer 3, Present partial. The general slides a deck writes in Markdown: text, one image, two
    // columns, a display equation and a code block. Each is a heading over its Markdown, drawn
    // through Words so the sanitiser and the typesetter see every field; the equation is drawn in
    // the card of Equation. Code is a fenced block, so the Markdown renderer highlights it.

    import Equation from './Equation.svelte';
    import Words from './Words.svelte';
    import { t } from '$lib/state/shared/words/text';
    import { DECK_GAP, type DeckSlide } from '$lib/state/life/present';

    type Props = {
        row: Extract<DeckSlide, { kind: 'text' | 'image' | 'columns' | 'equation' | 'code' }>;
    };

    let { row }: Props = $props();
</script>

<section class="slide" data-slide-kind={row.kind}>
    {#if row.kind !== 'text' && row.heading !== ''}
        <h3 class="headline"><Words text={row.heading} /></h3>
    {/if}
    {#if row.kind === 'text'}
        <div class="body"><Words text={row.body} block /></div>
    {:else if row.kind === 'image'}
        {#if row.src === DECK_GAP}
            <p class="gap">{t('present.figure_missing', row.alt)}</p>
        {:else if row.src !== ''}
            <img class="figure" src={row.src} alt={row.alt} />
        {/if}
    {:else if row.kind === 'columns'}
        <div class="columns">
            <div><Words text={row.left} block /></div>
            <div><Words text={row.right} block /></div>
        </div>
    {:else if row.kind === 'equation'}
        <Equation slide={{ equation: row.equation }} />
        {#if row.rest !== ''}
            <div class="body"><Words text={row.rest} block /></div>
        {/if}
    {:else}
        <div class="body"><Words text={row.code} block /></div>
    {/if}
</section>

<style>
    .headline {
        margin: 0 0 0.4em;
        font-size: var(--slide-fs-h);
        line-height: 1.15;
    }

    .body {
        font-size: var(--slide-fs-body);
        line-height: 1.45;
    }

    .figure {
        display: block;
        max-width: 100%;
        max-height: 480px;
        margin: 8px auto;
        padding: 6px;
        border: 1px solid var(--line);
        border-radius: var(--radius);
        background: var(--card);
    }

    .gap {
        margin: 8px 0;
        padding: 9px 11px;
        border: 1px dashed var(--line);
        border-radius: var(--radius-sm);
        color: var(--muted-txt, var(--muted));
        font-size: var(--slide-fs-small);
    }

    .columns {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(min(300px, 100%), 1fr));
        gap: 26px;
        font-size: var(--slide-fs-body);
        line-height: 1.45;
    }
</style>
