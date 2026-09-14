// Layer 3, shell. Workbench keyboard dispatch and the DOM-backed card cursor live here because key
// handling changes with focusable shell markup while pure key resolution does not.

import { dragging } from '$lib/state/drag.svelte';
import { openView, pageShortcut, restorePanes } from '$lib/state/layout.svelte';
import type { Focus, Instance } from '$lib/state/layout';
import { activateCursor, focusSearch, scrollContainer, scrollRegion } from './key-dom';
import {
    horizontalCursor,
    initialKeyState,
    resolveKey,
    rowCursor,
    type KeyAction,
    type RailOrder
} from './keys';

type Options = {
    navigation: () => RailOrder;
    activeMain: () => Instance | null;
    focus: () => Focus | null;
    paletteOpen: () => boolean;
    updateOpen: () => boolean;
    sheetOpen: () => boolean;
    setPaletteOpen: (open: boolean) => void;
    setUpdateOpen: (open: boolean) => void;
    setSheetOpen: (open: boolean) => void;
    openPalette: (prefill: string) => void;
};

export type WorkbenchKeys = {
    keys: (event: KeyboardEvent) => void;
    paneFocused: (event: FocusEvent) => void;
    panePressed: (event: PointerEvent) => void;
    clearCursor: () => void;
};

/** Bind keyboard decisions to the workbench's current DOM and transient overlays. */
export function createWorkbenchKeys(options: Options): WorkbenchKeys {
    let keyState = initialKeyState();
    let cursorIndex = -1;
    let cursorPane: HTMLElement | null = null;
    let lastFocusedPane: HTMLElement | null = null;

    /**
     * Dispatch one key. Escape closes overlays or restores panes unless a drag owns it;
     * Ctrl+digit changes pages, while Cmd+digit remains available to the browser.
     */
    function keys(event: KeyboardEvent): void {
        if (
            options.sheetOpen() &&
            !typingIn(event.target) &&
            !options.paletteOpen() &&
            !options.updateOpen() &&
            document.querySelector('[role="alertdialog"]') === null &&
            !event.defaultPrevented &&
            !event.metaKey &&
            !event.ctrlKey &&
            !event.altKey &&
            (event.key === '?' || event.key === 'Escape')
        ) {
            event.preventDefault();
            options.setSheetOpen(false);
            return;
        }
        if (options.sheetOpen()) return;
        if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
            event.preventDefault();
            if (options.paletteOpen()) options.setPaletteOpen(false);
            else options.openPalette('');
            return;
        }
        if (event.key === 'Escape' && options.paletteOpen()) {
            event.preventDefault();
            options.setPaletteOpen(false);
            return;
        }
        if (event.key === 'Escape' && options.updateOpen()) {
            event.preventDefault();
            options.setUpdateOpen(false);
            return;
        }
        if (
            event.key === ':' &&
            !options.paletteOpen() &&
            !event.metaKey &&
            !event.ctrlKey &&
            !event.altKey &&
            !typingIn(event.target)
        ) {
            event.preventDefault();
            options.openPalette(':');
            return;
        }
        if (event.ctrlKey && !event.metaKey && /^[1-9]$/.test(event.key)) {
            if (pageShortcut(Number(event.key))) event.preventDefault();
            return;
        }
        const pane = focusedPaneElement();
        const result = resolveKey(
            event,
            options.navigation(),
            {
                currentView: pane?.dataset.paneView ?? null,
                target: pane?.dataset.paneTarget === 'panel' ? 'panel' : 'main',
                cursorActive: cursorIndex >= 0,
                typing: typingIn(event.target),
                paletteOpen: options.paletteOpen(),
                trayOpen: options.updateOpen(),
                confirmOpen: document.querySelector('[role="alertdialog"]') !== null
            },
            keyState,
            Date.now()
        );
        keyState = result.state;
        if (result.action !== null) {
            if (perform(result.action, pane)) event.preventDefault();
            return;
        }
        if (event.key !== 'Escape' || event.defaultPrevented) return;
        if (dragging() !== null || options.focus() === null) return;
        event.preventDefault();
        restorePanes();
    }

    /** Apply one resolved key action to shell state or the focused pane's DOM. */
    function perform(action: KeyAction, pane: HTMLElement | null): boolean {
        if (action.kind === 'open') {
            clearCursor();
            openView(action.view, action.target);
        } else if (action.kind === 'cursor') {
            return moveCursor(pane, action.direction);
        } else if (action.kind === 'activate') {
            return activateCursor(cursorPane);
        } else if (action.kind === 'search') {
            return focusSearch(pane);
        } else if (action.kind === 'scroll') {
            return scrollRegion(scrollContainer(pane), action.edge);
        } else if (action.kind === 'sheet') {
            clearCursor();
            options.setSheetOpen(!options.sheetOpen());
        } else {
            clearCursor();
        }
        return true;
    }

    /** Find the pane keyboard navigation should address from focus, cursor or active main tab. */
    function focusedPaneElement(): HTMLElement | null {
        const element = document.activeElement;
        if (element instanceof HTMLElement) {
            const pane = element.closest<HTMLElement>('[data-pane]');
            if (pane !== null) return pane;
        }
        if (cursorPane?.isConnected) return cursorPane;
        if (lastFocusedPane?.isConnected) return lastFocusedPane;
        if (options.focus() !== null) return document.querySelector<HTMLElement>('[data-pane]');
        const active = options.activeMain()?.id;
        if (active === undefined) return null;
        return (
            [...document.querySelectorAll<HTMLElement>('[data-pane]')].find(
                (pane) => pane.dataset.paneActive === active
            ) ?? null
        );
    }

    /** The visible cards in one pane, in DOM order for cursor movement. */
    function cards(pane: HTMLElement | null): HTMLElement[] {
        if (pane === null) return [];
        return [...pane.querySelectorAll<HTMLElement>('[data-card]')].filter(
            (card) => card.offsetParent !== null
        );
    }

    function selectCard(pane: HTMLElement, index: number): boolean {
        const visible = cards(pane);
        if (index < 0 || index >= visible.length) return false;
        clearCursor();
        cursorPane = pane;
        cursorIndex = index;
        visible[index].setAttribute('data-cursor', '');
        visible[index].scrollIntoView({ block: 'center', behavior: 'smooth' });
        return true;
    }

    function moveCursor(
        pane: HTMLElement | null,
        direction: 'left' | 'right' | 'up' | 'down'
    ): boolean {
        if (pane === null) return false;
        const visible = cards(pane);
        const current = pane === cursorPane ? cursorIndex : -1;
        const next =
            direction === 'left' || direction === 'right'
                ? horizontalCursor(current, visible.length, direction === 'left' ? -1 : 1)
                : rowCursor(
                      visible.map((card) => card.getBoundingClientRect()),
                      current,
                      direction === 'up' ? -1 : 1
                  );
        return selectCard(pane, next);
    }

    function clearCursor(): void {
        document.querySelectorAll('[data-card][data-cursor]').forEach((card) => {
            card.removeAttribute('data-cursor');
        });
        cursorIndex = -1;
        cursorPane = null;
    }

    function rememberPane(target: EventTarget | null): void {
        const pane =
            target instanceof HTMLElement ? target.closest<HTMLElement>('[data-pane]') : null;
        if (pane === lastFocusedPane) return;
        lastFocusedPane = pane;
        clearCursor();
    }

    function paneFocused(event: FocusEvent): void {
        rememberPane(event.target);
    }

    function panePressed(event: PointerEvent): void {
        rememberPane(event.target);
    }

    /** Whether a key target is an editor that keeps ordinary typing shortcuts for itself. */
    function typingIn(target: EventTarget | null): boolean {
        if (!(target instanceof HTMLElement)) return false;
        return (
            target.matches('input, textarea, select') ||
            target.isContentEditable ||
            target.closest('[contenteditable="true"]') !== null
        );
    }

    return { keys, paneFocused, panePressed, clearCursor };
}
