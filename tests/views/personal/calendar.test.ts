// The Calendar view rendered to HTML over one synthetic socket payload: the day groups, the today
// heading, the account rows and their Connect control, the tags an event carries, and the cancelled
// event's rule.
//
// No provider is reached and no file is read: the payload is the fixture, exactly as the socket
// would deliver it.

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'svelte/server';
import Calendar from '../../../src/lib/views/personal/calendar/Calendar.svelte';
import {
    engineDir,
    glyphCatalog,
    loadConfig,
    textCatalog
} from '../../../src/lib/data/sources/config.ts';
import { setCatalog, setGlyphs } from '../../../src/lib/state/shared/words/text.ts';
import type { CalendarPayload } from '../../../src/lib/data/model/index.ts';
import {
    badgeOf,
    type Registration
} from '../../../src/lib/state/workbench/navigation/registry.ts';
import { registration } from '../../../src/lib/views/personal/calendar/Calendar.svelte';
import { setVocab } from '../../../src/lib/state/shared/words/tones.ts';
import { vocabCatalog } from '../../../src/lib/data/sources/config.ts';
import { clientContext, createClientState, type ClientState } from '../../fixtures/client.ts';

const { config } = loadConfig(engineDir());
setCatalog(textCatalog(config));
setGlyphs(glyphCatalog(config));
setVocab(vocabCatalog(config));

/** The moment every case is drawn at, so "today" is the fixture's own day. */
const NOW = '2031-03-02T08:30:00';
const TODAY = '2031-03-02';
const TOMORROW = '2031-03-03';

const instance = { id: 'calendar-one', view: 'calendar', title: 'Calendar', state: {} };

const payload: CalendarPayload = {
    status: 'ok',
    accounts: [
        {
            provider: 'google',
            label: 'work',
            status: 'connected',
            lastOk: `${TODAY}T08:00:00`,
            calendars: [{ id: 'primary', name: 'Work' }]
        },
        {
            provider: 'microsoft',
            label: 'uni',
            status: 'not-connected',
            calendars: []
        }
    ],
    events: [
        {
            id: 'google-work-primary-one',
            account: 'work',
            calendar: 'Work',
            title: 'Standup',
            start: `${TODAY}T09:00:00`,
            end: `${TODAY}T09:15:00`,
            allDay: false,
            location: 'Room 1',
            link: 'https://www.google.com/calendar/event?eid=one',
            status: 'confirmed'
        },
        {
            id: 'google-work-primary-two',
            account: 'work',
            calendar: 'Work',
            title: 'Maybe a seminar',
            start: `${TODAY}T14:00:00`,
            end: `${TODAY}T15:00:00`,
            allDay: false,
            status: 'tentative'
        },
        {
            id: 'google-work-primary-three',
            account: 'work',
            calendar: 'Work',
            title: 'Called off',
            start: `${TOMORROW}T10:00:00`,
            end: `${TOMORROW}T11:00:00`,
            allDay: false,
            status: 'cancelled'
        },
        {
            id: 'google-work-primary-four',
            account: 'work',
            calendar: 'Work',
            title: 'Conference',
            start: TOMORROW,
            end: '2031-03-05',
            allDay: true,
            status: 'confirmed'
        }
    ],
    updated: `${TODAY}T08:15:00`,
    pollMin: 15,
    retryMin: 2,
    daysBack: 1,
    daysAhead: 14
};

let client: ClientState;

beforeEach(() => {
    client = createClientState();
});

/** The view drawn from one payload, with the page's clock standing at the fixture's moment. */
function draw(data: CalendarPayload, version = 1): string {
    return atFixtureMoment(() => {
        client.entities.receive({ channel: 'calendar', version, payload: data });
        return render(Calendar, { context: clientContext(client), props: { instance } }).body;
    });
}

/** One reading with a fresh client whose minute clock stands at the fixture's moment. */
function atFixtureMoment<T>(run: () => T): T {
    vi.useFakeTimers();
    try {
        vi.setSystemTime(Date.parse(NOW));
        client = createClientState();
        return run();
    } finally {
        vi.useRealTimers();
    }
}

describe("the Calendar view's badge", () => {
    /** The badge hooks of the real registration over a client holding one payload. */
    function badge(data: CalendarPayload) {
        return atFixtureMoment(() => {
            client.entities.receive({ channel: 'calendar', version: 1, payload: data });
            return badgeOf({ ...registration, component: Calendar } as Registration, client);
        });
    }

    it('counts the events of today that have not ended, and names the count in its hover words', () => {
        const drawn = badge(payload);
        // Two of today's events are still to come at the fixture's moment.
        expect(drawn.text).toBe('2');
        expect(drawn.cells).toHaveLength(1);
        expect(drawn.cells?.[0].count).toBe(2);
        expect(drawn.cells?.[0].label).toBe('left today');
        expect(typeof drawn.cells?.[0].color).toBe('string');
        expect(drawn.title).toBe('left today: 2');
        // The pane tab draws the cells rather than repeating the count beside them.
        expect(drawn.tabText).toBe('');
    });

    it('draws nothing once nothing of today is left', () => {
        const drawn = badge({ ...payload, events: [] });
        expect(drawn.text).toBe('');
        expect(drawn.cells?.[0].count).toBe(0);
        expect(drawn.cells?.[0].label).toBe('left today');
        expect(drawn.title).toBe('left today: 0');
    });
});

describe('the Calendar view', () => {
    it('groups the events by day and marks today', () => {
        const body = draw(payload);
        expect(body).toContain(`data-day="${TODAY}"`);
        expect(body).toContain(`data-day="${TOMORROW}"`);
        // The two days come in the order the payload sorted them, today first.
        expect(body.indexOf(`data-day="${TODAY}"`)).toBeLessThan(
            body.indexOf(`data-day="${TOMORROW}"`)
        );
        expect(body).toContain('today');
        // Each event is one line under its own day.
        for (const event of payload.events) expect(body).toContain(`data-event="${event.id}"`);
    });

    it('draws the clock of a timed event and the all-day word of an all-day one', () => {
        const body = draw(payload);
        expect(body).toContain('09:00');
        expect(body).toContain('all day');
    });

    it('tags each line with its account label and its calendar', () => {
        const body = draw(payload);
        expect(body).toContain('Standup');
        expect(body).toContain('work');
        expect(body).toContain('Work');
        expect(body).toContain('Room 1');
    });

    it('strikes a cancelled event through and marks a tentative one', () => {
        const body = draw(payload);
        expect(body).toContain('cancelled');
        expect(body).toContain('tentative');
        expect(body).toMatch(/class="[^"]*cancelled[^"]*"[^>]*>\s*Called off/);
    });

    // revert: src/lib/views/shared/accounts/AccountList.svelte:112 => {:else if true}
    // revert: src/lib/views/shared/accounts/AccountList.svelte:94 => delete
    it('shows Connect on the account with no token and not on the connected one', () => {
        const body = draw(payload);
        expect(body).toContain('data-calendar-account="google-work"');
        expect(body).toContain('data-calendar-account="microsoft-uni"');
        expect(body).toContain('not connected');
        expect(body).toContain('connected');
        // One Connect control, for the one account that has no token.
        expect([...body.matchAll(/>Connect</g)]).toHaveLength(1);
        // Every row carries its menu, which holds Remove.
        expect([...body.matchAll(/aria-label="Row actions"/g)]).toHaveLength(2);
    });

    // revert: src/lib/views/shared/accounts/AccountList.svelte:106 => {#if false}
    it('offers the setup page in place of Connect for an account whose provider is not set up', () => {
        const body = draw({
            ...payload,
            accounts: [{ ...payload.accounts[1], needsSetup: true }]
        });
        expect(body).toContain('Microsoft is not set up on this machine yet.');
        expect(body).toContain('Set up Microsoft');
        // The account cannot be connected before its provider is set up, so no Connect is offered.
        expect(body).not.toMatch(/>Connect</);
    });

    // revert: src/lib/views/personal/calendar/Calendar.svelte:86 => {:else if false}
    it('offers Add account in the empty state and in the head', () => {
        const body = draw({ ...payload, status: 'unconfigured', accounts: [], events: [] });
        expect(body).toContain('No calendar account yet. Add one to read its agenda here.');
        expect([...body.matchAll(/>Add account</g)]).toHaveLength(2);
        expect(body).toContain('aria-label="Account actions"');
    });

    it('draws the connector head, its cadence and the window in the footer', () => {
        const body = draw(payload);
        expect(body).toContain('live');
        expect(body).toContain('as of 08:15');
        expect(body).toContain('every 15m');
        expect(body).toContain('Refresh now');
        expect(body).toContain('Read-only over 1 days back and 14 days ahead.');
    });

    // Which calendars of an account are read is a choice the reader makes at Google rather than
    // here, so the footer is where they are told where it is made.
    it("says in the footer which of a Google account's calendars are read", () => {
        expect(draw(payload)).toContain(
            "A Google account reads the calendars ticked in Google's own calendar list, and no others."
        );
    });

    it('says the agenda is empty when the window holds nothing', () => {
        const body = draw({ ...payload, events: [] });
        expect(body).toContain('No events in this window.');
    });

    // revert: src/lib/views/personal/calendar/Calendar.svelte:86 => {:else if false}
    // revert: src/lib/views/personal/calendar/Calendar.svelte:58 => unconfigured: t('calendar.polling'),
    it('says the machine names no account, and draws no agenda, when it is unconfigured', () => {
        const body = draw({ ...payload, status: 'unconfigured', accounts: [], events: [] });
        expect(body).toContain('No calendar account yet.');
        expect(body).toContain('not configured');
        // no account is configured, so the sentence drawn is that one rather than the empty
        // agenda's
        expect(body).not.toContain('No events in this window.');
    });

    it('carries the retry cadence and the failure tone while a provider is refusing', () => {
        const body = draw({
            ...payload,
            status: 'error',
            accounts: [
                {
                    provider: 'google',
                    label: 'work',
                    status: 'error',
                    hint: 'google: 403 PERMISSION_DENIED',
                    lastOk: `${TODAY}T08:00:00`,
                    calendars: [{ id: 'primary', name: 'Work' }]
                }
            ]
        });
        expect(body).toContain('retrying every 2m');
        expect(body).toContain('google: 403 PERMISSION_DENIED');
        // The last good events are still drawn under the state word.
        expect(body).toContain('Standup');
    });

    // revert: src/lib/views/shared/accounts/AccountList.svelte:117 => disabled={false}
    it('shows the Connect control as connecting and unpressable while a press is open', () => {
        // The press never answers, so the store holds it open for the render below.
        vi.stubGlobal('fetch', () => new Promise<Response>(() => undefined));
        try {
            const body = atFixtureMoment(() => {
                client.entities.receive({ channel: 'calendar', version: 1, payload });
                void client.accounts.connect('calendar', payload.accounts[1]);
                return render(Calendar, { context: clientContext(client), props: { instance } })
                    .body;
            });
            expect(body).toContain('connecting...');
            expect(body).not.toMatch(/>Connect</);
            expect(body).toMatch(/<button[^>]*disabled/);
        } finally {
            vi.unstubAllGlobals();
        }
    });

    it('draws no token, secret or address of its own in the markup', () => {
        const body = draw(payload);
        // the request carries the token, so the markup drawn from the answer holds none of it
        expect(body).not.toContain('x-oculus-token');
        // nor an address of the calendar it came from
        expect(body).not.toContain('https://www.google.com/calendar/event');
    });
});
