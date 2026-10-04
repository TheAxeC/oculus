// Layer 1, data tests. The demo hub, read the way tests/checks/config/integrity.test.ts reads the
// real one: build the portfolio over demo/ and assert the model finds nothing wrong with it. This
// hub is oculus's own file, so a finding here is corrected in demo/ rather than reported and left;
// the real hub's findings belong to the hub.
//
// The join is asserted by the pairs the demo names; counts are not pinned, since a count over a
// fixture fails whenever the demo changes and guards no behaviour.
// @module-tag slow: the configuration and the portfolio built at collection take 100 ms or more.

import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { buildPortfolio, portfolioConfigFrom } from '../../src/lib/data/index.ts';
import { engineDir, loadConfig } from '../../src/lib/data/sources/config.ts';

const engine = engineDir();
const demo = join(engine, 'demo');
const config = portfolioConfigFrom(loadConfig(engine).config, engine);
const snapshot = buildPortfolio(demo, config);

describe('the demo hub', () => {
    it('validates with no findings', () => {
        expect(snapshot.findings).toEqual([]);
    });

    it('joins each joint-work entry to the person it names', () => {
        expect(snapshot.relations.jointWorkPerson).toEqual([
            ['chen-graph', 'chen-graph'],
            ['rivera-lab', 'rivera-lab']
        ]);
    });
});
