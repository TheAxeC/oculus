<script module lang="ts">
    // Layer 3, view registration. Position Leads follows Lit Watch in the Incoming page's group.
    import type { ViewRegistration } from '$lib/state/workbench/navigation/registry';
    export const registration: ViewRegistration = {
        id: 'leads',
        label: 'views.leads',
        glyph: 'views.leads_glyph',
        group: 'incoming',
        order: 2,
        badge: (client) => client.railBadges.leadsBadge(),
        badgeTone: () => 'amber'
    };
</script>

<script lang="ts">
    // Layer 3, view. Position Leads reads its socket feed, splits live from expired entries,
    // and keeps search plus the expired and run-log disclosures in this view instance's state.
    //
    // A lead's `applied` control opens the Applications add form beside the leads, prefilled from
    // the lead through state/feeds/lead-application.ts: the values go into that tab's form drafts,
    // as typed values do, so they are there after a reload and the tab asks before it closes over
    // them, and the tab's state names the lead, which the Applications view sets `applied` once the
    // form's entry is written. Nothing is written until the reader saves the form, and a cancel
    // writes nothing to the lead. An add form already holding typed text is asked about before the
    // lead replaces it.

    import Chip from '$lib/ui/controls/Chip.svelte';
    import Empty from '$lib/ui/frame/Empty.svelte';
    import Pane from '$lib/ui/frame/Pane.svelte';
    import Search from '$lib/ui/controls/text/Search.svelte';
    import Toolbar from '$lib/ui/frame/toolbar/Toolbar.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import LeadCard from './LeadCard.svelte';
    import AskConfirm from '../../shared/AskConfirm.svelte';
    import type { Ask } from '../../shared/ask';
    import EntryForm from '../../shared/forms/EntryForm.svelte';
    import Intro from '../../shared/prose/Intro.svelte';
    import Reveal from '../../shared/card/Reveal.svelte';
    import SourceButton from '../../shared/links/SourceButton.svelte';
    import { inlineMarkdown } from '$lib/ui/html';
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
    import { formFields } from '$lib/state/boards/collection';
    import {
        APPLICATIONS,
        holdsTyped,
        prefillFromLead,
        type ApplicationTab
    } from '$lib/state/feeds/lead-application';
    import { t } from '$lib/state/shared/words/text';
    import { cardCursor } from '$lib/state/workbench/layout/instance';
    import { feedIdents } from '$lib/state/feeds/idents';
    import { viewSourceFile } from '$lib/state/sessions/view-source';
    import type { ViewProps } from '$lib/state/workbench/navigation/registry';
    import { useState } from '$lib/state/client/use';

    const {
        entities: { config },
        feeds: { feed },
        formDrafts: { clearFormDraft, formEdits, setFormField, toggleAdd },
        layout: { openBeside },
        selectors: { collectionOf, configMap },
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
    const declined = $derived(declinedCount(entries));
    const split = $derived(splitLeads(visibleLeads(entries, held.showDeclined), today));
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
        data === null || data.missing ? null : viewSourceFile('leads', configMap())
    );
    let said = $state('');

    function write(next: Partial<LeadsState>): void {
        setInstanceState(instance.id, { ...held, ...next });
    }

    /** The replace question held while the reader is asked, or null while none is. */
    let asking: Ask | null = $state(null);

    /** The Applications tab's drafts and state, which the prefill writes. */
    const tab: ApplicationTab = {
        formEdits,
        clearFormDraft,
        setFormField,
        instanceState,
        setInstanceState
    };

    /**
     * Open the Applications add form beside the leads over what one lead says. A form there that
     * already holds typed text is asked about first, since the lead would replace it.
     */
    function toApplication(entry: LeadEntry): void {
        const id = openBeside(APPLICATIONS);
        if (id === '') return;
        const fill = (): void =>
            prefillFromLead(
                tab,
                id,
                entry,
                formFields(collectionOf(APPLICATIONS)?.schema, configMap())
            );
        if (!holdsTyped(tab, id)) {
            fill();
            return;
        }
        asking = {
            message: t('leads.action.to_application_replace'),
            detail: asText(entry.title),
            act: fill
        };
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
    <Toolbar label={t('leads.toolbar')} overflow>
        <ToolButton
            bare
            glyph="add"
            label={t('leads.add')}
            title={t('leads.add_tip')}
            active={held.adding}
            pressed={held.adding}
            onclick={() => write({ adding: toggleAdd(instance.id, 'leads', held.adding) })}
        />
        {#if source !== null}
            <SourceButton file={source} />
        {/if}
    </Toolbar>
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
    </Toolbar>
{/snippet}

<Pane title={t('views.leads')} toolbar={tools} {bar}>
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
                                onapply={() => toApplication(entry)}
                            />
                        </Reveal>
                    {/each}
                </div>
            {:else}
                <Empty message={t('leads.empty')} glyph="scout" />
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
                                        onapply={() => toApplication(entry)}
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

<AskConfirm {asking} onclose={() => (asking = null)} />

<style>
    /* One column the width of the pane, however long a line inside it: a grid's own column would
       otherwise grow to the widest line it holds and widen the pane. */
    .leads {
        display: grid;
        grid-template-columns: minmax(0, 1fr);
        gap: 12px;
    }

    .leads > :global(*),
    .cards > :global(*) {
        min-width: 0;
    }

    .said {
        margin: 0;
        color: var(--muted-txt, var(--muted));
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
