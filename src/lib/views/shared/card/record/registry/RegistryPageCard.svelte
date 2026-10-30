<script lang="ts">
    // Layer 3, shared view partial of the entry page (views/boards/entry/Entry.svelte). The card an
    // entry of a registry file is drawn with on its own page: the card its view draws, with `page`
    // set, its projects read as that view reads them. Which card is decided by the `registry:` the
    // collection names: VenueCard, DatasetCard, DomainCard or LineCard, each opened out. A domain's
    // page draws with no member too, which the Domains view leaves out. An entry the snapshot holds
    // no entity for, and a collection that is no such registry, draw `children`, the card of every
    // other collection.

    import type { Snippet } from 'svelte';
    import DatasetCard from './DatasetCard.svelte';
    import DomainCard from './DomainCard.svelte';
    import LineCard from './LineCard.svelte';
    import VenueCard from './VenueCard.svelte';
    import { datasetUsers } from '$lib/state/sources/registries/datasets';
    import { realProjects, venueUsers } from '$lib/state/sources/registries/venues';
    import {
        OFFPILLAR,
        domainMembers,
        lineMembers,
        registryRecord,
        venueTiers
    } from '$lib/state/boards/structure/lines';
    import { themeLabeller } from '$lib/state/shared/words/themes';
    import { vocabOf } from '$lib/state/shared/words/tones';
    import type {
        Collection,
        Entry,
        IdentityFault,
        SchemaField
    } from '$lib/state/boards/collection';
    import type { ViewSource } from '$lib/state/sessions/view-source';
    import { useState } from '$lib/state/client/use';

    const {
        entities: { portfolio },
        selectors: { configMap, datasets, hubVocabs, projects, venues }
    } = useState();

    type Props = {
        collection: Collection;
        entry: Entry;
        schema: SchemaField[] | undefined;
        file: ViewSource | null;
        fault: IdentityFault | undefined;
        onsaid: (said: string) => void;
        /** The card of an entry of any other kind. */
        children: Snippet;
    };

    let { collection, entry, schema, file, fault, onsaid, children }: Props = $props();

    const shared = $derived({ cursor: false, entry, schema, file, fault, onsaid, page: true });
    const held = $derived(portfolio()?.entities);
    const venue = $derived(
        collection.registry === 'venues'
            ? (venues().find((one) => one.id === entry.id) ?? null)
            : null
    );
    const dataset = $derived(
        collection.registry === 'datasets'
            ? (datasets().find((one) => one.id === entry.id) ?? null)
            : null
    );
    const domain = $derived(
        collection.registry === 'domains' ? registryRecord(held?.domains, entry.id) : null
    );
    const line = $derived(
        collection.registry === 'pillars' ? registryRecord(held?.pillars, entry.id) : null
    );
</script>

{#if venue !== null}
    {@const use = venueUsers(
        venue,
        realProjects(projects(), configMap(), vocabOf),
        configMap(),
        vocabOf
    )}
    <VenueCard
        {...shared}
        {venue}
        projects={use.projects}
        concentrated={use.concentrated}
        labels={themeLabeller(hubVocabs(), 'venue_themes')(venue.root)}
    />
{:else if dataset !== null}
    <DatasetCard {...shared} {dataset} projects={datasetUsers(dataset.projectIds, projects())} />
{:else if domain !== null}
    <DomainCard
        {...shared}
        {domain}
        projects={domainMembers(domain, projects(), configMap(), vocabOf)}
    />
{:else if line !== null}
    <LineCard
        {...shared}
        {line}
        muted={line.kind === OFFPILLAR}
        projects={lineMembers(line, projects(), configMap(), vocabOf)}
        venues={venues()}
        tiers={venueTiers(vocabOf().venue_tiers)}
    />
{:else}
    {@render children()}
{/if}
