<script module lang="ts">
    // Layer 3, view registration. Programs opens the structure group.
    import type { ViewRegistration } from './registry';
    export const registration: ViewRegistration = {
        id: 'programs',
        label: 'views.programs',
        glyph: 'views.programs_glyph',
        group: 'structure',
        order: 0
    };
</script>

<script lang="ts">
    // Layer 3, view. The Pillars board over registry lines and real-project membership, followed by
    // provisional lines, off-pillar lines and archival provenance.

    import Pane from '$lib/ui/Pane.svelte';
    import ToolButton from '$lib/ui/ToolButton.svelte';
    import EntryForm from '$lib/views/shared/EntryForm.svelte';
    import Intro from '$lib/views/shared/Intro.svelte';
    import Reveal from '$lib/views/shared/Reveal.svelte';
    import ArchivalCard from '$lib/views/programs/ArchivalCard.svelte';
    import LineCard from '$lib/views/programs/LineCard.svelte';
    import OrphansCard from '$lib/views/programs/OrphansCard.svelte';
    import { inlineMarkdown } from '$lib/state/collection';
    import { portfolio } from '$lib/state/entities.svelte';
    import {
        archival,
        lineMembers,
        orphans,
        parseProgramsState,
        type ProgramsState,
        type TierRow
    } from '$lib/state/lines';
    import {
        archiveDead,
        collectionOf,
        configMap,
        projects,
        venues
    } from '$lib/state/selectors.svelte';
    import { t } from '$lib/state/text';
    import { instanceState, setInstanceState } from '$lib/state/ui.svelte';
    import type { ViewProps } from './registry';

    let { instance }: ViewProps = $props();
    const held = $derived(parseProgramsState(instanceState(instance.id)));
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

    function write(next: Partial<ProgramsState>): void {
        setInstanceState(instance.id, { ...held, ...next });
    }

    function entryFor(id: string) {
        return collection?.entries.find((entry) => entry.id === id) ?? null;
    }
</script>

{#snippet introActions()}
    {#if collection?.schema !== undefined}
        <ToolButton
            label={t('collection.add')}
            title={t('collection.add_tip')}
            active={adding}
            onclick={() => (adding = !adding)}
        />
    {/if}
{/snippet}

<Pane title={t('views.programs')}>
    <div class="programs-view" data-instance={instance.id}>
        <Intro html={inlineMarkdown(t('programs.intro'))} actions={introActions} />
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
                <Reveal id={line.id} wanted={held.reveal} onrevealed={() => write({ reveal: '' })}>
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
                </Reveal>
            {/each}
            <OrphansCard projects={unmatched} />
        </div>

        {#if provisional.length > 0}
            <section>
                <h3>{t('programs.provisional_h')}</h3>
                <p class="note">{@html inlineMarkdown(t('programs.provisional_note'))}</p>
                <div class="cards">
                    {#each provisional as line (line.id)}
                        <Reveal
                            id={line.id}
                            wanted={held.reveal}
                            onrevealed={() => write({ reveal: '' })}
                        >
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
                        </Reveal>
                    {/each}
                </div>
            </section>
        {/if}

        {#if offpillar.length > 0 || archived.length > 0}
            <section>
                <h3>{t('programs.offpillar_h')}</h3>
                <p class="note">{@html inlineMarkdown(t('programs.offpillar_note'))}</p>
                <div class="cards">
                    {#each offpillar as line (line.id)}
                        <Reveal
                            id={line.id}
                            wanted={held.reveal}
                            onrevealed={() => write({ reveal: '' })}
                        >
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
                        </Reveal>
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
        font-size: var(--fs-md);
    }
</style>
