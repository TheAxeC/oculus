## What is not done

- The language server path was not run against a real server. pyright is not installed and no clangd session was started. The D23 rows below come from reading the `.d.ts` and `.js` files, not from a live session.
- These were not tested: widgets clipped inside panes with `overflow: hidden`, colours under the translucent wallpaper surfaces (`body.wall`/`rice`), whether `@shikijs/monaco` works with Monaco 0.57, and memory use with many tabs. The spike ran 9 Monaco editors at once, no more.
- Nothing under `/Users/axelfaes/workspace/research-hub` was edited. No git command was run. The spike server ran on port 9311 and has been stopped.

## Spike commands and the output lines behind each Monaco answer

Spike folder: `/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/editor-spike/`. It is SvelteKit with adapter-node, Svelte 5.56, Vite 8.3.1, monaco-editor 0.57.0 and the CM6 packages. The Monaco files are `src/lib/monaco-setup.ts`, `src/lib/MonacoEditor.svelte` and `src/lib/MonacoDiff.svelte`. The CodeMirror files are `src/lib/cm-setup.ts` and the `/cm` page. The probe scripts are `probe-monaco.mjs`, `probe2.mjs` and `probe-cm.mjs`, which run oculus's `playwright-core` 1.63.0 in headless Chrome. `tokens.css` and `themes.css` are copied from oculus.

- **Build:** `npx vite build` gives `exit=0 ... ✓ built ... ✔ done`. The `/monaco` route keeps SSR on, and Monaco is imported only by a dynamic import inside `$effect`. `curl` gives `SSR /monaco 200`, and the server bundle has 0 files naming Monaco's internals. The server log shows only `[404] GET /favicon.ico`.
- **Workers:** Monaco 0.57's own worker loading (`new URL(..., import.meta.url)`) fails under Vite. The console shows `Failed to load worker script for label: editorWorkerService ... Failed to resolve module specifier "../../../base/common/worker/webWorkerBootstrap.js"`. The `?worker` pattern with `MonacoEnvironment.getWorker` works. The imports are `monaco-editor/editor/editor.worker?worker` and `monaco-editor/languages/features/{json,typescript,css,html}/*.worker?worker`, because the package's `exports` map drops `esm/vs/`. Once loaded, the probe shows `worker labels ["editorWorkerService","typescript"]`, TS markers `["Property 'foo' does not exist on type 'number'."]`, and the diff editor computing line changes.
- **Theme tokens:** Monaco's token rules refuse oculus's 3-digit hex: `Illegal value for token color: #fff`. The values have to be expanded to 6 digits first. After that, `themes applied 17`, `themes with bad tokens []` and `editor bg == --panel (all) true`.
- **Theme is global:** setting `updateOptions({theme:'vs'})` on editor a changes editor b too: `{"a":"rgb(255, 255, 254)","b":"rgb(255, 255, 254)"}`.
- **Global CSS:** Monaco adds 2 stylesheets (760 and 585 rules), a `<style monaco-colors>` with 983 rules that sets `--vscode-*` variables on `:root`, and small style elements.
  - 193 of 1758 selectors carry no monaco, codicon or mtk class.
  - 8 class names are shared with oculus's 533: `actions active error left locked right strip top`. Each appears only inside a compound selector that needs a Monaco-only ancestor, such as `.workbench-hover-pointer.left`.
  - Global `@keyframes` added: `fadeIn fadeOut fadein progress`. None of these names is defined globally in oculus.
  - oculus uses no `--vscode-` variables (`grep` count 0).
- **Keyboard:**
  - Standalone Monaco has 379 keybindings; 65 involve keys oculus uses (Escape, Cmd+K chords, F1, Shift+F10, Ctrl+K).
  - While Monaco has focus: Meta+k, Control+k, F1, F8 and Shift+F10 are consumed ("window saw Meta" only, or "nothing"; F1 opens the quick input). Control+1, Control+], Control+[, Alt+F5 and Meta+p reach the window.
  - After `addKeybindingRules([{Cmd+K, command:null}, {F1, '-editor.action.quickCommand'}])`: "after: Meta+k: window saw Meta k", and "after: F1: window saw F1; quick input open=false".
  - A window listener in the capture phase sees the key before Monaco, with `prevented:false`.
- **Focus defect:** in Chrome the focused element is `DIV.native-edit-context ce=false` (EditContext). oculus's `typingIn` (`shell/keys/workbench-keys.svelte.ts:437`) returns false for it, so the shell receives every typed key: `j@DIV n@DIV 1@DIV :@DIV ?@DIV /@DIV g@DIV`, none prevented. As things stand, typing a digit in the editor would switch pages. With `editContext:false` the focus is `TEXTAREA.inputarea matchesTextarea=true`.
- **Context menu:** with `contextmenu:false` Monaco draws no menu and the document receives the event unprevented (`{"menu":null,"documentGotEvent":[false]}`). With `contextmenu:true` Monaco swallows the event (`documentGotEvent: []`).
- **Hidden tab:** `before {layoutW:457, boxW:457, lines:13}`, `while hidden {layoutW:5, boxW:0}`. After resizing the viewport and changing the text while hidden, `shown again {layoutW:324, boxW:324, lines:13}` and the first line reads "changed while hidden". So `automaticLayout` recovers.
- **Model registry:** a second model on the same URI throws `ModelService: Cannot add model because it already exists!`. Live counts: `{"editors":9,"diffEditors":1,"models":9}`.
- **Playwright:**
  - `keyboard.type` works; the text reads back through the `onchange` draft and through `.view-lines` innerText, which only holds the visible lines.
  - `locator.fill` times out on the EditContext div. On the textarea (`editContext:false`) it appends instead of replacing.
  - Typing `f(x` gives `f(x)` because brackets auto-close.
- **CodeMirror 6 comparison (`probe-cm.mjs`):**
  - All 12 non-core grammars load: python, cpp, markdown, latex, makefile, lisp, ocaml, matlab, julia, r, ini, diff.
  - Changing the body class alone repaints: `dracula {"editor":"rgb(40, 42, 54)","panel":"#282a36"}`.
  - Focus is `DIV.cm-content ce=true`, so `typingIn` already works.
  - With the VS Code keymap, Meta+k reaches the window as `k(prevented)`.
  - The search panel is a bottom panel with 5 inputs and 6 buttons.
  - `locator.fill` works.
  - MergeView shows 2 chunks, 2 revert buttons and 2 collapsed regions; the unified view shows 1 deleted chunk and 1 accept button.
  - The minimap renders.

## Side 1: CodeMirror 6 brought to parity (all line counts are estimates)

| Parity row | CM6 provides / package | By hand, estimate |
|---|---|---|
| Undo, indent, brackets, auto-close, comments | `codemirror` 6.0.2 (2025-06-19), `@codemirror/commands` 6.11.1 | Alt+click and column drag set to VS Code's modifiers, 20 |
| VS Code default keys | `@replit/codemirror-vscode-keymap` 6.0.2, released 2023-01-09, 59 bindings, runs on view 6.43.13 | The missing defaults (Monaco has 379), 150 to 250 |
| Find and replace look and behaviour | `@codemirror/search` 6.7.2 (bottom panel, checkboxes) | Floating widget through `createPanel`, "N of M", find in selection, history, 300 to 400 |
| Multi-cursor | Core, plus keymap (Mod-d, Shift-Mod-l, add cursor up/down) | 10 |
| Folding | `@codemirror/language` foldGutter | Indent folding for the legacy-mode grammars, fold levels, regions, 130 |
| Minimap | `@replit/codemirror-minimap` 0.5.2, released 2023-12-12 | Theme and marks, 60 |
| Overview ruler | none | 120 to 180 |
| Bracket pair colours and guides | `rainbowbrackets` 2.0.2 (2023-04-21, one maintainer, fit not checked); indent markers `@replit/codemirror-indentation-markers` 6.5.3 (2024-07-15) | 150 to 200 |
| Sticky scroll | none found (npm search) | 200 to 300 |
| Go to line | `gotoLine` (small dialog) | VS Code's input at the top, 60 |
| Editor commands in the palette | none | 80 to 120 |
| Wrap, whitespace, rulers, occurrences | Core (`lineWrapping`, `highlightWhitespace`, `highlightWordAroundCursor`); rulers none | 50 |
| Suggest and hover look | `@codemirror/autocomplete` 6.20.3 | 150 |
| Theme from tokens | `var(--token)` directly; proven with no JS | 150 |
| 19 languages plus C++ | lang-python, javascript, json, css, markdown, xml, yaml, cpp; legacy-modes 6.5.4 (shell, properties, diff, julia, r, commonlisp, mllike, octave); `codemirror-lang-latex` 0.6.1 (2026-08-02); `codemirror-lang-makefile` 0.1.1 (2024-06-30) | Name mapping, 40 |
| Side-by-side and inline diff | `@codemirror/merge` 6.12.2 (2026-06-09): MergeView, unifiedMergeView, collapseUnchanged, revertControls, goToNextChunk | Mode switch, syntax colour, hunk and line staging glue, 250 to 350 |
| Three-way merge | none (merge is two-way) | 300 to 400, the same for both libraries |
| LSP (D23) | `@codemirror/lsp-client` 6.3.0 (2026-09-17): hover, definition, references, diagnostics, completion, rename, format, signature help | Workspace for several views and tab opening, transport, code actions, document highlight: 300 to 400 |
| Breakpoint gutter (D11) | `gutter()` plus StateField | Conditions, logpoints, inline values, stack line: 200 to 250 |
| Git marks and blame | `gutter()` | 80 |
| Primitive and mount | none | 150 |

**Side 1 total: about 3,000 to 3,800 hand-written lines (estimate).** The result looks close to VS Code but is not VS Code.

## Side 2: Monaco made to fit oculus

| Fit question | Answer | Evidence | Hand lines, estimate |
|---|---|---|---|
| SSR and node build | Works with a dynamic import in `$effect` | build exit 0; `SSR /monaco 200`; 0 server files | 0 |
| Web workers under Vite | Only through `?worker` and `MonacoEnvironment` | default path error quoted above; `?worker` loads editor and ts | 20 |
| Theming from tokens | `defineTheme` from the computed style; one global theme, which fits oculus since a page has one theme | 17 themes, 0 bad tokens, background = `--panel`; editor a and b change together | 180: 87 colour keys paint with fixed defaults (220 paint through CSS out of 433 registered); 3-digit hex expanded; redefine on theme change |
| Global CSS | Scoped by compound selectors; `:root` gets `--vscode-*` | 8 shared class names, none reachable; 4 global keyframes | 0 |
| Keyboard chords | Removal works through the supported `addKeybindingRules` (null or `-command`) | "after: Meta+k: window saw Meta k" | 40, plus 2 to 5 for `typingIn` to see EditContext (or `editContext:false`) |
| Menus | `contextmenu:false` hands the event to oculus | `documentGotEvent:[false]` | 80 to rebuild the items through `editor.getAction(id).run()`; lost: Monaco's own menu drawing |
| Layout, hidden tabs | `automaticLayout` recovers | 457 to 5 to 324 = box width | 10 |
| Layer rules | One `ui/editor/` primitive taking values and callbacks works (the spike's shape) | `MonacoEditor.svelte`, no state import | 150 |
| Global model registry | One model per URI | "Cannot add model because it already exists!" | 20: a URI per instance; only the LSP-bound file keeps a `file://` URI |
| Playwright testing | `keyboard.type` works; read the draft or `.view-lines`; `fill` fails on EditContext | lines quoted above | 40 of helpers; revert-check is library-independent |
| Many instances | 9 editors plus 1 diff editor on one page | `{"editors":9,...}` | 0 |
| Languages | 13 of 19 native; latex, lisp, matlab, ocaml, makefile and diff missing (id list read) | `esm/vs/languages/definitions` | 60 (`@shikijs/monaco`, unproven) to 700 (hand Monarch) |
| Diff (X3b) | `createDiffEditor`: renderSideBySide, hideUnchangedRegions, goToDiff, renderMarginRevertIcon | `editor.api.d.ts:4031-4123, 6524` | 200 to 250 of staging glue |
| Merge | none | as above | 300 to 400 |
| LSP (D23) | monaco-editor 0.57 ships a native `lsp` namespace (`MonacoLspClient`, `WebSocketTransport`, 21 providers, push and pull diagnostics). It sends `rootUri: null` and syncs every model on the page | `CHANGELOG.md` 0.55 and 0.56; `external/monaco-lsp-client/out/index.js` | 60 to 100 (transport, root injected by the relay, URI rules) |
| Breakpoints, git marks | glyphMargin and line decorations | `editor.api.d.ts:1746, 3305` | 180 to 210 |
| `@codingame/monaco-vscode-editor-api` 37.1.0 | Adds VS Code theme, TextMate, keybindings.json and model-reference services. `monaco-languageclient` 11.0.2 requires it (its dependencies); its `classic` mode with `EditorService` does not take over the layout (`apiWrapper.js`). VS Code's TextMate extensions cover latex, make and diff, not lisp, ocaml or matlab (npm view) | read this run | Not needed if the native `lsp` client is used |

**Side 2 total: about 1,500 to 2,100 hand-written lines (estimate).** The lower end assumes Shiki closes the grammar gap; the upper end assumes six hand-written Monarch grammars.

## Unproven risks

- **Monaco:**
  - The native LSP client against pyright and clangd: the root sent as null, and every model on the page (diff originals, merge panes) synced to the server.
  - Hover and suggest widgets clipped by panes; the `fixedOverflowWidgets` option exists but was not tried.
  - Colours under the translucent wallpaper surfaces.
  - `@shikijs/monaco` with 0.57.
  - Unmapped colour keys: any of the 87 fixed-default keys left unmapped shows VS Code's own colour, which breaks the rule that every colour is a token.
  - DESIGN.md says Terminal.svelte is the only file that reads a computed token, so that text would have to change.
- **CodeMirror 6:**
  - The keymap and minimap packages were last released in 2023.
  - Sticky scroll, overview ruler and the find widget exist only as estimates.
  - The rainbowbrackets fit was not checked.
- **Both:**
  - The Cmd+K clash: oculus's palette key against VS Code's Cmd+K chords. Monaco blocks it; CodeMirror with the VS Code keymap lets the event through already prevented, while oculus opens the palette anyway (`workbench-keys.svelte.ts:88` ignores `defaultPrevented`). This is a user-visible key decision, and it is Axel's.
  - Two tabs holding separate drafts of one file under a language server: LSP allows one document per URI.

## Recommendation: Monaco (`monaco-editor` 0.57 with its native `lsp` client) as one `ui/editor/` primitive

1. Parity is built into Monaco: 379 keybindings, the find widget, sticky scroll, bracket colouring, minimap, suggest, and the diff editor. On CodeMirror every one of those is a hand-built lookalike, together about 3,000 to 3,800 lines against about 1,500 to 2,100.
2. Every fit question the spike could test was solved through supported API: the SSR build, workers through `?worker`, 17 themes from tokens, keybinding removal, `contextmenu:false`, `automaticLayout` across hidden tabs, and 9 live instances.
3. The native `lsp` namespace already covers more of D23 than `@codemirror/lsp-client` (code actions, semantic tokens, inlay hints, symbols), without the CodinGame packages.

The fit costs are specific and bounded:

- `typingIn` must recognise EditContext. Without that, typing in the editor drives the shell.
- 3-digit hex has to be expanded.
- About 90 colour keys have to be mapped.
- 6 grammars are missing.

This agrees with the "Ruled. Monaco" line in `library-audit-H.md` section 2.1. CodeMirror 6 would be the better choice only if theming with no JavaScript were weighed above looking and behaving like VS Code.

**Open item for Axel:** does Cmd+K open oculus's palette inside the editor, or start VS Code's Cmd+K chords? I recommend keeping Cmd+K for the palette, since it is a shell chord, and removing Monaco's Cmd+K prefix with one null rule. The lazy option would be to leave both bound.
