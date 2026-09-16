<script module lang="ts">
    // Layer 3, view registration. Inbox follows Position Leads in the feeds group. The rail badge is
    // how many threads of the live plate are still waiting on an answer or an action.
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
    // Layer 3, view. The inbox plate read live from the reader's own mailboxes: the connector's
    // head, one row per configured account with its Connect control, and the plate in four sections
    // by what each thread wants.
    //
    // Everything drawn here comes from the `inbox` channel, so the view holds no copy of the plate
    // and a publish redraws it. Search and the triaged disclosure are this view instance's own
    // state; the note, the answer and the archive are writes through the mail endpoint.

    import Empty from '$lib/ui/Empty.svelte';
    import Pane from '$lib/ui/Pane.svelte';
    import Search from '$lib/ui/Search.svelte';
    import Toolbar from '$lib/ui/Toolbar.svelte';
    import ToolButton from '$lib/ui/ToolButton.svelte';
    import Accounts from './inbox/Accounts.svelte';
    import Head from './inbox/Head.svelte';
    import InboxCard from './inbox/InboxCard.svelte';
    import Reveal from './shared/Reveal.svelte';
    import {
        accountOf,
        inboxSearch,
        parseInboxState,
        type InboxState,
        type InboxThread,
        type MailAccount
    } from '$lib/state/inbox';
    import { t } from '$lib/state/text';
    import { cardCursor } from '$lib/state/instance';
    import type { ViewProps } from './registry';
    import { useState } from '$lib/state/use';

    const {
        clock: { startMinuteClock },
        inbox: { archive, busy, connect, connecting, refresh, reply, split, state: plate, triage },
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
    const liveCount = $derived(
        sections.unsorted.length +
            sections.replies.length +
            sections.actions.length +
            sections.info.length
    );
    let said: string = $state('');

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
    <Toolbar label={t('inbox.search')}>
        <Search
            value={held.search}
            placeholder={t('inbox.search')}
            oninput={(search: string) => write({ search })}
        />
    </Toolbar>
{/snippet}

{#snippet card(thread: InboxThread)}
    <Reveal id={thread.id} wanted={held.reveal} onrevealed={() => write({ reveal: '' })}>
        <InboxCard
            {thread}
            id={thread.id}
            cursor={cursor === thread.id}
            account={labelOf(thread)}
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
            <h3>{label} ({threads.length})</h3>
            <div class="cards">
                {#each threads as thread (thread.id)}
                    <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
                    {@render card(thread)}
                {/each}
            </div>
        </section>
    {/if}
{/snippet}

<Pane title={t('views.inbox')} toolbar={tools}>
    <div class="inbox" data-instance={instance.id}>
        <Head {data} onrefresh={() => void refresh()} />

        {#if data && data.accounts.length > 0}
            <Accounts
                rows={data.accounts}
                {connecting}
                onconnect={(account: MailAccount) => void connect(account)}
            />
        {/if}

        {#if data === null}
            <Empty message={t('app.waiting')} glyph="inbox" />
        {:else if data.status === 'unconfigured'}
            <Empty message={t('inbox.no_accounts')} glyph="inbox" />
        {:else}
            {#if said !== ''}
                <p class="said">{said}</p>
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
    .inbox {
        display: grid;
        gap: 12px;
    }

    .said {
        margin: 0;
        color: var(--muted-txt, var(--muted));
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
