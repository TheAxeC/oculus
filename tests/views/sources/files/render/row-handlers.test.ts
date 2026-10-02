// Layer 3, view test. The glue each compacted or ignored row of the Files tree relies on: an
// ignored row drawn in the muted colour, Left on a compacted row closing it whole, the type-ahead
// reading its last segment, and a press on one of its segments acting on that segment's folder.
//
// The row is rendered on the server where it is drawn; the key and press handlers are called
// directly (views/sources/files/tree/control/pressing.ts and row-index.ts, ui/tree/tree-keys.ts),
// as they are what the tree's events are handed to. What this does NOT cover: the keydown the
// browser hands to the tree's machine (the machine's own Left and type-ahead, which these cases
// feed the rows and labels it reads) and the pointer event that carries a press.

import { getByTypeahead } from '@zag-js/dom-query';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'svelte/server';
import FileRow from '../../../../../src/lib/views/sources/files/tree/FileRow.svelte';
import { createPressed } from '../../../../../src/lib/views/sources/files/tree/control/pressing.ts';
import { rowIndexOf } from '../../../../../src/lib/views/sources/files/tree/control/row-index.ts';
import {
    rowKey,
    treeKeyRows,
    treeRows,
    type FsEntry,
    type FsRoot,
    type TreeRow
} from '../../../../../src/lib/state/sources/fs.ts';
import type { Picked } from '../../../../../src/lib/state/sources/explorer/acts/selection.ts';
import { expandedOf, toggledBy, type TreeNav } from '../../../../../src/lib/ui/tree/tree-keys.ts';
import { noop, dir, file } from '../../../../fixtures/doubles.ts';
import { clientContext, createClientState } from '../../../../fixtures/client.ts';
import { installRealText } from '../../../shared/real-text.ts';

installRealText();

const context = clientContext(createClientState());

const ROOTS: FsRoot[] = [{ key: 'hub', dir: '/r/hub', fixed: true }];

/** `a` holds `b`, which holds `c`, which holds a file; `z.txt` and `cat.txt` sit beside `a`. */
const TABLE: Record<string, FsEntry[]> = {
    'hub:': [dir('a'), file('cat.txt'), file('z.txt')],
    'hub:a': [dir('b')],
    'hub:a/b': [dir('c')],
    'hub:a/b/c': [file('leaf.txt')]
};
const entriesOf = (root: string, path: string): FsEntry[] => TABLE[`${root}:${path}`] ?? [];
const held = (root: string, path: string): FsEntry[] | null => TABLE[`${root}:${path}`] ?? null;

/** The rows of the tree with the root and the chain open, as the view draws them. */
function drawn(): TreeRow[] {
    return treeRows(ROOTS, entriesOf, ['hub:', 'hub:a/b/c'], null, null, { held });
}

const nav: TreeNav = {
    row: (id) => ({ role: 'treeitem', tabindex: id === 'hub:x' ? 0 : -1 }),
    list: () => noop,
    focus: noop,
    kept: () => []
};

/** The opening tag of the row element. */
function itemTag(body: string): string {
    const at = body.indexOf('class="item');
    return body.slice(body.lastIndexOf('<', at), body.indexOf('>', at) + 1);
}

describe('an ignored row', () => {
    const row = (over: Partial<TreeRow>): TreeRow => ({
        root: 'hub',
        path: 'node_modules',
        name: 'node_modules',
        kind: 'dir',
        size: 0,
        depth: 1,
        open: false,
        ...over
    });
    const propsOf = (over: Partial<TreeRow>) => ({
        row: row(over),
        nav,
        selected: false,
        marked: false,
        decoration: null,
        onpress: noop,
        onkeep: noop,
        onbookmark: noop
    });

    // Revert: take `tone={row.ignored === true ? 'muted' : undefined}` out of FileRow.svelte.
    it('is drawn in the muted colour, and a row that is not ignored is not', () => {
        const ignored = render(FileRow, { context, props: propsOf({ ignored: true }) }).body;
        const plain = render(FileRow, { context, props: propsOf({}) }).body;

        expect(itemTag(ignored)).toContain('muted');
        // a row git does not ignore keeps the ink colour
        expect(itemTag(plain)).not.toContain('muted');
    });
});

describe('a compacted row', () => {
    const chain = (): TreeRow => {
        const found = drawn().find((one) => one.chain !== undefined);
        if (found === undefined) throw new Error('the table draws no compacted row');
        return found;
    };

    // Revert: key a compacted row under the folder above its last folder in treeKeyRows.
    it('audits that Left on it closes it whole, as one row under the folder above its first', () => {
        const rows = drawn();
        const keys = treeKeyRows(rows, false);
        const id = rowKey(chain());
        const before = expandedOf(keys);

        expect(chain().chain?.map((one) => one.name)).toEqual(['a', 'b', 'c']);
        expect(keys.find((one) => one.id === id)).toMatchObject({ parent: 'hub:', open: true });
        // Left on the open row asks the machine to close it, which the tree hands on as one toggle
        expect(
            toggledBy(
                keys,
                before,
                before.filter((one) => one !== id)
            )
        ).toEqual([id]);
        expect(rowIndexOf(rows).rowOf(id)?.path).toBe('a/b/c');
    });

    // Revert: let the type-ahead read the row's first segment, or the whole chain, as its label.
    it('audits that the type-ahead reads its last segment', () => {
        const rows = drawn();
        const index = rowIndexOf(rows);
        const texts = treeKeyRows(rows, false).map((one) => ({
            id: one.id,
            textContent: index.labelOf(one.id) ?? ''
        }));

        expect(index.labelOf(rowKey(chain()))).toBe('c');
        // `c` finds the chain; its first segment `a` and the sibling `cat.txt` do not answer to it
        const state = { keysSoFar: '', timer: -1 };
        const found = getByTypeahead(texts, { state, activeId: 'hub:', key: 'c' });
        expect(found?.id).toBe(rowKey(chain()));
    });
});

describe('a press on a segment of a compacted row', () => {
    const calls = {
        selected: vi.fn(),
        toggled: vi.fn(),
        opened: vi.fn(),
        chosen: vi.fn()
    };
    const press = (meta = false, shift = false) => {
        let picked: Picked = { selected: null, selection: [], anchor: null };
        const pressed = createPressed({
            view: {
                picked: () => picked,
                select: (next) => {
                    picked = { ...picked, ...next };
                    calls.chosen(next);
                }
            },
            mac: true,
            drawn: () => drawn(),
            onselect: calls.selected,
            ontoggle: calls.toggled,
            onopen: calls.opened
        });
        const chain = drawn().find((one) => one.chain !== undefined);
        if (chain === undefined) throw new Error('the table draws no compacted row');
        return (segment: string | null) =>
            pressed(
                chain,
                { metaKey: meta, ctrlKey: false, shiftKey: shift },
                { segment, twisty: false }
            );
    };

    // Revert: ignore the segment in createPressed and act on the row.
    it('audits that selects the segment middle folder and opens or closes the row', () => {
        Object.values(calls).forEach((one) => one.mockClear());
        press()('a/b');

        expect(calls.selected).toHaveBeenCalledWith(
            expect.objectContaining({ root: 'hub', path: 'a/b', name: 'b' })
        );
        expect(calls.toggled).toHaveBeenCalledWith(
            expect.objectContaining({ path: 'a/b/c', name: 'c' })
        );
        expect(calls.opened).not.toHaveBeenCalled();
    });

    // Revert: toggle the row in the selection, not the segment.
    it('audits that Cmd toggles the segment folder in the selection and opens nothing', () => {
        Object.values(calls).forEach((one) => one.mockClear());
        press(true)('a/b');

        expect(calls.chosen).toHaveBeenCalledWith(
            expect.objectContaining({ selected: { root: 'hub', path: 'a/b' } })
        );
        expect(calls.selected).not.toHaveBeenCalled();
        expect(calls.toggled).not.toHaveBeenCalled();
    });
});
