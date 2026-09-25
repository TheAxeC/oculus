// Layer 2, server. The calendar watcher publishes one complete state on the `calendar` channel, in
// the shape of the Live HPC watcher: every account read at the configured cadence, the short
// cadence while a provider is not answering, the last good events kept under the state word, one
// poll at a time, and a refresh a control can press.
//
// The cadence is each account's own. An account that failed is due again after RETRY_MIN and one
// that answered after poll_min, the one timer fires at the earliest of those times, and a round
// reads only the accounts that are due; so one provider refusing does not make the other one be
// called every two minutes. The Refresh control reads every account whatever its due time, since
// what a press asks for is the state now.
//
// A machine that names no account publishes `unconfigured` once and polls nothing, so an install
// with no calendar costs no timer and no request.
//
// The access token an account is polled with lives in a local variable for the length of that
// account's read and is never held, logged or published. The refresh token is read from the
// account's file at each poll and goes no further than the token call.

import { calendarKey } from '../../../data/accounts/calendar.ts';
import type {
    CalendarAccount,
    CalendarAccountConfig,
    CalendarEvent,
    CalendarListEntry,
    CalendarPayload
} from '../../../data/model/index.ts';
import type { Hub } from '../../core/channels.ts';
import type { Window } from './api.ts';
import { readGoogle } from './google.ts';
import { readMicrosoft } from './microsoft.ts';
import { accessToken, type Fetcher } from '../connect/oauth.ts';
import { credentialFile, readCredentials } from '../connect/store.ts';

export type CalendarOptions = {
    accounts: CalendarAccountConfig[];
    /** The folder the credential files live in, already resolved. */
    dir: string;
    pollMin: number;
    daysBack: number;
    daysAhead: number;
    /**
     * How the providers are called; injected so a test reaches every branch without the network.
     */
    fetcher?: Fetcher;
    /** The moment the window is measured from, so a test can pin it. */
    now?: () => Date;
};

export type CalendarWatcher = { refresh(): Promise<void>; close(): void };

/**
 * Minutes before the next attempt while a provider is not answering. The regular cadence is tuned
 * for a provider that answers; after a failure it is the time a reader sits in front of a stale
 * agenda, and an attempt that fails costs one refused request.
 */
export const RETRY_MIN = 2;

/**
 * What one account's last good poll left behind, kept so a failed poll shows it rather than
 * nothing.
 */
type Kept = { calendars: CalendarListEntry[]; events: CalendarEvent[]; lastOk: string };

/** The window the agenda covers, from `days_back` before the moment to `days_ahead` after it. */
function windowOf(now: Date, daysBack: number, daysAhead: number): Window {
    const day = 86400000;
    return {
        start: new Date(now.getTime() - daysBack * day),
        end: new Date(now.getTime() + daysAhead * day)
    };
}

/** A start written as a date alone, which is how both providers give an all-day event. */
const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

/**
 * The moment a start stands for, which is what the agenda is ordered by. The three forms the two
 * providers give do not order by string against each other: a date, a wall clock with no zone (the
 * host's own, which is the zone Microsoft is asked for) and a clock carrying its own offset. A date
 * is that day's local midnight, so an all-day event sits at the head of its day rather than at
 * whatever hour a UTC reading would put it. A start that cannot be read sorts last, so one bad row
 * cannot push itself to the front of today.
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
    const fetcher = options.fetcher ?? fetch;
    const now = options.now ?? ((): Date => new Date());
    /** Every account's state word and hint, and the rows its last good poll left. */
    const state = new Map<string, CalendarAccount>();
    const kept = new Map<string, Kept>();
    let closed = false;
    const stopped = (): boolean => closed;

    const rowOf = (account: CalendarAccountConfig): CalendarAccount =>
        state.get(calendarKey(account)) ?? {
            provider: account.provider,
            label: account.label,
            status: 'not-connected',
            calendars: []
        };

    /** One complete state out of what every account currently says. */
    const publish = (): void => {
        const accounts = options.accounts.map(rowOf);
        const events: CalendarEvent[] = [];
        for (const account of options.accounts) {
            events.push(...(kept.get(calendarKey(account))?.events ?? []));
        }
        events.sort(byStart);
        const status: CalendarPayload['status'] =
            options.accounts.length === 0
                ? 'unconfigured'
                : accounts.some((account) => account.status === 'error')
                  ? 'error'
                  : 'ok';
        hub.publish('calendar', {
            status,
            accounts,
            events,
            updated: now().toISOString(),
            pollMin: options.pollMin,
            retryMin: RETRY_MIN,
            daysBack: options.daysBack,
            daysAhead: options.daysAhead
        } satisfies CalendarPayload);
        console.log(`calendar publish: ${status}`);
    };

    /**
     * One account, read to the end or given the state word its failure earned. A file that is not
     * there yet, or that holds no refresh token, is `not-connected` with the path the reader
     * creates; that is not a failure and does not shorten the cadence.
     */
    const pollAccount = async (account: CalendarAccountConfig): Promise<boolean> => {
        const key = calendarKey(account);
        const held = kept.get(key);
        const base = {
            provider: account.provider,
            label: account.label,
            calendars: held?.calendars ?? [],
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
            const token = await accessToken(
                'calendar',
                credentials,
                credentials.refreshToken,
                fetcher
            );
            if (stopped()) return true;
            const args = {
                token,
                key,
                label: account.label,
                window: windowOf(now(), options.daysBack, options.daysAhead),
                fetcher
            };
            const reading =
                account.provider === 'google' ? await readGoogle(args) : await readMicrosoft(args);
            if (stopped()) return true;
            const lastOk = now().toISOString();
            kept.set(key, { calendars: reading.calendars, events: reading.events, lastOk });
            state.set(key, {
                provider: account.provider,
                label: account.label,
                status: 'connected',
                lastOk,
                calendars: reading.calendars
            });
            return true;
        } catch (error) {
            state.set(key, {
                ...base,
                status: 'error',
                hint: error instanceof Error ? error.message : String(error)
            });
            return false;
        }
    };

    /** When each account is next due, as an epoch time; an account with no entry is due now. */
    const due = new Map<string, number>();
    const dueAt = (account: CalendarAccountConfig): number => due.get(calendarKey(account)) ?? 0;

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
                due.set(calendarKey(account), now().getTime() + minutes * 60000);
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

    if (options.accounts.length === 0) publish();
    else void run(true);

    return {
        refresh: () => run(true),
        close(): void {
            closed = true;
            if (timer !== null) clearTimeout(timer);
            timer = null;
        }
    };
}
