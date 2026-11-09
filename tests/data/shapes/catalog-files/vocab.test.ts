// Layer 1, data tests. The words of config/catalogs/vocab.yml past the shape of each file, as a
// hub's `.oculus/config.yml` lays them over oculus's: a single-use flag carried by two words, a row
// of `focus_clusters` the shape refuses or whose words the text catalog lacks, a Focus lane naming
// no cluster or one no readable row has, and a lane's `move_writes` naming a word the lane does not
// list or the field of the other kind of lane. In the describe of the primary hub, each finding
// names the file the value was read from, the hub's when the hub's value gives it, and the one-word
// readers give no word for a flag two words carry. The hub's file is given as text, so no file is
// read for it, save in the describe of a hub that is not the primary, which plants that hub's file
// on disk and reads it as the build does: every finding of such a hub names its settings file, one
// on a lane of oculus's that the hub's clusters leave out included, and the hub's whole list of
// findings is compared in order.

import { join } from 'node:path';
import { describe, expect } from 'vitest';
import { readOtherHub } from '../../../../src/lib/data/index.ts';
import { appliedWord } from '../../../../src/lib/data/accounts/leads.ts';
import { HUB_FILE } from '../../../../src/lib/data/helpers/hub-names.ts';
import { engineDir, loadConfig, textCatalog } from '../../../../src/lib/data/sources/config.ts';
import { vocabFindings } from '../../../../src/lib/data/sources/config/sections/vocab.ts';
import { oneWordWith } from '../../../../src/lib/data/shapes/vocab-keys.ts';
import { categoriesOf } from '../../../../src/lib/data/shapes/boards/categories.ts';
import { clusters } from '../../../../src/lib/state/boards/focus.ts';
import {
    HUB,
    HUB_SETTINGS as FILE,
    OCULUS,
    findingLines,
    readerFindings,
    withHub
} from '../../sources/config/layers/layers-fixture.ts';
import { it, plantScratch } from '../../../fixtures/scratch.ts';

/** Oculus's own vocabulary file, where a finding on a value of oculus's is filed. */
const OCULUS_VOCAB = `${engineDir()}/config/catalogs/vocab.yml`;

/** The findings of the merge and of the config's readers over a hub file holding `text`. */
function said(text: string): string[] {
    const read = withHub(text);
    return [...findingLines(read.findings), ...findingLines(readerFindings(read, HUB))];
}

/** A row of `focus_clusters` drawn in columns. */
function cluster(key: string, words: string): string {
    return `{ key: ${key}, ${words}muted: false, layout: columns }`;
}

/** oculus's five clusters as a hub file writes them, `incubate` given `words` for its label. */
function clustersWith(words: string): string {
    return [
        'focus_clusters:',
        `  - ${cluster('now', 'label: focus.cluster_now, glyph: focus.now_glyph, ')}`,
        `  - ${cluster('parked', 'label: focus.cluster_parked, ')}`,
        `  - ${cluster('incubate', words)}`,
        '  - { key: umbrella, glyph: focus.ideas_glyph, muted: true, layout: full_width, sort: title }',
        '  - { key: idea, glyph: focus.ideas_glyph, muted: true, layout: full_width, sort: title }',
        ''
    ].join('\n');
}

/** A hub file whose one Focus lane holds `fields` after its key, label and colour. */
function laneWith(fields: string): string {
    return `focus_lanes: [ { key: s, label: S, color: "#0e7490", ${fields} } ]\n`;
}

describe("the vocabulary's words past its shape", () => {
    it('reads oculus alone with no finding of the vocabulary', () => {
        const findings = vocabFindings(OCULUS, () => 'vocab.yml', textCatalog(OCULUS));
        expect(findings).toEqual([]);
    });

    it.each([
        [
            'words a category whose label holds no other form, and draws it by its key',
            '{ one: idea }',
            [
                `${FILE} | categories[3].label | categories[3].label is a map of plural forms with no other form, which every such map holds`
            ],
            'idea'
        ],
        [
            'words a form of a category label outside the six plural forms, and reads the others',
            '{ one: idea, several: ideas, other: ideas }',
            [
                `${FILE} | categories[3].label.several | categories[3].label.several is not a plural form: the forms are zero, one, two, few, many and other`
            ],
            'ideas'
        ],
        ['reads a category with no label by its key, with no finding', '', [], 'idea']
    ])('%s', (_title, label, findings, drawn) => {
        const field = label === '' ? '' : `label: ${label}, `;
        const text = `categories:\n  - { key: idea, ${field}stages: { words: [scoping] }, color: "#7c5cff" }\n`;
        expect(said(text).filter((line) => line.includes('categories'))).toEqual(findings);
        const row = categoriesOf(withHub(text).config).find((one) => one.key === 'idea');
        expect(row?.label).toBe(drawn);
    });

    it('case 5: words a lane naming a cluster no row has and one naming none, and reads a fourth cluster', () => {
        const text = [
            'focus_clusters:',
            '  - { key: now, label: focus.cluster_now, muted: false, layout: columns }',
            '  - { key: later, label: focus.cluster_parked, muted: true, layout: columns }',
            'focus_lanes:',
            '  - { key: run, label: Run, color: "#16a34a", cluster: now, stages: [exploring] }',
            '  - { key: wait, label: Wait, color: "#475569", cluster: later, stages: [submitted] }',
            '  - { key: lost, label: Lost, color: "#b45309", cluster: nowhere, stages: [revision] }',
            '  - { key: loose, label: Loose, color: "#0e7490", stages: [scoping] }',
            ''
        ].join('\n');
        expect(said(text)).toEqual([
            `${FILE} | focus_lanes[2] | the Focus lane lost names the cluster nowhere, which no readable row of focus_clusters has; the lane is not drawn`,
            `${FILE} | focus_lanes[3] | the Focus lane loose names no cluster; the lane is not drawn`
        ]);
    });

    it('case 6: words a cluster drawn in a layout the shape does not take and each of its lanes, and reads no cluster from it', () => {
        const text = clustersWith('label: focus.cluster_incubate, ').replace(
            'key: incubate, label: focus.cluster_incubate, muted: false, layout: columns',
            'key: incubate, label: focus.cluster_incubate, muted: false, layout: grid'
        );
        const lanes = ['scope', 'derisk', 'build'].map(
            (lane, at) =>
                `${OCULUS_VOCAB} | focus_lanes[${String(at + 6)}] | the Focus lane ${lane} names the cluster incubate, which no readable row of focus_clusters has; the lane is not drawn`
        );
        expect(said(text)).toEqual([
            `${FILE} | focus_clusters.2.layout | focus_clusters.2.layout must be one of columns, full_width`,
            ...lanes
        ]);
        expect(clusters(withHub(text).config).map((one) => one.key)).toEqual([
            'now',
            'parked',
            'umbrella',
            'idea'
        ]);
    });

    it("words each lane of a cluster whose row does not read, and of oculus's clusters the hub's list leaves out", () => {
        const text =
            'focus_clusters: [ { key: now, label: focus.cluster_now, muted: false, layout: grid } ]\n';
        const lanes = [
            ['run', 'now'],
            ['push', 'now'],
            ['revise', 'now'],
            ['review', 'parked'],
            ['blocked', 'parked'],
            ['backburner', 'parked'],
            ['scope', 'incubate'],
            ['derisk', 'incubate'],
            ['build', 'incubate'],
            ['umbrella', 'umbrella'],
            ['idea', 'idea']
        ].map(
            ([lane, cluster], at) =>
                `${OCULUS_VOCAB} | focus_lanes[${String(at)}] | the Focus lane ${lane} names the cluster ${cluster}, which no readable row of focus_clusters has; the lane is not drawn`
        );
        expect(said(text)).toEqual([
            `${FILE} | focus_clusters.0.layout | focus_clusters.0.layout must be one of columns, full_width`,
            ...lanes
        ]);
    });

    it('words the label of a cluster whose row does not read, and a row repeating a key after it does not read', () => {
        const text =
            'focus_clusters: [ { key: now, label: focus.nosuch, muted: false, layout: grid } ]\n';
        const lines = said(text);
        expect(lines.slice(0, 2)).toEqual([
            `${FILE} | focus_clusters.0.layout | focus_clusters.0.layout must be one of columns, full_width`,
            `${FILE} | focus_clusters[0].label | the label of the Focus cluster now names focus.nosuch, which the text catalog lacks; it reads as absent`
        ]);
        const repeated = clustersWith('label: focus.cluster_incubate, ').replace(
            '  - { key: idea,',
            '  - { key: now, muted: false, layout: grid }\n  - { key: idea,'
        );
        expect(said(repeated)).toEqual([
            `${FILE} | focus_clusters.4.layout | focus_clusters.4.layout must be one of columns, full_width`,
            `${FILE} | focus_clusters[4] | a second row of focus_clusters has the key now; the row is not read`
        ]);
    });

    it("words a cluster's label and glyph naming no word of the text catalog", () => {
        const text = clustersWith('label: focus.nosuch, glyph: focus.nosuch_glyph, ');
        expect(said(text)).toEqual([
            `${FILE} | focus_clusters[2].label | the label of the Focus cluster incubate names focus.nosuch, which the text catalog lacks; it reads as absent`,
            `${FILE} | focus_clusters[2].glyph | the glyph of the Focus cluster incubate names focus.nosuch_glyph, which the text catalog lacks; it reads as absent`
        ]);
    });

    it('words a row of focus_clusters whose key an earlier row holds', () => {
        const text = clustersWith('label: focus.cluster_incubate, ').replace(
            '  - { key: idea,',
            `  - ${cluster('now', '')}\n  - { key: idea,`
        );
        expect(said(text)).toEqual([
            `${FILE} | focus_clusters[4] | a second row of focus_clusters has the key now; the row is not read`
        ]);
    });

    it('case 7: words two tiers carrying default, and the one-word reader gives none', () => {
        const read = withHub('tiers: { personal: { label: Personal, default: true } }\n');
        expect(findingLines(readerFindings(read, HUB))).toEqual([
            `${FILE} | tiers.personal | research, personal each carry default, which one word carries at most; none of them is read for it`
        ]);
        expect(oneWordWith(read.config, 'tiers', 'default')).toBe(undefined);
    });

    it('case 11: words a stage lane moving onto a stage it does not list, and one naming a chip', () => {
        expect(
            said(laneWith('cluster: now, stages: [scoping], move_writes: { stage: building }'))
        ).toEqual([
            `${FILE} | focus_lanes[0].move_writes | the move_writes of the Focus lane s names building, which the lane does not list; the lane takes no move`
        ]);
        expect(
            said(laneWith('cluster: now, stages: [scoping], move_writes: { chip: blocked }'))
        ).toEqual([
            `${FILE} | focus_lanes[0].move_writes | the move_writes of the Focus lane s names a chip, and the lane is placed by its stages; the lane takes no move`
        ]);
    });

    it('words a move naming both fields, and a listed word the vocabulary lacks', () => {
        const both =
            'cluster: now, stages: [scoping], move_writes: { stage: scoping, chip: blocked }';
        expect(said(laneWith(both))).toEqual([
            `${FILE} | focus_lanes[0].move_writes | the move_writes of the Focus lane s names both a stage and a chip; the lane takes no move`
        ]);
        const config = {
            ...OCULUS,
            focus_lanes: [
                { key: 's', cluster: 'now', stages: ['nosuch'], move_writes: { stage: 'nosuch' } }
            ]
        };
        const findings = vocabFindings(config, () => 'vocab.yml', textCatalog(OCULUS));
        expect(findingLines(findings)).toEqual([
            'vocab.yml | focus_lanes[0].move_writes | the move_writes of the Focus lane s names nosuch, which is no word of stages; the lane takes no move'
        ]);
    });

    it('case 12: words default_task on two statuses, and the one-word reader gives none', () => {
        const read = withHub('statuses: { doing: { color: "#16a34a", default_task: true } }\n');
        expect(findingLines(readerFindings(read, HUB))).toEqual([
            `${FILE} | statuses.doing | todo, doing each carry default_task, which one word carries at most; none of them is read for it`
        ]);
        expect(oneWordWith(read.config, 'statuses', 'default_task')).toBe(undefined);
    });

    it('case 12: words lead_applied on two lead statuses, and the apply word is none', () => {
        const read = withHub(
            'lead_statuses: { closed: { lead_closed: true, lead_applied: true } }\n'
        );
        expect(findingLines(readerFindings(read, HUB))).toEqual([
            `${FILE} | lead_statuses.closed | applied, closed each carry lead_applied, which one word carries at most; none of them is read for it`
        ]);
        expect(appliedWord(read.config)).toBe('');
    });

    it("files a flag carried by a word of oculus's file and one of a hub's in the hub's file", () => {
        const read = withHub(
            'stages: { scoping: { label: Scoping, idea: true, new_idea: true } }\n'
        );
        expect(read.from['stages.nascent']).toBe('catalogs/vocab.yml');
        expect(findingLines(readerFindings(read, HUB))).toEqual([
            `${FILE} | stages.scoping | nascent, scoping each carry new_idea, which one word carries at most; none of them is read for it`
        ]);
        expect(oneWordWith(read.config, 'stages', 'new_idea')).toBe(undefined);
    });
});

/** A hub file whose tier `personal` carries `default` beside oculus's `research`. */
const TIERS = 'tiers: { personal: { label: Personal, default: true } }\n';

/** The finding of the two tiers carrying `default`, as its key and sentence. */
const TIERS_SAID: [string, string] = [
    'tiers.personal',
    'research, personal each carry default, which one word carries at most; none of them is read for it'
];

/** The lanes of oculus's whose cluster a hub's list holding only `now` leaves out, by index. */
const LEFT_OUT = [
    ['review', 'parked'],
    ['blocked', 'parked'],
    ['backburner', 'parked'],
    ['scope', 'incubate'],
    ['derisk', 'incubate'],
    ['build', 'incubate'],
    ['umbrella', 'umbrella'],
    ['idea', 'idea']
].map(([lane, cluster], at): [string, string] => [
    `focus_lanes[${String(at + 3)}]`,
    `the Focus lane ${lane} names the cluster ${cluster}, which no readable row of focus_clusters has; the lane is not drawn`
]);

/**
 * A row of the table: what the hub file holds, its text, the findings of the hub as key and
 * sentence in order, and the vocabulary map and flag the one-word reader gives no word for.
 */
type OtherHubRow = [string, string, [string, string][], [string, string]?];

/** One row per text of the hub's settings file that gives a different list of findings. */
const OTHER_HUB_ROWS: OtherHubRow[] = [
    ['two tiers carrying default', TIERS, [TIERS_SAID], ['tiers', 'default']],
    [
        'two statuses carrying default_task',
        'statuses: { doing: { color: "#16a34a", default_task: true } }\n',
        [
            [
                'statuses.doing',
                'todo, doing each carry default_task, which one word carries at most; none of them is read for it'
            ]
        ],
        ['statuses', 'default_task']
    ],
    [
        'two stages carrying new_idea',
        'stages: { scoping: { label: Scoping, idea: true, new_idea: true } }\n',
        [
            [
                'stages.scoping',
                'nascent, scoping each carry new_idea, which one word carries at most; none of them is read for it'
            ]
        ],
        ['stages', 'new_idea']
    ],
    [
        'a lane naming a cluster no row has',
        laneWith('cluster: nowhere, stages: [scoping]'),
        [
            [
                'focus_lanes[0]',
                'the Focus lane s names the cluster nowhere, which no readable row of focus_clusters has; the lane is not drawn'
            ]
        ]
    ],
    [
        'a lane moving onto a stage it does not list',
        laneWith('cluster: now, stages: [scoping], move_writes: { stage: building }'),
        [
            [
                'focus_lanes[0].move_writes',
                'the move_writes of the Focus lane s names building, which the lane does not list; the lane takes no move'
            ]
        ]
    ],
    [
        'a lane moving onto a stage the vocabulary lacks',
        laneWith('cluster: now, stages: [nosuch], move_writes: { stage: nosuch }'),
        [
            [
                'focus_lanes[0].move_writes',
                'the move_writes of the Focus lane s names nosuch, which is no word of stages; the lane takes no move'
            ]
        ]
    ],
    [
        "a cluster whose label names no catalog word, the list leaving oculus's other clusters out",
        `focus_clusters: [ ${cluster('now', 'label: nosuch.word, ')} ]\n`,
        [
            [
                'focus_clusters[0].label',
                'the label of the Focus cluster now names nosuch.word, which the text catalog lacks; it reads as absent'
            ],
            ...LEFT_OUT
        ]
    ],
    [
        'a stage word the hub adds',
        'stages: { drafting: { label: Drafting, color: "#16a34a" } }\n',
        []
    ],
    ['no key of the vocabulary', 'scan: []\n', []],
    [
        'a category row naming no color beside two tiers carrying default',
        `categories:\n  - { key: x, label: { other: X }, stages: { words: [building] } }\n${TIERS}`,
        [['categories[8]', 'categories[8] names no color, so it is drawn in no colour'], TIERS_SAID]
    ],
    [
        'a lane naming no stages, which the merge refuses',
        laneWith('cluster: now'),
        [['focus_lanes.0', 'focus_lanes.0 is not a value this key takes']]
    ]
];

describe('the vocabulary words of a hub that is not the primary', () => {
    it.each(OTHER_HUB_ROWS)(
        'gives the findings of %s, each naming its settings file',
        (_, text, expected, flag) => {
            const dir = plantScratch('oculus-hub-vocab-', { [HUB_FILE]: text });
            const loaded = loadConfig(engineDir(), { hub: dir, other: 'lab' });
            const read = readOtherHub({ key: 'lab', dir }, loaded);
            const file = join(dir, HUB_FILE);
            expect(read.findings.map((one) => [one.file, one.key, one.message])).toEqual(
                expected.map(([key, message]) => [file, key, message])
            );
            if (flag !== undefined) expect(oneWordWith(loaded.config, ...flag)).toBe(undefined);
        }
    );
});
