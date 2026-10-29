Everything in the brief is done

# O103 report: applications and position leads as two Command Center groups, and a task's subtasks under it in Focus Tasks

## Open items of the state file, verbatim

`.scratch/migration/orchestrator-state.md`, the section printed by `sed -n '178,$p' .scratch/migration/orchestrator-state.md | awk 'NR>1 && /^## /{exit} {print}'`:

```
## Open items (only what Axel must rule on; every report tells him these in plain words, decisions first, until he has ruled)

An entry leaves this list for the closed log the moment Axel rules on it. What a review or a look found and no brief covered is not an open item: it is folded into an existing step in `plan.md` (Z468), never booked as a step of its own.
```

The section holds no entry.

## The cases' first run, on the unchanged tree (base d364c1b7e)

The state half of cases 1 to 18 and of 16, 21 and 23 was run by the case-run program quoted below, before any change, with `npx vitest run --config <scratch>/O103-caserun/case.config.mts --reporter=verbose` from the worktree root. It builds copies of `tests/fixtures/hubs/demo` under the system temporary folder with the files each case plants, publishes them through `tests/data/hubs/hubs-fixture.ts` `published`, and prints `ticker()`, `deadlinesByCategory`, `taskGroups`, `hasTasks`, `focusPage` and `rowMaker` results. `now` is 2026-08-25 12:00 local time. The first run's `it` had no timeout argument and hit vitest's 5 s default after printing every line (the program's own `it`, given `60000` for the later runs); its HEAD lines did not yet print the hub, which changes no line of the first run, since no HEAD line exists there. The drawing half was read from the markup.

First run, the lines as printed:

```
case 1: kind=position glyph=scout group="positions" tail="position deadline in 10d" days=10
case 2: kind=position glyph=scout group="positions" tail="position deadline in 20d"
case 3: overdue kind=position glyph=overdue group="positions" tail="application 5d ago"
case 4: groups in order: paper(Graph-Transfer) funding(Early-Career Fellowship) position(Lead Ten, App Twenty); category words: paper, funding, event, teaching, position, task, conference
case 5: no line
case 6: "Lecturer in Data Science" 5d kind=position; "Assistant Professor, Machine Learning" 21d kind=position | lead roots: demo,demo,demo
tasks section of hub A:
  followups: 
  subtasks: Due Three: Tomorrow sub [1d] | Graph-Bandits: Oculus [-] | Graph-Bandits: https://jax-ml.github.io/scaling-book/ [-] | Graph-Bandits: Paper2Agent [-] | Graph-Bandits: Position leads [-] | Graph-Bandits: Emails [-] | Stream-Anomaly: Stream sub 1 [-] | Stream-Anomaly: Stream sub 2 [-] | App Sub: App subtask [-] | Main Tasks: Oculus [-] | Main Tasks: https://jax-ml.github.io/scaling-book/ [-] | Main Tasks: Paper2Agent [-] | Main Tasks: Position leads [-] | Main Tasks: Emails [-] | Three Subs: Sub A [-] | Three Subs: Sub B [-] | Snoozed Task: Sub X [-] | Snoozed Task: Sub Y [-] | Ongoing Task: Ongoing sub 1 [-] | Ongoing Task: Ongoing sub 2 [-] | Due Three: Undated sub [-] | Due Four: Four sub [-] | Early-Career Fellowship: Scheme subtask [-]
  tasks: ROW Due One [1d] || ROW Due Three [3d] || ROW Due Four [4d] || ROW Due Nine [9d] || ROW Stream-Anomaly [-] || ROW Main Tasks [-] || ROW Plain Task [-] || ROW All Done Task [-] || ROW Three Subs [-]
  hasTasks=true
  snoozed: Snoozed Task [-] | Three Subs: Sub C [-]
case 16/21: work row actions=status:todo,status:done,status:dropped,status:ongoing,agent,snooze:7,snooze:30,snooze:hide,remove kept=status:done
case 23: work row under unsaved tasks.yml: status:todo(disabled "tasks.yml has unsaved text in a tab; save or revert it first"), status:done(disabled "tasks.yml has unsaved text in a tab; save or revert it first"), status:dropped(disabled "tasks.yml has unsaved text in a tab; save or revert it first"), status:ongoing(disabled "tasks.yml has unsaved text in a tab; save or revert it first"), agent, snooze:7(disabled "tasks.yml has unsaved text in a tab; save or revert it first"), snooze:30(disabled "tasks.yml has unsaved text in a tab; save or revert it first"), snooze:hide(disabled "tasks.yml has unsaved text in a tab; save or revert it first"), remove(disabled "tasks.yml has unsaved text in a tab; save or revert it first")
case 14: lines one:One's subtask, two:Two's subtask, one:Work, two:Work
  followups: 
  subtasks: Work: One's subtask [-] | Work: Two's subtask [-]
  tasks: ROW Work [-] || ROW Work [-]
  hasTasks=true
case 17: self=flt:dana-example kept lines: Role Task: Mine sub [-] hidden.tasks=1
  followups: 
  subtasks: Role Task: Mine sub [-]
  tasks: 
  hasTasks=true
case 18: nothing
  followups: 
  subtasks: 
  tasks: 
  hasTasks=false
```

Each case of the brief on the unchanged tree:

1. Lead 10 days ahead: program, `case 1`: kind `position`, glyph `scout`, group "positions", tail "position deadline in 10d". As the brief says.
2. Application 20 days ahead: program, `case 2`: kind `position`, glyph `scout`, group "positions", tail "position deadline in 20d".
3. Application 5 days past: program, `case 3`: overdue, "application 5d ago".
4. Group order: program, `case 4`: one `position` group holding the lead and the application, after `funding` and before nothing else dated; the words are paper, funding, event, teaching, position, task, conference.
5. Lead with status `applied`: program, `case 5`: no line.
6. Demo hub at 2026-08-25: program, `case 6`: "Lecturer in Data Science" 5d and "Assistant Professor, Machine Learning" 21d, both kind `position`; the applied postdoc and the 2027 lead give none. As the brief says.
7. The task `Main Tasks`, `doing`, five undated subtasks: program, hub A: `ROW Main Tasks [-]` in tasks, the five `Main Tasks: ...` in subtasks.
8. A task with no subtasks: program: `ROW Plain Task [-]`.
9. A task whose subtasks are all done: program: `ROW All Done Task [-]`, no D1 or D2 anywhere.
10. Three subtasks, one snoozed: program: `Three Subs: Sub A`, `Sub B` in subtasks, `Three Subs: Sub C` in snoozed.
11. A snoozed task with two subtasks: program: `Snoozed Task` in snoozed, `Snoozed Task: Sub X`, `Sub Y` in subtasks.
12. A task with status `ongoing` (added to the planted schema's options): program: no `Ongoing Task` line, its two subtasks in subtasks.
13. A project's, a scheme's and an application's subtask: program: `Graph-Bandits: ...`, `Early-Career Fellowship: Scheme subtask` and `App Sub: App subtask` in subtasks.
14. Two hubs each with a task `work` and one subtask: program, `case 14`: both tasks plain rows, both subtasks in subtasks.
15. Task due in 3d with a subtask due tomorrow and one undated: program: `ROW Due Three [3d]`, `Due Three: Tomorrow sub [1d]` first in subtasks and `Due Three: Undated sub [-]` among the undated.
16. The task row's buttons: program, `case 16/21`: `status:todo,status:done,status:dropped,status:ongoing,agent,snooze:7,snooze:30,snooze:hide,remove`.
17. Filter hides the task by role, keeps a subtask naming the user: program, `case 17`: the subtask in subtasks, `hidden.tasks=1`.
18. Nothing: program, `case 18`: `hasTasks=false`; `Tasks.svelte:66` `anything` is `hasTasks(lines) || hidden > 0`, so the section draws nothing.
19. A project with an undated `deadline:` and two subtasks: program: `ROW Stream-Anomaly [-]` in tasks, `Stream-Anomaly: Stream sub 1`, `Stream sub 2` in subtasks.
20. Labels: program: `Main Tasks: Oculus`, `Main Tasks: https://jax-ml.github.io/scaling-book/`, `Main Tasks: Paper2Agent`, `Main Tasks: Position leads`, `Main Tasks: Emails` in that order, and the project's `Graph-Bandits: ...` in the same order.
21. Kept button: program, `case 16/21`: `kept=status:done` for the `doing` task.
22. Keyboard: reading. `Ticker.svelte:80-86` draws a picked row's name as a `<button class="name">` (the task line has `entry`, `rows.ts:289-291` `opens`), so Tab reaches it; `onfocusin` on the list (`Ticker.svelte:63`) opens the row (`reveal.svelte.ts` `into`); Enter presses the button, whose `onclick` calls `onpick`, `Tasks.svelte` `pick`, `openLine`.
23. Unsaved tasks file: program, `case 23`: every button but `agent` disabled with "tasks.yml has unsaved text in a tab; save or revert it first".
24. Remove: reading. `Tasks.svelte:87-95` `run` sets `asking` from `removeAsked`, and the `{#key}` at `:146` draws one `DeleteAsk` for the entry it names, so a second Remove replaces the first question.
25. Two plain dated tasks and one dated with subtasks: program: `ROW Due One [1d] || ROW Due Three [3d] || ROW Due Four [4d] || ROW Due Nine [9d]`, the Tasks group in date order.

No case of the brief is one its rules get wrong: every first-run result is the "unchanged tree" result the brief gives or implies, so no case was handed back.

## The case-run program

Source, `<scratch>/O103-caserun/tests/cases.test.ts` (final form), run by the config below it; both and the folder holding them are gone (`ls .../scratchpad/O103-caserun` prints "No such file or directory"), and the twelve temporary workspace-state folders its `published` calls made were removed by name (a `grep -rqs "o103-cases-"` over the temporary folder's `oculus-workspace-state-*` now finds none).

```ts
// Case-run program of O103: prints each case's state half; asserts nothing about the cases.
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync, appendFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { parse } from 'yaml';
import { expect, it } from 'vitest';
import {
    engineDir,
    glyphCatalog,
    loadConfig,
    textCatalog
} from '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O103/src/lib/data/sources/config.ts';
import {
    bareId,
    collectionFiles,
    rootOf
} from '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O103/src/lib/data/helpers/hub-names.ts';
import {
    setCatalog,
    setGlyphs,
    t
} from '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O103/src/lib/state/shared/words/text.ts';
import * as tick from '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O103/src/lib/state/boards/ticker.ts';
import { focusPage } from '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O103/src/lib/state/boards/focus/filter.ts';
import {
    dateTail,
    fileBlock,
    rowMaker
} from '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O103/src/lib/views/boards/focus/rows.ts';
import { published } from '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O103/tests/data/hubs/hubs-fixture.ts';

const WT = '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O103';
const DEMO = join(WT, 'tests/fixtures/hubs/demo');
const { config: CONFIG } = loadConfig(engineDir());
setCatalog(textCatalog(CONFIG));
setGlyphs(glyphCatalog(CONFIG));
const NOW = new Date(2026, 7, 25, 12).getTime();
const BASE = mkdtempSync(join(tmpdir(), 'o103-cases-'));
const OUT: string[] = [];
const say = (text: string): void => {
    OUT.push(text);
};

function hub(name: string, files: Record<string, string>, append: Record<string, string> = {}) {
    const dir = join(BASE, name);
    cpSync(DEMO, dir, { recursive: true });
    for (const [path, text] of Object.entries(files)) writeFileSync(join(dir, path), text);
    for (const [path, text] of Object.entries(append)) appendFileSync(join(dir, path), text);
    return dir;
}

function listsOf(dirs: Record<string, string>) {
    const lists: Record<string, unknown> = {};
    for (const [name, dir] of Object.entries(dirs)) {
        const own = parse(readFileSync(join(dir, '.oculus/config.yml'), 'utf8'));
        lists[name] = { collections: collectionFiles(own.collections) };
    }
    return { lists, ownCollections: collectionFiles(CONFIG.collections) } as never;
}

const categories = tick.tickerCategories(CONFIG);
/** CommandCenter.svelte:87-95 `noun`, and the generic tails of `overdueTail` and `deadlineTail`. */
function noun(line: tick.TickerItem, overdue: boolean): string {
    const category = categories.find((one) => one.key === line.kind);
    const key = overdue ? category?.overdueNoun : category?.noun;
    return key === undefined ? '' : t(key);
}
const groupOf = (kind: string): string => {
    const c = categories.find((one) => one.key === kind);
    return c?.label === undefined ? '?' : t(c.label);
};
const cmdLine = (line: tick.TickerItem, overdue = false): string =>
    `kind=${line.kind} glyph=${line.glyph} group="${groupOf(line.kind)}" tail="${
        overdue
            ? t('focus.command.overdue_generic', noun(line, true), -(line.days ?? 0))
            : t('focus.command.generic_in', noun(line, false), line.days ?? 0)
    }"`;

const days = (line: tick.TickerItem): string => (line.days === null ? '-' : `${line.days}d`);
const sub = (line: tick.TickerItem): string => `${line.label} [${days(line)}]`;
function groups(lines: tick.TickerItem[]): string[] {
    const g = tick.taskGroups(lines) as unknown as Record<string, unknown[]>;
    const tasks = g.tasks.map((one) => {
        const held = one as { line?: tick.TickerItem; subtasks?: tick.TickerItem[] };
        if (held.line === undefined) return `ROW ${sub(one as tick.TickerItem)}`;
        if ((held.subtasks ?? []).length === 0) return `ROW ${sub(held.line)}`;
        return `HEAD ${held.line.root}:${sub(held.line)} > ${(held.subtasks ?? [])
            .map((s) => `${s.root}:${s.subtaskDo} [${days(s)}]`)
            .join(' | ')}`;
    });
    return [
        `  followups: ${(g.followups as tick.TickerItem[]).map(sub).join(' | ')}`,
        `  subtasks: ${(g.subtasks as tick.TickerItem[]).map(sub).join(' | ')}`,
        `  tasks: ${tasks.join(' || ')}`,
        `  hasTasks=${tick.hasTasks(g as never)}`
    ];
}

const TASKS_SCHEMA = `title: Tasks
schema:
  - { field: key, type: text, primary_key: true, required: true }
  - { field: title, type: text, display: 1, required: true }
  - { field: status, type: select, options: [todo, doing, done, dropped, ongoing], required: true }
  - { field: deadline, type: date }
  - { field: kind, type: text }
  - { field: collaborators, type: tags }
entries:
`;

it('O103 cases', () => {
    // Hub A: the leads, applications, tasks, a project's and a scheme's subtasks.
    const a = hub(
        'hub',
        {
            '.oculus/data/academic/leads.yml': `entries:
  - { title: "Lead Ten", status: open, deadline: "2026-09-04" }
  - { title: "Lead Applied", status: applied, deadline: "2026-08-30" }
`,
            '.oculus/data/academic/applications.yml': `title: Applications
schema:
  - { field: key, type: text, primary_key: true, required: true }
  - { field: title, type: text, display: 1, required: true }
  - { field: status, type: select, options: [in-prep, applied, rejected, declined, withdrawn] }
  - { field: deadline, type: date }
entries:
  - { key: app-twenty, title: "App Twenty", status: in-prep, deadline: "2026-09-14" }
  - { key: app-overdue, title: "App Overdue", status: in-prep, deadline: "2026-08-20" }
  - { key: app-sub, title: "App Sub", status: in-prep, subtasks: ["App subtask"] }
`,
            '.oculus/data/academic/tasks.yml': `${TASKS_SCHEMA}  - key: work
    title: "Main Tasks"
    status: doing
    subtasks: ["Oculus", "https://jax-ml.github.io/scaling-book/", "Paper2Agent", "Position leads", "Emails"]
  - { key: plain, title: "Plain Task", status: todo }
  - key: alldone
    title: "All Done Task"
    status: todo
    subtasks: [{ do: D1, done: true }, { do: D2, done: true }]
  - key: threesubs
    title: "Three Subs"
    status: todo
    subtasks: ["Sub A", "Sub B", { do: "Sub C", snooze: "2026-12-01" }]
  - key: snoozedtask
    title: "Snoozed Task"
    status: todo
    snooze: true
    subtasks: ["Sub X", "Sub Y"]
  - key: ongoingtask
    title: "Ongoing Task"
    status: ongoing
    subtasks: ["Ongoing sub 1", "Ongoing sub 2"]
  - key: due3
    title: "Due Three"
    status: todo
    deadline: "2026-08-28"
    subtasks: ["Undated sub", { do: "Tomorrow sub", deadline: "2026-08-26" }]
  - { key: due1, title: "Due One", status: todo, deadline: "2026-08-26" }
  - { key: due9, title: "Due Nine", status: todo, deadline: "2026-09-03" }
  - key: due4
    title: "Due Four"
    status: todo
    deadline: "2026-08-29"
    subtasks: ["Four sub"]
`
        },
        {
            'projects/active/graph-bandits/project.yml':
                'subtasks: ["Oculus", "https://jax-ml.github.io/scaling-book/", "Paper2Agent", "Position leads", "Emails"]\n',
            'projects/active/streaming-anomaly/project.yml':
                'subtasks: ["Stream sub 1", "Stream sub 2"]\n'
        }
    );
    const streamPath = join(a, 'projects/active/streaming-anomaly/project.yml');
    writeFileSync(
        streamPath,
        readFileSync(streamPath, 'utf8').replace('deadline: "2026-08-15"', 'deadline: "when ready"')
    );
    const fundingPath = join(a, '.oculus/data/academic/funding.yml');
    writeFileSync(
        fundingPath,
        readFileSync(fundingPath, 'utf8').replace(
            '    key: ecf\n',
            '    key: ecf\n    subtasks: ["Scheme subtask"]\n'
        )
    );
    const snapA = published([{ name: 'hub', dir: a }], 'hub').snapshot;
    const lists = listsOf({ hub: a });
    const weekA = tick.ticker(snapA, CONFIG, NOW, undefined, lists);
    const line = (label: string, from: tick.TickerItem[]) =>
        from.find((one) => one.label === label);
    const leadTen = line('Lead Ten', weekA.deadlines);
    say(`case 1: ${leadTen === undefined ? 'no line' : cmdLine(leadTen)} days=${leadTen?.days}`);
    const app20 = line('App Twenty', weekA.deadlines);
    say(`case 2: ${app20 === undefined ? 'no line' : cmdLine(app20)}`);
    const appOver = line('App Overdue', weekA.overdue);
    say(`case 3: ${appOver === undefined ? 'no line' : `overdue ${cmdLine(appOver, true)}`}`);
    say(
        `case 4: groups in order: ${tick
            .deadlinesByCategory(weekA.deadlines, categories)
            .map((one) => `${one.category.key}(${one.lines.map((l) => l.label).join(', ')})`)
            .join(' ')}; category words: ${categories.map((one) => one.key).join(', ')}`
    );
    const applied = [...weekA.deadlines, ...weekA.overdue, ...weekA.tasks, ...weekA.snoozed].find(
        (one) => one.label === 'Lead Applied'
    );
    say(`case 5: ${applied === undefined ? 'no line' : `line ${applied.kind}`}`);

    // Case 6: the demo hub as shipped.
    const demo = hub('demo', {});
    const snapD = published([{ name: 'demo', dir: demo }], 'demo').snapshot;
    const weekD = tick.ticker(snapD, CONFIG, NOW, undefined, listsOf({ demo }));
    say(
        `case 6: ${weekD.deadlines
            .filter((one) => one.target?.kind === 'lead')
            .map((one) => `"${one.label}" ${one.days}d kind=${one.kind}`)
            .join('; ')} | lead roots: ${(snapD.entities.feeds.leads ?? [])
            .map((one) => rootOf(one))
            .join(',')}`
    );

    say('tasks section of hub A:');
    for (const row of groups(weekA.tasks)) say(row);
    say(`  snoozed: ${weekA.snoozed.map(sub).join(' | ')}`);

    // Cases 16, 21, 23: the rows of the task line `work`, and with its file unsaved.
    const work = weekA.tasks.find((one) => one.label === 'Main Tasks');
    const made = rowMaker('t');
    if (work !== undefined) {
        const row = made.row(work, dateTail(work));
        say(
            `case 16/21: work row actions=${(row.actions ?? []).map((one) => one.id).join(',')} kept=${made.kept(row)}`
        );
    }
    const collections = Object.values(snapA.entities.collections);
    const client = {
        selectors: {
            collectionsOfKey: (key: string) => collections.filter((one) => bareId(one) === key),
            configMap: () => CONFIG
        },
        fs: { primary: () => 'hub', roots: () => [] },
        source: { unsavedFile: (_root: string, path: string) => path.endsWith('tasks.yml') }
    } as never;
    const blocked = rowMaker('t', fileBlock(client));
    if (work !== undefined) {
        const row = blocked.row(work, dateTail(work));
        say(
            `case 23: work row under unsaved tasks.yml: ${(row.actions ?? [])
                .map((one) => `${one.id}${one.disabled === true ? `(disabled "${one.title}")` : ''}`)
                .join(', ')}`
        );
    }

    // Case 14: two hubs, each with a task `work` holding one subtask.
    const one = hub('one', {
        '.oculus/data/academic/tasks.yml': `${TASKS_SCHEMA}  - { key: work, title: "Work", status: doing, subtasks: ["One's subtask"] }\n`
    });
    const two = hub('two', {
        '.oculus/data/academic/tasks.yml': `${TASKS_SCHEMA}  - { key: work, title: "Work", status: doing, subtasks: ["Two's subtask"] }\n`
    });
    const snap2 = published(
        [
            { name: 'one', dir: one },
            { name: 'two', dir: two }
        ],
        'one'
    ).snapshot;
    const week2 = tick.ticker(snap2, CONFIG, NOW, undefined, listsOf({ one, two }));
    const ours = week2.tasks.filter(
        (l) => l.label === 'Work' || (l.subtaskDo ?? '').includes('subtask')
    );
    say(
        `case 14: lines ${ours
            .map((l) => `${l.root}:${l.subtaskDo ?? l.label}`)
            .join(', ')}`
    );
    for (const row of groups(ours)) say(row);

    // Case 17: the Role filter hides a task by its collaborators and keeps its subtask that names the user as lead.
    const flt = hub('flt', {
        '.oculus/data/academic/tasks.yml': `${TASKS_SCHEMA}  - key: roletask
    title: "Role Task"
    status: todo
    collaborators: [dana-example]
    subtasks: [{ do: "Mine sub", lead: dana-example }]
`
    });
    const snapF = published([{ name: 'flt', dir: flt }], 'flt').snapshot;
    const self = Object.keys(snapF.entities.people).filter((id) => id.endsWith('dana-example'));
    const scope = {
        self: new Set(self),
        hubs: ['flt'],
        wordsOf: (() => CONFIG) as never,
        lists: listsOf({ flt })
    };
    const page = focusPage(
        snapF,
        CONFIG,
        NOW,
        { mine: false, roles: ['collaborator'], tiers: [], pillars: [], hubs: [] },
        scope
    );
    const kept = page.sections.week.tasks.filter((l) => /Role Task|Mine sub/.test(l.label));
    say(`case 17: self=${self.join(',')} kept lines: ${kept.map(sub).join(' | ')} hidden.tasks=${page.hidden.tasks}`);
    for (const row of groups(kept)) say(row);

    say('case 18: nothing');
    for (const row of groups([])) say(row);

    console.log(`\n${OUT.join('\n')}\n`);
    rmSync(BASE, { recursive: true, force: true });
    expect(OUT.length).toBeGreaterThan(0);
}, 60000);
```

Its config, `<scratch>/O103-caserun/case.config.mts`, the worktree's own vite config with the projects taken out and the test folder set to the scratch folder:

```ts
import base from '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O103/vite.config.ts';

const SCRATCH =
    '/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/O103-caserun';

export default async (env: { mode: string; command: string }) => {
    const made = await (base as unknown as (e: unknown) => Promise<Record<string, any>>)(env);
    const test = { ...made.test };
    delete test.projects;
    test.environment = 'node';
    test.dir = SCRATCH;
    test.include = ['tests/*.test.ts'];
    test.maxWorkers = 1;
    return { ...made, test };
};
```

Final run, after the last change, the lines as printed (exit 0, `Tests  1 passed (1)`):

```
case 1: kind=lead glyph=scout group="position leads" tail="lead deadline in 10d" days=10
case 2: kind=position glyph=inbox group="applications" tail="position deadline in 20d"
case 3: overdue kind=position glyph=overdue group="applications" tail="application 5d ago"
case 4: groups in order: paper(Graph-Transfer) funding(Early-Career Fellowship) position(App Twenty) lead(Lead Ten); category words: paper, funding, event, teaching, position, lead, task, conference
case 5: no line
case 6: "Lecturer in Data Science" 5d kind=lead; "Assistant Professor, Machine Learning" 21d kind=lead | lead roots: demo,demo,demo
tasks section of hub A:
  followups: 
  subtasks: Graph-Bandits: Oculus [-] | Graph-Bandits: https://jax-ml.github.io/scaling-book/ [-] | Graph-Bandits: Paper2Agent [-] | Graph-Bandits: Position leads [-] | Graph-Bandits: Emails [-] | Stream-Anomaly: Stream sub 1 [-] | Stream-Anomaly: Stream sub 2 [-] | App Sub: App subtask [-] | Snoozed Task: Sub X [-] | Snoozed Task: Sub Y [-] | Ongoing Task: Ongoing sub 1 [-] | Ongoing Task: Ongoing sub 2 [-] | Early-Career Fellowship: Scheme subtask [-]
  tasks: ROW Due One [1d] || HEAD hub:Due Three [3d] > hub:Tomorrow sub [1d] | hub:Undated sub [-] || HEAD hub:Due Four [4d] > hub:Four sub [-] || ROW Due Nine [9d] || ROW Stream-Anomaly [-] || HEAD hub:Main Tasks [-] > hub:Oculus [-] | hub:https://jax-ml.github.io/scaling-book/ [-] | hub:Paper2Agent [-] | hub:Position leads [-] | hub:Emails [-] || ROW Plain Task [-] || ROW All Done Task [-] || HEAD hub:Three Subs [-] > hub:Sub A [-] | hub:Sub B [-]
  hasTasks=true
  snoozed: Snoozed Task [-] | Three Subs: Sub C [-]
case 16/21: work row actions=status:todo,status:done,status:dropped,status:ongoing,agent,snooze:7,snooze:30,snooze:hide,remove kept=status:done
case 23: work row under unsaved tasks.yml: status:todo(disabled "tasks.yml has unsaved text in a tab; save or revert it first"), status:done(disabled "tasks.yml has unsaved text in a tab; save or revert it first"), status:dropped(disabled "tasks.yml has unsaved text in a tab; save or revert it first"), status:ongoing(disabled "tasks.yml has unsaved text in a tab; save or revert it first"), agent, snooze:7(disabled "tasks.yml has unsaved text in a tab; save or revert it first"), snooze:30(disabled "tasks.yml has unsaved text in a tab; save or revert it first"), snooze:hide(disabled "tasks.yml has unsaved text in a tab; save or revert it first"), remove(disabled "tasks.yml has unsaved text in a tab; save or revert it first")
case 14: lines one:One's subtask, two:Two's subtask, one:Work, two:Work
  followups: 
  subtasks: 
  tasks: HEAD one:Work [-] > one:One's subtask [-] || HEAD two:Work [-] > two:Two's subtask [-]
  hasTasks=true
case 17: self=flt:dana-example kept lines: Role Task: Mine sub [-] hidden.tasks=1
  followups: 
  subtasks: Role Task: Mine sub [-]
  tasks: 
  hasTasks=true
case 18: nothing
  followups: 
  subtasks: 
  tasks: 
  hasTasks=false
```

## Result per case, after the change

A `HEAD` line of the program is a task `Tasks.svelte` draws as a heading row with the listed subtasks as rows under it, each labelled by its `subtaskDo` (`Tasks.svelte` `task`: `label: one.subtaskDo ?? one.label, under: true`); a `ROW` line is a plain row.

| Case | Expected | Proof and its output |
| --- | --- | --- |
| 1 | kind `lead`, glyph `scout`, under "position leads", "lead deadline in 10d" | program `case 1`: `kind=lead glyph=scout group="position leads" tail="lead deadline in 10d"`; drawn by `CommandCenter.svelte` `deadlineTail` (`generic_in`), look |
| 2 | kind `position`, glyph `inbox`, "applications", "position deadline in 20d" | program `case 2`: `kind=position glyph=inbox group="applications" tail="position deadline in 20d"` |
| 3 | "application 5d ago" | program `case 3`: `tail="application 5d ago"`, group now "applications" |
| 4 | `position` before `lead`, after `teaching`, before `task` | program `case 4`: `position(App Twenty) lead(Lead Ten)`; words `teaching, position, lead, task` |
| 5 | no line | program `case 5`: `no line` |
| 6 | two lead lines of kind `lead` | program `case 6`: `"Lecturer in Data Science" 5d kind=lead; "Assistant Professor, Machine Learning" 21d kind=lead` |
| 7 | one task, five subtasks under it, none in Subtasks | program: `HEAD hub:Main Tasks [-] > hub:Oculus ... hub:Emails`, no `Main Tasks:` in subtasks; heading drawn by `Ticker.svelte` `li.heading`, look |
| 8 | plain row | program: `ROW Plain Task [-]` |
| 9 | plain row | program: `ROW All Done Task [-]` |
| 10 | two rows under, snoozed one in Snoozed | program: `HEAD hub:Three Subs [-] > hub:Sub A [-] \| hub:Sub B [-]`; snoozed `Three Subs: Sub C` |
| 11 | task in Snoozed, subtasks in Subtasks | program: snoozed `Snoozed Task`; subtasks `Snoozed Task: Sub X`, `Sub Y` |
| 12 | no task line, subtasks in Subtasks | program: subtasks `Ongoing Task: Ongoing sub 1`, `Ongoing sub 2`; no `Ongoing Task` line |
| 13 | all three in Subtasks | program: `Graph-Bandits: ...`, `App Sub: App subtask`, `Early-Career Fellowship: Scheme subtask` in subtasks |
| 14 | two headings, each its own hub's subtask | program `case 14`: `HEAD one:Work [-] > one:One's subtask [-] \|\| HEAD two:Work [-] > two:Two's subtask [-]` |
| 15 | heading "in 3d" in its tone; dated subtask first | program: `HEAD hub:Due Three [3d] > hub:Tomorrow sub [1d] \| hub:Undated sub [-]`; tail and tone from `rowMaker` `row` (`daysTone(3)` amber, `DEADLINE_SOON` 14 at `presets.ts:356`) |
| 16 | same action ids, same order | program `case 16/21` prints the same ids as the first run; the heading is `{ ...own, heading: true }` of that row (`Tasks.svelte` `task`) |
| 17 | subtask in Subtasks, hidden count as before the change | program `case 17`: `subtasks: Role Task: Mine sub [-]`, `hidden.tasks=1`, both as in the first run |
| 18 | nothing drawn | program `case 18`: `hasTasks=false`; `anything` at `Tasks.svelte:86` |
| 19 | project row in Tasks, subtasks in Subtasks | program: `ROW Stream-Anomaly [-]`; subtasks `Stream-Anomaly: Stream sub 1`, `Stream sub 2` |
| 20 | "Oculus", the URL, "Paper2Agent", "Position leads", "Emails"; project keeps `<project>: <do>` | program: `hub:Oculus ... hub:Emails` in that order under the heading; subtasks `Graph-Bandits: Oculus` and so on |
| 21 | status button kept | program `case 16/21`: `kept=status:done`; `kept` is keyed by row id (`rows.ts:321`), which the spread keeps; drawing, look |
| 22 | Tab reaches the title, Enter opens the page | reading: the heading is a row of the same `<ul>` with the same name button and `onfocusin` reveal (`Ticker.svelte`); look |
| 23 | disabled with the file's words | program `case 23`: every button but `agent` disabled with "tasks.yml has unsaved text in a tab; save or revert it first" |
| 24 | Delete question for that task; second Remove asks about the second alone | reading: the heading row's id indexes the task line (`rowMaker` `index`), so `run` gives `removeAsked` that line; `{#key}` at `Tasks.svelte:166`; look |
| 25 | 1d, heading at 4d, 9d | program: `ROW Due One [1d] \|\| HEAD hub:Due Three [3d] ... \|\| HEAD hub:Due Four [4d] ... \|\| ROW Due Nine [9d]` |

## DONE / NOT DONE

| Deliverable | State | Proof, last line of the run |
| --- | --- | --- |
| 1. Ticker word `lead` after `position`, `position` kept with its four fields | DONE | `git diff config/catalogs/vocab.yml`: one line added, `lead: { label: focus.command.dlcat_lead, glyph: focus.command.glyph_lead, noun: focus.command.word_lead_deadline }` |
| 1. Words `dlcat_position: applications`, `glyph_position: inbox`, `dlcat_lead`, `glyph_lead`, `word_lead_deadline` in alphabetical place | DONE | `git diff config/text/views/boards/focus.yml`: `+dlcat_lead: position leads` after `dlcat_funding`, `+glyph_lead: scout` after `glyph_funding`, `+word_lead_deadline: lead deadline` after `word_funding` |
| 1. `sources.yml:50` and the demo hub's leads row `category: lead` | DONE | check 3 below |
| 1. Leads loop comment and local name | DONE | check 4 below; the local is `scouted` (`ticker.ts:360`) |
| 2. Task with open subtasks as a heading row with its subtasks under it | DONE | program, cases 7, 10, 14, 15, 20, 25 above; drawing at the look |
| 2. Heading as a field of `TickerRow` drawn by `Ticker.svelte` | DONE | `git diff src/lib/ui/display/ticker`: `heading?: boolean`, `under?: boolean`, `class:heading`, `class:under` |
| 2. Grouping in `taskGroups`, `hasTasks` counting every line once | DONE | `git diff src/lib/state/boards/ticker.ts`; program `hasTasks=` lines |
| 2. `Tasks.svelte` head comment states the grouping; no new view component, so no move | DONE | `git diff src/lib/views/boards/focus/Tasks.svelte` |
| Check 1: `npm run test:quick` | DONE | `test:quick: 68.9 s; every command passed` |
| Check 2: character set over the changed files | DONE | `LC_ALL=C grep -n '[^ -~]'` over the five files outside `config/` printed nothing, `grep exit 1`; the perl form of `spec.md:102` over the three `config/` files printed nothing, `perl exit 0` (perl exits 0 with no match; its output is empty) |
| Check 3: `grep -rn --exclude=local.yml "category: position" config tests` | DONE | exactly `config/defaults/sources.yml:47:` and `tests/fixtures/hubs/demo/.oculus/config.yml:20:` (both the applications rows) |
| Check 4: `grep -rn "same group as the applications" src` | DONE | printed nothing, `grep exit 1` |
| Check 5: case-run program gives cases 1 to 18 their expected results; program gone | DONE | final run above; `ls .../scratchpad/O103-caserun`: "No such file or directory" |
| Check 6: no test added or changed | DONE | `git status --short` lists no file under `tests/` but the fixture `tests/fixtures/hubs/demo/.oculus/config.yml` |
| Check 7: new list items and sentences read against the standards page | DONE | see "Sentences read against the standards page" |
| Doc text for `docs/HELP.md:295` and `docs/templates.md:90` | DONE | the "Doc text" section |

`npm run test:quick` printed, after its list of 13 test files:

```
ok      prettier (1.2 s): All matched files use Prettier code style!
ok      ASCII gate (1.3 s)
ok      svelte-kit sync (2.6 s)
ok      vitest (22.5 s): Duration  14.55s (transform 19.99s, setup 0ms, import 33.86s, tests 7.89s, environment 1ms)
ok      eslint (45.0 s)
ok      svelte-check (60.7 s): 1793286380120 COMPLETED 560 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest checks (66.2 s): Duration  58.06s (transform 29.30s, setup 0ms, import 75.16s, tests 81.48s, environment 2ms)
test:quick: 68.9 s; every command passed
test:quick: not covered: tests that reach no changed file within the import depth,
            other than the checks under tests/checks/source and tests/checks/tree,
            which run for any change under src, tests or utils; the build, the lint
            of unchanged files
```

No test is added or changed: no entry of `agents/guarded.md` covers the ticker, the Focus sections or the Command Center, and a new entry is the user's.

Runs: `npm run test:quick` once, after the last change, with `npm run diagrams` right before it (exit 0). The case-run program three times (first run, after the change, final). One run of `tests/state/boards/board/board-new-project.test.ts` alone, to time a single file. Two runs of a one-line scratch probe as `npx vitest run --project unit --dir <scratch>/caserun` reached the unit project's own files under `tests/`, since `--dir` does not reach the configured projects: they were whole-suite runs of the unit project. The first was stopped with TaskStop after about three minutes; the second's output was cut by `head -30` and ended with exit 0. No `npm test`, `npm run test:checks`, `npm run test:landing` or `npm run test:slow` was run.

## Greps the rules ask for

After the name change (`spec.md:71`): `grep -rn --exclude=local.yml -e "category: position" -e "category: lead" -e "dlcat_position" -e "dlcat_lead" -e "glyph_position" -e "glyph_lead" -e "word_position_deadline" -e "word_lead_deadline" -e "word_application" src tests config docs README.md` printed the two `sources.yml` rows, the two demo hub rows, `vocab.yml:218-219`, the five `focus.yml` keys, and `docs/templates.md:87` and `:90`. `docs/templates.md:90` is the leads row this step does not write; its line is in "Doc text". `docs/templates.md:87` is the applications row and stays `position`. `grep -rn "taskGroups\|hasTasks\|TaskGroups\|TaskLine" src tests docs README.md` names only `ticker.ts` and `Tasks.svelte`.

History words (`spec.md:44`): `git diff -U0 -- src | grep '^+' | grep -v '^+++' | grep -n -i -E "before|used to|no longer|still|always has been|always had|as before|previously|the step adds|after this package|O[0-9]+|20[0-9][0-9]-"` printed nothing on the final diff.

Comment width: the same added lines checked with `awk '{ if (length($0)-1 > 100) print }'` printed nothing; `tests/checks/source/comment-width.test.ts` ran in the verify list's `vitest checks` line, ok.

Before writing a helper (`spec.md:88`): `grep -rn "taskGroups\|hasTasks\|TaskGroups\|TaskLine" src tests docs README.md` found no other grouping of task lines; `entryOfLine` is local to `ticker.ts`.

Unused exports: `sh utils/unused-exports.sh | grep -i -E "ticker|Tasks|rows"` printed `src/lib/state/boards/ticker.ts: dueFollowups, collectionStatuses, monthsAhead`, `src/lib/views/boards/focus/rows.ts: keptAction, actionsFor` and `RowIndex`, and lines of other `rows.ts` files. None names `TaskLine` or anything else the step added; `TaskLine` is imported by `Tasks.svelte`. The brief names no base list to compare against, so the lines it printed are not compared with a base run.

## Comments and documents re-read

- `ticker.ts` head comment: still true.
- `ticker.ts` `Ticker.tasks` doc comment: still true (the list's order did not change).
- `ticker.ts` `ticker()` doc comment: still true.
- `ticker.ts` entry-loop comment: rewritten ("applications on the shipped list") and rewrapped as one paragraph.
- `ticker.ts` leads-loop comment: rewritten.
- `ticker.ts` `TaskGroups`, `taskGroups`, `hasTasks` doc comments: rewritten; `TaskLine` and `entryOfLine` new.
- `Tasks.svelte` head comment: rewritten (second paragraph rewrapped, third paragraph new).
- `Ticker.svelte` head comment: a paragraph added; the rest still true.
- `ticker-rows.ts` head comment and `TickerRow` doc: still true; two fields added with their docs.
- `rows.ts` head comment: still true (file unchanged).
- `Focus.svelte` head comment ("the follow-ups, the subtasks and the entries of the tasks file"): still true.
- `config/catalogs/vocab.yml` comment above `ticker_categories`: still true (it names no word of the list).
- `config/defaults/sources.yml` comment on `ticker:`: still true.
- `docs/templates.md:410-414` (the commented `ticker_categories` text): still true.
- `docs/HELP.md:295`: rewritten in "Doc text".
- `docs/templates.md:90`: rewritten in "Doc text".

## Sentences read against the standards page

The configuration's standards page is `.scratch/migration/agents/spec.md`; it holds no rule on list items or sentence length beyond plain prose (`spec.md:21`) and whole-paragraph wrapping at 100 columns (`spec.md:45`). The new comment sentences and the Doc text sentences were read against those: no em dash, no 'not X but Y' construction, every edited comment paragraph rewrapped whole. The longest new sentence is the `taskGroups` doc's second sentence (the match by hub, collection and entry id, and the cases that leave a subtask in Subtasks); it keeps the cases in one sentence because they are the one rule a reader of the function needs, and splitting it would separate the rule from its exceptions.

## Terms

Oculus has no `docs/glossary.md` (`ls docs/glossary.md`: "No such file or directory").

## Files changed

From `git diff --numstat` (added, removed) and `wc -l` after the last change:

| File | Added / removed | Lines | In the write list |
| --- | --- | --- | --- |
| `config/catalogs/vocab.yml` | 1 / 0 | 308 | yes, line 219 inside 211-219 |
| `config/defaults/sources.yml` | 1 / 1 | 114 | yes, line 50 |
| `config/text/views/boards/focus.yml` | 5 / 2 | 169 | yes |
| `src/lib/state/boards/ticker.ts` | 53 / 20 | 725 | yes |
| `src/lib/ui/display/ticker/Ticker.svelte` | 25 / 0 | 319 | yes |
| `src/lib/ui/display/ticker/ticker-rows.ts` | 7 / 0 | 50 | yes |
| `src/lib/views/boards/focus/Tasks.svelte` | 27 / 7 | 230 | yes |
| `tests/fixtures/hubs/demo/.oculus/config.yml` | 1 / 1 | 38 | yes, line 23 |
| `.scratch/migration/agents/reviews/O103-report.md` | new | | yes |

`rows.ts` is unchanged: the heading row is the task's own row from `rowMaker`, spread with `heading: true`. No file was moved, since the section gained no view component. Sizes stay under 880 and 520.

## Judgment calls the brief left open

1. A second field `under?: boolean` on `TickerRow`, beside `heading`, draws a row set in by a 1.25em left margin under its heading. Without it a plain task row that follows a heading's rows (case 25: the 9d task after the 4d heading) reads as one more subtask of that heading. The set-in is a margin, which `li.clientWidth` leaves out, so `reveal.svelte.ts` `room` measures the row's own width. The orchestrator may drop it; the heading then stands alone as the marker.
2. The heading style: the name in `font-weight: 600` in the ink colour, the row's own size and case, and `margin-top: 4px` above the heading row. The group label `.lbl` is 700, uppercase, accent; a plain row is 400.
3. Should two task lines name one entry (one hub, one collection, one id), its subtasks go under the first. The ticker gives one line per entry, so this does not arise from one file.
4. The heading row stays a list item with no `role="heading"`: a heading role on an `<li>` would take it out of the list a screen reader announces. A screen reader hears the heading as a row followed by rows; nothing announces that the set-in rows belong to it.
5. The Tasks group stays one block with `break-inside: avoid` (`Tasks.svelte` `.grp`), so a heading and its rows are kept together because the whole group is, as the group is kept together now.
6. The entry-loop comment of `ticker.ts` names "applications" where it said "positions" for the shipped list.

## Host- or user-visible changes, before and after

- Command Center, Deadlines, a hub with an open lead dated inside 21 days and an application dated inside 90 (the research hub shows the leads): before, one group "positions" with the scout glyph holding both, a lead's tail "position deadline in Nd". After, a group "applications" with the inbox glyph holding the application (tail "position deadline in Nd", overdue "application Nd ago"), then a group "position leads" with the scout glyph holding the lead, tail "lead deadline in Nd". Both sit after "teaching" and before "tasks".
- Focus page, Tasks section, the research hub's task `work` ("Main Tasks", five open subtasks): before, "Main Tasks" a plain row in Tasks, and "Main Tasks: Oculus" and four more in Subtasks. After, "Main Tasks" in bold as a heading row in Tasks at its place, with "Oculus", "https://jax-ml.github.io/scaling-book/", "Paper2Agent", "Position leads", "Emails" set in under it; the Subtasks group without them (it disappears when nothing else is in it). The heading keeps the task row's glyph, buttons, the status button drawn without hover, the reveal on hover and Tab, Enter opening the task's page, and Remove asking the Delete question under the section.
- The demo hub's fixture row for leads names `lead`, so a scratch server on the demo hub shows its two leads under "position leads".

## Anything in the brief wrong or impossible

Nothing. Every premise the brief states that the cases touch reproduced in the first run (the single `position` group, the subtasks of `work` in Subtasks, the label `<record>: <do>`).

## Limitations and sharp edges

- The gallery (`src/lib/views/system/gallery/Gallery.svelte`) draws sample ticker rows so the primitive's shape is visible under every theme, and it draws no heading or set-in row. It is outside the write list; a sample there would show the new variant under each theme.
- A subtask whose own line is snoozed while its task is drawn goes to the Snoozed group (case 10); a task whose only open subtasks are snoozed is a plain row.
- When the Focus filter hides a task line and keeps its subtask, the subtask returns to the Subtasks group labelled `<task>: <do>` (case 17), so one task's subtasks can sit in two places on two filter settings.
- The drawing half (the bold heading, the set-in, Tab, Enter, the kept button drawn, the Delete question) is checked only by reading; the look on landing is its proof.

## Doc text

`docs/HELP.md:295`, the command center's records. Current, as `grep -n -o "[^.]*command center holds the deadlines[^.]*\." docs/HELP.md` prints it:

```
295: The command center holds the deadlines and dates of the records: papers, venues, funding, positions, leads, events, teaching and joint work.
```

Replacement:

```
The command center holds the deadlines and dates of the records: papers, venues, funding, applications, position leads, events, teaching and joint work; applications and position leads are two groups, each with its own glyph.
```

`docs/HELP.md:295`, the Tasks section. Current, as `grep -n -o "Due follow-ups, open subtasks[^.]*\." docs/HELP.md` prints it:

```
295:Due follow-ups, open subtasks and the open entries of the tasks file are lines of the Tasks section, dated or not, whatever `deadline_horizon_days` says.
```

Replacement:

```
Due follow-ups, open subtasks and the open entries of the tasks file are lines of the Tasks section, dated or not, whatever `deadline_horizon_days` says. A task of the tasks file with open subtasks is drawn under Tasks as a subheading with its subtasks under it. The Subtasks group holds the subtasks of every other record, and those of a task whose own line is not drawn (snoozed, its status dropping it, or hidden by the filter).
```

`docs/templates.md:90`, the leads row. Current, as `grep -n "key: leads" docs/templates.md` prints it:

```
90:#   - { key: leads, file: ".oculus/data/academic/leads.yml", registry: leads, ticker: { category: position }, about: files.make_collection_line_leads }
```

Replacement:

```
#   - { key: leads, file: ".oculus/data/academic/leads.yml", registry: leads, ticker: { category: lead }, about: files.make_collection_line_leads }
```
