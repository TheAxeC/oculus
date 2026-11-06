// Layer 3, view helper. The keys and the clicks of one Present pane's box (Present.svelte): the
// deck's own keys, the moves, `O` for the grid, `F` for full screen, `P` for the presenter screen
// and Escape to close the grid, and then to end the presentation; a key in a field kept for the
// field; Tab wrapped and the shell's keys held back in full screen; the focus leaving the box
// ending the full screen; a click on the slide moving to the next one in full screen and on the
// presenter screen's current slide.
//
// Each read is the pane's state at the call, so the handlers are made once with the view and act
// on what is on screen when the key or the click comes.

import { movedKey, stepKey, type DeckSlide, type PresentState } from '$lib/state/life/present';
import { CONTROLS, heldBack, inField, keepTab, moveOf } from './keys';

/** What the box's keys and clicks read from the pane and do to it. */
type Reads = {
    box: () => HTMLElement | null;
    rows: () => DeckSlide[];
    /** The key of the slide the pane is on. */
    slide: () => string;
    shown: () => DeckSlide | null;
    /** Whether the overview grid is open. */
    grid: () => boolean;
    /** Whether the box is in full screen. */
    full: () => boolean;
    /** Whether the pane shows the presenter screen. */
    presented: () => boolean;
    /** Whether the shell's card cursor is on a tile of the grid. */
    cursor: () => boolean;
    write: (changes: Partial<PresentState>) => void;
    toggleFull: () => void;
    leaveFull: () => void;
    present: () => void;
    endPresenting: () => void;
};

/** The handlers of a pane's box. */
export type BoxKeys = {
    keys: (event: KeyboardEvent) => void;
    focusLeft: (event: FocusEvent) => void;
    advance: (event: MouseEvent) => void;
    boxClicked: (event: MouseEvent) => void;
};

/** The keys and the clicks of a pane's box. */
export function createBoxKeys(reads: Reads): BoxKeys {
    /** Whether `target` is, or is inside, a control of the slide that acts on a press itself. */
    function inControl(target: EventTarget | null): boolean {
        const box = reads.box();
        if (!(target instanceof Element) || box === null) return false;
        const control = target.closest(CONTROLS);
        return control !== null && box.contains(control);
    }

    /** The deck's own keys: the moves, the grid, full screen, the presenter screen and Escape. */
    function deckKey(event: KeyboardEvent): boolean {
        const move = moveOf(event);
        if (move !== null) {
            event.preventDefault();
            if (event.key !== ' ' || !event.repeat) {
                reads.write({ slide: movedKey(reads.rows(), reads.slide(), move) });
            }
            return true;
        }
        switch (event.key) {
            case 'o':
            case 'O':
                event.preventDefault();
                reads.write({ overview: !reads.grid() });
                return true;
            case 'f':
            case 'F':
                if (reads.rows().length === 0) return true;
                event.preventDefault();
                if (!event.repeat) reads.toggleFull();
                return true;
            case 'p':
            case 'P':
                event.preventDefault();
                if (!event.repeat) reads.present();
                return true;
            case 'Escape':
                if (reads.grid()) {
                    event.preventDefault();
                    reads.write({ overview: false });
                } else if (reads.presented()) {
                    event.preventDefault();
                    reads.endPresenting();
                }
                return true;
            default:
                return false;
        }
    }

    function keys(event: KeyboardEvent): void {
        if (event.altKey || event.ctrlKey || event.metaKey) return;
        // A key in a field is the field's, Escape too when the field or a form around it took it;
        // Space on a button or a link acts on it; every other key is the deck's on any control.
        const control = inControl(event.target);
        const typed = inField(event.target) && (event.key !== 'Escape' || event.defaultPrevented);
        const pressed = control && event.key === ' ';
        if (!typed && !pressed && deckKey(event)) return;
        const box = reads.box();
        if (event.key === 'Tab') {
            if (reads.full() && box !== null) keepTab(event, box);
            return;
        }
        const state = { control, grid: reads.grid(), cursor: reads.cursor() };
        if (reads.full() && heldBack(event, state)) event.preventDefault();
    }

    /** In full screen the focus leaving for an element outside the box ends the full screen. */
    function focusLeft(event: FocusEvent): void {
        const to = event.relatedTarget;
        const box = reads.box();
        if (reads.full() && box !== null && to instanceof Node && !box.contains(to)) {
            reads.leaveFull();
        }
    }

    /**
     * A click on the slide shows the next one: in full screen on the letterbox around it too, and
     * on the presenter screen on the current slide alone.
     */
    function advance(event: MouseEvent): void {
        if (reads.grid() || reads.shown() === null || inControl(event.target)) return;
        if (window.getSelection()?.isCollapsed === false) return;
        reads.write({ slide: stepKey(reads.rows(), reads.slide(), 1) });
    }

    /** The click on the pane's box: in full screen it moves on, except on the presenter screen. */
    function boxClicked(event: MouseEvent): void {
        if (reads.full() && !reads.presented()) advance(event);
    }

    return { keys, focusLeft, advance, boxClicked };
}
