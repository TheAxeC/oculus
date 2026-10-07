// Layer 3, view partial of views/sources/files/. The drag and the keys that put one item of a list
// before or after another: the section heads of the Files view, the bookmarks and the notes. A list
// is named by the type its drags carry, and each list holds the item its own drag carries and marks
// that drag with a type of its own, so a drag from another list, from the same kind of list of
// another Files tab, or from outside the page is no drop, whatever an earlier drag left behind. The
// order arithmetic is state/sources/explorer/acts/reorder.ts's and the write is the caller's.
//
// `order` is every item of the list in the order written and `drawn` the ones the reader sees, so
// an item that is not drawn is no drop target and keeps its place among its neighbours. A drop
// computes the new order and hands it to `write` only when it differs from the order held; a drop
// on the item itself, or one that leaves every item in place, writes nothing.

import type { ItemDrag } from '$lib/ui/tree/item-props';
import {
    dropPlace,
    reorderedKeys,
    steppedKeys,
    type Place
} from '$lib/state/sources/explorer/acts/reorder';

export type ListDragOptions = {
    /** The drag type of this kind of list. */
    type: string;
    order: () => string[];
    drawn: () => string[];
    write: (order: string[]) => void;
};

export function createListDrag(options: ListDragOptions) {
    /** The item a drag that started in this list carries, until the drag ends or drops. */
    let active: string | null = null;

    /** The type only this list's drags carry, which a drag over the list is read for. */
    const mine = `${options.type}.${Math.random().toString(36).slice(2)}`;

    /** Where the drop line is drawn, as an item and an edge. */
    let line: { id: string; place: Place } | null = $state.raw(null);

    /** Whether the drag in progress is an item of this list: it carries the type of this list. */
    function ours(event: DragEvent): boolean {
        return active !== null && (event.dataTransfer?.types ?? []).includes(mine);
    }

    function start(event: DragEvent, id: string): void {
        active = id;
        if (event.dataTransfer === null) return;
        event.dataTransfer.setData(options.type, id);
        event.dataTransfer.setData(mine, id);
        event.dataTransfer.effectAllowed = 'move';
    }

    function over(event: DragEvent, id: string): void {
        const rect =
            event.currentTarget instanceof Element
                ? event.currentTarget.getBoundingClientRect()
                : null;
        if (!ours(event) || active === id || rect === null || !options.drawn().includes(id)) {
            line = null;
            if (event.dataTransfer !== null && ours(event)) event.dataTransfer.dropEffect = 'none';
            return;
        }
        event.preventDefault();
        if (event.dataTransfer !== null) event.dataTransfer.dropEffect = 'move';
        line = { id, place: dropPlace(rect, event.clientY) };
    }

    function leave(event: DragEvent): void {
        const next = event.relatedTarget;
        if (event.currentTarget instanceof Node && next instanceof Node) {
            if (event.currentTarget.contains(next)) return;
        }
        line = null;
    }

    function drop(event: DragEvent, id: string): void {
        const at = line;
        line = null;
        if (!ours(event) || active === null || at?.id !== id) return;
        event.preventDefault();
        const moving = active;
        active = null;
        const order = options.order();
        const next = reorderedKeys(order, [moving], id, at.place, options.drawn());
        if (next !== order) options.write(next);
    }

    function end(): void {
        active = null;
        line = null;
    }

    return {
        /** The drag props of one item of the list. */
        row(id: string): ItemDrag {
            return {
                draggable: true,
                ondragstart: (event) => start(event, id),
                ondragover: (event) => over(event, id),
                ondragleave: leave,
                ondrop: (event) => drop(event, id),
                ondragend: end,
                place: line?.id === id ? line.place : undefined
            };
        },
        /** Move one item a place up or down among the drawn ones; nothing at the list's end. */
        step(id: string, direction: 'up' | 'down'): void {
            const order = options.order();
            const next = steppedKeys(order, id, direction, options.drawn());
            if (next !== order) options.write(next);
        }
    };
}

/** What a section head hands its section: its drag props, and what Alt+Up or Alt+Down does. */
export type SectionMove = {
    drag: ItemDrag;
    step: (direction: 'up' | 'down') => void;
};

/** The direction an Alt+Up or Alt+Down action names. */
function directionOf(action: string): 'up' | 'down' | null {
    if (action === 'move-up') return 'up';
    if (action === 'move-down') return 'down';
    return null;
}

/** The key handler of a section whose only movable row is its head: Alt+Up and Alt+Down move it. */
export function headKeys(move: SectionMove | undefined): (action: string, id: string) => boolean {
    return (action, id) => {
        const direction = directionOf(action);
        if (id !== 'head' || direction === null) return false;
        move?.step(direction);
        return true;
    };
}

/**
 * The key handler of a section with a list of rows: Alt+Up and Alt+Down move the section on its
 * head and an item of `list` on its row, whose id is `prefix` and the item's own id.
 */
export function listKeys(
    move: SectionMove | undefined,
    list: ReturnType<typeof createListDrag>,
    prefix: string
): (action: string, id: string) => boolean {
    return (action, id) => {
        const direction = directionOf(action);
        if (direction === null) return false;
        if (id === 'head') move?.step(direction);
        else if (id.startsWith(prefix)) list.step(id.slice(prefix.length), direction);
        else return false;
        return true;
    };
}
