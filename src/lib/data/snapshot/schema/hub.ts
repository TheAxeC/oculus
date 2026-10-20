// Layer 1, data. The JSON Schema of each hub data file, made from the file's own `schema:` block.
//
// A file is one of two kinds. Most hold a list of like records under `entries:` (the data registry
// under `datasets:`), and the `schema:` block describes one record. The career file and the files
// of oculus's own schema folder hold a fixed set of top-level sections instead, and their `schema:`
// block (or `<name>_schema:` key) describes those sections. Both kinds may hold `title:`, `intro:`,
// `meta:` and the `schema:` block itself, which is checked against the field vocabulary.
//
// Two fields are written into the entries of a collection by oculus itself and are declared by no
// file: `snooze` (a day, or a flag) and `subtasks` (a list of lines). They are added to the record
// of every collection file with a help line from the text catalog.

import type { SchemaField } from '../../model/index.ts';
import { findingText, type TextCatalog } from '../../helpers/finding-text.ts';
import { DRAFT, TEXT_TYPES, type JsonSchema } from './json.ts';
import { SCHEMA_BLOCK, SCHEMA_DEFINITIONS, recordSchema, type Context } from './record.ts';

/** How a file's `schema:` block is read: a record of the entries list, or the file's sections. */
export type FileKind = 'entries' | 'sections';

/** The keys a file that lists records may hold beside them. */
function frame(): Record<string, JsonSchema> {
    return {
        title: { type: TEXT_TYPES, description: 'The name the file is listed under.' },
        intro: { type: TEXT_TYPES, description: 'A paragraph shown above the records.' },
        meta: { description: 'Facts about the file as a whole, such as the date of its last run.' },
        schema: SCHEMA_BLOCK
    };
}

/** The fields oculus writes into the entries of a collection file, with their help lines. */
export function writtenFields(catalog: TextCatalog): SchemaField[] {
    return [
        { field: 'snooze', type: 'raw', help: findingText(catalog, 'findings.schema.snooze_help') },
        {
            field: 'subtasks',
            type: 'raw',
            help: findingText(catalog, 'findings.schema.subtasks_help')
        }
    ];
}

/** What a file's schema needs beyond its fields. */
export type FileSchemaOptions = {
    kind: FileKind;
    /** The key the records are listed under, for the `entries` kind. */
    list: string;
    /** The fields oculus writes into each record, none for a file that is not a collection. */
    written: SchemaField[];
    /** Whether the file carries the `schema:` block it is described by. */
    own: boolean;
};

/**
 * The schema of one hub data file from the fields its `schema:` block declares. The records are
 * checked field by field with nothing undeclared allowed; a top-level key outside the frame, the
 * list key and the sections is not allowed either.
 */
export function fileSchema(
    fields: SchemaField[],
    options: FileSchemaOptions,
    ctx: Context
): JsonSchema {
    let top: JsonSchema;
    if (options.kind === 'entries') {
        const record = recordSchema([...fields, ...options.written], ctx);
        const properties: Record<string, JsonSchema> = {
            ...frame(),
            [options.list]: {
                type: ['array', 'null'],
                items: record,
                description:
                    "The file's records, each holding the fields the file's `schema:` declares."
            }
        };
        top = { type: 'object', properties, additionalProperties: false };
    } else {
        top = recordSchema(fields, ctx);
        if (options.own) {
            const properties = top.properties as Record<string, JsonSchema>;
            properties.schema = SCHEMA_BLOCK;
        }
    }
    return { $schema: DRAFT, ...top, definitions: SCHEMA_DEFINITIONS };
}
