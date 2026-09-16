<script module lang="ts">
    // Layer 3, view registration. Inbox follows Position Leads in the feeds group.
    import type { ViewRegistration } from './registry';
    export const registration: ViewRegistration = {
        id: 'inbox',
        label: 'views.inbox',
        glyph: 'views.inbox_glyph',
        group: 'feeds',
        order: 2,
        badge: (client) => client.railBadges.inboxBadge(),
        badgeTone: () => 'red'
    };
</script>

<script lang="ts">
    // Layer 3, view. Inbox reads its socket feed, groups live cards by action kind, and keeps
    // search plus the triaged-section disclosure in this view instance's state.

    import Tag from '$lib/ui/Tag.svelte';
    import Empty from '$lib/ui/Empty.svelte';
    import Glyph from '$lib/ui/Glyph.svelte';
    import Pane from '$lib/ui/Pane.svelte';
    import Search from '$lib/ui/Search.svelte';
    import Toolbar from '$lib/ui/Toolbar.svelte';
    import ToolButton from '$lib/ui/ToolButton.svelte';
    import InboxCard from './inbox/InboxCard.svelte';
    import Intro from './shared/Intro.svelte';
    import Reveal from './shared/Reveal.svelte';
    import SourceButton from './shared/SourceButton.svelte';
    import {
        inboxSearch,
        parseInboxState,
        splitInbox,
        type InboxEntry,
        type InboxState
    } from '$lib/state/inbox';
    import { asText } from '$lib/state/schema';
    import { t } from '$lib/state/text';
    import { cardCursor } from '$lib/state/instance';
    import { feedIdents } from '$lib/state/palette';
    import { viewSourceFile } from '$lib/state/view-source';
    import type { ViewProps } from './registry';
    import { useState } from '$lib/state/use';

    const {
        feeds: { feed },
        selectors: { configMap },
        ui: { instanceState, setInstanceState }
    } = useState();

    let { instance }: ViewProps = $props();

    const data = $derived(feed('inbox'));
    const identOf = $derived(feedIdents('inbox', data?.entries ?? []));
    const held = $derived(parseInboxState(instanceState(instance.id)));
    const cursor = $derived(cardCursor(instance.state));
    const split = $derived(splitInbox(data?.entries ?? []));
    const replies = $derived(inboxSearch(split.replies, held.search));
    const actions = $derived(inboxSearch(split.actions, held.search));
    const info = $derived(inboxSearch(split.info, held.search));
    const triaged = $derived(inboxSearch(split.triaged, held.search));
    const run = $derived(asText(data?.meta.run));
    const liveCount = $derived(split.replies.length + split.actions.length + split.info.length);
    /** The feed file this view is drawn from, offered once the feed says the file is there. */
    const source = $derived(
        data === null || data.missing ? null : viewSourceFile('inbox', configMap())
    );
    let said = $state('');

    function write(next: Partial<InboxState>): void {
        setInstanceState(instance.id, { ...held, ...next });
    }
</script>

{#snippet tools()}
    <Toolbar label={t('inbox.search')}>
        <Search
            value={held.search}
            placeholder={t('inbox.search')}
            oninput={(search: string) => write({ search })}
        />
        {#if source !== null}
            <SourceButton file={source} />
        {/if}
    </Toolbar>
{/snippet}

{#snippet section(label: string, entries: InboxEntry[])}
    {#if entries.length > 0}
        <section class="group">
            <h3>{label} ({entries.length})</h3>
            <div class="cards">
                {#each entries as entry, at (`${asText(entry.id)}:${at}`)}
                    <Reveal
                        id={identOf(entry)}
                        wanted={held.reveal}
                        onrevealed={() => write({ reveal: '' })}
                    >
                        <InboxCard
                            {entry}
                            id={identOf(entry)}
                            cursor={cursor === identOf(entry)}
                            onsaid={(words: string) => (said = words)}
                        />
                    </Reveal>
                {/each}
            </div>
        </section>
    {/if}
{/snippet}

<Pane title={t('views.inbox')} toolbar={tools}>
    <div class="inbox" data-instance={instance.id}>
        {#if data === null}
            <Empty message={t('app.waiting')} glyph="inbox" />
        {:else if data.missing}
            <p class="clear">
                <Glyph name="warn" />
                <!-- eslint-disable-next-line svelte/no-at-html-tags -- a catalog line, which oculus wrote -->
                <span>{@html t('inbox.no_file')}</span>
            </p>
        {:else if data.error !== undefined}
            <Empty message={t('radar.feed_error', data.file, data.error)} glyph="warn" />
        {:else}
            <Intro>
                <Tag label={`${t('inbox.triaged')} ${run}`} tone="teal" />
                {#if split.triaged.length > 0}
                    <span>{t('inbox.triaged_suffix', split.triaged.length)}</span>
                {/if}
            </Intro>

            {#if said !== ''}
                <p class="said">{said}</p>
            {/if}

            <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
            {@render section(t('inbox.sec_reply'), replies)}
            <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
            {@render section(t('inbox.sec_action'), actions)}
            <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
            {@render section(t('inbox.sec_info'), info)}

            {#if liveCount === 0}
                <p class="clear">
                    <Glyph name="done" />
                    <!-- eslint-disable-next-line svelte/no-at-html-tags -- a catalog line, which oculus wrote -->
                    <span>{@html t('inbox.clear')}</span>
                </p>
            {/if}

            {#if split.triaged.length > 0}
                <section class="triaged">
                    <ToolButton
                        label={`${t('inbox.triaged_sec')} (${split.triaged.length})`}
                        glyph="done"
                        active={held.triagedOpen}
                        expanded={held.triagedOpen}
                        onclick={() => write({ triagedOpen: !held.triagedOpen })}
                    />
                    {#if held.triagedOpen && triaged.length > 0}
                        <div class="cards">
                            {#each triaged as entry, at (`${asText(entry.id)}:${at}`)}
                                <Reveal
                                    id={identOf(entry)}
                                    wanted={held.reveal}
                                    onrevealed={() => write({ reveal: '' })}
                                >
                                    <InboxCard
                                        {entry}
                                        id={identOf(entry)}
                                        cursor={cursor === identOf(entry)}
                                        triaged
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
    .inbox {
        display: grid;
        gap: 12px;
    }

    .said,
    .clear {
        margin: 0;
        color: var(--muted-txt, var(--muted));
    }

    .clear {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 10px 0;
    }

    .group h3 {
        margin: 0;
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-lg);
    }

    .cards {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(min(340px, 100%), 1fr));
        gap: 8px;
        margin-top: 8px;
    }

    .triaged {
        padding-top: 8px;
        border-top: 1px solid var(--line);
    }
</style>
