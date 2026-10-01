# S3c report: the Settings view as VS Code's Settings editor

Not done: the presses, focus, scroll-follow, gear on hover, Down and Escape in the search box, and the reveal effect are not tested, because the view tests render to a string with `svelte/server` and no effect or event runs; they are for the look on landing. The table of contents group row cannot be collapsed with the mouse (a press scrolls to the group and opens it); see "Judgment calls". The VS Code 1.137.0 behaviours were not observed in the running app (the brief forbids browser work); the measures come from the recorded `U2-vscode.css:440-616`. Everything else in the brief's four items is done.

## Open items of the state file (verbatim, `.scratch/migration/orchestrator-state.md:111-115`)

An entry leaves this list for the closed log the moment Axel rules on it. What a review or a look found and no brief covered is not an open item: it is booked as its own step in `plan.md` and carried in the Booked section below, since it needs no ruling from him.

- Z146 (raised 2026-10-01, step U2, its audit's "Proposed grouping", `agents/reviews/U2-audit.md:1126-1138`). How the audit's seven groups become build steps. The groups: 1 the header frame (22 px, one line, title cut with an ellipsis, actions on one line with an overflow menu); 2 control sizes (text button 26 px radius 4px, icon action 20 px with a 16 px glyph and no border, input 26 px, one 1px focus ring); 3 type and row scale (base text 13px, rows 22 px, tree indent 8 px with a 16 px twistie, off-scale sizes removed); 4 icons at 16 px (Z148); 5 row and card actions shown on hover or focus-within; 6 collections as rows (Z147); 7 empty, error and narrow states. The measured footprint of the shared parts: `ui/frame/Pane.svelte` 127 lines and `Toolbar.svelte` 30, used by 51 components; `ToolButton.svelte` 506 lines, used by 137; `ui/frame/Card.svelte` 233 lines, used by 20; 414 of the 442 `font-size` declarations under `src/lib` go through the nine `--fs-*` tokens of `themes/tokens.css`; 13 view files set a fixed px height (`grep -rl`/`grep -rho` over `src/lib`, `wc -l`). (a) One step for groups 1, 2, 3 and 5, which change the shared components and tokens above and so touch the same few files; then group 4 once Z148 is ruled, group 7, and group 6 once Z147 is ruled: four steps. For: no tiny steps; each shared change lands once and is looked at once on TEST. Against: one review covers four kinds of change. (b) Seven steps, one per group, in the order 1, 2, 3, 5, 4, 7, 6. For: each review reads one kind of change. Against: four of them are small edits to the same files. (c) No build steps: the audit stays a record. For: no work. Against: every difference it measured stays. Recommendation: (a). The lazy option is (c). Settings is S3c's, the tab strip X3c's, and the X3d parts of Changes are outside every group.
- Z147 (raised 2026-10-01, step U2, group 6 and differences 7, 10 and 15 of `agents/reviews/U2-audit.md`). Collections drawn as cards (radius 10px, a 3px coloured left rule for the status, 285 to 352 px wide, 15px titles) where VS Code draws 22 px rows with a 13px label and a count badge; it holds for projects, coauthor, archive, pillars, domains, venues, data, code, statements, funding, events, education, applications, joint-work, tasks, radar, leads, inbox, linkedin, usage, gallery, audit, config and project. (a) Rows everywhere: each collection view a list of 22 px rows with a count badge, links without the underline. For: one look across the workbench, as VS Code's. Against: the status rule of a card and the card's room for several lines of detail are lost; the largest change of the audit. (b) Rows on Projects first, looked at on TEST and shown to you, and the other views follow your ruling on it. For: you judge the change on one real view before it spreads. Against: one more look and ruling before the rest is built. (c) Keep the cards and restyle only their controls (groups 2 and 5). For: the cards keep what they show. Against: the views stay unlike VS Code's lists. Recommendation: (b). The lazy option is (c).
- Z148 (raised 2026-10-01, step U2, group 4 and difference 19 of `agents/reviews/U2-audit.md:1124`). Icons are Lucide (`DESIGN.md` "Theming"), drawn at 1em of the text beside them, so 9.5 to 15 px, mostly 11.5 px; VS Code's codicons are 16 x 16 px (`U2-vscode.css` css:241, css:252, css:133). (1) Keep Lucide and draw every icon at 16 px. For: DESIGN.md's decision stands and only the size rule changes. Against: the glyph shapes stay Lucide's, unlike VS Code's. (2) Replace the set with codicons through `config/catalogs/icons.yml`. For: glyph for glyph as VS Code. Against: every glyph id is re-mapped, several domain icons have no codicon, and it reverses DESIGN.md's decision. Recommendation: (1). The lazy option is leaving the icons at the size of their text.

## The new cases on the unchanged tree

The first run of the new tests, before the view and state code existed, is `first-run.txt` in the scratchpad: `Test Files  5 failed | 1 passed (6)`, `Tests  23 failed | 22 passed (45)`. The failing files and cases (the three state suites and `number-input.test.ts` fail to load, `[ tests/... ]` being vitest's load-failure form):

- tests/state/system/settings-rows.test.ts, settings-search.test.ts, settings-write.test.ts, tests/ui/forms/number-input.test.ts (module missing).
- tests/views/system/workbench/settings.test.ts, 19 cases: the rail sentence without a heading; the search box and count; the saved query; No Settings Found; each kind of control; the toggle label; a list and a family; a value the control cannot show; the local.yml rows; the Modified bar; the default and file line; a key not in the file; a file still being read and one that cannot be read; the rail and page rows; the rail family's fields; the reveal with and without the ask; the five tracked files; the This browser rows (seven values, text size, wallpaper only under a theme that has one, Modified).

The passing 22 of that run were cases of behaviour the unchanged tree already had (text-input and the old appearance half). Tests were added and the suites split into `tests/state/system/settings/` after that run; for those the proof is the mutations below.

Mutations run on the final tree, each restored afterwards (the file is the one named):

| Mutation | Result |
|---|---|
| M1: `data-modified` never set | fails |
| M2: reveal's `keep` list dropped in `Settings.svelte` | fails |
| M3: wallpaper offered under every theme | fails |
| M4: `Control.svelte` toggle label `row.description` without `.replaceAll('`', '')` | `settings.test.ts > draws the description of a toggle as its label, with no backtick left` fails (1 failed, 41 passed); the test sets a toggle description containing backticks on a cloned catalog |
| M5: count not shown | fails |
| M6: query not drawn | fails |

## DONE / NOT DONE

| Row | State | Proof |
|---|---|---|
| Item 1: rows, write and drafts in `src/lib/state/system/config/` | done | `npx vitest run tests/state/system tests/views/system/workbench`: 14 files, 216 tests passed |
| Item 2: view and partials, `NumberInput`, TextInput `onenter`/`onblur`, ui store resets, markup attributes | done, presses/focus/effects unlooked | same run; `npx vitest run tests/ui/forms tests/state/workbench/ui.test.ts` inside the full `npm test` below |
| Item 3: HELP.md, `appearance.yml`, `options.yml`, DESIGN.md, Settings head comment | done | `grep -rnE "Appearance\.svelte\|rail_title\|reset_title\|settings_appearance" src tests config HELP.md DESIGN.md README.md --exclude=local.yml` finds only `sessions.rail_title` (Sessions' own key, `config/text/views/sessions/session-list.yml:47`) |
| Item 4: cases as tests | done | 155 tests in the new and changed files: `npx vitest run tests/state/system/settings tests/views/system/workbench/settings.test.ts tests/ui/forms/number-input.test.ts tests/ui/forms/text-input.test.ts tests/state/workbench/ui.test.ts` |
| Zod rule for every new reader of an unknown value | done | schemas below; `grep -nE "typeof \|Array\.isArray" src/lib/views/system/workbench/settings/* src/lib/state/system/config/*.ts` leaves only the `typeof` of types, `commit`'s typed `string \| boolean` input and the YAML node guards |
| Full verify list | done | `sh ~/.claude/skills/land/templates/checks.sh .scratch/migration/orchestrator-state.md` printed the lines below |
| `npm run diagrams` | done | exit 0, run right before the list |

Lines printed by checks.sh (from `checks-final-s3c.txt` in the scratchpad):

```
$ npm test
$ npm run test:checks
$ npm run check
$ npm run build
$ npm run format:check
$ npm run lint
$ ! LC_ALL=C grep -rna '[^ -~]' src tests
checks: 7 commands passed
```

`npm test`: `Test Files  376 passed | 20 skipped (396)`, `Tests  6082 passed | 600 skipped (6682)`. `npm run test:checks`: `Test Files  29 passed | 2 skipped (31)`, `Tests  442 passed | 9 skipped (451)`. `npm run check`: `0 ERRORS 0 WARNINGS`. Not covered by these: any browser rendering.

## Zod schemas (module level, each `satisfies z.ZodType<...>`, no error text read or shown)

- `src/lib/state/system/config/typed.ts`: `StateShape` (the instance-state blob as a record), `QueryShape` (the saved query, `.catch('')`), `TypedShape`, `TypedListShape` (the drafts), `RevealShape` (the reveal ask, `.catch(undefined)`).
- `src/lib/state/system/config/rows.ts`: `ToggleShape`, `ChoiceShape`, `NumberShape`, `ListShape`, `TextShape` (what a control can show of a parsed YAML value); `ChoiceShape`, `ListShape` and `TextShape` are exported and are the readers used in `settings/Control.svelte` and `settings/said.ts`.
- `isMap` from `data/helpers/guards.ts` stays for the bare map test in `catalogOf`.

## Client chunk size

Before (`chunks-before.txt`, the build of the unchanged tree): page node `nodes/2.Ce-Cjbzy.js` 1,940,418 bytes; largest chunk `chunks/I7Dj73QH.js` 2,737,063 bytes. After (`find .svelte-kit/output/client/_app/immutable -name '*.js' -not -path '*workers*' -exec wc -c {} +`): page node `nodes/2.CvEeHTL8.js` 2,163,694 bytes (it holds `yaml`, found by `grep -l YAMLParseError`); largest chunk `chunks/I7Dj73QH.js` 2,737,063 bytes. The first client import of `yaml` adds 223,276 bytes to the page node and leaves the largest chunk unchanged.

## Files and line counts (`wc -l`)

State, `src/lib/state/system/config/`: browser.ts 152, config-files.ts 56, groups.ts 145, messages.ts 37, rows.ts 261, search.ts 81, typed.ts 101, write.ts 150. View: Settings.svelte 217, RailEditor.svelte 261, PagesReset.svelte 104, and in `settings/` BrowserControl 193, Contents 96, Control 140, EditLink 24, Gear 43, Header 95, Item 289, List 92, said.ts 40, writer.svelte.ts 23 (10 items, the folder limit). Ui: NumberInput.svelte 18, TextInput.svelte 117. Tests: settings/fixture.ts 21, rows.test.ts 506, search.test.ts 230, write.test.ts 396, views settings.test.ts 690, workbench-fixture.ts 87, number-input.test.ts 51, text-input.test.ts 41. `Appearance.svelte` is deleted.

## Paths written outside the brief's list, with the reason

- `src/lib/state/client/context.ts`: registers the unsaved-draft check (`ui.registerUnsaved`) for a Settings tab holding drafts.
- `src/lib/state/workbench/ui.svelte.ts`: `setWallpaper(null)` and `setCodeTheme(null)` accepted, so Reset Setting returns a per-browser value to what the theme or config says.
- `src/lib/ui/controls/text/Search.svelte`, `text-menu.ts`: the `typedInto` hook the search box needs.
- `src/lib/views/system/config/files.ts`, `Config.svelte`, `tests/state/system/config-files.test.ts`, `tests/checks/source/keys.test.ts`: the import path of `config-files.ts`, which moved into `state/system/config/`.
- `tests/checks/tree/boundaries.test.ts` and the `DESIGN.md:171` row: state may import `data/sources/config/options` (for `Catalog`).
- `tests/views/whole/type-scale.test.ts`: the new view's sizes.
- `config/text/views/system/workbench.yml`: the new words; `docs/diagrams/*`: regenerated.

## Judgment calls the brief left open

- Reset Setting is offered for toggle, number, text and choice rows only: the server's `writeConfigKey` refuses lists and families.
- The wallpaper row is offered only under a theme that has a wallpaper (`wallpaperOnTheme`).
- While the reveal ask is set, the search keeps the rail row whatever the query (`searchGroups(..., keep=[RAIL_ROW])`), and the effect clears a query that hides it before scrolling.
- The contents tree's group row: a press scrolls to the group and opens it; it cannot be collapsed by mouse. Left as is, and listed under "Not done" above.
- The Settings pane is drawn without `tinted`, with `:global(body.wall) .view { background: var(--chip-on-wall) }` so a wallpaper shows through.

## VS Code 1.137.0 against the brief

Not observed in the running app. Measures used, from `U2-vscode.css:440-616`: item padding `12px 14px 18px`, modified bar `left:5px; top:15px; bottom:18px` with a 2px left border, title weight 600, contents hidden under 700px, header padding `3px 24px` with margin-top 11px, number field min-width 200px, text 420px, select 320px. No difference from the brief found in that record.
