# Step Q42 refuter report (on .agents/worktrees/q42, base d6d99e27)

## Verification (rerun by the reviewer)
All commands ran from `tools/oculus` in the worktree.
- `npx vitest run --reporter=dot`: `Test Files 1 failed | 239 passed (240)`, `Tests 1 failed | 4033 passed (4034)`. The one failure was the timing test `tests/server/hpc/ssh.test.ts > rejects a command that never returns at the budget` ("Matcher did not succeed in time"). It ran while I was cloning a 232 MB tree. Rerun alone with `npx vitest run tests/server/hpc/ssh.test.ts`: `5 passed (5)`.
- `npm run check`: `1192 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`.
- `npm run lint`: exit 0, nothing printed.
- `npm run format:check`: `All matched files use Prettier code style!`
- ASCII gate (perl form): printed nothing, exit 0.
- `find src tests bin -type f | xargs wc -l | sort -n | tail -3`: 970 `tests/state/layout.test.ts`, 979 `tests/state/board.test.ts`. `layout.svelte.ts` is 922, `unsaved-forms.spec.ts` 422, `layout-close.test.ts` 190.
- `npm run build`, then `npx playwright test tests/browser/unsaved-forms.spec.ts tests/browser/pages.spec.ts tests/browser/tabs.spec.ts`: `19 passed (28.1s)`.
- `git status --short` after all runs: the same three paths as before (two M, one ??).

## 1. Spec
- Item 1: done. `layout.svelte.ts:605` `forgetTabs(pane.tabs)` runs after `apply`.
- Item 2: done. `layout.svelte.ts:431` `forgetTabs(tabsOf(closing.workbench.root))` runs after both branches, the only-page branch included. `tabsOf` (`:612`) walks with `panes` (`state/instance.ts:126-138`). That walk returns at a page leaf (`:132-134`), so the page-leaf rule holds: a page shown by a leaf of the closed page keeps its instances. Confirmed by revert R3 below.
- Item 3: I read every caller myself and found none missing from the report's list.
  - `removeInstance` is called at `:529` (`closeInstanceAnywhere`, which clears at `:533`), `:575` (`carryToPage`, id kept) and `:591` (`closeInstance`, clears at `:592`).
  - `removePane` is called only at `:604`.
  - `clearPage` is called only at `:429`. It removes page leaves only (`nested.ts:185-205`).
  - `unembedPage` (`:697-704`, from `PageLeaf.svelte:91`) removes a page leaf only.
  - `settleFocus` never removes a tab (`workbench.ts:28-32`). `splitWith` keeps the id through `#moving` (`workbench.ts:56-59`).
  - Pane menu: `PaneView.svelte:250` goes to `closePane`, `:185` to `closeInstance`. Page strip: `PageStrip.svelte:113,130` go to `closePage`.
  - `File.svelte:132` uses `closeInstance`, `Files.svelte:330` uses `closeRecord`, `registry.ts:132` uses `closeInstancesOfView`. All three clear.
  - Outside `state/layout`, `change`/`apply` are called only for resize (`PageLeaf.svelte:105`, `Workbench.svelte:230`). `openArrangement` only adds a page.
  - Not an operation, and not listed in the report: `loadLayout` (`:328`) falls back to `defaultPages` when the saved envelope fails to parse, which strands every stored record. Brief decision 1 (no pruning) covers it.
- Changes no item asks for, both inside the paths and both listed by the builder:
  - The comment at `:427-428` is corrected. `clearPage` does remove the leaf (`nested.ts:195-205`), so the new comment is true.
  - `:414-415` now uses `item(held, at)` in place of the `at < 0` check.
- Report citation errors:
  - `Q42-report.md:28` says `closeInstanceAnywhere` clears at `layout.svelte.ts:529`. In the worktree it is `:533`; `:529` is the `removeInstance` line.
  - `Q42-report.md:31` says the preview retarget clears at `:797`. It is `:818`; `:797` is `restate` in the activate branch.

## 2. Proof
I reran R1 to R4 in my own copy (`scratchpad/q42-review/oculus`, an APFS clone). After each revert the file was restored and `cmp` printed `restored`.
- R1 (drop `forgetTabs(pane.tabs)`): node `2 failed | 3 passed` (cases 1 and 2). Browser, after a rebuild in the copy: the new case fails at `unsaved-forms.spec.ts:212` with `Expected - 1 / Received + 3` and one `#forms` key left.
- R2 (drop `forgetTabs(tabsOf(...))` from `closePage`): `3 failed | 2 passed` (cases 3, 4 and 5).
- R3 (`tabsOf` walks into the page a leaf names): `1 failed | 4 passed` (case 3).
- R4 (return right after the fresh default page is saved): `1 failed | 4 passed` (case 5).
- Extra reverts I added, both red as they should be:
  - R5: `closePane` forgets the whole tree. Case 1 fails.
  - R6: `closePage` forgets every page's tabs. Cases 3 and 4 fail.
- No test stays green under a revert that should turn it red. No test asserts a defect.
- `layout-close.test.ts:94-117`: the case's second half ("the read landing after writes nothing back") is proven by the existing guard at `source.svelte.ts:189`, not by Q42 code. Removing that guard (R7) turns the case red, but its revert comment names only R1.
- `unsaved-forms.spec.ts:188`: the test title and the head comment line (`:7-9`) say none of the pane's tabs' records are left. The assertions check the Tasks tab's id (`:213`) and all `#forms` keys (`:212`). The pane's other tab (Status) is never checked.
- Browser tab id (`tabIdOf`, `unsaved-forms.spec.ts:173-186`): it parses `oculus.layout.v1` as `{pages, current}` with pane `tabs` and split `children`. That matches `serialiseLayout` (`state/layout/saved.ts:258`) and skips page leaves. It is correct today, but it copies the saved envelope's shape into the spec. The collection already draws `data-instance={instance.id}` (`Collection.svelte:223`), so the id is also readable from the DOM.
- The browser case covers only a pane close. My browser probe (below) closed the only page through the page strip with a typed form and confirmed: the keys were `[]`. The builder's suite has no browser case for a page close.

## 3. Standards
- No package ids, dates or history in the new comments. The ASCII gate is clean.
- File size: `layout.svelte.ts` is at 922 lines, 78 under the limit.
- The walk is repeated:
  - `layout.svelte.ts:612-614` `tabsOf` is `panesIn(root).flatMap(({ pane }) => pane.tabs)`.
  - `shell/page-strip.ts:29-33` `pageInstanceIds` is `panes(page.workbench.root).flatMap(({ pane }) => pane.tabs.map((instance) => instance.id))`.
  - The builder's reason (state may not import shell) is correct about direction only. The shared function belongs beside `panes` in `state/instance.ts` (re-exported by `state/layout/index.ts:84`), and `page-strip.ts` would import it. Both files are outside the builder's paths, so this is a fix at landing.
- Comment at `state/context.ts:104-106` ("A tab's close forgets its instance's state, and the layout is the one store that knows a tab closed"): incomplete but not false. The same holds for `ui.svelte.ts:307`, `form-drafts.svelte.ts:201` and `manifest-draft.ts:81`.
- Doc text:
  - DESIGN.md:331: "a pane close and a page close forget neither" is false once this lands. The builder's replacement sentence (`Q42-report.md:55`) is accurate.
  - HELP.md: the builder's sentence (`Q42-report.md:58`), "Closing a pane or a page, once its question is answered, lets go of what every tab in it held", is false in two ways:
    - A pane or page of one clean tab asks no question (`shell/closing.ts:21-24`).
    - A page's "every tab in it" includes the tabs of a page one of its leaves shows, and those are kept (`layout.svelte.ts:612`).
- The test file's head label is "Layer 2, client state tests" (`layout-close.test.ts:1`). `tests/client.ts` uses "Layer 4, test helper", and other `tests/state` files carry no layer label. Minor inconsistency.

## 4. Behaviour
- A cancelled close clears nothing, in code and in the browser:
  - Code: `PaneView.svelte:338` and `PageStrip.svelte:295` only set `confirming = null`. The clears happen inside `closePane`/`closePage`, which run only on confirm (`PaneView.svelte:195-197`, `PageStrip.svelte:128-130`).
  - Browser probe in my copy: after Cancel on the pane menu's close and Cancel on the page strip's close, `oculus.ui.v1` still held both `<id>` and `<id>#forms`. After confirming the page close, the keys were `[]`.
- Undo of a close: none exists. Grepping `src` for reopen, undo close or recently closed finds only subtask actions. Nothing restores a closed tab, so nothing is lost.
- A source save in flight writes a record back under a closed instance. Reproduced with a node probe in my copy (`tests/state/probe-q42.test.ts`): `fetch` held, `editSourceDraft('a')`, `saveSourceDraft('a', ...)` started, then the close, then the release.
  - After `closePane([0])`, `closePage(current)` and `closeInstance('a')` alike: `after close undefined []`, then `after save lands {"text":"","saved":"typed","loaded":false,...,"message":"saved",...,"file":""} [ 'a' ]`.
  - Cause: `source.svelte.ts:248-271` calls `updateDraft` after the `await` with no check that the record still exists. The same holds for a tab's own close, so it is older than Q42 and not caused by it.
  - Smallest fix, in `src/lib/state/source.svelte.ts` right after `:248` `const answer = await saveSource(root, path, content);`:
    ```ts
    if (ui.instanceState(id) === undefined) return;
    ```
  - Applied in my copy: all three probes print `after save lands undefined []`, and `tests/state/source*.test.ts`, `view-source.test.ts` and `layout-close.test.ts` pass (`52 passed`).
  - Also comparing `sourceDraft(id).file !== draft.file`, as the read does at `:189`, would additionally cover a preview retarget during a save. Whether that race can be reached is not verified.
  - It needs a node case, a save in flight across `closePane` that writes nothing when it lands, reverted by dropping the guard. The file is outside Q42's paths.
- Manifest save: no write back.
  - Code: `settleManifest` returns on a missing draft (`manifest-draft.ts:88-89`), and `Editor.svelte:141-145` otherwise sets only its local `result`.
  - Browser probe (save held 2 s by `page.route`, pane closed from its menu while the save was out): keys `[]` after the close and `[]` after the write reached the file.
- Form save: no write back measured for the add form.
  - The store side returns when the draft is missing (`clearFormDraft` `form-drafts.svelte.ts:195`, `settleFormDraft` `:210`). `EntryForm.svelte:231-236` still calls `onclose()`, which for Collection is `write({ adding: false })` into `setInstanceState(instance.id, ...)` (`Collection.svelte:258,131-132`).
  - Browser probe (Tasks add form, save held, pane closed and confirmed, the entry written to the file): keys `[]` after the close and `[]` with no record for the id 1.5 s after the write landed.
  - The edit form's `onedit` path (`Collection.svelte:290-292`) was not probed.

## Not checked
- The edit-form save in flight across a close, in the browser.
- A source save in flight across a close, in the browser. It was reproduced only at store level in node, through the same `saveSourceDraft` that `Source.svelte:98` calls.
- Whether a preview tab can have a source save in flight when a single click retargets it.
- `tests/state/layout.test.ts` and any spec other than the three the brief names; they were covered only through the full vitest run.
- The full browser suite.

Reviewer usage: about 45 tool uses, about 35 minutes.


## Repair round 1, refuted
```
From tools/oculus in the worktree:
npx vitest run --reporter=dot: Test Files 240 passed (240), Tests 4038 passed (4038); no timing test needed a rerun
npm run check: 1192 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
npm run lint: exit 0, nothing printed
npm run format:check: All matched files use Prettier code style!
ASCII gate (perl form): printed nothing, exit 0
find src tests bin -type f | xargs wc -l | sort -n | tail -3: 970 tests/state/layout.test.ts, 979 tests/state/board.test.ts
npm run build, then npx playwright test tests/browser/unsaved-forms.spec.ts tests/browser/pages.spec.ts tests/browser/tabs.spec.ts tests/browser/layout.spec.ts: 23 passed (33.3s); all four files exist, the lock was free
git status --short after every run: the same 10 M and 1 ?? paths as before

Round delta: the base and round-1 trees were rebuilt in scratchpad/q42-review2 (patch -R of git diff d6d99e27, then q42-round1/tracked.patch plus untracked.tar), then diff -ru against the worktree.

Reverts, in an APFS clone at scratchpad/q42-review2/oculus. Each ran source, layout-close, instance, layout-saved and layout.test.ts, and each file was restored and cmp-checked:
V1 drop `ui.instanceState(id) === undefined ||`: 1 failed (never-read closed tab case)
V2 drop `|| sourceDraft(id).file !== draft.file`: 1 failed (preview tab pointed at b.md)
V3 drop the whole save guard: 3 failed (the three new source cases)
V4 drop the read's `sourceDraft(id).file !== file` return: 1 failed (layout-close in-flight read case)
V5 tabsOf returns the first pane's tabs only: 3 failed (instance tabsOf case, page-leaf page case, only-page case)
V6 closePage also forgets the tabs of pages its leaves name: 1 failed (keeps x and y)
V7 closePane forgets pane.tabs.slice(0, -1): 3 failed
V8 closePane forgets nothing: 3 failed
Browser V9 closePane forgets every tab but Venues, rebuilt, -g "a pane closed from its menu": 1 failed at unsaved-forms.spec.ts:217 (`Expected value: not "8a7a..."`, the Venues id); restored and cmp-checked
Probe, saved.ts at the base (copied in as saved-base.ts) against saved.ts now, equal results with toEqual, 2 passed:
  - parseWorkbench and parseLayout over 10 docked workbenches: empty panel, hidden, bottom, a panel of empty panes, a panel that is a page leaf, a page leaf beside an empty pane, a page leaf beside a pane with a panel focus, a page leaf in main, a duplicate id
  - parseLayout and checkPages over 6 page sets (v4 and v3), with page leaves, a root that is a page leaf and real duplicates across pages
  - checkPages flagged "instance a/b is on two pages" identically in both
Probe, failed save with the tab still open: P1 server refusal -> message "{G.cross} boom"; P2 network failure -> "save failed"; P3 readonly refusal after moveInstanceToPage and more typing -> readonly true with the readonly message; P4 refused save whose tab closed -> instanceState undefined
Probe files removed from the clone afterwards.
```
- `src/lib/state/source.svelte.ts:252`: ruling 1 closure (a save landing after a close or a retarget writes nothing) reproduced. V1, V2 and V3 each turn only the case they name red. Case "writes nothing under a tab its pane closed" stays green under V1 and under V2 alone, as its comment says. The guard does not swallow a failed save's message while the tab is open (probes P1 to P3). Reading the code: in the app, a closed tab's draft is caught by the file check. After the close, `sourceDraft(id).file` is `''` and the sent draft's file is not. The record check only decides the never-read case, which `Source.svelte:82` makes unreachable from the view, as the report states. No defect under Behaviour.
- `src/lib/state/instance.ts:145`: ruling 2 closure (one tab walk) reproduced. The only `panes(...).flatMap(pane.tabs)` left in `src` is `tabsOf` itself. `tabsOf` goes through `panes`, which stops at a page leaf (`instance.ts:130-132`). That is correct at every caller:
  - `closePage` should not reach into a shown page, and V6 proves it does not.
  - `closeInstancesOfView`, `closeRecord` and `checkPages` walk every page themselves, so walking into a leaf would visit or count a page's tabs twice.
  - `pageInstanceIds` and the docked-panel `held` keep the same set as before.
  None under Spec or Behaviour.
- `src/lib/state/layout.svelte.ts:495,508` and `src/lib/state/layout/saved.ts:241,347`: the builder also moved these loops onto `tabsOf`, beyond the two copies ruling 2 named. The change is disclosed and inside the brief's `src/lib/state/layout/` path. The saved-layout checks match the base exactly, including page leaves and docked panels (the saved.ts probe above). The layout is replaced immutably (`apply`, `savePages`), so iterating a flattened snapshot visits the same tabs in the same order as the nested loop did; `tests/state/pages.test.ts:395,405` pass in the full run. None under Spec.
- `tests/browser/unsaved-forms.spec.ts:172-221`: ruling 3 closure reproduced. Ids are read from `data-instance` in the page, and the three ids must be distinct. V9 shows the new per-tab assertion catches a Venues record left behind, which the round-1 test could not. The Status id check cannot fail, because Status writes no record; the comment at `:191-192` says so. None under Proof.
- `tests/state/layout-close.test.ts:95-97`: ruling 4 closure reproduced; V4 turns the case red. `tests/state/instance.test.ts:27`: the named revert (V5) turns it red. None.
- `src/lib/state/context.ts:104-107`: ruling 5 closure. The comment is now true for the tab, pane and page closes. None.
- `Q42-report.md` Doc text (the HELP.md sentence, ruling 6): true against `layout.svelte.ts:600,432` and V6. None.
- `Q42-report.md` Doc text: new gap under Standards. The report carries no DESIGN.md line for the new save rule, which is visible to the reader: a save that lands after its tab closed or was pointed at another file writes nothing, and shows no message. DESIGN.md:312 states only the read's version ("a read that lands after the tab was pointed at another file is thrown away"). No existing sentence is made false, so this is a line to add when the doc lines are carried, not a defect in the code.
- Cited lines, line counts and +/- counts in the round's report: all reproduced (`layout.svelte.ts:432,495,508,528,587,600,805`, `source.svelte.ts:252`, `instance.ts:145`, `index.ts:87`, `saved.ts:241,347`, `page-strip.ts:30`, `unsaved-forms.spec.ts:173,182`; wc 909/293/160/400/31/193/436/108/428). None.

Not checked: a source save in flight across a close in the browser (store level only, as in the report); an edit-form save in flight across a close; the full browser suite.

Reviewer usage: about 35 tool uses, about 18 minutes.

## Closed

- The first review's findings: closed by the round's six rulings, each reproduced by the run over the round (V1 to V9).
- The run over the round's one gap (no DESIGN.md line for the save rule): a sentence added to DESIGN.md's source-tab paragraph at landing, beside the read's rule, saying a save that lands after its tab closed or was pointed at another file writes nothing and shows no message.
