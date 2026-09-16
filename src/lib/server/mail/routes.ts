// Layer 2, server. The mail endpoints: the one POST the page presses, and the callback the provider
// sends the reader's browser to.
//
// The POST carries the origin and token gates every other action carries. The callback carries
// neither: the browser arrives there from the provider and not from the page, so it has no oculus
// token and its `Sec-Fetch-Site` is cross-site. What guards it is the `state` this process minted
// ten minutes earlier and holds in memory, which is taken once and never again.
//
// The page never hands this module a provider's id or an address. Connect names a configured
// account; triage, reply and archive name a thread of the state the poller published, and the
// account and the provider's own id are read from that thread, so a page that invented an id
// reaches no mailbox. A reply and an archive are the only two writes to a mailbox that exist, and
// neither creates a draft at the provider.
//
// No answer of this module carries a token, a secret, an authorization code or a message body.

import { mailKey } from '../../data/mail.ts';
import type { InboxKind, InboxThread, MailAccountConfig } from '../../data/model.ts';
import { hasToken, sameOrigin } from '../auth.ts';
import type { Opener } from '../open.ts';
import {
    accessToken,
    consentUrl,
    exchangeCode,
    type ConnectStates,
    type Fetcher
} from '../connect/oauth.ts';
import { readCredentials, writeRefreshToken } from '../connect/store.ts';
import { archiveGoogle, replyGoogle } from './google.ts';
import { archiveMicrosoft, replyMicrosoft } from './microsoft.ts';
import type { MailReadArgs } from './plate.ts';
import { writeNote, type TriageFields } from './triage.ts';

export type MailTarget = {
    token: string;
    accounts: MailAccountConfig[];
    /** The folder the credential files and the triage notes live in, already resolved. */
    dir: string;
    /** The loopback address the provider sends the browser back to. */
    redirect: string;
    states: ConnectStates;
    perSignal: number;
    fetcher: Fetcher;
    refresh: () => Promise<void>;
    /** Publish again over the notes as they are now, without calling a provider. */
    republish: () => void;
    /** Hands one address to the operating system; injected so no test opens anything. */
    open: Opener;
    /** One thread of the state last published, or null when there is no such thread. */
    threadFor: (id: string) => InboxThread | null;
};

/** The two sentences the callback page is drawn from, read from the catalog by the route. */
export type CallbackWords = { ok: string; bad: string };

export type MailCallbackTarget = {
    accounts: MailAccountConfig[];
    dir: string;
    states: ConnectStates;
    fetcher: Fetcher;
    refresh: () => Promise<void>;
    words: CallbackWords;
};

const json = (status: number, body: unknown): Response =>
    new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

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

/** The configured account a key names, or undefined when the machine names no such account. */
function accountFor(accounts: MailAccountConfig[], key: unknown): MailAccountConfig | undefined {
    return typeof key !== 'string' ? undefined : accounts.find((one) => mailKey(one) === key);
}

/** Start one consent: build the provider's page from the account's own client half, and open it. */
async function connect(target: MailTarget, account: MailAccountConfig): Promise<Response> {
    let credentials;
    try {
        credentials = readCredentials(target.dir, account);
    } catch (error) {
        return json(400, { error: reason(error) });
    }
    if (credentials === null) return json(400, { error: 'no credential file' });
    const { state, verifier } = target.states.mint(mailKey(account), target.redirect);
    await target.open(
        consentUrl('mail', credentials, { state, verifier, redirect: target.redirect })
    );
    return json(200, { ok: true });
}

/** The three words a triage `kind` may be, and nothing when the page sent something else. */
function kindOf(value: unknown): InboxKind | undefined {
    return value === 'reply' || value === 'action' || value === 'info' ? value : undefined;
}

/** What a triage write may set, out of whatever the page sent; an unknown field is left out. */
function triageFields(value: unknown): TriageFields | null {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) return null;
    const record = value as Record<string, unknown>;
    const fields: TriageFields = {};
    const kind = kindOf(record.kind);
    if (kind !== undefined) fields.kind = kind;
    for (const field of ['what', 'draft'] as const) {
        if (typeof record[field] === 'string') fields[field] = record[field];
    }
    if (typeof record.triaged === 'boolean') fields.triaged = record.triaged;
    return Object.keys(fields).length === 0 ? null : fields;
}

/** One thread of the published state, with the account it belongs to and the provider's own id. */
type Addressed = {
    thread: InboxThread;
    account: MailAccountConfig;
    /** The provider's own thread id, which is the published id without the account key. */
    providerId: string;
};

/**
 * The thread one action names, resolved through the state the poller published. The provider's id
 * is what the published id holds after its account key, so the page never sends one.
 */
function addressed(target: MailTarget, id: unknown): Addressed | null {
    if (typeof id !== 'string') return null;
    const thread = target.threadFor(id);
    if (thread === null) return null;
    const account = accountFor(target.accounts, thread.account);
    if (account === undefined) return null;
    const prefix = `${mailKey(account)}-`;
    if (!thread.id.startsWith(prefix)) return null;
    const providerId = thread.id.slice(prefix.length);
    return providerId === '' ? null : { thread, account, providerId };
}

/** One access token for a write, held for the length of that call and never answered. */
async function writeArgs(target: MailTarget, account: MailAccountConfig): Promise<MailReadArgs> {
    const credentials = readCredentials(target.dir, account);
    if (credentials?.refreshToken === undefined) throw new Error('the account is not connected');
    const token = await accessToken('mail', credentials, credentials.refreshToken, target.fetcher);
    return { token, key: mailKey(account), perSignal: target.perSignal, fetcher: target.fetcher };
}

/** Send one reply on the thread, through the provider and never as a draft. */
async function reply(target: MailTarget, held: Addressed, body: string): Promise<Response> {
    try {
        const args = await writeArgs(target, held.account);
        if (held.account.provider === 'google') await replyGoogle(args, held.providerId, body);
        else await replyMicrosoft(args, held.providerId, body);
    } catch (error) {
        return json(400, { error: reason(error) });
    }
    await target.refresh();
    return json(200, { ok: true });
}

/** Take one thread off the inbox at the provider. */
async function archive(target: MailTarget, held: Addressed): Promise<Response> {
    try {
        const args = await writeArgs(target, held.account);
        if (held.account.provider === 'google') await archiveGoogle(args, held.providerId);
        else await archiveMicrosoft(args, held.providerId);
    } catch (error) {
        return json(400, { error: reason(error) });
    }
    await target.refresh();
    return json(200, { ok: true });
}

export async function handleMail(request: Request, target: MailTarget): Promise<Response> {
    if (!sameOrigin(request, request.headers.get('host') ?? '') || !hasToken(request, target.token))
        return json(403, { error: 'forbidden' });
    let body: unknown;
    try {
        body = await request.json();
    } catch {
        return json(400, { error: 'bad body' });
    }
    if (typeof body !== 'object' || body === null || Array.isArray(body))
        return json(400, { error: 'bad body' });
    const record = body as Record<string, unknown>;
    if (record.action === 'refresh') {
        await target.refresh();
        return json(200, { status: 'ok' });
    }
    if (record.action === 'connect') {
        const account = accountFor(target.accounts, record.account);
        if (account === undefined) return json(400, { error: 'no such account' });
        return connect(target, account);
    }
    const held = addressed(target, record.thread);
    if (record.action === 'triage') {
        if (held === null) return json(400, { error: 'no such thread' });
        const fields = triageFields(record.fields);
        if (fields === null) return json(400, { error: 'no field to write' });
        try {
            writeNote(target.dir, held.thread.id, fields);
        } catch (error) {
            return json(400, { error: reason(error) });
        }
        target.republish();
        return json(200, { ok: true });
    }
    if (record.action === 'reply') {
        if (held === null) return json(400, { error: 'no such thread' });
        const text = typeof record.body === 'string' ? record.body : '';
        if (text.trim() === '') return json(400, { error: 'an answer needs words' });
        return reply(target, held, text);
    }
    if (record.action === 'archive') {
        if (held === null) return json(400, { error: 'no such thread' });
        return archive(target, held);
    }
    return json(400, { error: 'bad action' });
}

/**
 * The provider's redirect. A state this process minted is taken once and the code behind it is
 * exchanged for the refresh token the account's file keeps; a state it did not mint, or one whose
 * ten minutes are up, writes nothing and answers 400.
 */
export async function handleMailCallback(
    request: Request,
    target: MailCallbackTarget
): Promise<Response> {
    const query = new URL(request.url).searchParams;
    const state = query.get('state');
    const code = query.get('code');
    const pending = state === null ? null : target.states.take(state);
    if (pending === null || code === null || code === '') return page(400, target.words.bad);
    const account = accountFor(target.accounts, pending.key);
    if (account === undefined) return page(400, target.words.bad);
    let credentials;
    try {
        credentials = readCredentials(target.dir, account);
    } catch {
        credentials = null;
    }
    if (credentials === null) return page(400, target.words.bad);
    let refreshToken: string;
    try {
        refreshToken = await exchangeCode(
            'mail',
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

function reason(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
}
