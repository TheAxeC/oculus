# Step Q109 refuter report (on .agents/worktrees/Q109, base f5b3290b)

A page this report cites is named with its section. A finding in code keeps its `file:line`. Every path below is under `/Users/axelfaes/workspace/research-hub/.agents/worktrees/Q109/tools/oculus/`.

**Summary:** no item is violated and no case is unmet. There are seven findings, all small enough to fix at landing. Two of them are risks nobody has measured: rebuilds of the usage watcher queuing behind a slow fold, and the FROZEN exemption that one could avoid.

## Verification (rerun by the reviewer)

```
$ PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH npm run diagrams
diagrams exit 0   (the diff of docs/diagrams is unchanged by the rerun: 4 files changed, 8 insertions(+), 8 deletions(-))

$ sh ~/.claude/skills/land/templates/checks.sh .scratch/migration/orchestrator-state.md      (exit 0)
$ npm test
 Test Files  355 passed | 20 skipped (375)
      Tests  5553 passed | 580 skipped (6133)
$ npm run test:checks
 Test Files  29 passed | 2 skipped (31)
      Tests  438 passed | 9 skipped (447)
$ npm run check
1790825334833 COMPLETED 2809 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
$ npm run build
$ npm run format:check
All matched files use Prettier code style!
$ npm run lint
$ ! LC_ALL=C grep -rna '[^ -~]' src tests
checks: 7 commands passed

Verify 3:
$ grep -rn perfect-debounce src tests package.json                        -> no output, exit 1
$ grep -rn "perfect-debounce\|es-toolkit" DESIGN.md README.md src          -> no output, exit 1

Verify 4:
$ npx vitest run tests/server/root/watch tests/server/machine/usage tests/state/sessions/terminals.test.ts tests/checks/config tests/ui/theme tests/views/sessions tests/state/shared --testTimeout 0
 Test Files  34 passed (34)
      Tests  665 passed (665)

Verify 5 and the report's first-run claims, reproduced on a scratch copy of the unchanged tree under $TMPDIR (made by reversing the src/config diff with `git diff f5b3290b | patch -R`, with constant-only shims for MAX_WAIT, USAGE_MAX_WAIT and RESIZE_WAIT, and main's node_modules, which holds perfect-debounce; removed afterwards):
 five watcher test files:  Test Files 5 failed (5); Tests 15 failed | 83 passed (98)
   (usage 2, bookmarks 2, local 2, portfolio 2, sessions 7; every failure is a "within the maximum wait" or "while a session store is written" case)
 terminal-menu, terminal, theme, tones, terminals: Tests 36 failed | 139 passed (175)
   (terminals 10, tones 1, theme 7, terminal-menu 7, terminal 11)
 15 + 36 = 51 failures, which matches the report's per-file counts. The 462 passing and 513 total in the report come from a wider file set than mine. No decision rests on those two counts.
 cases 14 to 17 (bursts, slow writes, close, injected quiets): pass on the unchanged tree (same run).

Mutations on a scratch copy of the changed tree (each one alone, restored after):
 maxWait removed from all five watchers ({ maxWait: X } -> {}):  Tests 15 failed | 83 passed (98), the same 15 cases
 RESIZE_WAIT timer removed from answered():  1 failed, "asks for the channel at RESIZE_WAIT when the resize never answers"
 per-id ordering removed (const mine = run()):  2 failed, "posts the resize of a second subscribe ..." and "posts the resize of a remount ..."
 size re-read after the answer removed (now = sent):  1 failed, "posts the grid size again when it changed while the resize was out ..."
 held input removed (hold always null):  2 failed, "holds input typed while the resize is out ..." and "drops the input held for a listener taken off ..."

Case 29, on the scratch copy with the four catalog entries removed:
 "appearance.yml: terminal.mac_option_is_meta: has no catalog entry" (and copy_on_selection, cursor_style, cursor_blinking); Tests 1 failed | 62 passed (63)
 with the entries: Tests 63 passed (63)

Case 30:
$ npm ls perfect-debounce
oculus@0.0.1 .../tools/oculus
`-- (empty)
$ npm ls lodash-es @types/lodash-es   -> @types/lodash-es@4.17.12, lodash-es@4.18.1
package.json: "@types/lodash-es" is in devDependencies (line 26, inside the block opening at line 19); "lodash-es" is in dependencies (line 69, inside the block opening at line 43); perfect-debounce absent
package-lock.json: removes node_modules/perfect-debounce and adds node_modules/lodash-es 4.18.1, node_modules/@types/lodash-es 4.17.12 and its dependency node_modules/@types/lodash 4.17.25 (dev); nothing else changes

Other claims in the report:
$ sh utils/folder-check.sh            -> rc=0
$ ls -A | wc -l   tests/views/sessions 10, tests/server/root/watch 10, tests/state/sessions 10, src/lib/state/sessions/terminal 8
$ wc -l           pty-subscribe.ts 129, appearance.ts 268, grid-look.ts 142, TerminalList.svelte 472, TerminalTitle.svelte 103, probe.ts 412 (as reported)
tests/checks/tree/size.test.ts:28-29   LINES = 900, COMPONENT = 540 (true: terminals.svelte.ts is at 899, which is why the new module exists)
ls bin            -> No such file or directory (true: the spec.md ASCII gate names a folder that is not there)
spec.md ASCII gate over src tests config (local.yml excluded) | wc -l   -> 0
```

## Verdicts

Items of the brief's "What to build":

- 1: **holds.**
  - `subscribePty(id, size: () => PtySize, onBytes)` (`src/lib/state/sessions/terminals.svelte.ts:183` type, `:833` body) listens at once, and `createPtyOrder` (`src/lib/state/sessions/terminal/pty-subscribe.ts`) posts `size()`.
  - After the answer it reads the size again and repeats the post while the size changed.
  - A resize counts as answered at `RESIZE_WAIT = 2000` (exported, re-exported from the store).
  - The resizes of one terminal are chained through `tails`.
  - Input is held through `hold` and written after the subscribe. A listener taken off posts and subscribes nothing more.
  - `TerminalGrid.svelte:388-397` passes `() => ({ cols: term.cols, rows: term.rows })` after `fit.fit()` (`:370`), and the `resized(wanted)` after the subscribe is gone.
  - Each mechanism is tested and fails when taken out (mutations above).
- 2: **holds.**
  - All five watchers use lodash-es `debounce(fn, quiet, { maxWait })`, with `MAX_WAIT = 2 * DEBOUNCE` exported in sessions, bookmarks, portfolio and local, and `USAGE_MAX_WAIT` in usage.
  - portfolio and local now export `DEBOUNCE`. `cancel()` and the `closed` guards stay.
  - The heads and doc comments are rewritten. The usage head says the rebuilds are chained, which `refresh` at `usage/watch.ts:98-101` does.
  - Every watcher test fakes `Date` through `fakeClock` (`tests/server/root/watch/probe.ts:119-121`), and every `useFakeTimers` site in the five files goes through it (grep above).
  - See Proof 1 for one misnamed test.
- 3: **holds.**
  - `TerminalTitle.svelte` wraps the bar's name in `ContextMenu own read={menu}`. `Terminal.svelte:357-365` passes `terminalRowMenu(tab, shownRow.terminal, others, arming === shownRow.terminal, t)` and routes picks through `routePick`.
  - `routePick` and `PickHandlers` are pure in `terminal-list.ts:530-564`, and the list calls the same function.
  - Join's state change is `joinInto` in `Terminal.svelte:291-295`, reached by both.
  - The rename field's `TextInput` keeps its own `TextBoxMenu` (`own` stops propagation), as in the list's rename field.
  - HELP.md:127 names the bar's menu.
- 4: **holds.**
  - The four keys in `config/appearance.yml:33-36` hold today's values.
  - `readTerminalOptions` and `terminalOptions()` read them and call `configGeneration()`.
  - `gridOptions` takes the read as an optional third parameter.
  - The effect at `TerminalGrid.svelte:438-444` reads `terminalOptions()` in its body before the null check, so it tracks the config generation. It calls only `followTerminalOptions` (no `refit`, no `resized`).
  - Four catalog entries were added, and `tones.test.ts` asserts five keys. See Standards 2 for one wording point.
- 5: **holds.**
  - DESIGN.md:116 names lodash's `debounce` with `maxWait` and says why.
  - README.md:13 names `lodash-es` (MIT).
  - See Standards 1 for DESIGN.md:361, a line outside the brief's list.

Cases of the brief's "Cases":

- 1: **not verifiable here.** It is the look, which the orchestrator takes at landing. Not counted against the builder.
- 2: **met.** "resizes the window to the grid before it asks for the channel" fails on the unchanged tree and passes after.
- 3: **met.** "asks for the channel when the resize is refused" (`ok: false`, 404). `answered` treats a rejection the same as an answer.
- 4: **met.** "asks for nothing when the listener is taken off before the resize answered" (exactly one resize body, no socket write).
- 5: **met.** "posts the grid size again when it changed while the resize was out ...". It fails with the re-read removed.
- 6: **met.** "asks for the channel at RESIZE_WAIT when the resize never answers". It fails with the timer removed.
- 7: **met.** The second-subscribe test and the remount test fail with the ordering removed.
- 8: **met.** The hold test and the drop test fail with the hold removed.
- 9: **met** by reading `TerminalGrid.svelte:370-397`. The look of case 1 is its gate.
- 10: **met.** Three cases (100, 300, 450 ms) fail on the unchanged tree and with `maxWait` removed.
- 11: **met.** The rename/icon/colour case fails on the unchanged tree.
- 12: **met.** The appended-prompts case fails on the unchanged tree.
- 13: **met.**
  - The intervals are 100 ms and `Math.round(quiet * 0.9)`: 450 for the 500 ms watchers (usage, bookmarks, sessions) and 180 for the 200 ms watchers (portfolio, local). Both are 0.9 times the quiet, so the report's 450 and 180 agree with the brief.
  - `heldFor` sends an event every `every` ms and asserts that the first rebuild comes no later than `maxWait`.
  - Each test fails on the unchanged tree and with `maxWait` removed.
- 14: **met.** `holdsBursts` passes before and after.
- 15: **met.** `holdsSlowWrites` passes before and after.
- 16: **met.** `holdsCloseDuringWrites` passes before and after.
- 17: **met.** The injected-0 and injected-long cases and the existing `local.test.ts` 1500 ms case pass. See Proof 1 for the name of the injected-0 case.
- 18: **met** for the items and the routing ("the bar menu offers the items of a list row ...", "draws the bar name directly inside the context menu trigger ...", which fails on the unchanged tree). The right-click itself is the look and is not verifiable here.
- 19: **met** for the routing. The field is the look and is not verifiable here.
- 20: **met.** "Kill arms on the first pick from the bar and kills on the second".
- 21: **met.** "the Join pick is handed the terminal the bar shows and the one to move".
- 22: **met.** "sets no cursor or Option option on a grid built with none of the four keys".
- 23: **met.** `terminalOptions` cursor-style cases: line, underline and block are mapped; beam, bar, Block, 7, "", null, true and [line] are left unset.
- 24: **met.** Wrong-type toggles are left unset, and `terminal: 5`, `[]`, `['a']`, a string, null and true give `{}`.
- 25: **met.** The duplicate `cursor_style` over `loadConfig` gives one does-not-parse finding and an empty read.
- 26: **met** for the function. `copySelection` with a refusing, a throwing and an undefined clipboard. `pageClipboard()` returns `undefined` when `navigator.clipboard` is missing, and `copySelection` returns early. The browser half is the look and is not verifiable here.
- 27: **met.** The stub tests for "not copied until it changes" and Select All.
- 28: **met** for the function and for "calls no resize" by reading the effect. The re-run on a config push is the look and is not verifiable here. See Proof 2 on the no-resize test.
- 29: **met.** Red then green, reproduced above.
- 30: **met.** `npm ls perfect-debounce` prints `(empty)` and the greps print nothing.

## 1. Spec

None.

The widenings beyond the brief's paths, each read:
- `tests/server/root/watch/probe.ts` adds the shared `holdsQuietAndMaxWait` and moves the portfolio fixtures out of `portfolio.test.ts`. It is a test helper in the same folder and adds no file.
- `config/text/views/system/config.yml` `desc_appearance` is required by `tests/views/system/help.test.ts`'s match against HELP.md, and is a text change with no new key.
- DESIGN.md:264 and :361 were made true to the new code. See Standards 1 for one clause of :361.
- `tests/checks/tree/boundaries.test.ts`: see Proof 3.

## 2. Proof

1. **The injected-0 test's name claims a maximum wait it does not check.**
   - Place: `tests/server/root/watch/probe.ts`, `holdsQuietAndMaxWait`, the test `it('keeps the maximum wait of the module when the quiet is 0', ...)` running `holdsNoQuiet`.
   - What is wrong: the test asserts one rebuild per event 100 ms apart, which says nothing about a maximum wait. With a quiet of 0 every call fires on a 0 ms timer, so the maximum wait can never bind and cannot be observed. The test passes on the unchanged tree and with `maxWait` removed from all five watchers (mutation run above).
   - Failure scenario: a reader of the five test files thinks the injected-0 maximum wait is covered, and a later change that derives `maxWait` from the injected quiet goes unnoticed. The fix at landing is to rename the test to what it asserts ("runs one rebuild for each event when the quiet is 0").
   - Verdict: none (case 17 is met).
2. **The report does not sort the "audits that ..." tests into audits and proofs.**
   - Place: `tests/views/sessions/terminal.test.ts`, `it('audits that no option change resizes the grid', ...)`.
   - What is wrong: `followTerminalOptions` takes an `OptionsTarget`, which has no `resize`, so the test would pass whatever the function did. It is a true audit. Other tests are also named "audits that ..." (copy on selection, Select All, the routing) but each fails when its code is taken out. Verify 5 asks the report to say which tests are audits and which are proofs. The report says only that the naming is required by `tests/checks/tree/audits.test.ts`.
   - Failure scenario: a reader at landing counts the no-resize test as proof that the config effect sends no resize. That fact rests only on reading `TerminalGrid.svelte:438-444`.
   - Verdict: none (case 28 is met by reading).
3. **A file-scope mutable added, with its check passed by an exemption.**
   - Place: `src/lib/state/shared/words/appearance.ts:72` (`let terminalSettings: TerminalOptions = {};`) and `tests/checks/tree/boundaries.test.ts:278`.
   - The hunk: `+    'lib/state/shared/words/appearance.ts:terminalSettings',`
   - What is wrong: a module-level `let` is added and the FROZEN exemption list grows by one so that `findGlobalState` passes. The binding is in the class the FROZEN comment documents ("appearance.ts hold what the server last sent, are never written after a push installs them"), and it is written only by `setAppearance`, as `terminalFont` is. So this is not a new kind of exemption, and the report states it. The alternative that leaves the list unchanged is to fold `terminalFont` and the four options into one binding (for example `let terminal: { fontPx: number | null } & TerminalOptions`), which replaces the `terminalFont` entry rather than adding one.
   - Failure scenario: each new appearance key adds another FROZEN line, and the exception list grows without a decision that it should.
   - Verdict: none.
4. **The report's first run quotes no failing output.**
   - Place: the report, "The cases' first run on the unchanged tree".
   - What is wrong: verify 5 asks for each failure to be quoted. The report gives a summarised table: test names, and for cases 10 to 13 a paraphrased message. The "4, 5, 6" row names "stops handing them over ..." and leaves out case 5's own test, "posts the grid size again ...".
   - My own run reproduces every failure and every pass the table claims, with the counts per file, so no claim is wrong. Only the quotation is missing.
   - Failure scenario: a reader cannot tell from the report which test proves case 5.
   - Verdict: none.

## 3. Standards

1. **One clause of DESIGN.md:361 is false when a resize gets no answer.**
   - Place: `DESIGN.md:361`.
   - The hunk: "which lands right once the page's grid and the pane are the same height, as they are because the page asks for the channel only after its resize answered, or after `RESIZE_WAIT` (2 s) with no answer".
   - What is wrong: in the no-answer branch the window may still be at the old height, so "as they are" holds only when the resize answered. This breaks the rules file's rule that a document sentence the change makes false is a defect of the change (spec.md, "What every package obeys").
   - Failure scenario: a developer debugging a blank grid after a slow tmux reads that the heights always match, and looks elsewhere. A fix at landing: "as they are once the page's resize has answered; after `RESIZE_WAIT` (2 s) with no answer the channel is asked for anyway".
2. **The `copy_on_selection` catalog description understates how the grid copies.**
   - Place: `config/catalogs/options.yml`, the entry `terminal.copy_on_selection`.
   - The hunk: "false copies only through Copy."
   - What is wrong: with the key off, the grid still copies through the menu's Copy as HTML and through the keyboard copy, which xterm handles through the browser's copy event. So the description is not true to its reader (spec.md, "The principles every package is judged on": a catalog's text is oculus's own and true).
   - Failure scenario: a reader of S3c's Settings editor thinks Cmd+C does not copy unless the key is on, and turns it on for that reason. A fix at landing: "false copies only when asked (Copy, Copy as HTML or the copy key)".

## 4. Behaviour

1. **Usage rebuilds can now queue behind a slow fold under steady writes.**
   - Place: `src/lib/server/machine/usage/watch.ts:98-109`.
   - The hunk: `pending = pending.then(build, build);` with `debounced(() => { void refresh(); }, debounce, { maxWait: USAGE_MAX_WAIT })`.
   - What changes:
     - Before, under steady writes no rebuild ran until the writes stopped.
     - Now one rebuild is chained every 1000 ms for as long as the writes go on. The status folders and transcripts are written while any session works, so that is most of the time.
     - If a fold takes longer than 1000 ms, the chain grows by one waiting rebuild per second, minus the ones that finish, for as long as the writes continue.
     - The head comment says the rebuilds are chained, but the report's before and after for the usage channel gives only "rebuilt at least every maxWait" and does not mention the queue.
   - Failure scenario: a machine where one usage fold takes 3 s while a session works gains about two waiting rebuilds every three seconds, and the channel publishes stale results ever further behind.
   - Not verified: the fold time on a real store was not measured. One timed `fold.fold` over the machine's own accounts would settle it.
   - Fix if the fold proves slow: skip a rebuild when one is already waiting, keeping the latest only.

## Declined to judge

- **The looks** (case 1 and the browser halves of cases 18, 19, 26 and 28). The orchestrator takes them at landing, as briefed.
- **Input dropped while a removed listener's resize is still waiting.**
  - `hold` returns false and drops input for an id whose only waiting entries were taken off, even when another grid of the same id is already attached, until the dead entry's resize answers or `RESIZE_WAIT` passes.
  - Reading says this cannot be reached in one client: `TerminalGrid` is used only by `Terminal.svelte`, a terminal belongs to one tab, and a page is drawn at most once. I did not trace every mount and unmount order in a pane move.
- **Synchronous rebuilds from lodash's tight-loop branch.**
  - With `maxWait` set, a call that arrives after the bound while a timer is still pending runs the rebuild synchronously inside the caller: inside an `fs.watch` callback, or inside the pty channel's `onChange`.
  - The channel calls its listeners after the list is updated (`channel.ts:534`), and the sessions rescan and the portfolio rebuild are synchronous. I found no hazard, but did not probe it under load.
- **The pre-existing DESIGN.md:116 opening.** "Each channel has one watcher module that ... debounces" is also untrue of the git watcher, which throttles (`server/root/watch/git.ts:232`). That was so before this diff and is outside the change.

Reviewer usage: about 270,000 tokens, about 60 tool uses, about 35 minutes. None of these was measured exactly.
