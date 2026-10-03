// The published calendar reader on its own: the address a link is fetched at, the calendar's name,
// the event's own page, and a text that is no calendar. The fetch, the file and the poll around it
// are tests/server/accounts/calendar/poll.test.ts's, and a link that never answers is
// tests/server/accounts/calendar/poll-timeout.test.ts's.

import { describe, expect, it } from 'vitest';
import { icsAddress, readIcsText } from '../../../../src/lib/server/accounts/calendar/ics.ts';
import { DAYS_AHEAD, DAYS_BACK, ICS_TEXT, WINDOW_NOW } from './ics-fixture.ts';

const DAY = 86400000;

/** What the reader is given: the account's key and label, and the fixture's window. */
const ARGS = {
    key: 'ics-rooster',
    label: 'rooster',
    window: {
        start: new Date(WINDOW_NOW.getTime() - DAYS_BACK * DAY),
        end: new Date(WINDOW_NOW.getTime() + DAYS_AHEAD * DAY)
    }
};

describe('the address a published link is fetched at', () => {
    it('reads webcal as https and keeps an https link as it is', () => {
        expect(icsAddress('webcal://outlook.example/cal.ics')).toBe(
            'https://outlook.example/cal.ics'
        );
        expect(icsAddress('https://outlook.example/cal.ics')).toBe(
            'https://outlook.example/cal.ics'
        );
    });
});

describe('the published calendar reader', () => {
    it("names the calendar by the file's own name, and by the label when the file has none", () => {
        expect(readIcsText(ICS_TEXT, ARGS).calendars).toEqual([{ id: 'ics', name: 'Rooster' }]);
        const nameless = ICS_TEXT.replace('X-WR-CALNAME:Rooster\r\n', '');
        const reading = readIcsText(nameless, ARGS);
        expect(reading.calendars).toEqual([{ id: 'ics', name: 'rooster' }]);
        expect(new Set(reading.events.map((one) => one.calendar))).toEqual(new Set(['rooster']));
    });

    it('carries an https page of an event as its link, and no page of another scheme', () => {
        const other = ICS_TEXT.replace(/URL:https:\/\/[^\r]*/, 'URL:javascript:alert(1)');
        const standup = readIcsText(other, ARGS).events.find((one) => one.title === 'Standup');
        expect(standup).toBeDefined();
        expect(standup?.link).toBeUndefined();
    });

    it('orders nothing itself and gives every occurrence an id of its own under the key', () => {
        const ids = readIcsText(ICS_TEXT, ARGS).events.map((one) => one.id);
        expect(ids.length).toBe(5);
        expect(new Set(ids).size).toBe(5);
        for (const id of ids) expect(id.startsWith('ics-rooster-')).toBe(true);
    });

    it('throws on a text that is no calendar', () => {
        expect(() => readIcsText('<html>not a calendar</html>', ARGS)).toThrow();
    });
});
