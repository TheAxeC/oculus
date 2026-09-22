// Layer 4, test helper. What counts as a reason, for every check that asks an entry or a comment
// for one.
//
// A reason says something of its own: four words at least, and none of the literals the thing it is
// about already names, so that a line restating its assertion, or an entry echoing its own key, is
// refused. One rule serves the comment above an absence, the entry of an allow list and the reason
// a listed rule carries, so the three cannot drift into three standards.
//
// A restatement is compared on letters and digits alone, so writing the literal back with other
// punctuation or another case is still a restatement, and a line of one word repeated is not four
// words. What it cannot tell is a sentence that reads as a reason and says nothing about the
// fixture. That is the reader's, and the checks say so where they use this.

/**
 * The literals a line names, long enough that a reason holding one is restating rather than saying.
 */
export function literalsIn(text: string): string[] {
    const found: string[] = [];
    let at = 0;
    while (at < text.length) {
        const quote = text[at];
        if (quote !== "'" && quote !== '"' && quote !== '`') {
            at += 1;
            continue;
        }
        let end = at + 1;
        while (end < text.length && text[end] !== quote) {
            end += text[end] === '\\' ? 2 : 1;
        }
        const held = text.slice(at + 1, end);
        if (held.length >= 8) found.push(held);
        at = end + 1;
    }
    return found;
}

/**
 * The letters and digits of a text, lower-cased, which is what a restatement is compared on: a
 * reader who writes the literal back with other punctuation or another case has still restated it.
 */
function bare(text: string): string {
    return text.toLowerCase().replace(/[^a-z0-9]+/g, '');
}

/**
 * Whether a text is a reason: long enough to say something, and not a restatement of its subject.
 */
export function isReason(text: string, restates = ''): boolean {
    const words = text.trim().split(/\s+/).filter(Boolean);
    if (words.length < 4) return false;
    if (new Set(words.map((one) => bare(one))).size < 3) return false;
    const held = bare(text);
    return !literalsIn(restates).some((one) => held.includes(bare(one)));
}
