<script module lang="ts">
    // Layer 3, view registration. A set of projects opens from the title of its card and is not
    // listed in the view catalogue: opened bare it can only say it was opened for no set.
    import type { ViewRegistration } from '$lib/state/workbench/navigation/registry';
    export const registration: ViewRegistration = {
        id: 'listing',
        label: 'views.listing',
        glyph: 'views.listing_glyph',
        group: '',
        order: 0,
        listed: false
    };
</script>

<script lang="ts">
    // Layer 3, view. The page of a set of projects that is no record of a file: Archival, Orphans
    // or No funding, the `set` of the instance's state (sets/listing.ts). It is the frame of every
    // record's page (views/shared/card/record/RecordPage.svelte): the set's card at the top, with
    // no strip since the page lists the projects, then its projects as closed project cards. A set
    // with no project draws the line saying so. Archival has one group per stage in the order of
    // its `dead` numbers, folded by the stage's word (views/shared/card/pane-fold.ts). There is no
    // editor, since no file holds a set.
    //
    // The projects are those the cards read, from the same state functions. No funding shows every
    // unfunded project, since the picks of the bar belong to the Funding view.

    import Empty from '$lib/ui/frame/Empty.svelte';
    import Surface from '$lib/ui/frame/Surface.svelte';
    import GroupHead from '$lib/ui/controls/heads/GroupHead.svelte';
    import ProjectCards from '../../shared/card/record/sets/ProjectCards.svelte';
    import ArchivalCard from '../../shared/card/record/sets/ArchivalCard.svelte';
    import NoFundingCard from '../../shared/card/record/sets/NoFundingCard.svelte';
    import OrphansCard from '../../shared/card/record/sets/OrphansCard.svelte';
    import RecordPage from '../../shared/card/record/RecordPage.svelte';
    import { usePaneFold } from '../../shared/card/pane-fold';
    import { joinedRegistries } from '$lib/state/boards/collection/joined';
    import { unfundedBy } from '$lib/state/boards/structure/cross-links';
    import { archival, orphans, registryLines } from '$lib/state/boards/structure/lines';
    import { chipLabel, vocabOf } from '$lib/state/shared/words/tones';
    import { t } from '$lib/state/shared/words/text';
    import { instanceText } from '$lib/state/workbench/layout/instance';
    import type { ViewProps } from '$lib/state/workbench/navigation/registry';
    import { useState } from '$lib/state/client/use';

    const {
        entities: { portfolio },
        selectors: { configMap, projects, registryCollections }
    } = useState();

    let { instance }: ViewProps = $props();

    /** Which of the page's groups are open, kept in the tab's state. */
    const fold = usePaneFold();

    const set = $derived(instanceText(instance.state, 'set'));
    /** What the card's last write answered, the one outcome line this tab holds. */
    let said = $state('');

    const all = $derived(projects());
    const archived = $derived(archival(all, configMap(), vocabOf));
    const lines = $derived(
        registryLines(
            portfolio(),
            'pillars',
            registryCollections('pillars').flatMap((one) => one.entries)
        )
    );
    const unmatched = $derived(orphans(lines, all, configMap(), vocabOf));
    const joined = $derived(joinedRegistries(registryCollections('funding')));
    const unfunded = $derived(
        joined.funded.length > 0
            ? unfundedBy(joined.fundedProjects(all), joined.funded, configMap(), vocabOf)
            : []
    );

    /** The words of the page: the set's own, or the view's for a tab opened for no set. */
    function title(): string {
        if (set === 'archival') return t('pillars.archival');
        if (set === 'orphans') return t('pillars.orphans');
        if (set === 'no_funding') return t('collection.no_funding');
        return t('views.listing');
    }
</script>

{#snippet none()}
    <Surface>
        <Empty message={t('project.no_projects')} glyph={t('project.none_glyph')} />
    </Surface>
{/snippet}

<RecordPage title={title()} {instance} {said} data-listing={set}>
    {#snippet card()}
        {#if set === 'archival'}
            <ArchivalCard id={instance.id} cursor={false} groups={archived} listed={false} />
        {:else if set === 'orphans'}
            <OrphansCard id={instance.id} cursor={false} projects={unmatched} listed={false} />
        {:else if set === 'no_funding'}
            <NoFundingCard {unfunded} cursor={false} listed={false} />
        {:else}
            <Surface>
                <Empty message={t('project.listing_none')} glyph={t('project.none_glyph')} />
            </Surface>
        {/if}
    {/snippet}

    {#if set === 'archival'}
        {#each archived as group (group.stage)}
            <GroupHead
                data-block={group.stage}
                label={chipLabel(group.stage)}
                count={group.count}
                open={fold.open(group.stage)}
                ontoggle={() => fold.toggle(group.stage)}
            >
                <ProjectCards
                    projects={group.projects}
                    onsaid={(answer: string) => (said = answer)}
                />
            </GroupHead>
        {:else}
            <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
            {@render none()}
        {/each}
    {:else if set === 'orphans' || set === 'no_funding'}
        {@const listed = set === 'orphans' ? unmatched : unfunded}
        {#if listed.length === 0}
            <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
            {@render none()}
        {:else}
            <ProjectCards projects={listed} onsaid={(answer: string) => (said = answer)} />
        {/if}
    {/if}
</RecordPage>
