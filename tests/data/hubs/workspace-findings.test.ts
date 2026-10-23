// Layer 1, data tests. A folder of the workspace that holds a project manifest raises no finding on
// the workspace file and is a root of the workspace like any other folder, wherever it lies: inside
// a hub's folder, inside a hub's scan folder, holding a hub, or away from every hub. Every file is
// planted under the system temporary directory.

import { join } from 'node:path';
import { describe, expect } from 'vitest';
import { engineDir, loadConfig, textCatalog } from '../../../src/lib/data/sources/config.ts';
import { workspaceFindings } from '../../../src/lib/server/files/workspace/words.ts';
import { it, plantScratch } from '../../fixtures/scratch.ts';
import { plantHub, workspaceWith } from '../../fixtures/hubs/workspace.ts';

const { config } = loadConfig(engineDir());
const CATALOG = textCatalog(config);

const MANIFEST = 'tier: personal\nstage: idea\n';

describe('a folder of the workspace that holds a project manifest', () => {
    it('raises no finding and is a root of the workspace wherever it lies', () => {
        const holder = plantScratch('oculus-workspace-holder-', {
            'project.yml': MANIFEST,
            'hub/inner/.oculus/project.yml': MANIFEST,
            'hub/side-projects/site/.oculus/project.yml': MANIFEST
        });
        const hub = plantHub(join(holder, 'hub'));
        const away = plantScratch('oculus-workspace-away-', { '.oculus/project.yml': MANIFEST });
        const workspace = workspaceWith(
            [
                { name: 'hub', dir: hub },
                { name: 'inner', dir: join(hub, 'inner') },
                { name: 'site', dir: join(hub, 'side-projects', 'site') },
                { name: 'holder', dir: holder },
                { name: 'away', dir: away }
            ],
            'hub'
        );
        const open = workspace.open();

        expect(open.roots.map((one) => [one.key, one.hub === true])).toEqual([
            ['hub', true],
            ['inner', false],
            ['site', false],
            ['holder', false],
            ['away', false]
        ]);
        expect(workspaceFindings(open, CATALOG)).toEqual([]);
    });
});
