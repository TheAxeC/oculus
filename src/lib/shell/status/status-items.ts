// Layer 3, shell. The status bar's items: their ids, which group each is drawn in and in what
// order, and the name each is listed under in the bar's right-click menu, where unchecking one
// hides it.
//
// The order is VS Code's: on the left what the window is connected to (the machine, the repository
// with its branch and how far it is from its upstream, the problems, the findings), then the
// extensions' items oculus keeps (the HPC poll, the usage refreshers, the server connection) and
// the LaTeX build item; on the right the editor's own items for the source tab on screen (the caret
// line's blame in a file of a repository, then the caret and the text's own items, then the items
// of a language server: its state, the Python interpreter, the compile database and the Svelte
// configuration, each drawn only for the language it belongs to, then the linters of the file, one
// item each, before the language itself), then the live sessions and the unsaved tabs, and the bell
// last.
//
// The host item is the server's `os.hostname()` on the `config` channel's `ConfigPayload.host`,
// with its address. The repository item names the repository the bar follows and lists the
// repositories of the Files view; branch and sync are that repository's. The repository is the one
// holding the active tab's file, else the one holding the folder of the workbench on screen, else
// the one last chosen in the repository item, else the hub's (`repoStatus`). The branch picker
// switches through `switchBranch`, and the sync item pushes through `push` when the branch is only
// ahead and otherwise pulls and then pushes through `sync`, each asking a confirm that names the
// upstream or the remote before git runs, and a write git refuses opens the Repositories view on
// the repository, whose line says why. A branch with no upstream draws Publish Branch in the sync
// item's place. The blame item shows for a source tab over a file of a repository whether or not
// the tab draws blame in its gutter, worded as VS Code's `git.blame.statusBarItem.template` default
// `${authorName} (${authorDateAgo})`, or Not Committed Yet, and a tab over a file at HEAD or in the
// index shows its blame in the gutter alone. The problems item counts the errors, warnings and
// infos the Problems view lists, with the infos only when there are some, and a press shows that
// view or hides it. The findings item counts the Findings view's list, the snapshot's findings and
// the config channel's, and opens that view. The debug item follows it once a debug session has run
// since the server started: the last configuration's name, and a press opens the configuration
// picker. The LaTeX item is the build state of the root of the active LaTeX file or PDF, and opens
// the TeX view.

import type { EditorStatus } from '$lib/state/workbench/navigation/editor-status.svelte';
import { t } from '$lib/state/shared/words/text';

/** The left group, in the order it is drawn. */
export const LEFT_ITEMS = [
    'host',
    'repository',
    'branch',
    'sync',
    'problems',
    'findings',
    'debug',
    'hpc',
    'usage',
    'server',
    'latex'
] as const;

/** The right group, in the order it is drawn, the bell against the window's right edge. */
export const RIGHT_ITEMS = [
    'blame',
    'caret',
    'indent',
    'encoding',
    'line_ending',
    'language_server',
    'interpreter',
    'compile_database',
    'svelte_config',
    'linter',
    'language',
    'sessions',
    'unsaved',
    'bell'
] as const;

/**
 * The order the bar leaves its items out in when they do not all fit on its one row, the first to
 * leave first: the apps' items, the left group's machine, extension and repository items, the
 * language server's items, the blame and the text's own items, then the sessions, the unsaved tabs
 * and the bell, and last the items a reader reads most, the branch, the problems, the language and
 * the caret. `publish` is the sync item's place when the branch has no upstream.
 */
const DROP_ORDER: readonly string[] = [
    'app-progress',
    'app',
    'latex',
    'server',
    'usage',
    'hpc',
    'debug',
    'findings',
    'host',
    'repository',
    'sync',
    'publish',
    'svelte_config',
    'compile_database',
    'interpreter',
    'language_server',
    'linter',
    'blame',
    'line_ending',
    'encoding',
    'indent',
    'sessions',
    'unsaved',
    'bell',
    'branch',
    'problems',
    'language',
    'caret'
];

/**
 * The places of the items to leave out so the rest fit in `room` pixels: the fewest, taken in
 * DROP_ORDER, an id the order does not name before every one it names, and among items of one id
 * the last drawn first.
 */
export function leftOut(
    items: readonly { id: string; width: number }[],
    room: number
): Set<number> {
    let total = items.reduce((sum, one) => sum + one.width, 0);
    const rank = (id: string): number => DROP_ORDER.indexOf(id);
    const order = items
        .map((one, at) => ({ at, rank: rank(one.id) }))
        .sort((a, b) => a.rank - b.rank || b.at - a.at);
    const out = new Set<number>();
    for (const { at } of order) {
        if (total <= room) break;
        out.add(at);
        total -= items[at].width;
    }
    return out;
}

/**
 * A count as VS Code's status bar packs it: as it is up to 999, whole thousands from 1000 (`1K`
 * to `9K`), and `10K+` from 10000.
 */
export function packNumber(count: number): string {
    if (count > 9999) return t('statusbar.packed_many');
    if (count > 999) return t('statusbar.packed_thousands', Math.floor(count / 1000));
    return String(count);
}

/** One item's id, which is its `data-status` and what the ui store keeps a hidden one under. */
export type StatusItem = (typeof LEFT_ITEMS)[number] | (typeof RIGHT_ITEMS)[number];

/** Every item, left group first, which is the order the right-click menu lists them in. */
export const STATUS_ITEMS: readonly StatusItem[] = [...LEFT_ITEMS, ...RIGHT_ITEMS];

/** The name an item is listed under in the right-click menu. */
export function itemName(item: StatusItem): string {
    switch (item) {
        case 'host':
            return t('statusbar.item_host');
        case 'repository':
            return t('statusbar.item_repository');
        case 'branch':
            return t('statusbar.item_branch');
        case 'sync':
            return t('statusbar.item_sync');
        case 'problems':
            return t('statusbar.item_problems');
        case 'findings':
            return t('statusbar.item_findings');
        case 'debug':
            return t('statusbar.item_debug');
        case 'hpc':
            return t('statusbar.item_hpc');
        case 'usage':
            return t('statusbar.item_usage');
        case 'server':
            return t('statusbar.item_server');
        case 'latex':
            return t('statusbar.item_latex');
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
        case 'language_server':
            return t('statusbar.item_language_server');
        case 'interpreter':
            return t('statusbar.item_interpreter');
        case 'compile_database':
            return t('statusbar.item_compile_database');
        case 'svelte_config':
            return t('statusbar.item_svelte_config');
        case 'linter':
            return t('statusbar.item_linter');
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

/** What a component drawing a part of the right group is given by the status bar. */
export type ItemsProps = {
    /** The source tab on screen, by its instance id. */
    instance: string;
    status: EditorStatus;
    /** Whether an item is drawn, the reader having not hidden it. */
    shown: (item: StatusItem) => boolean;
    /** Open the palette on a query. */
    onpalette: (prefill: string) => void;
};
