// Layer 1, data. What a search across files answers: the hits of one file, the files of one run, and
// what the run cost.
//
// A hit carries the line's own text rather than an offset into the file, so the page draws a result
// without reading the file, and it carries where the match sits in that text so the page emboldens
// the match without matching the pattern again. `length` is the matched text's own length, which is
// the only way a regular-expression hit can be emboldened at all: the page knows the pattern, not
// what it matched.

/** One matching line: where it is, where the match sits in the text, and the text itself. */
export type SearchHit = {
    /** The line's number in the file, counting from one. */
    line: number;
    /** Where the match starts in `text`, counting from one. */
    column: number;
    /** How many characters the match took. */
    length: number;
    /** The matching line, cut to a window around the match. */
    text: string;
};

/** The hits of one file, under the root it was found in. */
export type SearchFile = {
    root: string;
    /** The file's path inside that root. */
    path: string;
    hits: SearchHit[];
};

/** A root whose search did not run, and why, so a missing directory is never silence. */
export type SearchFailure = {
    root: string;
    /** ripgrep's own one-line reason, or that the root's search ran out of time. */
    reason: string;
};

/** One run's whole answer. */
export type SearchAnswer = {
    files: SearchFile[];
    /** How many hits the files carry. */
    total: number;
    /** Whether the run stopped at the cap, so the file list is not every hit there is. */
    truncated: boolean;
    /** How long the run took, in milliseconds. */
    ms: number;
    /** The roots that answered nothing because their search failed or timed out. */
    failed: SearchFailure[];
};
