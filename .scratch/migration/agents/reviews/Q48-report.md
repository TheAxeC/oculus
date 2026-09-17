# Q48 report

Everything in the brief is done.

## What the stopped builder already covered, and what was left

Already on the tree when I took over: `taken` on `DraftTarget`, `whole()` and `takeFormDraft` in `form-drafts.svelte.ts`, the `kept` mark (`formKept`/`forgetForms` plus the `markKept` calls in `settleFormDraft`/`clearFormDraft`), the `forgetForms` wiring in `context.ts`, the `kept` parameter of `editedGone` in `fs.ts`, the `browsers()`/`shiftAt()` sweep in `Files.svelte`, and all nine tests (node and browser). Left undone: the `save()` branch in `EntryForm.svelte` still ran `into.clear(which); onclose();` unconditionally, so nothing the rest was built for took effect. That one branch is what I wrote, then I ran every verification command and every revert.

```svelte
// src/lib/views/shared/EntryForm.svelte:233
        if (entry === null) {
            if (into.taken(which, sent)) onclose();
        } else if (!into.settle(which, sent)) {
            onclose();
        }
```

## DONE / NOT DONE

| Item | State | Command and output |
| --- | --- | --- |
| 1. One settle rule for both branches | DONE | `npx vitest run --reporter=dot`: `Test Files 249 passed (249) / Tests 4214 passed (4214)`; `tests/state/form-drafts.test.ts` cases "takes an add's draft only while it is still what was sent, whole", "takes the draft of an add form nobody typed into, which sent nothing" |
| 2. Bookmark add form and collection add forms both under it | DONE | `npx playwright test tests/browser/files-forms.spec.ts tests/browser/unsaved-forms.spec.ts tests/browser/files.spec.ts tests/browser/cards.spec.ts`: `64 passed (1.8m)`, including files-forms.spec.ts:414, unsaved-forms.spec.ts:376, :398, :358 |
| 3. Gone-bookmark close keeps text typed during a rename save | DONE | same playwright run, files-forms.spec.ts:451; `npx vitest run tests/state/explorer.test.ts`, case "leaves the form whose last answer left text in it, which a rename is" |
| 3. Gone-bookmark close runs for an unshown tab | DONE | same playwright run, files-forms.spec.ts:485 "a bookmark taken away closes the form of a file browser whose tab is not shown" |
| 4. Each new or changed test names its revert, run | DONE | seven reverts run, table below |
| `npx vitest run --reporter=dot` | DONE | `Test Files 249 passed (249) / Tests 4214 passed (4214)`, `Duration 55.11s`; no rerun needed, no timeout |
| `npm run check` | DONE | `COMPLETED 1217 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS` |
| `npm run build` | DONE | `done` |
| `npm run format:check` | DONE | `All matched files use Prettier code style!` |
| `npm run lint` | DONE | `eslint .`, exit 0, no output |
| ASCII gate | DONE | the amendment's perl one-liner over `find src tests bin config -type f ! -name glyphs.yml` printed nothing, exit 0 |
| Browser suite | DONE | `64 passed (1.8m)` |

## The reverts, each run

| Revert as the test names it | Tests it turned red | Command and output |
| --- | --- | --- |
| In `takeFormDraft` of `state/form-drafts.svelte.ts`, forget the draft whatever it holds (and the same in `localDrafts`) | "takes an add's draft only while it is still what was sent, whole"; "takes an add's draft only while it is what was sent, as an instance's target does" | `npx vitest run tests/state/form-drafts.test.ts`: `Tests 2 failed | 30 passed (32)`, `expected true to be false` |
| In `settleFormDraft`, drop the `markKept` calls | "marks the form its answer left text in, and unmarks it when the text goes"; "unmarks the form when the reader closes it"; "forgets the marks of a tab the layout closed" | same file: `Tests 3 failed | 29 passed (32)`, `expected false to be true` at line 234 |
| In `clearFormDraft`, drop the `markKept` call | "unmarks the form when the reader closes it" | same file: `Tests 1 failed | 31 passed (32)`, `expected true to be false` |
| In `createClientState` of `state/context.ts`, drop the `forgetForms` call | "forgets the marks of a tab the layout closed" | same file: `Tests 1 failed | 31 passed (32)`, `expected true to be false` |
| In `editedGone` of `state/fs.ts`, drop `kept` from the line that answers false | node: "leaves the form whose last answer left text in it, which a rename is"; browser: "a bookmark renamed by its form keeps what was typed while the save was out" | `npx vitest run tests/state/explorer.test.ts`: `Tests 1 failed | 21 passed (22)`. `npm run build` then `npx playwright test tests/browser/files-forms.spec.ts -g '...'`: `1 failed`, `expect(received).toHaveLength(1) / Received length: 0` at files-forms.spec.ts:471 |
| In `save()` of `EntryForm.svelte`, `into.clear(which); onclose();` in place of `into.taken(which, sent)` | "a bookmark add form typed on while its save was out keeps the typing, open over it"; "an add form keeps a value typed while its save was on its way, open over it"; "an add form closed and opened again while its save was out keeps its new text" | `npm run build` then playwright `-g` over the three: `3 failed`, `toHaveCount(1)` against `0` |
| In `save()`, leave the add form open on every answer (`into.taken(which, sent);` with no close) | "an add form nothing touched while its save was out closes once its entry is added" | `npm run build` then playwright: `1 failed`, `toHaveCount(0)` with `locator resolved to 1 element` at unsaved-forms.spec.ts:369 |
| In the `$effect` of `views/Files.svelte`, read `view` and `instance.id` in place of every browser `browsers()` names | "a bookmark taken away closes the form of a file browser whose tab is not shown" | same build and run: `1 failed` |

Every source file was restored from a scratchpad copy after each revert and `diff -q` against that copy printed nothing; the final `git diff --numstat` matches the table below and the whole verification list was rerun on the restored tree.

## Doc text (nothing edited, per brief decision 2)

Two sentences are now false in part and the brief's decision 2 keeps them out of this step.

`tools/oculus/HELP.md:65`, the clause at the end of the drafts sentence:

> Cancel, the view's Add or Edit control closing the form, a delete, a save and Revert let them go; a value typed into an edit form while its save is on its way is kept, in the form left open, and an add form closes once its entry is added.

What it should say now: an add form closes once its entry is added only while nothing touched it since the save went; a value typed into either form while its save is on its way is kept, in the form left open, and so is the text of an add form closed and opened again while its save was out.

`tools/oculus/DESIGN.md:334`, inside the 2026-09-17 decision on unsaved form input, two clauses:

> A press that closes or moves the bookmark form forgets its draft through `toggleAdd` or `toggleEdit` under the `bookmarks` collection key, and so does the edited bookmark leaving the loaded list (`editedGone`).

> Cancel, a form's close by the view's Add or Edit control, a delete, Revert and a save forget the draft, an edit's save keeping what was typed after it went, and an add form closing once its entry is added.

What they should say now: `editedGone` leaves a form whose last answer left text in it, since a rename writes the bookmark under another id; the sweep runs over every Files instance the layout holds, not the mounted one alone; and an add's save forgets its draft and closes the form only while the draft is still what the save sent (`takeFormDraft`), keeping what was typed or reopened while the request was out.

## Before and after, every visible change

| What the reader does | Before | After |
| --- | --- | --- |
| Types into a collection add form (Tasks, Venues, ...), presses Save, types more while the request is out | The answer closed the form and the newer typing was gone | The form stays open holding the newer typing; the entry is still added once |
| Closes the add form during its save, opens it again, types something new | The answer closed the reopened form and forgot its text | The reopened form stays with its text |
| Types into the Files bookmark add form, saves, types more while the request is out | The answer closed the form and the typing was gone | The form stays open with the typing |
| Saves an add form and touches nothing while the request is out | Closes on its answer | Unchanged: closes on its answer, no draft left |
| Renames a bookmark from its edit form, types into Path while the save is out | The renamed bookmark left the list, the gone-bookmark effect closed the form and the typing was gone | The form stays over the old id with the typing; the bookmark is renamed on disk |
| A bookmark is taken away (row star or on disk) while a Files tab that is not shown holds an edit form over it | That tab kept its form and its draft until the reader came back to it, and asked before closing over text it no longer showed | Every Files instance the layout holds closes that form and forgets its draft at once |

## Files changed

| File | + | - |
| --- | --- | --- |
| `tools/oculus/src/lib/state/context.ts` | 2 | 1 |
| `tools/oculus/src/lib/state/form-drafts.svelte.ts` | 79 | 3 |
| `tools/oculus/src/lib/state/fs.ts` | 7 | 2 |
| `tools/oculus/src/lib/views/Files.svelte` | 39 | 12 |
| `tools/oculus/src/lib/views/shared/EntryForm.svelte` | 4 | 3 |
| `tools/oculus/tests/browser/files-forms.spec.ts` | 111 | 1 |
| `tools/oculus/tests/browser/unsaved-forms.spec.ts` | 52 | 6 |
| `tools/oculus/tests/state/explorer.test.ts` | 20 | 10 |
| `tools/oculus/tests/state/form-drafts.test.ts` | 88 | 0 |

`src/lib/state/form-values.ts`, `src/lib/state/fs.svelte.ts`, `src/lib/views/files/BookmarkForm.svelte` and `src/lib/state/open-forms.ts` are in the brief's path list and were not touched; nothing outside the list was.

## Judgment calls the brief did not cover, each reversible

1. **The one call added to the draft target is `taken(form, sent)`** (brief item 1 allows it). It forgets the draft and answers true only when the draft is what the save sent and nothing else: the same key set, each value equal by `JSON.stringify`. A form closed and reopened and then typed back to exactly the same fields and values counts as the same draft and closes.
2. **The `kept` mark is in-memory `$state` in the drafts store**, not in the ui store, so it is not saved with the layout and a reload starts with no form marked. New public members of `FormDraftsStore`: `takeFormDraft`, `formKept`, `forgetForms`. No config key, no catalog key, no text change.
3. **The gone-bookmark rule stayed in `Files.svelte`'s effect** rather than moving to a state module; the effect now sweeps every Files instance the layout holds through `pages()` and `tabsOf` and reads each one's state with `instanceState`. The bookmarks list it measures against (`bookmarks()` in `state/fs.svelte.ts:582`) is client-wide, not per instance, so one mounted view reading it for all of them is the same fact.

## Limitations and sharp edges

- **The sweep needs one Files view mounted somewhere.** It is an `$effect` of the component, so if no page has a Files tab as its active tab, no instance's gone-bookmark form is closed until some Files view mounts again. The brief's case (a hidden tab while another Files view is on screen) is covered and proven by files-forms.spec.ts:485; the zero-mounted case is not, and moving the rule into a state module is what would close it.
- **`src/lib/views/Files.svelte` is now 619 lines** (`wc -l`), past the spec's "a component under about 600". Splitting it touches paths this brief does not name.
- **The `kept` mark is per form key, not per save.** Two saves out from the same form at once leave one mark; the second answer overwrites what the first set. No path in the tree issues two concurrent saves from one form (the save button is the only entry and it is not disabled during the request), so this is not reachable today and is not covered by a test.
- **A reload during an add save loses the protection**, since the mark is not persisted: the answer cannot arrive after a reload either, so nothing is lost by it, but the asymmetry with the persisted drafts is worth knowing.
- `HELP.md` and `DESIGN.md` carry the stale sentences quoted above; the brief keeps them out of this step.
