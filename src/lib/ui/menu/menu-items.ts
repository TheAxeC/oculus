// Layer 3, primitive. The menu's contract: what one choice holds, how choices fall under
// headings, and where a rule is drawn between VS Code's groups. Apart from the components so a
// caller builds its choices without importing one. Beside it, how the two openers' lists close:
// Menu.svelte's and ContextMenu.svelte's, on bits-ui.

import { focusQuietly } from '../frame/quiet-focus';

/**
 * One choice in the list. `active` marks the one in force, which the menu shows as checked, and
 * `glyph` is a name in `glyphs:` drawn before the words, for a list whose choices are things
 * that have an icon of their own.
 */
export type MenuItem = {
    id: string;
    label: string;
    /** The item's hover words, when they say more than its label. */
    title?: string;
    active?: boolean;
    glyph?: string;
    /** A hue name from state/shared/words/tones.ts, drawn as a dot before the label. */
    tone?: string;
    /** Live text drawn at the end of the item; an empty string draws no badge. */
    badge?: string;
    /** A glyph name drawn in the badge before its text. */
    badgeGlyph?: string;
    /** A hue name from state/shared/words/tones.ts; absent uses the accent pair. */
    badgeTone?: string;
    /** The badge's hover words. */
    badgeTitle?: string;
    /**
     * The choices this one stands for, opened to its side as a submenu, as VS Code's are: this
     * choice is the submenu's trigger and is never a pick itself, and picking one of them is what
     * the caller is told of.
     */
    items?: MenuItem[];
    /**
     * Draw a rule above this choice, as VS Code draws a line between its menu groups. The list's
     * first choice draws none, so a rule is never the list's first or last line.
     */
    rule?: boolean;
};

/** Whether the choice at `index` draws a rule above it: it asks for one and is not the first. */
export function ruleAbove(items: readonly MenuItem[], index: number): boolean {
    return index > 0 && items[index]?.rule === true;
}

/**
 * One list out of VS Code's groups of a menu: the empty groups dropped, and the first choice of
 * every group after the first drawing the rule above it. A builder lists its groups and leaves out
 * the choices the state it is built for does not offer, and the rules follow.
 */
export function grouped(groups: readonly (readonly MenuItem[])[]): MenuItem[] {
    return groups
        .filter((group) => group.length > 0)
        .flatMap((group, at) =>
            group.map((item, index) => (at > 0 && index === 0 ? { ...item, rule: true } : item))
        );
}

/**
 * One headed run of choices, for a list whose choices fall under several headings (the board's one
 * filter control, a heading per facet). Two groups may hold choices of the same id, so a pick names
 * the group it came from.
 */
export type MenuGroup = { id: string; heading: string; items: MenuItem[] };

/** How near the window's edges a menu's list may be laid out. */
const MARGIN = 8;

/**
 * How a menu's list closes, the same for both openers: a pick is held until the list is gone and
 * the focus is back on the control it was opened from, without that control's tooltip, so a dialog
 * the pick raises keeps the focus it takes. A press outside and Tab leave the focus where they put
 * it. `changed` and `completed` are the menu root's, and `content` goes on its bits-ui content.
 */
export type MenuClosing = {
    /** Hold a pick until the list has closed. */
    hold: (answer: () => void) => void;
    /** The root opening or closing: an opening holds no pick yet and gives the focus back. */
    changed: (open: boolean) => void;
    /** The root done closing: a pick still held is answered then. */
    completed: (open: boolean) => void;
    /** The content's placing margin, its scrolling, and its answers to closing. */
    content: {
        collisionPadding: number;
        preventScroll: boolean;
        strategy: 'fixed';
        onInteractOutside: () => void;
        onkeydown: (event: KeyboardEvent) => void;
        onCloseAutoFocus: (event: Event) => void;
    };
};

/** The closing of one menu whose focus goes back to what `back` names, while it is on the page. */
export function menuClosing(back: () => HTMLElement | null | undefined): MenuClosing {
    let held: (() => void) | null = null;
    let away = false;

    /** The held pick, answered once and only once. */
    function answer(): void {
        const waiting = held;
        held = null;
        waiting?.();
    }

    return {
        hold: (next) => {
            held = next;
        },
        changed: (open) => {
            if (!open) return;
            held = null;
            away = false;
        },
        completed: (open) => {
            if (!open) answer();
        },
        content: {
            collisionPadding: MARGIN,
            preventScroll: false,
            strategy: 'fixed',
            onInteractOutside: () => {
                away = true;
            },
            onkeydown: (event) => {
                if (event.key === 'Tab') away = true;
            },
            onCloseAutoFocus: (event) => {
                event.preventDefault();
                const control = back();
                if (!away && control?.isConnected === true) focusQuietly(control);
                answer();
            }
        }
    };
}
