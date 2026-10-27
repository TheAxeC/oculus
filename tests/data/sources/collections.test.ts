// Layer 1, data tests. readCollections against synthetic collection files in a temporary directory.
// Nothing outside it is read or written, and every write asserts its path is inside the temporary
// directory first.

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve, sep } from 'node:path';
import { describe, expect } from 'vitest';
import { hasCardList } from '../../../src/lib/data/helpers/hub-names.ts';
import type { CollectionEntry } from '../../../src/lib/data/model/index.ts';
import {
    collectionFiles,
    collectionListFindings,
    listWords,
    readCollections
} from '../../../src/lib/data/sources/collections.ts';
import { engineDir, loadConfig, textCatalog } from '../../../src/lib/data/sources/config.ts';
import { focusFindings } from '../../../src/lib/data/sources/config/sections/focus.ts';
import { tickerCategories } from '../../../src/lib/state/boards/ticker.ts';
import { setCatalog, t } from '../../../src/lib/state/shared/words/text.ts';
import { it, scratchDir } from '../../fixtures/scratch.ts';

/** Oculus's own merged configuration. */
const OWN = loadConfig(engineDir()).config;

/** The catalog the findings are worded from: the one oculus ships, read as the server reads it. */
const CATALOG = textCatalog(OWN);

/** The words a list's fields are checked against, oculus's own: its catalog, categories, groups. */
const WORDS = listWords(OWN);

/** The file a finding on `ticker_categories` names. */
const VOCAB_FILE = '/hub/.oculus/config.yml';

const FILES: CollectionEntry[] = [
    { key: 'data', file: '.oculus/data/research/data.yml' },
    { key: 'events', file: '.oculus/data/academic/events.yml' },
    { key: 'collaborations', file: '.oculus/data/academic/collaborations.yml' },
    { key: 'tasks', file: '.oculus/data/academic/tasks.yml' },
    { key: 'tools', file: '.oculus/data/research/tools.yml' },
    { key: 'missing', file: 'nowhere/gone.yml' },
    { key: 'listless', file: 'odd/listless.yml' }
];

function scratch(): string {
    const dir = scratchDir('oculus-collections-');
    return dir;
}

function write(hub: string, rel: string, body: string): void {
    const full = join(hub, rel);
    expect(resolve(full).startsWith(resolve(hub) + sep)).toBe(true);
    mkdirSync(dirname(full), { recursive: true });
    writeFileSync(full, body);
}

/**
 * A hub with a collection keyed by `title`, one keyed by `key`, one with no title, one holding an
 * entry that is not a map, one file absent from disk, and one whose `entries` is a map.
 */
function buildHub(): string {
    const hub = scratch();
    write(
        hub,
        '.oculus/data/research/data.yml',
        [
            'schema:',
            '  - { field: key, type: text, primary_key: true }',
            'datasets:',
            '  - { key: mimic, name: MIMIC-IV, themes: [ecg], source: https://example.invalid/mimic }',
            ''
        ].join('\n')
    );
    write(
        hub,
        '.oculus/data/academic/events.yml',
        [
            'title: Talks & Events',
            'schema:',
            '  - { field: title, type: text, primary_key: true }',
            'entries:',
            '  - { title: ISBI keynote, year: 2026 }',
            '  - { title: Tensor workshop, year: 2025 }',
            ''
        ].join('\n')
    );
    write(
        hub,
        '.oculus/data/academic/collaborations.yml',
        [
            'title: Collaborations',
            'entries:',
            '  - { key: linkoping, title: Linkoping, since: 2024 }',
            '  - { key: leuven, title: Leuven }',
            ''
        ].join('\n')
    );
    // No title: meta is the schema alone, as the hub's .oculus/data/academic/tasks.yml has it.
    write(
        hub,
        '.oculus/data/academic/tasks.yml',
        ['schema: []', 'entries:', '  - { title: Review AAIM submission }', ''].join('\n')
    );
    // One entry is a bare string rather than a map: a finding, and the others still come back.
    write(
        hub,
        '.oculus/data/research/tools.yml',
        [
            'title: Tools',
            'entries:',
            '  - { title: bttrlib, url: https://example.invalid/bttrlib }',
            '  - just-a-string',
            '  - { title: oculus }',
            ''
        ].join('\n')
    );
    // Parses, but `entries` is a map rather than a list.
    write(hub, 'odd/listless.yml', ['title: Listless', 'entries:', '  one: 1', ''].join('\n'));
    // nowhere/gone.yml is deliberately never written.
    return hub;
}

describe('readCollections', () => {
    it('reads a title-keyed collection with its entries in file order', () => {
        const hub = buildHub();
        const { collections } = readCollections(hub, FILES, CATALOG);
        const events = collections.events;

        expect(events.key).toBe('events');
        expect(events.file).toBe(join(hub, '.oculus/data/academic/events.yml'));
        expect(events.entries.map((e) => e.title)).toEqual(['ISBI keynote', 'Tensor workshop']);
        expect(events.entries[1].year).toBe(2025);
    });
});

describe('the registries that are collections of their own', () => {
    const REGISTRIES: CollectionEntry[] = [
        { key: 'people', file: '.oculus/data/people/people.yml' },
        { key: 'organisations', file: '.oculus/data/people/organisations.yml' },
        { key: 'resources', file: '.oculus/data/research/resources.yml' }
    ];

    function registriesHub(): string {
        const hub = scratch();
        write(
            hub,
            '.oculus/data/people/people.yml',
            [
                'schema:',
                '  - { field: key, type: text, primary_key: true }',
                '  - { field: affiliations, type: tags }',
                'entries:',
                '  - { key: wim, name: Wim, affiliations: [kuleuven, ut] }',
                '  - { key: an, name: An }',
                ''
            ].join('\n')
        );
        write(
            hub,
            '.oculus/data/people/organisations.yml',
            [
                'schema:',
                '  - { field: key, type: text, primary_key: true }',
                'entries:',
                '  - { key: ut, name: Twente, kind: university }',
                ''
            ].join('\n')
        );
        write(
            hub,
            '.oculus/data/research/resources.yml',
            [
                'schema:',
                '  - { field: key, type: text, primary_key: true }',
                '  - { field: links, type: tags }',
                'entries:',
                '  - key: utwente',
                '    kind: cluster',
                '    links: [docs/HPC.md]',
                '    retrieval: { host: hpc, ports: [22, 80] }',
                ''
            ].join('\n')
        );
        return hub;
    }

    it('reads each into entries keyed by their key, with every field as the file holds it', () => {
        const { collections } = readCollections(registriesHub(), REGISTRIES, CATALOG);
        expect(Object.keys(collections)).toEqual(['people', 'organisations', 'resources']);
        expect(collections.people.entries.map((entry) => entry.key)).toEqual(['wim', 'an']);
        expect(collections.people.entries[0]).toMatchObject({
            name: 'Wim',
            affiliations: ['kuleuven', 'ut']
        });
        expect(collections.organisations.entries.map((entry) => entry.kind)).toEqual([
            'university'
        ]);
        expect(collections.resources.entries[0]).toMatchObject({
            key: 'utwente',
            kind: 'cluster',
            links: ['docs/HPC.md'],
            retrieval: { host: 'hpc', ports: [22, 80] }
        });
    });

    it('reads an `entries:` that holds only comments as a collection with no entries', () => {
        const hub = scratch();
        write(
            hub,
            '.oculus/data/people/people.yml',
            'schema:\n  - { field: key, type: text, primary_key: true }\nentries:\n  # none yet\n'
        );
        const { collections, findings } = readCollections(hub, [REGISTRIES[0]], CATALOG);
        expect(collections.people.entries).toEqual([]);
        expect(findings).toEqual([]);
    });
});

describe('the fields of a collections entry', () => {
    /** The settings file the findings of a list are made on. */
    const LIST_FILE = '/hub/.oculus/config.yml';

    /** The findings of a list, by the key each names and its sentence. */
    function findingsOf(list: unknown[], words = WORDS): { key: string; message: string }[] {
        return collectionListFindings(list, words, LIST_FILE, CATALOG).map((one) => {
            expect(one.file).toBe(LIST_FILE);
            return { key: one.key, message: one.message };
        });
    }

    it('reads every field an entry sets, with no finding', () => {
        const list = [
            {
                key: 'jobs',
                file: 'jobs.yml',
                band_positions: true,
                awaiting: true,
                open_badge: true,
                lead_applications: true,
                dissemination: true,
                dissemination_skip: { role: 'attend' },
                ticker: { category: 'position' },
                group: 'academic',
                order: 3,
                label: 'views.applications',
                glyph: 'views.applications_glyph',
                about: 'files.make_collection_line_applications'
            },
            { key: 'grants', file: 'grants.yml', registry: 'funding' },
            {
                key: 'todo',
                file: 'todo.yml',
                tasks: true,
                ticker: { category: 'task', undated: true }
            }
        ];
        expect(findingsOf(list)).toEqual([]);
        expect(collectionFiles(list, WORDS)).toEqual(list);
    });

    it('carries the registry, the flags, the skip and the ticker onto the collection read', () => {
        const hub = scratch();
        write(hub, 'todo.yml', 'entries:\n  - { title: Renew the allocation }\n');
        const entries = collectionFiles(
            [
                {
                    key: 'todo',
                    file: 'todo.yml',
                    registry: 'funding',
                    tasks: true,
                    dissemination_skip: { role: 'attend' },
                    ticker: { category: 'task', undated: true }
                }
            ],
            WORDS
        );
        const { collections } = readCollections(hub, entries, CATALOG);
        expect(collections.todo).toMatchObject({
            registry: 'funding',
            tasks: true,
            dissemination_skip: { role: 'attend' },
            ticker: { category: 'task', undated: true },
            index: 0
        });
    });

    it('keeps an entry keyed by the id of a registry view and naming no registry, as a finding with no card list (case 4)', () => {
        const list = [{ key: 'venues', file: 'venues.yml' }];
        expect(findingsOf(list)).toEqual([
            {
                key: 'collections[0].key',
                message:
                    "the key venues is the id of one of oculus's own views; the collection gets no card-list view"
            }
        ]);
        const [entry] = collectionFiles(list, WORDS);
        expect(entry.registry).toBeUndefined();
        expect(hasCardList(entry)).toBe(false);
    });

    it('reads the first of two entries naming one registry as the registry, the second a plain collection (case 5)', () => {
        const list = [
            { key: 'outlets', file: 'outlets.yml', registry: 'venues' },
            { key: 'venues2', file: 'venues2.yml', registry: 'venues' }
        ];
        expect(findingsOf(list)).toEqual([
            {
                key: 'collections[1].registry',
                message:
                    'registry venues is already named by the entry outlets; that entry is the registry and this one a plain collection'
            }
        ]);
        expect(collectionFiles(list, WORDS).map((one) => one.registry)).toEqual([
            'venues',
            undefined
        ]);
    });

    it('reads an entry naming an unknown registry as a plain collection (case 6)', () => {
        const list = [{ key: 'outlets', file: 'outlets.yml', registry: 'venue' }];
        expect(findingsOf(list)).toEqual([
            {
                key: 'collections[0].registry',
                message: 'registry venue names no registry; the entry is a plain collection'
            }
        ]);
        expect(collectionFiles(list, WORDS)[0].registry).toBeUndefined();
    });

    it('reads the first of two entries flagged tasks as the task file (case 7)', () => {
        const list = [
            { key: 'tasks', file: 'tasks.yml', tasks: true },
            { key: 'todo', file: 'todo.yml', tasks: true }
        ];
        expect(findingsOf(list)).toEqual([
            {
                key: 'collections[1].tasks',
                message: 'tasks is already set on the entry tasks; that entry is the one read'
            }
        ]);
        expect(collectionFiles(list, WORDS).map((one) => one.tasks)).toEqual([true, undefined]);
    });

    it('leaves out a label naming no word of the catalog, as a finding (case 8)', () => {
        const list = [{ key: 'grants', file: 'grants.yml', label: 'views.nonesuch' }];
        expect(findingsOf(list)).toEqual([
            {
                key: 'collections[0].label',
                message: 'views.nonesuch names no word of the text catalog; the field is not read'
            }
        ]);
        expect(collectionFiles(list, WORDS)[0].label).toBeUndefined();
    });

    it('reads a ticker category a hub adds, and leaves out one naming no word, as a finding (case 10)', () => {
        const words = { ...WORDS, categories: [...WORDS.categories, 'report'] };
        const list = [
            { key: 'statements', file: 'statements.yml', ticker: { category: 'report' } },
            { key: 'notes', file: 'notes.yml', ticker: { category: 'nonesuch' } }
        ];
        expect(findingsOf(list, words)).toEqual([
            {
                key: 'collections[1].ticker.category',
                message:
                    'ticker category nonesuch names no word of ticker_categories; the entry gives no ticker lines'
            }
        ]);
        expect(collectionFiles(list, words).map((one) => one.ticker)).toEqual([
            { category: 'report' },
            undefined
        ]);
    });

    it('words a field of a ticker category naming no word, and its group is headed other (case 10)', () => {
        const config = {
            ...OWN,
            ticker_categories: {
                report: {
                    label: 'views.nonesuch',
                    glyph: 'views.statements_glyph',
                    noun: 'focus.command.word_task'
                }
            }
        };
        expect(focusFindings(config, () => VOCAB_FILE, CATALOG)).toEqual([
            {
                file: VOCAB_FILE,
                key: 'ticker_categories.report.label',
                message:
                    'the label of the ticker category report names no word of the text catalog; the field is not read'
            }
        ]);
        setCatalog(CATALOG);
        const [report] = tickerCategories(config);
        expect(report).toMatchObject({ key: 'report', noun: 'focus.command.word_task' });
        expect(report.label).toBeUndefined();
        // CommandCenter.svelte heads a category's group t(category.label ??
        // 'focus.command.kind_other').
        expect(t(report.label ?? 'focus.command.kind_other')).toBe(t('focus.command.kind_other'));
    });

    it('words a ticker that is no map of a category and an undated flag, and gives no lines', () => {
        const list = [
            { key: 'statements', file: 'statements.yml', ticker: 'report' },
            { key: 'notes', file: 'notes.yml', ticker: { category: 'task', undated: 3 } }
        ];
        expect(findingsOf(list)).toEqual([
            {
                key: 'collections[0].ticker',
                message:
                    'the ticker "report" of the entry statements is not a map of a category word and an undated flag; the entry gives no ticker lines'
            },
            {
                key: 'collections[1].ticker',
                message:
                    'the ticker {"category":"task","undated":3} of the entry notes is not a map of a category word and an undated flag; the entry gives no ticker lines'
            }
        ]);
        expect(collectionFiles(list, WORDS).map((one) => one.ticker)).toEqual([
            undefined,
            undefined
        ]);
    });

    it('words a dissemination_skip that is no map of fields to values, and skips nothing', () => {
        const list = [
            {
                key: 'events',
                file: 'events.yml',
                dissemination: true,
                dissemination_skip: ['attend']
            }
        ];
        expect(findingsOf(list)).toEqual([
            {
                key: 'collections[0].dissemination_skip',
                message:
                    'the dissemination_skip ["attend"] of the entry events is not a map of fields to a value or a list of values; Disseminated in leaves none of its entries out'
            }
        ]);
        expect(collectionFiles(list, WORDS)[0].dissemination_skip).toBeUndefined();
    });

    it('leaves out a group naming no rail page and no nav_groups key, as a finding', () => {
        const list = [{ key: 'grants', file: 'grants.yml', group: 'nonesuch', order: 2 }];
        expect(findingsOf(list)).toEqual([
            {
                key: 'collections[0].group',
                message:
                    'group nonesuch names no rail page and no nav_groups key; the view is placed as one whose entry names no group'
            }
        ]);
        expect(collectionFiles(list, WORDS)[0]).toEqual({
            key: 'grants',
            file: 'grants.yml',
            order: 2
        });
    });

    it.each([
        ['glyph', 'views.nonesuch_glyph'],
        ['about', 'files.nonesuch_line']
    ])('leaves out the %s field naming no word of the catalog, as a finding', (field, word) => {
        const list = [{ key: 'grants', file: 'grants.yml', [field]: word }];
        expect(findingsOf(list)).toEqual([
            {
                key: `collections[0].${field}`,
                message: `${word} names no word of the text catalog; the field is not read`
            }
        ]);
        expect(collectionFiles(list, WORDS)[0]).toEqual({ key: 'grants', file: 'grants.yml' });
    });

    it('reads the first of two entries flagged lead_applications as the one a lead writes into', () => {
        const list = [
            { key: 'jobs', file: 'jobs.yml', lead_applications: true },
            { key: 'applications', file: 'applications.yml', lead_applications: true }
        ];
        expect(findingsOf(list)).toEqual([
            {
                key: 'collections[1].lead_applications',
                message:
                    'lead_applications is already set on the entry jobs; that entry is the one read'
            }
        ]);
        expect(collectionFiles(list, WORDS).map((one) => one.lead_applications)).toEqual([
            true,
            undefined
        ]);
    });
});
