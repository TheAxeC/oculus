<script module lang="ts">
    // Layer 3, view registration. Venues opens the sources group.
    import type { ViewRegistration } from './registry';
    export const registration: ViewRegistration = {
        id: 'venues',
        label: 'views.venues',
        glyph: 'views.venues_glyph',
        group: 'sources',
        order: 0
    };
</script>

<script lang="ts">
    // Layer 3, view. The venue catalogue: theme facets, journal cards and conference timing.
    // Registry entities provide the display model while the matching collection provides editing.

    import Pane from '$lib/ui/Pane.svelte';
    import Search from '$lib/ui/Search.svelte';
    import Tag from '$lib/ui/Tag.svelte';
    import Tooltip from '$lib/ui/Tooltip.svelte';
    import Toolbar from '$lib/ui/Toolbar.svelte';
    import ToolButton from '$lib/ui/ToolButton.svelte';
    import EntryForm from '$lib/views/shared/EntryForm.svelte';
    import SourceButton from '$lib/views/shared/SourceButton.svelte';
    import Intro from '$lib/views/shared/Intro.svelte';
    import Reveal from '$lib/views/shared/Reveal.svelte';
    import Facets from '$lib/views/venues/Facets.svelte';
    import Ribbon from '$lib/views/venues/Ribbon.svelte';
    import VenueCard from '$lib/views/venues/VenueCard.svelte';
    import {
        parseVenuesState,
        realProjects,
        venueSearch,
        venueUsers,
        type VenuesState
    } from '$lib/state/venues';
    import { cardCursor } from '$lib/state/instance';
    import { applyThemeFacets, themeFacets, themeWordLabels } from '$lib/state/themes';
    import { t } from '$lib/state/text';
    import { viewSourceFile } from '$lib/state/view-source';
    import type { ViewProps } from './registry';
    import { useState } from '$lib/state/use';

    const {
        selectors: { archiveDead, collectionOf, configMap, projects, venues },
        formDrafts: { toggleAdd, toggleEdit },
        ui: { instanceState, setInstanceState }
    } = useState();

    let { instance }: ViewProps = $props();

    const collection = $derived(collectionOf('venues'));
    /** The registry file this view is drawn from, which the control at the end of the toolbar opens. */
    const source = $derived(viewSourceFile('venues', configMap()));
    const allVenues = $derived(venues());
    const allProjects = $derived(realProjects(projects(), archiveDead()));
    const held = $derived(parseVenuesState(instanceState(instance.id)));
    const cursor = $derived(cardCursor(instance.state));
    const labels = $derived(themeWordLabels(configMap().venue_themes));
    const facets = $derived(themeFacets(allVenues, labels));
    const shown = $derived(applyThemeFacets(venueSearch(allVenues, held.search), held.off));
    const journals = $derived(shown.filter((venue) => venue.category === 'journal'));
    const conferences = $derived(shown.filter((venue) => venue.category === 'conference'));
    const todayMonth = new Date().getMonth() + 1;

    let said = $state('');

    function write(next: Partial<VenuesState>): void {
        setInstanceState(instance.id, { ...held, ...next });
    }

    function toggleTheme(theme: string): void {
        write({
            off: held.off.includes(theme)
                ? held.off.filter((item) => item !== theme)
                : [...held.off, theme]
        });
    }

    function entryFor(id: string) {
        return collection?.entries.find((entry) => entry.id === id) ?? null;
    }
</script>

{#snippet tools()}
    <Toolbar label={t('collection.toolbar')}>
        {#if collection?.schema !== undefined}
            <ToolButton
                label={t('collection.add')}
                title={t('collection.add_tip')}
                active={held.adding}
                onclick={() => write({ adding: toggleAdd(instance.id, 'venues', held.adding) })}
            />
        {/if}
        <Search
            value={held.search}
            placeholder={t('collection.search', t('views.venues'))}
            oninput={(search: string) => write({ search })}
        />
        {#if source !== null}
            <SourceButton file={source} />
        {/if}
    </Toolbar>
{/snippet}

<Pane title={t('views.venues')} toolbar={tools}>
    <div class="venues" data-instance={instance.id}>
        <Intro html={t('venues.intro')} trusted />
        {#if held.adding && collection?.schema !== undefined}
            <EntryForm
                collection="venues"
                schema={collection.schema}
                entry={null}
                onclose={() => write({ adding: false })}
                onsaid={(words: string) => (said = words)}
            />
        {/if}

        {#if said !== ''}
            <p class="said">{said}</p>
        {/if}

        <Facets {facets} off={held.off} ontoggle={toggleTheme}>
            <Tooltip text={t('venues.conc_tip')} focusable>
                <Tag label={t('venues.conc')} tone="violet" />
            </Tooltip>
        </Facets>

        {#if allVenues.length === 0}
            <!-- eslint-disable-next-line svelte/no-at-html-tags -- a catalog line, which oculus wrote -->
            <p class="empty">{@html t('venues.empty')}</p>
        {:else}
            {#if journals.length > 0}
                <section>
                    <ToolButton
                        label={t('venues.journals', journals.length)}
                        glyph="journals"
                        active={held.journalsOpen}
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
                                        {labels}
                                        entry={entryFor(venue.id)}
                                        schema={collection?.schema}
                                        editing={held.editing === venue.id}
                                        onedit={() =>
                                            write({
                                                editing: toggleEdit(
                                                    instance.id,
                                                    'venues',
                                                    held.editing,
                                                    venue.id
                                                )
                                            })}
                                        onsaid={(words: string) => (said = words)}
                                    />
                                </Reveal>
                            {/each}
                        </div>
                    {/if}
                </section>
            {/if}

            {#if conferences.length > 0}
                <section>
                    <ToolButton
                        label={t('venues.conferences', conferences.length)}
                        glyph="conference"
                        active={held.conferencesOpen}
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
                                        {labels}
                                        entry={entryFor(venue.id)}
                                        schema={collection?.schema}
                                        editing={held.editing === venue.id}
                                        onedit={() =>
                                            write({
                                                editing: toggleEdit(
                                                    instance.id,
                                                    'venues',
                                                    held.editing,
                                                    venue.id
                                                )
                                            })}
                                        onsaid={(words: string) => (said = words)}
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

    .said {
        margin: 8px 0;
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-md);
    }

    .empty {
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-md);
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
        grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
        gap: 10px;
        align-items: start;
        margin-top: 8px;
    }
</style>
