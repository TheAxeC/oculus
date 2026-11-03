# Step O123 refuter report (on .agents/worktrees/migration-O123, base 3e2595261)

A page this report cites (the rules file, a standard, a skill's text) is named with its section, never with a line number, since a page's lines move and a section's name does not. A finding in code keeps its `file:line`.

The report is written in the rules file's character set. A character outside it in a quoted line is written by its name in angle brackets, such as `<tab>` or `<em dash>`.

## Verification (rerun by the reviewer)

```
$ npm run test:quick -- --base 3e2595261     (PATH with node v24.21.0, exit 0)
ok      prettier (7.0 s): All matched files use Prettier code style!
ok      ASCII gate (7.5 s)
ok      svelte-kit sync (12.0 s)
ok      eslint (14.3 s)
ok      svelte-check (48.8 s): 1793661304050 COMPLETED 582 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest (146.9 s): Duration  85.04s (transform 121.06s, setup 0ms, import 271.20s, tests 15.98s, environment 12.26s)
ok      vitest slow (148.8 s): Duration  86.19s
ok      vitest checks (183.7 s): Duration  121.54s
test:quick: 197.4 s; every command passed
test:quick: not covered: tests that reach no changed file within the import depth, other than the checks under tests/checks/source and tests/checks/tree, which run for any change under src, tests or utils; the build, the lint of unchanged files
No failure in any file, so no timing failure to quote.

$ LC_ALL=C grep -n '[^ -~]' over every changed and new non-svg file and the report
prints nothing, exit 1
$ grep -c on the four svgs the brief names
0 each

$ grep -rnEi --exclude=local.yml 'sessions page|page: sessions|(^|[^a-z])m Sessions' src config/defaults docs/HELP.md README.md
prints nothing, exit 1

$ git diff --stat -- package.json package-lock.json
prints nothing, exit 0

$ sh utils/unused-exports.sh, compared with ../O123-base/unused-exports.txt
337 lines each, diff exit 0

$ grep over added comment and title lines for the banned history words
two hits, both order and not history: session-list.ts:5 "its kind before its key", session-marks.svelte.ts:2 "before the write lands"

$ grep -rn "views/sessions/session-detail/[A-Za-z]" outside SessionDetail lines
exit 1
$ grep for arrangements\.sessions|group: 'sessions'
exit 1
$ grep for chord: m
exit 1
$ grep for rail: 'sessions'
tests/state/workbench/layout/saved/layout-saved.test.ts:107 only (saved-layout fixture)

$ npx vitest run tests/state/sessions/terminal/reading-tab.test.ts tests/data/sources/config/workspace-layer.test.ts --reporter=dot
Test Files  2 passed (2)
Tests  41 passed (41)

$ sh utils/folder-check.sh
exit 0

$ wc -l
context.ts 880, terminals.svelte.ts 848 (base 878), SessionList.svelte 466 (base 460), composer.ts 545, Customizations 312, as the report says

$ ls of the folders
views/shared/sessions/sections holds ten items; views/shared/sessions holds nine

$ git show 3e2595261:config/defaults/layout.yml | grep
sessions: at line 41, explorer: at line 85

$ grep entities.message src/lib/.../context.ts
line 175, matches channels.dot

$ git status --short | wc -l
60 before my runs and 60 after them
```

## Verdicts

Items of the brief's "What to build", in its numbering:

- 1: holds by reading. One `TreeView`, `TreeSection id={LIST_FOLD}`, ten-row `.fold`, `keepShown`, `sessionOfTerminal`, Alt+Up ignored (zag's handlers return on `isModifierKey`), `NameField` stops key propagation, `onpressagain` as the brief names it. Two defects are in how this behaves rather than in what was built: Behaviour B1 and B2.
- 2: holds. The nine moved files differ from the base only in head comments (`diff` against the base copy), `SessionSections.svelte` is new, both owners draw it, and `owner` state is in place.
- 3: holds. A row is one line, with the words moved to `sessionRowWords`.
- 4: holds. `pick` is `select(row.id); openSession({ session: row.id, label: row.title, press: true, documents: true });`, `pressTarget` picks the tab, no session-detail open remains. `show` for another page's terminal is unchanged.
- 5: holds. Rail entry, arrangement and chord are gone (greps above). Explorer orders are Files 0, Repositories 1, Sessions 2, Search 3, LaTeX 4, Terminal 5, Problems 6, References 7, Debug 8, Debug Console 9, Notes Graph 10, Session 11, with no duplicate. `keyOf` gives s1 to s9.
- 6: holds. `layout.yml` shape read, `opened: true` per ruling 5 read by `registerOpened`, `landingFor` reasoned for Explorer and for a workbench. An arrangement pane left empty stays.
- 7: holds, both paragraphs. `startOf` `TERMINAL_VIEW` case, `folderOf`, `pageFolder`, `startInTab`, `pinned` in `tabs()`, test rows. The wider reach of `composerTab` is Behaviour B3.
- 8: holds. `repositories` and `problems` take `rail: false`, `session-list` stays `rail: true` with `tone: 'amber'` (`SessionList.svelte:18`), `rail.ts` `urgentTone` reads it, StatusBar unchanged.
- 9: violated in part, Standards ST1 and ST3. The sentences the brief lists are done; these are other sentences the change made false.

Cases of the brief's "Cases":

A page case below is by reading; the look at landing proves it.

- Explorer on a new page: met by reading.
- 200 sessions: met by reading (ten-row fold, scroll).
- Row height: met by reading.
- Tab reaches the list once: partial, the fold can be a second Tab stop, Behaviour B2; the look settles it.
- Presses, one tab retargeted, two presses: met, `reading-tab.test.ts` passes (41 passed above) plus reading.
- Terminal row, resume, fork, by-hand start: met by reading.
- Reload: met by reading.
- Closing and reordering: met by reading. `withShown` keeps the state. Drag marks are per list with a random type, so a drag across lists is no drop, which settles the report's "Not verified" on it.
- File opened from a row: met by reading.
- Details transcript control and an Agents row (ruling 2): met by reading.
- Row menu Pinned, and the notice: met by reading.
- Workbench: met by reading (Reset through `make` and `resetFolderPage`).
- Pinned tab whose last terminal ended or moved out: met, the new `it.each` rows 'ended' and 'moved out' pass.
- Badge, two waiting and 37 changes: met by reading. The Explorer rail badge is amber through `countPart`; the Repositories tab keeps its count.
- Status bar: met by reading.
- Debug start: met by reading.
- Find All References: met by reading.
- Narrow tab: met by reading.
- Rename: partial. The field fits the row; opening and closing it have Behaviour B1 and B4. The look settles B1.
- Wallpaper: not verifiable; the look settles it.
- No session: met by reading.
- Saved page: not verifiable; the orchestrator's data edit at landing, then the look, settles it.

Points named in the task:

- `session-list/session-marks.svelte.ts`: needed. `SessionList.svelte` at 466 plus about 80 moved lines would pass the 520 limit. The logic equals the base's `mark` (`if (writing[key] === 1) forget`, hold in `finally`), and a head comment is present.
- `terminal/latex-target.ts`: needed. Base 878 plus `folderOf` and `moveToNewTab` would pass 880. It is a split by concern, every importer is client state, and the store's re-export is kept for three importers.
- `selection.svelte.ts`: needed, a comment only; the tab now follows through `keepShown`.
- `SessionRow.svelte`: needed, a comment only; the two removed clauses had become false.
- `Terminal.svelte`: needed, a head comment stating the pinned rule.
- `README.md`: needed, the rail bullet of item 9.
- `workspace-layer.test.ts`: inside the brief's "tests that name a changed arrangement", and needed since `arrangements.sessions` is deleted (`read.from['arrangements.explorer']`, line 74).
- The diagrams (channels, layer-state): generated from `context.ts` (174 to 175, import counts) and needed since the generator rewrites them. Checked only by `context.ts:175`; the generator was not rerun, see Declined.
- `GroupHead` `row.nav`: holds against ruling 1. The ruling says "an id and `nav`"; the type is structural (`nav: { row: (id, label) => Record<string, unknown> }`) because `tests/checks/imports/order.ts:75,77` places `ui/tree` above `ui/controls`, and `order.test.ts` also names a type-only import. `TreeNav` is assignable. No finding.
- `attached` beside `draft`: needed, no finding. Without it a returned mention loses its Codex file (`Composer.svelte:266-267` passes it to the start). It is a saved-record key beyond ruling 4; the report states it under judgment calls and in its before and after table, so it is disclosed. Per-keystroke writes are no finding, since `page-state.svelte.ts` gathers them (`GATHER_MS`).
- `composerTab`: needed for ruling 4, since `pageTarget` (`terminal-tabs.ts:426`) skips a reading tab, so New would open a second tab with the draft hidden. Its reach beyond New is Behaviour B3.
- `sed -i` on `docs/HELP.md`: Spec S1. The sentence it wrote is correct (label `sessions.open_pinned`, `session-list.yml:42`). All HELP hunks were read and nothing else moved.
- The test with no failing line on the unchanged tree: the `workspace-layer.test.ts:74` line preserves behaviour. It passes after the change (run above) and, by reading, on the base, where `explorer` is an arrangement. The report says so plainly and quotes the old line's failure. No finding.

## 1. Spec

- S1. `docs/HELP.md`, section on the session list, the Sessions bullet: "The row menu's Open in its own pane opens a Session tab in the documents pane."; what is wrong: the sentence was written with `sed -i`, a script with no approval; the brief says "No script is written" and the rules file's rule on scripts covers it; failure scenario: a program edit lands in a doc with no hunk read by the one who ran it, the same route by which a wider pattern would change other lines; here the read shows it changed only this sentence; verdict: item 9 stands for this sentence, closes under the ruling "Unapproved builder scripts" in `plan.md`: the breach recorded in the booking, the builder lists every such command and the files it changed in its repair round, the orchestrator reads each hunk. Never an open item.

## 2. Proof

None. Every command the report quotes that could be run read-only reproduced. The two that could not are under Declined.

## 3. Standards

- ST1. `src/lib/state/workbench/layout/open/opening.ts:10` "a view opened for something (one registered with no catalogue group)", `opening.ts:155` "`opened` says ... which the registry answers: a registration with no catalogue group.", `src/lib/state/workbench/layout/open/landing.ts:3` "which are the views registered with no catalogue group.", `landing.ts:21` "Whether a pane holds a tool view: a tab of a view with a catalogue group that the page did not receive as a document."; what is wrong: ruling 5 gave `session-detail` a group and `opened: true`, so the sentences are false; the rules file makes a sentence the change made false a defect, and item 9 covers comments naming a group; `opening.ts` is a file this step changes; failure scenario: a reader adding an opened view takes the comment as the whole rule, gives it a catalogue group, leaves out `opened`, and a document lands beside the bottom pane; verdict: item 9 violated.

- ST2. `src/lib/views/sessions/session-list/session-list.ts:1-3`: "Session-list menu builders live here because row actions change independently of the parent view and are unit-tested without a DOM, as do the rows the list's tree walks (`listRows`) and the hover words of a session row (`sessionRowWords`)."; what is wrong: `grep -rln "listRows\|sessionRowWords\|session-list/session-list\|sessionRowItems\|filterGroups" tests` exits 1, so no test exists for the file, and the sentence extended by this step claims one; failure scenario: a reader changing `listRows` trusts a unit test that is not there; verdict: item 9.

- ST3. `docs/HELP.md`, section Workbenches, second bullet: "What you open from a list lands in the documents pane above it, never in the bottom pane." and "Files keeps its Follow control; no default tab follows the selection."; what is wrong: the first sentence is false for the Sessions list, whose press shows in the bottom Terminal tab; the second is false for the Sessions tab's sections, which follow the picked session; failure scenario: a reader of the help page expects a pressed session in the documents pane and looks there; verdict: item 9 violated.

- ST4. `agents/reviews/O123-report.md`, section "Number of full-list runs": three completed runs plus two started and stopped; what is wrong: `spec.md` Token discipline allows a run after the last change and one more after a red, and calls any run beyond that a finding; the second green run was not after the last change; failure scenario: the same allowance overrun in later steps costs a full-list run each time on a loaded machine; verdict: no item, a rule of the rules file. The report counts the runs itself, so this closes by recording it.

- ST5. `agents/reviews/O123-report.md`: there is no 'still true' or 'rewritten' list for the renamed and reworded things, and no quoted helper grep for `withDraft`, `keptOf`, `composerTab`, `pressTarget`, `moveToNewTab`, `listRows`, `groupRow`; what is wrong: `spec.md` asks for the list in the rule on changing a name, and in its principles for the grep before writing a helper; failure scenario: a reader cannot tell which sentences were checked, and ST1 is the sort of sentence such a list would have surfaced; a helper that already exists goes undetected; verdict: item 9 in part, and a rule of the rules file.

## 4. Behaviour

All four are by reading and not run. B1 and B2 rest on browser behaviour that I infer; the look settles each.

- B1. `src/lib/views/sessions/session-list/SessionWorkspace.svelte:142` with `src/lib/ui/tree/TreeItem.svelte:219`: "onpressagain={() => onrename(entry, null)}" and "onmousedown={(event) => { if (event.button === 0 && event.detail === 2) onpressagain?.(event); }}"; what is wrong: rename now opens on mousedown, where the base used `ondblclick`. Svelte flushes in a microtask after the handler, `NameField`'s `onMount` focuses the input, then the browser's default for that mousedown moves focus (its target has been removed, so to the tree box or the body). `onleave` is a no-op, so the field stays open with no focus. The other users of `onpressagain` (`FileRow.svelte:197`, `Problems.svelte:394`) open files and never mount a field, so they do not show this; the report does not state it; failure scenario: the reader double-presses a row and types a word; the letters go to the tree or nowhere, the field stays empty of them. The brief named `onpressagain`, so the fix belongs in the handler: `event.preventDefault()`, or focus after mouseup. Look: double-press a row, type a word; verdict: case Rename partial, item 1 stands.

- B2. `src/lib/views/sessions/session-list/SessionList.svelte`, `.fold`: "<li class="fold" role="none" data-session-fold>" with ".fold { max-height: calc(10 * var(--tree-row) * var(--text-scale, 1)); overflow: auto; ..."; what is wrong: the tree's one tab stop starts on the fold's head, outside `.fold`, and every row inside has tabindex -1. With more than ten rows, Chromium's keyboard-focusable scrollers (Electron 44.5.1 and current Chrome) make `.fold` a second Tab stop; the report does not state it; failure scenario: with 200 sessions, Tab from the Search box lands on the head, and a second Tab lands on the scroller, until focus has entered the rows. The fix is `tabindex="-1"` on the fold, as `Code.svelte:57` has on its `pre`. Look: 200 sessions, Tab from the Search box twice; verdict: case "Tab reaches the list once" partial.

- B3. `src/lib/state/sessions/terminal/composer/opening.svelte.ts`, `composerTab(on, documents)`, reached through `targetTab` by `composeAt` for places and for tasks as well as by `composeIn`: "`own = host.pageTab(tabs,on)`, else first page tab with `composerOf(...).draft !== undefined`, else `workbench.open(on, emptyTab(...), documents)`" (shape, not verbatim); what is wrong: `showComposer` and `showAt` do `liveTab(composingIn(tabState))`, which ends the tab's reading, and `composeAt` for a place or a task now takes a reading tab holding a hidden draft, where the base put a new tab beside it; `startedAt` keeps the draft, so a task start adds the old prompt to the seed. The report's judgment call states only New. Also, with a second Terminal tab that is not reading, New goes there and the draft stays hidden; failure scenario: the reader types a prompt, presses a session, then starts a task; the transcript they were reading goes and the old prompt is sent with the task's seed; verdict: item 7 stands, the reach is unstated and belongs to New only.

- B4. `src/lib/views/sessions/session-list/SessionWorkspace.svelte`, rename branch: "NameField value={entry.title} oninput={() => undefined} ... onleave={() => undefined}"; what is wrong: the base's document-level Escape `$effect` closed the field wherever focus was; now Escape closes it only with focus in the box. `value={entry.title}` follows the channel while typing, where the base held `typed`. The report says only that leaving keeps it open; failure scenario: a field left open with focus elsewhere does not close on Escape, which B1 makes the common state, and a title change from the channel replaces the words being typed; verdict: case Rename partial.

## Declined to judge

- Failing lines on the unchanged tree for the `reading-tab.test.ts` rows and `Tests 3 failed | 30 passed (33)`, and the old `workspace-layer` line on the new config: rerunning needs a test on a tree it was not written for, and a scratch copy with a change is banned. Read instead, and consistent with the base code.
- `npm run diagrams` and `docs:palette`: they write files. The committed diagrams were checked only by `context.ts:175`; landing regenerates them.
- The builder's `npm run test:quick -- <58 paths>`: run with `--base 3e2595261` instead; the path list itself was not rerun.
- Every look item, and the Chrome focus claims in B1 and B2: not run, a page is read only.
- Whether a tab's count is drawn amber: `strip-tab.ts:73` reads `badge.tone` from `badgeTone`, which `SessionList.svelte` does not set here or on the base; the rail reads `countPart`. The brief's item 8 and its case speak of the rail, so I judged the rail and did not judge the tab's colour.
- The orchestrator's saved-layout data edit: not built, and `~/.oculus/layouts.json` is not to be read.
- The merge with O124 and O122: the orchestrator's.
- The report's quoted `git diff -U0`: run only in the form with the base commit.
- The report's "Open items" line numbers: not compared, no decision rests on them.
- The value of decisions 1 to 8 and whether the look matches VS Code: Axel's, and the look's.

Reviewer usage: a782a024916820caa, claude-opus-5-5, 88630 tokens, 56 tool uses, 17 min 56 s.

## Repair round 1, refuted

Worktree `.agents/worktrees/migration-O123`, base 3e2595261. Round's delta: seven paths of `files.txt` differ from the snapshot (`docs/HELP.md`, `opening.svelte.ts`, `terminals.svelte.ts`, `open/opening.ts`, `SessionList.svelte`, `SessionWorkspace.svelte`, `session-list.ts`) and two paths are new to the round (`terminal-tabs.ts`, `open/landing.ts`). Report checks: `git status --short | wc -l` printed 63 before and after every run of mine.

```
$ npm run test:quick -- --base 3e2595261     (PATH with node v24.21.0, exit 0, run twice, second run quoted)
test:quick: 72 changed file(s), from git since 3e2595261
test:quick: 47 test file(s)
ok      prettier (0.7 s): All matched files use Prettier code style!
ok      ASCII gate (0.8 s)
ok      svelte-kit sync (2.2 s)
ok      eslint (2.5 s)
ok      svelte-check (9.1 s): 1793663479360 COMPLETED 582 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest slow (35.8 s): Duration  24.76s (transform 12.16s, setup 0ms, import 16.04s, tests 8.57s, environment 0ms)
ok      vitest (44.1 s): Duration  33.22s (transform 55.81s, setup 0ms, import 107.41s, tests 6.10s, environment 1.34s)
ok      vitest checks (51.5 s): Duration  40.67s (transform 24.37s, setup 0ms, import 48.96s, tests 98.08s, environment 3ms)
test:quick: 53.9 s; every command passed
test:quick: not covered: tests that reach no changed file within the import depth, other than the checks under tests/checks/source and tests/checks/tree, which run for any change under src, tests or utils; the build, the lint of unchanged files
No failure in any file, so no timing failure to quote.

$ LC_ALL=C grep -n '[^ -~]' over the 45 changed non-svg files, the ten files of sections/, session-marks.svelte.ts and O123-report.md
prints nothing, exit 1
$ LC_ALL=C grep -c '[^ -~]' over channels, layer-state, layer-views, layers .svg
0 each

$ grep -rnEi --exclude=local.yml 'sessions page|page: sessions|(^|[^a-z])m Sessions' src config/defaults docs/HELP.md README.md
prints nothing, exit 1

$ git diff 3e2595261 --stat -- package.json package-lock.json
prints nothing, exit 0

$ sh utils/unused-exports.sh, compared with ../O123-base/unused-exports.txt
337 lines, diff exit 0

$ grep -rnw <name> ../O123-base/src ../O123-base/tests ../O123-base/config ../O123-base/utils --exclude=local.yml | wc -l
withDraft 0, keptOf 6, composerTab 0, pressTarget 0, moveToNewTab 0, listRows 5, groupRow 2 (all as the report says)
$ grep -rnw composerTab src tests docs README.md | wc -l
0
$ grep -rnE 'draft\b|Draft\b' over the base's composer state and views/sessions/terminal/start | wc -l
0

$ grep -rln "composeAt\|composeIn" tests
prints nothing, exit 1
$ grep -n -i 'composer\|composeAt\|typed prompt' .scratch/migration/agents/guarded.md
prints nothing

$ grep -rn "views/sessions/session-detail/[A-Za-z]" ... | grep -v SessionDetail | wc -l
0
$ grep -rnE "arrangements\.sessions|group: 'sessions'" src tests config --exclude=local.yml | wc -l
0
$ grep -n 'chord: m' config/defaults/layout.yml | wc -l
0
$ grep -rn "rail: 'sessions'" src tests
tests/state/workbench/layout/saved/layout-saved.test.ts:107:                    rail: 'sessions'

$ npx vitest run tests/state/sessions/terminal/reading-tab.test.ts tests/data/sources/config/workspace-layer.test.ts --reporter=dot
Test Files  2 passed (2)
Tests  41 passed (41)

$ sh utils/folder-check.sh
exit 0

$ wc -l
SessionList.svelte 467, SessionWorkspace.svelte 260, context.ts 880, terminals.svelte.ts 849, opening.svelte.ts 231, terminal-tabs.ts 435, landing.ts 97, as the report says

$ registration orders of group: 'explorer' (grep over src/lib/views)
files 0, repositories 1, session-list 2, search 3, latex 4, terminal 5, problems 6, references 7, debug 8, debug-console 9, notes-graph 10, session-detail 11

$ builder's transcript, agent-acbcf929837bf5594.jsonl, read with a read-only python3 -I program over its tool_use records
464 tool uses, 136 Bash. One sed -i, the HELP.md line the report quotes. No perl, no awk or python that writes, no redirect into src, tests, config, docs or README. Three empty python3 heredocs. Every edit after 2026-11-02T23:31 is an Edit call.

$ sed -n 177,180p /Users/axelfaes/workspace/oculus/.scratch/migration/orchestrator-state.md
Open item 637 at line 178 (see Proof R1-P1)
```

### Verdicts

Page behaviour below is judged by reading and not run; the look at landing proves it.

Items of the brief's "What to build":

- 1: holds. One `TreeView`, `TreeSection id={LIST_FOLD}`, ten-row `.fold`, `keepShown`, `pickedSession` through `sessionOfTerminal`, `NameField` stops key propagation, `onpressagain`. `TreeSection` and `TreeView` hold no Alt+Up move of their own.
- 2: holds. `SessionSections.svelte` is new, `SessionDetail.svelte` and `SessionList.svelte` both draw it with `owner`.
- 3: holds. One `TreeItem` per row, `sessionRowWords`, `.row.input` amber edge, `TerminalRows` same height.
- 4: holds. `pick` is `select`, then `openSession` with `press: true, documents: true`; `pressTarget` picks the tab; `openView('session-detail')` stays only on the row menu's `pinned`.
- 5: holds. Rail entry, arrangement and chord gone (greps above); orders above give s1 to s9 by `keyOf`'s `at < 9`.
- 6: holds. `layout.yml` shapes read; `opened: true` on `session-detail`, read by `registerOpened` in `context.ts`.
- 7: holds, both paragraphs. `startOf` `TERMINAL_VIEW` case, `folderOf`, `pageFolder`, `pinned` in `tabs()`, `closeEnded` and `moveInto`; the two new `it.each` rows pass.
- 8: holds. `repositories` and `problems` take `rail: false`, `countPart` gives `tone: 'amber'`, `urgentTone` in `rail.ts` reads it, `StatusBar.svelte` is not in the diff.
- 9: holds for the sentences it names. The sentence in Standards R1-ST1 falls under the rules file's rule on changing a name.

Cases of the brief's "Cases", with the rulings of `O123-cases.md`:

- Explorer, new page: met by reading.
- 200 sessions: met by reading.
- Row height, Tab once, arrows: met by reading. `tabindex="-1"` on `.fold` ends the second Tab stop; the look confirms it.
- A press, in all its forms: met, `reading-tab.test.ts` passes, plus reading.
- Terminal row, resume, fork, by-hand terminal: met by reading.
- A reload: met by reading.
- Closing and reordering: met by reading.
- A file opened from Files or Changes: met by reading.
- Details transcript control and an Agents row (ruling 2): met by reading.
- Row menu's Pinned and a notice's press: met by reading.
- A workbench: met by reading, for the limited New through `asNew` as well.
- Pinned tab ends or is moved out; unpinned closes: met, rows 'ended' and 'moved out' pass.
- Badge: met by reading.
- Status bar: met by reading, `toggleView` and `openView('session-list')` at `StatusBar.svelte:245,359` unchanged.
- Debug start: met by reading, `debug.svelte.ts:296`.
- Find All References: met by reading of the arrangement only; the opener was not read, see Declined.
- Narrow tab: met by reading.
- A rename in a row: partial, Escape does not close the field while the focus is on the row itself, Behaviour R1-B1.
- Wallpaper: not verifiable, the look settles it; see Proof R1-P1 on open item 637.
- No session and no terminal: met by reading.
- A saved page: not verifiable, the landing's data edit and the look settle it.

Items of the round:

- 1, B1: closed by reading. `event.preventDefault()` then `startRename`, `TreeItem.svelte` unchanged (`git diff 3e2595261 --stat -- src/lib/ui/tree` is empty). The field's focus is the look's.
- 2, B4: partial. `typed` holds the words. Escape is not read wherever the focus is: Behaviour R1-B1.
- 3, B2: closed by reading.
- 4, B3: partial. `typedTab` is reached only with `asNew`, tasks and places pass false, and pageTarget skips a reading tab. The draft's reach through `startedAt` stays, and the report's row calls it unchanged: Behaviour R1-B2.
- 5, ST1: closed. All four sentences say what `registerOpened` reads; `grep -rn 'catalogue group' src config docs/HELP.md` shows no other false one.
- 6, ST2: closed. The unit-test claim is gone, and the new head is true of the file.
- 7, ST3: closed. Both sentences are true by reading; `grep -n 'follow: true' config/defaults/*.yml` hits only a comment line.
- 8, ST5: closed in form, both lists are there and the seven helper counts reproduce. One row is wrong: Standards R1-ST1.
- 9, S1 and ST4: closed. The transcript gives the one `sed -i` the report lists.

### 1. Spec

None.

Points the builder raised, judged under this heading:

- `asNew` on `ComposeAt` (`opening.svelte.ts:41`): no finding. Its one caller is `SessionList.svelte:234`; the three task callers and `repositories.svelte.ts:374` leave it out. It is an in-process option, no saved key, route or wire shape, so `spec.md`'s rule on silent decisions does not reach it, and the report lists it. Without it the limited list's New would leave the draft hidden, which item 4 of the round forbids. `newSession` needs `composeAt` there because the limited folder may differ from the tab's terminal's folder.
- Paths beyond the round's list: no finding. `terminal-tabs.ts` is a comment only (the diff shows no code line), and the report names it. The `terminals.svelte.ts` head and `pageTab` doc, the `SessionList.svelte` head and `newSession` doc and the HELP Terminals bullet each follow from item 4 under the rule that a sentence the change makes false is a defect.

### 2. Proof

- R1-P1. `agents/reviews/O123-report.md`, section "Open items of the state file": "`.scratch/migration/orchestrator-state.md` lines 191-193 as they stand now, verbatim (`sed -n 191,193p`). The list holds no entry."; what is wrong: the round's brief asks for `orchestrator-state.md` as it stands now, and `sed -n 177,180p` of the main ledger holds open item 637 at line 178, on the file's mtime 2026-11-03 00:42. The builder read the worktree's tracked copy, which is at the base. Line 37 of the report also tells the look "a group strip paints over what scrolls under it", while 637 says over a wallpaper this same strip (`GroupHead.svelte:202`, `--panel-on-wall`) lets what scrolls under it show at 20 %, and the Sessions pane is `tinted`, so that sentence is open too; the decision that rests on it: the look's expected result in the Wallpaper case and the landing report's open-items list; failure scenario: the look reads a translucent strip over scrolled rows as a defect of O123, or a reader of the report takes the list as empty while 637 waits on Axel; verdict: none, the Wallpaper case stays not verifiable. Small: the orchestrator corrects both lines at landing.

The test question the builder raised: `composeIn` and `composeAt` having no test is no finding. `spec.md` lets a test exist only as an entry of `agents/guarded.md`; the two greps above show no entry and no test, and the round's item 6 and the brief say to add none. Whether New's order earns an entry is under Declined.

### 3. Standards

- R1-ST1. `src/lib/state/sessions/terminal/terminal-lists.ts:160-161`: "The Terminal tab of a page or float that a terminal no tab owns, New and the app menu's starts go to: pageTarget's rule over that page's tabs."; and the report's row "`terminal-lists.ts:161`, `:706` of the store (`startOnPage`) | still true: a terminal start has no draft reach"; what is wrong: the sentence names New, and New now goes first to a tab holding a draft (`opening.svelte.ts` `targetTab`). The round rewrote the same claim in the `pageTarget` doc (`terminal-tabs.ts:421`) and the `pageTab` doc (`terminals.svelte.ts:367`) and left this one, and the row's reason speaks of a terminal start, which is not the claim the sentence makes. `spec.md`'s rule on changing a name makes it a defect; failure scenario: a reader changing New's target reads `pageTabOf` as the whole rule and misses `typedTab`; verdict: none, item 8 of the round closed in form. One clause at landing.

- R1-ST2. `agents/reviews/O123-report.md`, section "Program edits of the build": "One `git log --oneline -3` ran at the round's start, a read outside the three git commands the task names; it changed nothing."; what is wrong: the transcript shows it twice, at 2026-11-02T22:19:27 in the build and 23:31:30 in the round, each outside the three git commands `spec.md`'s "Where you work" allows a builder. The build also wrote and removed `.scratch/placeholder-do-not-keep` in the worktree (Write at 22:26:11, `rm` at 22:26:16), ran `pkill -f "tests/tiers/quick.mjs"` at 22:58:15, a pattern that matches every worktree's run on the machine, and ran `until grep ...; do sleep 3; done` at 23:01:27, a watch that only sleeps, which `spec.md` bars. The report states none of these three; failure scenario: another step's or a gate's list run killed by the `pkill` reads as a stopped run with no cause; verdict: none. Closes by recording in the booking; none leaves a mark in the diff.

### 4. Behaviour

- R1-B1. `src/lib/views/sessions/session-list/SessionWorkspace.svelte:118`: "if (event.target instanceof Element && event.target.closest(inRow) !== null) return;" with the comment at line 108 "With the focus in the field the field's own Escape does it"; what is wrong: the round's item 2 asks that Escape closes the field wherever the focus is, and the report says "with the focus elsewhere Esc closes it". The code tests the row, the comment says the field. `inRow` is the row's `[data-session-row]` box, which holds the treeitem `div` of `TreeItem.svelte` as well as the input. `NameField`'s `keys` is on the input alone (`NameField.svelte`, `onkeydown={keys}`), and `onleave` is a no-op, so the field stays open when the focus leaves it. With the focus on the treeitem, the document listener returns, no key handler sees Escape, and the field stays open; failure scenario: the field is open, the reader presses Shift+Tab, or presses the row's guide, arrow or icon space left of the input (`.main.labelled`), so the focus lands on the row's treeitem, then presses Escape: nothing happens, where the base closed the field. The fix is one line, testing the input: `event.target instanceof HTMLInputElement`, or `closest(`${inRow} input`)`. Add to the look: open the field, Shift+Tab, Esc. By reading, not run; verdict: case "A rename in a row" partial, round item 2 partial.

- R1-B2. `src/lib/state/sessions/terminal/composer/composer.ts:235` in `startedAt`: "...keptOf(kept),", and `agents/reviews/O123-report.md` line 143: "| A start from a place or a task | The page's Terminal tab that reads no session, else a new tab; a reading tab stays reading | Unchanged from the base |"; what is wrong: the first refuter's B3 named this, the round asked `composeAt` for a place and for a task to keep the base's behaviour, and the report's table says unchanged. A draft can be hidden on a tab that does not read: `composing` goes false on a shown terminal (`terminal-tabs.ts:283,294,312`), `Terminal.svelte:409` then unmounts the composer, and `pageTarget` still takes that tab since its `transcript` is null. On the base the prompt was the component's and went with it, so such a start showed an empty box. Now `startedAt` brings the draft back, and `Composer.svelte:21` says "what is typed is added to the seed". The report's judgment call speaks of "while it was mounted" and leaves out this case; failure scenario: on a tab owning terminal T the reader presses New, types "foo", presses T's row in the Sessions list, then starts a hub task: the seed shows with "foo" in the box and goes with the start unless the reader clears it; on the base the box was empty. A worktree start from Repositories does the same in another folder. The words show on screen before the start, so nothing is sent unseen. Either `showAt` drops `draft` and `attached` when the tab was not composing, or the table's row is rewritten to state the difference; the first keeps the round's text. By reading, not run; verdict: round item 4 partial.

### Declined to judge

- `npm run diagrams`: it writes files and this review writes none. The round's delta changes no import line, so by reading the generated graphs do not move; the first refuter declined it too. Landing regenerates them.
- The builder's first list form, `npm run test:quick -- <58 paths>`: run with `--base 3e2595261` instead.
- The red first list run of the round and the failing lines on the unchanged tree: rerunning needs the code before the fix or a test on a tree it was not written for, which the rules bar. No test changed in the round.
- `git log` and every other git command beyond the three named: the transcript was read instead of rerunning any.
- The report's "125" Bash commands: the transcript holds 136 in all, and the report's count stops before the round; no decision rests on it.
- Whether the `pkill` at 22:58:15 hit another step's run: the transcript does not say, and it needs `orchestrator-state.md`'s timing of O122 and O124 against that minute.
- Rename from the row's Menu: whether the field keeps the focus when the Menu returns focus on close was not read to the end of the Menu's code. The look should press Rename in the menu as well as the double press; the report's look names only the double press.
- B1 and B2's browser behaviour: focus on a removed mousedown target, a `click` after it, and Chromium's handling of a scroller with `tabindex="-1"` are not run, a page being read only.
- Find All References' opener: `grep` of it failed under zsh globbing and was not rerun; the case rests on the first refuter's read plus the arrangement I read.
- Whether New's order, or the draft in the saved record, earns a `guarded.md` entry: Axel's, under `spec.md`'s test rule, and any new entry is his to approve.
- Customizations and the nine moved files were read in part: the Customizations diff's first 60 changed lines, and the moved files through the first refuter's comparison rather than a `diff` of my own. Neither is in the round's delta.
- The saved-layout data edit, the merge with O122 and O124 (`GroupHead.svelte` and `registry.ts`), the value of decisions 1 to 8 and whether the look matches VS Code: the orchestrator's, the look's and Axel's.

Reviewer usage: ac007d7895e827e38, claude-opus-5-5, 292420 tokens, 42 tool uses, 10 min 32 s.

### Closed

- R1-P1: closed at landing. The report's open-items part and its line on the strip now state open item 637.
- R1-ST1: closed at landing. `pageTabOf`'s comment in `terminal-lists.ts` names the typed-prompt tab New goes to first.
- R1-ST2: closed at landing by recording in the booking: two `git log` reads, the placeholder file written and removed, the `pkill -f` and the sleep loop. None leaves a mark in the diff.
- R1-B1: closed at landing. `SessionWorkspace.svelte`'s document Escape now leaves alone only a key inside the field's input, so Escape with the focus on the row closes the field.
- R1-B2: closed at landing. `showAt` in `opening.svelte.ts` drops the draft and the attachments when the tab's composer was off screen, so a start from a place or a task keeps the base's behaviour; the report's row stands true.
