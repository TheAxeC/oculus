// Layer 1, data tests. A manifest whose `tier` or `stage` is missing or outside its words: the
// project is in the snapshot all the same, a finding on the key says what is wrong, and a project
// with no usable tier is on no board. A hub planted in a scratch directory is built through
// buildOneHub, and the findings on the manifest's file are read from the snapshot.

import { describe, expect } from 'vitest';
import { portfolioConfigFrom } from '../../../src/lib/data/index.ts';
import { buildOneHub } from '../../fixtures/hubs/hub-build.ts';
import { engineDir, loadConfig } from '../../../src/lib/data/sources/config.ts';
import { it, plantScratch } from '../../fixtures/scratch.ts';

const CONFIG = portfolioConfigFrom(loadConfig(engineDir()).config);

type Row = {
    name: string;
    /** The manifest's lines. */
    manifest: string;
    /** The key the finding sits on. */
    key: 'tier' | 'stage';
    /** The tier the project is read with: absent when the manifest names no word of `tiers`. */
    tier: string | undefined;
};

const ROWS: Row[] = [
    { name: 'no tier', manifest: 'stage: nascent\n', key: 'tier', tier: undefined },
    {
        name: 'the tier ideas',
        manifest: 'tier: ideas\nstage: nascent\n',
        key: 'tier',
        tier: undefined
    },
    {
        name: 'a tier that is a number',
        manifest: 'tier: 3\nstage: nascent\n',
        key: 'tier',
        tier: undefined
    },
    { name: 'no stage', manifest: 'tier: research\n', key: 'stage', tier: 'research' },
    {
        name: 'the stage manuscript',
        manifest: 'tier: research\nstage: manuscript\n',
        key: 'stage',
        tier: 'research'
    }
];

describe('a manifest with a tier or a stage outside its words', () => {
    it.each(ROWS)('shows the project of $name with a finding', (row) => {
        const hub = plantScratch('oculus-tier-stage-', {
            'projects/ideas/x/project.yml': `title: X\n${row.manifest}`
        });
        const { snapshot } = buildOneHub(hub, CONFIG);
        const file = `${hub}/projects/ideas/x/project.yml`;
        const on = snapshot.findings.filter((one) => one.file === file && one.key === row.key);
        expect(on).toHaveLength(1);
        expect(on[0].message).not.toBe('');
        const project = snapshot.entities.projects.x;
        expect(project.id).toBe('x');
        expect(project.tier).toBe(row.tier);
    });
});
