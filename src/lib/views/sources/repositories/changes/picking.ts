// Layer 3, view partial of views/sources/repositories/changes/Changes.svelte. The selection of the
// change rows: a press, Cmd+press, Shift+press, Shift+Up, Shift+Down and Cmd+A over the rows the
// tree draws, which is the file browser's rule (state/sources/explorer/acts/selection.ts) with the
// group a row is in as its `root` and the path as its `path`, so a staged and a changed row of one
// path are two rows. The view keeps the ids of the selected rows (`change:<group>:<path>`, the
// ids the tree knows the rows by); the cursor row and the row a range grows from are the rows the
// last press or key was on.

import {
    selectEvery,
    selectExtended,
    selectOnly,
    selectRange,
    selectToggled,
    type Picked
} from '$lib/state/sources/explorer/acts/selection';
import type { RowRef } from '$lib/state/sources/explorer/view/place';

const PREFIX = 'change:';

/** The row of a change row's id, the group in the root slot; null for an id that is no change. */
export function refOf(id: string): RowRef | null {
    if (!id.startsWith(PREFIX)) return null;
    const rest = id.slice(PREFIX.length);
    const at = rest.indexOf(':');
    return at < 0 ? null : { root: rest.slice(0, at), path: rest.slice(at + 1) };
}

/** The id of a change row. */
export function idOfRef(row: RowRef): string {
    return `${PREFIX}${row.root}:${row.path}`;
}

/** The change rows among the ids of the rows drawn, in the order they are drawn. */
export function drawnChanges(ids: readonly string[]): RowRef[] {
    return ids.flatMap((id) => {
        const row = refOf(id);
        return row === null ? [] : [row];
    });
}

/** What the view keeps of a selection: the selected rows, and the row a range grows from. */
export type Pick = { picked: string[]; anchor: string };

/** A kind of press on a row: a plain one, one with Cmd (Ctrl off macOS) held, or one with Shift. */
export type PressKind = 'plain' | 'toggle' | 'range';

function viewOf(state: Pick, cursor: string): Picked {
    const at = refOf(cursor);
    const anchor = refOf(state.anchor);
    const selection = state.picked.flatMap((id) => {
        const row = refOf(id);
        return row === null ? [] : [row];
    });
    return { selected: at, selection: selection.length > 1 ? selection : [], anchor };
}

function stateOf(next: Picked): Pick {
    return {
        picked: next.selection.map(idOfRef),
        anchor: next.anchor === null ? '' : idOfRef(next.anchor)
    };
}

/** The selection after a press on a row, the cursor being the row the last press or key was on. */
export function pressed(
    state: Pick,
    cursor: string,
    drawn: RowRef[],
    id: string,
    kind: PressKind
): Pick {
    const row = refOf(id);
    if (row === null) return state;
    const view = viewOf(state, cursor);
    if (kind === 'toggle') return stateOf(selectToggled(view, row));
    if (kind === 'range') return stateOf(selectRange(view, drawn, row));
    return stateOf(selectOnly(row));
}

/**
 * The selection after Shift+Down (`1`) or Shift+Up (`-1`) on the cursor row, and the new cursor.
 */
export function extended(
    state: Pick,
    cursor: string,
    drawn: RowRef[],
    step: 1 | -1
): { pick: Pick; cursor: string } {
    const next = selectExtended(viewOf(state, cursor), drawn, step);
    return {
        pick: stateOf(next),
        cursor: next.selected === null ? cursor : idOfRef(next.selected)
    };
}

/** The selection after Cmd+A: every change row drawn. */
export function everything(state: Pick, cursor: string, drawn: RowRef[]): Pick {
    return stateOf(selectEvery(viewOf(state, cursor), drawn));
}

/**
 * The paths a control on a row acts on: the selected rows of the row's group when the row is among
 * several selected, else the row's own path.
 */
export function actedPaths(picked: readonly string[], id: string): string[] {
    const row = refOf(id);
    if (row === null) return [];
    if (picked.length > 1 && picked.includes(id)) {
        return picked.flatMap((one) => {
            const other = refOf(one);
            return other !== null && other.root === row.root ? [other.path] : [];
        });
    }
    return [row.path];
}
