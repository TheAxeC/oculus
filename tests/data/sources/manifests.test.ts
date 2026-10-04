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
    it('keeps a ghost folder id while removing its filing prefix from the title', () => {
        const hub = buildHub();
        mkdirSync(join(hub, 'projects/ideas/[IDEA] New method'), { recursive: true });
        const { manifests } = readManifests(hub, SCAN, CATALOG);
        expect(byId(manifests, '[IDEA] New method')).toMatchObject({
            id: '[IDEA] New method',
            title: 'New method',
            type: 'idea',
            ghost: true
        });
    });

    it('reads every tier, includes a ghost folder and skips nested decoys', () => {
        const hub = buildHub();
        const { manifests } = readManifests(hub, SCAN, CATALOG);

        expect(manifests.map((m) => m.folder)).toEqual([
            'projects/active/loewner',
            'projects/archive/orphan',
            'projects/archive/published/2026/abduction',
            'projects/coauthor/active/clinical-hccnet',
            'projects/ideas/empty-folder',
            'projects/ideas/renamed',
            'projects/ideas/tensor-spark',
            'projects/manuscripts/btfno'
        ]);
        expect(manifests.map((m) => m.id)).not.toContain('decoy');
        expect(manifests.map((m) => m.id)).not.toContain('attic-decoy');
        expect(manifests.map((m) => m.id)).not.toContain('deep-decoy');
    });

    it('builds a ghost from the folder and scan rule without treating parse failures as ghosts', () => {
        const hub = buildHub();
        const { manifests, findings } = readManifests(hub, SCAN, CATALOG);
        expect(byId(manifests, 'empty-folder')).toEqual({
            file: join(hub, 'projects/ideas/empty-folder/project.yml'),
            folder: 'projects/ideas/empty-folder',
            id: 'empty-folder',
            tier: 'ideas',
            ghost: true,
            title: 'empty-folder',
            type: 'idea'
        });
        expect(manifests.find((item) => item.id === 'broken')).toBeUndefined();
        expect(findings.some((item) => item.file.endsWith('/broken/project.yml'))).toBe(true);
    });

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

    it('takes a nested project type from the manifest and the category from its first folder', () => {
        const hub = buildHub();
        const { manifests } = readManifests(hub, SCAN, CATALOG);

        const coauthor = byId(manifests, 'clinical-hccnet');
        expect(coauthor.tier).toBe('coauthor');
        expect(coauthor.category).toBe('active');
        expect(coauthor.type).toBe('in-prep');

        const deep = byId(manifests, 'abduction');
        expect(deep.tier).toBe('archive');
        expect(deep.category).toBe('published');
        expect(deep.type).toBe('published');
        expect(deep.folder).toBe('projects/archive/published/2026/abduction');

        const orphan = byId(manifests, 'orphan');
        expect(orphan.category).toBeUndefined();
        expect(orphan.type).toBe('dropped');
    });

    it('reports an id that is not the folder name and keeps both values', () => {
        const hub = buildHub();
        const { manifests, findings } = readManifests(hub, SCAN, CATALOG);
        const renamed = byId(manifests, 'renamed');

        expect(renamed.id).toBe('renamed');
        expect(renamed.manifestId).toBe('old-name');
        expect(findings).toContainEqual({
            file: join(hub, 'projects/ideas/renamed/project.yml'),
            key: 'id',
            message: 'id "old-name" is not the folder name renamed'
        });
    });

    it('reports a manifest that does not parse or is not a map, and omits its record', () => {
        const hub = buildHub();
        const { manifests, findings } = readManifests(hub, SCAN, CATALOG);

        expect(manifests.map((m) => m.folder)).not.toContain('projects/ideas/broken');
        expect(manifests.map((m) => m.folder)).not.toContain('projects/ideas/listy');

        const broken = findings.find(
            (f) => f.file === join(hub, 'projects/ideas/broken/project.yml')
        );
        expect(broken?.key).toBe('');
        expect(broken?.message).toMatch(/^does not parse: /);

        expect(findings).toContainEqual({
            file: join(hub, 'projects/ideas/listy/project.yml'),
            key: '',
            message: 'is not a map of keys'
        });
    });

    it('reports a flat manifest whose own type disagrees with its tier and uses the tier', () => {
        const hub = buildHub();
        write(
            hub,
            'projects/active/mislabelled/project.yml',
            'id: mislabelled\ntype: idea\ntitle: Mislabelled\n'
        );
        const { manifests, findings } = readManifests(hub, SCAN, CATALOG);

        expect(byId(manifests, 'mislabelled').type).toBe('active');
        expect(findings).toContainEqual({
            file: join(hub, 'projects/active/mislabelled/project.yml'),
            key: 'type',
            message: 'type "idea" is not the tier\'s active'
        });
    });

    it('reports a scan directory that does not exist and reads the rest', () => {
        const hub = buildHub();
        const { manifests, findings } = readManifests(
            hub,
            [...SCAN, { dir: 'projects/nowhere', type: 'ghost' }],
            CATALOG
        );

        expect(manifests.length).toBe(8);
        expect(findings).toContainEqual({
            file: join(hub, 'projects/nowhere'),
            key: 'scan',
            message: 'scan directory does not exist'
        });
    });

    it('says nothing about an optional scan directory the hub does not have', () => {
        const hub = buildHub();
        const { manifests, findings } = readManifests(hub, SCAN, CATALOG);
        expect(findings.some((item) => item.key === 'scan')).toBe(false);
        expect(manifests.some((item) => item.tier === 'software')).toBe(false);
    });

    it('reads an optional tier like any other flat rule once its folder is there', () => {
        const hub = buildHub();
        write(
            hub,
            'projects/software/graphkit/project.yml',
            'id: graphkit\ntype: software\ntitle: GraphKit\nrelated: [btfno]\n'
        );
        const { manifests, findings } = readManifests(hub, SCAN, CATALOG);
        const tool = byId(manifests, 'graphkit');

        expect(tool.tier).toBe('software');
        expect(tool.type).toBe('software');
        expect(tool.folder).toBe('projects/software/graphkit');
        expect(tool.related).toEqual(['btfno']);
        expect(findings.some((item) => item.key === 'scan')).toBe(false);
    });

    it("reports a software manifest whose own type disagrees with its tier and uses the tier's", () => {
        const hub = buildHub();
        write(
            hub,
            'projects/software/mislabelled/project.yml',
            'id: mislabelled\ntype: manuscript\ntitle: Mislabelled\n'
        );
        const { manifests, findings } = readManifests(hub, SCAN, CATALOG);

        expect(byId(manifests, 'mislabelled').type).toBe('software');
        expect(findings).toContainEqual({
            file: join(hub, 'projects/software/mislabelled/project.yml'),
            key: 'type',
            message: 'type "manuscript" is not the tier\'s software'
        });
    });

    it('gives the same order on every run', () => {
        const hub = buildHub();
        const first = readManifests(hub, SCAN, CATALOG);
        const second = readManifests(hub, SCAN, CATALOG);
        expect(second.manifests.map((m) => m.folder)).toEqual(first.manifests.map((m) => m.folder));
        expect(second.findings).toEqual(first.findings);
    });
});

describe('readManifests over a project.yml of the wrong shape', () => {
    const FLAT: ScanRule[] = [{ dir: 'projects/active', type: 'active' }];

    /** What readManifests answers over a hub whose one active project.yml holds `body`. */
    function readOne(body: string) {
        const hub = scratch();
        write(hub, 'projects/active/alpha/project.yml', body);
        const file = join(hub, 'projects/active/alpha/project.yml');
        return { file, ...readManifests(hub, FLAT, CATALOG) };
    }

    it.each([['[]'], ['3'], ['x'], ['']])('reads a file holding %j as one finding', (body) => {
        const read = readOne(body);
        expect(read.manifests).toStrictEqual([]);
        expect(read.findings).toStrictEqual([
            { file: read.file, key: '', message: 'is not a map of keys' }
        ]);
    });

    it('keeps a key the schema does not name, in its place among the others', () => {
        const read = readOne('title: Alpha\nnonesuch: 1\nid: alpha\n');
        expect(Object.keys(read.manifests[0]).slice(0, 3)).toStrictEqual([
            'title',
            'nonesuch',
            'id'
        ]);
        expect(read.manifests[0].nonesuch).toBe(1);
    });
});
