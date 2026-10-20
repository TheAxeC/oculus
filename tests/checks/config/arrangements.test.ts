// Layer 4, tree check. The arrangements of config/defaults/layout.yml, read from the shipped file:
// each rail page is first made from its arrangement, a workbench page from the `workbench:` key,
// and an arrangement the reader refuses (parseArrangement answers null) makes no page, so the page
// opens nothing. One row per arrangement of the file and one for `workbench:`, so a page added
// later is checked the day it is added. The rows of `pinned` read the forms of a pinned tab and a
// `pinned:` of another value, which makes the arrangement not add up.

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

describe('the arrangements of config/defaults/layout.yml', () => {
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

/** An arrangement of one pane holding `tabs`. */
function pane(tabs: unknown[]): unknown {
    return { root: { kind: 'pane', view: tabs } };
}

describe('the pinned tabs of an arrangement', () => {
    it('reads { view, pinned: true } and { view, state, pinned: true } as pinned tabs', () => {
        const built = parseArrangement(
            pane([
                { view: 'help', pinned: true },
                { view: 'doc', state: { path: 'README.md' }, pinned: true }
            ])
        );
        const tabs = built === null ? [] : tabsOf(built.root);
        expect(tabs.map((tab) => [tab.view, tab.pinned, tab.state])).toEqual([
            ['help', true, {}],
            ['doc', true, { path: 'README.md' }]
        ]);
    });

    it('puts the pinned tabs of a pane before the others', () => {
        const built = parseArrangement(pane(['files', { view: 'help', pinned: true }]));
        const tabs = built === null ? [] : tabsOf(built.root);
        expect(tabs.map((tab) => [tab.view, tab.pinned === true])).toEqual([
            ['help', true],
            ['files', false]
        ]);
    });

    it.each([false, 'yes', 1, null])('makes nothing of a tab with pinned: %s', (value) => {
        expect(parseArrangement(pane([{ view: 'help', pinned: value }]))).toBeNull();
    });

    it.each(pages)('pins every tab the %s page names', (_page, node) => {
        const built = parseArrangement(node);
        const tabs = built === null ? [] : tabsOf(built.root);
        expect(tabs.filter((tab) => tab.pinned !== true).map((tab) => tab.view)).toEqual([]);
    });
});
