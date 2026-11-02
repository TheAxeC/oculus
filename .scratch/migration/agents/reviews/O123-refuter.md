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
