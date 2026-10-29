// Layer 2, client state. The operations that bring the pages of the rail buttons into the page
// list: the page of one button shown, the first button's page put on screen in place of the default
// page, the default page kept when the rail names none, the shipped floats taken into a layout
// saved without floats, and the documents a button's source lists and the views its arrangement
// shows given to its page. Each reads and writes the page list through the access object, and the
// two flags the factory holds as plain values (a browser with no saved layout that has changed
// nothing, and an envelope waiting for the shipped floats) through the functions it is given, so
// this module holds no rune and no second copy of either.

import { parseArrangement } from '../../../navigation/arrangement.ts';
import type { LayoutAccess } from '../../access.ts';
import { giveDocuments as giveDocumentsIn, type DocSource } from '../../saved/docs.ts';
import { giveViews } from '../../saved/views.ts';
import { newPage } from '../../model.ts';
import type { KeepRule } from '../../tree.ts';
import {
    adoptedPage,
    keptDefault,
    startedOn,
    withPage,
    type Builds,
    type FloatSpec
} from './pages.ts';

/** What the factory gives the rail page operations besides the access object. */
export type RailPageGrounds = {
    /** The rules a page made from the config is built by. */
    builds: Builds;
    /** The rule a pane left with no tab is kept by. */
    keepRule: KeepRule;
    /** The pane the reader was in belonged to the page left, so a view opened next lands anew. */
    forgetTouched: () => void;
    /** Show a page; an id naming none changes nothing. */
    switchPage: (id: string) => void;
    /** Whether the pages are the default a browser with no saved layout was given. */
    fresh: () => boolean;
    /** The default page stays the reader's, so the pages are the reader's. */
    settleFresh: () => void;
};

/** The operations over the rail buttons' pages. */
export type RailPages = {
    openRailPage: (key: string, label: string, raw: unknown) => boolean;
    startOnRailPage: (key: string, label: string, raw: unknown, floats: FloatSpec[]) => void;
    keepDefaultPage: (floats: FloatSpec[]) => void;
    giveDocuments: (sources: readonly DocSource[]) => void;
};

export function createRailPages(access: LayoutAccess, grounds: RailPageGrounds): RailPages {
    /**
     * The page of the rail button whose arrangement key is `key`, made current. The page that
     * carries the key is the one the reader arranged and is switched to as it is; with none, a page
     * no button has taken yet whose name is the button's label becomes the button's page, which is
     * how a page opened by name while the rail had no buttons is kept, and a workbench (a page with
     * a `folder`) is never taken; with neither, the page is made from the arrangement, named with
     * the label, and a unique view the arrangement names is moved into it from the page or float
     * holding it. An empty key, or an arrangement that does not parse when a page has to be made
     * from it, changes nothing and says so.
     */
    function openRailPage(key: string, label: string, raw: unknown): boolean {
        if (key === '') return false;
        const held = access.held();
        const found = held.pages.find((page) => page.rail === key);
        if (found !== undefined) {
            grounds.switchPage(found.id);
            return true;
        }
        const adopted = adoptedPage(held, key, label);
        if (adopted !== null) {
            grounds.forgetTouched();
            access.save(adopted);
            return true;
        }
        const next = parseArrangement(raw);
        if (next === null) return false;
        grounds.forgetTouched();
        access.save(withPage(held, newPage(label, next, key), grounds.builds));
        return true;
    }

    /**
     * The first rail page as the one page of a browser that had no saved layout: made from its
     * arrangement in place of the default page, so the reader starts on a page a button owns and
     * digit 1 shows it again, and the shipped floats made after it. A unique view named twice is
     * kept by the first place that names it. Once any change was saved the pages are the reader's
     * and stay.
     */
    function startOnRailPage(key: string, label: string, raw: unknown, shipped: FloatSpec[]): void {
        if (!grounds.fresh()) return;
        const next = key === '' ? null : parseArrangement(raw);
        if (next === null) {
            // The first entry names nothing drawable: the default page stays the reader's first.
            keepDefaultPage(shipped);
            return;
        }
        grounds.forgetTouched();
        access.save(startedOn(access.held(), newPage(label, next, key), shipped, grounds.builds));
    }

    /**
     * The default page stays the reader's first, beside the shipped floats. A unique view a shipped
     * float names is moved into the float out of the default page, which keeps an empty pane.
     */
    function keepDefaultPage(shipped: FloatSpec[]): void {
        if (!grounds.fresh()) return;
        grounds.settleFresh();
        if (shipped.length > 0) access.save(keptDefault(access.held(), shipped, grounds.builds));
    }

    /**
     * Every rail page given the documents its source lists, and the views its arrangement shows,
     * that it has not been given.
     */
    function giveDocuments(sources: readonly DocSource[]): void {
        const held = access.held();
        const next = giveViews(giveDocumentsIn(held, sources), sources);
        if (next !== held) access.save(next);
    }

    return { openRailPage, startOnRailPage, keepDefaultPage, giveDocuments };
}
