<script lang="ts">
    // Layer 3, Pillars partial. One registry-line card (RegistryCard.svelte) with its portfolio
    // metrics and registry prose.

    import Tag from '$lib/ui/controls/Tag.svelte';
    import Glyph from '$lib/ui/display/Glyph.svelte';
    import RegistryCard from '$lib/views/shared/forms/registry/RegistryCard.svelte';
    import { inlineMarkdown } from '$lib/ui/html';
    import type { Entry, IdentityFault, SchemaField } from '$lib/state/boards/collection';
    import type { ViewSource } from '$lib/state/sessions/view-source';
    import {
        inFlight,
        isDormant,
        tierStrip,
        type Pillar,
        type Project,
        type TierRow,
        type Venue
    } from '$lib/state/boards/structure/lines';
    import { paletteTone, toneOf } from '$lib/state/shared/words/tones';
    import { optionalText } from '$lib/data/shapes/shapes';
    import { t } from '$lib/state/shared/words/text';

    type Props = {
        line: Pillar;
        cursor: boolean;
        projects: Project[];
        venues: Venue[];
        tiers: TierRow[];
        entry: Entry | null;
        schema: SchemaField[] | undefined;
        muted?: boolean;
        file: ViewSource | null;
        fault: IdentityFault | undefined;
        onsaid: (said: string) => void;
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
    const flight = $derived(inFlight(projects));
    const strip = $derived(tierStrip(projects, venues, tiers));
    const funding = $derived(optionalText(entry?.fields.funding));
    const tone = $derived(line.color === undefined ? undefined : paletteTone(line.color));
</script>

<div class:dormant={isDormant(projects)} class:muted data-pillar={line.id}>
    <RegistryCard
        collection="pillars"
        id={line.id}
        {cursor}
        title={line.title}
        {tone}
        record={line}
        {projects}
        {entry}
        {schema}
        {file}
        {fault}
        {onsaid}
    >
        {#if !muted}
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
        {/if}
        {#if line.goal}
            <!-- eslint-disable-next-line svelte/no-at-html-tags -- inline Markdown sanitises what it renders -->
            <p class="goal">{@html inlineMarkdown(line.goal)}</p>
        {/if}
        {#if funding}
            <p class="funding">
                <Glyph name="funding" />
                <!-- eslint-disable-next-line svelte/no-at-html-tags -- inline Markdown sanitises what it renders -->
                {@html inlineMarkdown(funding)}
            </p>
        {/if}
        {#if line.blurb}
            <!-- eslint-disable-next-line svelte/no-at-html-tags -- inline Markdown sanitises what it renders -->
            <p class="blurb">{@html inlineMarkdown(line.blurb)}</p>
        {/if}
    </RegistryCard>
</div>

<style>
    .dormant,
    .muted {
        opacity: 0.62;
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
