// Layer 1, data. The calendar connector's types: what a machine configures, what the poller
// publishes on the `calendar` channel, and the key an account is addressed by.
//
// It is a concern module of its own in the accounts folder, beside model-mail.ts and
// model-connect.ts, reached through the index.ts facade alone, because a calendar changes for
// calendar reasons: a provider field, a window, an event state.
//
// A time is an ISO string exactly as the provider gave it. Google answers a timed event with its
// own offset (a date, a `T`, a clock and `+02:00`) and an all-day event as the date alone;
// Microsoft is asked for this machine's own zone and answers a wall-clock time with no offset,
// which the page reads in the same zone because the page and the server are the same machine.
// `allDay` says which of the two forms a reader is looking at, so nothing has to parse the string
// to find out.
//
// The account types are the connector's shared ones: an account of either connector is a provider
// and a label, and the calendar's names for them are what its own readers already say. The calendar
// alone takes a third provider, `ics`, a published link read with no consent. Its events' times
// are the file's own, a date alone for an all-day event and a clock with its own offset otherwise.

import type { ConnectAccountStatus, ConnectProvider, ConnectStatus } from './model-connect.ts';

/** The three providers a calendar account is read from, in the order they are offered. */
export type CalendarProvider = ConnectProvider | 'ics';

/** One account of `calendars:` in a hub's `.oculus/local.yml`. */
export type CalendarAccountConfig = { provider: CalendarProvider; label: string; hub?: string };

/** The connector as a whole: `unconfigured` when the machine names no account. */
export type CalendarStatus = ConnectStatus;

/**
 * One account: `not-connected` until its credential file holds a refresh token, or, for a published
 * link, until its file holds the link.
 */
export type CalendarAccountStatus = ConnectAccountStatus;

/** One calendar of an account, as the provider names it. */
export type CalendarListEntry = { id: string; name: string };

export type CalendarAccount = {
    provider: CalendarProvider;
    label: string;
    /** The hub whose `.oculus/local.yml` holds the account. */
    hub?: string;
    status: CalendarAccountStatus;
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
    calendars: CalendarListEntry[];
};

export type CalendarEventStatus = 'confirmed' | 'tentative' | 'cancelled';

export type CalendarEvent = {
    /** Unique across accounts: the account key, the calendar and the provider's own event id. */
    id: string;
    /** The account's label, which names the account the event was read from. */
    account: string;
    /** The calendar's name, as the provider gave it. */
    calendar: string;
    title: string;
    start: string;
    end: string;
    allDay: boolean;
    location?: string;
    /**
     * The provider's own page for this event, opened through the server rather than by the page.
     */
    link?: string;
    status?: CalendarEventStatus;
};

export type CalendarPayload = {
    status: CalendarStatus;
    accounts: CalendarAccount[];
    /** Every account's events over the window, sorted by start. */
    events: CalendarEvent[];
    updated: string;
    pollMin: number;
    /** Minutes between attempts while a provider is not answering. */
    retryMin: number;
    daysBack: number;
    daysAhead: number;
};
