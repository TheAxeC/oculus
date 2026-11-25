// Layer 2, client-state tests. An excluded filter value hides every project that carries it, the
// exclude winning over an include of the same facet, and a saved exclude is read back as it was
// saved. One table per unit: the board's filter (state.ts `applyFilters`), the Role and Hub drop
// through a board's and the Map's bar (filter-menu.ts `boardFilter`, structure/map-bar.ts
// `mapBar`), the saved board state (`parseBoardState`), the press helpers (`withPick`,
// `withExclude`, `withCategory`, `noPicks`), a collection's rule (collection/bar.ts `meets`,
// through `collectionBar`, with a state read by `parseCollectionState`), the Map's stage rule
// (structure/map-bar.ts `stageKeeps`, through `mapBar`), the Map's graph filter
// (structure/graph.ts `filterGraph`, through `buildGraph`) and a record page's count button
// (record-board.ts `pressedState`). The board items of the filter's table are synthetic and hold
// only what the facets read; the other projects and the collection's entries are made by
// board-fixture.ts with the shipped config.
//
// It does not cover the bar drawing an excluded value or its presses, which the look does.

import { describe, expect, it } from 'vitest';
import type { Entry, SchemaField, Snapshot } from '../../../../src/lib/data/model/index.ts';
import { boardItems } from '../../../../src/lib/state/boards/board/items.ts';
import { NONE, mapPreset, type BoardItem } from '../../../../src/lib/state/boards/board/presets.ts';
import { boardFilter } from '../../../../src/lib/state/boards/board/filter-menu.ts';
import {
    applyFilters,
    noPicks,
    parseBoardState,
    withCategory,
    withExclude,
    withPick,
    type FilterPicks
} from '../../../../src/lib/state/boards/board/state.ts';
import { collectionBar } from '../../../../src/lib/state/boards/collection/bar.ts';
import {
    NO_FUNDING,
    parseCollectionState
} from '../../../../src/lib/state/boards/collection/index.ts';
import { buildGraph } from '../../../../src/lib/state/boards/structure/graph.ts';
import { mapBar } from '../../../../src/lib/state/boards/structure/map-bar.ts';
import { pressedState } from '../../../../src/lib/state/boards/record-board.ts';
import { setCatalog } from '../../../../src/lib/state/shared/words/text.ts';
import { CASES, CATALOG, CONFIG, SELF, project, snapshotOf } from './board-fixture.ts';

setCatalog(CATALOG);

const PRESET = mapPreset(CONFIG);

/** A board item with nothing in any facet but what `over` gives, its project's under `project`. */
function item(id: string, over: Record<string, unknown> = {}): BoardItem {
    const { project: own, ...rest } = over;
    return {
        id,
        project: { id, chips: [], ...(own as object) },
        category: '',
        slice: '',
        role: '',
        venue: null,
        year: '',
        domain: null,
        pillars: [],
        funding: [],
        datasets: [],
        chips: [],
        compute: [],
        reproduced: false,
        code: '',
        sessions: 'none',
        waiting: [],
        haystack: '',
        mine: true,
        ...rest
    } as unknown as BoardItem;
}

/** A board item whose project carries the chips `chips`. */
function chipped(id: string, chips: string[]): BoardItem {
    return item(id, { project: { chips } });
}

/** Projects A (`blocked`), B (`blocked`, `paused`), C (`paused`) and D (no chip). */
const FOUR = [
    chipped('A', ['blocked']),
    chipped('B', ['blocked', 'paused']),
    chipped('C', ['paused']),
    chipped('D', [])
];

const ids = (items: readonly { id: string }[]): string[] => items.map((one) => one.id);

describe("the board's filter with excluded values", () => {
    const venued = [item('venued', { venue: { id: 'bspc', label: 'BSPC' } }), item('bare')];
    const pillared = [
        item('p1-p2', { pillars: [{ id: 'p1' }, { id: 'p2' }] }),
        item('p2', { pillars: [{ id: 'p2' }] }),
        item('no-pillar')
    ];
    const shared = [
        item('one', { domain: { id: 'methods' } }),
        item('lab:two', { domain: { id: 'lab:methods' }, project: { root: 'lab' } }),
        item('three', { domain: { id: 'other' } })
    ];
    const both = parseBoardState({
        filters: { status: ['paused'] },
        excluded: { status: ['paused'] }
    });

    it.each([
        {
            name: 'an include and an exclude of one facet keep what carries the one and not the other',
            items: FOUR,
            filters: { status: ['blocked'] },
            excluded: { status: ['paused'] },
            kept: ['A']
        },
        {
            name: 'an exclude alone keeps every project not carrying it',
            items: FOUR,
            filters: {},
            excluded: { status: ['paused'] },
            kept: ['A', 'D']
        },
        {
            name: 'an exclude of the value for none keeps the projects with a value',
            items: venued,
            filters: {},
            excluded: { venue: [NONE] },
            kept: ['venued']
        },
        {
            name: 'an exclude of one of several values hides a project carrying it among others',
            items: pillared,
            filters: {},
            excluded: { pillar: ['p1'] },
            kept: ['p2', 'no-pillar']
        },
        {
            name: 'a value saved in both lists of a facet hides the projects carrying it',
            items: FOUR,
            filters: both.filters,
            excluded: both.excluded,
            kept: ['A', 'D']
        },
        {
            name: 'an exclude of a value both hubs share hides the projects of both hubs',
            items: shared,
            filters: {},
            excluded: { domain: ['methods'] },
            kept: ['three']
        }
    ])('$name', (row) => {
        expect(ids(applyFilters(row.items, row.filters, '', {}, row.excluded))).toEqual(row.kept);
    });
});

describe('a saved Role or Hub exclude through the bars', () => {
    const ROLED = boardItems(snapshotOf([project('c1'), project('c8'), project('c2')]), PRESET);
    const HUBBED = boardItems(
        snapshotOf([project('c1', { ...CASES.c1, root: 'lab' }), project('c8')]),
        PRESET
    );
    type Row = {
        name: string;
        items: BoardItem[];
        excluded: Record<string, string[]>;
        named: boolean;
        kept: string[];
    };

    it.each<Row>([
        {
            name: 'a Role exclude with no user marked hides no project',
            items: ROLED,
            excluded: { role: ['lead'] },
            named: false,
            kept: ['c8', 'c2', 'c1']
        },
        {
            name: 'a Role exclude with a user marked hides the projects at that role',
            items: ROLED,
            excluded: { role: ['lead'] },
            named: true,
            kept: ['c8', 'c2']
        },
        {
            name: 'a Hub exclude on a workspace of one hub hides no project',
            items: HUBBED,
            excluded: { hub: ['lab'] },
            named: true,
            kept: ['c1', 'c8']
        }
    ])('$name', (row) => {
        const saved = { mine: false, excluded: row.excluded };
        const board = boardFilter(row.items, PRESET, row.named, [], saved, null);
        expect(ids(board.shown).sort()).toEqual([...row.kept].sort());
        const map = mapBar({
            items: row.items,
            preset: PRESET,
            filters: {},
            excluded: row.excluded,
            search: '',
            mine: false,
            named: row.named,
            hubs: [],
            config: CONFIG
        });
        expect(ids(map.kept).sort()).toEqual([...row.kept].sort());
    });
});

describe('a saved board state with excluded values', () => {
    const offered = [
        { key: 'compute', values: [{ value: 'utwente', label: 'UTwente', count: 1 }] }
    ];

    it.each([
        {
            name: 'reads a value of both lists as excluded and drops a key no facet has',
            saved: { filters: { status: ['x'] }, excluded: { status: ['x', 'y'], nofacet: ['z'] } },
            filters: {},
            excluded: { status: ['x', 'y'] }
        },
        {
            name: 'reads a state with no excluded values as none',
            saved: { filters: { status: ['x'] } },
            filters: { status: ['x'] },
            excluded: {}
        },
        {
            name: 'reads excluded values of the wrong type as none and keeps the picks',
            saved: { filters: { status: ['x'] }, excluded: 5 },
            filters: { status: ['x'] },
            excluded: {}
        },
        {
            name: 'drops an excluded compute value no facet offers and a slice no board holds',
            saved: {
                excluded: {
                    compute: ['hpc', 'utwente'],
                    slice: ['publications/poster', 'in-review/submitted']
                }
            },
            filters: {},
            excluded: { compute: ['utwente'], slice: ['in-review/submitted'] }
        }
    ])('$name', (row) => {
        const held = parseBoardState(row.saved, 'short', offered, ['in-review/submitted']);
        expect({ filters: held.filters, excluded: held.excluded }).toEqual({
            filters: row.filters,
            excluded: row.excluded
        });
    });
});

describe('the presses on a filter value', () => {
    const at = (
        filters: Record<string, string[]>,
        excluded: Record<string, string[]>
    ): FilterPicks => ({ filters, excluded });
    const CATEGORY = ['a/1', 'a/2'];

    it.each([
        {
            name: 'the row press includes an off value',
            press: () => withPick(at({}, {}), 'status', 'x'),
            after: at({ status: ['x'] }, {})
        },
        {
            name: 'the row press turns an included value off',
            press: () => withPick(at({ status: ['x', 'y'] }, {}), 'status', 'x'),
            after: at({ status: ['y'] }, {})
        },
        {
            name: 'the row press includes an excluded value',
            press: () => withPick(at({}, { status: ['x'] }), 'status', 'x'),
            after: at({ status: ['x'] }, {})
        },
        {
            name: 'the not press excludes an off value',
            press: () => withExclude(at({}, {}), 'status', 'x'),
            after: at({}, { status: ['x'] })
        },
        {
            name: 'the not press turns an excluded value off',
            press: () => withExclude(at({}, { status: ['x'] }), 'status', 'x'),
            after: at({}, {})
        },
        {
            name: 'the not press excludes an included value',
            press: () => withExclude(at({ status: ['x'] }, {}), 'status', 'x'),
            after: at({}, { status: ['x'] })
        },
        {
            name: 'Clear all empties both lists',
            press: () => noPicks(),
            after: at({}, {})
        },
        {
            name: "a plain click on a category includes its slices and keeps another's exclude",
            press: () => withCategory(at({}, { slice: ['a/1', 'b/1'] }), 'slice', CATEGORY, false),
            after: at({ slice: CATEGORY }, { slice: ['b/1'] })
        },
        {
            name: 'a plain click on a category whose slices are all included takes them out',
            press: () => withCategory(at({ slice: CATEGORY }, {}), 'slice', CATEGORY, false),
            after: at({}, {})
        },
        {
            name: 'an Alt-click on a category excludes its slices and takes them out of the include',
            press: () => withCategory(at({ slice: ['a/2', 'b/1'] }, {}), 'slice', CATEGORY, true),
            after: at({ slice: ['b/1'] }, { slice: CATEGORY })
        }
    ])('$name', (row) => {
        expect(row.press()).toEqual(row.after);
    });
});

describe("a collection's rule with excluded values", () => {
    const SCHEMA: SchemaField[] = [
        { field: 'title', type: 'text', primary_key: true },
        { field: 'status', type: 'text' },
        { field: 'kind', type: 'select', filter: true, options: ['grant', 'prize'] }
    ];

    /** An entry of the collection with the fields `fields`, of the hub `root` where given. */
    function entry(id: string, fields: Record<string, unknown>, root?: string): Entry {
        return {
            id,
            title: id,
            fields: { title: id, ...fields },
            file: '/collection.yml',
            index: 0,
            ...(root === undefined ? {} : { root })
        };
    }

    const OPEN = entry('open-grant', { kind: 'grant', status: 'open' });
    const CLOSED = entry('closed-prize', { kind: 'prize', status: 'closed' });
    const MAIN = entry('main-grant', { kind: 'grant' }, 'main');
    const LAB = entry('lab-grant', { kind: 'grant' }, 'lab');
    const STRIP = boardItems(
        snapshotOf([
            project('article-one', { tier: 'research', lead: [SELF], form: 'article' }),
            project('journal-one', { tier: 'research', lead: [SELF], form: 'journal' }),
            project('article-two', { tier: 'research', lead: [SELF], form: 'article' })
        ]),
        PRESET
    );
    const strips = {
        of: (one: Entry): BoardItem[] =>
            STRIP.filter((item) =>
                one.id === OPEN.id ? item.id !== 'article-two' : item.id === 'article-two'
            ),
        unfunded: [],
        preset: PRESET
    };
    const BARE = entry('bare-grant', { kind: 'grant', status: 'open' });
    /** The strips above, and none for the entry `BARE`. */
    const bareStrips = {
        ...strips,
        of: (one: Entry): BoardItem[] => (one.id === BARE.id ? [] : strips.of(one))
    };

    it.each([
        {
            name: 'a field exclude hides the entries carrying that value',
            saved: { excluded: { 'field:kind': ['grant'] } },
            over: {},
            kept: ['closed-prize'],
            card: false
        },
        {
            name: 'a status slice exclude hides the entries at that status',
            saved: { excluded: { status: ['closed'] } },
            over: {},
            kept: ['open-grant'],
            card: false
        },
        {
            name: 'an exclude of the No funding slice hides the No funding card',
            saved: { excluded: { status: [NO_FUNDING] } },
            over: { noFunding: 2 },
            kept: ['open-grant', 'closed-prize'],
            card: false
        },
        {
            name: 'an exclude of another status keeps the No funding card',
            saved: { excluded: { status: ['open'] } },
            over: { noFunding: 2 },
            kept: ['closed-prize'],
            card: true
        },
        {
            name: 'a Projects-section exclude narrows each strip and hides a card it leaves empty',
            saved: { excluded: { project_form: ['article'] } },
            over: { strips },
            kept: ['open-grant'],
            card: false,
            strip: ['journal-one']
        },
        {
            name: 'a Projects-section exclude alone keeps a card that draws no project',
            saved: { excluded: { project_form: ['article'] } },
            over: { entries: [OPEN, CLOSED, BARE], strips: bareStrips },
            kept: ['open-grant', 'bare-grant'],
            card: false
        },
        {
            name: 'a Projects-section include hides a card that draws no project',
            saved: { filters: { project_form: ['journal'] } },
            over: { entries: [OPEN, CLOSED, BARE], strips: bareStrips },
            kept: ['open-grant'],
            card: false
        },
        {
            name: 'a Projects-section exclude alone keeps the No funding card with no project',
            saved: { excluded: { project_form: ['article'] } },
            over: { strips, noFunding: 2 },
            kept: ['open-grant'],
            card: true,
            unfunded: 2,
            unread: true
        },
        {
            name: 'a Projects-section include hides the No funding card with no project',
            saved: { filters: { project_form: ['journal'] } },
            over: { strips, noFunding: 2 },
            kept: ['open-grant'],
            card: false,
            unfunded: 0,
            unread: false
        },
        {
            name: 'a Hub exclude hides the entries of that hub and lists both hubs',
            saved: { excluded: { hub: ['lab'] } },
            over: { entries: [MAIN, LAB], hubs: ['main', 'lab'] },
            kept: ['main-grant'],
            card: false,
            hub: [
                ['main', false],
                ['lab', true]
            ]
        },
        {
            name: 'excluded values of the wrong type are read as none, the picks kept',
            saved: { filters: { status: ['open'] }, excluded: 5 },
            over: {},
            kept: ['open-grant'],
            card: false
        },
        {
            name: 'a value saved in both lists is read as excluded',
            saved: { filters: { status: ['open'] }, excluded: { status: ['open'] } },
            over: {},
            kept: ['closed-prize'],
            card: false
        }
    ])('$name', (row) => {
        const held = parseCollectionState(row.saved);
        const entries = [OPEN, CLOSED];
        const made = collectionBar({
            entries,
            schemas: [SCHEMA],
            filters: held.filters,
            excluded: held.excluded,
            search: '',
            mine: false,
            config: CONFIG,
            self: new Set(),
            hubs: [],
            noFunding: 0,
            ...row.over
        });
        const listed = (row.over.entries ?? entries).filter(made.keeps).map((one) => one.id);
        expect(listed).toEqual(row.kept);
        expect(made.card).toBe(row.card);
        if (row.strip !== undefined) {
            expect(ids(STRIP.filter((one) => made.strip(one.project)))).toEqual(row.strip);
        }
        if (row.hub !== undefined) {
            const hub = made.groups.find((group) => group.id === 'hub');
            expect(hub?.items.map((one) => [one.id, one.excluded])).toEqual(row.hub);
        }
        if (row.unfunded !== undefined) {
            const slices = made.counted[0].values;
            expect(slices.find((one) => one.value === NO_FUNDING)?.count).toBe(row.unfunded);
            // A project no strip of the bar holds, such as one of an archival row.
            expect(made.strip(project('unread', { tier: 'research' }))).toBe(row.unread);
        }
    });
});

describe("the Map's stage rule with excluded stages", () => {
    const at = (id: string, stage: string) =>
        project(id, { tier: 'research', lead: [SELF], stage });
    const ITEMS = boardItems(
        snapshotOf([
            at('submitted-one', 'submitted'),
            at('revision-one', 'revision'),
            at('published-one', 'published')
        ]),
        PRESET
    );
    type Row = {
        name: string;
        filters: Record<string, string[]>;
        excluded: Record<string, string[]>;
        kept: string[];
        gone: [string, number, boolean, boolean] | undefined;
    };

    it.each<Row>([
        {
            name: 'an excluded stage hides its projects, the terminal stages hidden with none included',
            filters: {},
            excluded: { stage: ['submitted'] },
            kept: ['revision-one'],
            gone: undefined
        },
        {
            name: 'an included terminal stage keeps its projects beside an excluded stage',
            filters: { stage: ['published'] },
            excluded: { stage: ['submitted'] },
            kept: ['published-one'],
            gone: undefined
        },
        {
            name: 'an excluded stage no project is at is listed at 0',
            filters: {},
            excluded: { stage: ['accepted'] },
            kept: ['submitted-one', 'revision-one'],
            gone: ['accepted', 0, false, true]
        }
    ])('$name', (row) => {
        const made = mapBar({
            items: ITEMS,
            preset: PRESET,
            filters: row.filters,
            excluded: row.excluded,
            search: '',
            mine: false,
            named: true,
            hubs: [],
            config: CONFIG
        });
        expect(ids(made.kept)).toEqual(row.kept);
        const gone = row.gone;
        if (gone !== undefined) {
            const stage = made.groups[0].items.find((one) => one.id === gone[0]);
            expect([stage?.id, stage?.count, stage?.active, stage?.excluded]).toEqual(gone);
        }
    });
});

describe("the Map's graph with excluded pillars", () => {
    const base = snapshotOf([
        project('in-p1', { tier: 'research', pillarIds: ['p1'] }),
        project('in-p2', { tier: 'research', pillarIds: ['p2'] }),
        project('lab:in-p1', { tier: 'research', root: 'lab', pillarIds: ['lab:p1'] })
    ]);
    const SNAPSHOT: Snapshot = {
        ...base,
        entities: {
            ...base.entities,
            pillars: {
                p1: { id: 'p1', title: 'P1' },
                p2: { id: 'p2', title: 'P2' },
                'lab:p1': { id: 'lab:p1', root: 'lab', title: 'Lab P1' }
            }
        } as unknown as Snapshot['entities']
    };

    it.each([
        {
            name: 'draws every pillar with none excluded',
            excluded: [],
            lines: ['p1', 'p2', 'lab:p1']
        },
        {
            name: 'drops the pillar nodes of an excluded key of every hub',
            excluded: ['p1'],
            lines: ['p2']
        }
    ])('$name', (row) => {
        const graph = buildGraph(SNAPSHOT, CONFIG, { excludedPillars: row.excluded });
        const lines = graph.nodes.filter((node) => node.kind === 'line');
        expect(lines.map((node) => node.entityId)).toEqual(row.lines);
    });
});

describe("a press on a record page's count button", () => {
    it.each([
        {
            name: 'takes out every excluded value and includes the slices it counts',
            saved: {
                mode: 'cards',
                filters: { status: ['blocked'] },
                excluded: { slice: ['publications/journal'], status: ['paused'] }
            },
            slices: ['publications/journal', 'publications/conference'],
            filters: { slice: ['publications/journal', 'publications/conference'] }
        }
    ])('$name', (row) => {
        const pressed = pressedState(row.saved, row.slices);
        expect(pressed.excluded).toEqual({});
        expect(pressed.filters).toEqual(row.filters);
        expect(pressed.mode).toBe('cards');
    });
});
