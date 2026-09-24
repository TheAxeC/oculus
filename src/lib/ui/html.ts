// Layer 3, primitive, and one of the three that are not components. The HTML the app draws and the
// one sanitiser every string of it passes through. A hub file, a feed value and an agent's
// transcript are markup somebody else wrote, so what they turn into is filtered before a view draws
// it; the catalog's own text under config/text/ is oculus writing to itself and is drawn as it is.
//
// The profile is data below, not a call site's argument: an allow-list of the elements and the
// attributes marked and inline Markdown emit, and nothing else. No handler attribute, no style, no
// script, iframe, object or form, and a URL that is not one of the schemes the regular expression
// names is dropped with its attribute. Two rules the profile cannot state are hooks on the module's
// own purifier, because DOMPurify filters attribute names and never their values: a link that names
// a scheme is given the target and the rel below, and an input that is not a task list's checkbox
// is removed with its attributes.
//
// The purifier is this module's instance, built from the document once, so the hooks are ours and
// the package's shared default instance is left as it is for anything else that imports it.
//
// DOMPurify needs a document to parse into. The app renders in the browser alone, which is what
// src/routes/+layout.ts says with `ssr = false`, so a runtime without a DOM draws no HTML either
// and the text comes back as it came; tests/ui/html.test.ts reads that file and fails if the app
// ever starts rendering on the server, because the pass-through would then be a hole. What the
// profile does to real markup is checked in the browser, by
// tests/browser/workbench/sanitise.spec.ts.

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
 * marked puts on a table cell, the language class it puts on a fenced block, the three a task
 * list's checkbox is drawn with, and the `id` a document's own anchor is jumped to by. Everything
 * else goes, handlers and `style` among it.
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
 * The addresses an `href` or a `src` may hold: the three schemes a document links out with,
 * anything that does not open with a scheme at all (a relative path, an anchor, a query), and
 * nothing else. `javascript:` and `data:` fail every branch, so the attribute carrying one is
 * dropped.
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

/**
 * The second profile, for a slide's inline diagram and nothing else. A diagram is a small grid of
 * boxes whose geometry and per-box colour are written on the elements themselves (the columns of
 * the grid, the border of a node), so the profile above would keep the boxes and throw the diagram
 * away. It is the profile above with `style` added and no other difference: the same elements, the
 * same addresses, no handler, no script, no frame.
 */
export const DIAGRAM_ATTR = [...ALLOWED_ATTR, 'style'];

export const DIAGRAM_PROFILE = { ...PROFILE, ALLOWED_ATTR: DIAGRAM_ATTR };

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
 * One slide's inline diagram, filtered by the profile that keeps the geometry it was drawn with.
 */
export function sanitiseDiagram(html: string): string {
    if (purifier === null) return html;
    return purifier.sanitize(html, DIAGRAM_PROFILE);
}

/**
 * The elements a line icon is drawn out of: the root and the shapes a stroke is laid along. No
 * `image`, no `foreignObject`, no `use`, no `script` and no animation element, so an icon file can
 * carry a drawing and nothing else.
 */
export const SVG_TAGS = [
    'svg',
    'circle',
    'ellipse',
    'g',
    'line',
    'path',
    'polygon',
    'polyline',
    'rect'
];

/**
 * The attributes those elements carry: the box the drawing is laid out in, the geometry of each
 * shape, and how the stroke is painted. `stroke="currentColor"` is what makes an icon take the
 * colour of the text beside it, so the stroke attributes are part of the drawing and stay.
 */
export const SVG_ATTR = [
    'class',
    'cx',
    'cy',
    'd',
    'fill',
    'fill-rule',
    'height',
    'points',
    'r',
    'rx',
    'ry',
    'stroke',
    'stroke-linecap',
    'stroke-linejoin',
    'stroke-width',
    // Spelled lowercase because that is how the filter matches an attribute name; the drawing's
    // own `viewBox` keeps its capital in the page, which is what an SVG element is read with.
    'viewbox',
    'width',
    'x',
    'x1',
    'x2',
    'y',
    'y1',
    'y2'
];

/**
 * The filter for a drawing: its own elements and attributes, and nothing a document's profile
 * allows. The filter lowercases the lists a profile hands it, in place, so both are frozen here:
 * what this file exports stays what it declares however often a drawing is filtered.
 */
function drawingProfile(tags: string[], attrs: string[]) {
    Object.freeze(tags);
    Object.freeze(attrs);
    return {
        ALLOWED_TAGS: tags,
        ALLOWED_ATTR: attrs,
        ALLOW_DATA_ATTR: false,
        ALLOW_ARIA_ATTR: false,
        ALLOW_UNKNOWN_PROTOCOLS: false
    };
}

/** The filter for an icon. */
export const SVG_PROFILE = drawingProfile(SVG_TAGS, SVG_ATTR);

/**
 * One icon as the profile above allows it to be drawn. The file is read from the icon package by
 * the server rather than authored here, and it still passes the filter: what reaches the page is a
 * drawing whatever the package ships.
 */
export function sanitiseSvg(svg: string): string {
    if (purifier === null) return svg;
    return purifier.sanitize(svg, SVG_PROFILE);
}

/**
 * The elements a graph drawn by bin/diagrams/diagrams.mjs is made of: what Graphviz writes for a
 * group, a box, an ellipse, a cylinder, an edge and its arrowhead, the text of each label, and the
 * `title` of a node or an edge, which the browser shows on hover and which carries the functions a
 * write edge calls. There is no `a`, no `style` and nothing that loads, runs or embeds, so a
 * diagram file carries a drawing and nothing else, and the grey its own `style` sets for a viewer
 * outside oculus is dropped here, which leaves the drawing in the page's text colour.
 */
export const GRAPH_TAGS = ['svg', 'g', 'title', 'polygon', 'polyline', 'path', 'ellipse', 'text'];

/**
 * The attributes those elements carry: the box the drawing is laid out in and moved by, the
 * geometry of each shape, how its stroke and fill are painted, the dashes of a dashed edge, and how
 * a label's text is set. The file writes every colour as `currentColor`, which is what makes the
 * drawing take the colour of the text around it; there is no `id`, so no name in the drawing can
 * shadow one of the page's.
 */
export const GRAPH_ATTR = [
    'class',
    'cx',
    'cy',
    'd',
    'fill',
    'font-family',
    'font-size',
    'height',
    'points',
    'rx',
    'ry',
    'stroke',
    'stroke-dasharray',
    'stroke-width',
    'text-anchor',
    'transform',
    'viewbox',
    'width',
    'x',
    'y'
];

/** The filter for a generated graph. */
export const GRAPH_PROFILE = drawingProfile(GRAPH_TAGS, GRAPH_ATTR);

/**
 * One diagram of docs/diagrams/ as the profile above allows it to be drawn. The file is oculus's
 * own, written by its generator, and it still passes the filter: what reaches the page is a
 * drawing whatever the folder holds.
 */
export function sanitiseGraph(svg: string): string {
    if (purifier === null) return svg;
    return purifier.sanitize(svg, GRAPH_PROFILE);
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

/**
 * A whole Markdown document as the HTML a view draws it with: headings, lists, tables and fenced
 * code, which the inline renderer above leaves as the text they were written as. The server renders
 * a README this way before it sends it; this is for the Markdown a view already holds, a slide's
 * narrative being the one. What the file holds is somebody's text, so the result is sanitised.
 */
export function blockMarkdown(text: string): string {
    return sanitise(marked.parse(text, { async: false }));
}
