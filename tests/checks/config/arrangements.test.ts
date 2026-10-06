// Layer 4, tree check. The arrangements of config/layout.yml, read from the shipped file: each rail
// page is first made from its arrangement, and an arrangement the reader refuses (parseArrangement
// answers null) makes no page, so the page opens nothing. One row per arrangement of the file, so a
// page added later is checked the day it is added.

import { describe, expect, it } from 'vitest';
import { collectionKeys, engineDir, loadConfig } from '../../../src/lib/data/sources/config.ts';
import { parseArrangement } from '../../../src/lib/state/workbench/navigation/arrangement.ts';
import { tabsOf } from '../../../src/lib/state/workbench/layout/index.ts';
import { registerAll, registerCollections } from '../../../src/routes/views.ts';
import { createClientState } from '../../fixtures/client.ts';

const { config } = loadConfig(engineDir());
const arrangements = config.arrangements as Record<string, unknown>;

describe('the arrangements of config/layout.yml', () => {
    it.each(Object.keys(arrangements))(
        'the %s page parses and names only views the catalogue knows',
        (page) => {
            const client = createClientState();
            registerAll(client.registry);
            registerCollections(client.registry, collectionKeys(config));
            const known = new Set(client.registry.views().map((view) => view.id));
            const built = parseArrangement(arrangements[page]);
            expect(built).not.toBeNull();
            const named = built === null ? [] : tabsOf(built.root).map((tab) => tab.view);
            expect(named.filter((view) => !known.has(view))).toEqual([]);
        }
    );
});
