<script lang="ts">
    // Layer 3, Programs partial. One research-line card with its portfolio metrics, registry prose,
    // project cross-links and the shared schema-driven edit form.

    import Card from '$lib/ui/Card.svelte';
    import Chip from '$lib/ui/Chip.svelte';
    import Glyph from '$lib/ui/Glyph.svelte';
    import ToolButton from '$lib/ui/ToolButton.svelte';
    import EntryForm from '$lib/views/shared/EntryForm.svelte';
    import CrossLinks from '$lib/views/shared/CrossLinks.svelte';
    import { inlineMarkdown } from '$lib/ui/html';
    import type { Entry, SchemaField } from '$lib/state/collection';
    import {
        inFlight,
        isDormant,
        tierStrip,
        type Program,
        type Project,
        type TierRow,
        type Venue
    } from '$lib/state/lines';
    import { paletteTone, toneOf } from '$lib/state/tones';
    import { t } from '$lib/state/text';

    type Props = {
        line: Program;
        cursor: boolean;
        projects: Project[];
        venues: Venue[];
        tiers: TierRow[];
        entry: Entry | null;
        schema: SchemaField[] | undefined;
        muted?: boolean;
        editing: boolean;
        onedit: () => void;
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
        editing,
        onedit,
        onsaid
    }: Props = $props();
    const flight = $derived(inFlight(projects));
    const strip = $derived(tierStrip(projects, venues, tiers));
    const funding = $derived(
        typeof entry?.fields.funding === 'string' ? entry.fields.funding : undefined
    );
    const tone = $derived(line.color === undefined ? undefined : paletteTone(line.color));

    function projectWord(): string {
        return projects.length === 1 ? t('programs.project') : t('programs.projects');
    }
</script>

<div class:dormant={isDormant(projects)} class:muted data-program={line.id}>
    <Card id={line.id} {cursor} title={line.title} titleHtml={inlineMarkdown(line.title)} {tone}>
        {#snippet meta()}
            <Chip label={`${projects.length} ${projectWord()}`} />
            {#if entry !== null && schema !== undefined}
                <ToolButton
                    label={t('collection.form_edit_title')}
                    glyph={t('collection.edit_glyph')}
                    compact
                    active={editing}
                    onclick={onedit}
                />
            {/if}
        {/snippet}

        {#if !muted}
            <div class="metrics">
                <strong>{flight.length} {t('programs.in_flight')}</strong>
                <span class="total">{projects.length} {t('programs.total')}</span>
                {#each strip as tier (tier.key)}
                    <Chip
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
        <CrossLinks {projects} />
        {#if editing && entry !== null}
            <EntryForm collection="programs" {schema} {entry} onclose={onedit} {onsaid} />
        {/if}
    </Card>
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
    }

    .total,
    .funding,
    .blurb {
        color: var(--muted-txt, var(--muted));
    }

    .goal,
    .funding,
    .blurb {
        margin: 8px 0 0;
    }
</style>
