// Layer 3, view helper. The rules the Terminal view's list and grid go by: whether the list is
// drawn, the order the rows are drawn in, the key a row answers, how long an armed Kill stays
// armed, a dragged row's new place, the order the page keeps, the line count a paste is asked about
// and the listener that holds such a paste, the file drag the grid takes, a dropped path quoted for
// the shell and a terminal's tooltip. The pure ones are here rather than in the components so each
// is asserted without a DOM, which the grid's paste, drop and drag need to happen at all.

import { FILE_DRAG } from '$lib/state/sources/fs';
import { stamp } from '$lib/state/shared/words/format';
import { t } from '$lib/state/shared/words/text';
import type { Terminal } from '$lib/state/sessions/terminals.svelte';

/** How long a bell marks its row, which is VS Code's `terminal.integrated.bellDuration` default. */
export const BELL_MS = 1000;

/** The field of the page's stored state for the Terminal view that holds the reader's order. */
const ORDER_FIELD = 'order';

/**
 * The reader's order out of what the page keeps for the Terminal view: the terminal ids it names,
 * each once, and none from a value that is not the view's own record.
 */
export function storedOrder(state: unknown): string[] {
    if (typeof state !== 'object' || state === null || Array.isArray(state)) return [];
    const held = (state as Record<string, unknown>)[ORDER_FIELD];
    if (!Array.isArray(held)) return [];
    const ids = held.filter((one): one is string => typeof one === 'string' && one !== '');
    return [...new Set(ids)];
}

/** What the page keeps for the Terminal view once the reader's order has changed. */
export function withOrder(state: unknown, order: readonly string[]): Record<string, unknown> {
    const held =
        typeof state === 'object' && state !== null && !Array.isArray(state)
            ? (state as Record<string, unknown>)
            : {};
    return { ...held, [ORDER_FIELD]: [...order] };
}

/**
 * The rows in the order they are drawn: the ones the stored order names first, in its order, then
 * the rest in the order their terminals were started. An id the stored order names that no row
 * carries any more is passed over.
 */
export function orderedRows<T extends { terminal: string; created: string }>(
    rows: readonly T[],
    stored: readonly string[]
): T[] {
    const started = [...rows].sort((a, b) => a.created.localeCompare(b.created));
    const named = stored
        .map((id) => started.find((row) => row.terminal === id))
        .filter((row): row is T => row !== undefined);
    return [...named, ...started.filter((row) => !named.includes(row))];
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
