// Layer 3, shell test. The pane menu's move-to-page items: which pages are offered and what each
// one is called, over hand-built page lists.
//
// What this does NOT cover: the menu opening and the item being pressed. There is no DOM in this
// suite, so a closed Menu renders its opener and no list; the move itself is
// tests/state/pages.test.ts and the press is a browser check.

import { describe, expect, it } from 'vitest';
import {
    EMBED,
    embedPageItems,
    foldable,
    pageMoveItems,
    PAGE
} from '../../src/lib/shell/pane-view.ts';
import { pageName, pageNameOf } from '../../src/lib/shell/page-strip.ts';
import { pane, split } from '../state/layout-fixture.ts';
import { engineDir, loadConfig, textCatalog } from '../../src/lib/data/sources/config.ts';
import { setCatalog, t } from '../../src/lib/state/text.ts';
import { defaultWorkbench, pageLeaf, type Page } from '../../src/lib/state/layout/index.ts';

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

describe('the pane menu show-a-page items', () => {
    /** A page whose tree shows another page beside a pane of its own. */
    function showing(id: string, label: string, nested: string): Page {
        return {
            id,
            label,
            workbench: { root: split('row', [0.5, 0.5], [pane(['a']), pageLeaf(nested)]) }
        };
    }

    it('offers every page but the one the pane is in, each under the EMBED mark', () => {
        const pages = [page('one', 'Writing'), page('two', 'Reading'), page('three', 'Sessions')];
        expect(embedPageItems(pages, 'two', 'two', t).map((item) => item.id)).toEqual([
            `${EMBED}one`,
            `${EMBED}three`
        ]);
        expect(embedPageItems(pages, 'two', 'two', t).map((item) => item.label)).toEqual([
            t('ui.embed_page', 'Writing'),
            t('ui.embed_page', 'Sessions')
        ]);
    });

    it('leaves out a page that already shows the one the pane is in, and one it already shows', () => {
        const pages = [showing('one', 'Writing', 'two'), page('two', 'Reading')];
        expect(embedPageItems(pages, 'two', 'two', t).map((item) => item.id)).toEqual([]);
        expect(embedPageItems(pages, 'one', 'one', t).map((item) => item.id)).toEqual([]);
    });

    it('leaves out a page the screen already draws, wherever on it the pane sits', () => {
        // The strip is on page one, which shows page two; the pane inside page two is offered
        // neither page three drawn nowhere nor a page the screen already holds.
        const pages = [
            showing('one', 'Writing', 'two'),
            page('two', 'Reading'),
            page('three', 'Sessions')
        ];
        expect(embedPageItems(pages, 'one', 'two', t).map((item) => item.id)).toEqual([
            `${EMBED}three`
        ]);
        const both = [
            {
                id: 'one',
                label: 'Writing',
                workbench: {
                    root: split('row', [0.5, 0.5], [pageLeaf('two'), pageLeaf('three')])
                }
            },
            page('two', 'Reading'),
            page('three', 'Sessions')
        ];
        expect(embedPageItems(both, 'one', 'two', t).map((item) => item.id)).toEqual([]);
    });

    it('numbers an unlabelled page by its place in the whole strip', () => {
        const pages = [page('one', 'Writing'), page('two', '')];
        expect(embedPageItems(pages, 'one', 'one', t).map((item) => item.label)).toEqual([
            t('ui.embed_page', t('ui.page_default', 2))
        ]);
    });

    it('offers nothing when the pane is in the only page there is', () => {
        expect(embedPageItems([page('one', '')], 'one', 'one', t)).toEqual([]);
    });
});

describe('what a page is called', () => {
    it('is its own name, or its place in the strip when it has none', () => {
        const pages = [page('one', 'Writing'), page('two', '')];
        expect(pageName(pages[0], 0)).toBe('Writing');
        expect(pageName(pages[1], 1)).toBe(t('ui.page_default', 2));
        expect(pageNameOf(pages, 'two')).toBe(t('ui.page_default', 2));
        expect(pageNameOf(pages, 'gone')).toBe('');
    });
});

describe('the fold item', () => {
    it('is offered on a child of a split and not on the root pane', () => {
        const root = split('row', [0.5, 0.5], [pane(['a']), pane(['b'])]);
        expect(foldable(pane(['a']), [])).toBe(false);
        expect(foldable(root, [])).toBe(false);
        expect(foldable(root, [0])).toBe(true);
        expect(foldable(root, [1])).toBe(true);
    });

    it('is not offered on the last open child of a split, which a fold would leave empty', () => {
        const root = { ...split('row', [0.5, 0.5], [pane(['a']), pane(['b'])]), folded: [0] };
        expect(foldable(root, [1])).toBe(false);
        expect(foldable(root, [0])).toBe(false);
    });
});
