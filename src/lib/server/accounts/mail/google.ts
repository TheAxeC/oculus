// Layer 2, server. One account's Gmail plate, and the two writes the Inbox view can make on it.
//
// Four calls per round: one thread listing per plate signal, then one metadata read per candidate.
// The metadata read asks for the headers alone, so no message body is ever fetched; what the payload
// carries of a message is the thread snippet Gmail puts in its own list.
//
// The two writes are a reply on the thread and an archive. A reply is one `messages/send` of a raw
// RFC 2822 message carrying the thread's own `In-Reply-To` and `References`, so the answer lands in
// the thread rather than beside it; no draft is ever created, and `users.drafts` is not called by
// anything in this file. An archive is one `threads/modify` taking the `INBOX` label off.

import { str } from '../../../data/helpers/guards.ts';
import { getJson, httpsLink, postJson, rowsOf } from '../connect/api.ts';
import {
    SIGNALS,
    TODO_LABEL,
    type Candidate,
    type MailReadArgs,
    type PlateThread
} from './plate.ts';
import type { Signal } from './plate.ts';

const BASE = 'https://www.googleapis.com/gmail/v1/users/me';

/** The reader's own page for one thread, which is where the card's link goes. */
function threadLink(id: string): string | undefined {
    return httpsLink(`https://mail.google.com/mail/u/0/#inbox/${encodeURIComponent(id)}`);
}

/** The search each signal is read with, which is the plate rule written in Gmail's own query. */
function queryFor(signal: Signal): string {
    if (signal === 'unread') return 'in:inbox is:unread';
    if (signal === 'todo') return `in:inbox label:${TODO_LABEL}`;
    return 'in:inbox has:nouserlabels';
}

/** The thread ids one signal answers with, newest first and capped at the configured count. */
async function idsFor(args: MailReadArgs, signal: Signal): Promise<string[]> {
    const url = new URL(`${BASE}/threads`);
    url.searchParams.set('q', queryFor(signal));
    url.searchParams.set('maxResults', String(args.perSignal));
    const body = await getJson('google', url.toString(), args);
    const found: string[] = [];
    for (const row of rowsOf(body, 'threads')) {
        const id = str(row.id);
        if (id !== undefined) found.push(id);
    }
    return found.slice(0, args.perSignal);
}

/** One header of a message, by name, case-insensitively as the provider writes them. */
function header(message: Record<string, unknown>, name: string): string {
    const payload = message.payload;
    const rows = typeof payload === 'object' && payload !== null ? payload : {};
    for (const row of rowsOf(rows as Record<string, unknown>, 'headers')) {
        if ((str(row.name) ?? '').toLowerCase() === name) return str(row.value) ?? '';
    }
    return '';
}

/** The labels one message carries. */
function labels(message: Record<string, unknown>): string[] {
    const held = message.labelIds;
    return Array.isArray(held) ? held.filter((one): one is string => typeof one === 'string') : [];
}

/** The moment a message arrived, from the epoch milliseconds Gmail answers with. */
function receivedAt(message: Record<string, unknown>): string {
    const ms = Number(str(message.internalDate) ?? '');
    return Number.isFinite(ms) && ms > 0 ? new Date(ms).toISOString() : '';
}

/** The headers the metadata read asks for, and no other part of a message. */
const HEADERS = ['From', 'Subject', 'Date', 'Message-Id', 'References', 'Reply-To'];

/** One thread read as metadata: the messages with their headers and labels, and nothing else. */
async function readThread(args: MailReadArgs, id: string): Promise<Record<string, unknown>> {
    const url = new URL(`${BASE}/threads/${encodeURIComponent(id)}`);
    url.searchParams.set('format', 'metadata');
    for (const name of HEADERS) url.searchParams.append('metadataHeaders', name);
    return getJson('google', url.toString(), args);
}

/** The address a reply goes to: the thread's `Reply-To` when it has one, else its `From`. */
function replyTo(newest: Record<string, unknown>): string {
    const stated = header(newest, 'reply-to');
    return stated === '' ? header(newest, 'from') : stated;
}

/** One thread in the shape the plate rules take, out of what the metadata read answered. */
function threadOf(id: string, body: Record<string, unknown>): PlateThread | null {
    const messages = rowsOf(body, 'messages');
    const newest = messages.at(-1);
    if (newest === undefined) return null;
    const carried = labels(newest);
    const link = threadLink(id);
    return {
        id,
        sender: header(newest, 'from'),
        replyTo: replyTo(newest),
        subject: header(newest, 'subject'),
        received: receivedAt(newest),
        snippet: str(newest.snippet) ?? str(body.snippet) ?? '',
        messages: messages.length,
        ...(link === undefined ? {} : { url: link }),
        ownNewest: carried.includes('SENT'),
        trashed: carried.includes('TRASH')
    };
}

/** Every candidate of one account: the three signals read, each thread's metadata behind them. */
export async function readGoogleMail(args: MailReadArgs): Promise<Candidate[]> {
    const candidates: Candidate[] = [];
    const read = new Map<string, PlateThread | null>();
    for (const signal of SIGNALS) {
        for (const id of await idsFor(args, signal)) {
            if (!read.has(id)) read.set(id, threadOf(id, await readThread(args, id)));
            const thread = read.get(id) ?? null;
            if (thread !== null) candidates.push({ signal, thread });
        }
    }
    return candidates;
}

/** A subject that already says it is an answer keeps its own words; one that does not gains them. */
function replySubject(subject: string): string {
    return /^\s*re\s*:/i.test(subject) ? subject : `Re: ${subject}`;
}

/**
 * One RFC 2822 message, as base64url, which is the one form `messages.send` takes. The two
 * threading headers carry the newest message's own `Message-Id`, which is what puts the answer in
 * the thread; a header value is written on one line, so a newline inside one is dropped rather than
 * allowed to start a header of its own.
 */
export function rawMessage(fields: {
    to: string;
    subject: string;
    inReplyTo: string;
    references: string;
    body: string;
}): string {
    const line = (value: string): string => value.replace(/[\r\n]+/g, ' ').trim();
    const lines = [
        `To: ${line(fields.to)}`,
        `Subject: ${line(fields.subject)}`,
        'Content-Type: text/plain; charset="UTF-8"',
        'MIME-Version: 1.0'
    ];
    if (fields.inReplyTo !== '') lines.push(`In-Reply-To: ${line(fields.inReplyTo)}`);
    if (fields.references !== '') lines.push(`References: ${line(fields.references)}`);
    return Buffer.from(`${lines.join('\r\n')}\r\n\r\n${fields.body}\r\n`, 'utf8').toString(
        'base64url'
    );
}

/** Send one reply on the thread. Nothing here creates a draft; only `messages/send` is called. */
export async function replyGoogle(
    args: MailReadArgs,
    threadId: string,
    body: string
): Promise<void> {
    const thread = await readThread(args, threadId);
    const newest = rowsOf(thread, 'messages').at(-1);
    if (newest === undefined) throw new Error('google: the thread holds no message');
    const messageId = header(newest, 'message-id');
    const references = header(newest, 'references');
    const raw = rawMessage({
        to: replyTo(newest),
        subject: replySubject(header(newest, 'subject')),
        inReplyTo: messageId,
        references: references === '' ? messageId : `${references} ${messageId}`,
        body
    });
    await postJson('google', `${BASE}/messages/send`, {
        token: args.token,
        fetcher: args.fetcher,
        body: { raw, threadId }
    });
}

/** Take one thread off the inbox by removing the label the inbox is. */
export async function archiveGoogle(args: MailReadArgs, threadId: string): Promise<void> {
    await postJson('google', `${BASE}/threads/${encodeURIComponent(threadId)}/modify`, {
        token: args.token,
        fetcher: args.fetcher,
        body: { removeLabelIds: ['INBOX'] }
    });
}
