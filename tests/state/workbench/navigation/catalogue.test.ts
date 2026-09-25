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
    GROUP_MAX,
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
    sectionSize,
    listedViews
} from '../../../../src/lib/state/workbench/navigation/catalogue.ts';
import type { Registration } from '../../../../src/lib/state/workbench/navigation/registry.ts';
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
        // revert: src/lib/state/workbench/navigation/catalogue.ts:92 => (left, right) => left.id.localeCompare(right.id)
        const found = arrange(
            [probe('c'), probe('a', 'two', 1), probe('b', 'two', 0)],
            [{ id: 'two', label: 'Two' }]
        );
        expect(found.map((section) => section.label)).toEqual(['Two', null]);
        expect(found[0].items.map((view) => view.id)).toEqual(['b', 'a']);
        expect(found[1].items.map((view) => view.id)).toEqual(['c']);
    });

    it('resolves equal orders by view id', () => {
        // revert: src/lib/state/workbench/navigation/catalogue.ts:92 => (left, right) => left.order - right.order
        const found = arrange(
            [probe('charlie', 'one', 2), probe('alpha', 'one', 2), probe('bravo', 'one', 2)],
            [{ id: 'one', label: 'One' }]
        );
        expect(found[0].items.map((view) => view.id)).toEqual(['alpha', 'bravo', 'charlie']);
    });

    it('lists no group for keys no registration answers', () => {
        // revert: src/lib/state/workbench/navigation/catalogue.ts:98 => delete
        expect(arrange([probe('a')], [{ id: 'none', label: 'None' }])).toEqual([
            { label: null, items: [probe('a')], docs: [] }
        ]);
    });

    it("puts a group's documents after its views, in the order the config lists them", () => {
        // revert: src/lib/state/workbench/navigation/catalogue.ts:97 => const inside = docs.filter((entry) => entry.group === group.id).reverse();
        const found = arrange(
            [probe('b', 'one', 1), probe('a', 'one', 0)],
            [{ id: 'one', label: 'One' }],
            [doc('SECOND.md', 'one'), doc('FIRST.md', 'one')]
        );
        expect(found).toHaveLength(1);
        expect(found[0].items.map((view) => view.id)).toEqual(['a', 'b']);
        expect(found[0].docs.map((entry) => entry.path)).toEqual(['SECOND.md', 'FIRST.md']);
        expect(sectionSize(found[0])).toBe(4);
    });

    it('lists a group whose documents are all it has', () => {
        // revert: src/lib/state/workbench/navigation/catalogue.ts:98 => if (items.length === 0) continue;
        const found = arrange([], [{ id: 'one', label: 'One' }], [doc('ONE.md', 'one')]);
        expect(found.map((section) => section.label)).toEqual(['One']);
        expect(found[0].items).toEqual([]);
        expect(found[0].docs.map((entry) => entry.path)).toEqual(['ONE.md']);
    });

    it('trails a document whose group nothing configures, with the ungrouped views', () => {
        // revert: src/lib/state/workbench/navigation/catalogue.ts:105 => const loose: DocEntry[] = [];
        const found = arrange([probe('a')], [{ id: 'one', label: 'One' }], [doc('ONE.md', 'gone')]);
        expect(found.map((section) => section.label)).toEqual([null]);
        expect(found[0].docs.map((entry) => entry.path)).toEqual(['ONE.md']);
    });

    it('counts a document towards the size that puts a group under a chord of its own', () => {
        // revert: src/lib/state/workbench/navigation/catalogue.ts:60 => return section.items.length;
        const views = [probe('a', 'one', 0), probe('b', 'one', 1), probe('c', 'one', 2)];
        const small = arrange(views, [{ id: 'one', label: 'One' }], [doc('ONE.md', 'one')]);
        expect(isChorded(small[0])).toBe(false);
        const large = arrange(
            views,
            [{ id: 'one', label: 'One' }],
            [doc('ONE.md', 'one'), doc('TWO.md', 'one')]
        );
        expect(sectionSize(large[0])).toBe(GROUP_MAX + 1);
        expect(isChorded(large[0])).toBe(true);
    });

    it("carries the group's glyph when it has one, and leaves it off when it has none", () => {
        // revert: src/lib/state/workbench/navigation/catalogue.ts:100 => delete
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
        // revert: src/lib/state/workbench/navigation/catalogue.ts:128 => .filter(() => true)
        expect(railOrder(registrations, groups)).toEqual({
            direct: ['b', 'a'],
            chords: { c: ['c', 'd', 'e', 'f', 'g'] }
        });
    });

    it('puts the direct views under the configured letter, which a group of its own keeps', () => {
        // revert: src/lib/state/workbench/navigation/catalogue.ts:131 => if (directChord !== undefined) {
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
        // revert: src/lib/state/workbench/navigation/catalogue.ts:155 => if (at >= 0) return `${letter}${at + 1}`;
        const long = 'abcdefghij'.split('').map((id, order) => probe(id, 'many', order));
        const order = railOrder(long, [{ id: 'many', label: 'Many', chord: 'm' }], 'v');
        expect(keyOf(order, 'a')).toBe('m1');
        expect(keyOf(order, 'i')).toBe('m9');
        expect(keyOf(order, 'j')).toBe('');
        expect(keyOf(order, 'missing')).toBe('');
        expect(keyOf(railOrder(registrations, groups, 'v'), 'a')).toBe('v2');
    });

    it("gives a group's heading its own glyph, its first view's, or the document glyph", () => {
        // revert: src/lib/state/workbench/navigation/catalogue.ts:166 => delete
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
        // revert: src/lib/state/workbench/navigation/catalogue.ts:26 => return { id: 'doc', path: entry.path, label: entry.label };
        expect(docState(doc('ONE.md', 'one')).id).toBe('ONE.md');
        expect(docState(doc('TWO.md', 'one')).id).toBe('TWO.md');
    });
});

describe('the readers of layout.yml', () => {
    it('reads nav_groups in order, dropping a group with no label and a chord that is no letter', () => {
        // revert: src/lib/state/workbench/navigation/catalogue.ts:187 => if (typeof group.chord === 'string') {
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
        // revert: src/lib/state/workbench/navigation/catalogue.ts:200 => return typeof raw === 'string' ? raw : undefined;
        expect(readChord('v')).toBe('v');
        expect(readChord('V')).toBe(undefined);
        expect(readChord('vv')).toBe(undefined);
        expect(readChord('')).toBe(undefined);
        expect(readChord(3)).toBe(undefined);
    });

    it('reads docs as three non-empty strings each, dropping any other entry', () => {
        // revert: src/lib/state/workbench/navigation/catalogue.ts:215 => if (typeof doc.path !== 'string') continue;
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

    function section(label: string): Registration[] {
        return sections.find((found) => found.label === label)?.items ?? [];
    }

    it('lists Personal with the wall, the agenda and two documents, and the third in System', () => {
        // revert: config/layout.yml:159 => - { label: "HPC how-to", path: docs/HPC-UTwente-howto.md, group: personal }
        const personal = sections.find((found) => found.label === 'Personal');
        expect(personal?.items.map((view) => view.id)).toEqual(['memories', 'calendar']);
        expect(personal?.docs.map((entry) => entry.path)).toEqual([
            'docs/RESEARCH-APPROACH.md',
            'docs/AGENT-APPROACH.md'
        ]);
        const [system] = sections.filter((found) => found.label === 'System');
        expect(system.docs.map((entry) => entry.path)).toEqual(['docs/HPC-UTwente-howto.md']);
        expect(system.items.map((view) => view.id)).toEqual([
            'status',
            'findings',
            'gallery',
            'hpc',
            'usage',
            'help',
            'config',
            'audit',
            'history',
            'catalogue',
            'settings',
            'pages'
        ]);
        expect(isChorded(system)).toBe(true);
    });

    it('leaves no view out of a group, the collections of sources.yml included', () => {
        // revert: config/layout.yml:27 => boardz: { label: "Boards" }
        const rest = sections.find((found) => found.label === null)?.items ?? [];
        expect(COLLECTIONS.length).toBeGreaterThan(0);
        expect(rest.map((view) => view.id)).toEqual([]);
    });

    it('gives every chorded group a letter and a glyph, and one letter to one list', () => {
        // revert: config/layout.yml:29 => sessions: { label: "Sessions", glyph: live }
        expect(
            sections
                .filter(isChorded)
                .map((one) => `${one.label ?? ''}:${one.chord ?? ''}:${one.glyph ?? ''}`)
        ).toEqual([
            'Sessions:m:live',
            'Academic life:c:scout',
            'Sources:s:folder',
            'System:y:audit'
        ]);
    });

    it('counts the real keys: the direct views and the four chords', () => {
        // revert: config/layout.yml:38 => direct_chord: w
        const order = railOrder(
            views().filter((view) => view.listed !== false),
            groups,
            readChord(config.direct_chord),
            docs
        );
        // The direct list is what a digit after the direct chord counts into, so it is pinned
        // whole: a group that grows past the group maximum leaves it, which is a keyboard change.
        expect(order.direct).toEqual([
            'focus',
            'projects',
            'coauthor',
            'archive',
            'pillars',
            'domains',
            'map',
            'radar',
            'leads',
            'inbox',
            'linkedin',
            'memories',
            'calendar'
        ]);
        expect(order.chords.v).toEqual([
            ...order.direct,
            'doc:docs/RESEARCH-APPROACH.md',
            'doc:docs/AGENT-APPROACH.md'
        ]);
        expect(order.chords.c).toEqual([
            'funding',
            'events',
            'education',
            'applications',
            'joint-work',
            'tasks',
            'present'
        ]);
        expect(order.chords.m).toEqual([
            'session-list',
            'session-detail',
            'terminal',
            'transcript',
            'timeline',
            'changes',
            'agents'
        ]);
        expect(order.chords.s).toEqual([
            'venues',
            'data',
            'code',
            'statements',
            'files',
            'repositories',
            'search'
        ]);
        expect(order.chords.y).toEqual([
            'status',
            'findings',
            'gallery',
            'hpc',
            'usage',
            'help',
            'config',
            'audit',
            'history',
            'catalogue',
            'settings',
            'pages',
            'doc:docs/HPC-UTwente-howto.md'
        ]);
        expect(Object.keys(order.chords).sort()).toEqual(['c', 'm', 's', 'v', 'y']);
    });

    it('keeps the boards, the pillars and the feeds each under their heading', () => {
        // revert: config/layout.yml:32 => feeds: { label: "Feed", glyph: scout }
        expect(section('Boards').map((view) => view.id)).toEqual([
            'focus',
            'projects',
            'coauthor',
            'archive'
        ]);
        expect(section('Pillars').map((view) => view.id)).toEqual(['pillars', 'domains', 'map']);
        expect(section('Feeds').map((view) => view.id)).toEqual([
            'radar',
            'leads',
            'inbox',
            'linkedin'
        ]);
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
        // revert: src/lib/state/workbench/navigation/catalogue.ts:232 => return false;
        expect(nodeHolds(views, 'catalogue')).toBe(true);
        expect(nodeHolds(views, 'pages')).toBe(true);
        expect(nodeHolds(views, 'focus')).toBe(false);
        expect(nodeHolds('not a node', 'catalogue')).toBe(false);
    });

    it('names only the rail page whose arrangement holds the catalogue as its own page', () => {
        // revert: src/lib/state/workbench/navigation/catalogue.ts:248 => return entry !== undefined;
        expect(onCataloguePage('views', pages, 'catalogue')).toBe(true);
        expect(onCataloguePage('focus', pages, 'catalogue')).toBe(false);
        expect(onCataloguePage(undefined, pages, 'catalogue')).toBe(false);
    });
});

describe('the views the catalogue lists', () => {
    // revert: src/lib/state/workbench/navigation/catalogue.ts:253 => return views;
    it('are every registration that does not say it is unlisted', () => {
        const views = [
            { id: 'a' },
            { id: 'b', listed: false },
            { id: 'c', listed: true }
        ] as unknown as Parameters<typeof listedViews>[0];
        expect(listedViews(views).map((one) => one.id)).toEqual(['a', 'c']);
    });
});
