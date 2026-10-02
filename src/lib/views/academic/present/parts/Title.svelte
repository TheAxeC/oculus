<script lang="ts">
    // Layer 3, Present partial. The deck's opening slide: the kicker, the headline, the lede, the
    // legend and the hint that says how to move through the deck.

    import Legend from './Legend.svelte';
    import Words from './Words.svelte';
    import type { DeckMeta } from '$lib/state/life/present';

    type Props = { meta: DeckMeta };

    let { meta }: Props = $props();
</script>

<section class="slide" data-slide-kind="title">
    {#if meta.kicker !== undefined}
        <div class="kicker"><Words text={meta.kicker} /></div>
    {/if}
    {#if meta.titleHtml !== undefined}
        <h3 class="headline"><Words text={meta.titleHtml} /></h3>
    {/if}
    {#if meta.lede !== undefined}
        <p class="lede"><Words text={meta.lede} /></p>
    {/if}
    <Legend chips={meta.legend} />
    {#if meta.hint !== undefined}
        <p class="hint"><Words text={meta.hint} /></p>
    {/if}
</section>

<style>
    .slide {
        display: flex;
        flex: 1 0 auto;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        text-align: center;
    }

    .kicker {
        color: var(--accent-txt, var(--accent));
        font-size: var(--slide-fs-small);
        font-weight: 700;
        letter-spacing: 0.12em;
        text-transform: uppercase;
    }

    .headline {
        margin: 0.2em 0;
        font-size: var(--slide-fs-title);
        letter-spacing: -0.02em;
        line-height: 1.05;
    }

    .lede {
        color: var(--muted-txt, var(--muted));
        font-size: var(--slide-fs-sub);
    }

    .hint {
        margin-top: 1.5em;
        color: var(--muted-txt, var(--muted));
        font-size: var(--slide-fs-small);
    }
</style>
