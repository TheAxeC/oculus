// Layer 2, client-state tests. The board item of a project carries the same fields whatever its
// tier is: a project of the tier `research` with a `related:` list carries its related tags, as a
// project of the tier `personal` does. The snapshot is the data layer's, built over a hub planted
// in a scratch directory.

import { describe, expect } from 'vitest';
import { portfolioConfigFrom } from '../../../../src/lib/data/index.ts';
import { buildOneHub } from '../../../fixtures/hubs/hub-build.ts';
import { engineDir, loadConfig } from '../../../../src/lib/data/sources/config.ts';
import { boardItemFor } from '../../../../src/lib/state/boards/board/items.ts';
import { presetFor } from '../../../../src/lib/state/boards/board/presets.ts';
import { it, plantScratch } from '../../../fixtures/scratch.ts';

const { config } = loadConfig(engineDir());
const CONFIG = portfolioConfigFrom(config);

const ROWS = [
    { name: 'the tier research', tier: 'research', board: 'projects', folder: 'projects/ideas' },
    { name: 'the tier personal', tier: 'personal', board: 'personal', folder: 'side-projects' }
];

describe('the related tags of a board item', () => {
    it.each(ROWS)('are carried by a project of $name', (row) => {
        const hub = plantScratch('oculus-items-', {
            [`${row.folder}/mine/project.yml`]: `title: Mine\ntier: ${row.tier}\nstage: nascent\nrelated: [other]\n`,
            'projects/ideas/other/project.yml': 'title: Other\ntier: research\nstage: nascent\n'
        });
        const { snapshot } = buildOneHub(hub, {
            ...CONFIG,
            scan: [{ dir: 'projects/ideas' }, { dir: 'side-projects', optional: true }]
        });
        const project = snapshot.entities.projects.mine;
        const item = boardItemFor(snapshot, project, presetFor(row.board, config));
        expect(item.related).toEqual([{ id: 'other', label: 'Other', held: true }]);
    });
});
