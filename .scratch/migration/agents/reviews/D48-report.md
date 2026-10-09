# D48 report: side projects take the research keys, and their live ones feed the Focus ticker

Everything in the brief is done, with two exceptions that need someone else: the landing looks of case 13 (Personal card) and case 14 (Focus screenshots on TEST) are not done, because they need a browser; only the arithmetic reading of case 14 was done here. `npm run test:quick` finished in 128.6 s against its 45.0 s limit and printed `test:quick: over the time limit`, with every command passing; other agents' builds were running on the same machine during that run.

## Open items from the state file (copied at the time of writing from the main checkout's `orchestrator-state.md`)

## Open items (only what Axel must rule on; every report tells him these in plain words, decisions first, until he has ruled)

An entry leaves this list for the closed log the moment Axel rules on it. What a review or a look found and no brief covered is not an open item: it is folded into an existing step in `plan.md` (Z468), never booked as a step of its own.

- 27. The hub's `network/events.yml` fails its own schema since your commit f28e137f1: the entry "Research visit - Linkoping (Sweden)" (`entries[2]`, line 47) lost its `status: planned` line, and the file's `schema:` block (line 9) marks `status` as `required: true`. The landing gate's `tests/checks/config/integrity.test.ts` "validates with no findings" fails on it with "key entries[2].status is required", on main as on D41 (D41 changes no file under `network/` and no schema). (a) Recommended: put a status back on the entry; `planned` is what it held, and every other entry carries one. (b) Make `status` optional in the file's `schema:` block, so a dated entry may carry none. (c) Leave it, which keeps the integrity check red at every landing; this is the lazy option. Both files are yours, so I change neither until you rule. D41 lands with this red line named as main's, not D41's.
- 28. D46: the history check forbids the key name F1. `tests/checks/source/history.test.ts:41` lists `F1` among the plan's id families (the package F1, landed, `plan.md:79`), so the check fails on every comment and document line that names the F1 key: on D46's tree `chords.ts:3` and `:86`, `Workbench.svelte:278`, `Palette.svelte:4`, `palette.ts:474` and `:478`, `editor-status.svelte.ts:15`, `grid-keys.ts:2`, `HELP.md:81` and `docs/window.md:76`. D46's brief requires the key named in HELP's key row, `docs/window.md` and `editor-status.svelte.ts`. On main no comment or document names the package F1 (`grep -rnE '(^|[^A-Za-z])F1([^A-Za-z0-9]|$)'` over `src tests utils HELP.md DESIGN.md README.md docs` prints only the check's own line 41). Changing what a check passes is yours to rule. (a) Recommended: `F1` removed from `FAMILIES`, in D46 with the path widened; a comment naming the package F1 would then pass, and none does today, and the plan has no other F package. (b) The F1 pattern narrowed so a key named in prose passes (not next to `Shift+`, `Cmd+`, "and"); a guess about the next sentence that fails on it. (c) Every comment and document reworded to avoid the name ("the help key"); HELP.md would no longer say which key opens the palette; this is the lazy option. D46's builder waits for this ruling.

## Cases: first run on the unchanged tree, then after the change

The unchanged tree is a copy of the base at `$TMPDIR/d48/unchanged/oculus` (the base copy `.agents/worktrees/D48-base/tools/oculus` plus a `node_modules` link, `vite.config.ts`, `tsconfig.json`, `assets`, `demo` and the new test files with an adapter for the old `writes` signature). Scratch runs are `npx vitest run --config <scratch config> <file> --reporter=verbose --testTimeout 0` from `tools/oculus`; the config includes only `$TMPDIR/d48/*.scratch.ts`. No scratch file is in the worktree: `find` over the worktree for `*.scratch.ts` returns nothing, and the scratch files sit in `$TMPDIR/d48`.

No case needed a ruling: the first run found no case the brief's rules get wrong.

### Case 1

Checked by: scratch run `first1.scratch.ts` case 1 (`sideProject` on the raw map holding all eleven keys).

First run (unchanged tree): `CASE1 problems ["key:deadline","key:subtasks","key:followup","key:snooze","key:priority","key:pin","key:short","key:latest","key:collaborators","key:waiting-on","key:related"]`; `CASE1 project keys ["id","title","status","eli5","next","links","source","file"]` (eleven `key` findings, none of the values read, as the brief says)

After the change: `CASE1 problems []`; `CASE1 project keys ["id","title","status","eli5","next","links","short","pin","priority","latest","deadline","waitingOn","followups","snooze","subtasks","relatedIds","collaborators","source","file"]`

### Case 2

Checked by: scratch run, case 2 (`deadline: 5`, `subtasks: "x"`, `pin: "yes"`, `waiting-on: 3`, `venue`).

First run (unchanged tree): twelve `key` findings, each `key X is not one of title, status, eli5, next and links and is not read`, including `venue`; project keys `id,title,status,eli5,next,links,source,file`

After the change: five findings: `deadline: deadline is not text and is read as empty`; `pin: pin is not true or false and is read as empty`; `subtasks: subtasks is not a map or a list of lines and is read as empty`; `venue: key venue is not a field of the side-project schema and is not read`; `waiting-on: waiting-on is not a list of text and is read as empty`. The other fields are read (`short, priority, latest, followups, snooze, relatedIds, collaborators`).

### Case 3

Checked by: scratch run, case 3, and a reading of the import.

First run (unchanged tree): `CASE3 side subtasks undefined followups undefined`; the research reader gives `[{"key":"0","do":"a","deadline":"2026-11-01","done":false},{"key":"1","do":"b","done":false}]` and `[{"do":"x","after":"2026-11-01"},{"do":"y"}]`

After the change: `CASE3 side subtasks` and `CASE3 research subtasks` print the same value, and so do the followups; `normalise-personal.ts:23` is `import { followups, subtasks } from './normalise-plans.ts';`

### Case 4

Checked by: scratch run `first4.scratch.ts` (generator on a side manifest and a research manifest).

First run (unchanged tree): `CASE4 side manifest with eleven research-shaped values: valid=false ["additionalProperties:deadline","additionalProperties:subtasks",...` (every one of the eleven); `side manifest as it is today: valid=true`; `side manifest with venue: valid=false ["additionalProperties:venue"]`; `research manifest with the same values: valid=true`; `side help deadline null`, `side help waiting-on null`, `side help subtasks null`

After the change: `side manifest with eleven research-shaped values: valid=true`; `side manifest as it is today: valid=true`; `side manifest with venue: valid=false ["additionalProperties:venue"]`; `research manifest with the same values: valid=true`; help present for `deadline` ("The day the next deadline falls on; it shows on the Focus board while the project's status is live."), `waiting-on` and `subtasks` ("... The Focus board ticks, snoozes and deletes them; this form does not change them.")

### Case 5

Checked by: scratch runs `first5.scratch.ts` (`ticker()` over a snapshot) and `after5b.scratch.ts` (`categoryLabel`, `openLine`).

First run (unchanged tree): `TICKER overdue: []`, `TICKER deadlines: []`: no side line; `openLine` has no file opener and calls `onproject:side:x` (`first5b`)

After the change: `TICKER overdue: ["side|Deadline past|days=-5|snoozed=false|target={\"kind\":\"manifest\",\"id\":\"side:dlpast\"}"]`; `TICKER deadlines: ["side|dl|days=10|snoozed=false|target={\"kind\":\"manifest\",\"id\":\"side:dl10\"}"]` (the 120-day deadline and the parked project have no line); `CASE5 categoryLabel [["side","side projects"],["conference","conference calls"],["task","tasks"],["paper","papers"]]`; `CASE5 openLine calls ["onfile:{\"root\":\"hub\",\"path\":\"side-projects/dl10/project.yml\",\"label\":\"dl10\"}","onproject:proj-a"]`. The label: under `short` the 10-day line reads `side|dl|days=10|...side:dl10` and under `full` `side|Deadline ten|days=10|...side:dl10`.

### Case 6

Checked by: scratch run `first5`, subtasks and tasks lists.

First run (unchanged tree): `TICKER subtasks` holds only `pa: dated`; `TICKER tasks` holds only the research project's lines; `TICKER snoozed` holds only `pa: asleep`

After the change: `TICKER subtasks` adds `Tasks one: dated` (id `side:tasks`, subtask `0`); `TICKER tasks` adds `Tasks one: undated`; `TICKER snoozed` adds `Tasks one: asleep`; the done line is in none; `CASE6 runHeading ["side projects","other","funding"]`

### Case 7

Checked by: scratch run `first5`, follow-ups.

First run (unchanged tree): `TICKER followups` holds only `pa - due today`; `TICKER tasks` holds only `pa - notice now`

After the change: `TICKER followups` adds `Tasks one - due today` (`side:tasks`); `TICKER tasks` adds `Tasks one - notice now`; the future `after` appears in neither

### Case 8

Checked by: scratch run `first5`, snoozed project.

First run (unchanged tree): no side line in `TICKER snoozed`

After the change: `TICKER snoozed` holds `side|Snoozed one|days=10|snoozed=true|...side:snz` and the deadline is not in `TICKER deadlines`

### Case 9

Checked by: scratch run `first9.scratch.ts` on the unchanged tree and `after9.scratch.ts` after; the test rows named below.

First run (unchanged tree): `CASE9 writeManifest side:alpha {"found":false,"changed":[],"refused":[]}`, the same `found:false` for `manifestValue`, `writeSubtaskAdd`, `writeSubtask` on `side:alpha` and on `root:r`

After the change: `CASE9 snooze side:alpha ["snooze"]`, `wake`, `tick` (`["done"]`), `reopen`, `add` (`["subtasks"]`), `delete` for `side:alpha` and for `root:r`; `manifestValue` returns `{"found":true,"value":"2026-12-01"}`; `files back to the original true true`. The test rows are quoted under "Test rows on the unchanged tree" below.

### Case 10

Checked by: scratch run `first9`/`after9`, and the refusal rows of `writes.test.ts`.

First run (unchanged tree): `CASE10 outside field {"found":false,"changed":[],"refused":[]}`

After the change: `CASE10 unknown side id {"found":false,"changed":[],"refused":[]}`; `CASE10 root no longer served {"found":false,...}`; `CASE10 field outside the schema {"found":true,"changed":[],"refused":[{"field":"venue","reason":"the manifest schema does not name the field"}],"records":[]}`; `files unchanged after refusals true true`

### Case 11

Checked by: scratch run `after9.scratch.ts` (a scratch root under `$TMPDIR` with `.oculus/project.yml`).

First run (unchanged tree): no deadline line for a root project (case 5's before output has no side line at all); the root write returns `found:false`

After the change: `CASE11 personal ids ["root:r","side:alpha"]`; `CASE11 deadline lines ["Alpha|10|{\"root\":\"r\",\"path\":\".oculus/project.yml\",\"label\":\"Alpha\"}", ...]`; the snooze on `root:r` writes the file and the undo row `puts the manifest of root:r back byte for byte ...` passes

### Case 12

Checked by: scratch run `first5`.

First run (unchanged tree): `WAITING people []`

After the change: `WAITING people [{"label":"Alice","count":1}]` (the running side project counts; the parked one does not)

### Case 13

Checked by: reading of `Personal.svelte`, `board/personal.ts`, `CardLinks.svelte`; landing look not done.

First run (unchanged tree): no pin, flames, latest, waiting line, collaborator links or related line on a side card

After the change: Reading only: `Personal.svelte` draws the pin ring and glyph, flames, the latest line, the waiting line and `<CardLinks item={sideLinks(...)} />`, and `CardLinks.svelte` has a `related` kind labelled `personal.related` that opens a project tab. The landing look on a scratch oculus is the orchestrator's and is not done.

### Case 14

Checked by: arithmetic reading of `Ticker.svelte`; landing look not done.

First run (unchanged tree): row `min-height` 22 px, text `--fs-md`, button `padding: 3px 6px`, 14 px line, 1 px border: the button is 14s + 8 px high (17.8 px against a 15.4 px row at scale 0.7; 30.4 px against 35.2 px at 1.6)

After the change: `Ticker.svelte:132` `min-height: calc(18px * var(--text-scale, 1));` `:133` `font-size: var(--fs-xs);` `:134` `line-height: calc(14px * var(--text-scale, 1));` `:143`, `:150`, `:173`, `:204` `font-weight: 400;` `:193` `display: inline-flex;` `:196` `box-sizing: border-box;` `:197` `height: calc(18px * var(--text-scale, 1));` `:198` `padding: 0 6px;`. Row and button are 12.6, 18 and 28.8 px at scales 0.7, 1 and 1.6; the 14s line plus the 2 px border (11.8, 16, 24.4 px) fits inside the button at each. The Gallery's Ticker draws no button. The screenshot of Focus on TEST before and after is not done.

### Case 15

Checked by: scratch run `first15.scratch.ts` before and after.

First run (unchanged tree): `CASE15 3 projects 0 findings 0 read findings`

After the change: `CASE15 3 projects 0 findings 0 read findings`, identical; `tests/data/sources/personal.test.ts` ('reads the five fields') passes unchanged (inside the 11-file run below)

### Case 16

Checked by: scratch run `first16.scratch.ts` before and after; row 'a collaborators value of a side project manifest that names a person' of `references.test.ts`.

First run (unchanged tree): `CASE16 references of amir ["hub:network/joint-work.yml:5:13","hub:projects/active/alpha/project.yml:6:13","hub:projects/active/alpha/project.yml:7:16"]`; plan files: `registries/people.yml`, `network/joint-work.yml`, `projects/active/alpha/project.yml`

After the change: references add `hub:side-projects/idea/project.yml:2:16` and `hub:side-projects/idea/project.yml:3:13`; plan files add `hub:side-projects/idea/project.yml`

### Test rows on the unchanged tree (cases 9, 10 and 16)

Command: `npx vitest run tests/server/core/changes.test.ts tests/data/snapshot/references.test.ts tests/server/edit/writes.test.ts tests/routes/edit/undo/undo.test.ts` in the unchanged copy. Output as printed:

```
Test Files  4 failed (4)
     Tests  11 failed | 59 passed (70)

     x records one manifest field of a side project, a hub file by its relative path
     x records a subtask ticked, added and taken out in a side project
     x finds 'a collaborators value of a side proje...' (vitest cuts the title; the row is 'a collaborators value of a side project manifest that names a person')
     x side:idea: snoozes and wakes, changing that key of that file alone
     x root:r: snoozes and wakes, changing that key of that file alone
     x side:idea: refuses a field outside side_project_schema
     x root:r: refuses a field outside side_project_schema
     x side:idea: ticks, reopens and takes out a line
     x root:r: ticks, reopens and takes out a line
     x puts the manifest of side:idea back byte for byte after a snooze, a wake, a tick and an added line
     x puts the manifest of root:r back byte for byte after a snooze, a wake, a tick and an added line
```

The failures are `expected 404 to be 200` for the writes through `handleWrite`, and `a hit stands at the position: expected null not to be null` for the references row. The eleven rows above are proofs. Two further new rows, the unknown side id and the unserved root (case 10), pass on both trees: on the unchanged tree a side id is already refused with `found: false`, so those two rows guard the refusal and do not prove the change. The brief says each row fails on the unchanged tree; these two do not, and they are kept because the refusal is what the new lookup must still give.

## DONE / NOT DONE

| Item | State | Command that proves it |
|---|---|---|
| Seven build items (keys, Focus, buttons, Personal card, Ticker, text, sizes) | DONE | the commands below |
| Case 13 landing look on a scratch oculus | NOT DONE | needs a browser; the orchestrator's look |
| Case 14 landing look and Focus screenshots on TEST | NOT DONE | needs a browser; arithmetic reading done above |
| `npm run diagrams` | DONE | `diagrams-exit 0` |
| `npm run test:quick` | DONE, over its time limit | below |
| named vitest files | DONE | below |
| `npx vitest run tests/checks` | DONE | below |
| `folder-check` | DONE | `folder-check exit 0` |
| ASCII gate | DONE | below |
| unused-exports | DONE | below |

`npm run diagrams && npm run test:quick`, run once after the last change to source (the diagrams, then the quick tier):

```
diagrams-exit 0
test:quick: 66 changed file(s), from git since HEAD
test:quick: 118 test file(s), 10 essential
ok      prettier (3.5 s): All matched files use Prettier code style!
ok      ASCII gate (3.9 s)
ok      svelte-kit sync (15.2 s)
ok      eslint (60.4 s)
ok      svelte-check (93.4 s): 1791553983472 COMPLETED 441 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest (124.8 s): Duration  110.64s (transform 129.78s, setup 0ms, import 239.09s, tests 184.95s, environment 496ms)
test:quick: 128.6 s (limit 45.0 s); every command passed
test:quick: over the time limit
quick-exit 0
```

The brief's named files: `npx vitest run tests/server/edit/writes.test.ts tests/server/core/changes.test.ts tests/routes/edit/undo/undo.test.ts tests/data/sources/personal.test.ts tests/data/snapshot/normalise.test.ts tests/data/sources/manifests.test.ts tests/data/snapshot/references.test.ts tests/checks/source/keys.test.ts tests/checks/config/config-folder.test.ts tests/checks/config/config.test.ts tests/checks/tree/size.test.ts --testTimeout 0`:

```
Test Files  11 passed (11)
Tests  148 passed (148)
```

`npx vitest run tests/server/edit/writes.test.ts -t 'ticks and reopens'`: `Tests  1 passed | 12 skipped (13)`. The side rows tagged slow, `npx vitest run --tagsFilter slow tests/server/edit/writes.test.ts tests/routes/edit/undo/undo.test.ts tests/server/git/deposit.test.ts tests/server/core/changes.test.ts --testTimeout 20000`: `Test Files  4 passed (4)`, `Tests  14 passed | 23 skipped (37)`.

`npm run test:checks` (`vitest run tests/checks --testTimeout 0 --hookTimeout 0`):

```


 Test Files  17 passed (17)
      Tests  248 passed (248)
   Start at  15:56:07
   Duration  400.71s (transform 96.03s, setup 0ms, import 355.30s, tests 575.25s, environment 5ms)

checks-exit 0
```

`sh utils/folder-check.sh`: no output, `folder-check exit 0`. `sh utils/scratch-count.sh` printed `node before 0` and `node after 0`.

The ASCII gate, the perl command of `agents/spec.md` line 99 verbatim, from `tools/oculus`:

```
bfs: error: bin: No such file or directory.
perl exit 0
```

`tools/oculus/bin` does not exist in the worktree or in the main checkout (`ls /Users/axelfaes/workspace/research-hub/tools/oculus` lists no `bin`), so `find` prints that line for the path the gate names. The gate itself printed nothing. With `bin` left out of the `find` the command printed nothing and exited 0, with the output written to a file of 0 bytes.

`eslint .` exits 0 with no output; `prettier --check .` prints `All matched files use Prettier code style!`; `svelte-check` prints `COMPLETED 3565 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`.

`sh utils/unused-exports.sh` against `D48-base/tools/oculus/unused-exports.txt`, `diff base now`, the lines that differ (the file has 364 lines in both):

```
11c11
< src/lib/data/snapshot/normalise.ts: REGISTRY_KEYS, ENTITY_KINDS, followups, subtasks
---
> src/lib/data/snapshot/normalise.ts: REGISTRY_KEYS, ENTITY_KINDS
51c51
< src/lib/server/edit/writes.ts: coerce, createIdea, fieldTypes, insideHub, writeDeckSlides, createEntry, removeEntry, reorderCollection, writeEntry, collectionFile, identityField, writeHost, writeSubtask, writeSubtaskAdd, writeMute, writeRail, writeConfigKey, writeConfigValue, addRootTo, removeRootFrom, writeRoots, auditMuteWrite, configKeyWrite, configValueWrite, deckEditWrite, deckSlidesWrite,  [line cut for this report; the full lines are in diff of the two files]
---
> src/lib/server/edit/writes.ts: coerce, createIdea, fieldTypes, writeDeckSlides, createEntry, removeEntry, reorderCollection, writeEntry, collectionFile, identityField, writeHost, writeSubtask, writeSubtaskAdd, writeMute, writeRail, writeConfigKey, writeConfigValue, addRootTo, removeRootFrom, writeRoots, auditMuteWrite, configKeyWrite, configValueWrite, deckEditWrite, deckSlidesWrite, deleteEntry [line cut for this report; the full lines are in diff of the two files]
```

The step added no line to the list. Two lines changed, both by removal: `followups` and `subtasks` left the `normalise.ts` line because `normalise-plans.ts` now exports them and `normalise-personal.ts` imports them (`normalise-plans.ts` has no line, so both are used); `insideHub` left the `writes.ts` line because it is no longer re-exported (`manifest.ts` uses it inside the file only).

History words: a grep for `previously|formerly|used to|no longer|originally|reverted|removed|renamed|moved|legacy|earlier|instead of|fixed|bug|regress|migrat|D4x|D5x|package|step` over every line the step added to comments, test titles and docs found only descriptive uses (`still hide it`, `met again opens a new run`, `not out yet`, `what was wrong with its manifest`), none naming a past state or a session.

## Terms

No glossary.

## Files with line counts

Changed or new files outside `docs/diagrams/` (`wc -l`), from `diff -rq` against the base copy. Limits: source 880, component 520, at most 10 items per folder (`state/boards/board` holds exactly 10 files: `ls | wc -l` gives 10).

```
    1454 config/catalogs/options.yml
     875 src/lib/server/git/deposit.ts
     861 docs/apps.md
     836 src/lib/data/model/model-entities.ts
     735 src/lib/data/snapshot/normalise.ts
     684 src/lib/server/root/watch/portfolio.ts
     661 src/lib/data/model/index.ts
     660 src/lib/server/edit/writes.ts
     609 src/lib/server/edit/writes/manifest.ts
     608 utils/diagrams/writes.mjs
586 DESIGN.md
     521 src/lib/state/boards/ticker.ts
     511 tests/data/snapshot/references.test.ts
     422 src/lib/server/edit/writes/undo.ts
     421 src/lib/data/shapes/catalog-files.ts
     417 tests/server/core/changes.test.ts
     415 tests/routes/edit/write-fixture.ts
     405 src/lib/state/boards/board/presets.ts
     399 tests/routes/edit/undo/undo.test.ts
     385 src/lib/views/boards/focus/rows.ts
     374 src/lib/data/sources/manifests.ts
     373 src/lib/state/boards/focus.ts
     299 config/catalogs/vocab.yml
     295 src/lib/views/boards/personal/Personal.svelte
     287 src/lib/server/edit/writes/subtasks.ts
     285 src/lib/data/snapshot/normalise-personal.ts
     283 docs/views.md
     278 src/lib/views/boards/focus/CommandCenterView.svelte
     268 src/lib/ui/display/ticker/Ticker.svelte
     267 src/lib/views/boards/focus/CommandCenter.svelte
     248 tests/server/edit/writes.test.ts
     243 config/text/findings.yml
     223 src/lib/server/sessions/stores/hooks.ts
     205 src/lib/state/boards/board/personal.ts
     199 tests/server/edit/writes-fixture.ts
     191 src/lib/views/shared/card/CardLinks.svelte
     188 HELP.md
     178 src/lib/state/boards/board/ticker-lines.ts
     162 src/lib/state/boards/board/stats.ts
     157 src/lib/views/boards/focus/Tasks.svelte
     146 tests/server/git/deposit.test.ts
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

`docs/diagrams/` holds the regenerated `.dot` and `.svg` of channels, layer-data, layer-state, layer-views, layers and writes. `config/catalogs/options.yml` is 1454 lines and a config file; `deposit.ts` is 875 lines and was 875 at the base.

## The listed sentences

- `manifests.ts:25` (`PERSONAL_MAX_BYTES` comment): rewritten: "Its sixteen keys are a few lines each"
- `manifests.ts:356-360` (`readPersonal` head comment): rewritten: adds "and the Personal board and the Focus ticker read the records that make"
- `normalise-personal.ts` head comment: rewritten: it names the sixteen keys, the readers it shares with `normalise-plans.ts` and the finding words
- `hub-names.ts:82`: rewritten: "which the Personal board and the Focus ticker read"
- `config/sources.yml:15`: rewritten: "read by the Personal board and the Focus ticker; no research reader reads it"
- `docs/configuration.md:21` and `:41`: rewritten
- `DESIGN.md:552`: rewritten: the parenthesis no longer lists "the subtask and manifest writes" among what cannot find a side project
- `docs/views.md:23`: rewritten: "A side project is on no lane and in no audit; the Focus ticker and the waiting tally read it while its status is live."
- `docs/views.md:5-7` (Focus): rewritten
- `docs/apps.md:248`: rewritten: the `personal` map lists the new fields
- `docs/apps.md:417` and `:419`: rewritten: the manifest and subtask write rows say a side id is accepted
- `HELP.md:105`: rewritten
- `findings.yml:43`: rewritten: the type sentence is `'{0} is not {1} and is read as empty'` with five type words
- `findings.yml:45`: rewritten: `key {0} is not a field of the side-project schema and is not read`
- `vocab.yml` side-project statuses comment and `options.yml` `scan` help: rewritten
- `config/schemas/side-project-schema.yml` head comment: rewritten
- `docs/views.md` Personal paragraph other than line 23, and `model-entities.ts` and `model/index.ts` comments: rewritten where they named five keys or the Personal board alone

Still true and unchanged: `docs/views.md` text outside the lines above, which names nothing the change moves.

## Judgment calls

- A research id wins over a side id when both would match (`readManifests` is searched first); a side id is looked up only when the research reader does not hold it. Reversible.
- `TickerItem` has a `side` field holding the manifest target. It marks a line as a side line, and `openLine` opens it in a source tab through the file opener. The field is internal.
- `ticker-lines.ts` was split from `ticker.ts` so that `ticker.ts` stays at 521 lines and the side lines module imports no cycle at runtime.
- `sideLive` lives in `board/personal.ts` and reads `live` from the `side_project_status` row; a status outside the list is live.
- New words beyond `dlcat_side` and `personal.related`: `focus.command.side_deadline` ("deadline in {0}d") for the tail of a side deadline line. The related line reuses `project.card.software_glyph`.
- The Tasks band's side group heading uses `views.personal_glyph`, and the `side` ticker group uses `GLYPHS.side = 'spark'` as the brief says.
- The `agent` button is not offered on side lines, because it opens a research project's chat context.
- The `.plain` rule of `Ticker.svelte` was dropped; `.name` and `.plain` both take weight 400, so the rule had no effect.
- Existing guarded test titles are unchanged; side rows are separate `it` blocks beside them.
- An app with the `manifest` write kind can now write a side manifest by its `side:` or `root:` id; `docs/apps.md` says so. This widens what that kind reaches.
- A snooze with `hide` on a side manifest writes `snooze: "true"` and reads back without a finding, as the research write does.
- One `git diff --stat` and one `git status --short unused-exports.txt` were run early and late in the task by mistake; both are read-only and no other git command was run.

Files changed that the brief's path list does not name, each with its reason:

- `src/lib/data/shapes/catalog-files.ts` and `src/lib/data/sources/config/catalog/schemas/engine.ts`: the `live` flag on a side status row and the file shape of `side_project_schema` (a list of rows with `keymap` and `chips` widgets), which the generic block schema refused; `config-folder.test.ts` failed without it
- `src/lib/server/sessions/stores/hooks.ts`: `sideProjects(hub)` that reads the published portfolio for `WriteTarget.sideProjects`
- `src/lib/state/boards/board/presets.ts`, `board/index.ts`, `board/stats.ts`: the `LinkedItem` type that `CardLinks` takes, and `waitingLine` accepting a side project
- `src/lib/views/shared/card/CardLinks.svelte`: the `related` kind
- `src/lib/state/boards/board/ticker-lines.ts`, `side-lines.ts`: new files for the ticker lines and the side lines
- `tests/routes/edit/write-fixture.ts`, `tests/server/edit/writes-fixture.ts`, `tests/routes/edit/audit-mute.test.ts`, `tests/server/git/deposit.test.ts`: `sideProjects` on the target builders and the side fixture
- `src/lib/server/root/watch/portfolio.ts`, `src/lib/data/model/index.ts`, `config/catalogs/options.yml`, `docs/configuration.md`, `docs/apps.md` rows 417 and 419: sentences that named the five keys or said the Personal board alone reads a side project
- `utils/diagrams/writes.mjs`: `writesDrawn` now gives a plain arrow the next port when `labelsAcross` names it as running through the words of another arrow, as it already did for `arrowsAlong`; without it the regenerated writes diagram had two arrows through the `mkdir, rename` label and `tests/checks/diagrams/diagrams.test.ts` 'are clear of every other arrow in every drawing the source gives' failed. That test passes after the change (run alone and in `npm run test:checks`).

## User-visible before and after

- Side manifests: before, any of `deadline`, `subtasks`, `followup`, `snooze`, `priority`, `pin`, `short`, `latest`, `collaborators`, `waiting-on`, `related` gave a `key` finding and was dropped. After, they are read like a research manifest's, a wrong type drops that field alone with a `field_type` finding naming the type, and the YAML editor completes and checks them.
- Focus: before, side projects did not appear. After, a live side project's deadline is in a `side projects` group between tasks and conference calls, its follow-ups and subtasks appear as for a research project, a press opens its manifest in a source tab, and its `waiting-on` counts in the waiting tally. A parked project draws nothing.
- Buttons: snooze, wake, tick, reopen, delete and clear work on side lines and write the side manifest.
- Personal card: pin sorts first within a status, with a ring and glyph; priority flames, a latest line, a waiting line, collaborator links and a `related` line.
- Ticker rows: text is 11 px (`--fs-xs`) at weight 400 on an 18 px row with a 14 px line, and a shown button is exactly the row's height; before, rows were 22 px at 13 px with weight 600.
- Reference index: Find References and rename on a person key reach a side manifest's `collaborators` and `waiting-on` lines.
- Apps API: the `personal` map carries the new fields; an app with the `manifest` write kind can write a side manifest.

## Anything wrong in the brief

- It says each new row of cases 9 and 10 fails on the unchanged tree. Two refusal rows (unknown side id, unserved root) pass on it, as the first-run table shows; they remain as guards.
- Its path list omits the files named above under "Files changed that the brief's path list does not name"; each was needed by a check or a type.
- `agents/spec.md` line 99 names a `bin` folder that does not exist in `tools/oculus`, so the gate prints a `find` error as well as its result.
- `npm run test:quick` reports its 45 s limit as exceeded because the machine ran other agents' builds during the run; the 128.6 s figure is not a measure of the change alone.
