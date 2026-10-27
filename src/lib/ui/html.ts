// Layer 3, primitive, and one of the three that are not components. The HTML the app draws and the
// one sanitiser every string of it passes through. A hub file, a feed value and an agent's
// transcript are markup somebody else wrote, so what they turn into is filtered before a view draws
// it; the catalog's own text under config/text/ is oculus writing to itself and is drawn without
// the sanitiser.
//
// The profile is data below, not a call site's argument: an allow-list of the elements and the
// attributes marked and inline Markdown emit, and nothing else. No handler attribute, no style, no
// script, iframe, object or form, and a URL that is not one of the schemes the regular expression
// names is dropped with its attribute. Two rules the profile cannot state are hooks on the module's
// own purifier, because DOMPurify filters attribute names and never their values: a link that names
// a scheme is given the target and the rel below, and an input that is not a task list's checkbox
// is removed with its attributes.
//
// A note of a hub and a formula are drawn by two more rules. A note's links, embeds and tags are
// data/prose/markdown/note-render.ts's markup, rendered with the document and sanitised with it;
// an embedded note is rendered after the document, from the text the caller hands in, and put in
// its slot before the sanitiser runs, so it passes the same profile. A formula is typeset by KaTeX
// through `marked-katex-extension`, whose output needs `style` and MathML: each formula is held
// apart in a slot while the document passes `PROFILE`, and passes `MATH_PROFILE`, a profile of its
// own, before `sanitise` puts it back, so `PROFILE` allows no style for any other text. The slots
// are marked by a mark only the render of the document knows, so no text of it can stand for one.
//
// Two readings here draw no HTML at all: codeSpans cuts a catalog line into its plain words and
// its backticked code, which ui/display/text/CodeText.svelte draws as Svelte markup, so a line
// keeps its code look on the server and in the browser alike, and linkRuns cuts a text of the
// hub's data into its plain runs and its web addresses, which ui/display/text/LinkedText.svelte
// draws as links.
//
// The purifier is this module's instance, built from the document once, so the hooks are ours and
// the package's shared default instance is left as it is for anything else that imports it.
//
// DOMPurify needs a document to parse into. The app renders in the browser alone, which is what
// src/routes/+layout.ts says with `ssr = false`, so a runtime without a DOM draws no HTML either
// and the text comes back as it came; that pass-through is safe only while no page is rendered on
// the server. tests/ui/html.dom.test.ts runs the sanitiser over jsdom's document.

import DOMPurify from 'dompurify';
import { Lexer, Marked, marked, type MarkedExtension, type Tokens } from 'marked';
import {
    HEADING_PREFIX,
    escapeAttribute,
    renderDocumentParts,
    type RenderedHeading
} from '../data/prose/markdown/markdown.ts';
import { FRONT_MATTER, scanNote, sectionOf } from '../data/prose/markdown/note-links.ts';
import {
    EMBED_CLASS,
    LINK_CLASS,
    SLOT_CLASS,
    UNRESOLVED_CLASS,
    noteExtension,
    noteHref,
    type EmbedSlot,
    type NoteDrawing
} from '../data/prose/markdown/note-render.ts';

/**
 * What every heading id of a rendered document starts with, which a press on a link to a fragment
 * tries before the fragment as written reaches a heading: data/prose/markdown/markdown.ts's,
 * handed on so a view reaches it through the one module of layer 3 that renders Markdown.
 */
export const HEADING_ID_PREFIX = HEADING_PREFIX;

/**
 * The elements a rendered document, an assistant turn and one line of inline Markdown are made of:
 * what marked emits, plus the formatting and grouping tags the hub's own Markdown writes by hand
 * (a README holds `b`, `i`, `small`, `sub`, `sup`, `div` and a `details` block) and the
 * `b` the catalog's own lines carry, and the `span` the highlighter paints a fenced block's code
 * with, each carrying a highlight.js class and nothing else this profile keeps, which
 * themes/code.css colours. Nothing here runs, loads or collects.
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
    'span',
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
 * same addresses, no handler, no script, no frame. A `span` there may therefore carry a style, as a
 * `div` already may.
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

/**
 * The formulas a rendered document holds apart from its text (`blockMarkdownParts`): the mark of
 * their slots and KaTeX's markup of each, in the order of the slots.
 */
export type MathSlots = { mark: string; formulas: readonly string[] };

/**
 * One string of HTML as the profile allows it to be drawn. With `slots`, each formula's slot that
 * passed the profile is then filled with the formula as `MATH_PROFILE` allows it to be drawn.
 */
export function sanitise(html: string, slots?: MathSlots): string {
    const clean = purifier === null ? html : purifier.sanitize(html, PROFILE);
    if (slots === undefined) return clean;
    return clean.replace(
        new RegExp(`<span class="${MATH_SLOT}">${slots.mark}-m(\\d+)</span>`, 'g'),
        (_, at: string) => sanitiseMath(slots.formulas[Number(at)] ?? '')
    );
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
 * The elements a graph drawn by utils/diagrams/diagrams.mjs is made of: what Graphviz writes for a
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
 * The elements a formula typeset by KaTeX is made of: the `span` boxes of its HTML, the `svg`,
 * `path` and `line` its stretched symbols are drawn with, and the MathML elements of the copy a
 * screen reader reads. Nothing here loads, runs or links.
 */
const MATH_TAGS = [
    'span',
    'svg',
    'path',
    'line',
    'math',
    'semantics',
    'annotation',
    'mrow',
    'mi',
    'mn',
    'mo',
    'ms',
    'mtext',
    'mspace',
    'msup',
    'msub',
    'msubsup',
    'mfrac',
    'msqrt',
    'mroot',
    'mstyle',
    'mpadded',
    'mphantom',
    'menclose',
    'mtable',
    'mtr',
    'mtd',
    'mlabeledtr',
    'munder',
    'mover',
    'munderover'
];

/**
 * The attributes those elements carry: the class and the `style` KaTeX lays its boxes out with,
 * the geometry of its drawn symbols, and the presentation attributes of its MathML. No address and
 * no handler is among them.
 */
const MATH_ATTR = [
    'accent',
    'accentunder',
    'aria-hidden',
    'class',
    'columnalign',
    'columnlines',
    'columnspacing',
    'd',
    'depth',
    'display',
    'displaystyle',
    'encoding',
    'fence',
    'height',
    'largeop',
    'linethickness',
    'lspace',
    'mathcolor',
    'mathvariant',
    'maxsize',
    'minsize',
    'movablelimits',
    'notation',
    'preserveaspectratio',
    'rowlines',
    'rowspacing',
    'rspace',
    'scriptlevel',
    'separator',
    'stretchy',
    'stroke-width',
    'style',
    'symmetric',
    'viewbox',
    'voffset',
    'width',
    'x1',
    'x2',
    'xmlns',
    'y1',
    'y2'
];

/** The filter for a typeset formula. */
const MATH_PROFILE = drawingProfile(MATH_TAGS, MATH_ATTR);

/** One typeset formula as the profile above allows it to be drawn. */
function sanitiseMath(html: string): string {
    if (purifier === null) return html;
    return purifier.sanitize(html, MATH_PROFILE);
}

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
 * One field of Markdown as the HTML a card draws it with. A note and a funding statement are one
 * paragraph and a link or two in the hub's files, so this is the inline renderer: a block renderer
 * would only wrap each of them in a `<p>` the card's own markup already gives them. What the file
 * holds is somebody's text, so the result is sanitised before it is returned, which is what covers
 * every card that draws a value this way. Its `$...$` formulas are typeset once `math` is given, as
 * a document's are, and drawn as their source until then.
 */
export function inlineMarkdown(text: string, math: MathDrawing | null = null): string {
    if (math === null) return sanitise(marked.parseInline(text, { async: false }));
    const mark = `slot-${crypto.randomUUID()}`;
    const formulas: string[] = [];
    const parser = new Marked(
        mathExtension(math, (html) => {
            formulas.push(html);
            return `<span class="${MATH_SLOT}">${mark}-m${formulas.length - 1}</span>`;
        })
    );
    return sanitise(parser.parseInline(text, { async: false }), { mark, formulas });
}

/**
 * A whole Markdown document as the HTML a view draws it with: headings, lists, tables and fenced
 * code, which the inline renderer above leaves as the text they were written as. It is the
 * document rule of data/prose/markdown/markdown.ts the server renders a README with, heading ids
 * and the `[TOC]` list included, for the Markdown a view already holds: the source tab's preview
 * and a slide's narrative. What the file holds is somebody's text, so the result is sanitised.
 */
export function blockMarkdown(text: string): string {
    const parts = blockMarkdownParts(text);
    return sanitise(parts.html, parts.slots);
}

/** The modules a formula is typeset with, which views/shared/latex/math.ts loads on the first. */
export type MathModules = {
    markedKatex: (options: Record<string, unknown>) => MarkedExtension;
    katex: { renderToString: (source: string, options: Record<string, unknown>) => string };
};

/** How formulas are drawn: the loaded modules, KaTeX's options and the refusal's sentence. */
export type MathDrawing = {
    modules: MathModules;
    options: Readonly<Record<string, unknown>>;
    /** The sentence a formula KaTeX refuses carries as its title. */
    refused: string;
};

/**
 * What a document is drawn with beyond the document rule: a note's links, embeds and tags, KaTeX,
 * and `image`, which answers the address an image's source is read at, or null to leave the
 * source as the document wrote it.
 */
export type MarkdownExtras = {
    note?: NoteDrawing | null;
    math?: MathDrawing | null;
    image?: ((source: string) => string | null) | null;
};

/** The token pass that sets each image's address to what `image` answers for its source. */
function imageExtension(image: (source: string) => string | null): MarkedExtension {
    return {
        walkTokens(token) {
            if (token.type !== 'image') return;
            const held = token as Tokens.Image;
            held.href = image(held.href) ?? held.href;
        }
    };
}

/** The class of a formula's slot, and of a formula KaTeX refused. */
const MATH_SLOT = 'math-slot';
const MATH_ERROR = 'math-error';

/** A formula KaTeX refused: its source, in the error class, with the sentence as its title. */
function refusedFormula(source: string, sentence: string): string {
    return `<span class="${MATH_ERROR}" title="${escapeAttribute(sentence)}">${escapeAttribute(source)}</span>`;
}

/**
 * The extension that typesets `$...$` and `$$...$$`: the tokenizers of marked-katex-extension, each
 * with a renderer that typesets with KaTeX and hands the markup to `slot`, which answers what the
 * document holds in its place, and draws a formula KaTeX refuses as its source.
 */
function mathExtension(math: MathDrawing, slot: (html: string) => string): MarkedExtension {
    const made = math.modules.markedKatex({ ...math.options });
    const renderer = (token: Tokens.Generic): string => {
        const source = String(token.text);
        try {
            const html = math.modules.katex.renderToString(source, {
                ...math.options,
                displayMode: token.displayMode === true,
                throwOnError: true
            });
            return slot(html);
        } catch {
            return refusedFormula(token.raw, math.refused);
        }
    };
    return {
        extensions: (made.extensions ?? []).map((one) => ({
            ...one,
            renderer: (token: Tokens.Generic) =>
                `${renderer(token)}${'level' in one && one.level === 'block' ? '\n' : ''}`
        }))
    };
}

/**
 * An embedded note in its frame: its name as a link, then its text, or the link alone while the
 * text is not read; a heading the note does not hold draws the link unresolved. The frame of an
 * embed alone on its line is a `div`, and that of an embed inside a line a `span`.
 */
function embedded(slot: EmbedSlot, inner: string, found: boolean): string {
    const kind = found ? LINK_CLASS : `${LINK_CLASS} ${UNRESOLVED_CLASS}`;
    const head = `<a class="${kind}" href="${escapeAttribute(noteHref(slot))}">${escapeAttribute(slot.name)}</a>`;
    const element = slot.block ? 'div' : 'span';
    const framed = `<${element} class="${EMBED_CLASS}-head">${head}</${element}>${inner}`;
    return `<${element} class="${EMBED_CLASS}">${framed}</${element}>`;
}

/**
 * A note's text drawn as one run of a line, for an embed inside a line of text, where a block
 * would end the paragraph around it: each heading and paragraph as its inline Markdown, a heading
 * in `strong`, every other block as its source text, and a line break between two of them.
 */
function inlineDrawn(text: string, extensions: MarkedExtension[]): string {
    const reader = new Marked(...extensions);
    return reader
        .lexer(text)
        .filter((token) => token.type !== 'space')
        .map((token) => {
            if (token.type === 'heading' || token.type === 'paragraph') {
                const words = reader.parseInline(String(token.text), { async: false });
                return token.type === 'heading' ? `<strong>${words}</strong>` : words;
            }
            return escapeAttribute(token.raw.trim());
        })
        .join('<br>');
}

/**
 * A whole Markdown document as `blockMarkdown` renders it, not yet sanitised, with its formulas
 * held apart and the list of its headings: `sanitise(html, slots)` is what is drawn. A note is
 * drawn with its links, embeds and tags (`note`), formulas are typeset once KaTeX has loaded
 * (`math`), and images are read at the addresses `image` answers; without them the document is
 * the document rule's alone.
 */
export function blockMarkdownParts(
    text: string,
    extras: MarkdownExtras = {}
): { html: string; slots: MathSlots; headings: RenderedHeading[] } {
    const mark = `slot-${crypto.randomUUID()}`;
    const formulas: string[] = [];
    const slot = (html: string): string => {
        formulas.push(html);
        return `<span class="${MATH_SLOT}">${mark}-m${formulas.length - 1}</span>`;
    };
    const maths = extras.math === undefined || extras.math === null ? [] : [extras.math];
    const images = extras.image === undefined || extras.image === null ? [] : [extras.image];
    const own = (embeds: boolean, slots: EmbedSlot[]): MarkedExtension[] => [
        ...maths.map((one) => mathExtension(one, slot)),
        ...images.map((one) => imageExtension(one)),
        ...(extras.note === undefined || extras.note === null
            ? []
            : [noteExtension({ ...extras.note, embeds }, slots, `${mark}-e`)])
    ];
    const slots: EmbedSlot[] = [];
    const { html, headings } = renderDocumentParts(text, ...own(true, slots));
    let joined = html;
    for (const [at, one] of slots.entries()) {
        const source = extras.note?.text(one.path) ?? null;
        const body = source === null ? null : source.replace(FRONT_MATTER, '');
        const part =
            body === null || one.heading === '' ? body : sectionOf(scanNote(body), one.heading);
        const inner =
            part === null
                ? ''
                : one.block
                  ? renderDocumentParts(part, ...own(false, [])).html
                  : inlineDrawn(part, own(false, []));
        const filled = one.block
            ? `<div class="${SLOT_CLASS}">${mark}-e-${at}</div>`
            : `<span class="${SLOT_CLASS}">${mark}-e-${at}</span>`;
        joined = joined.split(filled).join(embedded(one, inner, body === null || part !== null));
    }
    return { html: joined, slots: { mark, formulas }, headings };
}

/** One piece of a catalog line: a run of plain words, or the text of one backticked code span. */
export type CodeSpan = { code: boolean; text: string };

/**
 * The pieces of one catalog line, in order: each backticked code span a code piece of its text, and
 * the words between them plain pieces. marked's inline lexer finds the spans, and every other token
 * it reads is kept as the source text it was read from, so a line never grows emphasis or a link it
 * was not written with. The plain pieces and the code pieces with their backticks put back give the
 * line again.
 */
export function codeSpans(text: string): CodeSpan[] {
    const pieces: CodeSpan[] = [];
    for (const token of new Lexer().inlineTokens(text)) {
        const code = token.type === 'codespan';
        const words = code ? String(token.text) : token.raw;
        const last = pieces.at(-1);
        if (!code && last !== undefined && !last.code) last.text += words;
        else pieces.push({ code, text: words });
    }
    return pieces;
}

/** One run of a text: plain words, or a web address with the address it links to. */
export type LinkRun = { text: string; href?: string };

/** An address as written: `https://` or `http://` and everything to the next whitespace. */
const ADDRESS = /https?:\/\/\S+/g;

/** The marks a sentence puts after an address, which the address leaves out. */
const CLOSING = '.,;:!?';

/**
 * An address with the marks a sentence put after it taken off its end: a full stop, a comma, a
 * semicolon, a colon, an exclamation or question mark, and a `)` while the address holds no `(`,
 * so "(https://a.b/)" links `https://a.b/` and a Wikipedia address ending `_(x)` keeps its `)`.
 */
function trimmed(address: string): string {
    let end = address.length;
    for (;;) {
        const last = address[end - 1];
        if (CLOSING.includes(last)) end -= 1;
        else if (last === ')' && !address.slice(0, end).includes('(')) end -= 1;
        else return address.slice(0, end);
    }
}

/**
 * The runs of a text, in order: each web address a run with its `href`, and the words between
 * them plain runs. An address starts with `https://` or `http://` and runs to the next whitespace,
 * less the marks `trimmed` takes off; nothing else is an address, so a bare host or a file name
 * stays text. The runs put together give the text again.
 */
export function linkRuns(text: string): LinkRun[] {
    const runs: LinkRun[] = [];
    let at = 0;
    for (const found of text.matchAll(ADDRESS)) {
        const href = trimmed(found[0]);
        const start = found.index;
        // An address with nothing after its `//` once trimmed names no place and stays text.
        if (!/^https?:\/\/./.test(href)) continue;
        if (start > at) runs.push({ text: text.slice(at, start) });
        runs.push({ text: href, href });
        at = start + href.length;
    }
    if (at < text.length) runs.push({ text: text.slice(at) });
    return runs;
}
