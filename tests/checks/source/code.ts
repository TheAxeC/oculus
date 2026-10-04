// Layer 4, test helper. Which characters of a source file are code, which are the inside of a
// string, a template or a regular expression, and which are a comment. The checks that read source
// text read it through this, so a word, a bracket or a call written in a string or a comment is not
// taken for code, and a comment is found wherever it is written.
//
// Each language is read by its own parser, never by a pattern over the text, since only a parse
// tells a regular expression after `return` from a division. A module is read by TypeScript's
// parse: its comments are the trivia before every token and after it on its line, as
// utils/diagrams/code.mjs finds them, and its strings are its literal tokens. A component is read
// by svelte/compiler's parse: its scripts as a module at their offsets, the comments of its markup
// expressions from the parse's list, its HTML comments by their nodes and its style comments from
// the style block's list; its markup text is code and holds no string. A page or an image written
// as markup (.html, .svg) is read the same way. A stylesheet's comments are those parseCss reports.
// No parser for the shell is installed, so a shell script keeps the rule that a `#` opening a word
// opens a comment.
//
// A file that does not parse is not guessed at: every function throws with the file's name, so a
// check that meets one fails loudly rather than reading it wrong.

import ts from 'typescript';
import { parseCss } from 'svelte/compiler';
import { component, parsed } from '../../../utils/diagrams/imports.mjs';

/** What one character of a file is. */
type Kind = 'code' | 'string' | 'comment';

/** A run of characters of one kind, from start up to end. */
type Span = { start: number; end: number };

/** The tokens whose inside is a string: literals, template parts and regular expressions. */
const STRINGS = new Set([
    ts.SyntaxKind.StringLiteral,
    ts.SyntaxKind.NoSubstitutionTemplateLiteral,
    ts.SyntaxKind.TemplateHead,
    ts.SyntaxKind.TemplateMiddle,
    ts.SyntaxKind.TemplateTail,
    ts.SyntaxKind.RegularExpressionLiteral
]);

/** The characters of a token's text that are its delimiters, before and after its inside. */
function insideOf(node: ts.Node, source: ts.SourceFile): Span {
    const start = node.getStart(source);
    const end = node.end;
    const text = source.text;
    if (node.kind === ts.SyntaxKind.RegularExpressionLiteral) {
        return { start: start + 1, end: start + text.slice(start, end).lastIndexOf('/') };
    }
    if (node.kind === ts.SyntaxKind.TemplateHead || node.kind === ts.SyntaxKind.TemplateMiddle) {
        return { start: start + 1, end: end - 2 };
    }
    return { start: start + 1, end: end - 1 };
}

/** Whether a node is a JSDoc node, whose text lies inside a comment rather than in the code. */
function isJSDoc(node: ts.Node): boolean {
    return node.kind >= ts.SyntaxKind.FirstJSDocNode && node.kind <= ts.SyntaxKind.LastJSDocNode;
}

/**
 * The syntax errors of a parse, read through a program over that one file. The host answers for
 * that file alone, so the program reads nothing from the disk and loads no library.
 */
function syntaxErrors(source: ts.SourceFile): readonly ts.Diagnostic[] {
    const name = source.fileName;
    const host: ts.CompilerHost = {
        getSourceFile: (file) => (file === name ? source : undefined),
        getDefaultLibFileName: () => 'lib.d.ts',
        writeFile: () => undefined,
        getCurrentDirectory: () => '',
        getCanonicalFileName: (file) => file,
        useCaseSensitiveFileNames: () => true,
        getNewLine: () => '\n',
        fileExists: (file) => file === name,
        readFile: () => undefined
    };
    const options = { noLib: true, noResolve: true, types: [] };
    return ts.createProgram({ rootNames: [name], options, host }).getSyntacticDiagnostics(source);
}

/**
 * Mark the comments and strings of one script, whose text sits in the whole file from `offset`.
 *
 * A token is a leaf of the parse: a node with no children but JSDoc nodes. A JSDoc node is never
 * walked into, since its words are no code; its comment is the leading trivia of the token it
 * hangs on.
 */
function markScript(name: string, script: string, offset: number, kinds: Kind[]): void {
    const source = parsed(name, script);
    const errors = syntaxErrors(source);
    if (errors.length > 0) {
        const said = ts.flattenDiagnosticMessageText(errors[0].messageText, ' ');
        throw new Error(`${name} does not parse: ${said}`);
    }
    const visit = (node: ts.Node): void => {
        if (isJSDoc(node)) return;
        const children = node.getChildren(source);
        if (children.every(isJSDoc)) {
            const ranges = [
                ...(ts.getLeadingCommentRanges(script, node.pos) ?? []),
                ...(ts.getTrailingCommentRanges(script, node.end) ?? [])
            ];
            for (const range of ranges)
                mark(kinds, offset + range.pos, offset + range.end, 'comment');
            if (STRINGS.has(node.kind)) {
                const inside = insideOf(node, source);
                mark(kinds, offset + inside.start, offset + inside.end, 'string');
            }
        }
        for (const child of children) visit(child);
    };
    visit(source);
}

/** Set the kind of the characters from start up to end. */
function mark(kinds: Kind[], start: number, end: number, kind: Kind): void {
    for (let at = start; at < Math.min(end, kinds.length); at += 1) kinds[at] = kind;
}

/** Every HTML comment node of a component's markup, wherever it is nested. */
function htmlComments(node: unknown, found: Span[]): void {
    if (node === null || typeof node !== 'object') return;
    if (Array.isArray(node)) {
        for (const one of node) htmlComments(one, found);
        return;
    }
    const held = node as Record<string, unknown>;
    if (held.type === 'Comment' && typeof held.data === 'string') {
        found.push({ start: Number(held.start), end: Number(held.end) });
    }
    for (const [key, value] of Object.entries(held)) {
        if (key !== 'parent' && key !== 'metadata') htmlComments(value, found);
    }
}

/** The kinds of a component, or of a page or an image written as markup. */
function componentKinds(name: string, text: string, kinds: Kind[]): void {
    const { tree, scripts } = component(text);
    for (const script of scripts) {
        const { start, end } = script.content as unknown as Span;
        const lang = /\blang\s*=\s*["']ts["']/.test(text.slice(script.start, start)) ? 'ts' : 'js';
        markScript(`${name}.script.${lang}`, text.slice(start, end), start, kinds);
    }
    const listed = (tree as unknown as { comments?: Span[] }).comments ?? [];
    for (const one of listed) mark(kinds, one.start, one.end, 'comment');
    const html: Span[] = [];
    htmlComments(tree.fragment, html);
    for (const one of html) mark(kinds, one.start, one.end, 'comment');
    for (const one of tree.css?.comments ?? []) mark(kinds, one.start, one.end, 'comment');
}

/** The kind of each UTF-16 unit of a shell script: a `#` that opens a word opens a comment. */
function shellKinds(text: string, kinds: Kind[]): void {
    let at = 0;
    for (const line of text.split('\n')) {
        const found = /(^|\s)#/.exec(line);
        if (found !== null && !line.startsWith('#!')) {
            mark(kinds, at + found.index + found[1].length, at + line.length, 'comment');
        }
        at += line.length + 1;
    }
}

/** The kinds of a file of any of the languages the tree is written in, by its name. */
function fileKinds(name: string, text: string): Kind[] {
    const kinds: Kind[] = Array.from({ length: text.length }, () => 'code');
    try {
        if (/\.(svelte|html|svg)$/.test(name)) componentKinds(name, text, kinds);
        else if (name.endsWith('.css')) {
            for (const one of parseCss(text).comments) {
                mark(kinds, one.start, one.end, 'comment');
            }
        } else if (name.endsWith('.sh')) shellKinds(text, kinds);
        else if (/\.(ts|js|mjs|cjs|mts|cts)$/.test(name)) markScript(name, text, 0, kinds);
        else throw new Error('no reader is known for its language');
    } catch (error) {
        const said = error instanceof Error ? error.message : String(error);
        if (said.startsWith(name)) throw error;
        throw new Error(`${name} does not parse: ${said}`, { cause: error });
    }
    return kinds;
}

/** The text with every character whose kind is not kept turned to a space, line breaks kept. */
function keeping(name: string, text: string, kept: (kind: Kind) => boolean): string {
    const kinds = fileKinds(name, text);
    let out = '';
    for (let at = 0; at < text.length; at += 1) {
        const one = text[at];
        out += kept(kinds[at]) || one === '\n' || one === '\r' ? one : ' ';
    }
    return out;
}

/** A file with every comment turned to spaces and every string kept, line breaks kept. */
export function withoutComments(name: string, text: string): string {
    return keeping(name, text, (kind) => kind !== 'comment');
}

/**
 * A file as its comments alone: every character outside a comment turned to a space, line breaks
 * kept, so a line of it is the comment text of that line of the file, trailing comments included.
 */
export function commentText(name: string, text: string): string {
    return keeping(name, text, (kind) => kind === 'comment');
}

/**
 * The lines of a file that are comment lines, as 1-based numbers: the lines whose first character
 * that is not a space belongs to a comment.
 */
export function commentLines(name: string, text: string): number[] {
    const kinds = fileKinds(name, text);
    const found: number[] = [];
    let at = 0;
    text.split('\n').forEach((line, index) => {
        const first = line.search(/\S/);
        if (first !== -1 && kinds[at + first] === 'comment') found.push(index + 1);
        at += line.length + 1;
    });
    return found;
}
