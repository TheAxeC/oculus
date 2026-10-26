// Layer 2, client-state tests. Which fields of an entry the form shows and never writes: the
// file's primary key, so a venue can be renamed and keeps the `id` every manifest names it by, and
// none for a file with no primary key, whose entries take no write.

import { describe, expect, it } from 'vitest';
import { fixedFields } from '../../../src/lib/state/forms/record-fields.ts';

describe('fixedFields', () => {
    it.each([
        ['the key of a collection keyed by key', 'key', ['key']],
        ['the id of venues, whose name is editable', 'id', ['id']],
        ['nothing for a file with no primary key', null, []]
    ])('is %s', (_name, primaryKey, fixed) => {
        expect(fixedFields(primaryKey)).toEqual(fixed);
    });
});
