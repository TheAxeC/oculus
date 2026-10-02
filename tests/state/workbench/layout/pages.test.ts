// Pages: the level above the layout tree that DESIGN.md's decision on pages adds. The pure half is
// newPage, defaultPages, checkPages and the version 3 envelope; the store half is which page is on
// screen, what the page operations do to the list, and that every one of them writes the whole list
// down. tests/state/workbench/layout/layout.test.ts covers the trees themselves and is not extended
// here.
//
// Nothing here touches localStorage or the DOM: the store takes the storage it is given. The
// catalog is installed because the store names the page loadLayout and closePage make.

import { beforeEach, describe, expect, it } from 'vitest';
import {
    LAYOUT_VERSION,
    checkPages,
    defaultPages,
    newPage,
    parseLayout,
    serialiseLayout,
    type Pages,
    type Workbench
} from '../../../../src/lib/state/workbench/layout/index.ts';
import { LAYOUT_KEY, PREVIOUS_KEY } from '../../../../src/lib/state/workbench/layout.svelte.ts';
import { engineDir, loadConfig, textCatalog } from '../../../../src/lib/data/sources/config.ts';
import { setCatalog, t } from '../../../../src/lib/state/shared/words/text.ts';
import {
    pageInstanceIds,
    resetAfterAsking,
    resetAsk,
    resetPlan
} from '../../../../src/lib/state/workbench/navigation/pages.ts';
import { bench, docked, fakeStorage, pane, saveBench, three, viewsOf } from './layout-fixture.ts';
import { fields } from '../../../../src/lib/data/helpers/guards.ts';
import { present } from '../../../fixtures/present.ts';
import { createClientState, type ClientState } from '../../../fixtures/client.ts';

let client: ClientState;
let closeInstancesOfView: ClientState['layout']['closeInstancesOfView'];
let closePage: ClientState['layout']['closePage'];
let currentPage: ClientState['layout']['currentPage'];
let foldPane: ClientState['layout']['foldPane'];
let layout: ClientState['layout']['layout'];
let loadLayout: ClientState['layout']['loadLayout'];
let moveInstanceToPage: ClientState['layout']['moveInstanceToPage'];
let openPage: ClientState['layout']['openPage'];
let pages: ClientState['layout']['pages'];
let renamePage: ClientState['layout']['renamePage'];
let switchPage: ClientState['layout']['switchPage'];
let workbench: ClientState['layout']['workbench'];

beforeEach(() => {
    client = createClientState();
    ({
        closeInstancesOfView,
        closePage,
        currentPage,
        foldPane,
        layout,
        loadLayout,
        moveInstanceToPage,
        openPage,
        pages,
        renamePage,
        switchPage,
        workbench
    } = client.layout);
});

setCatalog(textCatalog(loadConfig(engineDir()).config));

/** A workbench of the viewer's own, told apart from the default by the views on it. */
function own(): Workbench {
    return bench(three());
}

/** The two-tree workbench a browser held before a page was one tree, which own() is read from. */
function saveOwn(): string {
    return saveBench(docked(three(), pane([]), 'hidden'));
}

/** The pages a storage holds, read back out of the one key everything is saved under. */
function saved(storage: { held: Record<string, string> }): Pages | null {
    return parseLayout(storage.held[LAYOUT_KEY] ?? '', '');
}

describe('newPage and defaultPages', () => {
    it('mints an id per page and takes the workbench it is given', () => {
        const first = newPage('One', own());
        const second = newPage('One', own());
        expect(first.id).not.toBe(second.id);
        expect(first.workbench).toEqual(own());
        expect(first.label).toBe('One');
    });

    it('starts from one page on the default workbench, which is the current one', () => {
        const made = defaultPages('Page 1');
        expect(made.pages).toHaveLength(1);
        expect(made.current).toBe(made.pages[0].id);
        expect(viewsOf(made.pages[0].workbench.root)).toEqual(['status']);
        expect(checkPages(made)).toEqual([]);
    });
});

describe('checkPages', () => {
    it('refuses no page at all', () => {
        expect(checkPages({ pages: [], current: 'x', floats: [] })).toContain('no page');
    });

    it('refuses a page id used twice', () => {
        const page = newPage('One');
        const problems = checkPages({ pages: [page, { ...page }], current: page.id, floats: [] });
        expect(problems.some((problem) => problem.includes('used twice'))).toBe(true);
    });

    it('refuses a current that names no page', () => {
        const page = newPage('One');
        expect(checkPages({ pages: [page], current: 'gone', floats: [] })).toEqual([
            'current is "gone", which is not a page'
        ]);
    });

    it('carries every problem of every page workbench, named by the page', () => {
        const broken = newPage('Bad', { root: { kind: 'pane', tabs: [], active: 'x' } });
        expect(checkPages({ pages: [broken], current: broken.id, floats: [] })).toEqual([
            'page "Bad" root node at []: an empty pane calls x active'
        ]);
    });

    it('refuses an instance id repeated across two pages, since a view is found by that id', () => {
        const first = newPage('One', bench(pane(['a'])));
        const second = newPage('Two', bench(pane(['a'])));
        expect(checkPages({ pages: [first, second], current: first.id, floats: [] })).toEqual([
            'instance "a" is on two pages'
        ]);
    });
});

describe('the version 4 envelope', () => {
    it('reads back every page and which one is current', () => {
        const made: Pages = {
            pages: [newPage('One', own()), newPage('Two')],
            current: '',
            floats: []
        };
        const held: Pages = { ...made, current: made.pages[1].id };
        expect(parseLayout(serialiseLayout(held), '')).toEqual(held);
        expect(fields(JSON.parse(serialiseLayout(held))).version).toBe(LAYOUT_VERSION);
    });

    it('reads a version 2 envelope of one workbench as one page, carrying the label', () => {
        const read = parseLayout(saveOwn(), 'Page 1');
        expect(read?.pages).toHaveLength(1);
        expect(read?.pages[0].label).toBe('Page 1');
        expect(read?.pages[0].workbench).toEqual(own());
        expect(read?.current).toBe(read?.pages[0].id);
    });

    it('refuses an envelope whose pages or current are not what they must be', () => {
        const page = newPage('One');
        expect(parseLayout({ version: LAYOUT_VERSION, pages: page, current: page.id }, '')).toBe(
            null
        );
        expect(parseLayout({ version: LAYOUT_VERSION, pages: [page] }, '')).toBe(null);
        expect(parseLayout({ version: LAYOUT_VERSION, pages: [page], current: 'gone' }, '')).toBe(
            null
        );
        expect(parseLayout({ version: 1, pages: [page], current: page.id }, '')).toBe(null);
        expect(
            parseLayout({ version: LAYOUT_VERSION, pages: [{ id: 'a' }], current: 'a' }, '')
        ).toBe(null);
    });
});

describe('the store: loading', () => {
    it('starts from one default page when storage holds nothing', () => {
        const storage = fakeStorage();
        expect(loadLayout(storage)).toBe(false);
        expect(pages().map((page) => page.label)).toEqual(['Page 1']);
        expect(viewsOf(layout())).toEqual(['status']);
    });

    it('reads a version 2 envelope as page 1, so a browser holding one loses nothing', () => {
        const storage = fakeStorage(saveOwn());
        expect(loadLayout(storage)).toBe(true);
        expect(pages().map((page) => page.label)).toEqual(['Page 1']);
        expect(workbench()).toEqual(own());
    });

    it('reads every page of a version 4 envelope back', () => {
        const held: Pages = {
            pages: [newPage('One', own()), newPage('Two')],
            current: '',
            floats: []
        };
        const storage = fakeStorage(serialiseLayout({ ...held, current: held.pages[1].id }));
        expect(loadLayout(storage)).toBe(true);
        expect(pages().map((page) => page.label)).toEqual(['One', 'Two']);
        expect(currentPage().label).toBe('Two');
    });

    it('makes the workbench the retired control held page 1, and the one on screen page 2', () => {
        const storage = fakeStorage(saveBench(docked(pane(['s']), pane([]), 'hidden')));
        storage.held[PREVIOUS_KEY] = saveOwn();
        expect(loadLayout(storage)).toBe(true);
        expect(pages().map((page) => page.label)).toEqual(['Page 1', 'Sessions']);
        expect(pages()[0].workbench).toEqual(own());
        expect(currentPage().label).toBe('Sessions');
        expect(viewsOf(layout())).toEqual(['projects']);
        expect(storage.held[PREVIOUS_KEY]).toBe('');
        // Written at once, or a reload before the next change would lose the page just made.
        expect(saved(storage)?.pages.map((page) => page.label)).toEqual(['Page 1', 'Sessions']);
    });
});

describe('the store: the page operations', () => {
    /** A store loaded with one page carrying the viewer's own workbench. */
    function loaded() {
        const storage = fakeStorage(saveOwn());
        loadLayout(storage);
        return storage;
    }

    it('opens a page on the default workbench and makes it current', () => {
        const storage = loaded();
        openPage('Page 2');
        expect(pages().map((page) => page.label)).toEqual(['Page 1', 'Page 2']);
        expect(currentPage().label).toBe('Page 2');
        expect(viewsOf(layout())).toEqual(['status']);
        expect(saved(storage)?.pages).toHaveLength(2);
    });

    it('acts on the page on screen and leaves the other one as it was', () => {
        const storage = loaded();
        const first = currentPage().id;
        openPage('Page 2');
        foldPane([]);
        expect(pages()[0].workbench).toEqual(own());
        expect(saved(storage)?.pages[0].workbench).toEqual(own());
        switchPage(first);
        expect(workbench()).toEqual(own());
    });

    it('changes nothing on a switch to a page that is not there', () => {
        loaded();
        const before = currentPage().id;
        switchPage('gone');
        expect(currentPage().id).toBe(before);
    });

    it('renames a page and writes the name down', () => {
        const storage = loaded();
        renamePage(currentPage().id, 'Reading');
        expect(currentPage().label).toBe('Reading');
        expect(saved(storage)?.pages[0].label).toBe('Reading');
    });

    it('closes a page and shows the one after it', () => {
        loaded();
        openPage('Page 2');
        openPage('Page 3');
        switchPage(pages()[1].id);
        closePage(currentPage().id);
        expect(pages().map((page) => page.label)).toEqual(['Page 1', 'Page 3']);
        expect(currentPage().label).toBe('Page 3');
    });

    it('shows the page before the one it closed when that was the last in the list', () => {
        loaded();
        openPage('Page 2');
        closePage(currentPage().id);
        expect(pages().map((page) => page.label)).toEqual(['Page 1']);
        expect(currentPage().label).toBe('Page 1');
    });

    it('leaves the page on screen where it is when another page is closed', () => {
        loaded();
        const first = currentPage().id;
        openPage('Page 2');
        switchPage(first);
        closePage(pages()[1].id);
        expect(currentPage().id).toBe(first);
    });

    it('leaves one fresh default page when the only page is closed', () => {
        const storage = loaded();
        closePage(currentPage().id);
        expect(pages()).toHaveLength(1);
        expect(currentPage().label).toBe('Page 1');
        expect(viewsOf(layout())).toEqual(['status']);
        expect(saved(storage)?.pages).toHaveLength(1);
    });

    it('saves every page under the one key on every change', () => {
        const storage = loaded();
        openPage('Page 2');
        renamePage(currentPage().id, 'Runs');
        expect(Object.keys(storage.held)).toEqual([LAYOUT_KEY]);
        const held = saved(storage);
        expect(held?.pages.map((page) => page.label)).toEqual(['Page 1', 'Runs']);
        expect(held?.current).toBe(currentPage().id);
        expect(viewsOf(present(held?.pages[1].workbench, 'page 2').root)).toEqual(['status']);
    });
});

describe("a page's rail key in the saved layout", () => {
    /** Two pages, the first made by the rail button of `key`, as the store saves them. */
    function withKey(first: unknown, second?: unknown): string {
        const pages = [newPage('One'), newPage('Two')];
        const raw = JSON.parse(serialiseLayout({ pages, current: pages[0].id, floats: [] })) as {
            pages: Record<string, unknown>[];
        };
        raw.pages[0].rail = first;
        if (second !== undefined) raw.pages[1].rail = second;
        return JSON.stringify(raw);
    }

    it('reads the key a rail page was saved with and writes it back', () => {
        const read = present(parseLayout(withKey('focus'), ''), 'layout');
        expect(read.pages.map((page) => page.rail)).toEqual(['focus', undefined]);
        const written = JSON.parse(serialiseLayout(read)) as { pages: { rail?: string }[] };
        expect(written.pages[0].rail).toBe('focus');
    });

    it('reads an empty key, or one that is not a string, as none', () => {
        for (const odd of ['', 3, null]) {
            const read = present(parseLayout(withKey(odd), ''), 'layout');
            expect(read.pages[0].rail).toBe(undefined);
        }
    });

    it('keeps a key on the first page carrying it and reads the second as a page of its own', () => {
        const read = present(parseLayout(withKey('focus', 'focus'), ''), 'layout');
        expect(read.pages.map((page) => page.rail)).toEqual(['focus', undefined]);
    });

    it('names a key on two pages, and an empty one, as a problem of the page list', () => {
        const pages = [newPage('One', undefined, 'focus'), newPage('Two', undefined, 'focus')];
        expect(checkPages({ pages, current: pages[0].id, floats: [] })).toEqual([
            'rail key "focus" is on two pages'
        ]);
        const empty = [newPage('One', undefined, '')];
        expect(checkPages({ pages: empty, current: empty[0].id, floats: [] })).toEqual([
            'page "One" has an empty rail key'
        ]);
    });
});

describe('the store: a tab that moves between pages', () => {
    /** A store loaded with one page carrying the viewer's own workbench. */
    function loaded() {
        const storage = fakeStorage(saveOwn());
        loadLayout(storage);
        return storage;
    }

    it('takes the tab off the page it was on and puts it on the page named', () => {
        const storage = loaded();
        const from = currentPage().id;
        openPage('Page 2');
        const to = currentPage().id;
        switchPage(from);
        moveInstanceToPage('a', to);
        expect(viewsOf(layout())).toEqual(['projects', 'projects']);
        switchPage(to);
        expect(viewsOf(layout())).toEqual(['status', 'projects']);
        expect(saved(storage)?.pages).toHaveLength(2);
    });

    it('changes nothing for a page that is not there, or for the page it is already on', () => {
        loaded();
        const here = currentPage().id;
        const before = viewsOf(layout());
        moveInstanceToPage('a', 'gone');
        moveInstanceToPage('a', here);
        expect(viewsOf(layout())).toEqual(before);
    });

    it('changes nothing for an instance no page holds', () => {
        loaded();
        openPage('Page 2');
        const to = currentPage().id;
        const before = viewsOf(layout());
        moveInstanceToPage('nothing', to);
        expect(viewsOf(layout())).toEqual(before);
    });
});

describe('the store: a view leaving the registry', () => {
    it('closes every tab open on it, on the page on screen and on the others', () => {
        const storage = fakeStorage(saveOwn());
        loadLayout(storage);
        openPage('Page 2');
        switchPage(pages()[0].id);
        expect(viewsOf(layout())).toEqual(['projects', 'projects', 'projects']);
        closeInstancesOfView('projects');
        expect(viewsOf(layout())).toEqual([]);
        switchPage(pages()[1].id);
        expect(viewsOf(layout())).toEqual(['status']);
        expect(saved(storage)?.pages).toHaveLength(2);
    });

    it('leaves a tab whose view the registry still holds', () => {
        const storage = fakeStorage(saveOwn());
        loadLayout(storage);
        closeInstancesOfView('sessions');
        expect(viewsOf(layout())).toEqual(['projects', 'projects', 'projects']);
        expect(saved(storage)?.pages).toHaveLength(1);
    });
});

describe('the first rail page on a browser with no saved layout', () => {
    const FOCUS = { root: { kind: 'pane', view: 'focus' } };

    it('replaces the default page with the first rail page while nothing has changed', () => {
        loadLayout(fakeStorage());
        client.layout.startOnRailPage('focus', 'Focus', FOCUS, []);
        expect(pages().map((page) => [page.label, page.rail])).toEqual([['Focus', 'focus']]);
        expect(viewsOf(layout())).toEqual(['focus']);

        // A browser with a saved layout keeps its pages whatever the rail list says.
        const storage = fakeStorage();
        loadLayout(storage);
        renamePage(currentPage().id, 'Mine');
        loadLayout(storage);
        client.layout.startOnRailPage('focus', 'Focus', FOCUS, []);
        expect(pages().map((page) => page.label)).toEqual(['Mine']);

        // Nor does a fresh one once the reader has changed anything.
        loadLayout(fakeStorage());
        openPage('Other');
        client.layout.startOnRailPage('focus', 'Focus', FOCUS, []);
        expect(pages().map((page) => page.label)).toEqual(['Page 1', 'Other']);
    });

    it('waits for the rail list on a fresh browser, and stops waiting when it names no page', () => {
        loadLayout(fakeStorage());
        expect(client.layout.startingFresh()).toBe(true);
        client.layout.startOnRailPage('broken', 'Broken', { root: 'not a node' }, []);
        expect(client.layout.startingFresh()).toBe(false);
        expect(pages().map((page) => page.label)).toEqual(['Page 1']);

        loadLayout(fakeStorage());
        client.layout.keepDefaultPage([]);
        expect(client.layout.startingFresh()).toBe(false);

        // A browser with a saved layout never waits.
        const storage = fakeStorage();
        loadLayout(storage);
        renamePage(currentPage().id, 'Mine');
        loadLayout(storage);
        expect(client.layout.startingFresh()).toBe(false);
    });
});

describe('the page shown before the one on screen', () => {
    it('is the page switched away from, and none on a fresh load or once it was closed', () => {
        loadLayout(fakeStorage());
        const first = currentPage().id;
        expect(client.layout.previousPage()).toBe(null);
        openPage('Second');
        expect(client.layout.previousPage()).toBe(first);
        const second = currentPage().id;
        switchPage(first);
        expect(client.layout.previousPage()).toBe(second);
        closePage(second);
        expect(client.layout.previousPage()).toBe(null);
    });

    it('rebuilds a rail page in place, removes a gone button, and leaves a page of the own', async () => {
        const { resetPagesFixture, FOCUS_NODE: FOCUS } = await import('./layout-fixture.ts');
        const { own, focus, added } = resetPagesFixture(client);
        const rail = [{ page: 'focus', label: 'Focus', node: FOCUS }];
        expect(client.layout.resetPages(rail, [])).toBe(true);
        expect(pages().map((page) => [page.id, page.label, page.rail])).toEqual([
            [own, 'Page 1', undefined],
            [focus, 'Focus', 'focus']
        ]);
        expect(viewsOf(workbench(focus).root)).toEqual(['focus']);
        expect(client.ui.instanceState(added)).toBe(undefined);
    });

    it('removes the page of a button the rail no longer has, and moves off it', async () => {
        const { resetPagesFixture, FOCUS_NODE: FOCUS } = await import('./layout-fixture.ts');
        const { storage, own, focus, old } = resetPagesFixture(client);
        expect(currentPage().id).toBe(old);
        client.layout.resetPages([{ page: 'focus', label: 'Focus', node: FOCUS }], []);
        expect(pages().map((page) => page.id)).toEqual([own, focus]);
        expect(saved(storage)?.current).toBe(own);
        expect(currentPage().id).toBe(own);
    });

    it('takes a removed page out of the page it was drawn inside', async () => {
        const { resetPagesFixture, FOCUS_NODE: FOCUS } = await import('./layout-fixture.ts');
        const { own, old } = resetPagesFixture(client);
        client.layout.apply(
            {
                root: {
                    kind: 'split',
                    dir: 'row',
                    sizes: [0.5, 0.5],
                    children: [pane(['a']), { kind: 'page', page: old }]
                }
            },
            own
        );
        client.layout.resetPages([{ page: 'focus', label: 'Focus', node: FOCUS }], []);
        expect(JSON.stringify(workbench(own).root)).not.toContain(old);
    });

    it('starts again from the default page when every page was of a gone button', async () => {
        const { resetPagesFixture } = await import('./layout-fixture.ts');
        const { own, focus } = resetPagesFixture(client);
        closePage(own);
        closePage(focus);
        client.layout.resetPages([], []);
        expect(pages().map((page) => [page.label, page.rail])).toEqual([['Page 1', undefined]]);
    });

    it('does nothing when no page is tied to a button', async () => {
        const { FOCUS_NODE: FOCUS } = await import('./layout-fixture.ts');
        loadLayout(fakeStorage());
        expect(client.layout.resetPages([{ page: 'focus', label: 'Focus', node: FOCUS }], [])).toBe(
            false
        );
        expect(pages().map((page) => page.label)).toEqual(['Page 1']);
    });

    it('makes one page again from its button, keeping its id and place', async () => {
        const { resetPagesFixture, FOCUS_NODE: FOCUS } = await import('./layout-fixture.ts');
        const { own, focus, old, added } = resetPagesFixture(client);
        expect(client.layout.resetPage(focus, { page: 'focus', label: 'Focus', node: FOCUS })).toBe(
            true
        );
        expect(pages().map((page) => [page.id, page.label])).toEqual([
            [own, 'Page 1'],
            [focus, 'Focus'],
            [old, 'Old']
        ]);
        expect(viewsOf(workbench(focus).root)).toEqual(['focus']);
        expect(client.ui.instanceState(added)).toBe(undefined);
    });

    it('refuses a page it does not hold and an arrangement that does not parse', async () => {
        const { resetPagesFixture, FOCUS_NODE: FOCUS } = await import('./layout-fixture.ts');
        const { focus } = resetPagesFixture(client);
        const before = workbench(focus);
        expect(
            client.layout.resetPage('gone', { page: 'focus', label: 'Focus', node: FOCUS })
        ).toBe(false);
        expect(
            client.layout.resetPage(focus, { page: 'focus', label: 'Focus', node: 'broken' })
        ).toBe(false);
        expect(workbench(focus)).toBe(before);
    });

    it('asks each unsaved tab of a reset, one at a time, after the reset question', async () => {
        const { resetPagesFixture, FOCUS_NODE: FOCUS } = await import('./layout-fixture.ts');
        const { focus, old, added } = resetPagesFixture(client);
        const oldIds = pageInstanceIds(
            present(
                pages().find((page) => page.id === old),
                'old page'
            )
        );
        const held = new Set([added, ...oldIds]);
        const rail = [{ page: 'focus', label: 'Focus', node: FOCUS }];
        const plan = resetPlan(pages(), rail);
        const asked: string[][] = [];
        const ran = await resetAfterAsking(
            pages(),
            resetAsk(pages(), plan.rebuilt, plan.removed),
            [...plan.rebuilt, ...plan.removed],
            (id) => held.has(id),
            (instance) => `${instance.view} ${instance.id}`,
            (message, detail) => {
                asked.push([message, detail]);
                return Promise.resolve(true);
            },
            () => client.layout.resetPages(rail, []),
            () => Promise.resolve([])
        );
        expect(ran).toBe(true);
        // Each question names its tab and that tab's page, so two tabs are told apart.
        expect(asked.slice(1)).toEqual([
            [t('ui.tab_close_dirty'), t('workbench.reset_tab', `status ${added}`, 'Mine now')],
            [t('ui.tab_close_dirty'), t('workbench.reset_tab', `status ${oldIds[0]}`, 'Old')]
        ]);
        expect(pages().map((page) => page.id)).not.toContain(old);
        expect(viewsOf(workbench(focus).root)).toEqual(['focus']);
    });

    it('leaves every page as it was when the second unsaved tab is answered no', async () => {
        const { resetPagesFixture, FOCUS_NODE: FOCUS } = await import('./layout-fixture.ts');
        const { old, added } = resetPagesFixture(client);
        const held = new Set([
            added,
            ...pageInstanceIds(
                present(
                    pages().find((page) => page.id === old),
                    'old page'
                )
            )
        ]);
        const rail = [{ page: 'focus', label: 'Focus', node: FOCUS }];
        const plan = resetPlan(pages(), rail);
        const before = JSON.stringify(pages());
        const answers = [true, true, false];
        let asked = 0;
        const ran = await resetAfterAsking(
            pages(),
            resetAsk(pages(), plan.rebuilt, plan.removed),
            [...plan.rebuilt, ...plan.removed],
            (id) => held.has(id),
            (instance) => instance.id,
            () => Promise.resolve(answers[asked++]),
            () => client.layout.resetPages(rail, []),
            () => Promise.resolve([])
        );
        expect([ran, asked]).toEqual([false, 3]);
        expect(JSON.stringify(pages())).toBe(before);
        expect(client.ui.instanceState(added)).toEqual({ typed: 'held' });
    });
});

describe('a saved page carrying a field the pages no longer hold', () => {
    it('reads a page saved with a views field without it, and saves it again without the field', () => {
        const held = { id: 'tab-1', view: 'terminal', state: {} };
        const page = newPage('one', { root: { kind: 'pane', tabs: [held], active: held.id } });
        const saved = JSON.parse(
            serialiseLayout({ pages: [page], current: page.id, floats: [] })
        ) as {
            pages: Record<string, unknown>[];
        };
        saved.pages[0].views = { terminal: { order: ['d4e5f6-shell', 'a1b2c3-claude'] } };
        const read = parseLayout(saved, 'one');
        expect(read?.pages.map((one) => one.id)).toEqual([page.id]);
        const again = JSON.parse(serialiseLayout(read ?? defaultPages('one'))) as {
            pages: Record<string, unknown>[];
        };
        expect(Object.keys(again.pages[0]).sort()).toEqual(['id', 'label', 'workbench']);
    });
});
