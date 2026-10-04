// Layer 2, client-state tests. The explorer over the file browser's rows, the pure half in
// state/sources/fs.ts: what a filter leaves, the rows the keyboard reads, the label a row's star
// bookmarks under, what the breadcrumb names, and which form a press or an answer leaves open.
// Where a key moves is zag's tree-view machine over the collection ui/tree/tree-keys.ts builds from
// these rows, tests/ui/tree/tree-keys.test.ts. What one instance keeps, and how a saved record is
// read, is tests/state/shared/instance-state-files.test.ts.
//
// What this does NOT cover: the rows drawn, which are tests/views/sources/files/files.test.ts; the
// keys pressed; and the forms pressed: the bookmark and root forms kept across a switch and a
// reload, the drafts forgotten by the add control, by a row's edit moving to another bookmark and
// by the bookmark's removal, the form remounted when an edit form opens over the add form, and a
// held root or bookmark answer landing after another form, the same root form reopened or a tab
// switch; nor the close question over a typed root line.

import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { engineDir, loadConfig, textCatalog } from '../../../../src/lib/data/sources/config.ts';
import { crumbsOf } from '../../../../src/lib/state/workbench/navigation/pages.ts';
import {
    bookmarkLeft,
    collapseRoot,
    editedGone,
    editShown,
    filesLineTyped,
    filesViewOf,
    shownOf,
    filterRows,
    formSettled,
    formShown,
    markLabel,
    parentOf,
    rowKey,
    setExpanded,
    treeKeyRows,
    treeKey,
    treeRows,
    workspaceChoices,
    type FsEntry,
    type FsRoot
} from '../../../../src/lib/state/sources/fs.ts';
import { setCatalog } from '../../../../src/lib/state/shared/words/text.ts';
import { createClientState, type ClientState } from '../../../fixtures/client.ts';
import { fakeStorage } from '../../workbench/layout/layout-fixture.ts';

function file(name: string, size = 10): FsEntry {
    return { name, kind: 'file', size, mtime: 1 };
}

function dir(name: string): FsEntry {
    return { name, kind: 'dir', size: 0, mtime: 1 };
}

/** The forms of a file browser with none open. */
const NO_FORM = { form: '', editing: '', typed: '', opening: 0 } as const;

function root(key: string, fixed = true): FsRoot {
    return { key, dir: `/tmp/${key}`, fixed };
}

describe('the explorer over the rows', () => {
    const listings: Record<string, FsEntry[]> = {
        'hub:': [dir('code'), dir('docs'), file('README.md')],
        'hub:code': [dir('lib'), file('run.py')],
        'hub:code/lib': [file('parse.py')],
        'hub:docs': [file('guide.md')],
        'notes:': [file('a.md')]
    };
    const entriesOf = (key: string, path: string): FsEntry[] => listings[treeKey(key, path)] ?? [];
    const open = ['hub:', 'hub:code', 'hub:code/lib', 'notes:'];
    const rows = treeRows([root('hub'), root('notes', false)], entriesOf, open);
    const keys = (list: { root: string; path: string }[]): string[] => list.map(rowKey);

    const roots = [root('hub'), root('notes', false)];
    const held = (key: string, path: string): FsEntry[] | null =>
        listings[treeKey(key, path)] ?? null;
    const shown = (text: string): string[] =>
        filterRows(roots, held, text).map((row) => `${row.depth}:${rowKey(row)}:${row.open}`);

    // Revert: push every entry in filterRows' walk, dropping the name test.
    it('keeps the rows whose name holds the text, whatever its case, and every root line', () => {
        expect(shown('README')).toEqual(['0:hub::true', '1:hub:README.md:false', '0:notes::false']);
        expect(shown('readme')).toEqual(shown('README'));
    });

    // Revert: skip the rows `below` a folder in filterRows, keeping only names that match.
    it('keeps the folders a match sits in and draws them open, so the match is under them', () => {
        expect(shown('parse')).toEqual([
            '0:hub::true',
            '1:hub:code:true',
            '2:hub:code/lib:true',
            '3:hub:code/lib/parse.py:false',
            '0:notes::false'
        ]);
    });

    // Revert: make `below` empty in filterRows' walk, so no folder is looked into.
    it('looks through a folder read before and closed since, which the tree does not draw now', () => {
        expect(keys(rows)).not.toContain('hub:docs/guide.md');
        expect(shown('guide')).toEqual([
            '0:hub::true',
            '1:hub:docs:true',
            '2:hub:docs/guide.md:false',
            '0:notes::false'
        ]);
    });

    // Revert: the first case's, pushing every entry.
    it('keeps a folder whose own name matches, closed when nothing under it does', () => {
        expect(shown('doc')).toEqual(['0:hub::true', '1:hub:docs:false', '0:notes::false']);
    });

    // Revert: make setExpanded add the key whatever `open` says.
    it('sets one folder open or closed whatever it was before', () => {
        expect(setExpanded(['hub:'], 'hub:code', true)).toEqual(['hub:', 'hub:code']);
        expect(setExpanded(['hub:', 'hub:code'], 'hub:code', true)).toEqual(['hub:', 'hub:code']);
        expect(setExpanded(['hub:', 'hub:code'], 'hub:code', false)).toEqual(['hub:']);
        expect(setExpanded(['hub:'], 'hub:code', false)).toEqual(['hub:']);
    });

    // Revert: return `{ root: row.root, path: '' }` from parentOf for every path.
    it('names the folder a path sits in, and nothing for a root line', () => {
        expect(parentOf({ root: 'hub', path: 'code/lib/parse.py' })).toEqual({
            root: 'hub',
            path: 'code/lib'
        });
        expect(parentOf({ root: 'hub', path: 'code' })).toEqual({ root: 'hub', path: '' });
        expect(parentOf({ root: 'hub', path: '' })).toBeNull();
    });

    // Revert: return `open: row.open` for a file too in treeKeyRows.
    it('hands the keyboard each row with the row above it, and open only on a folder', () => {
        const keyed = treeKeyRows(rows, false);
        expect(keyed.slice(0, 4)).toEqual([
            { id: 'hub:', parent: null, open: true, fixed: false },
            { id: 'hub:code', parent: 'hub:', open: true, fixed: false },
            { id: 'hub:code/lib', parent: 'hub:code', open: true, fixed: false },
            { id: 'hub:code/lib/parse.py', parent: 'hub:code/lib', open: undefined, fixed: false }
        ]);
    });

    // Revert: return `row.name` from markLabel whatever the labels hold.
    it('bookmarks a file under its name, and under its path when another bookmark holds the name', () => {
        const readme = { root: 'hub', path: 'docs/README.md', name: 'README.md' };
        expect(markLabel(readme, [])).toBe('README.md');
        expect(markLabel(readme, ['guide', 'README.md'])).toBe('docs/README.md');
    });

    // Revert: build each segment from the part alone instead of parts.slice(0, at + 1).
    it('names the root and each folder down to the row, each segment selecting its own path', () => {
        expect(crumbsOf({ root: 'hub', path: 'code/lib/parse.py' })).toEqual([
            { row: { root: 'hub', path: '' }, label: 'hub' },
            { row: { root: 'hub', path: 'code' }, label: 'code' },
            { row: { root: 'hub', path: 'code/lib' }, label: 'lib' },
            { row: { root: 'hub', path: 'code/lib/parse.py' }, label: 'parse.py' }
        ]);
        expect(crumbsOf({ root: 'hub', path: '' })).toEqual([
            { row: { root: 'hub', path: '' }, label: 'hub' }
        ]);
        expect(crumbsOf(null)).toEqual([]);
    });

    // Revert: filter out the root's own key in collapseRoot too.
    it('closes every folder under one root and leaves the root and every other root as they were', () => {
        expect(collapseRoot([...open, 'hubby:x'], 'hub')).toEqual(['hub:', 'notes:', 'hubby:x']);
    });

    it('closes only the folders under the followed folder, leaving it and its neighbours open', () => {
        const held = ['hub:', 'hub:a', 'hub:a/b', 'hub:a/b/c', 'hub:ab', 'hub:z'];
        expect(collapseRoot(held, 'hub', 'a')).toEqual(['hub:', 'hub:a', 'hub:ab', 'hub:z']);
    });

    it('hands on only the two toggles of an instance', () => {
        expect(shownOf(filesViewOf({ hidden: true, filter: 'x' }))).toEqual({
            hidden: true,
            ignored: false
        });
    });
});

describe('the forms of the file browser', () => {
    const adding = { form: 'bookmark', editing: '', typed: '', opening: 3 } as const;
    const manual = { form: 'bookmark', editing: 'the manual', typed: '', opening: 3 } as const;
    const line = { form: 'root', editing: '', typed: '/tmp/a', opening: 3 } as const;
    const closed = { ...NO_FORM, opening: 4 };

    // Revert: keep `typed` in formShown, close the form whichever one is open, or leave `opening`.
    it("opens a section's form, closes it when it is the one open, and drops the typed line", () => {
        expect(formShown(NO_FORM, 'root')).toEqual({ ...NO_FORM, form: 'root', opening: 1 });
        expect(formShown(line, 'root')).toEqual(closed);
        expect(formShown(line, 'workspace')).toEqual({ ...closed, form: 'workspace' });
        expect(formShown(adding, 'bookmark')).toEqual(closed);
        // The add control over an open edit form opens the add form rather than closing.
        expect(formShown(manual, 'bookmark')).toEqual({ ...adding, opening: 4 });
        expect(formShown(manual, 'root')).toEqual({ ...closed, form: 'root' });
    });

    // Revert: open the bookmark's form whether or not it is the one open, in editShown.
    it("opens one bookmark's form, closes it when it is that one's, and moves between two", () => {
        expect(editShown(NO_FORM, 'the manual')).toEqual({ ...manual, opening: 1 });
        expect(editShown(manual, 'the manual')).toEqual(closed);
        expect(editShown(manual, 'the guide')).toEqual({
            ...manual,
            editing: 'the guide',
            opening: 4
        });
        expect(editShown(adding, 'the manual')).toEqual({ ...manual, opening: 4 });
        expect(editShown(line, 'the manual')).toEqual({ ...manual, opening: 4 });
    });

    // Revert: answer null from bookmarkLeft whenever the next form is a bookmark form.
    it('names the bookmark form a move closes, and none for a move that keeps it', () => {
        expect(bookmarkLeft(adding, NO_FORM)).toEqual({ editing: '' });
        expect(bookmarkLeft(adding, manual)).toEqual({ editing: '' });
        expect(bookmarkLeft(manual, adding)).toEqual({ editing: 'the manual' });
        expect(bookmarkLeft(manual, { ...manual, editing: 'the guide' })).toEqual({
            editing: 'the manual'
        });
        expect(bookmarkLeft(manual, line)).toEqual({ editing: 'the manual' });
        expect(bookmarkLeft(manual, manual)).toBeNull();
        expect(bookmarkLeft(adding, adding)).toBeNull();
        expect(bookmarkLeft(line, manual)).toBeNull();
        expect(bookmarkLeft(NO_FORM, NO_FORM)).toBeNull();
    });

    // Revert: answer a closed form from formSettled whatever `now` holds, or leave `opening` out of
    // what it compares.
    it('closes the form an answer was for only while that opening is open as the request left it', () => {
        // In flight and still open as it was: the answer closes it and keeps the count.
        expect(formSettled(line, line)).toEqual({ ...NO_FORM, opening: 3 });
        expect(formSettled(manual, manual)).toEqual({ ...NO_FORM, opening: 3 });
        expect(formSettled(adding, adding)).toEqual({ ...NO_FORM, opening: 3 });
        // Superseded: another form opened, another bookmark's form, or more typed into the line.
        expect(formSettled({ ...NO_FORM, form: 'workspace' }, line)).toBeNull();
        expect(formSettled({ ...manual, editing: 'the guide' }, manual)).toBeNull();
        expect(formSettled(manual, adding)).toBeNull();
        expect(formSettled({ ...line, typed: '/tmp/ab' }, line)).toBeNull();
        // Superseded by the same form closed and opened again, even with the same line typed.
        expect(formSettled({ ...line, opening: 5 }, line)).toBeNull();
        expect(formSettled({ ...adding, opening: 5 }, adding)).toBeNull();
        // After close: a closed tab's record is gone, which reads as no form at all.
        expect(formSettled(filesViewOf(undefined), line)).toBeNull();
        expect(formSettled(NO_FORM, NO_FORM)).toBeNull();
    });

    // Revert: in editedGone of state/sources/fs.ts, drop the check that the list is read without an
    // error, or answer for the form that adds as well.
    it('finds the edit form whose bookmark the loaded file no longer holds', () => {
        const loaded = { entries: [{ id: 'the manual' }], loading: false, error: '' };
        expect(editedGone(manual, loaded, false)).toBe(false);
        expect(editedGone({ ...manual, editing: 'the guide' }, loaded, false)).toBe(true);
        expect(
            editedGone({ ...manual, editing: 'the guide' }, { ...loaded, entries: [] }, false)
        ).toBe(true);
        // Not read yet, or read with an error: nothing is known to be gone.
        expect(editedGone({ ...manual, editing: 'x' }, { ...loaded, loading: true }, false)).toBe(
            false
        );
        expect(
            editedGone({ ...manual, editing: 'x' }, { ...loaded, error: 'refused' }, false)
        ).toBe(false);
        // The add form, another form and no form edit nothing.
        expect(editedGone(adding, { ...loaded, entries: [] }, false)).toBe(false);
        expect(editedGone(line, loaded, false)).toBe(false);
        expect(editedGone(NO_FORM, loaded, false)).toBe(false);
    });

    // Revert: in editedGone of state/sources/fs.ts, drop `saving` from the line that answers false.
    it('leaves the form a save of its own is out from until that answer lands', () => {
        const loaded = { entries: [{ id: 'the manual renamed' }], loading: false, error: '' };
        // The bookmark the form was opened over is gone, taken away or written under another id.
        expect(editedGone(manual, loaded, true)).toBe(false);
        expect(editedGone(manual, loaded, false)).toBe(true);
    });
});

describe('a typed root or workspace line of another view', () => {
    // Revert: answer true from filesLineTyped without checking the view is `files`.
    it('asks nothing of an instance of another view', () => {
        expect(filesLineTyped('tasks', { form: 'root', typed: '/tmp/a' })).toBe(false);
        expect(filesLineTyped(undefined, { form: 'root', typed: '/tmp/a' })).toBe(false);
    });
});

// Tagged slow because its hook reads the shipped configuration cold, which takes about 120 ms.
describe('a typed root or workspace line as unsaved text', { tags: ['slow'] }, () => {
    let client: ClientState;

    beforeAll(() => {
        setCatalog(textCatalog(loadConfig(engineDir()).config));
    });

    beforeEach(() => {
        client = createClientState();
        client.layout.loadLayout(fakeStorage());
    });

    // Revert: drop the Files registerUnsaved line from state/client/context.ts, or pass it the view
    // of every instance as 'files'.
    it("reaches the tab close through the client's unsaved question, by the instance's own view", () => {
        const files = client.layout.openView('files');
        const tasks = client.layout.openView('tasks');
        client.ui.setInstanceState(files, { form: 'root', typed: '/tmp/a' });
        client.ui.setInstanceState(tasks, { form: 'root', typed: '/tmp/a' });
        expect(client.ui.unsaved(files)).toBe(true);
        expect(client.ui.unsaved(tasks)).toBe(false);
        expect(client.ui.unsaved('no-such-instance')).toBe(false);
        client.ui.setInstanceState(files, { form: 'root', typed: '' });
        expect(client.ui.unsaved(files)).toBe(false);
    });
});

describe('the workspaces to pick among', () => {
    // Revert: leave the unnamed entry out, or keep a saved workspace with an empty name.
    it('puts the configured roots first and every named workspace after them', () => {
        expect(workspaceChoices(['lab', '', 'teaching'])).toEqual(['', 'lab', 'teaching']);
        expect(workspaceChoices([])).toEqual(['']);
    });
});
