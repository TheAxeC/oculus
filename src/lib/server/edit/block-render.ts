// Layer 2, server, pure. How a value is written into a YAML text: a scalar as the `yaml` library's
// own scalar writer quotes it (CST.setScalarValue), a key likewise, and a value as one line of flow
// YAML. block-edit.ts renders the items it adds with these.
//
// CST.setScalarValue runs no schema, so a string that a reader takes for a boolean, a null or a
// number comes out plain. scalarSource tells the library where the scalar stands (`inFlow` inside
// a flow collection, `implicitKey` for a key), reads each result back with the library's parser,
// and when it is not the string given writes the string double-quoted, which is the library's own
// advice for such a value. A string holding a line break is always double-quoted: the plain form
// continues on the next line, which a line of the file cannot carry.
//
// A flow collection is joined here, not by `stringify`: the files write a map as `{ a: 1 }` and a
// list as `[a, b]`, and `stringify` pads both or neither, so it would write `[ a, b ]` inside an
// item whose siblings write `[a, b]`.

import { CST, parse } from 'yaml';

type Type = 'PLAIN' | 'QUOTE_DOUBLE';

/** Whether the source text reads back, through the library's parser, as exactly this string. */
function readsAs(source: string, value: string): boolean {
    try {
        return parse(source) === value;
    } catch {
        return false;
    }
}

/** A scalar token the library may overwrite: a copy of the old one, or an empty plain one. */
function tokenFrom(from: CST.FlowScalar | undefined): CST.FlowScalar {
    return from === undefined
        ? { type: 'scalar', offset: 0, indent: 0, source: '', end: [] }
        : structuredClone(from);
}

/**
 * A scalar as source text, in the quote style of the scalar it replaces (`from`) and plain
 * otherwise, or null for a value that is not a scalar or a number that is not finite. `flow` is
 * whether the scalar stands inside a flow collection, `key` whether it is a map key.
 */
export function scalarSource(
    value: unknown,
    flow: boolean,
    from?: CST.FlowScalar,
    key = false
): string | null {
    if (typeof value === 'number' && !Number.isFinite(value)) return null;
    let text: string;
    if (typeof value === 'string') text = value;
    else if (typeof value === 'number' || typeof value === 'boolean') text = String(value);
    else if (value === null || value === undefined) text = 'null';
    else return null;
    const token = tokenFrom(from);
    const broken = typeof value === 'string' && /[\r\n]/.test(value);
    // A string with a line break is written as an implicit key is, on one line with `\n` escaped:
    // the library writes it over several lines otherwise, which the lines of a file cannot carry.
    const write = (type: Type | undefined): void =>
        CST.setScalarValue(token, text, { inFlow: flow, implicitKey: key || broken, type });
    const isFlowScalar = (): boolean => (token as { type: string }).type !== 'block-scalar';
    if (!broken) {
        write(typeof value === 'string' ? undefined : 'PLAIN');
        if (typeof value !== 'string') return token.source;
        if (isFlowScalar() && readsAs(token.source, value)) return token.source;
    }
    write('QUOTE_DOUBLE');
    return isFlowScalar() && readsAs(token.source, text) ? token.source : null;
}

/** A key as the text writes it: `flow` when it stands in a flow map, else as a block map key. */
export function keyText(key: string, flow = false): string {
    return scalarSource(key, flow, undefined, true) ?? JSON.stringify(key);
}

/** A value as one line of flow YAML: `{ a: 1, b: [x, y] }`. */
export function flowSource(value: unknown): string {
    if (Array.isArray(value)) {
        return value.length === 0 ? '[]' : `[${value.map(flowSource).join(', ')}]`;
    }
    if (value !== null && typeof value === 'object') {
        const entries = Object.entries(value);
        if (entries.length === 0) return '{}';
        const pairs = entries.map(([key, item]) => `${keyText(key, true)}: ${flowSource(item)}`);
        return `{ ${pairs.join(', ')} }`;
    }
    return scalarSource(value, true) ?? JSON.stringify(value);
}
