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
    // Layer 3, view. The Pillars board over registry lines and real-project membership, in one
    // section per row of `pillar_kinds`, in the list's order, then an Other section for the lines
    // whose kind no row names (state/boards/structure/lines.ts `lineKinds`). Each section is the
    // group every grouping of a view is drawn as (ui/controls/heads/GroupHead.svelte), headed by
    // the row's label in its colour with the count of its lines, and folds by its control, which
    // the tab keeps under `folded`; its cards are drawn in the shared card grid
    // (views/shared/card/record/CardGrid.svelte). The Orphans card is drawn in the first row's
    // section and the Archival card, while a project is archived, in the section of `offpillar`, or
    // under Other when the list holds no such row; a section with no line and neither card is not
    // drawn. The title of either card opens the set's page, the `listing` view's tab. An off-pillar
    // line's card is muted. A line asked to be revealed opens its folded section before it is
    // scrolled to.
    //
    // Over a wallpaper each card is its own surface.

    import Pane from '$lib/ui/frame/Pane.svelte';
    import GroupHead from '$lib/ui/controls/heads/GroupHead.svelte';
    import RegistryHead from '$lib/views/shared/forms/registry/RegistryHead.svelte';
    import RegistryTools from '$lib/views/shared/forms/registry/RegistryTools.svelte';
    import { registryFile } from '$lib/views/shared/forms/registry/registry-file.svelte';
    import CardGrid from '$lib/views/shared/card/record/CardGrid.svelte';
    import Reveal from '$lib/views/shared/card/Reveal.svelte';
    import ArchivalCard from '$lib/views/shared/card/record/sets/ArchivalCard.svelte';
    import LineCard from '$lib/views/shared/card/record/registry/LineCard.svelte';
    import OrphansCard from '$lib/views/shared/card/record/sets/OrphansCard.svelte';
    import { openListing } from '$lib/views/shared/card/record/sets/listing';
    import { stateFolds } from '$lib/state/shared/page/folds';
    import { cardCursor, storedState } from '$lib/state/workbench/layout/instance';
    import {
        OFFPILLAR,
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
    import { toneOf, vocabOf } from '$lib/state/shared/words/tones';

    const client = useState();
    const {
        entities: { portfolio },
        layout: { openBeside },
        selectors: { configMap, projects, venues },
        ui: { instanceState, setInstanceState }
    } = client;

    let { instance }: ViewProps = $props();
    const ORPHANS_CARD = 'pillars:orphans';
    const ARCHIVAL_CARD = 'pillars:archival';
    const held = $derived(parsePillarsState(instanceState(instance.id)));
    const cursor = $derived(cardCursor(instance.state));
    const file = registryFile(client, 'pillars');
    const lines = $derived(registryLines(portfolio(), 'pillars', file.collection?.entries ?? []));
    const allProjects = $derived(projects());
    const config = $derived(configMap());
    const allVenues = $derived(venues());
    const kinds = $derived(lineKinds(lines, vocabOf()));
    /** The presses that fold and unfold a section, by its kind's key. */
    const folds = stateFolds(
        () => held.folded,
        (folded) => write({ folded })
    );
    const unmatched = $derived(orphans(lines, allProjects, config, vocabOf));
    const archived = $derived(archival(allProjects, config, vocabOf));
    const tiers = $derived(venueTiers(vocabOf().venue_tiers));
    /** The key of the section the Orphans card is drawn in: the first row's, else Other's. */
    const orphansAt = $derived(kinds[0]?.key ?? '');
    /** The key of the section the Archival card is drawn in: `offpillar`'s, else Other's. */
    const archivalAt = $derived(kinds.some((kind) => kind.key === OFFPILLAR) ? OFFPILLAR : '');
    /** The sections drawn: those with a line, and those holding the Orphans or Archival card. */
    const shown = $derived(
        kinds.filter(
            (kind) =>
                kind.lines.length > 0 ||
                kind.key === orphansAt ||
                (kind.key === archivalAt && archived.length > 0)
        )
    );

    function write(next: Partial<PillarsState>): void {
        setInstanceState(instance.id, storedState({ ...held, ...next }));
    }

    /** The section of the line asked to be revealed, which is unfolded so its card is shown. */
    const revealedKind = $derived(
        (held.reveal ?? '') === ''
            ? undefined
            : kinds.find((one) => one.lines.some((line) => line.id === held.reveal))?.key
    );
    $effect(() => folds.open(revealedKind));
</script>

{#snippet tools()}
    <RegistryTools {file} />
{/snippet}

<Pane title={t('views.pillars')} toolbar={tools}>
    <div class="pillars-view" data-instance={instance.id}>
        <RegistryHead {file} />

        {#each shown as kind (kind.key)}
            {@const open = !held.folded.includes(kind.key)}
            <GroupHead
                data-kind={kind.key}
                label={kind.key === '' ? t('pillars.kind_other') : kind.label}
                {open}
                ontoggle={() => folds.toggle(kind.key)}
                tone={kind.color === '' ? undefined : toneOf(kind.color)}
                count={kind.lines.length}
            >
                <CardGrid>
                    {#each kind.lines as line (line.id)}
                        <Reveal
                            id={line.id}
                            wanted={open ? held.reveal : ''}
                            onrevealed={() => write({ reveal: '' })}
                        >
                            <LineCard
                                {line}
                                cursor={cursor === line.id}
                                projects={lineMembers(line, allProjects, config, vocabOf)}
                                venues={allVenues}
                                {tiers}
                                entry={file.entryOf(line.id)}
                                schema={file.schemaOf(line.id)}
                                muted={kind.key === OFFPILLAR}
                                file={file.sourceOf(line.id)}
                                fault={file.faultOf(line.id)}
                                onsaid={file.say}
                            />
                        </Reveal>
                    {/each}
                    {#if kind.key === orphansAt}
                        <OrphansCard
                            id={ORPHANS_CARD}
                            cursor={cursor === ORPHANS_CARD}
                            projects={unmatched}
                            ontitle={() => openListing(openBeside, 'orphans', t('pillars.orphans'))}
                        />
                    {/if}
                    {#if kind.key === archivalAt && archived.length > 0}
                        <ArchivalCard
                            id={ARCHIVAL_CARD}
                            cursor={cursor === ARCHIVAL_CARD}
                            groups={archived}
                            ontitle={() =>
                                openListing(openBeside, 'archival', t('pillars.archival'))}
                        />
                    {/if}
                </CardGrid>
            </GroupHead>
        {/each}
    </div>
</Pane>

<style>
    /* The said line and the sections, 12px apart. */
    .pillars-view {
        display: flex;
        flex-direction: column;
        gap: 12px;
        min-width: 0;
    }
</style>
