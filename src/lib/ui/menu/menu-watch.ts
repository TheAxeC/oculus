// Layer 3, primitive support. Whether a menu opened from inside a region is open, for a region
// that draws itself differently while one is: the region provides a watch, and every Menu.svelte
// rendered inside it, in its own markup or in a snippet it renders, reports its list opening and
// closing to the watch, so the region holds the count as state.
//
// It is the primitives' own context and names no store, which is what keeps `ui/` importing nothing
// of the state layer. A menu rendered where no region provides a watch reports to nothing.

import { getContext, setContext } from 'svelte';

/** The one key a region provides its watch under. */
export const MENU_WATCH = Symbol('menu watch');

/** What a menu tells the region it is rendered in: its list opened, and its list closed. */
export type MenuWatch = {
    opened: () => void;
    closed: () => void;
};

/** Provide a region's watch to every menu it renders. */
export function provideMenuWatch(watch: MenuWatch): void {
    setContext(MENU_WATCH, watch);
}

/** The watch of the region a menu is rendered in, read while the menu initialises, or none. */
export function useMenuWatch(): MenuWatch | undefined {
    return getContext<MenuWatch | undefined>(MENU_WATCH);
}
