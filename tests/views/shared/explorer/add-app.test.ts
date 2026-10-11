// Layer 3, view-partial tests. Add as App on the right-click menu of the Files view
// (views/shared/explorer/tree/menu/row-menu.ts): offered on a folder or root whose held listing
// holds an `app.yml`, absent on every other row, and picking it hands the folder's absolute path to
// the app store's add call.
//
// The listing is a function the case answers and the pick's calls are fakes. What this does NOT
// cover: the copy itself (tests/server/machine/apps/manage.test.ts) and the menu drawn on screen.

import { describe, expect, vi } from 'vitest';
import type { TreeRow } from '../../../../src/lib/state/sources/fs.ts';
import {
    rowFacts,
    rowMenu,
    rowPicker,
    type HeldEntries
} from '../../../../src/lib/views/shared/explorer/tree/menu/row-menu.ts';
import { it } from '../../../fixtures/scratch.ts';
import { installRealText } from '../real-text.ts';
import { t } from '../../../../src/lib/state/shared/words/text.ts';

installRealText();

const row = (over: Partial<TreeRow>): TreeRow => ({
    root: 'hub',
    path: 'tools/board',
    name: 'board',
    kind: 'dir',
    size: 0,
    depth: 1,
    open: false,
    ...over
});

const explorer = { clipboard: () => null, compareFile: () => null, panelOpen: () => false };

/** The menu of a row over a held listing. */
function menuOf(target: TreeRow, entries: HeldEntries) {
    const facts = rowFacts(
        target,
        ['hub'],
        false,
        explorer,
        new Map(),
        undefined,
        undefined,
        entries
    );
    return rowMenu(facts, t);
}

/** The Add as App item of a row's menu, or undefined when the menu has none. */
const addItem = (target: TreeRow, entries: HeldEntries) =>
    menuOf(target, entries).find((one) => one.label === t('files.menu_add_app'));

const holding =
    (...names: string[]): HeldEntries =>
    () =>
        names.map((name) => ({ name, kind: 'file' }) as never);

describe('offers Add as App on a folder that holds an app.yml', () => {
    it.each([
        [
            'a folder holding app.yml: the item is offered',
            row({}),
            holding('app.yml', 'index.html'),
            true
        ],
        [
            'a root holding app.yml: the item is offered',
            row({ path: '', depth: 0 }),
            holding('app.yml'),
            true
        ],
        [
            'a folder holding no app.yml: the item is not offered',
            row({}),
            holding('index.html'),
            false
        ],
        ['a folder whose listing is not held: the item is not offered', row({}), () => null, false],
        [
            'a file named app.yml: the item is not offered',
            row({ kind: 'file', name: 'app.yml' }),
            holding('app.yml'),
            false
        ],
        ['the up row: the item is not offered', row({ up: true }), holding('app.yml'), false]
    ])('%s', (_name, target, entries, offered) => {
        expect(addItem(target, entries) !== undefined).toBe(offered);
    });

    it('hands the absolute folder to the app store when the item is picked', () => {
        const addApp = vi.fn();
        const pick = rowPicker({ dirOf: () => '/hub', addApp } as never, t);
        const item = addItem(row({}), holding('app.yml'));
        pick(row({}), item?.id ?? '');
        expect(addApp.mock.calls).toEqual([['/hub/tools/board']]);
    });
});
