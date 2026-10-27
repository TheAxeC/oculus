// Layer 2, client state. Pure grouping, tones, search and saved view state for the Inbox, so the
// section a thread lands in is decided in one place rather than in the markup.
//
// A thread's kind is its triage note's, which the triage skill or the reader wrote; a thread nobody
// has classified yet has none and is drawn in its own section ahead of the three, since it is the
// one thing on the plate that nothing has said anything about. A triaged thread leaves its section
// whatever its kind.
//
// A card is titled by who wrote the thread, read from the From line as the provider gave it: the
// display name alone, with the address beside it in smaller words, or the address when the line
// names nobody.

import { z } from 'zod';
import { ageOf, mailKey } from '../../data/accounts/mail.ts';
import { fieldItemsShape, readAs, searchRevealShape } from '../../data/shapes/shapes.ts';
import { instanceFolded } from '../shared/page/folds.ts';
import { t } from '../shared/words/text.ts';
export { ageOf, mailKey } from '../../data/accounts/mail.ts';
export type { Age } from '../../data/accounts/mail.ts';
export type {
    InboxKind,
    InboxPayload,
    InboxThread,
    InboxTriage,
    MailAccount
} from '../../data/model/index.ts';
import type { InboxKind, InboxThread, MailAccount } from '../../data/model/index.ts';

/** The four lists the view draws, in the order it draws them. */
export type SplitInbox = {
    unsorted: InboxThread[];
    replies: InboxThread[];
    actions: InboxThread[];
    info: InboxThread[];
    triaged: InboxThread[];
};

export type InboxState = {
    search: string;
    triagedOpen: boolean;
    /**
     * The threads whose draft editor is open. It is this view instance's state rather than a card's
     * own, so an open editor survives a publish and two panes of the same view do not share it.
     */
    drafts: string[];
    /** The keys of the folded sections: `unsorted`, `reply`, `action` and `info`. */
    folded: string[];
    /** The palette destination, cleared by the view after it scrolls and flashes the card. */
    reveal?: string;
};

/** The fields a view instance keeps of the Inbox, each read as absent when of the wrong type. */
const inboxStateShape = searchRevealShape.extend({
    triagedOpen: z.boolean().catch(false),
    drafts: fieldItemsShape
});

/** What a thread was classified as, and nothing when no note has classified it. */
export function kindOf(thread: InboxThread): InboxKind | null {
    return thread.triage.kind ?? null;
}

/** The fixed semantic tone of each inbox kind; a thread with no kind carries the neutral one. */
export function kindTone(kind: InboxKind | null): string {
    if (kind === 'reply') return 'amber';
    if (kind === 'action') return 'red';
    if (kind === 'info') return 'teal';
    return 'slate';
}

/** Split the plate by kind, every triaged thread in its own list. */
export function splitInbox(threads: InboxThread[]): SplitInbox {
    const split: SplitInbox = { unsorted: [], replies: [], actions: [], info: [], triaged: [] };
    for (const thread of threads) {
        if (thread.triage.triaged) {
            split.triaged.push(thread);
            continue;
        }
        const kind = kindOf(thread);
        if (kind === 'reply') split.replies.push(thread);
        else if (kind === 'action') split.actions.push(thread);
        else if (kind === 'info') split.info.push(thread);
        else split.unsorted.push(thread);
    }
    return split;
}

/** Require every typed word across the sender, the subject, the note and the provider's snippet. */
export function inboxSearch(threads: InboxThread[], search: string): InboxThread[] {
    const needles = search.trim().toLowerCase().split(/\s+/).filter(Boolean);
    if (needles.length === 0) return threads;
    return threads.filter((thread) => {
        const text = [thread.sender, thread.subject, thread.triage.what ?? '', thread.snippet]
            .join(' ')
            .toLowerCase();
        return needles.every((needle) => text.includes(needle));
    });
}

/**
 * How many threads the view's badge counts: the ones nobody has finished with that ask for an
 * answer or an action. A thread no note has classified counts too, since what it wants is not known
 * yet and a badge that hid it would hide exactly the threads nothing has looked at.
 */
export function untriagedActionable(threads: InboxThread[]): number {
    return threads.filter((thread) => !thread.triage.triaged && thread.triage.kind !== 'info')
        .length;
}

/** The account row one thread belongs to, or null when the payload names no such account. */
export function accountOf(accounts: MailAccount[], thread: InboxThread): MailAccount | null {
    return accounts.find((account) => mailKey(account) === thread.account) ?? null;
}

/** How old one thread is at the moment the page is in, or null when the time cannot be read. */
export function threadAge(thread: InboxThread, now: number): ReturnType<typeof ageOf> {
    return ageOf(thread.received, now);
}

/**
 * A From line read as `Name <address>`, the name unquoted: what comes before the angle brackets.
 */
const FROM_LINE = /^\s*(.*?)\s*<([^<>]*)>\s*$/;

/**
 * A From line split into the display name and the address, reading `Name <addr>`,
 * `"Name, Quoted" <addr>` and a bare `addr`; a line with no display name has the empty name.
 */
export function senderParts(from: string): { name: string; address: string } {
    const match = FROM_LINE.exec(from);
    if (match === null) return { name: '', address: from.trim() };
    const quoted = /^"(.*)"$/.exec(match[1]);
    const name = quoted === null ? match[1] : quoted[1].replace(/\\(.)/g, '$1');
    return { name: name.trim(), address: match[2].trim() };
}

/**
 * Who a reply on this thread reaches: the address the provider will answer to, which is the newest
 * message's `Reply-To` where it has one. The card falls back to the sender only when the payload
 * carries neither, so what the confirmation names is what the send is addressed to.
 */
export function recipientOf(thread: InboxThread): string {
    return thread.replyTo || thread.sender || t('inbox.thread');
}

/** The sentence the reader confirms before an answer is sent: who it reaches, and from where. */
export function sendConfirm(thread: InboxThread, account: string): string {
    return t('inbox.send_confirm', recipientOf(thread), account);
}

/** The sentence the reader confirms before a thread is taken off the inbox. */
export function archiveConfirm(thread: InboxThread, account: string): string {
    return t('inbox.archive_confirm', recipientOf(thread), account);
}

/** Read search, the Triaged fold and the folded sections from one view instance. */
export function parseInboxState(raw: unknown): InboxState {
    const held = readAs(inboxStateShape, raw) ?? { search: '', triagedOpen: false, drafts: [] };
    const state: InboxState = {
        search: held.search,
        triagedOpen: held.triagedOpen,
        drafts: held.drafts,
        folded: instanceFolded(raw)
    };
    if (held.reveal !== undefined) state.reveal = held.reveal;
    return state;
}

/** How many threads are on the plate still to be triaged or answered: every section but triaged. */
export function plateCount(split: SplitInbox): number {
    return split.unsorted.length + split.replies.length + split.actions.length + split.info.length;
}
