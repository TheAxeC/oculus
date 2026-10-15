# Step Q72 brief check (on main at 317acc041)

The brief read is the working-tree copy of `agents/briefs/Q72.md` (uncommitted on main; `git diff --stat` shows it +177 lines). G25 in `agents/guarded.md` is already widened in the working tree (`git diff -- agents/guarded.md`). `plan.md` has no Goal section: `grep -n "^## \|^# " plan.md` prints only Packages, Could run in parallel, Rulings, Agents, Blocked. I used the goal the caller gave.

## 1. Names

- **`ui/forms/choice/drawn/` becoming `choice/select/`**: `git grep -n "choice/drawn\|drawn/FieldSelect\|drawn/HueSelect\|FieldSelect\|HueSelect" -- src tests config docs HELP.md DESIGN.md README.md utils`. Only one hit falls outside the moved folder and `GlyphSelect.svelte`: `src/lib/views/system/workbench/editors/FieldControl.svelte:23` (`import HueSelect from '$lib/ui/forms/choice/drawn/HueSelect.svelte'`). The write list covers it under "each file whose import of the moved files changes". The folder order (`tests/checks/imports/order.ts:75`) names `ui/forms` only, so it is not affected. No document names the folder.
- **The `.select` class becoming an `oculus-` class**: `git grep -n "\.select\b" -- src tests`. Every hit outside the two components is a `.select()` method call, never CSS. `git grep -n "oculus-select\|choice/select"` finds no collision.
- **The new field of `DiffSides`**: `git grep -n "DiffSides" -- src tests` and `git grep -ln "encoded: \(true\|false\)" -- tests src`. Hits outside the write list:
  - `src/lib/views/sources/repositories/diff/diff-read.ts:59-67, :98-106, :119-127` build `DiffSides` literals for three cases: the save conflict, an app source control's quick diff and the Refactor Preview. The folder is on the write list only for the four named files. If the field is required, these three fail the type check. Either way the brief does not say what they carry.
  - `src/lib/state/sources/repositories/repositories.ts:305-317` is `sameFiles`, which compares every field by name. `Diff.svelte:199-203` keeps the old files when `sameFiles` is true. A re-read whose texts are equal but whose git changes differ therefore keeps stale changes. This is made false by the change and is outside the write list.
  - `src/lib/data/model/index.ts:566` is a re-export. Not affected.
- **Where the blocks come from (Monaco's line changes, `hunksOf`, `lineChangesOf`)**: `git grep -n -i "line changes\|getLineChanges\|lineChanges\|git add -p\|hunksOf\|git's own grouping\|git's context rule" -- src tests config docs HELP.md DESIGN.md README.md`. Every hit that becomes false is in the write list: `DiffSection.svelte:18` ("git's grouping of Monaco's line changes"), `diff-patch.ts:12-14`, `diff-hunks.ts:1-7`, `Diff.svelte:137`, `hunk-acts.svelte.ts:37` (`drawnChanges`). Outside the write list:
  - `DESIGN.md:678` says "`GET /api/git` answers a diff as the two whole versions of each file". After the step it also answers git's line changes. The spec's rule puts "a decision with its reason into DESIGN.md", and this is where decision 3 belongs. The line is outside the write list.
  - `tests/ui/controls/editor/monaco-diff.ts` (Monaco's changes as a test helper, imported by no test) is not affected.
- **`channels.svg` and `writes.svg` on a split into `channels-<part>` or `writes-<part>`**: `git grep -n "channels\.svg\|writes\.svg\|'channels'\|'writes'" -- src tests utils config docs HELP.md DESIGN.md README.md`. Outside "the G25 row":
  - `tests/checks/diagrams/diagrams.test.ts:103-110` (the stale-files list names `channels.dot` and `channels.svg`) and `:113-120` (`NAMES` expected as `'channels', 'writes'`). A split makes both false. The write list allows only "the G25 row" of this file.
- **The channel and write drawing rules (a port or routing attribute per arrow)**: these rows assert exact arrow lines: `tests/checks/diagrams/diagrams.test.ts:327-328` (`'"ch fresh" -> "views/system/one";'`), `:354`, `:375`, `:390`, and the writes rows from `:419`. An attribute added per arrow, such as `[tailport=...]`, breaks these `toContain` lines. They are outside "the G25 row".

Findings:
- `diff-read.ts` (three `DiffSides` builders) and `repositories.ts:305` (`sameFiles`) need the new field and are outside the write list.
- `DESIGN.md:678` describes the diff answer and is outside the write list.
- `diagrams.test.ts:103-120` and the exact-arrow rows `:327-390` (and the writes rows) change under a split or a per-arrow rule, while the write list allows only the G25 row.

## 2. The step line

- "the diagrams regenerated and read": served by item 1, bullet 1.
- "the import measures of Q71 run again (cycles, folder order, the largest files and folders, the imports from views into state)": served by item 1, bullets 1-2. See section 3: the views-into-state measure the brief names is not Q71's.
- "its question is only whether the architecture is good enough to maintain and to open-source in O33, looking for major problems alone": served by item 1, bullet 3.
- "its findings are reported to Axel, never made into a step": served by item 1, bullet 4, and decision 1.
- Carried (Q77d's review), the `portfolio.test.ts` waits: no requirement. The brief's last paragraph of "What is on the tree" says the premise is false and nothing is built. The ruling "Q72's scope" (the user's) says this fix stays in Q72 and is built there. A premise found wrong goes to Axel under the rules file ("Nothing left undone": "a premise found wrong ... goes to him"), but the state file's open items read "- None." (`orchestrator-state.md`, "## Open items"). Part of the correction also does not hold: see section 3.
- Carried (Q75 stopped), the channels arrows: served by item 2.
- Carried (D13b's look), the diff blocks: served by item 3.
- Carried (Q96's review), the select rules: served by item 4.
- "Done inline 2026-10-11": no requirement needed. It is done and marked "not in Q72".

Findings:
- The waits line has no requirement, and the false premise that removes it is not booked as an open item for Axel, whose ruling put the fix in Q72.

## 3. Premises

- 1,799 tracked files and 324,090 lines: `git ls-files src | wc -l` gives 1799, and `... | xargs wc -l | tail -1` gives 324090. Matches.
- Largest file `writes.svelte.ts` at 889, and the eleven largest at 870 to 889: `... | sort -rn | sed -n 2,13p` gives 889, 880, 879, 878, 877, 876, 874, 874, 872, 871, 870, then 867. Matches.
- 416 files under views name state: `git grep -l "\$lib/state\|/state/" -- 'src/lib/views/**' | wc -l` gives 416. This matches, but it is not Q71's measure. Q71's "views->state 477 files 155 targets 65" (`Q71-report.md:339`, `:447`) came from the measuring script in `agents/briefs/Q71.md:81-122`, which counts resolved runtime import edges. Q71's other numbers (`modules 563 edges 2098`, `folder rings []`) come from the same script, and no hand check prints them. The brief's "Compare each number with Q71's" therefore sets unlike numbers side by side. The brief's no-script paragraph also forbids running Q71's script without an approval quoted from Rulings.
- The hand checks and diagrams: `ls tests/checks/imports tests/checks/tree` lists cycles, order and augments `.test.ts` plus graph, order and augments `.ts`, then boundaries, size and duplication `.test.ts`. `ls docs/diagrams` lists the nine drawings. Matches.
- Function lines: `grep -n` in `utils/diagrams` gives `channelsDot` at `graphs.mjs:441`, `writesDot` at `writes.mjs:240`, `PORTS` at `:528`, `writesDrawn` at `:556`, `labelsAcross` at `labels.mjs:222` and `arrowsAlong` at `:393`. `diagrams.mjs:151-153` draws channels and writes. Matches. One detail is imprecise: "the next tail port of PORTS" for "a same-module pair". The code gives "the later plain arrow of the pair (by name) ... the next port of PORTS" (`writes.mjs:539-541`, `:568-574`), PORTS holds head ports too (`:533-534`), and no same-module condition exists.
- Pairs per drawing: a node one-liner importing both functions from `utils/diagrams/labels.mjs` over each committed `.svg` printed:
  - `channels.svg 2496 0 853x3664`
  - `writes.svg 61 0 1720x1567`
  - every `layer-*.svg` and `layers.svg`: `0 0`
  
  `grep -c -- '->' docs/diagrams/channels.dot` gives 198. Matches.
- `readable.test.ts` deleted by 7db4c1ad7: `git show --stat 7db4c1ad7` lists `readable.test.ts | 405 -----`. Matches. The G25 row is at `diagrams.test.ts:829` (the brief says "~826"), and no row calls `arrowsAlong`. Matches.
- `DESIGN.md:129` and `:161` show the images: `grep -n` confirms. "Each with the paragraph above it saying what it draws" holds for `writes.svg` (line 159). It does not hold for `channels.svg`: line 127 is the Watchers paragraph, and only the alt text says what the drawing draws. `HELP.md` shows neither (`git grep` prints nothing). Matches.
- Part 3 line references:
  - `read.ts:26-38`, `DiffEditor.svelte:208` (`ignoreTrimWhitespace: false`), `:275` and `:281` (`onchanges`), `Diff.svelte:249-260`, `DiffSection.svelte:256` and `diff-hunks.ts:71-86` with its head comment at lines 1-4: all match.
  - `sidesPatch` starts at `diff-patch.ts:166`; the brief says 167. Off by one.
  - `NO_CONTEXT` at `parse.ts:480` and `parseLineMarks` at `:458-474` match. `DiffHead` is at `:488-497` (the brief says 483-496), and `diffHeads` at `:549-596`, with the body push at `:572-573` (the brief says 560-575). Close.
  - `sidesOf` at `reads.ts:245`, `DiffSides` at `model-sessions.ts:413-421`, `answers.ts:64`, `compare.ts:226`/`:415` and `ops.ts:754`/`:789` all match.
  - Three things are not as described: `ops.ts:789` is the Replace Preview, not "the comparison of two files"; `compare.ts:415` (`workspaceSides`) also runs no git diff, which the brief does not say; and the list of `DiffSides` builders misses `diff-read.ts` (section 1).
- `HELP.md:437` text: `sed -n 437p HELP.md` matches verbatim.
- No guarded entry names the blocks and no test covers them: `grep -c "diff-hunks\|diff-patch\|sidesOf" agents/guarded.md` gives 0, and `git ls-files tests | grep -i "hunk\|patch" | wc -l` gives 0. Matches. The row 'stages one hunk of two, and unstages it again' is at `git-ops.test.ts:208`. Not stated in the brief: the file is `// @module-tag slow` (`git-ops.test.ts:7`), so `npm test` and `npm run test:quick` never run it.
- Monaco against git:
  - For `channels.ts` (9e250b73d), `git diff -U0` gives `@@ -13,0 +14,12 @@` and `DefaultLinesDiffComputer` (0.57.0, the options named) gives `12,0,13,24`.
  - For `rail.ts` (0107e4e74), git gives `@@ -24,9 +23,0 @@` and Monaco `23,31,22,0`.
  - Both match the brief.
  - The whole figure: the loop over `git log -n150 --format=%H -- src` with `--diff-filter=M` counted 5272 files. A node one-liner over all of them printed `{ files: 5272, differ: 1823, differWithoutNoNewlineMarker: 1821 }`. This matches, and 2 of the 1,823 carry `\ No newline at end of file`.
- Part 4:
  - `FieldSelect.svelte` is 126 lines and repeats `.select`'s rules, adding position, display, align-items, gap and cursor; `Select.svelte:77` holds `:disabled`. Matches.
  - `ls | wc -l` gives 10 for `choice/`, 10 for `forms/` and 2 for `drawn/`, and one file imports from `choice/drawn/`. Matches.
  - `DiffEditor.svelte:78` imports `./comment-add.css` with `.oculus-comment-add`. Matches.
- The `portfolio.test.ts` correction: `git show --stat f61ae2de6` deletes `tests/server/root/watch/portfolio/portfolio.test.ts`. Matches. `git grep -n "setTimeout(resolve" -- tests` prints six hits, not two. Besides the two 50 ms polls, `tests/state/client/terminal/terminal-close.test.ts:137-139` and `:148-149` and `tests/state/system/link-rewrite.test.ts:53-55` wait one `setTimeout(resolve, 0)` and then assert that something did not happen (`expect(stops).toEqual([])`, `expect(submitted).toBe(0)`). "No test on the tree waits a fixed time for something that must not come" is false as written. The rules file says "a check that something did not happen advances a fake clock past the deadline".
- Folders and sizes: `wc -l` gives `graphs.mjs` 520, `writes.mjs` 608, `labels.mjs` 448, `parse.ts` 716, `reads.ts` 436, `Diff.svelte` 519 and `diff-hunks.ts` 293. Matches. The brief leaves out these facts, which bear on its own allowances:
  - `DiffSection.svelte` is 519 lines, also at the component limit, and is on the write list.
  - `ls src/lib/views/sources/repositories/diff | wc -l` gives 10. The brief allows "a new file there when `Diff.svelte`'s size needs one", and `utils/folder-check.sh` refuses that file.
  - `git ls-files utils/diagrams | wc -l` gives 10. The brief allows "a new file under `utils/diagrams/` when a size limit needs one", and the folder check refuses that too.
  - `tests/checks/diagrams/diagrams.test.ts` is 867 lines, 13 below the 880 line, before the new row.
  - `tests/server/git` holds 10 items.

Findings:
- The views-into-state measure (416 files by `git grep -l`) is not Q71's (477 import edges, 155 files, 65 targets from Q71's measuring script). Q71's modules, edges and folder-rings numbers have no hand-check counterpart.
- `ops.ts:789` is the Replace Preview. `workspaceSides` (`compare.ts:415`) also runs no git diff. The `diff-read.ts` builders are missing from the list.
- The channels image has no paragraph above it saying what it draws.
- The two allowed new files would each put a folder at 11 (`views/sources/repositories/diff`, `utils/diagrams`).
- `DiffSection.svelte` is at 519.
- `git-ops.test.ts` is tagged slow.
- Three zero-delay negative checks contradict "no test on the tree waits a fixed time for something that must not come".
- The `writesDrawn()` description is imprecise.

## 4. Cases and checks

- Case 1: a run quoted with "Q71's number beside it". As section 3 shows, the brief's measure for views into state is not Q71's, and Q71's modules, edges and folder-rings numbers come from a script the no-script paragraph forbids running. The case cannot be met as written.
- Case 2: consistent (reading).
- Cases 3 and 5: consistent.
- Case 4: consistent with the rules file ("What every package obeys", the test rule and the failing line on the unchanged tree). G25 names the whole file, so the row is covered.
- Case 6: consistent. It changes `writesDrawn()`'s documented stop ("what it cannot part stays for the check to name", `writes.mjs:546-548`) into an error. "What to build" item 2 does not state this; only the case does.
- Case 7: the G33 row. G33's text ("Each git action does to the repository only what it names") and its Code line (`git-routes.ts`, `git-write.ts`, `git-refs.ts`, `git-index.ts`, `git-remote.ts`) cover neither the diff read nor `diff-patch.ts`. The rules file says a test exists only as the test of one entry "and `agents/guarded.md` names it there by file and title". G33 names its rows by title, and the brief does not say who adds the new title, as it does for G25. The file is `@module-tag slow`, so the rules file's "run that file alone with `npx vitest run <file>`, quote the run, and name it in the report" applies, and the verify list does not name that run. The row's texts come "at `9e250b73d^` ... and at `9e250b73d`". After O33 extracts oculus into its own repository, the hub's commits are not there to read, so the texts need to be held in the test itself. The case does not say so.
- Cases 8 to 12: consistent ("a unit run" quoted, no test kept). Case 12's run reaches the server readers, which the step changes.
- Case 13: consistent with "A builder runs no page" and "the look". The unit suite renders to a string, so "the computed styles read by a unit run" never applies.
- Case 14: inconsistent with the tree. `grep -rF` per declaration under `src/lib/ui/forms/choice/` shows that `MultiSelect.svelte` and `SuggestInput.svelte` already hold `border: 1px solid var(--line);`, `border-radius: var(--input-radius);`, `font: inherit;`, `font-size: var(--fs-md);`, the `line-height` calc, `padding: 4px 6px;`, the focus outline and the rice rules. Both are outside the write list, so no declaration of the shared set can appear once in `choice/`.
- No case asks the builder to check or quote a place the step does not change, beyond the re-read's own reads.

Findings:
- Case 1 cannot be met as stated.
- Case 7's guarded entry does not cover what the row tests. The title is not booked in G33. The slow tag and the `npx vitest run` rule go unstated. The fixture source does not survive O33.
- Case 14 cannot pass because of `MultiSelect.svelte` and `SuggestInput.svelte`.

## 5. The question

- Case 1: yes. A quoted 416 beside Q71's 155 passes the case with no real comparison.
- Case 2: no. It is read by the reviewer against a verdict per layer.
- Cases 3 and 4: yes, in three ways:
  - Splitting into many small drawings reaches 0. "As few drawings as reach none" has no case.
  - Routing a channel's arrows through a junction node whose title holds " to " also reaches 0: `arrowsAlong()` (`labels.mjs:405-414`) folds every edge through such a node into one line, so their overlap is never measured, and no pair is "exempted".
  - No case checks "a reader can trace each channel to each module".
- Case 5: no.
- Case 6: no.
- Case 7: yes. The row hands git's changes to `sidesPatch` directly in a server test. The pane's wiring (`Diff.svelte:249-260`, `DiffSection.svelte:256`, `hunk-acts.svelte.ts:37` `drawnChanges`), which today passes Monaco's changes, is untested. The pane can keep Monaco's changes while the row passes.
- Cases 8 to 10: no.
- Case 11: yes. Stale heads shifted inside both texts pass "no block names a line past either text" while naming the wrong lines.
- Case 12: partly yes. "Reading of the readers and a unit run of one" leaves three readers unrun. It omits the range compare (`compare.ts:256`), the worktree's three-dot diff (`git-reads.ts:188`) and a conflicted file (`git-diffs.ts:48-50`, `--ours`).
- Case 13: no, if the look is taken.
- Case 14: it fails as written (section 4). Even when it passes, a component that stopped importing the stylesheet would still pass the `grep -c`. The look catches that.
- Item 1 and the step line's check: yes, through the unlike views-into-state number (case 1).
- Item 2: yes, as cases 3 and 4.
- Item 3: yes. No case checks the hunk count, Previous and Next Change, the rows a selection chooses, Unstage Block, Revert Block or the line Open File opens at against git's changes. Only Stage Block has a case (7), and it bypasses the pane. Monaco keeps drawing its own changes, so on `channels.ts` the green lines are 13-24 while the block is 14-25. A selection on drawn line 13 chooses no row (`chosenByModified`, `diff-hunks.ts:133-152`), and a selection on undrawn line 25 chooses an added row. The diff-patch head comment's "a chosen row is the line the reader saw" (`diff-patch.ts:12-14`) stops holding. The brief does not state the expected behaviour.
- Item 4: case 14 cannot pass. Also, `git grep -c "line-height: calc(var(--button-line) \* var(--text-scale, 1));" -- src` shows the same field look repeated in `TextInput.svelte`, `TextArea.svelte`, `DateInput.svelte`, `MultiSelect.svelte`, `SuggestInput.svelte` and `Search.svelte`. "One select look" can pass with the look still written in eight places (see Declined to judge).

Findings:
- Case 1, cases 3 and 4, case 7, case 11, case 12, item 3 and item 4, each as described above.

## 6. Implied inputs

This is a code step. For each implied input: whether "Cases" lists it, and the expected result it should have.

- **A rename with edits** (`-M` in `commitDiff`, `reads.ts:184`; this has happened in this tree): missing. Expected: git's changes of the renamed file's heads, with the sides read from the old and new paths.
- **A pure rename, a mode-only change or a new empty file** (no hunk): missing. Expected: an empty list of changes and no block. The brief says a file "that carries none" falls back to Monaco, so it must state that an empty list is not "none".
- **No final newline** (this has happened: 2 of the 1,823 differing files carry the marker): missing. Expected: git's `-N +N` change on the last line as one block. Its patch carries `\ No newline at end of file` and stages exactly git's hunk, and no block names Monaco's extra empty model line.
- **A CRLF file**: missing. Expected: git's changes, with line numbers unaffected. `diffActions` gives `none` (`diff-hunks.ts:287`), so no action is offered.
- **A merge commit**: missing. Expected: the changes of the first-parent diff (`--diff-merges=first-parent`, `reads.ts:189`).
- **A conflicted file**: missing. Expected: the changes of the `--ours` diff (stage 2 against the worktree, `git-diffs.ts:48-50`), with no actions.
- **A file over the read limit**: a 32 MiB output fails the read, as today (`run.ts:106`). Not needed.
- **`diff.algorithm` set**: decision 3 covers it, but no case does. Expected: the blocks follow the configured algorithm, as `git add -p` does. `git config --get diff.algorithm` prints nothing here, so it has not happened on this machine.
- **A `diff=<driver>` textconv attribute**: missing. The pane's `git diff` and `show` run without `--no-textconv` (`git-diffs.ts:47`, `reads.ts:181-191`), while the sides are read with `show --no-textconv` (`reads.ts:301`) or raw from disk. The heads would then name lines of the converted text. Expected: the diff read runs with `--no-textconv`, or the file carries no git changes. `git-diffs.ts` is not on the write list.
- **The worktree changed between the diff and the read**: case 11 lists it, but only as a bound. Expected: each head's `-` and `+` lines, which `DiffHead.body` holds, are checked against the texts read, and on a mismatch the file carries no git changes.
- **A re-read with equal texts and different changes**: missing. Expected: the new changes replace the old (`sameFiles`, `repositories.ts:305`).
- **The range compare, the worktree three-dot diff, the save conflict, an app's quick diff, the Refactor Preview and `workspaceSides`**: missing from cases 10 and 12. Expected: git's changes for the first two, and for the rest none, with Monaco's blocks as today.
- **A git block outside the region Monaco's "hide unchanged regions" shows** (a change placed far from Monaco's placement in repeated lines): missing. Not verified whether it has happened. Expected: Previous and Next Change, and opening at a line, reveal the block's lines.
- **A selection over a line Monaco draws as changed but git does not, and the reverse**: missing. Expected: must be stated (see section 5, item 3).
- **A new channel or write added later**: listed (case 6 and the G25 row hold every drawing the source gives).
- **The select's disabled state**: missing. Expected: a disabled native `Select` looks as on main (muted colour, not-allowed cursor). `FieldSelect` has no disabled prop.
- **The select's focus state**: missing from case 13. Expected: the same 1px accent outline on keyboard focus for both, in the dark, light and rice themes.
- **Selector specificity**: the scoped `.select.svelte-<hash>` (two classes) becomes one global class. `git grep` found no outside rule that would now outrank it, and the look covers it.

Findings:
- Each "missing" input above. The no-final-newline file, the textconv attribute, the stale re-read through `sameFiles` and the selection-against-drawing mismatch are the costly ones.

## 7. ADRs

- `ls docs/adr tools/oculus/docs/adr`, run from the hub root and from `tools/oculus`: "No such file or directory" each time. `grep -n "adr" .agents/plan.yaml` prints nothing. No record.

Findings: none.

## 8. Dictated text

- "Everything in the brief is done" (the report's first line): `grep -n "Everything in the brief is done" Q72.md` gives line 163. Holds. It is the rules file's own wording ("Report").
- "The re-read" (a report section heading): `grep -n '"The re-read"' Q72.md` gives lines 52 and 168. Holds.
- "none found" (in the re-read section): `grep -n '"none found"' Q72.md` gives line 168. Holds.
- The names `channels-<part>` and `writes-<part>` are file names, not sentences: `grep -n "channels-<part>" Q72.md` gives line 54. Holds.
- `LC_ALL=C grep -n '[^ -~]' Q72.md` prints nothing.

Findings: none.

## Declined to judge

- Whether the channels drawing can reach no pair in one drawing, given "ch portfolio" with 21 readers and `routes/+page` with 18 incoming arrows (counted from `channels.dot`). That is a construction question for the build.
- Whether folding the repeated field look of `MultiSelect.svelte`, `SuggestInput.svelte`, `TextInput.svelte`, `TextArea.svelte`, `DateInput.svelte` and `Search.svelte` belongs in Q72. The carried line names only `Select.svelte` and the trigger, and widening it is the orchestrator's or Axel's call.
- Whether a Monaco highlight that differs from git's block (one line apart on `channels.ts`) is acceptable to Axel. It is user-visible, and the brief does not name it.
- Whether the three zero-delay negative checks are sensitive to load. Not run.
- Whether `git add -p` in the installed git honours `diff.algorithm` as porcelain `git diff` does. Not run.

Agent usage: a82475b292d05b5f0, claude-opus-5-5, 270,707 tokens, 93 tool uses, 16.6 min.
## Closed

Each finding is closed by a change to `agents/briefs/Q72.md`, `agents/guarded.md` or `plan.md`, named here.

- Section 1, names: the write list now holds `diff-read.ts` (its three builders carry no git changes, each saying so), `repositories.ts` (`sameFiles` compares the new field; case 19), `git-diffs.ts`, `DESIGN.md:678` (the answer carries git's line changes, with decision 3's reason), and in `diagrams.test.ts` the stale-files list and `NAMES` on a split and the exact-arrow rows the drawing rule changes, each keeping its subject. `FieldControl.svelte:23` is named among the imports that move.
- Section 2, the waits line: the premise is corrected in `plan.md` and the brief to the three zero-delay negative checks (`terminal-close.test.ts:137-139` and `:148-149`, `link-rewrite.test.ts:53-55`), which Q72 makes wait on a fake clock or a barrier as `spec.md:67` asks ("What to build" 5, case 25). The fix stays in Q72, as the ruling "Q72's scope" says, so no open item is raised.
- Section 3, premises: Q71's import numbers are recomputed through `graph.ts` like with like, and the 416 files are named as a different quantity ("What to build" 1, case 1). `ops.ts:789` is the Replace Preview, `workspaceSides` runs no git diff, and the `diff-read.ts` builders are listed. The channels image gets the paragraph it lacks. The full folders are named, and a new file goes into a sub-folder that takes some of the folder's files. `DiffSection.svelte` at 519, `diagrams.test.ts` at 867, `tests/server/git` at ten and the slow tag are stated, and `npx vitest run tests/server/git/git-ops.test.ts` is in the verify list. The `writesDrawn()` description is corrected, and item 2 says its stop becomes an error. `sidesPatch` is at 166, `DiffHead` at 488-497 and `diffHeads` at 549-596.
- Section 4, cases: case 1 is rewritten as above. G33's wording and Code line now cover the blocks (Z904), the row's title is booked in G33's Test line at landing, and the row's texts are held in the test itself (case 12). Case 23 (was 13) is the look alone, with the focus and disabled states. Case 24 (was 14) reads over the eight fields of the widened field look (Z905), whose shared rules live once.
- Section 5, the question: splitting is allowed only when one drawing is shown not to reach none, and routing arrows through a shared node that `arrowsAlong()` folds is ruled out (item 2, case 7); a traceability reading is case 8. The pane's wiring is covered by Z903: the diff editor is given git's changes, so everything the pane builds follows them (case 21). The stale-heads case checks each head's lines against the texts, and a mismatch carries no git changes (case 18). The range compare, the three-dot diff and the conflicted file are in case 20.
- Section 6, implied inputs: a rename with edits and a pure rename, mode change or empty file (case 13, with an empty list distinct from an absent field), no final newline (case 14), CRLF and a conflicted file (case 15), a merge commit (case 16), a textconv driver with the diff reads run with `--no-textconv` (case 17), the stale re-read through `sameFiles` (case 19), a block in a hidden region (case 22), the selection against the drawing (Z903, case 21), and the select's disabled and focus states (case 23). `diff.algorithm` is covered by decision 3 and has not happened on this machine, so it has no case.
- Declined to judge: the drawing of Monaco against git's blocks is decided by Z903; the field-look widening by Z905. Whether one channels drawing can reach none stays the builder's construction question, answered by the rule on splitting.
