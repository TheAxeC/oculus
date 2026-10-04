// Layer 2, client-state tests. The Position Leads closing, deadline, fit, ordering, searching and
// saved-state rules.

import { describe, expect, it } from 'vitest';
import {
    deadlineOf,
    declinedCount,
    fitKey,
    fitTone,
    isClosed,
    isDeclined,
    isExpired,
    isOpen,
    leadsSearch,
    leadId,
    leadIdents,
    localDate,
    parseLeadsState,
    splitLeads,
    visibleLeads,
    runLog
} from '../../../src/lib/state/feeds/leads.ts';

describe('position lead selectors', () => {
    it('formats today from local calendar components at half past midnight', () => {
        const now = new Date(2026, 0, 2, 0, 30).getTime();
        expect(localDate(now)).toBe('2026-01-02');
    });

    it('recognises closed statuses and ISO dates inside deadline prose', () => {
        expect(['applied', ' Declined ', 'CLOSED', 'dismissed'].map(isClosed)).toEqual([
            true,
            true,
            true,
            true
        ]);
        expect(isClosed('open')).toBe(false);
        expect([' Dismissed ', 'DISMISSED'].map(isDeclined)).toEqual([true, true]);
        expect(['open', 'applied'].map(isDeclined)).toEqual([false, false]);
        expect(isExpired({ status: 'dismissed', deadline: '2099-10-01' }, '2026-09-12')).toBe(true);
        expect(deadlineOf('closes 20-09-2026 (2026-09-20)')).toBe('2026-09-20');
        expect(deadlineOf('rolling')).toBe(null);
        expect(isExpired({ status: 'open', deadline: '2026-09-11' }, '2026-09-12')).toBe(true);
        expect(isExpired({ status: 'applied', deadline: '2026-10-01' }, '2026-09-12')).toBe(true);
        expect(isExpired({ status: 'open', deadline: '2026-09-12' }, '2026-09-12')).toBe(false);
    });

    it('takes the first fit key in vocabulary order', () => {
        expect(fitKey('A reach, but a strong methodological match')).toBe('strong');
        expect(fitKey('Moderate fit')).toBe('moderate');
        expect(fitKey('unrated')).toBe(null);
    });

    it('sorts live soonest first with undated last and expired newest first', () => {
        const entries = [
            { title: 'Undated', status: 'open' },
            { title: 'Later', status: 'open', deadline: '2026-10-20' },
            { title: 'Sooner', status: 'open', deadline: 'by 2026-09-20' },
            { title: 'Older past', status: 'open', deadline: '2026-08-01' },
            { title: 'Newer applied', status: 'applied', deadline: '2026-12-01' },
            { title: 'Closed undated', status: 'closed' }
        ];
        const split = splitLeads(entries, '2026-09-12');
        expect(split.live.map((entry) => entry.title)).toEqual(['Sooner', 'Later', 'Undated']);
        expect(split.expired.map((entry) => entry.title)).toEqual([
            'Newer applied',
            'Older past',
            'Closed undated'
        ]);
    });

    it('searches all seven fields and parses the instance-state fields', () => {
        const entries = [
            {
                title: 'Postdoc AI',
                inst: 'University',
                country: 'Belgium',
                typ: 'postdoc',
                focus: 'clinical models',
                fit: 'strong methods',
                status: 'open'
            }
        ];
        expect(leadsSearch(entries, 'postdoc university belgium clinical strong open')).toEqual(
            entries
        );
        expect(leadsSearch(entries, 'postdoc missing')).toEqual([]);
        expect(
            parseLeadsState({
                search: 'ai',
                expiredOpen: true,
                runlogOpen: true,
                adding: true,
                showDeclined: true
            })
        ).toEqual({
            search: 'ai',
            expiredOpen: true,
            runlogOpen: true,
            logAll: false,
            adding: true,
            showDeclined: true
        });
        expect(parseLeadsState(null)).toEqual({
            search: '',
            expiredOpen: false,
            runlogOpen: false,
            logAll: false,
            adding: false,
            showDeclined: false
        });
    });

    it('reads a state saved under the toggle of dismissed leads as the toggle of declined ones', () => {
        expect(parseLeadsState({ showDismissed: true }).showDeclined).toBe(true);
        // A state saved under the new name answers for itself.
        expect(parseLeadsState({ showDeclined: false, showDismissed: true }).showDeclined).toBe(
            false
        );
    });

    it('hides the declined and dismissed entries until the toggle shows every lead', () => {
        const entries = [
            {
                title: 'First role',
                inst: 'One',
                url: 'https://example.org/jobs/first',
                status: 'dismissed'
            },
            { title: 'Second role', inst: 'Two', status: 'open' },
            { title: 'Third role', inst: 'Three', status: 'declined' }
        ];
        expect(leadId(entries[0])).toBe('https-example-org-jobs-first');
        expect(leadId(entries[1])).toBe('second-role-two');
        expect(visibleLeads(entries, false)).toEqual([entries[1]]);
        expect(visibleLeads(entries, true)).toEqual(entries);
        expect(declinedCount(entries)).toBe(2);
        expect(declinedCount([entries[1]])).toBe(0);
    });
});

describe('the id one lead card carries', () => {
    it('keeps the slug of its own fields where that is unique', () => {
        const entries = [
            { title: 'Postdoc AI', inst: 'One' },
            { title: 'Lecturer', inst: 'Two' }
        ];
        const identOf = leadIdents(entries);
        expect(identOf(entries[0])).toBe(leadId(entries[0]));
        expect(identOf(entries[1])).toBe(leadId(entries[1]));
    });

    it('tells two leads that slug the same apart, and gives an empty one an id', () => {
        const entries = [
            { title: 'Postdoc AI', inst: 'One' },
            { title: 'Postdoc AI', inst: 'One' },
            { title: '', inst: '', url: '' }
        ];
        const identOf = leadIdents(entries);
        expect(identOf(entries[0])).not.toBe(identOf(entries[1]));
        expect(identOf(entries[2])).not.toBe('');
        expect(new Set(entries.map(identOf)).size).toBe(3);
    });
});

describe('the lead readers over fields of the wrong type', () => {
    it.each([
        [{ url: 5, title: 'T', inst: 'I' }, 't-i'],
        [{ url: 'http://x.org/a', title: 3 }, 'http-x-org-a'],
        [{ url: 'httpx', title: 'T', inst: 'I' }, 'httpx'],
        [{ title: true, inst: ['a'] }, ''],
        [{ title: NaN, inst: Infinity }, 'nan-infinity'],
        [{ url: null, title: 'T' }, 't']
    ])(
        'slugs the lead %j to %j, a number as its digits and any other type as nothing',
        (entry, id) => {
            expect(leadId(entry)).toBe(id);
        }
    );

    it('searches a number or a NaN field as its text and never a boolean or a list', () => {
        const entries = [{ title: 3, typ: true, focus: ['x'], inst: NaN }];
        expect(leadsSearch(entries, '3')).toHaveLength(1);
        expect(leadsSearch(entries, 'nan')).toHaveLength(1);
        expect(leadsSearch(entries, 'true')).toEqual([]);
        expect(leadsSearch(entries, 'x')).toEqual([]);
    });

    it.each([
        [true, null],
        [5, null],
        [null, null],
        [{}, null],
        [['2026-09-20'], null],
        [20260920, null],
        [NaN, null],
        ['2026-09-20', '2026-09-20'],
        ['a 2026-09-20 b', '2026-09-20']
    ])('reads the deadline %j as %j', (deadline, found) => {
        expect(deadlineOf(deadline)).toBe(found);
    });

    it('reads a status that is not text as no status at all', () => {
        for (const status of [3, null, ['declined'], true, undefined, {}]) {
            expect([isDeclined(status), isClosed(status), isOpen(status)]).toEqual([
                false,
                false,
                false
            ]);
        }
        expect([isDeclined(' Declined '), isClosed(' Declined '), isOpen(' Declined ')]).toEqual([
            true,
            true,
            false
        ]);
        const entries = [
            { status: 3 },
            { status: null },
            { status: ['declined'] },
            { status: ' Declined ' },
            { status: 'open' }
        ];
        expect(visibleLeads(entries, false)).toEqual([
            entries[0],
            entries[1],
            entries[2],
            entries[4]
        ]);
        expect(declinedCount([...entries, {}])).toBe(1);
        expect(isExpired({ status: 3, deadline: '2026-01-01' }, '2026-09-12')).toBe(true);
        expect(isExpired({ status: ['applied'] }, '2026-09-12')).toBe(false);
        expect(isExpired({ status: true }, '2026-09-12')).toBe(false);
        expect(isExpired({ status: 'open', deadline: ['2026-01-01'] }, '2026-09-12')).toBe(false);
    });

    it('keeps a lead whose deadline is not a date string live, after the dated ones', () => {
        const entries = [
            { title: 'a', deadline: 20260101 },
            { title: 'b', deadline: ['2026-01-01'] },
            { title: 'c', deadline: true },
            { title: 'd', deadline: '2026-01-02' },
            { title: 'e', status: 3, deadline: '2099-01-01' }
        ];
        const split = splitLeads(entries, '2026-09-12');
        expect(split.live).toEqual([entries[4], entries[0], entries[1], entries[2]]);
        expect(split.expired).toEqual([entries[3]]);
    });

    it.each([3, null, ['strong'], true, NaN, {}])('reads the fit %j as no fit key', (fit) => {
        expect(fitKey(fit)).toBe(null);
    });

    const palette = { green: 'c-green', teal: 'c-teal-2', bad: 'c-Bad', num: 3 };
    it.each([
        [[], 'grey'],
        [null, 'grey'],
        ['x', 'grey'],
        [{ leads_fit: [], palette: {} }, 'grey'],
        [{ leads_fit: { strong: 3 }, palette }, 'grey'],
        [{ leads_fit: { strong: 'Green' }, palette }, 'green'],
        [{ leads_fit: { strong: 'TEAL' }, palette }, 'teal-2'],
        [{ leads_fit: { strong: 'bad' }, palette }, 'grey'],
        [{ leads_fit: { strong: 'num' }, palette }, 'grey'],
        [{ leads_fit: { strong: 'constructor' }, palette }, 'grey'],
        [{ leads_fit: { strong: 'green' }, palette: [] }, 'grey'],
        [{ leads_fit: { strong: 'green' }, palette: 'x' }, 'grey'],
        [{ leads_fit: { moderate: 'green' }, palette }, 'grey'],
        [{ leads_fit: 'x', palette }, 'grey'],
        [{ palette }, 'grey']
    ])('resolves a strong fit through the vocabulary %j to %j', (vocab, tone) => {
        expect(fitTone('strong fit', vocab)).toBe(tone);
    });

    it('resolves no tone for a fit that is not text', () => {
        expect(fitTone(3, { leads_fit: { strong: 'green' }, palette })).toBe('grey');
    });

    it.each([
        [undefined, []],
        [{}, []],
        [{ log: 3 }, []],
        [{ log: null }, []],
        [{ log: 'abc' }, []],
        [{ log: { 0: 'a' } }, []],
        [{ log: [1, 'a', {}] }, ['1', 'a']],
        [{ log: [NaN, Infinity, true, null, [1], 'x'] }, ['NaN', 'Infinity', 'x']]
    ])('reads the run log of the meta %j as %j', (meta, lines) => {
        expect(runLog(meta)).toEqual(lines);
    });
});
