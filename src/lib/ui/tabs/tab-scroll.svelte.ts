// Layer 3, primitive. How an overflowing tab strip scrolls. The scroll controls jump to the next
// tab start, and a tab is brought in whole when it becomes the shown one, when it is pressed, when
// a change of width crosses it or takes it out of sight, and when the shown tab's own width changes
// and leaves it not whole, which a change of the text size does to every strip, resting with a tab
// start at the left edge where the browser's largest offset allows it. A wheel or trackpad scrolls
// the strip freely, the vertical wheel turned into horizontal travel, and is not settled anywhere.
// Every change of size is measured again from the tabs as they are, so the controls and the
// overflow never outlive a widening. The arithmetic is ui/tabs/tab-strip.ts's; this is the part
// that reads the elements and writes the offset, apart from ui/tabs/Tabs.svelte so the component
// stays its markup and its keyboard.
//
// One of these belongs to one strip. Its state lives in the object it returns, never in the module.

import {
    type TabScrollState,
    controlsFit,
    type TabSpan,
    horizontalWheelDelta,
    revealOffset,
    tabEdgeStep,
    tabScrollState,
    wholeAt
} from '$lib/ui/tabs/tab-strip';

/**
 * What the scroller reads of the component: its elements and which tab is showing, as they are now.
 */
export type TabScrollParts = {
    /** The scrolling tab list. */
    list: () => HTMLElement | undefined | null;
    /** The whole strip, the scroll controls and the menu opener included. */
    strip: () => HTMLElement | undefined | null;
    /** The menu opener at the strip's right, whose width the tabs never have. */
    opener: () => HTMLElement | undefined | null;
    /** The two scroll controls, measured while they are drawn. */
    controls: () => readonly (HTMLElement | undefined | null)[];
    /** Each tab's element, in order; a tab that has gone leaves null. */
    faces: () => readonly (HTMLElement | undefined | null)[];
    /** The index of the showing tab, or -1. */
    shown: () => number;
    /** Whether the strip wraps its tabs onto rows, which leaves nothing to scroll. */
    wrapped: () => boolean;
};

export type TabScroll = {
    /** The overflow state the scroll controls are drawn from. */
    state: () => TabScrollState;
    /** Whether the strip has room for the scroll controls beside the tabs' least width. */
    controls: () => boolean;
    /** Measure the strip again after a scroll. */
    scrolled: () => void;
    /**
     * Measure the strip again after a change of size, and bring the showing tab back if that took
     * it out.
     */
    resized: () => void;
    /** Bring one tab in whole, resting on a tab's start where the strip's end allows. */
    reveal: (index: number) => void;
    /** A scroll control: the next tab start in the direction pressed, or the strip's end. */
    step: (direction: -1 | 1) => void;
    /** A wheel event over the list: vertical travel scrolls the strip sideways. */
    wheel: (event: WheelEvent) => void;
};

export function createTabScroll(parts: TabScrollParts): TabScroll {
    let state = $state<TabScrollState>({ overflowing: false, atStart: true, atEnd: true });

    /**
     * Whether the strip keeps the showing tab in view: set when the strip brings it in, and set to
     * whether it is whole after the reader's wheel or scroll control, so a scroll that takes it
     * away is kept, since the reader asked for that. A change of size that leaves a kept tab not
     * whole brings it back, and so does the first measure.
     */
    let kept = false;
    let measured = false;

    /**
     * The width of the showing tab at the last measure. A reader's scroll never changes it, so a
     * change of it (the text size, the tab's own words) brings the tab back whatever the reader
     * did.
     */
    let shownWidth = -1;

    /**
     * Whether the showing tab was whole at the last measure. A change of size that takes a tab
     * the reader could see whole out of sight (a zoom or a narrower pane) brings it back, whatever
     * `kept` says, since no scroll of the reader's took it away.
     */
    let wasWhole = false;

    /** The width of the showing tab as it is drawn now, or -1 for none. */
    function widthOfShown(): number {
        const face = parts.faces().at(parts.shown());
        return face === undefined || face === null ? -1 : face.getBoundingClientRect().width;
    }

    /**
     * Whether the scroll controls fit beside the tabs, and the width the two took when last drawn,
     * which a strip that hides them is measured against.
     */
    let controls = $state(true);
    let controlsWidth = 0;

    function spans(list: HTMLElement): TabSpan[] {
        const origin = list.getBoundingClientRect().left - list.scrollLeft;
        return parts.faces().map((face) => {
            const rect = face?.getBoundingClientRect();
            return rect === undefined
                ? { start: 0, end: 0 }
                : { start: rect.left - origin, end: rect.right - origin };
        });
    }

    function maxScroll(list: HTMLElement): number {
        return Math.max(0, list.scrollWidth - list.clientWidth);
    }

    function showingWhole(list: HTMLElement): boolean {
        const span = spans(list).at(parts.shown());
        return (
            parts.shown() >= 0 &&
            span !== undefined &&
            wholeAt(span, list.scrollLeft, list.clientWidth)
        );
    }

    function measure(): void {
        const list = parts.list();
        const strip = parts.strip();
        // A measure queued before the strip unmounts finds the bindings null, not undefined.
        if (!list || !strip) return;
        const fits = strip.clientWidth - (parts.opener()?.offsetWidth ?? 0);
        const drawn = parts.controls().reduce((sum, one) => sum + (one?.offsetWidth ?? 0), 0);
        if (drawn > 0) controlsWidth = drawn;
        // The list's flex basis is `--tabs-least`, resolved to pixels at the text size in force.
        const least = Number.parseFloat(getComputedStyle(list).flexBasis) || 0;
        controls = controlsFit(strip.clientWidth, least, controlsWidth);
        state = tabScrollState(
            list.scrollWidth,
            list.clientWidth,
            list.scrollLeft,
            fits,
            parts.wrapped()
        );
        wasWhole = showingWhole(list);
    }

    /**
     * A scroll event: the strip's own offset, a clamp of the browser's, or the reader's wheel,
     * which `wheel` has already weighed. It changes what is kept in view in none of them.
     */
    function scrolled(): void {
        if (!parts.list()) return;
        measure();
    }

    function resized(): void {
        const list = parts.list();
        if (!list) return;
        const width = widthOfShown();
        const changed = shownWidth >= 0 && Math.abs(width - shownWidth) > 0.5;
        const bring = kept || !measured || changed || wasWhole;
        measure();
        measured = true;
        shownWidth = width;
        if (bring && !showingWhole(list)) reveal(parts.shown());
    }

    function restAt(left: number): void {
        const list = parts.list();
        if (!list) return;
        if (Math.abs(left - list.scrollLeft) > 0.5) list.scrollTo({ left });
        measure();
    }

    function reveal(index: number): void {
        const list = parts.list();
        if (!list || index < 0 || parts.wrapped()) return;
        const all = spans(list);
        const target = all.at(index);
        if (target === undefined) return;
        restAt(revealOffset(all, target, list.scrollLeft, list.clientWidth, maxScroll(list)));
        if (index === parts.shown()) kept = true;
    }

    function step(direction: -1 | 1): void {
        const list = parts.list();
        if (!list || parts.wrapped()) return;
        restAt(tabEdgeStep(spans(list), list.scrollLeft, maxScroll(list), direction));
        kept = showingWhole(list);
    }

    function wheel(event: WheelEvent): void {
        const list = parts.list();
        if (!list || !state.overflowing) return;
        const delta = horizontalWheelDelta(event.deltaX, event.deltaY);
        if (delta === 0) return;
        event.preventDefault();
        list.scrollLeft += delta;
        measure();
        kept = showingWhole(list);
    }

    return {
        state: () => state,
        controls: () => controls,
        scrolled,
        resized,
        reveal,
        step,
        wheel
    };
}
