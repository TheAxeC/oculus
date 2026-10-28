// Layer 2, server. The calendar watcher publishes one complete state on the `calendar` channel, in
// the shape of the Live HPC watcher: every account read at the configured cadence, the short
// cadence while a provider is not answering, the last good events kept under the state word, one
// poll at a time, and a refresh a control can press.
//
// The cadence and the account list are connect/loop.ts's, shared with the mail watcher: each
// account's own cadence, a Refresh that reads every account, and a list the machine's file can
// change while the watcher runs, an account added being read at once and one removed leaving the
// next publish. A machine that names no account publishes `unconfigured` and polls nothing, so an
// install with no calendar costs no timer and no request.
//
// The access token an account is polled with lives in a local variable for the length of that
// account's read and is never held, logged or published. The refresh token is read from the
// account's file at each poll and goes no further than the token call.
//
// A published link is read with no sign-in: its link is read from the account's own file at each
// poll and goes no further than the fetch. It is the reader's key to the calendar, so a failed read
// is said in a fixed sentence naming the label and never in the thrown message, which could carry
// the address; the sentences are the catalog's, handed in by the caller.

import { calendarKey } from '../../../data/accounts/calendar.ts';
import { hubMark, signsIn } from '../../../data/accounts/connect.ts';
import { fillPlaceholders } from '../../../data/helpers/finding-text.ts';
import type {
    CalendarAccount,
    CalendarAccountConfig,
    CalendarEvent,
    CalendarListEntry,
    CalendarPayload
} from '../../../data/model/index.ts';
import type { CalendarSettings, SignInRow } from '../../../data/sources/config.ts';
import type { Hub } from '../../core/channels.ts';
import type { Reading, Window } from './api.ts';
import { readGoogle } from './google.ts';
import { readIcs } from './ics.ts';
import { readMicrosoft } from './microsoft.ts';
import {
    accountLoop,
    roundSignIn,
    takeLoopSettings,
    watcherControls,
    type AccountLoop,
    type WatcherHeld
} from '../connect/loop.ts';
import { hasOwnHalf, readPublishedLink } from '../connect/store.ts';
import { ReadTimeout, timedFetcher, type Fetcher } from '../connect/oauth.ts';
import { readAddress, type SignInWords } from '../connect/providers.ts';

/**
 * The sentences an account's row may carry, from the catalog: a published link's file holds no
 * link, its link could not be read (`{0}` the label), and a request had no answer in time (`{0}`
 * the seconds waited).
 */
export type CalendarWords = {
    icsNoLink: string;
    icsFailed: string;
    timedOut: string;
    /** The sentences of a provider with no `sign_in` row of the hub, or a row lacking a field. */
    signIn: SignInWords;
};

export type CalendarOptions = {
    accounts: CalendarAccountConfig[];
    /** The folder the credential files live in, already resolved. */
    dir: string;
    /** The folder the providers' client halves live in, already resolved. */
    providerDir: string;
    /** The hub's `sign_in` rows, which give each provider's addresses and scopes. */
    providers: readonly SignInRow[];
    pollMin: number;
    daysBack: number;
    daysAhead: number;
    /**
     * How the providers are called; injected so a test reaches every branch without the network.
     */
    fetcher?: Fetcher;
    /** How long one request waits for its answer; READ_TIMEOUT_MS unless a test shortens it. */
    readTimeoutMs?: number;
    /** The moment the window is measured from, so a test can pin it. */
    now?: () => Date;
    words: CalendarWords;
};

export type CalendarWatcher = {
    refresh(): Promise<void>;
    /**
     * Take new settings: a new period moves each account's next read as the loop does, and a new
     * window reads every account at once.
     */
    setSettings(settings: CalendarSettings): void;
    /** Take new sentences, used from the next row that carries one. */
    setWords(words: CalendarWords): void;
    /** Take the hub's `sign_in` rows as they now stand; changed rows read every account at once. */
    setProviders(rows: readonly SignInRow[]): void;
    /**
     * Poll a new account list from a new folder, as the hubs' `.oculus/local.yml` files name them.
     */
    setAccounts(accounts: CalendarAccountConfig[], dir: string): void;
    close(): void;
};

/**
 * Minutes before the next attempt while a provider is not answering. The regular cadence is tuned
 * for a provider that answers; after a failure it is the time a reader sits in front of a stale
 * calendar, and an attempt that fails costs one refused request.
 */
export const RETRY_MIN = 2;

/**
 * What one account's last good poll left behind, kept so a failed poll shows it rather than
 * nothing.
 */
type Kept = { calendars: CalendarListEntry[]; events: CalendarEvent[]; lastOk: string };

/** The window the calendar covers, from `days_back` before the moment to `days_ahead` after it. */
function windowOf(now: Date, daysBack: number, daysAhead: number): Window {
    const day = 86400000;
    return {
        start: new Date(now.getTime() - daysBack * day),
        end: new Date(now.getTime() + daysAhead * day)
    };
}

/** A start written as a date alone, which is how every provider gives an all-day event. */
const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

/**
 * The moment a start stands for, which is what the events are ordered by. The three forms the
 * providers give do not order by string against each other: a date, a wall clock with no zone (the
 * host's own, which is the zone Microsoft is asked for and a floating time of a published file is
 * read in) and a clock carrying its own offset. A date is that day's local midnight, so an all-day
 * event sits at the head of its day rather than at whatever hour a UTC reading would put it. A
 * start that cannot be read sorts last, so one bad row cannot push itself to the front of today.
 */
function instantOf(start: string): number {
    if (DATE_ONLY.test(start)) {
        const [year, month, day] = start.split('-').map(Number);
        return new Date(year, month - 1, day).getTime();
    }
    const at = Date.parse(start);
    return Number.isNaN(at) ? Number.POSITIVE_INFINITY : at;
}

/** Events by the moment they happen, two at the same moment by their start as written. */
function byStart(one: CalendarEvent, two: CalendarEvent): number {
    const first = instantOf(one.start);
    const second = instantOf(two.start);
    if (first !== second) return first < second ? -1 : 1;
    return one.start < two.start ? -1 : one.start > two.start ? 1 : 0;
}

export function watchCalendar(hub: Hub, options: CalendarOptions): CalendarWatcher {
    const fetcher = timedFetcher(options.fetcher ?? fetch, options.readTimeoutMs);
    const providerDir = options.providerDir;
    const now = options.now ?? ((): Date => new Date());
    let settings: CalendarSettings = {
        pollMin: options.pollMin,
        daysBack: options.daysBack,
        daysAhead: options.daysAhead
    };
    let words = options.words;
    /** Whether the watcher is closed, and the hub's `sign_in` rows it reads its accounts with. */
    const watched: WatcherHeld = { closed: false, rows: options.providers };
    /** The sentence a request that had no answer in time leaves on its account's row. */
    const timedOut = (error: ReadTimeout): string =>
        fillPlaceholders(words.timedOut, [String(error.ms / 1000)]);
    /** Every account's state word and hint, and the rows its last good poll left. */
    const state = new Map<string, CalendarAccount>();
    const kept = new Map<string, Kept>();

    const rowOf = (account: CalendarAccountConfig): CalendarAccount =>
        state.get(calendarKey(account)) ?? {
            provider: account.provider,
            label: account.label,
            ...hubMark(account),
            status: 'not-connected',
            calendars: []
        };

    /** One complete state out of what every account currently says. */
    const publish = (): void => {
        const held = loop.accounts();
        const accounts = held.map(rowOf);
        const events: CalendarEvent[] = [];
        for (const account of held) {
            events.push(...(kept.get(calendarKey(account))?.events ?? []));
        }
        events.sort(byStart);
        const status: CalendarPayload['status'] =
            held.length === 0
                ? 'unconfigured'
                : accounts.some((account) => account.status === 'error')
                  ? 'error'
                  : 'ok';
        hub.publish('calendar', {
            status,
            accounts,
            events,
            updated: now().toISOString(),
            pollMin: settings.pollMin,
            retryMin: RETRY_MIN,
            daysBack: settings.daysBack,
            daysAhead: settings.daysAhead
        } satisfies CalendarPayload);
        console.log(`calendar publish: ${status}`);
    };

    /** Keep one account's good read and set its row connected. */
    const keep = (account: CalendarAccountConfig, reading: Reading): void => {
        const lastOk = now().toISOString();
        kept.set(calendarKey(account), {
            calendars: reading.calendars,
            events: reading.events,
            lastOk
        });
        state.set(calendarKey(account), {
            provider: account.provider,
            label: account.label,
            ...hubMark(account),
            status: 'connected',
            lastOk,
            calendars: reading.calendars
        });
    };

    /**
     * One published link, read to the end or given the state word its failure earned: an account
     * whose file holds no link is `not-connected` and waits for one, and a file that cannot be
     * read, a fetch that fails or an answer that is no calendar is `error`, each said in a fixed
     * sentence that never carries the link.
     */
    const pollLink = async (
        account: CalendarAccountConfig,
        dir: string,
        live: () => boolean,
        base: Omit<CalendarAccount, 'status'>
    ): Promise<boolean> => {
        const key = calendarKey(account);
        try {
            const link = readPublishedLink(dir, account);
            if (link === undefined) {
                state.set(key, { ...base, status: 'not-connected', hint: words.icsNoLink });
                return true;
            }
            const reading = await readIcs(link, {
                key,
                label: account.label,
                window: windowOf(now(), settings.daysBack, settings.daysAhead),
                fetcher
            });
            if (live()) keep(account, reading);
            return true;
        } catch (error) {
            if (!live()) return false;
            state.set(key, {
                ...base,
                status: 'error',
                hint:
                    error instanceof ReadTimeout
                        ? timedOut(error)
                        : fillPlaceholders(words.icsFailed, [account.label])
            });
            return false;
        }
    };

    /**
     * One account, read to the end or given the state word its failure earned. An account whose
     * provider has no client half on this machine is `not-connected` and says the provider needs
     * setting up; one with a half and no refresh token is `not-connected` and waits for Connect.
     * Neither is a failure, and neither shortens the cadence. What a read of an account that has
     * left, or of a folder that was replaced, comes back with is dropped.
     */
    const pollAccount = async (
        account: CalendarAccountConfig,
        dir: string,
        live: () => boolean
    ): Promise<boolean> => {
        const key = calendarKey(account);
        const held = kept.get(key);
        const base = {
            provider: account.provider,
            label: account.label,
            ...hubMark(account),
            ...(hasOwnHalf(dir, account) ? { ownHalf: true } : {}),
            calendars: held?.calendars ?? [],
            ...(held === undefined ? {} : { lastOk: held.lastOk })
        };
        if (!signsIn(account)) return pollLink(account, dir, live, base);
        try {
            const signed = await roundSignIn('calendar', account, { dir, providerDir }, fetcher, {
                providers: { rows: watched.rows, words: words.signIn },
                wait: (waiting) => state.set(key, { ...base, ...waiting }),
                live
            });
            if (signed === null) return true;
            const args = {
                token: signed.token,
                base: readAddress(signed.row, 'calendar'),
                key,
                label: account.label,
                window: windowOf(now(), settings.daysBack, settings.daysAhead),
                fetcher
            };
            const reading =
                account.provider === 'google' ? await readGoogle(args) : await readMicrosoft(args);
            if (!live()) return true;
            keep(account, reading);
            return true;
        } catch (error) {
            if (!live()) return false;
            state.set(key, {
                ...base,
                status: 'error',
                hint:
                    error instanceof ReadTimeout
                        ? timedOut(error)
                        : error instanceof Error
                          ? error.message
                          : String(error)
            });
            return false;
        }
    };

    const loop: AccountLoop<CalendarAccountConfig> = accountLoop(
        { accounts: options.accounts, dir: options.dir, pollMin: settings.pollMin },
        {
            retryMin: RETRY_MIN,
            now,
            read: pollAccount,
            publish,
            held: [state, kept]
        }
    );
    loop.start();

    return {
        refresh: () => loop.run(true),
        setSettings(next): void {
            if (watched.closed) return;
            const before = settings;
            settings = { ...next };
            takeLoopSettings(
                loop,
                { before: before.pollMin, after: next.pollMin },
                next.daysBack !== before.daysBack || next.daysAhead !== before.daysAhead,
                publish
            );
        },
        setWords(next): void {
            if (!watched.closed) words = { ...next };
        },
        ...watcherControls(loop, watched, { pollMin: () => settings.pollMin, publish })
    };
}
