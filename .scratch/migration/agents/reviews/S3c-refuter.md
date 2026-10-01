# Step S3c refuter report (on /Users/axelfaes/workspace/research-hub/.agents/worktrees/S3c, base a157d199)

Reading order followed: plan.yaml, the refute skill, the state file's S3c dispatch entry (the `note:` line of 11:32 included), the brief, its brief check with the Closed heading, spec.md, plan.md's S3c line and Z75, Z94, Z118, Z149, the diff (`git diff a157d199`, `git status --short`, every new file read whole), then the builder's report. No edit was made to any file. `npm run diagrams` rewrote `docs/diagrams/*` as the brief's verify step; `git status --short` afterwards lists the same files as before. `config/local.yml`, ports 8787 and 8790 and `.vscode` were not touched.

## Verification (rerun by the reviewer)

```
$ PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH npm run diagrams
> node utils/diagrams/diagrams.mjs
docs/diagrams/layers.dot ... docs/diagrams/writes.svg   (18 files written, exit 0)

$ PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH sh ~/.claude/skills/land/templates/checks.sh .scratch/migration/orchestrator-state.md
$ npm test
 Test Files  376 passed | 20 skipped (396)
      Tests  6082 passed | 600 skipped (6682)
$ npm run test:checks
 Test Files  29 passed | 2 skipped (31)
      Tests  442 passed | 9 skipped (451)
$ npm run check
1790851100640 COMPLETED 2861 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
$ npm run build
(built in 13.89s; nodes/2.CtDuKCsc.js 2,163.69 kB, server _page.svelte.js 2,314.41 kB)
$ npm run format:check
All matched files use Prettier code style!
$ npm run lint
(no output)
$ ! LC_ALL=C grep -rna '[^ -~]' src tests
(no output)
checks: 7 commands passed
```

The brief's other verify items and the commands the builder's report quotes, rerun in the same form:

```
spec.md ASCII gate (perl over src tests config, local.yml excluded): printed nothing (the `bin` folder does not exist, so find printed one error for it)
LC_ALL=C grep -nP '[^\x00-\x7F]' HELP.md DESIGN.md S3c-report.md: printed nothing
npx vitest run tests/state/system tests/views/system/workbench:   Test Files 14 passed (14), Tests 216 passed (216)   (report: 14 files, 216 tests: reproduces)
npx vitest run tests/state/system/settings tests/views/system/workbench/settings.test.ts tests/ui/forms/number-input.test.ts tests/ui/forms/text-input.test.ts tests/state/workbench/ui.test.ts:   Test Files 7 passed (7), Tests 155 passed (155)   (report: 155: reproduces)
npx vitest run tests/ui/forms tests/state/workbench/ui.test.ts:   Test Files 6 passed (6), Tests 64 passed (64)
grep -rnE "Appearance\.svelte|rail_title|reset_title|settings_appearance" src tests config HELP.md DESIGN.md README.md --exclude=local.yml:
  src/lib/views/sessions/session-list/SessionList.svelte:8 and :243, config/text/views/sessions/session-list.yml:47 (all sessions.rail_title)   (report: only sessions.rail_title: reproduces; the report's table writes the alternation as `\|` inside -E, which as typed matches nothing, so the table cell is not copy-runnable)
grep -nE "typeof |Array\.isArray" over settings/* and state/system/config/*.ts:   only the three `typeof` of types (browser.ts:30, messages.ts:29, rows.ts:73) and write.ts:40 and :42 (commit's typed input)   (reproduces)
folder item counts (git ls-files + untracked, deleted file excluded by ls): state/system 10, state/system/config 8, views/system/workbench 8, workbench/settings 10, ui/forms 10, tests/state/system 8, tests/state/system/settings 4, tests/ui/forms 6, tests/views/system/workbench 5: all within ten
find .svelte-kit/output/client/_app/immutable -name '*.js' -not -path '*workers*' -exec wc -c {} + | sort -n | tail:   nodes/2.CtDuKCsc.js 2163694; chunks/I7Dj73QH.js 2737063 (largest)   (report's "after" figures 2,163,694 and 2,737,063 reproduce; `grep -rl YAMLParseError` finds yaml only in nodes/2)
```

Not reproduced, needing a second build or files outside the worktree: the "before" chunk figures (`chunks-before.txt`, nodes/2 1,940,418 and largest 2,737,063), the first run (`first-run.txt`: 5 files failed, 23 tests failed, 22 passed) and the mutation table M1-M6 (each needs an edit of source, which I may not make).

## Verdicts

Items of the brief's "What to build":

- 1 (rows module): holds. `src/lib/state/system/config/` holds rows.ts, groups.ts, search.ts, write.ts, browser.ts, typed.ts, messages.ts and the moved config-files.ts (identical but for one import path, `diff` shows a single line). The four old importers are updated (Config.svelte:45, files.ts:2 and :6, keys.test.ts:20, config-files.test.ts:10). State row of DESIGN.md:171 and boundaries.test.ts:136 carry `data/sources/config/options`. Tests: 155 pass. One deviation from the sentence "the groups and sections that still hold one" is Behaviour finding 4.5.
- 2 (the view): violated. Findings 4.1 (the reveal does not scroll when it clears a query) and 4.2 (a gear that opens an empty menu on every unmodified "This browser" row) are failures of bullets of this item. Findings 1.1, 1.2, 3.1 and 4.3 are further departures from it. Every other bullet holds: header with count, clear button and filter menu (Header.svelte), table of contents hidden by class under 700 px (Settings.svelte:77,117,208), group headings with the open control and the local.yml tag (List.svelte), the per-control primitives (Control.svelte), RailEditor and PagesReset without headings, writes through item 1's logic, markup attributes, `refresh(ENGINE_ROOT, pushed)`, only five files asked of `fileText`.
- 3 (the sentences): holds. HELP.md:145 and :216, appearance.yml:62 and :69, options.yml:84 and :89, DESIGN.md:85 and :171 and the Settings head comment are rewritten (shown in `git diff`); `grep` of the removed words finds only Sessions' own `sessions.rail_title`.
- 4 (the tests): holds in letter (rows, search, write, view, fixture, type-scale, NumberInput, TextInput tests exist and pass). The brief's verify item 3 (failing run quoted per new test, in its final form) is not met: Proof findings 2.1 and 2.2.

Cases of the brief's "Cases":

- 1 to 3: met, rows.test.ts:99-133 (value 20, line 2, `set`, not Modified, title `Slurm: Poll min`; `poll_min: 5` Modified; list item by item).
- 4: met, rows.test.ts:134 (family never Modified, `fields` carried).
- 5: met, rows.test.ts:148 (absent: no line; null: `missing`; neither Modified).
- 6: met, rows.test.ts:174 and :190 (`slurm: [` and a duplicate key are `unparsed` with the parser's message; other files unchanged).
- 7: met, rows.test.ts:206 (loading, unreadable, cut, no rows).
- 8: met, rows.test.ts:235 (`localRows(entries)` has no text parameter).
- 9: met, rows.test.ts:250 (`"yes"`, `"20"`, `bar` kept, `mismatch`, Modified).
- 10: met, rows.test.ts:274.
- 11 to 15: met, search.test.ts:86, :150-168, :170-186, :127-148, :121.
- 16: met, rows.test.ts:329-366 (order; `behavior.yml#notes` and `local.yml#notes` distinct).
- 17: met, rows.test.ts:386 (shipped catalog and texts: no row missing, mismatched or Modified; D30's four keys toggle, toggle, toggle, choice).
- 18: met, rows.test.ts:430-488.
- 19 to 21: met, write.test.ts:65-205.
- 22: met, write.test.ts:223. 23: met, :244. 24: met, :273. 25: met, :282.
- 26: met, write.test.ts:309.
- 27: partial. rows.test.ts:490 asserts no file group, seven "This browser" rows and no file asked; it does not assert the count over those seven. The missing part is named in finding 2.3.
- 28 to 33: met, settings.test.ts (each control's markup, list and family summary, local.yml row with `log.asked` excluding `local.yml`, `data-modified` and the bar, default line and `behavior.yml:<line>` link, missing row, loading group).
- 34: met (rail row and arrangements row, neither with `<h3`). 35: met (seven rows under `mocha`, six under `light`). 36: met (reveal keeps the rail row with `@id:slurm.poll_min`; the same query without reveal hides it). 37: met (query drawn in the search box).

## 1. Spec

- 1.1 `src/lib/views/system/workbench/settings/BrowserControl.svelte:72-77`: "const trimmed = text.trim(); if (trimmed === '') setTerminalFont(null); else if (Number.isFinite(Number(trimmed))) setTerminalFont(Number(trimmed));". What is wrong: brief decision 9 says a number field's text is a decimal by the pattern of What to build 1 and that `0x10`, `Infinity` and `1,5` are refused with the message. This box uses `Number()`, so `0x10` (16) and `1e1` (10) are accepted, and `1,5` and `1x` are dropped silently (the box reverts, no message). The decimal rule exists once in `write.ts:26` and is not reused. No test touches this box's parsing. Failure scenario: type `0x10` in the Terminal text size box and press Enter; the store takes 16, where every config number row refuses it. Verdict: item 2 violated.
- 1.2 `src/lib/views/system/workbench/settings/Item.svelte:49`: "if (row.kind === 'browser') return 'browser';" (rendered as `data-control="browser"`). What is wrong: the brief fixes the attribute's values as `toggle`, `number`, `text`, `choice`, `list`, `family`, `rail`, `arrangements`, `none`; `browser` is a value the brief does not name and the report does not list among its decisions. Failure scenario: a test or a later step that selects rows by the fixed vocabulary does not see the seven "This browser" rows. Verdict: item 2 violated (minor).
- 1.3 `src/lib/ui/controls/text/Search.svelte:57` and `src/lib/ui/controls/text/text-menu.ts:65-69`: "oninput={(event) => typedInto(event, oninput)}" and "export function typedInto(event: Event, oninput: (value: string) => void)". What is wrong: neither path is in the brief's list and no item asks for a change to `Search`. The report says it is "the `typedInto` hook the search box needs"; the diff shows `Search`'s own `typed()` replaced by the same four lines moved into a shared helper, with no new behaviour for the search box. `TextArea.svelte:78` and `DateInput.svelte:28` still carry the old inline form, so the dedupe is half applied. Whether the duplication check needed it is not verified (no unedited rerun possible). Failure scenario: a reader of the report believes `Search` gained a capability; a reviewer of `Search` finds an unrelated refactor. Verdict: no item (I would expect none; the nearest is item 2's "`TextInput`, which gains optional `onenter` and `onblur`").
- 1.4 `src/lib/state/system/config/rows.ts:19`, `write.ts:13`, `browser.ts:14`: "import { isEqual } from 'lodash-es';". What is wrong: `lodash-es` is a dependency already (package.json:69) but only the server used it; this is its first client import, and the brief names only `yaml` as the client's new import ("No new dependency", "Libraries checked"). The report does not name it. Failure scenario: the client bundle grows by a library the brief never listed, and the 223,276 byte figure of the report (finding 2.4) is credited to `yaml` alone.
- 1.5 `S3c-report.md:94` "VS Code 1.137.0 against the brief": "Not observed in the running app (the brief forbids browser work)". What is wrong: the brief's "Read" 8 and its Report list ask for each behaviour of What to build 2 checked against the installed app 1.137.0 and "what was seen"; the brief forbids no reading of the installed app (the brief check read `workbench.desktop.main.js` for one constant), and the "Cases" paragraph reserves only presses, focus, scroll and effects for the landing look. The report re-reads `U2-vscode.css:440-616` and says no difference was found in that record, which is not a check of the app. Failure scenario: a behaviour that differs from VS Code (for instance what a click on a table-of-contents group does, see finding 4.4) is unreported. Verdict: none of the numbered items; it is a required report part left undone.

## 2. Proof

- 2.1 `S3c-report.md:15-20`: "Test Files  5 failed | 1 passed (6)  ... Tests  23 failed | 22 passed (45)". What is wrong: the brief asks, for each case, the first run on the unchanged tree, and verify item 3 asks every new test to fail on the unchanged tree in its final form with the failure quoted. The quoted run is of an earlier form of six files (the state suites were split into `tests/state/system/settings/` afterwards, 155 tests exist now), the four state and primitive files fail only by "module missing", and the 22 passing tests are named as existing behaviour. No per-case result is given for cases 1-27; the report states "for those the proof is the mutations", and the mutation table (S3c-report.md:24-31) covers six view behaviours only (data-modified, reveal keep list, wallpaper, toggle label, count, query), none of the rows, search or write logic. I could not reproduce the run or the mutations without editing source. Failure scenario: a defect in `commit`, in the superseded-write guard or in `@id:` matching would not be shown to fail a test by anything the report quotes. Verdicts: cases 1-27 are met on my reading of the tests and my rerun (they pass), not on the failing-first evidence the brief asked for.
- 2.2 `tests/state/workbench/ui.test.ts` (new `describe('the values this browser chose of its own')`): "forgets a wallpaper choice for null" and "forgets a code theme pick for null". What is wrong: on the unchanged tree `setWallpaper` is `save({ ...store.current, wallpaper: on })` and `setCodeTheme` is `isCodeTheme(id) ? id : null`, so both tests give the same result at run time without the change; only `npm run check` (types) would have failed. They are not marked as audits. Failure scenario: the two tests stay green if the null path is removed from the store's runtime code.
- 2.3 `tests/state/system/settings/rows.test.ts:490-505`: "expect(groups.map((group) => group.id)).toEqual(['this-browser']); expect(groups[0].sections.flatMap((section) => section.rows)).toHaveLength(7);". What is wrong: case 27 names "the count over those seven"; no test calls `searchGroups` over that fixture. Verdict: case 27 partial.
- 2.4 `S3c-report.md:68`: "The first client import of `yaml` adds 223,276 bytes to the page node". What is wrong: nodes/2 also holds all the new view code, the zod schemas and `isEqual`; only the whole delta was measured, and my one build gives the "after" size (2,163,694) but not the "before". The decision resting on it is the brief's decision 3 (parse in the client); the figure cannot be attributed to `yaml` alone.
- 2.5 `tests/ui/forms/text-input.test.ts:33-35`: "expect(tagOf({ onenter: noop, onblur: noop })).toBe(tagOf({}));". What is wrong: this is the only test of `TextInput`'s new callbacks; it passes with the callbacks removed from the component. The file header discloses that the callbacks are an audit for the look, and the same holds for `typedInto` (no test) and `NumberInput`'s three tests (value, label, read-only pass-through). Failure scenario: Enter and blur writes (the step's central write path from a field) are covered by nothing before the look.

## 3. Standards

- 3.1 `src/lib/views/system/workbench/settings/Header.svelte:86-88`: ".field :global(input) { flex: 1 1 auto; }". What is wrong: the rule restyles the `input.search` that `ui/controls/text/Search.svelte` declares, which What to build 2 says goes in `tests/checks/tree/allow-styling.ts` with a reason. The check only reads class selectors, so the element selector passes it (`Data.svelte`'s equivalent `.controls :global(.search)` is a held entry there). Failure scenario: the coupling to a primitive's markup is not recorded, and a change to `Search`'s element breaks the header layout with no check naming it. Verdict: item 2 violated (minor).
- Non-ASCII, history in comments, secrets in quoted lines, file and folder sizes (largest new file 289 lines, every folder within ten), public surface without its page (HELP.md and DESIGN.md updated), sentences made false (greps of `Appearance.svelte`, `rail_title`, `reset_title`, `settings_appearance`, `config-files` across src, tests, config, HELP.md, DESIGN.md, README.md): none found. The zod rule for the new readers holds: `typed.ts` (`StateShape`, `QueryShape`, `TypedListShape`, `RevealShape`) and `rows.ts` (`ToggleShape`, `ChoiceShape`, `NumberShape`, `ListShape`, `TextShape`) are plain schemas with no `z.custom`, `.refine` or `.superRefine`; `grep` for those finds none.

## 4. Behaviour

- 4.1 `src/lib/views/system/workbench/Settings.svelte:157-164`: "if (railHidden && query !== '') setQuery(''); list.querySelector(...)?.scrollIntoView({ block: 'start' }); restateInstance(instance.id, withoutReveal(...));". What is wrong: the effect clears the query and scrolls in the same run. The rows the cleared query restores are not in the document until the next flush, so the scroll acts on the list that holds only the kept rail row, and `restateInstance` then removes the ask, so the effect never runs again with `revealing` true to scroll after the redraw. By reading; the browser behaviour is not run here (spec.md:56-57 assigns effects to the look). Failure scenario: a Settings tab holding the query `poll`; the rail's notification action opens it with `reveal: 'rail'`; the query is cleared, the full list is drawn from the top, and the rail list is far below the visible area, where the brief says it is scrolled into view. Verdict: item 2 violated.
- 4.2 `src/lib/views/system/workbench/settings/Item.svelte:133-142` with `Gear.svelte:21-26`: "{#if row.kind !== 'local'} ... <Gear reset={row.modified && (row.kind === 'browser' || settable)} copy={row.kind === 'config'} ...". What is wrong: for a "This browser" row that is not Modified, `reset` and `copy` are both false, `Gear`'s `items` is `[]`, and `Gear` still draws the `Menu` (Menu.svelte has no empty-list case), so the gear button appears on hover and opens an empty list. In a browser with nothing saved all seven rows are in this state. The report does not say that "This browser" rows have no Copy Setting ID. By reading. Failure scenario: hover any of the seven rows on a fresh browser, press the gear: an empty popup. Verdict: item 2 violated.
- 4.3 `src/lib/views/system/workbench/Settings.svelte:167` and `:189-193`: "<Pane title={t('views.settings')}>" and ":global(body.wall) .view { background: var(--chip-on-wall); }". What is wrong: the view before the step was `<Pane ... tinted>`; it now omits `tinted` and paints its own wall background. Before: the pane carried `color-mix(in srgb, var(--panel) var(--wall-panel), transparent)` with a backdrop blur over a wallpaper. After: no blur, and the chip colour fraction only inside `.view`, while Pane's `.body` keeps its 10px 12px padding around the editor and the header strip stays transparent in the terminal shape. The report lists "the pane without `tinted`" as a judgment call with no reason and no before and after. Failure scenario: under a wallpaper theme the Settings view reads differently from every other tinted pane (Catalogue, Pages, Status, Hpc), and the editor is not edge to edge as VS Code's is. This is for the landing look on TEST; no verdict.
- 4.4 `src/lib/views/system/workbench/settings/Contents.svelte:50-58`: "<TreeItem ... expanded={open} ... onclick={() => pick(entry.id)} />" with `pick` removing the group from `closed`. What is wrong: a group row can be closed only with the keyboard (`ontoggle`); the mouse cannot collapse it. The builder lists this as "Not done". No brief line asks for mouse collapse, but the fix inside the step is small (for instance a press on the already-current open group toggles it) and VS Code's table of contents collapses by its twistie. Whether VS Code's group click also expands is not checked (finding 1.5). No verdict; a judgment for Axel and the look.
- 4.5 `src/lib/state/system/config/search.ts:78`: "if (sections.length > 0 || group.status !== 'rows') kept.push({ ...group, sections });". What is wrong: What to build 1 says the result carries "the groups and sections that still hold" a row; a group that is loading, unreadable, cut or unparsed is kept whatever the query (the head comment says so; the report's judgment calls do not). Failure scenario: query `zzz` shows "No Settings Found" with the line "behavior.yml could not be read: 404" still drawn under it, while the table of contents (`tocOf`) lists no such group. Documented in the code, undeclared in the report; no verdict.
- The wallpaper row appears only under a theme with a wallpaper (brief case 35 sanctions it). A browser holding a saved wallpaper choice under a theme without one has a Modified value the view does not list, so `@modified` and Reset cannot reach it until the theme changes.

## Declined to judge

- The six mutations M1-M6 and the first run (`first-run.txt`, `chunks-before.txt`): they need a source edit or a second build; I changed nothing.
- Whether `typedInto` was needed to pass `tests/checks/tree/duplication.test.ts`: an unedited rerun is not possible from here.
- VS Code 1.137.0 behaviours of What to build 2: not checked by me either; the builder did not check them (finding 1.5).
- Presses, focus, scroll-follow, hover and focus-within of the gear, Down and Escape in the search and in a field, the 700 px hide, Enter and blur writes, the reveal effect (findings 4.1 and 4.2 rest on reading): browser-only, for the look on TEST (spec.md:56-57).
- Whether the empty "Not chosen" option of a choice select leaves the select showing "Not chosen" after nothing is written: the brief's case 25 fixes the write, the drawn state is for the look.
- Whether 700 px, the 200 px table of contents and the field widths (420, 320, 200 px) match VS Code: measures are Axel's look.
- The report's reference to the open items at `orchestrator-state.md:111-115`: the list is at lines 140-148 of the state file now; the three entries (Z146, Z147, Z148) match.

Reviewer usage: tokens not measured by the reviewer, about 55 tool uses, minutes not measured.

