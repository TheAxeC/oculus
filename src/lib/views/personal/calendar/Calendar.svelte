<script module lang="ts">
    // Layer 3, view registration. The agenda sits in the Personal group after the photo wall, since
    // what it holds is the reader's own days rather than a fact about the hub. The view's badge is
    // how many of today's events have not ended yet, and nothing when none are left.
    import type { ViewRegistration } from '$lib/state/workbench/navigation/registry';

    export const registration: ViewRegistration = {
        id: 'calendar',
        label: 'views.calendar',
        glyph: 'views.calendar_glyph',
        group: 'personal',
        order: 1,
        badge: (client) => client.calendar.badgeText(),
        badgeTitle: (client) => client.railBadges.calendarBadgeTitle(),
        badgeCells: (client) => client.railBadges.calendarCells(),
        badgeTabText: () => ''
    };
</script>

<script lang="ts">
    // Layer 3, view. The read-only calendar: the connector's head with its account controls, the
    // Add form while it is open, one row per configured account, and the agenda of the configured
    // window grouped by day. A machine with no account says so and offers Add in its place.
    //
    // Everything drawn here comes from the `calendar` channel, so the view holds no copy of the
    // agenda and a publish redraws it. The Command centre, the ticker and the Focus board read the
    // hub's own files and are untouched by any of it.

    import Pane from '$lib/ui/frame/Pane.svelte';
    import AccountList from '../../shared/accounts/AccountList.svelte';
    import AddAccount from '../../shared/accounts/AddAccount.svelte';
    import ConnectorHead from '../../shared/accounts/ConnectorHead.svelte';
    import NoAccounts from '../../shared/accounts/NoAccounts.svelte';
    import Agenda from './Agenda.svelte';
    import { t } from '$lib/state/shared/words/text';
    import type { HeadWords } from '$lib/state/life/accounts';
    import type { ViewProps } from '$lib/state/workbench/navigation/registry';
    import { useState } from '$lib/state/client/use';

    const {
        calendar: { days, openEvent, refresh, state: agenda },
        clock: { startMinuteClock }
    } = useState();
    let { instance }: ViewProps = $props();

    // The agenda's today heading and its remaining count are measured from the page's own minute,
    // which the store reads; running the clock here is what makes them move while the view is open.
    $effect(startMinuteClock);
    const data = $derived(agenda());
    const groups = $derived(days());
    /** Whether the Add form is open, which is this view's own and no other's. */
    let adding = $state(false);
    /** What the last refresh or event open said went wrong, or the empty string. */
    let said = $state('');

    /** The head's words, read from the catalog at each draw. */
    function headWords(): HeadWords {
        return {
            polling: t('calendar.polling'),
            unconfigured: t('calendar.unconfigured'),
            error: t('calendar.error'),
            live: t('calendar.live'),
            asOf: (at) => t('calendar.as_of', at),
            asOfLate: (at) => t('calendar.as_of_late', at),
            retrying: (minutes) => t('calendar.retrying', minutes),
            every: (minutes) => t('calendar.every', minutes),
            refresh: t('calendar.refresh_now')
        };
    }
</script>

<!-- The pane is the frame every view has; the head inside it is the connector's own status
     line. -->
<Pane title={t('views.calendar')} tinted>
    <div class="calendar" data-instance={instance.id}>
        <ConnectorHead
            {data}
            words={headWords()}
            onrefresh={() => void refresh().then((words) => (said = words))}
            {adding}
            onadd={() => (adding = !adding)}
        />
        {#if adding}
            <AddAccount kind="calendar" onclose={() => (adding = false)} />
        {/if}
        {#if said !== ''}
            <p class="said">{said}</p>
        {/if}
        {#if data && data.accounts.length > 0}
            <AccountList kind="calendar" rows={data.accounts} />
        {:else if data && !adding}
            <NoAccounts
                message={t('accounts.empty_calendar')}
                glyph={t('views.calendar_glyph')}
                onadd={() => (adding = true)}
            />
        {/if}
        {#if data && data.status !== 'unconfigured'}
            <Agenda
                days={groups}
                onopen={(id: string) => void openEvent(id).then((words) => (said = words))}
            />
        {/if}
        {#if data}
            <footer>{t('calendar.footer', data.daysBack, data.daysAhead)}</footer>
        {/if}
    </div>
</Pane>

<style>
    .calendar {
        display: flex;
        flex-direction: column;
        gap: 10px;
        min-width: 0;
    }
    .said {
        margin: 0;
        color: var(--muted-txt, var(--muted));
    }
    footer {
        margin-top: 12px;
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-sm);
    }
</style>
