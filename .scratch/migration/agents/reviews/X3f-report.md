Everything in the brief is built and its checks are green; no case has been looked at on screen (no browser is allowed in this step), so every behaviour row below is "built, proof is the look at landing", and whether the cancelled `pointerdown` withholds Monaco's word selection is left to that look.

## Open items of the state file (orchestrator-state.md:118-122, verbatim)

- None.

## The ruling this report carries (X3f round 0, briefs/X3f-cases.md)

Case 33 stands as written. `readKind` (`src/lib/state/sources/fs.svelte.ts:560-575`, with `readFileKind` at `:544`) answers a new `FileType` kind `missing` (`src/lib/state/sources/explorer/file-type.ts:24`) for a 404 on the file's head and the name's kind for every other refusal or failed read. `tabForKind` (`src/lib/views/shared/explorer/opening.ts:48-59`) sends `missing` to the source tab, which draws `source.cannot_open` with Retry; a double click keeps that tab. Retry (`src/lib/views/sources/source/read-again.ts`) asks what the file is and opens it in the view that shows it when it is back as something other than text. `fs.svelte.ts`, `file-type.ts` and `RootedTree.svelte` joined "Paths this step writes" by the ruling.

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

Everything the brief and the ruling name is built. Nothing is NOT DONE. What no command here can prove is every behaviour that needs a DOM, which the brief assigns to the look at landing: cases 1 to 11, 14 to 21, 24, 25, 28 to 33 and 35 are "built from the code, proof is the look". The table names the command that proves what a command can prove.

| Row | Proof |
| --- | --- |
| (A) A double click keeps the tab, one pane as two | Built: `state/workbench/layout/open/armed-keep.svelte.ts` (new, 66 lines), `layout.svelte.ts` (`armedKeep`, `armKeep`, `disarmKeep`), `shell/panes/PaneBody.svelte` (the layer), `views/shared/explorer/rooted-tree.svelte.ts` (arms for the Files tab, disarms and arms nothing once it is destroyed), `explorer/opening.ts` (`openRow(opener, row, preview, pressedAt?)`), `pressing.ts` (passes `event.timeStamp`), `Tree.svelte`, `RootedTree.svelte`. Look on landing. |
| (B) Every file tab hands its controls up | `grep -rn "useTabActions()" src/lib` prints `File.svelte:189`, `Source.svelte:304`, `Document.svelte:120`, `MarkdownPreview.svelte:67`, `Doc.svelte:91` (plus the definition and its doc comment in `tab-actions.svelte.ts:54,61`). The behaviour (cases 18, 28, 29) is the look. |
| (C) Open Preview opens the rendered Markdown alone | Built: `views/sources/doc/MarkdownPreview.svelte` (118 lines), `views/shared/prose/RenderedMarkdown.svelte` (93 lines, used by the source tab's rendered half and by the new view), `row-menu.ts:494-496`, `follow.ts`. Look on landing. |
| Case 33 by the ruling | Built as above. Look on landing. |
| Docs | `HELP.md:49,120,159,161,167` and `DESIGN.md:305,324,334,391,395,417,427` rewritten; listed below. |
| `npm run diagrams` then `npm run test:quick` | Final run: `test:quick: 10.9 s (limit 45.0 s); every command passed` after `ok      vitest (10.4 s): Duration  6.97s (transform 17.68s, setup 0ms, import 24.86s, tests 2.29s, environment 10ms)` and `ok      svelte-check (6.9 s): 1791152496256 COMPLETED 356 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`. The list also printed `ok      ASCII gate`, `ok      prettier`, `ok      svelte-kit sync`, `ok      eslint`. |
| Tree checks | `npx vitest run tests/checks/tree/boundaries.test.ts tests/checks/config/config.test.ts tests/checks/source/keys.test.ts`: `Test Files  3 passed (3)` / `Tests  47 passed (47)`. |
| ASCII gate (spec.md form, over `src tests config` and `HELP.md`, `DESIGN.md`; `bin` does not exist in this checkout) | Printed nothing. |
| `sh utils/unused-exports.sh` against the base list | `diff` of the base list and the run prints nothing: no line added. Two lines appeared during the work (`previewLabel` re-exported from `fs.ts`, `KEEP_WINDOW_MS` exported from `armed-keep.svelte.ts`); the re-export is removed and the constant is local to its module, so the final list equals the base. |
| This step adds or changes no test | No file under `tests/` differs from the base copy (`diff -rq` over `tests`). |

Runs of the full verify list: 3 (each `npm run diagrams` then `npm run test:quick`, with the tree checks, the ASCII gate and the unused-exports diff after it). The count is three because the last two runs came after a rename (`tabForKind`) and a guard added to `read-again.ts`.

## Files changed (`diff -rq` against the base copy, line counts after the last change)

Changed: `src/lib/shell/panes/PaneBody.svelte` 235, `shell/panes/PaneView.svelte` 496 (head comment only), `state/sources/explorer/file-type.ts` 85, `explorer/follow.ts` 157, `state/sources/fs.svelte.ts` 819, `state/sources/fs.ts` 61, `state/workbench/layout/index.ts` 145, `layout/open/opening.ts` 301 (comment only), `layout/open/preview.ts` 79, `state/workbench/layout.svelte.ts` 835, `ui/tabs/tab-actions.svelte.ts` 69, `views/shared/explorer/RootedTree.svelte` 94, `explorer/opening.ts` 104, `explorer/rooted-tree.svelte.ts` 230, `explorer/tree/Tree.svelte` 382, `tree/control/pressing.ts` 56, `tree/menu/row-menu.ts` 499, `views/sources/doc/Doc.svelte` 159, `document/Document.svelte` 195, `file/File.svelte` 321, `source/Editor.svelte` 267, `source/Source.svelte` 508, `config/text/views/sources/doc.yml` 15, `document.yml` 8, `file.yml` 27, `files.yml` 230, `source.yml` 39, `HELP.md` 348, `DESIGN.md` 435, and `docs/diagrams/` as `npm run diagrams` rewrote it.

New: `state/workbench/layout/open/armed-keep.svelte.ts` 66, `views/shared/links/StripActions.svelte` 122, `views/shared/prose/RenderedMarkdown.svelte` 93, `views/sources/doc/MarkdownPreview.svelte` 118, `views/sources/source/read-again.ts` 45.

Removed: `views/sources/source/StripActions.svelte` (moved and widened to `views/shared/links/`), `views/sources/source/Preview.svelte` (its rendering moved to `views/shared/prose/RenderedMarkdown.svelte`).

Paths outside "Paths this step writes", each needed: `shell/panes/PaneView.svelte` (head comment lists what PaneBody draws, now false without the layer), `state/workbench/layout/index.ts` and `layout/open/preview.ts` (`stillPreview` is the pure test the layer uses and the shell imports layout through `index.ts`), `state/sources/fs.ts` (re-exports `MARKDOWN_PREVIEW_VIEW` and `markdownPreviewState`), `config/text/views/sources/source.yml` (the key `source.toolbar` lost its only reader, and the keys test fails on an orphan). `fs.svelte.ts`, `file-type.ts` and `RootedTree.svelte` are the ruling's.

## Judgment calls the brief left open (each reversible)

- The layer stays up until the pointer is released (a `pressing` flag in `PaneBody.svelte`), while the keep disarms at the press. The release and the click land on the layer, never on Monaco or a frame. Whether the cancelled `pointerdown` alone would have withheld the word selection is not verified.
- A press arms the keep only through the pointer path: `pressing.ts` passes `event.timeStamp` as `pressedAt`, and the keyed `onopen` (Cmd+Down, Enter) passes none, so a key's open arms nothing. The window is 500 ms from the click's time stamp (`KEEP_WINDOW_MS`, `armed-keep.svelte.ts`).
- The layer is drawn over the tab only while it is the same preview tab the keep was armed for (`stillPreview`: id, view, state and preview flag equal), so a tab kept by any path, retargeted or restated takes the layer away.
- A `missing` answer is not held in the kind query (`queries.forget`), so the next press or Retry reads the file again. Any other answer is held as before.
- Retry on a source tab over a file that is back as a non-text file opens the file view (or picture/PDF/document view) in place of the tab, and does nothing when the tab was closed or pointed at another file while the read was out (`read-again.ts`).
- `StripActions.svelte` order: Save, Revert, star, Open in a browser tab, Open in Program, Open Source, Preview, Blame. Toolbar label `file.toolbar` ("File controls") replaces `source.toolbar` and `document.toolbar`; `document.open_outside` and its glyph are removed in favour of `file.open_outside`. New catalog keys: `file.open_source` ("Open Source") and `file.open_source_glyph` (`edit`) in `file.yml`; `files.preview_tab` ("Preview {0}") in `files.yml`; `doc.markdown_none`, `doc.markdown_none_glyph`, `views.markdown_preview`, `views.markdown_preview_glyph` in `doc.yml`. The new view's label and Open Source did not need a catalog file of their own because `config/text/views/sources/` already holds the ten files the folder limit allows.
- The star acts on the hub root for a `doc` tab and on `root`/`path` for the others; a document tab's star and program control are new.
- The Markdown preview reads the file through `fs.fileText`, which stops at the window's limit (`TEXT_LIMIT`), so a Markdown file longer than the limit renders only its first part and says nothing about it. This is the same text read the source tab's code window uses; not changed here.
- The second press of a double click that the layer takes does not move the keyboard focus into the editor; the focus stays where the tree's removal left it. Not verified at the look.

## Keys and ids this step introduces: empty, duplicated, colliding, in flight, after close, superseded

- View id `markdown-preview` (`MARKDOWN_PREVIEW_VIEW`, one definition, used by the registration, the row menu and `follow.ts`): `grep -rn "markdown-preview" src config tests` finds no other holder. Empty root or path: the none line (`doc.markdown_none`). Opened twice for one file: `stateId` is the `[root, path]` pair, so the second open activates the first. Collision with the source tab of the same file: none, the identity match includes the view.
- The armed keep: an unknown id or a tab that is not a preview arms nothing; a second arm replaces the first and clears its timer; the owner's destroy clears only a keep it armed; the timer clears itself. An `openRow` resolving after the Files tab closed arms nothing (`closed` in `rooted-tree.svelte.ts`). A press whose read lands after the tab was kept opens no second tab and never turns a kept tab back into a preview (`armed-keep` checks `isPreview`).
- The markdown-preview read in flight when the tab closes or is pointed at another file: the query is per file; the view derives from it and draws nothing for a tab that is gone.
- `readAgain` in flight: dropped when the tab closed or its root and path changed.

## Greps the spec asks for

- Old names: `grep -rn "source/StripActions\|source/Preview\|'./Preview\|'./StripActions\|tabOf(\|source\.toolbar\|document\.toolbar\|document\.open_outside" src tests config HELP.md DESIGN.md README.md` printed nothing.
- Helper reuse: `grep -rn "stillPreview\|handUp\|tabForKind\|readAgain\|previewLabel\|markdownPreviewState\|armKeep" src tests` shows each defined once. `tabOfFile` already exists in `state/sources/repositories/file-git.ts` for another purpose, so the explorer's function is named `tabForKind`.
- History words in added lines (`before`, `used to`, `no longer`, `still`, ...): every hit is a runtime condition ("no longer the pane's active one", "still a preview tab", "before the first read returns", "a file still being read"), none compares with an earlier state of the code or names a package or date.

## Comments and documents that describe the changed behaviour

Rewritten: `layout/open/opening.ts` (the second-click comment at the keep call), `explorer/opening.ts` head comment, `Source.svelte` head comment, `Editor.svelte` head comment (StripActions path, RenderedMarkdown), `File.svelte` head comment, `Document.svelte` head comment, `Doc.svelte` head comment, `PaneBody.svelte` head comment, `PaneView.svelte` head comment, `tab-actions.svelte.ts` head comment, `follow.ts` head comment, `file-type.ts` doc comments, `preview.ts` head comment, `fs.svelte.ts` doc comments of `readFileKind` and `readKind`, `HELP.md:49,120,159,161,167`, `DESIGN.md:391,395,417,427`, and the line references in `DESIGN.md:305,324,334` (`Document.svelte:153-160`, `:113`, `:125`, `:157`; `opening.ts:92-104`, `:68-104`).

Still true: `Markdown.svelte` head comment (the source tab's preview draws the text it renders on the page), `Tree.svelte` head comment, `RootedTree.svelte` head comment, `ProgramButton.svelte` and `BookmarkStar.svelte` head comments (they name the file view and source tab as drawers; both still draw them, now through `StripActions`), `landing.ts`, `attention.ts`.

## Anything in the brief that was wrong

- Case 33 as written had no rule that gave it; ruled above.
- `DESIGN.md:334` says the apps-folder check sits in `openRow`, `openRowBeside` and `openBookmark`; the code at the base has no such check in those functions. The line references I updated still point at those three functions; the sentence is not changed and not verified.

## Other

A read-only `git diff --stat` was typed once by mistake early in the work and printed nothing; no other git command was run.
