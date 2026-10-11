// Layer 1, data. The accelerators of the desktop app's menu (desktop/windows/menu.ts), the macOS
// one. The menu sets each of these on its item, on macOS including the roles whose accelerator
// Electron would otherwise choose itself, so this list is every key the menu takes there. The audit
// of an app's keybindings reads them as keys oculus takes on macOS.

/** The accelerator of each item of the menu, in Electron's syntax. */
export const ACCELERATORS = {
    settings: 'Cmd+,',
    newWindow: 'Cmd+Shift+N',
    closeWindow: 'Cmd+Shift+W',
    reload: 'Cmd+R',
    fullScreen: 'Ctrl+Cmd+F',
    zoomIn: 'Cmd+=',
    zoomOut: 'Cmd+-',
    zoomReset: 'Cmd+0',
    devTools: 'Alt+Cmd+I',
    hide: 'Cmd+H',
    hideOthers: 'Alt+Cmd+H',
    quit: 'Cmd+Q',
    minimize: 'Cmd+M'
} as const;

/** The accelerators as an app's keybinding writes a key: `Cmd+Shift+N` is `cmd+shift+n`. */
export function menuKeys(): string[] {
    return Object.values(ACCELERATORS).map((accelerator) => accelerator.toLowerCase());
}
