// Layer 3, primitive, and one of the two that are not components. The HTML the app draws and the
// one sanitiser every string of it passes through. A hub file, a feed value and an agent's
// transcript are markup somebody else wrote, so what they turn into is filtered before a view draws
// it; the catalog's own text under config/text/ is oculus writing to itself and is drawn as it is.
//
// The profile is data below, not a call site's argument: an allow-list of the elements and the
// attributes marked and inline Markdown emit, and nothing else. No handler attribute, no style, no
// script, iframe, object or form, and a URL that is not one of the schemes the regular expression
// names is dropped with its attribute. Two rules the profile cannot state are hooks on the module's
// own purifier, because DOMPurify filters attribute names and never their values: a link that names
// a scheme is given the target and the rel below, and an input that is not a task list's checkbox is
// removed with its attributes.
//
// The purifier is this module's instance, built from the document once, so the hooks are ours and
// the package's shared default instance is left as it is for anything else that imports it.
//
// DOMPurify needs a document to parse into. The app renders in the browser alone, which is what
// src/routes/+layout.ts says with `ssr = false`, so a runtime without a DOM draws no HTML either and
// the text comes back as it came; tests/ui/html.test.ts reads that file and fails if the app ever
// starts rendering on the server, because the pass-through would then be a hole. What the profile
// does to real markup is checked in the browser, by tests/browser/sanitise.spec.ts.

import DOMPurify from 'dompurify';
import { marked } from 'marked';

/**
 * The elements a rendered document, an assistant turn and one line of inline Markdown are made of:
 * what marked emits, plus the formatting and grouping tags the hub's own Markdown writes by hand
 * (a README holds `b`, `i`, `small`, `sub`, `sup`, `div` and a `details` block) and the
 * `b` the catalog's own lines carry. Nothing here runs, loads or collects.
 */
export const ALLOWED_TAGS = [
    'a',
    'b',
    'blockquote',
    'br',
    'code',
    'del',
    'details',
    'div',
    'em',
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'hr',
    'i',
    'img',
    'input',
    'li',
    'ol',
    'p',
    'pre',
    'small',
    'strong',
    'sub',
    'summary',
    'sup',
    'table',
    'tbody',
    'td',
    'th',
    'thead',
    'tr',
    'ul'
];

/**
 * The attributes those elements carry: a link's address, an image's address and text, the alignment
 * marked puts on a table cell, the language class it puts on a fenced block, the three a task list's
 * checkbox is drawn with, and the `id` a document's own anchor is jumped to by. Everything else
 * goes, handlers and `style` among it.
 */
export const ALLOWED_ATTR = [
    'align',
    'alt',
    'checked',
    'class',
    'disabled',
    'href',
    'id',
    'src',
    'title',
    'type'
];

/**
 * The addresses an `href` or a `src` may hold: the three schemes a document links out with, anything
 * that does not open with a scheme at all (a relative path, an anchor, a query), and nothing else.
 * `javascript:` and `data:` fail every branch, so the attribute carrying one is dropped.
 */
export const ALLOWED_URI_REGEXP = /^(?:(?:https?|mailto|tel):|[^a-z]|[a-z+.-]+(?:[^a-z+.\-:]|$))/i;

/** What a link that leads out is given, so a document's outward link cannot reach this page. */
export const LINK_TARGET = '_blank';
export const LINK_REL = 'noopener noreferrer';

/**
 * The addresses that lead out of the page: a link with one of these schemes, or a protocol-relative
 * address (two slashes, the page's own scheme), opens a tab of its own.
 */
export const OUTWARD_SCHEME = /^(?:(?:https?|mailto|tel):|\/\/)/i;

/** The one input a document holds: a task list's checkbox. Any other is removed with its markup. */
export const INPUT_TYPE = 'checkbox';

/** The whole filter as one object, so the test reads the same lists the browser is given. */
export const PROFILE = {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOWED_URI_REGEXP,
    ALLOW_DATA_ATTR: false,
    ALLOW_ARIA_ATTR: false,
    ALLOW_UNKNOWN_PROTOCOLS: false
};

/** A link out of the page opens its own tab and carries no handle back to this one. */
function markLinks(node: Element): void {
    if (node.tagName !== 'A') return;
    const href = node.getAttribute('href') ?? '';
    if (!OUTWARD_SCHEME.test(href)) return;
    node.setAttribute('target', LINK_TARGET);
    node.setAttribute('rel', LINK_REL);
}

/** An input that is not the checkbox of a task list has no place in a document, so it goes. */
function dropOtherInputs(node: Element): void {
    if (node.tagName !== 'INPUT' || node.getAttribute('type') === INPUT_TYPE) return;
    node.parentNode?.removeChild(node);
}

/** This module's own purifier, with the two hooks on it, or nothing when there is no document. */
function purifierOver(): typeof DOMPurify | null {
    if (!DOMPurify.isSupported) return null;
    const own = DOMPurify(window);
    own.addHook('afterSanitizeAttributes', markLinks);
    own.addHook('afterSanitizeAttributes', dropOtherInputs);
    return own;
}

const purifier = purifierOver();

/** One string of HTML as the profile allows it to be drawn. */
export function sanitise(html: string): string {
    if (purifier === null) return html;
    return purifier.sanitize(html, PROFILE);
}

/**
 * One field of Markdown as the HTML a card draws it with. The intro, the note and the funding
 * statement are one paragraph and a link or two in the hub's files, so this is the inline renderer:
 * a block renderer would only wrap each of them in a `<p>` the card's own markup already gives
 * them. What the file holds is somebody's text, so the result is sanitised before it is returned,
 * which is what covers every card that draws a value this way.
 */
export function inlineMarkdown(text: string): string {
    return sanitise(marked.parseInline(text, { async: false }));
}
