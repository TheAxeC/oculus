// The write rule one level below the manifest: a collection entry, a subtask line and
// a host line are edited in their own bytes and nothing else moves.
//
// The documents below carry the shapes the hub writes: entries as block maps opening with `title:`
// or with `key:`, a `subtasks:` list of one-line flow maps on an entry and on a manifest, a
// `subtasks:` map of them on a manifest, `hosts:` as one-line flow maps, inline comments, a blank
// line between entries and a top-level key after the list. Every case checks the text itself, and
// then checks that the text parses to the source with exactly the one change applied.
//
// The last describe reads the real hub, read only, the way tests/server/yaml-edit.test.ts does: a
// rule that holds on a fixture and not on the hub's own collection files is not a rule. Nothing
// there is written; when the hub is not on this machine the whole block skips and says so.

import { existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, sep } from 'node:path';
import { parse } from 'yaml';
import { describe, expect, it } from 'vitest';
import {
    addSubtask,
    appendEntry,
    deleteEntry,
    deleteSubtask,
    entryRange,
    renderEntry,
    renderFlowMap,
    reorderEntries,
    setEntryFields,
    startEntries,
    setHostStatus,
    setSubtask,
    subtaskLines
} from '../../src/lib/server/entry-edit/index.ts';
import { engineDir, loadConfig, loadLocal } from '../../src/lib/data/sources/config.ts';
import { portfolioConfigFrom } from '../../src/lib/data/index.ts';
import { fieldNames } from '../../src/lib/data/validate.ts';

const ENTRIES = [
    'title: Things',
    'schema:',
    '  - { field: title, type: text }',
    '  - { field: status, type: select }',
    '  - { field: tags, type: tags }',
    'entries:',
    '  - title: "First thing"',
    '    status: active',
    '    tags: [alpha, beta]',
    '    note: plain      # a trailing comment',
    '    subtasks:',
    '      - { do: write it, deadline: 2026-09-20 }',
    '      - { do: check it, done: true }',
    '',
    '  - title: Second',
    '    status: planned',
    '',
    'footer: "after the list"',
    ''
].join('\n');

describe('entry metalists', () => {
    it('renders a new entry with a metalist as block flow maps', () => {
        expect(
            renderEntry(['title', 'meta'], 'title', {
                title: 'A scheme',
                meta: [{ label: 'Host', value: 'UT' }]
            })
        ).toBe('  - title: A scheme\n    meta:\n      - { label: Host, value: "UT" }');
    });

    it('replaces a metalist inside one entry and leaves the surrounding bytes alone', () => {
        const source = [
            'entries:',
            '  - title: First',
            '    meta:',
            '      - { label: Host, value: Old }',
            '    note: kept',
            '',
            'footer: after',
            ''
        ].join('\n');
        const out = setEntryFields(source, 'title', 'First', {
            meta: [{ label: 'Host', value: 'UT' }]
        });
        expect(out.refused).toEqual([]);
        expect(out.text).toBe(
            [
                'entries:',
                '  - title: First',
                '    meta:',
                '      - { label: Host, value: "UT" }',
                '    note: kept',
                '',
                'footer: after',
                ''
            ].join('\n')
        );
    });

    it('clears an existing metalist with an empty list', () => {
        const source = [
            'entries:',
            '  - title: First',
            '    meta:',
            '      - { label: Host, value: Old }',
            '    note: kept',
            ''
        ].join('\n');
        const out = setEntryFields(source, 'title', 'First', { meta: [] });
        expect(out.refused).toEqual([]);
        expect(out.text).toBe('entries:\n  - title: First\n    note: kept\n');
    });
});

describe('entry raw maps', () => {
    it('renders a new entry with a map of scalars as a block map', () => {
        expect(
            renderEntry(['key', 'retrieval'], 'key', {
                key: 'mimic-iv',
                retrieval: { method: 'wget', verified: true, token: null }
            })
        ).toBe(
            '  - key: mimic-iv\n    retrieval:\n      method: wget\n      verified: true\n      token: null'
        );
    });

    it('replaces one entry field with the complete block map', () => {
        const source = [
            'datasets:',
            '  - key: mimic-iv',
            '    retrieval:',
            '      method: curl',
            '      notes: old',
            '    access: credentialed',
            '',
            'footer: kept',
            ''
        ].join('\n');
        const out = setEntryFields(source, 'key', 'mimic-iv', {
            retrieval: { method: 'wget', verified: false }
        });
        expect(out.refused).toEqual([]);
        expect(out.text).toBe(
            [
                'datasets:',
                '  - key: mimic-iv',
                '    retrieval:',
                '      method: wget',
                '      verified: false',
                '    access: credentialed',
                '',
                'footer: kept',
                ''
            ].join('\n')
        );
    });

    it('renders a new entry whose block holds a list and a nested map', () => {
        const retrieval = {
            method: 'curl',
            priority_first: ['portal', 'mirror'],
            auth: { kind: 'token', env: 'TOKEN' }
        };
        const block = renderEntry(['key', 'retrieval'], 'key', { key: 'mimic-iv', retrieval });
        expect(block.split('\n')).toEqual([
            '  - key: mimic-iv',
            '    retrieval:',
            '      method: curl',
            '      priority_first:',
            '      - portal',
            '      - mirror',
            '      auth:',
            '        kind: token',
            '        env: TOKEN'
        ]);
        expect(parse(`entries:\n${block}\n`)).toEqual({
            entries: [{ key: 'mimic-iv', retrieval }]
        });
    });

    it('writes a block with a list, a nested map and a list of maps into a file that reads back equal', () => {
        const source = [
            'datasets:',
            '  - key: mimic-iv',
            '    retrieval:',
            '      method: curl',
            '    access: credentialed',
            '',
            'footer: kept',
            ''
        ].join('\n');
        const retrieval = {
            method: 'curl',
            priority_first: ['portal', 'mirror'],
            files: [{ name: 'a.zip' }, { name: 'b.zip' }],
            auth: { kind: 'token', env: 'TOKEN' }
        };
        const out = setEntryFields(source, 'key', 'mimic-iv', { retrieval });
        expect(out.refused).toEqual([]);
        expect(out.changed).toEqual(['retrieval']);

        const dir = mkdtempSync(join(tmpdir(), 'oculus-entry-edit-'));
        expect(resolve(dir).startsWith(resolve(tmpdir()) + sep)).toBe(true);
        const file = join(dir, 'data.yml');
        writeFileSync(file, out.text, 'utf8');
        expect(parse(readFileSync(file, 'utf8'))).toEqual({
            datasets: [{ key: 'mimic-iv', retrieval, access: 'credentialed' }],
            footer: 'kept'
        });
    });

    it('writes a block under a key the entry has not got, and reads it back equal', () => {
        const source = ['datasets:', '  - key: mimic-iv', '    access: open', ''].join('\n');
        const retrieval = { steps: ['fetch', 'unzip'], auth: { env: 'TOKEN' } };
        const out = setEntryFields(source, 'key', 'mimic-iv', { retrieval });
        expect(out.refused).toEqual([]);
        expect(parse(out.text)).toEqual({
            datasets: [{ key: 'mimic-iv', access: 'open', retrieval }]
        });
    });
});

const KEYED = [
    'schema:',
    '  - { field: key, type: text }',
    '  - { field: title, type: text }',
    'entries:',
    '  - key: amir',
    '    title: "Maryam Amir Haeri"',
    '    status: active',
    ''
].join('\n');

const MANIFEST = [
    'id: alpha',
    'title: "A title"',
    'subtasks:',
    '- { do: one }',
    '- { do: two, done: true }',
    ''
].join('\n');

const KEYMAP = [
    'id: beta',
    'title: "Another"',
    'subtasks:',
    '  first: { do: one }',
    '  second: { do: two, snooze: 2026-10-01 }',
    ''
].join('\n');

const HOSTS = [
    'title: Career',
    'hosts:',
    '  - { name: "Naesens", inst: "KU Leuven", status: "warm" }',
    '  - { name: "Vens", inst: "Kulak" }',
    ''
].join('\n');

/** The lines of the source the result does not hold in the same place. */
function moved(source: string, result: string): string[] {
    const a = source.split('\n');
    const b = result.split('\n');
    const out: string[] = [];
    let at = 0;
    let to = 0;
    while (at < a.length && to < b.length && a[at] === b[to]) {
        at += 1;
        to += 1;
    }
    let end = 0;
    while (
        end < a.length - at &&
        end < b.length - to &&
        a[a.length - 1 - end] === b[b.length - 1 - end]
    ) {
        end += 1;
    }
    out.push(...b.slice(to, b.length - end));
    return out;
}

/** The parsed source with one mutation applied, which the parsed result must equal. */
function applied(source: string, change: (data: Record<string, unknown>) => void): unknown {
    const data = parse(source) as Record<string, unknown>;
    change(data);
    return data;
}

/** The first entry of the ENTRIES document, as the parsed result holds it. */
function first(text: string): Record<string, unknown> {
    return (parse(text) as { entries: Record<string, unknown>[] }).entries[0];
}

describe('finding an entry', () => {
    it('gives the lines from its opening line to its last field', () => {
        expect(entryRange(ENTRIES, 'title', 'First thing')).toEqual({ start: 6, end: 13 });
        expect(entryRange(ENTRIES, 'title', 'Second')).toEqual({ start: 14, end: 16 });
        expect(entryRange(KEYED, 'key', 'amir')).toEqual({ start: 4, end: 7 });
    });

    it('gives null for a value no entry holds and for a field no entry has', () => {
        expect(entryRange(ENTRIES, 'title', 'Third')).toBe(null);
        expect(entryRange(ENTRIES, 'key', 'First thing')).toBe(null);
    });
});

describe('setting a field of an entry', () => {
    it('writes a plain value in place and keeps the comment on its line', () => {
        const out = setEntryFields(ENTRIES, 'title', 'First thing', { note: 'changed' });
        expect(out.changed).toEqual(['note']);
        expect(moved(ENTRIES, out.text)).toEqual(['    note: changed      # a trailing comment']);
        expect(parse(out.text)).toEqual(
            applied(ENTRIES, (data) => {
                (data.entries as Record<string, unknown>[])[0].note = 'changed';
            })
        );
    });

    it('keeps the quoting the entry had', () => {
        const out = setEntryFields(ENTRIES, 'title', 'First thing', { title: 'Renamed' });
        expect(out.changed).toEqual(['title']);
        expect(moved(ENTRIES, out.text)).toEqual(['  - title: "Renamed"']);
        expect(first(out.text).title).toBe('Renamed');
    });

    it('keeps a flow list flow', () => {
        const out = setEntryFields(ENTRIES, 'title', 'First thing', { tags: ['one', 'two'] });
        expect(moved(ENTRIES, out.text)).toEqual(['    tags: [one, two]']);
        expect(first(out.text).tags).toEqual(['one', 'two']);
    });

    it('appends a field the entry has not got, at the entry field indent', () => {
        const out = setEntryFields(ENTRIES, 'title', 'Second', { deadline: '2026-09-20' });
        expect(out.changed).toEqual(['deadline']);
        expect(moved(ENTRIES, out.text)).toEqual(['    deadline: 2026-09-20']);
        expect(parse(out.text)).toEqual(
            applied(ENTRIES, (data) => {
                (data.entries as Record<string, unknown>[])[1].deadline = '2026-09-20';
            })
        );
    });

    it('removes the line of a field set to null', () => {
        const out = setEntryFields(ENTRIES, 'title', 'First thing', { status: null });
        expect(out.changed).toEqual(['status']);
        expect(moved(ENTRIES, out.text)).toEqual([]);
        expect(out.text.split('\n').length).toBe(ENTRIES.split('\n').length - 1);
        expect(parse(out.text)).toEqual(
            applied(ENTRIES, (data) => {
                delete (data.entries as Record<string, unknown>[])[0].status;
            })
        );
    });

    it('writes nothing for a value the entry already holds', () => {
        const out = setEntryFields(ENTRIES, 'title', 'First thing', {
            status: 'active',
            tags: ['alpha', 'beta']
        });
        expect(out.changed).toEqual([]);
        expect(out.refused).toEqual([]);
        expect(out.text).toBe(ENTRIES);
    });

    it('refuses an entry that is not there and a cleared identity field', () => {
        const gone = setEntryFields(ENTRIES, 'title', 'Third', { status: 'active' });
        expect(gone.text).toBe(ENTRIES);
        expect(gone.refused).toEqual([{ field: 'status', reason: 'the entry is not in the file' }]);
        const cleared = setEntryFields(ENTRIES, 'title', 'Second', { title: null });
        expect(cleared.text).toBe(ENTRIES);
        expect(cleared.refused).toEqual([
            { field: 'title', reason: 'the identity field is what the entry is found by' }
        ]);
    });

    it('refuses a field whose value is a block of its own', () => {
        const out = setEntryFields(ENTRIES, 'title', 'First thing', { subtasks: 'gone' });
        expect(out.text).toBe(ENTRIES);
        expect(out.refused).toEqual([
            { field: 'subtasks', reason: 'the field is a block of its own' }
        ]);
    });
});

describe('appending an entry', () => {
    it('inserts the block at the end of the list, before the next top-level key', () => {
        const block = renderEntry(['title', 'status'], 'title', {
            title: 'Third thing',
            status: 'planned'
        });
        expect(block).toBe('  - title: Third thing\n    status: planned');
        const out = appendEntry(ENTRIES, 'entries', block);
        expect(out.changed).toEqual(['entries']);
        expect(out.text).toBe(
            ENTRIES.replace('\nfooter:', '\n  - title: Third thing\n    status: planned\n\nfooter:')
        );
        expect(parse(out.text)).toEqual(
            applied(ENTRIES, (data) => {
                (data.entries as Record<string, unknown>[]).push({
                    title: 'Third thing',
                    status: 'planned'
                });
            })
        );
    });

    it('refuses a key the file has not got', () => {
        const out = appendEntry(ENTRIES, 'records', '  - title: x');
        expect(out.text).toBe(ENTRIES);
        expect(out.refused).toEqual([{ field: 'records', reason: 'the file has no records key' }]);
    });
});

describe('putting the entries in another order', () => {
    it('moves whole blocks, keeping every byte inside them', () => {
        const out = reorderEntries(ENTRIES, 'title', ['Second', 'First thing']);
        expect(out.changed).toEqual(['entries']);
        expect(out.refused).toEqual([]);
        expect(out.text).toContain('  - title: Second\n    status: planned\n');
        expect(out.text).toContain('    note: plain      # a trailing comment');
        expect(out.text).toContain('      - { do: write it, deadline: 2026-09-20 }');
        const before = parse(ENTRIES) as { entries: unknown[] };
        const after = parse(out.text) as { entries: unknown[] };
        expect(after.entries).toEqual([before.entries[1], before.entries[0]]);
        expect(out.text.endsWith('footer: "after the list"\n')).toBe(true);
    });

    it('leaves the file alone when the order is the one it already has', () => {
        const out = reorderEntries(ENTRIES, 'title', ['First thing', 'Second']);
        expect(out).toEqual({ text: ENTRIES, changed: [], refused: [] });
    });

    it('refuses an order that does not name every entry exactly once', () => {
        for (const order of [['Second'], ['Second', 'Second'], ['Second', 'Nobody']]) {
            const out = reorderEntries(ENTRIES, 'title', order);
            expect(out.text).toBe(ENTRIES);
            expect(out.changed).toEqual([]);
            expect(out.refused).toEqual([
                { field: 'entries', reason: 'the order does not name every entry exactly once' }
            ]);
        }
    });

    it('reorders a file whose entries are addressed by a key', () => {
        const two = KEYED.replace(
            '  - key: amir\n',
            '  - key: vens\n    title: "Celine Vens"\n  - key: amir\n'
        );
        const out = reorderEntries(two, 'key', ['amir', 'vens']);
        expect(out.changed).toEqual(['entries']);
        expect(
            (parse(out.text) as { entries: { key: string }[] }).entries.map((e) => e.key)
        ).toEqual(['amir', 'vens']);
    });
});

describe('deleting an entry', () => {
    it("takes the entry's own lines out and leaves the rest of the file", () => {
        const out = deleteEntry(ENTRIES, 'title', 'First thing');
        expect(out.changed).toEqual(['entries']);
        expect(out.text).not.toContain('First thing');
        expect(out.text).not.toContain('do: write it');
        expect(parse(out.text)).toEqual(
            applied(ENTRIES, (data) => {
                (data.entries as unknown[]).splice(0, 1);
            })
        );
        expect(out.text.endsWith('footer: "after the list"\n')).toBe(true);
    });

    it('takes the last entry out as well, and refuses an entry the file does not hold', () => {
        const out = deleteEntry(ENTRIES, 'title', 'Second');
        expect(out.changed).toEqual(['entries']);
        expect(parse(out.text)).toEqual(
            applied(ENTRIES, (data) => {
                (data.entries as unknown[]).splice(1, 1);
            })
        );
        const gone = deleteEntry(ENTRIES, 'title', 'Nobody');
        expect(gone.text).toBe(ENTRIES);
        expect(gone.refused).toEqual([
            { field: 'entries', reason: 'the entry is not in the file' }
        ]);
    });
});

describe('reading a subtasks block', () => {
    it('keys an entry list by position and a manifest map by its own keys', () => {
        const range = entryRange(ENTRIES, 'title', 'First thing');
        expect(subtaskLines(ENTRIES, range)).toEqual({
            key: 10,
            indent: 6,
            map: false,
            items: [
                { key: '0', line: 11 },
                { key: '1', line: 12 }
            ]
        });
        expect(subtaskLines(MANIFEST, null)).toEqual({
            key: 2,
            indent: 0,
            map: false,
            items: [
                { key: '0', line: 3 },
                { key: '1', line: 4 }
            ]
        });
        expect(subtaskLines(KEYMAP, null)).toEqual({
            key: 2,
            indent: 2,
            map: true,
            items: [
                { key: 'first', line: 3 },
                { key: 'second', line: 4 }
            ]
        });
    });

    it('gives an empty block for a host with none, and null for an entry that is not there', () => {
        expect(subtaskLines(ENTRIES, entryRange(ENTRIES, 'title', 'Second'))).toEqual({
            key: null,
            indent: 6,
            map: false,
            items: []
        });
        expect(subtaskLines(ENTRIES, { start: 99, end: 100 })).toBe(null);
    });
});

describe('one subtask line', () => {
    const range = entryRange(ENTRIES, 'title', 'First thing');

    it('is ticked done and reopened again', () => {
        const done = setSubtask(ENTRIES, range, '0', { done: true });
        expect(done.changed).toEqual(['done']);
        expect(moved(ENTRIES, done.text)).toEqual([
            '      - { do: write it, deadline: 2026-09-20, done: true }'
        ]);
        const open = setSubtask(done.text, range, '0', { done: false });
        expect(open.changed).toEqual(['done']);
        expect(open.text).toBe(ENTRIES);
    });

    it('is snoozed and cleared', () => {
        const snoozed = setSubtask(ENTRIES, range, '1', { snooze: '2026-10-01' });
        expect(moved(ENTRIES, snoozed.text)).toEqual([
            '      - { do: check it, done: true, snooze: 2026-10-01 }'
        ]);
        expect(parse(snoozed.text)).toEqual(
            applied(ENTRIES, (data) => {
                const held = (data.entries as Record<string, unknown>[])[0].subtasks as Record<
                    string,
                    unknown
                >[];
                held[1].snooze = '2026-10-01';
            })
        );
        const cleared = setSubtask(snoozed.text, range, '1', { snooze: '' });
        expect(cleared.text).toBe(ENTRIES);
    });

    it('is addressed by its own key when the block is a map', () => {
        const out = setSubtask(KEYMAP, null, 'second', { done: true, snooze: null });
        expect(moved(KEYMAP, out.text)).toEqual(['  second: { do: two, done: true }']);
        expect(parse(out.text)).toEqual(
            applied(KEYMAP, (data) => {
                (data.subtasks as Record<string, Record<string, unknown>>).second = {
                    do: 'two',
                    done: true
                };
            })
        );
    });

    it('is deleted, and takes the subtasks key with it when it was the last one', () => {
        const one = deleteSubtask(ENTRIES, range, '0');
        expect(one.changed).toEqual(['subtasks']);
        expect(parse(one.text)).toEqual(
            applied(ENTRIES, (data) => {
                const held = (data.entries as Record<string, unknown>[])[0].subtasks as unknown[];
                held.splice(0, 1);
            })
        );
        const last = deleteSubtask(one.text, range, '0');
        expect(last.text.includes('subtasks:')).toBe(false);
        expect(parse(last.text)).toEqual(
            applied(ENTRIES, (data) => {
                delete (data.entries as Record<string, unknown>[])[0].subtasks;
            })
        );
    });

    it('refuses a line that is not there and a cleared do', () => {
        const gone = setSubtask(ENTRIES, range, '4', { done: true });
        expect(gone.text).toBe(ENTRIES);
        expect(gone.refused).toEqual([{ field: 'done', reason: 'there is no subtask 4' }]);
        const label = setSubtask(ENTRIES, range, '0', { do: '' });
        expect(label.text).toBe(ENTRIES);
        expect(label.refused).toEqual([
            { field: 'do', reason: 'a subtask with no do line is not a subtask' }
        ]);
    });
});

describe('adding a subtask', () => {
    it('appends a line to the block an entry already has', () => {
        const range = entryRange(ENTRIES, 'title', 'First thing');
        const out = addSubtask(ENTRIES, range, { do: 'a third, with a comma' });
        expect(moved(ENTRIES, out.text)).toEqual(['      - { do: "a third, with a comma" }']);
        expect(parse(out.text)).toEqual(
            applied(ENTRIES, (data) => {
                const held = (data.entries as Record<string, unknown>[])[0].subtasks as unknown[];
                held.push({ do: 'a third, with a comma' });
            })
        );
    });

    it('makes the block when the entry has none, at the entry field indent', () => {
        const range = entryRange(ENTRIES, 'title', 'Second');
        const out = addSubtask(ENTRIES, range, { do: 'first one', deadline: '2026-09-20' });
        expect(moved(ENTRIES, out.text)).toEqual([
            '    subtasks:',
            '      - { do: first one, deadline: 2026-09-20 }'
        ]);
        expect(parse(out.text)).toEqual(
            applied(ENTRIES, (data) => {
                (data.entries as Record<string, unknown>[])[1].subtasks = [
                    { do: 'first one', deadline: '2026-09-20' }
                ];
            })
        );
    });

    it('makes the block when a manifest has none, at the top level', () => {
        const bare = 'id: alpha\ntitle: "A title"\n';
        const out = addSubtask(bare, null, { do: 'first one' });
        expect(out.text).toBe('id: alpha\ntitle: "A title"\nsubtasks:\n  - { do: first one }\n');
    });

    it('refuses a map block and a line with no do', () => {
        const map = addSubtask(KEYMAP, null, { do: 'a third' });
        expect(map.text).toBe(KEYMAP);
        expect(map.refused).toEqual([
            { field: 'subtasks', reason: 'the block is a map of keys; add the line in the file' }
        ]);
        const bare = addSubtask(MANIFEST, null, { do: '  ' });
        expect(bare.text).toBe(MANIFEST);
        expect(bare.refused).toEqual([{ field: 'do', reason: 'a subtask needs a do line' }]);
    });
});

describe('a host of the career file', () => {
    it('sets the status in place and keeps the quoting', () => {
        const out = setHostStatus(HOSTS, 'Naesens', 'candidate');
        expect(out.changed).toEqual(['status']);
        expect(moved(HOSTS, out.text)).toEqual([
            '  - { name: "Naesens", inst: "KU Leuven", status: "candidate" }'
        ]);
        expect(parse(out.text)).toEqual(
            applied(HOSTS, (data) => {
                (data.hosts as Record<string, unknown>[])[0].status = 'candidate';
            })
        );
    });

    it('adds the status to a host line that has none', () => {
        const out = setHostStatus(HOSTS, 'Vens', 'dropped');
        expect(moved(HOSTS, out.text)).toEqual([
            '  - { name: "Vens", inst: "Kulak", status: dropped }'
        ]);
    });

    it('writes nothing when the host already has that status', () => {
        const out = setHostStatus(HOSTS, 'Naesens', 'warm');
        expect(out.text).toBe(HOSTS);
        expect(out.changed).toEqual([]);
    });

    it('refuses a host the file has not got', () => {
        const out = setHostStatus(HOSTS, 'Nobody', 'warm');
        expect(out.text).toBe(HOSTS);
        expect(out.refused).toEqual([{ field: 'status', reason: 'no host named Nobody' }]);
    });
});

const engine = engineDir();
const hub = loadLocal(engine).hub;
const present = existsSync(hub);
if (!present) {
    console.warn(`entry-edit: skipped the real hub, ${hub} does not exist on this machine`);
}

/** Every collection file of the hub that is on this machine, with its text and its entries. */
function collectionFiles(): { file: string; source: string; ident: string; items: unknown[] }[] {
    const config = portfolioConfigFrom(loadConfig(engine).config, engine);
    const out = [];
    for (const one of config.collections) {
        const file = join(hub, one.file);
        if (!existsSync(file)) continue;
        const source = readFileSync(file, 'utf8');
        const data = parse(source) as Record<string, unknown>;
        const names = fieldNames(data.schema);
        out.push({
            file,
            source,
            ident: names.length > 0 ? names[0] : 'title',
            items: Array.isArray(data.entries) ? data.entries : []
        });
    }
    return out;
}

describe.skipIf(!present)('every collection entry of the real hub, read only', () => {
    const files = collectionFiles();

    it('reads the collection files at all', () => {
        const total = files.reduce((count, one) => count + one.items.length, 0);
        console.log(`entry-edit: ${files.length} collection files, ${total} entries, from ${hub}`);
        expect(files.length).toBeGreaterThan(5);
        expect(total).toBeGreaterThan(100);
    });

    it('finds every entry by its identity field and writes nothing giving it back', () => {
        const wrong: string[] = [];
        for (const one of files) {
            for (const item of one.items) {
                const held = (item as Record<string, unknown>)[one.ident];
                if (typeof held !== 'string' && typeof held !== 'number') {
                    wrong.push(`${one.file}: an entry has no ${one.ident}`);
                    continue;
                }
                const value = String(held);
                if (entryRange(one.source, one.ident, value) === null) {
                    wrong.push(`${one.file}: ${value} has no line range`);
                    continue;
                }
                const out = setEntryFields(one.source, one.ident, value, { [one.ident]: held });
                if (out.text !== one.source || out.changed.length > 0 || out.refused.length > 0) {
                    wrong.push(`${one.file}: ${value} ${JSON.stringify(out.refused)}`);
                }
            }
        }
        expect(wrong).toEqual([]);
    });

    it('reads every id as the identity field, except where the entry carries its own id or key', () => {
        const apart: string[] = [];
        for (const one of files) {
            for (const item of one.items) {
                const held = item as Record<string, unknown>;
                const id =
                    typeof held.id === 'string' && held.id !== ''
                        ? held.id
                        : typeof held.key === 'string' && held.key !== ''
                          ? held.key
                          : held.title;
                if (id === held[one.ident]) continue;
                apart.push(
                    `${one.file}: id ${String(id)} vs ${one.ident} ${String(held[one.ident])}`
                );
                // Registry collections keep an explicit `id` or `key`, while the identity field is
                // the schema's first. Every write resolves the entity id to that field.
                expect(typeof held.id === 'string' || typeof held.key === 'string').toBe(true);
            }
        }
        if (apart.length > 0)
            console.log(`entry-edit: id apart from the identity field:\n${apart.join('\n')}`);
    });
});

describe('renderFlowMap', () => {
    it('writes a scalar as it reads, quoting one that would end the value', () => {
        expect(renderFlowMap({ status: 'open', done: true, at: 3 })).toBe(
            '{ status: open, done: true, at: 3 }'
        );
        expect(parse(renderFlowMap({ note: 'one, two' }))).toEqual({ note: 'one, two' });
        expect(renderFlowMap({})).toBe('{}');
    });

    it('writes a list and a map as flow that parses back to the value it was given', () => {
        const list = renderFlowMap({ tags: ['a', 'b, c'] });
        expect(parse(list)).toEqual({ tags: ['a', 'b, c'] });
        const map = renderFlowMap({ where: { host: 'utwente', note: 'a, b' } });
        expect(parse(map)).toEqual({ where: { host: 'utwente', note: 'a, b' } });
    });
});

// The list key a collection file gets its first time. YAML writes no empty block list, so a file
// with no entries yet carries no list key at all and this is what adds one.
describe('the first entry of a file that has none', () => {
    const HEAD = ['title: Bookmarks', '', 'schema:', '  - { field: label, type: text }', ''].join(
        '\n'
    );

    const BLOCK = '  - label: the manual\n    root: hub\n    path: docs/manual.md';

    it('writes the key with the one entry under it, and leaves every other key as it was', () => {
        const out = startEntries(HEAD, 'entries', BLOCK);

        expect(out.changed).toEqual(['entries']);
        expect(out.refused).toEqual([]);
        expect(parse(out.text)).toEqual({
            title: 'Bookmarks',
            schema: [{ field: 'label', type: 'text' }],
            entries: [{ label: 'the manual', root: 'hub', path: 'docs/manual.md' }]
        });
        // The text above the key is the text that was there, byte for byte.
        expect(out.text.startsWith(HEAD.replace(/\n*$/, '\n'))).toBe(true);
    });

    it("refuses a file whose list holds an entry, which is appendEntry's to grow", () => {
        const held = `${HEAD}\nentries:\n  - label: one\n`;
        const out = startEntries(held, 'entries', BLOCK);

        expect(out.changed).toEqual([]);
        expect(out.refused).toEqual([
            { field: 'entries', reason: 'the file already has a entries key' }
        ]);
        expect(out.text).toBe(held);
    });

    it('writes under the key a file already carries when nothing is under it', () => {
        // What deleting the last entry leaves: the key is there and its list is gone.
        const emptied = `${HEAD}\nentries:\n`;
        const out = startEntries(emptied, 'entries', BLOCK);

        expect(out.changed).toEqual(['entries']);
        expect(parse(out.text)).toEqual({
            title: 'Bookmarks',
            schema: [{ field: 'label', type: 'text' }],
            entries: [{ label: 'the manual', root: 'hub', path: 'docs/manual.md' }]
        });
        // The key keeps its place; nothing is appended below what follows it.
        expect(out.text.indexOf('entries:')).toBe(emptied.indexOf('entries:'));
    });

    it('writes under an emptied key that is not the last one in the file', () => {
        const emptied = `entries:\n\n${HEAD}`;
        const out = startEntries(emptied, 'entries', BLOCK);

        expect(out.changed).toEqual(['entries']);
        expect(parse(out.text)).toEqual({
            entries: [{ label: 'the manual', root: 'hub', path: 'docs/manual.md' }],
            title: 'Bookmarks',
            schema: [{ field: 'label', type: 'text' }]
        });
    });

    it('refuses a file that does not parse, and writes nothing', () => {
        const broken = 'title: [unclosed\n';
        const out = startEntries(broken, 'entries', BLOCK);

        expect(out.changed).toEqual([]);
        expect(out.refused).toEqual([{ field: 'entries', reason: 'the file does not parse' }]);
        expect(out.text).toBe(broken);
    });

    it('refuses a block that is not one entry, rather than writing a file it cannot verify', () => {
        const two = `${BLOCK}\n  - label: another\n    root: hub\n    path: b.md`;

        expect(startEntries(HEAD, 'entries', two).changed).toEqual([]);
        expect(startEntries(HEAD, 'entries', two).refused[0].reason).toContain('did not verify');
    });
});
