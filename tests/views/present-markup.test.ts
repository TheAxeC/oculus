// The deck's words as markup: which delimiters carry a formula, which dollar signs are prose, and
// the two bounds that keep one bad formula from taking the pane.
//
// KaTeX writes the source it was handed into an annotation of its own output, so a case asserts on
// the class KaTeX gives a display formula rather than on the source being absent from the markup.

import { describe, expect, it } from 'vitest';
import { body, tex, words } from '../../src/lib/views/present/markup.ts';

/** How many formulas KaTeX typeset in one string, counted by the root it wraps each one in. */
function formulas(html: string): number {
    return [...html.matchAll(/class="katex[ "]/g)].length;
}

/** Whether the one formula in the string was set as a display formula. */
function display(html: string): boolean {
    return html.includes('katex-display');
}

describe('words', () => {
    it('typesets a formula in each of the four delimiter pairs', () => {
        expect(formulas(words('before $x + 1$ after'))).toBe(1);
        expect(formulas(words('before $$x + 1$$ after'))).toBe(1);
        expect(formulas(words('before \\[x + 1\\] after'))).toBe(1);
        expect(formulas(words('before \\(x + 1\\) after'))).toBe(1);
    });

    it('sets the two display pairs as display and the two inline pairs inline', () => {
        expect(display(words('$$x + 1$$'))).toBe(true);
        expect(display(words('\\[x + 1\\]'))).toBe(true);
        expect(display(words('$x + 1$'))).toBe(false);
        expect(display(words('\\(x + 1\\)'))).toBe(false);
    });

    it('leaves an escaped dollar and a lone dollar in prose alone', () => {
        expect(formulas(words('it costs \\$5 today'))).toBe(0);
        expect(formulas(words('one $ sign on its own'))).toBe(0);
        expect(formulas(words('a $ here and a line break\nand a $ there'))).toBe(0);
    });

    it('renders the words around a formula as inline Markdown', () => {
        const html = words('a **bold** claim, $\\rho = 0.49$');
        expect(html).toContain('<strong>bold</strong>');
        expect(formulas(html)).toBe(1);
    });

    it('typesets every formula of a string, not only the first', () => {
        expect(formulas(words('$a$ and $b$ and $c$'))).toBe(3);
    });
});

describe('body', () => {
    it('renders block Markdown around a formula it typesets', () => {
        const html = body('## A heading\n\nA line with $x^2$ in it.\n');
        expect(html).toContain('<h2');
        expect(html).toContain('A heading');
        expect(formulas(html)).toBe(1);
    });

    it('typesets a display formula standing on its own line', () => {
        const html = body('Before.\n\n$$\\int_0^1 x \\, dx$$\n\nAfter.\n');
        expect(display(html)).toBe(true);
    });
});

describe('tex', () => {
    it('draws a formula that does not parse as its own source rather than throwing', () => {
        const html = tex('\\notacommand{x}', false);
        expect(html).toContain('katex');
        expect(html).toContain('notacommand');
    });

    it('bounds a rule that asks for a size no pane could hold', () => {
        // The annotation KaTeX writes carries the source as text, so only the sizes it painted are
        // measured; the source keeps its own 9999 and paints nothing.
        const html = tex('\\rule{9999em}{9999em}', false).replace(
            /<annotation[\s\S]*?<\/annotation>/g,
            ' '
        );
        const sizes = [...html.matchAll(/([0-9.]+)em/g)].map((match) => Number(match[1]));
        expect(sizes.length).toBeGreaterThan(0);
        expect(Math.max(...sizes)).toBeLessThanOrEqual(50);
    });

    it('refuses a macro that expands without end rather than hanging', () => {
        const html = tex('\\def\\x{\\x}\\x', false);
        expect(html).toContain('katex');
    });
});
