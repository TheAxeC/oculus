# D13a report: the source tab's editor on Monaco

Everything in the brief is done. The editor's behaviour in a browser (case 14, the look) is not verified: the builder runs no browser, so every runtime claim about Monaco below is from reading the code and the package, and the look at landing is its check. The scope map paints the `-txt` forms of the code hues rather than the bare hues the brief names (evidence in "Anything in the brief that was wrong").

## Open items of the state file (verbatim, `orchestrator-state.md` lines 110-113)

- Z52, which of VS Code's right-click menu items Q88 builds (raised 2026-09-29 at /spec Q88). The inventory from VS Code's source (Z51 (c)) is in `agents/reviews/vscode-parity.md`, section "Right-click menus (owner Q88)", every item with its condition and oculus's side. About half the items run on an action oculus has (open, open beside, stage, unstage, discard, the stage and discard alls, open changes, reveal in the Files view, add and remove a root, download, kill, split, new terminal, close a pane, copy commit id and message) or need only the clipboard (copy path, copy relative path, cut, copy and paste in a preview or a text box, select all). The rest need a capability oculus lacks: in the Files view, New File, New Folder, Rename, Delete, Cut, Copy and Paste of files and folders, and Upload, each a write to the reader's disk through a new server route; Select for Compare and Compare Selected (a diff of two chosen files); in Source Control, Add to .gitignore and Cherry Pick; in the terminal, Rename, Change Icon, Change Color, Clear and Copy as HTML; on the pane's strip, a New Text File and the Tab Bar and Editor Actions Position settings. Items with no oculus counterpart (Timeline, Tests, Chat, Share, extensions, a second window, dictation) are left out in every option. Options:
  - (a) Q88 builds every item, the new capabilities included, in one step: the menus on every surface and the server routes for the file writes (Delete moving to the macOS Trash, as VS Code does where a trash exists), the two-file compare, the `.gitignore` write, cherry-pick, and the terminal's name, icon and colour. Complete in one landing, but one brief then carries new write routes on the reader's disk beside menus on six surfaces, which is the largest review in the plan.
  - (b) Q88 builds the menus on every surface with every item whose action oculus has or that needs only the clipboard; a step Q88b, next on the queue after Q88, builds every new capability the inventory names (the list above, each item named in the parity file), with Delete moving to the macOS Trash, and adds its items to the menus Q88 built. Recommended: the file writes are a new capability with their own safety rules (roots only, the Trash, a confirm), reviewed on their own, and nothing in the inventory is dropped.
  - Building only the items oculus has today and leaving the new ones out is the lazy option and is not offered.

## The cases' first run (unchanged tree, tests written first; log `scratchpad/D13a-builder/first-run.log`)

`npx vitest run` over the nine new or changed test files: `Test Files  8 failed | 1 passed (9)`, `Tests  11 failed | 62 passed (73)`.

| Case | First run on the unchanged tree |
| --- | --- |
| 1 Shiki's fit | No test, as the brief says; checked at the look |
| 2 Hex expansion | Red: `tests/ui/controls/editor/theme.test.ts` fails to import (no module, no `shiki`) |
| 3 Every colour key mapped | Red: same file |
| 4 Scope map | Red: same file |
| 5 Language map | Red: `grammars.test.ts` fails to import |
| 6 Removed chords | Red: `chords.test.ts` fails to import |
| 7 `typingIn` | Red: 3 cases, `typingIn` is not exported; a digit typed in the editor calls `railPage` |
| 8 Palette | Red: 2 cases in `palette.test.ts` (`editorItems` is not a function), 1 in `palette-open.test.ts` |
| 9 Paint limit | Red: `source.test.ts` finds no `data-language` on the editor |
| 10 Gutter decorations | Red: `gutter.test.ts` fails to import |
| 11 Breakpoints | Red: same file |
| 12 Server build | Green: `npm run build` exit 0, grep printed nothing (exit 1) |
| 13 Read-only window | Green: the code window, locked and cut file cases of `source.test.ts` pass |
| 14 The look | Taken at landing |

The `action` ask case in `editor-status.test.ts` passed at run time on the unchanged tree (the store keeps any ask); only `npm run check` turns it red, so it is an audit. No case was found that the brief's rules get wrong.

## DONE / NOT DONE

| Row | State | Proof |
| --- | --- | --- |
| Three libraries pinned exactly | DONE | `package.json`: `"@shikijs/monaco": "4.4.3"`, `"monaco-editor": "0.57.0"`, `"shiki": "4.4.3"`; the lock gained 47 packages and removed none |
| Primitive `ui/controls/editor/` (10 items) | DONE | `ls src/lib/ui/controls/editor \| wc -l` prints 10 |
| Source tab on the primitive, asks on the model, `action` ask | DONE | `tests/views/sources/source.test.ts`, `editor-status.test.ts` |
| Palette `editor` kind, `app.palette.kind_editor` | DONE | `tests/shell/keys/palette.test.ts`, `palette-open.test.ts` |
| `typingIn` covers `.monaco-editor` | DONE | `tests/shell/keys/workbench-keys.test.ts` |
| DESIGN.md 284, 288, new 289, 295 (was 294); HELP.md 85, 87, 199 | DONE | read back after the edit |
| `docs/diagrams/` regenerated | DONE | `npm run diagrams` printed each `.dot` and `.svg` |
| Checks | DONE | output below |
| Server build holds no Monaco or Shiki | DONE | `npm run build` exit 0, then `grep -rlE "StandaloneCodeEditor\|shikiToMonaco" build/server` printed nothing, exit 1 |
| `bash bin/folder-check.sh` | DONE | exit 0 |
| Case 14, the look | NOT DONE | taken at landing; no browser here |

`sh ~/.claude/skills/land/templates/checks.sh .../orchestrator-state.md`, run from `tools/oculus`, the lines it prints for each command (quoted as printed; the check mark is Vite's own output):

```
$ npm test
 Test Files  361 passed (361)
      Tests  5734 passed | 1 skipped (5735)
$ npm run check
1790685688438 COMPLETED 2096 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
$ npm run build
✓ built in 18.71s
$ npm run format:check
All matched files use Prettier code style!
$ npm run lint
$ ! LC_ALL=C grep -rna '[^ -~]' src tests
checks: 6 commands passed
```

Two earlier runs of the same script failed in `npm test` on timeouts in `tests/server/git/git-ops.test.ts` and `tests/server/core/git.test.ts` ("Test timed out in 5000ms") while `uptime` showed a load average of 11 to 13 from other agents' suites; both files pass alone (`npx vitest run tests/server/core/git.test.ts tests/server/git/git-ops.test.ts`: `Tests  79 passed (79)`) and touch nothing this step changed. They can time out again under the same load.

Non-ASCII in the documents and config: `LC_ALL=C grep -rnla '[^ -~]' DESIGN.md HELP.md config/text/app.yml config/behavior.yml` printed nothing.

Each new or changed test carries a `// Red when ...` line naming its revert, except `editor-status.test.ts`'s action case, whose comment names it as an audit at run time (red under `npm run check`).

## Files with line counts (`wc -l`)

New: `src/lib/ui/controls/editor/` Editor.svelte 521, colours.ts 523, theme.ts 154, load.ts 115, chords.ts 110, gutter.ts 131, grammars.ts 40, tab-out.ts 37, workers.ts 29, types.ts 27; `tests/ui/controls/editor/` theme.test.ts 177, chords.test.ts 155, gutter.test.ts 130, tab-out.test.ts 52, grammars.test.ts 43, monaco-sources.ts 24.

Changed in the brief's paths: package.json 65, package-lock.json, views/sources/source/Editor.svelte 210, Source.svelte 439, editor-status.svelte.ts 118, editor-text.ts 82, palette.ts 244, Palette.svelte 476, palette-open.ts 38, workbench-keys.svelte.ts 426, file-git.ts 183, config/text/app.yml 67, DESIGN.md 323, HELP.md 295, docs/diagrams/, tests source.test.ts 535, workbench-keys.test.ts 504, palette.test.ts 340, palette-open.test.ts 113, editor-status.test.ts 81.

Unchanged in the brief's paths: `Preview.svelte` (79) needs nothing, since it takes the fraction as before; `src/app.d.ts`, since `npm run check` resolves the `?worker` imports through `vite/client` with no declaration added.

Paths widened, each for a reason inside the step:
- `views/sources/source/Gutter.svelte` (179): its `markWords` moved to `file-git.ts` so the editor's marks and the code window's say the same words; head comment updated.
- `state/sessions/source.svelte.ts` (354) and `tests/state/sessions/source.test.ts` (461): `lineStart` removed with its test, since only the textarea editor used it.
- `tests/state/workbench/navigation/editor-text.test.ts` (65): `withEnding`, `indentUnit`, `convertIndent` and `caretOf` removed from `editor-text.ts` with their tests, since Monaco now does each on its model; `shownLanguage` (the paint limit) added with a test.
- `tests/shell/status/status-bar.test.ts` (295): `actions: []` in its status literal.
- `state/shared/words/languages.ts` (107), `data/helpers/editor.ts` (31), `state/client/selectors.svelte.ts` (494), `config/behavior.yml` (163): comments that described the mirror now describe the plaintext rule.
- `tests/ui/colours.test.ts` (630): the "code window palette" case for the view's Editor.svelte became a case over `ui/controls/editor/theme.ts`, holding it to the six `-txt` forms.
- `tests/ui/controls/editor/theme.test.ts` reads `tests/checks/look/themes.ts` to hold `bad` at none under all 17 themes.
- `tests/checks/tree/boundaries.test.ts` (599): `lib/ui/controls/editor/load.ts:loading` added to `FROZEN`, its reason in the docstring (Monaco keeps one theme, one set of key rules and its workers per page).
- `tests/checks/tree/allow-styling.ts` (147), `tests/checks/source/html-sites.test.ts` (317): the entries for the removed `.input :global(.area)` rule and `{@html painted}` site removed, since they would fail as stale.
- `tests/views/whole/type-scale.test.ts` (352): the view Editor now sets no type role (`''`), and the primitive is listed as `.editor=fs-sm`.

## Judgment calls the brief left open

1. **Colour keys with no VS Code default.** Monaco applies some null-default text keys unconditionally (`editor.findMatchForeground` at `findWidget.js:1208`, `editorBracketMatch.foreground` with `!important` at `bracketMatching.js:363`), so a transparent value would hide the text. The rule used: an unset border or fill is transparent, an unset text colour is the ink, and `editor.selectionForeground` is `--ink 00`, which Monaco skips when transparent (`selections.js:329`), so a selection keeps its syntax colours.
2. **Text colours in their `-txt` form.** 131 foreground keys (not the overview ruler, the minimap or `--c-on`) paint from the token's `-txt` form, as every text of the page does, and a `-txt` token the body does not carry yet falls back to its hue, as `var(--ink-txt, var(--ink))` does.
3. **Two more chords under Cmd+K.** `workbench.action.showHover` (K Cmd+I) and `togglePeekWidgetFocus` (K F2) are bound under Cmd+K too. They are freed with the rest; the palette leaves them out, since `editor.getAction` has no action for a command.
4. **`meta` scope.** The meta hue goes to `meta.preprocessor`, `meta.directive`, `meta.tag`, `entity.name.tag`, `punctuation` and `variable`, not the bare `meta` scope, which wraps whole functions in the grammars.
5. **TypeScript and JavaScript semantic checking off.** A one-file model has no project, so the semantic check would underline every import; syntax checking stays on.
6. **Escape before Monaco drops the arm.** Monaco stops a key it took (`standaloneServices.js:235-241`), so the capture listener drops the arm on Escape and the bubble listener sets it only for an Escape Monaco let through.
7. **The line ending.** The model is made in the tab's line ending and handed back in it; a load or a revert replaces the model's text as one undoable edit without calling back. Opening a mixed-ending file does not mark it dirty.
8. **The palette hint** is drawn in the result row's third column, in the kind word's muted style.
9. **The `look` value** is the view's `"<theme> <text scale>"`; the primitive repaints one frame after it changes.
10. **The wall.** Under `body.wall` Monaco's editor, background and margin surfaces and the loading placeholder take `color-mix(in srgb, var(--panel) var(--wall-panel), transparent)`, with the pane's blur, in the primitive.
11. **Model URI** is `inmemory://oculus/<instance>/<path>`, each segment URI-encoded; a leftover model on the same URI is disposed before a new one is made.

## Visible changes, before and after

- The source tab's editor: before, a textarea over a highlight.js mirror on `--chip`; after, Monaco on `--panel`, coloured by Shiki, with the minimap, sticky scroll, find widget, suggestions, hovers and Monaco's right-click menu, all in the tokens' colours.
- The gutter in the editor: before, `Gutter.svelte` rows beside the textarea; after, the quick diff marks in Monaco's line-decorations lane (3px bar, 3px deletion wedge), the blame in the line-number column on each run's first line with the hover over the number, breakpoints as a red dot in the glyph margin (nothing hands any yet; D11 does). The read-only code window is unchanged.
- The palette: while a source tab is on screen, the editor actions among the removed chords are listed, 29 ids off macOS and 30 on it with Delete All Right, each one whose `editor.getAction` answers at run time (not verified without a browser), under Monaco's labels with the kind word "Editor" and the old chord as the hint, for example "Add Line Comment" and `Cmd+K Cmd+C`. Before, none.
- Cmd+K and Ctrl+K inside the editor open the palette. Before, the textarea let them through too; Monaco would otherwise take them.
- Tab and Escape: Tab inserts indentation as before. After, an Escape that closed a Monaco widget no longer arms Tab to leave.
- A file past `editor.paint_limit_kb` opens as plaintext (`data-language="plaintext"`) instead of an uncoloured mirror.
- Blame press: before, a button in the blame column; after, a press on the blamed line's number (which Monaco also uses to select the line).
- Bundle: the client page chunk `nodes/2` grew from 1700.39 kB to 1730.35 kB. Monaco (2737 kB), Shiki's grammars and the workers (`ts.worker` 6916 kB, `css.worker` 1078 kB, `html.worker` 743 kB, `json.worker` 432 kB) are separate chunks loaded only when an editor mounts (sizes from the build log). The ">500 kB chunk" warning was already printed on the unchanged tree.

## Monaco action ids and Shiki ids

- The 29 Cmd+K ids of the brief are confirmed against `node_modules/monaco-editor/esm`, each with the keys the package binds (`tests/ui/controls/editor/chords.test.ts`, "names each action an id the installed monaco-editor binds to those very keys").
- Found beyond the brief: `workbench.action.showHover` (K Cmd+I) and `togglePeekWidgetFocus` (K F2), both registered with `KeybindingsRegistry.registerCommandAndKeybindingRule` (`hoverService.js:97`, `referencesController.js:286`), so commands, not editor actions. `revealDefinitionAside` is K F12, and also K Cmd+F12 in a web context; the second binding is freed by the same first key.
- Ctrl+K on macOS is `deleteAllRight`, confirmed (WinCtrl+K, with a secondary Cmd+Delete binding that is not freed).
- The conversion runs `editor.action.indentationToTabs` and `editor.action.indentationToSpaces`, confirmed at `contrib/indentation/browser/indentation.js:30,61`.
- Shiki ids confirmed against `bundledLanguages`: `bash` is `shellscript`, `lisp` is `common-lisp`, `makefile` is `make`, the other 15 by their own name, plaintext is Monaco's own (`grammars.test.ts`).

## Anything in the brief that was wrong

- **The scope map's hues.** The brief maps scopes to the bare `--c-code-*` hues and `--c-green`/`--c-red`. Measured over all 17 themes (a scratch vitest probe using `tests/checks/look/themes.ts` and `derive.ts`'s `ratio`), 79 of the 102 theme and role pairs of the bare hues fall under 4.5:1 on `--panel` (for example solarized `name` `#2563eb` 2.52, kanagawa `comment` `#6b7280` 2.93), while every `-txt` form clears it (5.01 to 5.82). The code window paints the `-txt` forms, and `tests/ui/colours.test.ts` holds that a file is coloured the same whether read or written. So the rules paint `--c-code-*-txt`, `--c-green-txt` and `--c-red-txt`, and case 4's test expects those names. The orchestrator may rule the bare hues instead; that is the same six tokens with the suffix dropped in `theme.ts` and its test.
- The brief's `typingIn` line (`:411`) and palette key line (`:93`) were right on the unchanged tree.

## Rule compliance

One read-only `git -C . diff --stat` was run in the worktree while checking the size of the change; it wrote nothing. No other git command was run apart from the ones inside `bin/folder-check.sh` and the test suite's own temporary repositories.
