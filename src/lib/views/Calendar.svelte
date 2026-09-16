<script module lang="ts">
    // Layer 3, view registration. The agenda sits in the Personal group after the photo wall, since
    // what it holds is the reader's own days rather than a fact about the hub. The rail badge is how
    // many of today's events have not ended yet, and nothing when none are left.
    import type { ViewRegistration } from './registry';

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
    // Layer 3, view. The read-only calendar: the connector's head, one row per configured account
    // with its Connect control, and the agenda of the configured window grouped by day.
    //
    // Everything drawn here comes from the `calendar` channel, so the view holds no copy of the
    // agenda and a publish redraws it. The Command centre, the ticker and the Focus board read the
    // hub's own files and are untouched by any of it.

    import Pane from '$lib/ui/Pane.svelte';
    import Accounts from './calendar/Accounts.svelte';
    import Agenda from './calendar/Agenda.svelte';
    import Head from './calendar/Head.svelte';
    import { t } from '$lib/state/text';
    import type { ViewProps } from './registry';
    import { useState } from '$lib/state/use';

    const {
        calendar: { connect, connecting, days, openEvent, refresh, state },
        clock: { startMinuteClock }
    } = useState();
    let { instance }: ViewProps = $props();

    // The agenda's today heading and its remaining count are measured from the page's own minute,
    // which the store reads; running the clock here is what makes them move while the view is open.
    $effect(startMinuteClock);
    const data = $derived(state());
    const groups = $derived(days());
</script>

<!-- The pane is the frame every view has; the head inside it is the connector's own status line. -->
<Pane title={t('views.calendar')} tinted>
    <div class="calendar" data-instance={instance.id}>
        <Head {data} onrefresh={refresh} />
        {#if data && data.accounts.length > 0}
            <Accounts rows={data.accounts} {connecting} onconnect={connect} />
        {/if}
        {#if data && data.status !== 'unconfigured'}
            <Agenda days={groups} onopen={openEvent} />
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
    footer {
        margin-top: 12px;
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-sm);
    }
</style>
