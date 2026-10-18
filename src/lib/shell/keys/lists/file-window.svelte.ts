// Layer 3, shell, partial of shell/keys/rows/FileRows.svelte. How many of the file mode's rows the
// list draws. A query's answer holds up to 200 files, and each row drawn is a Command item holding
// a button with its tooltip and a file icon, so drawing every row of each answer is work the reader
// waits for at each keystroke. The list draws a page: as many rows as fit between the list's top
// and the window's foot at the row's pitch, and FILE_OVERSCAN more, so the rows in view are drawn
// whatever the palette's height. The rows after the page are drawn a page at a time, as the reader
// scrolls to them or moves the selection near the last row drawn, and all at once for a key that
// moves the selection to the last row. Each new answer starts again at one page. Until the pitch is
// read the page is two overscans, as the first window of ui/tree/list/virtual.ts is.

/**
 * How many rows past the window's height a page holds, and how near the last row drawn a key that
 * moves the selection down draws the next page.
 */
export const FILE_OVERSCAN = 5;

export type FileWindow = {
    /** How many of the answer's rows are drawn. */
    shown: () => number;
    /** Draw the next page of rows. */
    more: () => void;
    /** Draw every row of the answer. */
    all: () => void;
    /** Count the page from a row's pitch and the height the list has room for, both in px. */
    measure: (pitch: number, height: number) => void;
};

/** The rows of `rows()` the list draws, one page from each new answer on. */
export function createFileWindow(rows: () => readonly unknown[]): FileWindow {
    let page = $state(FILE_OVERSCAN * 2);
    let shown = $derived(Math.min(rows().length, page));
    return {
        shown: () => shown,
        more: () => {
            shown = Math.min(rows().length, shown + page);
        },
        all: () => {
            shown = rows().length;
        },
        measure: (pitch, height) => {
            if (pitch <= 0 || height <= 0) return;
            const next = Math.ceil(height / pitch) + FILE_OVERSCAN;
            if (next !== page) page = next;
        }
    };
}
