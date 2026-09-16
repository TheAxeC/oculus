// The demo hub, read the way tests/integrity.test.ts reads the real one: build the portfolio over
// demo/ and assert the model finds nothing wrong with it. The difference is that this hub is
// oculus's own file, so a finding here is corrected in demo/ rather than reported and left; the real
// hub's findings belong to the hub.
//
// The counts are pinned here, unlike the real hub's, because this folder does not grow: eleven
// manifests over the six tiers, the seven registries, and the eleven collection files. A count that
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
const config = portfolioConfigFrom(loadConfig(engine).config, engine);
const snapshot = buildPortfolio(demo, config);

describe('the demo hub', () => {
    it('validates with no findings', () => {
        expect(snapshot.findings).toEqual([]);
    });

    it('holds the eleven projects of the six tiers', () => {
        expect(Object.keys(snapshot.entities.projects).sort()).toEqual([
            'demo-toolkit',
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

    it('files the software project on its own tier, with the papers it names', () => {
        const tool = snapshot.entities.projects['demo-toolkit'];
        expect(tool.tier).toBe('software');
        expect(tool.type).toBe('software');
        expect(tool.relatedIds).toEqual(['graph-bandits', 'graph-transfer']);
    });

    it('holds the seven registries', () => {
        expect({
            venues: Object.keys(snapshot.entities.venues).length,
            datasets: Object.keys(snapshot.entities.datasets).length,
            pillars: Object.keys(snapshot.entities.pillars).length,
            domains: Object.keys(snapshot.entities.domains).length,
            funding: Object.keys(snapshot.entities.funding).length,
            people: Object.keys(snapshot.entities.people).length,
            organisations: Object.keys(snapshot.entities.organisations).length
        }).toEqual({
            venues: 5,
            datasets: 5,
            pillars: 3,
            domains: 3,
            funding: 2,
            people: 3,
            organisations: 2
        });
    });

    it('joins each joint-work entry to its person and each person to their organisation', () => {
        expect(snapshot.relations.jointWorkPerson).toEqual([
            ['chen-graph', 'chen-graph'],
            ['rivera-lab', 'rivera-lab']
        ]);
        expect(snapshot.entities.people['rivera-lab'].affiliation).toBe('northwood-university');
        expect(snapshot.entities.organisations['northwood-university'].personIds).toEqual([
            'owner',
            'rivera-lab'
        ]);
    });

    it('holds the twelve collections, including the four editable registries', () => {
        expect(Object.keys(snapshot.entities.collections).sort()).toEqual([
            'applications',
            'code',
            'data',
            'domains',
            'education',
            'events',
            'funding',
            'joint-work',
            'pillars',
            'statements',
            'tasks',
            'venues'
        ]);
    });

    it('survives JSON.stringify and JSON.parse unchanged', () => {
        expect(JSON.parse(JSON.stringify(snapshot))).toStrictEqual(snapshot);
    });
});
