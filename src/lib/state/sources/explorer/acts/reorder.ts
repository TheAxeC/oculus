// Layer 2, client state, pure. The arithmetic of putting one item of an ordered list before or
// after another, for the lists the Files view lets the reader reorder: the roots of the tree, the
// bookmarks, the notes and the sections. A drop, and Alt+Up or Alt+Down on a focused row, compute
// the new order here and the caller writes it; an order that comes out as the one it began with is
// answered as that same list, so the caller can tell that nothing is to be written.

/** Which edge of the target the moved items land on. */
export type Place = 'before' | 'after';

/** The part of a row's bounding box the pointer is read against. */
export type PlaceRect = { top: number; height: number };

/** Before when the pointer is in the row's upper half, after when it is in the lower half. */
export function dropPlace(rect: PlaceRect, clientY: number): Place {
    return clientY - rect.top < rect.height / 2 ? 'before' : 'after';
}

/** Whether two lists hold the same items in the same places. */
function same(left: string[], right: string[]): boolean {
    return left.length === right.length && left.every((one, at) => one === right[at]);
}

/**
 * The order with the moved keys taken out and put next to the target: before it or after it, in
 * the order they had. A key of `moving` that `order` does not hold is ignored. Dropping on one of
 * the moved keys themselves, or where nothing changes, answers `order` itself.
 *
 * `drawn` is the keys the reader sees, in `order`; a key of `order` outside it is hidden. A drop is
 * judged by what is drawn: when the drawn keys come out in the order they had, nothing is written,
 * and a hidden key keeps its place relative to the keys around it, since only the moved keys leave
 * and re-enter.
 */
export function reorderedKeys(
    order: string[],
    moving: string[],
    target: string,
    place: Place,
    drawn: string[] = order
): string[] {
    const carried = order.filter((key) => moving.includes(key));
    if (carried.length === 0 || carried.includes(target) || !order.includes(target)) return order;
    const rest = order.filter((key) => !carried.includes(key));
    const at = rest.indexOf(target) + (place === 'after' ? 1 : 0);
    const moved = [...rest.slice(0, at), ...carried, ...rest.slice(at)];
    const seen = new Set(drawn);
    return same(
        moved.filter((key) => seen.has(key)),
        order.filter((key) => seen.has(key))
    )
        ? order
        : moved;
}

/** The order with the moved keys last: a drop below the final row of the list. */
export function reorderedLast(
    order: string[],
    moving: string[],
    drawn: string[] = order
): string[] {
    const last = drawn.filter((key) => !moving.includes(key)).at(-1);
    return last === undefined ? order : reorderedKeys(order, moving, last, 'after', drawn);
}

/**
 * The order with one key moved a place up or down among the drawn keys, and `order` itself at the
 * list's end or for a key that is not drawn.
 */
export function steppedKeys(
    order: string[],
    key: string,
    step: 'up' | 'down',
    drawn: string[] = order
): string[] {
    const at = drawn.indexOf(key);
    const to = step === 'up' ? at - 1 : at + 1;
    const next = to < 0 ? undefined : drawn.at(to);
    if (at < 0 || next === undefined) return order;
    return reorderedKeys(order, [key], next, step === 'up' ? 'before' : 'after', drawn);
}
