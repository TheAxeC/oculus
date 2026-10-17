// Layer 3, view support. What the Stashes and the Tags sections of the Repositories view are handed
// by views/sources/repositories/repo/Repo.svelte: the repository, its state, the tree's keyboard,
// whether the section is open, and the view's own confirm for a write that loses work.

import type { TreeNav } from '$lib/ui/tree/tree-keys';
import type { GitState } from '$lib/state/client/selectors.svelte';

export type RefSectionProps = {
    root: string;
    git: GitState;
    nav: TreeNav;
    open: boolean;
    ontoggle: () => void;
    ask: (message: string, detail: string, act: () => void) => void;
};
