# D13a landing

Roadmap entry oculus/migration (the migration of oculus). Plan step D13a: the source tab on Monaco. Next: `/refute` Q88, whose report is saved, then `/spec` the next queued steps into the two free slots.

## Open items (only what Axel must rule on; every report opens with this list verbatim and repeats it until he has ruled)

- None.

## NOT DONE

Nothing of the step. Two things were not looked at on TEST: an italic run in Markdown (no Markdown file under the paint limit that was opened holds one; the italic scope is covered by the round-1 revert of `token: null`), and Shift+Alt+F5 (the file looked at holds one mark).

## The check before landing

The runner's agent listing showed no builder or reviewer of D13a running; only Q88's builder was running.

## What landed

A text file in the source tab opens in Monaco through the `ui/controls/editor/` primitive: the theme is built from the computed tokens, the languages are Shiki's grammars through `@shikijs/monaco`, the Cmd+K chords Monaco binds are given up so Cmd+K opens the palette from inside the editor and the palette lists their actions under Monaco's labels, and the quick diff marks, the blame and the breakpoints are Monaco decorations. Alt+F5 and Shift+Alt+F5 move the caret to the next and previous mark and Open Change opens the diff at the mark on the caret's line; the palette lists these three while the file has a change.

The worktree's replay onto main conflicted in `src/lib/shell/keys/Palette.svelte`, whose rows sit in `Command.Viewport` since the Q81/Q82 look fix. Main's copy was taken and D13a's editor-items import, index, `openPaletteItem` argument, hint span and `.hint` style were written into it by hand.

## What was found, and the fixes at landing

The review over round 1 (`agents/reviews/D13a-refuter.md`, "Repair round 1, refuted") found these, each fixed on main (the Closed heading of that file):
- The three mark actions were listed for a file with no change, where they do nothing. They are now added and listed only while the text holds a mark, as VS Code's Next and Previous Change carry the precondition `quickDiffDecorationCount != 0` (`quickDiffWidget.ts:841,881` in VS Code's source).
- The hints were the literals `Alt+F5` and `Shift+Alt+F5`, written apart from the keys they name. Each hint is now written from its key through `chordHint`; `KeyPress` gains `alt`, and `keyCode` in `load.ts` sets Monaco's Alt. Alt keeps its name on macOS, as HELP.md's key table writes it.
- The blame width test measured the escaped text. It now reads the entities back, and the case carries an author `A & B`.
- `types.ts`, `editor-status.svelte.ts`, the head comment of `Palette.svelte`, DESIGN.md's code-window item and HELP.md's gutter paragraph described the palette's editor items as the removed chords only; each now names the mark actions and when they are listed.

Two more fixes at landing:
- The first fix took `Editor.svelte` to 545 lines, over the 540-line component line, and `size.test.ts` failed in the verify run. The action code was tightened to 539 lines.
- Found at the look: a press or the focus inside a pane did not make it the active pane; only choosing a tab did. After a reload the palette said no source tab was on screen while the caret was in the editor. `PaneView.svelte`'s `entered` now makes the pane's tab active on a press or focus inside it, as a click in an editor group does in VS Code.

Seen red without its fix: the no-mark case, the hint case (Alt dropped from `pressHint`), and the width case (the entities counted).

## Verification on main

`checks.sh` ran once on main with D13a staged and the review's fixes written: `Test Files 1 failed | 364 passed (365)`, `Tests 2 failed | 5786 passed | 1 skipped (5789)`, both failures in `size.test.ts` on `Editor.svelte` at 545 lines. After tightening it:
- the size, editor and palette tests: 8 files, 67 tests passed;
- `npm run check`: COMPLETED 2110 FILES 0 ERRORS 0 WARNINGS;
- `npm run build`: exit 0, built in 7.09s and 24.09s;
- `npm run format:check`: All matched files use Prettier code style!;
- `npm run lint`: exit 0;
- the ASCII grep over `src` and `tests`: no match;
- `grep -rlE "StandaloneCodeEditor|shikiToMonaco" build/server`: no match (exit 1).

After the pane fix: `tests/shell`, `tests/checks/source` and `size.test.ts`, 20 files, 293 tests passed; `npm run check` 0 errors; eslint on `PaneView.svelte` exit 0.

## The look on TEST

After a reload of the development page:
- `behavior.yml`, the oculus README and the hub README open in Monaco, with the minimap and the tokens coloured.
- `behavior.yml`, with no change against the index, lists no mark action; the palette lists "Editor | Add Line Comment | Cmd+K Cmd+C". Cmd+K inside the editor opens the palette.
- HELP.md, with one change on line 199: Alt+F5 from line 1 puts the caret on line 199, and the palette lists Open Change, Go to Next Change (Alt+F5) and Go to Previous Change (Shift+Alt+F5). HELP.md is 74,964 bytes and opens as plaintext under `editor.paint_limit_kb: 64`, as designed.
- The hub README's headings are coloured and its `**...**` runs are drawn bold.
- Blame writes each run's author and age beside the numbers, with every number in one column.
- After the pane fix, pressing the Files tree and then the editor moves the page title from Files to README.md, and `:5` offers Go to line 5.

The tabs opened for the look were closed, Blame was turned off, and the browser tab was returned to Axel's Sessions page. No A/B: the configuration names no `bench:`.

## Usage

Builder 248 tool uses, 338k tokens, 92 min (build); 101, 218k, 37 min (round 1). Reviewers 89 tool uses, 315k tokens, 24 min; 57, 213k, 10 min (round 1). First report passed its bar: no.
