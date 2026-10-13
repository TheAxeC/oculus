// Layer 2, client state. The values of an entry form: what a saved value of a schema field becomes
// while it is edited, what an edit becomes when it is saved, and whether the two differ. Pure, so
// the editor of a collection entry, a feed entry, a person and the career file is tested without a
// browser.
//
// An edit is plain JSON, so the draft in the ui store (form-draft.ts) can keep it across a reload:
//   text, textarea, select, date  a string
//   tags                          a list of strings
//   checkbox                      a boolean
//   metalist                      a list of { label, value } rows
//   records                       a RecordsEdit, in one of the four shapes below
//
// A `records` field holds a list of records, one record, a map from a name to one record, or a map
// of label-value rows. The saved value decides which (a list is a list, a map with the fields
// declared is one record, a map with none is rows, and a field marked `map` is named records); a
// field the entry has no value for takes the shape of another entry's value, and then the schema's.
//
// A record draws the fields its schema declares and, when the schema says it is `open`, one row
// per key it does not declare. A key whose value is no text, number or boolean is kept as it is
// and not drawn.
//
// What a save writes is the payload of an edit: text trimmed and empty text as null (which clears
// the field), the saved value itself when the edit says the same words (so a number stays a
// number), empty records and rows left out. Whether a field is changed is whether its payload
// differs from the payload of the untouched edit, so a field the form cannot say differently from
// the file is never a change.

import { isMap, scalar } from '../../data/helpers/guards.ts';
import { asList, asText, type FormField } from './schema.ts';

/** One label-value row: a metalist item, an unnamed key of a record, or a fact of a strip. */
export type Row = { label: string; value: string };

/** One record being edited: its declared fields, its unnamed keys as rows, and what is kept. */
export type RecordEdit = {
    fields: Record<string, unknown>;
    rows: Row[];
    /** The keys of the saved record that are neither declared nor text, written back unchanged. */
    kept: Record<string, unknown>;
    /** Where the record was in the saved value: its place in a list or its name in a map. */
    src?: string | number;
};

/** One record of a map from a name to one record. */
export type NamedEdit = { label: string; record: RecordEdit; src?: string };

/** The four shapes of a `records` field. */
export type RecordsEdit =
    | { shape: 'list'; items: RecordEdit[] }
    | { shape: 'one'; item: RecordEdit }
    | { shape: 'labels'; rows: Row[] }
    | { shape: 'named'; items: NamedEdit[] };

/** Whether a value is text, a number or a boolean, which a row can hold. */
function isPlain(value: unknown): value is string | number | boolean {
    return typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean';
}

/** The saved value when it says the words typed (so a number stays a number), else the words. */
function keepType(saved: unknown, words: string): unknown {
    return isPlain(saved) && String(saved).trim() === words ? saved : words;
}

/** The sub-fields a `records` field declares. */
function declared(field: FormField): FormField[] {
    return field.fields ?? [];
}

/** A value that stands for nothing: absent, null, empty text, an empty list or an empty map. */
function nothing(value: unknown): boolean {
    if (value === undefined || value === null || value === '') return true;
    if (Array.isArray(value)) return value.length === 0;
    return isMap(value) && Object.keys(value).length === 0;
}

/**
 * The shape a `records` field is edited in: the one its saved value has, else the one of the
 * `sample` (another entry's value of the field), else the one its schema says.
 */
function shapeOf(field: FormField, saved: unknown, sample?: unknown): RecordsEdit['shape'] {
    const held = nothing(saved) ? sample : saved;
    if (Array.isArray(held)) return 'list';
    const plain = declared(field).length === 0;
    if (isMap(held)) return field.map === true ? 'named' : plain ? 'labels' : 'one';
    if (field.map === true) return 'named';
    return field.open === true && plain ? 'labels' : 'list';
}

/** The rows of a metalist: one per item, a bare word standing as the value of an unlabelled row. */
function rowsOf(saved: unknown): Row[] {
    const items = Array.isArray(saved) ? saved : nothing(saved) ? [] : [saved];
    return items.map((item) =>
        isMap(item)
            ? { label: scalar(item.label), value: scalar(item.value) }
            : { label: '', value: asText(item) }
    );
}

/** The rows of a map of facts: one per key, in the map's order. */
function factRows(saved: unknown): Row[] {
    return isMap(saved)
        ? Object.entries(saved).map(([label, value]) => ({ label, value: asText(value) }))
        : [];
}

/** One record as an edit; `src` says where in the saved value it was. */
function recordEdit(field: FormField, item: unknown, src?: string | number): RecordEdit {
    const saved = isMap(item) ? item : {};
    const names = declared(field).map((sub) => sub.field);
    const others = Object.entries(saved).filter(([key]) => !names.includes(key));
    const edit: RecordEdit = {
        fields: Object.fromEntries(
            declared(field).map((sub) => [sub.field, toEdit(sub, saved[sub.field])])
        ),
        rows: others
            .filter(([, value]) => isPlain(value))
            .map(([label, value]) => ({ label, value: scalar(value) })),
        kept: Object.fromEntries(others.filter(([, value]) => !isPlain(value)))
    };
    if (src !== undefined) edit.src = src;
    return edit;
}

/** A record with nothing in it yet, for the control that adds one. */
export function blankRecord(field: FormField): RecordEdit {
    return recordEdit(field, undefined);
}

/** A row with nothing in it yet. */
export function blankRow(): Row {
    return { label: '', value: '' };
}

/** The edit of a `records` field in the shape its value, a peer's value or its schema gives. */
function recordsEdit(field: FormField, saved: unknown, sample: unknown): RecordsEdit {
    const shape = shapeOf(field, saved, sample);
    if (shape === 'one') return { shape, item: recordEdit(field, saved) };
    if (shape === 'labels') return { shape, rows: factRows(saved) };
    if (shape === 'named') {
        const held = isMap(saved) ? Object.entries(saved) : [];
        return {
            shape,
            items: held.map(([label, item]) => ({
                label,
                record: recordEdit(field, item, label),
                src: label
            }))
        };
    }
    const items = Array.isArray(saved) ? saved : [];
    return { shape, items: items.map((item, at) => recordEdit(field, item, at)) };
}

/**
 * What a saved value of a field becomes while it is edited. `sample` is another entry's value of
 * the same field, which decides the shape of a `records` field this entry has no value for.
 */
export function toEdit(field: FormField, saved: unknown, sample?: unknown): unknown {
    if (field.type === 'checkbox') return saved === true;
    if (field.type === 'tags') return asList(saved);
    if (field.type === 'metalist') return rowsOf(saved);
    if (field.type === 'records') return recordsEdit(field, saved, sample);
    return asText(saved);
}

/** The text of an edit as the value it stands for: trimmed, nothing for empty text. */
function textPayload(edit: unknown, saved: unknown): unknown {
    const words = (typeof edit === 'string' ? edit : asText(edit)).trim();
    return words === '' ? null : keepType(saved, words);
}

/** The tags of an edit: the non-empty ones, trimmed; the saved list when it says the same. */
function tagsPayload(edit: unknown, saved: unknown): unknown {
    const list = asList(edit)
        .map((one) => one.trim())
        .filter((one) => one !== '');
    if (list.length === 0) return null;
    const was = asList(saved);
    const same = list.length === was.length && list.every((one, at) => one === was[at]);
    return same && Array.isArray(saved) ? saved : list;
}

/** The rows of a metalist: those with a label or a value. */
function metalistPayload(edit: unknown): unknown {
    const rows = (Array.isArray(edit) ? edit : []).filter(
        (row): row is Row =>
            isMap(row) && (scalar(row.label).trim() !== '' || scalar(row.value).trim() !== '')
    );
    return rows.length === 0
        ? null
        : rows.map((row) => ({ label: row.label.trim(), value: row.value.trim() }));
}

/** One record as the map it is written as, or null when it holds nothing. */
function recordPayload(
    field: FormField,
    edit: RecordEdit,
    saved: unknown
): Record<string, unknown> | null {
    const was = isMap(saved) ? saved : {};
    const out: Record<string, unknown> = {};
    for (const sub of declared(field)) {
        const one = payloadOf(sub, edit.fields[sub.field], was[sub.field]);
        if (!nothing(one)) out[sub.field] = one;
    }
    for (const row of edit.rows) {
        const label = row.label.trim();
        if (label !== '') out[label] = keepType(was[label], row.value.trim());
    }
    Object.assign(out, edit.kept);
    return Object.keys(out).length === 0 ? null : out;
}

/** The record of the saved value an edited record came from. */
function savedRecord(saved: unknown, src: string | number | undefined): unknown {
    if (src === undefined) return undefined;
    if (typeof src === 'number') return Array.isArray(saved) ? saved[src] : undefined;
    return isMap(saved) ? saved[src] : undefined;
}

/** The payload of a `records` edit in its own shape; null when it holds nothing. */
function recordsPayload(field: FormField, edit: unknown, saved: unknown): unknown {
    if (!isMap(edit)) return null;
    const records = edit as RecordsEdit;
    if (records.shape === 'one') return recordPayload(field, records.item, saved);
    if (records.shape === 'labels') {
        const facts: Record<string, unknown> = {};
        const was = isMap(saved) ? saved : {};
        for (const row of records.rows) {
            const label = row.label.trim();
            if (label !== '') facts[label] = keepType(was[label], row.value.trim());
        }
        return Object.keys(facts).length === 0 ? null : facts;
    }
    if (records.shape === 'named') {
        const named: Record<string, unknown> = {};
        for (const item of records.items) {
            const label = item.label.trim();
            const one = recordPayload(field, item.record, savedRecord(saved, item.src));
            if (label !== '' && one !== null) named[label] = one;
        }
        return Object.keys(named).length === 0 ? null : named;
    }
    const listed = records.items
        .map((item) => recordPayload(field, item, savedRecord(saved, item.src)))
        .filter((one): one is Record<string, unknown> => one !== null);
    return listed.length === 0 ? null : listed;
}

/**
 * What a save writes for one field: the value the edit stands for, and null for an edit that
 * clears the field. `saved` is the field's value in the file, which an edit that says the same
 * words keeps the type of.
 */
export function payloadOf(field: FormField, edit: unknown, saved: unknown): unknown {
    if (field.type === 'checkbox') return edit === true ? true : saved === true ? false : null;
    if (field.type === 'tags') return tagsPayload(edit, saved);
    if (field.type === 'metalist') return metalistPayload(edit);
    if (field.type === 'records') return recordsPayload(field, edit, saved);
    return textPayload(edit, saved);
}

/**
 * Whether an edit changes the field: its payload differs from the payload of the field untouched.
 * A field the form cannot say differently from the file (a trailing space, an empty row) is not
 * changed.
 */
export function fieldDiffers(
    field: FormField,
    edit: unknown,
    saved: unknown,
    sample?: unknown
): boolean {
    const untouched = payloadOf(field, toEdit(field, saved, sample), saved);
    return JSON.stringify(payloadOf(field, edit, saved)) !== JSON.stringify(untouched);
}

/** The keys of an edit that name its shape and its place, which are no words of the reader's. */
const STRUCTURE = ['shape', 'src'];

/** Whether an edit holds any words, tick or row, for a draft of a field the schema lacks. */
export function hasWords(edit: unknown): boolean {
    if (typeof edit === 'string') return edit.trim() !== '';
    if (typeof edit === 'boolean') return edit;
    if (Array.isArray(edit)) return edit.some(hasWords);
    if (!isMap(edit)) return false;
    return Object.entries(edit).some(([key, held]) => !STRUCTURE.includes(key) && hasWords(held));
}
