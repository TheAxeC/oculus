// readManifests against a synthetic hub in a temporary directory. Nothing outside it is read or
// written, and every write asserts its path is inside the temporary directory first.

import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve, sep } from 'node:path';
import { describe, expect, it } from 'vitest';
import { readManifests } from '../../src/lib/data/sources/manifests.ts';
import type { RawManifest, ScanRule } from '../../src/lib/data/model.ts';

const SCAN: ScanRule[] = [
  { dir: 'projects/ideas', type: 'idea' },
  { dir: 'projects/active', type: 'active' },
  { dir: 'projects/manuscripts', type: 'manuscript' },
  { dir: 'projects/coauthor', nested: true },
  { dir: 'projects/archive', nested: true }
];

function scratch(): string {
  const dir = mkdtempSync(join(tmpdir(), 'oculus-manifests-'));
  expect(resolve(dir).startsWith(resolve(tmpdir()) + sep)).toBe(true);
  return dir;
}

function write(hub: string, rel: string, body: string): void {
  const full = join(hub, rel);
  expect(resolve(full).startsWith(resolve(hub) + sep)).toBe(true);
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, body);
}

/** A hub with all five tiers, a flat and a nested project each, and the awkward cases. */
function buildHub(): string {
  const hub = scratch();
  for (const tier of ['ideas', 'active', 'manuscripts', 'coauthor', 'archive']) {
    mkdirSync(join(hub, 'projects', tier), { recursive: true });
  }

  write(hub, 'projects/ideas/tensor-spark/project.yml', 'id: tensor-spark\ntype: idea\ntitle: Tensor spark\n');
  write(hub, 'projects/active/loewner/project.yml', 'id: loewner\ntype: active\ntitle: Loewner layers\n');
  write(hub, 'projects/manuscripts/btfno/project.yml', 'id: btfno\ntype: manuscript\ntitle: BT-FNO\nvenue_id: aaai\n');

  // Nested: one category deep, and one filed a second level down by year.
  write(hub, 'projects/coauthor/active/clinical-hccnet/project.yml', 'id: clinical-hccnet\ntype: in-prep\ntitle: Clinical HCCNet\n');
  write(hub, 'projects/archive/published/2026/abduction/project.yml', 'id: abduction\ntype: published\ntitle: Abduction\n');
  // Nested, no category folder: the project sits straight under the tier.
  write(hub, 'projects/archive/orphan/project.yml', 'id: orphan\ntype: dropped\ntitle: Orphan\n');

  // A folder with no project.yml at all: skipped in silence.
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
  write(hub, 'projects/archive/published/2026/abduction/attic/project.yml', 'id: attic-decoy\ntitle: Attic decoy\n');
  write(hub, 'projects/coauthor/active/clinical-hccnet/code/deep/project.yml', 'id: deep-decoy\ntitle: Deep decoy\n');

  return hub;
}

function byId(manifests: RawManifest[], id: string): RawManifest {
  const found = manifests.find((m) => m.id === id);
  expect(found, `no manifest with id ${id}`).toBeDefined();
  return found as RawManifest;
}

describe('readManifests', () => {
  it('reads every tier and skips folders and decoys that are not projects', () => {
    const hub = buildHub();
    const { manifests } = readManifests(hub, SCAN);

    expect(manifests.map((m) => m.folder)).toEqual([
      'projects/active/loewner',
      'projects/archive/orphan',
      'projects/archive/published/2026/abduction',
      'projects/coauthor/active/clinical-hccnet',
      'projects/ideas/renamed',
      'projects/ideas/tensor-spark',
      'projects/manuscripts/btfno'
    ]);
    expect(manifests.map((m) => m.id)).not.toContain('decoy');
    expect(manifests.map((m) => m.id)).not.toContain('attic-decoy');
    expect(manifests.map((m) => m.id)).not.toContain('deep-decoy');
  });

  it('carries the provenance of a flat project', () => {
    const hub = buildHub();
    const { manifests } = readManifests(hub, SCAN);
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
    const { manifests } = readManifests(hub, SCAN);

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
    const { manifests, findings } = readManifests(hub, SCAN);
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
    const { manifests, findings } = readManifests(hub, SCAN);

    expect(manifests.map((m) => m.folder)).not.toContain('projects/ideas/broken');
    expect(manifests.map((m) => m.folder)).not.toContain('projects/ideas/listy');

    const broken = findings.find((f) => f.file === join(hub, 'projects/ideas/broken/project.yml'));
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
    write(hub, 'projects/active/mislabelled/project.yml', 'id: mislabelled\ntype: idea\ntitle: Mislabelled\n');
    const { manifests, findings } = readManifests(hub, SCAN);

    expect(byId(manifests, 'mislabelled').type).toBe('active');
    expect(findings).toContainEqual({
      file: join(hub, 'projects/active/mislabelled/project.yml'),
      key: 'type',
      message: 'type "idea" is not the tier\'s active'
    });
  });

  it('reports a scan directory that does not exist and reads the rest', () => {
    const hub = buildHub();
    const { manifests, findings } = readManifests(hub, [...SCAN, { dir: 'projects/nowhere', type: 'ghost' }]);

    expect(manifests.length).toBe(7);
    expect(findings).toContainEqual({
      file: join(hub, 'projects/nowhere'),
      key: 'scan',
      message: 'scan directory does not exist'
    });
  });

  it('gives the same order on every run', () => {
    const hub = buildHub();
    const first = readManifests(hub, SCAN);
    const second = readManifests(hub, SCAN);
    expect(second.manifests.map((m) => m.folder)).toEqual(first.manifests.map((m) => m.folder));
    expect(second.findings).toEqual(first.findings);
  });
});
