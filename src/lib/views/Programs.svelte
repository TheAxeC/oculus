<script lang="ts">
    // Layer 3, view. The Pillars board over registry lines and real-project membership, followed by
    // provisional lines, off-pillar lines and archival provenance.

    import Pane from '$lib/ui/Pane.svelte';
    import ToolButton from '$lib/ui/ToolButton.svelte';
    import EntryForm from '$lib/views/shared/EntryForm.svelte';
    import ArchivalCard from '$lib/views/programs/ArchivalCard.svelte';
    import LineCard from '$lib/views/programs/LineCard.svelte';
    import OrphansCard from '$lib/views/programs/OrphansCard.svelte';
    import { inlineMarkdown } from '$lib/state/collection';
    import { portfolio } from '$lib/state/entities.svelte';
    import { archival, lineMembers, orphans, type TierRow } from '$lib/state/lines';
    import {
        archiveDead,
        collectionOf,
        configMap,
        projects,
        venues
    } from '$lib/state/selectors.svelte';
    import { t } from '$lib/state/text';
    import type { ViewProps } from './registry';

    let { instance }: ViewProps = $props();
    const collection = $derived(collectionOf('programs'));
    const lines = $derived.by(() => {
        const entities = Object.values(portfolio()?.entities.programs ?? {});
        const byId = new Map(entities.map((line) => [line.id, line]));
        const ordered = (collection?.entries ?? [])
            .map((entry) => byId.get(entry.id))
            .filter((line) => line !== undefined);
        const seen = new Set(ordered.map((line) => line.id));
        return [...ordered, ...entities.filter((line) => !seen.has(line.id))];
    });
    const allProjects = $derived(projects());
    const dead = $derived(archiveDead());
    const allVenues = $derived(venues());
    const pillars = $derived(
        lines.filter((line) => !['provisional', 'offpillar'].includes(line.kind ?? ''))
    );
    const provisional = $derived(lines.filter((line) => line.kind === 'provisional'));
    const offpillar = $derived(lines.filter((line) => line.kind === 'offpillar'));
    const unmatched = $derived(orphans(lines, allProjects, dead));
    const archived = $derived(archival(allProjects, dead));
    const tiers = $derived.by((): TierRow[] => {
        const value = configMap().venue_tiers;
        if (!Array.isArray(value)) return [];
        return value
            .filter(
                (row): row is Record<string, unknown> => typeof row === 'object' && row !== null
            )
            .map((row) => ({
                key: typeof row.key === 'string' ? row.key : '',
                label: typeof row.label === 'string' ? row.label : String(row.key ?? ''),
                ...(typeof row.color === 'string' ? { color: row.color } : {})
            }))
            .filter((row) => row.key !== '');
    });

    let adding = $state(false);
    let editing = $state<string | null>(null);
    let said = $state('');

    function entryFor(id: string) {
        return collection?.entries.find((entry) => entry.id === id) ?? null;
    }
</script>

<Pane title={t('views.programs')}>
    <div class="programs-view" data-instance={instance.id}>
        <div class="intro">
            <span>{@html inlineMarkdown(t('col.programs_intro'))}</span>
            {#if collection?.schema !== undefined}
                <ToolButton
                    label={t('col.add')}
                    title={t('col.add_tip')}
                    active={adding}
                    onclick={() => (adding = !adding)}
                />
            {/if}
        </div>
        {#if adding && collection?.schema !== undefined}
            <EntryForm
                collection="programs"
                schema={collection.schema}
                entry={null}
                onclose={() => (adding = false)}
                onsaid={(words) => (said = words)}
            />
        {/if}
        {#if said !== ''}
            <p class="said">{said}</p>
        {/if}

        <div class="cards">
            {#each pillars as line (line.id)}
                <LineCard
                    {line}
                    projects={lineMembers(line, allProjects, dead)}
                    venues={allVenues}
                    {tiers}
                    entry={entryFor(line.id)}
                    schema={collection?.schema}
                    editing={editing === line.id}
                    onedit={() => (editing = editing === line.id ? null : line.id)}
                    onsaid={(words) => (said = words)}
                />
            {/each}
            <OrphansCard projects={unmatched} />
        </div>

        {#if provisional.length > 0}
            <section>
                <h3>{t('col.provisional_h')}</h3>
                <p class="note">{@html inlineMarkdown(t('col.provisional_note'))}</p>
                <div class="cards">
                    {#each provisional as line (line.id)}
                        <LineCard
                            {line}
                            projects={lineMembers(line, allProjects, dead)}
                            venues={allVenues}
                            {tiers}
                            entry={entryFor(line.id)}
                            schema={collection?.schema}
                            editing={editing === line.id}
                            onedit={() => (editing = editing === line.id ? null : line.id)}
                            onsaid={(words) => (said = words)}
                        />
                    {/each}
                </div>
            </section>
        {/if}

        {#if offpillar.length > 0 || archived.length > 0}
            <section>
                <h3>{t('col.offpillar_h')}</h3>
                <p class="note">{@html inlineMarkdown(t('col.offpillar_note'))}</p>
                <div class="cards">
                    {#each offpillar as line (line.id)}
                        <LineCard
                            {line}
                            projects={lineMembers(line, allProjects, dead)}
                            venues={allVenues}
                            {tiers}
                            entry={entryFor(line.id)}
                            schema={collection?.schema}
                            muted
                            editing={editing === line.id}
                            onedit={() => (editing = editing === line.id ? null : line.id)}
                            onsaid={(words) => (said = words)}
                        />
                    {/each}
                    {#if archived.length > 0}
                        <ArchivalCard groups={archived} />
                    {/if}
                </div>
            </section>
        {/if}
    </div>
</Pane>

<style>
    .programs-view {
        min-width: 0;
    }

    .intro {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 12px;
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-sm);
    }

    .cards {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(290px, 1fr));
        gap: 10px;
        margin-top: 10px;
    }

    section {
        margin-top: 18px;
    }

    h3 {
        margin: 0;
        color: var(--ink-txt, var(--ink));
    }

    .note,
    .said {
        margin: 6px 0 0;
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-sm);
    }
</style>
