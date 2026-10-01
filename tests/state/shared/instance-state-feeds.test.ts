// Layer 4, test. What the readers of a tab's instance state in state/feeds and state/life answer
// for every kind of input a saved arrangement can hold: a list, null, a string, a map with an own
// `__proto__` key, a state whose fields are each of the wrong type, and the edge values of the
// right type. The table is described in tests/state/shared/instance-fixture.ts.

import { parseInboxState } from '../../../src/lib/state/feeds/inbox.ts';
import { parseLeadsState } from '../../../src/lib/state/feeds/leads.ts';
import { parseLinkedinState } from '../../../src/lib/state/feeds/linkedin.ts';
import { parseRadarState } from '../../../src/lib/state/feeds/radar.ts';
import { parseCalendarState } from '../../../src/lib/state/life/calendar.ts';
import { parseSlidesState } from '../../../src/lib/state/life/slides.ts';
import { ABSENT, checkReaders, type Reader } from './instance-fixture.ts';

const SEARCH_REVEAL_EDGES = {
    'empty strings': { search: '', reveal: '' },
    'blank reveal': { reveal: ' ' },
    'padded search': { search: ' q ' },
    'no reveal': { reveal: ABSENT }
};

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
        wrong: { search: 3, triagedOpen: 'yes', drafts: 'x', reveal: 3 },
        edge: {
            ...SEARCH_REVEAL_EDGES,
            'drafts with other items': { drafts: [1, 't', null, ['u'], 't'] },
            'drafts empty': { drafts: [] },
            'triagedOpen is a number': { triagedOpen: 1 }
        },
        notMap: inboxFallback,
        answers: {
            'empty map': inboxFallback,
            'search 3, reveal empty': inboxFallback,
            'search s, reveal r, lead space': {
                search: 's',
                triagedOpen: false,
                drafts: [],
                reveal: 'r'
            },
            'own __proto__ key': { search: 's', triagedOpen: false, drafts: [] },
            'own __proto__ key alone': inboxFallback,
            valid: inboxValid,
            'wrong search': { search: '', triagedOpen: true, drafts: ['t1', 't2'], reveal: 'r' },
            'wrong triagedOpen': {
                search: 'q',
                triagedOpen: false,
                drafts: ['t1', 't2'],
                reveal: 'r'
            },
            'wrong drafts': { search: 'q', triagedOpen: true, drafts: [], reveal: 'r' },
            'wrong reveal': { search: 'q', triagedOpen: true, drafts: ['t1', 't2'] },
            'all wrong': inboxFallback,
            'empty strings': { search: '', triagedOpen: true, drafts: ['t1', 't2'] },
            'blank reveal': { search: 'q', triagedOpen: true, drafts: ['t1', 't2'], reveal: ' ' },
            'padded search': {
                search: ' q ',
                triagedOpen: true,
                drafts: ['t1', 't2'],
                reveal: 'r'
            },
            'no reveal': { search: 'q', triagedOpen: true, drafts: ['t1', 't2'] },
            'drafts with other items': {
                search: 'q',
                triagedOpen: true,
                drafts: ['t', 't'],
                reveal: 'r'
            },
            'drafts empty': { search: 'q', triagedOpen: true, drafts: [], reveal: 'r' },
            'triagedOpen is a number': {
                search: 'q',
                triagedOpen: false,
                drafts: ['t1', 't2'],
                reveal: 'r'
            }
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
            search: 3,
            expiredOpen: 'yes',
            runlogOpen: 1,
            logAll: 'true',
            adding: {},
            showDeclined: 'yes',
            reveal: 3
        },
        edge: {
            ...SEARCH_REVEAL_EDGES,
            'showDismissed in place of showDeclined': {
                showDeclined: ABSENT,
                showDismissed: true
            },
            'showDeclined false beside showDismissed true': {
                showDeclined: false,
                showDismissed: true
            },
            'showDeclined null beside showDismissed true': {
                showDeclined: null,
                showDismissed: true
            },
            'showDeclined a string beside showDismissed true': {
                showDeclined: 'yes',
                showDismissed: true
            },
            'showDismissed a string': { showDeclined: ABSENT, showDismissed: 'yes' },
            'showDeclined undefined beside showDismissed true': {
                showDeclined: undefined,
                showDismissed: true
            },
            'showDismissed beside showDeclined true': { showDismissed: false }
        },
        notMap: leadsFallback,
        answers: {
            'empty map': leadsFallback,
            'search 3, reveal empty': leadsFallback,
            'search s, reveal r, lead space': {
                search: 's',
                expiredOpen: false,
                runlogOpen: false,
                logAll: false,
                adding: false,
                showDeclined: false,
                reveal: 'r'
            },
            'own __proto__ key': { ...leadsFallback, search: 's', adding: true },
            'own __proto__ key alone': leadsFallback,
            valid: leadsValid,
            'wrong search': { ...leadsValid, search: '' },
            'wrong expiredOpen': { ...leadsValid, expiredOpen: false },
            'wrong runlogOpen': { ...leadsValid, runlogOpen: false },
            'wrong logAll': { ...leadsValid, logAll: false },
            'wrong adding': { ...leadsValid, adding: false },
            'wrong showDeclined': { ...leadsValid, showDeclined: false },
            'wrong reveal': {
                search: 'q',
                expiredOpen: true,
                runlogOpen: true,
                logAll: true,
                adding: true,
                showDeclined: true
            },
            'all wrong': leadsFallback,
            'empty strings': {
                search: '',
                expiredOpen: true,
                runlogOpen: true,
                logAll: true,
                adding: true,
                showDeclined: true
            },
            'blank reveal': { ...leadsValid, reveal: ' ' },
            'padded search': { ...leadsValid, search: ' q ' },
            'no reveal': {
                search: 'q',
                expiredOpen: true,
                runlogOpen: true,
                logAll: true,
                adding: true,
                showDeclined: true
            },
            'showDismissed in place of showDeclined': leadsValid,
            'showDeclined false beside showDismissed true': { ...leadsValid, showDeclined: false },
            'showDeclined null beside showDismissed true': leadsValid,
            'showDeclined a string beside showDismissed true': {
                ...leadsValid,
                showDeclined: false
            },
            'showDismissed a string': { ...leadsValid, showDeclined: false },
            'showDeclined undefined beside showDismissed true': leadsValid,
            'showDismissed beside showDeclined true': leadsValid
        }
    },
    {
        name: 'parseLinkedinState',
        read: parseLinkedinState,
        valid: { search: 'q', adding: true, reveal: 'r' },
        wrong: { search: 3, adding: 'yes', reveal: 3 },
        edge: { ...SEARCH_REVEAL_EDGES, 'adding is a number': { adding: 1 } },
        notMap: { search: '', adding: false },
        answers: {
            'empty map': { search: '', adding: false },
            'search 3, reveal empty': { search: '', adding: false },
            'search s, reveal r, lead space': { search: 's', adding: false, reveal: 'r' },
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
            'no reveal': { search: 'q', adding: true },
            'adding is a number': { search: 'q', adding: false, reveal: 'r' }
        }
    },
    {
        name: 'parseRadarState',
        read: parseRadarState,
        valid: { search: 'q', dismissedOpen: true, reveal: 'r' },
        wrong: { search: 3, dismissedOpen: 'yes', reveal: 3 },
        edge: { ...SEARCH_REVEAL_EDGES, 'dismissedOpen is a number': { dismissedOpen: 1 } },
        notMap: radarFallback,
        answers: {
            'empty map': radarFallback,
            'search 3, reveal empty': radarFallback,
            'search s, reveal r, lead space': { search: 's', dismissedOpen: false, reveal: 'r' },
            'own __proto__ key': { search: 's', dismissedOpen: false },
            'own __proto__ key alone': radarFallback,
            valid: radarValid,
            'wrong search': { search: '', dismissedOpen: true, reveal: 'r' },
            'wrong dismissedOpen': { search: 'q', dismissedOpen: false, reveal: 'r' },
            'wrong reveal': { search: 'q', dismissedOpen: true },
            'all wrong': radarFallback,
            'empty strings': { search: '', dismissedOpen: true },
            'blank reveal': { search: 'q', dismissedOpen: true, reveal: ' ' },
            'padded search': { search: ' q ', dismissedOpen: true, reveal: 'r' },
            'no reveal': { search: 'q', dismissedOpen: true },
            'dismissedOpen is a number': { search: 'q', dismissedOpen: false, reveal: 'r' }
        }
    },
    {
        name: 'parseSlidesState',
        read: parseSlidesState,
        valid: { at: 'sig', order: ['a', 'b'], picked: ['a'], said: 'ok' },
        wrong: { at: 3, order: 'x', picked: {}, said: 3 },
        edge: {
            'empty strings': { at: '', said: '' },
            'lists with duplicates': { order: ['a', 'a'], picked: ['', ''] },
            'lists with other items': { order: [1, 'a', null, ['b']], picked: [NaN, 'p'] },
            'lists empty': { order: [], picked: [] },
            'no said': { said: ABSENT }
        },
        notMap: slidesFallback,
        answers: {
            'empty map': slidesFallback,
            'search 3, reveal empty': slidesFallback,
            'search s, reveal r, lead space': slidesFallback,
            'own __proto__ key': slidesFallback,
            'own __proto__ key alone': slidesFallback,
            valid: slidesValid,
            'wrong at': { at: '', order: ['a', 'b'], picked: ['a'], said: 'ok' },
            'wrong order': { at: 'sig', order: [], picked: ['a'], said: 'ok' },
            'wrong picked': { at: 'sig', order: ['a', 'b'], picked: [], said: 'ok' },
            'wrong said': { at: 'sig', order: ['a', 'b'], picked: ['a'], said: '' },
            'all wrong': slidesFallback,
            'empty strings': { at: '', order: ['a', 'b'], picked: ['a'], said: '' },
            'lists with duplicates': { at: 'sig', order: ['a', 'a'], picked: ['', ''], said: 'ok' },
            'lists with other items': { at: 'sig', order: ['a'], picked: ['p'], said: 'ok' },
            'lists empty': { at: 'sig', order: [], picked: [], said: 'ok' },
            'no said': { at: 'sig', order: ['a', 'b'], picked: ['a'], said: '' }
        }
    },
    {
        name: 'parseCalendarState',
        read: parseCalendarState,
        valid: { view: 'dayGridMonth' },
        wrong: { view: 3 },
        edge: {
            'view of the day': { view: 'timeGridDay' },
            'view of the week': { view: 'timeGridWeek' },
            'view of the list': { view: 'listWeek' },
            'view unknown': { view: 'week' },
            'view empty': { view: '' },
            'view in capitals': { view: 'DAYGRIDMONTH' },
            'view a list': { view: ['listWeek'] },
            'view null': { view: null },
            'no view': { view: ABSENT },
            'another key': { view: 'listWeek', search: 'q' }
        },
        notMap: { view: 'timeGridWeek' },
        answers: {
            'empty map': { view: 'timeGridWeek' },
            'search 3, reveal empty': { view: 'timeGridWeek' },
            'search s, reveal r, lead space': { view: 'timeGridWeek' },
            'own __proto__ key': { view: 'timeGridWeek' },
            'own __proto__ key alone': { view: 'timeGridWeek' },
            valid: { view: 'dayGridMonth' },
            'wrong view': { view: 'timeGridWeek' },
            'all wrong': { view: 'timeGridWeek' },
            'view of the day': { view: 'timeGridDay' },
            'view of the week': { view: 'timeGridWeek' },
            'view of the list': { view: 'listWeek' },
            'view unknown': { view: 'timeGridWeek' },
            'view empty': { view: 'timeGridWeek' },
            'view in capitals': { view: 'timeGridWeek' },
            'view a list': { view: 'timeGridWeek' },
            'view null': { view: 'timeGridWeek' },
            'no view': { view: 'timeGridWeek' },
            'another key': { view: 'listWeek' }
        }
    }
];

checkReaders(READERS);
