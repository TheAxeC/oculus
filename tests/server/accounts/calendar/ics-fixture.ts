// Layer 4, test helper. One published calendar as Outlook writes it, for the poller's cases and the
// reader's: a Windows zone name defined by its own VTIMEZONE block, one timed event in that zone
// with its own page, one all-day event, one weekly series with one week taken out, and one event
// far outside any window the cases read.
//
// The window the cases read runs from 7 days before WINDOW_NOW to 21 days after it, which holds
// the second to the fifth occurrence of the weekly series, the third of them taken out by its
// EXDATE.

/** The moment the cases' window is measured from. */
export const WINDOW_NOW = new Date('2031-06-10T12:00:00.000Z');

/** The days back and ahead the cases read. */
export const DAYS_BACK = 7;
export const DAYS_AHEAD = 21;

/** The event's own page, which the payload carries as the event's link. */
export const EVENT_PAGE = 'https://outlook.example/owa/event/standup';

/** The file's lines, joined with the CRLF the format prescribes. */
export const ICS_TEXT = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Fixture//Outlook//EN',
    'X-WR-CALNAME:Rooster',
    'BEGIN:VTIMEZONE',
    'TZID:W. Europe Standard Time',
    'BEGIN:STANDARD',
    'DTSTART:16010101T030000',
    'TZOFFSETFROM:+0200',
    'TZOFFSETTO:+0100',
    'RRULE:FREQ=YEARLY;INTERVAL=1;BYDAY=-1SU;BYMONTH=10',
    'END:STANDARD',
    'BEGIN:DAYLIGHT',
    'DTSTART:16010101T020000',
    'TZOFFSETFROM:+0100',
    'TZOFFSETTO:+0200',
    'RRULE:FREQ=YEARLY;INTERVAL=1;BYDAY=-1SU;BYMONTH=3',
    'END:DAYLIGHT',
    'END:VTIMEZONE',
    'BEGIN:VEVENT',
    'UID:standup',
    'SUMMARY:Standup',
    'DTSTART;TZID=W. Europe Standard Time:20310611T090000',
    'DTEND;TZID=W. Europe Standard Time:20310611T093000',
    'LOCATION:Room 1',
    `URL:${EVENT_PAGE}`,
    'END:VEVENT',
    'BEGIN:VEVENT',
    'UID:conference',
    'SUMMARY:Conference',
    'DTSTART;VALUE=DATE:20310612',
    'DTEND;VALUE=DATE:20310614',
    'END:VEVENT',
    'BEGIN:VEVENT',
    'UID:seminar',
    'SUMMARY:Seminar',
    'DTSTART;TZID=W. Europe Standard Time:20310602T140000',
    'DTEND;TZID=W. Europe Standard Time:20310602T150000',
    'RRULE:FREQ=WEEKLY;COUNT=10',
    'EXDATE;TZID=W. Europe Standard Time:20310616T140000',
    'END:VEVENT',
    'BEGIN:VEVENT',
    'UID:summer',
    'SUMMARY:Summer school',
    'DTSTART;VALUE=DATE:20310801',
    'DTEND;VALUE=DATE:20310802',
    'END:VEVENT',
    'END:VCALENDAR',
    ''
].join('\r\n');
