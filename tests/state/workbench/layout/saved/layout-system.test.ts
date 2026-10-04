// Layer 2, client-state tests. The saved System page carried over: the rail has one System button
// (the page tied to the rail key `views`), so a saved page tied to the rail key `info` is folded
// into it when a layout is read, and a saved `config` tab, whose view does not exist, becomes a
// `settings` tab. The pages shown after a reload in a browser are
// tests/state/workbench/navigation/arrangement.test.ts's.
//
// Nothing here touches localStorage or the DOM: every case reads a hand-built envelope.

import { describe, expect, it } from 'vitest';
import {
    LAYOUT_VERSION,
    panes,
    parseLayout,
    serialiseLayout,
    type Float,
    type Layout,
    type Pages
} from '../../../../../src/lib/state/workbench/layout/index.ts';
import { envelope, instance, split } from '../layout-fixture.ts';

describe('the saved System page carried over', () => {
    /** A tab as a saved layout holds it. */
    function tab(id: string, view: string, state: unknown = null) {
        return { ...instance(id, view), state };
    }

    /** A pane of these tabs, the first of them active unless one is named. */
    function paneOf(tabs: ReturnType<typeof tab>[], active?: string): Layout {
        return { kind: 'pane', tabs, active: active ?? tabs.at(0)?.id ?? '' };
    }

    /** A saved page, tied to a rail key when it has one. */
    function page(id: string, root: Layout, rail?: string) {
        return { id, label: id, workbench: { root }, ...(rail === undefined ? {} : { rail }) };
    }

    /** An envelope of the current version. */
    function saved(pages: unknown[], current: string, floats: unknown[] = []): unknown {
        return { version: LAYOUT_VERSION, pages, current, floats };
    }

    /** The layout read from an envelope, which every case here expects to be readable. */
    function read(value: unknown): Pages {
        const found = parseLayout(value, 'Home');
        if (found === null) throw new Error('the envelope was refused');
        return found;
    }

    /** The view of every tab of a page, depth first. */
    function viewsIn(held: Pages, id: string): string[] {
        const found = held.pages.find((one) => one.id === id);
        if (found === undefined) throw new Error(`no page ${id}`);
        return panes(found.workbench.root).flatMap(({ pane }) => pane.tabs.map((one) => one.view));
    }

    /** The view of every tab anywhere: pages and floats. */
    function everyView(held: Pages): string[] {
        return [
            ...held.pages.flatMap((one) =>
                panes(one.workbench.root).flatMap(({ pane }) =>
                    pane.tabs.map((entry) => entry.view)
                )
            ),
            ...held.floats.flatMap((float) => float.pane.tabs.map((entry) => entry.view))
        ];
    }

    /** The System page as the rail makes it today: settings, the navigators, the status views. */
    function systemRoot(withStatus = true): Layout {
        return split(
            'row',
            [0.5, 0.5],
            [
                paneOf([tab('v-set', 'settings'), tab('v-acc', 'account-setup')]),
                split(
                    'col',
                    [0.5, 0.5],
                    [
                        paneOf([tab('v-cat', 'catalogue'), tab('v-pag', 'pages')]),
                        paneOf(
                            withStatus
                                ? [
                                      tab('v-sta', 'status'),
                                      tab('v-fin', 'findings'),
                                      tab('v-aud', 'audit'),
                                      tab('v-his', 'history')
                                  ]
                                : [tab('v-fin', 'findings')]
                        )
                    ]
                )
            ]
        );
    }

    /** A saved page of the `info` rail key, as the System button opened it. */
    function infoRoot(): Layout {
        return paneOf([
            tab('i-sta', 'status'),
            tab('i-cfg', 'config', { open: ['layout.yml'] }),
            tab('i-gal', 'gallery')
        ]);
    }

    const HOME = page('home', paneOf([tab('h-1', 'focus')]), 'focus');

    describe('a saved info page and a views page', () => {
        const value = (): unknown =>
            saved(
                [HOME, page('p-info', infoRoot(), 'info'), page('p-views', systemRoot(), 'views')],
                'home'
            );

        it('is one page fewer, with no info page left', () => {
            const held = read(value());
            expect(held.pages.map((one) => one.id)).toEqual(['home', 'p-views']);
            expect(held.pages.some((one) => one.rail === 'info')).toBe(false);
        });

        it('appends the info tabs the views page lacks to the pane holding status, in order, once', () => {
            const held = read(value());
            expect(viewsIn(held, 'p-views')).toEqual([
                'settings',
                'account-setup',
                'catalogue',
                'pages',
                'status',
                'findings',
                'audit',
                'history',
                'gallery'
            ]);
            const host = panes(held.pages[1].workbench.root).find(({ pane }) =>
                pane.tabs.some((one) => one.view === 'status')
            );
            expect(host?.pane.tabs.map((one) => one.id)).toEqual([
                'v-sta',
                'v-fin',
                'v-aud',
                'v-his',
                'i-gal'
            ]);
        });

        it('leaves no config tab anywhere, and a settings tab once', () => {
            const held = read(value());
            expect(everyView(held)).not.toContain('config');
            expect(everyView(held).filter((view) => view === 'settings')).toHaveLength(1);
        });

        it('appends to the last pane when no pane holds status', () => {
            const without = saved(
                [
                    HOME,
                    page('p-info', infoRoot(), 'info'),
                    page('p-views', systemRoot(false), 'views')
                ],
                'home'
            );
            const held = read(without);
            const all = panes(held.pages[1].workbench.root);
            expect(all.at(-1)?.pane.tabs.map((one) => one.view)).toEqual([
                'findings',
                'status',
                'gallery'
            ]);
        });

        it('keeps the active tab of the pane it appends to', () => {
            const held = read(value());
            const host = panes(held.pages[1].workbench.root).find(({ pane }) =>
                pane.tabs.some((one) => one.view === 'status')
            );
            expect(host?.pane.active).toBe('v-sta');
        });
    });

    describe('a saved views page holding settings, the navigators and no system view', () => {
        /** The page as the rail shipped it: the catalogue beside settings over pages. */
        function shippedRoot(): Layout {
            return split(
                'row',
                [0.5, 0.5],
                [
                    paneOf([tab('v-cat', 'catalogue')]),
                    split(
                        'col',
                        [0.6, 0.4],
                        [
                            paneOf([tab('v-set', 'settings'), tab('v-acc', 'account-setup')]),
                            paneOf([tab('v-pag', 'pages')])
                        ]
                    )
                ]
            );
        }

        /** A page of settings beside one pane holding the catalogue and pages. */
        function rowRoot(): Layout {
            return split(
                'row',
                [0.5, 0.5],
                [
                    paneOf([tab('v-set', 'settings'), tab('v-acc', 'account-setup')]),
                    paneOf([tab('v-cat', 'catalogue'), tab('v-pag', 'pages')])
                ]
            );
        }

        /** The info page with all five system views and a config tab, in two panes. */
        function fullInfoRoot(): Layout {
            return split(
                'row',
                [0.3, 0.7],
                [
                    paneOf([tab('i-sta', 'status', { filter: 'red' }), tab('i-fin', 'findings')]),
                    paneOf([
                        tab('i-aud', 'audit', { open: 'a' }),
                        tab('i-his', 'history'),
                        tab('i-gal', 'gallery'),
                        tab('i-cfg', 'config', { open: ['layout.yml'] })
                    ])
                ]
            );
        }

        /** The info page the rail shipped: one pane of six views, audit the one shown. */
        function shippedInfoRoot(): Layout {
            return paneOf(
                [
                    tab('i-sta', 'status', { filter: 'red' }),
                    tab('i-fin', 'findings'),
                    tab('i-aud', 'audit', { open: 'a' }),
                    tab('i-his', 'history'),
                    tab('i-cfg', 'config', { open: ['layout.yml'] }),
                    tab('i-gal', 'gallery')
                ],
                'i-aud'
            );
        }

        /** A float, which a fold of the pages leaves where it is. */
        const FLOAT = {
            id: 'f1',
            pane: paneOf([tab('f-hpc', 'hpc')]),
            place: { kind: 'dock', edge: 'right', size: 0.3 }
        };

        /** The envelope: home, the info page, the views page with its label and maximised path. */
        function value(
            root: Layout,
            over: { label?: string; focus?: number[]; info?: Layout } = {}
        ): unknown {
            const { label = 'Views and Settings', focus, info = fullInfoRoot() } = over;
            const workbench = focus === undefined ? { root } : { root, focus: { path: focus } };
            return saved(
                [
                    HOME,
                    page('p-info', info, 'info'),
                    { ...page('p-views', root, 'views'), label, workbench }
                ],
                'home',
                [FLOAT]
            );
        }

        const viewsPage = (held: Pages) => held.pages.find((one) => one.id === 'p-views');

        /** The node of a tree at this path. */
        function nodeAt(root: Layout, path: number[]): Layout {
            return path.reduce<Layout>(
                (node, step) => (node.kind === 'split' ? node.children[step] : node),
                root
            );
        }

        /** The ids of every tab of every page and float. */
        function idsOf(held: Pages): string[] {
            const inPages = held.pages.flatMap((one) =>
                panes(one.workbench.root).flatMap(({ pane }) => pane.tabs.map((it) => it.id))
            );
            return [...inPages, ...held.floats.flatMap((it) => it.pane.tabs.map((e) => e.id))];
        }

        /** Each shape, with the path of its pages pane, of another pane, and the pages tabs. */
        const SHAPES: [string, () => Layout, number[], number[], string[]][] = [
            ['as the rail shipped it', shippedRoot, [1, 1], [1, 0], ['pages']],
            ['as a row of two panes', rowRoot, [1], [0], ['catalogue', 'pages']]
        ];

        describe.each(SHAPES)('%s', (_, root, pagesPath, otherPath, pagesTabs) => {
            it.each([
                ['the name the rail shipped', undefined, 'System'],
                ['a name the viewer gave the page', 'Machine', 'Machine']
            ])('labels the page for %s', (__, label, expected) => {
                const held = read(value(root(), { label }));
                expect(viewsPage(held)?.label).toBe(expected);
            });

            it('puts the five system views in their own pane below the pane holding pages', () => {
                const found = viewsPage(read(value(root())))?.workbench.root ?? HOME.workbench.root;
                const wrapped = nodeAt(found, pagesPath);
                expect(wrapped).toMatchObject({ kind: 'split', dir: 'col', sizes: [0.5, 0.5] });
                if (wrapped.kind !== 'split') throw new Error('the pages pane is not wrapped');
                const [top, below] = wrapped.children;
                expect(top.kind === 'pane' && top.tabs.map((one) => one.view)).toEqual(pagesTabs);
                expect(below.kind === 'pane' && below.tabs.map((one) => one.view)).toEqual([
                    'status',
                    'findings',
                    'audit',
                    'history',
                    'gallery'
                ]);
            });

            it.each([
                ['nothing is maximised', undefined, undefined],
                ['a pane other than pages is maximised', otherPath, otherPath],
                ['the pages pane is maximised', pagesPath, [...pagesPath, 0]]
            ])('reads the layout when %s, keeping every page, tab and float', (__, from, to) => {
                const held = read(value(root(), { focus: from }));
                const before = [...tabIds(root()), 'h-1', 'f-hpc', 'i-sta', 'i-fin', 'i-aud'];
                expect(idsOf(held).sort()).toEqual([...before, 'i-his', 'i-gal'].sort());
                expect(held.pages.map((one) => one.id)).toEqual(['home', 'p-views']);
                expect(held.floats.map((one) => one.id)).toEqual(['f1']);
                const focus = viewsPage(held)?.workbench.focus;
                expect(focus?.path).toEqual(to);
                if (focus === undefined) return;
                const maximised = nodeAt(viewsPage(held)?.workbench.root ?? root(), focus.path);
                const expected = from === pagesPath ? pagesTabs : null;
                if (expected !== null) {
                    expect(
                        maximised.kind === 'pane' && maximised.tabs.map((it) => it.view)
                    ).toEqual(expected);
                }
            });
        });

        /** The ids of the tabs of a tree. */
        const tabIds = (root: Layout): string[] =>
            panes(root).flatMap(({ pane }) => pane.tabs.map((one) => one.id));

        it('reads a views page that is one maximised pane holding pages', () => {
            const only = paneOf([tab('v-pag', 'pages')]);
            const found = viewsPage(read(value(only, { focus: [] })));
            expect(found?.workbench.focus?.path).toEqual([0]);
            const maximised = nodeAt(found?.workbench.root ?? only, [0]);
            expect(maximised.kind === 'pane' && maximised.tabs.map((one) => one.view)).toEqual([
                'pages',
                'settings'
            ]);
        });

        it('keeps the id and the state of every info tab but config', () => {
            const held = read(value(shippedRoot()));
            const tabs = panes(viewsPage(held)?.workbench.root ?? HOME.workbench.root).flatMap(
                ({ pane }) => pane.tabs
            );
            expect(tabs.find((one) => one.id === 'i-sta')?.state).toEqual({ filter: 'red' });
            expect(tabs.find((one) => one.id === 'i-aud')?.state).toEqual({ open: 'a' });
            expect(tabs.some((one) => one.id === 'i-cfg')).toBe(false);
        });

        /** The tab shown by the pane that holds status, after the read. */
        function shownWith(info: Layout): string | undefined {
            const found = viewsPage(read(value(shippedRoot(), { info })))?.workbench.root;
            const own = panes(found ?? HOME.workbench.root).find(({ pane }) =>
                pane.tabs.some((one) => one.view === 'status')
            );
            return own?.pane.active;
        }

        it('shows the system view the info page showed', () => {
            expect(shownWith(shippedInfoRoot())).toBe('i-aud');
        });

        it('shows the first system view when the info page showed a tab that is not one', () => {
            const info = paneOf(
                [
                    tab('i-sta', 'status'),
                    tab('i-aud', 'audit'),
                    tab('i-gal', 'gallery'),
                    tab('i-x', 'config')
                ],
                'i-x'
            );
            expect(shownWith(info)).toBe('i-sta');
        });

        it('shows the system view of the first info pane that showed one', () => {
            const info = split(
                'row',
                [0.5, 0.5],
                [
                    paneOf([tab('i-x', 'config'), tab('i-sta', 'status')], 'i-x'),
                    paneOf([tab('i-fin', 'findings'), tab('i-aud', 'audit')], 'i-aud')
                ]
            );
            expect(shownWith(info)).toBe('i-aud');
        });
    });

    describe('a saved info page and no views page', () => {
        const value = (): unknown => saved([HOME, page('p-info', infoRoot(), 'info')], 'p-info');

        it('takes the rail key views, and keeps its id and its place', () => {
            const held = read(value());
            expect(held.pages.map((one) => [one.id, one.rail])).toEqual([
                ['home', 'focus'],
                ['p-info', 'views']
            ]);
            expect(held.current).toBe('p-info');
        });

        it('turns its config tab into a settings tab with the state dropped', () => {
            const held = read(value());
            const tabs = panes(held.pages[1].workbench.root)[0].pane.tabs;
            expect(tabs.map((one) => one.view)).toEqual(['status', 'settings', 'gallery']);
            expect(tabs[1].id).toBe('i-cfg');
            expect(tabs[1].state ?? null).toBeNull();
        });
    });

    describe('the current page', () => {
        it('is the views page after the read when it was the info page', () => {
            const held = read(
                saved(
                    [
                        HOME,
                        page('p-info', infoRoot(), 'info'),
                        page('p-views', systemRoot(), 'views')
                    ],
                    'p-info'
                )
            );
            expect(held.current).toBe('p-views');
        });

        it('stays the page it was when that page is not the info page', () => {
            const held = read(
                saved(
                    [
                        HOME,
                        page('p-info', infoRoot(), 'info'),
                        page('p-views', systemRoot(), 'views')
                    ],
                    'home'
                )
            );
            expect(held.current).toBe('home');
        });
    });

    describe('a layout with no info page and no config tab', () => {
        it('is read as it was, tab for tab', () => {
            const pages = [HOME, page('p-views', systemRoot(), 'views')];
            const held = read(saved(pages, 'p-views'));
            expect(held).toEqual({
                pages: [
                    {
                        id: 'home',
                        label: 'home',
                        workbench: { root: HOME.workbench.root },
                        rail: 'focus'
                    },
                    {
                        id: 'p-views',
                        label: 'p-views',
                        workbench: { root: systemRoot() },
                        rail: 'views'
                    }
                ],
                current: 'p-views',
                floats: []
            });
        });

        it('is the same layout when read again after a save', () => {
            const first = read(
                saved(
                    [
                        HOME,
                        page('p-info', infoRoot(), 'info'),
                        page('p-views', systemRoot(), 'views')
                    ],
                    'p-info'
                )
            );
            const again = read(JSON.parse(serialiseLayout(first)));
            expect(again).toEqual(first);
        });
    });

    describe('the other places a saved info page or config tab sits', () => {
        it('renames a page leaf of another page that shows the info page to the views page', () => {
            const other = page(
                'other',
                split(
                    'row',
                    [0.5, 0.5],
                    [paneOf([tab('o-1', 'focus')]), { kind: 'page', page: 'p-info' }]
                )
            );
            const held = read(
                saved(
                    [
                        HOME,
                        other,
                        page('p-info', infoRoot(), 'info'),
                        page('p-views', systemRoot(), 'views')
                    ],
                    'home'
                )
            );
            const root = held.pages.find((one) => one.id === 'other')?.workbench.root;
            expect(root).toMatchObject({
                children: [{ kind: 'pane' }, { kind: 'page', page: 'p-views' }]
            });
        });

        it('makes a page leaf of the views page that shows the info page an empty pane', () => {
            const views = page(
                'p-views',
                split(
                    'row',
                    [0.5, 0.5],
                    [paneOf([tab('v-1', 'settings')]), { kind: 'page', page: 'p-info' }]
                ),
                'views'
            );
            const held = read(saved([HOME, page('p-info', infoRoot(), 'info'), views], 'home'));
            const root = held.pages.find((one) => one.id === 'p-views')?.workbench.root;
            expect(root).toMatchObject({
                children: [{ kind: 'pane' }, { kind: 'pane', tabs: [], active: '' }]
            });
        });

        it('keeps a page leaf that shows the info page when that page becomes the views page', () => {
            const other = page(
                'other',
                split(
                    'row',
                    [0.5, 0.5],
                    [paneOf([tab('o-1', 'focus')]), { kind: 'page', page: 'p-info' }]
                )
            );
            const held = read(saved([HOME, other, page('p-info', infoRoot(), 'info')], 'home'));
            const root = held.pages.find((one) => one.id === 'other')?.workbench.root;
            expect(root).toMatchObject({
                children: [{ kind: 'pane' }, { kind: 'page', page: 'p-info' }]
            });
            expect(held.pages.find((one) => one.id === 'p-info')?.rail).toBe('views');
        });

        it('turns the config tab of a float into a settings tab', () => {
            const float = {
                id: 'f1',
                pane: paneOf([tab('f-cfg', 'config', { open: [] }), tab('f-hpc', 'hpc')]),
                place: { kind: 'dock', edge: 'right', size: 0.3 }
            };
            const held = read(saved([HOME], 'home', [float]));
            const found: Float = held.floats[0];
            expect(found.pane.tabs.map((one) => [one.id, one.view])).toEqual([
                ['f-cfg', 'settings'],
                ['f-hpc', 'hpc']
            ]);
        });

        it('turns the config tab of the one-workbench envelope into a settings tab', () => {
            const held = read(
                envelope({
                    main: paneOf([tab('m-cfg', 'config'), tab('m-hpc', 'hpc')]),
                    panel: paneOf([]),
                    dock: 'hidden'
                })
            );
            expect(everyView(held)).toEqual(['settings', 'hpc']);
        });

        it('removes a config tab beside a settings tab of its pane, and the active tab becomes its neighbour', () => {
            const before = read(
                saved(
                    [
                        page(
                            'work',
                            paneOf(
                                [
                                    tab('w-hpc', 'hpc'),
                                    tab('w-set', 'settings'),
                                    tab('w-cfg', 'config')
                                ],
                                'w-cfg'
                            )
                        )
                    ],
                    'work'
                )
            );
            const pane = panes(before.pages[0].workbench.root)[0].pane;
            expect(pane.tabs.map((one) => one.id)).toEqual(['w-hpc', 'w-set']);
            expect(pane.active).toBe('w-set');
            const after = read(
                saved(
                    [
                        page(
                            'work',
                            paneOf([tab('w-cfg', 'config'), tab('w-set', 'settings')], 'w-cfg')
                        )
                    ],
                    'work'
                )
            );
            const second = panes(after.pages[0].workbench.root)[0].pane;
            expect(second.tabs.map((one) => one.id)).toEqual(['w-set']);
            expect(second.active).toBe('w-set');
        });

        it('keeps the active tab of a pane when the config tab removed was not the active one', () => {
            const held = read(
                saved(
                    [
                        page(
                            'work',
                            paneOf(
                                [
                                    tab('w-hpc', 'hpc'),
                                    tab('w-set', 'settings'),
                                    tab('w-cfg', 'config')
                                ],
                                'w-hpc'
                            )
                        )
                    ],
                    'work'
                )
            );
            const pane = panes(held.pages[0].workbench.root)[0].pane;
            expect(pane.tabs.map((one) => one.id)).toEqual(['w-hpc', 'w-set']);
            expect(pane.active).toBe('w-hpc');
        });

        it('removes an info page whose every tab the views page holds, and appends nothing', () => {
            const info = page(
                'p-info',
                paneOf([tab('i-sta', 'status'), tab('i-cfg', 'config')]),
                'info'
            );
            const held = read(
                saved([HOME, info, page('p-views', systemRoot(), 'views')], 'p-info')
            );
            expect(held.pages.map((one) => one.id)).toEqual(['home', 'p-views']);
            expect(viewsIn(held, 'p-views')).toEqual([
                'settings',
                'account-setup',
                'catalogue',
                'pages',
                'status',
                'findings',
                'audit',
                'history'
            ]);
            expect(held.current).toBe('p-views');
        });
    });
});
