// Layer 3, primitive. How an overflowing tab strip scrolls. The scroll controls jump to the next
// tab start, and a tab is brought in whole when it becomes the shown one, when it is pressed, and
// when a change of width crosses it or takes it out of sight, resting with a tab start at the left
// edge where the browser's largest offset allows it. A wheel or trackpad scrolls the strip freely,
// the vertical wheel turned into horizontal travel, and is not settled anywhere. Every change of
// size is measured again from the tabs as they are, so the controls and the overflow never outlive
// a widening. The arithmetic is ui/tabs/tab-strip.ts's; this is the part that reads the elements
// and writes the offset, apart from ui/tabs/Tabs.svelte so the component stays its markup and its
// keyboard.
//
// One of these belongs to one strip. Its state lives in the object it returns, never in the module.

import {
    type TabScrollState,
    type TabSpan,
    horizontalWheelDelta,
    revealOffset,
    tabEdgeStep,
    tabScrollState,
    wholeAt
} from '$lib/ui/tabs/tab-strip';

/** What the scroller reads of the component: its elements and which tab is showing, as they are now. */
export type TabScrollParts = {
    /** The scrolling tab list. */
    list: () => HTMLElement | undefined | null;
    /** The whole strip, the scroll controls and the menu opener included. */
    strip: () => HTMLElement | undefined | null;
    /** The menu opener at the strip's right, whose width the tabs never have. */
    opener: () => HTMLElement | undefined | null;
    /** Each tab's element, in order; a tab that has gone leaves null. */
    faces: () => readonly (HTMLElement | undefined | null)[];
    /** The index of the showing tab, or -1. */
    shown: () => number;
};

export type TabScroll = {
    /** The overflow state the scroll controls are drawn from. */
    state: () => TabScrollState;
    /** Measure the strip again after a scroll. */
    scrolled: () => void;
    /** Measure the strip again after a change of size, and bring the showing tab back if that took it out. */
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
     * Whether the showing tab was whole at the last measure at the list's width then. A change of
     * width that leaves it not whole brings it back; a scroll by the reader that takes it away does
     * not, since the reader asked for that.
     */
    let shownWhole = false;
    let measuredWidth = -1;

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
        state = tabScrollState(list.scrollWidth, list.clientWidth, list.scrollLeft, fits);
    }

    function scrolled(): void {
        const list = parts.list();
        if (!list) return;
        measure();
        if (list.clientWidth === measuredWidth) shownWhole = showingWhole(list);
    }

    function resized(): void {
        const list = parts.list();
        if (!list) return;
        const was = shownWhole || measuredWidth < 0;
        measure();
        measuredWidth = list.clientWidth;
        if (was && !showingWhole(list)) reveal(parts.shown());
        else shownWhole = showingWhole(list);
    }

    function restAt(left: number): void {
        const list = parts.list();
        if (!list) return;
        if (Math.abs(left - list.scrollLeft) > 0.5) list.scrollTo({ left });
        measure();
    }

    function reveal(index: number): void {
        const list = parts.list();
        if (!list || index < 0) return;
        const all = spans(list);
        const target = all.at(index);
        if (target === undefined) return;
        restAt(revealOffset(all, target, list.scrollLeft, list.clientWidth, maxScroll(list)));
        if (index === parts.shown()) {
            measuredWidth = list.clientWidth;
            shownWhole = showingWhole(list);
        }
    }

    function step(direction: -1 | 1): void {
        const list = parts.list();
        if (!list) return;
        restAt(tabEdgeStep(spans(list), list.scrollLeft, maxScroll(list), direction));
    }

    function wheel(event: WheelEvent): void {
        const list = parts.list();
        if (!list || !state.overflowing) return;
        const delta = horizontalWheelDelta(event.deltaX, event.deltaY);
        if (delta === 0) return;
        event.preventDefault();
        list.scrollLeft += delta;
        measure();
    }

    return {
        state: () => state,
        scrolled,
        resized,
        reveal,
        step,
        wheel
    };
}
