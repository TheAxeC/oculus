// Layer 3, shell. The right-click menu of one tab, VS Code's tab context menu in its groups and
// words, less what oculus has no part for (Share and the moves into a new window): the closes, the
// two copies of a file's path, Reveal in Finder and Show in Files, the two compare items, Keep Open
// and Pin or Unpin, and the splits. Apart from the component so the items, the tabs each close
// closes and the path copies can be read without a DOM.

import type { Edge } from '$lib/state/workbench/layout';
import { absoluteOf } from '$lib/state/workbench/navigation/pages';
import type { TabFile } from '$lib/state/workbench/navigation/status';
import { grouped, type MenuItem } from '$lib/ui/menu/menu-items';

type Words = (key: string, ...args: (string | number)[]) => string;

/** What the menu of one tab depends on. */
export type TabFacts = {
    pinned: boolean;
    preview: boolean;
    /** Whether the tab shows one file, which is what the path, reveal and compare items need. */
    file: boolean;
    /** How many tabs the pane holds. */
    tabs: number;
    /** How many tabs stand to the right of this one. */
    right: number;
    /** Whether another file than this tab's is selected for compare. */
    compareWith: boolean;
};

export const TAB_CLOSE = 'close';
export const TAB_CLOSE_OTHERS = 'close-others';
export const TAB_CLOSE_RIGHT = 'close-right';
export const TAB_CLOSE_SAVED = 'close-saved';
export const TAB_CLOSE_ALL = 'close-all';
export const TAB_COPY_PATH = 'copy-path';
export const TAB_COPY_RELATIVE = 'copy-relative';
export const TAB_REVEAL = 'reveal';
export const TAB_SHOW_IN_FILES = 'show-in-files';
export const TAB_SELECT_COMPARE = 'select-compare';
export const TAB_COMPARE_WITH = 'compare-with';
export const TAB_KEEP_OPEN = 'keep-open';
export const TAB_PIN = 'pin';
export const TAB_UNPIN = 'unpin';
export const TAB_SPLIT_RIGHT = 'split-right';
const SPLIT_MOVE = 'split-move';

/** Each split of the Split & Move submenu, by item id, and the edge the tab goes to. */
const MOVES: readonly { id: string; edge: Edge }[] = [
    { id: 'split-move-up', edge: 'top' },
    { id: 'split-move-down', edge: 'bottom' },
    { id: 'split-move-left', edge: 'left' },
    { id: 'split-move-right', edge: 'right' }
];

/** The edge a split item of the tab menu takes, or null for an item that is no split. */
function tabEdge(id: string): Edge | null {
    if (id === TAB_SPLIT_RIGHT) return 'right';
    return MOVES.find((move) => move.id === id)?.edge ?? null;
}

/**
 * The menu of one tab, in VS Code's groups: the closes; the path copies; Reveal in Finder and Show
 * in Files; the compare items; Keep Open and Pin or Unpin; the splits. The file groups are offered
 * for a tab showing a file only. Close Others needs a second tab and Close to the Right a tab to
 * the right; Keep Open is drawn on every tab and enabled on a preview.
 */
export function tabMenu(facts: TabFacts, t: Words): MenuItem[] {
    const item = (id: string, label: string, disabled = false): MenuItem =>
        disabled ? { id, label, disabled } : { id, label };
    const file = facts.file;
    return grouped([
        [
            item(TAB_CLOSE, t('ui.tab_close')),
            item(TAB_CLOSE_OTHERS, t('ui.tab_close_others'), facts.tabs <= 1),
            item(TAB_CLOSE_RIGHT, t('ui.tab_close_right'), facts.right <= 0),
            item(TAB_CLOSE_SAVED, t('ui.tab_close_saved')),
            item(TAB_CLOSE_ALL, t('ui.tab_close_all'))
        ],
        file
            ? [
                  item(TAB_COPY_PATH, t('files.menu_copy_path')),
                  item(TAB_COPY_RELATIVE, t('files.menu_copy_relative'))
              ]
            : [],
        file
            ? [
                  item(TAB_REVEAL, t('files.menu_reveal')),
                  item(TAB_SHOW_IN_FILES, t('ui.tab_show_in_files'))
              ]
            : [],
        file
            ? [
                  ...(facts.compareWith
                      ? [item(TAB_COMPARE_WITH, t('files.menu_compare_with'))]
                      : []),
                  item(TAB_SELECT_COMPARE, t('files.menu_select_compare'))
              ]
            : [],
        [
            item(TAB_KEEP_OPEN, t('ui.tab_keep_open'), !facts.preview),
            facts.pinned ? item(TAB_UNPIN, t('ui.tab_unpin')) : item(TAB_PIN, t('ui.tab_pin'))
        ],
        [
            item(TAB_SPLIT_RIGHT, t('ui.tab_split_right')),
            {
                id: SPLIT_MOVE,
                label: t('ui.tab_split_move'),
                items: [
                    { id: 'split-move-up', label: t('ui.tab_split_up') },
                    { id: 'split-move-down', label: t('ui.tab_split_down') },
                    { id: 'split-move-left', label: t('ui.tab_split_left') },
                    { id: 'split-move-right', label: t('ui.tab_split_right') }
                ]
            }
        ]
    ]);
}

/** Which close a pick of the menu asks for. */
export type CloseKind = 'close' | 'others' | 'right' | 'saved' | 'all';

/** The close a menu item id asks for, or null for an item that is no close. */
function closeKind(id: string): CloseKind | null {
    switch (id) {
        case TAB_CLOSE:
            return 'close';
        case TAB_CLOSE_OTHERS:
            return 'others';
        case TAB_CLOSE_RIGHT:
            return 'right';
        case TAB_CLOSE_SAVED:
            return 'saved';
        case TAB_CLOSE_ALL:
            return 'all';
        default:
            return null;
    }
}

/**
 * The tabs a close item closes, and the tab it keeps and stops being a preview. A pinned tab is
 * closed by Close alone: Close Others, Close to the Right, Close Saved and Close All leave it open.
 * Close Others keeps the chosen tab, and so does Close to the Right.
 */
export function tabsToClose(
    kind: CloseKind,
    tabs: readonly { id: string; pinned?: boolean }[],
    id: string,
    saved: (id: string) => boolean
): { ids: string[]; keep: string | null } {
    const loose = tabs.filter((tab) => tab.pinned !== true);
    if (kind === 'close') return { ids: [id], keep: null };
    if (kind === 'others') {
        return { ids: loose.filter((tab) => tab.id !== id).map((tab) => tab.id), keep: id };
    }
    if (kind === 'right') {
        const from = tabs.findIndex((tab) => tab.id === id);
        return {
            ids: tabs
                .slice(from + 1)
                .filter((tab) => tab.pinned !== true)
                .map((tab) => tab.id),
            keep: id
        };
    }
    if (kind === 'saved')
        return { ids: loose.filter((tab) => saved(tab.id)).map((tab) => tab.id), keep: null };
    return { ids: loose.map((tab) => tab.id), keep: null };
}

/**
 * The copy of a file tab's path: the absolute path or the path under its root, written to the
 * clipboard. A refusal of the clipboard is said, unless a later copy has taken its place, since the
 * later text is the one the reader meant.
 */
export function copyTabPath(
    write: (text: string) => Promise<void>,
    say: (sentence: string) => void,
    t: Words
): (which: 'absolute' | 'relative', file: TabFile, rootDir: string) => Promise<void> {
    let latest = 0;
    return async (which, file, rootDir) => {
        latest += 1;
        const mine = latest;
        const text = which === 'relative' ? file.path : absoluteOf(rootDir, file.path);
        try {
            await write(text);
        } catch {
            if (mine === latest) say(t('ui.tab_copy_refused'));
        }
    };
}

/** What a pick of the tab menu calls, over the tab the menu was opened on. */
export type TabPickDeps = {
    /** A close item: the tabs it closes are `tabsToClose`'s, asked about first when need be. */
    close: (kind: CloseKind) => void;
    copy: (which: 'absolute' | 'relative') => void;
    reveal: () => void;
    showInFiles: () => void;
    selectForCompare: () => void;
    compareWith: () => void;
    keepOpen: () => void;
    pin: () => void;
    unpin: () => void;
    split: (edge: Edge) => void;
};

/** Run a pick of the tab menu. */
export function tabPicked(id: string, deps: TabPickDeps): void {
    const close = closeKind(id);
    const edge = tabEdge(id);
    if (close !== null) deps.close(close);
    else if (edge !== null) deps.split(edge);
    else if (id === TAB_COPY_PATH) deps.copy('absolute');
    else if (id === TAB_COPY_RELATIVE) deps.copy('relative');
    else if (id === TAB_REVEAL) deps.reveal();
    else if (id === TAB_SHOW_IN_FILES) deps.showInFiles();
    else if (id === TAB_SELECT_COMPARE) deps.selectForCompare();
    else if (id === TAB_COMPARE_WITH) deps.compareWith();
    else if (id === TAB_KEEP_OPEN) deps.keepOpen();
    else if (id === TAB_PIN) deps.pin();
    else if (id === TAB_UNPIN) deps.unpin();
}
