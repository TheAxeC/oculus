// Layer 3, shell. The arithmetic of the float layer, apart from the component so a test can read
// it: the style a float is drawn with, the grid tracks the docked floats leave the body, how a move
// and a resize change a free float's fractions of the window, the size a dock gets from a drag of
// its sash, the edge a release docks on, and the depths the floats and the drag layer are drawn at.
// Everything here is a fraction of the window except the pixel inputs a gesture gives.

import {
    DOCK_MAX,
    FLOAT_MIN,
    START_H,
    START_W,
    type DockEdge,
    type Float,
    type FloatPlace
} from '$lib/state/workbench/layout';

/** How near a free float's pointer must come to an edge of the area, in pixels, to dock there. */
export const SNAP_PX = 24;

/**
 * The places this layer draws: a free float's and a dock's. A float placed in a window of the app
 * is drawn by that window's page, so the layer leaves it out before it styles one and
 * `floatStyle` never receives its place.
 */
export type DrawnPlace = Exclude<FloatPlace, { kind: 'window' }>;

/** A float this layer draws. */
export type DrawnFloat = Float & { place: DrawnPlace };

/** A free float's place, which is the only kind a gesture moves. */
export type FreePlace = Extract<FloatPlace, { kind: 'free' }>;

/** The edges of a free float a resize gesture moves. */
export type Edges = { left: boolean; right: boolean; top: boolean; bottom: boolean };

/** The border of every float: the theme's own orange. */
const BORDER = 'border: 1px solid var(--float-border)';

/**
 * A fraction of the window as the viewport unit that is that fraction of it, without float noise.
 */
function viewport(fraction: number, unit: 'vw' | 'vh'): string {
    return `${Number((fraction * 100).toFixed(3))}${unit}`;
}

/**
 * The style a float is drawn with. A free float is placed by its fractions of the window; a docked
 * float is placed by the grid track it sits in (bodyTracks), so it carries the border alone. A
 * float in a window of its own is drawn by no one here, so it has no style.
 */
export function floatStyle(place: DrawnPlace): string {
    if (place.kind === 'dock') return BORDER;
    return [
        `left: ${viewport(place.x, 'vw')}`,
        `top: ${viewport(place.y, 'vh')}`,
        `width: ${viewport(place.w, 'vw')}`,
        `height: ${viewport(place.h, 'vh')}`,
        BORDER
    ].join('; ');
}

/** The size a docked float holds along an edge, or nothing for an edge no float is docked on. */
function dockSize(floats: Float[], edge: DockEdge): number {
    for (const float of floats) {
        if (float.place.kind === 'dock' && float.place.edge === edge) return float.place.size;
    }
    return 0;
}

/**
 * The grid the body lays the rail, the docks and the area out in: the rail, the left dock, the
 * area and the right dock across, and the area over the bottom dock down. An edge with no float is
 * a track of no size.
 */
export function bodyTracks(floats: Float[]): string {
    const left = dockSize(floats, 'left');
    const right = dockSize(floats, 'right');
    const bottom = dockSize(floats, 'bottom');
    const across = [
        'auto',
        left === 0 ? '0' : viewport(left, 'vw'),
        'minmax(0, 1fr)',
        right === 0 ? '0' : viewport(right, 'vw')
    ];
    const down = ['minmax(0, 1fr)', bottom === 0 ? '0' : viewport(bottom, 'vh')];
    return `grid-template-columns: ${across.join(' ')}; grid-template-rows: ${down.join(' ')}`;
}

/** A free float moved by fractions of the window, kept inside it. */
export function movePlace(place: FreePlace, dx: number, dy: number): FreePlace {
    return {
        kind: 'free',
        x: Math.min(Math.max(place.x + dx, 0), 1 - place.w),
        y: Math.min(Math.max(place.y + dy, 0), 1 - place.h),
        w: place.w,
        h: place.h
    };
}

/**
 * One axis of a resize: the origin and the extent after the edges at the low and high ends moved by
 * `delta`, none smaller than FLOAT_MIN, the opposite edge staying where it was, and none outside
 * the window.
 */
function resizeAxis(
    origin: number,
    extent: number,
    low: boolean,
    high: boolean,
    delta: number
): { origin: number; extent: number } {
    let start = origin;
    let end = origin + extent;
    if (low) start = Math.min(Math.max(start + delta, 0), end - FLOAT_MIN);
    if (high) end = Math.max(Math.min(end + delta, 1), start + FLOAT_MIN);
    return { origin: start, extent: end - start };
}

/** A free float resized by dragging some of its edges by fractions of the window. */
export function resizePlace(place: FreePlace, edges: Edges, dx: number, dy: number): FreePlace {
    const across = resizeAxis(place.x, place.w, edges.left, edges.right, dx);
    const down = resizeAxis(place.y, place.h, edges.top, edges.bottom, dy);
    return { kind: 'free', x: across.origin, y: down.origin, w: across.extent, h: down.extent };
}

/**
 * The size a docked float takes when its sash is dragged `delta` pixels along the window's
 * `extent` (its width for the left and right docks, its height for the bottom one). The sash of a
 * dock on the right or the bottom grows it by moving back toward the origin, so those two take the
 * movement the other way round.
 */
export function dockedSize(edge: DockEdge, size: number, delta: number, extent: number): number {
    if (extent <= 0) return size;
    const grown = edge === 'left' ? delta : -delta;
    return Math.min(Math.max(size + grown / extent, FLOAT_MIN), DOCK_MAX);
}

/**
 * The edge of the area a free float's pointer is released within SNAP_PX of, or null. The left edge
 * is taken before the right and the bottom, so a corner has one answer.
 */
export function snapEdge(
    point: { x: number; y: number },
    area: { left: number; right: number; bottom: number }
): DockEdge | null {
    if (point.x - area.left <= SNAP_PX) return 'left';
    if (area.right - point.x <= SNAP_PX) return 'right';
    if (area.bottom - point.y <= SNAP_PX) return 'bottom';
    return null;
}

/**
 * The rectangle in the viewport a tab dragged with Alt held would float as, were it released at
 * `point`: the starting size, its corner at the point, kept inside the window.
 */
export function outlineAt(
    point: { x: number; y: number },
    window: { width: number; height: number }
): { x: number; y: number; width: number; height: number } {
    const width = window.width * START_W;
    const height = window.height * START_H;
    return {
        x: Math.min(Math.max(point.x, 0), window.width - width),
        y: Math.min(Math.max(point.y, 0), window.height - height),
        width,
        height
    };
}

/** The z-index of the rearmost free float. */
export const BASE_DEPTH = 5;

/**
 * The free floats from the rearmost to the front: the ids `order` holds that are still free
 * floats, in that order, and in front of them the floats the order has not met, in the order the
 * floats are listed, so a float just made is drawn on top. An id of a float that no longer exists
 * is dropped.
 */
export function stackOf(order: string[], free: string[]): string[] {
    const live = new Set(free);
    const kept = order.filter((id) => live.has(id));
    const known = new Set(kept);
    return [...kept, ...free.filter((id) => !known.has(id))];
}

/** The stack after a press on `id`: that float last, or the stack as it was for an id not free. */
export function raised(order: string[], free: string[], id: string): string[] {
    const stack = stackOf(order, free);
    if (!free.includes(id)) return stack;
    return [...stack.filter((one) => one !== id), id];
}

/**
 * The z-index of a float by its rank in the stack: each float two above the one behind it, so the
 * odd depth between two floats is the one the frames of the front float's tabs are drawn at
 * (shell/frames/FrameLayer.svelte).
 */
export function depthOf(stack: string[], id: string): number {
    return BASE_DEPTH + 2 * Math.max(stack.indexOf(id), 0);
}

/** The z-index of the drag layer, above the front float of `count` free floats and its frames. */
export function dragDepth(count: number): number {
    return BASE_DEPTH + 2 * count;
}
