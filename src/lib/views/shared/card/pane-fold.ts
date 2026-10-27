// Layer 3, view partial. The folds of the groups (ui/controls/heads/GroupHead.svelte) of every view
// and partial that keeps them in the pane's saved state and parses no state of its own for them:
// the Gallery's sections, Account setup's providers, the Views catalogue's groups, Usage's groups,
// Keys' sections, the Audit's sections, the project page's blocks and its LaTeX panel, the Person
// page's and a record page's blocks, the editor view's, Settings' groups, the session list's
// groups, the Status and Processes views' sections and the HPC view's disk quota. It reaches the
// saved state of the pane it is drawn in through the instance context
// (state/client/instance-context.ts), so a partial with no instance id of its own folds as its view
// does, and keeps the folds there under `folded` (state/shared/page/folds.ts `instanceFolded`,
// `foldedWith`). Every other key of the state is kept by a fold, and the view that owns the state
// keeps `folded` in each write of its own. A view that keeps `folded` in the state its parser reads
// (Projects, Slides, Lit Watch, the Inbox, LinkedIn, Venues, Pillars) folds through `stateFolds` of
// state/shared/page/folds.ts instead. Drawn outside any pane, every group is open and a fold writes
// nothing.

import { useState } from '$lib/state/client/use';
import { useInstance } from '$lib/state/client/instance-context';
import { foldedWith, instanceFolded } from '$lib/state/shared/page/folds';
import { withInstanceKey } from '$lib/state/workbench/layout/instance';

/** Which groups of the pane are open, and the presses that fold and unfold one. */
export type PaneFold = {
    /** Whether the group under `key` is open. */
    open: (key: string) => boolean;
    /** Fold the group under `key` while it is open, unfold it while it is folded. */
    toggle: (key: string) => void;
};

/** The folds of the pane the calling component is drawn in, read during its initialisation. */
export function usePaneFold(): PaneFold {
    const {
        ui: { instanceState, setInstanceState }
    } = useState();
    const instance = useInstance();

    /** The keys the pane's state holds folded, none outside a pane. */
    function folded(): string[] {
        const id = instance?.() ?? null;
        return id === null ? [] : instanceFolded(instanceState(id));
    }

    return {
        open: (key) => !folded().includes(key),
        toggle: (key) => {
            const id = instance?.() ?? null;
            if (id === null) return;
            const state = instanceState(id);
            const held = instanceFolded(state);
            const next = foldedWith(held, key, !held.includes(key));
            setInstanceState(id, withInstanceKey(state, 'folded', next));
        }
    };
}
