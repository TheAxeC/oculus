// Layer 2, server. What a Markdown text is made of, as a value two texts can be compared by: the
// blocks marked 18's lexer finds in it, their nesting, and the words of each, with every run of
// white space read as one space and every character the writing rules replace read as its ASCII
// form. Two texts with the same shape lex to the same headings, paragraphs, lists, list items,
// quotes, tables and code, the same links and the same inline code, so a join of a paragraph's
// lines or a replaced character that leaves the shape alone has changed nothing the preview draws.
//
// `holdingFixes` is the check every fix of a Markdown file goes through: of the fixes inside one
// top-level block, those whose edits, applied together to the block's text, leave its shape as it
// was. It tries all of them first and halves the set when they fail, so a block with one fix that
// breaks it loses that fix and not the others, and a set that holds only in parts is dropped whole
// when the parts do not hold together.

import { Lexer, type Token } from 'marked';
import { asciiOf, holding, type Mark, type Replacement } from './characters.ts';

/** A token, read by the names its fields carry whichever kind it is. */
type Tok = Token & Record<string, unknown>;

/** The fields of a token that are the document's structure and not its words. */
const STRUCTURE = [
    'depth',
    'ordered',
    'start',
    'task',
    'checked',
    'lang',
    'href',
    'title',
    'align'
];

/** A string with each run of white space one space and each banned character its ASCII form. */
function squashed(text: string): string {
    return asciiOf(text).replace(/\s+/g, ' ').trim();
}

function tokensOf(value: unknown): Tok[] {
    return Array.isArray(value) ? (value as Tok[]) : [];
}

/** The shape of a list of tokens; neighbouring words are one, since their split is not content. */
function shapes(tokens: readonly Tok[]): unknown[] {
    const shaped: Record<string, unknown>[] = [];
    for (const token of tokens) {
        if (token.type === 'space' || token.type === 'checkbox') continue;
        const one = shapeOf(token);
        const last = shaped.at(-1);
        if (one.t === 'text' && last?.t === 'text' && typeof one.x === 'string') {
            last.x = `${String(last.x)}${one.x}`;
        } else shaped.push(one);
    }
    return shaped.map((one) => (typeof one.x === 'string' ? { ...one, x: squashed(one.x) } : one));
}

function shapeOf(token: Tok): Record<string, unknown> {
    const one: Record<string, unknown> = { t: token.type };
    for (const field of STRUCTURE) if (token[field] !== undefined) one[field] = token[field];
    const children = tokensOf(token.tokens);
    if (token.type === 'list') one.i = shapes(tokensOf(token.items));
    else if (token.type === 'table') {
        one.h = tokensOf(token.header).map((cell) => shapes(tokensOf(cell.tokens)));
        one.r = (token.rows as Tok[][]).map((row) =>
            row.map((cell) => shapes(tokensOf(cell.tokens)))
        );
    } else if (children.length > 0) one.c = shapes(children);
    else if (typeof token.text === 'string') one.x = token.text;
    else if (token.type !== 'hr' && token.type !== 'br') one.x = token.raw;
    return one;
}

/** The shape of a Markdown text, as a string two shapes can be compared as. */
export function shapeOfText(text: string): string {
    return JSON.stringify(shapes(new Lexer().lex(text) as Tok[]));
}

/** The text with the replacements applied, or null when two of them cross. */
export function applied(text: string, edits: readonly Replacement[]): string | null {
    const ordered = [...edits].sort((a, b) => a.from - b.from || a.to - b.to);
    let result = '';
    let at = 0;
    for (const edit of ordered) {
        if (edit.from < at) return null;
        result += text.slice(at, edit.from) + edit.text;
        at = edit.to;
    }
    return result + text.slice(at);
}

/**
 * The marks of one top-level block whose first fix keeps the block's shape when they are applied
 * together. `block` is the block's text and `offset` where it starts in the whole text.
 */
export function holdingFixes(block: string, offset: number, marks: readonly Mark[]): Mark[] {
    const before = shapeOfText(block);
    const holds = (some: readonly Mark[]): boolean => {
        const edits = some.flatMap((mark) =>
            mark.fixes[0].edits.map((one) => ({
                from: one.from - offset,
                to: one.to - offset,
                text: one.text
            }))
        );
        const after = applied(block, edits);
        return after !== null && shapeOfText(after) === before;
    };
    return holding(marks, holds);
}
