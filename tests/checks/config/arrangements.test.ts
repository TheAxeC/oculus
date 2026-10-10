// Layer 4, tree check. The arrangements of config/layout.yml, read from the shipped file: each rail
// page is first made from its arrangement, a workbench page from the `workbench:` key, and an
// arrangement the reader refuses (parseArrangement answers null) makes no page, so the page opens
// nothing. One row per arrangement of the file and one for `workbench:`, so a page added later is
// checked the day it is added.

import { describe, expect, it } from 'vitest';
import { collectionKeys, engineDir, loadConfig } from '../../../src/lib/data/sources/config.ts';
import { parseArrangement } from '../../../src/lib/state/workbench/navigation/arrangement.ts';
import { tabsOf } from '../../../src/lib/state/workbench/layout/index.ts';
import { registerAll, registerCollections } from '../../../src/routes/views.ts';
import { createClientState } from '../../fixtures/client.ts';

const { config } = loadConfig(engineDir());
const arrangements = config.arrangements as Record<string, unknown>;

/** Each page the file arranges: the rail pages by their key, and the workbench page. */
const pages: [string, unknown][] = [
    ...Object.entries(arrangements),
    ['workbench', config.workbench]
];

describe('the arrangements of config/layout.yml', () => {
    it.each(pages)('the %s page parses and names only views the catalogue knows', (_page, node) => {
        const client = createClientState();
        registerAll(client.registry);
        registerCollections(client.registry, collectionKeys(config));
        const known = new Set(client.registry.views().map((view) => view.id));
        const built = parseArrangement(node);
        expect(built).not.toBeNull();
        const named = built === null ? [] : tabsOf(built.root).map((tab) => tab.view);
        expect(named.filter((view) => !known.has(view))).toEqual([]);
    });
});
