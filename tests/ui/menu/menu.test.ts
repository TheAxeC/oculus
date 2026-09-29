// Layer 3, primitive tests. The menu's items as the page draws them, rendered on the server inside
// an open menu: a choice holding a list of its own is a submenu's trigger, and each item keeps its
// check, its dot, its glyph and its badge, with its label as its accessible name.
//
// What this does NOT cover: the keys, the focus and where a list is placed, which need a DOM and
// are seen on the page.

import { describe, expect, it } from 'vitest';
import { render } from 'svelte/server';
import OpenMenu from './OpenMenu.svelte';
import type { MenuItem } from '../../../src/lib/ui/menu/menu-items.ts';
import {
    engineDir,
    glyphCatalog,
    loadConfig,
    textCatalog
} from '../../../src/lib/data/sources/config.ts';
import { setCatalog, setGlyphs } from '../../../src/lib/state/shared/words/text.ts';

const { config } = loadConfig(engineDir());
const catalog = textCatalog(config);
setCatalog(catalog);
setGlyphs(glyphCatalog(config));

/** The open menu's markup, the renderer's block markers taken out. */
function drawn(items: MenuItem[]): string {
    return render(OpenMenu, { props: { items } }).body.replace(/<!--[^>]*-->/g, '');
}

/** The element of one menu item, from its opening tag to the next item's. */
function itemOf(body: string, label: string): string {
    const parts = body.split(/(?=<[a-z]+ [^>]*role="menuitem")/);
    return parts.find((part) => part.includes(`>${label}</span>`)) ?? '';
}

describe('a menu choice with a list of its own', () => {
    const items: MenuItem[] = [
        { id: 'close', label: 'Close' },
        { id: 'move', label: 'Move tab to page', items: [{ id: 'page:two', label: 'Two' }] }
    ];

    // Red when the choice goes back to opening its list in place of the menu's, as a plain item:
    // it then carries no bits-ui sub-trigger attribute.
    it('is a submenu trigger, and the menu draws no Back choice', () => {
        const body = drawn(items);
        const move = itemOf(body, 'Move tab to page');
        expect(move).toMatch(/^<[a-z]+ [^>]*data-dropdown-menu-sub-trigger=""/);
        expect(move).toContain('aria-haspopup="menu"');
        expect(itemOf(body, 'Close')).not.toContain('sub-trigger');
        expect(itemOf(body, 'Close')).not.toContain('aria-haspopup');
        expect(body).not.toContain('>Back<');
        const backWords = Object.entries(catalog).filter(
            ([key, words]) => key.startsWith('ui.menu') && words === 'Back'
        );
        expect(backWords).toEqual([]);
    });
});

describe('a menu item', () => {
    const items: MenuItem[] = [
        {
            id: 'one',
            label: 'Current one',
            active: true,
            tone: 'green',
            glyph: 'branch',
            badge: '3',
            badgeGlyph: 'bell'
        },
        { id: 'two', label: 'Plain two', badge: '7' }
    ];

    // An audit of the markup an item keeps. Red when an item stops drawing any of the marks it
    // is given, or the badge is read out.
    it('draws its check, its dot, its glyph and its badge, hidden from its name', () => {
        const body = drawn(items);
        const one = itemOf(body, 'Current one');
        expect(one).toMatch(/class="[^"]*\bcurrent\b/);
        expect(one).toContain('--tone: var(--c-green)');
        expect(one).toContain('data-glyph="branch"');
        expect(one).toMatch(
            /<span class="item-badge[^"]*"[^>]*aria-hidden="true"[^>]*>[\s\S]*data-glyph="bell"[\s\S]*3/
        );
        expect(one).not.toContain('aria-label=');
        const two = itemOf(body, 'Plain two');
        expect(two).not.toMatch(/class="[^"]*\bcurrent\b/);
        expect(two).toMatch(
            /<span class="item-badge[^"]*"[^>]*aria-hidden="true"[^>]*>\s*7\s*<\/span>/
        );
    });
});
