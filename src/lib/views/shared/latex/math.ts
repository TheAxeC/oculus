// Layer 3, shared view partial. Math drawn with KaTeX, for the TeX view's Math Symbols section, the
// Math Preview view and every drawn Markdown document: one function that typesets a formula into a
// node, with the macros the document defines so the preview draws what the document's own commands
// mean, and the modules a Markdown document's formulas are typeset with (`loadMarkdownMath`, drawn
// by ui/html.ts). KaTeX and its stylesheet load on the first formula, as a chunk of their own, and
// `marked-katex-extension` with them, since it brings KaTeX in.

import type { MathModules } from '$lib/ui/html';

/**
 * The options every formula is typeset with: no trust, KaTeX's own limits, no error for a command
 * it lacks, and the theme's red for what KaTeX marks as an error (a command it does not trust),
 * never its own hex colour.
 */
export const MATH_OPTIONS = {
    trust: false,
    errorColor: 'var(--c-red-txt)',
    strict: 'ignore',
    maxSize: 50,
    maxExpand: 1000
} as const;

/**
 * Typeset a formula into a node: KaTeX's markup, or the source in the error colour for one KaTeX
 * refuses outright. `display` draws it as a display equation.
 */
export async function typeset(
    node: HTMLElement,
    source: string,
    display: boolean,
    macros: Record<string, string> = {}
): Promise<void> {
    const [{ default: katex }] = await Promise.all([
        import('katex'),
        import('katex/dist/katex.min.css')
    ]);
    try {
        katex.render(source, node, {
            ...MATH_OPTIONS,
            displayMode: display,
            throwOnError: false,
            macros: { ...macros }
        });
    } catch {
        node.textContent = source;
        node.style.color = 'var(--c-red-txt)';
    }
}

/** The one load of the modules, shared by every document that asks. */
let loading: Promise<MathModules> | null = null;

/**
 * The modules a Markdown document's formulas are typeset with, loaded on the first ask with
 * KaTeX's stylesheet. A load that fails is forgotten, so the next document asks again.
 */
export function loadMarkdownMath(): Promise<MathModules> {
    loading ??= Promise.all([
        import('marked-katex-extension'),
        import('katex'),
        import('katex/dist/katex.min.css')
    ]).then(
        ([extension, katex]) => ({
            markedKatex: extension.default,
            katex: katex.default
        }),
        (error: unknown) => {
            loading = null;
            throw error;
        }
    );
    return loading;
}

/** Whether a text may hold a formula, which is when the modules are worth loading for it. */
export function holdsMath(text: string): boolean {
    return text.includes('$');
}
