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

## Repair round 1, refuted

All from `tools/oculus` in `/Users/axelfaes/workspace/research-hub/.agents/worktrees/migration-O41` unless named otherwise. The delta read is `diff -u` of each path of the snapshot's `files.txt` against the worktree (15 paths differ: DESIGN.md, HELP.md, channels.dot and .svg, RepoItems.svelte, selectors.svelte.ts, processes.svelte.ts, registry.ts, rail-badges.svelte.ts, Projects.svelte, SessionList.svelte, RepoList.svelte, Processes.svelte, +page.svelte, repo/Repo.svelte), plus `git diff cc0a63390` of `src/lib/ui/menu/Menu.svelte` and `src/lib/ui/menu/MenuOpener.svelte`, the only changed paths `files.txt` does not list (`git status --short`).

```
The brief's "Verify before you report":
1. `npm run diagrams`, then `npm run test:quick`, once, after your last change: every command passes.
md5 -q docs/diagrams/* | md5      -> f104611eeafdc693515aac815b73c561
npm run diagrams                  -> 6.9 s
md5 -q docs/diagrams/* | md5      -> f104611eeafdc693515aac815b73c561   (no diagram's content changed)
npm run test:quick
test:quick: 73 changed file(s), from git since HEAD
test:quick: 46 test file(s), 9 essential
ok      ASCII gate (0.7 s)
ok      prettier (1.4 s): All matched files use Prettier code style!
ok      svelte-kit sync (2.2 s)
ok      eslint (1.5 s)
ok      svelte-check (6.7 s): 1792273850200 COMPLETED 514 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest (39.3 s): Duration  33.55s (transform 48.51s, setup 0ms, import 82.73s, tests 34.95s, environment 966ms)
test:quick: 41.7 s (limit 45.0 s); every command passed
(run a second time only to read its head lines; the same result)

2. The ASCII gate of `agents/spec.md` (its perl form) over every file you touched prints nothing.
the spec's perl gate over the 71 files `git status --short` names (deleted paths left out, folders expanded,
the two .scratch files included)   -> printed nothing; perl exit 0

3. `wc -l` over every file you touched: no source file over 880 lines, no component over 520, tests included.
largest: Graph.svelte 519, ProjectCard.svelte 518, Repositories.svelte 517, Source.svelte 517, Collection.svelte 506,
repo/Repo.svelte 471; selectors.svelte.ts 734, status.ts 602; tests/data/sources/manifests/manifests.test.ts 748

4. `npx vitest run tests/data/sources/manifests.test.ts tests/state/sources/clone.test.ts`, in the base copy before
   your change and in the worktree after it
(O41-base) npx vitest run tests/data/sources/manifests.test.ts tests/state/sources/clone.test.ts
 Test Files  2 passed (2)
      Tests  66 passed (66)

The round brief's "Verify before you report":
- `npx vitest run tests/data/sources/manifests/manifests.test.ts tests/data/sources/manifests/clones.test.ts tests/state/sources/clone.test.ts` passes (74 tests or more).
 Test Files  3 passed (3)
      Tests  74 passed (74)
- `sh utils/unused-exports.sh` diffed with .../O41-base/unused-exports.txt adds no line.
157c157
< src/lib/state/sessions/folds.ts: pruneTree, sessionCount, hiddenCounts, terminalPlaces, LIST_FILTER, needsInput, matchesSearch, keptByFilter
---
> src/lib/state/sessions/folds.ts: pruneTree, sessionCount, hiddenCounts, terminalPlaces, LIST_FILTER, matchesSearch, keptByFilter
(no line added)
- Cases 1 to 10 of the brief rerun after the change, and the runs items 1 and 4 ask for.  (below)

The round report's evidence, rerun in the same form in the scratch folder rail/ (outputs to r1/):
OCULUS_ROOT=<worktree>/tools/oculus node --no-warnings --import ./register.mjs procs.ts   -> exit 0, identical to procs.out
two running app hosts, no terminal, no read yet: hosts listed=2 count=2
two running app hosts, a read with no rows: hosts listed=2 count=2
one terminal process and two running app hosts: hosts listed=2 count=3
one terminal process, two running hosts, one ended, one waiting: hosts listed=4 count=3
OUT_DIR=<scratch>/r1 OCULUS_ROOT=<worktree>/tools/oculus node --no-warnings --import ./register.mjs boards.ts -> exit 0, identical to boards.out
layout.yml projects: count=4 tone="green"
layout.yml coauthor: count=3 tone="green"
layout.yml archive: no part
layout.yml personal: count=2 tone="brass"
layout.yml software: no part
relabelled coauthor's first bucket: "in progress" to "in prep"
relabelled projects: count=4 tone="green"
relabelled coauthor: count=3 tone="green"
relabelled archive: no part
relabelled personal: count=2 tone="brass"
relabelled software: no part
OCULUS_ROOT=<worktree>/tools/oculus node --no-warnings --import ./register.mjs after.ts  -> exit 0, identical to after.out
OCULUS_ROOT=<O41-base>/tools/oculus node --no-warnings --import ./register.mjs before.ts -> exit 0, identical to before.out
npx vitest run tests/checks/source/keys.test.ts tests/checks/source/comment-width.test.ts tests/checks/source/history.test.ts tests/checks/tree/boundaries.test.ts tests/checks/tree/size.test.ts tests/checks/tree/duplication.test.ts tests/checks/imports/cycles.test.ts tests/checks/imports/order.test.ts tests/checks/diagrams/diagrams.test.ts --testTimeout 60000
 Test Files  9 passed (9)
      Tests  120 passed (120)
item 2's grep: grep -rn -e 'railPart' -e 'RailPart' -e 'means "act"' -e "means 'act'" DESIGN.md HELP.md docs src config
  -> DESIGN.md:338 (rewritten), rail.ts:79 and config/layout.yml:280 (name the urgency tones, no claim that a part has a
     tone only then), and the hooks themselves; registry.ts:152-158 and rail-badges.svelte.ts:37-42 hold the new clause
grep -c -F 'While a clone runs, its Clone control turns its glyph and a notice with a moving line says "Cloning <name>..."; clearing the notice does not stop the clone.' HELP.md -> 1 (HELP.md:496)
changed and removed names over src tests config docs HELP.md DESIGN.md README.md (svg and local.yml left out):
  firstBadge 0, submit\.busy 0, state\.busy 0, repositories/Repo\.svelte 0, sources/manifests\.test\.ts 0, boardPart\( 2
grep -rnw repositoryRoots (now) -> server only: roots.ts, pty/routes.ts, root/context.ts, git-start.ts, debug, schedules
  and commands routes, tests/server/root/workspace-follow.test.ts, DESIGN.md:387 (the server's, as at the base); 16 hits at
  the base; rootsOfRepository, RailCell, uncarried, drawAhead: 0 hits at the base; tableRows: 8 local hits at the base
history words over every added line of `git diff cc0a63390` and the five untracked files (2481 lines):
  only present-tense or spatial uses; two hits are not in the round report's list: MenuOpener.svelte:146 "the wrapper
  around it still opens the tooltip" and RailPages.svelte:261 "is cut before it would leave the box" (Finding 5)
channels.dot edges, snapshot vs now -> one added: "ch app-hosts" -> "state/system/machine/processes/processes"
find (files newer than the builder's round1/quick2.txt, 23:44:41) -> ./HELP.md (23:45:02)
```

### Verdicts

Items of the brief's "What to build", over the whole diff since the base:

- 1: holds. `repositories.svelte.ts:295-327` (`send` refuses an empty or busy root before writing `acting`, clears it in `finally`), `running` at 269-276; the selector is now `rootsOfRepository` (`selectors.svelte.ts:651`), read at `RepoList.svelte:173`, `repo/Repo.svelte:130` and `+page.svelte:241`.
- 2: holds, as the first report read it; the row and the view now read `rootsOfRepository`.
- 3: holds. `RepoItems.svelte:220-271`: the sync item turns `sync`; the Publish item turns `sync`, says `syncing.words` and waits, for one remote (a `ToolButton`) and several (the `Menu`, whose opener waits). The several-remotes item stays a `Menu` while it runs, which the brief's item 3 drew as "one status `ToolButton` ... in place of its ... `Menu`": Finding 2.
- 4: holds. `clone.svelte.ts:108-115` posts the running notice with `progress: { percent: null, cancel: null }` and removes it in `finally`; `ProjectCard.svelte:257`, `CardActions.svelte:169,191`.
- 5: holds, as the first report read it.
- 6: holds, as the first report read it.
- 7: holds, as the first report read it.
- 8: holds, as the first report read it.
- 9: holds. The tone sentence is true now at `DESIGN.md:338`, `registry.ts:152-158` and `rail-badges.svelte.ts:37-42`.
- 10: holds. `Projects.svelte:12-16` names no `label:` of `tab_rollup`; `boardPart` (`rail-badges.svelte.ts:143-148`) finds `{ bucket }` by place and `{ type }` by the type key; `rollup` returns every bucket in the config's order, a zero bucket included (`rail-badges.ts:94-107`), and `typeSplit` labels its cells by the type keys (`rail-badges.ts:86-91`), so bucket 0 is the first bucket even when it counts nothing; the `boards.ts` rerun above.
- 11: holds. The Processes count is the table's rows plus the hosts whose state is `running` (`processes.svelte.ts:84-86`), the `procs.ts` rerun gives 2 and 3; the view and the tab read the same rows (`processes.hosts()`, `Processes.svelte:64-66`). See Finding 1 on what the move left in the apps store.
- 12: holds, `after.ts` rerun identical.
- 13: holds, as the first report read it.
- 14: holds, as the first report read it.
- 15: holds, the rows of `clones.test.ts` pass.
- 16: holds for `settle`; the search route stays under "Declined to judge".
- 17: holds. `HELP.md:496` carries the dictated sentence (grep -c 1); the tone clause is fixed (item 9); HELP.md:280, :451 and :495 gain one sentence each (judged under round item 7 below).

Cases of the brief's "Cases":

- 1: met, `after.ts` rerun: 25, green, "Projects, key 2 (Projects 20, Coauthor 2, Personal 3)". The board parts are written by hand there; `boards.ts` runs the three board hooks through `boardPart` and the real `config/layout.yml` on its own counts (4, 3, 2), so the path of case 1's parts is run, its numbers are not.
- 2, 3, 4, 5, 7, 9, 10: met, `after.ts` rerun identical to the first report's output.
- 6: met, rerun: 14, no tone; the Processes count does not reach the rail.
- 8: met by reading `pages.ts:228` (`[...new Set(...)]`); the harness hands one entry and does not run the split tab.
- 11 to 13, 15 to 22: met by reading, as the first report read them; the look on landing settles what is drawn.
- 14: met by reading: while the publish runs, the item is the waiting `Menu` with the `sync` glyph turning and "Publishing the branch..." as its title, and it is the same element when the answer comes; the brief's shape for it is a `ToolButton` (Finding 2). The look settles the drawing and the focus.
- 23 to 30: met after (74 passed); the failure on the unchanged tree is not reproduced ("Declined to judge").
- 31: met after; the five changed G80 rows read as `git diff cc0a63390 -- tests/state/sources/clone.test.ts` shows, each asserting the running notice and `removed`.

Items of the round brief:

- 1: partial. The count and its three comments are as asked (`processes.svelte.ts:1-9,35-46,71-86`, `Processes.svelte:1-5`), runs 2 and 3; the move left the apps store's `hosts` with no caller and a doc comment that names the Processes view as its reader: Finding 1.
- 2: holds; the grep rerun above prints no sentence that says the tone is present only when the count means "act". HELP.md:41's added "before any other colour, such as Funding's violet" is `urgentTone` (`rail.ts:84-87`).
- 3: holds. The sentence is word for word at HELP.md:496. "its Clone control turns its glyph": `ProjectCard.svelte:257` `turning: cloning(item.id)`, `CardActions.svelte:169,191`. "a notice with a moving line says ...": `clone.svelte.ts:109`, `config/text/app.yml` `running: Cloning {0}...`. "clearing the notice does not stop the clone": the post registers no `cleared` (`notices.svelte.ts` `post` sets `hearing` only for `options.cleared`; `clear` calls only that listener), and nothing aborts `postCommand`. For `:clone` there is no Clone control; the sentence's "its" reads as the project's control, as the report says.
- 4: holds; `boards.ts` rerun, the count stays 3 with Coauthor's first bucket relabelled.
- 5: holds. The one-remote `ToolButton` and the several-remotes `Menu` are each one element across the publish (`RepoItems.svelte:241-271`, no `{#if}` on `publishing`); `ToolButton`'s `waiting` sets `aria-disabled` without `disabled` and drops the press (`ToolButton.svelte:99-103`); the waiting opener drops the trigger's `on*` keys (`MenuOpener.svelte:76-81`). Findings 2 and 6.
- 6: holds for the case the round names. The effect at `SessionList.svelte:108-114` reads the whole channel, dismissed rows included (`sessionsByWorkspace(true)` is `entities.sessions()?.workspaces ?? []`, `selectors.svelte.ts:540-542`), the same rows `sessionInputCount` reads (`rail-badges.svelte.ts:196`); it writes only when a held mark is carried, and its next run finds none and writes nothing, so it settles; a failed write's put-back equals the channel's mark and is dropped on the next run. `topNow` gets the same drop. Two residual cases: Finding 3.
- 7: holds in substance; the parts asked are present. The clone test's edits are given per test rather than per line, and they match `git diff cc0a63390 -- tests/state/sources/clone.test.ts`. Findings 4 and 5 are gaps in its proof.

The changes past the findings, judged:

- The rename of the client selector `repositoryRoots` to `rootsOfRepository`: the base held the server's `repositoryRoots(open)` (`src/lib/server/files/roots.ts:29`), which answers every repository root of the workspace, so one name stood for two functions; the round's item 7 asked for this grep, and the rules file's "The principles every package is judged on" asks a name to be grepped before it is written. The rename reaches every client hit (grep above), O40's worktree changes none of the four files (`diff -q` of each against `O40-base`), and svelte-check passes. Within the round.
- `Menu.svelte` and `MenuOpener.svelte`: the several-remotes Publish item is a `Menu`, whose opener had no `turning` and no `waiting`; keeping its element is what keeps the focus (the confirm's give-back focuses only a connected control, `ui/frame/quiet-focus.ts`). Both props default to false, so no other `Menu` changes; O40 changes neither file. Needed by round item 5; the shape it gives is Finding 2.
- HELP.md:280 (the Processes tab's count), :451 (Publish Branch while a publish runs) and :495 (a linked worktree is one clone with its main checkout): each is true by the code read above (`processes.svelte.ts:84-86`; `RepoItems.svelte:241-271`, `repositories.publish` is "Publish Branch" in `config/text/views/sources/repositories.yml:170`; `clones.ts` and the G32 rows). The rules file's "What every package obeys" asks a step to write what a user meets into HELP.md. They go past the brief's limit of HELP.md, shared with O40, to the sentences item 17 names; O40's worktree changes HELP.md at base lines 53, 66, 87, 259, 274, 307, 388 and 391 (`diff` against `O40-base`, whose HELP.md is the same file as O41-base's), none adjacent to 41, 91, 279-281, 375, 449 or 493-494, so they merge line by line.

### Findings

1. Standards. `src/lib/state/system/apps/apps.svelte.ts:199-200`: "/** The host of every app that names one, as the Processes view and the tabs draw them. */ hosts: () => AppHostRow[];" and `src/lib/state/system/machine/processes/processes.svelte.ts:71-73`: "function hosts(): AppHostRow[] { return entities.appHosts()?.rows ?? []; }"; what is wrong: the round moved the Processes view's read to the processes store by repeating the apps store's expression (`apps.svelte.ts:370`, `deps.entities.appHosts()?.rows ?? []`) instead of reading the apps store, as the round's item 1 offered. `AppsStore.hosts` now has no caller: `grep -rnE "\.hosts\(\)" src tests` prints no client reader of it, and `git show cc0a63390:.../Processes.svelte` shows `apps.hosts()` at lines 60 and 62 as its only one. Its doc comment names the Processes view and the tabs as its readers, which is false now. Rules: "The principles every package is judged on" (a fold exists once and is reused; an export left without a caller is removed or made local) and "What every package obeys" (a sentence in a doc comment the change makes false is a defect). Failure scenario: a later step changes which hosts the Processes view lists in `apps.hosts`, as its doc comment says it serves that view; the view and its count do not change, and a reader looking for the rows the count reads finds two copies of the read. Verdict: round item 1 partial. Fix at landing: `createProcesses` takes the apps store's `hosts` (or the apps store drops `hosts` and its doc comment).

2. Spec. `src/lib/shell/status/RepoItems.svelte:257-271`: "<Menu status placement="above" label={t('repositories.publish')} glyph={publishing ? 'sync' : 'publish'} turning={publishing} waiting={publishing} ..."; what is wrong: the brief's item 3 drew the Publish item "for one remote or several ... while publish runs as one status `ToolButton` with the `sync` glyph turning ... in place of its `publish` glyph or its `Menu`". For several remotes the round keeps the `Menu` and makes its opener wait, so the running item is a menu button (`aria-haspopup="menu"`, `aria-expanded="false"` from bits-ui's trigger props, `node_modules/bits-ui/dist/bits/menu/menu.svelte.js:1467-1481`, now with `aria-disabled="true"`) drawn by `MenuOpener` in place of a `ToolButton`. The reason is sound (a swapped element loses the focus the round asks to keep), but the round report states the change as a file outside the path list, not as a departure from item 3's shape that the orchestrator may reverse (rules file, "No silent design decisions"). Failure scenario: the look on landing checks case 14 against item 3 and expects the ToolButton; a screen reader announces "Publish Branch, menu button, dimmed" while it runs. Verdict: none on the build; a decision to book.

3. Behaviour. `src/lib/views/sessions/session-list/SessionList.svelte:106-114` and `274-284`: "// A mark drawn ahead goes once the channel's row carries it, a mark put back after a write // that did not land among them, since that is the mark the channel's row carries." and "drawAhead(field, row.id, next); ... if (answer.ok) return; drawAhead(field, row.id, !next);"; what is wrong: the effect drops a held mark whenever the channel's row equals it, whether or not a write for that row is in flight, and the put-back writes `!next` whatever the channel holds by then. Two cases follow. A quick Archive then Unarchive on one row: the second press draws `false`, which equals the channel's `hidden` and is dropped at once; the first write then lands and the list draws the row archived until the second write lands. A failed write while the channel has moved to `next` (the same mark set from another tab or page during the write): the put-back `!next` contradicts the channel and is held until the channel changes again, so the list draws the row unarchived while the count leaves it out, the disagreement the round set out to end, and the comment's "since that is the mark the channel's row carries" is false then. Failure scenario: as above. Verdict: none on round item 6 as named; a residual of it. Fix: on a failed write, delete the row's held mark in place of writing `!next`; and hold a mark while a write for that row is in flight.

4. Proof. `.scratch/migration/agents/reviews/O41-report.md`, "Round 1", "Verify": "From `tools/oculus` in the worktree, after the last change:" and "The verify list ran three times this round."; what is wrong: the quoted `test:quick` lines are those of the builder's `round1/quick2.txt` (svelte-check `1792273448517`, vitest 40.6 s), written at 23:44:41, and `HELP.md` was written at 23:45:02 (`find -newer quick2.txt` above), so the quoted run is not after the last change. The three runs are given with no red line: `round1/quick1.txt` prints "every command passed" with "test:quick: 47.0 s (limit 45.0 s)" and "over the time limit"; the rules file's "Token discipline" allows a second run only after a red line in a changed file. The reviewer's run over the tree as it stands passes every command, so no decision rests on either. Verdict: none.

5. Proof. `.scratch/migration/agents/reviews/O41-report.md`, "Round 1", item 7, "History words": "Each hit, with its context and judgment"; what is wrong: the list leaves out two added comment lines with a hit, `src/lib/ui/menu/MenuOpener.svelte:146` "the wrapper around it still opens the tooltip" (this round) and `src/lib/shell/rail/RailPages.svelte:261` "is cut before it would leave the box", because `round1/added.py` takes a line of a CSS comment that does not open the comment as code. Both are present-tense uses and right. Verdict: none.

6. Standards. `src/lib/shell/status/RepoItems.svelte:25-30`: "// turning and the same words, and is waiting: drawn disabled, it takes no press and opens no // list until the answer, and it stays the same button, in the focus order, so the keyboard // the confirm gives back lands on it. The glyph is still under the system's reduce-motion // setting. The page says which action runs // (`git.running`), as it does the writes."; what is wrong: the paragraph edited this round keeps a line that ends short inside a sentence ("setting. The page says which action runs", 47 columns, followed by "(`git.running`), as it does the writes.", which fits on it), against the rules file's "What every package obeys" (a comment the step edits is rewrapped as a whole paragraph at 100 columns); and "the keyboard the confirm gives back" names the focus by another word, against the rules file's Prose rule (name the actual thing). Failure scenario: a reader of the head comment does not know what the confirm gives back, and the next edit of the paragraph inherits the broken wrap. Verdict: none. Fix at landing: rewrap, and "so the focus the confirm gives back lands on it".

### Declined to judge

- The landing merge of `DESIGN.md` with O40: O41 changes base line 703 (the Clone bullet) and O40's worktree changes base line 704 (the "Unsaved text" bullet), consecutive lines of the same file at the same base (`cmp` of the two base copies' DESIGN.md: same; `diff` of each worktree against it); git marks consecutive changed lines from two sides as a conflict, while the dispatch entry's `shared_paths` says "different sections". A round-0 change, outside this round's delta; the cherry-pick at landing settles it.
- Focus, tab order, the tooltip and the dimming of the waiting Publish item and the waiting opener, and the Session list after an archive: a DOM shows them; the look on landing. The waiting opener's `held` also drops the trigger's attachment, whose key is a symbol (`svelte-toolbelt/dist/utils/attach-ref.js:25-47`, `Object.entries` skips it); its teardown keeps the ref while the button is connected (line 33), so the read finds no harm, and only a page shows it.
- Whether the git watcher gives the branch its upstream before a publish's answer, which would swap the Publish item for the sync item mid-run and drop the focus: needs a running server.
- A host in the `starting` state is not counted; the round's item 1 says "whose state is running", and `AppHosts.svelte:56` words only `running` as running while it draws Stop for `starting` too (line 83). Read as the round wrote it; whether a starting host should count is the orchestrator's.
- The failing lines of cases 23 to 31 on the unchanged tree, the search route over worktrees, and `guarded.md`'s G13 and G32 paths (the round leaves them to landing): as the first report declined them, for the same reasons.

Reviewer usage: a3da982beb8e425df, claude-opus-5-5, 271,818 tokens, 79 tool uses, 17.4 min.

## Closed

The findings of the run over the last round go to no builder; each is fixed at landing or raised to Axel.

- First run, Spec 1 (Processes count without the app hosts): closed in round 1, round item 1.
- First run, Spec 2 (three brief premises wrong: FolderRow's path, ChangesRepo.svelte's "Working", the removed test path): no change needed in the build; the builder handled all three.
- First run, Proof 1 (the archived predicate's line): closed in round 1, item 7.
- First run, Proof 2 (cases run with hand-written parts): closed in round 1, item 4's run through the registrations; case 8 met by reading.
- First run, Proof 3 (tree-check timeouts): no change needed; the run with a 60 s timeout passes 120 tests.
- First run, Standards 1 (the "act" tone clause): closed in round 1, item 2.
- First run, Standards 2 (HELP.md Clone sentence): closed in round 1, item 3.
- First run, Standards 3 (report parts missing): closed in round 1, item 7.
- First run, Standards 4 (guarded.md G13 and G32 paths): fixed at landing by the orchestrator.
- First run, Standards 5 (board cells by label): closed in round 1, item 4.
- First run, Behaviour 1 (the Views catalogue counts): closed in round 1, item 7; seen at the look.
- First run, Behaviour 2 (inert Publish loses focus): closed in round 1, item 5.
- First run, Behaviour 3 (Session list override): closed in round 1, item 6; residual in round finding 3.
- Round 1, finding 1 (apps store's hosts left with no caller): fixed at landing, the processes store reads the apps store's hosts.
- Round 1, finding 2 (several-remotes Publish stays a Menu): ruled at landing, the waiting Menu stands, since swapping the element loses the focus round item 5 keeps; booked in the landing.
- Round 1, finding 3 (Session list marks during a write and after a failed one): fixed at landing, a failed write deletes the row's held mark and a mark is held while its write is in flight.
- Round 1, findings 4 and 5: no change needed; the reviewer's own runs over the tree stand.
- Round 1, finding 6 (RepoItems head comment wrap and wording): fixed at landing.
- Round 1, declined: a host that is starting: ruled at landing, a host the view draws with Stop (running or starting) counts.
- Round 1, declined: DESIGN.md lines 703 and 704 shared with O40: resolved at whichever landing meets it.
