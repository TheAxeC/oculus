// The source mirror's pure YAML, Markdown, and plain-text highlighting, including HTML escaping.

import { describe, expect, it } from 'vitest';
import { highlight, languageFor } from '../../src/lib/state/highlight.ts';

describe('source highlighting', () => {
    it('marks YAML keys, values, punctuation, and comments outside quotes', () => {
        const body = highlight('title: "A # title" # note\nenabled: true\ncount: 17', 'yml');
        expect(body).toContain('<span class="source-key">title</span>');
        expect(body).toContain('<span class="source-punctuation">:</span>');
        expect(body).toContain('<span class="source-string">"A # title" </span>');
        expect(body).toContain('<span class="source-comment"># note</span>');
        expect(body).toContain('<span class="source-boolean">true</span>');
        expect(body).toContain('<span class="source-number">17</span>');
    });

    it('marks Markdown headings, fences, inline code, strong text, links, and list markers', () => {
        const body = highlight(
            '# Heading\n```ts\n`code` **bold** [link](https://example.org)\n- item',
            'md'
        );
        expect(body).toContain('<span class="source-heading"># Heading</span>');
        expect(body).toContain('<span class="source-fence">```ts</span>');
        expect(body).toContain('<span class="source-code">`code`</span>');
        expect(body).toContain('<span class="source-strong">**bold**</span>');
        expect(body).toContain('<span class="source-link">[link](https://example.org)</span>');
        expect(body).toContain('<span class="source-marker">-</span> item');
    });

    it('escapes plain text without adding token spans and selects language by extension', () => {
        expect(highlight('<script>&', 'plain')).toBe('&lt;script&gt;&amp;\n');
        expect(languageFor('config.YAML')).toBe('yml');
        expect(languageFor('README.md')).toBe('md');
        expect(languageFor('program.py')).toBe('plain');
    });
});
