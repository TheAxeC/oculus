// Layer 1, data tests. The folders of a workspace read as projects wherever they lie: a folder
// inside a hub and outside every scan folder, a folder inside a scan folder whose manifest the scan
// reads, a folder that holds a hub, and a folder whose manifest a second hub's scan reads. Each
// manifest is one project, read once and matched by its real path, and the folder stays a folder of
// the workspace. The hub, the folders and the state that opens the workspace are planted under the
// system temporary directory, and the workspace is read as the server's portfolio build reads it
// (`primaryConfig`, `buildPortfolioWithSchemas`, `joinHubs`).

import { symlinkSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect } from 'vitest';
import { buildPortfolioWithSchemas, joinHubs, readOtherHub } from '../../../src/lib/data/index.ts';
import { engineDir, loadConfig, textCatalog } from '../../../src/lib/data/sources/config.ts';
import { createChecker } from '../../../src/lib/data/snapshot/schema/check.ts';
import type { Snapshot } from '../../../src/lib/data/model/index.ts';
import { primaryConfig } from '../../../src/lib/server/files/roots.ts';
import type { OpenWorkspace } from '../../../src/lib/server/files/workspace/open.ts';
import { workspaceFindings } from '../../../src/lib/server/files/workspace/words.ts';
import { boardItems } from '../../../src/lib/state/boards/board/items.ts';
import { presetFor } from '../../../src/lib/state/boards/board/presets.ts';
import { it, plantScratch, scratchDir } from '../../fixtures/scratch.ts';
import { plantHub, workspaceWith, type FolderSpec } from '../../fixtures/hubs/workspace.ts';

/** A manifest of a project of this tier and title. */
const manifest = (title: string, tier: string): string =>
    `title: ${title}\ntier: ${tier}\ntype: active\n`;

/** The hub's own files: one project in a scan folder and one in `side-projects`. */
const HUB_FILES: Record<string, string> = {
    'projects/ideas/spark/project.yml': manifest('Spark', 'projects'),
    'side-projects/site/.oculus/project.yml': manifest('Site', 'personal')
};

/** The hub's `.oculus/config.yml`: its two scan folders. */
const HUB_SETTINGS = 'scan:\n  - { dir: projects/ideas }\n  - { dir: side-projects }\n';

/** A hub's settings as the server keeps them, read from its own `.oculus/config.yml`. */
const settings = (hub: string): ReturnType<typeof loadConfig> => loadConfig(engineDir(), { hub });

/** What a workspace is read into: the snapshot of the build and the workspace it was read from. */
type Read = { snapshot: Snapshot; open: OpenWorkspace };

/**
 * The portfolio of a workspace over the primary hub `hub` and `folders`, each of `others` a second
 * hub of the workspace read with its own settings, as the portfolio watcher builds it.
 */
function read(hub: string, folders: FolderSpec[], others: FolderSpec[] = []): Read {
    const open = workspaceWith([{ name: 'hub', dir: hub }, ...others, ...folders], 'hub').open();
    const { config, from } = settings(hub);
    const portfolio = primaryConfig(config, open, settings, from);
    const base = buildPortfolioWithSchemas(
        hub,
        portfolio,
        0,
        portfolio.repositories,
        undefined,
        null,
        'hub'
    );
    const read = others.map((one) =>
        readOtherHub({ key: one.name, dir: one.dir }, settings(one.dir))
    );
    const first = { hub, name: 'hub', config: portfolio };
    return { snapshot: joinHubs(base, first, read, 0, createChecker()).snapshot, open };
}

/** The ids of the projects a read holds, sorted. */
const idsOf = (read: Read): string[] => Object.keys(read.snapshot.entities.projects).sort();

/** The manifest files a read holds, one per project. */
const filesOf = (read: Read): string[] =>
    Object.values(read.snapshot.entities.projects).map((one) => one.file);

/** The findings of a read on a file that lies in `dir`, and the workspace's findings. */
function findingsIn(read: Read, dir: string): unknown[] {
    const catalog = textCatalog(loadConfig(engineDir()).config);
    return [
        ...read.snapshot.findings.filter((one) => one.file.startsWith(dir)),
        ...workspaceFindings(read.open, catalog)
    ];
}

/** A hub with HUB_FILES and `files` planted. */
function plantedHub(files: Record<string, string> = {}): string {
    const hub = plantScratch('oculus-workspace-projects-', { ...HUB_FILES, ...files });
    return plantHub(hub, HUB_SETTINGS);
}

describe('a folder of the workspace that holds a project manifest', () => {
    it('is a project on the board its tier names when it lies inside the hub and outside every scan folder', () => {
        const hub = plantedHub({
            'tools/oculus/.oculus/project.yml': manifest('Oculus', 'personal')
        });
        const dir = join(hub, 'tools', 'oculus');
        const got = read(hub, [{ name: 'oculus', dir }]);

        expect(idsOf(got)).toEqual(['oculus', 'site', 'spark']);
        expect(got.snapshot.entities.projects.oculus).toMatchObject({
            title: 'Oculus',
            tier: 'personal',
            file: join(dir, '.oculus', 'project.yml'),
            workspaceFolder: { root: 'oculus', dir }
        });
        const board = boardItems(got.snapshot, presetFor('personal', settings(hub).config));
        expect(board.map((one) => one.id).sort()).toEqual(['oculus', 'site']);
        expect(findingsIn(got, dir)).toEqual([]);
    });

    it.each([
        ['named directly', false],
        ['named through a link', true]
    ])(
        "is the scan's one project, with no finding, when the scan reads its manifest, the folder %s",
        (_name, linked) => {
            const hub = plantedHub();
            const dir = join(hub, 'side-projects', 'site');
            const link = join(scratchDir('oculus-workspace-link-'), 'site-link');
            symlinkSync(dir, link);
            const got = read(hub, [{ name: 'website', dir: linked ? link : dir }]);

            expect(idsOf(got)).toEqual(['site', 'spark']);
            expect(got.snapshot.entities.projects.site.workspaceFolder).toBeUndefined();
            expect(got.snapshot.entities.projects.site.folder).toBe('side-projects/site');
            expect(got.open.roots.map((one) => one.key)).toEqual(['hub', 'website']);
            expect(findingsIn(got, dir)).toEqual([]);
        }
    );

    it("is a project when it holds the hub and a manifest at its top, and the hub's projects are each read once", () => {
        const holder = plantScratch('oculus-workspace-holder-', {
            'project.yml': manifest('Holder', 'personal'),
            ...Object.fromEntries(
                Object.entries(HUB_FILES).map(([path, text]) => [`hub/${path}`, text])
            )
        });
        const hub = plantHub(join(holder, 'hub'), HUB_SETTINGS);
        const got = read(hub, [{ name: 'holder', dir: holder }]);

        expect(idsOf(got)).toEqual(['holder', 'site', 'spark']);
        expect(got.snapshot.entities.projects.holder).toMatchObject({
            file: join(holder, 'project.yml'),
            workspaceFolder: { root: 'holder', dir: holder }
        });
        expect(new Set(filesOf(got)).size).toBe(filesOf(got).length);
        expect(findingsIn(got, holder)).toEqual([]);
    });

    it("is the second hub's project alone when that hub's scan reads its manifest", () => {
        const hub = plantedHub();
        const lab = plantHub(
            plantScratch('oculus-workspace-lab-', {
                'side-projects/kit/.oculus/project.yml': manifest('Kit', 'personal')
            }),
            'scan:\n  - { dir: side-projects }\n'
        );
        const dir = join(lab, 'side-projects', 'kit');
        const got = read(hub, [{ name: 'kit-folder', dir }], [{ name: 'lab', dir: lab }]);

        expect(idsOf(got)).toEqual(['lab:kit', 'site', 'spark']);
        expect(got.snapshot.entities.projects['lab:kit'].workspaceFolder).toBeUndefined();
        expect(findingsIn(got, dir)).toEqual([]);
    });
});
