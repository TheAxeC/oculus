// Layer 3, view helper. The grid actions that reach outside the grid, written over what they are
// handed so a test gives them fakes: Clear, which empties the grid and asks the server to empty the
// terminal's history, and Copy as HTML, which writes the selection to the clipboard as `text/html`
// (from the serialize addon) beside its plain text. Each answers the failure in words, or the empty
// string when it worked, and the tab says a failure on its bar. A paste reads the clipboard's text
// here too, and a read the browser refuses is an empty text. Copy on selection, which the grid does
// as the selection changes with nobody asking, answers nothing and says nothing: a clipboard that
// is missing or refuses is left alone.

import { t } from '$lib/state/shared/words/text';

/** What Clear needs of the grid: xterm's `clear()`. */
export type Clearable = { clear: () => void };

/** What Clear needs of the store: `clearHistory`, which answers ok or the server's refusal. */
export type HistoryClear = (id: string) => Promise<{ ok: boolean; error: string }>;

/**
 * Empty the grid, then the terminal's tmux history, so a reattach does not paint it back. The
 * server's refusal is the failure; the grid is emptied either way.
 */
export async function clearGrid(
    grid: Clearable,
    id: string,
    clearHistory: HistoryClear
): Promise<string> {
    grid.clear();
    const answer = await clearHistory(id);
    return answer.ok ? '' : answer.error;
}

/** What Copy as HTML needs of the serialize addon. */
export type HtmlSerializer = {
    serializeAsHTML: (options?: { onlySelection?: boolean }) => string;
};

/** What Copy as HTML needs of the clipboard: the async clipboard's `write`. */
export type ClipboardWriter = { write: (items: never[]) => Promise<void> };

/** The clipboard item constructor of the browser: parts by media type. */
export type ClipboardItemMaker = new (parts: Record<string, Blob>) => unknown;

/**
 * Write the grid's selection as HTML with its plain text beside it. A browser without
 * `ClipboardItem` or without a clipboard, and a clipboard that refuses the write, are a failure in
 * words rather than a silent nothing.
 */
export async function copyAsHtml(
    serializer: HtmlSerializer,
    plain: string,
    clipboard: ClipboardWriter | undefined,
    Item: ClipboardItemMaker | undefined
): Promise<string> {
    if (clipboard === undefined || Item === undefined) return t('sessions.copy_html_failed');
    const html = serializer.serializeAsHTML({ onlySelection: true });
    try {
        const item = new Item({
            'text/html': new Blob([html], { type: 'text/html' }),
            'text/plain': new Blob([plain], { type: 'text/plain' })
        });
        await clipboard.write([item] as never[]);
        return '';
    } catch {
        return t('sessions.copy_html_failed');
    }
}

/** What copy on selection needs of the clipboard: the async clipboard's `writeText`. */
export type SelectionClipboard = { writeText: (text: string) => Promise<void> };

/**
 * Write a selection to the clipboard. An empty selection writes nothing, and a clipboard that is
 * missing, throws or refuses is left alone, since the copy is nobody's request.
 */
export function copySelection(text: string, clipboard: SelectionClipboard | undefined): void {
    if (text === '' || clipboard === undefined) return;
    try {
        clipboard.writeText(text).catch(() => undefined);
    } catch {
        // a clipboard that throws at once is left alone as one that refuses is
    }
}

/** The browser's clipboard, or nothing where the page has none. */
export function pageClipboard(): Clipboard | undefined {
    return typeof navigator === 'undefined' ? undefined : navigator.clipboard;
}

/** The clipboard's text for a paste; empty where the page has no clipboard or refuses the read. */
export async function clipboardText(): Promise<string> {
    try {
        return (await pageClipboard()?.readText()) ?? '';
    } catch {
        return '';
    }
}
