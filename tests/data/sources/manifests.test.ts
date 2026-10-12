// Layer 1, data tests. The scan and the repositories read into projects (readHubManifests through
// buildPortfolioWithSchemas) against a synthetic hub in a temporary directory. Nothing outside it
// is read or written. A project is any folder holding a project.yml, whichever folder or repository
// it lies in, and the manifest's own `tier` and `type` say where it is shown.

import { symlinkSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect } from 'vitest';
import {
    buildPortfolioWithSchemas,
    joinHubs,
    portfolioConfigFrom,
    readOtherHub
} from '../../../src/lib/data/index.ts';
import { engineDir, loadConfig, textCatalog } from '../../../src/lib/data/sources/config.ts';
import { findingText } from '../../../src/lib/data/helpers/finding-text.ts';
import { createChecker } from '../../../src/lib/data/snapshot/schema/check.ts';
import type { Snapshot } from '../../../src/lib/data/model/index.ts';
import { repositoriesOf } from '../../../src/lib/server/files/roots.ts';
import { it, plantScratch } from '../../fixtures/scratch.ts';
import { plantHub, workspaceWith, type FolderSpec } from '../../fixtures/hubs/workspace.ts';

const MERGED = loadConfig(engineDir()).config;

/** The hub every row is read over: two registries and three projects. */
const HUB_FILES: Record<string, string> = {
    'registries/venues.yml': 'entries:\n  - { id: jmlr, name: Journal of Machine Learning }\n',
    'registries/people.yml': 'entries:\n  - { key: rivera, name: Ana Rivera }\n',
    'projects/ideas/tensor-spark/project.yml': 'title: Tensor spark\ntier: projects\ntype: idea\n',
    'projects/ideas/beta/project.yml': 'title: Beta\ntier: projects\ntype: idea\n',
    'projects/active/loewner/project.yml': 'title: Loewner layers\ntier: projects\ntype: active\n'
};

/** A repository's manifest: a personal project with a venue, a collaborator and a link. */
const PERSONAL =
    'title: Alpha\ntier: personal\ntype: active\nstatus:\n  chips: [building]\nlinks: [https://example.org]\nvenue_id: jmlr\ncollaborators: [rivera]\n';

const MANIFEST_FILE = '.oculus/project.yml';

/** The ids of the hub's own projects, which no row removes unless it sets its own scan. */
const HUB_IDS = ['beta', 'loewner', 'tensor-spark'];

/** Where a row's folders are. */
type Places = {
    /** The repository folder. */
    repo: string;
    hub: string;
    /** A symbolic link to the repository folder. */
    repoLink: string;
};

type Row = {
    name: string;
    /** The scan list the row is read with, the engine's seven folders unless a row sets its own. */
    scan?: unknown[];
    /** The folders of the workspace besides the hub, which is its primary. */
    entries?: (at: Places) => FolderSpec[];
    /** The repository's `.oculus/project.yml`, or null for a repository with none. */
    manifest?: string | null;
    /** Files of the hub besides HUB_FILES. */
    hub?: Record<string, string>;
    /** Made after the folders are planted: a link, for a row about links. */
    setup?: (at: Places) => void;
    /** Whether the workspace lists a second hub `lab`, a copy of the hub's files. */
    second?: boolean;
    check: (read: Read) => void;
};

/** What a row is read into: the snapshot of the build and the places of the row. */
type Read = { snapshot: Snapshot; at: Places };

/** The folder `alpha` of the workspace, the repository. */
const entry = (at: Places): FolderSpec[] => [{ name: 'alpha', dir: at.repo }];

/** The ids of the projects a read holds. */
const idsOf = (read: Read): string[] => Object.keys(read.snapshot.entities.projects).sort();

/** The ids the hub holds besides these, sorted. */
const withHub = (...ids: string[]): string[] => [...HUB_IDS, ...ids].sort();

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

/** A file of the hub's projects folder written in a row. */
function plain(...files: [string, string][]): Record<string, string> {
    return Object.fromEntries(files);
}

const ROWS: Row[] = [
    {
        name: 'a scan of the folder above the stages, each manifest with its own tier and type, a category and no personal map',
        scan: [{ dir: 'projects' }, { dir: 'side-projects', optional: true }],
        hub: plain(
            ['projects/x/a/project.yml', 'tier: projects\ntype: idea\ntitle: A\n'],
            ['projects/b/project.yml', 'tier: archive\ntype: published\ntitle: B\n'],
            [
                'side-projects/c/project.yml',
                'tier: personal\ntype: active\ntitle: C\nstatus:\n  chips: [running]\n'
            ]
        ),
        check: (read) => {
            const { projects } = read.snapshot.entities;
            expect(idsOf(read)).toEqual(withHub('a', 'b', 'c'));
            expect(projects.a).toMatchObject({
                tier: 'projects',
                type: 'idea',
                category: 'x',
                folder: 'projects/x/a',
                file: join(read.at.hub, 'projects/x/a/project.yml')
            });
            expect(projects.b).toMatchObject({ tier: 'archive', type: 'published' });
            expect(projects.b.category).toBeUndefined();
            expect(projects.c).toMatchObject({
                tier: 'personal',
                type: 'active',
                chips: ['running']
            });
            expect(read.snapshot.entities).not.toHaveProperty('personal');
        }
    },
    {
        name: 'a folder with no manifest as a filing folder with no record of its own, and a project below it',
        hub: plain(['projects/ideas/d/e/project.yml', 'tier: projects\ntype: idea\n']),
        check: (read) => {
            expect(idsOf(read)).toEqual(withHub('e'));
            expect(read.snapshot.entities.projects.e.category).toBe('d');
        }
    },
    {
        name: 'a manifest inside a project as no project, and a link to a project folder not entered',
        hub: plain(
            ['projects/active/f/project.yml', 'tier: projects\ntype: active\n'],
            ['projects/active/f/code/project.yml', 'tier: projects\ntype: active\n'],
            ['projects/active/f/sub/project.yml', 'tier: projects\ntype: active\n']
        ),
        setup: (at) => {
            symlinkSync(join(at.hub, 'projects/ideas/beta'), join(at.hub, 'projects/ideas/linked'));
        },
        check: (read) => {
            expect(idsOf(read)).toEqual(withHub('f'));
        }
    },
    {
        name: 'a dot folder and node_modules as folders the walk does not enter',
        hub: plain(
            ['projects/ideas/.hidden/project.yml', 'tier: projects\ntype: idea\n'],
            ['projects/ideas/node_modules/pkg/project.yml', 'tier: projects\ntype: idea\n']
        ),
        check: (read) => {
            expect(idsOf(read)).toEqual(withHub());
        }
    },
    {
        name: 'two folders of one name as one project, the first in folder order, and one finding naming both files',
        hub: plain(
            ['projects/ideas/z/project.yml', 'tier: projects\ntype: idea\ntitle: First\n'],
            ['projects/archive/old/z/project.yml', 'tier: archive\ntype: dropped\ntitle: Second\n']
        ),
        check: (read) => {
            const first = join(read.at.hub, 'projects/ideas/z/project.yml');
            const second = join(read.at.hub, 'projects/archive/old/z/project.yml');
            expect(idsOf(read)).toEqual(withHub('z'));
            expect(read.snapshot.entities.projects.z.title).toBe('First');
            expect(findingsOn(read, 'id')).toEqual([said('id_twice', 'z', first, second)]);
            expect(findingsOn(read, 'id', second)).toHaveLength(1);
        }
    },
    {
        name: 'a scan entry on a project folder as that one project, its subfolders not read',
        scan: [{ dir: 'projects/x' }],
        hub: plain(
            ['projects/x/project.yml', 'tier: projects\ntype: active\ntitle: X\n'],
            ['projects/x/sub/project.yml', 'tier: projects\ntype: active\n']
        ),
        check: (read) => {
            expect(idsOf(read)).toEqual(['x']);
            expect(read.snapshot.entities.projects.x.category).toBeUndefined();
        }
    },
    {
        name: 'a scan entry above another one as each project read once, with no duplicate finding',
        scan: [{ dir: 'projects' }, { dir: 'projects/ideas' }],
        check: (read) => {
            expect(idsOf(read)).toEqual(withHub());
            expect(findingsOn(read, 'id')).toEqual([]);
        }
    },
    {
        name: 'a manifest with the tier personal inside the ideas folder as a personal project',
        hub: plain(['projects/ideas/p/project.yml', 'tier: personal\ntype: idea\ntitle: P\n']),
        check: (read) => {
            expect(read.snapshot.entities.projects.p).toMatchObject({
                tier: 'personal',
                type: 'idea'
            });
        }
    },
    {
        name: 'a repository whose manifest says personal as a personal project under the folder name, with its links',
        entries: entry,
        manifest: PERSONAL,
        check: (read) => {
            const alpha = read.snapshot.entities.projects.alpha;
            expect(alpha).toMatchObject({
                id: 'alpha',
                tier: 'personal',
                type: 'active',
                chips: ['building'],
                links: ['https://example.org'],
                folder: read.at.repo,
                repository: { root: 'alpha', dir: read.at.repo },
                deck: 'present',
                venueId: 'jmlr',
                collaborators: ['rivera']
            });
            expect(alpha.root).toBeUndefined();
            expect(alpha.file).toBe(join(read.at.repo, MANIFEST_FILE));
            expect(idsOf(read)).toEqual(withHub('alpha'));
            expect(read.snapshot.entities).not.toHaveProperty('personal');
        }
    },
    {
        name: 'a repository whose manifest says coauthor as a project of the coauthor board',
        entries: entry,
        manifest: 'title: Alpha\ntier: coauthor\ntype: in-prep\n',
        check: (read) => {
            expect(read.snapshot.entities.projects.alpha).toMatchObject({
                tier: 'coauthor',
                type: 'in-prep',
                repository: { root: 'alpha', dir: read.at.repo }
            });
        }
    },
    {
        name: 'a folder with no manifest, and one whose directory is not on this machine, as no project and no finding',
        entries: (at) => [
            { name: 'alpha', dir: at.repo },
            { name: 'gone', dir: join(at.repo, 'nowhere') }
        ],
        manifest: null,
        check: (read) => {
            expect(idsOf(read)).toEqual(withHub());
            expect(findingsOn(read, 'alpha')).toEqual([]);
            expect(findingsOn(read, 'gone')).toEqual([]);
        }
    },
    {
        name: 'a folder with a manifest as a project of the primary hub alone, never of a second hub',
        entries: entry,
        manifest: PERSONAL,
        second: true,
        check: (read) => {
            const labs = HUB_IDS.map((id) => `lab:${id}`);
            expect(idsOf(read)).toEqual([...HUB_IDS, 'alpha', ...labs].sort());
        }
    },
    {
        name: 'one directory under two names, or under a name and a link, as one project read under the first name',
        entries: (at) => [
            { name: 'alpha', dir: at.repo },
            { name: 'alpha2', dir: at.repo },
            { name: 'alpha3', dir: at.repoLink }
        ],
        manifest: PERSONAL,
        check: (read) => {
            expect(idsOf(read)).toEqual(withHub('alpha'));
        }
    },
    {
        name: 'a folder name equal to a project folder of the scan as the folder project, with one finding naming both manifests',
        entries: entry,
        manifest: PERSONAL,
        hub: plain([
            'projects/ideas/alpha/project.yml',
            'tier: projects\ntype: idea\ntitle: Hub alpha\n'
        ]),
        check: (read) => {
            const alpha = read.snapshot.entities.projects.alpha;
            expect(alpha.repository).toBeUndefined();
            expect(alpha.folder).toBe('projects/ideas/alpha');
            expect(findingsOn(read, 'id', join(read.at.repo, MANIFEST_FILE))).toEqual([
                said(
                    'id_twice',
                    'alpha',
                    join(read.at.hub, 'projects/ideas/alpha/project.yml'),
                    join(read.at.repo, MANIFEST_FILE)
                )
            ]);
        }
    },
    {
        name: 'a manifest whose id is another as a project, with the id finding and its own id kept',
        entries: entry,
        manifest: 'id: other\ntitle: Alpha\ntier: personal\ntype: active\n',
        check: (read) => {
            expect(read.snapshot.entities.projects.alpha).toBeDefined();
            expect(findingsOn(read, 'id', join(read.at.repo, MANIFEST_FILE))).toEqual([
                said('id_not_folder', '"other"', 'alpha')
            ]);
        }
    },
    {
        name: 'a hub project that names the repository in related and waiting-on without a finding',
        entries: entry,
        manifest: PERSONAL,
        hub: plain([
            'projects/active/loewner/project.yml',
            'title: Loewner layers\ntier: projects\ntype: active\nrelated: [alpha]\nwaiting-on: [alpha]\n'
        ]),
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

/** The hub, the repository and the link of a row planted. */
function plant(row: Row): Places {
    const hub = plantScratch('oculus-repository-hub-', { ...HUB_FILES, ...row.hub });
    const manifest = row.manifest === undefined ? PERSONAL : row.manifest;
    const parent = plantScratch(
        'oculus-repository-',
        manifest === null
            ? { 'alpha/README.md': '# alpha\n' }
            : {
                  [`alpha/${MANIFEST_FILE}`]: manifest,
                  'alpha/present/present.yml': 'slides: []\n',
                  'alpha/README.md': '# alpha\n'
              }
    );
    const at = { repo: join(parent, 'alpha'), hub, repoLink: join(parent, 'repo-link') };
    symlinkSync(at.repo, at.repoLink);
    row.setup?.(at);
    return at;
}

/** A row read the way the watcher reads it: the workspace opened, the folders chosen, the build. */
function read(row: Row): Read {
    const at = plant(row);
    plantHub(at.hub);
    const merged = { ...MERGED, ...(row.scan === undefined ? {} : { scan: row.scan }) };
    const config = portfolioConfigFrom(merged);
    const lab =
        row.second === true ? plantHub(plantScratch('oculus-repository-lab-', HUB_FILES)) : null;
    const folders: FolderSpec[] = [
        { name: 'hub', dir: at.hub },
        ...(lab === null ? [] : [{ name: 'lab', dir: lab }]),
        ...(row.entries?.(at) ?? [])
    ];
    const open = workspaceWith(folders, 'hub').open();
    const base = buildPortfolioWithSchemas(
        at.hub,
        config,
        0,
        repositoriesOf(open),
        undefined,
        null,
        'hub'
    );
    if (lab === null) return { snapshot: base.snapshot, at };
    const others = [readOtherHub(engineDir(), { key: 'lab', dir: lab })];
    const built = joinHubs(base, { hub: at.hub, name: 'hub', config }, others, 0, createChecker());
    return { snapshot: built.snapshot, at };
}

describe("the scan and the manifest's own tier and type", () => {
    it.each(ROWS)('reads $name', (row) => {
        row.check(read(row));
    });
});
