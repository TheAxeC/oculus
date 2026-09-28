// Layer 3, view partial. How the Pages view tells a row's click from the release of a drag the
// row started, by the rule Catalogue.svelte's dragged() keeps: the press holds its origin, and a
// click a pointer made at or past the drag threshold from there is the drop's.

import { THRESHOLD, type Point } from '$lib/state/workbench/drag.svelte';

/** What a row's click says of where it landed, and whether a pointer made it. */
export type RowClick = { clientX: number; clientY: number; detail: number };

/**
 * A row's press and the click that follows it. The press keeps where it went down; a click at or
 * past the drag threshold from there, made by a pointer, is the end of a drag the row started,
 * and is the drop's rather than a show. Any other click shows the row's page, a keyboard's
 * (detail 0) included.
 */
export function rowPresses(show: (id: string) => void): {
    down: (at: Point) => void;
    click: (id: string, event: RowClick) => void;
} {
    let origin: Point | null = null;
    return {
        down(at: Point): void {
            origin = at;
        },
        click(id: string, event: RowClick): void {
            const from = origin;
            origin = null;
            if (from !== null && event.detail > 0) {
                const distance = Math.hypot(event.clientX - from.x, event.clientY - from.y);
                if (distance >= THRESHOLD) return;
            }
            show(id);
        }
    };
}
