# Step Q43 refuter report (on .agents/worktrees/q43, base 4735b6db)

## Verification (rerun by the reviewer)
Every command below was run from `tools/oculus` in the worktree.
- `npx vitest run --reporter=dot`: `Test Files 240 passed (240)`, `Tests 4051 passed (4051)`. No timing test timed out.
- `npm run check`: `COMPLETED 1196 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`.
- `npm run lint`: printed nothing, exit 0.
- `npm run format:check`: `All matched files use Prettier code style!`
- ASCII gate (the perl form): printed nothing.
- `npm run build`: exit 0.
- `npx playwright test tests/browser/files.spec.ts tests/browser/files-forms.spec.ts`: `27 passed (53.9s)`. The first try was refused by the lock another run held on 8792; my script waited for the port and ran it again.
- Name grep from the builder's report, rerun: `closeForm` has no hits. The only doc hits are HELP.md:64 and DESIGN.md:332.
- Reverts and probes ran in my own copies under `scratchpad/q43-review/`: `oculus/` is the step, `base/` is the step's diff reversed (checked with cmp to be byte-identical to main's six files), and `node/` holds the node reverts. Each browser revert was rebuilt before it ran.

## 1. Spec
- **Brief item 3 (Cancel), `src/lib/views/Files.svelte:383-389`.** The brief says Cancel forgets the draft "through `toggleAdd` and `toggleEdit`". Cancel actually forgets it through `EntryForm.cancel` (`target.clear`), and `closeMark` only settles. The effect is the same, and the collection views do the same thing (`Collection.svelte:258` `onclose={() => write({ adding: false })}`). The code differs from the brief's wording; the behaviour does not.
- **Brief item 1, stated in the report as "In flight: the form closes when the answer arrives".** This is not true when the tab is switched away while the request is in flight. See section 4, first finding.
- **Change the brief does not ask for: `{#key view.editing}`, `Files.svelte:423`.** It is needed. Without it, BookmarkForm's `opened` stays at the value from the first mount. Proof: revert R3 (the key block removed) leaves `files.spec.ts` and `files-forms.spec.ts` green (33 passed with my probe). My probe P1 turns red: add form, then a row's edit, then Cancel leaves `[data-form="edit"]` at count 1. The change is justified, but no test covers it (section 2).
- **Change the brief does not ask for: the edit form is drawn only once its entry is loaded (`markForm`, `Files.svelte:146-148`).** Probe P6 on the step build: an edit form with a typed path is open again with `typed/in/edit` after a switch and after a reload. On base it is closed (0/0). The change is justified. Residual: when the edited bookmark is removed (probe P10, the row star), the record stays `form: 'bookmark', editing: 'z.txt'`, no form is drawn, and closing the tab still asks (dialog count 1). Base drew the add form there and also asked. So "the tab can ask about text it does not show", the problem the brief names, remains on this path.
- **Change the brief does not ask for: an answer no longer closes a newer form (`formSettled`, `settle`, `closeMark`).** It answers spec.md's rule on superseded paths and is in scope. Its claim is only partly true; see section 4.
- **Files outside the brief's paths.**
  - `tests/browser/files.ts` and `tests/browser/files-forms.spec.ts`: `files.spec.ts` was 889 lines at base and is 845 now; adding the four cases would have passed 1000. Reasonable.
  - `tests/views/type-scale.test.ts:46`: one line, needed because that audit lists every view file.
  - `tests/state/explorer.test.ts` is the test file of `state/fs.ts`, so it is inside "their tests".
- **The six judgment calls.**
  1. Opening the root or workspace form over a typed bookmark form forgets its draft. Probe P7: drafts go from one record to `[]` on the step; base keeps the record while the form is gone. This is consistent with "closing forgets".
  2. `markForm`: see above.
  3. `{#key}`: see above.
  4. The file split: acceptable.
  5. `type-scale`: acceptable.
  6. `draftRecords` duplicating `draftKeys`: this is a DRY defect (section 3), not only a judgment call.

## 2. Proof
- **`move()` toggleEdit branch, `Files.svelte:366-368`: nothing covers it.** Revert R2 (the `toggleEdit(...)` call replaced by `void 0;`): `files-forms.spec.ts` stays 4 of 4 green and the node files stay green. Only my probe P2 turns red (drafts `["<id>#forms"]` after a typed edit form gives way to another row's edit). The brief's item 3, "by another bookmark row's edit ... forgets its draft", therefore has no test. The head comment at `explorer.test.ts:6-7` ("the drafts they forget, which are tests/browser/files-forms.spec.ts") overstates the coverage.
- **`{#key view.editing}`, `Files.svelte:423`: nothing covers it** (R3 above). The failure without it is that Cancel, a save or a delete on an edit form opened from the add form no longer closes the form.
- **An answer landing after a tab switch: no test, and the path is broken** (section 4, first finding). The "in flight" proof in the report covers only a tab that stays mounted.
- **After close.** The node case `formSettled(filesViewOf(undefined), line)` (`explorer.test.ts:631`) tests a pure function over an empty record, not the view. Probe P4 (a root add answered after the Files tab was closed): the record is `undefined` before and after the release on both builds, so no record is written back. On the step build the reason is not the one the comment gives: after the close, `instance.id` resolves to the pane's remaining tab (see section 4).
- **Superseded by reopening the same form: no test, and the claim is partial.** Probe P8: an add-bookmark save in flight; "+ bookmark" pressed twice (close, reopen); `second typed` typed; the answer is released. The reopened add form is closed (count 0) and what was typed is gone. Same on base. `formSettled` cannot tell a reopened identical form from the original, so "Superseded ... the answer leaves the form as the reader left it" (report line 54) holds only for a different form.
- **Reverts rerun and red as the builder states.** Browser:
  - R1 (toggleAdd call dropped): test 1 red at `draftRecords`.
  - R4 (`onclose(editing)`): test 4 red, edit form not visible.
  - R5 (confirm patches closed): test 3 red, workspace box value.
  - R6 (closeMark patches closed): test 4 red.
- **Node reverts, all red, one failing case each:**
  - N1: markForm without the wait.
  - N2: formSettled always closes.
  - N3: filesViewOf reads `editing` and `typed` for any form.
  - N4: `value={''}`.
  - N5: formShown keeps typed.
  - N6: editShown never "same".
  - N7: bookmarkLeft null for any next bookmark form.
- **Not rerun:** the builder's browser revert "move() keeps forms in component `$state`" and the root `typed` component-state revert. Probes P7 and P9 show the behaviours those reverts would remove are live on the step build and absent on base.

## 3. Standards
- **False sentence, `src/lib/views/Files.svelte:28-29`:** "A pane mounts only its active tab, so nothing a reader would miss after a switch is kept in this component." `note` (the root form's refusal), `said` and `removing` (the root-removal Confirm) are still component `$state` at `Files.svelte:118-123` and are lost on a switch. The report's own Limitations section says so.
- **Inaccurate comment, `Files.svelte:141-145` and `tests/views/files.test.ts` (added comment above `no such bookmark`):** "drawn before them it would be the form that adds one, under the drafts of the one it edits". An EntryForm with `entry === null` keys its drafts `formKey(collection, null)` (`EntryForm.svelte:107`), so it would draw the add form's drafts, not the edited one's. The real hazard is an add form, whose Save adds a new bookmark, drawn where the edit form belongs, with the edit's drafts hidden.
- **DRY:**
  - `tests/browser/files-forms.spec.ts:18-23` `draftRecords` is `draftKeys` of `tests/browser/unsaved-forms.spec.ts:58-63`, line for line.
  - `switchAndBack` (`files-forms.spec.ts:26-31`) is the same helper as `unsaved-forms.spec.ts:74-79` with other selectors.
  - Closing this means one shared helper in `tests/browser/` that both specs import, which touches `unsaved-forms.spec.ts`, the path the brief reserves for another step.
- **Import order, `tests/state/explorer.test.ts:17-19`:** `formSettled, formShown` sit before `filterRows`, out of the alphabetical order the rest of the list keeps.
- **Browser helper head comments, `tests/browser/files.ts:1-3`:** has a purpose line and no layer line. This matches `style.ts`, `rail.ts` and `hub.ts`, so it is not a defect.
- **`tests/browser/files-forms.spec.ts:7-9`:** "every bookmark a case writes is taken away before it ends" is true. Test 3 and test 4 each leave a scratch root in the run's workspace, and nothing is removed from the system temporary directory; `files.spec.ts` does the same.
- **Size:** `Files.svelte` is 560 lines, 40 under the ~600 component guide, so the next addition to this view needs a split first. `fs.ts` is 440, `files.spec.ts` 845.
- **Doc text in the report.**
  - The proposed HELP.md:64 sentence says the root or workspace line comes back "after the tab is switched away from and after a reload". Probe P9 confirms it after a reload (`relative/not/absolute` kept); P7 confirms the workspace line after a switch.
  - The same paragraph opens with "A tab holding text no save has taken is closed only after a confirmation". With the proposed text a reader sees the root line kept and will expect a question the tab never asks (section 4). The sentence should name that exception or the gap should be closed.
  - The proposed DESIGN.md:332 text is accurate apart from the in-flight claim (section 4).
  - The existing DESIGN.md:332 ends in "Package Q31.", which is history in a design line. That line is not this step's.
- **No history in comments:** none (grep of added lines for package ids, dates, "no longer", "earlier", "as before" found only non-history uses).
- **Non-ASCII:** none (gate clean).

## 4. Behaviour
Every row below was measured on my served builds through the suite's `serve.ts` on 8792, step copy against base copy.
- **Defect: an add-root or save-workspace answer landing after a tab switch leaves the form open.**
  - Where: `Files.svelte:314-330` (`confirm` and `settle`) and `Files.svelte:387-389` (`closeMark`).
  - Probe P5b with the tab not switched: the record goes to `{"form":"","editing":"","typed":""}` and the box count is 0.
  - With a switch to Status before the release: the record stays `{"form":"root",...,"typed":"<dir>"}`, and on return the root row is drawn and the box count is 1, holding a folder that is already added. Pressing Add again would be refused as held.
  - Base: the form is closed after the switch (component state).
  - Cause, measured with a `console.warn` in `settle` in my copy: after the switch `instance.id` reads `bb07441d... VIEW status`, the pane's Status instance, while the Files instance id was `80d9ec04...`. `PaneView.svelte:327` passes `instance={shown}`, and the destroyed Files component's prop getter returns the pane's new `shown`.
  - `settle` therefore reads, and when `formSettled` matches would `patch`, another instance's record. This is the same stale-prop hazard BookmarkForm fixes for `editing` with `opened`, left open for `instance`.
  - The bookmark path runs through the same `settle`, so an add-bookmark save answered after a switch should also leave the (now empty) add form open. That is inferred from the same mechanism and was not run.
  - Fix direction: take `instance.id` before the await in `confirm`, and give the bookmark close an id taken when the request went.
  - Proof needed: a browser case that switches tabs while the POST is held.
- **Bookmark form after a switch and a reload.** Before: closed; the label came back only on reopening. After: open with the label (test 1 green, R1 red).
- **Edit form over a bookmark after a switch and a reload.** Before: closed (P6 0/0). After: open with the typed path (P6 1/1, value `typed/in/edit`).
- **Root line after a switch and a reload.** Before: closed and empty. After: open with the text (test 2; P9 after reload `relative/not/absolute`). Base failed P9 at the first `box` read, since the form is gone after the reload.
- **Workspace line after a switch.** Before: closed (P7 count 0). After: open with `typed workspace`.
- **"+ bookmark" closing a typed add form.** Before: the draft stayed. After: no `#forms` record (test 1).
- **A row's edit moving from a typed edit form to another bookmark.** Before: the draft stayed (P2 on base: `["<id>#forms"]`). After: `[]`. No test in the step covers it (section 2).
- **Opening the root form over a typed add-bookmark form.** Before: the draft stayed (P7 base). After: `[]`.
- **Save answered after a different form was opened.** Before: the newer form was closed. After: it stays open, provided the tab was not switched (tests 3 and 4). Reopening the same form is still closed by the answer and its new text lost (P8, both builds).
- **Edited bookmark removed by the row star while its edit form is open.** Before: the add form was drawn in its place. After: no form is drawn. On both builds the record or draft stays and closing the tab asks (P10 dialog 1).
- **Root and workspace line not registered as unsaved work.** Probe P3: typed root line, the tab's close button, dialog count 0 and the tab closes. A typed bookmark add form asks (dialog 1). Base behaves the same for the root line, and there the text was not kept at all.
  - **Does the brief ask for it?** No. Its "as the collection views' forms do" qualifies the bookmark form coming back open, and item 2 asks only that the line text be kept in instance state and cleared on close or success.
  - **What the step adds:** kept text a tab closes over silently, which the HELP.md paragraph's first sentence leads a reader to expect a question for.
  - **What closing the gap would touch:**
    - A new `ui.registerUnsaved` reporter in `src/lib/state/context.ts`. It would be wired after `layout`, because the reporter gets only an instance id and has to confirm the instance is a `files` view before reading `filesViewOf(...).typed`: another view's record can hold keys with those names.
    - A node test beside it.
    - A browser case in `unsaved-forms.spec.ts`.
    - HELP.md:64 and DESIGN.md:332.
  - `context.ts` and `unsaved-forms.spec.ts` are outside this brief's paths, and both are touched by the step now on main (`git status` of main shows `state/context.ts` and `unsaved-forms.spec.ts` staged).
  - Whether a typed folder path or workspace name counts as unsaved text is a user-visible choice. It goes to Axel as a decision; it is not a fix to make here.

## Not checked
- The bookmark add or edit save answered after a tab switch (inferred from the measured `instance` mechanism, not run).
- Two Files tabs in one pane: the same component is reused with a changed `instance` prop, so `note`, `said`, `removing` and the `{#key}` block would carry across. Not run.
- The workspace form's save answered after a switch (same code path as the root add, not run separately).
- `npx playwright test` beyond the two named specs.
- A screenshot look at the forms.

Reviewer usage: about 50 tool uses, about 16 minutes (14:53 to 15:09).


## Repair round 1, refuted
```
Worktree tools/oculus (the round's delta was rebuilt as scratchpad/q43-review2/r1 from q43-round1 and diffed against the worktree: delta.patch, 1154 lines, 9 files)
npx vitest run --reporter=dot: Test Files 1 failed | 239 passed (240), Tests 1 failed | 4053 passed (4054). The failure is tests/server/mail/poll.test.ts "makes the mail folder when it is not there" (a timing poll, poll.test.ts:54). Rerun alone: Tests 10 passed (10). The file is not one this step touches.
npm run check: COMPLETED 1197 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
npm run lint: printed nothing, exit 0
npm run format:check: All matched files use Prettier code style!
ASCII gate (perl form): printed nothing
find src tests bin -type f | xargs wc -l | sort -n | tail -3: 970 tests/state/layout.test.ts, 979 tests/state/board.test.ts, 164494 total. Files.svelte 588, fs.ts 485, files-forms.spec.ts 408.
npm run build: exit 0
npx playwright test tests/browser/files.spec.ts tests/browser/files-forms.spec.ts tests/browser/unsaved-forms.spec.ts: 45 passed (1.3m). The first try was refused by the 8792 lock; it passed on the retry.
Merge check, git merge-file of main HEAD / base 4735b6db / step: context.ts 0 conflicts; unsaved-forms.spec.ts 1 conflict (the head comment, lines 7-10).

Node reverts in scratchpad/q43-review2/node, npx vitest run tests/state/explorer.test.ts (unchanged: 21 passed):
N1 formSettled without the opening compare: red (1 case)
N2 filesLineTyped without the view check: red (2 cases)
N3 editedGone without the loading/error check: red (1)
N4 context.ts reporter answers false: red (1)
N4b reporter treats every view as 'files': red (1)
N5 filesViewOf takes any number as opening: red (1)
N6 filesLineTyped trims (a whitespace-only line not asked about): green, 21 passed. Nothing decides the whitespace case either way.

Browser reverts in scratchpad/q43-review2/oculus, rebuilt before each run, files-forms.spec.ts (10 cases) unless named:
RA confirm() settles through instance.id instead of owner: 1 failed, 9 passed. Red: :243 root switched away.
RB BookmarkForm closes with the owner prop instead of opened.owner: 4 failed. Red on its own assertion: :272 bookmark switched away (toMatchObject form ''). :340, :364 and :384 are red only because :272 left notes.md bookmarked.
RC formSettled without the opening compare: 1 failed. Red: :309 root reopened.
RD key block back to {#key view.editing}: files + files-forms + unsaved-forms, 45 passed.
RH key block removed: 2 failed. Red: :364 edit from add, Cancel ([data-form] count 1). :384 is red only because of what :364 left behind.
RE gone-bookmark $effect disabled: 1 failed. Red: :384.
RG toggleEdit dropped in shift(): 3 failed. Red: :340 (draftKeys not []). :364 and :384 are red only because of what :340 left behind.
RF context.ts reporter answers false, unsaved-forms.spec.ts: 1 failed, 11 passed. Red: :357 root line close question.

Probes on the step build (zz-probe.spec.ts, zz-probe2.spec.ts in my copy):
P1 bookmark add form closed and reopened during a held add save, 'second typed' typed, answer released: form count 1, Label '' (empty), drafts []. The builder's report reproduces.
P2 root line '   ' typed, the tab's close pressed: dialog count 1.
P3 edit form over tool.py, Label changed to renamed.py, write held, 'typed/during/save' typed into Path, answer released: answer ok, changed [label]; edit form count 0; drafts []; record form ''. With RE: form count 0, record form 'bookmark' editing 'tool.py', draft {path: typed/during/save} kept.
P4 two Files instances in one pane (page 2's Files moved to page 1), each with a typed add form, then Cancel on the second: step build and RD build are identical. Tab 0 shows 'first label' and tab 1 'second label'. Cancel closes only the shown instance's form. The other tab keeps its form and its label.
```
- `tools/oculus/tests/browser/unsaved-forms.spec.ts:7-8` (merge with main): this is a textual conflict with main's head comment from Q42 (main lines 7-10). Both sides append a sentence to the same comment line, so the resolution keeps both sentences. context.ts merges clean. After the merge, main's own `instanceKeys` (main `unsaved-forms.spec.ts:165-170`) repeats the raw storage parse that the new `tests/browser/forms.ts` `uiInstances` holds. Main's pane-close case calls `draftKeys`, which the merged file then gets from the forms.ts import. The fix at landing is `instanceKeys` as `Object.keys(await uiInstances(page))`, or dropping it; Standards.
- `src/lib/views/shared/EntryForm.svelte:231-233` (ruling 2, reported NOT DONE): P1 reproduces it. **It is a defect, not the written rule working as meant.** The rule lives in EntryForm's comment at 189-195 and in the revert note at `unsaved-forms.spec.ts:305-306`. Its purpose is that text typed into the opening that sent the add must not stay, or a second Save adds a second entry. Text typed into a new opening, after the Files toggle forgot the old draft (`Files.svelte:380-381`), is a new add, not a duplicate. The clear hits it only because both openings share `formKey('bookmarks', null)`.
  - **Smallest fix:** an optional EntryForm prop the host answers ("is the opening that saved still open"). The add branch runs `into.clear(which)` only when that answer is true, or the prop is absent.
  - **Files touched:** BookmarkForm passes it, built from the `opened` forms it already holds plus a Files function doing the `formSettled(filesViewOf(instanceState(owner)), forms) !== null` test that `settle` makes. Add P1 as a case in `files-forms.spec.ts`.
  - **Effect on other views:** the collection views pass nothing and keep today's behaviour.
  - **Does it need Axel's ruling?** No. It adds no user-visible shape, it stays inside ruling 2, and the rule clash dissolves once the rule's scope is read as the opening. It does touch a shared component outside the step's paths.
  - **Related hazard outside this brief:** Collection, Leads, Domains, Pillars, Venues, Data and Linkedin close through `onclose={() => write({ adding: false })}` (e.g. `Collection.svelte:258`). An earlier add's answer there closes a reopened add form and clears its text. It needs booking.
  - Behaviour.
- `tools/oculus/tests/browser/files-forms.spec.ts:10-11` and the builder's updated HELP.md text ("closed and opened the same form again ... closes only the form it was sent from"): for the bookmark add form, the reopened form stays open but its Label is emptied (P1). The Doc text states a closure the build does not have for that form; Behaviour.
- `src/lib/state/fs.ts:286-287` (`filesLineTyped`, ruling 6): a line of spaces asks before the tab closes (P2, dialog 1).
  - Entry forms decide unsaved text through `savedValue`, which trims (`form-values.ts:54`, `sameSaved` at 63-70).
  - The server trims the root dir (`src/lib/server/fs.ts:362`), so a blank line saves nothing.
  - The builder's HELP text calls it "a folder or workspace name typed". No test pins either answer (N6 stays green).
  - Fix: `typed.trim() !== ''` plus one node case. Behaviour.
- `src/lib/views/Files.svelte:397-399` (the gone-bookmark `$effect`, ruling 5): the closure reproduces (RE turns :384 red).
  - A bookmark renamed by its own edit save while a value is typed during the save: the effect closes the form and forgets the value, with no question (P3). With RE, the draft is kept under a hidden form.
  - This matches the written form-drafts rule for a renamed entry (`form-drafts.svelte.ts:21-23`: never counted, dropped).
  - It also breaks EntryForm's "an edit's save keeping what was typed after it went" (`EntryForm.svelte:192-193`) for a label change.
  - Before: hidden draft, tab asks. After: value dropped silently. The report does not state it. Behaviour.
- `src/lib/views/Files.svelte:397-399` (ruling 5, the builder's limitation): the close lives only in the mounted component. A bookmark removed while the Files tab is not shown leaves the record and the draft, and closing that unshown tab asks about text that goes away on its next showing. Confirmed by reading; not measured. Behaviour.
- `src/lib/views/Files.svelte:450` (`{#key \`${instance.id} ${view.opening}\`}`, rulings 2 and 4):
  - RD (key back to `view.editing`) leaves all 45 browser cases green.
  - P4 shows the same correct result on RD for two Files tabs in one pane.
  - The builder's claim that "keying on the instance also covers a pane that reuses the Files component for another Files tab" is not reproduced: the instance and opening parts of the key change no measured behaviour and no test covers them.
  - `explorer.test.ts:10` ("the form remounted per opening") overstates what the Cancel case at `files-forms.spec.ts:364` proves: it goes red only with the key removed.
  - Proof.
- `src/lib/state/context.ts:145-149` (the `registerUnsaved` reporter): no defect found.
  - **Cost:** it runs only on a close press, in `PaneView.svelte:186`, `PaneView.svelte:251-254` and `PageStrip.svelte:111`, and `closeQuestion` answers 'many' before asking when more than one id goes (`closing.ts:22-23`). Its cost is one walk of every page's panes per asked id.
  - **Nested pages:** `panes()` skips page leaves (`instance.ts:132-134`), but every page is walked in its own right through `layout.pages()`, so an instance of an embedded page is found in its own page.
  - **DRY:** the walk repeats the layout store's private `holding` + `findInstance` (`layout.svelte.ts:217-222`, `266-267`). A `LayoutStore` accessor would remove it; `state/layout*` is outside the step's paths. Standards, minor.
- `opening` counter (`fs.ts:235-238`, `formShown`/`editShown`/`formSettled`): no defect found.
  - **Reload:** the count is kept in the `oculus.ui.v1` instance record, and no request survives the reload.
  - **Two Files tabs:** P4 shows separate records and a correct Cancel.
  - **Saved layout:** instance state is not in the layout envelope, and an opened arrangement gets fresh ids (`arrangement.ts:15-16`).
  - **Closed tab:** removing the record reads as form '' (N1 case at `explorer.test.ts`), so a stale count cannot match.
- `tools/oculus/tests/browser/files-forms.spec.ts:243-408`: each case removes its bookmarks at the end of its own body, not in `afterEach` or a `finally`. One red case therefore turns later cases red (RB 1+3, RG 1+2, RH 1+1), so a revert's red count overstates the cases that guard it. Proof, minor.
- Closures reproduced with no finding:
  - ruling 1 (RA, RB red on their own cases);
  - ruling 2 for the root/workspace line (RC, N1);
  - ruling 3 (RG);
  - ruling 4 (RH);
  - ruling 5 for a bookmark removed by the star (RE, N3);
  - ruling 6 (RF, N2, N4, N4b);
  - ruling 8: one shared `forms.ts`, `grep` of `draftRecords` finds none;
  - ruling 7: the comments now match the code (Files.svelte:26-36, 150-155; BookmarkForm.svelte:1-11).
- `src/lib/views/Files.svelte`: 588 lines against the ~600 component guide in spec.md. The next addition needs a split first; Standards, note.

Reviewer usage: about 60 tool uses, about 24 minutes (15:35 to 15:59).


## Closed

- The first review's findings: closed by the round's rulings 1 and 3 to 9, reproduced by the run over the round (RA, RB, RC, RE, RF, RG, RH red); ruling 2 closed for the root and workspace line (RC, N1).
- Ruling 2 for the bookmark add form (P1: reopened during an add save, its new Label emptied when the save lands): the run over the round judged it a defect of the shared `EntryForm.svelte`, whose add branch forgets the draft the reopened form shares, reaching the collection views' add forms too; booked as Q48 with the smallest fix it names. The Doc text applied at landing does not claim the bookmark add form keeps its text in that case.
- A line of spaces asked about (P2): a fix at landing, `filesLineTyped` trims (`state/fs.ts`), with a case in `tests/state/explorer.test.ts` (red with the trim removed: 1 failed).
- The gone-bookmark close dropping a value typed during a rename save (P3), and not running while the Files tab is unshown: booked with Q48.
- `explorer.test.ts`'s head comment overstating the remount proof: corrected at landing to what the Cancel case proves.
- `unsaved-forms.spec.ts` against main's copy (a head-comment conflict with Q42, and main's `instanceKeys` repeating `uiInstances`): resolved at landing.
- The `{#key}` over instance and opening unproven beyond the remount: noted; P4 shows the same result either way.
- The `registerUnsaved` walk repeating the layout store's private lookup: noted, `state/layout*` outside the step.
- Cases that clean up at the end of their body rather than in `finally`: noted.
