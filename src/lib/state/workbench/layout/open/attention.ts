// Layer 2, client state. What the reader last acted in, which is what an operation naming no page
// and no pane means: the instance each page was left on and the order its tabs were used in (the
// tab a session pressed on a card opens in, views/shared/card/card.ts), the page of the pane last
// pressed, the pane the last openBeside made, and the tabs of views opened for something each page
// received, whose pane the next such view lands in (layout/open/landing.ts).
//
// None of it is saved. A reload opens a view in the first pane, which is where an arrangement with
// one pane puts it anyway, and nothing about the arrangement itself is lost; keeping it out of the
// saved envelope is also what lets two browsers hold the same arrangement and be in different
// places in it.

import { findInstance } from '../instance.ts';
import type { LayoutAccess } from '../access.ts';
import { isPage, samePath, type Layout, type Page } from '../model.ts';
import { showsPage } from '../nested.ts';

/**
 * The instance the last openBeside made on a page, and the one that was being read when the pane
 * was split off, so a second view asked for beside the one being read joins the pane the first one
 * made rather than splitting again.
 */
export type Beside = { made: string; from: string | null };

/**
 * The page of the pane the reader last acted in, as one cell the caller owns. The factory hands in
 * a cell of its own so that what is drawn from where the reader is redraws when a press moves it;
 * a caller that draws nothing from it takes the cell below and never sees the difference.
 */
export type Touched = { page: string | null };

export type Attention = {
    /** The instance activated last on a page. */
    active: (page?: string) => string | null;
    /** Remember which instance a page was last left on. */
    remembered: (id: string | null, page?: string) => void;
    /** The tabs of a page that were activated and are still on it, the one activated last first. */
    used: (page?: string) => string[];
    /**
     * The page the reader is in, which is what a view opened by anything naming no page lands in.
     */
    touched: () => Page;
    /** The reader acted in a pane of this page; a float's pane changes nothing. */
    touchPane: (page: string) => void;
    /** Forget the pane last acted in, whichever page it was on. */
    forgetTouched: () => void;
    /** Forget the pane last acted in unless it is on this page. */
    forgetTouchedOutside: (page: string | undefined) => void;
    /** Forget everything held about one page, which is what closing it means here. */
    forgetPage: (id: string) => void;
    /** Forget every page, which is what a load starting from the strip means. */
    clear: () => void;
    /** What the last openBeside made on a page, or nothing when it has made none. */
    beside: (page: string) => Beside | undefined;
    /** Remember the pane an openBeside made on a page. */
    rememberBeside: (page: string, held: Beside) => void;
    /** The pane the last openBeside made, while a view asked for beside one is still beside it. */
    besidePath: (tree: Layout, page: string) => number[] | null;
    /** The tabs of views opened for something a page received, oldest first. */
    received: (page: string) => string[];
    /**
     * Remember a tab of a view opened for something a page received. The ids no longer on the
     * page's tree are let go at the same time, so the list holds what the page still shows.
     */
    rememberReceived: (page: string, id: string, tree: Layout) => void;
};

export function createAttention(access: LayoutAccess, where: Touched = { page: null }): Attention {
    /**
     * The instance activated last on each page, which is what makes one of its panes the active
     * one, keyed by page id so returning to a page finds the pane it was left on.
     */
    const lastActive: Record<string, string | null> = {};

    /** The tabs activated on each page, the one activated last first, keyed by page id. */
    const lastUsed = new Map<string, string[]>();

    /** The pane the last openBeside made on each page, keyed by page id. */
    const lastBeside = new Map<string, Beside>();

    /** The tabs of views opened for something each page received, oldest first, by page id. */
    const lastReceived = new Map<string, string[]>();

    function active(page?: string): string | null {
        const held = access.at(page);
        return held === null ? null : (lastActive[held.id] ?? null);
    }

    /**
     * Remember the instance a page was left on, and put it first among the tabs the page used; a
     * tab no longer on the page is let go at the same time.
     */
    function remembered(id: string | null, page?: string): void {
        const held = access.at(page);
        if (held === null) return;
        lastActive[held.id] = id;
        if (id === null) return;
        const tree = held.workbench.root;
        const kept = (lastUsed.get(held.id) ?? []).filter(
            (one) => one !== id && findInstance(tree, one) !== null
        );
        lastUsed.set(held.id, [id, ...kept]);
    }

    function used(page?: string): string[] {
        const held = access.at(page);
        if (held === null) return [];
        const tree = held.workbench.root;
        return (lastUsed.get(held.id) ?? []).filter((one) => findInstance(tree, one) !== null);
    }

    /**
     * The page the reader is in: the one shown at the pane last pressed or focused, and the page on
     * screen before any pane has been, when that pane's page is gone, or when the strip has been
     * switched since. It is what a view opened by anything that names no page lands in, so a card
     * pressed inside a shown page opens its tab on that page. A float is never where the reader is:
     * a press in one leaves this on the page it was on.
     */
    function touched(): Page {
        const current = access.currentPage();
        const held = where.page === null ? null : access.pageOf(where.page);
        if (held === null || !isPage(held)) return current;
        // A page the screen no longer draws is not where the reader is, whatever was pressed last.
        return showsPage(access.held().pages, current.id, held.id) || held.id === current.id
            ? held
            : current;
    }

    /**
     * The reader acted in a pane of this page. It is not saved: a load starts from the strip. A
     * press in a float's pane is not a move to another page, so it changes nothing.
     */
    function touchPane(page: string): void {
        const held = access.pageOf(page);
        if (held !== null && isPage(held)) where.page = page;
    }

    function forgetTouched(): void {
        where.page = null;
    }

    /** Forget the pane last acted in unless it is on this page: what hid the rest hid it too. */
    function forgetTouchedOutside(page: string | undefined): void {
        const id = access.at(page)?.id;
        if (where.page !== null && where.page !== id) where.page = null;
    }

    function forgetPage(id: string): void {
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete -- a Map here would change the shape every reader of this record depends on
        delete lastActive[id];
        lastUsed.delete(id);
        lastBeside.delete(id);
        lastReceived.delete(id);
    }

    function clear(): void {
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete -- a Map here would change the shape every reader of this record depends on
        for (const id of Object.keys(lastActive)) delete lastActive[id];
        lastUsed.clear();
        lastBeside.clear();
        lastReceived.clear();
    }

    function beside(page: string): Beside | undefined {
        return lastBeside.get(page);
    }

    function rememberBeside(page: string, held: Beside): void {
        lastBeside.set(page, held);
    }

    /**
     * The pane the last openBeside made, while the instance it made is still on the page and not in
     * the pane of the instance it was opened beside: a tab dragged back into the pane being read is
     * beside nothing, so the next view asked for beside it splits again.
     */
    function besidePath(tree: Layout, page: string): number[] | null {
        const held = lastBeside.get(page);
        if (held === undefined) return null;
        const made = findInstance(tree, held.made);
        if (made === null) return null;
        const from = held.from === null ? null : findInstance(tree, held.from);
        if (from !== null && samePath(made.path, from.path)) return null;
        return made.path;
    }

    function received(page: string): string[] {
        return [...(lastReceived.get(page) ?? [])];
    }

    function rememberReceived(page: string, id: string, tree: Layout): void {
        const kept = (lastReceived.get(page) ?? []).filter(
            (held) => held !== id && findInstance(tree, held) !== null
        );
        lastReceived.set(page, [...kept, id]);
    }

    return {
        active,
        remembered,
        used,
        touched,
        touchPane,
        forgetTouched,
        forgetTouchedOutside,
        forgetPage,
        clear,
        beside,
        rememberBeside,
        besidePath,
        received,
        rememberReceived
    };
}
