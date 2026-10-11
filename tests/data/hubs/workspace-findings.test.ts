// Layer 1, data tests. A folder added to the workspace that holds a project manifest and cannot be
// a project is marked `noProject` and gets a finding on the saved workspaces file, in the words a
// configured root refused for the same reason gets; an added folder that can be a project gets
// none. Every file is planted under the system temporary directory.

import { join } from 'node:path';
import { describe, expect } from 'vitest';
import { findingText } from '../../../src/lib/data/helpers/finding-text.ts';
import { engineDir, loadConfig, textCatalog } from '../../../src/lib/data/sources/config.ts';
import { defaultWorkspacesPath, writeSaved } from '../../../src/lib/server/files/fs.ts';
import { browserRoots, workspaceFindings } from '../../../src/lib/server/files/roots.ts';
import { it, plantScratch } from '../../fixtures/scratch.ts';

const { config } = loadConfig(engineDir());
const CATALOG = textCatalog(config);

describe('a folder added to the workspace that holds a project manifest', () => {
    it('is no project and has a finding when it lies inside the first hub, and is a project otherwise', () => {
        const hub = plantScratch('oculus-workspace-hub-', {
            'inner/.oculus/project.yml': 'tier: personal\ntype: idea\n'
        });
        const away = plantScratch('oculus-workspace-away-', {
            '.oculus/project.yml': 'tier: personal\ntype: idea\n'
        });
        const file = defaultWorkspacesPath(hub);
        writeSaved(file, {
            current: 'work',
            workspaces: [
                {
                    name: 'work',
                    roots: [
                        { key: 'inner', dir: join(hub, 'inner') },
                        { key: 'away', dir: away }
                    ]
                }
            ],
            dropped: []
        });
        const target = { config: { ...config, roots: [] }, engine: engineDir(), local: { hub } };

        const roots = browserRoots(target);
        expect(roots.find((one) => one.key === 'inner')?.noProject).toBe(true);
        expect(roots.find((one) => one.key === 'away')?.noProject).toBeUndefined();
        expect(workspaceFindings(target, CATALOG)).toEqual([
            {
                file,
                key: 'inner',
                message: findingText(CATALOG, 'findings.roots.project_is_first')
            }
        ]);
    });
});
