# Step Q106 refuter report (on /Users/axelfaes/workspace/research-hub/.agents/worktrees/Q106, base 5322b56f)

This report cites pages (the rules file, a standard, a skill's text) by their section, never by line number. A finding in code keeps its `file:line`. Every command ran from `tools/oculus` in the worktree with `PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH`, in the foreground. Mutations and probes ran on a scratch copy under `$TMPDIR/q106rev.DKgnc1`, which is now deleted (`ls -d $TMPDIR/q106rev.*` prints "no matches found"). `git status --short` in the worktree prints the same 20 paths before and after the review.

## Verification (rerun by the reviewer)

```
$ npm run diagrams
(shasum of docs/diagrams/* before and after the run: no difference; "diagrams unchanged by the rerun")

$ sh ~/.claude/skills/land/templates/checks.sh /Users/axelfaes/workspace/research-hub/tools/oculus/.scratch/migration/orchestrator-state.md   (exit 0)
$ npm test
 Test Files  351 passed | 19 skipped (370)
      Tests  5358 passed | 559 skipped (5917)
$ npm run test:checks
 Test Files  27 passed | 2 skipped (29)
      Tests  365 passed | 9 skipped (374)
$ npm run check
1790803938854 COMPLETED 2478 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
$ npm run build
ok built in 3.84s
ok built in 9.89s
$ npm run format:check
All matched files use Prettier code style!
$ npm run lint
$ ! LC_ALL=C grep -rna '[^ -~]' src tests
checks: 7 commands passed

Verify 2: npx vitest run tests/ui/frame/give-back.client.test.ts --reporter=verbose
 11 rows, each "ok |client| tests/ui/frame/give-back.client.test.ts > ..."
 Test Files  1 passed (1)
      Tests  11 passed (11)

Verify 3 (cases 6 and 7), after (worktree) / base (scratch copy with the step's diff reversed by `patch -R` and the three new files removed):
 npx vitest list --filesOnly --exclude 'tests/checks/**'   after 370 (369 [unit], 1 [client]: tests/ui/frame/give-back.client.test.ts), 0 under tests/checks; base 369, 0 under tests/checks
 diff of the sorted lists (project tags stripped): "282a283 > tests/ui/frame/give-back.client.test.ts"
 npx vitest list --filesOnly tests/checks                   after 29; base 29
 npx vitest list --filesOnly --tagsFilter slow              after 399; base 398

The spec's ASCII gate (perl form) over src tests config and vite.config.ts: no output, exit 0. `LC_ALL=C grep -n '[^ -~]' README.md HELP.md DESIGN.md | wc -l`: 0. `bash utils/folder-check.sh`: exit 0. `ls tests/ui/frame | wc -l`: 4.

Commands the report quotes as evidence, rerun:
 npx vitest run tests/ui/primitives.test.ts tests/shell/rail tests/shell/keys tests/ui/tabs tests/ui/frame tests/shell/status --reporter=dot
   Test Files  13 passed (13) / Tests  253 passed (253)   (the report: the same)
 npx vitest run tests/ui/frame/give-back.client.test.ts --tagsFilter slow
   Test Files  1 skipped (1) / Tests  11 skipped (11)       (the report: the same)
 Case 8 probe (scratch, a slow-tagged tests/ui/frame/zz-probe.client.test.ts):
   with npm test's flags: Test Files  1 skipped (1) / Tests  1 skipped (1); with --tagsFilter slow: "ok |client| tests/ui/frame/zz-probe.client.test.ts > probe", Test Files  1 passed (1)   (the report: the same)
 Case 18 probe (scratch, tests/checks/zz-probe.client.test.ts asserting typeof document is 'undefined'):
   list with npm test's flags: 0 hits; run with npm test's flags: "No test files found, exiting with code 1"
   with test:checks's flags: "ok |client| tests/checks/zz-probe.client.test.ts > probe", Test Files  1 passed (1); `vitest list --filesOnly tests/checks` shows "[client] tests/checks/zz-probe.client.test.ts"   (the report: the same)
 First run on the unchanged tree (scratch, giveBackQuietly given Modal's synchronous body; focusIsFree kept, so case 16 passes here where the report's run had no focusIsFree and gave a TypeError):
   Tests  6 failed | 5 passed (11); failing: cases 1, 2, 4, 5, 11, 14; messages
   "expected '{"kind":"split",...' not to contain '"b"'", "... to contain '"active":"a"'", and four "expected 1 to be +0"
   (the report: 7 failed | 4 passed, the seventh being case 16's "focusIsFree is not a function"; consistent)
```

Mutations on the scratch copy (each restored before the next; `cmp` printed "restored"):

```
M1 giveBackQuietly synchronous (the base body)          6 failed: cases 1, 2, 4, 5, 11, 14
M2 deferred, without the focusIsFree() test             3 failed: cases 4, 11, 14
M3 focusIsFree without the disconnected case            2 failed: cases 12, 16
M4 give-back without control.isConnected                1 failed: case 5
M5 the three callers' give-back removed (Tabs `return;`, ActivityRail and NoticeCentre bodies voided), the report's 13-file run:
   Test Files  13 passed (13) / Tests  253 passed (253)
```

Probes on the scratch copy, deleted after:

```
Order probe (client runtime): drawDialog(opener), then answer() that starts `(async () => { await tick(); head.focus(); })()`:
   Received: "focus opener | landOn resumes | focus head"
Case 2 with `expect(client.layout.activeInstance(id)?.id)` added (the palette's shape with no landing, which is what `run` does):
   Received: "c"   (the reader's old pane's tab, not the chosen "a")
```

## Verdicts

Items of the brief's "What to build":

- 1: holds. `quiet-focus.ts:29-32` `focusIsFree()` (null, body or disconnected); `quiet-focus.ts:43-49` `giveBackQuietly` queues a microtask and focuses with `focusQuietly` only when `focusIsFree()` and the control is a connected `HTMLElement`; its doc comment gives the reason. Modal's cleanup, checked by reading as the brief says: `Modal.svelte:71` `$effect(() => () => giveBackQuietly(came));`, import at `:26` `focusFirstQuietly, giveBackQuietly` (`grep -n focusQuietly src/lib/ui/frame/Modal.svelte` finds only the comment's `focusFirstQuietly`), head comment `:16-21` says "once the ground is gone and only where nothing holds it". M1 to M4 show the tests fail when each part of the fix is taken out.
- 2: holds. `vite.config.ts` drops the root `environment` and `include` and adds `projects` `unit` (negated include) and `client` (browser conditions, `./tests/ui/frame/client-runtime.ts`, `server.deps.inline [/svelte/]`), with `tags`, `expect` and `maxWorkers` kept at the root; the counts above show the unit list is unchanged and the new file runs only in `client`.
- 3: holds. The three files exist; the test's head (`give-back.client.test.ts:12-14`) names what it does not cover (Modal not mounted, stub `document` and `HTMLElement`, bits-ui's focus scope not reached); 11 cases pass, each `|client|`.
- 4: violated in one clause. README.md:15, HELP.md:296, HELP.md:90 and DESIGN.md:402 are rewritten as asked, but DESIGN.md:218 and :402 now say "a tab chosen in the palette takes the keyboard on its tab head", which is false for the `:tab <view>` and `:goto <project>` commands (Spec 1).
- 5: holds. `Tabs.svelte:157` `if (!focusIsFree()) return;` and `ActivityRail.svelte:229` `if (focusIsFree()) focusStop(id);` are the old conditions exactly (the negation of the old Tabs test is the same predicate); `NoticeCentre.svelte:44` `if (held.isConnected && focusIsFree()) held.focus();` keeps `held.isConnected` and adds the disconnected case, as the item asks. The comments keep their reasons.
- 6: holds for results chosen through `choose`, with a departure from the item's letter: `Palette.svelte:171` lands only `if (id !== '' && item.kind !== 'editor')`, where the item says "when it is not empty". I judge the departure correct under Z117 (Spec 2). The doc comment of `choose` states the order of the two focus moves wrongly (Standards 1).

Cases of the brief's "Cases":

- 1: met. Test "leaves a pane closed from its own menu closed..." passes; fails with the synchronous body (M1, "not to contain '"b"'").
- 2: met. Passes; fails under M1 ("to contain '"active":"a"'").
- 3: met. Passes on both bodies, as a preserved behaviour should.
- 4: met. Passes; fails under M1 and M2.
- 5: met. Passes; fails under M1 and M4.
- 6: met. 369 before, 370 after, the extra file in `client` only, 0 under `tests/checks`.
- 7: met. `tests/checks` 29 and 29, `npm run test:checks` 27 passed and 2 skipped; slow list 398 then 399; the new file is skipped under `--tagsFilter slow`.
- 8: met. Scratch probe above.
- 9: met, by reading. `Bell.svelte:60` and `menu-items.ts:132` still call `focusQuietly` directly and the diff does not touch either file.
- 10: not verifiable here. It is the orchestrator's look on TEST; a read and a rerun cannot settle it.
- 11: met. Passes; fails under M1 and M2.
- 12: met. Passes; fails under M3.
- 13: met. Passes. It passes on the synchronous body as well; with the null test removed, `held.isConnected` on null would throw in the microtask.
- 14: met. Passes; fails under M1 and M2.
- 15: met. Passes, and `page.body.focused` is 1 with no error.
- 16: met. Passes; fails under M3.
- 17: met, by reading only (Proof 1). Tabs and ActivityRail keep their predicate exactly. NoticeCentre now also takes the focus back when the focus is on a control taken off the page.
- 18: met. Scratch probe above.
- 19: partial. For a result chosen through `choose`, by reading and the order probe: the give-back runs first, then `landOn` focuses the chosen head quietly, and the new pane's `entered` makes that tab the page's active one. What is missing: the palette's `:tab <view>` and `:goto <project>` commands go through `run`, which does not land on the tab (Spec 1).

## 1. Spec

- `src/lib/shell/keys/Palette.svelte:216-225` (`run`), unchanged:
  ```
  } else if (command.name === 'tab') {
      if (knownViews.some((view) => view.id === argument)) openView(argument);
  } else if (command.name === 'goto') {
      ...
          openView('project', { id: project.id, label: project.short ?? project.title });
  ```
  - What is wrong: Z117 (a) says "a tab chosen in the palette becomes the page's active tab and takes the keyboard, on its tab head, quietly". It keeps "the focus goes back where it was" only for "a dialog closed without moving the reader (Escape, Cancel, a palette command that opens nothing)". `:tab` and `:goto` open or activate a tab, so under Z117 they belong with the tab that takes the keyboard. The brief's item 6 says "`goLine`, `chooseLanguage` and `run` are unchanged", so the builder followed the brief. The brief's item list contradicts the ruling it carries, and the builder's report names this gap (its "wrong or impossible" 2).
  - DESIGN.md:218 and :402, as rewritten, state the palette exception with no limit, so they are false for these two commands.
  - Failure scenario: Projects is open in the right pane (not its active tab) and the keyboard is in the left pane. The reader types `:tab projects` and Enter. `openView` finds the existing instance and activates it in the right pane (`opening.ts:113-130`; `focusedPane` is the maximised pane, so it is normally null and `findView` searches the whole page). The give-back then focuses the left-pane control, whose `entered` runs `activateInstance` for the left pane's tab. Projects is shown, but the page's active tab is the left one, and the keyboard is in the left pane. The probe above reproduces this shape: `activeInstance(id)?.id` is "c", not the chosen "a". Palette editor items and go-to-line then act on the wrong tab.
  - The fix is small and inside Z117: in `run`, keep the id `openView` returns in the `tab` and `goto` branches and call `landOn(id)` after `onclose()`. It can be done at landing.
  - Verdict: case 19 partial, item 4 violated (the DESIGN.md sentences).

- `src/lib/shell/keys/Palette.svelte:171`: `if (id !== '' && item.kind !== 'editor') void landOn(id);`
  - What is there: the item's text lands whenever the returned id is not empty, and for an `editor` item `openPaletteItem` returns the source tab's instance (`palette-open.ts:22-27`). The builder narrows the landing and reports this as a deviation.
  - My judgment: the narrowing is what Z117 asks and the item's letter is not. An editor action runs on the tab already on screen (`acting = editorOnScreen(activeInstance(), ...)`, `Palette.svelte:94`), moves the reader nowhere and opens nothing, which is Z117's case for "the focus goes back where it was". Landing on the tab head would take the keyboard out of the editor after Add Line Comment or Fold All.
  - Failure scenario, with the ledger left as it is: the brief says "when it is not empty". A look run against case 19, or a later step that "restores" the brief's text, would move the keyboard to the tab head after an Editor action, so the reader's next keystroke goes to the tab strip and not into the file.
  - The orchestrator should record the correction to item 6 in the ledger (the brief and `choices.md` next to Z117). The diff should not change.
  - Verdict: none; item 6 holds.

## 2. Proof

- The report's DONE row for case 17: "the four affected suites above pass unchanged".
  - What is wrong: the quoted run (`... tests/ui/tabs tests/shell/rail tests/shell/status ...`, 13 files, 253 tests) does not reach the three give-backs. With all three removed (M5: Tabs `return;`, ActivityRail and NoticeCentre bodies voided), the same run prints "Test Files 13 passed (13) / Tests 253 passed (253)".
  - The case is settled by reading, since Tabs and ActivityRail keep their predicate exactly and `focusIsFree` itself is covered by the client test (M3 fails cases 12 and 16).
  - The decision that rests on it: whether case 17 has test evidence. It has none; the evidence is the reading above.
  - Failure scenario: a later change that drops `focusIsFree()` from a caller, or inverts it (Tabs' `if (!focusIsFree()) return;` turned into `if (focusIsFree()) return;`), passes every suite. A reader of this report's evidence would believe the tab strip's recovery is tested.
  - Verdict: none; case 17 is met by reading.

## 3. Standards

- `src/lib/shell/keys/Palette.svelte:161-167`, the doc comment of `choose`: "the pane's focus handler then makes it the page's active tab, and the dialog's give-back, which finds the keyboard held, leaves it there."
  - What is wrong: the order it states is false. The order probe prints "focus opener | landOn resumes | focus head". Svelte 5.57.1's `tick()` (not in async mode) is `await Promise.resolve(); flushSync();`. The flush that tears the palette's Modal down runs first and queues the give-back microtask, and `landOn` resumes only after that microtask. So the give-back finds the keyboard free, focuses the old control, and runs that pane's `entered`, which activates the old pane's tab and saves the layout. Only then does `landOn` move the keyboard to the chosen head. The builder's report, "wrong or impossible" 3, states the true order, which contradicts this comment.
  - The rule broken: the rules file ("What every package obeys": "A sentence in a document or a head comment that the change makes false is a defect of the change"; comments say what the code does).
  - Failure scenario: a maintainer reads the comment as saying the give-back never runs after a palette result. They are then surprised by the extra `activateInstance` and layout save for the old pane on every palette choice. They could also conclude that a result whose head is not found leaves the chosen tab active, when the old pane becomes the page's active one again.
  - Suggested wording: the give-back runs first and hands the keyboard to the control the reader was on, and the landing then moves it to the chosen tab's head.
  - Verdict: item 6's "The function's doc comment says what it does and why" holds only partly. The finding stays under this heading, and item 6's verdict is holds, since the code does what the item asks.

## 4. Behaviour

- `src/lib/shell/keys/Palette.svelte:168-181` with `src/lib/ui/frame/quiet-focus.ts:43-49`: each result chosen in the palette now focuses two controls in turn, both in microtasks before the next paint: the control the reader was on (its pane's `entered` runs `touchPane` and possibly `activateInstance`, with a layout save), then the chosen tab's head (whose pane's `entered` activates the chosen tab, with a second save).
  - What is wrong: the report's "User-visible changes" table states the end result ("takes the keyboard on its tab head ... becomes the page's active tab through its pane's focus handler"). The intermediate focus and the extra save are stated only in "wrong or impossible" 3, not in the before and after the look is read against.
  - Nothing shows on screen, since both happen before a paint. But a host that watches focus or the saved layout (the second browser tab of Z115 (a), which takes each saved arrangement at once) sees two writes per palette choice.
  - Failure scenario: with oculus open in two browser tabs, after Z115 (a) lands, each palette choice in one tab sends two arrangement changes to the other, the first of them with the old pane active. That is a transient state for the other tab, not visible if both arrive before its paint. It is not verified here.
  - Verdict: none.

## Declined to judge

- Case 10 and the look part of case 19 (Close pane then Confirm staying closed after a reload; Escape and Cancel; Cmd+K then a tab of another pane; a new tab's head existing after one `tick()`): these are the orchestrator's look on TEST. The client runtime has no DOM, so whether `document.querySelector` finds the chosen head after one `tick()` cannot be settled by a read and a rerun.
- Whether a Z115 (a) listener in a second browser tab makes the double write of Behaviour 1 visible: Z115's fix is in Q107, not on this tree.
- bits-ui's focus scope during the palette's close, and the menu's teardown path (the brief's decision 3): not reproduced by the brief or the diagnosis, and it needs a real DOM.
- Whether HELP.md:90's "the keyboard goes to the tab it opens" should also say that an Editor result leaves the keyboard in the editor: the sentence is not false (an Editor result opens no tab), and how much the help page says is the orchestrator's call.

Reviewer usage: about 45 tool uses. Tokens and minutes are as the runner's completion notice gives them; they are not known to the agent.

Usage: reviewer a441a918298825101, served claude-opus-5-5; 209,569 tokens, 59 tool uses, 17.0 min (from its completion notice)
