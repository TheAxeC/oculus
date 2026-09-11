<script lang="ts">
    // Layer 3, Programs partial. One research-line card with its portfolio metrics, registry prose,
    // project cross-links and the shared schema-driven edit form.

    import Card from '$lib/ui/Card.svelte';
    import Chip from '$lib/ui/Chip.svelte';
    import Glyph from '$lib/ui/Glyph.svelte';
    import ToolButton from '$lib/ui/ToolButton.svelte';
    import EntryForm from '$lib/views/shared/EntryForm.svelte';
    import CrossLinks from '$lib/views/shared/CrossLinks.svelte';
    import { inlineMarkdown, type Entry, type SchemaField } from '$lib/state/collection';
    import {
        inFlight,
        isDormant,
        tierStrip,
        type Program,
        type Project,
        type TierRow,
        type Venue
    } from '$lib/state/lines';
    import { toneOf } from '$lib/state/tones';
    import { t } from '$lib/state/text';

    type Props = {
        line: Program;
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

    function projectWord(): string {
        return projects.length === 1 ? t('col.project') : t('col.projects');
    }
</script>

<div class:dormant={isDormant(projects)} class:muted data-program={line.id}>
    <Card title={line.title} titleHtml={inlineMarkdown(line.title)}>
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
                <strong>{flight.length} {t('col.in_flight')}</strong>
                <span class="total">{projects.length} {t('col.total')}</span>
                {#each strip as tier (tier.key)}
                    <Chip
                        label={`${tier.count} ${tier.label}`}
                        tone={tier.color === undefined ? undefined : toneOf(tier.color)}
                    />
                {/each}
            </div>
        {/if}
        {#if line.goal}
            <p class="goal">{@html inlineMarkdown(line.goal)}</p>
        {/if}
        {#if funding}
            <p class="funding">
                <Glyph name="funding" />
                {@html inlineMarkdown(funding)}
            </p>
        {/if}
        {#if line.blurb}
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
