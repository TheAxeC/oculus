// Layer 2, client-state tests. The view catalogue's fold: what arrange() puts under which
// `nav_groups` heading, the key order a chord counts into and the key drawn beside an entry, and
// the readers of the three layout.yml keys it is built from.
//
// The catalog and glyphs are the real config. The registrations are this file's own.

import { describe, expect, it } from 'vitest';
import {
    arrange,
    type DocEntry,
    docState,
    followDoc,
    groupGlyph,
    isChorded,
    keyOf,
    type NavGroup,
    nodeHolds,
    onCataloguePage,
    railOrder,
    readChord,
    readDocs,
    readGroups,
    listedViews
} from '../../../../src/lib/state/workbench/navigation/catalogue.ts';
import { catalog, doc, probe } from '../../../shell/rail/rail-fixture.ts';

describe('arrange', () => {
    it("puts a group's views in the group's own key order, and the rest at the end", () => {
        const found = arrange(
            [probe('c'), probe('a', 'two', 1), probe('b', 'two', 0)],
            [{ id: 'two', label: 'Two' }]
        );
        expect(found.map((section) => section.label)).toEqual(['Two', null]);
        expect(found[0].items.map((view) => view.id)).toEqual(['b', 'a']);
        expect(found[1].items.map((view) => view.id)).toEqual(['c']);
    });

    it('resolves equal orders by view id', () => {
        const found = arrange(
            [probe('charlie', 'one', 2), probe('alpha', 'one', 2), probe('bravo', 'one', 2)],
            [{ id: 'one', label: 'One' }]
        );
        expect(found[0].items.map((view) => view.id)).toEqual(['alpha', 'bravo', 'charlie']);
    });

    it('lists no group for keys no registration answers', () => {
        expect(arrange([probe('a')], [{ id: 'none', label: 'None' }])).toEqual([
            { label: null, items: [probe('a')], docs: [] }
        ]);
    });

    it("puts a group's documents after its views, in the order the config lists them", () => {
        const found = arrange(
            [probe('b', 'one', 1), probe('a', 'one', 0)],
            [{ id: 'one', label: 'One' }],
            [doc('SECOND.md', 'one'), doc('FIRST.md', 'one')]
        );
        expect(found).toHaveLength(1);
        expect(found[0].items.map((view) => view.id)).toEqual(['a', 'b']);
        expect(found[0].docs.map((entry) => entry.path)).toEqual(['SECOND.md', 'FIRST.md']);
        expect(found[0].items.length + found[0].docs.length).toBe(4);
    });

    it('lists a group whose documents are all it has', () => {
        const found = arrange([], [{ id: 'one', label: 'One' }], [doc('ONE.md', 'one')]);
        expect(found.map((section) => section.label)).toEqual(['One']);
        expect(found[0].items).toEqual([]);
        expect(found[0].docs.map((entry) => entry.path)).toEqual(['ONE.md']);
    });

    it('trails a document whose group nothing configures, with the ungrouped views', () => {
        const found = arrange([probe('a')], [{ id: 'one', label: 'One' }], [doc('ONE.md', 'gone')]);
        expect(found.map((section) => section.label)).toEqual([null]);
        expect(found[0].docs.map((entry) => entry.path)).toEqual(['ONE.md']);
    });

    it('puts a group that names a letter under its own chord whatever its size', () => {
        const views = [probe('a', 'one', 0), probe('b', 'two', 0), probe('c', 'two', 1)];
        const groups: NavGroup[] = [
            { id: 'one', label: 'One', chord: 'o' },
            { id: 'two', label: 'Two' }
        ];
        const [lettered, bare] = arrange(views, groups, [doc('ONE.md', 'one')]);
        expect(isChorded(lettered)).toBe(true);
        expect(isChorded(bare)).toBe(false);
        // The one-view group is reached by its own letter, and the group naming none by the
        // direct chord, so no small group's entries swell the direct count.
        expect(railOrder(views, groups, 'v', [doc('ONE.md', 'one')]).chords).toEqual({
            v: ['b', 'c'],
            o: ['a', 'doc:ONE.md']
        });
    });
});

describe('railOrder and keyOf', () => {
    const registrations = [
        probe('a', 'direct', 1),
        probe('b', 'direct', 0),
        ...['c', 'd', 'e', 'f', 'g'].map((id, order) => probe(id, 'chorded', order))
    ];
    const groups: NavGroup[] = [
        { id: 'direct', label: 'Direct' },
        { id: 'chorded', label: 'Chorded', chord: 'c' }
    ];

    it('exposes the direct views and the chords of the groups that configure one', () => {
        expect(railOrder(registrations, groups)).toEqual({
            direct: ['b', 'a'],
            chords: { c: ['c', 'd', 'e', 'f', 'g'] }
        });
    });

    it('puts the direct views under the configured letter, which a group of its own keeps', () => {
        expect(railOrder(registrations, groups, 'v').chords).toEqual({
            v: ['b', 'a'],
            c: ['c', 'd', 'e', 'f', 'g']
        });
        expect(railOrder(registrations, groups, 'c').chords).toEqual({
            c: ['c', 'd', 'e', 'f', 'g']
        });
        expect(railOrder([], groups, 'v').chords).toEqual({});
    });

    it('names the letter and the place an entry is reached by, and nothing past the ninth', () => {
        const long = 'abcdefghij'.split('').map((id, order) => probe(id, 'many', order));
        const order = railOrder(long, [{ id: 'many', label: 'Many', chord: 'm' }], 'v');
        expect(keyOf(order, 'a')).toBe('m1');
        expect(keyOf(order, 'i')).toBe('m9');
        expect(keyOf(order, 'j')).toBe('');
        expect(keyOf(order, 'missing')).toBe('');
        expect(keyOf(railOrder(registrations, groups, 'v'), 'a')).toBe('v2');
    });

    it("gives a group's heading its own glyph, its first view's, or the document glyph", () => {
        const [own, borrowed, papers] = arrange(
            [probe('a', 'iconed'), probe('b', 'bare')],
            [
                { id: 'iconed', label: 'Iconed', glyph: 'chat' },
                { id: 'bare', label: 'Bare' },
                { id: 'papers', label: 'Papers' }
            ],
            [doc('ONE.md', 'papers')]
        );
        expect(groupGlyph(own)).toBe('chat');
        expect(groupGlyph(borrowed)).toBe(catalog['views.status_glyph']);
        expect(groupGlyph(papers)).toBe(catalog['views.doc_glyph']);
    });

    it('opens a document as a tab of its own per path, so two documents are two tabs', () => {
        expect(docState(doc('ONE.md', 'one')).id).toBe('ONE.md');
        expect(docState(doc('TWO.md', 'one')).id).toBe('TWO.md');
    });
});

describe('the page a catalogue press opens on', () => {
    const views = {
        kind: 'split',
        dir: 'row',
        sizes: [0.5, 0.5],
        children: [
            { kind: 'pane', view: 'catalogue' },
            { kind: 'pane', view: ['settings', 'pages'] }
        ]
    };
    // As layout.yml writes an arrangement: its tree under `root`.
    const pages = [
        { page: 'focus', node: { root: { kind: 'pane', view: 'focus' } } },
        { page: 'views', node: { root: views } }
    ];

    it('names only the rail page whose arrangement holds the catalogue as its own page', () => {
        expect(onCataloguePage('views', pages, 'catalogue')).toBe(true);
        expect(onCataloguePage('focus', pages, 'catalogue')).toBe(false);
        expect(onCataloguePage(undefined, pages, 'catalogue')).toBe(false);
    });
});

describe('the views the catalogue lists', () => {
    it('are every registration that does not say it is unlisted', () => {
        const views = [
            { id: 'a' },
            { id: 'b', listed: false },
            { id: 'c', listed: true }
        ] as unknown as Parameters<typeof listedViews>[0];
        expect(listedViews(views).map((one) => one.id)).toEqual(['a', 'c']);
    });
});

describe('the entry a saved document tab shows', () => {
    const HELD: DocEntry = {
        label: 'Research approach',
        path: 'RESEARCH-APPROACH.md',
        group: 'personal'
    };
    const MOVED: DocEntry = { ...HELD, path: 'docs/RESEARCH-APPROACH.md' };

    it('keeps the path it holds when the list still names it, whatever the label', () => {
        const other: DocEntry = { label: 'Other', path: 'docs/OTHER.md', group: 'personal' };
        const found = followDoc([other, { ...HELD, label: 'Other' }], HELD.path, 'Other');
        expect(found).toEqual({ entry: { ...HELD, label: 'Other' }, moved: false });
    });

    it('follows only a label exactly one entry carries, and never an empty one', () => {
        const twice = [MOVED, { ...MOVED, path: 'docs/COPY.md' }];
        expect(followDoc(twice, HELD.path, HELD.label)).toEqual({ entry: null, moved: false });
        expect(followDoc([MOVED], HELD.path, HELD.label)).toEqual({ entry: MOVED, moved: true });
        const unnamed = { ...MOVED, label: '' };
        expect(followDoc([unnamed], HELD.path, '')).toEqual({ entry: null, moved: false });
    });
});

describe('the readers of layout.yml over values of the wrong type', () => {
    const rows: [string, () => unknown, unknown][] = [
        ['groups of an array', () => readGroups([]), []],
        ['groups of null', () => readGroups(null), []],
        ['groups holding null', () => readGroups({ a: null }), []],
        ['a group with no label', () => readGroups({ a: { glyph: 'g', chord: 'a' } }), []],
        [
            'a group with an empty label',
            () => readGroups({ a: { label: '' } }),
            [{ id: 'a', label: '' }]
        ],
        [
            'a group with a glyph that is a number',
            () => readGroups({ a: { label: 'A', glyph: 3 } }),
            [{ id: 'a', label: 'A' }]
        ],
        [
            'a group with an empty glyph',
            () => readGroups({ a: { label: 'A', glyph: '' } }),
            [{ id: 'a', label: 'A', glyph: '' }]
        ],
        [
            'a group with a chord that is a capital',
            () => readGroups({ a: { label: 'A', chord: 'A' } }),
            [{ id: 'a', label: 'A' }]
        ],
        [
            'a group with a chord of one letter',
            () => readGroups({ a: { label: 'A', chord: 'q' } }),
            [{ id: 'a', label: 'A', chord: 'q' }]
        ],
        [
            'the keys of a group',
            () => Object.keys(readGroups({ a: { chord: 'a', glyph: 'g', label: 'A' } })[0]),
            ['id', 'label', 'glyph', 'chord']
        ],
        [
            'groups in the order the map holds them',
            () => readGroups({ b: { label: 'B' }, a: { label: 'A' } }),
            [
                { id: 'b', label: 'B' },
                { id: 'a', label: 'A' }
            ]
        ],
        [
            'groups of a map with an own __proto__ key',
            () => readGroups(JSON.parse('{"__proto__":{"label":"P"},"a":{"label":"A"}}')),
            [
                { id: '__proto__', label: 'P' },
                { id: 'a', label: 'A' }
            ]
        ],
        ['a chord that is a letter', () => readChord('a'), 'a'],
        ['a chord that is a capital', () => readChord('A'), undefined],
        ['a chord that is a number', () => readChord(3), undefined],
        ['a chord that is a letter and a newline', () => readChord('a\n'), undefined],
        ['docs of a map', () => readDocs({}), []],
        ['docs holding things that are not maps', () => readDocs([null, 3, 'x', []]), []],
        ['a doc with no label', () => readDocs([{ path: 'p', group: 'g' }]), []],
        ['a doc with an empty path', () => readDocs([{ label: 'l', path: '', group: 'g' }]), []],
        ['a doc with an empty group', () => readDocs([{ label: 'l', path: 'p', group: '' }]), []],
        [
            'the keys of a doc',
            () => Object.keys(readDocs([{ group: 'g', path: 'p', label: 'l' }])[0]),
            ['label', 'path', 'group']
        ],
        [
            'docs with a bad doc between two good ones',
            () =>
                readDocs([
                    { label: 'a', path: 'a', group: 'g' },
                    { label: 3 },
                    { label: 'b', path: 'b', group: 'g' }
                ]),
            [
                { label: 'a', path: 'a', group: 'g' },
                { label: 'b', path: 'b', group: 'g' }
            ]
        ],
        [
            'docs with an own __proto__ key',
            () => readDocs([JSON.parse('{"__proto__":1,"label":"l","path":"p","group":"g"}')]),
            [{ label: 'l', path: 'p', group: 'g' }]
        ],
        ['a node that is an array', () => nodeHolds([], 'v'), false],
        ['a node that is null', () => nodeHolds(null, 'v'), false],
        ['a node with no kind', () => nodeHolds({ view: 'v' }, 'v'), false],
        ['a pane naming the view', () => nodeHolds({ kind: 'pane', view: 'v' }, 'v'), true],
        ['a pane naming another view', () => nodeHolds({ kind: 'pane', view: 'w' }, 'v'), false],
        [
            'a pane naming the view in a list',
            () => nodeHolds({ kind: 'pane', view: ['w', 'v'] }, 'v'),
            true
        ],
        [
            'a pane whose view is a list holding a map',
            () => nodeHolds({ kind: 'pane', view: [{ view: 'v' }] }, 'v'),
            false
        ],
        ['a pane with no view', () => nodeHolds({ kind: 'pane' }, 'v'), false],
        [
            'a node of a kind that is not a pane holding the view',
            () => nodeHolds({ kind: 'box', view: 'v' }, 'v'),
            false
        ],
        [
            'a split holding the view',
            () =>
                nodeHolds(
                    {
                        kind: 'split',
                        children: [
                            { kind: 'pane', view: 'w' },
                            { kind: 'pane', view: 'v' }
                        ]
                    },
                    'v'
                ),
            true
        ],
        [
            'a split whose children are a string',
            () => nodeHolds({ kind: 'split', children: 'v' }, 'v'),
            false
        ],
        [
            'a split whose children hold null',
            () =>
                nodeHolds({ kind: 'split', children: [null, 3, { kind: 'pane', view: 'v' }] }, 'v'),
            true
        ],
        [
            'a node with children and no kind',
            () => nodeHolds({ children: [{ kind: 'pane', view: 'v' }] }, 'v'),
            true
        ],
        [
            'a root that is a pane',
            () => nodeHolds({ root: { kind: 'pane', view: 'v' } }, 'v'),
            true
        ],
        ['a root that is null', () => nodeHolds({ root: null }, 'v'), false],
        [
            'a root beside a pane',
            () => nodeHolds({ root: { kind: 'pane', view: 'w' }, kind: 'pane', view: 'v' }, 'v'),
            false
        ],
        [
            'a root that is undefined beside a pane',
            () => nodeHolds({ root: undefined, kind: 'pane', view: 'v' }, 'v'),
            true
        ],
        [
            'a root inside a root',
            () => nodeHolds({ root: { root: { kind: 'pane', view: 'v' } } }, 'v'),
            true
        ],
        [
            'a page that is not a rail page',
            () =>
                onCataloguePage(
                    'x',
                    [{ page: 'a', node: { root: { kind: 'pane', view: 'v' } } }],
                    'v'
                ),
            false
        ],
        [
            'a rail page whose node holds the view',
            () =>
                onCataloguePage(
                    'a',
                    [{ page: 'a', node: { root: { kind: 'pane', view: 'v' } } }],
                    'v'
                ),
            true
        ],
        [
            'no rail page',
            () =>
                onCataloguePage(undefined, [{ page: 'a', node: { kind: 'pane', view: 'v' } }], 'v'),
            false
        ]
    ];

    it.each(rows)('%s', (_name, run, expected) => {
        expect(run()).toStrictEqual(expected);
    });
});
