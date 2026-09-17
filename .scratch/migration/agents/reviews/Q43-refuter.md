# Step Q43 refuter report (on .agents/worktrees/q43, base 17e22699)

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
