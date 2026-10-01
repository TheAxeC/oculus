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


# Step S3c refuter report, repair round 1 (on /Users/axelfaes/workspace/research-hube/.agents/worktrees/S3c, base a157d199)

(Worktree path: /Users/axelfaes/workspace/research-hub/.agents/worktrees/S3c.) Reading order: refute skill and templates/report.md, plan.yaml, the state file's S3c dispatch entry, spec.md, the brief, S3c-round1.md, the first refuter report, the builder's report, plan.md Z153 (line 721) and the state file's Z153 entry (line 173), then `git diff a157d199` and every new file whole. No file in the worktree or the ledger was changed. `npm run diagrams` rewrote docs/diagrams/*; `git status --short | wc -l` printed 43 before and after, the same files. Mutations ran on a copy of tools/oculus under $TMPDIR (node_modules symlinked, config/local.yml excluded, never opened), removed afterwards (`ls $TMPDIR | grep -c s3c` printed 0). Ports 8787 and 8790 and `.vscode` untouched.

## Repair round 1, refuted

```
$ PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH npm run diagrams
(exit 0, 18 files written)
$ PATH=... sh ~/.claude/skills/land/templates/checks.sh .scratch/migration/orchestrator-state.md   (exit 0)
$ npm test              Test Files  377 passed | 20 skipped (397)    Tests  6094 passed | 600 skipped (6694)
$ npm run test:checks   Test Files  29 passed | 2 skipped (31)        Tests  442 passed | 9 skipped (451)
$ npm run check         1790855591956 COMPLETED 2862 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
$ npm run build         nodes/2.B6R9JOhY.js 2,159.67 kB ... built in 11.36s
$ npm run format:check  All matched files use Prettier code style!
$ npm run lint          (no output)
$ ! LC_ALL=C grep -rna '[^ -~]' src tests   (no output)
checks: 7 commands passed
```

Commands the round-1 section quotes, rerun in the same form:

```
npx vitest run tests/state/system/settings tests/views/system/workbench/settings.test.ts tests/ui/forms/number-input.test.ts tests/ui/forms/text-input.test.ts tests/state/workbench/ui.test.ts
  Test Files  8 passed (8)   Tests  167 passed (167)            (report: 8 files, 167: reproduces)
grep -rn typedInto src/lib: Search.svelte:19,57; TextInput.svelte:17,74; TextArea.svelte:17,93; DateInput.svelte:9,34,43; text-menu.ts:66   (report: 4 callers and the definition: reproduces; DateInput calls it twice)
git grep -l lodash-es a157d199 -- src: only src/lib/server/** files; grep -rn lodash-es src | grep -v /server/ : browser.ts:16, rows.ts:19, write.ts:13   (first client import of lodash-es: reproduces)
grep -rhoE "const [A-Z][A-Za-z]*Shape =" src/lib | wc -l: 0   (reproduces)
find .svelte-kit/output/client/_app/immutable -name '*.js' -not -path '*workers*' -exec wc -c {} + | sort -n | tail: nodes/2.B6R9JOhY.js 2159674; chunks/I7Dj73QH.js 2737063   (report "after" figures 2,159,674 and 2,737,063 reproduce; file hashes differ between builds)
perl ASCII gate over src tests config (local.yml excluded); LC_ALL=C grep -nP '[^\x00-\x7F]' HELP.md DESIGN.md S3c-report.md: printed nothing
folder items: src/lib/views/system/workbench/settings 10 (ten-item rule holds; folder size and duplication checks are inside test:checks, green)
```

Mutation table M7 to M23, reproduced on the scratch copy (one-line edit each, the suite named, failing tests quoted). Every row reproduces with the failing tests the report names:

```
M7  decimalOf without DECIMAL        FAIL browser.test.ts "refuses what is not a decimal ..."; write.test.ts "writes nothing for text that is not a decimal number, and says so"
M8  commit choice accepts any word   FAIL write.test.ts "writes nothing for the empty choice or a word ..."; "the write of a row > writes nothing for the empty choice"
M9  superseded guard removed         FAIL write.test.ts "lets the answer of the later write stand ..."
M10 closed guard removed             FAIL write.test.ts "changes nothing for an answer that arrives after the view is closed"
M11 @id: matches all                 FAIL search.test.ts "@id: > keeps the rows ...", "looks at the key path alone ...", "counts the seven This browser rows ..."
M12 @modified off                    FAIL search.test.ts "@modified > combines with a word", "... whatever the case of the word", "counts the seven ..."
M13 Modified always false            FAIL rows.test.ts x3, search.test.ts x2, write.test.ts "resets a Modified row ..."
M14 localRows drops first            FAIL rows.test.ts x2, search.test.ts "drops a group that holds no row ..."
M15 count adds nothing               FAIL search.test.ts x4 (incl. "counts the seven This browser rows ...")
M16 group kept under a query         FAIL search.test.ts "drops a group that holds no row once a query is typed ..."; settings.test.ts "is left out once a query is typed ..."
M17 press toggles a leaf group       FAIL rows.test.ts "leaves a group with no section as it is ..."
M18 wallpaper row by theme alone     FAIL rows.test.ts and settings.test.ts "... while a wallpaper choice is saved"
M19 mapOf answers a copy             FAIL write.test.ts "hands on every key of the state it was given ..."
M20 empty box not given back         FAIL browser.test.ts "gives the size back to the config for an empty box"
M21 gear always drawn                FAIL settings.test.ts "draws no gear on a row whose menu is empty ...", "the machine-local rows > ..."
M22 theme control 'toggle'           FAIL settings.test.ts "names on each row the control it draws, and no other word"
M23 tinted removed                   FAIL settings.test.ts "is a tinted pane, as every view drawn over the wallpaper is"
```

My own mutations, beyond the report's:

```
A  terminalSizeOf reads Number() (the first review's defect)   FAIL browser.test.ts "refuses what is not a decimal ...", "writes -0 as 0"
L  DECIMAL without the exponent                                 FAIL browser.test.ts "takes a decimal, trimmed ..."; write.test.ts "makes a number from decimal text ..."   (R1-A: both places share one rule)
E  canReset ignores modified                                    FAIL settings.test.ts "draws no gear on a row whose menu is empty ..."
F  canCopy always true                                          FAIL settings.test.ts (same test and the local.yml one)
J  This browser rows never Modified                             FAIL rows.test.ts x3, settings.test.ts x3
K  Reset of code theme sets 'tokens'                            FAIL rows.test.ts "marks a saved code theme Modified, and forgets it on Reset", "marks each value ... Reset forgets each"
G  SOLID entry for Item.svelte removed from tests/ui/theme/wall.test.ts   FAIL wall.test.ts "answers every surface a component paints, or names it as solid with its reason"
H  allow-styling DELIBERATE entry removed                        FAIL boundaries.test.ts "lets no view or shell component style a primitive own class"
N  tocOf without its status filter                               all 124 tests PASS (see Standards 3.1)
```

Ruling 7 reproduced: on the base `ui.svelte.ts` in the scratch copy, a test of `setWallpaper(null)` (saved wallpaper becomes null) and one of `setCodeTheme(null)` (saved code theme becomes null) both pass: `Tests  2 passed | 38 skipped (40)`. `isCodeTheme(null)` is false (`data/helpers/code-themes.ts:31`) and `setWallpaper` stores whatever it is given, so the change adds no runtime behaviour there and the removal is right.

Reveal effect, modelled in the client runtime (a `.client.test.ts` copy of the effect's shape over the real ui store, not the component): `setQuery('')` called in the effect's synchronous part gives `RUNS 2 SCROLLS 2`; the same call wrapped in `untrack` gives `RUNS 1 SCROLLS 1`.

VS Code 1.137.0, rerun by reading the shipped files: the pointer handler `if(this.tree.setFocus([c]),this.tree.toggleCollapsed(c,l),n){...}` for a collapsible row is in workbench.desktop.main.js (the Contents press claim reproduces); `categoryFilter!==i&&(this.viewState.categoryFilter=i??void 0,this.renderTree(void 0,!0),this.settingsTree.scrollTop=0)` reproduces; nls.messages.json 18703 "{0} Settings Found", 18706, 18708, 18699, 18701, 18827 "Modified", 18849, 18842, 18855 reproduce. Not reproduced because a second build or the pre-round tree is needed: "Tests 15 failed | 109 passed (124)" (the round's first run), first-run.txt, chunks-before.txt (the 1,940,418 byte "before"), and M1 to M6. The report names `chunks/C7Jv4Oi_.js` as holding zod's library code; that file is not in my build, and the zod markers (`ZodError`, `invalid_type`, `too_small`) are in `nodes/2` only. No decision rests on that name.

## Verdicts

Round-1 rulings, judged for each (done as ruled, closure by removing a check, reach beyond the ruling, closure my rerun does not reproduce):

- 1 (Terminal text size box, one decimal rule): done as ruled, including R1-A. `write.ts` exports `decimalOf`; `commit` and `browser.ts terminalSizeOf` both use it; mutation A and L fail tests. Z153 (a) makes `1e1` read as 10 in the box and in a config row, which the code does (`browser.test.ts` "takes a decimal ..." expects 10).
- 2 (`data-control` vocabulary): done; `Item.svelte` returns `row.control`, and `grep browser` finds no `data-control="browser"` value; M22 fails the view test.
- 3 (`typedInto` once): done as a dedupe; the diff of Search, TextArea, DateInput and TextInput is mechanical (the `typed` function moved to `text-menu.ts:65-69`, same body). Both paths are named in the report. See Behaviour 4.3 for the look.
- 4 (`isEqual`): done; the report names it as the client's first import of `lodash-es`.
- 5 (VS Code checked, Contents press): partly done. The press behaviour is built and tested at the state layer and its VS Code source is reproduced. The check of "each behaviour" is not complete: Spec 1.1.
- 6 (mutations M7 onward, first run restated): done; every row reproduces. The restatement of the first run is accurate (earlier form, six files, cases 1 to 27 only as module-missing load failures).
- 7 (the two `ui.test.ts` tests): done by removal, which the ruling allowed when the change adds no runtime behaviour; I reproduced that it adds none.
- 8 (case 27 `searchGroups` count): done; `search.test.ts:221`, fails under M11, M12, M15.
- 9 (bundle sentence): done; the whole delta (219,256 bytes) is stated and what the node holds is named, with no attribution to `yaml` alone. The "after" figures reproduce.
- 10 (tag-comparison test removed): done; `text-input.test.ts` now holds two tests of preserved behaviour (value and label; secret as dots) and its head comment names Enter and blur as not covered.
- 11 (`Header.svelte` restyle entered): done; `allow-styling.ts` DELIBERATE entry; mutation H fails `boundaries.test.ts` without it. See Standards 3.2.
- 12 (reveal: clear, `await tick()`, scroll, restate): built as ruled and named for the look. See Behaviour 4.1.
- 13 (no empty gear): done; M21, E, F fail the view test.
- 14 (`tinted` kept, own wall rule dropped): done; `Settings.svelte:176` is `<Pane title={t('views.settings')} tinted>`, no `body.wall` rule in the file; M23 fails.
- 15 (empty groups dropped under a query): done; `search.ts:80`, M16 fails two tests.
- 16 (wallpaper row listed when a choice is saved): done; M18 fails two tests.
- 17 (`mapOf` answers `state` itself): done; M19 fails.
- 18 (lower camel schema names): done; `grep -rhoE "const [A-Z][A-Za-z]*Shape =" src/lib | wc -l` prints 0, and the 10 schemas of `typed.ts` and `rows.ts` are lower camel.
- 19 (open items pointer by heading): done; the report names the "Open items" section, and the section it quotes matches `orchestrator-state.md:142-144`, which holds no entry.

R1-B (Item's hover answer removed, `Item.svelte .item:hover, .item:focus-within` added to SOLID in `tests/ui/theme/wall.test.ts`): it follows the established form and does not weaken the check. The SOLID map is keyed on the exact file and selector, with a reason in the words the sessions and card hover entries use ("a hover response, saying which ... the pointer is on"); the check still fails when the entry is removed (mutation G) and fails for an entry that stops being needed (the test compares the two key sets for equality). `tinted.test.ts` forbids a wall surface in a tinted view or its partials, so a `body.wall` answer for the hover cannot coexist with ruling 14; the only way to keep both checks is the exemption. What it changes is the look: the hover over a wallpaper is the opaque `--chip`, the width of a whole item. That is for the landing look, and the report says so.

Items of the brief's "What to build", over the whole diff:

- 1 (rows module): holds. `state/system/config/` holds rows, groups, search, write, browser, typed, messages and the moved config-files; the 155 earlier tests plus the round's tests pass; every write-logic, search and Modified behaviour fails a named test under a mutation (M7 to M20).
- 2 (the view): holds on reading, tests and mutations; the browser-only parts (presses, scroll, hover, Enter and blur, the reveal effect) are for the look. Findings 4.1 to 4.4 are low-severity notes on bullets of this item, and the report's VS Code check is incomplete (Spec 1.1).
- 3 (the sentences): holds. HELP.md:145 and :216, appearance.yml:62 and :69, options.yml:84 and :89, DESIGN.md:85 and :171 and the head comment of Settings.svelte are rewritten (read in `git diff`).
- 4 (the tests): holds. Each new or changed test of an added behaviour has a failing check quoted or reproduced (the report's first-run lines; my mutations A, E, F, G, H, J, K, L, M7 to M23). The tests of `typedInto` do not exist (Behaviour 4.3).

Cases of the brief's "Cases" (all rerun, passing):

- 1 met (rows.test.ts:101), 2 met (:112), 3 met (:118), 4 met (:136), 5 met (:150, :162), 6 met (:176, :192), 7 met (:208), 8 met (:237), 9 met (:252), 10 met (:276).
- 11 met (search.test.ts:86), 12 met (:153, :159), 13 met (:170, :179), 14 met (:127, :133), 15 met (:121).
- 16 met (rows.test.ts:331, :350), 17 met (:388), 18 met (:432, :466, :477).
- 19 met (write.test.ts:65, :76, :85, :123), 20 met (:130, :141), 21 met (:149), 22 met (:223), 23 met (:244), 24 met (:273), 25 met (:102, :282), 26 met (:309).
- 27 met (search.test.ts:221 counts 7, 1 and 0 over the browser-only fixture, with rows.test.ts:501 for the no-file-group half). The first review's "partial" is closed.
- 28 met (settings.test.ts:425), 29 met (:464), 30 met (:494, with `log.asked` excluding local.yml at :756), 31 met (:526), 32 met (:539, :550), 33 met (:565, :573), 34 met (:614), 35 met (:636, :655), 36 met (:730), 37 met (:399).

## 1. Spec

- 1.1 `S3c-report.md`, section "VS Code 1.137.0 against the brief", last two bullets: "Boolean setting: the class `setting-item-bool` is in the css; that its label is the description was not verified." and "Escape in a field reverting its text, and the number box's `inputmode`: no string searched found them ... were not checked against VS Code." What is wrong: ruling 5 asked for each behaviour of What to build 2 to be checked in the shipped source with the string searched. These are left unchecked with no string named, and the check was feasible. One `grep -o` for `setting-item-bool-control` in workbench.desktop.main.js shows the boolean row is built as `.setting-item-value-description` holding `.setting-item-bool-control` (the checkbox) and `.setting-item-description` side by side, which is what the brief's "label is the description" assumed. `Edit in settings.json` is nls message 18844, the VS Code counterpart of the list and family "Edit in <file>" row, and the report does not mention it. Failure scenario: a difference between oculus's boolean, list or family rows and VS Code's stays unreported, and the report's "Not done" line does not list the unchecked behaviours. Verdict: none of items 1 to 4 (a required report part left partly undone).

## 2. Proof

none. (The earlier findings 2.1 to 2.5 are closed: mutations reproduce; the two `ui.test.ts` removals are right; case 27 is met; the bundle sentence states the whole delta; the tag-comparison test is gone.)

## 3. Standards

- 3.1 `src/lib/state/system/config/groups.ts:137`: ".filter((group) => !searching || group.status === 'rows')". What is wrong: since ruling 15, `searchGroups` drops every group with no row under a typed query, so this filter can no longer remove anything for the view's input, and no test reaches it (my mutation N, which deletes the line, leaves all 124 tests passing). The `searching` argument of `tocOf` is kept for a rule that now lives in `search.ts`, and `rows.test.ts:370`'s title ("only those with a row when searching") promises a check that its fixture does not exercise. Failure scenario: a later change to `searchGroups` that keeps a group again would be caught by the search test, not by this filter, so the filter protects nothing, and a reader of `tocOf` believes it does. Small enough for landing: delete the line and the argument, or test it.
- 3.2 `tests/checks/tree/allow-styling.ts` (new DELIBERATE entry for `Header.svelte .field :global(.search)`): "why: 'the Settings header gives the search input the width left in its row ...; Search has no prop for its width'". What is wrong, as a judgment for the orchestrator: ruling 11 said to enter it "as `Data.svelte`'s entry is", and `Data.svelte`'s entry is in HELD, which the file defines as a coupling "to undo by giving the primitive the prop it is missing". The builder used DELIBERATE, defined as a rule the primitive "cannot carry itself", and its own reason says only that `Search` has no width prop. The check passes either way (and fails without the entry: mutation H). Failure scenario: a coupling that a `Search` prop would remove is recorded as deliberate and nobody revisits it. No verdict.

## 4. Behaviour

- 4.1 `src/lib/views/system/workbench/Settings.svelte:158-173`: "async function showRail(area, hidden) { if (hidden) setQuery(''); await tick(); ... }" called as "void showRail(area, hidden);" inside the `$effect`. What is wrong: the report (ruling 12) says the effect reads `railHidden` and `query` untracked "so the cleared query does not run it again". `query` and `railHidden` are untracked, but `setQuery` itself reads `ui.instanceState(instance.id)` in the effect's synchronous part, so the effect depends on the store it then writes. A client-runtime model of exactly this shape ran the body twice (`RUNS 2 SCROLLS 2`); wrapped in `untrack` it ran once. Failure scenario: a Settings tab with the query `poll` opened by the rail's Settings choice scrolls to the rail row and restates the instance twice. The second pass sees an empty query, so both end on the same state and nothing visibly goes wrong; the stated reason is simply wrong, and the cost is a second scroll. By model, not by the component; the effect in a browser is for the look. Fix: `untrack(() => void showRail(area, hidden))`. No verdict.
- 4.2 `src/lib/views/system/workbench/settings/Contents.svelte:31`: "{ id: entry.id, parent: null, open }" for every group, including a group with no section ("This browser"). What is wrong: ruling 5 makes a press on a group with no section leave it as it is (`pressedGroups`), but the tree's keyboard (`ontoggle={toggle}`, `toggledGroups`) still closes it on Left, because `open` is passed for a row that has no children (`tree-keys.ts` says `open` is omitted for a row that does not open). Failure scenario: focus "This browser" in the contents and press Left: its `aria-expanded` turns false with nothing to collapse, where the mouse does nothing. By reading; keyboard behaviour is for the look. No verdict.
- 4.3 `S3c-report.md`, section "For the landing look", against `src/lib/ui/controls/text/text-menu.ts:65-69` and its four callers: "export function typedInto(event, oninput) { const typed = boxValue(event); if (typed !== null) oninput(typed); }". What is wrong: ruling 3 moved the input handler of Search, TextInput, TextArea and DateInput (the last two outside the brief's paths) onto one function. By reading it is the old `typed` unchanged, but no test reaches it (`boxValue` needs `HTMLInputElement`, which the unit suite lacks) and the look list names only the Terminal text size box, Enter and blur. Failure scenario: a regression in `typedInto` would stop every text box in the app from reporting what is typed, and nothing before the look would show it. Add typing into those four boxes to the look list. No verdict.
- 4.4 `src/lib/views/system/workbench/settings/Item.svelte:209-212` and `:269-275`: ".item:hover, .item:focus-within { background: var(--chip); }" and "code { background: var(--chip); ... }". What is wrong: both use the same token, so in a theme without a wallpaper the inline code spans of a description lose their chip while the item is hovered or focused (under a wallpaper `code` is transparent at `:277`). Failure scenario: hover a row whose description holds backticked words. For the look; not stated in the report. No verdict.

## Declined to judge

- Everything that runs in a browser: presses and keys in the contents, the hover and focus gear, Down and Escape, Enter and blur writes of the boxes, the reveal effect in the component, the 700 px hide, the hover surface over a wallpaper (R1-B) and the pane without its own wall rule (ruling 14), per spec.md "A behaviour that needs a DOM". Findings 4.1 and 4.2 rest on a model and on reading.
- The round's first run ("Tests 15 failed | 109 passed (124)"), `first-run.txt`, `chunks-before.txt` (the 1,940,418 byte "before"), M1 to M6: the pre-round tree or a second build is needed, and the worktree may not be edited. The mutation rows and my own mutations stand in for the round's first run.
- Which part of the 219,256 byte growth belongs to `yaml`, `isEqual`, zod and the view code: not measured by the builder or by me; ruling 9 only asked for the whole delta and what the node holds.
- Whether `Search`'s edit reaches beyond the dedupe in any browser path: by reading it is the same function; the DOM path is for the look.
- VS Code behaviours beyond those I grepped (bool row markup, nls 18844, the pointer handler, the nls indices): the number input's `inputmode` and the Escape revert are oculus's own per the brief; I found no VS Code counterpart and did not search further.

Reviewer usage: tokens not measured by the reviewer, about 75 tool uses, minutes not measured.


## Closed

First run (Spec 1.1 to 1.5, Proof 2.1 to 2.5, Standards 3.1, Behaviour 4.1 to 4.5 and the wallpaper note): each sent to the builder as a ruling of `agents/briefs/S3c-round1.md` (rulings 1 to 16) and judged done by the run over round 1; 1.1's `1e1` booked as Z153.

Run over round 1, each closed at landing on main:
- Spec 1.1: the boolean row's markup the reviewer read in VS Code 1.137.0 (`.setting-item-value-description` holding `.setting-item-bool-control` beside `.setting-item-description`) is what the brief assumed; `Edit in settings.json` (nls 18844) is the counterpart of the list and family "Edit in <file>" row. Recorded in the booking; no code change.
- Standards 3.1: `tocOf` in `state/system/config/groups.ts` lost its `searching` argument and the filter `searchGroups` already applies; its caller in `Settings.svelte` and the test title in `rows.test.ts` follow.
- Standards 3.2: `ui/controls/text/Search.svelte` gained a `fill` prop (the box takes the width its row leaves free); `settings/Header.svelte` and `views/sources/data/Data.svelte` use it in place of their `:global(.search)` rules, and both entries left `tests/checks/tree/allow-styling.ts`.
- Behaviour 4.1: the reveal effect in `Settings.svelte` runs `showRail` inside `untrack`, so the instance state `setQuery` reads does not run it again.
- Behaviour 4.2: `settings/Contents.svelte` gives a group with no section no `open` in the tree's rows and no `expanded` when drawn; a view test asserts it, failing with the old rows (`expected ... not to contain 'aria-expanded'`).
- Behaviour 4.3: typing into the search box and the Terminal text size box (both through `typedInto`) checked in the look on TEST.
- Behaviour 4.4: seen in the look (a hovered row's code words lost their chip); `settings/Item.svelte` gives a hovered or focused row's `code` the `--line` background, seen fixed in the look.
