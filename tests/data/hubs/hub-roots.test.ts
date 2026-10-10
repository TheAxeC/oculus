// Layer 4, data test. The `hub: true` mark and the `tier` of a `roots:` entry as readRoots reads
// them (lib/server/files/files.ts): a mark that cannot be honoured is a finding that names the
// root, and the root is then read as a plain root, so a wrong value never builds a second hub or a
// research project.
//
// Every directory is made under the system temporary directory by scratchDir, and the entries are
// handed to readRoots as a list, so nothing reads a hub or the checkout.

import { mkdirSync, symlinkSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect } from 'vitest';
import { findingText } from '../../../src/lib/data/helpers/finding-text.ts';
import { engineDir, loadConfig, textCatalog } from '../../../src/lib/data/sources/config.ts';
import { readRoots } from '../../../src/lib/server/files/files.ts';
import { it, scratchDir, test } from '../../fixtures/scratch.ts';

/** The merged engine settings, which hold the finding sentences readRoots words a finding with. */
let settings: Record<string, unknown> = {};

test.beforeAll(() => {
    settings = loadConfig(engineDir()).config;
});

/** What a list of entries reads as: the roots with their mark, and each finding by its root. */
function read(
    entries: unknown[],
    first: string
): { roots: [string, boolean][]; findings: [string, string][] } {
    const { roots, findings } = readRoots({ ...settings, roots: entries }, 'sources.yml', first);
    return {
        roots: roots.map((one) => [one.key, one.hub === true]),
        findings: findings.map((one) => [one.key, one.message])
    };
}

/** A folder under the scratch directory of a case, made here. */
function folder(base: string, ...parts: string[]): string {
    const full = join(base, ...parts);
    mkdirSync(full, { recursive: true });
    return full;
}

describe('a hub root', () => {
    it('is read as a hub when it is true and nothing about it is wrong', () => {
        const base = scratchDir('oculus-hub-roots-');
        const first = folder(base, 'hub');
        const lab = folder(base, 'lab');
        const out = read([{ key: 'lab', dir: lab, hub: true }], first);
        expect(out).toEqual({ roots: [['lab', true]], findings: [] });
    });

    it('is a plain root with a finding naming the root when hub is a string or a number', () => {
        const base = scratchDir('oculus-hub-roots-');
        const first = folder(base, 'hub');
        const out = read(
            [
                { key: 'a', dir: folder(base, 'a'), hub: 'yes' },
                { key: 'b', dir: folder(base, 'b'), hub: 1 }
            ],
            first
        );
        expect(out.roots).toEqual([
            ['a', false],
            ['b', false]
        ]);
        expect(out.findings.map(([key]) => key)).toEqual(['a', 'b']);
        for (const [, message] of out.findings) expect(message).toContain('not true or false');
    });

    it('is a plain root with a finding when it is, lies inside or holds the first hub', () => {
        const base = scratchDir('oculus-hub-roots-');
        const parent = folder(base, 'parent');
        const first = folder(parent, 'hub');
        const out = read(
            [
                { key: 'same', dir: first, hub: true },
                { key: 'inner', dir: folder(first, 'projects'), hub: true },
                { key: 'outer', dir: parent, hub: true }
            ],
            first
        );
        expect(out.roots.map(([, hub]) => hub)).toEqual([false, false, false]);
        expect(out.findings.map(([key]) => key)).toEqual(['same', 'inner', 'outer']);
        for (const [, message] of out.findings) expect(message).toContain('first hub');
    });

    it('is a plain root with a finding when its key is reserved or holds a colon', () => {
        const base = scratchDir('oculus-hub-roots-');
        const first = folder(base, 'hub');
        const keys = ['side', 'root', 'hub', 'engine', 'a:b'];
        const out = read(
            keys.map((key) => ({ key, dir: folder(base, key.replace(':', '-')), hub: true })),
            first
        );
        expect(out.roots.map(([key, hub]) => [key, hub])).toEqual(keys.map((key) => [key, false]));
        expect(out.findings.map(([key]) => key)).toEqual(keys);
        for (const [, message] of out.findings) expect(message).toContain('cannot be keyed');
    });

    it('is a plain root with a finding when an earlier hub root has its directory or holds it', () => {
        const base = scratchDir('oculus-hub-roots-');
        const first = folder(base, 'hub');
        const lab = folder(base, 'lab');
        const link = join(base, 'lab2');
        symlinkSync(lab, link);
        const inner = folder(lab, 'inner');
        const out = read(
            [
                { key: 'lab', dir: lab, hub: true },
                { key: 'lab2', dir: link, hub: true },
                { key: 'inner', dir: inner, hub: true }
            ],
            first
        );
        expect(out.roots).toEqual([
            ['lab', true],
            ['lab2', false],
            ['inner', false]
        ]);
        expect(out.findings.map(([key]) => key)).toEqual(['lab2', 'inner']);
        expect(out.findings[0][1]).toContain('same directory');
        expect(out.findings[1][1]).toContain('inside or holds');
    });

    it('is not built when its directory is not on this machine, and the finding is the missing directory', () => {
        const base = scratchDir('oculus-hub-roots-');
        const first = folder(base, 'hub');
        const gone = join(base, 'nowhere', 'x');
        const out = read([{ key: 'lab', dir: gone, hub: true }], first);
        expect(out.roots).toEqual([['lab', false]]);
        expect(out.findings).toHaveLength(1);
        expect(out.findings[0][0]).toBe('lab');
        expect(out.findings[0][1]).toContain('no directory at');
    });
});

/** The folders a row of the tier table is made over, all under one scratch directory. */
type Folders = {
    /** The first hub, inside `parent`. */
    first: string;
    parent: string;
    /** Three folders of their own. */
    a: string;
    b: string;
    c: string;
    /** A symbolic link to `a`. */
    link: string;
};

type Row = {
    name: string;
    entries: (at: Folders) => unknown[];
    /** The tier each root is read with, by key, and undefined for a root with none. */
    tiers: [string, string | undefined][];
    /** Whether each root stands as a hub, by key, for a row that is about the hub mark. */
    hubs?: [string, boolean][];
    /** The finding of each entry that has one: its key and the catalog key of its sentence. */
    findings: [string, string][];
};

/** An entry of the tier table: one key and dir with the `tier` the row gives. */
const entryOf = (key: string, dir: string, tier: unknown, hub?: boolean): unknown => ({
    key,
    dir,
    tier,
    ...(hub === undefined ? {} : { hub })
});

const TIER_ROWS: Row[] = [
    {
        name: 'the three research tiers as they are written, and personal as none',
        entries: (at) => [
            entryOf('p', at.a, 'projects'),
            entryOf('c', at.b, 'coauthor'),
            entryOf('r', at.c, 'archive'),
            entryOf('s', at.parent, 'personal')
        ],
        tiers: [
            ['p', 'projects'],
            ['c', 'coauthor'],
            ['r', 'archive'],
            ['s', undefined]
        ],
        findings: []
    },
    {
        name: 'a tier of another word or of another kind as none, with a finding naming the four',
        entries: (at) => [entryOf('a', at.a, 'software'), entryOf('b', at.b, 3)],
        tiers: [
            ['a', undefined],
            ['b', undefined]
        ],
        findings: [
            ['a', 'findings.roots.tier_unknown'],
            ['b', 'findings.roots.tier_unknown']
        ]
    },
    {
        name: 'a tier on a hub root as a hub with no tier, with a finding',
        entries: (at) => [entryOf('lab', at.a, 'projects', true)],
        tiers: [['lab', undefined]],
        hubs: [['lab', true]],
        findings: [['lab', 'findings.roots.tier_on_hub']]
    },
    {
        name: 'a tier on a hub mark refused on the folder of a hub as a plain root with no tier, with both findings',
        entries: (at) => [
            entryOf('lab', at.a, undefined, true),
            entryOf('again', at.a, 'archive', true)
        ],
        tiers: [
            ['lab', undefined],
            ['again', undefined]
        ],
        hubs: [
            ['lab', true],
            ['again', false]
        ],
        findings: [
            ['again', 'findings.roots.hub_same_dir'],
            ['again', 'findings.roots.tier_in_hub']
        ]
    },
    {
        name: 'a research tier on the folder of a hub listed after it, or inside it, as none',
        entries: (at) => [
            entryOf('repo', at.a, 'projects'),
            entryOf('lab', at.a, undefined, true),
            entryOf('inner', folder(at.a, 'inner'), 'coauthor')
        ],
        tiers: [
            ['repo', undefined],
            ['lab', undefined],
            ['inner', undefined]
        ],
        hubs: [
            ['repo', false],
            ['lab', true],
            ['inner', false]
        ],
        findings: [
            ['repo', 'findings.roots.tier_in_hub'],
            ['inner', 'findings.roots.tier_in_hub']
        ]
    },
    {
        name: 'a research tier on the first hub, a folder inside it and a folder holding it as none',
        entries: (at) => [
            entryOf('same', at.first, 'projects'),
            entryOf('inner', folder(at.first, 'projects'), 'archive'),
            entryOf('outer', at.parent, 'coauthor')
        ],
        tiers: [
            ['same', undefined],
            ['inner', undefined],
            ['outer', undefined]
        ],
        findings: [
            ['same', 'findings.roots.tier_is_first'],
            ['inner', 'findings.roots.tier_is_first'],
            ['outer', 'findings.roots.tier_is_first']
        ]
    },
    {
        name: 'a research tier on a second key of one directory, and on its link, as none',
        entries: (at) => [
            entryOf('first', at.a, 'projects'),
            entryOf('again', at.a, 'projects'),
            entryOf('linked', at.link, 'archive')
        ],
        tiers: [
            ['first', 'projects'],
            ['again', undefined],
            ['linked', undefined]
        ],
        findings: [
            ['again', 'findings.roots.tier_same_dir'],
            ['linked', 'findings.roots.tier_same_dir']
        ]
    },
    {
        name: 'a research tier on a key with a colon, a slash, a space or a reserved word as none',
        entries: (at) =>
            ['root:foo', 'a/b', 'a b', 'side', 'root', 'hub', 'engine'].map((key, at_) =>
                entryOf(key, folder(at.a, `n${at_}`), 'projects')
            ),
        tiers: ['root:foo', 'a/b', 'a b', 'side', 'root', 'hub', 'engine'].map((key) => [
            key,
            undefined
        ]),
        findings: ['root:foo', 'a/b', 'a b', 'side', 'root', 'hub', 'engine'].map((key) => [
            key,
            'findings.roots.tier_reserved_key'
        ])
    },
    {
        name: 'a research tier on a directory that is not on this machine as the missing directory alone',
        entries: (at) => [entryOf('gone', join(at.parent, 'nowhere'), 'coauthor')],
        tiers: [['gone', undefined]],
        findings: [['gone', 'findings.roots.missing_dir']]
    }
];

describe('the tier of a roots entry', () => {
    it.each(TIER_ROWS)('reads $name', (row) => {
        const base = scratchDir('oculus-tier-roots-');
        const parent = folder(base, 'parent');
        const at: Folders = {
            parent,
            first: folder(parent, 'hub'),
            a: folder(base, 'a'),
            b: folder(base, 'b'),
            c: folder(base, 'c'),
            link: join(base, 'link')
        };
        symlinkSync(at.a, at.link);
        const { roots, findings } = readRoots(
            { ...settings, roots: row.entries(at) },
            'sources.yml',
            at.first
        );
        expect(roots.map((one) => [one.key, one.tier])).toEqual(row.tiers);
        if (row.hubs !== undefined) {
            expect(roots.map((one) => [one.key, one.hub === true])).toEqual(row.hubs);
        }
        const catalog = textCatalog(settings);
        const words = (key: string): string =>
            key === 'findings.roots.missing_dir'
                ? findingText(catalog, key, join(at.parent, 'nowhere'))
                : findingText(catalog, key);
        expect(findings.map((one) => [one.key, one.message])).toEqual(
            row.findings.map(([key, sentence]) => [key, words(sentence)])
        );
    });
});
