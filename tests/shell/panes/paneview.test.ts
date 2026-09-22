// Layer 3, shell test. The pane menu's move-to-page items and the question a close asks, over
// hand-built page lists and instance ids.
//
// What this does NOT cover: the menu opening and the item being pressed. There is no DOM in this
// suite, so a closed Menu renders its opener and no list; the move itself is
// tests/state/workbench/layout/pages.test.ts and the press is a browser check.

import { describe, expect, it } from 'vitest';
import {
    EMBED,
    EMBED_LIST,
    embedPageItems,
    foldable,
    MOVE_LIST,
    pageListItems,
    pageMoveItems,
    PAGE
} from '../../../src/lib/shell/panes/pane-view.ts';
import { menuLevel, type MenuItem } from '../../../src/lib/ui/menu/menu-items.ts';
import { closeQuestion } from '../../../src/lib/shell/closing.ts';
import { pageName, pageNameOf } from '../../../src/lib/shell/panes/page-strip.ts';
import { pane, split } from '../../state/workbench/layout/layout-fixture.ts';
import { engineDir, loadConfig, textCatalog } from '../../../src/lib/data/sources/config.ts';
import { setCatalog, t } from '../../../src/lib/state/words/text.ts';
import {
    defaultWorkbench,
    pageLeaf,
    type Page
} from '../../../src/lib/state/workbench/layout/index.ts';

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

describe('the pane menu page choices', () => {
    const seven = ['one', 'two', 'three', 'four', 'five', 'six', 'seven'].map((id) => page(id, ''));

    it('gathers seven pages under two choices, each holding the items it stands for', () => {
        const found = pageListItems(seven, 'one', 'one', t);
        expect(found.map((item) => [item.id, item.label])).toEqual([
            [MOVE_LIST, t('ui.move_to_page_list')],
            [EMBED_LIST, t('ui.embed_page_list')]
        ]);
        expect(found[0].items).toEqual(pageMoveItems(seven, 'one', t));
        expect(found[1].items).toEqual(embedPageItems(seven, 'one', 'one', t));
        expect(found[0].items).toHaveLength(6);
        expect(found[1].items).toHaveLength(6);
    });

    it('offers neither choice on a layout of one page, and nothing on none', () => {
        expect(pageListItems([page('one', '')], 'one', 'one', t)).toEqual([]);
        expect(pageListItems([], 'one', 'one', t)).toEqual([]);
    });

    it('offers the move choice alone when every other page is already on the screen', () => {
        const pages = [
            {
                id: 'one',
                label: '',
                workbench: { root: split('row', [0.5, 0.5], [pane(['a']), pageLeaf('two')]) }
            },
            page('two', '')
        ];
        expect(pageListItems(pages, 'one', 'one', t).map((item) => item.id)).toEqual([MOVE_LIST]);
    });

    it('keeps its two ids apart from every page item, whatever a page is called', () => {
        const odd = [page('one', ''), page(MOVE_LIST, ''), page(EMBED_LIST, '')];
        const found = pageListItems(odd, 'one', 'one', t);
        const children = found.flatMap((item) => (item.items ?? []).map((child) => child.id));
        expect(children).not.toContain(MOVE_LIST);
        expect(children).not.toContain(EMBED_LIST);
        expect(new Set(children).size).toBe(children.length);
    });
});

describe('the list a menu shows', () => {
    const inner: MenuItem[] = [{ id: 'page:two', label: 'Two' }];
    const items: MenuItem[] = [
        { id: 'close', label: 'Close' },
        { id: MOVE_LIST, label: 'Move', items: inner },
        { id: 'empty', label: 'Empty', items: [] }
    ];

    it('is the menu own list while no choice is open', () => {
        expect(menuLevel(items, null)).toBeNull();
    });

    it('is the list of the choice that is open, an empty one included', () => {
        expect(menuLevel(items, MOVE_LIST)).toBe(inner);
        expect(menuLevel(items, 'empty')).toEqual([]);
    });

    it('falls back to the menu own list for a choice that has gone or holds no list', () => {
        expect(menuLevel(items, 'close')).toBeNull();
        expect(menuLevel(items, 'gone')).toBeNull();
        expect(menuLevel(items, '')).toBeNull();
        expect(menuLevel([], MOVE_LIST)).toBeNull();
    });

    it('opens the first of two choices that share an id', () => {
        const twice: MenuItem[] = [
            { id: 'same', label: 'First', items: inner },
            { id: 'same', label: 'Second', items: [] }
        ];
        expect(menuLevel(twice, 'same')).toBe(inner);
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

// The one rule the tab's own close, the pane menu's close and a page's close all take, so the same
// tabs asked about in three places get the same question.
describe('the question a close asks', () => {
    const dirty = (id: string): boolean => id === 'unsaved';

    it('asks nothing over one instance with nothing unsaved in it', () => {
        expect(closeQuestion(['saved'], dirty)).toBe('none');
        expect(closeQuestion([], dirty)).toBe('none');
    });

    it('asks about the text over one instance holding unsaved text', () => {
        expect(closeQuestion(['unsaved'], dirty)).toBe('dirty');
    });

    it("asks the caller's own question over more than one, unsaved or not", () => {
        expect(closeQuestion(['saved', 'other'], dirty)).toBe('many');
        expect(closeQuestion(['saved', 'unsaved'], dirty)).toBe('many');
    });

    it('asks nothing of any instance when nothing reports unsaved text', () => {
        expect(closeQuestion(['unsaved'], () => false)).toBe('none');
    });
});
