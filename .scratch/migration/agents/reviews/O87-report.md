# O87 builder report

Everything in the brief is done. One verification line is not green as run: `npm run test:quick` ended "failed: vitest, vitest slow" on 22 tests, every one a time limit (5 s or 20 s) on a machine at load average 17 to 19, plus one worker that did not start in time; the 11 files they belong to pass when run alone (quoted under DONE, row 1). No assertion failed.

## Open items of the state file, verbatim

## Open items (only what Axel must rule on; every report tells him these in plain words, decisions first, until he has ruled)

An entry leaves this list for the closed log the moment Axel rules on it. What a review or a look found and no brief covered is not an open item: it is folded into an existing step in `plan.md` (Z468), never booked as a step of its own.

(The section holds no entry: `sed -n "203,206p" .scratch/migration/orchestrator-state.md` in the main checkout.)

## The cases' first run (unchanged tree) and the run after the change

Every case except 7 (part), 11 and the G126 halves of 4 is run by the case-run program `o87case.test.ts`, run from the scratchpad with `O87_TREE=<worktree> node <worktree>/node_modules/vitest/vitest.mjs run tests/o87case.test.ts --config <worktree>/vite.config.ts --disableConsoleIntercept`, which only prints. Its source is quoted at the end of this section. The first run was made before any change, on the worktree at the base.

No case was found where the brief's rules give a wrong result, so there was no stop.

### First run, unchanged tree, as printed

```
CASE 1/2: positions flat[Job Active] count 1
CASE 9: badge 1
CASE 3: teaching flat[Course Ongoing] count 1
CASE 4: findings ["/scratch/B/.oculus/config.yml | position_stages | key position_stages is not one the hub's settings file takes; it is not applied"] position_stages undefined
CASE 4: positions flat[]
CASE 19: badge 0
CASE 5: positions flat[A active, B active]
CASE 6: findings ["/scratch/B/.oculus/config.yml | position_stages | key position_stages is not one the hub's settings file takes; it is not applied"]
CASE 6: positions flat[Job Active] drawn true teaching flat[Course Ongoing] funding In prep[Grant InPrep]
CASE 7: findings ["/scratch/B/.oculus/config.yml | teaching_stages | key teaching_stages is not one the hub's settings file takes; it is not applied"]
CASE 7: teaching flat[Course Ongoing]
CASE 8/20: positions flat[Job Active] head count 1
CASE 20: badge 1
CASE 10: applications ["App applied"]
CASE 21: grants []
CASE 12: invented key ["/scratch/lab/.oculus/workspaces/main.yml | settings.focus.nope | focus.nope is not an option; it is not applied"] value undefined
CASE 12: applications_open [] value ["active"]
CASE 13: tasks.followups ["P13 - Follow undated (undated)"]
CASE 13: tasks.subtasks []
CASE 13: tasks.tasks ["Task undated (undated)"]
CASE 13/14/23: overdue ["Grant past 2 (-2, red)"]
CASE 13/14/23: deadlines ["Paper14 (10, amber)","Joint in 5 (5, amber)","Task in 5 (5, amber)"]
CASE 13: command followups ["P13 - Follow yesterday (-1, red)"] command subtasks ["P13: Sub 2 ago (-2, red)","P13: Sub in 3 (3, amber)"]
CASE 15: snoozed ["P15: Snoozed sub (4, amber)"] tasks [] subtasks []
CASE 16: whole tasks [] whole command subtasks ["P16: Sub in 3 (3, amber)"]
CASE 16: unticked B: hidden.tasks 0 hidden.command 1 kept tasks []
CASE 22: whole awaiting applications ["B applied"] unticked B: hidden.awaiting 1
CASE 22: mine only: mineHides true hidden.awaiting 1 kept applications []
CASE 17: tasks.tasks ["P17 (undated)","Task undated (undated)"] overdue [] deadlines ["Task in 5 (5, amber)"]
CASE 18: badge 1 column count 2
CASE 24: command center drawn true tasks []
 Test Files  1 passed (1)
      Tests  1 passed (1)
```

The "Task in 200" entry of case 13 is absent on the unchanged tree: it is past `deadline_horizon_days` and was dropped.

### After the change, as printed

```
CASE 1/2: positions Active[Job Active] Applied[Job Applied] count 2
CASE 9: badge 2
CASE 3: teaching Ongoing[Course Ongoing] Planned[Course Planned] count 2
CASE 4: findings [] position_stages [{"label":"Open","color":"#16a34a","statuses":["open"]}]
CASE 4: positions Open[Job Open]
CASE 19: badge 1
CASE 5: positions Active[A active, B live]
CASE 6: findings []
CASE 6: positions flat[] drawn false teaching Ongoing[Course Ongoing] funding In prep[Grant InPrep]
CASE 7: findings ["/scratch/B/.oculus/config.yml | teaching_stages.1.color | teaching_stages.1.color must be a text"]
CASE 7: teaching Bad[Course Planned]
CASE 8/20: positions One[Job Active] Two[Job Active] head count 2
CASE 20: badge 1
CASE 10: applications ["App applied","App submitted"]
CASE 21: grants ["Scheme applied"]
CASE 12: invented key ["/scratch/lab/.oculus/workspaces/main.yml | settings.focus.nope | focus.nope is not an option; it is not applied"] value undefined
CASE 12: applications_open ["/scratch/lab/.oculus/workspaces/main.yml | settings.focus.applications_open | focus.applications_open is not an option; it is not applied"] value undefined
CASE 13: tasks.followups ["P13 - Follow yesterday (-1, red)","P13 - Follow undated (undated)"]
CASE 13: tasks.subtasks ["P13: Sub 2 ago (-2, red)","P13: Sub in 3 (3, amber)"]
CASE 13: tasks.tasks ["Task in 5 (5, amber)","Task in 200 (200)","Task undated (undated)"]
CASE 13/14/23: overdue ["Grant past 2 (-2, red)"]
CASE 13/14/23: deadlines ["Paper14 (10, amber)","Joint in 5 (5, amber)"]
CASE 13: command followups [] command subtasks []
CASE 15: snoozed ["P15: Snoozed sub (4, amber)"] tasks [] subtasks []
CASE 16: whole tasks ["P16: Sub in 3 (3, amber)"] whole command subtasks []
CASE 16: unticked B: hidden.tasks 1 hidden.command 0 kept tasks []
CASE 22: whole awaiting applications ["B applied"] unticked B: hidden.awaiting 1
CASE 22: mine only: mineHides true hidden.awaiting 1 kept applications []
CASE 17: tasks.tasks ["Task in 5 (5, amber)","Task in 200 (200)","P17 (undated)","Task undated (undated)"] overdue [] deadlines []
CASE 18: badge 2 column count 2
CASE 24: command center drawn false tasks ["P24 - Follow yesterday (-1, red)","P24: Sub in 3 (3, amber)"]
 Test Files  1 passed (1)
      Tests  1 passed (1)
```

After the change `Ticker` has no `followups` or `subtasks` field, so "command followups [] command subtasks []" reads an absent list as empty: the Command Center has no such group to draw.

### Each case against the brief

| Case | Checked by | Result after the change |
| --- | --- | --- |
| 1 | program, CASE 1/2 | Active and Applied, one card each, count 2 |
| 2 | program, CASE 1/2 | "Job Rejected" in no stage, not counted |
| 3 | program, CASE 3 | Ongoing and Planned, one each |
| 4 | G126 row "replaces ... whole" + program CASE 4 | hub list replaces oculus's; `open` under Open |
| 5 | program, CASE 5 | A's `active` and B's `live` under Active; B's `active` in none |
| 6 | program, CASE 6 | no Positions stage, column not drawn; Teaching, Funding unchanged |
| 7 | G126 table row + program CASE 7 | no finding for the bare row, it holds nothing; colour 5 gives the finding |
| 8 | program, CASE 8/20 | in both stages One and Two, head count 2 |
| 9 | program, CASE 9 | badge 2 (1 before) |
| 10 | program, CASE 10 | applied and submitted listed, active not |
| 11 | G126 row (item 5) | Applied row `statuses: []`, no finding |
| 12 | program, CASE 12 | both keys give "is not an option; it is not applied" and no value |
| 13 | program, CASE 13 | groups and order as the brief says; none in Overdue or Deadlines |
| 14 | program, CASE 13/14/23 | Paper14 in Deadlines, the grant in Overdue, neither in Tasks |
| 15 | program, CASE 15 | in Snoozed, not in Tasks |
| 16 | program, CASE 16 | unticking B: Tasks hides 1, draws no row |
| 17 | program, CASE 17 | P17 among the undated Tasks lines, not in the Command Center |
| 18 | program, CASE 18 | badge 2, column 2 |
| 19 | program, CASE 19 | badge 1 |
| 20 | program, CASE 8/20 and 20 | badge 1, column draws it twice |
| 21 | program, CASE 10/21 | "Scheme applied" under Grants |
| 22 | program, CASE 22 | hub untick and Mine only both report the application hidden |
| 23 | program, CASE 13/14/23 | "Joint in 5" in Deadlines, not in Tasks |
| 24 | program, CASE 24 | Command Center not drawn; both lines in Tasks |

The program's case 7 puts the bad colour on the second row (index 1), so its finding names `teaching_stages.1.color`; the G126 table row puts it on row 0 as the brief writes, and gives `teaching_stages.0.color`.

### The G126 rows (cases 4, 7 and 11), red on the unchanged tree

`npx vitest run tests/data/sources/config/layers/hub-vocab.test.ts` on the unchanged source with the new rows: 4 failed.
- Case 11 row ("statuses: { applied: null }"): `TypeError: Cannot read properties of undefined (reading 'find')`, since oculus held no `position_stages`.
- Case 4 row (the replaced-whole row): received the findings `... | position_stages | key position_stages is not one the hub's settings file takes; it is not applied` and the same for `teaching_stages`.
- Case 7 table row, `position_stages` and `teaching_stages`: the same "not one the hub's settings file takes" finding. The `fund_stages` row of the same table passed, as it holds already.

After the change: `npx vitest run tests/data/sources/config/layers/hub-vocab.test.ts tests/checks/config/config-folder.test.ts`

```
 Test Files  2 passed (2)
      Tests  47 passed | 2 skipped (49)
```

The old row also proved that a hub file's `focus:` key is refused; that is still proved by the row at `hub-vocab.test.ts:329-330` (`glyphs` and `locale` refused the same way).

### Source of the case-run program

The file was `<scratchpad>/o87/tests/o87case.test.ts`, written with the Write tool and deleted after the runs.

```ts
// Case-run program of O87: prints the result of each case over a synthetic snapshot, writes nothing.
// O87_TREE names the checkout whose src it imports.
import { expect, it } from 'vitest';

const TREE = process.env.O87_TREE ?? '';
const load = (path: string): Promise<any> => import(/* @vite-ignore */ `${TREE}/${path}`);

const NOW = new Date(2026, 9, 27, 12).getTime();
function day(n: number): string {
    const d = new Date(2026, 9, 27 + n);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

it('o87 cases', { timeout: 120000 }, async () => {
    const { engineDir, loadConfig, textCatalog } = await load('src/lib/data/sources/config.ts');
    const { HUB_FILE } = await load('src/lib/data/helpers/hub-names.ts');
    const { setCatalog } = await load('src/lib/state/shared/words/text.ts');
    const lanes = await load('src/lib/state/boards/focus/focus-lanes.ts');
    const tick = await load('src/lib/state/boards/ticker.ts');
    const focus = await load('src/lib/state/boards/focus.ts');
    const filter = await load('src/lib/state/boards/focus/filter.ts');
    const badges = await load('src/lib/state/workbench/rail-badges/rail-badges.svelte.ts');
    const { unionWords } = await load('src/lib/data/shapes/vocab-keys.ts');
    const { fixtureProject, NO_FEEDS } = await load('tests/fixtures/entities-fixture.ts');

    const OCULUS = loadConfig(engineDir()).config;
    setCatalog(textCatalog(OCULUS));
    const lists = { lists: {}, ownCollections: OCULUS.collections };
    const hubRead = (text: string) =>
        loadConfig(engineDir(), { hub: '/scratch/B', instead: { layer: 'hub', name: HUB_FILE, text } });
    const findings = (read: any): string[] =>
        read.findings.map((one: any) => `${one.file} | ${one.key} | ${one.message}`);
    const wordsBy = (hubs: Record<string, Record<string, unknown>>) => (hub?: string) =>
        hub === undefined ? unionWords(Object.values(hubs)) : (hubs[hub] ?? OCULUS);

    let seq = 0;
    const entry = (root: string, title: string, fields: Record<string, unknown>) => {
        seq += 1;
        return { id: `${root}:e${seq}`, root, title, fields, file: `/h/${root}/f.yml`, index: seq };
    };
    const col = (root: string, key: string, traits: Record<string, unknown>, entries: unknown[]) => ({
        id: `${root}:${key}`,
        root,
        title: key,
        file: `/h/${root}/${key}.yml`,
        entries,
        index: 0,
        ...traits
    });
    const APPS = { band_positions: true, awaiting: true, open_badge: true };
    const TEACH = { band_teaching: true };
    const relations = new Proxy({}, { get: () => [] });
    const snap = (parts: { collections?: any[]; projects?: any[]; funding?: any[] }) => ({
        version: 1,
        entities: {
            projects: Object.fromEntries((parts.projects ?? []).map((one) => [one.id, one])),
            venues: {},
            datasets: {},
            pillars: {},
            domains: {},
            funding: Object.fromEntries((parts.funding ?? []).map((one) => [one.id, one])),
            people: {},
            organisations: {},
            resources: {},
            collections: Object.fromEntries((parts.collections ?? []).map((one) => [one.id, one])),
            feeds: NO_FEEDS,
            career: null
        },
        relations,
        findings: []
    });
    const scheme = (root: string, title: string, over: Record<string, unknown>) => ({
        id: `${root}:${title}`,
        root,
        title,
        followups: [],
        subtasks: [],
        tags: [],
        projectIds: [],
        pillarIds: [],
        ...over
    });

    /** A column of the band as text: stages with their cards, or a flat list of cards. */
    const column = (held: any[]): string => {
        if (held.length > 0 && held[0].items !== undefined) {
            return held.map((stage) => `${stage.label}[${stage.items.map((one: any) => one.title).join(', ')}]`).join(' ');
        }
        return `flat[${held.map((one) => one.title).join(', ')}]`;
    };
    const count = (held: any[]): number =>
        held.length > 0 && held[0].items !== undefined ? lanes.stageItemCount(held) : held.length;
    const band = (s: any, words: any) => lanes.collectionLanes(s, OCULUS, words);
    const one = wordsBy({ A: OCULUS });
    const say = (n: string, ...rest: unknown[]) => console.log(`CASE ${n}:`, ...rest);
    const badgeOf = (s: any, words: any) =>
        badges
            .createRailBadges({}, {}, {}, {}, {}, {}, {}, {
                configMap: () => OCULUS,
                collectionOf: (key: string) => s.entities.collections[`A:${key}`] ?? null,
                collectionsOfKey: (key: string) =>
                    Object.values(s.entities.collections).filter((c: any) => c.id.endsWith(`:${key}`)),
                vocabOf: words
            }, {})
            .openCount('applications');

    // 1, 2, 9
    const apps = [
        entry('A', 'Job Active', { status: 'active' }),
        entry('A', 'Job Applied', { status: 'applied' }),
        entry('A', 'Job Rejected', { status: 'rejected' })
    ];
    const s1 = snap({ collections: [col('A', 'applications', APPS, apps)] });
    const b1 = band(s1, one);
    say('1/2', 'positions', column(b1.applications), 'count', count(b1.applications));
    say('9', 'badge', badgeOf(s1, one));

    // 3
    const s3 = snap({
        collections: [
            col('A', 'education', TEACH, [
                entry('A', 'Course Ongoing', { status: 'ongoing' }),
                entry('A', 'Course Planned', { status: 'planned' })
            ])
        ]
    });
    const b3 = band(s3, one);
    say('3', 'teaching', column(b3.education), 'count', count(b3.education));

    // 4, 19
    const r4 = hubRead('position_stages: [ { label: Open, color: "#16a34a", statuses: [open] } ]\n');
    say('4', 'findings', JSON.stringify(findings(r4)), 'position_stages', JSON.stringify(r4.config.position_stages));
    const w4 = wordsBy({ B: r4.config });
    const s4 = snap({ collections: [col('B', 'applications', APPS, [entry('B', 'Job Open', { status: 'open' })])] });
    say('4', 'positions', column(band(s4, w4).applications));
    say('19', 'badge', badgeOf({ entities: { collections: { 'A:applications': s4.entities.collections['B:applications'] } } }, w4));

    // 5
    const r5 = hubRead('position_stages: [ { label: Active, color: "#16a34a", statuses: [live] } ]\n');
    const w5 = wordsBy({ A: OCULUS, B: r5.config });
    const s5 = snap({
        collections: [
            col('A', 'applications', APPS, [entry('A', 'A active', { status: 'active' })]),
            col('B', 'applications', APPS, [
                entry('B', 'B live', { status: 'live' }),
                entry('B', 'B active', { status: 'active' })
            ])
        ]
    });
    say('5', 'positions', column(band(s5, w5).applications));

    // 6
    const r6 = hubRead('position_stages: []\n');
    say('6', 'findings', JSON.stringify(findings(r6)));
    const w6 = wordsBy({ B: r6.config });
    const s6 = snap({
        collections: [
            col('B', 'applications', APPS, [entry('B', 'Job Active', { status: 'active' })]),
            col('B', 'education', TEACH, [entry('B', 'Course Ongoing', { status: 'ongoing' })]),
            col('B', 'funding', { registry: 'funding' }, [entry('B', 'Grant InPrep', { status: 'in-prep' })])
        ]
    });
    const b6 = band(s6, w6);
    say('6', 'positions', column(b6.applications), 'drawn', count(b6.applications) > 0, 'teaching', column(b6.education), 'funding', column(b6.funding));

    // 7
    const r7 = hubRead('teaching_stages: [ { label: Running, color: "#16a34a" }, { label: Bad, color: 5, statuses: [planned] } ]\n');
    say('7', 'findings', JSON.stringify(findings(r7)));
    const w7 = wordsBy({ B: r7.config });
    const s7 = snap({
        collections: [
            col('B', 'education', TEACH, [
                entry('B', 'Course Ongoing', { status: 'ongoing' }),
                entry('B', 'Course Planned', { status: 'planned' })
            ])
        ]
    });
    say('7', 'teaching', column(band(s7, w7).education));

    // 8, 20
    const r8 = hubRead('position_stages: [ { label: One, color: "#16a34a", statuses: [active] }, { label: Two, color: "#0891b2", statuses: [active] } ]\n');
    const w8 = wordsBy({ A: r8.config });
    const s8 = snap({ collections: [col('A', 'applications', APPS, [entry('A', 'Job Active', { status: 'active' })])] });
    const b8 = band(s8, w8);
    say('8/20', 'positions', column(b8.applications), 'head count', count(b8.applications));
    say('20', 'badge', badgeOf(s8, w8));

    // 10, 21
    const s10 = snap({
        collections: [
            col('A', 'applications', APPS, [
                entry('A', 'App applied', { status: 'applied' }),
                entry('A', 'App active', { status: 'active' }),
                entry('A', 'App submitted', { status: 'submitted' })
            ])
        ],
        funding: [scheme('A', 'Scheme applied', { status: 'applied' })]
    });
    const strip = focus.waiting(s10, OCULUS, {}, one);
    say('10', 'applications', JSON.stringify(strip.applications));
    say('21', 'grants', JSON.stringify(strip.grants));

    // 12
    const ws = (text: string) =>
        loadConfig(engineDir(), { workspace: { file: '/scratch/lab/.oculus/workspaces/main.yml', text: `folders: []\nsettings:\n${text}` } });
    const r12a = ws('  focus: { nope: [x] }\n');
    const r12b = ws('  focus: { applications_open: [active] }\n');
    say('12', 'invented key', JSON.stringify(findings(r12a)), 'value', JSON.stringify((r12a.config.focus as any).nope));
    say('12', 'applications_open', JSON.stringify(findings(r12b)), 'value', JSON.stringify((r12b.config.focus as any).applications_open));

    // 13, 14, 23
    const tasks = col('A', 'tasks', { tasks: true, ticker: { category: 'task', undated: true } }, [
        entry('A', 'Task in 5', { status: 'todo', deadline: day(5) }),
        entry('A', 'Task in 200', { status: 'todo', deadline: day(200) }),
        entry('A', 'Task undated', { status: 'todo' })
    ]);
    const joint = col('A', 'joint', { joint_work: true, ticker: { category: 'collab' } }, [
        entry('A', 'Joint in 5', { status: 'active', date: day(5) })
    ]);
    const p13 = fixtureProject({
        id: 'A:p13',
        root: 'A',
        title: 'P13',
        stage: 'exploring',
        subtasks: [
            { key: 'a', do: 'Sub in 3', deadline: day(3), done: false },
            { key: 'b', do: 'Sub 2 ago', deadline: day(-2), done: false }
        ],
        followups: [
            { key: 'f1', do: 'Follow yesterday', after: day(-1) },
            { key: 'f2', do: 'Follow undated' }
        ]
    });
    const p14 = fixtureProject({ id: 'A:p14', root: 'A', title: 'Paper14', stage: 'exploring', deadline: day(10) });
    const fund14 = col('A', 'funding', { registry: 'funding' }, []);
    const s13 = snap({
        projects: [p13, p14],
        collections: [tasks, joint, fund14],
        funding: [scheme('A', 'Grant past 2', { status: 'in-prep', deadline: day(-2) })]
    });
    const week = tick.ticker(s13, OCULUS, NOW, one, lists);
    const lines = (held: any[] | undefined) =>
        (held ?? []).map((line) => `${line.label} (${line.days === null ? 'undated' : line.days}${tick.daysTone(line.days) ? `, ${tick.daysTone(line.days)}` : ''})`);
    const groups = tick.taskGroups(week.tasks);
    say('13', 'tasks.followups', JSON.stringify(lines(groups.followups)));
    say('13', 'tasks.subtasks', JSON.stringify(lines(groups.subtasks)));
    say('13', 'tasks.tasks', JSON.stringify(lines(groups.tasks)));
    say('13/14/23', 'overdue', JSON.stringify(lines(week.overdue)));
    say('13/14/23', 'deadlines', JSON.stringify(lines(week.deadlines)));
    say('13', 'command followups', JSON.stringify(lines(week.followups)), 'command subtasks', JSON.stringify(lines(week.subtasks)));

    // 15
    const p15 = fixtureProject({
        id: 'A:p15',
        root: 'A',
        title: 'P15',
        stage: 'exploring',
        subtasks: [{ key: 'z', do: 'Snoozed sub', deadline: day(4), done: false, snooze: 'true' }]
    });
    const w15 = tick.ticker(snap({ projects: [p15] }), OCULUS, NOW, one, lists);
    say('15', 'snoozed', JSON.stringify(lines(w15.snoozed)), 'tasks', JSON.stringify(lines(w15.tasks)), 'subtasks', JSON.stringify(lines(w15.subtasks)));

    // 16, 22 (hub untick)
    const two = wordsBy({ A: OCULUS, B: OCULUS });
    const p16 = fixtureProject({
        id: 'B:p16',
        root: 'B',
        title: 'P16',
        stage: 'exploring',
        subtasks: [{ key: 'a', do: 'Sub in 3', deadline: day(3), done: false }]
    });
    const s16 = snap({
        projects: [p16],
        collections: [col('B', 'applications', APPS, [entry('B', 'B applied', { status: 'applied' })])]
    });
    const scope = { self: new Set(), hubs: ['A', 'B'], wordsOf: two, lists };
    const whole16 = filter.focusPage(s16, OCULUS, NOW, { mine: false, roles: [], tiers: [], hubs: [] }, scope);
    const page16 = filter.focusPage(s16, OCULUS, NOW, { mine: false, roles: [], tiers: [], hubs: ['B'] }, scope);
    say('16', 'whole tasks', JSON.stringify(lines(whole16.sections.week.tasks)), 'whole command subtasks', JSON.stringify(lines(whole16.sections.week.subtasks)));
    say('16', 'unticked B: hidden.tasks', page16.hidden.tasks, 'hidden.command', page16.hidden.command, 'kept tasks', JSON.stringify(lines(page16.sections.week.tasks)));
    say('22', 'whole awaiting applications', JSON.stringify(whole16.sections.strip.applications), 'unticked B: hidden.awaiting', page16.hidden.awaiting);

    // 22 (Mine only, the filter's copy)
    const s22 = snap({
        collections: [
            col('A', 'applications', { ...APPS, schema: [{ field: 'lead', type: 'text' }] }, [
                entry('A', 'Not mine applied', { status: 'applied', lead: 'someone' })
            ])
        ]
    });
    const mine22 = filter.focusPage(s22, OCULUS, NOW, { mine: true, roles: [], tiers: [], hubs: [] }, {
        self: new Set(['me']),
        hubs: [],
        wordsOf: one,
        lists
    });
    say('22', 'mine only: mineHides', mine22.mineHides, 'hidden.awaiting', mine22.hidden.awaiting, 'kept applications', JSON.stringify(mine22.sections.strip.applications));

    // 17
    const p17 = fixtureProject({ id: 'A:p17', root: 'A', title: 'P17', stage: 'exploring', deadline: 'TBD' });
    const w17 = tick.ticker(snap({ projects: [p17], collections: [tasks] }), OCULUS, NOW, one, lists);
    const g17 = tick.taskGroups(w17.tasks);
    say('17', 'tasks.tasks', JSON.stringify(lines(g17.tasks)), 'overdue', JSON.stringify(lines(w17.overdue)), 'deadlines', JSON.stringify(lines(w17.deadlines)));

    // 18
    const s18 = snap({
        collections: [
            col('A', 'applications', APPS, [entry('A', 'A active', { status: 'active' })]),
            col('B', 'applications', APPS, [entry('B', 'B active', { status: 'active' })])
        ]
    });
    say('18', 'badge', badgeOf(s18, two), 'column count', count(band(s18, two).applications));

    // 24
    const p24 = fixtureProject({
        id: 'A:p24',
        root: 'A',
        title: 'P24',
        stage: 'exploring',
        subtasks: [{ key: 'a', do: 'Sub in 3', deadline: day(3), done: false }],
        followups: [{ key: 'f1', do: 'Follow yesterday', after: day(-1) }]
    });
    const w24 = tick.ticker(snap({ projects: [p24] }), OCULUS, NOW, one, lists);
    const cats = tick.tickerCategories(OCULUS);
    const rows: Record<string, unknown[]> = {
        overdue: w24.overdue,
        categories: tick.deadlinesByCategory(w24.deadlines, cats),
        snoozed: w24.snoozed,
        attention: [],
        refresh: []
    };
    if (w24.subtasks !== undefined) rows.subtaskDated = tick.runsByKind(w24.subtasks);
    if (w24.followups !== undefined) rows.followups = w24.followups;
    say('24', 'command center drawn', tick.hasCommandRows(rows, w24), 'tasks', JSON.stringify(lines(w24.tasks)));

    expect(true).toBe(true);
});
```

## DONE / NOT DONE

| # | Check | State | Output |
| --- | --- | --- | --- |
| 1 | `npm run diagrams` then `npm run test:quick`, once | ran; red on time limits only | see below |
| 2 | ASCII gate over the changed files | DONE | printed nothing, exit 0 |
| 3 | removal grep of the brief | DONE | printed nothing, exit 1 |
| 4 | `position_stages\|teaching_stages` grep | DONE | every place of item 1, below |
| 5 | `sh utils/unused-exports.sh` against the base | DONE | no line added |
| 6 | hub-vocab and config-folder tests | DONE | 47 passed, 2 skipped |
| 7 | case-run program, before and after | DONE | quoted above |
| 8 | new sentences against the list and sentence rules | DONE | below |

Row 1. `npm run diagrams` rewrote `docs/diagrams/writes.dot` and `writes.svg` (line numbers of `vocab.ts` moved: `:336` to `:339`, `:337` to `:340`, `:467` to `:482`, `:477` to `:492`). Then `npm run test:quick`, printed lines:

```
test:quick: 27 changed file(s), from git since HEAD
test:quick: 150 test file(s)
ok      prettier (21.7 s): All matched files use Prettier code style!
ok      ASCII gate (21.7 s)
ok      svelte-kit sync (24.6 s)
ok      eslint (348.5 s)
ok      svelte-check (549.8 s): 1793058852636 COMPLETED 548 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest checks (657.8 s): Duration  576.72s (transform 666.57s, setup 0ms, import 1385.11s, tests 868.06s, environment 8ms)
FAILED  vitest (667.0 s)
 Test Files  8 failed | 96 passed | 30 skipped (134)
      Tests  18 failed | 1312 passed | 418 skipped (1748)
     Errors  1 error
FAILED  vitest slow (712.0 s)
 Test Files  2 failed | 36 passed (38)
      Tests  4 failed | 414 passed | 122 skipped (540)
test:quick: 738.8 s; failed: vitest, vitest slow
```

Every one of the 22 failures is "Error: Test timed out in 5000ms." (vitest) or "Error: Test timed out in 20000ms." (vitest slow), in `tests/data/hubs/workspace-projects.test.ts`, `tests/data/snapshot/references.test.ts` (2), `tests/server/core/changes.test.ts`, `tests/server/edit/app-store.test.ts`, `tests/routes/files/file-undo.test.ts` (8), `tests/routes/hubs/hub-routing.test.ts`, `tests/state/sources/clone-after.test.ts` (4), `tests/data/sources/manifests/manifests.test.ts`, `tests/data/hubs/hub-portfolio.test.ts` (3, slow) and `tests/server/edit/config-value.test.ts` (1, slow). The one error is "[vitest-pool]: Failed to start forks worker for test files .../tests/ui/html.dom.test.ts ... Timeout waiting for worker to respond". `uptime` right after: "load averages: 17.23 19.51 17.15". None of these files reads the focus band, the ticker, the badge or the stage lists; they reach the change through `hub-names.ts` or the vocabulary shape.

The same files, run alone right after with the time limits test:quick gives them:

```
npx vitest run tests/data/hubs/workspace-projects.test.ts tests/data/snapshot/references.test.ts tests/server/core/changes.test.ts tests/server/edit/app-store.test.ts tests/routes/files/file-undo.test.ts tests/routes/hubs/hub-routing.test.ts tests/state/sources/clone-after.test.ts tests/data/sources/manifests/manifests.test.ts tests/ui/html.dom.test.ts --tagsFilter '!slow'
 Test Files  9 passed (9)
      Tests  126 passed | 20 skipped (146)

npx vitest run tests/data/hubs/hub-portfolio.test.ts tests/server/edit/config-value.test.ts --tagsFilter slow --testTimeout 20000
 Test Files  2 passed (2)
      Tests  39 passed (39)
```

Row 2, the brief's gate over `git diff --name-only` (the 27 changed files; `writes.svg` checked apart with `LC_ALL=C grep -c '[^ -~]'`, which printed 0): no line printed, "exit 0".

Row 3: `grep -rn "applications_open\|education_open\|applications_sent\|grp_subtask_dl_label\|subtaskDated" src config docs tests --exclude=local.yml` printed nothing, exit 1. The wider grep with `grp_followups_label|runsByKind|runHeading|kindGroups|focusWords` prints only `config/text/views/boards/focus.yml:141: grp_followups_label: Follow-ups`, which is `focus.tasks.grp_followups_label`, the Tasks section's group heading that `Tasks.svelte:102` reads.

Row 4: `grep -rn "position_stages\|teaching_stages" src config docs tests --exclude=local.yml` hits `config/catalogs/vocab.yml:4,200,205`, `config/options/catalogs/vocab.yml:4,221,234`, `config/options/sources.yml:80,83,89`, `src/lib/data/shapes/catalog-files/vocab.ts:335,427,433`, `vocab-keys.ts:213-214`, `hub-keys.ts:28-29`, `merge/in-place.ts:67-68`, `hub-names.ts:684-685,721-722`, `focus-lanes.ts:6,91,132,228-229,252,254`, `rail-badges.svelte.ts:275,282`, `Band.svelte:5`, `docs/HELP.md:294,538`, `docs/templates.md:331-340`, `config-folder.test.ts:232-233` and `hub-vocab.test.ts:162,195-196,209,212,222`. Every place item 1 names is there; `docs/data-map.md` is left to the Doc text.

Row 5: `sh utils/unused-exports.sh 2>&1 | diff ~/workspace/oculus/.agents/worktrees/O87-base/unused-exports.txt -` printed nothing, "diff exit 0".

Row 8, the standards' rules on list items and sentence length (`spec.md:56` one line per paragraph or bullet; `spec.md:71` HELP.md in short bullets):
- `docs/HELP.md:294`, the Focus bullet, gains six sentences inside an existing bullet that is already one long paragraph. The brief puts the text "in the Focus bullet", so it is kept there; splitting the bullet would restructure text the step does not own. The eight new sentences are each one statement, of 21, 24, 22, 19, 30, 24, 31 and 6 words (`sed -n 294p docs/HELP.md`, split at sentence ends, `awk '{print NF}'`).
- `docs/HELP.md:529, 538, 547`: words changed inside existing sentences, one line each.
- `docs/templates.md:64-71, 280-281, 330-342`: comments inside the template's YAML code block, which wraps its comments at 100 columns like every other comment there.
- The YAML help texts in `config/options/*.yml` and the comments in `config/catalogs/vocab.yml` are one line each.

Other checks run:
- `npx prettier --check` on the changed files: "All matched files use Prettier code style!".
- `sed -n 696,760p src/lib/data/helpers/hub-names.ts | grep -c "key: '"` gives 51, and 49 at HEAD: the count the Doc text uses.

List runs: `npm run test:quick` ran once. One whole-suite command ran by accident during setup: `vitest --dir` was ignored with the projects config and started the whole unit suite, which was killed before it finished; no result of it is used. Other runs were of named files only (the two reruns above, the hub-vocab pair, `tests/checks/source/catalog-file-keys.test.ts` alone with `--testTimeout=120000` after it timed out at 5 s in a group run, and the templates, options-schema and keys tests).

## Files with line counts

`wc -l` after the change, and `git diff --numstat` (added, removed):

| File | Lines | + | - |
| --- | --- | --- | --- |
| config/catalogs/vocab.yml | 300 | 15 | 5 |
| config/defaults/behavior.yml | 295 | 1 | 6 |
| config/options/behavior.yml | 806 | 1 | 19 |
| config/options/catalogs/vocab.yml | 409 | 27 | 1 |
| config/options/sources.yml | 196 | 4 | 4 |
| config/text/views/boards/focus.yml | 162 | 2 | 4 |
| docs/HELP.md | 584 | 4 | 4 |
| docs/diagrams/writes.dot | 1395 | 10 | 10 |
| docs/diagrams/writes.svg | 4718 | 25 | 25 |
| docs/templates.md | 1541 | 19 | 4 |
| src/lib/data/helpers/hub-names.ts | 824 | 13 | 11 |
| src/lib/data/shapes/catalog-files/vocab.ts | 519 | 20 | 5 |
| src/lib/data/shapes/hub-keys.ts | 56 | 2 | 0 |
| src/lib/data/shapes/vocab-keys.ts | 334 | 2 | 0 |
| src/lib/data/sources/config/merge/in-place.ts | 312 | 2 | 0 |
| src/lib/state/boards/focus.ts | 702 | 7 | 16 |
| src/lib/state/boards/focus/filter.ts | 500 | 11 | 24 |
| src/lib/state/boards/focus/focus-lanes.ts | 309 | 80 | 51 |
| src/lib/state/boards/ticker.ts | 672 | 39 | 36 |
| src/lib/state/workbench/rail-badges/rail-badges.svelte.ts | 417 | 21 | 12 |
| src/lib/views/boards/focus/Band.svelte | 327 | 29 | 36 |
| src/lib/views/boards/focus/CommandCenter.svelte | 265 | 9 | 15 |
| src/lib/views/boards/focus/CommandCenterView.svelte | 286 | 8 | 39 |
| src/lib/views/boards/focus/Tasks.svelte | 161 | 13 | 9 |
| src/lib/views/boards/focus/rows.ts | 386 | 0 | 8 |
| tests/checks/config/config-folder.test.ts | 835 | 2 | 0 |
| tests/data/sources/config/layers/hub-vocab.test.ts | 374 | 34 | 7 |

Plus this report. Every file is under the size limits (880 lines, 520 for a component). `Focus.svelte` is unchanged.

Writes outside the brief's line ranges (`git diff -U0` hunk headers against the ranges of "Paths this step writes"):
- `src/lib/state/boards/focus.ts:19`, the import line: `focusBlock` and `strings` lost their last use when `focusWords` left, and eslint refuses an unused import.
- `src/lib/state/boards/focus/filter.ts:48`, the import of `focusWords`, removed with the function.
Every other hunk is inside its range.

## Changes made to files by means other than the Edit and Write tools

- `cat > $S/o87/tests/probe.test.ts <<'EOF' ...`: a heredoc that wrote a scratch probe file in the scratchpad, before the coordinator's rule; the file is gone. No file of the worktree.
- `npx prettier --write $(git status --short | awk '{print $2}')`: reformatted three files of the worktree, `src/lib/state/boards/focus/focus-lanes.ts`, `src/lib/views/boards/focus/Band.svelte` and `tests/data/sources/config/layers/hub-vocab.test.ts` (every other file printed "(unchanged)").
- `npm run diagrams`: wrote `docs/diagrams/writes.dot` and `writes.svg`, as the brief asks.
- Shell redirects that wrote outputs into the scratchpad only, all now deleted: `| tee $S/o87-first-run.txt` (three runs of the case program), `sh utils/unused-exports.sh > $S/unused-after.txt`, and `npm run test:quick > $S/o87-testquick.txt`.

## Judgment calls the brief left open

1. `BadgeSelectors` (`rail-badges.svelte.ts`) gains `collectionsOfKey` and `vocabOf`, so the badge reads every hub's collection of the key under each hub's words. The selectors store passed at `context.ts:622` already has both (`selectors.svelte.ts:183, 227`), so no caller changed.
2. `stagedEntries` is exported from `focus-lanes.ts` for the badge, as item 3 asks; `StageList` and `HeldStage` stay local types.
3. A helper `datedFirst` in `ticker.ts` (local) orders each Tasks group: dated lines by days, the most overdue first, two of one date in their given order, then the undated ones in their given order. It replaces `runsByKind`.
4. Undated subtasks keep the order by the kind of what holds them, which they had; dated ones sort by date alone (decision 4).
5. A dated entry of the file flagged `tasks` beyond `deadline_horizon_days` is drawn in Tasks (decision 3); an entry of the tasks file whose status closes it is still dropped, as before.
6. `docs/HELP.md:529` now names `focus:` as "the Focus sections, horizons, thresholds and cadences"; the removed words were the Command Center categories (which live in `ticker_categories`) and the open statuses.
7. `config/catalogs/vocab.yml:3` drops "or under `focus:` of behavior.yml" from the list of places that name statuses, since no `focus:` key names a status now.
8. The help of `deadline_horizon_days` (`config/options/behavior.yml:161`) says the tasks file's entries are lines of the Tasks section whatever their date.
9. Prettier was run on the changed files rather than `npm run format`, so no unchanged file is rewritten.

## Before and after, for the look on landing

Each on the TEST page of the running oculus, Focus view, on the hub's own data unless a scratch hub is named.

1. Focus band, Job applications column. Before: a flat list of the `active` applications, sub-line "positions awaiting outcome". After: stage blocks Active (green) and Applied (teal) under their labels, each with its cards, the column's head counting both, sub-line "job applications".
2. Focus band, Teaching & supervision column. Before: a flat list of the `ongoing` entries. After: blocks Ongoing (green) and Planned (purple), sub-line "running and planned".
3. Awaiting box, Applications. Before: the entries in `applications_sent`. After: the applications whose status carries `deadline_met`, the hub's `applied` application among them; a funding scheme of status `applied` is now under Grants.
4. Tasks section. Before: undated lines only. After: the due follow-ups, the open subtasks and the tasks file's entries with a date carry their tail ("in 3d", "3d ago") and tone (red past, amber within 14 days), dated lines first in each group.
5. Command Center. Before: groups "Subtask deadlines" and "Follow-ups". After: neither group; the tasks file's dated entries are no longer under Deadlines or Overdue.
6. Rail, the Applications view's badge. Before: the count of `active` entries of the primary hub. After: the count of the Positions column over every hub (2 on a hub with one active and one applied application).
7. Case 24, on a scratch hub whose only Command Center lines are a dated subtask and a due follow-up: before, the Command Center is drawn with those two; after, it is not drawn and both lines are in Tasks.

## Anything in the brief that was wrong or impossible

- Case 22 names `filter.ts:465-480` (`mineWouldHide`, the Mine-only copy) for a hub untick. A hub untick goes through `waiting()` and `hiddenOf`, not through `mineWouldHide`. Both paths were run (CASE 22, two lines) and both report the application hidden.
- The paths list gives `focus.ts` lines 560-670 and `filter.ts` lines 280-480, but removing `focusWords` also removes the imports at `focus.ts:19` and `filter.ts:48`, outside those ranges (listed above).
- `docs/data-map.md:34` says `ticker:` is "the category of its command center lines", which the change makes false for the file flagged `tasks`, and item 7 does not name it. Its replacement is given in the Doc text below.

## Doc text

Line numbers of the main checkout `~/workspace/oculus`, read with `grep -n`.

1. Line 82, as `grep -n` prints its start:
   `82:\`.oculus/config.yml\` may set these 49 keys and no others; ...`
   Replace "these 49 keys" with "these 51 keys"; in the same line replace "`focus_clusters`, `focus_lanes`, `fund_stages`, `roles`, `venue_categories`, `venue_tiers` and `radar_buckets` whole" with "`focus_clusters`, `focus_lanes`, `fund_stages`, `position_stages`, `teaching_stages`, `roles`, `venue_categories`, `venue_tiers` and `radar_buckets` whole"; and replace "a funding stage's statuses" with "a funding, position or teaching stage's statuses", as `docs/HELP.md:538` now reads.

2. After line 108, `108:fund_stages:              # the stages stacked in the Focus Funding column, in order (whole)`, two new lines:
   ```
   position_stages:          # the stages stacked in the Focus Job applications column, in order (whole)
   teaching_stages:          # the stages stacked in the Focus Teaching & supervision column, in order (whole)
   ```

3. Line 34, the words "`ticker:` the category of its command center lines," become "`ticker:` the category of its lines, which names the command center group of its dated lines (the lines of the file flagged `tasks` are lines of the Tasks section, dated or not),".
