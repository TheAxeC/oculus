// Layer 3, primitive test. The one sanitiser: the Markdown line a card's field becomes.
//
// What this does NOT cover: DOMPurify's own filtering. The library needs a document to parse into
// and this suite runs in node (vite.config.ts sets `environment: 'node'`), where its `isSupported`
// is false and `sanitize` is not even defined, so `sanitise` hands the text back as it came and no
// script is dropped anywhere in this file. What is checked here is the shape of the call: that
// `inlineMarkdown` is the sanitiser over marked's inline renderer.

import { marked } from 'marked';
import { describe, expect, it } from 'vitest';
import { inlineMarkdown, sanitise } from '../../src/lib/ui/html.ts';

describe('inlineMarkdown', () => {
    it('is the sanitiser over the inline renderer, so no field reaches a card around it', () => {
        for (const text of ['a **bold** field', '<script>alert(1)</script>', '[one](one.md)']) {
            expect(inlineMarkdown(text)).toBe(sanitise(marked.parseInline(text, { async: false })));
        }
    });
});
