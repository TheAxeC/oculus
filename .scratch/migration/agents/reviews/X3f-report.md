Everything in the brief and in repair round 1 is done; no case has been looked at on screen (no browser is allowed in this step), so every behaviour row below is "built, proof is the look at landing", and whether the cancelled `pointerdown` withholds Monaco's word selection, and whether the focus lands in the editor after the keep, are left to that look.

## Open items of the state file (orchestrator-state.md:147-151, verbatim)

- None.

## The ruling this report carries (X3f round 0, briefs/X3f-cases.md)

Case 33 stands as written. `readKind` (`src/lib/state/sources/fs.svelte.ts:560-575`, with `readFileKind` at `:544`) answers a new `FileType` kind `missing` (`src/lib/state/sources/explorer/file-type.ts:24`) for a 404 on the file's head and the name's kind for every other refusal or failed read. `tabForKind` (`src/lib/views/shared/explorer/opening.ts:48-59`) sends `missing` to the source tab, which draws `source.cannot_open` with Retry; a double click keeps that tab. Retry (`src/lib/views/sources/source/read-again.ts`) asks what the file is and opens it in the view that shows it when it is back as something other than text. `fs.svelte.ts`, `file-type.ts` and `RootedTree.svelte` joined "Paths this step writes" by the ruling.

## Repair round 1 (briefs/X3f-round1.md, nine items)

| Item | Change | Output |
| --- | --- | --- |
| 1 Comment width | The four comments are rewrapped at 100 columns: `PaneBody.svelte:187` (reworded, see item 5), `follow.ts:111`, `armed-keep.svelte.ts:11`, `StripActions.svelte:5`. `layout.svelte.ts:216` was rewrapped with item 4. | `npx vitest run tests/checks/source/comment-width.test.ts tests/checks/tree/duplication.test.ts tests/checks/source/history.test.ts`: `Test Files  3 passed (3)` / `Tests  23 passed (23)`. |
| 2 The refusal bar once | New `src/lib/views/shared/links/SaidLine.svelte` (25 lines: the `said` span and its rule) and `src/lib/views/shared/links/FileTab.svelte` (48 lines: the `Pane`, the hand-up through `handUp`, the `said` state, and the bar). The file, document, doc and Markdown preview views draw `<FileTab id title titled actions={stripActions}>`; their `actions` snippet receives `onsaid` and passes it to `StripActions`. The four copies of `{#snippet bar()}`, the `said` state, the `.said` rule and the `handUp` line are gone from the views. | `tests/checks/tree/duplication.test.ts` passes in the run above. `ls -A src/lib/views/shared/links \| wc -l` prints 10 (the limit). |
| 3 Head comments | `ProgramButton.svelte`, `BookmarkStar.svelte` and `Markdown.svelte` head comments say the strip's end through `StripActions.svelte` for the source, file, document, doc and Markdown preview tabs, and `RenderedMarkdown.svelte` for the source tab's half and the preview tab. | Read: `sed -n 1,16p` of each. |
| 4 File name | `layout.svelte.ts:216` names `layout/open/armed-keep.svelte.ts`. | `grep -rn "armed-keep.ts" src` prints nothing. |
| 5 History wording | `PaneBody.svelte` now says what a key does ("every key goes to the tab"). Two `no longer` comments in `PaneBody.svelte` are reworded ("another tab of the pane is the active one", "is not its active tab"); `focusKept` and the head comment state what happens, with no comparison. The grep of the added comment lines for the spec's words follows in "Greps". | See "Greps the spec asks for". |
| 6 A long file in the Markdown preview | `MarkdownPreview.svelte` reads `file.truncated` and, when it is true, draws `<p class="cut" data-markdown-truncated>` with the `source.locked_glyph` glyph and `source.truncated` above the rendered text, the `.view` becoming two rows (`.view.noted`). `source.truncated` ("This file is longer than the editor reads; its first 2 MB are shown and it saves nothing.") is true for the preview as well, since it saves nothing, so the key is unchanged. The head comment names it. | `tests/checks/source/keys.test.ts` passes (47 tests with boundaries and config). Behaviour: look. |
| 7 Focus after the double click | `PaneBody.svelte` `layerPressed` calls `focusKept(id)` after the keep: `await tick()`, then `.focus()` on `.monaco-editor textarea, iframe` inside the kept tab's `[data-tab-view]` (the editor input for a source tab, the frame for a PDF or HTML document, nothing for a picture or a download), skipping a hidden view. It runs after the keep's re-render, as the item says. | Built from the code; the look checks it, and that D37's fix of the editor's model keeps the focus. Not verified in a browser. |
| 8 This report | Rewritten whole: the section of host- and user-visible changes below, `read-again.ts` in the paragraph of paths outside the list, the tree checks run with their output, and the wrong-turn narration removed. | This file. |
| 9 DESIGN.md:334 | No change, as ruled: the apps section is a proposal and nothing is built (E2, ruling Z93), so the sentence states the check the apps step will build and the reference names where it goes. The line references on it stay as they were. | `sed -n 334p DESIGN.md`. |

Docs touched by the round: `HELP.md:120` (Open Preview: the line above a cut file), `HELP.md:167` (the keyboard stays in the kept tab's editor or frame), `DESIGN.md:395` (`focusKept`), `DESIGN.md:427` (`FileTab.svelte` and `SaidLine.svelte`).

## What a reader sees change (view, state to put it in, before and after; the look is read against this)

| View and state | Before | After |
| --- | --- | --- |
| Files tab in one pane: double click a text file (a source tab opens as a preview tab on the first click). | The second press lands on the editor, selects a word, the row's `ondblclick` never fires and the tab stays a preview tab (italic). | The second press within 500 ms keeps the tab (no italic), selects no word, and the keyboard is in the editor. The same in a PDF or HTML frame: no click reaches the frame. The look checks the focus. |
| Same in two panes (tree beside the file). | `ondblclick` keeps the tab. | Unchanged: the row's `ondblclick` keeps it. |
| A source tab (any text file): the pane strip. | Toolbar accessible name "Source controls" (`source.toolbar`). | "File controls" (`file.toolbar`), the same toolbar every file tab has. Order: Save, Revert, star, Open in a browser tab (only where the tab offers it), Open in Program, Open Source (Markdown preview tab only), Preview, Blame. |
| A file view (picture, PDF, download): where the icons are. | The star, Open in a browser tab and Open in Program sit in the pane header row under the breadcrumb (`Pane` `toolbar`, `File.svelte`). | They sit at the end of the pane strip; the header row is gone (`titled={false}` and no `toolbar`). |
| A document view (a local HTML file in a frame). | A toolbar row ("Document controls") with only Open in a browser tab. | No row of its own. The strip has the star, Open in a browser tab, and Open in Program where `open.program_ext` names an application. A refused bookmark or open says so in a red line at the end of the pane's bar (new for this view). |
| A doc view (a hub document). | No controls. | The strip has the star and Open in Program where configured (root `HUB_ROOT`, the document read). A refused bookmark or open says so in the same red line (new). |
| The Files row menu on a Markdown file: Open Preview. | A kept source tab with the rendered half off. | A kept tab named "Preview <name>", rendered text only (front matter left out), view id `markdown-preview`, not listed in the view picker. The strip has the star, Open in Program where configured, and Open Source, which opens the source tab. A second Open Preview on the same file activates the open tab. A rename or move of the file restates the tab's label and path. A save from a source tab redraws it. |
| A Markdown preview tab over a file longer than the read window. | (Not applicable: the view is new.) | The first part is drawn under a line "This file is longer than the editor reads; its first 2 MB are shown and it saves nothing." |
| A tab over a removed file (case 33): double click its row after it was deleted on disk. | A removed `.md` opened a `file` tab with a dead Download link. | A source tab saying it cannot be opened, with Retry; the double click keeps that tab. Retry opens what the file is once it is back (the source tab for text, the file, document or picture view otherwise). |
| A tab replaced in a pane (a source tab walked to a file tab and back; cases 18, 28, 29). | The source tab's cleanup deleted the controls of whatever replaced it. | `TabActions.clear(id, snippet)` removes only the snippet it is given, so the controls of the view now showing stay. |
| Keyboard focus after the double click (one pane). | Wherever the tree's removal left it, or in Monaco with a selected word after the second press. | In the kept tab's editor or frame (`focusKept`). |

## First run of the 37 cases on the unchanged tree (read from the code, before any change)

| Case | Result on the unchanged tree |
| --- | --- |
| 1 | Holds (`pressing.ts:51`, `openRow`, `openOpened` at `layout/open/opening.ts:197`, `landing.ts:54-57`). |
| 2 | Fails: the second press lands on the editor, the row's `ondblclick` (`FileRow.svelte:130`) never fires, the tab stays a preview. |
| 3 | Holds: the second `openRow` finds the preview tab and keeps it (`layout/open/opening.ts:139`), the third calls `keepPreview`. |
| 4 | Holds: the press only activates the kept tab. |
| 5, 6 | Fail at human speed (second press lands in the PDF or HTML frame); hold when both presses land before the read returns. |
| 7, 8, 9, 10, 32 | Hold. |
| 11 | Holds trivially (nothing is armed). |
| 12, 13, 27 | Hold. |
| 14, 15, 16, 17 | Fail: the file view draws its controls under the breadcrumb (`File.svelte:193-205`), the document view only Open in a browser tab, the doc view none. |
| 18, 19, 29 | Hold for source tabs only; file, document and doc tabs hand up nothing. |
| 20 | Fails: Open Preview opened a kept source tab with its rendered half off (`row-menu.ts:492-493`). |
| 21, 23 | Hold for the source tab; the preview tab does not exist. |
| 22, 24, 25, 26, 36, 37 | Not applicable: the view does not exist. |
| 28 | Fails: only the source view hands up controls and its cleanup (`Source.svelte:303-305`) deletes whatever replaced it. |
| 30 | A float is a `PaneView` of one pane (`FloatLayer.svelte:144`); results as cases 2 and 14. |
| 31 | Fails at human speed: the second press lands on Monaco, which selects the word. |
| 33 | Fails: a removed `.md` answered `{ kind: 'other' }` (`fs.svelte.ts:555`), opened as a `file` tab with a dead Download link. The ruling above is what changes it. |
| 34 | Holds for the address: each path segment is `encodeURIComponent`-ed (`fs-transport.ts:205-212`), the route checks `realpath` inside the root (`server/files/open.ts:204-218`). |
| 35 | Holds for source, file and document tabs only (`follow.ts` knew those three). |

## DONE / NOT DONE

Nothing is NOT DONE. What no command here can prove is every behaviour that needs a DOM, which the brief assigns to the look at landing: cases 1 to 11, 14 to 21, 24, 25, 28 to 33 and 35, plus the focus after the double click and the truncated line. The table names the command that proves what a command can prove.

| Row | Proof |
| --- | --- |
| (A) A double click keeps the tab, one pane as two | Built: `state/workbench/layout/open/armed-keep.svelte.ts` (67 lines), `layout.svelte.ts` (`armedKeep`, `armKeep`, `disarmKeep`), `shell/panes/PaneBody.svelte` (the layer and `focusKept`), `views/shared/explorer/rooted-tree.svelte.ts` (arms for the Files tab, disarms and arms nothing once it is destroyed), `explorer/opening.ts` (`openRow(opener, row, preview, pressedAt?)`), `pressing.ts` (passes `event.timeStamp`), `Tree.svelte`, `RootedTree.svelte`. Look on landing. |
| (B) Every file tab hands its controls up | `grep -rn "useTabActions()" src/lib` prints `tab-actions.svelte.ts:54` (definition), `:61` (its doc comment), `FileTab.svelte:35` (the file, document, doc and Markdown preview views through it) and `Source.svelte:304`. The behaviour (cases 18, 28, 29) is the look. |
| (C) Open Preview opens the rendered Markdown alone | Built: `views/sources/doc/MarkdownPreview.svelte` (129 lines), `views/shared/prose/RenderedMarkdown.svelte` (93 lines, used by the source tab's rendered half and by the new view), `row-menu.ts:494-496`, `follow.ts`. Look on landing. |
| Case 33 by the ruling | Built as above. Look on landing. |
| Docs | `HELP.md:49,120,159,161,167` and `DESIGN.md:305,324,334,391,395,417,427` rewritten; listed below. |
| `npm run diagrams` then `npm run test:quick` through `checks.sh` | Last run: `ok      eslint (8.7 s)`, `ok      svelte-check (7.7 s): 1791154016905 COMPLETED 358 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`, `ok      vitest (11.1 s): Duration  7.99s (transform 18.63s, setup 0ms, import 28.41s, tests 2.68s, environment 10ms)`, `test:quick: 11.8 s (limit 45.0 s); every command passed`, `checks: 1 commands passed`. The list also printed `ok      prettier (0.6 s): All matched files use Prettier code style!`, `ok      ASCII gate (0.7 s)` and `ok      svelte-kit sync (2.0 s)`. |
| Tree checks the brief names | `npx vitest run tests/checks/tree/boundaries.test.ts tests/checks/config/config.test.ts tests/checks/source/keys.test.ts`: `Test Files  3 passed (3)` / `Tests  47 passed (47)`. |
| Tree checks the round names | `npx vitest run tests/checks/source/comment-width.test.ts tests/checks/tree/duplication.test.ts tests/checks/source/history.test.ts`: `Test Files  3 passed (3)` / `Tests  23 passed (23)`. |
| The other tree checks of G16 to G25 | `npx vitest run tests/checks/tree/size.test.ts tests/checks/imports/order.test.ts tests/checks/imports/cycles.test.ts tests/checks/diagrams/diagrams.test.ts tests/checks/imports/augments.test.ts tests/checks/source/html-sites.test.ts tests/checks/config/config-folder.test.ts` with boundaries, config, keys: `Test Files  10 passed (10)` / `Tests  170 passed (170)`; `sh utils/folder-check.sh`: exit 0. Run before the last two comment rewordings in `PaneBody.svelte`; `comment-width`, `duplication`, `history`, `boundaries`, `config` and `keys` ran again after them (above). Not run after them: size, order, cycles, diagrams, augments, html-sites, config-folder, and the whole `test:landing` list, which runs on main at landing. |
| ASCII gate (spec.md form, over `src tests config` and `HELP.md`, `DESIGN.md`, `docs/diagrams/*.dot`; `bin` does not exist in this checkout) | Printed nothing. |
| `sh utils/unused-exports.sh` against the base list | `diff /tmp/x3f-ue.txt .agents/worktrees/X3f-base/unused-exports.txt` prints nothing (`UNUSED_SAME`): no line added. |
| This step adds or changes no test | `diff -rq` of the base copy's `tests` and `tests` prints nothing. |

Runs of the full verify list this round: 3. The first printed `FAILED  eslint (10.1 s)` for `src/lib/views/sources/file/File.svelte` (`239:51  error  Unused eslint-disable-next-line directive`); `npx eslint src/lib/views/sources/file/File.svelte` run alone then exited 0 with the file unchanged in that place, and the two later full runs (the second, and the third after the last comment rewording) both ended `every command passed`. The cause of the first red is not established.

## Files changed (`diff -rq` against the base copy, line counts after the last change)

Changed: `src/lib/shell/panes/PaneBody.svelte` 251, `shell/panes/PaneView.svelte` 496 (head comment only), `state/sources/explorer/file-type.ts` 85, `explorer/follow.ts` 158, `state/sources/fs.svelte.ts` 819, `state/sources/fs.ts` 61, `state/workbench/layout/index.ts` 145, `layout/open/opening.ts` 301 (comment only), `layout/open/preview.ts` 79, `state/workbench/layout.svelte.ts` 836, `ui/tabs/tab-actions.svelte.ts` 69, `views/shared/explorer/RootedTree.svelte` 94, `explorer/opening.ts` 104, `explorer/rooted-tree.svelte.ts` 230, `explorer/tree/Tree.svelte` 382, `tree/control/pressing.ts` 56, `tree/menu/row-menu.ts` 499, `views/shared/links/BookmarkStar.svelte` 73 (head comment), `links/ProgramButton.svelte` 72 (head comment), `views/shared/prose/Markdown.svelte` 221 (head comment), `views/sources/doc/Doc.svelte` 141, `document/Document.svelte` 177, `file/File.svelte` 303, `source/Editor.svelte` 267, `source/Source.svelte` 508, `config/text/views/sources/doc.yml` 15, `document.yml` 8, `file.yml` 27, `files.yml` 230, `source.yml` 39, `HELP.md` 348, `DESIGN.md` 435, and `docs/diagrams/` as `npm run diagrams` rewrote it.

New: `state/workbench/layout/open/armed-keep.svelte.ts` 67, `views/shared/links/StripActions.svelte` 122, `links/FileTab.svelte` 48, `links/SaidLine.svelte` 25, `views/shared/prose/RenderedMarkdown.svelte` 93, `views/sources/doc/MarkdownPreview.svelte` 129, `views/sources/source/read-again.ts` 45.

Removed: `views/sources/source/StripActions.svelte` (moved and widened to `views/shared/links/`), `views/sources/source/Preview.svelte` (its rendering moved to `views/shared/prose/RenderedMarkdown.svelte`).

Paths outside "Paths this step writes", each needed: `src/lib/views/sources/source/read-again.ts` (new; the ruling's Retry, which `Source.svelte` calls and which cannot live in `Source.svelte`, at 508 of 520 lines), `shell/panes/PaneView.svelte` (head comment lists what PaneBody draws, now false without the layer), `state/workbench/layout/index.ts` and `layout/open/preview.ts` (`stillPreview` is the pure test the layer uses and the shell imports layout through `index.ts`), `state/sources/fs.ts` (re-exports `MARKDOWN_PREVIEW_VIEW` and `markdownPreviewState`), `config/text/views/sources/source.yml` (the key `source.toolbar` lost its only reader, and the keys test fails on an orphan), `views/shared/links/BookmarkStar.svelte`, `ProgramButton.svelte` and `views/shared/prose/Markdown.svelte` (head comments the change made false), `links/FileTab.svelte` and `links/SaidLine.svelte` (round 1, item 2). `fs.svelte.ts`, `file-type.ts` and `RootedTree.svelte` are the ruling's.

## Judgment calls the brief left open (each reversible)

- The layer stays up until the pointer is released (a `pressing` flag in `PaneBody.svelte`), while the keep disarms at the press. The release and the click land on the layer, never on Monaco or a frame. Whether the cancelled `pointerdown` alone withholds the word selection is not verified.
- A press arms the keep only through the pointer path: `pressing.ts` passes `event.timeStamp` as `pressedAt`, and the keyed `onopen` (Cmd+Down, Enter) passes none, so a key's open arms nothing. The window is 500 ms from the click's time stamp (`KEEP_WINDOW_MS`, `armed-keep.svelte.ts`).
- The layer is drawn over the tab only while it is the same preview tab the keep was armed for (`stillPreview`: id, view, state and preview flag equal), so a tab kept by any path, retargeted or restated takes the layer away.
- A `missing` answer is not held in the kind query (`queries.forget`), so the next press or Retry reads the file again. Any other answer is held as before.
- Retry on a source tab over a file that is back as a non-text file opens the file view (or picture, PDF or document view) in place of the tab, and does nothing when the tab was closed or pointed at another file while the read was out (`read-again.ts`).
- `StripActions.svelte` order: Save, Revert, star, Open in a browser tab, Open in Program, Open Source, Preview, Blame. Toolbar label `file.toolbar` ("File controls") replaces `source.toolbar` and `document.toolbar`; `document.open_outside` and its glyph are removed in favour of `file.open_outside`. New catalog keys: `file.open_source` ("Open Source") and `file.open_source_glyph` (`edit`) in `file.yml`; `files.preview_tab` ("Preview {0}") in `files.yml`; `doc.markdown_none`, `doc.markdown_none_glyph`, `views.markdown_preview`, `views.markdown_preview_glyph` in `doc.yml`. No catalog file was added because `config/text/views/sources/` already holds the ten files the folder limit allows.
- The star acts on the hub root for a `doc` tab and on `root`/`path` for the others; a document tab's star and program control are new.
- The focus after the keep goes to the first of `.monaco-editor textarea` and `iframe` in the kept tab's view; a picture or download tab takes none.
- `focusKept` waits one `tick()`. If the editor remakes its model after that tick, the focus is dropped again; the look settles this, and D37 is where that cause is fixed.
- The Markdown preview reads the file through `fs.fileText`, which stops at the window's limit, and says so with `source.truncated` above the text (item 6).

## Keys and ids this step introduces: empty, duplicated, colliding, in flight, after close, superseded

- View id `markdown-preview` (`MARKDOWN_PREVIEW_VIEW`, one definition, used by the registration, the row menu and `follow.ts`): `grep -rn "markdown-preview" src config tests` finds no other holder. Empty root or path: the none line (`doc.markdown_none`). Opened twice for one file: `stateId` is the `[root, path]` pair, so the second open activates the first. Collision with the source tab of the same file: none, the identity match includes the view.
- The armed keep: an unknown id or a tab that is not a preview arms nothing; a second arm replaces the first and clears its timer; the owner's destroy clears only a keep it armed; the timer clears itself. An `openRow` resolving after the Files tab closed arms nothing (`closed` in `rooted-tree.svelte.ts`). A press whose read lands after the tab was kept opens no second tab and never turns a kept tab back into a preview (`armed-keep` checks `isPreview`).
- The Markdown preview read in flight when the tab closes or is pointed at another file: the query is per file; the view derives from it and draws nothing for a tab that is gone.
- `readAgain` in flight: dropped when the tab closed or its root and path changed.
- `focusKept` for a tab closed before the tick: the view is not found and nothing is focused; for a hidden view nothing is focused.

## Greps the spec asks for

- Old names: `grep -rn "source/StripActions\|source/Preview\|'./Preview\|'./StripActions\|tabOf(\|source\.toolbar\|document\.toolbar\|document\.open_outside" src tests config HELP.md DESIGN.md README.md` printed nothing at the build; not re-run after round 1, which renamed nothing of those.
- History words in the comment lines added or changed by the step (`diff -ru` of the base copy's `src` against `src`, the added lines that are comments, grepped for `before`, `used to`, `no longer`, `still`, `always`, `as ever`, `as before`, `previously`, `the step adds`, `after this package`, `again`, `earlier`, `formerly`, `old`): 16 hits, each a runtime condition or a name, none compares with an earlier state of the code. `once the kept tab is drawn` and `since the redraw remakes an editor's model and a focus given before it is dropped` (`PaneBody.svelte`): order of events at run time. `the old file name`, `where the old label was the old name`, `where it was the old Preview label` (`follow.ts`): the path before a rename the user made. `the next ask reads the file again and finds what it is once it is back` (`fs.svelte.ts`): a read after a file returns. `when both clicks reach the tree before the first read returns` (`layout/open/opening.ts`): ordering of two events. `whether a tab is still the preview tab a caller took`, `The tab among tabs that is still the preview tab held was taken from`, `and still a preview tab` (`preview.ts`): the condition `stillPreview` tests. `view that takes the tab's place can hand up its actions before the view it replaces is torn down`, `when they are still the snippet being taken` (`tab-actions.svelte.ts`): event order and the condition `clear` tests. `opens in the source tab, which says it cannot be opened and offers to read it again` (`explorer/opening.ts`): Retry. `A press whose file is still being read when the tab is gone` (`rooted-tree.svelte.ts`), `in the strip once this view holds the file (a file still ...` and `reads it again (read-again.ts), which opens what the file is when it is back` (`Source.svelte`): run-time states. The wording `no longer` is in none of the added lines.

## Comments and documents that describe the changed behaviour

Rewritten: `layout/open/opening.ts` (the second-click comment at the keep call), `explorer/opening.ts` head comment, `Source.svelte` head comment, `Editor.svelte` head comment (StripActions path, RenderedMarkdown), `File.svelte` head comment, `Document.svelte` head comment, `Doc.svelte` head comment, `MarkdownPreview.svelte` head comment, `PaneBody.svelte` head comment, `PaneView.svelte` head comment, `tab-actions.svelte.ts` head comment, `follow.ts` head comment, `file-type.ts` doc comments, `preview.ts` head comment, `fs.svelte.ts` doc comments of `readFileKind` and `readKind`, `ProgramButton.svelte`, `BookmarkStar.svelte` and `Markdown.svelte` head comments, `HELP.md:49,120,159,161,167`, `DESIGN.md:391,395,417,427`, and the line references in `DESIGN.md:305,324,334` (`Document.svelte:153-160`, `:113`, `:125`, `:157`; `opening.ts:92-104`, `:68-104`).

Still true: `Tree.svelte` head comment, `RootedTree.svelte` head comment, `landing.ts`, `attention.ts`.

## Anything in the brief that was wrong

- Case 33 as written had no rule that gave it; ruled above.
- `DESIGN.md:334` says the apps-folder check sits in `openRow`, `openRowBeside` and `openBookmark`; the code at the base has no such check in those functions. Ruled in round 1 (item 9): the apps section is a proposal, so the sentence names the check the apps step will build, and it is left as it is.

## Other

A read-only `git diff --stat` was typed once by mistake early in the work and printed nothing; no other git command was run.
