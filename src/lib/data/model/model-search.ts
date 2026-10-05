// Layer 1, data. What a search across files answers: the hits of one file, the files of one run,
// and what the run cost.
//
// A hit is one match, so a line holding two matches is two hits. It carries the line's own text
// rather than an offset into the file, so the page draws a result without reading the file, and it
// carries where the match sits in that text so the page emboldens the match without matching the
// pattern again. `length` is the matched text's own length, which is the only way a
// regular-expression hit can be emboldened at all: the page knows the pattern, not what it matched.
// `at` places the match in the whole line, which is what names it to a replace, and `groups` is the
// text of every group of the pattern, which is what a replace text with `$1` in it is read over.

/** One match: where its line is, where the match sits in the line and in the text, and the text. */
export type SearchHit = {
    /** The line's number in the file, counting from one. */
    line: number;
    /** Where the match starts in `text`, counting from one. */
    column: number;
    /** How many characters the match took. */
    length: number;
    /** The matching line, cut to a window around the match. */
    text: string;
    /** Where the match starts in the whole line, in UTF-16 units counted from zero. */
    at: number;
    /**
     * The text of every group of a regular-expression pattern, by number and by name, group 0 being
     * the match. A literal search has no groups, and its hit carries group 0 alone when the match
     * is longer than the window `text` is cut to, since `text` then holds only the start of it.
     */
    groups?: Record<string, string>;
};

/** The hits of one file, under the root it was found in. */
export type SearchFile = {
    root: string;
    /** The file's path inside that root. */
    path: string;
    hits: SearchHit[];
    /**
     * Set by the page on a file it wrote, when the hits the file holds now could not be read: the
     * file keeps its place in the list with no hits, and its row asks for a new search.
     */
    rereadFailed?: boolean;
};

/** A root whose search did not run, and why, so a missing directory is never silence. */
export type SearchFailure = {
    root: string;
    /** Whether the root's search ran out of time or ripgrep could not run it. */
    why: 'timed-out' | 'failed';
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
