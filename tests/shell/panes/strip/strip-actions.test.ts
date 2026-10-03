// Layer 3, shell test. The pane strip drawn with the actions of the active file tab
// (shell/panes/strip/PaneStrip.svelte's `tabActions`): they stand at the strip's end, before the
// lock mark, Split Right and the `...` opener, under each setting of show_tabs and editor_actions.
//
// What this does NOT cover: the actions of a real file tab, which are tests/views/sources/
// source.test.ts, and their room in a narrow strip, which is seen at the look.

import { beforeEach, describe, expect, it } from 'vitest';
import { render } from 'svelte/server';
import ActionsHost from '../../fixtures/ActionsHost.svelte';
import {
    engineDir,
    glyphCatalog,
    loadConfig,
    textCatalog
} from '../../../../src/lib/data/sources/config.ts';
import { setAppearance } from '../../../../src/lib/state/shared/words/appearance.ts';
import { setCatalog, setGlyphs, t } from '../../../../src/lib/state/shared/words/text.ts';
import { clientContext, createClientState } from '../../../fixtures/client.ts';

const { config } = loadConfig(engineDir());
setCatalog(textCatalog(config));
setGlyphs(glyphCatalog(config));

const tabs = [
    { id: 'one', label: 'one', glyph: 'edit', hint: '' },
    { id: 'two', label: 'two', glyph: 'edit', hint: '' }
];

function drawn(settings: Record<string, unknown> = {}, locked = false): string {
    setAppearance(settings);
    return render(ActionsHost, {
        context: clientContext(createClientState()),
        props: {
            tabs,
            active: 'two',
            locked,
            canSplit: true,
            items: [],
            dropIndex: null,
            focused: true,
            onselect: () => undefined,
            onclose: () => undefined,
            ondblclick: () => undefined,
            onpointerdown: () => undefined,
            onsplit: () => undefined,
            onunlock: () => undefined,
            onpick: () => undefined
        }
    }).body;
}

const SPLIT = `aria-label="${t('ui.split_right')}"`;
const MORE = 'data-glyph="more"';
const MINE = 'class="mine"';

beforeEach(() => setAppearance({}));

describe('the active file tab own actions in the strip', () => {
    // Revert: leave `tabActions` out of the strip's actions snippet.
    it('stand before Split Right and the opener in the tab row', () => {
        const html = drawn();
        expect(html).toContain(MINE);
        expect(html.indexOf(MINE)).toBeLessThan(html.indexOf(SPLIT));
        expect(html.indexOf(SPLIT)).toBeLessThan(html.indexOf(MORE));
    });

    // Revert: draw them only where the pane's own actions are drawn.
    it('stay when the editor actions are hidden, being the tab own and not the pane', () => {
        const html = drawn({ editor_actions: 'hidden' });
        expect(html).toContain(MINE);
        expect(html).not.toContain(SPLIT);
        expect(html).not.toContain(MORE);
    });

    it('stand in the title row of show_tabs none', () => {
        const html = drawn({ show_tabs: 'none' });
        expect(html).toContain(MINE);
        expect(html.indexOf(MINE)).toBeLessThan(html.indexOf(MORE));
    });

    it('stand before the lock mark of a locked pane', () => {
        const html = drawn({}, true);
        expect(html).toContain(MINE);
        expect(html.indexOf(MINE)).toBeLessThan(
            html.indexOf(`aria-label="${t('ui.strip_unlock')}"`)
        );
    });
});
