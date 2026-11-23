// Layer 3, primitive. The ticker's contract: what one row holds and what one of its buttons is
// called back with, the words a row draws as one text, and what each row of a list is told apart by
// while the list changes. Apart from the component so a view can build rows without importing it.

/**
 * One row: the glyph it is drawn with (none for the empty name), the words that name it, the muted
 * words after them, the words that date it, and the hue the tail is drawn in. A row with an `id`
 * is one the caller can be told about; a row without one is read and not clicked.
 */
export type TickerRow = {
    id: string;
    glyph: string;
    label: string;
    /** Words drawn after the name in muted text, such as the names of the people a line names. */
    detail?: string;
    tail?: string;
    tone?: string;
    /**
     * A short mark drawn in front of the name, such as the key of the hub the row's record is of.
     */
    mark?: string;
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
    /**
     * Draw the row as a heading over the rows after it that are marked `under`: its name in bold,
     * with its glyph, tail, buttons and the rest of a row's behaviour as any row has them.
     */
    heading?: boolean;
    /** Draw the row set in under the row above it that it belongs to, a heading or a fold. */
    under?: boolean;
    /**
     * Whether what the row folds is open, for a row that folds the rows after it, which the caller
     * leaves out of the list while it is closed; the row's fold control is drawn after its words.
     */
    fold?: boolean;
    /**
     * Keep the tail on a row that is cut, its name and detail taking the cut, for a tail as short
     * as an age.
     */
    whole?: boolean;
};

/**
 * One button on a row: what it is called back with, its words, and its hover title. A disabled
 * button is drawn and answers no press; the title says why.
 */
export type TickerAction = {
    id: string;
    label: string;
    title?: string;
    disabled?: boolean;
};

/** The words a row draws, in the order it draws them: its name, its detail and its tail. */
export function rowWords({ label, detail = '', tail = '' }: TickerRow): string {
    return [label, detail, tail].filter((words) => words !== '').join(' ');
}

/**
 * What each row of a list is told apart by while rows join and leave: its id, when no other row of
 * the list has it, and its place with its id otherwise.
 */
export function rowKeys(rows: readonly TickerRow[]): string[] {
    const counts = new Map<string, number>();
    for (const { id } of rows) counts.set(id, (counts.get(id) ?? 0) + 1);
    return rows.map(({ id }, at) => (counts.get(id) === 1 ? `=${id}` : `${at}:${id}`));
}
