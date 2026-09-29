# D13a report: the source tab's editor on Monaco (repair round 1 done, every item of the round built and the verify list green)

Not done: case 14, the look. The builder runs no browser, so what Monaco draws, the keys Alt+F5 and Shift+Alt+F5 pressed in a live editor, the blame column's padding on screen and the bold and italic drawn in Markdown are seen at the look at landing. Everything else in the brief and in round 1 is built, and each claim below names the command that shows it.

## Open items of the state file (verbatim, main checkout `orchestrator-state.md` lines 120-124)

An entry leaves this list for the closed log the moment Axel rules on it. What a review or a look found and no brief covered is not an open item: it is booked as its own step in `plan.md` and carried in the Booked section below, since it needs no ruling from him.

- None.

## Round 1, item by item

| Item | State | Proof |
| --- | --- | --- |
| 1 Blame escaped, column padded | DONE | `gutter.ts` `blameNumbers` hands every character of `& < > " '` as its entity; the primitive's style holds `.editor :global(.monaco-editor .line-numbers) { white-space: pre; }`, built into `.svelte-kit/output/client/_app/immutable/assets/2.CFr4d0vi.css` (`grep -loF ".monaco-editor .line-numbers{white-space:pre}"`). Case in `gutter.test.ts` "hands an author's markup to the column as entities, and counts the width as written" (`<img src=x onerror=alert(1)>` and `A & B`); red with the escape taken out |
| 2 Bold and italic drawn | DONE | `theme.ts` rules `markup.bold` and `markup.italic` take `--ink-txt` with their font style. `tests/ui/controls/editor/paint.test.ts` "answers markup.bold and markup.italic for markdown, drawn bold and italic", through the installed shiki 4.4.3 and @shikijs/monaco 4.4.3 with a stand-in Monaco recording `defineTheme` and `setTokensProvider`; red with `token: null` on the two rules (2 tests failed) |
| 3 A theme switch replaces the theme | DONE | `load.ts` `painter`: each paint makes a highlighter holding the one theme `oculus` and the grammars, bridges it over Monaco's own `setTheme` and `create`, then disposes the one before; the signature check and the queue stay. `paint.test.ts` "replaces the theme on a second paint, defining only oculus in the second colours" (only `oculus` defined, `editor.foreground` and the bold rule in the second reading's ink, `[true, false]` disposed); red when one highlighter is kept and `loadTheme` reused. "makes no highlighter for a paint whose tokens have not moved"; red with the signature check removed |
| 4 The marks from the keyboard | DONE, keys at the look | Go to Next Change (Alt+F5), Go to Previous Change (Shift+Alt+F5), Open Change (no key), added with `editor.addAction` under the view's words `source.next_change`, `source.previous_change`, `source.open_change` and said through `onactions` ahead of the removed chords' actions, so the palette lists them. Pure functions in `gutter.ts`: `stepMark` (the next or previous mark's first line, going round), `markAction` (open, step, or nothing) and `changeActions` (ids, labels, hints, key codes). HELP.md line 199 names the three, and the key table row at line 82 now covers the source tab's editor. The keys themselves are seen at the look |
| 5 Comments and the dead prop | DONE | `load.ts:6-11` and `Editor.svelte:7-9` say the page renders no component on the server (`ssr = false`), and the plain block is drawn until Monaco has loaded and by the unit suite's server render. `TextArea.svelte`'s `onscroll` prop and its comment are gone (`grep -n onscroll src/lib/ui/forms/TextArea.svelte` prints nothing). `source.test.ts:250-251` one comment for its one test. `tests/ui/colours.test.ts` names its case an audit of `theme.ts`'s text and points at `theme.test.ts:158-176` (the test spans 158 to 176, one line above the brief's 159). `chords.test.ts:99-102` says it compares the primitive's list with CMD_K, the 31 ids read from monaco-editor 0.57.0, read again for a later Monaco |
| 7 Contrast figures | DONE | Measured again, below |
| 8 Visible changes | DONE | Section below |

### Each round-1 case red under its revert

Every revert was a temporary edit of the source, the file restored from a copy in the scratch folder, and the file's run green again afterwards.

| Case (file) | Revert | Result |
| --- | --- | --- |
| markup escaped (`gutter.test.ts`) | escape removed from `blameNumbers` | red |
| bold and italic scopes (`paint.test.ts`) | `token: null` on the two rules | `Tests  2 failed \| 1 passed (3)` |
| second paint replaces the theme (`paint.test.ts`) | one highlighter kept, `loadTheme` on it each paint | `Tests  1 failed \| 2 passed (3)` |
| no highlighter for an unchanged paint (`paint.test.ts`) | signature check removed | `Tests  1 failed \| 2 passed (3)` |
| caret before the first mark (`gutter.test.ts`) | marks taken in the order handed, no sort | `Tests  1 failed \| 12 passed (13)` |
| caret between two marks | Previous takes the first mark before the caret | 3 failed, this case among them |
| caret after the last, going round | no going round at the ends | 3 failed, this case among them |
| caret on a deletion's wedge, and a wedge at the foot | `>=` for the next mark; the raw `mark.line` in place of the drawn line | each `Tests  1 failed \| 12 passed (13)`, this case |
| no mark | an empty list answers the caret's line | `Tests  1 failed \| 12 passed (13)` |
| Open Change on the caret's line (`gutter.test.ts`) | a line with no mark opens the first mark | `Tests  1 failed \| 14 passed (15)` |
| the keys of the three actions (`gutter.test.ts`) | Previous bound without Shift | `Tests  1 failed \| 14 passed (15)` |
| the palette lists the three with their keys (`palette.test.ts`) | `hint: action.hint` kept when empty; Next's hint emptied | each `Tests  1 failed \| 16 passed (17)` |

### The contrast figures (item 7)

A scratch vitest probe (`scratchpad/D13a-builder/probe/contrast.test.ts`, run with `npx vitest run --config <scratch>/probe/vc.mts`) reads each of the 17 themes through `tests/checks/look/themes.ts` (`NAMES`, `themeTokens`) and measures with `derive.ts`'s `ratio` on `--panel`. It prints:

```
themes 17
code roles bare under 4.5: 79 of 102
code roles -txt on --panel: 4.82 to 5.95, under 4.5: 0 of 102
green and red -txt on --panel: 4.88 to 13.06, under 4.5: 0 of 34
```

The range of the six code roles' `-txt` forms is 4.82 to 5.95, as the reviewer measured; the 5.01 to 5.82 in the round-0 report was wrong.

## The rulings of the round, carried

- The scope rules paint the `-txt` forms of the code hues and of green and red, which supersedes the brief's item 3 and case 4 on that point: the bare hues fall under 4.5:1 on `--panel` on 79 of the 102 theme and role pairs (measured above), and the code window already paints the `-txt` forms (`Code.svelte:98-150`).
- The meta hue goes on `meta.preprocessor`, `meta.directive`, `meta.tag`, `entity.name.tag`, `punctuation` and `variable`, not the bare `meta` scope, which wraps whole functions: accepted.
- TypeScript and JavaScript semantic checking is off and syntax checking on: accepted, since a one-file model has no project and the semantic check would underline every import. It is listed among the visible changes.
- `load.ts`'s module-level `loading` and `self.MonacoEnvironment` stay: they are the brief's mechanism, and `lib/ui/controls/editor/load.ts:loading` is in `FROZEN` of `tests/checks/tree/boundaries.test.ts` with its reason (Monaco keeps one theme, one set of key rules and its workers per page), as `generation.svelte.ts:held` and `glyphmode.svelte.ts:held` are.
- `EditorAction` and `EditorBlame` stay in both layers: `ui` may import only `ui`, `themes`, the text catalog and the markdown rule (`boundaries.test.ts:90`), and `state` imports no `ui`. The source view hands the one to the other, so svelte-check refuses a drift between the two definitions.
- Case 12 and verify item 2 are audits: under `ssr = false` the adapter's server output holds no component, so the grep is empty whatever `Editor.svelte` imports. `grep -rlE "data-editor-host" build/server` and `grep -rlE "StandaloneCodeEditor|shikiToMonaco" build/server` both print nothing. The intermediate `.svelte-kit/output/server/entries/pages/_page.svelte.js` does hold the compiled component (`grep -c -F data-editor-host` prints 1) and no Monaco or Shiki code (`StandaloneCodeEditor`, `shikiToMonaco`, `createHighlighter`, `MonacoEnvironment` each count 0); its only `monaco-editor` text is the primitive's CSS selectors.
- The paths outside "Paths this step writes" are named below with their reasons. The overlaps with Q79b (`tests/ui/colours.test.ts`, `tests/views/whole/type-scale.test.ts`, `tests/checks/source/html-sites.test.ts`, `tests/checks/tree/boundaries.test.ts`) and with Q96, now on main (`tests/ui/colours.test.ts` moved to `tests/ui/theme/colours.test.ts`, `DESIGN.md`), are merged by the orchestrator at landing; round 1 changed only the audit comment in `tests/ui/colours.test.ts` among them, as item 5 asked.

## DONE / NOT DONE

| Row | State | Proof |
| --- | --- | --- |
| Three libraries pinned exactly | DONE | `package.json`: `"@shikijs/monaco": "4.4.3"`, `"monaco-editor": "0.57.0"`, `"shiki": "4.4.3"` |
| Primitive `ui/controls/editor/` (10 items) | DONE | `ls src/lib/ui/controls/editor \| wc -l` prints 10 |
| Source tab on the primitive, asks on the model, `action` ask | DONE | `tests/views/sources/source.test.ts`, `editor-status.test.ts` |
| Palette `editor` kind, the three mark actions listed with their keys | DONE | `tests/shell/keys/palette.test.ts`, `palette-open.test.ts` |
| `typingIn` covers `.monaco-editor` | DONE | `tests/shell/keys/workbench-keys.test.ts` |
| Round 1 items 1 to 5, 7, 8 | DONE | table above |
| `docs/diagrams/` regenerated | DONE | `npm run diagrams` printed each `.dot` and `.svg`; `tests/checks/diagrams/diagrams.test.ts` green in the final run |
| Checks | DONE | output below |
| Server build holds no Monaco or Shiki (case 12, verify item 2) | DONE, an audit | `grep -rlE "StandaloneCodeEditor\|shikiToMonaco" build/server` prints nothing; an audit under `ssr = false`, as ruled |
| `bash bin/folder-check.sh` | DONE | exit 0 |
| Case 14, the look, with the Alt+F5 keys | NOT DONE | taken at landing; no browser here |

`PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH sh ~/.claude/skills/land/templates/checks.sh /Users/axelfaes/workspace/research-hub/tools/oculus/.scratch/migration/orchestrator-state.md </dev/null`, run once from `tools/oculus` after the last change, exit 0; the lines it prints for each command:

```
$ npm test
 Test Files  362 passed (362)
      Tests  5746 passed | 1 skipped (5747)
$ npm run check
1790690033907 COMPLETED 2097 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
$ npm run build
✓ built in 7.00s
✓ built in 16.74s
$ npm run format:check
All matched files use Prettier code style!
$ npm run lint
$ ! LC_ALL=C grep -rna '[^ -~]' src tests
checks: 6 commands passed
```

No test file timed out in that run. Under the load of another suite running in the main checkout, `tests/server/machine/pty/sessions.test.ts` (unchanged by this step) has failed once on `expected 'zsh' to be 'cat'` (the tmux pane's command read before `cat` started); alone, `npx vitest run tests/server/machine/pty/sessions.test.ts` prints `Tests  19 passed (19)`. The git test files named in the round-0 report can time out under the same load.

## Files with line counts (`wc -l`)

The primitive, `src/lib/ui/controls/editor/`: Editor.svelte 537, colours.ts 523, gutter.ts 226, load.ts 168, theme.ts 153, chords.ts 126, grammars.ts 40, tab-out.ts 37, types.ts 30, workers.ts 29. Its tests, `tests/ui/controls/editor/`: gutter.test.ts 213, theme.test.ts 177, chords.test.ts 158, paint.test.ts 127 (new in round 1), tab-out.test.ts 52, grammars.test.ts 43, monaco-sources.ts 24.

Changed in round 1 beyond the primitive and its tests: `views/sources/source/Editor.svelte` 216 (hands `changeWords`), `state/workbench/palette.ts` 245 (no hint for an action without keys), `ui/forms/TextArea.svelte` 114 (`onscroll` removed), `config/text/views/sources/source.yml` 24 (the three words), `HELP.md` 295 (lines 82 and 199), `tests/shell/keys/palette.test.ts` 372, `tests/views/sources/source.test.ts` 534, `tests/ui/colours.test.ts` 632, `docs/diagrams/` regenerated.

Changed in round 0 in the brief's paths: package.json, package-lock.json (47 packages added, none removed), `Source.svelte`, `editor-status.svelte.ts`, `editor-text.ts`, `Palette.svelte`, `palette-open.ts`, `workbench-keys.svelte.ts`, `file-git.ts`, `config/text/app.yml`, `DESIGN.md`, and the tests `workbench-keys.test.ts`, `palette-open.test.ts`, `editor-status.test.ts`. `Preview.svelte` and `src/app.d.ts` need nothing.

Paths outside the brief, each for a reason inside the step:
- `views/sources/source/Gutter.svelte`: its `markWords` moved to `file-git.ts`, so the editor's marks and the code window's say the same words.
- `state/sessions/source.svelte.ts` and `tests/state/sessions/source.test.ts`: `lineStart` removed with its test, since only the textarea editor used it.
- `tests/state/workbench/navigation/editor-text.test.ts`: `withEnding`, `indentUnit`, `convertIndent` and `caretOf` removed with their tests, since Monaco does each on its model; `shownLanguage` (the paint limit) tested.
- `tests/shell/status/status-bar.test.ts`: `actions: []` in its status literal.
- `state/shared/words/languages.ts`, `data/helpers/editor.ts`, `state/client/selectors.svelte.ts`, `config/behavior.yml`: comments that described the highlight.js mirror now describe the plaintext rule.
- `ui/forms/TextArea.svelte`: the dead `onscroll` prop (round 1, item 5).
- `config/text/views/sources/source.yml`: the three action words (round 1, item 4).
- `tests/ui/colours.test.ts`: the code window palette case over `ui/controls/editor/theme.ts`, now marked an audit.
- `tests/checks/tree/boundaries.test.ts`: `lib/ui/controls/editor/load.ts:loading` in `FROZEN` with its reason.
- `tests/checks/tree/allow-styling.ts`, `tests/checks/source/html-sites.test.ts`: the entries for the removed `.input :global(.area)` rule and `{@html painted}` site removed, since they would fail as stale.
- `tests/views/whole/type-scale.test.ts`: the view's Editor sets no type role, and the primitive is listed as `.editor=fs-sm`.

## Judgment calls the brief left open

1. **Colour keys with no VS Code default.** Monaco applies some null-default text keys unconditionally (`editor.findMatchForeground` at `findWidget.js:1208`, `editorBracketMatch.foreground` with `!important` at `bracketMatching.js:363`), so a transparent value would hide the text. An unset border or fill is transparent, an unset text colour is the ink, and `editor.selectionForeground` is `--ink 00`, which Monaco skips when transparent (`selections.js:329`), so a selection keeps its syntax colours.
2. **Text colours in their `-txt` form.** 131 foreground keys paint from the token's `-txt` form, as every text of the page does, and a `-txt` token the body does not carry yet falls back to its hue.
3. **Two more chords under Cmd+K.** `workbench.action.showHover` (K Cmd+I) and `togglePeekWidgetFocus` (K F2) are freed with the rest; the palette leaves them out, since `editor.getAction` has no action for a command.
4. **`meta` scope** (ruled, above).
5. **TypeScript and JavaScript semantic checking off** (ruled, above).
6. **Escape before Monaco drops the arm.** Monaco stops a key it took (`standaloneServices.js:235-241`), so the capture listener drops the arm on Escape and the bubble listener sets it only for an Escape Monaco let through.
7. **The line ending.** The model is made in the tab's line ending and handed back in it; a load or a revert replaces the model's text as one undoable edit without calling back.
8. **The palette hint** is drawn in the result row's third column in the kind word's muted style; an action with no keys (Open Change) carries no hint and draws none.
9. **The `look` value** is the view's `"<theme> <text scale>"`; the primitive repaints one frame after it changes.
10. **The wall.** Under `body.wall` Monaco's surfaces and the plain block take `color-mix(in srgb, var(--panel) var(--wall-panel), transparent)`, with the pane's blur.
11. **Model URI** is `inmemory://oculus/<instance>/<path>`, each segment URI-encoded (`load.ts` `modelUri`).
12. **Where a mark step goes** (round 1). Next goes to the first mark whose drawn first line is after the caret's line and Previous to the last one before it, so a caret inside a run steps back to that run's first line; a wedge counts at the line it is drawn on, the foot of the last line for a deletion at the end. The three action ids are `oculus.editor.nextChange`, `oculus.editor.previousChange` and `oculus.editor.openChange`. The palette lists the three whenever a source tab is on screen, a file with no marks included, where they do nothing.
13. **The hint's modifier name** is `Alt` on every platform, as HELP.md's key table writes the Diff view's same keys; macOS calls the key Option.

## Visible changes, before and after

- The source tab's editor: before, a textarea over a highlight.js mirror on `--chip`; after, Monaco on `--panel`, coloured by Shiki, with the minimap, sticky scroll, find widget, suggestions, hovers and Monaco's right-click menu, in the tokens' colours.
- Diagnostics: before, the textarea drew none; after, a TypeScript or JavaScript file shows Monaco's syntax errors underlined, and no semantic errors (no unresolved imports).
- The gutter: before, `Gutter.svelte` rows beside the textarea; after, the quick diff marks in Monaco's line-decorations lane (3px bar, 3px deletion wedge), the blame in the line-number column on each run's first line with the hover over the number, breakpoints as a red dot in the glyph margin (nothing hands any yet; D11 does). The read-only code window is unchanged.
- The blame column's text (round 1): before the round, an author's name was written into the margin's HTML as it was, so a name holding markup was drawn as markup, and the padding spaces collapsed, so the numbers of a blamed text did not line up; after, a name is drawn as its characters and the numbers sit in one column.
- Bold and italic in a Markdown file (round 1): before the round, `**bold**` and `*it*` were drawn in the plain text style; after, in bold and in italic, in the text colour.
- A theme switch (round 1): before the round, each switch added a theme to Shiki and to Monaco for the rest of the page's life; after, the page holds one theme, `oculus`, and one highlighter. On screen the colours follow the theme in both.
- The quick diff marks from the keyboard (round 1): before the round, the marks as Monaco decorations were reached only by the mouse, a loss against the old `ToolButton` marks a keyboard reached; after, Alt+F5 and Shift+Alt+F5 in the editor put the caret on the next or previous mark, going round at the ends, and Open Change opens the diff at the mark on the caret's line. The palette lists the three under "Editor" with `Alt+F5` and `Shift+Alt+F5` beside the first two.
- The palette: while a source tab is on screen, the three mark actions and the editor actions among the removed chords, 29 ids off macOS and 30 on it with Delete All Right, each one whose `editor.getAction` answers at run time, under Monaco's labels with the kind word "Editor" and the old chord as the hint, for example "Add Line Comment" and `Cmd+K Cmd+C`. Before, none.
- Cmd+K and Ctrl+K inside the editor open the palette, as they did from the textarea.
- Tab and Escape: Tab inserts indentation as before; an Escape that closed a Monaco widget no longer arms Tab to leave.
- A file past `editor.paint_limit_kb` opens as plaintext (`data-language="plaintext"`) instead of an uncoloured mirror.
- Blame press: before, a button in the blame column; after, a press on the blamed line's number.
- Bundle, from the final run's build log: the client page chunk `nodes/2` is 1732.61 kB (1700.39 kB on the unchanged tree). Monaco (`chunks/I7Dj73QH.js`, 2737.06 kB), Shiki's grammars and the workers (`ts.worker` 6916.04 kB, `css.worker` 1077.70 kB, `html.worker` 742.76 kB, `json.worker` 432.42 kB) are separate chunks loaded when an editor mounts. The ">500 kB chunk" warning was already printed on the unchanged tree.

## Monaco action ids and Shiki ids

- The 29 Cmd+K ids of the brief are confirmed against `node_modules/monaco-editor/esm`, each with the keys the package binds (`chords.test.ts`), plus `workbench.action.showHover` (K Cmd+I) and `togglePeekWidgetFocus` (K F2), both commands (`hoverService.js:97`, `referencesController.js:286`); 31 in all.
- Ctrl+K on macOS is `deleteAllRight` (WinCtrl+K).
- Monaco 0.57.0 binds nothing to F5 under `esm/vs/editor` (`grep -rn "KeyCode.F5\b"` prints nothing), so Alt+F5 and Shift+Alt+F5 take no key from it.
- The conversion runs `editor.action.indentationToTabs` and `editor.action.indentationToSpaces` (`contrib/indentation/browser/indentation.js:30,61`).
- Shiki ids against `bundledLanguages`: `bash` is `shellscript`, `lisp` is `common-lisp`, `makefile` is `make`, the other 15 by their own name; plaintext is Monaco's own (`grammars.test.ts`).
- The bridge maps a colour and a style to a scope only for a rule with a foreground (`@shikijs/monaco` `dist/index.mjs`, the `setTheme` wrapper), which is why bold and italic carry `--ink-txt`; `setTokensProvider` for a language replaces its entry, so a new paint's providers replace the old ones.

## Anything in the brief that was wrong

- The scope map's hues: ruled in round 1, above.
- `theme.test.ts:159-176` in round 1's item 5 is 158-176 on the tree; the comment names 158-176.

## Rule compliance

Round 1 ran no git command; `bash bin/folder-check.sh` and the test suite's temporary repositories run git themselves. Round 0 ran one read-only `git -C . diff --stat`, which the round-0 review recorded. No browser, no tmux on the default server, no server on 8787 or 8790, no `// revert:` line. Logs and probes are under `scratchpad/D13a-builder/`. The reviewer's `.scratch-refute/` at the worktree root was read and left as it was.
