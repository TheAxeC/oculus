// The rows of an explorer tree as ui/tree/tree-keys.ts hands them to zag's tree-view machine: the
// nested collection built from the rows' parents, the rows the machine reads as expanded, the rows
// a change of its expanded value asks the caller to open or close, the row it holds the focus on,
// each row's index path in the collection, and where a key pressed on a row goes. Each case names
// the change that turns it red.
//
// What this does NOT cover: the machine's own keys (a step, a type-ahead, a focus move), which run
// only in a browser and are looked at on landing.

import { describe, expect, it } from 'vitest';
import {
    expandedOf,
    focusOf,
    indexPaths,
    keyRoute,
    toggledBy,
    treeNodes,
    type KeyRow
} from '../../../src/lib/ui/tree/tree-keys.ts';

/** A node of the collection reduced to its value and its children's, for comparing shapes. */
type Shape = { value: string; children?: Shape[] };

function shapeOf(node: { value: string; children?: unknown[] }): Shape {
    const children = node.children as { value: string; children?: unknown[] }[] | undefined;
    return children === undefined || children.length === 0
        ? { value: node.value }
        : { value: node.value, children: children.map(shapeOf) };
}

/**
 * A root open over a folder open over a file, a closed folder, a file, and a second closed root.
 */
const ROWS: KeyRow[] = [
    { id: 'hub', parent: null, open: true },
    { id: 'code', parent: 'hub', open: true },
    { id: 'run.py', parent: 'code' },
    { id: 'docs', parent: 'hub', open: false },
    { id: 'README.md', parent: 'hub' },
    { id: 'notes', parent: null, open: false }
];

describe('the collection the machine walks', () => {
    // Revert: attach every row at the top in treeNodes, whatever its parent.
    it('nests each row under its parent, in the order the rows are drawn', () => {
        const rows: KeyRow[] = [
            { id: 'a', parent: null, open: true },
            { id: 'a/b', parent: 'a', open: true },
            { id: 'a/b/c', parent: 'a/b' },
            { id: 'd', parent: null }
        ];

        expect(treeNodes(rows).children.map(shapeOf)).toEqual([
            { value: 'a', children: [{ value: 'a/b', children: [{ value: 'a/b/c' }] }] },
            { value: 'd' }
        ]);
    });

    // Revert: drop the `open === undefined` test from the children count in treeNodes.
    it('makes a row that opens a branch even with nothing under it, and a row that does not a leaf', () => {
        const nodes = treeNodes(ROWS).children;
        const docs = nodes[0].children.find((one) => one.value === 'docs');
        const readme = nodes[0].children.find((one) => one.value === 'README.md');

        expect(docs?.childrenCount).toBe(0);
        expect(readme?.childrenCount).toBeUndefined();
    });

    // Revert: look the parent up among every row rather than the rows placed before it.
    it('puts a row whose parent is not drawn before it at the top, so the order stays the drawn one', () => {
        const rows: KeyRow[] = [
            { id: 'x', parent: 'later' },
            { id: 'later', parent: null },
            { id: 'y', parent: 'gone' }
        ];

        expect(treeNodes(rows).children.map((one) => one.value)).toEqual(['x', 'later', 'y']);
    });

    // Revert: drop the `seen` test from treeNodes.
    it('draws an empty id nowhere, and a second row of one id not at all', () => {
        const rows: KeyRow[] = [
            { id: '', parent: null },
            { id: 'a', parent: null },
            { id: 'a', parent: null },
            { id: 'b', parent: '' }
        ];

        expect(treeNodes(rows).children.map((one) => one.value)).toEqual(['a', 'b']);
    });
});

describe('the rows the machine reads as expanded', () => {
    // Revert: list only the rows whose `open` is true in expandedOf.
    it('are the open rows and every row something is drawn under', () => {
        const rows: KeyRow[] = [
            { id: 'a', parent: null, open: true },
            { id: 'b', parent: null, open: false },
            { id: 'c', parent: null },
            { id: 'c/1', parent: 'c' }
        ];

        expect(expandedOf(rows)).toEqual(['a', 'c']);
    });
});

describe('what a change of the expanded value asks of the caller', () => {
    const rows: KeyRow[] = [
        { id: 'a', parent: null, open: true },
        { id: 'b', parent: null },
        { id: 'c', parent: null, open: false }
    ];

    // Revert: return only the rows added in toggledBy, not the ones taken away.
    it('toggles each row that opened or closed, once', () => {
        expect(toggledBy(rows, ['a'], ['a', 'c'])).toEqual(['c']);
        expect(toggledBy(rows, ['a', 'c'], ['c'])).toEqual(['a']);
        expect(toggledBy(rows, ['a'], ['a'])).toEqual([]);
    });

    // Revert: drop the `fixed` test from toggledBy.
    it('never toggles a row held as it is drawn', () => {
        const held = rows.map((row) => ({ ...row, fixed: true }));

        expect(toggledBy(held, ['a'], ['a', 'c'])).toEqual([]);
        expect(toggledBy(held, ['a'], [])).toEqual([]);
    });

    // Revert: drop the `open === undefined` test from toggledBy.
    it('never toggles a row that does not open, or one that is not drawn', () => {
        expect(toggledBy(rows, ['a'], ['a', 'b'])).toEqual([]);
        expect(toggledBy(rows, ['a'], ['a', 'gone'])).toEqual([]);
    });
});

describe('the row the machine holds the focus on', () => {
    // Revert: return `wanted` from focusOf whether or not it is drawn.
    it('is the row asked for while it is drawn, and none otherwise, which the machine reads as the first', () => {
        expect(focusOf(ROWS, 'docs')).toBe('docs');
        expect(focusOf(ROWS, 'gone')).toBeNull();
        expect(focusOf(ROWS, '')).toBeNull();
        expect(focusOf([], 'docs')).toBeNull();
    });
});

describe('the index path of each row', () => {
    // Revert: set each child's path to `path` rather than `here` in indexPaths.
    it("is its place among its parent's children, under its parent's own path", () => {
        const paths = indexPaths(treeNodes(ROWS));

        expect(paths.get('hub')).toEqual([0]);
        expect(paths.get('code')).toEqual([0, 0]);
        expect(paths.get('run.py')).toEqual([0, 0, 0]);
        expect(paths.get('docs')).toEqual([0, 1]);
        expect(paths.get('README.md')).toEqual([0, 2]);
        expect(paths.get('notes')).toEqual([1]);
        expect(paths.size).toBe(ROWS.length);
    });
});

describe('where a key pressed on a row goes', () => {
    const bare = { meta: false, ctrl: false };

    // Revert: return 'machine' for `a` in keyRoute.
    it('sends a lowercase a as a type-ahead letter, since the machine drops it', () => {
        expect(keyRoute('a', bare, false)).toBe('type-ahead');
        expect(keyRoute('a', bare, true)).toBe('type-ahead');
    });

    // Revert: return 'type-ahead' for every single letter in keyRoute.
    it('hands every other letter to the machine, which reads it as a type-ahead', () => {
        expect(keyRoute('A', bare, false)).toBe('machine');
        expect(keyRoute('b', bare, false)).toBe('machine');
    });

    // Revert: drop the Meta and Ctrl test from keyRoute.
    it("withholds a character with Meta or Ctrl held, so Cmd+A and Ctrl+A stay the page's", () => {
        expect(keyRoute('a', { meta: true, ctrl: false }, false)).toBe('withhold');
        expect(keyRoute('a', { meta: false, ctrl: true }, false)).toBe('withhold');
    });

    // Revert: withhold every key with Meta or Ctrl held in keyRoute, whatever its length.
    it('hands a named key with Meta or Ctrl held to the machine, so Cmd+Enter still presses a row', () => {
        expect(keyRoute('Enter', { meta: true, ctrl: false }, false)).toBe('machine');
        expect(keyRoute('ArrowDown', { meta: false, ctrl: true }, false)).toBe('machine');
    });

    // Revert: drop the `*` test from keyRoute.
    it('withholds the key that opens every sibling', () => {
        expect(keyRoute('*', bare, false)).toBe('withhold');
    });

    // Revert: return 'machine' for Space whether or not a type-ahead is running in keyRoute.
    it('withholds Space outside a type-ahead and hands it to the machine inside one', () => {
        expect(keyRoute(' ', bare, false)).toBe('withhold');
        expect(keyRoute(' ', bare, true)).toBe('machine');
    });

    // Revert: return 'withhold' as keyRoute's last line.
    it("hands the tree's own keys to the machine", () => {
        expect(keyRoute('ArrowLeft', bare, false)).toBe('machine');
        expect(keyRoute('Enter', bare, false)).toBe('machine');
    });
});
