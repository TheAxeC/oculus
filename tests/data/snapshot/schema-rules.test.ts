// Layer 1, data tests. The rules a hub file's `schema:` block states, each checked by the
// validation the snapshot build runs: a hub planted in a scratch directory with a venues registry
// and a datasets registry that carry schemas, built through buildOneHub, and the
// findings of the planted files asserted by file, line and sentence. One table, one row per rule:
// a reference to a key that does not exist, a key that stands twice in the referenced file, a
// value outside its options, written as words or as `{ key, label }` rows, an option row that is
// no such row, an option row holding a key besides key and label, which stays an option, a field
// outside its `when:`, a required field that is missing, and a field no schema declares. A second
// table checks a collection entry's status against `statuses:` and a Position Lead's against
// `lead_statuses:`, each finding naming the closest word of the list, and a stage word or a form
// written as a project chip is one finding naming the field it belongs in. Every sentence is looked
// up in the shipped catalog.

import { describe, expect } from 'vitest';
import { portfolioConfigFrom } from '../../../src/lib/data/index.ts';
import { buildOneHub } from '../../fixtures/hubs/hub-build.ts';
import { findingText } from '../../../src/lib/data/helpers/finding-text.ts';
import { engineDir, loadConfig, textCatalog } from '../../../src/lib/data/sources/config.ts';
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
        '  - { field: id, type: text, required: true, help: The venue key. }',
        '  - { field: name, type: text, required: true, help: The venue name. }',
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
        '  - { field: id, type: text, required: true, help: The venue key. }',
        '  - { field: name, type: text, required: true, help: The venue name. }',
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
        '  - { field: key, type: text, required: true, help: The dataset key. }',
        '  - { field: venue, type: select, from: venues, help: The venue it was released at. }',
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
        line: 6,
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

type StatusRow = {
    name: string;
    /** The file the status is written in: an applications entry or a Position Lead. */
    file: 'applications' | 'leads';
    status: string;
    /** The list the check reads holds no word. */
    empty?: boolean;
    /** The closest word the finding names, or none for no finding. */
    closest: string | null;
};

const STATUS_ROWS: StatusRow[] = [
    { name: 'an exact word', file: 'applications', status: 'submitted', closest: null },
    { name: 'one edit', file: 'applications', status: 'acepted', closest: 'accepted' },
    {
        name: "a tie, the first in the list's order",
        file: 'applications',
        status: 'pased',
        closest: 'paused'
    },
    { name: 'a case difference', file: 'applications', status: 'In Prep', closest: 'in-prep' },
    { name: 'not applied', file: 'applications', status: 'not applied', closest: 'not-applied' },
    {
        name: 'under review',
        file: 'applications',
        status: 'under review',
        closest: 'under-review'
    },
    { name: 'canceled', file: 'applications', status: 'canceled', closest: 'cancelled' },
    { name: 'a lead status', file: 'leads', status: 'dismised', closest: 'dismissed' },
    {
        name: 'an entry status and an empty list',
        file: 'applications',
        status: 'submitted',
        empty: true,
        closest: ''
    },
    {
        name: 'a lead status and an empty list',
        file: 'leads',
        status: 'open',
        empty: true,
        closest: ''
    }
];

/** The finding a status row gets: its sentence, or none for a word of the list. */
function statusSentence(row: StatusRow): string[] {
    if (row.closest === null) return [];
    const lead = row.file === 'leads' ? 'lead_' : '';
    const status = JSON.stringify(row.status);
    if (row.empty === true) return [sentence(`findings.validate.${lead}status_no_vocab`, status)];
    return [sentence(`findings.validate.${lead}status_not_in_vocab`, status, row.closest)];
}

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
                '  - { field: key, type: text, required: true, help: The person key. }',
                '  - { field: name, type: text, required: true, help: The name. }',
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
            text: 'id: alpha\ntier: projects\nstage: exploring\ntitle: Alpha\nprogram: y\n',
            key: 'program'
        },
        {
            name: "a manifest's authors",
            file: 'projects/active/alpha/project.yml',
            text: 'id: alpha\ntier: projects\nstage: exploring\ntitle: Alpha\nauthors: [A. Example]\n',
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

    it.each(STATUS_ROWS)('a status outside its vocabulary names the closest word: $name', (row) => {
        const file = `.oculus/data/academic/${row.file}.yml`;
        const hub = plantScratch(
            'oculus-status-closest-',
            { [file]: `entries:\n  - { title: One, status: ${JSON.stringify(row.status)} }\n` },
            ['projects/active']
        );
        const list = row.file === 'leads' ? 'lead_statuses' : 'statuses';
        const config = row.empty === true ? portfolioConfigFrom({ ...LOADED, [list]: {} }) : CONFIG;
        const found = buildOneHub(hub, config).snapshot.findings.filter(
            (one) => one.file.endsWith(`/${row.file}.yml`) && one.key === 'entries[0].status'
        );
        expect(found.map((one) => one.message)).toEqual(statusSentence(row));
        if (row.closest) expect(found.at(0)?.message).toContain(row.closest);
    });

    it('a stage word or a form as a chip is one finding naming its field', () => {
        const file = 'projects/active/alpha/project.yml';
        const text = [
            'id: alpha',
            'tier: projects',
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
