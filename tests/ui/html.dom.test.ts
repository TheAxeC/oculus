// Layer 3, primitive test. The one sanitiser, run with DOMPurify over a document (this file is a
// *.dom.test.ts, which vite.config.ts runs in jsdom): the Markdown line a card's field becomes, a
// slide's Markdown, and a note's document with its formulas, each drawn as the page draws it.

import katex from 'katex';
import { marked } from 'marked';
import markedKatex from 'marked-katex-extension';
import { describe, expect, it } from 'vitest';
import {
    blockMarkdown,
    blockMarkdownParts,
    inlineMarkdown,
    sanitise,
    type MarkdownExtras
} from '../../src/lib/ui/html.ts';
import { MATH_OPTIONS } from '../../src/lib/views/shared/latex/math.ts';

describe('inlineMarkdown', () => {
    it('is the sanitiser over the inline renderer, so no field reaches a card around it', () => {
        for (const text of ['a **bold** field', '<script>alert(1)</script>', '[one](one.md)']) {
            expect(inlineMarkdown(text)).toBe(sanitise(marked.parseInline(text, { async: false })));
        }
        const field = inlineMarkdown(
            'a **field** <img src=x onerror="alert(1)"><script>x</script>'
        );
        expect(field).toContain('<strong>field</strong>');
        expect(field).not.toMatch(/onerror|<script/);
    });
});

describe('blockMarkdown', () => {
    it("drops a handler, a script and a style from a slide's Markdown and keeps its markup", () => {
        const slide = blockMarkdown(
            '# Title\n\n<img src=x onerror="alert(1)"> <span style="color:red">red</span>\n\n<script>alert(1)</script>\n\n- one'
        );
        expect(slide).toContain('<h1');
        expect(slide).toContain('<li>one</li>');
        expect(slide).not.toMatch(/onerror|<script|style=/);
    });
});

/** A note of a hub whose folder holds `Kickoff.md`, and formulas typeset by KaTeX. */
const EXTRAS: MarkdownExtras = {
    note: {
        resolve: (name) => (name === 'Kickoff' ? 'Kickoff.md' : null),
        fileAddress: (path) => `/api/file/hub/.oculus/notes/${path}`,
        refusal: () => null,
        text: () => null
    },
    math: { modules: { markedKatex, katex }, options: MATH_OPTIONS, refused: 'refused' }
};

/** A document as the page draws it: rendered, then sanitised with its formulas put back. */
function drawn(text: string): string {
    const parts = blockMarkdownParts(text, EXTRAS);
    return sanitise(parts.html, parts.slots);
}

describe('blockMarkdownParts', () => {
    it("draws a note link's shown text as text, so no tag it holds reaches the page", () => {
        const html = drawn('[[Kickoff|<img src=x onerror=alert(1)>]]');
        expect(html).toContain('&lt;img src=x onerror=alert(1)&gt;</a>');
        expect(html).not.toContain('<img');
    });

    it("keeps KaTeX's markup of a formula and drops a handler written beside it", () => {
        const html = drawn('$x^2$ <img src=x onerror="alert(1)">');
        expect(html).toContain('class="katex"');
        expect(html).toContain('<math');
        expect(html).not.toContain('onerror');
    });

    it("typesets a formula's words as text, and a link it asks for as no link", () => {
        const script = drawn('$\\text{<script>alert(1)</script>}$');
        expect(script).toContain('class="katex"');
        expect(script).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
        expect(script).not.toContain('<script');
        const link = drawn('$\\href{javascript:alert(1)}{x}$');
        expect(link).toContain('class="katex"');
        expect(link).not.toMatch(/href=/);
    });
});
