<script module lang="ts">
    // Layer 3, view registration. The calendar closes the Incoming page's group, in the pane beside
    // the feeds. The view's badge is how many of today's events have not ended yet, and nothing
    // when none are left.
    import type { ViewRegistration } from '$lib/state/workbench/navigation/registry';

    export const registration: ViewRegistration = {
        id: 'calendar',
        label: 'views.calendar',
        glyph: 'views.calendar_glyph',
        group: 'incoming',
        order: 4,
        badge: (client) => client.calendar.badgeText(),
        badgeTitle: (client) => client.railBadges.calendarBadgeTitle(),
        badgeCells: (client) => client.railBadges.calendarCells(),
        badgeTabText: () => ''
    };
</script>

<script lang="ts">
    // Layer 3, view. The read-only calendar: the connector's head with its account controls, the
    // Add form while it is open, one row per configured account, and the events of the configured
    // window drawn by @event-calendar/core as a day, a week, a month or a list. A machine with no
    // account says so and offers Add in its place.
    //
    // Everything drawn here comes from the `calendar` channel, so the view holds no copy of the
    // events and a publish redraws them. The view an instance shows is kept in the instance's
    // state, so a reload or a second instance opens where the reader left it.
    //
    // The library draws the grid and the list; the controls above it are oculus's own buttons,
    // which drive the library through its `prev`, `next` and `gotoDate` calls and its `view`
    // option. Paging stops at the window's edges: the library greys the days outside `validRange`,
    // and the previous and next buttons are disabled once the period beyond lies wholly outside it.
    // The options come from state/life/calendar.ts; the view adds only the callbacks, which set the
    // period title, keep the view, open an event's page and put its tooltip on it. The library's
    // colours are its `--ec-*` properties, every one set below from oculus's tokens, so each theme
    // draws the calendar in its own colours, and its surfaces are the pane's own, so a wallpaper
    // shows through them.

    import { Calendar as EventCalendar, DayGrid, List, TimeGrid } from '@event-calendar/core';
    import Pane from '$lib/ui/frame/Pane.svelte';
    import Segment from '$lib/ui/controls/Segment.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import { HUES } from '$lib/ui/display/hues';
    import AccountList from '../../shared/accounts/AccountList.svelte';
    import AddAccount from '../../shared/accounts/AddAccount.svelte';
    import ConnectorHead from '../../shared/accounts/ConnectorHead.svelte';
    import NoAccounts from '../../shared/accounts/NoAccounts.svelte';
    import { t } from '$lib/state/shared/words/text';
    import type { HeadWords } from '$lib/state/life/accounts';
    import {
        calendarOptions,
        calendarRange,
        localDay,
        parseCalendarState,
        type CalendarView,
        type CalendarViewWords
    } from '$lib/state/life/calendar';
    import type { ViewProps } from '$lib/state/workbench/navigation/registry';
    import { useState } from '$lib/state/client/use';

    const {
        calendar: { openEvent, refresh, state: payload },
        clock: { minuteNow, startMinuteClock },
        ui: { instanceState, setInstanceState }
    } = useState();
    let { instance }: ViewProps = $props();

    // The badge's count of today's events is measured from the page's own minute, which the store
    // reads; running the clock here is what makes it move while the view is open.
    $effect(startMinuteClock);
    const data = $derived(payload());
    const held = $derived(parseCalendarState(instanceState(instance.id)));
    const range = $derived(data ? calendarRange(data) : null);
    /** Whether the Add form is open, which is this view's own and no other's. */
    let adding = $state(false);
    /** What the last refresh or event open said went wrong, or the empty string. */
    let said = $state('');
    /**
     * The library's calendar, for the previous, next and today buttons. The library's component
     * type does not declare the calls its instance carries, so the handle is held as it is bound
     * and read through `calls`, which names them.
     */
    let drawn: unknown = $state();
    const calls = (): EventCalendar | undefined => drawn as EventCalendar | undefined;
    /** The period the library shows now, as its last `datesSet` gave it. */
    let shown = $state<{ title: string; start: Date; end: Date } | null>(null);

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

    /** The words the library's options and each event's tooltip are drawn with. */
    function viewWords(): CalendarViewWords {
        return {
            allDay: t('calendar.all_day'),
            noEvents: t('calendar.no_events'),
            tentative: t('calendar.tentative'),
            timeRange: t('calendar.time_range')
        };
    }

    /** A number of days as the footer says it: one day, or that many days. */
    function dayCount(count: number): string {
        return count === 1 ? t('calendar.days_one') : t('calendar.days_n', count);
    }

    /** The four views, in the order the toolbar offers them. */
    function viewItems(): { id: CalendarView; label: string }[] {
        return [
            { id: 'timeGridDay', label: t('calendar.view_day') },
            { id: 'timeGridWeek', label: t('calendar.view_week') },
            { id: 'dayGridMonth', label: t('calendar.view_month') },
            { id: 'listWeek', label: t('calendar.view_list') }
        ];
    }

    /** The previous button's words for the view in force. */
    function prevWords(view: CalendarView): string {
        if (view === 'timeGridDay') return t('calendar.prev_day');
        if (view === 'dayGridMonth') return t('calendar.prev_month');
        return t('calendar.prev_week');
    }

    /** The next button's words for the view in force. */
    function nextWords(view: CalendarView): string {
        if (view === 'timeGridDay') return t('calendar.next_day');
        if (view === 'dayGridMonth') return t('calendar.next_month');
        return t('calendar.next_week');
    }

    /** Keep a view the reader picked, or the library settled on, in the instance's state. */
    function keepView(view: string): void {
        const next = parseCalendarState({ view });
        if (next.view !== held.view) setInstanceState(instance.id, next);
    }

    /** Whether the period before the one shown lies wholly before the window. */
    const atStart = $derived(
        shown !== null && range !== null && localDay(shown.start) <= range.start
    );
    /**
     * Whether the period after the one shown lies wholly after the window. The period shown ends
     * before `shown.end`, and the window's last day is inside it, as the library reads
     * `validRange`.
     */
    const atEnd = $derived(shown !== null && range !== null && localDay(shown.end) > range.end);
    /** Whether today is inside the period shown, so Today would move nothing. */
    const atToday = $derived.by(() => {
        if (shown === null) return true;
        const now = minuteNow();
        return shown.start.getTime() <= now && now < shown.end.getTime();
    });

    const options = $derived<EventCalendar.Options>({
        ...calendarOptions(data, held.view, viewWords(), HUES),
        datesSet: (info: EventCalendar.DatesSetInfo) => {
            shown = {
                title: info.view.title,
                start: info.view.currentStart,
                end: info.view.currentEnd
            };
            keepView(info.view.type);
        },
        eventClick: (info: EventCalendar.EventClickInfo) => {
            if (typeof info.event.extendedProps.link !== 'string') return;
            void openEvent(String(info.event.id)).then((words) => (said = words));
        },
        eventDidMount: (info: EventCalendar.EventDidMountInfo) => {
            const tooltip: unknown = info.event.extendedProps.tooltip;
            if (typeof tooltip === 'string') info.el.title = tooltip;
        }
    });
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
        {#if data && data.status !== 'unconfigured' && range}
            <div class="bar">
                <ToolButton
                    label={prevWords(held.view)}
                    disabled={atStart}
                    title={atStart ? t('calendar.no_earlier', range.start) : undefined}
                    onclick={() => calls()?.prev()}
                />
                <ToolButton
                    label={t('calendar.today')}
                    disabled={atToday}
                    title={atToday ? t('calendar.today_shown') : undefined}
                    onclick={() => calls()?.gotoDate(new Date())}
                />
                <ToolButton
                    label={nextWords(held.view)}
                    disabled={atEnd}
                    title={atEnd ? t('calendar.no_later', range.end) : undefined}
                    onclick={() => calls()?.next()}
                />
                <h3 class="period">
                    {shown?.title ?? ''}
                </h3>
                <Segment
                    items={viewItems()}
                    value={held.view}
                    label={t('calendar.view')}
                    onchange={keepView}
                />
            </div>
            <div class="grid">
                <EventCalendar bind:this={drawn} plugins={[TimeGrid, DayGrid, List]} {options} />
            </div>
        {/if}
        {#if data}
            <footer>
                {t('calendar.footer', dayCount(data.daysBack), dayCount(data.daysAhead))}
            </footer>
        {/if}
    </div>
</Pane>

<style>
    /* The view is a column at the pane's full height, and the library's box takes what the rows
       above and the footer leave, so the time grid scrolls inside itself. A pane too short to leave
       the grid a usable height lets the column grow past it, and the pane scrolls instead. */
    .calendar {
        display: flex;
        flex-direction: column;
        gap: 10px;
        height: 100%;
        min-height: 480px;
        min-width: 0;
    }
    .grid {
        flex: 1;
        min-height: 0;
    }
    .said {
        margin: 0;
        color: var(--muted-txt, var(--muted));
    }
    .bar {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 6px;
        min-width: 0;
    }
    .period {
        flex: 1 1 auto;
        margin: 0 6px;
        min-width: 0;
        font-size: var(--fs-md);
        font-weight: 600;
        color: var(--ink-txt, var(--ink));
    }
    footer {
        margin-top: 12px;
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-sm);
    }

    /* The library's colours, each one set from a token, so no colour of its own shows under any
       theme. The selector is more specific than the library's `.ec`, which sets its defaults. The
       background every cell and the grid are painted with is transparent, so the pane's surface
       shows: opaque under a plain theme and the wallpaper under one that has it. Today's column
       keeps its chip and an event its account's colour. */
    .grid :global(.ec) {
        color-scheme: inherit;
        font-size: var(--fs-sm);
        --ec-color-50: var(--panel);
        --ec-color-100: var(--card);
        --ec-color-200: var(--chip);
        --ec-color-300: var(--line);
        --ec-color-400: var(--muted-txt, var(--muted));
        --ec-bg-color: transparent;
        --ec-text-color: var(--ink-txt, var(--ink));
        --ec-border-color: var(--line);
        --ec-button-bg-color: var(--panel);
        --ec-button-border-color: var(--line);
        --ec-button-text-color: var(--ink-txt, var(--ink));
        --ec-button-active-bg-color: var(--accent-bg);
        --ec-button-active-border-color: var(--accent);
        --ec-button-active-text-color: var(--on-accent-bg);
        --ec-today-bg-color: var(--chip);
        --ec-highlight-color: var(--accent-bg);
        --ec-event-bg-color: var(--accent-bg);
        --ec-event-text-color: var(--on-accent-bg);
        --ec-bg-event-color: var(--chip);
        --ec-now-indicator-color: var(--accent);
        --ec-popup-bg-color: var(--panel);
        color: var(--ink-txt, var(--ink));
    }

    /* The library sets a list view's event title in the page's root size; it takes the calendar's
       own size, as the grids' titles do. */
    .grid :global(.ec-list .ec-event-title) {
        font-size: var(--fs-sm);
    }

    /* The library sets a list view's event title in the page's root size; it takes the calendar's
       own size, as the grids' titles do. */
    .grid :global(.ec-list .ec-event-title) {
        font-size: var(--fs-sm);
    }

    /* The library's toolbar is replaced by the bar above, so its empty strip takes no room. */
    .grid :global(.ec-toolbar) {
        display: none;
    }

    /* Secondary text: the hours down the side and the day headings. */
    .grid :global(.ec-sidebar),
    .grid :global(.ec-day-head) {
        color: var(--muted-txt, var(--muted));
    }

    /* The strips that stay in place while the grid scrolls under them, the day headings and a list
       view's date headings, are painted with the pane's own surface, so the rows scrolled beneath
       them do not show through; a date heading keeps today's chip over it. Over a wallpaper a
       strip keeps the panel's colour at the popover's fraction with the wallpaper blur over the
       pane's tint, since at the pane's own fraction the rows passing under it still show; the shorthand resets the
       date heading's chip, so it is laid again after it. The more-events popup keeps the panel's
       own colour over the grid. */
    .grid :global(.ec-header),
    .grid :global(.ec-list .ec-day-head) {
        background-color: var(--panel);
    }
    .grid :global(.ec-list .ec-day-head) {
        background-image: linear-gradient(var(--ec-day-bg-color), var(--ec-day-bg-color));
    }
    :global(body.wall) .grid :global(.ec-header),
    :global(body.wall) .grid :global(.ec-list .ec-day-head) {
        background: color-mix(in srgb, var(--panel) var(--wall-popover), transparent);
        backdrop-filter: blur(var(--wall-blur));
    }
    :global(body.wall) .grid :global(.ec-list .ec-day-head) {
        background-image: linear-gradient(var(--ec-day-bg-color), var(--ec-day-bg-color));
    }

    /* The library draws the time grid's hour and half-hour lines as gradients and hides parts of
       them under stripes of the background colour: the half-hour lines dotted, the side's lines cut
       to a tick, and the last line under the cell's border. A transparent background hides
       nothing, so the lines are drawn here in only the parts that show: a solid hour line, a
       dotted half-hour line made of one-pixel dots two pixels apart, and on the side a tick of
       each at the grid's edge. The cell's own bottom border gives way to the last hour line. */
    .grid :global(.ec-time-grid .ec-body .ec-day) {
        background-image:
            linear-gradient(to top, var(--ec-border-color) 1px, transparent 1px),
            conic-gradient(
                from 90deg at 1px calc(100% - 1px),
                var(--ec-border-color) 25%,
                transparent 0
            );
        background-size:
            100% calc(var(--ec-slot-height) * var(--ec-slot-label-periodicity)),
            2px var(--ec-slot-height);
        border-block-end-color: transparent;
    }
    .grid :global(.ec-time-grid .ec-body .ec-sidebar) {
        background-image:
            linear-gradient(to top, var(--ec-border-color) 1px, transparent 1px),
            conic-gradient(
                from 90deg at 1px calc(100% - 1px),
                var(--ec-border-color) 25%,
                transparent 0
            ),
            conic-gradient(
                from 90deg at 1px calc(100% - 1px),
                var(--ec-border-color) 25%,
                transparent 0
            ),
            conic-gradient(
                from 90deg at 1px calc(100% - 1px),
                var(--ec-border-color) 25%,
                transparent 0
            );
        background-size:
            0.375rem calc(var(--ec-slot-height) * var(--ec-slot-label-periodicity)),
            2px var(--ec-slot-height),
            2px var(--ec-slot-height),
            2px var(--ec-slot-height);
        background-position:
            right top,
            right top,
            right 2px top,
            right 4px top;
        background-repeat: repeat-y;
    }
</style>
