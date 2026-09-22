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
    movePage,
    newPage,
    parseLayout,
    serialiseLayout,
    type Pages,
    type Workbench
} from '../../../../src/lib/state/workbench/layout/index.ts';
import { LAYOUT_KEY, PREVIOUS_KEY } from '../../../../src/lib/state/workbench/layout.svelte.ts';
import { engineDir, loadConfig, textCatalog } from '../../../../src/lib/data/sources/config.ts';
import { setCatalog } from '../../../../src/lib/state/words/text.ts';
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
let pageShortcut: ClientState['layout']['pageShortcut'];
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
        pageShortcut,
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
        expect(checkPages({ pages: [], current: 'x' })).toContain('no page');
    });

    it('refuses a page id used twice', () => {
        const page = newPage('One');
        const problems = checkPages({ pages: [page, { ...page }], current: page.id });
        expect(problems.some((problem) => problem.includes('used twice'))).toBe(true);
    });

    it('refuses a current that names no page', () => {
        const page = newPage('One');
        expect(checkPages({ pages: [page], current: 'gone' })).toEqual([
            'current is "gone", which is not a page'
        ]);
    });

    it('carries every problem of every page workbench, named by the page', () => {
        const broken = newPage('Bad', { root: { kind: 'pane', tabs: [], active: 'x' } });
        expect(checkPages({ pages: [broken], current: broken.id })).toEqual([
            'page "Bad" root node at []: an empty pane calls x active'
        ]);
    });

    it('refuses an instance id repeated across two pages, since a view is found by that id', () => {
        const first = newPage('One', bench(pane(['a'])));
        const second = newPage('Two', bench(pane(['a'])));
        expect(checkPages({ pages: [first, second], current: first.id })).toEqual([
            'instance "a" is on two pages'
        ]);
    });
});

describe('the version 4 envelope', () => {
    it('reads back every page and which one is current', () => {
        const made: Pages = { pages: [newPage('One', own()), newPage('Two')], current: '' };
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
        const held: Pages = { pages: [newPage('One', own()), newPage('Two')], current: '' };
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

    it('shows the page before the one it closed when that was the last in the strip', () => {
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

    it('shows the page a shortcut names, and answers whether there was one', () => {
        loaded();
        openPage('Page 2');
        expect(pageShortcut(1)).toBe(true);
        expect(currentPage().label).toBe('Page 1');
        expect(pageShortcut(2)).toBe(true);
        expect(currentPage().label).toBe('Page 2');
    });

    it('answers no for a shortcut out of range, and changes nothing', () => {
        loaded();
        expect(pageShortcut(2)).toBe(false);
        expect(pageShortcut(0)).toBe(false);
        expect(pageShortcut(9)).toBe(false);
        expect(pages()).toHaveLength(1);
        expect(currentPage().label).toBe('Page 1');
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

describe('movePage', () => {
    /** Three named pages with the second one current. */
    function held(): Pages {
        const pages = [newPage('One'), newPage('Two'), newPage('Three')];
        return { pages, current: pages[1].id };
    }

    function labels(value: Pages): string[] {
        return value.pages.map((page) => page.label);
    }

    it('moves a page to the front', () => {
        const value = held();
        expect(labels(movePage(value, value.pages[2].id, 0))).toEqual(['Three', 'One', 'Two']);
    });

    it('moves a page to the end', () => {
        const value = held();
        expect(labels(movePage(value, value.pages[0].id, 2))).toEqual(['Two', 'Three', 'One']);
    });

    it('clamps a destination past the end', () => {
        const value = held();
        expect(labels(movePage(value, value.pages[1].id, 99))).toEqual(['One', 'Three', 'Two']);
    });

    it('does nothing for an unknown page id', () => {
        const value = held();
        expect(movePage(value, 'missing', 0)).toBe(value);
    });

    it('keeps the current page current when that page moves', () => {
        const value = held();
        const moved = movePage(value, value.current, 0);
        expect(moved.current).toBe(value.current);
        expect(labels(moved)).toEqual(['Two', 'One', 'Three']);
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
