# S3c report: the Settings view as VS Code's Settings editor, with repair round 1

Not done: the presses, focus, scroll-follow, gear on hover, Down and Escape in the search box and in a field, Enter and blur writes of the number and text boxes, the Terminal text size box applying on Enter or blur, the reveal effect (clear the query, wait, scroll, restate) and the look of the hover highlight over a wallpaper are not tested, because the view tests render to a string with `svelte/server` and no effect or event runs; they are for the look on landing. The rulings of repair round 1 are all done; ruling 1 is done with one text the ruling names (`1e1`) behaving differently from what the ruling lists, raised below.

## Open items (the "Open items" section of `.scratch/migration/orchestrator-state.md` on main, verbatim)


An entry leaves this list for the closed log the moment Axel rules on it. What a review or a look found and no brief covered is not an open item: it is booked as its own step in `plan.md` and carried in the Booked section below, since it needs no ruling from him.




That section holds no entry on main. Raised by this round, not yet in the state file (I do not edit it):

- R1-A, ruling 1 against the rule it names. The ruling says the Terminal text size box reads its text by the decimal rule of `write.ts` and refuses `0x10`, `1e1`, `Infinity`, `1,5` and `1x`. That rule (`^-?(\d+\.?\d*|\.\d+)([eE][-+]?\d+)?$`, the brief's pattern) accepts an exponent, so `1e1` is the number 10 under it, and `tests/state/system/settings/write.test.ts:71` already asserts that a config number row writes `1e3` as 1000. I built the shared rule, so `0x10`, `Infinity`, `1,5`, `1x`, `--1`, `1e` and `1e999` are refused with the message of a config number row and `1e1` sets 10 as it would in a config row. Options: (a) one rule, `1e1` accepted in both places (built); (b) refuse exponents in the rule, which changes the brief's pattern for every config number row and the test at `write.test.ts:71`; (c) a second rule only for the box, which the ruling forbids. Recommendation: (a). The lazy option is (c).
- R1-B, two tree checks that pull apart on ruling 14. `tests/views/whole/tinted.test.ts` requires a view that asks for `tinted` to have no wall surface of its own, and `tests/ui/theme/wall.test.ts` requires every `background: var(--chip)` to be answered under `body.wall` or listed as solid with a reason. Keeping `tinted` (ruling 14) meant the hover highlight of an item, which had a `body.wall` answer, could no longer have one. I removed that answer and listed `Item.svelte .item:hover, .item:focus-within` in `SOLID` of `tests/ui/theme/wall.test.ts` as "a hover response, saying which setting the pointer or the focus is on", the form the sessions and card hover rules there already have. The highlight over a wallpaper is therefore the opaque `--chip`; it is for the landing look.

## Verification

`PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH npm run diagrams` (exit 0), then `sh ~/.claude/skills/land/templates/checks.sh .scratch/migration/orchestrator-state.md` from `tools/oculus` of the worktree, exit 0, printing:

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

`npm test`: `Test Files  377 passed | 20 skipped (397)`, `Tests  6094 passed | 600 skipped (6694)`. `npm run test:checks`: `Test Files  29 passed | 2 skipped (31)`, `Tests  442 passed | 9 skipped (451)`. The new and changed suites (`npx vitest run tests/state/system/settings tests/views/system/workbench/settings.test.ts tests/ui/forms/number-input.test.ts tests/ui/forms/text-input.test.ts tests/state/workbench/ui.test.ts`): `Test Files  8 passed (8)`, `Tests  167 passed (167)`. `npm run check` ended `COMPLETED 2862 FILES 0 ERRORS 0 WARNINGS`. ASCII over `HELP.md DESIGN.md config/appearance.yml config/catalogs/options.yml config/text/views/system/workbench.yml`: `LC_ALL=C grep -nP '[^\x00-\x7F]'` printed nothing. These runs do not cover any browser rendering.

## Repair round 1, one line per ruling

1. Terminal text size box: `write.ts` exports `decimalOf(text)` (the one decimal rule, `-0` as `0`), `commit` uses it, `browser.ts` `terminalSizeOf(text)` answers `{ set: true, value }` (empty: `null`, the config's size) or `{ set: false, said: message('notNumber') }`; `BrowserControl.svelte` applies through it, keeps a refused text in the box and shows the message through `Item.svelte`'s message lines; Escape drops the text and the message. Tests `tests/state/system/settings/browser.test.ts` (4), first run `TypeError: terminalSizeOf is not a function` x4, M7 and M20 below. `1e1` is accepted (R1-A).
2. `data-control` takes only the brief's values: `BrowserRow` carries `control` (`choice` theme and code theme, `number` text size and terminal size, `toggle` CRT, wallpaper, icons), `Item.svelte` no longer returns `browser`. View test "names on each row the control it draws, and no other word", first run `AssertionError: expected { theme: 'browser', ...(6) } to deeply equal { theme: 'choice', ...(6) }`, M22.
3. `ui/forms/TextArea.svelte` and `ui/forms/DateInput.svelte` call `typedInto` of `ui/controls/text/text-menu.ts` as `Search.svelte` and `TextInput.svelte` do (`grep -rn typedInto src/lib`: 4 callers and the definition). It is a dedupe: the four lines live once and no box gains behaviour. Both paths join the step's paths.
4. `isEqual` from `lodash-es` stays in `rows.ts`, `write.ts` and `browser.ts`. It is the client's first import of `lodash-es`, an existing dependency (`package.json`, used by `src/lib/server/**` on the base per `git grep -l lodash-es a157d199 -- src`), beside `yaml`; no new dependency.
5. VS Code 1.137.0 read in its shipped source, and the Contents group row follows it: a press on a group toggles it (open closes, closed opens) and scrolls to its heading; a group with no section stays as it is. `groups.ts` `pressedGroups` and `toggledGroups`, tests "a press on a group of the table of contents" (3), first run `TypeError: pressedGroups is not a function`, M17. The findings per behaviour are in the section "VS Code 1.137.0 against the brief".
6. Proof of cases 1 to 27: mutations M7 to M20 below, each on a scratch copy of the worktree under `$TMPDIR`, with the failing test names quoted. The first run is restated below.
7. The two `ui.test.ts` tests "forgets a wallpaper choice for null" and "forgets a code theme pick for null" are removed. The change adds no runtime behaviour to `setWallpaper` and `setCodeTheme`: on the base store (`git show a157d199:tools/oculus/src/lib/state/workbench/ui.svelte.ts` in the scratch copy) the two tests with their `chosen()` lines taken out pass (`ok forgets a wallpaper choice for null`, `ok forgets a code theme pick for null`, `Tests  2 passed | 38 skipped (40)`); what the base lacks is `chosen()` and `initial()`, whose test "gives the start values of a browser that saved nothing, whatever it holds now" fails on the base (`client.ui.chosen is not a function`), and the Reset flows in `rows.test.ts` ("marks a saved code theme Modified, and forgets it on Reset", "marks each value this browser holds of its own Modified, and Reset forgets each") go through `chosen()`.
8. Case 27: `search.test.ts` "counts the seven This browser rows when no config file is described" calls `searchGroups` over the browser-only groups (7 for an empty query, 1 for `@id:crt`, 0 for `@modified`); it fails under M11, M12 and M15.
9. Bundle: see "Client chunk size" below; the whole delta of the page node is stated and what the node holds is named.
10. The tag-comparison test in `text-input.test.ts` is removed; the file's head comment says the Enter and blur callbacks are not covered. For the landing look: Enter and blur writes of `TextInput`, `NumberInput` and the Terminal text size box.
11. `Header.svelte` restyles `Search`'s input by the class `.search` (`.field :global(.search)`) and `tests/checks/tree/allow-styling.ts` has a `DELIBERATE` entry for it with its reason. With the selector and no entry `npx vitest run tests/checks/tree/boundaries.test.ts` failed (`+ "views/system/workbench/settings/Header.svelte styles .search of ui/controls/text/Search.svelte through .field :global(.search)"`); with the entry it passes (11 passed).
12. The reveal effect in `Settings.svelte`: `showRail(area, hidden)` clears the query when it hides the rail row, `await tick()`, scrolls the row into view, then restates the instance without the ask; the effect reads `railHidden` and `query` untracked so the cleared query does not run it again. Not tested (no effect runs in the string render): for the landing look.
13. No gear on a row whose menu is empty: `Item.svelte` draws the gear only when `canReset || canCopy`. A "This browser" row has no Copy Setting ID, since it has no setting ID in a file, so its menu is Reset Setting alone and exists once the row is Modified. View test "draws no gear on a row whose menu is empty, and one once the row is Modified", first run `AssertionError: theme: expected '<div class="item svelte-82eo79" data-...' not to contain 'More actions'`, M21.
14. `Settings.svelte` keeps `<Pane ... tinted>` and has no `:global(body.wall) .view` rule. View test "is a tinted pane, as every view drawn over the wallpaper is", first run `AssertionError: expected '<!--[--><section class="pane svelte-b...' to match /<section class="[^"]*\btinted\b/`, M23. Consequence in R1-B. The edge-to-edge question is for the landing look.
15. Under a non-empty query a group with no row is dropped (`search.ts`; head comment corrected); with an empty query it is kept. Tests in `search.test.ts` and in the view test "is left out once a query is typed, and drawn for an empty query", first runs `expected [ 'appearance.yml', 'behavior.yml' ] to deeply equal [ 'appearance.yml' ]` and `expected '<!--[--><section class="pane svelte-b...' not to contain 'behavior.yml could not be read: 404'`, M16.
16. The wallpaper row is listed under a theme with a wallpaper and whenever this browser holds a saved wallpaper choice (`thisBrowserRows`: `offersWallpaper || chosen.wallpaper !== null`). Tests in `rows.test.ts` and the view test, first runs `expected undefined to be true` and `expected '' to contain 'data-modified'`, M18.
17. `typed.ts`: `mapOf` answers `state` itself when `stateShape` (`z.looseObject({})`) accepts it, and `{}` otherwise, never a parsed copy. Test "hands on every key of the state it was given, the ones a schema would not copy too" (a symbol key and an own `__proto__` key), first run `AssertionError: expected [] to deeply equal [ Symbol(kept) ]`, M19. With the earlier `z.record(z.string(), z.unknown())` a state holding a symbol key was refused as a whole.
18. Schema names are lower camel: `stateShape`, `queryShape`, `typedShape`, `typedListShape`, `revealShape` in `typed.ts`; `toggleShape`, `choiceShape`, `numberShape`, `listShape`, `textShape` in `rows.ts` (`choiceShape`, `listShape` and `textShape` exported and read in `settings/Control.svelte` and `settings/said.ts`). No other schema is in the diff. `grep -rhoE "const [A-Z][A-Za-z]*Shape =" src/lib | wc -l` prints 0.
19. The pointer to the open items names the state file's section by its heading, "Open items", above.

## Mutations on a scratch copy

Each mutation is one line, made on a copy of the worktree at `$TMPDIR/s3c-scratch` (the worktree untouched), and the suite that covers it run; the failing tests are quoted. Rows M1 to M6 are the earlier view mutations, each failing at least one view test (M4 fails "draws the description of a toggle as its label, with no backtick left").

| Mutation | Failing tests |
|---|---|
| M7 `write.ts`: `decimalOf` without the DECIMAL test | "the terminal text size box > refuses what is not a decimal with the message a number row gives"; "the value a control text makes > writes nothing for text that is not a decimal number, and says so" |
| M8 `write.ts`: `commit` choice accepts any word | "the value a control text makes > writes nothing for the empty choice or a word the choice does not hold"; "the write of a row > writes nothing for the empty choice" |
| M9 `write.ts`: superseded-write guard `sequence.get(key) !== turn` removed | "the write of a row > lets the answer of the later write stand when the earlier answers after it" |
| M10 `write.ts`: closed-view guard `stopped()` removed | "the write of a row > changes nothing for an answer that arrives after the view is closed" |
| M11 `search.ts`: `@id:` matches every path | "@id: > keeps the rows whose key path holds the text, whatever its case"; "@id: > looks at the key path alone, not at the description"; "what a result carries > counts the seven This browser rows when no config file is described" |
| M12 `search.ts`: `@modified` filter off | "@modified > combines with a word"; "@modified > keeps only the Modified rows, whatever the case of the word"; "what a result carries > counts the seven This browser rows when no config file is described" |
| M13 `rows.ts`: Modified always false | "the rows of one file > compares a list item by item"; "... keeps a value its control cannot show as the file has it, flagged and Modified"; "... marks a value that differs from the default as Modified" |
| M14 `rows.ts`: `localRows` drops its first row | "the rows of one file > makes the rows of local.yml from the catalog alone, with no value, line or state"; "the groups and the table of contents > orders the sections of a file by the first row each holds, with the file in every id" |
| M15 `search.ts`: the count adds nothing | "the words of a search > keeps every row for an empty query and for spaces alone"; "... keeps the rows holding the word in title, key path, section or description"; "what a result carries > counts the seven This browser rows when no config file is described"; "what a result carries > keeps a row it was told to keep whatever the query" |
| M16 `search.ts`: a group with no row kept under a query | "what a result carries > drops a group that holds no row once a query is typed, and keeps it for an empty one" |
| M17 `groups.ts`: a press toggles a group with no section | "a press on a group of the table of contents > leaves a group with no section as it is, since it has nothing to close" |
| M18 `browser.ts`: wallpaper row by theme alone | "the This browser rows > lists the wallpaper row under a theme without one while a wallpaper choice is saved" |
| M19 `typed.ts`: `mapOf` answers a copy | "what the tab keeps > hands on every key of the state it was given, the ones a schema would not copy too" |
| M20 `browser.ts`: an empty box is not given back to the config | "the terminal text size box > gives the size back to the config for an empty box" |
| M21 `Item.svelte`: gear always drawn | "the This browser rows > draws no gear on a row whose menu is empty, and one once the row is Modified"; "the machine-local rows > draws the description and key path of a local.yml key and nothing to set" |
| M22 `browser.ts`: theme row's control `toggle` | "the This browser rows > names on each row the control it draws, and no other word" |
| M23 `Settings.svelte`: `tinted` removed | "the pane the view is drawn in > is a tinted pane, as every view drawn over the wallpaper is" |

## The first run, restated

The first run of the step (`first-run.txt`) was of the earlier form of the tests, six files before the state suites were split into `tests/state/system/settings/`: `Test Files  5 failed | 1 passed (6)`, `Tests  23 failed | 22 passed (45)`. It covers the view cases 28 to 37 one test at a time (19 of the 23 failures are `settings.test.ts` cases) and cases 1 to 27 only as whole-file load failures, `tests/state/system/settings-rows.test.ts`, `settings-search.test.ts`, `settings-write.test.ts` and `number-input.test.ts` failing with the module missing; the 22 passing were behaviour the unchanged tree already had. Cases 1 to 27 are held to a failing test one at a time by M7 to M20 and the earlier mutations, not by that run. The first run of this round's new and changed tests in their final form (`npx vitest run tests/state/system/settings tests/views/system/workbench/settings.test.ts` on the tree before the round's code changes): `Tests  15 failed | 109 passed (124)`, the 15 being the tests named in rulings 1, 2, 5, 13 to 17 above.

## Zod schemas (module level, each `satisfies z.ZodType<...>`, no error text read or shown)

`typed.ts`: `stateShape`, `queryShape`, `typedShape`, `typedListShape`, `revealShape`. `rows.ts`: `toggleShape`, `choiceShape`, `numberShape`, `listShape`, `textShape`. `isMap` from `data/helpers/guards.ts` stays for the bare map test in `catalogOf`.

## Client chunk size

Before (`chunks-before.txt`, the build of the unchanged tree): page node `nodes/2.Ce-Cjbzy.js` 1,940,418 bytes; largest chunk `chunks/I7Dj73QH.js` 2,737,063 bytes. After (`find .svelte-kit/output/client/_app/immutable -name '*.js' -not -path '*workers*' -exec wc -c {} +` on the build `checks.sh` ran): page node `nodes/2.9hsukS0u.js` 2,159,674 bytes; largest chunk `chunks/I7Dj73QH.js` 2,737,063 bytes, unchanged. The page node grew by 219,256 bytes in all. By `grep -l` it holds `yaml` (`YAMLParseError`, found in `nodes/2` alone), `lodash-es`'s `isEqual` (`[object Arguments]`, found in `nodes/2` alone), the new view code (`data-toc-target`) and the zod schemas of `typed.ts` and `rows.ts`; zod's library code is also in the shared chunk `chunks/C7Jv4Oi_.js`. How many of the 219,256 bytes belong to each part was not measured.

## Files and line counts (`wc -l`)

State, `src/lib/state/system/config/`: browser.ts 194, config-files.ts 56, groups.ts 159, messages.ts 37, rows.ts 262, search.ts 85, typed.ts 103, write.ts 160. View: Settings.svelte 220, RailEditor.svelte and PagesReset.svelte (headings removed), and in `settings/` BrowserControl 200, Contents 98, Control 140, EditLink 24, Gear 43, Header 95, Item 296, List 92, said.ts 40, writer.svelte.ts 23 (10 items, the folder limit). Ui: NumberInput.svelte, TextInput.svelte, TextArea.svelte 165, DateInput.svelte 73. Tests: settings/browser.test.ts 35, fixture.ts 21, rows.test.ts 541, search.test.ts 243, write.test.ts 408, views settings.test.ts 762. `Appearance.svelte` is deleted.

## Paths written outside the brief's list, with the reason

- `src/lib/state/client/context.ts`: registers the unsaved-draft check for a Settings tab holding drafts.
- `src/lib/state/workbench/ui.svelte.ts`: `chosen()`, `initial()`, and `setWallpaper(null)` and `setCodeTheme(null)` in the types, so Reset returns a per-browser value to what the theme or config says.
- `src/lib/ui/controls/text/Search.svelte`, `text-menu.ts`, `src/lib/ui/forms/TextArea.svelte`, `DateInput.svelte`: `typedInto`, one copy of the four lines (ruling 3).
- `src/lib/views/system/config/files.ts`, `Config.svelte`, `tests/state/system/config-files.test.ts`, `tests/checks/source/keys.test.ts`: the import path of `config-files.ts`, which moved into `state/system/config/`.
- `tests/checks/tree/boundaries.test.ts` and the `DESIGN.md:171` row: state may import `data/sources/config/options`.
- `tests/checks/tree/allow-styling.ts` (ruling 11) and `tests/ui/theme/wall.test.ts` (R1-B).
- `tests/views/whole/type-scale.test.ts`: the new view's sizes.
- `config/text/views/system/workbench.yml`: the new words; `docs/diagrams/*`: regenerated.

## Judgment calls

- Reset Setting is offered for toggle, number, text and choice rows only: the server's `writeConfigKey` refuses lists and families.
- While the reveal ask is set, the search keeps the rail row whatever the query (`searchGroups(..., keep=[RAIL_ROW])`).
- A press on a Contents group toggles it (ruling 5); the section rows scroll only.
- A refused Terminal text size text stays in the box with the message under it until Enter or blur applies a decimal or Escape drops it.

## VS Code 1.137.0 against the brief

Read in `/Applications/Visual Studio Code.app/Contents/Resources/app/out/vs/workbench/workbench.desktop.main.js` (window searches, never the whole file), its `workbench.desktop.main.css` and `out/nls.messages.json`. The installed version is `"version": "1.137.0"` in `app/package.json`.

- Count words: `d(18703,null` is "{0} Settings Found", `d(18706` "No Settings Found", `d(18708` "1 Setting Found" (`nls.messages.json` 18703, 18706, 18708); the count is chosen by the number of unique results. Same as the brief.
- Clear and filter: `d(18699,null)` "Clear Settings Search Input" is the clear action (`clearSearchResults`), `d(18701,null)` "Filter Settings" the filter button. Its menu (`getActions`) starts with `createToggleAction("modifiedSettingsSearch", d(18827,null) "Modified", ..., "@modified")`, which puts or takes `@modified` out of the search value, then offers further filters (extension settings, features, tags). Oculus offers Modified only: a difference outside the brief, not built.
- Down in the search: `this._register(q(a,oe.KEY_DOWN,l=>{new Jt(l).keyCode===18&&this.focusSettings()}))` and `focusSettings(e=!1){if(this.settingsTree.getFocus().length||this.settingsTree.focusFirst(),...}`: Down focuses the first setting. Same as the brief.
- Contents press: the tree is built with `collapseByDefault:!0` and `hideTwistiesOfChildlessElements:!0`, and the tree's pointer handler (`expandOnlyOnTwistieClick` read from `workbench.tree.expandMode`, which is `doubleClick` only when set so, else false) runs `this.tree.setFocus([c]),this.tree.toggleCollapsed(c,l)` for a collapsible row, so a press on a group toggles it (open closes, closed opens). Built as ruling 5 says. A difference outside the brief, not built: the focus change sets `viewState.categoryFilter` and redraws the list filtered to that category (`this.renderTree(void 0,!0),this.settingsTree.scrollTop=0`), where oculus scrolls the whole list to the heading. The contents also start collapsed (`collapseByDefault`) where oculus's start open.
- Contents follows the scroll: `this.settingsTree.onDidScroll(...updateTreeScrollSync())` exists. Same as the brief. Hidden when narrow: `static{this.NARROW_TOTAL_WIDTH=this.TOC_RESET_WIDTH+this.EDITOR_MIN_WIDTH}` with 200 and 500 and `a=this.bodyContainer.clientWidth>=cu.NARROW_TOTAL_WIDTH`, so under 700 px. Same as the brief.
- Gear: `renderSettingToolbar` builds a toolbar titled "More Actions..." (`d(18855`); the setting actions are `settings.resetSetting` "Reset Setting" (`d(18849`, fires a change with `value: void 0`) and `settings.copySettingId` "Copy Setting ID" (`d(18842`, `clipboardService.writeText(e.setting.key)`), then two further actions (`dle` and `ule` in the source, not read further). Oculus offers the first two. The css `.settings-tree-container .setting-toolbar-container{position:absolute;left:-22px;top:8px;...}` puts it at the left of the item where oculus puts it on the right of the title; a difference outside the brief, not built. VS Code's menu lists Reset Setting for every setting row (whether it is disabled on an unmodified one was not read); oculus offers it on a Modified row with a single value (the server refuses the others).
- Modified bar: `.setting-item-contents.is-configured .setting-item-modified-indicator{display:block;...width:6px;border-left-width:2px;border-left-style:solid;left:5px;top:15px;bottom:18px}`. Same as the brief.
- Default line: VS Code has no "Default: <value>" line (the strings found are "Default value changed" and ". Default value provided by `{0}`"); the line is the brief's.
- No result: the css `.settings-editor.no-results>.settings-body .settings-toc-container,...settings-tree-container{display:none}` hides the contents and the list and shows a message; oculus keeps the contents and list and draws no group. A difference outside the brief, not built.
- Boolean setting: the class `setting-item-bool` is in the css; that its label is the description was not verified.
- Escape in a field reverting its text, and the number box's `inputmode`: no string searched found them; they are the brief's own and were not checked against VS Code.

## For the landing look

Press and keys in the contents (a group toggling and scrolling), the gear on hover and focus, Down and Escape, Enter and blur in the Terminal text size box, a refused text staying in the box with its message, the reveal from the rail's Settings choice with a query that hides the rail row, and the pane and the item hover over a wallpaper theme (R1-B).
