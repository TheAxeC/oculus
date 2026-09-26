// Layer 2, client state. What the Calendar view reads and the two commands it presses; its
// accounts' Connect, Add and Remove are state/life/accounts.svelte.ts's, shared with the Inbox.
//
// The agenda is derived from the one socket entity, so the view holds no copy of it: a publish
// replaces the payload and the day groups are computed again.
//
// The moment the day groups and today's count are measured from is the client's minute clock rather
// than a reading taken here, so the agenda's today heading and the view's badge move across
// midnight with every other countdown on the page. The rules themselves are the pure functions of
// state/life/calendar.ts, which take that moment as an argument and are tested on their own.
//
// Each command answers the sentence the view says about it: the empty string when the endpoint took
// it, and otherwise the endpoint's refusal or the reason no answer could be read.

import type { CalendarPayload } from '../../data/model/index.ts';
import { dayGroups, remainingToday, type CalendarDay } from './calendar.ts';
import { postCommand } from '../shared/stores/post.ts';
import { t } from '../shared/words/text.ts';
import type { ClockStore, EntitiesStore, WritesStore } from '../shared/stores/shapes.ts';

/** One client's reader of the calendar agenda, and its two commands. */
export type CalendarStore = {
    state: () => CalendarPayload | null;
    days: () => CalendarDay[];
    remaining: () => number;
    badgeText: () => string;
    refresh: () => Promise<string>;
    openEvent: (id: string) => Promise<string>;
};

export function createCalendar(
    entities: EntitiesStore,
    writes: WritesStore,
    clock: ClockStore
): CalendarStore {
    function state(): CalendarPayload | null {
        return entities.calendar();
    }

    function events(): CalendarPayload['events'] {
        return entities.calendar()?.events ?? [];
    }

    /** Post one command to the calendar endpoint, and say what went wrong, or nothing. */
    async function command(body: Record<string, string>): Promise<string> {
        const answer = await postCommand('/api/calendar', body, writes.writeToken());
        if (answer.ok) return '';
        const code = answer.body.error;
        if (typeof code === 'string') return t('calendar.refused', code);
        if (answer.failed === 'unreachable') return t('accounts.unreachable');
        if (answer.failed === 'unreadable') return t('accounts.unreadable');
        return t('calendar.refused', '');
    }

    /** The minute the page is in, which every count below is measured from. */
    const moment = (): Date => new Date(clock.minuteNow());

    const remaining = (): number => remainingToday(events(), moment());

    return {
        state,
        days: () => dayGroups(events(), moment()),
        remaining,
        badgeText: () => {
            const count = remaining();
            return count === 0 ? '' : String(count);
        },
        refresh: () => command({ action: 'refresh' }),
        openEvent: (id) => command({ action: 'open', event: id })
    };
}
