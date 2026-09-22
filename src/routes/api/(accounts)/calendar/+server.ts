// The calendar endpoint. A route module may export only its verbs, so everything it does lives in
// lib/server/accounts/calendar/routes.ts and this is the one POST that joins them. POST only: the
// page reads the agenda from the `calendar` channel, and this is the refresh, the Connect press and
// the control that opens one event at its provider.
//
// The page never sends an address. `connect` names a configured account and `open` names an event
// of the state the poller published, so the only addresses this process hands the operating system
// are the providers' own.

import { handleCalendar } from '$lib/server/accounts/calendar/routes';
import { callbackUrl } from '$lib/server/accounts/connect/oauth';
import type { CalendarPayload } from '$lib/data/model';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = ({ request, locals }) =>
    handleCalendar(request, {
        token: locals.server.token,
        accounts: locals.server.local.calendars,
        dir: locals.server.calendarDir,
        redirect: callbackUrl(locals.server.local.port, 'calendar'),
        states: locals.server.calendarConnects,
        refresh: () => locals.server.calendar.refresh(),
        open: locals.server.opener,
        linkFor: (id) => {
            const held = locals.server.hub.latest('calendar')?.payload as
                CalendarPayload | undefined;
            return held?.events.find((event) => event.id === id)?.link ?? null;
        }
    });
