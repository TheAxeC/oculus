// portfolioConfigFrom over a merged config whose keys hold values of the wrong type: the tier
// rules, the collection list, the vocabulary lists and maps, the registry paths and the deck. The
// result is compared whole, and the schema and the deck it hands on are the input values
// themselves.

import { join } from 'node:path';
import { describe, expect } from 'vitest';
import { buildPortfolio, portfolioConfigFrom } from '../../src/lib/data/index.ts';
import { engineDir } from '../../src/lib/data/sources/config.ts';
import { it, plantScratch } from '../fixtures/scratch.ts';

const ENGINE = engineDir();

/** The paths a config naming none of them falls back to. */
const DEFAULT_REGISTRIES = {
    venues: 'registries/venues.yml',
    datasets: 'registries/data.yml',
    pillars: 'registries/pillars.yml',
    domains: 'registries/domains.yml',
    funding: 'funding/funding.yml',
    people: 'registries/people.yml',
    organisations: 'registries/organisations.yml'
};

const DEFAULT_FEEDS = {
    leads: 'feeds/position-leads.yml',
    radar: 'feeds/literature-radar.yml',
    linkedin: 'theaxec.github.io/_linkedin'
};

describe('portfolioConfigFrom', () => {
    it('answers the defaults for a config holding nothing', () => {
        expect(portfolioConfigFrom({}, ENGINE)).toStrictEqual({
            scan: [],
            registries: DEFAULT_REGISTRIES,
            collections: [],
            feeds: DEFAULT_FEEDS,
            linkedinCadenceDays: Number.NaN,
            career: 'registries/career.yml',
            schema: undefined,
            vocab: { types: [], statuses: [] },
            deck: undefined,
            deckFile: join(ENGINE, 'config', 'present.yml'),
            text: {}
        });
    });

    it('reads each key of the wrong type as absent and keeps the rest of its list', () => {
        const schema = { fields: { a: 1 } };
        const deck = { tag_tones: 3, order: [] };
        const merged = {
            scan: [
                3,
                { dir: 3 },
                { dir: 'projects/a', type: 3 },
                { dir: 'projects/b', type: 't', nested: 1, optional: true },
                { dir: 'projects/c', nested: true, optional: 'yes' }
            ],
            collections: [
                { key: 3 },
                'k',
                { key: 'k', file: 3 },
                { key: 'x', file: 'x.yml' },
                [],
                { key: 'funding', file: 'f.yml' }
            ],
            type_color: [],
            status_palette: JSON.parse('{"__proto__":{"c":"x"},"a":1}') as unknown,
            career_host_status: 'x',
            status_legend: [3, { key: 3 }, { key: 'a' }, 'b'],
            focus_lanes: 'x',
            holding_color: 3,
            venue_themes: { a: 1 },
            data_themes: 7,
            venues_file: 3,
            linkedin_cadence_days: 'x',
            career_file: [],
            manifest_schema: schema,
            deck
        };
        const read = portfolioConfigFrom(merged, ENGINE);
        expect(read).toStrictEqual({
            scan: [
                { dir: 'projects/a' },
                { dir: 'projects/b', type: 't', optional: true },
                { dir: 'projects/c', nested: true }
            ],
            registries: { ...DEFAULT_REGISTRIES, funding: 'f.yml' },
            collections: [
                { key: 'x', file: 'x.yml' },
                { key: 'funding', file: 'f.yml' }
            ],
            feeds: DEFAULT_FEEDS,
            linkedinCadenceDays: Number.NaN,
            career: 'registries/career.yml',
            schema,
            vocab: { types: [], statuses: ['__proto__', 'a'], chips: ['a', 'b'] },
            deck,
            deckFile: join(ENGINE, 'config', 'present.yml'),
            text: {}
        });
        expect(read.schema).toBe(schema);
        expect(read.deck).toBe(deck);
    });

    it('lists the keys of a type map and a status map, an own __proto__ key included', () => {
        const read = portfolioConfigFrom(
            {
                type_color: JSON.parse('{"__proto__":1,"a":2}') as unknown,
                status_palette: JSON.parse('{"__proto__":{"c":"x"},"a":1}') as unknown
            },
            ENGINE
        );
        expect(read.vocab).toStrictEqual({
            types: ['__proto__', 'a'],
            statuses: ['__proto__', 'a']
        });
    });

    it('reads the vocabulary lists of a well-formed config', () => {
        const read = portfolioConfigFrom(
            {
                type_color: { a: 1 },
                status_palette: { s: 1 },
                career_host_status: { w: 1 },
                status_legend: [{ key: 'k' }],
                focus_lanes: [{ key: 'l' }],
                holding_color: 'x',
                venue_themes: ['v'],
                data_themes: [{ key: 'd' }],
                deck: { tag_tones: { a: 'x' } }
            },
            ENGINE
        );
        expect(read.vocab).toStrictEqual({
            types: ['a'],
            statuses: ['s'],
            chips: ['k'],
            hostStatuses: ['w'],
            lanes: ['l', 'holding'],
            venueThemes: ['v'],
            dataThemes: ['d']
        });
    });

    it('reads a deck that still holds equations_dir without error and gives the key no effect', () => {
        const hub = plantScratch('oculus-portfolio-config-', {
            'projects/active/alpha/project.yml': 'title: Alpha\n',
            'projects/active/alpha/PRESENT.md': '---\npresent:\n  equation: eq.png\n---\n',
            'shared/eq.png': 'x'
        });
        const config = portfolioConfigFrom(
            {
                scan: [{ dir: 'projects/active', type: 'active' }],
                deck: { equations_dir: 'shared' }
            },
            ENGINE
        );
        const snapshot = buildPortfolio(hub, config);
        const slide = snapshot.entities.projects.alpha.present?.[0];
        expect(slide?.equation).toBeUndefined();
        const present = snapshot.findings.filter((one) => one.file.endsWith('PRESENT.md'));
        expect(present.map((one) => one.message)).toEqual([
            'findings.present.equation_image eq.png'
        ]);
    });
});
