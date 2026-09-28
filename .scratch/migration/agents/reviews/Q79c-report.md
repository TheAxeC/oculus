Not done: the repair round's item 1 asks that the terminal's grid-look cases drop "audits" from their names, and that is not done, because it clashes with `tests/checks/tree/audits.test.ts`. That check makes every case under `tests/views/` that never reaches a render either start its name with "audits" or appear on `allow-audits.txt`, a list that takes no new entries. The three cases test the pure functions `Terminal.svelte:276` and `:354` call (`gridOptions`, `applyLook`, `gridLook`), but they render nothing, so they keep the "audits" prefix and the check stays green. Everything else in the round's brief is done. Also not done: the round's brief says not to run the full verify list, so it has not been run over the round's changes; the check, format:check, lint and every touched test file were run and pass.

# Q79c report (after repair round 1)

## Open items (verbatim from the main checkout's `tools/oculus/.scratch/migration/orchestrator-state.md`, read at the end of the round)

## Open items (only what Axel must rule on; every report opens with this list verbatim and repeats it until he has ruled)

An entry leaves this list for the closed log the moment Axel rules on it. What a review or a look found and no brief covered is not an open item: it is booked as its own step in `plan.md` and carried in the Booked section below, since it needs no ruling from him.

- None.


## The rule clash, for the orchestrator

The round's item 1 ("The case names drop 'audits', since they now test the code the component runs") and `tests/checks/tree/audits.test.ts` ("is named an audit everywhere under tests/views", backed by `allow-audits.txt`, whose head says "nothing is added, since a new case of that shape carries the word in its own name") cannot both hold for a case under `tests/views/` that renders nothing. The options:

- (a) Keep the cases in `terminal.test.ts` with the "audits" prefix, as built now. The check stays green; the names say "audits" of cases that exercise the functions the component runs. The report no longer cites them as coverage of `Terminal.svelte` itself, only of the two functions it calls.
- (b) Move the three cases to a new test file outside `tests/views/`, named without the prefix. The check does not read that folder, but no other test of a `views/` module lives outside `tests/views/` except two checks under `tests/checks/`, so the file would sit in a place the tree's layout does not name.
- (c) Rename them and add them to `allow-audits.txt`. This breaks that file's rule that nothing is added, and is the lazy option.

Recommended (a): the check's definition of an audit is about rendering, and these cases do not render; the names stay honest under that definition, and the functions they test are the ones the component calls.

## Repair round 1, item by item

| # | Item | State | Where | Proved by |
|---|------|-------|-------|-----------|
| 1 | grid options and re-apply from pure functions | DONE, except the case names (see the clash) | `grid-look.ts:61` `gridOptions(look, size)` (the look, `convertEol: false`, the size when there is one); `grid-look.ts:70` `applyLook(options, look)` (the theme, the font family only when it differs); `Terminal.svelte:276` and `:354` call them and do nothing else with the look | terminal.test.ts, 3 cases green; each red with its change undone (quoted under "New tests") |
| 2 | cardlinks `CONTROL` from the catalog | DONE | `tests/views/shared/card/cardlinks.test.ts:39` builds `>\+\d+<` from `project.card.more_tags` (`'+{0}'`) with `{0}` as `\d+`; the comment above says what it finds and why | cardlinks.test.ts 13 green; red with the more control drawn for a short kind |
| 3 | `languages()` and its check | DONE | `fs.ts:179`, head comment above it; `fs-shape.test.ts` "names only languages the code window has registered" checks both directions of `languages()` against `registered()` and `languageOf` of the 24 listed names | fs-shape.test.ts green; red with either change undone |
| 4 | `DESIGN.md:282` | DONE | the sentence now reads: "A file's name reaches a grammar through highlight.js's own names and aliases first, so `.toml` and `.ini` read as ini, `.html` and `.svg` as xml and `.diff` and `.patch` as diff; then through the extension map of `state/sources/fs.ts` for what highlight.js does not name, so `.ipynb` reads as json and `.svelte` as xml; then a file called `Makefile`, which carries no extension, is matched by its whole name lowercased." | each mapping in it measured with `node --experimental-strip-types` calling the worktree's `languageOf`: `a.toml ini`, `a.ini ini`, `a.html xml`, `a.svg xml`, `a.diff diff`, `a.patch diff`, `a.ipynb json`, `a.svelte xml`, `Makefile makefile` |
| 5 | RowButton's head comment | DONE | `ui/controls/RowButton.svelte:2-7`: the pressable body of a list row beside its own controls, of one line or several, used by the Sessions list's session and terminal rows, a card's sessions and the project tab; a row of an explorer tree is TreeItem's. The users named are the four files that import it (`grep -rln "import RowButton" src`: CardSessions, TerminalRows, SessionWorkspace, Project) | read |
| 6 | the stop control one ToolButton | DONE | `TerminalRows.svelte:45` `{@const armed = arming === entry.id}`, `:78-89` one ToolButton whose `compact`, `label`, `glyph`, `title` and children follow `armed` | presses.test.ts "is one control, unarmed and armed, its words following the arming" green; red with either change undone (quoted) |
| 7 | the status capsule pressable over its whole area | DONE | `ToolButton.svelte:86` new `capsule` variant, doc comment at `:79-85`, CSS at `.tool.capsule`; `CareerPanel.svelte:170` `<ToolButton capsule ...>`; `span.move` and its CSS removed | type-scale and wall tests green; the press area is for the look |
| 8 | report: newly painted extensions, focus kept, press area | DONE | "Reader-visible changes" below | |
| 9 | report: the cardlinks predicate | DONE | below | |
| 10 | report: each new or changed case red with its change undone | DONE | "New tests" below | |
| - | `ManualPart` alphabetical | DONE | `data/model/index.ts:328`, between `Id` and `Organisation` | `npm run check` green |

Item 3 note: the brief says "the values of `LANGUAGES` and `NAMES`". In `fs.ts` both maps are keyed by language (`{ json: ['.ipynb'], ... }`, `{ makefile: ['makefile'] }`), so the languages are their keys and `languages()` takes the keys.

Item 9, the cardlinks predicate. Before the step the three checks at `cardlinks.test.ts:162`, `:165` and `:209` said `not.toContain('class="tool')`: no ToolButton was drawn on a kind no longer than SHOWN, since the more control was the only ToolButton on the line. The step made each cross-link a ToolButton (`plain`), so that predicate would fail on every cross-link kind. The first build narrowed it to `/class="tool svelte-\w+"/`, a ToolButton with no variant class, which ties the check to the more control having no variant. The round makes it `>\+\d+<`, built from the catalog's `project.card.more_tags`: the more control's own word, which no cross-link carries, whatever primitive or variant draws it.

The files of the round, line counts at the round's start (the worktree commit 787dc14c, as this report's first build gave them; `fs-shape.test.ts` and `RowButton.svelte` are the main checkout's, which the first build did not change) and now (`wc -l`):

| File | Before | After |
|------|-------:|------:|
| src/lib/views/sessions/terminal/grid-look.ts | 51 | 73 |
| src/lib/views/sessions/terminal/Terminal.svelte | 507 | 497 |
| src/lib/views/sessions/session-list/TerminalRows.svelte | 201 | 197 |
| src/lib/views/boards/focus/CareerPanel.svelte | 497 | 473 |
| src/lib/ui/controls/ToolButton.svelte | 448 | 490 |
| src/lib/ui/controls/RowButton.svelte | 52 | 53 |
| src/lib/state/sources/fs.ts | 898 | 900 |
| src/lib/data/model/index.ts | 474 | 474 |
| DESIGN.md | 320 | 320 |
| tests/views/sessions/terminal.test.ts | 377 | 399 |
| tests/views/sessions/presses.test.ts | 140 | 168 |
| tests/views/shared/card/cardlinks.test.ts | 289 | 295 |
| tests/state/sources/fs-shape.test.ts | 316 | 345 |
| tests/views/whole/type-scale.test.ts | 348 | 348 |

`fs.ts` is at 900 lines, the size check's line for a `.ts` file (`tests/checks/tree/size.test.ts` green); two doc comments in it were shortened by a line each to stay there.

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
| 2 | the 12 raw controls made primitives | DONE | see "Judgment calls" for each; `ToolButton.svelte:78` (`plain`), `:86` (`capsule`), `ui/forms/FileChooser.svelte` (new, 38 lines) | the grep above; `tests/views/sessions/presses.test.ts`, `tests/views/boards/project.test.ts`, `tests/views/personal/memories-add.test.ts` green |
| 3 | `figures()` a walkTokens extension | DONE | `server/content/docs.ts:261` `figures()`, `walkTokens` at `:263`; no image renderer, no hand `<img>` string, `escapeAttribute` no longer imported | `grep -rn "renderer:" src/lib/server/content/docs.ts` prints only `316: renderer: {`, which is the manual cut's paragraph renderer (item 4), not an image renderer; docs.test.ts "a figure's address in a project's README" green |
| 4 | the manual's cut on the server | DONE | `ManualPart` at `data/model/model-entities.ts:208`, exported in alphabetical order at `data/model/index.ts:328`; `renderManualParts` at `server/content/docs.ts:305`; `answer()` gains `draw` and `...draw(read.text)` at `:362`; `DocState.parts` at `state/system/docs.svelte.ts:44`, `readParts` at `:315`; `Help.svelte` draws `shown.parts`; `views/system/help/manual.ts` holds only `diagramUrl` (11 lines) | `grep -rn "splitManual\|matchAll(IMAGE" src` prints nothing; docs.test.ts "the manual's parts" and help.test.ts "the diagrams in the manual" green |
| 5 | highlight.js asked first | DONE | `languageNamed` at `state/shared/words/languages.ts:84`; `languageOf` asks it at `state/sources/fs.ts:148`; `LANGUAGES` holds the 11 unresolved extensions; `languages()` at `fs.ts:179` returns every registered grammar with the LANGUAGES and NAMES languages; `DESIGN.md:282` states the order | fs.test.ts "the language a file is painted in" (38 names, each the language of the unchanged tree) and fs-shape.test.ts "names only languages the code window has registered" green |
| 6 | the Config view's YAML through the code window | DONE | `views/shared/code/Code.svelte` (moved from `views/sources/source/Code.svelte`, token CSS moved with it); `Config.svelte:142` `<Code text={held.text} language="yaml" path={name} />` inside `data-file`; `Source.svelte` imports the new path | config.test.ts "paints an opened YAML file through the code window" green |
| 7 | terminal font and selection from tokens | DONE | `views/sessions/terminal/grid-look.ts`: `gridLook()` reads the tokens, `gridOptions()` (`:61`) builds the options, `applyLook()` (`:70`) re-applies a look; `Terminal.svelte:276` `new xterm.Terminal(gridOptions(gridLook(), size))` and `:354` `applyLook(grid.options, gridLook())` | terminal.test.ts "the grid's font and selection" (3 cases over the functions Terminal.svelte calls) green; see the rule clash below on their names |
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

Verify. The full verify list was run once before this repair round, from the worktree's oculus folder with node v24.21.0 on PATH, and exited 0 ending `verify: 6 commands passed` ("Test Files 344 passed (344)", "Tests 5434 passed (5434)"). The round's brief says not to run it again (the orchestrator runs it on main at landing), so it has not been run over the round's changes. Over the round's changes these ran:

```
npx vitest run tests/views/sessions tests/views/shared/card tests/state/sources tests/views/whole tests/ui tests/views/boards tests/checks/tree tests/checks/source tests/checks/diagrams tests/views/system
 Test Files  77 passed (77)
      Tests  1351 passed (1351)
npm run check        COMPLETED 1446 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
npm run format:check All matched files use Prettier code style!
npx eslint .         exit 0
npm run diagrams     exit 0, docs/diagrams unchanged by the round (md5 of every file the same before and after)
ASCII perl gate      prints nothing, exit 0
```

Untouched test files that timed out in earlier full runs under a load average of 12 to 19 on this machine (another builder and Microsoft Defender running): `tests/server/core/git.test.ts`, `tests/server/git/git-ops.test.ts`, `tests/server/core/git-reads.test.ts`, `tests/routes/git/changes.test.ts`, `tests/checks/bin/claude-usage.test.ts`, `tests/checks/source/keys.test.ts`, each a 5000 ms timeout, each file byte-identical to the main checkout's (`cmp -s`); nothing was done about them, and the verify run above passed them.

## Files, line counts before and after

This table is the step as first built; the repair round's files follow it.

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
2. `TerminalRows.svelte` stop control (was `:74`): one `ToolButton bare` (`TerminalRows.svelte:78-89`) whose props follow `armed` (`{@const armed = arming === entry.id}` at `:45`): not armed, `compact` with the dismiss glyph, label and title "Stop this terminal"; armed, label `ui.confirm_stop`, title `sessions.confirm_stop`, no glyph, and the `.confirm` word as children. One element across both states, so the button focused at the first press is the one the second press confirms. `bare` is the strip-action look the row's other controls already use.
3. `Project.svelte` session row (was `:145`): `RowButton title={t('sessions.select_tip')}`. The old element had the tip as `aria-label` and no title; it now is the tooltip and the row's accessible name is its lines. The row's 5px 8px padding is kept as 5px 2px on `.session` plus RowButton's 0 6px.
4. `CardSessions.svelte` session row (was `:76`): `RowButton` inside a `.session` frame span that keeps the border; the dot, tag and title sit in a `.line` flex row inside.
5. `CareerPanel.svelte` status word (was `:168`): `ToolButton capsule` (`CareerPanel.svelte:170`), a new variant that draws the capsule on the button itself, so its padding and border are part of the press area; the `span.move` wrapper and its CSS are gone.
6. `LaneCard.svelte` priority flames (was `:81`): `ToolButton plain` with the glyphs as children, inside the `.flames` span (the `unset` dimming stays on the span); label and title are the priority or "set priority".
7. `LaneCard.svelte` project name (was `:102`): `ToolButton plain cut` inside the `.name` span, so a long name is cut with an ellipsis by ToolButton's `cut` instead of the span's own overflow rules.
8. `CardDetails.svelte` crosslink (was `:88`): `ToolButton plain` with the `Tag` as children, inside the `.crosslink` span that draws the chip hover.
9. `CardLinks.svelte` crosslink (was `:117`): the same as 8.
10. `Memories.svelte` picture tile (was `:227`): a `div.tile` (which keeps `data-picture`, `loaded`, the aspect ratio and `data-arrived`) wrapping `ToolButton cell` with label and title `memories.open`, `data-tile` on the button, and the picture or its alt text as children. `cell` fills the tile because `.tile` is now a flex box.
11. `Memories.svelte` lightbox backdrop (was `:262`): `ToolButton cell` with label `memories.close_outside`, inside a `.backdrop` span made a flex box so the cell covers the pane.
12. `Memories.svelte` picture chooser (was `:196`): the new `ui/forms/FileChooser.svelte` (hidden `type="file"` input; props `accept`, `multiple`, `onchoose(files)`; exported `open()`; clears the input after each choice so the same file can be chosen twice). The add control calls `chooser?.open()`; `add()` now takes the files and returns early while busy.

The variants added: ToolButton's `capsule` (`ToolButton.svelte:86`, doc comment above it): the chip fill inside a 1px `--line` border with a 4px radius, padding 0 6px, the word `--fs-sm`, bold and upper case in `--muted-txt`, the border and word in `--accent-txt` under the pointer and on keyboard focus (with ToolButton's 2px ring 1px outside), transparent over a wallpaper (`body.wall`), the same under the rice themes (no brackets), which is the `.move` span's look moved onto the button. ToolButton's `plain` (`ToolButton.svelte:78`, doc comment there, CSS at `.tool.plain`): inline, no border, fill, padding or brackets, and the font, colour, line height, letter spacing, alignment, decoration, case and wrapping of the box around it. It exists because `cell` is a block that fills its box and `bare` draws a strip button's box; the flames, the name and the crosslinks each have a look drawn by the caller's span. The rice theme's bracket `::before`/`::after` rules gained `:not(.plain)` so a plain button draws no brackets. A plain button's focus ring sits 1px outside its words (`outline-offset: 1px`), since it has no box to draw it inside.

Other calls:

- The wrapper spans of the flames and the name, which used `:focus-visible` on the old button, now use `:has(:global(:focus-visible))`, so their accent colour shows for keyboard focus only, as before.
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
- Same row, its stop control, hovered and pressed once: before, a raw button with the glyph, the native tooltip and a 1px accent focus ring; after, ToolButton `bare`: on hover the chip fill that the strip's other actions draw, the tooltip bubble, and ToolButton's 2px accent focus ring inside its box. Armed, the confirm word in the same place, on the same element, so keyboard focus stays on the control between its two presses (before and after alike, one element; a server render cannot show focus, so this is for the look).
- Project tab (a project board), a session row: before, native tooltip absent (the tip was only the aria-label), 2px focus ring; after, the tip is a native tooltip on hover (RowButton's `title`), 1px focus ring. Padding and text unchanged.
- A project card with sessions, its session row: hover and look unchanged in the card (the frame keeps its border); focus ring 1px accent inside (was the browser default ring on the old button, which had no rule).
- Focus board, the career panel, a status word in its capsule: before, a raw button inside the capsule; after, the capsule is the button, so a press on its padding or border presses it too. Hover unchanged (accent border and word); keyboard focus colours the capsule as before plus ToolButton's 2px ring 1px outside the capsule; the tooltip is the bubble. The press area is for the look.
- Focus board, a lane card, the flames: hover and keyboard focus still lift an unset priority from 0.22 to 0.6 opacity; the tooltip is the bubble; a 2px ring 1px outside the glyphs on keyboard focus.
- Same card, the project name: hover and keyboard focus still turn it accent and underlined; a long name is cut with an ellipsis as before; on keyboard focus a 2px ring 1px outside the name.
- A card's details and links, a crosslink tag: hover still fills the chip surface; the tooltip "open in X" is the bubble instead of the native tooltip; keyboard focus draws a 2px ring 1px outside the tag.
- Memories view, a picture tile: before, the ring on keyboard focus was 2px accent 2px outside the tile; after, 2px accent 2px inside it. The pointer cursor, the picture and the tooltip text are unchanged (the tooltip is the bubble).
- Memories view with a picture open, the backdrop around it: a press still closes it; nothing is drawn differently (the cell draws nothing of its own).
- Memories view, the add control: a press opens the browser's file dialog through `FileChooser.open()`, as the old hidden input's click did; not unit-tested (see the first line).

The source tab over a file whose extension highlight.js names: `.html`, `.svg`, `.diff`, `.patch`, `.jsonc`, `.mk`, `.gyp`, `.plist`, `.xsd`, `.json5`, `.mak`, `.make`, `.mkd`, `.mkdown`, `.ipython`, `.xhtml`, `.rss`, `.atom`, `.xsl`, `.wsf` and `.xjb` were plain text and are now painted: html, svg, plist, xsd, xhtml, rss, atom, xsl, wsf and xjb as xml; diff and patch as diff; jsonc and json5 as json; mk, mak and make as makefile; mkd and mkdown as markdown; gyp and ipython as python. Measured with `node --experimental-strip-types` calling `languageOf` from the main checkout's `fs.ts` (all `plaintext`, `.toml` already `ini`) and from the worktree's (the languages above). The editor reads `languageOf(path)` (`views/sources/source/Editor.svelte:113`), so a source tab over an `.html` or `.svg` file is painted too, though the file browser opens those in the document view and the picture view.

The Config view with a YAML file's disclosure opened: before, the file's text in a plain `<pre class="raw">` in one ink; after, the source tab's read-only code window: line numbers down the left and the YAML painted by highlight.js in the palette's code hues (keys `hljs-attr`, strings, comments), in a box up to 24rem high that scrolls.

The terminal (Sessions, a Terminal tab): before, xterm's default font (`fontFamily:"monospace"` in `node_modules/@xterm/xterm/lib/xterm.js`, the browser's generic monospace) and xterm's default selection (`rgba(255, 255, 255, 0.3)` in the same file, a translucent white over the grid, which barely shows on a light panel); after, the font is `--font-mono` (`ui-monospace, SFMono-Regular, Menlo, monospace` in `tokens.css:103`, or a theme's own), and a selection is drawn on `--accent-bg` in `--on-accent-bg`, the selected tree row's colours: under a light theme a pale accent tint with dark text, under a dark theme a dark accent tint with light text, since `derive.ts` derives both per theme. Switching theme repaints the selection and, when the theme's mono font differs, the font.

The Help view's diagrams: drawn as before (each diagram paragraph of HELP.md drawn inline by `Diagram.svelte`, the prose around it as HTML). The cut now comes from the server; a diagram image inside a list item or a quote, which the old regular expression (`IMAGE`, matching any `<img>` in the HTML) would have cut out of its list, now stays in the prose. HELP.md has none today: `grep -n "docs/diagrams" HELP.md` shows every diagram image as a line of its own starting `![`, and the one other hit (`:254`) is prose.

The HPC pill with one job running: before `1 HPC job running` (from `'{0} HPC job{1} running'` with `''`); after `1 HPC job running` (from `pill_running_one`). With two, `2 HPC jobs running` both before and after. No visible change; the words now come from two catalog keys.

The HPC view's Jobs, Capacity and Log markup: one element per line; the drawn text is the same.

## New tests, and the change whose undoing turns each red

Cases of the first build (each named change turns it red; these were not rerun in this round unless listed under the round below):

- `tests/routes/docs/docs.test.ts`, "a figure's address in a project's README" (4 cases): removing the `walkTokens` rewrite in `figures()` turns the first red (the `src` stays `fig.png`); dropping the root check in it turns the third red.
- `tests/routes/docs/docs.test.ts`, "the manual's parts" (5 cases): passing the default `draw` instead of `renderManualParts` in `renderManual` turns the first four red (no `parts`); returning `parts` from `answer()` for every document turns "carries no parts on the answer of any other document" red.
- `tests/views/system/help.test.ts`, "the diagrams in the manual": undoing `Help.svelte`'s `{#each shown.parts ...}` turns "draws a diagram part from the route" red; removing the `top.has(paragraph)` check turns "an image written inside a code block, a list or a quote is no diagram" red; removing the diagram's html from the rebuilt `html` turns "keeps the diagram in its HTML" red.
- `tests/state/sources/fs.test.ts`, "the language a file is painted in": dropping any of the 11 entries left in `LANGUAGES`, or `languageNamed`'s identity match, turns it red.
- `tests/state/system/hpc.test.ts`, "the HPC pill": removing `pill_running_one` or the `=== 1` choice turns the singular case red.
- `tests/views/system/config.test.ts`, "paints an opened YAML file through the code window": restoring the `<pre class="raw">` turns it red.
- `tests/views/personal/memories-add.test.ts`: drawing the chooser as a raw input turns the first red; handing `add` fewer files, or not reloading, turns the second red.
- `tests/views/sessions/presses.test.ts`, the first three cases: a pick row not calling `select(entry.id)` turns the first red; the armed label not being `ui.confirm_stop` turns the second red; `SessionList` not arming on the first press, or not stopping on the second, turns the third red.
- `tests/views/boards/project.test.ts`, "a press on a session row": the card's or the tab's session row not being a RowButton, or its `onclick` not selecting the session (and, on the card, not opening session-detail), turns its cases red.

Cases new or changed in the repair round, each run with the change it guards undone (the file copied aside, edited, the test file run, the copy put back; `grep` afterwards found none of the edits left):

- terminal.test.ts, "audits that the grid is built with the mono font and the selected row surface, read off the body". Undone: `gridOptions` built without the look (`{ theme: { background }, convertEol: false }`). Result: `x audits that the grid is built with the mono font ...`, `AssertionError: expected undefined to be '"JetBrains Mono", monospace'`, "Tests 1 failed | 24 passed (25)".
- terminal.test.ts, "audits that a new look puts its font and its selection on a grid drawn in another". Undone: the font line of `applyLook` removed (the case's starting font, `courier-new, courier, monospace`, is a stand-in for any other font): `AssertionError: expected 'courier-new, courier, monospace' to be '"JetBrains Mono", monospace'`, "Tests 1 failed | 24 passed (25)". Undone: `options.theme = look.theme` removed: `AssertionError: expected '#888888' to be '#d0e4ff'`, "Tests 1 failed | 24 passed (25)".
- terminal.test.ts, "audits that the selection is drawn in the ink before a theme sets its own colour". Undone: the `|| of('--ink')` fallback removed: `AssertionError: expected '' to be '#111111'`, "Tests 1 failed | 24 passed (25)".
- cardlinks.test.ts, the three "no control offering the rest" checks with the new `CONTROL`. Undone: `CardLinks.svelte`'s `{#if drawn.length < kind.tags.length}` made `<=`, so a kind no longer than SHOWN draws the control: `x draws the four kinds in their order, each labelled, with the long ones cut`, `x draws a kind no longer than SHOWN whole and offers no control`, `AssertionError: expected ' svelte-zfwot8"><span class="kind sve...' not to match />\+\d+</`, "Tests 2 failed | 11 passed (13)". The added `expect(funding).toMatch(CONTROL)` holds the pattern to the control a long kind does draw, so the pattern cannot pass by matching nothing.
- fs-shape.test.ts, "names only languages the code window has registered". Undone: `languages()` without `registered()`: `AssertionError: expected [ 'css', 'diff', 'ini', ...(7) ] to deeply equal []`, "Tests 1 failed | 28 passed (29)". Undone: `languageNamed` returning the alias instead of the registered name: the case fails with `AssertionError: expected [ 'a.ts', 'a.js', 'a.py', ...(10) ] to deeply equal []` (and "names the language of a code file and plain text for the rest of the text ones" with it), "Tests 2 failed | 27 passed (29)".
- presses.test.ts, "is one control, unarmed and armed, its words following the arming". Undone: the armed label fixed to the stop words: `AssertionError: expected { bare: true, compact: false, ...(6) } to match object { label: 'Confirm', ...(3) }` (and "names the stop and, once armed, the word that confirms it"), "Tests 2 failed | 2 passed (4)". Undone: the round's one ToolButton put back as the `{#if armed}` / `{:else}` pair of two: `AssertionError: expected { bare: true, label: 'Confirm', ...(4) } to match object { label: 'Confirm', ...(3) }`, "Tests 1 failed | 3 passed (4)". It fails there only because the armed button of the pair passes no `compact` and no `glyph` prop; a server render does not show which element holds focus, so the kept focus itself is seen at the look.
- type-scale.test.ts, the ToolButton roles (changed for `capsule`). Undone: the capsule's `font-size` set to `--fs-xs`: `x sets every pass-through role in src/lib/ui/controls/ToolButton.svelte`, "Tests 1 failed | 237 passed (238)".
- wall.test.ts (unchanged test, new rule it checks). Undone: the capsule's `body.wall` rule removed: `AssertionError: expected [ ...(33) ] to deeply equal [ ...(32) ]`, "Tests 1 failed | 3 passed (4)".
