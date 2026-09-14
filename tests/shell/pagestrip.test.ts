// The page strip rendered to HTML on the server: one tab per page, the current one marked, the
// shortcut in each tab's tooltip, and the opener of the menu that makes, renames and opens pages.
//
// What this does NOT cover: the menu opening, the rename box and the confirm. There is no DOM in
// this suite, so no menu is clicked and no $effect runs; a closed Menu renders its opener and no
// list, and the rename box is drawn only after the menu has been picked from. Those are the
// browser's check.

import { describe, expect, it } from 'vitest';
import { render } from 'svelte/server';
import PageStrip from '../../src/lib/shell/PageStrip.svelte';
import {
    engineDir,
    glyphCatalog,
    loadConfig,
    textCatalog
} from '../../src/lib/data/sources/config.ts';
import { setCatalog, setGlyphs } from '../../src/lib/state/text.ts';
import {
    loadLayout,
    movePage,
    openPage,
    renamePage,
    pages
} from '../../src/lib/state/layout.svelte.ts';
import { fakeStorage } from '../state/layout-fixture.ts';

const { config } = loadConfig(engineDir());
setCatalog(textCatalog(config));
setGlyphs(glyphCatalog(config));

/** Two pages, the second one current, which is what the strip is asked to draw. */
function strip(reorder = false): string {
    loadLayout(fakeStorage());
    renamePage(pages()[0].id, 'Reading');
    openPage('Runs');
    if (reorder) movePage(pages()[1].id, 0);
    return render(PageStrip, {
        props: { arrangements: [{ name: 'sessions', label: 'Sessions', node: null }] }
    }).body;
}

const body = strip();

describe('the page strip', () => {
    it('draws one tab per page, naming each of them', () => {
        expect([...body.matchAll(/role="tab"/g)]).toHaveLength(2);
        expect(body).toContain('Reading');
        expect(body).toContain('Runs');
    });

    it('gives every page tab a drag handle', () => {
        expect([...body.matchAll(/data-drag-handle=""/g)]).toHaveLength(2);
    });

    it('draws pages in the order held by the layout store', () => {
        const moved = strip(true);
        expect(moved.indexOf('Runs')).toBeLessThan(moved.indexOf('Reading'));
    });

    it('marks the page on screen and no other', () => {
        expect([...body.matchAll(/aria-selected="true"/g)]).toHaveLength(1);
        // Runs is the second tab, so everything from the mark on names it and not the first page.
        const selected = body.slice(body.indexOf('aria-selected="true"'));
        expect(selected).toContain('Runs');
        expect(selected).not.toContain('Reading');
    });

    it('names the shortcut that reaches each page', () => {
        expect(body).toContain('Reading - press 1');
        expect(body).toContain('Runs - press 2');
    });

    it('puts the page menu at the right of the strip', () => {
        expect([...body.matchAll(/aria-haspopup="menu"/g)]).toHaveLength(1);
        expect(body).toContain('aria-label="Page"');
    });

    it('is the strip of pages, for anything reading the page by its regions', () => {
        expect(body).toContain('aria-label="Pages"');
    });
});
