// The rail's list of pages: the rule of data/sources/config/rail.ts over `rail:` (an entry kept, an
// entry empty, a page key named twice, a page key naming no arrangement, a glyph the vocabulary
// does not hold), the findings a hand edit earns, the pages the page hands the shell, and the list
// a Settings tab is editing before it is saved.
//
// Nothing here renders; every case is over a pure function.

import { describe, expect, it } from 'vitest';
import {
    arrangementKeys,
    readRail,
    railFindings
} from '../../../../src/lib/data/sources/config/rail.ts';
import {
    SETTINGS_VIEW,
    configRail,
    moveRailEntry,
    railDraft,
    railPages,
    railTyped,
    sameRail,
    withRailDraft
} from '../../../../src/lib/state/workbench/navigation/rail.ts';
import { engineDir, loadConfig, textCatalog } from '../../../../src/lib/data/sources/config.ts';
import { SHIPPED_RAIL_LABELS } from '../../../shell/rail/shipped-rail.ts';

const { config } = loadConfig(engineDir());
const catalog = textCatalog(config);

const PAGES = ['focus', 'views'];
const GLYPHS = ['compass', 'sliders'];

const FOCUS = { label: 'Focus', glyph: 'compass', page: 'focus' };
const VIEWS = { label: 'Views', glyph: 'sliders', page: 'views' };

describe('the rule over the rail list', () => {
    it('keeps an entry of three strings whose page is an arrangement, in list order', () => {
        expect(readRail([VIEWS, FOCUS], PAGES, GLYPHS)).toEqual({
            entries: [VIEWS, FOCUS],
            problems: []
        });
    });

    it('refuses an entry with an empty or a blank label, glyph or page', () => {
        const read = readRail(
            [
                { ...FOCUS, label: '' },
                { ...FOCUS, glyph: '  ' },
                { ...FOCUS, page: '' }
            ],
            PAGES,
            GLYPHS
        );
        expect(read.entries).toEqual([]);
        expect(read.problems.map((one) => one.why)).toEqual(['label', 'glyph', 'page']);
    });

    it('keeps the first of two entries naming one page and refuses the second', () => {
        const read = readRail([FOCUS, { ...FOCUS, label: 'Again' }], PAGES, GLYPHS);
        expect(read.entries).toEqual([FOCUS]);
        expect(read.problems).toEqual([{ index: 1, why: 'repeated', page: 'focus' }]);
    });

    it('refuses a page key no arrangement holds, a reserved-looking one included', () => {
        const read = readRail(
            [
                { ...FOCUS, page: 'nowhere' },
                { ...FOCUS, page: '__proto__' },
                { ...FOCUS, page: 'constructor' }
            ],
            PAGES,
            GLYPHS
        );
        expect(read.entries).toEqual([]);
        expect(read.problems.map((one) => one.why)).toEqual([
            'page_unknown',
            'page_unknown',
            'page_unknown'
        ]);
    });

    it('refuses a glyph the vocabulary does not hold only when it is given one', () => {
        const odd = { ...FOCUS, glyph: 'nonesuch' };
        expect(readRail([odd], PAGES, GLYPHS).problems).toEqual([
            { index: 0, why: 'glyph_unknown', page: 'focus' }
        ]);
        expect(readRail([odd], PAGES).entries).toEqual([odd]);
    });

    it('refuses an item that is not a map and reads no list as no entries', () => {
        expect(readRail(['focus', FOCUS], PAGES, GLYPHS)).toEqual({
            entries: [FOCUS],
            problems: [{ index: 0, why: 'shape', page: '' }]
        });
        expect(readRail({ focus: FOCUS }, PAGES)).toEqual({ entries: [], problems: [] });
        expect(arrangementKeys(['focus'])).toEqual([]);
    });
});

describe('the findings of a hand edit', () => {
    const FILE = '/engine/config/layout.yml';

    it('reports each refused entry in the catalog words, keyed by its place', () => {
        const found = railFindings(
            {
                arrangements: { focus: {} },
                glyphs: { compass: 'C' },
                rail: [FOCUS, FOCUS, { ...FOCUS, page: 'gone' }]
            },
            FILE,
            catalog
        );
        expect(found).toEqual([
            {
                file: FILE,
                key: 'rail[1]',
                message: catalog['findings.rail.repeated'].replace('{0}', 'focus')
            },
            {
                file: FILE,
                key: 'rail[2]',
                message: catalog['findings.rail.page_unknown'].replace('{0}', 'gone')
            }
        ]);
    });

    it('reports a rail that is not a list, and nothing for a config without the key', () => {
        expect(railFindings({ rail: 'focus' }, FILE, catalog)).toEqual([
            { file: FILE, key: 'rail', message: catalog['findings.rail.not_a_list'] }
        ]);
        expect(railFindings({}, FILE, catalog)).toEqual([]);
    });

    it('finds nothing wrong with the shipped rail list', () => {
        expect(railFindings(config, FILE, catalog)).toEqual([]);
    });
});

describe('the rail pages the page hands the shell', () => {
    it('pairs each kept entry with the arrangement its page names', () => {
        const node = { root: { kind: 'pane', view: 'focus' } };
        expect(
            railPages({ arrangements: { focus: node }, rail: [FOCUS, { ...FOCUS, page: 'x' }] })
        ).toEqual([{ ...FOCUS, node }]);
        expect(railPages(undefined)).toEqual([]);
    });

    it('leaves out an entry whose glyph the vocabulary does not hold, as its finding says', () => {
        const node = { root: { kind: 'pane', view: 'focus' } };
        const held = {
            arrangements: { focus: node, views: node },
            glyphs: { compass: 'C', sliders: 'S' },
            rail: [FOCUS, { ...VIEWS, glyph: 'nonesuch' }]
        };
        expect(railPages(held)).toEqual([{ ...FOCUS, node }]);
        expect(railFindings(held, '/engine/config/layout.yml', catalog)).toEqual([
            {
                file: '/engine/config/layout.yml',
                key: 'rail[1]',
                message: catalog['findings.rail.glyph_unknown'].replace('{0}', 'views')
            }
        ]);
    });

    it('reads the shipped list in its order, Views and Settings last', () => {
        const pages = railPages(config);
        expect(pages.map((one) => one.label)).toEqual(SHIPPED_RAIL_LABELS);
        expect(pages.every((one) => one.node !== undefined)).toBe(true);
    });
});

describe('the rail list a Settings tab is editing', () => {
    it('reads what the tab holds as three strings per row, and nothing for no list', () => {
        expect(railDraft({ rail: [{ label: 3, glyph: 'compass' }] })).toEqual([
            { label: '', glyph: 'compass', page: '' }
        ]);
        expect(railDraft({ other: 1 })).toBe(null);
        expect(railDraft(null)).toBe(null);
    });

    it('sets the list beside what else the tab holds, and takes it away on null', () => {
        const set = withRailDraft({ keep: true }, [FOCUS]);
        expect(set).toEqual({ keep: true, rail: [FOCUS] });
        expect(withRailDraft(set, null)).toEqual({ keep: true });
    });

    it('holds unsaved text only in a Settings tab whose list differs from the file', () => {
        const state = { rail: [FOCUS] };
        expect(railTyped(SETTINGS_VIEW, state, [FOCUS])).toBe(false);
        expect(railTyped(SETTINGS_VIEW, state, [VIEWS])).toBe(true);
        expect(railTyped('status', state, [VIEWS])).toBe(false);
        expect(railTyped(SETTINGS_VIEW, {}, [VIEWS])).toBe(false);
        expect(sameRail([FOCUS, VIEWS], [VIEWS, FOCUS])).toBe(false);
    });

    it('moves a row one place and leaves the list as it is at either end', () => {
        expect(moveRailEntry([FOCUS, VIEWS], 1, -1)).toEqual([VIEWS, FOCUS]);
        expect(moveRailEntry([FOCUS, VIEWS], 0, -1)).toEqual([FOCUS, VIEWS]);
        expect(moveRailEntry([FOCUS, VIEWS], 1, 1)).toEqual([FOCUS, VIEWS]);
    });

    it('reads the file list whole, a broken entry included, for the reader to mend', () => {
        expect(configRail({ rail: [FOCUS, { label: 'Broken' }] })).toEqual([
            FOCUS,
            { label: 'Broken', glyph: '', page: '' }
        ]);
        expect(configRail(undefined)).toEqual([]);
    });
});

describe('the rail readers over a config and a tab state of the wrong type', () => {
    const rows: [string, () => unknown, unknown][] = [
        ['pages of a config with nothing', () => railPages({}), []],
        [
            'pages of a rail that is a string',
            () =>
                railPages({
                    rail: 'focus',
                    arrangements: { focus: { root: { kind: 'pane', view: 'focus' } } }
                }),
            []
        ],
        [
            'pages of a rail that is a map',
            () =>
                railPages({
                    rail: FOCUS,
                    arrangements: { focus: { root: { kind: 'pane', view: 'focus' } } }
                }),
            []
        ],
        [
            'pages of a rail that is null',
            () =>
                railPages({
                    rail: null,
                    arrangements: { focus: { root: { kind: 'pane', view: 'focus' } } }
                }),
            []
        ],
        [
            'pages of arrangements that are a list',
            () =>
                railPages({
                    rail: [FOCUS],
                    arrangements: [{ root: { kind: 'pane', view: 'focus' } }]
                }),
            []
        ],
        [
            'pages of arrangements that are a string',
            () => railPages({ rail: [FOCUS], arrangements: 'focus' }),
            []
        ],
        [
            'pages of arrangements that are null',
            () => railPages({ rail: [FOCUS], arrangements: null }),
            []
        ],
        [
            'pages of an arrangement that is null',
            () => railPages({ rail: [FOCUS], arrangements: { focus: null } }),
            [{ label: 'Focus', glyph: 'compass', page: 'focus', node: null }]
        ],
        [
            'pages of an arrangement that is a number',
            () => railPages({ rail: [FOCUS], arrangements: { focus: 3 } }),
            [{ label: 'Focus', glyph: 'compass', page: 'focus', node: 3 }]
        ],
        [
            'pages of an arrangement that is a string',
            () => railPages({ rail: [FOCUS], arrangements: { focus: 'x' } }),
            [{ label: 'Focus', glyph: 'compass', page: 'focus', node: 'x' }]
        ],
        [
            'pages of an arrangement that is an empty list',
            () => railPages({ rail: [FOCUS], arrangements: { focus: [] } }),
            [{ label: 'Focus', glyph: 'compass', page: 'focus', node: [] }]
        ],
        [
            'pages of rows that are not maps',
            () =>
                railPages({
                    rail: [3, null, 'x', [], FOCUS],
                    arrangements: { focus: { root: { kind: 'pane', view: 'focus' } } }
                }),
            [
                {
                    label: 'Focus',
                    glyph: 'compass',
                    page: 'focus',
                    node: { root: { kind: 'pane', view: 'focus' } }
                }
            ]
        ],
        [
            'pages of rows with a field that is not a string',
            () =>
                railPages({
                    rail: [
                        { ...FOCUS, label: 3 },
                        { ...FOCUS, glyph: 3 },
                        { ...FOCUS, page: 3 }
                    ],
                    arrangements: { focus: { root: { kind: 'pane', view: 'focus' } } }
                }),
            []
        ],
        [
            'pages of rows with a blank label',
            () =>
                railPages({
                    rail: [{ ...FOCUS, label: '  ' }],
                    arrangements: { focus: { root: { kind: 'pane', view: 'focus' } } }
                }),
            []
        ],
        [
            'pages of a row with fields it does not read',
            () =>
                railPages({
                    rail: [{ ...FOCUS, extra: 1 }],
                    arrangements: { focus: { root: { kind: 'pane', view: 'focus' } } }
                }),
            [
                {
                    label: 'Focus',
                    glyph: 'compass',
                    page: 'focus',
                    node: { root: { kind: 'pane', view: 'focus' } }
                }
            ]
        ],
        [
            'the keys of a page',
            () =>
                Object.keys(
                    railPages({
                        rail: [FOCUS],
                        arrangements: { focus: { root: { kind: 'pane', view: 'focus' } } }
                    })[0]
                ),
            ['label', 'glyph', 'page', 'node']
        ],
        [
            'pages with a glyph map that is a list',
            () =>
                railPages({
                    rail: [{ ...FOCUS, glyph: 'nonesuch' }],
                    arrangements: { focus: { root: { kind: 'pane', view: 'focus' } } },
                    glyphs: ['compass']
                }),
            [
                {
                    label: 'Focus',
                    glyph: 'nonesuch',
                    page: 'focus',
                    node: { root: { kind: 'pane', view: 'focus' } }
                }
            ]
        ],
        [
            'pages with a glyph map that is a string',
            () =>
                railPages({
                    rail: [{ ...FOCUS, glyph: 'nonesuch' }],
                    arrangements: { focus: { root: { kind: 'pane', view: 'focus' } } },
                    glyphs: 'compass'
                }),
            [
                {
                    label: 'Focus',
                    glyph: 'nonesuch',
                    page: 'focus',
                    node: { root: { kind: 'pane', view: 'focus' } }
                }
            ]
        ],
        [
            'pages with a glyph map',
            () =>
                railPages({
                    rail: [{ ...FOCUS, glyph: 'nonesuch' }],
                    arrangements: { focus: { root: { kind: 'pane', view: 'focus' } } },
                    glyphs: { compass: 'C' }
                }),
            []
        ],
        [
            'pages of arrangements with an own __proto__ key',
            () =>
                railPages({
                    rail: [{ label: 'P', glyph: 'compass', page: '__proto__' }, FOCUS],
                    arrangements: JSON.parse(
                        '{"__proto__":{"root":{"kind":"pane","view":"p"}},"focus":{"root":{"kind":"pane","view":"focus"}}}'
                    )
                }),
            [
                {
                    label: 'P',
                    glyph: 'compass',
                    page: '__proto__',
                    node: { root: { kind: 'pane', view: 'p' } }
                },
                {
                    label: 'Focus',
                    glyph: 'compass',
                    page: 'focus',
                    node: { root: { kind: 'pane', view: 'focus' } }
                }
            ]
        ],
        [
            'pages of a rail row naming a name of the object prototype',
            () =>
                railPages({
                    rail: [{ label: 'T', glyph: 'compass', page: 'toString' }],
                    arrangements: { focus: { root: { kind: 'pane', view: 'focus' } } }
                }),
            []
        ],
        ['the draft of an array', () => railDraft([]), null],
        ['the draft of a string', () => railDraft('rail'), null],
        ['the draft of a number', () => railDraft(3), null],
        ['the draft of undefined', () => railDraft(undefined), null],
        ['the draft of a rail that is a string', () => railDraft({ rail: 'x' }), null],
        ['the draft of a rail that is a map', () => railDraft({ rail: FOCUS }), null],
        ['the draft of a rail that is null', () => railDraft({ rail: null }), null],
        ['the draft of an empty rail', () => railDraft({ rail: [] }), []],
        [
            'the draft of rows of the wrong type',
            () =>
                railDraft({
                    rail: [
                        3,
                        null,
                        'x',
                        [],
                        { label: 'a', glyph: 3, page: null },
                        { ...FOCUS, extra: 1 }
                    ]
                }),
            [
                { label: '', glyph: '', page: '' },
                { label: '', glyph: '', page: '' },
                { label: '', glyph: '', page: '' },
                { label: '', glyph: '', page: '' },
                { label: 'a', glyph: '', page: '' },
                { label: 'Focus', glyph: 'compass', page: 'focus' }
            ]
        ],
        [
            'the draft of a rail',
            () => railDraft({ rail: [FOCUS, VIEWS] }),
            [
                { label: 'Focus', glyph: 'compass', page: 'focus' },
                { label: 'Views', glyph: 'sliders', page: 'views' }
            ]
        ],
        [
            'the draft of a state with an own __proto__ key',
            () => railDraft(JSON.parse('{"__proto__":{"rail":[]},"b":1}')),
            null
        ],
        [
            'a draft set on an array',
            () => withRailDraft([], [FOCUS]),
            { rail: [{ label: 'Focus', glyph: 'compass', page: 'focus' }] }
        ],
        [
            'a draft set on null',
            () => withRailDraft(null, [FOCUS]),
            { rail: [{ label: 'Focus', glyph: 'compass', page: 'focus' }] }
        ],
        [
            'a draft set on a string',
            () => withRailDraft('x', [FOCUS]),
            { rail: [{ label: 'Focus', glyph: 'compass', page: 'focus' }] }
        ],
        ['a draft taken from an array', () => withRailDraft([], null), {}],
        ['a draft taken from null', () => withRailDraft(null, null), {}],
        [
            'a draft set beside other keys',
            () => Object.keys(withRailDraft({ z: 1, a: 2 }, [FOCUS])),
            ['z', 'a', 'rail']
        ],
        [
            'a draft set where one is held',
            () => Object.keys(withRailDraft({ z: 1, rail: [], a: 2 }, [FOCUS])),
            ['z', 'rail', 'a']
        ],
        [
            'a draft taken from where one is held',
            () => Object.keys(withRailDraft({ z: 1, rail: [], a: 2 }, null)),
            ['z', 'a']
        ],
        [
            'a draft set on a state with an own __proto__ key',
            () => Object.keys(withRailDraft(JSON.parse('{"__proto__":1,"b":2}'), [FOCUS])),
            ['__proto__', 'b', 'rail']
        ],
        [
            'unsaved text in a tab state that is a list',
            () => railTyped(SETTINGS_VIEW, [], [FOCUS]),
            false
        ],
        [
            'unsaved text in a tab with a draft that is not a list',
            () => railTyped(SETTINGS_VIEW, { rail: 'x' }, [FOCUS]),
            false
        ],
        [
            'unsaved text in a tab with an empty draft',
            () => railTyped(SETTINGS_VIEW, { rail: [] }, [FOCUS]),
            true
        ],
        [
            'unsaved text in a tab with a draft of rows of the wrong type',
            () => railTyped(SETTINGS_VIEW, { rail: [3] }, [FOCUS]),
            true
        ],
        [
            'unsaved text in a tab of no view',
            () => railTyped(undefined, { rail: [VIEWS] }, [FOCUS]),
            false
        ],
        ['the config rail of a config with nothing', () => configRail({}), []],
        ['the config rail of a rail that is a string', () => configRail({ rail: 'x' }), []],
        ['the config rail of a rail that is a map', () => configRail({ rail: FOCUS }), []],
        ['the config rail of a rail that is null', () => configRail({ rail: null }), []],
        [
            'the config rail of rows of the wrong type',
            () => configRail({ rail: [3, null, [], { label: 3, glyph: 'g', page: [] }, FOCUS] }),
            [
                { label: '', glyph: '', page: '' },
                { label: '', glyph: '', page: '' },
                { label: '', glyph: '', page: '' },
                { label: '', glyph: 'g', page: '' },
                { label: 'Focus', glyph: 'compass', page: 'focus' }
            ]
        ]
    ];

    it.each(rows)('%s', (_name, run, expected) => {
        expect(run()).toStrictEqual(expected);
    });
});

describe('what the rail readers hand on', () => {
    it('hands the arrangement of a page on as the very object the config holds', () => {
        const node = { root: { kind: 'pane', view: 'focus' } };
        const [made] = railPages({ arrangements: { focus: node }, rail: [FOCUS] });
        expect(made.node).toBe(node);
    });

    it('sets and takes a draft on a new map, leaving the state it was given as it was', () => {
        const state = { keep: true, rail: [] };
        expect(withRailDraft(state, [FOCUS])).not.toBe(state);
        expect(withRailDraft(state, null)).not.toBe(state);
        expect(state).toStrictEqual({ keep: true, rail: [] });
    });
});
