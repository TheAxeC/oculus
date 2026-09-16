<script module lang="ts">
    // Layer 3, view registration. Pillars opens the structure group.
    import type { ViewRegistration } from './registry';
    export const registration: ViewRegistration = {
        id: 'pillars',
        label: 'views.pillars',
        glyph: 'views.pillars_glyph',
        group: 'structure',
        order: 0
    };
</script>

<script lang="ts">
    // Layer 3, view. The Pillars board over registry lines and real-project membership, followed by
    // provisional lines, off-pillar lines and archival provenance.

    import Pane from '$lib/ui/Pane.svelte';
    import Toolbar from '$lib/ui/Toolbar.svelte';
    import ToolButton from '$lib/ui/ToolButton.svelte';
    import EntryForm from '$lib/views/shared/EntryForm.svelte';
    import SourceButton from '$lib/views/shared/SourceButton.svelte';
    import Intro from '$lib/views/shared/Intro.svelte';
    import Reveal from '$lib/views/shared/Reveal.svelte';
    import ArchivalCard from '$lib/views/pillars/ArchivalCard.svelte';
    import LineCard from '$lib/views/pillars/LineCard.svelte';
    import OrphansCard from '$lib/views/pillars/OrphansCard.svelte';
    import { inlineMarkdown } from '$lib/ui/html';
    import { cardCursor } from '$lib/state/instance';
    import {
        archival,
        lineMembers,
        orphans,
        parsePillarsState,
        type PillarsState,
        type TierRow
    } from '$lib/state/lines';
    import { asText } from '$lib/state/schema';
    import { t } from '$lib/state/text';
    import { viewSourceFile } from '$lib/state/view-source';
    import type { ViewProps } from './registry';
    import { useState } from '$lib/state/use';

    const {
        entities: { portfolio },
        selectors: { archiveDead, collectionOf, configMap, projects, venues },
        ui: { instanceState, setInstanceState }
    } = useState();

    let { instance }: ViewProps = $props();
    const ORPHANS_CARD = 'pillars:orphans';
    const ARCHIVAL_CARD = 'pillars:archival';
    const held = $derived(parsePillarsState(instanceState(instance.id)));
    const cursor = $derived(cardCursor(instance.state));
    const collection = $derived(collectionOf('pillars'));
    /** The registry file this view is drawn from, which the control at the end of the toolbar opens. */
    const source = $derived(viewSourceFile('pillars', configMap()));
    const lines = $derived.by(() => {
        const entities = Object.values(portfolio()?.entities.pillars ?? {});
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
                label: typeof row.label === 'string' ? row.label : asText(row.key),
                ...(typeof row.color === 'string' ? { color: row.color } : {})
            }))
            .filter((row) => row.key !== '');
    });

    let adding = $state(false);
    let editing = $state<string | null>(null);
    let said = $state('');

    function write(next: Partial<PillarsState>): void {
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

{#snippet tools()}
    <Toolbar label={t('collection.toolbar')}>
        {#if source !== null}
            <SourceButton file={source} />
        {/if}
    </Toolbar>
{/snippet}

<Pane title={t('views.pillars')} toolbar={tools}>
    <div class="pillars-view" data-instance={instance.id}>
        <Intro html={inlineMarkdown(t('pillars.intro'))} trusted actions={introActions} />
        {#if adding && collection?.schema !== undefined}
            <EntryForm
                collection="pillars"
                schema={collection.schema}
                entry={null}
                onclose={() => (adding = false)}
                onsaid={(words: string) => (said = words)}
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
                        cursor={cursor === line.id}
                        projects={lineMembers(line, allProjects, dead)}
                        venues={allVenues}
                        {tiers}
                        entry={entryFor(line.id)}
                        schema={collection?.schema}
                        editing={editing === line.id}
                        onedit={() => (editing = editing === line.id ? null : line.id)}
                        onsaid={(words: string) => (said = words)}
                    />
                </Reveal>
            {/each}
            <OrphansCard id={ORPHANS_CARD} cursor={cursor === ORPHANS_CARD} projects={unmatched} />
        </div>

        {#if provisional.length > 0}
            <section>
                <h3>{t('pillars.provisional_h')}</h3>
                <!-- eslint-disable-next-line svelte/no-at-html-tags -- inline Markdown sanitises what it renders -->
                <p class="note">{@html inlineMarkdown(t('pillars.provisional_note'))}</p>
                <div class="cards">
                    {#each provisional as line (line.id)}
                        <Reveal
                            id={line.id}
                            wanted={held.reveal}
                            onrevealed={() => write({ reveal: '' })}
                        >
                            <LineCard
                                {line}
                                cursor={cursor === line.id}
                                projects={lineMembers(line, allProjects, dead)}
                                venues={allVenues}
                                {tiers}
                                entry={entryFor(line.id)}
                                schema={collection?.schema}
                                editing={editing === line.id}
                                onedit={() => (editing = editing === line.id ? null : line.id)}
                                onsaid={(words: string) => (said = words)}
                            />
                        </Reveal>
                    {/each}
                </div>
            </section>
        {/if}

        {#if offpillar.length > 0 || archived.length > 0}
            <section>
                <h3>{t('pillars.offpillar_h')}</h3>
                <!-- eslint-disable-next-line svelte/no-at-html-tags -- inline Markdown sanitises what it renders -->
                <p class="note">{@html inlineMarkdown(t('pillars.offpillar_note'))}</p>
                <div class="cards">
                    {#each offpillar as line (line.id)}
                        <Reveal
                            id={line.id}
                            wanted={held.reveal}
                            onrevealed={() => write({ reveal: '' })}
                        >
                            <LineCard
                                {line}
                                cursor={cursor === line.id}
                                projects={lineMembers(line, allProjects, dead)}
                                venues={allVenues}
                                {tiers}
                                entry={entryFor(line.id)}
                                schema={collection?.schema}
                                muted
                                editing={editing === line.id}
                                onedit={() => (editing = editing === line.id ? null : line.id)}
                                onsaid={(words: string) => (said = words)}
                            />
                        </Reveal>
                    {/each}
                    {#if archived.length > 0}
                        <ArchivalCard
                            id={ARCHIVAL_CARD}
                            cursor={cursor === ARCHIVAL_CARD}
                            groups={archived}
                        />
                    {/if}
                </div>
            </section>
        {/if}
    </div>
</Pane>

<style>
    .pillars-view {
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
