# Step D47 refuter report (on .agents/worktrees/D47, base 5f08fde1a)

A page this report cites (the rules file, a standard, a skill's text) is named with its section, never with a line number, since a page's lines move and a section's name does not. A finding in code keeps its `file:line`.

Summary of what needs action before landing: B1 (a saved tab whose view is `constructor`, `toString` or `hasOwnProperty` now makes `parseLayout` throw, and nothing catches it in `loadLayout`), St1 (the G29 test file's head comment is now false), S1 (case 19 needs the orchestrator's ruling, which the builder did not ask for) and S2 (the `saved.ts` comment edit lands on the same lines D57 changes, against the state file's shared-paths judgment). The rest are smaller.

## Verification (rerun by the reviewer)

```
# from tools/oculus in the worktree; a diagram hash taken before and after showed no file changed
$ npm run diagrams
(lists the 18 files under docs/diagrams/; shasum of docs/diagrams/* identical before and after: "diagrams unchanged by the run")

$ npm run test:quick -- --base 5f08fde1a
test:quick: 51 changed file(s), from git since 5f08fde1a
test:quick: 17 test file(s), 10 essential
ok      svelte-kit sync (34.7 s)
ok      prettier (34.7 s): All matched files use Prettier code style!
ok      ASCII gate (36.5 s)
ok      eslint (163.5 s)
ok      vitest (196.8 s): Duration  151.58s (transform 366.85s, setup 0ms, import 489.21s, tests 12.26s, environment 14ms)
ok      svelte-check (225.5 s): 1791549711277 COMPLETED 444 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
test:quick: 264.2 s (limit 45.0 s); every command passed
test:quick: over the time limit
(the time was long because several worktrees were running suites on the machine)

$ npx vitest run <the nine files of Verify 2> --reporter=dot      (as the brief writes it)
 Test Files  4 failed | 5 passed (9)
      Tests  5 failed | 120 passed (125)
 (every failure is "Error: Test timed out in 5000ms." in config-folder, boundaries, size and keys under machine load)
$ npx vitest run <the same nine files> --testTimeout 0 --hookTimeout 0 --reporter=dot   (the report's form)
 Test Files  9 passed (9)
      Tests  125 passed (125)

$ npm run test:checks -- --reporter=dot
 Test Files  17 passed (17)
      Tests  248 passed (248)

$ sh utils/folder-check.sh; echo "folder-check exit $?"
folder-check exit 0
$ sh utils/unused-exports.sh > $TMPDIR/...; diff .agents/worktrees/D47-base/tools/oculus/unused-exports.txt <it>
364 / 364 lines, identical

$ LC_ALL=C perl -ne '<the rules file's ASCII gate>' $(find src tests config -type f ! -name local.yml)
(prints nothing; bin/ does not exist in this tree)
$ LC_ALL=C grep -n '[^ -~]' DESIGN.md HELP.md docs/views.md .scratch/.../D47-report.md
(prints nothing)

$ wc -l (changed files): migrate.ts 91, load.ts 137, saved.ts 703, instances.ts 412, card.ts 130, layout-saved.test.ts 137;
  session-detail/: SessionDetail 192, DetailsBody 417, ChangesRepository 212, ChangesRepo 162, ChangesTouched 93,
  AgentRows 130, SessionSection 56, SharedMark 26, session-sections.ts 55; shared/explorer/sections/: Section 75, list-drag 173
  (all match the report)

# G29's new rows on the unchanged tree: a copy of D47-base under $TMPDIR with node_modules linked, the changed test file copied in
$ npx vitest run tests/state/workbench/layout/saved/layout-saved.test.ts --reporter=verbose
 ✓ ... > the version 3 envelope, read as pages of one tree > migrates every page, and reads which one was current
 × ... carries a retired view's saved tab to its successor: 'a Changes and an Agents tab beside an...'
 × ... 'a Changes tab pinned to another sessi...'
 × ... 'an Agents tab alone in a pane becomes...'
 × ... 'an Agents tab alone in a float become...'
 ✓ ... 'a pane holding neither view is read a...'
 × ... 'a Changes and an Agents tab of one pi...'
 Tests  5 failed | 2 passed (7)
 e.g. -       "view": "session-detail",  +       "view": "agents",   at layout-saved.test.ts:134:39
(the report's claim "5 failed, 2 passed" reproduces)

# Scratch runs of cases 4 and 19 (a vitest file under $TMPDIR, run in a copy of the unchanged tree and a copy of the changed tree)
unchanged: C19 only previous {"restored":false,"pages":[["Page 1",["status"]]]}
unchanged: C19 both [["Page 1",["changes","config"]],["Sessions",["agents","settings"]]]
unchanged: C4 after pick {"session":"b","label":"B"}
unchanged: C4 after unpin {}
unchanged: C4 after pin {"session":"c","label":"C"}
unchanged: C4 other tab {"session":"z","label":"Z","closed":["agents"]}
changed:   C19 only previous {"restored":false,"pages":[["Page 1",["status"]]]}
changed:   C19 both [["Page 1",["session-detail","settings"]],["Sessions",["session-detail","settings"]]]
changed:   C4 after pick {"session":"b","label":"B","closed":["changes"],"sections":["agents","details","changes"]}
changed:   C4 after unpin {"closed":["changes"],"sections":["agents","details","changes"]}
changed:   C4 after pin {"closed":["changes"],"sections":["agents","details","changes"],"session":"c","label":"C"}
changed:   C4 other tab {"session":"z","label":"Z","closed":["agents"]}

# Two inputs the report does not name (parseLayout over a version 3 envelope)
unchanged: CFG {"kind":"pane","tabs":[{"id":"k1","view":"settings","state":null},{"id":"k2","view":"settings","state":null}],"active":"k2"}
changed:   CFG {"kind":"pane","tabs":[{"id":"k1","view":"settings","state":null}],"active":"k1"}
unchanged: PROTO constructor {"kind":"pane","tabs":[{"id":"k1","view":"constructor","state":null}],"active":"k1"}   (toString, hasOwnProperty the same)
changed:   PROTO constructor THROWS TypeError: successor.carry is not a function   (toString, hasOwnProperty the same)

# The builder's head counts, from its own rendered page left at $TMPDIR/d47/all.html (its out.log line "RENDER count heads []" came from a regex that missed Svelte's class suffix)
'<span class="count svelte-dj5yz8">2</span>' twice (Changes: 2 files, Agents: 2 agents); Details draws none
```

The reviewer's scratch files under `$TMPDIR/d47r` are removed. `git status --short` in the worktree lists the same 50 lines as before the review.

## Verdicts

Items of the brief's "What to build", in its numbering:

- 1: holds. `SessionDetail.svelte` holds one `SessionPicker` in its bar, `PickSession` alone when `record === null`, and the three sections in the kept order; `DetailsBody.svelte` is the old body with the `record === null` guards removed (diff against the base `SessionDetail.svelte`); `ChangesRepository.svelte` holds the old Changes logic line for line with `AskConfirm`; `AgentRows.svelte` holds the old Agents rows and timer. The report's list of controls, rows, states and sentences matches the read. A visible part is missing from the report's before-and-after list (B3).
- 2: holds. `Section.svelte` and `list-drag.svelte.ts` moved, with `count?: number` the only code change (diff against the base); one `TreeView` per section (`SessionSection.svelte:49`); a closed section's body is not mounted (`TreeSection.svelte`, `{#if open && children !== undefined}`); `closed` and `sections` are kept in the tab's state (`session-sections.ts`); `pinInstance` and `unpinInstance` keep the rest of the state (scratch C4 above, both trees); drag and Alt+Up and Alt+Down through `createListDrag` and `headKeys`. Every Files importer follows; the type check and the boundaries test pass.
- 3: holds for what the item's text asks. Registrations gone (`grep -rn "id: '\(changes\|agents\)'" src/lib/views` prints nothing); `SESSION_VIEWS` is three views; `migrate.ts` carries and drops as the item says (G29 rows, C19 above); functions renamed with both callers. The same code adds a regression (B1) and an unstated change to `config` tabs (B2).
- 4: holds. `config/layout.yml:65` reads `view: [session-detail, { view: files, state: { follow: true } }]`; line 64 unchanged.
- 5: holds. Keys removed and `section_*` keys added; glyph `changes` gone from both catalogs; `m1-m5` in `HELP.md:43` and `app.yml:13`; `DESIGN.md:225` and `:456`; `answers.ts:2`; `HELP.md:134` rewritten and `:138-139` gone; `docs/views.md` `## Session` takes in the two removed sections; `allow-duplication.txt` line removed because the clone was folded into `SharedMark.svelte` (`duplication.test.ts` passes). A grep of the removed names (`changes view|agents view|changes tab|m1-m7|treeWithoutConfig|views.md#changes|...`) over src, config, docs, tests, HELP, DESIGN and README finds no stale hit.

Cases of the brief's "Cases":

- 1: met. The arrangement line read; the builder's parse output gives Session and Files tabs, and its render gives `["details","changes","agents"]` all open. `arrangements.test.ts` passes on both trees, so it proves nothing here.
- 2: met by reading (one picker, one `record` passed to every body); the pick on the page is the look's.
- 3: met by reading (`{#if record === null}` draws `PickSession` and no `SessionSection`).
- 4: met (scratch C4 above, both trees; a second Session tab keeps its own `closed`). The reload on the page is the look's.
- 5: met by reading for the wiring (`createListDrag` over `order`, write through `sectionsOrdered`) and for the kept order (builder's render `["agents","details","changes"]`); the drag and Alt+Up on the page are the look's.
- 6: met by reading: `ChangesRepository.svelte` carries the six-shape chain, the writes and `AskConfirm` unchanged from `Changes.svelte`; `ChangesRepo.svelte` differs only in its head comment and `SharedMark`. The presses are the look's.
- 7: met by reading: the interval is in `AgentRows.svelte`, the listing in `ChangesRepository.svelte`, both unmounted while closed; a remount makes a new `shownGate`, whose first `due` answers true, so there is one listing on reopening. The counts on the page are the look's.
- 8: met by reading (toolbar `tools` holds Transcript and Timeline only; Details controls unchanged). The presses are the look's. The armed Resume run on a scratch oculus is not verifiable here: a builder and a reviewer run no page.
- 9: met (G29 row 1; it fails on the unchanged tree and passes after).
- 10: met (G29 row 2).
- 11: met (G29 rows 3 and 4, pane and float).
- 12: met (G29 row 5; it passes on both trees, a preserved behaviour).
- 13: met by reading `card.ts:21`; `CardSessions.svelte:46` is unchanged.
- 14: met by reading the registrations (the Sessions group holds orders 0 to 4 and no `changes` or `agents`). The palette's view commands come from the same registry, judged by reading only.
- 15: met by reading and by the type check (import paths only, plus the optional `count`). The drawing is the look's.
- 16: not verifiable here. Only the page shows a 200 px pane; the look settles it.
- 17: partial by reading. Each section is its own `TreeView`, its rows are level-2 treeitems, and `TreeView.pressedKey` takes keys only from `data-part` item or branch-control elements, so the Details inputs keep their typing. Tab order on the page is the look's. No finding; the rest is the look's.
- 18: met (G29 row 6).
- 19: partial. With both `LAYOUT_KEY` (version 2) and `PREVIOUS_KEY`, the pre-pages workbench's `changes` and `config` tabs read as `session-detail` and `settings` (C19 both, above; before: `changes`, `config`). The storage the case names, only `PREVIOUS_KEY`, reads the default page on both trees, so its expected result cannot occur. See S1.
- 20: met (both registrations present, toolbar `pin('transcript')` and `pin('timeline')`, `layout.yml:64` unchanged in the diff).
- 21: met by reading the orders (0 to 4) and the builder's chord output `["m",["session-list","terminal","transcript","timeline","session-detail"]]`.

## 1. Spec

- S1, case 19, report section "The cases' first run": "This is a wording correction of the case, not a rule that gives a wrong result, so I did not stop for it; the orchestrator may rule otherwise." What is wrong: the builder's premise is right. `load.ts:109` uses `previous` only when `parsed !== null && previous !== null && parseWorkbench(raw) !== null`, and with only `PREVIOUS_KEY` the load gives the default page and clears the key (C19 only previous, both trees). So the case as the brief wrote it cannot give "read back as a Session tab". The brief's own rule (the paragraph after "Cases") says the builder stops at the first run, before any code change, and hands back such a case for the orchestrator's ruling. The builder decided it alone and ran a different storage. Its substitution is the storage that actually reaches the carry, and that run is met. Failure scenario: the ledger carries no ruling on case 19, and a reader of the report sees the case passed under a storage the brief did not name. Verdict: case 19 partial. The orchestrator rules on case 19 (recommended: both keys), and the ruling goes into the report's Closed section.
- S2, `src/lib/state/workbench/layout/saved/saved.ts:555-558` (base 555-557): "a `config` tab becomes a `settings` tab and a `changes` or `agents` tab a `session-detail` / tab (migrate.ts); ... the rest of the arrangement is the one the / viewer left." What is wrong: the write list names `saved.ts` lines 526 and 562 only, and the state file's `shared_paths` for D47 says "saved/saved.ts (D57 lines 18, 372, 556-557, 604; D47 lines 526 and 562) ... different lines". D57's worktree changes base lines 556-557 of this same comment paragraph ("becomes an empty added pane: the / rest of the arrangement is still the one the viewer left"), and D57 is at `landing: cherry-picking`. The builder's edit rewraps the paragraph and drops "still". The comment was incomplete rather than false after the rename. Extending it is reasonable, but dropping "still" was not needed: it says the arrangement is unchanged from what was saved, which is no code history. Failure scenario: D47's cherry-pick after D57 lands conflicts on this paragraph, and the shared-paths note tells the orchestrator to expect a simple merge. No verdict.
- S3 (point (b) of the dispatch), `config/behavior.yml:257` and `config/catalogs/options.yml:832`: both said "The Changes view asks this model", which the step makes false. The rules file's rule on carrying a changed name to every sentence requires the fix, so both edits were needed, and the report names them. `options.yml:832` is reader-visible help in Settings (B3). Neither path is in D47's `shared_paths`, while D46 writes `behavior.yml` lines 263-267 and `options.yml`, and D48 and D50 write `options.yml`. The lines differ, so the merge should be simple, but the state file does not say so. No verdict; this is a note for the orchestrator's shared-paths record.

## 2. Proof

- P1, `tests/state/workbench/layout/saved/layout-saved.test.ts:39-137` (point (d)): read in full. Each row parses a hand-built envelope through `parseLayout` and asserts the whole pane, with tabs, states and `active`, so it would fail with the carrying taken out. Five of the six fail on the unchanged tree and pass after (rerun above). Row 5 ('a pane holding neither view is read as it was saved') passes on both trees, as a preserved behaviour should, and it is quoted so. The existing `it` keeps its title and passes on both. The rows are proof, not audit. No row covers the input of B1 or the `config` change of B2. No finding against the rows themselves.
- P2, report "Method" paragraph and Verify 3: the brief asks for the scratch runs "quoted with their commands". The report gives outputs (`CASE 4 after pick ...`, `CASE 19 ...`) and describes the method, but gives no command line. The reviewer reproduced cases 4 and 19 on both trees with the same outputs, so no decision is left resting on an unreproduced claim. Failure scenario: a later reader cannot rerun the case runs from the report alone. No verdict.

## 3. Standards

- St1, `tests/state/workbench/layout/saved/layout-saved.test.ts:1-3`: "The saved form of a layout: the older envelope read by migration. A browser that holds a workbench of two trees and a docked panel opens it as the one tree a page now is, and no tab is lost on the way." What is wrong: the file now holds rows asserting that `changes` and `agents` tabs are dropped (rows 1 and 6). The rules file's rule says a sentence in a head comment that the change makes false is a defect of the change, and this head comment is in a file the step changed. G29's own text is reworded by the orchestrator at landing (Z745 (f)), but this comment is the builder's. Failure scenario: a reader trusts "no tab is lost" and reads row 1's drop as a bug. No verdict.
- St2, `tests/state/workbench/layout/saved/layout-saved.test.ts:39`: `describe('a tab of a view that became a section of the Session view', ...)`. What is wrong: the rules file's "What every package obeys" bars test-title wording that compares with an earlier state. "became" is of that kind, even though it is not one of the listed words. 'a saved tab of a retired view (changes, agents)' says the same as a fact. Minor; failure scenario: the title carries product history into the test name. No verdict.

## 4. Behaviour

- B1, `src/lib/state/workbench/layout/saved/migrate.ts:163` and `:169`: `if (!pane.tabs.some((tab) => tab.view in RETIRED)) return pane;` and `const successor = RETIRED[tab.view] as Successor | undefined;`. `RETIRED` is an object literal, so `in` and indexing reach `Object.prototype`. What is wrong: a saved tab whose view is `constructor`, `toString`, `hasOwnProperty` or any other prototype name passes the `in` test. `RETIRED[view]` then returns a function, and `successor.carry(tab)` throws `TypeError: successor.carry is not a function` (rerun above; on the unchanged tree the same input reads back as an unknown view). Nothing catches the throw: `load.ts:97` calls `parseLayout` bare, and `routes/+page.svelte:256` calls `loadLayout(localStorage, window)` bare. The rules file asks every key a step introduces to be checked for a collision with a reserved key. Failure scenario: a hand-edited or corrupt `oculus.layout.v1`, or one another browser tab writes and `adopt()` reads, holding such a tab makes the page throw on every load, before `setLoaded` and before the unread value is kept under `oculus.layout.unread`, the protection G31 names. The report does not state this. Fix: look up with `Object.hasOwn(RETIRED, tab.view)`, or make `RETIRED` a `Map`, and add a G29 row for it. Verdict: none of the items' texts is broken, but the defect is in item 3's code.
- B2, `src/lib/state/workbench/layout/saved/migrate.ts:174-178` (the `held` search over `[...tabs, ...pane.tabs]` and `config`'s `shows: () => true`): the drop rule now applies to `config` tabs carried earlier in the same pane. A pane holding two `config` tabs and no `settings` tab read as two `settings` tabs before and reads as one now (CFG rerun above, `active` moved from `k2` to `k1`). This is arguably better, and it follows from the item's "a tab carried earlier in the same pane included". But it is a change to how saved layouts read that the report's before-and-after list does not state. Failure scenario: the look and the landing read the `config` carry as unchanged. No verdict.
- B3, report section "Host- or user-visible changes, before and after" (point (c)). What it lists is accurate: the Sessions pane tabs; the heads; touched rows losing the grid, so the verb and count no longer start at one x; agent rows with the dot inline; the toolbar; `m6` and `m7`; pick, pin and unpin keeping state; retired tabs carried. Its look items (the dialogs, the Details inputs and type-ahead) are checks, not changes. Read here: `Confirm` draws through `ui/frame/Modal.svelte`, which portals its ground to the body, so the dialog does not move on screen; and `TreeView.pressedKey` takes keys only from row elements, so typing in Details does not move the tree. These visible changes are missing from the list or lack their before and after:
  (i) Closing a section now discards its local state: the Details title draft, the armed Resume and the outcome line, and in Changes the typed branch name and the branch list. Before, they lasted as long as the tab. The report says this under "States" but not in the list the look reads.
  (ii) A pending Discard or branch question now vanishes when the shown session is dismissed. Before, `AskConfirm` sat outside `{#if record === null}` in `Changes.svelte` and stayed.
  (iii) The "Touched by this session" sub-heading loses its count and its bottom rule (`border-bottom: 1px solid var(--line)` is gone from `ChangesTouched.svelte`'s `.sec-h`). The 12 px gap between the touched block and the repository block becomes `ChangesRepository.svelte`'s `padding: 4px 6px 6px`.
  (iv) Touched-file and agent rows become focusable treeitems. Each row's accessible name is `name`: the absolute path for a touched file, and kind plus description for an agent. Each section is a `role="tree"` named Details, Changes or Agents. The rules file counts focus, tab stops and accessible names as visible.
  (v) The Settings help of `git.message_model` changes words (`options.yml:832`).
  Failure scenario: the landing look on TEST checks the listed items and does not look for these, so a regression in any of them lands unseen. No verdict.

## Declined to judge

- The page-only halves of cases 2, 5, 6, 7, 8, 15, 16 and 17, and of 1, 20 and 21 on screen: the look's, since no reviewer runs oculus or a browser.
- The armed Resume run of case 8: by the brief it runs on a scratch oculus only, which neither a builder nor a reviewer starts.
- The builder's render scratch (`$TMPDIR/d47/render.test.ts`) was read and its HTML inspected for the head counts, not rerun; cases 1, 3, 5 and 7 were judged by reading the code.
- Whether the `docs/views.md` `## Session` section, now four paragraphs, should be shortened: a wording judgment for the orchestrator. It holds every sentence of the two removed sections, and the rules file's prose rules are met (one line per paragraph, ASCII).
- Whether B2's new `config` behaviour is wanted: the orchestrator's call, to be stated or kept.

Reviewer usage: agent id not known to me, claude-opus-5-5, about 75 tool uses; tokens and minutes are in the completion notice.

## Repair round 1, refuted

Reviewer over D47's repair round 1. Worktree `.agents/worktrees/D47`, base 5f08fde1a. The round's delta is `diff -ru -x node_modules -x '.svelte-kit*' -x local.yml .agents/worktrees/D47-round0/tools/oculus .agents/worktrees/D47/tools/oculus`. It changes four files: `src/lib/state/workbench/layout/saved/migrate.ts`, `src/lib/state/workbench/layout/saved/saved.ts`, `tests/state/workbench/layout/saved/layout-saved.test.ts` and the report. I changed no file. `git status --short` in the worktree printed 50 lines after the review, the same 50 as before it. All of my scratch output went to my own scratchpad. I did not append to the builder's `$TMPDIR` logs.

```
# from .agents/worktrees/D47/tools/oculus, PATH with $HOME/.nvm/versions/node/v24.21.0/bin
$ npm run test:quick -- --base 5f08fde1a
test:quick: 51 changed file(s), from git since 5f08fde1a
test:quick: 17 test file(s), 10 essential
ok      ASCII gate (1.0 s)
ok      prettier (2.2 s): All matched files use Prettier code style!
ok      svelte-kit sync (22.5 s)
ok      eslint (46.7 s)
ok      vitest (66.1 s): Duration  43.83s (transform 123.62s, setup 0ms, import 142.80s, tests 6.48s, environment 5ms)
ok      svelte-check (52.2 s): 1791554591098 COMPLETED 444 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
test:quick: 74.8 s (limit 45.0 s); every command passed
test:quick: over the time limit
exit 0 wall 75 s
(npm run diagrams was not run, because it writes into the worktree's docs/diagrams; G25, tests/checks/diagrams, inside test:checks below checks the committed diagrams against the source and passed)

$ npx vitest run tests/state/workbench/layout/saved/layout-saved.test.ts tests/state/workbench/layout/saved/layout-unread.test.ts tests/checks/config/arrangements.test.ts tests/checks/source/keys.test.ts tests/checks/config/config-folder.test.ts tests/checks/config/config.test.ts tests/checks/tree/boundaries.test.ts tests/checks/tree/duplication.test.ts tests/checks/tree/size.test.ts --reporter=dot      (the brief's form, no timeout flags)
 Test Files  9 passed (9)
      Tests  126 passed (126)

$ npm run test:checks -- --reporter=dot
 Test Files  17 passed (17)
      Tests  248 passed (248)
   Duration  268.60s

$ npx vitest run tests/state/workbench/layout/saved/layout-saved.test.ts --reporter=verbose     (changed tree)
 ✓ ... > the version 3 envelope, read as pages of one tree > migrates every page, and reads which one was current
 ✓ ... > a saved tab of a retired view (changes, agents) > carries a retired view's saved tab to its successor: 'a Changes and an Agents tab beside an...'
 ✓ ... 'a Changes tab pinned to another sessi...'
 ✓ ... 'an Agents tab alone in a pane becomes...'
 ✓ ... 'an Agents tab alone in a float become...'
 ✓ ... 'a pane holding neither view is read a...'
 ✓ ... 'tabs named like inherited object prop...'
 ✓ ... 'a Changes and an Agents tab of one pi...'
 Test Files  1 passed (1)
      Tests  8 passed (8)

$ cd $TMPDIR/d47-base-run && npx vitest run tests/state/workbench/layout/saved/layout-saved.test.ts --reporter=verbose     (unchanged tree; diff -rq of its src, tests, config against D47-base lists only layout-saved.test.ts, which cmp shows is byte-identical to the worktree's)
 ✓ ... migrates every page, and reads which one was current
 × ... 'a Changes and an Agents tab beside an...'
 × ... 'a Changes tab pinned to another sessi...'
 × ... 'an Agents tab alone in a pane becomes...'
 × ... 'an Agents tab alone in a float become...'
 ✓ ... 'a pane holding neither view is read a...'
 ✓ ... 'tabs named like inherited object prop...'
 × ... 'a Changes and an Agents tab of one pi...'
 ❯ tests/state/workbench/layout/saved/layout-saved.test.ts:142:39
 Test Files  1 failed (1)
      Tests  5 failed | 3 passed (8)
(reproduces the report's "5 failed | 3 passed (8)", and the new constructor row passes on the unchanged tree)

$ LC_ALL=C perl -ne '<the rules file's ASCII gate>' $(find src tests config -type f ! -name local.yml); echo "gate exit $?"
gate exit 0      (prints nothing; bin/ does not exist: "ls: bin: No such file or directory")
$ LC_ALL=C grep -n '[^ -~]' DESIGN.md HELP.md docs/views.md .scratch/migration/agents/reviews/D47-report.md
(prints nothing, exit 1)
$ sh utils/folder-check.sh; echo "folder-check exit $?"
folder-check exit 0
$ sh utils/unused-exports.sh > <scratchpad>/d47r1-unused.txt; wc -l; diff .agents/worktrees/D47-base/tools/oculus/unused-exports.txt <it>
     364
unused identical to base
$ node -e "require('yaml').parse(...)" over the nine changed YAML files under config/
parses config/behavior.yml ... parses config/text/views/sessions/session-detail.yml   (all nine parse)
$ wc -l: migrate.ts 96, saved.ts 703, load.ts 137, layout-saved.test.ts 145, AgentRows 130, ChangesRepo 162, ChangesRepository 212, ChangesTouched 93, DetailsBody 417, session-sections.ts 55, SessionDetail 192, SessionSection 56, SharedMark 26, list-drag 173, Section 75, instances.ts 412, card.ts 130   (all match the report)
$ grep -rniE "changes view|agents view|changes tab|agents tab|m1-m7|treeWithoutConfig|withoutConfigTabs|views\.md#changes|views\.md#agents|sessions/changes/|sessions/agents/|view_changes|view_agents|changes_bar|agents_bar|changes_glyph|became a section" src tests config docs HELP.md DESIGN.md README.md --exclude=local.yml
(only the five G29 row names in layout-saved.test.ts:83,98,105,112,133, which name saved tabs; no stale hit)
$ grep -rn "RETIRED" src tests
src/lib/state/workbench/layout/saved/migrate.ts:30 (the declaration), :42 (inside successorOf), :58 (a doc comment); every other hit is an unrelated constant in another module

# the report's scratch runs, rerun in the quoted form with only the out.log and all.html paths redirected to my scratchpad (sed over $TMPDIR/d47/cases.test.ts, render.test.ts, vitest.config.mts and $TMPDIR/d47-base-cases/cases.test.ts, vitest.config.mts)
$ cd .agents/worktrees/D47/tools/oculus && npx vitest run --config <scratchpad>/r1c/vitest.config.mts
 Test Files  2 passed (2)
      Tests  7 passed (7)
exit 0
$ cd $TMPDIR/d47-base-run && npx vitest run --config <scratchpad>/r1b/vitest.config.mts
 Test Files  1 passed (1)
      Tests  6 passed (6)
exit 0
$ diff <(sort $TMPDIR/d47/out.log) <(sort r1c/out.log)              -> changed tree: same lines as the builder's out.log
$ diff <(sort $TMPDIR/d47-base-cases/out.log) <(sort r1b/out.log)   -> unchanged tree: same lines as the builder's out.log
unchanged: CASE 19 previous and layout {"restored":true,"pages":[["Page 1",["changes","config"]],["Sessions",["changes","settings"]]]}
changed:   CASE 19 previous and layout {"restored":true,"pages":[["Page 1",["session-detail","settings"]],["Sessions",["session-detail","settings"]]]}
unchanged: CASE CFG two config tabs {"tabs":[{"id":"k1",...},{"id":"k2",...}],"active":"k2"}
changed:   CASE CFG two config tabs {"tabs":[{"id":"k1","view":"settings","state":null}],"active":"k1"}
changed:   CASE PROTO constructor {"tabs":[{"id":"k1","view":"constructor","state":null}],"active":"k1"}   (toString and hasOwnProperty read the same way, as on the unchanged tree)
$ grep -o '<span class="count[^"]*">[0-9]*</span>' r1c/all.html | sort | uniq -c
   2 <span class="count svelte-dj5yz8">2</span>

# the scratch files the report names: ls of $TMPDIR/d47/, $TMPDIR/d47-base-cases/, $TMPDIR/d47-base-run shows cases.test.ts, render.test.ts, vitest.config.mts, out.log, out-first.log, g29-base-round1.log, run-changed-round1.log, run-base-round1.log, verify1.log, open-items.txt and the base-run copy with node_modules linked to the worktree's; all exist

# merge with main: diff3 -m <worktree saved.ts> <D47-base saved.ts> <main saved.ts>
diff3 exit 1; conflict markers at 556-567 (the comment paragraph)
# the same three-way merge over every file D47 modifies that main changed since the base: DESIGN.md exit 0, instances.ts exit 0, saved.ts exit 1
```

### The six points asked

1. Round item 1. `successorOf` (`migrate.ts:41-43`) is the only code that reads `RETIRED`. Both of the old readers call it: the "pane holds a retired tab" test at `:63` and the per-tab lookup at `:67`. The rest of the grep hits are the declaration and a doc comment. The G29 row 'tabs named like inherited object properties are read as they were saved' passes on the changed tree and also on the unchanged-tree copy (my verbose run above), so the report's claim reproduces. The row's assertion compares the whole pane, so an `in` test or a bare index (which throws) would make it fail.
2. Round item 5. Base lines 554-557 are kept word for word, including "the rest of the arrangement is still the one the viewer left." The only change is the sentence "A saved `changes` or `agents` tab is carried to a `session-detail` tab by the same step.", appended to line 557, which wraps onto a new line 558 (`diff` round0 against the worktree, and `sed -n '550,562p'` of the base copy against the worktree). Because the sentence sits on line 557, it collides with D57's lines on main (finding 2).
3. Round item 4. The report's case 19 states the ruling (report, "Case 19 ruling") and names the command and the scratch file. The run puts a version 2 envelope (`WORKBENCH_VERSION = 2`, `model.ts:169`) under both `LAYOUT_KEY` and `PREVIOUS_KEY`. Page 1 comes from `PREVIOUS_KEY` through the new `treeWithoutRetired` call (`load.ts:100-103`), so the run reaches the change. I reproduced it on both trees.
4. Round item 7. I confirmed each listed change from the code:
   - (i) The Details title draft, the outcome line and the armed Resume are `$state` in `DetailsBody.svelte:40,43,49`. The branch name and the branch list are in `ChangesRepository.svelte:36,38`. A section's body mounts only under `{#if open && children !== undefined}` (`TreeSection.svelte:76`), so closing the section discards them.
   - (ii) In the base, `AskConfirm` sat outside `{#if record === null}` (base `Changes.svelte:215`). It now sits inside `ChangesRepository.svelte:186`, which is drawn only when `record !== null`.
   - (iii) The base had `border-bottom` on `.sec-h` (base `ChangesTouched.svelte:85`) and `gap: 12px` (base `Changes.svelte:221`). The new `.sec-h` in `ChangesTouched.svelte:78-87` has no rule, and the repository block has `padding: 4px 6px 6px`.
   - (iv) Rows are `TreeItem` with `name={file.path}` (`ChangesTouched.svelte:55`) and with the kind and description (`AgentRows.svelte:95`). `TreeView.svelte:265-266` gives `role="tree"` and `aria-label={label}`.
   - (v) The `options.yml` help text changes, before and after as quoted.
   - The `config` carry is item 6 of the list, with CASE CFG before and after.

   Two visible changes are still unstated (finding 1).
5. Round item 8. Each scratch run is quoted with its command and its file, and every file exists. The report's description of `out-first.log` is inaccurate (finding 3).
6. `test:quick` took 74.8 s on my run, against the 45.0 s limit. Every command passed. Other worktrees' suites were running on the machine at the same time.

### Verdicts (whole diff since the base)

- 1: holds. One `SessionPicker` (`SessionDetail.svelte:111`), `PickSession` alone when `record === null` (`:123`), and the three sections in the kept order. The report's list of controls, rows, states and sentences matches the files.
- 2: holds. The moved `Section.svelte` differs from the base only in its head comment and in `count?: number`. `list-drag.svelte.ts` differs only in its head comment. Each section has one `TreeView` (`SessionSection.svelte:49`) and its body unmounts while closed. `closed` and `sections` are kept through pick, unpin and pin (CASE 4 on both trees). The drag and the Alt keys go through `createListDrag` and `headKeys`.
- 3: holds. No `changes` or `agents` registration remains (grep exit 1). `SESSION_VIEWS` is three views (`card.ts:21`). Carry and drop work (G29 rows, CASE 9 to 19). The functions are renamed and both callers follow. `load.ts:100-103` migrates the workbench held before pages. Lookups go through `successorOf`.
- 4: holds. `config/layout.yml:65` reads `view: [session-detail, { view: files, state: { follow: true } }]`, and line 64 is unchanged.
- 5: holds. The keys, the glyph `changes`, `m1-m5` (`HELP.md:43`, `app.yml:13`), `DESIGN.md:225` and `:456`, `answers.ts:2`, the HELP rows, `docs/views.md`'s `## Session`, the `allow-duplication.txt` line, and the `behavior.yml` and `options.yml` sentences are all as asked. The stale-name grep finds nothing.

Cases:

- 1: met. CASE 1 on both trees gives Session and Files tabs. RENDER gives `["details","changes","agents"]`, all open. The arrangements test passes on both trees, so it shows nothing about this change.
- 2: met by reading. One picker, and one `record` handed to every body. The pick on the page is left to the landing look.
- 3: met. `RENDER no session [[],false]`, and the `{#if record === null}` branch.
- 4: met. CASE 4 on both trees, and a second tab keeps its own state. The reload is left to the look.
- 5: met by reading and by the kept-order RENDER line. The drag and Alt+Up are left to the look.
- 6: met by reading. `ChangesRepository.svelte:130-159` carries all six shapes, and `AskConfirm` is at `:186`. The presses are left to the look.
- 7: met by reading. The interval is in `AgentRows.svelte:45` and the listing in `ChangesRepository.svelte:58`, and both unmount while closed. The counts on the page are left to the look.
- 8: met by reading. The toolbar holds `pin('transcript')` and `pin('timeline')` only. The armed Resume run is not verifiable here, because it needs a scratch oculus, which neither builder nor reviewer runs.
- 9, 10, 11, 18: met. G29 rows 1, 2, 3 and 4, and 7 fail on the unchanged tree and pass after.
- 12: met. G29 row 5 passes on both trees.
- 13: met. CASE 13 and `card.ts:21`.
- 14: met. CASE 14 shows the registry holds neither view. The palette was judged by reading only.
- 15: met by reading and by the type check. The drawing is left to the look.
- 16: not verifiable here. Only a page shows a 200 px pane.
- 17: met by reading for the structure: one `TreeView` per section, and level-2 rows. Tab order on the page is not verifiable here and is left to the look.
- 19: met under the ruling. CASE 19 previous and layout, on both trees.
- 20: met. Both registrations are present, the toolbar opens both, and `layout.yml:64` is unchanged.
- 21: met. CASE 21 chord `["m",["session-list","terminal","transcript","timeline","session-detail"]]`.

Closures checked:

- B1 is closed by a fix, with no check removed (point 1 above).
- St1 is closed. The head comment, `layout-saved.test.ts:1-4`, follows round item 2.
- St2 is closed. The describe title is `layout-saved.test.ts:40`.
- S1 is closed: the ruling is applied and stated.
- S2 is closed per the ruling, but the merge it leaves is finding 2.
- B2 is stated (list item 6).
- B3 is stated (list items 7 to 11).
- P2 is closed: commands and files are quoted.

No fix reaches beyond its finding. The delta touches only `migrate.ts:40-43,63,67`, `saved.ts:554-558` and the test file.

### Findings

1. Behaviour. Place: `src/lib/views/sessions/session-detail/ChangesRepository.svelte:46-56` and the report's section "Host- or user-visible changes, before and after".
   - The quoted hunk: `if (gate.due([state])) void load(root);` and `` fetch(`/api/git?root=${encodeURIComponent(root)}`) ``.
   - What is wrong: two visible changes of the whole diff are not in the list.
     - (a) A Session tab now asks `/api/git` for the workspace's branches and draws the repository whenever it is shown with a readable repository and Changes open. Every section starts open, so this happens by default. It applies to tabs opened by `SessionList.svelte:212`, `context.ts:750` and `CardSessions.svelte:46`. Before, the Session view never read git: `grep -rn "api/git\|gitFor"` over the base `session-detail/` prints nothing. Only a shown Changes tab asked.
     - (b) The Views catalogue and the palette's view commands no longer offer Changes or Agents. This is in the cases table (case 14) but not in the list that the look reads.
   - Failure scenario: the landing look checks only the listed items. A Session tab opened from a project card now starts a git listing on the server for its workspace, and nobody looks at that. A reader who used to open Changes from the palette finds no entry, and the report never told them.
   - Verdict: none. Item 1's text holds, and the omission is in the report.

2. Spec, for the orchestrator's shared-paths record. Place: `src/lib/state/workbench/layout/saved/saved.ts:557-558`.
   - The quoted hunk: "the arrangement is still the one the viewer left. A saved `changes` or `agents` tab is / carried to a `session-detail` tab by the same step."
   - What is wrong: the state file's D47 `shared_paths` names `saved/saved.ts` as "D57 lines 18, 372, 556-557, 604; D47 lines 526 and 562 ... different lines". The round-1 sentence that round item 5 asked for sits on base line 557, which D57 rewrote on main (8505da5e1: "empty added pane: the / rest of the arrangement is still the one the viewer left."). `diff3 -m` of the worktree, base and main copies stops with conflict markers at 556-567. The other files D47 modifies that main changed since the base, `DESIGN.md` and `instances.ts`, merge cleanly (diff3 exit 0).
   - Failure scenario: the cherry-pick at landing stops on this paragraph. The ledger tells the orchestrator to expect a simple merge. The hand merge is main's paragraph followed by the one sentence, rewrapped at 100 columns.
   - Verdict: none.

3. Proof. Place: the report's section "The cases' first run", the paragraph after the commands.
   - The quoted hunk: "The first run before any edit is in `$TMPDIR/d47/out-first.log`, produced by the same `cases.test.ts` and the same config run in the worktree before the first change; the output below is the rerun on the unchanged-tree copy, the same lines."
   - What is wrong: `out-first.log` (written 13:51:13) ends with eight `RENDER ...` lines, such as `RENDER all open order ["details","changes","agents"]`. Only `render.test.ts` prints those lines, it was created at 13:51:00, and it renders the new sections of the changed tree. The file also lacks the round-1 CFG and PROTO lines, so it was not produced by the same `cases.test.ts`. `diff <(sort out-first.log) <(sort $TMPDIR/d47-base-cases/out.log)` differs in exactly those lines. The CASE lines do match the unchanged-tree rerun, which I reproduced, so no decision rests on the inaccurate description.
   - Failure scenario: a reader treats `out-first.log` as a first run on the unchanged tree and reads its RENDER lines as the base's behaviour.
   - Verdict: none.

### Declined to judge

- The page-only halves of cases 2, 5, 6, 7, 8, 15, 16 and 17, and of 1, 20 and 21 on screen. They belong to the look, since no reviewer runs oculus or a browser.
- The armed Resume run of case 8. It runs on a scratch oculus only.
- Whether the Changes-section git listing in finding 1 (a) is wanted, or should wait until the section is in view. That is a design call for the orchestrator. The finding asks only that it be stated.
- Whether the it.each title "carries a retired view's saved tab to its successor: $name" should read differently for the rows that hold no retired tab (rows 5 and 6). The brief named that title.
- The `:global(body.rice) .session` rule (`SessionDetail.svelte:189`) sets the monospace face on the section heads of the Session view, which the Files view's heads do not get. It is a theme detail for the look.

Reviewer usage: agent id not known to me, claude-opus-5-5, tokens not known to me, about 45 tool uses, about 25 minutes (not measured).

## Closed

- S1: closed in round 1 (round item 4); the run over round 1 reproduced case 19 under the ruling on both trees.
- S2: closed in round 1 (round item 5); the merge with D57's line 557 on main that the sentence leaves is round 1 finding 2.
- S3: closed by the orchestrator in the state file: `config/behavior.yml` and `config/catalogs/options.yml` are recorded in D47's `shared_paths`.
- P1: no change needed; the reviewer read the rows in full and named no defect.
- P2: closed in round 1 (round item 8); every scratch run is quoted with its command and its file, and the files exist.
- St1, St2: closed in round 1 (round items 2 and 3).
- B1: closed in round 1 (round item 1), by `successorOf` with a G29 row; no check removed.
- B2: closed in round 1 (round item 6), kept as built and stated with its before and after.
- B3: closed in round 1 (round item 7), items (i) to (v) stated.
- Round 1 finding 1 (Behaviour): closed at landing. The landing report and the booking state both changes with their before and after: a shown Session tab with Changes open asks `/api/git` for its workspace's branches and draws the repository, where before the Session view never read git; the Views catalogue and the palette no longer offer Changes or Agents. The look checks the Session tab's repository block.
- Round 1 finding 2 (Spec): closed at landing. The cherry-pick's conflict in `saved.ts`'s comment paragraph is merged by hand as main's paragraph followed by the one sentence, rewrapped to the comment width; D47's `shared_paths` record is corrected in the state file to name the shared line 557.
- Round 1 finding 3 (Proof): closed at landing. The booking states that `$TMPDIR/d47/out-first.log` holds the CASE lines of the first run on the unchanged tree followed by RENDER lines of the changed tree from `render.test.ts`; the CASE lines match the unchanged-tree rerun, and no decision rests on the RENDER lines there.
