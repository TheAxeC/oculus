// Layer 4, test. The file browser's pure names, addresses, file kinds, versions and tree rows.

import { describe, expect, it } from 'vitest';
import {
    childPath,
    expandedOf,
    extensionOf,
    languages,
    nameOf,
    toggleExpanded,
    treeKey,
    treeRows,
    typeOfFile,
    TEXT_LIMIT,
    type FsEntry,
    type FsRoot
} from '../../../src/lib/state/sources/fs.ts';
import { fileBytesUrl, listingUrl } from '../../../src/lib/state/sources/fs.svelte.ts';
import { engineDir, loadConfig, textCatalog } from '../../../src/lib/data/sources/config.ts';
import { registered } from '../../../src/lib/state/shared/words/languages.ts';
import { setCatalog } from '../../../src/lib/state/shared/words/text.ts';
import { createClientState } from '../../fixtures/client.ts';
import {
    bookmarkAt,
    bookmarkById,
    bookmarkTitles,
    currentWorkspace,
    fileEntries,
    fixedRootKeys,
    matchedNothing,
    openFailures,
    rootKeysOf,
    workspaceNames
} from '../../../src/lib/state/sources/fs-transport.ts';
import type { Entry } from '../../../src/lib/data/model/index.ts';

setCatalog(textCatalog(loadConfig(engineDir()).config));

/** One file entry, since only the name and the kind matter to these cases. */
function file(name: string, size = 10): FsEntry {
    return { name, kind: 'file', size, mtime: 1 };
}

function dir(name: string): FsEntry {
    return { name, kind: 'dir', size: 0, mtime: 1 };
}

function root(key: string, fixed = true): FsRoot {
    return { key, dir: `/tmp/${key}`, fixed };
}

/** The bytes of a file holding this text, which is what typeOfFile is told a file's kind from. */
function bytes(text: string): Uint8Array {
    return new TextEncoder().encode(text);
}

describe('what a file opens as', () => {
    it('sends an HTML file to the document view and a PDF and an image to their own', () => {
        expect(typeOfFile('manual.html').kind).toBe('html');
        expect(typeOfFile('read me.HTM').kind).toBe('html');
        expect(typeOfFile('paper.pdf').kind).toBe('pdf');
        for (const name of ['a.png', 'a.jpg', 'a.jpeg', 'a.gif', 'a.svg', 'a.webp']) {
            expect(typeOfFile(name).kind).toBe('image');
        }
    });

    it('names the language of a code file and plain text for the rest of the text ones', () => {
        const held = bytes('one\n');
        expect(typeOfFile('run.ts', held)).toEqual({ kind: 'text', language: 'typescript' });
        expect(typeOfFile('run.py', held)).toEqual({ kind: 'text', language: 'python' });
        expect(typeOfFile('config/sources.yml', held)).toEqual({ kind: 'text', language: 'yaml' });
        expect(typeOfFile('main.tex', held)).toEqual({ kind: 'text', language: 'latex' });
        expect(typeOfFile('job.slurm', held)).toEqual({ kind: 'text', language: 'bash' });
        expect(typeOfFile('View.svelte', held)).toEqual({ kind: 'text', language: 'xml' });
        expect(typeOfFile('notes.txt', held)).toEqual({ kind: 'text', language: 'plaintext' });
    });

    it('reads a language off a whole name for a file that carries no extension', () => {
        const held = bytes('all:\n');
        expect(typeOfFile('Makefile', held)).toEqual({ kind: 'text', language: 'makefile' });
        expect(typeOfFile('code/makefile', held)).toEqual({ kind: 'text', language: 'makefile' });
    });

    it('reads the bytes and not the name, so a name says nothing about what is in the file', () => {
        const archive = new Uint8Array([0x50, 0x4b, 0x03, 0x04, 0x00, 0x00, 0x08, 0x00]);
        expect(typeOfFile('data.txt', archive).kind).toBe('other');
        expect(typeOfFile('run.py', archive).kind).toBe('other');
        expect(typeOfFile('build', bytes('#!/bin/sh\n')).kind).toBe('text');
    });

    it('reads a file of accented letters as text and one with a zero byte in it as not', () => {
        expect(typeOfFile('names.csv', bytes('Linkoeping, Twente, Munchen\n')).kind).toBe('text');
        expect(typeOfFile('names.csv', bytes('Link\u00f6ping, M\u00fcnchen\n')).kind).toBe('text');
        const zeroed = bytes('a'.repeat(100) + '\u0000' + 'b'.repeat(100));
        expect(zeroed[100]).toBe(0);
        expect(typeOfFile('notes.txt', zeroed).kind).toBe('other');
    });

    it('reads an empty file as text, and a file whose bytes have not been read as a download', () => {
        expect(typeOfFile('empty.txt', new Uint8Array(0)).kind).toBe('text');
        expect(typeOfFile('archive.tar.gz').kind).toBe('other');
        expect(typeOfFile('data.npz').kind).toBe('other');
    });

    it('names only languages the code window has registered', () => {
        expect(languages().filter((one) => !registered().includes(one))).toEqual([]);
    });

    it('reads an extension and a name off a path', () => {
        expect(extensionOf('a/b/run.PY')).toBe('.py');
        expect(extensionOf('a/b/Makefile')).toBe('');
        expect(extensionOf('.gitignore')).toBe('');
        expect(nameOf('a/b/run.py')).toBe('run.py');
        expect(nameOf('run.py')).toBe('run.py');
        expect(childPath('', 'a')).toBe('a');
        expect(childPath('a/b', 'c')).toBe('a/b/c');
    });

    it('holds the window limit at two megabytes', () => {
        expect(TEXT_LIMIT).toBe(2 * 1024 * 1024);
    });
});

describe('the addresses the store reads', () => {
    it('escapes each segment on its own, so a separator stays a separator', () => {
        expect(fileBytesUrl('game engine', 'docs/a b/read#me.md')).toBe(
            '/api/file/game%20engine/docs/a%20b/read%23me.md'
        );
        expect(fileBytesUrl('hub', 'a/100%25.txt')).toBe('/api/file/hub/a/100%2525.txt');
    });

    it('carries a version above zero on the query, and nothing at version zero', () => {
        expect(fileBytesUrl('hub', 'a/paper.pdf', 0)).toBe('/api/file/hub/a/paper.pdf');
        expect(fileBytesUrl('hub', 'a/paper.pdf', 2)).toBe('/api/file/hub/a/paper.pdf?v=2');
    });

    // revert: src/lib/state/sources/fs-transport.ts:146 => return at;
    it('asks for hidden and ignored files on the query only while their toggle is on', () => {
        expect(listingUrl('hub', 'a', { hidden: false, ignored: false })).toBe(
            '/api/fs?root=hub&path=a'
        );
        expect(listingUrl('hub', 'a', { hidden: true, ignored: false })).toBe(
            '/api/fs?root=hub&path=a&hidden=1'
        );
        expect(listingUrl('hub', 'a', { hidden: false, ignored: true })).toBe(
            '/api/fs?root=hub&path=a&ignored=1'
        );
        expect(listingUrl('hub', 'a', { hidden: true, ignored: true })).toBe(
            '/api/fs?root=hub&path=a&hidden=1&ignored=1'
        );
    });

    it('escapes the root and the path of a listing', () => {
        expect(listingUrl('game engine', 'a b/c#d')).toBe(
            '/api/fs?root=game%20engine&path=a%20b%2Fc%23d'
        );
        expect(listingUrl('hub', '100%')).toBe('/api/fs?root=hub&path=100%25');
    });
});

describe('the version one file is read at', () => {
    it('is zero for a file nothing has written, and moves once per bump', () => {
        const fresh = createClientState();
        const { bump, fileVersion } = fresh.fs;
        expect(fileVersion('hub', 'a/paper.pdf')).toBe(0);
        bump('hub', 'a/paper.pdf');
        expect(fileVersion('hub', 'a/paper.pdf')).toBe(1);
        bump('hub', 'a/paper.pdf');
        expect(fileVersion('hub', 'a/paper.pdf')).toBe(2);
    });

    it('is one file at a time, and the same path under two roots is two files', () => {
        const fresh = createClientState();
        const { bump, fileVersion } = fresh.fs;
        bump('hub', 'a/paper.pdf');
        expect(fileVersion('hub', 'a/other.pdf')).toBe(0);
        expect(fileVersion('notes', 'a/paper.pdf')).toBe(0);
    });

    it('answers zero for an empty root or path rather than counting one', () => {
        const fresh = createClientState();
        fresh.fs.bump('', '');
        expect(fresh.fs.fileVersion('', '')).toBe(0);
    });
});

describe('the open folders an instance remembers', () => {
    it('reads the set out of the instance state, and nothing out of anything else', () => {
        expect(expandedOf({ expanded: ['hub:', 'hub:code', 7] })).toEqual(['hub:', 'hub:code']);
        expect(expandedOf({ expanded: 'hub:' })).toEqual([]);
        expect(expandedOf(null)).toEqual([]);
        expect(expandedOf(['hub:'])).toEqual([]);
    });

    it('opens a closed folder and closes an open one', () => {
        expect(toggleExpanded([], 'hub:')).toEqual(['hub:']);
        expect(toggleExpanded(['hub:', 'hub:code'], 'hub:')).toEqual(['hub:code']);
        expect(treeKey('hub', 'code/run.py')).toBe('hub:code/run.py');
    });
});

describe('the rows of the tree', () => {
    const listings: Record<string, FsEntry[]> = {
        'hub:': [dir('code'), file('README.md')],
        'hub:code': [file('run.py')],
        'notes:': [file('a.md')]
    };
    const entriesOf = (key: string, path: string): FsEntry[] => listings[treeKey(key, path)] ?? [];

    it('draws one line per root and nothing under a root that is closed', () => {
        const rows = treeRows([root('hub'), root('notes', false)], entriesOf, []);
        expect(rows.map((row) => `${row.root}:${row.path}`)).toEqual(['hub:', 'notes:']);
        expect(rows.every((row) => row.kind === 'dir' && row.depth === 0 && !row.open)).toBe(true);
    });

    it('draws the entries of an open root one level in, folders before files', () => {
        const rows = treeRows([root('hub')], entriesOf, ['hub:']);
        expect(rows.map((row) => `${row.depth}:${row.name}`)).toEqual([
            '0:hub',
            '1:code',
            '1:README.md'
        ]);
        expect(rows[1].open).toBe(false);
    });

    it('draws the entries of an open folder one level further in', () => {
        const rows = treeRows([root('hub')], entriesOf, ['hub:', 'hub:code']);
        expect(rows.map((row) => `${row.depth}:${row.path}`)).toEqual([
            '0:',
            '1:code',
            '2:code/run.py',
            '1:README.md'
        ]);
        expect(rows[1].open).toBe(true);
    });

    it('draws a folder that is open but whose listing has not landed as its own line alone', () => {
        const rows = treeRows([root('hub')], () => [], ['hub:']);
        expect(rows).toHaveLength(1);
        expect(rows[0].open).toBe(true);
    });

    it('carries a file its size, and a folder none', () => {
        const rows = treeRows([root('hub')], entriesOf, ['hub:']);
        expect(rows.map((row) => row.size)).toEqual([0, 0, 10]);
    });
});

describe('the file browser lookups over what its store holds', () => {
    const roots = [
        { key: 'hub', dir: '/hub', fixed: true },
        { key: 'code', dir: '/code', fixed: false }
    ];
    const saved = {
        current: 'work',
        workspaces: [
            { name: 'home', roots: [] },
            { name: 'work', roots }
        ],
        dropped: [],
        error: '',
        loading: false
    };

    // revert: src/lib/state/sources/fs-transport.ts:59 => return saved.workspaces[0] ?? { name: '', roots: [] };
    it('find the current workspace, and an empty one for a name the state does not hold', () => {
        expect(currentWorkspace(saved).name).toBe('work');
        expect(currentWorkspace({ ...saved, current: 'gone' })).toEqual({ name: '', roots: [] });
        expect(fixedRootKeys(roots)).toEqual(['hub']);
    });

    // revert: src/lib/state/sources/fs-transport.ts:74 => return entries.find((one) => one.fields.path === path) ?? null;
    it('find a bookmark by its id and by the file it is over', () => {
        const marks = [
            { id: 'm1', title: 'One', fields: { root: 'hub', path: 'a.md' } },
            { id: 'm2', title: 'Two', fields: { root: 'code', path: 'a.md' } }
        ] as unknown as Entry[];
        expect(bookmarkAt(marks, 'code', 'a.md')?.id).toBe('m2');
        expect(bookmarkAt(marks, 'code', 'b.md')).toBeNull();
        expect(bookmarkById(marks, 'm1')?.title).toBe('One');
        expect(bookmarkById(marks, 'm3')).toBeNull();
    });

    // revert: src/lib/state/sources/fs-transport.ts:79 => return entries;
    it('keep the files of a listing and leave its folders out', () => {
        const entries = [
            { name: 'a.md', kind: 'file' as const, size: 1, mtime: 0 },
            { name: 'sub', kind: 'dir' as const, size: 0, mtime: 0 }
        ];
        expect(fileEntries(entries).map((one) => one.name)).toEqual(['a.md']);
    });

    // revert: src/lib/state/sources/fs-transport.ts:91 => .filter(() => true)
    it('name the open folders whose listing failed, and say when a filter matched nothing', () => {
        const row = (path: string, open: boolean, depth: number) =>
            ({ root: 'hub', path, name: path, kind: 'dir', depth, open }) as unknown as Parameters<
                typeof openFailures
            >[0][number];
        const rows = [row('', true, 0), row('a', true, 1), row('b', false, 1)];
        const error = (_root: string, path: string) => (path === '' ? '' : 'gone');
        expect(openFailures(rows, error)).toEqual([{ root: 'hub', path: 'a', error: 'gone' }]);
        expect(matchedNothing([rows[0]])).toBe(true);
        expect(matchedNothing(rows)).toBe(false);
    });

    // revert: src/lib/state/sources/fs-transport.ts:252 => if (saved.error !== '') return null;
    // revert: src/lib/state/sources/fs-transport.ts:253 => return saved.workspaces[0]?.roots.map((one) => one.key) ?? [];
    // revert: src/lib/state/sources/fs-transport.ts:258 => return entries.map((one) => one.id);
    // revert: src/lib/state/sources/fs-transport.ts:244 => return saved.workspaces.map((one) => one.current);
    it('name the workspaces, the current roots once they are read, and the bookmark titles', () => {
        expect(workspaceNames(saved)).toEqual(['home', 'work']);
        expect(rootKeysOf(saved)).toEqual(['hub', 'code']);
        // Until the workspaces are read, or when they could not be, there are no roots to answer.
        expect(rootKeysOf({ ...saved, loading: true })).toBeNull();
        // A read that failed names no roots either.
        expect(rootKeysOf({ ...saved, error: 'unreadable' })).toBeNull();
        const marks = [{ id: 'm1', title: 'One', fields: {} }] as unknown as Entry[];
        expect(bookmarkTitles(marks)).toEqual(['One']);
    });
});
