// Layer 2, test helper. The accounts, files and answers the calendar poller's cases share: a Google
// account and an ICS link with their credential files in a scratch directory, the options one
// watcher runs under, and the payload the hub holds. The account file writer, the good answer and
// the address of a fetch call are the mail connector's, tests/server/accounts/mail/fixture.ts.
//
// Every directory a case gets from scratch() is removed when the file's cases are done, by the
// sweep tests/fixtures/scratch.ts runs.

import { writeFileSync } from 'node:fs';
import { join, resolve, sep } from 'node:path';
import { expect } from 'vitest';
import type {
    CalendarAccountConfig,
    CalendarPayload
} from '../../../../src/lib/data/model/index.ts';
import type { Hub } from '../../../../src/lib/server/core/channels.ts';
import { credentialFile } from '../../../../src/lib/server/accounts/connect/store.ts';
import type { Fetcher } from '../../../../src/lib/server/accounts/connect/oauth.ts';
import { engineDir, loadConfig, textCatalog } from '../../../../src/lib/data/sources/config.ts';
import { scratchDir } from '../../../fixtures/scratch.ts';
import { ACCESS, REFRESH, answer, urlOf, writeAccount } from '../mail/fixture.ts';

export { ACCESS, REFRESH, answer, urlOf, writeAccount };

export const POLL_MIN = 15;
export const GOOGLE: CalendarAccountConfig = { provider: 'google', label: 'work' };

const catalog = textCatalog(loadConfig(engineDir()).config);
/** The sentences an account's row may carry, as the server reads them. */
export const WORDS = {
    icsNoLink: catalog['calendar.ics_no_link'],
    icsFailed: catalog['calendar.ics_failed'],
    timedOut: catalog['accounts.timed_out']
};

export function scratch(): string {
    return scratchDir('oculus-calendar-poll-');
}

/** The payload the hub currently holds on the calendar channel. */
export function held(hub: Hub): CalendarPayload {
    return hub.latest('calendar')?.payload as CalendarPayload;
}

/** The options one case runs its watcher under. */
export function options(dir: string, fetcher: Fetcher, accounts = [GOOGLE]) {
    // A provider folder the case never fills unless it says so, inside the case's own directory.
    const providerDir = join(dir, 'connect');
    return {
        accounts,
        dir,
        providerDir,
        pollMin: POLL_MIN,
        daysBack: 1,
        daysAhead: 14,
        fetcher,
        words: WORDS
    };
}

export const LINK = 'https://secret.example/cal.ics';
export const ICS: CalendarAccountConfig = { provider: 'ics', label: 'rooster' };

/** The account's own file, holding the link or the fields the case gives it. */
export function writeLink(dir: string, record: Record<string, unknown> = { url: LINK }): void {
    const file = credentialFile(dir, ICS);
    expect(resolve(file).startsWith(resolve(dir) + sep)).toBe(true);
    writeFileSync(file, JSON.stringify(record));
}
