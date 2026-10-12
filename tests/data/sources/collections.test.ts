// Layer 1, data tests. readCollections against synthetic collection files in a temporary directory.
// Nothing outside it is read or written, and every write asserts its path is inside the temporary
// directory first.

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve, sep } from 'node:path';
import { describe, expect } from 'vitest';
import type { CollectionFile } from '../../../src/lib/data/sources/collections.ts';
import { readCollections } from '../../../src/lib/data/sources/collections.ts';
import { engineDir, loadConfig, textCatalog } from '../../../src/lib/data/sources/config.ts';
import { it, scratchDir } from '../../fixtures/scratch.ts';

/** The catalog the findings are worded from: the one oculus ships, read as the server reads it. */
const CATALOG = textCatalog(loadConfig(engineDir()).config);

const FILES: CollectionFile[] = [
    { key: 'data', file: 'registries/data.yml' },
    { key: 'events', file: 'network/events.yml' },
    { key: 'joint-work', file: 'network/joint-work.yml' },
    { key: 'tasks', file: 'tasks/tasks.yml' },
    { key: 'tools', file: 'registries/tools.yml' },
    { key: 'missing', file: 'nowhere/gone.yml' },
    { key: 'listless', file: 'odd/listless.yml' }
];

function scratch(): string {
    const dir = scratchDir('oculus-collections-');
    return dir;
}

function write(hub: string, rel: string, body: string): void {
    const full = join(hub, rel);
    expect(resolve(full).startsWith(resolve(hub) + sep)).toBe(true);
    mkdirSync(dirname(full), { recursive: true });
    writeFileSync(full, body);
}

/**
 * A hub with a collection keyed by `title`, one keyed by `key`, one with no title or intro, one
 * holding an entry that is not a map, one file absent from disk, and one whose `entries` is a map.
 */
function buildHub(): string {
    const hub = scratch();
    write(
        hub,
        'registries/data.yml',
        [
            'intro: dataset registry',
            'schema:',
            '  - { field: key, type: text }',
            'datasets:',
            '  - { key: mimic, name: MIMIC-IV, themes: [ecg], source: https://example.invalid/mimic }',
            ''
        ].join('\n')
    );
    write(
        hub,
        'network/events.yml',
        [
            'title: Talks & Events',
            'intro: where the work was shown',
            'schema:',
            '  - { field: title, type: text }',
            'entries:',
            '  - { title: ISBI keynote, year: 2026 }',
            '  - { title: Tensor workshop, year: 2025 }',
            ''
        ].join('\n')
    );
    write(
        hub,
        'network/joint-work.yml',
        [
            'title: Collaborations',
            'intro: who the work is with',
            'entries:',
            '  - { key: linkoping, title: Linkoping, since: 2024 }',
            '  - { key: leuven, title: Leuven }',
            ''
        ].join('\n')
    );
    // No title and no intro: meta is the schema alone, as tasks/tasks.yml is on the hub.
    write(
        hub,
        'tasks/tasks.yml',
        ['schema: []', 'entries:', '  - { title: Review AAIM submission }', ''].join('\n')
    );
    // One entry is a bare string rather than a map: a finding, and the others still come back.
    write(
        hub,
        'registries/tools.yml',
        [
            'title: Tools',
            'entries:',
            '  - { title: bttrlib, url: https://example.invalid/bttrlib }',
            '  - just-a-string',
            '  - { title: oculus }',
            ''
        ].join('\n')
    );
    // Parses, but `entries` is a map rather than a list.
    write(hub, 'odd/listless.yml', ['title: Listless', 'entries:', '  one: 1', ''].join('\n'));
    // nowhere/gone.yml is deliberately never written.
    return hub;
}

describe('readCollections', () => {
    it('reads a title-keyed collection with its entries in file order', () => {
        const hub = buildHub();
        const { collections } = readCollections(hub, FILES, CATALOG);
        const events = collections.events;

        expect(events.key).toBe('events');
        expect(events.file).toBe(join(hub, 'network/events.yml'));
        expect(events.entries.map((e) => e.title)).toEqual(['ISBI keynote', 'Tensor workshop']);
        expect(events.entries[1].year).toBe(2025);
    });
});
