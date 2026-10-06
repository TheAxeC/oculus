// Layer 3, shell. The page-wide right-click handler's decision, apart from the listener so it can
// be read without a DOM. The page cancels the browser's own context menu everywhere a right-click
// has no menu of oculus's, as VS Code's workbench does, so the browser's Back, Reload and Inspect
// never appear over the page's chrome. It leaves the browser's menu where that menu is the
// control's own: a text input, a textarea, a contenteditable element (copy, paste, spelling), the
// code editor, which draws its own menu, and the terminal grid, whose menu is the terminal view's.
// In the desktop app Electron draws no menu of its own at all, so the elements above show the menu
// oculus draws (a text box's, with the spelling suggestions at its top) or none.
//
// One document `contextmenu` listener in routes/+page.svelte applies it.

/** The elements inside which the browser's menu, or the control's own, is kept. */
const KEEPS = 'input, textarea, [contenteditable], .monaco-editor, [data-terminal]';

/**
 * Whether the page cancels the browser's menu for this right-click: not when something already
 * took the event (an oculus menu opened by it), and not when it landed inside one of the elements
 * above; yes otherwise, a blank area included.
 */
export function shouldCancel(event: MouseEvent): boolean {
    if (event.defaultPrevented) return false;
    const target = event.target as { closest?: (selector: string) => unknown } | null;
    if (target === null || typeof target.closest !== 'function') return true;
    return target.closest(KEEPS) === null;
}
