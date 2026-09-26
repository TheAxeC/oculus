Library audit, auditor B: `src/lib/views/sources/`, `src/lib/views/shared/`, `src/lib/views/sessions/`

## Enumeration

- On main, `find src/lib/views/sources src/lib/views/shared src/lib/views/sessions -type f | sort` returns 96 files.
- The same command in `.agents/worktrees/X3b/tools/oculus` also returns 96 files. Of those, 15 exist only in X3b; `comm` of the two lists shows them.
- In the other direction, 13 files exist on main but are not in the X3b worktree. They are not in the X3b list, so I read them from main.
- `sources/repositories/Diff.svelte` is on the X3b list, but X3b deletes it (160 lines on main) and replaces it with `diff/Diff.svelte`.
- Main's 96 files plus the 15 X3b files give 111 paths. 110 exist; the 111th is the deleted one. Every path is in the coverage table at the end.
- Line counts come from `wc -l`, run on the X3b copy for X3b files and on the main copy for the rest.

Versions installed, read from `node_modules/*/package.json`: marked 18.0.12, katex 0.18.7, highlight.js 11.12.0, @xterm/xterm 6.0.0, @xterm/addon-fit 0.11.0, svelte 5.57.0, @sveltejs/kit 2.70.3, dompurify 3.4.15.

Library facts come from `npm view <pkg> --json`. The release date is `time[<latest version>]`. I checked some contents by unpacking the package with `npm pack` in my scratchpad.

## C1. Code editor and code window (views/sources/source/)

**What oculus has.** Five files, 1258 lines: `Editor.svelte` 431, `Code.svelte` 149, `Gutter.svelte` 184, `Source.svelte` 421, `Preview.svelte` 73. They rely on state files owned by another auditor: `state/shared/words/languages.ts` (89 lines, registers 19 highlight.js grammars) and `state/workbench/navigation/editor-text.ts` (113 lines).

- **Editor.svelte** is a transparent `<textarea>` laid over a `<pre>` "mirror". The mirror holds `codeHtml(...)`, highlight.js output, repainted in full on every keystroke. The rest of the file:
  - keeps the scroll of the two layers in step (`sync`);
  - listens for the caret on 5 events plus `selectionchange`;
  - handles go-to-line (`place`, `rowHeight`, `rowOf`);
  - inserts an indent on Tab, with Escape then Tab moving focus on (`keys`, which uses `setRangeText`);
  - draws a Markdown split with a Sash and a Preview whose scroll follows the editor by fraction.
- **Paint cap.** Colouring stops above `editor.paint_limit_kb: 64` (`config/behavior.yml:117`) because every keystroke repaints the whole file.
- **Code.svelte** is the read-only window: highlight.js HTML beside line numbers.
- **Gutter.svelte** draws line numbers, quick-diff marks and blame as a column moved by `translateY`.
- **Duplicated CSS.** `Code.svelte:96-146` and `Editor.svelte:378-428` are two identical copies of the highlight.js token CSS, each mapped to the `--c-code-*-txt` tokens.
- **Missing next to VS Code.** `grep -i "undo|find|replace|fold|wrap|bracket"` over the folder finds none of these in the code:
  - find and replace;
  - folding;
  - multi-cursor;
  - bracket matching;
  - word wrap;
  - auto-indent on Enter;
  - minimap;
  - colouring above 64 KB.

  Whether the Tab insertion done with `setRangeText` breaks Ctrl+Z is not verified in a browser.

**Candidates**

1. **monaco-editor 0.57.0.** MIT, Microsoft (7 maintainers), released 2026-09-24, no peer dependencies (it depends on marked and dompurify).
   - It is VS Code's own editor core. It covers find and replace, multi-cursor, folding, minimap, the undo stack, go to line, `detectIndentation`, `setEOL`, bracket matching and virtualised rendering, so the paint cap goes. Checked in `esm/vs/editor/editor.api.d.ts`: `detectIndentation`, `setEOL`, `createDecorationsCollection`, `glyphMargin`.
   - The quick-diff marks and blame become decorations.
   - Languages: its Monarch grammars cover 13 of oculus's 19 (bash as shell, css, ini, javascript, json, julia, markdown, python, r, typescript, xml, yaml, plus plaintext). It has none for latex, lisp, matlab, ocaml, makefile or diff (checked by listing the `id:` values under `esm/vs/basic-languages`).
   - The language gap is closed by `@shikijs/monaco` 4.4.3: MIT, the shiki org (antfu, orta, octref), released 2026-08-10, no peer. It feeds VS Code's TextMate grammars into Monaco. `@shikijs/langs` 4.4.3 has all 18 of oculus's non-plain grammars (latex, make, ocaml, matlab and common-lisp checked by file). Its compatibility with monaco 0.57 is not checked.
   - Theme tokens: `defineTheme` takes colour strings, not `var(--x)`. The tokens have to be read with getComputedStyle and the theme defined again on every theme change, as `Terminal.svelte:157-169` already does. DESIGN calls that "the one file in the application that reads a computed token", so the DESIGN text would change. Whether every `--c-code-*-txt` token resolves to a hex string there is not checked.
   - Svelte 5 / SvelteKit: there is no Svelte wrapper. It is mounted from an `$effect` with a dynamic import (the xterm pattern already in Terminal.svelte) and Vite `?worker` imports. A node-adapter build is not checked.
   - Estimated code removed: about 260 of Editor's 431 lines, about 120 of Code's 149, about 70 of Gutter's 184, and about 60 of editor-text.ts's 113.
   - Code that stays: the draft, save and git reads in Source.svelte, the Markdown split and Preview, the blame and mark data, and a ui/ wrapper of about 100 lines (estimate).
   - Layer fit: it belongs in a `ui/editor/` primitive, which imports no state. Code, Editor, Merge, Diff and CustomizationView can then share it without one view importing another.
   - VS Code closeness: identical.
2. **CodeMirror 6.**
   - Packages: `@codemirror/view` 6.43.13 (released 2026-09-22), `@codemirror/state` 6.7.6, `codemirror` 6.0.2 (2025-06-19), `@codemirror/language` 6.12.4, `@codemirror/search` 6.7.2, `@codemirror/legacy-modes` 6.5.4. All MIT; the maintainer is marijn, the only maintainer on most of them. None has peer dependencies.
   - `svelte-codemirror-editor` 2.1.0: MIT, touchifyapp, 2025-10-10, peer `svelte ^5.0.0` and `codemirror ^6.0.0`, which match the versions oculus runs.
   - Theming is CSS: `EditorView.theme` and `HighlightStyle` take `var(--c-code-keyword-txt)` directly, so every theme applies with no token reading. That is the best fit to tokens.css.
   - Languages: legacy-modes has stex, commonlisp, octave, mllike, julia, r, shell, properties, diff, yaml and more (checked in `mode/*.js`). With the official lang packages that is 18 of 19; there is no makefile mode.
   - Behaviour is not VS Code's: keymap, search panel, no minimap. `@replit/codemirror-vscode-keymap` 6.0.2 was last released 2023-01-09.
   - Estimated code removed: about the same as Monaco.
3. **Keep the code.**
   - Pros: no dependency, and it works today.
   - Cons: every missing capability in the list above, the 64 KB colouring cap, and the two copies of the token CSS.

**Recommendation: Monaco plus @shikijs/monaco, as one `ui/editor/` primitive.** The source tab, the diff and the merge editor are VS Code surfaces, and Axel requires exhaustive VS Code parity. Monaco is the only candidate that behaves as VS Code does. Shiki closes its language gap with VS Code's own grammars. What it costs is reading tokens at runtime, which Terminal.svelte already does. CodeMirror 6 is the better fit if token-native theming is weighed above VS Code identity.

## C2. Diff view (repositories/diff/, X3b)

**What oculus has.**
- `diff/Diff.svelte` 402 and `diff/DiffFile.svelte` 380, over state files owned by another auditor: `diff-rows.ts` 295 (`parseDiff` of git's unified diff, hunks, folds, side rows), `diff-words.ts` 132 (a hand-written Myers `common()` with `MAX_EDITS` = 2000, plus the word diff) and `diff-patch.ts` 76 (builds the patch that stages a hunk or the chosen lines).
- Features: side by side and inline; line numbers on both sides; word-level marks; unchanged runs longer than six lines folded with three kept each side; stage, unstage and revert per hunk and per chosen lines; previous and next change on Shift+Alt+F5 and Alt+F5; multi-file diffs (stash, commit, worktree).
- `grep codeHtml|hljs` finds no syntax colouring in the diff. VS Code's diff editor colours syntax.

**Candidates**

1. **Monaco `createDiffEditor`.** `renderSideBySide`, `hideUnchangedRegions`, `renderMarginRevertIcon`, `goToDiff` and `getLineChanges` are all present in `editor.api.d.ts`. It adds word diff and syntax colouring.
   - It compares two whole texts, not a unified diff. The server would have to answer both versions of each file, which changes the `api/git` answer shape. That is a wire change and Axel's call.
   - It shows one file pair per editor. VS Code's multi-diff editor is part of the workbench, not Monaco, so a multi-file diff needs one diff editor per file.
   - Estimated removal: about 300 of DiffFile's 380 lines, about 80 of Diff's 402, about 130 of diff-rows (folds, pieces, partners, side rows), and wordDiff/pairedWords in diff-words.
   - What stays: the hunk and chosen-line staging as glue, including diff-patch.ts.
2. **@codemirror/merge 6.12.2.** MIT, marijn, released 2026-06-09. `MergeView` (side by side) and `unifiedMergeView`, plus `highlightChanges`, `collapseUnchanged`, `revertControls`, `goToNextChunk` and `getChunks` (grepped in `dist/index.d.ts`). It is two-way only, and has the same two-texts wire change. Removal is similar to Monaco; the look is not VS Code's.
3. **diff2html 3.4.56.** MIT, rtfpessoa, released 2026-01-31, depends on `diff`.
   - Covers: it parses the unified diff oculus already receives and renders side by side or line by line, with word matching.
   - Lacks: it outputs HTML strings for `{@html}`, has no hunk staging or line choosing, and does not fold whole-file context. It looks like GitHub, not VS Code.
4. **diff (jsdiff) 9.0.0.** BSD-3-Clause, kpdecker and explodingcabbage, released 2026-04-13, types bundled.
   - `diffArrays` and `diffWordsWithSpace` with `maxEditLength`, and `parsePatch`.
   - It replaces the hand-written Myers in `diff-words.ts` (estimate about 90 of 132 lines) and could replace `parseDiff` (54 lines). It is an algorithm library only and draws nothing.
5. **Keep the code.**

**Recommendation.** Follow the C1 choice and use the Monaco diff editor for the single-file diff, with diff-patch.ts kept as the staging glue. The two-texts `api/git` answer needs Axel's ruling. If the editor stays hand-built, adopt jsdiff for `common()`/`wordDiff` either way, because that code duplicates an established library. diff2html is rejected: no staging, no folding, not VS Code.

## C3. Three-way merge editor (repositories/merge/, X3b)

**What oculus has.** `merge/Merge.svelte` 290 and `merge/MergeSide.svelte` 177, over `merge-regions.ts` 232 (state, another part). `regionsOf` and `matchOf` (about 85 lines) use `common()`; the result is kept as one piece per region so that typing and accepting can mix. Incoming and Current sit side by side above the Result, which is a plain `TextArea`: no line numbers, no colouring. Accept Incoming, Accept Current, Accept Both in either order, Ignore, Accept Deletion, Complete Merge.

**Candidates**
- No library provides VS Code's merge editor. It lives in the VS Code workbench, and Monaco does not export it (no merge editor in `editor.api.d.ts`). `@codemirror/merge` is two-way only.
- **node-diff3 3.2.1.** MIT, bhousel, released 2026-06-03. `diff3MergeRegions` and `diff3Merge` (checked in `src/diff3.d.ts`). It replaces the region computation (about 85 lines, estimate) and, together with C2's jsdiff or Monaco, retires `common()`.
- The Result and the two sides can be editor instances from C1, which adds colouring, line numbers and undo.

**Recommendation.** Keep the piece tracking and the conflict actions (no library has them). Replace `regionsOf` with node-diff3, and draw the three panes with the C1 editor.

## C4. Commit graph and lanes (repositories/graph/, X3b)

**What oculus has.** `graph/Graph.svelte` 318, `graph/Lanes.svelte` 71 (an SVG path and a circle per row) and `graph/CommitFiles.svelte` 107, over `graph-lanes.ts` 75 (state).

**Candidates**
- **@gitgraph/js 1.4.0.** MIT, released 2021-03-06, no release since. Its API builds a graph from branch, commit and merge calls, not from a commit list with parents, and it draws a whole canvas rather than one row. Whether the repository is archived is not checked.
- I found no maintained npm library that lays out lanes from `git log --topo-order` rows. VS Code's own graph code is not published on npm (not checked beyond npm search terms).

**Recommendation.** Keep. The 75-line lane layout is smaller than any adapter, and no candidate takes oculus's input.

## C5. Markdown prose and `[TOC]` (shared/prose/, doc/, transcript, source preview)

**What oculus has.**
- `Markdown.svelte` 140 draws server-rendered HTML through `ui/html.ts` `sanitise`.
- There are three render paths:
  - `server/content/docs.ts` `renderMarkdown`: a per-call `new Marked` with an image-rewrite renderer;
  - `ui/html.ts:322` `blockMarkdown`: the global `marked`, used by Preview.svelte on the client;
  - `server/sessions/stores/turns.ts:155`: the global `marked`, for transcript turns.
- Headings get no ids today. `grep slug|headingId` finds nothing, and marked 18 no longer emits ids.
- `ui/html.ts:53-60` already allows `id` in `ALLOWED_ATTR`.

**Candidates for `[TOC]` (Q78)**
1. **marked-gfm-heading-id 4.1.4.**
   - Facts: MIT, repository in the markedjs organisation, published by tonybrix, released 2026-04-07, peer `marked >=13 <19` (covers 18.0.12), depends on github-slugger.
   - What it does (`src/index.js` read): it gives every heading a GitHub-style id with an optional `prefix`, and `getHeadingList()` returns level, text, id and raw text.
   - The list is module-global and reset in its `preprocess` hook. That is safe under synchronous `parse`, but it must be `.use()`d on a per-call `Marked` instance, never on the global `marked`, or it also changes turns.ts and every other caller of the global instance.
   - Glue oculus writes: a `hooks.postprocess` that replaces `<p>[TOC]</p>` with the nested list (estimate about 30 lines), in both docs.ts and blockMarkdown, so the source preview agrees. Plus a click handler that scrolls the view's own box: `querySelector` scoped to the box, so two panes holding the same document never collide.
2. **marked-toc-extension 3.5.2.**
   - Facts: ISC, one maintainer (huaichao.wang), released 2026-06-15, peer `marked ^17.0.1`, which excludes the 18.0.12 oculus runs.
   - Its other version, 100.1.0 (dist-tag `customized/use-forked-marked`), peers on `@huaichao.wang/marked ^1000.1.1`, a fork.
3. **Keep hand-building.** No such code exists yet, so this means writing the slugger and heading collection by hand.

**Recommendation: (1).** It comes from the markedjs organisation, its peer range covers marked 18, and the glue it leaves (list markup, scroll inside the box) is needed under any option. (2) declares a marked version it does not support.

**Partly-used dependencies**
- highlight.js is already a dependency, but fenced code in Markdown documents, in transcript turns and in the source preview is drawn uncoloured. `marked-highlight` 2.2.4 (MIT, markedjs, released 2026-04-07, peer `marked >=4 <19`, which fits) connects the two with a few lines calling `codeHtml`. That makes a third place needing the token CSS, so the two copies in C1 belong in one global stylesheet under `themes/`.
- `CustomizationView.svelte` draws CLAUDE.md, skill and settings files as a plain `<pre>` (read at lines 27-105), while the code window beside it colours the same file types.
- The Markdown `.doc` styles are hand-copied between `shared/prose/Markdown.svelte` and `sessions/transcript/Transcript.svelte:306-318`. This is not a library matter.

**Cross-part note, not audited here.** katex is used only by `views/academic/present/markup.ts`, which marks math by hand (`MARK = '0katexmath0'`). `marked-katex-extension` 5.1.13 (MIT, released 2026-09-16, peer `katex >=0.16 <0.19` and `marked >=4 <19`, both matching) is the candidate for whichever auditor owns that file.

## C6. Terminal (sessions/terminal/Terminal.svelte, reflow.ts)

**What oculus has.** `Terminal.svelte` 411 and `reflow.ts` 22. xterm 6.0.0 is loaded with only `@xterm/addon-fit` (`Terminal.svelte:227-243`). The 16 ANSI colours are read from tokens. `titleStripper` (state) drops screen's `ESC k name ESC \` title sequence; xterm's parser API registers ESC and OSC handlers but cannot take a string sequence introduced by ESC k, so hand code is needed there. `reflow.ts` is two-frame scheduling; no addon covers it.

**Finding: xterm is used only partly.** The addons below are all MIT, published by tyriar, released 2025-12-22 alongside xterm 6.0.0, with no peer dependencies:
- `@xterm/addon-search` 0.16.0: the in-terminal find VS Code offers;
- `@xterm/addon-web-links` 0.12.0: clickable links;
- `@xterm/addon-unicode11` 0.9.0: character widths;
- `@xterm/addon-webgl` 0.19.0: the WebGL renderer;
- `@xterm/addon-clipboard` 0.2.0: OSC 52 clipboard.

None of them duplicates existing code; each adds VS Code terminal behaviour. Which of them VS Code itself loads is not checked.

**Finding: theme tokens.** `grep fontFamily|selectionBackground` in Terminal.svelte returns nothing. The grid therefore uses xterm's default font instead of `--font-mono`, and xterm's default selection colour, which comes from no token.

**Recommendation.** Keep the code, add the search and web-links addons (and unicode11) for VS Code parity, and pass `fontFamily` and `selectionBackground` from tokens.

## C7. File explorer tree and filter (files/Files.svelte, files/tree/*, terminal/AttachPicker.svelte)

**What oculus has.** `Files.svelte` 538, `tree/Tree.svelte` 278, `Controls` 120, `ShowPath` 140, `Follow` 49, `Failed` 36, `refusal.ts` 24, and the composer's `AttachPicker` 152. They draw rows from `ui/tree/*`, which is another auditor's part. The filter is a case-insensitive substring match over the listings already loaded (`state/sources/fs.ts:591`).

**Candidates**
- Headless tree libraries: `@headless-tree/core` 1.7.0 (MIT, lukasbach, released 2026-05-17) and `@zag-js/tree-view` 1.44.0 with `@zag-js/svelte` 1.44.0 (MIT, chakra-ui/zag, released 2026-09-13, peer `svelte >=5`, which matches). They would replace keyboard, expand and select code in `ui/tree`. In my part only a little would go, because Tree.svelte is row markup and domain controls.
- Fuzzy matchers: `fuse.js` 7.5.0 (Apache-2.0, released 2026-07-13), `@leeoniya/ufuzzy` 1.0.19 (MIT, released 2025-08-22), `fzf` 0.5.2 (BSD-3-Clause, released 2023-04-25). They would add fuzzy matching and remove about zero lines. Whether VS Code's explorer filter matches fuzzily by default is not checked.

**Recommendation.** Keep in my part, and leave the tree primitive decision to the `ui/` audit. The substring filter is 25 lines of state and no library shortens it.

## Domain capabilities (no library covers them)

- **D1, the Source Control sections** (Repositories, Repo, RepoList, Changes, Branches, Worktrees, Stashes, Tags, ChangeGroups, CommitBox, the session Changes panel): oculus's own git state over the ui primitives. The git work is server-side, in another part.
- **D1, the confirm before a write** (`ask.ts`, `AskConfirm.svelte`): catalog words over `ui/controls/Confirm`.
- **D2, the sessions views** (list, detail, agents, timeline, customizations, pickers, SteerBox): Axel's sessions model. Relative times use `stamp`/`clock` with catalog words. `Intl.RelativeTimeFormat` would bypass the catalog rule, so keep.
- **D2, the composer**: a prompt TextArea plus pickers and @-mentions from `state/sessions/composer`. It could adopt the C1 editor later, but nothing is removed by doing so.
- **D3, the cards**: portfolio cards. Clamp and the action overflow are ResizeObserver arithmetic.
- **D4, the forms**: `EntryForm` is driven by oculus's own `schema:` vocabulary. `@sjsf/form` 3.8.2 would require JSON Schema, which means changing a config vocabulary, so it is rejected.
- **D5, the links**: file-route addresses and program-open buttons.
- **D6, the accounts**: mail and calendar account rows.
- **D7, the explorer sections**: bookmarks, notes, workspaces, `opening.ts`.
- **D8, search**: ripgrep answers drawn with the server's column and length.
- **D9, datasets and venues**: registry cards and facets. Ribbon is 12 SVG bars, too small for a chart library.
- **D10, the file, document and note tabs**: images and PDFs in the browser's own viewer, HTML in an iframe, and a note with autosave.
- **Sorting.** The only sort in my part is one comparator (`AttachPicker.svelte:40-42`), with no library value.

## Coverage table (111 paths; "src" is the copy read)

| file (under src/lib/views/) | src | lines | capability |
|---|---|---|---|
| sessions/agents/Agents.svelte | main | 232 | D2 sessions views |
| sessions/changes/Changes.svelte | X3b | 267 | D1 Source Control sections |
| sessions/changes/ChangesRepo.svelte | X3b | 181 | D1 Source Control sections |
| sessions/changes/ChangesTouched.svelte | main | 108 | D1 Source Control sections |
| sessions/customization/CustomizationView.svelte | main | 105 | D2 sessions views (C5 finding: plain pre) |
| sessions/session-detail/SessionDetail.svelte | main | 490 | D2 sessions views |
| sessions/session-list/Customizations.svelte | main | 247 | D2 sessions views |
| sessions/session-list/session-list.ts | main | 115 | D2 sessions views |
| sessions/session-list/SessionList.svelte | main | 325 | D2 sessions views |
| sessions/session-list/SessionWorkspace.svelte | main | 304 | D2 sessions views |
| sessions/session-list/TerminalRows.svelte | main | 229 | D2 sessions views |
| sessions/terminal/AttachPicker.svelte | main | 152 | C7 file tree (attach picker) |
| sessions/terminal/Composer.svelte | main | 418 | D2 composer |
| sessions/terminal/reflow.ts | main | 22 | C6 terminal |
| sessions/terminal/Terminal.svelte | main | 411 | C6 terminal |
| sessions/terminal/TerminalPicker.svelte | main | 62 | D2 composer and pickers |
| sessions/timeline/Timeline.svelte | main | 212 | D2 sessions views |
| sessions/transcript/Transcript.svelte | main | 329 | C5 Markdown prose (transcript) |
| shared/accounts/AccountList.svelte | main | 200 | D6 accounts |
| shared/accounts/AddAccount.svelte | main | 99 | D6 accounts |
| shared/accounts/ConnectorHead.svelte | main | 148 | D6 accounts |
| shared/accounts/NoAccounts.svelte | main | 25 | D6 accounts |
| shared/accounts/RemoveAccount.svelte | main | 33 | D6 accounts |
| shared/ask.ts | X3b | 5 | D1 confirm before a write |
| shared/AskConfirm.svelte | X3b | 36 | D1 confirm before a write |
| shared/card/card-layout.ts | main | 108 | D3 cards |
| shared/card/card.ts | main | 100 | D3 cards |
| shared/card/CardActions.svelte | main | 216 | D3 cards |
| shared/card/CardDetails.svelte | main | 163 | D3 cards |
| shared/card/CardDocs.svelte | main | 211 | D3 cards |
| shared/card/CardLinks.svelte | main | 182 | D3 cards |
| shared/card/CardSessions.svelte | main | 133 | D3 cards |
| shared/card/Clamp.svelte | main | 94 | D3 cards |
| shared/card/ProjectCard.svelte | main | 476 | D3 cards |
| shared/card/Reveal.svelte | main | 52 | D3 cards |
| shared/changes/branch-state.ts | main | 20 | D1 Source Control sections |
| shared/changes/ChangeCounts.svelte | main | 43 | D1 Source Control sections |
| shared/changes/ChangeGroups.svelte | X3b | 240 | D1 Source Control sections |
| shared/changes/CommitBox.svelte | X3b | 179 | D1 Source Control sections |
| shared/changes/repo-shape.ts | X3b | 32 | D1 Source Control sections |
| shared/forms/answer-words.ts | main | 16 | D4 forms |
| shared/forms/entry-form.ts | main | 14 | D4 forms |
| shared/forms/EntryForm.svelte | main | 480 | D4 forms |
| shared/forms/NewIdeaForm.svelte | main | 112 | D4 forms |
| shared/forms/posting.ts | main | 17 | D4 forms |
| shared/forms/RegistryHead.svelte | main | 81 | D4 forms |
| shared/forms/Subtasks.svelte | main | 233 | D4 forms |
| shared/links/BookmarkStar.svelte | main | 62 | D5 links |
| shared/links/CrossLinks.svelte | main | 163 | D5 links |
| shared/links/file-url.ts | main | 15 | D5 links |
| shared/links/ProgramButton.svelte | main | 67 | D5 links |
| shared/links/source-file.ts | main | 28 | D5 links |
| shared/links/SourceButton.svelte | main | 24 | D5 links |
| shared/links/SourceToolbar.svelte | main | 18 | D5 links |
| shared/prose/Intro.svelte | main | 95 | C5 prose (sanitised intro) |
| shared/prose/Markdown.svelte | main | 140 | C5 Markdown prose and [TOC] |
| shared/sessions/PickSession.svelte | main | 42 | D2 sessions views |
| shared/sessions/SessionPicker.svelte | main | 90 | D2 sessions views |
| shared/sessions/SteerBox.svelte | main | 171 | D2 sessions views |
| shared/sessions/WorkspacePicker.svelte | main | 51 | D2 sessions views |
| sources/data/Data.svelte | main | 194 | D9 registries |
| sources/data/DatasetCard.svelte | main | 192 | D9 registries |
| sources/data/Facets.svelte | main | 47 | D9 registries |
| sources/doc/Doc.svelte | main | 128 | C5 Markdown prose and [TOC] |
| sources/document/Document.svelte | main | 98 | D10 file, document and note tabs |
| sources/file/File.svelte | main | 242 | D10 file, document and note tabs |
| sources/files/Files.svelte | main | 538 | C7 explorer tree and filter |
| sources/files/opening.ts | main | 62 | D7 explorer sections |
| sources/files/sections/BookmarkForm.svelte | main | 67 | D7 explorer sections |
| sources/files/sections/Bookmarks.svelte | main | 128 | D7 explorer sections |
| sources/files/sections/Notes.svelte | main | 139 | D7 explorer sections |
| sources/files/sections/RootForm.svelte | main | 59 | D7 explorer sections |
| sources/files/sections/Section.svelte | main | 61 | D7 explorer sections |
| sources/files/sections/Sections.svelte | main | 136 | D7 explorer sections |
| sources/files/sections/Workspaces.svelte | main | 103 | D7 explorer sections |
| sources/files/tree/Controls.svelte | main | 120 | C7 explorer tree and filter |
| sources/files/tree/Failed.svelte | main | 36 | C7 explorer tree and filter |
| sources/files/tree/Follow.svelte | main | 49 | C7 explorer tree and filter |
| sources/files/tree/refusal.ts | main | 24 | C7 explorer tree and filter |
| sources/files/tree/ShowPath.svelte | main | 140 | C7 explorer tree and filter |
| sources/files/tree/Tree.svelte | main | 278 | C7 explorer tree and filter |
| sources/note/Note.svelte | main | 289 | D10 file, document and note tabs |
| sources/repositories/Branches.svelte | X3b | 113 | D1 Source Control sections |
| sources/repositories/Changes.svelte | X3b | 280 | D1 Source Control sections |
| sources/repositories/Diff.svelte | main 160 / deleted in X3b | 160 | C2 diff view (replaced by diff/) |
| sources/repositories/diff/Diff.svelte | X3b | 402 | C2 diff view |
| sources/repositories/diff/DiffFile.svelte | X3b | 380 | C2 diff view |
| sources/repositories/graph/CommitFiles.svelte | X3b | 107 | C4 commit graph |
| sources/repositories/graph/Graph.svelte | X3b | 318 | C4 commit graph |
| sources/repositories/graph/Lanes.svelte | X3b | 71 | C4 commit graph |
| sources/repositories/merge/Merge.svelte | X3b | 290 | C3 merge editor |
| sources/repositories/merge/MergeSide.svelte | X3b | 177 | C3 merge editor |
| sources/repositories/refs/section.ts | X3b | 15 | D1 Source Control sections |
| sources/repositories/refs/Stashes.svelte | X3b | 98 | D1 Source Control sections |
| sources/repositories/refs/Tags.svelte | X3b | 83 | D1 Source Control sections |
| sources/repositories/Repo.svelte | X3b | 279 | D1 Source Control sections |
| sources/repositories/RepoList.svelte | X3b | 107 | D1 Source Control sections |
| sources/repositories/Repositories.svelte | X3b | 335 | D1 Source Control sections |
| sources/repositories/Worktrees.svelte | X3b | 176 | D1 Source Control sections |
| sources/search/Query.svelte | main | 91 | D8 search |
| sources/search/Results.svelte | main | 164 | D8 search |
| sources/search/Search.svelte | main | 111 | D8 search |
| sources/source/Code.svelte | X3b | 149 | C1 code editor and window |
| sources/source/Editor.svelte | X3b | 431 | C1 code editor and window |
| sources/source/Gutter.svelte | X3b | 184 | C1 code editor and window |
| sources/source/Preview.svelte | main | 73 | C1 editor (Markdown half, uses C5) |
| sources/source/Source.svelte | X3b | 421 | C1 code editor and window |
| sources/venues/Facets.svelte | main | 54 | D9 registries |
| sources/venues/Ribbon.svelte | main | 236 | D9 registries |
| sources/venues/VenueCard.svelte | main | 264 | D9 registries |
| sources/venues/Venues.svelte | main | 264 | D9 registries |
