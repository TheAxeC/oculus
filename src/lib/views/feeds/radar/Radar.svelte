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
    // keeps search and the dismissed-section disclosure in this view instance's saved state. Add
    // asks the new paper's title, address and bucket, writes it to the radar file of the primary
    // hub (else the first) and opens the paper's page, where the rest is filled in.
    //
    // Over a wallpaper each card is its own surface and a bucket's heading is a solid button; the
    // intro and the said line are read off a `Surface`.

    import Empty from '$lib/ui/frame/Empty.svelte';
    import Pane from '$lib/ui/frame/Pane.svelte';
    import Surface from '$lib/ui/frame/Surface.svelte';
    import Search from '$lib/ui/controls/text/Search.svelte';
    import Toolbar from '$lib/ui/frame/toolbar/Toolbar.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import SourceToolbar from '../../shared/links/SourceToolbar.svelte';
    import AddAsk from '../../shared/forms/entry/AddAsk.svelte';
    import AddButton from '../../shared/forms/AddButton.svelte';
    import { paperAsk, type Ask } from '../../shared/forms/entry/entry-add';
    import Bucket from './Bucket.svelte';
    import RadarCard from '../../shared/card/feed/RadarCard.svelte';
    import RadarIntro from './RadarIntro.svelte';
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
    </Toolbar>
{/snippet}

<AddAsk ask={asking} onclose={() => (asking = null)} />

<Pane title={t('views.radar')} toolbar={source === null ? undefined : tools} {bar}>
    <div class="radar" data-instance={instance.id}>
        {#if data === null}
            <Empty message={t('app.waiting')} glyph="litwatch" />
        {:else if data.missing}
            <Empty message={t('radar.no_file', data.file)} glyph="warn" />
        {:else if data.error !== undefined}
            <Empty message={t('radar.feed_error', data.file, data.error)} glyph="warn" />
        {:else}
            <RadarIntro {buckets} tracked={live.length} lastRun={asText(lastRun)} />

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
                />
            {/each}

            {#if searchedDismissed.length > 0}
                <section class="dismissed">
                    <ToolButton
                        label={t('radar.count', t('radar.dismissed_sec'), searchedDismissed.length)}
                        glyph="dismiss"
                        active={held.dismissedOpen}
                        onclick={() => write({ dismissedOpen: !held.dismissedOpen })}
                    />
                    {#if held.dismissedOpen}
                        <div class="cards">
                            {#each searchedDismissed as entry, at (`${asText(entry.title)}:${at}`)}
                                {@const ident = identOf(entry)}
                                <Reveal
                                    id={ident}
                                    wanted={held.reveal}
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
                        </div>
                    {/if}
                </section>
            {/if}

            {#if groups.length === 0 && searchedDismissed.length === 0}
                <Empty message={t('radar.empty')} glyph="litwatch" />
            {/if}
        {/if}
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
    .radar > :global([data-surface]) > :global(*),
    .cards > :global(*) {
        min-width: 0;
    }

    .said {
        margin: 0;
    }

    .dismissed {
        padding-top: 8px;
        border-top: 1px solid var(--line);
    }

    .cards {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(min(340px, 100%), 1fr));
        gap: 8px;
        margin-top: 8px;
    }
</style>
