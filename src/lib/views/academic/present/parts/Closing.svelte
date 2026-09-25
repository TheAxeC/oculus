<script lang="ts">
    // Layer 3, Present partial. The deck's closing slide, the opening slide's shape with the
    // closing words and the contact line in place of the legend.

    import Words from './Words.svelte';
    import type { DeckMeta } from '$lib/state/life/present';

    type Props = { meta: DeckMeta };

    let { meta }: Props = $props();
</script>

<section class="slide" data-slide-kind="closing">
    {#if meta.closingKicker !== undefined}
        <div class="kicker"><Words text={meta.closingKicker} /></div>
    {/if}
    {#if meta.closingTitleHtml !== undefined}
        <h3 class="headline"><Words text={meta.closingTitleHtml} /></h3>
    {/if}
    {#if meta.closingLede !== undefined}
        <p class="lede"><Words text={meta.closingLede} /></p>
    {/if}
    {#if meta.contact !== undefined}
        <p class="hint"><Words text={meta.contact} /></p>
    {/if}
</section>

<style>
    .slide {
        display: flex;
        flex-direction: column;
        justify-content: center;
        min-height: 100%;
    }

    .kicker {
        color: var(--accent-txt, var(--accent));
        font-size: var(--fs-sm);
        font-weight: 700;
        letter-spacing: 0.12em;
        text-transform: uppercase;
    }

    .headline {
        margin: 0.2em 0;
        font-size: var(--fs-3xl);
        letter-spacing: -0.02em;
        line-height: 1.05;
    }

    .lede {
        max-width: 70ch;
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-xl);
    }

    .hint {
        margin-top: 1.5em;
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-sm);
    }
</style>
