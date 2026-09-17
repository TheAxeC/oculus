# Step Q43 builder report

Everything in the brief is done. HELP.md and DESIGN.md are not edited, as decision 2 says; their new lines are in "Doc text" below.

Paths are relative to `tools/oculus` in the worktree `/Users/axelfaes/workspace/research-hub/.agents/worktrees/q43`.

## DONE / NOT DONE

| Item | State | Proof (command and output) |
|---|---|---|
| 1. The open form (`form`) and the bookmark being edited (`editing`) are `FilesView` fields, written through `patch()` | DONE | `npx vitest run tests/state/explorer.test.ts`: 18 passed. The Files spec (below) checks a switch and a reload. |
| 2. The root and workspace form text is `FilesView.typed`, cleared when the form closes or its action succeeds | DONE | Same explorer run. Browser case "the root form is open with its typed folder after a tab switch, and cancel lets it go" passed. |
| 3. Closing the bookmark form by its own button, another row's edit or Cancel forgets its draft, through `toggleAdd`/`toggleEdit` with `BOOKMARK_COLLECTION` | DONE | Browser case "the bookmark form is open with its typed label ... forgets the label": `draftRecords` is `[]` after the close. Cancel still clears through EntryForm's `target.clear`. |
| Test 1, node: `filesViewOf` reads and defaults the three fields; the view draws the bookmark form open from instance state | DONE | explorer: 18 passed; `npx vitest run tests/views/files.test.ts`: 33 passed |
| Test 2, browser: bookmark form with its label after a switch and after a reload; closing by the add button leaves no `#forms` record; root form text after a switch | DONE | `npx playwright test tests/browser/files.spec.ts tests/browser/files-forms.spec.ts`: `27 passed (55.7s)` |
| Test 3: each new test names its revert, and the revert was run | DONE | Table below |
| `npx vitest run --reporter=dot` | DONE | `Test Files  240 passed (240)` / `Tests  4051 passed (4051)` |
| `npm run check` | DONE | `COMPLETED 1196 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS` |
| `npm run build` | DONE | `built in 4.77s` |
| `npm run format:check` | DONE | `All matched files use Prettier code style!` |
| `npm run lint` | DONE | eslint printed nothing, exit 0 |
| ASCII gate (the perl form) | DONE | printed nothing |

## Reverts run (each change applied, the test run, the file restored)

| Test | Revert | Result |
|---|---|---|
| explorer "reads the open form, the bookmark it edits and the typed line..." | `filesViewOf` reads `editing`/`typed` whatever form is open | red |
| explorer "opens a section's form..." | `formShown` keeps `now.typed` | red |
| explorer "opens one bookmark's form..." | `editShown` treats a press as never the same bookmark | red |
| explorer "names the bookmark form a move closes..." | `bookmarkLeft` returns null whenever the next form is a bookmark form | red |
| explorer "closes the form an answer was for only while..." | `formSettled` always closes | red |
| files.test "draws the bookmark form open when the instance state says it is..." | `markForm` reads a component `$state('')`; also: drawn whenever `view.form` is 'bookmark' | red, both |
| files.test "draws the root form open with the line..." | `value={''}` | red |
| browser "the bookmark form is open with its typed label..." | `move()` keeps the forms in a component `$state`; also: the `toggleAdd` call removed | red at `toHaveValue` after the switch; red at `draftRecords` `[]` |
| browser "the root form is open with its typed folder..." | `typed` held in a component `$state` | red, `Received: ""` |
| browser "a root added while another form was opened..." | `confirm()` closes the form without `settle(asked)` | red, workspace box not found |
| browser "a bookmark added while another bookmark's form was opened..." | `closeMark` closes whatever bookmark form is open; also: `BookmarkForm` reads `editing` when the close runs instead of `opened` | red, both (edit form not found) |

## What was built

- **`src/lib/state/fs.ts`:**
  - `FilesView` is now `FilesForms & {expanded, selected, filter, collapsed}`, with `FilesForms = { form: FilesForm; editing: string; typed: string }`.
  - `filesViewOf` sets `editing` only when `form === 'bookmark'` and `typed` only for `root` or `workspace`. Any other form name reads as ''.
  - New pure functions: `formShown`, `editShown`, `bookmarkLeft`, `formSettled`.
- **`src/lib/views/Files.svelte`:**
  - The three `$state` variables are gone and the view reads `view.form`, `view.editing` and `view.typed`.
  - `move(next)` forgets the draft of the bookmark form it closes (`toggleAdd(instance.id, BOOKMARK_COLLECTION, true)` or `toggleEdit(instance.id, BOOKMARK_COLLECTION, left.editing, next.editing)`), then patches.
  - `confirm()` and `closeMark()` close the form only through `settle(asked)`, which re-reads the instance state.
  - The head comment now names the new fields.
- **New `src/lib/views/files/BookmarkForm.svelte`** (45 lines): a small wrapper around EntryForm. It records which bookmark it was opened for when it mounts (`const opened = untrack(() => editing)`) and passes that bookmark to `onclose`. Files mounts it inside `{#key view.editing}`, so each bookmark gets its own form.
- **Async paths:**
  - In flight: the form closes when the answer arrives.
  - Superseded (the reader opened another form or kept typing): the answer leaves the form as the reader left it.
  - Tab already closed: nothing is written, so the closed tab's record is not recreated.
  - Proven by the `formSettled` node cases and the two held-request browser cases (`page.route` holds the POST).

## Judgment calls the orchestrator may reverse

1. Opening the root or workspace form while the bookmark form is open also forgets the bookmark draft, the same as any other close of that form.
2. A bookmark form open over an entry is drawn only once that entry is in the loaded bookmarks (`markForm`). After a reload it appears when the list arrives. Before, a missing entry drew the add form under the edited entry's drafts.
3. `{#key view.editing}` remounts the form when moving between adding and editing, or between two bookmarks. Before, one EntryForm stayed mounted with a changed `entry` prop, carrying over its `asked` and `sure` state.
4. `files.spec.ts` would have passed 1000 lines, so the four new browser cases are in a new `tests/browser/files-forms.spec.ts`. `scratch`, `row` and `nestedRoot` moved into a new helper, `tests/browser/files.ts`, and `files.spec.ts` imports them (845 lines now). Both new files are outside the brief's listed paths; the helper has a precedent in `tests/browser/style.ts`.
5. `tests/views/type-scale.test.ts` gains the line `'files/BookmarkForm.svelte': ''`, since its audit lists every view file. It is outside the listed paths.
6. `draftRecords` in `files-forms.spec.ts` repeats the 6-line `draftKeys` helper of `unsaved-forms.spec.ts`, which this step was not allowed to edit.

## Limitations

- The text in the root and workspace forms is not registered as unsaved work, so closing a tab that holds it asks nothing. Only entry-form drafts register through `registerUnsaved`, and wiring this would need `state/context.ts`, which is outside this step's paths.
- The refusal and outcome lines (`note`, `said`) stay component state and are gone after a switch, as before.
- The worktree's `.scratch/.../briefs/Q43.md` shows as modified. That change was there before this step and is identical to main's working copy; it is not mine.

## Before and after (visible changes)

- **Bookmark form:**
  - Before: after a switch or reload it was closed, and the typed label came back only when the form was reopened.
  - After: it is open with the label.
- **Root and workspace form:**
  - Before: closed and empty after a switch.
  - After: open with the typed line.
- **Closing the bookmark form with + bookmark, a row's edit, or by opening the root or workspace form:**
  - Before: the draft stayed in `<id>#forms`, so the tab could ask about text it did not show.
  - After: the draft is forgotten.
- **Saving a root, workspace or bookmark, then opening another form before the answer:**
  - Before: the answer closed the newer form.
  - After: the newer form stays open.

## Doc text

**HELP.md line 64.** Replace "in the Tasks, collection, Pillars, Domains, Venues and Data views the open add and edit forms with what was typed into them, are there again after the tab is switched away from and after a reload." with:

"in the Tasks, collection, Pillars, Domains, Venues and Data views the open add and edit forms with what was typed into them, and in the Files view the open bookmark form with what was typed into it and the root or workspace form with its line, are there again after the tab is switched away from and after a reload."

Replace "The bookmark form of the Files view does not stay open across a switch." with:

"In the Files view, + bookmark or a bookmark's edit control closing the bookmark form lets what was typed go, and so does opening the root or workspace form over it; a save answered after another form was opened leaves that form open."

**DESIGN.md line 332.** Replace "; the Files bookmark form is not yet among them." with:

"; the Files view keeps its open form, the bookmark it edits and the line typed into its root or workspace form as `form`, `editing` and `typed` of `FilesView` (`state/fs.ts`), forgets the bookmark form's draft through `toggleAdd` and `toggleEdit` under the `bookmarks` collection key whenever a press closes that form, and closes a form on a write's answer only while it is still open as the request left it (`formSettled`), the bookmark form naming the bookmark it was mounted for (`views/files/BookmarkForm.svelte`)."

## Files changed

| File | Lines added / removed |
|---|---|
| `src/lib/state/fs.ts` | +68 / -3 (440 total) |
| `src/lib/views/Files.svelte` | +89 / -54 (560 total) |
| `src/lib/views/files/BookmarkForm.svelte` | new, 45 |
| `tests/state/explorer.test.ts` | +109 / -3 |
| `tests/views/files.test.ts` | +42 / -3 |
| `tests/views/type-scale.test.ts` | +1 |
| `tests/browser/files.spec.ts` | +4 / -48 (845 total) |
| `tests/browser/files.ts` | new, 53 |
| `tests/browser/files-forms.spec.ts` | new, 186 |

Name grep: `grep -rn "closeForm\|FilesForms\|formSettled\|bookmarkLeft\|BookmarkForm\|not yet among\|does not stay open across" src tests config HELP.md DESIGN.md README.md`. `closeForm` has no hits left. The only doc hits are HELP.md:64 and DESIGN.md:332, which the Doc text covers.


NOT DONE, ruling 2 in part: the bookmark add form's typed text is still cleared when a save sent from an earlier opening of that form answers. The reopened form now stays open, but its Label is empty (probe below). The clear happens in `views/shared/EntryForm.svelte:231-233` (`into.clear(which)` on every successful add). That file is outside my paths, and the fix clashes with a written rule, so it is a stop: the "Rule clash" section below. Everything else in rulings 1 to 9 is done.

Paths are relative to `tools/oculus` in the worktree `/Users/axelfaes/workspace/research-hub/.agents/worktrees/q43`.

## Repair round

### Rulings

| Ruling | State | Proof |
|---|---|---|
| 1. An answer after a tab switch settles in the Files instance it was sent from | DONE | Browser: "a root added while the tab is switched away closes its form in the file browser it came from" and "a bookmark added while the tab is switched away closes its form ..." both passed. |
| 2. An answer closes only the opening it was sent from | DONE for the form and the root/workspace line; NOT DONE for the bookmark add form's text | Node: explorer "closes the form an answer was for only while that opening is open ...". Browser: "a root added while its form was closed and opened again leaves the reopened form and its line" passed. |
| 3. A row's edit moving a typed edit form forgets the first draft | DONE | Browser: "a row's edit moving a typed edit form to another bookmark forgets what was typed" passed. |
| 4. The key block remount | DONE | Browser: "an edit form opened from the add form is the one its Cancel closes" passed. |
| 5. Edited bookmark removed while its form is open | DONE | Browser: "a bookmark taken away while its typed edit form is open closes the form, and the tab closes without asking" passed. Node: explorer "finds the edit form whose bookmark the loaded file no longer holds". |
| 6. The root/workspace line is asked about on close | DONE | Node: explorer "a typed root or workspace line as unsaved text" (2 cases). Browser: unsaved-forms "a tab holding a file browser's typed root line asks before it closes, and an empty line does not" passed. |
| 7. False and inaccurate comments | DONE | Details below |
| 8. One shared browser helper; import order | DONE | New `tests/browser/forms.ts`, imported by both specs; `grep -rn "draftRecords\|function draftKeys\|switchAndBack(page)"` finds only `tests/browser/forms.ts:17` |
| 9. Doc text | DONE | "Updated Doc text" section below |

**Ruling 1.**
- `confirm()` takes `const owner = instance.id` and `const asked = formsOf(view)` before the request, then calls `settle(owner, asked)`. `settle` reads `instanceState(owner)` and writes through `patchAt(owner, closed)` (`Files.svelte:329-345`).
- `BookmarkForm.svelte` takes `opened = untrack(() => ({ owner, forms }))` at mount and closes with `onclose(opened.owner, opened.forms)`.
- Both browser cases release the held POST while Status is showing, wait for the response, and then check:
  - the Files record reads `form: ''`;
  - `formsElsewhere` is `[]`, so no other record gained a `form`;
  - on return, the form count is 0;
  - the bookmark case also finds `draftKeys` at `[]`.
- Deviation from the ruling's wording: the release happens while the Status tab shows, not after switching back. After switching back, `instance.id` names the Files instance again, so the old code passes and the case would not catch the defect.

**Ruling 2.**
- `FilesForms` gains `opening: number`. `formShown` and `editShown` add one on every press. `formSettled` compares `opening` too, and keeps the count when it closes.
- `filesViewOf` reads `opening` only when it is a safe integer at or above 0.
- The key block is `{#key \`${instance.id} ${view.opening}\`}`, so a form is mounted once per instance and per opening. Keying on the instance also covers a pane that reuses the Files component for another Files tab.
- The browser case types the same folder after reopening, so only `opening` tells the two openings apart.

**Ruling 5.**
- `$effect` in `Files.svelte:396-399`: `if (editedGone(view, marks)) shift(editShown(view, view.editing));`.
- `editedGone` (`fs.ts`) answers true only when the bookmarks list is read (`!loading`, `error === ''`) and does not hold `editing`.
- `shift` forgets the draft through `toggleEdit`, and sets no refusal or outcome line.

**Ruling 6.**
- `context.ts:145-149`, below the `manifestDirty` line and away from main's comment at 104-107:
  ```ts
  ui.registerUnsaved((id) => {
      const found = layout.pages().flatMap((page) => findInstance(page.workbench.root, id) ?? []);
      return filesLineTyped(found[0]?.instance.view, ui.instanceState(id));
  });
  ```
- `filesLineTyped(view, state)` in `fs.ts` is `view === 'files' && filesViewOf(state).typed !== ''`. `typed` reads as '' unless a root or workspace form is open.

**Ruling 7.**
- `Files.svelte:26-36`: the head comment names `note`, `said` and `removing` as component state lost on a switch, and says the owner and forms are taken before a request.
- The `markForm` comment and the view test comment state the hazard as the review states it: an add form drawn where the edit form belongs, whose Save adds a new bookmark and hides what was typed.
- The view test also covers the unread-list case: a client whose bookmarks have not loaded draws no form.
- `explorer.test.ts:6-12` names what the browser cases cover.
- `BookmarkForm.svelte`'s head comment names the owner and the opening.

**Ruling 8.**
- `tests/browser/forms.ts` exports `uiInstances`, `draftKeys` and `switchAndBack(page, tab, view)`.
- In `unsaved-forms.spec.ts`, its own `draftKeys` and `switchAndBack` are removed, the import is added, and the 2 `switchAndBack` calls pass the Tasks tab and view.
- Imports in `explorer.test.ts` and `Files.svelte` are case-insensitive alphabetical (`editedGone, editShown`; `formSettled, formShown, formsOf`).

### Probe for ruling 2 (bookmark form)
A temporary spec `tests/browser/zz-probe-q43.spec.ts` was run, then deleted (`ls tests/browser | grep zz` prints nothing). Steps:
1. Open the add form and type Label/Root/Path.
2. Hold `/api/write` and press Save.
3. Press + bookmark twice (close, reopen) and type `second typed` into Label.
4. Release the request.

Output: `PROBE form count 1`, `PROBE label ` (empty), `PROBE drafts []`, `1 passed`.

### Rule clash (a stop for the orchestrator)
- **What ruling 2 asks:** "leaves the reopened one and its text alone".
- **The written rule it clashes with:** in `EntryForm.save()` (`EntryForm.svelte:189-195, 231-233`), "An add form closes and forgets its draft once the entry is added". `unsaved-forms.spec.ts` "an add form closes once its entry is added, and a second save cannot add another" tests that rule.
- **Why Files cannot fix it:** the reopened add form uses the same draft key (`formKey('bookmarks', null)`), and EntryForm cannot tell text typed during the save from text typed into a new opening.
- **What a fix needs:** a change in `views/shared/EntryForm.svelte`, for example a host callback that answers whether the draft still belongs to the request. That file is outside my paths, and the change alters a shared form's contract.

### Reverts run (each applied, the test run, the file restored byte for byte)

**Node, `npx vitest run tests/state/explorer.test.ts`, each red:**
- `formSettled` without the `opening` compare: red.
- `formShown` keeping `now.opening`: red.
- `filesViewOf` taking any number as `opening`: red.
- `editedGone` without the loading and error check: red.
- `filesLineTyped` without the `files` view check: 2 cases red.
- The `context.ts` reporter answering false: "reaches the tab close through the client's unsaved question" red.

**Browser, rebuilt before each:**

| Revert | Case | Result |
|---|---|---|
| `confirm()` settles through `instance.id` after the answer | root switched away | red at the `form: ''` poll |
| BookmarkForm closes with the `owner` prop read late | bookmark switched away | red at the `form: ''` poll |
| `formSettled` without `opening` | root reopened | red, box not found |
| `toggleEdit` call dropped in `shift()` | row edit moving | red, `draftKeys` not `[]` |
| `{#key}` block removed | edit from add, Cancel | red, `[data-form]` count 1 |
| gone `$effect` disabled | bookmark taken away | red, `draftKeys` not `[]` |
| `context.ts` reporter answering false | unsaved-forms root line | red, dialog not found |
| `confirm()` patches closed unconditionally | root added while another form opened | red |
| `closeMark` patches closed unconditionally | bookmark added while another bookmark's form opened | red |
| `toggleAdd` call dropped in `shift()` | bookmark form switch/reload | red at `draftKeys` `[]` |

### Verify list (final tree)
- `npx vitest run --reporter=dot`: `Test Files  240 passed (240)` / `Tests  4054 passed (4054)`.
- `npm run check`: `COMPLETED 1197 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`.
- `npm run build`: `built in 9.13s`.
- `npm run format:check`: `All matched files use Prettier code style!`.
- `npm run lint`: exit 0.
- ASCII gate (the perl form): printed nothing.
- `npx playwright test tests/browser/files.spec.ts tests/browser/files-forms.spec.ts tests/browser/unsaved-forms.spec.ts`: `45 passed (2.2m)`.

### Judgment calls the orchestrator may reverse
- `opening` counts every press that moves the forms, including a close. The answer's close keeps the count. It is stored in the Files instance's ui record beside `form`, `editing` and `typed`.
- The gone-bookmark close is a `$effect`, since it reacts to the bookmarks list arriving.
- A form over a bookmark missing from a list that failed to load (`error !== ''`) is left alone.
- The reporter finds an instance's view by walking `layout.pages()` with `findInstance` in `context.ts`. I did this because the layout store has no view-by-id accessor and `state/layout*` is outside my paths.

### Limitations
- **Gone-bookmark close only runs while the Files tab is mounted.** A bookmark removed while another tab is shown leaves its record and draft until the Files tab is shown again, and closing the unshown tab would still ask. Inferred from the code, not measured.
- **Whitespace counts as a typed line.** A line of only spaces is asked about, since the check is `typed !== ''`.
- **Size.** `Files.svelte` is 588 lines, under the ~600 guide with little room; `fs.ts` is 485.
- **Scratch folders.** The new browser cases each leave a scratch root in the run's workspace and under the system temporary directory, as `files.spec.ts` does.

## Updated Doc text

**HELP.md line 64.** Replace "That text is a source tab's unsaved edit, a field of the manifest editor not yet saved, or a value typed into an entry form that differs from the entry as the file holds it now." with:

"That text is a source tab's unsaved edit, a field of the manifest editor not yet saved, a value typed into an entry form that differs from the entry as the file holds it now, or a folder or workspace name typed into the Files view's root or workspace form and not yet added."

Replace "in the Tasks, collection, Pillars, Domains, Venues and Data views the open add and edit forms with what was typed into them, are there again after the tab is switched away from and after a reload." with:

"in the Tasks, collection, Pillars, Domains, Venues and Data views the open add and edit forms with what was typed into them, and in the Files view the open bookmark form with what was typed into it and the root or workspace form with its line, are there again after the tab is switched away from and after a reload."

Replace "The bookmark form of the Files view does not stay open across a switch." with:

"In the Files view, + bookmark or a bookmark's edit control closing or moving the bookmark form lets what was typed go, and so do opening the root or workspace form over it and the bookmark it edits being taken away. A save or an add answered after the reader opened another form, closed and opened the same form again, or switched the tab away closes only the form it was sent from."

**DESIGN.md line 332.** Replace "; the Files bookmark form is not yet among them." with:

"; the Files view keeps its open form, the bookmark it edits, the line typed into its root or workspace form and a count of the presses that opened or closed a form as `form`, `editing`, `typed` and `opening` of `FilesView` (`state/fs.ts`). A press that closes or moves the bookmark form forgets its draft through `toggleAdd` or `toggleEdit` under the `bookmarks` collection key, and so does the edited bookmark leaving the loaded list (`editedGone`). A write takes the instance id and the forms before its request goes and closes a form on its answer only when that instance still holds that opening as the request left it (`formSettled`), since after a tab switch the view's `instance` prop reads the tab the pane shows now; the bookmark form takes both when it mounts, once per instance and opening (`views/files/BookmarkForm.svelte`). A Files instance whose root or workspace line holds text registers with `registerUnsaved` (`filesLineTyped`, wired in `state/context.ts` by the instance's view)."

## Files changed (cumulative for the step)

| File | Lines added / removed |
|---|---|
| `src/lib/state/fs.ts` | +113 / -3 (485 total) |
| `src/lib/state/context.ts` | +7 |
| `src/lib/views/Files.svelte` | +121 / -58 (588 total) |
| `src/lib/views/files/BookmarkForm.svelte` | new, 50 |
| `tests/state/explorer.test.ts` | +188 / -4 |
| `tests/views/files.test.ts` | +49 / -3 |
| `tests/views/type-scale.test.ts` | +1 |
| `tests/browser/files.spec.ts` | +4 / -48 |
| `tests/browser/files.ts` | new, 53 |
| `tests/browser/forms.ts` | new, 30 |
| `tests/browser/files-forms.spec.ts` | new, 408 |
| `tests/browser/unsaved-forms.spec.ts` | +29 / -19 (two helpers removed, the import, 2 call sites, one head-comment sentence, one new case at the end) |

The worktree's `.scratch/.../briefs/Q43.md` shows as modified; that change was there before this step and is not mine.
