// Layer 1, data tests. readPersonal and the Personal entities against synthetic hubs and roots in
// temporary directories. Nothing outside them is read or written, and every file is planted through
// plantScratch, which refuses a path that leaves its directory.
//
// Covered: the hub tier's reading and each field of the manifest read into a SideProject with its
// finding.
// Not covered: which roots of the file browser are handed to the reader (the hub under another
// key, a second key or a link to one directory, the engine's config folder, `~`).

import { join } from 'node:path';
import { describe, expect } from 'vitest';
import { buildPortfolio, portfolioConfigFrom } from '../../../src/lib/data/index.ts';
import { engineDir, loadConfig, textCatalog } from '../../../src/lib/data/sources/config.ts';
import { readPersonal } from '../../../src/lib/data/sources/manifests.ts';
import type { PortfolioConfig, ScanRule, Snapshot } from '../../../src/lib/data/model/index.ts';
import { it, plantScratch } from '../../fixtures/scratch.ts';

const MERGED = loadConfig(engineDir()).config;
const CATALOG = textCatalog(MERGED);

const SIDE: ScanRule = { dir: 'side-projects', type: 'side-project', optional: true };

const SCAN: ScanRule[] = [
    { dir: 'projects/ideas', type: 'idea' },
    { dir: 'projects/active', type: 'active' },
    SIDE
];

/** A manifest body with the five fields and the given overrides, as the hub's own files read. */
function manifest(over: Record<string, string> = {}): string {
    const fields: Record<string, string> = {
        title: '"A side project"',
        status: 'idea',
        eli5: '"What it is."',
        next: '"What comes next."',
        links: '[]',
        ...over
    };
    return Object.entries(fields)
        .map(([key, value]) => `${key}: ${value}`)
        .join('\n')
        .concat('\n');
}

/** A hub with the given files under it. */
function hubWith(files: Record<string, string>, folders: string[] = []): string {
    return plantScratch('oculus-personal-', files, folders);
}

/** The portfolio config of the shipped engine over a scan that carries the hub tier. */
function configOver(scan: ScanRule[] = SCAN): PortfolioConfig {
    return { ...portfolioConfigFrom(MERGED, engineDir()), scan };
}

describe('the hub tier', () => {
    it("is read as one raw record per folder, in the folder's own place", () => {
        const hub = hubWith({
            'side-projects/alpha/project.yml': manifest(),
            'side-projects/beta/project.yml': manifest({ title: 'Beta' }),
            'side-projects/gamma/project.yml': manifest({ status: 'building' })
        });
        const read = readPersonal(hub, SCAN, [], CATALOG);
        expect(read.findings).toEqual([]);
        expect(read.personal.map((one) => one.source)).toEqual([
            { kind: 'hub', folder: 'side-projects/alpha' },
            { kind: 'hub', folder: 'side-projects/beta' },
            { kind: 'hub', folder: 'side-projects/gamma' }
        ]);
        expect(read.personal[0].file).toBe(join(hub, 'side-projects/alpha/project.yml'));
    });
});

describe('the fields of a manifest', () => {
    /** The first side project of a hub whose one folder holds this body, with its findings. */
    function readBody(body: string): {
        project: Snapshot['entities']['personal'][string];
        messages: string[];
    } {
        const hub = hubWith({ 'side-projects/slug/project.yml': body });
        const snapshot = buildPortfolio(hub, configOver());
        return {
            project: snapshot.entities.personal['side:slug'],
            messages: snapshot.findings
                .filter((one) => one.file.endsWith('side-projects/slug/project.yml'))
                .map((one) => one.message)
        };
    }

    it('reads the five fields', () => {
        const { project, messages } = readBody(
            manifest({ links: '[https://x.org, notes.md]', status: 'building' })
        );
        expect(messages).toEqual([]);
        expect(project).toEqual({
            id: 'side:slug',
            title: 'A side project',
            status: 'building',
            eli5: 'What it is.',
            next: 'What comes next.',
            links: ['https://x.org', 'notes.md'],
            source: { kind: 'hub', folder: 'side-projects/slug' },
            file: expect.stringMatching(/side-projects\/slug\/project\.yml$/) as string
        });
    });
});
