// Layer 3, view partial of views/sources/search/Search.svelte. What a key does in the query box and
// in the replace box: Up and Down walk the texts the box ran, and Cmd+Alt+Enter (Ctrl+Alt+Enter
// elsewhere) is Replace All. A key that is none of these is left to the box.

import type { Walk } from '$lib/state/sources/search/walk';

/** What a box hands the key handler: its walk, the texts it ran and the text in it. */
type BoxKeys = {
    walk: Walk;
    /** The texts the box ran, newest first. */
    texts: string[];
    /** The text in the box now. */
    text: string;
    /** Put a text in the box. */
    set: (text: string) => void;
    /** Replace All, which asks first. */
    all: () => void;
};

/** Whether the press is Replace All in a box. */
function isReplaceAll(event: KeyboardEvent): boolean {
    const enter = event.code === 'Enter' || event.code === 'NumpadEnter';
    return enter && event.altKey && (event.metaKey || event.ctrlKey) && !event.shiftKey;
}

/** Act on a press in a box; true when the press was this view's and the box must not take it. */
export function boxKey(event: KeyboardEvent, keys: BoxKeys): boolean {
    if (event.isComposing) return false;
    if (isReplaceAll(event)) {
        keys.all();
        return true;
    }
    if (event.altKey || event.metaKey || event.ctrlKey || event.shiftKey) return false;
    const next =
        event.key === 'ArrowUp'
            ? keys.walk.older(keys.texts, keys.text)
            : event.key === 'ArrowDown'
              ? keys.walk.newer(keys.texts)
              : null;
    if (next === null) return false;
    keys.set(next);
    return true;
}
