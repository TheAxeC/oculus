// Layer 2, server. What a thread looks like once a provider has been read, and the rules that
// decide which of them are on the plate.
//
// The plate is three signals and three drops, and both providers apply the same ones: a thread is
// on the plate when it is in the inbox and unread, or carries the `todo` label, or is unlabeled;
// from the unlabeled signal a thread of more than one message, or one whose subject says it is a
// reply or a forward, is dropped; and from every signal a thread whose newest message is the
// reader's own, or is in the trash, is dropped. Starred is not a signal.
//
// The signals are unioned and deduplicated by thread id, so a thread that is both unread and
// labelled appears once. The rules are here rather than in either provider reader so that one
// change to the plate changes both.

import { isChainSubject } from '../../../data/accounts/mail.ts';
import type { MailProvider } from '../../../data/model/index.ts';

/** The three signals, in the order they are read. */
export type Signal = 'unread' | 'todo' | 'unlabeled';

export const SIGNALS: Signal[] = ['unread', 'todo', 'unlabeled'];

/** The label a reader puts on a thread to say it is waiting on them. */
export const TODO_LABEL = 'todo';

/** One thread as a provider reader hands it over, before the drops are applied. */
export type PlateThread = {
    /** The provider's own thread id, without the account key. */
    id: string;
    sender: string;
    /** Where a reply on this thread goes, which the page names before it sends one. */
    replyTo: string;
    subject: string;
    received: string;
    snippet: string;
    messages: number;
    url?: string;
    /** Whether the newest message of the thread was sent by the reader themselves. */
    ownNewest: boolean;
    /** Whether the newest message of the thread is in the trash. */
    trashed: boolean;
};

/** One thread with the signal it came in on, which decides whether the chain drops apply. */
export type Candidate = { signal: Signal; thread: PlateThread };

/**
 * Whether one candidate stays on the plate. Two drops are the unlabeled signal's alone, since a
 * thread a reader has left unread or labelled `todo` is on the plate whatever its shape; the other
 * two are every signal's, because a thread the reader has already answered, or thrown away, is off
 * the plate however it was found.
 */
export function kept(candidate: Candidate): boolean {
    const { thread } = candidate;
    if (thread.ownNewest || thread.trashed) return false;
    if (candidate.signal !== 'unlabeled') return true;
    return thread.messages <= 1 && !isChainSubject(thread.subject);
}

/**
 * The plate out of every signal's candidates: the drops applied, the union deduplicated by thread
 * id keeping the first signal a thread came in on, and the result newest first so the page draws
 * the newest thread at the head of its section.
 */
export function plate(candidates: Candidate[]): PlateThread[] {
    const found = new Map<string, PlateThread>();
    for (const candidate of candidates) {
        if (!kept(candidate)) continue;
        if (found.has(candidate.thread.id)) continue;
        found.set(candidate.thread.id, candidate.thread);
    }
    return [...found.values()].sort(byNewest);
}

/** Threads newest first; a received time that cannot be read sorts last. */
function byNewest(one: PlateThread, two: PlateThread): number {
    const first = Date.parse(one.received);
    const second = Date.parse(two.received);
    const left = Number.isFinite(first) ? first : Number.NEGATIVE_INFINITY;
    const right = Number.isFinite(second) ? second : Number.NEGATIVE_INFINITY;
    if (left !== right) return left > right ? -1 : 1;
    return one.id < two.id ? -1 : one.id > two.id ? 1 : 0;
}

/** Everything a provider reader is given: one access token, the cap per signal, the fetcher. */
export type MailReadArgs = {
    token: string;
    /** The provider's mail address, the `mail` of its `sign_in` row, with no `/` after it. */
    base: string;
    /**
     * The address of a thread's own page at the provider, the row's `mail_link`, with `{id}` for
     * the thread's id; empty when the row gives none, and a thread then has no link.
     */
    link: string;
    /** The account's key, which prefixes every thread id so two accounts cannot collide. */
    key: string;
    perSignal: number;
    fetcher: typeof fetch;
};

/** What one account's read answers with, and which provider read it. */
export type MailReading = { provider: MailProvider; threads: PlateThread[] };
