<script lang="ts">
    // Layer 3, Present partial. The idea-grid slide: one card per direction, its maturity as the
    // chip on the head of the card.

    import Dot from './Dot.svelte';
    import Words from './Words.svelte';
    import type { DeckIdeas } from '$lib/state/life/present';

    type Props = { ideas: DeckIdeas };

    let { ideas }: Props = $props();
</script>

<section class="slide" data-slide-kind="ideas">
    {#if ideas.title !== undefined}
        <h3 class="headline"><Words text={ideas.title} /></h3>
    {/if}
    {#if ideas.lede !== undefined}
        <p class="lede"><Words text={ideas.lede} /></p>
    {/if}
    <div class="grid">
        {#each ideas.items as item, at (`${at}:${item.title ?? ''}`)}
            <div class="idea">
                <div class="head">
                    <Dot tone={item.tone} />
                    <b><Words text={item.title ?? ''} /></b>
                    {#if item.maturity !== undefined}
                        <span class="maturity">{item.maturity}</span>
                    {/if}
                </div>
                <p><Words text={item.desc ?? ''} /></p>
            </div>
        {/each}
    </div>
    {#if ideas.hint !== undefined}
        <p class="hint"><Words text={ideas.hint} /></p>
    {/if}
</section>

<style>
    .headline {
        margin: 0 0 0.3em;
        font-size: var(--fs-2xl);
        line-height: 1.15;
    }

    .lede {
        max-width: 80ch;
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-xl);
    }

    .grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
        gap: 12px;
        margin-top: 14px;
    }

    .idea {
        padding: 13px 14px;
        border: 1px solid var(--line);
        border-radius: var(--radius);
        background: var(--card);
    }

    .idea p {
        margin: 0;
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-md);
        line-height: 1.42;
    }

    .head {
        display: flex;
        align-items: center;
        gap: 7px;
        margin-bottom: 5px;
    }

    .head b {
        flex: 1;
        font-size: var(--fs-lg);
        line-height: 1.2;
    }

    .maturity {
        padding: 2px 7px;
        border: 1px solid var(--line);
        border-radius: var(--radius-pill);
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-xxs);
        font-weight: 700;
        letter-spacing: 0.06em;
        text-transform: uppercase;
    }

    .hint {
        margin-top: 1.5em;
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-sm);
    }

    /* Over a wallpaper the surface goes translucent, as every other card surface does. */
    :global(body.wall) .idea {
        background: color-mix(in srgb, var(--card) var(--wall-panel), transparent);
        backdrop-filter: blur(var(--wall-blur));
    }
</style>
