<script lang="ts">
    // Layer 3, Pillars partial. One registry line as the record card
    // (views/shared/card/record/RecordCard.svelte): the tag counting its projects, its portfolio
    // metrics, its registry prose, and the strip of its projects at the foot. Its heading and the
    // strip's Page open the line's page; the menu holds Page, the Add run, Edit in File and Delete
    // (views/shared/forms/registry/registry-card.svelte.ts). The metrics row is one Tooltip that
    // says what its counts count, in the tab order so the keyboard reaches the words as the pointer
    // does.

    import Tag from '$lib/ui/controls/Tag.svelte';
    import Tooltip from '$lib/ui/menu/Tooltip.svelte';
    import Glyph from '$lib/ui/display/Glyph.svelte';
    import RecordCard from '$lib/views/shared/card/record/RecordCard.svelte';
    import {
        createRegistryCard,
        type RegistryCardProps
    } from '$lib/views/shared/forms/registry/registry-card.svelte';
    import { projectCount } from '$lib/views/shared/card/card';
    import { inlineMarkdown } from '$lib/ui/html';
    import { createCardMath } from '$lib/views/shared/latex/card-math.svelte';
    import {
        inFlight,
        isDormant,
        tierStrip,
        type Pillar,
        type TierRow,
        type Venue
    } from '$lib/state/boards/structure/lines';
    import { paletteTone, toneOf, vocabOf } from '$lib/state/shared/words/tones';
    import { rootOf } from '$lib/state/shared/page/hubs';
    import { optionalText } from '$lib/data/shapes/shapes';
    import { t } from '$lib/state/shared/words/text';
    import { useState } from '$lib/state/client/use';

    type Props = RegistryCardProps & {
        line: Pillar;
        venues: Venue[];
        tiers: TierRow[];
        muted?: boolean;
    };

    let {
        line,
        cursor,
        projects,
        venues,
        tiers,
        entry,
        schema,
        muted = false,
        file,
        fault,
        onsaid
    }: Props = $props();

    /** How this component's Markdown fields draw their formulas, once KaTeX is in. */
    const cardMath = createCardMath();
    const client = useState();
    const {
        selectors: { configMap, registryKey }
    } = client;
    const flight = $derived(inFlight(projects, configMap(), vocabOf));
    const strip = $derived(tierStrip(projects, venues, tiers, configMap(), vocabOf));
    const funding = $derived(optionalText(entry?.fields.funding));
    const tone = $derived(
        line.color === undefined ? undefined : paletteTone(line.color, rootOf(line))
    );

    /** The key the line's hub gives the pillars registry, which its page and writes name. */
    const collection = $derived(registryKey('pillars', rootOf(line)));

    const card = createRegistryCard(client, () => ({
        file,
        entry,
        schema,
        fault,
        onsaid,
        collection,
        title: line.title
    }));
</script>

{#snippet meta()}
    <Tag label={projectCount(projects.length)} />
{/snippet}

{#snippet facts()}
    {#if !muted}
        <Tooltip text={t('pillars.counts_tip')} focusable>
            <div class="metrics">
                <strong>{flight.length} {t('pillars.in_flight')}</strong>
                <span class="total">{projects.length} {t('pillars.total')}</span>
                {#each strip as tier (tier.key)}
                    <Tag
                        label={`${tier.count} ${tier.label}`}
                        tone={tier.color === undefined ? undefined : toneOf(tier.color)}
                    />
                {/each}
            </div>
        </Tooltip>
    {/if}
{/snippet}

{#snippet text()}
    {#if line.goal}
        <!-- eslint-disable-next-line svelte/no-at-html-tags -- inline Markdown sanitises what it renders -->
        <p class="goal">{@html inlineMarkdown(line.goal, cardMath(line.goal))}</p>
    {/if}
    {#if funding}
        <p class="funding">
            <Glyph name="funding" />
            <!-- eslint-disable-next-line svelte/no-at-html-tags -- inline Markdown sanitises what it renders -->
            {@html inlineMarkdown(funding, cardMath(funding))}
        </p>
    {/if}
    {#if line.blurb}
        <!-- eslint-disable-next-line svelte/no-at-html-tags -- inline Markdown sanitises what it renders -->
        <p class="blurb">{@html inlineMarkdown(line.blurb, cardMath(line.blurb))}</p>
    {/if}
{/snippet}

<div
    class="slot"
    class:dormant={isDormant(projects, configMap(), vocabOf)}
    class:muted
    data-pillar={line.id}
>
    <RecordCard
        id={line.id}
        {cursor}
        title={line.title}
        titleHtml={inlineMarkdown(line.title, cardMath(line.title))}
        ontitle={card.onpage}
        {tone}
        record={line}
        actions={card.actions}
        strip={['page']}
        dated={card.dated}
        {onsaid}
        {meta}
        {facts}
        {text}
        {projects}
        deleting={card.deleting}
    />
</div>

<style>
    /* The slot fills its grid cell and the record card fills the slot, so the cards of one row are
       one height and no empty cell is left under a short one. */
    .slot {
        display: flex;
        flex-direction: column;
        min-width: 0;
    }

    /* An off-pillar line and a dormant line, one with no member at a stage on the map, are faded;
       while the pointer is over one or the keyboard focus is inside it the fade lifts, so the line
       being read is read at full strength. */
    .dormant,
    .muted {
        opacity: 0.62;
        transition: opacity 120ms ease;
    }

    .dormant:hover,
    .dormant:focus-within,
    .muted:hover,
    .muted:focus-within {
        opacity: 1;
    }

    @media (prefers-reduced-motion: reduce) {
        .dormant,
        .muted {
            transition: none;
        }
    }

    .metrics {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 6px;
        min-height: calc(var(--tree-row) * var(--text-scale, 1));
    }

    .total,
    .funding,
    .blurb {
        color: var(--muted-txt, var(--muted));
    }

    .total {
        font-size: var(--fs-sm);
    }

    .goal,
    .funding,
    .blurb {
        margin: 8px 0 0;
    }
</style>
