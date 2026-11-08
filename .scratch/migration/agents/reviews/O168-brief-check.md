# Step O168 brief check (on main at 195d655fa)

The report of the fresh agent of the `spec` skill's "Steps / The brief check", on `agents/briefs/O168.md`. A page this report cites (the rules file, a standard, a skill's text) is named with its section, never with a line number, since a page's lines move and a section's name does not. A line of code or a hit of a grep keeps its `file:line`.

The brief was read on main at 884db6915. Main is now at 195d655fa. `git show --stat 195d655fa` lists only ledger files (`O169-round1.md`, `O169-refuter.md`, `O169-report.md`, `orchestrator-state.md`, `queue.md`), so the tree the brief reads is unchanged.

The report is written in the rules file's character set.

## 1. Names

How the path list was read: `utils/outside-paths.mjs`'s own `sectionOf` and `entriesOf`, run on the brief by a case-run program (`node entries.mjs O168.md`, in the scratchpad), print 131 entries. `covers()` was then run on the paths below (`node cover.mjs O168.md <paths>`).

- **The diagrams entry.** The bullet "the generated diagrams `docs/diagrams/*.dot` and `*.svg` ..." produces one entry, `*.svg`. That entry has no `/`, so it covers only a path named literally `*.svg`. `docs/diagrams/*.dot` is not read at all, because it follows "the generated diagrams " and not a list place, and `covers()` does no globbing anyway. The run prints `docs/diagrams/layers.dot OUTSIDE` and `docs/diagrams/layers.svg OUTSIDE`. Two new modules (`Pill.svelte`, `plural.ts`) and new imports will change the layer diagrams, so verify item 6 would print them.
- **Brief line 82.** It ends "`.../scopes/ScopeBar.svelte`- `docs/HELP.md` (`:130`, ...)": two bullets are run into one line. The helper still reads `docs/HELP.md`, but the brief's own rule "One path per line" is broken.
- **The `_one` pairs and the other count pairs**, against `grep -rln -E "_one['\"]" src`, `grep -rln -E "count === 1 \?" src` and a scan for any comparison with 1 or 2 that has two catalogue keys within four lines (`node picks.mjs`):
  - `src/lib/state/system/machine/refactor/notice-words.ts:13`: `return t(\`source.${key}\`, ...words);`. This reads `source.lsp_edit_partial_one` and `source.lsp_edit_typed_one` (`config/text/views/sources/source.yml:153,159`) by notice name, from `LSP_EDIT_NOTICES` (`src/lib/data/prose/text-edits.ts:224,230`). Turning those pairs into maps makes this read false. The run prints OUTSIDE.
  - `src/lib/views/system/workbench/editors/Fold.svelte:49-54`: `count === 1 ? t('settings.fold_field') : t('settings.fold_fields', count)`, and the same for `fold_entry` and `fold_entries` (`config/text/views/system/workbench.yml:53-56`). Item 5's sweep covers this pick, but the file is OUTSIDE.
  - `src/lib/state/sources/search/words.ts:18-31`, and `replaceQuestion` below it: picks between `search.count_1_1`, `count_1_n`, `count_n_1` and `count` (also `replace_ask_1_1...`) on two counts, hits and files (`config/text/views/sources/search.yml:95-97,135`). The file is OUTSIDE. The helper item 5 specifies takes one count, so nothing in the brief says what shape a two-count sentence takes. Item 5 neither lists nor excludes these picks.
  - `src/lib/views/boards/focus/CommandCenter.svelte:121`: `if (months === 1) return t('focus.command.next_month')`, else `in_months`. "next month" names the month in place of a number, so Decision 5's exclusion probably covers it. Not counted as a finding.
- **Tests that read a key the change folds into a map** (none is in the list; each prints OUTSIDE where run):
  - `tests/state/workbench/navigation/pages.test.ts:51,97,110,174`: `t('ui.tab_close_dirty')`.
  - `tests/shell/panes/strip/app-editor-close.test.ts:124,133,142`: `t('ui.tab_close_dirty')`.
  - `tests/shell/panes/strip/tab-menu.test.ts:146,157,168`: `catalog('ui.tab_close_dirty')`.
  - `tests/state/system/apps/flows.test.ts:172`: `t('apps.remove_secrets', '/apps/notes', '2')`, the bare partner of `remove_secrets_one`.
  - `tests/state/system/lsp/edits.test.ts:280`: `notice: 'lsp_edit_typed_one'`.

  The commands were `grep -n -E "tab_close_dirty" tests/...` and a loop of `grep -rln -F "'<key>'" tests` over all 170 keys of the pairs (`node keys.mjs`). Each of these tests becomes false.
- **The category row's `label`**, against `grep -rn -E "categor[a-z]*\??\.label|..." src` and `grep -rn -E "\.categories\b|categoriesOf\(|categoriesBy\(" src`:
  - `src/lib/state/workbench/rail-badges/rail-badges.svelte.ts:335`: `[{ count, label: category.label, color: toneOf(category.color) }]`, the board tab's cells, drawn as `views.badge_cell: '{0}: {1}'`. Open item 716's option (a), the option Axel chose (`orchestrator-state.md` line 210), names this place among those that "pick the category". The file is OUTSIDE.
  - `src/lib/state/boards/board/facets.ts:349`: `label: one.label` in `cardSections`, the source of the section heading. Option (a) names `facets.ts:346-351` and `:236`. The file is OUTSIDE.
  - `config/options/catalogs/vocab.yml:325`: `label: the words the category is drawn with`, the Settings form's field list for `categories`. Option (a) says "the field list of `config/options/catalogs/vocab.yml:318-326` describes `label` as that map". The file is OUTSIDE. The Settings editor's control for that field is a text control by default (read; no run).
  - Tests that assert the shipped text label:
    - `tests/data/sources/config/layers/hub-vocab.test.ts:110-114,140-145`: `label: 'idea'`, and a hub row `label: idea` whose findings list would grow. This is G126.
    - `tests/server/edit/config-value.test.ts:232-237`: `label: 'idea'`.
    - `tests/data/shapes/catalog-files/vocab.test.ts:339-340`: a row `label: X` that expects the colour finding only. This is G13.

    All three print OUTSIDE, and all three become false.
- **Item 3's header rule** (underscores as spaces, first letter a capital) already exists as `wordOf` in `src/lib/state/system/config/rows.ts:213-216` ("One word of a key path as a title: underscores read as spaces, the first letter capital."). The rules file's principles section says a rule exists once and is reused. The file is OUTSIDE, and the brief does not name the existing function.
- **`HubVocab` gains `new_project_dir`.** `tests/data/helpers/hub-names.test.ts:273-280` builds a full `HubVocab` literal (`grep -rln venue_themes tests src`). A required field breaks the type check there. The file is not in the list.
- **`findingText`** (`src/lib/data/helpers/finding-text.ts`) is the third reader of catalogue words, after `t()` and `words()`. It reads `findings.words.slots_one` at `value-words.ts:132`. Item 5 makes only `t()` and the server's `words` use the helper. `value-words.ts` is in the list, so a direct call can close it. Not counted as a finding.

Findings:
1. The diagrams entry is not read: `docs/diagrams/*` prints OUTSIDE.
2. Line 82 joins two bullets.
3. `notice-words.ts`, `Fold.svelte` and `search/words.ts` are needed and missing, and the two-count picks of `search/words.ts` have no shape in the brief.
4. Five test files that read folded keys are missing.
5. `rail-badges.svelte.ts`, `facets.ts` and `config/options/catalogs/vocab.yml` are missing, although open item 716's chosen option names each one.
6. Three test files that assert the shipped text label are missing.
7. The existing `wordOf` in `rows.ts` is not named, and its path is missing.
8. `hub-names.test.ts` is missing if the new field is required.

## 2. The step line

- "list mode draws a group's column header once, above its first row, and no row shows above the sticky section heading": item 1. Item 1 adds "and stays under the section's sticky heading while the group scrolls". Neither the step line nor a ruling asks for that. It reverses the documented design at `BoardList.svelte:13-15` ("The table's header row scrolls with its rows"). It may also be what the user saw, since a header that sticks inside a group shows above rows in the middle of that group. The state file's standing demand says every item names its source.
- "New project for a hub that is not the primary offers that hub's `new_project_dir`": item 2.
- "the Funding list in a narrow pane gives the Title its width before empty columns, and its headers share one casing": item 3.
- "the record page's count row is the Pillars strip's pill buttons": item 4.
- "a count of one takes the singular ... through one plural mechanism, the CLDR plural forms as YAML maps in each category's `label:` and every `_one` pair of `config/text`, with one helper in place of the code's hand-written picks": item 5.
- "People, Tasks and entry cards draw the project page's layout in place of a raw field dump": item 6.
- Ruling 716 (`plan.md` Rulings, "Open item 716"): "`other` is required and a missing form falls back to it". Item 5 states the fallback ("says `key.other` where the language has no word for that category"). It states no requirement that a text map or a `label` map lacking `other` is refused or reported.
- The option Axel chose, as raised (`orchestrator-state.md` line 210), also says three things that have no requirement in the brief:
  - "a key that is not one of the six is a finding naming the row";
  - the board tab's cells (`rail-badges.svelte.ts:335`) pick the category;
  - the options field list describes `label` as the map, and "`vocab.yml`'s comment and `docs/HELP.md` name the key". The brief has the HELP.md path but no requirement for it.

Findings:
1. Item 1's sticky requirement has no source and may contradict the line.
2. Ruling 716's "`other` is required" has no requirement.
3. Option (a)'s finding for a key outside the six, its rail-badge cells, its options field list and its HELP.md line have no requirement.

## 3. Premises

- Step line, Step 0 and rulings: `grep -n '^- O168' plan.md` gives 1725. Step 0 is at 1726, "Look flaws" at 3649 and "Open item 716" at 3635. Matches.
- Item 1: `sed -n` of `Projects.svelte:309-321,395-405`, `GroupHead.svelte:219-222` (`position: sticky; top: var(--group-above); z-index: 2`), `BoardList.svelte:13-15,96-104` (`overflow: hidden`), `Table.svelte:107-111` (`top: var(--group-strip, 0)`) and `Collection.svelte:386-394`. Matches.
- Item 2: `NewIdeaForm.svelte:85-93` (`startFolder`), head comment `:18-21`, `selectors.svelte.ts:818` (`newProjectFolder`), `:826-835` (`offersNewProject`, `hubVocabs()`), `new-project.ts:113`, `takes.ts:136` and `manifest.ts:699-700` (`config.newProjectDir[tier]`). Matches. `hubVocabOf` is at `src/lib/data/index.ts:714` and `hubVocabs` at `:785`.
- Item 3: `EntryList.svelte:55-57`, `table-rows.ts:64`, `index.ts:185-213`, `collection.yml:57` (`title_column: Title`), and the research hub's `funding.yml` schema (`sub` "Subtitle", `cv_section` "CV section", `funder`, `status`, `deadline`, `award` with no label). Matches.
- Item 4: `RecordCounts.svelte` (PressBox, ToolButton plain, Tag; `board.record_count` at `:46-48`), `Disclosure.svelte` (`--line` border, `--radius-pill`, `--chip`, `--accent` hover, bold count, marker, `body.rice`), `vocab.yml:270-277` and `card.ts:242-244`. Matches.
- The plural mechanism:
  - `grep -rn --exclude=local.yml -E '^\s+[a-z_]+_one:' config/text | wc -l` gives 95, in 28 files.
  - `node pairs.mjs` gives "bare pairs 75" and the partner list exactly as the brief gives it.
  - `count === 1 ?` gives 18 sites, `=== 1 ?` gives 69, and `_one['"]` gives 101 references in 59 files.
  - `t()` is at `text.ts:72`, `flattenText` at `merge/text.ts:145`, `words` at `server/core/words.ts:18`, and `locale: en` at `appearance.yml:69` (line 8 of `sed -n 62,72p`).
  - The research hub's `.oculus/config.yml` sets no `categories:` and no `text:` (`grep` printed nothing). No other workspace hub has a `.oculus/config.yml` (`ls ~/workspace/*/.oculus/config.yml`).

  All match.
- Item 6: `EntryCard.svelte:304-311`, `drawnFields` at `index.ts:461-487`, the unnamed fields with raw `label: field` at `:475-485`, and `CardDetails.svelte` (RecordField labels, CodeText, DISSEMINATED IN presses). Matches.
- Files shared with other steps: `node entries.mjs` on `O167.md` and `O169.md`, compared with this list, gives exactly the files the brief names (`index.ts`, `GroupHead.svelte`, `StatusBar.svelte`, `Header.svelte`, `ScopeBar.svelte`, `focus.yml`, `workbench.yml`, `present.yml` for O167; `source.yml`, `terminal.yml`, `hpc.yml`, `ScopeBar.svelte` for O169). Matches.
- `ls docs/adr` gives "No such file or directory". Matches.
- The state file's standing demand of the 2026-10-04 pass requires "What is on the tree" to list the `DESIGN.md`, `HELP.md` and `README.md` paragraphs and head comments that describe the behaviour changed. `grep -n -i -E "new_project_dir|count button|entry page|..." docs/HELP.md README.md` finds `docs/HELP.md:124` (New project and `new_project_dir`), `:130` (count buttons) and `:396` (an entry's page "laid out as a project's page"). The brief lists none of them. It lists two head comments (`NewIdeaForm`, `BoardList`). There is no `DESIGN.md` at the repository root (`ls`).

Findings: every premise reproduces. The brief does not list the HELP.md paragraphs (`:124`, `:130`, `:396`) that the standing demand asks for.

## 4. Cases and checks

- C1 and item 1: "find the whole cause by your own runs (a case-run program, or reading the computed layout rules) ... and name the cause in the report".
  - The state file's standing demand "Rounds and briefs carry known fixes only" says a brief "never asks the builder to find a cause"; a row whose cause the read does not settle carries the symptom, what the read found and the behaviour, "and the builder fixes it". The wording "find the whole cause" is the wording that demand forbids.
  - The rules file's "What every package obeys" says a builder drives no browser. Computed CSS layout cannot be run by a case-run program without one, so only reading remains.
- C2 to C4 and C6 are consistent with the rules file.
- C5 and the test paragraph: "Checked by tests under G130, G124 and G24 as their entries' text allows".
  - G130's text ("a key the language lacks shows the English word ...") says nothing of a plural pick, a CLDR category, or the fallback to `other`.
  - G124's text names "a word the hub does not hold, a row with no `color` and a row with no key" and no label shape.
  - The rules file says a test exists only as the test of an entry that names it, and that "A step that needs a new entry stops and asks Axel for it". The brief leaves the builder to find this mid-build.
- "a test the change makes false is changed only where its entry's text names the new behaviour, and otherwise reported": the tests listed in section 1 read a renamed key or assert the old label shape. Their entries do not name the plural behaviour, so they would stay red. Verify item 1 needs `test:quick` to print "every command passed". The two cannot both hold.
- The path list names `docs/HELP.md`. The rules file's "What every package obeys" says no step adds to or rewrites `docs/HELP.md` "except the step whose brief is to write them and a line Axel ruled into a step's brief". The brief dictates no such line and has no requirement for it (see section 2).
- The folder rule (rules file, "What every package obeys", at most ten tracked items; `utils/folder-check.sh`):
  - `git ls-tree --name-only HEAD src/lib/ui/controls/ | wc -l` gives 10.
  - `git ls-tree --name-only HEAD src/lib/data/helpers/ | wc -l` gives 10.
  - The brief puts new files in both (`src/lib/ui/controls/Pill.svelte`, `src/lib/data/helpers/plural.ts`), which makes 11 each and fails the size check. A split needs paths the list does not hold.
- No case asks the builder to start a server or open a page. Every "at the look" case is the orchestrator's, as the brief states.
- No case asks the builder to check, quote or explain a place the step does not change.

Findings:
1. Item 1 and C1 ask the builder to find the cause, against the standing demand, and suggest a run the rules file does not allow.
2. C5's tests have no entry whose text names the plural pick or the label finding.
3. The rule on tests made false conflicts with verify item 1 for the eight test files of section 1.
4. `docs/HELP.md` in the list conflicts with the rules file.
5. `Pill.svelte` and `plural.ts` break the ten-item folder rule.

## 5. The question

- Item 1 / C1 (reading, the cause run, the look): no; the look shows the drawn result. Reading alone could pass.
- Item 2 / C2 (case-run over the per-hub words and start folder, look up to the write): no for the case given. It could pass for a hub whose `new_project_dir` value is wrong-shaped, where the client and the server could disagree; that input is not a case.
- Item 3 / C3: no for Funding. Yes for "every collection's list", which only the look covers.
- Item 4 / C4 (reading, look side by side): no.
- Item 5 / C5 and verify item 4. Yes, verify item 4 could pass without the goal:
  - The two greps catch only keys that end `_one`.
  - The pairs with other names would pass both greps unconverted: `pillars.project`/`projects` (`card.ts:243`), `repositories.ago_*` (`file-git.ts:128-142`), `latex.problem`/`problems` (`Main.svelte:129`), `focus.command.manifest`/`manifests` (`CommandCenterView.svelte:97`), `ui.tab_close_dirty`/`tabs_close_dirty` (`pages.ts:133`), `settings.fold_*` (`Fold.svelte:49-54`), `files.problems_one_title`/`problems_title` (`decorations.ts:180`) and the search two-count keys.
  - C5's helper tests pass with the helper correct and the sites left.
- Item 6 / C6 (look): no.

Findings: verify item 4 could pass with every pair not named `_one` left as a hand-written pick. The brief has no check that enumerates those sites (the scan `node picks.mjs` above lists them).

## 6. Implied inputs

A code step. The inputs below are implied but missing from "Cases":

- A `locale` that `Intl.PluralRules` refuses.
  - `node -e` prints `"en_US" throws RangeError` and `"" throws RangeError`. An app's `languageId` with an underscore would make every count word throw.
  - Expected: no throw. The pick uses the English rules, and the locale is reported as G130 reports a locale no app gives.
- A `label` map with no `other`, a map with a key outside the six CLDR categories, a map whose value is not text, and a row with no `label` at all.
  - Today a row with no `label` reads its key (`categories.ts:78`), and the shape is `label: text.optional()` (`catalog-files/vocab.ts:323`).
  - Expected, per ruling 716 and option (a): no `other` is a finding naming the row; a key outside the six is a finding naming the row. The brief must say whether a row with no label is still read by its key or is a finding.
- A text-catalogue map with no `other`.
  - Expected: a finding naming the file and key (ruling 716: "`other` is required").
- A catalogue group that already holds a key named like a plural category: `file.other` (`config/text/views/sources/file.yml:16`) and `editor.other` (`config/text/views/boards/editor.yml:18`), from `grep -rn -E "^\s+(zero|one|two|few|many|other):" config/text`.
  - Expected: read as ordinary keys, with no plural finding. This is the colliding case the standing demand asks for, for each key a step introduces.
- A folded key read with no count by a dynamic read: `noticeWords` in `notice-words.ts:13`.
  - Expected: the notice carries its count and the form is picked. No "text key not in config" throw.
- The locale the server's `words` picks by. `words(catalog, key, ...args)` (`server/core/words.ts:18`) receives no locale.
  - Expected: the server's pick follows `settings.locale`, as G130 says "every word the server gives follows the language".
- Item 2: a non-primary hub whose `new_project_dir` value is wrong-shaped (a G13 finding), or names none for the tier.
  - Expected: the start folder is what the server would write by. Empty and refused for none; the default after a finding.
- Item 6: a `related:` id that names no project, or one that resolves in another hub.
  - Expected: the brief must say what an id with no record draws, since "never as a raw id" leaves no answer.

Findings: each input above is missing from "Cases".

## 7. ADRs

- No record: `ls docs/adr` gives "No such file or directory", and the configuration block has no `adr` key (`grep -n adr orchestrator-state.md` printed nothing).

Findings: none.

## 8. Dictated text

The brief dictates no line of file text. It gives examples and rule outputs, each read against the rules file's prose rule:

- `{ one: '...', other: '...' }` (`grep -n -o -E "\{ one: [^}]*\}" O168.md` gives 30): a placeholder for the shape. Holds.
- `{ one: publication, other: publications }` and `{ one: "in review", other: "in review" }` (line 31): example `label` values. Holds; lowercase matches the existing labels.
- `cites` = `{ one: '1 citation', other: '{0} citations' }` (line 43): a test fixture. Holds.
- "Funder", "Status", "Deadline" (line 27) and "1 publication", "1 project", "1 citation" (line 32): outputs of a rule, not text for a file. Hold.

Findings: none.

## Declined to judge

- The whole cause of item 1's symptom. Settling it needs a rendered page, which a read and a rerun cannot give.
- Whether the payload key `new_project_dir` added to `HubVocab` is a user-visible wire shape that needs a ruling. The brief names it; whether page-internal payload keys count as "a wire format" in the rules file's sense is the orchestrator's call.
- Whether the Settings view's `categories` editor needs code changes beyond `config/options/catalogs/vocab.yml` to edit a map-valued `label`. That was not traced past the options catalogue.
- Whether the section heading "idea" becoming "ideas" (stated in option (a) as raised) needs naming to Axel. Option (a) says it, and Axel chose (a).

Agent usage: ac49bd723d867d915, claude-opus-5-5, 271802 tokens, 112 tool uses, 14.5 min.

## Closed (the session's change to the brief for every finding above, and each dictated line added after the check, made before the preparation commit)

The brief was rewritten on main at e93fe50e3, after O169 landed; its "What is on the tree" was read again there (the line numbers of `plan.md` moved: the step line 1725, Step 0 1726, the widened line 1727, ruling 716 at 3637, "Look flaws" at 3651; the counts 95 keys in 28 files, 18 `count === 1 ?`, 59 files with 101 `_one` reads hold; `=== 1 ?` is now 70, the new hit `submit-job.svelte.ts:207`, a length check).

- Names 1 (the diagrams entry): the path list names `docs/diagrams/` as one folder entry, which `covers()` reads (`utils/outside-paths.mjs:115`).
- Names 2 (line 82 joins two bullets): the path list is one path per line, and `docs/HELP.md` is no longer in it (Cases 4 below).
- Names 3 (`notice-words.ts`, `Fold.svelte`, `search/words.ts`): the three are in the path list and named under "What is on the tree", item 5 says `noticeWords` carries its count, and Decision 6 gives the two-count sentence its shape (one sentence key with two slots, each filled from its own plural key picked by the helper).
- Names 4 and 6 (eight test files): the five key tests and the three label tests are in the path list, with the other candidates a grep of the folded keys and of a category row's text `label` finds (`boards.test.ts`, `deck-hub.ts`, `schema-rules.test.ts`, `hub-settings.test.ts`, `board-new-project.test.ts`, `hub-words.test.ts`, `normalise.test.ts`, `collections.test.ts`, `board-rules.test.ts`, `hub-facets.test.ts`); the test paragraph says such a test is carried to the new name or shape with no row added, as the rules file asks of a changed name.
- Names 5 and The step line 3 (`rail-badges.svelte.ts`, `facets.ts`, `config/options/catalogs/vocab.yml`): the three are in the path list, named under "What is on the tree", and item 5 says the tab's cells read the form for their count, the headings read `other`, and the field list and the Settings form describe and write the map.
- Names 7 (`wordOf`): `wordOf` now lives in `src/lib/state/shared/words/key-titles.ts:7`; items 3 and 6 use it, and the brief names it under "What is on the tree".
- Names 8 (`hub-names.test.ts`): in the path list; item 2 names the `HubVocab` literal under "What is on the tree".
- The step line 1 (the sticky requirement): item 1 drops it; the header row scrolls with its rows, as `BoardList.svelte`'s head comment says, and every requirement of the item is the step line's.
- The step line 2 (`other` required) and The step line 3 (a key outside the six): item 5 says the whole-file shapes report a map with no `other`, a key outside the six (named with its row) and a text `label`, as G13 says; C6 holds the rows; a row with no `label` reads its key (Decision 3).
- The step line 3 and Cases 4 (`docs/HELP.md`): the rules file's rule on names and documents lets no step rewrite `docs/HELP.md` but by a line Axel ruled, and ruling 716 as booked in `plan.md` names no HELP.md line; HELP.md is out of the path list, and `:124`, `:130`, `:396` and `docs/data-map.md` are named under "What is on the tree" as sentences the report names with file and line when the change makes them false.
- Premises (the HELP.md paragraphs): named under "What is on the tree", as above.
- Cases 1 (item 1 asks for the cause): item 1 and C1 now carry the symptom, what the read found (the header row sticking inside the `overflow: hidden` box) and the behaviour; no cause run, C1 checked by reading and at the look.
- Cases 2 and 3 (C5's entries; tests made false): tests are written only under G13 (C6, the label and map finding rows, whose entry text names a part a whole-file shape refuses) and G24 (C7), and the G28 fixture of item 10; the plural pick is checked by a case-run program (C5); a test another entry holds that the change makes false is carried by rename, so verify item 1 can pass.
- Cases 5 (the folder rule): no new file; the helper goes into `src/lib/data/helpers/finding-text.ts` beside `fillPlaceholders`, which `t()` and the server's `words` already import, and the pill is `Disclosure.svelte` with `expanded` made optional (item 4, Decision 2); verify item 7 runs `utils/folder-check.sh`.
- The question (verify item 4): verify item 4 now also runs `git grep -n '=== 1 ?'` and a grep of `=== 1)` comparisons with each remaining hit listed with why it is no word pick, and lists each pair named under "Pairs picked by hand under other names" with the line that now reads it through the helper.
- Implied inputs (the refused locale): item 5 says a locale `Intl.PluralRules` refuses picks by the English rules and never throws; C5 holds `en_US` and the empty locale. No finding is added, since a locale an app gives is no finding under G130.
- Implied inputs (label maps, text maps, `file.other`, a row with no label): item 5 and C6.
- Implied inputs (`noticeWords`): item 5 and C5.
- Implied inputs (the server's locale): item 5 says the server's `words` picks by `settings.locale`; C5 holds it.
- Implied inputs (a wrong-shaped or missing `new_project_dir`): item 2 and C2.
- Implied inputs (an id with no record): item 6 and Decision 8 draw it as its id, muted, with a tooltip, never as a press; C8 holds it.
- Declined to judge (the payload key): Decision 7 takes it as a field of the payload between oculus's server and its page, which nothing outside oculus reads.
- Declined to judge (the Settings editor): item 5 requires the Settings form to show and write a row's `label` as its forms.
- Added after the check, from O169's landing look (the widened line, `plan.md:1727`): items 7 to 10 and cases C9 to C12, with their premises under "What is on the tree" and their paths (`src/lib/ui/html.ts`, `src/lib/server/git/git-routes.ts`, `config/text/app.yml`, `CppRows.svelte`, `config/text/views/system/machine/debug.yml`, `LaunchEdit.svelte`, `tests/state/sessions/source/source-server.ts`); the launch form's `debug.edit_detail` is the same flaw as the cpp keys and is added to the widened line. Item 10's cause was read from the fixture and the store (`source-server.ts:114-127,142,198-207`, `fs-transport.ts:564-566`) and its fix is stated in the item.
- The dictated words added after the check: "commas" (item 9), the word `debug.field_list` already uses: holds. "job I/O on /local/<jobid>" (item 7, C9) is the card's text as its file holds it, not text for a file: holds.
