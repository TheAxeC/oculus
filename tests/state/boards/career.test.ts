// state/boards/career.ts over the real vocabulary: the host statuses and their tones, the score
// dimensions, which tier a score value falls in, how many hosts are in flight, and the one-line
// summary of the collapsed panel.
//
// The config is the real config/catalogs/vocab.yml, so the statuses and dimensions checked here are
// the ones the hub holds. The hosts are synthetic.

import { describe, expect, it } from 'vitest';
import {
    engineDir,
    glyphCatalog,
    loadConfig,
    vocabCatalog
} from '../../../src/lib/data/sources/config.ts';
import { setVocab } from '../../../src/lib/state/shared/words/tones.ts';
import {
    hostStatuses,
    inFlight,
    scoreDims,
    scoreTier,
    summaryOf
} from '../../../src/lib/state/boards/career.ts';
import type { Career, Host } from '../../../src/lib/data/model/index.ts';

const { config } = loadConfig(engineDir());
setVocab(vocabCatalog(config));

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

describe('the host statuses', () => {
    const statuses = hostStatuses(config);

    it('are the keys of career_host_status, in the config order', () => {
        expect(statuses.map((one) => one.key)).toEqual(
            Object.keys(config.career_host_status as Record<string, unknown>)
        );
    });

    it('carry the words the config gives them and a tone rather than a hex', () => {
        const warm = statuses.find((one) => one.key === 'warm');
        expect(warm?.label).toBe('warm');
        expect(warm?.glyph).toBe('fire');
        expect(warm?.glyph === undefined ? false : warm.glyph in glyphCatalog(config)).toBe(true);
        expect(warm?.tone).not.toContain('#');
        expect(warm?.tone.length).toBeGreaterThan(0);
    });

    it('name a glyph config/catalogs/glyphs.yml holds in every row', () => {
        const glyphs = glyphCatalog(config);
        expect(statuses.filter((one) => !(one.glyph in glyphs)).map((one) => one.key)).toEqual([]);
        expect(statuses.map((one) => [one.key, glyphs[one.glyph]])).toEqual([
            ['awaiting', glyphs.inbox],
            ['warm', glyphs.fire],
            ['candidate', glyphs.white],
            ['drafted', glyphs.writing],
            ['dropped', glyphs.fail]
        ]);
    });

    it('are empty for a config that holds no such vocabulary', () => {
        expect(hostStatuses({})).toEqual([]);
    });
});

describe('the score dimensions', () => {
    it('are the rows of career_score_dims with their badge letters', () => {
        const dims = scoreDims(config);
        expect(dims.map((one) => one.field)).toEqual([
            'proposal',
            'ai_fl_clinic',
            'backing',
            'after'
        ]);
        expect(dims.map((one) => one.badge)).toEqual(['P', 'AF', 'B', 'Z']);
    });

    it('are empty for a config that holds no such list', () => {
        expect(scoreDims({})).toEqual([]);
    });
});

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
