// Layer 2, server, pure. What block-edit.ts reads off a YAML text: the items of a collection with
// the offsets they sit at, which old item each new one is, the lines and the indentation of the
// source, and the replacement of offsets by text.

import { isEqual } from 'lodash-es';
import { isMap, isScalar } from 'yaml';
import type { Node, Pair, YAMLMap, YAMLSeq } from 'yaml';

/** One replacement of the source: the offsets it covers and the text that takes their place. */
export type Edit = { from: number; to: number; text: string };

/** What the walk carries: the source, its line ending, its indentation step and the document. */
export type Ctx = { source: string; newline: string; step: number; toJS: (node: Node) => unknown };

export type Kind = 'scalar' | 'seq' | 'map';

/** A collection node the edit can walk. */
export type Collection = YAMLSeq | YAMLMap;

/** One item of a collection as the source holds it. */
export type Held = {
    /** The map key, or an empty string for a list item. */
    key: string;
    /** The node the item's value is. */
    node: Node | null;
    /** Where the item starts: its dash or key, and where it ends: the end of its value. */
    start: number;
    end: number;
    /** The item's value as plain data. */
    value: unknown;
};

export function kindOf(value: unknown): Kind {
    if (Array.isArray(value)) return 'seq';
    return value !== null && typeof value === 'object' ? 'map' : 'scalar';
}

export function lineStart(source: string, at: number): number {
    return source.lastIndexOf('\n', at - 1) + 1;
}

/** Where the line break ending the line an offset sits on begins, or the end of the source. */
export function lineEnd(source: string, at: number): number {
    const next = source.indexOf('\n', at);
    if (next < 0) return source.length;
    return next > 0 && source[next - 1] === '\r' ? next - 1 : next;
}

/** The offset after the line break at `at`. */
export function afterBreak(source: string, at: number): number {
    return source[at] === '\r' ? at + 2 : at + 1;
}

/** Whether only blanks stand before an offset on its line. */
export function onOwnLine(source: string, at: number): boolean {
    return source.slice(lineStart(source, at), at).trim() === '';
}

export function rangeOf(node: unknown): [number, number] | null {
    const held = (node as Node | null | undefined)?.range;
    return held === undefined || held === null ? null : [held[0], held[1]];
}

/** The text with these edits applied; the edits do not overlap. */
export function applied(text: string, base: number, edits: Edit[]): string {
    let result = text;
    for (const edit of [...edits].sort((a, b) => b.from - a.from)) {
        result = result.slice(0, edit.from - base) + edit.text + result.slice(edit.to - base);
    }
    return result;
}

/** The offset just after the colon of a map pair. */
export function colonEnd(source: string, pair: Pair): number | null {
    const key = rangeOf(pair.key);
    if (key === null) return null;
    const colon = source.indexOf(':', key[1]);
    return colon < 0 ? null : colon + 1;
}

/** The indentation step the file writes: its smallest indented line. */
export function stepOf(source: string): number {
    let least = 0;
    for (const line of source.split('\n')) {
        const held = /^( +)\S/.exec(line);
        if (held !== null && !line.trimStart().startsWith('#')) {
            least = least === 0 ? held[1].length : Math.min(least, held[1].length);
        }
    }
    return least === 0 ? 4 : least;
}

/** The items of a collection as the source holds them, or null for a shape not kept. */
export function heldItems(node: Collection, ctx: Ctx): Held[] | null {
    const found: Held[] = [];
    for (const item of node.items) {
        if (isMap(node)) {
            const pair = item as Pair;
            const key = rangeOf(pair.key);
            const value = rangeOf(pair.value);
            if (key === null || !isScalar(pair.key)) return null;
            let end = Math.max(key[1], value?.[1] ?? 0);
            if (value === null || value[1] <= key[1]) end = colonEnd(ctx.source, pair) ?? end;
            found.push({
                key: String(pair.key.value),
                node: (pair.value as Node | null) ?? null,
                start: key[0],
                end,
                value: pair.value === null ? null : ctx.toJS(pair.value as Node)
            });
        } else {
            const span = rangeOf(item);
            if (span === null) return null;
            let start = span[0];
            if (!node.flow) {
                let back = span[0];
                while (back > 0 && /[\s]/.test(ctx.source[back - 1])) back -= 1;
                if (ctx.source[back - 1] !== '-') return null;
                start = back - 1;
            }
            found.push({
                key: '',
                node: item as Node,
                start,
                end: span[1],
                value: ctx.toJS(item as Node)
            });
        }
    }
    return found;
}

/** Which old item each new one is: equal items first, then the rest by order and kind. */
export function matchItems(
    old: Held[],
    next: { key: string; value: unknown }[],
    keyed: boolean
): number[] {
    if (keyed) return next.map((one) => old.findIndex((held) => held.key === one.key));
    const used = new Set<number>();
    const out = next.map(() => -1);
    next.forEach((one, at) => {
        const found = old.findIndex(
            (held, index) => !used.has(index) && isEqual(held.value, one.value)
        );
        if (found >= 0) {
            out[at] = found;
            used.add(found);
        }
    });
    next.forEach((one, at) => {
        if (out[at] >= 0) return;
        const found = old.findIndex(
            (held, index) => !used.has(index) && kindOf(held.value) === kindOf(one.value)
        );
        if (found >= 0) {
            out[at] = found;
            used.add(found);
        }
    });
    return out;
}
