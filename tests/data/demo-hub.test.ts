// The demo hub, read the way tests/integrity.test.ts reads the real one: build the portfolio over
// demo/ and assert the model finds nothing wrong with it. The difference is that this hub is
// oculus's own file, so a finding here is corrected in demo/ rather than reported and left; the real
// hub's findings belong to the hub.
//
// The counts are pinned here, unlike the real hub's, because this folder does not grow: ten
// manifests over the five tiers, the five registries, and the eight collection files. A count that
// moves means the demo changed, which is the thing a test over a fixture is for.
//
// The browser layer serves a copy of this folder, so a finding it would raise is caught here, in
// npm test, rather than in a spec that has already started a server.

import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { buildPortfolio, portfolioConfigFrom } from '../../src/lib/data/index.ts';
import { engineDir, loadConfig } from '../../src/lib/data/sources/config.ts';

const engine = engineDir();
const demo = join(engine, 'demo');
const config = portfolioConfigFrom(loadConfig(engine).config);
const snapshot = buildPortfolio(demo, config);

describe('the demo hub', () => {
    it('validates with no findings', () => {
        expect(snapshot.findings).toEqual([]);
    });

    it('holds the ten projects of the five tiers', () => {
        expect(Object.keys(snapshot.entities.projects).sort()).toEqual([
            'early-benchmark',
            'failed-quantization',
            'graph-bandits',
            'graph-transfer',
            'online-clustering',
            'robust-embeddings',
            'sparse-attention',
            'spectral-clustering-collab',
            'streaming-anomaly',
            'tensor-sketch'
        ]);
    });

    it('holds the five registries', () => {
        expect({
            venues: Object.keys(snapshot.entities.venues).length,
            datasets: Object.keys(snapshot.entities.datasets).length,
            programs: Object.keys(snapshot.entities.programs).length,
            domains: Object.keys(snapshot.entities.domains).length,
            funding: Object.keys(snapshot.entities.funding).length
        }).toEqual({ venues: 5, datasets: 3, programs: 3, domains: 3, funding: 2 });
    });

    it('holds the eight collections', () => {
        expect(Object.keys(snapshot.entities.collections).sort()).toEqual([
            'applications',
            'code',
            'collaborations',
            'education',
            'events',
            'funding',
            'statements',
            'tasks'
        ]);
    });

    it('survives JSON.stringify and JSON.parse unchanged', () => {
        expect(JSON.parse(JSON.stringify(snapshot))).toStrictEqual(snapshot);
    });
});
