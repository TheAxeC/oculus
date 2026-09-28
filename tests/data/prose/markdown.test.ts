// The document rule of data/prose/markdown.ts: every heading carries an id unique within the
// document with the GitHub prefix before it, and a paragraph that is `[TOC]` and nothing else is
// drawn as a nested list of links to those ids. Its two callers are read here too: the document
// route's renderMarkdown, with and without a folder to resolve figures against, and the page's
// blockMarkdown, which the source tab's preview and a slide's narrative render with.
//
// The HTML is read before any sanitising: renderDocument and renderMarkdown do not sanitise, and
// in this node suite blockMarkdown's sanitise hands the text back. What this does NOT cover: what
// the sanitiser keeps of an id and the press on an entry, which only a page shows.

import { describe, expect, it } from 'vitest';
import { renderDocument } from '../../../src/lib/data/prose/markdown.ts';
import { renderMarkdown } from '../../../src/lib/server/content/docs.ts';
import { blockMarkdown } from '../../../src/lib/ui/html.ts';

/** The table of contents of a rendered document: every list carrying the class, whole. */
function lists(html: string): string[] {
    return [...html.matchAll(/<ul class="toc">[\s\S]*?<\/ul>\n/g)].map((found) => found[0]);
}

/** One entry of a list, by the slug it links to and the words it shows. */
function entry(slug: string, words: string): string {
    return `<li><a href="#user-content-${slug}">${words}</a>`;
}

/** One heading as the rule draws it, by its level, its slug and its words. */
function heading(level: number, slug: string, words: string): string {
    return `<h${String(level)} id="user-content-${slug}">${words}</h${String(level)}>`;
}

describe('the ids of a document headings', () => {
    it('gives every heading the GitHub-style id of its words', () => {
        const html = renderDocument('# The cluster\n\n## Submitting a job\n');
        expect(html).toContain(heading(1, 'the-cluster', 'The cluster'));
        expect(html).toContain(heading(2, 'submitting-a-job', 'Submitting a job'));
    });

    it('puts the prefix before an id that names a property of the page, such as method', () => {
        const html = renderDocument('[TOC]\n\n## Method\n\n## Title\n');
        expect(html).toContain(heading(2, 'method', 'Method'));
        expect(html).toContain(heading(2, 'title', 'Title'));
        expect(lists(html)).toEqual([
            `<ul class="toc">${entry('method', 'Method')}</li>${entry('title', 'Title')}</li></ul>\n`
        ]);
    });

    it('gives two headings of the same words two ids', () => {
        const html = renderDocument('[TOC]\n\n# Same\n\n# Same\n');
        expect(html).toContain(heading(1, 'same', 'Same'));
        expect(html).toContain(heading(1, 'same-1', 'Same'));
        expect(lists(html)).toEqual([
            `<ul class="toc">${entry('same', 'Same')}</li>${entry('same-1', 'Same')}</li></ul>\n`
        ]);
    });

    it('starts the ids again for every document', () => {
        renderDocument('# Same\n');
        expect(renderDocument('# Same\n')).toContain(heading(1, 'same', 'Same'));
    });
});

describe('a [TOC] paragraph', () => {
    it('nests the entries by level, one list per level below the first', () => {
        const html = renderDocument('[TOC]\n\n# One\n\n## Two\n\n### Three\n\n# Four\n');
        expect(lists(html)).toEqual([
            '<ul class="toc">' +
                `${entry('one', 'One')}<ul>${entry('two', 'Two')}<ul>` +
                `${entry('three', 'Three')}</li></ul></li></ul></li>` +
                `${entry('four', 'Four')}</li></ul>\n`
        ]);
        expect(html).not.toContain('[TOC]');
    });

    it('nests a jump of two levels once, and a heading coming back takes that list', () => {
        const html = renderDocument('[TOC]\n\n# A\n\n### B\n\n## C\n\n### D\n');
        expect(lists(html)).toEqual([
            '<ul class="toc">' +
                `${entry('a', 'A')}<ul>${entry('b', 'B')}</li>${entry('c', 'C')}<ul>` +
                `${entry('d', 'D')}</li></ul></li></ul></li></ul>\n`
        ]);
    });

    it('stays text inside a fenced block', () => {
        const html = renderDocument('# A\n\n```\n[TOC]\n```\n');
        expect(html).toContain('<pre><code>[TOC]\n</code></pre>');
        // a fenced block is code, so no list is drawn for it
        expect(lists(html)).toEqual([]);
    });

    it('stays text inside a code span and inside a longer paragraph', () => {
        const html = renderDocument('# A\n\n`[TOC]`\n\nSee [TOC] below.\n');
        expect(html).toContain('<p><code>[TOC]</code></p>');
        expect(html).toContain('<p>See [TOC] below.</p>');
        // neither paragraph is `[TOC]` alone, so no list is drawn for either
        expect(lists(html)).toEqual([]);
    });

    it('is taken with the whitespace around it', () => {
        const html = renderDocument('# A\n\n   [TOC]   \n');
        expect(lists(html)).toEqual([`<ul class="toc">${entry('a', 'A')}</li></ul>\n`]);
    });

    it('draws nothing in a document with no heading', () => {
        expect(renderDocument('[TOC]\n\nNo heading here.\n')).toBe('<p>No heading here.</p>\n');
    });

    it('draws no entry for a heading with no words', () => {
        const html = renderDocument('[TOC]\n\n#\n\n# Real\n');
        expect(lists(html)).toEqual([`<ul class="toc">${entry('real', 'Real')}</li></ul>\n`]);
    });

    it('draws the list at every [TOC] paragraph', () => {
        const html = renderDocument('[TOC]\n\n# A\n\n[TOC]\n');
        const drawn = `<ul class="toc">${entry('a', 'A')}</li></ul>\n`;
        expect(lists(html)).toEqual([drawn, drawn]);
        expect(html).not.toContain('<!--toc-');
    });

    it('escapes the words of a heading', () => {
        const html = renderDocument('[TOC]\n\n# a < b & c\n');
        expect(lists(html)).toEqual([
            `<ul class="toc">${entry('a--b--c', 'a &lt; b &amp; c')}</li></ul>\n`
        ]);
    });

    it('shows the inline markup of a heading as its words', () => {
        const html = renderDocument('[TOC]\n\n# One `code` *em*\n');
        expect(lists(html)).toEqual([
            `<ul class="toc">${entry('one-code-em', 'One code em')}</li></ul>\n`
        ]);
    });

    it('takes a quoted attribute holding a > off with the rest of its tag', () => {
        const html = renderDocument('[TOC]\n\n# <span title="a>b">Kept</span> words\n');
        // The id is the library's own reading of the heading; the entry links to whatever it is.
        const id = /<h1 id="([^"]*)">/.exec(html)?.[1] ?? '';
        expect(id.startsWith('user-content-')).toBe(true);
        expect(lists(html)).toEqual([
            `<ul class="toc"><li><a href="#${id}">Kept words</a></li></ul>\n`
        ]);
    });
});

describe('the callers of the rule', () => {
    it('draws the list in a document of the route with a folder to resolve figures against', () => {
        const html = renderMarkdown('[TOC]\n\n# A\n\n![one](one.png)\n', {
            root: 'hub',
            folder: 'notes'
        });
        expect(lists(html)).toEqual([`<ul class="toc">${entry('a', 'A')}</li></ul>\n`]);
        expect(html).toContain(heading(1, 'a', 'A'));
        expect(html).toContain('src="/api/file/hub/notes/one.png"');
    });

    it('draws the list in a document of the route with no folder, the manual', () => {
        const html = renderMarkdown('[TOC]\n\n# A\n\n![one](one.png)\n', null);
        expect(lists(html)).toEqual([`<ul class="toc">${entry('a', 'A')}</li></ul>\n`]);
        expect(html).toContain(heading(1, 'a', 'A'));
        expect(html).toContain('src="one.png"');
    });

    it('draws the ids and the list in the Markdown the page renders itself', () => {
        const html = blockMarkdown('[TOC]\n\n# A\n\n## Method\n');
        expect(html).toContain(heading(2, 'method', 'Method'));
        expect(lists(html)).toEqual([
            `<ul class="toc">${entry('a', 'A')}<ul>${entry('method', 'Method')}</li></ul></li></ul>\n`
        ]);
    });
});
