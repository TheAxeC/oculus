// Layer 2, client state. What the Calendar view reads and the three commands it presses.
//
// The agenda is derived from the one socket entity, so the view holds no copy of it: a publish
// replaces the payload and the day groups are computed again. The only state of this store's own is
// which accounts have a Connect press in flight, which is what makes that control unpressable while
// the consent page is opening.
//
// The moment the day groups and today's count are measured from is the client's minute clock rather
// than a reading taken here, so the agenda's today heading and the rail's count move across
// midnight with every other countdown on the page. The rules themselves are the pure functions of
// state/life/calendar.ts, which take that moment as an argument and are tested on their own.

import { calendarKey } from '../../data/accounts/calendar.ts';
import { fields } from '../../data/helpers/guards.ts';
import type { CalendarAccount, CalendarPayload } from '../../data/model.ts';
import { dayGroups, remainingToday, type CalendarDay } from './calendar.ts';
import type { ClockStore } from '../client/clock.svelte.ts';
import type { EntitiesStore } from '../client/entities.svelte.ts';
import type { WritesStore } from '../client/writes.svelte.ts';

/** One client's reader of the calendar agenda, and its three commands. */
export type CalendarStore = {
    state: () => CalendarPayload | null;
    days: () => CalendarDay[];
    remaining: () => number;
    badgeText: () => string;
    /** Whether a Connect press on this account has not been answered yet. */
    connecting: (account: CalendarAccount) => boolean;
    refresh: () => Promise<void>;
    connect: (account: CalendarAccount) => Promise<void>;
    openEvent: (id: string) => Promise<void>;
};

export function createCalendar(
    entities: EntitiesStore,
    writes: WritesStore,
    clock: ClockStore
): CalendarStore {
    /** The accounts whose Connect press is still open, by the key the endpoint is given. */
    const pending = $state(new Set<string>());

    function state(): CalendarPayload | null {
        return entities.calendar();
    }

    function events(): CalendarPayload['events'] {
        return entities.calendar()?.events ?? [];
    }

    /** Post one command to the calendar endpoint and read its answer. */
    async function command(body: Record<string, string>): Promise<Record<string, unknown>> {
        const response = await fetch('/api/calendar', {
            method: 'POST',
            headers: { 'content-type': 'application/json', 'x-oculus-token': writes.writeToken() },
            body: JSON.stringify(body)
        });
        return fields(await response.json());
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
        connecting: (account) => pending.has(calendarKey(account)),
        refresh: async () => {
            await command({ action: 'refresh' });
        },
        connect: async (account) => {
            const key = calendarKey(account);
            pending.add(key);
            try {
                await command({ action: 'connect', account: key });
            } finally {
                pending.delete(key);
            }
        },
        openEvent: async (id) => {
            await command({ action: 'open', event: id });
        }
    };
}
