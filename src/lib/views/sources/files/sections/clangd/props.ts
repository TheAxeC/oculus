// Layer 3, partial of views/sources/files/Files.svelte. What Files.svelte hands each of clangd's
// two sections: whether the section is open, how the head opens and closes it, and the file tab
// the reader looked at last on the page, or null for none.

import type { FollowTab } from '$lib/state/sources/explorer/sections/followed-tab';
import type { SectionMove } from '$lib/views/shared/explorer/sections/list-drag.svelte';

export type ClangdProps = {
    open: boolean;
    ontoggle: () => void;
    tab: FollowTab | null;
    /** What lets the head be dragged over the other sections' heads and moved by Alt+Up/Down. */
    move?: SectionMove;
};
