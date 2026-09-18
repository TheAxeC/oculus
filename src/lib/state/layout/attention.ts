// Layer 2, client state. What the reader last acted in, which is what an operation naming no page
// and no pane means: the instance each page was left on, the page of the pane last pressed, and the
// pane the last openBeside made.
//
// None of it is saved. A reload opens a view in the first pane, which is where an arrangement with
// one pane puts it anyway, and nothing about the arrangement itself is lost; keeping it out of the
// saved envelope is also what lets two browsers hold the same arrangement and be in different
// places in it.

import { findInstance } from '../instance.ts';
import type { LayoutAccess } from './access.ts';
import { samePath, type Layout, type Page } from './model.ts';
import { showsPage } from './nested.ts';

/**
 * The instance the last openBeside made on a page, and the one that was being read when the pane was
 * split off, so a second view asked for beside the one being read joins the pane the first one made
 * rather than splitting again.
 */
export type Beside = { made: string; from: string | null };

export type Attention = {
    /** The instance activated last on a page. */
    active: (page?: string) => string | null;
    /** Remember which instance a page was last left on. */
    remembered: (id: string | null, page?: string) => void;
    /** The page the reader is in, which is what a view opened by anything naming no page lands in. */
    touched: () => Page;
    /** The reader acted in a pane of this page. */
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
};

export function createAttention(access: LayoutAccess): Attention {
    /**
     * The instance activated last on each page, which is what makes one of its panes the active one,
     * keyed by page id so returning to a page finds the pane it was left on.
     */
    const lastActive: Record<string, string | null> = {};

    /** The page of the pane the reader last acted in, or null when none has been acted in yet. */
    let lastTouched: string | null = null;

    /** The pane the last openBeside made on each page, keyed by page id. */
    const lastBeside = new Map<string, Beside>();

    function active(page?: string): string | null {
        const held = access.at(page);
        return held === null ? null : (lastActive[held.id] ?? null);
    }

    function remembered(id: string | null, page?: string): void {
        const held = access.at(page);
        if (held !== null) lastActive[held.id] = id;
    }

    /**
     * The page the reader is in: the one shown at the pane last pressed or focused, and the page on
     * screen before any pane has been, when that pane's page is gone, or when the strip has been
     * switched since. It is what a view opened by anything that names no page lands in, so a card
     * pressed inside a shown page opens its tab on that page.
     */
    function touched(): Page {
        const current = access.currentPage();
        const held = lastTouched === null ? null : access.pageOf(lastTouched);
        if (held === null) return current;
        // A page the screen no longer draws is not where the reader is, whatever was pressed last.
        return showsPage(access.held().pages, current.id, held.id) || held.id === current.id
            ? held
            : current;
    }

    /** The reader acted in a pane of this page. It is not saved: a load starts from the strip. */
    function touchPane(page: string): void {
        if (access.pageOf(page) !== null) lastTouched = page;
    }

    function forgetTouched(): void {
        lastTouched = null;
    }

    /** Forget the pane last acted in unless it is on this page: what hid the rest hid it too. */
    function forgetTouchedOutside(page: string | undefined): void {
        const id = access.at(page)?.id;
        if (lastTouched !== null && lastTouched !== id) lastTouched = null;
    }

    function forgetPage(id: string): void {
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete -- a Map here would change the shape every reader of this record depends on
        delete lastActive[id];
        lastBeside.delete(id);
    }

    function clear(): void {
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete -- a Map here would change the shape every reader of this record depends on
        for (const id of Object.keys(lastActive)) delete lastActive[id];
        lastBeside.clear();
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

    return {
        active,
        remembered,
        touched,
        touchPane,
        forgetTouched,
        forgetTouchedOutside,
        forgetPage,
        clear,
        beside,
        rememberBeside,
        besidePath
    };
}
