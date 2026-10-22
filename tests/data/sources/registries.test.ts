// Layer 1, data tests. readRegistries against synthetic registry files in a temporary directory.
// Nothing outside it is read or written, and every write asserts its path is inside the temporary
// directory first.

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve, sep } from 'node:path';
import { describe, expect } from 'vitest';
import { readRegistries, registryFiles } from '../../../src/lib/data/sources/registries.ts';
import { engineDefaults } from '../../../src/lib/data/sources/collections.ts';
import { engineDir, loadConfig, textCatalog } from '../../../src/lib/data/sources/config.ts';
import { it, scratchDir } from '../../fixtures/scratch.ts';

/** Each registry's default path, from oculus's own table of default paths. */
const REGISTRY_FILES = registryFiles([], () => engineDefaults().collections);

/** The catalog the findings are worded from: the one oculus ships, read as the server reads it. */
const CATALOG = textCatalog(loadConfig(engineDir()).config);

function scratch(): string {
    const dir = scratchDir('oculus-registries-');
    return dir;
}

function write(hub: string, rel: string, body: string): void {
    const full = join(hub, rel);
    expect(resolve(full).startsWith(resolve(hub) + sep)).toBe(true);
    mkdirSync(dirname(full), { recursive: true });
    writeFileSync(full, body);
}

/**
 * A hub with venues keyed by `id`, datasets under the `datasets` list key, pillars whole, domains
 * unparseable, people and organisations whole, and funding missing from disk.
 */
function buildHub(): string {
    const hub = scratch();
    write(
        hub,
        REGISTRY_FILES.venues,
        [
            'schema:',
            '  - { field: name, type: text }',
            'entries:',
            '  - { id: bspc, name: BSPC, jif: 4.9 }',
            '  - { id: media, name: MedIA }',
            ''
        ].join('\n')
    );
    write(
        hub,
        REGISTRY_FILES.datasets,
        [
            'intro: the local caches',
            'schema: []',
            'datasets:',
            '  - { key: mimic, name: MIMIC-IV, source: https://example.invalid/mimic }',
            '  - { name: nameless }',
            ''
        ].join('\n')
    );
    write(
        hub,
        REGISTRY_FILES.pillars,
        ['schema: []', 'entries:', '  - { key: federated, title: Federated learning }', ''].join(
            '\n'
        )
    );
    write(hub, REGISTRY_FILES.domains, 'entries: "unterminated\n  - [\n');
    write(
        hub,
        REGISTRY_FILES.people,
        [
            'schema: []',
            'entries:',
            '  - { key: naesens, name: Maarten Naesens, affiliations: [ku-leuven], role: host }',
            '  - { key: me, name: The Owner }',
            '  - { name: nameless }',
            ''
        ].join('\n')
    );
    write(
        hub,
        REGISTRY_FILES.organisations,
        [
            'entries:',
            '  - { key: ku-leuven, name: KU Leuven, kind: university, country: BE }',
            ''
        ].join('\n')
    );
    return hub;
}

describe('readRegistries', () => {
    it('reads entries with their provenance and returns the other keys as meta', () => {
        const hub = buildHub();
        const out = readRegistries(hub, REGISTRY_FILES, CATALOG);

        expect(out.venues.entries).toEqual([
            {
                id: 'bspc',
                name: 'BSPC',
                jif: 4.9,
                registry: 'venues',
                key: 'bspc',
                file: join(hub, REGISTRY_FILES.venues)
            },
            {
                id: 'media',
                name: 'MedIA',
                registry: 'venues',
                key: 'media',
                file: join(hub, REGISTRY_FILES.venues)
            }
        ]);
        expect(out.venues.meta).toEqual({ schema: [{ field: 'name', type: 'text' }] });
        expect(out.pillars.entries.map((e) => e.key)).toEqual(['federated']);
        expect(out.pillars.meta).toEqual({ schema: [] });
    });
});

describe('a registry whose list key holds nothing', () => {
    it('reads as a registry with no entries and no finding, as the file is after its last entry is deleted', () => {
        const hub = scratch();
        write(
            hub,
            REGISTRY_FILES.pillars,
            'schema:\n  - { field: key, type: text }\nentries:\n  # none yet\n'
        );
        const out = readRegistries(hub, REGISTRY_FILES, CATALOG);
        expect(out.pillars.entries).toEqual([]);
        expect(out.findings.filter((one) => one.file.endsWith(REGISTRY_FILES.pillars))).toEqual([]);
    });
});
