Brief check of D13c (tools/oculus/.scratch/migration/agents/briefs/D13c.md), against main at de5f74cd (`git log --oneline -1` printed `de5f74cd Land Q86c: the Map's forces back on d3-force`). I wrote only to the scratchpad `D13c-check/`, and nothing in the repository changed.

Three findings would make the build go red or miss the goal:
- **F1, layer rule.** The list module in `data/helpers` cannot be imported by the state or view layers under `boundaries.test.ts`'s ALLOWED table unless the brief adds it to that table.
- **F2, config default.** With item 6 as written, the `code_theme:` key stops reaching a browser after its first save. It also never follows a live edit of the file.
- **F3, menu case.** Case 13 cannot be tested as written, because a closed `Menu` renders no items in the unit suite.

## Names

The names grep was `for n in code_theme codeTheme codeThemeDefault setCodeTheme CODE_TOKENS codeThemeIds codeThemeInfo code-themes VOCAB_KEYS; do grep -rn --exclude=local.yml "$n" src tests config DESIGN.md HELP.md README.md docs utils; done`, plus separate greps for "six" and `findings.appearance`.
- `code_theme`, `codeTheme`, `codeThemeDefault`, `setCodeTheme`, `CODE_TOKENS`, `codeThemeIds`, `codeThemeInfo`, `code-themes`: no hits.
- `VOCAB_KEYS`: `catalogs.ts:21,42` (in the brief's paths) and `src/lib/data/sources/config.ts:49`, a re-export outside the paths that the change leaves correct.
  - `catalogs.ts:14-20`'s doc comment says "`themes`, `wallpaper`, `crt` and `terminal` are config/appearance.yml's". Item 2 leaves that comment incomplete, and the brief does not name it.
- `findings.appearance`: only `themes.ts:44,54,60`, all in the paths.
- "the six" appearance values:
  - `ui.svelte.ts:6,8` (named by the brief).
  - `ui.svelte.ts:89` "Two of the six come from config/appearance.yml". Not named; it becomes false (three of seven).
  - `Appearance.svelte:4` (named).
  - `tests/state/workbench/ui.test.ts:111`, the test named "saves the six appearance values ...". Its `toEqual` of the whole envelope at 124-135 goes red once `codeTheme` joins `Ui`. The file is in the paths, but the brief does not say this existing case changes or gets renamed.
- `EditorKit.paint`, `painter`, `repaint`: `grep -rnE "\bpaint\b|paint:|\.paint\(|painter|repaint|EditorKit" src tests utils` finds callers only in files the brief lists: `Editor.svelte:34,37,130,161,191,238,363`, `DiffEditor.svelte:27,30,99,121,169,176,289`, `kit/look.ts:7,35-43`, `kit/built.svelte.ts:6,12` and `paint.test.ts`.
  - `built.svelte.ts` imports the `EditorKit` type only. It is not in the paths and is unaffected unless the type's shape changes in a way that breaks it.
- `look` props: `grep -n "look" <the five parents>` confirms every hit is in the paths (`Merge.svelte:91,213,223,235`, `MergeSide.svelte:31,35,104`, `source/Editor.svelte:12,114,115,162`, `Diff.svelte:130,421`, `DiffSection.svelte:55,83,263`).
  - The only importers of the two primitives are `source/Editor.svelte:26`, `Merge.svelte:41`, `MergeSide.svelte:18` and `DiffSection.svelte:20`.
- Head comments in the paths that the change makes false and that the brief does not name:
  - `load.ts:13-23` (the paint "builds the theme from the tokens in force", "the one theme `oculus`").
  - `look.ts:1-4` ("whenever the theme or the text size changes").
  - `Editor.svelte:18-21` ("again whenever `look` changes").
  - `source/Editor.svelte:12`.
  - `theme.ts:10-14` (every scope gets a `-txt` hue nudged to 4.5:1; not true for a Shiki theme's colours).
  - `appearance.ts:1-3` (the list of what the module holds).
  - `catalogs.ts:14-20`.
- **F1 (layer rule, blocks the build).** `tests/checks/tree/boundaries.test.ts:89-139` ALLOWED:
  - The `state` row lists data modules one by one and has no `data/helpers/code-themes`.
  - The `views` row is `['ui/**', 'state/**', 'views/shared/**']`.
  - The `ui` row is `['ui/**', 'themes/**', 'state/shared/words/text', 'data/prose/markdown']`.
  - So item 5 (`appearance.ts` validating against `codeThemeIds()`) and item 6 (`loadUi` checking a listed id) turn `boundaries.test.ts` red unless `'data/helpers/code-themes'` joins the state row. Joining it means updating the row's reason comment (31-66) and DESIGN.md:169's state row, which the test's header says it enforces.
  - `Appearance.svelte` (item 7) may not import the module at all. It has to reach `codeThemeInfo()` through a state module, for example a re-export from `appearance.ts`.
  - `load.ts` (ui layer) may not import it either.
  - The brief states none of this. `boundaries.test.ts` is in its paths only for the FROZEN allow-list at 267-271.

## The step line

- `grep -n "^- D13c" plan.md` gives 329: the `code_theme:` key in `config/appearance.yml` (item 1), `tokens` or a Shiki theme id (items 3, 4, 8), default `tokens` (items 1 and 5), and a control in the Settings view's Appearance section (item 7).
- D13's carried line (`sed -n 322p plan.md`) contributes two parts:
  - "saved with the other appearance values" maps to item 6.
  - "O27a's read-only windows stay on highlight.js" maps to decision 2 and case 14.
- LA22 (a) (`library-audit.md:247-253`) contributes three parts:
  - `tokens` means the `--c-code-*` tokens as today: item 8 and case 5.
  - A theme id means that theme's syntax colours: item 8 and case 2.
  - "the editor background and chrome stay on the oculus tokens either way": item 8 and decision 3.
- Every part maps to an item.
- Partly covered: LA22 keeps the background on the tokens, but the brief drops only scope-less entries. My node survey of all 65 bundled themes found 16 themes with scoped entries that carry `settings.background`: ayu x3, github x7, night-owl, nord, one-light, vitesse x3. Neither an item nor a case says whether a scoped `background` is kept or dropped. Whether Monaco draws a token-rule background is not verified.
- plan.md has no `## Goal` section: `grep -n "^#" plan.md` prints only lines 1, 5, 387, 398 and 551. The head paragraph (lines 1-3) was read in its place.

## Premises

All checked on main with `sed -n` / `grep -n` / `wc -l` / `node`. Each holds except where noted.
- `appearance.yml` is 61 lines. The brief's line ranges are slightly off:
  - wallpaper runs 35-48, not 35-46.
  - memories runs 51-54, not 49-53.
  - crt runs 57-61 with its comment at 57-59, not 56-61 and 56-58.
  - themes 8-26 and terminal 29-32 are right.
- `grep -rn "appearance.yml" src/routes src/lib/server` prints nothing at all. The brief says "finds only readers and comments", but the readers and comments are elsewhere in `src`. The conclusion (no route writes the file) holds.
- `loadConfig` is at `merge.ts:109`, and the file is 218 lines. `VOCAB_KEYS` is at `catalogs.ts:21-32`, with the 10 keys as quoted.
- `vocabCatalog` is at `+page.server.ts:37`, not :36. `setAppearance(data.vocab)` is at `+page.ts:27`, and `socket.svelte.ts:218` is right.
- `appearance.ts` is 204 lines:
  - The module variables are at 52-56 and `setAppearance` at 116-136.
  - `crtDefault` is at 166-170 (brief: 166-170) and `terminalFontPx` at 172-176 (brief: 172-176).
  - The allow-list is at `boundaries.test.ts:267-271`.
- `themes.ts` is 65 lines with `themeFindings` at 27-65. `findings.yml` holds `appearance:` at 29-32. The call sites are `context.ts:237` (the brief's 234-239 range) and `portfolio.ts:328`.
- `ui.svelte.ts` is 397 lines:
  - `Ui` is at 32-47, `UI_KEY` at 17 and `UI_VERSION = 2` at 20.
  - `defaultUi` is at 96-109 (brief: 93-106).
  - `loadUi` is at 225-282, with the field reads at 249-275.
  - `setCrt` is at 300-302.
- `Appearance.svelte` is 154 lines, with the Menu at 59-65, the text steps at 73-96, CRT at 98-105, Wallpaper at 106-115 and Icons at 116-123. `ui.yml` has `crt_on` at 12, `icons` at 22-23 and `theme` at 76.
- The kit has 7 files. `theme.ts` is 150 lines, with `editorTheme` at 110-150 and `RULES` at 31-66. `COLOURS` has 433 keys (`grep -cE ":\s*'--" colours.ts` gives 433). `load.ts` is 173 lines, with `paint` at 44, `painter(...)` at 115-120, `THEME` at 125 and `painter` at 147-173. `look.ts` has `repaint` at 35-47.
- Editor props:
  - `Editor.svelte`: prop at 80/111, paint at 190-191, repaint at 358-364.
  - `DiffEditor.svelte`: prop at 61/84, paint at 168-169, repaint at 285-289.
- Shiki versions: `shiki` 4.4.3 with `./themes` in its exports, and `@shikijs/monaco` and `@shikijs/themes` both 4.4.3.
- The themes survey (`node --input-type=module` over `shiki/themes`) printed "total 65 dark 44 light 21". It also showed no duplicate displayName, no id `tokens`, and every theme has a `tokenColors` array.
  - 25 themes have scope-less entries, so case 3 is reachable: `nord` has 1, and each material-theme has 2.
  - dark-plus has 65 entries, all scoped.
- `themes.mjs` imports nothing statically; each entry is `() => import("@shikijs/themes/<id>")`.
- The error "Theme `x` is not included in this bundle" is at `@shikijs/core/dist/index.mjs:1140`.
- No bundled theme is loaded anywhere today: `grep -rn "bundledTheme\|@shikijs/themes" src` prints nothing.
- `config-folder.test.ts:107`, `config.test.ts:620-670`, the appearance describe block at `settings.test.ts:85` and `theme.test.ts:7` `@module-tag slow` are as stated. `paint.test.ts` passes on main: `npx vitest run tests/ui/controls/editor/paint.test.ts` printed "Tests 3 passed (3)".
- The DESIGN.md and HELP.md lines hold what the brief says. `HELP.md:23` contains "The appearance controls (Theme, the Text row ..., and Icons) are in the Settings view."

## Cases and checks

- **Shiki under vitest: resolves.** A scratch test under a scratch vitest config rooted at tools/oculus passed (`npx vitest run --config .../vitest.probe.mjs`: "Tests 1 passed (1)"). It showed four things:
  - `bundledThemes['dark-plus']()` loads.
  - `createHighlighter({ themes: ['nord'], langs: ['markdown'] })` loads.
  - An unknown id rejects with /not included/.
  - `paint.test.ts` already runs the real `createHighlighter` the same way at 57-72.
- **`shiki/themes` from `src/lib/data/`: allowed.** `boundaries.test.ts` checks only imports that name a module of the tree: `target()` in `tests/checks/imports/graph.ts:29-40` answers null for a bare package specifier. No check in `tests/checks` or `utils` restricts packages per layer (`grep -rn "'shiki\|shiki/" tests/checks utils` prints nothing). The blocker is the tree-module rows in F1, so the list module can stay at `src/lib/data/helpers/code-themes.ts`, provided that:
  - the state row gains `'data/helpers/code-themes'` (with its reason, and DESIGN.md:169),
  - the view reads the list through `state/shared/words/appearance.ts`,
  - `load.ts` imports `shiki/themes` itself.
- A side effect the brief does not state: a static import of `shiki/themes` reached from `appearance.ts` puts the 65-entry list into the page's first chunk. That makes `load.ts:9-10`'s "keeps Monaco and Shiki in chunks of their own" partly untrue. No bundle-size check exists, and the size is not measured.
- **F3, case 13 (untestable as written).** `Menu.svelte:154-162` draws the items inside `DropdownMenu.Portal`/`Content`, which is not rendered while the menu is closed. The unit suite (`render` from `svelte/server`, `settings.test.ts:11`) therefore never sees the items. The case needs the item list built by a pure function in a state module and tested there, the way `tests/ui/menu/menu-words.test.ts` tests item builders. Item 7 puts the construction in the view.
- **Case 4, last clause ("the editors repaint").** This needs a DOM (an `$effect` plus `requestAnimationFrame` in `look.ts:41`). By rules line 56 it is a look item, and it should be stated as one, with the view and state to open.
  - Only "the source tab's editor gets `codeTheme` nord" could be unit-tested, and only if the prop were visible in the server render. Nothing in the brief makes it visible.
- **Case 12.** Only testable if the painter takes the theme loader as an injected part of `PaintParts`, since a listed id's real import never rejects. The brief does not name that part.
- **Case 2.** Ambiguous about what is asserted: the registration handed to `createHighlighter`, or the theme the bridge defines in Monaco (the stand-in's `defined`, as `paint.test.ts:109-116` does). See the Question section below.
- **Cases 6 and 7** read `codeThemeDefault()`. The brief's test files have no home for `setAppearance` cases (those live in `tests/ui/theme/theme.test.ts:202-210`, not in the paths). They can go in `ui.test.ts`, but the brief should say where.
- **Case 14** is checked by reading, which the brief allows.
- **Rules line 58** asks that every new key is exercised empty, duplicated and colliding with a reserved key, and that every async path is exercised in flight, after close and superseded. None of these is a case. See Implied inputs 3, 5, 6, 8 and 9.
- **Rules line 57.** The brief's docs item names DESIGN.md:85 and :289 but not DESIGN.md:169 (F1). It also names none of the stale head comments listed under Names.
- **Folder limit.** `sh utils/folder-check.sh` exits 0 on main. `git ls-files -co --exclude-standard src/lib/data/helpers | ... | wc -l` gives 9, so `code-themes.ts` makes 10, which is allowed. No other folder gains a file.

## The question: could each pass without the goal being reached?

- **Item 6 and cases 1, 2, 8, 9: yes (F2).**
  - `defaultUi()` is evaluated only in `createUi` (ui.svelte.ts:111) and `loadUi` (:234, :247). `save()` (:284-292) writes the whole `Ui`, and `setInstanceState` (:353-354) calls it on every view-state write.
  - A `codeTheme: string` field holding the default is therefore written to `oculus.ui.v1` at the first save of any field. After that, the `code_theme:` key never reaches that browser.
  - Even a browser that saved nothing does not follow a live edit of the file on the `config` channel, because `store.current` is not recomputed.
  - Cases 1, 2, 8 and 9 all start from a fresh load and pass anyway.
  - The file's own `wallpaper: boolean | null` pattern (ui.svelte.ts:35-36, 134-143: "so a save of any other field cannot put it out") is the shape that reaches the goal: `null` while unchosen, with `codeTheme()` answering `chosen ?? codeThemeDefault()`.
  - `crt` has the same defect today; the brief's decision 1 copies it.
- **Case 2: yes, if asserted on the registration alone.** A registration that keeps the Shiki theme's own `name` (e.g. `dark-plus`) makes the bridge define `dark-plus` while the page sets `oculus`, so nothing changes on screen. The case should assert that `defined` holds only `THEME` and that a dark-plus foreground is among its rules.
- **Case 4: yes.** `setCodeTheme` can save and `loadUi` can read back while the editors' repaint effect ignores the new prop. The effect at `Editor.svelte:358-364` compares `look` strings only. Only the look catches this.
- **Case 10: no** for the signature. It could pass with the import repeated on every paint, since nothing counts imports; see implied input 10.
- **Case 12: yes, if the loader caches a rejected promise.** A later paint with `tokens` succeeds, while the same id stays broken for the rest of the page.
- **Case 13: yes, as an assertion over labels in a render.** It cannot see closed items, so any passing form is an audit (rules line 56) unless it becomes a pure builder test.
- **Item 2: yes, if tested only through `VOCAB_KEYS` membership.** It needs `vocabCatalog(config)` to carry `code_theme`, and no case says so.
- **Item 4: yes, for a config with no `themes:` list.** `themes.ts:29` returns `[]` before any check, so code added after it says nothing about a bad `code_theme` in that config. No case covers it.
- **Item 7: yes on sight.** The "active" state and the opener's shown value are only visible in the unit render if the value span is drawn like `data-theme-name` (Appearance.svelte:66-71).
- **Cases 3, 5, 6, 7, 11: no** under a stand-in Monaco with the real Shiki, as long as each asserts on the defined theme.
- **Item 10 (docs) and case 14:** reading only; they pass by writing.

## Implied inputs

1. `code_theme:` edited to `nord` while the page is open, with no pick saved. Expected: `codeTheme()` becomes `nord` on the push. Fails under item 6 as written (F2).
2. A browser that saved a UI theme or any instance state but never picked a code theme, then `code_theme: dark-plus` in the file. Expected: `codeTheme()` is `dark-plus`. Fails under item 6 as written.
3. `code_theme: ''` (empty). Expected: the finding and `tokens`.
4. `code_theme:` with no value (null). The brief's rule ("present and not a string") gives the finding and `tokens`; a case should confirm it.
5. `code_theme` also defined in another config file. Expected: loadConfig's existing two-file finding.
6. `code_theme: Dark-Plus` or `TOKENS`. Expected: the finding (ids are case-sensitive). `tokens` collides with no Shiki id (survey: "ids tokens? false"). The code theme `nord` shares a name with the UI theme `nord` (`appearance.yml:16`); they are separate fields, but no case says so.
7. A bad `code_theme` in a config with no `themes:` list. Expected: one finding (see `themes.ts:29`).
8. `nord` picked, then `dark-plus` picked while nord's import is still in flight. Expected: dark-plus in force at the end, and nord never left defined last.
9. An import rejected, then the same id painted again. Expected: the import is retried, not answered from a cached rejection.
10. nord, then `tokens`, then nord again. Expected: nord's registration imported once.
11. The painter handed an id not in the list (a stale prop). Expected: rejected like case 12, or painted as `tokens`. The brief does not say which.
12. A dark code theme (dark-plus) under a light UI theme. Expected under LA22: dark-plus's foregrounds (first entry `#D4D4D4`) on the light panel, with no contrast adjustment. This is a user-visible result the report should list for the look.
13. A Shiki theme whose scoped entries carry `background` (16 themes, e.g. github-light). Expected: not stated (see The step line).
14. `setCodeTheme('')`. Expected: the default (item 6's rule), with no case.
15. The first frame: `vocabCatalog(loadConfig(...).config)` includes `code_theme` (item 2's purpose). No case.
16. The opener's shown value when `tokens` is in force. Expected: "From the theme" (`ui.code_theme_tokens`). For an id, the displayName.

## Folder limit

`sh utils/folder-check.sh` gives exit 0. `src/lib/data/helpers` holds 9 items (`git ls-files -co --exclude-standard` count), so the new `code-themes.ts` makes 10, which is at the limit and allowed. The brief adds no other file.

## Declined to judge

- **Path overlap with Q88b.** `queue.md` lists Q88b, queued ahead of D13c, with Z70 ruled (a): `show_tabs` and `editor_actions` in `config/appearance.yml`, each with a Settings Appearance control. Q88b will almost certainly write `config/appearance.yml`, `Appearance.svelte`, `ui.svelte.ts`, probably `VOCAB_KEYS`, `config-folder.test.ts:107`, `ui.test.ts`, `settings.test.ts` and HELP.md:23/:145/:220. It will also change the same "six appearance values" count. Whether the two run side by side or D13c follows Q88b's landing is the orchestrator's call under rules line 83. It also bears on F2: Q88b's two defaults hit the same frozen-default problem.
- **Shiki displayNames as UI labels.** Whether Shiki's `displayName` strings, shown as menu labels, fall under rules line 44 ("every user-facing string from a catalog file") is not settled by the rules text. They are dependency data, not oculus literals, like the UI theme labels, which come from `appearance.yml`. Decision 5 names the choice.
- **Browser storage vs `~/.oculus/`.** Keeping the pick in browser storage rather than under `~/.oculus/` (rules line 89) follows the existing `crt` pattern and LA22's "saved with the other appearance values". Whether a viewer preference counts as "a fact about the hub" is the orchestrator's reading.

## Usage

claude-opus-5-5 (transcript `message.model`), 63 tool uses, 182,703 tokens, 8.7 min (524,935 ms), from its completion notice.

## Closed

- F1, the layer rule: item 3 now adds `'data/helpers/code-themes'` to the state row of `boundaries.test.ts`'s ALLOWED with DESIGN.md:169, the view reads the list through `appearance.ts`, and `kit/load.ts` imports `shiki/themes` itself; the premise is in "What is on the tree".
- F2, the frozen default: item 6 now keeps `codeTheme` `null` until picked, in the shape of `wallpaper`; cases 15, 16 and 24 hold it; decision 1 says so.
- F3, the menu case: item 7 now builds the items in a pure `codeThemeMenu` in `views/system/workbench/code-theme-menu.ts` with its own test; case 13 tests the builder and the drawn opener's `data-code-theme`.
- Case 4's repaint: now a look item at landing; the unit part is the store's save and load.
- Case 12: the loader is an injected `loadTheme` part of `PaintParts`, a rejection never cached; case 12 checks the retry.
- Case 2: now asserts the stand-in's defined themes hold only `oculus` with dark-plus's foregrounds.
- Scoped `background`: item 8 removes it; case 3 covers `github-light`; decision 3 names the dark-on-light result for the look.
- Item 4 with no `themes:` list: the check runs before the early return; case 19.
- Item 2: case 25 checks `vocabCatalog`.
- Stale head comments and the "six" test: listed in "What is on the tree" and items 6, 8 and 11.
- Line numbers: the appearance.yml ranges, `+page.server.ts:37`, `+page.ts:27` and `defaultUi` 96-109 corrected; the grep premise now reads "prints nothing".
- Implied inputs 1 to 16: cases 15 to 26, and 11 as case 23 (paints `tokens`).
- The first chunk: item 3 says the list joins it and `load.ts:9-10` says so.
- `setAppearance` cases: `tests/ui/theme/theme.test.ts` added to the paths.
- Declined, the overlap with Q88b: the orchestrator judges the shared appearance files (`config/appearance.yml`, `ui.svelte.ts`, `appearance.ts`, `Appearance.svelte`, `catalogs.ts`, `config-folder.test.ts`, `ui.test.ts`, `settings.test.ts`, HELP.md) simple to merge, each change an added key, field, getter or control beside the others, and Q88b's brief takes the same `null`-until-picked shape.
