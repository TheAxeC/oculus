// Layer 2, state test. A side project is on no Focus lane: the projects the board lays out are the
// ones the store's snapshot holds, built here by buildPortfolio over a synthetic hub, so a side
// project that carries a lane's key as its `focus:` is put through the same lane arithmetic as the
// research project beside it.
//
// Not covered: the lanes drawn on screen (tests/views/boards/focus).

import { describe, expect } from 'vitest';
import { buildPortfolio, portfolioConfigFrom } from '../../../../src/lib/data/index.ts';
import { engineDir, loadConfig } from '../../../../src/lib/data/sources/config.ts';
import { laneItems, lanes, portfolioProjects } from '../../../../src/lib/state/boards/focus.ts';
import { it, plantScratch } from '../../../fixtures/scratch.ts';

const MERGED = loadConfig(engineDir()).config;

describe('a side project and the Focus lanes', () => {
    it('is on no lane, beside a research project with the same focus that is on one', () => {
        const hub = plantScratch('oculus-focus-side-', {
            'projects/active/y/project.yml': 'title: Y\ntype: active\nfocus: run\n',
            'side-projects/x/project.yml':
                'title: X\nstatus: running\nfocus: run\neli5: ""\nnext: ""\nlinks: []\n'
        });
        const config = {
            ...portfolioConfigFrom(MERGED, engineDir()),
            scan: [
                { dir: 'projects/active', type: 'active' },
                { dir: 'side-projects', type: 'side-project', optional: true as const }
            ]
        };
        const snapshot = buildPortfolio(hub, config);
        expect(Object.keys(snapshot.entities.personal)).toEqual(['side:x']);

        const items = laneItems(portfolioProjects(snapshot), lanes(MERGED));
        expect(items.run.map((one) => one.id)).toEqual(['y']);
        expect(
            Object.values(items)
                .flat()
                .map((one) => one.id)
        ).toEqual(['y']);
    });
});
