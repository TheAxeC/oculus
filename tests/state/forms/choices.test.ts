// Layer 2, client-state tests. The choices a reference field offers (`choicesFor`), over hubs
// planted in a scratch directory and built as the server builds them: the entries of the collection
// its `foreign_key:` names, each stored by that collection's primary key and labelled by its first
// filled field by `display:` rank; the words of a vocabulary list; the projects for `projects`,
// never the entries of a collection keyed `projects`; and nothing for a key that names no
// collection, an empty list or a collection whose file has no primary key (G132).

import { describe, expect } from 'vitest';
import { portfolioConfigFrom, readOtherHub } from '../../../src/lib/data/index.ts';
import { HUB_FILE } from '../../../src/lib/data/helpers/hub-names.ts';
import type { Snapshot } from '../../../src/lib/data/model/index.ts';
import { createChecker } from '../../../src/lib/data/snapshot/schema/check.ts';
import { engineDir, loadConfig } from '../../../src/lib/data/sources/config.ts';
import { buildHubs } from '../../../src/lib/server/root/watch/build.ts';
import { choicesFor, type Choice, type FormField } from '../../../src/lib/state/forms/schema.ts';
import { it, plantScratch } from '../../fixtures/scratch.ts';

/** The venues file every venue row reads: one venue with a `short`, one without. */
function venues(short: number, name: number): string {
    return [
        'schema:',
        '  - { field: id, type: text, primary_key: true }',
        `  - { field: short, type: text, display: ${short} }`,
        `  - { field: name, type: text, display: ${name} }`,
        'entries:',
        '  - { id: jbi, short: JBI, name: Journal of Biomedical Informatics }',
        '  - { id: jmlr, name: Journal of Machine Learning Research }',
        ''
    ].join('\n');
}

/** The events file: an event keyed `talk`, shown by its title. */
const EVENTS = [
    'schema:',
    '  - { field: key, type: text, primary_key: true }',
    '  - { field: title, type: text, display: 1 }',
    'entries:',
    '  - { key: talk, title: A talk at the lab }',
    ''
].join('\n');

/** A notes file whose schema flags no primary key. */
const NOTES = [
    'schema:',
    '  - { field: key, type: text }',
    '  - { field: title, type: text, display: 1 }',
    'entries:',
    '  - { key: one, title: A note }',
    ''
].join('\n');

/** A people file named by `file`, holding one person. */
function people(key: string, name: string): string {
    return [
        'schema:',
        '  - { field: key, type: text, primary_key: true }',
        '  - { field: name, type: text, display: 1 }',
        'entries:',
        `  - { key: ${key}, name: ${name} }`,
        ''
    ].join('\n');
}

/** The settings file of a hub whose `collections:` list holds the given rows. */
function settings(rows: string[]): string {
    return `collections:\n${rows.map((row) => `  - ${row}`).join('\n')}\n`;
}

/** A built workspace: its snapshot, the primary hub's merged config, and the primary's name. */
type Built = { snapshot: Snapshot; config: Record<string, unknown>; root: string };

/**
 * The workspace of the primary hub `hub`, planted from `files`, and of the second hub `lab`,
 * planted from `labFiles` when it is given, built as the server builds a workspace.
 */
function built(files: Record<string, string>, labFiles?: Record<string, string>): Built {
    const hub = plantScratch('oculus-choices-', files);
    const loaded = loadConfig(engineDir(), { hub });
    const portfolio = portfolioConfigFrom(loaded.config, loaded.from);
    const others =
        labFiles === undefined
            ? []
            : (() => {
                  const lab = plantScratch('oculus-choices-lab-', labFiles);
                  return [
                      readOtherHub({ key: 'lab', dir: lab }, loadConfig(engineDir(), { hub: lab }))
                  ];
              })();
    const primary = { key: 'hub', dir: hub, portfolio, workspace: null };
    const order = ['hub', ...others.map((one) => one.key)];
    const read = { primary, others, config: portfolio, order };
    const { snapshot } = buildHubs(read, 0, createChecker(), null);
    return { snapshot, config: loaded.config, root: 'hub' };
}

/** A select field of a hub record whose choices come from `foreignKey`. */
function field(foreignKey: string | string[]): FormField {
    return { field: 'ref', label: 'Ref', type: 'select', section: '', foreign_key: foreignKey };
}

/** The choices `foreignKey` offers to a record of the primary hub of `at`. */
function offered(at: Built, foreignKey: string | string[]): Choice[] {
    return choicesFor(field(foreignKey), at.snapshot, at.config, at.root);
}

const VENUES_ROW = '{ key: venues, file: lists/venues.yml, registry: venues }';
const EVENTS_ROW = '{ key: events, file: lists/events.yml }';
const NOTES_ROW = '{ key: notes, file: lists/notes.yml }';

/** The venue choices of a schema ranking `short` 1 and `name` 2. */
const BY_SHORT: Choice[] = [
    { id: 'jbi', label: 'JBI' },
    { id: 'jmlr', label: 'Journal of Machine Learning Research' }
];

describe('offers the entries of the collection a reference names', () => {
    it('shows a venue by its short, one with no short by its name, and stores its id (G132)', () => {
        const at = built({
            [HUB_FILE]: settings([VENUES_ROW]),
            'lists/venues.yml': venues(1, 2)
        });
        expect(offered(at, 'venues')).toEqual(BY_SHORT);
    });

    it('shows a venue by its name when the venues schema ranks name 1 (G132)', () => {
        const at = built({
            [HUB_FILE]: settings([VENUES_ROW]),
            'lists/venues.yml': venues(2, 1)
        });
        expect(offered(at, 'venues')).toEqual([
            { id: 'jbi', label: 'Journal of Biomedical Informatics' },
            { id: 'jmlr', label: 'Journal of Machine Learning Research' }
        ]);
    });

    it('offers the same venues when the hub keys the venues collection journals (G132)', () => {
        const at = built({
            [HUB_FILE]: settings(['{ key: journals, file: lists/venues.yml, registry: venues }']),
            'lists/venues.yml': venues(1, 2)
        });
        expect(offered(at, 'journals')).toEqual(BY_SHORT);
    });

    it('offers the events by their display and stores the key (G132)', () => {
        const at = built({
            [HUB_FILE]: settings([EVENTS_ROW]),
            'lists/events.yml': EVENTS
        });
        expect(offered(at, 'events')).toEqual([{ id: 'talk', label: 'A talk at the lab' }]);
    });

    it('shows each entry by its primary key when the target schema ranks no field (G132)', () => {
        const unranked = EVENTS.replace(
            '{ field: title, type: text, display: 1 }',
            '{ field: title, type: text }'
        );
        const at = built({ [HUB_FILE]: settings([EVENTS_ROW]), 'lists/events.yml': unranked });
        expect(offered(at, 'events')).toEqual([{ id: 'talk', label: 'talk' }]);
    });

    it("offers a vocabulary list's words by their labels and stores the word's key (G132)", () => {
        const at = built({ [HUB_FILE]: settings([EVENTS_ROW]), 'lists/events.yml': EVENTS });
        expect(offered(at, 'vocab.stages')[0]).toEqual({
            id: 'nascent',
            label: 'nascent (concept)'
        });
    });

    it.each<[string, string | string[]]>([
        ['a key that names no collection', 'nowhere'],
        ['an empty list', []],
        ['a collection whose file has no primary key', 'notes']
    ])('offers nothing for %s (G132)', (_name, foreignKey) => {
        const at = built({
            [HUB_FILE]: settings([EVENTS_ROW, NOTES_ROW]),
            'lists/events.yml': EVENTS,
            'lists/notes.yml': NOTES
        });
        expect(offered(at, foreignKey)).toEqual([]);
    });

    it('offers the projects for a key naming projects, and nothing of a collection keyed projects (G132)', () => {
        const at = built({
            [HUB_FILE]: settings([EVENTS_ROW, '{ key: projects, file: lists/other.yml }']),
            'lists/events.yml': EVENTS,
            'lists/other.yml': EVENTS.replace('talk', 'not-a-project'),
            'projects/active/alpha/project.yml':
                'id: alpha\ntier: research\nstage: exploring\ntitle: Alpha\n'
        });
        expect(offered(at, 'projects')).toEqual([{ id: 'alpha', label: 'Alpha' }]);
    });

    it('offers the people of two hubs that key the people registry people and persons, each by its own key (G132)', () => {
        const at = built(
            {
                [HUB_FILE]: settings(['{ key: people, file: lists/people.yml, registry: people }']),
                'lists/people.yml': people('ada', 'Ada Lovelace')
            },
            {
                [HUB_FILE]: settings([
                    '{ key: persons, file: lists/persons.yml, registry: people }'
                ]),
                'lists/persons.yml': people('grace', 'Grace Hopper')
            }
        );
        expect(offered(at, 'people')).toEqual([
            { id: 'ada', label: 'Ada Lovelace' },
            { id: 'grace', label: 'Grace Hopper', hub: 'lab' }
        ]);
    });
});
