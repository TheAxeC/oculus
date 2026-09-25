<script module lang="ts">
    // Layer 3, view registration. Pillars opens the structure group.
    import type { ViewRegistration } from '$lib/state/workbench/navigation/registry';
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

    import Pane from '$lib/ui/frame/Pane.svelte';
    import RegistryHead from '$lib/views/shared/forms/RegistryHead.svelte';
    import Intro from '$lib/views/shared/prose/Intro.svelte';
    import type { Snippet } from 'svelte';
    import SourceToolbar from '$lib/views/shared/links/SourceToolbar.svelte';
    import Reveal from '$lib/views/shared/card/Reveal.svelte';
    import ArchivalCard from '$lib/views/structure/pillars/ArchivalCard.svelte';
    import LineCard from '$lib/views/structure/pillars/LineCard.svelte';
    import OrphansCard from '$lib/views/structure/pillars/OrphansCard.svelte';
    import { inlineMarkdown } from '$lib/ui/html';
    import { cardCursor } from '$lib/state/workbench/layout/instance';
    import {
        archival,
        registryLines,
        lineKinds,
        lineMembers,
        orphans,
        parsePillarsState,
        venueTiers,
        type PillarsState
    } from '$lib/state/boards/structure/lines';
    import { entryById } from '$lib/state/boards/collection';
    import { t } from '$lib/state/words/text';
    import { viewSourceFile } from '$lib/state/sessions/view-source';
    import type { ViewProps } from '$lib/state/workbench/navigation/registry';
    import { useState } from '$lib/state/client/use';

    const {
        entities: { portfolio },
        selectors: { archiveDead, collectionOf, configMap, projects, venues },
        formDrafts: { toggleAdd, toggleEdit },
        ui: { instanceState, setInstanceState }
    } = useState();

    let { instance }: ViewProps = $props();
    const ORPHANS_CARD = 'pillars:orphans';
    const ARCHIVAL_CARD = 'pillars:archival';
    const held = $derived(parsePillarsState(instanceState(instance.id)));
    const cursor = $derived(cardCursor(instance.state));
    const collection = $derived(collectionOf('pillars'));
    /**
     * The registry file this view is drawn from, which the control at the end of the toolbar opens.
     */
    const source = $derived(viewSourceFile('pillars', configMap()));
    const lines = $derived(registryLines(portfolio(), 'pillars', collection?.entries ?? []));
    const allProjects = $derived(projects());
    const dead = $derived(archiveDead());
    const allVenues = $derived(venues());
    const kinds = $derived(lineKinds(lines));
    const pillars = $derived(kinds.pillars);
    const provisional = $derived(kinds.provisional);
    const offpillar = $derived(kinds.offpillar);
    const unmatched = $derived(orphans(lines, allProjects, dead));
    const archived = $derived(archival(allProjects, dead));
    const tiers = $derived(venueTiers(configMap().venue_tiers));

    let said = $state('');

    function write(next: Partial<PillarsState>): void {
        setInstanceState(instance.id, { ...held, ...next });
    }
</script>

{#snippet tools()}
    <SourceToolbar {source} />
{/snippet}

<Pane title={t('views.pillars')} toolbar={tools}>
    <div class="pillars-view" data-instance={instance.id}>
        <RegistryHead
            collection="pillars"
            schema={collection?.schema}
            adding={held.adding}
            {said}
            ontoggle={() => write({ adding: toggleAdd(instance.id, 'pillars', held.adding) })}
            onclose={() => write({ adding: false })}
            onsaid={(words: string) => (said = words)}
            spaced
        >
            {#snippet intro(actions: Snippet)}
                <Intro html={inlineMarkdown(t('pillars.intro'))} trusted {actions} />
            {/snippet}
        </RegistryHead>

        <div class="cards">
            {#each pillars as line (line.id)}
                <Reveal id={line.id} wanted={held.reveal} onrevealed={() => write({ reveal: '' })}>
                    <LineCard
                        {line}
                        cursor={cursor === line.id}
                        projects={lineMembers(line, allProjects, dead)}
                        venues={allVenues}
                        {tiers}
                        entry={entryById(collection, line.id)}
                        schema={collection?.schema}
                        editing={held.editing === line.id}
                        onedit={() =>
                            write({
                                editing: toggleEdit(instance.id, 'pillars', held.editing, line.id)
                            })}
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
                                entry={entryById(collection, line.id)}
                                schema={collection?.schema}
                                editing={held.editing === line.id}
                                onedit={() =>
                                    write({
                                        editing: toggleEdit(
                                            instance.id,
                                            'pillars',
                                            held.editing,
                                            line.id
                                        )
                                    })}
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
                                entry={entryById(collection, line.id)}
                                schema={collection?.schema}
                                muted
                                editing={held.editing === line.id}
                                onedit={() =>
                                    write({
                                        editing: toggleEdit(
                                            instance.id,
                                            'pillars',
                                            held.editing,
                                            line.id
                                        )
                                    })}
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

    .note {
        margin: 6px 0 0;
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-md);
    }
</style>
