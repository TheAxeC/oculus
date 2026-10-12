// Layer 2, server tests. Which image the wallpaper endpoint serves for a value of `wallpaper.image`
// across the hubs of a workspace, and the finding each wrong value gets. Every folder is planted
// under the system temporary directory; no hub of the checkout is read.

import { join } from 'node:path';
import { describe, expect } from 'vitest';
import { findingText } from '../../../src/lib/data/helpers/finding-text.ts';
import { sourcesFindings } from '../../../src/lib/data/index.ts';
import { WALLPAPER_DIR, hubFolderIn } from '../../../src/lib/data/helpers/files/paths.ts';
import { engineDir, loadConfig, textCatalog } from '../../../src/lib/data/sources/config.ts';
import type { HubPictures } from '../../../src/lib/server/content/images.ts';
import {
    choose,
    serve,
    serveImage,
    wallpaperFindings,
    wallpaperMemory
} from '../../../src/lib/server/content/wallpaper.ts';
import { it, plantScratch } from '../../fixtures/scratch.ts';

const { config } = loadConfig(engineDir());
const CATALOG = textCatalog(config);

/** Two hubs, each with a wallpaper folder holding the named images. */
function hubs(): HubPictures[] {
    const primary = plantScratch('oculus-wall-main-', {
        '.oculus/wallpaper/m.jpg': 'main'
    });
    const lab = plantScratch('oculus-wall-lab-', {
        '.oculus/wallpaper/x.jpg': 'x',
        '.oculus/wallpaper/y.png': 'y'
    });
    return [
        {
            hub: 'main',
            wallpaper: join(primary, '.oculus/wallpaper'),
            memories: join(primary, '.oculus/memories')
        },
        {
            hub: 'lab',
            wallpaper: join(lab, '.oculus/wallpaper'),
            memories: join(lab, '.oculus/memories')
        }
    ];
}

/** The findings a value is wrong by, in the words of the catalog. */
function findingsOf(value: string, pictures: HubPictures[]): string[] {
    return wallpaperFindings(
        { wallpaper: { image: value } },
        pictures,
        'appearance.yml',
        CATALOG
    ).map((one) => one.message);
}

describe('wallpaper.image across the hubs of a workspace', () => {
    it('serves the file of the hub that the value names', async () => {
        const pictures = hubs();
        const response = serve('lab/x.jpg', pictures, wallpaperMemory());
        expect(response.status).toBe(200);
        expect(await response.text()).toBe('x');
        expect(findingsOf('lab/x.jpg', pictures)).toEqual([]);
    });

    it.each([
        ['a file the hub folder does not hold', 'lab/gone.jpg', 'gone'],
        ['a hub the workspace does not list', 'nohub/x.jpg', 'hub'],
        ['a file part that leaves the wallpaper folder', 'lab/../../secrets/x.jpg', 'name'],
        ['a value that is neither random nor hub and file', 'x', 'form']
    ])('serves no image and gives a finding for %s', (_title, value, fault) => {
        const pictures = hubs();
        expect(serve(value, pictures, wallpaperMemory()).status).toBe(404);
        expect(findingsOf(value, pictures)).toEqual([
            findingText(CATALOG, `findings.wallpaper.${fault}`, value)
        ]);
    });

    it('serves, for random, one image of any hub and the same one for the life of the process', () => {
        const pictures = hubs();
        const memory = wallpaperMemory();
        const first = choose('random', pictures, memory);
        const names = ['main/m.jpg', 'lab/x.jpg', 'lab/y.png'];
        expect(names).toContain(`${first?.hub}/${first?.file}`);
        for (let at = 0; at < 20; at += 1)
            expect(choose('random', pictures, memory)).toEqual(first);
        expect(findingsOf('random', pictures)).toEqual([]);
    });

    it('serves an image asked for by hub and file for the picker, and none that names a path', async () => {
        const pictures = hubs();
        expect(await serveImage('main/m.jpg', pictures).text()).toBe('main');
        expect(serveImage('lab/../../secrets/x.jpg', pictures).status).toBe(404);
    });
});

describe('a wallpaper_dir that leaves its hub', () => {
    it('is a finding on the sources file, and the standard folder is used', () => {
        const hub = '/tmp/oculus-wall-hub';
        const found = hubFolderIn(hub, '../outside', WALLPAPER_DIR);
        expect(found).toEqual({ dir: join(hub, WALLPAPER_DIR), problem: 'outside' });
        const findings = sourcesFindings(
            { ...config, wallpaper_dir: '../outside' },
            {
                scan: 'sources.yml',
                newProjectDir: 'sources.yml',
                wallpaperDir: 'sources.yml',
                memoriesDir: 'sources.yml'
            },
            hub
        );
        expect(findings.filter((one) => one.key === 'wallpaper_dir')).toEqual([
            {
                file: 'sources.yml',
                key: 'wallpaper_dir',
                message: findingText(
                    CATALOG,
                    'findings.manifests.picture_folder_outside',
                    'wallpaper_dir',
                    '../outside',
                    WALLPAPER_DIR
                )
            }
        ]);
    });
});
