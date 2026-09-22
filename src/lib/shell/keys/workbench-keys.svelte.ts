// Layer 3, shell. Workbench keyboard dispatch connects pure key actions to layout state and the
// focused pane's ordered card ids. Views alone render the cursor held in each instance.

import type { DragStore } from '$lib/state/workbench/drag.svelte';
import type { LayoutStore } from '$lib/state/workbench/layout.svelte';
import type { Focus, Instance, Pane } from '$lib/state/workbench/layout';
import {
    cardCursor,
    paneAt,
    reconcileCardCursor,
    withCardCursor
} from '$lib/state/workbench/layout';
import type { UiStore } from '$lib/state/workbench/ui.svelte';
import { activateCursor, focusSearch, scrollContainer, scrollRegion } from './key-dom';
import {
    horizontalCursor,
    initialKeyState,
    resolveKey,
    rowCursor,
    type KeyAction,
    type RailOrder
} from './keys';
import { DOC_PICK } from '../rail/rail';

type Options = {
    drag: DragStore;
    layout: LayoutStore;
    ui: UiStore;
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
    /** Open one configured hub document by its path, in the page named, the way the rail does. */
    openDoc: (path: string, page: string | undefined) => void;
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
    let lastPagePane: HTMLElement | null = null;
    let observedPane: HTMLElement | null = null;
    let cardObserver: MutationObserver | null = null;

    /** Dispatch one key. Escape closes overlays or restores panes unless a drag owns it. */
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
            // A confirmation drawn inside the tray answers Escape itself and swallows the key, so
            // the tray stays open behind the dialog and the next Escape closes it. What says the
            // dialog took it is the key's own state: the dialog is already off the document by the
            // time the key reaches the window, since Svelte flushes between two listeners.
            if (!event.defaultPrevented) {
                event.preventDefault();
                options.setUpdateOpen(false);
            }
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
        const pane = focusedPaneElement();
        const result = resolveKey(
            event,
            options.navigation(),
            {
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
        // The pane shown alone may be one of a page drawn inside the page on screen, so the page
        // the reader is in is what is restored, not the one the strip is on.
        if (options.drag.dragging() !== null) return;
        const page = pageOf();
        if (options.layout.focused(page) === null) return;
        event.preventDefault();
        options.layout.restorePanes(page);
    }

    /**
     * The page the reader is in: the one shown at the pane that last took the pointer or the
     * keyboard, and the page on screen when no such pane is drawn any more. A control outside the
     * trees, the rail above all, reads it so a view it opens lands in the page being read rather
     * than in the one around it.
     */
    function pageOf(): string {
        const page = lastPagePane?.isConnected === true ? lastPagePane.dataset.panePage : undefined;
        return page ?? options.layout.currentPage().id;
    }

    /** Apply one resolved key action to shell state or the focused pane's DOM. */
    function perform(action: KeyAction, pane: HTMLElement | null): boolean {
        if (action.kind === 'open') {
            clearCursor();
            // A chord counts a group's documents after its views, so the entry a digit lands on
            // may be a document rather than a view: it opens through the rail's own path.
            if (action.view.startsWith(DOC_PICK)) {
                options.openDoc(action.view.slice(DOC_PICK.length), pageOf());
            } else {
                options.layout.openView(action.view, undefined, pageOf());
            }
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
        } else if (action.kind === 'page') {
            return options.layout.pageShortcut(action.index);
        } else if (action.kind === 'tab') {
            return activateTab(pane, action.index);
        } else if (action.kind === 'cycle-tab') {
            return cycleTab(pane, action.by);
        } else if (action.kind === 'sheet') {
            clearCursor();
            options.setSheetOpen(!options.sheetOpen());
        } else {
            clearCursor();
        }
        return true;
    }

    /**
     * The pane of the store the focused element names. The element carries the path and the page,
     * so the pane under the keyboard is the pane in the store; an element naming no pane, or a path
     * the tree does not hold, answers with nothing and leaves the key to whatever else wants it.
     */
    function paneNode(pane: HTMLElement | null): Pane | null {
        const raw = pane?.dataset.panePath;
        if (raw === undefined) return null;
        const path = raw === '' ? [] : raw.split('.').map(Number);
        if (path.some((step) => !Number.isInteger(step))) return null;
        return paneAt(options.layout.layout(pane?.dataset.panePage), path);
    }

    /**
     * Activate the numbered tab of the focused pane. A pane holding fewer tabs than the digit
     * counts to keeps the tab it has.
     */
    function activateTab(pane: HTMLElement | null, index: number): boolean {
        const tab = paneNode(pane)?.tabs.at(index - 1);
        return tab === undefined ? false : showTab(pane, tab.id);
    }

    /**
     * Carry the focused pane one tab along, wrapping at either end, so a pane of two tabs swaps
     * between them on the same key. A pane with no tab has nothing to show.
     */
    function cycleTab(pane: HTMLElement | null, by: 1 | -1): boolean {
        const node = paneNode(pane);
        if (node === null || node.tabs.length === 0) return false;
        const current = node.tabs.findIndex((tab) => tab.id === node.active);
        const from = current < 0 ? 0 : current;
        return showTab(pane, node.tabs[(from + by + node.tabs.length) % node.tabs.length].id);
    }

    /** Show one tab of the focused pane, in the page that pane belongs to. */
    function showTab(pane: HTMLElement | null, id: string): boolean {
        clearCursor();
        options.layout.activateInstance(id, pane?.dataset.panePage);
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
     * no order of its own: what a list is ordered by is the view's, so it is asked rather than
     * told.
     */
    function moveCard(pane: HTMLElement | null, direction: 'left' | 'right'): boolean {
        const id = instanceIn(pane);
        const cursor = cursorIn(pane);
        if (id === null || cursor === null) return false;
        options.ui.requestCardMove(id, cursor, direction === 'left' ? -1 : 1);
        return true;
    }

    /** The active instance id carried by a rendered pane. */
    function instanceIn(pane: HTMLElement | null): string | null {
        const id = pane?.dataset.paneActive;
        return id === undefined || id === '' ? null : id;
    }

    function cursorIn(pane: HTMLElement | null): string | null {
        const id = instanceIn(pane);
        return id === null ? null : cardCursor(options.layout.instanceLayoutState(id));
    }

    function writeCursor(pane: HTMLElement | null, cursor: string | null): void {
        if (pane === null) return;
        const id = instanceIn(pane);
        if (id === null) return;
        const state = options.layout.instanceLayoutState(id);
        if (cardCursor(state) === cursor) {
            if (cursor !== null && pane !== observedPane) observePane(pane);
            if (cursor === null && pane === observedPane) stopCards();
            return;
        }
        options.layout.restateInstance(id, withCardCursor(state, cursor));
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
        const state = options.layout.instanceLayoutState(id);
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
        // The page is kept when the press lands outside every pane, since a rail button pressed
        // after reading inside a nested page is still a view asked for in that page.
        if (pane !== null) lastPagePane = pane;
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
