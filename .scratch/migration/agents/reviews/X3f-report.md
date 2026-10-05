# X3f repair round 3: report

## NOT done

1. Ruled, not a gap: a HEAD tab and an index tab show their blame in the gutter only, with no status-bar blame (ruled by the orchestrator: VS Code shows the status bar's blame for a working file). HELP.md line 103 and DESIGN.md (status bar paragraph) say so. `Source.svelte` publishes the status bar's blame only while the editor is drawn, which a HEAD or index tab (a read-only code window with no caret) never is.
2. Nothing that needs a browser was run: cases 1 to 13 are (look) cases for the orchestrator on TEST. The commands behind each row are named in the tables.
3. Not verified by any command: `git blame --contents -` against a real repository with a staged change (`blameAt` for `index`). No git command ran from this worktree by me, and no scratch repository was made. The branch for `index` is read in `compare.ts` (`blameAt`); the route and the stage parameter are proved by the probe in "Item 3" below, with the reads stubbed.
4. One read-only `git status` was run once by mistake from the worktree; its output was discarded and it changed nothing. No other git command ran.

Open items of the state file: the "Open items" section of the worktree's `orchestrator-state.md` holds no entry (`sed -n 176,181p`).

## Item 1: Z468 (Open Source) and Z536 (Open Preview to the Side moves to the bar)

A Markdown preview tab draws Open Source in its breadcrumb bar after the star and Open in Program (`MarkdownPreview.svelte`, `barActions` snippet with a `tail`). Pressing it runs `keepPreview(openSourceFile(client, { root, path }))` (`views/shared/links/source-file.ts`, the path every "open this file's source" control uses; `grep -rn "openSource\|show_source\|Open Source" src config` found no other Open Source action, only `openSourceFile`). It opens the file's source tab in the same pane, kept. Words: `doc.markdown_source` ("Open Source"), tooltip `doc.markdown_source_title` ("Open Source: the source tab of {0}"), glyph `doc.markdown_source_glyph` = `open_file` (existing glyph). The G37 bar row for the preview tab (below) covers that the preview tab hands a bar snippet and none for the tab row; the buttons themselves are not drawn in a test, since no served root exists on the server render. On the unchanged tree (Source still handing `stripActions`) the new row `hands 'a source tab' nothing for the tab row` failed with `AssertionError: expected [Function stripActions] to be undefined`. HELP.md and DESIGN.md say it (below).

Z536: Open Preview to the Side is a button of the Markdown source tab's breadcrumb bar (`source/actions/BarActions.svelte`, after Open Preview, glyph `preview_side` = lucide `panel-right-open`, words `source.preview_side`). It calls `openBeside(MARKDOWN_PREVIEW_VIEW, markdownPreviewState(root, path))`, the call the palette's Markdown: Open Preview to the Side makes, so it opens the file's preview tab in a new pane to the right or shows the one already open. `StripActions.svelte` is deleted and `Source.svelte` hands nothing up for the tab row, so the tab row holds Split and the `...` menu only. The `strip` place of `TabActions` stays in `ui/tabs/tab-actions.svelte.ts` with no view using it; it is a generic mechanism with its own tests, and removing it would also remove the pane's `tabActions` prop and the title-row logic of `strip-shape.ts`, which is a separate change.

## First run of every case on the round-2 tree

The round-2 tree is the snapshot taken before any change (`scratchpad/r2tree`). Nothing was run in a browser; each is read from that tree's code and from the new tests run on it.

| Case | First run on the round-2 tree |
| --- | --- |
| 1 README.md with unsaved text | Fails the ruling. The bar draws only the path: `PaneStrip.svelte` takes no bar actions. Save, Revert File, Blame and the rendered half are palette actions (`status/ask-perform.ts`); the star is in no visible control; Open in Program is in no visible control for a source tab; the strip row holds Open Preview to the Side, Split, `...` |
| 2 Same tab saved | No bar action exists; Save is a palette row only while `editing` |
| 3 `.png` tab | The star and Open in Program are in no visible control; Blame none |
| 4 PDF and HTML tab | Same as 3 |
| 5 Doc and Markdown preview tab | Same as 3; the preview tab has no Open Source |
| 6 HEAD tab | `inRepo` is null for a tab with `head !== undefined` (r2 `Source.svelte:229-232`), so no blame action and no blame read |
| 7 index tab | Same as 6; `blameOf` has no stage |
| 8 `stage=bogus` | The route ignores `stage`: a bogus stage reads the worktree blame (200), not 400 |
| 9 file outside a repository | No Toggle Blame, no blame in the status bar (holds) |
| 10 caret line, decoration off | Fails: `Source.svelte:299` publishes `blame` only while `draft.blame`; `SourceItems.svelte:117` draws only a non-empty string |
| 11 narrow pane | Not applicable: no actions in the bar; `Breadcrumb.svelte` clipped its items to 80% each, no left cut |
| 12 star | The star control is not drawn anywhere in a tab (`BookmarkStar.svelte` deleted in round 2) |
| 13 file icons | Fails: `PaneView.svelte:196` builds each tab with `stripMark(registrationGlyph(found), tabMark(instance))`, `TabFace.svelte:115` draws `<Glyph name={tab.glyph} />`. A source tab (README.md, build.py, package.json) draws the view glyph `edit`, `config/catalogs/icons.yml:27` `edit: pencil`; layers.svg and main.pdf (file view) draw `page`, `icons.yml:125` `page: file`; a terminal tab draws its terminal mark (holds). Open Editors (`OpenEditors.svelte:202`) passed `file={row.name}`, the tab's label, which is the file's icon for README.md and the others, and a wrong icon for a label such as `README.md (HEAD)` or `Preview README.md` |

Tests on the round-2 tree (copy of the worktree with `src` and `config` from the round-2 snapshot, new test files added): `npx vitest run tests/views/sources/bar-actions.test.ts tests/ui/tabs/tab-actions.client.test.ts` printed 9 failed rows: the six `hands $row its actions for the bar, apart from the tab row` rows (a source tab: `expected [Function stripActions] not to be [Function stripActions]`; the five others: `expected undefined to be defined`), and in `tab-actions.client.test.ts` `hands the snippet up for the strip when the view mounts` and `... for the bar when the view mounts` (`expected [Function] to be undefined`, the `bar` argument ignored) and `leaves the strip snippet when another view replaces the bar snippet`.

## After, for every case

| Case | After | Where it is proved |
| --- | --- | --- |
| 1 | `Source.svelte:325` hands `actions/BarActions.svelte` up with `'bar'`; `PaneStrip.svelte` draws `barActions` at the bar's right end (`.bar-actions`, `margin-left: auto`). The bar holds Save and Revert File (while `editing`), the star, Open in Program (only when `open.program_ext` maps the extension: not for README.md as shipped), Open Preview, Open Preview to the Side and Toggle Blame. The tab row holds Split and `...` only (Z536) | Look. Test: `bar-actions.test.ts` "a source tab" rows |
| 2 | `BarActions.svelte`: Save `disabled={!dirty}`, Revert File inside `{#if dirty}` | Look |
| 3 | `File.svelte` hands `FileBarActions` (star, Open in Program when mapped; no blame action since file views have no gutter) | Test rows "a picture or a download tab" |
| 4 | Same for the PDF and the HTML document (`Document.svelte`) | Test rows "a PDF tab", "a document tab" |
| 5 | `Doc.svelte`: star and Open in Program when mapped. `MarkdownPreview.svelte`: star, Open in Program when mapped, Open Source | Test rows "a Doc tab", "a Markdown preview tab" |
| 6 | `inRepo` is `{ root, path }` for a HEAD tab; `BarActions` `onDisk` false, so no star and no Open in Program; `blameable` true, so Toggle Blame only; `source-gutter.svelte.ts` reads `blameUrl(root, path, 'head')` and no marks | Look; route probe below |
| 7 | Same with `'index'` | Look; route probe below; `git blame --contents -` itself not verified |
| 8 | `stage=bogus` answers 400 `{"error":"that is not a side of a file"}` without calling the read; no stage and `head` and `index` reach the read as undefined, `"head"`, `"index"`; the working tab's marks and blame URLs are unchanged (`blameUrl(root, path)` with no stage) | Probe below |
| 9 | `inRepo` null: `blameable` false, no blame read, blame text empty | Look; code `Source.svelte:229-239` |
| 10 | `Source.svelte` publishes `blame` whenever the editor is drawn and the file is in a repository; `blameMap` is filled whether or not the toggle is on; the press opens the commit as before (`gutter.openBlamed`) | Look. VS Code default quoted below |
| 11 | `Breadcrumb.svelte`: `.crumbs` is `flex: 1 1 0; direction: rtl; overflow: hidden` around a `direction: ltr; width: max-content` list, so a path wider than its room is cut on its left; `.bar-actions` is `flex: none` | Look |
| 12 | `BookmarkStar` in `FileBarActions` adds and removes the bookmark; a refusal shows `file.bookmark_failed` "The bookmark was not written: {0}" beside the star | Look |
| 13 | `PaneView.svelte:200` gives each tab `file: fileOfTab(instance)?.path`; `TabFace.svelte:114-116` draws `FileIcon` for it, so README.md, build.py, package.json, layers.svg and main.pdf draw what the Files tree draws; a terminal tab has no `file` and keeps its mark; `OpenEditors.svelte:202` passes `row.file.path`, so a HEAD or preview label no longer changes the icon. The tab menu and the strip's overflow draw no tab icon (`grep -rn "tab.glyph" src` prints only `TabFace.svelte`) | Look |

VS Code default for item 4, from `/Applications/Visual Studio Code.app/Contents/Resources/app/extensions/git/package.json` (VS Code 1.137.0): `git.blame.statusBarItem.enabled` default `true` ("Controls whether to show blame information in the status bar."); `git.blame.editorDecoration.enabled` default `false`; the command is "Toggle Git Blame Editor Decoration".

Probe for items 3 and 8 (a scratch test calling `handleGitGet` with stubbed reads, deleted afterwards, no git run): `bogus 400 {"error":"that is not a side of a file"} calls=0`; `q[] 200 ["/hub","a.md",null]`; `q[&stage=head] 200 ["/hub","a.md","head"]`; `q[&stage=index] 200 ["/hub","a.md","index"]`.

## DONE / NOT DONE

| Row | State | Command |
| --- | --- | --- |
| Item 1 bar actions row, every file view (Z468 Open Source, Z536 Open Preview to the Side included) | DONE | `npx vitest run tests/views/sources/bar-actions.test.ts` |
| Item 2 bar on every file tab, path cut from the left | DONE (look pending) | `Breadcrumb.svelte`, `PaneStrip.svelte` |
| Item 3 blame at HEAD and index | DONE (index command not verified against a repository) | probe above; `npx vitest run tests/checks/imports/cycles.test.ts` passes after `blameAt` moved to `compare.ts` |
| Item 4 status bar blame | DONE for a working tab; a HEAD or index tab has gutter blame only, as ruled | `Source.svelte:306` |
| Item 5 DESIGN.md and HELP.md | DONE | list below |
| Item 6 tests under G37 | DONE | below |
| Item 7 (Z533) file icons | DONE (look pending) | `grep -n "tab.file" src/lib/ui/tabs/TabFace.svelte` |
| Open Source (Z468) | DONE (look pending) | above |

## Verification

Full-list runs: 3 that ran commands, and one invocation from the worktree root that ran nothing (`Could not read package.json`; the list runs from `tools/oculus`). The first was red in two lines of `tests/views/sources/bar-actions.test.ts` (svelte-check and eslint), fixed and that file rerun alone; the second was green; after the last change (Z536, the ruling on HEAD and index blame) `npm run diagrams` and the list ran once more and are the third. Final lines, verbatim:

```
ok      ASCII gate (1.2 s)
ok      prettier (2.0 s): All matched files use Prettier code style!
ok      svelte-kit sync (2.8 s)
ok      eslint (15.3 s)
ok      svelte-check (15.3 s): 1791194541331 COMPLETED 359 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest (19.5 s): Duration  14.01s (transform 13.57s, setup 0ms, import 32.29s, tests 19.42s, environment 660ms)
test:quick: 20.7 s (limit 45.0 s); every command passed
checks: 1 commands passed
```

Extras after the last change:

1. `npx vitest run tests/checks/tree/boundaries.test.ts tests/checks/tree/size.test.ts tests/checks/tree/duplication.test.ts tests/checks/source/comment-width.test.ts tests/checks/source/history.test.ts tests/checks/source/keys.test.ts tests/checks/config/config.test.ts tests/checks/imports tests/views/sources tests/ui/tabs tests/routes/git tests/shell/panes/strip tests/state/sessions/source.test.ts`: `Test Files  17 passed (17)`, `Tests  141 passed (141)`. Not run: the slow tree checks and the rest of `tests/checks`. One earlier selection run showed `tests/checks/imports/order.test.ts` ('places every folder of every layer the tree holds') and a row of `tests/routes/git` red (the files are ones this round does not change, or changes by an unrelated route row); each passed on a rerun alone and in the full selection (`Test Files  17 passed (17)`, `Tests  142 passed (142)`); the cause of the single red run is not found, not verified.
2. G28's `context.ts` is not changed, so its tests were not part of this round's selection beyond `tests/state/sessions/source.test.ts`.
3. `sh utils/unused-exports.sh` against the round-2 tree's list: `diff` prints nothing (380 lines each).
4. Greps over `src tests config HELP.md DESIGN.md README.md` for the renamed or moved constructs: `grep -rn StripActions src tests config HELP.md DESIGN.md` prints nothing (the component is deleted); `source.toolbar` has no reader and is removed from `config/text/views/sources/source.yml`; `blameOf` is in `reads.ts:294` (working tab) and `git-reads.ts`; `blameAt` is in `compare.ts` and `git-reads.ts`; `file.toolbar` does not exist; `file.bar` is read by `FileBarActions.svelte`.
5. ASCII: `LC_ALL=C grep -rlP '[^\x00-\x7F]'` over the touched trees and docs printed nothing for files this round touches (`config/present.yml`, not touched, has accented names).
6. Folder counts (`ls -A`): `views/sources/source` 10, `views/sources/source/actions` 1, `views/shared/links` 8, `tests/views/sources` 2, `ui/tabs` 6.

## Files changed since the round-2 tree, with line counts

Server and state: `server/core/git/compare.ts` 448 (adds `blameAt`), `server/core/git/reads.ts` 357 (`blameOf` back to the worktree read), `server/git/git-reads.ts` 292, `state/sources/repositories/repositories.ts` 870 (`blameUrl` stage), `state/workbench/navigation/editor-status.svelte.ts` 165 (comments).
UI and shell: `ui/tabs/tab-actions.svelte.ts` 90 (place `strip|bar`), `ui/tabs/Breadcrumb.svelte` 121, `ui/tabs/TabFace.svelte` 370, `ui/tabs/tab-strip.ts` 230 (`Tab.file`), `shell/panes/PaneView.svelte` 501, `shell/panes/strip/PaneStrip.svelte` 267, `shell/status/SourceItems.svelte` 195 (comment), `shell/status/status-items.ts` 83 (comment).
Views: `views/shared/links/FileBarActions.svelte` 69 (new), `BookmarkStar.svelte` 72 (restored), `ProgramButton.svelte` 72 (`bare`), `views/sources/source/Source.svelte` 508, `source/source-gutter.svelte.ts` 151, `source/actions/BarActions.svelte` 112 (new); `source/StripActions.svelte` is deleted, `views/sources/file/File.svelte` 273, `document/Document.svelte` 196, `doc/Doc.svelte` 159, `doc/MarkdownPreview.svelte` 163, `files/sections/OpenEditors.svelte` 258.
Config: `config/text/views/sources/file.yml` 23, `source.yml` 45, `doc.yml` 18, `config/catalogs/glyphs.yml` 193 and `icons.yml` 192 (`revert`, `preview_side`).
Docs: `HELP.md` 349, `DESIGN.md` 435, `docs/diagrams/` as `npm run diagrams` writes it.
Tests: `tests/ui/tabs/tab-actions.client.test.ts` 126, `tests/views/sources/bar-actions.test.ts` 80, `tests/views/sources/ActionsHost.svelte` 24.
Paths outside the brief's list: `server/core/git/compare.ts` (importing `headFile` into `reads.ts` made `compare.ts -> reads.ts -> compare.ts`, which `tests/checks/imports/cycles.test.ts` reported; `blameAt` for a version of a file sits beside `headFile`), `views/shared/links/ProgramButton.svelte`, `BookmarkStar.svelte`, `OpenEditors.svelte`, `TabFace.svelte`, `tab-strip.ts`, `Doc.svelte`, `MarkdownPreview.svelte`, `Document.svelte`, `File.svelte`, the three catalog files (item 1 and Z533 need them). `views/sources/source` holds 10 items with the `actions/` folder.

## G37, for `agents/guarded.md`

```
- G37. A file opened from the Files tree by a double click is one kept tab with the keyboard in it, whether the second press lands on the row or on the opened tab, and a file tab keeps the actions it hands up to its pane through a keep and a walk to another file: its file actions, Open Preview to the Side among them, at the right end of its breadcrumb bar and nothing at the end of the tab row.
  Code: `src/lib/state/workbench/layout/open/armed-keep.svelte.ts`, `openRow` in `src/lib/views/shared/explorer/opening.ts`, `handUp` in `src/lib/ui/tabs/tab-actions.svelte.ts`, `handUp(..., 'bar')` in each file view.
  Test: armed keep: `tests/state/workbench/layout/armed-keep.client.test.ts`, 'the armed keep and the ask for the keyboard'; openRow: `tests/views/shared/explorer/opening.client.test.ts`, 'opening a file of the file browser'; handUp: `tests/ui/tabs/tab-actions.client.test.ts`, 'the actions a tab hands up' and 'the two places a tab hands actions to'; the bar of each view kind: `tests/views/sources/bar-actions.test.ts`, 'the place a file tab hands its actions to'.
```

Failing lines: the nine rows quoted in "First run" fail on the round-2 tree. Rows over behaviour that already existed, seen failing on a scratch copy with the behaviour removed (the changed file put back byte for byte, `cmp` against a copy in the scratchpad): `File.svelte` handing its bar snippet to the strip place (`barActions)` without `'bar'`) fails 4 rows (`expected undefined to be defined`, `expected [Function barActions] to be undefined`); `handUp` ignoring its place (always `'strip'`) fails `hands the snippet up for the bar when the view mounts` and `keeps the bar snippet through a keep and a walk in the same view`; `handUp`'s cleanup dropping the place fails `takes back both snippets of a tab when its view is torn down`.

## Sentences of HELP.md and DESIGN.md rewritten

HELP.md: "The path over a file tab" gained "When the bar is narrower than the path and the file's actions together, the path is cut from the left and the actions stay whole" and the file-icon sentence; "A file tab's actions" was "The strip's right end carries ... Save, Revert, Blame and the rendered half ... are palette actions" and is now the bar's actions list with their conditions, Open Preview to the Side among them, Open Source on a preview, the tab row's Split and `...` alone, and the palette rows that remain; "How a strip is drawn" says "the active tab's strip actions"; the status bar paragraph says the caret line's blame shows in a file of a repository whether or not the toggle is on, and that a version at HEAD or in the index has no caret; "Blame and the gutter" names the Toggle Blame button and the HEAD and index tabs.
DESIGN.md: the Git form list adds `blame --porcelain HEAD -- <path>` and `blame --porcelain --contents - -- <path>` (`blameAt`); the source tab paragraph names the button, the always-read blame and the stage route; the tab-strip paragraph names `FileBarActions.svelte`, `BarActions.svelte`, the left cut, the Seti icon from `Tab.file` and Open Source; the status bar paragraph drops "while a source tab's blame is on" and says a HEAD or index tab has gutter blame only.

## Judgment calls

- `blameOf` keeps its two-argument form for the worktree; `blameAt(root, path, stage)` in `compare.ts` serves a version of the file, and `git-reads.ts` dispatches (cycle above).
- The blame is read for every source tab in a repository, not only with the toggle on, since the status bar needs it; this is one `git blame` per gutter read.
- Open in Program is drawn only for a mapped extension; the in-body "Open in its program" beside the download in `File.svelte` is removed, because the bar draws it.
- A source tab with an untitled text hands a bar with Save only.
- Revert File uses a new glyph `revert` (lucide `undo-2`); the `bar` actions of a source tab not in a repository, or not loaded, are Save and Revert File and the shared row only.
