// Layer 3, primitive test. The one sanitiser: the profile it filters by, the addresses it lets an
// href hold, what a link is given once it is clean, and the Markdown line a card's field becomes.
//
// What this does NOT cover: DOMPurify's own filtering. The library needs a document to parse into
// and this suite runs in node (vite.config.ts sets `environment: 'node'`), where its `isSupported`
// is false and `sanitize` is not even defined, so `sanitise` hands the text back as it came and no
// script is dropped anywhere in this file. What is checked here is the data the browser is given
// and the shape of the call: that `inlineMarkdown` is the sanitiser over marked's inline renderer,
// and that the app still renders in the browser alone, which is what makes the node pass-through
// harmless. The profile against real markup is tests/browser/sanitise.spec.ts, in Chrome.

import { readFileSync } from 'node:fs';
import { marked } from 'marked';
import { describe, expect, it } from 'vitest';
import {
    ALLOWED_ATTR,
    ALLOWED_TAGS,
    ALLOWED_URI_REGEXP,
    INPUT_TYPE,
    LINK_REL,
    LINK_TARGET,
    OUTWARD_SCHEME,
    PROFILE,
    inlineMarkdown,
    sanitise
} from '../../src/lib/ui/html.ts';

describe('the sanitiser profile', () => {
    it('allows the elements a document, a turn and an inline field are made of', () => {
        for (const tag of ['p', 'h1', 'h2', 'ul', 'ol', 'li', 'code', 'pre', 'a', 'img', 'table']) {
            expect(ALLOWED_TAGS).toContain(tag);
        }
        expect(ALLOWED_TAGS).toContain('input');
    });

    it('allows the tags the hub writes into its own Markdown by hand', () => {
        for (const tag of ['b', 'i', 'small', 'sub', 'sup', 'div', 'details', 'summary']) {
            expect(ALLOWED_TAGS).toContain(tag);
        }
    });

    it('allows no element that runs, loads or collects', () => {
        for (const tag of ['script', 'style', 'iframe', 'object', 'embed', 'form', 'svg']) {
            expect(ALLOWED_TAGS).not.toContain(tag);
        }
    });

    it('allows the attributes marked writes and no handler', () => {
        for (const name of ['href', 'src', 'alt', 'title', 'class', 'align', 'type', 'id']) {
            expect(ALLOWED_ATTR).toContain(name);
        }
        expect(ALLOWED_ATTR.filter((name) => name.startsWith('on'))).toEqual([]);
        expect(ALLOWED_ATTR).not.toContain('style');
        expect(ALLOWED_ATTR).not.toContain('srcset');
    });

    it('opens no door beside the two lists', () => {
        expect(PROFILE.ALLOW_DATA_ATTR).toBe(false);
        expect(PROFILE.ALLOW_ARIA_ATTR).toBe(false);
        expect(PROFILE.ALLOW_UNKNOWN_PROTOCOLS).toBe(false);
        expect(PROFILE.ALLOWED_TAGS).toBe(ALLOWED_TAGS);
        expect(PROFILE.ALLOWED_ATTR).toBe(ALLOWED_ATTR);
        expect(PROFILE.ALLOWED_URI_REGEXP).toBe(ALLOWED_URI_REGEXP);
    });
});

describe('the addresses an href may hold', () => {
    it('takes a link out, a mail address and anything with no scheme at all', () => {
        for (const url of [
            'https://example.org/paper',
            'http://example.org',
            'mailto:someone@example.org',
            'tel:+3100000000',
            '#section',
            'code/README.md',
            '../figures/one.png',
            '/api/file/hub/README.md'
        ]) {
            expect(ALLOWED_URI_REGEXP.test(url)).toBe(true);
        }
    });

    it('takes no scheme that executes or carries its own document', () => {
        for (const url of [
            'javascript:alert(1)',
            'JavaScript:alert(1)',
            'data:text/html;base64,PHNjcmlwdD4=',
            'vbscript:msgbox(1)'
        ]) {
            expect(ALLOWED_URI_REGEXP.test(url)).toBe(false);
        }
    });

    it('says what a link that leads out is given', () => {
        expect(LINK_TARGET).toBe('_blank');
        expect(LINK_REL).toBe('noopener noreferrer');
    });

    it('counts as leading out only an address that names a scheme', () => {
        for (const url of [
            'https://example.org',
            'HTTP://example.org',
            'mailto:a@b.c',
            'tel:+31',
            '//example.org/p'
        ]) {
            expect(OUTWARD_SCHEME.test(url)).toBe(true);
        }
        for (const url of ['code/README.md', '#notes', '/api/file/hub/README.md', '../one.png']) {
            expect(OUTWARD_SCHEME.test(url)).toBe(false);
        }
    });

    it('keeps one kind of input, the checkbox of a task list', () => {
        expect(INPUT_TYPE).toBe('checkbox');
    });
});

describe('inlineMarkdown', () => {
    it('renders one line of Markdown, leaving plain words alone', () => {
        expect(inlineMarkdown('what it **is**')).toBe('what it <strong>is</strong>');
        expect(inlineMarkdown('plain words')).toBe('plain words');
    });

    it('is the sanitiser over the inline renderer, so no field reaches a card around it', () => {
        for (const text of ['a **bold** field', '<script>alert(1)</script>', '[one](one.md)']) {
            expect(inlineMarkdown(text)).toBe(sanitise(marked.parseInline(text, { async: false })));
        }
    });
});

describe('the runtime the sanitiser counts on', () => {
    it('renders in the browser alone, which is what the node pass-through rests on', () => {
        const layout = readFileSync('src/routes/+layout.ts', 'utf8');
        expect(layout).toContain('export const ssr = false');
    });
});
