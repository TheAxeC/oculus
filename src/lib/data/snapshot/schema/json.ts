// Layer 1, data. The JSON Schema a hub file's schema is turned into: the draft-07 object ajv and
// yaml-language-server both take, the keywords oculus adds to carry what an ajv error needs to
// word its finding, and the one stable text a schema is compared and sent by.
//
// `x-from` names the sources an enum was made from, `x-when` the condition under which a field is
// allowed, and `x-required-when` the condition under which it is required. They validate nothing;
// they let a finding say "this value is not a key of venues" rather than "this value is not one of
// 71 words". `enumDescriptions` gives the editor's completion the label of each enum word, from
// the field's `{ key, label }` options. `errorMessage` is yaml-language-server's message for a
// value the schema refuses, which a keyed family carries for the other form
// (catalog/schemas/options.ts, `heldToForm`); ajv takes it as a no-op, so oculus's checker words
// that value as it words any wrong type.
//
// `x-period` is the one keyword oculus adds that validates: on a `period` field it runs the reader
// of helpers/dates.ts (schema/check.ts registers it), since a pattern cannot say the calendar or
// the order of a span's two ends. An editor that does not know it checks the field's pattern alone.

import type { SchemaObject } from 'ajv';
import { z } from 'zod';

/** A draft-07 JSON Schema. */
export type JsonSchema = SchemaObject;

/** The annotation keywords oculus puts on a schema, each registered with ajv as a no-op. */
export const ANNOTATIONS = [
    'x-from',
    'x-when',
    'x-required-when',
    'enumDescriptions',
    'errorMessage'
] as const;

/** The keyword that runs the reader of a period on a `period` field's value. */
export const PERIOD_KEYWORD = 'x-period';

/** The scalar types a plain text field accepts: a text, and the integer a year is written as. */
export const TEXT_TYPES = ['string', 'number', 'null'];

/**
 * The text of a schema: its JSON, with the keys of every object in the order they were built. Two
 * builds of one schema give one text, which is how a change is told from a rebuild that changed
 * nothing.
 */
export function schemaText(schema: JsonSchema): string {
    return JSON.stringify(schema);
}

/** Where a `$schema` URI of a generated schema points: the draft every schema is written in. */
export const DRAFT = 'http://json-schema.org/draft-07/schema#';

/**
 * The JSON Schema of a zod shape, in draft-07 and for the value the shape is given. A shape that
 * holds something JSON Schema cannot say (a transform, a custom check) has no schema here: the
 * reader splits it into a shape and the step after it, and the shape is what is passed.
 */
export function shapeSchema(shape: z.ZodType): JsonSchema | null {
    try {
        return z.toJSONSchema(shape, { target: 'draft-7', io: 'input' });
    } catch {
        return null;
    }
}
