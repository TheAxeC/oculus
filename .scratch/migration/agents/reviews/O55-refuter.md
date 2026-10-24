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
