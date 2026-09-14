// Layer 3, shell. Pure keyboard routing and card geometry. The workbench supplies DOM-derived
// guard state and performs the returned action, leaving shortcut precedence testable without a DOM.

export type RailOrder = {
    direct: string[];
    all: string[];
    chords: Record<string, string[] | undefined>;
};

export type KeyContext = {
    currentView: string | null;
    cursorActive: boolean;
    typing: boolean;
    paletteOpen: boolean;
    trayOpen: boolean;
    confirmOpen: boolean;
};

export type KeyEventLike = {
    key: string;
    defaultPrevented?: boolean;
    metaKey?: boolean;
    ctrlKey?: boolean;
    altKey?: boolean;
    shiftKey?: boolean;
};

export type KeyState = {
    chord: string;
    chordAt: number;
    lastG: number;
};

export type KeyAction =
    | { kind: 'open'; view: string }
    | { kind: 'page'; index: number }
    | { kind: 'tab'; index: number }
    | { kind: 'cursor'; direction: 'left' | 'right' | 'up' | 'down' }
    | { kind: 'move'; direction: 'left' | 'right' }
    | { kind: 'activate' }
    | { kind: 'search' }
    | { kind: 'scroll'; edge: 'top' | 'bottom' }
    | { kind: 'sheet' }
    | { kind: 'clear-cursor' };

export type KeyResult = { action: KeyAction | null; state: KeyState };

export type CardRect = { top: number; left: number };

export const CHORD_MS = 1500;
export const DOUBLE_G_MS = 500;

export function initialKeyState(): KeyState {
    return { chord: '', chordAt: 0, lastG: 0 };
}

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

/** Resolve one unmodified workbench key, retaining only the two short-lived chord timestamps. */
export function resolveKey(
    event: KeyEventLike,
    order: RailOrder,
    context: KeyContext,
    state: KeyState,
    now: number
): KeyResult {
    // A modifier chord is not typing, so the tab keys answer with a field focused and under an
    // overlay; Cmd plus a digit is left to the browser, which has its own use for it.
    if (event.ctrlKey === true && event.metaKey !== true && /^[1-9]$/.test(event.key)) {
        return { action: { kind: 'tab', index: Number(event.key) }, state };
    }
    if (
        context.typing ||
        context.paletteOpen ||
        context.trayOpen ||
        context.confirmOpen ||
        event.defaultPrevented ||
        event.metaKey ||
        event.ctrlKey ||
        event.altKey
    ) {
        return { action: null, state };
    }

    if (event.key === 'Escape' && context.cursorActive) {
        return { action: { kind: 'clear-cursor' }, state: { ...state, chord: '' } };
    }
    if (event.key === '?') {
        return { action: { kind: 'sheet' }, state: { ...state, chord: '' } };
    }
    if (event.key === 'Tab') {
        if (order.all.length === 0) return { action: null, state: { ...state, chord: '' } };
        const current = context.currentView === null ? -1 : order.all.indexOf(context.currentView);
        const index =
            current < 0
                ? event.shiftKey
                    ? order.all.length - 1
                    : 0
                : (current + (event.shiftKey ? -1 : 1) + order.all.length) % order.all.length;
        return {
            action: { kind: 'open', view: order.all[index] },
            state: { ...state, chord: '' }
        };
    }

    if (Object.hasOwn(order.chords, event.key)) {
        return { action: null, state: { ...state, chord: event.key, chordAt: now } };
    }
    if (/^[1-9]$/.test(event.key)) {
        const cleared = { ...state, chord: '' };
        // A live chord names the list the digit counts into, and a digit past that list opens
        // nothing rather than falling through to a page, which would be a different surface.
        const chorded = now - state.chordAt < CHORD_MS ? order.chords[state.chord] : undefined;
        if (chorded !== undefined) {
            const view = chorded.at(Number(event.key) - 1);
            return {
                action: view === undefined ? null : { kind: 'open', view },
                state: cleared
            };
        }
        return { action: { kind: 'page', index: Number(event.key) }, state: cleared };
    }

    const cleared = { ...state, chord: '' };
    // The shifted cursor keys carry the card under the cursor rather than the cursor, which is the
    // keyboard path to the reorder the pointer does by dragging a card onto its neighbour.
    if (context.cursorActive && (event.key === 'J' || event.key === 'K')) {
        return {
            action: { kind: 'move', direction: event.key === 'J' ? 'left' : 'right' },
            state: cleared
        };
    }
    if (event.key === 'j' || event.key === 'ArrowLeft') {
        return { action: { kind: 'cursor', direction: 'left' }, state: cleared };
    }
    if (event.key === 'k' || event.key === 'ArrowRight') {
        return { action: { kind: 'cursor', direction: 'right' }, state: cleared };
    }
    if (event.key === 'i' || event.key === 'ArrowUp') {
        return { action: { kind: 'cursor', direction: 'up' }, state: cleared };
    }
    if (event.key === 'o' || event.key === 'ArrowDown') {
        return { action: { kind: 'cursor', direction: 'down' }, state: cleared };
    }
    if (event.key === 'Enter' && context.cursorActive) {
        return { action: { kind: 'activate' }, state: cleared };
    }
    if (event.key === '/') return { action: { kind: 'search' }, state: cleared };
    if (event.key === 'G') {
        return { action: { kind: 'scroll', edge: 'bottom' }, state: { ...cleared, lastG: 0 } };
    }
    if (event.key === 'g') {
        if (state.lastG > 0 && now - state.lastG < DOUBLE_G_MS) {
            return {
                action: { kind: 'scroll', edge: 'top' },
                state: { ...cleared, lastG: 0 }
            };
        }
        return { action: null, state: { ...cleared, lastG: now } };
    }
    return { action: null, state: cleared };
}
