// Layer 2, client-state tests. state/boards/career.ts: the host statuses and score dimensions read
// from a config of any type, which tier a score value falls in, how many hosts are in flight, and
// the one-line summary of the collapsed panel. The hosts and the config rows are synthetic.

import { beforeAll, describe, expect, it } from 'vitest';
import { setVocab } from '../../../src/lib/state/shared/words/tones.ts';
import {
    hostStatuses,
    inFlight,
    scoreDims,
    scoreTier,
    summaryOf
} from '../../../src/lib/state/boards/career.ts';
import type { Career, Host } from '../../../src/lib/data/model/index.ts';

function host(name: string, status: string, scores: Record<string, string> = {}): Host {
    return { name, status, scores };
}

function career(over: Partial<Career> = {}): Career {
    return {
        title: 'Career strategy',
        situation: [],
        order: [],
        hosts: [],
        hostCriteria: [],
        notHosts: [],
        eligibility: null,
        dropped: [],
        ...over
    };
}

describe('which tier a score falls in', () => {
    it('reads the file words rather than enumerating every string', () => {
        expect(scoreTier('Strong')).toBe('strong');
        expect(scoreTier('high')).toBe('strong');
        expect(scoreTier('Good')).toBe('good');
        expect(scoreTier('Med-high')).toBe('good');
        expect(scoreTier('High clout')).toBe('good');
        expect(scoreTier('Weak clinic')).toBe('weak');
        expect(scoreTier('Mid')).toBe('mid');
        expect(scoreTier('')).toBe('mid');
    });
});

describe('how many hosts are in flight', () => {
    it('counts the ones emailed and the ones in dialogue, and nothing else', () => {
        const hosts = [
            host('a', 'awaiting'),
            host('b', 'warm'),
            host('c', 'candidate'),
            host('d', 'dropped')
        ];
        expect(inFlight(hosts)).toBe(2);
        expect(inFlight([])).toBe(0);
    });
});

describe('the summary line', () => {
    it('is the milestone up to its first parenthesis', () => {
        const held = career({ milestone: 'FWO Senior - 2 shots left (Nov 2026 and Nov 2027).' });
        expect(summaryOf(held)).toBe('FWO Senior - 2 shots left');
    });

    it('is empty for a career with no milestone, and for no career at all', () => {
        expect(summaryOf(career())).toBe('');
        expect(summaryOf(null)).toBe('');
    });
});

describe('the career rows of the config, whatever their type', () => {
    beforeAll(() => {
        setVocab({ palette: { '#7c5cff': 'c-violet', '#0d9488': 'c-teal' } });
    });

    it('reads career_host_status only as a map of maps, and skips a row that is not a map', () => {
        const rows = {
            a: [],
            b: 'x',
            c: null,
            d: 3,
            e: {},
            f: { label: 3, icon: 4, color: 5 },
            g: { label: 'G', icon: 'fire', color: '#7c5cff' },
            h: { label: '', color: '' },
            i: { color: '#nope' },
            j: { color: '#0D9488' }
        };
        expect(hostStatuses({ career_host_status: rows })).toStrictEqual([
            { key: 'e', label: 'e', glyph: '', tone: 'grey' },
            { key: 'f', label: 'f', glyph: '', tone: 'grey' },
            { key: 'g', label: 'G', glyph: 'fire', tone: 'violet' },
            { key: 'h', label: 'h', glyph: '', tone: 'grey' },
            { key: 'i', label: 'i', glyph: '', tone: 'grey' },
            { key: 'j', label: 'j', glyph: '', tone: 'teal' }
        ]);
        for (const held of [[{ label: 'x' }], 'x', null]) {
            expect(hostStatuses({ career_host_status: held })).toStrictEqual([]);
        }
    });

    it('keeps a host status whose key is an own key named __proto__', () => {
        const rows: unknown = JSON.parse('{"__proto__":{"label":"P"},"a":{"label":"A"}}');
        expect(hostStatuses({ career_host_status: rows })).toStrictEqual([
            { key: '__proto__', label: 'P', glyph: '', tone: 'grey' },
            { key: 'a', label: 'A', glyph: '', tone: 'grey' }
        ]);
    });

    it('reads career_score_dims only as a list of maps, and skips a row that is not a map', () => {
        const rows = [
            [],
            null,
            'x',
            3,
            { field: 3 },
            { field: '' },
            { field: 'ab' },
            { field: 'cd', badge: 3, label: 4 },
            { field: 'ef', badge: '', label: '' },
            { field: 'gh', badge: 'Z', label: 'Why' },
            { field: 'ij', badge: ['k'] }
        ];
        expect(scoreDims({ career_score_dims: rows })).toStrictEqual([
            { field: 'ab', badge: 'A', label: 'ab' },
            { field: 'cd', badge: 'C', label: 'cd' },
            { field: 'ef', badge: 'E', label: 'ef' },
            { field: 'gh', badge: 'Z', label: 'Why' },
            { field: 'ij', badge: 'I', label: 'ij' }
        ]);
        for (const held of [{ a: { field: 'a' } }, 'x']) {
            expect(scoreDims({ career_score_dims: held })).toStrictEqual([]);
        }
    });

    it('puts a score that is not a string, or a word the file does not use, in the middle tier', () => {
        for (const value of [3, true, ['strong'], null, undefined, {}, NaN]) {
            expect(scoreTier(value)).toBe('mid');
        }
        expect(scoreTier(' STRONG ')).toBe('strong');
        expect(scoreTier('HIGH CLOUT')).toBe('good');
        expect(scoreTier('weak clinic')).toBe('weak');
    });
});
