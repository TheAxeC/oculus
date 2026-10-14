// Layer 2, server. The marks of a Markdown file: its banned characters in the text of the document,
// and its paragraphs broken across lines. The document is lexed by marked 18, the parser that draws
// oculus's preview (data/prose/markdown/markdown.ts), after the front matter is cut off with the
// tree's one split (`splitFrontmatter`), so a mark falls where the preview shows prose.
//
// Where a block starts is counted in lines. marked's tokens carry the text of each block without
// the markers of the blocks around it (the `> ` of a quote, the bullet and the indentation of a
// list item), so each line of a token is placed on the line of the file it came from, the token's
// text being the end of that line; a token whose lines are not the ends of the file's lines is
// counted in `unplaced` and gets no mark. A token's inline tokens are placed in its text in order,
// a run of white space after a line break being the indentation marked drops.
//
// Open to marks: the text of paragraphs, headings, list items, table cells and quotes, a link's or
// an image's text, and the HTML of the document. Not open: front matter, fenced and indented code,
// inline code, a link's or an image's destination and title, a reference definition, an autolink,
// and an address (characters.ts `withoutUrls`).
//
// A paragraph broken across lines has a mark whose fix has one edit per soft break, the break and
// the indentation that follows it becoming a space. A line that ends in two spaces, a backslash or
// `<br>` is a hard break and is kept, as is a break next to a line that starts or ends with `$$`.
// Every fix goes through markdown-blocks.ts, which keeps it a fix only when the block it is in
// keeps its shape; a curly quote inside an HTML tag, where a straight one would end the attribute,
// is offered and never applied.

import { Lexer, type Token } from 'marked';
import { splitFrontmatter } from '../../../../../data/sources/documents/docs.ts';
import {
    demoted,
    marksOf,
    without,
    withoutUrls,
    type Mark,
    type Range,
    type Replacement
} from './characters.ts';
import { holdingFixes } from './markdown-blocks.ts';
import { lineStarts, linesOf } from '../text.ts';

type Tok = Token & Record<string, unknown>;

/**
 * One line of a token's text, placed on a line of the body: where its text starts in the line, and
 * where in the piece's text a backslash of the line was dropped (an escaped pipe of a table cell),
 * so the line holds one more character before that offset.
 */
type Piece = { line: number; col: number; text: string; at: number; drops: number[] };

/** The text of a token as its lines, and where each line is. `text` joins them with `\n`. */
type Unit = { pieces: Piece[]; text: string };

/** The line of the body that line `inner` of a container's text is on. */
type Placing = (inner: number) => number;

/** What the walk over the tokens gathers. */
type Walk = {
    lines: string[];
    starts: number[];
    shift: number;
    open: Range[];
    tags: Range[];
    breaks: Mark[];
    blocks: Range[];
    end: number;
    unplaced: number;
};

/** What a Markdown text came to: its marks, and the blocks that could not be placed. */
export type MarkdownMarks = { marks: Mark[]; unplaced: number };

/** The tags of HTML, which a straight quote must not end. */
const TAG = /<\/?[A-Za-z][^>]*>|<!--[\s\S]*?-->/g;

function tokensOf(value: unknown): Tok[] {
    return Array.isArray(value) ? (value as Tok[]) : [];
}

function newlines(raw: string): number {
    return raw.split('\n').length - 1;
}

/** The lines of a token's text, without the line ends that close it. */
function rawLines(raw: string): string[] {
    return raw.replace(/\n+$/, '').split('\n');
}

/** The token's lines placed on the body's, or null when one is not the end of its file line. */
function unitOf(walk: Walk, raw: string, at: Placing, cursor: number): Unit | null {
    const pieces: Piece[] = [];
    let offset = 0;
    for (const [index, text] of rawLines(raw).entries()) {
        const line = at(cursor + index);
        const file = walk.lines.at(line);
        if (!file?.endsWith(text)) return null;
        pieces.push({ line, col: file.length - text.length, text, at: offset, drops: [] });
        offset += text.length + 1;
    }
    return { pieces, text: pieces.map((one) => one.text).join('\n') };
}

/** The offset in the whole text of offset `offset` of a piece, `end` when it ends a range. */
function placed(walk: Walk, piece: Piece, offset: number, end: boolean): number {
    const inside = offset - piece.at;
    const dropped = piece.drops.filter((one) => (end ? one < inside : one <= inside)).length;
    return walk.shift + walk.starts[piece.line] + piece.col + inside + dropped;
}

/** The ranges of a unit's text as ranges of the whole text, split at its line ends. */
function fileRanges(walk: Walk, unit: Unit, ranges: readonly Range[]): Range[] {
    const found: Range[] = [];
    for (const [from, to] of ranges) {
        for (const piece of unit.pieces) {
            const start = Math.max(from, piece.at);
            const end = Math.min(to, piece.at + piece.text.length);
            if (start < end) {
                found.push([placed(walk, piece, start, false), placed(walk, piece, end, true)]);
            }
        }
    }
    return found;
}

/**
 * The offset in `text` after `raw` is read from `from`, or null. A line break in `raw` also takes
 * the blanks before it and the indentation after it that the token left out.
 */
function advance(text: string, from: number, raw: string): number | null {
    let at = from;
    for (const char of raw) {
        const lineStart = at > 0 && text[at - 1] === '\n';
        if (char === '\n') {
            let blank = at;
            while (text[blank] === ' ' || text[blank] === '\t') blank += 1;
            if (lineStart && text[blank] !== '\n') continue;
            at = blank;
        } else if (lineStart) {
            while (/[ \t\n]/.test(text[at] ?? '') && !text.startsWith(char, at)) at += 1;
        }
        if (!text.startsWith(char, at)) return null;
        at += char.length;
    }
    return at;
}

/**
 * Place the inline tokens of a unit from offset `from`: the ranges that are not text go to
 * `holes`, an HTML token's to `tags`. Returns the offset after the last token, or null when a
 * token is not where the text says it is.
 */
function alignInline(
    unit: Unit,
    tokens: readonly Tok[],
    from: number,
    holes: Range[],
    tags: Range[]
): number | null {
    let at = from;
    for (const token of tokens) {
        const end = advance(unit.text, at, token.raw);
        if (end === null) return null;
        switch (token.type) {
            case 'codespan':
                holes.push([at, end]);
                break;
            case 'link':
            case 'image': {
                const lead = token.type === 'image' ? 2 : 1;
                if (!token.raw.startsWith(token.type === 'image' ? '![' : '[')) {
                    holes.push([at, end]);
                    break;
                }
                const inner = alignInline(unit, tokensOf(token.tokens), at + lead, holes, tags);
                holes.push([inner === null || inner > end ? at : inner, end]);
                break;
            }
            case 'em':
            case 'strong':
            case 'del': {
                const lead = token.type === 'strong' || token.raw.startsWith('~~') ? 2 : 1;
                const inner = alignInline(unit, tokensOf(token.tokens), at + lead, holes, tags);
                if (inner === null) holes.push([at, end]);
                break;
            }
            case 'html':
                tags.push([at, end]);
                break;
        }
        at = end;
    }
    return at;
}

/**
 * Open the unit's text to marks from offset `from`, as far as its inline tokens go. False when the
 * tokens are not where the text says, or the text after them is more than `rest` allows.
 */
function openUnit(
    walk: Walk,
    unit: Unit,
    tokens: readonly Tok[],
    from: number,
    rest: RegExp
): boolean {
    const holes: Range[] = [];
    const tags: Range[] = [];
    const end =
        tokens.length === 0 ? unit.text.length : alignInline(unit, tokens, from, holes, tags);
    if (end === null || !rest.test(unit.text.slice(end))) return false;
    walk.open.push(...fileRanges(walk, unit, without([[from, end]], holes)));
    walk.tags.push(...fileRanges(walk, unit, tags));
    return true;
}

/** Whether a line ends in a hard break: two spaces, an odd run of backslashes, or `<br>`. */
function endsHard(line: string, trimmed: string): boolean {
    if (/ {2,}$/.test(line)) return true;
    if (/<br\s*\/?>$/i.test(trimmed)) return true;
    return (/\\+$/.exec(trimmed)?.[0].length ?? 0) % 2 === 1;
}

/** The mark of a paragraph that is broken across lines, or null when it has no soft break. */
function breakMark(walk: Walk, unit: Unit): Mark | null {
    const { pieces } = unit;
    const start = (one: Piece, text: string): number =>
        walk.shift + walk.starts[one.line] + one.col + (text.length - text.trimStart().length);
    const edits: Replacement[] = [];
    for (let index = 0; index + 1 < pieces.length; index += 1) {
        const above = pieces[index];
        const below = pieces[index + 1];
        const trimmed = above.text.replace(/[ \t]+$/, '');
        if (endsHard(above.text, trimmed)) continue;
        if (/^[ \t]*\$\$/.test(below.text) || trimmed.endsWith('$$')) continue;
        edits.push({
            from: walk.shift + walk.starts[above.line] + above.col + trimmed.length,
            to: start(below, below.text),
            text: ' '
        });
    }
    if (edits.length === 0) return null;
    const first = pieces[0];
    const last = pieces[pieces.length - 1];
    return {
        from: start(first, first.text),
        to:
            walk.shift +
            walk.starts[last.line] +
            last.col +
            last.text.replace(/[ \t]+$/, '').length,
        code: 'wrapped-paragraph',
        message: { id: 'writing_message_wrapped', args: [pieces.length] },
        fixes: [{ kind: 'fix', title: { id: 'writing_fix_join' }, edits }]
    };
}

/** Walk the blocks of a container, `at` placing its lines on the body's. */
function walkBlocks(walk: Walk, tokens: readonly Tok[], at: Placing, top: boolean): void {
    let cursor = 0;
    for (const token of tokens) {
        if (token.type === 'checkbox') continue;
        const span = newlines(token.raw);
        if (top && cursor < walk.starts.length) {
            const last = cursor + span + (token.raw.endsWith('\n') ? 0 : 1);
            walk.blocks.push([
                walk.shift + walk.starts[cursor],
                last < walk.starts.length ? walk.shift + walk.starts[last] : walk.end
            ]);
        }
        walkBlock(walk, token, at, cursor);
        cursor += span;
    }
}

/** Walk one block starting at line `cursor` of its container. */
function walkBlock(walk: Walk, token: Tok, at: Placing, cursor: number): void {
    switch (token.type) {
        case 'paragraph':
        case 'text': {
            const unit = unitOf(walk, token.raw, at, cursor);
            if (unit === null || !openUnit(walk, unit, tokensOf(token.tokens), 0, /^\s*$/)) {
                walk.unplaced += 1;
                return;
            }
            const mark = breakMark(walk, unit);
            if (mark !== null) walk.breaks.push(mark);
            return;
        }
        case 'heading': {
            const unit = unitOf(walk, token.raw, at, cursor);
            const from = unit?.text.indexOf(String(token.text)) ?? -1;
            if (
                unit === null ||
                from < 0 ||
                !openUnit(walk, unit, tokensOf(token.tokens), from, /^[\s#=-]*$/)
            ) {
                walk.unplaced += 1;
            }
            return;
        }
        case 'blockquote':
            walkBlocks(walk, tokensOf(token.tokens), (inner) => at(cursor + inner), false);
            return;
        case 'list': {
            let item = cursor;
            for (const one of tokensOf(token.items)) {
                const base = item;
                walkBlocks(walk, tokensOf(one.tokens), (inner) => at(base + inner), false);
                item += newlines(one.raw);
            }
            return;
        }
        case 'table':
            walkTable(walk, token, at, cursor);
            return;
        case 'html': {
            const unit = unitOf(walk, token.raw, at, cursor);
            if (unit === null) {
                walk.unplaced += 1;
                return;
            }
            walk.open.push(...fileRanges(walk, unit, [[0, unit.text.length]]));
            const tags = [...unit.text.matchAll(TAG)].map((found): Range => [
                found.index,
                found.index + found[0].length
            ]);
            walk.tags.push(...fileRanges(walk, unit, tags));
        }
    }
}

/** The ranges of the cells of a table row's text, between the pipes that are not escaped. */
function cellRanges(row: string): Range[] {
    const cuts: number[] = [];
    for (let at = 0; at < row.length; at += 1) {
        if (row[at] === '\\') at += 1;
        else if (row[at] === '|') cuts.push(at);
    }
    const bounds = [-1, ...cuts, row.length];
    const cells: Range[] = [];
    for (let index = 0; index + 1 < bounds.length; index += 1) {
        const text = row.slice(bounds[index] + 1, bounds[index + 1]);
        const edge = index === 0 || index + 2 === bounds.length;
        if (edge && text.trim() === '') continue;
        const from = bounds[index] + 1 + (text.length - text.trimStart().length);
        cells.push([from, from + text.trim().length]);
    }
    return cells;
}

/**
 * Open the cells of a table: a cell's text is the row's text between its pipes. A row with more
 * cells than the header loses the rest, and one with fewer has empty cells at its end.
 */
function walkTable(walk: Walk, token: Tok, at: Placing, cursor: number): void {
    const lines = unitOf(walk, token.raw, at, cursor);
    const rows = [tokensOf(token.header), ...(token.rows as Tok[][])];
    for (const [row, cells] of rows.entries()) {
        const piece = lines?.pieces[row === 0 ? 0 : row + 1];
        if (piece === undefined) {
            walk.unplaced += 1;
            continue;
        }
        const ranges = cellRanges(piece.text);
        for (const [index, cell] of cells.entries()) {
            const range = ranges[index] ?? [0, 0];
            const source = piece.text.slice(range[0], range[1]);
            const text = source.replace(/\\\|/g, '|');
            if (text === '' && cell.text === '') continue;
            const drops: number[] = [];
            for (
                let found = source.indexOf('\\|');
                found >= 0;
                found = source.indexOf('\\|', found + 2)
            ) {
                drops.push(found - drops.length + 1);
            }
            const unit: Unit = {
                pieces: [{ line: piece.line, col: piece.col + range[0], text, at: 0, drops }],
                text
            };
            if (text !== cell.text || !openUnit(walk, unit, tokensOf(cell.tokens), 0, /^\s*$/)) {
                walk.unplaced += 1;
            }
        }
    }
}

/** The top-level block that holds an offset, found in the sorted blocks. */
function blockAt(blocks: readonly Range[], offset: number): number {
    let low = 0;
    let high = blocks.length - 1;
    while (low < high) {
        const middle = Math.ceil((low + high) / 2);
        if (blocks[middle][0] <= offset) low = middle;
        else high = middle - 1;
    }
    return low;
}

/**
 * The marks of a Markdown text. `arrows` is false where arrows are the surface's icons. The text
 * is the file's, without a byte order mark.
 */
export function markdownMarks(text: string, arrows: boolean): MarkdownMarks {
    const { body } = splitFrontmatter(text);
    const walk: Walk = {
        lines: linesOf(body),
        starts: lineStarts(body),
        shift: text.length - body.length,
        open: [],
        tags: [],
        breaks: [],
        blocks: [],
        end: text.length,
        unplaced: 0
    };
    walkBlocks(walk, new Lexer().lex(body) as Tok[], (inner) => inner, true);
    const open = withoutUrls(text, mergedRanges(walk.open));
    const characters = marksOf(text, open, arrows).map((mark) =>
        mark.code === 'curly-quote' &&
        walk.tags.some(([from, to]) => mark.from >= from && mark.from < to)
            ? demoted(mark)
            : mark
    );
    const marks = [...characters, ...walk.breaks].sort((a, b) => a.from - b.from || a.to - b.to);
    return { marks: verifiedMarks(text, marks, walk.blocks), unplaced: walk.unplaced };
}

/** The ranges sorted and joined where they touch. */
function mergedRanges(ranges: readonly Range[]): Range[] {
    const sorted = [...ranges].sort((a, b) => a[0] - b[0]);
    const merged: Range[] = [];
    for (const range of sorted) {
        const last = merged.at(-1);
        if (last !== undefined && range[0] <= last[1])
            merged[merged.length - 1] = [last[0], Math.max(last[1], range[1])];
        else merged.push(range);
    }
    return merged;
}

/** The marks with each fix that changes its block's shape written as a suggestion. */
function verifiedMarks(text: string, marks: Mark[], blocks: readonly Range[]): Mark[] {
    if (blocks.length === 0) return marks;
    const byBlock = new Map<number, Mark[]>();
    for (const mark of marks) {
        if (mark.fixes[0]?.kind !== 'fix') continue;
        const block = blockAt(blocks, mark.from);
        byBlock.set(block, [...(byBlock.get(block) ?? []), mark]);
    }
    const kept = new Set<Mark>();
    for (const [block, some] of byBlock) {
        const [from, to] = blocks[block];
        for (const mark of holdingFixes(text.slice(from, to), from, some)) kept.add(mark);
    }
    return marks.map((mark) =>
        mark.fixes[0]?.kind === 'fix' && !kept.has(mark) ? demoted(mark) : mark
    );
}
