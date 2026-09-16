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
// Nothing is thrown. A path this cannot write is a refusal with a reason, which is what the write
// route hands back to the page.

import { isMap, isScalar, isSeq, parseDocument, stringify } from 'yaml';
import type { Node, Pair, Scalar, YAMLMap } from 'yaml';
import { byKey } from '../data/guards.ts';

/** One row of a metalist: a flat map whose keys and values are strings. */
export type FlatStringMap = Record<string, string>;

/** A scalar accepted inside a raw field's map. */
export type ScalarFieldValue = string | number | boolean | null;

/** One value inside a block: a scalar, a list of values, or a map of them, at any depth. */
export type BlockValue = ScalarFieldValue | BlockValue[] | BlockMap;

/**
 * The parsed shape of a raw field: a map whose values are scalars, lists, or maps of the same. A
 * dataset's `retrieval:` block is one, and every real one holds a list or a map inside it.
 */
export type BlockMap = { [key: string]: BlockValue };

/** What a field may be set to. A raw map is a block map; null clears the field. */
export type FieldValue = ScalarFieldValue | string[] | FlatStringMap[] | BlockMap;

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
 * Fields no write ever touches. `id` and `tier` are the folder's, not the form's, and `type` is the
 * tier's on a flat scan rule; data/sources/manifests.ts derives all three from where the folder
 * sits, so writing them here would put the file at odds with its own location.
 */
export const READ_ONLY = ['id', 'tier', 'type'];

/** The lists the tree writes in the block style; every other list is written flow. */
export const BLOCK_LISTS = ['results', 'ideas'];

/**
 * The one dual-shape field of the tree: `followup` is a map of `do` and `after` on two manifests and
 * a bare note on one, where the note means `do`. Setting a key under a scalar parent would drop that
 * note, so the scalar is expanded into the map it stands for and the new value written into that. A
 * scalar parent this map does not name is refused, since nothing says what its value is short for.
 */
const SHORTHAND: Record<string, string> = { followup: 'do' };

/** The indentation a nested map is written at when the file holds no other one to copy. */
const DEFAULT_INDENT = 2;

type Parsed = Record<string, unknown>;

/** Either the new text or the reason there is none; every edit step answers with one of the two. */
type Written = { text: string } | { reason: string };

/** One edit that was made, kept so the verification can apply it to the parsed source. */
type Applied = { path: string[]; value: FieldValue };

function fail(reason: string): Written {
    return { reason };
}

function isRecord(value: unknown): value is Parsed {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** The document as plain values, or null when it does not parse or is not a map of keys. */
function safeParse(text: string): Parsed | null {
    let parsed: unknown;
    try {
        const doc = parseDocument(text);
        if (doc.errors.length > 0) return null;
        parsed = doc.toJS();
    } catch {
        return null;
    }
    return isRecord(parsed) ? parsed : null;
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
    return isRecord(top) ? top[path[1]] : undefined;
}

export function deepEqual(a: unknown, b: unknown): boolean {
    if (a === b) return true;
    if (Array.isArray(a) || Array.isArray(b)) {
        if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false;
        return a.every((item, at) => deepEqual(item, b[at]));
    }
    if (isRecord(a) && isRecord(b)) {
        const keys = Object.keys(a);
        if (keys.length !== Object.keys(b).length) return false;
        return keys.every((key) => key in b && deepEqual(a[key], b[key]));
    }
    return false;
}

/** Whether a value is the one the manifest already holds; absent and null are one thing. */
export function sameValue(next: unknown, current: unknown): boolean {
    if (next === null || next === undefined) return current === null || current === undefined;
    return deepEqual(next, current);
}

/** The value as one of the shapes a write may carry, or undefined when it is none of them. */
export function asFieldValue(raw: unknown): FieldValue | undefined {
    if (raw === null) return null;
    if (typeof raw === 'string' || typeof raw === 'boolean') return raw;
    if (typeof raw === 'number') return Number.isFinite(raw) ? raw : undefined;
    if (Array.isArray(raw) && raw.every((item) => typeof item === 'string')) return raw;
    if (
        Array.isArray(raw) &&
        raw.every(
            (item) =>
                isRecord(item) && Object.values(item).every((value) => typeof value === 'string')
        )
    ) {
        return raw as FlatStringMap[];
    }
    if (isBlockMap(raw)) return raw;
    return undefined;
}

/** Whether a value is a scalar a block may hold. */
function isBlockScalar(value: unknown): value is ScalarFieldValue {
    return (
        value === null ||
        typeof value === 'string' ||
        typeof value === 'boolean' ||
        (typeof value === 'number' && Number.isFinite(value))
    );
}

/** Whether a value belongs inside a block: a scalar, a list of them, or a map of either. */
function isBlockValue(value: unknown): value is BlockValue {
    if (isBlockScalar(value)) return true;
    if (Array.isArray(value)) return value.every(isBlockValue);
    return isBlockMap(value);
}

/**
 * Whether a value is a map of scalars, lists and maps, the raw field's write vocabulary. The page
 * parses a raw field into exactly this, so a dataset's `retrieval:` block round-trips through it.
 */
export function isBlockMap(value: unknown): value is BlockMap {
    return isRecord(value) && Object.values(value).every(isBlockValue);
}

/** Whether a non-empty list is the metalist shape rather than a list of strings. */
export function isMetalist(value: Exclude<FieldValue, null>): value is FlatStringMap[] {
    return Array.isArray(value) && value.length > 0 && isRecord(value[0]);
}

/** One scalar in YAML, on one line. `style` keeps the quoting the file already had. */
export function renderScalar(value: ScalarFieldValue, style?: string): string {
    if (typeof value !== 'string') return String(value);
    // A single-quoted scalar carries no escape, so a value with a newline in it is written double
    // quoted whatever the old style was: that is the one quoting that stays on one line.
    const wanted = value.includes('\n')
        ? 'QUOTE_DOUBLE'
        : style === 'QUOTE_DOUBLE' || style === 'QUOTE_SINGLE'
          ? style
          : null;
    const text =
        wanted === null
            ? stringify(value, { lineWidth: 0 })
            : stringify(value, { lineWidth: 0, defaultStringType: wanted });
    return text.replace(/\n+$/, '');
}

/** One key and its value as block lines, the key on the first of them. */
function keyLines(key: string, value: BlockValue, indent: number): string[] {
    const pad = ' '.repeat(indent);
    const name = `${pad}${renderScalar(key)}:`;
    if (isBlockMap(value)) {
        const inner = mapLines(value, indent + DEFAULT_INDENT);
        return inner.length === 0 ? [`${name} {}`] : [name, ...inner];
    }
    if (Array.isArray(value)) {
        return value.length === 0 ? [`${name} []`] : [name, ...listLines(value, indent)];
    }
    return [`${name} ${renderScalar(value)}`];
}

/** Every key of a map as block lines at one indentation. */
function mapLines(values: BlockMap, indent: number): string[] {
    return Object.entries(values).flatMap(([key, value]) => keyLines(key, value, indent));
}

/** A block list's items at one indentation; a map item opens on its own dash line. */
function listLines(values: BlockValue[], indent: number): string[] {
    const pad = ' '.repeat(indent);
    const out: string[] = [];
    for (const item of values) {
        if (isBlockMap(item)) {
            const inner = mapLines(item, indent + DEFAULT_INDENT);
            if (inner.length === 0) out.push(`${pad}- {}`);
            else out.push(`${pad}- ${inner[0].trimStart()}`, ...inner.slice(1));
            continue;
        }
        if (Array.isArray(item)) {
            out.push(`${pad}-`, ...listLines(item, indent + DEFAULT_INDENT));
            continue;
        }
        out.push(`${pad}- ${renderScalar(item)}`);
    }
    return out;
}

/**
 * A block map as YAML lines at the indentation of its own keys. The first line carries none of it,
 * since the caller writes it where the key it replaces already sits.
 */
export function renderBlockMap(values: BlockMap, indent: number): string {
    return mapLines(values, indent).join('\n').slice(indent);
}

/**
 * The quoting each item of a rewritten list is given: the style the item at that position had, and
 * the last item's style for one appended past the end. A list of quoted strings therefore stays a
 * list of quoted strings when an item is added to it.
 */
function itemStyles(node: Node | null): (string | undefined)[] {
    if (node === null || !isSeq(node)) return [];
    return node.items.map((item) => (isScalar(item) ? item.type : undefined));
}

function styleAt(styles: (string | undefined)[], at: number): string | undefined {
    if (styles.length === 0) return undefined;
    return at < styles.length ? styles[at] : styles[styles.length - 1];
}

/** A list in the flow style the relation fields are written in. */
function renderFlow(values: string[], styles: (string | undefined)[] = []): string {
    const items = values.map((item, at) => renderScalar(item, styleAt(styles, at)));
    return `[${items.join(', ')}]`;
}

/** One metalist item as a flow map, with its reader-facing value always double-quoted. */
function renderFlowMap(value: FlatStringMap): string {
    const fields = Object.entries(value).map(
        ([key, item]) =>
            `${renderScalar(key)}: ${renderScalar(item, key === 'value' ? 'QUOTE_DOUBLE' : undefined)}`
    );
    return `{ ${fields.join(', ')} }`;
}

/** A metalist as block-list lines, with continuation lines at the list's indentation. */
export function renderMetalist(values: FlatStringMap[], indent: number): string {
    const pad = ' '.repeat(indent);
    return values.map((value) => `- ${renderFlowMap(value)}`).join(`\n${pad}`);
}

/** A list in the block style `results` and `ideas` are written in, at one indentation. */
function renderBlock(
    values: string[],
    indent: number,
    styles: (string | undefined)[] = []
): string {
    const items = values.map((item, at) => `- ${renderScalar(item, styleAt(styles, at))}`);
    return items.join(`\n${' '.repeat(indent)}`);
}

/** The column a position sits at, which is the indentation of the line it is on. */
function columnOf(text: string, at: number): number {
    return at - (text.lastIndexOf('\n', at - 1) + 1);
}

/** The start of the line a position sits on. */
function lineStart(text: string, at: number): number {
    return text.lastIndexOf('\n', at - 1) + 1;
}

/**
 * The end of the line a position sits on, which is where a new line is inserted after it. A block
 * collection's range swallows the newline it ends with, so the scan steps back over trailing
 * newlines first; what it lands on is the last line the node actually occupies.
 */
function lineEndAfter(text: string, at: number): number {
    let end = at;
    while (end > 0 && text[end - 1] === '\n') end -= 1;
    const next = text.indexOf('\n', end);
    return next < 0 ? text.length : next;
}

function rangeOf(node: unknown): [number, number, number] | null {
    const range = (node as Node | null)?.range;
    return Array.isArray(range) ? range : null;
}

/** The pair of a key in a map node, or undefined when the map has no such key. */
function pairOf(map: YAMLMap, name: string): Pair<Scalar, Node> | undefined {
    return map.items.find((item) => (item.key as Scalar | undefined)?.value === name) as
        Pair<Scalar, Node> | undefined;
}

/** Where a node's value ends, before the comment or the newline its own range swallows. */
function valueEnd(node: Node): number {
    const range = rangeOf(node);
    if (range === null) return 0;
    if (isSeq(node) && node.flow !== true && node.items.length > 0) {
        const last = rangeOf(node.items[node.items.length - 1]);
        if (last !== null) return last[1];
    }
    if (isMap(node) && node.flow !== true && node.items.length > 0) {
        const last = rangeOf((node.items[node.items.length - 1] as Pair<Scalar, Node>).value);
        if (last !== null) return last[1];
    }
    return range[1];
}

/** Where a pair's own text ends: its value's end, or its key's when it has no value. */
function pairEnd(pair: Pair<Scalar, Node>): number | null {
    const value = pair.value;
    if (value !== null) return valueEnd(value);
    return rangeOf(pair.key)?.[1] ?? null;
}

/** The indentation the file writes a nested block map at, from the first one it holds. */
function mapIndent(root: YAMLMap, text: string): number {
    for (const item of root.items) {
        const value = (item as Pair<Scalar, Node>).value;
        if (value !== null && isMap(value) && value.flow !== true) {
            const range = rangeOf(value);
            if (range !== null && range[0] > 0) return columnOf(text, range[0]);
        }
    }
    return DEFAULT_INDENT;
}

/** Replace a slice of the text. */
function splice(text: string, from: number, to: number, insert: string): string {
    return text.slice(0, from) + insert + text.slice(to);
}

/**
 * Write a value over the bytes of an existing one. A list keeps the style the file has it in: a flow
 * list stays flow and a block list stays block, at its own indentation. An empty value (`venue_id:`
 * with nothing after it) is a zero-width range, so the rendering is inserted there and given the
 * space the colon has not got.
 */
function replaceValue(text: string, node: Node, value: Exclude<FieldValue, null>): Written {
    const range = rangeOf(node);
    if (range === null) return fail('the value has no place in the file');
    const start = range[0];
    const end = valueEnd(node);
    const block = Array.isArray(value) && isSeq(node) && node.flow !== true && value.length > 0;
    let rendered: string;
    if (isBlockMap(value)) {
        const block = isMap(node) && node.flow !== true;
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
        rendered = renderScalar(value, isScalar(node) ? node.type : undefined);
        if (rendered.includes('\n')) return fail('the value does not fit on one line');
    }
    if (start === end && text[start - 1] !== ' ' && text[start - 1] !== '\n') {
        rendered = ` ${rendered}`;
    }
    return { text: splice(text, start, end, rendered) };
}

/** Remove the whole lines a pair occupies, its trailing comment with them. */
function removePair(text: string, pair: Pair<Scalar, Node>): Written {
    const key = rangeOf(pair.key);
    const end = pairEnd(pair);
    if (key === null || end === null) return fail('the key has no place in the file');
    const to = Math.min(text.length, lineEndAfter(text, end) + 1);
    return { text: splice(text, lineStart(text, key[0]), to, '') };
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
        return { text: splice(text, from, ownEnd, '') };
    }
    const next = rangeOf(items[index + 1].key);
    if (next === null) return fail('the key has no place in the file');
    return { text: splice(text, own[0], next[0], '') };
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
        return { text: splice(text, range[0], range[1], `{ ${name}: ${rendered} }`) };
    }
    const at = pairEnd(items[items.length - 1]);
    if (at === null) return fail('the map has no place in the file');
    return { text: splice(text, at, at, `, ${name}: ${rendered}`) };
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
    return { text: splice(text, at, at, `\n${indent}${name}: ${rendered}`) };
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
        const body = text.length === 0 || text.endsWith('\n') ? text : `${text}\n`;
        return { text: `${body}${lines}\n` };
    }
    const end = pairEnd(root.items[root.items.length - 1] as Pair<Scalar, Node>);
    if (end === null) return fail('the file has no last key to write after');
    const at = lineEndAfter(text, end);
    return { text: splice(text, at, at, `\n${lines}`) };
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

/**
 * One field written into the text, or the reason it was not. Every case of the write rule is here:
 * an existing scalar, an existing list in its own style, a nested key, a key that is not there, a
 * map that is not there, and a clear.
 */
function applyOne(text: string, path: string[], value: FieldValue): Written {
    const doc = parseDocument(text);
    if (doc.errors.length > 0) return fail('the manifest does not parse');
    const root = doc.contents;
    if (root === null || !isMap(root)) return fail('the manifest is not a map of keys');

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

    if (isMap(holder)) {
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

    // A scalar where a map is asked for: the dual shape of `followup`, expanded so its note is kept.
    const shorthand = byKey(SHORTHAND, parent);
    if (!isScalar(holder) || shorthand === undefined) return fail(`${parent} is not a map`);
    if (value === null) return fail('the key is not there');
    const rendered = renderOneLine(value);
    if (rendered === null) return fail('the value does not fit on one line');
    const held = typeof holder.value === 'string' ? holder.value : null;
    const kept =
        held === null || shorthand === child
            ? ''
            : `${pad}${shorthand}: ${renderScalar(held, holder.type)}\n`;
    const key = rangeOf(top.key);
    if (key === null) return fail('the key has no place in the file');
    const lines = `${parent}:\n${kept}${pad}${child}: ${rendered}`;
    return { text: splice(text, lineStart(text, key[0]), valueEnd(holder), lines) };
}

/** The parsed document with one path set or cleared, which is what the new text must equal. */
function expect(data: Parsed, path: string[], value: FieldValue): void {
    if (path.length === 1) {
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete -- a Map here would change the shape every reader of this record depends on
        if (value === null) delete data[path[0]];
        else data[path[0]] = value;
        return;
    }
    const [parent, child] = path;
    const held = data[parent];
    if (value === null) {
        if (!isRecord(held)) return;
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete -- a Map here would change the shape every reader of this record depends on
        delete held[child];
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete -- a Map here would change the shape every reader of this record depends on
        if (Object.keys(held).length === 0) delete data[parent];
        return;
    }
    if (isRecord(held)) {
        held[child] = value;
        return;
    }
    const shorthand = byKey(SHORTHAND, parent);
    const kept =
        typeof held === 'string' && shorthand !== undefined && shorthand !== child
            ? { [shorthand]: held }
            : {};
    data[parent] = { ...kept, [child]: value };
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
    if (root === null || !isMap(root)) return refusal('the manifest is not a map of keys');
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
    if (!deepEqual(after, wanted)) return refusal('the edit did not verify; nothing was written');
    return { text, changed: [from], refused: [] };
}

/**
 * Set every field of a manifest's text, each in the bytes of its own value.
 *
 * A field whose value the manifest already holds is not a change and is not written. A field this
 * cannot write is refused with a reason and nothing else is affected by it. When the result fails to
 * parse, or parses to anything but the source with exactly these fields applied, nothing is written
 * at all: the source comes back with every field refused.
 */
export function setFields(source: string, fields: Record<string, unknown>): EditResult {
    const changed: string[] = [];
    const refused: Refusal[] = [];
    const applied: Applied[] = [];

    const base = safeParse(source);
    if (base === null) {
        for (const field of Object.keys(fields)) {
            refused.push({ field, reason: 'the manifest does not parse' });
        }
        return { text: source, changed, refused };
    }

    let text = source;
    for (const [field, raw] of Object.entries(fields)) {
        const path = pathOf(field);
        if (path === null) {
            refused.push({ field, reason: 'not a field name' });
            continue;
        }
        if (READ_ONLY.includes(path[0])) {
            refused.push({ field, reason: `${path[0]} is set by the folder, never by a write` });
            continue;
        }
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
            current.some(isRecord)
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
        text = out.text;
        changed.push(field);
        applied.push({ path, value });
    }

    if (changed.length === 0) return { text: source, changed, refused };

    const after = safeParse(text);
    const wanted = safeParse(source);
    if (after !== null && wanted !== null) {
        for (const one of applied) expect(wanted, one.path, one.value);
        if (deepEqual(after, wanted)) return { text, changed, refused };
    }
    return {
        text: source,
        changed: [],
        refused: Object.keys(fields).map((field) => ({
            field,
            reason: 'the edit did not verify; nothing was written'
        }))
    };
}
