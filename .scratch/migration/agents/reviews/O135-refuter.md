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
