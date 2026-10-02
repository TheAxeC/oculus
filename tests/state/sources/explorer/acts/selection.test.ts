// What a press or a key does to the selection of the Files tree (acts/selection.ts), and which rows
// a press acts on.
//
// What this does NOT cover: the presses themselves, which no server render fires.

import { describe, expect, it } from 'vitest';
import {
    actable,
    acting,
    rowAt,
    rowsActed,
    selectEvery,
    selectExtended,
    selectOnly,
    selectPruned,
    selectRange,
    selectToggled,
    selectionChanged,
    selectionFacts,
    type Picked
} from '../../../../../src/lib/state/sources/explorer/acts/selection.ts';
import type { FsEntry, RowRef, TreeRow } from '../../../../../src/lib/state/sources/fs.ts';

const at = (n: number): RowRef => ({ root: 'hub', path: `f${String(n)}` });
const DRAWN = [1, 2, 3, 4, 5, 6, 7].map(at);
const NONE: Picked = { selected: null, selection: [], anchor: null };
const paths = (rows: RowRef[]): string[] => rows.map((one) => one.path);

describe('selecting rows', () => {
    // Revert: replace the selection on a Cmd press instead of adding to it.
    it('selects rows 2 and 4 on Cmd+click and takes 4 out again on a second Cmd+click', () => {
        const first = selectOnly(at(2));
        const both = selectToggled(first, at(4));

        expect(paths(both.selection)).toEqual(['f2', 'f4']);
        expect(both.selected).toEqual(at(4));
        const left = selectToggled(both, at(4));
        expect(left.selection).toEqual([]);
        expect(left.selected).toEqual(at(2));
    });

    // Revert: start the range from the cursor row instead of the anchor.
    it('selects rows 4 to 6 on Shift+click on 6 from the anchor 4', () => {
        const from = selectOnly(at(4));
        const range = selectRange(from, DRAWN, at(6));

        expect(paths(range.selection)).toEqual(['f4', 'f5', 'f6']);
        expect(range.selected).toEqual(at(6));
        expect(range.anchor).toEqual(at(4));
    });

    // Revert: let the range end before the anchor drop the rows above.
    it('selects upward ranges in drawn order', () => {
        const range = selectRange(selectOnly(at(6)), DRAWN, at(4));

        expect(paths(range.selection)).toEqual(['f4', 'f5', 'f6']);
    });

    // Revert: make selectExtended move the anchor with the cursor.
    it('extends one row at a time with Shift+Down and Shift+Up, the anchor kept', () => {
        const start = selectOnly(at(3));
        const down = selectExtended(selectExtended(start, DRAWN, 1), DRAWN, 1);
        const up = selectExtended(down, DRAWN, -1);

        expect(paths(down.selection)).toEqual(['f3', 'f4', 'f5']);
        expect(paths(up.selection)).toEqual(['f3', 'f4']);
        expect(up.anchor).toEqual(at(3));
        expect(selectExtended(selectOnly(at(7)), DRAWN, 1)).toEqual(selectOnly(at(7)));
    });

    // Revert: make selectEvery take only the rows above the cursor.
    it('selects every drawn row on Cmd+A and keeps the cursor row', () => {
        const all = selectEvery(selectOnly(at(3)), DRAWN);

        expect(all.selection.length).toBe(7);
        expect(all.selected).toEqual(at(3));
        expect(all.anchor).toEqual(at(3));
    });

    // Revert: drop the `selection.some(...)` test in acting.
    it('acts on the cursor row alone once the cursor left the selection', () => {
        const picked: Picked = { selected: at(1), selection: [at(2), at(3)], anchor: at(2) };

        expect(acting(picked)).toEqual([at(1)]);
        expect(paths(acting({ ...picked, selected: at(2) }))).toEqual(['f2', 'f3']);
        expect(acting(NONE)).toEqual([]);
    });
});

describe('a refresh that drops a row', () => {
    const listing = (names: string[]): FsEntry[] =>
        names.map((name) => ({ name, kind: 'file', size: 1, mtime: 1 }));

    // Revert: skip the filter over `selection` in selectPruned.
    it('takes the dropped row out of the selection', () => {
        const picked: Picked = {
            selected: at(6),
            selection: [at(2), at(4), at(6)],
            anchor: at(2)
        };
        const after = selectPruned(picked, () => listing(['f1', 'f2', 'f3', 'f5', 'f6', 'f7']));

        expect(paths(after.selection)).toEqual(['f2', 'f6']);
        expect(selectionChanged(picked, after)).toBe(true);
    });

    // Revert: drop the `listed === null` return in selectPruned.
    it('keeps a row whose folder was never read', () => {
        const picked: Picked = { selected: at(2), selection: [at(2), at(3)], anchor: at(2) };

        expect(selectPruned(picked, () => null)).toEqual(picked);
        expect(selectionChanged(picked, picked)).toBe(false);
    });

    // Revert: keep the cursor row after it is gone.
    it('drops the cursor row and the anchor when they are gone', () => {
        const picked: Picked = { selected: at(4), selection: [], anchor: at(4) };
        const after = selectPruned(picked, () => listing(['f1']));

        expect(after).toEqual({ selected: null, selection: [], anchor: null });
    });
});

describe('the rows an action acts on', () => {
    const row = (n: number, extra: Partial<TreeRow> = {}): TreeRow => ({
        root: 'hub',
        path: `f${String(n)}`,
        name: `f${String(n)}`,
        kind: 'file',
        size: 1,
        depth: 1,
        open: false,
        ...extra
    });

    // Revert: let actable accept depth 0.
    it('leaves a root, the `..` line and a name being typed out of what an action acts on', () => {
        expect(actable(row(1))).toBe(true);
        expect(actable(row(1, { depth: 0 }))).toBe(false);
        expect(actable(row(1, { up: true }))).toBe(false);
        expect(actable(row(1, { editing: 'new' }))).toBe(false);
    });

    // Revert: make rowAt look at exact paths only.
    it('finds a segment of a compacted row as a row of that folder alone', () => {
        const chained = row(9, {
            kind: 'dir',
            path: 'a/b/c',
            name: 'c',
            chain: [
                { name: 'a', path: 'a' },
                { name: 'b', path: 'a/b' },
                { name: 'c', path: 'a/b/c' }
            ]
        });
        const segment = rowAt([chained], { root: 'hub', path: 'a/b' });

        expect(segment).toMatchObject({ path: 'a/b', name: 'b', open: true });
        expect(segment?.chain).toBeUndefined();
        expect(rowAt([chained], { root: 'hub', path: 'z' })).toBeNull();
    });

    // Revert: return the pressed row alone from rowsActed whatever is selected.
    it('acts on the whole selection when the pressed row is in it, else on the row alone', () => {
        const drawn = [row(1), row(2), row(3)];
        const picked: Picked = { selected: at(3), selection: [at(1), at(3)], anchor: at(1) };

        expect(rowsActed(picked, drawn, drawn[0]).map((one) => one.path)).toEqual(['f1', 'f3']);
        expect(rowsActed(picked, drawn, drawn[1]).map((one) => one.path)).toEqual(['f2']);
    });

    // Revert: count every row as a file in selectionFacts.
    it('counts files and folders in the selection', () => {
        const kinds: Record<string, 'file' | 'dir'> = { f1: 'dir', f2: 'file', f3: 'file' };
        const facts = selectionFacts([at(1), at(2), at(3)], (one) => kinds[one.path] ?? 'file');

        expect(facts).toEqual({ size: 3, files: 2, folders: 1 });
    });
});
