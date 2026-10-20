<script module lang="ts">
    // Layer 3, view registration. Inbox opens the Incoming page's group. The view's badge is how
    // many threads of the live plate are still waiting on an answer or an action, in red; its row
    // of `counts` in config/layout.yml says where the count is drawn.
    import type { ViewRegistration } from '$lib/state/workbench/navigation/registry';
    import type { ViewProps } from '$lib/state/workbench/navigation/registry';
    export const registration: ViewRegistration = {
        id: 'inbox',
        label: 'views.inbox',
        glyph: 'views.inbox_glyph',
        group: 'incoming',
        order: 0,
        badge: (client) => client.railBadges.inboxBadge(),
        badgeTone: () => 'red',
        countPart: (client) => ({ count: client.railBadges.inboxCount(), tone: 'red' })
    };
</script>

<script lang="ts">
    // Layer 3, view. The inbox plate read live from the reader's own mailboxes: the connector's
    // head with its account controls, the Add form while it is open, one row per configured
    // account, and the plate in four sections by what each thread wants. A machine with no account
    // says so and offers the Add form in its place.
    //
    // Everything drawn here comes from the `inbox` channel, so the view holds no copy of the plate
    // and a publish redraws it. Search and the triaged disclosure are this view instance's own
    // state; the note, the answer and the archive are writes through the mail endpoint. Each
    // section is one column of cards, read top to bottom, and a card names its account only while
    // more than one mail account is configured.
    //
    // Over a wallpaper each card is its own surface; the account rows, the add form, the said line
    // and each section's heading are read off a `Surface`.

    import Empty from '$lib/ui/frame/Empty.svelte';
    import Pane from '$lib/ui/frame/Pane.svelte';
    import Surface from '$lib/ui/frame/Surface.svelte';
    import Search from '$lib/ui/controls/text/Search.svelte';
    import Toolbar from '$lib/ui/frame/toolbar/Toolbar.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import AccountActions from '../../shared/forms/accounts/AccountActions.svelte';
    import AccountList from '../../shared/forms/accounts/AccountList.svelte';
    import AddAccount from '../../shared/forms/accounts/AddAccount.svelte';
    import ConnectorHead from '../../shared/forms/accounts/ConnectorHead.svelte';
    import NoAccounts from '../../shared/forms/accounts/NoAccounts.svelte';
    import InboxCard from './InboxCard.svelte';
    import Reveal from '../../shared/card/Reveal.svelte';
    import {
        accountOf,
        inboxSearch,
        parseInboxState,
        plateCount,
        type InboxState,
        type InboxThread
    } from '$lib/state/feeds/inbox';
    import type { HeadWords } from '$lib/state/life/accounts';
    import { t } from '$lib/state/shared/words/text';
    import { cardCursor } from '$lib/state/workbench/layout/instance';
    import { useState } from '$lib/state/client/use';

    const {
        clock: { startMinuteClock },
        inbox: { archive, busy, refresh, reply, split, state: plate, triage },
        ui: { instanceState, setInstanceState }
    } = useState();

    let { instance }: ViewProps = $props();

    // A card draws how old its thread is, which ages between publishes, so the page's minute clock
    // runs while the view is open.
    $effect(startMinuteClock);
    const data = $derived(plate());
    const held = $derived(parseInboxState(instanceState(instance.id)));
    const cursor = $derived(cardCursor(instance.state));
    const sections = $derived(split());
    const unsorted = $derived(inboxSearch(sections.unsorted, held.search));
    const replies = $derived(inboxSearch(sections.replies, held.search));
    const actions = $derived(inboxSearch(sections.actions, held.search));
    const info = $derived(inboxSearch(sections.info, held.search));
    const triaged = $derived(inboxSearch(sections.triaged, held.search));
    const liveCount = $derived(plateCount(sections));
    let said: string = $state('');
    /** Whether the Add form is open, which is this view's own and no other's. */
    let adding = $state(false);

    /** The head's words, read from the catalog at each draw. */
    function headWords(): HeadWords {
        return {
            polling: t('inbox.polling'),
            unconfigured: t('inbox.unconfigured'),
            error: t('inbox.error'),
            live: t('inbox.live'),
            asOf: (at) => t('inbox.as_of', at),
            asOfLate: (at) => t('inbox.as_of_late', at),
            retrying: (minutes) => t('inbox.retrying', minutes),
            every: (minutes) => t('inbox.every', minutes),
            refresh: t('inbox.refresh_now')
        };
    }

    function write(next: Partial<InboxState>): void {
        setInstanceState(instance.id, { ...held, ...next });
    }

    /** Open or close one thread's draft editor, which is this view instance's own state. */
    function showDraft(thread: InboxThread, open: boolean): void {
        const rest = held.drafts.filter((one) => one !== thread.id);
        write({ drafts: open ? [...rest, thread.id] : rest });
    }

    /** The account's own label, which a card's tag and its two confirmations name it by. */
    function labelOf(thread: InboxThread): string {
        return accountOf(data?.accounts ?? [], thread)?.label ?? thread.account;
    }
</script>

{#snippet tools()}
    <AccountActions bind:adding />
{/snippet}

{#snippet bar()}
    <ConnectorHead
        {data}
        words={headWords()}
        notice={data?.notesError ? t('inbox.notes_error', data.notesError) : ''}
        onrefresh={() =>
            void refresh().then((answer) => (said = answer.ok ? '' : (answer.error ?? '')))}
    />
    <div class="filters">
        <Toolbar label={t('inbox.filters')}>
            <Search
                fill
                value={held.search}
                placeholder={t('inbox.search')}
                oninput={(search: string) => write({ search })}
            />
        </Toolbar>
    </div>
{/snippet}

{#snippet card(thread: InboxThread)}
    <Reveal id={thread.id} wanted={held.reveal} onrevealed={() => write({ reveal: '' })}>
        <InboxCard
            {thread}
            id={thread.id}
            cursor={cursor === thread.id}
            account={labelOf(thread)}
            accountTag={(data?.accounts.length ?? 0) > 1}
            busy={busy(thread)}
            draftOpen={held.drafts.includes(thread.id)}
            onshowdraft={showDraft}
            ontriage={triage}
            onreply={reply}
            onarchive={archive}
            onsaid={(words: string) => (said = words)}
        />
    </Reveal>
{/snippet}

{#snippet section(label: string, threads: InboxThread[])}
    {#if threads.length > 0}
        <section class="group">
            <Surface>
                <h3>{label} ({threads.length})</h3>
            </Surface>
            <div class="cards">
                {#each threads as thread (thread.id)}
                    <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
                    {@render card(thread)}
                {/each}
            </div>
        </section>
    {/if}
{/snippet}

<Pane title={t('views.inbox')} toolbar={tools} {bar}>
    <div class="inbox" data-instance={instance.id}>
        {#if adding}
            <Surface fitted>
                <AddAccount kind="mail" onclose={() => (adding = false)} />
            </Surface>
        {/if}

        {#if data && data.accounts.length > 0}
            <AccountList kind="mail" rows={data.accounts} />
        {/if}

        {#if data === null}
            <Empty message={t('app.waiting')} glyph="inbox" />
        {:else if data.status === 'unconfigured'}
            {#if !adding}
                <NoAccounts
                    message={t('accounts.empty_mail')}
                    glyph={t('views.inbox_glyph')}
                    onadd={() => (adding = true)}
                />
            {/if}
        {:else}
            {#if said !== ''}
                <Surface>
                    <p class="said">{said}</p>
                </Surface>
            {/if}

            <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
            {@render section(t('inbox.sec_unsorted'), unsorted)}
            <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
            {@render section(t('inbox.sec_reply'), replies)}
            <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
            {@render section(t('inbox.sec_action'), actions)}
            <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
            {@render section(t('inbox.sec_info'), info)}

            {#if liveCount === 0}
                <Empty message={t('inbox.clear')} glyph="done" />
            {/if}

            {#if sections.triaged.length > 0}
                <section class="triaged">
                    <ToolButton
                        label={`${t('inbox.triaged_sec')} (${sections.triaged.length})`}
                        glyph="done"
                        active={held.triagedOpen}
                        expanded={held.triagedOpen}
                        onclick={() => write({ triagedOpen: !held.triagedOpen })}
                    />
                    {#if held.triagedOpen && triaged.length > 0}
                        <div class="cards">
                            {#each triaged as thread (thread.id)}
                                <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
                                {@render card(thread)}
                            {/each}
                        </div>
                    {/if}
                </section>
            {/if}
        {/if}
    </div>
</Pane>

<style>
    /* One column the width of the pane, however long a line inside it: a grid's own column would
       otherwise grow to the widest line it holds and widen the pane. */
    .inbox {
        display: grid;
        grid-template-columns: minmax(0, 1fr);
        gap: 12px;
    }

    /* A part on a `Surface` is the grid's item through the Surface's box over a wallpaper and by
       itself without one (`display: contents`), so both shrink to the column. */
    .inbox > :global(*),
    .inbox > :global([data-surface]) > :global(*),
    .cards > :global(*) {
        min-width: 0;
    }

    /* The search takes a line of the bar of its own, under the connector's status. */
    .filters {
        display: flex;
        flex: 1 0 100%;
        min-width: 0;
    }

    .said {
        margin: 0;
        color: var(--muted-txt, var(--muted));
    }

    .group h3 {
        margin: 0;
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-xs);
        font-weight: 700;
        text-transform: uppercase;
    }

    /* One column, so the cards read top to bottom in the order the section sorted them. */
    .cards {
        display: flex;
        flex-direction: column;
        gap: 8px;
        margin-top: 8px;
    }

    .triaged {
        padding-top: 8px;
        border-top: 1px solid var(--line);
    }
</style>
