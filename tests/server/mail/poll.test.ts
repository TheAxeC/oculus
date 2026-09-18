// The mail poller with an injected fetcher only, so the unconfigured machine, the not-connected
// account, a good round, a refused one, the forced refresh, the per-account cadence, one round at a
// time and the notes republish are all reached without the network.
//
// Every credential file this file reads is in a directory it made under mkdtemp and asserted to be
// inside the temporary directory first; nothing under the reader's own home is touched.

import { existsSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterAll, afterEach, describe, expect, it, vi } from 'vitest';
import type { InboxPayload } from '../../../src/lib/data/model.ts';
import { Hub } from '../../../src/lib/server/channels.ts';
import { RETRY_MIN, watchMail } from '../../../src/lib/server/mail/poll.ts';
import { triageFile } from '../../../src/lib/server/mail/triage.ts';
import { credentialFile } from '../../../src/lib/server/connect/store.ts';
import {
    ACCESS,
    GOOGLE,
    MICROSOFT,
    REFRESH,
    addresses,
    answer,
    cleanup,
    fakeFetcher,
    scratch,
    urlOf,
    writeAccount
} from './fixture.ts';
import { sweepScratch } from '../../scratch.ts';

afterAll(sweepScratch);

const MINUTE = 60000;
const POLL_MIN = 10;

afterEach(() => {
    vi.useRealTimers();
    cleanup();
});

/** Give the event loop a turn until the condition holds, or give up. */
async function until(held: () => boolean): Promise<void> {
    for (let turn = 0; turn < 80 && !held(); turn += 1) {
        await new Promise((resolve) => setTimeout(resolve, 0));
    }
}

/**
 * Wait on a real filesystem watch, which answers on the operating system's own schedule rather than
 * on a turn of the event loop, and give up after two seconds so a watch that never fires is a
 * failed assertion rather than a hung run.
 */
async function watched(ready: () => boolean): Promise<void> {
    for (let turn = 0; turn < 200 && !ready(); turn += 1) {
        await new Promise((resolve) => setTimeout(resolve, 10));
    }
    expect(ready()).toBe(true);
}

/** The payload the hub currently holds on the inbox channel. */
function held(hub: Hub): InboxPayload {
    return hub.latest('inbox')?.payload as InboxPayload;
}

/** Whether the channel has published at all yet, which every wait below is guarded by. */
function published(hub: Hub): boolean {
    return hub.latest('inbox') !== undefined;
}

/** Gmail's answer to the three listings and to one thread's metadata. */
function googleRoutes(ids: string[]) {
    return [
        {
            when: (url: string) => url.includes('is%3Aunread'),
            body: { threads: ids.map((id) => ({ id })) }
        },
        { when: (url: string) => url.includes('label%3Atodo'), body: { threads: [] } },
        { when: (url: string) => url.includes('has%3Anouserlabels'), body: { threads: [] } },
        {
            when: (url: string) => url.includes('/threads/'),
            body: {
                id: ids[0] ?? 'none',
                messages: [
                    {
                        id: 'm1',
                        internalDate: String(Date.parse('2026-09-16T10:00:00.000Z')),
                        snippet: 'the provider own one line',
                        labelIds: ['INBOX', 'UNREAD'],
                        payload: {
                            headers: [
                                { name: 'From', value: 'Ada <ada@example.invalid>' },
                                { name: 'Subject', value: 'A new thing' },
                                { name: 'Message-Id', value: '<one@example.invalid>' }
                            ]
                        }
                    }
                ]
            }
        }
    ];
}

describe('the mail poller', () => {
    it('publishes unconfigured once for a machine that names no account, and polls nothing', () => {
        const hub = new Hub();
        const fetcher = vi.fn(() => answer({}));
        const watcher = watchMail(hub, {
            accounts: [],
            dir: scratch(),
            pollMin: POLL_MIN,
            perSignal: 25,
            fetcher,
            watchNotes: false
        });
        expect(held(hub).status).toBe('unconfigured');
        expect(held(hub).threads).toEqual([]);
        expect(fetcher).not.toHaveBeenCalled();
        watcher.close();
    });

    it('marks an account with no refresh token not connected and names the file it waits for', async () => {
        const hub = new Hub();
        const dir = scratch();
        const file = writeAccount(dir, GOOGLE, false);
        const fetcher = vi.fn(() => answer({}));
        const watcher = watchMail(hub, {
            accounts: [GOOGLE],
            dir,
            pollMin: POLL_MIN,
            perSignal: 25,
            fetcher,
            watchNotes: false
        });
        await until(() => published(hub));
        expect(held(hub).accounts[0]).toMatchObject({ status: 'not-connected', hint: file });
        expect(fetcher).not.toHaveBeenCalled();
        expect(file).toBe(credentialFile(dir, GOOGLE));
        watcher.close();
    });

    it('publishes one plate of a good round, with the notes the file holds', async () => {
        const hub = new Hub();
        const dir = scratch();
        writeAccount(dir, GOOGLE);
        writeFileSync(
            triageFile(dir),
            JSON.stringify({
                run: '2026-09-16',
                notes: {
                    'google-work-one': {
                        kind: 'reply',
                        what: 'Needs an answer',
                        written: '2026-09-16T09:00:00.000Z'
                    }
                }
            })
        );
        const fake = fakeFetcher(googleRoutes(['one']));
        const watcher = watchMail(hub, {
            accounts: [GOOGLE],
            dir,
            pollMin: POLL_MIN,
            perSignal: 25,
            fetcher: fake.fetcher,
            watchNotes: false
        });
        await until(() => published(hub) && held(hub).threads.length === 1);
        const payload = held(hub);
        expect(payload.status).toBe('ok');
        expect(payload.notesRun).toBe('2026-09-16');
        expect(payload.pollMin).toBe(POLL_MIN);
        expect(payload.retryMin).toBe(RETRY_MIN);
        expect(payload.threads[0]).toMatchObject({
            id: 'google-work-one',
            account: 'google-work',
            provider: 'google',
            sender: 'Ada <ada@example.invalid>',
            subject: 'A new thing',
            snippet: 'the provider own one line',
            messages: 1,
            triage: { kind: 'reply', what: 'Needs an answer', triaged: false }
        });
        watcher.close();
    });

    it('carries no token byte and no message text beyond the provider own snippet', async () => {
        const hub = new Hub();
        const dir = scratch();
        writeAccount(dir, GOOGLE);
        const fake = fakeFetcher(googleRoutes(['one']));
        const watcher = watchMail(hub, {
            accounts: [GOOGLE],
            dir,
            pollMin: POLL_MIN,
            perSignal: 25,
            fetcher: fake.fetcher,
            watchNotes: false
        });
        await until(() => published(hub) && held(hub).threads.length === 1);
        const written = JSON.stringify(held(hub));
        expect(written).not.toContain(ACCESS);
        expect(written).not.toContain(REFRESH);
        expect(written).not.toContain('a-secret');
        expect(written).toContain('the provider own one line');
        // The only read of a message is the metadata read, which asks for headers and no body.
        for (const url of addresses(fake).filter((one) => one.includes('/threads/'))) {
            expect(url).toContain('format=metadata');
            expect(url).not.toContain('format=full');
        }
        watcher.close();
    });

    it('keeps the last good plate under the error word when the provider refuses', async () => {
        const hub = new Hub();
        const dir = scratch();
        writeAccount(dir, GOOGLE);
        let refusing = false;
        const good = fakeFetcher(googleRoutes(['one']));
        const fetcher: typeof fetch = (input, init) => {
            if (refusing && !urlOf(input).includes('oauth')) {
                return answer({ error: { status: 'PERMISSION_DENIED' } }, 403);
            }
            return good.fetcher(input, init);
        };
        const watcher = watchMail(hub, {
            accounts: [GOOGLE],
            dir,
            pollMin: POLL_MIN,
            perSignal: 25,
            fetcher,
            watchNotes: false
        });
        await until(() => published(hub) && held(hub).threads.length === 1);
        refusing = true;
        await watcher.refresh();
        const payload = held(hub);
        expect(payload.status).toBe('error');
        expect(payload.accounts[0].status).toBe('error');
        expect(payload.accounts[0].hint).toBe('google: 403 PERMISSION_DENIED');
        expect(payload.accounts[0].lastOk).toBeTruthy();
        // The rows the last good round left are still what the reader sees.
        expect(payload.threads.map((one) => one.id)).toEqual(['google-work-one']);
        watcher.close();
    });

    it('shortens the cadence of the account that failed and leaves the other one alone', async () => {
        const hub = new Hub();
        const dir = scratch();
        writeAccount(dir, GOOGLE);
        writeAccount(dir, MICROSOFT);
        const at = new Date('2026-09-16T12:00:00.000Z');
        const google = fakeFetcher(googleRoutes(['one']));
        const fetcher: typeof fetch = (input, init) => {
            const url = urlOf(input);
            if (url.includes('graph.microsoft.com')) {
                return answer({ error: { code: 'MailboxNotEnabled' } }, 403);
            }
            return google.fetcher(input, init);
        };
        const timers = vi.useFakeTimers();
        timers.setSystemTime(at);
        const watcher = watchMail(hub, {
            accounts: [GOOGLE, MICROSOFT],
            dir,
            pollMin: POLL_MIN,
            perSignal: 25,
            fetcher,
            watchNotes: false
        });
        await vi.advanceTimersByTimeAsync(0);
        await until(() => published(hub) && held(hub).accounts.length === 2);
        expect(held(hub).accounts.map((one) => one.status)).toEqual(['connected', 'error']);
        /** The calls the Gmail account made, which is what the cadence of that account is read by. */
        const gmail = (): number =>
            google.calls.filter((call) => call.url.includes('googleapis.com')).length;
        const calls = gmail();
        // The refusing account is due again after RETRY_MIN and the good one is not.
        await vi.advanceTimersByTimeAsync(RETRY_MIN * MINUTE + 1000);
        expect(held(hub).accounts[1].status).toBe('error');
        expect(gmail()).toBe(calls);
        watcher.close();
    });

    it('republishes when the triage skill writes the notes file from outside', async () => {
        const hub = new Hub();
        const dir = scratch();
        writeAccount(dir, GOOGLE);
        const fake = fakeFetcher(googleRoutes(['one']));
        const watcher = watchMail(hub, {
            accounts: [GOOGLE],
            dir,
            pollMin: POLL_MIN,
            perSignal: 25,
            fetcher: fake.fetcher
        });
        await until(() => published(hub) && held(hub).threads.length === 1);
        const calls = fake.calls.length;
        expect(held(hub).threads[0].triage.triaged).toBe(false);

        // The write is the skill's: this case does not call publish or republish itself.
        writeFileSync(
            triageFile(dir),
            JSON.stringify({
                run: '2026-09-16',
                notes: { 'google-work-one': { triaged: true, written: '2026-09-16T09:00:00.000Z' } }
            })
        );
        await watched(() => held(hub).threads[0].triage.triaged);
        expect(held(hub).notesRun).toBe('2026-09-16');
        // The watch answers without asking a provider anything.
        expect(fake.calls.length).toBe(calls);
        watcher.close();
    });

    it('makes the mail folder when it is not there, so the first write from outside is seen', async () => {
        const hub = new Hub();
        const parent = scratch();
        const dir = join(parent, 'not-made-yet');
        expect(existsSync(dir)).toBe(false);
        const watcher = watchMail(hub, {
            accounts: [],
            dir,
            pollMin: POLL_MIN,
            perSignal: 25,
            fetcher: vi.fn(() => answer({}))
        });
        expect(existsSync(dir)).toBe(true);
        expect(statSync(dir).mode & 0o777).toBe(0o700);
        const before = hub.latest('inbox')?.version ?? 0;

        writeFileSync(triageFile(dir), JSON.stringify({ run: '2026-09-16', notes: {} }));
        await watched(() => (hub.latest('inbox')?.version ?? 0) > before);
        expect(held(hub).notesRun).toBe('2026-09-16');
        watcher.close();
    });

    it('says on the page why the triage notes could not be read, and keeps the plate', async () => {
        const hub = new Hub();
        const dir = scratch();
        writeAccount(dir, GOOGLE);
        writeFileSync(triageFile(dir), '{not json');
        const fake = fakeFetcher(googleRoutes(['one']));
        const watcher = watchMail(hub, {
            accounts: [GOOGLE],
            dir,
            pollMin: POLL_MIN,
            perSignal: 25,
            fetcher: fake.fetcher,
            watchNotes: false
        });
        await until(() => published(hub) && held(hub).threads.length === 1);
        expect(held(hub).notesError).toContain('is not JSON');
        expect(held(hub).notesError).not.toContain('{not json');
        expect(held(hub).threads[0].triage).toEqual({ triaged: false });
        watcher.close();
    });

    it('runs one round at a time and publishes again over the notes without calling a provider', async () => {
        const hub = new Hub();
        const dir = scratch();
        writeAccount(dir, GOOGLE);
        const fake = fakeFetcher(googleRoutes(['one']));
        const watcher = watchMail(hub, {
            accounts: [GOOGLE],
            dir,
            pollMin: POLL_MIN,
            perSignal: 25,
            fetcher: fake.fetcher,
            watchNotes: false
        });
        await until(() => published(hub) && held(hub).threads.length === 1);
        const first = fake.calls.length;
        await Promise.all([watcher.refresh(), watcher.refresh(), watcher.refresh()]);
        // Three presses open two rounds, not three: the first press finds no round in flight and
        // runs, and the two that land while it runs share the one follow-up round after it.
        expect(fake.calls.length).toBe(first * 3);

        const calls = fake.calls.length;
        writeFileSync(
            triageFile(dir),
            JSON.stringify({
                run: '2026-09-16',
                notes: { 'google-work-one': { triaged: true, written: '2026-09-16T09:00:00.000Z' } }
            })
        );
        watcher.republish();
        expect(held(hub).threads[0].triage.triaged).toBe(true);
        expect(fake.calls.length).toBe(calls);
        watcher.close();
    });
});
