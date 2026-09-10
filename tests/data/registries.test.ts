// readRegistries against synthetic registry files in a temporary directory. Nothing outside it is
// read or written, and every write asserts its path is inside the temporary directory first.

import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve, sep } from 'node:path';
import { describe, expect, it } from 'vitest';
import { REGISTRY_FILES, readRegistries } from '../../src/lib/data/sources/registries.ts';

function scratch(): string {
    const dir = mkdtempSync(join(tmpdir(), 'oculus-registries-'));
    expect(resolve(dir).startsWith(resolve(tmpdir()) + sep)).toBe(true);
    return dir;
}

function write(hub: string, rel: string, body: string): void {
    const full = join(hub, rel);
    expect(resolve(full).startsWith(resolve(hub) + sep)).toBe(true);
    mkdirSync(dirname(full), { recursive: true });
    writeFileSync(full, body);
}

/**
 * A hub with venues keyed by `id`, datasets under the `datasets` list key, programs whole,
 * domains unparseable, and funding missing from disk.
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
            'theme_labels: { eeg: EEG }',
            'schema: []',
            'datasets:',
            '  - { key: mimic, name: MIMIC-IV }',
            '  - { name: nameless }',
            ''
        ].join('\n')
    );
    write(
        hub,
        REGISTRY_FILES.programs,
        ['schema: []', 'entries:', '  - { key: federated, title: Federated learning }', ''].join(
            '\n'
        )
    );
    write(hub, REGISTRY_FILES.domains, 'entries: "unterminated\n  - [\n');
    return hub;
}

describe('readRegistries', () => {
    it('reads entries with their provenance and returns the other keys as meta', () => {
        const hub = buildHub();
        const out = readRegistries(hub);

        expect(out.venues.entries).toEqual([
            {
                id: 'bspc',
                name: 'BSPC',
                jif: 4.9,
                source: 'venues',
                key: 'bspc',
                file: join(hub, REGISTRY_FILES.venues)
            },
            {
                id: 'media',
                name: 'MedIA',
                source: 'venues',
                key: 'media',
                file: join(hub, REGISTRY_FILES.venues)
            }
        ]);
        expect(out.venues.meta).toEqual({ schema: [{ field: 'name', type: 'text' }] });
        expect(out.programs.entries.map((e) => e.key)).toEqual(['federated']);
        expect(out.programs.meta).toEqual({ schema: [] });
    });

    it('reads the dataset registry from its own list key and keeps its other keys as meta', () => {
        const hub = buildHub();
        const out = readRegistries(hub);

        expect(out.datasets.entries.map((e) => e.name)).toEqual(['MIMIC-IV', 'nameless']);
        expect(out.datasets.entries[0].source).toBe('datasets');
        expect(out.datasets.meta).toEqual({
            intro: 'the local caches',
            theme_labels: { eeg: 'EEG' },
            schema: []
        });
    });

    it('reports an entry with no id field and keeps it with an empty key', () => {
        const hub = buildHub();
        const out = readRegistries(hub);

        expect(out.datasets.entries[1].key).toBe('');
        expect(out.findings).toContainEqual({
            file: join(hub, REGISTRY_FILES.datasets),
            key: 'datasets[1]',
            message: 'entry has no string key'
        });
    });

    it('reports a file that does not parse and one that is missing, with empty lists', () => {
        const hub = buildHub();
        const out = readRegistries(hub);

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
        const out = readRegistries(hub);

        expect(out.funding.entries.map((e) => e.key)).toEqual(['', 'FAIR']);
        expect(out.funding.meta).toEqual({ title: 'Funding' });
        expect(out.findings.filter((f) => f.file === join(hub, REGISTRY_FILES.funding))).toEqual(
            []
        );
    });

    it('reports a missing entry list and an entry that is not a map', () => {
        const hub = buildHub();
        write(hub, REGISTRY_FILES.domains, 'schema: []\n');
        write(hub, REGISTRY_FILES.programs, 'entries:\n  - just-a-string\n');
        const out = readRegistries(hub);

        expect(out.domains.entries).toEqual([]);
        expect(out.domains.meta).toEqual({ schema: [] });
        expect(out.findings).toContainEqual({
            file: join(hub, REGISTRY_FILES.domains),
            key: 'entries',
            message: 'entry list entries is missing'
        });
        expect(out.programs.entries).toEqual([]);
        expect(out.findings).toContainEqual({
            file: join(hub, REGISTRY_FILES.programs),
            key: 'entries[0]',
            message: 'entry is not a map of keys'
        });
    });
});
