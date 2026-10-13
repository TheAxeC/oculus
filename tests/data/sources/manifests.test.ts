// Layer 1, data tests. The scan and the workspace folders read into projects (readHubManifests
// through buildPortfolioWithSchemas) against a synthetic hub in a temporary directory. Nothing
// outside it is read or written. A project is any folder holding a project.yml at its top or a
// .oculus/project.yml, whichever scan folder or workspace folder it lies in, and the manifest's own
// `tier` and `type` say where it is shown.

import { symlinkSync } from 'node:fs';
import { basename, join } from 'node:path';
import { describe, expect } from 'vitest';
import {
    buildPortfolioWithSchemas,
    joinHubs,
    portfolioConfigFrom,
    readOtherHub
} from '../../../src/lib/data/index.ts';
import { readCollections } from '../../../src/lib/data/sources/collections.ts';
import { engineDir, loadConfig, textCatalog } from '../../../src/lib/data/sources/config.ts';
import { findingText } from '../../../src/lib/data/helpers/finding-text.ts';
import { createChecker } from '../../../src/lib/data/snapshot/schema/check.ts';
import type { Snapshot } from '../../../src/lib/data/model/index.ts';
import { placeClones } from '../../../src/lib/data/sources/clones.ts';
import { originOf, sameAddress } from '../../../src/lib/data/sources/origin.ts';
import { repositoriesOf } from '../../../src/lib/server/files/roots.ts';
import { it, plantFile, plantScratch, test } from '../../fixtures/scratch.ts';
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

/** A workspace folder's manifest: a personal project with a venue, a collaborator and a link. */
const PERSONAL =
    'title: Alpha\ntier: personal\ntype: active\nstatus:\n  chips: [building]\nlinks: [https://example.org]\nvenue_id: jmlr\ncollaborators: [rivera]\n';

const NESTED_FILE = '.oculus/project.yml';
const TOP_FILE = 'project.yml';

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
                workspaceFolder: { root: 'alpha', dir: read.at.repo },
                deck: 'present',
                venueId: 'jmlr',
                collaborators: ['rivera']
            });
            expect(alpha.root).toBeUndefined();
            expect(alpha.file).toBe(join(read.at.repo, NESTED_FILE));
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
                workspaceFolder: { root: 'alpha', dir: read.at.repo }
            });
        }
    },
    {
        name: 'a scan folder holding a top project.yml in one folder and a .oculus/project.yml in another as two projects with no finding',
        scan: [{ dir: 'side-projects' }],
        hub: plain(
            ['side-projects/a/project.yml', 'title: A\ntier: personal\ntype: idea\n'],
            ['side-projects/b/.oculus/project.yml', 'title: B\ntier: personal\ntype: idea\n']
        ),
        check: (read) => {
            const { projects } = read.snapshot.entities;
            expect(Object.keys(projects).sort()).toEqual(['a', 'b']);
            expect(projects.a.file).toBe(join(read.at.hub, 'side-projects/a', TOP_FILE));
            expect(projects.b.file).toBe(join(read.at.hub, 'side-projects/b', NESTED_FILE));
            expect(projects.b.folder).toBe('side-projects/b');
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
            const alpha = read.snapshot.entities.projects.alpha;
            expect(alpha).toMatchObject({
                id: 'alpha',
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
            const alpha = read.snapshot.entities.projects.alpha;
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
        hub: plain(['.oculus/project.yml', 'title: The hub\ntier: projects\ntype: idea\n']),
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
        manifest: 'id: other\ntitle: Alpha\ntier: personal\ntype: active\n',
        check: (read) => {
            expect(read.snapshot.entities.projects.alpha).toBeDefined();
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
    },
    {
        name: 'a project folder that holds a code folder as having a code folder, and one that holds a file named code or nothing as having none',
        scan: [{ dir: 'side-projects' }],
        hub: plain(
            ['side-projects/p/project.yml', 'title: P\ntier: personal\ntype: active\n'],
            ['side-projects/p/code/main.py', 'print(1)\n'],
            ['side-projects/q/project.yml', 'title: Q\ntier: personal\ntype: active\n'],
            ['side-projects/q/code', 'a file, not a folder\n'],
            ['side-projects/r/project.yml', 'title: R\ntier: personal\ntype: active\n']
        ),
        check: (read) => {
            const { p, q, r } = read.snapshot.entities.projects;
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
            'title: P\ntier: personal\ntype: active\nrepository:\n  url: https://github.com/theaxec/p\n'
        ]),
        setup: (at) => origin(at.repo, 'git@github.com:TheAxeC/p.git'),
        check: (read) => {
            expect(idsOf(read)).toEqual(['p']);
            expect(read.snapshot.entities.projects.p.folder).toBe('side-projects/p');
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
            'title: P\ntier: personal\ntype: active\nrepository:\n  url: https://github.com/theaxec/p\n'
        ]),
        setup: (at) => origin(at.repo, 'https://github.com/theaxec/other'),
        check: (read) => {
            expect(idsOf(read)).toEqual(['alpha', 'p']);
        }
    },
    {
        name: "a scan folder whose repository's origin is another scan project's url, as that project's clone",
        scan: [{ dir: 'side-projects' }],
        hub: plain(
            [
                'side-projects/p/project.yml',
                'title: P\ntier: personal\ntype: active\nrepository:\n  url: ssh://git@github.com/theaxec/p\n'
            ],
            ['side-projects/c/project.yml', 'title: C\ntier: personal\ntype: active\n'],
            [
                'side-projects/c/.git/config',
                '[remote "origin"]\n\turl = https://github.com/TheAxeC/p.git\n'
            ]
        ),
        check: (read) => {
            expect(idsOf(read)).toEqual(['p']);
            expect(read.snapshot.findings.filter((one) => one.file.includes('/c/'))).toEqual([]);
        }
    },
    {
        name: 'two scan folders that are clones of each other as one project, the first',
        scan: [{ dir: 'side-projects' }],
        hub: plain(
            [
                'side-projects/a/project.yml',
                'title: A\ntier: personal\ntype: active\nrepository:\n  url: https://example.org/o/r\n'
            ],
            ['side-projects/a/.git/config', '[remote "origin"]\n\turl = https://example.org/o/r\n'],
            [
                'side-projects/b/project.yml',
                'title: B\ntier: personal\ntype: active\nrepository:\n  url: https://example.org/o/r.git\n'
            ],
            ['side-projects/b/.git/config', '[remote "origin"]\n\turl = https://example.org/o/r\n']
        ),
        check: (read) => {
            expect(idsOf(read)).toEqual(['a']);
        }
    },
    {
        name: 'a project folder that is not a clone of anything with a repository block, as cloned nowhere until the watcher lists repositories',
        scan: [{ dir: 'side-projects' }],
        hub: plain([
            'side-projects/q/project.yml',
            'title: Q\ntier: personal\ntype: active\nrepository:\n  url: https://example.org/q\n'
        ]),
        check: (read) => {
            expect(read.snapshot.entities.projects.q.repository).toEqual({
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
                    [`alpha/${NESTED_FILE}`]: 'title: Nested alpha\ntier: personal\ntype: idea\n'
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
    const base = buildPortfolioWithSchemas(
        hub,
        config,
        0,
        repositoriesOf(open),
        undefined,
        null,
        'hub'
    );
    const others = [readOtherHub(engineDir(), { key: 'lab', dir: lab })];
    const built = joinHubs(base, { hub, name: 'hub', config }, others, 0, createChecker());
    return { snapshot: built.snapshot, lab };
}

describe('a hub reports only the files its own configuration names', () => {
    const PROJECTS = {
        'one/project.yml': 'title: One\ntier: personal\ntype: active\n',
        'two/project.yml': 'title: Two\ntier: personal\ntype: active\n'
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
            'scan:\n  - { dir: . }\ncollections:\n  - { key: venues, file: registries/venues.yml }\n',
            PROJECTS
        );
        expect(
            snapshot.findings
                .filter((one) => one.file.startsWith(lab))
                .map((one) => [one.file.slice(lab.length), one.message])
        ).toEqual([
            ['/registries/venues.yml', 'registry file does not exist'],
            ['/registries/venues.yml', 'collection file does not exist']
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

describe('the address of a repository', () => {
    const SAME = [
        ['https://github.com/TheAxeC/x', 'https://github.com/theaxec/x.git'],
        ['https://github.com/theaxec/x', 'git@github.com:TheAxeC/x.git'],
        ['git@github.com:theaxec/x.git', 'ssh://git@github.com/theaxec/x'],
        ['https://GitLab.example.org/o/r.git', 'git@gitlab.example.org:o/r'],
        ['https://example.org/o/r/', 'https://example.org/o/r'],
        ['ssh://git@Example.org:22/o/r.git', 'https://example.org/o/r'],
        ['git@GitHub.com:TheAxeC/X.git', 'https://github.com/theaxec/x']
    ];
    test.for(SAME)('%s and %s are one repository', ([a, b]) => {
        expect(sameAddress(a, b)).toBe(true);
    });

    const DIFFERENT = [
        ['https://example.org/o/R', 'https://example.org/o/r'],
        ['https://example.org/o/r', 'https://other.example.org/o/r'],
        ['https://github.com/o/r', 'https://github.com/o/s'],
        ['/some/folder', 'https://github.com/o/r'],
        ['not an address', 'not an address']
    ];
    test.for(DIFFERENT)('%s and %s are two', ([a, b]) => {
        expect(sameAddress(a, b)).toBe(false);
    });
});

describe('the origin of a folder', () => {
    const CONFIG =
        '[core]\n\tbare = false\n[remote "upstream"]\n\turl = https://example.org/u\n[remote "origin"]\n\turl = https://example.org/o\n\tfetch = +refs/heads/*:refs/remotes/origin/*\n';

    test("is the url of the origin remote of the folder's .git", () => {
        const dir = plantScratch('oculus-origin-', { '.git/config': CONFIG });
        expect(originOf(dir)).toBe('https://example.org/o');
    });

    test('is read from the common folder of a worktree whose .git is a file', () => {
        const dir = plantScratch('oculus-origin-tree-', {
            'main/.git/config': CONFIG,
            'main/.git/worktrees/w/commondir': '../..\n',
            'w/.git': 'gitdir: ../main/.git/worktrees/w\n'
        });
        expect(originOf(join(dir, 'w'))).toBe('https://example.org/o');
    });

    const NONE: { name: string; files: Record<string, string> }[] = [
        { name: 'a folder with no .git', files: { 'a.txt': 'a\n' } },
        {
            name: 'a repository with no origin',
            files: { '.git/config': '[core]\n\tbare = false\n' }
        },
        {
            name: 'a repository whose only remote is not origin',
            files: { '.git/config': '[remote "upstream"]\n\turl = https://example.org/u\n' }
        },
        { name: 'a .git file that names no folder', files: { '.git': 'nothing\n' } }
    ];
    test.for(NONE)('is none for $name', ({ files }) => {
        expect(originOf(plantScratch('oculus-origin-none-', files))).toBeNull();
    });
});

describe('the clones of a project', () => {
    /**
     * A built snapshot over a hub holding the projects `x` (a url) and `y` (none), and the repos.
     */
    function placed(origins: Record<string, string>) {
        const hub = plantScratch('oculus-clones-hub-', {
            'projects/ideas/x/project.yml':
                'title: X\ntier: projects\ntype: idea\nrepository:\n  url: https://github.com/theaxec/x\n',
            'projects/ideas/y/project.yml': 'title: Y\ntier: projects\ntype: idea\n'
        });
        plantHub(hub);
        const folders = Object.fromEntries(
            Object.entries(origins).map(([name, url]) => [
                `${name}/.git/config`,
                `[remote "origin"]\n\turl = ${url}\n`
            ])
        );
        const repos = plantScratch('oculus-clones-repos-', folders);
        const dirs = Object.keys(origins).map((name) => join(repos, name));
        const { snapshot } = buildPortfolioWithSchemas(hub, portfolioConfigFrom(MERGED), 0, []);
        placeClones(snapshot, dirs, textCatalog(MERGED));
        return { snapshot, dirs };
    }

    it('is the repository whose origin is the url however it is written, and none for a project with no url', () => {
        const { snapshot, dirs } = placed({
            a: 'git@github.com:TheAxeC/x.git',
            b: 'https://github.com/theaxec/other'
        });
        expect(snapshot.entities.projects.x.repository?.clones).toEqual([dirs[0]]);
        expect(snapshot.entities.projects.y.repository).toBeUndefined();
        expect(snapshot.findings.filter((one) => one.key === 'repository.url')).toEqual([]);
    });

    it('is empty for a project no repository has the url of', () => {
        const { snapshot } = placed({ a: 'https://github.com/theaxec/other' });
        expect(snapshot.entities.projects.x.repository?.clones).toEqual([]);
    });

    it('lists two clones in the order the repositories are listed, with one finding on the project naming both', () => {
        const { snapshot, dirs } = placed({
            a: 'git@github.com:TheAxeC/x.git',
            b: 'https://github.com/theaxec/x'
        });
        expect(snapshot.entities.projects.x.repository?.clones).toEqual(dirs);
        expect(findingsOn({ snapshot, at: {} as Places }, 'repository.url')).toEqual([
            said('cloned_twice', 'https://github.com/theaxec/x', dirs.join(', '))
        ]);
    });
});
