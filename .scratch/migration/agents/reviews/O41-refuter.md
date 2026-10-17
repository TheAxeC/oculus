# Step O41 refuter report (on /Users/axelfaes/workspace/research-hub/.agents/worktrees/migration-O41, base cc0a63390)

A page this report cites (the rules file, a standard, a skill's text) is named with its section, never with a line number, since a page's lines move and a section's name does not. A finding in code keeps its `file:line`.

The report is written in the rules file's character set. A character outside it in a quoted line is written by its name in angle brackets, such as `<tab>` or `<em dash>`.

## Verification (rerun by the reviewer)

All from `tools/oculus` in the worktree unless named otherwise.

```
md5 -q docs/diagrams/* | md5            -> f08ff813bcf93a349997f14b891232be
npm run diagrams                        -> wrote the 14 files it lists, 7.3 s
md5 -q docs/diagrams/* | md5            -> f08ff813bcf93a349997f14b891232be   (no diagram changed)

npm run test:quick
ok      prettier (1.3 s): All matched files use Prettier code style!
ok      ASCII gate (1.4 s)
ok      svelte-kit sync (3.2 s)
ok      eslint (2.3 s)
ok      svelte-check (8.4 s): 1792271172616 COMPLETED 514 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest (36.0 s): Duration  28.46s (transform 43.07s, setup 0ms, import 68.17s, tests 31.37s, environment 1.13s)
test:quick: 39.4 s (limit 45.0 s); every command passed
test:quick: not covered: tests outside the selection, tests/checks, slow tests,
            build, lint of unchanged files; npm run test:landing runs them

the spec's perl ASCII gate over the 68 files `git status --short` names (folders expanded, the report included)
-> printed nothing; perl exit 0

wc -l over the touched .ts and .svelte files: nothing over 880 or 520; the largest components
Graph.svelte 519 (519 at the base), ProjectCard.svelte 518, Repositories.svelte 517, Source.svelte 517,
Collection.svelte 506, repo/Repo.svelte 471; largest source selectors.svelte.ts 734; largest test
tests/data/sources/manifests/manifests.test.ts 748

(base copy) npx vitest run tests/data/sources/manifests.test.ts tests/state/sources/clone.test.ts
 Test Files  2 passed (2)
      Tests  66 passed (66)

npx vitest run tests/data/sources/manifests/manifests.test.ts tests/data/sources/manifests/clones.test.ts tests/state/sources/clone.test.ts
 Test Files  3 passed (3)
      Tests  74 passed (74)
(verbose: the seven new rows of 'the clones of a project', the row reads 'two scan folders, one a linked worktr...'
 and the five changed G80 rows each print a pass)

sh utils/unused-exports.sh, diffed with .agents/worktrees/O41-base/unused-exports.txt
157c157
< src/lib/state/sessions/folds.ts: pruneTree, sessionCount, hiddenCounts, terminalPlaces, LIST_FILTER, needsInput, matchesSearch, keptByFilter
---
> src/lib/state/sessions/folds.ts: pruneTree, sessionCount, hiddenCounts, terminalPlaces, LIST_FILTER, matchesSearch, keptByFilter
(no line added)

cases 1 to 10, the builder's harness in the scratch folder rail/:
OCULUS_ROOT=<base>/tools/oculus node --no-warnings --import ./register.mjs before.ts   -> exit 0, identical to before.out
OCULUS_ROOT=<worktree>/tools/oculus node --no-warnings --import ./register.mjs after.ts -> exit 0, identical to after.out:
case 1: number="25" glyph="" tone="green" tip="Projects, key 2 (Projects 20, Coauthor 2, Personal 3)"
case 2: number="10" glyph="" tone="green" tip="Academic Life, key 6 (Funding 3, Education & Service 1, Applications 2, Joint work 4)"
case 3: number="4" glyph="" tone="red" tip="Incoming, key 3 (Inbox 4)"
case 4: number="" glyph="bang" tone="red" tip="Incoming, key 3 (LinkedIn post overdue)"
case 5: number="15" glyph="" tone=null tip="Explorer, key 5 (Repositories 12, Problems 3)"
case 5, both 0: number=null glyph=null tone=null tip="Explorer, key 5"
case 6 counts: findingsCount=9 processes.count=4
case 6: number="14" glyph="" tone=null tip="System (Findings 9, Audit 5)"
case 7 count: sessionInputCount=1
case 7: number="1" glyph="" tone=null tip="Sessions, key 4 (Sessions 1)"
case 8: number="20" glyph="" tone="green" tip="Projects, key 2 (Projects 20)"
case 9: number=null glyph=null tone=null tip="Explorer, key 5"
case 10 green+amber: number="3" glyph="" tone="amber" tip="Academic Life, key 6 (Education & Service 1, Tasks 2)"
case 10 with red: number="4" glyph="" tone="red" tip="Incoming, key 3 (Education & Service 1, Tasks 2, Inbox 1)"
case 10 no tone: number="2" glyph="" tone=null tip="Explorer, key 5 (Repositories 1, Problems 1)"

the builder's tree-check command (keys, comment-width, history, boundaries, size, duplication, cycles, order, diagrams):
 Test Files  2 failed | 7 passed (9)
      Tests  3 failed | 117 passed (120)
 the three: diagrams.test.ts 'are what the source gives now, each file byte for byte' and 'are named stale, every one
 at once, when an import and a publish are added', history.test.ts 'names no package id, date or session in any
 comment'; rerun of those two files alone: each "Error: Test timed out in 5000ms." (Tests 3 failed | 47 passed (50))

grep -rn "git\.busy" src  (base)      -> CommitBox.svelte:90,198,215, ChangesRepo.svelte:96, changes/FolderRow.svelte:85,96,106,
                                         GraphActions.svelte:57,67,76,86, RepoList.svelte:202,213,235, Repo.svelte:383
grep -rn "git\.busy" src  (worktree)  -> src/lib/state/sources/repositories/repositories.svelte.ts:469 only
grep -rn "firstBadge\|submit\.busy\|state\.busy\b" src tests DESIGN.md HELP.md docs/*.md -> nothing
ls docs/adr -> No such file or directory
```

The two timed-out tree checks run files the step does not change; under the rules file's "Verify before you report" they are not counted. The diagrams' staleness is settled instead by the unchanged hash after `npm run diagrams`, and the history rule by the reviewer's grep of every added line for the rules file's history words and for package ids and dates, which found only spatial or present-tense uses ("before its label", "drawn still", "still waiting").

## Verdicts

Items of the brief's "What to build", in its numbering:

- 1: holds. `repositories.svelte.ts` keeps `acting: Record<root, action>`, `busy` reads `Object.hasOwn`, `running(roots)` and `busyWords(root)` answer the words of Decision 1 through `RUNNING_WORDS`, the refused send returns before `acting` is touched; `repositoryRoots` (`selectors.svelte.ts:651`) gives the roots of one `GitState.top` group.
- 2: holds. `repo/Repo.svelte:252-258` draws `Progress percent={null}` labelled with the words; `repo/RepoMessage.svelte:29` says `busyWords`; `RepoList.svelte:173,278-282` the row's line and titles; `CommitBox.svelte` the three lines only; `changes/FolderRow.svelte` and `GraphActions.svelte` say `busyWords`; no line for an action outside Decision 1. Widened to `ChangesRepo.svelte` and `ChangesRepository.svelte`, which item 1's "every other place that shows the root" covers.
- 3: holds; see Behaviour 2 on the `inert` Publish button.
- 4: holds. `clone.svelte.ts` `sent()` posts the running notice with `progress: { percent: null, cancel: null }` and removes it in `finally`; `CardAction.turning` reaches the row's `ToolButton` and the More menu's item (`menu-items.ts`, `MenuList.svelte:82`).
- 5: holds. `Results.svelte:133-137`, `Literature.svelte:205-209`; `Search.svelte` unchanged.
- 6: holds. `submit-job.svelte.ts` `running` is `submit_planning` from the press to the question, empty while the question is open, `submit_running` from the yes.
- 7: holds. `usage-refresh.svelte.ts` counts presses per account in and out in `finally`; `Usage.svelte:199`.
- 8: holds. `UpdateTray.svelte:160-161`, `ScheduleList.svelte` `starting` per row.
- 9: holds in code; its description is false in three places, Standards 1.
- 10: holds. `Projects.svelte:9-13`, `rail-part.ts`, `Inbox.svelte`, `Repositories.svelte`, `Problems.svelte`, `Audit.svelte`, `Findings.svelte`, `SessionList.svelte`; Leads, Processes, Calendar, Hpc, LinkedIn, Archive, Software and apps register no `railPart`. See Standards 5 on the cell labels.
- 11: partial. Findings and the Session list hold; the Processes count leaves out the app-host rows the view lists, Spec 1.
- 12: holds. `rail.ts` `railBadge`, rerun above.
- 13: holds. `RailPages.svelte` `badgeStyle` and the `.badge` rule, the token pair of `TabFace.svelte:86`; the three comments rewritten.
- 14: holds. `origin.ts` `gitFolderOf` (realpath of the git folder, `main` when it is `<dir>/.git`), file reads only.
- 15: holds. `repositoryStandIns` and `listedClones`.
- 16: holds for `settle` (changed, case 30); the search route is under "Declined to judge".
- 17: partial. The named sentences are written; the Clone motion has no HELP sentence (Standards 2) and the new DESIGN paragraph carries a false clause (Standards 1).

Cases of the brief's "Cases":

- 1: met, rerun above: 25, green, "Projects, key 2 (Projects 20, Coauthor 2, Personal 3)". The harness writes each view's part by hand (after.ts:49-54), so the board-cell tones (`boardPart` from `boardCells`) are read, not run: `rail-badges.svelte.ts` `boardPart` returns the cell's `color`, which `boardCells` maps through `toneOf`/`splitTone`.
- 2: met, rerun: 10, green, four parts in tab order.
- 3: met, rerun: 4, red, "Incoming, key 3 (Inbox 4)".
- 4: met, rerun: the `bang` mark, red, the mark's own words.
- 5: met, rerun: 15, no tone; both 0: no badge.
- 6: met, rerun: 14, no tone; `processes.count=4` from the store over a fake payload.
- 7: met, rerun: 1.
- 8: met by reading `railPageViews` (`src/lib/state/workbench/navigation/pages.ts:228`, `[...new Set(...)]`); the harness run hands one entry and proves nothing about the split tab (Proof 2).
- 9: met, rerun: no badge.
- 10: met, rerun: amber; red; no tone.
- 11: met by reading (`Repo.svelte:252-258`, `RepoList.svelte:278-282`, `RUNNING_WORDS.commit`, `CommitBox.svelte` titles; `Progress.svelte` reduce-motion rule); the look on landing settles what is drawn.
- 12: met by reading (`RepoItems.svelte` `syncing`, `<Glyph name="sync" turning />`, title `syncing.words`); the look settles it.
- 13: met by reading (`+page.svelte:241` `repositories.running(repositoryRoots(root))`); the look settles it.
- 14: met by reading (`RepoItems.svelte:236-247`); the look settles it.
- 15: met by reading (`stage` has no `RUNNING_WORDS` entry: `running` null, `busyWords` "Working").
- 16: met by reading (`acting` keyed by root; `send` returns on `busy(root)` before any write).
- 17: met by reading; the look settles it.
- 18: met by reading (`submit-job.svelte.ts` `press` and `run`, `BarActions.svelte` `turning`/`title`); the look settles it.
- 19: met by reading (`refreshing(label)` counts only presses); the look settles it.
- 20: met by reading; the look settles it.
- 21: met by reading and by the G80 rows; the dismissed-notice part is read only (`notices.remove` of a cleared id filters nothing); the look settles it.
- 22: met by reading (the action lives in the page's store, not the view); the look settles it.
- 23 to 27: met after (rerun above); the failure on the unchanged tree is the builder's quote and is not reproduced here ("Declined to judge").
- 28, 29: met (pass after; the builder quotes a pass before).
- 30: met after (row reads 'two scan folders, one a linked worktr...'); before as for 23.
- 31: met after; before as for 23.

Points the orchestrator asked about:

- (a) Processes: Spec 1.
- (b) HELP.md:496: Standards 2.
- (c) guarded.md: G80's titles are unchanged (`tests/state/sources/clone.test.ts`, describes of 5, 2 and 5 titles as the entry counts them); the split moved rows named by G32 and by G13, Standards 4.
- (d) Files outside "Paths this step writes": each is needed by an item. `status.ts` and `+page.svelte` (item 3, the shell reads the running action through `StatusGit`); `menu-items.ts` and `MenuList.svelte` (item 4, the More menu's Clone entry turns); `ChangesRepo.svelte` and `ChangesRepository.svelte` (item 1's "every other place that shows the root"; the brief's own grep premise missed the file, Spec 2); `processes.svelte.ts` (item 11's count); `Graph.svelte`, `Tags.svelte`, `Branches.svelte`, `Stashes.svelte`, `section.ts` (head comments naming the moved `Repo.svelte`); `Repositories.svelte` is in the list (registration) and also takes the import path; `rail-part.ts` (item 10, `Collection.svelte` at 506 with it, 524 without by the builder's count, not remeasured); `Source.svelte` (item 6's rename of `submit.busy`); the `Repo.svelte` move into `repo/` (517 lines at the base and `repositories/` at 10 items, `ls` above); the `docs/diagrams/layer-*` and `layers` pairs (written by `npm run diagrams`, unchanged hash on rerun).
- (e) FolderRow's path: Spec 2.
- (f) `sessionInputCount` and `row.hidden`: matches the list's archived state save for the list's per-instance override, Behaviour 3.
- (g) Hover words: met. `t('views.badge_title', label, count)` is `'{0} {1}'` (`config/text/app.yml:319`), joined by the new `ui.page_badge_separator: ', '` inside `ui.page_badge_tip`; the rerun prints "Projects, key 2 (Projects 20, Coauthor 2, Personal 3)", the brief's words.

## 1. Spec

- `src/lib/state/system/machine/processes/processes.svelte.ts:65-72`: "if ((read()?.rows.length ?? 0) === 0) return 0; ... sum + (group.head.pid > 0 ? 1 : 0) + group.rows.length, matched.length"; what is wrong: the count is the rows of the processes table only; the brief's item 11 says "Processes counts the process rows its view lists, each process one row", and the view lists the app hosts as rows above the table (`Processes.svelte:23-25` head comment: "Above them are the programs the apps run (their hosts)", drawn by `AppHosts.svelte` at `Processes.svelte:63-75`), as HELP.md's Processes bullet says ("Lists terminals, processes matching `processes.patterns`, and app hosts"); the plan's Step 0 calls the count "the programs still running". The pid-0 pane exclusion matches what `ProcessTable.svelte:88` draws and is right. The builder states the app-host exclusion as a judgment call ("they come from another channel"), a reason the brief does not give; the brief's "nothing before the channel's first read" can be read either way. Failure scenario: two apps run their hosts and no terminal or matched process exists: the view lists two running programs with Stop and the Processes tab draws no count; with one terminal process it draws 1 beside three listed programs. Verdict: item 11 partial; the orchestrator rules which reading stands.
- Brief "What is on the tree" (the `git.busy` premise) and "Paths this step writes" (`tools/oculus/src/lib/views/shared/changes/FolderRow.svelte`): what is wrong: two premises do not reproduce. `git show cc0a63390:tools/oculus/src/lib/views/shared/changes/FolderRow.svelte` answers "fatal: path ... does not exist in 'cc0a63390'"; the file is `src/lib/views/sources/repositories/changes/FolderRow.svelte`. The brief's list of the places saying "Working" leaves out `src/lib/views/sessions/session-detail/ChangesRepo.svelte:96`, which the brief's own `grep -rn "git\.busy" src` prints on the base. Also the brief's verify command 4 names `tests/data/sources/manifests.test.ts` in the worktree, which the split removes. The builder found and handled all three; the faults are the brief's. Failure scenario: an orchestrator checking the diff against the write list reads the real FolderRow path and the two session-detail files as writes outside the brief. Verdict: none on the build.

## 2. Proof

- `.scratch/migration/agents/reviews/O41-report.md`, item 11: "`hidden` is the list's archived mark (`SessionList.svelte:142-143`)"; what is wrong: the list's archived predicate is `SessionList.svelte:147-149`, `return archivedNow[row.id] ?? row.hidden;`, a per-instance override over `hidden`; the line is wrong and the override is not mentioned. Decision 6 rests on "the count and the rows of the whole list agree". Failure scenario: Behaviour 3. Verdict: none beyond Behaviour 3.
- `.scratch/migration/agents/reviews/O41-report.md`, item 12, and the scratch harness `rail/after.ts:126-127`: "8. One view split into two tabs: railPageViews names each view once, so it is one entry here."; what is wrong: the case 8 run feeds `railBadge` one entry by hand, so the run would print the same with or without any de-duplication; the case is proved by reading `pages.ts:228`, not by the run the DONE table cites. Likewise the parts of cases 1 to 3, 5 and 10 are written into the harness, as the report says, so the registrations' `railPart` hooks and `boardPart` are not run by any case. Failure scenario: a reader of the DONE row "Cases 1 to 10 ... quoted above" takes the registrations and the split-tab rule as run. Verdict: none; cases met by reading.
- `.scratch/migration/agents/reviews/O41-report.md`, DONE table, "Tree checks touched by this step ... Tests 120 passed (120)"; what the rerun showed: three timeouts in `diagrams.test.ts` and `history.test.ts` (files the step does not change, machine under load). Not counted as a finding under the rules file; the claim is unreproduced as printed.

## 3. Standards

- `DESIGN.md:338`: "Its optional `railPart` hook is what the view gives the button of the rail page its tab is on: a count read from the state the tab's badge reads, and its tone when the count means "act""; the same clause at `src/lib/state/workbench/navigation/registry.ts:154` ("and its tone when the count means "act"") and `src/lib/state/workbench/rail-badges/rail-badges.svelte.ts:38` ("a count and, when the count means "act", its tone"); what is wrong: the sentence is false for Funding, Education and Joint Work, whose part carries `collectionBadgeTone(id)` (`rail-part.ts:20-22`), the status hue of the counted entries, while `config/layout.yml` gives none of them a `tone:` (lines 282-285; only `tasks` has `tone: amber`), and the file's own comment says `tone:` is set "where a count means 'act', not 'here is how many'". Case 2 itself expects Funding violet. Rule: rules file, "What every package obeys", a sentence in a document or a head comment that the change makes false is a defect. Failure scenario: a builder adding a view's part reads DESIGN.md and gives a status-hued count no tone, or a reader expects the Academic Life badge never to be violet and files the violet badge (Funding alone above zero) as a bug.
- `HELP.md:496`: "Clone (on a project) asks for a folder and checks the repository out there. `:clone` lists your GitHub repositories (through `gh`) and clones one into a folder you pick. Afterwards oculus asks: Open (the clone alone) or Add to Workspace."; what is wrong: the clone's new running notice with its moving line, and the card's Clone glyph turning, are written nowhere in HELP.md, while every other motion of Part A got a sentence (HELP.md lines 41, 91, 279, 281, 376, 451). The builder left it out because item 17 does not name it and HELP.md is shared with O40; the rules file's "What every package obeys" asks a step to write what a user meets into HELP.md. The builder's report proposes the sentence ("While it runs, a notice with a moving line says the clone is running."). Failure scenario: a reader who sees a progress notice after picking a clone folder finds no HELP sentence saying what it is or that dismissing it does not stop the clone. Fix at landing: one sentence in that bullet.
- `.scratch/migration/agents/reviews/O41-report.md` (whole): what is wrong: parts the rules file requires are absent. No grep of the added comment lines and test titles for the history words, quoted with each hit judged ("What every package obeys"); no grep of a new helper's or type's name before writing it (`gitFolderOf`, `repositoryStandIns`, `RailPart`, `RunningAction`, `repositoryRoots`), quoted ("The principles every package is judged on"); no grep, quoted, of the changed names across src, tests, config, docs, HELP.md, DESIGN.md and README.md (`firstBadge`, `submit.busy` to `running`, `state.busy`, the `Repo.svelte` path, the test file path), and no list of each DESIGN.md, HELP.md and docs paragraph on the changed behaviour as "still true" or "rewritten" ("What every package obeys"); the edits to existing assertions of `tests/state/sources/clone.test.ts` are described in prose, with no before and after per changed line from a diff against the base copy ("What every package obeys"); no statement of what the code does for each new key or id (`acting` keyed by root, the `starting` row key, the `pressed` account label) empty, duplicated and colliding, and for each new asynchronous path in flight, after close and superseded (a second Usage press, a Schedule list closed while `runNow` awaits, a clone notice when the page reloads) ("What every package obeys"). The reviewer's own greps (Verification) found no stale name and no history word, so no code defect follows from the missing greps. Failure scenario: the orchestrator lands on a report whose required self-checks it has to redo.
- `.scratch/migration/agents/guarded.md:187` (G13) and `:211` (G32): "the files a hub names: `tests/data/sources/manifests.test.ts`, describe 'a hub reports only the files its own configuration names'" and "a feed named by the collections list: `tests/data/sources/manifests.test.ts`"; G32: "manifests: `tests/data/sources/manifests.test.ts`, describe "the scan and the manifest's own tier and type"" and "the placements and clones: `tests/data/sources/manifests.test.ts`, ... describe 'the address of a repository' ... describe 'the origin of a folder' ... describe 'the clones of a project'"; what is wrong: the split moved these rows to `tests/data/sources/manifests/manifests.test.ts` (scan rows, G13's rows) and `tests/data/sources/manifests/clones.test.ts` (address, origin, clones), and the builder's report names only G32 as needing the path change ("`agents/guarded.md`'s G32 entry names the old path"). G13 is not named, and G32 names the old path in several places, split across two new files. Rule: rules file, "What every package obeys", a test exists only as the test of an entry that names it by file and title. Failure scenario: the orchestrator changes G32's first path at landing and leaves G13, and G32's clone describes, pointing at a file that no longer exists; the next step touching `manifests.ts` runs G13's test by a path vitest reports as no test found.
- `src/lib/views/boards/projects/Projects.svelte:9-13`: "const RAIL_CELLS: Partial<Record<string, string>> = { projects: 'active', coauthor: 'in progress', personal: 'building' };"; what is wrong: `'in progress'` and `'building'` are the `label:` values of `tab_rollup` in `config/layout.yml:257-273`, written again in code; `boardPart` matches by label (`rail-badges.svelte.ts` `boardCells(view).find((one) => one.label === cell)`) and answers `{ count: 0 }` for a label it does not find. The brief names the cells by these labels, so the literal follows the brief; the rules file's "What every package obeys" keeps a value that has a config key in the config. Failure scenario: Axel renames the Coauthor bucket to "in prep" in `config/layout.yml`; the tab still draws the cell, and the Projects rail button silently drops Coauthor's part, with no finding. The orchestrator decides whether this stands as the brief's shape.

## 4. Behaviour

- `src/lib/views/system/workbench/Catalogue.svelte` (draws `badgeOf`), with the new `badge` hooks of `Findings.svelte`, `SessionList.svelte` and `Processes.svelte`: what is wrong: the three new counts are drawn in the Views catalogue as well as on the tabs (DESIGN.md:338: the badge hooks "draw the view's badge on its tabs and in the catalogue"); the report's user-visible list says "Findings, Session list and Processes tabs: before, no count; after, a count". Failure scenario: the look on landing checks the tabs only and misses the catalogue rows.
- `src/lib/shell/status/RepoItems.svelte:236-247`: "label={t('repositories.publish')} title={syncing.words} glyph="sync" turning compact status inert onclick={() => undefined}"; what is wrong: `ToolButton`'s `inert` sets `disabled` (`ToolButton.svelte:99`), so while a publish runs the status bar's Publish item leaves the tab order, and a Publish pressed from the keyboard replaces the focused button with a disabled one, so the focus falls to the document body; the report states "inert (takes no press, drawn at full strength)" with no word of focus or tab stops, which the rules file counts as visible. Failure scenario: a reader tabs to Publish in the status bar, presses Enter, and the next Tab starts from the top of the page.
- `src/lib/state/workbench/rail-badges/rail-badges.svelte.ts` `sessionInputCount` ("needsInput(row) && !row.hidden") against `src/lib/views/sessions/session-list/SessionList.svelte:147-149` ("return archivedNow[row.id] ?? row.hidden;"): what is wrong: the list draws a row as archived from its own `archivedNow` override, set at the Archive press (`SessionList.svelte:243`) and never cleared on success, while the count reads `hidden` from the channel. Failure scenario: a session needing input is archived in one Session list and unarchived from another tab or page; the first list keeps drawing it archived (its override holds `true`), the tab and rail count it, so the count is 1 while that list shows no "needs input" row. Between an Archive press and the channel's update the count is also one higher than the list. The report states the count as agreeing with the list.

## Declined to judge

- The failing lines of cases 23 to 27, 30 and 31 on the unchanged tree: the builder ran the new rows against a `src/` it says was identical to the base; reproducing it needs the new test files placed against the base's `src`, which the reviewer's no-edit rule forbids. The quoted failures read as the base code would give them (three clones and the finding, `[ 'early' ]`, no running notice).
- The search route (`src/routes/api/(files)/search/+server.ts:22`, `src/lib/server/files/search/search.ts:597-620`): each listed repository inside a root is searched by its own run, so if the server's repositories list holds the hub's linked worktrees under `.agents/worktrees/` (the brief's premise says the walk lists them; the hub's `.gitignore:121` ignores `/.agents/worktrees/` for the hub's own run), a workspace search answers each hub file once more per worktree checkout. The builder judged this right and changed nothing; whether a worktree's files belong in search results is Axel's call, and whether the list holds them needs a running server.
- Cases 11 to 22 as drawn (motion, colours, reduce-motion, focus): the look on landing.
- Whether `Collection.svelte` would reach 524 lines without `rail-part.ts`: the builder's count, not remeasured.
- The tree checks that timed out on rerun: not the step's files, not rerun again under the rules file.

Reviewer usage: aaf31f5ef12ea8dc2, claude-opus-5-5, 337,168 tokens, 86 tool uses, 18.4 min.
