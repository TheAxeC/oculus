// Layer 3, shell test. The pane strip rendered to HTML on the server under each setting of
// show_tabs and editor_actions, and with a locked pane: how many tabs the strip draws, whether the
// Split Right button and the `...` opener are there, the title row of `none`, and the lock mark
// that unlocks. The arithmetic is strip-shape.test.ts.
//
// What this does NOT cover: a press on the lock mark or on a menu item, which needs a DOM; the
// store call a press makes is tests/state/workbench/layout/open/locked.test.ts and the menu's
// words are tests/shell/panes/pane-strip-menu.test.ts.

import { beforeEach, describe, expect, it } from 'vitest';
import { render } from 'svelte/server';
import Workbench from '../../../../src/lib/shell/Workbench.svelte';
import Alpha from '../../fixtures/Alpha.svelte';
import {
    engineDir,
    glyphCatalog,
    loadConfig,
    textCatalog
} from '../../../../src/lib/data/sources/config.ts';
import { setAppearance } from '../../../../src/lib/state/shared/words/appearance.ts';
import { setCatalog, setGlyphs, t } from '../../../../src/lib/state/shared/words/text.ts';
import type { Pane } from '../../../../src/lib/state/workbench/layout/index.ts';
import { clientContext, createClientState, type ClientState } from '../../../fixtures/client.ts';

const { config } = loadConfig(engineDir());
setCatalog(textCatalog(config));
setGlyphs(glyphCatalog(config));

let client: ClientState;

beforeEach(() => {
    client = createClientState();
    client.registry.registerView({
        id: 'alpha',
        label: 'views.status',
        glyph: 'views.status_glyph',
        component: Alpha,
        group: 'probe',
        order: 0
    });
    setAppearance({});
});

function tabs(...ids: string[]): Pane['tabs'] {
    return ids.map((id) => ({ id, view: 'alpha', state: {} }));
}

/** One pane drawn under these settings. */
function drawn(over: Partial<Pane>, settings: Record<string, unknown> = {}): string {
    setAppearance(settings);
    const held = tabs('one', 'two', 'three');
    client.layout.apply({
        root: { kind: 'pane', tabs: held, active: 'two', ...over }
    });
    return render(Workbench, { context: clientContext(client), props: { pages: [] } }).body;
}

const count = (html: string, needle: string): number => html.split(needle).length - 1;
const SPLIT = `aria-label="${t('ui.split_right')}"`;
const MORE = 'data-glyph="more"';

describe('show_tabs', () => {
    // Revert: leave show_tabs out of the strip.
    it('multiple, the default, draws every tab', () => {
        const html = drawn({});
        expect(count(html, 'role="tab"')).toBe(3);
    });

    it('single draws the active tab alone', () => {
        const html = drawn({}, { show_tabs: 'single' });
        expect(count(html, 'role="tab"')).toBe(1);
        expect(html).toContain('aria-selected="true"');
    });

    it('none draws no tab and no tab list, and the actions stay', () => {
        const html = drawn({}, { show_tabs: 'none' });
        expect(count(html, 'role="tab"')).toBe(0);
        expect(count(html, 'role="tablist"')).toBe(0);
        expect(html).toContain(SPLIT);
        expect(html).toContain(MORE);
    });

    it('a value that is no choice reads as multiple', () => {
        expect(count(drawn({}, { show_tabs: 'few' }), 'role="tab"')).toBe(3);
    });
});

describe('editor_actions', () => {
    // Revert: leave editor_actions out of the strip.
    it('strip, the default, draws Split Right and the opener', () => {
        const html = drawn({});
        expect(html).toContain(SPLIT);
        expect(html).toContain(MORE);
    });

    it('hidden draws neither and keeps the tabs', () => {
        const html = drawn({}, { editor_actions: 'hidden' });
        expect(html).not.toContain(SPLIT);
        expect(html).not.toContain(MORE);
        expect(count(html, 'role="tab"')).toBe(3);
    });
});

describe('a locked pane', () => {
    // Revert: draw no mark for locked.
    it('draws the lock mark named Unlock Group, and an unlocked pane draws none', () => {
        expect(drawn({ locked: true })).toContain(`aria-label="${t('ui.strip_unlock')}"`);
        expect(drawn({})).not.toContain(`aria-label="${t('ui.strip_unlock')}"`);
    });

    it('draws the mark with the tab row hidden and the actions hidden', () => {
        const html = drawn({ locked: true }, { show_tabs: 'none', editor_actions: 'hidden' });
        expect(html).toContain(`aria-label="${t('ui.strip_unlock')}"`);
        expect(html).not.toContain(MORE);
    });
});
