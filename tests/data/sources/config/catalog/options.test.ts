// Layer 1, data tests. The options catalog reader, over a catalog of every wrong type. Compared
// whole.

import { describe, expect, it } from 'vitest';
import { catalogOf } from '../../../../../src/lib/data/sources/config/catalog/options.ts';

describe('catalogOf', () => {
    it.each([[{ options: 'x' }]])('answers an empty catalog for %j', (config) => {
        expect(catalogOf(config)).toStrictEqual({});
    });
});
