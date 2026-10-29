// Layer 1, data. What is wrong with a reader row or a `links` row of a hub's `.oculus/config.yml`,
// found the moment the row is read, so a mistake shows as a finding of the file in Settings and
// the Audit, never as a failure of a search.
//
// A key the grammar does not know is named and dropped, and the row is read without it. A row is
// left out, with the reason, when a key's value is not of its shape, a key its format needs is
// missing (every row names `records`; every row but one of format `none` names `address`), an
// address is not `https:` or holds a hole in its origin, a pattern does not compile, a hole names
// an operation there is none of, or its `key` is empty or repeats an earlier row's. Each reason is
// a RowIssue the findings word (config/catalogs.ts).

import type { z } from 'zod';
import { isMap } from '../../../../helpers/guards.ts';
import {
    linkRowShape,
    readerRowShape,
    type FieldSpec,
    type LinkRow,
    type ReaderRow,
    type Step
} from './grammar.ts';
import { HOLE_OPS, holesOf, originOf } from './holes.ts';

/**
 * One thing wrong with a row, naming the key inside it as a dotted path: `unknown` a key the
 * grammar does not know (the row is read without it), `missing` a key the row needs, `value` a
 * value not of its key's shape, `https` an address that is not `https:`, `origin` an address with a
 * hole in its origin, `pattern` a pattern that does not compile, `op` a hole operation there is
 * none of, `empty` a row with an empty key, `repeat` a row whose key an earlier row holds, `shape`
 * a value that is not a row. All but `unknown` leave the row out.
 */
export type RowIssue = {
    kind:
        | 'unknown'
        | 'missing'
        | 'value'
        | 'https'
        | 'origin'
        | 'pattern'
        | 'op'
        | 'empty'
        | 'repeat'
        | 'shape';
    /** The row, by its key, or by its place in the list when it has none. */
    row: string;
    /** The key inside the row the issue is at, empty for the row itself. */
    at: string;
};

/** A row read, or left out, with the issues found in it. */
export type Checked<T> = { row: T | null; issues: RowIssue[] };

/** A path of zod's as a dotted key. */
function dotted(path: readonly PropertyKey[]): string {
    return path
        .map((part, at) =>
            typeof part === 'number' ? `[${String(part)}]` : `${at === 0 ? '' : '.'}${String(part)}`
        )
        .join('');
}

/** A copy of a value with the key at `path` and `name` taken out. */
function without(value: unknown, path: readonly PropertyKey[], name: string): unknown {
    if (path.length === 0) {
        if (!isMap(value)) return value;
        return Object.fromEntries(Object.entries(value).filter(([key]) => key !== name));
    }
    const [head, ...rest] = path;
    if (Array.isArray(value) && typeof head === 'number') {
        return (value as unknown[]).map((one, at) =>
            at === head ? without(one, rest, name) : one
        );
    }
    if (isMap(value) && typeof head === 'string') {
        return { ...value, [head]: without(value[head], rest, name) };
    }
    return value;
}

/** The label of a row in the findings: its key, or its place in the list. */
function labelOf(raw: unknown, at: number): string {
    const key = isMap(raw) ? raw.key : undefined;
    return typeof key === 'string' && key.trim() !== '' ? key : `#${String(at + 1)}`;
}

/** A key the shape does not know: the path of the map that holds it, and its name. */
type Unknown = { path: PropertyKey[]; name: string };

/**
 * The unknown keys of a union that failed: those of the branch whose only issues are unknown keys,
 * since that branch is the one the value was written for; null when no branch is such.
 */
function unionUnknown(issue: z.core.$ZodIssue, base: PropertyKey[]): Unknown[] | null {
    if (issue.code !== 'invalid_union') return null;
    for (const branch of issue.errors) {
        const found = onlyUnknown(branch, base);
        if (found !== null && found.length > 0) return found;
    }
    return null;
}

/** The unknown keys of a list of issues that are all unknown keys, else null. */
function onlyUnknown(issues: readonly z.core.$ZodIssue[], base: PropertyKey[]): Unknown[] | null {
    const found: Unknown[] = [];
    for (const issue of issues) {
        const path = [...base, ...issue.path];
        if (issue.code === 'unrecognized_keys') {
            found.push(...issue.keys.map((name) => ({ path, name })));
            continue;
        }
        const inner = unionUnknown(issue, path);
        if (inner === null) return null;
        found.push(...inner);
    }
    return found;
}

/** The keys the issues name as unknown, those of a union's branch included (`unionUnknown`). */
function unknownKeys(issues: readonly z.core.$ZodIssue[]): Unknown[] {
    return issues.flatMap((issue): Unknown[] => {
        if (issue.code === 'unrecognized_keys') {
            return issue.keys.map((name) => ({ path: [...issue.path], name }));
        }
        return unionUnknown(issue, [...issue.path]) ?? [];
    });
}

/** The value at a path of zod's in a parsed value. */
function valueAt(value: unknown, path: readonly PropertyKey[]): unknown {
    let at = value;
    for (const part of path) {
        if (Array.isArray(at) && typeof part === 'number') at = at[part] as unknown;
        else if (isMap(at) && typeof part === 'string') at = at[part];
        else return undefined;
    }
    return at;
}

/**
 * A row parsed by a strict shape: each key the shape does not know named and dropped, and the
 * row parsed again without it, until it reads or fails for another reason.
 */
function parsed<T>(shape: z.ZodType<T>, raw: unknown, row: string): Checked<T> {
    const issues: RowIssue[] = [];
    let value = raw;
    for (let round = 0; round < 50; round += 1) {
        const read = shape.safeParse(value);
        if (read.success) return { row: read.data, issues };
        const unknown = unknownKeys(read.error.issues);
        if (unknown.length === 0) {
            const first = read.error.issues[0];
            const missing =
                first.code === 'invalid_type' && valueAt(value, first.path) === undefined;
            issues.push({ kind: missing ? 'missing' : 'value', row, at: dotted(first.path) });
            return { row: null, issues };
        }
        for (const { path, name } of unknown) {
            issues.push({ kind: 'unknown', row, at: dotted([...path, name]) });
            value = without(value, path, name);
        }
    }
    return { row: null, issues };
}

/** Whether a pattern compiles. */
function compiles(pattern: string): boolean {
    try {
        new RegExp(pattern);
        return true;
    } catch {
        return false;
    }
}

/** The issue of one address of a row, or null when it is `https:` with no hole in its origin. */
function addressIssue(address: string, row: string, at: string): RowIssue | null {
    if (!address.startsWith('https://')) return { kind: 'https', row, at };
    if (holesOf(originOf(address)).length > 0) return { kind: 'origin', row, at };
    return null;
}

/** The issue of a text's holes: one naming an operation there is none of. */
function opIssue(text: string, row: string, at: string): RowIssue | null {
    const ops: readonly string[] = HOLE_OPS;
    const wrong = holesOf(text).some((hole) => hole.op !== undefined && !ops.includes(hole.op));
    return wrong ? { kind: 'op', row, at } : null;
}

/** The issues of a field spec's patterns and hole operations. */
function fieldIssues(spec: FieldSpec, row: string, at: string): RowIssue[] {
    if (typeof spec === 'string') {
        const issue = opIssue(spec, row, at);
        return issue === null ? [] : [issue];
    }
    const issues: RowIssue[] = [];
    if (spec.pattern !== undefined && !compiles(spec.pattern)) {
        issues.push({ kind: 'pattern', row, at: `${at}.pattern` });
    }
    if (spec.each !== undefined) issues.push(...fieldIssues(spec.each, row, `${at}.each`));
    if (spec.else !== undefined) issues.push(...fieldIssues(spec.else, row, `${at}.else`));
    return issues;
}

/** The issues of a map of fields. */
function fieldsIssues(
    fields: Record<string, FieldSpec> | undefined,
    row: string,
    at: string
): RowIssue[] {
    return Object.entries(fields ?? {}).flatMap(([name, spec]) =>
        fieldIssues(spec, row, `${at}.${name}`)
    );
}

/** The issues of a request's address, texts and fields, and of the steps that follow it. */
function requestIssues(part: ReaderRow | Step, row: string, at: string): RowIssue[] {
    const issues: RowIssue[] = [];
    const prefix = at === '' ? '' : `${at}.`;
    if (part.address !== undefined) {
        const issue =
            addressIssue(part.address, row, `${prefix}address`) ??
            opIssue(part.address, row, `${prefix}address`);
        if (issue !== null) issues.push(issue);
    }
    for (const [name, text] of Object.entries({ ...part.params, ...part.headers })) {
        const issue = opIssue(text, row, `${prefix}params.${name}`);
        if (issue !== null) issues.push(issue);
    }
    issues.push(...fieldsIssues(part.fields, row, `${prefix}fields`));
    (part.then ?? []).forEach((step, place) => {
        issues.push(...requestIssues(step, row, `${prefix}then[${String(place)}]`));
    });
    return issues;
}

/** The issues of the keys only a reader row carries: its terms, archive, access and patterns. */
function rowIssues(row: ReaderRow, label: string): RowIssue[] {
    const issues = requestIssues(row, label, '');
    if (row.format !== 'none' && row.address === undefined) {
        issues.push({ kind: 'missing', row: label, at: 'address' });
    }
    // A row with steps may leave `records` out: its answer is then the one record its steps take.
    if (row.records === undefined && row.then === undefined) {
        issues.push({ kind: 'missing', row: label, at: 'records' });
    }
    for (const [name, term] of Object.entries(row.query ?? {})) {
        if (term.address !== undefined) {
            const issue = addressIssue(term.address, label, `query.${name}.address`);
            if (issue !== null) issues.push(issue);
        }
        if (term.match !== undefined && !compiles(term.match)) {
            issues.push({ kind: 'pattern', row: label, at: `query.${name}.match` });
        }
        for (const text of [term.text ?? '', ...Object.values(term.params ?? {})]) {
            const issue = opIssue(text, label, `query.${name}`);
            if (issue !== null) issues.push(issue);
        }
        issues.push(...fieldsIssues(term.fields, label, `query.${name}.fields`));
    }
    for (const [key, address] of [
        ['archive.address', row.archive?.address],
        ['access.address', row.access?.address]
    ] as const) {
        if (address === undefined) continue;
        const issue = addressIssue(address, label, key);
        if (issue !== null) issues.push(issue);
    }
    if (row.archive?.match !== undefined && !compiles(row.archive.match)) {
        issues.push({ kind: 'pattern', row: label, at: 'archive.match' });
    }
    for (const [name, pattern] of Object.entries(row.holes ?? {})) {
        if (!compiles(pattern)) issues.push({ kind: 'pattern', row: label, at: `holes.${name}` });
    }
    return issues;
}

/** A reader row checked: read with its unknown keys dropped, or left out with why. */
export function checkReaderRow(raw: unknown, at: number): Checked<ReaderRow> {
    const label = labelOf(raw, at);
    if (!isMap(raw)) return { row: null, issues: [{ kind: 'shape', row: label, at: '' }] };
    const read = parsed(readerRowShape, raw, label);
    if (read.row === null) return read;
    if (read.row.key.trim() === '') {
        return { row: null, issues: [...read.issues, { kind: 'empty', row: label, at: 'key' }] };
    }
    const issues = rowIssues(read.row, label);
    return { row: issues.length === 0 ? read.row : null, issues: [...read.issues, ...issues] };
}

/** A `links` row checked as a reader row is. */
export function checkLinkRow(raw: unknown, at: number): Checked<LinkRow> {
    const label = labelOf(raw, at);
    if (!isMap(raw)) return { row: null, issues: [{ kind: 'shape', row: label, at: '' }] };
    const read = parsed(linkRowShape, raw, label);
    if (read.row === null) return read;
    if (read.row.key.trim() === '') {
        return { row: null, issues: [...read.issues, { kind: 'empty', row: label, at: 'key' }] };
    }
    const issue =
        addressIssue(read.row.address, label, 'address') ??
        opIssue(read.row.address, label, 'address');
    return issue === null ? read : { row: null, issues: [...read.issues, issue] };
}

/**
 * The rows of a list, each checked, a row whose key an earlier row holds left out; a value that is
 * no list gives no row and one issue.
 */
export function checkRows<T extends { key: string }>(
    raw: unknown,
    check: (one: unknown, at: number) => Checked<T>
): { rows: T[]; issues: RowIssue[] } {
    if (raw === undefined || raw === null) return { rows: [], issues: [] };
    if (!Array.isArray(raw)) return { rows: [], issues: [{ kind: 'shape', row: '', at: '' }] };
    const rows: T[] = [];
    const issues: RowIssue[] = [];
    raw.forEach((one: unknown, at) => {
        const read = check(one, at);
        issues.push(...read.issues);
        if (read.row === null) return;
        if (rows.some((held) => held.key === read.row?.key)) {
            issues.push({ kind: 'repeat', row: read.row.key, at: 'key' });
            return;
        }
        rows.push(read.row);
    });
    return { rows, issues };
}
