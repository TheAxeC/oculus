// Layer 1, data tests. readManifests against a synthetic hub in a temporary directory. Nothing
// outside it is read or written, and every write asserts its path is inside the temporary directory
// first.

import { mkdirSync, symlinkSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve, sep } from 'node:path';
import { describe, expect } from 'vitest';
import { stringify } from 'yaml';
import {
    buildPortfolioWithSchemas,
    joinHubs,
    portfolioConfigFrom,
    readSecondHub
} from '../../../src/lib/data/index.ts';
import { readManifests } from '../../../src/lib/data/sources/manifests.ts';
import {
    configDir,
    engineDir,
    loadConfig,
    textCatalog
} from '../../../src/lib/data/sources/config.ts';
import { findingText } from '../../../src/lib/data/helpers/finding-text.ts';
import { createChecker } from '../../../src/lib/data/snapshot/schema/check.ts';
import type { RawManifest, ScanRule, Snapshot } from '../../../src/lib/data/model/index.ts';
import { readRoots } from '../../../src/lib/server/files/files.ts';
import { repositoriesOf } from '../../../src/lib/server/files/roots.ts';
import { present } from '../../fixtures/present.ts';
import { it, plantScratch, scratchDir } from '../../fixtures/scratch.ts';

/** The catalog the findings are worded from: the one oculus ships, read as the server reads it. */
const CATALOG = textCatalog(loadConfig(engineDir()).config);

const SCAN: ScanRule[] = [
    { dir: 'projects/ideas', type: 'idea' },
    { dir: 'projects/active', type: 'active' },
    { dir: 'projects/manuscripts', type: 'manuscript' },
    { dir: 'projects/software', type: 'software', optional: true },
    { dir: 'projects/coauthor', nested: true },
    { dir: 'projects/archive', nested: true }
];

function scratch(): string {
    const dir = scratchDir('oculus-manifests-');
    return dir;
}

function write(hub: string, rel: string, body: string): void {
    const full = join(hub, rel);
    expect(resolve(full).startsWith(resolve(hub) + sep)).toBe(true);
    mkdirSync(dirname(full), { recursive: true });
    writeFileSync(full, body);
}

/**
 * A hub with the five tiers that always exist, a flat and a nested project each, and the awkward
 * cases. The optional software tier is deliberately absent, since that is the hub every test but
 * the two software ones below is read against.
 */
function buildHub(): string {
    const hub = scratch();
    for (const tier of ['ideas', 'active', 'manuscripts', 'coauthor', 'archive']) {
        mkdirSync(join(hub, 'projects', tier), { recursive: true });
    }

    write(
        hub,
        'projects/ideas/tensor-spark/project.yml',
        'id: tensor-spark\ntype: idea\ntitle: Tensor spark\n'
    );
    write(
        hub,
        'projects/active/loewner/project.yml',
        'id: loewner\ntype: active\ntitle: Loewner layers\n'
    );
    write(
        hub,
        'projects/manuscripts/btfno/project.yml',
        'id: btfno\ntype: manuscript\ntitle: BT-FNO\nvenue_id: aaai\n'
    );

    // Nested: one category deep, and one filed a second level down by year.
    write(
        hub,
        'projects/coauthor/active/clinical-hccnet/project.yml',
        'id: clinical-hccnet\ntype: in-prep\ntitle: Clinical HCCNet\n'
    );
    write(
        hub,
        'projects/archive/published/2026/abduction/project.yml',
        'id: abduction\ntype: published\ntitle: Abduction\n'
    );
    // Nested, no category folder: the project sits straight under the tier.
    write(hub, 'projects/archive/orphan/project.yml', 'id: orphan\ntype: dropped\ntitle: Orphan\n');

    // A flat-tier folder with no project.yml becomes a ghost project.
    mkdirSync(join(hub, 'projects', 'ideas', 'empty-folder'), { recursive: true });
    write(hub, 'projects/ideas/empty-folder/README.md', 'no manifest here\n');

    // The manifest's own id disagrees with its folder.
    write(hub, 'projects/ideas/renamed/project.yml', 'id: old-name\ntype: idea\ntitle: Renamed\n');

    // Not valid YAML.
    write(hub, 'projects/ideas/broken/project.yml', 'title: "unterminated\n  - [\n');

    // Parses, but to a list rather than a map.
    write(hub, 'projects/ideas/listy/project.yml', '- one\n- two\n');

    // Decoys the walk must never pick up.
    write(hub, 'projects/manuscripts/btfno/code/project.yml', 'id: decoy\ntitle: Decoy\n');
    write(
        hub,
        'projects/archive/published/2026/abduction/attic/project.yml',
        'id: attic-decoy\ntitle: Attic decoy\n'
    );
    write(
        hub,
        'projects/coauthor/active/clinical-hccnet/code/deep/project.yml',
        'id: deep-decoy\ntitle: Deep decoy\n'
    );

    return hub;
}

function byId(manifests: RawManifest[], id: string): RawManifest {
    const found = manifests.find((m) => m.id === id);
    expect(found, `no manifest with id ${id}`).toBeDefined();
    return present(found, `manifest ${id}`);
}

describe('readManifests', () => {
    it('carries the provenance of a flat project', () => {
        const hub = buildHub();
        const { manifests } = readManifests(hub, SCAN, CATALOG);
        const project = byId(manifests, 'btfno');

        expect(project.file).toBe(join(hub, 'projects/manuscripts/btfno/project.yml'));
        expect(project.folder).toBe('projects/manuscripts/btfno');
        expect(project.tier).toBe('manuscripts');
        expect(project.type).toBe('manuscript');
        expect(project.category).toBeUndefined();
        expect(project.manifestId).toBe('btfno');
        expect(project.title).toBe('BT-FNO');
        expect(project.venue_id).toBe('aaai');
    });
});

const MERGED = loadConfig(engineDir()).config;

/** The hub every row of the repository table is read over: two registries and three projects. */
const HUB_FILES: Record<string, string> = {
    'registries/venues.yml': 'entries:\n  - { id: jmlr, name: Journal of Machine Learning }\n',
    'registries/people.yml': 'entries:\n  - { key: rivera, name: Ana Rivera }\n',
    'projects/ideas/tensor-spark/project.yml': 'title: Tensor spark\n',
    'projects/ideas/beta/project.yml': 'title: Beta\n',
    'projects/active/loewner/project.yml': 'title: Loewner layers\n'
};

/** A repository's manifest: a manuscript with a venue and a collaborator of the registries. */
const MANUSCRIPT = 'title: Alpha\ntype: manuscript\nvenue_id: jmlr\ncollaborators: [rivera]\n';

const MANIFEST_FILE = '.oculus/project.yml';

/** The ids of the hub's own projects, which no row changes. */
const HUB_IDS = ['beta', 'loewner', 'tensor-spark'];

/** Where a row's folders are. */
type Places = {
    /** The repository folder. */
    repo: string;
    hub: string;
    /** A symbolic link to the hub's folder `projects/ideas/beta`. */
    hubLink: string;
    /** A symbolic link to the repository folder. */
    repoLink: string;
    /** The file the first hub's `roots:` list is written in, on which an entry's findings sit. */
    rootsFile: string;
};

/** What a row is read into: the snapshot of the build and the places of the row. */
type Read = { snapshot: Snapshot; at: Places };

type Row = {
    name: string;
    /** The entries of the first hub's `roots:`. */
    entries: (at: Places) => unknown[];
    /** The repository's `.oculus/project.yml`, or null for a repository with none. */
    manifest: string | null;
    /** The repository folder's name, `alpha` unless a row says another. */
    folder?: string;
    /** Files of the hub besides HUB_FILES. */
    hub?: Record<string, string>;
    /** Keys of the merged configuration the row changes. */
    merged?: Record<string, unknown>;
    /** The entries of `roots:` in the layer of a second hub `lab` the first hub names, if any. */
    second?: (at: Places) => unknown[];
    check: (read: Read) => void;
};

/** One entry of `roots:` naming the repository `alpha`. */
const entry = (at: Places, tier?: unknown): unknown[] => [
    { key: 'alpha', dir: at.repo, ...(tier === undefined ? {} : { tier }) }
];

/** The ids of the research projects and of the side projects a read holds. */
const idsOf = (read: Read): { projects: string[]; personal: string[] } => ({
    projects: Object.keys(read.snapshot.entities.projects).sort(),
    personal: Object.keys(read.snapshot.entities.personal).sort()
});

/** The messages of the findings on `key` of a file that ends with `file`. */
function findingsOn(read: Read, key: string, file = ''): string[] {
    return read.snapshot.findings
        .filter((one) => one.key === key && one.file.endsWith(file))
        .map((one) => one.message);
}

/** The sentence a finding of the reader says, with its placeholders filled. */
function said(key: string, ...values: (string | number)[]): string {
    return findingText(textCatalog(MERGED), `findings.manifests.${key}`, ...values);
}

/** A read in which the repository is a side project and a finding sits on `key` of `file`. */
function sideWithFinding(read: Read, key: string, file: string, message: string): void {
    expect(idsOf(read)).toEqual({ projects: HUB_IDS, personal: ['root:alpha'] });
    expect(findingsOn(read, key, file)).toContain(message);
}

/** The rows that give the repository a type its manifest cannot honour under tier projects. */
const BAD_TYPES: [string, string, string][] = [
    ['a type no flat scan rule of the tier carries', 'type: idea2', 'repository_type_unknown'],
    ['no type', 'author: x', 'repository_type_missing'],
    ['a type that is not text', 'type: 3', 'repository_type_missing']
];

const ROWS: Row[] = [
    {
        name: 'a manuscript repository with tier projects as a project of the manuscripts board',
        entries: (at) => entry(at, 'projects'),
        manifest: MANUSCRIPT,
        check: (read) => {
            const alpha = read.snapshot.entities.projects.alpha;
            expect(alpha).toMatchObject({
                id: 'alpha',
                tier: 'manuscripts',
                type: 'manuscript',
                folder: read.at.repo,
                repository: { root: 'alpha', dir: read.at.repo },
                deck: 'present',
                venueId: 'jmlr',
                collaborators: ['rivera']
            });
            expect(alpha.root).toBeUndefined();
            expect(alpha.file).toBe(join(read.at.repo, MANIFEST_FILE));
            expect(idsOf(read).personal).toEqual([]);
        }
    },
    {
        name: 'a repository with tier archive as a project of the archive board, its type its own',
        entries: (at) => entry(at, 'archive'),
        manifest: 'title: Alpha\ntype: published\n',
        check: (read) => {
            expect(read.snapshot.entities.projects.alpha).toMatchObject({
                tier: 'archive',
                type: 'published',
                repository: { root: 'alpha', dir: read.at.repo }
            });
            expect(read.snapshot.entities.projects.alpha.category).toBeUndefined();
            expect(idsOf(read).personal).toEqual([]);
        }
    },
    {
        name: 'a repository with tier coauthor as a project of the coauthor board',
        entries: (at) => entry(at, 'coauthor'),
        manifest: 'title: Alpha\ntype: in-prep\n',
        check: (read) => {
            expect(read.snapshot.entities.projects.alpha).toMatchObject({
                tier: 'coauthor',
                type: 'in-prep'
            });
        }
    },
    {
        name: 'a repository with tier personal as a side project',
        entries: (at) => entry(at, 'personal'),
        manifest: MANUSCRIPT,
        check: (read) => {
            expect(idsOf(read)).toEqual({ projects: HUB_IDS, personal: ['root:alpha'] });
        }
    },
    {
        name: 'a repository with no tier as a side project',
        entries: (at) => entry(at),
        manifest: MANUSCRIPT,
        check: (read) => {
            expect(idsOf(read)).toEqual({ projects: HUB_IDS, personal: ['root:alpha'] });
        }
    },
    ...BAD_TYPES.map(([name, line, finding]): Row => ({
        name: `tier projects with ${name} as a side project, with a finding on the type`,
        entries: (at) => entry(at, 'projects'),
        manifest: `title: Alpha\n${line}\n`,
        check: (read) => {
            const message =
                finding === 'repository_type_unknown'
                    ? said(finding, 'idea2', 'projects')
                    : said(finding);
            sideWithFinding(read, 'type', join(read.at.repo, MANIFEST_FILE), message);
        }
    })),
    {
        name: 'tier projects on the id of a hub project as a side project, with a finding on the entry',
        entries: (at) => [{ key: 'tensor-spark', dir: at.repo, tier: 'projects' }],
        manifest: MANUSCRIPT,
        check: (read) => {
            const kept = read.snapshot.entities.projects['tensor-spark'];
            expect(kept.repository).toBeUndefined();
            expect(kept.folder).toBe('projects/ideas/tensor-spark');
            expect(idsOf(read).personal).toEqual(['root:tensor-spark']);
            expect(findingsOn(read, 'tensor-spark', read.at.rootsFile)).toEqual([
                said('repository_id_taken')
            ]);
        }
    },
    {
        name: 'tier coauthor with no .oculus/project.yml as a finding on the entry and no project',
        entries: (at) => entry(at, 'coauthor'),
        manifest: null,
        check: (read) => {
            expect(idsOf(read)).toEqual({ projects: HUB_IDS, personal: [] });
            expect(findingsOn(read, 'alpha', read.at.rootsFile)).toEqual([
                said('repository_no_manifest')
            ]);
        }
    },
    {
        name: 'a tier no scan rule carries as a side project, with a finding on the entry',
        entries: (at) => entry(at, 'coauthor'),
        manifest: MANUSCRIPT,
        merged: {
            scan: (MERGED.scan as { tier?: string }[]).filter((rule) => rule.tier !== 'coauthor')
        },
        check: (read) => {
            expect(idsOf(read).personal).toEqual(['root:alpha']);
            expect(findingsOn(read, 'alpha', read.at.rootsFile)).toEqual([
                said('repository_tier_no_rule', 'coauthor')
            ]);
        }
    },
    {
        name: 'a second hub that lists a repository with tier projects as no project of either hub',
        entries: () => [],
        second: (at) => [{ key: 'gamma', dir: at.repo, tier: 'projects' }],
        manifest: MANUSCRIPT,
        check: (read) => {
            const labs = HUB_IDS.map((id) => `lab:${id}`);
            expect(idsOf(read)).toEqual({ projects: [...HUB_IDS, ...labs].sort(), personal: [] });
        }
    },
    ...[
        ['the hub itself', (at: Places) => at.hub],
        ['a folder inside the hub', (at: Places) => join(at.hub, 'projects/active/loewner')],
        ['a link to a hub project folder', (at: Places) => at.hubLink]
    ].map(([name, dir]): Row => ({
        name: `tier projects on ${name as string} as no project`,
        entries: (at) => [
            { key: 'inner', dir: (dir as (at: Places) => string)(at), tier: 'projects' }
        ],
        manifest: MANUSCRIPT,
        check: (read) => {
            expect(idsOf(read)).toEqual({ projects: HUB_IDS, personal: [] });
        }
    })),
    ...[
        ['one directory under two keys', (at: Places) => at.repo],
        ['one directory under a key and a link', (at: Places) => at.repoLink]
    ].map(([name, dir]): Row => ({
        name: `tier projects on ${name as string} as one project, read under the first key`,
        entries: (at) => [
            { key: 'alpha', dir: at.repo, tier: 'projects' },
            { key: 'alpha2', dir: (dir as (at: Places) => string)(at), tier: 'projects' }
        ],
        manifest: MANUSCRIPT,
        check: (read) => {
            expect(idsOf(read)).toEqual({ projects: [...HUB_IDS, 'alpha'].sort(), personal: [] });
        }
    })),
    {
        name: 'a research root and a root added from a workspace of one directory as one research project',
        entries: (at) => [...entry(at, 'projects'), { key: 'added', dir: at.repo }],
        manifest: MANUSCRIPT,
        check: (read) => {
            expect(idsOf(read)).toEqual({ projects: [...HUB_IDS, 'alpha'].sort(), personal: [] });
        }
    },
    {
        name: 'a key beside a hub folder of the repository folder name as no folder-name finding',
        entries: (at) => entry(at, 'projects'),
        folder: 'beta',
        manifest: MANUSCRIPT,
        check: (read) => {
            expect(read.snapshot.entities.projects.alpha).toMatchObject({ folder: read.at.repo });
            expect(findingsOn(read, 'folder')).toEqual([]);
        }
    },
    {
        name: 'a key beside a hub folder of its own name as a side project, with a finding on the entry',
        entries: (at) => entry(at, 'projects'),
        manifest: MANUSCRIPT,
        hub: { 'projects/ideas/alpha/project.yml': 'title: Hub alpha\n' },
        check: (read) => {
            expect(read.snapshot.entities.projects.alpha.repository).toBeUndefined();
            expect(idsOf(read).personal).toEqual(['root:alpha']);
            expect(findingsOn(read, 'alpha', read.at.rootsFile)).toEqual([
                said('repository_id_taken')
            ]);
        }
    },
    {
        name: 'a manifest whose id is another as a project, with the id finding and its own id kept',
        entries: (at) => entry(at, 'projects'),
        manifest: 'id: other\ntitle: Alpha\ntype: manuscript\n',
        check: (read) => {
            const alpha = read.snapshot.entities.projects.alpha;
            expect(alpha).toBeDefined();
            expect(idsOf(read).personal).toEqual([]);
            expect(findingsOn(read, 'id', join(read.at.repo, MANIFEST_FILE))).toEqual([
                said('id_not_folder', '"other"', 'alpha')
            ]);
        }
    },
    {
        name: 'a hub project that names the repository in related and waiting-on without a finding',
        entries: (at) => entry(at, 'projects'),
        manifest: MANUSCRIPT,
        hub: {
            'projects/active/loewner/project.yml':
                'title: Loewner layers\nrelated: [alpha]\nwaiting-on: [alpha]\n'
        },
        check: (read) => {
            expect(findingsOn(read, 'related')).toEqual([]);
            expect(findingsOn(read, 'waiting-on')).toEqual([]);
            expect(read.snapshot.entities.projects.loewner).toMatchObject({
                relatedIds: ['alpha'],
                waitingOn: ['alpha']
            });
        }
    }
];

/** The hub, the repository and the links of a row planted. */
function plant(row: Row): Places {
    const hub = plantScratch('oculus-repository-hub-', { ...HUB_FILES, ...row.hub });
    const folder = row.folder ?? 'alpha';
    const parent = plantScratch(
        'oculus-repository-',
        row.manifest === null
            ? { [`${folder}/README.md`]: '# alpha\n' }
            : {
                  [`${folder}/${MANIFEST_FILE}`]: row.manifest,
                  [`${folder}/present/present.yml`]: 'slides: []\n',
                  [`${folder}/README.md`]: '# alpha\n'
              }
    );
    const at = {
        repo: join(parent, folder),
        hub,
        hubLink: join(parent, 'hub-link'),
        repoLink: join(parent, 'repo-link'),
        rootsFile: join(hub, '.oculus/config/sources.yml')
    };
    symlinkSync(join(hub, 'projects/ideas/beta'), at.hubLink);
    symlinkSync(at.repo, at.repoLink);
    return at;
}

/** A row read the way the watcher reads it: the roots read, the side roots chosen, the build. */
function read(row: Row): Read {
    const at = plant(row);
    const config = portfolioConfigFrom({ ...MERGED, ...row.merged, roots: row.entries(at) });
    const listed = readRoots(config.merged, 'sources.yml', at.hub).roots;
    const roots = repositoriesOf(listed, at.hub, configDir(engineDir()));
    const base = buildPortfolioWithSchemas(
        at.hub,
        config,
        0,
        roots,
        undefined,
        null,
        undefined,
        at.rootsFile
    );
    if (row.second === undefined) return { snapshot: base.snapshot, at };
    const lab = plantScratch('oculus-repository-lab-', {
        ...HUB_FILES,
        '.oculus/config/sources.yml': stringify({ roots: row.second(at) })
    });
    const others = [readSecondHub(engineDir(), { key: 'lab', dir: lab })];
    const built = joinHubs(base, { hub: at.hub, config }, others, 0, createChecker());
    return { snapshot: built.snapshot, at };
}

describe('a repository read as a research project of the first hub', () => {
    it.each(ROWS)('reads $name', (row) => {
        row.check(read(row));
    });
});
