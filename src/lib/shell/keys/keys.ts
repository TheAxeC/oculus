// Layer 3, shell. Card geometry and the view toggle the workbench's keys and its status bar share.
// The keys themselves are resolved by data/helpers/keys/oculus/resolve.ts.

export type CardRect = { top: number; left: number };

/** The next index for a horizontal cursor move, clamped to the visible card list. */
export function horizontalCursor(current: number, count: number, direction: -1 | 1): number {
    if (count <= 0) return -1;
    if (current < 0) return 0;
    return Math.max(0, Math.min(current + direction, count - 1));
}

/** The nearest card on a further row, using a weighted vertical and horizontal gap. */
export function rowCursor(rects: CardRect[], current: number, direction: -1 | 1): number {
    if (rects.length === 0) return -1;
    if (current < 0 || current >= rects.length) return 0;
    const from = rects[current];
    let best = -1;
    let score = Number.POSITIVE_INFINITY;
    for (const [index, candidate] of rects.entries()) {
        if (index === current) continue;
        if (direction > 0 ? candidate.top <= from.top + 1 : candidate.top >= from.top - 1) continue;
        const candidateScore =
            Math.abs(candidate.top - from.top) * 4 + Math.abs(candidate.left - from.left);
        if (candidateScore >= score) continue;
        best = index;
        score = candidateScore;
    }
    return best < 0 ? current : best;
}

/**
 * Show a view, or hide it when it is the instance on screen in the page. The Problems key and the
 * status bar's Problems item both toggle the view through this. Hiding keeps the instance's UI
 * state (a view's filter, toggles and scope) in the ui store under a record of the page and the
 * view, and the next show gives it to the instance it opens, so a hidden view comes back as it
 * was, whichever of the two callers hid it and showed it. Both name the page, so the record is
 * the page's own. Closing a tab by its own close button forgets the state, as the layout's close
 * does.
 */
export function toggleView(
    layout: {
        activeInstance: (page?: string) => { id: string; view: string } | null;
        closeInstance: (id: string, page?: string) => void;
        openView: (view: string, state?: unknown, page?: string) => string;
    },
    ui: {
        instanceState: (id: string) => unknown;
        setInstanceState: (id: string, state: unknown) => void;
        clearInstanceState: (id: string) => void;
    },
    view: string,
    page: string
): void {
    const active = layout.activeInstance(page);
    const hidden = `hidden-view:${page}:${view}`;
    if (active !== null && active.view === view) {
        const kept = ui.instanceState(active.id);
        layout.closeInstance(active.id, page);
        if (kept !== undefined) ui.setInstanceState(hidden, kept);
        return;
    }
    const kept = ui.instanceState(hidden);
    const id = layout.openView(view, undefined, page);
    if (kept === undefined) return;
    ui.clearInstanceState(hidden);
    if (id !== '' && ui.instanceState(id) === undefined) ui.setInstanceState(id, kept);
}
