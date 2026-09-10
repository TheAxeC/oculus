// Layer 2, client state. The store half of the layout: the tree the shell is rendering now, and its
// persistence. The tree itself, its types and every operation on it are state/layout.ts, which has
// no runes in it; this module is the one place a layout is reactive and the one place it is saved.
//
// Every operation reaches the store through apply(), which is also what saves, so an arrangement is
// never changed without being written down.

import { defaultLayout, parseLayout, serialiseLayout, type Layout } from './layout.ts';

/** The key the arrangement is saved under. */
export const LAYOUT_KEY = 'oculus.layout.v1';

/** What the store needs of a Storage, so a test can hand it a plain object. */
type Storable = Pick<Storage, 'getItem' | 'setItem'>;

const store: { current: Layout } = $state({ current: defaultLayout() });

/** Where apply() saves, once loadLayout has named it. Nothing is saved before that. */
let backing: Storable | null = null;

/** The current tree. */
export function layout(): Layout {
    return store.current;
}

/**
 * Read the saved arrangement and make it current, falling back to the default when there is none or
 * the saved value fails parseLayout. Returns whether a saved arrangement was restored, which is how
 * a page knows to install its own starting arrangement instead. The default argument is evaluated at
 * the call and not at the import, so a test that never calls this touches no localStorage.
 */
export function loadLayout(storage: Storable = localStorage): boolean {
    backing = storage;
    let raw: string | null = null;
    try {
        raw = storage.getItem(LAYOUT_KEY);
    } catch {
        // A browser with storage refused still runs; it just forgets the arrangement.
        raw = null;
    }
    const parsed = raw === null ? null : parseLayout(raw);
    store.current = parsed ?? defaultLayout();
    return parsed !== null;
}

/** Make a tree current and save it. */
export function apply(next: Layout): void {
    store.current = next;
    if (backing === null) return;
    try {
        backing.setItem(LAYOUT_KEY, serialiseLayout(next));
    } catch {
        // A full or refused storage loses the arrangement at the next load and nothing else: the
        // tree in memory is what the shell renders and it is already current.
    }
}
