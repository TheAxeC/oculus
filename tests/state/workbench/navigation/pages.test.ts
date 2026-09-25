// What a page is called, which tabs it holds, what closing it asks, and which of its tabs hold text
// no save has taken: the rules the shell's pane menus and page leaves, the Pages view and the
// status bar's unsaved count all read, over hand-built page lists and instance ids.

import { describe, expect, it } from 'vitest';
import {
    closeQuestion,
    firstUnsaved,
    pageAt,
    pageInstanceIds,
    pageName,
    pageNameOf,
    railPageViews,
    unsavedCount,
    pageUnsaved
} from '../../../../src/lib/state/workbench/navigation/pages.ts';
import type { Page } from '../../../../src/lib/state/workbench/layout/index.ts';
import { bench, instance, pane, split } from '../layout/layout-fixture.ts';
import { engineDir, loadConfig, textCatalog } from '../../../../src/lib/data/sources/config.ts';
import { setCatalog, t } from '../../../../src/lib/state/shared/words/text.ts';

setCatalog(textCatalog(loadConfig(engineDir()).config));

/** One page holding a tree, named as given. */
function page(id: string, label: string, root = pane([])): Page {
    return { id, label, workbench: bench(root) };
}

describe('what a page is called', () => {
    it('is its own name, or its place in the page list when it has none', () => {
        // revert: src/lib/state/workbench/navigation/pages.ts:19 => return page.label;
        const pages = [page('one', 'Writing'), page('two', '')];
        expect(pageName(pages[0], 0)).toBe('Writing');
        expect(pageName(pages[1], 1)).toBe(t('ui.page_default', 2));
        expect(pageNameOf(pages, 'two')).toBe(t('ui.page_default', 2));
    });

    it('is nothing for an id the list does not hold', () => {
        // revert: src/lib/state/workbench/navigation/pages.ts:25 => return found === null ? pageName(pages[0], 0) : pageName(found.page, found.at);
        expect(pageNameOf([page('one', 'Writing')], 'gone')).toBe('');
    });
});

// The one rule the tab's own close, the pane menu's close and a page's close all take, so the same
// tabs asked about in three places get the same question.
describe('the question a close asks', () => {
    const dirty = (id: string): boolean => id === 'unsaved';

    it('asks nothing over one instance with nothing unsaved in it', () => {
        // revert: src/lib/state/workbench/navigation/pages.ts:49 => return 'dirty';
        expect(closeQuestion(['saved'], dirty)).toBe('none');
        expect(closeQuestion([], dirty)).toBe('none');
    });

    it('asks about the text over one instance holding unsaved text', () => {
        // revert: src/lib/state/workbench/navigation/pages.ts:49 => return 'none';
        expect(closeQuestion(['unsaved'], dirty)).toBe('dirty');
    });

    it("asks the caller's own question over more than one, unsaved or not", () => {
        // revert: src/lib/state/workbench/navigation/pages.ts:48 => delete
        expect(closeQuestion(['saved', 'other'], dirty)).toBe('many');
        expect(closeQuestion(['saved', 'unsaved'], dirty)).toBe('many');
    });

    it("lists every instance of every pane of a page, in the tree's own order", () => {
        // revert: src/lib/state/workbench/navigation/pages.ts:33 => return tabsOf(page.workbench.root).map((instance) => instance.id).reverse();
        const two = split('row', [0.5, 0.5], [pane(['a']), pane(['b', 'c'])]);
        expect(pageInstanceIds(page('p', '', pane(['a', 'b'])))).toEqual(['a', 'b']);
        expect(pageInstanceIds(page('p', '', two))).toEqual(['a', 'b', 'c']);
        expect(pageInstanceIds(page('p', ''))).toEqual([]);
    });
});

describe('the tabs holding unsaved text, across every page', () => {
    const pages = [
        page('one', 'One', pane(['a', 'b'])),
        page('two', 'Two', split('row', [0.5, 0.5], [pane(['c']), pane(['d'])]))
    ];

    it('counts every unsaved tab on every page', () => {
        // revert: src/lib/state/workbench/navigation/pages.ts:69 => return pageInstanceIds(pages[0] ?? page('', '')).filter(unsaved).length;
        expect(unsavedCount(pages, (id) => id === 'b' || id === 'd')).toBe(2);
        expect(unsavedCount(pages, () => false)).toBe(0);
        expect(unsavedCount([], () => true)).toBe(0);
    });

    it('finds the first one in page order and then tree order, with its page', () => {
        // revert: src/lib/state/workbench/navigation/pages.ts:62 => if (found !== undefined) return { page: pages[0].id, instance: found };
        expect(firstUnsaved(pages, (id) => id === 'd' || id === 'c')).toEqual({
            page: 'two',
            instance: 'c'
        });
        expect(firstUnsaved(pages, () => false)).toBe(null);
    });
});

/** How many instances viewed() has made, so each gets an id of its own. */
let made = 0;

/** A pane whose tabs show these views, one instance each. */
function viewed(views: string[]): ReturnType<typeof pane> {
    const tabs = views.map((view) => instance(`tab-${(made += 1)}`, view));
    return { kind: 'pane', tabs, active: tabs[0].id };
}

describe('the views a rail button draws the badges of', () => {
    it('are the tabs of the page carrying its key, in tree order and each once', () => {
        // revert: src/lib/state/workbench/navigation/pages.ts:80 => const root = parseArrangement(node)?.root;
        const held: Page = {
            ...page(
                'one',
                'Mine',
                split('row', [0.5, 0.5], [viewed(['inbox', 'audit']), viewed(['inbox', 'hpc'])])
            ),
            rail: 'info'
        };
        const node = { root: { kind: 'pane', view: 'status' } };
        expect(railPageViews([held], 'info', node)).toEqual(['inbox', 'audit', 'hpc']);
    });

    it('are the views of the arrangement before the page is made, and none for a broken one', () => {
        // revert: src/lib/state/workbench/navigation/pages.ts:80 => const root = made?.workbench.root;
        const node = { root: { kind: 'pane', view: ['status', 'audit'] } };
        expect(railPageViews([], 'info', node)).toEqual(['status', 'audit']);
        expect(railPageViews([], 'info', { root: 'nothing' })).toEqual([]);
    });
});

describe('whether a page holds unsaved text', () => {
    // revert: src/lib/state/workbench/navigation/pages.ts:87 => return false;
    it('is whether any of its tabs does', () => {
        const held = page('p', '', pane(['a', 'b']));
        expect(pageUnsaved(held, (id) => id === 'b')).toBe(true);
        expect(pageUnsaved(held, () => false)).toBe(false);
        expect(pageUnsaved(page('q', ''), () => true)).toBe(false);
    });
});

describe('where a page sits in the page list', () => {
    // revert: src/lib/state/workbench/navigation/pages.ts:93 => return at < 0 ? null : { page: pages[0], at };
    it('is the page of that id with its place, and nothing for an id the list lacks', () => {
        const pages = [page('a', 'One'), page('b', '')];
        expect(pageAt(pages, 'b')).toEqual({ page: pages[1], at: 1 });
        // The list holds no page of that id, so it has no place in it.
        expect(pageAt(pages, 'gone')).toBeNull();
        expect(pageNameOf(pages, 'b')).toBe(t('ui.page_default', 2));
    });
});
