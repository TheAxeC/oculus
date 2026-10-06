// Layer 3, partial of views/sources/files/Files.svelte. What Files.svelte hands each of clangd's
// two sections: whether the section is open, how the head opens and closes it, and the file tab
// the reader looked at last on the page, or null for none.

import type { FollowTab } from '$lib/state/sources/explorer/sections/followed-tab';

export type ClangdProps = {
    open: boolean;
    ontoggle: () => void;
    tab: FollowTab | null;
};
