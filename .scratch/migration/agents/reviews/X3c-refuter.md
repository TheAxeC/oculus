# Step X3c refuter report (on .agents/worktrees/X3c, base ddcd610c)

The step is not ready to land. The source tab's Save, Revert, star, Open in Program, Preview and Blame are no longer drawn anywhere in the app (Spec 1). The report's first line says "Everything in the brief is done".

A page this report cites (the rules file, a standard, a skill's text) is named with its section, never with a line number. A finding in code keeps its `file:line`.

## Verification (rerun by the reviewer)

```
$ PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH npm run build      (from tools/oculus, alone, first)
✓ built in 21.69s
> Using @sveltejs/adapter-node
Generated an empty chunk: "chunks/env.js".
  ✔ done
(exit 0)

$ PATH=...:$PATH sh ~/.claude/skills/land/templates/checks.sh /Users/axelfaes/workspace/research-hub/tools/oculus/.scratch/migration/orchestrator-state.md   (from tools/oculus; load average 18.84 at start)
$ npm test
 ❯ |unit| tests/server/edit/config-key.test.ts (61 tests | 3 failed) 90888ms
     × refuses what is not a finite number for a number option 8621ms
     × writes beside a file value that JSON cannot hold: infinity, not a number and minus zero 6312ms
     × refuses a value the reader of its block refuses, with that reader's sentence 5725ms
fatal: Needed a single revision
Error: Test timed out in 5000ms.   (each of the three)
 Test Files  1 failed | 579 passed | 24 skipped (604)
      Tests  3 failed | 14071 passed | 640 skipped (14714)
checks: failed with exit 1: npm test

The step does not change tests/server/edit/config-key.test.ts. Rerun alone:
$ npx vitest run tests/server/edit/config-key.test.ts
 Test Files  1 passed (1)
      Tests  61 passed (61)

checks.sh stops at the first red command, so the remaining commands of the list were run one by one, in order, from tools/oculus (`npm run build` is the run above):
$ npm run test:checks
 Test Files  31 passed | 2 skipped (33)
      Tests  471 passed | 9 skipped (480)
exit 0
$ npm run check
1791019140564 COMPLETED 3332 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
exit 0
$ npm run format:check
All matched files use Prettier code style!
exit 0
$ npm run lint
exit 0
$ ! LC_ALL=C grep -rna '[^ -~]' src tests
exit 0

Brief verification 2:
$ grep -n "Breadcrumb" tools/oculus/src/lib/views/sources/files/Files.svelte
(nothing, exit 1)

The spec's ASCII gate (agents/spec.md, the paragraph on the ASCII gate), from tools/oculus:
$ LC_ALL=C perl -ne '...' $(find src tests bin config -type f ! -name local.yml)
bfs: error: bin: No such file or directory.
(no other output, exit 0)
$ find src tests bin config -type f ! -name local.yml 2>/dev/null | grep -c .
1743   (the list includes src/lib/shell/panes/strip/tab-menu.ts, src/lib/ui/tabs/tab-actions.svelte.ts, src/lib/views/sources/source/StripActions.svelte, tests/state/workbench/layout/open/pinned.test.ts, config/text/ui.yml)
$ LC_ALL=C grep -Hn '[^ -~]' over DESIGN.md, HELP.md, the changed config/text and config files, docs/diagrams/*.dot and the report
(nothing)

Commands the builder's report quotes, rerun:
$ npx vitest run tests/server/machine/commands/placeholders.test.ts tests/server/machine/pty/task.test.ts
 Test Files  2 passed (2)
      Tests  21 passed (21)
$ LC_ALL=C grep -nP '[^\x00-\x7F]' HELP.md DESIGN.md
(nothing, exit 1)
$ wc -l PaneView.svelte Source.svelte layout.svelte.ts terminals.svelte.ts
537, 535, 814, 888   (as the report says)
$ ls src/lib/state/workbench/layout/open/ | wc -l
9
$ grep -rn "new-note" src tests
(nothing, exit 1)
$ ls <worktree root>/package.json
ls: ...: No such file or directory   (as the report says)

The first run on the unchanged tree. The reviewer built its own unchanged tree: a copy of tools/oculus with `git diff ddcd610c -- tools/oculus/src tools/oculus/config` applied in reverse, new-note.ts taken from the diff, the step's 12 new source files moved aside, and the step's final tests kept. That copy's src is byte-identical to the builder's base copy (`diff -rq` prints nothing). It is in the scratchpad at rv-x3c-refuter/. The builder's 49 files were run there:
$ npx vitest run <the 49 files> --reporter=json
1488 total, 1332 passed, 156 failed; the files that do not load: pane-strip-menu.test.ts, source.test.ts, tab-menu.test.ts, tab-path.test.ts, viewport.test.ts
The only per-test difference from the builder's first-run-base.json (1488/1333/155) is "layer boundaries holds across src/lib". It failed in the unit run under load and passes alone (`npx vitest run tests/checks/tree/boundaries.test.ts --testTimeout 0`: 11 passed).
$ npx vitest run tests/state/workbench/layout/open/pinned.test.ts tests/shell/panes/strip/editor-actions-menu.test.ts --reporter=verbose   (unchanged tree)
 ✓ closing the active tab > activates the tab used before it, and then the one used before that
 × closing the active tab > activates the tab used before it even when that is not a neighbour of it
   → expected 'e11c51cc-...' to be 'b811f18b-...' // Object.is equality
 ✓ a float under Hidden > draws the pane menu opener on the page pane and on the float, and neither under Hidden
 × Editor Actions Position > names the first place Title Bar when the tab bar is not drawn
   → expected '@ui.editor_actions_strip' to be '@ui.editor_actions_title_bar'

The reviewer's probe for Spec 1 (scratch copies only): a Workbench render with one source tab on hub:README.md, asserting the bookmark star's label "Bookmark this file" appears anywhere on the page.
final tree:      × ... AssertionError: expected '<!--[--><div class="workbench svelte-…' to contain 'aria-label="Bookmark this file"'
unchanged tree:  Test Files 1 passed (1)
```

## Verdicts

Items of the brief's "What to build":

- 1 holds. Evidence: `layout/model.ts:25` `pinned?: true` and `LAYOUT_VERSION = 6`; `saved.ts` compares FLOATS_VERSION in `needsFloats`, the gate takes 6, 5, 4 and the pages version, and floats are read for 5 and 6. `pinnedAt` (`tree.ts`) pins or unpins on a drop, `floats.ts` `kept` keeps the pin, `afterDelete` (`tab-strip.ts`) handles Delete on a pinned tab, and `pinItems` (`palette.ts`) gives Pin Editor and Unpin Editor. Tests: pinned.test.ts, layout-pinned.test.ts, palette-pin.test.ts.
- 2 holds. `tab-menu.ts` and `tab-menu-state.svelte.ts` are wired through `ContextMenu read=` in `PaneView.svelte`. The premise about the refusal sentence is Spec 5.
- 3 holds. `session-list.yml` `pin_pane` and `unpin_pane` are reworded and HELP.md:117 follows.
- 4 holds. `appearance.yml`, `options.yml`, `VOCAB_KEYS`, `setAppearance` (`config.wrap_tabs === true`), config-folder.test.ts, `stripWraps`, `wrappedInsertion`. The file-scope mutable is Proof 3.
- 5 holds. `tab-crumbs.ts`, `PaneStrip.svelte` (the `path` snippet, `beside` under `single`, its own row otherwise), `fileOfTab` reads a `doc` tab under the hub root.
- 6 holds. `tabHint` (`pane-view.ts`), `shownPath` (`place.ts`), `home` in `workspacesAnswer` (`server/files/fs.ts`).
- 7 holds. `editorDrop` (`open-editors.ts`) and the drag handlers in `OpenEditors.svelte` go through `transferInstance`.
- 8 holds. Brief verification 2 prints nothing, and `files.breadcrumb` is gone from the catalog.
- 9 violated: Spec 1.
- 10 holds. HELP.md and DESIGN.md are updated, and HELP.md says the preview, the open position and the editor limit are fixed.
- 11 holds. `titled={false}` on Source, Document and File, and `Pane.svelte` drops the title. Document and File keep a header row for their tools; the report says so under item 11.
- 12 violated: Spec 1 and Behaviour 1.
- 13 holds. `PaletteRow.svelte` `cut`, `white-space: nowrap`, `title={row.label}`.
- 14 holds. `openedAt` and `openInstance` (`tree.ts`), pinned.test.ts "opens to the right of the active tab".
- 15 holds. `Markdown.svelte` has `overflow-wrap: normal` on the cells.
- 16 holds. `rendered: z.boolean().catch(false)` and `EDITOR_LEAST = 0.5`. The Preview toggle is unreachable in the app (Behaviour 3).
- 17 holds by reading. `--tabs-least`, `.tab { max-width: 100% }`, the label ellipsis, the opener on its own line. The look decides.
- 18 violated: Spec 2.
- 19 holds. `repoStatus` (`status.ts:179-180`) reads a root key that is an absolute folder, and status.test.ts has the diff-tab case.
- 20 holds for the strip menu, New Text File, the viewport and the Terminal tab's title. The widening of `terminalLabel` beyond the tab is Spec 3.
- 21 holds. `focusOnOpen` runs after `tick()` and keeps `preventDefault`. `portal` to the body; the report says which and why. Memories uses `focusQuietly` and `watchShown(null)` answers undefined.
- 22 holds. `recent` on `Pane`, `activeAfterClose` (`tree.ts`), `recentOf` (`saved.ts`).
- 23 violated: Spec 1. HELP.md's "A file tab's controls" passage and DESIGN.md's sentence on `StripActions.svelte` describe controls the app does not draw.

Cases of the brief's "Cases":

- C1: met. layout-pinned.test.ts compares the version-5 envelope with deep equality and checks `needsFloats` for 5, 4 and 6. The `needsFloats` clause passes on the unchanged tree, as the report says.
- C2: met. pinned.test.ts "puts the third of four tabs first", "clears the preview mark", "puts an unpinned tab first among the unpinned tabs". All fail on the unchanged tree (reviewer's run).
- C3: met. tab-menu.test.ts (`tabsToClose`) and open-editors-tabs.test.ts (`openIds`).
- C4: partial. The test does not check that the unsaved tab is named, nothing is closed on No, and the test would pass with the menu's close bypassing `askAndClose`: Proof 1.
- C5: met. tab-menu.test.ts "the items of a tab menu".
- C6: met. tab-menu.test.ts "copying the path of a file tab". The sentence is a new one: Spec 5.
- C7: met (an audit for the words). session-lock.test.ts: the words test fails on the unchanged tree and the three `pinInstance` tests pass there.
- C8: met. wrap-tabs.test.ts and tones.test.ts.
- C9: met. tab-wrap.test.ts `stripWraps` and `tabScrollState(..., true)`.
- C10: met. tab-path.test.ts "the breadcrumb over a file tab" and "a press on a segment".
- C11: met. tab-path.test.ts "the hint of a tab" and "the home folder written ~".
- C12: met over `editorDrop`, as the brief allows.
- C13: met (an audit). Brief verification 2 prints nothing.
- C14: met. pinned.test.ts "a drag in the strip".
- C15: met. palette-pin.test.ts, including `openPaletteItem` toggling the pin.
- C16: met for the segments and for no title row (source.test.ts, document.test.ts, file.test.ts). The 22px height is a token and is listed under "Declined to judge".
- C17: unmet. In the app the source tab's controls are drawn nowhere. The tests pass only because a fixture hands the strip its actions directly: Spec 1, Proof 2.
- C18: met for the tooltip (palette.test.ts). The one-line height and the ellipsis are listed under "Declined to judge".
- C19: met. pinned.test.ts "a new tab".
- C20: met as an audit (table.test.ts, titled "audits that"). The layout is at the look.
- C21: met. source.test.ts `rendered` default, and `draggedShare` in splitview.test.ts and source.test.ts.
- C22: not verifiable here. The case needs a browser at 150% in 250px and 140px panes; the look settles it.
- C23: partial. Sizes are measured; colours and borders are not: Spec 2.
- C24: met. status.test.ts diff-tab case.
- C25: met. The place names and the check marks fail on the unchanged tree and pass after. The float clause passes on both trees (reviewer's run); see "Declined to judge".
- C26: met for opening. new-text-file.test.ts and pane-strip-menu.test.ts. Saving the untitled text needs the strip's Save: Behaviour 3.
- C27: met. viewport.test.ts.
- C28: met. folds.test.ts, terminals.test.ts.
- C29: not verifiable here. `focusOnOpen` is tested over stubs; the focus itself is at the look.
- C30: not verifiable here. `portal` is tested over stubs; the stacking is at the look.
- C31: met. shown.test.ts.
- C32: met. The case's test passes on the unchanged tree as well (reviewer's run, "✓ activates the tab used before it, and then the one used before that"), so it cannot tell the neighbour rule from the most-recently-used rule. The added test "activates the tab used before it even when that is not a neighbour of it" fails on the unchanged tree ("expected 'e11c…' to be 'b811…'") and passes after. It tests the behaviour C32 was written for: with d, a, c used in that order, closing c must show a, not d (its neighbour), and closing a must show d, not b. See Proof 4.
- C33: met. layout-pinned.test.ts "the order a pane showed its tabs in".
- C34: met. layout-pinned.test.ts "reads only true as a pin", "both flags", "puts the pinned tabs first".
- C35: met. pinned.test.ts "a pinned tab that moves".
- C36: met. tab-wrap.test.ts `afterDelete` and tab-menu.test.ts "closes a pinned tab on Close".
- C37: met. tab-wrap.test.ts `wrappedInsertion`.

## 1. Spec

- 1. `src/lib/shell/panes/PaneView.svelte:132`: `provideTabActions();` with the return value dropped, and `<PaneStrip` at `:459` passes no `tabActions`.
  - What is wrong: the active file tab's controls never reach the strip. `Source.svelte:308-309` hands the `stripActions` snippet to the context store. Nothing in `src` reads it back: `TabActions.of` is called only in tests/views/sources/source.test.ts:91, and the only `tabActions=` anywhere is the test fixture tests/shell/fixtures/ActionsHost.svelte:14. The diff also removes the header toolbar and the `bar` row from `Source.svelte`. As built, a source tab draws Save, Revert, the star, Open in Program, Preview and Blame nowhere.
  - The report marks items 9 and 12 DONE and says "After: all at the strip's right end before Split Right and `...`". HELP.md ("A file tab's controls") and DESIGN.md say the same. Both are false as built.
  - Failure scenario: open any file in a source tab. No Save or Revert control exists. The reviewer's probe renders the workbench with a source tab: it fails on the final tree (`expected '<!--[--><div class="workbench …' to contain 'aria-label="Bookmark this file"'`) and passes on the unchanged tree.
  - Verdict: items 9, 12, 23 violated; C17 unmet.
- 2. Item 18. The report's measures table ends with "Colours are theme-defined and are not compared."
  - What is wrong: item 18 lists "active and inactive colours and borders" among the measures to read from VS Code 1.137 and bring the strip to. The report leaves them out, yet its first line says everything is done. VS Code's stylesheet names the colours through theme variables (`--vscode-tab-*`). Reading their default values from the installed theme files was not done, and was not reported as NOT DONE.
  - Failure scenario: at the look, an active or inactive tab's colour or border that differs from VS Code's passes unexamined, because the report never names a before and after for it.
  - Verdict: item 18 violated; C23 partial.
- 3. `src/lib/state/sessions/terminal/terminal-lists.ts:69`: `export function terminalLabel(held: Pick<Terminal, 'title' | 'kind' | 'command' | 'job'>)` replaces the old title-else-name `terminalLabel`. That rule moves to `terminalName`.
  - What is wrong: item 20 asks that the Terminal tab be titled by its list row's rule. The diff changes the label everywhere `terminalLabel` is read: the Sessions view's terminal rows (`TerminalRows.svelte:61`), the Processes view's group names (`context.ts:335`, `processes.ts`) and its Stop question. No item asks for that.
  - Failure scenario: with two Codex terminals running, the Processes view names both groups "Codex" (tests/state/system/machine/processes.test.ts:164 now expects `[CODEX, 'Codex']` where it expected 'codex two'), so the reader cannot tell which Stop ends which terminal. The Sessions row draws the kind tag "claude" beside the label "Claude".
  - Verdict: none (item 20 holds for the tab).
- 4. `src/lib/views/sources/files/sections/OpenEditors.svelte:253`: `background: var(--accent);`
  - What is wrong: the Open Editors unsaved dot changes from the row's text colour to the accent. No item asks for it; item 18 is the tab strip.
  - Failure scenario: the reader sees the Open Editors dot change colour, and the look has nothing in the brief to check it against.
  - Verdict: none.
- 5. Brief item 2, "a refused clipboard write shows the clipboard's refusal sentence the Files row menu shows".
  - What is wrong: this premise does not reproduce. `src/lib/views/sources/files/tree/menu/row-menu.ts:353` is `copy: (text) => void navigator.clipboard.writeText(text).catch(() => undefined)`, so the row menu has no refusal sentence. The step adds a new one, `ui.tab_copy_refused`. The report lists this as a judgment call. Under the spec's Report section it belongs in the first section as a premise disproved, with that grep.
  - Failure scenario: the orchestrator reads it as a wording choice. The Files row menu keeps swallowing a refused copy while the tab menu reports one, so the two menus behave differently on the same failure.
  - Verdict: none.

## 2. Proof

- 1. tests/shell/panes/strip/tab-menu.test.ts, "the close question over the tabs a close item closes": `const asked = closeAsk({ ids, unsaved, nameOf, many: 'Close 2 tabs?', busy: [] }); expect(asked?.message).toBe('Close 2 tabs?');`
  - What is wrong: the tests call the existing `closeAsk` directly. They never exercise `tab-menu-state.svelte.ts` `close()`, which is what routes a menu close through `askAndClose`. They would pass with `close()` calling `layout.closeInstance` directly.
  - The unsaved tab's name is not asserted, although C4 says "naming it". Nothing tests "nothing closed on No".
  - The busy test feeds a running program on tab 'a', which is the tab Close Others keeps, so it does not check that the question is about the tabs being closed.
  - Failure scenario: a change that skips the guard in `close()` closes a tab with unsaved text without asking, and the suite stays green.
  - Verdict: C4 partial.
- 2. tests/shell/fixtures/ActionsHost.svelte:14 (`<PaneStrip {...props as any} tabActions={mine} />`) and tests/views/sources/source.test.ts:88-93 (a hand-made `TabActions` read with `held.of(instance.id)`).
  - What is wrong: each half of the hand-up is tested against a stand-in for the other half. The link that matters, the pane reading the store and passing it to the strip, is untested. These tests stay green with the behaviour absent from the app, which is the case now (Spec 1).
  - Failure scenario: the suite reports C17 met while no source tab in the app has a Save control.
  - Verdict: C17 unmet.
- 3. `src/lib/state/shared/words/appearance.ts:89` `let wrapping = false;` and tests/checks/tree/boundaries.test.ts:314 `'lib/state/shared/words/appearance.ts:wrapping',`.
  - What is wrong: a file-scope mutable is added, and the boundaries check passes because the step adds the variable to the check's FROZEN allow list. The brief's item 4 asks for a reader in `setAppearance`, whose other keys (`tabBar`, `actionsAt`) are held the same way, so the brief directed this pattern. It is still an addition to an allow list, and it is the orchestrator's to accept.
  - Failure scenario: the list grows by one entry per new appearance key, and nothing makes the pattern stop at those keys.
  - Verdict: none.
- 4. tests/state/workbench/layout/open/pinned.test.ts, "activates the tab used before it, and then the one used before that" (the C32 test).
  - What is wrong: it passes on the unchanged tree (reviewer's run), so it would still pass with the most-recently-used rule taken out. The companion test the builder added does fail on the unchanged tree and covers the rule.
  - Failure scenario: a reader counts the C32 test as proof of item 22 when only the companion test proves it.
  - Verdict: none (C32 met through the companion test).
- 5. The report's "The cases' first run".
  - What is wrong: the report gives an aggregate (1488/1333/155) and per-case summaries. It quotes a failing line for only a few cases, and quotes no run on a scratch copy with each behaviour removed. The spec's "What every package obeys" requires, per new or changed test, its failing line on the unchanged tree, and says an aggregate count is not a first run.
  - The reviewer's own run reproduces the aggregate (1488/1332/156; the one difference is a load timeout in boundaries.test.ts, which passes alone).
  - Failure scenario: a test whose failure on the unchanged tree has another cause (a missing module, not the behaviour) cannot be told from a real first run. Five files fail only because their module does not exist.
  - Verdict: none.
- 6. tests/ui/tabs/tab-measures.test.ts, for example "takes %s from the pixels VS Code states" and "gives the tabs their least width on their line and moves the buttons under them".
  - What is wrong: every assertion reads the text of tokens.css or a component's style block. These are audits, but they are not titled "audits that" as the spec's "What every package obeys" requires, and the report's C23 row does not call them audits.
  - Failure scenario: a later reader treats a passing tab-measures run as proof the strip renders at VS Code's sizes, which only the look shows.
  - Verdict: none.

## 3. Standards

- 1. The builder's git use.
  - What is wrong:
    - Commands run: `git rm --cached` on `src/lib/state/workbench/layout/open/new-note.ts`, which left `D  tools/oculus/src/lib/state/workbench/layout/open/new-note.ts` staged; a `git show`; `git status --short --untracked-files=all` and `git ls-files --error-unmatch` in its script `scratchpad/x3c-b/swap.sh:12-13`; and the `git status` the report's Files section quotes. agents/spec.md, "Where you work", says a builder never runs a git command, read-only ones included.
    - The report's line "the brief allows `git diff` and `git status` only" states the rule wrongly, and it names two commands where four kinds were run.
    - The tree state is what the brief needs: the file is gone from disk (`ls` fails), nothing references it (`grep -rn "new-note" src tests` prints nothing), and its opener is replaced by `newTextFileOpener`, as item 20 asks. The staged `D` changes only the index; a wip commit of the worktree records the same deletion either way.
  - Failure scenario: a builder that stages files can leave the index and the worktree in different states. The orchestrator's landing commit then records what was staged rather than what was built, and the report says git use was narrower than it was.
  - Verdict: none.
- 2. `src/lib/state/workbench/layout/open/new-text-file.ts:6`: `const UNTITLED = 'Untitled-';`
  - What is wrong: the tab label a reader sees ("Untitled-1") is built from a literal in code. agents/spec.md, "What every package obeys", says every user-facing string comes from the text catalog through `t()`.
  - Failure scenario: the word cannot be changed or translated in `config/text/`, and the catalog audit does not see it.
  - Verdict: none.
- 3. Exports with no importer outside their own file and tests.
  - What is wrong:
    - `export function isPinned` and `export function unpinnedIn` (`open/pinned.ts:20`, `:25`). `unpinnedIn` has no caller at all.
    - `export function tabEdge` and `export function closeKind` (`strip/tab-menu.ts:54`, `:121`).
    - The `layout/index.ts` re-exports `FLOATS_VERSION`, `pinned`, `pinnedFirst`, `pinnedRun` and `unpinned`. A grep over src and tests finds no import of any of them through the index.
    - agents/spec.md, "The principles every package is judged on", says such an export is removed or made local.
    - `pinnedFirst` and `isPinned` also repeat the names of different functions in `state/boards/collection.ts`.
  - Failure scenario: a reader importing `pinnedFirst` from the layout index can confuse it with the boards function of the same name, and dead code is kept.
  - Verdict: none.
- 4. History wording in comments and test titles:
  - tests/shell/panes/strip/tab-path.test.ts:111 `it('is as before for a tab naming no file'`
  - tests/state/sources/explorer/sections/open-editors-tabs.test.ts:55 `'... a tab of another view is read as before'`
  - tests/state/workbench/layout/open/new-text-file.test.ts:28 `// Revert: open a 'note' tab as newNoteOpener did.`
  - tests/shell/panes/splitview.test.ts:219 `// Revert: let the share fall to a tenth, as the Markdown row's handle used to.`
  - What is wrong: agents/spec.md, "What every package obeys", bans 'as before' and 'used to' in comments and test titles, and the third names a removed function.
  - Failure scenario: a reader of the test cannot tell what is asserted now without knowing the code's earlier state.
  - Verdict: none.
- 5. Files near the size cap: `PaneView.svelte` 537 of 540 (482 at the base), `Source.svelte` 535 of 540 (528), `terminals.svelte.ts` 888 of 900 (876).
  - What is wrong: agents/spec.md, "What every package obeys", says a file within 20 lines of its cap is split. The step brought PaneView inside that band and grew the other two while they were in it.
  - Failure scenario: the next step that touches PaneView (Q91 and D25 share paths with this one) runs into the 540-line check and must split under pressure at landing.
  - Verdict: none.
- 6. The report's Files table.
  - What is wrong: no path is marked as outside the brief's write list, though many are. Among them: `shell/keys/palette-open.ts`, `state/sessions/folds.ts`, `state/sessions/terminals.svelte.ts`, `state/system/machine/processes.ts` and `processes.svelte.ts`, `state/workbench/layout/index.ts`, `state/workbench/navigation/pages.ts`, `state/sources/explorer/acts/compare.ts`, `themes/tokens.css`, `ui/frame/sash-size.ts`, `ui/menu/MenuList.svelte`, `ui/menu/menu-items.ts`, `ui/shown.ts`, `views/sources/files/tree/control/picks.svelte.ts`, `views/sources/source/Editor.svelte`, `StripActions.svelte`, `ask-perform.ts`, `gutter-read.ts`, `untitled-save.ts`, and `config/text/views/sources/source.yml`. agents/spec.md, "Where you work", requires each to be marked with its reason.
  - Failure scenario: the orchestrator cannot check the diff against the brief's paths, and Q91 and D25's shared-path judgment misses files such as `pages.ts` and `folds.ts`.
  - Verdict: none.
- 7. Edits to existing assertions are not listed.
  - What is wrong: agents/spec.md, "What every package obeys", requires the report to list every edit to an existing assertion with its before and after. The report says only "(their tests changed)". Unlisted edits include:
    - tests/state/system/machine/processes.test.ts: 'codex two' to 'Codex', and 'shell one' to 'zsh'.
    - tests/views/sessions/sessions.test.ts:599: `pane.name` to 'zsh'.
    - tests/views/sessions/terminal.test.ts:404-408.
    - tests/views/system/machine/processes.test.ts:144-151.
    - type-scale.test.ts: `.face=fs-lg | .close=fs-lg` to `fs-md | fs-xl`.
    - layout-locked.test.ts: version 5 to 6.
  - Failure scenario: an assertion bent to the new output (Spec 3) is not visible as one without reading the whole diff.
  - Verdict: none.

## 4. Behaviour

- 1. `src/lib/views/sources/source/Source.svelte:461`: `{#if editing && (draft.message !== '' || said !== '')}`. At the base, `:425` was `{#if said !== ''}` with no `editing` condition.
  - What is wrong: a refusal of the star or of Open in Program (`said`) is now shown only while the text may be written. On a read-only or truncated file (`locked` non-empty, so `editing` is false) the star and the program control are offered (`bookmarkable={head === undefined && !blocked}` at `:390`), but their refusal is no longer drawn. Item 12 says "a refusal stay[s] in view". The report says the refusal "stays in the view".
  - Failure scenario: open a read-only file and press the star while the bookmark write is refused. Before, "The bookmark could not be written: ..." showed in the bar. After, nothing shows. (This also depends on Spec 1, since the star is not drawn at all now.)
  - Verdict: item 12 violated.
- 2. The Sessions view's terminal rows and the Processes view's group names and Stop question (Spec 3).
  - What is wrong: both now read "zsh", "Claude" or "Codex" where they read the terminal's name (for example "45a932-shell" or "codex two"). The report states this only as a judgment call, without the before and after for each view, and its user-visible section names only the Terminal tab.
  - Failure scenario: the look on TEST checks the Terminal tab's title, and the change in the Sessions and Processes views goes unseen.
  - Verdict: none.
- 3. Consequences of Spec 1 that the report does not state:
  - The Markdown preview is now off by default (item 16), and its only toggle is in the undrawn strip snippet, so a reader cannot turn it on.
  - Blame cannot be turned on.
  - Revert has no control.
  - An untitled text from New Text File cannot be saved: by grep, `save()` in `Source.svelte:345` is called only from the strip snippet (`:396`), and Open Editors' Save All lists only tabs with a file.
  - Failure scenario: New Text File, type text, and nothing can save it.
  - Verdict: items 12, 16 (in use), C26 (in use).

## Declined to judge

- Every look item of the brief is the orchestrator's at landing on TEST. The reviewer opened no browser and did not touch ports 8787 or 8790. The look items:
  - a pinned tab and Delete on it;
  - the tab menu on a file tab;
  - wrapped tabs;
  - the breadcrumb over a source tab and a press on a folder segment;
  - a file tab's tooltip;
  - an Open Editors drag;
  - the source tab's buttons in the strip (absent: Spec 1);
  - a long palette row;
  - a new tab's place;
  - a preview table in a narrow pane;
  - the strip at 150% in a narrow pane and its measures against VS Code's (C22, C23, the 22px and 16px breadcrumb tokens of C16);
  - a diff tab's status bar;
  - Editor Actions Position and its check marks;
  - New Text File;
  - a floated terminal's scroll;
  - a Terminal tab's title;
  - the key sheet, the update tray and a Confirm with their focus and over a float (C29, C30);
  - the Memories overlay;
  - closing a tab after using three.
- C25's float clause: Q88c-15 saw a `...` on a float under Hidden. The reviewer's run shows the server-rendered workbench draws none under Hidden on the unchanged tree too, and `PaneStrip.svelte` draws the menu only under `shape.actions`. Whether another opener appears in the browser is for the look.
- Modals and the Memories overlay are moved to the body by `portal`. CSS custom properties set on an ancestor of the pane, other than `--text-scale`, which is set on `documentElement`, no longer reach them. Whether any such property changes a dialog's look is for the look.
- The ordering of Compare with Selected before Select for Compare follows the Files row menu (`row-menu.ts:246-249`). Whether VS Code 1.137's tab menu orders them the same was not checked against VS Code.
- The diagrams' freshness against the source was not rerun separately; `npm run test:checks` passed.
- Whether to accept Proof 3 (the FROZEN entry) is the orchestrator's ruling.

The reviewer made scratch copies of tools/oculus under the session scratchpad (rv-x3c-refuter/). Nothing in the worktree, the main checkout or the ledger was edited.

Reviewer usage: about 350,000 tokens, about 80 tool uses, about 40 minutes.
