// Layer 2, client-state tests. What a page is called, which tabs it holds, what closing it asks,
// and which of its tabs hold text no save has taken: the rules the shell's pane menus and page
// leaves, the Pages view and the status bar's unsaved count all read, over hand-built page lists
// and instance ids.

import { describe, expect, it } from 'vitest';
import {
    closeAsk,
    closeOnce,
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
    resetAfterAsking,
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

describe('what a close asks once a busy terminal is known', () => {
    const dirty = (id: string): boolean => id === 'text';
    const nameOf = (id: string): string => (id === 'text' ? 'notes.md' : id);
    const build = { id: 'a1a1a1-shell', name: 'build', command: 'npm' };
    const MANY = 'Close this pane and the 2 tabs in it?';

    // Revert: return the many-tabs question for a single saved tab holding no busy terminal.
    it('acts at once over one saved tab holding an idle shell', () => {
        expect(closeAsk({ ids: ['t'], unsaved: dirty, nameOf, many: MANY, busy: [] })).toBe(null);
        expect(closeAsk({ ids: [], unsaved: dirty, nameOf, many: MANY, busy: [] })).toBe(null);
    });

    // Revert: leave the terminal and its program out of the busy question.
    it('asks the busy question over one tab, naming the terminal and its program', () => {
        const ask = closeAsk({ ids: ['t'], unsaved: dirty, nameOf, many: MANY, busy: [build] });
        expect(ask?.message).toBe(t('ui.terminal_close_busy'));
        expect(ask?.detail).toContain('build');
        expect(ask?.detail).toContain('npm');
    });

    // Revert: word a terminal whose read failed as running nothing.
    it('names a terminal whose program could not be read without inventing one', () => {
        const ask = closeAsk({
            ids: ['t'],
            unsaved: dirty,
            nameOf,
            many: MANY,
            busy: [{ ...build, command: '' }]
        });
        expect(ask?.detail).toContain('build');
        expect(ask?.detail).toContain(t('ui.terminal_busy_unread', 'build'));
    });

    // Revert: return null for one tab holding unsaved text when no terminal is busy.
    it('keeps the unsaved question for one tab holding unsaved text', () => {
        const ask = closeAsk({ ids: ['text'], unsaved: dirty, nameOf, many: MANY, busy: [] });
        expect(ask).toEqual({ message: t('ui.tab_close_dirty'), detail: '' });
    });

    // Revert: drop the unsaved tab from the detail, or name the terminal before it.
    it('asks one question over a pane with unsaved text and a busy terminal, the text first', () => {
        const ask = closeAsk({
            ids: ['text', 't'],
            unsaved: dirty,
            nameOf,
            many: MANY,
            busy: [build]
        });
        expect(ask?.message).toBe(MANY);
        const detail = ask?.detail ?? '';
        expect(detail).toContain('notes.md');
        expect(detail).toContain('build');
        expect(detail.indexOf('notes.md')).toBeLessThan(detail.indexOf('build'));
    });

    // Revert: leave the many question out of a pane of several tabs with nothing unsaved or busy.
    it("keeps the caller's own question over more than one tab", () => {
        expect(closeAsk({ ids: ['a', 'b'], unsaved: dirty, nameOf, many: MANY, busy: [] })).toEqual(
            {
                message: MANY,
                detail: ''
            }
        );
    });
});

describe('a second press of a close while its read is in flight', () => {
    // Revert: run the read again for a key whose read has not answered in closeOnce.
    it('does nothing: one read, one decision', async () => {
        const once = closeOnce();
        let reads = 0;
        let decided = 0;
        let answer: (value: []) => void = () => undefined;
        const read = (): Promise<[]> => {
            reads += 1;
            return new Promise((resolve) => (answer = resolve));
        };
        const first = once('tab-1', read, () => (decided += 1));
        const second = once('tab-1', read, () => (decided += 1));
        answer([]);
        await Promise.all([first, second]);
        expect(reads).toBe(1);
        expect(decided).toBe(1);
    });

    // Revert: keep a key held after its read answered, or hold every key as one.
    it('lets the same close be pressed again once it answered, and another key meanwhile', async () => {
        const once = closeOnce();
        let reads = 0;
        const read = (): Promise<[]> => {
            reads += 1;
            return Promise.resolve([]);
        };
        await once('tab-1', read, () => undefined);
        await once('tab-1', read, () => undefined);
        const held = once('tab-2', read, () => undefined);
        const other = once('tab-3', read, () => undefined);
        await Promise.all([held, other]);
        expect(reads).toBe(4);
    });

    // Revert: leave a key held when its read rejects.
    it('lets the close be pressed again after a read that rejected', async () => {
        const once = closeOnce();
        await once(
            'tab-1',
            () => Promise.reject(new Error('down')),
            () => undefined
        ).catch(() => undefined);
        let decided = 0;
        await once(
            'tab-1',
            () => Promise.resolve([]),
            () => (decided += 1)
        );
        expect(decided).toBe(1);
    });
});

describe('a reset asking about a busy terminal', () => {
    const focus: Page = { ...page('f', 'Focus', pane(['a', 'b'])), rail: 'focus' };
    const words = { message: 'Reset?', detail: '' };
    const build = { id: 'a1a1a1-shell', name: 'build', command: 'npm' };
    const names = (): string => 'tab';

    /** An asker that answers as the case says and keeps each question it was put. */
    function asker(answers: boolean[]) {
        const asked: { message: string; detail: string }[] = [];
        return {
            asked,
            ask: (message: string, detail: string): Promise<boolean> => {
                asked.push({ message, detail });
                return Promise.resolve(answers[asked.length - 1] ?? true);
            }
        };
    }

    // Revert: ask the busy question once per tab of the touched pages instead of once.
    it('asks the busy question once, naming each busy terminal, after its own and before acting', async () => {
        const { asked, ask } = asker([true, true]);
        let acted = 0;
        const busy = [build, { id: 'b2b2b2-shell', name: 'watch', command: 'tsc' }];
        const ran = await resetAfterAsking(
            [focus],
            words,
            [focus],
            () => false,
            names,
            ask,
            () => (acted += 1),
            () => Promise.resolve(busy)
        );
        expect(ran).toBe(true);
        expect(acted).toBe(1);
        expect(asked).toHaveLength(2);
        expect(asked[0].message).toBe('Reset?');
        expect(asked[1].message).toBe(t('ui.terminal_close_busy'));
        expect(asked[1].detail).toContain('build');
        expect(asked[1].detail).toContain('watch');
    });

    // Revert: act on the reset when the busy question is answered no.
    it('resets nothing when the busy question is answered no', async () => {
        const { ask } = asker([true, false]);
        let acted = 0;
        const ran = await resetAfterAsking(
            [focus],
            words,
            [focus],
            () => false,
            names,
            ask,
            () => (acted += 1),
            () => Promise.resolve([build])
        );
        expect(ran).toBe(false);
        expect(acted).toBe(0);
    });

    // Revert: ask the busy question when no terminal is busy.
    it('asks no busy question when none is busy', async () => {
        const { asked, ask } = asker([true]);
        let acted = 0;
        await resetAfterAsking(
            [focus],
            words,
            [focus],
            () => false,
            names,
            ask,
            () => (acted += 1),
            () => Promise.resolve([])
        );
        expect(asked).toHaveLength(1);
        expect(acted).toBe(1);
    });
});

/** The registry of the cases below: one view the registry holds, named by a catalog key. */
const viewForStatus = (id: string) => (id === 'status' ? { label: 'views.status' } : undefined);

describe('the name a tab state gives and the views an arrangement node holds', () => {
    const rows: [string, () => unknown, unknown][] = [
        [
            'a tab named by a state that is null',
            () => tabNameOf({ ...instance('a', 'status'), state: null }, viewForStatus),
            'Status'
        ],
        [
            'a tab named by a state with no label',
            () => tabNameOf({ ...instance('a', 'status'), state: { id: 'x' } }, viewForStatus),
            'Status'
        ],
        [
            'a tab named by a label that is a number',
            () => tabNameOf({ ...instance('a', 'status'), state: { label: 3 } }, viewForStatus),
            'Status'
        ],
        [
            'a tab named by an empty label',
            () => tabNameOf({ ...instance('a', 'status'), state: { label: '' } }, viewForStatus),
            'Status'
        ],
        [
            'a tab named by a label',
            () =>
                tabNameOf({ ...instance('a', 'status'), state: { label: 'Mine' } }, viewForStatus),
            'Mine'
        ],
        [
            'a tab named by a state with an own __proto__ key',
            () =>
                tabNameOf(
                    {
                        ...instance('a', 'status'),
                        state: JSON.parse('{"__proto__":{"label":"p"},"b":1}')
                    },
                    viewForStatus
                ),
            'Status'
        ],
        [
            'a tab of a view the registry lacks, named by a label that is a number',
            () => tabNameOf({ ...instance('a', 'gone'), state: { label: 3 } }, viewForStatus),
            'gone'
        ],
        [
            'the views of a pane whose tab is a map with a view',
            () =>
                railPageViews([], 'k', {
                    root: { kind: 'pane', view: ['a', { view: 'b', state: { x: 1 } }, 'a'] }
                }),
            ['a', 'b']
        ],
        [
            'the views of a split of two panes',
            () =>
                railPageViews([], 'k', {
                    root: {
                        kind: 'split',
                        dir: 'col',
                        sizes: [0.5, 0.5],
                        children: [
                            { kind: 'pane', view: 'a' },
                            { kind: 'pane', view: ['b', 'a'] }
                        ]
                    }
                }),
            ['a', 'b']
        ]
    ];

    it.each(rows)('%s', (_name, run, expected) => {
        expect(run()).toStrictEqual(expected);
    });
});
