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
// The values a write may carry and how they are written as text are yaml-values.ts, and where a
// node stands in its text is data/helpers/files/yaml/yaml-ranges.ts.
//
// Nothing is thrown. A path this cannot write is a refusal with a reason, which is what the write
// route hands back to the page.
//
// A parsed value is taken for a map by data/helpers/guards.ts's `isMap`, and the yaml library's own
// node test is imported as `isYamlMap`.

import { isDeepStrictEqual } from 'node:util';
import { isMap as isYamlMap, isScalar, isSeq, parseDocument } from 'yaml';
import type { Node, Pair, Scalar, YAMLMap } from 'yaml';
import { z } from 'zod';
import { isMap } from '../../../../data/helpers/guards.ts';
import type { RemovedText } from '../../changes.ts';
import { unchanged } from '../../../../data/shapes/shapes.ts';
import {
    isBlockMap,
    isBlockScalar,
    isMetalist,
    itemStyles,
    renderBlock,
    renderBlockMap,
    renderFlow,
    renderMetalist
} from './yaml-values.ts';
import type { BlockMap, FieldValue, ScalarMap } from './yaml-values.ts';
import { renderScalar } from '../../../../data/helpers/files/yaml/collection-text.ts';
import { REFUSALS, said, why } from './why.ts';
import type { Why } from './why.ts';
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
} from '../../../../data/helpers/files/yaml/yaml-ranges.ts';

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
 * What `setFields` answers: an `EditResult`, and for each changed field whose edit took text out
 * and put none in the text it took out (`removed`). A field that was replaced or added has no entry
 * in `removed`, and nothing is reported when the write is refused.
 */
export type SetFieldsResult = EditResult & { removed: Record<string, RemovedText> };

/** The lists the tree writes in the block style; every other list is written flow. */
export const BLOCK_LISTS = ['results', 'ideas'];

type Parsed = Record<string, unknown>;

/**
 * One splice of a text: the span `from` to `to` of the old text was replaced by `length`
 * characters. A span with nothing put in its place is a removal.
 */
type Splice = { from: number; to: number; length: number };

/**
 * Either the new text with the splice that made it, or the reason there is none; every edit step
 * answers with one of the two.
 */
export type Written = { text: string; splice: Splice } | { why: Why };

/** One edit that was made, kept so the verification can apply it to the parsed source. */
type Applied = { path: string[]; value: FieldValue };

function fail(key: string, ...args: (string | number)[]): Written {
    return { why: why(key, ...args) };
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
    return isMap(top) ? top[path[1]] : undefined;
}

/** Whether a value is the one the manifest already holds; absent and null are one thing. */
export function sameValue(next: unknown, current: unknown): boolean {
    if (next === null || next === undefined) return current === null || current === undefined;
    return isDeepStrictEqual(next, current);
}

/** One row of a metalist, tested as given: a map whose values are all scalars. */
const metalistRowShape = z.custom<ScalarMap>(
    (row) => isMap(row) && Object.values(row).every(isBlockScalar)
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
 * (`venue:` with nothing after it) is a zero-width range, so the rendering is inserted there and
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
    if (range === null) return fail(REFUSALS.valueNoPlace);
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
        if (rendered.includes('\n')) return fail(REFUSALS.valueOneLine);
    }
    if (start === end && text[start - 1] !== ' ' && text[start - 1] !== '\n') {
        rendered = ` ${rendered}`;
    }
    return spliced(text, start, end, rendered);
}

/** Remove the whole lines a pair occupies, its trailing comment with them. */
export function removePair(text: string, pair: Pair<Scalar, Node>): Written {
    const key = rangeOf(pair.key);
    const end = pairEnd(pair);
    if (key === null || end === null) return fail(REFUSALS.keyNoPlace);
    const to = Math.min(text.length, lineEndAfter(text, end) + 1);
    return spliced(text, lineStart(text, key[0]), to, '');
}

/** Remove one key of a flow map, with the comma that joined it to its neighbour. */
export function removeFlowChild(text: string, map: YAMLMap, index: number): Written {
    const items = map.items as Pair<Scalar, Node>[];
    const own = rangeOf(items[index].key);
    const ownEnd = pairEnd(items[index]);
    if (own === null || ownEnd === null) return fail(REFUSALS.keyNoPlace);
    if (index > 0) {
        const from = pairEnd(items[index - 1]);
        if (from === null) return fail(REFUSALS.keyNoPlace);
        return spliced(text, from, ownEnd, '');
    }
    const next = rangeOf(items[index + 1].key);
    if (next === null) return fail(REFUSALS.keyNoPlace);
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
    if (rendered === null) return fail(REFUSALS.valueOneLine);
    const items = map.items as Pair<Scalar, Node>[];
    if (items.length === 0) {
        const range = rangeOf(map);
        if (range === null) return fail(REFUSALS.mapNoPlace);
        return spliced(text, range[0], range[1], `{ ${name}: ${rendered} }`);
    }
    const at = pairEnd(items[items.length - 1]);
    if (at === null) return fail(REFUSALS.mapNoPlace);
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
    if (range === null || map.items.length === 0) return fail(REFUSALS.mapNoPlace);
    const rendered = renderOneLine(value);
    if (rendered === null) return fail(REFUSALS.valueOneLine);
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
    if (end === null) return fail(REFUSALS.noLastKey);
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
    if (rendered === null) return fail(REFUSALS.valueOneLine);
    return appendLines(text, root, `${name}: ${rendered}`);
}

/**
 * One field written into the text, or the reason it was not. Every case of the write rule is here:
 * an existing scalar, an existing list in its own style, a nested key, a key that is not there, a
 * map that is not there, and a clear.
 */
function applyOne(text: string, path: string[], value: FieldValue): Written {
    const doc = parseDocument(text);
    if (doc.errors.length > 0) return fail(REFUSALS.manifestNoParse);
    const root = doc.contents;
    if (root === null || !isYamlMap(root)) return fail(REFUSALS.manifestNotMap);

    const top = pairOf(root, path[0]);

    if (path.length === 1) {
        if (value === null) {
            return top === undefined ? fail(REFUSALS.keyNotThere) : removePair(text, top);
        }
        if (top === undefined) return appendTop(text, root, path[0], value);
        if (top.value === null) return fail(REFUSALS.keyNoValue);
        return replaceValue(text, top.value, value);
    }

    const [parent, child] = path;
    const indent = mapIndent(root, text);
    const pad = ' '.repeat(indent);

    if (top === undefined) {
        if (value === null) return fail(REFUSALS.keyNotThere);
        const rendered = renderOneLine(value);
        if (rendered === null) return fail(REFUSALS.valueOneLine);
        return appendLines(text, root, `${parent}:\n${pad}${child}: ${rendered}`);
    }
    const holder = top.value;
    if (holder === null) return fail(REFUSALS.keyNoValue);

    if (isYamlMap(holder)) {
        const pair = pairOf(holder, child);
        if (value === null) {
            if (pair === undefined) return fail(REFUSALS.keyNotThere);
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
        if (pair.value === null) return fail(REFUSALS.keyNoValue);
        return replaceValue(text, pair.value, value);
    }

    return fail(REFUSALS.parentNotMap, parent);
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
        if (!isMap(held)) return;
        const rest = { ...held };
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
    data[parent] = { [child]: value };
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
export function renameKey(
    source: string,
    from: string,
    to: string,
    catalog: Record<string, string>
): EditResult {
    const refusal = (found: Why): EditResult => ({
        text: source,
        changed: [],
        refused: [{ field: from, reason: said(catalog, found) }]
    });
    const doc = parseDocument(source);
    if (doc.errors.length > 0) return refusal(why(REFUSALS.manifestNoParse));
    const root = doc.contents;
    if (root === null || !isYamlMap(root)) return refusal(why(REFUSALS.manifestNotMap));
    const pair = pairOf(root, from);
    if (pair === undefined) return { text: source, changed: [], refused: [] };
    if (pairOf(root, to) !== undefined) return refusal(why(REFUSALS.keyAlreadyThere, to));
    const range = rangeOf(pair.key);
    if (range === null) return refusal(why(REFUSALS.keyNoPlace));

    const text = splice(source, range[0], range[1], renderScalar(to, pair.key.type));
    const after = safeParse(text);
    const wanted = safeParse(source);
    if (after === null || wanted === null) return refusal(why(REFUSALS.unverified));
    wanted[to] = wanted[from];
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete -- a Map here would change the shape every reader of this record depends on
    delete wanted[from];
    if (!isDeepStrictEqual(after, wanted)) return refusal(why(REFUSALS.unverified));
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

/** The text of a file from an index to the end of its line, the line break not included. */
export function lineFrom(text: string, at: number): string {
    const end = text.indexOf('\n', at);
    return text.slice(at, end < 0 ? text.length : end);
}

/** The path of a field a write may set, or the reason it may not. */
export function settable(field: string): { path: string[] } | { why: Why } {
    const path = pathOf(field);
    if (path === null) return { why: why(REFUSALS.notAFieldName) };
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
export function setFields(
    source: string,
    fields: Record<string, unknown>,
    catalog: Record<string, string>
): SetFieldsResult {
    const changed: string[] = [];
    const refused: Refusal[] = [];
    const applied: Applied[] = [];
    const points = new Map<string, { offset: number; text: string }>();

    const base = safeParse(source);
    if (base === null) {
        for (const field of Object.keys(fields)) {
            refused.push({ field, reason: said(catalog, why(REFUSALS.manifestNoParse)) });
        }
        return { text: source, changed, refused, removed: {} };
    }

    let text = source;
    for (const [field, raw] of Object.entries(fields)) {
        const allowed = settable(field);
        if ('why' in allowed) {
            refused.push({ field, reason: said(catalog, allowed.why) });
            continue;
        }
        const { path } = allowed;
        const parsed = asFieldValue(raw);
        if (parsed === undefined) {
            refused.push({ field, reason: said(catalog, why(REFUSALS.notAFieldValue)) });
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
        if ('why' in out) {
            refused.push({ field, reason: said(catalog, out.why) });
            continue;
        }
        for (const point of points.values()) point.offset = moved(point.offset, out.splice);
        const { from, to, length } = out.splice;
        if (length === 0 && to > from)
            points.set(field, { offset: from, text: text.slice(from, to) });
        text = out.text;
        changed.push(field);
        applied.push({ path, value });
    }

    if (changed.length === 0) return { text: source, changed, refused, removed: {} };

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
            return { text, changed, refused, removed };
        }
    }
    return {
        text: source,
        changed: [],
        refused: Object.keys(fields).map((field) => ({
            field,
            reason: said(catalog, why(REFUSALS.unverified))
        })),
        removed: {}
    };
}
