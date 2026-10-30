// Layer 2, client state. A file's own `schema:` as the fields of the editor: the collection files,
// the two generated feeds and the career file all declare one, and the form is drawn from it with
// the same field type a project's form is drawn from (state/forms/schema.ts), so one set of
// controls draws both; and the groups of the editor over those fields, for every kind of record.
// Pure.
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

/**
 * The form fields of a schema, in its order, for the entry whose values are `record`, each
 * top-level row with its `section:`, which a nested row has no use for.
 */
export function formFieldsOf(
    schema: SchemaField[] | undefined,
    record: Record<string, unknown>
): FormField[] {
    return (schema ?? []).map((one) => ({
        ...formFieldOf(one, record),
        section: one.section ?? ''
    }));
}

/** One group of the editor: its name, which is its fold key too, and its fields in file order. */
export type FormGroup = { name: string; fields: FormField[] };

/**
 * The groups of the editor over `fields`: the sections `listed` names, in that order, those holding
 * no field left out; then a section the list does not hold, in the order of its first row; then
 * the rows with no section, joined by a section named `other`, under that one name. So no field is
 * left undrawn, and a hub's own schema with no `section:` still draws whole.
 */
export function formGroups(
    fields: readonly FormField[],
    listed: readonly string[],
    other: string
): FormGroup[] {
    const named = fields.map((one) => one.section).filter((one) => one !== '' && one !== other);
    const names = [...new Set([...listed.filter((one) => one !== other), ...named])];
    const groups = names.map((name) => ({
        name,
        fields: fields.filter((one) => one.section === name)
    }));
    const rest = fields.filter((one) => one.section === '' || one.section === other);
    return [...groups, { name: other, fields: rest }].filter((one) => one.fields.length > 0);
}
