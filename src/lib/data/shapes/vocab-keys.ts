// Layer 1, data, pure. The keys of one top-level key of config/catalogs/vocab.yml, read the one way
// the schema checks (data/snapshot/schema/lists.ts) and the entry forms of the page
// (state/boards/collection.ts, state/forms/schema.ts) both read them: a list gives one key for each
// entry that has one, and a map gives its own keys.

import { z } from 'zod';
import { mapShape, readAs, readOr, rowsShape } from './shapes.ts';

/** The name of one vocabulary list entry: its `key` when it is a map, else the entry itself. */
const vocabKeyShape = z.union([
    z.object({ key: z.string() }).transform((row) => row.key),
    z.string()
]);

/** The names of a keyed vocabulary list, one per entry that has one. */
const vocabKeysShape = rowsShape(vocabKeyShape);

/**
 * The keys of a vocabulary key of vocab.yml: the entries of a list (a text, or a map's `key`) or
 * the keys of a map. Anything else has no keys.
 */
export function vocabKeys(value: unknown): string[] {
    const map = readAs(mapShape, value);
    return map === null ? readOr(vocabKeysShape, value, []) : Object.keys(map);
}
