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

## Repair round 1, refuted

Reviewer: a fresh agent. Worktree `/Users/axelfaes/workspace/research-hub/.agents/worktrees/Q106`, base `5322b56f`. Every command ran from `tools/oculus` in the worktree with `PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH`, in the foreground.

Disclosure about my scratch files. I wrote only inside the session scratchpad `/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad`, and I found afterwards that the orchestrator shares that folder. Two things follow:
- `checks.log` there now holds my verify run. If the orchestrator had a file of that name, my run overwrote it.
- I created `base/` with `mkdir -p` for the base collection counts and then removed it with `rm -rf`. If a folder named `base` was already there, it is gone.

I cannot tell whether either name existed before my run. A grep of the ledger for either path found nothing. Nothing in the worktree, the main checkout or the ledger was written: `git status --short` prints the same 20 paths before and after, and `git diff 5322b56f | shasum` prints f1778e2b5b078bee2ee752079adc76359110a14f both times.

```
$ git diff 5322b56f | shasum
f1778e2b5b078bee2ee752079adc76359110a14f  -        (the hash the round was reported at)

$ npm run diagrams          exit 0; shasum of docs/diagrams/* before and after: no difference ("diagrams unchanged by the rerun")

$ sh ~/.claude/skills/land/templates/checks.sh /Users/axelfaes/workspace/research-hub/tools/oculus/.scratch/migration/orchestrator-state.md   (exit 0)
$ npm test
 Test Files  351 passed | 19 skipped (370)
      Tests  5358 passed | 559 skipped (5917)
$ npm run test:checks
 Test Files  27 passed | 2 skipped (29)
      Tests  365 passed | 9 skipped (374)
$ npm run check
1790805765992 COMPLETED 2478 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
$ npm run build
ok built in 4.99s          (the tool prints a check glyph where this says "ok")
ok built in 10.46s
$ npm run format:check
All matched files use Prettier code style!
$ npm run lint
$ ! LC_ALL=C grep -rna '[^ -~]' src tests
checks: 7 commands passed

Verify 2: npx vitest run tests/ui/frame/give-back.client.test.ts --reporter=verbose
 11 rows, each "|client| tests/ui/frame/give-back.client.test.ts > ..." (cases 1-5, 11-16)
 Test Files  1 passed (1)
      Tests  11 passed (11)

Verify 3, cases 6 and 7. "After" is the worktree. "Base" is a scratch copy with vite.config.ts reversed by `patch -R` and the three new test files removed; the copy is now deleted.
 npx vitest list --filesOnly --exclude 'tests/checks/**'   after 370 (369 [unit], 1 "[client] tests/ui/frame/give-back.client.test.ts"), 0 under tests/checks; base 369
 npx vitest list --filesOnly tests/checks                   after 29; base 29
 npx vitest list --filesOnly --tagsFilter slow              after 399; base 398
 npx vitest run tests/ui/frame/give-back.client.test.ts --tagsFilter slow
   Test Files  1 skipped (1) / Tests  11 skipped (11)

Commands the round's report quotes, rerun:
 grep -n "landOn" src/lib/shell/keys/Palette.svelte     165 (comment), 172 (choose), 176 (definition), 233 (run)   (the report: choose and run; same)
 npx eslint src/lib/shell/keys/Palette.svelte             no output, exit 0   (the report: same)
 npx prettier --check src/lib/shell/keys/Palette.svelte DESIGN.md   All matched files use Prettier code style!   (the report ran --write and got "(unchanged)"; --check agrees)
 grep -n 'an editor action leaves the keyboard in its editor' DESIGN.md   lines 218 and 402   (the report: same)
 LC_ALL=C grep -c '[^ -~]' DESIGN.md src/lib/shell/keys/Palette.svelte   0 and 0   (the report: same)
 grep -rn "giveBackQuietly\|focusQuietly(" src   Modal.svelte:21,26,70,71; menu-items.ts:132; Bell.svelte:60; Palette.svelte:181
   (the report's item 1 row says Palette.svelte:180; the round's longer doc comment moved it to 181; no decision rests on this line number)
```

The round's delta. No snapshot of the tree was kept when the round was sent, so I identified the delta from the files' modification times (`stat -f '%Sm %N'` over every changed path) and from reading the six rulings against the whole diff:
- Written after the round was sent at 23:44: `DESIGN.md` and `src/lib/shell/keys/Palette.svelte` (both 23:45:20), `docs/diagrams/*` (23:45:55, rewritten by the verify run's `npm run diagrams`), and the report (23:52:01).
- Every other path dates from 23:03 to 23:18, so `quiet-focus.ts`, `Modal.svelte`, the three callers, `vite.config.ts`, the tests, `README.md` and `HELP.md` are untouched by the round.
- In the whole diff, `DESIGN.md` differs from the base only at lines 218 and 402.
- The diagrams' import counts (shell/keys to ui 3 to 4, from Palette's `quiet-focus` import) match imports already present in round 0, as the first refuter's quote of `landOn` using `focusQuietly` shows. My rerun of `npm run diagrams` leaves them byte for byte the same.

The builder's account ("Palette.svelte, DESIGN.md lines 218 and 402, and this report") matches what I found.

### Closure of the six rulings and the first report's findings

- Ruling 1 and Spec 1 (`:tab` and `:goto` do not land): closed.
  - `Palette.svelte:202` `let shown = '';`, `:220` `shown = openView(argument)`, `:224` `shown = openView('project', {...})`, then `:232` `onclose();` and `:233` `if (shown !== '') void landOn(shown);`.
  - `theme`, `crt` and `update` are unchanged, and `language` still returns early.
  - `openView` returns `string` (`opening.ts:31`), and `''` when no page is held (`opening.ts:108`).
  - Nothing beyond the ruling was changed.
- Ruling 2 and Standards 1 (the order in `choose`'s comment): closed for the order. `Palette.svelte:161-168` now says the give-back runs first, then `landOn` moves the keyboard to the chosen head, and that the same holds for `run`'s two branches. This matches the first refuter's order probe ("focus opener | landOn resumes | focus head"). The comment's last sentence, which the ruling worded, is inaccurate: see the Findings below.
- Ruling 3 and Behaviour 1: closed. The report's "User-visible changes" gains the row "Any palette choice that shows a tab (a result, `:tab`, `:goto`)", with the before and after in the ruling's words and one added clause saying where the base's focus handler ran.
- Ruling 4 (DESIGN.md): closed.
  - `DESIGN.md:218` and `:402` now name "by a result or by the `:tab` and `:goto` commands" and "while an editor action leaves the keyboard in its editor".
  - `HELP.md:90` is unchanged by the round (mtime 23:07).
  - By reading, both sentences are true: editor actions are listed only while the source tab is editing (`Source.svelte:199`), and performing one focuses the editor (`commands.ts:35`, `DiffEditor.svelte:304`).
- Ruling 5 and Proof 1 (case 17): closed.
  - The report's case 17 row now reads "met by reading ... The four affected suites (13 files, 253 tests) pass but do not reach the three give-backs; `focusIsFree` itself is tested by cases 12 and 16. No test drives the three callers".
  - The item 5 row reads "by reading", with no run quoted as evidence.
  - No check was removed.
- Ruling 6 (the `editor` narrowing in `choose`): stands as ruled. `Palette.svelte:172` is unchanged.
- The first report's Spec 2 (item 6's narrowing recorded in the ledger): not a builder finding. The brief's item 6 now reads "An editor action shows no tab and does not land: the keyboard stays in its editor", so the brief records it.

### Verdicts

Items of the brief's "What to build", over the whole diff since the base:

- 1: holds.
  - `quiet-focus.ts:29-32` holds `focusIsFree()`, true for null, the body or a disconnected element.
  - `quiet-focus.ts:43-49` holds `giveBackQuietly`, which queues a microtask that calls `focusQuietly` only when `focusIsFree()` holds and the control is a connected `HTMLElement`. Its doc comment gives the reason.
  - Modal, checked by reading as the brief says: the cleanup is `Modal.svelte:71` `$effect(() => () => giveBackQuietly(came));`, the import at `:26` is `focusFirstQuietly, giveBackQuietly`, and the head comment at `:16-21` says "once the ground is gone and only where nothing holds it".
  - This code is unchanged since the first refuter's mutations M1 to M4, which showed each part is needed.
- 2: holds. `vite.config.ts` has the `unit` project (a negated include) and the `client` project (browser conditions, `./tests/ui/frame/client-runtime.ts`, `server.deps.inline [/svelte/]`), with `tags`, `expect` and `maxWorkers` kept at the root. The counts are above.
- 3: holds. The three files are there. The test's head (`give-back.client.test.ts:12-14`) names what it does not cover. 11 cases pass in `|client|`.
- 4: holds. `README.md:15`, `HELP.md:296`, `HELP.md:90`, `DESIGN.md:218` and `DESIGN.md:402` say what the code does, including `:tab`, `:goto` and editor actions (ruling 4).
- 5: holds. `Tabs.svelte:157` `if (!focusIsFree()) return;`, `ActivityRail.svelte:229` `if (focusIsFree()) focusStop(id);`, `NoticeCentre.svelte:44` `if (held.isConnected && focusIsFree()) held.focus();`. Their comments keep their reasons.
- 6: holds.
  - `choose` lands for every non-editor result (`Palette.svelte:172`, the narrowing ruled in round 1's ruling 6 and in the brief's item text).
  - `run`'s `tab` and `goto` land (`:233`).
  - `landOn` (`:176-182`) waits for `tick()` and focuses the selected head of `[data-pane-active=id]`: the attribute is set at `PaneView.svelte:417`, and `role="tab"` and `aria-selected` at `TabFace.svelte:87-88`.
  - No pane found gives nothing.
  - The doc comment's order is now right. Its last sentence is the Standards finding below, which leaves the item's code as asked.

Cases of the brief's "Cases":

- 1 to 5: met. Each test passes (verify 2). The failing first run on the unchanged tree is in the report's table and was reproduced by the first refuter (M1). The round changed neither the tests nor `quiet-focus.ts` (mtimes 23:05 and 23:18).
- 6: met. 369 before and 370 after; the added file is in `client` only, and none is under `tests/checks`.
- 7: met. `tests/checks` has 29 files before and after, and `npm run test:checks` gives 27 passed and 2 skipped. The slow list goes from 398 to 399, and the new file is skipped under `--tagsFilter slow`.
- 8: met. By reading: the `tags` filter sits at the root of `vite.config.ts` and applies to both projects. The first refuter's probe reproduced it; not rerun here.
- 9: met, by reading. `Bell.svelte:60` and `menu-items.ts:132` still call `focusQuietly`, and the diff does not touch either file.
- 10: not verifiable here. It is the orchestrator's look on TEST.
- 11 to 16: met. Each test passes. The failing-first evidence is as for cases 1 to 5, and the code under test is unchanged by the round.
- 17: met, by reading. Tabs and ActivityRail keep their predicate exactly, and NoticeCentre adds the disconnected case. The report now says so (ruling 5).
- 18: met. The first refuter's probe; not rerun here, and neither `vite.config.ts` nor `package.json` changed in the round.
- 19: met by reading, for choices through `choose`, `:tab` and `:goto`. The give-back runs first, then `landOn` focuses the chosen head quietly, and that pane's `entered` (`PaneView.svelte:139-142`) activates it. Whether one `tick()` is enough for a new tab's head to be drawn is left to the look.

### Findings

- Standards. `src/lib/shell/keys/Palette.svelte:167-168`, `choose`'s doc comment: "An editor action shows no tab, and the keyboard stays where the give-back puts it." The report's "User-visible changes" row "Cmd+K then an editor action" says the same ("the keyboard stays where the give-back puts it").
  - What is wrong: the sentence says the give-back places the keyboard after an editor action. By reading, the editor places it and the give-back then gives nothing.
    - Editor actions are listed only while the tab is editing (`Source.svelte:199` `actions: editing ? actions : []`).
    - `openPaletteItem` asks the tab to run the action (`palette-open.ts:26`), in the same handler as `onclose()`.
    - The tab performs the ask from an effect in the same flush (`Source.svelte:260-279` to `editor?.perform(ask)`, and `Diff.svelte:323`). Performing it focuses the editor: `commands.ts:35` `made.focus();` and `DiffEditor.svelte:304` `side.focus();`.
    - So at the give-back's microtask `focusIsFree()` is false and `giveBackQuietly` gives nothing. The keyboard is in the editor because the editor took it, wherever the reader was when Cmd+K was pressed.
    - `DESIGN.md:218` and `:402` state the end state correctly ("an editor action leaves the keyboard in its editor"). The comment's mechanism contradicts it.
  - The wording comes from round ruling 2 ("an editor action shows no tab and the keyboard stays where the give-back puts it"), so the builder followed the ruling. The rule broken is the rules file's "What every package obeys": a comment says what the code does, and a sentence in a head or doc comment that the change makes false is a defect.
  - Failure scenario: the reader presses Cmd+K with the keyboard on a tab head or the rail and runs Fold All. A maintainer who trusts the comment expects the keyboard back on the tab head, but it lands in the editor. A maintainer who later stops the editor from focusing itself (`commands.ts:35`), believing the give-back returns the keyboard to the editor, sends it to wherever the palette was opened from.
  - The fix is small and inside the brief, one clause at landing: "an editor action shows no tab; the editor takes the keyboard when it runs the action, and the give-back then finds it held." The report's row changes the same way.
  - Not run in a browser: by reading only.
  - Verdict: none. Item 6 holds.

No other finding over the delta. There is no new test and no changed test in the round: the `run` landing needs a DOM, and spec.md's rule and Z113's scope keep that for the look. No check was loosened or removed, and nothing reaches beyond the six rulings.

### Declined to judge

- Case 10, and the look part of case 19 (one `tick()` enough for a new tab's head, `:tab` and `:goto` landing in the page, Escape and Cancel): these are the orchestrator's look on TEST, since the client runtime has no DOM.
- The report's clause that "the saved arrangement is written for each of the two focus moves" (ruling 3's words). No command shows it. By reading it holds: after `openView`, the old pane's `activePane` (`PaneView.svelte:132`) is false, so its `entered` calls `activateInstance` and saves, and the chosen pane's `entered` does the same. No test runs the real `entered`, because the client test's stand-in handler activates unconditionally.
- Stale line numbers in the report (`Palette.svelte:180` for the `focusQuietly` call, now 181; `Palette.svelte:168` for the `editor` condition, now 172; "lines 160 to 181" for `choose` and `landOn`): not raised, since no decision rests on them.
- The report's open-items quote ("The list holds no entry") was not refreshed by the round. At 23:52 Z120 was open (ruled 23:53). The state file's list now reads "- None.", so the quote matches the state at landing. Not raised.
- The mutations and the case 8 and case 18 probes of the first review were not rerun. The round changed neither `quiet-focus.ts`, `Modal.svelte`, `vite.config.ts` nor any test (modification times above), and the instruction to change nothing kept me from mutating copies.
- The Z113 sentence for `spec.md:56` is the orchestrator's landing commit, not this diff.

Reviewer usage (the runner's completion notice): reviewer ab5a9d2b6860166ba, served claude-opus-5-5, 206,031 tokens, 58 tool uses, 15.9 min.

### Closed

- First run, Spec 1 (`:tab` and `:goto` do not land), Spec 2 (item 6's narrowing to non-editor results), Standards 1 (the order in `choose`'s comment), Proof 1 (case 17's row) and Behaviour 1 (the landing on every palette choice unstated): closed by repair round 1 (`agents/briefs/Q106-round1.md`, rulings 1 to 6), each closure reproduced by the round's refuter above; Spec 2 closed by the brief's item 6 text.
- Round 1, Standards (`Palette.svelte:167-168`, the editor action sentence): fixed at landing, small and inside the brief. The comment's sentence and the report's row "Cmd+K then an editor action" read "an editor action shows no tab; the editor takes the keyboard when it runs the action, and the give-back then finds it held."
