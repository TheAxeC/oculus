// Layer 1, data, pure. Where the entries of a deck's `order:` sit in the text of its `present.yml`,
// and the tokens a write names them by.
//
// An entry written in blocks owns the whole lines from its `- ` to the end of its last line, a
// comment ending that line included; a comment on a line of its own between two entries belongs to
// neither. An entry of a list written in a flow owns its own text. The edits of server/edit/
// deck-edit.ts move, add and remove these slots, and the Present view opens the file at the line of
// one.

import { isMap, isSeq, parse, parseDocument } from 'yaml';
import { orderTokens, readSpec } from './spec.ts';

/** One entry of `order:`: its slot in the text, and the line it starts on, from 0. */
type OrderSlot = { from: number; to: number; line: number };

/** The `order:` list of a file: its entries' slots and whether the list is written in a flow. */
export type OrderText = { flow: boolean; slots: OrderSlot[]; keyLine: number };

/** The offset the line an offset sits on begins at. */
function lineStart(source: string, at: number): number {
    return source.lastIndexOf('\n', at - 1) + 1;
}

/** The offset the line a character sits on ends at, before its line break. */
function lineEnd(source: string, at: number): number {
    const eol = source.indexOf('\n', at);
    const end = eol === -1 ? source.length : eol;
    return source[end - 1] === '\r' ? end - 1 : end;
}

/** The number of line breaks before an offset, which is the line it is on, from 0. */
function lineOf(source: string, at: number): number {
    let line = 0;
    for (
        let held = source.indexOf('\n');
        held !== -1 && held < at;
        held = source.indexOf('\n', held + 1)
    ) {
        line += 1;
    }
    return line;
}

/**
 * The slots of the top-level `order:` list, or null when the file has none, holds it as anything
 * but a list, or does not parse.
 */
export function orderText(source: string): OrderText | null {
    const root = parseDocument(source).contents;
    if (!isMap(root)) return null;
    const pair = root.items.find((one) => {
        const key = one.key as { value?: unknown } | null;
        return key?.value === 'order';
    });
    const list = pair?.value;
    const keyAt = (pair?.key as { range?: number[] } | null)?.range?.[0];
    if (!isSeq(list) || keyAt === undefined) return null;
    const slots: OrderSlot[] = [];
    for (const item of list.items) {
        const range = (item as { range?: number[] | null } | null)?.range;
        if (range === undefined || range === null) return null;
        let end = range[1];
        while (end > range[0] && /\s/.test(source[end - 1])) end -= 1;
        const from = list.flow === true ? range[0] : lineStart(source, range[0]);
        const to = list.flow === true ? end : lineEnd(source, Math.max(end - 1, range[0]));
        slots.push({ from, to, line: lineOf(source, from) });
    }
    return { flow: list.flow === true, slots, keyLine: lineOf(source, keyAt) };
}

/**
 * The tokens of the entries of `order:` in the order the file lists them, or null when the file
 * holds no list, does not parse, or holds an entry the reader does not know, which no write can
 * name.
 */
export function orderTokensIn(source: string): string[] | null {
    let parsed: unknown;
    try {
        parsed = parse(source);
    } catch {
        return null;
    }
    const slots = orderText(source);
    const spec = readSpec(parsed, () => undefined);
    if (spec?.order.length !== slots?.slots.length || spec === null) return null;
    return orderTokens(spec.order);
}
