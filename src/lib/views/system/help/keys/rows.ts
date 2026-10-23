// Layer 3, view partial. The rows of the Keyboard Shortcuts view (Keys.svelte): every key oculus
// binds, with what it does, built from the code that binds it, so no row is written by hand. The
// workbench's and the debugger's keys come from resolving every press with the workbench's
// resolver (data/helpers/keys/oculus/bindings.ts), the palette's from its table (palette-table.ts),
// the LaTeX tab's from its tables and the chords of config/catalogs/latex.yml (editor-keys.ts),
// the desktop app's from its menu's own accelerators (desktop-keys.ts) and the keys the resolver
// answers in the app alone, Monaco's from its registries (ui/controls/editor/keys/monaco-keys.ts),
// and the apps' from their keybindings. Each action's meaning is a word of the catalog.

import {
    chordsLabel,
    menuBindings,
    paletteChord,
    pressChord,
    workbenchBindings,
    type Binding,
    type Chord,
    type MenuItem
} from '$lib/data/helpers/keys/oculus/bindings';
import {
    LATEX_CHORD_FIRST,
    LATEX_PRESSES,
    LATEX_SCOPES,
    latexChordSecond,
    latexChordSeconds,
    latexMathFirst,
    type LatexScope
} from '$lib/data/helpers/keys/oculus/editor-keys';
import { KEY_ROWS, PREFIX_ROWS } from '$lib/data/helpers/keys/oculus/palette-table';
import type { ChordOrder, KeyAction } from '$lib/data/helpers/keys/oculus/resolve';
import type { DebugKey } from '$lib/data/helpers/keys/oculus/debug-keys';
import type { EditorShortcut } from '$lib/ui/controls/editor/keys/monaco-keys';
import { t } from '$lib/state/shared/words/text';

/** The groups the view lists the keys under, in their order. */
const KEY_GROUPS = ['workbench', 'editor', 'latex', 'debug', 'desktop', 'apps'] as const;

export type KeyGroup = (typeof KEY_GROUPS)[number];

/** One row: the keys that do one thing, each written as the view writes a key, and that thing. */
export type KeyRow = { group: KeyGroup; keys: string[]; meaning: string };

/** The heading of a group. */
export function groupLabel(group: KeyGroup): string {
    const labels: Record<KeyGroup, () => string> = {
        workbench: () => t('keys.group_workbench'),
        editor: () => t('keys.group_editor'),
        latex: () => t('keys.group_latex'),
        debug: () => t('keys.group_debug'),
        desktop: () => t('keys.group_desktop'),
        apps: () => t('keys.group_apps')
    };
    return labels[group]();
}

/**
 * The names an action's meaning holds: the label of the view or document a chord opens, and the
 * label of the rail page a digit shows, null for a place the rail does not have.
 */
export type ActionNames = {
    view: (pick: string) => string;
    page: (index: number) => string | null;
};

/** What a debug key does. */
function debugMeaning(which: DebugKey): string {
    const words: Record<DebugKey, () => string> = {
        start: () => t('keys.debug_start'),
        stop: () => t('keys.debug_stop'),
        restart: () => t('keys.debug_restart'),
        toggle: () => t('keys.debug_toggle'),
        over: () => t('keys.debug_over'),
        into: () => t('keys.debug_into'),
        out: () => t('keys.debug_out')
    };
    return words[which]();
}

/** What a direction of the card cursor's keys does. */
function cursorMeaning(direction: 'left' | 'right' | 'up' | 'down'): string {
    if (direction === 'left') return t('keys.cursor_left');
    if (direction === 'right') return t('keys.cursor_right');
    return direction === 'up' ? t('keys.cursor_up') : t('keys.cursor_down');
}

/** What an action of the workbench does, or null for a digit past the rail's last page. */
function actionMeaning(action: KeyAction, names: ActionNames): string | null {
    switch (action.kind) {
        case 'open':
            return t('keys.open', names.view(action.view));
        case 'page': {
            const page = names.page(action.index);
            return page === null ? null : t('keys.page', page);
        }
        case 'tab':
            return t('keys.tab', String(action.index));
        case 'cycle-tab':
            return action.by === 1 ? t('keys.next_tab') : t('keys.previous_tab');
        case 'cursor':
            return cursorMeaning(action.direction);
        case 'move':
            return action.direction === 'left' ? t('keys.move_left') : t('keys.move_right');
        case 'activate':
            return t('keys.activate');
        case 'search':
            return t('keys.search');
        case 'find-in-files':
            return t('keys.find_in_files');
        case 'replace-in-files':
            return t('keys.replace_in_files');
        case 'scroll':
            return action.edge === 'top' ? t('keys.top') : t('keys.bottom');
        case 'shortcuts':
            return t('keys.shortcuts');
        case 'new-session':
            return t('keys.new_session');
        case 'command-default':
            return action.which === 'build' ? t('keys.build') : t('keys.test');
        case 'save':
            return t('keys.save');
        case 'tex-view':
            return t('keys.tex_view');
        case 'toggle-problems':
            return t('keys.problems');
        case 'next-problem':
            return action.by === 1 ? t('keys.next_problem') : t('keys.previous_problem');
        case 'debug':
            return debugMeaning(action.which);
        case 'close-tab':
            return t('keys.close_tab');
        case 'reopen-closed-tab':
            return t('keys.reopen_closed_tab');
        case 'go-back':
            return t('keys.go_back');
        case 'go-forward':
            return t('keys.go_forward');
        case 'new-text-file':
            return t('keys.new_text_file');
        case 'find':
            return t('keys.find');
        case 'workspace-symbol':
            return t('palette_page.key_symbols');
        case 'clear-cursor':
            return t('keys.clear_cursor');
    }
}

/** Rows that do the same thing in one group made one row, its keys in the order found. */
function merged(rows: KeyRow[]): KeyRow[] {
    const kept = new Map<string, KeyRow>();
    for (const row of rows) {
        const key = `${row.group}\n${row.meaning}`;
        const held = kept.get(key);
        if (held === undefined) kept.set(key, { ...row, keys: [...row.keys] });
        else held.keys.push(...row.keys.filter((one) => !held.keys.includes(one)));
    }
    return [...kept.values()];
}

/** A binding as a row: the debug keys in their own group, the rest under `group`. */
function bindingRow(binding: Binding, names: ActionNames, mac: boolean, group: KeyGroup): KeyRow[] {
    const meaning = actionMeaning(binding.action, names);
    if (meaning === null) return [];
    const debug = binding.action.kind === 'debug';
    return [{ group: debug ? 'debug' : group, keys: [chordsLabel(binding.chords, mac)], meaning }];
}

/**
 * The keys of the palette's table, but the one the resolver answers itself (`symbols`), which the
 * workbench's rows hold, and the colon that opens its command line.
 */
function paletteRows(mac: boolean): KeyRow[] {
    const keys = Object.entries(KEY_ROWS)
        .filter(([name]) => name !== 'symbols')
        .map(([, row]): KeyRow => ({
            group: 'workbench',
            keys: row.presses.map((press) => chordsLabel([paletteChord(press, mac)], mac)),
            meaning: t(row.word)
        }));
    const row = PREFIX_ROWS.command;
    return [...keys, { group: 'workbench', keys: [row.prefix], meaning: t(row.word) }];
}

/** What one of the LaTeX tab's one-press actions does. */
function latexMeaning(action: keyof typeof LATEX_PRESSES): string {
    const words: Record<keyof typeof LATEX_PRESSES, () => string> = {
        build: () => t('latex.cmd_build'),
        clean: () => t('latex.cmd_clean'),
        view: () => t('latex.cmd_view'),
        synctex: () => t('latex.cmd_synctex'),
        mathPreview: () => t('latex.cmd_math_preview'),
        promote: () => t('latex.cmd_promote'),
        demote: () => t('latex.cmd_demote')
    };
    return words[action]();
}

/** What a LaTeX key does, with the files it is bound in (`LATEX_SCOPES`). */
function inFiles(meaning: string, scope: LatexScope): string {
    const words: Record<LatexScope, () => string> = {
        tex: () => t('latex.keys_tex', meaning),
        texOrBib: () => t('latex.keys_tex_or_bib', meaning),
        texOrStyle: () => t('latex.keys_tex_or_style', meaning)
    };
    return words[scope]();
}

/**
 * The LaTeX tab's keys: its one-press actions, its own chords and the configured chords, each with
 * the files it is bound in.
 */
export function latexRows(
    chords: { text: Record<string, string>; math: Record<string, string> },
    mac: boolean
): KeyRow[] {
    const row = (chords: Chord[], meaning: string): KeyRow => ({
        group: 'latex',
        keys: [chordsLabel(chords, mac)],
        meaning
    });
    const first = pressChord(LATEX_CHORD_FIRST, mac);
    const mathFirst = pressChord(latexMathFirst(mac), mac);
    const second = (character: string): Chord => pressChord(latexChordSecond(character), mac);
    const seconds = latexChordSeconds(mac);
    const own = (second: keyof typeof seconds, meaning: string): KeyRow =>
        row([first, pressChord(seconds[second], mac)], inFiles(meaning, LATEX_SCOPES[second]));
    const actions = Object.keys(LATEX_PRESSES) as (keyof typeof LATEX_PRESSES)[];
    return [
        ...actions.map((action) =>
            row(
                [pressChord(LATEX_PRESSES[action], mac)],
                inFiles(latexMeaning(action), LATEX_SCOPES[action])
            )
        ),
        own('item', t('latex.cmd_item')),
        own('surround', t('latex.cmd_surround')),
        own('selectLine', t('latex.cmd_select_line')),
        own('tabFocus', t('latex.cmd_tab_focus')),
        ...Object.entries(chords.text).map(([character, command]) =>
            row(
                [first, second(character)],
                inFiles(t('latex.cmd_command', command), LATEX_SCOPES.text)
            )
        ),
        ...Object.entries(chords.math).map(([character, command]) =>
            row(
                [mathFirst, second(character)],
                inFiles(t('latex.cmd_command', command), LATEX_SCOPES.math)
            )
        )
    ];
}

/** What one of the desktop menu's own items does: the item's label in the menu. */
function menuMeaning(item: MenuItem): string {
    const words: Record<MenuItem, () => string> = {
        settings: () => t('desktop.menu.settings'),
        newWindow: () => t('desktop.menu.new_window'),
        closeWindow: () => t('desktop.menu.close_window'),
        reload: () => t('desktop.menu.reload'),
        fullScreen: () => t('desktop.menu.full_screen'),
        zoomIn: () => t('desktop.menu.zoom_in'),
        zoomOut: () => t('desktop.menu.zoom_out'),
        zoomReset: () => t('desktop.menu.zoom_reset'),
        devTools: () => t('desktop.menu.devtools'),
        hide: () => t('desktop.menu.hide'),
        hideOthers: () => t('desktop.menu.hide_others'),
        quit: () => t('desktop.menu.quit'),
        minimize: () => t('desktop.menu.minimize')
    };
    return words[item]();
}

/** The desktop menu's own items with their keys (bindings.ts `menuBindings`). */
function menuRows(mac: boolean): KeyRow[] {
    return menuBindings(mac).map(({ item, chords }) => ({
        group: 'desktop',
        keys: [chordsLabel(chords, mac)],
        meaning: menuMeaning(item)
    }));
}

/** The text a binding compares by: its keys and what it runs. */
function bindingText(binding: Binding): string {
    return `${JSON.stringify(binding.chords)} ${JSON.stringify(binding.action)}`;
}

/**
 * The workbench's, the palette's, the debugger's and, in the desktop app, the app's keys: the keys
 * the resolver answers in a browser, and in the app those it answers there alone with the menu's
 * own items.
 */
export function workbenchRows(
    order: ChordOrder,
    names: ActionNames,
    mac: boolean,
    app: boolean
): KeyRow[] {
    const browser = workbenchBindings(order, mac, false);
    const rows = [
        ...browser.flatMap((binding) => bindingRow(binding, names, mac, 'workbench')),
        ...paletteRows(mac)
    ];
    if (!app) return rows;
    const seen = new Set(browser.map(bindingText));
    const appOnly = workbenchBindings(order, mac, true).filter(
        (binding) => !seen.has(bindingText(binding))
    );
    return [
        ...rows,
        ...appOnly.flatMap((binding) => bindingRow(binding, names, mac, 'desktop')),
        ...menuRows(mac)
    ];
}

/** Monaco's keys as rows, each under its action's label. */
export function editorRows(shortcuts: readonly EditorShortcut[], mac: boolean): KeyRow[] {
    return shortcuts.map((one) => ({
        group: 'editor',
        keys: [chordsLabel(one.chords, mac)],
        meaning: one.label
    }));
}

/** The apps' keys as rows. */
export function appRows(rows: readonly { key: string; meaning: string }[]): KeyRow[] {
    return rows.map((row) => ({ group: 'apps', keys: [row.key], meaning: row.meaning }));
}

/**
 * The rows a search keeps, each group's in the order of their meanings and the groups in their
 * order: rows that do the same thing in a group are one row, and a row is kept when its meaning or
 * one of its keys holds the text, in any case.
 */
export function grouped(rows: KeyRow[], text: string): { group: KeyGroup; rows: KeyRow[] }[] {
    const needle = text.trim().toLowerCase();
    const kept = merged(rows).filter((row) =>
        [row.meaning, ...row.keys].some((one) => one.toLowerCase().includes(needle))
    );
    return KEY_GROUPS.map((group) => ({
        group,
        rows: kept
            .filter((row) => row.group === group)
            .sort((left, right) => left.meaning.localeCompare(right.meaning))
    })).filter((one) => one.rows.length > 0);
}
