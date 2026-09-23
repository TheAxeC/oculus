// Layer 3, shell. What the activity rail is made of apart from its markup: a bookmark with the
// state that opens it, the fades of its scrolled list, and where an arrow key takes its stop. Apart
// from the component so each can be read without a rendering.

import { nextStop } from '$lib/ui/tree/roving';

/**
 * One entry of the rail's BOOKMARKS group: a file under one of the roots of sources.yml, from the
 * reader's own bookmarks file, which the Files view edits.
 *
 * `view` is which view opens it. A page is a document of its own so that its stylesheets and
 * relative assets resolve, and anything else is the file view; which is which is a question about a
 * file name, which the state layer answers, so the page decides it and the rail is told.
 */
export type Bookmark = {
    label: string;
    root: string;
    path: string;
    view: 'document' | 'file';
};

/**
 * What openView is handed for a bookmark. It is state/client/instance.ts's, since the file browser
 * opens a bookmark as well and the same document opened from the two places is one tab; the rail
 * re-exports it under the name its own readers know it by.
 */
export { documentState } from '$lib/state/workbench/layout';

/**
 * Which edges of the rail's list have more entries past them, each drawn as a fade at that edge.
 */
export type ListFade = { above: boolean; below: boolean };

/**
 * How far past an edge the list must reach before that edge fades. A browser reports a fractional
 * scroll position at a zoom or a text scale, so a list resting at its end may be a pixel short of
 * it.
 */
const FADE_SLACK = 1;

/**
 * The fades a scrolled list draws, from the three numbers its element reports: whether anything is
 * above what is shown and whether anything is below it. A list that fits draws neither, and a list
 * at either end draws no fade at that end.
 */
export function listFade(scrollTop: number, scrollHeight: number, clientHeight: number): ListFade {
    return {
        above: scrollTop > FADE_SLACK,
        below: scrollTop + clientHeight < scrollHeight - FADE_SLACK
    };
}

/**
 * Where an arrow key takes the rail's stop, given the ring of controls in drawn order: up and down
 * move along the ring and wrap at either end, Home and End go to the first and last control. Null
 * is a key the rail does not answer, the left and right arrows among them.
 */
export function railStop(key: string, current: string, ring: readonly string[]): string | null {
    const next = nextStop(key, ring.indexOf(current), ring.length, 'column');
    return next === null ? null : ring[next];
}
