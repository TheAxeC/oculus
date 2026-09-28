// The mail endpoint. A route module may export only its verbs, so everything it does lives in
// lib/server/accounts/mail/routes.ts and this is the one POST that joins them. POST only: the page
// reads the plate from the `inbox` channel, and this is the refresh, the Connect press, the Add and
// the Remove of an account, the triage note, the reply and the archive.
//
// The page never sends a provider's id. Every action names a configured account or a thread of the
// state the poller published, so the only mailbox this process ever writes to is one the machine's
// own file configured.

import { handleMail } from '$lib/server/accounts/mail/routes';
import { callbackUrl } from '$lib/server/accounts/connect/oauth';
import { mailSettings } from '$lib/data/sources/config';
import type { InboxPayload } from '$lib/data/model';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = ({ request, locals }) =>
    handleMail(request, {
        token: locals.server.token,
        accounts: locals.server.local.mail,
        dir: locals.server.mailDir,
        providerDir: locals.server.providerDir,
        book: locals.server.accounts,
        redirect: callbackUrl(locals.server.local.port, 'mail'),
        states: locals.server.mailConnects,
        perSignal: mailSettings(locals.config().config).perSignal,
        fetcher: fetch,
        refresh: () => locals.server.mail.refresh(),
        republish: () => locals.server.mail.republish(),
        open: locals.server.opener,
        threadFor: (id) => {
            const held = locals.server.hub.latest('inbox')?.payload as InboxPayload | undefined;
            return held?.threads.find((thread) => thread.id === id) ?? null;
        }
    });
