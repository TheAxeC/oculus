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
