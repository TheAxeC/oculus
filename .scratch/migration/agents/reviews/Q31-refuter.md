# Step Q31 refuter report (on .agents/worktrees/q31, base 77ef1c91)

## Verification (rerun by the reviewer)
All commands run from `tools/oculus` in the worktree, PATH with node v24.21.0.
- `npx vitest run --reporter=dot`: Test Files 1 failed | 234 passed (235), Tests 1 failed | 3945 passed (3946). The failure is the timing test `tests/server/git.test.ts > the log, the branches and the worktrees > carries the newest commits...`, "Test timed out in 5000ms". Rerun alone, `npx vitest run tests/server/git.test.ts`: 31 passed (31). The total of 3946 matches the report.
- `npm run check`: `COMPLETED 1174 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`.
- `npm run build`: exit 0.
- `npm run format:check`: "All matched files use Prettier code style!"
- `npm run lint`: exit 0, no findings.
- ASCII perl gate: printed nothing, exit 0.
- `npx playwright test tests/browser/unsaved-forms.spec.ts tests/browser/collection.spec.ts tests/browser/tabs.spec.ts`: 10 passed (21.8s). I waited for port 8792 to be free with an lsof loop. No lock was touched and no pid was signalled.
- The line counts in the report match `wc -l`: Editor 328, EntryForm 447, form-drafts 170, manifest-draft 118, instance-context 26, and the tests 189, 167 and 168.
- After all runs, `git status --short` in the worktree shows the same set of files as before the review.

Reverts, each run in an APFS clone at `scratchpad/q31-review/oculus`, rebuilt, then restored (a `diff -r src` against the worktree came back identical):
- Removed the `createLayout` wrapper in `context.ts`: form-drafts.test.ts "forgets the closed instance's form drafts through the layout" goes red.
- Removed `ui.registerUnsaved(formDrafts.formsDirty)`: two tests in form-drafts.test.ts go red, and browser case 2 goes red at line 112. This matches the report.
- Removed `ui.registerUnsaved(manifestDraft.manifestDirty)`: manifest-draft.test.ts "registers the client's own manifest draft" goes red.
- Removed `settleManifest(...)` in Editor.svelte: browser case 4 goes red at line 161. This matches the report.
- Reversed the whole EntryForm.svelte diff (`patch -R`): case 1 goes red at line 92 and case 2 at line 112. This matches the report.
- Removed `forget(from, which)` from EntryForm's `save`, and removed the `written` overlay line in Editor's `valueOf`: everything stays green. That is node collection, editor and state tests (1088 passed) and browser unsaved-forms, collection and tabs (10 passed). See Proof.

Reviewer probes, in the clone (`tests/browser/q31-probe.spec.ts`, all passed, observations logged): P1 to P10, P3b, and P11 (P11 did not run, see Not checked).

## 1. Spec
- **Premise (the form's open state): CONFIRMED, and the builder's list is short by one view.**
  - `Files.svelte:91` (`form`) and `:95` (`editing`) are component state. `show()` at :262 and `edit()` at :271 close the bookmark form without forgetting its draft. The report lists five views and omits Files.
  - All thirteen EntryForm callers:

    | Caller | Where the open state lives | Instance state? |
    |---|---|---|
    | `Collection.svelte:126` (`adding`) | component state | no |
    | `Pillars.svelte:91` | component state | no |
    | `Domains.svelte:61` | component state | no |
    | `Venues.svelte:65` | component state | no |
    | `Data.svelte:59` | component state | no |
    | `Files.svelte:91,95` | component state | no |
    | `Leads.svelte:119-120,158` | `held.adding`, `state/leads.ts:25,165` | yes |
    | `Linkedin.svelte:109-110,158` | `held.adding`, `state/linkedin.ts:21,142` | yes |
    | `collection/EntryCard.svelte:316` | `editing` prop from `Collection.svelte:127,291-292` | no |
    | `domains/DomainCard.svelte:58` | from `Domains.svelte:62,123-125` | no |
    | `venues/VenueCard.svelte:150` | from `Venues.svelte:66,159-161,199-201` | no |
    | `pillars/LineCard.svelte:107` | from `Pillars.svelte:92,150-151,179-180,210-211` | no |
    | `data/DatasetCard.svelte:153` | from `Data.svelte:60,151-152` | no |

  - Probe P2 (Collection): after a tab switch, the add forms and card edit forms are both gone (count 0). Pressing Edit again shows the typed "P2 kind".
  - Probe P1: the Add toggle closes the form, the draft stays, and closing the tab raises the confirmation (dialog count 1) over text the reader cannot see.
  - The hidden-draft case holds for all thirteen. Every host toggle and every card toggle (`EntryCard.svelte:207`, and Leads and Linkedin `write({ adding: !held.adding })`) closes without calling `forget`.
- **`form-drafts.ts:97-100`, `EntryForm.svelte:147-150` (`base` stored at typing time):** the brief asks for a report of "a typed value that differs from the entry". What is compared is the entry as it was at the keystroke.
  - Probe P4: kind was typed back to the entry's value, then the file was changed to `kind: changed-on-disk`. The open form shows "review", the file holds "changed-on-disk", and closing the tab raises no dialog (count 0).
  - A value the save would write is dropped without asking. The report lists this under Limitations; under the spec it is a miss inside the brief.
- **`context.ts:98-108` (the wrapper around `clearInstanceState`):** not named by the brief, but within its paths and needed for "cleared on close". It is disclosed as decision 2.
  - It replaces a store method by spreading `...ui` rather than registering a hook. The spec's "extends by registration" principle points at a `registerCleared` on the ui store, which is outside this step's paths.
  - As built, it also clears form drafts on the preview-retarget path (`layout.svelte.ts:797`), which is harmless.
- **`Editor.svelte:76-84,96-105,151-166` (the `written` overlay):** no item asks for it, and it adds a user-visible defect (Behaviour, first bullet). It is disclosed as decision 5 but has no test (Proof).
- **Editor edits no longer carry between two editor tabs in one pane:** before, `edits` was a component-level record by field name, so edits typed for one project showed in the editor of another. That was a defect, and the change fixes it. The report lists it under Limitations rather than as a visible change, so it is disclosed, not silent.
- Silent user-visible decisions: none found beyond the above.

## 2. Proof
- **Entry-form save clearing the draft is untested.** Removing `forget(from, which)` from `EntryForm.svelte` `save` (around line 258) leaves every node and browser test green (runs above).
  - The spec head comment `unsaved-forms.spec.ts:4` says "Cancel and a save take the question away". Only the manifest save is exercised.
  - The delete path's `forget` has no test either. I found this by reading the specs, not by a revert run.
- **The `written` overlay is untested.** Removing its only effect (`Editor.svelte:103`) leaves case 4 green, because `toHaveValue(LINE)` at line 158 polls until the snapshot arrives.
- **`tests/views/collection.test.ts` "draws what a form outside any pane holds, and registers nothing for it":** nothing is typed, so `unsaved(INSTANCE) === false` is vacuous, and the body check is only `data-form="edit"`.
  - A form outside a pane that wrote into some instance would pass. The report's DONE row 4 cites it as proof of brief item 4. It is an audit, and item 4 has no DOM proof.
- **`unsaved-forms.spec.ts:48-54` `addForm()`** presses Add whenever the form is missing. Case 1 therefore passes whether or not the form stays open. The report discloses this; the brief's "switch tabs and back, the text is there" is proven only after a press.
- **Superseded async path in the entry form is neither handled nor tested.** Probe P7: a value typed into another field while an add save was in flight was lost. It is not in the file and not in storage, and the form closed.
  - This is not new behaviour (the form closed on success before Q31), but the spec names the superseded path. `settleManifest` handles it for the editor; `EntryForm.save` clears the whole form draft.
- Async paths the spec names, as probed:
  - P5, add save in flight during a tab switch: draft cleared, no `#forms` record, no dialog, no page error. Correct.
  - P6, add save answering after the tab closed: dialog shown on close, no record left, no error. Correct.
  - P10, manifest edit typed during an in-flight save: the box keeps "P10 typed after", shows `editor.dirty` 1, and the close asks. A manifest save answering after the tab closed leaves no record. Correct.
  - P8, two forms in one instance: cancelling one still asks for the other, and cancelling both asks nothing. Correct.
  - Draft whose entry changed on disk: defect, see Spec (P4).
- Module-level mutable state: none. `FORMS_SUFFIX` (`form-drafts.ts:35`) and `INSTANCE_KEY` (`instance-context.ts:13`) are constants. Both stores are built per client in `createClientState` (`context.ts:98,136`), and `written` is per component.
- Tests asserting a defect, or loosened predicates: none found.

## 3. Standards
- **`Editor.svelte:26-29` head comment is false:** "the moment the snapshot's value moves, whatever it moved to is what the field shows". Probe P3b: once the snapshot moves to a third value and then back to the pre-save value, the field shows the saved value again.
- **`form-drafts.ts:6-8`:** "every view that draws an entry form writes its record whole from a parse that keeps only its own keys" is false for `Files.svelte:164-169`, which spreads the existing record (`...keep`). The conclusion (a separate `#forms` entry) still holds for the other seven host views.
- **DRY, `form-drafts.ts:88-95`:** `saved()` restates `EntryForm.svelte`'s `saveable` trim and empty-row rule (about lines 180-205) and diverges from it.
  - Tags are compared as whole trimmed text, not split on commas, so `"a,b"` over a base of `"a, b"` reports unsaved work the save would not write.
  - This is read from the code, not run.
- **Report "Doc text", HELP.md sentence:** "The editor's fields and the form values stay when the tab is switched away from" is false for eleven of the thirteen forms, which close on a switch (P2).
- **Report "Doc text", DESIGN.md line:** "the layout's close forgets a tab's form drafts with its state" holds for a tab close only; a pane close and a page close do not (P9).
- **Report's DESIGN.md:318 claim:** confirmed. The Q27 line names only `sourceDirty`. HELP.md:64 is the sentence the report cites. No other sentence in DESIGN.md, HELP.md or README.md is made false; I grepped "edits", "Revert", "entry form", "manifest editor" and "EntryForm".
- The rest of the standards check came back clean:
  - no history in the added comments;
  - non-ASCII gate clean;
  - no new catalog strings needed;
  - every file under its limit;
  - head comments present on the three new modules and the three new tests;
  - boundaries test extended for `state/instance-context` only.

## 4. Behaviour
- **Editor shows a value that is in neither the file nor the edits** (`Editor.svelte:96-105`).
  - Before: after a save, a field showed the file's value once pushed, and followed every later change on disk.
  - After (P3b): save "P3b saved", the file moves to "P3b third" and the box follows, the file goes back to the pre-save line, and the box shows "P3b saved" with `editor.clean` drawn. P3 on its own: the file restored to the old line gives the same stale box, and the tab closes without asking.
  - The report does not state this.
- **A tab asks about text the reader cannot see.** This happens after any toggle close (P1), and after a switch in the eleven component-state callers until Add or Edit is pressed. The report states it for five views and the cards.
- **A draft for an entry deleted or renamed on disk can never be seen or cancelled.** No card draws its form, and `formsDirty` (`form-drafts.ts:163-167`) reads only the stored drafts, so every close of that tab asks, and it survives reloads until the tab is closed. Read from the code, not run; not stated in the report.
- **An open form holding a value that differs from a changed entry closes without asking** (P4). The report lists it as "Stale base" without the case where the question fails to appear.
- **Leftover drafts in browser storage** (P9). After a pane close (dialog "Close this pane and the 2 tabs in it?", confirmed), `localStorage['oculus.ui.v1']` still holds the draft text, and still holds it after a reload.
  - Cause: `closePane` (`layout.svelte.ts:592-600`) and `closePage` (:409) never call `clearInstanceState`.
  - Nothing reads the leftovers. No code iterates `store.current.instances` (grep over `src/lib`), and instance ids are `crypto.randomUUID()` (`instance.ts:69`), so no later tab picks them up. They accumulate without bound.
  - The report states the pane close; the page close is the same (from code).
- **Every keystroke in any in-pane entry form now rewrites the whole ui record to localStorage**, and each read re-parses the instance's drafts (`form-drafts.ts:118-120`). Not measured.

## Not checked
- The Leads and Linkedin add forms across a switch in the browser. Probe P11 could not find a textbox in `[data-form="add"]` after pressing `leads.add` and timed out, so their instance-state open state rests on reading the code only.
- A browser run of the deleted-entry draft, the tags divergence, and the page-close leftover.
- Performance of the per-keystroke localStorage writes.
- The other browser specs beyond the three in the brief.
- Two editor instances of different projects in one pane in the browser.

Reviewer usage: about 50 tool uses, about 20 minutes of wall clock.
