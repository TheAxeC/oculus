// Layer 3, view helper. The full screen of the Present pane's box: whether the box is the
// document's full-screen element, the request to enter and to leave it, and the pointer that hides
// after it has rested. The box is the pane's own, so the browser draws it alone and leaving puts
// the pane back as it was.
//
// Whether the box is the full-screen element is read from the document on every
// `fullscreenchange`, so a way out the page does not control (a browser tab's Esc, the app window's
// menu) is seen too. A full screen never outlives what it shows: it ends when the tab is hidden,
// when the deck holds no slides and when the view unmounts. It is called while the view is being
// initialised, since it registers its effects there.

/** How long the pointer rests over the box in full screen before it is hidden. */
const POINTER_REST_MS = 2000;

/** A refused or superseded full-screen request leaves the pane as it is. */
const ignore = (): undefined => undefined;

export type Fullscreen = {
    /** Whether the box is the document's full-screen element. */
    full: () => boolean;
    /** Whether the pointer has rested long enough in full screen to be hidden. */
    resting: () => boolean;
    leave: () => void;
    toggle: () => void;
    /** Follow the document's full-screen element; the box takes the focus when it becomes it. */
    sync: () => void;
    /** The pointer moved over the box: show it, and hide it again once it has rested. */
    rouse: () => void;
};

/** What the full screen reads from the pane: its box, and whether the pane may show it. */
type Reads = {
    box: () => HTMLElement | null;
    /** Whether the tab is shown and the deck holds a slide to show. */
    showable: () => boolean;
};

export function createFullscreen(reads: Reads): Fullscreen {
    let full = $state(false);
    let resting = $state(false);
    let restTimer: ReturnType<typeof setTimeout> | undefined;
    /** Whether a full-screen request is on its way, so a second press does not ask again. */
    let entering = false;
    /** Whether the view has gone, so a request that resolves after it leaves again. */
    let unmounted = false;

    function enter(): void {
        const element = reads.box();
        if (element === null || entering) return;
        entering = true;
        element
            .requestFullscreen()
            .then(() => {
                if (unmounted && document.fullscreenElement === element) {
                    document.exitFullscreen().catch(ignore);
                }
            })
            .catch(ignore)
            .finally(() => (entering = false));
    }

    function leave(): void {
        const box = reads.box();
        if (box !== null && document.fullscreenElement === box) {
            document.exitFullscreen().catch(ignore);
        }
    }

    function toggle(): void {
        const box = reads.box();
        if (box !== null && document.fullscreenElement === box) leave();
        else enter();
    }

    function sync(): void {
        const box = reads.box();
        full = box !== null && document.fullscreenElement === box;
        if (full) box?.focus();
    }

    function rouse(): void {
        clearTimeout(restTimer);
        resting = false;
        if (full) restTimer = setTimeout(() => (resting = true), POINTER_REST_MS);
    }

    // The pointer's rest starts when full screen is entered, whether or not the pointer moves, and
    // ends with it.
    $effect(() => {
        if (full) rouse();
        else {
            clearTimeout(restTimer);
            resting = false;
        }
        return () => clearTimeout(restTimer);
    });

    $effect(() => {
        if (full && !reads.showable()) leave();
    });

    $effect(() => {
        const element = reads.box();
        if (element === null) return;
        return () => {
            unmounted = true;
            if (document.fullscreenElement === element) document.exitFullscreen().catch(ignore);
        };
    });

    return { full: () => full, resting: () => resting, leave, toggle, sync, rouse };
}
