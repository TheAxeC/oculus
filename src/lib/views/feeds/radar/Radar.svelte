<script module lang="ts">
    // Layer 3, view registration. Lit Watch opens the feeds group.
    import type { ViewRegistration } from '../../registry';
    export const registration: ViewRegistration = {
        id: 'radar',
        label: 'views.radar',
        glyph: 'views.radar_glyph',
        group: 'feeds',
        order: 0
    };
</script>

<script lang="ts">
    // Layer 3, view. Lit Watch reads the radar socket feed, groups live papers by vocabulary,
    // and keeps search and the dismissed-section disclosure in this view instance's saved state.

    import Empty from '$lib/ui/frame/Empty.svelte';
    import Pane from '$lib/ui/frame/Pane.svelte';
    import Search from '$lib/ui/controls/Search.svelte';
    import Toolbar from '$lib/ui/frame/Toolbar.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import SourceButton from '../../shared/links/SourceButton.svelte';
    import Bucket from './Bucket.svelte';
    import RadarCard from './RadarCard.svelte';
    import RadarIntro from './RadarIntro.svelte';
    import Reveal from '../../shared/card/Reveal.svelte';
    import {
        bucketsOf,
        isDismissed,
        parseRadarState,
        radarBuckets,
        radarSearch,
        sortBucket,
        type RadarState
    } from '$lib/state/feeds/radar';
    import { asText } from '$lib/state/forms/schema';
    import { t } from '$lib/state/words/text';
    import { cardCursor } from '$lib/state/client/instance';
    import { feedIdents } from '$lib/state/workbench/palette';
    import { viewSourceFile } from '$lib/state/sessions/view-source';
    import type { ViewProps } from '../../registry';
    import { useState } from '$lib/state/client/use';

    const {
        entities: { config, portfolio },
        feeds: { feed },
        selectors: { configMap },
        ui: { instanceState, setInstanceState }
    } = useState();

    let { instance }: ViewProps = $props();

    const data = $derived(feed('radar'));
    const held = $derived(parseRadarState(instanceState(instance.id)));
    const cursor = $derived(cardCursor(instance.state));
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
    const identOf = $derived(feedIdents('radar', data?.entries ?? []));
    /** The feed file this view is drawn from, offered once the feed says the file is there. */
    const source = $derived(
        data === null || data.missing ? null : viewSourceFile('radar', configMap())
    );
    let said = $state('');

    function write(next: Partial<RadarState>): void {
        setInstanceState(instance.id, { ...held, ...next });
    }
</script>

{#snippet tools()}
    <Toolbar label={t('radar.search')}>
        <Search
            value={held.search}
            placeholder={t('radar.search')}
            oninput={(search: string) => write({ search })}
        />
        {#if source !== null}
            <SourceButton file={source} />
        {/if}
    </Toolbar>
{/snippet}

<Pane title={t('views.radar')} toolbar={tools}>
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
                <p class="said">{said}</p>
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

    .radar > :global(*),
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
