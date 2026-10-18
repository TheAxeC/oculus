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

## Repair round 1, refuted

```
$ npm run test:quick -- --base 06aaa0da4        (from tools/oculus in the worktree, run twice, both exit 0)
test:quick: 148 changed file(s), from git since 06aaa0da4
test:quick: 129 test file(s), 9 essential
tests/routes/hubs/hub-writes.test.ts: changed, run by npm run test:slow
ok      prettier (0.6 s): All matched files use Prettier code style!
ok      ASCII gate (0.6 s)
ok      svelte-kit sync (2.4 s)
ok      eslint (1.8 s)
ok      svelte-check (5.9 s): 1792282317246 COMPLETED 513 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest (41.5 s): Duration  35.95s (transform 47.83s, setup 0ms, import 71.16s, tests 60.52s, environment 1.26s)
test:quick: 44.0 s (limit 45.0 s); every command passed
  second run: "ok vitest (44.2 s)", "test:quick: 46.1 s (limit 45.0 s); every command passed", "test:quick: over the time limit"

$ npx vitest run $(cat $S/o40/guarded-files.txt) --testTimeout 0 --reporter=dot
  (the builder's list: the test files of G9, G28, G36, G47, G93, G96, G100 to G103, plus literature-home and clone-after)
 Test Files  45 passed (45)
      Tests  513 passed (513)                                    (report: 45 / 513, reproduced)
$ npx vitest run tests/routes/hubs/hub-writes.test.ts
 Test Files  1 passed (1)
      Tests  30 passed (30)                                      (report: 30, reproduced)
$ npx vitest run <the 10 tree-check files the report names> --testTimeout 0
 Test Files  10 passed (10)
      Tests  115 passed | 7 skipped (122)                        (report: same, reproduced)

$ ASCII gate (spec.md perl form) over the 145 files changed since the base (git diff --name-only plus untracked, .scratch left out)
  no output, exit 0
$ wc -l over the changed src files: largest context.ts 880, ui.svelte.ts 878, channel.ts 876, TerminalGrid.svelte 520,
  Source.svelte 519, PaneView.svelte 519; nothing over 880 / 520
$ sh utils/unused-exports.sh, diffed with O40-base/unused-exports.txt
  one line differs: `noServer` left channel.ts's line; no line added   (report: same)

Reruns of the round report's evidence, each on my own scratch copy of the current worktree ($S/rv/now) or of the base copy ($S/rv/base):
$ vrun2.sh o40/f1/count.mts        base: "look hub (one root): 1 request(s): text look-hub/.oculus/settings.yml (404)"
                                    now:  "look hub (one root): 2 request(s): listing look-hub / hidden; listing look-hub /.oculus hidden"
                                    now:  "three roots: 6 request(s): ... text configured/.oculus/settings.yml"   (reproduced)
$ vrun2.sh o40/r1/links-warm.mts   now:  first 5446 ms, pids [40650]; after 65 s pids [40650]; second 498 ms, same pid
                                    base: first 10613 ms; after 65 s pids []; second 11311 ms, new pid       (shape reproduced)
$ vrun2.sh o40/f5/kept-probe.mts   now:  "A ... next grid at line 10", "B ... next grid at line 10"           (after-run reproduced)
$ npx vitest run tests/zz/first-key.client.test.ts (o40/f4 files copied into my copy)
                                    "10 open files: first key base 4.11 ms (the list emptied), now 0 (no change); the answer base 12.92 ms, now 5.41 ms"
                                    "30 open files: first key base 3.85 ms ..., now 0 ...; the answer base 12.42 ms, now 5.39 ms"
$ vrun2.sh o40/f4/time-first.mts   "prepare 37.8 ms over 9893 names", per key 0.56 to 2.76 ms           (report: 36.4 ms, 0.61 to 2.52 ms)
$ python3 o40/shortlines.py        "0 pairs"   (this script runs `git -C <worktree> status --porcelain`; see Findings)
$ my own wrap counter (no git, over the 145 changed files against O40-base): "0 pairs"
$ my own probe $S/rvprobe/clear-best.mts (the builder's map generator; best clear spot on a 1 px grid, inside the box less its pad,
  r + 9 + gap clear of every placed node), 161 nodes, 3 links, per map "now / best-clear" over L:
  4: 1.08/1.08  6: 1.03/0.97  11: 1.02/0.85  12: 1.09/0.62  13: 1.08/1.03  14: 1.27/1.03  20: 1.05/0.98; the other 13 maps now <= 1.00
  20 nodes: every map now equal to base (0 beyond L)
$ my own undo probe (tests/routes/edit/undo/zz-review-probe.test.ts in each scratch copy): delete "First task" of QUOTED_TASKS, undo
  base, no hand change:   '- title: "Second task"\n    funding: "ZonMw"\n\n  - title: First task'   (field and quotes lost, appended)
  base, hand change:      same shape, funding "NWO"
  now,  no hand change:   the file byte for byte as written
  now,  hand change:      '- title: "Second task"\n    funding: "NWO"\n\n  - title: First task'   (identical to base's fallback)
Not rerun: map-shapes.mts as written (it imports the builder's basecopy; my clear-best probe replaces it), index-tab.mts (R2 probe;
  read by code instead), the G100 to G103 base-copy failures (the tests pass now; the base runs are the builder's).
```

### Verdicts

Items of the brief's "What to build":

- 1: holds; `merge-reads.svelte.ts` reads again on `git()` moving, keeps choices on same sides, keeps the done note; G100 test (4 rows) passes in my guarded run.
- 2: holds; `followPrepared` in `prepared-message.ts`, G101 test (7 rows) passes.
- 3: holds; unchanged this round, `SourceItems.svelte` null-indent guard present; svelte-check 0 errors.
- 4: holds; unchanged this round (`openRuns`, `highlights={tints}`); look a/i43-23.
- 5: holds; unchanged, the `[role="tab"]` test in `PaneView.svelte` present; look d/i43-37.
- 6: holds for its text (both Confirms at `level="palette"`); the round's button reorder of the leave step is Spec 3.
- 7: holds; no `onsaid` in `SaveToLiterature.svelte`.
- 8: holds; unchanged (`_location`).
- 9: holds; unchanged (`sizePicture`); comment wrap now clean.
- 10: holds; `homeNaming` takes the engine-path Literature file; head comments now say so (F10 closed).
- 11: holds; unchanged.
- 12: holds; unchanged.
- 13: holds; unchanged.
- 14: holds; G96 table (2 rows) passes.
- 15: holds; byte for byte without a hand change (my probe). The fallback after a hand change drops `funding: ""` and the quotes and appends the entry: my base run gives the identical text for every delete undo, so this is the base's defect kept in the fallback the brief named (`createEntry`), not one the step introduced. The G9 table does not assert the dropped field; it asserts the order and the kept hand value.
- 16: holds; G9 rows pass.
- 17: violated in part; Spec 1 and Spec 2.
- 18: holds; `joinPath` unchanged this round; the report's per-caller reading (F5(b)) matches the two callers I sampled (`file-git.ts:89`, `debug.svelte.ts:289`).
- 19: holds; unchanged.
- 20: holds; `rerun.ts` now saves the arrangement taken when an operation is dropped; G102 table (2 rows x 2 orders) passes.
- 21: holds by reading; look c/L76.
- 22: holds; unchanged.
- 23: holds; `undid_new_entry: add undone`.
- 24: holds; tab-menu table (4 rows), pages table (2 rows), app-editor-close table (5 rows) pass; Cmd+W, Enter and Escape are the look's.
- 25: holds; unchanged (`sourceKept`).
- 26: holds; G47 table darwin row passes.
- 27: not applicable, as the first review said (premise wrong); look e/L22.
- 28: violated in part; Proof 1.
- 29: holds; unchanged.
- 30: holds by reading; look c/L82.
- 31: holds; G103 table (6 rows) passes; the in-round `kept-viewport.ts` fix reproduces line 10 in my run of kept-probe on the current code. Its "before" evidence is Proof 2.
- 32: holds; unchanged.
- 33: holds; G93 table (4 rows) passes.
- 34: holds under ruling R2; Open File (Index) on Staged and Changes rows (`change-menu.ts:83-84`, `repositories.svelte.ts:539-541`), the only place Open File (HEAD) is offered (grep of `menu_open_head`, `openHead`, `CHANGE_OPEN_HEAD`); HELP.md:461 names both; one stale doc comment, Standards 1.
- 35: not applicable, as the first review said (premise wrong); the look over the hub's current settings.
- 36: holds by reading; Behaviour 1 names a change the report does not state.
- 37: holds; unchanged.
- 38: holds by reading; the ~4 ms removed is small against 53 to 100 ms, so the 50 ms bound is the look's; Proof 3.
- 39: holds by reading; look c/L76.
- 40: holds under ruling 133 (a): warm second rewrite 498 ms, same pid; the first drag of a page session is still cold (5446 ms in my run), which option (a) said and Axel took.
- 41: holds; unchanged; G90 tests pass.
- 42: holds; unchanged.
- 43: not applicable, open item D; the look with the app's log.

Cases of the brief's "Cases":

- Item 1: met; G100 rows 'a second conflict written behind it is drawn' and 'a conflict resolved behind it says the path is no longer in conflict' pass; what the editors draw is the look's.
- Item 2: met; G101 rows cover side then side2, the typed message and the empty prepared message.
- Item 4: met by reading `openRuns`, unchanged this round; look a/i43-23.
- Items 15 and 16: met; G9 table and my probe (byte for byte; hand change kept).
- Item 18: met; joinPath unchanged since the first review's rerun.
- Item 20: met; G102 rows pass, both orders.
- Item 24: met for Save, Don't Save, Cancel, a failed save, no save and a page close by the tests; Cmd+W/Enter and Escape are the look's.
- Item 26: met; G47 darwin row.
- Every other item: the look on landing, with the records the first report names.

### Findings

1. Spec, `src/lib/views/shared/prose/editor/source-options.ts:128-137`, "const found = input.fs.listing(root, folder, EVERYTHING);": F1 is not closed; the builder raised it again as open item F1. **The builder's premise claim holds when I read the code:**
   - `src/lib/server/files/fs.ts:268` lists `.filter((entry) => hidden || !skipped(entry.name))`, so a default listing never names `.oculus`.
   - `listing()` at `fs.svelte.ts:418-428` fetches on the first call for each pair of toggles.
   - The store holds a listing that names `.oculus` only when a Files tab shows hidden files, or after `gone()` (`fs.svelte.ts:527-540`) read a folder with everything shown. The default toggles are `DEFAULT_SHOWN = { hidden: false, ignored: false }` (fs.ts:155).
   - No server payload names the settings file: a grep of `settings.yml` and `REPO_SETTINGS` under `src/lib/server` finds none.

   **So the ruling cannot be met as written without one of these changes:**
   - a wire change (a listing or text answer that says the file is absent without a 404), or
   - a change to what a default listing returns (`.oculus` exempted from `skipped()`, which draws `.oculus` in the Files view with hidden files off, a visible change).

   With the ruling as written, a root's settings file is never read while hidden files are off, against HELP.md:328.

   My rerun of count.mts reproduces 1 request (404) on the base and 2 listings (no 404) now for the look hub.

   A smaller point: `named()` asks for the hidden-and-ignored listing even when a Files tab already holds a hidden-only listing that names `.oculus`. It does not read the other forms first, as `gone()` does with `heldListings`.

   Failure scenario: a workspace switch over N roots sends up to 2N listings the base did not send.

   Verdict: item 17 violated in part. This is the open item's decision, for the orchestrator or Axel.
2. Spec, `src/lib/state/system/config/editors/origins.ts:121` and `src/lib/state/workbench/navigation/editor-text.ts:117`, "originsOf(key, fileText(key, REPO_SETTINGS), parse)" and "const file = input.fileText(root, REPO_SETTINGS);": what is wrong: two other readers still ask for the settings file without a listing naming it. `repoOrigins` runs from `Origins.svelte:22` for every root on the Settings `editor.languages` row, and `saveRulesOf` runs on every save through `context.ts:358-369`. Item 17's must-hold is "a switch sends no request that 404s". Failure scenario: with Settings open on the editor.languages row, a switch to a workspace whose repository has no `.oculus/settings.yml` sends that read and gets 404; a save in such a root does the same. Verdict: item 17 violated in part.
3. Spec, `src/lib/shell/commands/CloneAsk.svelte:48-54` and `config/text/app.yml` (`clone.dont_save` removed): "discard={t('ui.confirm_dont_save')}" ... "ondiscard={() => void after.dontSave()}". What is wrong: removing the duplicate key is inside F5(c). The reorder of the clone question's leave step, from Cancel, Don't Save, Save (Confirm's `others`, base) to Don't Save, Cancel, Save (`discard`), is not needed for that and no item asks for it. Item 6 is the level only, and decision 2 governs the close questions over unsaved text, not the clone question over unsaved workspace folders. `others={[t('ui.confirm_dont_save')]}` would have kept the order. The report states the change and its before and after. Failure scenario: a reader who learned the clone question presses the old second-button position and gets Cancel where Don't Save was. Verdict: none; the orchestrator keeps it or restores the order at landing.
4. Proof, `src/lib/state/boards/structure/forces.ts:444-448`, "for (let step = 1; step <= NEAR_STEPS; step += 1) { for (const one of ring((step * 2 * length) / NEAR_STEPS, NEAR_TURNS))". What is wrong: the report says "In 7 of 20 maps, every spot within link distance of the anchor overlaps a node, or needs another node to move" (open item F3). My clear-best probe, on the builder's own map generator and its fit rule, finds a clear spot within L in 4 of those 7 maps: map 6 at 0.97, map 11 at 0.85, map 12 at 0.62 and map 20 at 0.98, where the code places the node at 1.03, 1.02, 1.09 and 1.05. Only maps 4, 13 and 14 have no clear spot within L. The 72 x 24 ring search at steps of L/12 misses small clear pockets. The decision that rests on it is open item F3, whether to let other nodes move (HELP.md:272); that premise is false for 4 of 7 maps. Also, the 161-node maps are random graphs from the builder's generator, not the look hub's own map. On the twenty-node shape the round is identical to the base in every map, and no node moved. Failure scenario: on a map like seed 12, a new project lands 9 percent beyond the link distance next to a clear spot at 0.62 L. Verdict: item 28 violated in part.
5. Proof, report F5(c), "The 'before' copy is this round's code before the fix (`priorcopy`, with kept-viewport.ts as it stood at the start of the round)" and "Before: ... next grid at line 47". What is wrong: `priorcopy` is the current code with `kept-viewport.ts` set back. My `diff -rq` of `$S/o40/priorcopy/src` against the worktree's `src` lists kept-viewport.ts among the files that differ. That is a run with the code under test reverted in a copy, which the user's rules ban in every form, so the "before 47" result is not used. The closure rests on reading the fix and on my run of kept-probe over the current code (line 10 in both cases). The report's G102 line, "The code as it stood at the start of this round: 2 failed", was run in `aftercopy`, whose state at that time cannot be checked now; it is not used either, and the base-copy failure ("Base: 2 failed") is the failing-first evidence. Failure scenario: an orchestrator who reads "Before: 47" as proof is relying on a banned run. Verdict: none.
6. Proof, report F4 table, "base 4.18 ms (the list emptied), now 0 (no change)". What is wrong: "now 0" is printed as a constant by `first-key.client.test.ts`, not measured. The "base" column runs the current `FileRows` fed the base's data flow (opened files, then an empty list), not the base's component. My rerun reproduces the numbers (4.11 and 3.85 ms; the answer 12.92 against 5.41 ms). The decision that rests on it is whether item 38's change is enough for the 50 ms bound. About 4 ms removed of a 53 to 100 ms first key does not settle that, so it stays with the look. Failure scenario: an orchestrator takes "now 0" as a measured first-key cost. Verdict: none.
7. Standards, `src/lib/views/sources/repositories/menus/change-menu.ts:56-59`, "A changed file's items: Open Changes (a diff, which an untracked file has none of), Open File (HEAD) (the version it is compared against, which an untracked file has none of) and Open File". What is wrong: R2 adds Open File (Index) to these items (lines 83-84), and the doc comment of `changeMenu` is not carried. The rules file says a sentence the change makes false is a defect. Failure scenario: a reader of `changeMenu` thinks a changed row offers three opens. Verdict: none.
8. Standards, `$S/o40/shortlines.py:6`, "out=subprocess.run(['git','-C',W,'status','--porcelain','--untracked-files=all','.'],...)". What is wrong: the builder runs a git command against the worktree through its own script, which the rules file bans in "Where you work" ("You never run a git command, read-only ones included ... no `git -C`"). My rerun of the script, as the brief asked, also ran that read-only `git status --porcelain`, which is outside the reviewer's three git forms. My own counter, without git, gives the same "0 pairs". Failure scenario: none to the tree; the rule exists so that the orchestrator alone reads git state. Verdict: none.
9. Standards, the round brief `agents/briefs/O40-round1.md` R3, "Each test is run on the unchanged tree first (the base copy, or with your change set aside in a scratch copy of the file outside the worktree)". What is wrong: the second form is a run with the code under test removed, which the user's rule on breakage testing bans in any brief. The builder's G100 to G103 base runs used the base copy; finding 5 is the run that took the banned form. Failure scenario: a later builder follows the brief's second form. Verdict: none (the orchestrator's text).
10. Standards, `src/lib/views/shared/prose/editor/source-options.ts:37`, "const EVERYTHING = { hidden: true, ignored: true };". What is wrong: `fs.svelte.ts:140` holds the same constant (`const EVERYTHING: ListingShown = ...`), and the rules file asks that a helper or schema be grepped and reused. Failure scenario: a change to the store's everything-shown form leaves this one behind. Verdict: none.
11. Behaviour, `src/lib/views/sessions/terminal/list/TerminalList.svelte:362-366`, "{#if arming === row.terminal && !narrow} <div class="armed-words" ...>". What is wrong: the armed words take a line of their own in the list's flex column, so while a Kill is armed every row below the armed row moves down by that line, and moves back up when the Kill disarms. The report states that the armed row's own line and its Kill do not move, but not that the rows below do. Failure scenario: a reader who arms row 1 and then reaches for row 2's Kill finds row 2 a line lower. Verdict: none; the look at 180, 203 and the default width sees it.

F2, F5(a), F5(b), F6, F7, F8, F9 and F10: closed. My reruns or reads reproduce each one:
- F5(a): my history-word grep over 1036 added comment lines and test titles finds only run-time uses of "still" and "no longer".
- F6: 0 pairs by my own counter.
- F7: `closing()` waits on the held-question promise.
- F8 and F9: the folded titles exist, and only the three renamed titles that the report hands to the orchestrator are missing from guarded.md's names.
- F10: the client list holds an engine-path Literature only when the file exists (`data/index.ts:743`).

### Declined to judge

- What F2 draws at 180, 203 and the default width: whether the armed words wrap whole, whether Kill stays under the pointer, and how far the rows below move. Only a page shows it; it goes to the look.
- The 50 ms first key (item 38) and the 1 s Refactor Preview on a warm server (item 40) at the look hub's size: both are the look's measurements.
- The clone question's new order, the terminal viewport after a quick Float and Return, and every other DOM behaviour the first review left to the look.
- Whether open items F1 and F3 are taken, and whether the clone reorder (finding 3) is kept: the orchestrator's or Axel's call.
- How `aftercopy` stood when the G102 round-start run was made (finding 5): no file now records it.
- The report section's absence from the worktree's ledger copy (the builder handed it back in its message): the orchestrator appended it in the main checkout. Reading git state beyond `git status --short` would be needed to say more.

Reviewer usage: ac2f1f4902dfa50d5, claude-opus-5-5, 336,123 tokens, 117 tool uses, 25.3 min.

## Closed

The findings of the review over round 1, each with its disposition (none sent back; one repair round and no other, Axel):

- Finding 1 (item 17, the settings file without a request): raised as open item 138, ruled (b): the folder list the server pushes carries each root's settings text, in O42. O40 lands with the round's lookup.
- Finding 2 (the Settings `editor.languages` row and the save rules still read the settings file): in open item 138 (b), in O42.
- Finding 3 (the clone question's leave step reordered): fixed at landing, the order of the base restored with `others={[t('ui.confirm_dont_save')]}`.
- Finding 4 (the ring search misses clear spots within the link distance): open item 139, ruled (a); a finer search for the closest clear spot written at landing; no other node moves.
- Finding 5 (the priorcopy and aftercopy runs): not used as proof; the closure of item 31 stands on the reviewer's run of the current code and the base-copy failures.
- Finding 6 (the F4 "now 0" column printed as a constant): no change; item 38's 50 ms bound is the look's.
- Finding 7 (the `changeMenu` doc comment): fixed at landing.
- Finding 8 (`shortlines.py` runs git): not used as proof (open item 116's standing ruling); the reviewer's own counter gives 0 pairs.
- Finding 9 (the round brief's second form of the first run): the form removed from `agents/briefs/O40-round1.md`.
- Finding 10 (`EVERYTHING` defined twice): fixed at landing, the store's constant reused.
- Finding 11 (rows below an armed Kill move down a line): seen at the look.
- The round's hand-backs: R2's guarded entry, open item 140 (a), written at landing; point E, open item 141 (a), the armed Kill's entry and test written at landing.
