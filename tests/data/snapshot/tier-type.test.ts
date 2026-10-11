// Layer 1, data tests. A manifest whose `tier` or `type` is missing or outside its words: the
// project is still in the snapshot, a finding on the key says what is wrong, and a project with no
// usable tier is on no board. A hub planted in a scratch directory is built through
// buildPortfolioWithSchemas, and the findings on the manifest's file are read from the snapshot.

import { describe, expect } from 'vitest';
import { buildPortfolioWithSchemas, portfolioConfigFrom } from '../../../src/lib/data/index.ts';
import { engineDir, loadConfig } from '../../../src/lib/data/sources/config.ts';
import { it, plantScratch } from '../../fixtures/scratch.ts';

const CONFIG = portfolioConfigFrom(loadConfig(engineDir()).config);

type Row = {
    name: string;
    /** The manifest's lines. */
    manifest: string;
    /** The key the finding sits on. */
    key: 'tier' | 'type';
    /** The tier the project is read with: absent when the manifest names none of the five. */
    tier: string | undefined;
};

const ROWS: Row[] = [
    { name: 'no tier', manifest: 'type: idea\n', key: 'tier', tier: undefined },
    { name: 'the tier ideas', manifest: 'tier: ideas\ntype: idea\n', key: 'tier', tier: undefined },
    {
        name: 'a tier that is a number',
        manifest: 'tier: 3\ntype: idea\n',
        key: 'tier',
        tier: undefined
    },
    { name: 'no type', manifest: 'tier: projects\n', key: 'type', tier: 'projects' },
    {
        name: 'the type manuscript',
        manifest: 'tier: projects\ntype: manuscript\n',
        key: 'type',
        tier: 'projects'
    }
];

describe('a manifest with a tier or a type outside its words', () => {
    it.each(ROWS)('shows the project of $name with a finding', (row) => {
        const hub = plantScratch('oculus-tier-type-', {
            'projects/ideas/x/project.yml': `title: X\n${row.manifest}`
        });
        const { snapshot } = buildPortfolioWithSchemas(hub, CONFIG);
        const file = `${hub}/projects/ideas/x/project.yml`;
        const on = snapshot.findings.filter((one) => one.file === file && one.key === row.key);
        expect(on).toHaveLength(1);
        expect(on[0].message).not.toBe('');
        const project = snapshot.entities.projects.x;
        expect(project.id).toBe('x');
        expect(project.tier).toBe(row.tier);
    });
});
