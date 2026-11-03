// Layer 3, shared view partial. The selection of the change rows of one tree, which the
// Repositories view and a session's Changes section both hold through this one piece: a press with
// Cmd (Ctrl off macOS) or Shift held, Shift+Up and Shift+Down from the row the focus is on, Cmd+A
// over every change row drawn, and Cmd+Enter (Ctrl+Enter off macOS), which opens the row to the
// side. The rules are picking.ts's beside it; this holds the cursor row and the row a range grows
// from, and hands the selected ids to the caller, who keeps them in its tab's state.
//
// The selection the rows draw is the ids the caller keeps that are still drawn, each once: a row
// staged away or gone leaves it, and an id kept twice selects its row once.

import type { Chord, KeyRow, TreeNav } from '$lib/ui/tree/tree-keys';
import { filesKeymap } from '$lib/state/sources/explorer/acts/keys';
import { onMac } from '$lib/ui/controls/editor/kit/load';
import { drawnChanges, everything, extended, idOfRef, pressed, refOf, type Pick } from './picking';

export type ChangePicksOptions = {
    /** The rows of the tree as its keyboard reads them, the change rows among them. */
    rows: () => readonly KeyRow[];
    /** The ids of the change rows the caller keeps selected. */
    picked: () => readonly string[];
    /** The selection changed to these rows. */
    onpicked: (ids: string[]) => void;
    /** Open a change row to the side, by its group and its path. */
    openSide: (group: string, path: string) => void;
};

/** What a tree of change rows takes from its selection. */
export type ChangePicks = {
    /** The keys of the change rows: the two Shift keys of the selection and Open to the Side. */
    keymap: readonly Chord[];
    /** The selected rows that are still drawn, each once. */
    readonly live: string[];
    /** A press on a change row; true when it only changed the selection, so the row stays shut. */
    pressed: (id: string, event: MouseEvent) => boolean;
    /** A key of the change rows: Cmd+A, Shift+Up, Shift+Down and Cmd+Enter; false for another. */
    keyed: (action: string, id: string) => boolean;
    /** Keep the tree's focus control, so a Shift key moves the focus, and hand it on. */
    keep: (nav: TreeNav) => TreeNav;
};

export function createChangePicks(options: ChangePicksOptions): ChangePicks {
    const keymap = filesKeymap(onMac()).filter(
        (one) =>
            one.action === 'extend-up' || one.action === 'extend-down' || one.action === 'open-side'
    );
    /** The change rows drawn now, in the order they are drawn. */
    const drawn = $derived(drawnChanges(options.rows().map((row) => row.id)));
    const live = $derived.by(() => {
        const ids = new Set(drawn.map(idOfRef));
        return [...new Set(options.picked())].filter((id) => ids.has(id));
    });
    /** The row the last press or key was on, and the row a range grows from. */
    let cursor = $state('');
    let anchor = $state('');
    let treeNav: TreeNav | undefined;

    function take(next: Pick, at: string): void {
        anchor = next.anchor;
        cursor = at;
        options.onpicked(next.picked);
    }

    return {
        keymap,
        get live() {
            return live;
        },
        pressed: (id, event) => {
            const kind = event.shiftKey
                ? 'range'
                : event.metaKey || event.ctrlKey
                  ? 'toggle'
                  : 'plain';
            take(pressed({ picked: live, anchor }, cursor, drawn, id, kind), id);
            return kind !== 'plain';
        },
        keyed: (action, id) => {
            const row = refOf(id);
            if (row === null) return false;
            const now = { picked: live, anchor };
            if (action === 'select-all') take(everything(now, id, drawn), id);
            else if (action === 'extend-up' || action === 'extend-down') {
                const next = extended(now, id, drawn, action === 'extend-up' ? -1 : 1);
                take(next.pick, next.cursor);
                treeNav?.focus(next.cursor);
            } else if (action === 'open-side') {
                options.openSide(row.root, row.path);
            } else return false;
            return true;
        },
        keep: (nav) => {
            treeNav = nav;
            return nav;
        }
    };
}
