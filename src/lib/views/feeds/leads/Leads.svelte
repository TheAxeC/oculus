<script module lang="ts">
    // Layer 3, view registration. Position Leads follows Lit Watch in the feeds group.
    import type { ViewRegistration } from '../../registry';
    export const registration: ViewRegistration = {
        id: 'leads',
        label: 'views.leads',
        glyph: 'views.leads_glyph',
        group: 'feeds',
        order: 1,
        badge: (client) => client.railBadges.leadsBadge(),
        badgeTone: () => 'amber'
    };
</script>

<script lang="ts">
    // Layer 3, view. Position Leads reads its socket feed, splits live from expired entries,
    // and keeps search plus the expired and run-log disclosures in this view instance's state.

    import Empty from '$lib/ui/frame/Empty.svelte';
    import Pane from '$lib/ui/frame/Pane.svelte';
    import Search from '$lib/ui/controls/Search.svelte';
    import Toolbar from '$lib/ui/frame/Toolbar.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import LeadCard from './LeadCard.svelte';
    import EntryForm from '../../shared/forms/EntryForm.svelte';
    import Intro from '../../shared/prose/Intro.svelte';
    import Reveal from '../../shared/card/Reveal.svelte';
    import SourceButton from '../../shared/links/SourceButton.svelte';
    import { inlineMarkdown } from '$lib/ui/html';
    import {
        dismissedCount,
        leadsSearch,
        leadIdents,
        localDate,
        parseLeadsState,
        splitLeads,
        visibleLeads,
        type LeadsState
    } from '$lib/state/feeds/leads';
    import { asText } from '$lib/state/forms/schema';
    import { t } from '$lib/state/words/text';
    import { cardCursor } from '$lib/state/client/instance';
    import { feedIdents } from '$lib/state/workbench/palette';
    import { viewSourceFile } from '$lib/state/sessions/view-source';
    import type { ViewProps } from '../../registry';
    import { useState } from '$lib/state/client/use';

    const {
        entities: { config },
        feeds: { feed },
        formDrafts: { toggleAdd },
        selectors: { configMap },
        ui: { instanceState, setInstanceState },
        writes: { addLead }
    } = useState();

    let { instance }: ViewProps = $props();

    const today = localDate(Date.now());
    const data = $derived(feed('leads'));
    const held = $derived(parseLeadsState(instanceState(instance.id)));
    const cursor = $derived(cardCursor(instance.state));
    const vocab = $derived(config()?.config ?? {});
    const entries = $derived(data?.entries ?? []);
    const identOf = $derived(feedIdents('leads', entries));
    const leadOf = $derived(leadIdents(entries));
    const dismissed = $derived(dismissedCount(entries));
    const split = $derived(splitLeads(visibleLeads(entries, held.showDismissed), today));
    const dismissedToggleLabel = $derived(
        held.showDismissed
            ? t('leads.hide_dismissed', dismissed)
            : t('leads.show_dismissed', dismissed)
    );
    const live = $derived(leadsSearch(split.live, held.search));
    const expired = $derived(leadsSearch(split.expired, held.search));
    /** How many run-log lines the section shows before the reader asks for the rest. */
    const LOG_LINES = 6;

    const log = $derived(
        Array.isArray(data?.meta.log)
            ? data.meta.log
                  .filter(
                      (line): line is string | number =>
                          typeof line === 'string' || typeof line === 'number'
                  )
                  .map(String)
            : []
    );
    const shownLog = $derived(held.logAll ? log : log.slice(0, LOG_LINES));
    /** The feed file this view is drawn from, offered once the feed says the file is there. */
    const source = $derived(
        data === null || data.missing ? null : viewSourceFile('leads', configMap())
    );
    let said = $state('');

    function write(next: Partial<LeadsState>): void {
        setInstanceState(instance.id, { ...held, ...next });
    }

    /**
     * Dismissed is one of the statuses that close a lead, so a dismissed card is drawn in the
     * expired section. Turning the toggle on opens that section, or the count would change and
     * nothing new would appear.
     */
    function showing(on: boolean): Partial<LeadsState> {
        return on ? { showDismissed: true, expiredOpen: true } : { showDismissed: false };
    }
</script>

{#snippet tools()}
    <Toolbar label={t('leads.search')}>
        <Search
            value={held.search}
            placeholder={t('leads.search')}
            oninput={(search: string) => write({ search })}
        />
        <ToolButton
            label={t('leads.add')}
            title={t('leads.add_tip')}
            active={held.adding}
            onclick={() => write({ adding: toggleAdd(instance.id, 'leads', held.adding) })}
        />
        {#if dismissed > 0}
            <ToolButton
                label={dismissedToggleLabel}
                glyph="dismiss"
                active={held.showDismissed}
                pressed={held.showDismissed}
                onclick={() => write(showing(!held.showDismissed))}
            />
        {/if}
        {#if source !== null}
            <SourceButton file={source} />
        {/if}
    </Toolbar>
{/snippet}

<Pane title={t('views.leads')} toolbar={tools}>
    <div class="leads" data-instance={instance.id}>
        {#if data === null}
            <Empty message={t('app.waiting')} glyph="scout" />
        {:else if data.missing}
            <Empty message={t('leads.no_file')} glyph="warn" />
        {:else if data.error !== undefined}
            <Empty message={t('radar.feed_error', data.file, data.error)} glyph="warn" />
        {:else}
            <Intro
                html={t(
                    'leads.intro',
                    split.live.length,
                    split.expired.length > 0 ? t('leads.exp_note', split.expired.length) : ''
                )}
            />

            {#if said !== ''}
                <p class="said">{said}</p>
            {/if}

            {#if held.adding}
                <EntryForm
                    collection="leads"
                    schema={data.schema}
                    entry={null}
                    onadd={addLead}
                    onclose={() => write({ adding: false })}
                    onsaid={(words: string) => (said = words)}
                />
            {/if}

            {#if split.live.length > 0}
                <div class="cards">
                    {#each live as entry, at (`${asText(entry.title)}:${at}`)}
                        <Reveal
                            id={identOf(entry)}
                            wanted={held.reveal}
                            onrevealed={() => write({ reveal: '' })}
                        >
                            <LeadCard
                                {entry}
                                {vocab}
                                cursor={cursor === leadOf(entry)}
                                onsaid={(words: string) => (said = words)}
                            />
                        </Reveal>
                    {/each}
                </div>
            {:else}
                <!-- eslint-disable-next-line svelte/no-at-html-tags -- a catalog line, which oculus wrote -->
                <p class="empty">{@html t('leads.empty')}</p>
            {/if}

            {#if split.expired.length > 0}
                <section class="disclosure">
                    <ToolButton
                        label={t('leads.expired_sec', expired.length)}
                        glyph="deadline"
                        active={held.expiredOpen}
                        expanded={held.expiredOpen}
                        onclick={() => write({ expiredOpen: !held.expiredOpen })}
                    />
                    {#if held.expiredOpen}
                        <div class="cards">
                            {#each expired as entry, at (`${asText(entry.title)}:${at}`)}
                                <Reveal
                                    id={identOf(entry)}
                                    wanted={held.reveal}
                                    onrevealed={() => write({ reveal: '' })}
                                >
                                    <LeadCard
                                        {entry}
                                        {vocab}
                                        cursor={cursor === leadOf(entry)}
                                        expired
                                        onsaid={(words: string) => (said = words)}
                                    />
                                </Reveal>
                            {/each}
                        </div>
                    {/if}
                </section>
            {/if}

            {#if log.length > 0}
                <section class="disclosure">
                    <ToolButton
                        label={t('leads.runlog')}
                        glyph="scout"
                        active={held.runlogOpen}
                        expanded={held.runlogOpen}
                        onclick={() => write({ runlogOpen: !held.runlogOpen })}
                    />
                    {#if held.runlogOpen}
                        <ul class="runlog">
                            {#each shownLog as line, at (`${at}:${line}`)}
                                <!-- eslint-disable-next-line svelte/no-at-html-tags -- inline Markdown sanitises what it renders -->
                                <li>{@html inlineMarkdown(line)}</li>
                            {/each}
                        </ul>
                        {#if log.length > LOG_LINES}
                            <ToolButton
                                label={held.logAll
                                    ? t('leads.log_fewer')
                                    : t('leads.log_all', log.length)}
                                active={held.logAll}
                                onclick={() => write({ logAll: !held.logAll })}
                            />
                        {/if}
                    {/if}
                </section>
            {/if}
        {/if}
    </div>
</Pane>

<style>
    .leads {
        display: grid;
        gap: 12px;
    }

    .said,
    .empty {
        margin: 0;
    }

    .said,
    .empty {
        color: var(--muted-txt, var(--muted));
    }

    .empty {
        padding: 10px 0;
        font-size: var(--fs-md);
    }

    .cards {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(min(340px, 100%), 1fr));
        gap: 8px;
        margin-top: 8px;
    }

    .disclosure {
        padding-top: 8px;
        border-top: 1px solid var(--line);
    }

    .runlog {
        display: grid;
        gap: 6px;
        margin: 8px 0 0;
        padding-left: 24px;
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-sm);
    }
</style>
