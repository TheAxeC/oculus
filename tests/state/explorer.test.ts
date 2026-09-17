// The explorer over the file browser's rows, the pure half in state/fs.ts: what a filter leaves,
// the rows the keyboard reads, the label a row's star bookmarks under, what the breadcrumb names,
// and what one instance keeps. Where a key moves is ui/tree-keys.ts, tests/ui/tree-keys.test.ts.
//
// What this does NOT cover: the rows drawn and the keys pressed, which are tests/views/files.test.ts
// and tests/browser/files.spec.ts.

import { describe, expect, it } from 'vitest';
import {
    collapseRoot,
    crumbsOf,
    filesViewOf,
    filterRows,
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
} from '../../src/lib/state/fs.ts';

function file(name: string, size = 10): FsEntry {
    return { name, kind: 'file', size, mtime: 1 };
}

function dir(name: string): FsEntry {
    return { name, kind: 'dir', size: 0, mtime: 1 };
}

function root(key: string, fixed = true): FsRoot {
    return { key, dir: `/tmp/${key}`, fixed };
}

// Each case names the change to state/fs.ts that turns it red.
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

    // Revert: read `selected` without checking that root and path are strings.
    it('reads what the instance keeps, and a default for anything it cannot read', () => {
        expect(
            filesViewOf({
                expanded: ['hub:'],
                selected: { root: 'hub', path: 'code' },
                filter: 'run',
                collapsed: ['notes', 3]
            })
        ).toEqual({
            expanded: ['hub:'],
            selected: { root: 'hub', path: 'code' },
            filter: 'run',
            collapsed: ['notes']
        });
        const empty = { expanded: [], selected: null, filter: '', collapsed: [] };
        expect(filesViewOf(null)).toEqual(empty);
        expect(filesViewOf({ selected: { root: 'hub' }, filter: 4 })).toEqual(empty);
        expect(filesViewOf({ selected: { root: '', path: '' } })).toEqual(empty);
        expect(filesViewOf(['hub:'])).toEqual(empty);
    });
});

describe('the workspaces to pick among', () => {
    // Revert: leave the unnamed entry out, or keep a saved workspace with an empty name.
    it('puts the configured roots first and every named workspace after them', () => {
        expect(workspaceChoices(['lab', '', 'teaching'])).toEqual(['', 'lab', 'teaching']);
        expect(workspaceChoices([])).toEqual(['']);
    });
});
