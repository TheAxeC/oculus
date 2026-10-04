// Layer 2, client-state tests. The rail's list of pages as the page hands it to the shell, the
// shipped list's findings, and the list a Settings tab is editing before it is saved. The rule over
// the list itself is tests/data/sources/config/rail.test.ts.
//
// Nothing here renders; every case is over a pure function.

import { describe, expect, it } from 'vitest';
import { railFindings } from '../../../../src/lib/data/sources/config/rail.ts';
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

const { config } = loadConfig(engineDir());
const catalog = textCatalog(config);

const FOCUS = { label: 'Focus', glyph: 'compass', page: 'focus' };
const VIEWS = { label: 'Views', glyph: 'sliders', page: 'views' };

describe('the findings of the shipped rail list', () => {
    const FILE = '/engine/config/layout.yml';

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
});

describe('the rail list a Settings tab is editing', () => {
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
});

describe('the rail readers over a config and a tab state of the wrong type', () => {
    const rows: [string, () => unknown, unknown][] = [
        ['pages of a config with nothing', () => railPages({}), []],
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
            'pages of an arrangement that is null',
            () => railPages({ rail: [FOCUS], arrangements: { focus: null } }),
            [{ label: 'Focus', glyph: 'compass', page: 'focus', node: null }]
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
        ['the draft of undefined', () => railDraft(undefined), null],
        ['the draft of a rail that is a string', () => railDraft({ rail: 'x' }), null],
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
        ['a draft taken from an array', () => withRailDraft([], null), {}],
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
            'unsaved text in a tab of no view',
            () => railTyped(undefined, { rail: [VIEWS] }, [FOCUS]),
            false
        ],
        ['the config rail of a config with nothing', () => configRail({}), []],
        ['the config rail of a rail that is a string', () => configRail({ rail: 'x' }), []],
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
