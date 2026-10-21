// Layer 2, server. Shared YAML line ranges and verified byte edits live here because every entry
// writer must use the same source-position rules.
//
// A parsed value is taken for a map by data/helpers/guards.ts's `isMap`, and the yaml library's own
// node test is imported as `isYamlMap`.
import { isDeepStrictEqual } from 'node:util';
import { isMap as isYamlMap, isScalar, isSeq, parseDocument } from 'yaml';
import type { Document, Node, Pair, Scalar, YAMLMap } from 'yaml';
import type { EditResult } from '../yaml/yaml-edit.ts';
import { REFUSALS, said, why } from '../yaml/why.ts';
import type { Why } from '../yaml/why.ts';
import { isBlockMap, isMetalist, renderBlockMap, renderMetalist } from '../yaml/yaml-values.ts';
import type { FieldValue } from '../yaml/yaml-values.ts';
import { lineAt, listOf, renderScalar } from '../../../data/helpers/files/yaml/collection-text.ts';
import {
    lineStart,
    pairEnd,
    pairOf,
    rangeOf,
    valueEnd
} from '../../../data/helpers/files/yaml/yaml-ranges.ts';
import { isMap, scalar } from '../../../data/helpers/guards.ts';

/** The key of a checklist, on a manifest and on a collection entry alike. */
export const SUBTASKS = 'subtasks';

/** The key of the follow-up notes, on a manifest and on a collection entry alike. */
export const FOLLOWUP = 'followup';

/**
 * The two blocks of one-line flow maps a card edits line by line: the checklist and the follow-up
 * notes.
 */
export type LineBlock = typeof SUBTASKS | typeof FOLLOWUP;

/**
 * The one field of a subtask line or a follow-up note that is never cleared: without it there is no
 * line.
 */
export const LABEL = 'do';

/** A half-open range of line numbers, zero based: the lines one entry occupies. */
export type LineRange = { start: number; end: number };

/**
 * One line of a `subtasks:` or a `followup:` block: the key it is addressed by, and where it is.
 */
export type SubtaskLine = { key: string; line: number };

/**
 * A `subtasks:` or `followup:` block as a write sees it. `key` is the line of the block's key and
 * is null when the host has no block at all; `map` says the block is a map of keys rather than a
 * list, which is the shape normalise.ts addresses by the key rather than by the position.
 */
export type SubtaskBlock = {
    key: number | null;
    /** The column the item lines start at, which a new line is written at. */
    indent: number;
    map: boolean;
    items: SubtaskLine[];
};

/** Either the new text or the reason there is none, the shape every edit step answers with. */
export type Written = { text: string } | { why: Why };

/**
 * One change the verification applies to the parsed source; `remove` deletes instead of setting.
 */
export type Change = { path: (string | number)[]; value?: unknown; remove?: boolean };

/** A host of subtasks: the map node they hang under, and its path in the parsed document. */
export type Host = { node: YAMLMap; path: (string | number)[] };

/**
 * One entry of a collection file: where it is in the file and where it is in the parsed document.
 */
export type Located = { list: string; index: number; node: YAMLMap; range: LineRange };

export function fail(key: string, ...args: (string | number)[]): Written {
    return { why: why(key, ...args) };
}

/**
 * Every named field refused for the same reason, worded from the catalog, with the source
 * unchanged.
 */
export function refuseAll(
    source: string,
    fields: string[],
    found: Why,
    catalog: Record<string, string>
): EditResult {
    const named = fields.length === 0 ? [''] : fields;
    const reason = said(catalog, found);
    return { text: source, changed: [], refused: named.map((field) => ({ field, reason })) };
}

/** The document, or null when it does not parse or is not a map of keys. */
export function document(source: string): Document | null {
    let doc: Document;
    try {
        doc = parseDocument(source);
    } catch {
        return null;
    }
    if (doc.errors.length > 0) return null;
    return doc.contents !== null && isYamlMap(doc.contents) ? doc : null;
}

/** The document as plain values, or undefined when it does not parse. */
export function asJs(source: string): unknown {
    const doc = document(source);
    if (doc === null) return undefined;
    try {
        return doc.toJS();
    } catch {
        return undefined;
    }
}

/** The column a byte offset sits at, which is the indentation of the line it opens. */
export function columnAt(text: string, at: number): number {
    return at - (text.lastIndexOf('\n', at - 1) + 1);
}

/** The indentation of one line of the text. */
export function indentOf(line: string): number {
    return line.length - line.trimStart().length;
}

export function splice(text: string, from: number, to: number, insert: string): string {
    return text.slice(0, from) + insert + text.slice(to);
}

/**
 * One scalar as it is written inside a flow map. A plain scalar is not safe there, since a comma or
 * a brace ends the value, so anything holding one is written double quoted; everything else keeps
 * the rendering the rest of the tree uses.
 */
export function flowScalar(value: FieldValue): string {
    if (value === null) return 'null';
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);
    // A list or a map inside a flow map is written as JSON, which is YAML flow with every
    // separator quoted, so a comma or a brace inside it cannot end the value.
    if (typeof value !== 'string') return JSON.stringify(value);
    if (value === '' || /[,{}[\]:#]|^\s|\s$/.test(value)) return JSON.stringify(value);
    return renderScalar(value);
}

/**
 * A list as the tree writes it inline: `[one, two]`, each item quoted as the old one was. An item
 * the plain style would write with a comma, a bracket or a brace in it is written double quoted,
 * since inside the brackets that character would end the item or open another.
 */
export function renderFlowList(values: string[], styles: (string | undefined)[]): string {
    const items = values.map((item, at) => {
        const written = renderScalar(
            item,
            at < styles.length ? styles[at] : styles[styles.length - 1]
        );
        const quoted = written.startsWith('"') || written.startsWith("'");
        return !quoted && /[,{}[\]]/.test(written) ? JSON.stringify(item) : written;
    });
    return `[${items.join(', ')}]`;
}

function itemStyles(node: Node): (string | undefined)[] {
    if (!isSeq(node)) return [];
    return node.items.map((item) => (isScalar(item) ? item.type : undefined));
}

/** The lines a block map occupies: its first key's line to its last value's, blanks excluded. */
export function linesOf(source: string, node: YAMLMap): LineRange | null {
    const own = rangeOf(node);
    if (own === null) return null;
    const end = valueEnd(node);
    return {
        start: lineAt(source, own[0]),
        end: lineAt(source, Math.max(end - 1, own[0])) + 1
    };
}

/** The entry whose `ident` field holds `value`, or null when the file has no such entry. */
export function locate(source: string, ident: string, value: unknown): Located | null {
    const doc = document(source);
    if (doc === null) return null;
    const list = listOf(doc.contents as YAMLMap);
    if (list === null) return null;
    for (let at = 0; at < list.seq.items.length; at += 1) {
        const node = list.seq.items[at] as Node;
        if (!isYamlMap(node)) continue;
        const pair = pairOf(node, ident);
        if (pair?.value == null || !isScalar(pair.value)) continue;
        if (scalar(pair.value.value) !== scalar(value)) continue;
        const range = linesOf(source, node);
        if (range === null) continue;
        return { list: list.key, index: at, node, range };
    }
    return null;
}

/**
 * The line range of the entry whose `- <ident>: <value>` line opens it, or null when there is none.
 * The range runs to the entry's last field line; a blank line or a comment after it belongs to the
 * file, not to the entry, and nothing here writes into it.
 */
export function entryRange(source: string, ident: string, value: string): LineRange | null {
    return locate(source, ident, value)?.range ?? null;
}

/** The parsed source with the changes applied, compared against the parsed result. */
export function verified(source: string, text: string, changes: Change[]): boolean {
    const after = asJs(text);
    const wanted = asJs(source);
    if (after === undefined || wanted === undefined) return false;
    for (const change of changes) if (!applyChange(wanted, change)) return false;
    return isDeepStrictEqual(after, wanted);
}

/**
 * What an edit answers once its fields are written: the source back when nothing changed, the new
 * text when it parses to the source with `changes` applied, and every field of `names` refused
 * when it does not.
 */
export function settled(
    source: string,
    text: string,
    changes: Change[],
    names: string[],
    changed: string[],
    refused: EditResult['refused'],
    catalog: Record<string, string>
): EditResult {
    if (changed.length === 0) return { text: source, changed, refused };
    if (!verified(source, text, changes)) {
        return refuseAll(source, names, why(REFUSALS.unverified), catalog);
    }
    return { text, changed, refused };
}

/** One expected change applied to the parsed source, or false when the path is not there. */
function applyChange(root: unknown, change: Change): boolean {
    let holder: unknown = root;
    for (const step of change.path.slice(0, -1)) {
        if (Array.isArray(holder) && typeof step === 'number') holder = holder[step];
        else if (isMap(holder) && typeof step === 'string') holder = holder[step];
        else return false;
    }
    const last = change.path[change.path.length - 1];
    if (Array.isArray(holder) && typeof last === 'number') {
        if (change.remove === true) holder.splice(last, 1);
        else holder[last] = change.value;
        return true;
    }
    if (!isMap(holder) || typeof last !== 'string') return false;
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete -- a Map here would change the shape every reader of this record depends on
    if (change.remove === true) delete holder[last];
    else holder[last] = change.value;
    return true;
}

/** Whether a scalar is written as a folded (`>`) or a literal (`|`) block. */
function isBlockScalar(node: Scalar): boolean {
    return node.type === 'BLOCK_FOLDED' || node.type === 'BLOCK_LITERAL';
}

/**
 * A text written as the block scalar the old one was. A folded block keeps a text of one line
 * folded, and a text with line breaks of its own is written literal, since folding would turn a
 * break into a space. The clip, strip and keep marks follow the text's trailing line breaks, and
 * the lines of the range the old block swallowed after its text are written back.
 */
function renderBlockScalar(text: string, node: Scalar, value: string): string {
    const range = rangeOf(node);
    const start = range === null ? 0 : range[0];
    const end = range === null ? 0 : valueEnd(node);
    const swallowed = /\n*$/.exec(text.slice(start, end))?.[0].length ?? 0;
    const head = text.slice(lineStart(text, start), start);
    const held = /\n( +)\S/.exec(text.slice(start, end));
    const pad = ' '.repeat(
        held === null ? head.length - head.trimStart().length + 2 : held[1].length
    );
    const trailing = /\n*$/.exec(value)?.[0].length ?? 0;
    const body = value.slice(0, value.length - trailing);
    const chomp = trailing === 0 ? '-' : trailing === 1 ? '' : '+';
    const folded = node.type === 'BLOCK_FOLDED' && !body.includes('\n');
    const lines = body.split('\n').map((line) => (line === '' ? '' : `${pad}${line}`));
    const kept = '\n'.repeat(Math.max(trailing - 1, 0));
    return `${folded ? '>' : '|'}${chomp}\n${lines.join('\n')}${kept}${'\n'.repeat(Math.max(swallowed, 1))}`;
}

/** Write a value over the bytes of an existing one, the quoting the file had kept. */
export function replaceIn(text: string, node: Node, value: Exclude<FieldValue, null>): Written {
    const range = rangeOf(node);
    if (range === null) return fail(REFUSALS.valueNoPlace);
    const start = range[0];
    const end = valueEnd(node);
    let rendered: string;
    if (isBlockMap(value)) {
        const block = isYamlMap(node) && node.flow !== true;
        const indent = block
            ? columnAt(text, start)
            : indentOf(text.split('\n')[lineAt(text, start)]) + 2;
        rendered = `${block ? '' : `\n${' '.repeat(indent)}`}${renderBlockMap(value, indent)}`;
    } else if (isMetalist(value)) {
        rendered = renderMetalist(value, columnAt(text, start));
    } else if (Array.isArray(value)) {
        if (isSeq(node) && node.flow !== true && node.items.length > 0) {
            return fail(REFUSALS.blockList);
        }
        rendered = renderFlowList(value, itemStyles(node));
    } else {
        if (isYamlMap(node) || isSeq(node)) return fail(REFUSALS.blockOwn);
        if (isScalar(node) && isBlockScalar(node) && typeof value === 'string') {
            return { text: splice(text, start, end, renderBlockScalar(text, node, value)) };
        }
        rendered = renderScalar(value, isScalar(node) ? node.type : undefined);
        if (rendered.includes('\n')) return fail(REFUSALS.valueOneLine);
    }
    if (start === end && text[start - 1] !== ' ' && text[start - 1] !== '\n') {
        rendered = ` ${rendered}`;
    }
    return { text: splice(text, start, end, rendered) };
}

/** A field the entry has not got, written on its own line at the entry's own indentation. */
export function appendField(
    text: string,
    found: Located,
    field: string,
    value: Exclude<FieldValue, null>
): Written {
    const own = rangeOf(found.node);
    if (own === null) return fail(REFUSALS.entryNoPlace);
    const pad = ' '.repeat(columnAt(text, own[0]));
    const lines = text.split('\n');
    if (isBlockMap(value)) {
        lines.splice(
            found.range.end,
            0,
            `${pad}${field}:`,
            `${pad}  ${renderBlockMap(value, pad.length + 2)}`
        );
        return { text: lines.join('\n') };
    }
    if (isMetalist(value)) {
        lines.splice(
            found.range.end,
            0,
            `${pad}${field}:`,
            `${pad}  ${renderMetalist(value, pad.length + 2)}`
        );
        return { text: lines.join('\n') };
    }
    const rendered = Array.isArray(value) ? renderFlowList(value, []) : renderScalar(value);
    if (rendered.includes('\n')) return fail(REFUSALS.valueOneLine);
    lines.splice(found.range.end, 0, `${pad}${field}: ${rendered}`);
    return { text: lines.join('\n') };
}

/** The whole lines a field occupies, removed. */
export function removeField(text: string, pair: Pair<Scalar, Node>): Written {
    const key = rangeOf(pair.key);
    const end = pairEnd(pair);
    if (key === null || end === null) return fail(REFUSALS.fieldNoPlace);
    const from = lineAt(text, key[0]);
    const to = lineAt(text, Math.max(end - 1, key[0]));
    const lines = text.split('\n');
    lines.splice(from, to - from + 1);
    return { text: lines.join('\n') };
}

/** The line a new key is written on in a map: after its last key's last line. */
export function lastKeyLine(source: string, node: YAMLMap): number | null {
    if (node.items.length === 0) return null;
    const end = pairEnd(node.items[node.items.length - 1] as Pair<Scalar, Node>);
    return end === null ? null : lineAt(source, Math.max(end - 1, 0)) + 1;
}

/** The line after the last one a block map occupies. */
export function lastLineOf(source: string, node: YAMLMap): number | null {
    const range = linesOf(source, node);
    return range === null ? null : range.end;
}
