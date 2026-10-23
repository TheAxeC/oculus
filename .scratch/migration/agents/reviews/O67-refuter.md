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
