// Layer 2, client state. A file's own `schema:` as the fields of the entry form: the collection
// files, the two generated feeds and the career file all declare one, and the form is drawn from it
// with the same field type the project editor's form is drawn from (state/forms/schema.ts), so one
// set of controls draws both. Pure.
//
// The field of a schema flagged `primary_key: true` is the entry's primary key: it addresses the
// entry in the file and every reference to the entry stores it, so the form shows it and never
// writes it (a venue's `id`, a person's `key`).

import type { SchemaField } from '../../data/model/index.ts';
import { byKey, scalar } from '../../data/helpers/guards.ts';
import type { FormField } from './schema.ts';

/**
 * The fields of an entry the form shows and never writes: the file's primary key `primaryKey`,
 * none for a file with no primary key, whose entries take no write.
 */
export function fixedFields(primaryKey: string | null): string[] {
    return primaryKey === null ? [] : [primaryKey];
}

/** The target of a field's choices: its list, or the one the record's other field picks. */
function keysOf(
    keys: SchemaField['foreign_key'],
    record: Record<string, unknown>
): FormField['foreign_key'] {
    if (keys === undefined || Array.isArray(keys)) return keys;
    return byKey(keys.sources, scalar(record[keys.field]));
}

/**
 * One schema field as a form field. `record` is the record the field is in, which a field whose
 * choices depend on another field of its record reads that field of.
 */
function formFieldOf(one: SchemaField, record: Record<string, unknown>): FormField {
    const field: FormField = {
        field: one.field,
        label: one.label ?? one.field,
        type: one.type,
        section: ''
    };
    if (one.help !== undefined) field.help = one.help;
    if (one.options !== undefined) field.options = one.options;
    const keys = keysOf(one.foreign_key, record);
    if (keys !== undefined) field.foreign_key = keys;
    if (one.fields !== undefined) field.fields = one.fields.map((sub) => formFieldOf(sub, {}));
    if (one.open === true) field.open = true;
    if (one.map === true) field.map = true;
    if (one.required === true) field.required = true;
    return field;
}

/** The form fields of a schema, in its order, for the entry whose values are `record`. */
export function formFieldsOf(
    schema: SchemaField[] | undefined,
    record: Record<string, unknown>
): FormField[] {
    return (schema ?? []).map((one) => formFieldOf(one, record));
}
