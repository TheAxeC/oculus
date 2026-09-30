// Layer 3, shell. The pane menu's page items, apart from the component so the numbering they draw,
// the pages they offer and the two choices they are gathered under can be read by a test; and the
// right-click menu of a pane's strip and of an empty pane's body, VS Code's editor group menu, with
// what each of its picks runs.

import { grouped, type MenuItem as Item } from '$lib/ui/menu/menu-items';
import { fold, showable, type Edge, type Layout, type Page } from '$lib/state/workbench/layout';

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
    const moves = pageMoveItems(pages, host, t);
    const shows = embedPageItems(pages, screen, host, t);
    return [
        ...(moves.length > 0
            ? [{ id: MOVE_LIST, label: t('ui.move_to_page_list'), items: moves }]
            : []),
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

/** Each split of the strip's menu, by its item id, and the edge the new pane takes. */
const STRIP_SPLITS: readonly { id: string; edge: Edge }[] = [
    { id: 'split-up', edge: 'top' },
    { id: 'split-down', edge: 'bottom' },
    { id: 'split-left', edge: 'left' },
    { id: 'split-right', edge: 'right' }
];

/**
 * The strip's menu, in VS Code's groups: Open File... (the palette, as Cmd+K opens it); the four
 * splits of the active tab, while the pane holds a tab; Close, while the page holds more than one
 * pane; and New Terminal.
 */
export function stripMenu(
    facts: { holdsTab: boolean; panes: number },
    t: (key: string, ...args: (string | number)[]) => string
): Item[] {
    return grouped([
        [{ id: STRIP_OPEN_FILE, label: t('ui.strip_open_file') }],
        facts.holdsTab
            ? [
                  { id: 'split-up', label: t('ui.strip_split_up') },
                  { id: 'split-down', label: t('ui.strip_split_down') },
                  { id: 'split-left', label: t('ui.strip_split_left') },
                  { id: 'split-right', label: t('ui.strip_split_right') }
              ]
            : [],
        facts.panes > 1 ? [{ id: STRIP_CLOSE, label: t('ui.strip_close') }] : [],
        [{ id: STRIP_NEW_TERMINAL, label: t('ui.strip_new_terminal') }]
    ]);
}

/** The edge a split item of the strip's menu takes, or null for an item that is no split. */
export function stripEdge(id: string): Edge | null {
    return STRIP_SPLITS.find((one) => one.id === id)?.edge ?? null;
}

/** What a pick from the strip's menu calls: the layout's split, the palette, the close, New. */
export type StripDeps = {
    splitInstance: (id: string, path: number[], edge: Edge, page: string) => void;
    openPalette: (prefill: string) => void;
    /** The pane menu's own close, with its question. */
    close: () => void;
    /** New Terminal: starts a shell in a Terminal tab of the pane the menu was opened on. */
    newTerminalIn: (page: string, path: number[]) => void;
};

/** Run a pick from the strip's menu over the pane's active tab, its path and its page. */
export function stripPicked(
    id: string,
    pane: { active: string; path: number[]; page: string },
    deps: StripDeps
): void {
    const edge = stripEdge(id);
    if (edge !== null) {
        if (pane.active !== '') deps.splitInstance(pane.active, pane.path, edge, pane.page);
    } else if (id === STRIP_OPEN_FILE) deps.openPalette('');
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
