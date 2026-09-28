// The calendar endpoint. A route module may export only its verbs, so everything it does lives in
// lib/server/accounts/calendar/routes.ts and this is the one POST that joins them. POST only: the
// page reads the events from the `calendar` channel, and this is the refresh, the Connect press,
// the Add and the Remove of an account, and the control that opens one event at its provider.
//
// The page sends one address, the published link of an `add` of a provider `ics`, which is kept in
// the account's own file and never opened. `connect` and `remove` name a configured account, `add`
// names a provider and a label, and `open` names an event of the state the poller published, so the
// only addresses this process hands the operating system are the ones the calendars published.

import { handleCalendar } from '$lib/server/accounts/calendar/routes';
import { callbackUrl } from '$lib/server/accounts/connect/oauth';
import type { CalendarPayload } from '$lib/data/model';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = ({ request, locals }) =>
    handleCalendar(request, {
        token: locals.server.token,
        accounts: locals.server.local.calendars,
        dir: locals.server.calendarDir,
        providerDir: locals.server.providerDir,
        book: locals.server.accounts,
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
