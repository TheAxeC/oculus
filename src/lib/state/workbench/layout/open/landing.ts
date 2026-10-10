// Layer 2, client state. Where a view opened for something lands: a project, a person, a deposit,
// a manifest edit, a hub document, a file, a source file, a diff, a merge, a note, a customization
// file, which are the views registered with no catalogue group. A page keeps its tool views in the
// panes its arrangement gave them and its opened documents in a pane of their own, so a document
// opened from a card never covers the board the card is on.
//
// The rule reads the tree and five facts the caller holds: which views are opened for something,
// the tabs of that kind the page received, newest last, the pane the reader is in, the pane of the
// tool view that asked, which nothing lands in, and whether the page is a workbench, a page that
// belongs to one folder, whose documents pane takes what is opened first. It is a pure function
// apart from the store, so each case is checked on a tree built by hand.

import { findInstance, panes } from '../instance.ts';
import { samePath, type Layout, type Pane, type ViewId } from '../model.ts';
import { paneAt } from '../tree.ts';

/** Where an opened view goes: a tab of the pane at `path`, or a new pane to the right of it. */
export type Landing = { kind: 'pane' | 'split'; path: number[] };

/**
 * Whether a pane holds a tool view: a tab of a view with a catalogue group that the page did not
 * receive as a document. A tool view opened with the `document` option is a document for the pane
 * it landed in.
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
 */
export function landingFor(
    tree: Layout,
    opened: (view: ViewId) => boolean,
    received: readonly string[],
    reader: number[],
    away: number[] | null = null,
    workbench = false
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
    return { kind: 'split', path: away ?? reader };
}
