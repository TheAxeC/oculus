// The view catalogue's fold: what arrange() puts under which `nav_groups` heading, the key order a
// chord counts into and the key drawn beside an entry, the readers of the three layout.yml keys it
// is built from, and the catalogue over the application's own registry and config.
//
// The catalog and glyphs are the real config. The registrations are this file's own, except in the
// last block, which reads the application's.

import { beforeEach, describe, expect, it } from 'vitest';
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
import { registerAll, registerCollections } from '../../../../src/routes/views.ts';
import { createClientState, type ClientState } from '../../../fixtures/client.ts';
import { COLLECTIONS, catalog, config, doc, probe } from '../../../shell/rail/rail-fixture.ts';

let client: ClientState;

let views: ClientState['registry']['views'];

beforeEach(() => {
    client = createClientState();
    ({ views } = client.registry);
    registerAll(client.registry);
    registerCollections(client.registry, COLLECTIONS);
});

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

    it("carries the group's glyph when it has one, and leaves it off when it has none", () => {
        const found = arrange(
            [probe('a', 'iconed'), probe('b', 'bare')],
            [
                { id: 'iconed', label: 'Iconed', glyph: 'chat' },
                { id: 'bare', label: 'Bare' }
            ]
        );
        expect(found[0].glyph).toBe('chat');
        expect(found[1].glyph).toBe(undefined);
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

describe('the readers of layout.yml', () => {
    it('reads nav_groups in order, dropping a group with no label and a chord that is no letter', () => {
        expect(
            readGroups({
                one: { label: 'One', glyph: 'chat', chord: 'o' },
                two: { label: 'Two', chord: 'TWO' },
                bad: { glyph: 'chat' },
                worse: 'no'
            })
        ).toEqual([
            { id: 'one', label: 'One', glyph: 'chat', chord: 'o' },
            { id: 'two', label: 'Two' }
        ]);
        expect(readGroups(['one'])).toEqual([]);
        expect(readGroups(undefined)).toEqual([]);
    });

    it('reads the direct chord as one lowercase letter or nothing', () => {
        expect(readChord('v')).toBe('v');
        expect(readChord('V')).toBe(undefined);
        expect(readChord('vv')).toBe(undefined);
        expect(readChord('')).toBe(undefined);
        expect(readChord(3)).toBe(undefined);
    });

    it('reads docs as three non-empty strings each, dropping any other entry', () => {
        expect(
            readDocs([
                { label: 'One', path: 'ONE.md', group: 'g' },
                { label: 'Two', path: '', group: 'g' },
                { label: '', path: 'X.md', group: 'g' },
                { label: 'Three', path: 'T.md' },
                'four'
            ])
        ).toEqual([{ label: 'One', path: 'ONE.md', group: 'g' }]);
        expect(readDocs({})).toEqual([]);
    });
});

describe('the catalogue of the real config', () => {
    let sections: ReturnType<typeof arrange>;

    const groups = readGroups(config.nav_groups);
    const docs: DocEntry[] = readDocs(config.docs);

    beforeEach(() => {
        sections = arrange(
            views().filter((view) => view.listed !== false),
            groups,
            docs
        );
    });

    it('lists the manual, the photo wall and the three hub documents under Help, apart from System', () => {
        const system = sections.find((found) => found.label === 'System');
        expect(system?.items.map((view) => view.id)).toEqual([
            'status',
            'findings',
            'audit',
            'history',
            'config',
            'gallery'
        ]);
        expect(system?.docs).toEqual([]);
        const help = sections.find((found) => found.label === 'Help');
        expect(help?.items.map((view) => view.id)).toEqual(['help', 'memories']);
        expect(help?.docs.map((entry) => entry.path)).toEqual([
            'docs/RESEARCH-APPROACH.md',
            'docs/AGENT-APPROACH.md',
            'docs/HPC-UTwente-howto.md'
        ]);
    });

    it('leaves no view out of a group, the collections of sources.yml included', () => {
        const rest = sections.find((found) => found.label === null)?.items ?? [];
        expect(COLLECTIONS.length).toBeGreaterThan(0);
        expect(rest.map((view) => view.id)).toEqual([]);
    });

    it('lists one group per rail page, in rail order, labelled with its button, and Help after System', () => {
        const rail = config.rail as { label: string; page: string }[];
        const at = rail.findIndex((entry) => entry.page === 'info') + 1;
        const withHelp = <T>(list: T[], help: T): T[] => [
            ...list.slice(0, at),
            help,
            ...list.slice(at)
        ];
        expect(groups.map((group) => group.id)).toEqual(
            withHelp(
                rail.map((entry) => entry.page),
                'help'
            )
        );
        expect(groups.map((group) => group.label)).toEqual(
            withHelp(
                rail.map((entry) => entry.label),
                'Help'
            )
        );
        expect(sections.map((section) => section.label)).toEqual(
            withHelp(
                rail.map((entry) => entry.label),
                'Help'
            )
        );
    });

    it('gives every group a letter and a glyph, and one letter to one list', () => {
        expect(
            sections
                .filter(isChorded)
                .map((one) => `${one.label ?? ''}:${one.chord ?? ''}:${one.glyph ?? ''}`)
        ).toEqual([
            'Focus:f:focus',
            'Sessions:m:live',
            'Projects:p:paper',
            'Incoming:e:email',
            'Explorer:s:folder',
            'Academic Life:c:scout',
            'Pillars:l:book',
            'References:r:venue_dist',
            'Present:t:conference',
            'System:y:info',
            'Help:h:page',
            'Views and Settings:w:settings'
        ]);
    });

    it('counts the real keys: every page under its own letter, the direct chord counting none', () => {
        const order = railOrder(
            views().filter((view) => view.listed !== false),
            groups,
            readChord(config.direct_chord),
            docs
        );
        // Every listed view sits on a page, so nothing is left to the direct chord, which is
        // therefore bound to no list at all.
        expect(order.direct).toEqual([]);
        expect(order.chords).toEqual({
            f: ['focus', 'hpc', 'usage'],
            m: [
                'session-list',
                'terminal',
                'transcript',
                'timeline',
                'session-detail',
                'changes',
                'agents'
            ],
            p: ['projects', 'coauthor', 'archive'],
            e: ['inbox', 'radar', 'leads', 'linkedin', 'calendar'],
            s: ['files', 'repositories', 'search'],
            c: ['funding', 'events', 'education', 'applications', 'joint-work', 'tasks'],
            l: ['pillars', 'domains', 'map'],
            r: ['venues', 'data', 'code', 'statements'],
            t: ['present'],
            y: ['status', 'findings', 'audit', 'history', 'config', 'gallery'],
            h: [
                'help',
                'memories',
                'doc:docs/RESEARCH-APPROACH.md',
                'doc:docs/AGENT-APPROACH.md',
                'doc:docs/HPC-UTwente-howto.md'
            ],
            w: ['catalogue', 'settings', 'account-setup', 'pages']
        });
        expect(keyOf(order, 'calendar')).toBe('e5');
        expect(keyOf(order, 'account-setup')).toBe('w3');
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

    it("finds a view anywhere in an arrangement, alone or among a pane's tabs", () => {
        expect(nodeHolds(views, 'catalogue')).toBe(true);
        expect(nodeHolds(views, 'pages')).toBe(true);
        expect(nodeHolds(views, 'focus')).toBe(false);
        expect(nodeHolds('not a node', 'catalogue')).toBe(false);
    });

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
