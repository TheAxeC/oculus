// Layer 1, data tests. The manifests' `compute:` list, read the way the server reads a hub: a hub
// planted in a scratch directory, built through buildPortfolioWithSchemas, and the project's
// resource ids and the findings asserted. Every sentence is looked up in the shipped catalog, so a
// finding whose catalog key is missing fails the test that expects it.

import { join } from 'node:path';
import { describe, expect } from 'vitest';
import { buildPortfolioWithSchemas, portfolioConfigFrom } from '../../../src/lib/data/index.ts';
import { findingText } from '../../../src/lib/data/helpers/finding-text.ts';
import { engineDir, loadConfig, textCatalog } from '../../../src/lib/data/sources/config.ts';
import type { Finding, Snapshot } from '../../../src/lib/data/model/index.ts';
import { it, plantScratch } from '../../fixtures/scratch.ts';

const ENGINE = engineDir();
const LOADED = loadConfig(ENGINE).config;
const CATALOG = textCatalog(LOADED);
const CONFIG = portfolioConfigFrom(LOADED);

/** The sentence of a catalog key, which the catalog must hold. */
function sentence(key: string, ...args: string[]): string {
    expect(CATALOG[key], `the catalog holds ${key}`).toBeDefined();
    return findingText(CATALOG, key, ...args);
}

/** The three seed entries of registries/resources.yml. */
const SEED = [
    'entries:',
    '  - key: "utwente"',
    '    name: "UTwente HPC"',
    '    kind: "cluster"',
    '    host: "utwente"',
    '    access: "ssh from the UT network or EduVPN"',
    '    links: ["docs/HPC-UTwente-howto.md"]',
    '  - key: "this-mac"',
    '    name: "This Mac"',
    '    kind: "machine"',
    '    access: "the laptop"',
    '  - key: "data"',
    '    name: "Local data"',
    '    kind: "storage"',
    ''
].join('\n');

/** A hub holding the resources registry (or none) and one project per `compute:` text. */
function build(registry: string | null, computes: Record<string, string>): Snapshot {
    const files: Record<string, string> = {};
    if (registry !== null) files['registries/resources.yml'] = registry;
    for (const [id, compute] of Object.entries(computes)) {
        files[join('projects/active', id, 'project.yml')] =
            `id: ${id}\ntype: active\ntitle: ${id}\n${compute}`;
    }
    return buildPortfolioWithSchemas(
        plantScratch('oculus-resources-hub-', files, ['projects/active']),
        CONFIG
    ).snapshot;
}

/** The findings about the resources registry and the manifests, not the other files' absence. */
function about(snapshot: Snapshot): Finding[] {
    return snapshot.findings.filter(
        (finding) => finding.file.endsWith('resources.yml') || finding.file.endsWith('project.yml')
    );
}

/** The `[file basename, key, message]` of each finding. */
function plain(findings: Finding[]): [string, string, string][] {
    return findings.map((finding) => [
        finding.file.split('/').at(-1) ?? '',
        finding.key,
        finding.message
    ]);
}

describe("a project's compute list", () => {
    const projectOf = (snapshot: Snapshot, id = 'alpha'): string[] | undefined =>
        snapshot.entities.projects[id].resourceIds;

    it('answers a scalar compute: with the type finding and reads it as none', () => {
        const snapshot = build(SEED, { alpha: 'compute: hpc\n' });
        expect(plain(about(snapshot))).toEqual([
            [
                'project.yml',
                'compute',
                sentence(
                    'findings.schema.type',
                    'compute',
                    sentence('findings.schema.is_list'),
                    sentence('findings.shape.is_other', 'string')
                )
            ]
        ]);
        expect(projectOf(snapshot)).toEqual([]);
    });
});
