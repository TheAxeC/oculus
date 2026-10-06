// Layer 3, Present partial. The deck's words as markup: Markdown through the app's sanitiser, and
// the LaTeX inside it typeset by KaTeX.
//
// A deck field is one line of Markdown with mathematics in it, so neither renderer alone does the
// job: the formulas are lifted out first, the rest goes through the renderer of ui/html.ts, and the
// typeset formulas are put back afterwards. Lifting them out is also what keeps the Markdown
// renderer away from a backslash or a star inside a formula.
//
// KaTeX's own markup is not sanitised, and the sanitiser would ruin it: the profile of ui/html.ts
// drops `style`, which is what positions every box KaTeX draws. What is drawn is KaTeX's markup and
// not the file's. `trust: false` refuses every command that would emit a link, a class or raw HTML,
// and the source itself reaches the page as escaped text. A formula that does not parse is drawn as
// its own source in the error colour rather than thrown, so one mistyped line costs its own slide.

import katex from 'katex';
import 'katex/dist/katex.min.css';
import { DECK_GAP } from '$lib/state/life/present';
import { t } from '$lib/state/shared/words/text';
import { blockMarkdown, inlineMarkdown } from '$lib/ui/html';

/**
 * The four delimiter pairs a slide writes a formula in: `$$...$$` and `\[...\]` set a display
 * formula, `\(...\)` and `$...$` an inline one. The single-dollar form takes no space just inside
 * the delimiters and no line break between them, so a price and a lone dollar sign in prose are
 * left alone; a `$` written `\$` is not a delimiter at all.
 */
const MATH =
    /\$\$([\s\S]+?)\$\$|\\\[([\s\S]+?)\\\]|\\\(([\s\S]+?)\\\)|(?<!\\)\$(?!\s)([^$\n]+?)(?<!\s)\$/g;

/**
 * What a lifted formula is left behind as. Letters and digits, so no renderer reads it as markup.
 */
const MARK = '0katexmath0';

/**
 * How far one formula may stretch, in em, and how many times its macros may expand. A slide is a
 * file on the reader's own disk, but a mistyped `\rule` or a macro that expands into itself would
 * otherwise take the pane with it, and neither bound is reached by anything a deck writes.
 */
const MAX_SIZE = 50;
const MAX_EXPAND = 1000;

/** One formula as markup. */
export function tex(source: string, display: boolean): string {
    return katex.renderToString(source, {
        displayMode: display,
        throwOnError: false,
        trust: false,
        strict: 'ignore',
        maxSize: MAX_SIZE,
        maxExpand: MAX_EXPAND
    });
}

/** An image the reader gave the gap's address. */
const GAP_IMAGE = new RegExp(`<img\\b[^>]*\\bsrc="${DECK_GAP}"[^>]*>`, 'g');

/**
 * Each image the deck's folder lacks drawn as the gap, named as a missing panel figure is. The
 * name is the image's alt text as the sanitiser wrote it, already escaped.
 */
function gaps(html: string): string {
    return html.replace(GAP_IMAGE, (tag) => {
        const name = /\balt="([^"]*)"/.exec(tag)?.[1] ?? '';
        return `<span class="gap">${t('present.figure_missing', name)}</span>`;
    });
}

/** Render the text with its formulas typeset, the rest through the Markdown renderer given. */
function typeset(text: string, markdown: (source: string) => string): string {
    const formulas: string[] = [];
    const lifted = text.replace(
        MATH,
        (
            whole: string,
            dollars: string | undefined,
            brackets: string | undefined,
            parens: string | undefined,
            dollar: string | undefined
        ) => {
            const display = dollars ?? brackets;
            formulas.push(tex(display ?? parens ?? dollar ?? '', display !== undefined));
            return `${MARK}${formulas.length - 1}${MARK}`;
        }
    );
    let html = gaps(markdown(lifted));
    for (const [at, formula] of formulas.entries()) {
        html = html.replace(`${MARK}${at}${MARK}`, () => formula);
    }
    return html;
}

/** One field of a slide: inline Markdown, the formulas in it typeset. */
export function words(text: string): string {
    return typeset(text, inlineMarkdown);
}

/** A slide's narrative body: whole-document Markdown, the formulas in it typeset. */
export function body(text: string): string {
    return typeset(text, blockMarkdown);
}
