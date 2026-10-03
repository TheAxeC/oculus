// Layer 3, shell test. The strip menu's Tab Bar and Editor Actions Position submenus (stripMenu in
// shell/panes/pane-view.ts): the place names VS Code uses, the check mark on the chosen place, and
// a float drawing no `...` under Hidden.
//
// The words are a stand-in `t` that answers each key as `@key`.
//
// What this does NOT cover: the check mark as drawn by the menu list and the float under a
// pointer, which need a DOM and are seen at the look.

import { beforeEach, describe, expect, it } from 'vitest';
import { render } from 'svelte/server';
import Workbench from '../../../../src/lib/shell/Workbench.svelte';
import { stripMenu } from '../../../../src/lib/shell/panes/pane-view.ts';
import {
    engineDir,
    glyphCatalog,
    loadConfig,
    textCatalog
} from '../../../../src/lib/data/sources/config.ts';
import { setAppearance } from '../../../../src/lib/state/shared/words/appearance.ts';
import { setCatalog, setGlyphs } from '../../../../src/lib/state/shared/words/text.ts';
import { serialiseLayout } from '../../../../src/lib/state/workbench/layout/index.ts';
import { clientContext, createClientState, type ClientState } from '../../../fixtures/client.ts';
import {
    fakeStorage,
    heldPages,
    pageAround
} from '../../../state/workbench/layout/layout-fixture.ts';
import { registerAlpha } from '../../fixtures/alpha-view.ts';
import { keyWords as words } from '../../../fixtures/doubles.ts';

const { config } = loadConfig(engineDir());
setCatalog(textCatalog(config));
setGlyphs(glyphCatalog(config));

/** The submenu of the strip's menu with this item id, as (label, checked) pairs. */
function submenu(
    id: string,
    facts: Partial<Parameters<typeof stripMenu>[0]> = {}
): [string, boolean][] {
    const menu = stripMenu({ holdsTab: true, panes: 1, ...facts }, words);
    const found = menu.find((item) => item.id === id);
    return (found?.items ?? []).map((item) => [item.label, item.checked === true]);
}

describe('Editor Actions Position', () => {
    // Revert: label the first place "Title Bar" again.
    it('names the places Tab Bar and Hidden when the tab bar is drawn', () => {
        expect(submenu('actions-at', { actions: 'strip', tabBar: 'multiple' })).toEqual([
            ['@ui.editor_actions_tab_bar', true],
            ['@ui.editor_actions_hidden', false]
        ]);
        expect(submenu('actions-at', { actions: 'strip', tabBar: 'single' })[0]?.[0]).toBe(
            '@ui.editor_actions_tab_bar'
        );
    });

    // Revert: draw the title row's place under the tab bar's name.
    it('names the first place Title Bar when the tab bar is not drawn', () => {
        expect(submenu('actions-at', { actions: 'strip', tabBar: 'none' })[0]?.[0]).toBe(
            '@ui.editor_actions_title_bar'
        );
    });

    // Revert: mark the place with `active` alone, which the list shows by colour only.
    it('checks the chosen place and no other', () => {
        expect(submenu('actions-at', { actions: 'hidden' })).toEqual([
            ['@ui.editor_actions_tab_bar', false],
            ['@ui.editor_actions_hidden', true]
        ]);
    });

    // Revert: mark the tab bar choice with `active` alone.
    it('checks the chosen Tab Bar choice and no other', () => {
        expect(submenu('tab-bar', { tabBar: 'single' })).toEqual([
            ['@ui.tab_bar_multiple', false],
            ['@ui.tab_bar_single', true],
            ['@ui.tab_bar_none', false]
        ]);
    });
});

describe('a float under Hidden', () => {
    let client: ClientState;

    beforeEach(() => {
        client = createClientState();
        registerAlpha(client);
        const pane = (id: string) => ({
            kind: 'pane' as const,
            tabs: [{ id, view: 'alpha', state: {} }],
            active: id
        });
        const float = {
            id: 'free',
            pane: pane('free-tab'),
            place: { kind: 'free', x: 0.1, y: 0.2, w: 0.3, h: 0.4 } as const
        };
        client.layout.loadLayout(
            fakeStorage(serialiseLayout(heldPages([pageAround('main', pane('one'))], [float])))
        );
    });

    const MORE = 'data-glyph="more"';
    const count = (html: string): number => html.split(MORE).length - 1;
    const drawn = (): string =>
        render(Workbench, { context: clientContext(client), props: {} }).body;

    it('draws the pane menu opener on the page pane and on the float, and neither under Hidden', () => {
        setAppearance({});
        expect(count(drawn())).toBe(2);
        setAppearance({ editor_actions: 'hidden' });
        expect(count(drawn())).toBe(0);
    });
});
