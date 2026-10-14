// Layer 1, data. A collection file's entry list as text: the key the list stands under, where a new
// entry's lines go, which fields that entry is written with, and where an existing entry stands.
//
// The server's writers (server/edit/entry-edit/) insert an entry into a file on disk, and the page
// builds the same entry in a source tab's unsaved text, so the placement rule lives here once and
// both import it. The page's side is a stub: the entry's first key, the fields the file's schema
// requires, `status`, and the fields the caller names, each with the empty value of its type, and
// the caret placed where the reader types next. A result is parsed again before it is answered and
// is refused unless it holds the same entries plus one and every other key unchanged.
//
// A scalar is written by `renderScalar`, which both layers use for every value they put in a file.

import { isEqual } from 'lodash-es';
import { isMap as isYamlMap, isScalar, isSeq, parseDocument, stringify } from 'yaml';
import type { Document, Node, Pair, Scalar, YAMLMap, YAMLSeq } from 'yaml';
import { optionKey, type SchemaField, type When } from '../../../model/index.ts';
import {
    editsBetween,
    textInRange,
    withoutMark,
    type TextEdit
} from '../../../prose/text-edits.ts';
import { byKey, isMap, scalar } from '../../guards.ts';
import { columnOf, pairOf, rangeOf, valueEnd } from './yaml-ranges.ts';

/** The collection list key whose entries the writers locate and edit. */
export const LIST = 'entries';

/** The field a registry keys its entries by when that is not the first field of its schema. */
export const KEYED_FIELDS: Record<string, string> = { venues: 'id' };

/** A scalar a file's value can be written as. */
export type ScalarFieldValue = string | number | boolean | null;

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

/**
 * Whether a range of a text is one YAML scalar that reads as `key`, in whatever quoting it is
 * written. The page asks it of every edited range of a file as it is read, before it shows or makes
 * the edit of a rename, so a file that changed since the edit was computed is not edited at places
 * that moved.
 */
export function holdsKey(text: string, range: TextEdit['range'], key: string): boolean {
    const held = textInRange(withoutMark(text), range);
    if (held === null) return false;
    const read = parseDocument(held, { schema: 'failsafe' });
    return (
        read.errors.length === 0 && isScalar(read.contents) && scalar(read.contents.value) === key
    );
}

/** The line a byte offset sits on, counting from zero. */
export function lineAt(text: string, at: number): number {
    let count = 0;
    const to = Math.min(at, text.length);
    for (let index = 0; index < to; index += 1) if (text[index] === '\n') count += 1;
    return count;
}

/**
 * The list of records a collection file holds: `entries:` when it has one, else the first list of
 * maps that is not the file's own `schema:`. A file with neither has no entries to write.
 */
export function listOf(root: YAMLMap): { key: string; seq: YAMLSeq } | null {
    const direct = pairOf(root, LIST);
    if (direct?.value != null && isSeq(direct.value)) {
        return { key: LIST, seq: direct.value };
    }
    for (const item of root.items as Pair<Scalar, Node>[]) {
        const name = (item.key as Scalar | undefined)?.value;
        if (typeof name !== 'string' || name === 'schema') continue;
        const value = item.value;
        if (value === null || !isSeq(value)) continue;
        if (value.items.length === 0 || isYamlMap(value.items[0])) return { key: name, seq: value };
    }
    return null;
}

/** A condition without its `path` key, the part a record can state about its own fields. */
export function withoutPath(when: When): When {
    return Object.fromEntries(Object.entries(when).filter(([name]) => name !== 'path'));
}

/** Whether a condition holds over a record's own values: each key matches one value of its list. */
function holds(when: When, values: Record<string, unknown>): boolean {
    return Object.entries(withoutPath(when)).every(([name, wanted]) =>
        (Array.isArray(wanted) ? wanted : [wanted]).includes(values[name] as string)
    );
}

/**
 * The n-th (from 0) map of a list whose `field` holds `value` read as text, with the node of that
 * value. This is the one walk that finds an entry by its identity: the line of a repeated registry
 * key and the place an Edit opens at both come from it.
 */
export function itemWith(
    seq: YAMLSeq,
    field: string,
    value: string,
    nth = 0
): { item: YAMLMap; held: Scalar } | null {
    let seen = 0;
    for (const item of seq.items) {
        if (!isYamlMap(item)) continue;
        const held = item.get(field, true);
        if (!isScalar(held) || scalar(held.value) !== value) continue;
        if (seen === nth) return { item, held };
        seen += 1;
    }
    return null;
}

/** Why no entry can be placed or found in a text, and the line (from 1) a tab opens at. */
export type EntryRefusal = {
    code: 'file_unparsed' | 'list_inline' | 'list_not_a_list' | 'stub_unparsed';
    line: number;
    /** The key of the list for `list_not_a_list`, else the empty string. */
    key: string;
};

/** A place in a text: the line and the column from 1, the way the editor counts them. */
export type TextPlace = { line: number; column: number };

/** Where a new entry's lines go in a text, and how the list's own items are indented. */
export type EntryPlace = {
    /** The key the list stands under, `entries` for a file with none. */
    list: string;
    /** The line (from 0) the new lines are put before, and the lines that go ahead of the entry. */
    at: number;
    lead: string[];
    /** The range of a flow list `[]` on the key's line to take out, as offsets in that line. */
    flow: { line: number; from: number; to: number } | null;
    /** The column of an item's dash and of its first key. */
    dash: number;
    key: number;
    /** The lines (from 0, end excluded) of the list's last item; null when the list has none. */
    last: { start: number; end: number } | null;
    /** True for a file with no list key, whose text is written from its trailing line on. */
    fresh: boolean;
};

/** The text as a parsed document with a map of keys, or the refusal; an empty text has no map. */
function readRoot(source: string): { doc: Document; root: YAMLMap | null } | EntryRefusal {
    const doc = parseDocument(source);
    if (doc.errors.length > 0) {
        return { code: 'file_unparsed', line: lineAt(source, doc.errors[0].pos[0]) + 1, key: '' };
    }
    if (doc.contents === null) return { doc, root: null };
    if (!isYamlMap(doc.contents)) return { code: 'file_unparsed', line: 1, key: '' };
    return { doc, root: doc.contents };
}

/** The text's line break, which the inserted lines are joined with. */
function lineBreak(source: string): string {
    return source.includes('\r\n') ? '\r\n' : '\n';
}

/**
 * Where a new entry's lines go: after the last item of a block list (the line after its last value
 * line, a blank line first); in place of `[]` for an empty flow list; under the key when it holds
 * nothing; at the end of the file, a blank line and `entries:` first, when the file has no list. A
 * flow list that holds entries, a list key that holds a scalar or a map, and a text that does not
 * parse are refused with the line to open at.
 */
export function entryPlace(source: string): EntryPlace | EntryRefusal {
    const read = readRoot(source);
    if ('code' in read) return read;
    const { root } = read;
    const lines = source.split(lineBreak(source));
    const fresh = (): EntryPlace => {
        while (lines.length > 0 && lines[lines.length - 1].trim() === '') lines.pop();
        const empty = lines.length === 0;
        return {
            list: LIST,
            at: lines.length,
            lead: empty ? [`${LIST}:`] : ['', `${LIST}:`],
            flow: null,
            dash: 2,
            key: 4,
            last: null,
            fresh: true
        };
    };
    if (root === null) return fresh();
    const listed = listOf(root);
    const pair = pairOf(root, listed === null ? LIST : listed.key);
    if (pair === undefined) return fresh();
    const key = rangeOf(pair.key);
    if (key === null) return { code: 'file_unparsed', line: 1, key: '' };
    const keyLine = lineAt(source, key[0]);
    const value = pair.value;
    const name = String(pair.key.value);
    const empty = value === null || (isScalar(value) && value.value === null);
    if (!empty && !isSeq(value)) {
        return { code: 'list_not_a_list', line: keyLine + 1, key: name };
    }
    const base = columnOf(source, key[0]);
    const under = { list: name, dash: base + 2, key: base + 4, last: null, fresh: false };
    if (empty) return { ...under, at: keyLine + 1, lead: [], flow: null };
    const seq = value as YAMLSeq;
    if (seq.flow === true) {
        if (seq.items.length > 0) return { code: 'list_inline', line: keyLine + 1, key: name };
        const at = rangeOf(seq);
        if (at === null || lineAt(source, at[1] - 1) !== keyLine) {
            return { code: 'file_unparsed', line: keyLine + 1, key: '' };
        }
        const start = source.lastIndexOf('\n', key[0] - 1) + 1;
        return {
            ...under,
            at: keyLine + 1,
            lead: [],
            flow: { line: keyLine, from: at[0] - start, to: at[1] - start }
        };
    }
    if (seq.items.length === 0) return { ...under, at: keyLine + 1, lead: [], flow: null };
    const tail = seq.items[seq.items.length - 1] as Node;
    const last = lineAt(source, Math.max(valueEnd(tail) - 1, 0));
    const open = rangeOf(tail);
    let dash = base + 2;
    let first = base + 4;
    let start = last;
    if (open !== null) {
        const dashAt = source.lastIndexOf('-', open[0]);
        first = columnOf(source, open[0]);
        dash = dashAt >= 0 ? columnOf(source, dashAt) : first - 2;
        start = lineAt(source, dashAt >= 0 ? dashAt : open[0]);
        if (first <= dash || lineAt(source, open[0]) !== start) first = dash + 2;
    }
    return {
        list: name,
        at: last + 1,
        lead: [''],
        flow: null,
        dash,
        key: first,
        last: { start, end: last + 1 },
        fresh: false
    };
}

/** What a field is written as in a stub: the caller's value, a first option, or the empty value. */
function stubValueOf(field: SchemaField, values: Record<string, unknown>): ScalarFieldValue {
    const given = values[field.field];
    if (typeof given === 'string' || typeof given === 'number' || typeof given === 'boolean') {
        return given;
    }
    const first = field.options?.at(0);
    if (field.type === 'select' && first !== undefined) return optionKey(first);
    return field.type === 'text' || field.type === 'textarea' ? '' : null;
}

/**
 * The fields a new entry is written with, in schema order: the first field (`title` when the file
 * has no schema), the collection's keyed field, each field that is required (a condition read over
 * the entry's own written values), `status`, and each field the caller names. A field whose `when`
 * does not hold over those values is left out, whatever else asks for it, since the file would then
 * carry a field outside its condition.
 */
function stubFields(
    schema: SchemaField[],
    collection: string,
    values: Record<string, unknown>
): [SchemaField, ScalarFieldValue][] {
    const fields = schema.length > 0 ? schema : [{ field: 'title', type: 'text' }];
    const first = fields[0].field;
    const keyed = byKey(KEYED_FIELDS, collection);
    const wanted = (field: SchemaField, held: Record<string, unknown>): boolean => {
        if (field.field === first || field.field === keyed || field.field === 'status') return true;
        if (Object.hasOwn(values, field.field) || field.required === true) return true;
        return typeof field.required === 'object' && holds(field.required.when, held);
    };
    let held: Record<string, ScalarFieldValue> = {};
    for (let pass = 0; pass <= fields.length; pass += 1) {
        const next = Object.fromEntries(
            fields
                .filter(
                    (one) => wanted(one, held) && (one.when === undefined || holds(one.when, held))
                )
                .map((one) => [one.field, stubValueOf(one, values)])
        );
        if (isEqual(next, held)) break;
        held = next;
    }
    return fields
        .filter((one) => Object.hasOwn(held, one.field))
        .map((one) => [one, held[one.field]]);
}

/** The lines of a new entry at the list's own indentation, and where the caret goes in them. */
function entryLines(
    schema: SchemaField[],
    collection: string,
    values: Record<string, unknown>,
    place: Pick<EntryPlace, 'dash' | 'key'>
): { lines: string[]; caret: TextPlace } {
    const chosen = stubFields(schema, collection, values);
    const lines = chosen.map(([field, value], at) => {
        const written = value === null ? '' : ` ${renderScalar(value)}`;
        const head =
            at === 0
                ? `${' '.repeat(place.dash)}-${' '.repeat(place.key - place.dash - 1)}`
                : ' '.repeat(place.key);
        return `${head}${field.field}:${written}`;
    });
    const empty = chosen.findIndex(([, value]) => value === '');
    // Line and column count from 1, so the caret between the two quotes sits at the line's length.
    const caret =
        empty >= 0
            ? { line: empty + 1, column: lines[empty].length }
            : { line: 1, column: lines[0].length + 1 };
    return { lines, caret };
}

/** The items of a parsed list, empty for a key that holds nothing or something else. */
function itemsOf(held: unknown): unknown[] {
    return Array.isArray(held) ? held : [];
}

/** The parsed values of a text, or null when it does not parse into a map of keys. */
function valuesOf(text: string): Record<string, unknown> | null {
    const doc = parseDocument(text);
    if (doc.errors.length > 0) return null;
    const held: unknown = doc.contents === null ? {} : doc.toJS();
    return isMap(held) ? held : null;
}

/**
 * Whether a text holds the list of the source with one entry more and every other key as it was.
 */
function grewByOne(source: string, text: string, list: string): boolean {
    const before = valuesOf(source);
    const after = valuesOf(text);
    if (before === null || after === null) return false;
    const had = itemsOf(before[list]);
    const has = itemsOf(after[list]);
    const rest = (held: Record<string, unknown>): Record<string, unknown> =>
        Object.fromEntries(Object.entries(held).filter(([name]) => name !== list));
    return (
        has.length === had.length + 1 &&
        isEqual(has.slice(0, had.length), had) &&
        isEqual(rest(after), rest(before))
    );
}

/**
 * What a stub gives: the text with the entry in it, the caret, and the edits that make the text.
 */
export type Stub = { text: string; line: number; column: number; edits: TextEdit[] };

/** Whether the list's last item is exactly the lines a stub of these arguments is written as. */
function isUntouchedStub(source: string, place: EntryPlace, made: string[]): boolean {
    if (place.last === null) return false;
    const held = source.split(lineBreak(source)).slice(place.last.start, place.last.end);
    return isEqual(held, made);
}

/**
 * The source with a new entry placed by `entryPlace`, the caret inside the quotes of the entry's
 * first `""` (the end of its first line when it has none), and the edits that turn the source into
 * the text. The list's last item being exactly such an entry already, that entry's place is
 * answered and nothing is edited. A result that does not parse back into the same entries plus one
 * is refused.
 */
export function entryStub(
    source: string,
    schema: SchemaField[] | undefined,
    collection: string,
    values: Record<string, unknown> = {}
): Stub | EntryRefusal {
    const place = entryPlace(source);
    if ('code' in place) return place;
    const made = entryLines(schema ?? [], collection, values, place);
    if (isUntouchedStub(source, place, made.lines) && place.last !== null) {
        const { line, column } = made.caret;
        return { text: source, line: place.last.start + line, column, edits: [] };
    }
    const eol = lineBreak(source);
    const lines = source.split(eol);
    if (place.flow !== null) {
        const held = lines[place.flow.line];
        lines[place.flow.line] =
            held.slice(0, place.flow.from).trimEnd() + held.slice(place.flow.to);
    }
    if (place.fresh) while (lines.length > 0 && lines[lines.length - 1].trim() === '') lines.pop();
    lines.splice(place.at, 0, ...place.lead, ...made.lines);
    const text = lines.join(eol) + (place.fresh ? eol : '');
    if (!grewByOne(source, text, place.list)) {
        return { code: 'stub_unparsed', line: place.at + 1, key: '' };
    }
    const first = place.at + place.lead.length;
    return {
        text,
        line: first + made.caret.line,
        column: made.caret.column,
        edits: editsBetween(source, text)
    };
}

/** The place just after the first key of a map and its colon, where the reader edits it. */
function afterFirstKey(source: string, item: YAMLMap): TextPlace | null {
    const first = item.items[0] as Pair<Scalar, Node> | undefined;
    const key = first === undefined ? null : rangeOf(first.key);
    if (key === null) return null;
    let at = key[1];
    if (source[at] === ':') at += 1;
    if (source[at] === ' ') at += 1;
    return { line: lineAt(source, key[0]) + 1, column: columnOf(source, at) + 1 };
}

/** The list a text holds, or the refusal; null for a text with no list. */
function listAt(source: string): YAMLSeq | EntryRefusal | null {
    const read = readRoot(source);
    if ('code' in read) return read;
    return read.root === null ? null : (listOf(read.root)?.seq ?? null);
}

/**
 * Where the n-th (from 0) entry whose `field` holds `value` stands: its first key's line and the
 * column after that key. Null when the text holds no such entry.
 */
export function entryAt(
    source: string,
    field: string,
    value: string,
    nth = 0
): TextPlace | EntryRefusal | null {
    const seq = listAt(source);
    if (seq === null || 'code' in seq) return seq;
    const found = itemWith(seq, field, value, nth);
    return found === null ? null : afterFirstKey(source, found.item);
}

/** Where the entry at a position (from 0) of the list stands, as `entryAt` places an entry. */
export function entryAtIndex(source: string, index: number): TextPlace | EntryRefusal | null {
    const seq = listAt(source);
    if (seq === null || 'code' in seq) return seq;
    const item = seq.items[index];
    return isYamlMap(item) ? afterFirstKey(source, item) : null;
}
