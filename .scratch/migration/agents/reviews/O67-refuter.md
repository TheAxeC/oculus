# Step O67 refuter report (on .agents/worktrees/migration-O67, base 132a0e1f)

## Verification (rerun by the reviewer)

Every command ran from the worktree root. The worktree had the same 94 `git status --short` lines before and after these runs.

- `npm run diagrams && npm run test:quick -- --base 132a0e1fcd7d9ad3c03ecbfd799032f9b33798d5`, exit 0. The log is `/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/refute-o67-quick.txt`:
  ```
  ok      prettier (0.6 s): All matched files use Prettier code style!
  ok      ASCII gate (0.6 s)
  ok      svelte-kit sync (2.3 s)
  ok      eslint (2.5 s)
  ok      svelte-check (8.8 s): 1792771101472 COMPLETED 537 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
  ok      vitest checks (161.0 s): Duration  152.72s (...)
  ok      vitest (164.9 s): Duration  156.92s (...)
  ok      vitest slow (191.2 s): Duration  183.31s (...)
  test:quick: 193.6 s; every command passed
  ```
  `git diff <base> --stat -- docs/diagrams` printed "8 files changed, 1612 insertions(+), 1584 deletions(-)" both before and after this run, so `npm run diagrams` changed nothing the builder left behind.
- The character-set check from spec.md (the perl form), over the 93 added or modified paths plus `tests/fixtures/hubs/demo/projects/archive/failed/failed-quantization/project.yml`, printed nothing (exit 0). The same check over `find src tests config -type f ! -name local.yml` also printed nothing (exit 0). `LC_ALL=C grep -c '[^ -~]'` over `docs/diagrams/*.svg *.dot` gave 0 for every file.
- `sh utils/unused-exports.sh` (exit 0), diffed with `.agents/worktrees/migration-O67-base/unused-exports.txt`: no output, exit 0. The step adds no unused-export line.
- The item-8 greps, `grep -rnw --exclude=local.yml -- <word> src tests config docs README.md`, with `docs/diagrams/` left out. Counts: idea 272, active 845, running 842, archived 87, accepted 42, paused 203, finished 101, nogo 0, dropped 513, disproved 1, abandoned 6, results-positive 0, numbers-pending 0, holding 740, holding_color 0, venue_id 2, pillar 65, focus 1097. With `grep -rni`: "numbers pending" 0, "positive result" 0, "Ideas lane" 0.
  - These counts differ by a few from the report's `git grep` counts. The difference is the diagrams folder I left out; no decision rests on the counts.
  - I judged the stage-shaped hits with three greps:
    - `(stages|keys|stage_folders): *[...removed word...]` printed nothing;
    - `archive/(nogo|dropped|disproved|abandoned)|coauthor/abandoned` printed nothing;
    - `stage[s]?:? ... <removed word>` printed only flags (`idea`, `finished`) and English.
  - Quoted literals of the removed words in `src` are debug, run, schedule, editor and drag senses, or the facet `'pillar'`.
  - `venue_id` is only the writes.test outside-schema row (`tests/server/edit/writes.test.ts:123,128`). `pillar` hits are the facet, the List cell, the glyph and English. `holding` hits are English and the workbench store.
  - Two hits are made false by the change: finding S-1.
- The cases, rerun with my own case-run programs in `.../scratchpad/refute-o67/`. They load the worktree's `focus.ts`, `shape-issues.ts`, `buildOneHub`, `auditFindings` and `createIdea` under node with rune stand-ins. The programs and their planted hubs are deleted. Output, verbatim:
  ```
  submitted: lane=Review unplaced=false
  in-prep: lane=Push unplaced=false
  submit-ready: lane=Push unplaced=false
  building [parked]: lane=Backburner unplaced=false
  exploring [parked,blocked]: lane=Blocked unplaced=false
  nascent projects: lane=Backlog unplaced=false
  nascent coauthor: lane=none unplaced=false
  in-prep coauthor: lane=Push unplaced=false
  released: lane=none unplaced=false
  stopped [parked]: lane=Backburner unplaced=false
  exploring [admin-prep]: lane=Run unplaced=false
  building, no build lane: lane=none unplaced=true
  nascent, no backlog row: lane=none unplaced=true
  backlog order: Alpha,Zeta
  nascent [parked,admin-prep] onto run: movable=true write={"stage":"exploring","status.chips":["admin-prep"]}
  submit-ready [blocked] onto push: movable=true write={"status.chips":[]}
  building onto backburner: movable=true write={"status.chips":["parked"]}
  exploring [parked,blocked] onto backburner: movable=true write={"status.chips":["parked"]}
  in-prep [blocked] onto blocked: movable=true write=null
  submit-ready onto push: movable=true write=null
  exploring onto push: movable=true write={"stage":"in-prep"}
  in-prep [results-in, parked, lead] onto blocked: movable=true write={"status.chips":["results-in","lead","blocked"]}
  building [parked] onto build: movable=true write={"status.chips":[]}
  coauthor onto backlog: movable=false write=null
  coauthor menu: run,push,revise,review,blocked,backburner,scope,derisk,build
  projects menu: run,push,revise,review,blocked,backburner,scope,derisk,build,backlog
  odd lane: movable=false write=null
  odd chip lane: movable=false
  stages and chips: focus_lanes.0 is not a value this key takes
  neither: focus_lanes.0 is not a value this key takes
  two rows in-prep: focus_lanes.1.stages is not a value this key takes
  shipped: no finding
  k-focus: findings=[["focus","key focus is not declared by the schema of this file"]] venueId=undefined pillarIds=[] lane=Run
  k-venueid: findings=[["venue_id","key venue_id is not declared by the schema of this file"]] venueId=undefined pillarIds=[] lane=Run
  k-venue: findings=[] venueId=tmlr pillarIds=[] lane=Run
  k-venuebad: findings=[["venue","venue is nowhere, which is not a key of venues"]] venueId=undefined pillarIds=[] lane=Run
  k-pillar: findings=[["pillar","key pillar is not declared by the schema of this file"]] venueId=undefined pillarIds=[] lane=Run
  k-pillars: findings=[] venueId=undefined pillarIds=["graphs"] lane=Run
  k-pillarsbad: findings=[["pillars[0]","pillars[0] is nowhere, which is not a key of pillars"]] venueId=undefined pillarIds=[] lane=Run
  k-paused: findings=[["stage","stage is paused, which is not a key of vocab.stages"]] ... lane=none
  k-nogo: findings=[["stage","stage is nogo, which is not a key of vocab.stages"]] ... lane=none
  (demo, 13 projects) graph-bandits in-prep [results-in] Push; graph-transfer submit-ready Push; online-clustering scoping Scope; robust-embeddings submitted Review; sparse-attention in-prep [blocked] Blocked; streaming-anomaly revision [numbers-to-run] Revise; tensor-sketch nascent Backlog; failed-quantization cat=failed stage=failed none; bench-suite, demo-toolkit, tensorkit released none; early-benchmark, spectral-clustering-collab published none
  demo findings: 0
  nascent waiting on ada: []
  in-prep waiting on ada (control): [{"label":"ada","count":1}]
  new manifest: "id: new-one\ntier: projects\nstage: nascent\ntitle: New one\nstatus:\n  chips: []\n  line: \"New idea: scope and novelty check open.\"\neli5: e\nnext: Scope the idea; cited-novelty lit check; decide go/no-go.\n"
  a-ok: category=failed []
  a-pub: category=failed ["stage published is not the folder's failed"]
  c-prep: category=stopped ["stage in-prep is not the folder's stopped"]
  ```
  Every after-change line the report quotes is reproduced. The first run on the unchanged tree is the builder's `first-run.txt` in the scratchpad. I read it whole: it holds every case and agrees with the report's table.
- The builder's test-row logs, read:
  - `rows-before.txt` ends "Test Files  3 failed | 47 passed (50)" and `rows-after.txt` ends "Test Files  2 failed | 48 passed (50)".
  - The reruns alone: `rows-before-2.txt` "Test Files  4 passed (4) / Tests  54 passed | 2 skipped (56)" and `rows-after-2.txt` the same.
- Read-only counts over the hub's 120 manifests (a Python tally of tier, stage and `focus:` presence):
  - 58 carry `focus:`, which matches the state file.
  - No coauthor, archive or software manifest without `focus:` has a stage or chip that would newly put it on a lane.
  - No manifest carries the chip `blocked` with a lane other than Blocked.

## Verdicts

Items of "What to build":
1. The stages: holds. The 13 rows are in the brief's order and the three new rows are exactly as written (`vocab.yml:66-78`). The head comment (`:50-54`), `vocab.ts:85,97`, the `stage` help (`manifest-schema.yml:36`), `stage_folders: [stopped]` and `publication_kinds` `[stopped]` are as the brief asks.
2. The chips: holds. `parked` comes right after `blocked`; `results-in` and `numbers-to-run` keep their icons; the `status.chips` help is rewritten.
3. The lanes and the vocabulary shape: holds.
   - `focus_lanes:` is exactly as written and `holding_color` is gone.
   - The head comment at `:173` has no test path, and the "backlog lane" wording is at `:173` and `:200`.
   - `laneRow` refuses both, neither and a shared stage (the cases above).
   - `BACKLOG` sits beside `CLUSTERS` (`focus.ts:41`), and `derive.ts:86` is rewritten.
4. Which lane a card sits on, and what a move writes: holds.
   - `laneOf`, `moveOnto`, `movable`, `laneItems`, `unplaced`, `waiting`, `stats.ts:89` and `Projects.svelte:239` behave as the cases show.
   - The literal `'holding'` and `holdingTone` are gone. `focus.ideas` and `focus.idea_backlog` are removed and nothing reads them (grep). `Focus.svelte:18` is rewritten.
   - Two change records per move are shown by the builder's write case. I did not rerun that one.
5. `focus:` leaves the manifest: holds. Schema, model, `normalise.ts`, `forms/schema.ts`, `apps.md:375`, `manifest.ts:676` and its head comment are done; the case `k-focus` passes. No `focus` read of a manifest is left in `src` (grep of `project.focus|manifest.focus` prints nothing).
6. `venue` and `pillars`: holds. Every listed place is changed; the free-text read and its three readers are removed; the key cases pass.
7. The boards' groups: holds (`layout.yml:239-240,253,256,271,285`).
8. Every other name of a changed word: violated, finding S-1. The named lines are rewritten, but two head comments the change makes false remain. The report also says hits outside the board and data domains were not read line by line.
9. The demo fixtures: holds. Each manifest reads as item 9 gives it, `archive/nogo/` is now `archive/failed/`, and the demo build gives 0 findings.
10. The tests: holds. The rows are rewritten by item 9's table, none removed or skipped, and each is named in the report. The spec.md rule on failing lines is P-1, a separate matter.

Cases:
- `submitted`: Review. Met.
- `in-prep`: Push; `submit-ready`: Push. Met.
- `building [parked]`: Backburner. Met.
- `exploring [parked, blocked]`: Blocked. Met.
- `nascent`: Backlog; on coauthor, no lane. Met.
- `in-prep` on coauthor: Push. Met.
- `released`: no lane; `stopped [parked]`: Backburner. Met.
- `exploring [admin-prep]`: Run. Met.
- No build lane: no lane, unplaced; no backlog row: no lane, unplaced. Met.
- Backlog in title order; a nascent project waiting on a person is in no tally. Met, with an in-prep control that is counted.
- `nascent [parked, admin-prep]` onto Run. Met.
- `submit-ready [blocked]` onto Push. Met.
- `building` onto Backburner. Met.
- `exploring [parked, blocked]` onto Backburner. Met.
- `in-prep [blocked]` onto Blocked: nothing. Met.
- `submit-ready` onto Push: nothing; `exploring` onto Push: `stage: in-prep`. Met.
- A coauthor card onto Backlog is refused and its menu lists the nine other lanes. Met. Whether the lane lights during the drag is not verifiable here (the look).
- A lane whose first stage is no word of `stages:`: refused. Met.
- The vocabulary shape: both, neither, two rows holding `in-prep`. Met (a finding of `catalogs/vocab.yml` in the `shape_other` form).
- `focus: run`. Met.
- `venue_id`, `venue: tmlr`, `venue: nowhere`. Met.
- `pillar`, `pillars`, `pillars: [nowhere]`. Met.
- `stage: paused`, `stage: nogo`. Met; the first run gives none.
- A new project of the tier `projects`. Met.
- The audit's folder rule, all three. Met.
- The fixtures of item 9, and the demo hub with no new finding. Met.

## 1. Spec

None.

- The four paths outside the write list are each needed:
  - `config/catalogs/glyphs.yml` and `icons.yml` drop `green_square`. Its only users on the base were the removed `accepted` row and `tones.ts:223` (grep over the base copy), and the orphan-glyph check at `tests/checks/config/config-folder.test.ts:449` would otherwise fail.
  - `config/defaults/sources.yml:28` names the renamed key `pillars:`.
  - `ProjectCard.svelte` read the removed `project.focus` (base `ProjectCard.svelte:376-377`), so the brief's clause "any other file under src/ ... a focus read of the manifest" covers it.
- No dependency is added and `package.json` is not in the diff.
- The premises reproduce: 28 files with `venue_id` on the base. The one miss in the brief's reader list, `ProjectCard.svelte`, is named by the report.

## 2. Proof

- **P-1.** No changed test is quoted with its failing line on the unchanged tree.
  - Place: the report's "The test rows, before and after". spec.md says: "The report quotes, for each test the step adds or changes, its failing line on the unchanged tree."
  - The report runs the old rows on a copy of the base ("Test Files 4 passed (4)") and the new rows on the worktree ("Test Files 4 passed (4)"). It quotes no failing line of a changed test on the unchanged tree, and it does not say which changed rows would pass there anyway (most `stage: active` to `exploring` rows hold on both trees).
  - Rows such as the IDEA_ROWS of `tests/server/edit/writes.test.ts:669-695` (no `focus: holding` line) and the `venue:` rows of `references.test.ts` are the ones that should be red on the base.
  - Failure scenario: a reviewer cannot tell from the report that a rewritten row checks the new behaviour rather than passing on both trees.
  - I did not run the new rows against the base copy myself: running them on the base code may count as "a revert of the code under test to watch a test go red", which the hub's no-breakage rule bans. The two rules may clash; that is for the orchestrator (see Declined to judge).

## 3. Standards

- **S-1 (item 8).** Two head comments still say "active projects", but `unplaced` now also lists ideas.
  - Places: `src/lib/state/boards/focus-lanes.ts:1-2`, "the two attention rows of projects for Focus: the manifests behind their docs and the active projects on no lane", and `src/lib/views/boards/focus/CommandCenterView.svelte:76-79`, "the row of manifests behind their docs or the row of active projects on no lane".
  - After the change, `unplaced` (`focus.ts:334-347`) also lists a project whose stage carries `idea` and that no lane takes. The builder rewrote the same phrase at `focus-lanes.ts:32` ("The attention row of the projects no lane shows") and at `ticker.ts:130-133`, but left these two lines and judged them English.
  - Failure scenario: a maintainer reading the head comment takes the Needs attention row to hold in-flight work only. On a hub whose `focus_lanes:` has no backlog row, they then do not expect its nascent ideas in that row.
- **S-2.** The report lacks two lists spec.md asks for.
  - The "still true" or "rewritten" list of every head comment, doc comment and catalog paragraph that describes the changed behaviour.
  - The grep quoted before writing each new helper or schema (`laneOf`, `moveOnto`, `holds`, `titleOrder`, `laneRow`, `laneRows`).
  - A consequence beyond S-1: the `blocked` chip flag paragraph (`config/catalogs/vocab.yml:92`; `src/lib/data/shapes/catalog-files/vocab.ts:141-142`) lists the flag's readers: the awaiting box, the wait line and the cross-link group. It omits the board statistics strip's blocked count, which now reads the flag (`src/lib/state/boards/board/stats.ts:89`, `if (anyWord(config, 'chips', 'blocked', item.project.chips)) blocked += 1;`).
  - Failure scenario: someone who edits the `blocked` flag and reads only this catalog paragraph misses that the stats strip's count moves with it.
- **S-3.** The builder ran `git grep` (report, "Anything in the brief that was wrong or impossible", point 2).
  - spec.md "Where you work" allows only `git status`, `git diff` and `git show`. "Read first" says a disagreement between the brief and the rules is stopped on and reported, not settled by picking a side.
  - `grep -rnw` over the same folders gives the same judgment, as this review shows. The diff is not affected.
- **S-4.** `src/lib/views/shared/card/project/ProjectCard.svelte:121` parses `focus_lanes` through zod again for every card.
  - The line is `const lane = $derived(laneOf(item.project, lanes(configMap()), configMap()));`, inside each card's `$derived`. `Projects.svelte:119` parses it once per board (`const focusLanes = $derived(lanes(config));`).
  - Failure scenario: a board of N cards runs the lane parse N times on every config change, where once would do. This is low severity.

## 4. Behaviour

- **B-1.** The report's "Before and after" section, which the landing look is read against, leaves out these host-visible changes:
  - (a) The board card's lane tag (`ProjectCard.svelte:379-381`). Before, it showed the raw `focus:` value ("push", "holding", "blocked"). After, it shows the lane label ("Push", "Backlog", "Blocked"), and it shows on every card whose stage or chips give a lane. The report names this only as judgment call 5.
  - (b) The List's Focus cell on the projects and personal boards (`Projects.svelte:239`). Before, the `focus:` key ("push"); after, the lane label ("Push"). The report names this only among the grep judgments.
  - (c) The board statistics strip's blocked count (`stats.ts:89`). Before, the projects with `focus: blocked`; after, the projects carrying a chip with the flag `blocked`.
  - (d) The stage and chip words as drawn on cards and the Map:
    - `released` is teal `#0d9488` where `finished` was green `#16a34a`;
    - `failed` is `#dc2626` with `cross_box` where `nogo` was `#b45309` with `overdue`;
    - `stopped` is `#9ca3af` with `trash`;
    - the chip labels read "results in, not written up" and "numbers still to run", and the new `parked` chip reads "parked (not being worked)" with `black`.
  - (e) The Pillars view's Archival band. Its groups go from five (no-go, dropped, disproved, abandoned, paused; `dead: 1..5`) to two (failed, stopped), and its blurb now reads "Dead-ends (failed / stopped), ..." (`config/text/views/structure/pillars.yml:5`).
  - Failure scenario: the look at landing works from this section. It does not open the projects board's cards and List, the stats strip, or the Pillars view's Archival band. A wrong label, colour or group there would be booked as seen.

## Declined to judge

- How the change looks on screen: whether a lane lights during a drag, the backlog's full-width shape with its "Backlog" summary and sub line, the lane colours, the card tags. A builder and a reviewer run no page; this is for the look on TEST at landing.
- Whether each changed test row is red on the unchanged tree (P-1). Running the worktree's rewritten tests against `.agents/worktrees/migration-O67-base/` would settle it, but that may be the banned "revert of the code under test". The orchestrator rules on whether the spec.md rule or the no-breakage rule applies.
- The real-hub cases of `tests/checks/config/integrity.test.ts`, which skip in this run. The builder says `OCULUS_TEST_HUB` is unset, which I did not verify. The rewritten personal-stage list at `:286` (`['nascent', 'building', 'exploring', 'in-prep', 'released']`) can only be checked against the hub after the landing rewrite.
- The undo of a two-field move (two change records). It rests on the builder's write case, which I did not rerun because it writes a manifest through `writeManifest`. A rerun on a planted copy of the demo hub would settle it.
- Whether any untracked file other than `tests/fixtures/hubs/demo/projects/archive/failed/` sits under an ignored path. `git status --short --ignored` would settle it, and it is not among my three commands.

Reviewer usage: a8c4020c0f56479db, claude-opus-5-5, 337683 tokens, 81 tool uses, 15 min 46 s.

## Repair round 1, refuted

Round item 6 (finding S-4) is not built. The builder handed it back as a clash between the round brief and the repository's boundary rule; the clash reproduces (S-4 below). The other seven round items are closed, and my reruns reproduce every claim the round report quotes. I found three small new findings: S-5, S-6, and P-2 to P-4.

### Verification (rerun by the reviewer)

Every command ran from the worktree root `/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O67`. `git status --short` gave 98 lines before and after my runs. `git diff <base> --stat` gave "95 files changed, 2190 insertions(+), 2091 deletions(-)" before and after. `git diff <base> --stat -- docs/diagrams` gave "8 files changed, 1612 insertions(+), 1584 deletions(-)" before and after `npm run diagrams`, so the diagrams match the source.

- `npm run diagrams && npm run test:quick -- --base 132a0e1fcd7d9ad3c03ecbfd799032f9b33798d5`, exit 0. The log is `/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/o67r1-quick.txt`:
  ```
  test:quick: 98 changed file(s), from git since 132a0e1fcd7d9ad3c03ecbfd799032f9b33798d5
  test:quick: 208 test file(s)
  ok      prettier (0.5 s): All matched files use Prettier code style!
  ok      ASCII gate (0.5 s)
  ok      svelte-kit sync (2.0 s)
  ok      eslint (2.0 s)
  ok      svelte-check (7.4 s): 1792773430295 COMPLETED 537 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
  ok      vitest (81.7 s): Duration  74.58s (transform 63.04s, setup 0ms, import 141.22s, tests 134.38s, environment 5.06s)
  ok      vitest checks (96.3 s): Duration  89.07s (transform 47.39s, setup 0ms, import 145.94s, tests 168.63s, environment 3ms)
  ok      vitest slow (127.5 s): Duration  120.39s (transform 9.34s, setup 0ms, import 79.18s, tests 395.89s, environment 11ms)
  test:quick: 129.7 s; every command passed
  test:quick: not covered: tests that reach no changed file within the import depth,
              the build, the lint of unchanged files
  ```
- **The round's delta.** I ran `diff -u` of each `files.txt` path in the snapshot against the worktree. Three paths differ: `config/catalogs/vocab.yml` (the `blocked` flag paragraph, `:92`), `src/lib/data/shapes/catalog-files/vocab.ts` (the `blocked` describe text, `:142`) and `src/lib/state/boards/focus-lanes.ts` (head comment `:1-4`).
  - `tests/fixtures/hubs/demo/projects/archive/failed/failed-quantization/project.yml` is identical to the snapshot.
  - `cmp` of the snapshot's and the worktree's `src/lib/state/boards/focus.ts` exits 0, so the round left `focus.ts` unchanged.
  - Two paths changed now that `files.txt` does not list: `src/lib/views/boards/focus/CommandCenterView.svelte:78` and `src/lib/views/boards/focus/lanes/LaneCard.svelte:49`. Each is a one-comment change, read in `git diff <base>`.
  - The round changed no code, only comments and describe strings. So the behaviour of round 0, which the first refuter checked, is unchanged.
- **The character-set check of spec.md** (the perl form) over the five round paths printed nothing (exit 0). The same check over the worktree's `O67-report.md` also printed nothing. Comment widths of the rewritten lines are 96, 93, 98 and 51 (`focus-lanes.ts:1-4`), 94 (`CommandCenterView.svelte:78`) and 93 (`LaneCard.svelte:49`).
- **Round item 1, the step's tests on the base code.** I rebuilt the builder's scratch copy in my scratchpad: an rsync of `migration-O67-base` without `node_modules`, `.svelte-kit` and `.scratch`, `node_modules` linked, every `tests/` path the step adds or changes copied from the worktree, and `archive/nogo` removed.
  - `diff -rq` showed `tests/` the same as the worktree and `src/` and `config/` the same as the base.
  - After `npx svelte-kit sync`, `npx vitest run --reporter=dot <the 50 files of row-files.txt>` gave "Test Files  11 failed | 39 passed (50)" and "Tests  49 failed | 604 passed | 9 skipped (662)". This matches the report.
  - The failing locations match the report's list: `references.test.ts:447,459`, `rename.test.ts:387,391,408,432,440`, `hub-keys.test.ts:102,137,149,161,184,194`, `hub-portfolio.test.ts:180,353,374,422`, `hub-routing.test.ts:188`, `relation-shapes.test.ts:75,92`, `writes.test.ts:182,707,733`, `normalise.test.ts:251`, `integrity.test.ts:202` (the demo hub), `manifests.test.ts:609` and `config-folder.test.ts:364,795`. The tally also shows `manifests.test.ts:250,326`, which are frames of the same two failing rows.
  - The copy is deleted (`ls -d` gives "No such file or directory").
- **Round item 8, the undo of a two-field move.** I wrote my own case-run program in a scratch copy of the worktree, a vitest file over `tests/routes/edit/write-fixture.ts`'s `target()`. The manifest is `stage: nascent`, `chips: [parked, admin-prep]`. The fields come from `moveOnto(..., run lane, ...)`, the write from `handleWrite`, and each record is undone through `undone`. Output, verbatim:
  ```
  before lane backburner
  fields {"stage":"exploring","status.chips":["admin-prep"]}
  move 200 {"ok":true,"changed":["stage","status.chips"],"refused":[]}
  records 2 [["status.chips",["parked","admin-prep"],["admin-prep"]],["stage","nascent","exploring"]]
  undo status.chips 200 "id: alpha\ntier: projects\nstage: exploring\ntitle: \"A title\"\nstatus:\n  chips: [parked, admin-prep]\n  line: \"the line\"\n"
  undo stage 200 "id: alpha\ntier: projects\nstage: nascent\ntitle: \"A title\"\nstatus:\n  chips: [parked, admin-prep]\n  line: \"the line\"\n"
  byte for byte true
  ```
  This reproduces the report's claim: one move makes two records, each undo takes back one, and after both the file is byte for byte as before. The copy is deleted.
- **The lane, move and shape cases, rerun with my own case-run program** over the worktree's `focus.ts`, `shapeIssues` and the engine config. The copy is deleted. Output:
  ```
  lane submitted [] projects => Review
  lane in-prep [] projects => Push
  lane submit-ready [] projects => Push
  lane building ["parked"] projects => Backburner
  lane exploring ["parked","blocked"] projects => Blocked
  lane nascent [] projects => Backlog
  lane nascent [] coauthor => none
  lane in-prep [] coauthor => Push
  lane released [] projects => none
  lane stopped ["parked"] projects => Backburner
  lane exploring ["admin-prep"] projects => Run
  no build lane none unplaced 1
  no backlog row none unplaced 1
  backlog order Alpha,Zeta
  move nascent [parked,admin-prep] run {"stage":"exploring","status.chips":["admin-prep"]}
  move submit-ready [blocked] push {"status.chips":[]}
  move building backburner {"status.chips":["parked"]}
  move exploring [parked,blocked] backburner {"status.chips":["parked"]}
  move in-prep [blocked] blocked null
  move submit-ready push null ; exploring push {"stage":"in-prep"}
  coauthor backlog movable false menu run,push,revise,review,blocked,backburner,scope,derisk,build
  odd lane movable false
  both [{"kind":"other","key":"focus_lanes.0"}, ...]
  neither [{"kind":"other","key":"focus_lanes.0"}, ...]
  two in-prep [{"kind":"other","key":"focus_lanes.2.stages"}, ...]
  ```
  The "..." in the three shape lines stands for `unknown`-key issues of the other config sections. My program passed the whole merged config to the vocabulary file's shape, so those issues belong to the program, not to the change. vitest marked the file failed only for "expected any number of assertion, but got none".
- **Round item 1 S-4 claim.** `grep -n "readLanes\|WeakMap" src/lib/state/boards/focus.ts` prints nothing (exit 1). The builder's first-run log `o67-r1-quick1.log:220,247` shows "FAILED  vitest checks" and `"lib/state/boards/focus.ts holds module-level state in readLanes"`, and its second log ends "test:quick: 131.7 s; every command passed", which matches the report. The rule's regex (`tests/checks/tree/boundaries.test.ts:431-433`) matches `const X = new ... WeakMap`, and the comment at `:422-427` gives FROZEN as "the whole exception".
- **Round item 2 greps, rerun.** `grep -rn "unplaced\|Needs attention\|attention row\|on no lane\|active projects" src config docs --exclude=local.yml`, without `docs/diagrams`: no hit about the Focus attention row still says "active projects". The hits are `focus-lanes.ts:1-4,33,43`, `ticker.ts:131-133,596`, `CommandCenterView.svelte:77-78`, `vocab.yml:51-52`, `vocab.ts:85,88`, `focus.yml:76-77` and `HELP.md:286`; each agrees with `unplaced` at `focus.ts:334-347`. The other hits are a different `unplaced` (a lint walk, the terminal, the repository shapes) or the feed lines.
- **Round item 3, rerun.** `grep -rn "'blocked'" src` finds these readers of the flag: `focus.ts:114` (`isBlocked`, read at `:396` and by `Lanes.svelte:108`), `stats.ts:62` (the board card's wait line), `stats.ts:89` (the strip), and `collection.ts:815` (the cross-link group). `Focus.svelte:143,204` is a row key. The two texts name all four readers.
- **Round item 4 helper greps, rerun** with the four commands the report quotes. They give the hits the report lists.
- **Round item 7, against the base** (`git show <base>:...`).
  - The base rows the report gives are right: `finished` `#16a34a` `done`; `nogo` "no-go (failed gate)" `overdue` `#b45309`; `disproved` `cross_box` `#dc2626`; `dropped` `trash` `#9ca3af`; `abandoned` `cross` `#6b7280`; `paused` `black` `dead: 5`; `accepted` `green_square`. The chips "positive result (pre-writeup)" (`white`) and "numbers pending" (`blue`) are also right.
  - Base `stats.ts:92` reads `item.project.focus === BLOCKED`.
  - The base card read `{#if item.project.focus}<Tag label={item.project.focus} />`.
  - The base sparse-attention fixture has `focus: blocked` and `chips: [blocked]`.
  - The base Archival blurb is "Dead-ends and paused work (no-go / dropped / disproved / abandoned / paused), ...", and the worktree's reads "Dead-ends (failed / stopped), ...".
  - `Stats.svelte:38` draws `t('board.stat_blocked', stats.blocked)`.
- **Round item 8, the ignored-path check.** `git status --short` shows `?? tests/fixtures/hubs/demo/projects/archive/failed/`. `find` over that folder lists one file, `failed-quantization/project.yml`. git shows an untracked folder only when it holds a file that is not ignored, so that file is not ignored. A `grep` of every `.gitignore` outside `node_modules` for fail, archive, fixtures or `*.yml` printed nothing.
- `ls docs/adr` gives "No such file or directory", so no ADR governs the diff.

### Verdicts

Items of "What to build", over the whole diff since the base:
1. The stages: holds (`vocab.yml:66-78`, unchanged since round 0).
2. The chips: holds.
3. The lanes and the vocabulary shape: holds (shape cases rerun above).
4. Which lane a card sits on, and what a move writes: holds (lane and move cases rerun; undo rerun). The comment at `presets.ts:169-172` carries the clause in S-6. The item's own requirement for that comment, that it names the flag `blocked`, holds.
5. `focus:` leaves the manifest: holds. These parts are unchanged since round 0, as the delta check shows.
6. `venue` and `pillars`: holds. Unchanged since round 0; the base red run shows the rewritten `venue` and `pillars` rows red on the base.
7. The boards' groups: holds.
8. Every other name of a changed word: holds. S-1's two comments are rewritten (`focus-lanes.ts:1-4`, `CommandCenterView.svelte:77-78`).
9. The demo fixtures: holds. `integrity.test.ts` "the demo hub > validates with no findings" passes in the quick run and is red on the base.
10. The tests: holds. Each changed row's failing line on the base is quoted, and my rerun reproduces it.

Cases:
- Each lane case (Review; Push; Push; Backburner; Blocked; Backlog and coauthor none; coauthor in-prep Push; released none, stopped [parked] Backburner; admin-prep Run): met (my rerun).
- No build lane, and no backlog row: met (my rerun; `unplaced` lists each).
- Backlog in title order: met (my rerun). A nascent project waiting on a person in no tally: met, by the round-0 refuter's run. The code is byte-identical to the round-0 snapshot (`cmp`).
- The six moves listed (nascent [parked, admin-prep] onto Run; submit-ready [blocked] onto Push; building onto Backburner; exploring [parked, blocked] onto Backburner; in-prep [blocked] onto Blocked; submit-ready and exploring onto Push): met (my rerun).
- Coauthor onto Backlog refused, and its menu of nine: met (my rerun). Whether the lane lights during the drag: not verifiable here (the look).
- A lane whose first stage is no word of `stages:`: met (my rerun, `odd lane movable false`).
- The vocabulary shape (both, neither, two rows holding in-prep): met (my rerun).
- `focus: run`; `venue_id`, `venue: tmlr`, `venue: nowhere`; `pillar`, `pillars`, `pillars: [nowhere]`; `stage: paused` and `stage: nogo`; the new project: met. Each rests on the round-0 refuter's run over code byte-identical to the snapshot, and the `venue`/`pillars` and new-idea rows are also among the tests red on the base and green now.
- The audit's folder rule, all three: met, on the same evidence as the item above.
- The fixtures of item 9 and the demo hub with no new finding: met (`integrity.test.ts` in the quick run).

### 1. Spec

None.

- Every closure the round claims is a change to text. None removes a check.
- The `LaneCard.svelte:49` comment is a path the round adds outside `files.txt`. It goes beyond S-1's wording, but the step made it false: base `menuFor` listed every lane, and the worktree's filters by `movable` (`Lanes.svelte:116-121`). So the brief's "any other file under src/" and spec.md's rule on sentences made false both cover it.
- Item 6 is handed back unbuilt. That is a stop under spec.md "Read first", not a smaller job: see S-4.

### 2. Proof

- **P-2.** One row of the round's "still true or rewritten" list (round item 4) is marked "not checked".
  - Place: `O67-report.md`, the round-item-4 table, row `LaneHead.svelte:4 | still true for the project lanes; not checked for the backlog snippet`.
  - What is wrong: the round brief asks for each place to be marked "still true" or "rewritten". This row is neither.
  - My reading settles it as still true. The backlog lane is drawn through the same `lane` snippet (`Lanes.svelte:272-283` renders `lane(one, ...)`, which draws `<LaneHead>` at `:214`), so "Lanes.svelte draws it over every project lane" holds for the backlog too.
  - Failure scenario: a reader of the list cannot tell whether the comment holds and would read the head comment again.
- **P-3.** The undo case-run program's source is quoted only "in its essentials".
  - Place: `O67-report.md`, round item 8, the `undo-case.ts` excerpt, which leaves out `post`, the planting and the runes stand-in.
  - What is wrong: spec.md ("What every package obeys", case-run programs) asks for the source to be quoted so the reviewer can run it again.
  - Failure scenario: a reviewer cannot rerun it in the same form and has to write a program of their own, as I did. Mine gives the same records and the same byte-for-byte result.
- **P-4.** The round's ASCII line lists `focus.ts` among "the round's changed files" and uses a perl form other than the rules file's gate.
  - Place: `O67-report.md:604`.
  - What is wrong: `cmp` shows `focus.ts` unchanged by the round in its end state.
  - Failure scenario: a reader takes `focus.ts` as changed in this round and looks for a delta that is not there. My run of the spec.md gate over the five round paths printed nothing.

### 3. Standards

- **S-4 (still open; round item 6 not built).** `src/lib/views/shared/card/project/ProjectCard.svelte:121` still parses `focus_lanes` for every card:
  ```
  const lane = $derived(laneOf(item.project, lanes(configMap()), configMap()));
  ```
  - `src/lib/state/boards/focus.ts:171-173` is still the plain `return readAs(lanesShape, config.focus_lanes) ?? [];`.
  - The round brief's fix text, a module-level `WeakMap` in `focus.ts`, breaks the repository's rule. `tests/checks/tree/boundaries.test.ts:422-434` refuses a module-level `new WeakMap` under `src` outside FROZEN, and spec.md "The principles" says "no module-level mutable state". The builder's first quick run shows that red line (`o67-r1-quick1.log:247`).
  - So the brief's fix and the rule clash. The builder stopped and named options A to C, as spec.md "Read first" asks.
  - Failure scenario (unchanged): a board of N cards runs the zod parse of `focus_lanes` N times on every config change.
  - Judgment: option A is the better fix. `ProjectCard` takes the lanes as a prop from `Projects.svelte:119` (`focusLanes`, parsed once per board), and `Project.svelte:124` parses once for its one card. This is a caller change the round brief excluded, so it needs the orchestrator's ruling.
  - Option B, adding `readLanes` to FROZEN, is the lazy option, and it loosens a check, which spec.md forbids.
- **S-5.** The builder ran a git command the round forbade: `git check-ignore -v tests/fixtures/hubs/demo/projects/archive/failed/failed-quantization/project.yml`.
  - Place: `O67-report.md:396`, which states it.
  - What is wrong: the round brief says "In this round no git command beyond the three above", and spec.md "Where you work" names `check-ignore` as banned. The diff is not affected, since the command is read-only.
  - Failure scenario: none to the code. The orchestrator's rule that a builder reads git state through three commands only was not kept in this round.
- **S-6.** A comment of item 4 says more than the code does.
  - Place: `src/lib/state/boards/board/presets.ts:169-172`:
    ```
    /**
     * How many carry a chip whose word of `chips` carries `blocked`, which puts a project on the
     * Focus board's Blocked lane.
     */
    ```
  - What is wrong: a flag does not place a card. `laneOf` (`focus.ts:247-258`) places it by the words a lane row's `chips` lists, here `chips: [blocked]`. A chip a hub adds to `chips:` with `blocked: true` is counted by `stats.ts:89` and the awaiting box, but it puts no card on Blocked.
  - The round's list marks this comment "still true" (`O67-report.md:493`).
  - Failure scenario: a maintainer adds `on-hold: { label: ..., blocked: true }` to a hub's `chips:` and, trusting this comment, expects those cards on the Blocked lane. They stay on their stage lane while the strip counts them as blocked.
  - Under the shipped vocabulary the two agree, since `blocked` is the only flagged chip and the Blocked lane's chip. This is low severity.

### 4. Behaviour

None.

- B-1 is closed. The round's "Before and after" gains (a) to (e), each with its view, its state and before and after, and the base values it quotes match `git show <base>:...` (above).
- The look at landing can work from it: the board card's lane tag, the List's Focus cell, the strip's blocked number, the stage and chip words with their colours and glyphs, and the Pillars Archival band with its blurb.

### Declined to judge

- How the change looks on screen: a lane lighting during a drag, the backlog's full-width drawing with its "Backlog" summary and sub line, the card tags, the List cell, the strip and the Archival band as drawn. A reviewer runs no page; these are for the look on TEST at landing.
- The real-hub cases of `tests/checks/config/integrity.test.ts`, and the personal-stage list at `:286`, against the hub's data after the landing rewrite. They can only be checked once the orchestrator rewrites the hub at landing.
- Whether the orchestrator should rule S-4 by option A, B or C. That is a ruling; my judgment is under S-4.

Reviewer usage: a542e6574a932d89b, claude-opus-5-5, 222797 tokens, 64 tool uses, 14 min 3 s.

## Closed

- S-4: fixed at landing by the orchestrator's ruling of the builder's option A: `ProjectCard.svelte` takes the parsed lanes as a prop, which `Projects.svelte` passes from its one parse per board and `Project.svelte` from its one parse; option B, adding the memo to FROZEN, was the lazy option and loosens a check.
- S-5: no work; the command was read-only and the diff is not affected; named in the booking.
- S-6: fixed at landing: the comment at `src/lib/state/boards/board/presets.ts:169-172` says what the count reads, a chip whose word carries the flag `blocked`, without saying it places a card on a lane.
- P-2: fixed at landing in the report: the `LaneHead.svelte:4` row is marked still true, on the reviewer's reading (`Lanes.svelte` draws the backlog through the same `lane` snippet).
- P-3: no work; the reviewer's own program reproduced the two change records and the byte-for-byte undo, so no decision rests on the excerpt.
- P-4: fixed at landing in the report: `focus.ts` is removed from the round's ASCII line.
