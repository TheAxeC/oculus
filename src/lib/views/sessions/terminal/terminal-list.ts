// Layer 3, view helper. The rules the Terminal view's list and grid go by: whether the list is
// drawn, the rows of one tab in the tab's order, the key a row answers, how long an armed Kill
// stays armed, a dragged row's new place, the drag a row carries, the grid's font size, the line
// count a paste is asked about and the listener that holds such a paste, the file drag the grid
// takes, a dropped path quoted for the shell and a terminal's tooltip. The pure ones are here
// rather than in the components so each is asserted without a DOM, which the grid's paste, drop and
// drag need to happen at all.

import { FILE_DRAG } from '$lib/state/sources/fs';
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
