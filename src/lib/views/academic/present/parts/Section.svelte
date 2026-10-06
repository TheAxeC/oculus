<script lang="ts">
    // Layer 3, Present partial. A section slide: a heading and a lede, the numbered cards, the
    // legend of the group the slide names and the foot line.

    import Legend from './Legend.svelte';
    import Words from './Words.svelte';
    import type { DeckCard } from '$lib/state/life/present';

    type Props = {
        heading: string;
        lede: string;
        cards: DeckCard[];
        foot: string;
        /** The domain keys the legend shows. */
        legend: string[];
    };

    let { heading, lede, cards, foot, legend }: Props = $props();
</script>

<section class="slide" data-slide-kind="section">
    {#if heading !== ''}
        <h3 class="headline"><Words text={heading} /></h3>
    {/if}
    {#if lede !== ''}
        <div class="lede"><Words text={lede} block /></div>
    {/if}
    {#if cards.length > 0}
        <div class="cards">
            {#each cards as card, at (`${at}:${card.title}`)}
                <div class="card">
                    {#if card.n !== ''}
                        <div class="n"><Words text={card.n} /></div>
                    {/if}
                    {#if card.title !== ''}
                        <b><Words text={card.title} /></b>
                    {/if}
                    {#if card.body !== ''}
                        <p><Words text={card.body} /></p>
                    {/if}
                </div>
            {/each}
        </div>
    {/if}
    <Legend domains={legend} />
    {#if foot !== ''}
        <p class="hint"><Words text={foot} /></p>
    {/if}
</section>

<style>
    .headline {
        margin: 0 0 0.3em;
        font-size: var(--slide-fs-h);
        line-height: 1.15;
    }

    .lede {
        color: var(--muted-txt, var(--muted));
        font-size: var(--slide-fs-sub);
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
        font-size: var(--slide-fs-small);
        line-height: 1.45;
    }

    .card p {
        margin: 0.3em 0 0;
    }

    .n {
        margin-bottom: 8px;
        color: var(--muted-txt, var(--muted));
        font-size: var(--slide-fs-h);
        font-weight: 800;
    }

    .hint {
        margin-top: 1.5em;
        color: var(--muted-txt, var(--muted));
        font-size: var(--slide-fs-small);
    }

    /* Over a wallpaper the surface goes translucent, as every other card surface does. */
    :global(body.wall) .card {
        background: color-mix(in srgb, var(--card) var(--wall-panel), transparent);
        backdrop-filter: blur(var(--wall-blur));
    }
</style>
