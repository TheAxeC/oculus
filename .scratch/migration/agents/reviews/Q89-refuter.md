# Q89 refuter report

Reviewer a116360e9ab07e528, a fresh agent, over `git diff 36db3164` in `.agents/worktrees/Q89`.

Verify, run from /Users/axelfaes/workspace/research-hub/.agents/worktrees/Q89/tools/oculus with `sh /Users/axelfaes/.claude-work/skills/land/templates/verify.sh /Users/axelfaes/workspace/research-hub/tools/oculus/.scratch/migration/orchestrator-state.md`. It exited 0. Its summary lines, verbatim:

```
 Test Files  339 passed (339)
      Tests  5332 passed (5332)
1790608023557 COMPLETED 1431 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
built in 33.19s
All matched files use Prettier code style!
verify: 6 commands passed
```

My run had no timeouts, so no untouched file needed a separate run. The "Rebasing ... error: could not apply" lines in the log come from test fixtures working in temporary git repositories. They are not failures.

## Spec

1. **The list is not one keyboard stop.** `TerminalList.svelte:216` and `:230` give Split and Kill `tabindex={row.terminal === stop ? 0 : -1}`, so the list takes three Tab stops: the row, its Split and its Kill. Brief item 2 says "The list is one keyboard stop; the arrow keys move between rows". This is a defect inside the brief, and the head comment `TerminalList.svelte:13-14` records the departure. Smallest fix: set `tabindex={-1}` on both controls and reach Kill from the row with a key in `keys()` (VS Code's tabs list uses Delete). Whether Split needs its own key is for the orchestrator to rule.
2. **Split does not always start in the row's folder.** When no composer place holds the terminal's folder, `placeOf` (`terminal-list.ts:113-116`) returns the folder itself (`|| cwd`). `Composer.svelte:76-78` then swaps any value outside `places` for the hub. So a shell in `/tmp` splits into a composer at the hub. Brief item 2 says "holding the composer with the row's folder". The brief assumed the composer can hold any folder, and it cannot. The report files this as judgment call 9 instead of raising it as a premise found wrong, and `HELP.md:123` states "in its folder". Fix: raise it to the orchestrator as a premise (either the composer takes any folder, or the brief narrows to "the place holding the row's folder"), and correct the HELP sentence to match.
3. **`Page.views` is a new saved-layout key the brief did not name.** It is `Record<ViewId, unknown>` (`model.ts:299`), is saved in the layout envelope and is read by `saved.ts:312` (`if (isRecord(entry.views)) page.views = { ...entry.views };`). Item 6 needs it, and brief decision 4 puts the order in the page's layout state, so it is inside the step's scope. The brief's path list allows only "the layout-state helper" under `state/workbench/`, and the step touched three files there (`model.ts`, `saved/saved.ts`, `layout.svelte.ts`). The report states the shape as judgment call 1; the orchestrator should confirm or reverse it. Defect: `parseLayout` keeps any key, so a key naming no registered view, or the empty key, is carried and saved forever. Smallest fix: keep only keys that are registered view ids in `parseLayout`, plus a case for an empty key and an unknown one.
4. **The other paths outside the brief's list are justified.**
   - `TerminalTitle.svelte` was needed: `Terminal.svelte` is 536 lines against the 540 component line in `tests/checks/tree/size.test.ts:31`, and the file sits in the brief's own folder.
   - The `tests/ui/wall.test.ts` entry uses that file's documented mechanism (a hover response is solid on purpose, `wall.test.ts:95`) with the same reason as the `TerminalRows.svelte .row:hover` entry. No predicate was widened.
   - `tests/state/workbench/layout/pages.test.ts` is where store cases belong, since cases under `tests/views` that draw nothing must be named audits.

## Proof

1. **The Kill half of the Split-and-Kill case stays green with Kill on only one row.** `tests/views/sessions/terminal.test.ts:195` is `expect(body.split(catalog['sessions.terminal_kill']).length - 1).toBeGreaterThanOrEqual(2)`. Every Kill button renders `aria-label="Kill"`, and its tooltip bubble "Kill this terminal, ..." is rendered in the server output (`src/lib/ui/menu/Tooltip.svelte:242-251`). So one row alone gives 2 matches. Line 196, `toContain('vim')`, is satisfied by the row title, not the tooltip. Fix: count `aria-label="${catalog['sessions.terminal_kill']}"` inside each row's slice of the body.
2. **The duplicate case of the stored order is not exercised.** Removing `new Set` at `terminal-list.ts:26` leaves every case green. spec.md requires every id a step introduces to be exercised empty, duplicated and colliding. Fix: add `expect(storedOrder({ order: ['a', 'a'] })).toEqual(['a'])`.
3. **The seven "audits" cases stay green when the view's wiring is undone.** Each one does go red when its function's rule changes. They stay green if `Terminal.svelte` stops attaching `holdPastes` (`:461`), stops handling the drop with `droppedOnGrid` (`:535`), or stops calling `grid.paste` on a yes (`:437`), or if `TerminalList` stops calling `movedOrder`/`withOrder` on a drop. This matches spec.md: they are named audits and the wiring is left to the look. The look must therefore check the paste question, the drop and the drag.
4. **Two cases pass on the unchanged tree.** They are the agent steer box and the "selected elsewhere" case. The report says so and keeps them as guards of unchanged behaviour. They go red if `{#if agent}` becomes false, or if the `id === null && selectedSession !== null` branch is removed.
5. **Not every first run is quoted.** Of the four new cases in `pages.test.ts`, the first-run table quotes one failure (`first.setPageViewState is not a function`). The four `folds.test.ts` cases are covered by one "e.g." quote. Brief verify item 2 asks for each case's failure to be quoted.
6. **The report's other counts reproduce.**
   - `npx vitest run tests/checks tests/views/sessions tests/state/sessions/folds.test.ts tests/state/workbench tests/views/whole` gives `Test Files  64 passed (64)`, `Tests  1283 passed (1283)`.
   - The `colours` and `wall` run gives `2 passed (2)`, `16 passed (16)`.
   - The picker grep prints nothing (exit 1).
   - The perl ASCII gate prints nothing.
   - Line counts before and after (from `git diff 36db3164 --numstat` plus `wc -l`) match the report's table on every row.

## Standards

1. **The builder ran one git command.** It reports a read-only `git rev-parse` in the worktree. The brief says "Run no git command, not even a read."
2. **`DESIGN.md:271` still carries a false clause in the sentence the diff rewrote.** The sentence reads "Each session view carries a session picker, except Changes and the Terminal view". Changes does draw a session picker: `src/lib/views/sessions/changes/Changes.svelte` uses `SessionPicker`, and `tests/views/sessions/changes.test.ts:364-369` asserts `data-session-picker`. The clause predates the step, but the diff rewrote the sentence and kept it. Fix: "except the Terminal view".
3. **`HELP.md:123` has two statements that are not always true.** "Split (a new terminal beside, in its folder)" is false for a folder outside the composer's places (Spec 2). "With one terminal the bar names it instead" is false in a composer tab (Behaviour 2). Fix: correct the wording, or fix the behaviour.
4. **A head comment was left with a broken line.** `src/lib/state/workbench/layout.svelte.ts:7-9` reads "...and which page is on\n// screen. Every operation that names a path names\n// the page it addresses". The edit left a short line in the middle. Re-wrap to the file's width.

No comment carries history, the files are ASCII only, no file is over a size line, and the terminal folder holds 7 items.

## Behaviour

1. **Split and Kill in the Tab order.** The brief asks for the behaviour this lacks (item 2: one keyboard stop). This is a defect inside the brief; see Spec 1.
2. **A composer tab with exactly one terminal has no control to show that terminal.**
   - Before: the "Pick a terminal" menu listed the one terminal, and a pick showed it in the tab.
   - After: no list and no title (`Terminal.svelte:483` draws the title only when `shown !== null`). The terminal is reached only through the Sessions list.
   - The brief does not ask for this: item 3 names only "the shown terminal's title". So it is not a defect inside the brief, but it is a lost capability. The report states only the "after".
   - Options for the orchestrator: (a) draw the list, or a one-row list, when the tab shows the composer and one terminal exists; (b) leave it as is. (b) is the lazy option.
3. **A drop while the socket is closed types nothing and shows no message.** The brief does not ask for a message. Typing at the grid already behaves the same way: `term.onData` goes to `sendInput` and its result is ignored (`Terminal.svelte:320`). Not a defect inside the brief.
4. **Split for a shell outside every composer place opens the composer at the hub.** The report's before-and-after section does not state this. See Spec 2.

## What I did not check

- Anything that needs a DOM or a browser: the capture-phase paste hold on xterm's textarea, the drop reaching the grid past the shell's pane drop handling, the drag reorder, the bell, hover, the arrow keys, and the Confirm dialog.
- The first run on the unchanged tree. Reproducing it needs a checkout of the base, which is outside the two git commands allowed to me.
- `npm run diagrams` was not rerun, since it writes files. Only the diagram checks inside the suite ran, and they passed.
- My count of Tooltip output in finding Proof 1 comes from reading `Tooltip.svelte` and `ToolButton.svelte`, not from a render.

## Usage

Not measured. Roughly 60k tokens of context, one full run of the verify script (about 6 minutes), and one targeted vitest run.
