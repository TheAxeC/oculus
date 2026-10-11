// Layer 4, data test. The `hub: true` mark of a `roots:` entry, a `tier` key it should not carry
// and the roots whose `.oculus/project.yml` cannot be read as a project, as readRoots reads them
// (lib/server/files/files.ts): a mark that cannot be honoured is a finding that names the root, and
// the root is then read as a plain root, so a wrong value never builds a second hub or a project.
//
// Every directory is made under the system temporary directory by scratchDir, and the entries are
// handed to readRoots as a list, so nothing reads a hub or the checkout.

import { mkdirSync, symlinkSync, writeFileSync } from 'node:fs';
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
        const keys = ['hub', 'engine', 'a:b'];
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

/** The folders a row of the table is made over, all under one scratch directory. */
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
    /** Each root by key: whether it stands as a hub and whether it is refused as a project. */
    roots: [string, boolean, boolean][];
    /** The finding of each entry that has one: its key and the catalog key of its sentence. */
    findings: [string, string][];
};

/** An entry with the extra keys a row gives it. */
const entryOf = (key: string, dir: string, extra: Record<string, unknown> = {}): unknown => ({
    key,
    dir,
    ...extra
});

/** A folder that holds the manifest which makes a root a project, and the folder. */
function project(dir: string): string {
    mkdirSync(join(dir, '.oculus'), { recursive: true });
    writeFileSync(join(dir, '.oculus', 'project.yml'), 'tier: personal\ntype: active\n');
    return dir;
}

const KEYS_REFUSED = ['root:foo', 'a/b', 'a b', 'hub', 'engine'];

const ROWS: Row[] = [
    {
        name: 'a tier key of any word or kind as a finding on the key, the root read as it is',
        entries: (at) => [
            entryOf('p', at.a, { tier: 'projects' }),
            entryOf('c', at.b, { tier: 'coauthor' }),
            entryOf('s', at.c, { tier: 'personal' }),
            entryOf('n', at.parent, { tier: 3 })
        ],
        roots: [
            ['p', false, false],
            ['c', false, false],
            ['s', false, false],
            ['n', false, false]
        ],
        findings: [
            ['p', 'findings.roots.tier_key'],
            ['c', 'findings.roots.tier_key'],
            ['s', 'findings.roots.tier_key'],
            ['n', 'findings.roots.tier_key']
        ]
    },
    {
        name: 'a tier key on a hub root as a finding on the key, the hub standing',
        entries: (at) => [entryOf('lab', at.a, { tier: 'projects', hub: true })],
        roots: [['lab', true, false]],
        findings: [['lab', 'findings.roots.tier_key']]
    },
    {
        name: 'a root that holds a project, with no tier key, as a project with no finding',
        entries: (at) => [entryOf('alpha', project(at.a))],
        roots: [['alpha', false, false]],
        findings: []
    },
    {
        name: 'a root with no manifest as no project and no finding',
        entries: (at) => [entryOf('plain', at.a)],
        roots: [['plain', false, false]],
        findings: []
    },
    {
        name: 'a project root on the first hub, a folder inside it and a folder holding it as no project',
        entries: (at) => [
            entryOf('same', project(at.first)),
            entryOf('inner', project(folder(at.first, 'projects'))),
            entryOf('outer', project(at.parent))
        ],
        roots: [
            ['same', false, true],
            ['inner', false, true],
            ['outer', false, true]
        ],
        findings: [
            ['same', 'findings.roots.project_is_first'],
            ['inner', 'findings.roots.project_is_first'],
            ['outer', 'findings.roots.project_is_first']
        ]
    },
    {
        name: 'a project root on a second key of one directory, and on its link, as no project',
        entries: (at) => [
            entryOf('first', project(at.a)),
            entryOf('again', at.a),
            entryOf('linked', at.link)
        ],
        roots: [
            ['first', false, false],
            ['again', false, true],
            ['linked', false, true]
        ],
        findings: [
            ['again', 'findings.roots.project_same_dir'],
            ['linked', 'findings.roots.project_same_dir']
        ]
    },
    {
        name: 'a project root on a key with a colon, a slash, a space or a reserved word as no project',
        entries: (at) =>
            KEYS_REFUSED.map((key, at_) => entryOf(key, project(folder(at.a, `n${at_}`)))),
        roots: KEYS_REFUSED.map((key) => [key, false, true]),
        findings: KEYS_REFUSED.map((key) => [key, 'findings.roots.project_reserved_key'])
    },
    {
        name: 'a project root on the folder of a hub root listed after it, or inside it, as no project',
        entries: (at) => [
            entryOf('repo', project(at.a)),
            entryOf('lab', at.a, { hub: true }),
            entryOf('inner', project(folder(at.a, 'inner')))
        ],
        roots: [
            ['repo', false, true],
            ['lab', true, false],
            ['inner', false, true]
        ],
        findings: [
            ['repo', 'findings.roots.project_in_hub'],
            ['inner', 'findings.roots.project_in_hub']
        ]
    },
    {
        name: 'a root on a directory that is not on this machine as the missing directory alone',
        entries: (at) => [entryOf('gone', join(at.parent, 'nowhere'))],
        roots: [['gone', false, false]],
        findings: [['gone', 'findings.roots.missing_dir']]
    }
];

describe('a roots entry with a tier key', () => {
    it.each(ROWS)('reads $name', (row) => {
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
        expect(roots.map((one) => [one.key, one.hub === true, one.noProject === true])).toEqual(
            row.roots
        );
        for (const one of roots) expect(one).not.toHaveProperty('tier');
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
