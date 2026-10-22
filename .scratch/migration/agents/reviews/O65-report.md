# O65 report: a status bar that scrolls sideways, and editor keys that work as VS Code's do

Everything in the brief is done. The cases marked "Look" are checked by reading; their proof is the look at landing, which the builder does not run (spec.md:64). Two findings need the orchestrator's choice; they are under "Judgment calls" as J1 and J2.

## Open items of the state file

Verbatim from `.scratch/migration/orchestrator-state.md:190-194`:

> ## Open items (only what Axel must rule on; every report tells him these in plain words, decisions first, until he has ruled)
>
> An entry leaves this list for the closed log the moment Axel rules on it. What a review or a look found and no brief covered is not an open item: it is folded into an existing step in `plan.md` (Z468), never booked as a step of its own.

The section holds no entry.

## The cases' first run (unchanged tree, before any change)

Each case was read on the worktree at its base before the first edit; the base lines are quoted from `git show HEAD:<file>`, which prints the same tree.

- C1. Fails. `StatusBar.svelte:193` `{@attach fitOneRow}` hides items that do not fit; `:371` and `:386` `overflow: clip` scroll nothing; `:400` `.group > :global([data-left-out])` is `display: none`. No item is drawn past the width, and nothing scrolls.
- C2. Fails for the same reason: a left-out item cannot take the focus (`display: none`), and a clipped bar does not scroll a focused item into view.
- C3. Holds. The right group's `flex-direction: row-reverse` lays its items from the window's right edge with the bell last (`StatusBar.svelte:390-393` at base).
- C4. Holds. Unchecking an item in the right-click menu hides it through the ui store's hidden set and the menu keeps listing it (head comment `:25-27` at base).
- C5. Fails. `registerSettings` (`settings.ts`, 44 lines) gives settings to rite, cmake, fortran-free-form, fortran-fixed-form, jinja and svelte only; `latex` has no comment rule and no bracket pairs, so Cmd+/ does nothing and `{` adds no `}`.
- C6. Fails for shellscript, make, bibtex, matlab, ocaml, common-lisp, diff and julia (julia has Monaco's brackets but no `comments`, `definitions/julia/julia.js:1-20`).
- C7. Fails. The table test, written first and run on the unchanged code (command and output under check 2 below): `Tests  9 failed | 23 passed (32)`, failing `shellscript`, `bibtex`, `diff`, `julia`, `latex`, `common-lisp`, `make`, `matlab`, `ocaml`.
- C8. Holds for the environment completion and the list's Enter (`latex-editing.ts:179-198`, `latex-suggest.ts:48` read: they do not depend on language settings). The `@(` suggestion leaves a stray `)` once `(` auto-closes; at base no `(` auto-closed in latex, so the stray bracket appears only with bracket settings that lack LaTeX Workshop's `["@(", ""]` pair.
- C9. Fails. `LATEX_CHORD_SECONDS` held item and surround only; Cmd+L Cmd+L and Cmd+L Ctrl+Shift+M were bound to nothing in a LaTeX tab.
- C10. Holds. `latex-tab.svelte.ts:377` (promote) and `:402` (`chordKey(first, character)`) bind them.
- C11. Holds. A `.yml` file has no LaTeX tab, so Monaco's Cmd+L `expandLineSelection` runs.
- C12. Fails. The Keys view lists no row for the two chords (they do not exist).
- C13. Read as the item 4 table below; at base the rows of Cmd+K, its 31 chords and Ctrl+K on macOS fail (freed for the palette), Cmd+L and Ctrl+Shift+M in a `.tex` tab cannot reach their commands, and Cmd+/ in `.tex` and `.slurm` comments nothing.
- C14. Fails. With `fitOneRow`, an item arriving re-runs the fit and hides other items; there is no scroll to keep.
- C15. An item left out is not drawn, so no menu opens from it; a drawn item's menu is anchored by bits-ui to the trigger element, so it follows the item where it is drawn.
- C16. Holds at base for a bar that does not scroll; the ground is `.bar`'s own background (`:404-424` at base).
- C17. Fails. `matlab` has no settings, so Shift+Alt+A has no block comment.
- C18. Fails. `common-lisp` has no settings.
- C19. Holds for Cmd+L (no LaTeX tab binds outside a file on disk under a root, `latex-tab.svelte.ts:101-106`); Cmd+/ fails (no `latex` comment rule).
- C20. Fails for `.sty`/`.cls`: the tab bound every text chord and Cmd+L first press there (`style` was not told apart). Holds for `.bib`: the text and math chords were bound, and the two new chords did not exist.
- C21. Fails. `LATEX_CHORD_SECONDS` was one constant; no Ctrl+L Ctrl+M off macOS.
- C22. Fails. `latex-tables.ts` accepted a configured text chord on `l` or `w` (only the one-character and letters checks applied).
- C23. Holds for double-click on `word` in `\textbf{word}` with Monaco's default word pattern (`\`, `{` and `}` are separators). LaTeX Workshop's pattern differs on `_`, which it does not count as a letter.
- C24. Fails. `freedKeys` (`chords.ts:93-95` at base) bound Cmd+K to no command, so it opened the palette.
- C25. Fails for the same reason: Cmd+K opened the palette.
- C26. Fails. Ctrl+K on macOS was freed and opened the palette.
- C27. Holds. Outside the editor `togglesPalette` opens and closes the palette (`workbench-keys.svelte.ts:145-150` at base).
- C28. Holds. Cmd+Shift+P, F1 and Cmd+P are the workbench's in the editor (F1 freed, the other two bound by no Monaco command).
- C29. At base the menu was not reached either way: Cmd+K was freed, so the workbench's handler called `preventDefault` and opened the palette. With the change, read below under item 6.
- C30. Fails. `rows.ts:292` words a freed chord with `keys.palette` ("run from the palette").
- C31. Holds. `chordActions` listed the Cmd+K chord actions while a source tab is on screen.

No case was found that the brief's own rules get wrong, so the build went on without a stop.

## DONE / NOT DONE

| Item | State | Check that proves it |
|---|---|---|
| 1 status bar scrolls | DONE | read; look at landing |
| 2 nine languages' settings | DONE | C7 run, check 2 |
| 3 table test (G121) | DONE | check 2 |
| 4 Monaco key table, fixes | DONE | table below; look at landing |
| 5 LaTeX chords vs LaTeX Workshop | DONE | read; look at landing |
| 6 Cmd+K in the editor | DONE | check 7; look at landing |

1. `npm run diagrams && npm run test:quick`, run twice in full (the second after the last code change). The second run's lines:

```
test:quick: 34 changed file(s), from git since HEAD
test:quick: 10 test file(s)
        tests/ui/controls/editor/kit/comment-rules.test.ts: changed
        tests/checks/diagrams/palette.test.ts: named for a changed file
        tests/data/sources/config/settings.test.ts: named for a changed file
        tests/routes/sessions/latex.test.ts: named for a changed file
        tests/server/desktop/menu-template.test.ts: imports at depth 1
        tests/shell/keys/palette-page.test.ts: imports at depth 1
        tests/state/system/apps/app-keys.test.ts: imports at depth 1
        tests/state/sessions/served-roots.client.test.ts: imports at depth 2
        tests/ui/controls/editor/reach-text.test.ts: imports at depth 2
        tests/views/sources/bar-actions.test.ts: imports at depth 2
ok      prettier (6.6 s): All matched files use Prettier code style!
ok      ASCII gate (9.1 s)
ok      svelte-kit sync (11.1 s)
ok      vitest (49.2 s): Duration  33.06s (transform 47.11s, setup 0ms, import 57.72s, tests 1.66s, environment 339ms)
ok      vitest checks (52.5 s): Duration  36.30s (transform 1.52s, setup 0ms, import 4.60s, tests 31.23s, environment 0ms)
ok      eslint (52.9 s)
ok      svelte-check (74.5 s): 1792703305661 COMPLETED 536 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
test:quick: 86.0 s; every command passed
test:quick: not covered: tests that reach no changed file within the import depth,
            the build, the lint of unchanged files
```

The first full run also ended `test:quick: 84.7 s; every command passed`. The full list ran twice.

2. The table test alone. On the unchanged tree (an export of HEAD by `git archive HEAD`, with the final test file copied in and `node_modules` linked), `npx vitest run tests/ui/controls/editor/kit/comment-rules.test.ts`:

```
 FAIL  |unit| tests/ui/controls/editor/kit/comment-rules.test.ts > the comment rule of every language the editor registers > 'shellscript' has a comment rule
 FAIL  |unit| ... > 'bibtex' has a comment rule
 FAIL  |unit| ... > 'diff' has a comment rule
 FAIL  |unit| ... > 'julia' has a comment rule
 FAIL  |unit| ... > 'latex' has a comment rule
 FAIL  |unit| ... > 'common-lisp' has a comment rule
 FAIL  |unit| ... > 'make' has a comment rule
 FAIL  |unit| ... > 'matlab' has a comment rule
 FAIL  |unit| ... > 'ocaml' has a comment rule
AssertionError: expected undefined to be defined
      Tests  9 failed | 23 passed (32)
```

After the change, in the worktree:

```
 Test Files  1 passed (1)
      Tests  32 passed (32)
```

3. `grep -rn "leftOut\b\|fitOneRow\|DROP_ORDER\|one-row\.ts\|'./one-row'\|data-left-out" src docs tests` printed nothing, exit 1.

4. `wc -l` of every changed file (list under "Files"): components `StatusBar.svelte` 450 and `diff/DiffEditor.svelte` 513, at or under 520; every source file at or under 880 (`load.ts` 694 the largest). `config/catalogs/latex.yml` is 1464 lines, a data catalog whose line 1 comment alone changed.

5. `sh utils/unused-exports.sh` compared with `.agents/worktrees/migration-O65-base/unused-exports.txt`:

```
1c1
< Unused exports (230)
---
> Unused exports (231)
199a200
> src/lib/ui/controls/editor/chords.ts: editorChords
```

`editorChords` is used by `utils/diagrams/palette.mjs:106` (`.editorChords(true)`, a member read on the module that `ssrLoadModule` returns), which knip does not follow from the production entry points; `chordActions` in the same file uses it too. It stays exported for the palette page's writer. At base the same function, `removedChords`, was not listed because `monaco-keys.ts:14` imported it (`git show HEAD:src/lib/ui/controls/editor/keys/monaco-keys.ts`); `monaco-keys.ts` no longer reads the chords, since the Keys view now lists them from Monaco's registry like every other key, so the line is new.

6. History words in the comment lines and test titles added or changed (`git diff -U0` of `src utils tests config docs/HELP.md` plus the two new files, comment lines only, grep of the words of spec.md:44):

```
25:+            // In the editor Cmd+K is the first key of Monaco's chords, which Monaco takes before
77:+// first column), brackets, auto-closing and surrounding pairs, the characters before which a pair
136:+// ui/controls/editor/kit/rite/settings.ts waits for before it gives Julia's settings again. Each
```

Each "before" names an order of events, not an earlier state: the key handler order in `workbench-keys.svelte.ts`, Monaco's `autoCloseBefore` in `configuration.ts`, and the order of two calls in `src/monaco-modules.d.ts`. None is history.

7. `npm run docs:palette` rewrote `docs/palette.md` (`git diff --stat`: 6 lines changed against HEAD), then `npx vitest run tests/checks/diagrams/palette.test.ts --testTimeout 60000`:

```
 Test Files  1 passed (1)
      Tests  1 passed (1)
```

The timeout flag was needed only when the machine was loaded; the same test passed inside `test:quick` with its default timeout.

8. Names. `grep -rn "RemovedChord\|removedChords\|LATEX_CHORD_SECONDS\|keys\.palette\|palette: true\|run from the palette" src tests config docs README.md --exclude=local.yml` printed nothing, exit 1. The new names (`editorChords`, `EditorChord`, `latexChordSeconds`, `takesChordSecond`, `freedKeys`, `LATEX_WORKSHOP_LATEX`, `LATEX_WORKSHOP_BIBTEX`, `cmd_select_line`, `cmd_tab_focus`) are found only in `chords.ts`, `load.ts`, `monaco-keys.ts`, `settings.ts`, `latex-settings.ts`, `latex-tables.ts`, `editor-keys.ts`, `rows.ts`, `latex-tab.svelte.ts`, `config/text/views/academic/latex.yml` and `utils/diagrams/palette.mjs`, every one a definition or a caller.

The sentences "What is on the tree" names:

| Sentence | State |
|---|---|
| `docs/HELP.md:122` status bar | rewritten |
| `StatusBar.svelte` head comment `:28-36` | rewritten |
| `StatusBar.svelte` CSS `:356-358`, `:378-381` | rewritten |
| `status-items.ts` `DROP_ORDER` doc | removed with the constant |
| `status-items.ts` head comment `:1-29` | still true |
| `docs/HELP.md:94` Cmd+K | rewritten |
| `docs/HELP.md:128` | rewritten |
| `docs/HELP.md:173` Cmd+K row | rewritten |
| `docs/palette.md:3` and "Editor commands" | rewritten by `npm run docs:palette` from `config/text/palette-page.yml` |
| `chords.ts:1-15` head comment | rewritten |
| `monaco-keys.ts:1-6` head comment | rewritten |
| `palette.mjs:13` | rewritten |
| `chordActions` doc | rewritten |
| `menu-template.ts:10-12` | still true |
| `Editor.svelte:320`, `diff/DiffEditor.svelte:402` comments | Editor.svelte still true; DiffEditor.svelte rewritten |
| `kit/load.ts:346-348` comment | rewritten |
| `gutter/gutter.ts` comment on the freed keys | rewritten |
| `oculus-keys.ts:81` (audit answers `palette` for Cmd+K) | still true, outside the editor the palette takes Cmd+K |
| `grid-keys.ts:27` | still true |
| `editor-keys.ts` head and doc comments | rewritten |
| `latex-tables.ts` head comment | rewritten |
| `config/catalogs/latex.yml:1` | rewritten |

## Item 4: every default key Monaco 0.57 binds, against what oculus takes

How the list was made: `grep -rlE "registerCommandAndKeybindingRule|registerKeybindingRule|kbOpts|keybinding: \{|keybinding: \[|registerQuickPickCommandAndKeybindingRule"` over `node_modules/monaco-editor/esm/vs` (the TypeScript worker excluded) gives 49 files. Each file's `id`, `primary`, `mac`, `secondary`, `kbExpr`, `when` and `precondition` lines were read with grep. Of the 49, `platform/actions/common/actions.js` and `platform/keybinding/common/keybindingsRegistry.js` are the registries themselves; `find/browser/findModel.js` holds the find toggles' presses that `findController.js` registers, and is read with it. The Keyboard Shortcuts view reads the same registry at run time (`monaco-keys.ts`, `KeybindingsRegistry.getDefaultKeybindings()`), but lists only a binding whose command is an editor action with a label, so it shows fewer rows than this table (no cursor commands, no widget keys). oculus loads the whole package (`import('monaco-editor')`, `kit/load.ts:315`), so every file's bindings are registered.

What oculus binds in a source tab's editor beside Monaco: F1, F8, Shift+F8 bound to no command (`chords.ts` `freedKeys`, `load.ts:346-348`) for the workbench, as VS Code's workbench takes them; in a `.tex` LaTeX tab the presses of `editor-keys.ts` (Cmd+Alt+B, C, V, J, M, [ and ], first presses Cmd+L and Ctrl+Shift+M) and Enter and Alt+Enter (`latex-editing.ts:183-208`); Alt+F5 and Shift+Alt+F5 for the change marks (`gutter.ts:116-117`); Cmd+Enter while the rename box is open (`lsp/client.ts:352-362`, the rename with preview); and Tab or Shift+Tab right after an Escape Monaco did not take moves the focus out (`keys/tab-out.ts`). The workbench's own page keys (`page-keys.ts`: Cmd+S, Cmd+W, Cmd+N, Cmd+F, Cmd+Shift+T, Cmd+Shift+F, Cmd+Shift+H, Ctrl+Tab, Ctrl+-, F5, F9, F10, F11) reach the workbench only when the editor leaves them; of those only Cmd+F is a Monaco press, and Monaco takes it first, as in VS Code.

Language servers: `.tex` has texlab and `.yml` yaml-language-server (`src/lib/data/prose/lsp-servers.ts:175,193`) when installed and running; `.slurm` opens as `shellscript` (`config/defaults/sources.yml:82`) and has no server, as VS Code without a shell extension. "server" in a cell means the press reaches the command and the command answers what the language server provides; with no provider Monaco's precondition is false and the press runs nothing, as VS Code does for a language with no extension.

Words in the cells: "yes" the press reaches the command; "never met" the `when` is not true in a source tab, and why; "LaTeX" the press is the LaTeX tab's, as VS Code with LaTeX Workshop binds it; "Chrome?" Chrome or macOS may take the press before the page (not verified, the look decides). Function keys on a Mac keyboard need Fn unless "Use F1, F2 as standard function keys" is on.

### Cursor, selection and editing (coreCommands.js)

| Press (macOS) | Command | when | State | .tex | .slurm | .yml |
|---|---|---|---|---|---|---|
| Left / Ctrl+B | cursorLeft | textInputFocus | caret in text | yes | yes | yes |
| Shift+Left | cursorLeftSelect | textInputFocus | caret | yes | yes | yes |
| Right / Ctrl+F | cursorRight | textInputFocus | caret | yes | yes | yes |
| Shift+Right | cursorRightSelect | textInputFocus | caret | yes | yes | yes |
| Up / Ctrl+P | cursorUp | textInputFocus | caret | yes | yes | yes |
| Shift+Up | cursorUpSelect | textInputFocus | caret | yes | yes | yes |
| Down / Ctrl+N | cursorDown | textInputFocus | caret | yes | yes | yes |
| Shift+Down | cursorDownSelect | textInputFocus | caret | yes | yes | yes |
| PageUp | cursorPageUp | textInputFocus | caret | yes | yes | yes |
| Shift+PageUp | cursorPageUpSelect | textInputFocus | caret | yes | yes | yes |
| PageDown | cursorPageDown | textInputFocus | caret | yes | yes | yes |
| Shift+PageDown | cursorPageDownSelect | textInputFocus | caret | yes | yes | yes |
| Home / Cmd+Left | cursorHome | textInputFocus | caret | yes | yes | yes |
| Shift+Home / Shift+Cmd+Left | cursorHomeSelect | textInputFocus | caret | yes | yes | yes |
| Ctrl+A | cursorLineStart | textInputFocus | caret | yes | yes | yes |
| Ctrl+Shift+A | cursorLineStartSelect | textInputFocus | caret | yes | yes | yes |
| End / Cmd+Right | cursorEnd | textInputFocus | caret | yes | yes | yes |
| Shift+End / Shift+Cmd+Right | cursorEndSelect | textInputFocus | caret | yes | yes | yes |
| Ctrl+E | cursorLineEnd | textInputFocus | caret | yes | yes | yes |
| Ctrl+Shift+E | cursorLineEndSelect | textInputFocus | caret | yes | yes | yes |
| Cmd+Up | cursorTop | textInputFocus | caret | yes | yes | yes |
| Shift+Cmd+Up | cursorTopSelect | textInputFocus | caret | yes | yes | yes |
| Cmd+Down | cursorBottom | textInputFocus | caret | yes | yes | yes |
| Shift+Cmd+Down | cursorBottomSelect | textInputFocus | caret | yes | yes | yes |
| Shift+Alt+Cmd+Left/Right/Up/Down | cursorColumnSelect* | textInputFocus | caret | yes | yes | yes |
| Shift+Alt+Cmd+PageUp/PageDown | cursorColumnSelectPage* | textInputFocus | caret | yes | yes | yes |
| arrows, Shift+arrows in column mode | column selection overrides | columnSelection | never met: column selection mode is never switched on | - | - | - |
| Ctrl+PageUp | scrollLineUp | textInputFocus | caret | yes, Chrome? | yes, Chrome? | yes, Chrome? |
| Ctrl+PageDown | scrollLineDown | textInputFocus | caret | yes, Chrome? | yes, Chrome? | yes, Chrome? |
| Cmd+PageUp | scrollPageUp | textInputFocus | caret | yes | yes | yes |
| Cmd+PageDown | scrollPageDown | textInputFocus | caret | yes | yes | yes |
| Escape, Shift+Escape | cancelSelection | textInputFocus, a selection | text selected | yes | yes | yes |
| Escape, Shift+Escape | removeSecondaryCursors | textInputFocus, several cursors | Alt+click a second cursor | yes | yes | yes |
| Ctrl+O | lineBreakInsert | textInputFocus, writable | caret | yes | yes | yes |
| Shift+Tab | outdent | editorTextFocus, tab does not move focus | caret on an indented line | yes | yes | yes |
| Tab | tab | editorTextFocus, tab does not move focus | caret | yes | yes | yes |
| Backspace, Shift+Backspace, Ctrl+H, Ctrl+Backspace | deleteLeft | textInputFocus | caret | yes | yes | yes |
| Delete, Ctrl+D, Ctrl+Delete | deleteRight | textInputFocus | caret | yes | yes | yes |

Tab and Shift+Tab right after an Escape that Monaco did not take move the focus out of the editor (`keys/tab-out.ts`), an oculus rule so the keyboard is never held in the editor; VS Code has none.

### Undo, select all, clipboard (editorExtensions.js, clipboard.js)

| Press (macOS) | Command | when | State | .tex | .slurm | .yml |
|---|---|---|---|---|---|---|
| Cmd+Z | undo | editor focus | after an edit | yes | yes | yes |
| Shift+Cmd+Z | redo | editor focus | after an undo | yes | yes | yes |
| Cmd+A | editor.action.selectAll | none | caret | yes | yes | yes |
| Cmd+X | clipboardCutAction | writable | text selected | yes | yes | yes |
| Cmd+C | clipboardCopyAction | none | text selected | yes | yes | yes |
| Cmd+V | clipboardPasteAction | writable | text on the clipboard | yes | yes | yes |

In the desktop app the Edit menu's roles carry the same presses; the page takes them first (`menu-template.ts:10-12`), not verified in the app.

### Diff editor (widget/diffEditor/commands.js)

| Press (macOS) | Command | when | State | .tex | .slurm | .yml |
|---|---|---|---|---|---|---|
| F7 | accessible diff viewer next | isInDiffEditor | never met in a source tab; met in a diff tab | - | - | - |
| Shift+F7 | accessible diff viewer previous | isInDiffEditor | as above | - | - | - |
| Escape | diffEditor.exitCompareMove | comparing a moved block | never met in a source tab | - | - | - |

In a source tab F7 and Shift+F7 run the word highlight rows below.

### Anchor, brackets, transpose (anchorSelect.js, bracketMatching.js, transpose.js)

| Press (macOS) | Command | when | State | .tex | .slurm | .yml |
|---|---|---|---|---|---|---|
| Cmd+K Cmd+B | setSelectionAnchor | editorTextFocus | caret | yes | yes | yes |
| Cmd+K Cmd+K | selectFromAnchorToCursor | editorTextFocus, anchor set | after Cmd+K Cmd+B, move the caret | yes | yes | yes |
| Escape | cancelSelectionAnchor | editorTextFocus, anchor set | after Cmd+K Cmd+B | yes | yes | yes |
| Shift+Cmd+\ | jumpToBracket | editorTextFocus | caret at a bracket | yes | yes | yes |
| Alt+Cmd+Backspace | removeBrackets | editorTextFocus | caret inside a pair | yes | yes | yes |
| Ctrl+T | transposeLetters | textInputFocus, writable | caret between letters | yes | yes | yes |

Bracket rows in `.tex` use LaTeX Workshop's 70 pairs, in `.slurm` VS Code's three, in `.yml` Monaco's.

### Code actions, color picker, comments, context menu, cursor undo (codeActionCommands.js, standaloneColorPickerActions.js, comment.js, contextmenu.js, cursorUndo.js)

| Press (macOS) | Command | when | State | .tex | .slurm | .yml |
|---|---|---|---|---|---|---|
| Cmd+. | editor.action.quickFix | textInputFocus, writable, a code action provider | caret on a problem | server | none | server |
| Ctrl+Shift+R | editor.action.refactor | textInputFocus, writable, refactor actions | selection | server | none | server |
| Shift+Alt+O | editor.action.organizeImports | textInputFocus, writable, organize imports action | caret | server | none | server |
| Alt+Cmd+. | editor.action.autoFix | textInputFocus, writable, quick fixes | caret on a problem | server | none | server |
| Escape | hideColorPicker | standalone color picker shown | never met: its show command has no key and only Monaco's own command palette lists it, which oculus replaces | - | - | - |
| Enter | insertColorWithStandaloneColorPicker | standalone color picker focused | never met, as above | - | - | - |
| Cmd+/ | editor.action.commentLine | editorTextFocus, writable | caret on a line | yes (`%`) | yes (`#`) | yes (`#`) |
| Cmd+K Cmd+C | editor.action.addCommentLine | editorTextFocus, writable | caret | yes | yes | yes |
| Cmd+K Cmd+U | editor.action.removeCommentLine | editorTextFocus, writable | commented line | yes | yes | yes |
| Shift+Alt+A | editor.action.blockComment | editorTextFocus, writable | selection | runs, no block comment in LaTeX Workshop's file | runs, none in VS Code's file | runs, none in Monaco's yaml settings |
| Shift+F10 | editor.action.showContextMenu | textInputFocus | caret | yes | yes | yes |
| Cmd+U | cursorUndo | textInputFocus | after a caret move | yes | yes | yes |

### Paste and drop, cancel, find (copyPasteContribution.js, dropIntoEditorContribution.js, keybindingCancellation.js, findController.js, findModel.js)

| Press (macOS) | Command | when | State | .tex | .slurm | .yml |
|---|---|---|---|---|---|---|
| Cmd+. | change paste type | paste widget shown | a paste that offers more than one way; plain text offers one | never met with plain text | same | same |
| Escape | editor.hidePasteWidget | paste widget shown | as above | same | same | same |
| Cmd+. | change drop type | drop widget shown | a drop offering more than one way | never met with plain text | same | same |
| Escape | editor.hideDropWidget | drop widget shown | as above | same | same | same |
| Escape | editor.cancelOperation | a cancellable operation runs | while a slow go-to-definition waits | server | none | server |
| Cmd+F | actions.find | none | caret | yes | yes | yes |
| Cmd+E | actions.findWithSelection | none | selection | yes | yes | yes |
| Cmd+G / F3 | editor.action.nextMatchFindAction | editorFocus | after a find | yes | yes | yes |
| Enter | next match | find input focused | find widget open | yes | yes | yes |
| Shift+Cmd+G / Shift+F3 | previousMatchFindAction | editorFocus | after a find | yes | yes | yes |
| Shift+Enter | previous match | find input focused | find widget open | yes | yes | yes |
| Cmd+F3 | nextSelectionMatchFindAction | editorFocus | selection | yes | yes | yes |
| Shift+Cmd+F3 | previousSelectionMatchFindAction | editorFocus | selection | yes | yes | yes |
| Alt+Cmd+F | startFindReplaceAction | none | caret | yes | yes | yes |
| Escape, Shift+Escape | closeFindWidget | editorFocus, find widget visible | find widget open | yes | yes | yes |
| Alt+Cmd+C | toggleFindCaseSensitive | editorFocus | find widget open | LaTeX: Clean, as with LaTeX Workshop; Chrome? | yes, Chrome? | yes, Chrome? |
| Alt+Cmd+W | toggleFindWholeWord | editorFocus | find widget open | yes | yes | yes |
| Alt+Cmd+R | toggleFindRegex | editorFocus | find widget open | yes | yes | yes |
| Alt+Cmd+L | toggleFindInSelection | editorFocus | find widget open | yes | yes | yes |
| Alt+Cmd+P | togglePreserveCase | editorFocus | replace open | yes | yes | yes |
| Shift+Cmd+1 | replaceOne | editorFocus | replace open | yes | yes | yes |
| Enter | replaceOne | replace input focused | replace open | yes | yes | yes |
| Alt+Cmd+Enter | replaceAll | editorFocus | replace open | yes | yes | yes |
| Cmd+Enter | replaceAll | replace input focused | replace open | yes | yes | yes |
| Alt+Enter | selectAllMatches | editorFocus, find widget visible | find widget open, focus in it | yes | yes | yes |
| Up / Down, Alt+Up / Alt+Down | history.showPrevious / showNext | find input focused, history | find input after earlier searches | yes | yes | yes |

In `.tex`, Alt+Enter with the focus in the text runs the LaTeX tab's Insert Line After, as LaTeX Workshop's Alt+Enter does; with the focus in the find widget it selects all matches.

### Folding (folding.js)

| Press (macOS) | Command | when | State | .tex | .slurm | .yml |
|---|---|---|---|---|---|---|
| Alt+Cmd+] | editor.unfold | editorTextFocus | caret on a folded region | LaTeX: Demote, as with LaTeX Workshop | yes | yes |
| Alt+Cmd+[ | editor.fold | editorTextFocus | caret in a block | LaTeX: Promote, as with LaTeX Workshop | yes | yes |
| Cmd+K Cmd+] | unfoldRecursively | editorTextFocus | folded region | yes | yes | yes |
| Cmd+K Cmd+[ | foldRecursively | editorTextFocus | block | yes | yes | yes |
| Cmd+K Cmd+L | toggleFold | editorTextFocus | block | yes | yes | yes |
| Cmd+K Shift+Cmd+L | toggleFoldRecursively | editorTextFocus | block | yes | yes | yes |
| Cmd+K Cmd+/ | foldAllBlockComments | editorTextFocus | block comments | runs, LaTeX has none | runs, none | runs, none |
| Cmd+K Cmd+8 | foldAllMarkerRegions | editorTextFocus | `% region` / `#region` markers | yes | yes (VS Code's markers) | runs, Monaco's yaml settings have none |
| Cmd+K Cmd+9 | unfoldAllMarkerRegions | editorTextFocus | folded markers | yes | yes | as above |
| Cmd+K Cmd+- | foldAllExcept | editorTextFocus | caret in a block | yes | yes | yes |
| Cmd+K Cmd+= | unfoldAllExcept | editorTextFocus | folded blocks | yes | yes | yes |
| Cmd+K Cmd+0 | foldAll | editorTextFocus | blocks | yes | yes | yes |
| Cmd+K Cmd+J | unfoldAll | editorTextFocus | folded | yes | yes | yes |
| Cmd+K Cmd+1 to Cmd+7 | foldLevel1 to 7 | editorTextFocus | nested blocks | yes | yes | yes |
| Cmd+K Cmd+, | createFoldingRangeFromSelection | editorTextFocus | selection | yes | yes | yes |
| Cmd+K Cmd+. | removeManualFoldingRanges | editorTextFocus | a manual fold | yes | yes | yes |

### Format, problems, go to (formatActions.js, gotoError.js, goToCommands.js, referencesController.js, symbolNavigation.js)

| Press (macOS) | Command | when | State | .tex | .slurm | .yml |
|---|---|---|---|---|---|---|
| Shift+Alt+F | formatDocument | editorTextFocus, writable, a formatter | caret | the LaTeX tab's formatter (`latex-widget.ts:326`) | runs only with a formatter, none registered | server |
| Cmd+K Cmd+F | formatSelection | editorTextFocus, writable, selection, a range formatter | selection | server | none | server |
| Alt+F8 | marker.next | editorFocus | a problem in the file | yes | yes with a problem | yes |
| Shift+Alt+F8 | marker.prev | editorFocus | as above | yes | yes | yes |
| F8 | marker.nextInFiles | editorFocus | - | workbench (freed), walks the Problems view, as VS Code's workbench | same | same |
| Shift+F8 | marker.prevInFiles | editorFocus | - | workbench (freed) | same | same |
| Escape, Shift+Escape | closeMarkersNavigation | marker widget shown | after Alt+F8 | yes | yes | yes |
| F12 | revealDefinition | editorTextFocus, definition provider | caret on a name | server | none | server |
| Cmd+F12 | revealDefinition (web binding) and goToImplementation | editorTextFocus | caret on a name | server: implementation where the server has one, else definition | none | server |
| Cmd+K F12 / Cmd+K Cmd+F12 | revealDefinitionAside | editorTextFocus | caret on a name | server; where Monaco's standalone editor opens it is the look's | none | server |
| Alt+F12 | peekDefinition | editorTextFocus | caret on a name | server | none | server |
| Shift+Cmd+F12 | peekImplementation | editorTextFocus | caret on a name | server | none | server |
| Shift+F12 | goToReferences | editorTextFocus | caret on a name | server | none | server |
| Cmd+K F2 | togglePeekWidgetFocus | reference peek open | after Shift+F12 | server | none | server |
| F4 / F12 | goToNextReference | reference peek open | as above | server | none | server |
| Shift+F4 / Shift+F12 | goToPreviousReference | reference peek open | as above | server | none | server |
| Escape, Shift+Escape | closeReferenceSearch | reference peek open | as above | server | none | server |
| Enter / Cmd+Down | revealReference | peek tree focused | as above | server | none | server |
| Ctrl+Enter | openReferenceToSide | peek tree focused | as above | server | none | server |
| F12 | editor.gotoNextSymbolFromResult | several results of a go to | after a go to with several results | server | none | server |
| Escape | gotoNextSymbolFromResult.cancel | as above | as above | server | none | server |

VS Code desktop binds Cmd+F12 to Go to Implementation alone; Monaco adds Go to Definition on Cmd+F12 for the web, the binding VS Code for the web has. Not a failure.

### Hover, inline suggestions, in-place replace, line selection (hoverActions.js, hoverService.js, inlineCompletions commands.js, inPlaceReplace.js, lineSelection.js)

| Press (macOS) | Command | when | State | .tex | .slurm | .yml |
|---|---|---|---|---|---|---|
| Cmd+K Cmd+I | editor.action.showHover | editorTextFocus | caret on a word | yes, server hover | yes, shows problems only, and .slurm has none | yes, server hover |
| Cmd+K Cmd+I | workbench.action.showHover | none | the same press; the editor action wins in the editor | - | - | - |
| Up / Down / Left / Right | scroll the hover | hover focused | Cmd+K Cmd+I twice | yes | yes | yes |
| PageUp / Alt+Up, PageDown / Alt+Down | page the hover | hover focused | as above | yes | yes | yes |
| Home / Cmd+Up, End / Cmd+Down | hover top / bottom | hover focused | as above | yes | yes | yes |
| Alt+] / Alt+[ | next / previous inline suggestion | inline suggestion visible | never met: oculus registers no inline completion provider | - | - | - |
| Cmd+Right | inlineSuggest.acceptNextWord | inline suggestion visible | never met, as above | - | - | - |
| Tab / Shift+Tab | inline suggestion commit / alternative | inline suggestion or edit visible | never met, as above | - | - | - |
| Tab | jump to next inline edit | inline edit visible | never met, as above | - | - | - |
| Escape | hide inline completion | inline suggestion visible | never met, as above | - | - | - |
| Shift+Cmd+, | inPlaceReplace.up | editorTextFocus, writable | caret on a value | yes | yes | yes |
| Shift+Cmd+. | inPlaceReplace.down | editorTextFocus, writable | as above | yes | yes | yes |
| Cmd+L | expandLineSelection | textInputFocus | caret | LaTeX chord first press; Cmd+L Cmd+L runs it, as LaTeX Workshop binds | yes | yes |

### Lines (linesOperations.js)

| Press (macOS) | Command | when | State | .tex | .slurm | .yml |
|---|---|---|---|---|---|---|
| Shift+Alt+Up | copyLinesUpAction | editorTextFocus, writable | caret | yes | yes | yes |
| Shift+Alt+Down | copyLinesDownAction | editorTextFocus, writable | caret | yes | yes | yes |
| Alt+Up | moveLinesUpAction | editorTextFocus, writable | caret | yes | yes | yes |
| Alt+Down | moveLinesDownAction | editorTextFocus, writable | caret | yes | yes | yes |
| Cmd+K Cmd+X | trimTrailingWhitespace | editorTextFocus, writable | trailing spaces | yes | yes | yes |
| Shift+Cmd+K | deleteLines | textInputFocus, writable | caret | yes | yes | yes |
| Cmd+] | indentLines | editorTextFocus, writable | caret | yes | yes | yes |
| Cmd+[ | outdentLines | editorTextFocus, writable | indented line | yes | yes | yes |
| Shift+Cmd+Enter | insertLineBefore | editorTextFocus, writable | caret | yes | yes | yes |
| Cmd+Enter | insertLineAfter | editorTextFocus, writable | caret | yes | yes | yes |
| Cmd+Backspace | deleteAllLeft | textInputFocus, writable | caret mid-line | yes | yes | yes |
| Ctrl+K / Cmd+Delete | deleteAllRight | textInputFocus, writable | caret mid-line | yes | yes | yes |
| Ctrl+J | joinLines | editorTextFocus, writable | caret | yes | yes | yes |

### Linked editing, messages, multiple cursors (linkedEditing.js, messageController.js, multicursor.js)

| Press (macOS) | Command | when | State | .tex | .slurm | .yml |
|---|---|---|---|---|---|---|
| Shift+Cmd+F2 | editor.action.linkedEditing | editorTextFocus, writable, a linked editing provider | caret | none | none | none |
| Escape, Shift+Escape | cancelLinkedEditingInput | linked editing on | never met: no provider for the three | - | - | - |
| Escape | leaveEditorMessage | an editor message shown | type in a read-only editor (a file at HEAD) | yes | yes | yes |
| Alt+Cmd+Up | insertCursorAbove | editorTextFocus | caret | yes | yes | yes |
| Alt+Cmd+Down | insertCursorBelow | editorTextFocus | caret | yes | yes | yes |
| Shift+Alt+I | insertCursorAtEndOfEachLineSelected | editorTextFocus | lines selected | yes | yes | yes |
| Cmd+D | addSelectionToNextFindMatch | editorFocus | caret on a word | yes | yes | yes |
| Cmd+K Cmd+D | moveSelectionToNextFindMatch | editorFocus | a selection | yes | yes | yes |
| Shift+Cmd+L | selectHighlights | editorFocus | caret on a word | yes | yes | yes |
| Cmd+F2 | changeAll | editorTextFocus, writable | caret on a word | yes | yes | yes |

### Parameter hints, rename, smart select, snippets, sticky scroll (parameterHints.js, rename.js, smartSelect.js, snippetController2.js, stickyScrollActions.js)

| Press (macOS) | Command | when | State | .tex | .slurm | .yml |
|---|---|---|---|---|---|---|
| Shift+Cmd+Space | triggerParameterHints | editorTextFocus, a signature help provider | caret in a call | server | none | server |
| Escape, Shift+Escape | closeParameterHints | hints shown | as above | server | none | server |
| Up / Alt+Up / Ctrl+P | showPrevParameterHint | several signatures shown | as above | server | none | server |
| Down / Alt+Down / Ctrl+N | showNextParameterHint | as above | as above | server | none | server |
| F2 | editor.action.rename | editorTextFocus, writable, a rename provider | caret on a name | server | none | server |
| Enter | acceptRenameInput | rename box focused | after F2 | server | none | server |
| Cmd+Enter | acceptRenameInputWithPreview | rename box focused | after F2 | oculus's Rename with Preview (`lsp/client.ts:352-362`) runs it | none | same as .tex |
| Escape, Shift+Escape | cancelRenameInput | rename box focused | after F2 | server | none | server |
| Down / Up | focus next / previous rename suggestion | rename box with suggestions | after F2 | server | none | server |
| Ctrl+Shift+Cmd+Right / Ctrl+Shift+Right | smartSelect.expand | editorTextFocus | caret | yes (the LaTeX tab's ranges) | yes | yes |
| Ctrl+Shift+Cmd+Left / Ctrl+Shift+Left | smartSelect.shrink | editorTextFocus | after expand | yes | yes | yes |
| Tab | jumpToNextSnippetPlaceholder | in a snippet, a next stop | take a snippet suggestion | yes | yes | yes |
| Shift+Tab | jumpToPrevSnippetPlaceholder | in a snippet, a previous stop | as above | yes | yes | yes |
| Escape, Shift+Escape | leaveSnippet | in a snippet | as above | yes | yes | yes |
| Down / Up / Enter / Escape | sticky scroll line select / go / leave | sticky scroll focused | never met: Focus Sticky Scroll has no key and only Monaco's own command palette lists it | - | - | - |

### Suggest (suggestController.js)

| Press (macOS) | Command | when | State | .tex | .slurm | .yml |
|---|---|---|---|---|---|---|
| Ctrl+Space / Alt+Escape / Cmd+I | editor.action.triggerSuggest | textInputFocus, writable | caret after a word | yes, Ctrl+Space Chrome? (macOS input source) | same | same |
| Tab | acceptSelectedSuggestion | suggest visible | suggest open | yes | yes | yes |
| Enter | acceptSelectedSuggestion | suggest visible, accept on Enter | suggest open | yes | yes | yes |
| Shift+Enter / Shift+Tab | acceptAlternativeSelectedSuggestion | suggest visible, insert and replace range | suggest open on a word | yes | yes | yes |
| Escape, Shift+Escape | hideSuggestWidget | suggest visible | suggest open | yes | yes | yes |
| Down / Cmd+Down / Ctrl+N | selectNextSuggestion | suggest visible | suggest open | yes | yes | yes |
| PageDown / Cmd+PageDown | selectNextPageSuggestion | suggest visible | suggest open | yes | yes | yes |
| Up / Cmd+Up / Ctrl+P | selectPrevSuggestion | suggest visible | suggest open | yes | yes | yes |
| PageUp / Cmd+PageUp | selectPrevPageSuggestion | suggest visible | suggest open | yes | yes | yes |
| Ctrl+Space / Cmd+I | focusSuggestion | suggest visible, nothing focused | suggest open by typing | yes | yes | yes |
| Ctrl+Space / Cmd+I | toggleSuggestionDetails | suggest visible, an item focused | suggest open | yes | yes | yes |
| Cmd+/ | toggleExplainMode | suggest visible | suggest open | yes | yes | yes |
| Ctrl+Alt+Space | toggleSuggestionFocus | suggest visible | suggest open | yes | yes | yes |
| Tab | insertBestCompletion | tab completion on | never met: `tabCompletion` stays off, VS Code's default | - | - | - |
| Tab / Shift+Tab | insertNextSuggestion / insertPrevSuggestion | tab completion on | never met, as above | - | - | - |
| Cmd+C | suggestWidgetCopy | details focused | suggest details focused | yes | yes | yes |

### Tab focus mode, word highlight, words, word parts (toggleTabFocusMode.js, wordHighlighter.js, wordOperations.js, wordPartOperations.js)

| Press (macOS) | Command | when | State | .tex | .slurm | .yml |
|---|---|---|---|---|---|---|
| Ctrl+Shift+M | editor.action.toggleTabFocusMode | none | caret | LaTeX math chord first press; Cmd+L Ctrl+Shift+M runs it, as LaTeX Workshop binds | yes | yes |
| F7 | wordHighlight.next | editorTextFocus | caret on a word with other occurrences | yes | yes | yes |
| Shift+F7 | wordHighlight.prev | editorTextFocus | as above | yes | yes | yes |
| Alt+Left | cursorWordLeft | textInputFocus | caret | yes | yes | yes |
| Shift+Alt+Left | cursorWordLeftSelect | textInputFocus | caret | yes | yes | yes |
| Alt+Right | cursorWordEndRight | textInputFocus | caret | yes | yes | yes |
| Shift+Alt+Right | cursorWordEndRightSelect | textInputFocus | caret | yes | yes | yes |
| Alt+Backspace | deleteWordLeft | textInputFocus, writable | caret | yes | yes | yes |
| Alt+Delete | deleteWordRight | textInputFocus, writable | caret | yes | yes | yes |
| Ctrl+Alt+Backspace | deleteWordPartLeft | textInputFocus, writable | caret in camelCase or snake_case | yes | yes | yes |
| Ctrl+Alt+Delete | deleteWordPartRight | as above | as above | yes | yes | yes |
| Ctrl+Alt+Left | cursorWordPartLeft | textInputFocus | as above | yes | yes | yes |
| Ctrl+Shift+Alt+Left | cursorWordPartLeftSelect | textInputFocus | as above | yes | yes | yes |
| Ctrl+Alt+Right | cursorWordPartRight | textInputFocus | as above | yes | yes | yes |
| Ctrl+Shift+Alt+Right | cursorWordPartRightSelect | textInputFocus | as above | yes | yes | yes |

Word moves in `.tex` follow LaTeX Workshop's word pattern (letters, digits and marks; `__`, `**` and `...` each one word), so `\textbf{word}` gives `textbf` and `word`.

### Monaco's quick input, the action widget (standalone quickAccess, actionWidget.js, quickInputActions.js)

| Press (macOS) | Command | when | State | .tex | .slurm | .yml |
|---|---|---|---|---|---|---|
| F1 | editor.action.quickCommand | editorFocus | - | workbench (freed): the palette in command mode, as VS Code's F1 | same | same |
| Ctrl+G | editor.action.gotoLine | editorFocus | caret | yes, Monaco's own go-to-line box | yes | yes |
| Shift+Cmd+O | editor.action.quickOutline | editorFocus, a symbol provider | caret | server | none | server |
| Enter (with any modifiers) | quickInput.accept | quick input open | after Ctrl+G | yes | yes | yes |
| Escape | quickInput.hide | quick input open | as above | yes | yes | yes |
| Down / Ctrl+Down | quickInput.next | quick pick open | after Shift+Cmd+O | server | none | server |
| Up / Ctrl+Up | quickInput.previous | as above | as above | server | none | server |
| PageDown (any modifier) / PageUp | quickInput.pageNext / pagePrevious | as above | as above | server | none | server |
| Ctrl+Home / Ctrl+End | quickInput.first / last | as above | as above | server | none | server |
| Cmd+Down / Cmd+Up, Alt+Down / Alt+Up | next / previous separator | as above | as above | server | none | server |
| Alt+Cmd+Down / Alt+Cmd+Up | nextSeparator / previousSeparator | as above | as above | server | none | server |
| Right | quickInput.acceptInBackground | quick pick, input not focused or at its end | as above | server | none | server |
| Space | quickInput.toggleCheckbox | a quick pick with checkboxes | never met: Monaco's two boxes have none | - | - | - |
| Ctrl+Space | quickInput.toggleHover | quick pick open | as above | server | none | server |
| Escape, Shift+Escape | hideCodeActionWidget | code action menu open | after Cmd+. with actions | server | none | server |
| Escape | clearFilterCodeActionWidget | menu open and filtered | as above | server | none | server |
| Up / Cmd+Up / Ctrl+P | selectPrevCodeAction | menu open | as above | server | none | server |
| Down / Cmd+Down / Ctrl+N | selectNextCodeAction | menu open | as above | server | none | server |
| Left / Right / Space | collapse / expand / toggle section | menu with sections | as above | server | none | server |
| Enter / Cmd+. | acceptSelectedCodeAction | menu open | as above | server | none | server |
| Cmd+Enter | previewSelectedCodeAction | menu open | as above | server | none | server |

Bindings with no press on macOS, left out of the table since no key reaches them: `cursorLineStart` and siblings off macOS, `clipboardCopyWithSyntaxHighlightingAction`, `goToTypeDefinition`, `wordHighlight.trigger`, `findWithArgs`, the folding goto commands, and every Monaco command without `primary`.

Every row of the three files that does not reach its command where VS Code's (with LaTeX Workshop for `.tex`) would reached it at base for one of three causes, each fixed: Cmd+K, its 31 chords and Ctrl+K on macOS (freed for the palette: item 6, `chords.ts`, `load.ts`, `workbench-keys.svelte.ts`); Cmd+L and Ctrl+Shift+M in `.tex` (item 5: Cmd+L Cmd+L and Cmd+L Ctrl+Shift+M, `editor-keys.ts`, `latex-tab.svelte.ts`, `latex-editing.ts`); Cmd+/, Cmd+K Cmd+C/U, the brackets and the auto-closing in `.tex` and `.slurm` (item 2, `settings.ts`, `latex-settings.ts`). No other row was found failing by reading; the look presses them all.

## Item 6: what withholds a Cmd+K the editor dispatched

- Monaco's keybinding service listens on the editor's container (`standaloneServices.js:235-241`) and, for a press it finds bound or that starts a chord, calls `preventDefault` and `stopPropagation`. `workbench.action.showHover` binds Cmd+K Cmd+I with no `when` (`platform/hover/browser/hoverService.js`), so in any element inside `.monaco-editor` Cmd+K always starts a chord and never bubbles to the workbench's `onkeydown`. The find, rename and other widgets inside the editor's container are covered by the same listener, and the overflow widgets forward their keys to the editor's root (`options.ts`).
- In the desktop app the menu takes an accelerator only when the page leaves the press (`menu-template.ts:10-12`), and Monaco's `preventDefault` does not leave it, so Quick Open's Cmd+K (`desktop-keys.ts:77`) does not run. Read, not verified in the app.
- One press still reached the palette: Ctrl+K on macOS in a read-only editor, where `deleteAllRight`'s precondition `writable` is false, Monaco does not dispatch it and it bubbles to `togglesPalette`. Fixed in `workbench-keys.svelte.ts:146-149`: the handler returns for a target inside `.monaco-editor`. The menu's Quick Open is Cmd+K, not Ctrl+K, so it does not take that press.
- The audit of an app's keybindings keeps answering `palette` for Cmd+K (`oculus-keys.ts:81`, decision 10), unchanged.

## Files with line counts

| File | Lines | Note |
|---|---|---|
| `src/lib/shell/status/StatusBar.svelte` | 450 | item 1 |
| `src/lib/shell/status/one-row.ts` | deleted | item 1 |
| `src/lib/shell/status/status-items.ts` | 164 | item 1 |
| `src/lib/ui/controls/editor/kit/rite/settings.ts` | 358 | item 2 |
| `src/lib/ui/controls/editor/kit/rite/latex-settings.ts` | 179 | item 2, new |
| `src/lib/ui/controls/editor/kit/languages/configuration.ts` | 197 | item 2 |
| `src/monaco-modules.d.ts` | 293 | outside the list: the type of Monaco's Julia module that `settings.ts` imports |
| `tests/ui/controls/editor/kit/comment-rules.test.ts` | 119 | item 3, new |
| `src/lib/data/helpers/keys/oculus/editor-keys.ts` | 111 | item 5 |
| `src/lib/views/sources/source/latex/latex-tab.svelte.ts` | 483 | item 5 |
| `src/lib/ui/controls/editor/kit/latex/latex-editing.ts` | 265 | item 4 rows Cmd+L and Ctrl+Shift+M in `.tex`: the two commands the new chords run |
| `src/lib/data/sources/config/catalog/latex-tables.ts` | 172 | outside the list: item 5's leaving out of a configured chord on `l`, `w` or `m` |
| `config/catalogs/latex.yml` | 1464 | outside the list: its line 1 comment, made false by item 5 |
| `config/text/views/academic/latex.yml` | 219 | item 5 |
| `src/lib/views/system/help/keys/rows.ts` | 322 | items 5 and 6 |
| `src/lib/ui/controls/editor/chords.ts` | 154 | item 6 |
| `src/lib/ui/controls/editor/keys/monaco-keys.ts` | 76 | item 6 |
| `src/lib/ui/controls/editor/kit/load.ts` | 694 | item 6 |
| `src/lib/ui/controls/editor/diff/DiffEditor.svelte` | 513 | item 6, comment |
| `src/lib/ui/controls/editor/gutter/gutter.ts` | 434 | item 6 row Cmd+K: its comment on the freed keys |
| `src/lib/shell/keys/workbench-keys.svelte.ts` | 603 | item 6, Ctrl+K in a read-only editor |
| `src/lib/data/helpers/keys/oculus/palette-keys.ts` | 57 | item 6, doc comment |
| `src/lib/shell/keys/palette-page.ts` | 195 | outside the list: two doc comments on the chords, made false by item 6 |
| `config/text/views/system/help.yml` | 61 | item 6 |
| `config/text/palette-page.yml` | 38 | item 6 |
| `utils/diagrams/palette.mjs` | 152 | item 6 |
| `docs/HELP.md` | 550 | lines 94, 122, 128, 165-174 |
| `docs/palette.md` | 201 | written by `npm run docs:palette` |
| `docs/diagrams/layers.*`, `layer-data.*`, `layer-shell.*` | generated | written by `npm run diagrams` |

## Judgment calls

- J1 (for the orchestrator). Pin Editor and Unpin Editor show `Cmd+K Shift+Enter` in the palette (`state/workbench/palette.ts:331-357`), the chord VS Code binds them to. No key in oculus runs it: in the editor Cmd+K now starts Monaco's chords and Shift+Enter is no chord of Monaco's, and outside the editor Cmd+K opens the palette. At base the press opened the palette instead, so it never ran either. The palette page's text says the items stand in for that chord (`config/text/palette-page.yml` `editor_intro`). Options: (a) bind Cmd+K Shift+Enter in every editor to pin or unpin the tab, as VS Code does, a new user-visible key; (b) keep the hint as the name of VS Code's chord; (c) drop the hint. Recommendation: (a), since the step's line asks for the editor's keys to work as VS Code's do; (c) is the lazy option. Not built, since a new key is a user-visible shape the brief does not name.
- J2 (for the orchestrator). The one-press LaTeX keys Cmd+Alt+B, C, V, J and M are bound in `.bib`, `.sty` and `.cls` files too (`latex-tab.svelte.ts:297-327`), where LaTeX Workshop binds build, clean and view in class and package files, synctex and math preview only in LaTeX files, and in `.bib` none of them (its Cmd+Alt+C `when` reads `^build$` where `^bibtex$` is meant, so in VS Code Cmd+Alt+C in a `.bib` file toggles the find widget's case). None of the three files of item 4's table is affected. Left as it is: the brief scopes the chords and promote and demote, not the one-press keys.
- The configured text chords leave out `m` as well as `l` and `w` (`editor-keys.ts:83-88`, `takesChordSecond`): off macOS Ctrl+L Ctrl+M is tab focus mode, and one catalog serves every platform.
- Promote and demote take Cmd+Alt+[ and ] in a `.tex` file alone (LaTeX Workshop's scope); in `.bib`, `.sty` and `.cls` the keys fold and unfold. The commands stay in the palette there.
- Item and Surround (Cmd+L Cmd+Enter, Cmd+L Cmd+W) are keyed in a `.tex` file alone, as LaTeX Workshop binds them; in `.bib` the text and math chords stay keyed. In `.sty` and `.cls` no chord is keyed and every command stays in the palette without a key.
- Surround runs with no selection too (it inserts `\command{}`); LaTeX Workshop's binding needs a selection.
- Julia: Monaco loads its own Julia settings lazily, when a Julia model first appears, and those win over settings given earlier for the fields they hold (brackets, pairs). `registerSettings` gives VS Code's Julia settings again after Monaco's module has loaded (`settings.ts`, `onLanguageEncountered` then `setTimeout(0)`), so VS Code's pairs hold. The comment rule alone would survive without it.
- Ctrl+K in a read-only editor on macOS is left to the browser (no `preventDefault`), so it does nothing.
- Every Monaco editor on the page takes Cmd+K as its chord key, the merge editor's two sides and the diff editor's included, since the keybinding rules are Monaco's and global to the page.
- `tabCompletion` stays off and column selection mode is never switched on, as in VS Code's defaults, so their rows are never met.
- The LaTeX one-press keys Cmd+Alt+B, C and J are presses Chrome on macOS may keep (bookmark manager, inspect element, JavaScript console); not verified, the look decides. They are not Monaco's defaults and are not in item 4's table.

## Before and after, for the look

- Status bar, wide window (TEST, any page). Before and after: left group at the left edge, right group at the right edge, the bell last at the right edge.
- Status bar, narrow window (TEST, a source tab of a LaTeX file so the LaTeX and language server items show, narrow the window until the items do not fit). Before: items from the middle disappear. After: every item drawn; the bar opens at its left end with the right group following the left group; a trackpad swipe and a wheel turn over the bar scroll it to the bell; a swipe past either end does not navigate back; no scrollbar, the bar stays 22 px.
- Status bar, Tab through the items (narrow window): each focused item scrolls into view, the right group walked from its right end.
- Status bar, scrolled, an item arrives or leaves (start a LaTeX build, start a debug session, an app's item): the scroll stays where it is, clamped.
- Status bar, scrolled, open the branch picker with the item half out of view: the menu anchors to the item where it is drawn.
- Status bar, debugging and with a wallpaper, scrolled: the orange and the translucent ground fill the whole visible bar.
- `.tex` file in a LaTeX tab (TEST, `tests/fixtures/hubs/demo/projects/active/streaming-anomaly/manuscript/main.tex`). Before: Cmd+/ does nothing; `{` adds no `}`. After: Cmd+/ puts `% ` at the line's start and removes it again; `{` after a word adds `}`; a selected word and `(` surrounds it; `\begin{`, `\left(`, `\bigl[`, `\(`, `\[` and `\{` add no closing bracket; a backtick adds `'`; Enter after `\begin{itemize}` indents the next line, and typing `\end{` outdents (not for `document`); double-click on `word` in `\textbf{word}` selects `word`; double-click on `a_b` selects `a` alone (LaTeX Workshop's pattern does not count `_`); taking the `@(` suggestion leaves no stray `)`; `\begin{` still offers the tab's environment completion and Enter in a list still adds `\item`.
- `.tex` keys. After: Cmd+L Cmd+L selects the caret's line, again adds the next line; Cmd+L Ctrl+Shift+M toggles tab focus mode (then Tab moves the focus out of the editor); Cmd+L Cmd+B wraps in `\textbf`, Cmd+L Cmd+W surrounds, Cmd+Alt+[ promotes, all as before the change.
- `.sty` or `.cls` file: Cmd+L selects the line; Cmd+L Cmd+B does nothing of LaTeX's; Cmd+Alt+[ folds.
- `.bib` file in a LaTeX tab: Cmd+L Cmd+B wraps; Cmd+L Cmd+L and Cmd+L Ctrl+Shift+M do nothing; Cmd+/ comments with `% `; Cmd+Alt+[ folds.
- `.yml` file: Cmd+L selects the line; Cmd+/ comments with `# ` (unchanged).
- `.slurm`, `Makefile`, `.m`, `.ml`, `.lisp`, `.diff`, `.jl`: Cmd+/ comments with `#`, `#` at the line's start with no indent, `%`, `(* *)`, `;`, `#`, `#`; brackets auto-close. `.m` with lines selected and Shift+Alt+A: `%{` and `%}` each on their own line. `.jl` before: `'` added a closing `'` and a backtick did not; after: `'` adds nothing (the transpose `A'` types as written), a backtick adds a closing backtick.
- Cmd+K in the editor (`.yml` and `.tex`). Before: Cmd+K opened the palette. After: Cmd+K Cmd+C comments, Cmd+K Cmd+U uncomments, Cmd+K Cmd+0 folds all, Cmd+K Cmd+J unfolds all, Cmd+K then Q does nothing; no palette opens.
- Ctrl+K on macOS. Before: opened the palette everywhere. After: in the editor deletes to the line's end; in a read-only editor does nothing; with the focus in a view opens the palette.
- Cmd+K outside the editor (a Files row, the terminal, a form field): opens the palette, a second Cmd+K closes it (unchanged). In the editor Cmd+Shift+P and F1 open command mode, Cmd+P files (unchanged).
- Keyboard Shortcuts view (Help page, Keyboard Shortcuts tab). Before: the Cmd+K chords read "run from the palette". After: Cmd+K Cmd+C under Add Line Comment as an editor key, Ctrl+K under Delete All Right on macOS, no row reads "run from the palette", the Cmd+K row reads "open the palette, or close it when open; in the editor, the first key of the editor's chords"; the LaTeX rows list Cmd+L Cmd+L "Select the current line" and Cmd+L Ctrl+Shift+M "Toggle whether Tab moves the focus".
- The palette with a source tab on screen: lists the Cmd+K chord actions under Monaco's labels with the chord beside each, and Delete All Right with Ctrl+K on macOS (unchanged); `docs/palette.md`'s intro and "Editor commands" text say the chord runs the action in the editor.

## What the brief got wrong

- `features/json/jsonMode.js:137-140` does not export a `conf`: JSON's language configuration is set inside `setupMode`. The test reads it by running `setupMode` against stand-ins of the Monaco API (`vi.mock` of the worker manager and `Range`) and taking the configuration it sets.
- "Monaco merges a language's configurations field by field, so a rule set at start survives Monaco's later `conf`" holds for a field Monaco's `conf` lacks (Julia's `comments`); for a field it holds (Julia's brackets and pairs), Monaco's later registration wins (`languageConfigurationRegistry.js:181-206`, the later entry at equal priority is read first). Fixed by giving VS Code's Julia settings again after Monaco's.
- F7 and Shift+F7 are not only the diff editor's: in a source tab they run `wordHighlight.next` and `wordHighlight.prev` (`wordHighlighter.js`).
- Item 5 names `l`, `w` and Enter as the configured chord keys that collide; Enter cannot be a configured key (the reader takes one character of `[A-Za-z0-9-]`), and `m` collides off macOS, where Ctrl+L Ctrl+M is tab focus mode.
- "Cmd+Alt+[ and ] stay promote and demote": LaTeX Workshop binds them in LaTeX files alone, not in `.bib`, `.sty` or `.cls`; scoped to `.tex` with the chords.

## Doc text

For `agents/guarded.md`:

- G121. Guarantee: Every language the editor registers has a comment rule, so Cmd+/ and Shift+Alt+A comment in a file of any of them: the settings oculus gives Monaco, or Monaco's own settings of the id, hold a `comments` field.
  Code: `src/lib/ui/controls/editor/kit/rite/settings.ts` (`registerSettings`), `src/lib/ui/controls/editor/kit/rite/latex-settings.ts`, `src/lib/ui/controls/editor/kit/languages/configuration.ts` (`languageConfiguration`).
  Test: `tests/ui/controls/editor/kit/comment-rules.test.ts`, describe 'the comment rule of every language the editor registers', '$id has a comment rule', every row (32).
