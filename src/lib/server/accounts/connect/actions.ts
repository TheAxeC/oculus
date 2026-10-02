// Layer 2, server. What the calendar endpoint and the mail endpoint do alike: start a consent, add
// an account and start its consent at once, remove an account, and take the provider's redirect.
//
// Adding and removing are the one write oculus makes to the machine's own config/local.yml. Both
// run behind the process's write chain, read the file fresh inside it, edit its one list through
// connect/rows.ts, which keeps every comment and byte outside the row and refuses a text the
// machine file would not read back, and write it whole through a temporary file and a rename. The
// server then reads the account lists again, so the routes and the pollers hold the new list
// without a restart.
//
// A refusal the page words itself is answered as a code: `provider`, `label` or `taken` for the
// account the page named, `link` for a published calendar link that is missing or is not an
// https or webcal address, `setup` for a provider with no client half on this machine, `file` with
// the sentence for a machine file the edit would not leave readable. The page runs the same rules
// before it sends (data/accounts/connect.ts and data/accounts/calendar.ts), so a code is what a
// race or a hand edit produced.
//
// A published link is added with no consent and no client half: its row names the provider `ics`
// and the label alone, the link itself goes into the account's own file, and the Add answers once
// both are written. It has nothing to connect, so a Connect naming one is refused as `provider`.
//
// The callback carries no token: the browser arrives there from the provider and not from the page,
// so what guards it is the `state` this process minted ten minutes earlier and holds in memory,
// which is taken once and never again. No answer carries a token, a secret or an authorization
// code, and the page never hands this module an address.

import { json } from '@sveltejs/kit';
import { existsSync, readFileSync } from 'node:fs';
import { parse } from 'yaml';
import { z } from 'zod';
import { publishedLink } from '../../../data/accounts/calendar.ts';
import { accountRefusal, connectKey, signsIn } from '../../../data/accounts/connect.ts';
import { isMap } from '../../../data/helpers/guards.ts';
import type { AccountRow, ConnectAccountConfig, ConnectKind } from '../../../data/model/index.ts';
import { chained, writeTextAtomic, type FsWrites } from '../../core/json.ts';
import {
    consentUrl,
    exchangeCode,
    type ConnectStates,
    type Fetcher,
    type Opener
} from './oauth.ts';
import { addAccountRow, removeAccountRow, type AccountList } from './rows.ts';
import {
    providerReady,
    readCredentials,
    removeAccountFile,
    writeAccountFile,
    writePublishedLink,
    writeRefreshToken
} from './store.ts';

/** The list of config/local.yml each connector's accounts are rows of. */
const LIST: Record<ConnectKind, AccountList> = { calendar: 'calendars', mail: 'mail' };

/** What starting one consent needs: the folders, the redirect, the states and the opener. */
export type ConsentTarget = {
    /** The folder the account files live in, already resolved. */
    dir: string;
    /** The folder the providers' client halves live in, already resolved. */
    providerDir: string;
    /** The loopback address the provider sends the browser back to. */
    redirect: string;
    states: ConnectStates;
    /** Hands one address to the operating system; injected so no test opens anything. */
    open: Opener;
};

/** Where the machine's own file is, the chain its writes wait on, and the re-read after one. */
export type AccountBook = {
    /** config/local.yml of the engine the server was started over. */
    file: string;
    writes: FsWrites;
    /**
     * Read the machine's file again, every key of it, and hand the account lists to the routes
     * and the pollers and the other keys to what is built from them.
     */
    reload: () => void;
};

/** An account action's target: a consent's, the accounts at the request, and the book. */
export type AccountTarget = ConsentTarget & {
    accounts: AccountRow[];
    book: AccountBook;
};

/** The two sentences the callback page is drawn from, read from the catalog by the route. */
export type CallbackWords = { ok: string; bad: string };

export type CallbackTarget = {
    accounts: AccountRow[];
    dir: string;
    providerDir: string;
    states: ConnectStates;
    fetcher: Fetcher;
    refresh: () => Promise<void>;
    words: CallbackWords;
};

/** The five characters a browser reads as markup, so a configured sentence is drawn as words. */
function escaped(text: string): string {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

/** The page the provider's redirect lands on: one sentence, and nothing the reader must press. */
function page(status: number, sentence: string): Response {
    const body = [
        '<!doctype html>',
        '<html lang="en">',
        '<head><meta charset="utf-8"><title>oculus</title></head>',
        `<body><p>${escaped(sentence)}</p></body>`,
        '</html>',
        ''
    ].join('\n');
    return new Response(body, {
        status,
        headers: { 'content-type': 'text/html; charset=utf-8' }
    });
}

function reason(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
}

/** The configured account a key names, or undefined when the machine names no such account. */
export function accountFor<A extends AccountRow>(accounts: A[], key: unknown): A | undefined {
    return typeof key !== 'string' ? undefined : accounts.find((one) => connectKey(one) === key);
}

/**
 * Start one consent: build the provider's page from the account's client half, its own or its
 * provider's, and open it. An account with no half on this machine is refused with `setup`, the
 * code the page answers by opening the account setup page.
 */
export async function startConsent(
    kind: ConnectKind,
    target: ConsentTarget,
    account: ConnectAccountConfig
): Promise<Response> {
    let credentials;
    try {
        credentials = readCredentials(target.dir, account, target.providerDir);
    } catch (error) {
        return json({ error: reason(error) }, { status: 400 });
    }
    if (credentials === null) return json({ error: 'setup' }, { status: 400 });
    const { state, verifier } = target.states.mint(connectKey(account), target.redirect);
    await target.open(
        consentUrl(kind, credentials, { state, verifier, redirect: target.redirect })
    );
    return json({ ok: true });
}

/** The machine file's text, or the empty text when the machine has not made one. */
function localText(file: string): string {
    return existsSync(file) ? readFileSync(file, 'utf8') : '';
}

/**
 * One list of the machine file: its map items, whatever their fields, and no rows for a value that
 * is no list.
 */
const rowListShape = z
    .array(z.unknown())
    .transform((all) => all.filter(isMap))
    .catch(() => []);

/** The two account lists of the machine file, each read as a list of rows. */
const accountListsShape = z.object({ calendars: rowListShape, mail: rowListShape });

/**
 * The rows one list of the machine file holds now, read as the file's reader would. A row is kept
 * whatever its fields, since the label rule only compares a row's provider and label with the ones
 * being added.
 */
function rowsIn(text: string, list: AccountList): AccountRow[] {
    let parsed: unknown;
    try {
        parsed = parse(text);
    } catch {
        return [];
    }
    const lists = accountListsShape.safeParse(parsed);
    return lists.success ? lists.data[list].map((row) => row as AccountRow) : [];
}

/**
 * The row an Add names, once the label rule has accepted its provider and label: a provider the
 * connectors offer and a label.
 */
const addedRowShape = z.object({
    provider: z.enum(['google', 'microsoft', 'ics']),
    label: z.string()
}) satisfies z.ZodType<AccountRow>;

/**
 * The row of an Add written into the machine file with its account file, and the lists read again,
 * or the refusal: nothing is written for a label the list would refuse, for a provider with no
 * client half yet, or for a published link that is missing or of another scheme. It runs inside
 * the write chain, so the file it reads is the one it writes over.
 */
function addRow(
    kind: ConnectKind,
    target: AccountTarget,
    record: Record<string, unknown>
): Response | AccountRow {
    const list = LIST[kind];
    const text = localText(target.book.file);
    const refused = accountRefusal(kind, rowsIn(text, list), record.provider, record.label);
    if (refused !== null) return json({ error: refused }, { status: 400 });
    const added = addedRowShape.safeParse(record);
    if (!added.success) return json({ error: 'provider' }, { status: 400 });
    const row = added.data;
    const link = row.provider === 'ics' ? publishedLink(record.url) : null;
    if (row.provider === 'ics' && link === null) return json({ error: 'link' }, { status: 400 });
    if (signsIn(row)) {
        try {
            if (!providerReady(target.providerDir, row.provider)) {
                return json({ error: 'setup' }, { status: 400 });
            }
        } catch (error) {
            return json({ error: reason(error) }, { status: 400 });
        }
    }
    const edit = addAccountRow(text, list, row, target.book.file);
    if ('reason' in edit) return json({ error: 'file', reason: edit.reason }, { status: 400 });
    try {
        if (link === null) writeAccountFile(target.dir, row);
        else writePublishedLink(target.dir, row, link);
        writeTextAtomic(target.book.file, edit.text);
    } catch (error) {
        return json({ error: 'file', reason: reason(error) }, { status: 500 });
    }
    target.book.reload();
    return row;
}

/**
 * Add one account: its row in the machine file, its credential file, the lists read again, and its
 * consent started at once. A published link has no consent, so its Add answers once it is written.
 */
export async function addAccount(
    kind: ConnectKind,
    target: AccountTarget,
    record: Record<string, unknown>
): Promise<Response> {
    const written = await chained(target.book.writes, () => addRow(kind, target, record));
    if (written instanceof Response) return written;
    if (!signsIn(written)) return json({ ok: true });
    return startConsent(kind, target, written);
}

/**
 * The row of a Remove taken from the machine file, its credential file deleted, and the lists read
 * again. It runs inside the write chain, as an Add does.
 */
function removeRow(list: AccountList, target: AccountTarget, account: AccountRow): Response {
    const edit = removeAccountRow(localText(target.book.file), list, account, target.book.file);
    if ('reason' in edit) return json({ error: 'file', reason: edit.reason }, { status: 400 });
    try {
        writeTextAtomic(target.book.file, edit.text);
        removeAccountFile(target.dir, account);
    } catch (error) {
        return json({ error: 'file', reason: reason(error) }, { status: 500 });
    }
    target.book.reload();
    return json({ ok: true });
}

/**
 * Remove one account: its row taken from the machine file, its credential file deleted, and the
 * lists read again. The provider's file stays, since it serves every other account of the provider.
 */
export async function removeAccount(
    kind: ConnectKind,
    target: AccountTarget,
    record: Record<string, unknown>
): Promise<Response> {
    const account = accountFor(target.accounts, record.account);
    if (account === undefined) return json({ error: 'no such account' }, { status: 400 });
    return chained(target.book.writes, () => removeRow(LIST[kind], target, account));
}

/**
 * The account actions both endpoints answer alike, or null for an action that is the endpoint's
 * own.
 */
export function accountAction(
    kind: ConnectKind,
    target: AccountTarget,
    record: Record<string, unknown>
): Promise<Response> | null {
    if (record.action === 'connect') {
        const account = accountFor(target.accounts, record.account);
        if (account === undefined)
            return Promise.resolve(json({ error: 'no such account' }, { status: 400 }));
        if (!signsIn(account)) return Promise.resolve(json({ error: 'provider' }, { status: 400 }));
        return startConsent(kind, target, account);
    }
    if (record.action === 'add') return addAccount(kind, target, record);
    if (record.action === 'remove') return removeAccount(kind, target, record);
    return null;
}

/**
 * The provider's redirect. A state this process minted is taken once and the code behind it is
 * exchanged for the refresh token the account's file keeps; a state it did not mint, or one whose
 * ten minutes are up, writes nothing and answers 400.
 */
export async function handleConnectCallback(
    kind: ConnectKind,
    request: Request,
    target: CallbackTarget
): Promise<Response> {
    const query = new URL(request.url).searchParams;
    const state = query.get('state');
    const code = query.get('code');
    const pending = state === null ? null : target.states.take(state);
    if (pending === null || code === null || code === '') return page(400, target.words.bad);
    const account = accountFor(target.accounts, pending.key);
    if (account === undefined || !signsIn(account)) return page(400, target.words.bad);
    let credentials;
    try {
        credentials = readCredentials(target.dir, account, target.providerDir);
    } catch {
        credentials = null;
    }
    if (credentials === null) return page(400, target.words.bad);
    let refreshToken: string;
    try {
        refreshToken = await exchangeCode(
            kind,
            credentials,
            { code, verifier: pending.verifier, redirect: pending.redirect },
            target.fetcher
        );
    } catch {
        return page(400, target.words.bad);
    }
    writeRefreshToken(target.dir, account, refreshToken);
    await target.refresh();
    return page(200, target.words.ok);
}
