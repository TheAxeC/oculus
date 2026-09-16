// readCollections against synthetic collection files in a temporary directory. Nothing outside it
// is read or written, and every write asserts its path is inside the temporary directory first.

import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve, sep } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { CollectionFile } from '../../src/lib/data/sources/collections.ts';
import { readCollections } from '../../src/lib/data/sources/collections.ts';

const FILES: CollectionFile[] = [
    { key: 'data', file: 'registries/data.yml' },
    { key: 'events', file: 'network/events.yml' },
    { key: 'joint-work', file: 'network/joint-work.yml' },
    { key: 'tasks', file: 'tasks/tasks.yml' },
    { key: 'code', file: 'registries/repos.yml' },
    { key: 'missing', file: 'nowhere/gone.yml' },
    { key: 'listless', file: 'odd/listless.yml' }
];

function scratch(): string {
    const dir = mkdtempSync(join(tmpdir(), 'oculus-collections-'));
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
        'registries/repos.yml',
        [
            'title: Code',
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
    it('reads the data registry from its datasets list and keeps its metadata', () => {
        const hub = buildHub();
        const { collections, findings } = readCollections(hub, FILES);

        expect(collections.data.entries.map((entry) => entry.key)).toEqual(['mimic']);
        expect(collections.data.entries[0].source).toBe('https://example.invalid/mimic');
        expect(collections.data.meta).toEqual({
            intro: 'dataset registry',
            schema: [{ field: 'key', type: 'text' }]
        });
        expect(findings.filter((finding) => finding.file.endsWith('registries/data.yml'))).toEqual(
            []
        );
    });

    it('reads a title-keyed collection with its entries in file order', () => {
        const hub = buildHub();
        const { collections } = readCollections(hub, FILES);
        const events = collections.events;

        expect(events.key).toBe('events');
        expect(events.file).toBe(join(hub, 'network/events.yml'));
        expect(events.entries.map((e) => e.title)).toEqual(['ISBI keynote', 'Tensor workshop']);
        expect(events.entries[1].year).toBe(2025);
    });

    it('keeps every top-level key other than entries as meta, untouched', () => {
        const hub = buildHub();
        const { collections } = readCollections(hub, FILES);

        expect(collections.events.meta).toEqual({
            title: 'Talks & Events',
            intro: 'where the work was shown',
            schema: [{ field: 'title', type: 'text' }]
        });
        expect(collections.tasks.meta).toEqual({ schema: [] });
        expect(collections.events.meta).not.toHaveProperty('entries');
    });

    it('records provenance on every entry and derives no identity', () => {
        const hub = buildHub();
        const { collections } = readCollections(hub, FILES);
        const file = join(hub, 'network/joint-work.yml');

        expect(collections['joint-work'].entries[0].provenance).toEqual({ file, index: 0 });
        expect(collections['joint-work'].entries[1].provenance).toEqual({ file, index: 1 });
        // Keyed by `key` here and by `title` in events; both come back exactly as read.
        expect(collections['joint-work'].entries[0].key).toBe('linkoping');
        expect(collections['joint-work'].entries[0].title).toBe('Linkoping');
        expect(collections.events.entries[0].key).toBeUndefined();
    });

    it('reports a file that is not on disk and gives an empty collection', () => {
        const hub = buildHub();
        const { collections, findings } = readCollections(hub, FILES);
        const file = join(hub, 'nowhere/gone.yml');

        expect(collections.missing).toEqual({ key: 'missing', file, meta: {}, entries: [] });
        expect(findings).toContainEqual({
            file,
            key: '',
            message: 'collection file does not exist'
        });
    });

    it('reports an entries key that is not a list, and keeps the meta it did read', () => {
        const hub = buildHub();
        const { collections, findings } = readCollections(hub, FILES);

        expect(collections.listless.entries).toEqual([]);
        expect(collections.listless.meta).toEqual({ title: 'Listless' });
        expect(findings).toContainEqual({
            file: join(hub, 'odd/listless.yml'),
            key: 'entries',
            message: 'entry list entries is not a list'
        });
    });

    it('reports an entry that is not a map and keeps the entries around it', () => {
        const hub = buildHub();
        const { collections, findings } = readCollections(hub, FILES);

        expect(collections.code.entries.map((e) => e.title)).toEqual(['bttrlib', 'oculus']);
        expect(collections.code.entries[1].provenance).toEqual({
            file: join(hub, 'registries/repos.yml'),
            index: 2
        });
        expect(findings).toContainEqual({
            file: join(hub, 'registries/repos.yml'),
            key: 'entries[1]',
            message: 'entry is not a map of keys'
        });
    });

    it('reports a file that does not parse and gives an empty collection', () => {
        const hub = buildHub();
        write(hub, 'odd/broken.yml', 'title: "unterminated\n  - [\n');
        const { collections, findings } = readCollections(hub, [
            { key: 'broken', file: 'odd/broken.yml' }
        ]);

        expect(collections.broken.entries).toEqual([]);
        expect(collections.broken.meta).toEqual({});
        const broken = findings.find((f) => f.file === join(hub, 'odd/broken.yml'));
        expect(broken?.key).toBe('');
        expect(broken?.message).toMatch(/^does not parse: /);
    });

    it('reports a file that parses to something other than a map', () => {
        const hub = buildHub();
        write(hub, 'odd/listy.yml', '- one\n- two\n');
        const { collections, findings } = readCollections(hub, [
            { key: 'listy', file: 'odd/listy.yml' }
        ]);

        expect(collections.listy.entries).toEqual([]);
        expect(findings).toContainEqual({
            file: join(hub, 'odd/listy.yml'),
            key: '',
            message: 'is not a map of keys'
        });
    });

    it('reports a key asked for twice and keeps the later file', () => {
        const hub = buildHub();
        const { collections, findings } = readCollections(hub, [
            { key: 'events', file: 'network/events.yml' },
            { key: 'events', file: 'tasks/tasks.yml' }
        ]);

        expect(collections.events.file).toBe(join(hub, 'tasks/tasks.yml'));
        expect(findings).toContainEqual({
            file: join(hub, 'tasks/tasks.yml'),
            key: 'events',
            message: `collection key events is already read from ${join(hub, 'network/events.yml')}`
        });
    });

    it('gives the same result on every run', () => {
        const hub = buildHub();
        const first = readCollections(hub, FILES);
        const second = readCollections(hub, FILES);
        expect(second.collections).toEqual(first.collections);
        expect(second.findings).toEqual(first.findings);
    });
});
