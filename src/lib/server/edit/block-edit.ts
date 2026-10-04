// Layer 2, server, pure. The value at a dotted key path of a YAML text replaced in place, over the
// bytes: a list, a map, or any collection nested in one, whatever its depth.
//
// The engine's configuration files are written by hand, so a write must not come back as a dump:
// the column padding of a flow map, a flow collection spread over several lines, the `{ }` and
// `[a]` padding one value mixes, the comments between items and the blank lines before them are the
// author's, and rendering the value again with `stringify` changes them. The edit therefore walks
// the parsed document against the new value and changes only what differs.
//
// An item the new value holds unchanged keeps its source bytes, its comments above it and its
// trailing comment included. An item the new value changes in a scalar has that scalar replaced
// where it stands, in the quote style it had. Items added, removed or moved rebuild the
// collection's own lines from those pieces: the pieces keep their bytes, the added items are
// rendered in the style of their siblings (a flow map on one line where the siblings are flow
// maps, a block map otherwise), at the file's own indentation, with the file's line ending.
// Every byte outside the lines of the key, from the start of its first item to the end of its last,
// is as it was.
//
// A path the text does not hold, one that holds a scalar, an alias, an anchor or a tag, a text that
// does not parse, and a shape this edit does not keep (a comment inside a flow collection that is
// rebuilt, a block scalar) all answer null, and the caller refuses. A value that is rendered into
// the file is read back by the caller before anything is written.

import { isEqual } from 'lodash-es';
import { CST, Composer, Parser, isAlias, isMap as isYamlMap, isScalar, isSeq } from 'yaml';
import type { Document, Node, Pair, Scalar } from 'yaml';
import { flowSource, keyText, scalarSource } from './block-render.ts';
import {
    afterBreak,
    applied,
    colonEnd,
    heldItems,
    kindOf,
    lineEnd,
    lineStart,
    matchItems,
    onOwnLine,
    rangeOf,
    stepOf,
    type Collection,
    type Ctx,
    type Edit,
    type Held
} from './block-source.ts';

/** The pieces of a rebuilt collection: lines above, indentation, and the item's own text. */
type Chunk = { lead: string[]; indent: number; shared: boolean; body: string };

/** The edit that sets a scalar of the file to a value, in the quote style it was written in. */
function scalarEdit(
    node: Scalar,
    span: [number, number],
    value: unknown,
    flow: boolean
): Edit[] | null {
    const token = node.srcToken;
    if (token === undefined || !CST.isScalar(token) || token.type === 'block-scalar') return null;
    const text = scalarSource(value, flow, token);
    return text === null ? null : [{ from: span[0], to: span[1], text }];
}

/** The document the text composes to, with the CST token of every node kept; null if none. */
function documentOf(source: string): Document | null {
    const composer = new Composer({ keepSourceTokens: true });
    for (const doc of composer.compose(new Parser().parse(source))) return doc;
    return null;
}

/** The edits that turn the node the file holds into the value; null for a shape not kept. */
function diff(
    node: Node | null,
    value: unknown,
    ctx: Ctx,
    flow: boolean,
    pair: Pair | null
): Edit[] | null {
    if (node === null || isAlias(node)) return null;
    const span = rangeOf(node);
    if (span === null) return null;
    if (isScalar(node)) {
        if (node.type === 'BLOCK_FOLDED' || node.type === 'BLOCK_LITERAL') return null;
        if (kindOf(value) === 'scalar') {
            if (isEqual(node.value, value)) return [];
            return scalarEdit(node, span, value, flow);
        }
        return [{ from: span[0], to: span[1], text: flowSource(value) }];
    }
    if (isSeq(node) && Array.isArray(value)) return rewrite(node, value, ctx, pair);
    if (isYamlMap(node) && kindOf(value) === 'map')
        return rewrite(node, value as object, ctx, pair);
    // another kind of value in a collection's place
    if (!node.flow && pair !== null) {
        const colon = colonEnd(ctx.source, pair);
        return colon === null
            ? null
            : [{ from: colon, to: span[1], text: ` ${flowSource(value)}` }];
    }
    return node.flow ? [{ from: span[0], to: span[1], text: flowSource(value) }] : null;
}

/** The pieces of one old item, with the edits to its value applied. */
function chunkOf(held: Held, before: number, edits: Edit[], ctx: Ctx): Chunk {
    const { source } = ctx;
    const shared = !onOwnLine(source, held.start);
    const lead = source.slice(before, lineStart(source, held.start)).split(/\r?\n/);
    lead.pop();
    const stop = lineEnd(source, Math.max(held.start, held.end - 1));
    return {
        lead: shared ? [] : lead,
        indent: held.start - lineStart(source, held.start),
        shared,
        body: applied(source.slice(held.start, stop), held.start, edits)
    };
}

/** One added item as lines of a block collection, in the style of its siblings. */
function freshLines(
    key: string,
    value: unknown,
    keyed: boolean,
    blocks: boolean,
    indent: number,
    ctx: Ctx
): string[] {
    const pad = ' '.repeat(indent);
    const isBlockMap = blocks && kindOf(value) === 'map' && Object.keys(value as object).length > 0;
    const pairs = isBlockMap
        ? Object.entries(value as Record<string, unknown>).map(
              ([name, item]) => `${keyText(name)}: ${flowSource(item)}`
          )
        : [];
    if (keyed) {
        if (!isBlockMap) return [`${pad}${keyText(key)}: ${flowSource(value)}`];
        const inner = ' '.repeat(indent + ctx.step);
        return [`${pad}${keyText(key)}:`, ...pairs.map((line) => `${inner}${line}`)];
    }
    if (!isBlockMap) return [`${pad}- ${flowSource(value)}`];
    return pairs.map((line, at) => (at === 0 ? `${pad}- ${line}` : `${pad}  ${line}`));
}

/** The edits that turn a collection into a value of its own kind. */
function rewrite(
    node: Collection,
    value: unknown[] | object,
    ctx: Ctx,
    pair: Pair | null
): Edit[] | null {
    const old = heldItems(node, ctx);
    if (old === null) return null;
    const keyed = isYamlMap(node);
    const next = Array.isArray(value)
        ? value.map((one: unknown) => ({ key: '', value: one }))
        : Object.entries(value as Record<string, unknown>).map(([key, one]) => ({
              key,
              value: one
          }));
    const match = matchItems(old, next, keyed);
    const flow = node.flow === true;
    const edits: Edit[][] = [];
    for (const [at, from] of match.entries()) {
        if (from < 0 || isEqual(old[from].value, next[at].value)) {
            edits.push([]);
            continue;
        }
        const inner = diff(
            old[from].node,
            next[at].value,
            ctx,
            flow,
            keyed ? valuePair(node, from) : null
        );
        if (inner === null) return null;
        edits.push(inner);
    }
    const inPlace = match.length === old.length && match.every((from, at) => from === at);
    if (inPlace) return edits.flat();
    if (old.length === 0) return fromEmpty(node, next, keyed, ctx, pair);
    if (next.length === 0) return emptied(node, old, ctx, pair);
    return flow
        ? rebuildFlow(node, old, next, match, edits, ctx)
        : rebuildBlock(old, next, match, edits, keyed, ctx, pair);
}

/** The pair of a map at an index. */
function valuePair(node: Collection, at: number): Pair | null {
    return isYamlMap(node) ? (node.items[at] ?? null) : null;
}

/** A collection given no item: written as `[]` or `{}`. */
function emptied(node: Collection, old: Held[], ctx: Ctx, pair: Pair | null): Edit[] | null {
    const empty = isYamlMap(node) ? '{}' : '[]';
    const span = rangeOf(node);
    if (span === null) return null;
    if (node.flow) return [{ from: span[0], to: span[1], text: empty }];
    const colon = pair === null ? null : colonEnd(ctx.source, pair);
    if (colon === null) return null;
    return [{ from: colon, to: old[old.length - 1].end, text: ` ${empty}` }];
}

/** A collection that held no item given some: inline for scalars, lines for anything else. */
function fromEmpty(
    node: Collection,
    next: { key: string; value: unknown }[],
    keyed: boolean,
    ctx: Ctx,
    pair: Pair | null
): Edit[] | null {
    const span = rangeOf(node);
    if (span === null) return null;
    const scalars = !keyed && next.every((one) => kindOf(one.value) === 'scalar');
    if (scalars || pair === null) {
        const text = keyed
            ? flowSource(Object.fromEntries(next.map((one) => [one.key, one.value])))
            : flowSource(next.map((one) => one.value));
        return [{ from: span[0], to: span[1], text }];
    }
    const colon = colonEnd(ctx.source, pair);
    const key = rangeOf(pair.key);
    if (colon === null || key === null) return null;
    const indent = key[0] - lineStart(ctx.source, key[0]) + ctx.step;
    const lines = next.flatMap((one) => freshLines(one.key, one.value, keyed, false, indent, ctx));
    return [{ from: colon, to: span[1], text: `${ctx.newline}${lines.join(ctx.newline)}` }];
}

/** A flow collection with items added, removed or moved, rebuilt from the bytes of its items. */
function rebuildFlow(
    node: Collection,
    old: Held[],
    next: { key: string; value: unknown }[],
    match: number[],
    edits: Edit[][],
    ctx: Ctx
): Edit[] | null {
    const { source } = ctx;
    const gaps = old.slice(1).map((held, at) => source.slice(old[at].end, held.start));
    if (gaps.some((gap) => gap.includes('#'))) return null;
    const separator = gaps[0] ?? ', ';
    const first = old[0].start;
    const last = old[old.length - 1].end;
    const parts = next.map((one, at) => {
        const from = match[at];
        if (from < 0)
            return isYamlMap(node)
                ? `${keyText(one.key, true)}: ${flowSource(one.value)}`
                : flowSource(one.value);
        return applied(source.slice(old[from].start, old[from].end), old[from].start, edits[at]);
    });
    return [{ from: first, to: last, text: parts.join(separator) }];
}

/** A block collection with items added, removed or moved, rebuilt from the lines of its items. */
function rebuildBlock(
    old: Held[],
    next: { key: string; value: unknown }[],
    match: number[],
    edits: Edit[][],
    keyed: boolean,
    ctx: Ctx,
    pair: Pair | null
): Edit[] | null {
    const { source } = ctx;
    const keyEnd = pair === null ? null : rangeOf(pair.key);
    // where the lines above each item begin: after the key's line for the first, after the
    // previous item's line for the others
    const begins = old.map((held, at) => {
        if (at > 0) {
            const before = old[at - 1];
            return afterBreak(source, lineEnd(source, Math.max(before.start, before.end - 1)));
        }
        return keyEnd === null
            ? lineStart(source, held.start)
            : afterBreak(source, lineEnd(source, keyEnd[1]));
    });
    const chunks = old.map((held, at) =>
        chunkOf(held, begins[at], edits[match.indexOf(at)] ?? [], ctx)
    );
    const shared = chunks[0].shared;
    const blocks = old.some((held) => isYamlMap(held.node) && held.node.flow !== true);
    const lines: string[] = [];
    for (const [slot, one] of next.entries()) {
        const from = match[slot];
        if (from < 0) {
            lines.push(
                ...freshLines(
                    one.key,
                    one.value,
                    keyed,
                    blocks,
                    shared && slot === 0 ? 0 : chunks[0].indent,
                    ctx
                )
            );
            continue;
        }
        const chunk = chunks[from];
        if (shared && slot === 0) {
            if (chunk.lead.length > 0) return null;
            lines.push(chunk.body);
        } else {
            lines.push(...chunk.lead, `${' '.repeat(chunk.indent)}${chunk.body}`);
        }
    }
    const last = old[old.length - 1];
    const text = lines.join(ctx.newline);
    return [
        {
            from: shared ? old[0].start : begins[0],
            to: lineEnd(source, Math.max(last.start, last.end - 1)),
            text
        }
    ];
}

/**
 * The text with the value at the path replaced, or null when the path holds no collection the edit
 * can walk (see the head of this file).
 */
export function setBlock(source: string, path: string[], value: unknown): string | null {
    const doc = documentOf(source);
    if (doc === null || doc.errors.length > 0 || path.length === 0) return null;
    let node: unknown = doc.contents;
    let pair: Pair | null = null;
    for (const segment of path) {
        if (!isYamlMap(node)) return null;
        pair =
            node.items.find((item) => isScalar(item.key) && String(item.key.value) === segment) ??
            null;
        if (pair === null) return null;
        node = pair.value;
    }
    if (!(isYamlMap(node) || isSeq(node)) || node.anchor !== undefined || node.tag !== undefined) {
        return null;
    }
    if (kindOf(value) !== (isSeq(node) ? 'seq' : 'map')) return null;
    const ctx: Ctx = {
        source,
        newline: source.includes('\r\n') ? '\r\n' : '\n',
        step: stepOf(source),
        toJS: (one) => (one as { toJS: (document: unknown) => unknown }).toJS(doc)
    };
    const edits = diff(node, value, ctx, node.flow === true, pair);
    return edits === null ? null : applied(source, 0, edits);
}
