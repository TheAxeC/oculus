// The Calendar view rendered to HTML over one synthetic socket payload: the calendar library drawn
// in the view the instance keeps, the account rows and their Connect control, the Add form's
// providers, the connector head and the window in the footer.
//
// No provider is reached and no file is read: the payload is the fixture, exactly as the socket
// would deliver it.

import { existsSync, readFileSync } from 'node:fs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'svelte/server';
import { withoutComments } from '../../checks/source/code.ts';
import Calendar from '../../../src/lib/views/personal/calendar/Calendar.svelte';
import AddAccount from '../../../src/lib/views/shared/accounts/AddAccount.svelte';
import {
    calendarSettings,
    engineDir,
    glyphCatalog,
    loadConfig,
    textCatalog
} from '../../../src/lib/data/sources/config.ts';
import { setCatalog, setGlyphs } from '../../../src/lib/state/shared/words/text.ts';
import type { AccountProvider, CalendarPayload } from '../../../src/lib/data/model/index.ts';
import {
    badgeOf,
    type Registration
} from '../../../src/lib/state/workbench/navigation/registry.ts';
import { registration } from '../../../src/lib/views/personal/calendar/Calendar.svelte';
import { setVocab } from '../../../src/lib/state/shared/words/tones.ts';
import { vocabCatalog } from '../../../src/lib/data/sources/config.ts';
import { clientContext, createClientState, type ClientState } from '../../fixtures/client.ts';

const { config } = loadConfig(engineDir());
const catalog = textCatalog(config);
setCatalog(catalog);
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

/**
 * The view drawn from one payload, with the page's clock standing at the fixture's moment and the
 * instance holding the state the case gives it.
 */
function draw(data: CalendarPayload, held: Record<string, unknown> = {}, version = 1): string {
    return atFixtureMoment(() => {
        client.entities.receive({ channel: 'calendar', version, payload: data });
        client.ui.setInstanceState(instance.id, held);
        return render(Calendar, { context: clientContext(client), props: { instance } }).body;
    });
}

/** The Add form of one connector, drawn open on one provider. */
function addForm(kind: 'calendar' | 'mail', provider?: AccountProvider): string {
    return render(AddAccount, {
        context: clientContext(client),
        props: { kind, onclose: () => undefined, ...(provider === undefined ? {} : { provider }) }
    }).body;
}

/** A button whose words are `words`, as the ToolButton primitive draws them. */
function button(words: string): RegExp {
    const escaped = words.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`<span class="label">${escaped}</span>(?:<!--[^>]*-->|\\s)*</button>`);
}

/** The words of every option of the provider list, in order, the empty choice left out. */
function providerChoices(markup: string): string[] {
    return [...markup.matchAll(/<option value="([^"]+)"[^>]*>([^<]*)<\/option>/g)].map(
        (match) => match[2]
    );
}

/** The text of a component's one style block, between its tags. */
function styleOf(source: string): string {
    const start = source.indexOf('<style>') + '<style>'.length;
    return source.slice(start, source.indexOf('</style>', start));
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
    it('draws the calendar in week view while the instance keeps no view', () => {
        const body = draw(payload);
        expect(body).toMatch(/class="ec ec-time-grid ec-week-view"/);
        // The toolbar's words are the catalog's, one control per view, the week the one chosen.
        for (const key of [
            'calendar.view_day',
            'calendar.view_week',
            'calendar.view_month',
            'calendar.view_list'
        ]) {
            expect(body).toMatch(button(catalog[key]));
        }
        expect(body).toMatch(/aria-checked="true">(?:<!--[^>]*-->|\s)*<span class="label">Week</);
        expect(body).toMatch(button(catalog['calendar.today']));
        expect(body).toMatch(button(catalog['calendar.prev_week']));
        expect(body).toMatch(button(catalog['calendar.next_week']));
        // The library's own toolbar draws no button of its own.
        expect(body).not.toMatch(/class="ec-button/);
    });

    // The page is drawn in the browser only (src/routes/+layout.ts turns server rendering off), and
    // the library's server render prints its height option as a function, so the box's height is
    // read from the view's own style rules, beside the height calendarOptions hands the library.
    it("audits that the library's box takes the pane's height and paints its cells with no surface of their own", () => {
        const source = readFileSync('src/lib/views/personal/calendar/Calendar.svelte', 'utf8');
        const style = source.slice(source.indexOf('<style>'));
        /** The declarations of the first rule whose selector is exactly `selector`. */
        const rule = (selector: string): string => {
            const at = style.indexOf(`\n    ${selector} {`);
            expect(at).toBeGreaterThan(-1);
            return style.slice(at, style.indexOf('}', at));
        };
        expect(rule('.calendar')).toMatch(/\n\s*height: 100%;/);
        expect(rule('.calendar')).toMatch(/\n\s*flex-direction: column;/);
        expect(rule('.grid')).toMatch(/\n\s*flex: 1;/);
        expect(rule('.grid')).toMatch(/\n\s*min-height: 0;/);
        const library = rule('.grid :global(.ec)');
        expect(library).toMatch(/--ec-bg-color: transparent;/);
        expect(library).toMatch(/--ec-today-bg-color: var\(--chip\);/);
        // A height fixed on the library's box would stop it following the pane.
        expect(library).not.toMatch(/\n\s*height:/);
    });

    // The strips that stay in place while the grid scrolls under them cover the rows over a
    // wallpaper with the panel's colour at the popover's fraction, and a date heading keeps today's
    // chip over it.
    it('audits that over a wallpaper both fixed strips paint the popover mix with the blur, and the date heading its chip after it', () => {
        const source = readFileSync('src/lib/views/personal/calendar/Calendar.svelte', 'utf8');
        const style = withoutComments('style.css', styleOf(source));
        const rules = [...style.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((match) => ({
            at: match.index,
            selectors: match[1]
                .split(',')
                .map((one) => one.trim().replace(/\s+/g, ' '))
                .sort(),
            body: match[2]
        }));
        const header = ':global(body.wall) .grid :global(.ec-header)';
        const heading = ':global(body.wall) .grid :global(.ec-list .ec-day-head)';
        const same = (selectors: string[], wanted: string[]): boolean =>
            JSON.stringify(selectors) === JSON.stringify([...wanted].sort());
        const both = rules.filter((rule) => same(rule.selectors, [header, heading]));
        expect(both).toHaveLength(1);
        expect(both[0].body).toMatch(
            /\n\s*background: color-mix\(in srgb, var\(--panel\) var\(--wall-popover\), transparent\);/
        );
        expect(both[0].body).toMatch(/\n\s*backdrop-filter: blur\(var\(--wall-blur\)\);/);
        const chip = rules.filter((rule) => same(rule.selectors, [heading]));
        expect(chip).toHaveLength(1);
        expect(chip[0].at).toBeGreaterThan(both[0].at);
        expect(chip[0].body).toMatch(
            /\n\s*background-image: linear-gradient\(var\(--ec-day-bg-color\), var\(--ec-day-bg-color\)\);/
        );
    });

    it("audits that a list view's event title takes the calendar's size rather than the root's", () => {
        const source = readFileSync('src/lib/views/personal/calendar/Calendar.svelte', 'utf8');
        const style = withoutComments('style.css', styleOf(source));
        expect(style).toMatch(
            /\.grid :global\(\.ec-list \.ec-event-title\) \{\s*font-size: var\(--fs-sm\);\s*\}/
        );
    });

    it('draws the calendar in month view for an instance that keeps the month', () => {
        const body = draw(payload, { view: 'dayGridMonth' });
        expect(body).toMatch(/class="ec ec-day-grid ec-month-view"/);
        // The library draws one view at a time, so the month replaces the week.
        expect(body).not.toContain('ec-week-view');
    });

    it('draws the calendar in week view for an instance that keeps the retired agenda', () => {
        expect(draw(payload, { view: 'agenda' })).toMatch(/class="ec ec-time-grid ec-week-view"/);
    });

    it('audits that the agenda partial is gone', () => {
        expect(existsSync('src/lib/views/personal/calendar/Agenda.svelte')).toBe(false);
    });

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

    it('offers Add account in the empty state and as an icon in the header', () => {
        const body = draw({ ...payload, status: 'unconfigured', accounts: [], events: [] });
        expect(body).toContain(catalog['accounts.empty_calendar']);
        const header = body.slice(body.indexOf('<header'), body.indexOf('</header>'));
        // the header holds the icon, named by its words, and the empty state the text button
        expect(header).toContain('aria-label="Add account"');
        expect(header).toContain('data-glyph="add"');
        expect(body).toMatch(
            /<button[^>]*class="tool[^"]*\bsmall\b[^"]*"[^>]*>(?:(?!<\/button>)[\s\S])*Add account/
        );
        expect(body).toContain('aria-label="Account actions"');
    });

    it('draws the connector head, its cadence and the window in the footer', () => {
        const body = draw(payload);
        expect(body).toContain('live');
        expect(body).toContain('as of 08:15');
        expect(body).toContain('every 15m');
        expect(body).toContain('Refresh now');
        expect(body).toContain('Read-only over 1 day back and 14 days ahead.');
    });

    it('says the calendar window the shipped behaviour file sets, 31 days back and 62 ahead', () => {
        const shipped = calendarSettings(config);
        expect([shipped.daysBack, shipped.daysAhead]).toEqual([31, 62]);
        const body = draw({
            ...payload,
            daysBack: shipped.daysBack,
            daysAhead: shipped.daysAhead
        });
        expect(body).toContain('Read-only over 31 days back and 62 days ahead.');
    });

    it('says one day for a number that is 1, back or ahead, and days for any other', () => {
        expect(draw({ ...payload, daysBack: 3, daysAhead: 1 })).toContain(
            'Read-only over 3 days back and 1 day ahead.'
        );
        expect(draw({ ...payload, daysBack: 2, daysAhead: 14 })).toContain(
            'Read-only over 2 days back and 14 days ahead.'
        );
    });

    // Which calendars of an account are read is a choice the reader makes at Google rather than
    // here, so the footer is where they are told where it is made.
    it("says in the footer which of a Google account's calendars are read", () => {
        expect(draw(payload)).toContain(
            "A Google account reads the calendars ticked in Google's own calendar list, and no others."
        );
    });

    it('says the machine names no account, and draws no calendar, when it is unconfigured', () => {
        const body = draw({ ...payload, status: 'unconfigured', accounts: [], events: [] });
        expect(body).toContain('No calendar account yet.');
        expect(body).toContain('not configured');
        // no account is configured, so there is no calendar to draw
        expect(body).not.toContain('class="ec ');
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
        // The calendar is still drawn under the state word, over the last good events.
        expect(body).toContain('class="ec ');
    });

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

describe('the published calendar link', () => {
    it('is offered as a third provider by the Add form of the calendar, with a link field', () => {
        const google = addForm('calendar');
        expect(providerChoices(google)).toEqual([
            catalog['accounts.provider_google'],
            catalog['accounts.provider_microsoft'],
            catalog['accounts.provider_ics']
        ]);
        // The link field is drawn only while the published link is the provider chosen.
        expect(google).not.toContain(catalog['accounts.add_link']);
        const ics = addForm('calendar', 'ics');
        expect(ics).toContain(catalog['accounts.add_link']);
        expect(ics).toContain(catalog['accounts.add_link_hint']);
        expect(ics).toMatch(/<option value="ics" selected[^>]*>/);
    });

    it('is not offered by the Add form of the mail', () => {
        expect(providerChoices(addForm('mail'))).toEqual([
            catalog['accounts.provider_google'],
            catalog['accounts.provider_microsoft']
        ]);
    });

    it('names an ics account "Published link" and draws no Connect control on its row', () => {
        const body = draw({
            ...payload,
            accounts: [
                { provider: 'ics', label: 'rooster', status: 'not-connected', calendars: [] }
            ]
        });
        expect(body).toContain('data-calendar-account="ics-rooster"');
        expect(body).toContain(`>${catalog['calendar.provider_ics']}</span>`);
        expect(catalog['calendar.provider_ics']).toBe('Published link');
        expect(body).not.toMatch(/>Connect</);
    });
});
