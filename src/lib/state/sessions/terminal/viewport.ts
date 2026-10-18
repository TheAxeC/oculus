// Layer 2, client state. The viewport a terminal keeps while its grid is torn down and drawn again:
// Float and Return to Page draw the Terminal view in another host, a pane move draws the grid
// again, and a reload of the page draws every grid anew, so the grid mounts a new xterm and
// repaints it from the scrollback the server sends. The line the viewport sat at, counted from the
// top and from the end, the text of its first lines, and whether it sat at the end are kept per
// terminal when the grid goes, and when the page is put away for a reload, and the next grid
// scrolls to that line once the scrollback it is sent has been written, or stays at the end when
// the viewport sat there.
//
// The line is found again by its text: the scrollback a new grid is sent need not start where the
// last grid's buffer did, so a count of lines from the top can name another line. The kept lines
// are looked for nearest the place the count from the end names, and the count from the top is used
// when no line of the new buffer holds them. The viewports are kept in the browser tab's
// `sessionStorage` as well (`ViewportKeeper`), since a reload empties the page's memory and closes
// no terminal.

/**
 * Where a terminal's viewport sat: its top line counted from the top (`line`) and from the last
 * viewport position (`fromEnd`), whether it was on the last line, and the text of its first lines
 * (`text`, the top line first), each without its trailing blanks.
 */
export type Viewport = { line: number; atEnd: boolean; fromEnd: number; text: string[] };

/** How many lines from the top of a viewport its text keeps. */
export const KEPT_LINES = 5;

/**
 * The viewport of a terminal whose top line is `line` of a buffer whose last viewport position is
 * `last` (xterm's `viewportY` and `baseY`), its first lines reading `text`. A terminal with no
 * scrollback is at its end.
 */
export function viewportOf(line: number, last: number, text: string[] = []): Viewport {
    return { line, atEnd: line >= last, fromEnd: Math.max(0, last - line), text };
}

/** Whether the lines from `at` on read the kept text. */
function readsAt(at: number, text: string[], lineText: (index: number) => string | null): boolean {
    return text.every((one, step) => lineText(at + step) === one);
}

/**
 * The line a grid scrolls to once the scrollback is written, `last` being its last viewport
 * position and `lineText` the text of a line of its buffer (null past its end): the line whose text
 * and the lines under it read as the kept ones, the one nearest the kept count from the end when
 * several do, else the kept line counted from the top, never past `last`; and `last` itself for a
 * terminal that sat at its end and for one with nothing kept.
 */
export function scrollTarget(
    kept: Viewport | undefined,
    last: number,
    lineText: (index: number) => string | null = () => null
): number {
    if (kept === undefined || kept.atEnd) return last;
    if (kept.text.some((one) => one !== '')) {
        const near = Math.max(0, last - kept.fromEnd);
        for (let away = 0; away <= last; away += 1) {
            for (const at of away === 0 ? [near] : [near - away, near + away]) {
                if (at >= 0 && at <= last && readsAt(at, kept.text, lineText)) return at;
            }
        }
    }
    return Math.min(kept.line, last);
}

/** Where the kept viewports are held across a reload: read once, written on each change. */
export type ViewportKeeper = {
    read: () => Record<string, Viewport>;
    write: (kept: Record<string, Viewport>) => void;
};

/** The key the viewports are kept under in the browser tab's `sessionStorage`. */
const VIEWPORTS_KEY = 'oculus.terminal-viewports';

/** A viewport as storage handed it back, or null for anything else. */
function viewportFrom(held: unknown): Viewport | null {
    if (held === null || typeof held !== 'object') return null;
    const { line, atEnd, fromEnd, text } = held as Partial<Viewport>;
    if (typeof line !== 'number' || typeof atEnd !== 'boolean' || typeof fromEnd !== 'number') {
        return null;
    }
    const lines = Array.isArray(text) ? text.filter((one) => typeof one === 'string') : [];
    return { line, atEnd, fromEnd, text: lines };
}

/** The keeper over the browser tab's `sessionStorage`, and null where the page has none. */
function sessionViewports(): ViewportKeeper | null {
    if (typeof sessionStorage === 'undefined') return null;
    return {
        read: () => {
            try {
                const held: unknown = JSON.parse(sessionStorage.getItem(VIEWPORTS_KEY) ?? '{}');
                if (held === null || typeof held !== 'object') return {};
                return Object.fromEntries(
                    Object.entries(held).flatMap(([id, one]) => {
                        const viewport = viewportFrom(one);
                        return viewport === null ? [] : [[id, viewport]];
                    })
                );
            } catch {
                return {};
            }
        },
        write: (kept) => {
            try {
                sessionStorage.setItem(VIEWPORTS_KEY, JSON.stringify(kept));
            } catch {
                // A refused storage forgets the viewports at the next reload and nothing else.
            }
        }
    };
}

/** The viewports kept, one per terminal, each handed over once. */
export function createViewports(keeper: ViewportKeeper | null = sessionViewports()): {
    keep: (id: string, viewport: Viewport) => void;
    take: (id: string) => Viewport | undefined;
    drop: (id: string) => void;
} {
    const kept = new Map<string, Viewport>(Object.entries(keeper?.read() ?? {}));
    const written = (): void => keeper?.write(Object.fromEntries(kept));
    return {
        keep: (id, viewport) => {
            kept.set(id, viewport);
            written();
        },
        take: (id) => {
            const found = kept.get(id);
            if (kept.delete(id)) written();
            return found;
        },
        drop: (id) => {
            if (kept.delete(id)) written();
        }
    };
}
