# Step X3f refuter report (on .agents/worktrees/X3f, base 9c7070289)

A page this report cites (the rules file, a standard, a skill's text) is named with its section, never with a line number, since a page's lines move and a section's name does not. A finding in code keeps its `file:line`.

There is no ADR folder: `ls docs/adr tools/oculus/docs/adr` printed "No such file or directory" for both, so no ADR governs this diff. The worktree copies of `agents/briefs/X3f.md` and `X3f-cases.md` are identical to the main checkout's (`cmp` printed nothing). The orchestrator put them there, not the builder.

## Verification (rerun by the reviewer)

```
$ npm run diagrams            (from tools/oculus; shasum of docs/diagrams/* before and after: identical, "DIAGRAMS_UNCHANGED")
exit 0

$ npm run test:quick -- --base 9c7070289
test:quick: 47 changed file(s), from git since 9c7070289
test:quick: 27 test file(s), 10 essential
ok      prettier (0.4 s): All matched files use Prettier code style!
ok      ASCII gate (0.4 s)
ok      svelte-kit sync (1.4 s)
ok      eslint (1.6 s)
ok      svelte-check (5.5 s): 1791152773798 COMPLETED 356 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest (9.0 s): Duration  6.35s (transform 15.51s, setup 0ms, import 22.28s, tests 2.47s, environment 6ms)
test:quick: 9.5 s (limit 45.0 s); every command passed
test:quick: not covered: tests outside the selection, tests/checks, slow tests,

$ PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH sh ~/.claude/skills/land/templates/checks.sh <state file>   (run from tools/oculus in the worktree, as the state file's "Procedures, every session" names it; npm has no package at the worktree root)
$ npm run test:quick
test:quick: 24.1 s (limit 45.0 s); every command passed
checks: 1 commands passed

$ npx vitest run tests/checks/tree/boundaries.test.ts tests/checks/config/config.test.ts tests/checks/source/keys.test.ts
 Test Files  3 passed (3)
      Tests  47 passed (47)

$ ASCII gate of agents/spec.md (perl form) over src tests config (bin does not exist), HELP.md, DESIGN.md, docs/diagrams/*.dot, and the report
(printed nothing)

$ sh utils/unused-exports.sh, diffed with .agents/worktrees/X3f-base/unused-exports.txt (381 lines)
(diff printed nothing: "UNUSED_SAME")

$ grep -rn "useTabActions()" src/lib
tab-actions.svelte.ts:54 (definition), :61 (doc comment), Source.svelte:304, File.svelte:189, Document.svelte:120, Doc.svelte:91, MarkdownPreview.svelte:67

Rerun because there was reason to doubt them (tree checks of G20 to G25, G16 to G19):
$ npx vitest run tests/checks/source/comment-width.test.ts tests/checks/source/history.test.ts tests/checks/tree/size.test.ts tests/checks/tree/duplication.test.ts tests/checks/imports/order.test.ts tests/checks/imports/cycles.test.ts tests/checks/diagrams/diagrams.test.ts
 FAIL tests/checks/source/comment-width.test.ts
+   "src/lib/shell/panes/PaneBody.svelte:187",
+   "src/lib/state/sources/explorer/follow.ts:111",
+   "src/lib/state/workbench/layout/open/armed-keep.svelte.ts:11",
+   "src/lib/views/shared/links/StripActions.svelte:5",
 FAIL tests/checks/tree/duplication.test.ts > a rule written twice > is not held anywhere under src/lib
+   "src/lib/views/sources/doc/Doc.svelte:112 and src/lib/views/sources/doc/MarkdownPreview.svelte:77 hold the same 12 lines (dac4b3d41c19)",
+   "src/lib/views/sources/doc/Doc.svelte:112 and src/lib/views/sources/document/Document.svelte:136 hold the same 12 lines (dac4b3d41c19)",
+   "src/lib/views/sources/doc/Doc.svelte:112 and src/lib/views/sources/file/File.svelte:205 hold the same 10 lines (38b33faef56f)",
+   "src/lib/views/sources/doc/MarkdownPreview.svelte:80 and src/lib/views/sources/document/Document.svelte:139 hold the same 10 lines (9347d8840360)",
 Test Files  2 failed | 5 passed (7)
      Tests  2 failed | 96 passed (98)
$ npx vitest run tests/checks/imports/augments.test.ts tests/checks/source/html-sites.test.ts tests/checks/config/config-folder.test.ts
 Test Files  3 passed (3)
      Tests  48 passed (48)
$ sh utils/folder-check.sh
exit 0

Commands the report quotes as evidence:
- test:quick final line: report "10.9 s ... every command passed"; rerun "9.5 s ... every command passed" and "24.1 s" under checks.sh. Reproduced.
- the three tree checks, "47 passed (47)": reproduced.
- unused-exports diff empty: reproduced.
- useTabActions grep: reproduced, line for line.
- "No file under tests/ differs from the base copy": `git diff 9c7070289 --stat` lists no path under tests/. Reproduced.
- line counts: wc -l gives PaneView 496, PaneBody 235, Source 508, File 321, fs.svelte.ts 819, layout.svelte.ts 835, row-menu.ts 499, all as reported and all under 880 / 520.
- folder items (ls -A): views/shared/links 8, views/shared/prose 7, state/workbench/layout/open 10, views/sources/doc 2, views/sources/source 9, views/sources 10, shell/panes 10, config/text/views/sources 10. All are at most 10.
- history-word grep: "every hit is a runtime condition". Not reproduced (Proof 1).
```

## Verdicts

Items of the brief's "What to build", in its numbering:

- 1: holds. `armed-keep.svelte.ts` (arm, the 500 ms named constant `KEEP_WINDOW_MS` with its reason, disarm by owner), `layout.svelte.ts` (`armedKeep`, `armKeep`, `disarmKeep`), `PaneBody.svelte` (the layer drawn while `stillPreview` holds and the tab is active, `pointerdown` primary button: `preventDefault`, `stopPropagation`, `keepPreview`, disarm; capture listeners on the window disarm on any other press and on any key; an effect disarms when the tab is no longer active), `rooted-tree.svelte.ts` (arms nothing after `onDestroy`, disarms by owner), `opening.ts` (`openRow` arms only for a preview open with `pressedAt`), the row's `ondblclick` kept. The focus left after the keep is Behaviour 1.
- 2: holds. One `views/shared/links/StripActions.svelte` in the brief's order. File, Document, Doc and MarkdownPreview hand up through `handUp`, and Source uses the same call. `TabActions.clear(id, actions)` leaves a newer snippet. The views draw no row of their own. The refusal bar this adds is copied four times (Standards 2).
- 3: holds. `markdown-preview` is registered `group: ''`, `listed: false` in `views/sources/doc/MarkdownPreview.svelte`. It has one shared `views/shared/prose/RenderedMarkdown.svelte`, which `Editor.svelte` imports, and `source/Preview.svelte` is gone. Its state is `{ root, path, label }`. Its label comes from `files.preview_tab`. It reads through `fs.fileText`. A failed read shows `source.cannot_open`, and a state with no root or path shows `doc.markdown_none`. `followedFileTab` follows it with its label restated. `row-menu.ts` opens it kept, and `stateId` dedupes it on `[root, path]`. Open Source goes through `openSourceFile`. The silent cut of a long file is Standards 7.
- 4: violated, Standards 3. HELP.md:49, 161, 167 (and the Open Preview row-menu paragraph), DESIGN.md:391, 395, 427, `layout/open/opening.ts` and `Editor.svelte` are rewritten. The head comments of `ProgramButton.svelte`, `BookmarkStar.svelte` and `Markdown.svelte`, which the change makes false, are not, and the report marks the first two "still true".

Cases of the brief's "Cases":

- 1: met. Reading: `pressing.ts:54` calls `onopen(row, true, event.timeStamp)` on the click, and the path through `openRow` and `openOpened` is unchanged.
- 2: not verifiable. The look settles it with a press, a 150 to 400 ms wait and a press on the editor. Reading shows the layer is built for it.
- 3: met. Reading: both `openRow` calls await the same `readFileKind`. The first opens the preview and arms. The second (`preview` false) finds the tab in `openOpened` and `openRow` calls `keepPreview`. The layer then goes, since `stillPreview` needs a preview tab.
- 4: met. Reading: `openOpened` activates the kept tab, and `arm` refuses a tab that is not a preview (`armed-keep.svelte.ts:60`).
- 5: not verifiable, because the second press lands in a frame. The look settles it. Reading: the layer has `z-index: 1` over the body, frames included.
- 6: not verifiable, as case 5.
- 7: not verifiable; it is a timing case for the look. Reading: the timer at `armed-keep.svelte.ts:62` disarms at 500 ms from the click's `timeStamp`.
- 8: met. Reading: the layer is drawn only in the pane whose active tab is the armed one, never over the Files pane. A press on another row is a window `pointerdown` outside the layer, so it disarms (`PaneBody.svelte:105-118`).
- 9: met. Reading: the row's `ondblclick` (`FileRow.svelte:130`) is unchanged, and the first press of the double click disarms through the window listener.
- 10: met. Reading: a folder press toggles (`pressing.ts:53`) and `ondblclick` is only for files.
- 11: met. Reading: `onDestroy` in `rooted-tree.svelte.ts` disarms by owner, and the close press itself is a press outside the layer.
- 12: met. Reading: Source's snippet passes the same props as at the base (`Source.svelte:381-397`).
- 13: met. Reading: `bookmarkable` and `program` need `head === undefined`, and `editing` is unchanged.
- 14: met for what is handed up (star, browser tab, program with `openable`, no `toolbar` on the `Pane`). The look settles what is drawn.
- 15: met, as case 14.
- 16: met. Reading: `Document.svelte` hands up the star, the browser-tab control and the program control where configured, and draws no toolbar.
- 17: met. Reading: `Doc.svelte` hands up the star and the program control on `HUB_ROOT` and `reading`.
- 18: met. Reading: `PaneView` draws `tabActions.of(active)`, which is unchanged, and a closed tab's cleanup clears its own snippet. The look confirms it.
- 19: met. Reading: File already had a `said` bar, and Document, Doc and MarkdownPreview add one.
- 20: met. Reading: `row-menu.ts:494-496` opens `markdown-preview` kept, the label is "Preview {0}", `fileOfTab` reads `{root, path}` (`pages.ts:365`), and the strip gets the star, the program control and Open Source.
- 21: met. Reading: `stateId` is `JSON.stringify([root, path])` (`instance.ts:137-138`), so `openOpened` activates the open tab.
- 22: met. Reading: `FRONT_MATTER` is stripped in `RenderedMarkdown.svelte:45-48`.
- 23: met. Reading: `readText` answers `error` for a response that is not ok (`fs-transport.ts:372-373`), and `Markdown.svelte:77-78` draws `failed`, which is `source.cannot_open`.
- 24: met. Reading: the `fs.fileText` query is the one `markText` marks on save. This is the brief's premise and was not rerun.
- 25: met. Reading: `openSourceFile` with no options opens the tab kept (`openInto` defaults `preview = false`), and `stateId` dedupes it.
- 26: met. Reading: the view id and state are saved with the layout and the registration exists.
- 27: met. Reading: `facts.markdown` gating is unchanged.
- 28: met. Reading: `clear(id, actions)` leaves a newer snippet (`tab-actions.svelte.ts:29-30`). The look confirms it.
- 29: met. Reading: actions are kept per instance and drawn for each pane's active tab.
- 30: not verifiable. A float is one `PaneView`, so the layer applies there. The look in a float settles it.
- 31: not verifiable. The report says so too. The look settles whether a cancelled `pointerdown` withholds Monaco's word selection.
- 32: not verifiable; it is a timing case for the look. Reading: the keep has expired after 500 ms and no layer is drawn.
- 33: met, under the ruling. Reading: `readKind` answers `missing` on 404 (`fs.svelte.ts:564`), `missing` is not held, and `tabForKind` sends it to the source tab. A picture, PDF or HTML name gets no read, as before (Declined to judge).
- 34: not verifiable. Reading shows the same root and path addressing as the source tab. A symlinked file and a name with a space or `#` at the look settle it.
- 35: met. Reading: `followedFileTab` accepts `MARKDOWN_PREVIEW_VIEW`, and `relabelled` maps the old Preview label to the new one (`follow.ts:43-46`).
- 36: met. Reading: `named` is false and `doc.markdown_none` is drawn.
- 37: met. Reading: the query is held per file, and the view derives from it with nothing per tab to land on.
- The ruling (X3f-cases.md, case 33): holds. It is built as ruled: `readKind` 404 gives `missing`, `FileKind` gains `missing`, `tabForKind` sends it to source, Retry is `read-again.ts`, and the press time passes through `RootedTree.svelte:70-71`. The other accepted points are built as stated.

## 1. Spec

- `.scratch/migration/agents/reviews/X3f-report.md`, whole report: there is no section of host- or user-visible changes with their before and after. The brief's "Report" asks for "every host- or user-visible change with its before and after (the view, the state to put it in and what should differ, which the look is read against)", and agents/spec.md "What every package obeys" says the same. The report has "Judgment calls" and "Keys and ids", but no list of the form view / state / before / after. Failure scenario: the orchestrator's look on TEST has nothing to read against. Unlisted examples include the source tab's toolbar accessible name moving from "Source controls" to "File controls" (`StripActions.svelte:72`, `t('file.toolbar')`), the Document view's toolbar row removed, the doc view gaining a star and a refusal bar, and the file view's icons moving from under the breadcrumb to the strip, so a change can go unlooked-at. Verdict: none (report shape).
- `src/lib/views/sources/source/read-again.ts` (new, 45 lines): it is outside "Paths this step writes" and outside the ruling's three added paths. The report lists it under "New" but leaves it out of its "Paths outside ... each needed" paragraph. agents/spec.md "Where you work" asks that a path outside the list be named with the reason. It was needed: it is the ruling's Retry, and Source.svelte is at 508 of 520 lines. Failure scenario: a reader of the report's outside-paths paragraph misses a new module when checking the diff against the brief. Verdict: none.
- The other paths outside the list, judged:
  - `shell/panes/PaneView.svelte` (head comment only) was needed, because its head comment listed what PaneBody draws.
  - `state/workbench/layout/index.ts` was needed, because the shell imports layout through the index and `stillPreview` is exported there.
  - `layout/open/preview.ts` lies inside the listed folder `layout/open/`, but the brief's parenthetical names only the new module and `opening.ts`. `stillPreview` could have lived in the new module. Its placement is defensible but was not strictly needed.
  - `state/sources/fs.ts` holds the re-exports through which views reach `MARKDOWN_PREVIEW_VIEW` and `markdownPreviewState`. It was needed as the facade.
  - `config/text/views/sources/source.yml` (`source.toolbar` removed) was needed, because the key lost its only reader and keys.test fails on an orphan.

## 2. Proof

- `X3f-report.md`, "Greps the spec asks for": "every hit is a runtime condition ... none compares with an earlier state of the code". What is wrong: grepping the added comment lines for the spec's history words finds `PaneBody.svelte:187` "a keyboard reaches the tab as ever", which compares with the earlier state. The decision that rests on it is that the step meets G22 and agents/spec.md "What every package obeys" (no history in comments). Failure scenario: the landing takes the step as free of history wording while one comment carries it. Verdict: none.
- `X3f-report.md`, first line "Everything in the brief is built and its checks are green": the brief's verify list is green and reproduced, but two tree checks the step's code breaks are red on the worktree (Standards 1 and 2). They are not in the brief's list; they are in the landing list. Failure scenario: the orchestrator reads "checks are green", runs `npm run test:landing` on main, and finds it red at landing. Verdict: none.

## 3. Standards

- 1. `src/lib/shell/panes/PaneBody.svelte:187` (102 columns), `src/lib/state/sources/explorer/follow.ts:111` (109), `src/lib/state/workbench/layout/open/armed-keep.svelte.ts:11` (113) and `src/lib/views/shared/links/StripActions.svelte:5` (111). Quoted: "// still that instance (`stillPreview` of preview.ts): same id, same view, same state and still a preview tab, so". The rule broken is agents/spec.md "What every package obeys" (a comment edited by the step is rewrapped at 100 columns) and G23 (`tests/checks/source/comment-width.test.ts`, red as quoted above). Failure scenario: `npm run test:landing` on main fails comment-width.test.ts at X3f's landing. Verdict: none.
- 2. `src/lib/views/sources/doc/Doc.svelte:112`, `MarkdownPreview.svelte:77-86`, `document/Document.svelte:136-145` and `file/File.svelte:205-214`: the same `{#snippet bar()}{#if said !== ''}<span class="said" role="alert">{said}</span>{/if}{/snippet}`, plus the `.said` rule and the StripActions call's tail, are written four times. Rules broken: agents/spec.md "The principles every package is judged on" (DRY: "a rule ... exists once") and G21 (`tests/checks/tree/duplication.test.ts`, red with four copies as quoted above). Failure scenario: test:landing fails duplication.test.ts. A later change to how a refusal is shown must also be made in four views, and one of them will drift. Verdict: item 2's code is the cause, but the item's text holds.
- 3. Head comments the change makes false, which item 4 asked to be rewritten. Rule broken: agents/spec.md "What every package obeys" (re-read and list the head comment of every function and component that describes the changed behaviour) and the brief's item 4. Failure scenario: a reader of either shared component's head comment believes only two views draw it and edits it without regard to the doc, document and Markdown preview tabs. Verdict: item 4 violated. The comments:
  - `src/lib/views/shared/links/ProgramButton.svelte:3-4`: "The file view and the source tab draw it as an icon action of their headers". It is now drawn at the strip's end through `StripActions.svelte` for the source, file, document, doc and Markdown preview tabs. The report marks this comment "still true".
  - `src/lib/views/shared/links/BookmarkStar.svelte:6-8`: "a file is read in two tabs, the source tab for text and the file view ...". The star now also sits on the document, doc and Markdown preview tabs. The report marks this comment "still true" too.
  - `src/lib/views/shared/prose/Markdown.svelte:3-4`: "the source tab's preview draws the text it renders on the page". The text is now drawn by `RenderedMarkdown.svelte`, for the source tab's half and for the preview tab.
- 4. `src/lib/state/workbench/layout.svelte.ts:216`: "(layout/open/armed-keep.ts)". The file is `armed-keep.svelte.ts`. Rule broken: agents/spec.md "Verify before asserting" (name the actual file). Failure scenario: a reader searching for `armed-keep.ts` finds nothing. Verdict: none.
- 5. `src/lib/shell/panes/PaneBody.svelte:187`: "a keyboard reaches the tab as ever". Rule broken: agents/spec.md "What every package obeys" (no wording that compares with an earlier state). Failure scenario: the comment describes the code relative to a past the reader cannot see. Verdict: none.
- 6. `X3f-report.md`, "Other": "A read-only `git diff --stat` was typed once by mistake". Rule broken: agents/spec.md "Where you work" ("You never run a git command, read-only ones included ... `diff --stat`"). The same report also narrates wrong turns ("Two lines appeared during the work ...; the re-export is removed"; "The count is three because the last two runs came after a rename ... and a guard"), against agents/spec.md "The working rules" ("No narration of wrong turns taken and backed out"). Failure scenario: none to the code. The rule breach is disclosed, and the narration hides nothing but lengthens the report. Verdict: none.
- 7. `src/lib/views/sources/doc/MarkdownPreview.svelte:93-99` passes `file.text`, `file.loading` and `file.error` and ignores `file.truncated`. `FileText.truncated` is "True when the file is longer than the window draws and the text is its first part" (`state/sources/fs-transport.ts:75-76`). The report writes this as a limitation ("renders only its first part and says nothing about it ... not changed here"). Rule broken: agents/spec.md "The working rules" ("Never take the lazy option ... a limitation written instead of a fix"). The fix is small and inside item 3: the source tab already says `source.truncated` for the same read. Failure scenario: Open Preview on a Markdown file longer than the read limit draws its first part as if it were the whole file, and the reader takes a cut document for a complete one. Verdict: none. Item 3's text holds.
- 8. `DESIGN.md:334` ("Reading an app's files"): the step rewrites the sentence's line references to `views/shared/explorer/opening.ts:68-104`, a sentence that says the page tests a file against the apps folders "in `openRow`, `openRowBeside` and `openBookmark`". `grep -n apps` over `opening.ts` at the base copy and in the worktree prints nothing, and no client module under `views/shared/explorer`, `state/sources/explorer` or `views/shared/links` holds such a check. The report names the doubt ("not verified"), but the diff refreshes the references on a sentence the builder found false. Rule broken: agents/spec.md "What every package obeys" (a sentence in a document that is false is a defect to carry or report, not to restate). Failure scenario: a reader of DESIGN.md trusts that an app's `.html` from the file browser opens as source text, a security guarantee the page side does not provide. Whether the server side holds it is not checked here (Declined to judge). Verdict: none. The sentence was false before the step, and the step restated it.

## 4. Behaviour

- `src/lib/shell/panes/PaneBody.svelte:139-149` (`layerPressed`: `event.preventDefault(); event.stopPropagation(); keepPreview(armed.id); disarmKeep(); pressing = true;`). What a user sees change: in one pane, a double click on a text file leaves the keyboard focus where the tree's removal left it, outside the editor.
  - Before, the second press landed in Monaco (the brief's probe found it on `lines-content monaco-editor-background`), which takes the focus on mousedown along with a selected word. That is inferred from Monaco's mousedown and was not seen at a look.
  - VS Code's double click in the Explorer opens the editor pinned with the focus in it. The plan line asks for "a kept tab, as VS Code's", agents/spec.md "The principles" judges a VS Code port on its behaviour, and "What every package obeys" counts focus as visible. The report states this only as an unverified limitation, with no before and after.
  - Failure scenario: a reader double clicks `CLAUDE.md` in the one-pane Files tab and starts typing. No key reaches the editor until they click into it, where the base gave them the caret (with a selected word).
  - Verdict: none. Item 1's text, which asks the press to be stopped, holds.

## Declined to judge

- Cases 2, 5, 6, 7, 30, 31, 32 and 34 need a real pointer in Chrome on TEST. This review runs no browser, by the instruction and the rules file.
- The race where the first press's read resolves after the second press's `pointerdown` and before its `click`: reasoned from the code, the second click then may reach neither the row (`click` and `dblclick` target the common ancestor of a removed row and the new layer) nor the layer's `pointerdown`, leaving a preview tab. Only a slow read (150 to 400 ms) opens this window, and only a browser run settles it.
- Whether a non-primary press on the layer "goes through", as `PaneBody.svelte:136-137` says, or lands on the layer before Svelte removes it. This is browser event timing, for the look.
- `.body { position: relative; }` (`PaneBody.svelte:212`) makes the body a new containing block for any absolutely positioned element a view draws. No view was checked for one, and the look would show a misplaced overlay.
- Case 33 for a name the browser draws (`.png`, `.pdf`, `.html`): `readFileKind` answers it from the name with no request, so a removed picture opens the file view's own unreadable state, not `source.cannot_open`. The ruling covers only `readKind`, so this is the orchestrator's call, not a finding.
- Whether the server side refuses to serve an apps-folder `.html` into the Document view (the second half of the DESIGN.md:334 sentence). It is outside this step's code, and reading the server routes for it is a separate concern for the orchestrator to book.
- Whether `file-type.ts` should hold a view id and a tab label (`MARKDOWN_PREVIEW_VIEW`, `previewLabel`, `markdownPreviewState`). This is a cohesion judgment; the boundaries and import checks pass.

Agent usage: 246,295 tokens, 57 tool uses, 11.0 min (opus, ordo-high).