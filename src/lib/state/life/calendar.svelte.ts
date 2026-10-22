// Layer 2, client state. What the Calendar view reads and the two commands it presses; its
// accounts' Connect, Add and Remove are state/life/accounts.svelte.ts's, shared with the Inbox.
//
// The events are read from the one socket entity, so the view holds no copy of them: a publish
// replaces the payload and the calendar is drawn again.
//
// The moment today's count is measured from is the client's minute clock rather than a reading
// taken here, so the view's badge moves across midnight with every other countdown on the page. The
// rules themselves are the pure functions of state/life/calendar.ts, which take that moment as an
// argument and are tested on their own.
//
// Each command answers the sentence the view says about it: the empty string when the endpoint took
// it, and otherwise the endpoint's refusal or the reason no answer could be read.
//
// The store's one state of its own is how many presses of Refresh wait for their answer. The route
// answers once the poll it asked for has run, so Refresh turns its glyph from the reader's press
// until that press's answer, in every Calendar view of the page, a view opened while a press waits
// included; a poll the server runs on its own cadence is no press and turns nothing, and a refused
// or unreachable press ends the turn at its answer.

import type { CalendarPayload } from '../../data/model/index.ts';
import { optionalTextShape, readAs } from '../../data/shapes/shapes.ts';
import { remainingToday } from './calendar.ts';
import { t } from '../shared/words/text.ts';
import type { ClockStore, EntitiesStore, WritesStore } from '../shared/stores/shapes.ts';

/** One client's reader of the calendar, and its two commands. */
export type CalendarStore = {
    state: () => CalendarPayload | null;
    remaining: () => number;
    badgeText: () => string;
    /** Whether a press of Refresh waits for its answer. */
    refreshing: () => boolean;
    refresh: () => Promise<string>;
    openEvent: (id: string) => Promise<string>;
};

export function createCalendar(
    entities: EntitiesStore,
    writes: WritesStore,
    clock: ClockStore
): CalendarStore {
    /** How many presses of Refresh wait for their answer. */
    let pressed = $state(0);

    function state(): CalendarPayload | null {
        return entities.calendar();
    }

    function events(): CalendarPayload['events'] {
        return entities.calendar()?.events ?? [];
    }

    /** Post one command to the calendar endpoint, and say what went wrong, or nothing. */
    async function command(body: Record<string, string>): Promise<string> {
        const answer = await writes.postCommand('/api/calendar', body);
        if (answer.ok) return '';
        const code = readAs(optionalTextShape, answer.body.error);
        if (code !== undefined && code !== null) return t('calendar.refused', code);
        if (answer.failed === 'unreachable') return t('accounts.unreachable');
        if (answer.failed === 'unreadable') return t('accounts.unreadable');
        return t('calendar.refused', '');
    }

    /** The minute the page is in, which every count below is measured from. */
    const moment = (): Date => new Date(clock.minuteNow());

    const remaining = (): number => remainingToday(events(), moment());

    /** Ask the server for a poll now, counted as waiting from the press to its answer. */
    async function refresh(): Promise<string> {
        pressed += 1;
        try {
            return await command({ action: 'refresh' });
        } finally {
            pressed -= 1;
        }
    }

    return {
        state,
        remaining,
        badgeText: () => {
            const count = remaining();
            return count === 0 ? '' : String(count);
        },
        refreshing: () => pressed > 0,
        refresh,
        openEvent: (id) => command({ action: 'open', event: id })
    };
}
