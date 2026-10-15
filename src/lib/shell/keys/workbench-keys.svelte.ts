// Layer 3, shell. Workbench keyboard dispatch connects pure key actions to layout state and the
// focused pane's ordered card ids. Views alone render the cursor held in each instance.

import type { DragStore } from '$lib/state/workbench/drag.svelte';
import type { LayoutStore } from '$lib/state/workbench/layout.svelte';
import type { HistoryWalk } from '../titlebar/history-walk';
import type { Focus, Instance, Pane } from '$lib/state/workbench/layout';
import {
    cardCursor,
    paneAt,
    reconcileCardCursor,
    withCardCursor
} from '$lib/state/workbench/layout';
import type { UiStore } from '$lib/state/workbench/ui.svelte';
import {
    activateCursor,
    focusSearch,
    PANE_COMMAND,
    scrollContainer,
    scrollRegion
} from './key-dom';
import { horizontalCursor, rowCursor, toggleView } from './keys';
import type { DebugKey } from '$lib/data/helpers/keys/oculus/debug-keys';
import {
    opensCommandLine,
    paletteKeyOf,
    togglesPalette,
    type PaletteKey
} from '$lib/data/helpers/keys/oculus/palette-keys';
import { PREFIX_ROWS } from '$lib/data/helpers/keys/oculus/palette-table';
import { initialKeyState, resolveKey, type KeyAction } from '$lib/data/helpers/keys/oculus/resolve';
import { DOC_PICK, type RailOrder } from '$lib/state/workbench/navigation/catalogue';
import type { PaletteMode } from '$lib/state/workbench/palette';

type Options = {
    drag: DragStore;
    layout: LayoutStore;
    /** The window's navigation history, which the Go Back and Go Forward keys walk. */
    history: HistoryWalk;
    ui: UiStore;
    navigation: () => RailOrder;
    activeMain: () => Instance | null;
    focus: () => Focus | null;
    paletteOpen: () => boolean;
    /** The mode the palette is in while it is open, and null while it is closed. */
    paletteMode: () => PaletteMode | null;
    updateOpen: () => boolean;
    sheetOpen: () => boolean;
    setPaletteOpen: (open: boolean) => void;
    setUpdateOpen: (open: boolean) => void;
    setSheetOpen: (open: boolean) => void;
    openPalette: (prefill: string) => void;
    /** Open the palette in the mode a palette key names, whatever mode it is in. */
    showPalette: (key: PaletteKey) => void;
    /**
     * Open one listed document by the id of its tab (a hub document's path, or the engine id of a
     * document of oculus's own folder), in the page named, as the catalogue does.
     */
    openDoc: (id: string, page: string | undefined) => void;
    /** New: the composer in the Terminal tab of the page named, the terminals store's rule. */
    composeIn: (page: string) => void;
    /** Ask the Search tab with this id to put the cursor in its query box or its replace box. */
    focusSearchBox: (id: string, box: 'query' | 'replace') => void;
    /**
     * Show the page of the rail button at `index`, counting from 1, which is what the digits 1 to 9
     * do. It answers whether there was one, so the key is swallowed only when it did something.
     */
    railPage: (index: number) => boolean;
    /** Run the default build or the default test of the repository holding the file on screen. */
    runDefault: (which: 'build' | 'test') => void;
    /** Step to the next (1) or previous (-1) problem and open it; false when there is none. */
    walkProblem: (by: 1 | -1) => boolean;
    /** Ask the source tab on screen to save, which does nothing when it cannot write its file. */
    saveSource: () => void;
    /** Carry out a debug key; false when it had nothing to act on. */
    debugKey: (which: DebugKey) => boolean;
    /** Whether a debug session is starting, running or paused. */
    debugging: () => boolean;
    /** Whether the source tab on screen is a file that takes breakpoints. */
    breakpointFileOnScreen: () => boolean;
    /**
     * Offer a press to the apps' keybindings once oculus's own keys have passed on it: whether
     * a text field or an editor holds the keyboard, and whether the source editor does. True when
     * an app's binding took the press.
     */
    appKey: (event: KeyboardEvent, textual: boolean, editor: boolean) => boolean;
    /** Whether the command modifier is Cmd (macOS) and not Ctrl. */
    mac: boolean;
    /**
     * Whether the page is in the desktop app, which delivers Cmd+W, Cmd+N, Cmd+F, Cmd+T and
     * Ctrl+Tab.
     */
    app?: boolean;
    /** Open the find bar of the app's window. */
    find?: () => void;
};

export type WorkbenchKeys = {
    keys: (event: KeyboardEvent) => void;
    paneFocused: (event: FocusEvent) => void;
    frameFocused: () => void;
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
    /** The held cursor whose row the observed pane has drawn since its observation began. */
    let drawnCursor: string | null = null;

    /**
     * Dispatch one key. `?` closes the key sheet, and Escape restores panes unless a drag owns it.
     * The key sheet, the palette and the update tray close on Escape through their own bits-ui
     * dialog, which takes the key before it reaches here, and a confirm drawn inside the tray takes
     * the first Escape the same way.
     */
    function keys(event: KeyboardEvent): void {
        if (
            options.sheetOpen() &&
            !typingIn(event.target) &&
            !options.paletteOpen() &&
            !options.updateOpen() &&
            !dialogShown() &&
            !event.defaultPrevented &&
            !event.metaKey &&
            !event.ctrlKey &&
            !event.altKey &&
            event.key === '?'
        ) {
            event.preventDefault();
            options.setSheetOpen(false);
            return;
        }
        if (options.sheetOpen()) return;
        const wanted = paletteKeyOf(event, options.mac);
        if (wanted !== null) {
            event.preventDefault();
            if (options.paletteMode() === wanted) options.setPaletteOpen(false);
            else options.showPalette(wanted);
            return;
        }
        if (togglesPalette(event)) {
            event.preventDefault();
            if (options.paletteOpen()) options.setPaletteOpen(false);
            else options.openPalette('');
            return;
        }
        if (opensCommandLine(event) && !options.paletteOpen() && !typingIn(event.target)) {
            event.preventDefault();
            options.openPalette(PREFIX_ROWS.command.prefix);
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
                confirmOpen: dialogShown(),
                mac: options.mac,
                app: options.app,
                debugging: options.debugging(),
                breakpointFocus: inEditor(event.target) && options.breakpointFileOnScreen()
            },
            keyState,
            Date.now()
        );
        keyState = result.state;
        if (result.swallow === true) event.preventDefault();
        if (result.action !== null) {
            if (perform(result.action, pane)) event.preventDefault();
            return;
        }
        if (
            !event.defaultPrevented &&
            !options.paletteOpen() &&
            !options.updateOpen() &&
            !dialogShown() &&
            options.appKey(event, typingIn(event.target), inEditor(event.target))
        ) {
            event.preventDefault();
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
     * keyboard, and the page on screen when no such pane is drawn any more. A chord read outside
     * the trees reads it so a view it opens lands in the page being read rather than in the one
     * around it. A float is no page: a view a chord opens while the reader is in a float lands in
     * the page on screen, as a view opened with no page named does.
     */
    function pageOf(): string {
        const page = lastPagePane?.isConnected === true ? lastPagePane.dataset.panePage : undefined;
        const floated = options.layout.floats().some((one) => one.id === page);
        return page === undefined || floated ? options.layout.currentPage().id : page;
    }

    /** Apply one resolved key action to shell state or the focused pane's DOM. */
    function perform(action: KeyAction, pane: HTMLElement | null): boolean {
        if (action.kind === 'open') {
            clearCursor();
            // A chord counts a group's documents after its views, so the entry a digit lands on
            // may be a document rather than a view: it opens through the catalogue's own path.
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
        } else if (action.kind === 'find-in-files' || action.kind === 'replace-in-files') {
            clearCursor();
            const id = options.layout.openView('search', undefined, pageOf());
            if (id === '') return false;
            options.focusSearchBox(id, action.kind === 'find-in-files' ? 'query' : 'replace');
        } else if (action.kind === 'scroll') {
            return scrollRegion(scrollContainer(pane), action.edge);
        } else if (action.kind === 'page') {
            return options.railPage(action.index);
        } else if (action.kind === 'tab') {
            return activateTab(pane, action.index);
        } else if (action.kind === 'cycle-tab') {
            return cycleTab(pane, action.by);
        } else if (action.kind === 'tex-view') {
            clearCursor();
            options.layout.showTexView();
        } else if (action.kind === 'toggle-problems') {
            clearCursor();
            toggleView(options.layout, options.ui, 'problems', pageOf());
        } else if (action.kind === 'next-problem') {
            return options.walkProblem(action.by);
        } else if (action.kind === 'debug') {
            return options.debugKey(action.which);
        } else if (action.kind === 'command-default') {
            options.runDefault(action.which);
        } else if (action.kind === 'save') {
            // The key is taken from the browser under an overlay too, but saves nothing then.
            const covered = options.paletteOpen() || options.updateOpen() || dialogShown();
            if (!covered) options.saveSource();
        } else if (action.kind === 'close-tab' || action.kind === 'new-text-file') {
            if (pane === null) return false;
            clearCursor();
            pane.dispatchEvent(new CustomEvent(PANE_COMMAND, { detail: action.kind }));
        } else if (action.kind === 'reopen-closed-tab') {
            clearCursor();
            void options.layout.reopenClosed();
        } else if (action.kind === 'go-back' || action.kind === 'go-forward') {
            clearCursor();
            void (action.kind === 'go-back' ? options.history.back() : options.history.forward());
        } else if (action.kind === 'find') {
            clearCursor();
            options.find?.();
        } else if (action.kind === 'workspace-symbol') {
            clearCursor();
            options.openPalette(PREFIX_ROWS.symbols.prefix);
        } else if (action.kind === 'new-session') {
            clearCursor();
            options.composeIn(pageOf());
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

    /**
     * Whether a confirm dialog holds the keys. A pane keeps the view of a tab it hides mounted, so
     * a confirm left open in that view stays in the page, hidden with it; only one outside a
     * hidden tab view is on screen and counts.
     */
    function dialogShown(): boolean {
        return [...document.querySelectorAll('[role="alertdialog"]')].some(
            (one) => one.closest('[data-tab-view][hidden]') === null
        );
    }

    /**
     * The place in its pane of a frame that holds the focus, or of an element inside a viewer's
     * box: the frames are drawn outside the panes (shell/frames/FrameLayer.svelte), so the pane of
     * a frame is the pane of its slot.
     */
    function frameSlot(element: HTMLElement): HTMLElement | null {
        const id = element.closest<HTMLElement>('[data-frame-of]')?.dataset.frameOf;
        if (id === undefined) return null;
        return document.querySelector<HTMLElement>(`[data-frame-slot="${CSS.escape(id)}"]`);
    }

    /**
     * The box of the editor that an element in one of its widgets belongs to: an editor draws its
     * widgets on a node on the body (ui/controls/editor/options.ts), which names the box it is for,
     * so the pane of a widget is the pane of its editor.
     */
    function widgetBox(element: HTMLElement): HTMLElement | null {
        const id = element.closest<HTMLElement>('[data-widgets-of]')?.dataset.widgetsOf;
        if (id === undefined) return null;
        return document.querySelector<HTMLElement>(`[data-widgets-id="${CSS.escape(id)}"]`);
    }

    /** Find the pane keyboard navigation should address from focus, cursor or active main tab. */
    function focusedPaneElement(): HTMLElement | null {
        const element = document.activeElement;
        if (element instanceof HTMLElement) {
            const pane = (frameSlot(element) ?? widgetBox(element) ?? element).closest<HTMLElement>(
                '[data-pane]'
            );
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
        // A held cursor whose row is not drawn names no card under the cursor: the view may hide
        // that card behind a filter, and carrying it would reorder an entry the reader cannot see.
        if (!cards(pane).some((card) => card.id === cursor)) return false;
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

    /**
     * Clear a held cursor whose row the observed pane has drawn and a later render leaves out.
     * A view draws its rows as its channels send them, so a pane shown from a restored layout first
     * renders no row or only some of them; until the held row has been drawn once in this
     * observation, its absence says only that it has not arrived, and the cursor is kept.
     */
    function reconcilePane(pane: HTMLElement): void {
        const id = instanceIn(pane);
        if (id === null) return;
        const state = options.layout.instanceLayoutState(id);
        const visible = cards(pane).map((card) => card.id);
        const cursor = cardCursor(state);
        if (cursor !== null && visible.includes(cursor)) drawnCursor = cursor;
        if (cursor !== drawnCursor) return;
        const reconciled = reconcileCardCursor(state, visible);
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

    /**
     * Match observation to restored layout state and stop watching panes removed by a render. A
     * held cursor marks the pane the keyboard is in, so while no pane is remembered (none pressed
     * or focused, or the remembered one gone from the page), the pane that holds the cursor is:
     * the keys move that cursor, and a press into another pane clears it. When two panes hold one,
     * the first in document order is the remembered pane.
     */
    function syncCards(): void {
        if (observedPane !== null) {
            if (!observedPane.isConnected || cursorIn(observedPane) === null) stopCards();
            else return;
        }
        if (!lastFocusedPane?.isConnected) {
            const holding = [...document.querySelectorAll<HTMLElement>('[data-pane]')].find(
                (one) => cursorIn(one) !== null
            );
            if (holding !== undefined) lastFocusedPane = holding;
        }
        const pane = focusedPaneElement();
        if (pane !== null && cursorIn(pane) !== null) observePane(pane);
    }

    function stopCards(): void {
        cardObserver?.disconnect();
        cardObserver = null;
        observedPane = null;
        drawnCursor = null;
    }

    function rememberPane(target: EventTarget | null): void {
        const pane =
            target instanceof HTMLElement
                ? (widgetBox(target) ?? target).closest<HTMLElement>('[data-pane]')
                : null;
        // The page is kept when the press lands outside every pane, since a chord typed after
        // reading inside a nested page is still a view asked for in that page.
        if (pane !== null) lastPagePane = pane;
        if (pane === lastFocusedPane) return;
        writeCursor(lastFocusedPane ?? pane, null);
        lastFocusedPane = pane;
    }

    function paneFocused(event: FocusEvent): void {
        rememberPane(event.target);
    }

    /**
     * The window lost the focus to a frame (a press inside it): Chrome sends the page no `focusin`
     * for the frame's element, so a `focusin` is raised on the frame's slot, where the pane that
     * holds the slot hears it as a focus inside the pane.
     */
    function frameFocused(): void {
        const element = document.activeElement;
        if (!(element instanceof HTMLIFrameElement)) return;
        frameSlot(element)?.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    }

    function panePressed(event: PointerEvent): void {
        rememberPane(event.target);
    }

    return { keys, paneFocused, frameFocused, panePressed, clearCursor, syncCards, stopCards };
}

/** Whether a key target is inside the source tab's editor. */
function inEditor(target: EventTarget | null): boolean {
    return target instanceof HTMLElement && target.closest('.monaco-editor') !== null;
}

/**
 * Whether a key target is an editor that keeps ordinary typing shortcuts for itself: a form field,
 * a content-editable element, or anything inside the source tab's editor, whose focused element
 * (Monaco's edit context, a plain `div`) is neither.
 */
export function typingIn(target: EventTarget | null): boolean {
    if (!(target instanceof HTMLElement)) return false;
    return (
        target.matches('input, textarea, select') ||
        target.isContentEditable ||
        target.closest('[contenteditable="true"]') !== null ||
        target.closest('.monaco-editor') !== null
    );
}
