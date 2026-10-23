// Layer 1, data tests. A wrong `scan:` or `new_project_dir:` value of the hub settings file, as the
// sources findings (data/index.ts) and the scan reader (data/sources/manifests.ts) word it: each
// one is a finding that names the key it is about, filed on the settings file, and what is wrong is
// not used while the rest of the value still is.

import { join } from 'node:path';
import { describe, expect } from 'vitest';
import { portfolioConfigFrom, sourcesFindings } from '../../../src/lib/data/index.ts';
import { engineDir, loadConfig, textCatalog } from '../../../src/lib/data/sources/config.ts';
import { readManifests } from '../../../src/lib/data/sources/manifests.ts';
import { it, plantScratch } from '../../fixtures/scratch.ts';

const MERGED = loadConfig(engineDir()).config;
const CATALOG = textCatalog(MERGED);

/** The settings file the findings are filed on. */
const SOURCES = '/hub/.oculus/config.yml';

type Row = {
    name: string;
    scan?: unknown;
    newProjectDir?: unknown;
    /** The ids of the projects the scan reads in the planted hub. */
    ids: string[];
    /** The findings as the key they sit on and the words the sentence must hold. */
    findings: { key: 'scan' | 'new_project_dir'; words: string[] }[];
};

const ROWS: Row[] = [
    {
        name: 'a scan entry that carries a type and a tier, the folder still walked',
        scan: [{ dir: 'projects/ideas', type: 'idea', tier: 'projects' }],
        ids: ['a'],
        findings: [
            { key: 'scan', words: ['projects/ideas', 'type'] },
            { key: 'scan', words: ['projects/ideas', 'tier'] }
        ]
    },
    {
        name: 'a scan entry with a nested key',
        scan: [{ dir: 'projects/ideas', nested: true }],
        ids: ['a'],
        findings: [{ key: 'scan', words: ['projects/ideas', 'nested'] }]
    },
    {
        name: 'a scan entry with no dir, which is dropped',
        scan: [{ type: 'idea' }, { dir: 'projects/ideas' }],
        ids: ['a'],
        findings: [{ key: 'scan', words: ['1'] }]
    },
    {
        name: 'a scan that is no list',
        scan: { dir: 'projects/ideas' },
        ids: [],
        findings: [{ key: 'scan', words: ['list'] }]
    },
    {
        name: 'a scan folder that is not there',
        scan: [{ dir: 'projects/gone' }],
        ids: [],
        findings: [{ key: 'scan', words: ['does not exist'] }]
    },
    {
        name: 'a scan folder that is not there, with optional true, as no finding',
        scan: [{ dir: 'projects/gone', optional: true }, { dir: 'projects/ideas' }],
        ids: ['a'],
        findings: []
    },
    {
        name: 'a new_project_dir that is a list',
        newProjectDir: ['a'],
        ids: ['a'],
        findings: [{ key: 'new_project_dir', words: ['map'] }]
    },
    {
        name: 'a new_project_dir entry for a word that is no tier',
        newProjectDir: { bogus: 'projects/ideas', projects: 'projects/ideas' },
        ids: ['a'],
        findings: [{ key: 'new_project_dir', words: ['bogus'] }]
    },
    {
        name: 'a new_project_dir folder outside every scan folder',
        newProjectDir: { projects: 'elsewhere' },
        ids: ['a'],
        findings: [{ key: 'new_project_dir', words: ['projects', 'elsewhere'] }]
    },
    {
        name: 'a new_project_dir entry with no folder',
        newProjectDir: { archive: '' },
        ids: ['a'],
        findings: [{ key: 'new_project_dir', words: ['archive'] }]
    }
];

describe('a wrong scan or new_project_dir value', () => {
    it.each(ROWS)('refuses $name with a finding naming the key', (row) => {
        const hub = plantScratch('oculus-scan-', {
            'projects/ideas/a/project.yml': 'tier: projects\nstage: idea\ntitle: A\n'
        });
        const merged = {
            ...MERGED,
            scan: row.scan ?? [{ dir: 'projects/ideas' }],
            new_project_dir: row.newProjectDir ?? {}
        };
        const found = sourcesFindings(
            merged,
            {
                scan: SOURCES,
                newProjectDir: SOURCES,
                memoriesDir: SOURCES,
                wallpaperDir: SOURCES
            },
            hub
        );
        const read = readManifests(hub, portfolioConfigFrom(merged).scan, CATALOG);
        const all = [...found, ...read.findings];
        expect(read.manifests.map((one) => one.id)).toEqual(row.ids);
        expect(all.map((one) => one.key)).toEqual(row.findings.map((one) => one.key));
        for (const [at, one] of row.findings.entries()) {
            for (const word of one.words) expect(all[at].message).toContain(word);
            const file = one.words.includes('does not exist')
                ? join(hub, 'projects/gone')
                : SOURCES;
            expect(all[at].file).toBe(file);
        }
    });
});
