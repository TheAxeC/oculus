// Where a provider sends the reader's browser back to after a mail consent. It is one of the two
// routes with no token gate: the browser arrives from the provider and carries no oculus token, so
// what guards it is the `state` this process minted and holds, which
// lib/server/accounts/mail/routes.ts takes once and checks.
//
// GET only, and the only thing it writes is the one account's refresh token.

import { handleMailCallback } from '$lib/server/accounts/mail/routes';
import { textCatalog } from '$lib/data/sources/config';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = ({ request, locals }) =>
    handleMailCallback(request, {
        accounts: locals.server.local.mail,
        dir: locals.server.mailDir,
        providerDir: locals.server.providerDir,
        states: locals.server.mailConnects,
        fetcher: fetch,
        refresh: () => locals.server.mail.refresh(),
        words: {
            ok: textCatalog(locals.server.config)['inbox.callback_ok'],
            bad: textCatalog(locals.server.config)['inbox.callback_bad']
        }
    });
