// Layer 2, server. The mail endpoints: the one POST the page presses, and the callback the provider
// sends the reader's browser to.
//
// The POST carries the token gate every other action carries, behind the origin guard in
// src/hooks.server.ts. Connect, Add and Remove are the account actions both connectors answer
// alike, in connect/actions.ts; refresh, triage, reply and archive are the mail's own. The callback
// carries neither gate, and the guard passes it: the browser arrives there from the provider and
// not from the page, so what guards it is the `state` this process minted ten minutes earlier and
// holds in memory, which is taken once and never again.
//
// The page never hands this module a provider's id or an address. Connect names a configured
// account; triage, reply and archive name a thread of the state the poller published, and the
// account and the provider's own id are read from that thread, so a page that invented an id
// reaches no mailbox. A reply and an archive are the only two writes to a mailbox that exist, and
// neither creates a draft at the provider.
//
// No answer of this module carries a token, a secret, an authorization code or a message body.

import { json } from '@sveltejs/kit';
import { mailKey } from '../../../data/accounts/mail.ts';
import type { InboxKind, InboxThread, MailAccountConfig } from '../../../data/model/index.ts';
import { signIn } from '../connect/loop.ts';
import type { Fetcher } from '../connect/oauth.ts';
import { gatedBody } from '../../core/auth.ts';
import {
    accountAction,
    accountFor,
    handleConnectCallback,
    type AccountTarget,
    type CallbackTarget
} from '../connect/actions.ts';
import { archiveGoogle, replyGoogle } from './google.ts';
import { archiveMicrosoft, replyMicrosoft } from './microsoft.ts';
import type { MailReadArgs } from './plate.ts';
import { writeNote, type TriageFields } from './triage.ts';

export type { CallbackWords } from '../connect/actions.ts';

export type MailTarget = AccountTarget & {
    token: string;
    accounts: MailAccountConfig[];
    perSignal: number;
    fetcher: Fetcher;
    refresh: () => Promise<void>;
    /** Publish again over the notes as they are now, without calling a provider. */
    republish: () => void;
    /** One thread of the state last published, or null when there is no such thread. */
    threadFor: (id: string) => InboxThread | null;
};

export type MailCallbackTarget = CallbackTarget;

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
    const signed = await signIn('mail', account, target, target.fetcher);
    if ('waiting' in signed) throw new Error('the account is not connected');
    const { token } = signed;
    return { token, key: mailKey(account), perSignal: target.perSignal, fetcher: target.fetcher };
}

/** Send one reply on the thread, through the provider and never as a draft. */
async function reply(target: MailTarget, held: Addressed, body: string): Promise<Response> {
    try {
        const args = await writeArgs(target, held.account);
        if (held.account.provider === 'google') await replyGoogle(args, held.providerId, body);
        else await replyMicrosoft(args, held.providerId, body);
    } catch (error) {
        return json({ error: reason(error) }, { status: 400 });
    }
    await target.refresh();
    return json({ ok: true });
}

/** Take one thread off the inbox at the provider. */
async function archive(target: MailTarget, held: Addressed): Promise<Response> {
    try {
        const args = await writeArgs(target, held.account);
        if (held.account.provider === 'google') await archiveGoogle(args, held.providerId);
        else await archiveMicrosoft(args, held.providerId);
    } catch (error) {
        return json({ error: reason(error) }, { status: 400 });
    }
    await target.refresh();
    return json({ ok: true });
}

export async function handleMail(request: Request, target: MailTarget): Promise<Response> {
    const record = await gatedBody(request, target.token);
    if (record instanceof Response) return record;
    if (record.action === 'refresh') {
        await target.refresh();
        return json({ status: 'ok' });
    }
    const answered = accountAction('mail', target, record);
    if (answered !== null) return answered;
    const held = addressed(target, record.thread);
    if (record.action === 'triage') {
        if (held === null) return json({ error: 'no such thread' }, { status: 400 });
        const fields = triageFields(record.fields);
        if (fields === null) return json({ error: 'no field to write' }, { status: 400 });
        try {
            writeNote(target.dir, held.thread.id, fields);
        } catch (error) {
            return json({ error: reason(error) }, { status: 400 });
        }
        target.republish();
        return json({ ok: true });
    }
    if (record.action === 'reply') {
        if (held === null) return json({ error: 'no such thread' }, { status: 400 });
        const text = typeof record.body === 'string' ? record.body : '';
        if (text.trim() === '') return json({ error: 'an answer needs words' }, { status: 400 });
        return reply(target, held, text);
    }
    if (record.action === 'archive') {
        if (held === null) return json({ error: 'no such thread' }, { status: 400 });
        return archive(target, held);
    }
    return json({ error: 'bad action' }, { status: 400 });
}

/**
 * The provider's redirect after a mail consent: the code exchanged for the account's refresh token,
 * once, against the state this process minted.
 */
export function handleMailCallback(
    request: Request,
    target: MailCallbackTarget
): Promise<Response> {
    return handleConnectCallback('mail', request, target);
}

function reason(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
}
