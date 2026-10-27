<script module lang="ts">
    // Layer 3, view registration. Lit Watch follows the Literature search in the Literature page's
    // group.
    import type { ViewRegistration } from '$lib/state/workbench/navigation/registry';
    export const registration: ViewRegistration = {
        id: 'radar',
        label: 'views.radar',
        glyph: 'views.radar_glyph',
        group: 'literature',
        order: 1
    };
</script>

<script lang="ts">
    // Layer 3, view. Lit Watch reads the radar socket feed, groups live papers by vocabulary, and
    // keeps the search, the folded buckets and the Dismissed fold in this view instance's saved
    // state. Each bucket and Dismissed is the group every grouping of a view is drawn as
    // (ui/controls/heads/GroupHead.svelte, through Bucket.svelte for a bucket), and its cards are
    // drawn in the shared card grid (views/shared/card/record/CardGrid.svelte). A bucket folds by
    // its key under `folded`, Dismissed by `dismissedOpen`, which starts closed; a search leaves
    // every fold as it is, and a heading's count is the papers the search leaves. A paper asked to
    // be revealed opens its folded bucket before it is scrolled to. The bar's right end holds how
    // many papers the radar tracks and the date of the last sweep, as a board shows its count. Add
    // asks the new paper's title, address and bucket, writes it to the radar file of the primary
    // hub (else the first) and opens the paper's page, where the rest is filled in.
    //
    // Over a wallpaper each card is its own surface; the said line is read off a `Surface`.

    import Empty from '$lib/ui/frame/Empty.svelte';
    import Pane from '$lib/ui/frame/Pane.svelte';
    import Surface from '$lib/ui/frame/Surface.svelte';
    import GroupHead from '$lib/ui/controls/heads/GroupHead.svelte';
    import Search from '$lib/ui/controls/text/Search.svelte';
    import Toolbar from '$lib/ui/frame/toolbar/Toolbar.svelte';
    import SourceToolbar from '../../shared/links/SourceToolbar.svelte';
    import AddAsk from '../../shared/forms/entry/AddAsk.svelte';
    import AddButton from '../../shared/forms/AddButton.svelte';
    import { paperAsk, type Ask } from '../../shared/forms/entry/entry-add';
    import Bucket from './Bucket.svelte';
    import FeedFile from '../../shared/card/feed/FeedFile.svelte';
    import RadarCard from '../../shared/card/feed/RadarCard.svelte';
    import CardGrid from '../../shared/card/record/CardGrid.svelte';
    import Reveal from '../../shared/card/Reveal.svelte';
    import {
        dismissedSplit,
        filledBuckets,
        parseRadarState,
        radarBuckets,
        radarSearch,
        sortBucket,
        type RadarState
    } from '$lib/state/feeds/radar';
    import { asText } from '$lib/state/forms/schema';
    import { t } from '$lib/state/shared/words/text';
    import { stateFolds } from '$lib/state/shared/page/folds';
    import { cardCursor, storedState } from '$lib/state/workbench/layout/instance';
    import { feedIdents } from '$lib/state/shared/page/idents';
    import { viewSourceFile } from '$lib/state/sessions/view-source';
    import type { ViewProps } from '$lib/state/workbench/navigation/registry';
    import { useState } from '$lib/state/client/use';
    import { vocabOf } from '$lib/state/shared/words/tones';

    const client = useState();
    const {
        entities: { portfolio },
        feeds: { feed },
        fs: { primary },
        selectors: { configMap },
        ui: { instanceState, setInstanceState }
    } = client;

    let { instance }: ViewProps = $props();

    const data = $derived(feed('radar'));
    const held = $derived(parseRadarState(instanceState(instance.id)));
    const cursor = $derived(cardCursor(instance.state));
    const buckets = $derived(radarBuckets(vocabOf().radar_buckets));
    const projects = $derived(portfolio()?.entities.projects ?? {});
    const all = $derived(data?.entries ?? []);
    const split = $derived(dismissedSplit(all));
    const live = $derived(split.live);
    const dismissed = $derived(split.dismissed);
    const searchedLive = $derived(radarSearch(live, held.search));
    const searchedDismissed = $derived(sortBucket(radarSearch(dismissed, held.search)));
    const groups = $derived(filledBuckets(searchedLive, buckets));
    /** The presses that fold and unfold a bucket, by its key. */
    const folds = stateFolds(
        () => held.folded,
        (folded) => write({ folded })
    );
    const lastRun = $derived(data?.meta.last_run ?? '');
    const identOf = $derived(feedIdents('radar', data?.entries ?? []));
    /** The feed file this view is drawn from, offered once the feed says the file is there. */
    const source = $derived(
        data === null || data.missing ? null : viewSourceFile('radar', configMap(), primary())
    );
    let said = $state('');

    /** The Add box while it is open: it asks the new paper's title, address and bucket. */
    let asking = $state<Ask | null>(null);

    function write(next: Partial<RadarState>): void {
        setInstanceState(instance.id, storedState({ ...held, ...next }));
    }

    /** The bucket of the paper asked to be revealed, which is unfolded so its card is shown. */
    const revealedBucket = $derived(
        (held.reveal ?? '') === ''
            ? undefined
            : groups.find((one) => one.entries.some((entry) => identOf(entry) === held.reveal))
                  ?.bucket.key
    );
    $effect(() => folds.open(revealedBucket));
</script>

{#snippet tools()}
    <SourceToolbar {source} label={t('radar.toolbar')}>
        <AddButton onclick={() => (asking = paperAsk(client))} />
    </SourceToolbar>
{/snippet}

{#snippet bar()}
    <Toolbar label={t('radar.filters')}>
        <Search
            fill
            value={held.search}
            placeholder={t('radar.search')}
            oninput={(search: string) => write({ search })}
        />
        {#if data !== null && !data.missing && data.error === undefined}
            <span class="count">
                {t('radar.tracked', live.length, asText(lastRun) || t('radar.no_date'))}
            </span>
        {/if}
    </Toolbar>
{/snippet}

<AddAsk ask={asking} onclose={() => (asking = null)} />

<Pane title={t('views.radar')} toolbar={source === null ? undefined : tools} {bar}>
    <div class="radar" data-instance={instance.id}>
        <FeedFile {data} glyph="litwatch" missing={t('radar.no_file', data?.file ?? '')}>
            {#if said !== ''}
                <Surface>
                    <p class="said">{said}</p>
                </Surface>
            {/if}

            {#each groups as group (group.bucket.key)}
                <Bucket
                    bucket={group.bucket}
                    entries={group.entries}
                    {lastRun}
                    {projects}
                    {cursor}
                    {identOf}
                    reveal={held.reveal}
                    onrevealed={() => write({ reveal: '' })}
                    onsaid={(words: string) => (said = words)}
                    open={!held.folded.includes(group.bucket.key)}
                    ontoggle={() => folds.toggle(group.bucket.key)}
                />
            {/each}

            {#if searchedDismissed.length > 0}
                <GroupHead
                    label={t('radar.dismissed_sec')}
                    glyph="dismiss"
                    count={searchedDismissed.length}
                    open={held.dismissedOpen}
                    ontoggle={() => write({ dismissedOpen: !held.dismissedOpen })}
                >
                    <CardGrid>
                        {#each searchedDismissed as entry, at (`${asText(entry.title)}:${at}`)}
                            {@const ident = identOf(entry)}
                            <Reveal
                                id={ident}
                                wanted={held.dismissedOpen ? held.reveal : ''}
                                onrevealed={() => write({ reveal: '' })}
                            >
                                <RadarCard
                                    {entry}
                                    id={ident}
                                    cursor={cursor === ident}
                                    {lastRun}
                                    {projects}
                                    dismissed
                                    onsaid={(words: string) => (said = words)}
                                />
                            </Reveal>
                        {/each}
                    </CardGrid>
                </GroupHead>
            {/if}

            {#if groups.length === 0 && searchedDismissed.length === 0}
                <Empty message={t('radar.empty')} glyph="litwatch" />
            {/if}
        </FeedFile>
    </div>
</Pane>

<style>
    /* One column the width of the pane, however long a line inside it: a grid's own column would
       otherwise grow to the widest line it holds and widen the pane. */
    .radar {
        display: grid;
        grid-template-columns: minmax(0, 1fr);
        gap: 12px;
    }

    /* A part on a `Surface` is the grid's item through the Surface's box over a wallpaper and by
       itself without one (`display: contents`), so both shrink to the column. */
    .radar > :global(*),
    .radar > :global([data-surface]) > :global(*) {
        min-width: 0;
    }

    .said {
        margin: 0;
    }

    /* The count at the bar's right end, as a board draws its count. */
    .count {
        margin-left: auto;
        font-size: var(--fs-xs);
        white-space: nowrap;
        color: var(--muted-txt, var(--muted));
    }
</style>
