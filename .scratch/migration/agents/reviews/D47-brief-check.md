D47 brief check: one Session view (brief `tools/oculus/.scratch/migration/agents/briefs/D47.md`, main at 23a7b5e90)

Nothing was changed. Every command below was run from `/Users/axelfaes/workspace/research-hub` or its `tools/oculus`.

## Names

The brief's own grep was rerun: `grep -rn "session-detail\|'changes'\|'agents'" src config docs HELP.md DESIGN.md README.md --exclude=local.yml`. It reproduces every hit the brief lists. It also prints one hit the brief leaves out, which is about these views:

- `DESIGN.md:225`: `type ViewId = ... | 'timeline' | 'changes' | 'agents' | 'customization'`. The step makes this false, and DESIGN.md:225 is not in the write list.

Wider greps were run: `git grep -n -e "sessions/changes" -e "sessions/agents" -e "SessionDetail" -e "SESSION_VIEWS" -e "list-drag" -e "Section.svelte" -e "views.md#changes" -e "views.md#agents" -e "session-detail"`, then `grep -rn "Changes view\|Agents view\|Changes tab\|Session detail\|the Changes\b\|Changes rows" ...` and `grep -rnw -e changes -e agents config --exclude=local.yml`. They print these hits outside the write list:

1. `DESIGN.md:456` names the path `src/lib/views/sessions/agents/Agents.svelte` as one of the page's clock timers. It becomes false when the file moves.
2. `HELP.md:43` reads `| m1-m7 | open a view of the Sessions page's group |`, and `config/text/app.yml:13` holds the same row (`m1-m7 | open a view of the Sessions page's group`). The sessions group today has seven views: session-list 0, terminal 1, transcript 2, timeline 3, session-detail 4, changes 5, agents 6 (`grep -rn "order:" src/lib/views/sessions`). After the step it has five, so both rows become false and m6 and m7 stop opening a view. The write list names `HELP.md` only at lines 134, 138 and 139, and `app.yml` not at all. `app.yml` is also in D46's write list, and D46 is in flight.
3. `config/catalogs/glyphs.yml:95` (`changes: "+/-"`) and `config/catalogs/icons.yml:94` (`changes: git-branch`).
   - Today the glyph `changes` has exactly two readers: `sessions.changes_glyph: changes` (`changes.yml:91`) and the value `changes` in `config/layout.yml:65`. Running `grep -rniE "(glyph|icon)...(changes|agents)" src` plus the `<Glyph name=` and `G.` forms finds no other.
   - The step removes both readers. `tests/checks/config/config-folder.test.ts:451` ('names a glyph only where the source or another config file reads it') will then fail unless the glyph is removed from glyphs.yml and icons.yml, and both files are outside the write list.
   - The glyph `agents` stays, because `src/lib/shell/status/StatusBar.svelte:266` reads it (`glyph="agents"`).
4. `src/lib/state/sources/repositories/answers.ts:2` says "the branches the Changes tab lists". It becomes false, since no Changes tab will exist.
5. Several places say "the Changes panel":
   - `src/lib/views/shared/changes/ChangeGroups.svelte:2` ("the Changes panel of the session views")
   - `src/lib/state/sources/repositories/repositories.ts:13` and `:768`
   - `src/lib/views/shared/changes/repo-shape.ts:3`
   - `src/lib/views/sources/repositories/Repo.svelte:21` and `:258`
   - `DESIGN.md:571`

   The step does not make any of them clearly false, since the Changes section is still a panel of the session. The brief does not list them for the "still true / rewritten" part, which spec.md:68 requires.
6. `config/text/views/sessions/changes.yml:90` (`changes_bar`) and `agents.yml:14` (`agents_bar`) are bar labels read only by the bars of Changes.svelte:146 and Agents.svelte:108, and those bars go. The brief's key list at line 37 names only `changes_glyph`, `agents_glyph`, `view_changes` and `view_agents`. G24 (`keys.test.ts`) will flag both `_bar` keys.
7. These hits are covered by the write list or are still true, as the brief says: `card.ts:21-27`, `layout.yml:65`, `HELP.md:134/138/139`, `docs/views.md:159-181`, `config-folder.test.ts:264-268`, `allow-duplication.txt:23`, `docs/source-control.md:23`, `DESIGN.md:472`. The same holds for these three, which are true after the step:
   - `src/lib/views/shared/explorer/tree/Failed.svelte:2` ("drawn by the sections of views/sources/files/sections/")
   - `src/lib/views/sources/files/Files.svelte:38`
   - `config/text/views/sessions/session-detail.yml:1`

   The head comments of the moved files (`Section.svelte:2`, `list-drag.svelte.ts:1-2`) are covered by What to build 5.
8. `npm run diagrams` (Verify 1) rewrites `docs/diagrams/layer-views.dot` and `.svg`. `layer-views.dot:34-37` counts the imports of `folder views/sessions` (18 to views/shared, 99 to state, 84 to ui), and the step changes those counts. `docs/diagrams/` is outside the write list.
9. `src/lib/state/workbench/layout/saved/saved.ts:45`, `:526` and `:562` call `treeWithoutConfig` and `withoutConfigTabs`. Renaming or widening them reaches saved.ts, which is outside the write list and also in D57's write list (D57 is in flight).

## The step line

The plan line (`plan.md:703`) and the ruling quote (`plan.md:1607`, item 2) match the brief at lines 11 and 13 exactly.

- "one Session view: Session detail, Changes and Agents merged into one view": What to build 1 and 3.
- "with three collapsible sections": What to build 1 and 2.
- "built as the Files view's sections are": What to build 2.
- "Transcript and Timeline stay their own views": only partly served. What to build 3 keeps their two toolbar buttons. No requirement states that the `transcript` and `timeline` registrations and the `[transcript, timeline]` pane at `config/layout.yml:64` stay as they are; the brief leaves that implicit.
- "the Sessions arrangement in `config/layout.yml` follows": What to build 4.

No part of the step line is left without a requirement.

## Premises

Rerun or re-read; these match the brief:

- `wc -l` prints 499, 240, 171, 144, 190, 73, 99, 172, 230 and the yml files 45, 103, 16.
- SessionDetail: registration at 5-11, `record` at 76, `panePin` at 77, the toolbar at 221-247, `pin` at 148-151, the picker at 250-254, the Pane at 256-405, and `toolbar=` at 258.
- Changes: `record` at 46, the bar at 145-149, `AskConfirm` at 215, the six shapes.
- Agents: `record` at 53, the bar at 107-111, the `$effect` ending at 70.
- `selection.svelte.ts:29-31`, `views.ts:45`, `registry.ts:168-172`, `boundaries.test.ts:284-288`, `Files.svelte:134-152`, `Debug.svelte:46-50`.
- The importers of Section and list-drag, including `clangd/ClangdSection.svelte:8,13` and `clangd/props.ts:6`.
- Folder sizes by `git ls-files | cut | sort -u | wc -l`: shared 10, explorer 9, sections 9, sessions 8, session-detail 1, ui/tree 10, saved 6.
- guarded.md lines 74-76 (G29), 80-82 (G31), 188-190 (G54), 204 (G24) and 209 (G12/G13).
- The text keys at changes.yml:91 and :103, agents.yml:15 and :16, session-detail.yml:15.

These do not match the brief:

- Line 33: `CardSessions.svelte:46` calls `openBeside('session-detail', ...)`, not `openView`.
- Line 26: SessionDetail reads the pin as `pinnedSession(instanceLayoutState(instance.id))` (line 77), not `pinnedSession(instance.state)`.
- Read item 5 says "`saved/load.ts` where it calls it". `grep -n "treeWithoutConfig\|withoutConfigTabs" -r src` shows that only `saved.ts:526` and `:562` call the migration. `load.ts:67` and `:96` call `parseLayout`, and `load.ts:98` reads the pre-pages workbench through `parseWorkbench` (`saved.ts:634`), which runs no migration at all.
- Line 54 says G54's test is `tests/checks/config/arrangements.test.ts`, but guarded.md:190 says "written by Q125 ... named in Q125's landing report". The file exists and has one `it.each` per arrangement, so this holds in practice.
- Line 19: the base copy `.agents/worktrees/D47-base` does not exist yet (`ls` prints "No such file or directory"). That is expected if /spec creates it after this check, but it was not verifiable here.

## Cases and checks

These are inconsistent with the rules file (spec.md):

1. Case 9 says "a test row in layout-saved.test.ts". The G29 test file has one `it` ('migrates every page, and reads which one was current', `layout-saved.test.ts:23`) and is not a table.
   - spec.md:57 says a test exists only when guarded.md names it by file and title, and the builder never edits `.scratch/`.
   - A new `it`, or turning line 23 into an `it.each` with a new title, needs the guarded.md G29 line changed by the orchestrator. The brief does not say who does that.
2. Cases 10, 11 and 12 are outcomes of the same unit (the saved reader's migration, under G29). spec.md:57 asks for "one row per input that gives a different outcome", but brief line 70 makes them scratch runs.
3. G29's text (guarded.md:74) is "read into the current one with every page and tab kept". Case 9 and What to build 3 drop a tab. This conflicts with the entry's wording; the existing `config` drop already conflicts with it too. The orchestrator should reword G29 or name the exception.
4. Case 17 says "the heads are reached by the arrow keys of the section tree as in the Files view".
   - In the Files view each section is its own `TreeView`, one focus stop each: `grep -c "<TreeView"` prints 1 for Notes, Bookmarks, Outline, OpenEditors, Timeline and ClangdSection.
   - `Section.svelte:57` gives every head the fixed id `"head"`, so three heads cannot share one tree.
   - As the Files view behaves, heads are reached by Tab, one tree each, and arrows move only within a section. The case's expected result does not match the model it cites.
5. The Verify list misses tests for files the step changes (spec.md:57, "A step whose change touches an entry's code runs that entry's test"):
   - `tests/checks/config/config.test.ts` (G12, "held whole", guarded.md:157). G12's code is `config/`, and the step changes `config/layout.yml` and `config/text`.
   - `tests/checks/tree/duplication.test.ts` (G21). The step edits its allow list, and `allow-duplication.txt:10` says an entry goes when its clone stops, which this test fails on.
   - `test:quick` leaves out `tests/checks` (`quick.mjs:23-24`). The checks that the moves and the new comments touch therefore run only at landing: size (G20, SessionDetail at 499 lines), history (G22), comment width (G23), import order and cycles (G17/G18), and diagrams (G25).
6. Cases that ask the builder to check a place the step does not change:
   - Case 14: the Views catalogue and the palette are read from the registry.
   - Case 13: `CardSessions.svelte:46` is not changed. `card.ts`, which is changed, is the only moving part.

Each case was read against the rules file. The rest are consistent, with look-only cases handed to the landing look as spec.md:62-63 require. One more cost: case 8's "resume (armed then run)" on TEST actually resumes a real session (`resumeTerminal`, `SessionDetail.svelte:199`).

## The question (could it pass without the goal being reached?)

- **Case 1:** yes for the test. `arrangements.test.ts` passes on the unchanged tree, because changes and agents are still registered there. Only the scratch parse shows the new tab list, and only the look shows the sections open.
- **Cases 2, 4 and 5:** yes. None of them combines a pick with a closed or reordered section. `pinInstance` and `unpinInstance` replace the tab's whole state (`instances.ts:138` `restateInstance(id, { session, label })`, `:164` `restateInstance(id, {})`). So picking a session in the bar wipes the closed list and the order, while each case passes on its own.
- **Case 3:** no.
- **Case 6:** yes in practice. Staging the unplaced, missing and failed repository shapes on TEST is not described, so those rows may end up "checked by reading".
- **Case 7:** yes in practice, if no agent runs at look time. The case does not say what a closed Agents section does with its timer.
- **Case 8:** no.
- **Case 9:** no, provided the row's assertion includes the active tab.
- **Cases 10-12:** scratch runs, so they leave no lasting proof.
- **Case 13:** yes. It passes before and after the change, because `session-detail` is already in `SESSION_VIEWS`. It cannot detect whether `changes` and `agents` were removed.
- **Case 14:** no.
- **Case 15:** yes for the runs. Only the type check and the look reach it.
- **Cases 16 and 17:** case 17's expectation is wrong (above).
- **The step line's check:** yes. Nothing checks that Transcript and Timeline stay registered and arranged.
- **What to build 1:** yes. The per-control list in the report is self-declared, and only the look and the reviewer's reading test it.
- **What to build 2:** partly. Files is unchanged only by the look. Persistence is broken by a pick (above).
- **What to build 3:** the `SESSION_VIEWS` change has no check that can fail (case 13).
- **What to build 4:** proven only by the scratch parse, not by G54.
- **What to build 5:** G24 forces the unread keys out. The glyph orphan forces edits outside the write list (Names 3). The docs are checked by reading.

## Implied inputs

Missing inputs, each with its expected result:

1. **Pick, pin or unpin in the bar after a section was closed or reordered.** Expected: the closed sections and the order stay. Today `instances.ts:129-139` and `:163-165` overwrite the state. `instances.ts` is outside the write list and inside D57's. It costs the step's own persistence promise (What to build 2).
2. **Details has no count.** `Section.svelte:24` declares `count: number`, which is required, and `TreeItem.svelte:242` draws any defined count. Expected: no count on the Details head, which needs `count?:` in the moved Section.
3. **Section content is not tree rows.** `Section.svelte` requires `nav` from a `TreeView` and draws children in `ul role="group"` as `li role="none"` rows (`TreeSection.svelte:77`). Details holds inputs and buttons, and Changes holds the commit box. The brief does not say whether each section is its own `TreeView`, as in Files, or how non-row content sits in the group. Expected per Files: one `TreeView` per section, with Tab between sections.
4. **A saved pane holding `changes` and `agents` with the same pin and no `session-detail` tab.** Expected: one Session tab (the first carried, keeping its id), the other dropped, and the active tab moved to it if needed. What to build 3's rule ("a pane that also holds a `session-detail` tab") does not say whether a tab carried within the same pane counts.
5. **The pre-pages workbench under `PREVIOUS_KEY`** (`load.ts:98-109`, `parseWorkbench`) runs no migration, so a `changes` or `agents` tab there draws as an unknown view. Expected: carried like the others, or stated out of scope. The same gap exists today for `config`.
6. **The Changes section closed while its branch listing is in flight or the repository changes.** `Changes.svelte:62-74` lists branches through `shownGate`. Expected: no `/api/git` fetch while closed, and one list on reopen. Not stated.
7. **The Agents timer while its section is closed.** Expected: no interval runs, which follows if the rows unmount, as `TreeSection.svelte:76` draws children only while open. `DESIGN.md:456` names this clock.
8. **The session dismissed while shown.** Expected: `PickSession`, no heads, and the closed and order state kept in the tab. Not stated.
9. **The chords m6 and m7** (`HELP.md:43`, `app.yml:13`). Expected: the rows read m1-m5. Not stated.
10. **The names of the new state keys** (the order and the closed list). Files uses `sections`, `collapsed` and `opened`; Debug uses `closed`. The brief picks neither. The keys must not collide with `session`, `label` or `id`, which `stateId` (`instance.ts:132-141`) reads.
11. **Apps:** `open({ view: 'changes' })` would now answer `missing` (`docs/apps.md:457`). `git grep -nE "view: ?['\"](changes|agents)['\"]"` finds no app that does this, so there is no finding.
12. **Floats, two Session tabs, a narrow pane, the Views catalogue and the palette** are covered by cases 4, 11, 16 and 14.

## ADRs

There are none. `.agents/plan.yaml` has no `adr` key (`cat .agents/plan.yaml`). `find /Users/axelfaes/workspace/research-hub -name adr -type d -not -path '*/node_modules/*'` and `find tools/oculus -iname "*adr*"` print nothing. `ls tools/oculus/docs | grep -c glossary` prints 0, so the "no glossary" line holds.

## Dictated text

- `grep -n "view: \[session-detail, { view: files" D47.md` finds line 64: `view: [session-detail, { view: files, state: { follow: true } }]`. Holds: it is ASCII, one line, and keeps the flow form of `layout.yml:65`.
- `grep -n "named Details, Changes and Agents" D47.md` finds line 118, which gives the section names Details, Changes and Agents. These hold. However, "Details" needs a new catalog key, while What to build 5 (line 66) says the text files "keep their names and their keys". That is an internal tension, not a rule break.
- Line 171: "Everything in the brief is done". Holds.
- Line 175: "no glossary". Holds.
- `LC_ALL=C grep -n '[^ -~]' D47.md` prints nothing, so the brief is ASCII.

## Declined to judge

- The base copy and `unused-exports.txt`: they do not exist yet, so nothing in them was checked.
- Whether `git grep` hits outside `tools/oculus` (the hub docs) name these views: I searched the whole repository only for the patterns in Names and found none outside `tools/oculus`, apart from `.scratch` ledger history, which is not product text.
- Whether the "Changes panel" comments (Names 5) should be rewritten or marked still true: that is a wording judgment for the orchestrator.
- Whether D57's in-flight changes to `instances.ts` and `saved.ts`, and D46's to `config/text/app.yml`, merge simply with what D47 needs there: that is the orchestrator's shared-paths judgment.
- Whether `views/shared/explorer/sections/` is the right home: I checked only the folder counts and the boundary rule, not the design merit.

Usage: about 55 tool calls; token count not measured.

## Closed

Closed by the orchestrator in `agents/briefs/D47.md`, with Z745 (`plan.md` Rulings, `choices.md`).

- Names 1: `DESIGN.md:225` and `:456` added to the premises, the text item and the paths.
- Names 2: `HELP.md:43` and the key sheet row of `config/text/app.yml:13` read `m1-m5`; case 21. `app.yml:13` is shared with D46 (the same line, different words), merged by hand at the later landing.
- Names 3: the glyph `changes` leaves `glyphs.yml:95` and `icons.yml:94`; Z745 (c).
- Names 4 and 5: `answers.ts:2` rewritten; the "Changes panel" comments listed and marked still true in the report.
- Names 6: `changes_bar` and `agents_bar` among the keys removed.
- Names 8: `docs/diagrams/` in the paths.
- Names 9: the migration functions renamed, their two calls in `saved.ts` (526, 562) in the paths; Z745 (b).
- Premises: `openBeside` at `CardSessions.svelte:46`; the pin read as `pinnedSession(instanceLayoutState(instance.id))`; the migration's callers corrected to `saved.ts:526/562`, and the pre-pages workbench carried through it (case 19). The base copy is made after the check.
- Cases and checks 1 to 3: case 9 is a new `it.each` beside G29's `it` with rows for cases 9 to 12 and 18; G29's text and Test line updated by the orchestrator at landing; Z745 (f).
- Cases and checks 4: case 17 rewritten to the Files model (Tab between section trees, arrows within); Z745 (e).
- Cases and checks 5: verify 2 adds `config.test.ts`, `duplication.test.ts`, `size.test.ts` and `npx vitest run tests/checks`.
- Cases and checks 6: case 13 now reads `SESSION_VIEWS` after the change; case 14 kept as a regression of the registry; case 8's resume runs on a scratch oculus only.
- The question: cases 2, 4 and 5 gain the pick-after-close run; `instances.ts` keeps the tab's other state, Z745 (a); case 6's unstageable shapes are read; case 7 and its Changes twin cover a closed section; case 20 covers Transcript and Timeline staying.
- Implied inputs: 1 by Z745 (a); 2 `count` optional; 3 one `TreeView` per section with non-row content in the body; 4 case 18; 5 case 19; 6 and 7 case 7; 8 What to build 1; 9 case 21; 10 decision 11 and Z745 (g).
- Dictated text: Details gets the new key `sessions.section_details`; What to build 5 says so.
