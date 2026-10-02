// Layer 3, shell. The pointer gestures of a free float, on interactjs: a drag from the empty part
// of the tab strip moves it, a drag from its edges and corners resizes it. The attachment holds no
// float and writes nothing: it reports the place the gesture has reached while it runs and the
// place and the pointer where it ends, and the float layer decides what that means. It is attached
// while the float is free and removed when the float docks. The arithmetic is float-geometry.ts's.

import interactjs from 'interactjs';
import type { Attachment } from 'svelte/attachments';
import { movePlace, resizePlace, type Edges, type FreePlace } from './float-geometry';

/**
 * The part of an interactjs event the gestures read: where the pointer is, where the gesture
 * began, and, for a resize, which edges the pointer holds. The package's own typings reach the
 * compiler only through a module it does not install, so this is the shape asked of it.
 */
type GestureEvent = {
    clientX: number;
    clientY: number;
    clientX0: number;
    clientY0: number;
    edges?: Partial<Record<keyof Edges, boolean | null>>;
};

/** The calls made on an interactable: its options, its listeners and its removal. */
type Interactable = {
    draggable: (options: GestureOptions) => Interactable;
    resizable: (options: GestureOptions) => Interactable;
    styleCursor: (on: boolean) => Interactable;
    unset: () => void;
};

type GestureOptions = {
    allowFrom?: string;
    ignoreFrom?: string;
    edges?: Edges;
    margin?: number;
    listeners: {
        start: () => void;
        move: (event: GestureEvent) => void;
        end: (event: GestureEvent) => void;
    };
};

const interact = interactjs as unknown as (target: HTMLElement) => Interactable;

/** How far inside and outside its border a float's edge catches a resize, in pixels. */
const GRAB_PX = 6;

/** What a float layer hands the action. */
export type Gesture = {
    /** The float's place, read when a gesture begins. */
    place: () => FreePlace;
    /** The float was pressed on: it goes in front of the other floats. */
    raise: () => void;
    /** The place a running gesture has reached, and null once the gesture is over. */
    follow: (place: FreePlace | null) => void;
    /** A gesture ended on this place; `point` is where a move was let go, null for a resize. */
    done: (place: FreePlace, point: { x: number; y: number } | null) => void;
};

/**
 * A move begins on the tab strip, but not on a tab or a button, which have gestures of their own.
 */
const MOVE_FROM = '[data-tab-strip]';
const MOVE_NOT_FROM = '[role="tablist"] *, button';

/** A resize event's edges as booleans. */
function edgesOf(edges: GestureEvent['edges']): Edges {
    return {
        left: edges?.left === true,
        right: edges?.right === true,
        top: edges?.top === true,
        bottom: edges?.bottom === true
    };
}

/** Make a float's element movable and resizable until the attachment is removed. */
export function gesture(held: Gesture): Attachment<HTMLElement> {
    return (node) => {
        let from: FreePlace | null = null;
        let reached: FreePlace | null = null;

        function begin(): void {
            from = held.place();
            reached = from;
            held.raise();
        }

        function fractions(event: {
            clientX: number;
            clientY: number;
            clientX0: number;
            clientY0: number;
        }) {
            return {
                dx: (event.clientX - event.clientX0) / window.innerWidth,
                dy: (event.clientY - event.clientY0) / window.innerHeight
            };
        }

        function finish(point: { x: number; y: number } | null): void {
            const place = reached;
            from = null;
            reached = null;
            if (place !== null) held.done(place, point);
            held.follow(null);
        }

        const target = interact(node)
            .draggable({
                allowFrom: MOVE_FROM,
                ignoreFrom: MOVE_NOT_FROM,
                listeners: {
                    start: begin,
                    move(event) {
                        if (from === null) return;
                        const { dx, dy } = fractions(event);
                        reached = movePlace(from, dx, dy);
                        held.follow(reached);
                    },
                    end: (event) => finish({ x: event.clientX, y: event.clientY })
                }
            })
            .resizable({
                edges: { left: true, right: true, top: true, bottom: true },
                margin: GRAB_PX,
                listeners: {
                    start: begin,
                    move(event) {
                        if (from === null) return;
                        const { dx, dy } = fractions(event);
                        reached = resizePlace(from, edgesOf(event.edges), dx, dy);
                        held.follow(reached);
                    },
                    end: () => finish(null)
                }
            })
            .styleCursor(true);

        return () => target.unset();
    };
}
