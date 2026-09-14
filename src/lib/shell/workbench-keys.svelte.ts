// Layer 3, shell. Workbench keyboard dispatch connects pure key actions to layout state and the
// focused pane's ordered card ids. Views alone render the cursor held in each instance.

import { dragging } from '$lib/state/drag.svelte';
import {
    instanceLayoutState,
    openView,
    pageShortcut,
    restateInstance,
    restorePanes
} from '$lib/state/layout.svelte';
import type { Focus, Instance } from '$lib/state/layout';
import { cardCursor, reconcileCardCursor, withCardCursor } from '$lib/state/layout';
import { requestCardMove } from '$lib/state/ui.svelte';
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
    syncCards: () => void;
    stopCards: () => void;
};

type CardElement = { id: string; element: HTMLElement };

/** Bind keyboard decisions to the workbench's current DOM and transient overlays. */
export function createWorkbenchKeys(options: Options): WorkbenchKeys {
    let keyState = initialKeyState();
    let lastFocusedPane: HTMLElement | null = null;
    let observedPane: HTMLElement | null = null;
    let cardObserver: MutationObserver | null = null;

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
                cursorActive: cursorIn(pane) !== null,
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
        } else if (action.kind === 'move') {
            return moveCard(pane, action.direction);
        } else if (action.kind === 'activate') {
            return activateCursor(pane, cursorIn(pane));
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
    function cards(pane: HTMLElement | null): CardElement[] {
        if (pane === null) return [];
        return [...pane.querySelectorAll<HTMLElement>('[data-card]')]
            .filter((card) => card.offsetParent !== null)
            .map((element) => ({ id: element.dataset.card ?? '', element }))
            .filter((card) => card.id !== '');
    }

    function selectCard(pane: HTMLElement, index: number): boolean {
        const visible = cards(pane);
        if (index < 0 || index >= visible.length) return false;
        writeCursor(pane, visible[index].id);
        visible[index].element.scrollIntoView({ block: 'center', behavior: 'smooth' });
        return true;
    }

    function moveCursor(
        pane: HTMLElement | null,
        direction: 'left' | 'right' | 'up' | 'down'
    ): boolean {
        if (pane === null) return false;
        const visible = cards(pane);
        const current = visible.findIndex((card) => card.id === cursorIn(pane));
        const next =
            direction === 'left' || direction === 'right'
                ? horizontalCursor(current, visible.length, direction === 'left' ? -1 : 1)
                : rowCursor(
                      visible.map((card) => card.element.getBoundingClientRect()),
                      current,
                      direction === 'up' ? -1 : 1
                  );
        return selectCard(pane, next);
    }

    /**
     * Ask the view showing this pane to carry the card under the cursor one place. The shell holds
     * no order of its own: what a list is ordered by is the view's, so it is asked rather than told.
     */
    function moveCard(pane: HTMLElement | null, direction: 'left' | 'right'): boolean {
        const id = instanceIn(pane);
        const cursor = cursorIn(pane);
        if (id === null || cursor === null) return false;
        requestCardMove(id, cursor, direction === 'left' ? -1 : 1);
        return true;
    }

    /** The active instance id carried by a rendered pane. */
    function instanceIn(pane: HTMLElement | null): string | null {
        const id = pane?.dataset.paneActive;
        return id === undefined || id === '' ? null : id;
    }

    function cursorIn(pane: HTMLElement | null): string | null {
        const id = instanceIn(pane);
        return id === null ? null : cardCursor(instanceLayoutState(id));
    }

    function writeCursor(pane: HTMLElement | null, cursor: string | null): void {
        if (pane === null) return;
        const id = instanceIn(pane);
        if (id === null) return;
        const state = instanceLayoutState(id);
        if (cardCursor(state) === cursor) {
            if (cursor !== null && pane !== observedPane) observePane(pane);
            if (cursor === null && pane === observedPane) stopCards();
            return;
        }
        restateInstance(id, withCardCursor(state, cursor));
        if (cursor === null) {
            if (pane === observedPane) stopCards();
        } else {
            observePane(pane);
        }
    }

    function clearCursor(): void {
        writeCursor(focusedPaneElement(), null);
    }

    /** Clear a stored cursor when a rendered card-list snapshot no longer contains its id. */
    function reconcilePane(pane: HTMLElement): void {
        const id = instanceIn(pane);
        if (id === null) return;
        const state = instanceLayoutState(id);
        const reconciled = reconcileCardCursor(
            state,
            cards(pane).map((card) => card.id)
        );
        if (reconciled !== state) writeCursor(pane, null);
    }

    /** Observe only the pane whose instance currently holds a cursor. */
    function observePane(pane: HTMLElement): void {
        stopCards();
        if (!pane.isConnected) return;
        reconcilePane(pane);
        if (cursorIn(pane) === null) return;
        observedPane = pane;
        cardObserver = new MutationObserver(() => {
            if (!pane.isConnected) {
                stopCards();
                return;
            }
            reconcilePane(pane);
        });
        cardObserver.observe(pane, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['data-card']
        });
    }

    /** Match observation to restored layout state and stop watching panes removed by a render. */
    function syncCards(): void {
        if (observedPane !== null) {
            if (!observedPane.isConnected || cursorIn(observedPane) === null) stopCards();
            else return;
        }
        const pane = focusedPaneElement();
        if (pane !== null && cursorIn(pane) !== null) observePane(pane);
    }

    function stopCards(): void {
        cardObserver?.disconnect();
        cardObserver = null;
        observedPane = null;
    }

    function rememberPane(target: EventTarget | null): void {
        const pane =
            target instanceof HTMLElement ? target.closest<HTMLElement>('[data-pane]') : null;
        if (pane === lastFocusedPane) return;
        writeCursor(lastFocusedPane ?? pane, null);
        lastFocusedPane = pane;
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

    return { keys, paneFocused, panePressed, clearCursor, syncCards, stopCards };
}
