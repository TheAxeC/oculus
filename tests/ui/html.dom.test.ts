// Layer 3, primitive test. The one sanitiser, run with DOMPurify over a document (this file is a
// *.dom.test.ts, which vite.config.ts runs in jsdom): the Markdown line and the long field a card
// draws, a slide's Markdown, and a note's document with its formulas, each drawn as the page draws
// it. A paper saved to Literature is written to a Literature file in a temporary hub, and its
// abstract is drawn as a card draws a field, both as the file holds it and as the source sent it.

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import katex from 'katex';
import { marked } from 'marked';
import markedKatex from 'marked-katex-extension';
import { parse } from 'yaml';
import { describe, expect, it } from 'vitest';
import {
    blockMarkdown,
    blockMarkdownParts,
    fieldMarkdown,
    inlineMarkdown,
    sanitise,
    type MarkdownExtras
} from '../../src/lib/ui/html/html.ts';
import { MATH_OPTIONS } from '../../src/lib/views/shared/latex/math.ts';
import { saveLiterature } from '../../src/lib/server/edit/feeds/literature.ts';
import { portfolioConfigFrom } from '../../src/lib/data/index.ts';
import { engineDir, loadConfig } from '../../src/lib/data/sources/config.ts';
import { scratchDir } from '../fixtures/scratch.ts';

describe('inlineMarkdown', () => {
    it('is the sanitiser over the inline renderer, so no field reaches a card around it', () => {
        for (const text of ['a **bold** field', '[one](one.md)']) {
            expect(inlineMarkdown(text)).toBe(sanitise(marked.parseInline(text, { async: false })));
        }
        const field = inlineMarkdown(
            'a **field** <img src=x onerror="alert(1)"><script>x</script>'
        );
        expect(field).toContain('<strong>field</strong>');
        expect(field).not.toMatch(/onerror|<script/);
    });

    it('draws a script tag as the text it is, with no script element', () => {
        const field = inlineMarkdown('<script>alert(1)</script>');
        expect(field).toBe('&lt;script&gt;alert(1)&lt;/script&gt;');
        expect(sanitise(field)).toBe(field);
    });

    it.each([
        ['rsync <source> <target>', 'rsync &lt;source&gt; &lt;target&gt;'],
        ['~/data/<data>', '~/data/&lt;data&gt;'],
        ['done by <time> today', 'done by &lt;time&gt; today'],
        ['the <title> of the page', 'the &lt;title&gt; of the page'],
        ['/local/<jobid>', '/local/&lt;jobid&gt;']
    ])(
        'draws the tag in %s as written, since the sanitiser keeps no such element',
        (text, shown) => {
            expect(inlineMarkdown(text)).toBe(shown);
        }
    );

    it("keeps a hub field's formula as KaTeX's markup and drops a handler written beside it", () => {
        const field = inlineMarkdown(
            'A line on $\\sqrt{\\Delta t}$ <img src=x onerror="alert(1)">',
            EXTRAS.math
        );
        expect(field).toContain('class="katex"');
        expect(field).not.toMatch(/onerror|math-slot/);
    });

    it('keeps two dollar prices as text and an invalid formula as its source', () => {
        const prices = inlineMarkdown('From $5 to $10 a month', EXTRAS.math);
        expect([prices.includes('$5 to $10'), prices.includes('katex')]).toEqual([true, false]);
        const invalid = inlineMarkdown('A formula $\\frac{1}{$ here', EXTRAS.math);
        expect(invalid).toContain('class="math-error"');
        expect(invalid).toContain('$\\frac{1}{$');
        expect(invalid).not.toContain('katex');
    });
});

describe('fieldMarkdown', () => {
    it('is the sanitiser over the field renderer, so no long field reaches a card around it', () => {
        const words = '<script>alert(1)</script>, <img src=x onerror="alert(1)"> and';
        const paragraph = fieldMarkdown(`In ${words} rsync <source> <target>`);
        const list = fieldMarkdown(`- In ${words} rsync <source> <target>`);
        expect(paragraph).toContain('<p>');
        expect(list).toContain('<li>');
        for (const field of [paragraph, list]) {
            expect(field).not.toMatch(/onerror|<script/);
            expect(field).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
            expect(field).toContain('rsync &lt;source&gt; &lt;target&gt;');
        }
        expect(fieldMarkdown('<div>rsync <source> <target></div>')).toBe(
            '<div>rsync &lt;source&gt; &lt;target&gt;</div>'
        );
        const script = fieldMarkdown('<div><script>alert(1)</script></div>');
        expect(script).toBe('<div>&lt;script&gt;alert(1)&lt;/script&gt;</div>');
        expect(fieldMarkdown('<div>a <script')).toContain('&lt;script');
        expect(fieldMarkdown('<div>if a<b then c</div>')).toBe('<div>if a&lt;b then c</div>');
    });
});

describe('a paper saved to Literature', () => {
    it('keeps the words of an abstract that held markup, and its card line holds no element of it', () => {
        const hub = scratchDir('oculus-literature-dom-');
        const file = join(hub, '.oculus', 'data', 'literature', 'literature.yml');
        mkdirSync(join(hub, '.oculus', 'data', 'literature'), { recursive: true });
        writeFileSync(
            file,
            'schema:\n  - { field: key, type: text, primary_key: true }\n  - { field: title, type: text, display: 1 }\n  - { field: abstract, type: textarea }\nentries: []\n'
        );
        const config = portfolioConfigFrom(loadConfig(engineDir()).config);
        const sent =
            'Tested <i>in vivo</i> on <img src=x onerror="alert(1)">mice.<script>alert(1)</script>';
        saveLiterature(
            hub,
            config,
            undefined,
            'search',
            { title: 'Tested in mice', abstract: sent },
            []
        );
        const saved = (parse(readFileSync(file, 'utf8')) as { entries: { abstract: string }[] })
            .entries[0].abstract;
        expect(saved).toBe('Tested in vivo on mice.');
        const line = inlineMarkdown(saved);
        expect(line).toContain('Tested in vivo on mice.');
        expect(line).not.toMatch(/<i>|<img|onerror|<script/);
        const unsaved = inlineMarkdown(sent);
        expect(unsaved).toContain('<i>in vivo</i>');
        expect(unsaved).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
        expect(unsaved).not.toMatch(/onerror|<script/);
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
