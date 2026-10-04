// Layer 2, client-state tests. The shipped list's findings. The rule over the list itself is
// tests/data/sources/config/rail.test.ts.
//
// Nothing here renders; every case is over a pure function.

import { describe, expect, it } from 'vitest';
import { railFindings } from '../../../../src/lib/data/sources/config/rail.ts';
import { engineDir, loadConfig, textCatalog } from '../../../../src/lib/data/sources/config.ts';

const { config } = loadConfig(engineDir());
const catalog = textCatalog(config);

describe('the findings of the shipped rail list', () => {
    const FILE = '/engine/config/layout.yml';

    it('finds nothing wrong with the shipped rail list', () => {
        expect(railFindings(config, FILE, catalog)).toEqual([]);
    });
});
