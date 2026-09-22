// Layer 3, primitive. The ticker's contract: what one row holds and what one of its buttons is
// called back with. Apart from the component so a view can build rows without importing it.

/**
 * One row: the glyph it is drawn with, the words that name it, the words that date it, and the
 * hue the tail is drawn in. A row with an `id` is one the caller can be told about; a row
 * without one is read and not clicked.
 */
export type TickerRow = {
    id: string;
    glyph: string;
    label: string;
    tail?: string;
    tone?: string;
    /**
     * Small buttons after the tail. Each is an id the caller knows and words it translated;
     * what pressing one does is the caller's and nothing here knows what an action is.
     */
    actions?: TickerAction[];
    /**
     * Draw the name as text even in a list that can be picked. A row needs an id to be told
     * apart when one of its buttons is pressed, and not every such row names something the
     * caller can open; this says so, rather than leaving a button that does nothing.
     */
    plain?: boolean;
};

/** One button on a row: what it is called back with, its words, and its hover title. */
export type TickerAction = {
    id: string;
    label: string;
    title?: string;
};
