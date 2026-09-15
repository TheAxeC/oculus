// What lib/server/fs.ts answers: the entries of one directory under a root, the workspaces file, and
// the pure fold from a saved file to the roots on screen.
//
// Every root and every workspaces file here is synthetic, under the system temporary directory, and
// every path written is asserted to be inside it first. Nothing reads or writes ~/.oculus.
//
// What this does NOT cover: defaultWorkspacesPath() resolving the machine's own home directory,
// which nothing here may touch, and the route wrapper around these calls, which is
// tests/routes/fs.test.ts.

import {
    mkdirSync,
    mkdtempSync,
    readFileSync,
    realpathSync,
    symlinkSync,
    writeFileSync
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, sep } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
    addedRoots,
    listDir,
    readSaved,
    rootKey,
    rootsOf,
    workspaceRoots,
    writeSaved,
    type Saved
} from '../../src/lib/server/fs.ts';
import { ENGINE_ROOT, engineRoot } from '../../src/lib/server/files.ts';
import type { Root } from '../../src/lib/server/files.ts';

/** A directory under the temporary directory, with a file written at each of the paths named. */
function folder(files: Record<string, string> = {}, dirs: string[] = []): string {
    const dir = mkdtempSync(join(tmpdir(), 'oculus-fs-'));
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
    const dir = mkdtempSync(join(tmpdir(), 'oculus-workspaces-'));
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
