// Layer 3, shell. The pane menu's page items, apart from the component so the numbering they draw,
// the pages they offer and the two choices they are gathered under can be read by a test; and the
// right-click menu of a pane's strip and of an empty pane's body, VS Code's editor group menu, with
// what each of its picks runs.

import { grouped, type MenuItem as Item } from '$lib/ui/menu/menu-items';
import {
    fold,
    showable,
    type DockEdge,
    type Edge,
    type FloatPlace,
    type Layout,
    type Page
} from '$lib/state/workbench/layout';

/** What tells a move-to-page item from the menu's fixed items. */
export const PAGE = 'page:';

/** What tells a show-a-page-here item from the menu's fixed items. */
export const EMBED = 'embed:';

/**
 * Every page but the one on screen, as the item that moves the active tab onto it. A page with
 * no name of its own is numbered by its place in the whole page list, which is the number the
 * Pages view draws for it, so the item names the page the reader sees rather than its place among
 * the others.
 */
export function pageMoveItems(
    pages: readonly Page[],
    current: string,
    t: (key: string, ...args: (string | number)[]) => string
): Item[] {
    return pages
        .map((page, at) => ({
            id: `${PAGE}${page.id}`,
            page: page.id,
            label: t(
                'ui.move_to_page',
                page.label === '' ? t('ui.page_default', at + 1) : page.label
            )
        }))
        .filter((item) => item.page !== current)
        .map(({ id, label }) => ({ id, label }));
}

/**
 * Every page that may be shown beside a pane of `host` while `screen` is the page on screen,
 * as the item that shows it there: not the page the pane is in, not a page that would then draw
 * itself, and not one already drawn somewhere on the screen. A page with no name of its own is
 * numbered by its place in the page list, as the move items number it.
 */
export function embedPageItems(
    pages: readonly Page[],
    screen: string,
    host: string,
    t: (key: string, ...args: (string | number)[]) => string
): Item[] {
    return pages
        .map((page, at) => ({
            id: `${EMBED}${page.id}`,
            page: page.id,
            label: t('ui.embed_page', page.label === '' ? t('ui.page_default', at + 1) : page.label)
        }))
        .filter((item) => showable(pages, screen, host, item.page))
        .map(({ id, label }) => ({ id, label }));
}

/** The choice that holds the move-to-page items. */
export const MOVE_LIST = 'move-to-page';

/** The choice that holds the show-a-page-here items. */
export const EMBED_LIST = 'show-a-page';

/** The choice that lists the pages a tab can move to, or nothing when there is no other page. */
function moveChoice(
    pages: readonly Page[],
    current: string,
    t: (key: string, ...args: (string | number)[]) => string
): Item[] {
    const moves = pageMoveItems(pages, current, t);
    return moves.length > 0
        ? [{ id: MOVE_LIST, label: t('ui.move_to_page_list'), items: moves }]
        : [];
}

/**
 * The pane menu's page choices: one that lists the pages the active tab can move to and one that
 * lists the pages that can be shown beside the pane, each present only when it has a page to offer.
 * The menu shows a choice's pages in place of its own list, so the menu is its fixed items and at
 * most these two however many pages the layout holds. `host` is the page the pane is in and
 * `screen` the page on screen.
 */
export function pageListItems(
    pages: readonly Page[],
    screen: string,
    host: string,
    t: (key: string, ...args: (string | number)[]) => string
): Item[] {
    const shows = embedPageItems(pages, screen, host, t);
    return [
        ...moveChoice(pages, host, t),
        ...(shows.length > 0
            ? [{ id: EMBED_LIST, label: t('ui.embed_page_list'), items: shows }]
            : [])
    ];
}

/**
 * Whether the pane at `path` can be collapsed: the root cannot, nor the last open child of a split.
 */
export function foldable(layout: Layout, path: number[]): boolean {
    return path.length > 0 && fold(layout, path) !== layout;
}

export const STRIP_OPEN_FILE = 'open-file';
export const STRIP_CLOSE = 'close';
export const STRIP_NEW_TERMINAL = 'new-terminal';

/** The item that floats a pane of a page, and the one that floats a docked float again. */
export const FLOAT_PANE = 'float';
export const FLOAT_FREE = 'float-free';

/** The item that puts a float's tabs back into the page on screen. */
export const FLOAT_RETURN = 'float-return';

/** Each dock item of a float's menu, by its item id, and the edge it docks on. */
const FLOAT_DOCKS: readonly { id: string; edge: DockEdge }[] = [
    { id: 'dock-left', edge: 'left' },
    { id: 'dock-right', edge: 'right' },
    { id: 'dock-bottom', edge: 'bottom' }
];

/** The words of the item that docks a float on an edge. */
function dockWords(
    edge: DockEdge,
    t: (key: string, ...args: (string | number)[]) => string
): string {
    if (edge === 'left') return t('ui.float_dock_left');
    return edge === 'right' ? t('ui.float_dock_right') : t('ui.float_dock_bottom');
}

/** Each split of the strip's menu, by its item id, and the edge the new pane takes. */
const STRIP_SPLITS: readonly { id: string; edge: Edge }[] = [
    { id: 'split-up', edge: 'top' },
    { id: 'split-down', edge: 'bottom' },
    { id: 'split-left', edge: 'left' },
    { id: 'split-right', edge: 'right' }
];

/**
 * What a float's menus offer in place of the splits: a dock for every edge the float is not docked
 * on, Float on a docked float, which floats it again, and Return to Page, which puts its tabs back
 * into the page on screen. A float is a pane alone, so it has no split, no fold and no maximise.
 */
export function floatItems(
    place: FloatPlace,
    t: (key: string, ...args: (string | number)[]) => string
): Item[] {
    return [
        ...FLOAT_DOCKS.filter((dock) => place.kind !== 'dock' || place.edge !== dock.edge).map(
            (dock) => ({ id: dock.id, label: dockWords(dock.edge, t) })
        ),
        ...(place.kind === 'dock' ? [{ id: FLOAT_FREE, label: t('ui.float') }] : []),
        { id: FLOAT_RETURN, label: t('ui.float_return') }
    ];
}

/** Whether an item of a pane menu is one of the float items, which run through stripPicked. */
export function isFloatItem(id: string): boolean {
    return (
        id === FLOAT_PANE ||
        id === FLOAT_FREE ||
        id === FLOAT_RETURN ||
        FLOAT_DOCKS.some((dock) => dock.id === id)
    );
}

/**
 * The pane menu of a float's pane: Close, the float's items, and the choice that lists the pages
 * its active tab can move to. A float has no maximise, fold, split or page to show beside it.
 */
export function floatMenu(
    place: FloatPlace,
    pages: readonly Page[],
    t: (key: string, ...args: (string | number)[]) => string
): Item[] {
    return [
        { id: 'close', label: t('ui.pane_close') },
        ...floatItems(place, t),
        ...moveChoice(pages, '', t)
    ];
}

/**
 * The strip's menu, in VS Code's groups: Open File... (the palette, as Cmd+K opens it); the four
 * splits of the active tab and Float, while the pane of a page holds a tab; Close, while the page
 * holds more than one pane; and New Terminal. The pane of a float (`float`, its place) has the
 * float's items in place of the splits and always offers Close, which closes the float.
 */
export function stripMenu(
    facts: { holdsTab: boolean; panes: number; float?: FloatPlace },
    t: (key: string, ...args: (string | number)[]) => string
): Item[] {
    const floated = facts.float !== undefined;
    return grouped([
        [{ id: STRIP_OPEN_FILE, label: t('ui.strip_open_file') }],
        facts.float !== undefined
            ? floatItems(facts.float, t)
            : facts.holdsTab
              ? [
                    { id: 'split-up', label: t('ui.strip_split_up') },
                    { id: 'split-down', label: t('ui.strip_split_down') },
                    { id: 'split-left', label: t('ui.strip_split_left') },
                    { id: 'split-right', label: t('ui.strip_split_right') },
                    { id: FLOAT_PANE, label: t('ui.float') }
                ]
              : [],
        floated || facts.panes > 1 ? [{ id: STRIP_CLOSE, label: t('ui.strip_close') }] : [],
        [{ id: STRIP_NEW_TERMINAL, label: t('ui.strip_new_terminal') }]
    ]);
}

/** The edge a split item of the strip's menu takes, or null for an item that is no split. */
export function stripEdge(id: string): Edge | null {
    return STRIP_SPLITS.find((one) => one.id === id)?.edge ?? null;
}

/**
 * What a pick from the strip's menu calls: the splits, the float operations, the palette, the
 * close, New.
 */
export type StripDeps = {
    splitInstance: (id: string, path: number[], edge: Edge, page: string) => void;
    openPalette: (prefill: string) => void;
    /** The pane menu's own close, with its question. */
    close: () => void;
    /** New Terminal: starts a shell in a Terminal tab of the pane the menu was opened on. */
    newTerminalIn: (page: string, path: number[]) => void;
    /** Float: the pane of a page becomes a free float. */
    floatPane: (path: number[], page: string) => void;
    /** Dock Left, Dock Right and Dock Bottom of a float. */
    dockFloat: (id: string, edge: DockEdge) => void;
    /** Float of a docked float. */
    freeFloat: (id: string) => void;
    /** Return to Page: the float's tabs go back into the page on screen. */
    returnFloat: (id: string) => void;
};

/** Run a pick from the strip's menu over the pane's active tab, its path and its page. */
export function stripPicked(
    id: string,
    pane: { active: string; path: number[]; page: string },
    deps: StripDeps
): void {
    const edge = stripEdge(id);
    const dock = FLOAT_DOCKS.find((one) => one.id === id);
    if (edge !== null) {
        if (pane.active !== '') deps.splitInstance(pane.active, pane.path, edge, pane.page);
    } else if (id === FLOAT_PANE) deps.floatPane(pane.path, pane.page);
    else if (id === FLOAT_FREE) deps.freeFloat(pane.page);
    else if (id === FLOAT_RETURN) deps.returnFloat(pane.page);
    else if (dock !== undefined) deps.dockFloat(pane.page, dock.edge);
    else if (id === STRIP_OPEN_FILE) deps.openPalette('');
    else if (id === STRIP_CLOSE) deps.close();
    else if (id === STRIP_NEW_TERMINAL) deps.newTerminalIn(pane.page, pane.path);
}

/**
 * What the strip draws a tab's glyph with and in which colour token: the mark the terminals store
 * gives a Terminal tab (the icon and colour of the terminal it shows), else the view's own glyph
 * and the default colour, which is also what a Terminal tab whose terminal has neither gets.
 */
export function stripMark(
    viewGlyph: string,
    mark: { glyph?: string; token?: string }
): { glyph: string; tint?: string } {
    return { glyph: mark.glyph ?? viewGlyph, tint: mark.token };
}
