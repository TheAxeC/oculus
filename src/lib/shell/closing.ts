// Layer 3, shell. What a close asks before it happens, over the instance ids it would take away.
//
// One rule for the three closes the shell offers, a tab's own close, a pane's and a page's, so the
// same press over the same tabs asks the same question wherever it is made. The words are each
// caller's own: a pane and a page say how much goes in their own sentence, and both say the tab
// sentence when one tab holding unsaved text is all that goes.
//
// Whether an instance holds unsaved text is not decided here. The caller passes the ui store's
// answer for an instance id, so a view that keeps unsaved text registers its rule once and none of
// the three closes is edited for it.

/** What a close asks: nothing, the unsaved-text question, or the caller's own how-much question. */
export type CloseQuestion = 'none' | 'dirty' | 'many';

/**
 * The question closing these instances asks. One instance with nothing unsaved in it goes at once,
 * since a close control pressed over a saved tab is the reader saying exactly what they meant; one
 * holding unsaved text asks about the text; more than one asks the caller's own question, which
 * already says how much is about to go whether or not any of it is unsaved.
 */
export function closeQuestion(ids: string[], unsaved: (id: string) => boolean): CloseQuestion {
    if (ids.length > 1) return 'many';
    return ids.some((id) => unsaved(id)) ? 'dirty' : 'none';
}
