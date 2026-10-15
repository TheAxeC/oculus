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
    // Layer 3, view. The venue catalogue: theme facets, journal cards and conference timing.
    // Registry entities provide the display model while the matching collection provides editing.

    import Empty from '$lib/ui/frame/Empty.svelte';
    import Pane from '$lib/ui/frame/Pane.svelte';
    import Search from '$lib/ui/controls/text/Search.svelte';
    import Tag from '$lib/ui/controls/Tag.svelte';
    import Tooltip from '$lib/ui/menu/Tooltip.svelte';
    import Toolbar from '$lib/ui/frame/toolbar/Toolbar.svelte';
    import Disclosure from '$lib/ui/tree/Disclosure.svelte';
    import RegistryTools from '$lib/views/shared/forms/registry/RegistryTools.svelte';
    import { registryFile } from '$lib/views/shared/forms/registry/registry-file.svelte';
    import RegistryHead from '$lib/views/shared/forms/registry/RegistryHead.svelte';
    import Intro from '$lib/views/shared/prose/Intro.svelte';
    import Reveal from '$lib/views/shared/card/Reveal.svelte';
    import ThemeFacets from '$lib/views/shared/forms/ThemeFacets.svelte';
    import Ribbon from '$lib/views/sources/venues/Ribbon.svelte';
    import VenueCard from '$lib/views/sources/venues/VenueCard.svelte';
    import {
        parseVenuesState,
        realProjects,
        venueSearch,
        venueUsers,
        venuesByCategory,
        type VenuesState
    } from '$lib/state/sources/registries/venues';
    import { cardCursor } from '$lib/state/workbench/layout/instance';
    import {
        applyThemeFacets,
        themeFacets,
        themeLabeller,
        toggledThemes
    } from '$lib/state/shared/words/themes';
    import { t } from '$lib/state/shared/words/text';
    import type { ViewProps } from '$lib/state/workbench/navigation/registry';
    import { useState } from '$lib/state/client/use';

    const client = useState();
    const {
        selectors: { archiveDead, hubVocabs, projects, venues },
        ui: { instanceState, setInstanceState }
    } = client;

    let { instance }: ViewProps = $props();

    const file = registryFile(client, 'venues', 'venues');
    const allVenues = $derived(venues());
    const allProjects = $derived(realProjects(projects(), archiveDead()));
    const held = $derived(parseVenuesState(instanceState(instance.id)));
    const cursor = $derived(cardCursor(instance.state));
    const labelOf = $derived(themeLabeller(hubVocabs(), 'venue_themes'));
    const facets = $derived(themeFacets(allVenues, labelOf));
    const shown = $derived(applyThemeFacets(venueSearch(allVenues, held.search), held.off));
    const byCategory = $derived(venuesByCategory(shown));
    const journals = $derived(byCategory.journals);
    const conferences = $derived(byCategory.conferences);
    const todayMonth = new Date().getMonth() + 1;

    function write(next: Partial<VenuesState>): void {
        setInstanceState(instance.id, { ...held, ...next });
    }

    function toggleTheme(theme: string): void {
        write({ off: toggledThemes(held.off, theme) });
    }
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
            ontoggle={toggleTheme}
        >
            <Tooltip text={t('venues.conc_tip')} focusable>
                <Tag label={t('venues.conc')} tone="violet" />
            </Tooltip>
        </ThemeFacets>
    </Toolbar>
{/snippet}

<Pane title={t('views.venues')} toolbar={tools} {bar}>
    <div class="venues" data-instance={instance.id}>
        <RegistryHead {file} spaced>
            {#snippet intro()}
                <Intro html={t('venues.intro')} trusted />
            {/snippet}
        </RegistryHead>

        {#if allVenues.length === 0}
            <Empty message={t('venues.empty')} />
        {:else}
            {#if journals.length > 0}
                <section>
                    <Disclosure
                        count={journals.length}
                        label={t('venues.journals')}
                        expanded={held.journalsOpen}
                        onclick={() => write({ journalsOpen: !held.journalsOpen })}
                    />
                    {#if held.journalsOpen}
                        <div class="cards">
                            {#each journals as venue (venue.id)}
                                {@const use = venueUsers(venue, allProjects)}
                                <Reveal
                                    id={venue.id}
                                    wanted={held.reveal}
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
                        </div>
                    {/if}
                </section>
            {/if}

            {#if conferences.length > 0}
                <section>
                    <Disclosure
                        count={conferences.length}
                        label={t('venues.conferences')}
                        expanded={held.conferencesOpen}
                        onclick={() => write({ conferencesOpen: !held.conferencesOpen })}
                    />
                    {#if held.conferencesOpen}
                        <div class="timeline">
                            <Ribbon venues={conferences} {todayMonth} />
                        </div>
                        <div class="cards">
                            {#each conferences as venue (venue.id)}
                                {@const use = venueUsers(venue, allProjects)}
                                <Reveal
                                    id={venue.id}
                                    wanted={held.reveal}
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
                        </div>
                    {/if}
                </section>
            {/if}
        {/if}
    </div>
</Pane>

<style>
    .venues {
        min-width: 0;
    }

    section {
        margin-top: 12px;
    }

    .timeline {
        margin-top: 8px;
        overflow-x: auto;
    }

    .cards {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(min(320px, 100%), 1fr));
        gap: 10px;
        align-items: start;
        margin-top: 8px;
    }
</style>
