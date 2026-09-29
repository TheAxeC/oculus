# D13b report: the diffs and the merge on Monaco

Everything in the brief is done. Items 1 to 8 are built under the eight rulings of `D13b-cases.md`. The paths are widened beyond the brief and the ruling in six places, each listed under "Paths widened" with its reason. One finding needs a ruling: text that is not UTF-8 (F1 below).

## Open items of the main checkout's state file, verbatim

- **Z58 (2026-09-29), Q86b, the slide along a contact that a real pointer move resumes** (from the refutation of repair round 2, `agents/reviews/Q86b-refuter.md`, Behaviour 1). Q86b lands with Z54's ruling built: the pressed node no longer jumps, and a still or sub-pixel pointer moves nothing. What remains: a neighbour pressed against another circle slides slowly along it, the settle stops while it is still sliding, and each real pointer move of a pixel or more resumes the slide. Measured by vitest on a scratch copy of the landed code, 60 pointer events alternating 1.2 units: a neighbour moves 46.38 units on seed 2 `line::a` 200 and 2.57 on seed 1 `line::c` 200. Removing a pushed node's whole speed at a contact (friction), in place of only its speed into the contact, measured the same way: 2.18 and 0.90 units, no circle overlapping, and the settle running longer (1476 frames in place of 864 on seed 2, 1288 in place of 596 on seed 1). Options:
    - (a) Recommended: step Q86c removes a pushed node's whole speed at a contact, with the case above as its test and the look on TEST.
    - (b) Leave it as landed. This is the lazy option: a small nudge can still slide a neighbour tens of pixels.

## The cases' first run, and the rulings

- The first run of the cases gave 6 files failed, 16 tests failed and 76 passed. It handed back the merge case, which the brief wrote wrong, and seven defaults.
- The Monaco-against-git hunk case (`tests/state/sources/repositories/hunks-git.test.ts`) passed on its first run, all five pairs: a one-line change, two changes six lines apart, two changes seven lines apart, a deletion at the top, and an insertion at the end. No pair differed, so nothing was handed back.
- **The ruled case.** It is ruling 1, (a). Its rule: adjacent settled regions merge, and the spans follow the gaps between node-diff3's `o` positions. The case reads `regionsOf('a\nb\nc\n', 'a\nc\n', 'a\nb\nc\n')` and is in `tests/state/sources/repositories/merge.test.ts`, "settles a deletion one side made where the other left the lines as they were". It passes and answers one settled region with lines `a, c`, ours `{0,2}` and theirs `{0,3}`. Revert R23 turns it red.
- **The other rulings, as built.**
    - Ruling 2: `attributes` is on the `diff=` answer, and it is the only read that carries it. R47 and R36b cover it.
    - Ruling 3: the conversion rule is built as written, with four cases. They are "offers nothing on a file git converts: a filter driver, or text written with CRLF" and "keeps the actions where git converts nothing: -text, autocrlf false, eol lf". R15 and R16 cover them.
    - Ruling 4: only a non-empty selection chooses rows. R7 covers it.
    - Ruling 5: DiffEditor is listed in the type-scale test, with `LineBars.svelte` added. R44 covers the entries.
    - Ruling 6: the palette lists a diff pane's editor actions. This needed `shell/keys/Palette.svelte` as well; see "Paths widened". R28 and R42 cover it.
    - Ruling 7: the stash's files come from the head lines, and its untracked files from `^3`. R29 covers it.
    - Ruling 8: `hunkNear` goes by the span of the changes. R12 covers it.

## DONE / NOT DONE

| Row | State | Command that proves it |
| --- | --- | --- |
| Items 1 to 8 built | DONE | `checks.sh` below, and the revert runs below |
| npm test, check, build, format:check, lint, ASCII grep | DONE | `PATH=... sh ~/.claude/skills/land/templates/checks.sh .../orchestrator-state.md </dev/null` |
| folder check | DONE | `bash bin/folder-check.sh`: exit 0 |
| diagrams | DONE | `npm run diagrams`: exit 0 (the diagrams test in npm test also passes) |
| grep of the cases | DONE | `grep -rn "diff-rows\|diff-words\|DiffFile\|pairedWords\|wordDiff\|function common" src tests`: prints nothing, exit 1 |
| node-diff3 import | DONE | `grep -n "from 'node-diff3'" src/lib/state/sources/repositories/merge-regions.ts`: `16:import { diff3MergeRegions } from 'node-diff3';` |
| perl ASCII gate | DONE | prints nothing, exit 0 |
| server-bundle grep | DONE | `grep -rlE "StandaloneCodeEditor\|createDiffEditor" build/server`: prints nothing, exit 1 |
| no `// revert:` lines | DONE | `grep -rn "// revert:" src tests`: exit 1 |
| The look items | NOT DONE, by the brief's rule | Browser tests are forbidden here. The before and after of each look item is below, and none of them is verified in a browser. |

The last `checks.sh` run's output, verbatim where it matters:

```
 Test Files  376 passed (376)
      Tests  5907 passed | 1 skipped (5908)
1790706603413 COMPLETED 2136 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
All matched files use Prettier code style!
checks: 6 commands passed
```

**Load and timeouts.** The machine ran at load averages of 8 to 15 during this work (`uptime`). Two earlier `checks.sh` runs on the final tree each failed on one test that timed out at 5000 ms: "is the only way a test file makes one" in `scratch.test.ts`, and "finds lane text painted only over its own lane surface" in `contrast.test.ts`. Neither test is touched by this step. The scratch case passes alone in 1931 ms (`npx vitest run tests/checks/tree/scratch.test.ts --reporter=verbose`), and the run quoted above passed whole.

## The revert runs

Each revert was applied to the source by a script in the builder's scratch folder (removed before this report). The script ran the named tests with `npx vitest run <files>` and put the file back afterwards. The red of each revert run is quoted below.

**`diff-hunks.ts`, run against `tests/state/sources/repositories/diff.test.ts`, with `hunks-git.test.ts` or `diff-patch.test.ts` where named:**

- R1: the grouping joins only gaps under six. Red: "joins changes at most six unchanged lines apart into one hunk, as git's grouping does" and "finds git's changes and git's hunks for two changes six lines apart".
- R2: the head keeps no context. Red: "writes a hunk's head as git does, three lines of context each side", plus five hunks-git pairs.
- R3: an equal-length change takes all its removed lines. Red: "chooses the added line selected and, for a change of as many lines each side, its pair", plus "unstages one staged line...", "stages the first of two changed lines and keeps each line in its place" and "reverts one line in the worktree..." (diff-patch).
- R4: an unequal change takes no removed line. Red: "takes every removed line of a change whose two sides differ in length".
- R5: a pure deletion is touched by line N only. Red: "chooses a pure deletion by the line it sits after, or the line after that".
- R6: the original-side selection chooses nothing. Red: "chooses a removed line alone from a selection on the original side" and "stages one added line of three, and one removed line of two".
- R7: an empty selection chooses. Red: "chooses nothing for a selection that touches no change, or an empty one".
- R8: an end at column 1 holds the line. Red: "reads a selection that ends at column 1 as ending on the line before".
- R9: `hunkRows` drops the removed lines. Red: "chooses every row of a hunk for its block actions", plus three patch cases.
- R10: `stepChange` does not go round. Red: "moves one change either way, round from the last to the first and back" and "crosses from the last change of one file to the first of the next, and back".
- R11: `stepFiles` stays in the first file. Red: "crosses from the last change of one file to the first of the next, and back".
- R12: `hunkNear` takes the first hunk. Red: "takes the hunk holding the line, else the first after it, else the last".
- R13: a new or deleted file allows line actions. Red: "offers only the whole file on a new or a deleted file".
- R14: a carriage return allows actions. Red: "offers nothing on a file with a carriage return on either side".
- R15: a filter driver is not a conversion. Red: "offers nothing on a file git converts: a filter driver, or text written with CRLF".
- R16: `-text` still converts. Red: "keeps the actions where git converts nothing: -text, autocrlf false, eol lf".

**`diff-patch.ts`:**

- R17: no context. Red: 14 cases in total, 7 in diff.test.ts ("stages a whole hunk as git writes it...", "stages the added line alone...", "unstages the removed line alone in reverse...", "cuts a hunk at the first line...", "marks a last line with no newline...", "joins two chosen changes four lines apart...", "keeps each line ending byte for byte") and all 7 of diff-patch.test.ts.
- R18: a stage drops the unchosen removed lines. Red: "stages the added line alone, the removed line kept as context", "stages one added line of three, and one removed line of two" and "stages the first of two changed lines and keeps each line in its place".
- R19: an unstage drops the unchosen added lines. Red: "unstages the removed line alone in reverse...", "unstages one staged line and leaves the other staged" and "reverts one line in the worktree and leaves the other change".
- R20: an equal-sided change is written with its removed lines first. Red: "stages the first of two changed lines and keeps each line in its place".
- R21: the no-newline marker is left out. Red: "marks a last line with no newline, on one side or both" and "stages a hunk at the first line, and one at a last line with no newline".
- R22b: every ending becomes a bare newline. Red: "keeps each line ending byte for byte".

**`merge-regions.ts`, run against `merge.test.ts`:**

- R23: the deletion is given to the wrong side. Red: "settles a deletion one side made where the other left the lines as they were".
- R24b: a one-sided change counts its own lines on both sides. Red: "settles a change one side made, each side counting its own lines".
- R25: an unstable region with equal sides is a conflict. Red: "settles what one side changed or both changed alike, and leaves a conflict where they differ", plus three more.

**State and palette:**

- R26: `diffViewOf` keeps a view of any path. Red: "reads a diff pane layout and its view state per file, side by side by default".
- R27: `diffViewOf` keeps a view that is not an object. Red: the same case.
- R28: `ACTION_VIEWS` without the diff pane. Red: "finds the tab whose editor actions the palette lists: a source tab or a diff pane".
- R42: Palette lists `editorItems(source)` again. Red: "lists the actions of a diff pane's editor while the pane is on screen".

**Server reads, run against `git-reads.test.ts` unless named:**

- R29: a stash leaves out its untracked files. Red: "answers every file of a stash in git order, an untracked one from nothing".
- R30: a commit ignores a rename's old path. Red: "answers a root commit's file from nothing, and a renamed file from its old path" and "answers a rename with no change of content as two equal texts".
- R31: a conflict reads the index. Red: "answers a path in conflict as Current's version against the worktree".
- R32: a worktree starts at HEAD. Red: "answers every file of a worktree from the merge base to the worktree's HEAD".
- R33: a symlink is read through. Red: "answers a symbolic link's target and a submodule's commit as git shows them".
- R34: a submodule is read as a file. Red: the same case.
- R35: a created file reads its missing side. Red: 5 cases.
- R36b: `autocrlf` is lost. Red: "answers what git's attributes say of a file's conversion beside its diff".
- R43: the worktree read answers `output`. Red: "answers a worktree's diff, the repository named beside the worktree" (routes) and "answers every file of a worktree from the merge base..." (git-reads).
- R47: the `diff=` answer loses `attributes`. Red: "answers one file's diff, and says which side it was asked for" (routes) and the attributes case.
- R48: the read takes the default 1 MB output buffer. Red: "answers both versions of a file larger than a mebibyte whole".

**Gates and parsers, run against `git.test.ts`, `git-parse.test.ts` and `type-scale.test.ts`:**

- R37: `check-attr` with two attributes. Red: "holds only the allowed subcommands at its call site, the pinned nine as their exact vectors" and "ran nothing but those commands over this file, the pinned nine as their vectors".
- R45: `config` by another vector. Red: those two cases and "ran every command without optional locks, so a read writes no index lock".
- R46: `merge-base` run twice. Red: "holds only the allowed subcommands at its call site...".
- R38b: a staged file takes line counts. Red: "sorts each record into its list, the line counts on the worktree side alone".
- R39b: git's `fatal: ` prefix kept. Red: "cuts a reason to its first line and width, without git's fatal prefix".
- R40: a numstat rename read by its old path. Red: "reads a binary file of numstat as no counts and a rename by its new path".
- R41: a missing check-attr line reads as empty. Red: "reads the three attributes in the order asked, and a missing line as unspecified".
- R44: DiffSection's `.file` loses its size. Red: "sets every local role in sources/repositories/diff/DiffSection.svelte".

**Audits.** No revert turns these red. They update path strings or entries that follow moved and removed files:

- `tests/checks/tree/boundaries.test.ts` (the kit path)
- `tests/ui/theme/colours.test.ts` (the kit path)
- `tests/ui/controls/editor/grammars.test.ts`, `paint.test.ts` and `theme.test.ts` (their imports from `kit/`)
- `tests/server/core/paths.test.ts` (the `MergeSide.svelte` line removed, the count and comment now say three)
- `tests/state/sources/repositories/hunks-git.test.ts`'s helper `tests/ui/controls/editor/monaco-diff.ts`
- the MergeSide and DiffEditor type-scale entries and the `LineBars.svelte` entry

## Files and line counts

`wc -l` on every file changed in the worktree:

- **Model.**
    - `src/lib/data/model/model-sessions.ts` 646
    - `src/lib/data/model/index.ts` 478
- **Server.**
    - `src/lib/server/core/git.ts` 865
    - `src/lib/server/core/git-parse.ts` 551
    - `src/lib/server/git/git-reads.ts` 195
    - `src/lib/server/git/git-write.ts` 700
    - `src/lib/server/git/deposit-git.ts` 317
- **State.**
    - `src/lib/state/sources/repositories/diff-hunks.ts` 243 (new)
    - `src/lib/state/sources/repositories/diff-patch.ts` 178
    - `src/lib/state/sources/repositories/merge-regions.ts` 257
    - `src/lib/state/sources/repositories/repositories.ts` 501
    - `src/lib/state/workbench/navigation/editor-status.svelte.ts` 139
    - `src/lib/state/shared/words/languages.ts` 107
- **Shell.**
    - `src/lib/shell/keys/Palette.svelte` 498
    - `src/lib/shell/keys/palette-open.ts` 38
- **Editor.** The editor folder holds 10 items (`ls`).
    - `src/lib/ui/controls/editor/DiffEditor.svelte` 380 (new)
    - `Editor.svelte` 506
    - `LineBars.svelte` 37 (new)
    - `commands.ts` 38 (new)
    - `zones.ts` 120 (new)
    - `tab-out.ts` 70
    - `types.ts` 61
    - `kit/built.svelte.ts` 21 (new)
    - `kit/look.ts` 47 (new)
    - `kit/load.ts` 169
    - `kit/colours.ts`, `kit/grammars.ts`, `kit/theme.ts` and `kit/workers.ts`, moved into `kit/`
- **Views.**
    - `src/lib/views/sources/repositories/diff/Diff.svelte` 501
    - `diff/DiffSection.svelte` 322 (new)
    - `merge/Merge.svelte` 358
    - `merge/MergeSide.svelte` 156
- **Config and docs.**
    - `config/text/views/sources/repositories.yml` 218
    - `config/catalogs/glyphs.yml` 180
    - `config/catalogs/icons.yml` 179
    - `HELP.md` 297
    - `DESIGN.md` 323
    - `package.json` 66 (`"node-diff3": "3.2.1"`)
    - `package-lock.json`
    - `docs/diagrams/*` (regenerated)
- **Tests.**
    - `tests/state/sources/repositories/diff.test.ts` 357
    - `hunks-git.test.ts` 83 (new)
    - `merge.test.ts` 158
    - `repositories.test.ts` 871
    - `tests/state/workbench/navigation/editor-status.test.ts` 95
    - `tests/server/core/git.test.ts` 875
    - `git-reads.test.ts` 558
    - `git-parse.test.ts` 83
    - `paths.test.ts` 109
    - `tests/server/git/diff-patch.test.ts` 212 (new)
    - `git-ops.test.ts` 788
    - `tests/routes/git/git.test.ts` 590
    - `tests/shell/keys/palette.test.ts` 382
    - `tests/ui/controls/editor/monaco-diff.ts` 56 (new)
    - `grammars.test.ts` 43, `paint.test.ts` 127 and `theme.test.ts` 177
    - `tests/ui/theme/colours.test.ts` 628
    - `tests/checks/tree/boundaries.test.ts` 596
    - `tests/checks/tree/allow-duplication.txt` 195
    - `tests/views/whole/type-scale.test.ts` 359
- **Lines removed.**
    - Removed whole: `src/lib/state/sources/repositories/diff-rows.ts`, `diff-words.ts` and `src/lib/views/sources/repositories/diff/DiffFile.svelte`. Their line counts were not measured, since the main checkout is read here only for the named files.
    - `MergeSide.svelte`'s line list.
    - The catalog keys `fold_open`, `line_choose` and `line_choose_title`.
    - The `unfold` glyph in `glyphs.yml` and `icons.yml`. No other file draws it (`grep -rn "'unfold'\|\"unfold\"\|\.unfold\b" src tests` prints nothing).
    - `WHOLE_FILE`.
    - The three copies of `short` in `git.ts`, `git-write.ts` and `deposit-git.ts`.
    - Two entries of `allow-duplication.txt`.

## Paths widened, each with its reason

1. `src/lib/shell/keys/Palette.svelte`, its head comment, `palette-open.ts`'s comment, and a case in `tests/shell/keys/palette.test.ts`.
    - Ruling 6 says to build the listing. The listing is drawn from `Palette.svelte:87-91`. `editor-status.svelte.ts` alone cannot do it: making `sourceOnScreen` accept a diff pane would also put the caret, line and language items on a diff pane in the status bar and the palette.
    - So the palette now reads `editorOnScreen` for its editor items and keeps `sourceOnScreen` for the line and language queries.
2. `src/lib/server/core/git-parse.ts` and `tests/server/core/git-parse.test.ts`.
    - `git.ts` reached 955 lines, over the size test's 900. The pure parsing moved out: `statusLists` (was `fill` and `entry`), `parseNumstat` (was inside `numstat`), `parseAttributes` and `shortReason`. `git.ts` is now 865.
    - The gates of `git.test.ts` still see every `run` call in `git.ts`. The moved parsers have cases of their own (R38b to R41).
3. `src/lib/server/git/deposit-git.ts` and `tests/checks/tree/allow-duplication.txt`.
    - Moving `count` out of `git.ts` changed the mark of the held clone of `short` (git.ts to deposit-git.ts and to git-write.ts). The duplication test then failed with a new mark and a new git-write.ts to deposit-git.ts pair.
    - The three copies are folded into `shortReason(value, width)`: 120 characters for the channel as before, and 200 for the writes as before. The two held entries are removed, as the check requires of a repaired clone. Adding new marks to the floor would have loosened the check.
4. `tests/server/git/diff-patch.test.ts` (new). The cases of the patch applied by git moved out of `git-ops.test.ts`, which had reached 960 lines, over 900. `git-ops.test.ts` is back to 788 lines.
5. `src/lib/ui/controls/editor/LineBars.svelte`, `kit/built.svelte.ts`, `kit/look.ts` (`repaint`) and the `LineBars` entry in `type-scale.test.ts`. These hold what `Editor.svelte` and `DiffEditor.svelte` share: the line-bar markup, the build-once-hosted effect and the repaint. They remove the clones the duplication test found between the two editors.
6. `src/lib/server/core/git.ts` `MAX_OUTPUT` (32 MiB) on the one call site. Without it, `spawnSync`'s default 1 MB buffer refuses the diff of any file over 1 MB. The fix has a case of its own, and R48 turns that case red.

## Judgment calls

- **`sidesPatch(sides, changes, chosen, mode)`.** It takes the line changes the pane drew beside what the brief names, so a chosen row is the line the reader saw.
- **Every read runs `-U0` (`NO_CONTEXT`).** It replaces `WHOLE_FILE`, since the whole texts come from `show`, and the diff gives only the head lines.
- **A path in conflict.** `fileDiff` reruns with `--ours` when git answered `diff --cc`, so the head lines are a two-way head.
- **Editor.svelte stays under 540 lines (506).** Its code is split into `kit/look.ts`, `commands.ts`, the `tabOut` factory in `tab-out.ts`, `LineBars.svelte` and `kit/built.svelte.ts`.
- **`tests/server/core/paths.test.ts`.** The comment and the case name that count the matches (now three) changed beside line 99.
- **The diff pane publishes to the editor status store**, with caret null, no language and the diff editor's actions. That is what lets the palette list its actions (ruling 6).
- **`diffActions` answers 'none' while the attributes are unread.** It cannot answer otherwise, since the rule needs them, and the answer carries them from the first read.
- **The count in "Stage N Selected Lines".** It counts the lines selected on the two sides that fall on changed lines, not the rows the patch takes. Under VS Code's rule a selected added line may pull its paired removed line into the patch.
- **`merge-regions.ts` and repeated lines.** Where one side deleted lines, the side still holding them kept them. A probe on the final code (`node --experimental-strip-types` over a script calling `regionsOf`, in the scratch folder since removed) answered correctly for both sides deleting the same line, a repeated line (`a,b,b,c` against `a,b,c`) and a delete-against-change conflict.

## Findings

- **F1, needs a ruling (a new user-visible shape).** The two versions are read as UTF-8. A file in another encoding (Latin-1, UTF-16) is shown with replacement characters, and its block and line actions are still offered. A patch cut from such text would not match git's bytes. I expect `git apply` to refuse it with its own error rather than write anything, but that is not verified: no test here builds such a file.
    - (a) Recommended: the server checks each version with `isUtf8` and marks the file, for example `encoded: false` on `DiffSides`. `diffActions` then answers 'none' with the `diff_whole` note. This adds a field to the wire format, which is Axel's to name.
    - (b) Leave it: `git apply` refuses the patch. This is the lazy option: the pane offers an action that cannot work.
- **Monaco's own words stay in English, as the brief says.** These are the hidden-lines bar and its reveal controls.

## The look items, before and after, none verified in a browser

- **A file's diff, side by side and inline.**
    - Before: drawn by `DiffFile.svelte`, the changed words marked by `diff-words.ts`.
    - After: Monaco's diff editor per file (`renderSideBySide`), with Monaco's word marks.
- **Hidden runs.**
    - Before: every unchanged run longer than six lines was folded behind an expander, three lines kept each side, with nothing folded at the file's edges.
    - After: Monaco's `hideUnchangedRegions` with `contextLineCount 3` and `minimumLineCount 1`. Monaco also hides an unchanged run at a file's start or end from four lines, and an unchanged file whole. What was revealed, and the scroll, are kept in the pane's instance state per path across a re-read and a reopen.
- **Hunk bars.**
    - Before: a row above each hunk in the line list.
    - After: a view zone above the hunk's first modified line, with the widget in the zone. Monaco aligns the zones between the two sides. Each bar carries git's `@@ -a,b +c,d @@` head, then Stage Block and Revert Block, or Unstage Block.
- **Choosing lines.**
    - Before: a press on a changed line's number chose it.
    - After: a selection on either side chooses, a press on a line number included. The bar reads "Stage N Selected Lines" while a selection chooses rows in that hunk. Revert keeps its confirm.
- **A file with a carriage return, or one git converts.** The bar reads "Stage or revert this file from Changes" and offers no action. A new or deleted file offers the whole-hunk actions.
- **Alt+F5 and Shift+Alt+F5 through a stash of several files.** They step hunk by hunk across the files. A file not drawn yet is one stop, which draws it.
- **A stash or commit of several files.** Each file's editor is created when its section comes within one screen of the view. Until then the section holds its line count's height.
- **Open File at the change, and a pane opened at a line from a quick diff mark.** Both behave as before. The mark goes to the hunk holding the line, else the next, else the last.
- **The merge editor.**
    - Before: line lists.
    - After: Incoming and Current are read-only Monaco editors, with each conflict's lines tinted (`--c-scm-conflict-bg`) and the conflict's choices on a bar above it. The Result is a writable Monaco editor. A choice is one edit of the Result, so undo reopens the conflict.
- **Theme colours.** Both editors paint from the page theme through `kit/theme.ts`. The wallpaper rule now also covers the diff editor's plain block, which shows while Monaco loads.
- **A narrow pane.** It stays side by side while Side by Side is chosen (`useInlineViewWhenSpaceIsLimited: false`).
- **HELP.md (75 KB) in a diff.** Its time to draw is not measured.

## Found wrong in the brief

- Item 6's merge case, ruled in ruling 1.
- Ruling 6 widens the paths only to `editor-status.svelte.ts` and its test, while the palette's listing is drawn in `Palette.svelte` (see "Paths widened", 1).
- The brief's paths did not foresee the size line (900) that `git.ts` and `git-ops.test.ts` would cross, or the duplication check between the two editors (see "Paths widened", 2 to 5).
