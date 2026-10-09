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
