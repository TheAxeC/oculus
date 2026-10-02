// The folder panel's answer and what Add Folder to Workspace and Open Folder make of it
// (acts/folders.ts), the choices of `:workspace` (acts/workspaces.ts) and the folder New File and
// New Folder act in (naming.ts).
//
// What this does NOT cover: the panel itself or the route that opens it (tests/server/files/
// picker.test.ts) and the writes that add a root (tests/routes/edit/roots.test.ts).

import { describe, expect, it } from 'vitest';
import {
    addedLine,
    folderChoice,
    foldersToAdd,
    pickedOf,
    pickerLine
} from '../../../../../src/lib/state/sources/explorer/acts/folders.ts';
import { workspaceMatches } from '../../../../../src/lib/state/sources/explorer/acts/workspaces.ts';
import { newItemFolder } from '../../../../../src/lib/state/sources/explorer/naming.ts';
import type { FsRoot, TreeRow } from '../../../../../src/lib/state/sources/fs.ts';
import { installRealText } from '../../../../views/shared/real-text.ts';

installRealText();

const ROOTS: FsRoot[] = [
    { key: 'hub', dir: '/r/hub', fixed: true },
    { key: 'notes', dir: '/r/notes', fixed: false }
];

describe('the answer of the folder panel', () => {
    // Revert: read the paths from a body that is not `ok`.
    it('lists the paths a chosen answer holds and no path for a cancelled panel', () => {
        expect(pickedOf({ ok: true, paths: ['/a', '/b'] }, '')).toEqual({
            ok: true,
            paths: ['/a', '/b']
        });
        expect(pickedOf({ ok: true, paths: [] }, '')).toEqual({ ok: true, paths: [] });
        expect(pickedOf({ ok: true, paths: ['/a', ''] }, '')).toEqual({ ok: true, paths: ['/a'] });
    });

    // Revert: answer `failed` for every refusal word.
    it('keeps the word a refusal came with and calls a request that never arrived `network`', () => {
        expect(pickedOf({ error: 'unsupported' }, '')).toEqual({ ok: false, error: 'unsupported' });
        expect(pickedOf({ error: 'busy' }, '')).toEqual({ ok: false, error: 'busy' });
        expect(pickedOf({ error: 'token' }, '')).toEqual({ ok: false, error: 'token' });
        expect(pickedOf({ error: 'surprise' }, '')).toEqual({ ok: false, error: 'failed' });
        expect(pickedOf(null, 'offline')).toEqual({ ok: false, error: 'network' });
    });

    // Revert: use one sentence for every refusal in pickerLine.
    it('says each refusal in its own words', () => {
        const lines = (['unsupported', 'busy', 'failed', 'token', 'network'] as const).map(
            pickerLine
        );

        expect(new Set(lines).size).toBe(5);
        expect(lines[0]).toBe('The folder panel is available on macOS only.');
    });
});

describe('Add Folder to Workspace', () => {
    // Revert: drop the held set from foldersToAdd.
    it('adds each new folder once and skips the ones that are roots already', () => {
        const plan = foldersToAdd(['/r/notes/', '/r/new', '/r/new', '/r/other'], ROOTS);

        expect(plan).toEqual({ add: ['/r/new', '/r/other'], skipped: ['/r/notes'] });
    });

    // Revert: return the skipped line before the refusal in addedLine.
    it('says why the panel did not open, the first refusal of a write, or the folders skipped', () => {
        const refuse = (code: string): string => `refused:${code}`;

        expect(addedLine({ ok: false, picker: 'busy' }, refuse)).toBe(
            'The folder panel is already open.'
        );
        expect(
            addedLine({ ok: true, added: 1, skipped: ['/a'], refused: 'root-fixed' }, refuse)
        ).toBe('refused:root-fixed');
        expect(addedLine({ ok: true, added: 0, skipped: ['/a', '/b'], refused: '' }, refuse)).toBe(
            'Already folders of this workspace: /a, /b'
        );
        expect(addedLine({ ok: true, added: 2, skipped: [], refused: '' }, refuse)).toBe('');
    });
});

describe('Open Folder', () => {
    // Revert: take the last path instead of the first.
    it('takes the first folder the panel returned', () => {
        expect(folderChoice([], ROOTS)).toEqual({ kind: 'none' });
        expect(folderChoice(['/r/hub/projects/x', '/r/notes'], ROOTS)).toEqual({
            kind: 'inside',
            root: 'hub',
            path: 'projects/x'
        });
    });

    // Revert: answer `inside` for a folder no root holds.
    it('says a folder outside every root is outside', () => {
        expect(folderChoice(['/elsewhere/x/'], ROOTS)).toEqual({
            kind: 'outside',
            dir: '/elsewhere/x'
        });
    });
});

describe('the workspaces `:workspace` lists', () => {
    // Revert: leave the default workspace out of the list.
    it('lists the default workspace first and the saved ones in order, the one in force marked', () => {
        const all = workspaceMatches('', ['thesis', 'grant'], 'grant', 'Configured roots');

        expect(all.map((one) => [one.name, one.label, one.current])).toEqual([
            ['', 'Configured roots', false],
            ['thesis', 'thesis', false],
            ['grant', 'grant', true]
        ]);
        expect(workspaceMatches('', ['thesis'], '', 'Configured roots')[0]?.current).toBe(true);
    });

    // Revert: match any word instead of every word.
    it('narrows by every word of the argument, whatever the case', () => {
        expect(
            workspaceMatches('GRA nt', ['thesis', 'grant'], '', 'Configured roots').map(
                (one) => one.name
            )
        ).toEqual(['grant']);
        expect(
            workspaceMatches('configured', ['thesis'], '', 'Configured roots').map(
                (one) => one.name
            )
        ).toEqual(['']);
    });
});

describe('where New File and New Folder make their item', () => {
    const row = (path: string, kind: 'file' | 'dir'): TreeRow => ({
        root: 'hub',
        path,
        name: path.slice(path.lastIndexOf('/') + 1),
        kind,
        size: 0,
        depth: 1,
        open: false
    });
    const rows = [row('d', 'dir'), row('d/f.txt', 'file')];

    // Revert: use the selected row's own path for a file.
    it('uses the selected folder, the folder of a selected file, and the first root with nothing selected', () => {
        expect(newItemFolder(rows, { root: 'hub', path: 'd' }, ROOTS)).toEqual({
            root: 'hub',
            path: 'd'
        });
        expect(newItemFolder(rows, { root: 'hub', path: 'd/f.txt' }, ROOTS)).toEqual({
            root: 'hub',
            path: 'd'
        });
        expect(newItemFolder(rows, null, ROOTS)).toEqual({ root: 'hub', path: '' });
        expect(newItemFolder(rows, null, [])).toBeNull();
    });

    // Revert: return null for a selected row the list does not hold.
    it('takes a selected row the list does not hold for a folder of a compact chain', () => {
        expect(newItemFolder(rows, { root: 'hub', path: 'a/b' }, ROOTS)).toEqual({
            root: 'hub',
            path: 'a/b'
        });
    });
});
