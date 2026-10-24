# Step O55 refuter report (on .agents/worktrees/migration-O55, base 00bebb58)

A page this report cites (the rules file, a standard, a skill's text) is named with its section, never with a line number, since a page's lines move and a section's name does not. A finding in code keeps its `file:line`.

The report is written in the rules file's character set. A character outside it in a quoted line is written by its name in angle brackets, such as `<tab>` or `<em dash>`.

## Verification (rerun by the reviewer)

All commands ran from `/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O55`. The brief says each output is "piped through the filter the rules file names"; `grep -n -i -E "filter|pipe" .scratch/migration/agents/spec.md` printed nothing, so the rules file names no filter, and the outputs below are unfiltered.

```
$ npm run test:quick -- --base 00bebb58
test:quick: 159 changed file(s), from git since 00bebb58
test:quick: 300 test file(s)
ok      prettier (7.1 s): All matched files use Prettier code style!
ok      ASCII gate (7.4 s)
ok      svelte-kit sync (13.3 s)
ok      eslint (47.2 s)
ok      svelte-check (55.9 s): 1792815701534 COMPLETED 538 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest checks (108.7 s): Duration  100.14s (transform 66.43s, setup 0ms, import 178.29s, tests 186.84s, environment 3ms)
ok      vitest (138.8 s): Duration  130.96s (transform 192.66s, setup 0ms, import 270.89s, tests 195.57s, environment 34.34s)
ok      vitest slow (165.2 s): Duration  157.46s (transform 9.77s, setup 0ms, import 106.59s, tests 512.84s, environment 16ms)
test:quick: 178.7 s; every command passed
test:quick: not covered: tests that reach no changed file within the import depth,
            the build, the lint of unchanged files
exit 0

$ LC_ALL=C perl -ne '<the spec.md ASCII gate>' $(the 159 paths of git diff --name-only 00bebb58, minus local.yml)
(nothing printed)
exit 0

$ grep -rnE "<the brief's verify 3 pattern>" src config tests docs utils --exclude=local.yml | wc -l
389
(the builder's report says 389 hits in seven groups, 1+3+21+96+5+101+162 = 389; the counts agree)
hits in files the step changed, outside tests and docs/diagrams, each read:
src/lib/state/boards/ticker.ts:91:const PROJECTS = 'projects';            -> the ticker_sources key, no tier
src/lib/views/boards/projects/Projects.svelte:22-25: boardRegistration('projects'|'coauthor'|'archive', n) -> view ids
src/lib/data/snapshot/normalise.ts:128, merge.ts:49, references/scan.ts:301, state/forms/schema.ts:283 -> the entity source projects
config/catalogs/vocab.yml:122:  finished: { color: "#0ea5e9", closes_deadline: true } -> a status word of statuses
config/catalogs/vocab.yml:179: sub: "Tier-0 go / no-go pilot" -> lane subtitle
config/text/views/system/audit.yml:18: sec_conform: Tier conformance -> unchanged section label
config/schemas/manifest-schema.yml:35: tier: { label: "Tier", type: select, from: vocab.tiers, ... } -> field label
every other hit is a TypeScript or YAML `groups:` of menus, decks, options help, or prose `finished`
tests/data/sources/manifests/manifests.test.ts:236: 'tier: projects\nstage: nascent\ntitle: U\n' -> the case 10 row expecting the finding
none is a tier word, a flag, a chip or a removed name read by code.

$ sh utils/unused-exports.sh > ue.txt; diff ../O55-base/unused-exports.txt ue.txt
126c126
< src/lib/state/boards/board/index.ts: FACETS, NONE, bucketOf, venueText, ...
> src/lib/state/boards/board/index.ts: FACETS, NONE, venueText, ...
284c284
< ... QuickFilters, RollupBucket, SessionsOf, ...
> ... QuickFilters, SessionsOf, ...
(343 lines each; the step adds no line, removes two names)

Commands the builder's report quotes, rerun:
$ npx vitest run tests/state/boards/board/ tests/data/sources/config/boards.test.ts tests/state/workbench/layout/saved/layout-workspaces.test.ts tests/data/sources/manifests/manifests.test.ts
 Test Files  6 passed (6)
      Tests  158 passed (158)
(report: 75 + 26 + 21 + 36 = 158; agrees)

$ npx vitest run --config $S/cases.config.mjs --silent=false --reporter=verbose after   ($S = scratchpad/o55)
case22: quickadd=["qp","qs"]
case23: venue attention=[{"kind":"venue","id":"v1","count":1,"label":"V1"}]
case23 vp alone: [{"kind":"venue","id":"v1","count":1,"label":"V1"}]
case23 vr alone: []
case24 supervision: {"text":"id: n1\ntier: research\nstage: nascent\nsupervisors:\n  - axel-faes\n...","boards":["supervision"]}
case24 software: {"text":"id: n2\ntier: software\nstage: nascent\ntitle: N\nstatus:\n  chips: []\n  line: New project.\neli5: N\n","boards":["software"]}
case24 no tier: {"text":"id: n3\ntier: research\nstage: nascent\nlead:\n  - axel-faes\n...","boards":["projects"]}
case25: [["in-flight",["xb"]],["done",["xp","xr"]],["ideas",["xn"]]]
      Tests  1 passed (1)
(identical to the report's quoted after-run)

$ npx vitest run tests/checks/tree/size.test.ts
      Tests  10 passed (10)

First-run evidence files read (not rerun on a base copy, since that would mean planting the new tests in a copy of the old tree; their content was read): $S/first-run.txt (25 case lines, as quoted), $S/first-run-base.txt (cases 26, 29, 31 and "grep exit 1", as quoted), $S/g124-base.txt ("Cannot find module '.../data/shapes/boards/categories.ts'", "Tests  no tests"), $S/g29-base-changed-test.txt ("Tests  1 failed | 20 passed (21)", "expected [ Array(1) ] to deeply equal [ 'main' ]"), $S/g29-base-unchanged-test.txt ("Tests  20 passed (20)"), $S/changed-tests-base.log ("Tests  54 failed | 356 passed (410)").

Folder counts (ls | wc -l): src/lib/data/shapes 7, src/lib/data/shapes/boards 4, src/lib/views/boards/collection 4, config/text/views/shared 6, tests/state/boards/board 3.
```

## Verdicts

Items of the brief's "What to build", in its numbering:

- 1: holds. `config/catalogs/vocab.yml:201-205` holds the three label-only rows; `TIERS`, `\bTier\b` types, `finished`, `backlog`, `outcome_folders`, `stage_folders`, `softwareTiers`, `softwareTags` have no code hit in grep 3; the unknown and missing tier findings are G32 rows `manifests.test.ts:235-251`; `research_audit: { skip_tiers }` is read by `rules.ts:173` and `lines.ts` orphans; `idea_status_software` writes "New project." (case 24 run).
- 2: holds. `src/lib/data/shapes/boards/roles.ts` (rolesOf, roleOf, isLead, isMine, entryRoles); `isMine` keeps a record naming no one (ruling 209, `roles.ts` isMine); the no-lead finding is `projects.ts:354-356`; teamOf puts supervisors last. The module is under `data/shapes/boards/` instead of the brief's example path `state/boards/board/roles.ts`: the server imports it (`server/content/audit/projects.ts:23`, `audit/rules.ts:12-13`, `server/edit/writes/manifest.ts:39`, `server/root/watch/portfolio.ts:34`) and the boundaries test forbids server-to-state imports, so the move is required, and the brief wrote the path as "for example". See Behaviour 2 for the no-lead finding on every new Personal or Software project.
- 3: holds for every clause a project can meet; the Archive clause of decision 12 cannot hold under the brief's own rules (Behaviour 1, Declined to judge). The six boards, keys and order are in `config/defaults/layout.yml`; `boardTakes` (`takes.ts`) applies every key and `role:` only when `self` is named; `boardItemOf` picks the first taking board (`selectors.svelte.ts:437-450`); the config check covers the blocks (G116 rows, case 19).
- 4: holds. `categories:` rows `vocab.yml:224-231` match the brief; `categoryOf` is the one function (`categories.ts`), read by items, facets, sections, `railCount`, `isArchival`; `Project.category` is gone with its G32 rows; `groups:` is gone from boards and options; `parseBoardState` drops unknown category values (case 32 row).
- 5: holds. `cards` read in `presets.ts` and drawn in `Projects.svelte:407-432`; the team line under the title is gone (`ProjectCard.svelte` diff); Lead badge, Role facet and Mine only on boards and collections; templates in `docs/templates.md:963-965, 1006-1008, 1072-1074, 1111-1113, 1147-1149` declare the three fields with `lead` required. The drawn views are not covered by a test (the look at landing).
- 6: holds. Idea lane row and `IDEA` constant; chip lanes reject `terminal` stages (`focus.ts` holds); cross-link groups by stage flags with keys `xlink_in_flight` and `xlink_done` (`config/text/views/boards/project.yml:127-130`); Orphans skip `skip_tiers`.
- 7: holds. No hit for `msg_no_author_chip`, `folderStage`, `msg_stage_not_folder`, `archive_outcome`, `msg_projects_published`, `publishedStages` in grep 3; the four new findings exist (`audit.yml` keys, `projects.ts:350-383`, `categoriesFindings` in G116).
- 8: holds for the store (G29 rows `layout-workspaces.test.ts:129-165`; `load.ts` presumeCarried, `storage.ts` TabMemory). The page state is installed in the script body before `onMount` calls `loadLayout` (`src/routes/+page.svelte:115` and `:284`, with `ssr = false` in `src/routes/+layout.ts:3`), so the presumed read finds the envelope in the real page. See Proof 2 and Behaviour 4.

Cases of the brief's "Cases":

- 1: met, G124 rows "case 1" in boards, category, role, rail and audit tables.
- 2: met, G124 boards row (coauthor), category in-review, "case 2: Mine only hides a project naming others, and shows it when off".
- 3: met, G124 boards (archive), category other-outputs, Archival band row band [].
- 4: met, G124 boards (archive), dead-ends, band ['stopped'], real false, orphan false.
- 5: met, G124 boards (software), category idea, lane idea, unplaced [].
- 6: met, G124 boards (personal), lane idea, orphan false.
- 7: met, G124 boards (software), category released, orphan true, Related holds the paper naming it.
- 8: met, G124 boards (supervision), role supervisor, lead false.
- 9: met, G124 boards (projects), role lead.
- 10: met, G32 row `manifests.test.ts:235` (finding naming `projects`, tier undefined) and the G124 audit row (no-board finding with "no tier").
- 11: met, G32 row `manifests.test.ts:245` and the G124 audit row.
- 12: met, G124 boards [] with self, audit row msg_no_lead and msg_no_board with "no role".
- 13: met, G124 lane undefined and msg_terminal_lane_chip.
- 14: met, G124 category undefined and section '' last.
- 15: met, G124 rows "case 15, no self" (live, terminal, no lead), no Role facet, collection drawn false.
- 16: met, G124 category and Archival band rows with NO_DEAD_ENDS.
- 17: met, G116 categoriesFindings row (report; 26 G116 tests pass in my rerun).
- 18: met, G116 categories_colour row.
- 19: met, G116 stages.words row.
- 20: met, G124 "case 20" (badge [true,false], keeps [true,false], facet Lead 1, Other 1).
- 21: met, G124 "case 21" drawn false.
- 21a: met, G124 "case 21a" found 0, keeps [true].
- 22: met, quoted run `case22: quickadd=["qp","qs"]`.
- 23: met, quoted run (vp alone count 1, vr alone []).
- 24: met, quoted run (Supervision writes supervisors and is on supervision; Software writes "New project."; no tier gives research).
- 25: met, quoted run `[["in-flight",["xb"]],["done",["xp","xr"]],["ideas",["xn"]]]`; with one idea the heading reads "idea" through the singular key `xlink_idea`, which the base already had (`CrossLinks.svelte:48` at 00bebb58).
- 26: met, G124 "case 26" rows (grid, sections).
- 27: met for the store (G29 "draws the arrangement of the workspace the browser tab last loaded in its first draw", failing on the base copy per $S/g29-base-changed-test.txt); the look part not verifiable here, settled by the landing look on TEST.
- 28: met, G124 rail row count 2, '#16a34a'.
- 29: met, G124 "case 29" rows and boardsFindings [] for the keyed boards.
- 30: met, G124 "case 30" first board 'projects'; `boardItemOf` uses the same order (`selectors.svelte.ts:444-447`).
- 31: met, G124 sections in-flight then idea.
- 32: met, G124 "case 32" filters {} and all items shown.

## 1. Spec

- none.

## 2. Proof

- `.scratch/migration/agents/reviews/O55-report.md`, section "Hub rewrite", item 2: "Leads: every research project names `lead:`. ... A manifest naming no lead raises `msg_no_lead` and is on no board with a `role:`."; what is wrong: the list names leads for research projects only, but `src/lib/server/content/audit/projects.ts:354-356` raises `msg_no_lead` for a project of any tier (`placement` runs before the personal skip at `:392-393`). In the hub, `grep -rl -E "^tier: (personal|software)" --include=project.yml projects side-projects | wc -l` gives 20, and every one of the 20 lacks a `^lead:` line (for example `side-projects/ideas/residual/project.yml`, `projects/software/bttr-block-term-tensor-regression/project.yml`); the orchestrator's rewrite at landing rests on this list; failure scenario: the rewrite follows the list, and after landing the Audit view shows about 20 "names no lead" findings on personal and software projects; verdict: none (report content, not an item).
- `tests/state/workbench/layout/saved/layout-workspaces.test.ts:129-148`: the changed row replaced `expect(envelope).not.toHaveBeenCalled()` and `expect(client.layout.loaded()).toBe(false)` with `expect(envelope.mock.calls.every(([identity]) => identity === A)).toBe(true);`; what is wrong: the row now always carries a tab memory, so no row in the file covers a browser tab that has loaded no workspace (the `carried === null` return of `load.ts` presumeCarried): `grep -n "loaded()" ` over the file shows only `toBe(true)` assertions (lines 159, 174), and `.every` over no calls is true; failure scenario: a later change makes a fresh tab read or draw some workspace's arrangement before the answer, and G29 stays green; verdict: none (case 27 met).
- `.scratch/migration/agents/reviews/O55-report.md`, DONE / NOT DONE row "Verify 6": "read; no departure found (judgment)"; what is wrong: the two comments under Standards below say something the code does not do; verdict: none.

## 3. Standards

- `src/lib/data/shapes/boards/takes.ts:6-8`: "The boards, the page's choice of the board a project opens on, the New project write and the audit's finding of a project no board takes all read a board through this module"; what is wrong: the New project write does not read this module; the importers of `shapes/boards/takes` are `audit/projects.ts`, `audit/rules.ts`, `state/boards/board/items.ts`, `presets.ts` and `selectors.svelte.ts` (grep), and `server/edit/writes/manifest.ts` imports only `roles.ts`; the spec's comment rule ("a comment says what the code does and why") is broken; failure scenario: a reader changing how a board takes projects expects New project to follow and does not check it; verdict: none.
- `src/lib/views/shared/forms/NewIdeaForm.svelte:8-10`: "A board gives its `role:` keys too, and the write names the user ... in the field of the first of them that has one, so the new project is on the board it was made on"; what is wrong: on Archive the written project is at `nascent` and lands on Projects (the builder's own case 24 "no tier" run shows `"boards":["projects"]` for the Archive write), so the comment states a property that does not hold on one shipped board; failure scenario: a reader trusts the comment and does not see that Archive's New project leaves the board; verdict: none.

## 4. Behaviour

- `src/lib/views/boards/projects/Projects.svelte:382-384` with `config/defaults/layout.yml` archive row: `tier={preset.rule.tiers?.at(0)} roles={preset.rule.roles ?? []}`; what is wrong: New project on the Archive tab writes `tier: research`, `lead: [self]`, `stage: nascent`, and Archive takes only `terminal` stages, so the new project does not appear on the tab where it was made; the builder's report states this as NOT DONE; failure scenario: the user presses New project on Archive, gets the success line, and finds no card on Archive; it is on Projects; verdict: none (an impossible clause of decision 12, see Declined to judge).
- `src/lib/state/client/selectors.svelte.ts:743` with `src/lib/server/content/audit/projects.ts:354-356`: `return personOfNewProjects(roles, keys ?? roles.map((role) => role.key), self);` and `if (project.lead.length === 0) { add({ ... 'audit.msg_no_lead' ... }) }`; what is wrong: Personal and Software pass `roles={[]}`, so `keys` is `[]`, no person is written (the case 24 software run prints a manifest with no `lead:`), and the audit raises "names no lead" on that new project at once; the cases give personal and software projects a lead (cases 5, 6, 7), and Lit Watch's New project (keys undefined) does name the user as lead; the builder's report does not state it; failure scenario: every project made with New project on Personal or Software shows up in the Audit view with a no-lead finding the moment it is written; verdict: none (decision 12 as written covers only boards with `role:`).
- `src/lib/views/shared/forms/NewIdeaForm.svelte:10-11` and `selectors.svelte.ts:743`: "Lit Watch gives none, and the user is named in the field of the first row of `roles:` with one, its lead"; what is wrong: Lit Watch's New project now writes `lead: [<self>]` into the manifest, a user-visible change the report's "Host- and user-visible changes" section does not list; failure scenario: the orchestrator's look and the user are not told that Lit Watch projects now name the user as lead and land on Projects; verdict: none.
- `src/lib/state/workbench/layout/saved/load.ts:136-139` with `storage.ts` write: `if (left === identity) { storage.select(identity); return !set.fresh(); }` and `write: (next, call = '') => { if (selected !== null && !presumed) writeFor(...) }`; what is wrong: a change made while the identity is presumed is not written, and the answer confirming the same workspace does not write it either; it is saved only with the next change; the builder's report states this ("a change made before the answer is saved with the next change after it"); failure scenario: the user moves a tab in the first moment after a reload, makes no further change and closes the tab; the move is lost, since `pageState.flush()` on pagehide sends only slots a write reached; verdict: none (the brief asks that nothing be saved before the answer; writing the held pages once the answer confirms the presumed workspace would keep both).

## Declined to judge

- Decision 11 against decision 12 on Archive: whether New project stays on Archive writing a project that lands on Projects (as built), is withdrawn from boards whose `stages:` block takes no `new_idea` stage, or writes something else, is a ruling for the orchestrator or Axel, since the brief's two decisions cannot both hold there.
- Whether New project on Personal and Software should name the user as lead (as Lit Watch does) to avoid the no-lead finding of Behaviour 2: a change to decision 12's text, for the orchestrator.
- Whether the cross-link heading for a single idea should read "ideas" as case 25 writes it, instead of the singular key `xlink_idea` that the base already used: a wording call for the orchestrator.
- The drawn views (sections and their colours, the Mine only chip, the Role facet chips, the Lead badge, the NoFundingCard cell stretch in place of the removed HELD styling entry, the reload's first frame): not covered by any test and not checkable without a running page; settled by the landing look on TEST.
- The `PEOPLE` map in `src/lib/data/shapes/boards/takes.ts` reads a project's role only from `lead`, `collaborators` and `supervisors`, so a `roles:` row naming another field would read nothing on a project with no finding; no hub can override `roles:` before O60 (brief item 4), so it has no effect in this step; for O60's brief.

Reviewer usage: aa96d29100a7ec667, claude-opus-5-5, 234310 tokens, 102 tool uses, 15 min 11 s.

## Repair round 1, refuted

```
All commands ran from /Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O55.

$ npm run test:quick -- --base 00bebb58
ok      prettier (0.6 s): All matched files use Prettier code style!
ok      ASCII gate (0.6 s)
ok      svelte-kit sync (2.1 s)
ok      eslint (2.1 s)
ok      svelte-check (7.8 s): 1792818043377 COMPLETED 538 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest checks (93.8 s): Duration  85.97s (...)
ok      vitest (99.1 s): Duration  91.88s (...)
ok      vitest slow (151.7 s): Duration  144.38s (...)
test:quick: 154.0 s; every command passed
exit 0
(tests/state/sessions/source/source-unserved.test.ts was not red in this run, so it was not rerun alone.)

$ git diff 00bebb58 --stat | tail -1
 159 files changed, 6717 insertions(+), 3503 deletions(-)
$ LC_ALL=C perl -ne '<the spec.md ASCII gate>' $(the 160 paths of git status --short, minus local.yml: the 159 changed files, the report and the round brief)
(nothing printed)
exit 0

$ grep -rnE "<the brief's verify 3 pattern>" src config tests docs utils --exclude=local.yml | wc -l
390
exit 0
(the per-file hit counts are identical to the builder's $S/r1-grep3.txt: a diff of `sort | uniq -c` over the file names printed nothing)

$ sh utils/unused-exports.sh > ue.txt; diff ../O55-base/unused-exports.txt ue.txt
126c126  (bucketOf removed from src/lib/state/boards/board/index.ts)
284c284  (RollupBucket removed)
(343 lines each; no line added)

Commands the round's report quotes, rerun:
$ npx vitest run tests/state/boards/board/ tests/state/workbench/layout/saved/layout-workspaces.test.ts
 Test Files  4 passed (4)
      Tests  109 passed (109)          (report: 109; agrees)
$ npx vitest run tests/state/workbench/layout
 Test Files  5 passed (5)
      Tests  61 passed (61)            (report: 61; agrees)
$ npx vitest run tests/state/boards/board/
 Test Files  3 passed (3)
      Tests  85 passed (85)            (report: 85; agrees)
$ npx vitest run tests/state/workbench/layout/saved/layout-workspaces.test.ts tests/state/boards/board/board-rules.test.ts --reporter=verbose
 <check mark> ... New project on a board > is offered on the boards that take the project it writes, 'with self named'
 <check mark> ... New project on a board > is offered on the boards that take the project it writes, 'with no self'
 <check mark> ... names the user, for a board naming 'no role: key, every row in order'   (and the 4 other rows)
 <check mark> ... names the user on 'personal' | 'software' | 'supervision' from the shipped board row
 <check mark> ... the workspace answer > saves a change made before it came once it names the workspace the reload drew
 <check mark> ... the workspace answer > saves nothing of the workspace the reload drew when it names another
 <check mark> ... the workspace answer > reads no arrangement and sends nothing before it came in a tab that loaded none
      Tests  105 passed (105)
$ npx vitest run --config $S/cases.config.mjs --silent=false --reporter=verbose after
case22: quickadd=["qp","qs"]
case23: venue attention=[{"kind":"venue","id":"v1","count":1,"label":"V1"}]
case23 vp alone: [...count 1...]
case23 vr alone: []
case24 supervision: offered=true person={"role_field":"supervisors","self":"axel-faes"} {...supervisors:\n  - axel-faes...,"boards":["supervision"]}
case24 software: offered=true person={"role_field":"lead","self":"axel-faes"} {...tier: software...lead:\n  - axel-faes...line: New project...,"boards":["software"]}
case24 personal: offered=true person={"role_field":"lead",...} {...tier: personal...lead:\n  - axel-faes...,"boards":["personal"]}
case24 projects: offered=true person={"role_field":"lead",...} {...,"boards":["projects"]}
case24 no tier: {...tier: research...lead:\n  - axel-faes...,"boards":["projects"]}
case25: [["in-flight",["xb"]],["done",["xp","xr"]],["ideas",["xn"]]]
      Tests  1 passed (1)
(the case lines are byte-identical to $S/r1-case24.txt: diff printed nothing)
$ npx vitest run <the 7 whole-tree checks of r1-tree-checks.log> --testTimeout 0 --hookTimeout 0
 FAIL tests/checks/tree/duplication.test.ts   (Data.svelte:64 and Venues.svelte:76)
 FAIL tests/checks/source/comment-width.test.ts   (writes.svelte.ts:640, card-tree.ts:4, SaveToLiterature.svelte:89, +page.server.ts:18, reference-hub.ts:4, app-theme-start.test.ts:309, comment-rules.test.ts:166)
 FAIL tests/checks/source/history.test.ts   (src/desktop/app.ts:161)
 Test Files  3 failed | 4 passed (7)
      Tests  3 failed | 68 passed (71)
(same three, same lines as the report; no line in a file the step changes)
$ hub read, from ~/workspace/research-hub: grep -rL "^lead:" --include=project.yml <the 7 scan folders> | wc -l
20   (17 personal, 3 software by their tier: lines)
$ grep -q "^lead:" over the .oculus/project.yml of cathedra, game-engine, ordo, oculus, scotoma, officium, youtube-downloader
7 with no lead, all tier: personal
(20 + 7 = 27, 24 personal and 3 software, as the report's Hub rewrite lists; 114 project.yml files under projects and side-projects, 94 with a lead line, as reported)

Runs made on the unchanged tree, read from their saved output and not rebuilt:
$S/r1-g124-first.txt: "TypeError: offersNewProject is not a function" (2 rows), "keys is not iterable" (3 rows), "Tests  5 failed | 76 passed (81)"
$S/r1-g29-first.txt: "x saves a change made before it came once it names the workspace the reload drew", "AssertionError: expected '{"version":7,...' to contain 'Before the answer'", "Tests  1 failed | 23 passed (24)"
$S/r1-g29-base.txt: "<check mark> ... reads no arrangement and sends nothing before it came in a tab that loaded none", "Tests  2 failed | 22 passed (24)"
```

### Verdicts

Items of the brief's "What to build", in its numbering:
- 1: holds. `config/catalogs/vocab.yml:200-203` holds the three tiers with `label` only. `research_audit: { skip_tiers: [personal] }` is at `:207`. Grep 3 finds no code reading a removed flag or name (390 hits, the same files and counts the builder judged). `idea_status_software` writes "New project." (case 24 rerun). Every board offers New project (decision 11) as amended by Z975 (1): `offersNewProject` in `new-project.ts`, read at `Projects.svelte:156`.
- 2: holds. `roles:` is at `vocab.yml:211-215`. `supervisors` is in the schema (`manifest-schema.yml:58`) and placed last by `teamOf`. The person New project names now covers a board naming no `role:` (`newProjectPerson` with `keys` null; the G124 rows pass).
- 3: holds. The six boards are at `config/defaults/layout.yml:228-290` with the keys of the brief. `boardTakes` applies every key (`takes.ts`). Z975 settles decisions 11 and 12: Archive draws no New project (G124 row "is offered on the boards that take the project it writes", with and without `self`), and every other board's write is on its own board (case 24 rerun: supervision, software, personal, projects).
- 4: violated, in one clause: "nothing else is named `category` on a project". `Project.category`, the scan's segment computation and the G32 rows are gone (`git diff 00bebb58 -- src/lib/data/sources/manifests.ts` removes `const category = segments.length > 1 ? segments[0] : undefined`). Two help texts the step edited still call the first folder a project's category. See finding 1. The rows `vocab.yml:224-230`, `categoryOf`, the rail and the Archival band hold.
- 5: holds. `cards:` is described at `config/options/layout.yml:239-240`. The team line, the Lead badge, the Role facet, Mine only and the templates are as the first refutation found. No line of the round touches them.
- 6: holds. The Idea lane is at `vocab.yml:181` with `IDEA` at `focus.ts:43`. The keys `xlink_in_flight` and `xlink_done` are at `config/text/views/boards/project.yml:127-130`, and the type `'in-flight' | 'ideas' | 'done'` is at `collection.ts:729`.
- 7: holds. `msg_no_lead`, `msg_no_board` and `msg_terminal_lane_chip` are at `config/text/views/system/audit.yml:59-61`; `categories_block`, `categories_row` and `categories_colour` are at `config/text/findings.yml:164-166`. Grep 3 finds no hit for any removed check.
- 8: holds. The G29 rows pass (24 of 24). The round adds the write at the confirming answer (`storage.ts` `select`) and the row for an empty tab memory. See findings 3 and 4 for the held pages.

Cases of the brief's "Cases":
- 1 to 16: met, by the G124 rows of `tests/state/boards/board/board-rules.test.ts` (85 of 85 in my rerun of the folder), and the G32 rows for 10 and 11 (in the test:quick run).
- 17, 18, 19: met, by the G116 rows of `tests/data/sources/config/boards.test.ts` (in the test:quick run; 26 rows per the first refutation).
- 20, 21, 21a: met, by the G124 rows "the roles of a collection".
- 22, 23: met, by the case-run program rerun (identical output).
- 24: met, by the rerun. Supervision writes `supervisors: [axel-faes]` and is on supervision. Software writes `lead: [axel-faes]` and "New project." and is on software. A write with no tier gives `research`.
- 25: met, by the rerun. The singular heading for one idea stays by the round brief's "Not sent".
- 26, 28 to 32: met, by the G124 rows.
- 27: met for the store: the G29 row "draws the arrangement of the workspace the browser tab last loaded in its first draw" fails on the base copy ($S/r1-g29-base.txt) and passes now. Not verifiable here for the drawn first frame, which the landing look on TEST settles.

### Findings

1. **`config/defaults/sources.yml:9` and `config/options/sources.yml:15`.**
   - Quoted: "When a project lies deeper than one level, the first folder under the `dir` is its category." (`:15` has the same sentence without backticks.)
   - What is wrong: the step removes the scan's category (`manifests.ts` diff: `- const category = segments.length > 1 ? segments[0] : undefined;`, `- category?: string;` in the model) and decision 14 says the word category then means only a row of `categories:`. Both files are on the write list and the step edited them, yet each still names the filing folder a project's category. The step made the sentence false.
   - Heading: standards.
   - Failure scenario: a hub author reads the scan help in the settings editor, files projects under `projects/<folder>/`, and expects the folder to show as the category. The boards file the project under a row of `categories:` instead.
   - Verdict: item 4 violated (a one-sentence cut in each file at landing).
2. **`/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/o55/r1-assemble.py`** (06:56, the round), with `presets_edit.py` (04:50) and `rewrap.py` (05:28) from the main build.
   - Quoted: `R = '.scratch/migration/agents/reviews/O55-report.md' ... def rep(a, b, count=1): ... s = s.replace(a, b)`; `p='src/lib/state/boards/board/presets.ts' ... s=s.replace(a,b,1)`; `lines[a-1:b] = [prefix + n for n in new]; open(p, 'w').write(...)`.
   - What is wrong: the brief says "No script is written for this step, by the builder ... other than a script the step builds under 'What to build'. Any other script needs the user's approval". These three Python programs rewrite the report, `presets.ts` and comment paragraphs. None is a case-run program, and the report names none of them.
   - Heading: spec (a script the brief does not build).
   - Failure scenario: the orchestrator reads the report as hand edits under the brief, and does not learn that edits to source and report were made by unapproved scripts.
   - Verdict: none.
3. **`src/lib/state/workbench/layout/saved/storage.ts:239-241` with `load.ts` `takeSaved`/`adopt`.**
   - Quoted:
     ```
     if (presumed) held = { next, call };
     ...
     const confirmed = presumed && selected === identity ? held : null;
     ...
     if (confirmed !== null) writeFor(identity, confirmed.next, confirmed.call);
     ```
   - What is wrong: `held` is a snapshot of the pages at the last local change. `follow(takeSaved)` keeps running while presumed (`follow` filters on `identity === selected`, which is the presumed identity). When another page saves the same workspace in that window, `adopt` replaces the store's pages and writes nothing back, so `held` goes stale. At the confirming answer, `select` writes the stale snapshot from the newly adopted envelope's stamp. The page-state rule "another page's save heard while this page is idle is taken as it is" (`page-state.svelte.ts:12`) treats the page as idle, so the save is admitted.
   - Heading: behaviour.
   - Failure scenario: window Y and reloaded tab X are both on workspace A. In the presumed window, the user moves a tab in X and Y saves a change. X adopts Y's arrangement on screen; at the answer, X writes its pre-adopt pages. Y's change is lost on the server, and X's screen no longer matches what the server holds.
   - Found by reading, not by a run; the window is the time to the workspace answer.
   - Verdict: none. Item 8 and round item 3 hold for the case the brief names. Writing `access.held()`, or dropping `held` on adopt, would close it.
4. **`src/lib/state/workbench/layout/saved/storage.ts:222-224`.**
   - Quoted: `carried: () => { const held = memory.read(WORKSPACE_KEY); return held === null || held === '' ? null : held; },`
   - What is wrong: the round adds an outer `let held` in the same factory (`:195`), so `carried`'s local `held` now shadows it. One name means two things within 30 lines.
   - Heading: standards (code a reader can maintain).
   - Failure scenario: a later edit inside `carried` that means the held pages reads the identity string instead, and type-checks only by chance.
   - Verdict: none.
5. **`src/lib/state/workbench/layout/saved/storage.ts:9-10`** (head comment).
   - Quoted: "An answer naming the presumed identity writes the pages a change made before it once, and an answer naming another identity replaces the arrangement and writes nothing of the presumed one."
   - What is wrong: "writes the pages a change made before it once" does not parse as a sentence a reader can follow ("writes, once, the pages of a change made before it").
   - Heading: standards (spec "Prose: plain").
   - Failure scenario: a reader cannot tell from the head comment whether the change is written once or the answer comes once.
   - Verdict: none.
6. **`src/lib/server/edit/writes/manifest.ts:603`** (86 columns) and **`src/lib/state/boards/board/new-project.ts:6`** (91 columns).
   - Quoted: " * made on. A bad id, an id a project already holds, a tier that is no word of `tiers`" followed by " * or has no words, ..."; and "// no `role:`. A board offers New project only when the project that write makes is one the" followed by "// board's rule takes ...".
   - What is wrong: the round edited these paragraphs and left a line short inside a sentence where the next word fits by column 100. The spec says "A comment edited by the step is rewrapped as a whole paragraph at 100 columns, so no line inside a sentence ends short". The awk over the edited comment blocks prints `manifest.ts:603: 86 next=or` and `new-project.ts:6: 91 next=board's`.
   - Heading: standards.
   - Failure scenario: the next reader sees a ragged paragraph and takes it for a hand-wrapped break.
   - Verdict: none.
7. **The report, DONE / NOT DONE row "No history words in new comments and titles".**
   - Quoted: "read; `tests/checks/source/history.test.ts` names only `src/desktop/app.ts:161`".
   - What is wrong: the spec asks that "the report quotes the grep with each hit judged". The round's added titles and comments hold the listed word "before" in 6 places, by `diff` of the round's files piped through `grep -i -E "\bbefore\b|..."`:
     - `layout-workspaces.test.ts`: the titles "saves a change made before it came ..." and "... sends nothing before it came in a tab that loaded none";
     - `storage.ts:9-11`;
     - `load.ts:38`.
     Each is temporal within the run, not history, but no grep is quoted.
   - Heading: proof.
   - Failure scenario: the orchestrator cannot see that the titles were checked against the history rule.
   - Verdict: none.
8. **The report, "Host- and user-visible changes", the entry "New project on a board", with judgment call 12.**
   - Quoted: "a board draws `+ new idea` only when its rule takes the project the write makes (its first tier, the user in the field below, the first stage carrying `new_idea`, no chip, no form)".
   - What is wrong: the synthetic project in `offersNewProject` has no `root` and no other field. So a workspace board naming `hub:` (`takes.ts`: `if (rule.hub !== null && project.root !== rule.hub) return false`), or `match:` on any field New project does not set, now draws no New project. Before the change every board drew it. The change is stated only as a judgment call, with no before and after, in the visible-changes section.
   - My judgment of the call: it is a faithful reading of Z975 (1)'s list, since the hub and the domain are chosen in the form after the press, and it keeps the button from making a project that leaves the board. Keeping New project on such boards would need the form's hub fixed to the board's, which Z975 does not ask for.
   - Heading: behaviour.
   - Failure scenario: a user with a workspace board `hub: <second hub>` finds its New project gone after the landing and is not told by the report the look reads against.
   - Verdict: none.

The builder's second judgment call holds. The held pages are written under the call name of the last operation, `openPage` in the G29 row, which asserts `['openPage']`, one write. Earlier operations in the presumed window get no record line of their own, and since the record of layout writes names the operation that made the pages written, that is consistent.

Round items: 1 holds, 2 holds, 3 holds (finding 3 is a race outside the asked case), 4 holds (the row keeps the base row's assertions `envelope` not called, `sent()` `[]` and `loaded()` false, and passes on the base copy per $S/r1-g29-base.txt), and 5 holds (27 manifests reproduced). No finding was closed by removing a check, and no round change reaches beyond its item: the round's paths are the 16 listed by `cmp` against the snapshot, all on New project, the reload, their tests, `docs/HELP.md` and the regenerated diagrams.

### Declined to judge

- Whether finding 3's lost update happens in a real browser within the time to the workspace answer. It would be settled by a G29 row with a second page saving A between `loadLayout` and the confirming answer; I write no file under this review's rules.
- The drawn first frame of a reload, the absent `+ new idea` on Archive, the Mine only chip, the Role facet and the sections. They need a running page and are settled by the landing look on TEST.
- `tests/state/sessions/source/source-unserved.test.ts`: it was not red in my test:quick run, so I have no red of my own to report on it.

Reviewer usage: ab4a4e18a17c03122, claude-opus-5-5, 227015 tokens, 61 tool uses, 11 min 16 s.

## Closed

The findings of the review over round 1, each with its disposition at landing (2026-10-24):

1. The category sentence in `config/defaults/sources.yml` and `config/options/sources.yml`: fixed at landing, the sentence cut from both, and from the hub's `.oculus/config.yml` in the hub rewrite.
2. The builder's three edit programs: raised as open item 308; Axel ruled (a), the programs accepted after the fact and O55 landed as built.
3. The held change going stale when another page saves the presumed workspace: fixed at landing in `follow` of `layout/saved/storage.ts`, which drops the held change and runs it again on the arrangement that save made; the G29 row 'keeps the change of another page saved to the workspace the reload drew, and its own' failed on the unchanged code and passes after.
4. The shadowing name `held` in `carried`: fixed at landing, renamed `kept`.
5. The head comment of `storage.ts`: fixed at landing, "writes, once, the pages of a change made before it".
6. The short lines at `manifest.ts:603` and `new-project.ts:6`: fixed at landing, both paragraphs rewrapped at 100 columns.
7. The history-word grep: stated in the landing report with each hit judged.
8. New project on a board naming `hub:` or `match:`: stated in the landing report with its before and after.
