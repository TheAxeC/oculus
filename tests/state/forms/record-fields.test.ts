// Layer 2, client-state tests. Which fields of an entry the form shows and never writes: the key
// that names the entry, and for a registry keyed by another field that field instead, so a venue
// can be renamed and keeps the `id` every manifest names it by.

import { describe, expect, it } from 'vitest';
import type { SchemaField } from '../../../src/lib/data/model/index.ts';
import { fixedFields } from '../../../src/lib/state/forms/record-fields.ts';

const KEYED: SchemaField[] = [
    { field: 'key', type: 'text' },
    { field: 'title', type: 'text' }
];

const VENUES: SchemaField[] = [
    { field: 'name', type: 'text' },
    { field: 'id', type: 'text' }
];

describe('fixedFields', () => {
    it.each([
        ['the first field of a collection', 'tasks', KEYED, ['key']],
        ['the id of venues, whose name is editable', 'venues', VENUES, ['id']],
        ['the title of a file with no schema', 'tasks', undefined, ['title']]
    ])('is %s', (_name, collection, schema, fixed) => {
        expect(fixedFields(collection, schema)).toEqual(fixed);
    });
});
