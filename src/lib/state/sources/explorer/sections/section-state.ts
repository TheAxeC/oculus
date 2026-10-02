// Layer 2, client state, pure. Which sections under the Files tree are open. Bookmarks and Notes
// start open and the view keeps the ones the reader closed (`collapsed`); Open Editors, Outline
// and Timeline start closed and the view keeps the ones the reader opened (`opened`), so a fresh
// Files tab shows the tree and the two sections a reader keeps in view, and the rest are one press
// away.

import { toggleExpanded } from '../view/place.ts';

/** The sections that start closed. */
export const STARTS_CLOSED: readonly string[] = ['editors', 'outline', 'timeline'];

/** The two lists a view keeps its sections' state in. */
export type SectionState = { collapsed: string[]; opened: string[] };

/** Whether one section is open. */
export function sectionOpen(view: SectionState, id: string): boolean {
    return STARTS_CLOSED.includes(id) ? view.opened.includes(id) : !view.collapsed.includes(id);
}

/** The lists after one section is opened or closed; only the list that section belongs to moves. */
export function sectionFlipped(view: SectionState, id: string): SectionState {
    return STARTS_CLOSED.includes(id)
        ? { collapsed: view.collapsed, opened: toggleExpanded(view.opened, id) }
        : { collapsed: toggleExpanded(view.collapsed, id), opened: view.opened };
}
