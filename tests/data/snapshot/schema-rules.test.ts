// Layer 1, data tests. The rules a hub file's `schema:` block states, each checked by the
// validation the snapshot build runs: a hub planted in a scratch directory with a venues registry
// and a datasets registry that carry schemas, built through buildOneHub, and the findings of the
// planted files asserted by file, line and sentence. One table, one row per rule: a reference to a
// key that does not exist, a key that stands twice in the referenced file, a value outside its
// options, written as words or as `{ key, label }` rows, an option row that is no such row, an
// option row holding a key besides key and label, which stays an option, a field outside its
// `when:`, a required field that is missing, and a field no schema declares. A second table checks
// a collection entry's status against `statuses:` and a Position Lead's against `lead_statuses:`,
// and a third a manifest's stage against `stages:`, each finding naming the closest word of the
// list when that word is within half the written word's length in single-letter changes, rounded
// down, and a stage word or a form written as a project chip is one finding naming the field it
// belongs in. A fourth table checks the primary key a file states (no flag, two, a flag beside the
// `collections:` entry's key, a flag on a list field or not `true`, a file with no schema and no
// named key), the foreign keys of its fields (naming nothing, empty, naming a collection with no
// primary key, a `from:` left in place) and the display ranks (none on a target, two of one rank,
// a rank that is no whole number), and a foreign key naming `projects` is checked against and
// resolved to the manifests beside a collection keyed `projects`. Every sentence is looked up in
// the shipped catalog.

import { describe, expect } from 'vitest';
import { portfolioConfigFrom } from '../../../src/lib/data/index.ts';
import { buildOneHub } from '../../fixtures/hubs/hub-build.ts';
import { findingText } from '../../../src/lib/data/helpers/finding-text.ts';
import { engineDir, loadConfig, textCatalog } from '../../../src/lib/data/sources/config.ts';
import {
    graphOf,
    keysRootOf,
    resolvedTargets
} from '../../../src/lib/data/snapshot/references/lookup.ts';
import { it, plantScratch } from '../../fixtures/scratch.ts';

const LOADED = loadConfig(engineDir()).config;
const CATALOG = textCatalog(LOADED);
const CONFIG = portfolioConfigFrom(LOADED);

/** The sentence of a catalog key, which the catalog must hold. */
function sentence(key: string, ...args: (string | number)[]): string {
    expect(CATALOG[key], `the catalog holds ${key}`).toBeDefined();
    return findingText(CATALOG, key, ...args.map(String));
}

/** The registry of venues, its schema and the entries each row plants. */
function venues(entries: string[]): string {
    return [
        'schema:',
        '  - { field: id, type: text, primary_key: true, required: true, help: The venue key. }',
        '  - { field: name, type: text, display: 1, required: true, help: The venue name. }',
        '  - { field: category, type: select, options: [journal, conference], help: The kind. }',
        '  - { field: month, type: text, when: { category: conference }, help: The month. }',
        'entries:',
        ...entries,
        ''
    ].join('\n');
}

/** The registry of venues with a field of themes, its options the rows given. */
function themedVenues(options: string, entries: string[]): string {
    return [
        'schema:',
        '  - { field: id, type: text, primary_key: true, required: true, help: The venue key. }',
        '  - { field: name, type: text, display: 1, required: true, help: The venue name. }',
        `  - { field: themes, type: tags, options: ${options}, help: The themes. }`,
        'entries:',
        ...entries,
        ''
    ].join('\n');
}

/** The registry of datasets, with a reference to a venue. */
function datasets(entries: string[]): string {
    return [
        'schema:',
        '  - { field: key, type: text, primary_key: true, required: true, help: The dataset key. }',
        '  - { field: title, type: text, display: 1, help: The dataset title. }',
        '  - { field: venue, type: select, foreign_key: venues, help: The venue it was released at. }',
        'datasets:',
        ...entries,
        ''
    ].join('\n');
}

type Row = {
    name: string;
    file: 'venues.yml' | 'data.yml';
    text: string;
    /** The finding the file gets: its key, its line, and the sentence. */
    key: string;
    line: number;
    message: string;
};

const ROWS: Row[] = [
    {
        name: 'a reference to a key that does not exist',
        file: 'data.yml',
        text: datasets(['  - key: d1', '    venue: nowhere']),
        key: 'datasets[0].venue',
        line: 7,
        message: sentence('findings.schema.no_key', 'datasets[0].venue', 'nowhere', 'venues')
    },
    {
        name: 'a key that stands twice in the referenced file',
        file: 'venues.yml',
        text: venues(['  - { id: v1, name: One }', '  - { id: v1, name: Two }']),
        key: 'entries[1].id',
        line: 8,
        message: sentence('findings.schema.duplicate_key', 'v1')
    },
    {
        name: 'a value outside its options',
        file: 'venues.yml',
        text: venues(['  - { id: v1, name: One, category: workshop }']),
        key: 'entries[0].category',
        line: 7,
        message: sentence(
            'findings.schema.not_allowed',
            'entries[0].category',
            'workshop',
            'journal, conference'
        )
    },
    {
        name: 'a value outside its options written as key and label',
        file: 'venues.yml',
        text: themedVenues(
            '[{ key: core-ml, label: "Core ML" }, { key: clinical, label: "Clinical" }]',
            ['  - { id: v1, name: One, themes: [core-ml, quantum] }']
        ),
        key: 'entries[0].themes[1]',
        line: 6,
        message: sentence(
            'findings.schema.not_allowed',
            'entries[0].themes[1]',
            'quantum',
            'core-ml, clinical'
        )
    },
    {
        name: 'an option row that holds no key',
        file: 'venues.yml',
        text: themedVenues('[{ key: core-ml, label: "Core ML" }, { label: "No key" }]', [
            '  - { id: v1, name: One, themes: [core-ml] }'
        ]),
        key: 'schema[2].options[1]',
        line: 4,
        message: sentence('findings.schema.option_no_key', 'themes')
    },
    {
        name: 'an option row that holds a key besides key and label, which stays an option',
        file: 'venues.yml',
        text: themedVenues(
            '[{ key: core-ml, label: "Core ML" }, { key: clinical, label: "Clinical", color: "#ff0000" }]',
            ['  - { id: v1, name: One, themes: [clinical] }']
        ),
        key: 'schema[2].options[1]',
        line: 4,
        message: sentence('findings.schema.option_extra', 'themes', 'color', 'clinical')
    },
    {
        name: 'a field outside its when',
        file: 'venues.yml',
        text: venues(['  - { id: v1, name: One, category: journal, month: May }']),
        key: 'entries[0].month',
        line: 7,
        message: sentence('findings.schema.only_when', 'entries[0].month', 'category is conference')
    },
    {
        name: 'a required field that is missing',
        file: 'venues.yml',
        text: venues(['  - { id: v1 }']),
        key: 'entries[0].name',
        line: 7,
        message: sentence('findings.schema.required', 'entries[0].name')
    },
    {
        name: 'a field no schema declares',
        file: 'venues.yml',
        text: venues(['  - { id: v1, name: One, bogus: 1 }']),
        key: 'entries[0].bogus',
        line: 7,
        message: sentence('findings.schema.not_declared', 'entries[0].bogus')
    }
];

/**
 * The sentence a row of the status or stage tables expects, by the ending of its key under
 * `findings.validate`: none for a word of the list, `not_in_vocab` naming the word of the list
 * nearest the written word when it lies within half the written word's length in single-letter
 * changes, rounded down, `unknown` when no word lies that near, and `no_vocab` for a list that
 * holds no word.
 */
type Said = 'none' | 'not_in_vocab' | 'unknown' | 'no_vocab';

/** The finding of a value written as `written`: none, or the one sentence `said` names. */
function saidSentence(
    kind: 'status' | 'lead_status' | 'stage',
    written: string,
    said: Said,
    closest = ''
): string[] {
    if (said === 'none') return [];
    const key = `findings.validate.${kind}_${said}`;
    const shown = JSON.stringify(written);
    return [said === 'not_in_vocab' ? sentence(key, shown, closest) : sentence(key, shown)];
}

type StatusRow = {
    name: string;
    /** The file the status is written in: an applications entry or a Position Lead. */
    file: 'applications' | 'leads';
    status: string;
    /**
     * The sentence the row expects; for `no_vocab` the list the check reads holds no word, and for
     * `not_in_vocab` the finding names `closest`, the word within the bound.
     */
    said: Said;
    closest?: string;
};

const STATUS_ROWS: StatusRow[] = [
    { name: 'an exact word', file: 'applications', status: 'submitted', said: 'none' },
    {
        name: 'one edit',
        file: 'applications',
        status: 'acepted',
        said: 'not_in_vocab',
        closest: 'accepted'
    },
    {
        name: "a tie, the first in the list's order",
        file: 'applications',
        status: 'pased',
        said: 'not_in_vocab',
        closest: 'paused'
    },
    {
        name: 'a case difference',
        file: 'applications',
        status: 'In Prep',
        said: 'not_in_vocab',
        closest: 'in-prep'
    },
    {
        name: 'not applied',
        file: 'applications',
        status: 'not applied',
        said: 'not_in_vocab',
        closest: 'not-applied'
    },
    {
        name: 'under review',
        file: 'applications',
        status: 'under review',
        said: 'not_in_vocab',
        closest: 'under-review'
    },
    {
        name: 'canceled',
        file: 'applications',
        status: 'canceled',
        said: 'not_in_vocab',
        closest: 'cancelled'
    },
    {
        name: 'a lead status',
        file: 'leads',
        status: 'dismised',
        said: 'not_in_vocab',
        closest: 'dismissed'
    },
    { name: 'no word within the bound', file: 'applications', status: 'xyz', said: 'unknown' },
    {
        name: 'the closest word one edit past the bound',
        file: 'applications',
        status: 'scope',
        said: 'unknown'
    },
    {
        name: 'a lead status with no word within the bound',
        file: 'leads',
        status: 'zzzz',
        said: 'unknown'
    },
    {
        name: 'an entry status and an empty list',
        file: 'applications',
        status: 'submitted',
        said: 'no_vocab'
    },
    { name: 'a lead status and an empty list', file: 'leads', status: 'open', said: 'no_vocab' }
];

/** The finding a status row gets: its sentence, or none for a word of the list. */
function statusSentence(row: StatusRow): string[] {
    const kind = row.file === 'leads' ? 'lead_status' : 'status';
    return saidSentence(kind, row.status, row.said, row.closest);
}

type StageRow = {
    name: string;
    stage: string;
    /** The sentence the row expects; for `no_vocab` the stages list holds no word. */
    said: Exclude<Said, 'none'>;
    closest?: string;
};

const STAGE_ROWS: StageRow[] = [
    {
        name: 'a word within the bound',
        stage: 'submited',
        said: 'not_in_vocab',
        closest: 'submitted'
    },
    { name: 'no word within the bound', stage: 'scope', said: 'unknown' },
    { name: 'a stages list with no word', stage: 'submitted', said: 'no_vocab' }
];

describe('the rules of a hub schema', () => {
    it.each(ROWS)('gives the finding of $name, with its file and line', (row) => {
        const hub = plantScratch(
            'oculus-schema-rules-',
            {
                '.oculus/data/research/venues.yml': venues(['  - { id: v1, name: One }']),
                '.oculus/data/research/data.yml': datasets(['  - key: d1']),
                [`.oculus/data/research/${row.file}`]: row.text
            },
            ['projects/active']
        );
        const found = buildOneHub(hub, CONFIG).snapshot.findings.filter((finding) =>
            finding.file.endsWith(`/${row.file}`)
        );
        expect(found.map((one) => [one.key, one.line, one.message])).toEqual([
            [row.key, row.line, row.message]
        ]);
    });

    it.each([
        {
            name: "a person's affiliation",
            file: '.oculus/data/people/people.yml',
            text: [
                'schema:',
                '  - { field: key, type: text, primary_key: true, required: true, help: The person key. }',
                '  - { field: name, type: text, display: 1, required: true, help: The name. }',
                '  - { field: affiliations, type: tags, help: The organisations. }',
                'entries:',
                '  - { key: ada, name: Ada, affiliation: x }',
                ''
            ].join('\n'),
            key: 'entries[0].affiliation'
        },
        {
            name: "a dataset registry's theme_labels",
            file: '.oculus/data/research/data.yml',
            text: datasets(['  - key: d1']).replace('datasets:\n', 'theme_labels: {}\ndatasets:\n'),
            key: 'theme_labels'
        },
        {
            name: "a manifest's program",
            file: 'projects/active/alpha/project.yml',
            text: 'id: alpha\ntier: research\nstage: exploring\ntitle: Alpha\nprogram: y\n',
            key: 'program'
        },
        {
            name: "a manifest's authors",
            file: 'projects/active/alpha/project.yml',
            text: 'id: alpha\ntier: research\nstage: exploring\ntitle: Alpha\nauthors: [A. Example]\n',
            key: 'authors'
        }
    ])('gives the one finding of a key no schema declares for $name', (row) => {
        const hub = plantScratch(
            'oculus-schema-old-key-',
            { '.oculus/data/research/venues.yml': venues([]), [row.file]: row.text },
            ['projects/active']
        );
        const found = buildOneHub(hub, CONFIG).snapshot.findings.filter((one) =>
            one.file.endsWith(`/${row.file}`)
        );
        expect(found.map((one) => [one.key, one.message])).toEqual([
            [row.key, sentence('findings.schema.not_declared', row.key)]
        ]);
    });

    it.each(STATUS_ROWS)(
        'a status outside its vocabulary names the closest word only within half its length: $name',
        (row) => {
            const file = `.oculus/data/academic/${row.file}.yml`;
            const hub = plantScratch(
                'oculus-status-closest-',
                { [file]: `entries:\n  - { title: One, status: ${JSON.stringify(row.status)} }\n` },
                ['projects/active']
            );
            const list = row.file === 'leads' ? 'lead_statuses' : 'statuses';
            const config =
                row.said === 'no_vocab' ? portfolioConfigFrom({ ...LOADED, [list]: {} }) : CONFIG;
            const found = buildOneHub(hub, config).snapshot.findings.filter(
                (one) => one.file.endsWith(`/${row.file}.yml`) && one.key === 'entries[0].status'
            );
            expect(found.map((one) => one.message)).toEqual(statusSentence(row));
            if (row.closest) expect(found.at(0)?.message).toContain(row.closest);
        }
    );

    it.each(STAGE_ROWS)(
        "a manifest's stage outside its list names the closest word only within half its length: $name",
        (row) => {
            const file = 'projects/active/alpha/project.yml';
            const text = `id: alpha\ntier: research\nstage: ${row.stage}\ntitle: Alpha\n`;
            const hub = plantScratch('oculus-stage-closest-', { [file]: text }, [
                'projects/active'
            ]);
            const config =
                row.said === 'no_vocab' ? portfolioConfigFrom({ ...LOADED, stages: {} }) : CONFIG;
            const found = buildOneHub(hub, config).snapshot.findings.filter(
                (one) => one.file.endsWith(`/${file}`) && one.key === 'stage'
            );
            expect(found.map((one) => one.message)).toEqual(
                saidSentence('stage', row.stage, row.said, row.closest)
            );
        }
    );

    it('a stage word or a form as a chip is one finding naming its field', () => {
        const file = 'projects/active/alpha/project.yml';
        const text = [
            'id: alpha',
            'tier: research',
            'stage: exploring',
            'title: Alpha',
            'status: { chips: [submitted, journal, blocked] }',
            ''
        ].join('\n');
        const hub = plantScratch(
            'oculus-stage-chip-',
            { '.oculus/data/research/venues.yml': venues([]), [file]: text },
            ['projects/active']
        );
        const found = buildOneHub(hub, CONFIG).snapshot.findings.filter((one) =>
            one.file.endsWith(`/${file}`)
        );
        expect(found.map((one) => [one.key, one.message])).toEqual([
            ['status.chips[0]', sentence('findings.validate.chip_is_stage', 'submitted')],
            ['status.chips[1]', sentence('findings.validate.chip_is_form', 'journal')]
        ]);
    });

    it('takes any word in a select with no options and no source, as the write path does', () => {
        const text = venues(['  - { id: v1, name: One, root: anything }']).replace(
            'entries:\n',
            '  - { field: root, type: select, help: The root. }\nentries:\n'
        );
        const hub = plantScratch(
            'oculus-schema-open-select-',
            { '.oculus/data/research/venues.yml': text },
            ['projects/active']
        );
        const found = buildOneHub(hub, CONFIG).snapshot.findings;
        expect(found.filter((one) => one.file.endsWith('/venues.yml'))).toEqual([]);
    });

    it('puts no finding on a reference to a file that does not parse', () => {
        const hub = plantScratch(
            'oculus-schema-unread-',
            {
                '.oculus/data/research/venues.yml': 'entries: [\n  - id: v1\n',
                '.oculus/data/research/data.yml': datasets(['  - key: d1', '    venue: nowhere'])
            },
            ['projects/active']
        );
        const found = buildOneHub(hub, CONFIG).snapshot.findings;
        expect(found.filter((one) => one.file.endsWith('/data.yml'))).toEqual([]);
        const own = found.filter((one) => one.file.endsWith('/venues.yml'));
        expect(own.length).toBeGreaterThan(0);
        for (const finding of own) expect(finding.message).toContain('does not parse');
    });
});

/** A tasks file whose schema is the lines given, holding one task. */
function tasks(schema: string[], entries = ['  - { key: t1, title: One }']): string {
    return ['schema:', ...schema.map((one) => `  - ${one}`), 'entries:', ...entries, ''].join('\n');
}

const KEY = '{ field: key, type: text, primary_key: true }';
const TITLE = '{ field: title, type: text, display: 1 }';
const TASKS_FILE = '.oculus/data/academic/tasks.yml';
const VENUES_FILE = '.oculus/data/research/venues.yml';

/** The settings with `fields` set on the `collections:` entry keyed `key`. */
function withEntry(key: string, fields: Record<string, unknown>): typeof CONFIG {
    const list = (LOADED.collections as Record<string, unknown>[]).map((one) =>
        one.key === key ? { ...one, ...fields } : one
    );
    return portfolioConfigFrom({ ...LOADED, collections: list });
}

type KeyRow = {
    name: string;
    files: Record<string, string>;
    config?: typeof CONFIG;
    /** The file whose findings the row reads, and each finding's key and sentence. */
    file: string;
    found: [string, string][];
};

const KEY_ROWS: KeyRow[] = [
    {
        name: 'a schema that flags no primary key',
        files: { [TASKS_FILE]: tasks(['{ field: key, type: text }', TITLE]) },
        file: TASKS_FILE,
        found: [['schema', sentence('findings.schema.key_none')]]
    },
    {
        name: 'a schema that flags two',
        files: { [TASKS_FILE]: tasks([KEY, '{ field: title, type: text, primary_key: true }']) },
        file: TASKS_FILE,
        found: [['schema', sentence('findings.schema.key_two', 'key, title')]]
    },
    {
        name: "an entry's primary_key beside the schema's flag",
        files: { [TASKS_FILE]: tasks([KEY, TITLE]) },
        config: withEntry('tasks', { primary_key: 'title' }),
        file: TASKS_FILE,
        found: [['schema', sentence('findings.schema.key_beside', 'title', 'key')]]
    },
    {
        name: 'a primary key on a tags field',
        files: {
            [TASKS_FILE]: tasks(
                [TITLE, '{ field: tags, type: tags, primary_key: true }'],
                ['  - { title: One, tags: [a] }']
            )
        },
        file: TASKS_FILE,
        found: [['schema[1].primary_key', sentence('findings.schema.key_listed', 'tags', 'tags')]]
    },
    {
        name: 'a primary_key that is not true',
        files: { [TASKS_FILE]: tasks(['{ field: key, type: text, primary_key: "yes" }', TITLE]) },
        file: TASKS_FILE,
        found: [['schema[0].primary_key', sentence('findings.schema.key_not_true', 'key', 'yes')]]
    },
    {
        name: 'a primary key on a field of a records field',
        files: {
            [TASKS_FILE]: tasks([
                KEY,
                TITLE,
                '{ field: steps, type: records, fields: [{ field: do, type: text, primary_key: true }] }'
            ])
        },
        file: TASKS_FILE,
        found: [['schema[2].fields[0].primary_key', sentence('findings.schema.key_nested', 'do')]]
    },
    {
        name: 'a file with no schema whose collections entry names no primary key',
        files: { '.oculus/data/academic/leads.yml': 'entries:\n  - { title: One }\n' },
        file: '.oculus/data/academic/leads.yml',
        found: [['', sentence('findings.schema.key_missing')]]
    },
    {
        name: 'nothing for a file with no schema whose collections entry names its primary key',
        files: { '.oculus/data/academic/leads.yml': 'entries:\n  - { title: One }\n' },
        config: withEntry('leads', { primary_key: 'title' }),
        file: '.oculus/data/academic/leads.yml',
        found: []
    },
    {
        name: 'a foreign key naming nothing',
        files: {
            [TASKS_FILE]: tasks([
                KEY,
                TITLE,
                '{ field: venue, type: select, foreign_key: nowhere }'
            ])
        },
        file: TASKS_FILE,
        found: [['schema.venue', sentence('findings.schema.bad_foreign_key', 'venue', 'nowhere')]]
    },
    {
        name: 'an empty foreign key',
        files: {
            [TASKS_FILE]: tasks([KEY, TITLE, '{ field: venue, type: select, foreign_key: [] }'])
        },
        file: TASKS_FILE,
        found: [['schema.venue', sentence('findings.schema.foreign_key_empty', 'venue')]]
    },
    {
        name: 'a foreign key naming a collection whose file has no primary key',
        files: {
            [TASKS_FILE]: tasks([
                KEY,
                TITLE,
                '{ field: event, type: select, foreign_key: events }'
            ]),
            '.oculus/data/academic/events.yml': tasks(['{ field: key, type: text }', TITLE])
        },
        file: TASKS_FILE,
        found: [
            ['schema.event', sentence('findings.schema.foreign_key_unkeyed', 'event', 'events')]
        ]
    },
    {
        name: 'a target of a foreign key whose schema ranks no field by display',
        files: {
            [VENUES_FILE]: venues(['  - { id: v1, name: One }']).replace(', display: 1', '')
        },
        file: VENUES_FILE,
        found: [['schema', sentence('findings.schema.display_none', 'venue', 'project.yml')]]
    },
    {
        name: 'two fields of one display rank',
        files: { [TASKS_FILE]: tasks([KEY, TITLE, '{ field: note, type: text, display: 1 }']) },
        file: TASKS_FILE,
        found: [
            ['schema[2].display', sentence('findings.schema.display_twice', 'title, note', '1')]
        ]
    },
    {
        name: 'a display rank that is no whole number from 1',
        files: { [TASKS_FILE]: tasks([KEY, '{ field: title, type: text, display: 0 }']) },
        file: TASKS_FILE,
        found: [['schema[1].display', sentence('findings.schema.display_rank', 'title', '0')]]
    },
    {
        name: 'a from: left on a schema field',
        files: {
            [TASKS_FILE]: tasks([KEY, TITLE, '{ field: venue, type: select, from: venues }'])
        },
        file: TASKS_FILE,
        found: [['schema[2].from', sentence('findings.schema.not_declared', 'schema[2].from')]]
    },
    {
        name: 'a reference naming a venue by its name rather than its id',
        files: { '.oculus/data/research/data.yml': datasets(['  - key: d1', '    venue: One']) },
        file: '.oculus/data/research/data.yml',
        found: [
            [
                'datasets[0].venue',
                sentence('findings.schema.no_key', 'datasets[0].venue', 'One', 'venues')
            ]
        ]
    }
];

describe('the primary key, the foreign keys and the display ranks of a hub schema', () => {
    it.each(KEY_ROWS)('gives the findings of $name', (row) => {
        const hub = plantScratch(
            'oculus-schema-keys-',
            {
                [VENUES_FILE]: venues(['  - { id: v1, name: One }']),
                '.oculus/data/research/data.yml': datasets(['  - key: d1']),
                ...row.files
            },
            ['projects/active']
        );
        const found = buildOneHub(hub, row.config ?? CONFIG).snapshot.findings.filter((one) =>
            one.file.endsWith(`/${row.file}`)
        );
        expect(found.map((one) => [one.key, one.message])).toEqual(row.found);
    });

    it('gives one finding for a venue whose primary key is empty', () => {
        const hub = plantScratch(
            'oculus-schema-empty-key-',
            { [VENUES_FILE]: venues(['  - { id: v1, name: One }', '  - { id: "", name: Two }']) },
            ['projects/active']
        );
        const found = buildOneHub(hub, CONFIG).snapshot.findings.filter((one) =>
            one.file.endsWith('/venues.yml')
        );
        expect(found).toHaveLength(1);
    });

    it('reads a foreign key naming projects as the manifests beside a collection keyed projects', () => {
        const list = [
            ...(LOADED.collections as unknown[]),
            { key: 'projects', file: '.oculus/data/academic/other.yml' }
        ];
        const config = portfolioConfigFrom({ ...LOADED, collections: list });
        const related = '{ field: related, type: tags, foreign_key: projects }';
        const hub = plantScratch(
            'oculus-schema-projects-',
            {
                '.oculus/data/academic/other.yml': tasks(
                    [KEY, TITLE],
                    ['  - { key: alpha, title: Not a project }', '  - { key: only-here, title: X }']
                ),
                [TASKS_FILE]: tasks(
                    [KEY, TITLE, related],
                    ['  - { key: t1, title: One, related: [alpha, only-here] }']
                ),
                'projects/active/alpha/project.yml':
                    'id: alpha\ntier: research\nstage: exploring\ntitle: Alpha\n'
            },
            ['projects/active']
        );
        const build = buildOneHub(hub, config);
        const found = build.snapshot.findings.filter((one) => one.file.endsWith(`/${TASKS_FILE}`));
        expect(found.map((one) => one.message)).toEqual([
            sentence('findings.schema.no_key', 'entries[0].related[1]', 'only-here', 'projects')
        ]);
        const graph = graphOf(build.references);
        const scan = build.references.files.find((one) => one.file.path === TASKS_FILE);
        const named = (key: string): string[] => {
            const at = scan?.references.find((one) => one.value === key);
            if (scan === undefined || at === undefined) return [];
            const targets = resolvedTargets(graph, keysRootOf(scan), key, at.sources);
            return targets.map((one) => one.scan.file.path);
        };
        expect(named('alpha')).toEqual(['projects/active/alpha/project.yml']);
        expect(named('only-here')).toEqual([]);
    });

    it.each(['projects', 'vocab.x'])(
        'gives a finding naming a collection keyed %s, whose key a foreign key reads as its own target',
        (key) => {
            const list = [
                ...(LOADED.collections as unknown[]),
                { key, file: '.oculus/data/academic/other.yml' }
            ];
            const config = portfolioConfigFrom({ ...LOADED, collections: list });
            const hub = plantScratch('oculus-schema-reserved-', {}, ['projects/active']);
            const found = buildOneHub(hub, config).snapshot.findings.filter(
                (one) => one.key === `collections[${String(list.length - 1)}].key`
            );
            expect(found.map((one) => one.message)).toEqual([
                sentence('findings.collections.reserved_key', key)
            ]);
        }
    );
});
