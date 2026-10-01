// Layer 2, client state. What the Inbox view reads and the four commands it presses; its accounts'
// Connect, Add and Remove are state/life/accounts.svelte.ts's, shared with the Calendar.
//
// The plate is derived from the one socket entity, so the view holds no copy of it: a publish
// replaces the payload and the sections are computed again. The only state of this store's own is
// which threads have a write in flight, which is what makes those controls unpressable while the
// server is answering.
//
// A reply and an archive go through the same endpoint as the triage note and are answered by it, so
// the view says what a refused write said and never reads a provider itself. A command whose answer
// never came, or came unreadable, is said in the same sentences the account controls use.

import { optionalTextShape, readAs } from '../../data/shapes/shapes.ts';
import type { InboxKind, InboxPayload, InboxThread } from '../../data/model/index.ts';
import { splitInbox, untriagedActionable, type SplitInbox } from './inbox.ts';
import { t } from '../shared/words/text.ts';
import type { EntitiesStore, PostFailure, WritesStore } from '../shared/stores/shapes.ts';

/** What one write of the page may set on a thread's note. */
export type TriageFields = {
    kind?: InboxKind;
    what?: string;
    draft?: string;
    triaged?: boolean;
};

/** What a command answered: nothing when it worked, the sentence the view says when it did not. */
export type MailAnswer = { ok: boolean; error?: string };

/** The sentence for a command the endpoint refused, or whose answer could not be read. */
function refusal(code: unknown, failed: PostFailure): string {
    const named = readAs(optionalTextShape, code);
    if (named !== undefined && named !== null) return t('inbox.refused', named);
    if (failed === 'unreachable') return t('accounts.unreachable');
    if (failed === 'unreadable') return t('accounts.unreadable');
    return t('inbox.refused', '');
}

/** One client's reader of the inbox plate, and its four commands. */
export type InboxStore = {
    state: () => InboxPayload | null;
    threads: () => InboxThread[];
    split: () => SplitInbox;
    actionable: () => number;
    badgeText: () => string;
    /** Whether a write on this thread has not been answered yet. */
    busy: (thread: InboxThread) => boolean;
    refresh: () => Promise<MailAnswer>;
    triage: (thread: InboxThread, values: TriageFields) => Promise<MailAnswer>;
    reply: (thread: InboxThread, body: string) => Promise<MailAnswer>;
    archive: (thread: InboxThread) => Promise<MailAnswer>;
};

export function createInbox(entities: EntitiesStore, writes: WritesStore): InboxStore {
    /** The threads whose write is still open, by the id the endpoint is given. */
    const busyThreads = $state(new Set<string>());

    function state(): InboxPayload | null {
        return entities.inbox();
    }

    function threads(): InboxThread[] {
        return entities.inbox()?.threads ?? [];
    }

    /** Post one command to the mail endpoint and read its answer. */
    async function command(body: Record<string, unknown>): Promise<MailAnswer> {
        const answer = await writes.postCommand('/api/mail', body);
        if (answer.ok) return { ok: true };
        return { ok: false, error: refusal(answer.body.error, answer.failed) };
    }

    /** One write on one thread, with that thread unpressable until the server answers. */
    async function onThread(
        thread: InboxThread,
        body: Record<string, unknown>
    ): Promise<MailAnswer> {
        busyThreads.add(thread.id);
        try {
            return await command({ ...body, thread: thread.id });
        } finally {
            busyThreads.delete(thread.id);
        }
    }

    return {
        state,
        threads,
        split: () => splitInbox(threads()),
        actionable: () => untriagedActionable(threads()),
        badgeText: () => {
            const count = untriagedActionable(threads());
            return count === 0 ? '' : String(count);
        },
        busy: (thread) => busyThreads.has(thread.id),
        refresh: () => command({ action: 'refresh' }),
        triage: (thread, values) => onThread(thread, { action: 'triage', fields: values }),
        reply: (thread, body) => onThread(thread, { action: 'reply', body }),
        archive: (thread) => onThread(thread, { action: 'archive' })
    };
}
