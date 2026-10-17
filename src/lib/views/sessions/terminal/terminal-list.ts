// Layer 3, view helper. The rules the Terminal view's list and grid go by: whether the list is
// drawn, the rows of one tab in the tab's order, the key a row answers, a dragged row's new place,
// the drag a row carries, the grid's font size, the line count a paste is asked about and the
// listener that holds such a paste, the file drag the grid takes, a dropped path quoted for the
// shell, a terminal's tooltip, the items of the view's right-click menus, the find bar's count,
// options and keys, and the handler a link in the grid opens by. The pure ones are here rather than
// in the components so each is asserted without a DOM, which the grid's paste, drop and drag need
// to happen at all. How long an armed Kill stays armed, and what else ends it, is
// list/kill-arm.svelte.ts's; the list's width is list/list-width.svelte.ts's.
//
// The right-click menus are VS Code's terminal menus, with the items oculus runs: the grid's (Copy
// and Copy as HTML while it holds a selection, Paste, Select All, Clear, then Split Terminal,
// Rename, Change Icon, Change Color and Kill Terminal as the list's controls do), a list row's
// (Split Terminal and Kill Terminal, Rename, Change Icon, Change Color and Clear, Unsplit Terminal
// on a terminal of the row the tab shows, Join Terminals over the terminals other Terminal tabs
// own) and the list's empty area's (New Terminal, and New Terminal With Profile over the kinds,
// each starting that kind at once, and Attach to Session over the running terminals no Terminal tab
// owns). The bar's kinds dropdown lists the same kinds, With a Prompt, which shows the composer,
// and the same Attach to Session. Kill Terminal goes through the row's Kill (`pressKill` of
// list/kill-arm.svelte.ts): the first pick arms the terminal and the item then reads as the armed
// control does, and a second pick or press kills it. The context menu key and Shift+F10 open the
// grid's menu, which xterm would otherwise send to the shell (`holdMenuKeys`). Every label is
// `t(...)` of a catalog key, except a terminal's own name in Join Terminals and Attach to Session,
// which is passed through as the list hands it.

import type { ISearchOptions } from '@xterm/addon-search';
import { FILE_DRAG } from '$lib/state/sources/fs';
import { grouped, type MenuItem } from '$lib/ui/menu/menu-items';
import {
    TERMINAL_VIEW,
    tabTerminals,
    type TerminalTabState
} from '$lib/state/sessions/terminal/terminal-tabs';
import { COLOR_NAMES } from '$lib/state/sessions/terminal/terminal-marks';
import type { ComposerAgent } from '$lib/state/sessions/terminal/composer/composer';
import { stamp } from '$lib/state/shared/words/format';
import { t } from '$lib/state/shared/words/text';
import { terminalFontPx } from '$lib/state/shared/words/appearance';
import type { Terminal } from '$lib/state/sessions/terminals.svelte';
import type { TerminalChoice } from '$lib/state/sessions/folds';

/** What a Terminal tab hands the list it draws. */
export type TerminalListProps = {
    /** The Terminal tab the list is drawn in. */
    instance: string;
    /** The page holding that tab. */
    page: string;
    /** The tab's own state. */
    tab: TerminalTabState;
    /** The rows, in the order they are drawn. */
    rows: TerminalChoice[];
    /** The terminals the tab shows now: every terminal of its row, or the shown one alone. */
    current: string[];
    /** The terminal whose bell is ringing in this tab, or null. */
    ringing: string | null;
    /** The terminals the other Terminal tabs own, by name, which Join Terminals offers. */
    others: Attachable[];
    /** The running terminals no Terminal tab owns, by name, which Attach to Session offers. */
    attachables: Attachable[];
    /** Called with a row's terminal when a pointer press shows it, before it is shown. */
    onshown: (terminal: string) => void;
    /**
     * What a pick of a row's menu does, and what the row's own controls call: Split, Kill (a press
     * of the row's Kill, a Delete or Backspace on it, or Kill Terminal from its menu, which is the
     * tab's `pressKill` of list/kill-arm.svelte.ts: it arms the terminal first and kills it on the
     * second), and the double click that opens Rename. The bar's menu of a sole terminal is routed
     * through the same object.
     */
    handlers: PickHandlers;
    /** The terminal whose title is being edited on its row, or ''. */
    renaming: string;
    /** The rename field saved a value (an empty one clears the title). */
    onrenamed: (terminal: string, value: string) => void;
    /** The rename field was cancelled. */
    onrenamecancel: () => void;
    /** The terminal whose Kill was pressed or picked once and waits for the second, or ''. */
    arming: string;
    /** A kill the server refused, said below the rows until the next one. */
    failure: string;
    /** Take the arm off, when the stop moves off the armed row. */
    ondisarm: () => void;
    /** The list's width in pixels (list/list-width.svelte.ts, `listFit`). */
    width: number;
    /** Whether the list is narrow: each row drawn as its mark alone. */
    narrow: boolean;
};

/** The width the composer keeps at the right of a row that is being composed into, in rem. */
export const COMPOSER_REM = 20;

/** The style that draws a mark in a colour token, or nothing for no token. */
export function tokenStyle(token: string | null): string | undefined {
    return token === null ? undefined : `color: var(${token})`;
}

/** How long a bell marks its row, which is VS Code's `terminal.integrated.bellDuration` default. */
export const BELL_MS = 1000;

/**
 * The bell's mark: `ring` marks a terminal through `mark` and takes the mark off after BELL_MS, the
 * timer of an earlier ring replaced; `stop` takes the timer away, for a tab that goes.
 */
export function bellMark(mark: (terminal: string | null) => void): {
    ring: (terminal: string) => void;
    stop: () => void;
} {
    let timer: ReturnType<typeof setTimeout> | null = null;
    const stop = (): void => {
        if (timer !== null) clearTimeout(timer);
        timer = null;
    };
    const ring = (terminal: string): void => {
        stop();
        mark(terminal);
        timer = setTimeout(() => {
            timer = null;
            mark(null);
        }, BELL_MS);
    };
    return { ring, stop };
}

/**
 * The type a dragged row carries its terminal id under, which no other drag carries. A row dropped
 * on another Terminal tab's list, or on the body of one that draws no list, moves there.
 */
export const ROW_DRAG = 'application/x-oculus-terminal-row';

/**
 * The grid's font size: the configured size, else the body type scale times the reader's text
 * scale, read off the body since the scale is a CSS token. Undefined when neither gives a size.
 */
export function gridFontSize(chosen: number | null, scale: number): number | undefined {
    const configured = chosen ?? terminalFontPx();
    if (configured !== null) return configured;
    const root = getComputedStyle(document.body);
    const base = Number.parseFloat(/[\d.]+px/.exec(root.getPropertyValue('--fs-md'))?.[0] ?? '');
    const computed = base * scale;
    return Number.isFinite(computed) && computed >= 1 ? computed : undefined;
}

/**
 * The rows of one Terminal tab: the rows of the terminals the tab owns, in the tab's own order. A
 * terminal the tab owns that no row carries (one started and not listed yet, or one oculus did not
 * start) is passed over.
 */
export function tabRows<T extends { terminal: string }>(
    rows: readonly T[],
    owned: readonly string[]
): T[] {
    return owned
        .map((id) => rows.find((row) => row.terminal === id))
        .filter((row): row is T => row !== undefined);
}

/**
 * The order once one row was dropped before the row at `index` of the order as drawn (`index`
 * equal to the length drops it last). A row the order does not hold changes nothing.
 */
export function movedOrder(order: readonly string[], moved: string, index: number): string[] {
    const from = order.indexOf(moved);
    if (from < 0) return [...order];
    const rest = order.filter((id) => id !== moved);
    const at = Math.max(0, Math.min(rest.length, from < index ? index - 1 : index));
    return [...rest.slice(0, at), moved, ...rest.slice(at)];
}

/**
 * Whether the list is drawn: from two terminals on, and for one while the tab shows the composer,
 * since the bar then names no terminal and the row is the way to show, split or kill it.
 */
export function listDrawn(count: number, composer: boolean): boolean {
    return count >= 2 || (count === 1 && composer);
}

/** What a key pressed on a row of the list does to that row. */
export type RowAction = 'show' | 'split' | 'kill';

/**
 * The action one key asks of the row it is pressed on: Enter shows it, Shift+Enter splits it, and
 * Delete or Backspace kills it; these keys are the keyboard's way to Split and Kill, which the list
 * keeps out of the focus order. A Delete or Backspace the keyboard repeats while the key is held
 * asks nothing, so a held key cannot arm Kill and then fire it. Null for any other key, which the
 * roving rule may still answer.
 */
export function rowKey(key: string, shift: boolean, repeat: boolean): RowAction | null {
    if (key === 'Enter') return shift ? 'split' : 'show';
    if (key === 'Delete' || key === 'Backspace') return repeat ? null : 'kill';
    return null;
}

/**
 * The number of lines a paste holds when it holds a line break, which is the paste the grid asks
 * about before sending since a line break runs what comes before it, or null for a paste with no
 * line break, which goes through. A line break that ends the text closes its last line rather than
 * opening another, so one line ending in one is a paste of 1 line.
 */
export function pasteLines(text: string): number | null {
    if (!/[\r\n]/.test(text)) return null;
    const lines = text.split(/\r\n|\r|\n/);
    if (lines.length > 1 && lines[lines.length - 1] === '') lines.pop();
    return lines.length;
}

/** A drag over the grid: a file from the Files view may be dropped there, and nothing else. */
export function fileOver(event: DragEvent): void {
    if (event.dataTransfer?.types.includes(FILE_DRAG) === true) event.preventDefault();
}

/**
 * Hold every paste that holds a line break into a grid until it is answered. xterm takes a paste
 * from the browser's own paste event on its hidden textarea; this listener sits above it in the
 * capture phase, so such a paste is stopped before xterm sees it and handed to `held`, and a paste
 * with no line break goes on to xterm untouched. The returned function takes the listener off.
 */
export function holdPastes(
    host: HTMLElement,
    held: (paste: { text: string; lines: number }) => void
): () => void {
    const pasted = (event: ClipboardEvent) => {
        const text = event.clipboardData?.getData('text/plain') ?? '';
        const lines = pasteLines(text);
        if (lines === null) return;
        event.preventDefault();
        event.stopPropagation();
        held({ text, lines });
    };
    host.addEventListener('paste', pasted, true);
    return () => host.removeEventListener('paste', pasted, true);
}

/**
 * Open the grid's menu from the keyboard. xterm takes every key on its hidden textarea and stops
 * it there, so the context menu key and Shift+F10 would reach the shell and never the menu; this
 * listener sits above xterm in the capture phase, keeps those two keys from the shell, and raises
 * the right-click the menu opens on at the textarea, which xterm keeps at the cursor. The returned
 * function takes the listener off.
 */
export function holdMenuKeys(host: HTMLElement): () => void {
    const pressed = (event: KeyboardEvent) => {
        if (event.key !== 'ContextMenu' && !(event.shiftKey && event.key === 'F10')) return;
        const target = event.target;
        if (!(target instanceof Element)) return;
        event.preventDefault();
        event.stopPropagation();
        const rect = target.getBoundingClientRect();
        target.dispatchEvent(
            new MouseEvent('contextmenu', {
                bubbles: true,
                cancelable: true,
                clientX: rect.right,
                clientY: rect.top
            })
        );
    };
    host.addEventListener('keydown', pressed, true);
    return () => host.removeEventListener('keydown', pressed, true);
}

/**
 * A path as one word for a POSIX shell: wrapped in single quotes, inside which nothing is special,
 * and each single quote of its own written as close, escaped quote, open.
 */
export function shellQuote(path: string): string {
    return `'${path.replaceAll("'", "'\\''")}'`;
}

/**
 * A terminal's tooltip on its row and on the bar: its name, command, folder and start time, and for
 * a kept terminal whose line ended the status it ended with, as VS Code's terminal tab says it. A
 * field tmux reported no value for is left out rather than drawn with nothing after its name.
 */
export function terminalTip(
    held: Pick<Terminal, 'name' | 'command' | 'cwd' | 'created' | 'exit'>
): string {
    const lines = [
        held.name,
        held.command === '' ? '' : t('sessions.terminal_tip_command', held.command),
        held.cwd === '' ? '' : t('sessions.terminal_tip_folder', held.cwd),
        held.created === '' ? '' : t('sessions.terminal_tip_started', stamp(held.created)),
        held.exit === null ? '' : t('sessions.terminal_row_ended', held.exit)
    ];
    return lines.filter((line) => line !== '').join('\n');
}

type Words = (key: string, ...args: (string | number)[]) => string;

export const MENU_COPY = 'copy';
export const MENU_COPY_HTML = 'copy-html';
export const MENU_CLEAR = 'clear';
export const MENU_RENAME = 'rename';
export const MENU_ICON = 'icon';
export const MENU_PROMPT = 'prompt';
const COLOR_LIST = 'color';
const COLOR = 'color:';
export const MENU_PASTE = 'paste';
export const MENU_SELECT_ALL = 'select-all';
export const MENU_SPLIT = 'split';
export const MENU_KILL = 'kill';
export const MENU_UNSPLIT = 'unsplit';
export const MENU_NEW = 'new';
export const MENU_RERUN = 'rerun';
export const MENU_RESTART = 'restart';
const JOIN_LIST = 'join';
const JOIN = 'join:';
const ATTACH_LIST = 'attach';
const ATTACH = 'attach:';
const PROFILE_LIST = 'profile';
const PROFILE = 'profile:';

/** The kinds New Terminal With Profile offers, in the order its submenu lists them. */
const PROFILES: readonly ComposerAgent[] = ['shell', 'claude', 'codex'];

/**
 * The Kill Terminal item: while the terminal is armed it carries the armed control's label, so the
 * reader sees that this pick kills.
 */
export function killItem(armed: boolean, t: Words): MenuItem {
    return {
        id: MENU_KILL,
        label: armed ? t('sessions.terminal_kill_armed') : t('sessions.menu_kill')
    };
}

/**
 * Where a task terminal's line is: running, or ended; null for a terminal that is no task
 * terminal. Rerun is offered once the line ended, Restart always.
 */
export type TaskState = 'running' | 'ended' | null;

/** The task state of a terminal as the list carries it. */
export function taskStateOf(held: Pick<Terminal, 'task' | 'exit'> | null): TaskState {
    if (!held?.task) return null;
    return held.exit === null ? 'running' : 'ended';
}

/** Rerun and Restart, the items a task terminal has beside Split and Kill. */
function taskItems(task: TaskState, t: Words): MenuItem[] {
    if (task === null) return [];
    return [
        ...(task === 'ended' ? [{ id: MENU_RERUN, label: t('commands.rerun') }] : []),
        { id: MENU_RESTART, label: t('commands.restart') }
    ];
}

/**
 * Split Terminal, for a terminal whose folder oculus knows only, since a split starts the new
 * terminal in that folder.
 */
function splitItems(t: Words, splittable: boolean): MenuItem[] {
    return splittable ? [{ id: MENU_SPLIT, label: t('sessions.menu_split') }] : [];
}

/** The items the grid and a row both have: the row's own Split and Kill. */
function rowActions(armed: boolean, t: Words, splittable: boolean): MenuItem[] {
    return [...splitItems(t, splittable), killItem(armed, t)];
}

/** The words of each colour name, held to the colour list by its type. */
const COLOR_WORDS: Record<(typeof COLOR_NAMES)[number], (t: Words) => string> = {
    black: (t) => t('sessions.color_black'),
    red: (t) => t('sessions.color_red'),
    green: (t) => t('sessions.color_green'),
    yellow: (t) => t('sessions.color_yellow'),
    blue: (t) => t('sessions.color_blue'),
    magenta: (t) => t('sessions.color_magenta'),
    cyan: (t) => t('sessions.color_cyan'),
    white: (t) => t('sessions.color_white')
};

/** The words of one colour name, or of the default look for the empty name. */
export function colorLabel(name: string, t: Words): string {
    return Object.hasOwn(COLOR_WORDS, name)
        ? COLOR_WORDS[name as (typeof COLOR_NAMES)[number]](t)
        : t('sessions.style_default');
}

/** Rename, Change Icon and Change Color: the items that dress a terminal, on the grid and a row. */
function styleItems(t: Words): MenuItem[] {
    return [
        { id: MENU_RENAME, label: t('sessions.menu_rename') },
        { id: MENU_ICON, label: t('sessions.menu_icon') },
        {
            id: COLOR_LIST,
            label: t('sessions.menu_color'),
            items: ['', ...COLOR_NAMES].map((name) => ({
                id: `${COLOR}${name}`,
                label: colorLabel(name, t)
            }))
        }
    ];
}

/**
 * The grid's items: Copy and Copy as HTML while it holds a selection, Paste, Select All, Clear,
 * then Split (for a terminal whose folder oculus knows), Rename, Change Icon, Change Color and
 * Kill, Kill with its armed label while the grid's terminal is armed.
 */
export function gridMenu(
    selected: boolean,
    armed: boolean,
    t: Words,
    task: TaskState = null,
    splittable = true
): MenuItem[] {
    return grouped([
        [
            ...(selected
                ? [
                      { id: MENU_COPY, label: t('sessions.menu_copy') },
                      { id: MENU_COPY_HTML, label: t('sessions.menu_copy_html') }
                  ]
                : []),
            { id: MENU_PASTE, label: t('sessions.menu_paste') },
            { id: MENU_SELECT_ALL, label: t('sessions.menu_select_all') }
        ],
        [{ id: MENU_CLEAR, label: t('sessions.menu_clear') }],
        taskItems(task, t),
        [...splitItems(t, splittable), ...styleItems(t), killItem(armed, t)]
    ]);
}

/**
 * Where a paste from the menu goes: a text of several lines is held for the question a browser
 * paste of it is asked, with its line count, and a text of one line is sent as it is.
 */
export function pasteRoute(text: string): { ask: number } | { send: string } {
    const lines = pasteLines(text);
    return lines === null ? { send: text } : { ask: lines };
}

/** Whether a terminal is in a row of more than one, which Unsplit Terminal takes out of it. */
function inShownRow(tab: TerminalTabState, terminal: string): boolean {
    return tab.row.length > 1 && tab.row.includes(terminal);
}

/**
 * A row's items: Rerun (once a task terminal's line ended) and Restart for a task terminal, Split
 * Terminal (for a terminal whose folder oculus knows) and Kill Terminal, Kill with its armed label
 * while the row's terminal is armed; Rename, Change Icon, Change Color and Clear; then Unsplit
 * Terminal on a terminal of the row the tab shows, and Join Terminals, a submenu of the terminals
 * other Terminal tabs own, each by the name it is handed.
 */
export function terminalRowMenu(
    tab: TerminalTabState,
    terminal: string,
    others: readonly { terminal: string; title: string }[],
    armed: boolean,
    t: Words,
    task: TaskState = null,
    splittable = true
): MenuItem[] {
    const joins = others.map((one) => ({ id: `${JOIN}${one.terminal}`, label: one.title }));
    return grouped([
        [...taskItems(task, t), ...rowActions(armed, t, splittable)],
        [...styleItems(t), { id: MENU_CLEAR, label: t('sessions.menu_clear') }],
        [
            ...(inShownRow(tab, terminal)
                ? [{ id: MENU_UNSPLIT, label: t('sessions.menu_unsplit') }]
                : []),
            ...(joins.length > 0
                ? [{ id: JOIN_LIST, label: t('sessions.menu_join'), items: joins }]
                : [])
        ]
    ]);
}

/** A terminal as a menu lists it: its id and the name it is listed by. */
export type Attachable = { terminal: string; title: string };

/**
 * The terminals the Terminal tabs in `tabs` own other than `self`'s, each by its name, which Join
 * Terminals on a menu offers to move into `self`. A terminal started elsewhere (`foreign`) is not
 * one of them.
 */
export function ownedElsewhere(
    tabs: readonly { id: string; view: string; state: unknown }[],
    self: string,
    terminalById: (id: string) => Terminal | null
): Attachable[] {
    return tabs
        .filter((one) => one.view === TERMINAL_VIEW && one.id !== self)
        .flatMap((one) => tabTerminals(one.state))
        .map((id) => terminalById(id))
        .filter((one): one is Terminal => one !== null && one.foreign !== true)
        .map((one) => ({ terminal: one.id, title: one.name }));
}

/**
 * Attach to Session: a submenu of the running terminals no Terminal tab owns, each by the name it
 * is handed, in the order handed; no item at all while there is none.
 */
function attachItems(attachable: readonly Attachable[], t: Words): MenuItem[] {
    if (attachable.length === 0) return [];
    return [
        {
            id: ATTACH_LIST,
            label: t('sessions.menu_attach'),
            items: attachable.map((one) => ({ id: `${ATTACH}${one.terminal}`, label: one.title }))
        }
    ];
}

/**
 * The kinds the bar's dropdown lists, then With a Prompt, which shows the composer, then Attach to
 * Session over the running terminals no Terminal tab owns.
 */
export function kindsMenu(t: Words, attachable: readonly Attachable[]): MenuItem[] {
    return grouped([
        PROFILES.map((kind) => ({ id: `${PROFILE}${kind}`, label: kindLabel(kind, t) })),
        [{ id: MENU_PROMPT, label: t('sessions.menu_with_prompt') }],
        attachItems(attachable, t)
    ]);
}

/** The words of one kind of terminal. */
export function kindLabel(kind: ComposerAgent, t: Words): string {
    if (kind === 'claude') return t('sessions.kind_claude');
    if (kind === 'codex') return t('sessions.kind_codex');
    return t('sessions.kind_shell');
}

/**
 * The list's empty area: New Terminal, New Terminal With Profile over the kinds, and Attach to
 * Session over the running terminals no Terminal tab owns.
 */
export function emptyListMenu(t: Words, attachable: readonly Attachable[]): MenuItem[] {
    return [
        { id: MENU_NEW, label: t('sessions.menu_new') },
        {
            id: PROFILE_LIST,
            label: t('sessions.menu_new_profile'),
            items: PROFILES.map((kind) => ({
                id: `${PROFILE}${kind}`,
                label: kindLabel(kind, t)
            }))
        },
        ...attachItems(attachable, t)
    ];
}

/** The terminal a Join Terminals pick names, or null for any other item. */
export function joinedOf(id: string): string | null {
    return id.startsWith(JOIN) && id.length > JOIN.length ? id.slice(JOIN.length) : null;
}

/**
 * What each item of a terminal's menu does, given the terminal the menu was opened on. A list row
 * and the bar's name of a sole terminal open the same menu (`terminalRowMenu`) and route a pick
 * through the same `routePick`, so a pick means one thing wherever it is made.
 */
export type PickHandlers = {
    /** Split Terminal: one of the terminal's kind starts right of it. */
    split: (terminal: string) => void;
    /** Kill Terminal: arms the terminal, and kills it on the second pick. */
    kill: (terminal: string) => void;
    /** Unsplit Terminal: the terminal leaves the row the tab draws. */
    unsplit: (terminal: string) => void;
    /** Rename: the inline field opens. */
    rename: (terminal: string) => void;
    /** Change Icon: the glyph list opens. */
    icon: (terminal: string) => void;
    /** Clear: the grid and the terminal's history empty. */
    clear: (terminal: string) => void;
    /** Change Color: a colour name, or the empty string for Default. */
    color: (terminal: string, color: string) => void;
    /** Join Terminals: the terminal another tab owns moves in beside `terminal`. */
    join: (terminal: string, moving: string) => void;
    /** Rerun: the ended line of a task terminal runs again in the same terminal. */
    rerun: (terminal: string) => void;
    /** Restart: the line of a task terminal stops if it runs, and runs again. */
    restart: (terminal: string) => void;
};

/**
 * Do what a pick of a terminal's menu means to `terminal`, the one the menu was opened on. An id
 * no item of the menu carries, and the heading of the colour and join lists, do nothing.
 */
export function routePick(pick: string, terminal: string, handlers: PickHandlers): void {
    const joining = joinedOf(pick);
    const color = colorOf(pick);
    if (joining !== null) handlers.join(terminal, joining);
    else if (color !== null) handlers.color(terminal, color);
    else if (pick === MENU_SPLIT) handlers.split(terminal);
    else if (pick === MENU_KILL) handlers.kill(terminal);
    else if (pick === MENU_UNSPLIT) handlers.unsplit(terminal);
    else if (pick === MENU_RENAME) handlers.rename(terminal);
    else if (pick === MENU_ICON) handlers.icon(terminal);
    else if (pick === MENU_CLEAR) handlers.clear(terminal);
    else if (pick === MENU_RERUN) handlers.rerun(terminal);
    else if (pick === MENU_RESTART) handlers.restart(terminal);
}

/** The terminal an Attach to Session pick names, or null for any other item. */
export function attachedOf(id: string): string | null {
    return id.startsWith(ATTACH) && id.length > ATTACH.length ? id.slice(ATTACH.length) : null;
}

/**
 * The colour a Change Color pick names: a colour name, the empty string for Default, or null for
 * any other item.
 */
export function colorOf(id: string): string | null {
    if (!id.startsWith(COLOR)) return null;
    const name = id.slice(COLOR.length);
    return name === '' || (COLOR_NAMES as readonly string[]).includes(name) ? name : null;
}

/** The kind a New Terminal With Profile pick names, or null for any other item. */
export function profileOf(id: string): ComposerAgent | null {
    if (!id.startsWith(PROFILE)) return null;
    return PROFILES.find((kind) => `${PROFILE}${kind}` === id) ?? null;
}

/** How many matches the search addon marks, its own default; the count says more as `1000+`. */
export const FIND_LIMIT = 1000;

/** What the search addon reports after a search: the active match's index and the count. */
export type FindResults = { resultIndex: number; resultCount: number };

/**
 * The find bar's count, as VS Code's find widget words it: "No results", else the active match's
 * place and the count, "3 of 12". A place the addon does not know (-1, past its limit) is the
 * catalog's `?`, and a count at the limit reads as the limit and a plus, in the catalog's words.
 */
export function findCount(results: FindResults | null, t: Words): string {
    if (results === null || results.resultCount <= 0) return t('sessions.find_none');
    const place =
        results.resultIndex >= 0
            ? String(results.resultIndex + 1)
            : t('sessions.find_place_unknown');
    const count =
        results.resultCount >= FIND_LIMIT
            ? t('sessions.find_over_limit', FIND_LIMIT)
            : results.resultCount;
    return t('sessions.find_count', place, count);
}

/** The find bar's three toggles. */
export type FindToggles = { matchCase: boolean; wholeWord: boolean; regex: boolean };

/**
 * Whether the search addon could not compile the find text: with Use Regular Expression on, a text
 * that is no regular expression (`(`, `[a`) throws a SyntaxError out of the addon, which compiles
 * it with these flags, at every search until the pattern closes. The bar then shows no results,
 * as VS Code's does. A plain text search compiles nothing and is never refused.
 */
export function findUnparsable(term: string, toggles: FindToggles): boolean {
    if (!toggles.regex) return false;
    try {
        new RegExp(term, toggles.matchCase ? 'g' : 'gi');
        return false;
    } catch (error) {
        if (error instanceof SyntaxError) return true;
        throw error;
    }
}

/**
 * The options a search runs with: the three toggles in the addon's names, and the match colours,
 * without which the addon neither marks every match nor reports a count.
 */
export function findOptions(
    toggles: FindToggles,
    colours: NonNullable<ISearchOptions['decorations']>
): ISearchOptions {
    return {
        caseSensitive: toggles.matchCase,
        wholeWord: toggles.wholeWord,
        regex: toggles.regex,
        decorations: colours
    };
}

/** What a key does to the find: open the bar, move to a match, or close it. */
export type FindAction = 'open' | 'next' | 'previous' | 'close';

/** The keys and the modifiers a find key is read from. */
type FindPress = Pick<KeyboardEvent, 'key' | 'shiftKey' | 'metaKey' | 'ctrlKey' | 'altKey'>;

/**
 * The find key a press is, as VS Code's terminal find binds them: Cmd+F (Ctrl+F off macOS) opens
 * the bar; while it is open, F3 and Cmd+G find the next match and Shift+F3 and Cmd+Shift+G the
 * previous (Cmd+G on macOS alone, where Ctrl+G stays the shell's), and Escape closes it. In the
 * bar's text box Enter also finds the previous match and Shift+Enter the next, since the search
 * runs upward from the bottom of the output; at the grid Enter is the shell's. Null for any
 * other press, which then goes where it was going.
 */
export function findKey(
    press: FindPress,
    at: { mac: boolean; where: 'grid' | 'bar'; open: boolean }
): FindAction | null {
    const mod = at.mac ? press.metaKey && !press.ctrlKey : press.ctrlKey && !press.metaKey;
    const plain = !press.metaKey && !press.ctrlKey && !press.altKey;
    const key = press.key.toLowerCase();
    if (mod && !press.altKey && !press.shiftKey && key === 'f') return 'open';
    if (!at.open) return null;
    if (plain && key === 'f3') return press.shiftKey ? 'previous' : 'next';
    if (at.mac && mod && !press.altKey && key === 'g') return press.shiftKey ? 'previous' : 'next';
    if (plain && !press.shiftKey && key === 'escape') return 'close';
    if (at.where === 'bar' && plain && key === 'enter') return press.shiftKey ? 'next' : 'previous';
    return null;
}

/**
 * The web links addon's handler: a URL in the output opens in a new browser tab on Cmd+click
 * (Ctrl+click off macOS), as VS Code opens a detected link, and a plain click stays the program's.
 * Only an `http:` or `https:` address opens; the addon's rule finds those alone, and the check
 * here keeps anything else it might hand over from reaching the browser.
 */
export function linkHandler(
    mac: boolean,
    open: (url: string) => void
): (event: Pick<MouseEvent, 'metaKey' | 'ctrlKey'>, uri: string) => void {
    return (event, uri) => {
        if (!(mac ? event.metaKey : event.ctrlKey)) return;
        let protocol: string;
        try {
            protocol = new URL(uri).protocol;
        } catch {
            return;
        }
        if (protocol === 'http:' || protocol === 'https:') open(uri);
    };
}
