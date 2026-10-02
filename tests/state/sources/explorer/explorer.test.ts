// The explorer over the file browser's rows, the pure half in state/sources/fs.ts: what a filter
// leaves, the rows the keyboard reads, the label a row's star bookmarks under, what the breadcrumb
// names, what one instance keeps, and which form a press or an answer leaves open. Where a key
// moves is zag's tree-view machine over the collection ui/tree/tree-keys.ts builds from these rows,
// tests/ui/tree/tree-keys.test.ts.
//
// What this does NOT cover: the rows drawn, which are tests/views/sources/files/files.test.ts; the
// keys pressed; and the forms pressed: the bookmark and root forms kept across a switch and a
// reload, the drafts forgotten by the add control, by a row's edit moving to another bookmark and
// by the bookmark's removal, the form remounted when an edit form opens over the add form, and a
// held root or bookmark answer landing after another form, the same root form reopened or a tab
// switch; nor the close question over a typed root line.

import { beforeEach, describe, expect, it } from 'vitest';
import { engineDir, loadConfig, textCatalog } from '../../../../src/lib/data/sources/config.ts';
import {
    bookmarkLeft,
    collapseRoot,
    crumbsOf,
    editedGone,
    patchedFilesView,
    editShown,
    filesLineTyped,
    filesViewOf,
    shownOf,
    filterRows,
    formSettled,
    formShown,
    formsOf,
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

/**
 * The two toggles of a file browser nobody has flipped: the tree lists what it lists by default.
 */
const NO_TOGGLES = { hidden: false, ignored: false } as const;

/**
 * What a file browser nobody has selected in, filtered fuzzily, nested, opened a section in or
 * rooted keeps: no selection and no anchor, the fuzzy and nesting toggles off, no section opened,
 * no top, and no folder found outside the roots.
 */
const NO_VIEW = {
    selection: [],
    anchor: null,
    fuzzy: false,
    nesting: false,
    opened: [],
    top: null,
    outside: ''
} as const;

/**
 * The asks to show a path of a file browser nothing has asked. Revert: in filesViewOf of
 * state/sources/fs.ts, leave `reveal`, `revealed` or `revealing` out of the record it returns.
 */
const NO_REVEAL = { reveal: null, revealed: null, revealing: 0 } as const;

/** The name being typed of a file browser nobody is typing one in. */
const NO_NAMING = { naming: null } as const;

/** The refusal and outcome lines of a file browser nothing has answered. */
const NO_LINES = { note: '', said: '' } as const;

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

    // Revert: pass `fixed: false` whatever `filtering` says in treeKeyRows.
    it('marks every row fixed while a filter draws them, so no key opens or closes a folder', () => {
        expect(treeKeyRows(rows, true).every((row) => row.fixed === true)).toBe(true);
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

    it('reads the two toggles an instance keeps, and false for anything that is not true', () => {
        expect(filesViewOf({ hidden: true, ignored: true })).toMatchObject({
            hidden: true,
            ignored: true
        });
        expect(filesViewOf({ hidden: 'yes', ignored: 1 })).toMatchObject(NO_TOGGLES);
        expect(shownOf(filesViewOf({ hidden: true, filter: 'x' }))).toEqual({
            hidden: true,
            ignored: false
        });
    });

    // Revert: read `selected` without checking that root and path are strings; or, for the
    // `...NO_REVEAL` expectations, default `reveal` or `revealed` to anything but null or
    // `revealing` to anything but 0 in filesViewShape (askShape, outcomeShape, countShape of
    // state/sources/fs.ts).
    it('reads what the instance keeps, and a default for anything it cannot read', () => {
        expect(
            filesViewOf({
                expanded: ['hub:'],
                selected: { root: 'hub', path: 'code' },
                filter: 'run',
                collapsed: ['notes', 3],
                note: 'refused',
                said: 7
            })
        ).toEqual({
            ...NO_FORM,
            ...NO_REVEAL,
            ...NO_NAMING,
            ...NO_TOGGLES,
            ...NO_VIEW,
            expanded: ['hub:'],
            selected: { root: 'hub', path: 'code' },
            filter: 'run',
            collapsed: ['notes'],
            note: 'refused',
            said: ''
        });
        const empty = {
            ...NO_FORM,
            ...NO_REVEAL,
            ...NO_NAMING,
            ...NO_LINES,
            ...NO_TOGGLES,
            ...NO_VIEW,
            expanded: [],
            selected: null,
            filter: '',
            collapsed: []
        };
        expect(filesViewOf(null)).toEqual(empty);
        expect(filesViewOf({ selected: { root: 'hub' }, filter: 4 })).toEqual(empty);
        expect(filesViewOf({ selected: { root: '', path: '' } })).toEqual(empty);
        expect(filesViewOf(['hub:'])).toEqual(empty);
    });

    // Revert: in filesViewOf of state/sources/fs.ts, read `editing` and `typed` whatever form is
    // open, take `form` as any string, or `opening` as any number.
    it('reads the open form, the bookmark it edits, the typed line and the opening, each only where it belongs', () => {
        const forms = (state: unknown): unknown => formsOf(filesViewOf(state));
        expect(forms({ form: 'bookmark', editing: 'the manual', opening: 4 })).toEqual({
            form: 'bookmark',
            editing: 'the manual',
            typed: '',
            opening: 4
        });
        expect(forms({ form: 'root', typed: '/tmp/a' })).toEqual({
            ...NO_FORM,
            form: 'root',
            typed: '/tmp/a'
        });
        expect(forms({ form: 'workspace', typed: 'lab' })).toEqual({
            ...NO_FORM,
            form: 'workspace',
            typed: 'lab'
        });
        // Empty: no form, and an empty bookmark id is the form that adds.
        expect(forms({})).toEqual(NO_FORM);
        expect(forms({ form: 'bookmark', editing: '' })).toEqual({ ...NO_FORM, form: 'bookmark' });
        // A name that is no form, a field of the wrong type, and a field of a form that is not
        // open.
        expect(forms({ form: 'note', editing: 'x', typed: 'y' })).toEqual(NO_FORM);
        expect(forms({ form: 'expanded' })).toEqual(NO_FORM);
        expect(forms({ form: 'bookmark', editing: 3, typed: 'left over' })).toEqual({
            ...NO_FORM,
            form: 'bookmark'
        });
        expect(forms({ form: 'root', editing: 'the manual', typed: ['a'] })).toEqual({
            ...NO_FORM,
            form: 'root'
        });
        expect(forms({ editing: 'the manual', typed: '/tmp/a' })).toEqual(NO_FORM);
        // An opening count that is not a whole number at or above zero is no count.
        for (const opening of [-1, 1.5, '2', Number.NaN, Number.MAX_VALUE, null]) {
            expect(forms({ opening })).toEqual(NO_FORM);
        }
        expect(forms({ opening: 7 })).toEqual({ ...NO_FORM, opening: 7 });
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

    // Revert: in patchedFilesView of state/sources/fs.ts, write the part over nothing.
    it('writes part of a file browser over whatever else its record holds', () => {
        expect(patchedFilesView({ filter: 'x', form: 'root' }, { form: 'bookmark' })).toEqual({
            filter: 'x',
            form: 'bookmark'
        });
        // A record that is not a map is read as an empty one, so the part is all there is.
        expect(patchedFilesView(undefined, { editing: 'one' })).toEqual({ editing: 'one' });
        expect(patchedFilesView(['a list'], { editing: 'one' })).toEqual({ editing: 'one' });
        expect(patchedFilesView('a word', { editing: 'one' })).toEqual({ editing: 'one' });
    });

    // Revert: in editedGone of state/sources/fs.ts, drop `saving` from the line that answers false.
    it('leaves the form a save of its own is out from until that answer lands', () => {
        const loaded = { entries: [{ id: 'the manual renamed' }], loading: false, error: '' };
        // The bookmark the form was opened over is gone, taken away or written under another id.
        expect(editedGone(manual, loaded, true)).toBe(false);
        expect(editedGone(manual, loaded, false)).toBe(true);
    });
});

describe('a typed root or workspace line as unsaved text', () => {
    let client: ClientState;

    beforeEach(() => {
        setCatalog(textCatalog(loadConfig(engineDir()).config));
        client = createClientState();
        client.layout.loadLayout(fakeStorage());
    });

    // Revert: answer true from filesLineTyped without checking the view is `files`.
    it('is asked about for a file browser whose line form holds text, and for nothing else', () => {
        expect(filesLineTyped('files', { form: 'root', typed: '/tmp/a' })).toBe(true);
        expect(filesLineTyped('files', { form: 'workspace', typed: 'lab' })).toBe(true);
        expect(filesLineTyped('files', { form: 'root', typed: '' })).toBe(false);
        // Revert: count a line of spaces, which the add takes as nothing, as typed text.
        expect(filesLineTyped('files', { form: 'root', typed: '   ' })).toBe(false);
        expect(filesLineTyped('files', { form: '', typed: '/tmp/a' })).toBe(false);
        expect(filesLineTyped('files', { form: 'bookmark', typed: '/tmp/a' })).toBe(false);
        expect(filesLineTyped('tasks', { form: 'root', typed: '/tmp/a' })).toBe(false);
        expect(filesLineTyped(undefined, { form: 'root', typed: '/tmp/a' })).toBe(false);
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
