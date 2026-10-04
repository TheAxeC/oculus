// Layer 2, client-state tests. What a Files tab keeps beyond its open folders: the folder it is
// rooted at (view/tab-roots.ts), the ask to show a path, open or not (view/reveal.ts), and the
// bookmarks as the tree and the rail read them (view/bookmark-rows.ts).
//
// What this does NOT cover: the tab drawn (tests/views/sources/files/files.test.ts) and the
// bookmarks file read from disk (tests/server/files/fs.test.ts).

import { describe, expect, it } from 'vitest';
import {
    bookmarkRows,
    filesViewOf,
    revealAsked,
    revealSettled,
    rootedState,
    rootedView,
    type FsRoot
} from '../../../../../src/lib/state/sources/fs.ts';

/** The ask a tab holds to show a path; a tab with none fails the case. */
function asked(
    view: ReturnType<typeof filesViewOf>
): NonNullable<ReturnType<typeof filesViewOf>['reveal']> {
    if (view.reveal === null) throw new Error('the tab holds no ask');
    return view.reveal;
}

const ROOTS: FsRoot[] = [
    { key: 'hub', dir: '/r/hub', fixed: true },
    { key: 'notes', dir: '/r/notes', fixed: false }
];

describe('a Files tab rooted at a folder', () => {
    // Revert: draw every root of the workspace on a rooted tab.
    it('draws the one root holding the folder, the folder as its head, and a row that moves up', () => {
        const view = rootedView({ root: 'hub', path: 'projects/x' }, ROOTS);

        expect(view.rooted).toBe(true);
        expect(view.roots.map((one) => one.key)).toEqual(['hub']);
        expect(view.top).toEqual({ path: 'projects/x', name: 'x' });
        expect(view.up).toEqual({ root: 'hub', path: 'projects' });
    });

    // Revert: give the root's own top a row that moves up.
    it('moves up to the root at the first folder and has no row to move up at the root itself', () => {
        expect(rootedView({ root: 'hub', path: 'projects' }, ROOTS).up).toEqual({
            root: 'hub',
            path: ''
        });
        const top = rootedView({ root: 'hub', path: '' }, ROOTS);

        expect(top.up).toBeNull();
        expect(top.top).toEqual({ path: '', name: 'hub' });
    });

    // Revert: draw a tab that is not rooted as rooted.
    it('draws the workspace as it is for a tab that is not rooted', () => {
        expect(rootedView(null, ROOTS)).toEqual({
            rooted: false,
            roots: ROOTS,
            top: null,
            up: null
        });
    });

    // Revert: draw the roots of the workspace when the rooted tab's root is gone.
    it('draws nothing for a rooted tab whose root the workspace no longer has', () => {
        expect(rootedView({ root: 'gone', path: 'a' }, ROOTS)).toEqual({
            rooted: true,
            roots: [],
            top: null,
            up: null
        });
    });

    // Revert: leave the filter in place in rootedState.
    it('writes the folder as the top of the tab, open and selected, and clears the filter', () => {
        const state = rootedState(
            { filter: 'zzz', hidden: true },
            { root: 'hub', path: 'projects/x' }
        );
        const view = filesViewOf(state);

        expect(view.top).toEqual({ root: 'hub', path: 'projects/x' });
        expect(view.expanded).toContain('hub:projects/x');
        expect(view.selected).toEqual({ root: 'hub', path: 'projects/x' });
        expect(view.filter).toBe('');
        expect(view.hidden).toBe(true);
    });
});

describe('the ask to show a path', () => {
    // Revert: leave `open` out of revealAsked.
    it('records that the folder asked for is to be shown open', () => {
        const asked = filesViewOf(revealAsked({}, 'projects/x', 'hub', true));

        expect(asked.reveal).toMatchObject({
            root: 'hub',
            path: 'projects/x',
            open: true,
            settled: false
        });
        expect(filesViewOf(revealAsked({}, 'a.md', 'hub')).reveal?.open).toBeUndefined();
    });

    // Revert: ignore `ask.open` in revealSettled.
    it('opens the folder found when the ask said so, and only then', () => {
        const found = {
            kind: 'found' as const,
            asked: { root: 'hub', path: 'p/x' },
            shown: { root: 'hub', path: 'p/x' },
            error: ''
        };
        const open = filesViewOf(revealAsked({}, 'p/x', 'hub', true));
        const plain = filesViewOf(revealAsked({}, 'p/x', 'hub'));

        expect(revealSettled(open, asked(open), found)?.expanded).toEqual([
            'hub:',
            'hub:p',
            'hub:p/x'
        ]);
        expect(revealSettled(plain, asked(plain), found)?.expanded).toEqual(['hub:', 'hub:p']);
    });
});

describe('the bookmarks', () => {
    // Revert: give a folder the file view.
    it('opens a folder bookmark in the Files view, with its kind, and a gone one as gone', () => {
        const rows = bookmarkRows([
            { title: 'src', fields: { root: 'hub', path: 'src' }, kind: 'folder' },
            { title: 'old', fields: { root: 'hub', path: 'old.md' }, kind: 'missing' },
            { title: 'page', fields: { root: 'hub', path: 'index.html' }, kind: 'file' }
        ]);

        expect(rows).toEqual([
            { label: 'src', root: 'hub', path: 'src', view: 'files', kind: 'folder' },
            { label: 'old', root: 'hub', path: 'old.md', view: 'file', kind: 'missing' },
            { label: 'page', root: 'hub', path: 'index.html', view: 'document' }
        ]);
    });
});
