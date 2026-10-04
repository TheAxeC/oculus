NOT done: the build. I stopped after the first run of the 37 cases, before changing any code, because case 33 is a case the brief's rules get wrong; nothing in the worktree differs from the base copy.

## Open items of the state file (orchestrator-state.md:118-122, verbatim)

- None.

## The case the brief's rules get wrong: case 33

Case 33: "A file removed before the press's read returns: the cannot-open line, no kept empty tab."

The rule it is judged under is the press path of "What to build" item 1, which opens a file through `openRow` (`src/lib/views/shared/explorer/opening.ts:54-60`) and arms the keep after `openView`. Nothing in items 1 to 4 changes what `openRow` opens for a file that is gone, and the result on the unchanged tree is not the cannot-open line:

- `openRow` awaits `opener.readFileKind(row.root, row.path)` (`explorer/opening.ts:55`).
- `readFileKind` returns the name's answer at once for `.html`, `.png`, `.pdf` and the other named formats, and otherwise runs `readKind` (`src/lib/state/sources/fs.svelte.ts:538-557`). `readKind` fetches the file's head and, on a refused answer (a 404 for a removed file), returns the name's kind: `if (!response.ok) return named;` (`fs.svelte.ts:555`). For a `.md` or any other name outside the named formats that is `{ kind: 'other' }` (`src/lib/state/sources/explorer/file-type.ts:53-60`).
- `tabOf` (`explorer/opening.ts:39-48`) sends every kind other than `html` and `text` to the `file` view, so the removed file opens as a `file` tab.
- `File.svelte` then draws its `other` branch: `known` is the held `{ kind: 'other' }`, `holds` is true (`File.svelte:124`), and the tab shows `file.other` (extension and size) with a Download link to the address that now answers 404 (`File.svelte:244-253`). `handOn` returns at `found.kind !== 'text'`, so the tab is never handed to the source tab.
- With a double click, the second press or the row's `ondblclick` keeps that tab: a kept tab of a file that is not there, showing a dead Download link.
- The source tab, which owns `source.cannot_open`, is reached only when the kind was already held as `text` from an earlier read of the file. For a file never read in this round, no rule of the brief gives the cannot-open line.

So case 33 holds only for a file whose kind was already known as text, and fails for every file not read before. The brief names no change to `readKind`, `readFileKind` or `tabOf`, and `fs.svelte.ts` is not in "Paths this step writes". Getting the case to hold is a decision about which view a removed file opens, which is user-visible, so it is the orchestrator's (or Axel's) to rule, with the write list widened if the ruling touches `fs.svelte.ts`.

Options I see, for the ruling (the lazy one is the last):

1. `readKind` tells a removed file (the 404 answer) from the other refusals and fails, and `openRow` opens the `source` tab for it, which draws `source.cannot_open` with its Retry control. Cost: `fs.svelte.ts` joins the write list, `readKind`'s contract (a refused read is answered as the name says) gets a second outcome, and a double click keeps a tab that says the file cannot be opened.
2. `openRow` opens nothing for a removed file and shows a line in the Files view. Cost: a new place to say it, and a user-visible shape the brief does not name.
3. Reword case 33 to the download tab that exists today. Leaves a kept tab with a dead link; it is the option that costs least and the one I would not recommend.

My recommendation is option 1.

## First run of the 37 cases on the unchanged tree (read from the code)

Paths are under `tools/oculus/` of the base tree. "Holds" means the unchanged tree already gives the case's result; "Not yet" means the step's build gives it; "Fails" means the unchanged tree gives a different result and the step's build is what changes it; "Stop" is case 33.

| Case | Result on the unchanged tree |
| --- | --- |
| 1 | Holds. A single press runs `pressing.ts:51` `deps.onopen(row, true)`, `openRow` calls `openView(..., { preview: true })`, `openOpened` (`layout/open/opening.ts:197`) lands where `landingFor` says (`landing.ts:54-57` when the reader's pane holds opened tabs) and marks the tab `asPreview`. |
| 2 | Fails. The first press has replaced the tree in the pane; the second press lands on the editor, the row's `ondblclick` (`FileRow.svelte:130`) never fires, and the tab stays a preview. Built by item 1. |
| 3 | Holds. All three `openRow` calls (two presses, then `ondblclick`) await `readFileKind` (one request, `fs.svelte.ts:538-545`); the second finds the preview tab and keeps it (`layout/open/opening.ts:139`), the third calls `keepPreview` (`explorer/opening.ts:60`); one kept tab. |
| 4 | Holds. The press finds the kept tab through `findView` and only activates it (`opening.ts:221` keeps only a tab that `isPreview`). |
| 5 | Holds only when both presses land before the read returns; at human speed the second press lands in the PDF `<iframe>` (`File.svelte` frame) or on the file view and the tab stays a preview. Fails at human speed, built by item 1. A binary file such as `VacancyPages.xlsx` opens as a `file` tab (`tabOf`). |
| 6 | Same as case 5 for the `document` view's frame (`Document.svelte:128-`). Fails at human speed, built by item 1. |
| 7 | Holds. Nothing keeps the tab on a later press on the editor. |
| 8 | Holds. A press on another row retargets the pane's preview tab (`retarget`, `layout/open/preview.ts`); nothing is kept. |
| 9 | Holds. The second press lands on the row and `ondblclick` runs `onselect(one); onopen(one, false)` (`Tree.svelte:336-339`), which keeps the tab through `explorer/opening.ts:60`. |
| 10 | Holds. `pressing.ts:50` toggles a directory row on each press and `FileRow.svelte:130` passes no `ondblclick` for a directory. |
| 11 | Holds trivially (nothing is armed on the unchanged tree). Built by item 1 (disarm at the Files tab's close). |
| 12 | Holds. `Source.svelte:382-399` hands `StripActions` (Save, Revert, star, program, Preview, Blame) up at `:300-304`. |
| 13 | Holds. `bookmarkable={head === undefined && !blocked}` and `editing` is false for a read at a commit. |
| 14 | Fails. `File.svelte:193-205` draws the star, Open in a browser tab and Open in Program in the pane header under the breadcrumb (`toolbar={tools}`, `:218`); nothing is handed to the strip. Built by item 2. |
| 15 | Same as case 14 for a picture and a PDF (same `tools` snippet). Built by item 2. |
| 16 | Fails. `Document.svelte:117-126` draws Open in a browser tab only, in the header; no star, no Open in Program, nothing at the strip's end. Built by item 2. |
| 17 | Fails. `Doc.svelte` draws no controls; `fileOfTab` (`pages.ts:360-366`) already reads it as a file tab. Built by item 2. |
| 18 | Holds for what exists: only the source tab hands controls up (`grep -rn "useTabActions()" src/lib` prints `tab-actions.svelte.ts:50` and `Source.svelte:300`), `PaneView.svelte:423` draws `tabActions.of(active)`, and `Source.svelte:302-305` clears on destroy. A file tab draws none, so the case's second half is built by item 2. |
| 19 | Holds for the file view (`File.svelte:208-212` shows `said` in the bar). The document and doc views have no star or program control, so no refusal exists to show. Built by item 2. |
| 20 | Fails. Open Preview (`row-menu.ts:492-493`) opens a kept source tab with its rendered half off, labelled `CLAUDE.md`, no rendered view alone. Built by item 3. |
| 21 | Holds for the source tab (same state identity, so activated); the tab is the source tab, not a preview tab. Built by item 3 for the new view. |
| 22 | Not applicable on the unchanged tree: no rendered-alone view exists. The source tab's preview drops the front matter (`Preview.svelte:35`). Built by item 3. |
| 23 | Source tab: `loadSourceDraft` fails and the tab says `source.cannot_open`. The new view is built by item 3. |
| 24 | Not applicable: the rendered half of the source tab shows the working text, not the saved text; no preview tab exists. Built by item 3 (`fs.fileText` is marked by `fs.markText` on a save, `context.ts:329-331`). |
| 25 | Not applicable: no preview tab exists. Built by item 3 (`openSourceFile` opens the source tab kept or activates it). |
| 26 | Not applicable: the view does not exist. Built by item 3 (the layout saves view id and state for every tab). |
| 27 | Holds. `row-menu.ts:195` sets `facts.markdown` for a file whose language is `markdown`, and `:268` offers the item for it only. |
| 28 | Fails. Only the source view hands controls up, so walking a preview tab from a `.md` file to `VacancyPages.xlsx` leaves the strip end empty for the file view, and the source view's cleanup (`Source.svelte:303-305`, `clear(id)`) deletes whatever a view that took the tab's place had set. Built by item 2 (snippet-checked `clear`). |
| 29 | Holds for source tabs (one `TabActions` per pane, `PaneView.svelte:126`); file tabs hand nothing. Built by item 2. |
| 30 | A float is a `PaneView` of one pane (`FloatLayer.svelte:144`), so the strip's controls and the double click behave as in a pane. Same results as cases 2 and 14. |
| 31 | Fails at human speed: the second press lands on Monaco, which selects the word. Built by item 1 (the layer swallows the press). |
| 32 | Holds. Nothing keeps the tab on a later press on the editor. |
| 33 | Stop. See above. |
| 34 | Holds for the address: `fileBytesUrl` and `sourceFileUrl` encode each segment with `encodeURIComponent` (`fs-transport.ts:205-212`, `source.svelte.ts:164-170`), so a space and `#` reach the server intact, and the file route resolves with `realpath` inside the root (`server/files/open.ts:204-218`). The star and the program control already act on `root` and `path`. The Markdown preview is built by item 3. |
| 35 | Holds for source, file and document tabs (`follow.ts:109-117`); a `markdown-preview` tab does not exist. Built by item 3 (`Preview <new name>` needs its own relabel, since `relabelled` (`follow.ts:40-42`) compares the label with the old file name). |
| 36 | Not applicable on the unchanged tree. Built by item 3 (`markdown-preview.none`, as `file.none` and `doc.none`). |
| 37 | Not applicable on the unchanged tree. Built by item 3: the read is a query held per file (`fs.svelte.ts:497-505`), so an answer after the tab closed writes to no component. |

## Build notes for the ruling (decisions the orchestrator may reverse; none applied, no code changed)

- The press path that arms the keep needs the press's time and has to tell a pointer press from a key. I plan to pass `event.timeStamp` from `pressing.ts` through `Tree.svelte`'s `onopen` to `openRow` (a third, optional argument), so a key's open arms nothing and the 500 ms window runs from the press. `RootedTree.svelte:70` is the call that forwards it, and it is not in "Paths this step writes"; the step needs it.
- A press on the layer disarms the keep at that press, as the brief says, and I plan to keep the transparent layer in place until the pointer is released, so the release and the click land on the layer and never on Monaco or a frame (whether a cancelled `pointerdown` alone withholds the word selection is not verified, since no browser is allowed in this step).
- The layer is drawn only while the armed tab is still a preview tab, so a tab kept by another path (a second `openRow`, the row's `ondblclick`, a tab double click) takes the layer away.
- Each file view calls `useTabActions()` itself and a shared function in `tab-actions.svelte.ts` registers the cleanup, so `grep -rn "useTabActions()" src/lib` still names the views.

## Tests

This step adds or changes no test, and no test, check or verify command has been run, because no code has changed.

## Files changed

None: the worktree's `tools/oculus` is unchanged. This report is the only file written.
