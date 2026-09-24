// Layer 1, data. A venue's indexing fields as the Venues card draws them. registries/venues.yml
// writes an indexing field as prose that may open with a check or a cross mark, `wos: "<check>
// SCIE"` or `wos: "<cross>"`; the mark is a yes or a no, which the card draws as the `check` or
// `cross` glyph beside the rest of the words, so no emoji of the hub file reaches the page. The
// hub file is read as it is and never rewritten.

/** A yes or a no an indexing field opens with. */
export type IndexMark = 'yes' | 'no';

/** The field's words without its mark, and the mark it opened with, if any. */
export type Indexing = { words: string; mark?: IndexMark };

/**
 * The marks read as a yes and as a no, each with its emoji variation selector optional: the heavy
 * check mark and the check mark button, and the cross mark and the heavy ballot X.
 */
const YES = /^\s*(?:\u2705|\u2714|\u2713)\uFE0F?\s*/u;
const NO = /^\s*(?:\u274C|\u2716|\u2717)\uFE0F?\s*/u;

/** Split a leading check or cross off an indexing field; a field with neither is its own words. */
export function indexing(value: string): Indexing {
    const yes = YES.exec(value);
    if (yes !== null) return { words: value.slice(yes[0].length).trim(), mark: 'yes' };
    const no = NO.exec(value);
    if (no !== null) return { words: value.slice(no[0].length).trim(), mark: 'no' };
    return { words: value };
}
