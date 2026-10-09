// Layer 2, client state. Opening a view on a page without covering one instance of it: the view
// the Views catalogue opens on its own page lands in a pane other than the catalogue's, so the
// catalogue is never hidden behind the tab it opened. It is built over openView and the two moves
// a dragged tab takes, so a view opened here is the same tab it would be anywhere else. A view that
// was already a tab of the catalogue's pane is activated there by openView before it moves out, and
// the pane would then show the tab beside it, so the catalogue is made that pane's tab again.
//
// A unique view that another page or a float holds is shown where it is held and never moved into
// the catalogue's page: openView answers its id and nothing here carries it over. A view dropped on
// the catalogue's own pane is the one exception, since a drop places a tab (moveAway).

import { activePath, findInstance, panes } from '../instance.ts';
import type { LayoutAccess } from '../access.ts';
import type { Attention } from './attention.ts';
import { samePath, type Edge, type Layout, type ViewId } from '../model.ts';
import type { UniqueRule } from './float/pages.ts';
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
     * another pane of the page is activated where it is, and a unique view held by another page or
     * a float is shown there.
     */
    openNextTo: (view: ViewId, state: unknown, page: string, beside: string) => string;
    /**
     * Carry an instance, wherever it is held, to the pane openAway would open a view in, or to a
     * new pane beside the one holding `avoid` when the page has no other pane. It is how a unique
     * view dropped on the catalogue's own pane is placed.
     */
    moveAway: (id: string, page: string, avoid: string) => void;
    /** Whether the pane at a path of a page holds one instance. */
    paneHolds: (path: number[], id: string, page: string) => boolean;
};

export function createAway(
    access: LayoutAccess,
    attention: Attention,
    openView: (view: ViewId, state?: unknown, page?: string) => string,
    transfer: (id: string, path: number[], index: number, page?: string) => void,
    split: (id: string, path: number[], edge: Edge, page?: string) => void,
    unique: UniqueRule
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
        // beside it. A unique view held by another page or a float was shown there and stays.
        const at = findInstance(access.layout(page), id);
        if (at === null && unique(view)) return id;
        if (open.has(id) && at !== null && !samePath(at.path, own.path)) return id;
        split(id, own.path, 'right', page);
        uncover(beside, page);
        return id;
    }

    /**
     * The pane a view opened away from the pane at `avoid` lands in: the pane a view lands in when
     * it is another one, else the first other pane in tree order, and undefined when the page has
     * no other pane.
     */
    function otherPane(tree: Layout, page: string, avoid: number[]): number[] | undefined {
        const lands = activePath(tree, attention.active(page));
        return samePath(lands, avoid)
            ? panes(tree).find((one) => !samePath(one.path, avoid))?.path
            : lands;
    }

    function openAway(view: ViewId, state: unknown, page: string, avoid: string): string {
        if (access.at(page) === null) return '';
        const tree = access.layout(page);
        const own = findInstance(tree, avoid);
        if (own === null) return openView(view, state, page);
        const other = otherPane(tree, page, own.path);
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

    function moveAway(id: string, page: string, avoid: string): void {
        const tree = access.layout(page);
        const own = findInstance(tree, avoid);
        if (own === null) return;
        const other = otherPane(tree, page, own.path);
        const was = findInstance(tree, id);
        if (other === undefined) split(id, own.path, 'right', page);
        else transfer(id, other, paneAt(tree, other)?.tabs.length ?? 0, page);
        if (was !== null && samePath(was.path, own.path)) uncover(avoid, page);
    }

    function paneHolds(path: number[], id: string, page: string): boolean {
        const found = findInstance(access.layout(page), id);
        return found !== null && samePath(found.path, path);
    }

    return { openAway, openNextTo, moveAway, paneHolds };
}
