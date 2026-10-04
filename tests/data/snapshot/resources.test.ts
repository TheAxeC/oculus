// Layer 1, data tests. The resources registry and the manifests' `compute:` list, read the way the
// server reads a hub: a hub planted in a scratch directory, built through buildPortfolio, and the
// snapshot's entities, the project's resource ids and the findings asserted. Every sentence is
// looked up in the shipped catalog, so a finding whose catalog key is missing fails the test that
// expects it.

import { join } from 'node:path';
import { describe, expect } from 'vitest';
import { buildPortfolio, portfolioConfigFrom } from '../../../src/lib/data/index.ts';
import { findingText } from '../../../src/lib/data/helpers/finding-text.ts';
import { engineDir, loadConfig, textCatalog } from '../../../src/lib/data/sources/config.ts';
import type { Finding, Snapshot } from '../../../src/lib/data/model/index.ts';
import { it, plantScratch } from '../../fixtures/scratch.ts';

const ENGINE = engineDir();
const LOADED = loadConfig(ENGINE).config;
const CATALOG = textCatalog(LOADED);
const CONFIG = portfolioConfigFrom(LOADED, ENGINE);

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
    return buildPortfolio(
        plantScratch('oculus-resources-hub-', files, ['projects/active']),
        CONFIG
    );
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

describe('the resources registry', () => {
    it('holds the three seed entries with their kinds and no finding', () => {
        const snapshot = build(SEED, { alpha: 'compute: [utwente]\n' });
        expect(Object.keys(snapshot.entities.resources)).toEqual(['data', 'this-mac', 'utwente']);
        expect(snapshot.entities.resources.utwente).toEqual({
            id: 'utwente',
            name: 'UTwente HPC',
            kind: 'cluster',
            host: 'utwente',
            access: 'ssh from the UT network or EduVPN',
            links: ['docs/HPC-UTwente-howto.md'],
            order: 0
        });
        expect(snapshot.entities.resources['this-mac'].kind).toBe('machine');
        expect(snapshot.entities.resources['this-mac'].host).toBeUndefined();
        expect(snapshot.entities.resources.data.kind).toBe('storage');
        expect(about(snapshot)).toEqual([]);
    });

    it('records an entry whose kind is none of the three, drops it, and fails a project naming it', () => {
        const snapshot = build('entries:\n  - { key: x, name: X, kind: gpu }\n', {
            alpha: 'compute: [x]\n'
        });
        expect(plain(about(snapshot))).toEqual([
            ['project.yml', 'compute', sentence('findings.validate.no_resource', 'x')],
            [
                'resources.yml',
                'entries[0].kind',
                sentence('findings.validate.kind_not_resource', '"gpu"')
            ]
        ]);
        expect(snapshot.entities.resources).toEqual({});
        expect(snapshot.entities.projects.alpha.resourceIds).toEqual([]);
    });

    it('leaves out an entry with no key, by the missing-id finding, and one with no kind', () => {
        const snapshot = build(
            [
                'entries:',
                '  - { name: Nameless, kind: machine }',
                '  - { key: bare, name: Bare }',
                ''
            ].join('\n'),
            {}
        );
        expect(plain(about(snapshot))).toEqual([
            ['resources.yml', 'entries[0]', sentence('findings.registries.entry_no_id', 'key')],
            [
                'resources.yml',
                'entries[1].kind',
                sentence('findings.validate.kind_not_resource', 'null')
            ]
        ]);
        expect(snapshot.entities.resources).toEqual({});
    });

    it('is empty with the missing-file finding when the file is absent, and every name is unresolved', () => {
        const snapshot = build(null, { alpha: 'compute: [utwente]\n' });
        expect(snapshot.entities.resources).toEqual({});
        expect(plain(about(snapshot))).toEqual([
            ['project.yml', 'compute', sentence('findings.validate.no_resource', 'utwente')],
            ['resources.yml', '', sentence('findings.registries.file_missing')]
        ]);
        expect(snapshot.entities.projects.alpha.resourceIds).toEqual([]);
    });

    it('is empty with the parse finding when the file does not parse', () => {
        const snapshot = build('entries: [unclosed\n', { alpha: 'compute: [utwente]\n' });
        expect(snapshot.entities.resources).toEqual({});
        const found = about(snapshot);
        expect(found.map((finding) => finding.file.split('/').at(-1))).toEqual([
            'project.yml',
            'resources.yml'
        ]);
        expect(found[1]?.message.startsWith('does not parse')).toBe(true);
    });

    it('keeps the first of two entries with one key and flags the second', () => {
        const snapshot = build(
            [
                'entries:',
                '  - { key: utwente, name: First, kind: cluster, host: one }',
                '  - { key: utwente, name: Second, kind: cluster, host: two }',
                ''
            ].join('\n'),
            {}
        );
        expect(plain(about(snapshot))).toEqual([
            [
                'resources.yml',
                'entries[1].key',
                sentence('findings.validate.resource_duplicate', 'utwente')
            ]
        ]);
        expect(snapshot.entities.resources.utwente.name).toBe('First');
        expect(snapshot.entities.resources.utwente.host).toBe('one');
    });

    it('leaves out an entry keyed with a reserved word', () => {
        const snapshot = build(
            [
                'entries:',
                '  - { key: __none__, name: A, kind: machine }',
                '  - { key: __proto__, name: B, kind: machine }',
                '  - { key: constructor, name: C, kind: machine }',
                ''
            ].join('\n'),
            { alpha: 'compute: [__none__, constructor]\n' }
        );
        expect(Object.keys(snapshot.entities.resources)).toEqual([]);
        expect(Object.getPrototypeOf(snapshot.entities.resources)).toBe(Object.prototype);
        const reserved = about(snapshot).filter((finding) =>
            finding.file.endsWith('resources.yml')
        );
        expect(plain(reserved)).toEqual([
            [
                'resources.yml',
                'entries[0].key',
                sentence('findings.validate.resource_reserved', '__none__')
            ],
            [
                'resources.yml',
                'entries[1].key',
                sentence('findings.validate.resource_reserved', '__proto__')
            ],
            [
                'resources.yml',
                'entries[2].key',
                sentence('findings.validate.resource_reserved', 'constructor')
            ]
        ]);
        expect(snapshot.entities.projects.alpha.resourceIds).toEqual([]);
    });

    it('reads host as none when it is not a text, and links as the texts among a list', () => {
        const snapshot = build(
            'entries:\n  - { key: c, name: C, kind: cluster, host: 3, links: [a, 4, b] }\n',
            {}
        );
        expect(snapshot.entities.resources.c.host).toBeUndefined();
        expect(snapshot.entities.resources.c.links).toEqual(['a', 'b']);
    });
});

describe("a project's compute list", () => {
    const projectOf = (snapshot: Snapshot, id = 'alpha'): string[] | undefined =>
        snapshot.entities.projects[id].resourceIds;

    it('reads one key', () => {
        const snapshot = build(SEED, { alpha: 'compute: [utwente]\n' });
        expect(projectOf(snapshot)).toEqual(['utwente']);
        expect(about(snapshot)).toEqual([]);
    });

    it('keeps the manifest order, not the alphabetical one', () => {
        const snapshot = build(SEED, {
            alpha: 'compute: [utwente, data]\n',
            beta: 'compute: [data, utwente]\n'
        });
        expect(projectOf(snapshot, 'alpha')).toEqual(['utwente', 'data']);
        expect(projectOf(snapshot, 'beta')).toEqual(['data', 'utwente']);
    });

    it('names an unknown key in a finding and reads it as none', () => {
        const snapshot = build(SEED, { alpha: 'compute: [nowhere]\n' });
        expect(plain(about(snapshot))).toEqual([
            ['project.yml', 'compute', sentence('findings.validate.no_resource', 'nowhere')]
        ]);
        expect(projectOf(snapshot)).toEqual([]);
    });

    it('answers a scalar compute: with the list-shape finding and reads it as none', () => {
        const snapshot = build(SEED, { alpha: 'compute: hpc\n' });
        expect(plain(about(snapshot))).toEqual([
            [
                'project.yml',
                'compute',
                sentence(
                    'findings.validate.must_be_list_or_null',
                    'compute',
                    sentence('findings.shape.is_other', 'string')
                )
            ]
        ]);
        expect(projectOf(snapshot)).toEqual([]);
    });

    it('takes an absent, an empty and a bare compute as none with no finding', () => {
        const snapshot = build(SEED, {
            alpha: '',
            beta: 'compute: []\n',
            gamma: 'compute:\n'
        });
        expect(about(snapshot)).toEqual([]);
        for (const id of ['alpha', 'beta', 'gamma']) expect(projectOf(snapshot, id)).toEqual([]);
    });

    it('counts a repeated key and a non-text once', () => {
        const snapshot = build(SEED, { alpha: 'compute: [utwente, utwente, 3]\n' });
        expect(projectOf(snapshot)).toEqual(['utwente']);
    });
});
