# O68 report

Everything in the brief is done. One red line remains in `npm run test:quick`: `tests/checks/source/history.test.ts` 'names no package id, date or session in any comment' fails on `src/desktop/app.ts:161`, a file this step does not touch; the same test fails the same way on the step's base (run quoted under "Verify 1"). The fix is a rewording of that comment ("this session" names the Electron session) and is the orchestrator's at landing, since the file is outside the brief's paths.

## Open items of the state file, verbatim

`.scratch/migration/orchestrator-state.md:162-164` holds no entry:

```
## Open items (only what Axel must rule on; every report tells him these in plain words, decisions first, until he has ruled)

An entry leaves this list for the closed log the moment Axel rules on it. What a review or a look found and no brief covered is not an open item: it is folded into an existing step in `plan.md` (Z468), never booked as a step of its own.
```

## The cases' first run (unchanged tree)

Command (W = the worktree, S = `/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/O68-builder`): `cd $W && npx vitest run --config $S/vitest.cases.config.mts --root $W $S/first.cases.test.ts`, output appended to `$S/first-out.txt`. The case file calls `laneOf` and `projectStatusWords` (cases 1-6; "drawn" is `words.slice(0, 2)`, what `LaneCard.svelte` drew with `CARD_CHIPS = 2`), the normaliser `career(raw, config)` and `summaryOf` (7-10), `categoryOf`/`projectRole` (11-14), `loadConfig` over a scratch copy of the demo hub (15), `handleWrite` over the route fixtures (16, 17). Output as printed:

```
case 1: lane=backburner words=["in-prep","journal","parked"] drawn=["in-prep","journal"]
case 2: lane=push words=["submit-ready"] drawn=["submit-ready"]
case 3: lane=review words=["submitted","journal","results-in","admin-prep","ai-tells"] drawn=["submitted","journal"]
case 4: lane=blocked words=["exploring","parked","blocked"] drawn=["exploring","parked"]
case 5: lane=idea words=["nascent"] drawn=["nascent"]
case 6a: lane=run words=["exploring","poster","poster"] drawn=["exploring","poster"]
case 6b: lane=run words=["exploring","results-in","results-in"] drawn=["exploring","results-in"]
case 7: goal=undefined milestone="FWO Senior" milestoneDate=undefined folded(summaryOf)="FWO Senior"
case 8: no days-left function on the tree
case 9a: goal=undefined milestone="FWO Senior" milestoneDate=undefined folded(summaryOf)="FWO Senior"
case 9b: goal=undefined milestone="FWO Senior" milestoneDate=undefined folded(summaryOf)="FWO Senior"
case 9c: goal=undefined milestone="" milestoneDate=undefined folded(summaryOf)=""
case 9d: goal=undefined milestone=undefined milestoneDate=undefined folded(summaryOf)=""
case 9e: goal=undefined milestone=undefined milestoneDate=undefined folded(summaryOf)=""
case 10 model: hosts=[{"name":"A","status":"warm","scores":{}}] hostCriteria=["x"] eligibility={"rule":["r"],"shots":[]} dropped=[{"what":"d"}] sections=["hosts","host_criteria","eligibility","dropped"]
case 10 findings on career.yml: []
case 11/13 p1: category=publications role=lead
case 11/13 p2: category=other-outputs role=supervisor
case 11/13 p3: category=in-review role=collaborator
case 11/13 p4: category=in-flight role=lead
case 11/13 p5: category=idea role=lead
case 11/13 p6: category=undefined role=lead
case 11/13 p13: category=in-review role=lead
case 11 record rows: ["in-review","in-flight","publications","other-outputs"]
case 11 roles with a field: ["lead","supervisor","collaborator"]
case 11-14: no track record function on the tree; no obtained flag in statuses: []
case 15 findings naming career_: []
case 15 demo config sets: ["career_host_status","career_score_dims","career_score_tones"]
case 16 page: status=200 body={"ok":true,"changed":[],"refused":[]} unchanged=true
case 16 page (candidate): status=200 body={"ok":true,"changed":["status"],"refused":[]} unchanged=false
case 17 host record line: {"at":"2026-10-24T17:57:33.522Z","kind":"host","file":"/var/folders/7r/49ks4w4558vcr57tvb9svmph0000gp/T/oculus-route-lv3LIr/.oculus/data/academic/career.yml","key":"Naesens","field":"status","before":"warm","after":"candidate","undo":"field"}
case 17 undo: status=200 body={"ok":true,"changed":["status"],"refused":[]} back=true
case 16 app declaring [host]: status=200 body={"ok":true,"changed":[],"refused":[]} unchanged=true
case 16 app declaring [lead-add]: status=200 body={"ok":true,"changed":[],"refused":[]} unchanged=true
case 16 manifest findings for writes: [host]: []
```

Case 10 on a published snapshot of the unchanged tree, run on a replica of the base (`rsync` of `.agents/worktrees/O68-base` into `$S/base-tree`, `local.yml` excluded, node_modules linked): `cd $S/base-tree && npx vitest run --config $S/vitest.base.config.mts --root $S/base-tree $S/base10.cases.base.ts`. The model read `hosts`, `hostCriteria`, `notHosts`, `eligibility` and `dropped` (the demo's "Rivera Lab", "Meridian Institute", "Coastal AI Center"), and the schema check gave `hosts is [...], which is not a key of vocab.career_host_status`, since the demo config then defined that vocabulary; no `bad_from`.

No case is one the brief's rules get wrong. One observation on the base: case 16's "app declaring [lead-add]" row shows the server's app gate let an app send a `host` body with `X-Oculus-Kind: host` when its manifest declared only `lead-add` (200). The page frame refuses it before the request (`src/lib/state/system/apps/methods.ts:350`). After the step the `host` body matches no write kind, so that row is 403; the gate's handling of an undeclared but known kind is unchanged and outside this step.

## The cases after the change

Command: `cd $W && npx vitest run --config $S/vitest.cases.config.mts --root $W $S/after.cases.test.ts`, output in `$S/after-out.txt`. Cases 1-6 call `laneMarks(project, lane)` (state/boards/focus.ts), the marks `LaneCard.svelte` now draws whole. Cases 7-9 call `career(raw)`, `daysLeft(date, Date.parse('2026-10-24T12:00:00'))` and `foldedLine`. Case 10 publishes a scratch copy of the demo hub with a `hosts` schema row and the four old sections appended. Cases 11-14 call `trackRecord(snapshot, config)`. Output as printed:

```
case 1: lane=backburner marks=["in-prep","journal"]
case 1 no form: lane=backburner marks=["in-prep"]
case 2: lane=push marks=["submit-ready"]
case 3: lane=review marks=["journal","results-in","admin-prep","ai-tells"]
case 4: lane=blocked marks=["exploring","parked"]
case 5: lane=idea marks=[]
case 6a: lane=run marks=["poster"]
case 6b: lane=run marks=["results-in"]
case 7: goal="Assistant professor" milestone="FWO Senior" milestoneDate="2026-11-17" daysLeft="in 24d" folded="Career strategy | Next: FWO Senior (2026-11-17)"
case 8: ["in 1d","today","1d ago","3d ago"]
case 9a: goal=undefined milestone="FWO Senior" milestoneDate=undefined daysLeft="" folded="Next: FWO Senior"
case 9b: goal=undefined milestone="FWO Senior" milestoneDate=undefined daysLeft="" folded="Next: FWO Senior"
case 9c: goal=undefined milestone=undefined milestoneDate=undefined daysLeft="" folded=""
case 9d: goal=undefined milestone=undefined milestoneDate=undefined daysLeft="" folded=""
case 9e: goal=undefined milestone=undefined milestoneDate=undefined daysLeft="" folded=""
case 10 model keys: ["title","situation","order","sections"] sections=["title","hosts","host_criteria","not_hosts","eligibility","dropped"]
case 10 findings on career.yml schema: [["schema.hosts","the field hosts takes its keys from vocab.career_host_status, which is no registry, projects or vocab list"]]
case 10 snapshot career keys: ["title","goal","milestone","milestoneDate","situation","order","sections","schema"]
case 11: {"roles":[{"key":"lead","label":"Lead","lines":[{"key":"in-review","label":"in review","count":0},{"key":"in-flight","label":"in flight","count":1},{"key":"publications","label":"publications","count":1},{"key":"other-outputs","label":"other outputs","count":0}]},{"key":"supervisor","label":"Supervisor","lines":[{"key":"in-review","label":"in review","count":0},{"key":"in-flight","label":"in flight","count":0},{"key":"publications","label":"publications","count":0},{"key":"other-outputs","label":"other outputs","count":1}]},{"key":"collaborator","label":"Collaborator","lines":[{"key":"in-review","label":"in review","count":1},{"key":"in-flight","label":"in flight","count":0},{"key":"publications","label":"publications","count":0},{"key":"other-outputs","label":"other outputs","count":0}]}],"funding":1}
case 12 self unset: null
case 12 nothing to count: null
case 13: {"roles":[{"key":"lead","label":"Lead","lines":[{"key":"in-review","label":"in review","count":1},{"key":"in-flight","label":"in flight","count":0},{"key":"publications","label":"publications","count":0},{"key":"other-outputs","label":"other outputs","count":0}]}],"funding":0}
case 14: {"roles":[{"key":"lead","label":"Lead","lines":[{"key":"in-review","label":"in review","count":0},{"key":"in-flight","label":"in flight","count":1},{"key":"publications","label":"publications","count":1},{"key":"other-outputs","label":"other outputs","count":0}]},{"key":"supervisor","label":"Supervisor","lines":[{"key":"in-review","label":"in review","count":0},{"key":"in-flight","label":"in flight","count":0},{"key":"publications","label":"publications","count":0},{"key":"other-outputs","label":"other outputs","count":1}]},{"key":"collaborator","label":"Collaborator","lines":[{"key":"in-review","label":"in review","count":1},{"key":"in-flight","label":"in flight","count":0},{"key":"publications","label":"publications","count":0},{"key":"other-outputs","label":"other outputs","count":0}]}],"funding":0}
case 15 findings naming career_: [["career_host_status","key career_host_status is not one the hub's settings file takes; it is not applied"]]
case 15 merged config holds career_host_status: false
case 16 page: status=400 body={"error":"the body is not a write this route knows"} unchanged=true
case 16 app declaring [host]: status=403 body={"error":"kind"} unchanged=true
case 16 app declaring [lead-add]: status=403 body={"error":"kind"} unchanged=true
case 16 manifest findings for writes: [host]: [["apps[notes]","writes names host, which is no write an app can ask for, so the folder is not an app"]]
case 17 undo: status=404 body={"error":"gone"} thrown="" unchanged=true
```

Reading of the results against the brief:

- Cases 1-6 match the brief. Case 3 draws all four marks; the card's first row `.card-h` has `flex-wrap: wrap` (`LaneCard.svelte:165`), so a narrow card wraps them. The look on the TEST page is at landing.
- Case 9c: the brief's `milestone: ""` with a date gives no milestone and no date. Case 9e: a map as `milestone` gives none.
- Case 10: the message is the catalog text of `findings.schema.bad_from` (`config/text/findings.yml:255`). The model keeps the four old sections only in `sections`, which the career editor edits; the banner reads none of them.
- Case 11: the `nascent` project files under `idea` and the published one with no form under no category, so neither is counted; funding obtained 1 (the `awarded` entry; `rejected` carries no `obtained`).
- Case 13: the project naming the user as lead and collaborator is counted once, under lead.
- Case 14: run with the merged config's `statuses` replaced by a map without `obtained`: funding 0, so the panel draws no funding line (`{#if record.funding > 0}`), no error.
- Case 17: the undo of a `host` record answers 404 `gone`, since the undo's record kinds no longer hold `host` (`undo.ts` `RECORD_KINDS`), no exception, the file unchanged.

## DONE / NOT DONE

| Item | State | Proof |
| --- | --- | --- |
| 1 `laneMarks`, card draws every mark its lane does not say, `CARD_CHIPS` gone | DONE | cases 1-6 above; grep 3 shows no `CARD_CHIPS` |
| 2 career model (title, goal, milestone, milestone date, situation, order, order note, sections, schema), `Host` gone, normaliser `config` gone, `status-rows.ts` deleted | DONE | case 10 keys; `git status` shows `D src/lib/state/shared/words/status-rows.ts` |
| 3 track record, `obtained` flag on awarded and granted with its comment and shape help | DONE | cases 11-14; `config/catalogs/vocab.yml:109`, `vocab.ts:173` |
| 4 days-left words, panel sections, `foldedLine`, `CareerHosts.svelte` deleted, texts | DONE | cases 7-9; `git status` shows `D src/lib/views/boards/focus/career/CareerHosts.svelte` |
| 5 write kind `host` removed everywhere, three hub keys removed, awaiting hosts removed, diagrams regenerated | DONE | cases 15-17; grep 3; `npm run diagrams` output in `$S/quick.txt` |
| 6 demo fixture, docs, tests | DONE | file list below; changed tests run below |
| Verify 1 `npm run diagrams && npm run test:quick` | RED on one line the step does not cause | see below |
| Verify 2 character-set check | DONE | prints nothing, exit 0 |
| Verify 3 the grep | DONE | every line explained below |
| Verify 4 unused exports | DONE | only removals, quoted below |
| Verify 5 changed tests before and after | DONE | 248 passed / 2 skipped before; 251 passed / 2 skipped after |
| Verify 6 comments and doc sentences read | DONE | below |

Verify 1, `cd $W && npm run diagrams && npm run test:quick` (output in `$S/quick.txt`), tier lines as printed:

```
test:quick: 64 changed file(s), from git since HEAD
test:quick: 295 test file(s)
ok      prettier (1.0 s): All matched files use Prettier code style!
ok      ASCII gate (1.1 s)
ok      svelte-kit sync (2.3 s)
ok      eslint (22.2 s)
ok      svelte-check (45.9 s): 1792866281526 COMPLETED 537 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
FAILED  vitest checks (221.1 s)
ok      vitest (279.1 s): Duration  269.16s (transform 268.22s, setup 0ms, import 584.09s, tests 405.38s, environment 29.32s)
ok      vitest slow (324.1 s): Duration  314.19s (transform 35.47s, setup 0ms, import 289.06s, tests 947.77s, environment 22ms)
test:quick: 326.5 s; failed: vitest checks
```

The one failure:

```
 FAIL  |unit| tests/checks/source/history.test.ts > no history in code > names no package id, date or session in any comment
+ src/desktop/app.ts:161: // Every window of the app loads its pages on this session, so the mark rides every request
```

`SESSIONS = ['this session', 'earlier session']` (`tests/checks/source/history.test.ts:68`) matches the Electron session in that comment. `git diff --stat -- src/desktop/app.ts` prints nothing, and the line is the same at HEAD (`git show HEAD:src/desktop/app.ts | sed -n 161p`). On the base replica, `cd $S/base-tree && npx vitest run --root $S/base-tree tests/checks/source/history.test.ts` gives `Tests  1 failed | 5 passed (6)` with the same received line. `git log -L161,161:src/desktop/app.ts` names `a7d82144 Send the page's first HTML with the theme it starts on` as the commit that wrote it. Suggested fix at landing: `src/desktop/app.ts:161` "loads its pages on this session" becomes "loads its pages on the default session `ses`".

Verify 2, as printed: `LC_ALL=C perl -ne '...' $(find src tests bin config -type f ! -name local.yml)` printed only `bfs: error: bin: No such file or directory.` (the tree has no `bin/`) and no line; `echo $?` gave `0`. `LC_ALL=C grep -n '[^ -~]' docs/HELP.md docs/apps.md docs/data-map.md docs/templates.md` printed nothing.

Verify 3, the grep of the brief, every remaining line:

- `src/hooks.server.ts:144` (`headers.get('host')`), `src/lib/shell/status/status-items.ts:40,90` and `StatusBar.svelte:214` (the status bar's host item), `src/lib/server/machine/apps/read/manifest.ts:127,511` and `serve/oculus.js:239` (an app's host program), `src/lib/server/machine/runs/recover/routes.ts:250,361` and `recover-words.ts:77` (the recover refusal `host`), `tests/ui/controls/editor/lsp-transport.test.ts:196-200`, `tests/shell/panes/strip/app-editor-close.test.ts:59`, `tests/server/machine/hpc/actions.test.ts:14,28`, `tests/server/machine/apps/oculus-frame.test.ts:31`, `tests/state/workbench/options-pages.test.ts:91`, `tests/routes/machine/recover.test.ts:112`: the word `'host'` for other things.
- `src/lib/state/workbench/layout/index.ts:78`, `layout.svelte.ts:79,581`, `layout/open/float/pages.ts:386`, `layout/tabs/instances.ts:21,296,298`: the workbench's `writeHost`, which writes the workbench of a float window.
- `tests/state/forms/record-values.test.ts:31-172`: a form fixture named `eligibility`.
- `tests/data/sources/career.test.ts:36,38,40`: the old sections written into a career file for the test 'reads none of the sections the banner does not draw into the model'.
- `docs/diagrams/writes.dot:419,521,523` and `writes.svg:1741,1909` were printed by the grep run before `npm run diagrams`; after it, `grep -cE "writeHost|hostStatus|hostWrite" docs/diagrams/writes.dot docs/diagrams/writes.svg` prints `docs/diagrams/writes.dot:0` and `docs/diagrams/writes.svg:0` (the regeneration rewrote both files: 1160 to 1148 and 3972 to 3900 lines).

Verify 4, `sh utils/unused-exports.sh` against `.agents/worktrees/O68-base/unused-exports.txt`, `diff` as printed:

```
49c49
< src/lib/server/edit/writes.ts: coerce, createIdea, ... writeFollowup, writeHost, writeSubtask, ... followupWrite, hostWrite, manifestWrite, ...
---
> src/lib/server/edit/writes.ts: coerce, createIdea, ... writeFollowup, writeSubtask, ... followupWrite, manifestWrite, ...
```

The only change is `writeHost` and `hostWrite` gone. The step's added exports `laneMarks`, `foldedLine`, `daysLeft`, `trackRecord`, `TrackRecord`, `entryPeople` and `isSelfByKey` have importers; the row types `RecordLine` and `RoleRecord` are local to `state/boards/career.ts`.

Verify 5, the changed test files: `npx vitest run tests/data/sources/career.test.ts tests/server/edit/writes.test.ts tests/server/core/changes.test.ts tests/routes/edit/undo/undo.test.ts tests/routes/hubs/hub-writes.test.ts tests/state/client/held-unsaved.test.ts tests/state/forms/page-entry.test.ts tests/checks/config/config-folder.test.ts`. On the unchanged tree (`$S/base-tests.txt`): `Test Files  8 passed (8)`, `Tests  248 passed | 2 skipped (250)`. After (`$S/after-tests.txt`): `Test Files  8 passed (8)`, `Tests  251 passed | 2 skipped (253)`.

Verify 6, comments and document sentences: the added comment lines (`git diff -U0 -- src tests | grep -E "^\+\s*(//|\*|/\*\*|<!--|#)"`) and the docs diffs were read against `spec.md`'s comment rules and the prose rules. The history-word grep over added lines (`git diff -U0 | grep "^+" | grep -niwE "before|used to|no longer|still|previously|anymore|formerly|was|were|now|instead|replaces|replaced|removed|old|new|legacy|retired"`) leaves: "before the day" in `daysLeft`'s comment (a day before the milestone), "that was obtained" (the funding status), `now` as the parameter name, `new-entry`/`new-idea` and "New project write" (names of write kinds), "Now:" and "rule: [...before 1 Oct...]" (fixture data). None is history. No departure remains.

## test:quick count and whole-suite commands

`npm run test:quick` completed once, after the last change (the run quoted above). One earlier start of `npm run diagrams && npm run test:quick` was stopped before its vitest tiers finished, because three comment words were changed after it began; its output was overwritten and is not used. No whole-suite command ran.

## Files with line counts (base -> now)

```
config/catalogs/vocab.yml 264 -> 265
config/defaults/sources.yml 114 -> 114
config/options/sources.yml 125 -> 125
config/text/server.yml 536 -> 530
config/text/views/boards/focus.yml 136 -> 131
config/text/views/system/history.yml 111 -> 110
docs/HELP.md 558 -> 558
docs/apps.md 822 -> 820
docs/data-map.md 228 -> 223
docs/templates.md 1360 -> 1299
docs/diagrams/writes.dot 1160 -> 1148
docs/diagrams/writes.svg 3972 -> 3900
docs/diagrams/layers.dot 101 -> 101, layers.svg 556 -> 556
docs/diagrams/layer-data.dot 94 -> 94, layer-data.svg 465 -> 465
docs/diagrams/layer-server.dot 159 -> 159, layer-server.svg 781 -> 781
docs/diagrams/layer-state.dot 173 -> 173, layer-state.svg 855 -> 855
docs/diagrams/layer-views.dot 189 -> 189, layer-views.svg 855 -> 855
src/lib/data/helpers/files/apps/apps.ts 309 -> 308
src/lib/data/helpers/hub-names.ts 474 -> 470
src/lib/data/model/index.ts 842 -> 841
src/lib/data/model/model-collections.ts 267 -> 257
src/lib/data/shapes/boards/roles.ts 208 -> 208
src/lib/data/shapes/catalog-files/vocab.ts 422 -> 390
src/lib/data/snapshot/normalise-parts/career.ts 165 -> 87
src/lib/data/snapshot/normalise.ts 647 -> 647
src/lib/data/sources/documents/career.ts 27 -> 27
src/lib/server/edit/entry-edit/entries.ts 391 -> 391
src/lib/server/edit/entry-edit/host-status.ts deleted (81)
src/lib/server/edit/entry-edit/index.ts 17 -> 16
src/lib/server/edit/writes.ts 804 -> 788
src/lib/server/edit/writes/apps/gate.ts 134 -> 132
src/lib/server/edit/writes/bodies.ts 706 -> 692
src/lib/server/edit/writes/subtasks.ts 440 -> 339
src/lib/server/edit/writes/undo.ts 631 -> 615
src/lib/server/edit/yaml/why.ts 75 -> 71
src/lib/state/boards/career.ts 96 -> 114
src/lib/state/boards/focus.ts 492 -> 503
src/lib/state/client/writes.svelte.ts 868 -> 859
src/lib/state/sessions/source/write-files.ts 264 -> 263
src/lib/state/shared/stores/shapes.ts 517 -> 516
src/lib/state/shared/words/status-rows.ts deleted (40)
src/lib/views/boards/focus/Focus.svelte 273 -> 272
src/lib/views/boards/focus/career/CareerHosts.svelte deleted (196)
src/lib/views/boards/focus/career/CareerPanel.svelte 412 -> 354
src/lib/views/boards/focus/lanes/LaneCard.svelte 233 -> 228
src/lib/views/boards/focus/lanes/Lanes.svelte 366 -> 369
tests/checks/config/config-folder.test.ts 814 -> 807
tests/data/real-hub.probe.ts 143 -> 145
tests/data/sources/career.test.ts 126 -> 183
tests/fixtures/hubs/demo/.oculus/config.yml 57 -> 39
tests/fixtures/hubs/demo/.oculus/data/academic/career.yml 34 -> 14
tests/routes/edit/undo/undo.test.ts 872 -> 863
tests/routes/edit/write-fixture.ts 547 -> 546
tests/routes/hubs/hub-writes.test.ts 841 -> 815
tests/server/core/changes.test.ts 573 -> 564
tests/server/edit/writes-fixture.ts 205 -> 207
tests/server/edit/writes.test.ts 845 -> 793
tests/state/client/held-unsaved.test.ts 449 -> 444
tests/state/forms/page-entry.test.ts 244 -> 239
```

Files beyond the brief's list: the eight `docs/diagrams/layer*.dot|svg` files, rewritten by `npm run diagrams` because the step's import changes move the folder-to-folder import counts (for example `"server to data" [label="520"]` to `518`). Brief paths not changed: `src/lib/data/index.ts`, `tests/fixtures/hubs/deposit-world.ts`, `tests/data/hubs/hubs-fixture.ts`; each calls `readCareer` or `careerRules`, whose signatures the step kept, and names no host.

No source file passes 880 lines and no component 520 (largest: `writes.svelte.ts` 859, `CareerPanel.svelte` 354).

## Judgment calls the brief left open

1. The model carries the milestone as two optional strings, `milestone` and `milestoneDate`, one per key of the file (`milestone`, `milestone_date`), rather than one object.
2. `milestoneDate` is set only when `milestone_date` matches `ISO_DATE` (`src/lib/data/helpers/dates.ts`) and `milestone` holds words, since a day with no milestone names nothing (case 9c).
3. A track record role line lists every record row, zeros included, so each role shows the same rows in the same order; a role with all zeros is left out. The funding line is drawn only when the count is above 0.
4. The track record is drawn as the panel's last section, after the order of work, in the same label grid (`.facts`) as the situation.
5. The days left are a `Tag` after the milestone's date on the Next line.
6. `entryPeople` and `isSelfByKey` in `data/shapes/boards/roles.ts` are exported so the track record counts funding leads with the same rule as the boards (`isLead`), instead of a second reading of the role fields.
7. `config-folder.test.ts` 'uses glyph names for every configured icon' now reads the icons of `stages`, `forms`, `chips` and `statuses` (before: the host statuses and `statuses`) and asserts the list is not empty; the flag count rises from 37 to 38 for `obtained`.
8. The demo career file was rewritten in the new shape with fake data (`goal`, `milestone: "Fellowship application"`, `milestone_date: "2027-10-15"`), without a `schema:` block, as before.

## Edits to existing assertions (before / after)

- `tests/checks/config/config-folder.test.ts` 'uses glyph names for every configured icon': before, `career_host_status` icons checked in the glyph catalog plus `statuses` icons; after, the icons of `stages`, `forms`, `chips`, `statuses`, `expect(icons.length).toBeGreaterThan(0)` added, the glyph check unchanged. Flag count: before `toHaveLength(37)` with "7 status flags"; after `toHaveLength(38)` with "8 status flags".
- `tests/server/edit/writes.test.ts`: describe 'writing one career host' removed with its write. In describe 'writing career sections' the fixture `CAREER_SECTIONS` holds `milestone_date`, `order` and `situation` instead of `hosts` and `eligibility`; 'writes a renamed label...' checks `toContain('order:\n  - { task: "Veni pre-proposal"')` (before `hosts:\n  - { name: "Naesens"`); 'changes a score column of a host and keeps the other hosts and columns' became 'changes the day of one task of the order of work and keeps the other tasks' (`changed` `['order']`, before `['hosts']`); 'changes the caveat of the eligibility map and keeps its rule' became 'changes one fact of the situation and keeps the other with its comment'; 'refuses a value of the wrong type...' writes `{ milestone_date: 'soon' }` (before a host with status `promoted`).
- `tests/server/core/changes.test.ts`: 'records a career host, a session override and a feed field' became 'records a session override and a feed field', the host record's `toMatchObject` removed; `CAREER` is `title: Career\ngoal: "Assistant professor"\n`.
- `tests/routes/edit/undo/undo.test.ts`: 'puts a career host and a subtask line back' became 'takes an added subtask line out again', the host write and its undo removed; the subtask part unchanged.
- `tests/routes/hubs/hub-writes.test.ts`: the row "writes an app's host status to the first hub's career file in a workspace with no primary" removed.
- `tests/state/client/held-unsaved.test.ts`: the row 'a host status' removed from describe 'a write that adds a record and names no hub, in a workspace with no primary'.
- `tests/data/sources/career.test.ts`: "gives a host with no status the hub's career_host_status word carrying default" removed; 'parses it as the map it is, with no key renamed' expects the `milestone_date` key; added `it.each` 'reads $name' (six rows: goal, milestone with its day, no day, a day that is no day, an empty milestone, a milestone that is a map) and 'reads none of the sections the banner does not draw into the model'.
- `tests/state/forms/page-entry.test.ts`: the model's `hosts`, `hostCriteria`, `notHosts`, `eligibility`, `dropped` removed from its career fixture.

## Visible changes, before and after

- Lane cards' marks: before, the first two of stage, form and chips, the lane's own words included (case 3 drew `submitted`, `journal`). After, every mark the lane does not say, each once, wrapping (case 3 draws `journal`, `results-in`, `admin-prep`, `ai-tells`; case 5 draws none).
- Career banner sections: before, situation, Next (milestone text), order of work, Host pipeline (`CareerHosts.svelte`, score chips, status menu), Not hosts, FWO Senior eligibility (Shots left, Rules, Caveat), Dropped. After, situation, Goal, Next (milestone, its date, days left), order of work with its note, Track record (role, one line per record row, "funding obtained: N").
- Folded line: before, title, `Next: ` the milestone cut at " (" or " - ", and "N in flight" (`Career strategy | Next: FWO Senior | 1 in flight` for the hub). After, title and `Next: FWO Senior (2026-11-17)`.
- Awaiting box: the "Host outreach" row is gone; the other rows are unchanged.
- App write kind `host`: before, accepted by the app gate and the page route (200). After, a page's `host` body is 400 "the body is not a write this route knows"; an app's is 403 `kind`; a manifest declaring `writes: [host]` gets `write_unknown` and is no app.
- Three hub keys: `career_host_status`, `career_score_dims`, `career_score_tones` in a hub's `.oculus/config.yml` are `hub_key_unknown` findings ("key career_host_status is not one the hub's settings file takes; it is not applied") and are not applied.
- History view: an old `host` record shows its raw kind `host`, since the view words a kind only when `history.kind_<kind>` is in the catalog (`src/lib/views/system/history/History.svelte:120`) and `kind_host` is gone; its undo answers 404 `gone` and changes nothing (case 17).

## Brief errors

None found. Case 10's `bad_from` holds only once the hub no longer defines `career_host_status`; on the base, where the demo defined it, the same schema row gave the "not a key of vocab.career_host_status" finding instead, as quoted above.

## Doc text

`grep -no` over `.scratch/migration/agents/guarded.md` (the lines are 5,000 to 11,000 characters; each fragment is quoted as `grep -no` prints it, with its replacement):

- G8, line 72: `72:describe 'a write that makes a record' (with its row "writes an app's host status to the first hub's career file in a workspace with no primary")` becomes `describe 'a write that makes a record', every row`. The fragment `72:describe 'writing career sections'` (followed by ", every row") stays: the describe keeps its name and its renamed rows.
- G9, line 75: `75:'records a career host, a session override and a feed field'` becomes `'records a session override and a feed field'`; `75:'puts a career host and a subtask line back'` becomes `'takes an added subtask line out again'`.
- G28, line 82: `82:describe 'the writes of the entry pages over a file a source tab holds unsaved text of', every row` and `82:describe 'a write that adds a record and names no hub, in a workspace with no primary'` stay as written: both name a whole describe, and the removed row 'a host status' was in the second.
- G32, line 227: `` 227:`tests/data/sources/career.test.ts`, 'parses it as the map it is, with no key renamed', 'reads the title, the milestone and the situation strip' `` becomes `` `tests/data/sources/career.test.ts`, 'parses it as the map it is, with no key renamed', 'reads the title, the milestone and the situation strip', describe 'normalising it', the rows 'reads $name' and 'reads none of the sections the banner does not draw into the model' ``. The fragment "describe 'what the editor edits', every row" stays.

## Hub rewrite

Built from `~/workspace/research-hub/.oculus/data/academic/career.yml` (98 lines), `.oculus/config.yml` and `.oculus/data/academic/funding.yml`, read only. Drafts in `$S/hub/career.yml` and `$S/hub/hosts.md`. The drafted career file was read with this step's code over a scratch copy of the demo hub (`cd $W && npx vitest run --config $S/vitest.cases.config.mts --root $W $S/hubdraft.cases.test.ts`, output `$S/hubdraft-out.txt`):

```
model: {"title":"Career strategy","goal":"Assistant professor / tenure-track (NL UD or Flemish ZAP)","milestone":"FWO Senior","milestoneDate":"2026-11-17","situation":[{"label":"PhD",...},{"label":"Past",...},{"label":"Now",...},{"label":"Also",...}],"order":[{"task":"ERC Starting Grant","when":"Oct 2027","note":""}]}
schema fields: ["title:text","goal:text","milestone:text","milestone_date:date","situation:records","order_note:textarea","order:records"]
findings on career.yml: []
folded: "Career strategy | Next: FWO Senior (2026-11-17)" daysLeft on 2026-10-24: "in 24d"
```

The hub's career file has no `order_note`, no `not_hosts` and no `dropped:` key (line 98 is the comment `# Dropped - what + why` with nothing after it), so neither the new career file nor the Markdown file carries a dropped list or a not-hosts list.

### `.oculus/data/academic/career.yml`, whole new text

```yaml
# Career strategy: drawn by oculus as the Focus page's career banner, the Career strategy panel.
# This file holds the goal, the next milestone with its day, the situation and the order of work. Funding and career deadlines live as `deadline:` on the entries of .oculus/data/academic/funding.yml, where they drive the "This week" ticker. The FWO Senior hosts, the host criteria and the eligibility are in funding/2026-fwo-senior-transplant/hosts.md.
# Form schema: the sections of this file, one field each. A records field lists the fields of each row, and open: true lets a row carry keys the schema does not name (the situation's labels).
schema:
  - { field: title, type: text, help: "The name the Career strategy panel is listed under." }
  - { field: goal, type: text, help: "The position the career plan works toward." }
  - { field: milestone, type: text, help: "The next milestone, shown at the head of the panel." }
  - { field: milestone_date, type: date, help: "The day of the next milestone, YYYY-MM-DD; the panel counts the days left to it." }
  - field: situation
    type: records
    open: true
    help: "Facts about where the hub owner stands now, one label and one sentence each."
    fields: []
  - { field: order_note, type: textarea, help: "A note drawn over the order of work." }
  - field: order
    type: records
    help: "The order of work, in priority order."
    fields:
      - { field: task, type: text, required: true, help: "What to do." }
      - { field: when, type: text, help: "When it is due, as text." }
      - { field: note, type: text, help: "An optional remark on the task." }

title: Career strategy
goal: "Assistant professor / tenure-track (NL UD or Flemish ZAP)"
milestone: "FWO Senior"
milestone_date: "2026-11-17"

# Situation: a key-value fact strip
situation:
  PhD: "May 2023, KU Leuven (Marc Van Hulle)"
  Past: "Postdoc, UHasselt 2024-2025 (Liesbet Peeters)"
  Now: "Postdoc, U Twente - AI for HCC (ZonMw AI-HCC), since Jan 2026"
  Also: "Research Affiliate, UHasselt; BKO completed"

# Order of work, in priority order (task, when and an optional note)
order:
  - { task: "ERC Starting Grant", when: "Oct 2027", note: "" }
```

The situation's `Now` value keeps its " - " byte for byte, since it is the hub's data. The `Target` row is gone; its text is `goal`. The old header's "Dates verified June 2026; reconfirm per call page." referred to the eligibility dates, which move to the Markdown file.

### `.oculus/config.yml`

Lines to remove, 70 to 87 (`grep -n "" .oculus/config.yml | sed -n '/host pipeline of the Focus/,/leads_fit/p'`): the comment at 70, `career_host_status:` with its five rows (71-76), the blank 77, the comment at 78, `career_score_dims:` with its four rows (79-83), the blank 84, the comment at 85, `career_score_tones:` (86) and the blank 87. Line 88 (`# The colour of a Position Lead's fit chip, by its fit.`) and 89 (`leads_fit:`) stay.

Line 3 rewritten:

```
# This hub's settings for oculus: the folders and files the portfolio is built from, the hub's documents, the cluster its jobs run on, the files the writing rules skip or let draw arrows, the wallpaper image, and the hub's own words: the fit colours of the Position Leads. A key here replaces the value of the same key in oculus's own config/*.yml whole; a key outside oculus's hub list is a finding and is not applied. The hub's data files are at oculus's own paths under .oculus/data/ (its config/sources.yml), so this file names no `collections:` list and no `career_file`; a missing file of that list is a finding, since the hub holds the folder. The research domains, with their colours, labels and whether they expect a dataset, are the entries of .oculus/data/pillars/domains.yml, and the theme words of the venues and datasets are the options of the `themes` field of .oculus/data/research/venues.yml and .oculus/data/research/data.yml.
```

### `funding/2026-fwo-senior-transplant/hosts.md`, whole text

The folder holds no `hosts.md` (`ls` lists ASSESSMENT.md, concept-note, grants, meetings, naesens-concept-note.md, proposal, QUESTIONS-FOR-NAESENS.md, RESEARCHQUESTIONS.md). The scores of each host's note (`[proposal: ... | after: ...]`) are the table's columns, so the notes below start after them; every other word is the career file's.

```markdown
# FWO Senior hosts

The host candidates for the FWO Senior application (clinic-embedded AI and federated learning, Leuven area preferred), ranked with the best fit first, with the host criteria and the eligibility of the call. Status words: awaiting (email sent), warm (in dialogue), candidate (not yet contacted), drafted, dropped. Score columns: proposal, AI+FL+clinic fit, backing, after (post-postdoc / ZAP); scores Strong, Good or Mid, backing High or Med.

## Hosts

Naesens is the active host; the other fourteen are the long list, in rank order.

| Host | Institution | Field | Status | Proposal | AI+FL+clinic | Backing | After |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Naesens | KU Leuven / UZ Leuven | transplant nephrology | warm | Strong | Strong | High | Strong |
| Meyfroidt | UZ Leuven / KU Leuven | ICU / critical care | warm | Strong | Strong | High | Strong |
| Roskams | KU Leuven / UZ Leuven | digital pathology (liver/HCC) | dropped | Strong | Strong | High | Strong |
| Stalmans | KU Leuven / UZ Leuven | ophthalmology (retinal/OCT) | warm | Strong | Strong | Med-high | Strong |
| Vermeesch | KU Leuven | clinical genomics / cfDNA | candidate | Strong | Strong | High | Strong |
| Van Damme | VIB-KU Leuven / UZ Leuven | ALS (rare disease) | candidate | Strong | Strong | High | Good |
| Bosmans | KU Leuven / UZ Leuven | medical-physics AI assurance | candidate | Good | Good | Med-high | Good |
| Lambrechts | VIB-KU Leuven | cancer single-cell multi-omics | candidate | Strong | Good | High | Good |
| Vandecaveye | KU Leuven / UZ Leuven | radiology (tumor MRI) | candidate | Good | Strong | Med-high | Good |
| Vens | KU Leuven (Kulak) | interpretable ML / survival, ICU | candidate | Strong | Good | Good | Good |
| Nagels | VUB / UZ Brussel | MS / digital medicine | candidate | Strong | Strong | Med | Good |
| Mathieu | UZ Leuven / KU Leuven | diabetes | candidate | Good | Good | High clout | Mid |
| Laukens | UAntwerpen | biomedical data mining | candidate | Mid | Weak clinic | Med-high | Mid |
| Sijbers | UAntwerpen | imaging methods (MRI/CT) | candidate | Good | Weak clinic | Med | Mid |
| Vandemeulebroucke | VUB / UZ Brussel | imaging / CDS | candidate | Mid | Med | Med | Mid |

- **Naesens.** Federated + interpretable outcome prediction across international consortia; no in-house FL lead. Call went well, strongly interested; concept = next step. maarten.naesens@kuleuven.be
- **Meyfroidt.** Head of Clinic ICU; multi-centre (CENTER-TBI HR-ICU, SOPRANI MSCA network to Nov 2027), FL-natural; neuro-ICU signals are the closest domain match of any host. CAVEAT: Fabian Guiza has been the group's ML scientist 15+ yr, so no generic-ML pitch; the wedge is federation + multiway structure + conformal certification, and his recent line is the operationalization gap not more models. First meeting 06/08 in person, Leuven; prep in funding/2026-fwo-senior-meyfroidt/. geert.meyfroidt@kuleuven.be (he replies from kuleuven.be, not uzleuven.be)
- **Roskams.** Multiway whole-slide data, federation-natural; builds on the HCC domain. Emailed + nudged. tania.roskams@uzleuven.be
- **Stalmans.** Federated cross-centre + retina-as-cardiovascular-marker; replied warm, meeting (+Jan Van Eijgen, joining half-time). ML seat partly filled (Blaschko ESAT/PSI + Van Eijgen LUNet/PVBM). Use her personal (Mac) address, not KU Leuven.
- **Vermeesch.** cfDNA (MetDecode); cleanest FL hook (genomic privacy); new domain. 2nd-wave contact.
- **Van Damme.** Clinician-scientist; rare-disease federation hook; mild neuro overlap. 2nd-wave.
- **Bosmans.** Federated imaging (EuCanImage); faithful/verifiable-AI angle. Hold (Roskams same dept).
- **Lambrechts.** VIB Cancer Biology; single-cell multi-omics from trial biopsies; big omics pivot, not bedside.
- **Vandecaveye.** Tumor MRI AI; strong but closest to current imaging/HCC work. Hold.
- **Vens.** Interpretable ML for health + survival; Kortrijk (not Leuven) + overlaps interpretability strength.
- **Nagels.** Already does MS-FL; neuro overlap + Brussels.
- **Mathieu.** Max clinic + data, but weak methods-culture (service-analyst risk).
- **Laukens.** Not clinic-embedded; fits federated-tensor/omics strengths.
- **Sijbers.** Engineer (not clinic), imaging overlap.
- **Vandemeulebroucke.** Imaging + CDS; junior sponsor, Brussels.

## Host criteria

- Clinic-embedded, AI where federated learning is actionable
- Leuven-area (lifestyle)
- NOT a former supervisor (independence)
- I am the FL / interpretable-methods lead, not one of many
- A sponsor who backs me + a hireable niche (new institution is NOT the driver)

## Eligibility

The rule of the call:

- PhD 3-6 yr before 1 Oct of start
- >= 2 yr postdoc
- Flemish host
- max 2 applications/type (junior closed)

The calls that remain:

- Nov 2026 (Oct 2027 start)
- Nov 2027 (Oct 2028 start)

Caveat: From the 2027 round, the 2nd attempt lapses if the 1st was not top-50% at preselection, so a rushed 2026 try risks the second. Oct 2029 is >6 yr, so ineligible.
```

`LC_ALL=C grep -n '[^ -~]'` over both drafts printed nothing (exit 1).
