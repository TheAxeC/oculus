# Step O135 refuter report (on .agents/worktrees/migration-O135, base c931e9418)

A page this report cites (the rules file, a standard, a skill's text) is named with its section, never with a line number, since a page's lines move and a section's name does not. A finding in code keeps its `file:line`.

The report is written in the rules file's character set. A character outside it in a quoted line is written by its name in angle brackets, such as `<tab>` or `<em dash>`.

## Verification (rerun by the reviewer)

```
$ npx vitest run tests/data/prose/markdown/front-matter.test.ts tests/shell/panes/strip/tab-menu.test.ts tests/views/sources/source/save-key.client.test.ts tests/ui/controls/editor/reach-text.test.ts tests/checks/tree/boundaries.test.ts tests/shell/window/menu-answer.test.ts tests/views/sources/bar-actions.test.ts --reporter=dot
 Test Files  7 passed (7)
      Tests  174 passed (174)
(the last two files are the other importers of changed modules: grep -rlE of each changed module's path under tests gives menu-answer.test.ts for editor-status, bar-actions.test.ts for Source, and no other importer of a changed module)

$ shasum docs/diagrams/* > <scratch>/o135review-diag-before.txt; npm run diagrams; shasum docs/diagrams/* | diff <scratch>/o135review-diag-before.txt - && echo "diagrams unchanged"
diagrams unchanged

$ npm run test:quick   (one run)
ok      prettier (1.0 s): All matched files use Prettier code style!
ok      ASCII gate (1.1 s)
ok      svelte-kit sync (2.5 s)
ok      eslint (2.7 s)
ok      svelte-check (10.8 s): 1793733621225 COMPLETED 582 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest slow (39.3 s): Duration  26.42s (transform 13.30s, setup 0ms, import 17.81s, tests 8.36s, environment 0ms)
ok      vitest (40.4 s): Duration  27.86s (transform 56.01s, setup 0ms, import 101.30s, tests 3.13s, environment 2.17s)
ok      vitest checks (58.7 s): Duration  45.99s (transform 16.55s, setup 0ms, import 33.90s, tests 96.21s, environment 3ms)
test:quick: 61.5 s; every command passed

$ LC_ALL=C perl -ne '<the rules file's ASCII gate>' <the 17 files the report lists> docs/diagrams/layer-shell.dot docs/diagrams/layer-views.dot docs/diagrams/layers.dot docs/diagrams/layer-shell.svg docs/diagrams/layer-views.svg docs/diagrams/layers.svg; echo "ASCII gate exit $?"
ASCII gate exit 0
$ LC_ALL=C grep -n '[^ -~]' .scratch/migration/agents/reviews/O135-report.md; echo "report grep exit $?"
report grep exit 1

$ sh utils/unused-exports.sh > <scratch>/o135review-unused.txt; diff ../O135-base/unused-exports.txt <scratch>/o135review-unused.txt; echo "diff exit $?"
diff exit 0

$ wc -l src/lib/views/sources/source/Source.svelte; sh utils/folder-check.sh; echo "folder-check exit $?"
     517 src/lib/views/sources/source/Source.svelte
folder-check exit 0

$ node <scratch>/o135build/cases.mts "$PWD" | diff - <scratch>/o135build/after-run.txt && echo "same as after-run.txt"
same as after-run.txt
$ node <scratch>/o135build/cases.mts .agents/worktrees/O135-base | diff - <scratch>/o135build/first-run.txt && echo "base run same as first-run.txt"
base run same as first-run.txt
$ diff <(tail -n +2 first-run.txt) <(tail -n +2 after-run.txt); echo "diff exit $?"
diff exit 0
$ wc -l first-run.txt after-run.txt
      19 first-run.txt
      19 after-run.txt
$ diff <(sed 's/<byte-order mark bytes>/<byte-order mark>/' cases.mts) <(the ts block of the report); echo "source vs report exit $?"
source vs report exit 0
(output, after the change, lines 1 and 15:)
reading: readFrontMatter of front-matter.ts
C11 "<byte-order mark>---\ntags: [a]\n---\n" header "---\ntags: [a]\n---\n" -> not offered; scanNote tags ["a"]
(every other line equals the report's quoted first-run output)

$ { git diff -U0 c931e9418 -- src tests; diff -U0 /dev/null src/lib/views/sources/source/status/editor-actions.ts; } | grep '^+' | grep -v '^+++' | grep -E '^\+\s*(//|\*|/\*\*)' | grep -i -E "before|used to|no longer|still|always has been|always had|as before|previously|the step adds|after this package|O[0-9]+|20[0-9][0-9]-"; echo "exit $?"
exit 1

$ git diff c931e9418 --numstat -- src tests config docs/HELP.md ; wc -l <each changed file>
(every added/removed pair and every line count of the report's Files table reproduces)

$ ls docs/adr
ls: docs/adr: No such file or directory
```

## Verdicts

Items of the brief's "What to build", in its numbering:

- 1: holds. `readFrontMatter` at `src/lib/data/prose/markdown/front-matter.ts:51-54` (withoutMark, CR and CRLF to LF, `FRONT_MATTER`), `scanNote` calls it at `note-links.ts:276`; the head comment (:22-26) names it; `tests/checks/tree/layer-rows.ts:228-236` names what the module holds; the case-run gives the same 18 lines on the base and after the change.
- 2: holds. `NOTE_HEAD = '---\ntags: []\n---\n'` at `front-matter.ts:38`, its doc comment (:33-37) names `docs/templates.md`'s `notes/<name>.md` head; no code picks a line ending.
- 3: holds. `isNoteFile` exported at `note-hooks.ts:29`, name kept, callers :43 and :85 unchanged; head comment :8-9.
- 4: holds. `$derived` boolean at `Source.svelte:312-316` in the order editing, `isNoteFile`, `readFrontMatter(...).front === null`, returned by the getter :344-346; `tabActions` pushes it after Open Preview to the Side (`ask-perform.ts:97-103`); `FRONT_MATTER_ACTION` at `editor-status.svelte.ts:109-114` beside `SAVE_ACTION` and `REVERT_ACTION` with the doc comment asked for; label `source.cmd_front_matter: 'Markdown: Add Front Matter'` (`source.yml:89`); head comments of ask-perform.ts, tab-asks.svelte.ts and the Source.svelte palette list name it; `SaveKeyHost.svelte` gains `frontMatter: false` and `addFrontMatter: nothing`.
- 5: holds for a tab on screen. `prepend` at `types.ts:111`, performed at `commands.ts:146-158` as one `executeEdits` at 1,1 with `forceMoveMarkers: true` between two `pushUndoStop`, then `made.focus()`; the `EditorCommand` doc and the commands.ts head name it. For a hidden tab the keyboard does not move (Behaviour 1).
- 6: holds. `tab-menu-state.svelte.ts:111-112` reads `statusOf(found.id)?.actions`, `tab-menu.ts:165` adds its own group after the compare group, the pick asks `{ kind: 'action', id: FRONT_MATTER_ACTION }` (`tab-menu-state.svelte.ts:225-226`); a null status gives no item; the head comments of tab-menu.ts, tab-menu-state.svelte.ts and `tabMenu`'s doc name it.
- 7: holds, with Standards 1. `docs/HELP.md:407`, after the front-matter bullet.
- 8: holds. `wc -l` prints 517; the composition of `own` moved into `src/lib/views/sources/source/status/editor-actions.ts` (`tabEditorActions`), named in the report. The report marks item 8 DONE (report table row 8), not partial.

Cases of the brief's "Cases":

- C1: not verifiable. The reading gives no header (case-run "C1 ... header null -> offered") and the code path reads as the report states; the offer in the palette and the tab menu, the caret on line 4 column 1 and the one Undo are settled at the look.
- C2: met for the reading (case-run "header "---\ntags: [a]\n---\n" -> not offered"); the absence follows by reading `Source.svelte:315` and `ask-perform.ts:97`; the screen at the look.
- C3: met, case-run header `---\ntags: [a]\n...\n`; same code path as C2.
- C4: met, case-run header `---<tab>tags...` (printed as `"---\t\ntags: []\n---\n"`); same code path.
- C5: met. Case-run: `docs/plan.md` gives `inNotes null`, `.oculus/notes/plan.txt` gives `isNote false`; a non-hub root fails `one.hub === true` (`note-hooks.ts:33`, read).
- C6: met for the reading (case-run "C6 "" header null -> offered", "C6after ... not offered"); the inserted text is `NOTE_HEAD` at 1,1 by reading `Source.svelte:402` and `commands.ts:146-158`; the editor's edit at the look.
- C7: met for the reading (C7 offered; C7after header is the first three lines); the edit at the look.
- C8: met for the reading (case-run "C8 ... not offered"); the menu and palette at the look.
- C9: not verifiable; the file's bytes after a save of the CRLF note at the look settle it.
- C10: met by reading. A head tab gets `window: true` and words from `lockedWords` (`save/locked-words.ts:26-31`), so `editing` is false (`status/tab-shown.ts:62`) and `frontMatter`'s `&&` ends at `Source.svelte:313`; the screen at the look.
- C11: met, case-run header `---\ntags: [a]\n---\n` with the mark taken off.
- C12: not verifiable; Select All on a three-line note, then the run, at the look.
- C13: met by reading: `PaneBody.svelte` mounts the active tab and every one seen (`kept`), a mounted source tab publishes (`source-status.svelte.ts:37-44`), the tab menu gives no item for a null status (`tab-menu-state.svelte.ts:112`); the screen at the look.
- C14: met: `docs/HELP.md:407` holds the sentence in the notes section; see Standards 1 for what it leaves out.

## 1. Spec

- `.scratch/migration/agents/reviews/O135-report.md`, "Limitations and sharp edges": "The case-run program in the scratch folder had one edit made with an inline `python3` program (the `q` escaping of its output); it changed only .../o135build/cases.mts"; what is wrong: the standing spec's rule on case-run programs counts an inline `python3` that changes a file as a script needing approval from a Rulings line, and the brief's "Paths this step writes" says no script is written other than the case-run program; no Rulings line approves this edit. The scratch folder also holds `first-run.txt`, `after-run.txt`, `quick1.txt`, `quick2.txt`, `scoped2.txt`, `scoped3.txt` and `unused-after.txt`, whose contents are command output (`ls -l` of the folder); the report names no command that wrote them, and the same rule counts a shell redirect that writes a file as a script (not verified which command wrote them). The case-run program itself is the one the brief allows, and its run reproduces. Failure scenario: none for the step's diff, since no file of the worktree was written by a program (the report's file table and `git status --short` agree); the breach is the one ruling "Unapproved builder scripts" closes by recording it in the booking. Verdict: none.

## 2. Proof

- `.scratch/migration/agents/reviews/O135-report.md`, DONE row 1 and "The cases after the change": "the same 17 lines as the first run (`diff` of lines 2 on, exit 0)" and "so lines 2 to 18 are those quoted under the first run"; what is wrong: `wc -l` gives 19 lines in each output file, so lines 2 on are 18 lines, lines 2 to 19; no decision rests on the figure, the `diff` exit 0 reproduces. Failure scenario: a reader checking the booking against the files counts one line more than the report says. Verdict: none.
- Report, "DONE / NOT DONE", Verify 3: "the rules file's perl form over the 17 changed files prints nothing"; what is wrong: the step changes 23 paths, and the gate's file list leaves out the six regenerated `docs/diagrams/layer-shell.*`, `layer-views.*` and `layers.*` files, so the check did not read them. The reviewer's run over all of them prints nothing, exit 0. Failure scenario: none found, since the rerun is clean. Verdict: none.
- Report, "Tests": "Run on a copy of the unchanged tree (the base copy's folders ...): `npx vitest run tests/views/sources/source/save-key.client.test.ts` printed ... `Tests  1 passed (1)`"; what is wrong: brief Verify 6 asks for each changed test run on the unchanged tree; copying the base copy's `tests` runs the base fixture, not the changed `SaveKeyHost.svelte` over the base code. The report rightly calls the fixture an audit, since the test never reads the two new fields. Failure scenario: none in behaviour, since the extra object fields are ignored at run time by the base code; the quoted run does not show what it is said to show. Verdict: none.

## 3. Standards

- `docs/HELP.md:407`: "On a note you can edit that has no front matter, Markdown: Add Front Matter in the palette and Add Front Matter in the tab's menu write `---`, `tags: []` and `---` at its top ..."; what is wrong: the tab menu offers the item only on a tab shown since the page loaded (brief decision 3, `tab-menu-state.svelte.ts:111-112`), and the sentence says the tab's menu offers it on any editable note without front matter. The builder saw this and left it out as "the orchestrator's to add if HELP should say it". That is a sentence a document holds false after the change (the standing spec's rule on carrying a change into documents) and a deferral inside item 7's scope (the rules file's "Never the lazy option"). Failure scenario: a reader reloads the page with a note tab restored but not yet shown, right-clicks its tab, finds no Add Front Matter, and concludes the command is broken or the note already has a header. Verdict: none, for landing (C14 still met as the brief words it).
- `src/lib/views/sources/source/status/ask-perform.ts:97-103` with `src/lib/ui/controls/editor/Editor.svelte:467-471`: "if (editor === null || model === null || kit === null) { waiting.push(command); return; }"; what is wrong: the standing spec asks that every asynchronous path in flight is stated in the report. A tab whose draft has loaded publishes its own actions while its Monaco editor is still being made, and during that time `frontMatter` stays true, because the text does not change until the queued `prepend` runs. The report states the stale-pick path and not this one. Failure scenario: on the first note opened in a session, Markdown: Add Front Matter run twice from the palette before the editor has loaded queues two `prepend` commands, and the note becomes `---\ntags: []\n---\n---\ntags: []\n---\n# Title...`, the second head read as body text (no text lost; brief decision 6's cost). Verdict: none.
- `src/lib/state/workbench/navigation/editor-status.svelte.ts:58-61`: "The actions the tab offers the palette: a source tab's own that apply, then its editor's while the editor is drawn. The tab menu reads Add Front Matter from them."; what is wrong: `EditorStatus.actions` is also published by the diff pane (`views/sources/repositories/diff/Diff.svelte:54`, `:343`), whose list is its diff editor's actions; the rewritten comment describes the source tab alone, while the file's head comment still says a diff pane publishes the same way. Failure scenario: a reader of the type reads that every published list starts with a source tab's own actions and looks for them in a diff pane's status. Verdict: none.

## 4. Behaviour

- `src/lib/shell/panes/strip/tab-menu-state.svelte.ts:225-226` with `src/lib/shell/panes/TabView.svelte:48`, `:69-70`: "addFrontMatter: () => void deps.client.editorStatus.ask(tab, { kind: 'action', id: FRONT_MATTER_ACTION })" and ".tab-view[hidden] { display: none; }"; what is wrong: a pick on the menu of a note tab that is mounted but hidden behind another tab of its pane writes the head into that hidden tab's text, does not show the tab, and its `made.focus()` (`commands.ts:158`) does nothing on a `display: none` editor, so the keyboard stays where it was. Item 5's "after which the editor takes the keyboard" holds only for the tab on screen. The report states this under "Limitations and sharp edges" as designed, but gives no before and after in "What a user sees". Whether such a pick should show the tab is a user-visible shape the brief does not name. Failure scenario: the reader right-clicks a background note tab, picks Add Front Matter, sees nothing change on screen, and the note autosaves the head 800 ms later (`docs/HELP.md`, notes section); taking it back needs the tab shown first. Verdict: none (item 5 holds for the on-screen tab).

## Declined to judge

- The look cases: the offer in the palette and in the tab menu (C1 and the screen part of C2 to C8, C10, C11, C13), the caret and Undo of C1, the CRLF bytes of C9, the selection of C12, and whether focus after a tab-menu pick ends in the editor or goes back to the strip when the menu closes. These are settled at the look on landing on a scratch server.
- Whether the builder ran a whole-suite command, and how many times the scoped run ran: only the builder's transcript shows this; the scratch folder holds two scoped outputs and two `test:quick` outputs, consistent with the report.
- The report's unexplained "1 failed | 173 passed (174)" scoped run before the last change: it names no failing file, and no saved output holds it. The reviewer's rerun passes 174 of 174.
- Which commands wrote the scratch output files (Spec 1): only the builder's transcript shows this.
- The Monaco claims (an LF insert written in the model's CRLF ending, `forceMoveMarkers` moving a caret and a selection start at 1,1): the brief's premise from Monaco's source, not reread here; the look settles them.

Reviewer usage: a75b874ccb284432f, claude-opus-5-5, 222808 tokens, 70 tool uses, 11 min 11 s.

# Repair round 1, refuted

Step O135, on /Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O135, base c931e9418. The round is read as the delta from the round snapshot (/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O135-round-1) plus the two paths files.txt does not list, against the whole diff since the base.

A page this report cites (the rules file, a standard, a skill's text) is named with its section, never with a line number. A finding in code keeps its `file:line`. The report is in the rules file's character set.

```
$ npx vitest run tests/data/prose/markdown/front-matter.test.ts tests/shell/panes/strip/tab-menu.test.ts tests/views/sources/source/save-key.client.test.ts tests/ui/controls/editor/reach-text.test.ts tests/checks/tree/boundaries.test.ts tests/shell/window/menu-answer.test.ts tests/views/sources/bar-actions.test.ts --reporter=dot
 Test Files  1 failed | 6 passed (7)
      Tests  2 failed | 172 passed (174)
(uptime: load averages: 18.01 14.54 10.48. Both red lines are "tests/checks/tree/boundaries.test.ts > layer boundaries > holds across src/lib" and "> holds no process-wide state under src", each "Error: Test timed out in 5000ms.")
$ npx vitest run tests/checks/tree/boundaries.test.ts --reporter=verbose   (alone; load averages 15.82 15.09 11.28)
 x |unit| ... > layer boundaries > holds across src/lib 5821ms  -> Test timed out in 5000ms.
 (the other 10 pass, "holds no process-wide state under src 2103ms" among them)
(The importers of a changed module: grep -rlE of each changed module's path under tests lists the seven files above, layer-rows.ts itself and SaveKeyHost.svelte, and no other. vite.config.ts:475-480 says the tree checks under tests/checks run under npm run test:checks "with no time limit"; the scoped run applies the default 5 s, and test:quick below runs the same file in "vitest checks" green. A timeout under a load of 15 to 18, with no assertion red.)

$ shasum docs/diagrams/* > <scratch>/o135r1-diag-before.txt; npm run diagrams; shasum docs/diagrams/* | diff <scratch>/o135r1-diag-before.txt - && echo "diagrams unchanged"
diagrams unchanged
$ git status --short docs/diagrams
 M docs/diagrams/layer-shell.dot / layer-shell.svg / layer-views.dot / layer-views.svg / layers.dot / layers.svg

$ npm run test:quick   (one run; load averages 15.96 before, 14.86 after)
test:quick: 28 changed file(s), from git since HEAD
test:quick: 29 test file(s)
ok      prettier (2.1 s): All matched files use Prettier code style!
ok      ASCII gate (2.3 s)
ok      svelte-kit sync (5.3 s)
ok      eslint (8.4 s)
ok      svelte-check (21.7 s): 1793735928563 COMPLETED 582 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest (67.6 s): Duration  42.88s (transform 72.73s, setup 0ms, import 151.06s, tests 4.97s, environment 3.04s)
ok      vitest slow (75.1 s): Duration  49.75s (transform 26.69s, setup 0ms, import 34.59s, tests 14.90s, environment 1ms)
ok      vitest checks (100.2 s): Duration  75.24s (transform 23.93s, setup 0ms, import 50.28s, tests 177.86s, environment 3ms)
test:quick: 105.8 s; every command passed

$ LC_ALL=C perl -ne '<the rules file's ASCII gate>' <the 18 changed paths under src, tests and config, the report's list, front-matter-offer.svelte.ts and PaneView.svelte included>; echo "ASCII gate exit $?"
ASCII gate exit 0
$ LC_ALL=C grep -n '[^ -~]' docs/HELP.md docs/diagrams/layer-shell.dot docs/diagrams/layer-shell.svg docs/diagrams/layer-views.dot docs/diagrams/layer-views.svg docs/diagrams/layers.dot docs/diagrams/layers.svg; echo "docs grep exit $?"
docs grep exit 1
$ LC_ALL=C grep -n '[^ -~]' .scratch/migration/agents/reviews/O135-report.md; echo "report grep exit $?"
report grep exit 1
(git status --short lists 28 lines: 23 modified, the 2 new src files and the 3 ledger files; 25 paths of the step, all in the two lists above.)

$ diff ../O135-base/unused-exports.txt <(sh utils/unused-exports.sh 2>&1); echo "unused diff exit $?"
unused diff exit 0
$ sh utils/folder-check.sh; echo "folder-check exit $?"
folder-check exit 0
$ wc -l src/lib/views/sources/source/Source.svelte src/lib/shell/panes/PaneView.svelte src/lib/views/sources/source/SourceBody.svelte
     518 src/lib/views/sources/source/Source.svelte
     514 src/lib/shell/panes/PaneView.svelte
     217 src/lib/views/sources/source/SourceBody.svelte
$ ls src/lib/views/sources/source/status | wc -l; ls src/lib/views/sources/source | wc -l
      10
      10

The round report's evidence, rerun:
$ node <S>/cases.mts "$PWD" | wc -l
      19
$ node <S>/cases.mts "$PWD" | diff - <S>/after-run.txt; echo "case-run vs after-run exit $?"
case-run vs after-run exit 0
$ wc -l <S>/first-run.txt <S>/after-run.txt
      19 .../first-run.txt
      19 .../after-run.txt
$ diff <(tail -n +2 <S>/first-run.txt) <(tail -n +2 <S>/after-run.txt); echo "diff exit $?"
diff exit 0
$ (item 8) copy of ../O135-base's src, tests, utils, config, docs with package.json, tsconfig.json, vite.config.ts, .npmrc, the worktree's SaveKeyHost.svelte and save-key.client.test.ts, and a clone of node_modules, in my scratchpad; then in it:
$ diff -rq <base>/src src; echo "src vs base exit $?"
src vs base exit 0
$ diff <base>/tests/views/sources/source/SaveKeyHost.svelte tests/views/sources/source/SaveKeyHost.svelte
51a52
>             frontMatter: false,
79a81
>             addFrontMatter: nothing,
$ npx vitest run tests/views/sources/source/save-key.client.test.ts
 Test Files  1 passed (1)
      Tests  1 passed (1)
(the copy removed afterwards)
$ diff ../O135-base/tests/views/sources/source/save-key.client.test.ts tests/views/sources/source/save-key.client.test.ts; echo "test file vs base exit $?"
test file vs base exit 0
$ grep -rlE "panes/PaneView(\.svelte)?['\"]|front-matter-offer" tests; echo "grep exit $?"
grep exit 1
$ npx eslint src/lib/views/sources/source/status/front-matter-offer.svelte.ts; echo "eslint exit $?"
eslint exit 0
$ sed -n '407p' docs/HELP.md | wc -w
      75
$ git diff c931e9418 --numstat -- <the round's six paths>
1 0 docs/HELP.md | 1 0 PaneView.svelte | 21 1 tab-menu-state.svelte.ts | 21 7 tab-menu.ts | 17 6 editor-status.svelte.ts | 19 21 Source.svelte
$ wc -l tab-menu-state.svelte.ts tab-menu.ts editor-status.svelte.ts
     254 / 320 / 324
$ { git diff -U0 c931e9418 -- src tests; diff -U0 /dev/null <editor-actions.ts>; diff -U0 /dev/null <front-matter-offer.svelte.ts>; } | grep '^+' | grep -v '^+++' | grep -E '^\+\s*(//|\*|/\*\*)' | grep -i -E "before|used to|no longer|still|always has been|always had|as before|previously|the step adds|after this package|O[0-9]+|20[0-9][0-9]-"; echo "exit $?"
+// offered. The editor queues a command asked before it has loaded (ui/controls/editor/Editor.svelte
exit 0
(the same single hit the round report quotes; "before" orders two events at run time and names no earlier state of the code, so I agree it stays)
$ awk 'length($0)>100' over the four round-changed comment files
src/lib/state/workbench/navigation/editor-status.svelte.ts:292   (an eslint-disable directive present in the base, grep -c 1 there; no comment of the round passes 100 columns)
```

`<S>` is the builder's /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/o135build. The scratch outputs the "Programs" section names are all there (`ls -la`), each modified at or before 20:12, earlier than the round snapshot at 20:34. That fits the round's claim that it wrote no new output file.

## The round's eight items, closure by closure

1. Standards 1, the HELP sentence: closed. `docs/HELP.md:407` now says the palette offers the command "on the tab in view" and the tab's menu "once the tab has been shown since the page loaded". Both match the code:
   - The palette lists "The editor actions of the source tab on screen" (`src/lib/state/workbench/palette.ts:262-279`).
   - The menu reads `statusOf(found.id)?.actions` (`tab-menu-state.svelte.ts:118-119`), which only a mounted tab publishes (`status/source-status.svelte.ts:37-44`).
   The sentence is 75 words. The report names that length and its reason under "Prose".
2. Behaviour 1, the pick on a hidden tab: closed by reading. The screen settles it at the look.
   - Same call as a strip press: `layout.activateInstance(tab, deps.page())` (`tab-menu-state.svelte.ts:232-237`) matches the strip's `onselect={(id: string) => activateInstance(id, page)}` (`PaneView.svelte:449`). Here `deps.page` is PaneView's `page: () => page` (`:366`), and both use `client.layout`'s `activateInstance` (`PaneView.svelte:105-107`, `tab-menu-state.svelte.ts:63`).
   - Tab already in view: unchanged, since `deps.shown() !== tab` guards the activation and `shown` is PaneView's `active` (`:168-170`, `:370`). That guard keeps a pick on the shown tab from calling `touchPane`, `remembered` and `revealed`, so it is needed.
   - Focus, by reading:
     - ContextMenu answers a pick only after `onCloseAutoFocus` has handed the focus back to the strip's tab (`ui/menu/menu-items.ts:156-161`, `ContextMenu.svelte:12-15`, `:146-148`).
     - The ask is then performed by `connectSourceStatus`'s `$effect` (`status/source-status.svelte.ts:47-51`). Svelte runs that effect after the flush that drops the `hidden` attribute (`TabView.svelte:48`).
     - So `made.focus()` (`commands.ts:158`) runs last, on a drawn editor. Nothing on the activation path moves the focus again (`revealed`, `layout.svelte.ts:602-611`; PaneBody's focus asks start only from `focusAsked`).
   - `shown` is optional only for the test: PaneView is the only production caller (`grep -rn createTabMenu src tests`), and `tests/shell/panes/strip/tab-menu.test.ts:96-110` builds the menu without it. That is a finding (Standards 2).
3. Standards 2, a second queued run: closed for the path the round names.
   - Does `asked` clear on every text change? Yes. `asked` holds the text the run was asked on (`front-matter-offer.svelte.ts:37`, `:54`), and the effect at `:38-40` clears it when the text differs. Every edit, an Undo or a Redo included, reaches `draft.text` through `onDidChangeContent` (`Editor.svelte:368-371`, with `applying` false for them). The prepend therefore clears `asked`, and a later Undo finds it already null.
   - Is a non-note tab's text read? No. The effect reads `text` only while `asked` is set, and `offered` reads it after `isNoteFile`.
   - Can the offer stick false? Only on two paths of the load window, which the report does not state (Standards 3).
   - The path outside the write list is justified by the size rule. Holding the flag, its effect and the run in Source.svelte would have taken it from 517 lines (snapshot `wc -l`) past 520, and the rules file's size rule asks for a split by concern. The report names the path with that reason.
   - Folder limit: `status/` now holds 10 items, which is the limit, and `folder-check.sh` passes.
   - The round asked that Source.svelte keep the flag. The partial is a different place for it, not a different mechanism.
4. Standards 3, the `EditorStatus.actions` doc comment: closed. `editor-status.svelte.ts:58-62` now covers both publishers, and `Diff.svelte:328-343` publishes its diff editor's `actions`. The comment wraps at 93, 77 and 100 columns, each break forced by the next word.
5. Spec 1, the "Programs" section: closed. The section lists the inline `python3` edit of `cases.mts` and each redirect, for all seven output files. The orchestrator reads those hunks under the "Unapproved builder scripts" ruling.
6. Proof 1, the line counts: closed. 19 lines, lines 2 to 19, reproduced above.
7. Proof 2, the ASCII gate: closed. Both commands are reproduced over all 25 paths.
8. Proof 3, the fixture over the base code: closed. The run is reproduced, `1 passed (1)`, over base `src` with the changed fixture. The report's reading is right: the two new fields change nothing at run time, and the test is an audit of them.

## Verdicts, for the whole diff since the base

Items of the brief's "What to build":

- 1: holds. `readFrontMatter` is at `front-matter.ts:51-54` and `scanNote` calls it at `note-links.ts:276`. The module head (:22-26) and `layer-rows.ts:228-238` name it. The case-run gives the same 18 lines on the base and after the change.
- 2: holds. `NOTE_HEAD` is at `front-matter.ts:38`, and its doc comment (:33-37) names the templates page's note head.
- 3: holds. `isNoteFile` is exported at `note-hooks.ts:29`. The head comment at :8-9 stays true: the source tab now asks through `status/front-matter-offer.svelte.ts:15`, `:44`.
- 4: holds.
  - `offered` is one `$derived` boolean (`front-matter-offer.svelte.ts:41-46`), in the order `editing`, `asked === null`, `isNoteFile`, then the reading. The partial is allowed by item 4.
  - The getter is at `Source.svelte:345-347`, and the action is pushed at `ask-perform.ts:97-103`.
  - `FRONT_MATTER_ACTION` is at `editor-status.svelte.ts:109-115` and the label at `source.yml:89`.
  - The head comments name it, and `SaveKeyHost.svelte` has both new fields.
- 5: holds. `prepend` is at `commands.ts:146-158`. Since the round, a pick on a hidden tab shows the tab before the ask, so the editor takes the keyboard there too (item 2 above, by reading; the screen at the look).
- 6: holds. The item is in its own group (`tab-menu.ts:165`), the menu reads the status at `tab-menu-state.svelte.ts:118-119`, and the pick asks `{ kind: 'action', id: FRONT_MATTER_ACTION }` (`:236`). See Standards 2 on `shown?`.
- 7: holds. `docs/HELP.md:407` matches the code (item 1 above).
- 8: holds. `wc -l` prints 518. The partials are `status/editor-actions.ts` and `status/front-matter-offer.svelte.ts`, and `status/` is at its 10-item limit.

Cases of the brief's "Cases":

- C1: not verifiable. The case-run reads no header. The palette and menu entries, the caret at line 4 column 1 and the one Undo are seen at the look.
- C2: met for the reading (the case-run reads a header). With no offer, `offered` is false (`front-matter-offer.svelte.ts:45`). The screen is checked at the look.
- C3: met, case-run (a header ending in `...`).
- C4: met, case-run (`---<tab>`).
- C5: met. The case-run gives `inNotes null` and `isNote false`, and `one.hub === true` is at `note-hooks.ts:33`.
- C6: met for the reading. The edit is seen at the look.
- C7: met for the reading. The edit is seen at the look.
- C8: met for the reading. The screen is checked at the look.
- C9: not verifiable. The bytes after the save are read at the look.
- C10: met by reading. `editing` is false (`status/tab-shown.ts:62`, `save/locked-words.ts:26-30`), which ends the `&&` at `front-matter-offer.svelte.ts:42`.
- C11: met, case-run.
- C12: not verifiable. The selection is seen at the look.
- C13: met by reading. A tab seen once stays mounted and publishes. A null status gives no item (`tab-menu-state.svelte.ts:118-119`), and a pick now shows the hidden tab (`:232-237`). The screen is checked at the look.
- C14: met. `docs/HELP.md:407` is in the notes section and is now true of both places.

## 1. Spec

None. Two changes are outside the round's write list or beyond its literal ask, and both are justified:
- `src/lib/views/sources/source/status/front-matter-offer.svelte.ts` is outside the write list. The round asked for the flag in Source.svelte, and the size rule forces it into a partial. The report names it with that reason.
- The rewritten doc of `TabPickDeps.addFrontMatter` (`tab-menu.ts:282-285`) follows item 2.

## 2. Proof

- `.scratch/migration/agents/reviews/O135-report.md`, "DONE / NOT DONE" and "Files" tables, which the round did not update:
  - Row 8 and Verify 5 still read "`wc -l src/lib/views/sources/source/Source.svelte` prints `517 src/lib/views/sources/source/Source.svelte`". My `wc -l` prints 518.
  - Row 6 still cites "`tab-menu-state.svelte.ts:111-112`, `:225-226`". The read is now at :118-119 and the pick at :232-237. The same stale :111-112 and :112 appear in "The cases after the change" (C1, C13).
  - Row Verify 2 quotes "test:quick: 57.9 s; every command passed" with "23 changed file(s)", which is the first round's run. The final run is the round's 62.7 s run, over 28 files.
  - The "Files" table still gives Source.svelte "18 / 21 | 517", tab-menu-state.svelte.ts "10 / 1 | 243", tab-menu.ts "18 / 7 | 317" and editor-status.svelte.ts "16 / 6 | 323". The current numstat and `wc -l` give 19/21 518, 21/1 254, 21/7 320 and 17/6 324.

  What is wrong: the rules file's "Report" and "Working rules" sections require each DONE row to quote the final run, and every count and `file:line` to be taken after the last change. These rows quote figures from before the round. The round's own table has the right figures, but it says "Every other file's figures are those of the Files table above", so the two tables disagree on the four files. No decision rests on the figures: 518 is under 520 either way. Failure scenario: the orchestrator books the step from the DONE table and records 517 lines and line references that point at other code. Verdict: none.

## 3. Standards

- `src/lib/shell/panes/strip/tab-menu-state.svelte.ts:47-51` and `:233`: "shown?: () => string;" and "if (deps.shown !== undefined && deps.shown() !== tab) {".
  - What is wrong: the field is optional only so that `tests/shell/panes/strip/tab-menu.test.ts:96-110` type-checks unchanged (the report's item 2 says so). Leaving it out silently restores the behaviour item 2 removes: the head is written into a hidden tab and the keyboard does not move. The rules file's "What every package obeys" says code written only so a check passes is a finding. The round's "No test is added or changed" ruled out the required form, which needs `shown: () => ''` (or similar) in that test's fixture, the kind of field SaveKeyHost.svelte gained in the main build.
  - Failure scenario: a second caller of `createTabMenu` (a float's or a window's strip) omits `shown` and compiles clean. A pick of Add Front Matter on a hidden tab then writes the head off screen and leaves the keyboard where it was.
  - Verdict: none (item 6 holds). Whether to make the field required with that one-line fixture field is the orchestrator's call at landing. Keeping it optional is the lazy option.
- `src/lib/views/sources/source/status/front-matter-offer.svelte.ts:37-40` and `:53-56`: "let asked = $state<string | null>(null); $effect(() => { if (asked !== null && text !== asked) asked = null; });".
  - What is wrong: the rules file's "What every package obeys" asks the report to state what the code does on every asynchronous path, in flight, after close and superseded. Keying the flag to the text leaves two paths of the load window unstated:
    - (a) Superseded. While the first `prepend` is queued (`Editor.svelte:467-471`), a change of `draft.text` from outside the editor, such as a reread of the note changed on disk, clears `asked`. The offer comes back, a second run queues a second `prepend`, and the note gets two heads once the editor loads. This is the defect item 3 closes, in a narrower window.
    - (b) Dropped. A read that fails in that window sets `draft.error`. The draft keeps its text (`status/tab-shown.ts:34-36`, `:55-61`), and SourceBody unmounts the Editor for the error branch (`SourceBody.svelte:140-145`), taking its `waiting` queue with it. When the read succeeds, a new Editor mounts with the text unchanged and `asked` still equal to it, so Add Front Matter is offered nowhere until the reader types.
  - Failure scenario: in both cases the first note opened in a session is changed on disk, or briefly unreadable, during the second or so Monaco takes to load. The result is two heads in (a), with no text lost, or a missing command in (b) until a keystroke.
  - Found by reading, not run. Verdict: none.

## 4. Behaviour

None. The round's two user-visible changes have their before and after in the report. The hidden-tab pick is under "What a user sees, before and after", and the missing palette entry during the load window is under "Keys and asynchronous paths".

## Declined to judge

- What only the look settles: where the focus ends after a pick on a hidden tab (my reading says the editor), the palette and menu entries, the caret and Undo of C1, the CRLF bytes of C9, the selection of C12, and the screen of C13.
- Whether the "Programs" list is complete. Only the builder's transcript shows every command. The scratch file times agree with it.
- The scoped run's timeout of `tests/checks/tree/boundaries.test.ts` under load 15 to 18. It is a 5 s default limit that the tree checks do not have under test:quick (`vite.config.ts:475-480`), and the same file passes there. The rules file's "Verify before you report" section says such a failure is not counted.

Reviewer usage: a9f05aa5b3678a368, claude-opus-5-5, 204038 tokens, 68 tool uses, 17 min 7 s.

## Closed (the findings of the run over repair round 1, the last round)

- Proof (the report's DONE rows 6, 8, Verify 2 and Verify 5, C1, C13 and the Files table quoting figures from before the round): fixed at landing in the report, each to the figure after the round (518 lines, `tab-menu-state.svelte.ts:118-119` and `:232-237`, the round's run of 62.7 s over 28 files, and the round's numstat and `wc -l` for the four files).
- Standards 1 (`TabMenuDeps.shown` optional only so that `tests/shell/panes/strip/tab-menu.test.ts` type-checks unchanged): fixed at landing. `shown` is required (`tab-menu-state.svelte.ts:51`), the pick's guard reads `deps.shown() !== tab` (`:233`), and the test's fixture gains `shown: () => ''`. Keeping it optional was the lazy option.
- Standards 2 (two paths of the load window: a reread of the note while the first `prepend` waits clears the flag and lets a second run queue a second head; an Editor remounted after a failed read leaves the flag set, so the command is offered nowhere until a keystroke): fixed at landing. `asked` (`status/front-matter-offer.svelte.ts:43`) holds the editor the run was asked of, and the effect clears it once the text has a header, which the run's edit gives it, or once the tab holds another editor, whose queue no longer holds the run; `prepend` gains `unless` (`ui/controls/editor/types.ts`), which `runCommand` tests on the model's text when the edit runs (`commands.ts:147`), and the offer passes the header reading, so a note read again from disk with a header while the editor loads gets no second head. The head comments of both files say so.
