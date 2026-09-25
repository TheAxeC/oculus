// Layer 2, client state. What the Inbox view reads and the five commands it presses.
//
// The plate is derived from the one socket entity, so the view holds no copy of it: a publish
// replaces the payload and the sections are computed again. The only state of this store's own is
// which accounts have a Connect press in flight and which threads have a write in flight, which is
// what makes those controls unpressable while the server is answering.
//
// A reply and an archive go through the same endpoint as the triage note and are answered by it, so
// the view says what a refused write said and never reads a provider itself.

import { fields } from '../../data/helpers/guards.ts';
import { mailKey } from '../../data/accounts/mail.ts';
import type { InboxKind, InboxPayload, InboxThread, MailAccount } from '../../data/model/index.ts';
import { splitInbox, untriagedActionable, type SplitInbox } from './inbox.ts';
import type { EntitiesStore, WritesStore } from '../shared/stores/shapes.ts';

/** What one write of the page may set on a thread's note. */
export type TriageFields = {
    kind?: InboxKind;
    what?: string;
    draft?: string;
    triaged?: boolean;
};

/** What a command answered: nothing when it worked, the server's own sentence when it did not. */
export type MailAnswer = { ok: boolean; error?: string };

/** One client's reader of the inbox plate, and its five commands. */
export type InboxStore = {
    state: () => InboxPayload | null;
    threads: () => InboxThread[];
    split: () => SplitInbox;
    actionable: () => number;
    badgeText: () => string;
    /** Whether a Connect press on this account has not been answered yet. */
    connecting: (account: MailAccount) => boolean;
    /** Whether a write on this thread has not been answered yet. */
    busy: (thread: InboxThread) => boolean;
    refresh: () => Promise<MailAnswer>;
    connect: (account: MailAccount) => Promise<MailAnswer>;
    triage: (thread: InboxThread, values: TriageFields) => Promise<MailAnswer>;
    reply: (thread: InboxThread, body: string) => Promise<MailAnswer>;
    archive: (thread: InboxThread) => Promise<MailAnswer>;
};

export function createInbox(entities: EntitiesStore, writes: WritesStore): InboxStore {
    /** The accounts whose Connect press is still open, by the key the endpoint is given. */
    const connectingKeys = $state(new Set<string>());
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
        const response = await fetch('/api/mail', {
            method: 'POST',
            headers: { 'content-type': 'application/json', 'x-oculus-token': writes.writeToken() },
            body: JSON.stringify(body)
        });
        const answer = fields(await response.json());
        if (response.ok) return { ok: true };
        return { ok: false, error: typeof answer.error === 'string' ? answer.error : '' };
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
        connecting: (account) => connectingKeys.has(mailKey(account)),
        busy: (thread) => busyThreads.has(thread.id),
        refresh: () => command({ action: 'refresh' }),
        connect: async (account) => {
            const key = mailKey(account);
            connectingKeys.add(key);
            try {
                return await command({ action: 'connect', account: key });
            } finally {
                connectingKeys.delete(key);
            }
        },
        triage: (thread, values) => onThread(thread, { action: 'triage', fields: values }),
        reply: (thread, body) => onThread(thread, { action: 'reply', body }),
        archive: (thread) => onThread(thread, { action: 'archive' })
    };
}
