# Step S3c brief check (on main at aadfcd72)

Read-only. `git log -1 --format=%h` prints `aadfcd72`. `git status --short` prints `?? ../../shikijs-types-4.4.3.tgz` and `?? .scratch/migration/agents/briefs/S3c.md`, so the brief read is the on-disk copy. `config/local.yml` was not opened, every grep over `config/` used `--exclude=local.yml`, no port was contacted, no calendar address was fetched, no `.vscode` folder was read. The plan has no Goal heading; the goal here is Z75 read through the part of DESIGN.md this step delivers. I read VS Code 1.137.0's own `workbench.desktop.main.js` under `/Applications/Visual Studio Code.app` for one constant (check 8).

## 1. Names

Command for all: `grep -rn --exclude=local.yml --exclude-dir=node_modules --exclude-dir=.scratch -e <name> src tests config HELP.md DESIGN.md README.md utils docs`.

1. `config-files` (moved): hits are `src/lib/views/system/config/Config.svelte:45` (in the paths), `tests/state/system/config-files.test.ts:10` (in the paths), and two outside them that the move breaks:
   - `src/lib/views/system/config/files.ts:6` `import { CONFIG_SUFFIX } from '$lib/state/system/config-files'` stops resolving; its comment at `:2` ("state/system/config-files.ts's") goes false. The file is not in "Paths this step writes" (the `src/lib/state/` line covers only state modules).
   - `tests/checks/source/keys.test.ts:20` `import { CATALOGS, LOCAL_NAME } from '../../../src/lib/state/system/config-files.ts'` stops resolving, which turns the whole key gate red. Not in the paths.
2. `Settings.svelte`, `Appearance.svelte`: hits `tests/views/whole/type-scale.test.ts:93,99` (in the paths), `tests/views/system/workbench/settings.test.ts:13,113` (in the paths; `:113` is a comment naming Appearance.svelte that goes false), `Settings.svelte:22`. No other hit.
3. `NumberInput`: no hit anywhere. `find src/lib/ui -name "Number*"` prints nothing.
4. Words keys. `workbench.settings_appearance` (`config/text/views/system/workbench.yml:60`) has one reader, `Appearance.svelte:63`. Thirteen more keys have `Appearance.svelte` as their only reader (`grep -rn -F "'<key>'" src | grep -v workbench/Appearance.svelte` prints 0 for each): `ui.theme`, `ui.theme_glyph`, `ui.code_theme`, `ui.crt_on`, `ui.crt_title`, `ui.wallpaper`, `ui.wallpaper_title`, `ui.icons`, `ui.icons_title` (in `config/text/ui.yml`) and `app.text`, `app.text_smaller`, `app.text_reset`, `app.text_larger` (in `config/text/app.yml`). If `Appearance.svelte` is replaced and the new "This browser" rows use new words, `tests/checks/source/keys.test.ts:309-319` ("has a reader for every catalog key") goes red on all of them. `config/text/ui.yml` and `config/text/app.yml` are not in the paths; the brief names only `workbench.yml`.
5. `catalogOf`: readers are `config-key.ts:263,297`, `tests/checks/config/options-findings.ts:275`, `options-walk.test.ts`. `optionPaths`: `options-findings.ts:196`, `options-walk.test.ts`. Neither is imported anywhere in `src/lib/state` or `views` today. The brief's rows are catalog-driven (item 1, case 15), so `optionPaths` has no use in the rows module; the brief does not say which of the two the module imports.
6. Sentences the change affects, outside the paths:
   - `config/appearance.yml:69` ("The Settings view's Code theme menu writes the viewer's own choice into the appearance store, as the CRT toggle does") and `config/catalogs/options.yml:89` ("The Settings view's menu saves the viewer's own choice"). They have the same defect the brief fixes for the CRT at `appearance.yml:62` and `options.yml:84`: after S3c the view holds a "This browser" Code theme row and a file row for `code_theme`, and the sentence no longer says which.
   - `DESIGN.md:85` ("which the Settings view's Code theme menu overrides per browser, just as its CRT toggle overrides `crt.default`") is ambiguous the same way. The brief edits only DESIGN.md's boundary row.
   - Hits that stay true: `HELP.md:23,256`, `options.yml:314`, `ActivityRail.svelte:10,13,160`, `rail.ts:3,106,114`, `code-themes.ts:6`.
7. `docs/diagrams`: the files are regenerated; `grep -rl config-files docs` prints nothing.

## 2. The step line

Mapping of the S3c line (`plan.md:189`), Z75 (a), Z94 (4)(b), Z118 (3)(a) and (4)(a) to items of "What to build":

- Settings editor over every option of every config file: items 1 and 2. Search: item 2 header, item 1 search rule. Modified filter / `@modified` with a filter button: item 1 and item 2 header. `local.yml` keys without values: item 1, item 2 last bullets. HELP.md pointing to it: item 3. "This browser" group, `RailEditor` and `PagesReset` as controls: item 2. D30's four `terminal:` keys: not an item; they arrive through the catalog (`grep -n "terminal\." config/catalogs/options.yml` prints `:20,24,28,32,37`). Z94 (4)(b) write through `config-key`, list or family opens its file at its line: item 2 controls and Writes. History and undo: S3b's, nothing for the view to do.

Parts with no item that draws them:

1. "default": item 2's row draws the modified bar, title, description, control and a message line. The default is used for Modified and Reset Setting only; no row shows it.
2. "file and line": the line is computed (item 1) but a scalar row draws neither file nor line. Only a list or family row has "Edit in <file>" at the line, and the group heading has a control that opens the file at the top. The earlier brief check for S3 asked for a `file:line` link (S3-brief-check section 5); S3c does not carry one.
3. D30's four keys have no case. The shipped rows for them are `choice` (`cursor_style`) and three `toggle`s; nothing in the Cases names them.

## 3. Premises

Every claim of "What is on the tree" rerun:

- Catalog counts: `python3` with `yaml.safe_load` prints `appearance.yml 18 {family 1, number 6, toggle 4, choice 3, text 4}`, `behavior.yml 44 {family 3, list 5, number 28, text 4, toggle 4}`, `layout.yml 17 {family 7, text 4, list 2, choice 4}`, `present.yml 19 {text 12, family 7}`, `sources.yml 14 {family 3, text 11}`, `local.yml 16`, total 128. Matches.
- Folder sizes by the brief's own formula: `state/system 10`, `views/system/workbench 8`, `ui/forms 9`, `tests/views/system/workbench 5`, `tests/state/system 7`. Matches. Also `tests/ui/forms 4`, `views/system/config 2`.
- Line counts: `wc -l` prints Settings 49, Appearance 170, RailEditor 287, PagesReset 112, options.ts 82. Matches.
- `writes.svelte.ts:329` (function), `shapes.ts:169`, `config-key.ts:284`, `fs.svelte.ts:395` (`fileText`), `agents.ts:80` (`new LineCounter()`), `package.json` yaml `^2.9.0` and fuzzysort `4.0.2`, `boundaries.test.ts:129` (`'data/helpers/search'`), `rail.ts:15` import, `ActivityRail.svelte:168` `openView(SETTINGS_VIEW, { reveal: 'rail' }, ...)`, `HELP.md:145`, `config/appearance.yml:62`, `options.yml:84`: all match.
- Differs: "DESIGN.md:169's row" (named four times: "What is on the tree", build item 1, build item 3, Paths). `sed -n 169p DESIGN.md` is the `shell/` row; the `state/` row is `:171` (`grep -n '^| `state/`' DESIGN.md` prints `171`). A builder following the brief edits the shell row.
- Differs: "HELP.md:216 (the config section)". `grep -n "^## The configuration" HELP.md` prints `214`; `:216` is the paragraph under it, which is what the brief means. Acceptable. `HELP.md:228` already holds the `catalogs/options.yml` row.
- `type-scale.test.ts`: `:93-99` match; the "lists every view file" test is at `:336`, not `:341` (inside the read range `:330-350`). The same file's "every ui component is listed in the pass-through audit" (`:350-356`, entries at `:296-307` for `ui/forms`) also needs an entry for `src/lib/ui/forms/NumberInput.svelte`; the brief's item 4 says "each new `.svelte` with its font-size roles" without naming the ui entry.
- "Six" per-browser values vs the store: `ui.svelte.ts:6` says "The seven appearance values save together". The seventh is the terminal font (`setTerminalFont`, `ui.svelte.ts:498`), which `Appearance.svelte` does not draw today. The brief's "This browser" list is the six `Appearance.svelte` draws, consistent with "nothing it does today is lost", but it does not say whether the terminal font joins; it is also the per-browser override of catalog row `terminal.font_px`.
- "No ADR": see check 7.

## 4. Cases and checks

1. Cases 24 to 28 ("a component or state test that drives the control") cannot be run as written. `spec.md:56-57`: the unit suite renders to a string, a press, focus or effect "stays with the look", and `*.client.test.ts` runs "with no DOM" (`tests/ui/frame/client-runtime.ts:1-4`; `package.json` has no jsdom, happy-dom or testing-library: `grep -n "jsdom\|happy-dom\|testing-library" package.json` prints nothing). Typing `12` then Enter, losing focus, and unmounting a component cannot be driven. Case 24, 26 and 28 are reachable only if the write logic is a state module with an injected `writeConfigKey` and a commit function taking the text; the brief does not require that shape and says "component".
2. Case 22 ("search is cleared") is listed under "string render". Clearing is a state write from an effect; `svelte/server` runs no effect (`spec.md:57`; `client-runtime.ts:4` says "the node environment loads Svelte's server build, where no effect runs"). `RailEditor.svelte:77-81` does its reveal in `$effect`. The case passes in a string render only if the draw is derived (query ignored while `reveal` is set), which is not "cleared". Make it a derived rule, or move it to `*.client.test.ts`.
3. Cases 16 to 21 and 23 need `fileText` answers, which a string render does not give (see check 8, item 1). The existing `workbench-fixture.ts configured()` returns a plain client; `tests/views/system/config.test.ts:79-90` shows the working pattern (a doubled `fs`). The brief lists the fixture in the paths but not what it must hold.
4. Expected results of cases 16 to 21 are named in words ("draws the modified bar", "the summary and Edit in", "a number input") with no markup fixed before the build. The builder picks the selector and the test then asserts it, so it cannot fail for a wrong selector. Fix the attribute (for example a `data-modified` and a `data-control` per row) in the brief, or the case passes by construction. Case 16 must distinguish `NumberInput` from `TextInput`, whose markup is `type="text"` (`TextInput.svelte:39`).
5. Case 5 (key absent: "row marked missing") fixes no drawing for a missing row (see check 6, item 5).
6. Case 7 asserts the module "is given no text for it" but nothing asserts the view never calls `fileText(ENGINE_ROOT, 'local.yml')`. Add a view case with a recording double.
7. Cases 6 and 14 do not say what shape the "reason" and "message" take (a words key, a code, a string). The module is pure; fix the shape before the build.
8. `spec.md:59` requires every new id or key "empty, duplicated and colliding with a configured or reserved key". No case exercises a key-path segment named `constructor`/`__proto__` against the YAML walk (the writer does it with `Object.hasOwn`, `config-key.ts:263`; the rows module splits the same path), two sections of the same name in two files (`notes` is a section in `behavior.yml` and in `local.yml`: computed from the catalog), a duplicate YAML key (`parseDocument` reports an error), or an empty query. TOC ids must be file plus section.
9. Case 11 and 12 and 9 are consistent with `spec.md` and fixed before the build. Case 13 is fixed. Cases 1 to 3 and 8 are fixed given a fixture catalog. Case 10: `@id:cursor` is case-sensitivity-ambiguous (the rule says "contains `<text>`", while every other word is case-insensitive).
10. `spec.md:77` list of "Kept, oculus's own" is complete for what exists today except two things. (a) The unsaved-text registration: `state/client/context.ts:285-290` registers `railTyped(...)`, which makes a Settings tab with a rail draft dirty and makes a close ask; it reads `railDraft(instanceState(id))` (`rail.ts:52-56`). (b) `RailEditor`'s and `PagesReset`'s own `<h3>` heading and sentence (`RailEditor.svelte:141-142`, `PagesReset.svelte:63`, words `workbench.rail_title`, `rail_about`, `reset_title`). Embedded as the control of the `rail` and `arrangements` rows (title "Rail" from the title rule plus the catalog description), each draws its heading and sentence twice. The brief says "each kept as it works today" but not whether the heading and sentence stay.
11. The state shared by the query and the rail draft: both live in the tab's `instanceState` blob. `RailEditor` writes it with `withRailDraft(instanceState(id), ...)` (merges), but `Config.svelte:~105` writes `setInstanceState(instance.id, { open: next })` (replaces). A query saved as `setInstanceState(id, { query })` wipes the rail draft and a rail edit through `withRailDraft` keeps the query only if it spreads. No case covers "type a query while a rail draft is held, edit the draft while a query is held, both survive a re-render".

## 5. The question

For each case and item: could it pass without the goal (every option explained, findable and set from the view, `local.yml` values never shown)?

- Cases 1 to 3, 5 to 7, 9 to 13, 15: no. Each fails on the named defect in the pure module, once the module's input shape is fixed (see check 6, item 2).
- Case 4, 14: no for the module; the view's message in case 14 is not exercised in any view case (no case draws it), so the message could be absent and every case pass.
- Case 8: no, given a fixture catalog.
- Case 16: could pass with the wrong control on an option, since only "a checkbox is drawn" is asserted, not that it belongs to the option (item 4 above).
- Cases 17, 18: no for the markup named; yes if the builder draws the key path in a place that shows the value.
- Case 19: yes (no selector fixed).
- Case 20: yes unless the fixture doubles `fs` (without it the `layout.yml` group draws "loading", the rail row is absent, and the case would fail, so the builder is forced to double it; the brief should say so).
- Case 21: no (existing behaviour, `settings.test.ts:131-143`).
- Cases 22: yes as written (derived draw satisfies a string render without clearing). Case 23: no.
- Cases 24 to 28: yes. As written they cannot run (check 4, item 1); if the builder cannot drive a DOM they are replaced by a look at landing, and the goal's central path (a value is written, refused, superseded, closed) is then unchecked by a test.
- Build item 1 (rows module): no.
- Build item 2 (view): the table-of-contents press, scroll sync and hiding, the Escape and arrow keys, the gear on hover and focus, "the control shows the value sent while in flight", "Edit in <file>" opening the tab at the line (`sourceTabState(ENGINE_ROOT, name, line)`), the group heading's open control, and "the file's push redraws the value" have no case. They pass with the goal not reached, and `spec.md:56` assigns them to the landing look.
- Build item 3 (sentences): no test reads them. `help.test.ts` holds the HELP.md configuration table to the Config view's words, not row 145.
- Build item 4 (tests): the tests named are the ones above; no test of the view reads a file text, so the file-derived half of the view is untested until check 8, item 1 is resolved.
- Verify 1 (`checks.sh`, `checks: 7 commands passed`): passes with a view that draws nothing from files. Verify 2 and 3: structural. Verify 4 ("each new test fails on the unchanged tree"): trivially true for a module and a component that do not exist, so it does not show the tests detect a wrong behaviour.

## 6. Implied inputs

Each with the expected result I derive from the tree. None is under "Cases" unless noted.

1. Catalog empty or missing from the merged config (`catalogOf` returns `{}`, `options.ts:49-52`), or the `config` channel has not arrived (`entities.config()` undefined): no config group; "This browser" draws; the count says "No Settings Found" and so does an empty search. The brief gives one word for both; state whether a line says the catalog is not loaded.
2. The fs store is still loading a file: `fileText` answers `NO_TEXT = { text: '', truncated: false, error: '', loading: true }` (`fs-transport.ts:115`). The module's input is described as "the file text" (item 1). Parsing `''` gives a document with no keys, so every row of the file is "missing" and every control is disabled for the length of the fetch. Expected: the group says it is loading and draws no rows. The module signature must take the whole `FileText` (`text`, `truncated`, `error`, `loading`), which the brief does not say.
3. A file cut at the limit: `TEXT_LIMIT = 2 * 1024 * 1024` (`fs.ts:81`), `truncated: true` (`fs-transport.ts:207-245`). The brief says "no rows and the reason" in item 1; no case. A cut text can parse and show a partial list of rows, so the module must read `truncated` and not the parse result.
4. A fetch error for a file (`error` non-empty, for example `"404"`): same as "missing" in the brief; the group says so. No case.
5. Catalog key absent from the file: case 5 marks the row missing. The writer refuses it as `not_in_file` (`config-key.ts:310-311`, `locate` answers `missing` for absent, null, empty, alias, anchored, tagged and block-scalar nodes, `:122-137`). So a control on a missing row can never write. Expected: no enabled control; the row says the key is not in the file and offers "Edit in <file>" at the top (no line). Same for a key whose value is empty or null (`venue_id:` style, `git.message_model:` with no value) and for an alias or block scalar: line exists, value null, writes refused. Today `python3` over the five files finds no row missing, null or wrong-typed (`missing [] null [] modified [] wrongtype []` for each file), so these are future states.
6. A key whose line the parse cannot give: `agents.ts:81-86` returns line 1 for a node with no range (`?? 0` then `linePos(0).line`). Expected for the rows module: no line (undefined) and "Edit in <file>" opens the file without `line`, never line 1.
7. A `choice` value not in `values` (`cursor_style: bar`): the row is Modified (differs from `block`). `Select.svelte:34-41` draws a stray value as an extra option, so the control can show it, while item 2 says "a message line for ... a value the control cannot show". State which: stray option plus message line, or message only.
8. `Select` always draws an empty first choice (`Select.svelte:2-4`, required `empty` prop). Picking it calls `onchange('')`; the writer refuses (`misfit`, `config-key.ts:187-188`: not in `values`). Expected: the empty choice is not offered on a `choice` option, or picking it writes nothing. Not stated. If the stray rule above applies, the empty option is the control's only way to draw "no value".
9. A number written as a YAML string (`poll_min: "20"`): case 14's rule applies (kept, Modified, message). The first write of `20` is accepted: `renderScalar(20, 'QUOTE_DOUBLE')` returns `String(20)` (`yaml-edit.ts:201`), so the quotes go. Expected: the row repairs itself on the first valid write. Add as a case.
10. A `NumberInput` with an empty or white-space text: `Number('')` is `0` and `Number(' ')` is `0`; item 2 says "written when it parses as a finite number". Expected: empty text writes nothing and shows the message. Also `0x10` (16), `1e3`, `Infinity`, `-0`: state which parse (`Number()` or a stricter one).
11. A write refused for a reader-refused value (`changes.keep: 0`): the writer's `READERS` include `changesKeep` (`config-key.ts:78-89`), so `answer.refused` holds the reader's sentence. The answer shape is `{ ok: true, changed: [], refused: [{ field, reason }] }` with HTTP 200 (`writes.ts:541-558` `answer()` always `ok: true`). A view that tests `!answer.ok` as `RailEditor.save` does (`RailEditor.svelte:127`) would miss every refusal. State the shapes: refused (`ok` true, `refused` non-empty), unchanged (`ok` true, both empty), request failure (`ok` false with `error`, for example `unwritable`, `HTTP 429`), `network: true`, and the write timeout (`app.write_timed_out`). Case 25 covers only "a refused write".
12. The view narrowed below the TOC width: see check 8, item 6. Nothing in the Cases fixes the threshold or how it is measured; a string render has no width.
13. The config channel pushing while a field has unsent text: the row's `value` prop changes, and `TextInput` holds no text of its own (`TextInput.svelte:1-4`), so the view keeps a draft per field. Expected: the unsent draft stays until Enter or blur; the draft is dropped when a write of it is answered ok and the pushed value equals it. Not stated.
14. Stale file text against a fast second write: "only when its value differs from the file's" (item 2). After a write of `5` is answered, the fs text still holds `20` until the push and the refetch land (`refresh` marks the queries with `'replace'`, `fs.svelte.ts:614-618`). Typing `20` then compares equal to the stale text and writes nothing, while the file holds `5`. Expected: compare against the last value sent or answered as well as the text.
15. Tab switched or closed while a field has unsent text: unmounting a focused input does not reliably fire `blur`. Expected: stated (write, or drop); `spec.md:59` wants the superseded and after-close paths exercised.
16. The Settings view must itself call `refresh(ENGINE_ROOT, pushed)` as `Config.svelte:76-78` does. The brief says "the file's push redraws the value" and "Nothing reads a file the view does not ask for", but never says the view hands the config channel's version to the fs store. If only the Config view does it, a Settings tab with no Config tab open never refetches and shows the value from before the write.
17. A refusal for the "This browser" rows: none (ui store). Reset Setting on them: the ui store has no reset. `setWallpaper(on: boolean)` (`ui.svelte.ts:471-473`) cannot restore the stored `null` that means "follow the theme" (`:201-204`), so "Reset Setting sets the ui store's own default" has no call for the wallpaper row, and "Modified when it differs from the ui store's default" is undefined for it (stored `null` against `wallpaperOnTheme(theme)`). `ui.svelte.ts` is not in the paths. Also no case covers Modified or Reset of any "This browser" row; the module's cases cover config rows only, and case 27 is a config row.
18. Search over "This browser" rows: the brief does not say whether they take part in text search and `@modified`. Their titles and descriptions are in the words file (item 2, last bullet).
19. Search forms not fixed: `@id:` with nothing after it; `@id:` plus a word; `@modified` on a `local.yml` row (never Modified, so dropped); a word matching only a section name, a family field name or a `local.yml` description (item 1 says title, key path, section or description, so section yes; no case).
20. The section heading text for an option with no `section`: options.ts:28-30 says the first segment of the key path, raw (`slurm`, `terminal`, `themes`). The title rule capitalises; the heading rule is not stated. Of 48 sections, 28 are raw first segments and 20 carry a `section:` (`python3` over the catalog).
21. Copy Setting ID when the clipboard write fails: expected result not stated.
22. Escape in a text or number field: not prevented, so `workbench-keys.svelte.ts:~131-136` restores a maximised pane. The brief's keyboard bullet says Escape in the search only. State whether Escape in a field reverts the draft.
23. `Checkbox` has a required `label` prop drawn as plain text beside the box (`Checkbox.svelte:6-17`). Item 2 says a toggle is a `Checkbox` "beside the description" with the description through `CodeText` (backtick spans as code). A string label cannot carry `CodeText`. State that the Checkbox label is the title (or that Checkbox gains a snippet).
24. Descriptions with backticks: `grep -c '`' config/catalogs/options.yml` prints 6, so `CodeText` shows code for few descriptions; this is S3a content and not the step's.
25. Primitives lack props the brief assumes:
    - `TextInput` has `value, label, oninput, readonly, placeholder, secret` only (`TextInput.svelte:15-24`): no `onenter`, no `onblur`/`onchange`. Item 2: "writes on Enter or when it loses focus". `ui/forms/TextInput.svelte` is not in the paths. Either add the props (and a path, and a test) or wrap the primitive in an element handling `keydown`/`focusout`.
    - `Search` has `value, placeholder, oninput, onenter, field` (`Search.svelte:20-30`); Escape is built in (`:42-48`), there is no clear control and no Down hook; `{...field}` is spread before `onkeydown={keys}` so a field-supplied `onkeydown` is overridden. Down must be caught on a wrapper (events bubble); the clear control is a separate `ToolButton`.
26. `typingIn` skips the page keys for `input, textarea, select` and content-editable targets only (check 8, item 4); a focused treeitem, `ToolButton` or the gear's `Menu` button is not a field, so `1-9`, `j`, `k`, `n`, `i`, `o` act while focus is on them. The brief's wording "while a field of the view has focus" is met; the items' own focus is not covered.
27. A value from the hub reaches the page as an input value, a title or a description: Svelte escapes it. `deck.meta.title_html` and similar `_html` options are `text` controls whose value is shown in an input, not injected. Fine; no case needs adding unless a row ever draws a value as HTML.
28. `allow-styling.ts` (`tests/checks/tree/allow-styling.ts:1-9`) lists every `:global()` rule in a view that restyles a primitive's class; the list `HELP` already holds entries for `.search` (`Data.svelte:190`). The VS Code header (count to the right of the search) and a wide `Select`/`TextInput` may tempt `:global(.search)`; the brief gives no prop for this, so a new entry (a finding) or a new prop appears.
29. Only the shared `Menu` takes `label, items, onpick, glyph, compact, placement, align, bare, inherit` (`Menu.svelte:12-110`); a `MenuItem` has `active`, `disabled`, `glyph`, `title`, `rule` (`menu-items.ts:12-45`). The filter menu (Modified with a check) and the gear (Reset Setting, Copy Setting ID, disabled when not Modified) fit.

## 7. ADRs

1. `ls docs/adr` from `tools/oculus` and from the repository root print "No such file or directory". `find . -type d \( -name adr -o -name adrs -o -name decisions \) -not -path '*/node_modules/*' -not -path './.git/*'` prints nothing. `grep -n "^adr:" tools/oculus/.scratch/migration/orchestrator-state.md` prints nothing. None.

## 8. The other checks

1. Rendering with `svelte/server` and `fileText`. `src/lib/state/shared/stores/in-browser.ts` returns `typeof window !== 'undefined' && typeof fetch === 'function'`; `fs.svelte.ts:397-402` reads with `{ enabled: inBrowser() }` and returns `data ?? NO_TEXT`. In the node test environment the real store therefore answers `NO_TEXT` (`loading: true`) for every file: a string render shows every config group as loading, with no value, line or Modified. File-derived rows render only if the fixture doubles the store, as `tests/views/system/config.test.ts:79-90` does (`clientContext({ ...client, fs: { ...client.fs, entries: ..., fileText: () => held, refresh: ... } })`). The fixture would need: a `configured()` variant taking a file-name-to-`FileText` map (synthetic texts, or the tracked files read from `config/`), `fs.fileText` answering from it and recording the names asked (to prove `local.yml` is never asked), and `fs.refresh` recorded. `$effect` (the refresh call, the reveal clearing) does not run in this render.
2. Moving `config-files.ts` and the import-order check. `tests/checks/imports/order.ts` `folderOf` takes `<layer>/<first sub-folder>` (`:73-77`): `state/system/config/config-files.ts` is still `state/system`, so `ORDER` lists no new folder and `INNER` is unaffected. The moved file's own import `../sources/fs.ts` (`config-files.ts:12`) becomes `../../sources/fs.ts`, `state/system` to `state/sources`, which `ORDER` allows (system is listed above sources). The rows module may import `state/shared/*` and `data/sources/config/options` (the latter once the state row gains it). `boundaries.test.ts` is untouched by the move; its state row (`:117-141`) needs `'data/sources/config/options'` added, and its long comment (`:25-72`) explains each member, so it should gain a clause. The state row is `DESIGN.md:171`. No test cross-checks the DESIGN table with the test list (`grep -rn "May import" tests utils` prints nothing). The only imports that break are the two in check 1, item 1.
3. `ownPartials` (`boundaries.test.ts:166-170`) gives a view `views/<group>/<name>/**`, so `views/system/workbench/settings/*.svelte` may import `RailEditor` and `PagesReset`. The view may import `state/**` and `ui/**` but not `data/**`: types such as `CatalogEntry`/`Control` must be re-exported by the rows module.
4. Page shortcut keys while a field has focus: already skipped. `src/lib/shell/keys/workbench-keys.svelte.ts:418-425` `typingIn(target)` is true for `input, textarea, select`, content-editable and `.monaco-editor`; it feeds `resolveKey` as `typing` (`:117`), and `keys.ts:95` `held = context.typing || ...` returns no action before the `1-9`, chord, `?` and Escape-cursor branches (`keys.ts:~110-130`). `Ctrl+digit` and Escape-restore are the exceptions (`keys.ts:90-93`; `workbench-keys.svelte.ts:~131`). `Checkbox` is an input, so it counts as a field; a tree item, a `ToolButton` and the gear are not.
5. Primitive props, `Search`, `Checkbox`, `Select`, `TreeView`, `Menu`:
   - `Search`: see check 6, item 25. `Checkbox`: `checked, label, onchange` (see item 23). `Select`: `value, label, empty, choices, onchange`; empty choice always present (see item 8); `isStray` shows a value outside `choices`. `TreeView`: `label, rows (KeyRow: id, parent, open?, fixed?), current?, onfocusrow?, ontoggle?, children: Snippet<[TreeNav]>`; rows are drawn with `TreeItem` and `nav.row`; `current` carries the selected entry, so scroll sync is possible as a prop (`TreeView.svelte:45-56`). `Menu`: as in item 29. `TextInput` and `ToolButton`: see item 25 and `ToolButton.svelte:14-60` (`label, glyph, active, expanded, pressed, onclick, title, checked, disabled, compact, ...`). `CodeText`: `text`.
   - The brief's assumptions hold for `Menu` and `TreeView`, hold in part for `Search` and `Checkbox`, and do not hold for `TextInput` (no Enter or blur callback) and for `Select` (empty choice).
6. The VS Code `narrow-width` rule. `U2-vscode.css:491` is `.settings-editor.narrow-width>.settings-body .settings-toc-container { display:none }`, `:476` adds `padding-left:33px` to rows and `:502` sets the tree's `margin-left:0`; no width appears in the CSS, because the class is set in script. The brief says "(its `narrow-width` rule in `U2-vscode.css`, else 900 px of the view's own width)", so the first branch is empty and the fallback applies. VS Code's own value, from `grep -o 'TOC_MIN_WIDTH=100\|TOC_RESET_WIDTH=200\|EDITOR_MIN_WIDTH=500\|NARROW_TOTAL_WIDTH=this.TOC_RESET_WIDTH+this.EDITOR_MIN_WIDTH' workbench.desktop.main.js` and `rootElement.classList.toggle("narrow-width",e.width<cu.NARROW_TOTAL_WIDTH)`: the table of contents hides below 200 + 500 = 700 px of the editor's width. 900 px is not VS Code's value. The brief should say 700 and what is measured (the view's own width, by container query or `bind:clientWidth`); a string render has no width, so the table of contents is drawn in markup and hidden by CSS, or its state is untestable.
7. Other facts noticed while checking:
   - `yaml` is imported only under `src/lib/server` and `src/lib/data` today (`grep -rn "from 'yaml'" src` over the whole tree); the rows module would be the first client use. The page gains `parseDocument` and `LineCounter`; the size is not measured (not verified). The brief names the dependency, so it is allowed by `spec.md:51`.
   - The config channel already carries every merged value, so the text parse is needed for the line only; the brief's decision 3 takes values from the text as well, which makes the value lag the push by one refetch (item 14, check 6).
   - The ui store's wallpaper reset: item 17, check 6.
   - `ui/forms` becomes exactly ten items with `NumberInput.svelte` (`git ls-files src/lib/ui/forms | ... | wc -l` prints 9); `state/system` stays at 10 only if the moved file is removed from the folder as the brief says; `tests/state/system` goes 7 to 8.
   - The S3 brief check's view findings (S3-brief-check sections 1, 4, 5): the paths now hold `settings.test.ts`, `workbench-fixture.ts`, `type-scale.test.ts`, the reveal, the draft, the CRT sentence, the full `state/system` folder and the number input. Not carried: the `file:line` link (check 2, item 2), the unfixed Code theme sentence (check 1, item 6), the HELP.md configuration table row for the Code theme sentence (now `HELP.md:228` exists), and the render cases of section 5 are listed but not runnable (check 4).

## Declined to judge

- Whether 700 px or another width is the right threshold for oculus's own table of contents: the user's measure for the look; I give VS Code's value only.
- Whether `RailEditor`/`PagesReset` should lose their own headings when embedded (check 4, item 10): a visible choice for Axel.
- Whether Reset Setting on the wallpaper row may store an explicit boolean instead of `null`, or the ui store gains a reset (check 6, item 17): a design decision, and `ui.svelte.ts` is outside the paths.
- Whether the "kept" list should name the terminal font row (check 3): a user-visible shape the brief does not name.
- Whether the first client import of `yaml` is acceptable for the page's size: not measured, not verified.
- VS Code's behaviours in build item 2 (read-the-installed-app step 7 of "Read"): not opened; I did not run VS Code.
- `npm test`, `npm run test:checks`, `npm run check`, `npm run diagrams`, the build: not run (read-only, and the step is not built).
- Whether a third copy of the write-route branch trips `tests/checks/tree/duplication.test.ts` and whether `tests/checks/tree/negatives.test.ts` bans phrases the new comments or words may contain: not run.
- `config/local.yml`: not opened, by instruction.

Agent usage: claude-sonnet-5-5, about 400,000 tokens, about 95 tool calls, minutes not measured (estimate, not verified).

Usage: brief-check agent af6e818122de82260, served claude-sonnet-5-5; 267,603 tokens, 90 tool uses, 11.8 min (from its completion notice)

## Closed

Each finding closed in `agents/briefs/S3c.md` before the preparation commit; Z149 (automode) rules the three choices the check declined to judge.

- 1.1 `files.ts:6` and its comment at `:2`, and `keys.test.ts:20`, are in the paths and in What to build 1.
- 1.2 and 1.4 The thirteen words and `workbench.settings_appearance` are named in "What is on the tree"; What to build 2 reuses or removes them; `ui.yml` and `app.yml` are in the paths.
- 1.3 `NumberInput.svelte` is the tenth item of `ui/forms`, listed in type-scale's `ui/forms` list (What to build 4).
- 1.5 and 8.3 The rows module imports `options.ts`; `data/sources/config/options` joins `DESIGN.md:171` and `boundaries.test.ts:117-141` with a comment clause; the module re-exports the types the view needs.
- 1.6 `config/appearance.yml:69`, `options.yml:89` and `DESIGN.md:85` join `:62` and `:84` in What to build 3 and the paths.
- 2.1 and 2.2 Each row draws its default and its file and line as a link to the source tab at the line (What to build 2, case 32).
- 2.3 Case 17 names the four D30 keys and their controls.
- 3 `DESIGN.md:171` throughout; `HELP.md:214` heading and `:216` paragraph; type-scale `:336` and `:296-307`, `:350-356`; the seventh value is the terminal text size, a "This browser" row by Z149 (3).
- 4.1 and 4.2 The write logic is a plain module driven by a recorded `writeConfigKey` (cases 19 to 26); the reveal is a derived rule a string render shows (case 36); presses, focus, scroll and effects are named as checked at the look.
- 4.3 and 4.6 The fixture doubles `fs` as `config.test.ts:79-90` and records the names asked; case 30 holds that `local.yml` is never asked.
- 4.4 and 4.5 The markup attributes `data-setting`, `data-control`, `data-modified`, `data-missing`, `data-settings-group` are fixed; a missing row's drawing is fixed (case 32).
- 4.7 Every message is a words key with its values (What to build 1, "Messages").
- 4.8 and 6.10 (`__proto__`) Own-key walk, case 10; table-of-contents ids are file and section, case 16; a duplicate key is a parse error, case 6.
- 4.9 `@id:` is case-insensitive, case 13.
- 4.10 The unsaved-text registration is Kept item 1, and drafts register through `settingsTyped` (Kept item 6). The two headings: Z149 (1).
- 4.11 The query, the drafts and the rail draft are merged into the blob, case 26.
- 6.1 No catalog: What to build 1, case 27.
- 6.2 to 6.4 Loading, cut and unreadable texts: What to build 1, case 7 and case 33.
- 6.5 A missing row draws no control and "Edit in <file>".
- 6.6 A node with no range has no line, never line 1.
- 6.7 and 6.8 A stray choice value is Select's stray option with the mismatch message; the empty choice writes nothing (case 25).
- 6.9 A number written as a string is `mismatch` (case 9).
- 6.10 The number pattern, empty text and `-0` (case 19, decision 9).
- 6.11 Answer shapes read as `writes.ts:541-558` gives them (case 21).
- 6.12 and 8.6 The table of contents hides under 700 px of the view's width, VS Code's `NARROW_TOTAL_WIDTH` (decision 8), checked at the look.
- 6.13 to 6.15 Drafts kept as instance state survive a push, a tab switch and a close; no write without Enter or blur; compare with the last value sent (case 20, case 22).
- 6.16 The view calls `refresh(ENGINE_ROOT, pushed)`.
- 6.17 Z149 (2): `ui.svelte.ts` in the paths, `setWallpaper(null)` and `setCodeTheme(null)` (case 18).
- 6.18 to 6.20 "This browser" rows take part in search; the search forms and the section heading rule are fixed in What to build 1.
- 6.21 A failed clipboard write says so on the message line.
- 6.22 Escape in a field reverts its text.
- 6.23 The toggle's label is the description's plain text.
- 6.25 `TextInput` gains `onenter` and `onblur` with a test; the search's clear control is a `ToolButton` and Down is caught on a wrapper.
- 6.26 The page's single keys act on a focused button or row as in every other view, and are skipped in fields.
- 6.27 No change.
- 6.28 `allow-styling.ts` is in the paths for a `:global()` rule over a primitive.
- 6.29 The filter menu uses the item's `active`.
- 8.7 The report gives the client build's largest chunk before and after the first client import of `yaml`.
