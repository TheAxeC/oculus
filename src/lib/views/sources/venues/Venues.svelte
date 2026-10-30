<script module lang="ts">
    // Layer 3, view registration. Venues opens the Registries page's group.
    import type { ViewRegistration } from '$lib/state/workbench/navigation/registry';
    export const registration: ViewRegistration = {
        id: 'venues',
        label: 'views.venues',
        glyph: 'views.venues_glyph',
        group: 'registries',
        order: 0
    };
</script>

<script lang="ts">
    // Layer 3, view. The venue catalogue: theme facets, and the venues' cards in one section per
    // row of `venue_categories` that holds one, in the list's order, then an "other" section for
    // the venues whose category no row names (state/sources/registries/venues.ts `venueSections`).
    // Each section is the group every grouping of a view is drawn as
    // (ui/controls/heads/GroupHead.svelte), headed with its count, and folds by its control, which
    // the tab keeps under `folded`; a section whose row carries `ribbon: true` draws the month
    // ribbon of its venues' deadlines and meetings over its cards, which are drawn in the shared
    // card grid (views/shared/card/record/CardGrid.svelte). A venue asked to be revealed opens its
    // folded section before it is scrolled to. Registry entities provide the display model while
    // the matching collection provides editing.
    //
    // Over a wallpaper each card and each month of the ribbon is its own surface; the head and the
    // ribbon's lines are read off a `Surface`.

    import Empty from '$lib/ui/frame/Empty.svelte';
    import Pane from '$lib/ui/frame/Pane.svelte';
    import Search from '$lib/ui/controls/text/Search.svelte';
    import Tag from '$lib/ui/controls/Tag.svelte';
    import Tooltip from '$lib/ui/menu/Tooltip.svelte';
    import Toolbar from '$lib/ui/frame/toolbar/Toolbar.svelte';
    import GroupHead from '$lib/ui/controls/heads/GroupHead.svelte';
    import RegistryTools from '$lib/views/shared/forms/registry/RegistryTools.svelte';
    import { registryFile } from '$lib/views/shared/forms/registry/registry-file.svelte';
    import RegistryHead from '$lib/views/shared/forms/registry/RegistryHead.svelte';
    import CardGrid from '$lib/views/shared/card/record/CardGrid.svelte';
    import Reveal from '$lib/views/shared/card/Reveal.svelte';
    import ThemeFacets from '$lib/views/shared/forms/ThemeFacets.svelte';
    import Ribbon from '$lib/views/sources/venues/Ribbon.svelte';
    import VenueCard from '$lib/views/shared/card/record/registry/VenueCard.svelte';
    import {
        parseVenuesState,
        realProjects,
        venueSearch,
        venueSections,
        venueUsers,
        type VenuesState
    } from '$lib/state/sources/registries/venues';
    import { stateFolds } from '$lib/state/shared/page/folds';
    import { cardCursor, storedState } from '$lib/state/workbench/layout/instance';
    import { applyThemeFacets, themeFacets, themeLabeller } from '$lib/state/shared/words/themes';
    import { t } from '$lib/state/shared/words/text';
    import type { ViewProps } from '$lib/state/workbench/navigation/registry';
    import { useState } from '$lib/state/client/use';
    import { vocabOf } from '$lib/state/shared/words/tones';

    const client = useState();
    const {
        selectors: { configMap, hubVocabs, projects, venues },
        ui: { instanceState, setInstanceState }
    } = client;

    let { instance }: ViewProps = $props();

    const file = registryFile(client, 'venues');
    const allVenues = $derived(venues());
    const allProjects = $derived(realProjects(projects(), configMap(), vocabOf));
    const held = $derived(parseVenuesState(instanceState(instance.id)));
    const cursor = $derived(cardCursor(instance.state));
    const labelOf = $derived(themeLabeller(hubVocabs(), 'venue_themes'));
    const facets = $derived(themeFacets(allVenues, labelOf));
    const shown = $derived(applyThemeFacets(venueSearch(allVenues, held.search), held.off));
    const sections = $derived(venueSections(shown, vocabOf()));
    /** The presses that fold and unfold a section, by its category's key. */
    const folds = stateFolds(
        () => held.folded,
        (folded) => write({ folded })
    );
    const todayMonth = new Date().getMonth() + 1;

    function write(next: Partial<VenuesState>): void {
        setInstanceState(instance.id, storedState({ ...held, ...next }));
    }

    /** The section of the venue asked to be revealed, which is unfolded so its card is shown. */
    const revealedSection = $derived(
        held.reveal === ''
            ? undefined
            : sections.find((one) => one.venues.some((venue) => venue.id === held.reveal))?.key
    );
    $effect(() => folds.open(revealedSection));
</script>

{#snippet tools()}
    <RegistryTools {file} />
{/snippet}

{#snippet bar()}
    <Toolbar label={t('venues.filters')}>
        <Search
            fill
            value={held.search}
            placeholder={t('collection.search', t('views.venues'))}
            oninput={(search: string) => write({ search })}
        />
        <ThemeFacets
            {facets}
            caption={t('venues.themes_facet')}
            off={held.off}
            onchange={(off: string[]) => write({ off })}
        >
            <Tooltip text={t('venues.conc_tip')} focusable>
                <Tag label={t('venues.conc')} tone="violet" />
            </Tooltip>
        </ThemeFacets>
    </Toolbar>
{/snippet}

<Pane title={t('views.venues')} toolbar={tools} {bar}>
    <div class="venues" data-instance={instance.id}>
        <RegistryHead {file} />

        {#if allVenues.length === 0}
            <Empty message={t('venues.empty')} />
        {:else}
            {#each sections as section (section.key)}
                {@const words = section.key === '' ? t('venues.section_other') : section.label}
                {@const open = !held.folded.includes(section.key)}
                <GroupHead
                    data-category={section.key}
                    label={words}
                    {open}
                    ontoggle={() => folds.toggle(section.key)}
                    count={section.venues.length}
                >
                    {#if section.ribbon}
                        <div class="timeline">
                            <Ribbon venues={section.venues} {todayMonth} />
                        </div>
                    {/if}
                    <CardGrid>
                        {#each section.venues as venue (venue.id)}
                            {@const use = venueUsers(venue, allProjects, configMap(), vocabOf)}
                            <Reveal
                                id={venue.id}
                                wanted={open ? held.reveal : ''}
                                onrevealed={() => write({ reveal: '' })}
                            >
                                <VenueCard
                                    {venue}
                                    cursor={cursor === venue.id}
                                    projects={use.projects}
                                    concentrated={use.concentrated}
                                    labels={labelOf(venue.root)}
                                    entry={file.entryOf(venue.id)}
                                    schema={file.schemaOf(venue.id)}
                                    file={file.sourceOf(venue.id)}
                                    fault={file.faultOf(venue.id)}
                                    onsaid={file.say}
                                />
                            </Reveal>
                        {/each}
                    </CardGrid>
                </GroupHead>
            {/each}
        {/if}
    </div>
</Pane>

<style>
    /* The head and the sections, 12px apart. */
    .venues {
        display: flex;
        flex-direction: column;
        gap: 12px;
        min-width: 0;
    }

    /* The ribbon stands 8px over the cards of its section. */
    .timeline {
        margin-bottom: 8px;
        overflow-x: auto;
    }

    /* The scroller clips what it holds at its padding box, so over a wallpaper it takes the room
       the ribbon's surface reaches past its words as padding, and gives it back as margin: the
       ribbon stays where it is and its surface is drawn whole. */
    :global(body.wall) .timeline {
        margin: 0 -8px 4px;
        padding: 4px 8px;
    }
</style>
