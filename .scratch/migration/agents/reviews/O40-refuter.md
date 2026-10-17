# Step O40 refuter report (on .agents/worktrees/migration-O40, base 06aaa0da4)

A page this report cites (the rules file, a standard, a skill's text) is named with its section, never with a line number, since a page's lines move and a section's name does not. A finding in code keeps its `file:line`.

The report is written in the rules file's character set. A character outside it in a quoted line is written by its name in angle brackets, such as `<tab>` or `<em dash>`.

## Verification (rerun by the reviewer)

```
$ npm run test:quick -- --base 06aaa0da4        (exit 0)
test:quick: 129 changed file(s), from git since 06aaa0da4
test:quick: 121 test file(s), 9 essential
tests/routes/hubs/hub-writes.test.ts: changed, run by npm run test:slow
ok      prettier (34.7 s): All matched files use Prettier code style!
ok      ASCII gate (37.1 s)
ok      svelte-kit sync (46.7 s)
ok      eslint (48.5 s)
ok      svelte-check (50.5 s): 1792275759765 COMPLETED 513 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest (102.8 s): Duration  94.54s (...)
test:quick: 149.7 s (limit 45.0 s); every command passed
test:quick: over the time limit
test:quick: not covered: tests outside the selection, tests/checks, slow tests,
            build, lint of unchanged files; npm run test:landing runs them
  (the report quotes 84.5 s for its own last run; both runs are over the 45 s limit; other suites ran on the machine during mine)

$ ASCII gate of agents/spec.md (perl form) over the 129 touched files
  no output, exit 0

$ wc -l over every touched file (limits 880 for a source file, 520 for a component)
  state/client/context.ts 880 (base 874); state/workbench/ui.svelte.ts 878; server/machine/pty/channel.ts 876;
  Terminal.svelte 520 (base 517); TerminalGrid.svelte 520 (base 520); PaneView.svelte 519; Source.svelte 518;
  Tree.svelte 517; DiffSection.svelte 504 (base 524); layout.svelte.ts 858 (base 890); viewer.svelte.ts 832 (base 880);
  server/root/context.ts 786 (base 877). Nothing over a limit.

$ sh utils/unused-exports.sh, compared with the base copy's unused-exports.txt
  one difference: `noServer` left channel.ts's line; no line added

$ npx vitest run <the 24 test files of G9, G28, G37, G42, G47, G65, G90, G93 and G96, hub-writes.test.ts included>
  Test Files  24 passed (24)
  Tests  319 passed (319)

Probe reruns of what the report quotes:
$ node --experimental-strip-types join-now.mts (worktree)
  "look.tex", "a/b", "", "a/b", "b", "a/b", "/b", "/"            (matches the report, item 18)
$ touches.mts
  files a move changed: 22, of them left out by the filter: 0    (matches the report, item 40)
$ time-first.mts
  prepare 33.4 ms over 9893 names, per key up to 8.10 ms        (report: 39.7 ms, up to 6.3 ms; consistent)
$ radar2 first call, base, over the hub's own settings
  radar {"lastRun":"2026-10-11"} leads 1                         (matches the report, item 35)

Premise checks:
$ sed -n '44,47p' .oculus/config.yml (the hub)
  - { key: leads,          file: "feeds/position-leads.yml" }
  - { key: radar,          file: "feeds/literature-radar.yml" }  (line 47)
$ grep -n 'key: radar\|key: leads\|leads_file\|radar_file' scratchpad/looks/d/hub-config.yml.bak (the look hub)
  53:leads_file: feeds/position-leads.yml
  57:radar_file: feeds/literature-radar.yml                       (no `key: radar` or `key: leads` line)
$ grep -rn "headTabState(" src
  repositories.svelte.ts:532: layout.openView('source', headTabState(root, path, 'head'));   (the only caller)
$ grep -o 'worker[^"]*' looks/f/r2/network.jsonl ; looks/records/f/L93.md
  /node_modules/monaco-editor/esm/vs/editor/editor.worker.js?worker and ?worker_file&type=module, only on
  http://127.0.0.1:8816 (the Vite dev server: console "[vite] connected."); the built app on 8806 loads
  /_app/immutable/workers/editor.worker-a97YorOs.js

Comment-wrap count (reviewer's read-only probe over the diff's touched .ts/.svelte/.mts/.js files):
  pairs of comment lines, at least one added by the step, where the line ends inside a sentence and the
  next line's first word fits within 100 columns: 48; with 5 or more columns to spare: 3
  (channel.ts:490, latex-widget.ts:11, Merge.svelte:29)
```

## Verdicts

Items of the brief's "What to build", in its numbering:

- 1: holds, by reading `Merge.svelte`: the load effect is keyed on root, path and `gitFor(root)` with `seen`; `sameSides` keeps choices; the done note kept after the tab's own Complete Merge or Accept Deletion. No test (needs a new entry, open item E); look a/i43-1.
- 2: holds, by reading the CommitBox diff: `if (held.trim() === '' || (offered !== '' && held === offered)) repositories.setMessage(root, prepared);` then `offered = prepared`; a typed message stays; the empty-prepared branch is the base's. Look a/i43-1.
- 3: holds, by reading `tab-asks.svelte.ts` and `SourceItems.svelte` (the indentation item and choices drawn only when not null); svelte-check 0 errors. Look f/i43-12.
- 4: holds, by reading `openRuns` in `merge-regions.ts` and `highlights={tints}` on the Result editor. Look a/i43-23.
- 5: holds, by reading `PaneView.svelte:184` (no activation for a target inside `[role="tab"]`). Look d/i43-37.
- 6: holds, both Confirms of `CloneAsk.svelte` at `level="palette"`. Look e/R10.
- 7: holds, `onsaid` gone from SaveToLiterature and from the two cards' use of it; grep of `SaveToLiterature` across src, docs, HELP.md and DESIGN.md finds no sentence about its `onsaid`. Look f/L8.
- 8: holds, `#position` takes the page and the offset from `_location`. Look f/L38.
- 9: holds by reading (`sizePicture`); the comment wrap of its head comment is Standards 1. Look f/L57.
- 10: holds, `homeNaming` in `hubs.ts` takes a hub holding the Literature file at the engine's path, doc comment rewritten; hub-writes.test.ts passes. One head comment it makes incomplete: Standards 5.
- 11: holds, by reading `rescope` / `changeAndRun`. Look c/L20.
- 12: holds, by reading `Entry.svelte:184-193`. Look d/owed-D52.
- 13: holds, the `.reveal` wrapper around the value pill is gone, head comment rewritten. Look d/owed-D52.
- 14: holds, G96 test `editor-saved.test.ts` passes in the guarded run; base failures quoted in the report.
- 15: holds, G9 rows in `undo.test.ts` pass in the guarded run.
- 16: holds, same run.
- 17: violated in part, Spec 1.
- 18: holds. The rerun of join-now.mts matches. By my reading of the diff, the new `joinPath` differs from the base only for an empty or relative base or a path that starts with `/`; the report does not show the per-caller reading the item asked for (Proof 3). Look f/L62.
- 19: holds by reading (`float ?? undefined` in palette-open.ts and the rows). Look o/L112.
- 20: holds, by reading `layout/saved/rerun.ts` (a pane named by its tabs, a split by its leaves, a page by its page, an empty pane by its place; an operation whose node is gone is dropped; the argument indices checked against the real signatures). Look o/line720.
- 21: holds by reading `FileRows.svelte` `keep(root)`; it relies on bits-ui's two-tick reselect, which only the look shows. Look c/L76.
- 22: holds, `TmuxSilence` and `silenceWords` from the catalogue. Look d/L91.
- 23: holds, `history.yml:74` reads `undid_new_entry: add undone`.
- 24: holds; its tests pass in the guarded run. Standards 2, 3 and 4 concern its tests.
- 25: holds by reading `sourceKept`. Look on the O30 looks.
- 26: holds, the G47 test in `window-guard.test.ts` passes in the guarded run.
- 27: not applicable, premise found wrong by the builder (nothing in the box takes Cmd+A); the menu.ts head comment rewritten. Look e/L22 with real keys.
- 28: violated, Proof 1.
- 29: holds by reading (`data-tab-loading`, `PaneBody.svelte:251`). Look c/L81.
- 30: holds by reading; the paste-select probe is not rerun (Declined). Look c/L82.
- 31: holds by reading `viewport.ts` and `kept-viewport.ts`; DESIGN.md records the `sessionStorage` keeper. Look d/L27.
- 32: holds by reading `revealLaidOut`. Look f/L58.
- 33: holds, G93 test in `source-unserved.test.ts` passes in the guarded run. Look f/L71.
- 34: not applicable, premise wrong: `headTabState(root, path, 'head')` at `repositories.svelte.ts:532` is the only opener; open item B.
- 35: not applicable, premise wrong: the look hub's settings carry `leads_file:` / `radar_file:` and no `key: radar` line, while the hub's `.oculus/config.yml:47` does; the base already reads `radar {"lastRun":"2026-10-11"} leads 1` over the hub's settings. Open item C.
- 36: violated in part, Spec 2.
- 37: holds by reading `CommandRows.svelte` `panelled` and the `Files.svelte` busy line removed (the report states it). Look o/L95, o/L68.
- 38: holds by reading (the list keeps the open files until the matcher answers); the 50 ms bound is the look's. Proof 2.
- 39: holds by reading, with item 21. Look c/L76.
- 40: violated in part: the cold drag takes 4.2 to 5.2 s against the 1 s bound; the builder raised it as open item A (clash with G36). The touches rerun matches the report.
- 41: holds by reading `pty-wire.ts` (a re-subscribe after a size change, behind the grid's `SETTLE` debounce in `TerminalGrid.svelte:375-382`); G90 tests pass. Look d/L84.
- 42: holds by reading `PaneBody.svelte:262`. Look f/L17.
- 43: not applicable, open item D. My read of monaco 0.57's ESM entry: `StandaloneWebWorkerService._createWorker` falls back to monaco's own URL only when `MonacoEnvironment.getWorker` is missing or returns undefined, and `workers.ts` `workerFor` always returns a Worker; the only records naming the path (f/L93, f/r2) show it on the dev server port 8816 as `?worker` / `?worker_file&type=module`, the address of `import EditorWorker from 'monaco-editor/editor/editor.worker?worker'`.

Cases of the brief's "Cases":

- Item 1 (second conflict drawn; resolved says no longer in conflict): not verifiable at unit level, no test (open item E); look a/i43-1 settles it.
- Item 2, side then side2: met, by the reading above. Hand-edited field: met (`held === offered` false). No merge: met (the empty-prepared branch is unchanged from the base).
- Item 4: met, by the report's `openRuns` run (`[{line 2,count 1},{line 4,count 1}]`, then `[{line 5,count 1}]`), not rerun by me; look a/i43-23.
- Items 15 and 16 (delete, add, hand change): met, G9 rows pass in the guarded run.
- Item 18: met, join-now rerun prints `"look.tex"`, `"a/b"`, `""`, `"a/b"`, `"b"`, `"a/b"`, `"/b"`, `"/"`; `joinPath('/', 'b')` stays `/b` as the report's judgment call says.
- Item 20: met, by reading rerun.ts and the report's scratch run; the scratch test file is deleted, so not rerun.
- Item 24: met for Save, Don't Save, Cancel, a failed save, an untitled tab and a page close, by the tab-menu, pages and app-editor-close tests passing; Cmd+W then Enter and Escape are the look's (o/O30 case 41).
- Item 26: met, G47 test passes.
- Every other item: the look on landing, with the records the report names per item.

## 1. Spec

- `src/lib/views/shared/prose/editor/source-options.ts:128-137`: "const found = input.fs.listing(root, folder, EVERYTHING);"; what is wrong: `listing()` in `fs.svelte.ts:418` says "The first call for a folder asks the server", so `named()` fetches the root's listing under the hidden-and-ignored toggles and then `.oculus`'s listing whenever the store does not hold them; the brief asked that the file be read "only once the root's listing the store holds names it". The 404 is gone (the settings file itself is requested only once a listing names it), but the step adds listing requests of its own; failure scenario: a workspace switch over N roots sends up to 2N listing requests the base did not send, each 200; verdict: item 17 violated in part.
- `src/lib/views/sessions/terminal/list/RowFace.svelte:106-108` with `Terminal.svelte:376`: ".description { flex: 1 1 0; width: 0; min-width: 0; }" and "arming={(fit === null || fit.narrow || armedCut) && arm.armed() !== ''}"; what is wrong: the armed words stay cut on the row and are said whole on the bar; the brief asked "its armed words are drawn whole or the row gives them their room", and the bar is a third way it did not name; failure scenario: at 180 or 203 px a reader looking at the row, where the press happens, still reads cut words; verdict: item 36 violated in part (the Kill no longer moves; the words part is a choice the orchestrator rules on).

## 2. Proof

- Report, item 28: "| 20 nodes | max 0.9 L, 0 of 20 | 0.6 to 1.1 L, 5 of 20 at 1.00 to 1.09 L |"; what is wrong: the brief named the unit run "on a map of the look hub's shape (a project with two links among twenty)". On that shape the base already places the project within L on all 20 links and the change places 5 of 20 beyond L; the base defect reproduces only on the 161-node map. The decision that rests on it: whether `settleNew` is landed; failure scenario: on a map of the look hub's shape a new project settles up to 9 percent beyond the link distance where the base settled within it; verdict: item 28 violated. map-new.mts fails under plain node (ERR_MODULE_NOT_FOUND), so I could not rerun it.
- Report, item 38: "Unit timing (`time-first.mts`, 9893 names): prepare 39.7 ms; per key 0.4 to 6.3 ms ... The page-side cost cannot be timed at unit level."; what is wrong: the brief asked for "a unit-level timing of it before and after" of the work removed from the first key; the report gives one timing of the matcher, which it says is not the cost, and none of the removed work (the emptying of the list) before and after. My rerun gives prepare 33.4 ms and up to 8.10 ms per key; failure scenario: the orchestrator cannot tell from the report whether the change removes enough of the first key's 53 to 100 ms; verdict: none beyond the look the item already waits on.
- Report, whole: the rules file's "What every package obeys" asks the report to quote (a) the history-words grep over added comment lines and test titles with each hit judged, (b) the grep after each changed name or shape (`onsaid`, `registerTabSave`, `Question`/`Asker`, and for item 18 every caller of `joinPath` under `src`), and (c) the empty, duplicate and collision checks for each new key (`oculus.terminal-viewports` in `viewport.ts:72`, `ui.confirm_save`, `ui.confirm_dont_save`, the close-save registrations) with the in-flight, after-close and superseded cases. None of the three is in the report (`grep -n -i "grep\|collid\|duplicat\|in flight\|superseded" O40-report.md` finds only the item 43 build grep). My own history grep over the diff's added comment lines and titles found hits of "before", "still" and "no longer" that all describe run-time order or state, none history; svelte-check reports 0 errors, so every caller of the changed shapes compiles; failure scenario: a later reader of the report cannot see that these were checked; verdict: none.

## 3. Standards

- `src/lib/server/machine/pty/channel.ts:490`: " * taken. The listeners are told when it" (44 columns, the sentence goes on with "changes," on line 491); `src/lib/views/sources/repositories/merge/Merge.svelte:29`: "// settles it by hand. A choice rewrites the Result as" (58 columns, next "one edit of the editor's"); `src/lib/ui/controls/editor/kit/latex/latex-widget.ts:11`: "// narrower than the picture the box scrolls rather than shrinking the picture. Math" (84 columns, next "is typeset by KaTeX"); `src/lib/views/shared/changes/CommitBox.svelte:23`: "// commit waits until nothing is unmerged. An amend needs no staged path and no" (83 columns, next "message:", in a paragraph the step edited at lines 21-22). What is wrong: the rules file's "What every package obeys" says "A comment edited by the step is rewrapped as a whole paragraph at 100 columns, so no line inside a sentence ends short." The reviewer's count finds 48 such line pairs in the diff, these four clearly short and the other 44 within 0 to 4 columns of fitting the next word; failure scenario: the short lines read as paragraph breaks mid-sentence and the comment-width check does not catch them; verdict: none.
- `tests/state/workbench/navigation/pages.test.ts:149`: "await new Promise((settled) => setTimeout(settled, 0));"; what is wrong: the rules file says "A test waits on a signal (an event, a promise, a fake clock), never on a fixed sleep or a wall-clock margin"; this waits one macrotask for the close to read the saves and the terminals and hold its question; failure scenario: if the close's chain gains one more macrotask hop (a timer or a fetch in `busyTerminals`), `held` is still null, the `if (asked !== null)` skips the save and the test asserts over a page that was never asked; verdict: none.
- `tests/shell/panes/strip/tab-menu.test.ts` (2 new `it`s), `tests/state/workbench/navigation/pages.test.ts` (new describe 'the close of a page holding unsaved text' with 2), `tests/shell/panes/strip/app-editor-close.test.ts:121` (1), `tests/state/system/settings/editor-saved.test.ts` (1), `tests/state/sessions/source-unserved.test.ts` (1), `tests/server/desktop/window-guard.test.ts` (1), `tests/routes/edit/undo/undo.test.ts` (1 new test plus rows): what is wrong: the rules file says "An entry keeps one test per unit it covers ... written as a table where a unit has several outcomes, with one row per input that gives a different outcome", and `agents/guarded.md` names none of these titles; the close-question unit in tab-menu.test.ts now has three separate tests where the rule asks for one table; failure scenario: at landing the orchestrator must add each title to G28, G96, G93, G47 and G9 or fold them into rows, and until then the tests exist outside any entry; verdict: none (the report gives every new title, so the orchestrator can fold them at landing).
- `tests/shell/panes/strip/tab-menu.test.ts:132`: "it('asks before Close Others closes a tab holding unsaved text, naming it, and No closes nothing'" and `tests/shell/panes/strip/app-editor-close.test.ts:111`: "it('asks once the frame marked the document dirty, and No closes nothing'"; both bodies call `question.cancel()`. What is wrong: the question now draws Don't Save, Cancel and Save, and no "No"; the rules file says after changing a name or shape the change is carried to every hit; failure scenario: a reader takes "No" as Don't Save, which does close the tab, and reads the title as saying the opposite of the button; verdict: none (both titles are named in G28, so the new text goes to the orchestrator for guarded.md).
- `src/lib/views/shared/card/feed/SaveToLiterature.svelte:3-5`: "It writes the paper to the Literature collection of the / primary hub when the primary names the collection, else of the first hub that does"; what is wrong: item 10 makes the server take the primary also when its list leaves Literature to the engine's path and the file is there; the step edited this paragraph and the rules file says "A sentence in a document or a head comment that the change makes false is a defect of the change"; failure scenario: a reader of the card thinks a primary whose list names no Literature is passed over, which is the defect item 10 fixed; verdict: none.

## 4. Behaviour

- none. The user-visible changes I found in the diff (the Files view's busy line removed, Lit Watch and lead deletes undone byte for byte, the armed words on the bar, the re-subscribe after a resize, the `sessionStorage` keeper recorded in DESIGN.md) are each named in the report's user-visible list, judgment calls or DESIGN.md.

## Declined to judge

- The builder's scratch probes (map-new.mts, tracked.mts, viewport.mts, paste-select.mts, reveal.mts, repaint.mts, latex-left.mts, scratch-o40-case20.test.ts) against the brief's "No script is written for this step other than what the items build": they lived in the scratchpad and in a deleted scratch test; whether that counts is the orchestrator's or Axel's call.
- The probes that import Svelte rune modules ("$state is not defined" under plain node) and map-new.mts (ERR_MODULE_NOT_FOUND): rerunning them needs a scratch test file written into the worktree, which this review may not do.
- The widening into G8 (`tests/server/edit/writes.test.ts`, `tests/routes/hubs/hub-writes.test.ts`, outside the brief's write list, stated in the report's judgment calls): the orchestrator's call; hub-writes.test.ts passes in my run.
- The test:quick time limit: my run took 149.7 s and the report's 84.5 s, both over 45 s with every command passing; whether the limit binds this step is the plan's.
- Item 27's claim that Electron's `registerAccelerator` applies to Linux and Windows only: Electron's documentation is not read here; the look with real keys settles it.
- Open items A to E: Axel's rulings.
- Every behaviour that needs a DOM (focus, presses, tints, scroll positions, the 50 ms and 1 s bounds): the look on landing.

Reviewer usage: a03ea6cee5f5d717c, claude-opus-5-5, 179,623 tokens, 148 tool uses, 25.1 min.
