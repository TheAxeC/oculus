# Step D13b brief check (on main at 1b906f3d)

Read on the committed tree (`git show HEAD:...`). The main checkout's working tree also held Q88's landing staged, which moves several D13b premises; see section 3, finding 3.

## 1. Names

- `diff-rows`, `diff-words`, `DiffFile`, `hunkPatch`, `chosenIn`, `pairedWords`, `wordDiff`, `parseDiff`, `hunksOf`, `foldsOf`, `piecesOf`, `partnersOf`, `sideRows`, `hunkAt`, `hunkNear`, `stepChange`, `MAX_EDITS`, `FOLD_LONGER`: `git grep -n -- <name> -- ':!tools/oculus/.scratch'`; every hit inside the paths, `DiffFile` at `tests/views/whole/type-scale.test.ts:241` inside the listed range 235-250; other `wordsOf` hits are unrelated local functions.
- `MergeSide`: `tests/server/core/paths.test.ts:99` expects the line `'lib/views/sources/repositories/merge/MergeSide.svelte: function inside(line: number): SideConflict | undefined {'`; item 7 removes `inside()` (MergeSide.svelte:38-42); the file is not in the paths.
- `opened` / `diffViewOf`: `tests/state/sources/repositories/repositories.test.ts:134-140` asserts `opened: [4, 12]` and `opened: []`; item 5 drops `opened`; this `tests/state/...` file is not in the paths.
- The editor files moving into `kit/`, hits that are not imports: `tests/checks/tree/boundaries.test.ts:249` (FROZEN entry `'lib/ui/controls/editor/load.ts:loading'`, comment at :243); `tests/ui/theme/colours.test.ts:564` (`join(SRC, 'lib', 'ui', 'controls', 'editor', 'theme.ts')`, throws on read after the move); `DESIGN.md:289` names `ui/controls/editor/theme.ts` and `load.ts`; `src/lib/state/shared/words/languages.ts:9`, a comment naming `ui/controls/editor/grammars.ts`.
- `output` of the diff reads: callers `git-reads.ts:104,110,122,127`, `git.ts:306,332`, `git-write.ts:343,370`, tests `git-reads.test.ts:94,208`, `git.test.ts:783,790`, `git-write.test.ts:332-423`, `routes/git/git.test.ts:172,281`, reader `Diff.svelte:126`: all inside the paths.
- `DiffSides`: model types reach `state/` and `server/` through the named re-export list in `src/lib/data/model/index.ts` (`GitMergeSides` at :413); `index.ts` is not in the paths.
- The glyph only DiffFile uses: `unfold` at `DiffFile.svelte:197`, `config/catalogs/glyphs.yml:58`, `config/catalogs/icons.yml:57`; neither catalog is in the paths.
- `common`: only `merge-regions.ts:16`, inside the paths.

Findings:
1. `tests/server/core/paths.test.ts:99` made false by item 7, not in the paths.
2. `tests/state/sources/repositories/repositories.test.ts:134-140` made false by item 5, not in the paths.
3. `tests/checks/tree/boundaries.test.ts:243,249`, `tests/ui/theme/colours.test.ts:564`, `DESIGN.md:289` and `languages.ts:9` made false by the move to `kit/`; they are path strings or prose, not imports.
4. `src/lib/data/model/index.ts` must re-export `DiffSides`, not in the paths.
5. `config/catalogs/glyphs.yml:58` and `config/catalogs/icons.yml:57` (`unfold`) required by item 7, not in the paths.

## 2. The step line

- "every single-file diff in Monaco's diff editor": items 2 and 5. "`api/git` answering both versions": item 1. "hunk and line staging over `diff-patch.ts`": items 3, 4, 5. "X3b's hand diff removed": item 7 (Gutter kept, plan.md:296). "three-way regions from `node-diff3` drawn as Monaco editors": item 6. Carried D13 text: acceptance ("What it must do" and the look list), one editor per file (item 5), folder regrouped (item 2), `common()` gone (items 6, 7), LA21 (a) (item 2).

Findings:
1. Today's hunk bar prints the hunk head (`headOf(hunk)`, DiffFile.svelte:152, key `repositories.hunk_head`); item 5 does not say whether the bar keeps it.
2. Today Previous/Next step over hunks (`Diff.svelte:90`, `go()` to `data-hunk-id`); item 3 does not say whether the unit is a hunk or a Monaco line change.

## 3. Premises

- Line counts, importers, line ranges of `diffUrl`, `diffActs`, `DiffView`, `applyPatch`, `WHOLE_FILE`, `handleGitGet` (90-143), `fileDiff`, `worktreeDiff`, `commitDiff`, `stashDiff`, `mergeSides`, `GitMergeSides`, the only page reader, folder counts, the component line, packages and node-diff3's facts: all match (`git show HEAD:<f> | wc -l`, the brief's grep, `ls | wc -l`, `npm view`, a probe of the unpacked package).
- Not in the brief, from the probe: a one-sided pure deletion produces no region (ours `a,c` against base `a,b,c` gives only `{stable,o,0,1,[a]}` and `{stable,o,2,1,[c]}`); a stable `a`/`b` region carries no `o` or other-side length; a settled Region's spans can only be derived from the `o` gaps.
- The main checkout held Q88's landing staged (63 files); in it HELP.md's rows sit at 84/179/181/189, and it changes `repositories.svelte.ts`, `repositories.yml`, `DESIGN.md`, `type-scale.test.ts`, `tests/state/.../repositories.test.ts`, `allow-styling.ts` and `docs/diagrams/*`.

Findings:
1. The importer list omits `diff-patch.ts:11`.
2. The node-diff3 premise omits the one-sided deletion and the stable region's missing lengths, which item 6 depends on.
3. Q88's landing moves HELP.md's lines and the test ranges; the worktree is cut after it and the anchors re-read then.

## 4. Cases and checks

- Consistent: the answer cases for changes, staged, stash/worktree, binary, refusals; the hunk grouping (xdiff `max_common = 2*ctx`, `hunksOf` diff-rows.ts:142-160); the equal-length and unequal chosen-rows cases (VS Code's `intersectDiffWithRange`); the patch cases.
- Commit rename: `commitDiff` runs `show ... -- <path>`; probed, with the path limited to `y` git prints `new file mode` and `--- /dev/null`; `oldPath: 'x'` cannot come from today's read.
- Pure deletion rule: VS Code's `getModifiedRange` for a deletion after line N spans the end of N-1 to the start of N and `toLineRanges` widens selections to whole lines, so VS Code also takes it when the selection holds line N+1.
- The nearest-change case gives 17 under both "nearest" and today's "first at or after" (`hunkNear`, diff-rows.ts:276-284); the rule change is unstated.
- `merge.test.ts` holds no three-empty case (`regionsOf(` only with `(BASE, OURS, THEIRS)` and `('gone\n', '', '')`).
- No case for async paths (a superseded read, a pane closed while Monaco loads, a restore before the diff), the new model names, a malformed stored view state.
- The view-state cases are DOM behaviour; the look list misses reopen, lazy creation, opened-at-a-line, a narrow pane.
- Monaco's own words (the hidden-lines bar) against "every label a catalog key": unaddressed.
- The existing keys read `Stage {0} Selected Lines`, `Unstage {0} Selected Lines`, `Revert {0} Selected Lines` (repositories.yml:68-71).
- Monaco's `UnchangedRegion.fromDiffs` (`diffEditorViewModel.js:347-375`) hides an edge run at `length >= 3 + 1` (today an edge run of 4-6 is not folded, diff.test.ts:128-129) and hides an unchanged file whole.

Findings:
1. The rename case cannot pass under "the same `show` the read runs today".
2. The pure-deletion rule differs from VS Code's.
3. "the empty versions" is not a case in merge.test.ts.
4. The nearest-change case does not tell the rules apart; the change is unstated.
5. No case for the async paths, model names, view-state key.
6. View-state cases are DOM; the look list is short.
7. "Stage N Lines" does not match the keys.
8. Monaco's hide rule differs for edge runs of 4-6 and unchanged files.
9. Monaco's own UI words unaddressed.

## 5. The question

- Answer cases: no, except the rename. Hunks: yes, synthetic line changes do not prove git's grouping over Monaco's real `getLineChanges()`. Chosen rows: yes, a line-number press selects (N,1) to (N+1,1), and a start..end reading chooses N and N+1 with no case catching it. Patch: no. Steps: yes for the goal (unit unstated). Opens at a line: yes. View state: yes, `restoreSerializedState` (`diffEditorViewModel.js:269-285`) returns early before the diff is computed. Merge: yes, passes without node-diff3 and the one-sided deletion is untested. Grep: no. Items 2 and 5: look only. Item 8: no check, read at landing.

Findings:
1. The hunk case does not prove git's grouping over Monaco's line changes.
2. No case for a line-number press whose selection ends at column 1 of the next line.
3. The view-state case passes without a restore.
4. The merge cases pass without node-diff3.
5. Items 2 and 5 rest on a short look list.

## 6. Implied inputs

Missing from Cases, each with its expected result:
- A last line without a newline on one side only: the patch carries `\ No newline at end of file`; Monaco draws an added empty last line.
- CRLF, mixed endings, an EOL-only change: Monaco normalises EOL; the answer and patch keep raw EOLs; what the pane shows needs stating.
- Clean or smudge filters: how the worktree side is read.
- An empty file, new or emptied: listed with its head, no hunk bar, no crash.
- A rename with no content change, a mode-only change: the drawing needs stating.
- A symlink: the link target as git shows it. A submodule: `Subproject commit <sha>`, not a file read.
- A very large file: Monaco's `maxComputationTime` 5000 ms and `maxFileSize`; no `quitEarly` in the public API; `editor.paint_limit_kb` not addressed.
- A merge-conflicted file in a diff read: refused, or stage 2 against the worktree with no bars.
- A stash with untracked files (`<ref>^3`): listed or omitted.
- No change: `files: []` and the `diff_empty` note.
- An unstaged deletion: `modified: ''` with a `deleted file mode` head.
- A partial choice in a new or deleted file: the head adjusted, or line actions withheld.
- A stored view state for a file no longer in the diff, or malformed: dropped.
- A one-sided pure deletion in a merge; a conflict with zero lines on one side; undo of a merge choice and `typedPieces` not reading it as typing.
- A pane under 900 px: `useInlineViewWhenSpaceIsLimited` and `renderSideBySideInlineBreakpoint: 900` (`diffEditor.js:33-34`).
- `renderGutterMenu` (default true, `diffEditor.js:9`).

Monaco 0.57 API (`editor.api.d.ts`): `getLineChanges` (:6516), `onDidUpdateDiff` (:6477), `hideUnchangedRegions` (:4123-4128), `renderMarginRevertIcon` (:4071), `ignoreTrimWhitespace` (:4061), `renderSideBySide` (:4031), `IDiffEditorViewState` (:2652-2656), `changeViewZones` (:6418), `getContentHeight`/`onDidContentSizeChange` (:6252, :6155), `getSelections` (:2779) present. Not shown by the typings: that `modelState` holds the revealed runs (the source's `collapsedRegions` does), view-zone padding on the original side, any `quitEarly`.

## Declined to judge

- jsdiff and `@tanstack/virtual-core` claims: not re-run; they add no dependency.
- Alt+click on Monaco's line numbers adding a selection: needs a browser.
- View-zone alignment and the hidden-region interaction: a look item.
- The rename read, the partial new-file patch, the conflicted-file read: shape decisions for the orchestrator or Axel.

Agent usage: 64 tool uses, 230k tokens, 13 min (from the completion notice).
