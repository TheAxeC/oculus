// Layer 3, primitive helper. The right-click menu of a text box (TextBoxMenu.svelte, round
// TextInput, TextArea, Search and the other boxes), as VS Code gives every text box of its
// workbench one: Undo, Redo, then Cut and Copy while the box holds a selection, Paste, then Select
// All. A box that is read-only offers only
// what changes nothing: Copy while it holds a selection, and Select All. A secret box offers no Cut
// and no Copy, since the browser keeps a password's text off the clipboard.
//
// Each edit is the browser's own editing command on the box, run once the menu has given the focus
// back to it, so an edit from the menu joins the box's own undo history and raises the input event
// the box's caller hears, as a key's edit does. Paste reads the clipboard's text through
// `navigator.clipboard.readText()`; a refused read leaves the box as it was.
//
// The items are a pure function of the box's state, so which items a box offers is asserted without
// a DOM, and the words come in as `t` so every label is a catalog key.

import { grouped, type MenuItem } from '$lib/ui/menu/menu-items';

type Words = (key: string, ...args: (string | number)[]) => string;

export const TEXT_UNDO = 'undo';
export const TEXT_REDO = 'redo';
export const TEXT_CUT = 'cut';
export const TEXT_COPY = 'copy';
export const TEXT_PASTE = 'paste';
export const TEXT_SELECT_ALL = 'select-all';

/** What the menu is built from: whether the box holds a selection, and whether it is read-only. */
export type TextFacts = { selection: boolean; readonly: boolean };

/** The box's items, in VS Code's groups. */
export function textMenu(facts: TextFacts, t: Words): MenuItem[] {
    const item = (id: string, label: string): MenuItem => ({ id, label });
    const copy = facts.selection ? [item(TEXT_COPY, t('ui.text_copy'))] : [];
    const all = [item(TEXT_SELECT_ALL, t('ui.text_select_all'))];
    if (facts.readonly) return grouped([copy, all]);
    return grouped([
        [item(TEXT_UNDO, t('ui.text_undo')), item(TEXT_REDO, t('ui.text_redo'))],
        [
            ...(facts.selection ? [item(TEXT_CUT, t('ui.text_cut'))] : []),
            ...copy,
            item(TEXT_PASTE, t('ui.text_paste'))
        ],
        all
    ]);
}

/** A text box, a line or several. */
type Box = HTMLInputElement | HTMLTextAreaElement;

/** The facts of a box at the moment a right-click arrives on it. */
export function textFacts(box: Box, secret: boolean): TextFacts {
    const start = box.selectionStart ?? 0;
    const end = box.selectionEnd ?? 0;
    return { selection: !secret && end > start, readonly: box.readOnly };
}

/** The text of the box an input event came from, or null for any other target. */
export function boxValue(event: Event): string | null {
    const field = event.currentTarget;
    if (field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement)
        return field.value;
    return null;
}

/** Hand the text of the box an input event came from to `oninput`; any other target hands none. */
export function typedInto(event: Event, oninput: (value: string) => void): void {
    const typed = boxValue(event);
    if (typed !== null) oninput(typed);
}

/** The text a box has selected. */
function selectedOf(box: Box): string {
    return box.value.slice(box.selectionStart ?? 0, box.selectionEnd ?? 0);
}

/**
 * Run one of the browser's editing commands on the focused box. `execCommand` is the one way a
 * page edits a box through its undo history; the Clipboard API has no undo or insert of its own.
 */
function command(name: string, text?: string): void {
    // eslint-disable-next-line @typescript-eslint/no-deprecated -- the editing commands are the only way to edit a box through its own undo history
    document.execCommand(name, false, text);
}

/** Paste the clipboard's text at the caret, as one edit; a refused read changes nothing. */
async function paste(box: Box): Promise<void> {
    let text: string;
    try {
        text = await navigator.clipboard.readText();
    } catch {
        return;
    }
    if (text === '') return;
    box.focus();
    command('insertText', text);
}

/** Run a pick from a box's menu on the box. */
export function textPicked(box: Box, pick: string): void {
    box.focus();
    if (pick === TEXT_UNDO) command('undo');
    else if (pick === TEXT_REDO) command('redo');
    else if (pick === TEXT_COPY) {
        void navigator.clipboard.writeText(selectedOf(box)).catch(() => undefined);
    } else if (pick === TEXT_CUT) {
        const cut = selectedOf(box);
        void navigator.clipboard.writeText(cut).then(
            () => {
                box.focus();
                command('delete');
            },
            () => undefined
        );
    } else if (pick === TEXT_PASTE) void paste(box);
    else if (pick === TEXT_SELECT_ALL) box.select();
}
