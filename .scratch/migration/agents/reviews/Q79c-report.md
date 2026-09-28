Everything in the brief is built and verify ends `verify: 6 commands passed`; one half of case 8 has no test: the press on the Memories add control calling `FileChooser.open()` goes through `bind:this`, which a server render never binds, and the suite has no DOM environment (adding one is a dependency the brief does not name), so that press is left to the look on TEST.

# Q79c report

## Open items (only what Axel must rule on; every report opens with this list verbatim and repeats it until he has ruled)

An entry leaves this list for the closed log the moment Axel rules on it. What a review or a look found and no brief covered is not an open item: it is booked as its own step in `plan.md` and carried in the Booked section below, since it needs no ruling from him.

- Z40, what the Terminal view is (raised 2026-09-28, from Axel's look: "the side panel thingy for terminals are also kind of different panels? Maybe this is just a design mismatch?"). Seen on TEST: every terminal is a tab of its own (`8e90e6-shell`, `6bcd37-shell`), and every Terminal tab also draws a list of all terminals on its right (`views/sessions/terminal/TerminalList.svelte`, from two terminals on, `terminal-list.ts:72`); New terminal in the right pane opened its start form as a new tab in the left pane. So one terminal is both a tab somewhere and a row in each Terminal tab's list: two ways to the same thing, mixing VS Code's terminal panel (one panel, a list of terminals on its right, New terminal adds a row) with VS Code's terminal in the editor area (a tab per terminal, no list). Options:
  - (a) The panel: one Terminal tab holds every terminal; its list switches the terminal the tab shows; New terminal adds a row to this tab and shows it; Split divides this tab's body between two terminals, as VS Code's split does; a terminal is no longer a tab of its own, and the pin goes. Pros: one place for terminals, as Q89 set out to draw VS Code's terminal panel. Cons: two terminals side by side in different panes of a page are no longer possible outside Split.
  - (b) The editor tab: every terminal is a tab of its own, the list goes, New terminal opens a tab in the pane it was pressed in. Pros: panes place terminals freely. Cons: no list of terminals beside them; the Sessions view is the overview.
  - (c) Keep both. This is the lazy option.
  - Recommended (a): it is what Q89 was for, and the tab-per-terminal is the part that doubles it.
- Z41, typed `;` and Return lost or late in a terminal (raised 2026-09-28, from the look of Axel's report). Through the Chrome tool on TEST, `echo x;echo y` arrived as `echo xecho y`, every `;` of a longer line was dropped, and a Return ran its line tens of seconds late. The server keeps one terminal's input in order (`server/machine/pty/channel.ts:370-377`) and a quoted `;` passes a scratch tmux control client whole (`a;b;c;;d` arrived as sent), so no cause is found, and the tool's synthetic key events may be the cause. What would settle it: Axel types `echo a;b` and Return by hand in a shell on the TEST page. If `;` is lost by hand too, the cause is found by reading xterm's key handling for that key and booked into Q99.

- Z42, the Calendar's sticky strips over a wallpaper (raised 2026-09-28, from Q92's landing look). Over a wallpaper theme the week and day views' header row and the list view's date headings stay put while the rows scroll under them, and those rows show through them (seen under tokyo night on TEST: the hour label 06:00 behind the day headings, "Leerlabo violet 10" behind "Tuesday, September 29, 2026"). Two checks decide what may paint there: `tests/ui/colours.test.ts` allows a colour mix only as `background: color-mix(in srgb, var(--panel) var(--wall-panel), transparent)`, and `tests/views/whole/tinted.test.ts` counts that same declaration as a surface of the view's own, which a view that asks the pane for its tint may not have. The Calendar asks for the tint, since its cells paint nothing. So the strips are transparent with the wallpaper blur (2 px), which does not hide text. The library draws the header and the rows in one scrolling grid (`.ec-main`, `overflow: auto`, the header `position: sticky` over subgrid rows), so the rows cannot be moved out from under the header without breaking the columns. Options:
  - (a) `tinted.test.ts` lets a sticky strip carry the pane's wall mix: a rule whose selector names only strips that stay in place over scrolling content is not counted as a surface of the view's own. The strips then cover the rows as they do under a plain theme, one step darker than the pane. Recommended: it is the one option that ends the show-through, and the tint rule's purpose (text never straight on the picture, one translucent layer per surface) still holds.
  - (b) The Calendar stops asking for the tint and paints its own surfaces with the wall mix: the head rows, the grid box and the footer, with the strips over the grid box. More rules, and the strips still double over the grid box as in (a).
  - (c) Keep the strips transparent with the blur, the rows readable under them (the lazy option).


## The cases' first run, on the unchanged tree

Case 1 (no test file, as the brief says). Four scratch views under `src/lib/views/zzscratch/`, each holding one raw `<button>`, `<input>`, `<select>` or `<textarea>`, linted with `npx eslint` before the rule was added: exit 0, no output. The same four after the rule: exit 1,

```
src/lib/views/zzscratch/Rawbutton.svelte
  5:1  error  A view draws its controls with ui/ primitives (ToolButton, RowButton, Chip, the ui/forms inputs), never a raw element  svelte/no-restricted-html-elements
src/lib/views/zzscratch/Rawinput.svelte
  5:1  error  ...  svelte/no-restricted-html-elements
src/lib/views/zzscratch/Rawselect.svelte
  5:1  error  ...  svelte/no-restricted-html-elements
src/lib/views/zzscratch/Rawtextarea.svelte
  5:1  error  ...  svelte/no-restricted-html-elements
4 problems (4 errors, 0 warnings)
```

The scratch folder was removed. Over the 9 unchanged view files, `npx eslint` with the rule absent exited 0; with the rule on it reported the 12 raw controls: CareerPanel.svelte 168:45, LaneCard.svelte 81:13 and 102:9, Project.svelte 145:9, Memories.svelte 196:9, 227:21 and 262:17, TerminalRows.svelte 44:9 and 74:9, CardDetails.svelte 88:21, CardLinks.svelte 117:29, CardSessions.svelte 76:13 ("12 problems (12 errors, 0 warnings)").

Cases 2 to 9, `npx vitest run` over the 8 test files that hold them, on the unchanged tree: exit 1, "Test Files 6 failed | 2 passed (8)", "Tests 14 failed | 149 passed (163)". The failures:

```
FAIL tests/routes/docs/docs.test.ts > the manual's parts > cuts the manual at a paragraph holding one diagram and nothing else
  AssertionError: expected [] to deeply equal [ 'html', 'diagram', 'html' ]
FAIL tests/routes/docs/docs.test.ts > the manual's parts > keeps an image of another address, and a diagram inside a sentence, in the prose
  AssertionError: expected [] to deeply equal [ 'html' ]
FAIL tests/routes/docs/docs.test.ts > the manual's parts > reads an alternative text holding an ampersand and a quote as written
  AssertionError: expected undefined to deeply equal [ { kind: 'diagram', ...(2) } ]
FAIL tests/routes/docs/docs.test.ts > the manual's parts > lists every heading in a table of contents written before a diagram
  AssertionError: expected [] to deeply equal [ 'html', 'diagram', 'html' ]
FAIL tests/views/boards/project.test.ts > a press on a session row > draws the card's session row and the tab's own, in that order
  AssertionError: expected [] to have a length of 2 but got +0
FAIL tests/views/boards/project.test.ts > a press on a session row > selects the session on the tab's own row
FAIL tests/views/boards/project.test.ts > a press on a session row > selects the session on the card's row, and opens its detail beside the board
  AssertionError: expected undefined to be type of 'function'
FAIL tests/views/personal/memories-add.test.ts > adding pictures to the wall > draws one chooser of JPEG and PNG pictures, several at once
  AssertionError: expected [] to have a length of 1 but got +0
FAIL tests/views/personal/memories-add.test.ts > adding pictures to the wall > hands every picture of a choice of two to the upload, then asks the folder again
  AssertionError: expected undefined to be type of 'function'
FAIL tests/views/sessions/presses.test.ts > a terminal row > selects its terminal when it is pressed
  AssertionError: expected [] to have a length of 1 but got +0
FAIL tests/views/sessions/presses.test.ts > a terminal row > names the stop and, once armed, the word that confirms it
  AssertionError: expected undefined to match object { label: 'Stop this terminal' }
FAIL tests/views/sessions/presses.test.ts > the stop control of a terminal row > arms on the first press and stops the terminal on the second
  AssertionError: expected undefined to be type of 'function'
FAIL tests/views/sessions/terminal.test.ts > the grid's font and selection > audits that the grid is built with the mono font and the selected row surface, read off the body
  TypeError: gridLook is not a function
FAIL tests/views/system/config.test.ts > the Config view > paints an opened YAML file through the code window
  AssertionError: expected '<!--[--><section class="pane svelte-b...' to match /data-file="layout\.yml"[^>]*>[\s.../span>
```

The ones that passed, as the brief expects for cases 2, 4 and 7 (they pin behaviour across the change):

```
v docs.test.ts > a figure's address in a project's README > draws a relative source as the file route address, with its alt and its title
v docs.test.ts > a figure's address in a project's README > keeps an address the browser resolves itself
v docs.test.ts > a figure's address in a project's README > keeps a source that climbs out of the root as the author wrote it
v docs.test.ts > a figure's address in a project's README > escapes a quote and an ampersand in the alternative text
v docs.test.ts > the manual's parts > carries no parts on the answer of any other document
v fs.test.ts > the language a file is painted in > gives every extension and name the language it has always been painted in
v fs.test.ts > the language a file is painted in > paints a name nothing claims as plain text
v hpc.test.ts > the HPC pill > says one running job in the singular
v hpc.test.ts > the HPC pill > says two running jobs in the plural
v hpc.test.ts > the HPC pill > adds the pending count after the running one
```

Where the first run differs from the brief: case 8 says "write it against the view as it is, then keep it green across the change", and case 9 does not say. Both are red on the unchanged tree because they record the props the view hands a primitive (`FileChooser`, `RowButton`, `ToolButton`), and the unchanged views draw raw elements, so no primitive is called. The behaviour they test (a choice reaches the upload; a row selects; the stop arms then stops) is the same before and after; only the place it is observed moved. No case was judged wrong in its rules, so none was handed back. Case 7's first two assertions passed through the old hand suffix (`'{0} HPC job{1} running'` with `''` or `'s'`) and are kept to pin the words across the change to two catalog keys.

## What to build

| # | Item | State | Where | Proved by |
|---|------|-------|-------|-----------|
| 1 | eslint rule for views; controls.test.ts deleted | DONE | `eslint.config.js:105-121`; `tests/checks/source/controls.test.ts` gone; `tests/checks/source/code.ts` kept (imported by `tests/checks/tree/audits.test.ts` and `tests/checks/tree/scratch.test.ts`) | `grep -rn "<button\|<input\|<select\|<textarea" src/lib/views` prints nothing (exit 1); `npm run lint` exit 0; case 1 runs above |
| 2 | the 12 raw controls made primitives | DONE | see "Judgment calls" for each; `ToolButton.svelte:78` (`plain`), `ui/forms/FileChooser.svelte` (new, 38 lines) | the grep above; `tests/views/sessions/presses.test.ts`, `tests/views/boards/project.test.ts`, `tests/views/personal/memories-add.test.ts` green |
| 3 | `figures()` a walkTokens extension | DONE | `server/content/docs.ts:261` `figures()`, `walkTokens` at `:263`; no image renderer, no hand `<img>` string, `escapeAttribute` no longer imported | `grep -rn "renderer:" src/lib/server/content/docs.ts` prints only `316: renderer: {`, which is the manual cut's paragraph renderer (item 4), not an image renderer; docs.test.ts "a figure's address in a project's README" green |
| 4 | the manual's cut on the server | DONE | `ManualPart` at `data/model/model-entities.ts:208`; `renderManualParts` at `server/content/docs.ts:305`; `answer()` gains `draw` and `...draw(read.text)` at `:362`; `DocState.parts` at `state/system/docs.svelte.ts:44`, `readParts` at `:315`; `Help.svelte` draws `shown.parts`; `views/system/help/manual.ts` holds only `diagramUrl` (11 lines) | `grep -rn "splitManual\|matchAll(IMAGE" src` prints nothing; docs.test.ts "the manual's parts" and help.test.ts "the diagrams in the manual" green |
| 5 | highlight.js asked first | DONE | `languageNamed` at `state/shared/words/languages.ts:84`; `languageOf` asks it at `state/sources/fs.ts:148`; `LANGUAGES` at `:91` holds the 11 unresolved extensions | fs.test.ts "the language a file is painted in" (38 names, each the language of the unchanged tree) green |
| 6 | the Config view's YAML through the code window | DONE | `views/shared/code/Code.svelte` (moved from `views/sources/source/Code.svelte`, token CSS moved with it); `Config.svelte:142` `<Code text={held.text} language="yaml" path={name} />` inside `data-file`; `Source.svelte` imports the new path | config.test.ts "paints an opened YAML file through the code window" green |
| 7 | terminal font and selection from tokens | DONE | `views/sessions/terminal/grid-look.ts` `gridLook()`; `Terminal.svelte:277` `...gridLook()` at construction, `:360-364` theme and font again on a theme change | terminal.test.ts "the grid's font and selection" (2 cases) green |
| 8 | HPC markup one element per line | DONE | `Capacity.svelte`, `Jobs.svelte`, `Log.svelte` | `npm run format:check` and the hpc view tests green (the text of each cell is unchanged; see "Reader-visible changes") |
| 9 | HPC plural from the catalog | DONE | `state/system/hpc.svelte.ts:33-35`; `config/text/views/system/hpc.yml:54-55` | `grep -rn "'s'" src/lib/state/system/hpc.svelte.ts` prints nothing (exit 1); hpc.test.ts "the HPC pill" green |

The brief's other checks:

- `npm run diagrams` exit 0 (`echo diagrams=$?` printed `diagrams=0`). It rewrote `docs/diagrams/layer-state`, `layer-views` and `layers` (`.dot` and `.svg`); the change is edge-count labels only (for example `"views to ui"` 533 to 540, `"folder views/personal to layer ui"` 16 to 17), from the new imports of `ToolButton`, `RowButton`, `FileChooser`, `ManualPart` and the moved `Code.svelte`. Compared with `diff` against the main checkout, whose own working tree also carries another package's uncommitted changes, so some label differences there (for example `state/life to layer data` 10 to 7) are that package's, not this step's.
- The spec's ASCII gate (`LC_ALL=C perl -ne ... $(find src tests bin config -type f ! -name local.yml)`) printed nothing, exit 0.
- The changed names across src, tests, config, HELP.md, DESIGN.md and README.md: `grep -rn "splitManual\|controls\.test\|sources/source/Code\|palette()\|matchAll(IMAGE\|escapeAttribute" src tests config HELP.md DESIGN.md README.md` printed only

```
src/lib/data/prose/markdown.ts:33:export function escapeAttribute(value: string): string {
src/lib/data/prose/markdown.ts:86:        html += `<li><a href="#${escapeAttribute(entry.id)}">${entry.words}</a>`;
```

  which is `escapeAttribute`'s own definition and its other caller, still in use. `grep -rn "pill_running\|Code\.svelte\|manual\.ts\|FileChooser\|grid-look" ...` names only the new paths (the source tab, the Config view, `Gutter.svelte`'s head comment, the four test files that name the code window, `DESIGN.md:276`).

Verify, from the worktree's oculus folder with node v24.21.0 on PATH, `sh /Users/axelfaes/.claude/skills/land/templates/verify.sh /Users/axelfaes/workspace/research-hub/tools/oculus/.scratch/migration/orchestrator-state.md`: exit 0. Its lines:

```
> oculus@0.0.1 test
> vitest run
 Test Files  344 passed (344)
      Tests  5434 passed (5434)
> oculus@0.0.1 check
> svelte-kit sync && svelte-check --tsconfig ./tsconfig.json
COMPLETED 1446 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
> oculus@0.0.1 build
> vite build
> Using @sveltejs/adapter-node
> oculus@0.0.1 format:check
> prettier --check .
All matched files use Prettier code style!
> oculus@0.0.1 lint
> eslint .
verify: 6 commands passed
```

Untouched test files that timed out in earlier full runs under a load average of 12 to 19 on this machine (another builder and Microsoft Defender running): `tests/server/core/git.test.ts`, `tests/server/git/git-ops.test.ts`, `tests/server/core/git-reads.test.ts`, `tests/routes/git/changes.test.ts`, `tests/checks/bin/claude-usage.test.ts`, `tests/checks/source/keys.test.ts`, each a 5000 ms timeout, each file byte-identical to the main checkout's (`cmp -s`); nothing was done about them, and the verify run above passed them.

## Files, line counts before and after

Before is the main checkout's file (`wc -l`), which matches this step's base for every file below except `src/lib/data/model/index.ts` and `DESIGN.md`, where the main checkout carries another package's uncommitted lines; for those two the count below is corrected to this step's own lines (index.ts +1; DESIGN.md one line replaced at :276).

| File | Before | After |
|------|-------:|------:|
| eslint.config.js | 106 | 122 |
| DESIGN.md | 320 | 320 |
| config/text/views/system/hpc.yml | 68 | 69 |
| src/lib/data/model/model-entities.ts | 671 | 678 |
| src/lib/data/model/index.ts | 473 | 474 |
| src/lib/server/content/docs.ts | 466 | 537 |
| src/lib/state/shared/words/languages.ts | 89 | 104 |
| src/lib/state/sources/fs.ts | 896 | 898 |
| src/lib/state/system/docs.svelte.ts | 292 | 331 |
| src/lib/state/system/hpc.svelte.ts | 62 | 64 |
| src/lib/ui/controls/ToolButton.svelte | 409 | 448 |
| src/lib/ui/forms/FileChooser.svelte | 0 | 38 |
| src/lib/views/boards/focus/CareerPanel.svelte | 497 | 497 |
| src/lib/views/boards/focus/lanes/LaneCard.svelte | 205 | 199 |
| src/lib/views/boards/project/Project.svelte | 323 | 303 |
| src/lib/views/personal/memories/Memories.svelte | 426 | 419 |
| src/lib/views/sessions/session-list/TerminalRows.svelte | 229 | 201 |
| src/lib/views/sessions/terminal/Terminal.svelte | 540 | 507 |
| src/lib/views/sessions/terminal/grid-look.ts | 0 | 51 |
| src/lib/views/shared/card/CardDetails.svelte | 163 | 162 |
| src/lib/views/shared/card/CardLinks.svelte | 182 | 180 |
| src/lib/views/shared/card/CardSessions.svelte | 133 | 134 |
| src/lib/views/shared/code/Code.svelte (was views/sources/source/Code.svelte) | 149 | 151 |
| src/lib/views/sources/source/Gutter.svelte | 184 | 185 |
| src/lib/views/sources/source/Preview.svelte | 78 | 79 |
| src/lib/views/sources/source/Source.svelte | 421 | 421 |
| src/lib/views/system/config/Config.svelte | 185 | 180 |
| src/lib/views/system/help/Help.svelte | 91 | 89 |
| src/lib/views/system/help/manual.ts | 57 | 11 |
| src/lib/views/system/hpc/Capacity.svelte | 93 | 90 |
| src/lib/views/system/hpc/Jobs.svelte | 116 | 125 |
| src/lib/views/system/hpc/Log.svelte | 72 | 74 |
| tests/checks/source/controls.test.ts | 49 | 0 |
| tests/checks/source/html-sites.test.ts | 319 | 319 |
| tests/routes/docs/docs.test.ts | 466 | 564 |
| tests/state/sources/fs.test.ts | 831 | 884 |
| tests/state/system/hpc.test.ts | 104 | 143 |
| tests/ui/colours.test.ts | 622 | 619 |
| tests/views/boards/project.test.ts | 468 | 517 |
| tests/views/personal/memories-add.test.ts | 0 | 102 |
| tests/views/personal/memories.test.ts | 279 | 279 |
| tests/views/sessions/presses.test.ts | 0 | 140 |
| tests/views/sessions/terminal.test.ts | 339 | 377 |
| tests/views/shared/card/cardlinks.test.ts | 278 | 289 |
| tests/views/sources/doc.test.ts | 179 | 182 |
| tests/views/sources/source.test.ts | 546 | 546 |
| tests/views/system/config.test.ts | 236 | 245 |
| tests/views/system/help.test.ts | 342 | 352 |
| tests/views/whole/type-scale.test.ts | 346 | 348 |

Lines removed in all (the `<` lines of `diff` against the base, per file, summed): 402 in src, config, eslint.config.js and DESIGN.md, against 547 added; 116 in tests, against 618 added. The source grew by 145 lines: the manual's cut moved from 50 lines of regular expressions on the page (`manual.ts`) to a 35-line render call (`renderManualParts`) and an 8-line diagram test (`diagramOf`) on the server, plus a 17-line shape check of the parts on the page (`readParts`), and the new primitive, the `plain` variant and the moved terminal look add lines the raw controls did not need. Also rewritten by `npm run diagrams`: `docs/diagrams/layer-state.dot/.svg`, `layer-views.dot/.svg`, `layers.dot/.svg`.

Paths outside the brief's list, each needed:

- `src/lib/views/sources/source/Preview.svelte`: builds a `DocState` literal, which now requires `parts` (+1 line, `parts: []`).
- `src/lib/views/sources/source/Gutter.svelte`: its head comment named `Code.svelte` by its old place.
- `src/lib/views/sessions/terminal/grid-look.ts`: the palette, the ANSI table, the selection and the font moved out of `Terminal.svelte`, which with them in reached 554 lines, over the size check's line for a Svelte file; out of it, Terminal.svelte is 507.
- `src/lib/data/model/index.ts`: exports `ManualPart`.
- `tests/views/personal/memories.test.ts`, `tests/views/sources/doc.test.ts`, `tests/views/shared/card/cardlinks.test.ts`, `tests/views/whole/type-scale.test.ts`, `tests/ui/colours.test.ts`, `tests/checks/source/html-sites.test.ts`, `tests/views/sources/source.test.ts`: tests of files the step changed or moved.

## Judgment calls

The 12 controls, each with the primitive it became:

1. `TerminalRows.svelte` pick row (was `:44`): `RowButton` with `title` and `selected={entry.id === selected()}`. RowButton is the pick row's own CSS lifted into a primitive (same padding 0 6px, column flex, `--on-accent-bg` ink when selected), so the `.pick` CSS went.
2. `TerminalRows.svelte` stop control (was `:74`): `ToolButton bare`. Not armed, `bare compact` with the dismiss glyph and label/title "Stop this terminal". Armed, `bare` with label `ui.confirm_stop`, title `sessions.confirm_stop`, and the `.confirm` word as children. `bare` is the strip-action look the row's other controls already use.
3. `Project.svelte` session row (was `:145`): `RowButton title={t('sessions.select_tip')}`. The old element had the tip as `aria-label` and no title; it now is the tooltip and the row's accessible name is its lines. The row's 5px 8px padding is kept as 5px 2px on `.session` plus RowButton's 0 6px.
4. `CardSessions.svelte` session row (was `:76`): `RowButton` inside a `.session` frame span that keeps the border; the dot, tag and title sit in a `.line` flex row inside.
5. `CareerPanel.svelte` status word (was `:168`): `ToolButton plain` inside the `.move` capsule span, which keeps the border, hover and keyboard-focus colour.
6. `LaneCard.svelte` priority flames (was `:81`): `ToolButton plain` with the glyphs as children, inside the `.flames` span (the `unset` dimming stays on the span); label and title are the priority or "set priority".
7. `LaneCard.svelte` project name (was `:102`): `ToolButton plain cut` inside the `.name` span, so a long name is cut with an ellipsis by ToolButton's `cut` instead of the span's own overflow rules.
8. `CardDetails.svelte` crosslink (was `:88`): `ToolButton plain` with the `Tag` as children, inside the `.crosslink` span that draws the chip hover.
9. `CardLinks.svelte` crosslink (was `:117`): the same as 8.
10. `Memories.svelte` picture tile (was `:227`): a `div.tile` (which keeps `data-picture`, `loaded`, the aspect ratio and `data-arrived`) wrapping `ToolButton cell` with label and title `memories.open`, `data-tile` on the button, and the picture or its alt text as children. `cell` fills the tile because `.tile` is now a flex box.
11. `Memories.svelte` lightbox backdrop (was `:262`): `ToolButton cell` with label `memories.close_outside`, inside a `.backdrop` span made a flex box so the cell covers the pane.
12. `Memories.svelte` picture chooser (was `:196`): the new `ui/forms/FileChooser.svelte` (hidden `type="file"` input; props `accept`, `multiple`, `onchoose(files)`; exported `open()`; clears the input after each choice so the same file can be chosen twice). The add control calls `chooser?.open()`; `add()` now takes the files and returns early while busy.

The variant added: ToolButton's `plain` (`ToolButton.svelte:78`, doc comment there, CSS at `.tool.plain`): inline, no border, fill, padding or brackets, and the font, colour, line height, letter spacing, alignment, decoration, case and wrapping of the box around it. It exists because `cell` is a block that fills its box and `bare` draws a strip button's box; the status word, the flames, the name and the crosslinks each have a look drawn by the caller's span. The rice theme's bracket `::before`/`::after` rules gained `:not(.plain)` so a plain button draws no brackets. A plain button's focus ring sits 1px outside its words (`outline-offset: 1px`), since it has no box to draw it inside.

Other calls:

- The wrapper spans that used `:focus-visible` on the old button now use `:has(:global(:focus-visible))`, so their accent colour shows for keyboard focus only, as before.
- ToolButton draws its `title` as oculus's tooltip bubble, not the browser's native tooltip; the crosslinks, the status words, the flames and the tile now show that bubble. `cardlinks.test.ts` checks the bubble's text instead of a `title="..."` attribute.
- The manual's cut does not cut inside a list or a quote: only a top-level paragraph (collected with marked's `hooks.processAllTokens`) is a diagram part, since a cut there would close markup it did not open. An image in a list item or a quote stays in the prose.
- `renderManualParts` rebuilds the full `html` with each diagram paragraph put back where its mark was, so the manual's `html` field is what one parse drew (a reader of `html` alone, such as the doc view, sees the diagrams as images).
- `DocState.parts` is required (empty for every document but the manual) rather than optional, so every constructor names it; `readParts` checks each part's shape before the page holds it and drops one that is neither shape.
- `languageNamed` finds the registered name by object identity with `hljs.getLanguage(name)`; `NAMES` (makefile) stays, since `getLanguage('Makefile')` would need the whole file name, which the lookup does not use.
- The terminal's selection foreground falls back to `--ink` when `--on-accent-bg` is empty (before a theme is applied the root carries no derived tokens), matching every CSS use of that token (`var(--on-accent-bg, var(--ink))`).
- The Jobs table's `Tag` cell is written over three lines (`<td>`, the Tag, `</td>`); the rendered cell has no whitespace at either end (a scratch server render of one job, removed after, printed `<td class="svelte-zfmzgc"><span class="tag ...">...RUNNING</span></span><!----></td>`). The other cells keep their text tight against their tags.
- The HPC catalog keys: `pill_running_one: 1 HPC job running` and `pill_running: '{0} HPC jobs running'` (`hpc.yml:54-55`), the `_one` form the catalog already uses (`days_one`, `card_one`).

## Reader-visible changes, before and after

None of these was looked at in a browser in this step (the brief allows no browser test; the look on TEST is the orchestrator's). Each is what the code draws.

The 12 controls:

- Sessions view, the terminal list, a terminal row: before, a raw button with a 1px accent focus ring inside the row; after, RowButton, whose focus ring is the same 1px accent inside the row. Hover, the selected tint and the text colour are unchanged.
- Same row, its stop control, hovered and pressed once: before, a raw button with the glyph, the native tooltip and a 1px accent focus ring; after, ToolButton `bare`: on hover the chip fill that the strip's other actions draw, the tooltip bubble, and ToolButton's 2px accent focus ring inside its box. Armed, the confirm word in the same place.
- Project tab (a project board), a session row: before, native tooltip absent (the tip was only the aria-label), 2px focus ring; after, the tip is a native tooltip on hover (RowButton's `title`), 1px focus ring. Padding and text unchanged.
- A project card with sessions, its session row: hover and look unchanged in the card (the frame keeps its border); focus ring 1px accent inside (was the browser default ring on the old button, which had no rule).
- Focus board, the career panel, a status word in its capsule: hover unchanged (accent border and word); keyboard focus colours the capsule as before plus ToolButton's 2px ring 1px outside the word; the tooltip is the bubble.
- Focus board, a lane card, the flames: hover and keyboard focus still lift an unset priority from 0.22 to 0.6 opacity; the tooltip is the bubble; a 2px ring 1px outside the glyphs on keyboard focus.
- Same card, the project name: hover and keyboard focus still turn it accent and underlined; a long name is cut with an ellipsis as before; on keyboard focus a 2px ring 1px outside the name.
- A card's details and links, a crosslink tag: hover still fills the chip surface; the tooltip "open in X" is the bubble instead of the native tooltip; keyboard focus draws a 2px ring 1px outside the tag.
- Memories view, a picture tile: before, the ring on keyboard focus was 2px accent 2px outside the tile; after, 2px accent 2px inside it. The pointer cursor, the picture and the tooltip text are unchanged (the tooltip is the bubble).
- Memories view with a picture open, the backdrop around it: a press still closes it; nothing is drawn differently (the cell draws nothing of its own).
- Memories view, the add control: a press opens the browser's file dialog through `FileChooser.open()`, as the old hidden input's click did; not unit-tested (see the first line).

The Config view with a YAML file's disclosure opened: before, the file's text in a plain `<pre class="raw">` in one ink; after, the source tab's read-only code window: line numbers down the left and the YAML painted by highlight.js in the palette's code hues (keys `hljs-attr`, strings, comments), in a box up to 24rem high that scrolls.

The terminal (Sessions, a Terminal tab): before, xterm's default font (its own `courier-new, courier, monospace`) and xterm's own grey selection; after, the font is `--font-mono` (`ui-monospace, SFMono-Regular, Menlo, monospace` in `tokens.css:103`, or a theme's own), and a selection is drawn on `--accent-bg` in `--on-accent-bg`, the selected tree row's colours: under a light theme a pale accent tint with dark text, under a dark theme a dark accent tint with light text, since `derive.ts` derives both per theme. Switching theme repaints the selection and, when the theme's mono font differs, the font.

The Help view's diagrams: drawn as before (each diagram paragraph of HELP.md drawn inline by `Diagram.svelte`, the prose around it as HTML). The cut now comes from the server; a diagram image inside a list item or a quote, which the old regular expression (`IMAGE`, matching any `<img>` in the HTML) would have cut out of its list, now stays in the prose. HELP.md has none today: `grep -n "docs/diagrams" HELP.md` shows every diagram image as a line of its own starting `![`, and the one other hit (`:254`) is prose.

The HPC pill with one job running: before `1 HPC job running` (from `'{0} HPC job{1} running'` with `''`); after `1 HPC job running` (from `pill_running_one`). With two, `2 HPC jobs running` both before and after. No visible change; the words now come from two catalog keys.

The HPC view's Jobs, Capacity and Log markup: one element per line; the drawn text is the same.

## New tests, and the change whose undoing turns each red

- `tests/routes/docs/docs.test.ts`, "a figure's address in a project's README" (4 cases): pin the image rewrite; removing the `walkTokens` rewrite in `figures()` turns the first red (the `src` stays `fig.png`); dropping the root check in it turns the third red.
- `tests/routes/docs/docs.test.ts`, "the manual's parts" (5 cases): passing the default `draw` instead of `renderManualParts` in `renderManual` turns the first four red (no `parts`); returning `parts` from `answer()` for every document turns "carries no parts on the answer of any other document" red.
- `tests/views/system/help.test.ts`, "the diagrams in the manual": undoing `Help.svelte`'s `{#each shown.parts ...}` turns "draws a diagram part from the route" red; removing the `top.has(paragraph)` check turns "an image written inside a code block, a list or a quote is no diagram" red; removing the diagram's html from the rebuilt `html` turns "keeps the diagram in its HTML" red.
- `tests/state/sources/fs.test.ts`, "the language a file is painted in": dropping any of the 11 entries left in `LANGUAGES`, or `languageNamed`'s identity match, turns it red.
- `tests/state/system/hpc.test.ts`, "the HPC pill": removing `pill_running_one` or the `=== 1` choice turns the singular case red.
- `tests/views/system/config.test.ts`, "paints an opened YAML file through the code window": restoring the `<pre class="raw">` turns it red.
- `tests/views/sessions/terminal.test.ts`, "the grid's font and selection": dropping `fontFamily` or `selectionBackground` from `gridLook()` turns the first red; dropping the `|| of('--ink')` fallback turns the second red (run with that change: "1 failed | 23 passed").
- `tests/views/personal/memories-add.test.ts`: drawing the chooser as a raw input turns the first red; handing `add` fewer files, or not reloading, turns the second red.
- `tests/views/sessions/presses.test.ts`: a pick row not calling `select(entry.id)` turns the first red; the armed label not being `ui.confirm_stop` turns the second red; `SessionList` not arming on the first press, or not stopping on the second, turns the third red.
- `tests/views/boards/project.test.ts`, "a press on a session row": the card's or the tab's session row not being a RowButton, or its `onclick` not selecting the session (and, on the card, not opening session-detail), turns its cases red.
