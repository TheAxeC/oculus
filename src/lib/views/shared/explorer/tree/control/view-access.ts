// Layer 3, view partial of tree/Tree.svelte. What one explorer tree remembers (the record of its
// owner: a Files tab's instance state, or the record of a project card) as the tree reads and
// writes it: the state now, a part of it written, the selection as the selection folds take it, and
// a selection written back.

import type { ClientState } from '$lib/state/client/context';
import { filesViewOf, patchedFilesView, type FilesView } from '$lib/state/sources/fs';
import type { Picked } from '$lib/state/sources/explorer/acts/selection';

export type ViewAccess = {
    /** What the tab remembers now. */
    now: () => FilesView;
    /** Write part of it, and nothing when the tab has been closed. */
    patch: (part: Partial<FilesView>) => void;
    /** The selection as the tree holds it now. */
    picked: () => Picked;
    /** Write a selection back, clearing the outcome line of a reveal. */
    select: (next: Picked) => void;
};

/** The reads and writes of the instance state the instance `owner` names holds for its tab. */
export function viewAccess(client: ClientState, owner: () => string): ViewAccess {
    const now = (): FilesView => filesViewOf(client.ui.instanceState(owner()));
    const patch = (part: Partial<FilesView>): void => {
        if (client.ui.instanceState(owner()) === undefined) return;
        client.ui.setInstanceState(
            owner(),
            patchedFilesView(client.ui.instanceState(owner()), part)
        );
    };
    const picked = (): Picked => {
        const held = now();
        return { selected: held.selected, selection: held.selection, anchor: held.anchor };
    };
    const select = (next: Picked): void => patch({ ...next, revealed: null });
    return { now, patch, picked, select };
}
