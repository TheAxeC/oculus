<script module lang="ts">
    // Layer 3, view registration. Pillars opens the Pillars page's group.
    import type { ViewRegistration } from '$lib/state/workbench/navigation/registry';
    export const registration: ViewRegistration = {
        id: 'pillars',
        label: 'views.pillars',
        glyph: 'views.pillars_glyph',
        group: 'pillars',
        order: 0
    };
</script>

<script lang="ts">
    // Layer 3, view. The Pillars board over registry lines and real-project membership, followed by
    // provisional lines, off-pillar lines and archival provenance.
    //
    // Over a wallpaper each card is its own surface; the head and each section's heading and note
    // are read off a `Surface`.

    import Pane from '$lib/ui/frame/Pane.svelte';
    import Surface from '$lib/ui/frame/Surface.svelte';
    import RegistryHead from '$lib/views/shared/forms/registry/RegistryHead.svelte';
    import Intro from '$lib/views/shared/prose/Intro.svelte';
    import RegistryTools from '$lib/views/shared/forms/registry/RegistryTools.svelte';
    import { registryFile } from '$lib/views/shared/forms/registry/registry-file.svelte';
    import Reveal from '$lib/views/shared/card/Reveal.svelte';
    import ArchivalCard from '$lib/views/structure/pillars/ArchivalCard.svelte';
    import LineCard from '$lib/views/structure/pillars/LineCard.svelte';
    import OrphansCard from '$lib/views/structure/pillars/OrphansCard.svelte';
    import { inlineMarkdown } from '$lib/ui/html';
    import { cardCursor, storedState } from '$lib/state/workbench/layout/instance';
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
    import { t } from '$lib/state/shared/words/text';
    import type { ViewProps } from '$lib/state/workbench/navigation/registry';
    import { useState } from '$lib/state/client/use';

    const client = useState();
    const {
        entities: { portfolio },
        selectors: { configMap, projects, venues },
        ui: { instanceState, setInstanceState }
    } = client;

    let { instance }: ViewProps = $props();
    const ORPHANS_CARD = 'pillars:orphans';
    const ARCHIVAL_CARD = 'pillars:archival';
    const held = $derived(parsePillarsState(instanceState(instance.id)));
    const cursor = $derived(cardCursor(instance.state));
    const file = registryFile(client, 'pillars', 'pillars');
    const lines = $derived(registryLines(portfolio(), 'pillars', file.collection?.entries ?? []));
    const allProjects = $derived(projects());
    const config = $derived(configMap());
    const allVenues = $derived(venues());
    const kinds = $derived(lineKinds(lines));
    const pillars = $derived(kinds.pillars);
    const provisional = $derived(kinds.provisional);
    const offpillar = $derived(kinds.offpillar);
    const unmatched = $derived(orphans(lines, allProjects, config));
    const archived = $derived(archival(allProjects, config));
    const tiers = $derived(venueTiers(configMap().venue_tiers));

    function write(next: Partial<PillarsState>): void {
        setInstanceState(instance.id, storedState({ ...held, ...next }));
    }
</script>

{#snippet tools()}
    <RegistryTools {file} />
{/snippet}

<Pane title={t('views.pillars')} toolbar={tools}>
    <div class="pillars-view" data-instance={instance.id}>
        <RegistryHead {file} spaced>
            {#snippet intro()}
                <Intro html={inlineMarkdown(t('pillars.intro'))} trusted />
            {/snippet}
        </RegistryHead>

        <div class="cards">
            {#each pillars as line (line.id)}
                <Reveal id={line.id} wanted={held.reveal} onrevealed={() => write({ reveal: '' })}>
                    <LineCard
                        {line}
                        cursor={cursor === line.id}
                        projects={lineMembers(line, allProjects, config)}
                        venues={allVenues}
                        {tiers}
                        entry={file.entryOf(line.id)}
                        schema={file.schemaOf(line.id)}
                        file={file.sourceOf(line.id)}
                        fault={file.faultOf(line.id)}
                        onsaid={file.say}
                    />
                </Reveal>
            {/each}
            <OrphansCard id={ORPHANS_CARD} cursor={cursor === ORPHANS_CARD} projects={unmatched} />
        </div>

        {#if provisional.length > 0}
            <section>
                <Surface>
                    <h3>{t('pillars.provisional_h')}</h3>
                    <!-- eslint-disable-next-line svelte/no-at-html-tags -- inline Markdown sanitises what it renders -->
                    <p class="note">{@html inlineMarkdown(t('pillars.provisional_note'))}</p>
                </Surface>
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
                                projects={lineMembers(line, allProjects, config)}
                                venues={allVenues}
                                {tiers}
                                entry={file.entryOf(line.id)}
                                schema={file.schemaOf(line.id)}
                                file={file.sourceOf(line.id)}
                                fault={file.faultOf(line.id)}
                                onsaid={file.say}
                            />
                        </Reveal>
                    {/each}
                </div>
            </section>
        {/if}

        {#if offpillar.length > 0 || archived.length > 0}
            <section>
                <Surface>
                    <h3>{t('pillars.offpillar_h')}</h3>
                    <!-- eslint-disable-next-line svelte/no-at-html-tags -- inline Markdown sanitises what it renders -->
                    <p class="note">{@html inlineMarkdown(t('pillars.offpillar_note'))}</p>
                </Surface>
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
                                projects={lineMembers(line, allProjects, config)}
                                venues={allVenues}
                                {tiers}
                                entry={file.entryOf(line.id)}
                                schema={file.schemaOf(line.id)}
                                muted
                                file={file.sourceOf(line.id)}
                                fault={file.faultOf(line.id)}
                                onsaid={file.say}
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
        grid-template-columns: repeat(auto-fit, minmax(min(290px, 100%), 1fr));
        gap: 10px;
        margin-top: 10px;
    }

    section {
        margin-top: 18px;
    }

    h3 {
        margin: 0;
        color: var(--ink-txt, var(--ink));
        font-size: var(--fs-xs);
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.04em;
    }

    .note {
        margin: 6px 0 0;
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-md);
    }
</style>
