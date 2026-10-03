// Layer 3, view partial of tree/Tree.svelte. What a press on a row of the Files tree does: a plain
// press moves the cursor and opens or closes a folder or opens a file, Cmd (Ctrl off macOS) toggles
// the row in the selection and Shift selects the range from the anchor. A press that landed on one
// segment of a compacted folder chain acts on that segment's folder alone.

import type { RowRef, TreeRow } from '$lib/state/sources/fs';
import { rowAt, selectRange, selectToggled } from '$lib/state/sources/explorer/acts/selection';
import type { ViewAccess } from './view-access';

export type PressDeps = {
    view: Pick<ViewAccess, 'picked' | 'select'>;
    /** Whether Cmd, not Ctrl, is the key that toggles a row in the selection. */
    mac: boolean;
    drawn: () => TreeRow[];
    /** A plain press moved the cursor to a row. */
    onselect: (row: RowRef) => void;
    ontoggle: (row: TreeRow) => void;
    /** Open one file as the pane's preview tab. */
    onopen: (row: TreeRow, preview: boolean) => void;
    /** The `..` row of a rooted tab was pressed. */
    onup?: (to: RowRef) => void;
};

/** What a press landed on: a segment of a folder chain, and the twistie. */
export type PressHit = { segment: string | null; twisty: boolean };

/** The modifiers of a press. */
export type PressEvent = Pick<MouseEvent, 'metaKey' | 'ctrlKey' | 'shiftKey'>;

/** The press handler of the tree. */
export function createPressed(
    deps: PressDeps
): (row: TreeRow, event: PressEvent, hit: PressHit) => void {
    return function pressed(row: TreeRow, event: PressEvent, hit: PressHit): void {
        const here =
            hit.segment === null
                ? row
                : (rowAt([row], { root: row.root, path: hit.segment }) ?? row);
        const ref = { root: here.root, path: here.path };
        if (deps.mac ? event.metaKey : event.ctrlKey) {
            deps.view.select(selectToggled(deps.view.picked(), ref));
            return;
        }
        if (event.shiftKey) {
            deps.view.select(selectRange(deps.view.picked(), deps.drawn(), ref));
            return;
        }
        deps.onselect(here);
        if (row.up === true) deps.onup?.({ root: row.root, path: row.path });
        else if (row.kind === 'dir' || (hit.twisty && row.nests === true)) deps.ontoggle(row);
        else deps.onopen(row, true);
    };
}
