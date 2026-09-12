<script lang="ts">
    // Layer 3, view. Lit Watch reads the radar socket feed, groups live papers by vocabulary,
    // and keeps search and the dismissed-section disclosure in this view instance's saved state.

    import Empty from '$lib/ui/Empty.svelte';
    import Pane from '$lib/ui/Pane.svelte';
    import Search from '$lib/ui/Search.svelte';
    import Toolbar from '$lib/ui/Toolbar.svelte';
    import ToolButton from '$lib/ui/ToolButton.svelte';
    import Intro from './shared/Intro.svelte';
    import EditBar from './shared/EditBar.svelte';
    import Bucket from './radar/Bucket.svelte';
    import RadarCard from './radar/RadarCard.svelte';
    import Reveal from './shared/Reveal.svelte';
    import { config, portfolio } from '$lib/state/entities.svelte';
    import { feed } from '$lib/state/feeds.svelte';
    import {
        bucketsOf,
        isDismissed,
        parseRadarState,
        radarBuckets,
        radarSearch,
        sortBucket,
        type RadarState
    } from '$lib/state/radar';
    import { t } from '$lib/state/text';
    import { feedIdentity } from '$lib/state/palette';
    import { instanceState, setInstanceState } from '$lib/state/ui.svelte';
    import { HUB_ROOT } from '$lib/state/collection';
    import type { ViewProps } from './registry';

    let { instance }: ViewProps = $props();

    const data = $derived(feed('radar'));
    const held = $derived(parseRadarState(instanceState(instance.id)));
    const buckets = $derived(radarBuckets(config()?.config.radar_buckets));
    const projects = $derived(portfolio()?.entities.projects ?? {});
    const all = $derived(data?.entries ?? []);
    const live = $derived(all.filter((entry) => !isDismissed(entry)));
    const dismissed = $derived(all.filter(isDismissed));
    const searchedLive = $derived(radarSearch(live, held.search));
    const searchedDismissed = $derived(sortBucket(radarSearch(dismissed, held.search)));
    const groups = $derived(
        bucketsOf(searchedLive, buckets).filter((group) => group.entries.length > 0)
    );
    const lastRun = $derived(data?.meta.last_run ?? '');
    let said = $state('');

    function write(next: Partial<RadarState>): void {
        setInstanceState(instance.id, { ...held, ...next });
    }
</script>

{#snippet tools()}
    <Toolbar label={t('sf.radar_search')}>
        <Search
            value={held.search}
            placeholder={t('sf.radar_search')}
            oninput={(search) => write({ search })}
        />
    </Toolbar>
{/snippet}

<Pane title={t('views.radar')} toolbar={tools}>
    <div class="radar" data-instance={instance.id}>
        {#if data !== null && !data.missing}
            <EditBar files={[{ root: HUB_ROOT, path: data.file }]} />
        {/if}
        {#if data === null}
            <Empty message={t('app.waiting')} glyph="litwatch" />
        {:else if data.missing}
            <Empty message={t('sf.radar_no_file', data.file)} glyph="warn" />
        {:else if data.error !== undefined}
            <Empty message={t('radar.feed_error', data.file, data.error)} glyph="warn" />
        {:else}
            <Intro
                html={`${t('sf.radar_intro_head')} ${t(
                    'sf.radar_intro_tail',
                    live.length,
                    String(lastRun || t('sf.radar_no_date'))
                )}`}
            />

            {#if said !== ''}
                <p class="said">{said}</p>
            {/if}

            {#each groups as group (group.bucket.key)}
                <Bucket
                    bucket={group.bucket}
                    entries={group.entries}
                    {lastRun}
                    {projects}
                    reveal={held.reveal}
                    onrevealed={() => write({ reveal: '' })}
                    onsaid={(words) => (said = words)}
                />
            {/each}

            {#if searchedDismissed.length > 0}
                <section class="dismissed">
                    <ToolButton
                        label={t(
                            'sf.radar_count',
                            t('sf.radar_dismissed_sec'),
                            searchedDismissed.length
                        )}
                        glyph="dismiss"
                        active={held.dismissedOpen}
                        onclick={() => write({ dismissedOpen: !held.dismissedOpen })}
                    />
                    {#if held.dismissedOpen}
                        <div class="cards">
                            {#each searchedDismissed as entry, at (`${String(entry.title ?? '')}:${at}`)}
                                <Reveal
                                    id={feedIdentity('radar', entry)}
                                    wanted={held.reveal}
                                    onrevealed={() => write({ reveal: '' })}
                                >
                                    <RadarCard
                                        {entry}
                                        {lastRun}
                                        {projects}
                                        dismissed
                                        onsaid={(words) => (said = words)}
                                    />
                                </Reveal>
                            {/each}
                        </div>
                    {/if}
                </section>
            {/if}

            {#if groups.length === 0 && searchedDismissed.length === 0}
                <Empty message={t('sf.radar_empty')} glyph="litwatch" />
            {/if}
        {/if}
    </div>
</Pane>

<style>
    .radar {
        display: grid;
        gap: 12px;
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
