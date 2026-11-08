// Layer 2, client state. Where a view opened for something lands: a project, a person, a deposit,
// a manifest edit, a hub document, a file, a source file, a diff, a merge, a note, a customization
// file, a session, which are the views registered with no catalogue group or with `opened: true`.
// A page keeps its tool views in the panes its arrangement gave them and its opened documents in a
// pane of their own, so a document opened from a card never covers the board the card is on.
//
// The rule reads the tree and six facts the caller holds: which views are opened for something,
// the tabs of that kind the page received, newest last, the pane the reader is in, the pane of the
// tool view that asked, which nothing lands in, whether the page is a workbench, a page that
// belongs to one folder, whose documents pane takes what is opened first, and the widths its panes
// have on screen, so no split leaves a pane too narrow for its text. It is a pure function apart
// from the store, so each case is checked on a tree built by hand.

import { findInstance, panes } from '../instance.ts';
import { samePath, type Layout, type Pane, type ViewId } from '../model.ts';
import { paneAt } from '../tree.ts';

/** Where an opened view goes: a tab of the pane at `path`, or a new pane to the right of it. */
export type Landing = { kind: 'pane' | 'split'; path: number[] };

/**
 * The room of a page's panes on screen: whether the pane at a path can be split and leave both
 * halves at least as wide as a pane keeps, and the pane's width in px, infinite while it is not
 * measured.
 */
export type PaneRoom = { fits: (path: number[]) => boolean; width: (path: number[]) => number };

/** The room of panes none of which is measured: every split fits. */
const ANY_ROOM: Readonly<PaneRoom> = Object.freeze({
    fits: () => true,
    width: () => Number.POSITIVE_INFINITY
});

/**
 * Whether a pane holds a tool view: a tab of a view with a catalogue group and no `opened: true`
 * that the page did not receive as a document. A tool view opened with the `document` option is a
 * document for the pane it landed in.
 */
export function holdsTool(
    pane: Pane,
    opened: (view: ViewId) => boolean,
    received: ReadonlySet<string>
): boolean {
    return pane.tabs.some((tab) => !opened(tab.view) && !received.has(tab.id));
}

/** Whether a pane holds a tab of a view opened for something, or one the page received. */
export function holdsOpened(
    pane: Pane,
    opened: (view: ViewId) => boolean,
    received: ReadonlySet<string>
): boolean {
    return pane.tabs.some((tab) => opened(tab.view) || received.has(tab.id));
}

/**
 * The pane an opened view lands in on a page, or the pane a new one is split off to the right of.
 * In order: on a workbench, its documents pane (the pane marked `documents`), whatever it holds;
 * the pane holding the newest tab of that kind the page received, while one of them is still on it;
 * the pane the reader is in when it already holds such tabs; an empty documents pane, then an empty
 * terminals pane; a pane holding such tabs and nothing else, which after a reload is the pane the
 * received ones were in; and else a new pane to the right of the pane the reader is in, which the
 * next one then lands in. A pane holding a tool view is taken only when the reader is in it and it
 * already holds opened tabs, so the tool panes of an arrangement never receive a document unasked.
 * A locked pane is taken by none of these steps, so with every pane locked the view goes to the new
 * pane to the right. `away` is the pane of the tool view that asked for the view (the Search view
 * asking for its Replace Preview): it is treated as locked in every step, and the new pane is split
 * off to the right of it, so the asked view opens beside the view and never covers it. A view that
 * asked from a float names no pane of the tree.
 *
 * A split that would leave a pane narrower than a pane keeps (`fits` answers no for the pane to
 * split) is not made on a page of more than one pane: the view lands as a tab of another pane than
 * the one it would have split, which is not locked and did not ask, the reader's when the reader is
 * in one of them, else the widest of them (`width`, a pane not measured counting as the widest). A
 * record pressed in a pane that names no asker is pressed in the reader's pane, so it lands in
 * another. A page of one pane, or one whose other panes are all locked, splits by the steps above.
 */
export function landingFor(
    tree: Layout,
    opened: (view: ViewId) => boolean,
    received: readonly string[],
    reader: number[],
    away: number[] | null = null,
    workbench = false,
    room: PaneRoom = ANY_ROOM
): Landing {
    const got = new Set(received);
    const taken = (path: number[]): boolean => away !== null && samePath(path, away);
    const allowed = (pane: Pane, path: number[]): boolean =>
        pane.locked !== true &&
        !taken(path) &&
        (!holdsTool(pane, opened, got) ||
            (samePath(path, reader) && holdsOpened(pane, opened, got)));
    if (workbench) {
        const marked = panes(tree).find(({ pane }) => pane.documents === true);
        if (marked !== undefined && marked.pane.locked !== true && !taken(marked.path)) {
            return { kind: 'pane', path: marked.path };
        }
    }
    for (const id of [...received].reverse()) {
        const found = findInstance(tree, id);
        if (found === null) continue;
        const pane = paneAt(tree, found.path);
        if (pane !== null && allowed(pane, found.path)) return { kind: 'pane', path: found.path };
    }
    const here = paneAt(tree, reader);
    if (here !== null && here.locked !== true && !taken(reader) && holdsOpened(here, opened, got)) {
        return { kind: 'pane', path: reader };
    }
    const all = panes(tree).filter(({ pane, path }) => pane.locked !== true && !taken(path));
    // An empty documents pane is where a document lands before an empty terminals pane, which a
    // document takes only when no other pane is empty.
    const empties = all.filter(({ pane }) => pane.tabs.length === 0);
    const empty = empties.find(({ pane }) => pane.keeps === undefined) ?? empties.at(0);
    if (empty !== undefined) return { kind: 'pane', path: empty.path };
    const documents = all.find(({ pane }) => !holdsTool(pane, opened, got));
    if (documents !== undefined) return { kind: 'pane', path: documents.path };
    const split = away ?? reader;
    const others = all.filter(({ path }) => !samePath(path, split));
    if (room.fits(split) || panes(tree).length < 2 || others.length === 0) {
        return { kind: 'split', path: split };
    }
    const read = others.find(({ path }) => samePath(path, reader));
    const widest = others.reduce((best, one) =>
        room.width(one.path) > room.width(best.path) ? one : best
    );
    return { kind: 'pane', path: (read ?? widest).path };
}
