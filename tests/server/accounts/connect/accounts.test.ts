// Accounts added and removed from the page, and each provider's client half saved once: the row
// written into the machine file with its comments kept, the account file made at 0600, the consent
// opened with the provider's client id, and a provider with no half answered with `setup` before
// anything is written. The setup page's own read answers the addresses and scopes the connect flow
// uses, and never a field of a file.
//
// Every file is under a directory this file made under the system temporary directory, asserted to
// be inside it before anything is written; the opener is a recorder and no network call is made.

import { chmodSync, existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, sep } from 'node:path';
import { afterAll, describe, expect, it, vi } from 'vitest';
import type { ConnectAccountConfig, ConnectSetup } from '../../../../src/lib/data/model/index.ts';
import { handleCalendar } from '../../../../src/lib/server/accounts/calendar/routes.ts';
import { handleMail } from '../../../../src/lib/server/accounts/mail/routes.ts';
import {
    ConnectStates,
    SCOPE,
    accessToken,
    callbackUrl,
    type Fetcher
} from '../../../../src/lib/server/accounts/connect/oauth.ts';
import {
    handleSetupRead,
    handleSetupWrite
} from '../../../../src/lib/server/accounts/connect/setup.ts';
import {
    credentialFile,
    keepRotatedToken,
    providerFile,
    readCredentials,
    writeProviderHalf
} from '../../../../src/lib/server/accounts/connect/store.ts';
import { fsWrites } from '../../../../src/lib/server/core/json.ts';
import { pagePost } from '../../../fixtures/doubles.ts';
import { scratchDir, sweepScratch } from '../../../fixtures/scratch.ts';

afterAll(sweepScratch);

const TOKEN = 'the-write-token-of-this-case';
const GOOGLE_ID = '1234-abcd.apps.googleusercontent.com';
const SECRET = 'the-google-secret-no-answer-may-carry';
const MS_ID = '0f0e0d0c-0b0a-0908-0706-050403020100';
const WORK: ConnectAccountConfig = { provider: 'google', label: 'work' };
const LOCAL = `# the machine's own file
hub: /machine/hub
calendars:
  # the university
  - { provider: microsoft, label: uni }
`;

/** A machine of this case's own: its file, its account folders and its provider folder. */
function machine(local = LOCAL) {
    const root = scratchDir('oculus-accounts-');
    expect(resolve(root).startsWith(resolve(tmpdir()) + sep)).toBe(true);
    const file = join(root, 'local.yml');
    writeFileSync(file, local);
    return {
        root,
        file,
        calendarDir: join(root, 'calendar'),
        mailDir: join(root, 'mail'),
        providerDir: join(root, 'connect')
    };
}

type Machine = ReturnType<typeof machine>;

/** A POST as the page sends one. */
function post(path: string, body: unknown, token = TOKEN): Request {
    return pagePost(`http://127.0.0.1:8792${path}`, body, token);
}

/** The calendar endpoint's target over one machine, with the accounts it names now. */
function calendarTarget(at: Machine, opened: string[], reload = vi.fn()) {
    return {
        token: TOKEN,
        accounts: [{ provider: 'microsoft', label: 'uni' }] as ConnectAccountConfig[],
        dir: at.calendarDir,
        providerDir: at.providerDir,
        book: { file: at.file, writes: fsWrites(), reload },
        redirect: callbackUrl(8792, 'calendar'),
        states: new ConnectStates(),
        refresh: () => Promise.resolve(),
        open: (url: string) => void opened.push(url),
        linkFor: () => null
    };
}

/** The setup endpoint's target over one machine. */
function setupTarget(at: Machine, refresh = vi.fn(() => Promise.resolve())) {
    return { token: TOKEN, providerDir: at.providerDir, port: 8792, writes: fsWrites(), refresh };
}

/** A body answered as JSON. */
async function body(answer: Response): Promise<Record<string, unknown>> {
    return (await answer.json()) as Record<string, unknown>;
}

describe('an account added from the page', () => {
    // revert: src/lib/server/accounts/connect/actions.ts:192 => delete
    it('writes its row with the comments kept, makes its file 0600 and opens its consent', async () => {
        const at = machine();
        writeProviderHalf(at.providerDir, {
            provider: 'google',
            clientId: GOOGLE_ID,
            clientSecret: SECRET
        });
        const opened: string[] = [];
        const reload = vi.fn();

        const answer = await handleCalendar(
            post('/api/calendar', { action: 'add', provider: 'google', label: 'work' }),
            calendarTarget(at, opened, reload)
        );

        expect(answer.status).toBe(200);
        expect(readFileSync(at.file, 'utf8')).toBe(
            `${LOCAL}  - { provider: google, label: work }\n`
        );
        const file = credentialFile(at.calendarDir, WORK);
        expect(JSON.parse(readFileSync(file, 'utf8'))).toEqual({});
        expect(statSync(file).mode & 0o777).toBe(0o600);
        expect(statSync(at.calendarDir).mode & 0o777).toBe(0o700);
        expect(reload).toHaveBeenCalledTimes(1);
        expect(opened).toHaveLength(1);
        expect(new URL(opened[0]).searchParams.get('client_id')).toBe(GOOGLE_ID);
    });

    // revert: src/lib/server/accounts/connect/actions.ts:184 => if (!providerReady(target.providerDir, row.provider)) return json(400, { error: 'x' });
    it('answers setup and writes nothing while its provider has no client half', async () => {
        const at = machine();
        const opened: string[] = [];

        const answer = await handleMail(
            post('/api/mail', { action: 'add', provider: 'microsoft', label: 'box' }),
            {
                ...calendarTarget(at, opened),
                dir: at.mailDir,
                redirect: callbackUrl(8792, 'mail'),
                perSignal: 25,
                fetcher: vi.fn<Fetcher>(),
                republish: () => undefined,
                threadFor: () => null
            }
        );

        expect(answer.status).toBe(400);
        expect(await body(answer)).toEqual({ error: 'setup' });
        expect(readFileSync(at.file, 'utf8')).toBe(LOCAL);
        // No account file is made for an account that was not added.
        expect(existsSync(at.mailDir)).toBe(false);
        expect(opened).toEqual([]);
    });

    // revert: src/lib/server/accounts/connect/actions.ts:181 => if (false) return json(400, { error: refused });
    it('refuses a label taken in the same list, and one of the wrong shape, writing nothing', async () => {
        const at = machine();
        writeProviderHalf(at.providerDir, { provider: 'microsoft', clientId: MS_ID });
        const where = calendarTarget(at, []);

        const taken = await handleCalendar(
            post('/api/calendar', { action: 'add', provider: 'microsoft', label: 'uni' }),
            where
        );
        const shape = await handleCalendar(
            post('/api/calendar', { action: 'add', provider: 'microsoft', label: '../up' }),
            where
        );

        expect(await body(taken)).toEqual({ error: 'taken' });
        expect(await body(shape)).toEqual({ error: 'label' });
        expect(readFileSync(at.file, 'utf8')).toBe(LOCAL);
    });

    // revert: src/lib/server/accounts/connect/actions.ts:144 => if (credentials === null) return json(400, { error: 'x' });
    it('answers setup to a Connect press on an account with no client half anywhere', async () => {
        const at = machine();
        const opened: string[] = [];
        const answer = await handleCalendar(
            post('/api/calendar', { action: 'connect', account: 'microsoft-uni' }),
            calendarTarget(at, opened)
        );
        expect(await body(answer)).toEqual({ error: 'setup' });
        expect(opened).toEqual([]);
    });
});

describe('an account removed from the page', () => {
    // revert: src/lib/server/accounts/connect/actions.ts:227 => delete
    it('drops its row and its file, and keeps the provider file for the other accounts', async () => {
        const at = machine();
        writeProviderHalf(at.providerDir, { provider: 'microsoft', clientId: MS_ID });
        const uni: ConnectAccountConfig = { provider: 'microsoft', label: 'uni' };
        mkdirSync(at.calendarDir);
        const file = credentialFile(at.calendarDir, uni);
        expect(resolve(file).startsWith(resolve(at.root) + sep)).toBe(true);
        writeFileSync(file, JSON.stringify({ refresh_token: 'a-token' }));
        const reload = vi.fn();

        const answer = await handleCalendar(
            post('/api/calendar', { action: 'remove', account: 'microsoft-uni' }),
            calendarTarget(at, [], reload)
        );

        expect(answer.status).toBe(200);
        expect(readFileSync(at.file, 'utf8')).toBe(
            "# the machine's own file\nhub: /machine/hub\ncalendars: []\n  # the university\n"
        );
        // The account's file is gone and the provider's stays.
        expect(existsSync(file)).toBe(false);
        expect(existsSync(providerFile(at.providerDir, 'microsoft'))).toBe(true);
        expect(reload).toHaveBeenCalledTimes(1);
    });
});

describe('the credential files', () => {
    // revert: src/lib/server/accounts/connect/store.ts:165 => let half = undefined;
    it("reads an account file's own half before its provider's", () => {
        const at = machine();
        writeProviderHalf(at.providerDir, {
            provider: 'google',
            clientId: GOOGLE_ID,
            clientSecret: SECRET
        });
        const file = credentialFile(at.calendarDir, WORK);
        mkdirSync(at.calendarDir);
        writeFileSync(
            file,
            JSON.stringify({ client_id: 'own-id', client_secret: 'own', refresh_token: 'r' })
        );
        expect(readCredentials(at.calendarDir, WORK, at.providerDir)).toEqual({
            provider: 'google',
            clientId: 'own-id',
            clientSecret: 'own',
            refreshToken: 'r'
        });
    });

    // revert: src/lib/server/accounts/connect/store.ts:185 => delete
    it('writes a provider half at 0600 in a 0700 folder, tightening a file left readable', () => {
        const at = machine();
        writeProviderHalf(at.providerDir, { provider: 'microsoft', clientId: MS_ID });
        const file = providerFile(at.providerDir, 'microsoft');
        chmodSync(file, 0o644);

        writeProviderHalf(at.providerDir, {
            provider: 'microsoft',
            clientId: MS_ID,
            tenant: MS_ID
        });

        expect(JSON.parse(readFileSync(file, 'utf8'))).toEqual({ client_id: MS_ID, tenant: MS_ID });
        expect(statSync(file).mode & 0o777).toBe(0o600);
        expect(statSync(at.providerDir).mode & 0o777).toBe(0o700);
    });

    // revert: src/lib/server/accounts/connect/store.ts:214 => delete
    it('keeps a rotated refresh token, and writes none for an account whose file has gone', () => {
        const at = machine();
        const file = credentialFile(at.calendarDir, WORK);
        keepRotatedToken(at.calendarDir, WORK, 'rotated');
        expect(existsSync(file)).toBe(false);

        mkdirSync(at.calendarDir);
        writeFileSync(file, JSON.stringify({ refresh_token: 'first' }));
        keepRotatedToken(at.calendarDir, WORK, 'rotated');
        expect(JSON.parse(readFileSync(file, 'utf8'))).toEqual({ refresh_token: 'rotated' });
    });

    // revert: src/lib/server/accounts/connect/oauth.ts:277 => delete
    it('hands a refresh token the provider rotates to the keeper, and only a new one', async () => {
        const answers = [
            { access_token: 'a', refresh_token: 'second' },
            { access_token: 'a', refresh_token: 'second' },
            { access_token: 'a' }
        ];
        const fetcher = vi.fn<Fetcher>(() =>
            Promise.resolve(new Response(JSON.stringify(answers.shift()), { status: 200 }))
        );
        const kept: string[] = [];
        const credentials = {
            provider: 'google',
            clientId: GOOGLE_ID,
            clientSecret: SECRET
        } as const;
        const keep = (next: string): void => void kept.push(next);

        await accessToken('mail', credentials, 'first', fetcher, keep);
        await accessToken('mail', credentials, 'second', fetcher, keep);
        await accessToken('mail', credentials, 'second', fetcher, keep);

        expect(kept).toEqual(['second']);
    });
});

describe('the account setup page', () => {
    // revert: src/lib/server/accounts/connect/setup.ts:58 => scopes: { calendar: { google: '', microsoft: '' }, mail: { google: '', microsoft: '' } }
    it('reads the redirects on the served port and the scopes the connect flow asks for', async () => {
        const at = machine();
        writeProviderHalf(at.providerDir, {
            provider: 'google',
            clientId: GOOGLE_ID,
            clientSecret: SECRET
        });
        const answer = handleSetupRead(
            new Request('http://127.0.0.1:8792/api/connect', {
                headers: { 'sec-fetch-site': 'same-origin' }
            }),
            setupTarget(at)
        );
        const text = await answer.text();
        const read = JSON.parse(text) as ConnectSetup;
        expect(read).toEqual({
            ready: { google: true, microsoft: false },
            redirects: {
                calendar: 'http://127.0.0.1:8792/api/calendar/callback',
                mail: 'http://127.0.0.1:8792/api/mail/callback'
            },
            scopes: SCOPE
        });
        // The answer says a half is there and never what it holds.
        expect(text).not.toContain(GOOGLE_ID);
        // The secret is the field the answer must never carry.
        expect(text).not.toContain(SECRET);
    });

    // revert: src/lib/server/accounts/connect/setup.ts:74 => if (false) return json(400, { error: checked.refused });
    it('refuses a Google id of the wrong shape in a code, and writes nothing', async () => {
        const at = machine();
        const answer = await handleSetupWrite(
            post('/api/connect', {
                action: 'save',
                provider: 'google',
                client_id: 'not-a-google-id',
                client_secret: SECRET
            }),
            setupTarget(at)
        );
        expect(answer.status).toBe(400);
        expect(await body(answer)).toEqual({ error: 'google_id' });
        expect(existsSync(at.providerDir)).toBe(false);
    });

    // revert: src/lib/server/accounts/connect/setup.ts:76 => delete
    it('saves a half behind the token, reads every account again, and answers no field of it', async () => {
        const at = machine();
        const refresh = vi.fn(() => Promise.resolve());
        const save = {
            action: 'save',
            provider: 'google',
            client_id: ` ${GOOGLE_ID} `,
            client_secret: SECRET
        };

        const stale = await handleSetupWrite(post('/api/connect', save, 'stale'), setupTarget(at));
        const answer = await handleSetupWrite(post('/api/connect', save), setupTarget(at, refresh));

        expect(stale.status).toBe(403);
        expect(answer.status).toBe(200);
        const file = providerFile(at.providerDir, 'google');
        expect(JSON.parse(readFileSync(file, 'utf8'))).toEqual({
            client_id: GOOGLE_ID,
            client_secret: SECRET
        });
        expect(statSync(file).mode & 0o777).toBe(0o600);
        expect(refresh).toHaveBeenCalledTimes(1);
        // The answer to a save carries nothing the reader typed.
        expect(await answer.text()).not.toContain(SECRET);
    });
});

/** Hold a target's write chain as a write still in flight would, until the release is called. */
function holdChain(writes: { chain: Promise<unknown> }): () => void {
    let release = (): void => undefined;
    writes.chain = new Promise<void>((done) => (release = done));
    return release;
}

/** Long enough for a request's body to be read and anything not waiting on the chain to run. */
function settle(): Promise<void> {
    return new Promise((done) => setTimeout(done, 30));
}

describe('the write chain', () => {
    // revert: src/lib/server/accounts/connect/actions.ts:209 => const written = await addRow(LIST[kind], target, record);
    it('holds two Adds behind a write in flight, then writes both in the order they came', async () => {
        const at = machine();
        writeProviderHalf(at.providerDir, {
            provider: 'google',
            clientId: GOOGLE_ID,
            clientSecret: SECRET
        });
        const target = calendarTarget(at, []);
        const release = holdChain(target.book.writes);
        const first = handleCalendar(
            post('/api/calendar', { action: 'add', provider: 'google', label: 'work' }),
            target
        );
        const second = handleCalendar(
            post('/api/calendar', { action: 'add', provider: 'google', label: 'home' }),
            target
        );
        await settle();
        expect(readFileSync(at.file, 'utf8')).toBe(LOCAL);

        release();
        expect((await first).status).toBe(200);
        expect((await second).status).toBe(200);
        expect(readFileSync(at.file, 'utf8')).toBe(
            `${LOCAL}  - { provider: google, label: work }\n  - { provider: google, label: home }\n`
        );
    });

    // revert: src/lib/server/accounts/connect/actions.ts:246 => return removeRow(LIST[kind], target, account);
    it('holds a Remove behind an Add in flight, so it edits the file the Add wrote', async () => {
        const at = machine();
        writeProviderHalf(at.providerDir, {
            provider: 'google',
            clientId: GOOGLE_ID,
            clientSecret: SECRET
        });
        const target = calendarTarget(at, []);
        const release = holdChain(target.book.writes);
        const add = handleCalendar(
            post('/api/calendar', { action: 'add', provider: 'google', label: 'work' }),
            target
        );
        const remove = handleCalendar(
            post('/api/calendar', { action: 'remove', account: 'microsoft-uni' }),
            target
        );
        await settle();
        expect(readFileSync(at.file, 'utf8')).toBe(LOCAL);

        release();
        expect((await add).status).toBe(200);
        expect((await remove).status).toBe(200);
        expect(readFileSync(at.file, 'utf8')).toBe(
            "# the machine's own file\nhub: /machine/hub\ncalendars:\n  # the university\n  - { provider: google, label: work }\n"
        );
    });

    // revert: src/lib/server/accounts/connect/setup.ts:76 => writeProviderHalf(target.providerDir, checked.half);
    it('holds two Saves behind a write in flight, so the later one is the half that stays', async () => {
        const at = machine();
        const target = setupTarget(at);
        const release = holdChain(target.writes);
        const save = (id: string) =>
            handleSetupWrite(
                post('/api/connect', {
                    action: 'save',
                    provider: 'google',
                    client_id: id,
                    client_secret: SECRET
                }),
                target
            );
        const first = save(GOOGLE_ID);
        const second = save(`9${GOOGLE_ID}`);
        await settle();
        // Neither Save has written while the earlier write holds the chain.
        expect(existsSync(providerFile(at.providerDir, 'google'))).toBe(false);

        release();
        expect((await first).status).toBe(200);
        expect((await second).status).toBe(200);
        const file = providerFile(at.providerDir, 'google');
        expect(JSON.parse(readFileSync(file, 'utf8'))).toEqual({
            client_id: `9${GOOGLE_ID}`,
            client_secret: SECRET
        });
    });
});
