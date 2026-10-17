# O40, repair round 1

The refuter's report is `agents/reviews/O40-refuter.md`. Each item below carries its ruling. Work in `.agents/worktrees/migration-O40` only, under the brief `agents/briefs/O40.md` and `agents/spec.md`; no git command that changes state; a file is moved with `mv`. In the ledger you write only your report, `agents/reviews/O40-report.md` in your worktree's ledger copy, with a section "Repair round 1" appended under the first report.

Diagnosis is banned (open item 131): you never run `/diagnose`, never start a diagnosis agent or any other agent, and never ask for or suggest one. You run no page, no server, no Electron app and no browser; every behaviour only a page shows is proved by the orchestrator at the look on landing. You never take focus on Axel's screen.

A shortcut is a finding: a narrower reading of an item, or work inside an item called outside it, is done or handed back with the reason before the report. The path list of the brief is widened to every file an item below needs; the report names each file outside the brief's list with its item.

## Axel's rulings

R1. Open item 133 (a), item 40 (row 73). The Markdown server started for a link rewrite lives while the page that asked for it is open, and ends 60 s after that page closes when no tab or page took it over, as a tab's server does. G36's text now reads so (the orchestrator changed `agents/guarded.md`); change its lifetime row 'is started for a link rewrite with no Markdown tab open and ends 60 s after its answer, not at 59.999 s' in `tests/server/machine/lsp/lifetime.test.ts` to the new rule, with the title G36 now names: 'is started for a link rewrite with no Markdown tab open, is not ended while its page stays open, and ends 60 s after the page closes, not at 59.999 s'. A second drag of the same page then finds the server warm; the report gives the unit-level time of the second rewrite against the first.

R2. Open item 134 (a), item 34 (row 46). Add the command "Open File (Index)" beside "Open File (HEAD)", everywhere "Open File (HEAD)" is offered (find each place with a grep of its catalogue key and its caller), opening the index side of the file: `headTabState(root, path, 'index')`. The tab it opens keeps its Index side across saves, reloads and git state changes, which is row 46's must-hold. Its words come from the catalogue beside the HEAD words (`config/text/views/sources/repositories.yml`, `menu_open_head`). HELP.md names neither command today; its Repositories section gains one sentence naming both, what each opens and that the Index tab keeps its side.

R3. Open item 135 (a). Guarded entries and tests for four behaviours. The orchestrator wrote the entries G100 to G103 into `agents/guarded.md` with their behaviour; you write one test per entry, a table where the unit has several outcomes, and the report gives each test's file, describe and titles, so the orchestrator fills each entry's Code and Test lines at landing. Each test is run on the unchanged tree first (the base copy, or with your change set aside in a scratch copy of the file outside the worktree) and its failure quoted, then run after the change and its pass quoted.
- G100, item 1: an open merge tab reads the three sides again when the repository's git state moves: a second conflict written behind it is drawn, and a conflict resolved behind it says the path is no longer in conflict.
- G101, item 2: the commit box takes git's new prepared message when it changes while the field still holds the one offered before; a message the reader typed stays.
- G102, item 20: two browser tabs that each change the layout within a second keep both changes, and an operation whose node the other tab removed is dropped.
- G103, item 31: a terminal grid drawn again, by a reload, a move, Float or Return to Page, shows the lines it was scrolled to.

## The refuter's findings

F1. Spec 1, item 17 (row 61). `source-options.ts:128-137` calls `input.fs.listing(root, folder, EVERYTHING)`, and `listing()` asks the server on the first call for a folder, so a switch over N roots sends up to 2N listing requests the base did not send. Ruling: the settings file is read only once a listing the store already holds names it; `named()` asks for no listing of its own, and reads the file when a later listing the store receives names it. The report gives the requests a switch over the look hub's roots sends, before and after, from a unit-level run of the reader with a fake store that counts its calls.

F2. Spec 2, item 36 (row 50). The armed words are said on the bar and stay cut on the row. Ruling: the item's text stands: at every row width the armed words are drawn whole on the row, or the row gives them their room while armed (for example the description and the other row parts give way while a Kill is armed), and the armed Kill stays under the pointer for the second press. Saying the words on the bar alone does not close it. The report states the widths read (180, 203 and the default) with what each draws.

F3. Proof 1, item 28 (row 30). On the brief's twenty-node shape the base placed the project within the link distance on all 20 links, and the change places 5 of 20 at 1.00 to 1.09 of it. Ruling: the placement must hold on both shapes: on the twenty-node shape no link ends longer than on the base, and on the 161-node shape of the look hub the project settles next to its links within the link distance. The unit run is a test file under `tests/` only if a guarded entry covers it; otherwise a scratch test file outside the worktree whose run the report quotes, run on both shapes, before and after, with the numbers.

F4. Proof 2, item 38 (row 70). Give a unit-level timing of the work the change removed from the first key, before and after, as the brief asked; the matcher's own timing stays in the report beside it.

F5. Proof 3 (the report as a whole). Quote, as `agents/spec.md` "What every package obeys" asks: (a) the history-words grep over the added comment lines and test titles, each hit judged; (b) the grep after each changed name or shape (`onsaid`, `registerTabSave`, `Question`, `Asker`, and every caller of `joinPath` under `src` with what each does now with an empty or relative base or a path starting with `/`); (c) the empty, duplicate and collision checks for each new key (`oculus.terminal-viewports`, `ui.confirm_save`, `ui.confirm_dont_save`, the close-save registrations) with the in-flight, after-close and superseded cases.

F6. Standards 1, comment wraps. Every comment the step edited is rewrapped as a whole paragraph at 100 columns, so no line inside a sentence ends short: the four the review names (`channel.ts:490`, `Merge.svelte:29`, `latex-widget.ts:11`, `CommitBox.svelte:23`) and the 44 other pairs its count found. The report quotes the count after the change.

F7. Standards 2, `tests/state/workbench/navigation/pages.test.ts:149`: the wait on `setTimeout(settled, 0)` becomes a wait on a signal (the question's own promise, or the hold the close sets), so one more hop in the close's chain cannot let the test skip its question.

F8. Standards 3, the new tests outside a guarded entry: `tab-menu.test.ts` (2), `pages.test.ts` (2), `app-editor-close.test.ts` (1), `editor-saved.test.ts` (1), `source-unserved.test.ts` (1), `window-guard.test.ts` (1), `undo.test.ts` (1 and rows). Fold each into its entry's test as a row of the table the unit already has (the close question's three tests in `tab-menu.test.ts` become one table), and give each final title in the report so the orchestrator writes it into G28, G96, G93, G47 and G9 at landing.

F9. Standards 4, the titles that say "No": `tab-menu.test.ts:132` and `app-editor-close.test.ts:111` call `question.cancel()`, and the question has no "No"; the titles say Cancel.

F10. Standards 5, `SaveToLiterature.svelte:3-5`: the head comment says what item 10 made true, that the primary is taken also when its list leaves Literature to the engine's path and the file is there.

## Points that need nothing from you

- Items 35 (row 49) and 43 (row 84): the orchestrator retakes both looks at landing, over the hub's current settings and with the app's log open.
- The scratch probes of your first run: under the standing ruling of open item 116, nothing they produced is used as proof; this round's runs are quoted from commands the report gives in full.

## Verify before you report

From `tools/oculus` in the worktree: `npm run test:quick -- --base 06aaa0da4`, every command passing; the test files of every guarded entry this round changes (G9, G28, G36, G47, G93, G96 and the four new ones), each run and its result quoted; the ASCII check over the files you changed. The plan's whole verify list runs once, at landing on main.

## Report

Append "Repair round 1" to your report: its first line says what is not done, if anything; then one section per item R1 to R3 and F1 to F10 with the change, its place, and the run before and after; then every file outside the brief's path list with its item.
