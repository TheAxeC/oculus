// Pure Position Leads closing, deadline, fit, ordering, searching, and saved-state rules.

import { describe, expect, it } from 'vitest';
import { engineDir, loadConfig } from '../../src/lib/data/sources/config.ts';
import {
    deadlineOf,
    fitKey,
    fitTone,
    isClosed,
    isExpired,
    leadsSearch,
    localDate,
    parseLeadsState,
    splitLeads
} from '../../src/lib/state/leads.ts';

const { config } = loadConfig(engineDir());

describe('position lead selectors', () => {
    it('formats today from local calendar components at half past midnight', () => {
        const now = new Date(2026, 0, 2, 0, 30).getTime();
        expect(localDate(now)).toBe('2026-01-02');
    });

    it('recognises closed statuses and ISO dates inside deadline prose', () => {
        expect(['applied', ' Declined ', 'CLOSED'].map(isClosed)).toEqual([true, true, true]);
        expect(isClosed('open')).toBe(false);
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

    it('searches all seven fields and parses the three instance-state fields', () => {
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
            parseLeadsState({ search: 'ai', expiredOpen: true, runlogOpen: true, adding: true })
        ).toEqual({ search: 'ai', expiredOpen: true, runlogOpen: true, adding: true });
        expect(parseLeadsState(null)).toEqual({
            search: '',
            expiredOpen: false,
            runlogOpen: false,
            adding: false
        });
    });
});
