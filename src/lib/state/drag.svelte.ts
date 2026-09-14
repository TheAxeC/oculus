// Layer 2, client state. The one tab drag in progress. A strip starts it, whatever the pointer is
// over reports where a drop would land, and the pointer coming up performs it. There is one drag at
// a time on the page, so this is a module and not a component's state: the strip that started the
// drag and the pane the pointer ended over never meet.
//
// Nothing here reads the layout tree. A Drop names a tree, a pane's path and how the instance lands
// there; the operation that carries it out is state/layout.svelte.ts's, and it is reached through a
// sink so that a test can watch what a drag performs without a store or a DOM.
//
// The document listeners exist only while a drag is in progress. They are installed by start() and
// removed by end() and cancel(), so a page nobody is dragging on carries none, and a drag survives
// the pointer leaving the strip it began in, which is the whole reason they are on the document.

import { splitInstance, transferInstance } from './layout.svelte.ts';
import type { Edge, Target } from './layout/index.ts';

/** A point in the viewport, which is what getBoundingClientRect is measured in. */
export type Point = { x: number; y: number };

/** As much of a DOMRect as a drop needs: where the pane's body is, in the viewport. */
export type Rect = { x: number; y: number; width: number; height: number };

/**
 * Where a dragged instance would land: at an index in a pane's tab strip, alone in a new pane on one
 * edge of a pane's body, or at the end of a pane's strip, which is what the middle of a body means.
 */
export type Drop =
    | { kind: 'strip'; target: Target; path: number[]; index: number }
    | { kind: 'edge'; target: Target; path: number[]; edge: Edge }
    | { kind: 'centre'; target: Target; path: number[] };

/** The operations a drop is performed through. The store's are the default; a test hands its own. */
export type DragSink = {
    transfer: (id: string, target: Target, path: number[], index: number) => void;
    split: (id: string, target: Target, path: number[], edge: Edge) => void;
};

/** The drag as anything drawing it sees it. */
export type Dragging = {
    id: string;
    label: string;
    target: Target;
    point: Point;
    drop: Drop | null;
    /** The body of the pane the hovered drop is over, when the drop is an edge or a centre. */
    rect: Rect | null;
};

/** An index past every tab, which the pane's own clamp turns into the end of the strip. */
export const AT_END = Number.MAX_SAFE_INTEGER;

/** How far the pointer moves before a press becomes a drag, so a click on a tab is still a click. */
export const THRESHOLD = 6;

type Held = Dragging & { origin: Point; armed: boolean };

const store: { current: Held | null } = $state({ current: null });

const storeSink: DragSink = {
    transfer: (id, target, path, index) => transferInstance(id, target, path, index),
    split: (id, target, path, edge) => splitInstance(id, target, path, edge)
};

let sink: DragSink = storeSink;

/** Perform drops through these operations instead of the store's. Null puts the store's back. */
export function setDragSink(next: DragSink | null): void {
    sink = next ?? storeSink;
}

/** The drag in progress, or null when there is none or the pointer has not moved far enough yet. */
export function dragging(): Dragging | null {
    const held = store.current;
    if (!held?.armed) return null;
    const { id, label, target, point, drop, rect } = held;
    return { id, label, target, point, drop, rect };
}

/**
 * A pointer went down on a tab. Nothing is drawn and nothing will be performed until the pointer has
 * moved THRESHOLD pixels, so the press that starts a drag is the same press that selects a tab.
 */
export function start(id: string, target: Target, label: string, point: Point): void {
    store.current = {
        id,
        label,
        target,
        point,
        drop: null,
        rect: null,
        origin: point,
        armed: false
    };
    listen(true);
}

/** The pointer moved. Past the threshold the drag is armed and stays armed. */
export function move(point: Point): void {
    const held = store.current;
    if (held === null) return;
    const armed = held.armed || far(held.origin, point);
    store.current = { ...held, point, armed };
}

/**
 * Where the drop would land now, from whatever the pointer is over, and null when it is over nothing
 * that takes one. The rect is the pane body the indicator is drawn over, for an edge or a centre.
 */
export function hover(drop: Drop | null, rect: Rect | null = null): void {
    const held = store.current;
    if (held === null) return;
    store.current = { ...held, drop, rect };
}

/** The pointer came up: the hovered drop is performed, and nothing happens when none is hovered. */
export function end(): void {
    const held = store.current;
    store.current = null;
    listen(false);
    if (!held?.armed) return;
    const drop = held.drop;
    if (drop === null) return;
    if (drop.kind === 'strip') sink.transfer(held.id, drop.target, drop.path, drop.index);
    else if (drop.kind === 'centre') sink.transfer(held.id, drop.target, drop.path, AT_END);
    else sink.split(held.id, drop.target, drop.path, drop.edge);
}

/** Escape, or anything else that calls the drag off. Nothing is performed. */
export function cancel(): void {
    store.current = null;
    listen(false);
}

function far(origin: Point, point: Point): boolean {
    return Math.hypot(point.x - origin.x, point.y - origin.y) >= THRESHOLD;
}

function onPointerMove(event: PointerEvent): void {
    move({ x: event.clientX, y: event.clientY });
}

function onPointerUp(): void {
    end();
}

function onKeyDown(event: KeyboardEvent): void {
    if (event.key !== 'Escape') return;
    event.preventDefault();
    cancel();
}

/**
 * The document listeners a drag needs, and the text selection it must not make. There is no document
 * in the test suite, so a drag driven by its own calls runs there exactly as it does in a browser.
 */
function listen(on: boolean): void {
    if (typeof document === 'undefined') return;
    if (on) {
        document.addEventListener('pointermove', onPointerMove);
        document.addEventListener('pointerup', onPointerUp);
        document.addEventListener('pointercancel', onPointerUp);
        document.addEventListener('keydown', onKeyDown);
        document.body.style.userSelect = 'none';
        return;
    }
    document.removeEventListener('pointermove', onPointerMove);
    document.removeEventListener('pointerup', onPointerUp);
    document.removeEventListener('pointercancel', onPointerUp);
    document.removeEventListener('keydown', onKeyDown);
    document.body.style.userSelect = '';
}

/**
 * The index a move wants, from the index a strip drew. A strip measures against the tabs as they
 * are on screen, the dragged one among them; moveInstance counts against the tabs without it, so an
 * index past the dragged tab's own place is one too many. `own` is -1 when the strip does not hold
 * the dragged tab, and then the index is already the one the move wants.
 */
export function withoutOwn(index: number, own: number): number {
    return own >= 0 && index > own ? index - 1 : index;
}

/**
 * Where the strip draws the mark for an index a drop carries: withoutOwn read backwards. The two
 * places either side of the dragged tab are one index once it is taken out, so they come back as
 * the near side of it, and the mark sits where the tab already is. Every other index is exact.
 */
export function markAt(index: number, own: number): number {
    return own >= 0 && index > own ? index + 1 : index;
}

/**
 * The edge of a body a point sits in, or null for its middle. The outer quarter of the width and of
 * the height is an edge; a corner belongs to whichever of the two it is nearer, so every point has
 * one answer.
 */
export function edgeAt(rect: Rect, point: Point): Edge | null {
    if (rect.width <= 0 || rect.height <= 0) return null;
    const left = (point.x - rect.x) / rect.width;
    const top = (point.y - rect.y) / rect.height;
    const sides: { edge: Edge; depth: number }[] = [
        { edge: 'left', depth: left },
        { edge: 'right', depth: 1 - left },
        { edge: 'top', depth: top },
        { edge: 'bottom', depth: 1 - top }
    ];
    let nearest = sides[0];
    for (const side of sides) if (side.depth < nearest.depth) nearest = side;
    return nearest.depth < 0.25 ? nearest.edge : null;
}
