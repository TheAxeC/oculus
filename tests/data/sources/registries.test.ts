// Layer 1, data tests. readRegistries against synthetic registry files in a temporary directory.
// Nothing outside it is read or written, and every write asserts its path is inside the temporary
// directory first.

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve, sep } from 'node:path';
import { describe, expect } from 'vitest';
import { REGISTRY_FILES, readRegistries } from '../../../src/lib/data/sources/registries.ts';
import { engineDir, loadConfig, textCatalog } from '../../../src/lib/data/sources/config.ts';
import { it, scratchDir } from '../../fixtures/scratch.ts';

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
            '  - { key: me, name: The Owner, self: true }',
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

    it('reads the dataset registry from its own list key and keeps its other keys as meta', () => {
        const hub = buildHub();
        const out = readRegistries(hub, REGISTRY_FILES, CATALOG);

        expect(out.datasets.entries.map((e) => e.name)).toEqual(['MIMIC-IV', 'nameless']);
        expect(out.datasets.entries[0].registry).toBe('datasets');
        // The entry's own `source` (its URL) is not the provenance key and survives the read.
        expect(out.datasets.entries[0].source).toBe('https://example.invalid/mimic');
        expect(out.datasets.meta).toEqual({
            intro: 'the local caches',
            schema: []
        });
    });

    it('reports an entry with no id field and keeps it with an empty key', () => {
        const hub = buildHub();
        const out = readRegistries(hub, REGISTRY_FILES, CATALOG);

        expect(out.datasets.entries[1].key).toBe('');
        expect(out.findings).toContainEqual({
            file: join(hub, REGISTRY_FILES.datasets),
            key: 'datasets[1]',
            message: 'entry has no string key'
        });
    });

    it('reports a file that does not parse and one that is missing, with empty lists', () => {
        const hub = buildHub();
        const out = readRegistries(hub, REGISTRY_FILES, CATALOG);

        expect(out.domains.entries).toEqual([]);
        expect(out.domains.meta).toEqual({});
        const domains = out.findings.find((f) => f.file === join(hub, REGISTRY_FILES.domains));
        expect(domains?.message).toMatch(/^does not parse: /);

        expect(out.funding.entries).toEqual([]);
        expect(out.findings).toContainEqual({
            file: join(hub, REGISTRY_FILES.funding),
            key: '',
            message: 'registry file does not exist'
        });
    });

    it('leaves a funding entry without a key unreported, because that file marks it optional', () => {
        const hub = buildHub();
        write(
            hub,
            REGISTRY_FILES.funding,
            [
                'title: Funding',
                'entries:',
                '  - { title: NWO Veni }',
                '  - { key: FAIR, title: Flanders AI }',
                ''
            ].join('\n')
        );
        const out = readRegistries(hub, REGISTRY_FILES, CATALOG);

        expect(out.funding.entries.map((e) => e.key)).toEqual(['', 'FAIR']);
        expect(out.funding.meta).toEqual({ title: 'Funding' });
        expect(out.findings.filter((f) => f.file === join(hub, REGISTRY_FILES.funding))).toEqual(
            []
        );
    });

    it('reports a missing entry list and an entry that is not a map', () => {
        const hub = buildHub();
        write(hub, REGISTRY_FILES.domains, 'schema: []\n');
        write(hub, REGISTRY_FILES.pillars, 'entries:\n  - just-a-string\n');
        const out = readRegistries(hub, REGISTRY_FILES, CATALOG);

        expect(out.domains.entries).toEqual([]);
        expect(out.domains.meta).toEqual({ schema: [] });
        expect(out.findings).toContainEqual({
            file: join(hub, REGISTRY_FILES.domains),
            key: 'entries',
            message: 'entry list entries is missing'
        });
        expect(out.pillars.entries).toEqual([]);
        expect(out.findings).toContainEqual({
            file: join(hub, REGISTRY_FILES.pillars),
            key: 'entries[0]',
            message: 'entry is not a map of keys'
        });
    });
    it('reads the people and organisation registries, keyed by their own `key`', () => {
        const hub = buildHub();
        const out = readRegistries(hub, REGISTRY_FILES, CATALOG);

        expect(out.people.entries.map((entry) => entry.key)).toEqual(['naesens', 'me', '']);
        expect(out.people.entries[0]).toEqual({
            key: 'naesens',
            name: 'Maarten Naesens',
            affiliations: ['ku-leuven'],
            role: 'host',
            registry: 'people',
            file: join(hub, REGISTRY_FILES.people)
        });
        expect(out.people.entries[1].self).toBe(true);
        expect(out.organisations.entries).toEqual([
            {
                key: 'ku-leuven',
                name: 'KU Leuven',
                kind: 'university',
                country: 'BE',
                registry: 'organisations',
                file: join(hub, REGISTRY_FILES.organisations)
            }
        ]);
        expect(out.findings).toContainEqual({
            file: join(hub, REGISTRY_FILES.people),
            key: 'entries[2]',
            message: 'entry has no string key'
        });
    });
});

describe('readRegistries over a registry file of the wrong shape', () => {
    /** The venues registry and its findings for a hub whose venue file holds `body`. */
    function readVenues(body: string) {
        const hub = scratch();
        write(hub, REGISTRY_FILES.venues, body);
        const file = join(hub, REGISTRY_FILES.venues);
        const out = readRegistries(hub, REGISTRY_FILES, CATALOG);
        return { file, venues: out.venues, findings: out.findings.filter((f) => f.file === file) };
    }

    it.each([['[]'], ['3'], ['x'], ['']])('reads a file holding %j as one finding', (body) => {
        const read = readVenues(body);
        expect(read.findings).toStrictEqual([
            { file: read.file, key: '', message: 'is not a map of keys' }
        ]);
        expect(read.venues).toStrictEqual({ entries: [], meta: {} });
    });

    it('reads an entry list that is a map as one finding and no entries', () => {
        const read = readVenues('title: V\nentries:\n  a: 1\n');
        expect(read.findings).toStrictEqual([
            { file: read.file, key: 'entries', message: 'entry list entries is not a list' }
        ]);
        expect(read.venues).toStrictEqual({ entries: [], meta: { title: 'V' } });
    });

    it('reads each item of the list by its own shape and hands a map on with its provenance', () => {
        const read = readVenues(
            'entries:\n  - 3\n  - null\n  - { id: 3 }\n  - { id: "" }\n  - { id: a, extra: 1 }\n'
        );
        expect(read.findings).toStrictEqual([
            { file: read.file, key: 'entries[0]', message: 'entry is not a map of keys' },
            { file: read.file, key: 'entries[1]', message: 'entry is not a map of keys' },
            { file: read.file, key: 'entries[2]', message: 'entry has no string id' },
            { file: read.file, key: 'entries[3]', message: 'entry has no string id' }
        ]);
        expect(read.venues.entries).toStrictEqual([
            { id: 3, registry: 'venues', key: '', file: read.file },
            { id: '', registry: 'venues', key: '', file: read.file },
            { id: 'a', extra: 1, registry: 'venues', key: 'a', file: read.file }
        ]);
    });

    it('keeps the keys of an entry and of the meta in the order the file wrote them', () => {
        const read = readVenues(
            'zeta: 1\nentries:\n  - { name: N, id: a, extra: 1, alpha: 2 }\nalpha: 3\n'
        );
        expect(Object.keys(read.venues.meta)).toStrictEqual(['zeta', 'alpha']);
        expect(Object.keys(read.venues.entries[0])).toStrictEqual([
            'name',
            'id',
            'extra',
            'alpha',
            'registry',
            'key',
            'file'
        ]);
    });

    it('skips an own __proto__ key of the file when it builds the meta', () => {
        const read = readVenues('__proto__:\n  injected: "yes"\ntitle: V\nentries: []\n');
        expect(Object.getPrototypeOf(read.venues.meta)).toBe(Object.prototype);
        expect(read.venues.meta).not.toHaveProperty('injected');
        expect(Object.keys(read.venues.meta)).toStrictEqual(['title']);
    });
});
