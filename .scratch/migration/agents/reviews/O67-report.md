NOT done: the report file `.scratch/migration/agents/reviews/O67-report.md` was not written. When I called Write for a report file, it refused with "Subagents should return findings as text, not write report files", so the whole report is this message, in the brief's shape. Everything else in the brief is done.

# O67 report: the stage decides a project's Focus lane, and the stage, chip and key words are settled

Worktree: `/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O67`. Nothing is committed (no git command that changes state was run).

## Open items of the state file, verbatim

From `.scratch/migration/orchestrator-state.md`:

```
## Open items (only what Axel must rule on; every report tells him these in plain words, decisions first, until he has ruled)

An entry leaves this list for the closed log the moment Axel rules on it. What a review or a look found and no brief covered is not an open item: it is folded into an existing step in `plan.md` (Z468), never booked as a step of its own.

- none.
```

This step adds none.

## The cases

**How the cases were run.** Each case ran twice, with a case-run program in the session scratchpad under plain `node` (a file `runes.ts` gave stand-ins for Svelte's `$state`, `$derived` and `$effect`, so the `.svelte.ts` modules load):
- On the unchanged tree, before any change: `node cases-before.ts <worktree> <scratchpad>`.
- After the change: `node cases-after.ts <worktree> <scratchpad>`.

Both sources and both outputs are quoted at the end. No case was one the brief's rules got wrong, so the builder did not stop after the first run and no ruling was needed.

| Case | First run (unchanged tree) | After the change |
|---|---|---|
| submitted | lane none, unplaced | Review |
| in-prep; submit-ready | none, unplaced; none, unplaced | Push; Push |
| building [parked] | none, unplaced | Backburner |
| exploring [parked, blocked] | none, unplaced | Blocked |
| nascent projects; nascent coauthor | backlog; none | Backlog; none |
| in-prep coauthor | none | Push |
| released; stopped [parked] | none; none | none; Backburner |
| exploring [admin-prep] | none, unplaced | Run |
| building, hub lanes without build | none, unplaced | none, unplaced |
| nascent, hub lanes without the backlog row | in the old backlog | none, unplaced |
| backlog title order | Alpha,Zeta | Alpha,Zeta |
| nascent waiting on ada | `[]` | `[]` |
| nascent [parked, admin-prep] onto Run | `{"focus":"run"}` | `{"stage":"exploring","status.chips":["admin-prep"]}` |
| submit-ready [blocked] onto Push | `{"focus":"push"}` | `{"status.chips":[]}` |
| building onto Backburner | `{"focus":"backburner"}` | `{"status.chips":["parked"]}` |
| exploring [parked, blocked] onto Backburner | `{"focus":"backburner"}` | `{"status.chips":["parked"]}` |
| in-prep [blocked] onto Blocked | `{"focus":"blocked"}` | null (nothing written) |
| submit-ready onto Push; exploring onto Push | `{"focus":"push"}` both | null; `{"stage":"in-prep"}` |
| coauthor onto Backlog, and its menu | onto holding: movable=false | movable=false; menu `run,push,revise,review,blocked,backburner,scope,derisk,build` |
| lane whose first stage is no word of `stages:` | movable=true | movable=false, write null |
| row with stages and chips | "key focus_lanes.0.stages is not a key this file takes", the same for chips | "focus_lanes.0 is not a value this key takes" |
| row with neither | no finding | "focus_lanes.0 is not a value this key takes" |
| two rows holding in-prep | unknown-key findings | "focus_lanes.1.stages is not a value this key takes" |
| the shipped vocab.yml lanes (added check) | not run | no finding |
| `focus: run` | no finding, lane Run | `focus` "key focus is not declared by the schema of this file", lane Run from its stage |
| `venue_id: tmlr` | no finding, venueId tmlr | "key venue_id is not declared by the schema of this file" |
| `venue: tmlr` | not_declared | no finding, venueId tmlr |
| `venue: nowhere` | not_declared | `venue` "venue is nowhere, which is not a key of venues" |
| `pillar: [graphs]` | no finding, pillarIds graphs | "key pillar is not declared by the schema of this file" |
| `pillars: [graphs]` | not_declared | no finding, pillarIds graphs |
| `pillars: [nowhere]` | not_declared | `pillars[0]` "pillars[0] is nowhere, which is not a key of pillars" |
| `stage: paused`; `stage: nogo` | no finding; no finding | "stage is paused, which is not a key of vocab.stages"; the same for nogo |
| new project of the tier projects | `stage: nascent` and `focus: holding`, in the backlog | `stage: nascent`, no `focus:` line, lane Backlog |
| archive/failed at failed | `[]` | category failed, `[]` |
| archive/failed at published | `[]` | "stage published is not the folder's failed" |
| coauthor/stopped at in-prep | `[]` | "stage in-prep is not the folder's stopped" |
| demo fixtures | 13 projects, 0 findings | 13 projects, 0 findings, each as item 9 gives it |

## DONE / NOT DONE

| Item | State | Proof |
|---|---|---|
| Report file in the ledger | NOT DONE | Write refused it (quoted above); this message carries the report |
| 1 stages | DONE | `config/catalogs/vocab.yml` stages; case "shipped vocab.yml: no finding" |
| 2 chips | DONE | `vocab.yml` chips (`parked` after `blocked`, `results-in`, `numbers-to-run`); the `status.chips` help |
| 3 lanes and the vocabulary shape | DONE | `vocab.yml:175-184`; the three shape cases |
| 4 lane and move functions | DONE | `focus.ts` `laneOf`, `moveOnto`, `movable`, `laneItems`, `unplaced`, `waiting`; the lane and move cases |
| 5 `focus:` leaves the manifest | DONE | case `focus: run`; the item-8 greps |
| 6 `venue` and `pillars` | DONE | the six key cases; `git grep -nw venue_id` |
| 7 boards' groups | DONE | `config/defaults/layout.yml` (Before and after) |
| 8 other names of a changed word | DONE | the greps below, judged |
| 9 demo fixtures | DONE | the demo case |
| 10 test rows | DONE | the before and after runs below |
| Verify list | passes | second run: "test:quick: 218.4 s; every command passed" |
| ASCII gate | prints nothing | below |
| Unused exports | no line added | below |

**The verify list, `npm run diagrams && npm run test:quick`, ran twice.**
- First run: `FAILED  prettier`, with "[warn] tests/data/sources/manifests/manifests.test.ts", a file this step changed. Every other command passed: ASCII gate, svelte-kit sync, eslint, svelte-check ("0 ERRORS 0 WARNINGS"), vitest checks, vitest and vitest slow.
- I ran `npx prettier --write` on that file and reran it alone: "Test Files  1 passed (1) / Tests  34 passed (34)". The change was three long string lines broken after their keys.
- Second run, every line `ok`:

```
ok      ASCII gate (2.5 s)
ok      prettier (2.5 s): All matched files use Prettier code style!
ok      svelte-kit sync (2.6 s)
ok      svelte-check (77.1 s): 1792770215413 COMPLETED 537 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      eslint (96.4 s)
ok      vitest checks (164.0 s): Duration  154.94s
ok      vitest (172.3 s): Duration  163.71s
ok      vitest slow (215.5 s): Duration  205.80s
test:quick: 218.4 s; every command passed
test:quick: not covered: tests that reach no changed file within the import depth,
            the build, the lint of unchanged files
```

No whole-suite command was run. The real-hub cases of `integrity.test.ts` are skipped, because `OCULUS_TEST_HUB` is unset.

**The ASCII gate of spec.md** (the perl form, which replaces the brief's grep), run over `src tests bin config`, printed nothing (exit 0). `find` printed "bfs: error: bin: No such file or directory.", because the folder does not exist. The same gate over the changed files, the moved `archive/failed/failed-quantization/project.yml` and the four docs files also printed nothing (exit 0).

**Unused exports.** `sh utils/unused-exports.sh` was diffed with `.agents/worktrees/migration-O67-base/unused-exports.txt`: no difference (diff exit 0). `BACKLOG`, `laneOf` and `moveOnto` are read by `Lanes.svelte`, `Projects.svelte` and `ProjectCard.svelte`.

**The test rows, before and after.**
- The files: the 28 changed `*.test.ts` files and the test files that import the three changed fixtures (`reference-hub.ts`, `write-fixture.ts`, `writes-fixture.ts`), 50 files in all.
- Before, in a copy of the base (`$S/base-run`, an rsync of the base copy with the worktree's node_modules): "Test Files  3 failed | 47 passed (50) / Tests  3 failed | 650 passed | 9 skipped (662)".
- After, in the worktree: "Test Files  2 failed | 48 passed (50) / Tests  3 failed | 650 passed | 9 skipped (662)".
- Every failure in both runs was "Error: Test timed out in 5000ms." under the load of 50 files: config-folder "names a glyph only where...", hub-portfolio and deck-acts. Those files, with deck-slides.test.ts (which reads `write-fixture.ts`'s deckProject row, changed after the 50-file run began), were rerun alone in each tree. Before: "Test Files  4 passed (4) / Tests  54 passed | 2 skipped (56)". After: "Test Files  4 passed (4) / Tests  54 passed | 2 skipped (56)".

**The changed rows**, each keeping its assertion. The old value is on the left.
- `stage:` in inline manifests:
  - `active` becomes `exploring` in hub-folders, workspace-projects, cluster-folder, relation-shapes, resources, schema-rules:271,277,315, manifests.test (22 rows), audit.test, write-fixture MANIFEST and deckProject, project-files, changes, deposit-compare, deposit, served-roots and normalise.test:255.
  - `active` becomes `in-prep`, because the project has a venue, in reference-hub alpha and beta, hub-portfolio's regex and replacement, references.test:327 and normalise.test:38.
  - `idea` becomes `nascent` in hub-portfolio:294,329,390, workspace-findings, tier-stage:25,28,34, clones, scan, hub-routing, items.test, references.test:136 and manifests.test (13 rows).
  - `running` becomes `building` and `dropped` becomes `stopped` in manifests.test.
- normalise.test: alpha's `focus: 'run'` becomes `stage: 'exploring'`, and the expected value loses `focus: 'run'` and has stage exploring. beta's free-text `venue: 'a journal with no catalogue entry'` input line goes with the free-text read.
- `venue_id` becomes `venue` in normalise.test (bspc, nowhere), reference-hub, references.test, rename.test, hub-portfolio:347,368,412, hub-routing:152,195, hub-keys:135, lsp-transport:64 and relation-shapes:80,85 (title "a bare venue_id, funding or compute" becomes "a bare venue, funding or compute").
- `pillar` becomes `pillars` in normalise.test, reference-hub, references.test (title "a manifest list, pillar" becomes "a manifest list, pillars"), rename.test, writes-fixture, and relation-shapes row 'a bare pillar' / field pillar, which becomes 'a bare pillars' / pillars.
- Positions in references.test: `3,10` to `3,7`, `3:11` to `3:8`, `4,17` to `4,18`, `4,12` to `4,13`, character 11 to 8, character 12 to 9. In rename.test, nine `at` rows go from `3,10` to `3,7`. The reference-hub synthetic `stages:` row `active` becomes `in-prep`, and the references.test row key 'active' becomes 'in-prep'.
- writes.test:
  - The outside-schema row `fields: { venue: 'somewhere' }` (refused field venue) becomes `venue_id`, because `venue` is now declared.
  - `ideaManifest` loses its `focus` parameter and its `focus: holding` line in five rows.
- config-folder.test: `'holding_color'` leaves the key list, and `stages: [active]` becomes `stages: [exploring]`.
- integrity.test: the personal stage list `[idea, nascent, building, running, active, paused, finished]` becomes `[nascent, building, exploring, in-prep, released]`, by item 9's table.

**Comments and prose against the rules.**
- The history-word grep over the added comment and title lines (`no longer|used to|previously|renamed|replaced|removed|anymore|former|migrat|legacy|O67|step|...`) found nothing.
- The grep for time words (now, new, was, before...) found only present-tense uses ("a new in-flight stage never falls into Archival", "the new project's id", "where it was dropped").
- Added lines over 100 columns are string literals only, which prettier does not break, plus one eslint-disable comment that the base already has twice in `Lanes.svelte`.
- I found no departure from the rules.

## The item-8 greps

These were run with `git grep -nw -e <word> -- src tests config docs README.md ':!config/local.yml'`. Hit counts: idea 271, active 848, running 842, archived 87, accepted 42, paused 203, finished 101, nogo 0, dropped 513, disproved 1, abandoned 7, results-positive 0, numbers-pending 0, holding 743, holding_color 0, venue_id 2, pillar 65, focus 1104. `git grep -ni` gives "numbers pending" 0, "positive result" 0 and "Ideas lane" 0.

How the hits were judged:
- I read every hit in the board and data domains: state/boards, data, server/content, server/edit, views/boards, views/structure, views/shared/card and forms, config catalogs, defaults, schemas, options and text, the four docs, README, tests/data and the demo.
- I also read every quoted literal of a removed word across src and tests, every `stage:`, `stages: [`, `stage_folders` and `keys: [` line, every `archive/<old>` path, and every quoted `'focus'`, `'holding'`, `'venue_id'` and `'pillar'`.

Hits that were the changed sense were fixed. Besides those named under items 1 to 8 of the brief:
- `docs/templates.md:1322` (a deck `find` with `stages: [active]` becomes `[in-prep]`)
- `tests/routes/edit/write-fixture.ts:273` (deckProject `'active'` becomes `'exploring'`)
- `src/lib/server/content/audit/projects.ts:293` (the comment "(the coauthor tier lists `abandoned`)" becomes `stopped`)
- `src/lib/data/model/model-entities.ts:111` (category examples `published`, `nogo` become `published`, `failed`)
- `src/lib/state/boards/ticker.ts:130` (the `unplaced` comment "that name no lane" becomes "whose stage is in flight or an idea and that no lane takes")
- `src/lib/views/shared/card/project/ProjectCard.svelte:376-377` (read `project.focus`)

Every remaining hit is another thing of the same spelling:
- The collection `statuses:` rows of vocab.yml (active, running, paused, finished, archived, accepted, dropped).
- The tier flag `finished` and its readers.
- The folder names `projects/active/...`, `projects/ideas/...` and `side-projects/idea` in tests and in `sources.yml`, which decide no stage.
- The glyph names `active`, `idea`, `archived` and `focus`.
- The radar bucket `idea` and the deck slide kind `idea`.
- The career host status `dropped` and the career file's `dropped:` list.
- The task status `dropped`.
- Debug, process, build, HPC, session and run states (`running`, `paused`, `dropped`, `archived` in sessions), and the schedule key `paused`.
- The workbench store's `holding` and the English "holding the open file".
- The Position Lead field `focus`, the `focus:` settings block (`focusBlock`, behavior.yml, options), the Focus page and view id `focus`, CSS `:focus-within` and keyboard focus.
- The List's cell `focus` (layout.yml:234,279, options/layout.yml:141), which now shows the lane label.
- The facet, cell and glyph `pillar`, the Pillars view, and English "a pillar".
- The applications statuses `accepted` and `paused` in schema-rules:186,191.
- `'paused-stage'` sentinels in undo.test and write.test.
- English words in labels and prose: "failed (no-go or disproved)", "stopped (dropped or abandoned)", "it got accepted", "active projects on no lane" (focus-lanes.ts:2, CommandCenterView.svelte:78), "Draft paused - ..." and "(finished, archived after the paper shipped)" in demo status lines, and "dropped" for a drag-and-drop.
- The kind word `abandoned-papers`.
- `venue_id` only in the writes.test outside-schema row.

Hits outside those domains (shell, ui, workbench, sessions, machine, desktop, apps) were read in the per-word listings and are editor, tab, debug, process and drag senses. I did not read them line by line beyond those listings.

## Files with line counts

`diff -rq` against the base copy over src, tests, config, docs and README.md: 93 changed files plus the folder move (`Only in tests/fixtures/hubs/demo/projects/archive: failed` and `...: nogo`).

`git diff --stat`: "93 files changed, 2183 insertions(+), 2085 deletions(-)". Most of that is the 8 regenerated diagram files (`docs/diagrams/layer-state`, `layer-views`, `layers`, `writes`, `.dot` and `.svg`).

Source files, as (+added -removed, lines now):
- config: `catalogs/vocab.yml` +24 -33, 255; `catalogs/glyphs.yml` +0 -1, 280 (*); `catalogs/icons.yml` +0 -1, 279 (*); `defaults/layout.yml` +6 -9, 333; `defaults/sources.yml` +1 -1, 114 (*); `schemas/manifest-schema.yml` +5 -6, 92; `text/views/boards/focus.yml` +2 -4, 136; `text/views/structure/map.yml` +1 -1, 33; `text/views/structure/pillars.yml` +3 -3, 23; `text/views/system/audit.yml` +1 -1, 72.
- docs: `HELP.md` +2 -2, 556; `apps.md` +1 -1, 822; `data-map.md` +4 -5, 224; `templates.md` +13 -14 (+1 -1 since then, the deck example), 1328.
- src/lib/data: `model/model-entities.ts` 742; `shapes/catalog-files/vocab.ts` +53 -13, 382; `snapshot/hubs/merge.ts` 362; `snapshot/normalise.ts` 644; `snapshot/validate.ts` 494.
- src/lib/server: `content/audit/projects.ts` 546; `edit/writes/manifest.ts` 721; `edit/yaml/yaml-edit.ts` 573.
- src/lib/state/boards: `board/items.ts` 223, `board/presets.ts` 410, `board/stats.ts` 173, `focus-lanes.ts` 244, `focus.ts` +141 -58, 500, `project-context.ts` 40, `structure/lines.ts` 222, `ticker.ts` 604.
- src/lib/state, other: `client/selectors.svelte.ts` 742, `forms/schema.ts` 473, `shared/words/tones.ts` 291, `workbench/palette.ts` 846.
- src/lib, other: `themes/derive.ts` 320; `views/boards/focus/Focus.svelte` 273; `views/boards/focus/lanes/Lanes.svelte` +64 -51, 366 (limit 520); `views/boards/projects/Projects.svelte` 418; `views/shared/card/project/ProjectCard.svelte` +5 -2, 502 (**).
- tests: the 28 test files and 3 fixtures named under the rows, the 13 demo manifests, and the demo `venues.yml` and `pillars.yml`.

(*) These files are outside the write list:
- `glyphs.yml` and `icons.yml` lose the glyph `green_square`, which was the icon of the removed stage `accepted` and became an orphan that config-folder.test's "names a glyph only where the source or another config file reads it" flags. `tones.ts` ICON_HUES loses it too.
- `sources.yml:28`, the collections comment, named the manifest key `pillar` and now names `pillars`.

(**) `ProjectCard.svelte` is covered by "any other file under src/ whose code names a focus read of the manifest".

## Judgment calls the brief left open

1. `manifest-schema.yml:15` lists `vocab.priority_levels` in place of `vocab.focus_lanes` as the example `vocab.<key>` source, since no field takes `focus_lanes` and `priority` takes `priority_levels`.
2. writes.test's outside-schema row writes `venue_id`, the one manifest key that is now undeclared and was used before.
3. `ideaManifest` in writes.test lost its `focus` parameter, because no new manifest carries a `focus:` line.
4. `green_square` was removed from glyphs.yml, icons.yml and tones.ts (see the file table).
5. `ProjectCard.svelte` drew a tag with the raw `focus:` value. It now draws the label of the lane `laneOf` gives, and no tag when there is none.
6. The vocabulary shape refuses a stage word held by two rows, as the brief says. A chip held by two rows and a duplicate lane key are not refused, because the brief does not name them.
7. A lane whose cluster is none of `now`, `parked`, `incubate` or `backlog` still takes projects in `laneOf`, so they are not counted as unplaced. `Lanes.svelte` draws only `CLUSTERS` and `BACKLOG` (`Lanes.svelte:247,272`), so such a lane's cards are not drawn, as for any lane of an unknown cluster before.
8. `focus.ts` `laneShape` reads an absent `stages` or `chips` as an empty list (`stringItemsShape.catch([])`). Under zod 4, a bare transform fails on an absent key and would drop every shipped lane row, each of which carries only one of the two. I checked this with the case runs: ten lanes are read.

## Before and after, as host and user see it

- **The Focus board's lanes.** Before, a card sat on the lane its manifest's `focus:` named; with no `focus:` it was on no lane, and on the backlog with `focus: holding`. After, the lane comes from the stage and the chips `parked` and `blocked` (the lane cases).
  - The demo board draws the same cards on the same lanes.
  - A hub whose manifests carry no `focus:` now shows its in-flight projects on lanes, where before they were unplaced.
- **The backlog.**
  - Before: a summary "<glyph> Ideas" (`focus.ideas`) with the sub line "idea backlog: drag onto a lane to start, or drop here to park" (`focus.idea_backlog`), and the colour `holding_color`.
  - After: drawn from the `focus_lanes:` row, with the summary "<glyph> Backlog", the sub line "ideas not started yet: drag onto a lane to start, or drop here to make it an idea again" and the colour #b5638a, in the same full-width place.
- **A drop and the card's menu.**
  - Before: a drop or a menu pick wrote `{ focus: <lane> }`, and the menu listed the nine lanes for every card.
  - After: both write the fields `moveOnto` gives (`stage`, `status.chips` or nothing). The menu lists the lanes `movable` allows, ten for a Projects or Personal card (the backlog lane included) and nine for any other tier, with the card's lane marked.
- **The Command Center's unplaced line.**
  - Before: "active projects not on the board (set <code>focus:</code>)" and "active project not on the board (set <code>focus:</code>)".
  - After: "projects whose stage is on no lane of the board" and "project whose stage is on no lane of the board". With the shipped lanes no project is unplaced.
- **The boards' groups (`layout.yml`).**
  - Projects: "in progress" loses running, active and accepted; idea becomes `[nascent, scoping]`; the "paused" group goes.
  - Coauthor: "in progress" the same; dead-ends becomes `[failed, stopped]`.
  - Archive: dead-ends becomes `[failed, stopped]`.
  - Personal: the "running" and "paused" groups go; "finished" `[finished]` becomes "released" `[released]` with its colour #0ea5e9.
- **The form.**
  - The Focus lane field goes.
  - The Venue field writes `venue:` and the Pillars field writes `pillars:`.
  - The Stage help lists the new stages and says published covers accepted and to appear.
  - The Status chips help names "blocked (external), parked (not being worked) or numbers still to run" and says Blocked and parked put the card on the Blocked and Backburner lanes.
- **The findings a manifest now gets.** `focus:`, `venue_id:` and `pillar:` each give "key ... is not declared by the schema of this file". A bad `venue` or `pillars` value gives the reference finding naming `venue` or `pillars[0]`. A removed stage (paused, nogo) gives "stage is paused, which is not a key of vocab.stages". Before, none of these gave a finding.
- **The undo of a move.** A move that changes both fields makes two change records. The case wrote tensor-sketch at `[parked, admin-prep]` onto Run, which answered `changed=["stage","status.chips"]` with records `["stage","nascent","exploring","field"]` and `["status.chips",["parked","admin-prep"],["admin-prep"],"field"]`. One Undo takes back one record. Before, a move was one `focus` record. `docs/HELP.md` says so.
- **A new project** is written with no `focus:` line, and its Projects or Personal card sits in the backlog lane by its stage `nascent`.
- **The demo fixture** `projects/archive/nogo/` is now `projects/archive/failed/` (moved with `mv`).

## Anything in the brief that was wrong or impossible

1. The report path. The brief asks for the report at `.scratch/migration/agents/reviews/O67-report.md`; the Write tool refused it for a subagent (quoted in the first line), so the report is this message.
2. The item-8 command. Item 8 asks for `git grep`, while spec.md lists only `git status`, `git diff` and `git show` as git commands a builder runs. I ran `git grep`, a read, because the brief names it as the check.
3. The ASCII gate. spec.md's gate names a `bin` folder, which does not exist in the tree. `find` prints an error for it, and the gate still prints nothing.
4. Missing reader. "What is on the tree" lists the readers of `focus` without `ProjectCard.svelte:376-377`, which svelte-check reported as reading the removed field. It is fixed and named above.

## The case-run programs

Both programs, and `runes.ts`, were deleted from the scratchpad before this report (`ls $S | grep -cE "^(cases-|runes)"` gives 0). Their logs `first-run.txt` and `after-run.txt` stay in the scratchpad.

`runes.ts`:
```ts
const g = globalThis as Record<string, unknown>;
const state = (v: unknown) => v;
(state as Record<string, unknown>).raw = (v: unknown) => v;
g.$state = state;
const derived = (v: unknown) => v;
(derived as Record<string, unknown>).by = (f: () => unknown) => f();
g.$derived = derived;
g.$effect = Object.assign(() => {}, { root: () => () => {}, pre: () => {} });
```

`cases-before.ts`, which differs from the after program in these lines:
```ts
const lanes = focus.lanes(LOADED);
function where(p, all = lanes, config = LOADED) {
    const items = focus.laneItems([p], all);
    const on = Object.entries(items).find(([, held]) => held.length > 0)?.[0];
    const back = focus.backlog([p], all, config).length > 0;
    const un = focus.unplaced([p], config).length > 0;
    return `lane=${on === undefined ? 'none' : label(on)} backlog=${back} unplaced=${un}`;
}
// moves: say(..., `movable=${focus.movable(p, lane, LOADED)} write=${JSON.stringify({ focus: lane })}`)
// coauthor onto 'holding'; the odd lane { key, label, sub, tone, cluster } with no stages
// manifests planted under projects/active/; the same shape, keys, audit and demo sections as below
```

`cases-after.ts`, in its essentials:
```ts
const where = (p, all = lanes, config = LOADED) => {
    const on = focus.laneOf(p, all, config);
    return `lane=${on === undefined ? 'none' : on.label} unplaced=${focus.unplaced([p], config).length > 0}`;
};
// hub lanes without build / backlog: { ...LOADED, focus_lanes: LOADED.focus_lanes.filter(l => l.key !== 'build') }
// moves: `movable=${focus.movable(p, lane(key), LOADED)} write=${JSON.stringify(focus.moveOnto(p, lane(key), lanes, LOADED))}`
// coauthor menu: lanes.filter(l => focus.movable(co, l, LOADED)).map(l => l.key)
// odd lane: { key: 'odd', ..., stages: ['nosuch'], chips: [] }
// shapes: shapeIssues('catalogs/vocab.yml', { focus_lanes: rows }).map(i => issueText(CATALOG, i))
// keys: a copy of the demo hub with manifests under projects/ideas/, buildOneHub, the findings of each file
// new project: createIdea(hub, { ...config, newProjectDir: { projects: 'projects/ideas' } }, {...}), file text, its lane
// move written: tensor-sketch chips set to [parked, admin-prep], moveOnto onto run, writeManifest, records
// audit: archive/failed/{a-ok,a-pub}, coauthor/stopped/c-prep; auditFindings; folder messages and category
// demo: buildOneHub(DEMO), each project's tier, category, stage, chips, venueId, pillars, lane; the findings
```

First-run output, verbatim (the lanes, moves and shape sections; the keys, audit and demo lines are as in the case table):
```
submitted: lane=none backlog=false unplaced=true
in-prep: lane=none backlog=false unplaced=true
submit-ready: lane=none backlog=false unplaced=true
building [parked]: lane=none backlog=false unplaced=true
exploring [parked, blocked]: lane=none backlog=false unplaced=true
nascent projects: lane=none backlog=true unplaced=false
nascent coauthor: lane=none backlog=false unplaced=false
in-prep coauthor: lane=none backlog=false unplaced=false
released: lane=none backlog=false unplaced=false
stopped [parked]: lane=none backlog=false unplaced=false
exploring [admin-prep]: lane=none backlog=false unplaced=true
backlog order: Alpha,Zeta
nascent waiting on ada: []
coauthor in-prep [] onto holding: movable=false write={"focus":"holding"}
stages and chips: key focus_lanes.0.stages is not a key this file takes | key focus_lanes.0.chips is not a key this file takes
neither: no finding
k-focus: findings=[] venueId=undefined pillarIds=[] lane=Run backlog=false unplaced=false
k-paused: findings=[] ...   k-nogo: findings=[] ...
new project: [] "id: new-one\ntier: projects\nstage: nascent\ntitle: New one\nfocus: holding\nstatus: ..."
demo findings (0):
```

After-change output, verbatim:
```
submitted: lane=Review unplaced=false
in-prep: lane=Push unplaced=false
submit-ready: lane=Push unplaced=false
building [parked]: lane=Backburner unplaced=false
exploring [parked, blocked]: lane=Blocked unplaced=false
nascent projects: lane=Backlog unplaced=false
nascent coauthor: lane=none unplaced=false
in-prep coauthor: lane=Push unplaced=false
released: lane=none unplaced=false
stopped [parked]: lane=Backburner unplaced=false
exploring [admin-prep]: lane=Run unplaced=false
building, hub lanes without build: lane=none unplaced=true
nascent, hub lanes without backlog: lane=none unplaced=true
backlog order: Alpha,Zeta
nascent waiting on ada: []
projects nascent [parked,admin-prep] onto run (sits on backburner): movable=true write={"stage":"exploring","status.chips":["admin-prep"]}
projects submit-ready [blocked] onto push (sits on blocked): movable=true write={"status.chips":[]}
projects building [] onto backburner (sits on build): movable=true write={"status.chips":["parked"]}
projects exploring [parked,blocked] onto backburner (sits on blocked): movable=true write={"status.chips":["parked"]}
projects in-prep [blocked] onto blocked (sits on blocked): movable=true write=null
projects submit-ready [] onto push (sits on push): movable=true write=null
projects exploring [] onto push (sits on run): movable=true write={"stage":"in-prep"}
coauthor in-prep [] onto backlog (sits on push): movable=false write=null
coauthor menu lanes: run,push,revise,review,blocked,backburner,scope,derisk,build
lane with first stage no word of stages: movable=false write=null
stages and chips: focus_lanes.0 is not a value this key takes
neither: focus_lanes.0 is not a value this key takes
two rows in-prep: focus_lanes.1.stages is not a value this key takes
shipped vocab.yml: no finding
k-focus: findings=[["focus","key focus is not declared by the schema of this file"]] venueId=undefined pillarIds=[] lane=Run unplaced=false
k-venueid: findings=[["venue_id","key venue_id is not declared by the schema of this file"]] venueId=undefined pillarIds=[] lane=Run unplaced=false
k-venue: findings=[] venueId=tmlr pillarIds=[] lane=Run unplaced=false
k-venuebad: findings=[["venue","venue is nowhere, which is not a key of venues"]] venueId=undefined pillarIds=[] lane=Run unplaced=false
k-pillar: findings=[["pillar","key pillar is not declared by the schema of this file"]] venueId=undefined pillarIds=[] lane=Run unplaced=false
k-pillars: findings=[] venueId=undefined pillarIds=["graphs"] lane=Run unplaced=false
k-pillarsbad: findings=[["pillars[0]","pillars[0] is nowhere, which is not a key of pillars"]] venueId=undefined pillarIds=[] lane=Run unplaced=false
k-paused: findings=[["stage","stage is paused, which is not a key of vocab.stages"]] venueId=undefined pillarIds=[] lane=none unplaced=false
k-nogo: findings=[["stage","stage is nogo, which is not a key of vocab.stages"]] venueId=undefined pillarIds=[] lane=none unplaced=false
new project: [] "id: new-one\ntier: projects\nstage: nascent\ntitle: New one\nstatus:\n  chips: []\n  line: \"New idea: scope and novelty check open.\"\neli5: e\nnext: Scope the idea; cited-novelty lit check; decide go/no-go.\n"
new project sits: lane=Backlog unplaced=false
tensor-sketch before: lane=Backburner unplaced=false
write: fields={"stage":"exploring","status.chips":["admin-prep"]} changed=["stage","status.chips"] refused=[] records=[["stage","nascent","exploring","field"],["status.chips",["parked","admin-prep"],["admin-prep"],"field"]]
tensor-sketch after: lane=Run unplaced=false
a-ok: category=failed []
a-pub: category=failed ["stage published is not the folder's failed"]
c-prep: category=stopped ["stage in-prep is not the folder's stopped"]
bench-suite: tier=software category=undefined stage=released chips=[] venueId=undefined pillars=[] lane=none unplaced=false
demo-toolkit: tier=software category=undefined stage=released chips=[] venueId=undefined pillars=["graphs"] lane=none unplaced=false
early-benchmark: tier=archive category=published stage=published chips=["lead"] venueId=neurips pillars=["graphs"] lane=none unplaced=false
failed-quantization: tier=archive category=failed stage=failed chips=["lead"] venueId=undefined pillars=["tensors"] lane=none unplaced=false
graph-bandits: tier=projects category=undefined stage=in-prep chips=["results-in"] venueId=undefined pillars=["graphs"] lane=Push unplaced=false
graph-transfer: tier=projects category=undefined stage=submit-ready chips=[] venueId=kdd pillars=["graphs"] lane=Push unplaced=false
online-clustering: tier=projects category=undefined stage=scoping chips=[] venueId=undefined pillars=["graphs"] lane=Scope unplaced=false
robust-embeddings: tier=projects category=undefined stage=submitted chips=[] venueId=jmlr pillars=["repr"] lane=Review unplaced=false
sparse-attention: tier=projects category=undefined stage=in-prep chips=["blocked"] venueId=tmlr pillars=["repr"] lane=Blocked unplaced=false
spectral-clustering-collab: tier=coauthor category=undefined stage=published chips=["coauthor"] venueId=tmlr pillars=["graphs"] lane=none unplaced=false
streaming-anomaly: tier=projects category=undefined stage=revision chips=["numbers-to-run"] venueId=undefined pillars=["tensors"] lane=Revise unplaced=false
tensor-sketch: tier=projects category=undefined stage=nascent chips=[] venueId=undefined pillars=["tensors"] lane=Backlog unplaced=false
tensorkit-tensor-decomposition-toolkit: tier=software category=undefined stage=released chips=[] venueId=undefined pillars=[] lane=none unplaced=false
demo findings (0):
```

The scratchpad logs for the orchestrator are in `/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/`: `first-run.txt`, `after-run.txt`, `rows-before.txt`, `rows-after.txt`, `rows-before-2.txt`, `rows-after-2.txt`, `o67-quick.txt`, `o67-quick2.txt` and `o67-unused.txt`.
