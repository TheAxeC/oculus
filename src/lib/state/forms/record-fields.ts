// Layer 2, client state. A file's own `schema:` as the fields of the entry form: the collection
// files, the two generated feeds and the career file all declare one, and the form is drawn from it
// with the same field type the project editor's form is drawn from (state/forms/schema.ts), so one
// set of controls draws both. Pure.
//
// The first field of a schema is the entry's identity: it addresses the entry in the file, so the
// form shows it and never writes it. A registry whose entities are keyed by another field (the
// venues by `id`) shows that field read-only instead and writes the identity: a rename of the
// identity is written through the `entry` write's `was` record and leaves the key, which every
// manifest names the entry by, as it is.

import type { SchemaField } from '../../data/model/index.ts';
import { KEYED_FIELDS } from '../../data/helpers/files/yaml/collection-text.ts';
import { byKey, scalar } from '../../data/helpers/guards.ts';
import type { FormField } from './schema.ts';

/** The field a file without a schema is addressed by, and the card's own heading. */
export const TITLE_FIELD = 'title';

/** The field an entry is addressed by: the file's own schema's first field, `title` without one. */
export function identityField(schema: SchemaField[] | undefined): string {
    const first = (schema ?? []).at(0);
    return first === undefined ? TITLE_FIELD : first.field;
}

/**
 * The fields of an entry the form shows and never writes: the field the collection's registry keys
 * its entities by when it has one (a venue's `id`), else the identity.
 */
export function fixedFields(collection: string, schema: SchemaField[] | undefined): string[] {
    return [byKey(KEYED_FIELDS, collection) ?? identityField(schema)];
}

/** The source of a field's choices: its list, or the one the record's other field picks. */
function fromOf(from: SchemaField['from'], record: Record<string, unknown>): FormField['from'] {
    if (from === undefined || Array.isArray(from)) return from;
    return byKey(from.sources, scalar(record[from.field]));
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
    const from = fromOf(one.from, record);
    if (from !== undefined) field.from = from;
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
