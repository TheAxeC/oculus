// Layer 1, data tests. The reference index of the snapshot build (data/snapshot/references/): the
// places in the hub's files that name a key and the places that define one, found by the schemas
// the files are checked by and by nothing else. A hub planted in a scratch directory, with an
// engine folder holding `behavior.yml` and `catalogs/vocab.yml`, is built through
// buildPortfolioWithSchemas, and the index is asked what stands at a position: the key, the
// definitions it names and every place that names the same ones.
//
// One table, one row per kind of reference and of definition. A row names a file and a position
// (a line and a character, counted from zero, of the first letter of the key inside any quotes) and
// gives what the position is, the definition each target is, and every place that names the key.
// The tests after the table check what gives none: a value that names no key, an empty value and
// an entry with no identity; and the files read in place: every document of a file of several, and
// the portfolio deck of `portfolio_deck`, absent when it is null.
//
// What this does NOT cover: the answers of the language server over the channel (the relay tests
// and the cases of the step run those) and the rename (rename.test.ts).

import { describe, expect } from 'vitest';
import { referencesTo } from '../../../src/lib/data/snapshot/references/lookup.ts';
import type { FieldNode } from '../../../src/lib/data/snapshot/references/model.ts';
import { scanText } from '../../../src/lib/data/snapshot/references/scan.ts';
import { it } from '../../fixtures/scratch.ts';
import { ENGINE_FILES, HUB_FILES, plantHub, type PlantOptions } from './reference-hub.ts';

type Root = 'hub' | 'engine';

/** A place as the rows write it: the root, the path, the line and the character. */
type At = [Root, string, number, number];

type Row = {
    name: string;
    /** The file asked and the position in it. */
    at: At;
    /** The files of the planted hub or engine that differ from the standard ones. */
    hub?: Record<string, string>;
    engine?: Record<string, string>;
    /** Texts held open in tabs instead of the files', by path in the root asked or `root:path`. */
    open?: Record<string, string>;
    /** How the planted hub differs from the standard one besides its files. */
    options?: PlantOptions;
    /** What stands there: a reference or a definition, the key and the sources it names. */
    kind: 'reference' | 'definition';
    key: string;
    /** The definitions it names, as root:path:line. */
    targets: string[];
    /** Every place that names the same definitions, as root:path:line:character. */
    references: string[];
};

const ALPHA = HUB_FILES['projects/active/alpha/project.yml'];

/** vocab.yml as a tab holds it after the line of the `heart` domain was deleted. */
const VOCAB_WITHOUT_HEART = ENGINE_FILES['catalogs/vocab.yml']
    .split('\n')
    .filter((line) => !line.startsWith('  heart:'))
    .join('\n');

/** A joint-work file whose `target` takes the keys of the source the `kind` of its record picks. */
const PICKED = [
    'schema:',
    '  - { field: key, type: text, help: The slug. }',
    '  - { field: kind, type: select, options: [person, org], help: The kind. }',
    '  - { field: target, type: select, from: { field: kind, sources: { person: people, org: organisations } }, help: The target. }',
    'entries:',
    '  - { key: a, kind: person, target: amir }',
    '  - { key: b, kind: org, target: utwente }',
    ''
].join('\n');

const ROWS: Row[] = [
    {
        name: 'a manifest select, venue_id, plain and double-quoted',
        at: ['hub', 'projects/active/alpha/project.yml', 3, 10],
        kind: 'reference',
        key: 'jbhi',
        targets: ['hub:registries/venues.yml:4'],
        references: [
            'hub:projects/active/alpha/project.yml:3:10',
            'hub:projects/active/beta/project.yml:3:11'
        ]
    },
    {
        name: 'a manifest list, pillar',
        at: ['hub', 'projects/active/alpha/project.yml', 4, 17],
        kind: 'reference',
        key: 'federated',
        targets: ['hub:registries/pillars.yml:4'],
        references: ['hub:projects/active/alpha/project.yml:4:17']
    },
    {
        name: 'a project named by related, its definition the id line of its manifest',
        at: ['hub', 'projects/active/alpha/project.yml', 5, 10],
        kind: 'reference',
        key: 'beta',
        targets: ['hub:projects/active/beta/project.yml:0'],
        references: [
            'hub:feeds/literature-radar.yml:7:57',
            'hub:projects/active/alpha/present/present.yml:4:13',
            'hub:projects/active/alpha/project.yml:5:10',
            'hub:projects/active/alpha/project.yml:6:19'
        ]
    },
    {
        name: 'a waiting-on value that names a person',
        at: ['hub', 'projects/active/alpha/project.yml', 6, 13],
        kind: 'reference',
        key: 'amir',
        targets: ['hub:registries/people.yml:5'],
        references: [
            'hub:network/joint-work.yml:5:13',
            'hub:projects/active/alpha/project.yml:6:13',
            'hub:projects/active/alpha/project.yml:7:16'
        ]
    },
    {
        name: 'a collaborators value of a side project manifest that names a person',
        at: ['hub', 'side-projects/idea/project.yml', 2, 16],
        hub: {
            'side-projects/idea/project.yml':
                'title: An idea\nstatus: idea\ncollaborators: [amir]\n'
        },
        engine: {
            'sources.yml': [
                'scan:',
                '  - { dir: projects/manuscripts, type: manuscript, tier: projects }',
                '  - { dir: side-projects, type: side-project, tier: personal, optional: true }',
                ''
            ].join('\n')
        },
        kind: 'reference',
        key: 'amir',
        targets: ['hub:registries/people.yml:5'],
        references: [
            'hub:network/joint-work.yml:5:13',
            'hub:projects/active/alpha/project.yml:6:13',
            'hub:projects/active/alpha/project.yml:7:16',
            'hub:side-projects/idea/project.yml:2:16'
        ]
    },
    {
        name: 'a waiting-on value that names a project',
        at: ['hub', 'projects/active/alpha/project.yml', 6, 19],
        kind: 'reference',
        key: 'beta',
        targets: ['hub:projects/active/beta/project.yml:0'],
        references: [
            'hub:feeds/literature-radar.yml:7:57',
            'hub:projects/active/alpha/present/present.yml:4:13',
            'hub:projects/active/alpha/project.yml:5:10',
            'hub:projects/active/alpha/project.yml:6:19'
        ]
    },
    {
        name: 'a registry tags field, affiliations',
        at: ['hub', 'registries/people.yml', 7, 19],
        kind: 'reference',
        key: 'utwente',
        targets: ['hub:registries/organisations.yml:4'],
        references: ['hub:registries/people.yml:7:19']
    },
    {
        name: 'a double-quoted select, the person of a joint-work entry',
        at: ['hub', 'network/joint-work.yml', 5, 13],
        kind: 'reference',
        key: 'amir',
        targets: ['hub:registries/people.yml:5'],
        references: [
            'hub:network/joint-work.yml:5:13',
            'hub:projects/active/alpha/project.yml:6:13',
            'hub:projects/active/alpha/project.yml:7:16'
        ]
    },
    {
        name: 'the related field of a collection',
        at: ['hub', 'tasks/tasks.yml', 5, 14],
        kind: 'reference',
        key: 'alpha',
        targets: ['hub:projects/active/alpha/project.yml:0'],
        references: [
            'hub:feeds/literature-radar.yml:6:57',
            'hub:feeds/literature-radar.yml:7:72',
            'hub:projects/active/beta/project.yml:5:4',
            'hub:tasks/tasks.yml:5:14'
        ]
    },
    {
        name: 'the maps_to text field of the radar, which names a project',
        at: ['hub', 'feeds/literature-radar.yml', 7, 72],
        kind: 'reference',
        key: 'alpha',
        targets: ['hub:projects/active/alpha/project.yml:0'],
        references: [
            'hub:feeds/literature-radar.yml:6:57',
            'hub:feeds/literature-radar.yml:7:72',
            'hub:projects/active/beta/project.yml:5:4',
            'hub:tasks/tasks.yml:5:14'
        ]
    },
    {
        name: 'a field nested in a records field',
        at: ['hub', 'applications/applications.yml', 10, 15],
        kind: 'reference',
        key: 'bspc',
        targets: ['hub:registries/venues.yml:5'],
        references: ['hub:applications/applications.yml:10:15']
    },
    {
        name: 'a dataset, defined by the key under datasets:',
        at: ['hub', 'projects/active/alpha/project.yml', 8, 11],
        kind: 'reference',
        key: 'ds1',
        targets: ['hub:registries/data.yml:3'],
        references: ['hub:projects/active/alpha/project.yml:8:11']
    },
    {
        name: 'the domains of the options catalog, in behavior.yml',
        at: ['engine', 'behavior.yml', 0, 15],
        kind: 'reference',
        key: 'heart',
        targets: ['hub:registries/domains.yml:3'],
        references: ['engine:behavior.yml:0:15', 'engine:catalogs/vocab.yml:1:2']
    },
    {
        name: 'the clusters of the options catalog, the resources of kind cluster',
        at: ['engine', 'behavior.yml', 2, 12],
        kind: 'reference',
        key: 'hpc',
        targets: ['hub:registries/resources.yml:4'],
        references: ['engine:behavior.yml:2:12']
    },
    {
        name: 'a vocabulary value, defined as an item of its list in vocab.yml',
        at: ['hub', 'projects/active/alpha/project.yml', 1, 6],
        kind: 'reference',
        key: 'active',
        targets: ['engine:catalogs/vocab.yml:4'],
        references: [
            'hub:projects/active/alpha/project.yml:1:6',
            'hub:projects/active/beta/project.yml:1:6'
        ]
    },
    {
        name: 'a vocabulary value at its definition',
        at: ['engine', 'catalogs/vocab.yml', 4, 21],
        kind: 'definition',
        key: 'manuscript',
        targets: ['engine:catalogs/vocab.yml:4'],
        references: []
    },
    {
        name: 'a vocabulary key of a map in vocab.yml, listed by the options file that names its list',
        at: ['engine', 'catalogs/vocab.yml', 3, 34],
        kind: 'definition',
        key: 'manuscript',
        targets: ['engine:catalogs/vocab.yml:3'],
        references: ['engine:sources.yml:1:39']
    },
    {
        name: 'a key of the domains: map of vocab.yml, a reference to the domains registry',
        at: ['engine', 'catalogs/vocab.yml', 2, 2],
        kind: 'reference',
        key: 'brain',
        targets: ['hub:registries/domains.yml:4'],
        references: ['engine:catalogs/vocab.yml:2:2']
    },
    {
        name: "a deck group's slide, a project id",
        at: ['hub', 'projects/active/alpha/present/present.yml', 4, 13],
        kind: 'reference',
        key: 'beta',
        targets: ['hub:projects/active/beta/project.yml:0'],
        references: [
            'hub:feeds/literature-radar.yml:7:57',
            'hub:projects/active/alpha/present/present.yml:4:13',
            'hub:projects/active/alpha/project.yml:5:10',
            'hub:projects/active/alpha/project.yml:6:19'
        ]
    },
    {
        name: 'a key defined twice in its source, two definitions',
        at: ['hub', 'registries/venues.yml', 4, 10],
        hub: {
            'registries/venues.yml': [
                'schema:',
                '  - { field: id, type: text, required: true, help: The venue key. }',
                'entries:',
                '  - { id: jbhi }',
                '  - { id: jbhi }',
                '  - { id: other }',
                ''
            ].join('\n')
        },
        kind: 'definition',
        key: 'jbhi',
        targets: ['hub:registries/venues.yml:3', 'hub:registries/venues.yml:4'],
        references: [
            'hub:projects/active/alpha/project.yml:3:10',
            'hub:projects/active/beta/project.yml:3:11'
        ]
    },
    {
        name: 'an open text laid over its file, a key typed and not saved',
        at: ['hub', 'projects/active/alpha/project.yml', 3, 10],
        open: {
            'projects/active/alpha/project.yml': [
                'id: alpha',
                'type: active',
                'title: Alpha',
                'venue_id: bspc',
                ''
            ].join('\n')
        },
        kind: 'reference',
        key: 'bspc',
        targets: ['hub:registries/venues.yml:5'],
        references: [
            'hub:applications/applications.yml:10:15',
            'hub:projects/active/alpha/project.yml:3:10'
        ]
    },
    {
        name: 'a file with a byte order mark, CRLF line ends and an astral character before the key',
        at: ['hub', 'registries/people.yml', 8, 45],
        hub: {
            'registries/people.yml': [
                '\uFEFFschema:',
                '  - { field: key, type: text, required: true, help: The person key. }',
                '  - { field: name, type: text, required: true, help: The name. }',
                '  - { field: affiliations, type: tags, from: organisations, help: The organisations. }',
                'entries:',
                '  - key: amir',
                '    name: Amir',
                '    affiliations: [utwente]',
                '  - { key: ann, name: "\u{1F600}\u{1F600}", affiliations: [tue] }',
                ''
            ].join('\r\n')
        },
        kind: 'reference',
        key: 'tue',
        targets: ['hub:registries/organisations.yml:5'],
        references: ['hub:registries/people.yml:8:45']
    },
    {
        name: 'an anchored key used through an alias, one reference at the anchor',
        at: ['hub', 'projects/active/alpha/project.yml', 4, 12],
        hub: {
            'projects/active/alpha/project.yml': ALPHA.replace(
                'pillar: [tensor, federated]',
                'pillar: [&p tensor, *p, federated]'
            )
        },
        kind: 'reference',
        key: 'tensor',
        targets: ['hub:registries/pillars.yml:3'],
        references: ['hub:projects/active/alpha/project.yml:4:12']
    },
    {
        name: 'an open text under the hub root of the file the engine root serves from inside the hub',
        at: ['engine', 'behavior.yml', 0, 15],
        options: { engineInHub: true },
        open: { 'hub:tools/oculus/config/catalogs/vocab.yml': VOCAB_WITHOUT_HEART },
        kind: 'reference',
        key: 'heart',
        targets: ['hub:registries/domains.yml:3'],
        references: ['engine:behavior.yml:0:15']
    },
    {
        name: 'an open text under the hub root of a file the engine root serves from another folder',
        at: ['engine', 'behavior.yml', 0, 15],
        open: { 'hub:tools/oculus/config/catalogs/vocab.yml': VOCAB_WITHOUT_HEART },
        kind: 'reference',
        key: 'heart',
        targets: ['hub:registries/domains.yml:3'],
        references: ['engine:behavior.yml:0:15', 'engine:catalogs/vocab.yml:1:2']
    },
    {
        name: 'a from picked by another field of the record, the person source',
        at: ['hub', 'network/joint-work.yml', 5, 36],
        hub: { 'network/joint-work.yml': PICKED },
        kind: 'reference',
        key: 'amir',
        targets: ['hub:registries/people.yml:5'],
        references: [
            'hub:network/joint-work.yml:5:36',
            'hub:projects/active/alpha/project.yml:6:13',
            'hub:projects/active/alpha/project.yml:7:16'
        ]
    },
    {
        name: 'a from picked by another field of the record, the organisation source',
        at: ['hub', 'network/joint-work.yml', 6, 33],
        hub: { 'network/joint-work.yml': PICKED },
        kind: 'reference',
        key: 'utwente',
        targets: ['hub:registries/organisations.yml:4'],
        references: ['hub:network/joint-work.yml:6:33', 'hub:registries/people.yml:7:19']
    },
    {
        name: 'the portfolio deck, read from the folder portfolio_deck names',
        at: ['hub', 'decks/present.yml', 4, 13],
        options: { deck: 'decks' },
        hub: {
            'decks/present.yml':
                'deck:\n  title: Portfolio\ngroups:\n  main:\n    slides: [alpha]\n'
        },
        kind: 'reference',
        key: 'alpha',
        targets: ['hub:projects/active/alpha/project.yml:0'],
        references: [
            'hub:decks/present.yml:4:13',
            'hub:feeds/literature-radar.yml:6:57',
            'hub:feeds/literature-radar.yml:7:72',
            'hub:projects/active/beta/project.yml:5:4',
            'hub:tasks/tasks.yml:5:14'
        ]
    }
];

describe('the reference index', () => {
    it.each(ROWS)('finds $name', (row) => {
        const planted = plantHub(row.hub, row.engine, row.options);
        const [root, path, line, character] = row.at;
        const { hit, graph } = planted.hit(root, path, { line, character }, row.open);
        expect(hit, 'a hit stands at the position').not.toBeNull();
        if (hit === null) return;
        expect([hit.kind, hit.key]).toEqual([row.kind, row.key]);
        const where = (scan: { file: { root: string; path: string } }) =>
            `${scan.file.root}:${scan.file.path}`;
        expect(
            hit.targets.map((one) => `${where(one.scan)}:${one.definition.span.start.line}`)
        ).toEqual(row.targets);
        const named = referencesTo(graph, hit).map(
            (one) =>
                `${where(one.scan)}:${String(one.reference.span.start.line)}:${String(one.reference.span.start.character)}`
        );
        expect(named.sort()).toEqual(row.references);
    });

    it('gives no hit for a value that names no key, and no reference for an empty value', () => {
        const planted = plantHub();
        expect(
            planted.hit('hub', 'feeds/literature-radar.yml', { line: 6, character: 73 }).hit
        ).toBeNull();
        expect(planted.hit('hub', 'tasks/tasks.yml', { line: 5, character: 21 }).hit).toBeNull();
        const tasks = planted.file('hub', 'tasks/tasks.yml');
        // The empty list and the bare key of the other two entries name nothing.
        expect(tasks.references.map((one) => one.value)).toEqual([
            'alpha',
            'nothing-like-a-project'
        ]);
    });

    it('finds the references of every document of a file of several', () => {
        const spec: FieldNode = {
            kind: 'record',
            fields: { venue_id: { kind: 'leaf', sources: ['venues'] } }
        };
        const text = 'venue_id: jbhi\n---\nvenue_id: bspc\n';
        const scan = scanText({ root: 'hub', path: 'both.yml' }, text, {
            spec,
            defines: { kind: 'none' }
        });
        expect(scan.references.map((one) => [one.value, one.span.start.line])).toEqual([
            ['jbhi', 0],
            ['bspc', 2]
        ]);
    });

    it('reads no portfolio deck when portfolio_deck is null, and the decks of the projects all the same', () => {
        const planted = plantHub(
            { 'deck/present.yml': 'groups:\n  main:\n    slides: [alpha]\n' },
            {},
            { deck: null }
        );
        const decks = planted.index.files
            .filter((one) => one.file.path.endsWith('present.yml'))
            .map((one) => one.file.path);
        expect(decks).toEqual(['projects/active/alpha/present/present.yml']);
    });

    it('takes a double-quoted empty value for no key', () => {
        const planted = plantHub({
            'projects/active/alpha/project.yml': ALPHA.replace('venue_id: jbhi', 'venue_id: ""')
        });
        const alpha = planted.file('hub', 'projects/active/alpha/project.yml');
        expect(alpha.references.map((one) => one.value)).not.toContain('');
        expect(
            planted.hit('hub', 'projects/active/alpha/project.yml', { line: 3, character: 11 }).hit
        ).toBeNull();
    });

    it('defines nothing for a funding entry that has no key', () => {
        const funding = plantHub().file('hub', 'funding/funding.yml');
        expect(funding.definitions.map((one) => one.value)).toEqual(['grant-a']);
    });

    it('gives no hit in a text that does not read as YAML, and marks the file', () => {
        const planted = plantHub();
        const text = 'id: alpha\nvenue_id: [jbhi\n';
        const { hit, graph } = planted.hit(
            'hub',
            'projects/active/alpha/project.yml',
            { line: 1, character: 12 },
            { 'projects/active/alpha/project.yml': text }
        );
        expect(hit).toBeNull();
        expect(graph.index.files.filter((one) => one.unparsed).map((one) => one.file.path)).toEqual(
            ['projects/active/alpha/project.yml']
        );
    });
});
