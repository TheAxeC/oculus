<script lang="ts">
    // Layer 3, view. Position Leads reads its feed on request, splits live from expired entries,
    // and keeps search plus the expired and run-log disclosures in this view instance's state.

    import Empty from '$lib/ui/Empty.svelte';
    import Pane from '$lib/ui/Pane.svelte';
    import Search from '$lib/ui/Search.svelte';
    import Toolbar from '$lib/ui/Toolbar.svelte';
    import ToolButton from '$lib/ui/ToolButton.svelte';
    import LeadCard from './leads/LeadCard.svelte';
    import EntryForm from './shared/EntryForm.svelte';
    import Intro from './shared/Intro.svelte';
    import Reveal from './shared/Reveal.svelte';
    import { inlineMarkdown } from '$lib/state/collection';
    import { config } from '$lib/state/entities.svelte';
    import { feed } from '$lib/state/feeds.svelte';
    import {
        leadsSearch,
        localDate,
        parseLeadsState,
        splitLeads,
        type LeadsState
    } from '$lib/state/leads';
    import { t } from '$lib/state/text';
    import { feedIdentity } from '$lib/state/palette';
    import { instanceState, setInstanceState } from '$lib/state/ui.svelte';
    import { addLead } from '$lib/state/writes.svelte';
    import type { ViewProps } from './registry';

    let { instance }: ViewProps = $props();

    const today = localDate(Date.now());
    const data = $derived(feed('leads'));
    const held = $derived(parseLeadsState(instanceState(instance.id)));
    const vocab = $derived(config()?.config ?? {});
    const split = $derived(splitLeads(data?.entries ?? [], today));
    const live = $derived(leadsSearch(split.live, held.search));
    const expired = $derived(leadsSearch(split.expired, held.search));
    const log = $derived(
        Array.isArray(data?.meta.log)
            ? data.meta.log
                  .filter(
                      (line): line is string | number =>
                          typeof line === 'string' || typeof line === 'number'
                  )
                  .slice(0, 6)
                  .map(String)
            : []
    );
    let said = $state('');

    function write(next: Partial<LeadsState>): void {
        setInstanceState(instance.id, { ...held, ...next });
    }
</script>

{#snippet tools()}
    <Toolbar label={t('sf.leads_search')}>
        <Search
            value={held.search}
            placeholder={t('sf.leads_search')}
            oninput={(search) => write({ search })}
        />
        <ToolButton
            label={t('sf.leads_add')}
            title={t('sf.leads_add_tip')}
            active={held.adding}
            onclick={() => write({ adding: !held.adding })}
        />
    </Toolbar>
{/snippet}

<Pane title={t('views.leads')} toolbar={tools}>
    <div class="leads" data-instance={instance.id}>
        {#if data === null}
            <Empty message={t('app.waiting')} glyph="scout" />
        {:else if data.missing}
            <Empty message={t('sf.leads_no_file')} glyph="warn" />
        {:else if data.error !== undefined}
            <Empty message={t('radar.feed_error', data.file, data.error)} glyph="warn" />
        {:else}
            <Intro
                html={t(
                    'sf.leads_intro',
                    split.live.length,
                    split.expired.length > 0 ? t('sf.leads_exp_note', split.expired.length) : ''
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
                    onsaid={(words) => (said = words)}
                />
            {/if}

            {#if live.length > 0}
                <div class="cards">
                    {#each live as entry, at (`${String(entry.title ?? '')}:${at}`)}
                        <Reveal
                            id={feedIdentity('leads', entry)}
                            wanted={held.reveal}
                            onrevealed={() => write({ reveal: '' })}
                        >
                            <LeadCard {entry} {vocab} onsaid={(words) => (said = words)} />
                        </Reveal>
                    {/each}
                </div>
            {:else if split.live.length === 0}
                <p class="empty">{@html t('sf.leads_empty')}</p>
            {/if}

            {#if split.expired.length > 0}
                <section class="disclosure">
                    <ToolButton
                        label={t('sf.leads_expired_sec', expired.length)}
                        glyph="deadline"
                        active={held.expiredOpen}
                        expanded={held.expiredOpen}
                        onclick={() => write({ expiredOpen: !held.expiredOpen })}
                    />
                    {#if held.expiredOpen}
                        <div class="cards">
                            {#each expired as entry, at (`${String(entry.title ?? '')}:${at}`)}
                                <Reveal
                                    id={feedIdentity('leads', entry)}
                                    wanted={held.reveal}
                                    onrevealed={() => write({ reveal: '' })}
                                >
                                    <LeadCard
                                        {entry}
                                        {vocab}
                                        expired
                                        onsaid={(words) => (said = words)}
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
                        label={t('sf.leads_runlog')}
                        glyph="scout"
                        active={held.runlogOpen}
                        expanded={held.runlogOpen}
                        onclick={() => write({ runlogOpen: !held.runlogOpen })}
                    />
                    {#if held.runlogOpen}
                        <ul class="runlog">
                            {#each log as line, at (`${at}:${line}`)}
                                <li>{@html inlineMarkdown(line)}</li>
                            {/each}
                        </ul>
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
        font-size: var(--fs-md);
    }
</style>
