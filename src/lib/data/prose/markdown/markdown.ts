// Layer 1, data. A Markdown document as the HTML every document of the application is drawn with:
// headings carrying ids, and a paragraph that is `[TOC]` and nothing else drawn as the document's
// table of contents.
//
// One rule, imported by both sides: the document route renders a file on disk with it
// (server/content/docs.ts), and the page renders the Markdown it already holds with it
// (ui/html.ts, for the source tab's preview and a slide's narrative), so a document reads the same
// wherever it is drawn. A copy on each side would let the two disagree about an id or a list.
//
// Every heading id is the GitHub-style slug marked-gfm-heading-id makes, unique within the
// document, with HEADING_PREFIX before it as GitHub puts it. The prefix is what keeps an id off the
// names the page's document and forms already carry: the sanitiser drops an id such as `method` or
// `title`, which name a property of the document, and a bare id could equal an id the application
// itself draws. A link written by hand to `#method` still reaches `user-content-method`, since the
// press on a link (views/shared/prose/Markdown.svelte) tries the fragment with the prefix too.
//
// A fenced block is painted by the highlighter's extension (data/prose/languages.ts, `codeColour`),
// so a document's code is coloured wherever the document is drawn, by themes/code.css.
//
// The renderer is each call's own `Marked`, never `marked.use`, so nothing here changes how any
// other reader of the package renders.

import { Marked, type MarkedExtension, type Tokens } from 'marked';
import { getHeadingList, gfmHeadingId } from 'marked-gfm-heading-id';
import type { RenderedHeading } from '../../model/index.ts';

export type { RenderedHeading };
import { codeColour } from '../languages.ts';

/** What every heading id starts with, as GitHub renders one. */
export const HEADING_PREFIX = 'user-content-';

/** The whole text of the paragraph that asks for the table of contents, case as written. */
export const TOC_MARK = '[TOC]';

/** The class the outermost list of a table of contents carries, which the prose partial styles. */
export const TOC_CLASS = 'toc';

/** An attribute value as markup, so a value carrying a quote stays inside its attribute. */
export function escapeAttribute(value: string): string {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

/**
 * A heading's rendered text with every tag of inline HTML taken off, a quoted attribute value
 * holding a `>` included, so only its words are left. The pattern is built here, per call, so no
 * expression with a position of its own is shared between calls.
 */
function wordsOf(html: string): string {
    return html.replace(/<(?:[^>"']|"[^"]*"|'[^']*')*>/g, '').trim();
}

/**
 * The table of contents of one parse: a nested list of links, one per heading in order, each to
 * the heading's id and holding the heading's words. A deeper heading opens a list inside the entry
 * above it, whatever the number of levels it skips; a shallower one closes lists until it reaches
 * one whose entries are at its level or above, and a list opened for a skipped level takes the
 * level of the heading that comes back to it. The words are the heading's own rendered text with
 * its markup taken off: marked has already escaped what the author wrote as text, so what is left
 * is text and stays escaped. A heading with no words has nothing to press and draws no entry, and
 * a document with no heading draws nothing at all.
 */
export function tocList(headings: { level: number; text: string; id: string }[]): string {
    const entries = headings
        .map((one) => ({ ...one, words: wordsOf(one.text) }))
        .filter((one) => one.words !== '');
    if (entries.length === 0) return '';
    let html = '';
    const open: number[] = [];
    for (const entry of entries) {
        const top = open.at(-1);
        if (top === undefined) {
            html += `<ul class="${TOC_CLASS}">`;
            open.push(entry.level);
        } else if (entry.level > top) {
            html += '<ul>';
            open.push(entry.level);
        } else {
            html += '</li>';
            while (open.length > 1 && entry.level < (open.at(-1) ?? 0)) {
                if (entry.level > open[open.length - 2]) {
                    open[open.length - 1] = entry.level;
                    break;
                }
                html += '</ul></li>';
                open.pop();
            }
        }
        html += `<li><a href="#${escapeAttribute(entry.id)}">${entry.words}</a>`;
    }
    html += '</li>';
    for (let left = open.length; left > 1; left -= 1) html += '</ul></li>';
    return `${html}</ul>\n`;
}

/**
 * One Markdown document as its HTML, unsanitised, its fenced code painted, and the list of its
 * headings, from one parse. A caller adds extensions (the document route's figures) after the
 * heading ids and the table of contents. A heading is its level, its words as written (the
 * library's `raw`, with no markup of the render) and the id in the HTML, prefixed. The list is what
 * an outline of the rendered document shows, and the ids are the ones the HTML carries, so a press
 * on a row reaches the heading drawn.
 *
 * The table of contents needs every heading, and a `[TOC]` paragraph is drawn before the headings
 * after it are, so the paragraph leaves a mark that only this call can have written, and the list
 * replaces it once the whole document is drawn. The heading list is the library's own record of
 * this parse, which its preprocess hook clears as the parse starts; the parse is synchronous, so
 * no other parse runs between the two.
 */
export function renderDocumentParts(
    text: string,
    ...extra: MarkedExtension[]
): { html: string; headings: RenderedHeading[] } {
    const mark = `<!--toc-${crypto.randomUUID()}-->`;
    const contents: MarkedExtension = {
        renderer: {
            paragraph({ text: said }: Tokens.Paragraph) {
                return said.trim() === TOC_MARK ? mark : false;
            }
        },
        hooks: {
            postprocess(html: string) {
                return html.split(mark).join(tocList(getHeadingList()));
            }
        }
    };
    const heads = gfmHeadingId({ prefix: HEADING_PREFIX });
    const reader = new Marked(heads, contents, codeColour, ...extra);
    const html = reader.parse(text, { async: false });
    const headings = getHeadingList().map(({ level, raw, id }) => ({ level, text: raw, id }));
    return { html, headings };
}
