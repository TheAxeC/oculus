// Layer 2, client-state tests. What the readers of a tab's instance state in state/feeds and
// state/life answer for every kind of input a saved arrangement can hold: a list, null, a map with
// an own `__proto__` key, a state whose fields are each of the wrong type, and the edge values of
// the right type. The table is described in tests/state/shared/instance-fixture.ts. The search and
// reveal fields are the one `searchRevealShape` of the inbox, leads, LinkedIn, radar, collection,
// data and venues readers, so their wrong values and edge values are tried on the LinkedIn reader
// only.

import { parseInboxState } from '../../../src/lib/state/feeds/inbox.ts';
import { parseLeadsState } from '../../../src/lib/state/feeds/leads.ts';
import { parseLinkedinState } from '../../../src/lib/state/feeds/linkedin.ts';
import { parseRadarState } from '../../../src/lib/state/feeds/radar.ts';
import { parseCalendarState } from '../../../src/lib/state/life/calendar.ts';
import { parseSlidesState } from '../../../src/lib/state/life/slides.ts';
import { ABSENT, checkReaders, type Reader } from './instance-fixture.ts';

const inboxFallback = { search: '', triagedOpen: false, drafts: [] };
const inboxValid = { search: 'q', triagedOpen: true, drafts: ['t1', 't2'], reveal: 'r' };
const leadsFallback = {
    search: '',
    expiredOpen: false,
    runlogOpen: false,
    logAll: false,
    adding: false,
    showDeclined: false
};
const leadsValid = {
    search: 'q',
    expiredOpen: true,
    runlogOpen: true,
    logAll: true,
    adding: true,
    showDeclined: true,
    reveal: 'r'
};
const linkedinValid = { search: 'q', adding: true, reveal: 'r' };
const radarFallback = { search: '', dismissedOpen: false };
const radarValid = { search: 'q', dismissedOpen: true, reveal: 'r' };
const slidesFallback = { at: '', order: [], picked: [], said: '' };
const slidesValid = { at: 'sig', order: ['a', 'b'], picked: ['a'], said: 'ok' };

const READERS: Reader[] = [
    {
        name: 'parseInboxState',
        read: parseInboxState,
        valid: { search: 'q', triagedOpen: true, drafts: ['t1', 't2'], reveal: 'r' },
        wrong: { triagedOpen: 'yes', drafts: 'x' },
        edge: {},
        notMap: inboxFallback,
        answers: {
            'empty map': inboxFallback,
            'own __proto__ key': { search: 's', triagedOpen: false, drafts: [] },
            'own __proto__ key alone': inboxFallback,
            valid: inboxValid,
            'wrong triagedOpen': {
                search: 'q',
                triagedOpen: false,
                drafts: ['t1', 't2'],
                reveal: 'r'
            },
            'wrong drafts': { search: 'q', triagedOpen: true, drafts: [], reveal: 'r' },
            'all wrong': inboxFallback
        }
    },
    {
        name: 'parseLeadsState',
        read: parseLeadsState,
        valid: {
            search: 'q',
            expiredOpen: true,
            runlogOpen: true,
            logAll: true,
            adding: true,
            showDeclined: true,
            reveal: 'r'
        },
        wrong: {
            expiredOpen: 'yes',
            runlogOpen: 1,
            logAll: 'true',
            adding: {},
            showDeclined: 'yes'
        },
        edge: {
            'showDismissed in place of showDeclined': {
                showDeclined: ABSENT,
                showDismissed: true
            },
            'showDeclined false beside showDismissed true': {
                showDeclined: false,
                showDismissed: true
            },
            'showDismissed beside showDeclined true': { showDismissed: false }
        },
        notMap: leadsFallback,
        answers: {
            'empty map': leadsFallback,
            'own __proto__ key': { ...leadsFallback, search: 's', adding: true },
            'own __proto__ key alone': leadsFallback,
            valid: leadsValid,
            'wrong expiredOpen': { ...leadsValid, expiredOpen: false },
            'wrong runlogOpen': { ...leadsValid, runlogOpen: false },
            'wrong logAll': { ...leadsValid, logAll: false },
            'wrong adding': { ...leadsValid, adding: false },
            'wrong showDeclined': { ...leadsValid, showDeclined: false },
            'all wrong': leadsFallback,
            'showDismissed in place of showDeclined': leadsValid,
            'showDeclined false beside showDismissed true': { ...leadsValid, showDeclined: false },
            'showDismissed beside showDeclined true': leadsValid
        }
    },
    {
        name: 'parseLinkedinState',
        read: parseLinkedinState,
        valid: { search: 'q', adding: true, reveal: 'r' },
        wrong: { search: 3, adding: 'yes', reveal: 3 },
        edge: {
            'empty strings': { search: '', reveal: '' },
            'blank reveal': { reveal: ' ' },
            'padded search': { search: ' q ' },
            'no reveal': { reveal: ABSENT }
        },
        notMap: { search: '', adding: false },
        answers: {
            'empty map': { search: '', adding: false },
            'own __proto__ key': { search: 's', adding: true },
            'own __proto__ key alone': { search: '', adding: false },
            valid: linkedinValid,
            'wrong search': { search: '', adding: true, reveal: 'r' },
            'wrong adding': { search: 'q', adding: false, reveal: 'r' },
            'wrong reveal': { search: 'q', adding: true },
            'all wrong': { search: '', adding: false },
            'empty strings': { search: '', adding: true },
            'blank reveal': { search: 'q', adding: true, reveal: ' ' },
            'padded search': { search: ' q ', adding: true, reveal: 'r' },
            'no reveal': { search: 'q', adding: true }
        }
    },
    {
        name: 'parseRadarState',
        read: parseRadarState,
        valid: { search: 'q', dismissedOpen: true, reveal: 'r' },
        wrong: { dismissedOpen: 'yes' },
        edge: {},
        notMap: radarFallback,
        answers: {
            'empty map': radarFallback,
            'own __proto__ key': { search: 's', dismissedOpen: false },
            'own __proto__ key alone': radarFallback,
            valid: radarValid,
            'wrong dismissedOpen': { search: 'q', dismissedOpen: false, reveal: 'r' },
            'all wrong': radarFallback
        }
    },
    {
        name: 'parseSlidesState',
        read: parseSlidesState,
        valid: { at: 'sig', order: ['a', 'b'], picked: ['a'], said: 'ok' },
        wrong: { at: 3, order: 'x', picked: {}, said: 3 },
        edge: {},
        notMap: slidesFallback,
        answers: {
            'empty map': slidesFallback,
            'own __proto__ key': slidesFallback,
            'own __proto__ key alone': slidesFallback,
            valid: slidesValid,
            'wrong at': { at: '', order: ['a', 'b'], picked: ['a'], said: 'ok' },
            'wrong order': { at: 'sig', order: [], picked: ['a'], said: 'ok' },
            'wrong picked': { at: 'sig', order: ['a', 'b'], picked: [], said: 'ok' },
            'wrong said': { at: 'sig', order: ['a', 'b'], picked: ['a'], said: '' },
            'all wrong': slidesFallback
        }
    },
    {
        name: 'parseCalendarState',
        read: parseCalendarState,
        valid: { view: 'dayGridMonth' },
        wrong: { view: 3 },
        edge: {
            'view in capitals': { view: 'DAYGRIDMONTH' },
            'another key': { view: 'listWeek', search: 'q' }
        },
        notMap: { view: 'timeGridWeek' },
        answers: {
            'empty map': { view: 'timeGridWeek' },
            'own __proto__ key': { view: 'timeGridWeek' },
            'own __proto__ key alone': { view: 'timeGridWeek' },
            valid: { view: 'dayGridMonth' },
            'wrong view': { view: 'timeGridWeek' },
            'all wrong': { view: 'timeGridWeek' },
            'view in capitals': { view: 'timeGridWeek' },
            'another key': { view: 'listWeek' }
        }
    }
];

checkReaders(READERS);
