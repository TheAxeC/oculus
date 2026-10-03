// Layer 2, server. Where a node of a parsed YAML document stands in its text: the column and the
// line a position sits on, the range of a node, where its value ends before the comment or the
// newline its own range swallows, and the indentation a file writes its nested maps at.
//
// parseDocument gives every node its byte range; yaml-edit.ts and the entry writers replace or
// insert bytes at the positions read here, so the rules for them are in one place.

import { isMap as isYamlMap, isSeq } from 'yaml';
import type { Node, Pair, Scalar, YAMLMap } from 'yaml';
import { DEFAULT_INDENT } from './yaml-values.ts';

/** The column a position sits at, which is the indentation of the line it is on. */
export function columnOf(text: string, at: number): number {
    return at - (text.lastIndexOf('\n', at - 1) + 1);
}

/** The start of the line a position sits on. */
export function lineStart(text: string, at: number): number {
    return text.lastIndexOf('\n', at - 1) + 1;
}

/**
 * The end of the line a position sits on, which is where a new line is inserted after it. A block
 * collection's range swallows the newline it ends with, so the scan steps back over trailing
 * newlines first; what it lands on is the last line the node actually occupies.
 */
export function lineEndAfter(text: string, at: number): number {
    let end = at;
    while (end > 0 && text[end - 1] === '\n') end -= 1;
    const next = text.indexOf('\n', end);
    return next < 0 ? text.length : next;
}

export function rangeOf(node: unknown): [number, number, number] | null {
    const range = (node as Node | null)?.range;
    return Array.isArray(range) ? range : null;
}

/** The pair of a key in a map node, or undefined when the map has no such key. */
export function pairOf(map: YAMLMap, name: string): Pair<Scalar, Node> | undefined {
    return map.items.find((item) => (item.key as Scalar | undefined)?.value === name) as
        Pair<Scalar, Node> | undefined;
}

/** Where a node's value ends, before the comment or the newline its own range swallows. */
export function valueEnd(node: Node): number {
    const range = rangeOf(node);
    if (range === null) return 0;
    if (isSeq(node) && node.flow !== true && node.items.length > 0) {
        const last = rangeOf(node.items[node.items.length - 1]);
        if (last !== null) return last[1];
    }
    if (isYamlMap(node) && node.flow !== true && node.items.length > 0) {
        const last = rangeOf((node.items[node.items.length - 1] as Pair<Scalar, Node>).value);
        if (last !== null) return last[1];
    }
    return range[1];
}

/** Where a pair's own text ends: its value's end, or its key's when it has no value. */
export function pairEnd(pair: Pair<Scalar, Node>): number | null {
    const value = pair.value;
    if (value !== null) return valueEnd(value);
    return rangeOf(pair.key)?.[1] ?? null;
}

/** The indentation the file writes a nested block map at, from the first one it holds. */
export function mapIndent(root: YAMLMap, text: string): number {
    for (const item of root.items) {
        const value = (item as Pair<Scalar, Node>).value;
        if (value !== null && isYamlMap(value) && value.flow !== true) {
            const range = rangeOf(value);
            if (range !== null && range[0] > 0) return columnOf(text, range[0]);
        }
    }
    return DEFAULT_INDENT;
}
