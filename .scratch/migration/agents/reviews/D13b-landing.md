# D13b landing

Roadmap entry oculus/migration, the migration of the research cockpit to oculus. Plan step D13b, the diffs and the merge on Monaco. Next: `/refute` over Q86c's repair round 1 (running), `/spec` Q88b and Q84 into the free slots.

## Open items (verbatim from the state file)

- Z69, Q102's Copy as HTML: a library or hand code (raised 2026-09-30 at `/spec` Q102, by the library check `libraries: check` requires). Copy as HTML turns the terminal's buffer, its colours and styles cell by cell, into HTML on the clipboard. xterm's own `@xterm/addon-serialize` does exactly that (`serializeAsHTML()`), and it is what VS Code's Copy as HTML calls. Facts (`npm view`): 0.14.0, MIT, maintained by the xterm.js team (tyriar), released 2025-12-22 in the same wave as the `@xterm/xterm` 6.0.0 oculus runs and the addon-search 0.16 and addon-fit 0.11 it already has; it would replace a hand-written walk over xterm's buffer cells and their attributes; nothing else of Q102 would use it. No ruling names it (`grep -i serialize plan.md` finds none; Q83's ruling covers the search, web-links and unicode11 addons only). The options: (a) `@xterm/addon-serialize` 0.14.0 for Copy as HTML; (b) hand code over xterm's buffer API. Recommendation: (a): it is the addon VS Code uses for this item, from the maintainers of the terminal oculus already runs, and hand code would reimplement its colour and style mapping and carry its own defects; (b) is the lazy option only in the sense of skipping the question, it costs more to write and to prove. Q102 is blocked until the ruling; nothing else is.

## Not done

- The visual look. The Chrome tab was in the background (`document.visibilityState` "hidden"), so screenshots came back blank and the look was read from the page's DOM. Not seen: the colours of the diff, the merge editor, a conflicted path's bar, a line-endings-only file with every line shown, a type change's two panes, and a page switch keeping the scroll and the caret. Booked in the state file's Booked section, taken with the tab in front at the next landing on TEST.
- The pane's blocks are not always git's hunks. On the staged `server/core/git.ts` git has twelve hunks and the pane eleven blocks: git `-105,12 +127,6` and `-118,12 +134,6` against the pane's `-105,24 +127,12`, and git `-625,87 +776,8` against the pane's `-624,87 +775,8`. The blocks are Monaco's line changes grouped by git's context rule, and Monaco's diff aligns these deletions differently. Staging such a block stages the right text, since the patch is cut from the two texts, but the block is not the hunk `git add -p` offers, which HELP.md and `hunks-git.test.ts`'s head comment say it is. Carried to Q72 in `plan.md`, with the fix: the blocks from git's own line changes (`git diff -U0` over the same two versions).

## The check before the landing

The builder and every reviewer of D13b had finished: their completion notices had arrived, and the round-1 refutation was saved in `agents/reviews/D13b-refuter.md`.

## What landed

The diffs and the merge on Monaco, from base 444b9601 (71 files, 4201 insertions, 1832 deletions, then the fixes at landing, 21 files). `GET /api/git` answers a file's diff as its two versions with git's head lines, the git attributes that decide whether a partial patch applies, and whether the path is in conflict. The diff pane draws one Monaco diff editor per file, side by side or inline, the unchanged runs hidden, its view state kept per file; blocks and selected lines are staged, unstaged or reverted by a patch cut from the two texts. The merge editor draws node-diff3's regions as Incoming, Current and Result Monaco editors. X3b's hand diff is removed; the editor's shared files are under `ui/controls/editor/kit/`.

The replay onto main conflicted in DESIGN.md, HELP.md, package.json, package-lock.json, the diagrams and the two `languages.ts` files, resolved by keeping both sides, `npm install` and `npm run diagrams`.

## Fixes at landing (twelve)

1. A path in conflict offers no block or line action; its bar says to resolve it in the merge editor from Merge Changes (the round-1 refutation's Spec 1). Cases in `git-reads.test.ts` and `diff.test.ts`, red without the fix.
2. A symlink's target is read as bytes, so a Latin-1 target is marked not UTF-8 (Behaviour 1). Case red without it.
3. `hunks-git.test.ts` compares against `git diff --no-index` over two scratch files: 5 cases in 1.0 s at load 4.8 (Proof 1). This replaces the slow tag that was booked for it.
4. A case that typing after an undo ends what redo could put back, red with `redoable: history.redoable` (Proof 2).
5. DESIGN.md and HELP.md name the not-UTF-8, `working-tree-encoding`, `ident` and conflict cases and the line-endings-only note (Standards 1).
6. Diff.svelte's head comment: the view state kept by the file's key, the caret with it (Standards 2).
7. A pane torn down while its tab stays open (a page switch, a moved tab, a split) writes its pending view state and what its editors say on the way out; a closed tab's pane writes nothing (Behaviour 2). Case red when `close` always drops.
8. A repeated path's key joins the path and its place with a NUL, so a file named `x#2` never shares a key with the second entry of `x` (Behaviour 3). Case red with `#`.
9. Three references to the editor files moved under `kit/`, from landings after the base: `TerminalGrid.svelte`, `platform.test.ts`, `derive.test.ts`.
10. `tests/routes/git/git.test.ts`'s stub and expectation carry `conflicted`.
11. A long comment line in Diff.svelte, and the bar's text keys read by literals.
12. Prettier on two test titles.

## Verification on main

From `tools/oculus`, `npm run diagrams`, then `sh ~/.claude/skills/land/templates/checks.sh .scratch/migration/orchestrator-state.md`:

```
$ npm test
 Test Files  336 passed | 19 skipped (355)
      Tests  5118 passed | 557 skipped (5675)
$ npm run test:checks
 Test Files  27 passed | 2 skipped (29)
      Tests  360 passed | 9 skipped (369)
$ npm run check
COMPLETED 2338 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
$ npm run build
$ npm run format:check
All matched files use Prettier code style!
$ npm run lint
$ ! LC_ALL=C grep -rna '[^ -~]' src tests
checks: 7 commands passed
```

No A/B: the configuration block names no bench.

## The look on TEST

The diff pane over the staged `server/core/git.ts`, read from the DOM: one Monaco diff editor with both sides, 44 fold widgets over the unchanged runs, Side by Side, Inline, Previous Change, Next Change and Open File on the bar, eleven blocks each with Unstage Block. The diff tab and the Pages tab the look opened on TEST were closed, and the Chrome tab was closed.

## Usage

- Builder (claude-opus-5-5): the first run with the cases hand-back 92 tool uses, 362k tokens, 22 min; the build after the ruling 260 tool uses, 313k tokens, 109 min; round 1 91 tool uses, 169k tokens, 26 min.
- Brief check: 64 tool uses, 230k tokens, 13 min.
- Reviewer: 80 tool uses, 287k tokens, 27 min; the run over round 1 70 tool uses, 202k tokens, 33 min.
- The builder's first report did not pass its bar: the first review's findings went back in round 1. Twelve fixes at landing.
