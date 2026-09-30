# Q106 report: Close pane on a pane of two or more tabs closes it after Confirm

Everything in the brief is done, with one deviation in item 6: `choose` in `src/lib/shell/keys/Palette.svelte` does not move the keyboard for an editor action (see "Anything in the brief that was wrong"); reversing it is deleting `&& item.kind !== 'editor'` on one line.

Not verified in a browser (the look on landing, case 10 and case 19, is the orchestrator's): that one `await tick()` is enough for a newly opened tab's head to exist, and the order of the dialog's give-back and the palette's landing in a real page. Both are argued under "Anything in the brief that was wrong".

## Open items (state file, `.scratch/migration/orchestrator-state.md` lines 132 to 135, verbatim)

```
## Open items (only what Axel must rule on; every report opens with this list verbatim and repeats it until he has ruled)

An entry leaves this list for the closed log the moment Axel rules on it. What a review or a look found and no brief covered is not an open item: it is booked as its own step in `plan.md` and carried in the Booked section below, since it needs no ruling from him.
```

The list holds no entry (`sed -n 132,135p .scratch/migration/orchestrator-state.md`).

## The cases' first run on the unchanged tree

The tree for this run is the base with `giveBackQuietly` extracted into `quiet-focus.ts` with Modal's synchronous body (`if (control instanceof HTMLElement && control.isConnected) focusQuietly(control);`), the `client` project in `vite.config.ts`, `client-runtime.ts`, `give-back.svelte.ts` and the test file in the form it has now (one comment line was shortened afterwards for the comment-width check). `Modal.svelte` was unchanged, `focusIsFree` did not exist. Command: `npx vitest run tests/ui/frame/give-back.client.test.ts --reporter=verbose`, result `Tests  7 failed | 4 passed (11)`.

| Case | How run | Result on the unchanged tree |
|---|---|---|
| 1 pane closed from its menu | test "leaves a pane closed from its own menu closed, in memory and in storage" | fails: `AssertionError: expected '{"kind":"split","dir":"row","sizes":[...' not to contain '"b"'` (the tree holds `b`) |
| 2 palette shape | test "keeps the tab an answer activated in another pane active" | fails: `AssertionError: expected '{"kind":"split","dir":"row","sizes":[...' to contain '"active":"a"'` |
| 3 answered with nothing | test "gives the focus back once the dialog is gone, while the control is on the page" | passes (preserved behaviour) |
| 4 control takes the focus first | test "leaves the focus with a control that took it before the dialog could give it back" | fails: `AssertionError: expected 1 to be +0 // Object.is equality` |
| 5 opener taken off the page | test "gives no focus to a control taken off the page before it could" | fails: `AssertionError: expected 1 to be +0 // Object.is equality` |
| 6 collection, `npx vitest list --filesOnly --exclude 'tests/checks/**'` | count | 369 files, 0 under `tests/checks` |
| 7 checks and slow collection | `npx vitest list --filesOnly tests/checks`; `npx vitest list --filesOnly --tagsFilter slow` | 29 check files; 398 slow-filter files |
| 8 slow-tagged client file | by reading the root `tags` and the commands: `npm test` passes `--tagsFilter '!slow'` and the filter sits at the root, so it applies to both projects | rule holds; the probe is under "DONE / NOT DONE" |
| 9 Bell and menu | `grep -n "giveBackQuietly\|focusQuietly(" src -r` | `Bell.svelte:60` and `menu-items.ts:132` call `focusQuietly` directly; neither calls `giveBackQuietly`; rule holds |
| 11 second dialog takes the focus | test "gives nothing back when the answer draws a second dialog that takes the focus" | fails: `AssertionError: expected 1 to be +0 // Object.is equality` (the opener was focused, its handler ran) |
| 12 focused control off the page | test "counts a control taken off the page as holding nothing" | passes (the synchronous give-back focuses the opener) |
| 13 no focused element | test "counts the document holding no element as holding nothing" | passes (same reason) |
| 14 two dialogs in one flush | test "lets the first of two dialogs taken away together take the focus and the second find it held" | fails: `AssertionError: expected 1 to be +0 // Object.is equality` (the second opener was focused) |
| 15 body focused at opening | test "gives the focus back to the body when the dialog was opened with the body focused" | passes (preserved behaviour) |
| 16 `focusIsFree` | test "is true for no focused element, the body and a control off the page, false for a control on it" | fails: `TypeError: focusIsFree is not a function` |
| 17 three callers | by reading `Tabs.svelte`, `ActivityRail.svelte`, `NoticeCentre.svelte` on the base | Tabs and the rail hold the same condition as `focusIsFree` will; NoticeCentre's base condition `held.isConnected && (at === null || at === document.body)` leaves out the disconnected case, as the brief says |
| 18 client file under `tests/checks` | scratch probe | run after the change, below |
| 19 palette landing | by reading `Palette.svelte` `choose` on the base | it calls `onclose()` and `openPaletteItem(...)` and nothing else; no landing on the tab |

No case gave a result the brief's rules get wrong; nothing was handed back before the code changed.

## DONE / NOT DONE

All rows are DONE. Commands run from `tools/oculus` in the worktree with `PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH`.

| Item | Command and output |
|---|---|
| 1 `focusIsFree`, `giveBackQuietly` in `quiet-focus.ts` (lines 26 to 49); Modal cleanup `$effect(() => () => giveBackQuietly(came));` (`Modal.svelte:71`), import without `focusQuietly` (`Modal.svelte:26`), head comment (lines 14 to 21) | `grep -n "giveBackQuietly\|focusQuietly(" src -r` lists `Modal.svelte:21,26,70,71`, `menu-items.ts:132`, `Bell.svelte:60`, `Palette.svelte:180`; no `focusQuietly` is left in `Modal.svelte` (`grep -n focusQuietly src/lib/ui/frame/Modal.svelte` prints nothing) |
| 2 vitest `unit` and `client` projects in `vite.config.ts` | `npx vitest list --filesOnly --exclude 'tests/checks/**'` prints 370 lines, 369 tagged `[unit]` and 1 tagged `[client]` (`tests/ui/frame/give-back.client.test.ts`); with the project tags stripped and sorted, `diff` against the base list (369 lines) shows only `> tests/ui/frame/give-back.client.test.ts` (case 6); `grep -c tests/checks` over it prints 0 |
| 3 `client-runtime.ts`, `give-back.svelte.ts`, `give-back.client.test.ts` | `npx vitest run tests/ui/frame/give-back.client.test.ts --reporter=verbose` prints 11 rows `pass \|client\| ...` and `Tests  11 passed (11)`: cases 1 to 5 and 11 to 16 |
| 4 docs | `DESIGN.md` lines 218 and 402, `README.md` line 15, `HELP.md` lines 90 and 296 edited; `grep -rnI "focusQuietly\|giveBackQuietly\|client\.test\|environment" src tests README.md HELP.md DESIGN.md` read in full: the remaining hits are the new code, unrelated uses of the word, and `tests/ui/html.test.ts:6` and `tests/ui/display/glyph.test.ts:7`, whose sentence "vite.config.ts sets `environment: 'node'`" is still true (the `unit` project sets it); `Tooltip.svelte:26` and `:140` say a dialog's focus is marked through `focusQuietly`, which `giveBackQuietly` still calls |
| 5 Tabs, ActivityRail, NoticeCentre on `focusIsFree()` | `Tabs.svelte:157` `if (!focusIsFree()) return;`, `ActivityRail.svelte` `if (focusIsFree()) focusStop(id);`, `NoticeCentre.svelte:44` `if (held.isConnected && focusIsFree()) held.focus();`; `npx vitest run tests/ui/primitives.test.ts tests/shell/rail tests/shell/keys tests/ui/tabs tests/ui/frame tests/shell/status --reporter=dot` prints `Test Files  13 passed (13)`, `Tests  253 passed (253)` |
| 6 palette landing in `Palette.svelte` (`choose` and `landOn`, lines 160 to 181) | by reading; needs a DOM, so it is seen at the look (case 10, case 19) |
| Case 6 | base 369 files, after 370; the extra is the client file, run in `client` only; `tests/checks` 0 |
| Case 7 | `npx vitest list --filesOnly tests/checks`: 29 before, 29 after (`npm run test:checks`: `Test Files  27 passed \| 2 skipped (29)`); `npx vitest list --filesOnly --tagsFilter slow`: 398 before, 399 after, the extra being the client file. `npm run test:slow` was not run (the rules file forbids it); the scoped `npx vitest run tests/ui/frame/give-back.client.test.ts --tagsFilter slow` prints `Test Files  1 skipped (1)`, `Tests  11 skipped (11)` |
| Case 8 | scratch file `tests/ui/frame/zz-probe.client.test.ts` with `// @module-tag slow`, deleted after: `npx vitest run --tagsFilter '!slow' --exclude 'tests/checks/**' tests/ui/frame/zz-probe.client.test.ts` prints `Test Files  1 skipped (1)`, `Tests  1 skipped (1)`; under `--tagsFilter slow` it prints `pass |client| tests/ui/frame/zz-probe.client.test.ts > probe` |
| Case 18 | scratch file `tests/checks/zz-probe.client.test.ts` (asserting `typeof document` is `'undefined'`), deleted after: with `npm test`'s flags `No test files found, exiting with code 1`; with `npm run test:checks`'s flags `pass |client| tests/checks/zz-probe.client.test.ts > probe`, `Test Files  1 passed (1)` |
| Case 9 | by reading, above |
| Case 17 | the four affected suites above pass unchanged; NoticeCentre now also takes the focus back when `document.activeElement` is a control taken off the page (no test drives NoticeCentre; by reading only) |
| Verify 1 | `npm run diagrams` then `sh ~/.claude/skills/land/templates/checks.sh .scratch/migration/orchestrator-state.md`, exit 0, printing: `$ npm test` / ` Test Files  351 passed \| 19 skipped (370)` / `      Tests  5358 passed \| 559 skipped (5917)`; `$ npm run test:checks` / ` Test Files  27 passed \| 2 skipped (29)` / `      Tests  365 passed \| 9 skipped (374)`; `$ npm run check` / `1790803310720 COMPLETED 2478 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`; `$ npm run build` / `pass built in 16.07s`, `pass built in 28.23s`; `$ npm run format:check` / `All matched files use Prettier code style!`; `$ npm run lint` (no output); `$ ! LC_ALL=C grep -rna '[^ -~]' src tests` (no output); `checks: 7 commands passed` |
| Verify 2 | `npx vitest run tests/ui/frame/give-back.client.test.ts --reporter=verbose`: 11 passed, each row `\|client\|` |
| ASCII gate | the spec's `perl` gate over `src tests config` prints nothing; `LC_ALL=C grep -n '[^ -~]' README.md HELP.md DESIGN.md vite.config.ts` prints nothing |

The first full run of the list failed once in `tests/checks/source/comment-width.test.ts` on a 101-column comment in `give-back.client.test.ts`; the comment is shortened and the list passed on the run quoted above.

## User-visible changes

| Where | Before | After |
|---|---|---|
| Pane menu on a pane of two or more tabs, Close pane, Confirm | the pane closed and came back, in the page and in the saved layout | the pane stays closed; the give-back runs one microtask after the dialog is gone, so the opener's focus handler no longer writes the tree from before the close (the test's case 1 fails on the base and passes now) |
| Cmd+K, then a tab of another pane (Deposit) | the choice was undone by the give-back | the chosen tab stays shown in its pane, takes the keyboard on its tab head without a tooltip, and becomes the page's active tab through its pane's focus handler; a result that opens a new tab puts the keyboard on the new tab's head (look, case 19) |
| Cmd+K, then Escape; Escape or Cancel on a Confirm | the keyboard went back to the control that held it | the same, one microtask later, and only where no other control holds it (look, case 10) |
| Dialog answered by a view that focuses itself | the view kept the focus because the give-back ran first | the same: the give-back finds the focus held and gives nothing |
| Notification centre after a Clear that removes the focused button | the centre took the keyboard back only when the document held it | it also takes it back when the focus sits on a control taken off the page |
| Cmd+K then an editor action | the keyboard went back to the editor | unchanged (see the deviation below) |

What the look should show on TEST: a pane of two tabs, Close pane, Confirm, reload: the pane is gone; Escape and Cancel on that Confirm leave the pane and its tabs, the keyboard on the pane menu's opener with no tooltip; Cmd+K then Deposit: Deposit shown and active, the keyboard on its head; Cmd+K then Escape: the keyboard where it was; a pane of one tab closes at once.

## Anything in the brief that was wrong or impossible

1. **Item 6 as written moves the keyboard off the editor for an editor action, which the brief's own ruling Z117 does not ask for.** `openPaletteItem` returns the source tab's instance for an `editor` item (`palette-open.ts:24-30`, `return instance;`), so "when it is not empty" is true for Add Line Comment, Fold All and the other Cmd+K chords of the editor, and the keyboard would land on the tab head instead of returning to the editor the reader was typing in. Z117 (a) speaks of "a tab chosen in the palette". `choose` therefore calls `landOn(id)` only when `item.kind !== 'editor'`; for an editor action the dialog's give-back returns the keyboard to the editor as before. Reversible by removing `&& item.kind !== 'editor'` (`Palette.svelte:168`). Not seen in a browser.
2. **The palette's `:tab <view>` command still goes through the plain give-back.** `run` (`Palette.svelte`, the branch `command.name === 'tab'`) calls `openView(argument)` and the brief leaves `run` unchanged, so the tab it opens is shown but the keyboard goes back to the control the reader was on, and that control's pane becomes the active one again. By reading only, not reproduced. It is the same shape as Z117's question for a different palette path; it is a decision for the orchestrator (extend the landing to `run`'s `tab` and `goto` branches, or leave them), not something the brief lets me change.
3. **Order of the give-back and the landing, argued and not run in a browser.** `choose` calls `onclose()`, then `openPaletteItem`, then `await tick()` in `landOn`. The dialog's cleanup runs in the flush `tick()` ends with and queues the give-back microtask before `landOn` continues, so the give-back runs first and focuses the old control (its pane's focus handler runs now outside any teardown), and `landOn` then focuses the chosen head, whose pane's handler makes the chosen tab the page's active one. If the chosen head is not yet drawn after one `tick()`, `querySelector` finds nothing and the give-back stands, which is the brief's stated fallback. Whether one `tick()` is enough for a tab that `openView` just created is the point for case 19 at the look.
4. **The record's case 2 asserted `activeInstance(id)?.id === 'c'` after the give-back.** That is the behaviour Z117 (a) replaces (the old control's pane becoming the page's active one again), and the brief's case 2 asks only for `"active":"a"` in the tree and in the saved layout. The test asserts exactly that, plus that the opener was focused once.
5. **Collection count on this base is 369, not the diagnosis record's 370.** The record counted on an earlier base; case 6 is worded relative to the base and holds (369 to 370, the extra file the client file).

## Files changed

| File | Lines |
|---|---|
| `src/lib/ui/frame/quiet-focus.ts` | 65 |
| `src/lib/ui/frame/Modal.svelte` | changed lines 14 to 21, 26, 69 to 71 |
| `src/lib/ui/tabs/Tabs.svelte` | import and `recoverStop` |
| `src/lib/shell/rail/ActivityRail.svelte` | import and `recoverStop` |
| `src/lib/shell/status/NoticeCentre.svelte` | import and the `left` handler |
| `src/lib/shell/keys/Palette.svelte` | head comment, imports, `choose` and `landOn` (lines 160 to 181) |
| `vite.config.ts` | 67 |
| `tests/ui/frame/client-runtime.ts` | 15 (new) |
| `tests/ui/frame/give-back.svelte.ts` | 29 (new) |
| `tests/ui/frame/give-back.client.test.ts` | 212 (new) |
| `README.md` line 15, `DESIGN.md` lines 218 and 402, `HELP.md` lines 90 and 296 | one line each |
| `docs/diagrams/*` | regenerated by `npm run diagrams` before the list; whether the output differs from the committed files is not checked (no git command is allowed) |

`tests/ui/frame` holds 4 files now (`ls tests/ui/frame | wc -l`).

## Decisions the brief did not cover (each reversible)

1. The stand-in `Control` in the test sets `page.activeElement` to itself when focused, which cases 14 (the second dialog finds the focus held) and 1 to 3 need to model a focus that lands.
2. `drawDialog` takes an optional second argument `onopen`, run from the dialog's effect body, which is how case 11's second dialog takes the focus in the same flush as a Modal's `onopen` does.
3. `landOn` is a separate async function called as `void landOn(id)` from `choose`, so `choose` stays synchronous for `onSelect`.
4. `DESIGN.md:402` also says the tab strip, the rail and the notification centre use `focusIsFree`, so the one rule is named where the give-back is.
5. `giveBackQuietly` tests `focusIsFree()` and the control inside the microtask, in that order, as one condition.

## Limitations

- The test stands in for Modal's cleanup; it would pass with `Modal.svelte` unchanged. Modal's cleanup is checked by reading (`Modal.svelte:71`).
- `document` and `HTMLElement` are stubs; bits-ui's focus scope is not reached. The test file's head says so.
- The landing in `Palette.svelte` has no test (it needs a DOM); it is seen at the look.
