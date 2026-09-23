// What lib/server/files/fs.ts and its two modules answer: the entries of one directory under a
// root, the workspaces file, the pure fold from a saved file to the roots on screen, the reader's
// own bookmarks file, and the scratch notes.
//
// Every root, every workspaces file, every bookmarks file and every notes folder here is synthetic,
// under the system temporary directory, and every path written is asserted to be inside it first.
// Nothing reads or writes ~/.oculus.
//
// What this does NOT cover: defaultWorkspacesPath(), defaultBookmarksPath() and defaultNotesDir()
// resolving the machine's own home directory, which nothing here may touch, and the route wrapper
// around these calls, which is tests/routes/files/fs.test.ts.

import {
    existsSync,
    mkdirSync,
    readFileSync,
    realpathSync,
    symlinkSync,
    utimesSync,
    writeFileSync
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, sep } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import {
    addedRoots,
    listDir,
    readSaved,
    rootKey,
    rootsOf,
    workspaceRoots,
    writeSaved,
    type Saved
} from '../../../src/lib/server/files/fs.ts';
import { ENGINE_ROOT, engineRoot } from '../../../src/lib/server/files/files.ts';
import {
    ensureBookmarksFile,
    readBookmarks,
    BOOKMARKS
} from '../../../src/lib/server/files/fs/bookmarks.ts';
import {
    deleteNote,
    listNotes,
    noteFile,
    noteText,
    readNote,
    saveNote,
    splitNote
} from '../../../src/lib/server/files/fs/notes.ts';
import {
    createEntry,
    removeEntry,
    writeEntry
} from '../../../src/lib/server/edit/writes/entries.ts';
import { portfolioConfigFrom } from '../../../src/lib/data/index.ts';
import { engineDir, loadConfig } from '../../../src/lib/data/sources/config.ts';
import type { Root } from '../../../src/lib/server/files/files.ts';
import { scratchDir, sweepScratch } from '../../fixtures/scratch.ts';

afterAll(sweepScratch);

/** A directory under the temporary directory, with a file written at each of the paths named. */
function folder(files: Record<string, string> = {}, dirs: string[] = []): string {
    const dir = scratchDir('oculus-fs-');
    expect(resolve(dir).startsWith(resolve(tmpdir()) + sep)).toBe(true);
    for (const name of dirs) {
        const full = join(dir, name);
        expect(resolve(full).startsWith(resolve(dir) + sep)).toBe(true);
        mkdirSync(full, { recursive: true });
    }
    for (const [name, body] of Object.entries(files)) {
        const full = join(dir, name);
        expect(resolve(full).startsWith(resolve(dir) + sep)).toBe(true);
        mkdirSync(join(full, '..'), { recursive: true });
        writeFileSync(full, body);
    }
    // The real path: a root stores what realpath gave, and on this platform the temporary
    // directory is reached through a link.
    return realpathSync(dir);
}

/** The path of a workspaces file inside a fresh temporary directory. */
function savedFile(): string {
    const dir = scratchDir('oculus-workspaces-');
    expect(resolve(dir).startsWith(resolve(tmpdir()) + sep)).toBe(true);
    return join(dir, 'workspaces.json');
}

/** One saved object, since only its workspaces matter to the fold. */
function saved(current: string, workspaces: { name: string; roots: Root[] }[] = []): Saved {
    return { current, workspaces, dropped: [] };
}

function entriesOf(list: Root[], key: string, path: string): string[] {
    const found = listDir(list, key, path);
    return 'entries' in found ? found.entries.map((entry) => entry.name) : [`error:${found.error}`];
}

describe('one directory under a root', () => {
    it('answers the entries of the folder, folders first and then files by name', () => {
        const dir = folder({ 'b.txt': 'b\n', 'a.txt': 'a\n', 'sub/c.txt': 'c\n' }, ['zed']);
        const list: Root[] = [{ key: 'one', dir }];

        expect(entriesOf(list, 'one', '')).toEqual(['sub', 'zed', 'a.txt', 'b.txt']);
        expect(entriesOf(list, 'one', 'sub')).toEqual(['c.txt']);
    });

    it('carries each entry its kind, its size and its modification time', () => {
        const dir = folder({ 'a.txt': 'four\n' }, ['sub']);
        const found = listDir([{ key: 'one', dir }], 'one', '');

        expect('entries' in found).toBe(true);
        const entries = 'entries' in found ? found.entries : [];
        expect(entries.map((entry) => entry.kind)).toEqual(['dir', 'file']);
        expect(entries[1].size).toBe(5);
        expect(entries[1].mtime).toBeGreaterThan(0);
    });

    it('leaves out dotfiles and the three build folders', () => {
        const dir = folder({ '.env': 'x\n', 'keep.txt': 'k\n' }, [
            '.git',
            'node_modules',
            '__pycache__',
            'src'
        ]);

        expect(entriesOf([{ key: 'one', dir }], 'one', '')).toEqual(['src', 'keep.txt']);
    });

    // revert: src/lib/server/files/fs.ts:325 => .filter((entry) => !skipped(entry.name))
    it('lists dotfiles and the three build folders when hidden files are asked for', () => {
        const dir = folder({ '.env': 'x\n', 'keep.txt': 'k\n' }, [
            '.git',
            'node_modules',
            '__pycache__',
            'src'
        ]);
        const found = listDir([{ key: 'one', dir }], 'one', '', true);
        const names = 'entries' in found ? found.entries.map((entry) => entry.name) : [];

        expect(names).toEqual(['__pycache__', '.git', 'node_modules', 'src', '.env', 'keep.txt']);
    });

    it('lists a link inside the root as the kind its target is', () => {
        const dir = folder({ 'a.txt': 'four\n' }, ['sub']);
        symlinkSync(join(dir, 'a.txt'), join(dir, 'to-file'));
        symlinkSync(join(dir, 'sub'), join(dir, 'to-folder'));
        const found = listDir([{ key: 'one', dir }], 'one', '');
        const entries = 'entries' in found ? found.entries : [];

        expect(entries.map((entry) => `${entry.kind}:${entry.name}`)).toEqual([
            'dir:sub',
            'dir:to-folder',
            'file:a.txt',
            'file:to-file'
        ]);
        expect(entries.find((entry) => entry.name === 'to-file')?.size).toBe(5);
    });

    it('leaves out a link pointing out of the root, and one pointing at nothing', () => {
        const outside = folder({ 'secret.txt': 's\n' });
        const dir = folder({ 'a.txt': 'a\n' });
        symlinkSync(join(outside, 'secret.txt'), join(dir, 'away'));
        symlinkSync(join(dir, 'nowhere.txt'), join(dir, 'broken'));

        expect(entriesOf([{ key: 'one', dir }], 'one', '')).toEqual(['a.txt']);
    });

    it('refuses a path that leaves the root, a root nothing names, and a file', () => {
        const dir = folder({ 'a.txt': 'a\n' });
        const list: Root[] = [{ key: 'one', dir }];

        expect(entriesOf(list, 'one', '../..')).toEqual(['error:outside']);
        expect(entriesOf(list, 'other', '')).toEqual(['error:outside']);
        expect(entriesOf(list, 'one', 'a.txt')).toEqual(['error:missing']);
        expect(entriesOf(list, 'one', 'nowhere')).toEqual(['error:missing']);
    });

    it('refuses a symbolic link that points out of the root rather than following it', () => {
        const outside = folder({ 'secret.txt': 's\n' });
        const dir = folder({ 'a.txt': 'a\n' });
        symlinkSync(outside, join(dir, 'away'));

        expect(entriesOf([{ key: 'one', dir }], 'one', 'away')).toEqual(['error:outside']);
    });
});

describe('the workspaces file', () => {
    it('reads back what was written, whole', () => {
        const file = savedFile();
        writeSaved(
            file,
            saved('thesis', [{ name: 'thesis', roots: [{ key: 'n', dir: '/tmp/n' }] }])
        );

        expect(readSaved(file)).toEqual({
            current: 'thesis',
            workspaces: [{ name: 'thesis', roots: [{ key: 'n', dir: '/tmp/n' }] }],
            dropped: []
        });
    });

    it('reads a missing, corrupt or wrongly shaped file as nothing saved', () => {
        const file = savedFile();
        expect(readSaved(file)).toEqual({ current: '', workspaces: [], dropped: [] });

        writeFileSync(file, 'not json at all');
        expect(readSaved(file)).toEqual({ current: '', workspaces: [], dropped: [] });

        writeFileSync(file, JSON.stringify({ workspaces: 'a string' }));
        expect(readSaved(file)).toEqual({ current: '', workspaces: [], dropped: [] });
    });

    it('drops an entry that is not a workspace and a root that is not a pair of strings', () => {
        const file = savedFile();
        writeFileSync(
            file,
            JSON.stringify({
                current: 'one',
                workspaces: [
                    { name: 'one', roots: [{ key: 'a', dir: '/tmp/a' }, { key: '' }, 7] },
                    { roots: [] },
                    { name: 'one', roots: [] }
                ]
            })
        );

        expect(readSaved(file)).toEqual({
            current: 'one',
            workspaces: [{ name: 'one', roots: [{ key: 'a', dir: '/tmp/a' }] }],
            dropped: []
        });
    });

    it('drops a saved root whose key the configuration reserves, and names the key', () => {
        const file = savedFile();
        writeFileSync(
            file,
            JSON.stringify({
                current: '',
                workspaces: [
                    {
                        name: '',
                        roots: [
                            { key: 'hub', dir: '/tmp/elsewhere' },
                            { key: 'cathedra', dir: '/tmp/other' },
                            { key: 'notes', dir: '/tmp/notes' }
                        ]
                    }
                ]
            })
        );
        const read = readSaved(file, ['hub', 'cathedra']);

        expect(read.workspaces[0].roots).toEqual([{ key: 'notes', dir: '/tmp/notes' }]);
        expect(read.dropped).toEqual(['hub', 'cathedra']);
    });

    it('never writes the dropped keys back into the file', () => {
        const file = savedFile();
        writeSaved(file, { current: '', workspaces: [], dropped: ['hub'] });

        expect(Object.keys(JSON.parse(readFileSync(file, 'utf8')) as object).sort()).toEqual([
            'current',
            'workspaces'
        ]);
    });

    it('falls back to the default workspace when current names one that is not there', () => {
        const file = savedFile();
        writeSaved(file, saved('gone', [{ name: 'here', roots: [] }]));

        expect(readSaved(file).current).toBe('');
    });

    it('gives the roots of one workspace and nothing of another one', () => {
        const held = saved('two', [
            { name: 'one', roots: [{ key: 'a', dir: '/tmp/a' }] },
            { name: 'two', roots: [{ key: 'b', dir: '/tmp/b' }] }
        ]);

        expect(rootsOf(held, 'one')).toEqual([{ key: 'a', dir: '/tmp/a' }]);
        expect(rootsOf(held, 'nowhere')).toEqual([]);
    });
});

describe('the fold from a saved file to the roots on screen', () => {
    const HUB: Root[] = [{ key: 'hub', dir: '/tmp/hub' }];

    const CONFIGURED: Root[] = [...HUB, { key: 'notes', dir: '/tmp/notes' }];

    it('shows the configured roots alone, all fixed, when nothing is saved', () => {
        expect(workspaceRoots(CONFIGURED, saved(''), '')).toEqual([
            { key: 'hub', dir: '/tmp/hub', fixed: true },
            { key: 'notes', dir: '/tmp/notes', fixed: true }
        ]);
    });

    it('shows a saved root after the configured ones, and only it is removable', () => {
        const held = saved('', [{ name: '', roots: [{ key: 'notes', dir: '/tmp/notes' }] }]);

        expect(workspaceRoots(HUB, held, '')).toEqual([
            { key: 'hub', dir: '/tmp/hub', fixed: true },
            { key: 'notes', dir: '/tmp/notes', fixed: false }
        ]);
    });

    it('keeps the configured root when a saved one carries the same key', () => {
        const held = saved('', [{ name: '', roots: [{ key: 'notes', dir: '/tmp/elsewhere' }] }]);

        expect(workspaceRoots(CONFIGURED, held, '')).toEqual([
            { key: 'hub', dir: '/tmp/hub', fixed: true },
            { key: 'notes', dir: '/tmp/notes', fixed: true }
        ]);
    });

    it('shows the workspace folder after the hub, not removable, when neither names a root', () => {
        const shown = workspaceRoots(HUB, saved(''), '');

        expect(shown.map((one) => one.key)).toEqual(['hub', 'workspace']);
        expect(shown[1].fixed).toBe(true);
        expect(shown[1].dir.endsWith(`${sep}workspace`)).toBe(true);
        expect(workspaceRoots([], saved(''), '').map((one) => one.key)).toEqual(['workspace']);
    });

    it('does not add the workspace folder beside a configured or a saved root', () => {
        const configured: Root[] = [...HUB, { key: 'notes', dir: '/tmp/notes' }];
        expect(workspaceRoots(configured, saved(''), '').map((one) => one.key)).toEqual([
            'hub',
            'notes'
        ]);
        const held = saved('', [{ name: '', roots: [{ key: 'own', dir: '/tmp/own' }] }]);
        expect(workspaceRoots(HUB, held, '').map((one) => one.key)).toEqual(['hub', 'own']);
    });

    it('shows the engine config folder as a fixed root and refuses a saved one on its key', () => {
        const fixed: Root[] = [...HUB, engineRoot('/tmp/engine')];
        expect(workspaceRoots(fixed, saved(''), '')).toEqual([
            { key: 'hub', dir: '/tmp/hub', fixed: true },
            { key: ENGINE_ROOT, dir: join('/tmp/engine', 'config'), fixed: true }
        ]);
        const held = saved('', [
            { name: '', roots: [{ key: ENGINE_ROOT, dir: '/tmp/elsewhere' }] }
        ]);
        expect(workspaceRoots(fixed, held, '')).toEqual([
            { key: 'hub', dir: '/tmp/hub', fixed: true },
            { key: ENGINE_ROOT, dir: join('/tmp/engine', 'config'), fixed: true }
        ]);
        expect(addedRoots(fixed, held)).toEqual([]);
    });

    it('hands the file route the roots to add, the default folder among them', () => {
        const held = saved('two', [{ name: 'two', roots: [{ key: 'b', dir: '/tmp/b' }] }]);

        expect(addedRoots(HUB, held)).toEqual([{ key: 'b', dir: '/tmp/b' }]);
        expect(addedRoots(HUB, saved('')).map((one) => one.key)).toEqual(['workspace']);
    });
});

describe('the key a reader-added root is filed under', () => {
    it('is the folder name, reduced to the characters a key may hold', () => {
        expect(rootKey('/tmp/my notes', [])).toBe('my-notes');
        expect(rootKey('/tmp/game-engine', [])).toBe('game-engine');
        expect(rootKey('/tmp/.hidden', [])).toBe('hidden');
    });

    it('adds a number while the key is taken', () => {
        expect(rootKey('/tmp/notes', ['notes'])).toBe('notes-2');
        expect(rootKey('/tmp/notes', ['notes', 'notes-2'])).toBe('notes-3');
    });

    it('files a name that reduces to nothing under the default root word', () => {
        expect(rootKey('/tmp/---', [])).toBe('workspace');
    });
});

describe("the reader's own bookmarks", () => {
    /** The hub the collection writers are given, which holds no bookmarks file of its own. */
    const config = portfolioConfigFrom(loadConfig(engineDir()).config, engineDir());

    /** A bookmarks path inside a fresh temporary directory, with nothing written at it yet. */
    function bookmarksFile(): { hub: string; file: string } {
        const dir = scratchDir('oculus-bookmarks-');
        expect(resolve(dir).startsWith(resolve(tmpdir()) + sep)).toBe(true);
        return { hub: dir, file: join(dir, 'bookmarks.yml') };
    }

    it("reads no bookmarks and the scaffold's schema from a file that is not there", () => {
        const { file } = bookmarksFile();
        const read = readBookmarks(file);

        // The form that adds the first bookmark draws its controls from this, and the file the
        // first write makes carries the same three fields.
        expect(read.entries).toEqual([]);
        expect(read.schema).toEqual([
            { field: 'label', type: 'text', label: 'Label', required: true },
            { field: 'root', type: 'select', label: 'Root' },
            { field: 'path', type: 'text', label: 'Path' }
        ]);
        expect(existsSync(file)).toBe(false);
    });

    it('writes the title and the schema on the first ask, and leaves an existing file alone', () => {
        const { file } = bookmarksFile();
        ensureBookmarksFile(file);
        const first = readFileSync(file, 'utf8');

        expect(first).toContain('title: Bookmarks');
        expect(readBookmarks(file).schema.map((field) => field.field)).toEqual([
            'label',
            'root',
            'path'
        ]);
        // The root is a select with no options of its own, so the page supplies the roots in force.
        expect(readBookmarks(file).schema[1]).toEqual({
            field: 'root',
            type: 'select',
            label: 'Root'
        });

        writeFileSync(file, `${first}\nentries:\n  - { label: kept, root: hub, path: a.md }\n`);
        ensureBookmarksFile(file);
        expect(readBookmarks(file).entries.map((one) => one.id)).toEqual(['kept']);
    });

    it('adds, edits and removes one bookmark through the collection write path', () => {
        const { hub, file } = bookmarksFile();

        const added = createEntry(
            hub,
            config,
            BOOKMARKS,
            { label: 'manual', root: 'hub', path: 'docs/manual.md' },
            file
        );
        expect(added).toEqual({
            found: true,
            id: 'manual',
            changed: ['entries'],
            refused: [],
            records: [
                {
                    file,
                    key: 'manual',
                    field: 'entries',
                    before: null,
                    after: { label: 'manual', root: 'hub', path: 'docs/manual.md' },
                    undo: 'create'
                }
            ]
        });
        expect(readBookmarks(file).entries.map((one) => one.fields)).toEqual([
            { label: 'manual', root: 'hub', path: 'docs/manual.md' }
        ]);

        // The second one is an append, which is the path every entry after the first takes.
        const second = createEntry(
            hub,
            config,
            BOOKMARKS,
            { label: 'notes', root: 'hub', path: 'n.md' },
            file
        );
        expect(second).toEqual({
            found: true,
            id: 'notes',
            changed: ['entries'],
            refused: [],
            records: [
                {
                    file,
                    key: 'notes',
                    field: 'entries',
                    before: null,
                    after: { label: 'notes', root: 'hub', path: 'n.md' },
                    undo: 'create'
                }
            ]
        });
        expect(readBookmarks(file).entries.map((one) => one.id)).toEqual(['manual', 'notes']);

        const edited = writeEntry(
            hub,
            config,
            BOOKMARKS,
            'manual',
            { path: 'docs/other.md' },
            file
        );
        expect(edited.changed).toEqual(['path']);
        expect(readBookmarks(file).entries[0].fields.path).toBe('docs/other.md');

        const gone = removeEntry(hub, config, BOOKMARKS, 'notes', file);
        expect(gone.changed).toEqual(['entries']);
        expect(readBookmarks(file).entries.map((one) => one.id)).toEqual(['manual']);
    });

    it('takes a bookmark again after the last one was removed', () => {
        const { hub, file } = bookmarksFile();
        createEntry(hub, config, BOOKMARKS, { label: 'manual', root: 'hub', path: 'a.md' }, file);
        removeEntry(hub, config, BOOKMARKS, 'manual', file);
        expect(readBookmarks(file).entries).toEqual([]);

        // Deleting the last entry leaves the key with nothing under it, which is not a list; the
        // next write puts the entry back under that key rather than refusing it.
        const again = createEntry(
            hub,
            config,
            BOOKMARKS,
            { label: 'other', root: 'hub', path: 'b.md' },
            file
        );

        expect(again).toEqual({
            found: true,
            id: 'other',
            changed: ['entries'],
            refused: [],
            records: [
                {
                    file,
                    key: 'other',
                    field: 'entries',
                    before: null,
                    after: { label: 'other', root: 'hub', path: 'b.md' },
                    undo: 'create'
                }
            ]
        });
        expect(readBookmarks(file).entries.map((one) => one.id)).toEqual(['other']);
    });

    it('refuses a second bookmark under a label the file already holds', () => {
        const { hub, file } = bookmarksFile();
        const fields = { label: 'manual', root: 'hub', path: 'a.md' };
        createEntry(hub, config, BOOKMARKS, fields, file);
        const again = createEntry(hub, config, BOOKMARKS, { ...fields, path: 'b.md' }, file);

        expect(again.changed).toEqual([]);
        expect(again.refused[0].field).toBe('label');
        expect(readBookmarks(file).entries).toHaveLength(1);
    });

    it("writes the reader's own file and nothing under the hub", () => {
        const { hub, file } = bookmarksFile();
        createEntry(hub, config, BOOKMARKS, { label: 'manual', root: 'hub', path: 'a.md' }, file);

        expect(existsSync(file)).toBe(true);
        expect(existsSync(join(hub, 'registries', 'bookmarks.yml'))).toBe(false);
    });
});

describe('the scratch notes', () => {
    /** A notes folder inside a fresh temporary directory, with nothing in it yet. */
    function notesDir(): string {
        const dir = scratchDir('oculus-notes-');
        expect(resolve(dir).startsWith(resolve(tmpdir()) + sep)).toBe(true);
        return join(dir, 'notes');
    }

    it('reads the title off the first line and the body off the rest', () => {
        expect(splitNote('a title\nline one\nline two\n')).toEqual({
            title: 'a title',
            body: 'line one\nline two\n'
        });
        expect(splitNote('just a title')).toEqual({ title: 'just a title', body: '' });
        expect(noteText('a title', 'body\n')).toBe('a title\nbody\n');
        // A title carrying a newline would make the line after it the body on the next read.
        expect(noteText('two\nlines', 'body')).toBe('two lines\nbody');
    });

    it('writes one note, reads it back whole, and lists it', () => {
        const dir = notesDir();
        const row = saveNote(dir, '20260915-120000-001', 'a title', 'the body\n');

        expect(row?.id).toBe('20260915-120000-001');
        expect(readNote(dir, '20260915-120000-001')).toMatchObject({
            id: '20260915-120000-001',
            title: 'a title',
            body: 'the body\n'
        });
        expect(listNotes(dir).map((one) => `${one.id}:${one.title}`)).toEqual([
            '20260915-120000-001:a title'
        ]);
    });

    it('lists the newest note first and reads a folder that is not there as no notes', () => {
        const dir = notesDir();
        expect(listNotes(dir)).toEqual([]);

        saveNote(dir, '20260915-120000-001', 'older', '');
        saveNote(dir, '20260915-120000-002', 'newer', '');
        // The two writes can land in the same millisecond, so the older one is put back in time.
        utimesSync(join(dir, '20260915-120000-001.md'), new Date(1000), new Date(1000));

        expect(listNotes(dir).map((one) => one.title)).toEqual(['newer', 'older']);
    });

    it('takes one note off the disk and answers a note that is already gone', () => {
        const dir = notesDir();
        saveNote(dir, '20260915-120000-001', 'a title', '');

        expect(deleteNote(dir, '20260915-120000-001')).toBe(true);
        expect(readNote(dir, '20260915-120000-001')).toBe(null);
        expect(deleteNote(dir, '20260915-120000-001')).toBe(true);
        expect(listNotes(dir)).toEqual([]);
    });

    it('refuses a note whose file is a link out of the folder, and reads nothing through it', () => {
        const dir = notesDir();
        mkdirSync(dir, { recursive: true });
        const outside = scratchDir('oculus-notes-out-');
        expect(resolve(outside).startsWith(resolve(tmpdir()) + sep)).toBe(true);
        writeFileSync(join(outside, 'secret.md'), 'a secret title\nthe secret\n');
        symlinkSync(join(outside, 'secret.md'), join(dir, 'link.md'));

        expect(noteFile(dir, 'link')).toBe(null);
        expect(readNote(dir, 'link')).toBe(null);
        expect(listNotes(dir).map((one) => one.id)).toEqual([]);
        expect(saveNote(dir, 'link', 'x', 'y')).toBe(null);
        expect(deleteNote(dir, 'link')).toBe(false);
        expect(readFileSync(join(outside, 'secret.md'), 'utf8')).toBe(
            'a secret title\nthe secret\n'
        );
    });

    it('refuses an id that would leave the folder, and writes nothing outside it', () => {
        const dir = notesDir();
        const outside = scratchDir('oculus-notes-out-');

        for (const id of ['', '../away', `..${sep}away`, 'sub/deep', 'a'.repeat(65)]) {
            expect(noteFile(dir, id)).toBe(null);
            expect(saveNote(dir, id, 'x', 'y')).toBe(null);
            expect(deleteNote(dir, id)).toBe(false);
            expect(readNote(dir, id)).toBe(null);
        }
        expect(existsSync(join(outside, 'away.md'))).toBe(false);
    });
});
