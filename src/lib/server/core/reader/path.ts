// Layer 2, server. The dotted path a reader row names a value of a JSON or XML answer by, read out
// of the parsed answer.
//
// A path is segments joined by `.`: a name steps into a map, digits index a list, `name[]` takes
// every element of the list at the name (a single value counts as a list of one), and
// `name[field=value]` keeps the elements whose field has that value, several filters following
// each other; a filter with no name before it applies to the value the path is at. `.` alone is
// the answer itself. A value that is null is absent. A map holding `#text`, the text of an XML
// element that also carries attributes, is read as that text. The path answers one value, the
// first it reaches, unless it takes a list with `[]`, when it answers every value it reaches.

import { isMap } from '../../../data/helpers/guards.ts';

/** One filter of a segment: the field and the text its value must be. */
type Filter = { field: string; value: string };

/** One segment of a path: a name or an index, and what follows it in brackets. */
type Segment = { name?: string; index?: number; every: boolean; filters: Filter[] };

/** A parsed path: its segments, and whether it answers a list. */
type ParsedPath = { segments: Segment[]; many: boolean };

/** A value as a list: a list as it is, anything else a list of one. */
function asList(value: unknown): unknown[] {
    return Array.isArray(value) ? value : [value];
}

/** An XML element's text when the value is one with attributes, else the value. */
function textOf(value: unknown): unknown {
    return isMap(value) && '#text' in value ? value['#text'] : value;
}

/** The text a scalar is, for comparing it with a filter's value; undefined for anything else. */
export function scalarText(value: unknown): string | undefined {
    const plain = textOf(value);
    if (typeof plain === 'string') return plain;
    if (typeof plain === 'number' || typeof plain === 'boolean') return String(plain);
    return undefined;
}

/** The path's text split at each `.` that is outside brackets. */
function pieces(path: string): string[] {
    const out: string[] = [];
    let depth = 0;
    let current = '';
    for (const char of path) {
        if (char === '[') depth += 1;
        if (char === ']') depth = Math.max(0, depth - 1);
        if (char === '.' && depth === 0) {
            out.push(current);
            current = '';
        } else current += char;
    }
    out.push(current);
    return out;
}

/** One segment's text read, or null when it is not one. */
function segmentOf(text: string): Segment | null {
    const head = /^([^[\]]*)((?:\[[^\]]*\])*)$/.exec(text);
    if (head === null) return null;
    const segment: Segment = { every: false, filters: [] };
    if (/^\d+$/.test(head[1])) segment.index = Number(head[1]);
    else if (head[1] !== '') segment.name = head[1];
    for (const found of head[2].matchAll(/\[([^\]]*)\]/g)) {
        if (found[1] === '') {
            segment.every = true;
            continue;
        }
        const at = found[1].indexOf('=');
        if (at <= 0) return null;
        segment.filters.push({ field: found[1].slice(0, at), value: found[1].slice(at + 1) });
    }
    return segment;
}

/** A path parsed, or null when one of its segments is not one. */
function parsePath(path: string): ParsedPath | null {
    if (path === '.') return { segments: [], many: false };
    const segments: Segment[] = [];
    for (const piece of pieces(path)) {
        if (piece === '') return null;
        const segment = segmentOf(piece);
        if (segment === null) return null;
        segments.push(segment);
    }
    return { segments, many: segments.some((one) => one.every) };
}

/** Whether an element's field holds the filter's value. */
function kept(element: unknown, filter: Filter): boolean {
    return isMap(element) && scalarText(element[filter.field]) === filter.value;
}

/** The values one segment reaches from the values before it. */
function stepped(values: unknown[], segment: Segment): unknown[] {
    let out = values;
    if (segment.name !== undefined) {
        const name = segment.name;
        out = out.flatMap((value) => {
            if (!isMap(value)) return [];
            const held = Object.hasOwn(value, name) ? value[name] : undefined;
            return held === undefined || held === null ? [] : [held];
        });
    }
    if (segment.index !== undefined) {
        const index = segment.index;
        out = out.flatMap((value) => {
            const held = Array.isArray(value) ? (value[index] as unknown) : undefined;
            return held === undefined || held === null ? [] : [held];
        });
    }
    for (const filter of segment.filters) {
        out = out.flatMap(asList).filter((element) => kept(element, filter));
    }
    if (segment.every) {
        out = out.flatMap(asList).filter((element) => element !== null && element !== undefined);
    }
    return out;
}

/** The values a parsed path reaches in `root`, each XML element read as its text. */
function valuesAt(root: unknown, parsed: ParsedPath): unknown[] {
    let values: unknown[] = root === null || root === undefined ? [] : [root];
    for (const segment of parsed.segments) values = stepped(values, segment);
    return values.map(textOf);
}

/**
 * The value at `path` in `root`: every value it reaches for a path that takes a list with `[]`,
 * else the first, undefined when it reaches none or the path does not parse.
 */
export function readPath(root: unknown, path: string): unknown {
    const parsed = parsePath(path);
    if (parsed === null) return undefined;
    const values = valuesAt(root, parsed);
    return parsed.many ? values : values[0];
}
