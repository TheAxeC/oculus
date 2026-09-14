// Layer 3, shell test. The pane menu's move-to-page items: which pages are offered and what each
// one is called, over hand-built page lists.
//
// What this does NOT cover: the menu opening and the item being pressed. There is no DOM in this
// suite, so a closed Menu renders its opener and no list; the move itself is
// tests/state/pages.test.ts and the press is a browser check.

import { describe, expect, it } from 'vitest';
import { pageMoveItems, PAGE } from '../../src/lib/shell/pane-view.ts';
import { engineDir, loadConfig, textCatalog } from '../../src/lib/data/sources/config.ts';
import { setCatalog, t } from '../../src/lib/state/text.ts';
import { defaultWorkbench, type Page } from '../../src/lib/state/layout/index.ts';

setCatalog(textCatalog(loadConfig(engineDir()).config));

function page(id: string, label: string): Page {
    return { id, label, workbench: defaultWorkbench() };
}

describe('the pane menu move-to-page items', () => {
    it('offers every page but the one on screen, each under the PAGE mark', () => {
        const pages = [page('one', 'Writing'), page('two', 'Reading'), page('three', 'Sessions')];
        expect(pageMoveItems(pages, 'two', t).map((item) => item.id)).toEqual([
            `${PAGE}one`,
            `${PAGE}three`
        ]);
    });

    it('numbers an unlabelled page by its place in the whole strip, not among the others', () => {
        const pages = [page('one', 'Writing'), page('two', ''), page('three', '')];
        expect(pageMoveItems(pages, 'one', t).map((item) => item.label)).toEqual([
            t('ui.move_to_page', t('ui.page_default', 2)),
            t('ui.move_to_page', t('ui.page_default', 3))
        ]);
    });

    it('keeps the number of a page after the current one, which is the number the strip draws', () => {
        const pages = [page('one', ''), page('two', ''), page('three', '')];
        expect(pageMoveItems(pages, 'one', t).map((item) => item.label)).toEqual([
            t('ui.move_to_page', t('ui.page_default', 2)),
            t('ui.move_to_page', t('ui.page_default', 3))
        ]);
        expect(pageMoveItems(pages, 'three', t).map((item) => item.label)).toEqual([
            t('ui.move_to_page', t('ui.page_default', 1)),
            t('ui.move_to_page', t('ui.page_default', 2))
        ]);
    });

    it('offers nothing when the page on screen is the only one', () => {
        expect(pageMoveItems([page('one', '')], 'one', t)).toEqual([]);
    });
});
