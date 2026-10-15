# Step Q72 refuter report (on /Users/axelfaes/workspace/research-hub/.agents/worktrees/Q72, base e36bcd0b4)

A page this report cites (the rules file, a standard, a skill's text) is named with its section, never with a line number, since a page's lines move and a section's name does not. A finding in code keeps its `file:line`.

The report is written in the rules file's character set. A character outside it in a quoted line is written by its name in angle brackets, such as `<tab>` or `<em dash>`.

## Verification (rerun by the reviewer)

All commands ran from the worktree's `tools/oculus` with `PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH`, unless a scratch copy is named.

```
npm run lint                                   -> no errors, lint exit 0
npm run format:check                           -> All matched files use Prettier code style!
npm run check                                  -> COMPLETED 4052 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
npx vitest run tests/checks/diagrams tests/checks/source/comment-width.test.ts tests/checks/imports tests/checks/tree tests/checks/source/history.test.ts --testTimeout 0 --hookTimeout 0
                                               -> Test Files  10 passed (10) / Tests  121 passed (121)
npx vitest run tests/checks/config/integrity.test.ts tests/checks/source/keys.test.ts tests/checks/source/html-sites.test.ts tests/checks/look/contrast.test.ts --testTimeout 0 --hookTimeout 0
                                               -> Test Files  4 passed (4) / Tests  76 passed (76)
npx vitest run tests/server/git/git-ops.test.ts -> Test Files  1 passed (1) / Tests  17 passed (17)
npx vitest run tests/state/client/terminal/terminal-close.test.ts tests/state/system/link-rewrite.test.ts
                                               -> Test Files  2 passed (2) / Tests  6 passed (6)
ASCII gate, perl form, over the 48 changed and new files (printf '%s\0' ... | xargs -0 env LC_ALL=C perl -ne ...)
                                               -> prints nothing, exit 0
sh utils/folder-check.sh                       -> prints nothing, exit 0
sh utils/size-check.sh                         -> prints nothing, exit 0
sh utils/unused-exports.sh, diffed against the base copy's unused-exports.txt
                                               -> < Unused exports (240) / > Unused exports (241) / > src/lib/ui/controls/editor/diff/git-provider.ts: createGitDiffs
npm run test:quick                             -> not run (the brief allows one run, the builder's; spec.md "Token discipline")
npm run diagrams / docs:palette                -> not run (both write the tree); in place, a node -e importing generate, staleFiles and paletteText from the worktree's utils:
                                               -> stale [] / two generations equal true / palette same true

Case 1, the report's quoted graph.ts one-liner:
  worktree                    -> modules 1761 edges 7044 / module cycles 0 [] / folder rings [] / views->state 1254 files 391 targets 187
  $TMPDIR/q72r-base (base src) -> modules 1760 edges 7043 / module cycles 0 [] / folder rings [] / views->state 1254 files 391 targets 187
Case 3, arrowsAlong()/labelsAcross() over docs/diagrams/*.svg:
  worktree (drawing/labels.mjs) -> channels 0 0 1703x3440, layer-data 0 0 304x921, layer-server 0 0 428x1027, layer-shell 0 0 305x1481, layer-state 0 0 469x1039, layer-ui 0 0 328x1209, layer-views 0 0 325x1910, layers 0 0 826x569, writes 0 0 4225x1927, drawings 9
  base SVGs, same measure       -> channels 2496 0, writes 61 0, every other 0 0, drawings 9
Case 4, G25 row on $TMPDIR/q72r-base (base src checked equal by diff -rq, worktree's diagrams.test.ts checked equal by cmp):
  npx vitest run tests/checks/diagrams/diagrams.test.ts -t "run no two arrows along each other" --testTimeout 0 --hookTimeout 0
  -> FAIL ... run no two arrows along each other in any drawing the source gives
     AssertionError: expected [ <horizontal ellipsis>(2557) ] to deeply equal []
     tests/checks/diagrams/diagrams.test.ts:846:23
     Tests  1 failed | 46 skipped (47)   Duration  182.89s
Case 6, the report's quoted node -e over $TMPDIR/q72/orth/case6-source.dot:
  -> utils/diagrams/drawing/apart.mjs:682  throw new Error(`${name}: the arrows cannot be drawn apart\n${left.join('\n')}`);
     Error: crowded: the arrows cannot be drawn apart
     exit 1
Case 7: nodes whose title holds " to ": channels.dot base 0, now 0; writes.dot base 13, now 13, same 13 titles. grep -c -- '->': channels.dot 198 -> 147, writes.dot 161 -> 161.
Cases 9 to 20, the builder's runner fed to node (node --input-type=module < $TMPDIR/q72/after-cases.txt, C=$TMPDIR/q72/c, TWO=a0540cf THREE=fce2155 MERGE=b79a10c C20ONE=514ec00 C20TWO=518908d):
  -> every "case" line equal to the builder's $TMPDIR/q72/after-cases-out.txt (diff printed nothing), among them
     case 9 channels f.ts->f.ts ... changes [13,0,14,25] actions lines
     case 10 rail f.ts->f.ts ... changes [24,32,23,0] actions lines
     case 11 [4,4,4,4] [0,0,1,3] [1,3,0,0]
     case 15 crlf ... changes [2,2,2,2] actions none
     case 18 check of heads against a rewritten text null
     case 19 sameFiles over equal texts, changes [1,1,1,1] and []: false
     case 20 binary b.bin->b.bin binary true equal true changes undefined actions lines
  (the code under test ran its own git reads in the builder's scratch repositories)
Case 12, G33 row on $TMPDIR/q72r-base:
  npx vitest run tests/server/git/git-ops.test.ts -t "reads a file's changes as git's hunks"
  -> fails at tests/server/git/git-ops.test.ts:249:30, Received: undefined; Tests  1 failed | 16 skipped (17)
  worktree: Tests  17 passed (17)
Monaco's DefaultLinesDiffComputer on the G33 pair -> 2,2,2,4 12,13,14,15 (exclusive ends), i.e. 1,0,2,3 and 12,12,14,14; git gives 2,0,3,4 and 12,12,14,14.
Case 24, grep -cF per declaration over field.css and the eight fields: each shared declaration 1 in field.css only; remaining repeats are other rules (SuggestInput .note padding and .item[data-highlighted] background, TextInput .text[readonly] background, TextArea's bare and rice rules); each of the eight: import of theme/field.css >= 1 and class oculus-field >= 1.
```

## Verdicts

Items of the brief's "What to build", in its numbering:

- 1: holds. Case 1's measures rerun on both trees and match the report; the verdict and the facts it records name no "nicer way" item. Q71's own numbers were reproduced through a Python script (Spec 1).
- 2: holds. Both drawings measure 0/0 (case 3 rerun), the G25 row fails on the unchanged tree with 2557 lines and passes after, the throw names the pair (case 6 rerun), no joining node (case 7), DESIGN.md paragraphs present at :129 and :161. Findings: Standards 1 (a stale comment in the test file), Spec 1 (scripts).
- 3: holds. Readers fill `changes`, the non-git builders carry none and say so (ops.ts:754, :792, compare.ts:422, diff-read.ts:48, :78, :118), `--no-textconv` in every pane read, heads checked against texts (case 18), `sameFiles` compares the field (case 19), Monaco's provider replaced through load.ts, G33 row red then green. Findings: Behaviour 1 (main-thread computation), Standards 2 (provider map), Spec 2 (files outside the write list).
- 4: holds by reading and by case 24's grep; the look itself is for landing.
- 5: holds; the three checks now await a barrier. Proof 3 names what the barrier no longer catches.

Cases of the brief's "Cases":

- 1: met, rerun on both trees, numbers match the report.
- 2: met, reading of "The re-read".
- 3: met, rerun before and after, drawings 9 and 9.
- 4: met, 2557 lines on the unchanged tree (182.89 s), passes in the worktree's tree-checks run.
- 5: met, two generations equal and no stale file by the node -e run; `npm run diagrams` itself not run by me since it writes the tree.
- 6: met, the error naming `l1->r1 along l10->r13` reproduced; the non-zero exit of `npm run diagrams` itself rests on reading `diagrams.mjs` (`generate()` throws before `main()` writes), which I read the same way.
- 7: met, grep before and after.
- 8: not verifiable, the arrow-by-arrow trace was produced by a script of the builder's (Spec 1) and the ends read off the drawing are the look at landing.
- 9: met, rerun `[13,0,14,25]`.
- 10: met, rerun `[24,32,23,0]`.
- 11: met, rerun `[4,4,4,4] [0,0,1,3] [1,3,0,0]`.
- 12: met, both runs rerun.
- 13: met, rerun (empty lists on rename, mode-only, empty file; `[4,4,4,4]` on rename with edits).
- 14: met for the changes (rerun `[3,3,3,3]`) and the patch (a `sidesPatch` run of mine produced the `\ No newline at end of file` line as git writes it); the stage through `stagePatch` was not rerun, since it writes a repository index.
- 15: met, rerun, `actions none` for both.
- 16: met, rerun `[10,10,10,10]`.
- 17: met, rerun `[2,2,2,2]` against the stored text.
- 18: met, rerun `null`.
- 19: met, rerun `false`.
- 20: met, server readers rerun; the non-git builders by reading (lines named under item 3).
- 21: not verifiable, the report's run used stand-ins for the models and for Monaco's provider; a live diff editor's `getLineChanges()` and marked lines are the look at landing.
- 22: not verifiable, the look at landing.
- 23: not verifiable, the look at landing. Reading of selector weights supports it: `.oculus-field` (0,1,0), rice (0,2,1), each field's scoped rule (0,2,0) or more; TextArea rice gives the same borders as main for bare and non-bare; the classes `search`, `date` and `filter` removed from elements have no outside reference except `.form :global(.text)` (NewIdeaForm.svelte:126), which still matches.
- 24: met, grep above.
- 25: met, runs rerun; the reading holds for today's code, with Proof 3.

## 1. Spec

- `.scratch/migration/agents/reviews/Q72-report.md`, "The re-read" and "Sizes and measures": "`python3 $TMPDIR/q72/q71-measure.py`", "`bash $TMPDIR/q72/orth/measure2.sh docs/diagrams/channels.dot docs/diagrams/writes.dot`", and case 8: "A trace script reads each arrow's start point and arrowhead tip off `channels.svg` and `writes.svg`"; what is wrong: the brief's "Conventions" allow no script by the builder other than one the step builds, and a one-line `node -e` is the only exempt form. `$TMPDIR/q72` holds `q71-measure.py` (44 lines), `orth/measure2.sh` (25), `orth/trace-run.mjs` (42), `after-cases.txt` (a multi-line node program run for cases 9 to 20), `labels-with-ports.mjs` (757), `probe.mjs` (27), and three Perl files that rewrote tree files: `hubfix.pl` (opens `graphs.mjs` for writing), `docfix.pl` (`DESIGN.md`), `fix4.pl` (`Q72-report.md`); none had the user's approval; failure scenario: a reader of the report takes case 8 and the "after" measures as checked readings when they are outputs of unreviewed code, and edits made by script bypass the per-hunk reading the brief assumes; verdict: case 8 not verifiable.
- `src/lib/data/model/index.ts` (one export line for `GitLineChange`), `src/monaco-modules.d.ts` (122 lines declaring Monaco's internal modules), `DESIGN.md:217` (a path fixed); what is wrong: none is in the brief's "Paths this step writes", and DESIGN.md is limited there to 123-129, 157-161 and 678. Each is needed: the barrel export for the type, the declarations for `git-provider.ts`'s imports, and the sentence at :217 would name a moved file. The report names them under "Files"; failure scenario: none at run time, the landing reads three paths the brief did not list; verdict: none.

## 2. Proof

- Report, "Number of full verify-list runs": "`npm run test:quick` ran three times"; what is wrong: the brief and spec.md "Token discipline" allow one run after the last change; the three logs exist (`$TMPDIR/q72/quick.txt`, `quick2.txt`, `quick3.txt`, vitest 80.8 s, 75.9 s, 67.7 s), none after a red line. Each run also printed `over the time limit` (68.4 s against 45.0 s); failure scenario: token cost beyond the allowance; the time-limit line is stated in the report; verdict: none.
- Report, DONE table: "`sh utils/unused-exports.sh` | DONE | one added line, explained below"; what is wrong: verify item 2 asks that it print no line the base's run does not; the rerun prints `> src/lib/ui/controls/editor/diff/git-provider.ts: createGitDiffs`. The export is used through `import('../diff/git-provider')` at `kit/load.ts:248`, which knip does not follow, as with `workerFor` on the base list; failure scenario: the condition is unmet as written and the row says DONE; the orchestrator decides whether the explanation is accepted; verdict: none.
- `tests/state/client/terminal/terminal-close.test.ts:134-142`: "`client.layout.closeInstance(tab, page); return stopped;`"; what is wrong: the barrier resolves on the close's own stop. A wrongful stop posted synchronously by the move, split or opened layout lands first and fails the test (`[A, A]`, `[A, B]` or a hang), as the report says. A wrongful stop posted after an `await` would land after the close's synchronous stop and the assertion; the old `setTimeout(0)` caught that. Every end path today is synchronous (`closeInstance` instances.ts:288 to `terminals.endTerminals` terminals.svelte.ts:816 to `stopTerminal`), so the check holds now. The link-rewrite barrier (link-rewrite.test.ts:57-75) holds only while the row's offer and the second offer take the same number of awaits before `submit` (link-rewrite.ts:62, :77); failure scenario: a later change that posts a stop or a submit one microtask later passes these checks; verdict: none, case 25 met for today's code.

## 3. Standards

- `tests/checks/diagrams/diagrams.test.ts:836`: "// Each count and call list is a node on its arrow; the router keeps other arrows off it."; what is wrong: channels and writes are now drawn by `utils/diagrams/drawing/apart.mjs`, which places the arrows itself; the comment says the router does it. `labels.mjs`'s head comment was updated for the same change, this one was not. Rules file, comments say what the code does; failure scenario: a reader debugging a label crossing looks at Graphviz's router settings instead of `apart.mjs`; verdict: none.
- `src/lib/ui/controls/editor/diff/git-provider.ts:187`: "const asked = new Map<() => void, string>();" with the delete only in `dispose` (:220-225); what is wrong: Monaco's `DiffEditorViewModel` makes its provider in a plain `derived` (`diffEditorViewModel.js:74`) and does not dispose it, so `dispose` never runs and the map gains one entry per diff editor made for the page's life; failure scenario: a long session that opens many diff panes keeps every provider's `fire` closure, and each `hold` (:233) loops over all of them; verdict: none.

## 4. Behaviour

- `src/lib/ui/controls/editor/diff/git-provider.ts:153-166`: "computer.refineDiff(originalLines, modifiedLines, new SequenceDiff(...), InfiniteTimeout.instance, ...)"; what is wrong: the character changes inside git's blocks are computed on the page's main thread with no timeout, where Monaco's own provider computes in the editor worker with the editor's timeout. A node one-liner calling `refineDiff` the same way measured 1390 ms for a 500-line rewritten block, 23276 ms for 2000 lines, 166903 ms for 5000 lines, and 1059 ms over the 480 git changes of this step's own `channels.svg` diff; the report's "Every host- or user-visible change" does not state it; failure scenario: opening the diff of a regenerated SVG or a rewritten large file freezes the page for seconds to minutes; verdict: none (item 3 holds as specified, the freeze is new).
- `docs/diagrams/channels.svg`, `writes.svg`: channels go from ellipses to rounded boxes (`graphs.mjs:568` still writes `shape=ellipse`, turned into a box by `apart.mjs:150`, :170), channels.svg 853x3664 to 1703x3440 pt, writes.svg 1720x1567 to 4225x1927 pt, channel arrows 198 to 147 and "not placed" nodes 103 to 8. The report states each under "Every host- or user-visible change". The 51 removed arrows I checked are misreadings on the base (`message(` local functions in config/editors/fields.ts, config/write.ts, CommitBox's `repositories.message`, PaneView's `question.message()`, disk.svelte.ts's local `message`, and namer calls read as literal channels); failure scenario: whether a 4225 pt wide drawing reads at the Help view's width is for the look; verdict: none.

## Declined to judge

- Git commands the report quotes outside the three allowed: `git show 9e250b73d^:...` and `git show 9e250b73d:...` (cases 9 and 10 texts), `git show --first-parent --format= -U0 HEAD` (case 16) and `git diff -U0` on scratch repositories (case 12 heads); not run under the review's git limits. The results they fed were checked through the code's own reads (cases 9 to 20 rerun).
- Case 14's stage through `stagePatch` on `$TMPDIR/q72/c/c14stage`: it writes a repository index.
- Cases 21, 22 and 23, and case 8's arrow ends: a live Monaco diff editor and the drawn pages, which need the app; the look at landing.
- The builder's Python and shell measures (`q71-measure.py`, `measure2.sh`, `trace-run.mjs`): not run, being scripts outside the step.
- Whether `writes.svg` at 4225 pt is acceptable in Help, and whether the unused-exports explanation is accepted: the orchestrator's and the user's call.

Reviewer usage: a036aa66bc03d3ab8, claude-opus-5-5, 138,952 tokens, 124 tool uses, 29.3 min.

## Repair round 1, refuted

```
All commands ran from /Users/axelfaes/workspace/research-hub/.agents/worktrees/Q72/tools/oculus with PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH.

The round's delta: cmp of each files.txt path, snapshot against worktree
  -> CHANGED DESIGN.md, DiffEditor.svelte, kit/load.ts, src/monaco-modules.d.ts, tests/checks/diagrams/diagrams.test.ts, diff/git-provider.ts; new and not in files.txt: diff/inner-changes.worker.ts (70 lines); every other listed path byte-identical to the snapshot
npm run lint                                   -> lint exit 0
npm run format:check                           -> All matched files use Prettier code style!
npm run check                                  -> COMPLETED 4053 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
npx vitest run tests/checks/diagrams tests/checks/source/comment-width.test.ts tests/checks/imports tests/checks/tree tests/checks/source/history.test.ts --testTimeout 0 --hookTimeout 0
                                               -> Test Files  10 passed (10) / Tests  121 passed (121)
npx vitest run tests/server/git/git-ops.test.ts -> Test Files  1 passed (1) / Tests  17 passed (17)
npx vitest run tests/state/client/terminal/terminal-close.test.ts tests/state/system/link-rewrite.test.ts
                                               -> Test Files  2 passed (2) / Tests  6 passed (6)
sh utils/folder-check.sh                       -> prints nothing, folder exit 0
sh utils/size-check.sh                         -> prints nothing, size exit 0
sh utils/unused-exports.sh, diffed against Q72-base/unused-exports.txt
                                               -> < Unused exports (240) / > Unused exports (241) / > src/lib/ui/controls/editor/diff/git-provider.ts: createGitDiffs
ASCII gate, perl form, over the seven files the round changed   -> prints nothing, ascii exit 0
ASCII gate, perl form, over the 48 added or modified non-svg files since the base -> prints nothing, ascii exit 0
LC_ALL=C grep -n '[^ -~]' over the report's "Repair round 1" section (lines 624-800) -> prints nothing
History words (before|used to|no longer|still|always ha|as before|previously) over the round's added lines and the worker file -> no hit
npm run test:quick, npm run diagrams, vite build, the dev optimizer -> not run (the brief allows one test:quick run, the builder's; the others write the tree or the shared node_modules)

Case 1 (the report's quoted graph.ts one-liner):
  -> modules 1762 edges 7044 / module cycles 0 [] / folder rings [] / views->state 1254 files 391 targets 187
Case 3 (the report's quoted arrowsAlong/labelsAcross one-liner, import from ./utils/diagrams/drawing/labels.mjs):
  -> channels.svg 0 0 1703x3440; layer-data.svg 0 0 304x921; layer-server.svg 0 0 428x1027; layer-shell.svg 0 0 305x1481; layer-state.svg 0 0 469x1039; layer-ui.svg 0 0 328x1209; layer-views.svg 0 0 325x1910; layers.svg 0 0 826x569; writes.svg 0 0 4225x1927; drawings 9

Item 1, the report's direct refineDiff probe (its command is quoted with "..."; rebuilt from the text it describes):
  -> lines 500 mappings 1 ms 3784        (report: lines 500 mappings 1 ms 3616)
Item 1, the report's "after" probe through createGitDiffs (its command is not quoted; rebuilt: a node:worker_threads thread importing the real inner-changes.worker.ts with self bridged to parentPort, stand-in models and own provider):
  -> lines 500 computeDiff call ms 2 page thread busy ms 0 answered after ms 3907 workers started 1 answer [ '1,501,1,501,1,[1,1 -> 501,1]->[1,1 -> 501,1]' ]
     (report: lines 500 computeDiff call ms 1 page thread busy ms 0 answered after ms 3866 workers started 1)
  The 5000-line forms (report: 416743 ms direct, 463104 ms through the worker) were not rerun; the 500-line forms above were.
Item 1, the worker module alone, posted {id:0, original:['a x'], modified:['a y'], runs:[[0,1,0,1]], ...}:
  -> {"id":0,"ranges":[[1,3,1,4,1,3,1,4]]}
Item 2, the report's provider probe (command not quoted; rebuilt with stand-ins, fires counted through onDidChange):
  -> A and B computed, holds of a and b: {"A":1,"B":1,"C":0}
     release(a): fires {"A":1,"B":0,"C":0} own disposed [0]
     after release, holds of a and b: {"A":0,"B":1,"C":0}
Reviewer probe, the order a superseded ask and the newer ask resolve in (stand-in worker answered by hand, stand-in own provider answering after 20 ms; hold of a new entry between the two computeDiff calls):
  -> asks posted 2
     resolved in order: run2 git at 6 | run1 own at 26 => written last: run1 own at 26
Reviewer probe, a worker constructor that throws (start = () => { throw new Error('SecurityError stand-in') }):
  -> computeDiff rejected: SecurityError stand-in
The builder's scratch build ($TMPDIR/q72/r1/appbuild/.svelte-kit-app/output), read only:
  -> ./client/_app/immutable/workers/inner-changes.worker-DDFLUF8Y.js 105966 bytes, 0 lines matching "import "; chunks/DXOGzm-j.js names it; grep -rl "inner-changes" server prints nothing
The builder's optimizer output ($TMPDIR/q72/r1/optim/deps), read only:
  -> range-DQsvnEgT.js is imported by editor.api-BihzCHcZ.js, standaloneServices-HGp72i4g.js, rangeMapping-DE4nkgxT.js, lineRange-CA6RlLMA.js and monaco-editor_editor_common_core_range.js
grep -rn "instanceof Range\b|instanceof RangeMapping|instanceof DetailedLineRangeMapping|instanceof LineRange\b" over Monaco's diffEditor widget and common/diff -> prints nothing
```

### Verdicts

The round's three items:

- Round item 1 (the character changes off the page's thread): closed for the freeze; the page thread is busy 0 ms for a 500-line block whose answer takes 3907 ms, and the worker is built into the client only. The requirement that a superseded request never draws over the newer one is partial: Behaviour 1.
- Round item 2 (providers forgotten with their editor): closed. The builder's departure (a new `release(model)` in place of dropping providers on `hold(model, null)`) rests on a right premise: `DiffEditor.svelte:331` calls the `hold` helper from its `$effect` for a live editor, and the helper (`:287-290`) passes `null` whenever `changes` is undefined, so the brief's form would have cut a live compare, Replace Preview or save conflict editor off from its provider's `onDidChange`. `asked` lists A and B, then only B; Monaco's own provider of A disposed.
- Round item 3 (the stale comment): closed, `tests/checks/diagrams/diagrams.test.ts:836-838` names `utils/diagrams/drawing/apart.mjs`.

Items of the brief's "What to build", for the whole diff since the base:

- 1: holds. Case 1 rerun; the round's new module moves the module count to 1762 (Proof 2), the cycles, rings and views-into-state numbers unchanged.
- 2: holds. Case 3 rerun 0/0 on all nine drawings; the G25 row passes; the comment fixed.
- 3: violated, Behaviour 1 (a superseded ask's Monaco diff can be drawn over git's changes of the newer read). Every other part holds.
- 4: holds; the field files and `field.css` byte-identical to the snapshot; the look at landing.
- 5: holds; the three checks unchanged since the snapshot, 6 pass.

Cases of the brief's "Cases":

- 1: met, rerun; the report's "after" count is stale by one module (Proof 2).
- 2 to 7: met, as in the first review; the code they run unchanged since the snapshot.
- 8: not verifiable, the look at landing.
- 9 to 13, 15 to 20: met; the code these cases run is byte-identical to the snapshot the first review reran them on, and `git-ops.test.ts` passes.
- 14: met for the changes and the patch as in the first review; the stage through `stagePatch` was not rerun (it writes an index).
- 21: partial: in the superseded state the editor can end on Monaco's changes (Behaviour 1); the plain state is the look at landing.
- 22, 23: not verifiable, the look at landing.
- 24: met as in the first review.
- 25: met, rerun 6 pass.

### 1. Spec

- `DESIGN.md:680`: the sentence on the web worker; DESIGN.md is not in the round's "Paths this round writes"; the sentence is true, sits in the bullet the step's own write list names, and is named in the round report; failure scenario: none at run time; verdict: none.
- `src/lib/ui/controls/editor/diff/git-provider.ts:80-81` and `DiffEditor.svelte:457`: a new `release` member of `GitDiffs` in place of the brief's named form; the premise behind it is right and the departure is stated first in the round report; failure scenario: none, the brief's form would have broken live editors; verdict: none.

### 2. Proof

- Report, "Repair round 1", Item 1 and Item 2: the probes are quoted with "..." or with no command; the evidence cannot be rerun in the form quoted. Rebuilt from the text, the numbers reproduce (3784 against 3616 ms; page thread 0 ms; Item 2's fires exactly); failure scenario: a later reader cannot repeat the probes the closure rests on; verdict: none.
- Report, case 1 "After: `modules 1761 edges 7044`" and "The re-read" table: the same command now prints `modules 1762 edges 7044`, the round having added `inner-changes.worker.ts`. No decision rests on it; failure scenario: a reader comparing the re-read with the tree finds one module more; verdict: none.

### 3. Standards

- `src/lib/ui/controls/editor/kit/load.ts:245-247` ("which the git diffs call once"), `inner-changes.worker.ts:3-5` ("kit/load.ts starts this module ... the first time a diff editor draws git's changes"), `git-provider.ts:14-15` ("The answer is Monaco's own diff when the worker fails"); what is wrong: the constructor is called again after every failed worker; `load.ts` imports the `?worker` constructor at every kit start and `git-provider.ts` starts the worker at the first ask that has runs; and a constructor that throws is not answered with Monaco's diff: `started()` runs outside the `try` in the promise executor (`git-provider.ts:212-224`), so `computeDiff` rejects, Monaco's view model rethrows it (`rejectIfNotCanceled`, `base/common/async.js:89-94`) and the diff is never drawn. Today's page sets only `frame-src 'self'` (`src/hooks.server.ts`), so the throw has no known trigger; failure scenario: a worker CSP added later gives diffs with git's changes that never draw, with an unhandled rejection; verdict: none.

### 4. Behaviour

- `src/lib/ui/controls/editor/diff/git-provider.ts:320-328`: "const current = held.get(uri) === entry && ... return ranges !== null && current ? documentDiff(runs, ranges) : monaco.computeDiff(original, modified, wanted, token);"; what is wrong: the round brief asks that a request superseded by a newer `computeDiff` of the same editor never draw over the newer. The stale check stops the older git answer but replaces it with a Monaco computation started only when the older ask is answered. Monaco's view model writes whichever run resolves last (`diffEditorViewModel.js:209-229`, only cancellation checked). Probe: "run2 git at 6 | run1 own at 26 => written last: run1 own at 26". Monaco treats a `CancellationError` from `computeDiff` as no result (`rejectIfNotCanceled`), which would let a superseded run draw nothing; failure scenario: a large file rewritten while the worker still computes the previous read ends drawn with Monaco's grouping, and Stage Block follows it, until the next change; verdict: step item 3 violated, case 21 partial, round item 1 partial.
- Report, "Repair round 1", Item 1, and "Every host- or user-visible change": the reader-visible before and after is not stated: before, a diff with a large changed block froze the page until drawn; after, the page responds and the diff shows its two texts unmarked until the worker answers. Also unstated: one worker serves every diff with git's changes and asks run in order with no cancellation, so a diff opened after a long computation, a closed pane's included, waits behind it for its marks; not worse than before the round; verdict: none.

### Declined to judge

- The 5000-line probes, direct and through the worker: not rerun for their length; the 500-line forms reproduce.
- `vite build --mode app` and the dev optimizer: not rerun, since both write into the shared `node_modules` or a cache; their outputs in the builder's scratch folder were read. Monaco's diff editor uses no `instanceof` on these classes.
- The real-browser timing of Behaviour 1's race: needs a live page.
- Cases 8, 21's plain state, 22 and 23: the look at landing.
- Open item 116: the user's; the round wrote no script file.

Reviewer usage: acde5bd1c306120e1, claude-opus-5-5, 235,844 tokens, 70 tool uses, 16.9 min.

### Closed

- Repair round 1, refuted, Behaviour 1 (a superseded ask draws Monaco's diff over the newer): fixed at landing on main; a computation whose held changes or lines moved while the worker computed answers Monaco's cancellation, so the newer run's answer stands, and Monaco's own diff is kept for a worker that failed while the texts still hold.
- Repair round 1, refuted, Standards 1 (a throwing worker constructor, three comments): fixed at landing; the worker is started inside the guarded block, so a constructor that throws answers Monaco's own diff, and the three comments say what the code does.
- Repair round 1, refuted, Behaviour 2 (the reader-visible before and after): stated in the landing booking and report.
- Repair round 1, refuted, Proof 1 and 2 (probes quoted without their command; the stale module count): the landing booking quotes the count after the last change (1762); no decision rests on either.
- Repair round 1, refuted, Spec 1 and 2: accepted, as the verdicts say.
- First review, Spec 1: open item 116. Spec 2, Proof 1 to 3: accepted with the reasons of `agents/briefs/Q72-round1.md`. Standards 1 and 2, Behaviour 1: closed in round 1. Behaviour 2: stated by the report; the 4225 pt drawing is for the look.
