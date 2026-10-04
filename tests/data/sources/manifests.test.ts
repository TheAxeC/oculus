// Layer 1, data tests. readManifests against a synthetic hub in a temporary directory. Nothing
// outside it is read or written, and every write asserts its path is inside the temporary directory
// first.

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve, sep } from 'node:path';
import { describe, expect } from 'vitest';
import { readManifests } from '../../../src/lib/data/sources/manifests.ts';
import { engineDir, loadConfig, textCatalog } from '../../../src/lib/data/sources/config.ts';
import type { RawManifest, ScanRule } from '../../../src/lib/data/model/index.ts';
import { present } from '../../fixtures/present.ts';
import { it, scratchDir } from '../../fixtures/scratch.ts';

/** The catalog the findings are worded from: the one oculus ships, read as the server reads it. */
const CATALOG = textCatalog(loadConfig(engineDir()).config);

const SCAN: ScanRule[] = [
    { dir: 'projects/ideas', type: 'idea' },
    { dir: 'projects/active', type: 'active' },
    { dir: 'projects/manuscripts', type: 'manuscript' },
    { dir: 'projects/software', type: 'software', optional: true },
    { dir: 'projects/coauthor', nested: true },
    { dir: 'projects/archive', nested: true }
];

function scratch(): string {
    const dir = scratchDir('oculus-manifests-');
    return dir;
}

function write(hub: string, rel: string, body: string): void {
    const full = join(hub, rel);
    expect(resolve(full).startsWith(resolve(hub) + sep)).toBe(true);
    mkdirSync(dirname(full), { recursive: true });
    writeFileSync(full, body);
}

/**
 * A hub with the five tiers that always exist, a flat and a nested project each, and the awkward
 * cases. The optional software tier is deliberately absent, since that is the hub every test but
 * the two software ones below is read against.
 */
function buildHub(): string {
    const hub = scratch();
    for (const tier of ['ideas', 'active', 'manuscripts', 'coauthor', 'archive']) {
        mkdirSync(join(hub, 'projects', tier), { recursive: true });
    }

    write(
        hub,
        'projects/ideas/tensor-spark/project.yml',
        'id: tensor-spark\ntype: idea\ntitle: Tensor spark\n'
    );
    write(
        hub,
        'projects/active/loewner/project.yml',
        'id: loewner\ntype: active\ntitle: Loewner layers\n'
    );
    write(
        hub,
        'projects/manuscripts/btfno/project.yml',
        'id: btfno\ntype: manuscript\ntitle: BT-FNO\nvenue_id: aaai\n'
    );

    // Nested: one category deep, and one filed a second level down by year.
    write(
        hub,
        'projects/coauthor/active/clinical-hccnet/project.yml',
        'id: clinical-hccnet\ntype: in-prep\ntitle: Clinical HCCNet\n'
    );
    write(
        hub,
        'projects/archive/published/2026/abduction/project.yml',
        'id: abduction\ntype: published\ntitle: Abduction\n'
    );
    // Nested, no category folder: the project sits straight under the tier.
    write(hub, 'projects/archive/orphan/project.yml', 'id: orphan\ntype: dropped\ntitle: Orphan\n');

    // A flat-tier folder with no project.yml becomes a ghost project.
    mkdirSync(join(hub, 'projects', 'ideas', 'empty-folder'), { recursive: true });
    write(hub, 'projects/ideas/empty-folder/README.md', 'no manifest here\n');

    // The manifest's own id disagrees with its folder.
    write(hub, 'projects/ideas/renamed/project.yml', 'id: old-name\ntype: idea\ntitle: Renamed\n');

    // Not valid YAML.
    write(hub, 'projects/ideas/broken/project.yml', 'title: "unterminated\n  - [\n');

    // Parses, but to a list rather than a map.
    write(hub, 'projects/ideas/listy/project.yml', '- one\n- two\n');

    // Decoys the walk must never pick up.
    write(hub, 'projects/manuscripts/btfno/code/project.yml', 'id: decoy\ntitle: Decoy\n');
    write(
        hub,
        'projects/archive/published/2026/abduction/attic/project.yml',
        'id: attic-decoy\ntitle: Attic decoy\n'
    );
    write(
        hub,
        'projects/coauthor/active/clinical-hccnet/code/deep/project.yml',
        'id: deep-decoy\ntitle: Deep decoy\n'
    );

    return hub;
}

function byId(manifests: RawManifest[], id: string): RawManifest {
    const found = manifests.find((m) => m.id === id);
    expect(found, `no manifest with id ${id}`).toBeDefined();
    return present(found, `manifest ${id}`);
}

describe('readManifests', () => {
    it('carries the provenance of a flat project', () => {
        const hub = buildHub();
        const { manifests } = readManifests(hub, SCAN, CATALOG);
        const project = byId(manifests, 'btfno');

        expect(project.file).toBe(join(hub, 'projects/manuscripts/btfno/project.yml'));
        expect(project.folder).toBe('projects/manuscripts/btfno');
        expect(project.tier).toBe('manuscripts');
        expect(project.type).toBe('manuscript');
        expect(project.category).toBeUndefined();
        expect(project.manifestId).toBe('btfno');
        expect(project.title).toBe('BT-FNO');
        expect(project.venue_id).toBe('aaai');
    });
});
