# D48 report, repair round 1: side projects take the research keys, and their live ones feed the Focus ticker

Items 1 to 9 of the repair round are done. Two things are NOT done, and both need a browser: the landing look of case 13 (the Personal card, including the related line) and the landing look of case 14 (Focus on TEST, including the two visible changes of this round). `npm run test:quick` finished in 122.5 s against its 45.0 s limit and printed `test:quick: over the time limit`, with every command in it passing; other agents' builds were running on the same machine. Two tests of other files (`tests/routes/edit/roots.test.ts` and `tests/server/machine/lsp/servers.test.ts`) failed in one earlier `test:quick` run, one by a 5000 ms timeout and one on an assertion that compared a list ending in `clangd` with a list of `/node` entries; both pass when run alone (`Tests  8 passed (8)`), neither file is changed by this step, and the `test:quick` run quoted below passed them.

## Open items from the state file

Copied at the time of writing from the main checkout's `tools/oculus/.scratch/migration/orchestrator-state.md` (`sed -n 226,229p`). The section holds no entry:

```
## Open items (only what Axel must rule on; every report tells him these in plain words, decisions first, until he has ruled)

An entry leaves this list for the closed log the moment Axel rules on it. What a review or a look found and no brief covered is not an open item: it is folded into an existing step in `plan.md` (Z468), never booked as a step of its own.
```

## The nine items of the repair round

| Item | State | Where |
|---|---|---|
| 1. Case 9's tests as rows of the guarded tables, no new `it` title | DONE | `tests/server/edit/writes.test.ts`, `tests/server/core/changes.test.ts`, `tests/routes/edit/undo/undo.test.ts`, `tests/data/snapshot/references.test.ts`; the proof is under "Test rows" below |
| 2. The duplicate row 'refuses a root id whose root is not among the served roots' | DONE | removed from `writes.test.ts`; the unserved root is the row `root:gone` of 'writes the changed field and nothing else' |
| 3. `textField` reads with `str`, `textsField` with `strings` | DONE | `src/lib/data/snapshot/normalise-personal.ts`; cases 2 and 3 re-run below |
| 4. An app's write reaches only `side:` side projects | DONE | `sidesFor` in `src/lib/server/edit/writes.ts:321`, used at lines 385, 415 and 430; `docs/apps.md` rows 417 and 419; one row in the G49 table of `tests/routes/edit/app-gate.test.ts` |
| 5. Head comment of `writes/manifest.ts` | DONE | lines 4-6 say the research rule for research manifests only; the side-project paragraph (lines 8-13) keeps the file rule |
| 6. Every refusal reason of `writes/manifest.ts` is a catalog line | DONE | `config/text/server.yml` group `manifest_write`, read with `words(...)`; grep below |
| 7. One planting helper and one `SIDE_MANIFEST` | DONE | `plantSides` and `SIDE_MANIFEST` in `tests/routes/edit/write-fixture.ts`, used by `tests/server/edit/writes-fixture.ts` |
| 8. An unheld `related` id is a tag with no press | DONE | `presets.ts`, `personal.ts`, `CardLinks.svelte`; before and after under "User-visible" |
| 9. The report | DONE | this file |

### Item 1 and 2: test rows

The tests of case 9 add no `it` or `describe` title. Titles of `it(` and `describe(` calls extracted from each changed test file and compared with the base copy: `0 titles added` in each of `writes.test.ts`, `changes.test.ts`, `undo.test.ts`, `app-gate.test.ts`, `references.test.ts`, `write-fixture.ts` and `writes-fixture.ts`. `grep -c -F '<title>' agents/guarded.md`, run from `tools/oculus/.scratch/migration/agents`, for every guarded title the diff touches:

```
1  <- writes the changed field and nothing else
1  <- ticks and reopens a line of a manifest
1  <- records one manifest field with the value it had and the value written
1  <- records a subtask ticked, a subtask added and a subtask taken out
1  <- writes a manifest field back, logs the undo, and undoes the undo
1  <- puts a subtask line back as it was
1  <- finds $name
1  <- refuses a write whose matched kind is not the open kind its header names
```

The rows, by file:

- `writes.test.ts`, 'writes the changed field and nothing else': `it.each(FIELD_ROWS)`, 11 rows. The research status line is the first row (the present test's input). Per side id (`side:idea`, `root:r`): a snooze set, a snooze woken (with the `removed` record at `SIDE_MANIFEST.indexOf('snooze')`), a latest line set, and a field outside `side_project_schema`, refused with 'the manifest schema does not name the field'. Then `side:gone` and `root:gone`, both `found: false`. Every file outside the row's target is asserted unchanged. The refusals are rows of this test, as the brief says.
- `writes.test.ts`, 'ticks and reopens a line of a manifest': `it.each(LINE_ROWS)`, rows research, `side:idea`, `root:r`, each a no-op write, add, done, reopen and delete; still tagged slow.
- `changes.test.ts`: 'records one manifest field with the value it had and the value written' is `it.each(MANIFEST_ROWS)` (research, `side:idea` by relative path, `root:r` by absolute path); 'records a subtask ticked, a subtask added and a subtask taken out' is `it.each(SUBTASK_ROWS)` (the collection entry, `side:idea`, `root:r`). Each row asserts `file`, `key`, `field`, `before`, `after` and `undo`.
- `undo.test.ts`: 'writes a manifest field back, logs the undo, and undoes the undo' is `it.each(FIELD_ROWS)` (research, then `side:idea` and `root:r`, each a snooze set and a snooze woken, byte-for-byte restore and redo); 'puts a subtask line back as it was' is `it.each(LINE_ROWS)` (the collection tick, then a tick and an added line for each side id). Neither is tagged slow, as the guarded tests were not, so every row runs in `npm test`.
- `references.test.ts`: the row 'a collaborators value of a side project manifest that names a person' is a row of the G66 table 'finds $name'.
- `app-gate.test.ts`: one row of the G49 table, 'the endpoint lets an app write a side project of the hub and answers not found for a repository root, leaving its file as it was', expecting `{hub: 200, root: 404, hubWritten: true, rootKept: true}`.

Rows with identical titles carry the row's name in each assertion message (`expect(x, row.name)`), so a failure names its row.

#### Test rows on the unchanged tree

The unchanged tree is `$TMPDIR/d48/unchanged/oculus`: the base copy plus a `node_modules` link and the test files of this step as they are after their last change; the old writer signatures are adapted in `writes.test.ts` by a shim of eight lines at its top (the unchanged writers take no list of side projects and no text catalog). Command: `npx vitest run tests/server/core/changes.test.ts tests/routes/edit/undo/undo.test.ts tests/routes/edit/app-gate.test.ts tests/data/snapshot/references.test.ts tests/server/edit/writes.test.ts --testTimeout 0 --hookTimeout 0`:

```
 Test Files  5 failed (5)
      Tests  24 failed | 78 passed (102)
```

The 24 failing rows and their assertion messages, as printed:

```
references.test.ts   finds 'a collaborators value of a side proje...'   a hit stands at the position: expected null not to be null
app-gate.test.ts     the endpoint lets an app write a side project of the hub ...   expected { hub: 404, root: 404, ...(2) } to deeply equal { hub: 200, root: 404, ...(2) }
changes.test.ts      records one manifest field ...        a side project of the hub: expected 404 to be 200
                                                           a side project of a served root: expected 404 to be 200
changes.test.ts      records a subtask ticked, ...         a side project of the hub: expected 404 to be 200
                                                           a side project of a served root: expected 404 to be 200
writes.test.ts       writes the changed field and nothing else   (8 rows) side:idea / root:r: a snooze set, a snooze woken,
                                                           a latest line set, a field outside side_project_schema:
                                                           expected { found: false, changed: [], ...(1) } to deeply equal { found: true, ... }
writes.test.ts       ticks and reopens a line of a manifest   side:idea: expected [] to deeply equal [ 'subtasks' ]
                                                           root:r: expected [] to deeply equal [ 'subtasks' ]
undo.test.ts         writes a manifest field back ...      (4 rows) side:idea / root:r: a snooze set, a snooze woken: expected 404 to be 200
undo.test.ts         puts a subtask line back as it was    (4 rows) side:idea / root:r: a tick, an added line: expected 404 to be 200
```

The rows that pass on both trees are the research rows of each table (they test what is preserved) and the two not-found rows `side:gone` and `root:gone` (on the unchanged tree a side id is already `found: false`). These rows are guards for what the new lookup must keep; none of them is offered as a proof of the change. Every other new row fails on the unchanged tree.

After the change, the same five files on the changed tree: `Test Files  5 passed (5)` and `Tests  102 passed (102)` inside the 14-file run quoted under the DONE table (`Test Files  14 passed (14)`, `Tests  188 passed (188)`).

#### Item 4 on the unchanged tree and on the round-0 tree

The new G49 row fails on the unchanged tree (`{ hub: 404, root: 404 }`, above) and fails on the tree as it was after round 0, where an app could write a repository root: `npx vitest run tests/routes/edit/app-gate.test.ts --testTimeout 0` in `$TMPDIR/d48/round0copy` printed `AssertionError: expected { hub: 200, root: 200, ...(2) } to deeply equal { hub: 200, root: 404, ...(2) }` and `Tests  1 failed | 19 passed (20)`. On the changed tree the row passes (`app-gate.test.ts` is in the 14-file run).

`sidesFor` (`src/lib/server/edit/writes.ts:321-324`) returns every published side project to the page's own writes and, for a write that carries an app (`app !== null`), only those whose `source.kind` is `'hub'`. A side project with `source.kind === 'hub'` is exactly one whose id starts with `side:` (`readPersonal` gives that id to a folder of the hub's side-projects tier and `root:<key>` to a served root). It is used by the `manifest`, `subtask` and `subtask-add` branches of `handleWrite`. `docs/apps.md:417` (`manifest`) and `:419` (`subtask`) say an app names a hub side project as `side:<slug>` and that `root:<key>` answers not found to an app; the sentence at `docs/apps.md:413` is unchanged and still true.

## Cases: first run on the unchanged tree, then after the change

The unchanged tree is a copy of the base at `$TMPDIR/d48/unchanged/oculus` (the base copy `.agents/worktrees/D48-base/tools/oculus` plus a `node_modules` link, `vite.config.ts`, `tsconfig.json`, `assets`, `demo` and the test files of this step). Scratch runs are `npx vitest run --config $TMPDIR/d48/vitest.scratch.config.mts <names> --reporter=verbose --testTimeout 0` from `tools/oculus`; the config includes only `$TMPDIR/d48/*.scratch.ts`. After this round the scratch runs `first1 first4 first5 first5b first15 first16 after5b after9` were run again on the changed tree: `Test Files  8 passed (8)`, `Tests  10 passed (10)`. `find . -name '*.scratch.*' -not -path './node_modules/*' | wc -l` in the worktree's `tools/oculus` prints `0`.

No case needed a ruling: the first run found no case the brief's rules get wrong.

### Case 1

Checked by: scratch run `first1.scratch.ts` case 1 (`sideProject` on the raw map holding all eleven keys).

First run (unchanged tree): `CASE1 problems ["key:deadline","key:subtasks","key:followup","key:snooze","key:priority","key:pin","key:short","key:latest","key:collaborators","key:waiting-on","key:related"]`; `CASE1 project keys ["id","title","status","eli5","next","links","source","file"]`.

After the change: `CASE1 problems []`; `CASE1 project keys ["id","title","status","eli5","next","links","short","pin","priority","latest","deadline","waitingOn","followups","snooze","subtasks","relatedIds","collaborators","source","file"]`.

### Case 2

Checked by: scratch run `first1.scratch.ts` case 2 (`deadline: 5`, `subtasks: "x"`, `pin: "yes"`, `waiting-on: 3`, `venue`), now through `str` and `strings`.

First run (unchanged tree): twelve `key` findings, each `key X is not one of title, status, eli5, next and links and is not read`, including `venue`; project keys `id,title,status,eli5,next,links,source,file`.

After the change:

```
CASE2 findings [
 "deadline: deadline is not text and is read as empty",
 "pin: pin is not true or false and is read as empty",
 "subtasks: subtasks is not a map or a list of lines and is read as empty",
 "venue: key venue is not a field of the side-project schema and is not read",
 "waiting-on: waiting-on is not a list of text and is read as empty"
]
CASE2 project keys ["id","title","status","eli5","next","links","short","priority","latest","followups","snooze","relatedIds","collaborators","source","file"]
```

### Case 3

Checked by: scratch run `first1.scratch.ts` case 3, and the import at `normalise-personal.ts`.

First run (unchanged tree): `CASE3 side subtasks undefined followups undefined`; the research reader gives `[{"key":"0","do":"a","deadline":"2026-11-01","done":false},{"key":"1","do":"b","done":false}]` and `[{"do":"x","after":"2026-11-01"},{"do":"y"}]`.

After the change:

```
CASE3 side subtasks [{"key":"0","do":"a","deadline":"2026-11-01","done":false},{"key":"1","do":"b","done":false}] followups [{"do":"x","after":"2026-11-01"},{"do":"y"}]
CASE3 research subtasks [{"key":"0","do":"a","deadline":"2026-11-01","done":false},{"key":"1","do":"b","done":false}] followups [{"do":"x","after":"2026-11-01"},{"do":"y"}]
```

The side and the research values are equal. `normalise-personal.ts` imports `isMap, str, strings` from `../helpers/guards.ts` and `followups, subtasks` from `./normalise-plans.ts`; `textField` calls `str(value)` and `textsField` calls `strings(value)` (`textField` at line 82, `textsField` at line 113).

### Case 4

Checked by: scratch run `first4.scratch.ts` (generator on a side manifest and a research manifest).

First run (unchanged tree): `CASE4 side manifest with eleven research-shaped values: valid=false ["additionalProperties:deadline","additionalProperties:subtasks",...` (every one of the eleven); `side manifest as it is today: valid=true`; `side manifest with venue: valid=false ["additionalProperties:venue"]`; `research manifest with the same values: valid=true`; `side help deadline null`, `side help waiting-on null`, `side help subtasks null`.

After the change:

```
CASE4 side manifest with eleven research-shaped values: valid=true
CASE4 side manifest as it is today: valid=true
CASE4 side manifest with venue: valid=false ["additionalProperties:venue"]
CASE4 research manifest with the same values: valid=true
CASE4 side help deadline "The day the next deadline falls on; it shows on the Focus board while the project's status is live."
CASE4 side help waiting-on "Who or what this project is waiting for: a person from the people list or another project, one per entry."
CASE4 side help subtasks "A checklist of lines, each with what to do, a deadline, whether it is done and a snooze date. The Focus board ticks, snoozes and deletes them; this form does not change them."
```

### Case 5

Checked by: scratch runs `first5.scratch.ts` (`ticker()` over a snapshot), `first5b.scratch.ts` and `after5b.scratch.ts` (`categoryLabel`, `openLine`).

First run (unchanged tree): `TICKER overdue: []`, `TICKER deadlines: []`: no side line; `openLine` has no file opener and calls `onproject:side:x`.

After the change: `TICKER overdue: ["side|Deadline past|days=-5|snoozed=false|target={\"kind\":\"manifest\",\"id\":\"side:dlpast\"}"]`; `TICKER deadlines: ["side|dl|days=10|snoozed=false|target={\"kind\":\"manifest\",\"id\":\"side:dl10\"}"]` (the 120-day deadline and the parked project have no line); `CASE5 categoryLabel [["side","side projects"],["conference","conference calls"],["task","tasks"],["paper","papers"]]`; `CASE5 openLine calls ["onfile:{\"root\":\"hub\",\"path\":\"side-projects/dl10/project.yml\",\"label\":\"dl10\"}","onproject:proj-a"]`. Under label mode `full` the 10-day line reads `side|Deadline ten|days=10|...side:dl10`.

### Case 6

Checked by: scratch run `first5`, subtask and task lists.

First run (unchanged tree): `TICKER subtasks` holds only `pa: dated`; `TICKER tasks` holds only the research project's lines; `TICKER snoozed` holds only `pa: asleep`.

After the change: `TICKER subtasks` adds `Tasks one: dated` (id `side:tasks`, subtask `0`); `TICKER tasks` adds `Tasks one: undated`; `TICKER snoozed` adds `Tasks one: asleep`; the done line is in none; `CASE6 runHeading ["side projects","other","funding"]`.

### Case 7

Checked by: scratch run `first5`, follow-ups.

First run (unchanged tree): `TICKER followups` holds only `pa - due today`; `TICKER tasks` holds only `pa - notice now`.

After the change: `TICKER followups` adds `Tasks one - due today` (`side:tasks`); `TICKER tasks` adds `Tasks one - notice now`; the future `after` appears in neither.

### Case 8

Checked by: scratch run `first5`, snoozed project.

First run (unchanged tree): no side line in `TICKER snoozed`.

After the change: `TICKER snoozed` holds `side|Snoozed one|days=10|snoozed=true|...side:snz` and the deadline is not in `TICKER deadlines`.

### Case 9

Checked by: scratch run `first9.scratch.ts` on the unchanged tree and `after9.scratch.ts` after; the test rows quoted above.

First run (unchanged tree): `CASE9 writeManifest side:alpha {"found":false,"changed":[],"refused":[]}`, the same `found:false` for `manifestValue`, `writeSubtaskAdd` and `writeSubtask` on `side:alpha` and on `root:r`.

After the change (`CASE9` lines of the run): `snooze side:alpha ["snooze"]` with the change record `{"key":"side:alpha","field":"snooze","before":null,"after":"2026-12-01","undo":"field"}`; `manifestValue side:alpha {"found":true,"value":"2026-12-01"}`; `wake`, `tick` (`["done"]`), `reopen` (`["done"]`), `add` (`["subtasks"]`), `delete` (`["subtasks"]`) for `side:alpha`, and the same lines for `root:r`.

### Case 10

Checked by: scratch run `first9`/`after9`, and the `side:gone`, `root:gone` and schema-refusal rows of `writes.test.ts`.

First run (unchanged tree): `CASE10 outside field {"found":false,"changed":[],"refused":[]}`.

After the change: `CASE10 unknown side id {"found":false,"changed":[],"refused":[]}`; `CASE10 root no longer served {"found":false,"changed":[],"refused":[]}`; `CASE10 field outside the schema {"found":true,"changed":[],"refused":[{"field":"venue","reason":"the manifest schema does not name the field"}],"records":[]}`; `CASE10 research unknown id (reference) {"found":false,"changed":[],"refused":[]}`.

### Case 11

Checked by: scratch run `after9.scratch.ts` (a scratch root under `$TMPDIR` with `.oculus/project.yml`).

First run (unchanged tree): no deadline line for a root project (case 5's first run has no side line at all); the root write returns `found:false`.

After the change: `CASE11 personal ids ["root:r","side:alpha"]`; `CASE11 deadline lines ["Alpha|10|{\"root\":\"r\",\"path\":\".oculus/project.yml\",\"label\":\"Alpha\"}","Alpha|10|{\"root\":\"hub\",\"path\":\"side-projects/alpha/project.yml\",\"label\":\"alpha\"}"]`; the snooze on `root:r` writes the file and the `root:r` rows of the undo table pass.

### Case 12

Checked by: scratch run `first5`.

First run (unchanged tree): `WAITING people []`.

After the change: `WAITING people [{"label":"Alice","count":1}]` (the running side project counts; the parked one does not).

### Case 13

Checked by: reading of `Personal.svelte`, `board/personal.ts`, `CardLinks.svelte`. The landing look is NOT done.

First run (unchanged tree): no pin, flames, latest, waiting line, collaborator links or related line on a side card.

After the change (reading only): `Personal.svelte` draws the pin ring and glyph, flames, the latest line, the waiting line and `<CardLinks item={sideLinks(card.project, snapshot)} />` (`Personal.svelte:221`). `CardLinks.svelte` has a `related` kind labelled `personal.related`; a related id that names a project opens that project's tab, and a related id that names no project is drawn as its tag with no press (item 8).

### Case 14

Checked by: arithmetic reading of `Ticker.svelte`. The landing look is NOT done.

First run (unchanged tree): row `min-height` 22 px, text `--fs-md`, button `padding: 3px 6px`, 14 px line, 1 px border: the button is 14s + 8 px high (17.8 px against a 15.4 px row at scale 0.7; 30.4 px against 35.2 px at 1.6).

After the change: `Ticker.svelte:132` `min-height: calc(18px * var(--text-scale, 1));` `:133` `font-size: var(--fs-xs);` `:134` `line-height: calc(14px * var(--text-scale, 1));` `:143`, `:150`, `:173`, `:204` `font-weight: 400;` `:193` `display: inline-flex;` `:196` `box-sizing: border-box;` `:197` `height: calc(18px * var(--text-scale, 1));` `:198` `padding: 0 6px;`. Row and button are 12.6, 18 and 28.8 px at scales 0.7, 1 and 1.6; the 14s line plus the 2 px border (11.8, 16, 24.4 px) fits inside the button at each. The Gallery's Ticker draws no button.

### Case 15

Checked by: scratch run `first15.scratch.ts`.

First run (unchanged tree): `CASE15 3 projects 0 findings 0 read findings`.

After the change: `CASE15 3 projects 0 findings 0 read findings`, identical; `tests/data/sources/personal.test.ts` passes (inside the 14-file run).

### Case 16

Checked by: scratch run `first16.scratch.ts`; the row 'a collaborators value of a side project manifest that names a person' of `references.test.ts`.

First run (unchanged tree): `CASE16 references of amir ["hub:network/joint-work.yml:5:13","hub:projects/active/alpha/project.yml:6:13","hub:projects/active/alpha/project.yml:7:16"]`; plan files `registries/people.yml`, `network/joint-work.yml`, `projects/active/alpha/project.yml`; the test row fails with `a hit stands at the position: expected null not to be null`.

After the change: `CASE16 references of amir ["hub:network/joint-work.yml:5:13","hub:projects/active/alpha/project.yml:6:13","hub:projects/active/alpha/project.yml:7:16","hub:side-projects/idea/project.yml:2:16","hub:side-projects/idea/project.yml:3:13"]`; `CASE16 plan ok true ["hub:registries/people.yml","hub:network/joint-work.yml","hub:projects/active/alpha/project.yml","hub:side-projects/idea/project.yml"]`.

## DONE / NOT DONE

| Item | State | Command that proves it |
|---|---|---|
| Seven build items (keys, Focus, buttons, Personal card, Ticker, text, sizes) | DONE | the commands below |
| Repair items 1 to 9 | DONE | the commands below and the sections above |
| Case 13 landing look on a scratch oculus | NOT DONE | needs a browser; the orchestrator's look |
| Case 14 landing look and Focus screenshots on TEST | NOT DONE | needs a browser; arithmetic reading above |
| `npm run diagrams` | DONE | `diagrams-exit 0` |
| `npm run test:quick` | DONE, over its time limit | below |
| named vitest files | DONE | below |
| `npx vitest run tests/checks` | DONE | below |
| `sh utils/folder-check.sh` | DONE | `folder-check exit 0` |
| ASCII gate | DONE | below |
| `unused-exports.sh` | DONE | below |
| prettier, eslint, svelte-check | DONE | below |

`npm run diagrams && npm run test:quick` (the diagrams, then the quick tier), run after the last change to a source file other than one comment word in `personal.ts`; the summary lines of `test:quick`:

```
ok      ASCII gate (0.8 s)
ok      prettier (2.8 s): All matched files use Prettier code style!
ok      svelte-kit sync (30.2 s)
ok      eslint (72.2 s)
ok      svelte-check (60.2 s): 1791562464702 COMPLETED 441 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest (120.8 s): Duration  89.12s (transform 149.21s, setup 0ms, import 198.56s, tests 133.23s, environment 701ms)
test:quick: 122.5 s (limit 45.0 s); every command passed
test:quick: over the time limit
```

After the comment word in `personal.ts` (line 32, "any value other than false is live") the following were run again: `npm run diagrams` (`diagrams-exit 0`), `npm run check` (`COMPLETED 3565 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`), `npx eslint .` (`eslint-exit 0`), `npx prettier --check .` (`All matched files use Prettier code style!`), `npx vitest run tests/checks/source tests/state/boards --testTimeout 0 --hookTimeout 0` (`Test Files  4 passed (4)`, `Tests  32 passed (32)`). `test:quick` itself was not run again after that word.

The brief's named files plus the three files touched by item 4 and by the earlier timeout, `npx vitest run tests/server/edit/writes.test.ts tests/server/core/changes.test.ts tests/routes/edit/undo/undo.test.ts tests/data/sources/personal.test.ts tests/data/snapshot/normalise.test.ts tests/data/sources/manifests.test.ts tests/data/snapshot/references.test.ts tests/checks/source/keys.test.ts tests/checks/config/config-folder.test.ts tests/checks/config/config.test.ts tests/checks/tree/size.test.ts tests/routes/edit/app-gate.test.ts tests/routes/edit/roots.test.ts tests/server/machine/lsp/servers.test.ts --testTimeout 0 --hookTimeout 0`:

```
 Test Files  14 passed (14)
      Tests  188 passed (188)
```

The same command over the brief's eleven files alone printed `Test Files  11 passed (11)` and `Tests  160 passed (160)`. `npx vitest run tests/checks --testTimeout 0 --hookTimeout 0` (run before the one-word comment edit; the part of `tests/checks` that reads comments, `tests/checks/source`, was run again after it, above):

```
 Test Files  17 passed (17)
      Tests  248 passed (248)
```

`npx vitest run tests/server/edit/writes.test.ts -t 'ticks and reopens' --testTimeout 0`: `Tests  3 passed | 14 skipped (17)`. `npx vitest run tests/server/edit/writes.test.ts tests/server/git/deposit.test.ts --tagsFilter slow --testTimeout 0`: `Test Files  2 passed (2)`, `Tests  4 passed | 14 skipped (18)`.

`sh utils/folder-check.sh`: no output, `folder-check exit 0`. `ls src/lib/state/boards/board | wc -l` prints `10` and `ls src/lib/data/snapshot | wc -l` prints `10`.

The ASCII gate, the perl command of `agents/spec.md` line 99 verbatim, from `tools/oculus`:

```
bfs: error: bin: No such file or directory.
perl-exit 0
```

`tools/oculus/bin` does not exist, so `find` prints that line for the path the gate names. The gate printed nothing else. With `bin` left out of the `find` the command prints nothing and exits 0.

`sh utils/unused-exports.sh`, `diff` of `D48-base/tools/oculus/unused-exports.txt` against its output now (364 lines in both; the lines that differ):

```
11c11
< src/lib/data/snapshot/normalise.ts: REGISTRY_KEYS, ENTITY_KINDS, followups, subtasks
---
> src/lib/data/snapshot/normalise.ts: REGISTRY_KEYS, ENTITY_KINDS
51c51
< src/lib/server/edit/writes.ts: coerce, createIdea, fieldTypes, insideHub, writeDeckSlides, createEntry, ...
---
> src/lib/server/edit/writes.ts: coerce, createIdea, fieldTypes, writeDeckSlides, createEntry, ...
```

(The two `writes.ts` lines continue with the same names to their end; `diff` shows the only difference in each as the removed names.) The step added no name to the list: `followups` and `subtasks` left the `normalise.ts` line because `normalise-plans.ts` exports them and `normalise-personal.ts` imports them; `insideHub` left the `writes.ts` line because it is no longer re-exported. The type `RelatedTag` is not exported from `board/index.ts`; it is imported from `presets.ts` by `personal.ts`.

## Changed names, grep over `src tests docs DESIGN.md HELP.md utils`

`writeManifest`'s signature is `writeManifest(hub, config, sides, id, fields, reading?, removed?, replaced?)` (`manifest.ts:395`). `grep -rnF writeManifest` finds three server callers, all passing the list: `writes.ts:382` (with `sidesFor(into, app)` at 385), `undo.ts:289` (`writeManifest(hub, config, sides, ...)`) and `deposit.ts:435` (`writeManifest(into.hub, into.config, into.sideProjects(), id, {...`). Every other hit is the client function `writeManifest(id, fields)` of `state/client/writes.svelte.ts:270`, a different function that posts to the endpoint, or a comment (`entries.ts:53`, `manifest.ts:20` and `:24`) that names the server function without a signature. The test callers are `writes.test.ts:151` and `:177`, both with the list.

`insideHub`: three hits, all in `manifest.ts` (`:5` the comment, `:262` the call in `homeOf`, `:320` the definition). It is no longer exported or re-exported; no other file names it.

`TickerItem`: defined at `board/ticker-lines.ts:62`; used by `ticker.ts`, `side-lines.ts`, `ticker-lines.ts`, `views/boards/focus/rows.ts`, and re-exported by `ticker.ts:36`. The field this step added is `side`. `CommandCenter.svelte` and `Tasks.svelte` use it through `ticker.ts`.

`SideProject`: defined at `model-entities.ts:826` as `SideResearchKeys & {...}`; used by `writes.ts`, `writes/manifest.ts`, `writes/subtasks.ts`, `sessions/stores/hooks.ts`, `normalise-personal.ts`, `board/personal.ts`, the test fixtures, and named in `DESIGN.md:99` and `:108` (still true) and `docs/apps.md:248` (rewritten).

## Reuse greps before each new helper

Each name below was searched before the helper was written; what the search printed decided whether the helper exists. The current definitions and users are listed after each.

- `str` and `strings` (`grep -rn -E 'function (str|strings|texts?|textList|listOf)\b'` over `data/helpers/guards.ts`, `data/snapshot`, `data/helpers/files`): `guards.ts:29` `str`, `:45` `text`, `:69` `strings`, and `listOf` (a YAML sequence finder, a different thing). `textField` (`normalise-personal.ts:82`) and `textsField` (`:113`) are the thin wrappers that add a `field_type` finding, and they call `str` and `strings`.
- `flagField` (`normalise-personal.ts:96`, used at `:206`): the research reader writes `pin: manifest.pin === true ? true : undefined` (`normalise.ts:238`) with no finding; `flagField` adds the finding for a non-boolean, so it is not a copy of that line.
- `planField` (`normalise-personal.ts:131`, used at `:211` and `:213`): `followups(...)` and `subtasks(...)` exist in `normalise-plans.ts:29` and `:61` and are what `planField` calls; `planField` adds only the finding.
- `textsField` (`:113`, used at `:210`, `:214`, `:215`): nothing else in `data/snapshot` reads a list of text with a finding.
- `sideLinks` (`board/personal.ts:186`, used by `Personal.svelte:221`): `personNames` (`board/person.ts:36`) is reused; `items.ts:112` builds a research project's tags with a local function that takes a name, nothing to reuse. The short-or-title label is `tagLabel` (`items.ts:22`, now exported), reused by `sideLinks`. `labelOf` in `focus.ts` was not used: `focus.ts` imports `sideLive` from `personal.ts`, so the import would make a runtime cycle.
- `sideLive` (`board/personal.ts:97`, used by `side-lines.ts:37` and `focus.ts:296`): `grep -rn -E 'liveShape|isLive|\.live\b' src/lib/state src/lib/data/snapshot` finds no reader of a status row's `live` flag; the hits are sessions and terminals. `liveShape` (`personal.ts:32`) is local to it.
- `LinkedItem` (`presets.ts:66`): `CardLinks.svelte` took `BoardItem` (`ProjectCard.svelte:57`); `LinkedItem` is the `Pick` of the link fields, so the Personal card needs no other fields.
- `manifestSource` (`writes/manifest.ts:285`, used by `subtasks.ts:61`): `grep -rn -E 'readManifests\(|isSideTier|function insideHub|below\('` over `server/edit`, `server/git`, `server/sessions` and `hub-names.ts` finds `readManifests` (used by `homeOf`), `isSideTier` (`hub-names.ts:89`, used by `isOwnFile`) and `below` (`core/paths.ts`); all three are reused.
- `homeOf` (`manifest.ts:249`) and `isOwnFile` (`:230`): the lookups of `manifestSource` and `writeManifest` before this step were `readManifests` only; `homeOf` adds the side lookup and both callers use it (`:291`, `:313`, `:405`).
- `sideSchema` (`snapshot/schema/manifest.ts:119`, used by `static.ts:58` and `:71`): sits beside `manifestSchema` (`:114`) and shares its `Context`.
- `sidesFor` (`writes.ts:321`): no existing helper filters the published side projects for an app; `HeldApp` is the type the handler already carries.

## Item 6: refusal reasons of `writes/manifest.ts`

`grep -nE "reason|refusal|words\(" src/lib/server/edit/writes/manifest.ts` prints 33 lines. Every reason is `words(catalog, 'server.manifest_write.<key>')` or `words(config.text, 'server.manifest_write.<key>')` (lines 129, 130, 131, 159, 163, 172, 264, 277, 446, 447, 474, 482, 557, 565, 575, 607); no line returns a sentence literal. A second grep, for quoted lowercase sentences in the file outside comments and `words(`, prints nothing. The catalog group is in `config/text/server.yml` under `server.manifest_write`:

```
group: 'the field is a group; set its children, or clear it whole'
idea_exists: '{0}/{1} is already there'
idea_folder: not a folder name
idea_id: an id is lower case letters, digits and hyphens
idea_unparsed: the scaffold did not parse; nothing was written
list_not_strings: the list holds something not a string
map_field: a map field is not written by the form
not_in_hub: the manifest is not inside the hub
not_in_schema: the manifest schema does not name the field
not_list: the value is not a list
not_own_file: "the manifest is not the side project's own project.yml"
not_text: the value is not text
read_only: the field is read-only
unknown_type: unknown field type {0}
unreadable: the manifest could not be read
```

The words are those the file returned before. The pattern is the one `config-key.ts` and `config-value.ts` already use (`words` from `core/words.ts`, the catalog `config.text`). `tests/checks/source/keys.test.ts` passes (in the 14-file run). The wire still carries sentences, so an app sees the same sentences as before. The signatures that gained a catalog parameter are `unwritable(type, catalog)`, `coerce(type, raw, current, catalog)`, `readValue(reading, type, raw, current, catalog)` and `createIdea(hub, catalog, fields)`; the `GROUP_REFUSED` constant is gone.

## Item 7: one planting helper

`tests/routes/edit/write-fixture.ts` exports `SIDE_MANIFEST`, `SIDE_SCAN`, `type PlantedSides` and `plantSides(hubDir)`, which plants `side:idea` in `side-projects/idea/project.yml` of the hub and `root:r` at `.oculus/project.yml` of a served root under the system temporary directory, asserts both paths lie inside their folder, and returns `{served, files, sides}`. `sideTarget(base)` (routes tests) and `sideWorld()` (`tests/server/edit/writes-fixture.ts`) both call `plantSides`; `writes-fixture.ts` imports from the routes fixture, the direction the other server tests already use. `grep -rn "SIDE_MANIFEST" tests` finds its definition in `write-fixture.ts` only; the other hits are imports and uses.

## Item 9 additions

### The five rows of `config/schemas/side-project-schema.yml` whose help was rewritten

`manifest-schema.yml` is unchanged from the base (`diff` prints nothing). Research row (`config/schemas/manifest-schema.yml`, lines 61, 80, 64, 46, 38) and side row (`config/schemas/side-project-schema.yml`):

- `deadline`. Research: "The day the next deadline falls on; it shows on the Focus radar while the project is live." Side: "The day the next deadline falls on; it shows on the Focus board while the project's status is live."
- `subtasks`. Research: "A checklist of lines, each with what to do, a deadline, whether it is done and a snooze date. Add and tick them on the project's card; this form does not change them." Side: "A checklist of lines, each with what to do, a deadline, whether it is done and a snooze date. The Focus board ticks, snoozes and deletes them; this form does not change them."
- `snooze`. Research: "Pick a date to keep this project off the ticker until then; clear it to bring the project back." Side: "Pick a date to keep this project off the Focus board until then; clear it to bring the project back."
- `pin`. Research: "Tick to keep the card at the top of its board. Search and filters still hide it when it does not match." Side: "Tick to draw the card first among the cards of its status. A card that does not match the search or the status toggles is hidden, pinned or not."
- `short`. Research: "A short name for the card and the lists, such as bttd or raw-pls." Side: "A short name for the lines of the Focus board, such as bttd or raw-pls."

A side project has a Personal card, a Focus board and no lanes, so each side row names the surface a side project has (the Focus board, the card's status) where the research row names the radar, the ticker or the board of a research project.

### The prose read of verify 5

Every new or changed sentence of `HELP.md`, `docs/views.md`, `docs/apps.md`, `docs/configuration.md`, `DESIGN.md`, the help lines of `config/schemas/side-project-schema.yml`, `config/catalogs/options.yml`, `config/catalogs/vocab.yml`, `config/sources.yml`, `config/text/*.yml` and every comment the step added was read against `agents/spec.md` line 20 (plain, ASCII, no em dashes, no quips, no 'not X but Y', name the function, file and line) and line 42 (no history). Checks run over the 1816 added lines (`diff` of each changed file against the base, plus the three new files whole): the ASCII gate prints nothing; a grep for ` - `, `--` and the em and en dash finds only YAML list dashes; a grep for `not ... but` finds nothing in prose. The history-word grep (`previously|formerly|used to|no longer|originally|reverted|renamed|legacy|earlier|instead of|rather than|still|before|as before|always|but|package|step` and plan id patterns over comment lines, test titles and docs the step added) found these hits, each judged:

- `config/schemas/side-project-schema.yml` `followup.after`: "the date before which it stays hidden": describes the field's meaning (the note is hidden until that date); the research row says the same. Kept.
- `manifest.ts:5`: "checks the resolved path against them again before the write": the order of two checks in one write, no earlier state. Kept.
- `manifest.ts:360` "rather than a saving", `ticker.ts:742` "instead of a target", `ticker-lines.ts` "months rather than days": text that was in the base and moved with its code; each states a design reason in the present tense. Kept.
- `DESIGN.md:552` "an earlier root's": an earlier entry of the roots list, which `personalRoots` in `portfolio.ts` compares a root's real path with; the phrase is in the base sentence. Kept.
- `manifest.ts:506`, `undo.ts:546-547`: the variable and record field named `before`. Code, no comment.
- `personal.ts:32`: the word "but" was in "any value but false is live"; it now reads "any value other than false is live".
- The word "still" in the `pin` help ("Search and filters still hide it") is in the research row only; the side row no longer carries it.

Departures from the prose rules, each with why it needs its form:

- `docs/apps.md` rows 248, 417 and 419 are table cells of 210, 238 and 395 characters. The cell holds the field list of one wire shape that an app author reads in one place; the neighbouring rows are the same length, and a split into several rows would put one shape across rows.
- The `DESIGN.md:552` bullet is one long line (the hard-wrapping rule forbids breaking it) of four clauses, because it names the two id forms, the five and eleven keys, the readers and the app reach in the one paragraph that `DESIGN.md:99` and `:108` refer to.
- The `server.yml` lines keep the words the code returned before, including the fragments 'not a folder name' and 'the list holds something not a string', because the wire carries them to apps (`docs/apps.md:525` quotes one of them) and the brief says to leave the words unchanged.
- `findings.yml` `personal_field_type` is a sentence frame with two holes (`'{0} is not {1} and is read as empty'`) filled with five type words; the frame is not a sentence a reader sees without them.

No sentence uses a quip, an em dash or a non-ASCII character.

### What the code does for empty, duplicate and colliding ids

`homeOf` (`writes/manifest.ts:249-282`) is read as follows. An empty id, or any id no project and no published side project has (every published side id starts with `side:` or `root:`), matches no research manifest (`manifests.find((one) => one.id === id)`) and no side project (`sides.find((one) => one.id === id)`), so it returns `null` and the write answers `found: false` (scratch case 10 prints `{"found":false,"changed":[],"refused":[]}` for an unknown side id and for a root that is no longer served). A side id appears once in the list: `side:<slug>` is made from a folder name of the hub's side-projects folder (unique in a directory) and `root:<key>` from a root key, which `personalRoots` (`portfolio.ts:286`) keeps once (`keys.has(root.key)` drops a repeat), and the prefixes differ, so two published side projects cannot share an id. A research project whose id is literally `side:x` wins, because the research lookup runs first; that is the judgment call "a research id wins" below. For an app, `sidesFor` removes every `root:` entry before `homeOf` sees the list, so `root:<key>` answers not found to an app (the G49 row).

### Visible changes: Focus's Tasks band and the command center's subtasks group

- Focus Tasks band (`Tasks.svelte:96-107`, `taskGroups` in `ticker.ts:483`). Before: three groups, follow-ups, subtasks and tasks, and no side-project line (case 6 and 7 first runs). After: a fourth group "side projects" (`focus.command.dlcat_side`, with the glyph `views.personal_glyph`) after Tasks, holding the undated follow-ups and the open subtasks of live side projects; a press on a line opens the manifest in a source tab. To look: the Focus view with the Tasks band open, over a hub that has a live side project (not `parked`) with an undated subtask (`subtasks: - { do: write it }`) or a `followup:` note; the group is absent when no live side project has such a line.
- Command center subtasks group (`CommandCenterView.svelte:88-89`, `runHeading` in `rows.ts:382`). Before: a run of subtask lines had the sub-heading of its owner's kind (`one.kind`, or "other" when the kind is empty), and no side project had a subtask line there (case 6 first run). After: a run of side lines is a group of its own, keyed by `side:kind`, with the sub-heading "side projects" (`CASE6 runHeading ["side projects","other","funding"]`). To look: the Focus view's command center with the subtasks group open, over a hub whose side project has a dated subtask; the heading is absent when no live side project has a dated subtask.

Neither is looked at: these two views need a browser and the look is the orchestrator's.

### The YAML editor on `config/schemas/side-project-schema.yml`

Checked by: scratch run `editor.scratch.ts` (the generic block schema the editor used before, `{type: object, properties: {side_project_schema: SCHEMA_BLOCK}, additionalProperties: false, definitions: SCHEMA_DEFINITIONS}`, and `shapeSchema(sideProjectSchemaFileShape)` that `engine.ts:101-107` now registers as the schema `schemas/side-project-schema`), each run through `createChecker()` and ajv over the real file and over the real file with `label: Title` added to its first row:

```
EDITOR generic block schema, the file as it is: valid=false ["enum:/side_project_schema/6/type","enum:/side_project_schema/14/type","enum:/side_project_schema/16/type"]
EDITOR generic block schema, a label on a row: valid=false ["enum:/side_project_schema/6/type","enum:/side_project_schema/14/type","enum:/side_project_schema/16/type"]
EDITOR own row shape, the file as it is: valid=true
EDITOR own row shape, a label on a row: valid=false ["additionalProperties:label"]
```

Before: the editor marked three correct rows (rows 6, 14 and 16 counted from 0: `subtasks` of type `keymap`, `collaborators` and `related` of type `chips`, values the generic block schema's `type` list does not hold) and did not mark a `label:` on a row. After: the file as it is has no mark, and a `label:` on a side row is marked (`additionalProperties:label`), because a side row holds only `field`, `type`, `help`, `from`, `options` and `required` (`sideProjectField` in `catalog-files.ts:398-405`). `tests/checks/config/config-folder.test.ts` passes.

## Terms

No glossary.

## Files with line counts

Changed or new files outside `docs/diagrams/` (`wc -l`), from `diff -rq` against the base copy. Limits: source 880, component 520, at most 10 items per folder (`state/boards/board` holds 10 files and `data/snapshot` holds 10: `ls | wc -l` prints `10` for each).

```
    1454 config/catalogs/options.yml
     875 src/lib/server/git/deposit.ts
     861 docs/apps.md
     836 src/lib/data/model/model-entities.ts
     735 src/lib/data/snapshot/normalise.ts
     684 src/lib/server/root/watch/portfolio.ts
     670 src/lib/server/edit/writes.ts
     661 src/lib/data/model/index.ts
     633 src/lib/server/edit/writes/manifest.ts
     608 utils/diagrams/writes.mjs
     586 DESIGN.md
     521 src/lib/state/boards/ticker.ts
     511 tests/data/snapshot/references.test.ts
     447 tests/routes/edit/write-fixture.ts
     429 tests/routes/edit/undo/undo.test.ts
     427 tests/server/core/changes.test.ts
     422 src/lib/server/edit/writes/undo.ts
     421 src/lib/data/shapes/catalog-files.ts
     408 src/lib/state/boards/board/presets.ts
     385 src/lib/views/boards/focus/rows.ts
     374 src/lib/data/sources/manifests.ts
     373 src/lib/state/boards/focus.ts
     300 config/text/server.yml
     299 config/catalogs/vocab.yml
     296 tests/server/edit/writes.test.ts
     295 src/lib/views/boards/personal/Personal.svelte
     287 src/lib/server/edit/writes/subtasks.ts
     283 docs/views.md
     281 src/lib/data/snapshot/normalise-personal.ts
     278 src/lib/views/boards/focus/CommandCenterView.svelte
     268 src/lib/ui/display/ticker/Ticker.svelte
     267 src/lib/views/boards/focus/CommandCenter.svelte
     260 tests/routes/edit/app-gate.test.ts
     243 config/text/findings.yml
     223 src/lib/server/sessions/stores/hooks.ts
     205 src/lib/state/boards/board/personal.ts
     195 src/lib/state/boards/board/items.ts
     193 src/lib/views/shared/card/CardLinks.svelte
     188 HELP.md
     178 src/lib/state/boards/board/ticker-lines.ts
     162 src/lib/state/boards/board/stats.ts
     157 src/lib/views/boards/focus/Tasks.svelte
     146 tests/server/git/deposit.test.ts
     143 tests/server/edit/writes-fixture.ts
     137 config/sources.yml
     136 config/text/views/boards/focus.yml
     136 src/lib/data/snapshot/schema/manifest.ts
     125 src/lib/data/sources/config/catalog/schemas/engine.ts
     117 src/lib/data/helpers/hub-names.ts
     115 tests/routes/edit/audit-mute.test.ts
      97 src/lib/data/snapshot/schema/static.ts
      77 src/lib/data/snapshot/normalise-plans.ts
      75 src/lib/state/boards/board/side-lines.ts
      69 docs/configuration.md
      58 src/lib/state/boards/board/index.ts
      31 config/schemas/side-project-schema.yml
      19 config/text/views/boards/personal.yml
```

`docs/diagrams/` holds the regenerated `.dot` and `.svg` of channels, layer-data, layer-server, layer-state, layer-views, layers and writes. `config/catalogs/options.yml` is a config file of 1454 lines; `deposit.ts` is 875 lines and was 875 at the base. Three files are new: `normalise-plans.ts`, `side-lines.ts`, `ticker-lines.ts`.

## Edits to existing assertions (`diff` against the base)

Taken from `diff <base file> <file>` of every changed test file; a line is listed when a line of the base that held an assertion or the call under test no longer reads the same.

- `tests/server/edit/writes.test.ts`: the body of 'writes the changed field and nothing else' (`expect(out).toEqual({records: [record(...'status.line'...)]})` and `expect(manifestOf(root)).toBe(MANIFEST.replace('"the line"', '"a new line"'))`) is the first row of `FIELD_ROWS` with the same expected values; the body of 'ticks and reopens a line of a manifest' (`expect(added.changed).toEqual(['subtasks'])`, the `toBe(`${MANIFEST}subtasks:...`)`, `toContain('- { do: write it, done: true }')`, `toContain('- { do: write it }')`) is the research row of `LINE_ROWS` with the same expected values; the call `createIdea(root, {...})` reads `createIdea(root, configFor().text, {...})` for the new catalog parameter; the call `writeManifest(root, configFor(), 'alpha', ...)` and the two subtask writers take the list `sides` after the config (an empty list for the research rows). No expected value changed.
- `tests/server/core/changes.test.ts`: `expect(response.status).toBe(200)` in `written` reads `expect(response.status, row).toBe(200)` (a message added); the two tests' `toMatchObject` expectations are the first rows of `MANIFEST_ROWS` and `SUBTASK_ROWS` with the same values (`file: join('projects','manuscripts','alpha','project.yml')`, `before: 'the line'`, `after: 'a new line'`, `undo: 'field'` and the subtask expectations). The import line of `write-fixture.ts` gained `SIDE_MANIFEST` and `sideTarget`.
- `tests/routes/edit/undo/undo.test.ts`: `made(into, body)` reads `made(into, body, row = '')` with `expect(..., row)`; the two tests' assertions are the first rows of `FIELD_ROWS` and `LINE_ROWS`, the same values (`ok: true, changed: ['status.line'], refused: []`, the `toMatchObject` of the taken change, the `toContain('done: true')` and `toContain('- { do: read it }')` pair).
- `tests/routes/edit/app-gate.test.ts`: the import line gained `SIDE_MANIFEST` and `sideTarget`; no assertion of the base changed.
- `tests/data/snapshot/references.test.ts`: no line of the base changed; one table row was added.
- `tests/routes/edit/write-fixture.ts` and `tests/server/git/deposit.test.ts`, `tests/routes/edit/audit-mute.test.ts`: `sideProjects: () => []` added to each target builder (the new member of `WriteTarget`); the type import gained `SideProject`.

## The listed sentences

- `manifests.ts:25` (`PERSONAL_MAX_BYTES` comment): rewritten ("Its sixteen keys are a few lines each")
- `manifests.ts:356-360` (`readPersonal` head comment): rewritten (adds "and the Personal board and the Focus ticker read the records that make")
- `normalise-personal.ts` head comment: rewritten (the sixteen keys, the readers it shares with `normalise-plans.ts`, the finding words)
- `hub-names.ts:82`: rewritten ("which the Personal board and the Focus ticker read")
- `config/sources.yml:15`: rewritten ("read by the Personal board and the Focus ticker; no research reader reads it")
- `docs/configuration.md:21` and `:41`: rewritten
- `DESIGN.md:552`: rewritten (the parenthesis no longer lists "the subtask and manifest writes" among what cannot find a side project; it names `str`, `strings`, `followups`, `subtasks` and that a write from an app's frame is handed only the side projects of hub folders)
- `docs/views.md:23`: rewritten ("A side project is on no lane and in no audit; the Focus ticker and the waiting tally read it while its status is live.")
- `docs/views.md:5-7` (Focus): rewritten
- `docs/apps.md:248`: rewritten (the `personal` map lists the new fields)
- `docs/apps.md:417` and `:419`: rewritten (an app names `side:<slug>`; `root:<key>` answers not found to an app); `docs/apps.md:413`: still true
- `HELP.md:105`: rewritten
- `findings.yml:43` and `:45`: rewritten (the type sentence `'{0} is not {1} and is read as empty'` with five type words; `key {0} is not a field of the side-project schema and is not read`)
- `vocab.yml` side-project statuses comment and `options.yml` `scan` help: rewritten
- `config/schemas/side-project-schema.yml` head comment and the five help lines above: rewritten
- `writes/manifest.ts` head comment (lines 1-30): rewritten (lines 4-6 the research rule; lines 8-13 the side-project file rule; lines 16-17 the catalog sentence)
- `CardLinks.svelte` head comment (lines 10-13): rewritten (the related kind and the unheld id)
- `board/personal.ts` `sideLinks` doc comment: rewritten ("and by the id itself, marked not held, when no project has it")
- `docs/views.md` Personal paragraph other than line 23, and the `model-entities.ts` and `model/index.ts` comments: rewritten where they named five keys or the Personal board alone

Still true and unchanged: `docs/views.md` text outside the lines above, `DESIGN.md:99` and `:108`, and `docs/apps.md:413`.

## Judgment calls

- A research id wins over a side id when both would match (`readManifests` is searched first); a side id is looked up only when the research reader does not hold it. Reversible.
- `sidesFor` filters an app's side projects by `source.kind === 'hub'`, which is the set of ids that start with `side:`; the id prefix is not parsed. Reversible.
- `TickerItem` has a `side` field holding the manifest target. It marks a line as a side line, and `openLine` opens it in a source tab through the file opener. The field is internal.
- `ticker-lines.ts` was split from `ticker.ts` so that `ticker.ts` stays at 521 lines and the side-lines module imports no cycle at runtime.
- `sideLive` lives in `board/personal.ts` and reads `live` from the `side_project_status` row; a status outside the list is live.
- New words beyond `dlcat_side` and `personal.related`: `focus.command.side_deadline` ("deadline in {0}d") for the tail of a side deadline line. The related line reuses `project.card.software_glyph`.
- The Tasks band's side group heading uses `views.personal_glyph`, and the `side` ticker group uses `GLYPHS.side = 'spark'` as the brief says.
- The `agent` button is not offered on side lines, because it opens a research project's chat context.
- The `.plain` rule of `Ticker.svelte` was dropped; `.name` and `.plain` both take weight 400, so the rule had no effect.
- The catalog group for the refusal reasons is named `server.manifest_write`; `coerce` and `createIdea` gained a catalog parameter, and `coerce` is re-exported from `writes.ts` and used nowhere else.
- `RelatedTag` is `BoardTag & { held: boolean }` (`presets.ts:59`), and `tagLabel` is exported from `board/items.ts` with the type `Pick<Project, 'title' | 'short'>`.
- The undo tables are not tagged slow, since the guarded tests were not; their rows run in `npm test`.
- A snooze with `hide` on a side manifest writes `snooze: "true"` and reads back without a finding, as the research write does.
- Two read-only git commands were run in round 0; none was run in round 1.

Files changed that the brief's path list does not name, each with its reason:

- `src/lib/data/shapes/catalog-files.ts` and `src/lib/data/sources/config/catalog/schemas/engine.ts`: the `live` flag on a side status row and the file shape of `side_project_schema` (a list of rows with `keymap` and `chips` widgets), which the generic block schema refused; `config-folder.test.ts` failed without it.
- `src/lib/server/sessions/stores/hooks.ts`: `sideProjects(hub)`, which reads the published portfolio for `WriteTarget.sideProjects`.
- `src/lib/state/boards/board/presets.ts`, `board/index.ts`, `board/items.ts`, `board/stats.ts`: the `LinkedItem` and `RelatedTag` types that `CardLinks` takes, the exported `tagLabel`, and `waitingLine` accepting a side project.
- `src/lib/views/shared/card/CardLinks.svelte`: the `related` kind and the unheld id.
- `src/lib/state/boards/board/ticker-lines.ts`, `side-lines.ts`: new files for the ticker lines and the side lines.
- `tests/routes/edit/write-fixture.ts`, `tests/server/edit/writes-fixture.ts`, `tests/routes/edit/audit-mute.test.ts`, `tests/server/git/deposit.test.ts`: `sideProjects` on the target builders and the side fixture.
- `src/lib/server/root/watch/portfolio.ts`, `src/lib/data/model/index.ts`, `config/catalogs/options.yml`, `docs/configuration.md`, `docs/apps.md` rows 417 and 419, `DESIGN.md`: sentences that named the five keys or said the Personal board alone reads a side project, or that said an app reaches every side project.
- `utils/diagrams/writes.mjs`: `writesDrawn` gives a plain arrow the next port when `labelsAcross` names it as running through the words of another arrow, as it already did for `arrowsAlong`; the regenerated writes diagram had two arrows through the `mkdir, rename` label and `tests/checks/diagrams/diagrams.test.ts` 'are clear of every other arrow in every drawing the source gives' failed without it. That test passes (inside the 17-file `tests/checks` run).

## User-visible before and after

- Side manifests: before, any of `deadline`, `subtasks`, `followup`, `snooze`, `priority`, `pin`, `short`, `latest`, `collaborators`, `waiting-on`, `related` gave a `key` finding and was dropped. After, they are read like a research manifest's, a wrong type drops that field alone with a `field_type` finding naming the type, and the YAML editor completes and checks them.
- Focus: before, side projects did not appear. After, a live side project's deadline is in a `side projects` category of the deadline groups (`categoryLabel('side')` is "side projects"), its follow-ups and subtasks appear as for a research project, a press opens its manifest in a source tab, and its `waiting-on` counts in the waiting tally. A parked project draws nothing.
- Focus Tasks band and command center: see "Visible changes" above, each with the view and state to look at.
- Buttons: snooze, wake, tick, reopen, delete and clear work on side lines and write the side manifest.
- Personal card: pin sorts first within a status, with a ring and glyph; priority flames, a latest line, a waiting line, collaborator links and a `related` line. A `related` id that names no project: before, the tag was drawn with the id as its label and a press that opened a project tab for a project that does not exist; after, `sideLinks` marks it (`held: false`, label the id) and `CardLinks.svelte:106` returns no press for it, so it is drawn as its tag and does nothing when pressed. A `related` id that names a project is unchanged: its short name or title, and a press that opens the project's tab. To look: a side project whose `related:` holds one real project id and one id no project has; the Personal board with that card.
- Ticker rows: text is 11 px (`--fs-xs`) at weight 400 on an 18 px row with a 14 px line, and a shown button is exactly the row's height; before, rows were 22 px at 13 px with weight 600.
- Reference index: Find References and rename on a person key reach a side manifest's `collaborators` and `waiting-on` lines.
- Apps API: the `personal` map carries the new fields; an app with the `manifest`, `subtask` or `subtask-add` write kind can write a side project of a hub folder (`side:<slug>`) and gets not found for a repository root (`root:<key>`). A page's own writes reach both.
- YAML editor: see the last section under item 9 above; `config/schemas/side-project-schema.yml` is checked against its own row shape and a `label:` on a row is marked.

## Anything wrong in the brief

- The brief says each new row of cases 9 and 10 fails on the unchanged tree. The research row of each table and the not-found rows `side:gone` and `root:gone` pass on it (the unchanged tree already answers `found: false` for a side id). They stay as guards of what must not change.
- The brief's path list omits the files named above under "Files changed that the brief's path list does not name"; each was needed by a check or a type.
- `agents/spec.md` line 99 names a `bin` folder that does not exist in `tools/oculus`, so the gate prints a `find` error as well as its result.
- `npm run test:quick` reports its 45 s limit as exceeded because the machine ran other agents' builds during the run; the 122.5 s figure is not a measure of the change alone.
