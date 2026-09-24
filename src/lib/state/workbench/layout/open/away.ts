// Layer 2, client state. Opening a view on a page without covering one instance of it: the view
// the Views catalogue opens on its own page lands in a pane other than the catalogue's, so the
// catalogue is never hidden behind the tab it opened. It is built over openView and the two moves
// a dragged tab takes, so a view opened here is the same tab it would be anywhere else. A view that
// was already a tab of the catalogue's pane is activated there by openView before it moves out, and
// the pane would then show the tab beside it, so the catalogue is made that pane's tab again.

import { activePath, findInstance, panes } from '../../../client/instance.ts';
import type { LayoutAccess } from '../access.ts';
import type { Attention } from './attention.ts';
import { samePath, type Edge, type ViewId } from '../model.ts';
import { activate, paneAt } from '../tree.ts';

export type Away = {
    /**
     * Open a view on a page in a pane that does not hold `avoid`: the pane a view lands in when it
     * is another one, else the first other pane in tree order, else a new pane beside the one that
     * holds it. The returned id names the instance, or is empty for a page there is not.
     */
    openAway: (view: ViewId, state: unknown, page: string, avoid: string) => string;
    /**
     * Open a view on a page in a new pane beside the pane holding `beside`; a view already open in
     * another pane of the page is activated where it is.
     */
    openNextTo: (view: ViewId, state: unknown, page: string, beside: string) => string;
    /** Whether the pane at a path of a page holds one instance. */
    paneHolds: (path: number[], id: string, page: string) => boolean;
};

export function createAway(
    access: LayoutAccess,
    attention: Attention,
    openView: (view: ViewId, state?: unknown, page?: string) => string,
    transfer: (id: string, path: number[], index: number, page?: string) => void,
    split: (id: string, path: number[], edge: Edge, page?: string) => void
): Away {
    /** Make `keep` the tab its pane shows again, after a view moved out of that pane. */
    function uncover(keep: string, page: string): void {
        access.change((tree) => activate(tree, keep), page);
    }

    function openNextTo(view: ViewId, state: unknown, page: string, beside: string): string {
        const own = findInstance(access.layout(page), beside);
        const open = new Set(
            panes(access.layout(page)).flatMap(({ pane }) => pane.tabs.map((tab) => tab.id))
        );
        const id = openView(view, state, page);
        if (id === '' || own === null) return id;
        // A view already open in another pane of the page is activated there and stays, as
        // openAway leaves one; a new one, or one in the pane holding `beside`, moves to a new pane
        // beside it.
        const at = findInstance(access.layout(page), id);
        if (open.has(id) && at !== null && !samePath(at.path, own.path)) return id;
        split(id, own.path, 'right', page);
        uncover(beside, page);
        return id;
    }

    function openAway(view: ViewId, state: unknown, page: string, avoid: string): string {
        if (access.at(page) === null) return '';
        const tree = access.layout(page);
        const own = findInstance(tree, avoid);
        if (own === null) return openView(view, state, page);
        const lands = activePath(tree, attention.active(page));
        const other = samePath(lands, own.path)
            ? panes(tree).find((one) => !samePath(one.path, own.path))?.path
            : lands;
        if (other === undefined) return openNextTo(view, state, page, avoid);
        const id = openView(view, state, page);
        if (id === '') return id;
        // A view already open in a third pane is activated there and stays; one that landed in the
        // avoided pane, new or already there, moves to the end of the other pane's strip.
        const now = access.layout(page);
        const at = findInstance(now, id);
        if (at !== null && samePath(at.path, own.path)) {
            transfer(id, other, paneAt(now, other)?.tabs.length ?? 0, page);
            uncover(avoid, page);
        }
        return id;
    }

    function paneHolds(path: number[], id: string, page: string): boolean {
        const found = findInstance(access.layout(page), id);
        return found !== null && samePath(found.path, path);
    }

    return { openAway, openNextTo, paneHolds };
}
