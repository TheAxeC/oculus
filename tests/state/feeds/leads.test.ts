// Pure Position Leads closing, deadline, fit, ordering, searching, and saved-state rules.

import { describe, expect, it } from 'vitest';
import { engineDir, loadConfig } from '../../../src/lib/data/sources/config.ts';
import {
    deadlineOf,
    declinedCount,
    fitKey,
    fitTone,
    isClosed,
    isDeclined,
    isExpired,
    leadsSearch,
    leadId,
    leadIdents,
    localDate,
    parseLeadsState,
    splitLeads,
    visibleLeads,
    runLog
} from '../../../src/lib/state/feeds/leads.ts';

const { config } = loadConfig(engineDir());

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

    it('takes the first fit key in vocabulary order and resolves its configured tone', () => {
        expect(fitKey('A reach, but a strong methodological match')).toBe('strong');
        expect(fitKey('Moderate fit')).toBe('moderate');
        expect(fitKey('unrated')).toBe(null);
        expect(['strong', 'moderate', 'reach', 'none'].map((fit) => fitTone(fit, config))).toEqual([
            'green',
            'amber',
            'grey',
            'grey'
        ]);
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

    it('reads a declined lead, and a dismissed one a file may still hold, as declined', () => {
        expect([' Declined ', 'DECLINED', 'dismissed'].map(isDeclined)).toEqual([true, true, true]);
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

    it('sends a dismissed lead to the expired list, where its status is what it reads', () => {
        const entries = [
            { title: 'Kept', status: 'open', deadline: '2099-10-20' },
            { title: 'Dropped', status: 'dismissed', deadline: '2099-10-20' }
        ];
        const split = splitLeads(entries, '2026-09-12');
        expect(split.live.map((entry) => entry.title)).toEqual(['Kept']);
        expect(split.expired.map((entry) => entry.title)).toEqual(['Dropped']);
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

describe('the run log of the leads feed', () => {
    it('is every line the meta carries as text, a line that is not text or a number left out', () => {
        expect(runLog({ log: ['one', 2, null, { a: 1 }] })).toEqual(['one', '2']);
        expect(runLog({ log: 'not a list' })).toEqual([]);
        expect(runLog(undefined)).toEqual([]);
    });
});
