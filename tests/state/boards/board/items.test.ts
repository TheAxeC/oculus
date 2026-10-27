// Layer 2, client-state tests. The board item of a project carries the same fields whatever its
// tier is: a project of the tier `research` with a `related:` list carries its related tags, as a
// project of the tier `personal` does. The snapshot is the one the page reads, built as the server
// builds a workspace over a hub planted in a scratch directory, the workspace's one hub `hub`.

import { describe, expect } from 'vitest';
import { portfolioConfigFrom } from '../../../../src/lib/data/index.ts';
import { createChecker } from '../../../../src/lib/data/snapshot/schema/check.ts';
import { engineDir, loadConfig } from '../../../../src/lib/data/sources/config.ts';
import { buildHubs } from '../../../../src/lib/server/root/watch/build.ts';
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
        const portfolio = {
            ...CONFIG,
            scan: [{ dir: 'projects/ideas' }, { dir: 'side-projects', optional: true }]
        };
        const primary = { key: 'hub', dir: hub, portfolio, workspace: null };
        const read = { primary, others: [], config: portfolio, order: ['hub'], self: '' };
        const { snapshot } = buildHubs(read, 0, createChecker(), null);
        const project = snapshot.entities.projects['hub:mine'];
        const item = boardItemFor(snapshot, project, presetFor(row.board, config));
        expect(item.related).toEqual([{ id: 'hub:other', label: 'Other', held: true }]);
    });
});
