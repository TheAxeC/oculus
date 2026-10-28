// Layer 2, server. The mail watcher publishes one complete state on the `inbox` channel, in the
// shape of the calendar watcher: every account read at the configured cadence, the short cadence
// while a provider is not answering, the last good plate kept under the state word, one poll at a
// time, and a refresh a control can press.
//
// The cadence and the account list are connect/loop.ts's, shared with the calendar watcher: each
// account's own cadence, a Refresh that reads every account, and a list the machine's file can
// change while the watcher runs, an account added being read at once and one removed leaving the
// next publish.
//
// The triage notes are the one thing published that no provider gave. They are read from the file
// at every publish and the file is polled on a clock (core/file-poll.ts says why it is not
// watched), so a note the skill writes from outside reaches the page without a round of provider
// calls, whenever it lands; a note whose thread has left the plate is dropped from the payload and
// kept in the file for thirty days.
//
// A machine that names no account publishes `unconfigured` and polls nothing, so an install with no
// mailbox costs no timer and no request. When the machine's file names a new mail folder, the notes
// file of that folder is the one polled from then on.
//
// The access token an account is polled with lives in a local variable for the length of that
// account's read and is never held, logged or published. The refresh token is read from the
// account's file at each poll and goes no further than the token call. No message body is read:
// what a thread carries is the provider's own snippet.

import { mkdirSync } from 'node:fs';
import { mailKey } from '../../../data/accounts/mail.ts';
import { fillPlaceholders } from '../../../data/helpers/finding-text.ts';
import type {
    InboxPayload,
    InboxThread,
    InboxTriage,
    MailAccount,
    MailAccountConfig,
    TriageFile,
    TriageNote
} from '../../../data/model/index.ts';
import type { MailSettings, SignInRow } from '../../../data/sources/config.ts';
import type { Hub } from '../../core/channels.ts';
import { POLL, pollFile, systemClock, type Clock, type FilePoll } from '../../core/file-poll.ts';
import { hubMark } from '../../../data/accounts/connect.ts';
import {
    accountLoop,
    roundSignIn,
    takeLoopSettings,
    watcherControls,
    type AccountLoop,
    type WatcherHeld
} from '../connect/loop.ts';
import { hasOwnHalf } from '../connect/store.ts';
import { ReadTimeout, timedFetcher, type Fetcher } from '../connect/oauth.ts';
import { readAddress, type SignInWords } from '../connect/providers.ts';
import { readGoogleMail } from './google.ts';
import { readMicrosoftMail } from './microsoft.ts';
import { plate, type Candidate, type MailReadArgs, type PlateThread } from './plate.ts';
import { pruneNotes, triageFile } from './triage.ts';

export type MailOptions = {
    accounts: MailAccountConfig[];
    /** The folder the credential files and the triage notes live in, already resolved. */
    dir: string;
    /** The folder the providers' client halves live in, already resolved. */
    providerDir: string;
    /** The hub's `sign_in` rows, which give each provider's addresses and scopes. */
    providers: readonly SignInRow[];
    pollMin: number;
    perSignal: number;
    /**
     * How the providers are called; injected so a test reaches every branch without the network.
     */
    fetcher?: Fetcher;
    /** How long one request waits for its answer; READ_TIMEOUT_MS unless a test shortens it. */
    readTimeoutMs?: number;
    /** The catalog's sentences an account's row may carry. */
    words: MailWords;
    /** The moment the payload is stamped with, so a test can pin it. */
    now?: () => Date;
    /** Whether the notes file is polled; a test that drives the poll itself turns it off. */
    pollNotes?: boolean;
    /** The timer pair the notes file is polled on; the globals when absent. */
    clock?: Clock;
    /** Milliseconds between two stats of the notes file. */
    notesEvery?: number;
};

/**
 * The catalog's sentences: a request that had no answer in time, with `{0}` for the seconds
 * waited, and those of a provider with no `sign_in` row of the hub or a row lacking a field.
 */
export type MailWords = { timedOut: string; signIn: SignInWords };

export type MailWatcher = {
    refresh(): Promise<void>;
    /**
     * Take new settings: a new period moves each account's next read as the loop does, and a new
     * count reads every account at once.
     */
    setSettings(settings: MailSettings): void;
    /** Take new sentences, used from the next row that carries one. */
    setWords(words: MailWords): void;
    /** Take the hub's `sign_in` rows as they now stand; changed rows read every account at once. */
    setProviders(rows: readonly SignInRow[]): void;
    /** Publish again over the notes as they now are, without calling any provider. */
    republish(): void;
    /**
     * Poll a new account list from a new folder, as the hubs' `.oculus/local.yml` files name them.
     */
    setAccounts(accounts: MailAccountConfig[], dir: string): void;
    close(): void;
};

/**
 * Minutes before the next attempt while a provider is not answering, the calendar watcher's number
 * and for the same reason: after a failure it is the time a reader sits in front of a stale plate,
 * and an attempt that fails costs one refused request.
 */
export const RETRY_MIN = 2;

/**
 * The mode the mail folder is made at, the credential store's own: it holds that account's keys.
 */
const DIR_MODE = 0o700;

/**
 * What one account's last good poll left behind, kept so a failed poll shows it rather than
 * nothing.
 */
type Kept = { threads: PlateThread[]; lastOk: string };

/**
 * The notes a thread carries on the wire: the fields the file holds, and `triaged` always answered.
 */
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
    const fetcher = timedFetcher(options.fetcher ?? fetch, options.readTimeoutMs);
    const providerDir = options.providerDir;
    const now = options.now ?? ((): Date => new Date());
    let settings: MailSettings = { pollMin: options.pollMin, perSignal: options.perSignal };
    let words = options.words;
    /** Whether the watcher is closed, and the hub's `sign_in` rows it reads its accounts with. */
    const watched: WatcherHeld = { closed: false, rows: options.providers };
    /** Every account's state word and hint, and the plate its last good poll left. */
    const state = new Map<string, MailAccount>();
    const kept = new Map<string, Kept>();
    /** The poll of the notes file, once it has started. */
    let notesPoll: FilePoll | null = null;

    const rowOf = (account: MailAccountConfig): MailAccount =>
        state.get(mailKey(account)) ?? {
            provider: account.provider,
            label: account.label,
            ...hubMark(account),
            status: 'not-connected'
        };

    /**
     * One complete state out of what every account currently says and what the notes file holds.
     */
    const publish = (): void => {
        const held = loop.accounts();
        const accounts = held.map(rowOf);
        const rows: { key: string; thread: PlateThread; account: MailAccountConfig }[] = [];
        for (const account of held) {
            const key = mailKey(account);
            for (const thread of kept.get(key)?.threads ?? []) {
                rows.push({ key, thread, account });
            }
        }
        const onPlate = new Set(rows.map((row) => `${row.key}-${row.thread.id}`));
        let notes: TriageFile = { run: null, notes: {} };
        let notesError: string | undefined;
        notesPoll?.reading();
        try {
            notes = pruneNotes(loop.dir(), onPlate, now().getTime());
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
            held.length === 0
                ? 'unconfigured'
                : accounts.some((account) => account.status === 'error')
                  ? 'error'
                  : 'ok';
        hub.publish('inbox', {
            status,
            accounts,
            threads,
            updated: now().toISOString(),
            pollMin: settings.pollMin,
            retryMin: RETRY_MIN,
            notesRun: notes.run,
            ...(notesError === undefined ? {} : { notesError })
        } satisfies InboxPayload);
        console.log(`mail publish: ${status}`);
    };

    /**
     * One account, read to the end or given the state word its failure earned. An account whose
     * provider has no client half on this machine is `not-connected` and says the provider needs
     * setting up; one with a half and no refresh token is `not-connected` and waits for Connect.
     * Neither is a failure, and neither shortens the cadence. What a read of an account that has
     * left, or of a folder that was replaced, comes back with is dropped.
     */
    const pollAccount = async (
        account: MailAccountConfig,
        dir: string,
        live: () => boolean
    ): Promise<boolean> => {
        const key = mailKey(account);
        const held = kept.get(key);
        const base = {
            provider: account.provider,
            label: account.label,
            ...hubMark(account),
            ...(hasOwnHalf(dir, account) ? { ownHalf: true } : {}),
            ...(held === undefined ? {} : { lastOk: held.lastOk })
        };
        try {
            const signed = await roundSignIn('mail', account, { dir, providerDir }, fetcher, {
                providers: { rows: watched.rows, words: words.signIn },
                wait: (waiting) => state.set(key, { ...base, ...waiting }),
                live
            });
            if (signed === null) return true;
            const args: MailReadArgs = {
                token: signed.token,
                base: readAddress(signed.row, 'mail'),
                link: signed.row.mailLink ?? '',
                key,
                perSignal: settings.perSignal,
                fetcher
            };
            const candidates: Candidate[] =
                account.provider === 'google'
                    ? await readGoogleMail(args)
                    : await readMicrosoftMail(args);
            if (!live()) return true;
            const lastOk = now().toISOString();
            kept.set(key, { threads: plate(candidates), lastOk });
            state.set(key, {
                provider: account.provider,
                label: account.label,
                ...hubMark(account),
                status: 'connected',
                lastOk
            });
            return true;
        } catch (error) {
            if (!live()) return false;
            const hint =
                error instanceof ReadTimeout
                    ? fillPlaceholders(words.timedOut, [String(error.ms / 1000)])
                    : reason(error);
            state.set(key, { ...base, status: 'error', hint });
            return false;
        }
    };

    /**
     * The notes file, polled so a write from the triage skill reaches the page. The folder is made
     * when it is not there yet, since it is the one the credential files live in either way and the
     * skill writes into it. What the file says at the start is taken as read: the first publish
     * reads it anyway, and a tick before the first round would otherwise publish every account as
     * not connected. A publish reads the file too, so a page write published at once is not
     * published a second time by the tick after it. A new mail folder closes the poll of the old
     * one and starts one of its own.
     */
    const startNotesPoll = (dir: string): void => {
        if (options.pollNotes === false) return;
        notesPoll?.close();
        try {
            mkdirSync(dir, { recursive: true, mode: DIR_MODE });
        } catch (error) {
            console.error(`mail watch: the mail folder cannot be made: ${reason(error)}`);
        }
        const clock = options.clock ?? systemClock;
        const every = options.notesEvery ?? POLL;
        notesPoll = pollFile(triageFile(dir), { clock, every }, publish);
        notesPoll.reading();
    };

    const loop: AccountLoop<MailAccountConfig> = accountLoop(
        { accounts: options.accounts, dir: options.dir, pollMin: settings.pollMin },
        {
            retryMin: RETRY_MIN,
            now,
            read: pollAccount,
            publish,
            held: [state, kept],
            moved: startNotesPoll
        }
    );
    startNotesPoll(options.dir);
    loop.start();

    return {
        refresh: () => loop.run(true),
        republish: publish,
        setSettings(next): void {
            if (watched.closed) return;
            const before = settings;
            settings = { ...next };
            takeLoopSettings(
                loop,
                { before: before.pollMin, after: next.pollMin },
                next.perSignal !== before.perSignal,
                publish
            );
        },
        setWords(next): void {
            if (!watched.closed) words = { ...next };
        },
        ...watcherControls(loop, watched, {
            pollMin: () => settings.pollMin,
            publish,
            closing: () => {
                notesPoll?.close();
                notesPoll = null;
            }
        })
    };
}

function reason(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
}
