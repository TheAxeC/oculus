// Layer 1, data. The links, embeds and tags of a note, and which note a link names. One reading
// for every reader: the server lists each note's links and tags for the Notes section, Backlinks,
// Tags and the Notes Graph (server/files/fs/notes.ts), the Markdown entry answers completion,
// definitions, references and renames from it (server/machine/lsp/adapters/markdown/own/), the
// page rewrites links when a note moves (state/sources/explorer/notes/), and the rendered half
// draws them (note-render.ts), so the four never disagree about what is a link.
//
// A link is `[[name]]`, `[[name#heading]]`, `[[name|shown text]]` or `[[name#heading|shown text]]`;
// an embed is the same behind `!`. Inside a GFM table the link's `|` is written `\|`, which the
// table's own reading turns back into `|` before the link is read, and the scan below reads `\|`
// as `|` too. A tag is `#word` after a space or at the start of a run of text, of letters, digits,
// `_`, `-` and `/` with at least one character that is not a digit, or an entry of a `tags:` list
// in the YAML front matter at the top. The text is read by marked's own lexer with these three
// tokenizers added, so a link, an embed or a tag inside a fenced block, an indented block, a code
// span, an ordinary link or an address is text, as marked reads it.
//
// Each link and tag is placed in the text by finding the source of each token in turn, the
// tokens of a block inside the block's own source, so the places are those of the text and not of
// what marked made of it. A place is a line and a character of it in UTF-16 units, the protocol's
// positions (data/prose/text-edits.ts).
//
// A link names a note of its own hub only, by decision 7 of the plan: by name without letter case,
// `[[folder/name]]` for a name two folders share, the shortest path first, then the first in path
// order. `resolveNote` answers that over the paths of one notes folder.

import {
    Marked,
    type Token,
    type TokenizerAndRendererExtension,
    type TokenizerThis,
    type Tokens
} from 'marked';
import { isMap, isScalar, isSeq, parseDocument, type Scalar } from 'yaml';
import { NOTE_SUFFIX, isNote, nameKey, noteTitle } from './note-names.ts';

/** A YAML front matter block at the head of a text, which the document route splits off too. */
export const FRONT_MATTER = /^---\r?\n[\s\S]*?\r?\n---(?:\r?\n|$)/;

/** The token types the three readings make. */
const WIKI_TOKEN = 'noteLink';
const TAG_TOKEN = 'noteTag';

/** A link or embed token as marked holds it: its source and what is between the brackets. */
export type WikiToken = Tokens.Generic & { type: 'noteLink'; embed: boolean; inner: string };

/** A tag token: its word without the `#`. */
export type TagToken = Tokens.Generic & { type: 'noteTag'; tag: string };

/** The parts of what is between a link's brackets. */
export type WikiParts = {
    /** The note's name or path, as written, trimmed. */
    name: string;
    /** The heading after `#`, trimmed, or the empty text for none. */
    heading: string;
    /** The text after `|`, or null for none. */
    shown: string | null;
};

/**
 * A link's parts: the shown text after the first `|` (or `\|`), the heading after the first `#`.
 */
export function wikiParts(inner: string): WikiParts {
    const bar = /\\?\|/.exec(inner);
    const target = bar === null ? inner : inner.slice(0, bar.index);
    const shown = bar === null ? null : inner.slice(bar.index + bar[0].length);
    const hash = target.indexOf('#');
    return {
        name: (hash < 0 ? target : target.slice(0, hash)).trim(),
        heading: hash < 0 ? '' : target.slice(hash + 1).trim(),
        shown
    };
}

/** A link's source: `[[`, the inside, `]]`, with `!` before an embed. */
const WIKI = /^(!?)\[\[([^[\]\n]+?)\]\]/;

/** A tag's characters, with Unicode letters and digits. */
const TAG = /^#([\p{L}\p{N}_\-/]+)/u;

/** Where a tag may start in a run of text: at its start or after a space. */
const TAG_START = /(^|\s)#[\p{L}\p{N}_\-/]/u;

/** The link and embed tokenizer, which note-render.ts gives a renderer. */
export function wikiTokenizer(): TokenizerAndRendererExtension {
    return {
        name: WIKI_TOKEN,
        level: 'inline',
        start(src: string) {
            const at = src.indexOf('[[');
            if (at < 0) return undefined;
            return at > 0 && src[at - 1] === '!' ? at - 1 : at;
        },
        tokenizer(src: string): WikiToken | undefined {
            const found = WIKI.exec(src);
            if (found === null) return undefined;
            return { type: WIKI_TOKEN, raw: found[0], embed: found[1] === '!', inner: found[2] };
        }
    };
}

/** A tag's word, or null when it is digits only. */
function tagWord(body: string): string | null {
    const word = body.replace(/\/+$/, '');
    return word === '' || /^\p{N}+$/u.test(word) ? null : word;
}

/**
 * The tag tokenizer: a `#word` at the start of a run of text or after a space, and never in the
 * text of a link, which marked reads with its `inLink` state set.
 */
export function tagTokenizer(): TokenizerAndRendererExtension {
    return {
        name: TAG_TOKEN,
        level: 'inline',
        start(src: string) {
            const found = TAG_START.exec(src);
            return found === null ? undefined : found.index + found[1].length;
        },
        tokenizer(this: TokenizerThis, src: string, tokens: Token[]): TagToken | undefined {
            if (this.lexer.state.inLink) return undefined;
            const before = tokens.at(-1);
            if (before !== undefined && !/\s$/.test(before.raw)) return undefined;
            const found = TAG.exec(src);
            const word = found === null ? null : tagWord(found[1]);
            if (found === null || word === null) return undefined;
            return { type: TAG_TOKEN, raw: `#${word}`, tag: word };
        }
    };
}

/** One link or embed of a note, placed in the text. */
export type NoteLink = WikiParts & {
    embed: boolean;
    /** The link's whole source. */
    raw: string;
    /** The line the link starts on, from zero. */
    line: number;
    /** The character the link starts at and the one after it, on its line. */
    start: number;
    end: number;
    /** The characters of the name inside the link, on its line, which a rename replaces. */
    nameStart: number;
    nameEnd: number;
};

/** One heading of a note: its level, its words and its line. */
type NoteHeading = { level: number; text: string; line: number };

/** One place a note carries a tag: the tag's words and its line, counted from zero. */
type NoteTag = { tag: string; line: number };

/** What a note holds: its links and embeds, its tags and its headings. */
export type NoteScan = {
    links: NoteLink[];
    /**
     * Every place a tag is written, the front matter's entries first and then the text's in order:
     * an entry of `tags:` at the line its words are on, a tag of the text at the line of its `#`.
     */
    tags: NoteTag[];
    headings: NoteHeading[];
    /** The text with its line ends as `\n`, which the offsets count in. */
    text: string;
};

/** The children of a token in the order of the source. */
function childrenOf(token: Token): Token[] {
    if (token.type === 'list') return (token as Tokens.List).items;
    if (token.type === 'table') {
        const table = token as Tokens.Table;
        return [
            ...table.header.flatMap((cell) => cell.tokens),
            ...table.rows.flatMap((row) => row.flatMap((cell) => cell.tokens))
        ];
    }
    return 'tokens' in token && Array.isArray(token.tokens) ? token.tokens : [];
}

/**
 * Call `visit` with each token and the offsets of its source in the text, within `from` and `to`.
 * A token whose source is not in the text as it stands (a table cell's `\|`, a list item's
 * continuation lines that lost their indent) is looked for with `\|` put back, and failing that
 * is not placed, and its children are looked for in its place.
 */
function place(
    tokens: Token[],
    text: string,
    from: number,
    to: number,
    visit: (token: Token, at: number, end: number) => void
): void {
    let cursor = from;
    for (const token of tokens) {
        const raw = token.raw;
        let at = raw === '' ? -1 : text.indexOf(raw, cursor);
        let length = raw.length;
        if (at < 0 || at + length > to) {
            const escaped = raw.replace(/\|/g, '\\|');
            at = escaped === raw ? -1 : text.indexOf(escaped, cursor);
            length = escaped.length;
        }
        if (at < 0 || at + length > to) {
            place(childrenOf(token), text, cursor, to, visit);
            continue;
        }
        visit(token, at, at + length);
        place(childrenOf(token), text, at, at + length, visit);
        cursor = at + length;
    }
}

/** The line an offset of a text is on, counted from zero. */
function lineAt(text: string, offset: number): number {
    let line = 0;
    for (let at = text.indexOf('\n'); at >= 0 && at < offset; at = text.indexOf('\n', at + 1)) {
        line += 1;
    }
    return line;
}

/**
 * The tags of a front matter block, each at its line: the entries of its `tags:` list, or the words
 * of a `tags:` text, which are split on spaces and commas. A block that does not read as YAML, or
 * whose `tags:` is neither, has none.
 */
function frontTags(block: string): NoteTag[] {
    const head = /^---\n/.exec(block)?.[0].length ?? 0;
    const body = block.slice(head).replace(/\n---(?:\n)?$/, '');
    const read = parseDocument(body);
    if (read.errors.length > 0 || !isMap(read.contents)) return [];
    const pair = read.contents.items.find((one) => isScalar(one.key) && one.key.value === 'tags');
    const value = pair?.value;
    const found: NoteTag[] = [];
    const add = (words: string, offset: number): void => {
        const tag = tagWord(words.trim().replace(/^#/, ''));
        if (tag !== null) found.push({ tag, line: lineAt(block, head + offset) });
    };
    const textOf = (node: unknown): node is Scalar<string> =>
        isScalar(node) && typeof node.value === 'string';
    if (isSeq(value)) {
        for (const item of value.items) {
            if (textOf(item)) add(item.value, item.range[0]);
        }
    } else if (textOf(value)) {
        const [from, to] = value.range;
        let cursor = from;
        for (const words of value.value.split(/[\s,]+/)) {
            if (words === '') continue;
            const at = body.slice(0, to).indexOf(words, cursor);
            add(words, at < 0 ? from : at);
            if (at >= 0) cursor = at + words.length;
        }
    }
    return found;
}

/** The line and character of an offset, over the starts of the lines. */
function positionOf(starts: number[], offset: number): { line: number; character: number } {
    let line = 0;
    while (line + 1 < starts.length && starts[line + 1] <= offset) line += 1;
    return { line, character: offset - starts[line] };
}

/** The offsets the lines of a `\n` text start at. */
function startsOf(text: string): number[] {
    const starts = [0];
    for (let at = text.indexOf('\n'); at >= 0; at = text.indexOf('\n', at + 1)) starts.push(at + 1);
    return starts;
}

/** The lexer that reads a note: marked's GFM rules with the link and tag tokenizers added. */
function noteLexer(): Marked {
    return new Marked({ gfm: true, extensions: [wikiTokenizer(), tagTokenizer()] });
}

/** Everything a note holds that its readers ask for, from one reading of its text. */
export function scanNote(source: string): NoteScan {
    const text = source.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
    const front = FRONT_MATTER.exec(text);
    const skip = front === null ? 0 : front[0].length;
    const starts = startsOf(text);
    const scan: NoteScan = { links: [], tags: [], headings: [], text };
    if (front !== null) scan.tags.push(...frontTags(front[0]));
    const tokens = noteLexer().lexer(text.slice(skip));
    place(tokens, text, skip, text.length, (token, at, end) => {
        if (token.type === TAG_TOKEN) {
            scan.tags.push({ tag: (token as TagToken).tag, line: positionOf(starts, at).line });
        } else if (token.type === 'heading') {
            const heading = token as Tokens.Heading;
            const line = positionOf(starts, at).line;
            scan.headings.push({ level: heading.depth, text: heading.text.trim(), line });
        } else if (token.type === WIKI_TOKEN) {
            const wiki = token as WikiToken;
            const begin = positionOf(starts, at);
            const open = at + (wiki.embed ? 3 : 2);
            const parts = wikiParts(wiki.inner);
            const lead = wiki.inner.length - wiki.inner.trimStart().length;
            scan.links.push({
                ...parts,
                embed: wiki.embed,
                raw: text.slice(at, end),
                line: begin.line,
                start: begin.character,
                end: begin.character + (end - at),
                nameStart: open + lead - starts[begin.line],
                nameEnd: open + lead + parts.name.length - starts[begin.line]
            });
        }
    });
    return scan;
}

/** The path of a file of a notes folder as a link names it: a note without `.md`. */
export function linkPath(path: string): string {
    return isNote(path) ? path.slice(0, -NOTE_SUFFIX.length) : path;
}

/** How many folders deep a path lies. */
function depthOf(path: string): number {
    return path.split('/').length;
}

/**
 * The file of a notes folder a link's name names, by decision 7, or null for none: the files whose
 * path without `.md`, or whose path, is the name or ends with `/` and the name, compared without
 * letter case and normalisation, the one with the fewest folders first and then the first by path.
 * A name that climbs (`..`) or starts at the top of the disk (`/`) names nothing.
 */
export function resolveNote(name: string, paths: readonly string[]): string | null {
    const wanted = nameKey(name.trim());
    if (wanted === '' || wanted.startsWith('/') || wanted.split('/').includes('..')) return null;
    const found = paths.filter((path) => {
        const keys = [nameKey(linkPath(path)), nameKey(path)];
        return keys.some((key) => key === wanted || key.endsWith(`/${wanted}`));
    });
    found.sort((left, right) => depthOf(left) - depthOf(right) || (left < right ? -1 : 1));
    return found.at(0) ?? null;
}

/** How many notes of a folder carry a name, without letter case. */
function sharing(paths: readonly string[], name: string): number {
    const key = nameKey(name);
    return paths.filter((path) => nameKey(noteTitle(path)) === key).length;
}

/** One file that moved inside a notes folder, a folder taking every file under it along. */
export type NoteMove = { from: string; to: string };

/** Where a path is after the moves: the first move that names it or a folder above it. */
export function movedPath(path: string, moves: readonly NoteMove[]): string {
    for (const move of moves) {
        if (path === move.from) return move.to;
        if (path.startsWith(`${move.from}/`)) return `${move.to}${path.slice(move.from.length)}`;
    }
    return path;
}

/** One edit of a link's name: the line, the characters of the name, and the new name. */
export type LinkEdit = {
    range: {
        start: { line: number; character: number };
        end: { line: number; character: number };
    };
    newText: string;
};

/**
 * The name a link takes after the moves, or null to leave it: a link to a note that moved takes
 * the note's new name while that name is the note's alone, and its path without `.md` when a name
 * is shared; a bare link to a note whose name the moves made shared takes the note's path, so no
 * bare link is left that two notes answer to; a link whose name still finds its note is left as
 * it is otherwise. A name written with `.md` keeps it.
 */
function renamed(
    link: NoteLink,
    before: readonly string[],
    after: readonly string[],
    moves: readonly NoteMove[],
    names: ReadonlySet<string>
): string | null {
    const target = resolveNote(link.name, before);
    if (target === null) return null;
    const now = movedPath(target, moves);
    const moved = now !== target;
    const title = noteTitle(now);
    if (!moved && !names.has(nameKey(noteTitle(target)))) return null;
    const bare = !link.name.includes('/');
    const shared = sharing(after, title) > 1;
    const finds = resolveNote(link.name, after) === now;
    let next: string;
    if (shared) next = bare || !finds ? linkPath(now) : link.name;
    else next = moved && (bare || !finds) ? noteTitle(now) : link.name;
    if (resolveNote(next, after) !== now) next = linkPath(now);
    if (nameKey(link.name).endsWith(NOTE_SUFFIX) && isNote(now) && next !== link.name)
        next = `${next}${NOTE_SUFFIX}`;
    return next === link.name ? null : next;
}

/**
 * The edits every link of the given notes takes when files of their notes folder move: `paths`
 * are every file of the folder before the moves, `texts` the notes whose links are read, by path
 * before the moves. Only the name of a link is edited, so its heading and its shown text stay; a
 * link to a note whose name is not among the moved notes' old and new names is left alone.
 */
export function noteMoveEdits(
    paths: readonly string[],
    moves: readonly NoteMove[],
    texts: ReadonlyMap<string, string>
): Map<string, LinkEdit[]> {
    const after = paths.map((path) => movedPath(path, moves));
    const names = new Set(
        paths
            .filter((path) => movedPath(path, moves) !== path)
            .flatMap((path) => [noteTitle(path), noteTitle(movedPath(path, moves))])
            .map(nameKey)
    );
    const edits = new Map<string, LinkEdit[]>();
    for (const [path, text] of texts) {
        const own: LinkEdit[] = [];
        for (const link of scanNote(text).links) {
            const next = renamed(link, paths, after, moves, names);
            if (next === null) continue;
            own.push({
                range: {
                    start: { line: link.line, character: link.nameStart },
                    end: { line: link.line, character: link.nameEnd }
                },
                newText: next
            });
        }
        if (own.length > 0) edits.set(path, own);
    }
    return edits;
}

/** The link under a place of a scanned note, or undefined for none. */
export function linkAt(scan: NoteScan, line: number, character: number): NoteLink | undefined {
    return scan.links.find(
        (link) => link.line === line && character >= link.start && character <= link.end
    );
}

/**
 * The lines of a note's section under a heading: from the heading's line up to the next heading of
 * its level or above, or null when the note has no heading of those words (compared without
 * letter case).
 */
export function sectionOf(scan: NoteScan, heading: string): string | null {
    const key = nameKey(heading);
    const at = scan.headings.findIndex((one) => nameKey(one.text) === key);
    if (at < 0) return null;
    const own = scan.headings[at];
    const next = scan.headings.slice(at + 1).find((one) => one.level <= own.level);
    const lines = scan.text.split('\n');
    return lines.slice(own.line, next === undefined ? lines.length : next.line).join('\n');
}
