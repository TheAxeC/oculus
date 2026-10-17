// Layer 3, primitive. The segmented control's contract: one choice, the id the callback names it
// by, its words and its icon; and where a key moves the choice, which the group's keyboard reads.

/** One choice in the group: the id the callback names it by, its words, and its icon. */
export type SegmentItem = { id: string; label: string; glyph?: string };

/**
 * The item a key moves the choice to in a group of `count` items from the one at `at`, as a radio
 * group's keyboard does: Right and Down to the next and Left and Up to the one before, each round
 * from the end to the start, Home to the first and End to the last. Null for any other key.
 */
export function segmentMove(key: string, at: number, count: number): number | null {
    if (count === 0) return null;
    switch (key) {
        case 'ArrowRight':
        case 'ArrowDown':
            return (at + 1) % count;
        case 'ArrowLeft':
        case 'ArrowUp':
            return (at - 1 + count) % count;
        case 'Home':
            return 0;
        case 'End':
            return count - 1;
        default:
            return null;
    }
}

/**
 * The item that holds the group's one Tab stop: the chosen one, or the first while none is chosen,
 * so Tab reaches the group once and lands where the choice is.
 */
export function segmentStop(items: readonly SegmentItem[], value: string): number {
    return Math.max(
        items.findIndex((item) => item.id === value),
        0
    );
}
