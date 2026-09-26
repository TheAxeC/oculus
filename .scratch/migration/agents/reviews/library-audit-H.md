Library audit, part H: the open steps of plan.md

Every open step is covered and none is left out. Nothing was edited, no git command was run and nothing was installed. The library facts below come from `npm view <pkg> version license time maintainers repository peerDependencies dependencies deprecated`, run in this audit with a small wrapper script in the scratchpad, and from the pages named with each fact. Any fact not checked that way is marked "not checked".

## 1. Enumeration

Commands, run from `tools/oculus/.scratch/migration`:
- `grep -n "^- The queue" plan.md` gives line 262: "Q76; S2; X3b + Q78; Q77; X3a + X3c; Q67; L4; Q66; Q35; D11 + D13 + D14; D23 + D15 + D17; D18 + D20 + D24; A1 + A2 + A3; M3 + E1; M4; then Q72, R2, O29, O30, X2, then O33 last."
- `awk 'NR>=7 && NR<=258 { if ($0 ~ /^- /) { show = ($0 !~ /^- ✅/) } if (show) print NR": "$0 }' plan.md` prints every unticked step line with its Step 0 lines.
- A per-id grep for each queue id shows that Q76 (line 173), S2 (162) and Q67 (170) are ticked, so they are excluded.

Open steps: 29. By plan.md line:

| Line | Step |
|---|---|
| 123 | Q35 |
| 130 | M4 |
| 152 | L4 |
| 165 | X3a |
| 167 | X3b |
| 168 | X3c |
| 175 | Q78 |
| 176 | Q77 |
| 190 | Q72 |
| 192 | O33 |
| 193 | Q66 |
| 196 | M3 |
| 199 | D11 |
| 201 | D13 |
| 202 | D14 |
| 203 | D15 |
| 205 | D17 |
| 206 | D18 |
| 207 | D20 |
| 208 | D23 |
| 209 | D24 |
| 210 | E1 |
| 211 | A1 |
| 213 | A2 |
| 215 | A3 |
| 250 | R2 |
| 251 | O29 |
| 253 | X2 |
| 257 | O30 |

Excluded: O32 (line 178). It is marked NOT DONE and waits on Ordo's release 2.B, which is outside oculus.

Material read for these steps:
- Briefs that exist (from `ls agents/briefs/<id>*.md`): Q35, L4, X3b (85 lines), D11, D18, D20, D23, D24, E1, R2, X2, and Q75, which carries into Q72.
- Every Step 0 line.
- `agents/reviews/vscode-parity.md`, whole.
- `agents/reviews/axel-2026-09-21.md`, answers 10, 11, 14 and 19.
- The state file's X3 line (`orchestrator-state.md:600`), and its L1 and L2 closed items with the Monaco ruling.
- The X3b worktree's code, where X3b is built.

Two ledger defects found on the way:
- plan.md line 193 points Q66 at `agents/briefs/Q66.md`, which does not exist (`ls agents/briefs/Q66*.md` finds no match).
- D13's line (201) still says "CodeMirror 6". Axel's Monaco ruling (L2, closed 2026-09-26) supersedes it.

## 2. Capabilities where a library is a real option

### 2.1 The source editor (D13; the wrap in Q35; the breakpoint gutter of D11; the blame and gutter marks of X3b)

**What oculus has.** `views/sources/source/` holds Editor.svelte (410 lines), Code.svelte (132), Source.svelte (286) and Preview.svelte (73) on main (`wc -l`). It is a textarea over a highlight.js mirror. X3b's worktree raises these to Source 421 and Editor 431, and adds Gutter.svelte (184) for blame and the gutter marks.

**What D13 would build.** Undo history, indentation, bracket matching, multiple cursors, language modes for every D6 language plus Markdown and LaTeX, and the gutter D11 needs.

**Ruled.** Monaco, in a step booked after this audit. It is not reopened here.

**Open question within the ruling: which Monaco package.**
- `monaco-editor` 0.57.0: MIT, Microsoft, released 2026-09-24, no peer dependencies. Its dependencies are `marked` and `dompurify`, which oculus already has.
- `@codingame/monaco-vscode-editor-api` 37.1.0: MIT, CodinGame, released 2026-09-21. It is a drop-in Monaco built from VS Code's own sources, on `@codingame/monaco-vscode-api` 37.1.0.
- This matters because `monaco-languageclient` 11.0.2 depends on `@codingame/monaco-vscode-api` and `@codingame/monaco-vscode-editor-api` (from `npm view` dependencies). If D23 uses it (section 2.2), the editor step should import Monaco from the CodinGame package from the start, not from `monaco-editor`.

**What either package covers.**
- All of D13's list, the wrap in Q35 (the `wordWrap` option) and D11's breakpoint gutter (glyph margin decorations).
- X3b's gutter marks and blame column, as line decorations.
- A LaTeX language mode in Monaco's basic languages: not checked.

**Theme tokens.** Monaco takes colours through `editor.defineTheme(name, { colors })`, confirmed in the 0.57.0 `editor.api.d.ts`. oculus's tokens are read from the computed style and the theme is redefined whenever the theme changes. This is one component's job, in `ui/`.

**Layer rules.** The wrapper sits in `ui/` with values and callbacks only. Git and blame data come in as props from the view.

**Scope change.**
- D13 is superseded. Rewrite it as the Monaco step, or merge it into that step.
- Q35's "source tab with wrap" shrinks to one option.
- X3b's Gutter.svelte (184) becomes decorations.

**Options.**
- (a) `monaco-editor`. Pro: Microsoft's own package. Con: D23 then either hand-writes its LSP providers or swaps packages later.
- (b) `@codingame/monaco-vscode-editor-api`. Pro: `monaco-languageclient` works with no swap. Con: one organisation's packaging of VS Code, released in lockstep with VS Code.
- (c) Keep the textarea. This is ruled out by L2.

**Recommendation: (b), if Axel takes 2.2(a).** D23 then adds the client without a package swap in the middle of the plan. Otherwise (a).

### 2.2 The language server client (D23)

**What D23 would build.** pyright for Python and clangd for C++, one server per root and language, with hover, go to definition, references and diagnostics. It needs a relay from the page to a stdio process.

**Candidates.**
- `monaco-languageclient` 11.0.2: MIT, TypeFox, released 2026-09-24.
  - With its bridge `vscode-ws-jsonrpc` 4.0.2 (TypeFox, 2026-09-24), it connects Monaco to a server over a websocket. Its README shows hover, definition, references and diagnostics. It is framework-agnostic.
  - Covers all four features, plus completion and the rest of the protocol.
  - Leaves oculus to write: the server-side spawn and lifecycle (one process per root and language, started and stopped by oculus), and the relay on oculus's existing `ws`.
- `vscode-languageserver-protocol` 3.18.4 with `vscode-jsonrpc` 9.0.3: MIT, Microsoft, 2026-09-25. These are the types and the transport only. Every Monaco provider (`registerHoverProvider` and the others) would be wired by hand. Estimated 600 to 900 lines of glue that the client above removes.
- `@codemirror/lsp-client` 6.3.0 (2026-09-17): does not apply after the Monaco ruling.

**Servers.**
- `clangd` is at `/usr/bin/clangd`.
- `pyright` is not on PATH (`command -v`). The npm package `pyright` 1.1.414 (MIT, Microsoft, 2026-09-09) ships it.

**Layer rules.** The spawn and relay go in `server/machine/`, the client in `state/`. Only the editor component is in `ui/`.

**Options.**
- (a) `monaco-languageclient` plus `vscode-ws-jsonrpc`.
- (b) The protocol packages plus hand-written providers.
- (c) Everything by hand.

**Recommendation: (a).** It is the least code, and it is the client VS Code's own protocol library drives. (c) is the lazy option in the sense of the rules: it adds code the libraries already hold.

### 2.3 The debug client (D11)

**What D11 would build.**
- A `debug` channel relaying DAP between cathedra's `rite_dap` (stdio) and the page.
- Breakpoints in the editor gutter.
- A Debug view with the call stack, variables and stepping controls, and the output in a terminal pane.
- Every VS Code row of the parity table's Run and Debug section: conditional, hit count and logpoint breakpoints, watch, and evaluate in frame.

**Candidates.**
- `@vscode/debugprotocol` 1.68.0: MIT, Microsoft, released 2024-10-03. This is the DAP types. It removes hand-written message types (estimate: 150 to 250 lines) and no behaviour.
- `@codingame/monaco-vscode-debug-service-override` 37.1.0 (2026-09-21): VS Code's own debug UI. Its wiki ("List of service overrides") says it needs the `views` or `workbench` override. Both are "exclusive with the editor service" and take over the page layout. That breaks DESIGN.md's rule that the shell owns the layout and a view knows no layout. For the same reason, VS Code's own Explorer and SCM overrides are no option for X3a and X3b.
- `@vscode/debugadapter` 1.68.0: the server side. oculus does not need it, since cathedra provides the adapter.

**Options.**
- (a) `@vscode/debugprotocol` types, Monaco glyph margin for breakpoints, and a hand-built view.
- (b) The CodinGame debug override. It violates the layer rules and replaces the shell.
- (c) All by hand.

**Recommendation: (a).** No library supplies VS Code's debug views without taking over the page.

### 2.4 The diff pane, gutter marks and diff comments (X3b, A1)

**What X3b built in its worktree** (`wc -l` under `.agents/worktrees/X3b/tools/oculus`):

| File | Lines |
|---|---|
| state/sources/repositories/diff-rows.ts | 295 |
| state/sources/repositories/diff-words.ts (Myers) | 132 |
| state/sources/repositories/diff-patch.ts | 76 |
| views/sources/repositories/diff/DiffFile.svelte | 380 |
| views/sources/repositories/diff/Diff.svelte | 402 |
| views/sources/source/Gutter.svelte | 184 |

These draw side by side and inline diffs, word marks, folding, hunk and line stage, unstage and revert, and gutter marks.

**Ruled.** The Source Control diff moves to Monaco.

**Monaco's `createDiffEditor`** (0.57.0 `editor.api.d.ts`, read this run):
- Declares `renderSideBySide`, `useInlineViewWhenSpaceIsLimited`, `renderMarginRevertIcon`, `renderGutterMenu`, `originalEditable` and `diffAlgorithm` ('legacy' or 'advanced').
- `hideUnchangedRegions` and a next or previous change method: not checked (the fetch was cut before them).
- It has no merge editor.

**What Monaco removes.** diff-rows, the word marks of diff-words, DiffFile, most of Diff.svelte, and Gutter. Estimated at 1,000 to 1,250 lines.

**What stays.**
- `diff-patch.ts`, which builds the partial-hunk patch fed to `git apply --cached`. Monaco gives line changes, not patches.
- The hunk and line actions, as Monaco gutter actions.
- The bar, the toggle and the git calls.

**Other candidates.**
- `diff` (jsdiff) 9.0.0: BSD-3-Clause, released 2026-04-13. It covers diff-words' Myers (`diffWords`, `diffArrays`) and can write whole-hunk patches (`structuredPatch`, `formatPatch`). Line-selected patches are still oculus's.
- `diff2html` 3.4.56: MIT, released 2026-01-31. It draws unified diff text as HTML, which is not VS Code's diff editor.
- `parse-diff` 0.12.0: MIT, released 2026-04-17. It parses only.
- `@vscode/diff` 0.0.2-0: a pre-release of VS Code's diff algorithm.

**A1 (a comment on a line of a session's diff).** Monaco's view zones or content widgets place the input on the line. VS Code's comment widget is workbench code; whether it is in Monaco: not checked.

**Scope change.** X3b's hand diff is in flight, with repair round 1 per `orchestrator-state.md:33`. Options:
- (a) Land X3b as built and let the Monaco step replace the diff pane and gutter. X3b's browser specs (a hunk staged, a line unstaged, a gutter mark opening the diff) become the Monaco step's acceptance tests.
- (b) Cut the diff pane and gutter out of X3b before landing, and hold X3b until Monaco. This rebuilds X3b's proofs later.

**Recommendation: (a).** The proofs carry over and nothing is thrown away twice. The Monaco step's brief names every file of the table above as its removal list.

### 2.5 The three-way merge editor's model (X3b)

**What oculus has.** In the X3b worktree:
- `state/sources/repositories/merge-regions.ts` (232 lines): cuts the base, ours and theirs into settled and conflicting regions, and tracks the result the reader types.
- `diff-words.ts`'s `common()`, which merge-regions calls.
- `merge/Merge.svelte` (290) and `merge/MergeSide.svelte` (177).

**Neither editor library has a three-way editor.** Monaco's 0.57.0 API has none (read this run). `@codemirror/merge` 6.12.2 takes two documents (state file, L2). So the editor panes stay oculus's, drawn as three Monaco editors after the Monaco step.

**Candidates for the region computation.**
- `node-diff3` 3.2.1: MIT, bhousel, released 2026-06-03, no dependencies. Its README (read this run) gives `diff3Merge(a, o, b, { excludeFalseConflicts })`, which returns alternating ok and conflict blocks carrying a, o and b. It also has `diff3MergeRegions` and `LCS`. It covers the region cut and the Myers use in merge-regions. Estimate: 120 to 180 lines removed across merge-regions and diff-words.
- `diff3` 0.0.4: released 2022-07-25, Axosoft. Stale.

**What stays.** The typed-result piece tracking, the accept actions, and the view.

**Options.**
- (a) `node-diff3` for regions.
- (b) jsdiff `diffArrays` for the LCS only, with regions kept by hand.
- (c) Keep.

**Recommendation: (a),** folded into the Monaco step, which rewrites these panes anyway.

### 2.6 Git reads and writes (X3b's new forms; A2's worktree start)

**What oculus has.** In the X3b worktree: `server/core/git.ts` (792), `git-parse.ts` (315), `server/git/git-write.ts` (712), `git-reads.ts` (154), `git-refs.ts` (136), `git-index.ts` (257) and `git-remote.ts` (96). One `execFile` call site each. The tests pin the exact subcommand lists and the absence of `--force`.

**Candidates.**
- `simple-git` 4.0.2: MIT, released 2026-09-26. It wraps the CLI, parses status, log, branch, tag and stash lists, and has pull, fetch, push and stash methods. A blame parser: not checked.
- `isomorphic-git` 1.42.2: MIT, released 2026-09-11. Pure JavaScript, no CLI. Worktree, stash and blame support: not checked.
- `nodegit` 0.27.0: last release 2020-07-28, native. Stale.

**What simple-git would remove.** The argument building and part of git-parse. Estimate: 250 to 400 lines.

**What it breaks.**
- DESIGN.md's safety design (`DESIGN.md:128`, `:247`): every command runs from one call site with an exact list of forms, tests assert the list, and nothing forced can be run.
- `simple-git` exposes any command (`raw()`) and force options through its API, so the pinned-list tests would pin wrapper method names instead of git's own arguments.

**Options.**
- (a) `simple-git`.
- (b) Keep the CLI calls.

**Recommendation: (b), keep.** The candidates lack a way to hold the read and write command set to an exact list at one site, and that list is the design's guarantee. The parsing oculus keeps is small next to that guarantee.

### 2.7 The commit graph (X3b)

**What oculus has.** `state/sources/repositories/graph-lanes.ts` (75), `graph/Lanes.svelte` (71) and `graph/Graph.svelte` (318).

**Candidates.** `@gitgraph/js` 1.4.0 and `@gitgraph/core` 1.5.0: MIT, last release 2021-03-06. They draw a graph from an API of calls, not from `git log` rows, and not in VS Code's graph style.

**Recommendation: keep.** The only candidate is unmaintained since 2021 and does not draw VS Code's row graph.

### 2.8 The Explorer tree (X3a)

**What X3a would build.** From P1's Explorer table: new file and new folder, rename, delete to trash, drag to move, drop from outside to copy, copy, cut, paste and duplicate, multi-select, compare selected, compact folders, a fuzzy filter toggle, git and problem decorations, file nesting, the Open Editors, Outline and Timeline sections, and Seti icons.

**What oculus has.** `ui/tree/` is 808 lines (TreeItem.svelte 455, roving.ts 50, tree-keys.ts 72 and others). The Files view is 1,940 lines (`views/sources/files/`, Files.svelte 538, tree/Tree.svelte 278).

**Candidates.**
- `@headless-tree/core` 1.7.0: MIT, one maintainer (lukasbach), released 2026-05-17, no dependencies and no peers. Its site (read this run) lists:
  - drag and drop, including external drags
  - multi-select, rename and typeahead search
  - virtualization and async data sources
  - customizable hotkeys
  It covers multi-select, drag within the tree and from outside, rename, typeahead, and keyboard handling. It is React-first: `@headless-tree/react` 1.7.0 is the only binding, and a Svelte 5 binding would be oculus's own (size not checked). Compact folders and nesting: not checked.
- `svelte-tree-view` 1.4.2 (2023-07-24): a JSON-object viewer, not a file tree.
- `@codingame/monaco-vscode-explorer-service-override` 37.1.0: VS Code's own Explorer. It needs the `views` override, which takes over the layout (section 2.3), so it breaks the shell rule.

**What headless-tree would remove.** The roving focus, key handling and the selection and drag logic X3a would add. Estimate: 300 to 500 lines, counting what X3a would otherwise write.

**What stays.** The row drawing, the theme tokens, and the file operations on the server.

**Options.**
- (a) `@headless-tree/core` with a Svelte binding in `ui/tree/`.
- (b) Extend the hand tree.

**Recommendation: (a).** Multi-select, drag in and out, rename and typeahead are the bulk of X3a's new tree behaviour, and the library holds all of them in a framework-free core. The con to weigh is the single maintainer.

### 2.9 Explorer extras (X3a)

**Delete to trash.** `trash` 10.1.1: MIT, sindresorhus, released 2026-02-25. It covers macOS trash with no hand AppleScript. Recommended.

**Fuzzy filter toggle.** Candidates:
- `fuzzysort` 4.0.2: MIT, released 2026-08-13, no dependencies.
- `@nozbe/microfuzz` 1.0.0: 2023.
- `fzf` 0.5.2: 2023.

`grep -rln "fuzzy|fuzz" src/lib` printed nothing, so there is no hand fuzzy matcher to replace. Recommended: `fuzzysort`, the most recently released.

**Nesting patterns.** VS Code's patterns use `${capture}`, which `picomatch` 4.0.7 and `minimatch` 10.2.6 do not implement. Recommendation: keep the matcher by hand; it is small.

**Seti icons.** Ruled (`seti-ui` 1.11.0, MIT, released 2024-10-12). What format the package ships its extension table in: not checked. X3a's spec should read the package before writing any table by hand.

### 2.10 Pane and tab layout (L4 floating panes; X3c editor tabs)

**What oculus has** (`wc -l` on main):

| Part | Lines |
|---|---|
| `shell/panes/` | 1,212 |
| `ui/tabs/` | 1,059 |
| `state/workbench/layout/` | 2,576 |
| `state/workbench/layout.svelte.ts` | 552 |
| `state/workbench/drag.svelte.ts` | 340 |

**What the steps would build.**
- L4: a pane floated with an orange token border, on top across every page, and docked on every page.
- X3c: pinned tabs (ruled `pinned?: true` on `Instance`), a tab context menu, editor actions, breadcrumbs, and wrapped tabs (ruled as a pane-menu toggle).

**Candidates.**
- `dockview-core` 8.3.1: MIT, one maintainer (mathuo), released 2026-09-10, no dependencies.
  - Its `llms.txt` (read this run) lists floating groups, popout windows, maximize, a tab overflow menu, serialization, and CSS custom-property theming.
  - It lists "multi-row and pinned tabs" as Dockview Enterprise, so they are not in the MIT package.
  - Tab context menus and locked groups: not stated.
- `dockview-svelte` 1.0.2: peer `svelte ^5.0.0`, one maintainer (eddow), released 2026-09-11.
- `golden-layout` 2.6.0: last release 2022-09-26.
- `flexlayout-react` 0.11.0: React only.

**What dockview covers.** L4's floating group almost whole, and X3c's overflow. It does not cover two of X3c's ruled rows, pinned tabs and wrapped tabs.

**What it would mean for oculus.** oculus's page model (pages on the rail, a page nested in a pane, folding panes, `layout.yml` arrangements, per-instance state, the saved-layout migration) differs from dockview's groups and panels. Adopting it replaces about 5,700 lines of shell and state and re-proves L1 to L3 and L5: a rewrite far outside L4 and X3c. Whether a floating group can stay on top across oculus's page switches (separate trees): not checked.

**Options.**
- (a) Move to dockview. The two ruled X3c rows would then need the paid edition or hand code on top.
- (b) Keep the layout and build L4's float on it.

**Recommendation: (b).** dockview lacks pinned and wrapped tabs in its MIT edition, and it lacks oculus's page model.

### 2.11 Moving and resizing a floating pane (L4)

**Candidates.**
- `interactjs` 1.10.28: MIT, released 2026-08-01. Drag, resize on every edge, and restriction to the viewport.
- `@neodrag/svelte` 2.3.3: peer `svelte ^3 || ^4 || ^5`, released 2025-06-18. Drag only, no resize.

**What oculus has.** `drag.svelte.ts` (340) for tab drops and sashes. Neither candidate covers it.

**Options.**
- (a) `interactjs` for the float's move and resize.
- (b) Pointer handlers by hand beside drag.svelte.ts.

**Recommendation: (a).** Resize on eight edges, with bounds, is what it covers and what L4 needs. Estimated at 150 to 250 lines not written.

### 2.12 Scheduled runs (A3)

**Ruled shape.** `schedule:` per task: hourly, daily at a time, or weekly on a day at a time. A missed run runs once at the next start, and the tray shows the next run.

**Candidates.**
- `croner` 10.0.1: MIT, released 2026-02-01, no dependencies. Its README (read this run) gives `nextRun()`, `nextRuns()`, `previousRun()`, `timezone`, `pause`, `resume` and `protect` (overrun protection). Catch-up is not documented; it is detected by comparing the stored last run with `nextRun(lastRun)`.
- `cron-parser` 5.10.1: MIT, released 2026-09-12, depends on luxon.
- `node-cron` 4.6.0: ISC.
- `node-schedule` 2.1.1: released 2023.
- `toad-scheduler` 4.2.0: built on croner.

**Options.**
- (a) `croner`, with the three shapes mapped to patterns.
- (b) By hand. Small, but the daylight-saving arithmetic is oculus's to get right.

**Recommendation: (a).** It removes the time arithmetic, has no dependencies, and gives the next run the tray shows.

### 2.13 The Processes view (D18)

**Ruled columns.** PID, parent PID, user, start time, CPU, memory, command and folder. Rows are oculus's tmux starts plus processes matching `behavior.yml` patterns, stopping only oculus's own.

**Candidates.**
- `systeminformation` 5.33.13: MIT, released 2026-09-20, no dependencies. `processes()` gives pid, parentPid, user, started, cpu, mem, command, params and path (systeminformation.io, read this run). It has no working directory.
- `ps-list` 9.0.0: MIT, released 2025-09-26. Fields on macOS: not checked.
- `pidusage` 4.0.1 (2025-04-26): CPU and memory per pid only.
- `tree-kill` 1.2.2: released 2019.

**What stays in every option.** The folder column: `lsof -a -d cwd -p <pid>` by hand. The patterns, the tmux join and the stop rule are domain logic.

**Options.**
- (a) `systeminformation` plus `lsof`.
- (b) One `ps -axo pid,ppid,user,lstart,%cpu,%mem,command` call parsed by hand, plus `lsof`.

**Recommendation: (a).** It covers every ruled column but the folder, and it is maintained. The con: it is a large general package for one call.

### 2.14 LaTeX everywhere (D14)

**What D14 would build.** The panel on any folder with a `.tex` main, several mains per folder. The parity rows add: build on save, root detection and magic comments, a Problems list, an outline of sections, hover math preview, word count, and ChkTeX.

**What oculus has.** `server/content/latex.ts` (357), with main-file detection and a `-file-line-error` log parser by hand.

**Candidates.**
- `latex-utensils` 7.0.0: MIT, tamuratak, released 2026-04-14. A LaTeX parser and a BibTeX parser (its README, read this run). It covers the outline and the magic comments. A log parser: not checked. Its use by LaTeX Workshop: not stated on the page.
- `@unified-latex/unified-latex-util-parse` 1.8.4: MIT, released 2026-04-03. A parser only.

**Binaries.** `texcount` and `chktex` are on PATH under TeX Live 2025 (`command -v`), so word count and linting are process calls. KaTeX, already a dependency, covers the hover preview.

**Options.**
- (a) `latex-utensils` for the outline, root and magic-comment reading, with `texcount` and `chktex` as processes.
- (b) Regexes by hand.

**Recommendation: (a).** Hand regexes over LaTeX sectioning miss `\input` chains and comments, which the parser handles.

### 2.15 PDF reading (D15)

**What D15 would build.** The page position kept per file. The parity rows add SyncTeX forward and inverse search and zoom and scroll kept.

**The ruling** says the browser's own viewer keeps pages, zoom, find and the outline.

**A premise for Axel.** Reading the current page back from Chrome's built-in viewer in an iframe: not verified. The `#page=` fragment only sets the page. SyncTeX inverse search needs the click position in PDF coordinates, which the built-in viewer does not report (not verified).

**Candidates.**
- `pdfjs-dist` 6.3.289: Apache-2.0, Mozilla, released 2026-08-29. The page, scroll and zoom are readable, and clicks map to coordinates. Its bundled viewer components (find, outline): not checked for this version.
- `synctex` CLI: on PATH (TeX Live 2025).
- `synctex-js` 1.0.0: released 2019.

**Options.**
- (a) `pdfjs-dist`, with `synctex` as a process.
- (b) The built-in viewer as ruled. The parity rows for SyncTeX and position are then not built.

**Recommendation: (a), put to Axel as a scope change of D15.** Only (a) can meet D15's "position kept" and the SyncTeX rows.

### 2.16 Apps loaded while oculus runs (E1, a design step)

The isolation E1 designs is a sandboxed iframe with a message bridge.

**Candidates.**
- `penpal` 8.0.1: MIT, released 2026-08-14. Promise RPC over postMessage for iframes.
- `comlink` 4.4.2: Apache-2.0, GoogleChromeLabs, released 2024-11-07. Workers first.

**Recommendation.** Name `penpal` in E1's DESIGN section as the bridge through which an app reaches the write endpoint. No code is written until Axel rules the section.

### 2.17 The architecture measures (Q72)

**What Q72 would do.** Re-run Q71's measures (cycles, folder order, sizes, view-to-state imports) and the channels diagram's 178 parallel arrow pairs.

**Candidates.**
- `dependency-cruiser` 18.4.0: MIT, released 2026-09-20. Its FAQ (read this run) states cycles, forbidden-import rules, dot output, and `.svelte` support "uses svelte (version 4.x)". Svelte 5 support: not checked.
- `madge` 8.0.0: peer `typescript ^5.4.4`, while oculus runs `^6.0.3`, a mismatch; last release 2024-08-05.

The in-tree measures (`bin/diagrams/imports.mjs`, `tests/checks/imports/`) belong to the tree auditors' parts. For Q72 itself nothing new is built.

**Recommendation.** Q72's scope follows the tree auditors' finding on `bin/diagrams`. If that finding adopts dependency-cruiser, Q72 becomes running it.

### 2.18 The native window (O30)

The step is a library choice by definition. There is no hand-built option.

**Candidates.**
- `electron` 44.4.5: MIT, released 2026-09-23. It runs the existing Node server (adapter-node, tmux, node-pty) in its own process unchanged.
- `@tauri-apps/cli` 2.11.5 (Apache-2.0 OR MIT, 2026-09-20) with `@tauri-apps/api` 2.12.0 (2026-09-26). Node would run as a sidecar binary.
- `@neutralinojs/neu` 11.7.2: released 2026-06-03.
- `pywebview`: not checked (PyPI).

**Recommendation: Electron,** since it hosts the Node server as it is. The step still chooses after O19, as booked.

### 2.19 Diff-scoped verification (Q77)

**What Q77 would build.** `revert-check.mjs` proving only directives that a diff adds or moves. This needs the changed line ranges from `git diff -U0`.

**Candidates.**
- `parse-diff` 0.12.0: MIT, released 2026-04-17.
- jsdiff `parsePatch` (`diff` 9.0.0).

**Recommendation: keep by hand.** Reading `@@ -a,b +c,d @@` headers is one regex. A dependency for it removes nothing measurable. If jsdiff enters for another reason, use its `parsePatch`. The port variable and the test timeouts are not library matters.

## 3. Domain logic, one line each

- Q35: the session picker, empty states, grouping, and Config and Audit as lists are oculus's own. Durations and sizes use the built-in `Intl.NumberFormat` and `Intl.DurationFormat` with no library. The wrap goes to Monaco (2.1).
- M4: rewriting `PRESENT.md`'s equation images to LaTeX is portfolio data. Drawing uses KaTeX, already a dependency.
- Q78: the table of contents is ruled on `marked-gfm-heading-id` 4.1.4 (peer `marked >=13 <19`, oculus runs 18; `npm view` this run). The `[TOC]` list, per-view unique ids and in-pane scroll are oculus's own.
- Q66: deferring a hidden tab's re-reads and follow is store logic in Svelte runes. No library.
- M3: `registries/resources.yml` and its references are portfolio data read through the existing `yaml`.
- D17: `.oculus/commands.yml`, the approval store and task terminals are domain logic over the existing `yaml` and pty.
- D20: seeding a chat terminal from a task row is domain logic over the existing pty.
- D24: the Personal board over `side-projects/*/project.yml` and `<repo>/.oculus/project.yml` is domain logic over the existing `yaml`.
- A1: routing a line comment into the session's terminal or the clipboard is domain logic. Placing the input on the line is Monaco's (2.4).
- A2: a session in a new worktree uses the existing `createWorktree` write and the terminal start.
- R2: the README, demo hub, first-run check, `tmux_socket` key and MIT licence file are oculus's own.
- O29: retiring the cockpit is hub work.
- X2: an orchestration exercise that writes no oculus code.
- O33: extraction to its own repository uses git's own `subtree split` or the `git-filter-repo` tool. There is no npm library, and Axel pushes.

## 4. Coverage table of steps

| Step | Capabilities it builds | Library outcome |
|---|---|---|
| Q35 | session views, empty state, lists; source wrap | domain; wrap by Monaco option (2.1) |
| M4 | equations as live LaTeX | domain; KaTeX already present |
| L4 | floating pane on top, move and resize, token border | keep layout (2.10); interactjs (2.11) |
| X3a | Explorer tree ops, multi-select, DnD, trash, fuzzy, nesting, icons, Timeline, Outline | headless-tree (2.8); trash, fuzzysort, nesting by hand, seti-ui (2.9) |
| X3b | diff pane, hunk and line staging, merge editor, git forms, graph, blame, gutter | Monaco diff (2.4); node-diff3 (2.5); keep git CLI (2.6); keep graph (2.7) |
| X3c | pinned, context menu, wrapped tabs, breadcrumbs, editor actions | keep layout; dockview lacks pinned and wrapped in MIT (2.10) |
| Q78 | `[TOC]` table of contents | ruled marked-gfm-heading-id; rest domain |
| Q77 | diff-scoped revert check, per-worktree port, test timeouts | keep by hand (2.19) |
| Q72 | architecture re-read, import measures, channels diagram | follows the tree auditors on dependency-cruiser (2.17) |
| O33 | repository extraction | domain; git tooling |
| Q66 | hidden tab defers work | domain |
| M3 | resources registry | domain |
| D11 | DAP client, breakpoints, Debug view | @vscode/debugprotocol types, Monaco glyph margin, hand view (2.3) |
| D13 | editor features and language modes | superseded by the Monaco ruling; Monaco package choice (2.1) |
| D14 | LaTeX panel on any folder, outline, magic comments, word count, lint | latex-utensils, texcount, chktex (2.14) |
| D15 | PDF position, SyncTeX | pdfjs-dist, a scope change for Axel (2.15) |
| D17 | project commands | domain |
| D18 | Processes view | systeminformation plus lsof (2.13) |
| D20 | agent started on a task | domain |
| D23 | LSP client for pyright and clangd | monaco-languageclient plus vscode-ws-jsonrpc (2.2) |
| D24 | Personal board | domain |
| E1 | runtime apps design | penpal named in the design (2.16) |
| A1 | review comments on diff lines | Monaco view zones (2.4); routing is domain |
| A2 | session in a new worktree | domain |
| A3 | scheduled runs | croner (2.12) |
| R2 | release readiness | domain |
| O29 | retire the cockpit | domain |
| X2 | orchestration exercise | domain, no oculus code |
| O30 | native window | Electron recommended (2.18) |

## 5. Steps whose scope a library changes

- **D13** is superseded by the Monaco step. Rewrite or merge the line. If D23 uses `monaco-languageclient`, the Monaco step should bring in `@codingame/monaco-vscode-editor-api` rather than `monaco-editor`.
- **X3b**: diff-rows, the word marks of diff-words, DiffFile, most of Diff.svelte and Gutter become the Monaco step's removal list. merge-regions shrinks with `node-diff3`.
- **Q35**: its wrap item becomes a Monaco option.
- **D15**: as ruled, it cannot keep the PDF position or do SyncTeX without `pdfjs-dist`. This is a premise for Axel.
- **D23**: becomes glue around `monaco-languageclient`.
- **L4**: smaller with `interactjs`.
- **X3a**: smaller with `@headless-tree/core`, `trash` and `fuzzysort`.
- **A3**: its time arithmetic goes to `croner`.
- **Q72**: becomes running dependency-cruiser only if the tree auditors adopt it.
- **Ledger defects:** plan.md line 193 points at a missing `agents/briefs/Q66.md`, and D13's line still says CodeMirror 6.
