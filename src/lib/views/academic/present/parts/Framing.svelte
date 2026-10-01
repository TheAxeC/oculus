<script lang="ts">
    // Layer 3, Present partial. A section slide: a heading and a lede, with the three cards, the
    // legend and the hint the deck may give it.

    import Legend from './Legend.svelte';
    import Words from './Words.svelte';
    import type { DeckFraming } from '$lib/state/life/present';

    type Props = { framing: DeckFraming };

    let { framing }: Props = $props();
</script>

<section class="slide" data-slide-kind="framing">
    {#if framing.title !== undefined}
        <h3 class="headline"><Words text={framing.title} /></h3>
    {/if}
    {#if framing.lede !== undefined}
        <p class="lede"><Words text={framing.lede} /></p>
    {/if}
    {#if framing.cards.length > 0}
        <div class="cards">
            {#each framing.cards as card, at (`${at}:${card.title ?? ''}`)}
                <div class="card">
                    {#if card.n !== undefined}
                        <div class="n"><Words text={card.n} /></div>
                    {/if}
                    {#if card.title !== undefined}
                        <b><Words text={card.title} /></b>
                    {/if}
                    {#if card.body !== undefined}
                        <p><Words text={card.body} /></p>
                    {/if}
                </div>
            {/each}
        </div>
    {/if}
    <Legend chips={framing.legend} />
    {#if framing.hint !== undefined}
        <p class="hint"><Words text={framing.hint} /></p>
    {/if}
</section>

<style>
    .headline {
        margin: 0 0 0.3em;
        font-size: var(--fs-2xl);
        line-height: 1.15;
    }

    .lede {
        max-width: 74ch;
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-xl);
    }

    .cards {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(min(220px, 100%), 1fr));
        gap: 14px;
        margin: 22px 0;
    }

    .card {
        padding: 16px;
        border: 1px solid var(--line);
        border-radius: var(--radius);
        background: var(--card);
        font-size: var(--fs-md);
        line-height: 1.45;
    }

    .card p {
        margin: 0.3em 0 0;
    }

    .n {
        margin-bottom: 8px;
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-2xl);
        font-weight: 800;
    }

    .hint {
        margin-top: 1.5em;
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-sm);
    }

    /* Over a wallpaper the surface goes translucent, as every other card surface does. */
    :global(body.wall) .card {
        background: color-mix(in srgb, var(--card) var(--wall-panel), transparent);
        backdrop-filter: blur(var(--wall-blur));
    }
</style>
