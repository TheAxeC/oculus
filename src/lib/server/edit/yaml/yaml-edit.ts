// Layer 2, server. The surgical manifest edit: one field's bytes are replaced and no others.
//
// The manifests are hand-written YAML with comments, alignment and a style per file, so the file is
// never serialised whole: parseDocument gives every node its byte range in the source, and the edit
// rewrites the bytes of the one value, inserts one line for a key that is not there, or removes the
// lines of a key that is being cleared. Everything else is copied through untouched.
//
// The result is verified here, before anything reaches disk: the new text must parse, and parsed it
// must equal the old document with exactly the requested fields applied. When it does not, the
// source comes back unchanged with every field refused, so a bad edit is a refusal rather than a
// damaged manifest.
//
// A field that is cleared leaves its lines behind in the answer: setFields reports the characters
// each clear removed, the index they stood at in the text the write left and the rest of that line,
// and insertRemoved (writes/restore.ts) puts them back at the place of that line which keeps the
// document what the earlier value says it was, under the same check. For whole lines, when no place
// of that line passes, every other line start is tried, nearest first; text taken from inside a
// line tries only the places of that line. That is how an undo gives a cleared field back as it was
// written, comments, quoting and block style included.
//
// A bare follow-up note or a list of one note that is written as the map it stands for keeps its
// comments: one after the parent key stays on that line, one on a line of its own stays above the
// key that follows it, and one after a value stays after that value. A comment inside a value
// cannot go with it, and refuses the write. The text those lines replace is reported per field as
// `replaced`, and insertReplaced (../writes/restore.ts) writes it back while the file still holds
// those lines.
//
// The values a write may carry and how they are written as text are yaml-values.ts, and where a
// node stands in its text is data/helpers/files/yaml/yaml-ranges.ts.
//
// Nothing is thrown. A path this cannot write is a refusal with a reason, which is what the write
// route hands back to the page.
//
// A parsed value is taken for a map by data/helpers/guards.ts's `isMap`, and the yaml library's own
// node test is imported as `isYamlMap`.

import { isDeepStrictEqual } from 'node:util';
import { Parser, isMap as isYamlMap, isScalar, isSeq, parseDocument } from 'yaml';
import type { Node, Pair, Scalar, YAMLMap } from 'yaml';
import { z } from 'zod';
import { byKey, isMap } from '../../../data/helpers/guards.ts';
import type { RemovedText, ReplacedText } from '../../core/changes.ts';
import { unchanged } from '../../../data/shapes/shapes.ts';
import {
    isBlockMap,
    isMetalist,
    itemStyles,
    renderBlock,
    renderBlockMap,
    renderFlow,
    renderMetalist
} from './yaml-values.ts';
import type { BlockMap, FieldValue, FlatStringMap } from './yaml-values.ts';
import { renderScalar } from '../../../data/helpers/files/yaml/collection-text.ts';
import {
    DEFAULT_INDENT,
    columnOf,
    lineEndAfter,
    lineStart,
    mapIndent,
    pairEnd,
    pairOf,
    rangeOf,
    valueEnd
} from '../../../data/helpers/files/yaml/yaml-ranges.ts';

/** The reason a value is none of the shapes a write may carry. */
export const NOT_A_FIELD_VALUE =
    'not a string, number, boolean, list of strings, metalist, map of scalars, lists and maps, or null';

/** One field that was not written, and why. */
export type Refusal = { field: string; reason: string };

export type EditResult = {
    /** The new text, or the source unchanged when nothing was written. */
    text: string;
    /** The fields whose bytes changed, in the order they were given. */
    changed: string[];
    refused: Refusal[];
};

/**
 * What `setFields` answers: an `EditResult`, for each changed field whose edit took text out and
 * put none in the text it took out (`removed`), and for each field whose edit wrote a bare note or
 * a list of one note as a map the text it replaced (`replaced`), when the rest of the write left it
 * in the file as it wrote it. A field that was replaced or added has no entry in `removed`, and
 * nothing is reported when the write is refused.
 */
export type SetFieldsResult = EditResult & {
    removed: Record<string, RemovedText>;
    replaced: Record<string, ReplacedText>;
};

/**
 * Fields no write ever touches. `id` and `tier` are the folder's, not the form's, and `type` is the
 * tier's on a flat scan rule; data/sources/manifests.ts derives all three from where the folder
 * sits, so writing them here would put the file at odds with its own location.
 */
export const READ_ONLY = ['id', 'tier', 'type'];

/** The lists the tree writes in the block style; every other list is written flow. */
export const BLOCK_LISTS = ['results', 'ideas'];

/**
 * The one dual-shape field of the tree: `followup` is a map of `do` and `after` on two manifests
 * and a bare note on one, where the note means `do`; a list of exactly one note holds either.
 * Setting a key under a scalar or a one-note list would drop that note, so it is expanded into the
 * map it stands for and the new value written into that. A scalar parent this map does not name is
 * refused, since nothing says what its value is short for, and a list of two or more notes is
 * refused, since the two keys address one note.
 */
const SHORTHAND: Record<string, string> = { followup: 'do' };

/**
 * The map a dual-shape parent's value stands for: a map as it is, a bare note as its `do`, and a
 * list of one note as that note's map. Undefined for any other value, a list of two or more
 * included, and for a parent the tree gives no shorthand.
 */
export function noteMapOf(parent: string, held: unknown): Record<string, unknown> | undefined {
    const shorthand = byKey(SHORTHAND, parent);
    if (shorthand === undefined) return undefined;
    if (isMap(held)) return held;
    if (typeof held === 'string') return { [shorthand]: held };
    if (Array.isArray(held) && held.length === 1) return noteMapOf(parent, held[0]);
    return undefined;
}

type Parsed = Record<string, unknown>;

/**
 * One splice of a text: the span `from` to `to` of the old text was replaced by `length`
 * characters. A span with nothing put in its place is a removal.
 */
type Splice = { from: number; to: number; length: number };

/**
 * Either the new text with the splice that made it, or the reason there is none; every edit step
 * answers with one of the two. A bare note or a list of one note written as a map also answers the
 * text its lines replace, as `replaced`.
 */
type Written = { text: string; splice: Splice; replaced?: string } | { reason: string };

/** One edit that was made, kept so the verification can apply it to the parsed source. */
type Applied = { path: string[]; value: FieldValue };

function fail(reason: string): Written {
    return { reason };
}

/** The document as plain values, or null when it does not parse or is not a map of keys. */
export function safeParse(text: string): Parsed | null {
    let parsed: unknown;
    try {
        const doc = parseDocument(text);
        if (doc.errors.length > 0) return null;
        parsed = doc.toJS();
    } catch {
        return null;
    }
    return isMap(parsed) ? parsed : null;
}

/** The dotted name split into its segments, or null when it is not a name this can write. */
export function pathOf(field: string): string[] | null {
    const parts = field.split('.');
    if (parts.length > 2) return null;
    if (parts.some((part) => part === '')) return null;
    return parts;
}

/** The value a path holds in a parsed document, or undefined when nothing is there. */
function currentValue(data: Parsed, path: string[]): unknown {
    const top = data[path[0]];
    if (path.length === 1) return top;
    return (noteMapOf(path[0], top) ?? (isMap(top) ? top : undefined))?.[path[1]];
}

/** Whether a value is the one the manifest already holds; absent and null are one thing. */
export function sameValue(next: unknown, current: unknown): boolean {
    if (next === null || next === undefined) return current === null || current === undefined;
    return isDeepStrictEqual(next, current);
}

/** One row of a metalist, tested as given: a map whose values are all strings. */
const metalistRowShape = z.custom<FlatStringMap>(
    (row) => isMap(row) && Object.values(row).every((value) => typeof value === 'string')
);

/**
 * The shapes a write may carry, tried in this order: null, text, a boolean, a finite number, a list
 * of strings, a list of metalist rows, and a block map, which is any map whose values are block
 * values, a `Date` and a `Map` included. A list and a map are answered as given.
 */
const fieldValueShape = z.union([
    z.null(),
    z.string(),
    z.boolean(),
    z.number(),
    unchanged(z.array(z.string())),
    unchanged(z.array(metalistRowShape)),
    z.custom<BlockMap>(isBlockMap)
]) satisfies z.ZodType<FieldValue>;

/** The value as one of the shapes a write may carry, or undefined when it is none of them. */
export function asFieldValue(raw: unknown): FieldValue | undefined {
    const parsed = fieldValueShape.safeParse(raw);
    return parsed.success ? parsed.data : undefined;
}

/** Replace a slice of the text. */
export function splice(text: string, from: number, to: number, insert: string): string {
    return text.slice(0, from) + insert + text.slice(to);
}

/** A slice of the text replaced, with the splice that was made. */
function spliced(text: string, from: number, to: number, insert: string): Written {
    return { text: splice(text, from, to, insert), splice: { from, to, length: insert.length } };
}

/**
 * Write a value over the bytes of an existing one. A list keeps the style the file has it in: a
 * flow list stays flow and a block list stays block, at its own indentation. An empty value
 * (`venue_id:` with nothing after it) is a zero-width range, so the rendering is inserted there and
 * given the space the colon has not got. `style` is the quoting a string is written in when the
 * caller knows the node's own would not read back, as a plain string inside a flow map.
 */
export function replaceValue(
    text: string,
    node: Node,
    value: Exclude<FieldValue, null>,
    style?: string
): Written {
    const range = rangeOf(node);
    if (range === null) return fail('the value has no place in the file');
    const start = range[0];
    const end = valueEnd(node);
    const block = Array.isArray(value) && isSeq(node) && node.flow !== true && value.length > 0;
    let rendered: string;
    if (isBlockMap(value)) {
        const block = isYamlMap(node) && node.flow !== true;
        const indent = block
            ? columnOf(text, start)
            : text.slice(lineStart(text, start), start).length -
              text.slice(lineStart(text, start), start).trimStart().length +
              DEFAULT_INDENT;
        rendered = `${block ? '' : `\n${' '.repeat(indent)}`}${renderBlockMap(value, indent)}`;
    } else if (isMetalist(value)) {
        rendered = renderMetalist(value, columnOf(text, start));
    } else if (Array.isArray(value)) {
        const styles = itemStyles(node);
        rendered = block
            ? renderBlock(value, columnOf(text, start), styles)
            : renderFlow(value, styles);
        if (value.length === 0) rendered = '[]';
    } else {
        rendered = renderScalar(value, style ?? (isScalar(node) ? node.type : undefined));
        if (rendered.includes('\n')) return fail('the value does not fit on one line');
    }
    if (start === end && text[start - 1] !== ' ' && text[start - 1] !== '\n') {
        rendered = ` ${rendered}`;
    }
    return spliced(text, start, end, rendered);
}

/** Remove the whole lines a pair occupies, its trailing comment with them. */
function removePair(text: string, pair: Pair<Scalar, Node>): Written {
    const key = rangeOf(pair.key);
    const end = pairEnd(pair);
    if (key === null || end === null) return fail('the key has no place in the file');
    const to = Math.min(text.length, lineEndAfter(text, end) + 1);
    return spliced(text, lineStart(text, key[0]), to, '');
}

/** Remove one key of a flow map, with the comma that joined it to its neighbour. */
function removeFlowChild(text: string, map: YAMLMap, index: number): Written {
    const items = map.items as Pair<Scalar, Node>[];
    const own = rangeOf(items[index].key);
    const ownEnd = pairEnd(items[index]);
    if (own === null || ownEnd === null) return fail('the key has no place in the file');
    if (index > 0) {
        const from = pairEnd(items[index - 1]);
        if (from === null) return fail('the key has no place in the file');
        return spliced(text, from, ownEnd, '');
    }
    const next = rangeOf(items[index + 1].key);
    if (next === null) return fail('the key has no place in the file');
    return spliced(text, own[0], next[0], '');
}

/** Add one key to a flow map, after its last key, keeping the padding the file writes. */
function insertFlowChild(
    text: string,
    map: YAMLMap,
    name: string,
    value: Exclude<FieldValue, null>
): Written {
    const rendered = renderOneLine(value);
    if (rendered === null) return fail('the value does not fit on one line');
    const items = map.items as Pair<Scalar, Node>[];
    if (items.length === 0) {
        const range = rangeOf(map);
        if (range === null) return fail('the map has no place in the file');
        return spliced(text, range[0], range[1], `{ ${name}: ${rendered} }`);
    }
    const at = pairEnd(items[items.length - 1]);
    if (at === null) return fail('the map has no place in the file');
    return spliced(text, at, at, `, ${name}: ${rendered}`);
}

/** Add one key to a block map, on a new line at the map's own indentation. */
function insertBlockChild(
    text: string,
    map: YAMLMap,
    name: string,
    value: Exclude<FieldValue, null>
): Written {
    const range = rangeOf(map);
    if (range === null || map.items.length === 0) return fail('the map has no place in the file');
    const rendered = renderOneLine(value);
    if (rendered === null) return fail('the value does not fit on one line');
    const indent = ' '.repeat(columnOf(text, range[0]));
    const at = lineEndAfter(text, valueEnd(map));
    return spliced(text, at, at, `\n${indent}${name}: ${rendered}`);
}

/** A value as it is written after `key:` on one line, or null when it cannot be. */
function renderOneLine(value: Exclude<FieldValue, null>): string | null {
    if (isMetalist(value) || isBlockMap(value)) return null;
    const rendered = Array.isArray(value) ? renderFlow(value) : renderScalar(value);
    return rendered.includes('\n') ? null : rendered;
}

/** Insert one already-rendered block of lines after the last top-level key. */
function appendLines(text: string, root: YAMLMap, lines: string): Written {
    if (root.items.length === 0) {
        const lead = text.length === 0 || text.endsWith('\n') ? '' : '\n';
        return spliced(text, text.length, text.length, `${lead}${lines}\n`);
    }
    const end = pairEnd(root.items[root.items.length - 1] as Pair<Scalar, Node>);
    if (end === null) return fail('the file has no last key to write after');
    const at = lineEndAfter(text, end);
    return spliced(text, at, at, `\n${lines}`);
}

/** Add one top-level key: on the key's own line, or as a block list under it. */
function appendTop(
    text: string,
    root: YAMLMap,
    name: string,
    value: Exclude<FieldValue, null>
): Written {
    const indent = mapIndent(root, text);
    if (isBlockMap(value)) {
        const pad = ' '.repeat(indent);
        return appendLines(text, root, `${name}:\n${pad}${renderBlockMap(value, indent)}`);
    }
    if (isMetalist(value)) {
        const pad = ' '.repeat(indent);
        return appendLines(text, root, `${name}:\n${pad}${renderMetalist(value, indent)}`);
    }
    if (Array.isArray(value) && value.length > 0 && BLOCK_LISTS.includes(name)) {
        // Every `results` and `ideas` item on the tree is a double-quoted string, so a list written
        // where there was none is written the way the ones beside it are.
        const pad = ' '.repeat(indent);
        const items = renderBlock(value, indent, ['QUOTE_DOUBLE']);
        return appendLines(text, root, `${name}:\n${pad}${items}`);
    }
    const rendered = renderOneLine(value);
    if (rendered === null) return fail('the value does not fit on one line');
    return appendLines(text, root, `${name}: ${rendered}`);
}

/** One key of a note being rewritten as a map, with the comments that stood with it. */
type NoteEntry = {
    name: string;
    text: string;
    /** Where its value stood in the source, or null for a key the rewrite adds. */
    at: { key: number; from: number; to: number } | null;
    /** Comment lines that stood above it. */
    above: string[];
    /** The comment that followed its value on the same line, with the spaces before it. */
    inline: string;
    cleared: boolean;
};

/** One comment of the source: where it begins and its text, the `#` included. */
type Comment = { offset: number; source: string };

/** The comments of the source that begin in `from` up to `to`, in the order they stand. */
function commentsIn(text: string, from: number, to: number): Comment[] {
    const found: Comment[] = [];
    const visit = (token: unknown): void => {
        if (Array.isArray(token)) {
            for (const one of token) visit(one);
        } else if (isMap(token)) {
            const { type, offset, source } = token;
            if (type === 'comment' && typeof offset === 'number' && typeof source === 'string') {
                if (offset >= from && offset < to) found.push({ offset, source });
            } else {
                for (const value of Object.values(token)) visit(value);
            }
        }
    };
    visit([...new Parser().parse(text)]);
    return found.sort((one, other) => one.offset - other.offset);
}

/**
 * Hand each comment to the key it belongs with: one that follows a value on its line stays after
 * that value, one on the line of the parent key stays there (the returned text), and one on a line
 * of its own goes above the key that follows it. A comment that follows no key goes last.
 */
function placeComments(
    text: string,
    keyLine: number,
    comments: Comment[],
    entries: NoteEntry[]
): { keyComment: string; last: string[] } {
    let keyComment = '';
    const last: string[] = [];
    for (const { offset, source } of comments) {
        const before = text.slice(lineStart(text, offset), offset);
        const gap = /[ \t]*$/.exec(before)?.[0] ?? '';
        const own = before.trim() === '';
        const same = entries.filter(
            (one) =>
                one.at !== null &&
                one.at.to <= offset &&
                !text.slice(one.at.to, offset).includes('\n')
        );
        if (!own && same.length > 0) {
            same[same.length - 1].inline = `${gap}${source}`;
        } else if (!own && lineStart(text, offset) === keyLine) {
            keyComment = `${gap}${source}`;
        } else {
            const next = entries.find((one) => one.at !== null && one.at.key > offset);
            if (next === undefined) last.push(source);
            else next.above.push(source);
        }
    }
    return { keyComment, last };
}

/**
 * A bare note or a list of one note written as the map it stands for, with one key set or cleared.
 * The text of every key the note already holds is copied as it stands, in its order, so the note
 * keeps its quoting and its comments; a key that is not there is added after them. A comment that
 * stands inside a value cannot go with it, and refuses the write. `end` is where the note's value
 * ends; a comment after it on that line goes with the last key. The text the lines replace is
 * handed back as `replaced`, so an undo can put the file's own shape back.
 */
function expandNote(
    text: string,
    one: {
        parent: string;
        top: Pair<Scalar, Node>;
        pad: string;
        entries: NoteEntry[];
        end: number;
    },
    child: string,
    value: FieldValue
): Written {
    const { parent, top, pad, entries } = one;
    const key = rangeOf(top.key);
    if (key === null) return fail('the key has no place in the file');
    const rest = text.indexOf('\n', one.end);
    const limit = rest < 0 ? text.length : rest;
    const comments = commentsIn(text, key[1], limit);
    for (const { offset } of comments) {
        if (
            entries.some(
                (entry) => entry.at !== null && offset >= entry.at.from && offset < entry.at.to
            )
        ) {
            return fail('a comment inside the value cannot be kept; edit the file by hand');
        }
    }
    const { keyComment, last } = placeComments(text, lineStart(text, key[0]), comments, entries);
    const end = Math.max(
        one.end,
        ...comments.filter((c) => c.offset >= one.end).map((c) => c.offset + c.source.length)
    );

    const at = entries.findIndex((entry) => entry.name === child);
    if (value === null) {
        if (at < 0) return fail('the key is not there');
        entries[at].cleared = true;
    } else {
        const rendered = renderOneLine(value);
        if (rendered === null) return fail('the value does not fit on one line');
        if (at < 0) {
            entries.push({
                name: child,
                text: rendered,
                at: null,
                above: [],
                inline: '',
                cleared: false
            });
        } else {
            entries[at].text = rendered;
        }
    }
    if (entries.every((entry) => entry.cleared)) return removePair(text, top);
    const lines = [`${parent}:${keyComment}`];
    for (const entry of entries) {
        lines.push(...entry.above.map((source) => `${pad}${source}`));
        if (!entry.cleared) lines.push(`${pad}${entry.name}: ${entry.text}${entry.inline}`);
        else if (entry.inline !== '') lines.push(`${pad}${entry.inline.trimStart()}`);
    }
    lines.push(...last.map((source) => `${pad}${source}`));
    const from = lineStart(text, key[0]);
    return { ...spliced(text, from, end, lines.join('\n')), replaced: text.slice(from, end) };
}

/**
 * The keys of a note held as a bare string (`bare`) or as the one item of a list, with the span of
 * each value. A bare string that is not text holds no note. A list item that holds anything but
 * scalars is refused, since the two keys of the schema do not describe it.
 */
function noteEntries(
    text: string,
    parent: string,
    item: Node | null,
    bare: boolean
): { entries: NoteEntry[] } | { reason: string } {
    const entry = (
        name: string,
        body: string,
        node: Node | null,
        pair?: Pair<Scalar, Node>
    ): NoteEntry | null => {
        const range = rangeOf(node);
        const keyAt = rangeOf(pair?.key ?? node)?.[0];
        if (range === null || keyAt === undefined) return null;
        const at = { key: keyAt, from: range[0], to: range[1] };
        return { name, text: body, at, above: [], inline: '', cleared: false };
    };
    if (isScalar(item)) {
        if (bare && item.value === null) return { entries: [] };
        if (typeof item.value !== 'string') {
            return {
                reason: bare
                    ? 'the note is not text; edit the file by hand'
                    : 'followup is not a map'
            };
        }
        const only = entry(SHORTHAND[parent], renderScalar(item.value, item.type), item);
        return only === null ? { reason: 'the key has no place in the file' } : { entries: [only] };
    }
    if (!isYamlMap(item)) return { reason: 'followup is not a map' };
    const entries: NoteEntry[] = [];
    for (const pair of item.items as Pair<Scalar, Node>[]) {
        const name = pair.key.value;
        const range = pair.value === null ? null : rangeOf(pair.value);
        if (typeof name !== 'string' || range === null || !isScalar(pair.value)) {
            return { reason: 'followup is not a map' };
        }
        const made = entry(name, text.slice(range[0], range[1]), pair.value, pair);
        if (made === null) return { reason: 'followup is not a map' };
        entries.push(made);
    }
    return { entries };
}

/**
 * One field written into the text, or the reason it was not. Every case of the write rule is here:
 * an existing scalar, an existing list in its own style, a nested key, a key that is not there, a
 * map that is not there, and a clear.
 */
function applyOne(text: string, path: string[], value: FieldValue): Written {
    const doc = parseDocument(text);
    if (doc.errors.length > 0) return fail('the manifest does not parse');
    const root = doc.contents;
    if (root === null || !isYamlMap(root)) return fail('the manifest is not a map of keys');

    const top = pairOf(root, path[0]);

    if (path.length === 1) {
        if (value === null) {
            return top === undefined ? fail('the key is not there') : removePair(text, top);
        }
        if (top === undefined) return appendTop(text, root, path[0], value);
        if (top.value === null) return fail('the key has no value node');
        return replaceValue(text, top.value, value);
    }

    const [parent, child] = path;
    const indent = mapIndent(root, text);
    const pad = ' '.repeat(indent);

    if (top === undefined) {
        if (value === null) return fail('the key is not there');
        const rendered = renderOneLine(value);
        if (rendered === null) return fail('the value does not fit on one line');
        return appendLines(text, root, `${parent}:\n${pad}${child}: ${rendered}`);
    }
    const holder = top.value;
    if (holder === null) return fail('the key has no value node');

    if (isYamlMap(holder)) {
        const pair = pairOf(holder, child);
        if (value === null) {
            if (pair === undefined) return fail('the key is not there');
            // A map with nothing left in it is not a map, so the parent goes with its last key
            // rather than being left behind as an empty one.
            if (holder.items.length === 1) return removePair(text, top);
            if (holder.flow === true) {
                return removeFlowChild(text, holder, holder.items.indexOf(pair));
            }
            return removePair(text, pair);
        }
        if (pair === undefined) {
            return holder.flow === true
                ? insertFlowChild(text, holder, child, value)
                : insertBlockChild(text, holder, child, value);
        }
        if (pair.value === null) return fail('the key has no value node');
        return replaceValue(text, pair.value, value);
    }

    const shorthand = byKey(SHORTHAND, parent);
    if (isSeq(holder) && holder.items.length === 1 && shorthand !== undefined) {
        const item = holder.items[0] as Node | null;
        const held = noteEntries(text, parent, item, false);
        if ('reason' in held) return fail(held.reason);
        const last = holder.flow === true ? holder : item;
        const end = last === null ? undefined : valueEnd(last);
        if (end === undefined) return fail('the key has no place in the file');
        return expandNote(text, { parent, top, pad, entries: held.entries, end }, child, value);
    }

    // A scalar where a map is asked for: the dual shape of `followup`, expanded so its note is
    // kept.
    if (!isScalar(holder) || shorthand === undefined) return fail(`${parent} is not a map`);
    if (value === null) return fail('the key is not there');
    const held = noteEntries(text, parent, holder, true);
    if ('reason' in held) return fail(held.reason);
    const one = { parent, top, pad, entries: held.entries, end: valueEnd(holder) };
    return expandNote(text, one, child, value);
}

/**
 * The parsed document with each dual-shape parent written as the map it stands for, so a bare note,
 * a map and a list of one note compare as the one note they hold.
 */
export function normalised(data: Parsed): Parsed {
    const out: Parsed = { ...data };
    for (const parent of Object.keys(SHORTHAND)) {
        const note = noteMapOf(parent, out[parent]);
        if (note !== undefined) out[parent] = note;
    }
    return out;
}

/** The parsed document with one path set or cleared, which is what the new text must equal. */
export function expect(data: Parsed, path: string[], value: FieldValue): void {
    if (path.length === 1) {
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete -- a Map here would change the shape every reader of this record depends on
        if (value === null) delete data[path[0]];
        else data[path[0]] = value;
        return;
    }
    const [parent, child] = path;
    const held = data[parent];
    if (value === null) {
        const note = isMap(held) ? held : noteMapOf(parent, held);
        if (note === undefined) return;
        const rest = { ...note };
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete -- a Map here would change the shape every reader of this record depends on
        delete rest[child];
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete -- a Map here would change the shape every reader of this record depends on
        if (Object.keys(rest).length === 0) delete data[parent];
        else data[parent] = rest;
        return;
    }
    if (isMap(held)) {
        held[child] = value;
        return;
    }
    data[parent] = { ...noteMapOf(parent, held), [child]: value };
}

/**
 * One top-level key written under another name, in the bytes of the key itself.
 *
 * Only the key token is replaced, so the value, the comment on the line, the position of the key
 * among its neighbours and every other byte of the file are the ones the file already had. A file
 * that does not hold the old key is not a change and is not a refusal. A file that already holds
 * the new key is refused, since the rename would put two keys of one name in one map.
 *
 * The result is verified the way setFields verifies its own: the new text must parse to the old
 * document with the one key moved, and anything else comes back as the source unchanged.
 */
export function renameKey(source: string, from: string, to: string): EditResult {
    const refusal = (reason: string): EditResult => ({
        text: source,
        changed: [],
        refused: [{ field: from, reason }]
    });
    const doc = parseDocument(source);
    if (doc.errors.length > 0) return refusal('the manifest does not parse');
    const root = doc.contents;
    if (root === null || !isYamlMap(root)) return refusal('the manifest is not a map of keys');
    const pair = pairOf(root, from);
    if (pair === undefined) return { text: source, changed: [], refused: [] };
    if (pairOf(root, to) !== undefined) return refusal(`${to} is already a key of the manifest`);
    const range = rangeOf(pair.key);
    if (range === null) return refusal('the key has no place in the file');

    const text = splice(source, range[0], range[1], renderScalar(to, pair.key.type));
    const after = safeParse(text);
    const wanted = safeParse(source);
    if (after === null || wanted === null)
        return refusal('the edit did not verify; nothing was written');
    wanted[to] = wanted[from];
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete -- a Map here would change the shape every reader of this record depends on
    delete wanted[from];
    if (!isDeepStrictEqual(after, wanted))
        return refusal('the edit did not verify; nothing was written');
    return { text, changed: [from], refused: [] };
}

/**
 * Where the point at which a field's lines were removed stands after a later splice of the same
 * write: a splice that ends at or before the point moves it by the change in length, one whose span
 * holds the point moves it to the span's start, and one after it leaves it.
 */
function moved(point: number, cut: Splice): number {
    if (cut.to <= point) return point + cut.length - (cut.to - cut.from);
    return cut.from < point ? cut.from : point;
}

/**
 * Where the span a field's note was rewritten into stands after a later splice of the same write:
 * moved by the change in length when the splice lies wholly before it, as it was when the splice
 * lies wholly after it, and dropped when the splice touches it, since the file no longer holds the
 * lines as this field's edit left them.
 */
function keptSpan(span: ReplacedText, cut: Splice): ReplacedText | null {
    if (cut.to < span.offset) {
        return { ...span, offset: span.offset + cut.length - (cut.to - cut.from) };
    }
    return cut.from > span.offset + span.after.length ? span : null;
}

/** The text of a file from an index to the end of its line, the line break not included. */
export function lineFrom(text: string, at: number): string {
    const end = text.indexOf('\n', at);
    return text.slice(at, end < 0 ? text.length : end);
}

/** The path of a field a write may set, or the reason it may not. */
export function settable(field: string): { path: string[] } | { reason: string } {
    const path = pathOf(field);
    if (path === null) return { reason: 'not a field name' };
    if (READ_ONLY.includes(path[0])) {
        return { reason: `${path[0]} is set by the folder, never by a write` };
    }
    return { path };
}

/**
 * Set every field of a manifest's text, each in the bytes of its own value.
 *
 * A field whose value the manifest already holds is not a change and is not written. A field this
 * cannot write is refused with a reason and nothing else is affected by it. When the result fails
 * to parse, or parses to anything but the source with exactly these fields applied, nothing is
 * written at all: the source comes back with every field refused.
 *
 * The text each clear removed is taken where the splice is made, and its index is carried through
 * the edits that follow it in the same write, so `removed` names the place in the text that is
 * answered.
 */
export function setFields(source: string, fields: Record<string, unknown>): SetFieldsResult {
    const changed: string[] = [];
    const refused: Refusal[] = [];
    const applied: Applied[] = [];
    const points = new Map<string, { offset: number; text: string }>();
    const spans = new Map<string, ReplacedText>();

    const base = safeParse(source);
    if (base === null) {
        for (const field of Object.keys(fields)) {
            refused.push({ field, reason: 'the manifest does not parse' });
        }
        return { text: source, changed, refused, removed: {}, replaced: {} };
    }

    let text = source;
    for (const [field, raw] of Object.entries(fields)) {
        const allowed = settable(field);
        if ('reason' in allowed) {
            refused.push({ field, reason: allowed.reason });
            continue;
        }
        const { path } = allowed;
        const parsed = asFieldValue(raw);
        if (parsed === undefined) {
            refused.push({ field, reason: NOT_A_FIELD_VALUE });
            continue;
        }
        const current = currentValue(base, path);
        const value =
            Array.isArray(parsed) &&
            parsed.length === 0 &&
            Array.isArray(current) &&
            current.some(isMap)
                ? null
                : isBlockMap(parsed) && Object.keys(parsed).length === 0
                  ? null
                  : parsed;
        if (sameValue(value, current)) continue;
        const out = applyOne(text, path, value);
        if ('reason' in out) {
            refused.push({ field, reason: out.reason });
            continue;
        }
        for (const point of points.values()) point.offset = moved(point.offset, out.splice);
        for (const [name, span] of spans) {
            const kept = keptSpan(span, out.splice);
            if (kept === null) spans.delete(name);
            else spans.set(name, kept);
        }
        const { from, to, length } = out.splice;
        if (out.replaced !== undefined) {
            spans.set(field, {
                offset: from,
                before: out.replaced,
                after: out.text.slice(from, from + length)
            });
        }
        if (length === 0 && to > from)
            points.set(field, { offset: from, text: text.slice(from, to) });
        text = out.text;
        changed.push(field);
        applied.push({ path, value });
    }

    if (changed.length === 0) return { text: source, changed, refused, removed: {}, replaced: {} };

    const after = safeParse(text);
    const wanted = safeParse(source);
    if (after !== null && wanted !== null) {
        for (const one of applied) expect(wanted, one.path, one.value);
        if (isDeepStrictEqual(after, wanted)) {
            const removed = Object.fromEntries(
                [...points].map(([field, point]) => [
                    field,
                    { ...point, next: lineFrom(text, point.offset) }
                ])
            );
            return { text, changed, refused, removed, replaced: Object.fromEntries(spans) };
        }
    }
    return {
        text: source,
        changed: [],
        refused: Object.keys(fields).map((field) => ({
            field,
            reason: 'the edit did not verify; nothing was written'
        })),
        removed: {},
        replaced: {}
    };
}
