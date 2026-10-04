// Layer 2, client state. Where the Settings view's table of contents is. At 700 px and over it sits
// beside the list. Under that it is behind a toggle in the header, which shows it over the list; a
// press on one of its entries or Escape hides it again. A pane that is not measured yet counts as
// wide, so the first draw puts the table beside the list.

/** The narrowest the view may be with the table of contents beside the list. */
const NARROW = 700;

/** What a press does to the table shown over the list. */
export type Press = 'toggle' | 'choose' | 'escape';

/** Where the table is for a pane `width` px wide and a table the reader asked to see. */
export type Place = {
    /** The table is drawn beside the list. */
    beside: boolean;
    /** The header offers the toggle. */
    toggle: boolean;
    /** The table is drawn over the list. */
    over: boolean;
};

function isNarrow(width: number): boolean {
    return width > 0 && width < NARROW;
}

/** Where the table is. A table left shown from a narrower pane is not drawn over a wide one. */
export function contentsPlace(width: number, open: boolean): Place {
    const narrow = isNarrow(width);
    return { beside: !narrow, toggle: narrow, over: narrow && open };
}

/** Whether the table is asked for after a press: always not, in a pane wide enough to hold it. */
export function contentsAfter(open: boolean, press: Press, width: number): boolean {
    if (!isNarrow(width)) return false;
    return press === 'toggle' ? !open : false;
}
