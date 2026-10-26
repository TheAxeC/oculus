// Layer 1, data tests. The vocabulary a hub's `.oculus/config.yml` lays over oculus's words of
// config/catalogs/vocab.yml, each key by its shape: a map word by word in oculus's place,
// `categories` row by row by `key`, and the lists whose order is their meaning whole; what cannot
// be applied is a finding naming the hub's file and the dotted key, oculus's value standing. A word
// the hub's values no longer give leaves oculus's own lists that name it, and is a finding at its
// place in a list the hub writes. The hub's file is given as text, so no file is read for it; the
// cases that read a manifest plant a hub in a scratch directory and build it.

import { describe, expect } from 'vitest';
import { portfolioConfigFrom } from '../../../../../src/lib/data/index.ts';
import { HUB_FILE } from '../../../../../src/lib/data/helpers/hub-names.ts';
import { categoriesOf, categoryOf } from '../../../../../src/lib/data/shapes/boards/categories.ts';
import { engineDir, loadConfig } from '../../../../../src/lib/data/sources/config.ts';
import {
    VOCAB_SHAPES,
    inPlaceOverride
} from '../../../../../src/lib/data/sources/config/merge/in-place.ts';
import { buildOneHub } from '../../../../fixtures/hubs/hub-build.ts';
import { it, plantScratch } from '../../../../fixtures/scratch.ts';
import {
    HUB,
    HUB_SETTINGS as FILE,
    OCULUS,
    WORKSPACE_FILE as WORKSPACE,
    findingLines,
    mapOf,
    readerFindings,
    withHub,
    withSettings
} from './layers-fixture.ts';

/** The findings of a merge as `file | key | message`. */
function said(read: ReturnType<typeof loadConfig>): string[] {
    return findingLines(read.findings);
}

/** The `key` of each row of a list of the merged config. */
function rowKeys(config: Record<string, unknown>, key: string): string[] {
    return (config[key] as { key: string }[]).map((row) => row.key);
}

describe("the vocabulary a hub lays over oculus's", () => {
    it("replaces one stage's row in oculus's place and keeps every other stage as oculus ships it", () => {
        const read = withHub('stages: { exploring: { label: Experimenting, color: "#2563eb" } }\n');
        expect(said(read)).toEqual([]);
        const stages = mapOf(read.config, 'stages');
        expect(Object.keys(stages)).toEqual(Object.keys(mapOf(OCULUS, 'stages')));
        expect(stages.exploring).toEqual({ label: 'Experimenting', color: '#2563eb' });
        for (const word of Object.keys(stages).filter((one) => one !== 'exploring')) {
            expect(stages[word], word).toEqual(mapOf(OCULUS, 'stages')[word]);
        }
    });

    it('adds a new stage after oculus last and files a project at it by its flags', () => {
        const read = withHub('stages: { trialling: { label: Trialling, live: true } }\n');
        expect(said(read)).toEqual([]);
        const stages = Object.keys(mapOf(read.config, 'stages'));
        expect(stages).toEqual([...Object.keys(mapOf(OCULUS, 'stages')), 'trialling']);
        const category = categoryOf({ stage: 'trialling' }, categoriesOf(read.config), read.config);
        expect(category?.key).toBe('in-flight');
    });

    it('takes a stage out with null, and a manifest at that stage is a finding on its stage', () => {
        const text = 'stages: { nascent: null }\n';
        const read = withHub(text);
        expect(said(read)).toEqual([]);
        expect(Object.hasOwn(mapOf(read.config, 'stages'), 'nascent')).toBe(false);
        const hub = plantScratch('oculus-hub-vocab-', {
            [HUB_FILE]: text,
            'projects/ideas/x/project.yml': 'title: X\ntier: research\nstage: nascent\n'
        });
        const settings = loadConfig(engineDir(), { hub });
        const { snapshot } = buildOneHub(hub, portfolioConfigFrom(settings.config, settings.from));
        const file = `${hub}/projects/ideas/x/project.yml`;
        const on = snapshot.findings.filter((one) => one.file === file && one.key === 'stage');
        expect(on.map((one) => one.message)).toEqual([
            'stage "nascent" is not a word of the stages list'
        ]);
    });

    it("words a null naming a stage oculus does not hold, and keeps oculus's stages", () => {
        const read = withHub('stages: { nope: null }\n');
        expect(said(read)).toEqual([
            `${FILE} | stages.nope | stages sets nope to null, which oculus's map does not hold`
        ]);
        expect(read.config.stages).toEqual(OCULUS.stages);
    });

    it(
        "takes a word the hub removes out of oculus's own lists that name it, and leaves the hub's own lists as written",
        { tags: ['slow'] },
        () => {
            const row = (config: Record<string, unknown>, key: string, name: string) =>
                (config[key] as Record<string, unknown>[]).find((one) => one.key === name);
            const everything = (read: ReturnType<typeof loadConfig>): string[] => [
                ...said(read),
                ...findingLines(readerFindings(read, HUB))
            ];
            const stage = withHub('stages: { nascent: null }\n');
            expect(everything(stage)).toEqual([]);
            expect(row(stage.config, 'categories', 'idea')).toEqual({
                key: 'idea',
                label: 'idea',
                stages: { words: ['scoping'] },
                color: '#7c5cff'
            });
            expect(stage.from.categories).toBe('catalogs/vocab.yml');
            const lane = withHub('stages: { exploring: null }\n');
            expect(everything(lane)).toEqual([]);
            expect(row(lane.config, 'focus_lanes', 'run')).toMatchObject({
                key: 'run',
                stages: []
            });
            const chip = withHub('chips: { blocked: null }\n');
            expect(everything(chip)).toEqual([]);
            expect(row(chip.config, 'focus_lanes', 'blocked')).toMatchObject({
                key: 'blocked',
                chips: []
            });
            const tier = withHub('tiers: { research: null }\n');
            expect(everything(tier)).toEqual([]);
            const boards = tier.config.boards as Record<string, Record<string, unknown>>;
            expect(boards.projects.tier).toEqual([]);
            expect(boards.software.tier).toBe('software');
            const own = withHub(
                'stages: { nascent: null }\ncategories: [ { key: idea, label: idea, color: "#7c5cff", stages: { words: [nascent] } } ]\n'
            );
            expect(everything(own)).toEqual([
                `${FILE} | categories[0].stages.words | categories[0].stages.words names nascent, which the hub's words no longer hold; it is not read`
            ]);
            expect(row(own.config, 'categories', 'idea')).toEqual({
                key: 'idea',
                label: 'idea',
                color: '#7c5cff',
                stages: { words: [] }
            });
        }
    );

    it(
        "takes a word out however the hub's value drops it, and words it once at its place in the hub's file",
        { tags: ['slow'] },
        () => {
            const everything = (read: ReturnType<typeof loadConfig>): string[] => [
                ...said(read),
                ...findingLines(readerFindings(read, HUB))
            ];
            const lane = withHub(
                'chips: { blocked: null }\nfocus_lanes: [ { key: b, label: B, color: "#dc2626", cluster: parked, chips: [blocked] } ]\n'
            );
            expect(everything(lane)).toEqual([
                `${FILE} | focus_lanes[0].chips | focus_lanes[0].chips names blocked, which the hub's words no longer hold; it is not read`
            ]);
            expect((lane.config.focus_lanes as Record<string, unknown>[])[0].chips).toEqual([]);
            const roles = withHub('roles: [ { key: lead, label: Lead, field: lead } ]\n');
            expect(everything(roles)).toEqual([]);
            const boards = roles.config.boards as Record<string, Record<string, unknown>>;
            expect(boards.supervision.role).toEqual([]);
            expect(boards.projects.role).toBe('lead');
            const stray = withHub(
                'statuses: { applied: null }\nfocus: { applications_sent: [x] }\n'
            );
            expect(everything(stray)).toEqual([
                `${FILE} | focus | key focus is not one the hub's settings file takes; it is not applied`
            ]);
            expect((stray.config.focus as Record<string, unknown>).applications_sent).toEqual([]);
            const skip = withHub('tiers: { personal: null }\n');
            expect(everything(skip)).toEqual([]);
            expect(skip.config.research_audit).toEqual({ skip_tiers: [] });
            const stage = withHub('stages: { nascent: null }\n');
            const options = stage.config.options as Record<
                string,
                Record<string, { default: unknown }>
            >;
            const shipped = options['catalogs/vocab.yml'].categories.default as Record<
                string,
                unknown
            >[];
            expect(shipped.find((one) => one.key === 'idea')).toEqual({
                key: 'idea',
                label: 'idea',
                stages: { words: ['scoping'] },
                color: '#7c5cff'
            });
        }
    );

    it('replaces the lists whose order is their meaning whole', () => {
        const read = withHub(
            [
                'focus_lanes: [ { key: run, label: Run, color: "#16a34a", cluster: now, stages: [exploring] } ]',
                'roles: [ { key: lead, label: Lead, field: lead } ]',
                'fund_stages: [ { label: Submitted, color: "#16a34a", statuses: [submitted] } ]',
                'venue_categories: [ { key: journal, label: Journals, ribbon: true } ]',
                'venue_tiers: [ { key: core, color: "#7c3aed", label: core } ]',
                'radar_buckets: [ { key: idea, glyph: purple, label: Ideas, color: "#7c5cff" } ]',
                ''
            ].join('\n')
        );
        expect(said(read)).toEqual([]);
        expect(rowKeys(read.config, 'focus_lanes')).toEqual(['run']);
        expect(rowKeys(read.config, 'roles')).toEqual(['lead']);
        expect(read.config.fund_stages).toEqual([
            { label: 'Submitted', color: '#16a34a', statuses: ['submitted'] }
        ]);
        expect(read.config.venue_categories).toEqual([
            { key: 'journal', label: 'Journals', ribbon: true }
        ]);
        expect(rowKeys(read.config, 'venue_tiers')).toEqual(['core']);
        expect(rowKeys(read.config, 'radar_buckets')).toEqual(['idea']);
    });

    it("replaces oculus's Focus clusters whole", () => {
        const read = withHub(
            [
                'focus_clusters:',
                '  - { key: now, label: focus.cluster_now, muted: false, layout: columns }',
                '  - { key: later, label: focus.cluster_parked, muted: true, layout: full_width }',
                ''
            ].join('\n')
        );
        expect(said(read)).toEqual([]);
        expect(read.config.focus_clusters).toEqual([
            { key: 'now', label: 'focus.cluster_now', muted: false, layout: 'columns' },
            { key: 'later', label: 'focus.cluster_parked', muted: true, layout: 'full_width' }
        ]);
        expect(read.from.focus_clusters).toBe(HUB_FILE);
    });

    it("case 14: takes the hub's rail colour, and words one that is no colour, oculus's standing", () => {
        const read = withHub('rail_color: "#2563eb"\n');
        expect(said(read)).toEqual([]);
        expect(read.config.rail_color).toBe('#2563eb');
        const wrong = withHub('rail_color: 3\n');
        expect(said(wrong)).toEqual([
            `${FILE} | rail_color | rail_color must be a colour written #rrggbb; oculus's value stands`
        ]);
        expect(wrong.config.rail_color).toBe(OCULUS.rail_color);
    });

    it("lays the categories over oculus's by key: one replaced in its place, one taken out, one added last", () => {
        const read = withHub(
            [
                'categories:',
                '  - { key: idea, label: ideas, stages: { words: [nascent] } }',
                '  - { key: grants, label: grants, stages: { words: [submitted] }, forms: { words: [journal] } }',
                '  - { key: dead-ends, removed: true }',
                ''
            ].join('\n')
        );
        expect(said(read)).toEqual([]);
        const shipped = rowKeys(OCULUS, 'categories');
        expect(rowKeys(read.config, 'categories')).toEqual([
            ...shipped.filter((key) => key !== 'dead-ends'),
            'grants'
        ]);
        const idea = (read.config.categories as { key: string }[]).find(
            (row) => row.key === 'idea'
        );
        expect(idea).toEqual({ key: 'idea', label: 'ideas', stages: { words: ['nascent'] } });
    });

    it("words a removal of a category oculus lacks and a category named twice, and keeps oculus's rows", () => {
        const removal = withHub('categories: [ { key: nope, removed: true } ]\n');
        expect(said(removal)).toEqual([
            `${FILE} | categories | categories takes nope out, which oculus's list does not hold`
        ]);
        expect(removal.config.categories).toEqual(OCULUS.categories);
        const twice = withHub(
            'categories: [ { key: idea, label: one }, { key: idea, label: two } ]\n'
        );
        expect(said(twice)).toEqual([
            `${FILE} | categories | categories names idea in more than one entry; none of them is applied and oculus's entry stands`
        ]);
        expect(twice.config.categories).toEqual(OCULUS.categories);
    });

    it('merges the palette, the fit colours and the audit tiers by word', () => {
        const read = withHub(
            'palette: { "#123456": c-teal }\nleads_fit: { strong: "#16a34a" }\nresearch_audit: { skip_tiers: [] }\n'
        );
        expect(said(read)).toEqual([]);
        expect(mapOf(read.config, 'palette')).toEqual({
            ...mapOf(OCULUS, 'palette'),
            '#123456': 'c-teal'
        });
        expect(read.config.leads_fit).toEqual({ strong: '#16a34a' });
        expect(read.config.research_audit).toEqual({ skip_tiers: [] });
    });

    it("words a list where a map is merged, and keeps oculus's stages", () => {
        const read = withHub('stages: [a, b]\n');
        expect(said(read)).toEqual([
            `${FILE} | stages | stages must be a map; oculus's value stands`
        ]);
        expect(read.config.stages).toEqual(OCULUS.stages);
    });

    it("words a workspace catalog in the hub's file and a hub word in a workspace file", () => {
        const hub = withHub('glyphs: { red: R }\nlocale: nl\n');
        expect(said(hub)).toEqual([
            `${FILE} | glyphs | key glyphs is not one the hub's settings file takes; it is not applied`,
            `${FILE} | locale | key locale is not one the hub's settings file takes; it is not applied`
        ]);
        const workspace = withSettings(
            '  stages: { exploring: { label: X } }\n  manifest_fields: []\n'
        );
        const hubKey = (key: string) =>
            `${WORKSPACE} | settings.${key} | ${key} is a key of the hub's settings file, .oculus/config.yml, which a workspace file does not set; it is not applied`;
        expect(said(workspace)).toEqual([hubKey('stages'), hubKey('manifest_fields')]);
        expect(workspace.config.stages).toEqual(OCULUS.stages);
    });

    it('reads oculus alone with no finding, every word as vocab.yml ships it, no form field and English', () => {
        const read = loadConfig(engineDir());
        expect(said(read)).toEqual([]);
        expect(read.from.stages).toBe('catalogs/vocab.yml');
        expect(read.from.categories).toBe('catalogs/vocab.yml');
        expect(read.config.manifest_fields).toEqual([]);
        expect(read.config.locale).toBe('en');
    });

    it('stores a Settings edit as what changed, and the merge of what is stored gives the edit back', () => {
        const shipped = mapOf(OCULUS, 'stages');
        const seen = Object.fromEntries(
            Object.entries(shipped)
                .filter(([word]) => word !== 'nascent')
                .map(([word, row]) => [
                    word,
                    word === 'exploring' ? { ...(row as object), label: 'Experimenting' } : row
                ])
        );
        const stored = inPlaceOverride(VOCAB_SHAPES.stages, shipped, seen);
        expect(stored).toEqual({
            nascent: null,
            exploring: { ...(shipped.exploring as object), label: 'Experimenting' }
        });
        const read = withHub(`stages: ${JSON.stringify(stored)}\n`);
        expect(said(read)).toEqual([]);
        expect(read.config.stages).toEqual(seen);
        const added = withHub('stages: { trialling: { label: Trialling, live: true } }\n');
        const kept = Object.fromEntries(
            Object.entries(mapOf(added.config, 'stages')).filter(([word]) => word !== 'trialling')
        );
        expect(inPlaceOverride(VOCAB_SHAPES.stages, shipped, kept)).toEqual({});
    });
});
