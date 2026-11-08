// Layer 3, primitive. The memo of one page's HTML drawings: each result ui/html/html.ts is asked
// for again and again, held per page. It is apart from html.ts because holding a result has no part
// in how it is drawn. The page root makes one and provides it through Svelte's context, as
// ui/menu/tip-ids.ts provides its counter, so two pages never share a result and a call given none
// draws afresh; ui/html/html.ts hands its functions on, so a view imports them where it imports the
// drawing.

import { getContext, setContext } from 'svelte';
import type { MathDrawing, MathModules } from './html.ts';

/**
 * How many results each map of an `HtmlMemo` keeps. Past it the oldest result is let go, so a long
 * session that draws many distinct texts holds no more than this many of them.
 */
const MEMO_HELD = 2000;

/**
 * The results of one kind of drawing of a text: each text without formulas in `plain` and, by the
 * modules and options and the refusal's sentence it was typeset with, with them in `math`. A result
 * made with one drawing of formulas is served only to a call with the same drawing, and never to a
 * call without formulas, which reads `plain`.
 */
type TextMemo = {
    plain: Map<string, string>;
    math: WeakMap<MathModules, WeakMap<object, Map<string, string>>>;
};

/**
 * One page's results of the drawings many controls ask for again and again: each icon file's
 * filtered drawing, each text's inline Markdown and each long field's block Markdown, the last two
 * apart since one text draws differently by each.
 */
export type HtmlMemo = { icons: Map<string, string>; inline: TextMemo; field: TextMemo };

/** An empty memo of one kind of drawing. */
function createTextMemo(): TextMemo {
    return { plain: new Map(), math: new WeakMap() };
}

/** An empty memo, for one page. */
export function createHtmlMemo(): HtmlMemo {
    return { icons: new Map(), inline: createTextMemo(), field: createTextMemo() };
}

/** The one key a page's memo is provided under. */
const HTML_MEMO = Symbol('html memo');

/** Provide one page's memo to every control it draws. */
export function provideHtmlMemo(memo: HtmlMemo): void {
    setContext(HTML_MEMO, memo);
}

/** The memo of the page a control is drawn in, read while it initialises, or none. */
export function useHtmlMemo(): HtmlMemo | undefined {
    return getContext<HtmlMemo | undefined>(HTML_MEMO);
}

/**
 * The result `memo` holds for `key`, else the one `make` gives, which the memo then holds. A
 * result is a pure function of its key, so the result held is the result `make` would give.
 */
export function remembered<K>(memo: Map<K, string>, key: K, make: () => string): string {
    const held = memo.get(key);
    if (held !== undefined) return held;
    const made = make();
    memo.set(key, made);
    if (memo.size > MEMO_HELD) memo.delete(memo.keys().next().value as K);
    return made;
}

/**
 * The results of `memo` typeset with `math`'s modules and options, keyed by the refusal's sentence
 * and the text.
 */
function mathMemo(memo: TextMemo, math: MathDrawing): Map<string, string> {
    let byOptions = memo.math.get(math.modules);
    if (byOptions === undefined) {
        byOptions = new WeakMap();
        memo.math.set(math.modules, byOptions);
    }
    let held = byOptions.get(math.options);
    if (held === undefined) {
        held = new Map();
        byOptions.set(math.options, held);
    }
    return held;
}

/**
 * One drawing of a text, held in the page's `memo` by its text and its drawing of formulas when a
 * memo is given, at most `MEMO_HELD` per map, and made afresh when none is.
 */
export function heldDrawing(
    text: string,
    math: MathDrawing | null,
    memo: TextMemo | undefined,
    draw: (text: string, math: MathDrawing | null) => string
): string {
    if (memo === undefined) return draw(text, math);
    if (math === null) return remembered(memo.plain, text, () => draw(text, null));
    const key = JSON.stringify([math.refused, text]);
    return remembered(mathMemo(memo, math), key, () => draw(text, math));
}
