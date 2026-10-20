<script lang="ts">
    // Layer 3, Present partial. The idea cards of the grid slide, one per member of a group, with
    // the legend of the maturity chips the group looks for and the foot line, and the one card of
    // an `idea` slide, which is the same card alone. A card is the project's name with its domain's
    // dot, its maturity chip and one line of what the idea is; the dot's hue and the maturity's
    // words come from config/catalogs/vocab.yml.

    import Dot from './Dot.svelte';
    import Legend from './Legend.svelte';
    import Words from './Words.svelte';
    import { chipLabel, domainTone } from '$lib/state/shared/words/tones';
    import type { DeckIdeaCard } from '$lib/state/life/present';

    type Props = {
        /** `grid` for the grid slide, `idea` for the slide of one card. */
        kind: 'grid' | 'idea';
        heading?: string;
        lede?: string;
        cards: DeckIdeaCard[];
        foot?: string;
        /** The status chips the group looks for. */
        legend?: string[];
    };

    let { kind, heading = '', lede = '', cards, foot = '', legend = [] }: Props = $props();
</script>

<section class="slide" data-slide-kind={kind}>
    {#if heading !== ''}
        <h3 class="headline"><Words text={heading} /></h3>
    {/if}
    {#if lede !== ''}
        <div class="lede"><Words text={lede} block /></div>
    {/if}
    <div class="grid">
        {#each cards as card, at (`${at}:${card.name}`)}
            <div class="idea" data-idea={card.name}>
                <div class="head">
                    <Dot tone={card.domain === undefined ? undefined : domainTone(card.domain)} />
                    <b><Words text={card.name} /></b>
                    {#if card.maturity !== undefined}
                        <span class="maturity">{chipLabel(card.maturity)}</span>
                    {/if}
                </div>
                <div class="desc"><Words text={card.desc} block /></div>
            </div>
        {/each}
    </div>
    <Legend statuses={legend} />
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

    .grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(min(230px, 100%), 1fr));
        gap: 12px;
        margin-top: 14px;
    }

    .hint {
        margin-top: 1.5em;
        color: var(--muted-txt, var(--muted));
        font-size: var(--slide-fs-small);
    }

    .idea {
        padding: 13px 14px;
        border: 1px solid var(--line);
        border-radius: var(--radius);
        background: var(--card);
    }

    .desc {
        color: var(--muted-txt, var(--muted));
        font-size: var(--slide-fs-small);
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
        font-size: var(--slide-fs-small);
        font-weight: 600;
        line-height: 1.2;
    }

    .maturity {
        padding: 2px 7px;
        border: 1px solid var(--line);
        border-radius: var(--radius-pill);
        color: var(--muted-txt, var(--muted));
        font-size: var(--slide-fs-small);
        font-weight: 700;
        letter-spacing: 0.06em;
        text-transform: uppercase;
    }

    /* Over a wallpaper the surface goes translucent, as every other card surface does; inside the
       slide's frame (screen/Stage.svelte), the one translucent layer, it paints nothing. */
    :global(body.wall) .idea {
        background: color-mix(in srgb, var(--card) var(--wall-panel), transparent);
        backdrop-filter: blur(var(--wall-blur));
    }

    :global(body.wall [data-surface]) .idea {
        background: transparent;
        backdrop-filter: none;
    }
</style>
