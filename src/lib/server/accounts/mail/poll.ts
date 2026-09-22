// Layer 2, server. The mail watcher publishes one complete state on the `inbox` channel, in the
// shape of the calendar watcher: every account read at the configured cadence, the short cadence
// while a provider is not answering, the last good plate kept under the state word, one poll at a
// time, and a refresh a control can press.
//
// The cadence is each account's own. An account that failed is due again after RETRY_MIN and one
// that answered after poll_min, the one timer fires at the earliest of those times, and a round
// reads only the accounts that are due; so one provider refusing does not make the other one be
// called every two minutes. The Refresh control reads every account whatever its due time, since
// what a press asks for is the state now.
//
// The triage notes are the one thing published that no provider gave. They are read from the file
// at every publish and the file is watched, so a note the skill writes from outside reaches the page
// without a round of provider calls; a note whose thread has left the plate is dropped from the
// payload and kept in the file for thirty days.
//
// A machine that names no account publishes `unconfigured` once and polls nothing, so an install
// with no mailbox costs no timer and no request.
//
// The access token an account is polled with lives in a local variable for the length of that
// account's read and is never held, logged or published. The refresh token is read from the
// account's file at each poll and goes no further than the token call. No message body is read: what
// a thread carries is the provider's own snippet.

import { mkdirSync, watch, type FSWatcher } from 'node:fs';
import { mailKey } from '../../../data/accounts/mail.ts';
import type {
    InboxPayload,
    InboxThread,
    InboxTriage,
    MailAccount,
    MailAccountConfig,
    TriageFile,
    TriageNote
} from '../../../data/model.ts';
import type { Hub } from '../../core/channels.ts';
import { accessToken, type Fetcher } from '../connect/oauth.ts';
import { credentialFile, readCredentials } from '../connect/store.ts';
import { readGoogleMail } from './google.ts';
import { readMicrosoftMail } from './microsoft.ts';
import { plate, type Candidate, type MailReadArgs, type PlateThread } from './plate.ts';
import { pruneNotes, triageFile } from './triage.ts';

export type MailOptions = {
    accounts: MailAccountConfig[];
    /** The folder the credential files and the triage notes live in, already resolved. */
    dir: string;
    pollMin: number;
    perSignal: number;
    /** How the providers are called; injected so a test reaches every branch without the network. */
    fetcher?: Fetcher;
    /** The moment the payload is stamped with, so a test can pin it. */
    now?: () => Date;
    /** Whether the notes file is watched; a test that drives the poll itself turns it off. */
    watchNotes?: boolean;
};

export type MailWatcher = {
    refresh(): Promise<void>;
    /** Publish again over the notes as they now are, without calling any provider. */
    republish(): void;
    close(): void;
};

/**
 * Minutes before the next attempt while a provider is not answering, the calendar watcher's number
 * and for the same reason: after a failure it is the time a reader sits in front of a stale plate,
 * and an attempt that fails costs one refused request.
 */
export const RETRY_MIN = 2;

/** The mode the mail folder is made at, the credential store's own: it holds that account's keys. */
const DIR_MODE = 0o700;

/** What one account's last good poll left behind, kept so a failed poll shows it rather than nothing. */
type Kept = { threads: PlateThread[]; lastOk: string };

/** The notes a thread carries on the wire: the fields the file holds, and `triaged` always answered. */
function triageOf(held: TriageFile, id: string): InboxTriage {
    if (!Object.hasOwn(held.notes, id)) return { triaged: false };
    const note: TriageNote = held.notes[id];
    return {
        ...(note.kind === undefined ? {} : { kind: note.kind }),
        ...(note.what === undefined ? {} : { what: note.what }),
        ...(note.draft === undefined ? {} : { draft: note.draft }),
        triaged: note.triaged === true
    };
}

export function watchMail(hub: Hub, options: MailOptions): MailWatcher {
    const fetcher = options.fetcher ?? fetch;
    const now = options.now ?? ((): Date => new Date());
    /** Every account's state word and hint, and the plate its last good poll left. */
    const state = new Map<string, MailAccount>();
    const kept = new Map<string, Kept>();
    let closed = false;
    const stopped = (): boolean => closed;

    const rowOf = (account: MailAccountConfig): MailAccount =>
        state.get(mailKey(account)) ?? {
            provider: account.provider,
            label: account.label,
            status: 'not-connected'
        };

    /** One complete state out of what every account currently says and what the notes file holds. */
    const publish = (): void => {
        const accounts = options.accounts.map(rowOf);
        const rows: { key: string; thread: PlateThread; account: MailAccountConfig }[] = [];
        for (const account of options.accounts) {
            const key = mailKey(account);
            for (const thread of kept.get(key)?.threads ?? []) {
                rows.push({ key, thread, account });
            }
        }
        const onPlate = new Set(rows.map((row) => `${row.key}-${row.thread.id}`));
        let notes: TriageFile = { run: null, notes: {} };
        let notesError: string | undefined;
        try {
            notes = pruneNotes(options.dir, onPlate, now().getTime());
        } catch (error) {
            notesError = reason(error);
        }
        const threads: InboxThread[] = rows.map(({ key, thread, account }) => {
            const id = `${key}-${thread.id}`;
            return {
                id,
                account: key,
                provider: account.provider,
                sender: thread.sender,
                replyTo: thread.replyTo,
                subject: thread.subject,
                received: thread.received,
                snippet: thread.snippet,
                messages: thread.messages,
                ...(thread.url === undefined ? {} : { url: thread.url }),
                triage: triageOf(notes, id)
            };
        });
        const status: InboxPayload['status'] =
            options.accounts.length === 0
                ? 'unconfigured'
                : accounts.some((account) => account.status === 'error')
                  ? 'error'
                  : 'ok';
        hub.publish('inbox', {
            status,
            accounts,
            threads,
            updated: now().toISOString(),
            pollMin: options.pollMin,
            retryMin: RETRY_MIN,
            notesRun: notes.run,
            ...(notesError === undefined ? {} : { notesError })
        } satisfies InboxPayload);
        console.log(`mail publish: ${status}`);
    };

    /**
     * One account, read to the end or given the state word its failure earned. A file that is not
     * there yet, or that holds no refresh token, is `not-connected` with the path the reader creates;
     * that is not a failure and does not shorten the cadence.
     */
    const pollAccount = async (account: MailAccountConfig): Promise<boolean> => {
        const key = mailKey(account);
        const held = kept.get(key);
        const base = {
            provider: account.provider,
            label: account.label,
            ...(held === undefined ? {} : { lastOk: held.lastOk })
        };
        try {
            const credentials = readCredentials(options.dir, account);
            if (credentials?.refreshToken === undefined) {
                state.set(key, {
                    ...base,
                    status: 'not-connected',
                    hint: credentialFile(options.dir, account)
                });
                return true;
            }
            const token = await accessToken('mail', credentials, credentials.refreshToken, fetcher);
            if (stopped()) return true;
            const args: MailReadArgs = {
                token,
                key,
                perSignal: options.perSignal,
                fetcher
            };
            const candidates: Candidate[] =
                account.provider === 'google'
                    ? await readGoogleMail(args)
                    : await readMicrosoftMail(args);
            if (stopped()) return true;
            const lastOk = now().toISOString();
            kept.set(key, { threads: plate(candidates), lastOk });
            state.set(key, {
                provider: account.provider,
                label: account.label,
                status: 'connected',
                lastOk
            });
            return true;
        } catch (error) {
            state.set(key, { ...base, status: 'error', hint: reason(error) });
            return false;
        }
    };

    /** When each account is next due, as an epoch time; an account with no entry is due now. */
    const due = new Map<string, number>();
    const dueAt = (account: MailAccountConfig): number => due.get(mailKey(account)) ?? 0;

    /**
     * One pending attempt at a time, fired at the earliest account's due time. One handle, which
     * close() clears.
     */
    let timer: ReturnType<typeof setTimeout> | null = null;
    const schedule = (): void => {
        if (timer !== null) clearTimeout(timer);
        if (stopped() || options.accounts.length === 0) {
            timer = null;
            return;
        }
        const wait = Math.min(...options.accounts.map(dueAt)) - now().getTime();
        timer = setTimeout(() => void run(false), Math.max(0, wait));
    };

    /**
     * One round: every account when a press asked for it, and the ones that are due otherwise. An
     * account's next due time is set from its own outcome, so a refusing provider shortens its own
     * cadence and nobody else's.
     */
    const poll = async (all: boolean): Promise<void> => {
        const wanted = options.accounts.filter(
            (account) => all || dueAt(account) <= now().getTime()
        );
        try {
            for (const account of wanted) {
                if (stopped()) return;
                const good = await pollAccount(account);
                const minutes = good ? options.pollMin : RETRY_MIN;
                due.set(mailKey(account), now().getTime() + minutes * 60000);
            }
            if (stopped() || wanted.length === 0) return;
            publish();
        } finally {
            if (!stopped()) schedule();
        }
    };

    /**
     * The round in flight, if there is one, and the one follow-up round every caller asked for
     * meanwhile shares. A refresh never opens a second round of provider calls beside the round
     * running, so the rows and the state words are always the newest round's; it does get a round
     * that starts after the one in flight, since what asked for it wants the providers' state after
     * its own action and not the answer of a round begun before it. A press that lands while a
     * timed round runs makes that follow-up read every account, not only the due ones.
     */
    let running: Promise<void> | null = null;
    let queued: Promise<void> | null = null;
    let queuedAll = false;
    const run = (all: boolean): Promise<void> => {
        if (stopped() || options.accounts.length === 0) return Promise.resolve();
        if (running === null) {
            running = poll(all).finally(() => (running = null));
            return running;
        }
        queuedAll ||= all;
        queued ??= running
            .then(() => {
                const wanted = queuedAll;
                queuedAll = false;
                return run(wanted);
            })
            .finally(() => (queued = null));
        return queued;
    };

    /**
     * The notes file, watched so a write from the triage skill reaches the page. The folder is
     * watched rather than the file, since the file is written whole and a watch on a path that is
     * replaced stops seeing it, and the folder is made when it is not there yet: a machine whose
     * mail folder the reader has not created would otherwise see a note only after a restart, and
     * the folder is the one the credential files live in either way.
     */
    let notesWatch: FSWatcher | null = null;
    const startNotesWatch = (): void => {
        if (options.watchNotes === false) return;
        const wanted = triageFile(options.dir);
        try {
            mkdirSync(options.dir, { recursive: true, mode: DIR_MODE });
            notesWatch = watch(options.dir, (_event, name) => {
                if (stopped()) return;
                if (name !== null && !wanted.endsWith(name)) return;
                publish();
            });
        } catch (error) {
            console.error(`mail watch: the triage notes are not watched: ${reason(error)}`);
        }
    };

    if (options.accounts.length === 0) publish();
    else void run(true);
    startNotesWatch();

    return {
        refresh: () => run(true),
        republish: publish,
        close(): void {
            closed = true;
            if (timer !== null) clearTimeout(timer);
            timer = null;
            notesWatch?.close();
            notesWatch = null;
        }
    };
}

function reason(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
}
