// Layer 3, view helper. The rules the Terminal view's list and grid go by: whether the list is
// drawn, the rows of one tab in the tab's order, the key a row answers, how long an armed Kill
// stays armed, a dragged row's new place, the drag a row carries, the grid's font size, the line
// count a paste is asked about and the listener that holds such a paste, the file drag the grid
// takes, a dropped path quoted for the shell, a terminal's tooltip, the items of the view's
// right-click menus, the find bar's count, options and keys, and the handler a link in the grid
// opens by. The pure ones are here rather than in the components so each is asserted
// without a DOM, which the grid's paste, drop and drag need to happen at all.
//
// The right-click menus are VS Code's terminal menus, with the items oculus runs: the grid's (Copy
// while it holds a selection, Paste, Select All, then Split Terminal and Kill Terminal as the
// list's controls do), a list row's (Split Terminal and Kill Terminal, Unsplit Terminal on a half
// of the split the tab shows, Join Terminals over the terminals other Terminal tabs own) and the
// list's empty area's (New Terminal, and New Terminal With Profile over the kinds the composer
// starts). Kill Terminal goes through the row's Kill (`pressKill`): the first pick arms the
// terminal and the item then reads as the armed control does, and a second pick or press kills
// it. The context menu key and Shift+F10 open the grid's menu, which xterm would otherwise
// send to the shell (`holdMenuKeys`). Every label is `t(...)` of a catalog key, except a terminal's
// own name in Join Terminals, which is passed through as the list hands it.

import type { ISearchOptions } from '@xterm/addon-search';
import { FILE_DRAG } from '$lib/state/sources/fs';
import { grouped, type MenuItem } from '$lib/ui/menu/menu-items';
import { splitDrawn, type TerminalTabState } from '$lib/state/sessions/terminal/terminal-tabs';
import type { ComposerAgent } from '$lib/state/sessions/terminal/composer';
import { stamp } from '$lib/state/shared/words/format';
import { t } from '$lib/state/shared/words/text';
import { terminalFontPx } from '$lib/state/shared/words/appearance';
import type { Terminal } from '$lib/state/sessions/terminals.svelte';

/** How long a bell marks its row, which is VS Code's `terminal.integrated.bellDuration` default. */
export const BELL_MS = 1000;

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
 * Whether an armed Kill stays armed when the keyboard's stop moves: only while its row is still
 * the stop, so a second Delete or Backspace kills the row the first one armed and no other. Focus
 * leaving the list disarms it as well, which the list does on its focusout.
 */
export function armKept(armed: string, stop: string): boolean {
    return armed !== '' && armed === stop;
}

/**
 * The number of lines a paste holds when it holds a line break, which is the paste the grid asks
 * about before sending, or null for a paste of one line, which goes through. A line break that ends
 * the text closes its last line rather than opening another.
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
 * Hold every paste of several lines into a grid until it is answered. xterm takes a paste from the
 * browser's own paste event on its hidden textarea; this listener sits above it in the capture
 * phase, so a paste of several lines is stopped before xterm sees it and handed to `held`, and a
 * paste of one line goes on to xterm untouched. The returned function takes the listener off.
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

/** A terminal's tooltip on its row and on the bar: its name, command, folder and start time. */
export function terminalTip(held: Pick<Terminal, 'name' | 'command' | 'cwd' | 'created'>): string {
    return t('sessions.terminal_row_tip', held.name, held.command, held.cwd, stamp(held.created));
}

type Words = (key: string, ...args: (string | number)[]) => string;

export const MENU_COPY = 'copy';
export const MENU_PASTE = 'paste';
export const MENU_SELECT_ALL = 'select-all';
export const MENU_SPLIT = 'split';
export const MENU_KILL = 'kill';
export const MENU_UNSPLIT = 'unsplit';
export const MENU_NEW = 'new';
const JOIN_LIST = 'join';
const JOIN = 'join:';
const PROFILE_LIST = 'profile';
const PROFILE = 'profile:';

/** The kinds New Terminal With Profile offers, in the order its submenu lists them. */
const PROFILES: readonly ComposerAgent[] = ['shell', 'claude', 'codex'];

/**
 * What a press of a row's Kill, a Delete or Backspace on the row, or a pick of Kill Terminal from
 * the grid's or the row's menu does: a terminal not armed is armed, and the armed one is stopped,
 * the arm taken off first. A refusal of the stop is handed to `fail`.
 */
export async function pressKill(
    armed: string,
    terminal: string,
    deps: {
        arm: (terminal: string) => void;
        stop: (terminal: string) => Promise<{ ok: boolean; error: string }>;
        fail: (error: string) => void;
    }
): Promise<void> {
    if (armed !== terminal) {
        deps.arm(terminal);
        return;
    }
    deps.arm('');
    deps.fail('');
    const answer = await deps.stop(terminal);
    if (!answer.ok) deps.fail(answer.error);
}

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

/** The two items the grid and a row both end with: the row's own Split and Kill. */
function rowActions(armed: boolean, t: Words): MenuItem[] {
    return [{ id: MENU_SPLIT, label: t('sessions.menu_split') }, killItem(armed, t)];
}

/**
 * The grid's items: Copy while it holds a selection, Paste, Select All, Split and Kill, Kill with
 * its armed label while the grid's terminal is armed.
 */
export function gridMenu(selected: boolean, armed: boolean, t: Words): MenuItem[] {
    return grouped([
        [
            ...(selected ? [{ id: MENU_COPY, label: t('sessions.menu_copy') }] : []),
            { id: MENU_PASTE, label: t('sessions.menu_paste') },
            { id: MENU_SELECT_ALL, label: t('sessions.menu_select_all') }
        ],
        rowActions(armed, t)
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

/** Whether a row is a half of the split its tab shows, which Unsplit Terminal shows alone. */
function inShownSplit(tab: TerminalTabState, terminal: string): boolean {
    if (!splitDrawn(tab)) return false;
    return terminal === tab.shown || (!tab.composing && terminal === tab.beside);
}

/**
 * A row's items: Split Terminal and Kill Terminal, Kill with its armed label while the row's
 * terminal is armed; then Unsplit Terminal on a half of the split
 * the tab shows, and Join Terminals, a submenu of the terminals other Terminal tabs own, each by
 * the name it is handed.
 */
export function terminalRowMenu(
    tab: TerminalTabState,
    terminal: string,
    others: readonly { terminal: string; title: string }[],
    armed: boolean,
    t: Words
): MenuItem[] {
    const joins = others.map((one) => ({ id: `${JOIN}${one.terminal}`, label: one.title }));
    return grouped([
        rowActions(armed, t),
        [
            ...(inShownSplit(tab, terminal)
                ? [{ id: MENU_UNSPLIT, label: t('sessions.menu_unsplit') }]
                : []),
            ...(joins.length > 0
                ? [{ id: JOIN_LIST, label: t('sessions.menu_join'), items: joins }]
                : [])
        ]
    ]);
}

/** The list's empty area: New Terminal, and New Terminal With Profile over the composer's kinds. */
export function emptyListMenu(t: Words): MenuItem[] {
    return [
        { id: MENU_NEW, label: t('sessions.menu_new') },
        {
            id: PROFILE_LIST,
            label: t('sessions.menu_new_profile'),
            items: [
                { id: `${PROFILE}shell`, label: t('sessions.kind_shell') },
                { id: `${PROFILE}claude`, label: t('sessions.kind_claude') },
                { id: `${PROFILE}codex`, label: t('sessions.kind_codex') }
            ]
        }
    ];
}

/** The terminal a Join Terminals pick names, or null for any other item. */
export function joinedOf(id: string): string | null {
    return id.startsWith(JOIN) && id.length > JOIN.length ? id.slice(JOIN.length) : null;
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
