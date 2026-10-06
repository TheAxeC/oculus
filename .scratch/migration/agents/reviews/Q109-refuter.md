# Step Q109 refuter report (on .agents/worktrees/Q109, base 626450a8)

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

Verify 5 and the report's first-run claims, reproduced on a scratch copy of the unchanged tree under $TMPDIR (made by reversing the src/config diff with `git diff 626450a8 | patch -R`, with constant-only shims for MAX_WAIT, USAGE_MAX_WAIT and RESIZE_WAIT, and main's node_modules, which holds perfect-debounce; removed afterwards):
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

## Repair round 1, refuted

# Step Q109 refuter report, repair round 1 (on /Users/axelfaes/workspace/research-hub/.agents/worktrees/Q109, base 626450a8)

Every path is under `/Users/axelfaes/workspace/research-hub/.agents/worktrees/Q109/tools/oculus/` unless it says otherwise.

No item is violated and no case is unmet. All eight rulings are closed, and each closure reproduces when rerun. There are five findings, all small enough to fix at landing:
- two untested lines in ruling 8's queue;
- a doc comment that still makes the claim ruling 1 took out of the test name;
- an unhandled rejection left in the queue's waiting path;
- the bar's `own` prop and its arming argument, which neither a test nor a named look checks.

One side effect outside the repo. My cleanup ran `rm` on `*.py`, `*.keep` and `checks.out` at the top level of the session scratchpad (`/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/`), which other agents of this session also use. Any such file another agent left there is gone. The builder's `mutr1.py`, which its report names, may have been one of them. No tracked file changed: `git status --short` lists the same 40 entries before and after.

## Verification (rerun by the reviewer)

```
$ PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH npm run diagrams
exit=0   (git status --short unchanged afterwards; every file of the diff byte-identical to my copy taken before the run)

$ PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH sh ~/.claude/skills/land/templates/checks.sh .scratch/migration/orchestrator-state.md     exit=0
(lines below are the output filtered by grep for the command and summary lines; the rest of vite's build output is elided)
$ npm test
 Test Files  355 passed | 20 skipped (375)
      Tests  5555 passed | 580 skipped (6135)
$ npm run test:checks
 Test Files  29 passed | 2 skipped (31)
      Tests  438 passed | 9 skipped (447)
$ npm run check
1790828145631 COMPLETED 2809 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
$ npm run build
- Adjust chunk size limit for this warning via build.chunkSizeWarningLimit.
.svelte-kit/output/server/entries/fallbacks/error.svelte.js                                      2.77 kB | gzip:   1.15 kB
$ npm run format:check
All matched files use Prettier code style!
$ npm run lint
$ ! LC_ALL=C grep -rna '[^ -~]' src tests
checks: 7 commands passed

Verify 3:
$ grep -rn perfect-debounce src tests package.json                      -> nothing, rc=1
$ grep -rn "perfect-debounce\|es-toolkit" DESIGN.md README.md src        -> nothing, rc=1

Verify 4:
$ npx vitest run tests/server/root/watch tests/server/machine/usage tests/state/sessions/terminals.test.ts tests/checks/config tests/ui/theme tests/views/sessions tests/state/shared --testTimeout 0
 Test Files  34 passed (34)
      Tests  667 passed (667)

Round delta: the round-1 tree was rebuilt in $TMPDIR (the base, from `git diff 626450a8` reversed, plus Q109-round1-base.patch) and compared with `diff -ru` against the current files. Changed in the round: DESIGN.md (116, 361), config/catalogs/options.yml, src/lib/server/machine/usage/watch.ts, src/lib/state/shared/words/appearance.ts, tests/checks/tree/boundaries.test.ts, tests/server/machine/usage/watch.test.ts, tests/server/root/watch/probe.ts. Nothing else.

Verify 5, on a scratch copy of the unchanged tree: the src/config files of the diff were put back to the base, pty-subscribe.ts was removed, constants-only shims were added for MAX_WAIT, USAGE_MAX_WAIT, RESIZE_WAIT and the exported DEBOUNCE, and main's node_modules (which has perfect-debounce) was used:
 Test Files  10 failed | 4 passed (14);  Tests  52 failed | 263 passed (315)
 per file: usage 3, bookmarks 2, local 2, portfolio 2, sessions 7, terminals 10, tones 1, theme 7, terminal-menu 7, terminal 11
 (the round's "hands every refresh ..." test fails there too; "leaves at most one rebuild waiting ..." passes there, since perfect-debounce never rebuilt during writes)
 The report's quoted failure lines reproduce verbatim for cases 2, 5, 6, 8 (drop), 10 (300 ms), 23, 26, 18 and 29.
 Case 3's test and every case 14 to 17 test pass there.

Ruling 8, the round's own tests, on the round-1 watch.ts in the current tests:
 Tests  2 failed | 56 passed (58)
 AssertionError: expected 6 to be 2 // Object.is equality
 AssertionError: expected Promise{...} to be Promise{...} // Object.is equality
Current code: Tests 58 passed (58).

Mutations of usage/watch.ts, each alone, `npx vitest run tests/server/machine/usage`:
 sharing removed (a new waiting chain per refresh):   2 failed (expected 6 to be 2; Promise not the same)
 waiting rebuild started at once (overlap):           1 failed (expected 2 to be 1)
 `waiting = null;` removed from `after`:               58 passed
 `if (closed) return;` removed from build:            58 passed
 `running = null` removed from `ended`:                58 passed (equivalent: the idle path goes through `waiting` one microtask later)
Scratch test of a second waiting cycle (fold held; change; release; change; release; expect 3 folds):
 current code: Tests 1 passed;  with `waiting = null;` removed: AssertionError: expected 2 to be 3
Scratch test of a rejecting fold:
 current code: "Unhandled Rejection  Error: fold-waiting  at build src/lib/server/machine/usage/watch.ts:86:34"; direct path silent; Tests 2 passed, Errors 1 error
 round-1 code: Unhandled Rejection fold-direct and fold-waiting; Errors 2 errors

Ruling 3: with 'lib/state/shared/words/appearance.ts:terminal', removed from FROZEN:
 + "lib/state/shared/words/appearance.ts holds module-level state in terminal",  Tests 1 failed | 10 passed (11)
$ grep -rn "terminalSettings\|terminalFont\b" src tests DESIGN.md (terminalFontPx excluded)  -> only ui.svelte.ts's own `terminalFont` (the browser store), none in appearance.ts

Bar wiring and copy guard, each alone, `npx vitest run tests/views/sessions tests/views/whole/type-scale.test.ts`:
 copySelection without `|| clipboard === undefined`:           Tests 438 passed (438)
 Terminal.svelte menu={() => []}:                              Tests 438 passed (438)
 Terminal.svelte arming argument replaced by false:            Tests 438 passed (438)
 Terminal.svelte onpick={(pick) => void pick}:                 Tests 438 passed (438)
 TerminalTitle.svelte read={() => []}:                          Tests 438 passed (438)
 TerminalTitle.svelte `own` removed:                            Tests 438 passed (438)

$ git diff 626450a8 -- tests | grep -E "^\+.*it\(['\"\`]audits that" | wc -l   -> 16  (and 0 removed), as the report says
$ grep -rn "keeps the maximum wait\|quiet of 0" tests src DESIGN.md HELP.md README.md
 tests/server/root/watch/probe.ts:245:/** An injected quiet of 0 runs a rebuild for each of three events 100 ms apart. */
 tests/server/root/watch/probe.ts:262: * writes runs nothing more, an injected quiet of 0 keeps the maximum wait, and one longer than the
```

All scratch copies were removed after use.

## Verdicts (whole diff since the base)

Items of the brief's "What to build":

- 1: **holds.**
  - `subscribePty(id, size, onBytes)` is at `src/lib/state/sessions/terminals.svelte.ts:183` (type) and its body is below it.
  - `createPtyOrder` is in `src/lib/state/sessions/terminal/pty-subscribe.ts` (read whole). It re-reads the size after each answer, counts a resize as answered at `RESIZE_WAIT = 2000`, chains the resizes per id through `tails`, and holds input through `hold`.
  - `TerminalGrid.svelte` passes `() => ({ cols: term.cols, rows: term.rows })` after `fit.fit()`, and the `resized(wanted)` after the subscribe is gone.
  - The case tests fail on the unchanged tree (verify 5 above).
- 2: **holds.**
  - All five watchers use lodash-es `debounce` with `maxWait`, and the constants are exported.
  - The rename asked in ruling 1 is made (see the judgments below). Ruling 8's coalescing is correct by reading and by its two tests; see Proof 1, Proof 2 and Behaviour 1.
- 3: **holds.**
  - `TerminalTitle.svelte` wraps the name in `ContextMenu ... read={menu} own {onpick}`.
  - `Terminal.svelte` passes `terminalRowMenu(tab, shownRow.terminal, others, arming === shownRow.terminal, t)` and routes picks through `routePick` with the one `handlers` object the list also gets.
  - `joinInto` uses `instance.id` and `pageId()`, which are what the list received as `instance` and `page`.
  - See Proof 4 on the wiring.
- 4: **holds.**
  - The four keys, `readTerminalOptions` and `terminalOptions()` are in place.
  - Ruling 3's one binding is `src/lib/state/shared/words/appearance.ts:78`, `let terminal: { fontPx: number | null; options: TerminalOptions }`. It is written only by `setAppearance` (`:168`), and its readers keep their names and shapes.
  - `gridOptions` takes an optional third parameter, and `followTerminalOptions` is in grid-look.ts.
  - The catalog entries are there, and the `copy_on_selection` text is as ruling 6 words it.
- 5: **holds.**
  - DESIGN.md:116 names lodash's `debounce` with `maxWait`, limits the debounce to the five watchers, describes the usage queue, and says the git watcher throttles per root. That matches `touch` at `src/lib/server/root/watch/git.ts:231-245`.
  - DESIGN.md:361 carries ruling 5's clause verbatim.
  - README.md:13 names `lodash-es` (MIT).

Cases of the brief's "Cases":

- 1: **not verifiable here.** It is the look at landing, on the "Split tab downwards" move.
- 2: **met.** "resizes the window to the grid before it asks for the channel" fails on the unchanged tree with `expected [] to deeply equal [ { action: 'resize', ...(3) } ]`.
- 3: **met.** "asks for the channel when the resize is refused" passes before and after. `answered` treats any settle as an answer.
- 4: **met.** "asks for nothing when the listener is taken off before the resize answered".
- 5: **met.** "posts the grid size again when it changed while the resize was out ..." fails on the unchanged tree with `expected [] to have a length of 2 but got +0`.
- 6: **met.** "asks for the channel at RESIZE_WAIT when the resize never answers".
- 7: **met.** The second-subscribe test and the remount test.
- 8: **met.** The hold test, and the drop test (`expected true to be false`).
- 9: **met** by reading `TerminalGrid.svelte` (the mount and the subscribe call). The look of case 1 is its gate.
- 10: **met.** The tests at 100, 300 and 450 ms fail on the unchanged tree (`the started terminal published in -1 ms`).
- 11: **met.** The renamed-terminal test fails on the unchanged tree.
- 12: **met.** The appended-prompts test fails on the unchanged tree.
- 13: **met.** The `holdsQuietAndMaxWait` cases at 100 ms and at 0.9 quiet fail on the unchanged tree in all five files.
- 14: **met.** Passes before and after.
- 15: **met.** Passes before and after.
- 16: **met.** Passes before and after. For usage, the rebuild pending is the debounce's, which `queued.cancel()` drops. See Proof 2 for a rebuild waiting behind a fold at close.
- 17: **met.** The injected-0 and injected-long cases and `local.test.ts`'s 1500 ms case pass. The renamed injected-0 test now says what it asserts; see Proof 3 for its doc comment.
- 18: **met** for the menu items (`terminalRowMenu`, an audit) and the shared routing.
  - "draws the bar name directly inside the context menu trigger" fails on the unchanged tree.
  - The right-click itself is the look and is not verifiable here; see Proof 4.
- 19: **met** for the routing. The field opening is the look and is not verifiable here.
- 20: **met** for the routing: "Kill arms on the first pick from the bar and kills on the second".
- 21: **met** for the routing: "the Join pick is handed the terminal the bar shows and the one to move".
- 22: **met.**
- 23: **met.** `expected undefined to be 'bar'` on the unchanged tree.
- 24: **met.**
- 25: **met.**
- 26: **met** for the function. The browser half is the look and is not verifiable here. See the judgment on the guard.
- 27: **met.**
- 28: **met** for `followTerminalOptions`. "calls no resize" rests on reading the effect in `TerminalGrid.svelte` (it calls only `followTerminalOptions`), and the report now says so. The re-run on a config push is the look and is not verifiable here.
- 29: **met.** The first refuter reproduced red then green. The four entries are present and the catalog check passes in `npm run test:checks`.
- 30: **met.** The greps print nothing. `npm ls perfect-debounce` was not rerun this round, and package.json and package-lock.json are unchanged since the first review.

## The builder's three statements, and ruling 8

1. **The unit word in ruling 1's rename.** The statement holds.
   - The new name is ``it(`runs one ${what} for each event when the quiet is 0`, ...)`` at `tests/server/root/watch/probe.ts:306`.
   - `what` is 'rebuild' in usage (`watch.test.ts:220`) and portfolio (`portfolio.test.ts:461`), 'message' in bookmarks (`:204`), 'call' in local (`:128`) and 'publish' in sessions (`sessions.test.ts:668`). In each file it names what that file's `count` counts, and every sibling test in the helper uses the same word.
   - The ruling's purpose, a name that says what the test asserts, is met in all five files. The two that differ from the ruling's literal wording are still true. The builder said three, and that count is right: message, call and publish.
   - The closure is incomplete: the helper's doc comment still makes the claim the rename removed (Proof 3).
2. **The `clipboard === undefined` guard in `copySelection`.** The statement holds.
   - My mutation run without the guard gives `Tests 438 passed (438)`.
   - Behaviour does not depend on it: with no clipboard, `clipboard.writeText` throws a TypeError at once, and the `try`/`catch` at `src/lib/views/sessions/terminal/grid/grid-actions.ts` takes it. So the absent-clipboard half of case 26 is proved by the catch, and the guard is not a proof gap.
   - The guard does narrow `SelectionClipboard | undefined` under `"strict": true` (tsconfig.json:12). Without it `clipboard.writeText` would not type-check. That is by reading; I did not run svelte-check on the mutation.
   - It leaves no case unchecked.
3. **The four bar-wiring mutations.** The statement holds, and a fifth passes too: `arming === shownRow.terminal` replaced by `false` (438 passed).
   - Does it leave a case of the brief unchecked? No case as the brief words it.
     - Case 18 gives "the right-click itself" to the look, and that look exercises `menu` and `read`.
     - Case 19's look (Rename picked from the bar opens the field) exercises `onpick`.
     - Cases 20 and 21 ask only for a test of the routing.
   - Two wiring points are checked by neither a test nor a named look:
     - `own`: whether a right-click on the bar also reaches a menu around it.
     - The arming argument: the armed wording of Kill on the bar's menu after the first pick. Case 20's behaviour holds without it, since the shared `kill` handler holds the arm.
   - See Proof 4.
4. **Ruling 8's coalescing** (`src/lib/server/machine/usage/watch.ts:80-126`).
   - **At most one rebuild waits behind a running one.** True. `refresh` creates `waiting` only when it is null, and every later call returns the same promise. When the running promise settles, `ended` runs before `after`: both are reactions on the same promise, registered in that order and queued together. So `running` is cleared and then set to the new run with no code in between.
   - **The data published last is the latest.** True. `build` reads `now()` and the fold when it starts, and a waiting rebuild starts only after the running one ends, so after every refresh it absorbed. A refresh that comes after the waiting rebuild has started creates a new waiting one. The test covers one waiting cycle only (Proof 1).
   - **A closed watcher stops.** A waiting rebuild that starts after close returns at `if (closed) return;` (`:84`). No test covers that path (Proof 2). A fold already running at close still publishes once after close. Base 626450a8 had the same `build`, so this is not this step's.
   - **No rejection is left unhandled.** Not met. The waiting path leaves one, and the direct path drops a failure without a log (Behaviour 1).

## 1. Spec

None. The round's delta touches only the files its rulings name, and DESIGN.md:116 adds no claim the code does not bear out.

## 2. Proof

1. **The reset of `waiting` is untested.**
   - Place: `src/lib/server/machine/usage/watch.ts:119-122`.
   - The hunk: `const after = (): Promise<void> => { waiting = null; return start(); };`
   - What is wrong:
     - With `waiting = null;` removed, all 58 tests in `tests/server/machine/usage` pass.
     - The round's test runs one waiting cycle only. My scratch test of a second cycle passes on the current code and fails without the line: `expected 2 to be 3`.
   - Failure scenario: an edit drops the reset. After the first queued rebuild, every refresh made while a fold runs joins a promise that has already settled. The last change before the writes stop is then not published until the next event or the 60 s clock, and the test meant to guard "the last event's data is published" stays green.
   - Fix at landing: add a second cycle to "leaves at most one rebuild waiting ...", or a test of its own.
   - Verdict: none (item 2 holds).
2. **No test closes the watcher while a rebuild waits behind a running fold.**
   - Place: `src/lib/server/machine/usage/watch.ts:84`.
   - The hunk: `if (closed) return;`
   - What is wrong: removing the guard passes all 58 tests. The waiting path the round added is a new way for a rebuild to start after close. Ruling 8 asked that `closed` keep its meaning, and nothing proves it does on that path.
   - Failure scenario: the guard is lost in an edit. A watcher closed during a slow fold with a rebuild queued then folds again and publishes to the hub after close.
   - Verdict: none (case 16 is met for the debounce's pending rebuild).
3. **The helper's doc comment still says the injected-0 case keeps the maximum wait.**
   - Place: `tests/server/root/watch/probe.ts:262`.
   - The hunk: ` * writes runs nothing more, an injected quiet of 0 keeps the maximum wait, and one longer than the`
   - What is wrong: ruling 1 renamed the test because it asserts nothing about a maximum wait. This doc comment of `holdsQuietAndMaxWait`, the lines the case list of all five watcher files hangs on, still makes that claim. The closure reached the name and not the sentence beside it.
   - Failure scenario: the one in the first report's Proof 1. A reader of the helper believes the injected-0 maximum wait is covered, and a change that derives `maxWait` from the injected quiet goes unnoticed.
   - Fix at landing: "an injected quiet of 0 runs once per event".
   - Verdict: none.
4. **The bar's `own` and its arming argument rest on no test and no named look.**
   - Place: `src/lib/views/sessions/terminal/TerminalTitle.svelte`, `<ContextMenu label={shown.title} read={menu} own {onpick}>`, and `src/lib/views/sessions/terminal/Terminal.svelte`, `arming === shownRow.terminal,`.
   - What is wrong: five mutations of the wiring pass every view test (Verification). The report names four of them, and their coverage by the looks of cases 18 and 19 is right. The two points those looks do not reach are not named in the report's "What the green does not cover":
     - `own` matters only where a menu wraps the bar;
     - the arming argument decides the armed wording of Kill on the bar's second right-click.
   - Failure scenario: `own` removed, or the arming argument set to a constant. At landing the right-click shows a menu and Rename opens the field, so the look passes. Either the outer menu opens too, or Kill on the bar never reads as armed.
   - Fix at landing: the look of cases 18 and 20 includes a second right-click after Kill, and a right-click on the bar's name with the pane's own menu in mind.
   - Verdict: none.

## 3. Standards

None. In the round's files, the only lines over 100 columns are test-name strings, which `format:check` accepts. DESIGN.md:116 and :361 now state what the code does, and the catalog text is true to its reader.

## 4. Behaviour

1. **A rebuild that rejects is unhandled on the waiting path and dropped silently on the direct path.**
   - Place: `src/lib/server/machine/usage/watch.ts:102-126` with `:130` (`void refresh();`). The same `void` is at `src/lib/server/root/context.ts:268` (`onChange: () => void usage?.refresh()`).
   - The hunk: `waiting = running.then(after, after);` ... `return waiting;`, and `run.then(ended, ended); return run;`
   - What is wrong:
     - On the waiting path, `waiting` adopts the new run's rejection, and no caller handles it. The scratch probe gives `Unhandled Rejection Error: fold-waiting at build src/lib/server/machine/usage/watch.ts:86:34`.
     - On the direct path, `run` has the `ended` handler, so a failed build is swallowed with no log.
     - Before the round, both paths left the rejection unhandled (scratch probe: two unhandled errors). So this is not a regression, but ruling 8 asked that no rejection be left unhandled, and the report states neither behaviour.
   - Reachability: by reading, the fold's file reads and parses are caught (`foldFile`'s `try`/`catch` and `stores`' `realpathSync` `try`/`catch` in `src/lib/server/machine/usage/transcripts.ts`). I did not establish that nothing in `build` can throw (`usageAccounts`, `refresherFor`, `hub.publish`).
   - Failure scenario: a build that throws while a rebuild waits. Under Node's default for unhandled rejections the server process ends. A build that throws with nothing waiting fails with no trace, and the usage channel goes stale with nothing logged.
   - Fix at landing: one catch that logs, at `start` or at the two `void refresh()` callers, so both paths report and neither crashes.
   - Verdict: none (item 2 holds).

## Declined to judge

- **The looks**: case 1, and the browser halves of cases 18, 19, 26 and 28. The orchestrator takes them at landing, as briefed.
- **Whether a throw in the usage `build` is reachable in practice.** Settling it needs a probe of `usageAccounts` and `refresherFor` against a malformed account store, or a timed run on the real store. Neither is a read or a rerun of the step's checks.
- **The type error from removing the `copySelection` guard.** I inferred it from `"strict": true` and did not run `npm run check` on that mutation.
- **Pre-existing behaviour, outside this step**:
  - a fold in flight at close publishes once after close (`build` checks `closed` only before its `await`; the same in base 626450a8);
  - `void mine.finally(...)` in `pty-subscribe.ts` would leave an unhandled rejection if `size()` or `subscribe()` threw. The first review accepted it, and the round does not touch it.

Reviewer usage: about 226,000 tokens (from the context counter, not exact), about 45 tool uses, minutes not measured.

## Closed

The findings of the run over repair round 1, each fixed at landing on main (`agents/reviews/Q109-landing.md`):

- Proof 1 (the reset of `waiting` untested): `tests/server/machine/usage/watch.test.ts`, "makes a new rebuild wait for a refresh that comes while that one folds", a second waiting cycle that counts three folds.
- Proof 2 (close while a rebuild waits): the same file, "starts no rebuild that waited once the watcher is closed".
- Proof 3 (the helper's doc comment): `tests/server/root/watch/probe.ts` now says an injected quiet of 0 runs once per event.
- Proof 4 (the bar's `own` and its arming): the look on TEST at landing. A right-click on a sole terminal's bar name opened the row menu and no outer menu; Rename opened the title field; Kill armed, and a second right-click read "Press again to kill this terminal".
- Behaviour 1 (a rejected rebuild): `start` in `src/lib/server/machine/usage/watch.ts` catches and logs `usage watch: cannot rebuild: <reason>`, so neither the caller nor the waiting rebuild is handed the failure; `DESIGN.md:116` says so. The test "logs a rebuild that fails, whether it ran at once or waited, and leaves no rejection" failed without the catch (`AssertionError: promise rejected "Error: fold 2" instead of resolving`, and an unhandled rejection) and passes with it.
