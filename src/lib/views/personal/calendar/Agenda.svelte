<script lang="ts">
    // Layer 3, view partial. The agenda: one heading per day that has events, each event one line.
    //
    // A line is its time or the all-day word, its title, the calendar it is in and the account
    // label as a tag, its place, and the control that opens it at the provider. A cancelled event
    // is drawn struck through and a tentative one is marked, since both are still on the calendar
    // and a reader deciding what the day holds needs to see them and to see that they are not
    // settled.

    import Empty from '$lib/ui/frame/Empty.svelte';
    import Tag from '$lib/ui/controls/Tag.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import { t } from '$lib/state/shared/words/text';
    import { clock } from '$lib/state/shared/words/format';
    import type { CalendarDay, CalendarEvent } from '$lib/state/life/calendar';

    let { days, onopen }: { days: CalendarDay[]; onopen: (id: string) => void } = $props();

    /** The time column: the clock of a timed event, and the all-day word of an all-day one. */
    function when(event: CalendarEvent): string {
        return event.allDay ? t('calendar.all_day') : clock(event.start);
    }
</script>

{#if days.length === 0}
    <Empty message={t('calendar.agenda_empty')} />
{:else}
    <div class="agenda">
        {#each days as day (day.day)}
            <section data-day={day.day}>
                <h3>
                    {day.day}
                    {#if day.today}
                        <span class="today">{t('calendar.today')}</span>
                    {/if}
                </h3>
                <ul>
                    {#each day.events as event (event.id)}
                        <li data-event={event.id}>
                            <span class="when">{when(event)}</span>
                            <span class="title" class:cancelled={event.status === 'cancelled'}>
                                {event.title}
                            </span>
                            {#if event.status === 'tentative'}
                                <Tag label={t('calendar.tentative')} tone="amber" />
                            {/if}
                            {#if event.status === 'cancelled'}
                                <Tag label={t('calendar.cancelled')} tone="red" />
                            {/if}
                            <Tag label={event.account} />
                            <span class="where">{event.calendar}</span>
                            {#if event.location}
                                <span class="where">{event.location}</span>
                            {/if}
                            {#if event.link}
                                <ToolButton
                                    label={t('calendar.open_event')}
                                    glyph="link"
                                    compact
                                    onclick={() => onopen(event.id)}
                                />
                            {/if}
                        </li>
                    {/each}
                </ul>
            </section>
        {/each}
    </div>
{/if}

<style>
    .agenda {
        display: flex;
        flex-direction: column;
        gap: 10px;
        min-width: 0;
    }
    h3 {
        display: flex;
        align-items: baseline;
        gap: 6px;
        margin: 0 0 4px;
        font-size: var(--fs-sm);
        color: var(--muted-txt, var(--muted));
    }
    .today {
        color: var(--c-green-d-txt);
        font-weight: 600;
    }
    ul {
        display: flex;
        flex-direction: column;
        gap: 4px;
        margin: 0;
        padding: 0;
        list-style: none;
    }
    li {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 6px;
        min-width: 0;
    }
    .when {
        min-width: 4.5em;
        color: var(--muted-txt, var(--muted));
        font-variant-numeric: tabular-nums;
    }
    .title {
        font-weight: 600;
        min-width: 0;
    }
    .cancelled {
        text-decoration: line-through;
        font-weight: 400;
    }
    .where {
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-sm);
        min-width: 0;
    }
</style>
