// Layer 3, shared view partial. The field a session's title is typed into, which the Sessions tab
// opens in two places: in place of a list row's title (a double press, or Rename in the row's
// menu) and in place of the title row's value in Details (Rename on the Details head). Both fields
// answer the same way: Enter writes the title and an empty one clears it, Escape closes the field
// with nothing written, and the focus leaving keeps it open.
//
// The Sessions tab keeps one `TitleField`, naming the field that is open and the session it is
// for, so opening one of the two closes the other; a Session tab's Details field keeps its own.
// Escape is read by a listener on the document in capture phase, so it runs before the field's
// own handlers and any bubbling listener, and it acts only while the event's target is inside the
// field's box, so it closes only the field the focus is in.

import type { Attachment } from 'svelte/attachments';

/** The title field open in a tab: where it is drawn and for which session; null for none. */
export type TitleField = { where: 'list' | 'details'; session: string } | null;

/** The field a tab keeps open, and the call that opens one (or, with null, closes it). */
export type TitleFields = { open: TitleField; set: (next: TitleField) => void };

/**
 * What the box around a title field carries: Escape pressed while the focus is inside the box
 * closes the field through `close`, and the key goes no further down to the field's own handlers
 * or up to any bubbling listener.
 */
export function escapeCloses(close: () => void): Attachment<HTMLElement> {
    return (box) => {
        const escape = (event: KeyboardEvent): void => {
            if (event.key !== 'Escape') return;
            if (!(event.target instanceof Node) || !box.contains(event.target)) return;
            event.preventDefault();
            event.stopPropagation();
            close();
        };
        document.addEventListener('keydown', escape, true);
        return () => document.removeEventListener('keydown', escape, true);
    };
}

/**
 * The title a field's text writes, or null for none to write: the text without its outer spaces,
 * the empty text among them, which clears a title the reader gave, and nothing when the text is the
 * title already.
 */
export function titleToWrite(text: string, title: string): string | null {
    const next = text.trim();
    return next === title ? null : next;
}
