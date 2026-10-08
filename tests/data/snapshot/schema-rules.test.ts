// Layer 1, data tests. The rules a hub file's `schema:` block states, each checked by the
// validation the snapshot build runs: a hub planted in a scratch directory with a venues registry
// and a datasets registry that carry schemas, built through buildPortfolioWithSchemas, and the
// findings of the planted files asserted by file, line and sentence. One table, one row per rule:
// a reference to a key that does not exist, a key that stands twice in the referenced file, a
// value outside its options, a field outside its `when:`, a required field that is missing, and a
// field no schema declares. Every sentence is looked up in the shipped catalog.

import { describe, expect } from 'vitest';
import { buildPortfolioWithSchemas, portfolioConfigFrom } from '../../../src/lib/data/index.ts';
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

describe('the rules of a hub schema', () => {
    it.each(ROWS)('gives the finding of $name, with its file and line', (row) => {
        const hub = plantScratch(
            'oculus-schema-rules-',
            {
                'registries/venues.yml': venues(['  - { id: v1, name: One }']),
                'registries/data.yml': datasets(['  - key: d1']),
                [`registries/${row.file}`]: row.text
            },
            ['projects/active']
        );
        const found = buildPortfolioWithSchemas(hub, CONFIG).snapshot.findings.filter((finding) =>
            finding.file.endsWith(`/${row.file}`)
        );
        expect(found.map((one) => [one.key, one.line, one.message])).toEqual([
            [row.key, row.line, row.message]
        ]);
    });

    it('puts no finding on a reference to a file that does not parse', () => {
        const hub = plantScratch(
            'oculus-schema-unread-',
            {
                'registries/venues.yml': 'entries: [\n  - id: v1\n',
                'registries/data.yml': datasets(['  - key: d1', '    venue: nowhere'])
            },
            ['projects/active']
        );
        const found = buildPortfolioWithSchemas(hub, CONFIG).snapshot.findings;
        expect(found.filter((one) => one.file.endsWith('/data.yml'))).toEqual([]);
        const own = found.filter((one) => one.file.endsWith('/venues.yml'));
        expect(own.length).toBeGreaterThan(0);
        for (const finding of own) expect(finding.message).toContain('does not parse');
    });
});
