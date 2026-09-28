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
    pageUnsaved,
    questionFor,
    resetAsk,
    resetPlan,
    tabNameOf,
    type Question
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
        const pages = [page('one', 'Writing'), page('two', '')];
        expect(pageName(pages[0], 0)).toBe('Writing');
        expect(pageName(pages[1], 1)).toBe(t('ui.page_default', 2));
        expect(pageNameOf(pages, 'two')).toBe(t('ui.page_default', 2));
    });

    it('is nothing for an id the list does not hold', () => {
        expect(pageNameOf([page('one', 'Writing')], 'gone')).toBe('');
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

    it("lists every instance of every pane of a page, in the tree's own order", () => {
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
        expect(unsavedCount(pages, (id) => id === 'b' || id === 'd')).toBe(2);
        expect(unsavedCount(pages, () => false)).toBe(0);
        expect(unsavedCount([], () => true)).toBe(0);
    });

    it('finds the first one in page order and then tree order, with its page', () => {
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
        const node = { root: { kind: 'pane', view: ['status', 'audit'] } };
        expect(railPageViews([], 'info', node)).toEqual(['status', 'audit']);
        expect(railPageViews([], 'info', { root: 'nothing' })).toEqual([]);
    });
});

describe('whether a page holds unsaved text', () => {
    it('is whether any of its tabs does', () => {
        const held = page('p', '', pane(['a', 'b']));
        expect(pageUnsaved(held, (id) => id === 'b')).toBe(true);
        expect(pageUnsaved(held, () => false)).toBe(false);
        expect(pageUnsaved(page('q', ''), () => true)).toBe(false);
    });
});

describe('where a page sits in the page list', () => {
    it('is the page of that id with its place, and nothing for an id the list lacks', () => {
        const pages = [page('a', 'One'), page('b', '')];
        expect(pageAt(pages, 'b')).toEqual({ page: pages[1], at: 1 });
        // The list holds no page of that id, so it has no place in it.
        expect(pageAt(pages, 'gone')).toBeNull();
        expect(pageNameOf(pages, 'b')).toBe(t('ui.page_default', 2));
    });
});

describe('what a tab is called', () => {
    it('is its state label, else its view name, else the view id the registry lacks', () => {
        const viewFor = (id: string) => (id === 'status' ? { label: 'views.status' } : undefined);
        const named = { ...instance('a', 'status'), state: { label: 'My notes' } };
        expect(tabNameOf(named, viewFor)).toBe('My notes');
        // An empty label names nothing, so the view's name stands.
        const blank = { ...instance('b', 'status'), state: { label: '' } };
        expect(tabNameOf(blank, viewFor)).toBe(t('views.status'));
        expect(tabNameOf(instance('c', 'gone'), viewFor)).toBe('gone');
    });
});

describe('the asker a confirm draws', () => {
    it('shows each question, settles it with the answer, and answers a superseded one no', async () => {
        const shown: (Question | null)[] = [];
        const ask = questionFor((held) => shown.push(held));
        const first = ask('one?', '');
        const second = ask('two?', 'more');
        expect(await first).toBe(false);
        shown.at(-1)?.answer(true);
        expect(await second).toBe(true);
        expect(shown.map((held) => held?.message ?? null)).toEqual(['one?', 'two?', null]);
        // The first question's own answer, given late, settles nothing.
        shown[0]?.answer(true);
        expect(shown.at(-1)).toBe(null);
    });
});

describe('what resetting the pages does', () => {
    const FOCUS = { root: { kind: 'pane', view: 'focus' } };
    const rail = [
        { page: 'focus', label: 'Focus', node: FOCUS },
        { page: 'broken', label: 'Broken', node: 'not a node' }
    ];
    /** A page tied to the rail button of `key`, holding one tab per id. */
    const tied = (id: string, label: string, key: string, ids: string[] = []): Page => ({
        ...page(id, label, pane(ids)),
        rail: key
    });

    it('rebuilds the pages of buttons the rail has and removes those of buttons it lost', () => {
        const pages = [
            page('own', 'Mine'),
            tied('f', 'Focus', 'focus'),
            tied('o', 'Old', 'old'),
            tied('b', 'Broken', 'broken')
        ];
        const plan = resetPlan(pages, rail);
        expect(plan.removed.map((one) => one.id)).toEqual(['o']);
        expect(plan.rebuilt.map((one) => one.id)).toEqual(['f']);
    });

    it('leaves a page no button made in neither list', () => {
        expect(resetPlan([page('own', 'Mine')], rail)).toEqual({ rebuilt: [], removed: [] });
    });

    it('names each page it rebuilds and removes', () => {
        const focus = tied('f', 'Focus', 'focus', ['a', 'unsaved']);
        const old = tied('o', 'Old', 'old', ['b']);
        const all = [page('own', 'Mine'), focus, old];
        const words = resetAsk(all, [focus], [old]);
        expect(words.message).toBe(t('workbench.reset_all_confirm'));
        expect(words.detail).toBe(
            [t('workbench.reset_rebuilt', 'Focus'), t('workbench.reset_removed', 'Old')].join(' ')
        );
    });

    it('asks about one page by its name when one page is reset', () => {
        const focus = tied('f', 'Focus', 'focus');
        const words = resetAsk([focus], [focus], [], focus);
        expect(words.message).toBe(t('workbench.reset_page_confirm', 'Focus'));
        expect(words.detail).toBe(t('workbench.reset_rebuilt', 'Focus'));
    });
});
