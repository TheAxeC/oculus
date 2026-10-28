// Layer 4, data tests. The rename of a hub key (data/snapshot/references/rename.ts): the edit that
// changes every reference to a key and the key's definition, and the reasons it is refused. A hub
// is planted in a scratch directory (tests/data/snapshot/reference-hub.ts), the index of its
// build is asked for the key at a position, and the edit planned for a new key is applied to the
// files' texts with the same text edits `lsp-edit` and the editor apply. The last table renames a
// person of a hub other than the primary over the index the portfolio watcher builds for two hubs
// (tests/data/hubs/hubs-fixture.ts), a server module, which makes this file layer 4; a build takes
// about a second, so that table is tagged slow.
//
// The edited texts are compared with the planted texts changed by hand at the places the rename
// names, so a byte that moved anywhere else is a failure. A refusal gives no edit at all.
//
// A refusal is asked for at the step it is given: one that depends on the key and the files alone
// is the answer to `prepareRename` (`refuseRename`), and one that depends on the new key is the
// answer to `rename` (`planRename`). A row names which, and the other step must not give it.
//
// What this does NOT cover: the refusals that come from the page (a file that changed since the
// edit was planned, a tab typed into), which tests/state/system/lsp/edits.test.ts runs, the
// preview, which tests/state/system/refactor-preview.test.ts runs, and the refusal only the relay
// can see (a tab of another window), which tests/server/machine/lsp/adapters/hub-keys.test.ts runs
// through the answer to `prepareRename`.

import { appendFileSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect } from 'vitest';
import { applyTextEdits } from '../../../src/lib/data/prose/text-edits.ts';
import {
    planRename,
    refuseRename,
    type FileText,
    type RenameRefusal
} from '../../../src/lib/data/snapshot/references/rename.ts';
import type { FileScan } from '../../../src/lib/data/snapshot/references/model.ts';
import { graphOf, hitAt } from '../../../src/lib/data/snapshot/references/lookup.ts';
import { localFile } from '../../../src/lib/data/sources/config/local.ts';
import { it, scratchDir } from '../../fixtures/scratch.ts';
import { copyHub, indexedOnce } from '../hubs/hubs-fixture.ts';
import {
    ENGINE_FILES,
    HUB_FILES,
    LOCAL_TEXT,
    plantHub,
    WORKSPACE_FILE,
    WORKSPACE_TEXT,
    type PlantedHub,
    type PlantedRoot
} from './reference-hub.ts';

type Root = PlantedRoot;

/** Where the rename is asked: a file and a position, the first letter of the key. */
type At = [Root, string, number, number];

/** The text of a file the rename edits, by its path, for the rows that name the files. */
type Texts = Record<string, string>;

type Edited = {
    name: string;
    at: At;
    newKey: string;
    hub?: Texts;
    /** The engine's config files the row plants in place of the standard ones. */
    engine?: Texts;
    /** The open workspace file the row plants, and the workspace folder it lies in. */
    workspace?: { text: string; folder: 'hub' | 'lab' };
    /** The files that change, by `root:path`, with the text each has after the rename. */
    after: Texts;
};

/** The text of a file of the planted hub or engine, as the disk holds it. */
function disk(hub: PlantedHub): (scan: FileScan) => FileText {
    const folders: Record<string, string | null> = {
        hub: hub.hub,
        engine: hub.engine,
        lab: hub.lab
    };
    return (scan) => {
        const folder = folders[scan.file.root] ?? null;
        if (folder === null) throw new Error(`the row plants no folder ${scan.file.root}`);
        return { text: readFileSync(join(folder, scan.file.path), 'utf8') };
    };
}

/** The files a plan edits, each with its text after the edits, by `root:path`. */
function applied(hub: PlantedHub, plan: ReturnType<typeof planRename>): Texts {
    expect(plan.ok).toBe(true);
    if (!plan.ok) return {};
    const read = disk(hub);
    const out: Texts = {};
    for (const file of plan.files) {
        const held = read(file.scan);
        if (held === null || 'large' in held) throw new Error('the file was read');
        const made = applyTextEdits(held.text, file.edits);
        expect(made.ok).toBe(true);
        out[`${file.scan.file.root}:${file.scan.file.path}`] = made.ok ? made.text : '';
    }
    return out;
}

const VENUE = HUB_FILES['.oculus/data/research/venues.yml'];
const ALPHA = HUB_FILES['projects/active/alpha/project.yml'];
const BETA = HUB_FILES['projects/active/beta/project.yml'];

/** The hub's files after `amir` is renamed `amir-2`: the entry and each place that names it. */
const AMIR_RENAMED: Texts = {
    'hub:.oculus/data/people/people.yml': HUB_FILES['.oculus/data/people/people.yml'].replace(
        'key: amir',
        'key: amir-2'
    ),
    'hub:.oculus/data/research/statements.yml': HUB_FILES[
        '.oculus/data/research/statements.yml'
    ].replace('"amir"', '"amir-2"'),
    'hub:projects/active/alpha/project.yml': ALPHA.replace(
        'waiting-on: [amir, beta]',
        'waiting-on: [amir-2, beta]'
    ).replace('collaborators: [amir]', 'collaborators: [amir-2]')
};

/**
 * The files after the cluster `hpc` is renamed `hpc-2`: its entry and oculus's `slurm.resource`.
 */
const HPC_RENAMED: Texts = {
    'hub:.oculus/data/research/resources.yml': HUB_FILES[
        '.oculus/data/research/resources.yml'
    ].replace('{ key: hpc,', '{ key: hpc-2,'),
    'engine:defaults/behavior.yml': ENGINE_FILES['defaults/behavior.yml'].replace(
        'resource: [hpc]',
        'resource: [hpc-2]'
    )
};

/** The venues file with its `name` written before the `id` its schema flags as its primary key. */
const VENUE_NAME_FIRST = [
    'schema:',
    '  - { field: name, type: text, display: 1, required: true, help: The venue name. }',
    '  - { field: id, type: text, primary_key: true, required: true, help: The venue key. }',
    'entries:',
    '  - { name: Journal One, id: jbhi }',
    '  - { name: Journal Two, id: bspc }',
    ''
].join('\n');

const EDITED: Edited[] = [
    {
        name: 'a venue id that is the primary key but not the first field, and every reference to it (G67)',
        at: ['hub', 'projects/active/alpha/project.yml', 3, 7],
        newKey: 'jama',
        hub: { '.oculus/data/research/venues.yml': VENUE_NAME_FIRST },
        after: {
            'hub:.oculus/data/research/venues.yml': VENUE_NAME_FIRST.replace(
                'id: jbhi }',
                'id: jama }'
            ),
            'hub:projects/active/alpha/project.yml': ALPHA.replace('venue: jbhi', 'venue: jama'),
            'hub:projects/active/beta/project.yml': BETA.replace('venue: "jbhi"', 'venue: "jama"')
        }
    },
    {
        name: 'a plain and a double-quoted reference and the definition, and no other byte',
        at: ['hub', 'projects/active/alpha/project.yml', 3, 7],
        newKey: 'jama',
        after: {
            'hub:.oculus/data/research/venues.yml': VENUE.replace('{ id: jbhi,', '{ id: jama,'),
            'hub:projects/active/alpha/project.yml': ALPHA.replace('venue: jbhi', 'venue: jama'),
            'hub:projects/active/beta/project.yml': BETA.replace('venue: "jbhi"', 'venue: "jama"')
        }
    },
    {
        name: 'a single-quoted reference, which keeps its quotes',
        at: ['hub', '.oculus/data/research/venues.yml', 4, 10],
        newKey: 'jama',
        hub: {
            'projects/active/alpha/project.yml': ALPHA.replace('venue: jbhi', "venue: 'jbhi'")
        },
        after: {
            'hub:.oculus/data/research/venues.yml': VENUE.replace('{ id: jbhi,', '{ id: jama,'),
            'hub:projects/active/alpha/project.yml': ALPHA.replace('venue: jbhi', "venue: 'jama'"),
            'hub:projects/active/beta/project.yml': BETA.replace('venue: "jbhi"', 'venue: "jama"')
        }
    },
    {
        name: 'a trailing comment on the line, which stays',
        at: ['hub', 'projects/active/alpha/project.yml', 3, 7],
        newKey: 'jama',
        hub: {
            'projects/active/alpha/project.yml': ALPHA.replace(
                'venue: jbhi',
                'venue: jbhi # the target'
            )
        },
        after: {
            'hub:.oculus/data/research/venues.yml': VENUE.replace('{ id: jbhi,', '{ id: jama,'),
            'hub:projects/active/alpha/project.yml': ALPHA.replace(
                'venue: jbhi',
                'venue: jama # the target'
            ),
            'hub:projects/active/beta/project.yml': BETA.replace('venue: "jbhi"', 'venue: "jama"')
        }
    },
    {
        name: 'a flow sequence, a block sequence and a double-quoted scalar',
        at: ['hub', '.oculus/data/people/people.yml', 5, 10],
        newKey: 'amir-2',
        hub: {
            'projects/active/alpha/project.yml': ALPHA.replace(
                'collaborators: [amir]',
                'collaborators:\n  - amir'
            )
        },
        after: {
            'hub:.oculus/data/people/people.yml': HUB_FILES[
                '.oculus/data/people/people.yml'
            ].replace('key: amir', 'key: amir-2'),
            'hub:.oculus/data/research/statements.yml': HUB_FILES[
                '.oculus/data/research/statements.yml'
            ].replace('"amir"', '"amir-2"'),
            'hub:projects/active/alpha/project.yml': ALPHA.replace(
                'waiting-on: [amir, beta]',
                'waiting-on: [amir-2, beta]'
            ).replace('collaborators: [amir]', 'collaborators:\n  - amir-2')
        }
    },
    {
        name: 'an anchored key used through an alias, edited once at the anchor',
        at: ['hub', '.oculus/data/pillars/pillars.yml', 3, 9],
        newKey: 'tens',
        hub: {
            'projects/active/alpha/project.yml': ALPHA.replace(
                'pillars: [tensor, federated]',
                'pillars: [&p tensor, *p, federated]'
            )
        },
        after: {
            'hub:.oculus/data/pillars/pillars.yml': HUB_FILES[
                '.oculus/data/pillars/pillars.yml'
            ].replace('key: tensor', 'key: tens'),
            'hub:projects/active/alpha/project.yml': ALPHA.replace(
                'pillars: [tensor, federated]',
                'pillars: [&p tens, *p, federated]'
            )
        }
    },
    {
        name: 'a domain key, the domains registry entry and the domain of each manifest',
        at: ['hub', '.oculus/data/pillars/domains.yml', 3, 9],
        newKey: 'cardio',
        hub: { 'projects/active/beta/project.yml': `${BETA}domain: heart\n` },
        // Config files that name the domain by keys oculus does not read stay as they are.
        engine: {
            'defaults/behavior.yml': 'data_domains: [heart]\nslurm:\n  resource: [hpc]\n',
            'catalogs/vocab.yml': 'domains:\n  heart: { color: "#e2374d", label: Heart }\n'
        },
        after: {
            'hub:.oculus/data/pillars/domains.yml': HUB_FILES[
                '.oculus/data/pillars/domains.yml'
            ].replace('key: heart', 'key: cardio'),
            'hub:projects/active/beta/project.yml': `${BETA}domain: cardio\n`
        }
    },
    {
        name: 'the cluster the setting slurm.resource of the open workspace file names, and no other byte of that file',
        at: ['hub', '.oculus/data/research/resources.yml', 4, 11],
        newKey: 'hpc-2',
        workspace: { text: WORKSPACE_TEXT, folder: 'hub' },
        after: {
            ...HPC_RENAMED,
            [`hub:${WORKSPACE_FILE}`]: WORKSPACE_TEXT.replace(
                'resource: [hpc]',
                'resource: [hpc-2]'
            )
        }
    },
    {
        name: 'the cluster the setting slurm.resource names, in an open workspace file of another workspace folder',
        at: ['hub', '.oculus/data/research/resources.yml', 4, 11],
        newKey: 'hpc-2',
        workspace: { text: WORKSPACE_TEXT, folder: 'lab' },
        after: {
            ...HPC_RENAMED,
            [`lab:${WORKSPACE_FILE}`]: WORKSPACE_TEXT.replace(
                'resource: [hpc]',
                'resource: [hpc-2]'
            )
        }
    },
    {
        name: "the person self of the primary hub's local.yml names, and no other byte of that file or the workspace file (case 23)",
        at: ['hub', '.oculus/data/people/people.yml', 5, 10],
        newKey: 'amir-2',
        hub: { '.oculus/local.yml': LOCAL_TEXT },
        workspace: { text: WORKSPACE_TEXT, folder: 'hub' },
        after: {
            ...AMIR_RENAMED,
            'hub:.oculus/local.yml': LOCAL_TEXT.replace('self: amir', 'self: amir-2')
        }
    }
];

/** A new key that would not read back as itself when written plain is written double-quoted. */
const QUOTED = [
    ['123', '"123"'],
    ['null', '"null"'],
    ['x: y', '"x: y"'],
    ['#x', '"#x"']
] as const;

type Refused = {
    name: string;
    /** The step that gives the refusal: the answer to `prepareRename` or to `rename`. */
    when: 'prepare' | 'rename';
    at: At;
    newKey: string;
    hub?: Texts;
    open?: Texts;
    /** Reads the file for the rename, when the row is about what the read gives. */
    read?: (scan: FileScan) => FileText;
    refusal: RenameRefusal;
};

const NOTHING_SAVED = { text: '' };

const REFUSED: Refused[] = [
    {
        name: 'an open tab whose unsaved text is not YAML',
        when: 'prepare',
        at: ['hub', 'projects/active/alpha/project.yml', 3, 7],
        newKey: 'jama',
        open: { 'projects/active/beta/project.yml': 'id: beta\nvenue: [jbhi\n' },
        refusal: { code: 'unparsed', file: 'projects/active/beta/project.yml' }
    },
    {
        name: 'an empty new key',
        when: 'rename',
        at: ['hub', 'projects/active/alpha/project.yml', 3, 7],
        newKey: '',
        refusal: { code: 'empty' }
    },
    {
        name: 'a new key of white space only',
        when: 'rename',
        at: ['hub', 'projects/active/alpha/project.yml', 3, 7],
        newKey: '  ',
        refusal: { code: 'empty' }
    },
    {
        name: 'a new key that already stands in the key source',
        when: 'rename',
        at: ['hub', 'projects/active/alpha/project.yml', 3, 7],
        newKey: 'bspc',
        refusal: { code: 'exists', key: 'bspc', source: 'venues' }
    },
    {
        name: 'a new key that stands in another source the field takes together with this one',
        when: 'rename',
        at: ['hub', 'projects/active/alpha/project.yml', 6, 13],
        newKey: 'beta',
        refusal: { code: 'exists', key: 'beta', source: 'projects' }
    },
    {
        name: 'a value that is a key of two sources the field takes together',
        when: 'prepare',
        at: ['hub', 'projects/active/alpha/project.yml', 6, 19],
        hub: {
            '.oculus/data/people/people.yml': HUB_FILES['.oculus/data/people/people.yml'].replace(
                '  - key: ann\n',
                '  - key: beta\n    name: Beta\n  - key: ann\n'
            )
        },
        newKey: 'gamma',
        refusal: { code: 'sources', key: 'beta', sources: ['people', 'projects'] }
    },
    {
        name: 'a person key that a reference also names as a project, started at its definition',
        when: 'prepare',
        at: ['hub', '.oculus/data/people/people.yml', 8, 10],
        hub: {
            '.oculus/data/people/people.yml': HUB_FILES['.oculus/data/people/people.yml'].replace(
                '  - key: ann\n',
                '  - key: beta\n    name: Beta\n  - key: ann\n'
            )
        },
        newKey: 'gamma',
        refusal: { code: 'sources', key: 'beta', sources: ['people', 'projects'] }
    },
    {
        name: 'a project id',
        when: 'prepare',
        at: ['hub', 'projects/active/alpha/project.yml', 0, 4],
        newKey: 'alpha-2',
        refusal: { code: 'project', key: 'alpha' }
    },
    {
        name: 'a vocabulary value',
        when: 'prepare',
        at: ['engine', 'catalogs/vocab.yml', 5, 2],
        newKey: 'paper',
        refusal: { code: 'vocab', key: 'manuscript' }
    },
    {
        name: 'a key that stands twice in its source',
        when: 'prepare',
        at: ['hub', '.oculus/data/research/venues.yml', 4, 10],
        hub: {
            '.oculus/data/research/venues.yml': VENUE.replace(
                '  - { id: bspc, name: Journal Two }',
                '  - { id: jbhi }'
            )
        },
        newKey: 'jama',
        refusal: { code: 'twice', key: 'jbhi', source: 'venues' }
    },
    {
        name: 'a new key with a comma, which a flow list would read as two',
        when: 'rename',
        at: ['hub', '.oculus/data/pillars/pillars.yml', 3, 9],
        newKey: 'a, b',
        refusal: { code: 'readback', key: 'a, b', file: 'projects/active/alpha/project.yml' }
    },
    {
        name: 'a file larger than the write limit',
        when: 'prepare',
        at: ['hub', 'projects/active/alpha/project.yml', 3, 7],
        newKey: 'jama',
        read: () => ({ large: true }),
        refusal: { code: 'large', file: '.oculus/data/research/venues.yml' }
    },
    {
        name: 'a file that cannot be read',
        when: 'prepare',
        at: ['hub', 'projects/active/alpha/project.yml', 3, 7],
        newKey: 'jama',
        read: () => null,
        refusal: { code: 'unread', file: '.oculus/data/research/venues.yml' }
    },
    {
        name: 'a file whose text is no longer the text the index was built from, so the edit does not read back',
        when: 'rename',
        at: ['hub', 'projects/active/alpha/project.yml', 3, 7],
        newKey: 'jama',
        read: () => NOTHING_SAVED,
        refusal: { code: 'readback', key: 'jama', file: '.oculus/data/research/venues.yml' }
    }
];

describe('the rename of a hub key', () => {
    it.each(EDITED)('edits $name', (row) => {
        const hub = plantHub(row.hub, row.engine, { workspace: row.workspace });
        const [root, path, line, character] = row.at;
        const { hit, graph } = hub.hit(root, path, { line, character });
        expect(hit).not.toBeNull();
        if (hit === null) return;
        expect(refuseRename(graph, hit, disk(hub))).toBeNull();
        const edited = applied(hub, planRename(graph, hit, row.newKey, disk(hub)));
        expect(edited).toEqual(
            Object.fromEntries(Object.entries(row.after).map(([name, text]) => [name, text]))
        );
    });

    it.each(QUOTED)('writes a new key %s that would not read back plain as %s', (key, written) => {
        const hub = plantHub();
        const { hit, graph } = hub.hit('hub', '.oculus/data/pillars/pillars.yml', {
            line: 3,
            character: 9
        });
        expect(hit?.key).toBe('tensor');
        if (hit === null) return;
        const edited = applied(hub, planRename(graph, hit, key, disk(hub)));
        expect(edited['hub:.oculus/data/pillars/pillars.yml']).toBe(
            HUB_FILES['.oculus/data/pillars/pillars.yml'].replace('key: tensor', `key: ${written}`)
        );
        expect(edited['hub:projects/active/alpha/project.yml']).toBe(
            ALPHA.replace('pillars: [tensor,', `pillars: [${written},`)
        );
    });

    it('edits a file with CRLF line ends at the exact columns', () => {
        const crlf = HUB_FILES['.oculus/data/research/venues.yml'].replace(/\n/g, '\r\n');
        const hub = plantHub({ '.oculus/data/research/venues.yml': crlf });
        const { hit, graph } = hub.hit('hub', '.oculus/data/research/venues.yml', {
            line: 4,
            character: 10
        });
        expect(hit?.key).toBe('jbhi');
        if (hit === null) return;
        const edited = applied(hub, planRename(graph, hit, 'jama', disk(hub)));
        expect(edited['hub:.oculus/data/research/venues.yml']).toBe(
            crlf.replace('{ id: jbhi,', '{ id: jama,')
        );
    });

    it.each(REFUSED)('refuses $name at $when and plans no edit', (row) => {
        const hub = plantHub(row.hub);
        const [root, path, line, character] = row.at;
        const { hit, graph } = hub.hit(root, path, { line, character }, row.open);
        expect(hit).not.toBeNull();
        if (hit === null) return;
        const read = row.read ?? disk(hub);
        const early = refuseRename(graph, hit, read);
        const plan = planRename(graph, hit, row.newKey, read);
        // The step that gives a refusal gives it alone: `rename` makes the checks of `prepare`
        // again, so it gives the same refusal, and `prepare` never gives one of the new key.
        expect(early).toEqual(row.when === 'prepare' ? row.refusal : null);
        expect(plan.ok ? null : plan.refusal).toEqual(row.refusal);
    });
});

/** The people file of a hub, at oculus's default path. */
const PEOPLE = '.oculus/data/people/people.yml';

/**
 * The files a rename of `amir` of the hub `lab` edits, by `root:path`, with their texts after it,
 * over two copies of the demo hub as the watcher indexes them: `hub` the primary, whose
 * `local.yml` is LOCAL_TEXT, and `lab`, each holding a person `amir` when its row says so.
 */
function labAmirRenamed(holders: readonly string[]): Texts {
    const base = scratchDir('oculus-rename-hubs-');
    const folders = ['hub', 'lab'].map((name) => ({ name, dir: copyHub(base, name) }));
    const folderOf = (root: string): string => {
        const found = folders.find((one) => one.name === root);
        if (found === undefined) throw new Error(`no hub is named ${root}`);
        return found.dir;
    };
    for (const name of holders) {
        appendFileSync(join(folderOf(name), PEOPLE), '\n  - key: "amir"\n    name: "Amir"\n');
    }
    writeFileSync(localFile(folderOf('hub')), LOCAL_TEXT);
    const { references } = indexedOnce(folders, 'hub');
    const graph = graphOf(references);
    const scan = references.files.find(
        (one) => one.file.root === 'lab' && one.file.path === PEOPLE
    );
    if (scan === undefined) throw new Error("the index holds no lab's people file");
    const line = readFileSync(join(folderOf('lab'), PEOPLE), 'utf8')
        .split('\n')
        .indexOf('  - key: "amir"');
    const hit = hitAt(graph, scan, { line, character: 10 });
    expect(hit?.key).toBe('amir');
    if (hit === null) return {};
    const read = (one: FileScan): FileText => ({
        text: readFileSync(join(folderOf(one.file.root), one.file.path), 'utf8')
    });
    const plan = planRename(graph, hit, 'amir-2', read);
    expect(plan.ok).toBe(true);
    if (!plan.ok) return {};
    const out: Texts = {};
    for (const file of plan.files) {
        const held = read(file.scan);
        const made = held !== null && 'text' in held ? applyTextEdits(held.text, file.edits) : null;
        out[`${file.scan.file.root}:${file.scan.file.path}`] = made?.ok === true ? made.text : '';
    }
    return out;
}

describe(
    "the rename of another hub's person, which self of the primary's local.yml names",
    { tags: ['slow'] },
    () => {
        it("edits self in the primary's local.yml, and no other byte, when lab alone holds amir (case 24)", () => {
            const edited = labAmirRenamed(['lab']);
            expect(edited['hub:.oculus/local.yml']).toBe(
                LOCAL_TEXT.replace('self: amir', 'self: amir-2')
            );
        });

        it("leaves the primary's local.yml as it is when the primary holds amir too (case 24)", () => {
            const edited = labAmirRenamed(['hub', 'lab']);
            expect(Object.keys(edited)).toContain(`lab:${PEOPLE}`);
            expect(Object.keys(edited)).not.toContain('hub:.oculus/local.yml');
        });
    }
);
