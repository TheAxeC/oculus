// Layer 1, data tests. The scan and the workspace folders read into projects (readHubManifests
// through buildHubs and buildOneHub) against a synthetic hub in a temporary directory. Nothing
// outside it is read or written. A project is any folder holding a project.yml at its top or a
// .oculus/project.yml, whichever scan folder or workspace folder it lies in, and the manifest's own
// `tier` and `stage` say where it is shown.

import { symlinkSync } from 'node:fs';
import { basename, join } from 'node:path';
import { describe, expect } from 'vitest';
import { hubVocabOf, portfolioConfigFrom, readOtherHub } from '../../../../src/lib/data/index.ts';
import { buildHubs } from '../../../../src/lib/server/root/watch/build.ts';
import { buildOneHub } from '../../../fixtures/hubs/hub-build.ts';
import { readCollections } from '../../../../src/lib/data/sources/collections.ts';
import { engineDir, loadConfig, textCatalog } from '../../../../src/lib/data/sources/config.ts';
import { findingText } from '../../../../src/lib/data/helpers/finding-text.ts';
import { createChecker } from '../../../../src/lib/data/snapshot/schema/check.ts';
import type { PortfolioConfig, Snapshot } from '../../../../src/lib/data/model/index.ts';
import type { OpenWorkspace } from '../../../../src/lib/server/files/workspace/open.ts';
import { primaryConfig } from '../../../../src/lib/server/files/roots.ts';
import { it, plantFile, plantScratch } from '../../../fixtures/scratch.ts';
import { plantHub, workspaceWith, type FolderSpec } from '../../../fixtures/hubs/workspace.ts';

const MERGED = loadConfig(engineDir()).config;

/** The folders of a workspace the primary reads as projects, each other hub with its settings. */
function repositoriesOf(open: OpenWorkspace): ReturnType<typeof primaryConfig>['repositories'] {
    return primaryConfig(MERGED, open, (hub) => loadConfig(engineDir(), { hub })).repositories;
}

/**
 * The portfolio the watcher builds over the primary `hub` of the workspace `open`, read with
 * `config`, and the second hub `lab` when there is one.
 */
function built(
    hub: string,
    config: PortfolioConfig,
    open: OpenWorkspace,
    lab: string | null
): Snapshot {
    const portfolio = { ...config, repositories: repositoriesOf(open) };
    const others =
        lab === null
            ? []
            : [readOtherHub({ key: 'lab', dir: lab }, loadConfig(engineDir(), { hub: lab }))];
    const order = open.folders.map((one) => one.name);
    const primary = { key: 'hub', dir: hub, portfolio, workspace: null };
    return buildHubs({ primary, others, config, order }, 0, createChecker(), null).snapshot;
}

/** The hub every row is read over: two registries at oculus's own paths, and three projects. */
const HUB_FILES: Record<string, string> = {
    '.oculus/data/research/venues.yml':
        'entries:\n  - { id: jmlr, name: Journal of Machine Learning }\n',
    '.oculus/data/people/people.yml': 'entries:\n  - { key: rivera, name: Ana Rivera }\n',
    'projects/ideas/tensor-spark/project.yml': 'title: Tensor spark\ntier: projects\nstage: idea\n',
    'projects/ideas/beta/project.yml': 'title: Beta\ntier: projects\nstage: idea\n',
    'projects/active/loewner/project.yml': 'title: Loewner layers\ntier: projects\nstage: active\n'
};

/** A workspace folder's manifest: a personal project with a venue, a collaborator and a link. */
const PERSONAL =
    'title: Alpha\ntier: personal\nstage: building\nstatus:\n  chips: []\nlinks: [https://example.org]\nvenue_id: jmlr\ncollaborators: [rivera]\n';

const NESTED_FILE = '.oculus/project.yml';
const TOP_FILE = 'project.yml';

/** The ids of the hub's own projects, which no row removes unless it sets its own scan. */
const HUB_IDS = ['hub:beta', 'hub:loewner', 'hub:tensor-spark'];

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
    /** The workspace folder's manifest, or null for a folder with none. */
    manifest?: string | null;
    /** Where the folder's manifest lies, `nested` (`.oculus/project.yml`) unless a row says. */
    placement?: 'top' | 'nested' | 'both';
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

/** A `.git/config` in a folder whose `origin` is this address. */
function origin(dir: string, url: string): void {
    plantFile(dir, '.git/config', `[remote "origin"]\n\turl = ${url}\n`);
}

/** The folder `alpha` of the workspace, the repository. */
const entry = (at: Places): FolderSpec[] => [{ name: 'alpha', dir: at.repo }];

/** The ids of the projects a read holds. */
const idsOf = (read: Read): string[] => Object.keys(read.snapshot.entities.projects).sort();

/** The ids the hub holds besides these, sorted. */
const withHub = (...ids: string[]): string[] =>
    [...HUB_IDS, ...ids.map((id) => `hub:${id}`)].sort();

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
        name: 'a scan of the folder above the stages, each manifest with its own tier and stage, a category and no personal map',
        scan: [{ dir: 'projects' }, { dir: 'side-projects', optional: true }],
        hub: plain(
            ['projects/x/a/project.yml', 'tier: projects\nstage: idea\ntitle: A\n'],
            ['projects/b/project.yml', 'tier: archive\nstage: published\ntitle: B\n'],
            [
                'side-projects/c/project.yml',
                'tier: personal\nstage: running\ntitle: C\nstatus:\n  chips: []\n'
            ]
        ),
        check: (read) => {
            const { projects } = read.snapshot.entities;
            expect(idsOf(read)).toEqual(withHub('a', 'b', 'c'));
            expect(projects['hub:a']).toMatchObject({
                tier: 'projects',
                stage: 'idea',
                category: 'x',
                folder: 'projects/x/a',
                file: join(read.at.hub, 'projects/x/a/project.yml')
            });
            expect(projects['hub:b']).toMatchObject({ tier: 'archive', stage: 'published' });
            expect(projects['hub:b'].category).toBeUndefined();
            expect(projects['hub:c']).toMatchObject({
                tier: 'personal',
                stage: 'running',
                chips: []
            });
            expect(read.snapshot.entities).not.toHaveProperty('personal');
        }
    },
    {
        name: 'a folder with no manifest as a filing folder with no record of its own, and a project below it',
        hub: plain(['projects/ideas/d/e/project.yml', 'tier: projects\nstage: idea\n']),
        check: (read) => {
            expect(idsOf(read)).toEqual(withHub('e'));
            expect(read.snapshot.entities.projects['hub:e'].category).toBe('d');
        }
    },
    {
        name: 'a manifest inside a project as no project, and a link to a project folder not entered',
        hub: plain(
            ['projects/active/f/project.yml', 'tier: projects\nstage: active\n'],
            ['projects/active/f/code/project.yml', 'tier: projects\nstage: active\n'],
            ['projects/active/f/sub/project.yml', 'tier: projects\nstage: active\n']
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
            ['projects/ideas/.hidden/project.yml', 'tier: projects\nstage: idea\n'],
            ['projects/ideas/node_modules/pkg/project.yml', 'tier: projects\nstage: idea\n']
        ),
        check: (read) => {
            expect(idsOf(read)).toEqual(withHub());
        }
    },
    {
        name: 'two folders of one name as one project, the first in folder order, and one finding naming both files',
        hub: plain(
            ['projects/ideas/z/project.yml', 'tier: projects\nstage: idea\ntitle: First\n'],
            ['projects/archive/old/z/project.yml', 'tier: archive\nstage: dropped\ntitle: Second\n']
        ),
        check: (read) => {
            const first = join(read.at.hub, 'projects/ideas/z/project.yml');
            const second = join(read.at.hub, 'projects/archive/old/z/project.yml');
            expect(idsOf(read)).toEqual(withHub('z'));
            expect(read.snapshot.entities.projects['hub:z'].title).toBe('First');
            expect(findingsOn(read, 'id')).toEqual([said('id_twice', 'z', first, second)]);
            expect(findingsOn(read, 'id', second)).toHaveLength(1);
        }
    },
    {
        name: 'a scan entry on a project folder as that one project, its subfolders not read',
        scan: [{ dir: 'projects/x' }],
        hub: plain(
            ['projects/x/project.yml', 'tier: projects\nstage: active\ntitle: X\n'],
            ['projects/x/sub/project.yml', 'tier: projects\nstage: active\n']
        ),
        check: (read) => {
            expect(idsOf(read)).toEqual(['hub:x']);
            expect(read.snapshot.entities.projects['hub:x'].category).toBeUndefined();
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
        hub: plain(['projects/ideas/p/project.yml', 'tier: personal\nstage: idea\ntitle: P\n']),
        check: (read) => {
            expect(read.snapshot.entities.projects['hub:p']).toMatchObject({
                tier: 'personal',
                stage: 'idea'
            });
        }
    },
    {
        name: 'a repository whose manifest says personal as a personal project under the folder name, with its links',
        entries: entry,
        manifest: PERSONAL,
        check: (read) => {
            const alpha = read.snapshot.entities.projects['hub:alpha'];
            expect(alpha).toMatchObject({
                id: 'hub:alpha',
                tier: 'personal',
                stage: 'building',
                chips: [],
                links: ['https://example.org'],
                folder: read.at.repo,
                workspaceFolder: { root: 'alpha', dir: read.at.repo },
                deck: 'present',
                venueId: 'hub:jmlr',
                collaborators: ['hub:rivera']
            });
            expect(alpha.root).toBe('hub');
            expect(alpha.file).toBe(join(read.at.repo, NESTED_FILE));
            expect(idsOf(read)).toEqual(withHub('alpha'));
            expect(read.snapshot.entities).not.toHaveProperty('personal');
        }
    },
    {
        name: 'a repository whose manifest says coauthor as a project of the coauthor board',
        entries: entry,
        manifest: 'title: Alpha\ntier: coauthor\nstage: in-prep\n',
        check: (read) => {
            expect(read.snapshot.entities.projects['hub:alpha']).toMatchObject({
                tier: 'coauthor',
                stage: 'in-prep',
                workspaceFolder: { root: 'alpha', dir: read.at.repo }
            });
        }
    },
    {
        name: 'a scan folder holding a top project.yml in one folder and a .oculus/project.yml in another as two projects with no finding',
        scan: [{ dir: 'side-projects' }],
        hub: plain(
            ['side-projects/a/project.yml', 'title: A\ntier: personal\nstage: idea\n'],
            ['side-projects/b/.oculus/project.yml', 'title: B\ntier: personal\nstage: idea\n']
        ),
        check: (read) => {
            const { projects } = read.snapshot.entities;
            expect(Object.keys(projects).sort()).toEqual(['hub:a', 'hub:b']);
            expect(projects['hub:a'].file).toBe(join(read.at.hub, 'side-projects/a', TOP_FILE));
            expect(projects['hub:b'].file).toBe(join(read.at.hub, 'side-projects/b', NESTED_FILE));
            expect(projects['hub:b'].folder).toBe('side-projects/b');
            expect(
                read.snapshot.findings.filter((one) => one.file.includes('side-projects'))
            ).toEqual([]);
        }
    },
    {
        name: 'a workspace folder holding only a top project.yml as the project of its name',
        entries: entry,
        manifest: PERSONAL,
        placement: 'top',
        check: (read) => {
            const alpha = read.snapshot.entities.projects['hub:alpha'];
            expect(alpha).toMatchObject({
                id: 'hub:alpha',
                tier: 'personal',
                workspaceFolder: { root: 'alpha', dir: read.at.repo }
            });
            expect(alpha.file).toBe(join(read.at.repo, TOP_FILE));
            expect(findingsOn(read, '', 'alpha/project.yml')).toEqual([]);
        }
    },
    {
        name: 'a workspace folder holding both files as the project of its top file, with one finding naming both',
        entries: entry,
        manifest: PERSONAL,
        placement: 'both',
        check: (read) => {
            const alpha = read.snapshot.entities.projects['hub:alpha'];
            const top = join(read.at.repo, TOP_FILE);
            const nested = join(read.at.repo, NESTED_FILE);
            expect(alpha.title).toBe('Alpha');
            expect(alpha.file).toBe(top);
            expect(findingsOn(read, '', nested)).toEqual([said('both_files', top, nested)]);
            expect(read.snapshot.findings.filter((one) => one.file === top)).toEqual([]);
        }
    },
    {
        name: 'a hub that scans its own folder as no project of its own, with the projects below it read',
        scan: [{ dir: '.' }],
        hub: plain(['.oculus/project.yml', 'title: The hub\ntier: projects\nstage: idea\n']),
        check: (read) => {
            const ids = idsOf(read);
            expect(ids).toEqual(expect.arrayContaining(HUB_IDS));
            expect(ids).not.toContain(basename(read.at.hub));
            expect(
                Object.values(read.snapshot.entities.projects).map((one) => one.title)
            ).not.toContain('The hub');
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
            const labs = HUB_IDS.map((id) => id.replace('hub:', 'lab:'));
            expect(idsOf(read)).toEqual([...HUB_IDS, 'hub:alpha', ...labs].sort());
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
            'tier: projects\nstage: idea\ntitle: Hub alpha\n'
        ]),
        check: (read) => {
            const alpha = read.snapshot.entities.projects['hub:alpha'];
            expect(alpha.workspaceFolder).toBeUndefined();
            expect(alpha.folder).toBe('projects/ideas/alpha');
            expect(findingsOn(read, 'id', join(read.at.repo, NESTED_FILE))).toEqual([
                said(
                    'id_twice',
                    'alpha',
                    join(read.at.hub, 'projects/ideas/alpha/project.yml'),
                    join(read.at.repo, NESTED_FILE)
                )
            ]);
        }
    },
    {
        name: 'a manifest whose id is another as a project, with the id finding and its own id kept',
        entries: entry,
        manifest: 'id: other\ntitle: Alpha\ntier: personal\nstage: active\n',
        check: (read) => {
            expect(read.snapshot.entities.projects['hub:alpha']).toBeDefined();
            expect(findingsOn(read, 'id', join(read.at.repo, NESTED_FILE))).toEqual([
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
            'title: Loewner layers\ntier: projects\nstage: active\nrelated: [alpha]\nwaiting-on: [alpha]\n'
        ]),
        check: (read) => {
            expect(findingsOn(read, 'related')).toEqual([]);
            expect(findingsOn(read, 'waiting-on')).toEqual([]);
            expect(read.snapshot.entities.projects['hub:loewner']).toMatchObject({
                relatedIds: ['hub:alpha'],
                waitingOn: ['hub:alpha']
            });
        }
    },
    {
        name: 'a project folder that holds a code folder as having a code folder, and one that holds a file named code or nothing as having none',
        scan: [{ dir: 'side-projects' }],
        hub: plain(
            ['side-projects/p/project.yml', 'title: P\ntier: personal\nstage: active\n'],
            ['side-projects/p/code/main.py', 'print(1)\n'],
            ['side-projects/q/project.yml', 'title: Q\ntier: personal\nstage: active\n'],
            ['side-projects/q/code', 'a file, not a folder\n'],
            ['side-projects/r/project.yml', 'title: R\ntier: personal\nstage: active\n']
        ),
        check: (read) => {
            const { 'hub:p': p, 'hub:q': q, 'hub:r': r } = read.snapshot.entities.projects;
            expect(p.codeFolder).toBe(true);
            expect(q.codeFolder).toBeUndefined();
            expect(r.codeFolder).toBeUndefined();
        }
    },
    {
        name: "a workspace folder whose repository's origin is a hub project's repository url, as that project's clone: one project, the hub's, and no finding",
        scan: [{ dir: 'side-projects' }],
        entries: entry,
        placement: 'top',
        hub: plain([
            'side-projects/p/project.yml',
            'title: P\ntier: personal\nstage: active\nrepository:\n  url: https://github.com/theaxec/p\n'
        ]),
        setup: (at) => origin(at.repo, 'git@github.com:TheAxeC/p.git'),
        check: (read) => {
            expect(idsOf(read)).toEqual(['hub:p']);
            expect(read.snapshot.entities.projects['hub:p'].folder).toBe('side-projects/p');
            expect(read.snapshot.findings.filter((one) => one.file.includes('alpha'))).toEqual([]);
            expect(read.snapshot.findings.filter((one) => one.key === 'id')).toEqual([]);
        }
    },
    {
        name: "a workspace folder whose repository's origin is no project's url, as a project of its own",
        scan: [{ dir: 'side-projects' }],
        entries: entry,
        placement: 'top',
        hub: plain([
            'side-projects/p/project.yml',
            'title: P\ntier: personal\nstage: active\nrepository:\n  url: https://github.com/theaxec/p\n'
        ]),
        setup: (at) => origin(at.repo, 'https://github.com/theaxec/other'),
        check: (read) => {
            expect(idsOf(read)).toEqual(['hub:alpha', 'hub:p']);
        }
    },
    {
        name: "a scan folder whose repository's origin is another scan project's url, as that project's clone",
        scan: [{ dir: 'side-projects' }],
        hub: plain(
            [
                'side-projects/p/project.yml',
                'title: P\ntier: personal\nstage: active\nrepository:\n  url: ssh://git@github.com/theaxec/p\n'
            ],
            ['side-projects/c/project.yml', 'title: C\ntier: personal\nstage: active\n'],
            [
                'side-projects/c/.git/config',
                '[remote "origin"]\n\turl = https://github.com/TheAxeC/p.git\n'
            ]
        ),
        check: (read) => {
            expect(idsOf(read)).toEqual(['hub:p']);
            expect(read.snapshot.findings.filter((one) => one.file.includes('/c/'))).toEqual([]);
        }
    },
    {
        name: 'two scan folders that are clones of each other as one project, the first',
        scan: [{ dir: 'side-projects' }],
        hub: plain(
            [
                'side-projects/a/project.yml',
                'title: A\ntier: personal\nstage: active\nrepository:\n  url: https://example.org/o/r\n'
            ],
            ['side-projects/a/.git/config', '[remote "origin"]\n\turl = https://example.org/o/r\n'],
            [
                'side-projects/b/project.yml',
                'title: B\ntier: personal\nstage: active\nrepository:\n  url: https://example.org/o/r.git\n'
            ],
            ['side-projects/b/.git/config', '[remote "origin"]\n\turl = https://example.org/o/r\n']
        ),
        check: (read) => {
            expect(idsOf(read)).toEqual(['hub:a']);
        }
    },
    {
        name: 'two scan folders, one a linked worktree of the repository of the other, as one project read from the main checkout',
        scan: [{ dir: 'side-projects' }],
        hub: plain(
            [
                'side-projects/early/project.yml',
                'title: P\ntier: personal\nstage: active\nrepository:\n  url: https://example.org/o/p\n'
            ],
            [
                'side-projects/late/project.yml',
                'title: P\ntier: personal\nstage: active\nrepository:\n  url: https://example.org/o/p\n'
            ],
            [
                'side-projects/late/.git/config',
                '[remote "origin"]\n\turl = https://example.org/o/p\n'
            ],
            ['side-projects/late/.git/worktrees/early/commondir', '../..\n']
        ),
        // The worktree the walk meets first names its folder under the main checkout's .git by
        // its absolute path, as `git worktree add` writes it.
        setup: (at) => {
            const named = join(at.hub, 'side-projects/late/.git/worktrees/early');
            plantFile(at.hub, 'side-projects/early/.git', `gitdir: ${named}\n`);
        },
        check: (read) => {
            expect(idsOf(read)).toEqual(['hub:late']);
            expect(read.snapshot.entities.projects['hub:late'].file).toBe(
                join(read.at.hub, 'side-projects/late/project.yml')
            );
        }
    },
    {
        name: 'a project folder that is not a clone of anything with a repository block, as cloned nowhere until the watcher lists repositories',
        scan: [{ dir: 'side-projects' }],
        hub: plain([
            'side-projects/q/project.yml',
            'title: Q\ntier: personal\nstage: active\nrepository:\n  url: https://example.org/q\n'
        ]),
        check: (read) => {
            expect(read.snapshot.entities.projects['hub:q'].repository).toEqual({
                url: 'https://example.org/q',
                clones: []
            });
        }
    }
];

/** The hub, the repository and the link of a row planted. */
function plant(row: Row): Places {
    const hub = plantScratch('oculus-repository-hub-', { ...HUB_FILES, ...row.hub });
    const manifest = row.manifest === undefined ? PERSONAL : row.manifest;
    const placed: Record<string, string> =
        row.placement === 'top'
            ? { [`alpha/${TOP_FILE}`]: manifest ?? '' }
            : row.placement === 'both'
              ? {
                    [`alpha/${TOP_FILE}`]: manifest ?? '',
                    [`alpha/${NESTED_FILE}`]: 'title: Nested alpha\ntier: personal\nstage: idea\n'
                }
              : { [`alpha/${NESTED_FILE}`]: manifest ?? '' };
    const parent = plantScratch(
        'oculus-repository-',
        manifest === null
            ? { 'alpha/README.md': '# alpha\n' }
            : {
                  ...placed,
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
    return { snapshot: built(at.hub, config, open, lab), at };
}

describe("the scan and the manifest's own tier and stage", () => {
    it.each(ROWS)('reads $name', (row) => {
        row.check(read(row));
    });
});

/** The snapshot of a build joined with a second hub whose own `.oculus/config.yml` is this text. */
function joinedWith(
    sources: string,
    files: Record<string, string>
): { snapshot: Snapshot; lab: string } {
    const hub = plantScratch('oculus-unnamed-primary-', HUB_FILES);
    plantHub(hub);
    const lab = plantScratch('oculus-unnamed-lab-', {
        '.oculus/config.yml': sources,
        ...files
    });
    const config = portfolioConfigFrom(MERGED);
    const open = workspaceWith(
        [
            { name: 'hub', dir: hub },
            { name: 'lab', dir: lab }
        ],
        'hub'
    ).open();
    return { snapshot: built(hub, config, open, lab), lab };
}

describe('a hub reports only the files its own configuration names', () => {
    const PROJECTS = {
        'one/project.yml': 'title: One\ntier: personal\nstage: active\n',
        'two/project.yml': 'title: Two\ntier: personal\nstage: active\n'
    };

    it('raises no finding for a registry, collection or deck it inherits and does not hold', () => {
        const { snapshot, lab } = joinedWith('scan:\n  - { dir: . }\n', PROJECTS);
        expect(Object.keys(snapshot.entities.projects).sort()).toEqual(
            [...HUB_IDS, 'lab:one', 'lab:two'].sort()
        );
        expect(snapshot.findings.filter((one) => one.file.startsWith(lab))).toEqual([]);
    });

    it('raises the finding for a registry its own collections list names and does not hold', () => {
        const { snapshot, lab } = joinedWith(
            'scan:\n  - { dir: . }\ncollections:\n  - { key: venues, file: lists/venues.yml }\n',
            PROJECTS
        );
        expect(
            snapshot.findings
                .filter((one) => one.file.startsWith(lab))
                .map((one) => [one.file.slice(lab.length), one.message])
        ).toEqual([
            ['/lists/venues.yml', 'registry file does not exist'],
            ['/lists/venues.yml', 'collection file does not exist']
        ]);
    });

    it('reads a registry from the collections entry that names it and leaves the others unnamed', () => {
        const hub = plantScratch('oculus-collections-named-', {
            '.oculus/config.yml': 'collections:\n  - { key: venues, file: elsewhere/venues.yml }\n'
        });
        const { config, from } = loadConfig(engineDir(), { hub });
        const named = portfolioConfigFrom(config, from);
        const own = portfolioConfigFrom(MERGED);
        expect(named.registries.venues).toBe('elsewhere/venues.yml');
        expect(named.registries.people).toBe(own.registries.people);
        expect(named.registries.funding).toBe(own.registries.funding);
        expect(named.unnamed?.registries).toContain('people');
        expect(named.unnamed?.registries).not.toContain('venues');
    });

    it('reads a feed from the collections entry that names it, as no collection, and finds a named file that is not there', () => {
        const hub = plantScratch('oculus-collections-feed-', {
            '.oculus/config.yml':
                'collections:\n  - { key: radar, file: elsewhere/radar.yml }\n  - { key: leads, file: gone/leads.yml }\n',
            'elsewhere/radar.yml': 'meta:\n  last_run: the last pass\nentries: []\n'
        });
        const { config, from } = loadConfig(engineDir(), { hub });
        const portfolio = portfolioConfigFrom(config, from);
        expect(portfolio.feeds.radar).toBe('elsewhere/radar.yml');
        expect(portfolio.feeds.leads).toBe('gone/leads.yml');
        expect(portfolio.unnamed?.feeds).toEqual([]);
        const built = buildOneHub(hub, portfolio);
        expect(Object.keys(built.snapshot.entities.collections)).toEqual([]);
        expect(built.snapshot.entities.feeds.radar).toEqual({ lastRun: 'the last pass' });
        const missing = built.snapshot.findings.filter(
            (one) => one.file === join(hub, 'gone/leads.yml')
        );
        expect(missing.map((one) => one.message)).toEqual([
            findingText(textCatalog(config), 'findings.registries.file_missing')
        ]);
    });

    it.each([
        ['holds the file there', true],
        ['holds none', false]
    ])(
        "reads Literature from the engine's path when its list names none and it %s",
        (_name, held) => {
            const hub = plantScratch('oculus-collections-literature-', {
                '.oculus/config.yml': 'collections:\n  - { key: venues, file: lists/venues.yml }\n',
                'lists/venues.yml': 'entries: []\n',
                ...(held
                    ? {
                          '.oculus/data/literature/literature.yml':
                              'entries:\n  - { key: a24, title: A }\n'
                      }
                    : {})
            });
            const { config, from } = loadConfig(engineDir(), { hub });
            const portfolio = portfolioConfigFrom(config, from);
            const built = buildOneHub(hub, portfolio);
            const literature = built.snapshot.entities.collections.literature as
                { file: string; entries: { fields: Record<string, unknown> }[] } | undefined;
            expect({
                file: literature?.file,
                titles: literature?.entries.map((one) => one.fields.title),
                listed: hubVocabOf(hub, portfolio).collections.includes('literature'),
                findings: built.snapshot.findings.filter((one) =>
                    one.file.endsWith('literature.yml')
                )
            }).toEqual(
                held
                    ? {
                          file: join(hub, '.oculus/data/literature/literature.yml'),
                          titles: ['A'],
                          listed: true,
                          findings: []
                      }
                    : { file: undefined, titles: undefined, listed: false, findings: [] }
            );
        }
    );

    it('reads the first of two collections entries for one key and names the key in a finding', () => {
        const hub = plantScratch('oculus-collections-twice-', {
            '.oculus/config.yml':
                'collections:\n  - { key: venues, file: one.yml }\n  - { key: venues, file: two.yml }\n'
        });
        const { config, from } = loadConfig(engineDir(), { hub });
        const portfolio = portfolioConfigFrom(config, from);
        expect(portfolio.registries.venues).toBe('one.yml');
        const read = readCollections(hub, portfolio.collections, textCatalog(config));
        expect(read.findings.filter((one) => one.key === 'venues').map((one) => one.file)).toEqual([
            join(hub, 'two.yml')
        ]);
    });
});
