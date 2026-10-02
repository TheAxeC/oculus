// Arrangements: a whole workbench written by hand in config/layout.yml, read into the shape
// state/workbench/layout/ holds, and the rail button that makes one its page the first time it is
// pressed and shows that page after.
//
// The tool's own arrangements are read from the config here rather than repeated, so an edit of
// that file that stops one parsing fails in this suite instead of leaving a rail button that does
// nothing. Nothing here touches localStorage or the DOM: the store takes the storage it is given.

import { beforeEach, describe, expect, it } from 'vitest';
import {
    checkWorkbench,
    panes,
    type Layout,
    type Workbench
} from '../../../../src/lib/state/workbench/layout/index.ts';
import { LAYOUT_KEY } from '../../../../src/lib/state/workbench/layout.svelte.ts';
import {
    parseArrangement,
    parseFloats
} from '../../../../src/lib/state/workbench/navigation/arrangement.ts';
import { railPages } from '../../../../src/lib/state/workbench/navigation/rail.ts';
import { engineDir, loadConfig, textCatalog } from '../../../../src/lib/data/sources/config.ts';
import { setCatalog } from '../../../../src/lib/state/shared/words/text.ts';
import {
    bench,
    docked,
    fakeStorage,
    instance,
    pane,
    saveBench,
    three,
    viewsOf
} from '../layout/layout-fixture.ts';
import { present } from '../../../fixtures/present.ts';
import { createClientState, type ClientState } from '../../../fixtures/client.ts';
import { registerAll, registerCollections } from '../../../../src/routes/views.ts';
import { collectionKeys } from '../../../../src/lib/data/sources/config.ts';

let client: ClientState;
let currentPage: ClientState['layout']['currentPage'];
let layout: ClientState['layout']['layout'];
let loadLayout: ClientState['layout']['loadLayout'];
let openRailPage: ClientState['layout']['openRailPage'];
let change: ClientState['layout']['change'];
let renamePage: ClientState['layout']['renamePage'];
let openPage: ClientState['layout']['openPage'];
let switchPage: ClientState['layout']['switchPage'];
let pages: ClientState['layout']['pages'];
let workbench: ClientState['layout']['workbench'];

beforeEach(() => {
    client = createClientState();
    ({
        change,
        currentPage,
        layout,
        loadLayout,
        openPage,
        openRailPage,
        pages,
        renamePage,
        switchPage,
        workbench
    } = client.layout);
});

// loadLayout names the page it makes, and a page is named from the text catalogs like everything
// else on screen.
setCatalog(textCatalog(loadConfig(engineDir()).config));

/** The `arrangements.sessions` node of the tool's own config/layout.yml. */
function real(): unknown {
    const held = loadConfig(engineDir()).config.arrangements;
    return (held as Record<string, unknown>).sessions;
}

describe('parseArrangement', () => {
    it('turns the shipped sessions arrangement into one tree that checks out', () => {
        const parsed = parseArrangement(real());
        expect(parsed).not.toBe(null);
        const made = present(parsed, 'arrangement');
        expect(checkWorkbench(made)).toEqual([]);
        expect(made.root.kind).toBe('split');
        expect(viewsOf(made.root)).toEqual([
            'session-list',
            'terminal',
            'transcript',
            'timeline',
            'session-detail',
            'changes',
            'agents',
            'files'
        ]);
    });

    it('reads the sessions arrangement as saved, its Files tab following the selection', () => {
        const root = present(parseArrangement(real()), 'arrangement').root;
        // The shape is written out in full: a row of the working area and the right pane, the
        // working area a row of the list and a column of the terminal over the transcript.
        const shape = (node: typeof root): unknown =>
            node.kind === 'split'
                ? { dir: node.dir, sizes: node.sizes, children: node.children.map(shape) }
                : node.kind === 'pane'
                  ? node.tabs.map((tab) => tab.view)
                  : null;
        expect(shape(root)).toEqual({
            dir: 'row',
            sizes: [0.7, 0.3],
            children: [
                {
                    dir: 'row',
                    sizes: [0.28, 0.72],
                    children: [
                        ['session-list'],
                        {
                            dir: 'col',
                            sizes: [0.6, 0.4],
                            children: [['terminal'], ['transcript', 'timeline']]
                        }
                    ]
                },
                ['session-detail', 'changes', 'agents', 'files']
            ]
        });
        const files = panes(root)
            .flatMap(({ pane: node }) => node.tabs)
            .find((tab) => tab.view === 'files');
        expect(files?.state).toEqual({ follow: true });
    });

    it('takes a tab written as a view with a state, and refuses one that does not add up', () => {
        const tab = (view: unknown) => parseArrangement({ root: { kind: 'pane', view: [view] } });
        const made = present(tab({ view: 'files', state: { follow: true } }), 'arrangement');
        const opened = panes(made.root)[0].pane.tabs[0];
        expect([opened.view, opened.state]).toEqual(['files', { follow: true }]);
        const bare = present(tab({ view: 'files' }), 'arrangement');
        expect(panes(bare.root)[0].pane.tabs[0].state).toEqual({});
        expect(tab({ view: 'files', state: 'follow' })).toBe(null);
        expect(tab({ view: 'files', state: [true] })).toBe(null);
        expect(tab({ view: '', state: {} })).toBe(null);
        expect(tab({ state: {} })).toBe(null);
        expect(tab('')).toBe(null);
        expect(tab(7)).toBe(null);
    });

    it('mints a fresh instance id for every tab, so two applications never collide', () => {
        const first = present(parseArrangement(real()), 'arrangement');
        const second = present(parseArrangement(real()), 'arrangement');
        const ids = (made: Workbench): string[] =>
            panes(made.root).flatMap(({ pane: node }) => node.tabs.map((tab) => tab.id));
        expect(new Set(ids(first)).size).toBe(8);
        expect(ids(first).some((id) => ids(second).includes(id))).toBe(false);
    });

    it('takes a pane naming one view as well as a pane naming several', () => {
        const one = present(
            parseArrangement({ root: { kind: 'pane', view: 'timeline' } }),
            'arrangement'
        );
        expect(viewsOf(one.root)).toEqual(['timeline']);
        const several = present(
            parseArrangement({ root: { kind: 'pane', view: ['changes', 'agents'] } }),
            'arrangement'
        );
        expect(viewsOf(several.root)).toEqual(['changes', 'agents']);
    });

    it('refuses a tree that is not a tree, and one naming no root', () => {
        expect(parseArrangement(null)).toBe(null);
        expect(parseArrangement({ main: { kind: 'pane', view: 'timeline' } })).toBe(null);
        expect(parseArrangement({ root: { kind: 'box' } })).toBe(null);
        expect(parseArrangement({ root: { kind: 'pane', view: 7 } })).toBe(null);
        expect(parseArrangement({ root: { kind: 'pane' } })).toBe(null);
    });

    it('makes a pane naming an empty list an empty pane, the one opened files land in', () => {
        const made = present(
            parseArrangement({
                root: {
                    kind: 'split',
                    dir: 'row',
                    sizes: [0.5, 0.5],
                    children: [
                        { kind: 'pane', view: 'files' },
                        { kind: 'pane', view: [] }
                    ]
                }
            }),
            'arrangement'
        );
        expect(checkWorkbench(made)).toEqual([]);
        expect(panes(made.root).map(({ pane: node }) => [node.tabs.length, node.active])).toEqual([
            [1, panes(made.root)[0].pane.tabs[0].id],
            [0, '']
        ]);
        // An empty name is still no view, so a list holding one refuses the arrangement.
        expect(parseArrangement({ root: { kind: 'pane', view: [''] } })).toBe(null);
    });

    it('refuses a split whose sizes do not add up, or take a child under the minimum', () => {
        const made = (sizes: number[]): unknown => ({
            root: {
                kind: 'split',
                dir: 'row',
                sizes,
                children: [
                    { kind: 'pane', view: 'timeline' },
                    { kind: 'pane', view: 'agents' }
                ]
            }
        });
        expect(parseArrangement(made([0.5, 0.5]))).not.toBe(null);
        expect(parseArrangement(made([0.5, 0.6]))).toBe(null);
        expect(parseArrangement(made([0.5]))).toBe(null);
        expect(parseArrangement(made([0.99, 0.01]))).toBe(null);
    });

    it('refuses a split with a direction or a size that is not one', () => {
        const bad = (over: Record<string, unknown>): unknown => ({
            root: {
                kind: 'split',
                dir: 'row',
                sizes: [0.5, 0.5],
                children: [
                    { kind: 'pane', view: 'timeline' },
                    { kind: 'pane', view: 'agents' }
                ],
                ...over
            }
        });
        expect(parseArrangement(bad({ dir: 'sideways' }))).toBe(null);
        expect(parseArrangement(bad({ sizes: ['half', 'half'] }))).toBe(null);
        expect(parseArrangement(bad({ children: 'two' }))).toBe(null);
    });
});

describe('the shipped pages', () => {
    const shipped = loadConfig(engineDir()).config;

    /** Every tab of a rail page's arrangement, pane by pane: a view id, or a document's path. */
    function tabsOfPage(key: string): string[][] {
        const entry = railPages(shipped).find((one) => one.page === key);
        const made = present(parseArrangement(entry?.node), 'arrangement');
        return panes(made.root).map(({ pane: node }) =>
            node.tabs.map((tab) => {
                const path = (tab.state as { path?: unknown } | null)?.path;
                return tab.view === 'doc' && typeof path === 'string' ? `doc:${path}` : tab.view;
            })
        );
    }

    it('draws the twelve buttons in the ruled order, Help right after System', () => {
        expect(railPages(shipped).map((entry) => `${entry.label}:${entry.page}`)).toEqual([
            'Focus:focus',
            'Sessions:sessions',
            'Projects:projects',
            'Incoming:incoming',
            'Explorer:explorer',
            'Academic Life:academic',
            'Pillars:pillars',
            'References:references',
            'Present:present',
            'System:info',
            'Help:help',
            'Views and Settings:views'
        ]);
    });

    it('makes every page as the rulings lay it out, pane by pane', () => {
        expect(
            Object.fromEntries(
                railPages(shipped).map((entry) => [entry.page, tabsOfPage(entry.page)])
            )
        ).toEqual({
            focus: [['focus']],
            sessions: [
                ['session-list'],
                ['terminal'],
                ['transcript', 'timeline'],
                ['session-detail', 'changes', 'agents', 'files']
            ],
            projects: [['projects', 'coauthor', 'archive', 'personal']],
            incoming: [['inbox', 'radar', 'leads', 'linkedin'], ['calendar']],
            explorer: [['files', 'repositories', 'search'], []],
            academic: [['funding', 'events', 'education', 'applications', 'joint-work', 'tasks']],
            pillars: [['pillars', 'domains', 'map']],
            references: [['venues', 'data', 'code', 'statements']],
            present: [['present']],
            info: [['status', 'findings', 'audit', 'history', 'config', 'gallery']],
            help: [
                ['help', 'doc:docs/HPC-UTwente-howto.md'],
                ['doc:docs/RESEARCH-APPROACH.md', 'doc:docs/AGENT-APPROACH.md', 'memories']
            ],
            views: [['catalogue'], ['settings', 'account-setup'], ['pages']]
        });
    });

    it('puts every view with a place, every collection and every hub document on exactly one page or float', () => {
        const client = createClientState();
        registerAll(client.registry);
        registerCollections(client.registry, collectionKeys(shipped));
        const placed = client.registry
            .views()
            .filter((view) => view.group !== '')
            .map((view) => view.id);
        const collections = (shipped.collections as { key: string }[]).map((entry) => entry.key);
        const documents = (shipped.docs as { path: string }[]).map((entry) => `doc:${entry.path}`);
        const wanted = [...new Set([...placed, ...collections, ...documents])].sort();
        const onPages = railPages(shipped).flatMap((entry) =>
            [...new Set(tabsOfPage(entry.page).flat())].map((tab) => ({ tab, page: entry.page }))
        );
        // The floats stand over every page: their tabs are placed there and on no page.
        const onFloats = parseFloats(shipped.floats).flatMap((float) =>
            float.pane.tabs.map((tab) => ({ tab: tab.view, page: 'floats' }))
        );
        const seen = [...onPages, ...onFloats];
        const pagesOf = (tab: string): string[] =>
            seen.filter((one) => one.tab === tab).map((one) => one.page);
        expect(wanted).toHaveLength(51);
        expect(wanted.filter((tab) => pagesOf(tab).length !== 1)).toEqual(['files']);
        // The one entry on two pages is the Files view: Explorer's own and the Sessions page's
        // tab that follows the selected session.
        expect(pagesOf('files')).toEqual(['sessions', 'explorer']);
        // Nothing sits on a page that is not one of the entries.
        expect(seen.filter((one) => !wanted.includes(one.tab))).toEqual([]);
    });
});

describe('a System page saved before the Help page was its own', () => {
    const shipped = loadConfig(engineDir()).config;
    const arrangements = shipped.arrangements as Record<string, unknown>;

    /** A hub document tab as layout.yml writes one. */
    function docTab(path: string, label: string): unknown {
        return { view: 'doc', state: { id: path, path, label } };
    }

    /** The System arrangement that held the manual, the documents and the photo wall. */
    const OLD_INFO = {
        root: {
            kind: 'split',
            dir: 'row',
            sizes: [0.6, 0.4],
            children: [
                {
                    kind: 'pane',
                    view: [
                        'status',
                        'findings',
                        'audit',
                        'history',
                        'config',
                        'gallery',
                        'help',
                        docTab('docs/HPC-UTwente-howto.md', 'HPC how-to')
                    ]
                },
                {
                    kind: 'pane',
                    view: [
                        docTab('docs/RESEARCH-APPROACH.md', 'Research approach'),
                        docTab('docs/AGENT-APPROACH.md', 'Agent approach'),
                        'memories'
                    ]
                }
            ]
        }
    };

    /** The tabs on screen, pane by pane: a view id, or a document's path. */
    function tabsOnScreen(state: ClientState): string[][] {
        return panes(state.layout.layout()).map(({ pane: node }) =>
            node.tabs.map((tab) => {
                const path = (tab.state as { path?: unknown } | null)?.path;
                return tab.view === 'doc' && typeof path === 'string' ? `doc:${path}` : tab.view;
            })
        );
    }

    /** A browser whose saved layout holds a System page made from the old arrangement. */
    function savedBrowser(): ClientState {
        const storage = fakeStorage();
        loadLayout(storage);
        expect(openRailPage('info', 'System', OLD_INFO)).toBe(true);
        const again = createClientState();
        again.layout.loadLayout(storage);
        return again;
    }

    const OLD_TABS = [
        [
            'status',
            'findings',
            'audit',
            'history',
            'config',
            'gallery',
            'help',
            'doc:docs/HPC-UTwente-howto.md'
        ],
        ['doc:docs/RESEARCH-APPROACH.md', 'doc:docs/AGENT-APPROACH.md', 'memories']
    ];

    it('shows the saved System page with its old tabs, whatever the shipped arrangement says', () => {
        const browser = savedBrowser();
        const saved = browser.layout.pages().find((page) => page.rail === 'info');
        expect(browser.layout.openRailPage('info', 'System', arrangements.info)).toBe(true);
        expect(browser.layout.currentPage().id).toBe(saved?.id);
        expect(tabsOnScreen(browser)).toEqual(OLD_TABS);
    });

    it('makes the Help page from its shipped arrangement on its first press, tied to help', () => {
        const browser = savedBrowser();
        const before = browser.layout.pages().length;
        expect(browser.layout.openRailPage('help', 'Help', arrangements.help)).toBe(true);
        expect(browser.layout.pages()).toHaveLength(before + 1);
        expect(browser.layout.currentPage().rail).toBe('help');
        expect(tabsOnScreen(browser)).toEqual([
            ['help', 'doc:docs/HPC-UTwente-howto.md'],
            ['doc:docs/RESEARCH-APPROACH.md', 'doc:docs/AGENT-APPROACH.md', 'memories']
        ]);
        // The System page the browser saved is still the one its button shows.
        browser.layout.openRailPage('info', 'System', arrangements.info);
        expect(tabsOnScreen(browser)).toEqual(OLD_TABS);
    });
});

describe('a Projects page saved before the Personal tab', () => {
    const shipped = loadConfig(engineDir()).config;
    const arrangements = shipped.arrangements as Record<string, unknown>;

    const OLD_PROJECTS = {
        root: { kind: 'pane', view: ['projects', 'coauthor', 'archive'] }
    };

    /** The tabs on screen, pane by pane. */
    function tabsOnScreen(state: ClientState): string[][] {
        return panes(state.layout.layout()).map(({ pane: node }) =>
            node.tabs.map((tab) => tab.view)
        );
    }

    /** A browser whose saved layout holds a Projects page made from the old arrangement. */
    function savedBrowser(): ClientState {
        const storage = fakeStorage();
        loadLayout(storage);
        expect(openRailPage('projects', 'Projects', OLD_PROJECTS)).toBe(true);
        const again = createClientState();
        again.layout.loadLayout(storage);
        return again;
    }

    it('keeps its three tabs when its button is pressed', () => {
        const browser = savedBrowser();
        const saved = browser.layout.pages().find((page) => page.rail === 'projects');
        expect(browser.layout.openRailPage('projects', 'Projects', arrangements.projects)).toBe(
            true
        );
        expect(browser.layout.currentPage().id).toBe(saved?.id);
        expect(tabsOnScreen(browser)).toEqual([['projects', 'coauthor', 'archive']]);
    });

    it('shows four tabs once the pages are reset from the shipped arrangement', () => {
        const browser = savedBrowser();
        const rail = [{ page: 'projects', label: 'Projects', node: arrangements.projects }];
        expect(browser.layout.resetPages(rail, [])).toBe(true);
        expect(tabsOnScreen(browser)).toEqual([['projects', 'coauthor', 'archive', 'personal']]);
    });
});

describe('the store: a rail page', () => {
    /** A workbench of the viewer's own, which showing a rail page must leave where it is. */
    function own(): Workbench {
        return bench(three());
    }

    /**
     * The two-tree envelope a browser held before a page was one tree, which own() is read from.
     */
    function saveOwn(): string {
        return saveBench(docked(three(), pane([]), 'hidden'));
    }

    const ARRANGEMENT = {
        root: {
            kind: 'split',
            dir: 'row',
            sizes: [0.7, 0.3],
            children: [
                { kind: 'pane', view: 'session-list' },
                { kind: 'pane', view: ['session-detail', 'changes'] }
            ]
        }
    };

    const KEY = 'sessions';
    const LABEL = 'Sessions';

    it('makes the page from its arrangement the first time, tied to the key, and shows it', () => {
        loadLayout(fakeStorage(saveOwn()));
        expect(openRailPage(KEY, LABEL, ARRANGEMENT)).toBe(true);
        expect(pages().map((page) => page.label)).toEqual(['Page 1', LABEL]);
        expect(currentPage().rail).toBe(KEY);
        expect(viewsOf(layout())).toEqual(['session-list', 'session-detail', 'changes']);
    });

    it('leaves the workbench that was on screen on the page it was on', () => {
        loadLayout(fakeStorage(saveOwn()));
        openRailPage(KEY, LABEL, ARRANGEMENT);
        expect(pages()[0].workbench).toEqual(own());
    });

    it('shows the page the reader rearranged on the next press, rather than the arrangement', () => {
        loadLayout(fakeStorage(saveOwn()));
        openRailPage(KEY, LABEL, ARRANGEMENT);
        const made = currentPage().id;
        change(() => ({ kind: 'pane', tabs: [instance('mine', 'help')], active: 'mine' }));
        switchPage(pages()[0].id);
        expect(openRailPage(KEY, LABEL, ARRANGEMENT)).toBe(true);
        expect(pages()).toHaveLength(2);
        expect(currentPage().id).toBe(made);
        expect(viewsOf(layout())).toEqual(['help']);
    });

    it('keeps the page when the button is renamed, since the key ties them', () => {
        loadLayout(fakeStorage(saveOwn()));
        openRailPage(KEY, LABEL, ARRANGEMENT);
        const made = currentPage().id;
        switchPage(pages()[0].id);
        expect(openRailPage(KEY, 'Agents at work', ARRANGEMENT)).toBe(true);
        expect(currentPage().id).toBe(made);
        expect(pages()).toHaveLength(2);
    });

    it('takes a page no button holds whose name is the label, and not one a button holds', () => {
        loadLayout(fakeStorage(saveOwn()));
        openPage(LABEL);
        const mine = currentPage().id;
        switchPage(pages()[0].id);
        expect(openRailPage(KEY, LABEL, ARRANGEMENT)).toBe(true);
        expect(currentPage().id).toBe(mine);
        expect(currentPage().rail).toBe(KEY);
        // A second key under the same label finds the first one's page taken and makes its own.
        expect(openRailPage('other', LABEL, ARRANGEMENT)).toBe(true);
        expect(currentPage().id).not.toBe(mine);
        expect(pages()).toHaveLength(3);
    });

    it('changes nothing for an empty key', () => {
        loadLayout(fakeStorage(saveOwn()));
        expect(openRailPage('', LABEL, ARRANGEMENT)).toBe(false);
        expect(pages()).toHaveLength(1);
    });

    it('changes nothing on an arrangement that does not parse', () => {
        loadLayout(fakeStorage(saveOwn()));
        expect(openRailPage('broken', 'Broken', { root: { kind: 'box' } })).toBe(false);
        expect(pages()).toHaveLength(1);
        expect(workbench()).toEqual(own());
    });

    it('saves the key with the page, so a reload finds the same page behind the button', () => {
        const storage = fakeStorage(saveOwn());
        loadLayout(storage);
        openRailPage(KEY, LABEL, ARRANGEMENT);
        change(() => ({ kind: 'pane', tabs: [instance('mine', 'help')], active: 'mine' }));
        // Renamed, so the page is found by its key alone and not by the button's label.
        renamePage(currentPage().id, 'Mine');
        expect(Object.keys(storage.held)).toEqual([LAYOUT_KEY]);
        const again = createClientState();
        again.layout.loadLayout(storage);
        again.layout.switchPage(again.layout.pages()[0].id);
        expect(again.layout.openRailPage(KEY, LABEL, ARRANGEMENT)).toBe(true);
        expect(again.layout.pages()).toHaveLength(2);
        expect(viewsOf(again.layout.layout())).toEqual(['help']);
    });

    it('renames the page without untying it from its button', () => {
        loadLayout(fakeStorage(saveOwn()));
        openRailPage(KEY, LABEL, ARRANGEMENT);
        const made = currentPage().id;
        renamePage(made, 'Renamed');
        switchPage(pages()[0].id);
        openRailPage(KEY, LABEL, ARRANGEMENT);
        expect(currentPage().id).toBe(made);
        expect(currentPage().label).toBe('Renamed');
    });

    it('makes every rail page of the shipped config from its arrangement', () => {
        const rail = railPages(loadConfig(engineDir()).config);
        expect(rail.length).toBeGreaterThan(0);
        loadLayout(fakeStorage());
        for (const entry of rail) {
            expect(openRailPage(entry.page, entry.label, entry.node)).toBe(true);
            expect(currentPage().rail).toBe(entry.page);
        }
        expect(pages()).toHaveLength(rail.length + 1);
    });
});

/**
 * A parsed arrangement without its minted ids, as one line: a split is `dir sizes (children)`, a
 * pane is its tabs as `view` or `view:state` with the index of its active tab after `@`.
 */
function outline(value: unknown): string {
    const parsed = parseArrangement(value);
    if (parsed === null) return 'null';
    const walk = (node: Layout): string => {
        if (node.kind === 'split') {
            return `${node.dir} [${node.sizes.join(',')}] (${node.children.map(walk).join(' | ')})`;
        }
        if (node.kind !== 'pane') return node.kind;
        const tabs = node.tabs.map((tab) => {
            const state = JSON.stringify(tab.state);
            return state === '{}' ? tab.view : `${tab.view}:${state}`;
        });
        return `${tabs.join(' ')}@${node.tabs.findIndex((tab) => tab.id === node.active)}`;
    };
    return `${Object.keys(parsed).join()} ${walk(parsed.root)}`;
}

/** A split of two panes over the sizes and the extra fields handed in. */
function twoPanes(sizes: unknown, over: Record<string, unknown> = {}): unknown {
    return {
        root: {
            kind: 'split',
            dir: 'row',
            sizes,
            children: [
                { kind: 'pane', view: 'timeline' },
                { kind: 'pane', view: 'agents' }
            ],
            ...over
        }
    };
}

/** The outline of a root made of one pane naming `view`. */
const paneOf = (view: unknown): string => outline({ root: { kind: 'pane', view } });

/** The outline of a root that is `node`. */
const rootOf = (node: unknown): string => outline({ root: node });

/** The root a two-pane arrangement is read into. */
function splitRoot(): Workbench['root'] {
    const read = parseArrangement(twoPanes([0.5, 0.5]));
    if (read === null) throw new Error('a two-pane arrangement is refused');
    return read.root;
}

/** The outline of a split of two panes over `sizes` and the extra fields handed in. */
const splitOf = (sizes: unknown, over: Record<string, unknown> = {}): string =>
    outline(twoPanes(sizes, over));

describe('the arrangement reader over values of the wrong type', () => {
    const rows: [string, () => unknown, unknown][] = [
        ['an array', () => outline([]), 'null'],
        ['null', () => outline(null), 'null'],
        ['a string', () => outline('root'), 'null'],
        ['a number', () => outline(3), 'null'],
        ['a map with no root', () => outline({}), 'null'],
        ['a root that is an array', () => rootOf([]), 'null'],
        ['a root that is null', () => rootOf(null), 'null'],
        ['a root that is a string', () => rootOf('pane'), 'null'],
        ['a root with no kind', () => rootOf({ view: 'a' }), 'null'],
        ['a root of an unknown kind', () => rootOf({ kind: 'page', view: 'a' }), 'null'],
        ['a kind that is a number', () => rootOf({ kind: 3, view: 'a' }), 'null'],
        ['a pane naming one view', () => paneOf('a'), 'root a@0'],
        ['a pane naming an empty view', () => paneOf(''), 'null'],
        ['a pane whose view is a number', () => paneOf(3), 'null'],
        ['a pane whose view is a map', () => paneOf({ view: 'a' }), 'null'],
        ['a pane whose view is null', () => paneOf(null), 'null'],
        ['a pane with no view', () => rootOf({ kind: 'pane' }), 'null'],
        ['a pane naming an empty list', () => paneOf([]), 'root @-1'],
        ['a pane naming a list with an empty name', () => paneOf(['a', '']), 'null'],
        ['a pane naming a list with a number', () => paneOf(['a', 3]), 'null'],
        ['a pane naming a list with null', () => paneOf(['a', null]), 'null'],
        ['a pane naming a list with a list', () => paneOf([['a']]), 'null'],
        ['a pane naming two views', () => paneOf(['a', 'b']), 'root a b@0'],
        ['a pane naming a view twice', () => paneOf(['a', 'a']), 'root a a@0'],
        [
            'a pane whose tab is a map',
            () => paneOf([{ view: 'a', state: { z: 1, a: 2 } }]),
            'root a:{"z":1,"a":2}@0'
        ],
        ['a pane whose tab is a map with no state', () => paneOf([{ view: 'a' }]), 'root a@0'],
        [
            'a pane whose tab is a map with an undefined state',
            () => paneOf([{ view: 'a', state: undefined }]),
            'root a@0'
        ],
        ['a pane whose tab state is null', () => paneOf([{ view: 'a', state: null }]), 'null'],
        ['a pane whose tab state is a list', () => paneOf([{ view: 'a', state: [] }]), 'null'],
        ['a pane whose tab state is a string', () => paneOf([{ view: 'a', state: 's' }]), 'null'],
        ['a pane whose tab state is a number', () => paneOf([{ view: 'a', state: 0 }]), 'null'],
        [
            'a pane whose tab has a view that is a number',
            () => paneOf([{ view: 3, state: {} }]),
            'null'
        ],
        ['a pane whose tab has an empty view', () => paneOf([{ view: '', state: {} }]), 'null'],
        ['a pane whose tab has no view', () => paneOf([{ state: {} }]), 'null'],
        [
            'a pane whose tab state has an own __proto__ key',
            () =>
                paneOf([
                    { view: 'a', state: JSON.parse('{"__proto__":{"x":1},"y":2}') as unknown }
                ]),
            'root a:{"__proto__":{"x":1},"y":2}@0'
        ],
        ['a pane whose tab is named __proto__', () => paneOf('__proto__'), 'root __proto__@0'],
        [
            'a split of two panes',
            () => splitOf([0.5, 0.5]),
            'root row [0.5,0.5] (timeline@0 | agents@0)'
        ],
        ['a split whose sizes are a map', () => splitOf({ 0: 0.5, 1: 0.5 }), 'null'],
        ['a split whose sizes are a string', () => splitOf('half'), 'null'],
        ['a split whose sizes are null', () => splitOf(null), 'null'],
        ['a split whose sizes hold a string', () => splitOf([0.5, '0.5']), 'null'],
        ['a split whose sizes hold NaN', () => splitOf([Number.NaN, 0.5]), 'null'],
        ['a split whose sizes hold Infinity', () => splitOf([Infinity, 0.5]), 'null'],
        ['a split whose sizes hold a negative infinity', () => splitOf([-Infinity, 0.5]), 'null'],
        ['a split whose sizes hold null', () => splitOf([0.5, null]), 'null'],
        ['a split with one size for two children', () => splitOf([1]), 'null'],
        ['a split with three sizes for two children', () => splitOf([0.3, 0.3, 0.4]), 'null'],
        ['a split whose sizes do not sum to one', () => splitOf([0.5, 0.6]), 'null'],
        ['a split with a child under the minimum', () => splitOf([0.99, 0.01]), 'null'],
        [
            'a split with a direction that is not one',
            () => splitOf([0.5, 0.5], { dir: 'sideways' }),
            'null'
        ],
        [
            'a split with a direction that is a number',
            () => splitOf([0.5, 0.5], { dir: 1 }),
            'null'
        ],
        ['a split with no direction', () => splitOf([0.5, 0.5], { dir: undefined }), 'null'],
        [
            'a split whose children are a string',
            () => splitOf([0.5, 0.5], { children: 'two' }),
            'null'
        ],
        ['a split whose children are a map', () => splitOf([0.5, 0.5], { children: {} }), 'null'],
        ['a split whose children are null', () => splitOf([0.5, 0.5], { children: null }), 'null'],
        [
            'a split whose children hold null',
            () => splitOf([0.5, 0.5], { children: [{ kind: 'pane', view: 'a' }, null] }),
            'null'
        ],
        [
            'a split whose children hold a pane naming a number',
            () =>
                splitOf([0.5, 0.5], {
                    children: [
                        { kind: 'pane', view: 'a' },
                        { kind: 'pane', view: 3 }
                    ]
                }),
            'null'
        ],
        [
            'a split with one child',
            () => splitOf([1], { children: [{ kind: 'pane', view: 'a' }] }),
            'null'
        ],
        [
            'a split with a folded list',
            () => splitOf([0.5, 0.5], { folded: [0] }),
            'root row [0.5,0.5] (timeline@0 | agents@0)'
        ],
        [
            'a split holding a split',
            () =>
                rootOf({
                    kind: 'split',
                    dir: 'col',
                    sizes: [0.5, 0.5],
                    children: [
                        { kind: 'pane', view: 'a' },
                        {
                            kind: 'split',
                            dir: 'row',
                            sizes: [0.4, 0.6],
                            children: [
                                { kind: 'pane', view: 'a' },
                                { kind: 'pane', view: ['c', 'd'] }
                            ]
                        }
                    ]
                }),
            'root col [0.5,0.5] (a@0 | row [0.4,0.6] (a@0 | c d@0))'
        ],
        [
            'a root with fields it does not read',
            () => outline({ root: { kind: 'pane', view: 'a', extra: 1 }, other: 2 }),
            'root a@0'
        ],
        [
            'the keys of the workbench',
            () => Object.keys(parseArrangement(twoPanes([0.5, 0.5])) ?? {}),
            ['root']
        ],
        [
            'the keys of the split',
            () => Object.keys(splitRoot()),
            ['kind', 'dir', 'sizes', 'children']
        ],
        [
            'the keys of the pane',
            () => Object.keys(panes(splitRoot())[0].pane),
            ['kind', 'tabs', 'active']
        ],
        [
            'the keys of the tab',
            () => Object.keys(panes(splitRoot())[0].pane.tabs[0]),
            ['id', 'view', 'state']
        ]
    ];

    it.each(rows)('%s', (_name, run, expected) => {
        expect(run()).toStrictEqual(expected);
    });
});

describe('the state a tab of an arrangement opens with', () => {
    it('is a copy of the state written, with the same own keys in the same order', () => {
        const written = JSON.parse('{"b":1,"__proto__":{"x":1},"a":2}') as Record<string, unknown>;
        const made = present(
            parseArrangement({ root: { kind: 'pane', view: [{ view: 'files', state: written }] } }),
            'arrangement'
        );
        const state = panes(made.root)[0].pane.tabs[0].state as Record<string, unknown>;
        expect(state).not.toBe(written);
        expect(Object.keys(state)).toStrictEqual(['b', '__proto__', 'a']);
        expect(Object.getPrototypeOf(state)).toBe(Object.prototype);
        expect(state.b).toBe(1);
        expect(state.a).toBe(2);
    });
});
