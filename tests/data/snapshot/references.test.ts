// Layer 4, data tests. The reference index of the snapshot build (data/snapshot/references/): the
// places in the hub's files that name a key and the places that define one, found by the schemas
// the files are checked by and by nothing else. A hub planted in a scratch directory, with an
// engine folder holding `defaults/behavior.yml` and `catalogs/vocab.yml`, is built through
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
// The last table builds through the portfolio watcher (server/root/watch/portfolio.ts), a server
// module, which makes this file layer 4 as the other watcher tests are. The watcher names the open
// workspace file for the index: the file is scanned for its `settings:` when it lies in a hub
// folder of the workspace, under that folder's name, and says it names the primary hub's keys
// (`of`) when that folder is another; an unsaved workspace and a file whose hub is no folder of the
// workspace give no scan. Its hubs are empty hub folders and each workspace a state folder that
// opens a planted workspace file, as the server opens one; a build takes about a second, so the
// table is tagged slow.
//
// What this does NOT cover: the answers of the language server over the channel (the relay tests
// and the cases of the step run those) and the rename (rename.test.ts).

import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect } from 'vitest';
import { referencesTo } from '../../../src/lib/data/snapshot/references/lookup.ts';
import type { FieldNode, ReferenceIndex } from '../../../src/lib/data/snapshot/references/model.ts';
import { scanText } from '../../../src/lib/data/snapshot/references/scan.ts';
import type { Workspace } from '../../../src/lib/server/files/workspace/follow.ts';
import { writeState } from '../../../src/lib/server/files/workspace/state.ts';
import { it, scratchDir } from '../../fixtures/scratch.ts';
import {
    plantHub as plantHubFolder,
    workspaceOf,
    workspaceWith
} from '../../fixtures/hubs/workspace.ts';
import { watchedOnce } from '../hubs/hubs-fixture.ts';
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

/** behavior.yml as a tab holds it with a heading line typed above its keys. */
const BEHAVIOR_WITH_HEADING = `# The cluster.\n${ENGINE_FILES['defaults/behavior.yml']}`;

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
        targets: ['hub:.oculus/data/research/venues.yml:4'],
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
        targets: ['hub:.oculus/data/pillars/pillars.yml:4'],
        references: ['hub:projects/active/alpha/project.yml:4:17']
    },
    {
        name: 'a project named by related, its definition the id line of its manifest',
        at: ['hub', 'projects/active/alpha/project.yml', 5, 10],
        kind: 'reference',
        key: 'beta',
        targets: ['hub:projects/active/beta/project.yml:0'],
        references: [
            'hub:.oculus/data/literature/radar.yml:7:57',
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
        targets: ['hub:.oculus/data/people/people.yml:5'],
        references: [
            'hub:.oculus/data/academic/joint-work.yml:5:13',
            'hub:projects/active/alpha/project.yml:6:13',
            'hub:projects/active/alpha/project.yml:7:16'
        ]
    },
    {
        name: 'a collaborators value of a personal project manifest that names a person',
        at: ['hub', 'side-projects/idea/project.yml', 3, 16],
        hub: {
            'side-projects/idea/project.yml':
                'title: An idea\ntier: personal\ntype: idea\ncollaborators: [amir]\n'
        },
        engine: {
            'defaults/sources.yml': [
                'scan:',
                '  - { dir: projects/manuscripts }',
                '  - { dir: side-projects, optional: true }',
                ''
            ].join('\n')
        },
        kind: 'reference',
        key: 'amir',
        targets: ['hub:.oculus/data/people/people.yml:5'],
        references: [
            'hub:.oculus/data/academic/joint-work.yml:5:13',
            'hub:projects/active/alpha/project.yml:6:13',
            'hub:projects/active/alpha/project.yml:7:16',
            'hub:side-projects/idea/project.yml:3:16'
        ]
    },
    {
        name: 'a waiting-on value that names a project',
        at: ['hub', 'projects/active/alpha/project.yml', 6, 19],
        kind: 'reference',
        key: 'beta',
        targets: ['hub:projects/active/beta/project.yml:0'],
        references: [
            'hub:.oculus/data/literature/radar.yml:7:57',
            'hub:projects/active/alpha/present/present.yml:4:13',
            'hub:projects/active/alpha/project.yml:5:10',
            'hub:projects/active/alpha/project.yml:6:19'
        ]
    },
    {
        name: 'a registry tags field, affiliations',
        at: ['hub', '.oculus/data/people/people.yml', 7, 19],
        kind: 'reference',
        key: 'utwente',
        targets: ['hub:.oculus/data/people/organisations.yml:4'],
        references: ['hub:.oculus/data/people/people.yml:7:19']
    },
    {
        name: 'a double-quoted select, the person of a joint-work entry',
        at: ['hub', '.oculus/data/academic/joint-work.yml', 5, 13],
        kind: 'reference',
        key: 'amir',
        targets: ['hub:.oculus/data/people/people.yml:5'],
        references: [
            'hub:.oculus/data/academic/joint-work.yml:5:13',
            'hub:projects/active/alpha/project.yml:6:13',
            'hub:projects/active/alpha/project.yml:7:16'
        ]
    },
    {
        name: 'the related field of a collection',
        at: ['hub', '.oculus/data/academic/tasks.yml', 5, 14],
        kind: 'reference',
        key: 'alpha',
        targets: ['hub:projects/active/alpha/project.yml:0'],
        references: [
            'hub:.oculus/data/academic/tasks.yml:5:14',
            'hub:.oculus/data/literature/radar.yml:6:57',
            'hub:.oculus/data/literature/radar.yml:7:72',
            'hub:projects/active/beta/project.yml:5:4'
        ]
    },
    {
        name: 'the maps_to text field of the radar, which names a project',
        at: ['hub', '.oculus/data/literature/radar.yml', 7, 72],
        kind: 'reference',
        key: 'alpha',
        targets: ['hub:projects/active/alpha/project.yml:0'],
        references: [
            'hub:.oculus/data/academic/tasks.yml:5:14',
            'hub:.oculus/data/literature/radar.yml:6:57',
            'hub:.oculus/data/literature/radar.yml:7:72',
            'hub:projects/active/beta/project.yml:5:4'
        ]
    },
    {
        name: 'a field nested in a records field',
        at: ['hub', '.oculus/data/academic/applications.yml', 10, 15],
        kind: 'reference',
        key: 'bspc',
        targets: ['hub:.oculus/data/research/venues.yml:5'],
        references: ['hub:.oculus/data/academic/applications.yml:10:15']
    },
    {
        name: 'a dataset, defined by the key under datasets:',
        at: ['hub', 'projects/active/alpha/project.yml', 8, 11],
        kind: 'reference',
        key: 'ds1',
        targets: ['hub:.oculus/data/research/data.yml:4'],
        references: ['hub:projects/active/alpha/project.yml:8:11']
    },
    {
        name: 'a theme word of a dataset, defined by its option row in the schema of its registry',
        at: ['hub', '.oculus/data/research/data.yml', 5, 13],
        kind: 'reference',
        key: 'eeg',
        targets: ['hub:.oculus/data/research/data.yml:2'],
        references: ['hub:.oculus/data/research/data.yml:5:13']
    },
    {
        name: 'the clusters of the options catalog, the resources of kind cluster',
        at: ['engine', 'defaults/behavior.yml', 2, 12],
        kind: 'reference',
        key: 'hpc',
        targets: ['hub:.oculus/data/research/resources.yml:4'],
        references: ['engine:defaults/behavior.yml:2:12']
    },
    {
        name: 'a vocabulary value, defined as a key of its map in vocab.yml',
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
        at: ['engine', 'catalogs/vocab.yml', 5, 2],
        kind: 'definition',
        key: 'manuscript',
        targets: ['engine:catalogs/vocab.yml:5'],
        references: []
    },
    {
        name: 'a vocabulary key of a map in vocab.yml, listed by the options file that names its list',
        at: ['engine', 'catalogs/vocab.yml', 5, 4],
        engine: {
            'defaults/layout.yml': [
                'boards:',
                '  projects:',
                '    groups:',
                '      - { label: in progress, keys: [manuscript], color: "#16a34a" }',
                ''
            ].join('\n')
        },
        kind: 'definition',
        key: 'manuscript',
        targets: ['engine:catalogs/vocab.yml:5'],
        references: ['engine:defaults/layout.yml:3:37']
    },
    {
        name: "a deck group's slide, a project id",
        at: ['hub', 'projects/active/alpha/present/present.yml', 4, 13],
        kind: 'reference',
        key: 'beta',
        targets: ['hub:projects/active/beta/project.yml:0'],
        references: [
            'hub:.oculus/data/literature/radar.yml:7:57',
            'hub:projects/active/alpha/present/present.yml:4:13',
            'hub:projects/active/alpha/project.yml:5:10',
            'hub:projects/active/alpha/project.yml:6:19'
        ]
    },
    {
        name: 'a key defined twice in its source, two definitions',
        at: ['hub', '.oculus/data/research/venues.yml', 4, 10],
        hub: {
            '.oculus/data/research/venues.yml': [
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
        targets: [
            'hub:.oculus/data/research/venues.yml:3',
            'hub:.oculus/data/research/venues.yml:4'
        ],
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
        targets: ['hub:.oculus/data/research/venues.yml:5'],
        references: [
            'hub:.oculus/data/academic/applications.yml:10:15',
            'hub:projects/active/alpha/project.yml:3:10'
        ]
    },
    {
        name: 'a file with a byte order mark, CRLF line ends and an astral character before the key',
        at: ['hub', '.oculus/data/people/people.yml', 8, 45],
        hub: {
            '.oculus/data/people/people.yml': [
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
        targets: ['hub:.oculus/data/people/organisations.yml:5'],
        references: ['hub:.oculus/data/people/people.yml:8:45']
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
        targets: ['hub:.oculus/data/pillars/pillars.yml:3'],
        references: ['hub:projects/active/alpha/project.yml:4:12']
    },
    {
        name: 'an open text under the hub root of a config file that lies inside the hub folder',
        at: ['hub', 'tools/oculus/config/defaults/behavior.yml', 3, 12],
        options: { engineInHub: true },
        open: { 'hub:tools/oculus/config/defaults/behavior.yml': BEHAVIOR_WITH_HEADING },
        kind: 'reference',
        key: 'hpc',
        targets: ['hub:.oculus/data/research/resources.yml:4'],
        references: ['hub:tools/oculus/config/defaults/behavior.yml:3:12']
    },
    {
        name: 'an open text under the hub root of a config file that another workspace folder holds',
        at: ['engine', 'defaults/behavior.yml', 2, 12],
        open: { 'hub:tools/oculus/config/defaults/behavior.yml': BEHAVIOR_WITH_HEADING },
        kind: 'reference',
        key: 'hpc',
        targets: ['hub:.oculus/data/research/resources.yml:4'],
        references: ['engine:defaults/behavior.yml:2:12']
    },
    {
        name: 'a from picked by another field of the record, the person source',
        at: ['hub', '.oculus/data/academic/joint-work.yml', 5, 36],
        hub: { '.oculus/data/academic/joint-work.yml': PICKED },
        kind: 'reference',
        key: 'amir',
        targets: ['hub:.oculus/data/people/people.yml:5'],
        references: [
            'hub:.oculus/data/academic/joint-work.yml:5:36',
            'hub:projects/active/alpha/project.yml:6:13',
            'hub:projects/active/alpha/project.yml:7:16'
        ]
    },
    {
        name: 'a from picked by another field of the record, the organisation source',
        at: ['hub', '.oculus/data/academic/joint-work.yml', 6, 33],
        hub: { '.oculus/data/academic/joint-work.yml': PICKED },
        kind: 'reference',
        key: 'utwente',
        targets: ['hub:.oculus/data/people/organisations.yml:4'],
        references: [
            'hub:.oculus/data/academic/joint-work.yml:6:33',
            'hub:.oculus/data/people/people.yml:7:19'
        ]
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
            'hub:.oculus/data/academic/tasks.yml:5:14',
            'hub:.oculus/data/literature/radar.yml:6:57',
            'hub:.oculus/data/literature/radar.yml:7:72',
            'hub:decks/present.yml:4:13',
            'hub:projects/active/beta/project.yml:5:4'
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
            planted.hit('hub', '.oculus/data/literature/radar.yml', { line: 6, character: 73 }).hit
        ).toBeNull();
        expect(
            planted.hit('hub', '.oculus/data/academic/tasks.yml', { line: 5, character: 21 }).hit
        ).toBeNull();
        const tasks = planted.file('hub', '.oculus/data/academic/tasks.yml');
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
        const funding = plantHub().file('hub', '.oculus/data/academic/funding.yml');
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

/** Where the open workspace file lies, or that the workspace is unsaved. */
type Where = 'unsaved' | 'primary' | 'other folder' | 'no folder';

/** The workspace file's place under its hub. */
const WORKSPACE = '.oculus/workspaces/team.yml';

/** The workspace of a row: the hub folders `hub` (the primary) and `lab`, its file where it says. */
function workspaceAt(where: Where): Workspace {
    const base = scratchDir('oculus-workspace-index-');
    const hub = plantHubFolder(join(base, 'hub'));
    const lab = plantHubFolder(join(base, 'lab'));
    const folders = [
        { name: 'hub', dir: hub },
        { name: 'lab', dir: lab }
    ];
    if (where === 'unsaved') return workspaceWith(folders, 'hub');
    const holder =
        where === 'primary'
            ? hub
            : where === 'other folder'
              ? lab
              : plantHubFolder(join(base, 'away'));
    mkdirSync(join(holder, '.oculus', 'workspaces'), { recursive: true });
    const file = join(holder, WORKSPACE);
    const listed = folders.map((one) => `  - { name: ${one.name}, path: ${one.dir} }`);
    writeFileSync(
        file,
        ['folders:', ...listed, 'primary: hub', 'settings:', '  self: owner', ''].join('\n')
    );
    const state = scratchDir('oculus-workspace-state-');
    writeState(state, { open: file, recent: [file], unsaved: { folders: [] } });
    return workspaceOf(state);
}

/** The reference index of the watcher's first build over a workspace. */
function watchedIndex(workspace: Workspace): ReferenceIndex {
    let index: ReferenceIndex | undefined;
    watchedOnce(workspace, {
        schemas: (_set, references) => {
            index = references;
        }
    });
    if (index === undefined) throw new Error('the watcher built no index');
    return index;
}

describe('the open workspace file in the reference index', { tags: ['slow'] }, () => {
    it.each<{ name: string; where: Where; scans: object[] }>([
        { name: 'no file, for an unsaved workspace', where: 'unsaved', scans: [] },
        {
            name: 'no file, for a file in a hub that is no folder of the workspace',
            where: 'no folder',
            scans: []
        },
        {
            name: 'the file under the primary hub, for a file in its folder',
            where: 'primary',
            scans: [{ root: 'hub', path: WORKSPACE, of: undefined, named: ['owner'] }]
        },
        {
            name: 'the file under another folder, naming the primary hub, for a file in that folder',
            where: 'other folder',
            scans: [{ root: 'lab', path: WORKSPACE, of: 'hub', named: ['owner'] }]
        }
    ])('scans $name', (row) => {
        const scans = watchedIndex(workspaceAt(row.where))
            .files.filter((one) => one.file.path.startsWith('.oculus/workspaces/'))
            .map((one) => ({
                root: one.file.root,
                path: one.file.path,
                of: one.of,
                named: one.references.map((place) => place.value)
            }));
        expect(scans).toEqual(row.scans);
    });
});
