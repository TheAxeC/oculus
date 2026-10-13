// Layer 2, server. The values a YAML write may carry, and how each is written as text.
//
// A value is a scalar, a list of strings, a metalist (a list of maps of scalars) or a block map (a
// map of scalars, lists and maps at any depth). The renderers here turn one into the lines it takes
// in a file: a scalar on one line in the quoting the file already used, a list in the flow or the
// block style, a map as indented block lines. They know nothing of where the text goes;
// yaml-edit.ts locates the bytes and the entry writers (lines.ts, render.ts) place the lines.

import { isScalar, isSeq } from 'yaml';
import type { Node } from 'yaml';
import { DEFAULT_INDENT } from '../../../data/helpers/files/yaml/yaml-ranges.ts';
import {
    renderScalar,
    type ScalarFieldValue
} from '../../../data/helpers/files/yaml/collection-text.ts';
import { isMap } from '../../../data/helpers/guards.ts';

/** One row of a metalist: a flat map whose values are scalars. */
export type ScalarMap = Record<string, ScalarFieldValue>;

/** One value inside a block: a scalar, a list of values, or a map of them, at any depth. */
export type BlockValue = ScalarFieldValue | BlockValue[] | BlockMap;

/**
 * The parsed shape of a raw field: a map whose values are scalars, lists, or maps of the same. A
 * dataset's `retrieval:` block is one, and every real one holds a list or a map inside it.
 */
export type BlockMap = { [key: string]: BlockValue };

/** What a field may be set to. A raw map is a block map; null clears the field. */
export type FieldValue = ScalarFieldValue | string[] | ScalarMap[] | BlockMap;

/** Whether a value is a scalar a block may hold. */
export function isBlockScalar(value: unknown): value is ScalarFieldValue {
    return (
        value === null ||
        typeof value === 'string' ||
        typeof value === 'boolean' ||
        (typeof value === 'number' && Number.isFinite(value))
    );
}

/** Whether a value belongs inside a block: a scalar, a list of them, or a map of either. */
export function isBlockValue(value: unknown): value is BlockValue {
    if (isBlockScalar(value)) return true;
    if (Array.isArray(value)) return value.every(isBlockValue);
    return isBlockMap(value);
}

/**
 * Whether a value is a map of scalars, lists and maps, the raw field's write vocabulary. The page
 * parses a raw field into exactly this, so a dataset's `retrieval:` block round-trips through it.
 */
export function isBlockMap(value: unknown): value is BlockMap {
    return isMap(value) && Object.values(value).every(isBlockValue);
}

/** Whether a non-empty list is the metalist shape rather than a list of strings. */
export function isMetalist(value: Exclude<FieldValue, null>): value is ScalarMap[] {
    return Array.isArray(value) && value.length > 0 && isMap(value[0]);
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

/** One block-list item as the lines it takes at an indentation, each line padded to it. */
export function renderListItem(value: BlockValue, indent: number): string {
    return listLines([value], indent).join('\n');
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
export function itemStyles(node: Node | null): (string | undefined)[] {
    if (node === null || !isSeq(node)) return [];
    return node.items.map((item) => (isScalar(item) ? item.type : undefined));
}

function styleAt(styles: (string | undefined)[], at: number): string | undefined {
    if (styles.length === 0) return undefined;
    return at < styles.length ? styles[at] : styles[styles.length - 1];
}

/** A list in the flow style the relation fields are written in. */
export function renderFlow(values: string[], styles: (string | undefined)[] = []): string {
    const items = values.map((item, at) => renderScalar(item, styleAt(styles, at)));
    return `[${items.join(', ')}]`;
}

/**
 * One metalist item as a flow map. A string under the key `value` is double-quoted whatever it
 * holds, since it is the reader-facing text of a label-value pair; every other scalar is written as
 * it reads.
 */
function renderFlowMap(value: ScalarMap): string {
    const fields = Object.entries(value).map(
        ([key, item]) =>
            `${renderScalar(key)}: ${renderScalar(item, key === 'value' ? 'QUOTE_DOUBLE' : undefined)}`
    );
    return `{ ${fields.join(', ')} }`;
}

/** A metalist as block-list lines, with continuation lines at the list's indentation. */
export function renderMetalist(values: ScalarMap[], indent: number): string {
    const pad = ' '.repeat(indent);
    return values.map((value) => `- ${renderFlowMap(value)}`).join(`\n${pad}`);
}

/** A list in the block style `results` and `ideas` are written in, at one indentation. */
export function renderBlock(
    values: string[],
    indent: number,
    styles: (string | undefined)[] = []
): string {
    const items = values.map((item, at) => `- ${renderScalar(item, styleAt(styles, at))}`);
    return items.join(`\n${' '.repeat(indent)}`);
}
