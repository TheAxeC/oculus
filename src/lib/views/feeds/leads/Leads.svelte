<script module lang="ts">
    // Layer 3, view registration. Position Leads follows Inbox in the Incoming page's group.
    import type { ViewRegistration } from '$lib/state/workbench/navigation/registry';
    export const registration: ViewRegistration = {
        id: 'leads',
        label: 'views.leads',
        glyph: 'views.leads_glyph',
        group: 'incoming',
        order: 2,
        badge: (client) => client.railBadges.leadsBadge(),
        badgeTone: () => 'amber',
        countPart: (client) => ({ count: client.railBadges.leadsCount(), tone: 'amber' })
    };
</script>

<script lang="ts">
    // Layer 3, view. Position Leads reads its socket feed, splits live from expired entries, and
    // keeps search plus the Expired and run-log folds in this view instance's state (`expiredOpen`,
    // `runlogOpen`, each starting closed). The live cards and the expired ones are drawn in the
    // shared card grid (views/shared/card/record/CardGrid.svelte); Expired and the run log are each
    // the group every grouping of a view is drawn as (ui/controls/heads/GroupHead.svelte), Expired
    // with the count of the expired leads the search leaves. The bar's right end holds the count of
    // the live leads, as a board shows its count.
    //
    // Add asks the new lead's title, writes the lead to the leads file of the primary hub (else the
    // first), dated today, and opens the lead's page, where the rest is filled in. A lead's title
    // opens its page too. A lead's `applied` control opens the Applications file beside the leads
    // with an entry filled from the lead in its unsaved text, and then sets the lead `applied`
    // (views/shared/card/feed/lead-apply.ts, which the lead's page reaches through the same card).
    // The controls that write the leads file are disabled while a source tab holds unsaved text of
    // it.
    //
    // Over a wallpaper each card is its own surface; the said line and the run log are read off a
    // `Surface`.

    import Chip from '$lib/ui/controls/Chip.svelte';
    import Empty from '$lib/ui/frame/Empty.svelte';
    import Pane from '$lib/ui/frame/Pane.svelte';
    import Surface from '$lib/ui/frame/Surface.svelte';
    import Search from '$lib/ui/controls/text/Search.svelte';
    import Toolbar from '$lib/ui/frame/toolbar/Toolbar.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import FeedFile from '../../shared/card/feed/FeedFile.svelte';
    import LeadCard from '../../shared/card/feed/LeadCard.svelte';
    import AddAsk from '../../shared/forms/entry/AddAsk.svelte';
    import { leadAsk, type Ask } from '../../shared/forms/entry/entry-add';
    import { blockedBy } from '../../shared/forms/entry-file';
    import GroupHead from '$lib/ui/controls/heads/GroupHead.svelte';
    import CardGrid from '../../shared/card/record/CardGrid.svelte';
    import Reveal from '../../shared/card/Reveal.svelte';
    import SourceToolbar from '../../shared/links/SourceToolbar.svelte';
    import { inlineMarkdown } from '$lib/ui/html';
    import { createCardMath } from '$lib/views/shared/latex/card-math.svelte';
    import {
        declinedCount,
        leadIdents,
        leadsSearch,
        localDate,
        parseLeadsState,
        runLog,
        splitLeads,
        visibleLeads,
        type LeadEntry,
        type LeadsState
    } from '$lib/state/feeds/leads';
    import { asText } from '$lib/state/forms/schema';
    import { entryPageState } from '$lib/state/forms/page-entry';
    import { LEADS_FEED } from '$lib/state/feeds/lead-application';
    import { t } from '$lib/state/shared/words/text';
    import { cardCursor, storedState } from '$lib/state/workbench/layout/instance';
    import { feedIdents } from '$lib/state/shared/page/idents';
    import { viewSourceFile } from '$lib/state/sessions/view-source';
    import type { ViewProps } from '$lib/state/workbench/navigation/registry';
    import { useState } from '$lib/state/client/use';
    import { vocabOf } from '$lib/state/shared/words/tones';

    const client = useState();
    const {
        entities: { config },
        feeds: { feed },
        layout: { openView },
        selectors: { configMap },
        source: { unsavedFile },
        ui: { instanceState, setInstanceState }
    } = client;

    let { instance }: ViewProps = $props();

    /** How this component's Markdown fields draw their formulas, once KaTeX is in. */
    const cardMath = createCardMath();

    const today = localDate(Date.now());
    const data = $derived(feed('leads'));
    const held = $derived(parseLeadsState(instanceState(instance.id)));
    const cursor = $derived(cardCursor(instance.state));
    const vocab = $derived(config()?.config ?? {});
    const entries = $derived(data?.entries ?? []);
    const identOf = $derived(feedIdents('leads', entries));
    const leadOf = $derived(leadIdents(entries));
    const declined = $derived(declinedCount(vocab, entries, vocabOf));
    const split = $derived(
        splitLeads(vocab, visibleLeads(vocab, entries, held.showDeclined, vocabOf), today, vocabOf)
    );
    /** What pressing the declined toggle does, said in its tooltip: its own words are fixed. */
    const declinedToggleTip = $derived(
        held.showDeclined ? t('leads.hide_declined', declined) : t('leads.show_declined', declined)
    );
    const live = $derived(leadsSearch(split.live, held.search));
    const expired = $derived(leadsSearch(split.expired, held.search));
    /** How many run-log lines the section shows before the reader asks for the rest. */
    const LOG_LINES = 6;

    const log = $derived(runLog(data?.meta));
    const shownLog = $derived(held.logAll ? log : log.slice(0, LOG_LINES));
    /** The feed file this view is drawn from, offered once the feed says the file is there. */
    const source = $derived(
        data === null || data.missing
            ? null
            : viewSourceFile('leads', configMap(), client.fs.primary())
    );
    /** Why the controls that write the leads file are disabled, '' when they are not. */
    const blocked = $derived(
        blockedBy(source, source !== null && unsavedFile(source.root, source.path), undefined)
    );
    let said = $state('');

    function write(next: Partial<LeadsState>): void {
        setInstanceState(instance.id, storedState({ ...held, ...next }));
    }

    /** The Add box while it is open: it asks the new lead's title and opens the lead's page. */
    let asking = $state<Ask | null>(null);

    /** The page of one lead, opened from its title. */
    function openPage(entry: LeadEntry): void {
        const title = asText(entry.title);
        openView('entry', entryPageState(LEADS_FEED, identOf(entry), title));
    }

    /**
     * Declined is one of the statuses that close a lead, so a declined card is drawn in the expired
     * section. Turning the toggle on opens that section, or the count would change and nothing new
     * would appear.
     */
    function showing(on: boolean): Partial<LeadsState> {
        return on ? { showDeclined: true, expiredOpen: true } : { showDeclined: false };
    }
</script>

{#snippet tools()}
    <SourceToolbar {source} label={t('leads.toolbar')}>
        <ToolButton
            bare
            glyph="add"
            label={t('leads.add')}
            title={t('leads.add_tip')}
            onclick={() => (asking = leadAsk(client))}
        />
    </SourceToolbar>
{/snippet}

{#snippet bar()}
    <Toolbar label={t('leads.filters')}>
        <Search
            fill
            value={held.search}
            placeholder={t('leads.search')}
            oninput={(search: string) => write({ search })}
        />
        {#if declined > 0}
            <Chip
                label={t('leads.declined', declined)}
                title={declinedToggleTip}
                glyph="dismiss"
                pressed={held.showDeclined}
                onclick={() => write(showing(!held.showDeclined))}
            />
        {/if}
        {#if data !== null && !data.missing && data.error === undefined}
            <span class="count">{t('leads.count', split.live.length)}</span>
        {/if}
    </Toolbar>
{/snippet}

<AddAsk ask={asking} onclose={() => (asking = null)} />

<Pane title={t('views.leads')} toolbar={tools} {bar}>
    <div class="leads" data-instance={instance.id}>
        <FeedFile {data} glyph="scout" missing={t('leads.no_file')}>
            {#if said !== ''}
                <Surface>
                    <p class="said">{said}</p>
                </Surface>
            {/if}

            {#if split.live.length > 0}
                <CardGrid>
                    {#each live as entry, at (`${asText(entry.title)}:${at}`)}
                        <Reveal
                            id={identOf(entry)}
                            wanted={held.reveal}
                            onrevealed={() => write({ reveal: '' })}
                        >
                            <LeadCard
                                {entry}
                                cursor={cursor === leadOf(entry)}
                                onsaid={(words: string) => (said = words)}
                                beside={instance.id}
                                onpage={() => openPage(entry)}
                                {blocked}
                            />
                        </Reveal>
                    {/each}
                </CardGrid>
            {:else}
                <Empty message={t('leads.empty')} glyph="scout" />
            {/if}

            {#if split.expired.length > 0}
                <GroupHead
                    label={t('leads.expired_sec')}
                    glyph="deadline"
                    count={expired.length}
                    open={held.expiredOpen}
                    ontoggle={() => write({ expiredOpen: !held.expiredOpen })}
                >
                    <CardGrid>
                        {#each expired as entry, at (`${asText(entry.title)}:${at}`)}
                            <Reveal
                                id={identOf(entry)}
                                wanted={held.expiredOpen ? held.reveal : ''}
                                onrevealed={() => write({ reveal: '' })}
                            >
                                <LeadCard
                                    {entry}
                                    cursor={cursor === leadOf(entry)}
                                    expired
                                    onsaid={(words: string) => (said = words)}
                                    beside={instance.id}
                                    onpage={() => openPage(entry)}
                                    {blocked}
                                />
                            </Reveal>
                        {/each}
                    </CardGrid>
                </GroupHead>
            {/if}

            {#if log.length > 0}
                <GroupHead
                    label={t('leads.runlog')}
                    glyph="scout"
                    open={held.runlogOpen}
                    ontoggle={() => write({ runlogOpen: !held.runlogOpen })}
                >
                    <Surface>
                        <ul class="runlog">
                            {#each shownLog as line, at (`${at}:${line}`)}
                                <!-- eslint-disable-next-line svelte/no-at-html-tags -- inline Markdown sanitises what it renders -->
                                <li>{@html inlineMarkdown(line, cardMath(line))}</li>
                            {/each}
                        </ul>
                    </Surface>
                    {#if log.length > LOG_LINES}
                        <ToolButton
                            label={held.logAll
                                ? t('leads.log_fewer')
                                : t('leads.log_all', log.length)}
                            active={held.logAll}
                            onclick={() => write({ logAll: !held.logAll })}
                        />
                    {/if}
                </GroupHead>
            {/if}
        </FeedFile>
    </div>
</Pane>

<style>
    /* One column the width of the pane, however long a line inside it: a grid's own column would
       otherwise grow to the widest line it holds and widen the pane. */
    .leads {
        display: grid;
        grid-template-columns: minmax(0, 1fr);
        gap: 12px;
    }

    /* A part on a `Surface` is the grid's item through the Surface's box over a wallpaper and by
       itself without one (`display: contents`), so both shrink to the column. */
    .leads > :global(*),
    .leads > :global([data-surface]) > :global(*) {
        min-width: 0;
    }

    .said {
        margin: 0;
        color: var(--muted-txt, var(--muted));
    }

    /* The count at the bar's right end, as a board draws its count. */
    .count {
        margin-left: auto;
        font-size: var(--fs-xs);
        white-space: nowrap;
        color: var(--muted-txt, var(--muted));
    }

    .runlog {
        display: grid;
        gap: 6px;
        margin: 0;
        padding-left: 24px;
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-sm);
    }
</style>
