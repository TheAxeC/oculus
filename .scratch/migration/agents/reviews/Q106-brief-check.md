# Step Q106 brief check (on main at 200bfb6b; main moved to 55fe119c during the check, and `git diff --stat 200bfb6b 55fe119c -- tools/oculus ':!tools/oculus/.scratch'` prints nothing, so the code checked is unchanged)

The report of the fresh agent of the `spec` skill's "Steps / The brief check", on `agents/briefs/Q106.md`. `plan.md` has no section headed Goal. The goal used here is the ledger's opening line ("Execution ledger for `tools/oculus/DESIGN.md`"). The part this step delivers is DESIGN.md's modal behaviour (DESIGN.md:218, "the focus goes back where it was") holding without undoing the answer: Close pane stays closed after Confirm, and the palette's choice stays made.

The scratch copy was `$TMPDIR/q106bc.cPclpb/oculus`: an rsync of `tools/oculus` without `node_modules` (symlinked), `.scratch` or `config/local.yml` (loadLocal then uses its defaults, `src/lib/data/sources/config/local.ts:312`). The brief's `vite.config.ts`, the three test files quoted in the diagnosis record, and `giveBackQuietly` were applied there. It was removed afterwards: `ls -d $TMPDIR/q106bc.*` prints "no matches found". `git status --short` on main shows only the three untracked paths that were there at the start.

## 1. Names

- `giveBackQuietly` (new). `grep -rn --exclude=local.yml giveBackQuietly src tests config README.md HELP.md DESIGN.md` prints nothing. There is no hit.
- `focusQuietly` (dropped from Modal's import). `grep -rn --exclude-dir=node_modules --exclude-dir=.scratch --exclude=local.yml -e focusQuietly ...` across the hub. Hits outside the paths:
  - `src/lib/ui/menu/Tooltip.svelte:26-27` and `:140` ("the focus the page gives through `focusQuietly` ... a dialog's"). These stay true, because `giveBackQuietly` calls `focusQuietly`.
  - `src/lib/ui/menu/menu-items.ts:6,132` and `src/lib/shell/status/Bell.svelte:17,60`. The code is unchanged.
  - `DESIGN.md:402`: "when it goes, back to the control it was raised from (`focusQuietly` in `ui/frame/quiet-focus.ts`, which `ui/frame/Modal.svelte` uses for both)". After the change the give-back is conditional, so the sentence states a behaviour the change qualifies, and Modal no longer imports `focusQuietly`. DESIGN.md is not in "Paths this step writes".
- The dialog's give-back as a behaviour, found by `grep -n -o '.\{200\}Modal.svelte.\{200\}' DESIGN.md`:
  - `DESIGN.md:218`: "the focus goes back where it was". The change adds the condition "unless another control took it". This line is not in the paths.
  - `src/lib/ui/frame/Modal.svelte:16-20` (head comment): "When it goes, the keyboard comes back to the control that held it when the ground was drawn, while that control is on the page ... given back ... go through `focusQuietly`". The file is in the paths, but "What to build" does not name this comment, and the deferral and the new condition make it incomplete.
- The construct "give the focus back in a microtask only when nothing holds it". `grep -rn 'queueMicrotask\|activeElement' src` finds it three times already:
  - `src/lib/ui/tabs/Tabs.svelte:155-158`: `if (at !== null && at !== document.body && at.isConnected) return;`, with the comment at :150-152, "the button that went is left holding the focus until the browser hands it to the document, so both that button and the document count as nothing".
  - `src/lib/shell/rail/ActivityRail.svelte:226-231`: `if (at === null || at === document.body || !at.isConnected) focusStop(id);`.
  - `src/lib/shell/status/NoticeCentre.svelte:42-45`: `if (held.isConnected && (at === null || at === document.body)) held.focus();`.
  - The brief's `giveBackQuietly` becomes a fourth copy. Its rule also differs from Tabs and ActivityRail: an `activeElement` that is no longer connected counts as "held", so the give-back is skipped.
- The `vite.config.ts` keys (`environment`, `include`, the new `projects`, `unit`, `client`). `grep -rn "environment: 'node'\|node environment\|vitest" DESIGN.md README.md HELP.md` finds only README.md:15 and HELP.md:296 (both in the paths) and DESIGN.md:350 ("Stack: ... Vitest"), which stays true. `grep -rn vitest utils tests config` finds only `tests/checks/tree/scratch.test.ts:487`, which runs vitest with `--root <its own dir>` and is not affected. It ran green on the scratch copy.
- `*.client.test.ts` and `client-runtime`: no hit anywhere today.
- `agents/spec.md:56`: "The unit suite renders to a string". This becomes false for `*.client.test.ts` files, which `npm test` will run. The fix is the orchestrator's Z113 sentence. See item 3.

Findings:
1. `DESIGN.md:218` and `DESIGN.md:402` are made incomplete or false by the conditional, deferred give-back, and DESIGN.md is not in "Paths this step writes". Item 4's grep would find :402 but not :218, which names no function.
2. `Modal.svelte:16-20`, the head comment that describes the give-back, is not named in "What to build".
3. The give-back rule already exists three times (Tabs.svelte:155-158, ActivityRail.svelte:226-231, NoticeCentre.svelte:42-45). spec.md's "The principles every package is judged on" says a rule "exists once and is reused". The brief neither reuses those copies nor makes them use the new function, and it does not say why.
4. The new rule differs from the tree's existing copies on a disconnected `activeElement`. See section 6, input (c).

## 2. The step line

- "Close pane on a pane of two or more tabs closes it after Confirm": served by item 1 (the fix), with case 10 (the look) as the only check in the product.
- "the cause found with `/diagnose` on a scratch copy": done before the brief. The brief's section "The cause" carries it from `agents/reviews/Q106-diagnosis.md`.
- "the fix": item 1.
- "and a test that presses Confirm on a pane of two tabs": item 3, case 1. The test does not press Confirm and mounts neither Confirm, Modal nor PaneView. It calls `giveBackQuietly` through a stand-in for Modal's cleanup (`give-back.svelte.ts`) and answers with `closePane([1], id)`. Z113 (a) ruled "its test of the focus bug" as the diagnosis wrote it, so this part is served as ruled. The Confirm press itself is in case 10 only.
- "(ruling Z98)": served by items 1 and 3.
- "(ruling Z113)": served by item 2 (the `client` project), item 3 and item 4. The spec.md sentence is covered in section 3, finding 1.

Findings: none. Every part has an item. The test's distance from a real Confirm press is taken up under section 5.

## 3. Premises

- "No ADR touches the step: `ls docs/adr` prints No such file". `ls docs/adr` from the hub root prints "No such file or directory", and so does `ls tools/oculus/docs/adr` (`tools/oculus/docs` holds only `diagrams`). This matches.
- "`Modal.svelte:22` imports `focusFirstQuietly, focusQuietly`". `cat -n src/lib/ui/frame/Modal.svelte` shows line 22 is `import { AlertDialog, Dialog } from 'bits-ui';` and the import is at **line 25**. This differs.
- "lines 68-71 hold the cleanup (`sed -n 64,72p`)". Line 68 is the comment and 69-71 the `$effect`, which matches the quoted block.
- "`quiet-focus.ts` exports ... `focusQuietly` (lines 17-21)". `cat -n` shows the doc comment at 13-17 and the function at **18-22**. This is off by one.
- "`PaneView.svelte:139-142`, `touchPane(page)` then `activateInstance(active, page)`". `sed -n 130,145p` shows line 141 is `if (active !== '' && !activePane) activateInstance(active, page);`. The call is conditional, and the brief leaves the condition out. Case 1's handler calls it unconditionally, which is a superset, so the work is not affected.
- `runtime.js:659-660` and `sources.js:191-197`: `sed` shows `if (is_destroying_effect && old_values.has(signal)) return old_values.get(signal);` at 659-660, and the `internal_set` old-value recording at 191-197. `destroy_effect` (`effects.js:518-542`) removes the DOM (526) before `execute_effect_teardown` (542). This matches.
- "Other callers of `focusQuietly` ... `menu-items.ts:132` (bits-ui's `onCloseAutoFocus`, run from an effect body when a menu closes) and `Bell.svelte:60` (a click handler). **Neither runs inside a teardown**". `node_modules/bits-ui/dist/bits/utilities/focus-scope/focus-scope.svelte.js` (`static use`) registers `onDestroyEffect(() => { scope?.unmount(); })`, and `svelte-toolbelt`'s `onDestroyEffect` is `$effect(() => () => fn())`. `unmount()` calls `#handleCloseAutoFocus`, which calls `onCloseAutoFocus` and so `menu-items.ts:129-133`, so a menu destroyed while open gives its focus back **from a teardown**. The diagnosis record says the same ("For the orchestrator", second bullet: "from `onDestroyEffect`, a teardown, only when a menu is destroyed while open ... not verified"). This premise is false in part.
- `vite.config.ts:30-32`: matches. `package.json:12-14`: matches. vitest 4.1.11, svelte 5.57.1 and bits-ui 2.19.3 are confirmed with `node -e "...require('./node_modules/<pkg>/package.json').version"`.
- `README.md:15` and `HELP.md:296`: `sed -n` shows both lines as the brief says.
- `agents/spec.md:56`, "(the orchestrator adds Z113's sentence)". Rulings carried: "The spec sentence is written by the orchestrator in this step's preparation commit". The state file changed during this check (commit 4c42a6ce, "Book the spec.md sentence of Z113 for Q106's landing"), and Z113's closed entry now reads: "The sentence, added under `spec.md:56` at Q106's landing, when the `client` project exists on main: 'An effect's timing (what runs in a teardown or a flush) is tested in a file named `*.client.test.ts`, which runs in Svelte's client runtime with no DOM (the `client` project of `vite.config.ts`); every other behaviour that needs a DOM stays with the look.'" The brief says preparation commit and the state file says landing. This differs.
- `layout-fixture.ts` exports `bench`, `fakeStorage`, `pane`, `split` (`grep -n '^export'`: lines 23, 28, 42, 87), and `LAYOUT_KEY` is exported at `layout.svelte.ts:65` (`export { LAYOUT_KEY, PREVIOUS_KEY };`). This matches.
- The two vitest 4.1.11 facts in item 2, probed on the scratch copy:
  - (A) The unit project with `exclude: ['tests/**/*.client.test.ts']` in place of the negated include: `vitest list --filesOnly --config vite.a.config.ts --exclude 'tests/checks/**'` printed 398 `[unit]` + 1 `[client]`, 29 of them under `tests/checks`.
  - (B) Root `include` kept: 369 `[unit]` + 370 `[client]`, so the client project took every file.
  - Both facts hold, and the brief's shape avoids both.
- Case 7, "`npm run test:slow` collects the same files as on the base". `npx vitest list --filesOnly --tagsFilter slow` prints 398 on main and 399 on the scratch copy; the tag filter does not narrow the file list. The one added file is the client test, which the filter then skips, as the probe in section 4 shows. As written the claim is false.
- Case 7, "`npm run test:checks` collects the same 29 files". `npx vitest list --filesOnly tests/checks` prints 29 on main and 29 on the scratch copy, and `diff` of the sorted lists is empty. This matches. The split "27 run, 2 skipped" was not rerun (`npm run test:checks` was not run in full): not verified.
- Case 6. `npx vitest list --filesOnly --exclude 'tests/checks/**'` prints **369** on main today (the diagnosis's 370 was at 1c95c890) and 370 on the scratch copy. `diff` shows the only added line is `tests/ui/frame/give-back.client.test.ts`, and it is the only `[client]` row. `grep -c tests/checks` on the scratch copy's list prints 0. This matches. The brief states no number, so nothing in it is wrong.
- Cases 1-5, "Base: fails" for 1, 2, 4 and 5 and "passes" for 3. On the scratch copy with `giveBackQuietly` extracted with Modal's synchronous body, `npx vitest run tests/ui/frame/give-back.client.test.ts --reporter=verbose` gave: case 1 failed (`expected '{"kind":"split"...' not to contain '"b"'`), case 2 failed (`to contain '"active":"a"'`), case 3 passed, cases 4 and 5 failed (`expected 1 to be +0`), and "Tests 4 failed | 1 passed (5)". With the brief's deferred body: "Tests 5 passed (5)", each row `|client|`. This matches.
- On the scratch copy with the change, `npm run check` printed "COMPLETED 2478 FILES 0 ERRORS 0 WARNINGS", `npx eslint` over the five files printed no error, and `npx prettier --check` printed "All matched files use Prettier code style!". Nine tree checks (`comment-width`, `order`, `cycles`, `history`, `audits`, `boundaries`, `size`, `code`, `scratch`) gave "Test Files 9 passed (9)". `git ls-files tests/ui/frame | wc -l` prints 1, so the folder goes to 4 items, under the ten-item limit.

Findings:
1. The spec.md sentence: the brief says the orchestrator writes it "in this step's preparation commit". The state file (4c42a6ce) says it is added at Q106's landing and quotes its text. The builder reads spec.md first, and the brief says "its rules govern this step unchanged". The builder then meets `spec.md:56` ("A behaviour that needs a DOM (a press, a focus, an effect) is seen at the look on landing. The unit suite renders to a string") while the brief asks it for a test of an effect's teardown. The brief should say that Z113 overrides spec.md:56 for this step, and quote the sentence.
2. `Modal.svelte:22` should be `:25`.
3. `focusQuietly` is at lines 18-22, not 17-21.
4. `menu-items.ts:132` does run inside a teardown when a menu is destroyed while open. The premise "Neither runs inside a teardown" is false in part (bits-ui `FocusScope.use`, `onDestroyEffect`).
5. Case 7's "`npm run test:slow` collects the same files as on the base" is false. It collects 398 on the base and 399 after; the new file is collected and skipped by the tag filter.
6. `PaneView.svelte:141`'s call is conditional (`if (active !== '' && !activePane)`), and the brief leaves the condition out.

## 4. Cases and checks

- Case 1 (Close pane shape): consistent with spec.md once the Z113 sentence stands. Until then it is inconsistent with `spec.md:56` as on main. See section 3, finding 1.
- Case 2 (the palette's shape): consistent. It asserts `activeInstance(id)?.id` is `c`, meaning the page's active tab is the one the reader was in, not the one the answer showed. That is the mechanism (both writes land). It also fixes in a test where the keyboard lands after the palette shows a tab of another pane, which is taken up under "Declined to judge".
- Case 3 (answered with nothing): consistent.
- Cases 4 and 5: consistent with spec.md "What every package obeys": "Every asynchronous path is exercised in flight, after close, and superseded by a later one". Cases 4 and 5 exercise the path in flight. "Superseded by a later one" has no case; see section 6.
- Case 6: consistent. Probed: see section 3.
- Case 7: consistent with the rules, but its test:slow half is false. See section 3, finding 5.
- Case 8: consistent. Probed on the scratch copy with a file `tests/ui/frame/probe-slow.client.test.ts` carrying `// @module-tag slow`. `npx vitest run --tagsFilter '!slow' --exclude 'tests/checks/**' tests/ui/frame` showed the probe file skipped (`|client|`) and "Test Files 2 passed | 1 skipped (3)". `--tagsFilter slow` ran it alone: "Test Files 1 passed | 2 skipped (3)". The probe file was then deleted.
- Case 9: consistent, by reading `menu-items.ts:129-133` and `Bell.svelte:57-61`. Neither calls `giveBackQuietly`, but see section 3, finding 4, on the menu's teardown path.
- Case 10: consistent with spec.md "What every package obeys": "looked at on screen before it is booked".
- The test file's head comment does not say what the test does not cover: Modal.svelte itself, bits-ui's focus scope, and a real browser's `activeElement`. That is the convention of 103 test files (`git ls-files tests | xargs grep -l 'What this does NOT cover' | wc -l` prints 103), and the hub's rule is that "a green result states, in the same breath, what it does not cover".

Findings:
1. Case 1 is consistent with the rules file only once the Z113 sentence is in spec.md, and the brief and the state file disagree on when that happens (section 3, finding 1).
2. Case 7 (section 3, finding 5).
3. The test's head comment does not name what it leaves uncovered: Modal is not mounted, `document` and `HTMLElement` are stubs, and bits-ui's focus trap is not reached.

## 5. The question

"The goal" here is that a Confirm or palette answer is not undone by the dialog's give-back, while the give-back keeps working.

- Case 1: **yes**. The test imports `giveBackQuietly` and the stand-in `give-back.svelte.ts`; it never imports `Modal.svelte`. A tree with `giveBackQuietly` added but `Modal.svelte:69-71` still calling `focusQuietly` in its cleanup passes all five cases while Close pane stays broken in the page. Only the diff read and case 10 catch that. A test that mounts Modal would need a DOM library in the client project, which is a new dependency and a user choice.
- Case 2: **yes**, for the same reason as case 1.
- Case 3: **yes**, by design, since it passes on the base. It also cannot fail when a real browser leaves a disconnected `activeElement` at the microtask, because the stub sets `activeElement` to `body` in `beforeEach`. See section 6, input (c).
- Case 4: no, for `giveBackQuietly`. On the scratch copy the variant without the `activeElement` rule gave "Tests 1 failed | 4 passed (5)", the failing case being this one. Yes for the product, as for case 1.
- Case 5: no, for `giveBackQuietly`. It fails on the base, as the base run above shows. Yes for the product, as for case 1.
- Case 6: no. The file is collected in the `client` project only, and verification 2 runs its cases.
- Case 7: no for test:checks. The test:slow half is false as stated.
- Case 8: no. Probed.
- Case 9: no, but it is a read of unchanged code.
- Case 10: no for the pane close and the palette in the product. It does not check that the give-back still happens at all in the page, for example after Escape or Cancel. A regression in which the deferred give-back never fires in Chrome would pass case 10 as written.
- The step line's check, "a test that presses Confirm on a pane of two tabs": **yes**, as for case 1. No test presses Confirm.
- Item 1 (the fix): checked by cases 1-5 and 10. Could pass without the goal only as the case 1 answer says.
- Item 2 (the projects): checked by cases 6-8. No.
- Item 3 (the test): checked by verification 2 ("5 passed, each row `|client|`"). **Yes**, as for case 1.
- Item 4 (docs): checked by the grep. **Yes**: `DESIGN.md:218` ("the focus goes back where it was") holds no grepped name, and DESIGN.md is outside the paths, so the docs item can pass with DESIGN.md left stating the unconditional give-back.

Findings:
1. Cases 1 and 2, verification 2 and the step line's test pass with `Modal.svelte` unchanged. Nothing but the diff read and case 10 checks that Modal calls `giveBackQuietly`. The brief should say so, and should make "Modal's cleanup is `$effect(() => () => giveBackQuietly(came));`" an item the reviewer checks by reading.
2. Case 10 does not look at the give-back itself. It should add: on TEST, Escape (or Cancel) on the pane-close Confirm leaves the pane and its tabs, and the keyboard is back on the pane menu's opener with no tooltip open. The same for the palette's Escape.
3. Item 4 can pass with `DESIGN.md:218` and `:402` stale (section 1, finding 1).

## 6. Implied inputs

This is a code step. For each input, the Cases list either covers it or it is missing, with the expected result:

- (a) A dialog closed by Escape or a press outside (bits-ui calls `asked(false)`, then `onclose`, then the caller removes the Modal). In the stand-in this is the same as case 3, but the brief does not say so, and case 10 has no Escape. **Missing** as stated. Expected: the opener is focused once, after the microtask, with no tooltip. It belongs in case 10 and as a note on case 3.
- (b) Two dialogs in a row, the answer drawing a second dialog in the same flush (a Confirm raised over the tray; the reset asking about each unsaved tab one after another, DESIGN.md:402). **Missing.** Expected: the second dialog's first control holds the focus at the microtask, so the first dialog's give-back is skipped and the opener's focus handler does not run. Case 4 has this shape but does not name it.
- (c) `document.activeElement` is a control taken off the page at the microtask (the removed dialog button). Tabs.svelte:150-152 records that a browser can leave the focus there "until the browser hands it to the document", and the tree's Tabs and ActivityRail rules count it as nothing. **Missing.** Expected, by the tree's rule: counted as nothing, so the focus is given back. The brief's rule (`held !== null && held !== document.body`, then return) gives the opposite result, skipping the give-back. The diagnosis's in-page probe saw `activeElement: body` for Confirm and the palette in Chrome, so this may not occur on those paths. The brief's rule still differs from the tree's for no stated reason.
- (d) A Modal torn down with its whole page or tab (a page closed from the Pages view while a dialog on it is open, or a tab closed while its dialog is drawn in a hidden tab). **Missing** as stated. Expected: when `came` went with the page, nothing is focused (case 5's shape). When `came` is still on the page and the reader's focus is elsewhere, nothing is focused (case 4's shape). When `came` is still on the page and nothing holds the focus, `came` is focused after the flush, with fresh reads.
- (e) The dialog's answer removes the opener. This is covered: case 5 (removed before the microtask) and case 1 (still connected, focused, its handler writing on fresh state).
- (f) Two give-backs queued in one flush (the tray and its Confirm torn down together). **Missing.** Expected: the first whose control is on the page takes the focus, and the other finds the focus held and gives nothing.
- (g) `came` is `document.body` (the dialog opened with nothing focused). **Missing.** Expected: as before, a quiet focus of the body, no error.
- (h) `activeElement` is `null`. **Missing.** Expected: counted as nothing, so the focus is given back (the brief's rule and all three tree copies agree).
- (i) A `*.client.test.ts` file under `tests/checks`. **Missing.** Expected: `npm test` leaves it out (the client project receives `--exclude 'tests/checks/**'`, having no exclude of its own), and `npm run test:checks` runs it in the `client` project.

Findings: inputs (a), (b), (c), (d), (f), (g), (h) and (i) are missing from "Cases", each with the expected result above. Input (c) is also a rule the brief gets wrong against the tree's existing rule.

## 7. ADRs

- No record. The configuration (`.agents/plan.yaml`, project `oculus`) names no `adr` key, so the folder is `docs/adr`. `ls docs/adr` from the hub root and `ls tools/oculus/docs/adr` both print "No such file or directory".

Findings: none.

## Declined to judge

- Where the keyboard should land after the palette shows a tab of another pane. With the fix, the give-back focuses the control in the pane the reader was in, and PaneView's `entered` makes that pane active again. The chosen tab is shown, but it is not the page's active tab, and case 2 asserts exactly that (`activeInstance(id)?.id` is `c`). No ruling covers it, and it is a user-visible choice. VS Code's Quick Open would focus the chosen editor, but that comparison is a reference, not a rule of this plan.
- Whether the menu's teardown path (section 3, finding 4) belongs in this step. It is the same class of defect (a focus handler run inside a teardown), but it was not reproduced. `destroy_effect` removes the DOM before the teardown (`effects.js:526` then `:542`), so a trigger that went with the menu fails `control?.isConnected` and is not focused. Only a trigger outside the destroyed branch would reach the stale read. That is not verified, and deciding the scope is the orchestrator's.
- Whether the three existing copies of the give-back rule (Tabs, ActivityRail, NoticeCentre) should be moved onto the new function within this step, or only the new function made to follow their rule. This is a scope choice for the orchestrator. The finding is under section 1.
- The "27 run, 2 skipped" split of `npm run test:checks`. It was not rerun in full, to keep load off the machine while three builders run: not verified.

Agent usage: claude-opus-5-5, tokens, tool uses and minutes as the runner's completion notice gives them (not known to the agent).

## Closed (the session's change to the brief for every finding above, made before the preparation commit)

- Names: `Modal.svelte`'s import line corrected to :25 and its head comment (lines 14-20) named, with item 1 saying what it says after the change; `focusQuietly` corrected to `quiet-focus.ts:18-22`; PaneView's `entered` quoted with its condition (`active !== '' && !activePane`).
- Premises, DESIGN.md: `DESIGN.md:218` and `:402` added to "What is on the tree", item 4 and the paths.
- Premises, the three give-back copies: `Tabs.svelte:155-158`, `ActivityRail.svelte:226-231` and `NoticeCentre.svelte:42-45` added to "What is on the tree"; item 1 adds `focusIsFree()` with the tree's rule (a disconnected `activeElement` counts as nothing), and item 5 moves the three copies onto it; the three files added to the paths; case 16 (the predicate) and case 17 (the three callers) added.
- Premises, the menu's teardown path: stated in "What is on the tree" with why it does not reach the stale read (`effects.js:526` before `:542`), left out with that reason as decision 3.
- Cases and checks, case 7: the slow collection counts corrected (398 before, 399 after, the new file skipped by the tag).
- Cases and checks, Modal's call: item 1 says the reviewer checks Modal's cleanup by reading.
- Cases and checks, case 10: Escape and Cancel on Confirm, and Cmd+K then Escape, added to the look.
- The question, Z113: the rulings section says Z113 (a) overrides `spec.md:56` for the `*.client.test.ts` files and quotes the sentence.
- The question, the test head: item 3 says the test file's head names what it does not cover.
- Implied inputs: (a) Escape in case 10; (b) case 11; (c) case 12; (d) and (f) case 14; (g) case 15; (h) case 13; (i) case 18.
- Declined 1, the palette's landing: raised as Z117 and closed (a) by the orchestrator in automode: item 6, case 19, `HELP.md:90`, booked in `choices.md` and `plan.md` Rulings.
- Declined 2, the menu's teardown path: decision 3.
- Declined 3, the three copies: moved onto the new function (item 5).
- Declined 4, the `test:checks` split: case 7 keeps "27 run, 2 skipped" as the builder's first run to quote.

Usage: brief-check agent a610c73007a705c92, served claude-opus-5-5; 228,851 tokens, 70 tool uses, 17.5 min (from its completion notice)
