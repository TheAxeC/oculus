<script lang="ts">
    // Layer 3, view. Inbox reads its feed on request, groups live cards by action kind, and keeps
    // search plus the triaged-section disclosure in this view instance's state.

    import Chip from '$lib/ui/Chip.svelte';
    import Empty from '$lib/ui/Empty.svelte';
    import Glyph from '$lib/ui/Glyph.svelte';
    import Pane from '$lib/ui/Pane.svelte';
    import Search from '$lib/ui/Search.svelte';
    import Toolbar from '$lib/ui/Toolbar.svelte';
    import ToolButton from '$lib/ui/ToolButton.svelte';
    import InboxCard from './inbox/InboxCard.svelte';
    import { feed } from '$lib/state/feeds.svelte';
    import {
        inboxSearch,
        parseInboxState,
        splitInbox,
        type InboxEntry,
        type InboxState
    } from '$lib/state/inbox';
    import { t } from '$lib/state/text';
    import { instanceState, setInstanceState } from '$lib/state/ui.svelte';
    import type { ViewProps } from './registry';

    let { instance }: ViewProps = $props();

    const data = $derived(feed('inbox'));
    const held = $derived(parseInboxState(instanceState(instance.id)));
    const split = $derived(splitInbox(data?.entries ?? []));
    const replies = $derived(inboxSearch(split.replies, held.search));
    const actions = $derived(inboxSearch(split.actions, held.search));
    const info = $derived(inboxSearch(split.info, held.search));
    const triaged = $derived(inboxSearch(split.triaged, held.search));
    const run = $derived(String(data?.meta.run ?? ''));
    const liveCount = $derived(split.replies.length + split.actions.length + split.info.length);
    let said = $state('');

    function write(next: Partial<InboxState>): void {
        setInstanceState(instance.id, { ...held, ...next });
    }
</script>

{#snippet tools()}
    <Toolbar label={t('sf.inbox_search')}>
        <Search
            value={held.search}
            placeholder={t('sf.inbox_search')}
            oninput={(search) => write({ search })}
        />
    </Toolbar>
{/snippet}

{#snippet section(label: string, entries: InboxEntry[])}
    {#if entries.length > 0}
        <section class="group">
            <h3>{label} ({entries.length})</h3>
            <div class="cards">
                {#each entries as entry, at (`${String(entry.id ?? '')}:${at}`)}
                    <InboxCard {entry} onsaid={(words) => (said = words)} />
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
                <span>{@html t('sf.inbox_no_file')}</span>
            </p>
        {:else if data.error !== undefined}
            <Empty message={t('radar.feed_error', data.file, data.error)} glyph="warn" />
        {:else}
            <div class="meta">
                <Chip label={`${t('sf.inbox_triaged')} ${run}`} tone="teal" />
                {#if split.triaged.length > 0}
                    <span>{t('sf.inbox_triaged_suffix', split.triaged.length)}</span>
                {/if}
            </div>

            {#if said !== ''}
                <p class="said">{said}</p>
            {/if}

            {@render section(t('sf.inbox_sec_reply'), replies)}
            {@render section(t('sf.inbox_sec_action'), actions)}
            {@render section(t('sf.inbox_sec_info'), info)}

            {#if liveCount === 0}
                <p class="clear">
                    <Glyph name="done" />
                    <span>{@html t('sf.inbox_clear')}</span>
                </p>
            {/if}

            {#if split.triaged.length > 0}
                <section class="triaged">
                    <ToolButton
                        label={`${t('sf.inbox_triaged_sec')} (${split.triaged.length})`}
                        glyph="done"
                        active={held.triagedOpen}
                        expanded={held.triagedOpen}
                        onclick={() => write({ triagedOpen: !held.triagedOpen })}
                    />
                    {#if held.triagedOpen && triaged.length > 0}
                        <div class="cards">
                            {#each triaged as entry, at (`${String(entry.id ?? '')}:${at}`)}
                                <InboxCard {entry} triaged onsaid={(words) => (said = words)} />
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

    .meta {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 6px;
        color: var(--muted-txt, var(--muted));
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
        font-size: var(--fs-md);
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
