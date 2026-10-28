// Where a provider sends the reader's browser back to. It is the one route with no token gate: the
// browser arrives from the provider and carries no oculus token, so what guards it is the `state`
// this process minted and holds, which lib/server/accounts/calendar/routes.ts takes once and
// checks.
//
// GET only, and the only thing it writes is the one account's refresh token.

import { handleCalendarCallback } from '$lib/server/accounts/calendar/routes';
import { providersOf } from '$lib/server/accounts/connect/providers';
import { textCatalog } from '$lib/data/sources/config';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = ({ request, locals }) => {
    const config = locals.config().config;
    return handleCalendarCallback(request, {
        accounts: locals.server.local.calendars,
        dir: locals.server.calendarDir,
        providerDir: locals.server.providerDir,
        providers: providersOf(config),
        states: locals.server.calendarConnects,
        fetcher: fetch,
        refresh: () => locals.server.calendar.refresh(),
        words: {
            ok: textCatalog(config)['calendar.callback_ok'],
            bad: textCatalog(config)['calendar.callback_bad']
        }
    });
};
