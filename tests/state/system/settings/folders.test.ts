// Layer 2, client-state tests. The Catalogs and Texts groups of the Settings view: the files of
// config/catalogs/ and of config/text/ with its subfolders, read from the file browser's listings
// of those folders and not from a fixed list, in name order, with the sentence for a listing still
// loading and for one that failed.
//
// The listings here are a fixture that differs from the tree, so a list written into the code
// would fail.
//
// What this does NOT cover: the groups drawn and the open action pressed (tests/views/system/
// workbench/settings-editors.test.ts), and the file browser's own listing.

import { describe, expect, it } from 'vitest';
import type { FsEntry } from '../../../../src/lib/state/sources/fs.ts';
import {
    listedFiles,
    type ListingOf
} from '../../../../src/lib/state/system/config/view/folders.ts';
import { SETTINGS_MESSAGES } from '../../../../src/lib/state/system/config/messages.ts';
import { settingsGroups, tocOf } from '../../../../src/lib/state/system/config/groups.ts';
import { dir, file, shipped, text } from './fixture.ts';

/** The listings of a fixture tree, by folder path under the engine root. */
const TREE: Record<string, FsEntry[]> = {
    catalogs: [file('zeta.yml'), file('alpha.yml'), file('mid.yml')],
    text: [dir('views'), file('notes.txt'), file('app.yml')],
    'text/views': [dir('system'), file('b.yml'), file('a.yml')],
    'text/views/system': [file('deep.yml')]
};

/** A listing over the fixture, with a folder the tree lacks answering the failure given. */
function listing(
    tree: Record<string, FsEntry[]> = TREE,
    states: Partial<Record<string, { error?: string; loading?: boolean }>> = {}
): ListingOf {
    return (path) => ({
        entries: tree[path] ?? [],
        error: states[path]?.error ?? '',
        loading: states[path]?.loading ?? false
    });
}

describe('the files of a folder', () => {
    it('are the fixture, in name order, whatever the order of the listing', () => {
        expect(listedFiles('catalogs', listing())).toEqual({
            status: 'rows',
            files: ['catalogs/alpha.yml', 'catalogs/mid.yml', 'catalogs/zeta.yml'],
            said: null
        });
    });

    it('include the files of every subfolder, nested ones too, and a file that is not .yml', () => {
        const found = listedFiles('text', listing());
        expect(found.status).toBe('rows');
        expect(found.files).toEqual([
            'text/app.yml',
            'text/notes.txt',
            'text/views/a.yml',
            'text/views/b.yml',
            'text/views/system/deep.yml'
        ]);
    });

    it('list no folder as a file', () => {
        expect(listedFiles('text', listing()).files).not.toContain('text/views');
    });

    it('are empty for an empty folder, which is a listing and not a failure', () => {
        expect(listedFiles('catalogs', listing({ catalogs: [] }))).toEqual({
            status: 'rows',
            files: [],
            said: null
        });
    });

    it('say they are loading while any listing of the folder is, and list nothing yet', () => {
        const found = listedFiles('text', listing(TREE, { 'text/views': { loading: true } }));
        expect(found.status).toBe('loading');
        expect(found.files).toEqual([]);
        expect(found.said).toEqual({ key: SETTINGS_MESSAGES.listLoading, args: ['text'] });
    });

    it('name the failure of a listing that failed, folder and reason', () => {
        const found = listedFiles(
            'text',
            listing(TREE, { 'text/views/system': { error: 'no such folder' } })
        );
        expect(found.status).toBe('failed');
        expect(found.files).toEqual([]);
        expect(found.said).toEqual({
            key: SETTINGS_MESSAGES.listFailed,
            args: ['text/views/system', 'no such folder']
        });
    });

    it('say the failure when one listing failed and another is still loading', () => {
        const found = listedFiles(
            'text',
            listing(TREE, { 'text/views': { loading: true }, text: { error: 'denied' } })
        );
        expect(found.status).toBe('failed');
    });

    it('ask for the folder and each folder under it, and for no other', () => {
        const asked: string[] = [];
        const inner = listing();
        listedFiles('text', (path) => {
            asked.push(path);
            return inner(path);
        });
        expect(asked.sort()).toEqual(['text', 'text/views', 'text/views/system']);
    });
});

describe('the Catalogs and Texts groups among the Settings groups', () => {
    const groups = (texts = listing()) =>
        settingsGroups(shipped, () => text(''), [], {
            catalogs: listedFiles('catalogs', texts),
            texts: listedFiles('text', texts)
        });

    it('come after the file groups, each as one group holding a row per file', () => {
        const all = groups();
        const ids = all.map((group) => group.id);
        expect(ids.slice(-2)).toEqual(['catalogs', 'texts']);
        const catalogs = all.find((group) => group.id === 'catalogs');
        const rows = catalogs?.sections.flatMap((section) => section.rows) ?? [];
        expect(rows.map((row) => row.kind)).toEqual(['file', 'file', 'file']);
        expect(rows.map((row) => (row.kind === 'file' ? row.file : ''))).toEqual([
            'catalogs/alpha.yml',
            'catalogs/mid.yml',
            'catalogs/zeta.yml'
        ]);
    });

    it('carry the sentence of a listing loading and of one that failed, with no row', () => {
        const loading = groups(listing(TREE, { catalogs: { loading: true } })).find(
            (group) => group.id === 'catalogs'
        );
        expect(loading?.said?.key).toBe(SETTINGS_MESSAGES.listLoading);
        expect(loading?.sections.flatMap((section) => section.rows)).toEqual([]);
        const failed = groups(listing(TREE, { text: { error: 'denied' } })).find(
            (group) => group.id === 'texts'
        );
        expect(failed?.said?.key).toBe(SETTINGS_MESSAGES.listFailed);
    });

    it('are entries of the table of contents', () => {
        expect(tocOf(groups()).map((entry) => entry.id)).toContain('texts');
    });
});
