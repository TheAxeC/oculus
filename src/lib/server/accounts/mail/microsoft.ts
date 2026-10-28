// Layer 2, server. One account's Outlook plate, and the two writes the Inbox view can make on it.
//
// The three plate signals are read over the inbox folder: unread, the `todo` category, and the
// messages carrying no category at all. Graph has no thread object, so a thread is a conversation:
// each candidate's conversation is read once, which answers in one call how many messages it holds,
// which of them is newest, whether that one is the reader's own and whether it sits in the trash.
// `$select` names the fields read, so the body of a message is never fetched; what the payload
// carries is the `bodyPreview` Graph puts in its own list, its HTML entities decoded as Gmail's
// snippet is, so the payload holds the words themselves.
//
// Every call is inside the mail scopes the consent asks for. Which messages are the reader's own is
// decided by the sent-items folder rather than by asking who the reader is, since the user resource
// is behind a `User.*` permission this connector never asks for.
//
// Every listing is asked newest first. Graph documents that a property in `$orderby` must also
// appear in `$filter`, first and in the same order, and refuses the rest with `InefficientFilter`,
// so a filtered listing names `receivedDateTime` first in its filter, over the whole of time, and
// then the signal's own test. The rows are sorted here as well, which is what makes the newest
// message of a conversation the newest one rather than the first Graph happened to answer with.
//
// The two writes are a reply on the conversation and a move to the archive folder. A reply is one
// `/me/messages/{id}/reply` with a comment, which is Graph's own threaded answer; nothing here
// creates a draft, and `/me/messages/{id}/createReply` and a POST of a draft message are called by
// nothing in this file.

import { decodeHTML } from 'entities';
import { z } from 'zod';
import { getJson, httpsLink, postJson, rowsShape } from '../connect/api.ts';
import {
    SIGNALS,
    TODO_LABEL,
    type Candidate,
    type MailReadArgs,
    type PlateThread
} from './plate.ts';
import type { Signal } from './plate.ts';

/** A field of Graph's answer that is text where it is there, and read as absent otherwise. */
const optionalTextShape = z.string().optional().catch(undefined);

/**
 * One address of a recipient field, as a name and an address where the provider gave both. A value
 * that is no recipient reads as the empty text.
 */
const personShape = z
    .object({
        emailAddress: z.object({
            name: z.string().catch(''),
            address: z.string().catch('')
        })
    })
    .transform(({ emailAddress: { name, address } }) => {
        if (name === '') return address;
        return address === '' ? name : `${name} <${address}>`;
    })
    .catch('');

/**
 * One message of a listing. `from` and `sender` are read as they came, since `from` stands for the
 * sender whenever it is there at all and `sender` only when it is null or absent; `replyTo` is the
 * recipients it names, each one as text, and the categories are the items of that list that are
 * text.
 */
const messageShape = z.object({
    id: optionalTextShape,
    conversationId: optionalTextShape,
    subject: optionalTextShape,
    from: z.unknown().optional(),
    sender: z.unknown().optional(),
    replyTo: z.array(personShape).catch(() => []),
    receivedDateTime: optionalTextShape,
    bodyPreview: optionalTextShape,
    categories: z
        .array(z.unknown())
        .transform((all) => all.filter((one): one is string => typeof one === 'string'))
        .catch(() => []),
    parentFolderId: optionalTextShape,
    webLink: optionalTextShape
});

type Message = z.output<typeof messageShape>;

/** A listing: its messages, and the address of the page after it when Graph named one. */
const listShape = z.object({
    value: rowsShape.pipe(z.array(messageShape)).catch(() => []),
    '@odata.nextLink': optionalTextShape
});

/** A well-known folder: its id, which reads as the empty text when Graph would not name it. */
const folderShape = z.object({ id: z.string().catch('') });

/** The fields a message is read with, which is every field the plate and the payload need. */
const SELECT = [
    'id',
    'conversationId',
    'subject',
    'from',
    'sender',
    'replyTo',
    'receivedDateTime',
    'bodyPreview',
    'categories',
    'parentFolderId',
    'isRead',
    'webLink'
].join(',');

/**
 * How many pages the unlabeled signal follows before it stops. That signal is the one filtered here
 * rather than in the query, so a page can be all categorised and yield nothing; the bound keeps an
 * inbox whose newest hundred messages are all filed from costing an unbounded walk, and four pages
 * of `per_signal` is four times what the signal can keep.
 */
const UNLABELED_PAGE_MAX = 4;

/** The two folders the whole-plate drops are decided by, read once per account per round. */
export type MailboxFacts = { sentFolder: string; trashFolder: string };

/** The id of one well-known folder, or the empty string when Graph would not name it. */
async function folderId(args: MailReadArgs, name: string): Promise<string> {
    const address = `${args.base}/me/mailFolders/${name}?$select=id`;
    const folder = await getJson('microsoft', address, args);
    const held = folderShape.safeParse(folder);
    return held.success ? held.data.id : '';
}

/**
 * Where this account's sent and deleted mail sits. Both are well-known folder names, so neither
 * call needs the folder's own id and neither leaves the mail scopes.
 */
export async function mailboxFacts(args: MailReadArgs): Promise<MailboxFacts> {
    return {
        sentFolder: await folderId(args, 'sentitems'),
        trashFolder: await folderId(args, 'deleteditems')
    };
}

/**
 * The property the listings are ordered by, which a filtered listing must name first in its filter
 * for Graph to accept the order; the bound is the whole of time, so it narrows nothing.
 */
const ORDER_FIELD = 'receivedDateTime';
const ORDER_FLOOR = `${ORDER_FIELD} ge 1970-01-01T00:00:00Z`;

/** The filter each signal is read with, and nothing when the signal is filtered here instead. */
function filterFor(signal: Signal): string | null {
    if (signal === 'unread') return `${ORDER_FLOOR} and isRead eq false`;
    if (signal === 'todo') return `${ORDER_FLOOR} and categories/any(c: c eq '${TODO_LABEL}')`;
    return null;
}

/** The display name and address of a message's sender. */
function senderOf(row: Message): string {
    const person = personShape.safeParse(row.from ?? row.sender);
    return person.success ? person.data : '';
}

/**
 * Where a reply to this message goes, which is the rule Graph's own `/reply` applies: the message's
 * `replyTo` when it names anyone, and its sender otherwise. The page names it in the confirmation,
 * so what the reader is asked about is who the answer reaches.
 */
function replyToOf(row: Message): string {
    const stated = row.replyTo.find((one) => one !== '') ?? '';
    return stated === '' ? senderOf(row) : stated;
}

/** The moment one message arrived, as a number, with an unreadable time sorting last. */
function receivedAt(row: Message): number {
    const at = Date.parse(row.receivedDateTime ?? '');
    return Number.isFinite(at) ? at : Number.NEGATIVE_INFINITY;
}

/** Messages newest first, which a filtered listing does not promise and this file needs. */
function byNewest(one: Message, two: Message): number {
    const first = receivedAt(one);
    const second = receivedAt(two);
    if (first !== second) return first > second ? -1 : 1;
    return (one.id ?? '') < (two.id ?? '') ? -1 : 1;
}

/** One page of a listing and the address of the page after it, if Graph named one. */
async function page(
    args: MailReadArgs,
    url: string
): Promise<{ rows: Message[]; next: string | undefined }> {
    const list = listShape.safeParse(await getJson('microsoft', url, args));
    return list.success
        ? { rows: list.data.value, next: list.data['@odata.nextLink'] }
        : { rows: [], next: undefined };
}

/** The address one signal's first page is asked for. */
function listingUrl(args: MailReadArgs, signal: Signal): string {
    const url = new URL(`${args.base}/me/mailFolders/inbox/messages`);
    url.searchParams.set('$select', SELECT);
    url.searchParams.set('$top', String(args.perSignal));
    const filter = filterFor(signal);
    if (filter !== null) url.searchParams.set('$filter', filter);
    url.searchParams.set('$orderby', `${ORDER_FIELD} desc`);
    return url.toString();
}

/**
 * The messages of one signal, at most `per_signal` of them, every listing asked newest first. A
 * filtered signal is one page, sorted here as well so the order does not rest on the provider. The
 * unlabeled signal has no filter, and its pages are followed until it holds `per_signal`
 * uncategorised messages or UNLABELED_PAGE_MAX pages have been read: the category test is made
 * here, so a page of messages that are all filed yields none of them and the next page is where the
 * signal's own rows are.
 */
async function messagesFor(args: MailReadArgs, signal: Signal): Promise<Message[]> {
    const kept: Message[] = [];
    let url: string | undefined = listingUrl(args, signal);
    for (let read = 0; read < UNLABELED_PAGE_MAX && url !== undefined; read += 1) {
        const answered: { rows: Message[]; next: string | undefined } = await page(args, url);
        kept.push(
            ...(signal === 'unlabeled'
                ? answered.rows.filter((row) => row.categories.length === 0)
                : answered.rows)
        );
        if (signal !== 'unlabeled' || kept.length >= args.perSignal) break;
        url = answered.next;
    }
    if (signal !== 'unlabeled') kept.sort(byNewest);
    return kept.slice(0, args.perSignal);
}

/** Every message of one conversation, newest first, which is the whole of what a thread is here. */
async function conversation(args: MailReadArgs, id: string): Promise<Message[]> {
    const url = new URL(`${args.base}/me/messages`);
    url.searchParams.set('$filter', `conversationId eq '${id.replace(/'/g, "''")}'`);
    url.searchParams.set('$select', SELECT);
    url.searchParams.set('$top', String(args.perSignal));
    const { rows } = await page(args, url.toString());
    return rows.sort(byNewest);
}

/** One conversation in the shape the plate rules take. */
function threadOf(id: string, messages: Message[], facts: MailboxFacts): PlateThread | null {
    const newest = messages.at(0);
    if (newest === undefined) return null;
    const link = httpsLink(newest.webLink);
    const folder = newest.parentFolderId;
    return {
        id,
        sender: senderOf(newest),
        replyTo: replyToOf(newest),
        subject: newest.subject ?? '',
        received: newest.receivedDateTime ?? '',
        snippet: decodeHTML(newest.bodyPreview ?? ''),
        messages: messages.length,
        ...(link === undefined ? {} : { url: link }),
        ownNewest: facts.sentFolder !== '' && folder === facts.sentFolder,
        trashed: facts.trashFolder !== '' && folder === facts.trashFolder
    };
}

/** The id a reply is sent on: the newest message of the conversation. */
function newestMessageId(messages: Message[]): string | undefined {
    return messages.at(0)?.id;
}

/** Every candidate of one account: the three signals read, each conversation read behind them. */
export async function readMicrosoftMail(args: MailReadArgs): Promise<Candidate[]> {
    const facts = await mailboxFacts(args);
    const candidates: Candidate[] = [];
    const read = new Map<string, PlateThread | null>();
    for (const signal of SIGNALS) {
        for (const row of await messagesFor(args, signal)) {
            const id = row.conversationId;
            if (id === undefined) continue;
            if (!read.has(id)) read.set(id, threadOf(id, await conversation(args, id), facts));
            const thread = read.get(id) ?? null;
            if (thread !== null) candidates.push({ signal, thread });
        }
    }
    return candidates;
}

/** Send one reply on the conversation's newest message, which is Graph's own threaded answer. */
export async function replyMicrosoft(
    args: MailReadArgs,
    conversationId: string,
    body: string
): Promise<void> {
    const messages = await conversation(args, conversationId);
    const id = newestMessageId(messages);
    if (id === undefined) throw new Error('microsoft: the conversation holds no message');
    await postJson('microsoft', `${args.base}/me/messages/${encodeURIComponent(id)}/reply`, {
        token: args.token,
        fetcher: args.fetcher,
        body: { comment: body }
    });
}

/** Move every message of the conversation that is in the inbox to the archive folder. */
export async function archiveMicrosoft(args: MailReadArgs, conversationId: string): Promise<void> {
    const messages = await conversation(args, conversationId);
    const inboxId = await folderId(args, 'inbox');
    for (const message of messages) {
        const id = message.id;
        if (id === undefined) continue;
        if (inboxId !== '' && message.parentFolderId !== inboxId) continue;
        await postJson('microsoft', `${args.base}/me/messages/${encodeURIComponent(id)}/move`, {
            token: args.token,
            fetcher: args.fetcher,
            body: { destinationId: 'archive' }
        });
    }
}
