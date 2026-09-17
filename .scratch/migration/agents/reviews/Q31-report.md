Everything in the brief is done. One premise of the brief does not hold, and it needs a ruling (details under "Premise found wrong"). In five host views, and in the edit toggle of every card, whether a form is open is the view's own component state. After a tab switch or a reload, the typed values come back but the form is closed until the reader presses Add or Edit again. The one form that literally stays open is the manifest editor's.

## DONE / NOT DONE

All commands were run from `tools/oculus` in the worktree.

| Deliverable | Status | Command and output |
|---|---|---|
| 1. The manifest editor keeps its edits in instance state: new `state/manifest-draft.ts`, registered in `state/context.ts`, cleared by Revert and by a successful save | DONE | `npx vitest run tests/state/manifest-draft.test.ts` passed. Browser cases 3 and 4 below passed. |
| 2. The entry form keeps its values per instance: `state/instance-context.ts` (`provideInstance`, `useInstance`), provided by `PaneView.svelte`; new `state/form-drafts.ts`; drafts cleared on save, Cancel, delete and tab close; the report is registered | DONE | `npx vitest run tests/state/form-drafts.test.ts` passed. Browser cases 1 and 2 passed. |
| 3. Closing asks through the existing guard; `ui.svelte.ts`, `closing.ts` and the close paths are unchanged | DONE | `npx playwright test tests/browser/unsaved-forms.spec.ts`: cases 2 and 4 passed |
| 4. A form outside a pane uses local state and registers nothing | DONE | `tests/views/collection.test.ts` cases "gives back what was typed into it..." and "draws what a form outside any pane holds..." passed |
| Node tests: set, read, clear on save and cancel, dirty only when different, two forms and two instances kept apart, empty, duplicate and colliding keys, reload, a host writing its record whole, tab close | DONE | `npx vitest run --reporter=dot`: **Test Files 235 passed (235), Tests 3946 passed (3946)**. No timing test needed a rerun. |
| Browser spec `tests/browser/unsaved-forms.spec.ts` | DONE | `npm run build` then `npx playwright test tests/browser/unsaved-forms.spec.ts tests/browser/collection.spec.ts tests/browser/tabs.spec.ts`: **10 passed (22.3s)** |
| `npm run check` | DONE | `COMPLETED 1174 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS` |
| `npm run build` | DONE | `built in 3.69s`, `done` |
| `npm run format:check` | DONE | `All matched files use Prettier code style!` |
| `npm run lint` | DONE | `eslint .` printed no findings |
| ASCII perl gate | DONE | printed nothing (exit 0) |
| Extra check on neighbouring specs | DONE | `npx playwright test tests/browser/history.spec.ts tests/browser/source.spec.ts tests/browser/leads.spec.ts`: **8 passed** |

Port 8792 was taken by another step's run twice. I waited with an `until lsof ...` loop and retried; I sent no signal and touched no lock.

## Reverts run
Each revert was built with `npm run build`, run, and then the file was restored from a scratch copy, checked with `cmp`.

| Case | Revert | Result |
|---|---|---|
| 1. Add form text survives a switch and a reload | Reverse the whole `EntryForm.svelte` diff (`git diff > patch; patch -R`) | red at line 92, `toHaveValue(TYPED)` |
| 2. Tab with a typed add form asks; Cancel takes the question away | (a) delete `ui.registerUnsaved(formDrafts.formsDirty);` in `context.ts`<br>(b) set Cancel back to `onclick={onclose}` | (a) red at line 112, `asked.toBeVisible()`<br>(b) red at line 121, `asked.toHaveCount(0)` |
| 3. Manifest edit survives a switch | Reverse the whole `Editor.svelte` diff | red at line 134 (`toHaveValue(LINE)`); case 4 also red at line 150 |
| 4. A manifest save clears the question | Delete `settleManifest(from, body, refused);` in `Editor.svelte` | red at line 161, `asked.toHaveCount(0)` |

## Premise found wrong (needs a ruling)
The brief says the form keeps typed values "without its thirteen callers changing", and the spec expects that after a switch and back "the text is there". In five host views, `adding` and `editing` are component state:
- `Collection.svelte:126-127`
- `Pillars.svelte:91-92`
- `Domains.svelte:61-62`
- `Venues.svelte:65-66`
- `Data.svelte:59-60`

A remount closes the form, and pressing Add or Edit again shows the restored text. `Leads.svelte` and `Linkedin.svelte` keep `adding` in instance state, so their add forms reopen as they were. The browser case therefore opens the add form again when it is closed (the helper `addForm`), and asserts nothing about whether it was closed.

Two consequences:
- A tab whose form is closed but still holds a draft asks before it closes, about text the reader cannot see.
- Closing a form with the host's own Add or Edit toggle, instead of the form's Cancel, keeps the draft.

The fix is to move `adding` and `editing` into instance state in those five views and their cards. Those paths are outside this step.

## Decisions (the orchestrator may reverse)
1. **Where form drafts live:** a separate ui-store entry per instance, keyed `<instance id>#forms` (`FORMS_SUFFIX` in `form-drafts.ts`), not inside the host's own record. Every host writes its record whole from a parse that keeps only its own keys (for example `parseCollectionState`, `collection.ts:72`), so a draft kept inside it would be dropped by the next filter change. It would collide only with an instance whose id is literally `<other id>#forms`; `newInstance` makes UUIDs. The test "keeps an instance whose id already ends in the suffix apart" covers two ids like that existing together.
2. **Clearing on tab close:** `context.ts` passes the layout `{ ...ui, clearInstanceState }`, a version that also calls `formDrafts.clearFormDrafts`, because `ui.svelte.ts` and `layout.svelte.ts` are outside my paths. A cleaner shape would be a `registerCleared` hook on the ui store.
3. **Form keys:** `JSON.stringify([collection, entryId | null])`, so an add form never shares a key with an entry whose id is `new`.
4. **"Differs from the entry":** each typed field stores the value the entry held when it was typed (`base`). Comparison trims text and drops empty metalist rows, as the save does. The manifest draft instead compares against the snapshot's current value through `editDiffers`, which the view now uses too.
5. **After a successful manifest save:** `settleManifest` drops the fields the server took and edits equal to the file. It keeps refused fields and fields typed again while the save was in flight. `Editor.svelte` also keeps a small per-instance overlay (`written`) that shows the saved value until the snapshot's value changes. Without it, the fields would briefly show the old values between the answer and the watcher's push.
6. **Boundaries test:** `tests/boundaries.test.ts` now allows the shell to import `state/instance-context`, and `tests/state/client-state.test.ts` lists the two new stores.
7. **Extra render cases:** I added render-to-string cases to `tests/views/collection.test.ts` and `tests/views/editor.test.ts`. They are audits of the read path, not DOM coverage.

## Limitations
- **Leftover drafts on pane or page close:** `closePane` (`layout.svelte.ts:592`) and `closePage` never call `clearInstanceState`, so the drafts of tabs closed that way stay in browser storage. Source drafts already behave the same way. Nothing reads them afterwards.
- **Two add forms in one view:** two add forms for the same collection in one instance share a draft.
- **Stale `base`:** if the entry changes on disk while a form draft sits unmounted, the stored `base` is out of date, and the close question uses it.
- **Manifest draft for a vanished project:** the close question counts any edit with words in it as unsaved.
- **Edits carried between editor tabs:** `Editor.svelte` edits used to be carried from one editor instance to another when a pane switched between two editor tabs. They are now keyed by instance.

## Doc text (not edited, per the brief)
HELP.md, add after the sentence ending "whether the close came from Delete or from the tab's own control." on line 64:
> That text is a source tab's unsaved edit, a field of the manifest editor not yet saved, or a value typed into a collection's add or edit form. The editor's fields and the form values stay when the tab is switched away from and when the page reloads; a save, Revert or the form's Cancel lets them go.

DESIGN.md, a new line in the dated list:
> - 2026-09-17, unsaved form input is instance state. The manifest editor's edits live in its instance's ui record through `state/manifest-draft.ts`, and an entry form's typed values in a record of their own beside the instance's, `<id>#forms`, through `state/form-drafts.ts`, keyed by the collection and the entry's id or null for adding; a host view writes its own record whole, which is why the form's drafts are not inside it. The pane puts the reader of the instance it mounts into a component context (`state/instance-context.ts`), so the form finds its instance without a prop through its callers, and a form outside a pane keeps its values locally and registers nothing. Both stores register with `registerUnsaved` beside `sourceDirty`, so a tab holding either asks before it closes. A save, Revert, Cancel and a delete forget the draft, and the layout's close forgets a tab's form drafts with its state. Package Q31.

The Q27 line (DESIGN.md:318) says "which the source store registers `sourceDirty` with". That is now incomplete, and the line above supersedes it.

## Visible changes
- **Entry form, before:** text typed into a collection add or edit form was lost on a tab switch or reload, and the tab closed without asking. **After:** the text comes back when the form is opened again, and the tab asks ("ui.tab_close_dirty") until the form is saved or cancelled.
- **Manifest editor, before:** edits were lost on a tab switch or reload, the tab closed without asking, and after a save the edits stayed in place until the snapshot arrived. **After:** edits survive a switch and a reload, the tab asks while any edit differs, and a successful save clears them while the saved value stays shown.

## Files changed (lines)
Modified (`git diff --stat`):
- `src/lib/shell/PaneView.svelte` +9
- `src/lib/state/context.ts` +20 / -1
- `src/lib/views/Editor.svelte` +51 / -17 (328 lines)
- `src/lib/views/shared/EntryForm.svelte` +66 / -16 (447 lines)
- `tests/boundaries.test.ts` +1
- `tests/state/client-state.test.ts` +2
- `tests/views/collection.test.ts` +41
- `tests/views/editor.test.ts` +18 / -1

New:
- `src/lib/state/form-drafts.ts` (170)
- `src/lib/state/manifest-draft.ts` (118)
- `src/lib/state/instance-context.ts` (26)
- `tests/state/form-drafts.test.ts` (189)
- `tests/state/manifest-draft.test.ts` (167)
- `tests/browser/unsaved-forms.spec.ts` (168)

Changed names grepped: `grep -rn "registerUnsaved|unsaved|tab_close_dirty|sourceDirty" HELP.md DESIGN.md README.md src tests config` and `grep -rn "formDrafts|manifestDraft|instance-context|provideInstance|useInstance" HELP.md DESIGN.md README.md`. The only doc hits the change affects are HELP.md:46 (still true), HELP.md:64 and DESIGN.md:318, covered in the Doc text above.

All paths are under `/Users/axelfaes/workspace/research-hub/.agents/worktrees/q31/tools/oculus/`.


# Repair round

Everything in the repair round is done. Two things are left outside my paths, and neither is an item of the round:
- **Leads and Linkedin.** Their Add toggles (`Leads.svelte:120`, `Linkedin.svelte:110`) still close the add form without forgetting its draft. Both files are outside my paths.
- **Files.** Its bookmark form's open state stays as it was, booked for Axel as you said.

## DONE / NOT DONE (the eight items)

| # | Item | Status | Proof (command, output) |
|---|---|---|---|
| 1 | Open state is instance state in Collection, Pillars, Domains, Venues and Data. Every host Add toggle and card Edit toggle closing a form forgets its draft. The browser case no longer presses Add. | DONE | `bash pw.sh tests/browser/unsaved-forms.spec.ts`: cases "text typed into an add form is there, in the open form, after a tab switch and a reload", "text typed into a card's edit form is there...", and "...Cancel and the Add toggle take the question away" passed. `tests/state/form-drafts.test.ts` "a form's close" (2 cases) passed. |
| 2 | Dirty is measured against the entry as it is now; a draft whose entry is gone is dropped and never asks. Node cases plus P4 in the browser. | DONE | form-drafts.test.ts "compares an edit form with the entry as the snapshot holds it now" and "never counts a draft whose entry the collection no longer holds, and drops it at the next write" passed. Browser case "an edit typed back to the entry asks once the file has changed under it" passed. |
| 3 | One rule for what the save writes | DONE | `state/form-values.ts` `savedValue` (with `controlValue` and `sameSaved`) is called by `EntryForm.saveable` and by the drafts' `differs`. `tests/state/form-values.test.ts` passed, and form-drafts "counts nothing the save would write unchanged" (`"a,b"` over `"a, b"` reports clean) passed. |
| 4 | The `written` overlay goes; its head comment is made true | DONE | grep for `written` in `Editor.svelte` finds nothing. The head comment now reads: "A save the server took drops the edits it took, keeping an edit typed while it was on its way and one the server refused. The page sees its own write when the watcher pushes the rebuilt snapshot; until then a field whose edit the save took shows the snapshot's value." |
| 5 | A value typed while an entry form's save is in flight is kept | DONE | `settleFormDraft` / `DraftTarget.settle` drop only the fields whose value is the one sent. The form stays open over what is left (`EntryForm.save`: `if (answer.ok && answer.refused.length === 0 && !into.settle(which, sent)) onclose();`). form-drafts "forgets what it sent and keeps a value typed while it was on its way" passed. |
| 6a | An entry form's save clears its draft (browser, with revert) | DONE | "a save of the add form takes its draft away" passed |
| 6b | A delete clears it | DONE | Browser "a delete from the edit form takes its draft away" passed; node "forgets a draft a cancel or a delete threw away" passed |
| 6c | A form outside a pane types a value and no instance holds a draft (real proof, with revert) | DONE | form-drafts "a form outside any pane > keeps what is typed in its own target, and no instance holds a draft" passed. EntryForm's only path to its values is `draftTarget(formDrafts, within?.() ?? null, local)`, which this test drives with a null instance. The old vacuous render case in `tests/views/collection.test.ts` is removed. |
| 7 | False sentences | DONE | `form-drafts.svelte.ts` head comment now says "most hosts write it whole from a parse that keeps only their own keys". Doc text below. |
| 8 | Report of visible changes | DONE | Section below |

## Verification (from tools/oculus in the worktree)
- `npx vitest run --reporter=dot`: **Test Files 236 passed (236), Tests 3961 passed (3961)**. No timing rerun was needed.
- `npm run check`: `COMPLETED 1177 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`
- `npm run build`: `built in 5.57s`, `done`
- `npm run format:check`: `All matched files use Prettier code style!`
- `npm run lint`: `eslint .`, no findings
- ASCII perl gate: printed nothing, exit 0
- `npm run build` then `npx playwright test tests/browser/unsaved-forms.spec.ts tests/browser/collection.spec.ts tests/browser/tabs.spec.ts`: **14 passed (24.9s)**
- Extra: `npx playwright test tests/browser/views.spec.ts tests/browser/venues-themes.spec.ts tests/browser/history.spec.ts tests/browser/leads.spec.ts tests/browser/source.spec.ts tests/browser/files.spec.ts`: **23 passed**

Every Playwright run went through `scratchpad/q31-builder/pw.sh`, which builds, waits with lsof until port 8792 is free, and retries on "already used". It sent no signal and touched no lock.

## Reverts run
Each revert was restored from `scratchpad/q31-builder/keep/` and checked with `cmp`. Browser reverts were rebuilt before running.

| Test | Revert | Result |
|---|---|---|
| Browser 1-3 (form open after switch and reload; card form open after switch; toggle clears) | `patch -R` of the whole `Collection.svelte` diff | 3 failed: line 105 `toHaveValue(TYPED)` (element not found), line 126 `toHaveValue`, line 154 `draftKeys toEqual([])` |
| Browser 3 (Add toggle forgets) | Delete `if (open) clearFormDraft(...)` in `toggleAdd` | red at line 154 |
| Browser P4 | `differs` compares with `typed.base` only | red at line 190, `asked.toBeVisible()` |
| Browser 6a (save clears) | `!into.settle(which, sent)` replaced with `true` | red at line 206, `draftKeys toEqual([])` |
| Browser 6b (delete clears) | Delete both `into.clear(which)` in `EntryForm.remove` and the clear in `toggleEdit` | red at line 232 |
| Node: compare with the entry now | Same as the P4 revert | 1 failed, "compares an edit form with the entry as the snapshot holds it now" |
| Node: gone entry never counts | Delete `if (entry === null) return false;` | 1 failed, "never counts a draft whose entry..." |
| Node: gone entry dropped at the next write | Delete `&& !gone(form)` in `keep` | same test failed |
| Node: tags rule | `savedValue` returns the text for tags | 3 failed: "counts nothing the save would write unchanged", "trims text, splits tags...", "calls two values the same..." |
| Node: value typed during a save is kept | `unsent` keeps nothing | 1 failed, "forgets what it sent and keeps a value typed while it was on its way" |
| Node: outside a pane | `draftTarget` returns `instanceDrafts(store, instance ?? '')` | 1 failed, "keeps what is typed in its own target, and no instance holds a draft" |

The delete revert needs two edits. With only `into.clear(which)` removed from `EntryForm.remove`, the case stays green, because in the Collection host the form's close calls the card's `toggleEdit`, which clears the same draft. The line in `remove` still matters for a host whose close does not clear, which today is Files' bookmark form.

## Doc text
**HELP.md**, add after the sentence ending "whether the close came from Delete or from the tab's own control." (line 64):
> That text is a source tab's unsaved edit, a field of the manifest editor not yet saved, or a value typed into an entry form that differs from the entry as the file holds it now. The editor's fields, and in the Tasks, collection, Pillars, Domains, Venues and Data views the open add and edit forms with what was typed into them, are there again after the tab is switched away from and after a reload. Cancel, the view's Add or Edit control closing the form, a delete, a save and Revert let them go; a value typed while a save is on its way is kept, in a form left open. The bookmark form of the Files view does not stay open across a switch.

**DESIGN.md**, a new line in the dated list:
> - 2026-09-17, unsaved form input is instance state. The manifest editor's edits live in its instance's ui record through `state/manifest-draft.ts`. An entry form's typed values live in a record of their own beside the instance's, `<id>#forms`, through `state/form-drafts.svelte.ts`, keyed by the collection and the entry's id or null for adding; most host views write their own record whole from a parse of their own keys, which is why a form's drafts are not inside it. Which add and edit forms are open is instance state too (`state/open-forms.ts`, read into the Collection, Pillars, Domains, Venues and Data states), so a form comes back open with what was typed into it; the Files bookmark form is not yet among them. The pane puts the reader of the instance it mounts into a component context (`state/instance-context.ts`), so the form finds its instance without a prop through its callers, and a form outside a pane keeps its values in a local target and registers nothing. Whether a draft is unsaved is decided against the entry as the snapshot holds it now, through the save's own rule in `state/form-values.ts`; a draft whose entry the snapshot's collection no longer holds is never counted and is dropped at the instance's next draft write, and an add form or an entry outside the snapshot's collections is compared with what its controls opened holding. Both stores register with `registerUnsaved` beside `sourceDirty`, so a tab holding either asks before it closes. Cancel, a form's close by the view's Add or Edit control, a delete, Revert and a save forget the draft, a save keeping what was typed after it went. A tab's close forgets its instance's form drafts with its state; a pane close and a page close forget neither. Package Q31.

The Q27 line (DESIGN.md:318), "which the source store registers `sourceDirty` with", is superseded by the line above.

## Visible changes (before, then after)
1. **Collection, Pillars, Domains, Venues and Data add forms.** Before: a tab switch or reload closed the add form and lost what was typed. After: the form is open again with the typed text.
2. **Card edit forms in those views.** Before: a switch or reload closed the card's edit form and lost the text. After: the same card's edit form is open again with the text.
3. **Close question for entry forms.** Before: closing a tab never asked about entry-form text. After: it asks while any typed value differs from the entry as the file holds it now. A value typed back to the entry asks nothing, and asks again if the file later changes under it.
4. **Closing a form any other way than Cancel.** Before: pressing the view's Add toggle, or another card's Edit, simply closed the form. After: it closes the form and forgets its draft, as Cancel does.
5. **Entry form save with typing in flight.** Before: a successful save always closed the form, losing anything typed while the request was out. After: that later typing is kept and the form stays open over it. With nothing typed after the save, the form closes as before.
6. **Manifest editor across a switch or reload.** Before: edits were lost and the tab closed without asking. After: edits come back, and the tab asks while an edit differs from the file.
7. **Manifest editor after a save.** Before the step: edits stayed until the snapshot arrived. After: a successful save drops the edits it took (keeping refused ones and ones typed during the save), and the field shows the snapshot's value, which is the old value until the watcher pushes.
8. **Two editor tabs in one pane.** Before: edits typed in one editor tab showed in the other editor tab of the same pane, for another project. After: each editor tab keeps its own edits.

## Decisions (the orchestrator may reverse)
- Instance state gained two keys, `adding: boolean` and `editing: string` (`''` for none), in the Collection, Pillars, Domains, Venues and Data states. Leads and Linkedin already use `adding`.
- The close logic lives in the store: `toggleAdd` and `toggleEdit` on `formDrafts` forget the closing form's draft and return the next state. Hosts call `write({ adding: toggleAdd(...) })`.
- Each typed field stores `{ value, kind, base }`. `base` is used only for add forms and for entries the snapshot's collections do not carry (bookmarks, or no snapshot yet).
- A gone-entry draft is dropped at the instance's next draft write, not by the close question, so the question stays free of side effects. Until then it sits in storage and is never counted.
- `applyCollectionFilters` now takes `Pick<CollectionState, 'search' | 'statuses' | 'hidden'>`.
- In `context.ts`, tab close clears `formsKey(id)` directly, so the layout needs no reference to the drafts store.

## Limitations
- The Leads and Linkedin Add toggles still close without forgetting the draft, so the close question can still appear there over a hidden draft (see first line).
- Drafts are left in browser storage after a pane or page close (booked for Axel).
- Every keystroke in an in-pane entry form rewrites the ui record in localStorage. Not measured.
- A form whose save renames the entry's identity keeps any text typed during the save under the old id, which is then dropped at the next write.
- The source-text audit in `tests/views/collection.test.ts` now looks for `if (saved !== '') return saved;`. It remains an audit, not coverage.

## Files changed (lines)
Modified (`git diff --stat`, +/-):
- `src/lib/shell/PaneView.svelte` +9
- `src/lib/state/collection.ts` 17
- `src/lib/state/context.ts` 26
- `src/lib/state/datasets.ts` 11
- `src/lib/state/lines.ts` 14
- `src/lib/state/venues.ts` 9
- `src/lib/views/Collection.svelte` 19 (370 lines)
- `src/lib/views/Data.svelte` 23
- `src/lib/views/Domains.svelte` 22
- `src/lib/views/Editor.svelte` 40 (304 lines)
- `src/lib/views/Pillars.svelte` 42 (274 lines)
- `src/lib/views/Venues.svelte` 33 (259 lines)
- `src/lib/views/shared/EntryForm.svelte` 133 (416 lines)
- `tests/boundaries.test.ts` +1
- `tests/state/client-state.test.ts` +2
- `tests/state/collection.test.ts` 19
- `tests/state/datasets.test.ts` 16
- `tests/state/venues.test.ts` 12
- `tests/views/collection.test.ts` 32
- `tests/views/editor.test.ts` 19

New:
- `src/lib/state/form-drafts.svelte.ts` (296), replacing `form-drafts.ts`
- `src/lib/state/form-values.ts` (64)
- `src/lib/state/open-forms.ts` (21)
- `src/lib/state/manifest-draft.ts` (118)
- `src/lib/state/instance-context.ts` (26)
- `tests/state/form-drafts.test.ts` (357)
- `tests/state/form-values.test.ts` (71)
- `tests/state/manifest-draft.test.ts` (167)
- `tests/browser/unsaved-forms.spec.ts` (281)

The five cards (`EntryCard`, `DomainCard`, `VenueCard`, `LineCard`, `DatasetCard`) needed no change: they take `editing` and `onedit` as props, and `onedit` now routes through `toggleEdit`.

Grep after the rename: `grep -rn "form-drafts\.ts|state/form-drafts'|clearFormDrafts|written" src tests HELP.md DESIGN.md README.md` finds no stale reference; the only `written` hits are unrelated uses in `ui/`, `shell/` and `server/`.

All paths are under `/Users/axelfaes/workspace/research-hub/.agents/worktrees/q31/tools/oculus/`.
