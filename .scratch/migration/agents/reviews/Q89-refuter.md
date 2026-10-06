# Q89 refuter report

Reviewer a116360e9ab07e528, a fresh agent, over `git diff 34a30f8e` in `.agents/worktrees/Q89`.

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
   - Line counts before and after (from `git diff 34a30f8e --numstat` plus `wc -l`) match the report's table on every row.

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

## Repair round 1, refuted

Reviewer a38991e425707e8b4, a fresh agent, over `git diff 65baf8da` read against `git diff 34a30f8e`.

Scope: `git diff 65baf8da` (the round) read against `git diff 34a30f8e` (the whole step) in `.agents/worktrees/Q89`. `git status --short` lists the 11 modified paths of the round plus the untracked report, and nothing else. I changed nothing in the worktree or the ledger. Every revert test below ran in a copy of `tools/oculus` in my scratchpad, which I deleted afterwards. After deleting it, `git status --short | wc -l` still printed 12, the same as before.

### Verify

I ran `sh .../land/templates/verify.sh .../orchestrator-state.md > $S/verify.log 2>&1; echo $?` from the worktree's `tools/oculus`. It exited 0. The summary lines, verbatim:

```
 Test Files  339 passed (339)
      Tests  5339 passed (5339)
1790610231648 COMPLETED 1431 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
built in 1.86s
built in 9.80s
All matched files use Prettier code style!
verify: 6 commands passed
```

There were no timeouts. 5339 is the first review's 5332 plus the round's 7 new cases (5 in `terminal.test.ts`, 2 in `pages.test.ts`).

### Commands the report quotes, rerun

- The vitest subset (`tests/views/sessions/terminal.test.ts tests/state/workbench/layout tests/state/sessions/folds.test.ts tests/views/sessions tests/views/whole tests/checks tests/ui/wall.test.ts tests/ui/colours.test.ts`) gave `Test Files  51 passed (51)` and `Tests  1044 passed (1044)`, as the report says.
- `npm run lint` exited 0. The check and the format lines are in the verify output above.
- The perl ASCII gate printed nothing. `LC_ALL=C grep -n '[^ -~]' HELP.md DESIGN.md` printed nothing (exit 1). The picker grep printed nothing (exit 1).
- Line references: `rowKey` is at `terminal-list.ts:83`, `listDrawn` at `:71`, `parseLayout` at `saved.ts:279`, `viewStates` at `:328`, `registerViews` at `layout.svelte.ts:166` and `:674`, and `new Set` at `terminal-list.ts:27`. All match the report.
- Line counts: `wc -l` matches the report's table except one row. `terminal-list.ts` has 144 lines; the report says 143.

### Revert tests of the round's closures (in the scratch copy)

| Change undone | Result |
|---|---|
| `listDrawn` back to `count >= 2` | Red: "draws the one terminal there is as a row while the tab shows the composer" and "audits when the list is drawn". |
| The call site `Terminal.svelte:158` back to `rows.length >= 2` | Red: "draws the one terminal there is as a row while the tab shows the composer". |
| Split and Kill back to `tabindex={row.terminal === stop ? 0 : -1}` | Red: "is one stop of the focus order". |
| The `layout.registerViews(...)` line deleted from `context.ts` | Red: "reads back only what the registry of the client holds after a reload". |
| The `view !== ''` filter taken out of `viewStates` | Red: "keeps a saved value only under a registered view id, dropping an empty or unknown key". |
| Kill drawn on the first row only | Red: "offers Split and Kill on every row, and a tooltip naming the terminal". |
| The `split` and `kill` branches removed from `keys()` in `TerminalList.svelte:132-133` | All 20 green. See Proof 1. |

No item of the round was closed by removing a check. The one test changed outside the new cases is the first `pages.test.ts` case, which gained `again.registerViews((view) => view === 'terminal')`. The rule it tests changed, and the case still asserts the order read back, so this does not fit a test to its revert.

### Points (a) to (f)

(a) The load order is correct on a real page load. No test holds it.
- `createClientState()` runs at `src/routes/+page.svelte:42`. At its end, `context.ts:255` registers the rule as a closure that asks `registry.viewFor` at the time it is called.
- `registerAll(client.registry)` runs in the component's script body (`+page.svelte:67`, inside `untrack`). `loadLayout()` runs later, in `onMount` (`+page.svelte:210`).
- The only parse of the saved layout is inside `loadLayout`: `storage.attach` at `layout.svelte.ts:332`, then `parseLayout(raw, first, (view) => knownRule(view))` at `:335`. `grep -rn parseLayout src` finds no other caller in `src`. `grep loadLayout src` finds only `+page.svelte:210`.
- So when the layout is parsed, the rule exists and `terminal` is registered, and the row order survives a reload.
- The new `pages.test.ts` case "reads back only what the registry of the client holds after a reload" copies this order through `createClientState` (register, then `loadLayout`). It goes red without `context.ts:255`.
- No test mounts `+page.svelte`. If `loadLayout()` were moved before `registerAll`, no test would fail, and every saved order would be dropped. This is a gap in coverage, not a defect in the diff. The round did not change `+page.svelte`, so it is not a finding against the round.

(b) The `context.ts` change is necessary.
- `parseLayout` has to be told which ids are registered views. Only the registry knows this, and the layout store does not import it (DESIGN.md: "The rule reads the registry through `registerOpened` ... so the layout store never imports the registry").
- The registry is built over the layout (`createRegistry(layout)`, `context.ts:250`), so the rule cannot go into `createLayout` as an argument.
- The two added lines sit beside the existing `registerOpened` call at `:253`, in the one place where both objects exist. That is the smallest place the change could go.
- The report names the path as outside the brief's list, with this reason. The orchestrator should add the path to the step's accepted paths.

(c) The comment breaks the rule in effect, though not in the way the other VS Code references in the tree do. `terminal-list.ts:80` reads: "Delete or Backspace kills it, as VS Code's tabs list kills with Delete."
- The step's brief and DESIGN.md make VS Code the target a surface is drawn to. The other 55 files in `src` that name VS Code (`grep -rln "VS Code" src | wc -l`) name the thing drawn.
- This clause instead gives another program's behaviour as the reason for a key binding. The authority for these keys is round ruling item 1, not VS Code.
- The parity inventory lists no Delete key: `grep -n -i "delete\|backspace\|kill" vscode-parity.md` shows only "Row actions on hover: split, kill" and "Kill the terminal from the view". So the claim about VS Code is unsourced in the ledger.
- The clause also covers Backspace, which it does not claim VS Code binds.
- It is a Standards finding (Standards 2 below).

(d) Backspace from the list is a risk. The cause is not a keystroke leaking from the grid; it is focus, key repeat and an arm that never ends.
- A Backspace meant for the grid cannot reach a row. `keys()` is attached only to the row's own button (`TerminalList.svelte:202`). The xterm textarea sits in `div.grid` inside `.main`, a sibling of the list (`Terminal.svelte:470-486`). Split and Kill sit in `.actions`, a sibling of the row button, so their key events do not bubble into `keys()`.
- Focus is left on a row after a pointer press. `show()` (`TerminalList.svelte:88-91`) does not move focus. The grid effect (`Terminal.svelte:~290-330`) never calls `term.focus()`. The only `grid.focus()` calls are at `:273` (after a paste answer) and `:282` (after a drop).
- In Chromium a pressed button keeps focus (not verified in a browser). A reader who presses a row and starts typing therefore loses the letters, and two Backspaces kill the tmux session.
- Holding Backspace alone is enough. `keys()` does not look at `event.repeat`, so the first keydown arms and the first auto-repeat, about half a second later, kills.
- `arming` is never cleared (`:61`, `:111-120`: no timeout, no reset on blur, no reset when the stop moves). One stray Backspace leaves the row armed, and any later Backspace or Kill press on it kills at once.
- See Behaviour 1.

(e) Yes, the one-row list is covered. With `listDrawn` reverted to `count >= 2`, two cases go red. With the call site reverted to `rows.length >= 2`, "draws the one terminal there is as a row while the tab shows the composer" goes red. The first review's revert run agrees.

(f) Z39 is left as ruled. `placeOf` and the Split half of `HELP.md:123` are unchanged in the round's delta. Not a finding.

### Spec

None. Each of rulings 1 to 7 is built as ruled, and rulings 8 and 9 are in the report.

### Proof

1. **The keys' wiring in the component is not held by any case.** `TerminalList.svelte:129-133`:
   ```
   if (action === 'show') show(rows[index]);
   else if (action === 'split') split(rows[index]);
   else void kill(rows[index]);
   ```
   Deleting the `split` and `kill` lines leaves all 20 cases of `terminal.test.ts` green (scratch-copy run). Ruling 1 asked that "Delete, Backspace and Shift+Enter reach the kill and the split through the functions the view calls". The audit asserts only `rowKey`, which is a function the view calls, so the letter of the ruling is met. This matches how the step treats the other named audits.
   - Smallest fix: none in code. The landing's look on TEST must press Delete twice and Shift+Enter on a row.
2. **The report's line count for `terminal-list.ts` is wrong.** The table gives 143; `wc -l` gives 144.
   - Smallest fix: correct the row.

### Standards

1. **`TerminalList.svelte:323-324` is a comment the round made false.**
   ```
   /* The row's controls are drawn clear until the pointer or the keyboard is on the row, and are
      kept in the page rather than hidden so the keyboard can reach the ones at the stop. */
   ```
   After ruling 1, Split and Kill carry `tabindex={-1}` (`:223`, `:237`), and the keyboard no longer reaches them.
   - Smallest fix: give the reason that is true now. The controls are drawn while the pointer or the keyboard's stop is on the row, so the armed Kill ("Press again to kill this terminal") shows while a Delete or Backspace waits for its second press.
2. **`terminal-list.ts:80` gives prior art as the reason for a binding.** See (c):
   ```
    * Delete or Backspace kills it, as VS Code's tabs list kills with Delete. Null for any other key,
   ```
   - Smallest fix: drop "as VS Code's tabs list kills with Delete", or state the reason on oculus's terms: the keys are the keyboard's way to Kill, which the list keeps out of the focus order.

### Behaviour

1. **Delete or Backspace can kill a terminal the reader did not mean to kill.** `TerminalList.svelte:126-134` (`keys`) and `:111-120` (`kill`):
   ```
   const action = rowKey(event.key, event.shiftKey);
   if (action !== null) {
       event.preventDefault();
       ...
       else void kill(rows[index]);
   ```
   - An auto-repeated keydown counts as the second press, so holding Backspace for about half a second kills the terminal. That breaks "the first arms, the second kills".
   - The arm never ends, so an earlier stray press turns a later single press into a kill.
   - A pointer press leaves focus on the row, since `show()` does not move it to the grid. A reader who then types Backspace twice, believing they are in the shell, kills it.
   - The same row-level arm with no expiry exists in `SessionList.svelte:73`, `:129-133`, but there it is reached by the pointer only.
   - Smallest fix, in `TerminalList.svelte`:
     - return early from `keys()` when `event.repeat` is true and the action is `kill`;
     - clear `arming` when the list loses focus (`onfocusout` on `div.list`, when `relatedTarget` is outside it) and when `stopped` moves;
     - optionally hand focus to the grid after a pointer `show()`.
   - Add a case for the repeat, which `rowKey` can take as a third argument, `rowKey('Backspace', false, true) === null`, so it is asserted without a DOM.

### What I did not check

- Anything that needs a DOM or a browser: whether a pressed row really keeps focus in Chromium and Safari, the key repeat, the hover opacity, the drag, the paste question, the file drop and the bell.
- The report's first-run quotes, and each of its per-case failure quotes in the round's "Each new case's failure" section. I made my own reverts of the round's closures (table above) and did not repeat the builder's exact reverts. The eight `pages.test.ts` and `folds.test.ts` quotes were not rerun.
- Whether VS Code's terminal tabs list binds Delete, or which keys it uses on macOS.
- `npm run diagrams`, which writes files. Only its checks inside the suite ran, and they passed.
- The main checkout's state file, whose open items the report quotes. I did not compare them.

### Usage

Not measured. Roughly 70k tokens of context. One full verify run (about 6 minutes), one run of the report's vitest subset, and eight targeted vitest runs in the scratch copy.


Reviewer aefceffa630f486a8, a fresh agent, over `git diff 8803f5b9` read against `git diff 34a30f8e`.

## Repair round 2, refuted

```
sh /Users/axelfaes/.claude/skills/land/templates/verify.sh /Users/axelfaes/workspace/research-hub/tools/oculus/.scratch/migration/orchestrator-state.md   (from .agents/worktrees/Q89/tools/oculus), exit 1
RED: npm test
 FAIL  tests/server/core/git-reads.test.ts > the reads on demand > reads no deletion on a path one side added, which has no base (git AU and UA)
Error: Hook timed out in 10000ms.
 FAIL  tests/server/core/git.test.ts > the log, the branches and the worktrees > cuts every list it publishes at the cap
AssertionError: expected +0 to be 200 // Object.is equality
 FAIL  tests/server/core/git.test.ts > read only > ran every command without optional locks, so a read writes no index lock
Error: Test timed out in 5000ms.
 FAIL  tests/server/git/git-ops.test.ts > pull, fetch, sync and publish > pulls the repository's own way, rebasing where the repository says so
Error: Test timed out in 5000ms.
 FAIL  tests/server/git/git-ops.test.ts > through the endpoint, with the real operations > routes each action to its own operation with its own fields
Error: Test timed out in 5000ms.
 Test Files  3 failed | 336 passed (339)
      Tests  5 failed | 5341 passed (5346)
   Duration  207.16s
```
The five failures are in git-reads.test.ts, git.test.ts and git-ops.test.ts. Four are timeouts. The fifth is git.test.ts's cap case, whose state() read 0 branches under the same load. The step touches none of the three files or the code under them. verify.sh stops at the first red command, so I ran the other five commands of the list once each, in the same form:
```
npm run check         exit 0   1790613383132 COMPLETED 1431 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
npm run build         exit 0   built in 3.26s / built in 18.01s
npm run format:check  exit 0   All matched files use Prettier code style!
npm run lint          exit 0   (no output after eslint .)
! LC_ALL=C grep -rna '[^ -~]' src tests   exit 0
```
Commands the report quotes as evidence, rerun:
```
npx vitest run tests/views/sessions tests/state/sessions tests/checks tests/views/whole tests/ui/wall.test.ts tests/ui/colours.test.ts tests/state/workbench/layout
 Test Files  60 passed (60)
      Tests  1146 passed (1146)                          (report: 60 / 1146, reproduced)
spec perl ASCII gate over src tests bin config | wc -l   0  (reproduced)
LC_ALL=C grep -n '[^ -~]' HELP.md DESIGN.md | wc -l      0  (reproduced)
wc -l terminal-list.ts 151, Composer.svelte 423 (main 418), composer.ts 292 (main 259), composer.test.ts 367 (main 323), terminal.test.ts 340, Terminal.svelte 540, TerminalList.svelte 358   (all match the report's table)
open items in the main state file: "None."                (matches the report)
git status --short: the 11 modified paths of the round plus the untracked report, nothing else
```

### 1. Spec
- `TerminalList.svelte:73-79` and `:150`: `stop` is `$derived` from `stopped`, `current` and `order`, but the arm is checked against it only in `keys()` after an arrow, Home or End move (`if (!armKept(arming, stopped, true)) arming = ''`). The stop also moves when `current` changes while `stopped` is `''`, or when the stopped row leaves `order`, and in both cases `arming` keeps the old row. Example: a keyboard reader arms row A with Delete (the stop is A because A is current), a keyboard action outside the list changes the selection, `current` becomes B, and focus stays on A's button. One more Delete on A then kills A. Round 2 item 2 asks that the arm be "cleared when the stop moves". The head comment `TerminalList.svelte:15-16` ("An armed Kill is disarmed when the stop moves") claims the same. Smallest fix: check the arm against `stop` where the kill happens (`kill()` fires only when `armKept(arming, stop, true)` for a keyboard kill), or clear `arming` in an effect on `stop`.
- `armKept(armed, stop, focusInList)` (`terminal-list.ts:97`) has one caller, `TerminalList.svelte:150`, and it always passes `true`. The focus-leave half of the rule is done separately in `left()` (`:113-117`), which does not call `armKept`. Item 2 asks for "the arm-clearing rule as a pure function ... with its cases". The function exists, but the view does not apply its rule: the `focusInList` argument has no caller that passes `false`.
- Z39 (a) says "listed first by its path". `WorkspacePicker.svelte:37-38` labels the split folder, like every other place, by its last segment (`code`), with the path only as its tooltip. The test name at `composer.test.ts` ("offers a split folder ... first, by its path") uses the same words. If the ruling meant the whole path as the label, this is not built. If it meant "identified by its path", it is built. The wording does not settle which; the orchestrator should read it against Axel's ruling.

### 2. Proof
- Split's wiring in the view is held by no case. Change `split()` at `TerminalList.svelte:99-105` back to write `{ ...COMPOSER_EMPTY, workspace: folder, agent: row.kind }` (no `split` field) and every test stays green (checked by reading: the only Split cases build the record by hand, `terminal.test.ts:254-265`, or call `splitRecord` directly). This is the same class as the named audits of round 1, and the look on TEST must split a shell that has `cd`ed outside every place.
- The focus-leave clear is held by no case: removing `onfocusout={left}` (`:187`) leaves every test green, since `armKept('a','a',false)` tests an argument no caller passes (see Spec 2). The pointer-press focus hand-off (`pressed`, `pointed`, `focusing`) also has no case. The report says so.
- The report's first-run quotes ("8 failed, 35 passed" on the round-1 code) and its eight single-case revert quotes are not reproduced; doing so needs file edits, which were outside what I may do. I checked two by reading. For "offers the places as they are to a composer no Split opened", the case goes red if `offeredPlaces` prepends `record.workspace`. For the view case `'>code<'`, removing `offeredPlaces` from `Composer.svelte:77-82` makes `composerWorkspace` return the hub, and the picker label is then `t('composer.hub')`. Both are consistent with the quoted failures.

### 3. Standards
- `src/lib/views/shared/sessions/WorkspacePicker.svelte:12`, `/** The folders offered, absolute, the hub first. */`, is made false by the round. `offeredPlaces` now puts the split folder before the hub, and `Composer.svelte:77-83` passes that list to the picker. The head comment at `:2-4` ("a menu of the hub, every root of every saved workspace and every workspace a session sits in") also no longer lists everything the menu can hold. The spec says a comment the change makes false is a defect of the change. The file is not on the step's path list, and the report does not name it.
- `TerminalList.svelte:15-16`: the head comment's "disarmed when the stop moves" is not true for every move of the stop (Spec 1).
- The round changes two things no item asks for, both in `Terminal.svelte`: `togglePanePin` is compacted (`:190-193`), and the grid's dragover handler moves to `fileOver` in `terminal-list.ts:114`. The report names both and gives the reason: to hold `Terminal.svelte` at 540 lines, the component limit, which it now sits at exactly. The move adds a `FILE_DRAG` import to a view helper, which changes the layer diagram counts (71 to 72, 568 to 569). The report states that too. Behaviour is unchanged by reading.
- No comment carries history. The changed files are ASCII. No file is over its limit (Terminal.svelte 540 of 540).

### 4. Behaviour
- A Kill armed by the pointer is now disarmed when focus leaves the list. Before: a press on Kill armed it until the second press, wherever focus went in between. After: a press anywhere outside the list between the two Kill presses (for example into the grid) disarms it, so the next Kill press only arms again. The report states this for "tabbing out" and "focus leaves the list" in the keyboard context only, and gives no before and after for the pointer.
- A tab opened by Split keeps offering the split folder in its composer for as long as the tab holds the composer record, including every later composer in that tab (report judgment call 1). This is user-visible, and the report states it as a judgment call, with no before and after.

### Not checked
- Anything that needs a DOM: the pointer-press focus hand-off, `event.detail` telling a pointer press from Space, `onfocusout` with `relatedTarget` in Chromium and Safari (Safari does not focus a button on click), the key repeat, the arm clearing, and the Split composer on screen.
- The report's first-run and revert quotes, which need file edits (Proof 3).
- The three failing git test files were not rerun, as instructed.
- `npm run diagrams` was not rerun, since it writes files. The diagram checks inside the suite ran within the report's vitest subset and passed.

Reviewer usage: 24 tool uses, about 30 minutes.

## Closed

- The first review's findings: closed in repair round 1, as the run over round 1 above reproduces.
- The run over round 1: its findings and the unbuilt Z39 (a) item went back as repair round 2 (`agents/briefs/Q89-round2-sent.md`), and the run over round 2 above reproduces each closure.
- Round 2, Spec 1 (the arm kept when the stop moves other than by the arrow keys): fixed at landing, an `$effect` on `stop` in `TerminalList.svelte` disarms any Kill armed on another row, whatever moved the stop.
- Round 2, Spec 2 (`armKept`'s focus argument with no caller passing false): fixed at landing, `armKept(armed, stop)` holds the stop rule and its cases; focus leaving the list is the list's `focusout`, as its doc comment says.
- Round 2, Spec 3 (the split folder labelled by its last segment): no change. The picker labels every place by its last segment with the whole path as its tooltip, and the split folder follows that rule; Z39 (a)'s "listed first by its path" is read as identified by its path. Named in the landing report for Axel.
- Round 2, Proof 1 (Split's wiring held by no case): fixed at landing, `splitState(folder, agent)` in `state/sessions/composer.ts` builds the split tab's state and the view passes its result; the case "opens a split tab whose composer offers and starts in a folder outside every place" fails with the split field dropped: "expected [ '/hub', '/hub/tools' ] to deeply equal [ '/tmp/elsewhere', '/hub', ...(1) ]".
- Round 2, Proof 2 (the focusout clear and the pointer hand-off held by no case): no DOM case exists in this suite for either; the Kill arm and kill by the pointer were seen on TEST, the keyboard paths were not. Named in the landing report.
- Round 2, Standards 1 (`WorkspacePicker.svelte`'s head comment and `places` doc made false): fixed at landing, both now say the menu lists the places it is handed, a split folder among them, in the order handed.
- Round 2, Standards 2 (the head comment of `TerminalList.svelte`): true after Spec 1's fix.
- Round 2, Standards 3 (`togglePanePin` compacted and `fileOver` moved, to hold `Terminal.svelte` at 540 lines): accepted, behaviour unchanged.
- Round 2, Behaviour 1 and 2 (a pointer-armed Kill disarmed when focus leaves the list; a split tab keeps offering its folder): stated in the landing report.
- The verify run's red tests (git-reads, git and git-ops under load): not the step's files; green on main at landing.
