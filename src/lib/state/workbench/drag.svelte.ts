// Layer 2, client state. The one drag in progress, of a pane's tab, of a page carried out of the
// Pages view, or of a view carried out of the Views catalogue. A strip, a page row or a catalogue
// entry starts it, whatever the pointer is over reports where a drop would land, and the pointer
// coming up performs it. A tab dragged with Alt held lands nowhere in particular: it becomes a
// float at the pointer, wherever the pointer comes up. There is one drag at a time on the page, so
// this is a module and not a component's state: the control that started the drag and the pane the
// pointer ended over never meet.
//
// In the desktop app a tab let go outside the window, over no pane, is handed to the host with the
// point it was let go at (`outside` of the sink): another window of the app under that point takes
// the tab, and none opens a new window there. A window handed a tab by the host performs the drop
// it would have performed had the pointer come up over it (`receive`).
//
// Nothing here reads the layout tree. A Drop names a pane's path and how the instance lands there;
// the operation that carries it out is state/workbench/layout.svelte.ts's, and it is reached
// through a sink so that a test can watch what a drag performs without a store or a DOM.
//
// The document listeners exist only while a drag is in progress. They are installed by start() and
// removed by end() and cancel(), so a page nobody is dragging on carries none, and a drag survives
// the pointer leaving the control it began in, which is the whole reason they are on the document.

import type { Desktop } from '../shared/stores/desktop.ts';
import type { LayoutStore } from './layout.svelte.ts';
import { WINDOW_START, type Edge } from './layout/index.ts';

/** A point in the viewport, which is what getBoundingClientRect is measured in. */
export type Point = { x: number; y: number };

/** As much of a DOMRect as a drop needs: where the pane's body is, in the viewport. */
export type Rect = { x: number; y: number; width: number; height: number };

/**
 * Where a dragged instance would land: at an index in a pane's tab strip, alone in a new pane on
 * one edge of a pane's body, or at the end of a pane's strip, which is what the middle of a body
 * means. Each names the page whose tree the path is in; a drop carrying none lands in the page on
 * screen.
 */
export type Drop =
    | { kind: 'strip'; path: number[]; index: number; page?: string }
    | { kind: 'centre'; path: number[]; page?: string }
    | { kind: 'edge'; path: number[]; edge: Edge; page?: string };

/**
 * The operations a drop is performed through. The store's are the default; a test hands its own.
 */
export type DragSink = {
    /**
     * Open a view on a page and answer the instance it opened or activated, or the empty string
     * when there is no such page; a dropped view is that instance moved to where it was dropped.
     */
    open: (view: string, state: unknown, page?: string) => string;
    /** Whether the pane at a path holds one instance, the one a view was carried out of. */
    holds: (path: number[], id: string, page?: string) => boolean;
    /** Open a view on a page in a pane other than the one holding `avoid`. */
    away: (view: string, state: unknown, avoid: string, page?: string) => void;
    transfer: (id: string, path: number[], index: number, page?: string) => void;
    split: (id: string, path: number[], edge: Edge, page?: string) => void;
    embed: (nested: string, path: number[], edge: Edge, page?: string) => void;
    /** Put a tab over every page as a float whose corner is this point of the viewport. */
    float: (id: string, at: Point) => void;
    /**
     * Hand a tab let go outside the window to the app, at this point of the screen. Absent in a
     * browser, where such a drop performs nothing.
     */
    outside?: (id: string, at: Point) => void;
};

/**
 * What is being dragged: a tab of a pane, which lands in a strip, a body or an edge; a page from
 * the Pages view, which lands on an edge alone, since a page has no tab to put among a pane's; or a
 * view from the catalogue, which lands wherever a tab does, as the tab it opens as.
 */
export type DragKind = 'tab' | 'page' | 'view';

/** The drag as anything drawing it sees it. */
export type Dragging = {
    /** Whether the id is an instance, a page or a view, which is what says where it may land. */
    kind: DragKind;
    id: string;
    /** What a dragged view is opened with: a document's path, or nothing for a view. */
    state?: unknown;
    /** The instance a dragged view was carried out of, which its drop never covers. */
    from?: string;
    label: string;
    point: Point;
    drop: Drop | null;
    /** The body of the pane the hovered drop is over, when the drop is an edge or a centre. */
    rect: Rect | null;
    /** Whether what is under the pointer is a place this cannot land, which is said while it is. */
    refused: boolean;
    /**
     * Whether Alt is held on a dragged tab, which floats it at the pointer wherever it is let go.
     */
    alt: boolean;
};

/** Whether a point of the viewport is inside the window. */
function inside(point: Point): boolean {
    return (
        point.x >= 0 &&
        point.y >= 0 &&
        point.x <= window.innerWidth &&
        point.y <= window.innerHeight
    );
}

/** An index past every tab, which the pane's own clamp turns into the end of the strip. */
export const AT_END = Number.MAX_SAFE_INTEGER;

/**
 * How far the pointer moves before a press becomes a drag, so a click on a tab is still a click.
 */
export const THRESHOLD = 6;

type Held = Dragging & {
    origin: Point;
    armed: boolean;
    /** Where the pointer last was on the screen, which the app places a window by. */
    screen: Point | null;
};

function far(origin: Point, point: Point): boolean {
    return Math.hypot(point.x - origin.x, point.y - origin.y) >= THRESHOLD;
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

/** The one drag in progress, for one client. */
export type DragStore = {
    setDragSink: (next: DragSink | null) => void;
    dragging: () => Dragging | null;
    start: (id: string, label: string, point: Point) => void;
    startPage: (id: string, label: string, point: Point) => void;
    startView: (view: string, state: unknown, label: string, point: Point, from?: string) => void;
    move: (point: Point, alt?: boolean, screen?: Point) => void;
    hover: (drop: Drop | null, rect?: Rect | null, refused?: boolean) => void;
    end: () => void;
    cancel: () => void;
    /**
     * Perform the drop of a tab another window of the app handed this one, at a point of this
     * window's viewport: the pointer is reported over what is under the point, as it would have
     * been, and the drop it lands on is performed. Nothing happens over no pane. Answers whether
     * a drop was performed.
     */
    receive: (id: string, at: Point) => boolean;
};

export function createDrag(layout: LayoutStore, desktop?: Desktop): DragStore {
    const store: { current: Held | null } = $state({ current: null });

    const storeSink: DragSink = {
        open: (view, state, page) => layout.openView(view, state, page ?? layout.currentPage().id),
        holds: (path, id, page) => layout.paneHolds(path, id, page ?? layout.currentPage().id),
        away: (view, state, avoid, page) => {
            layout.openAway(view, state, page ?? layout.currentPage().id, avoid);
        },
        transfer: (id, path, index, page) => layout.transferInstance(id, path, index, page),
        split: (id, path, edge, page) => layout.splitInstance(id, path, edge, page),
        embed: (nested, path, edge, page) => layout.embedPage(nested, path, edge, page),
        float: (id, at) =>
            layout.floatTab(id, { x: at.x / window.innerWidth, y: at.y / window.innerHeight }),
        outside:
            desktop === undefined
                ? undefined
                : (id, at) => {
                      // The point is read out of the drag's reactive state: an IPC message carries
                      // plain data, and a reactive object cannot be cloned.
                      const point = { x: at.x, y: at.y };
                      void desktop.bridge.dropOutside({ tab: id, at: point }).then((taken) => {
                          if (!taken) layout.windowTab(id, { ...at, ...WINDOW_START });
                      });
                  }
    };

    let sink: DragSink = storeSink;

    /**
     * Perform drops through these operations instead of the store's. Null puts the store's back.
     */
    function setDragSink(next: DragSink | null): void {
        sink = next ?? storeSink;
    }

    /**
     * The drag in progress, or null when there is none or the pointer has not moved far enough yet.
     */
    function dragging(): Dragging | null {
        const held = store.current;
        if (!held?.armed) return null;
        const { kind, id, state, from, label, point, drop, rect, refused, alt } = held;
        return { kind, id, state, from, label, point, drop, rect, refused, alt };
    }

    /**
     * A pointer went down on a tab. Nothing is drawn and nothing will be performed until the
     * pointer has moved THRESHOLD pixels, so the press that starts a drag is the same press that
     * selects a tab.
     */
    function start(id: string, label: string, point: Point): void {
        store.current = {
            id,
            label,
            point,
            drop: null,
            rect: null,
            refused: false,
            alt: false,
            kind: 'tab',
            origin: point,
            armed: false,
            screen: null
        };
        listen(true);
    }

    /**
     * A page is being carried out of the Pages view. The gesture that starts it has already crossed
     * the threshold on the page's row, so this one is armed from the first move: the ghost is drawn
     * where the pointer already is rather than THRESHOLD pixels further on.
     */
    function startPage(id: string, label: string, point: Point): void {
        store.current = {
            id,
            label,
            point,
            drop: null,
            rect: null,
            refused: false,
            alt: false,
            kind: 'page',
            origin: point,
            armed: true,
            screen: null
        };
        listen(true);
    }

    /**
     * A view is being carried out of the catalogue. Like a tab it is armed only past the
     * threshold, so the press that starts it is still the click that opens the view.
     */
    function startView(
        view: string,
        state: unknown,
        label: string,
        point: Point,
        from?: string
    ): void {
        store.current = {
            id: view,
            state,
            from,
            label,
            point,
            drop: null,
            rect: null,
            refused: false,
            alt: false,
            kind: 'view',
            origin: point,
            armed: false,
            screen: null
        };
        listen(true);
    }

    /**
     * The pointer moved. Past the threshold the drag is armed and stays armed. Alt means something
     * to a tab only: a page and a view are never floated.
     */
    function move(point: Point, alt = false, screen?: Point): void {
        const held = store.current;
        if (held === null) return;
        const armed = held.armed || far(held.origin, point);
        store.current = {
            ...held,
            point,
            armed,
            alt: held.kind === 'tab' && alt,
            screen: screen ?? held.screen
        };
    }

    /**
     * Where the drop would land now, from whatever the pointer is over, and null when it is over
     * nothing that takes one. The rect is the pane body the indicator is drawn over, for an edge or
     * a centre.
     */
    function hover(drop: Drop | null, rect: Rect | null = null, refused = false): void {
        const held = store.current;
        if (held === null) return;
        // A page has no tab of its own, so the only place it lands is an edge: anywhere else the
        // pointer reports is no drop at all, and the pointer coming up there performs nothing.
        const taken = held.kind === 'page' && drop !== null && drop.kind !== 'edge' ? null : drop;
        store.current = { ...held, drop: taken, rect, refused: taken === null && refused };
    }

    /**
     * The pointer came up: the hovered drop is performed, and nothing happens when none is hovered.
     */
    function end(): void {
        const held = store.current;
        store.current = null;
        listen(false);
        if (!held?.armed) return;
        if (held.alt) {
            sink.float(held.id, held.point);
            return;
        }
        const drop = held.drop;
        if (drop === null) {
            if (held.kind === 'tab' && held.screen !== null && !inside(held.point)) {
                sink.outside?.(held.id, held.screen);
            }
            return;
        }
        if (held.kind === 'page') {
            if (drop.kind === 'edge') sink.embed(held.id, drop.path, drop.edge, drop.page);
            return;
        }
        // A view dropped into the middle or the strip of the pane it was carried out of opens clear
        // of that pane, so the catalogue is never covered by the view it opened.
        const from = held.kind === 'view' ? held.from : undefined;
        if (from !== undefined && drop.kind !== 'edge' && sink.holds(drop.path, from, drop.page)) {
            sink.away(held.id, held.state, from, drop.page);
            return;
        }
        // A view lands as the tab it opens as: opened on the page it was dropped on, then moved
        // there exactly as a tab dragged there would be.
        const id = held.kind === 'view' ? sink.open(held.id, held.state, drop.page) : held.id;
        if (id === '') return;
        if (drop.kind === 'strip') sink.transfer(id, drop.path, drop.index, drop.page);
        else if (drop.kind === 'centre') sink.transfer(id, drop.path, AT_END, drop.page);
        else sink.split(id, drop.path, drop.edge, drop.page);
    }

    /** Escape, or anything else that calls the drag off. Nothing is performed. */
    function cancel(): void {
        store.current = null;
        listen(false);
    }

    function onPointerMove(event: PointerEvent): void {
        move({ x: event.clientX, y: event.clientY }, event.altKey, {
            x: event.screenX,
            y: event.screenY
        });
    }

    function onPointerUp(event: PointerEvent): void {
        move({ x: event.clientX, y: event.clientY }, event.altKey, {
            x: event.screenX,
            y: event.screenY
        });
        end();
    }

    function receive(id: string, at: Point): boolean {
        store.current = {
            id,
            label: '',
            point: at,
            drop: null,
            rect: null,
            refused: false,
            alt: false,
            kind: 'tab',
            origin: at,
            armed: true,
            screen: null
        };
        const under =
            typeof document === 'undefined' ? null : document.elementFromPoint(at.x, at.y);
        under?.dispatchEvent(
            new PointerEvent('pointermove', { clientX: at.x, clientY: at.y, bubbles: true })
        );
        const taken = (dragging()?.drop ?? null) !== null;
        end();
        return taken;
    }

    function onKeyDown(event: KeyboardEvent): void {
        if (event.key === 'Alt') {
            holdAlt(true);
            return;
        }
        if (event.key !== 'Escape') return;
        event.preventDefault();
        cancel();
    }

    function onKeyUp(event: KeyboardEvent): void {
        if (event.key === 'Alt') holdAlt(false);
    }

    /** Alt pressed or let go with the pointer at rest still changes what the drop would do. */
    function holdAlt(alt: boolean): void {
        const held = store.current;
        if (held === null) return;
        store.current = { ...held, alt: held.kind === 'tab' && alt };
    }

    /**
     * The document listeners a drag needs, and the text selection it must not make. There is no
     * document in the test suite, so a drag driven by its own calls runs there exactly as it does
     * in a browser.
     */
    function listen(on: boolean): void {
        if (typeof document === 'undefined') return;
        if (on) {
            document.addEventListener('pointermove', onPointerMove);
            document.addEventListener('pointerup', onPointerUp);
            document.addEventListener('pointercancel', onPointerUp);
            document.addEventListener('keydown', onKeyDown);
            document.addEventListener('keyup', onKeyUp);
            document.body.style.userSelect = 'none';
            return;
        }
        document.removeEventListener('pointermove', onPointerMove);
        document.removeEventListener('pointerup', onPointerUp);
        document.removeEventListener('pointercancel', onPointerUp);
        document.removeEventListener('keydown', onKeyDown);
        document.removeEventListener('keyup', onKeyUp);
        document.body.style.userSelect = '';
    }

    return {
        setDragSink,
        dragging,
        start,
        startPage,
        startView,
        move,
        hover,
        end,
        cancel,
        receive
    };
}
