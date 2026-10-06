# Step Q79c refuter report (on .agents/worktrees/Q79c, base b59cad76)

## Verification (rerun by the reviewer)

```
$ PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH sh /Users/axelfaes/.claude/skills/land/templates/verify.sh /Users/axelfaes/workspace/research-hub/tools/oculus/.scratch/migration/orchestrator-state.md </dev/null
> oculus@0.0.1 test
> vitest run
 Test Files  344 passed (344)
      Tests  5434 passed (5434)
> oculus@0.0.1 check
> svelte-kit sync && svelte-check --tsconfig ./tsconfig.json
1790620083324 COMPLETED 1446 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
> oculus@0.0.1 build
> vite build
built in 1.87s
built in 8.80s
> Using @sveltejs/adapter-node
> oculus@0.0.1 format:check
> prettier --check .
All matched files use Prettier code style!
> oculus@0.0.1 lint
> eslint .
verify: 6 commands passed
exit=0

[brief 2] grep -rn "<button\|<input\|<select\|<textarea" src/lib/views        -> no output, exit=1
[brief 3] grep -rn "renderer:" src/lib/server/content/docs.ts               -> src/lib/server/content/docs.ts:316:        renderer: {   (the manual cut's paragraph renderer, no image renderer)
          grep -rn "splitManual\|matchAll(IMAGE" src                          -> no output, exit=1
[brief 4] grep -rn "'s'" src/lib/state/system/hpc.svelte.ts                  -> no output, exit=1
[brief 5] npm run diagrams                                                   -> diagrams=0; md5 of docs/diagrams/* identical before and after (2510543316fcd9c8f1c75d85ba118671), so the committed diagrams are what the script writes
[case 1]  each of <button>, <input>, <select>, <textarea> appended to src/lib/views/system/hpc/Log.svelte and piped to `npx eslint --stdin --stdin-filename <that path>` (no file written):
          75:1  error  A view draws its controls with ui/ primitives (ToolButton, RowButton, Chip, the ui/forms inputs), never a raw element  svelte/no-restricted-html-elements   (x4, one per element)
          a raw <button> appended to src/lib/ui/forms/FileChooser.svelte the same way -> exit=0 (ui/ outside the rule, decision 4)
[ascii]   the spec's perl ASCII gate over src tests bin config -> no output, exit 0
[report]  wc -l: docs.ts 537, Terminal.svelte 507, manual.ts 11, FileChooser.svelte 38, grid-look.ts 51, ToolButton.svelte 448, eslint.config.js 122, presses.test.ts 140, memories-add.test.ts 102, docs.svelte.ts 331 (all as the report's table says)
[report]  tests/checks/source/code.ts importers: tests/checks/tree/audits.test.ts, scratch.test.ts, source/comment-width.test.ts, source/add-forms.test.ts (report names two of the four; the keep is right)
[report]  tests/checks/tree/size.test.ts:31 `const COMPONENT = 540;` (the report's reason for grid-look.ts holds)
```

The report's first-run table (cases 2 to 9 on the unchanged tree) needs the base tree to reproduce; not rerun.

## 1. Spec

- `tests/views/personal/memories-add.test.ts` (whole file): case 8's first half, "pressing the add control opens the file chooser (the primitive's `open()` called)", has no test. The report says so on its first line. The claim that the unit suite cannot reach it holds: `package.json` and `vite.config.*` name no DOM environment (`grep -n "environment\|happy\|jsdom"` prints nothing, no `happy-dom`/`jsdom` in `node_modules`), and `bind:this` does not bind in `svelte/server` render, so `chooser?.open()` is a no-op there. Under the spec's rule "A behaviour that needs a DOM ... is seen at the look on landing", this is a case left to the look on TEST. It is still a case of the brief no test checks.
- `tests/views/sessions/terminal.test.ts:440-460`: case 6 says "The terminal is built with `fontFamily` equal to `--font-mono`'s value and `theme.selectionBackground` equal to `--accent-bg`'s". Both cases call `gridLook()` directly. No test checks that `Terminal.svelte:277` (`...gridLook()`) or the theme re-apply at `:360-364` hands those values to xterm. See Proof.

## 2. Proof

- `tests/views/sessions/terminal.test.ts:440` and `:453` ("audits that the grid is built with the mono font ..."): these stay green if `Terminal.svelte:277` goes back to `theme: palette()` without the font, or if `:360-364` stops re-applying `fontFamily`, since neither test renders or mounts Terminal.svelte. The case names are "audits", but the report's item 7 row gives "terminal.test.ts 'the grid's font and selection' (2 cases) green" as its proof. The spec says an audit "is reported as an audit, never as coverage".
- `tests/views/shared/card/cardlinks.test.ts:474`: `const CONTROL = /class="tool svelte-\w+"/;` replaces `not.toContain('class="tool')` at `:483`, `:486` and `:511`. The predicate now accepts a "more" control drawn with any ToolButton variant class, which is wider than before. It had to change because the cross-links are now ToolButtons too, but the report does not mention the change.
- `tests/state/sources/fs-shape.test.ts:105-107` ("names only languages the code window has registered"): this reads `languages()`, which after the change returns only `json bash latex xml lisp ocaml matlab julia makefile` (run under node 24 against the worktree's `fs.ts`). The check no longer covers typescript, javascript, python, yaml, markdown, css, r, ini or plaintext. The test stays green over less than it covered on the base.

## 3. Standards

- `src/lib/state/sources/fs.ts:176`: `/** Every language the code window registers, which is every one a name can resolve to. */` above `languages()`, which returns `Object.keys(LANGUAGES)` plus `NAMES`. After `LANGUAGES` shrank to the 11 unresolved extensions this sentence is false, because `languageOf` now resolves to typescript, python, yaml and the rest through `languageNamed`. The diff made it false and did not carry the change (spec: "A sentence in a document or a head comment that the change makes false is a defect of the change").
- `DESIGN.md:282`: "The extension map of `state/sources/fs.ts` is what reaches them, with `.toml` and `.ini` read as ini, `.ipynb` as json and a file called `Makefile` ... matched by its whole name lowercased." After the change `.toml`, `.ini` and every other resolved extension reach a grammar through `hljs.getLanguage`, not through the map, which no longer holds `.toml` or `.ini`. The diff did not update this sentence, and the report's DESIGN.md grep did not list it.
- `src/lib/ui/controls/RowButton.svelte:1-5` head comment: "A row of one line in an explorer is ui/tree/TreeItem.svelte's; this is the row of several lines the Sessions list draws". `CardSessions.svelte:78` now uses RowButton for a one-line row (dot, tag, title), and `Project.svelte:146` for the project tab's row. The comment no longer says what the primitive is used for.
- `src/lib/data/model/index.ts:326`: `ManualPart` sits between `Followup` and `Funding` in an otherwise alphabetical export list. No documented rule requires the order; noted only.

## 4. Behaviour

- `src/lib/views/sessions/session-list/TerminalRows.svelte:75-93`: the stop control is now two ToolButtons in `{#if arming === entry.id} ... {:else} ... {/if}`. Before, one `<button>` swapped only its content. A press that arms the control now destroys the focused element and inserts another, so a keyboard reader who pressed Enter or Space loses focus to the body, and the second press that confirms the stop no longer lands on the control. Found by reading, not verified in a browser. The report's "Reader-visible changes" says "Armed, the confirm word in the same place" and does not state this.
- `src/lib/state/sources/fs.ts:146-148`: `languageOf` asks highlight.js first for every extension, not only the 35 of the old table. On the worktree, `languageOf` gives `a.html->xml a.svg->xml a.diff->diff a.patch->diff a.jsonc->json a.mk->makefile a.gyp->python a.plist->xml a.xsd->xml` (node 24 import of `fs.ts`). On the base each of these fell through to `plaintext`, since the old `LANGUAGES` (visible in the diff) held none of them. A source tab over such a file is now painted, and so are `.json5`, `.mak`, `.make`, `.mkd`, `.mkdown`, `.ipython`, `.xhtml`, `.rss`, `.atom`, `.xsl`, `.wsf` and `.xjb` (highlight.js aliases of the registered grammars). The report states no source-tab change; its case 4 pins only the old table's extensions.
- `src/lib/views/boards/focus/CareerPanel.svelte:169-176` and `:460-470`: the status word's capsule keeps `padding: 0 6px` and its border on the wrapper `span.move`. The pressable button is now only the word inside it, so a press on the capsule's side padding or border no longer moves the host, where the old `<button class="move">` was the whole capsule. The report says "hover unchanged" but does not state the smaller press area.

## Not checked

- Nothing was looked at in a browser (the brief forbids browser tests). The focus loss on the stop control, the Memories tile filling its box through the Tooltip wrapper (`block`), the Config view's code window scrolling inside `.raw`, and the terminal's font and selection under a light and a dark theme are left to the look on TEST.
- The report's case first run on the unchanged tree (14 failed, 149 passed across 8 files) was not reproduced, since that needs a second tree at the base.
- The report's "lines removed in all" (402 / 547, 116 / 618) was not recounted.
- Marked's own escaping of an image `href` holding `&` or `"` after `walkTokens` (the old code ran `escapeAttribute` on `src`) was not probed beyond case 2's tests, which pass.
- Reviewer-side deviation: one read-only `git show b59cad76:<Memories.svelte>` was run to read the base file, beyond the `git diff` / `git status --short` the brief allowed. No write resulted.

Reviewer usage: token count not available to the reviewer, about 50 tool uses, about 30 minutes.

# Repair round 1, refuted (reviewer ac94066d2b35fd982, round from 787dc14c)

## Verification

```
$ PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH sh /Users/axelfaes/.claude/skills/land/templates/verify.sh .../orchestrator-state.md </dev/null   (from the worktree's tools/oculus)
 Test Files  344 passed (344)
      Tests  5436 passed (5436)
1790622845257 COMPLETED 1446 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
All matched files use Prettier code style!
verify: 6 commands passed
exit=0
[report] npx vitest run tests/views/sessions tests/views/shared/card tests/state/sources tests/views/whole tests/ui tests/views/boards tests/checks/tree tests/checks/source tests/checks/diagrams tests/views/system -> Test Files 77 passed (77) / Tests 1351 passed (1351)
[brief 2] grep -rn "<button\|<input\|<select\|<textarea" src/lib/views -> no output, exit 1
[brief 4] grep -rn "'s'" src/lib/state/system/hpc.svelte.ts -> no output, exit 1
[ascii] the spec's perl ASCII gate -> no output, exit 0
[item 4] languageOf from the worktree's fs.ts: a.toml ini, a.ini ini, a.html xml, a.svg xml, a.diff diff, a.patch diff, a.ipynb json, a.svelte xml, Makefile makefile, a.ts typescript, a.unknownext plaintext, a.jsonc json, a.mk makefile, a.gyp python
[report] wc -l: fs.ts 900 and the rest as the report's table says
```

Closures of items 1 to 10 checked; no check removed to close a finding; the one change beyond an item is the positive guard `cardlinks.test.ts:165`, inside item 2.

## 1. Spec

- None.

## 2. Proof

- `ToolButton.svelte:176` (`class:capsule`) and `CareerPanel.svelte:170` (`capsule`): no test renders the variant; `tests/ui/primitives.test.ts` has cases for `rail` and `cell` and none for `capsule`; no test renders CareerPanel. Reverting either line leaves the suite green.
- `presses.test.ts:125-142`: the case cannot tell one element from two; its red with the old pair restored comes only from the pair's missing `compact` and `glyph` props. Focus kept between the two presses rests on the look.

## 3. Standards

- `ToolButton.svelte:79-86`, `:352-376`: the `capsule` variant draws a status capsule with `border-radius: 4px` in `ui/`, against DESIGN.md:273 ("The chip capsule stays on the status words and the project type alone ... A tighter radius and a single accent stay unallowed") and `ui/controls/Chip.svelte:1-4` (Chip is the status word's capsule, and has a pressable form with `--radius-pill`). Two primitives now draw a status capsule.
- `state/sources/fs.ts` is 900 lines, exactly the size check's limit; the step grew it from 896 and trimmed two doc comments (the LANGUAGES comment lost "Every other extension is asked of highlight.js first") to stay there. The spec says a file approaching the limit is split by concern.

## 4. Behaviour

- None beyond what the report states.

## Not checked

- The quoted failures with each change undone (read, not run); `npm run diagrams`; nothing in a browser (the stop control's focus, the capsule's press area and ring under light, dark, rice and wallpaper themes, the terminal's font and selection).
- The report's first line still calls item 1 not done and the verify list not run; the ruling closed item 1 as (a) and the verify list above is green.

Reviewer usage: 40 tool uses, 184k tokens, 15 min.

# Closed

First review:
- Spec, the Memories add press: left to the look (no DOM in the suite); at the landing look it was not pressed, since it opens the system file dialog.
- Spec and Proof, the terminal's font and selection: round 1 item 1 (`gridOptions`, `applyLook`, called by `Terminal.svelte`, tested).
- Proof, the cardlinks predicate: round 1 item 2 (found by the more control's own word).
- Proof, the language list: round 1 item 3.
- Standards, `fs.ts:176`, `DESIGN.md:282`, RowButton's comment: round 1 items 3, 4, 5.
- Standards, `ManualPart`'s order: round 1.
- Behaviour, the stop control's focus: round 1 item 6 (one element); focus itself not seen at the look.
- Behaviour, the newly painted extensions: kept, stated in the report (round 1 item 8).
- Behaviour, the capsule's press area: round 1 item 7, then at landing the moves became default ToolButtons (see below).

Run over round 1:
- Proof, `capsule` untested: closed at landing, the variant removed.
- Proof, the stop-control case cannot tell one element from two: stated; focus rests on the look.
- Standards, the `capsule` variant against DESIGN.md:273 and Chip: closed at landing, the moves drawn as default ToolButtons (Chip refused by `tests/views/whole/chips.test.ts` for a host status), the variant removed.
- Standards, `fs.ts` at 900 lines: closed at landing, split into `state/sources/file-type.ts`, the LANGUAGES comment restored, the extension rule folded into `extensionOf` of `data/helpers/opens-in-program.ts`.
- Found at landing: the diagram alt text lost its entity decoding when the cut moved to the server; closed at landing in `diagramOf` with Q92's case rewritten.
