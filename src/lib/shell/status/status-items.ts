// Layer 3, shell. The status bar's items: their ids, which group each is drawn in and in what
// order, and the name each is listed under in the bar's right-click menu, where unchecking one
// hides it.
//
// The order is VS Code's: on the left what the window is connected to (the machine, the repository
// and how far it is from its upstream, the findings), then the extensions' items oculus keeps (the
// HPC poll, the usage refreshers, the server connection); on the right the editor's own items for
// the source tab on screen (the caret line's blame while it is on, then the caret and the text's
// own items), then the live sessions and the unsaved tabs, and the bell last.

import { t } from '$lib/state/shared/words/text';

/** The left group, in the order it is drawn. */
export const LEFT_ITEMS = ['host', 'branch', 'sync', 'findings', 'hpc', 'usage', 'server'] as const;

/** The right group, in the order it is drawn, the bell against the window's right edge. */
export const RIGHT_ITEMS = [
    'blame',
    'caret',
    'indent',
    'encoding',
    'line_ending',
    'language',
    'sessions',
    'unsaved',
    'bell'
] as const;

/** One item's id, which is its `data-status` and what the ui store keeps a hidden one under. */
export type StatusItem = (typeof LEFT_ITEMS)[number] | (typeof RIGHT_ITEMS)[number];

/** Every item, left group first, which is the order the right-click menu lists them in. */
export const STATUS_ITEMS: readonly StatusItem[] = [...LEFT_ITEMS, ...RIGHT_ITEMS];

/** The name an item is listed under in the right-click menu. */
export function itemName(item: StatusItem): string {
    switch (item) {
        case 'host':
            return t('statusbar.item_host');
        case 'branch':
            return t('statusbar.item_branch');
        case 'sync':
            return t('statusbar.item_sync');
        case 'findings':
            return t('statusbar.item_findings');
        case 'hpc':
            return t('statusbar.item_hpc');
        case 'usage':
            return t('statusbar.item_usage');
        case 'server':
            return t('statusbar.item_server');
        case 'blame':
            return t('statusbar.item_blame');
        case 'caret':
            return t('statusbar.item_caret');
        case 'indent':
            return t('statusbar.item_indent');
        case 'encoding':
            return t('statusbar.item_encoding');
        case 'line_ending':
            return t('statusbar.item_line_ending');
        case 'language':
            return t('statusbar.item_language');
        case 'sessions':
            return t('statusbar.item_sessions');
        case 'unsaved':
            return t('statusbar.item_unsaved');
        case 'bell':
            return t('statusbar.item_bell');
    }
}

/** Whether an id the right-click menu hands back is one of the bar's items. */
export function isStatusItem(id: string): id is StatusItem {
    return (STATUS_ITEMS as readonly string[]).includes(id);
}

/** A notification's time as the centre and a toast draw it, hours and minutes of the day. */
export function clockOf(at: number): string {
    const when = new Date(at);
    const pad = (value: number): string => String(value).padStart(2, '0');
    return `${pad(when.getHours())}:${pad(when.getMinutes())}`;
}
