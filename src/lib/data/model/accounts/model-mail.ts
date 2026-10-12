// Layer 1, data. The mail connector's types: what a machine configures, what the poller publishes
// on the `inbox` channel, and the note a thread carries.
//
// It is a concern module of its own in the accounts folder, beside model-calendar.ts, reached
// through the index.ts facade alone, because mail changes for mail reasons: a plate signal, a
// triage field, a send.
//
// What the payload carries of a message is the provider's own snippet and nothing else. A body is
// read by neither poller nor route, so no part of a message beyond the one line the provider
// already shows in its own list reaches the page, the socket or a log.

import type {
    ConnectAccountConfig,
    ConnectAccountStatus,
    ConnectProvider,
    ConnectStatus
} from './model-connect.ts';

/** The two providers a mailbox is read from, in the order they are offered. */
export type MailProvider = ConnectProvider;

/** One account of `mail:` in a hub's `.oculus/local.yml`. */
export type MailAccountConfig = ConnectAccountConfig;

/** The connector as a whole: `unconfigured` when the machine names no account. */
export type MailStatus = ConnectStatus;

/** One account: `not-connected` until its credential file holds a refresh token. */
export type MailAccountStatus = ConnectAccountStatus;

export type MailAccount = {
    provider: MailProvider;
    label: string;
    /** The hub whose `.oculus/local.yml` holds the account. */
    hub?: string;
    status: MailAccountStatus;
    /** One line saying what is wrong with the account, absent while nothing is. */
    hint?: string;
    /**
     * Set when this machine holds no client half for the account's provider, so Connect cannot
     * start until the provider is set up on the account setup page.
     */
    needsSetup?: boolean;
    /**
     * Set when the account's own file names a client id, which a Remove deletes with the file; the
     * provider's own half is a file of its own and stays.
     */
    ownHalf?: boolean;
    /** When the provider last answered for this account. */
    lastOk?: string;
};

/** What a thread wants: an answer, something done, or nothing at all. */
export type InboxKind = 'reply' | 'action' | 'info';

/**
 * One thread's note, as the triage file holds it. `written` is when the note was last changed,
 * which is what the thirty-day prune reads; the page and the triage skill both write it.
 */
export type TriageNote = {
    kind?: InboxKind;
    what?: string;
    draft?: string;
    triaged?: boolean;
    written: string;
};

/** The whole triage file: when the skill last wrote it, and one note per thread id. */
export type TriageFile = {
    /** The day the triage skill last ran, or null when it never has on this machine. */
    run: string | null;
    notes: Record<string, TriageNote>;
};

/** What a thread's note says on the wire; `triaged` is always answered, the rest only when set. */
export type InboxTriage = {
    kind?: InboxKind;
    what?: string;
    draft?: string;
    triaged: boolean;
};

export type InboxThread = {
    /** Unique across accounts: the account key and the provider's own thread id. */
    id: string;
    /** The account's key, which is what a reply or an archive names. */
    account: string;
    provider: MailProvider;
    /** The newest message's sender, as the provider wrote it. */
    sender: string;
    /**
     * Where a reply on this thread goes: the newest message's `Reply-To` when it carries one, and
     * its sender otherwise, which is the rule the send itself follows. The confirmation names it,
     * so the reader is asked about the address the answer will reach.
     */
    replyTo: string;
    subject: string;
    /** When the newest message arrived, as the provider gave it. */
    received: string;
    /**
     * The provider's own one-line preview, which is the only message text that leaves the server.
     */
    snippet: string;
    /** How many messages the thread holds. */
    messages: number;
    /** The provider's own page for this thread. */
    url?: string;
    triage: InboxTriage;
};

export type InboxPayload = {
    status: MailStatus;
    accounts: MailAccount[];
    /** Every account's plate, newest first. */
    threads: InboxThread[];
    updated: string;
    pollMin: number;
    /** Minutes between attempts while a provider is not answering. */
    retryMin: number;
    /** The day the triage skill last wrote the notes file, or null when it never has. */
    notesRun: string | null;
    /**
     * One line saying why the notes file could not be read, absent while it reads. A file that is
     * there and broken costs every note, so it is said on the page rather than on stderr alone.
     */
    notesError?: string;
};
