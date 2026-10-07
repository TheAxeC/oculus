// Layer 3, shared view partial. Math drawn with KaTeX, for the TeX view's Math Symbols section and
// the Math Preview view: one function that typesets a formula into a node, with the macros the
// document defines so the preview draws what the document's own commands mean. KaTeX and its
// stylesheet load on the first formula, as a chunk of their own.

/**
 * The options every formula is typeset with: no trust, KaTeX's own limits, no error for a command
 * it lacks.
 */
const OPTIONS = { trust: false, strict: 'ignore', maxSize: 50, maxExpand: 1000 } as const;

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
            ...OPTIONS,
            displayMode: display,
            throwOnError: false,
            macros: { ...macros }
        });
    } catch {
        node.textContent = source;
        node.style.color = 'var(--c-red-txt)';
    }
}
