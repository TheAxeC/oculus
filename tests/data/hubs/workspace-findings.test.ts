// Layer 1, data tests. A folder of the workspace that holds a project manifest and cannot be a
// project is marked `noProject` and gets a finding on the workspace file, in the words of the text
// catalog; a folder that can be a project gets none. Every file is planted under the system
// temporary directory.

import { join } from 'node:path';
import { describe, expect } from 'vitest';
import { findingText } from '../../../src/lib/data/helpers/finding-text.ts';
import { engineDir, loadConfig, textCatalog } from '../../../src/lib/data/sources/config.ts';
import { workspaceFindings } from '../../../src/lib/server/files/workspace/words.ts';
import { it, plantScratch } from '../../fixtures/scratch.ts';
import { plantHub, workspaceWith } from '../../fixtures/hubs/workspace.ts';

const { config } = loadConfig(engineDir());
const CATALOG = textCatalog(config);

describe('a folder of the workspace that holds a project manifest', () => {
    it('is no project and has a finding when it lies inside a hub folder, and is a project otherwise', () => {
        const hub = plantScratch('oculus-workspace-hub-', {
            'inner/.oculus/project.yml': 'tier: personal\ntype: idea\n'
        });
        plantHub(hub);
        const away = plantScratch('oculus-workspace-away-', {
            '.oculus/project.yml': 'tier: personal\ntype: idea\n'
        });
        const workspace = workspaceWith(
            [
                { name: 'hub', dir: hub },
                { name: 'inner', dir: join(hub, 'inner') },
                { name: 'away', dir: away }
            ],
            'hub'
        );
        const open = workspace.open();

        expect(open.roots.find((one) => one.key === 'inner')?.noProject).toBe(true);
        expect(open.roots.find((one) => one.key === 'away')?.noProject).toBeUndefined();
        expect(workspaceFindings(open, CATALOG)).toEqual([
            {
                file: open.stateFile,
                key: 'inner',
                message: findingText(CATALOG, 'findings.workspace.project_in_hub')
            }
        ]);
    });
});
