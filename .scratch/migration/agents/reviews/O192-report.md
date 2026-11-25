# O192 report: exclude in the board filters

Everything in the brief is done. Case 23 is the landing's look: its markup is read below, and two of its points no run here can show are named for the look (Alt+Enter and Alt+Space on a focused slice chip, and how the red rows and chips draw in each theme).

## Open items of the state file, verbatim

The section `## Open items (only what Axel must rule on; every report tells him these in plain words, decisions first, until he has ruled)` of `.scratch/migration/orchestrator-state.md` (lines 174 to 188, read with `sed -n 174,188p`) holds no entry: blank lines, then its closing sentence, "An entry leaves this list for the closed log the moment Axel rules on it. What a review or a look found and no brief covered is not an open item: it is folded into an existing step in `plan.md` (Z468), never booked as a step of its own."

## The cases' first run

No case is one the brief's own rules get wrong; the first run found none, so the build went on without a stop and there is no ruling to carry.

### The case program

Cases 1 to 22 were run by one case-run program in `.agents/scratch/` (removed before this report), on the unchanged tree first and on the changed tree after the last change. Command, from the worktree root:

```
export TMPDIR=$PWD/.agents/scratch/tmp GIT_CEILING_DIRECTORIES=$PWD/.agents/scratch/tmp; taskpolicy -b nice -n 19 npx vitest run --config .agents/scratch/cases.config.ts --maxWorkers 1 --reporter dot 2>&1 | grep -E "^case|Tests "
```

Its config, `.agents/scratch/cases.config.ts`:

```ts
// Case-run config: the repository's vite config, with one node project over the case program.
import base from '../../vite.config.ts';
import { defineConfig } from 'vitest/config';

export default defineConfig(async (env) => {
    const made = await (base as unknown as (e: typeof env) => Promise<Record<string, any>>)(env);
    return {
        ...made,
        test: {
            ...made.test,
            projects: undefined,
            environment: 'node',
            include: ['.agents/scratch/**/*.case.ts']
        }
    };
});
```

Its source, `.agents/scratch/cases.case.ts`, as it ran on the changed tree. On the unchanged tree it was the same except for one line, the `case 10 stageGroup` call, which read `MB.stageGroup([], [], [], [], ['submitted'])` there and was changed with Edit to the brief's signature `MB.stageGroup([], [], [], { included: [], excluded: ['submitted'] })`. The modules are imported with `import * as`, so a function the unchanged tree lacks prints `THROWS ...` and the run goes on.

```ts
// Case-run program for O192: prints the result of each case of the brief for its input.
import { expect, it } from 'vitest';
import * as state from '../../src/lib/state/boards/board/state.ts';
import * as facetsMod from '../../src/lib/state/boards/board/facets.ts';
import * as menu from '../../src/lib/state/boards/board/filter-menu.ts';
import { boardItems } from '../../src/lib/state/boards/board/items.ts';
import { mapPreset } from '../../src/lib/state/boards/board/presets.ts';
import * as colBar from '../../src/lib/state/boards/collection/bar.ts';
import * as colIndex from '../../src/lib/state/boards/collection/index.ts';
import * as mapBarMod from '../../src/lib/state/boards/structure/map-bar.ts';
import * as graph from '../../src/lib/state/boards/structure/graph.ts';
import * as present from '../../src/lib/state/life/present.ts';
import { setCatalog } from '../../src/lib/state/shared/words/text.ts';
import { setVocab } from '../../src/lib/state/shared/words/tones.ts';
import { CATALOG, CONFIG, SELF, project, snapshotOf } from '../../tests/state/boards/board/board-fixture.ts';

setCatalog(CATALOG);
const WORDS: any = CONFIG;
setVocab({
    lists: {},
    own: { ...WORDS, chips: { ...WORDS.chips, paused: {} }, forms: { ...WORDS.forms, article: {}, chapter: {} } },
    order: []
} as any);
const S: any = state;
const M: any = menu;
const F: any = facetsMod;
const C: any = colBar;
const CI: any = colIndex;
const MB: any = mapBarMod;
const G: any = graph;
const P: any = present;

const out = (name: string, value: unknown): void => {
    console.log(`${name}: ${JSON.stringify(value)}`);
};
const run = (name: string, body: () => unknown): void => {
    try {
        out(name, body());
    } catch (error) {
        out(name, `THROWS ${(error as Error).message}`);
    }
};
const ids = (items: { id: string }[]): string[] => items.map((one) => one.id);

function bi(id: string, over: Record<string, any> = {}): any {
    const { project: own, ...rest } = over;
    return {
        id,
        project: { id, chips: [], ...(own ?? {}) },
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
    };
}
const chipped = (id: string, chips: string[]): any => bi(id, { project: { chips } });
const FOUR = [chipped('A', ['blocked']), chipped('B', ['blocked', 'paused']), chipped('C', ['paused']), chipped('D', [])];
const PRESET = mapPreset(CONFIG);

it('cases', () => {
    expect(true).toBe(true);
    run('case 1', () => ids(S.applyFilters(FOUR, { status: ['blocked'] }, '', {}, { status: ['paused'] })));
    run('case 2', () => ids(S.applyFilters(FOUR, {}, '', {}, { status: ['paused'] })));
    run('case 3', () =>
        ids(S.applyFilters([bi('venued', { venue: { id: 'bspc', label: 'BSPC' } }), bi('none')], {}, '', {}, { venue: ['__none__'] }))
    );
    run('case 4', () =>
        ids(
            S.applyFilters(
                [bi('p1p2', { pillars: [{ id: 'p1' }, { id: 'p2' }] }), bi('p2', { pillars: [{ id: 'p2' }] }), bi('none')],
                {},
                '',
                {},
                { pillar: ['p1'] }
            )
        )
    );
    {
        const items = boardItems(snapshotOf([project('c1'), project('c8'), project('c2')]), PRESET);
        run('case 5 roles', () => items.map((one: any) => [one.id, one.role]));
        run('case 5 named false', () => ids(M.boardFilter(items, PRESET, false, [], { mine: false, excluded: { role: ['lead'] } }, null).shown));
        run('case 5 named true', () => ids(M.boardFilter(items, PRESET, true, [], { mine: false, excluded: { role: ['lead'] } }, null).shown));
        run('case 5 applied', () => [S.appliedFilters({ role: ['lead'] }, false), S.appliedFilters({ role: ['lead'] }, true)]);
        const hubbed = boardItems(snapshotOf([project('c1', { ...project('c1'), root: 'lab' } as any), project('c8')]), PRESET);
        const one = M.boardFilter(hubbed, PRESET, true, [], { mine: false, excluded: { hub: ['lab'] } }, null);
        run('case 5 one hub', () => ({ shown: ids(one.shown), excluded: one.held.excluded }));
    }
    {
        const items = [
            bi('P1', { project: { form: 'article', chips: ['paused'] } }),
            bi('P2', { project: { form: 'article', chips: [] } }),
            bi('P3', { project: { form: 'chapter', chips: ['paused'] } }),
            bi('P4', { project: { form: 'chapter', chips: [] } })
        ];
        const found = F.facets(items, PRESET, false, { filters: { form: ['article'] }, excluded: { status: ['paused'] }, search: '' });
        const rows = (key: string) => found.find((one: any) => one.key === key)?.values.map((one: any) => [one.value, one.count]);
        run('case 6 status', () => rows('status'));
        run('case 6 form', () => rows('form'));
    }
    run('case 7 a', () => {
        const held = S.parseBoardState({ filters: { status: ['x'] }, excluded: { status: ['x', 'y'], nofacet: ['z'] } });
        return { filters: held.filters, excluded: held.excluded };
    });
    run('case 7 b', () => S.parseBoardState({ filters: { status: ['x'] } }).excluded);
    run('case 7 c', () => {
        const held = S.parseBoardState({ filters: { status: ['x'] }, excluded: 5 });
        return { filters: held.filters, excluded: held.excluded };
    });
    {
        const at = (filters: any, excluded: any) => ({ filters, excluded });
        run('case 8 row off', () => S.withPick(at({}, {}), 'status', 'x'));
        run('case 8 row included', () => S.withPick(at({ status: ['x'] }, {}), 'status', 'x'));
        run('case 8 row excluded', () => S.withPick(at({}, { status: ['x'] }), 'status', 'x'));
        run('case 8 not off', () => S.withExclude(at({}, {}), 'status', 'x'));
        run('case 8 not excluded', () => S.withExclude(at({}, { status: ['x'] }), 'status', 'x'));
        run('case 8 not included', () => S.withExclude(at({ status: ['x'] }, {}), 'status', 'x'));
        run('case 8 clear', () => S.noPicks());
        run('case 18 plain', () =>
            S.withCategory(at({}, { slice: ['a/1', 'b/1'] }), 'slice', ['a/1', 'a/2'], false)
        );
        run('case 18 alt', () => S.withCategory(at({ slice: ['a/2', 'b/1'] }, {}), 'slice', ['a/1', 'a/2'], true));
        run('case 20 not on excluded', () => S.withExclude(at({}, { status: ['x'] }), 'status', 'x'));
        run('case 20 not on off', () => S.withExclude(at({}, {}), 'status', 'x'));
    }
    {
        const choice = (id: string, active: boolean, excluded: boolean) => ({ id, label: id, count: 1, active, excluded, tone: '' });
        const group = (items: any[]) => ({ id: 'status', heading: 'Situation', tone: '', items });
        run('case 9 a', () => M.groupWords(group([choice('blocked', true, false)])));
        run('case 9 b', () => M.groupWords(group([choice('blocked', false, true)])));
        run('case 9 c', () => M.groupWords(group([choice('blocked', true, false), choice('paused', false, true)])));
        const four = group([choice('blocked', true, false), choice('open', true, false), choice('paused', false, true), choice('gone', false, true)]);
        run('case 9 d', () => M.groupWords(four));
        run('case 9 more', () => M.moreWords([four]));
    }
    {
        const items = [chipped('A', ['blocked']), chipped('B', [])];
        const counted = F.facets(items, PRESET, false);
        const picks = { filters: {}, excluded: { status: ['gone'] } };
        run('case 10 gone', () =>
            M.filterGroups(counted, picks, PRESET, false)
                .find((one: any) => one.id === 'status')
                ?.items.map((one: any) => [one.id, one.count, one.active, one.excluded])
        );
        run('case 10 none excluded', () =>
            M.filterGroups(counted, { filters: {}, excluded: { venue: ['__none__'] } }, PRESET, false)
                .find((one: any) => one.id === 'venue')
                ?.items.map((one: any) => [one.id, one.excluded])
        );
        run('case 10 none neither', () =>
            M.filterGroups(counted, { filters: {}, excluded: {} }, PRESET, false).some((one: any) => one.id === 'venue')
        );
        run('case 10 sliceChoices', () =>
            M.sliceChoices(
                [{ key: 'a', label: 'A', tone: '', slices: [{ value: 'a/1', label: '1', tip: '1', tone: '' }] }],
                'slice',
                [],
                { filters: {}, excluded: { slice: ['a/1'] } },
                new Set(['a/1'])
            )[0]?.items.map((one: any) => [one.id, one.excluded])
        );
        run('case 10 stageGroup', () =>
            MB.stageGroup([], [], [], { included: [], excluded: ['submitted'] }).items.map((one: any) => [one.id, one.count, one.excluded])
        );
    }
    run('case 11', () => {
        const raw = { filters: { status: ['blocked'] }, excluded: { status: ['paused'] } };
        const held = P.parsePresentState(raw);
        const shown = ids(M.boardFilter(FOUR, PRESET, false, [], raw, null).shown);
        const cleared = P.barFields({ ...S.parseBoardState(raw), ...S.noPicks?.() });
        return { excluded: held.excluded, bar: P.barFields(S.parseBoardState(raw)).excluded, shown, cleared: [cleared.filters, cleared.excluded] };
    });
    {
        const schema = [
            { field: 'title', type: 'text', primary_key: true },
            { field: 'status', type: 'text' },
            { field: 'kind', type: 'select', filter: true, options: ['grant', 'prize'] }
        ];
        const entry = (id: string, fields: Record<string, unknown>, root?: string) => ({
            id,
            title: id,
            fields: { title: id, ...fields },
            file: '/x.yml',
            index: 0,
            ...(root === undefined ? {} : { root })
        });
        const E1 = entry('e1', { kind: 'grant', status: 'open' });
        const E2 = entry('e2', { kind: 'prize', status: 'closed' });
        const strip = boardItems(
            snapshotOf([
                project('pa', { tier: 'research', lead: [SELF], form: 'article' } as any),
                project('pb', { tier: 'research', lead: [SELF], form: 'journal' } as any),
                project('pc', { tier: 'research', lead: [SELF], form: 'article' } as any)
            ]),
            PRESET
        );
        const byId = new Map(strip.map((one: any) => [one.id, one]));
        const strips = {
            of: (one: any) => (one.id === 'e1' ? [byId.get('pa'), byId.get('pb')] : [byId.get('pc')]),
            unfunded: [],
            preset: PRESET
        };
        const bar = (excluded: Record<string, string[]>, over: Record<string, unknown> = {}) =>
            C.collectionBar({
                entries: [E1, E2],
                schemas: [schema],
                filters: {},
                excluded,
                search: '',
                mine: false,
                config: CONFIG,
                self: new Set(),
                hubs: [],
                noFunding: 0,
                ...over
            });
        const kept = (one: any) => [E1, E2].filter(one.keeps).map((e) => e.id);
        run('case 12 field', () => kept(bar({ 'field:kind': ['grant'] })));
        run('case 12 slice', () => kept(bar({ status: ['closed'] })));
        run('case 12 no-funding', () => bar({ status: ['no-funding'] }, { noFunding: 2 }).card);
        run('case 12 other status', () => bar({ status: ['open'] }, { noFunding: 2 }).card);
        run('case 12 projects', () => {
            const made = bar({ project_form: ['article'] }, { strips });
            return { kept: kept(made), strip: strip.filter((one: any) => made.strip(one.project)).map((one: any) => one.id) };
        });
        run('case 10 groupOf/withGone', () =>
            bar({ 'field:kind': ['gone'] }).groups.find((one: any) => one.id === 'field:kind')?.items.map((one: any) => [one.id, one.count, one.excluded])
        );
        run('case 10 categoryGroup', () =>
            bar({ project_category: ['gone'] }, { strips }).groups.find((one: any) => one.id === 'project_category')?.items.map((one: any) => [one.id, one.count, one.excluded])
        );
        run('case 10 projectGroups', () =>
            bar({ project_form: ['article'] }, { strips }).groups.find((one: any) => one.id === 'project_form')?.items.map((one: any) => [one.id, one.count, one.excluded])
        );
        const H1 = entry('h1', { kind: 'grant' }, 'main');
        const H2 = entry('h2', { kind: 'grant' }, 'lab');
        run('case 21', () => {
            const made = bar({ hub: ['lab'] }, { entries: [H1, H2], hubs: ['main', 'lab'] });
            return {
                kept: [H1, H2].filter(made.keeps).map((e) => e.id),
                rows: made.groups.find((one: any) => one.id === 'hub')?.items.map((one: any) => [one.id, one.excluded])
            };
        });
        run('case 22 collection', () => {
            const a = CI.parseCollectionState({ filters: { status: ['open'] }, excluded: 5 });
            const b = CI.parseCollectionState({ filters: { status: ['open'] }, excluded: { status: ['open'] } });
            return [a.filters, a.excluded, b.filters, b.excluded];
        });
        run('case 22 map', () => {
            const a = G.parseMapState({ filters: { stage: ['published'] }, excluded: 5 });
            const b = G.parseMapState({ filters: { stage: ['published'] }, excluded: { stage: ['published'] } });
            return [a.filters, a.excluded, b.filters, b.excluded];
        });
    }
    {
        const at = (id: string, stage: string) => project(id, { tier: 'research', lead: [SELF], stage } as any);
        const items = boardItems(snapshotOf([at('s1', 'submitted'), at('s2', 'revision'), at('s3', 'published')]), PRESET);
        const bar = (filters: any, excluded: any) =>
            MB.mapBar({ items, preset: PRESET, filters, excluded, search: '', mine: false, named: true, hubs: [], config: CONFIG });
        run('case 13 a', () => ids(bar({}, { stage: ['submitted'] }).kept));
        run('case 13 b', () => ids(bar({ stage: ['published'] }, { stage: ['submitted'] }).kept));
        run('case 13 c', () =>
            bar({}, { stage: ['gone'] }).groups[0].items.map((one: any) => [one.id, one.count, one.excluded])
        );
    }
    {
        const withPillars = (projects: any[]) => {
            const base: any = snapshotOf(projects);
            const pillars = {
                p1: { id: 'p1', title: 'P1' },
                p2: { id: 'p2', title: 'P2' },
                'lab:p1': { id: 'lab:p1', title: 'Lab P1' }
            };
            return { ...base, entities: { ...base.entities, pillars } };
        };
        const snapshot = withPillars([
            project('q1', { tier: 'research', pillarIds: ['p1'] } as any),
            project('q2', { tier: 'research', pillarIds: ['p2'] } as any),
            project('q3', { tier: 'research', root: 'lab', pillarIds: ['lab:p1'] } as any)
        ]);
        const show = { projects: true, pillars: true, team: false };
        run('case 14', () =>
            MB.showGroup(snapshot, CONFIG, { projects: new Set(['q1', 'q2', 'q3']), excludedPillars: ['p1'] }, show, false).items.map(
                (one: any) => [one.id, one.count, one.excluded]
            )
        );
        run('case 15', () =>
            G.buildGraph(snapshot, CONFIG, { excludedPillars: ['p1'] })
                .nodes.filter((one: any) => one.kind === 'line')
                .map((one: any) => one.entityId)
        );
    }
    run('case 16', () => {
        const held = S.parseBoardState({ filters: { status: ['paused'] }, excluded: { status: ['paused'] } });
        return { filters: held.filters, excluded: held.excluded, kept: ids(S.applyFilters(FOUR, held.filters, '', {}, held.excluded)) };
    });
    run('case 17 row', () => {
        const two = [bi('one', { domain: { id: 'methods' } }), bi('lab:two', { domain: { id: 'lab:methods' }, project: { root: 'lab' } }), bi('three', { domain: { id: 'other' } })];
        return ids(S.applyFilters(two, {}, '', {}, { domain: ['methods'] }));
    });
    run('case 19', () => {
        const offered = [{ key: 'compute', values: [{ value: 'utwente', label: 'U', count: 1 }] }];
        const held = S.parseBoardState(
            { excluded: { compute: ['hpc', 'utwente'], slice: ['publications/poster', 'in-review/submitted'] } },
            'short',
            offered,
            ['in-review/submitted']
        );
        return held.excluded;
    });
});
```

Script named under spec.md: one inline `python3` program changed `.agents/scratch/cases.case.ts`, before the first run whose output is quoted below, to add the `expect` import, the `setVocab` call (the chip `paused` and the forms `article` and `chapter`, which the page vocab lacks in a unit run) and `expect(true).toBe(true)` (the config requires an assertion). It changed no other file. The `python3 -c` textwrap commands of the build only printed rewrapped comment paragraphs, which were then applied with Edit.

### First run, on the unchanged tree, as printed

```
case 1: ["A","B"]
case 2: ["A","B","C","D"]
case 3: ["venued","none"]
case 4: ["p1p2","p2","none"]
case 5 roles: [["c8","supervisor"],["c2","other"],["c1","lead"]]
case 5 named false: ["c8","c2","c1"]
case 5 named true: ["c8","c2","c1"]
case 5 applied: [{},{"role":["lead"]}]
case 5 one hub: {"shown":["c8","c1"]}
case 6 status: [["paused",1],["__none__",1]]
case 6 form: [["article",2],["chapter",2]]
case 7 a: {"filters":{"status":["x"]}}
case 7 b: undefined
case 7 c: {"filters":{"status":["x"]}}
case 8 row off: {"filters":{},"excluded":{},"status":["x"]}
case 8 row included: {"filters":{"status":["x"]},"excluded":{},"status":["x"]}
case 8 row excluded: {"filters":{},"excluded":{"status":["x"]},"status":["x"]}
case 8 not off: "THROWS S.withExclude is not a function"
case 8 not excluded: "THROWS S.withExclude is not a function"
case 8 not included: "THROWS S.withExclude is not a function"
case 8 clear: "THROWS S.noPicks is not a function"
case 18 plain: "THROWS S.withCategory is not a function"
case 18 alt: "THROWS S.withCategory is not a function"
case 20 not on excluded: "THROWS S.withExclude is not a function"
case 20 not on off: "THROWS S.withExclude is not a function"
case 9 a: "Situation: blocked"
case 9 b: "Situation"
case 9 c: "Situation: blocked"
case 9 d: "Situation: blocked +1"
case 9 more: "More 2"
case 10 gone: [["blocked",1,false,null],["__none__",1,false,null]]
case 10 none excluded: undefined
case 10 none neither: false
case 10 sliceChoices: [["a/1",null]]
case 10 stageGroup: []
case 11: {"shown":["A","B"],"cleared":[{"status":["blocked"]},null]}
case 12 field: ["e1","e2"]
case 12 slice: ["e1","e2"]
case 12 no-funding: true
case 12 other status: true
case 12 projects: {"kept":["e1","e2"],"strip":["pa","pb","pc"]}
case 10 groupOf/withGone: [["grant",1,null],["prize",1,null]]
case 10 categoryGroup: [["__none__",3,null]]
case 10 projectGroups: [["journal",1,null],["article",2,null]]
case 21: {"kept":["h1","h2"],"rows":[["main",null],["lab",null]]}
case 22 collection: [{"status":["open"]},null,{"status":["open"]},null]
case 22 map: [{"stage":["published"]},null,{"stage":["published"]},null]
case 13 a: ["s1","s2"]
case 13 b: ["s3"]
case 13 c: [["submitted",1,null],["revision",1,null],["published",1,null]]
case 14: [["projects",3,null],["pillars",3,null],["team",0,null],["connected",3,null]]
case 15: ["p1","p2","lab:p1"]
case 16: {"filters":{"status":["paused"]},"kept":["B","C"]}
case 17 row: ["one","lab:two","three"]
case 19: undefined
 Test Files  1 passed (1)
      Tests  1 passed (1)
```

On the unchanged tree the exclude is read by nothing: `applyFilters` ignores its fifth argument, the saved states have no `excluded`, the old `withPick` treats the two-map object as a filters map (case 8's rows), and the helpers the brief adds do not exist.

### Run on the changed tree, after the last change, as printed

```
case 1: ["A"]
case 2: ["A","D"]
case 3: ["venued"]
case 4: ["p2","none"]
case 5 roles: [["c8","supervisor"],["c2","other"],["c1","lead"]]
case 5 named false: ["c8","c2","c1"]
case 5 named true: ["c8","c2"]
case 5 applied: [{},{"role":["lead"]}]
case 5 one hub: {"shown":["c8","c1"],"excluded":{"hub":["lab"]}}
case 6 status: [["paused",1],["__none__",1]]
case 6 form: [["article",1],["chapter",1]]
case 7 a: {"filters":{},"excluded":{"status":["x","y"]}}
case 7 b: {}
case 7 c: {"filters":{"status":["x"]},"excluded":{}}
case 8 row off: {"filters":{"status":["x"]},"excluded":{}}
case 8 row included: {"filters":{},"excluded":{}}
case 8 row excluded: {"filters":{"status":["x"]},"excluded":{}}
case 8 not off: {"filters":{},"excluded":{"status":["x"]}}
case 8 not excluded: {"filters":{},"excluded":{}}
case 8 not included: {"filters":{},"excluded":{"status":["x"]}}
case 8 clear: {"filters":{},"excluded":{}}
case 18 plain: {"filters":{"slice":["a/1","a/2"]},"excluded":{"slice":["b/1"]}}
case 18 alt: {"filters":{"slice":["b/1"]},"excluded":{"slice":["a/1","a/2"]}}
case 20 not on excluded: {"filters":{},"excluded":{}}
case 20 not on off: {"filters":{},"excluded":{"status":["x"]}}
case 9 a: "Situation: blocked"
case 9 b: "Situation: not blocked"
case 9 c: "Situation: blocked, not paused"
case 9 d: "Situation: blocked, not paused +2"
case 9 more: "More 4"
case 10 gone: [["blocked",1,false,false],["__none__",1,false,false],["gone",0,false,true]]
case 10 none excluded: [["__none__",true]]
case 10 none neither: false
case 10 sliceChoices: [["a/1",true]]
case 10 stageGroup: [["submitted",0,true]]
case 11: {"excluded":{"status":["paused"]},"bar":{"status":["paused"]},"shown":["A"],"cleared":[{},{}]}
case 12 field: ["e2"]
case 12 slice: ["e1"]
case 12 no-funding: false
case 12 other status: true
case 12 projects: {"kept":["e1"],"strip":["pb"]}
case 10 groupOf/withGone: [["grant",1,false],["prize",1,false],["gone",0,true]]
case 10 categoryGroup: [["__none__",3,false],["gone",0,true]]
case 10 projectGroups: [["journal",1,false],["article",2,true]]
case 21: {"kept":["h1"],"rows":[["main",false],["lab",true]]}
case 22 collection: [{"status":["open"]},{},{},{"status":["open"]}]
case 22 map: [{"stage":["published"]},{},{},{"stage":["published"]}]
case 13 a: ["s2"]
case 13 b: ["s3"]
case 13 c: [["submitted",1,false],["revision",1,false],["published",1,false],["gone",0,true]]
case 14: [["projects",3,false],["pillars",1,false],["team",0,false],["connected",1,false]]
case 15: ["p2"]
case 16: {"filters":{},"excluded":{"status":["paused"]},"kept":["A","D"]}
case 17 row: ["three"]
case 19: {"compute":["utwente"],"slice":["in-review/submitted"]}
      Tests  1 passed (1)
```

### Each case by its name, against the brief's expected result

1. Situation include `blocked`, exclude `paused`: kept A only, `["A"]`.
2. Situation exclude `paused` alone: kept A and D, `["A","D"]`.
3. Venue exclude `__none__`: kept the one with a venue, `["venued"]`.
4. Pillar exclude `p1`: kept the one in `p2` and the one in none, `["p2","none"]`.
5. Role exclude `lead` with no user marked hides nothing (`named false` keeps all three, `appliedFilters` gives `{}`); with a user marked the Lead project `c1` is hidden (`["c8","c2"]`). Hub exclude on a one-hub workspace (`hubs: []`) hides nothing and the saved exclude is kept (`{"shown":["c8","c1"],"excluded":{"hub":["lab"]}}`).
6. Facet counts over P1 (article, paused), P2 (article), P3 (chapter, paused), P4 (chapter), with Situation exclude `paused` and Form include `article`: Situation's counts are over the Form-`article` projects with its own lists left out, so `paused` shows 1; Form's counts are over the projects without `paused`, 1 and 1.
7. `x` out of filters' `status`, excluded `status` `["x","y"]`, no `nofacet`; a state with no `excluded` reads `{}`; `excluded: 5` reads `{}` with the filters kept.
8. Row press: off to included, included to off, excluded to included. "Not" press: off to excluded, excluded to off, included to excluded. Clear all: both maps empty.
9. `Situation: blocked`, `Situation: not blocked`, `Situation: blocked, not paused`, `Situation: blocked, not paused +2`; More's words `More 4` count all four.
10. `filterGroups` lists the excluded value `gone` no project holds at 0 with `excluded: true`, after the held values; a facet whose only value is `NONE` (Venue here) draws its group while `NONE` is excluded and none while it is neither; `groupOf`/`withGone`, `categoryGroup`, `projectGroups`, `stageGroup` and `sliceChoices` each set `excluded: true` on the excluded value.
11. `parsePresentState` and `barFields` carry `excluded`; `boardFilter`'s `shown` follows (`["A"]`); Clear all leaves `filters: {}` and `excluded: {}`.
12. A field exclude (`kind` `grant`) hides `e1`; a status slice exclude (`closed`) hides `e2`; exclude `no-funding` gives `card: false`; exclude of another status gives `card: true`; the Projects-section Form exclude `article` keeps `e1` with its strip narrowed to `pb` and hides `e2`, whose strip held only the article `pc`.
13. Stage exclude `submitted`: `s2` kept only, the terminal `published` hidden while no stage is included; include `published` with exclude `submitted`: `s3` kept; the excluded stage `gone` no project is at is listed at 0 with `excluded: true`.
14. The Show menu under Pillar exclude `p1`: Pillars counts 1 of the three pillar nodes (the `p1` nodes of both hubs left out), every row `excluded: false`. Read of `src/lib/views/structure/map/Map.svelte:220`, `<PickMenu label={t('map.show')} groups={[show]} onpick={toggleShow} />`: no `onexclude` is passed, and `PickMenu.svelte` draws the minus button only under `{#if onexclude !== undefined}`, so the Show rows draw none.
15. `buildGraph` with `p1` excluded: the only line node is `p2`; no `p1` and no `lab:p1`.
16. A value saved in both lists of a facet reads as excluded only, and the projects carrying it are hidden (`kept: ["A","D"]`).
17. G92's three tests pass unchanged (DONE table, row 2); the `applyFilters` row excludes `methods`, which both hubs name, and hides `one` and `lab:two`.
18. A plain click on category `a` with `a/1` and `b/1` excluded: `a/1` and `a/2` included, `a/1` out of the exclude list, `b/1` of another category kept excluded. An Alt-click on category `a` with `a/2` and `b/1` included: `a/1` and `a/2` excluded and `a/2` out of the include list, `b/1` kept.
19. The saved exclude of the compute value `hpc` no facet offers and of the slice `publications/poster` no board holds are both dropped.
20. The "not" press, which Shift+Enter calls, clears an excluded row and excludes an off row. That the row press does not also run is read from the code: `PickMenu.svelte`'s `shiftEnter`, the `onkeydown` of `Command.Root`, calls `event.preventDefault()` before `onexclude`; svelte-toolbelt's `composeHandlers` runs the caller's handler first and bits-ui's own only while the event is not cancelled; and bits-ui's Enter is what clicks the selected item (`node_modules/bits-ui/dist/bits/command/command.svelte.js:928-940`).
21. Collection Hub group with two hubs, `lab` excluded: `h2` hidden, both hubs listed, `lab`'s row `excluded: true`.
22. `parseCollectionState` and `parseMapState` with `excluded: 5` read `{}` with `filters` kept; with the value in both lists it is read as excluded only.
23. The look at landing; the markup read:
    - `PickMenu.svelte` draws at each row's end, under `{#if onexclude !== undefined}`, a `ToolButton small bare glyph="exclude"` labelled `t('board.exclude_stop', choice.label)` on an excluded row and `t('board.exclude', choice.label)` otherwise. A bare ToolButton with a glyph takes its label as its tip and its accessible name (`ToolButton.svelte:52-55`, `iconOnly`, `tip`, `named`). `.not { visibility: hidden }` and `.item:hover .not, .item[data-selected] .not, .item.excluded .not { visibility: visible }` show it on hover, on the keyboard's row and always on an excluded row.
    - Its click runs `notPress`, which calls `event.stopPropagation()` and then `onexclude`, so the `Command.Item` never sees it and the list stays open; a second click is the "not" press on an excluded value, which clears it (case 8).
    - Shift+Enter: case 20.
    - The excluded row: `class:excluded={choice.excluded}`; `.item.excluded .label` strikes the words through on `--c-red` with `--on-c-red`; the check cell draws `<Glyph name="exclude" />` in place of the check; a span `.unseen` holds `t('board.excluded_state')` for a screen reader.
    - The slice chip: `SliceLine.svelte`'s `pressSlice` calls `onexclude` when `event.altKey` is set, else the row press. The chip gets `excluded={out.includes(slice.value)}` and, while excluded, the title `t('board.exclude_stop', slice.label)`. `Chip.svelte`'s `.chip.excluded` sets `--chip-line: var(--c-red)` and `color: var(--c-red-txt)`, `.chip.excluded .label` strikes the words through, and `aria-pressed={excluded ? false : pressed}`.
    - Alt+Enter and Alt+Space reach `pressSlice` only as a click whose `altKey` the browser sets from the key press on the focused button. No run here shows this; it is not verified and is the look's to check.
    - The group button: `FilterBar.svelte` labels each group button `groupWords(group)` (case 9).
    - The Show menu: case 14.
    - The folded slices' words: `foldedPicks` counts `[...picked, ...out]` among the folded values, so an excluded folded slice is counted in `+<n>, <k> picked`.

### The G151 tables

`tests/state/boards/board/exclude.test.ts` was written and run on the unchanged tree before any code changed. Command:

```
export TMPDIR=$PWD/.agents/scratch/tmp GIT_CEILING_DIRECTORIES=$PWD/.agents/scratch/tmp; taskpolicy -b nice -n 19 npx vitest run tests/state/boards/board/exclude.test.ts --maxWorkers 2 --testTimeout 0
```

Its test lines and summary as printed (the test titles cut with `<horizontal ellipsis>` are cut by vitest's reporter, not here):

```
 x |unit| tests/state/boards/board/exclude.test.ts > the board's filter with excluded values > 'an include and an exclude of one face<horizontal ellipsis>'
 x |unit| tests/state/boards/board/exclude.test.ts > the board's filter with excluded values > 'an exclude alone keeps every project <horizontal ellipsis>'
 x |unit| tests/state/boards/board/exclude.test.ts > the board's filter with excluded values > 'an exclude of the value for none keep<horizontal ellipsis>'
 x |unit| tests/state/boards/board/exclude.test.ts > the board's filter with excluded values > 'an exclude of one of several values h<horizontal ellipsis>'
 v |unit| tests/state/boards/board/exclude.test.ts > the board's filter with excluded values > 'a Role exclude with no user marked hi<horizontal ellipsis>'
 x |unit| tests/state/boards/board/exclude.test.ts > the board's filter with excluded values > 'a Role exclude with a user marked hid<horizontal ellipsis>'
 v |unit| tests/state/boards/board/exclude.test.ts > the board's filter with excluded values > 'a Hub exclude on a workspace of one h<horizontal ellipsis>'
 x |unit| tests/state/boards/board/exclude.test.ts > the board's filter with excluded values > 'a value saved in both lists of a face<horizontal ellipsis>'
 x |unit| tests/state/boards/board/exclude.test.ts > the board's filter with excluded values > 'an exclude of a value both hubs share<horizontal ellipsis>'
 x |unit| tests/state/boards/board/exclude.test.ts > a saved board state with excluded values > 'reads a value of both lists as exclud<horizontal ellipsis>'
 x |unit| tests/state/boards/board/exclude.test.ts > a saved board state with excluded values > 'reads a state with no excluded values<horizontal ellipsis>'
 x |unit| tests/state/boards/board/exclude.test.ts > a saved board state with excluded values > 'reads excluded values of the wrong ty<horizontal ellipsis>'
 x |unit| tests/state/boards/board/exclude.test.ts > a saved board state with excluded values > 'drops an excluded compute value no fa<horizontal ellipsis>'
 x |unit| tests/state/boards/board/exclude.test.ts > the presses on a filter value > 'the row press includes an off value'
 x |unit| tests/state/boards/board/exclude.test.ts > the presses on a filter value > 'the row press turns an included value<horizontal ellipsis>'
 x |unit| tests/state/boards/board/exclude.test.ts > the presses on a filter value > 'the row press includes an excluded va<horizontal ellipsis>'
 x |unit| tests/state/boards/board/exclude.test.ts > the presses on a filter value > 'the not press excludes an off value'
 x |unit| tests/state/boards/board/exclude.test.ts > the presses on a filter value > 'the not press turns an excluded value<horizontal ellipsis>'
 x |unit| tests/state/boards/board/exclude.test.ts > the presses on a filter value > 'the not press excludes an included va<horizontal ellipsis>'
 x |unit| tests/state/boards/board/exclude.test.ts > the presses on a filter value > 'Clear all empties both lists'
 x |unit| tests/state/boards/board/exclude.test.ts > the presses on a filter value > 'a plain click on a category includes <horizontal ellipsis>'
 x |unit| tests/state/boards/board/exclude.test.ts > the presses on a filter value > 'a plain click on a category whose sli<horizontal ellipsis>'
 x |unit| tests/state/boards/board/exclude.test.ts > the presses on a filter value > 'an Alt-click on a category excludes i<horizontal ellipsis>'
 x |unit| tests/state/boards/board/exclude.test.ts > a collection's rule with excluded values > 'a field exclude hides the entries car<horizontal ellipsis>'
 x |unit| tests/state/boards/board/exclude.test.ts > a collection's rule with excluded values > 'a status slice exclude hides the entr<horizontal ellipsis>'
 x |unit| tests/state/boards/board/exclude.test.ts > a collection's rule with excluded values > 'an exclude of the No funding slice hi<horizontal ellipsis>'
 x |unit| tests/state/boards/board/exclude.test.ts > a collection's rule with excluded values > 'an exclude of another status keeps th<horizontal ellipsis>'
 x |unit| tests/state/boards/board/exclude.test.ts > a collection's rule with excluded values > 'a Projects-section exclude narrows ea<horizontal ellipsis>'
 x |unit| tests/state/boards/board/exclude.test.ts > a collection's rule with excluded values > 'a Hub exclude hides the entries of th<horizontal ellipsis>'
 v |unit| tests/state/boards/board/exclude.test.ts > a collection's rule with excluded values > 'excluded values of the wrong type are<horizontal ellipsis>'
 x |unit| tests/state/boards/board/exclude.test.ts > a collection's rule with excluded values > 'a value saved in both lists is read a<horizontal ellipsis>'
 x |unit| tests/state/boards/board/exclude.test.ts > the Map's stage rule with excluded stages > 'an excluded stage hides its projects,<horizontal ellipsis>'
 v |unit| tests/state/boards/board/exclude.test.ts > the Map's stage rule with excluded stages > 'an included terminal stage keeps its <horizontal ellipsis>'
 x |unit| tests/state/boards/board/exclude.test.ts > the Map's stage rule with excluded stages > 'an excluded stage no project is at is<horizontal ellipsis>'
 v |unit| tests/state/boards/board/exclude.test.ts > the Map's graph with excluded pillars > 'draws every pillar with none excluded'
 x |unit| tests/state/boards/board/exclude.test.ts > the Map's graph with excluded pillars > 'drops the pillar nodes of an excluded<horizontal ellipsis>'
 Test Files  1 failed (1)
      Tests  31 failed | 5 passed (36)
```

The reporter's pass and fail marks are written `v` and `x` here (they are a check mark and a cross outside the character set). Every table fails on the unchanged tree. The five rows that pass there expect the exclude to change nothing, or the include alone to give the result: the Role exclude with no user marked, the Hub exclude on a workspace of one hub, the collection's excluded values of the wrong type, the Map's included terminal stage beside an excluded stage, and the graph with no pillar excluded. The first three failure messages as printed:

```
AssertionError: expected [ 'A', 'B' ] to deeply equal [ 'A' ]
AssertionError: expected [ 'A', 'B', 'C', 'D' ] to deeply equal [ 'A', 'D' ]
AssertionError: expected [ 'venued', 'bare' ] to deeply equal [ 'venued' ]
```

The press-helper rows fail with `TypeError: withExclude is not a function` (and `noPicks`, `withCategory`); the graph row with `AssertionError: expected [ 'p1', 'p2', 'lab:p1' ] to deeply equal [ 'p2' ]`. G92's `hub-facets.test.ts` passed its three tests on the unchanged tree.

## DONE / NOT DONE

Every check of "Verify before you report", run from the worktree root after the last change, over the files the step changes.

| # | Check | State | Output as printed |
| --- | --- | --- | --- |
| 1 | `npm run diagrams` | DONE | `diagrams exit 0`. It rewrote six files: `docs/diagrams/layer-state.dot`, `layer-state.svg`, `layer-views.dot`, `layer-views.svg`, `layers.dot`, `layers.svg` (`git diff --stat docs/diagrams`: `6 files changed, 8 insertions(+), 8 deletions(-)`). Its run after the last change left `git status --short` the same (`status diff exit 0`). |
| 2 | `npx vitest run tests/state/boards/board/exclude.test.ts tests/state/boards/board/hub-facets.test.ts tests/state/boards/board/board-rules.test.ts tests/state/boards/board/board-views.test.ts tests/checks/source/keys.test.ts tests/checks/source/history.test.ts tests/checks/source/comment-width.test.ts tests/checks/tree/size.test.ts tests/checks/tree/boundaries.test.ts --maxWorkers 2 --testTimeout 0` | DONE | `Test Files  9 passed (9)` / `Tests  183 passed (183)` |
| 3a | `npx prettier --check` over the 22 changed files | DONE | `Checking formatting...` / `All matched files use Prettier code style!`, exit 0 |
| 3b | `npx eslint` over the 18 changed `.ts` and `.svelte` files | DONE | no output, `eslint exit 0` |
| 4 | `npm run check` | DONE | `COMPLETED 4688 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS` |
| 5 | `printf '%s\0' <changed files> \| xargs -0 env LC_ALL=C perl -ne 'print "$ARGV:$.\n" if /[^\x20-\x7E\n]/; close ARGV if eof'` over the 22 files (fed from the list file with `tr '\n' '\0'`) | DONE | no output, `ascii exit 0` |
| 6 | `python3 -c "import yaml,sys;[yaml.safe_load(open(f)) for f in sys.argv[1:]]" config/catalogs/glyphs.yml config/catalogs/icons.yml config/text/views/boards/projects.yml` | DONE | no output, `yaml exit 0` |
| 7 | `npx svelte-kit sync`, `sh utils/unused-exports.sh`, `diff ../O192-unused-base.txt` | DONE | `unused exit 0`, `diff exit 0` (no line differs) |
| 8 | Cases 1 to 22, quoted | DONE | above; case 23 read from the markup above and left to the look |
| 9 | `wc -l` of each changed file | DONE | the files table below |
| 10 | The tables of `exclude.test.ts` pass after the change, and G92's tests | DONE | `npx vitest run tests/state/boards/board/exclude.test.ts tests/state/boards/board/hub-facets.test.ts --maxWorkers 2 --testTimeout 0 --reporter verbose`: all 36 rows of the six G151 tables and G92's three tests marked passed, `Test Files  2 passed (2)` / `Tests  39 passed (39)` |
| 11 | Each new or changed HELP.md item read against spec.md | DONE | below |

The 22 changed files of checks 3a and 5 are the source, config, doc and test files of the files table; the six diagram files are the build's output and were not part of those two checks.

The HELP.md read (check 11). The two bullets after "- A board draws one section per row of `categories`" are the brief's text word for word; each is one list item, one sentence long, and states one rule of the bar. The first reads that a click includes a value, which holds for an off and an excluded value; on an included value the click turns it off, which the bullet does not say, as the brief wrote it. Both bullets' claims were run before they were written: cases 8, 18 and 20 for the presses and Alt-click, cases 1, 2, 11, 12, 13 and 16 for the rule and the four places it reaches. The rewritten line of a collection's Projects section ("An include narrows each card's strip to the projects it includes, an exclude takes the projects it excludes out of each strip, and a card whose strip is left empty is hidden.") is one sentence of three clauses in one bullet that already held two sentences; case 12's `projects` row shows it. The rewritten Map line ("While no stage is included the map draws the projects at stages without the `terminal` flag, and an excluded stage is not drawn.") is one sentence; case 13 shows it.

Number of runs of the final checks, counted over the last round: the vitest list of row 2 ran three times (the first failed `comment-width.test.ts` on three comment lines over the hundredth column, `src/lib/state/boards/board/state.ts:100`, `src/lib/views/shared/forms/bar/FilterBar.svelte:70` and `tests/state/boards/board/exclude.test.ts:42`, which were rewrapped; the second passed; the third, after the prettier and eslint fixes, passed and is the one quoted); `prettier --check` four times (the first matched no file, the shell having passed the list as one word; the second flagged `state.ts`, `collection/bar.ts` and `exclude.test.ts`; the third flagged `state.ts`; the fourth is quoted); `eslint` twice (the first flagged two `prefer-find` errors in `filter-menu.ts` `groupWords`; the second is quoted); `npm run check` four times (the first and the second each found one error in the types of `exclude.test.ts`'s Map table, a row type and then a possibly undefined `row.gone`, both fixed in the test; the third printed 0 errors; the fourth, after the last change, is quoted); the ASCII check once; the YAML check once; the unused-exports comparison twice; `npm run diagrams` twice; the case program twice on the changed tree (once before and once after the last change, with the same output); `wc -l` twice.

## Files, from `diff -rq` against the base copy

Command: `cd /Users/axelfaes/workspace/oculus/.agents/worktrees && diff -rq --exclude=node_modules --exclude=.svelte-kit --exclude=.agents --exclude=.git O192-base migration-O192`, then `wc -l` of each file in both trees. This report file is the one ledger file the step writes and is not in the table.

| Lines before | Lines after | File |
| --- | --- | --- |
| 281 | 282 | `config/catalogs/glyphs.yml` |
| 280 | 281 | `config/catalogs/icons.yml` |
| 126 | 131 | `config/text/views/boards/projects.yml` |
| 640 | 642 | `docs/HELP.md` |
| 173 | 173 | `docs/diagrams/layer-state.dot` |
| 855 | 855 | `docs/diagrams/layer-state.svg` |
| 179 | 179 | `docs/diagrams/layer-views.dot` |
| 809 | 809 | `docs/diagrams/layer-views.svg` |
| 101 | 101 | `docs/diagrams/layers.dot` |
| 556 | 556 | `docs/diagrams/layers.svg` |
| 366 | 386 | `src/lib/state/boards/board/facets.ts` |
| 445 | 477 | `src/lib/state/boards/board/filter-menu.ts` |
| 85 | 90 | `src/lib/state/boards/board/index.ts` |
| 729 | 734 | `src/lib/state/boards/board/presets.ts` |
| 263 | 392 | `src/lib/state/boards/board/state.ts` |
| 563 | 596 | `src/lib/state/boards/collection/bar.ts` |
| 781 | 787 | `src/lib/state/boards/collection/index.ts` |
| 422 | 430 | `src/lib/state/boards/structure/graph.ts` |
| 251 | 273 | `src/lib/state/boards/structure/map-bar.ts` |
| 802 | 804 | `src/lib/state/life/present.ts` |
| 298 | 320 | `src/lib/ui/controls/Chip.svelte` |
| 456 | 468 | `src/lib/views/boards/collection/Collection.svelte` |
| 103 | 111 | `src/lib/views/shared/forms/bar/BoardBar.svelte` |
| 229 | 238 | `src/lib/views/shared/forms/bar/FilterBar.svelte` |
| 343 | 459 | `src/lib/views/shared/forms/bar/PickMenu.svelte` |
| 253 | 285 | `src/lib/views/shared/forms/bar/SliceLine.svelte` |
| 270 | 288 | `src/lib/views/structure/map/Map.svelte` |
| new | 506 | `tests/state/boards/board/exclude.test.ts` |

The counts are from `wc -l` run after the last change (run twice, the same counts both times). Every file is within the limits of 880 lines for a source file and 520 for a component; `tests/checks/tree/size.test.ts` passes (row 2).

The diagram files hold import counts between layers; the changed counts come from the `byKey` imports the collection bar and the Map bar dropped and the `ToolButton` import `PickMenu.svelte` added.

Two files on the brief's path list needed no change: `src/lib/views/academic/present/Bar.svelte` (it draws `BoardBar.svelte` from `acts/filter.svelte.ts`'s `bar`) and `src/lib/views/academic/present/acts/filter.svelte.ts` (its writes go through `barFields`, which carries `excluded`, and `parsePresentState` reads the bar through `parseBoardState`). No file outside the path list was written.

## Exports, names and head comments

The unused-exports comparison (row 7) shows no line added, so every export the step adds is used. The exports added, all in `src/lib/state/boards/board/state.ts`: `facetKeeps`, `listsOf`, `noPicks`, `withCategory`, `withExclude`, `withoutExcluded` and the types `FilterPicks` and `FacetLists`. All but `withoutExcluded` are re-exported from `state/boards/board/index.ts`; `withoutExcluded` is imported from `state.ts` by `collection/index.ts` and `structure/graph.ts`. The export `withPicks` is removed, its one caller (`SliceLine.svelte` `pickCategory`) moved to `withCategory`. `FilterChoice` gains `excluded`; `BoardState`, `CollectionState`, `MapState`, `InForce`, `BarInput`, `MapBarInput`, `ShowContext`, `GraphFilter` and `PresentBar` gain their excluded field.

Rename grep after the change: `grep -rn "withPicks" src tests docs README.md` and `grep -rn --exclude=local.yml "withPicks" config` print nothing, `grep exit 1`.

History-word grep over every added or changed line, comment lines and test titles among them (each changed file's lines that `diff` against the base copy marks added, and every line of `exclude.test.ts`), with `grep -inE "\bbefore\b|used to|no longer|\bstill\b|previously|as before|always has been|always had|the step adds|after this package lands"`. On its first pass it printed two lines:

```
509:src/lib/ui/controls/Chip.svelte: >        the red, over the chip's own fill, whatever its hue; the hover's accent line still marks the
714:src/lib/views/shared/forms/bar/SliceLine.svelte: >     // picked") as line 1's More does, so a folded pick still shows on the line; a category whose
```

Neither is history: both use "still" to mean "as well". Both were reworded ("the hover's accent line marks the one under the pointer, as on any chip"; "so a folded pick shows on the line too") and the grep rerun after the rewording, over the same lines (the report's own folder `.scratch` left out of the `diff -rq`), prints nothing, `grep exit 1`.

Head comments and docs, each named in item 13 or touched by the change:

| Comment | State |
| --- | --- |
| `state.ts` `applyFilters` | rewritten |
| `state.ts` `appliedFilters` | rewritten |
| `state.ts` `withPick` (and `withPicks`, removed) | rewritten; new `withExclude`, `withCategory`, `noPicks`, `facetKeeps`, `withoutExcluded`, `readPicks`, `listsOf`, `FilterPicks`, `FacetLists` documented |
| `state.ts` `parseBoardState`, `boardStateShape` | rewritten for `excluded` |
| `presets.ts` `BoardState.filters`, `BoardState.excluded` | rewritten, added |
| `facets.ts` head of `facets`, `InForce`, `without` | rewritten (`facets` rewrapped as a paragraph) |
| `facets.ts` file head | still true |
| `filter-menu.ts` file head | rewritten |
| `filter-menu.ts` `FilterChoice`, `choicesOf`, `filterGroups`, `groupWords`, `picksOf`, `moreWords`, `sliceChoices`, `BoardFilter.groups`, `BoardFilter.shown` | rewritten |
| `collection/bar.ts` file head (both paragraphs) | rewritten |
| `collection/bar.ts` `meets`, `BarInput.excluded` | rewritten, added |
| `collection/index.ts` `CollectionState.filters`, `excluded`, `parseCollectionState` | rewritten, added |
| `map-bar.ts` file head | rewritten |
| `map-bar.ts` `stageKeeps`, `stageGroup`, `showGroup`, `MapBarInput.excluded` | rewritten |
| `map-bar.ts` `ShowContext` | still true ("the projects kept, and the graph's options": `excludedPillars` is a graph option); its new field documented |
| `graph.ts` `filterGraph`, `GraphFilter` | rewritten (rewrapped as a paragraph) |
| `graph.ts` `MapState.filters`, `MapState.excluded`, `parseMapState` | rewritten, added |
| `present.ts` `PresentBar`, `barFields` | rewritten |
| `acts/filter.svelte.ts` head | still true |
| `present/Bar.svelte` head | still true |
| `PickMenu.svelte` head | rewritten |
| `FilterBar.svelte` head and the `ontoggle` doc | rewritten; `onexclude` documented |
| `SliceLine.svelte` head, props, `pickCategory`, `.category` style comment | rewritten; `pressSlice` documented |
| `Chip.svelte` head | rewritten; `excluded` prop and its style documented |
| `BoardBar.svelte` head | still true (each press hands its fields to `write`); `exclude` documented |
| `Map.svelte` head | rewritten |
| `Collection.svelte` head (the bar paragraph) | rewritten; `toggleFilter` rewritten, `excludeFilter` documented |
| `docs/HELP.md` Project boards, collection Projects section, Map | two bullets added, two lines rewritten |

Every comment the step edited is rewrapped as a whole paragraph at 100 columns; `comment-width.test.ts` passes (row 2).

## Judgment calls the brief left open

- Names: `FilterPicks` for the pair of maps (the name `Picks` is taken by `src/lib/views/shared/explorer/tree/control/picks.svelte.ts`), `FacetLists` and `listsOf` for one facet's two lists, `withExclude` for the "not" press, `withCategory(picks, facet, values, exclude)` for the category head, `noPicks` for Clear all, `facetKeeps` for the one rule, `withoutExcluded` for the read of a value saved in both lists, `excludedPillars` for the graph's option.
- `SliceLine.svelte` keeps `onfilters`, now handed both maps, for the row press, the category head and Clear all, and takes the required `onexclude(facet, value)` for the "not" press on a chip (Alt) and in the folded list. The callers write the "not" press through `withExclude` in their own `exclude` / `excludeFilter`, so one helper owns it on every bar.
- The minus button keeps its room on every row (`visibility: hidden`, not `display: none`), so the counts and the Venue bars stay in one column whether or not it shows.
- The row's screen-reader word sits after the value's words, inside the option, through a visually hidden span styled as `FieldSelect.svelte`'s `.unseen` is.
- An excluded chip draws over its own fill whatever its hue, the red only on its words and its line, so an excluded slice keeps its place in its category's colours.
- The folded-slices words keep the shipped text `'+{0}, {1} picked'` (`board.slices_more_picked`), and its count now takes the excluded folded slices too; the word "picked" there reads for both.
- `stageGroup` takes one facet's `FacetLists` in place of its two arrays.
- `PresentBar` needed no reader change: `parsePresentState` reads its controls through `parseBoardState`.

## Host-visible changes, before and after

- The project board's bar (line 1, `FilterBar.svelte`). Before: a row of a group's list is ticked or not; a click or Enter picks or unpicks it; a group button reads `Form: journal article +1`; More counts the picks. After: the same click or Enter is the row press (includes an off or excluded value, turns an included one off); each row has a minus button at its end, drawn on hover, on the keyboard's row and always on an excluded row, tip `Exclude <value>` or `Stop excluding <value>`, whose click excludes or clears it and keeps the list open; Shift+Enter does the same on the keyboard's row; an excluded row's words are struck through on a red chip with a minus in place of the tick; a group button reads `Situation: blocked, not paused +2`; More counts both lists; an exclude hides every project that carries the value, an exclude winning.
- The Present view. Before: its pane bar is the board's bar over the deck's members, saved under the board's keys. After: the same bar with excludes, saved as `excluded` in the pane's state; the deck narrows by the same rule.
- The Map's bar. Before: line 1 and line 2 as on a board; the Stage group shows the non-terminal stages while none is picked; a Pillar pick keeps its projects and only its pillars' nodes. After: the same exclude presses; a Stage exclude hides its projects, the terminal stages hidden while no stage is included; a Pillar exclude hides its projects and its pillar nodes, of every hub.
- The Map's Show menu. Before: Projects, Pillars, Team and Connected only, ticked, with counts. After: the same, with no minus button and no Shift+Enter exclude; the Pillars count leaves out the excluded pillars' nodes.
- The Map's graph. Before: a Pillar pick keeps only its pillars' nodes. After: an excluded pillar's nodes are dropped as well.
- A collection page's own groups (Role, Hub, Category, the filter fields, the status slices, No funding). Before: a pick keeps the entries that hold it. After: an exclude hides the entries that hold it; an excluded No funding slice hides the No funding card, an excluded other status keeps it; an excluded Hub hides its entries and is listed as excluded.
- A collection page's Projects section (in More). Before: a pick narrows each card's strip to the projects it picks and hides a card left with none. After: an exclude takes its projects out of each strip, the No funding card's too, and hides a card whose strip it leaves empty.
- Line 2's slices (`SliceLine.svelte`). Before: a click picks or unpicks a slice, drawn filled while picked; a click on a category's label picks all its slices or takes them all out; Clear all empties the picks; `+<n>, <k> picked` counts the folded picks. After: a plain click is the row press; Alt-click, and Alt+Enter or Alt+Space on the focused chip (not verified, for the look), is the "not" press; an excluded chip's words are struck through in the red and its line is red, its tip `Stop excluding <value>`, `aria-pressed` false; Alt-click on a category's label excludes all its slices; the folded list has the minus buttons; Clear all empties both lists; the folded count takes excludes.

Sharp edges the look and the review should weigh:

- Alt+Enter and Alt+Space on a slice chip depend on the browser keeping `altKey` on the click a key press makes on a focused button. Not verified by any run here.
- An Alt-click on a category's label always excludes every slice of it; a second Alt-click does not clear them, since item 4 gives the Alt-click that one meaning. Clearing them takes a plain click on the label (which includes them all) and another, or Clear all.
- The minus button is a `<button>` inside a `role="option"` row. It is out of the Tab order (`tabindex={-1}`), and the keyboard's path to the same press is Shift+Enter; a screen reader may still announce a button inside the option.
- Shift+Enter in a list's search field excludes the row the keyboard is on, as Enter there includes it: `Command.Root`'s keydown handler sees the key from the field too.

## Anything in the brief that was wrong or impossible

- `.scratch/migration/agents/guarded.md` holds two entries numbered G151 (`grep -n "G151" .scratch/migration/agents/guarded.md`: line 411, the EDTF period entry, and line 451, the exclude entry). The builder does not edit plan files; the orchestrator renumbers one.
- Item 14 puts case 22 in the `meets`/`collectionBar` table, while case 22 says "Checked by a quoted run". Both are done: the collection half is a row of that table through `parseCollectionState`, and both halves (`parseCollectionState` and `parseMapState`) are in the quoted case run.
- Item 13's first bullet, given word for word, says a click on a value includes it; the row press on an included value turns it off (case 8). The bullet is written as given.
- Case 6's Form value `article` is not in the shipped vocab (`grep -n "article" config/catalogs/vocab.yml`: only `journal: { label: "journal article", ... }`), so the case program adds it to the page vocab for its run; the counts it shows do not depend on the word.

## Doc text

None
