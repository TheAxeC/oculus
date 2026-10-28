// The hub's `sign_in` rows of Google and Microsoft as the connectors read them, with the sentences
// a missing row or field is said in, for the cases that sign an account in. No address here is
// called: every case injects its fetcher.

import type { SignInRow } from '../../../src/lib/data/sources/config.ts';
import type { Providers } from '../../../src/lib/server/accounts/connect/providers.ts';

export const GOOGLE_ROW: SignInRow = {
    key: 'google',
    name: 'Google',
    authorize: 'https://accounts.google.com/o/oauth2/v2/auth',
    token: 'https://oauth2.googleapis.com/token',
    calendar: 'https://www.googleapis.com/calendar/v3',
    mail: 'https://www.googleapis.com/gmail/v1/users/me',
    mailLink: 'https://mail.google.com/mail/u/0/#inbox/{id}',
    calendarScope: 'https://www.googleapis.com/auth/calendar.readonly',
    mailScope:
        'https://www.googleapis.com/auth/gmail.modify https://www.googleapis.com/auth/gmail.send'
};

export const MICROSOFT_ROW: SignInRow = {
    key: 'microsoft',
    name: 'Microsoft',
    authorize: 'https://login.microsoftonline.com/{tenant}/oauth2/v2.0/authorize',
    token: 'https://login.microsoftonline.com/{tenant}/oauth2/v2.0/token',
    calendar: 'https://graph.microsoft.com/v1.0',
    mail: 'https://graph.microsoft.com/v1.0',
    calendarScope: 'Calendars.Read offline_access',
    mailScope: 'Mail.ReadWrite Mail.Send offline_access'
};

/** The sentences, written so a case can tell the key and the field apart in them. */
export const SIGN_IN_WORDS = { noRow: 'no row {0}', noField: 'row {0} lacks {1}' };

/** Both rows, as a hub that sets them hands them to the connectors. */
export const PROVIDERS: Providers = { rows: [GOOGLE_ROW, MICROSOFT_ROW], words: SIGN_IN_WORDS };
