// Layer 4, tool. A module's text with everything that is not code blanked, for the channel and
// write readers of utils/diagrams/, which match calls in text:
// a call named in a comment is no call.
//
// The comments are found by the parsers imports.mjs reads imports with, never by a pattern over
// the text, so a string, a template or a regular expression that holds `/*`, `*/` or `//` is kept
// whole with what follows it. A script is read by the TypeScript parse: every comment is the
// trivia before some token or after one on its line, which the compiler's own comment scanner
// reads. A component is read by svelte/compiler's parse: its scripts as above, every
// comment of an expression in its markup from the parse's own list, every HTML comment of its
// markup by its node, and its style block whole, since no reader looks for a call in CSS. The
// markup itself is kept, since a channel is read in markup too. Every blanked character but a
// line break becomes a space, so an offset and a line of the result are those of the source.

import ts from 'typescript';
import { component, parsed } from './imports.mjs';

/** Blank the characters from start to end, line breaks kept. */
function blank(
    /** @type {string[]} */ held,
    /** @type {number} */ start,
    /** @type {number} */ end
) {
    for (let at = start; at < end; at += 1) {
        if (held[at] !== '\n' && held[at] !== '\r') held[at] = ' ';
    }
}

/** Whether a node is a JSDoc node, whose text lies inside a comment rather than in the code. */
function isJSDoc(/** @type {ts.Node} */ node) {
    return node.kind >= ts.SyntaxKind.FirstJSDocNode && node.kind <= ts.SyntaxKind.LastJSDocNode;
}

/**
 * The comments of one script, as ranges of the whole text the script sits in from `offset`: the
 * trivia before every token of its parse and after it on its line, read by the compiler's
 * getLeadingCommentRanges() and getTrailingCommentRanges(). A token is a leaf when it has no
 * children but JSDoc nodes. A JSDoc node is never walked into, since the words inside it are no
 * code to read trivia from, and its comment is the leading trivia of the token it hangs on, the
 * end-of-file token included, which is a leaf by that rule.
 *
 * @param {string} name The file name whose ending says how the script is parsed.
 * @param {string} code
 * @param {number} offset
 * @returns {{ start: number, end: number }[]}
 */
function scriptComments(name, code, offset) {
    const source = parsed(name, code);
    /** @type {{ start: number, end: number }[]} */
    const found = [];
    const visit = (/** @type {ts.Node} */ node) => {
        if (isJSDoc(node)) return;
        const children = node.getChildren(source);
        if (children.every(isJSDoc)) {
            const ranges = [
                ...(ts.getLeadingCommentRanges(code, node.pos) ?? []),
                ...(ts.getTrailingCommentRanges(code, node.end) ?? [])
            ];
            for (const range of ranges) {
                found.push({ start: offset + range.pos, end: offset + range.end });
            }
        }
        for (const child of children) visit(child);
    };
    visit(source);
    return found;
}

/**
 * Every HTML comment node of a component's markup, wherever it is nested.
 *
 * @param {unknown} node
 * @param {{ start: number, end: number }[]} found
 */
function htmlComments(node, found) {
    if (node === null || typeof node !== 'object') return;
    if (Array.isArray(node)) {
        for (const one of node) htmlComments(one, found);
        return;
    }
    const held = /** @type {Record<string, unknown>} */ (node);
    if (held.type === 'Comment' && typeof held.data === 'string') {
        found.push({ start: Number(held.start), end: Number(held.end) });
    }
    for (const [key, value] of Object.entries(held)) {
        if (key !== 'parent' && key !== 'metadata') htmlComments(value, found);
    }
}

/**
 * The text of a module with every comment blanked, and for a component its style block too.
 *
 * @param {string} name The file's path, whose ending says how it is parsed.
 * @param {string} text
 * @returns {string}
 */
export function codeOf(name, text) {
    /** @type {{ start: number, end: number }[]} */
    const ranges = [];
    if (!name.endsWith('.svelte')) {
        ranges.push(...scriptComments(name, text, 0));
    } else {
        const { tree, scripts } = component(text);
        for (const script of scripts) {
            const { start, end } = /** @type {{ start: number, end: number }} */ (
                /** @type {unknown} */ (script.content)
            );
            const lang = /\blang\s*=\s*["']ts["']/.test(text.slice(script.start, start))
                ? 'ts'
                : 'js';
            ranges.push(...scriptComments(`script.${lang}`, text.slice(start, end), start));
        }
        const listed = /** @type {{ comments?: { start: number, end: number }[] }} */ (
            /** @type {unknown} */ (tree)
        ).comments;
        ranges.push(...(listed ?? []).map(({ start, end }) => ({ start, end })));
        htmlComments(tree.fragment, ranges);
        if (tree.css !== null && tree.css !== undefined) ranges.push(tree.css.content);
    }
    const held = text.split('');
    for (const { start, end } of ranges) blank(held, start, end);
    return held.join('');
}
