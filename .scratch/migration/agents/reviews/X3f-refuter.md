# Step X3f refuter report (on .agents/worktrees/X3f, base 441e8c1a7)

A page this report cites (the rules file, a standard, a skill's text) is named with its section, never with a line number, since a page's lines move and a section's name does not. A finding in code keeps its `file:line`.

There is no ADR folder: `ls docs/adr tools/oculus/docs/adr` printed "No such file or directory" for both, so no ADR governs this diff. The worktree copies of `agents/briefs/X3f.md` and `X3f-cases.md` are identical to the main checkout's (`cmp` printed nothing). The orchestrator put them there, not the builder.

## Verification (rerun by the reviewer)

```
$ npm run diagrams            (from tools/oculus; shasum of docs/diagrams/* before and after: identical, "DIAGRAMS_UNCHANGED")
exit 0

$ npm run test:quick -- --base 441e8c1a7
test:quick: 47 changed file(s), from git since 441e8c1a7
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
- "No file under tests/ differs from the base copy": `git diff 441e8c1a7 --stat` lists no path under tests/. Reproduced.
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

## Repair round 1, refuted

No tree snapshot was recorded when the round was sent, so this run reads the nine items of `agents/briefs/X3f-round1.md` against the whole diff since 441e8c1a7 (`git diff 441e8c1a7`, `git status --short` in `.agents/worktrees/X3f`). The worktree copies of `briefs/X3f.md` and `briefs/X3f-cases.md` are identical to the main checkout's (`cmp` printed `SAME_BRIEF`, `SAME_CASES`). The builder's report is identical in the two checkouts (`cmp` printed `SAME_REPORT`). No file under `tests/` differs from the base copy (`diff -rq X3f-base/tools/oculus/tests X3f/tools/oculus/tests` printed `TESTS_SAME`).

```
$ npm run diagrams                     (from tools/oculus in the worktree; shasum of docs/diagrams/* before and after)
diagrams exit 0
DIAGRAMS_UNCHANGED

$ PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH sh ~/.claude/skills/land/templates/checks.sh /Users/axelfaes/workspace/research-hub/tools/oculus/.scratch/migration/orchestrator-state.md   (from tools/oculus in the worktree)
ok      prettier (1.6 s): All matched files use Prettier code style!
ok      ASCII gate (1.7 s)
ok      svelte-kit sync (3.7 s)
ok      vitest (21.7 s): Duration  15.21s (transform 39.17s, setup 0ms, import 53.28s, tests 6.45s, environment 11ms)
ok      eslint (24.0 s)
ok      svelte-check (24.8 s): 1791154324235 COMPLETED 358 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
test:quick: 29.0 s (limit 45.0 s); every command passed
checks: 1 commands passed

$ npm run test:quick -- --base 441e8c1a7
test:quick: 52 changed file(s), from git since 441e8c1a7
test:quick: 27 test file(s), 10 essential
ok      svelte-check (7.8 s): 1791154334657 COMPLETED 358 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest (12.0 s): Duration  8.18s (transform 19.22s, setup 0ms, import 28.56s, tests 3.31s, environment 8ms)
test:quick: 12.8 s (limit 45.0 s); every command passed

$ npx vitest run tests/checks/source/comment-width.test.ts tests/checks/tree/duplication.test.ts tests/checks/source/history.test.ts
 Test Files  3 passed (3)
      Tests  23 passed (23)

$ npx vitest run tests/checks/tree/boundaries.test.ts tests/checks/config/config.test.ts tests/checks/source/keys.test.ts
 Test Files  3 passed (3)
      Tests  47 passed (47)

$ npx vitest run tests/checks/tree/size.test.ts tests/checks/imports/order.test.ts tests/checks/imports/cycles.test.ts tests/checks/imports/augments.test.ts tests/checks/diagrams/diagrams.test.ts tests/checks/source/html-sites.test.ts tests/checks/config/config-folder.test.ts tests/checks/look/contrast.test.ts tests/checks/config/integrity.test.ts tests/checks/utils/claude-usage.test.ts
 Test Files  10 passed (10)
      Tests  157 passed (157)

$ sh utils/folder-check.sh
folder-check exit 0

$ ASCII gate of agents/spec.md (perl form) over src tests config (no bin), HELP.md, DESIGN.md, docs/diagrams/*.dot and the report
(printed nothing) ascii exit 0

$ sh utils/unused-exports.sh, diffed with .agents/worktrees/X3f-base/unused-exports.txt
UNUSED_SAME (381 lines)

$ grep -rn "useTabActions()" src/lib
src/lib/ui/tabs/tab-actions.svelte.ts:54 (definition), :61 (doc comment)
src/lib/views/shared/links/FileTab.svelte:35:    handUp(useTabActions(), () => id, strip);
src/lib/views/sources/source/Source.svelte:304:    handUp(useTabActions(), () => instance.id, stripActions);

Commands the report quotes as evidence:
- test:quick through checks.sh, "every command passed", "checks: 1 commands passed": reproduced (29.0 s and 12.8 s here, 11.8 s in the report; the time is no decision's basis).
- the three round checks, "Tests  23 passed (23)": reproduced.
- the three brief checks, "Tests  47 passed (47)": reproduced.
- the other tree checks of G16 to G25, which the report says were not rerun after the last comment rewording: all rerun here after it, green (157 of 157, folder-check exit 0).
- `ls -A src/lib/views/shared/links | wc -l` prints 10: reproduced.
- `grep -rn "armed-keep.ts" src` prints nothing: reproduced (the old-names grep, which the report did not rerun after the round, also prints nothing here, exit 1).
- unused-exports diff empty: reproduced.
- history-word grep over the added comment lines: rerun over the added lines of the diff and the new files; every hit is a run-time condition ("before it is dropped", "the old file name" of a rename, "still a preview tab"), and "as ever" is gone. Reproduced.
- the useTabActions grep: reproduced line for line.
- Svelte compiles FileTab's `strip` snippet inside the component function (`strip = ($$anchor) => {` within `export default function FileTab`, from `svelte/compiler` `compile(...)`), so each FileTab instance hands up its own snippet and `clear(id, actions)` of an old view leaves a newer view's snippet, as item 2 requires.
```

### Verdicts

Items of the brief's "What to build":

- 1: holds. `armed-keep.svelte.ts` (arm, `KEEP_WINDOW_MS` with its reason, disarm by owner), `layout.svelte.ts` (`armedKeep`, `armKeep`, `disarmKeep`), `PaneBody.svelte` (layer while `stillPreview` holds and the tab is active; primary `pointerdown` prevented, stopped, `keepPreview`, disarm; window capture listeners disarm on another press and on any key; an effect disarms when the tab is not active), `rooted-tree.svelte.ts` (arms nothing once destroyed), `opening.ts` (arms only for a preview open with `pressedAt`), the row's `ondblclick` kept. The round's focus call is Spec 1; item 1's own text does not ask for focus.
- 2: holds. One `views/shared/links/StripActions.svelte` in the brief's order; File, Document, Doc and MarkdownPreview hand up through `FileTab.svelte` (`handUp`), Source through `handUp`; `TabActions.clear(id, actions)` leaves a newer snippet; no view draws a row of its own; the refusal line exists once (`SaidLine.svelte`), and duplication.test.ts is green.
- 3: holds. `markdown-preview` registered `group: ''`, `listed: false` in `views/sources/doc/MarkdownPreview.svelte`; one `views/shared/prose/RenderedMarkdown.svelte` used by `Editor.svelte` and the new view; state `{ root, path, label }`; label `files.preview_tab`; read through `fs.fileText`; `source.cannot_open` on a failed read, `doc.markdown_none` on no root or path; `source.truncated` above a cut file (`MarkdownPreview.svelte:89-94`); `followedFileTab` follows it; `row-menu.ts` opens it kept; Open Source through `openSourceFile`.
- 4: violated, Standards 1. HELP.md:49, 120, 159, 161, 167, DESIGN.md:391, 395, 417, 427, `layout/open/opening.ts`, `Editor.svelte`, and the head comments of `BookmarkStar.svelte` and `Markdown.svelte` are rewritten and true. `ProgramButton.svelte:9` keeps a sentence the change made false. HELP.md:167 and DESIGN.md:395 state the focus after the keep as fact, which Spec 1 says the code does not do in Chrome.

Cases of the brief's "Cases":

- 1: met. Reading: `pressing.ts` passes `event.timeStamp` to `onopen`; the path through `openRow` and `openOpened` is unchanged.
- 2: not verifiable here; the look settles it with a press, a 150 to 400 ms wait and a press on the editor. Reading shows the layer built for it. The focus that follows is Spec 1.
- 3: met. Reading: both `openRow` calls await `readFileKind`; the second, with `preview` false, keeps the tab, and the layer goes since `stillPreview` needs a preview tab.
- 4: met. Reading: `openOpened` activates the kept tab, and `arm` refuses a tab that is not a preview (`armed-keep.svelte.ts:61`).
- 5: not verifiable; the second press lands in a frame, the look settles it. Reading: the layer is `position: absolute; inset: 0; z-index: 1` over the body.
- 6: not verifiable, as case 5.
- 7: not verifiable; timing case for the look. Reading: the timer at `armed-keep.svelte.ts:63` disarms at 500 ms from the press's time stamp.
- 8: met. Reading: the layer is drawn only in the pane whose active tab is the armed one, and a press elsewhere disarms through the window `pointerdown` listener.
- 9: met. Reading: the row's `ondblclick` is unchanged.
- 10: met. Reading: a folder press toggles; `ondblclick` is only for files.
- 11: met. Reading: the owner's destroy disarms by owner in `rooted-tree.svelte.ts`, and the close press is a press outside the layer.
- 12: met. Reading: Source's snippet passes the same props as at the base.
- 13: met. Reading: `bookmarkable` and `program` need `head === undefined`; `editing` unchanged.
- 14: met for what is handed up (`File.svelte:194-202`: star, browser tab, program with `openable`) and no `toolbar` on the pane; the look settles what is drawn.
- 15: met, as case 14.
- 16: met. Reading: `Document.svelte` hands up the star, the browser-tab control and the program control where configured, and draws no toolbar.
- 17: met. Reading: `Doc.svelte:102-110` hands up the star and the program control on `HUB_ROOT` and `reading`.
- 18: met. Reading: `PaneView` draws `tabActions.of(active)`; a closed tab's cleanup clears its own snippet.
- 19: met. Reading: `FileTab.svelte` holds `said`, passes its setter to each view's `actions` snippet, which passes it to `StripActions` as `onsaid`, and draws `SaidLine` in the pane's bar for the file, document, doc and Markdown preview tabs.
- 20: met. Reading: `row-menu.ts` opens `markdown-preview` kept, label "Preview {0}", `fileOfTab` reads `{root, path}`, strip has the star, the program control and Open Source.
- 21: met. Reading: `stateId` is `[root, path]`, so `openOpened` activates the open tab.
- 22: met. Reading: `FRONT_MATTER` is stripped in `RenderedMarkdown.svelte`.
- 23: met. Reading: `readText` answers an error for a response that is not ok, drawn as `source.cannot_open`.
- 24: met. Reading: the `fs.fileText` query is the one `markText` marks on save.
- 25: met. Reading: `openSourceFile` opens kept and `stateId` dedupes.
- 26: met. Reading: view id and state are saved with the layout; the registration exists.
- 27: met. Reading: `facts.markdown` gating unchanged.
- 28: met. Reading: `clear(id, actions)` leaves a newer snippet, and FileTab's snippet is per instance (compile output above).
- 29: met. Reading: actions per instance, drawn per pane's active tab.
- 30: not verifiable; a float is one `PaneView`, the look in a float settles it.
- 31: not verifiable; whether a cancelled `pointerdown` withholds Monaco's word selection is for the look.
- 32: not verifiable; timing case for the look. Reading: the keep has expired at 600 ms and no layer is drawn.
- 33: met, under the ruling. Reading: `readKind` answers `missing` on a 404, `missing` is not held, `tabForKind` sends it to the source tab, Retry is `read-again.ts`.
- 34: not verifiable; reading shows the same root and path addressing as the source tab; a symlinked file and a name with a space or `#` at the look settle it.
- 35: met. Reading: `followedFileTab` accepts `MARKDOWN_PREVIEW_VIEW` and restates the Preview label.
- 36: met. Reading: `named` is false and `doc.markdown_none` is drawn.
- 37: met. Reading: the query is per file; nothing per tab lands after close.
- The ruling (X3f-cases.md, case 33, and the accepted points): holds, built as ruled.

Closures of the round's nine items: 1 closed (comment-width green); 2 closed (duplication green, `FileTab.svelte` and `SaidLine.svelte`; FileTab also takes the `handUp` line and the `Pane` from the four views, which is inside the ruling's "one small component it and the four views use"); 3 closed for the three named comments, with the next sentence of `ProgramButton.svelte` left false (Standards 1); 4 closed (grep empty); 5 closed (my grep over the added comment lines finds no comparison with an earlier state); 6 closed by reading; 7 not reproduced by reading (Spec 1); 8 closed (the before-and-after section, `read-again.ts` named, the tree checks stated, with the ones not rerun named as such); 9 no change, as ruled. No closure removes a check: no file under `tests/` changed and `allow-duplication.txt` is untouched.

### Findings

- Spec 1. `src/lib/shell/panes/PaneBody.svelte:146`: "view.querySelector<HTMLElement>('.monaco-editor textarea, iframe')?.focus();". What is wrong: the round's item 7 asks for the keyboard focus in the kept tab's editor, and the report (round table row 7, the "Keyboard focus after the double click" row, "the keyboard is in the editor") and HELP.md:167 and DESIGN.md:395 ("leaves the keyboard in the kept tab's editor or frame") state it as done. The editor is Monaco 0.57.0 (`package.json:81`). Its `editContext` option defaults to true (`node_modules/monaco-editor/esm/vs/editor/common/config/editorOptions.js:3211`) and takes effect where `globalThis.EditContext` is a function (`:711`, `editor/browser/config/editorConfiguration.js:106`), which is the case in Chrome; `grep -rn editContext src config --exclude=local.yml` prints nothing, so oculus keeps the default. With it, the editor's input is `div.native-edit-context`, whose focus tracker sets the editor's focus, and the only textarea in the editor is `textarea.ime-text-area`, created `readonly`, `tabindex -1`, `aria-hidden` (`editor/browser/controller/editContext/native/nativeEditContext.js:70-85`). The selector therefore focuses the readonly IME textarea: the editor's focus tracker does not fire, no caret is drawn, and typed characters do not reach the text, since input goes through the EditContext attached to the div. Found by reading Monaco's source; not seen in a browser. The fix is small and inside item 7: focus `.monaco-editor .native-edit-context` first and `textarea.inputarea` (the textarea edit context, where EditContext is absent) after it, or call the editor's own `focus()` through a path the source view owns. Under the spec heading (an item marked done whose diff does not do what the ruling says). Failure scenario: in Axel's Chrome, a reader double clicks `CLAUDE.md` in the one-pane Files tab and starts typing; no character appears in the editor, though the report, HELP.md and DESIGN.md say the keyboard is there. Verdict: makes case 2's follow-on focus unmet once looked at, and with Standards 1 makes item 4 violated (HELP.md:167, DESIGN.md:395 false as written).
- Standards 1. `src/lib/views/shared/links/ProgramButton.svelte:9`: "It is shared because the press is the same in all four: one POST, ...". What is wrong: the round rewrote the sentence before it, which now names the source, file, document, doc and Markdown preview tabs and the project card's file list and a collection card's link, seven surfaces; "all four" counted the base's four (file view, source tab, project card, collection card). Rule: agents/spec.md "What every package obeys" (a sentence in a head comment the change makes false is a defect of the change) and the round's item 3. Failure scenario: a reader of the head comment looks for the fourth caller to change with the control and misses three. Verdict: item 4 violated.
- Standards 2. `src/lib/shell/panes/PaneBody.svelte:22`: "The keep ends when the window closes, at any press outside the layer, at any key, ...". What is wrong: "the window" is the 500 ms double-click window (`KEEP_WINDOW_MS` in `armed-keep.svelte.ts`), and this component also adds listeners on the browser `window` in the same change, so the sentence reads as the browser window closing. Rule: agents/spec.md "The working rules" (name the actual thing). Failure scenario: a reader of the shell component looks for a close handler on the browser window that ends the keep and finds none, or misses the 500 ms timer. Verdict: none.

### Declined to judge

- Cases 2, 5, 6, 7, 30, 31, 32 and 34, and whether the focus call of Spec 1 lands once fixed: they need a real pointer in Chrome on TEST, and this review runs no browser.
- Whether the default action of the press on the layer (a press on a non-focusable element blurs the active element) runs after `focusKept`'s `await tick()` and takes the focus away again, given that the `pointerdown` is cancelled: browser event order, for the look.
- Whether one `tick()` is late enough for the editor's model remake after the keep: the report and the round both leave it to the look and to D37.
- The race where the first press's read resolves between the second press's `pointerdown` and its `click`, and whether a non-primary press on the layer goes through (as the first refuter declined them): browser timing, for the look.
- `.body { position: relative; }` (`PaneBody.svelte` style) as a new containing block for any absolutely positioned element a view draws: no view was checked for one; the look would show a misplaced overlay.
- Case 33 for a name the browser draws (`.png`, `.pdf`, `.html`), whose kind is answered from the name with no request: outside the ruling's `readKind` change, the orchestrator's call.
- The server side of DESIGN.md:334 (whether an apps-folder `.html` is refused in the Document view): ruled in round 1 item 9 as a proposal sentence; reading the server routes is a separate concern.
- Whether `file-type.ts` should hold a view id and a tab label: a cohesion judgment; the boundary and import checks pass.

Reviewer usage: ordo-high on claude-opus-5-5 (a2e13fa0838de52ab), 190,712 tokens, 56 tool uses, 7.9 min.

## Repair round 2, refuted

Step X3f, on `/Users/axelfaes/workspace/research-hub/.agents/worktrees/X3f`, base 6c3781d10. The round-2 diff was read against a round-1 tree, which I rebuilt in my scratchpad by applying `X3f-backed-out.patch` to a copy of `X3f-base`. The behaviour-removed runs were made on a second scratch copy of the worktree's `tools/oculus`, with `node_modules` symlinked. Each source file was put back and confirmed with `cmp`. Both copies are under `/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/` (`r1/` and `mut/`). The worktree itself is unchanged: `git status --short` showed only the builder's files.

```
# from tools/oculus in the worktree
npm run diagrams                      -> exit 0; shasum of docs/diagrams/* identical before and after
checks.sh                             -> ok ASCII gate (0.4 s); ok prettier (0.8 s); ok svelte-kit sync (7.1 s); ok eslint (35.1 s); ok svelte-check (29.5 s): ... 355 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS; ok vitest (38.9 s): Duration 31.38s ...; test:quick: 39.2 s (limit 45.0 s); every command passed; ... checks: 1 commands passed
npm run test:quick -- --base 6c3781d10 -> 95 changed file(s); 67 test file(s), 10 essential; ...; test:quick: 12.0 s (limit 45.0 s); every command passed

Verify 1: npx vitest run armed-keep.client, opening.client, tab-actions.client, comment-draft.client
  -> Test Files 4 passed (4) / Tests 33 passed (33)
  describe titles: 'the armed keep and the ask for the keyboard' (17 rows), 'opening a file of the file browser' (10 rows), 'the actions a tab hands up' (5 rows)
G28's seven files (tab-menu, form-drafts, manifest-draft, source.test, comment-draft, terminal-close, channel)
  -> Test Files 7 passed (7) / Tests 16 passed (16)
  (the report's subset of five: 5 passed (5) / 11 passed (11))
Verify 2: the eight tree checks of the brief      -> Test Files 8 passed (8) / Tests 93 passed (93)
  the other tree checks (cycles, augments, diagrams, html-sites, config-folder, contrast, integrity, claude-usage)
                                                  -> Test Files 8 passed (8) / Tests 134 passed (134); folder-check exit 0
Verify 3: sh utils/unused-exports.sh vs X3f-base/unused-exports.txt
  -> 1c1 < Unused exports (257) --- > Unused exports (256); 235d234 < src/lib/ui/controls/editor/options.ts: WRAP_ACTION
Verify 4 greps (src tests config HELP.md DESIGN.md README.md, --exclude=local.yml):
  FileTab, SaidLine, BookmarkStar, wrapAction, ontogglewrap, wrapListing, document.open_outside, document.toolbar,
  file.bookmark_failed, file.bookmark_glyph, file.open_outside, file.toolbar, file.unbookmark, source.blame_title,
  source.preview_glyph, source.preview_title, 'source.preview', links/StripActions, diff/rooted -> nothing
  focusKept      -> DESIGN.md:395 (one hit)
  STARTS_CLOSED  -> section-state.ts:10,17,22 only
  StripActions   -> Source.svelte:42,98,396; DESIGN.md:427
Verify 5: ASCII gate (perl form of spec.md) over src, tests, config (local.yml excluded), HELP.md, DESIGN.md -> prints nothing, exit 0
G5 test and the docs route test: tests/ui/html.test.ts tests/data/sources/docs.test.ts -> 2 passed / 3 passed
grep -rln "content/docs|api/docs" tests -> config.test.ts only (no test reads the headings field)
renderDocumentParts probe (the builder's): headings [{"level":1,"text":"Title","id":"user-content-title"},...,{"level":2,"text":"Folders","id":"user-content-folders-1"}]; ids match the hrefs; text with no heading gives []

G37 tests on the round-1 tree (scratch r1/, the three test files and rooted.svelte.ts copied in):
  -> Test Files 3 failed (3) / Tests 10 failed | 22 passed (32); red rows: the two same-id copy rows and the newer-snippet row of tab-actions,
     the six ask rows of armed-keep, and 'a double click from a pointer press' of opening
G37 tests with a behaviour removed (scratch mut/, each file restored, cmp clean):
  askFocus sets nothing                  -> 4 ask rows fail
  openRow's askFocus call removed        -> 'a double click from a pointer press' fails, 1 failed | 9 passed (10)
  handUp effect hands nothing up         -> both same-id copy rows fail, 2 failed | 3 passed (5)
  TabActions.clear without the identity  -> 'leaves a newer snippet ...' fails, 1 failed | 4 passed (5)
  TabActions on one $state.raw map       -> 'leaves a newer snippet ...' fails (expected undefined to be [Function])
  arm without the preview guard          -> 'arms for a kept tab' fails, 1 failed | 16 passed (17)
  unchanged scratch copy                 -> Test Files 3 passed (3) / Tests 32 passed (32)
```

### Verdicts

Items of the round-2 brief:

- 1: holds. `item-props.ts` has `onpressagain`, `TreeItem.svelte` calls it from `onmousedown` on `button === 0 && detail === 2`, `FileRow.svelte` passes `onkeep(row, event.timeStamp)` from the launch button and from `onpressagain`, and `Tree.svelte` forwards `pressedAt`. The press-time order in Chrome is a look case.
- 2: violated, Standards 1. The code holds: the ask and its answer are in `armed-keep.svelte.ts`, `openRow` ends as the brief writes it, `rooted-tree.svelte.ts` passes the ask through `closed`, and `PaneBody.svelte`'s `inputOf` tries `native-edit-context`, `textarea.inputarea`, `iframe` and `[data-tab-focus]` in that order, with the watch and `focusGiven`. The tests are green and they fail with the behaviour removed. What is violated: `DESIGN.md:395` still names `focusKept` and describes only the layer path.
- 2a: holds. `data-tab-focus` and `tabindex="-1"` are on the picture, on the download box (`File.svelte`), on Doc's `.view`, on the preview's scroll box through `RenderedMarkdown`'s `tabFocus`, and on the cannot-open box (`Source.svelte:429`). The source editor carries no mark.
- 3: holds. `handUp` re-sets the snippet with `untrack` on every run, and `clear` checks identity. The two tables are red on the round-1 tree and red with each behaviour removed.
- 4: violated, Standards 2 and Standards 3. Spec 1 and Behaviour 1 also apply to its cases. The strip, palette, key and menu parts are built: `StripActions.svelte` in `views/sources/source/`, `ask-perform.ts` `tabActions`, the `save` KeyAction, and the TabFacts group with `pages.ts` helpers. The removals are confirmed by the verify-4 greps. The bookmark, browser and program calls moved into `state/workbench/navigation/pages.ts` sit inside the boundaries: the shell may import `state/workbench/navigation/**`, and the eight tree checks pass. The faults are in how the tab menu reads its stores and shows a refusal, not in the move.
- 4a: holds by reading. The star, Open in Program, Open in Browser Tab, the rendered half (palette row `oculus.toggleRendered`), the Doc view, the keep layer and the gutter blame are all present.
- 5: holds by reading.
  - 5a: `followedTab` in `sections/followed-tab.ts`, in the brief's order.
  - 5b: `renderDocumentParts` and the server `headings` field (the probe output is above), the store with `seq` in `headings.svelte.ts`, `shareHeadings` from Doc and the preview, and the nesting through `headingOutline`.
  - 5c: `STARTS_CLOSED = ['editors', 'timeline']` (`section-state.ts:10`). `HELP.md:121` and `DESIGN.md:422` are rewritten.
  - Behaviour 2 applies to case 30.
- 6: not applicable in the worktree. Ruling Z508 replaces the 24-link list with a `[TOC]` line, which the orchestrator inserts at landing. The `[TOC]` rendering in `markdown.ts` exists at the base (`grep -c TOC` gives 6 in both trees).
- 7: holds. There are three `*.client.test.ts` files with no DOM and no new dependency. The helper moved to `tests/ui/frame/rooted.svelte.ts`, with `cell` added, and the one import changed. There is one table per unit, and no title carries history wording (the grep over the added titles is clean). The G37 runs are above.
- 8: holds.
  - The `position` disposition reproduces: `grep -rnE "position:\s*(absolute|fixed)" src/lib/views` finds the seven rules the report names, each with a positioned ancestor in its own view (Memories `:339`/`:417`, Settings `:266`, Item `:218`, Graph `:419`) or fixed to the viewport (Memories `:397`).
  - The other dispositions are look items or need no change.

Cases (these replace cases 12 to 19, 25, 28, 29 and the strip half of 30 of X3f.md; the other X3f.md cases stand as look cases, which item 8 lists):

- 1 to 9: not verifiable, look cases. By reading, case 3 and case 5 put the focus in the frame; see Behaviour 1.
- 10: met. The opening table row 'a double click from a key' gives `['open source preview=false', 'keep tab-1']`, with no ask.
- 11: not verifiable, look.
- 12: met by reading. `StripActions` draws only when `markdown && head === undefined && !blocked` (`Source.svelte:397`).
- 13, 14, 15: not verifiable, look. For case 15, the handUp tables are green and red without the fix.
- 16: partial, Behaviour 1. By reading, these hold: the save key is performed whatever the focus (`workbench-keys.svelte.ts`, `save` branch, with `perform` returning true so `preventDefault` runs); a commit read lists no Save (`ask-perform.ts:40`); and no tab means nothing is saved. Not met: a PDF or HTML tab whose frame holds the keyboard, which item 2 now gives it after a double click.
- 17: partial, Spec 1. A read-at-commit Markdown tab lists no Blame row. The other rows hold by reading `ask-perform.ts:40-67`. Toggling the gutter and the status-bar blame is a look item.
- 18, 19, 20: not verifiable, look. For case 18's refusal words, see Standards 3.
- 21: met by reading. `Outline.svelte:111-112` gives `files.outline_no_editor` when `file === null`.
- 22 to 28: not verifiable, look.
- 29: met by reading. `outlineOf` answers null for any language but markdown (`outline.ts:149-152`), so `files.outline_none`; LaTeX is unchanged.
- 30: partial, Behaviour 2.
- 31: met by reading. `followedTab` reads only tabs in panes, and a closed Doc tab's `shareHeadings` cleanup forgets its list.
- 32: met by reading. `askHeading` numbers each ask (`headings.svelte.ts:50`), and `shareHeadings` performs a `seq` it has not performed (`rendered-headings.svelte.ts:37-38`).
- 33: not verifiable, landing. It is now `[TOC]` under Z508.

### Findings

#### Spec

- `src/lib/views/sources/source/Source.svelte:229-230`: `if (blocked || head !== undefined) return null;` (inRepo), so `blameable: inRepo !== null && draft.loaded` (`:269`) is false at a commit.
  - What is wrong: case 17 expects "a read-only Markdown file in a repository read at a commit lists only the Blame row". The code lists no row at all. The report's case-17 row says "a read-only tab lists only the rows that apply" and does not raise the gap under the brief's faults.
  - Failure scenario: the palette over `CLAUDE.md` read at HEAD~1 shows no Git: Toggle Git Blame row, and the look marks case 17 against an expectation the code was never built to meet.
  - What would settle it: either the case is wrong (the orchestrator rules), or blame is offered for a commit read.
  - Verdict: case 17 partial.

#### Proof

- `X3f-report.md:50`, verify 4: "`focusKept` ... print nothing".
  - What is wrong: my grep finds `DESIGN.md:395` "... once the tab has drawn again (`focusKept` in `PaneBody.svelte`)". The report also lists `DESIGN.md:395` among the sentences it rewrote.
  - Failure scenario: the orchestrator accepts the grep as clean and lands a DESIGN.md that names a function the tree no longer has.
  - Verdict: item 2 (with Standards 1).
- `X3f-report.md`, verify 1: G28's run quotes five of its seven files and leaves out `terminal-close.test.ts` and `channel.test.ts`. G5's `tests/ui/html.test.ts` is not quoted, though `ui/html.ts` changed. All of these pass in my runs (7/16 and 2/3), so no verdict changes.

#### Standards

1. `DESIGN.md:395`: "and then puts the keyboard in the kept tab's editor or frame once the tab has drawn again (`focusKept` in `PaneBody.svelte`)".
   - What is wrong: a sentence the diff made false (spec.md, the rule that every sentence a change makes false is rewritten). `focusKept` is gone. The sentence also leaves out three things: the ask raised from the row path (`openRow`'s `askFocus`), the second press taken on `mousedown`, and the `data-tab-focus` box.
   - `HELP.md:168` "leaves the keyboard in the kept tab's editor or frame" is incomplete for the same reason: a picture, a download, a Doc tab and a preview take the keyboard on their box.
   - Failure scenario: a maintainer looks for `focusKept` to change the focus rule, finds nothing, and does not learn that `inputOf` and the ask in `armed-keep.svelte.ts` hold it.
   - Verdict: item 2 violated.
2. `src/lib/shell/panes/strip/tab-menu-state.svelte.ts:42`: `const { layout, explorer, fs, selectors, writes, ui } = deps.client;` and `:75` `programs: selectors.programApps()`.
   - What is wrong: the shell reads the `selectors` store. `SHELL_STORES` (`tests/checks/tree/boundaries.test.ts:327-341`) does not list it. The check stays green only because its destructuring regex matches `= client` or `= useState()` and does not follow `= deps.client`. `writes` was read the same way at the base. `selectors` and `fs` are new in this diff, and `fs` is listed.
   - The check was not loosened; it does not see this path.
   - Fix: pass `programApps` in through `TabMenuDeps` from the component that owns the menu, or extend the check to `deps.client` and list the store with a reason.
   - Failure scenario: the next shell file that reads any store through `deps.client` passes the boundary check unseen.
   - Verdict: item 4 violated.
3. `src/lib/state/workbench/navigation/pages.ts:481-483`: `return markRefusal(written);` / `return held === null ? '' : markRefusal(await calls.removeBookmark(held.id));`, shown raw by `tab-menu-state.svelte.ts:93` `said = await bookmarkTabFile(fs, file, add);`.
   - What is wrong: `markRefusal` (`fs-transport.ts:141-143`) returns the endpoint's reason or error text unmapped. That breaks spec.md's rule that an error from the engine is mapped to a catalog line before it is shown. The row path wraps the same reason as `t('files.bookmark_failed', reason)` (`bookmark-actions.ts:49`), and the deleted `BookmarkStar.svelte` wrapped it as `file.bookmark_failed`.
   - Failure scenario: Add Bookmark from the tab menu on a file whose label clashes, or with the server down, shows the bare server reason under the strip. The row menu shows "The bookmark was not written: ..." for the same refusal.
   - Verdict: item 4 violated; it bears on case 18's refusal line.
4. `src/lib/views/shared/explorer/tree/menu/row-menu.ts:8`: "// taken out as the row's star does, a file or folder" (53 columns, then the sentence goes on at `:9`).
   - What is wrong: a head comment the round edited is left with a short line mid-paragraph. Spec.md says an edited comment is rewrapped as a paragraph at 100 columns. The comment-width check passes because it tests only the upper bound.
   - Failure scenario: the next reader of the head comment sees a broken paragraph.
   - Verdict: none (standards only).
5. `src/lib/state/workbench/navigation/pages.ts:1-15`, the head comment.
   - What is wrong: the comment does not name the three helpers this diff adds there: `tabFileFacts`, `bookmarkTabFile` and `openInBrowserTab`. The report's list of head comments re-read omits `pages.ts`.
   - Failure scenario: a reader looking for where the tab menu's bookmark and browser calls live is not pointed to this 489-line file.
   - Verdict: none (standards only).

#### Behaviour

1. `src/lib/shell/panes/PaneBody.svelte`, `inputOf`, which answers `iframe` for a file tab of a PDF and for a document tab of HTML; with `Workbench.svelte:186` `saveSource` and the window `keydown` listener in `workbench-keys.svelte.ts`.
   - What is wrong: after item 2 a double click on a PDF or an HTML file puts the keyboard in the frame. A keydown inside a frame is never dispatched to the parent window, which is the same premise the brief gives for the keep layer. So Cmd+S pressed there never reaches the `save` action, and the frame's page or Chrome's PDF viewer answers it with its own save dialog.
   - The report's Cmd+S rows do not state the frame case.
   - Failure scenario: double-click `main.pdf`, press Cmd+S, and Chrome's download/save dialog opens. Case 16 and ruling Z508 ("Cmd+S always takes the browser's save dialog away") both say no dialog opens.
   - This is by reading; the look settles it.
   - Verdict: case 16 partial.
2. `src/lib/views/sources/files/sections/Outline.svelte:113-116`: `rendered ? drawn !== null && drawn.length === 0 ? t('files.outline_empty') : ''`, with `Doc.svelte:79` `headings: () => shown?.headings ?? []` and `docs.svelte.ts:56,66` (`headings: []` in the loading and failed states).
   - What is wrong: while a Doc tab loads, and after its read fails, it publishes an empty list, so the Outline says "The file has no headings." The source-tab branch waits (`items.length === 0 && !waiting`); the rendered branch has no such wait.
   - Failure scenario: open `DATA-MAP.md` in the Doc view on a slow read. The Outline first says the file has no headings, then lists 24.
   - Case 30 asks for "no rows and no error of its own". The rows part holds. Whether this line counts as such an error is read by the orchestrator.
   - Verdict: case 30 partial.

### Declined to judge

- Every (look) case: 1 to 9, 11, 13 to 15, 18 to 20 and 22 to 28, and case 33 at landing. These are the orchestrator's look on TEST.
- Behaviour 1 is by reading. Whether Chrome's PDF viewer or a same-origin HTML frame opens a save dialog on Cmd+S is settled at the look.
- Whether Chrome raises `mousedown` with `detail === 2` before the first press's read returns, in the race of case 2.
- The window capture `pointerdown`/`keydown` listeners in `PaneBody.svelte`'s focus effect, which end a pending ask. The builder made this call; whether they end an ask the reader still wants (a key pressed while Monaco is mounting) is a look item.
- The added `.body { position: relative }` against the views' overlays, beyond the grep above.
- The form of Step 0 (Z495, "a double click opens no tab"), which needs network and `activeElement` records.
- Whether the `file-search` icon reads like VS Code's Open Preview to the Side glyph.
- Whether `Source.svelte`'s `own` `$derived` re-adds the Monaco actions on each git state move (`blameable` reads `inRepo`). This would need a runtime trace in the browser.
- `markdown.ts` places `export type { RenderedHeading };` between its imports. The import-order check passes, and I leave the style to the orchestrator.
- The `headings` field of `api/docs` has no test. `data/prose/markdown.ts` and `server/content/docs.ts` sit under no guarded entry's Code line (G32 names `data/sources`, `data/snapshot` and `data/model`, where only a type was added), so under spec.md's guarded-entry rule no test is required. The probe above shows the field matching its hrefs.
- `followedTab` has no test of its own. It is not under G37's Code line. It is to be reconciled with D42's `followedFile` at landing (brief item 5a).

Usage: ordo-high on claude-opus-5-5 (a4505c32f469215eb), 136,251 tokens, 114 tool uses, 17.1 min.

## Repair round 3, refuted

Reviewer a74583b625c668d96, claude-opus-5-5: 323,724 tokens, 102 tool uses, 18.5 min (completion notice). Worktree `.agents/worktrees/X3f`, base b249c7e49.

### Verification

`npm run diagrams` exit 0, diagrams unchanged. `checks.sh` from `tools/oculus`: prettier, ASCII gate, svelte-kit sync, vitest (35.07 s), eslint, svelte-check (359 FILES 0 ERRORS 0 WARNINGS) ok; `test:quick: 45.8 s (limit 45.0 s); every command passed`; `checks: 1 commands passed`. `npm run test:quick -- --base b249c7e49`: 14.0 s, every command passed. `npx vitest run tests/checks`: 16 files, 227 tests passed. `sh utils/folder-check.sh` exit 0. Reproduced: the round-2 tree red (10 failed | 12 passed (22)), File.svelte without 'bar' (4 failed), handUp ignoring its place (2 failed), handUp cleanup dropping the place (1 failed), the route probe (`stage=bogus` 400 with no read, head and index 200), the unused-exports list, the line and folder counts, VS Code 1.137.0's `git.blame.statusBarItem.enabled` default True. Not reproduced: "DESIGN.md: the Git form list adds blame --porcelain HEAD and --contents -".

### Verdicts

Items: 1 holds; 2 holds by reading; 3 holds (as `blameAt`, Spec 1); 4 holds (Z537 overrides the cases ruling 2 for HEAD and index in the status bar); 5 violated (Standards 1, Proof 1); 6 holds.
Cases: 1 to 6, 9, 10, 12 met by reading; 7 met by reading except the staged-line attribution not run; 8 met (probe); 11 not verifiable (CSS, the look); 13 partial (Behaviour 2). Cases ruling 1 and 3 hold, 2 holds for the gutter and is superseded by Z537 for the status bar, 4 partial.

### Findings

- Spec 1. `blameAt` in `server/core/git/compare.ts:94` in place of a stage on `blameOf`, since `reads.ts` to `compare.ts` to `reads.ts` would be an import cycle.
- Spec 2. `icons.yml` gives Open Preview to the Side `panel-right-open` and Open Preview `file-search`, where Z508 named `file-search` for Side; the report does not say it departs from Z508.
- Spec 3. The report's G37 text changes the words booked for Z491 and adds `tests/views/sources/bar-actions.test.ts`, a view test, while guarded.md says views have no entry.
- Proof 1. The report says DESIGN.md's Git form list gained `blame --porcelain HEAD -- <path>` and `blame --porcelain --contents - -- <path>`; `grep -n "\-\-contents" DESIGN.md` prints nothing.
- Standards 1. Sentences made false: `Breadcrumb.svelte:5` and `DESIGN.md:427` ("an item at most 80% of the row"), `DESIGN.md:128`, `PaneStrip.svelte:8-9` (Open Preview to the Side handed in as `tabActions`), `Source.svelte`'s head ("the palette ... lists every action of the tab").
- Standards 2. `MarkdownPreview.svelte:35-36`: a comment paragraph broken mid-line.
- Standards 3. `export type ActionsPlace` in `ui/tabs/tab-actions.svelte.ts:24` has no importer.
- Standards 4. The `strip` place, `PaneStrip`'s `tabActions` prop, `stripShape(..., tabActions !== undefined)` and `PaneView.svelte:428` have no user after Z536.
- Standards 5. `git-reads.ts:222` and `:267` repeat one 400 answer; `BarActions.svelte:69` repeats the Save key `shell/keys/keys.ts:118` decides.
- Standards 6. The builder ran one read-only `git status`, disclosed.
- Behaviour 1. `PaneStrip.svelte:97` draws the bar for any handed snippet, so a tab with no path and no applying action draws an empty 22 px bar with an empty path landmark and an empty "File controls" toolbar.
- Behaviour 2. `fileOfTab` answers a Files tab opened on a folder and a LaTeX tab, which then draw a Seti file icon in place of their view glyph, against Z533's "a tab showing no file keeps its view's icon".
- The round-2 run's Standards 2 and 3 named as still in the tree: both were closed at the earlier landing (5f9640b2a, `X3f-landing.md` fixes 4 and 5) and those fixes are in the patch the round built on: the shell check reads `deps.client` (`boundaries.test.ts:364`) and the tab menu wraps a refusal in `files.bookmark_failed` (`tab-menu-state.svelte.ts:94`).

### Declined to judge

The look cases; `git blame --contents -` on a real repository with a staged line; the cost of the blame read per gutter read; whether a HEAD tab's root always equals a `gitFor` key; round-2 items round 3 did not touch.

### Closed

Each finding of the run over round 3, fixed at landing on main inside the brief unless said otherwise:

- Spec 1, `blameAt` in `compare.ts`: kept, since a stage on `blameOf` would make `reads.ts` and `compare.ts` import each other; `DESIGN.md:128` names `blameAt` in the Git form list.
- Spec 2, the Open Preview icons: closed by Z546 (automode), `choices.md`.
- Spec 3, G37's words and the view test: G37 is written into `agents/guarded.md` with "its pane's breadcrumb bar" and "while one of them applies"; `tests/views/sources/bar-actions.test.ts` is named as the test of `handUp`'s call in each file view, which Z491's third defect (the file actions lost on a keep or a walk) covers.
- Proof 1, the Git form list: `DESIGN.md:128` now lists `blame --porcelain HEAD -- <path>` and `blame --porcelain --contents - -- <path>`.
- Standards 1, sentences made false: `Breadcrumb.svelte`'s head says the row is cut from the left with every item whole; PaneStrip's head names `barActions` and the bar; Source's head names the bar's actions and the palette's; DESIGN.md's tab-strip and blame sentences rewritten.
- Standards 2, the broken comment in `MarkdownPreview.svelte`: rewrapped.
- Standards 3 and 4, the `strip` place: removed; `handUp(handed, id, actions, applies)` hands into one store, `grep -rn "ActionsPlace\|tabActions" src/lib/shell/panes/strip` prints nothing.
- Standards 5: the two 400 answers share one; BarActions takes `SAVE_KEY` from `ui/controls/editor/chords`, where `shell/keys/keys.ts` reads it.
- Standards 6, the read-only `git status`: disclosed by the builder, no change.
- Behaviour 1, the empty bar: a view hands its snippet up only while one of its actions applies (`applies` of `handUp`), and PaneStrip draws the bar only for a path or a handed snippet; rows 'a tab none of whose actions applies' and 'hands $row that names no file nothing'.
- Behaviour 2, file icons on a folder Files tab and a LaTeX tab: `shownFileOfTab` answers a file only for the source, file, document and Doc views.

Found by the look on TEST and fixed at landing on main:

- A source tab whose file a later read refused (404) drew the star and Toggle Blame and asked for blame on every read: `read` in `Source.svelte` gates the bar's actions and the gutter's file; row 'hands a source tab whose file a later read refused nothing'.
- The status bar's blame item ran over the left group and carried the commit subject: it says `${authorName} (${authorDateAgo})` as VS Code's default template, and each status group clips.
- A set star drawn bare showed unfilled: `BookmarkStar.svelte` fills a set star.
- A Markdown preview tab drew the file's icon: it keeps the preview view's glyph, as VS Code's preview tab carries the preview icon.
- In a narrow pane the strip shrank and the bar of a HEAD tab covered Split and `...`: the strip keeps its height (`flex: none` in `Tabs.svelte`).

The look's cases: 1, 2, 5 (Doc and preview tabs), 6 (HEAD: Toggle Blame alone, blame read with `stage=head`), 7 (index: the staged lines 48 to 50, 86, 103, 121, 160, 162, 168 and 248 uncommitted in the blame, equal to `git diff --cached -U0`), 8 (`stage=bogus` 400), 9, 10, 11 and 12 met; 3 and 4 as the cases ruling's item 2 reads them (no Toggle Blame on a picture or a PDF). Types seen: md, png, jpg, pdf, txt, tex, yml, html, py, json, a LaTeX tab, a Files tab.
