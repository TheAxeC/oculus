# Brief: S3c, the Settings view as VS Code's Settings editor over the options catalog

Read `tools/oculus/.scratch/migration/agents/spec.md` first; its rules govern this step unchanged. The configuration lists no other standards page. No ADR folder exists (`ls docs/adr` and `ls tools/oculus/docs/adr` print "No such file or directory"; `find . -type d -name adr -not -path '*/node_modules/*'` prints nothing; the configuration block has no `adr:` key), so no ADR touches this step.

A design ruling decides what is built. It never exempts the code: every line is written to the standards pages, so that people can read, use and maintain it.

## The step's line and its rulings

- `plan.md`: "S3c the Settings view as VS Code's Settings editor over the catalog, with search, `@modified`, each option's description, default, value, file and line and its control, the per-browser values as "This browser", D30's four `terminal:` keys (Q109) among them; after S3a and S3b; in full in `agents/briefs/S3c.md` (ruling Z75) (ruling Z94)". This file is that full text.
- Z75 (a), Axel: the Settings view becomes VS Code's Settings editor over every option of every config file, with search, a Modified filter, each option's description, default, current value, file and line and its control, the descriptions written once in a catalog under `config/catalogs/`, `local.yml`'s keys listed without their values, HELP.md pointing to it.
- Z94, Axel: (1) (c) one option is a key path, a family of records one option; (2) (a) one `config/catalogs/options.yml`; (3) (a) the catalog holds the default, and Modified is a value in the file that differs from it; (4) (b) every `toggle`, `number`, `text` and `choice` option writes its key through the confirmed write kind `config-key`, refused for `local.yml`, recorded in History and undoable; a `list` or a family opens its file at its line.
- Z118, automode, in force: (3) (a) the Modified filter is `@modified` typed in the search box, with a filter button offering it; (4) (a) the per-browser appearance values stay in the editor as a group "This browser", and `RailEditor` and `PagesReset` are the controls of the `rail` and `arrangements` rows.
- Z149, automode, in force (this brief's check): (1) (a) `RailEditor` and `PagesReset` drawn as a row's control leave out their own heading, since the row's title and the catalog's description and `fields` stand in its place; their sentence about what a row is stays; (2) (a) a "This browser" row is Modified when this browser holds a value of its own for it, and Reset Setting forgets that value so the default applies, the ui store taking `null` for the wallpaper and the code theme as it already does for the text size and the terminal font; (3) (a) the terminal text size, which the ui store keeps per browser beside the other six, is a "This browser" row.
- spec.md:77: "A view brought to VS Code's is judged on its look and behaviour as well as its features, measured against VS Code's own stylesheet and layout and compared side by side on TEST. Where oculus does something VS Code does not, or does it better, that is kept: the brief lists each such thing before the build, and a build that removes one is not landed." The list is under "Kept, oculus's own" below.

## What is on the tree (read on main at bda79291)

- The catalog: `config/catalogs/options.yml`, one top-level key `options:`, file name to dotted key path to entry. 128 entries: appearance.yml 18 (1 family, 6 number, 4 toggle, 3 choice, 4 text), behavior.yml 44 (3 family, 5 list, 28 number, 4 text, 4 toggle), layout.yml 17 (7 family, 4 text, 2 list, 4 choice), present.yml 19 (12 text, 7 family), sources.yml 14 (3 family, 11 text), local.yml 16 (description only). Counted with `python3` and `yaml.safe_load` over the file. 48 sections, 20 carrying `section:` and 28 the raw first segment of the key path.
- D30's four keys are in it (`grep -n "terminal\." config/catalogs/options.yml` prints lines 20, 24, 28, 32, 37): `terminal.mac_option_is_meta`, `terminal.copy_on_selection`, `terminal.cursor_blinking` (`toggle`), `terminal.cursor_style` (`choice`, `[block, line, underline]`), beside `terminal.font_px` (`number`).
- The reader: `src/lib/data/sources/config/options.ts` (82 lines) exports `CONTROLS`, `Control`, `CatalogEntry`, `Catalog`, `catalogOf(config)` and `optionPaths(file, entries)`. `section` is the heading an option is shown under, and the first segment of its key path when absent (`options.ts:28-30`). The catalog rides in the merged config the client holds (the `config` channel).
- The boundary: `state/` may import only the modules of DESIGN.md:171's row and `tests/checks/tree/boundaries.test.ts:117-141` (explained in its comment at `:25-72`); `data/sources/config/options` is not among them. `data/sources/config/rail` is (`state/workbench/navigation/rail.ts:15`), the precedent. A view may import `state/**` and `ui/**`, not `data/**` (`boundaries.test.ts:166-170`).
- The write: `writeConfigKey(file, key, value)` of the client writes store (`state/client/writes.svelte.ts:329`), declared in `state/shared/stores/shapes.ts:169`. Its answer (`server/edit/writes.ts:541-558`): a refusal is `{ ok: true, changed: [], refused: [{ field: '<file>:<key>', reason }] }` with HTTP 200; a write that changed nothing has both lists empty; a request that failed is `ok: false` with `error` (`unwritable`, an HTTP status), `network: true` for a lost connection, and the write timeout. The writer refuses a key absent from the file and a null, empty, alias, anchored, tagged or block-scalar node as `not_in_file` (`config-key.ts:122-137`, `:310-311`), a value outside a `choice`'s `values` as `misfit` (`:187-188`), and a value a config reader refuses (`READERS`, `:78-89`).
- The view today: `src/lib/views/system/workbench/Settings.svelte` (49 lines) draws `Appearance` (170), `RailEditor` (287) and `PagesReset` (112) in a `Pane`. `Appearance.svelte` draws six per-browser values of the ui store (`state/workbench/ui.svelte.ts`): theme (string), code theme (string or null), text scale (number or null), CRT (boolean), wallpaper (boolean or null, null meaning the theme's answer) and icons (boolean). The store keeps a seventh, the terminal font (number or null, `setTerminalFont`, drawn by `views/sessions/terminal/TerminalFontTools.svelte`). Its setters: `setTheme(name)`, `setCrt(on)`, `setWallpaper(on: boolean)`, `setIcons(on)`, `setTextScale(scale | null)`, `stepTextScale(by)`, `setTerminalFont(size | null)`, `setCodeTheme(id)` (`ui.svelte.ts:116-128`).
- `RailEditor.svelte`: its draft is the tab's instance state (`:14-16`), merged into the blob by `withRailDraft` (`rail.ts`); the rail's Settings choice opens the view with `reveal: 'rail'` (`ActivityRail.svelte:168`) and the effect at `RailEditor.svelte:77-81` scrolls the list into view and takes the ask out. `state/client/context.ts:285-290` registers `railTyped(...)`, so a Settings tab holding a rail draft is a tab with unsaved text and closing it asks. Its heading and sentence: `RailEditor.svelte:141-142` (words `workbench.rail_title`, `rail_about`), `PagesReset.svelte:63` (`reset_title`).
- File texts: `fileText(ENGINE_ROOT, name)` (`state/sources/fs.svelte.ts:395`) answers a `FileText` `{ text, truncated, error, loading }`, a lazy read per path enabled only in a browser (`inBrowser()`), `NO_TEXT` (`loading: true`) otherwise (`fs-transport.ts:115`); a text over `TEXT_LIMIT` (2 MiB, `fs.ts:81`) is cut with `truncated: true`. The Config view hands the store the config channel's version, `refresh(ENGINE_ROOT, pushed)` (`views/system/config/Config.svelte:76-78`), which marks the root's texts stale. Nothing reads a file the view does not ask for.
- `yaml` ^2.9.0 is a dependency, imported today only under `src/lib/server` and `src/lib/data`; `LineCounter` is used for line numbers in `data/sources/config/agents.ts:80`, which answers line 1 for a node with no range (`:81-86`).
- The primitives and their props: `ui/forms/Checkbox.svelte` (`checked, label, onchange`, the label plain text); `ui/forms/TextInput.svelte` (`value, label, oninput, readonly, placeholder, secret`, no Enter or blur callback, `type` `text` or `password` at `:39`); `ui/forms/choice/Select.svelte` (`value, label, empty, choices, onchange`, an empty first choice always drawn, a value outside `choices` drawn as a stray option, `:2-4`, `:34-41`); `ui/controls/text/Search.svelte` (`value, placeholder, oninput, onenter, field`, Escape built in at `:42-48`, no clear control, a field-supplied `onkeydown` overridden); `ui/menu/Menu.svelte` (`label, items, onpick, glyph, compact, placement, align, bare, inherit`, items with `active`, `disabled`, `glyph`, `title`, `rule`); `ui/tree/TreeView.svelte` (`label, rows, current, onfocusrow, ontoggle`, children snippet); `ui/controls/ToolButton.svelte`; `ui/display/CodeText.svelte` (`text`). No number input exists.
- Page keys: `shell/keys/workbench-keys.svelte.ts:418-425` `typingIn` skips the page's single keys while an `input`, `textarea`, `select`, content-editable element or Monaco has focus; Escape still restores a maximised pane (`:~131`).
- Folder sizes against the ten-item rule (`utils/folder-check.sh`, run by `tests/checks/tree/size.test.ts`), counted with `git ls-files <dir> | sed "s|^<dir>/||" | cut -d/ -f1 | sort -u | wc -l`: `src/lib/state/system` 10 (full), `src/lib/views/system/workbench` 8, `src/lib/ui/forms` 9, `tests/views/system/workbench` 5, `tests/state/system` 7, `tests/ui/forms` 4.
- `config-files.ts` importers: `views/system/config/Config.svelte:45`, `views/system/config/files.ts:6` (its comment at `:2` names the module), `tests/state/system/config-files.test.ts:10`, `tests/checks/source/keys.test.ts:20`. Moving it under `state/system/config/` keeps it in the `state/system` folder of `tests/checks/imports/order.ts` (`folderOf`, `:73-77`).
- Tests that draw the view: `tests/views/system/workbench/settings.test.ts` renders `Settings` with `svelte/server` over `workbench-fixture.ts`, where no effect runs and the real fs store answers `NO_TEXT`; `tests/views/system/config.test.ts:79-90` doubles `fs` (`entries`, `fileText`, `refresh`) to draw file texts. `tests/views/whole/type-scale.test.ts:93-99` lists each workbench `.svelte`, `:336` requires every view `.svelte` listed, and `:296-307` with `:350-356` list every `ui/forms` component. `tests/checks/source/keys.test.ts:309-319` fails on a catalog word with no reader: thirteen words have `Appearance.svelte` as their only reader (`ui.theme`, `ui.theme_glyph`, `ui.code_theme`, `ui.crt_on`, `ui.crt_title`, `ui.wallpaper`, `ui.wallpaper_title`, `ui.icons`, `ui.icons_title` in `config/text/ui.yml`; `app.text`, `app.text_smaller`, `app.text_reset`, `app.text_larger` in `config/text/app.yml`), and `workbench.settings_appearance` too.
- Sentences the step makes false or ambiguous: `HELP.md:145` (the `settings` row); the paragraph under `HELP.md:214` "## The configuration", which does not point to the Settings view (Z75); `config/appearance.yml:62` and `:69` and `config/catalogs/options.yml:84` and `:89` (the CRT toggle and the Code theme menu "write the viewer's own choice", no longer saying which of two rows); `DESIGN.md:85` (the same of the Code theme menu and the CRT toggle); the head comment of `Settings.svelte`; `settings.test.ts:113`.
- VS Code: 1.137.0 is installed at `/Applications/Visual Studio Code.app`. The Settings editor's rules are `.scratch/migration/agents/reviews/U2-vscode.css:440-616`; its table of contents hides below `NARROW_TOTAL_WIDTH = TOC_RESET_WIDTH + EDITOR_MIN_WIDTH` = 200 + 500 = 700 px of the editor's width (`workbench.desktop.main.js`, `classList.toggle("narrow-width", e.width < NARROW_TOTAL_WIDTH)`; the class's rule is `U2-vscode.css:491`). U2's audit of today's view is `U2-audit.md:813-830`.

## Kept, oculus's own (spec.md:77)

1. The rail list edited row by row with label, icon and page on one line at a wide width, its draft kept in the tab's instance state across tab switches and reloads, and a tab holding a draft counted as holding unsaved text.
2. The rail's Settings choice opening the view on the rail row (`reveal: 'rail'`).
3. Reset all pages, which asks first (`PagesReset.svelte`).
4. The per-browser appearance values, saved by the ui store together.
5. Every write recorded in History and undoable, which VS Code's settings writes are not.
6. A text or number field writes on Enter or on losing focus, and its unsent text is the tab's instance state, counted as unsaved text, since each write is a History record.

## What to build

1. **The rows module**, pure TypeScript with no runes, in a new folder `src/lib/state/system/config/`, which also takes `config-files.ts` (moved, its four importers above updated, the comment at `files.ts:2` with them), so `state/system` stays at 10 items. It imports `catalogOf` and the types from `data/sources/config/options` (added to the state row of `DESIGN.md:171` and of `boundaries.test.ts:117-141` with a clause in its comment) and re-exports the types the view needs. It exports:
   - **The rows of one config file** from the file's catalog entries, in catalog order, and the file's `FileText`. While `loading`, the file's result is "loading" with no rows; with `error` it is "unreadable" with the error; with `truncated` it is "cut" with no rows; a text that fails to parse (a duplicate key included) is "unparsed" with the parser's first message. Otherwise each row holds: the file, the key path, the section, the title, the description, the control, `values`, a family's `fields`, the default, the value the file holds, the line of the key's own name (1-based, `undefined` when the node has no range, never line 1 by default), and its state: `set`, `missing` (the key is absent, or its node is null, empty, an alias, anchored, tagged or a block scalar, every case the writer refuses), and `modified`.
   - **Walking a key path** through own keys only, so a segment `__proto__` or `constructor` reads the file's own key or nothing.
   - **Modified**: a `set` value differs from the catalog's `default` by deep equality (a list item by item). A family and a `local.yml` row are never Modified; a `missing` row is not Modified.
   - **A value the control cannot show**: a `toggle` value that is not a boolean, a `number` that is not a finite number (a number written as a YAML string `"20"` included), a `choice` value outside `values`; the row carries a `mismatch` flag the view words.
   - **The title**: segments with `_` read as a space and the first letter capitalised; the segments before the last joined by ` > `, then `: `, then the last; a one-segment key is its name alone. **The section heading** of an option without `section:` is its first segment in the same form; with `section:` it is that text.
   - **The `local.yml` rows** from the catalog alone, with no value, no line and no state. The module takes no text for `local.yml`.
   - **The "This browser" rows** from the ui store's seven values (theme, code theme, text size, terminal text size, CRT, wallpaper, icons): title and description from the words file, the value, and Modified when this browser holds its own value (Z149 (2)): a non-null code theme, wallpaper, text scale or terminal font; a theme, CRT or icons value that differs from what a browser with no saved value gets (the store's initial value given the config, read from `ui.svelte.ts`).
   - **No catalog**: a merged config with no catalog (`catalogOf` answers `{}`) or no config yet gives no file group; "This browser" is still drawn.
   - **Messages**: every message the module answers (loading, unreadable, cut, unparsed, missing, mismatch, not a number, refused, failed) is a words key of `config/text/views/system/workbench.yml` with the values it fills in, which the view words; the module holds no sentence.
   - **The groups and the table of contents**: "This browser" first, then `appearance.yml`, `behavior.yml`, `layout.yml`, `present.yml`, `sources.yml`, `local.yml`, and inside each the sections in the order their first row appears in the catalog. A table-of-contents id is the file and the section (`behavior.yml#notes` and `local.yml#notes` are two).
   - **The search**: the query split on white space. `@modified` in any case keeps only Modified rows; `@id:<text>` keeps the rows whose key path contains `<text>`, case-insensitive, and `@id:` with nothing after it keeps every row; every other word, an unknown `@word` included, must occur, case-insensitive, in the row's title, key path, section or description. "This browser" rows take part. An empty query or spaces alone keeps every row. The result carries the count of rows kept and the groups and sections that still hold one.
   - **The write logic** of a row, plain functions the view calls and the tests drive with a recorded `writeConfigKey` double: `commit(row, text)` gives the value to write or the message why none (a number: the trimmed text must match `^-?(\d+\.?\d*|\.\d+)([eE][-+]?\d+)?$` and give a finite number, `-0` written as `0`, empty text writes nothing and says so; a text: the text; a toggle: the boolean; a choice: one of `values`, the empty choice writing nothing); no write when the value equals both the file's value and the last value sent for the key; a write sequence per key so the answer of an earlier write changes nothing a later write set; an answer read by its shape (refused: the reason; nothing changed: nothing; failed: the error, the network loss or the timeout, each worded); an answer that arrives after the view is closed changes nothing.
   - **The drafts**: a field's unsent text kept in the tab's instance state under its file and key, merged into the blob beside the rail draft and the query (never replacing it), and a `settingsTyped` that tells whether a tab holds one, registered in `state/client/context.ts` beside `railTyped`.
2. **The view**, `Settings.svelte` with its partials in a new folder `src/lib/views/system/workbench/settings/` (so `workbench` holds 9 items), drawn to VS Code's Settings editor as `U2-vscode.css:440-616` gives it:
   - It hands the fs store the config channel's version, `refresh(ENGINE_ROOT, pushed)`, as the Config view does, and asks `fileText` for the five tracked files only.
   - **The header**: the `Search` with the count on its right ("1 Setting Found", "N Settings Found", "No Settings Found"), a `ToolButton` that clears the search, and the filter button, a `Menu` offering Modified, which puts `@modified` in the search. Down in the search moves focus to the first item, caught on a wrapper element. The query is the tab's instance state, merged into the blob.
   - **The table of contents** on the left (`TreeView`): the groups and their sections; a press scrolls the list to that heading; `current` follows the heading at the top of the list as it scrolls; while a search is typed it lists only the groups and sections holding a row kept. It is drawn in the markup and hidden by a class when the view's own width (`bind:clientWidth`) is under 700 px.
   - **The list**: a group heading per file (600 weight, `css:564`) with a control opening the file in a source tab (`sourceTabState(ENGINE_ROOT, name)`), the `local.yml` heading with the Config view's tag saying it is this machine's own; a group whose file is loading, unreadable, cut or unparsed says so in one line and draws no rows; a section heading per section; one item per row: the modified bar on its left when Modified, the title, the description through `CodeText`, the control, a line with the default (`Default: <value>`, a list's item count, nothing for a family) and the file and line as a link that opens the source tab at the line (`sourceTabState(ENGINE_ROOT, name, line)`, without `line` when the row has none), and a message line for a refusal, a failure, a value the control cannot show or a field text that is not a number.
   - **The controls**, each a `ui/` primitive. `toggle`: a `Checkbox` whose label is the description's plain text (backticks dropped), drawn under the title as VS Code draws a boolean. `number`: a new `ui/forms/NumberInput.svelte` (the tenth item of `ui/forms`), a text input with `inputmode="decimal"`, its own `onenter` and `onblur` with the text. `text`: `TextInput`, which gains optional `onenter` and `onblur` callbacks with the text. `choice`: `Select` over `values`; a stray file value is drawn as Select's stray option with the mismatch message. A `list` or a family: the value summarised (the item count, the field names) and "Edit in <file>" opening the source tab at the line; a family's `fields` listed under its description. A `missing` row: no control, the sentence that the key is not set in the file, and "Edit in <file>". Escape in a field reverts its text to the file's value.
   - **The `rail` row** draws `RailEditor` and **the `arrangements` row** `PagesReset`, each without its own heading (Z149 (1)), working as today.
   - **The gear**, a `Menu` shown on the row's hover and focus-within, as VS Code's More Actions: Reset Setting (a config row: `writeConfigKey(file, key, default)`, offered only on a Modified row with a control; a "This browser" row: the store forgets the value), Copy Setting ID (the key path, through the clipboard function the text menu uses; a refused write says so on the message line).
   - **"This browser"**: one row per value of item 1, each with the control `Appearance.svelte` draws today (the theme `Menu`, the code theme menu, the text steps, the CRT and icons toggles, the wallpaper toggle only under a theme that has one) and the terminal text size as a `NumberInput` with the store's clamp. `Appearance.svelte` is removed or rewritten into these rows; its words are reused by them or removed from `ui.yml` and `app.yml` with no reader left behind. `ui.svelte.ts` gains what Reset needs: `setWallpaper(null)` and `setCodeTheme(null)` accepted, and the initial theme, CRT and icons values readable.
   - **`local.yml` rows**: title, description and key path; no value, control, gear, default line or Modified.
   - **Writes**: through item 1's write logic. While a write is in flight the control shows the value sent; the file's push redraws the value.
   - **`reveal: 'rail'`**: while the tab's state holds it, the rail row is drawn whatever the query (a derived rule a string render shows); the effect then clears the query when it hid the row, scrolls the row into view and takes the ask out.
   - **Markup the tests read**: an item carries `data-setting="<file>:<key>"` (`this-browser:<name>` for a "This browser" row), `data-control` (`toggle`, `number`, `text`, `choice`, `list`, `family`, `rail`, `arrangements`, `none`), `data-modified` when Modified and `data-missing` when missing; a group carries `data-settings-group="<file>"` or `this-browser`.
   - The page's single keys keep acting while a button, a tree row or the gear has focus, as in every other view; inside an input, a select or the search they are skipped (`typingIn`).
   - A `:global()` rule that restyles a primitive's class goes in `tests/checks/tree/allow-styling.ts` with its reason.
   - The filter menu marks Modified with the item's `active` while `@modified` is in the query.
   - Every user-visible word in `config/text/views/system/workbench.yml`.
3. **The sentences**: `HELP.md:145` describes the view as built; the paragraph under `HELP.md:214` says every option is described and set in the Settings view; `config/appearance.yml:62` and `:69`, `config/catalogs/options.yml:84` and `:89` and `DESIGN.md:85` say the "This browser" CRT and Code theme rows hold the viewer's own choice and the `crt.default` and `code_theme` rows the file's default; `Settings.svelte`'s head comment; the state row at `DESIGN.md:171`.
4. **The tests**: the rows module's test under `tests/state/system/`; `tests/views/system/workbench/settings.test.ts` and `workbench-fixture.ts` rewritten, the fixture doubling `fs` as `tests/views/system/config.test.ts:79-90` does with a file-name-to-`FileText` map and a record of every name asked; `tests/views/whole/type-scale.test.ts` lists each new `.svelte` and `NumberInput` in the `ui/forms` list; `tests/ui/forms/` tests for `NumberInput` and `TextInput`'s new callbacks (as markup, since no event runs there).

## Cases

The rows module (unit tests):
1. `behavior.yml` text `slurm:\n    poll_min: 20` with the catalog default 20: row `slurm.poll_min` value 20, line 2, `set`, not Modified, title `Slurm: Poll min`.
2. The same with `poll_min: 5`: Modified.
3. A list option equal to its default item by item: not Modified; one item changed: Modified.
4. A family (`appearance.yml` `themes`): never Modified; the row carries `fields`.
5. A key absent from the text, and the same key written `poll_min:` (null): `missing`, no line for the absent one, not Modified.
6. `slurm: [` and a text with a duplicate key: the file "unparsed" with the parser's message and no rows; other files unchanged.
7. `FileText` with `loading: true`, with `error: '404'`, with `truncated: true`: "loading", "unreadable", "cut", each with no rows.
8. `local.yml`: rows from the catalog with no value, line or state; the module has no parameter for its text.
9. `crt.default: "yes"`, `slurm.poll_min: "20"`, `terminal.cursor_style: bar`: kept as they are, `mismatch`, Modified.
10. A key in the text with no catalog entry: no row. A text holding `__proto__: 1` under a map: no row, nothing polluted.
11. Search `poll` over a fixture catalog: only rows holding `poll` in title, key path, section or description.
12. `@modified`, `@Modified`, `@MODIFIED`: only Modified rows; `@modified poll`: Modified rows holding `poll`.
13. `@id:CURSOR` and `@id:cursor`: the rows whose key path holds `cursor`; `@id:`: every row.
14. `@nonsense`: rows holding the text `@nonsense`, none in the shipped catalog.
15. `''` and `'   '`: every row.
16. The order: "This browser", then the six files as item 1 says, sections in catalog order; `behavior.yml#notes` and `local.yml#notes` are two table-of-contents ids.
17. The shipped catalog and the shipped texts of the five files: no row `missing`, `mismatch` or Modified, and the four D30 keys have rows with controls `toggle`, `toggle`, `toggle`, `choice`.
18. "This browser": a store with no saved values gives seven rows, none Modified; a saved code theme gives that row Modified; Reset of it leaves the store's value null.

The write logic (unit tests with a recorded `writeConfigKey`):
19. A number row: `commit('12')` writes 12 once; `'1x'`, `''` and `' '` write nothing and give the message; `'-0'` writes 0.
20. A value equal to the file's value and to the last value sent: no write.
21. A refused answer: the reason; a failed answer (`ok: false`, `unwritable`): its sentence; an answer with nothing changed: no message.
22. Two writes of one key, the first answered after the second: the row ends at the second's value and message.
23. An answer after the view is closed: nothing changes, nothing thrown.
24. Reset Setting on a Modified row: `writeConfigKey(file, key, default)`.
25. A choice row given the empty choice: no write.
26. A draft and a query written into a blob that holds a rail draft: all three are there after.
27. A merged config with no catalog: no file group, the seven "This browser" rows, the count over those seven.

The view (string render, the fixture doubling `fs`):
28. Each control's markup: `data-control` `toggle` with a checkbox, `number` with an input of `inputmode="decimal"`, `text` with a text input, `choice` with a select listing `values`, on the shipped rows of each kind.
29. A `list` row and a family row: the summary and "Edit in <file>", no input.
30. A `local.yml` row: description and key path, no value, input, gear or default line; the fixture records that `local.yml` was never asked of `fileText`.
31. A Modified row carries `data-modified` and the bar; an unmodified row does not.
32. A row's default line and its `file:line` link; a missing row's sentence and no control.
33. A group whose `FileText` is loading says so and draws no rows.
34. The `rail` row draws `RailEditor` and the `arrangements` row `PagesReset`, neither with its own heading.
35. "This browser" draws its seven rows, the wallpaper row only under a theme that has one.
36. State `{ reveal: 'rail', query: 'poll' }`: the rail row is drawn.
37. A query in the tab's state is drawn in the search.

The builder's first task, before any change, is the first run of every case above on the unchanged tree, with each case's result noted. A case of a code step becomes a test of the step, run on the unchanged tree first; no prototype script stands in for the test. Presses, focus, scrolling, the gear on hover, the table of contents following the scroll and its hiding under 700 px, the Escape and Down keys, and the effect of the reveal run in a browser only (`spec.md:56-57`) and are checked at the landing's look on TEST.

When the first run finds a case the brief's own rules get wrong, the builder stops there, before changing any code, and hands back the first run and that case, with the rule and the result it gives. The orchestrator rules on the case and resumes the builder with the ruling, and the final report carries it.

## Paths this step writes

- `tools/oculus/src/lib/state/system/config/` (new folder: the moved `config-files.ts` and the rows module)
- `tools/oculus/src/lib/state/system/config-files.ts` (moved)
- `tools/oculus/src/lib/state/client/context.ts` (the `settingsTyped` registration)
- `tools/oculus/src/lib/state/workbench/ui.svelte.ts` (the resets Z149 (2) needs)
- `tools/oculus/src/lib/views/system/config/Config.svelte` and `tools/oculus/src/lib/views/system/config/files.ts` (the import and its comment)
- `tools/oculus/src/lib/views/system/workbench/Settings.svelte`, `Appearance.svelte`, `RailEditor.svelte`, `PagesReset.svelte`
- `tools/oculus/src/lib/views/system/workbench/settings/` (new folder)
- `tools/oculus/src/lib/ui/forms/NumberInput.svelte` and `tools/oculus/src/lib/ui/forms/TextInput.svelte`
- `tools/oculus/config/text/views/system/workbench.yml`, `tools/oculus/config/text/ui.yml`, `tools/oculus/config/text/app.yml`
- `tools/oculus/config/appearance.yml` lines 62 and 69
- `tools/oculus/config/catalogs/options.yml` lines 84 and 89
- `tools/oculus/HELP.md` lines 145 and 216
- `tools/oculus/DESIGN.md` lines 85 and 171
- `tools/oculus/tests/checks/tree/boundaries.test.ts`
- `tools/oculus/tests/checks/source/keys.test.ts` line 20 (the import)
- `tools/oculus/tests/state/system/config-files.test.ts` and the rows module's test in that folder
- `tools/oculus/tests/views/system/workbench/settings.test.ts` and `workbench-fixture.ts`
- `tools/oculus/tests/views/whole/type-scale.test.ts`
- `tools/oculus/tests/checks/tree/allow-styling.ts` (a `:global()` rule over a primitive, when one is needed)
- `tools/oculus/tests/ui/forms/` (the number input's and the text input's tests)
- `tools/oculus/docs/diagrams/` (regenerated by `npm run diagrams`)
- `tools/oculus/.scratch/migration/agents/reviews/S3c-report.md`

## Decisions taken in this brief (each reversible, none silent)

1. The rows module and `config-files.ts` live in `state/system/config/`, since `state/system` holds ten items.
2. The editor's partials live in `views/system/workbench/settings/`.
3. The client reads each tracked file's text through the fs store and parses it with `yaml` for the value and the line (the first client import of `yaml`), so the config channel's wire shape does not change and the value and its line come from one parse.
4. The title form, ASCII ` > ` in place of VS Code's chevron. Five keys of the tree: `slurm.poll_min` gives `Slurm: Poll min`; `terminal.font_px` gives `Terminal: Font px`; `wallpaper.dim` gives `Wallpaper: Dim`; `changes.keep` gives `Changes: Keep`; `rail` gives `Rail`.
5. A text or number field writes on Enter or on losing focus, its unsent text kept as instance state (Kept, item 6).
6. The search is word containment with `@modified` and `@id:` as VS Code's; VS Code's other filters (`@ext:`, `@lang:`, `@tag:`, `@feature:`, `@policy`) have no oculus counterpart and are text.
7. VS Code features with no oculus counterpart, left out: the User, Workspace and Folder scope tabs (oculus groups by file), Settings Sync and its ignore action, language overrides, policy-managed settings, the experimental and preview tags, extension groups, "Apply to all profiles", and Copy Setting as JSON (the files are YAML; Copy Setting ID stays).
8. The table of contents hides under 700 px of the view's width, VS Code's `NARROW_TOTAL_WIDTH`.
9. A number field's text is a decimal number by the pattern of item 1; `0x10`, `Infinity` and `1,5` are refused with the message.

## Libraries checked

`npm search` for "svelte settings editor" and "json schema settings form svelte 5" lists no package that draws a settings editor for Svelte 5 (the hits are Svelte's own tooling and JSON Schema validators). The step uses `yaml`, already a dependency. No new dependency.

The builder adds no dependency this brief does not name. A library the builder finds that would cover its work is reported, not installed.

## Read, with sections or line ranges

1. `tools/oculus/.scratch/migration/agents/spec.md` whole.
2. `src/lib/data/sources/config/options.ts` whole, `config/catalogs/options.yml` lines 1-12 and a sample of each file's entries.
3. `src/lib/views/system/workbench/Settings.svelte`, `Appearance.svelte`, `RailEditor.svelte`, `PagesReset.svelte` whole, and `src/lib/state/workbench/navigation/rail.ts`: what is kept.
4. `src/lib/views/system/config/Config.svelte` whole and `tests/views/system/config.test.ts:60-100`: the file reads, the refresh and the fs double.
5. `src/lib/state/client/writes.svelte.ts:300-340`, `src/lib/server/edit/writes.ts:520-560` and `src/lib/server/edit/writes/config-key.ts` whole: what the write answers and refuses.
6. `src/lib/state/workbench/ui.svelte.ts` whole and `src/lib/state/client/context.ts:270-295`.
7. `.scratch/migration/agents/reviews/U2-vscode.css:440-616` and `U2-audit.md:813-830`: the measures the view is drawn to.
8. VS Code 1.137.0 as installed: its Settings editor for every behaviour item 2 names; where it differs from this brief, report it.
9. `tests/views/system/workbench/settings.test.ts`, `workbench-fixture.ts`, `tests/views/whole/type-scale.test.ts:80-110,290-360`, `tests/checks/tree/boundaries.test.ts:20-175`, `tests/checks/source/keys.test.ts:300-325`.

## Verify before you report

Run from `tools/oculus` in the worktree, each must hold:

1. `PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH npm run diagrams`, then the plan's verify list through `sh ~/.claude/skills/land/templates/checks.sh .scratch/migration/orchestrator-state.md` from `tools/oculus`, which prints `checks: 7 commands passed`; the lines it prints are what the report quotes.
2. `npm run test:checks` passes, the folder size and the duplication checks among it.
3. Each new or changed test of a behaviour the change adds fails on the unchanged tree in its final form, and the report quotes that failure; each test of a behaviour the change keeps (the rail editor, the per-browser values, the reveal) passes after the change and on the unchanged tree where it can run there. A test that would still pass with its behaviour taken out is named as an audit.

## Report

Write it to `tools/oculus/.scratch/migration/agents/reviews/S3c-report.md`. First line: anything NOT done, or "Everything in the brief is done". Then the open items of the state file, verbatim. Then the cases' first run. Then the DONE / NOT DONE table with the checks above and their output verbatim. Then files with line counts, the size of the client build's largest chunk before and after (the first client import of `yaml`), every judgment call the brief left open, every user-visible change with its before and after, the VS Code behaviours of item 2 checked against the installed app with what was seen, and anything in the brief that was wrong or impossible, with the evidence.
