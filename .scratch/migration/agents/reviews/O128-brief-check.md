# Brief check of O128 (a category sets the order of its cards)

All reads were on main at d16835f40 (`git show --stat HEAD`). The working tree has uncommitted changes in `.scratch/migration/agents/guarded.md`, `orchestrator-state.md` and `plan.md`, plus the untracked brief (`git status --short`). I read G124 as it stands on disk, with its new sentence on `sort:` and its new Code and Test lines (`git diff .scratch/migration/agents/guarded.md`).

Two findings block dispatch:
1. **Import cycle.** Item 2 puts the ordering function in `items.ts`, which leads to an import cycle that the tree check refuses (Premises, finding P1).
2. **Shape check.** Item 5's shape refuses a value that item 1 accepts, and it gives a second finding for every wrong value that item 4 reports (Other checks).

## Names

Command: `grep -rnw <name> src tests config docs README.md --exclude=local.yml` for each name, plus `grep -rn "sort:" config docs README.md --exclude=local.yml` and `grep -rn categories docs README.md`.

Hits outside "Paths this step writes":

- **`categoriesOf`**
  - `src/lib/state/boards/board/presets.ts:22,487`: not made false. The function is the same and gains one field.
  - `src/lib/state/boards/structure/cross-links.ts:16,248,250`: not made false. `CrossCategory` at line 34 is `Pick<Category, 'key' | 'label' | 'color'>`. `groupProjects` (lines 265-270) still sorts a strip's members by project id. A strip is not a board's cards, but its doc says it groups "as a project board's sections are". The brief should say, as a scope line, that the strip keeps its id order.
  - `tests/data/sources/config/layers/hub-vocab.test.ts:16,68`: not made false.
- **`categoriesFindings`**: `src/lib/data/sources/config/sections/findings.ts:20,49`, not made false.
- **`categoryRow`**: no hits outside `vocab.ts`.
- **`cardSections`**
  - `src/lib/state/boards/board/index.ts:51` (re-export): not made false.
  - `Projects.svelte:118,224`: outside the 76-85 range the brief allows, still true.
- **`compare`**: only `items.ts:181,225`.
- **`Category` (type)**
  - `presets.ts:51,65`: the doc at 62-64 says the rows are what "the board's sections and its slices are drawn by". Still true, but silent on the order.
  - `facets.ts:18,195,215`: inside the write list.
  - `cross-links.ts:18,34`: not made false.
  - No test builds a `Category` literal (`grep -rn "rail: false\|archival: false" src tests` finds none of that type), so a new required field breaks no fixture.
- **The key `sort`**
  - `config/catalogs/vocab.yml:171,176`, `config/options/catalogs/vocab.yml:159`, `docs/templates.md:467,473` and `docs/HELP.md:296`: all about the Focus clusters' `sort`, not made false.
  - `src/lib/data/shapes/boards/focus-clusters.ts:16-26`: not made false.
- **`categories` in the docs**
  - `docs/templates.md:39` and `docs/data-map.md:117,226`: not made false.
  - `docs/HELP.md:52,279,559,566`: not made false.
  - `docs/HELP.md:296`: the Awaiting box's tab draws "as board cards, in sections by `categories:`". Still true, and that tab also gets the new order (see Implied inputs, item 6).
- **`model-entities.ts:427`** ("`pin: true` floats the card to the top of its board"): still true.

Head comments in the write list that describe the order and that item 6 does not name:
- `items.ts:1-7` ("the cards sort by the stage order of every hub's words")
- `facets.ts:1-14`
- `categories.ts:1-7`
- `boards.ts:1-11` (it lists every thing the categories check finds, so it becomes incomplete)

spec.md:72 covers them; the brief could name them.

## The step line

The plan line (`plan.md:1636`) against "What to build":

| Part of the line | Requirement |
|---|---|
| "a row of `categories:` ... takes a `sort:` key" | items 1 and 5 |
| "a list of the words `stage`, `year` (newest first, a project with no year last) and `title`" | item 1 |
| "read left to right after pinned projects" | item 1 |
| "a row with no `sort:` keeps `[stage, title]`" | item 1 ("keeps today's order", that is pinned, stage, title) |
| "a word outside the three is a finding naming the row" | item 4 (`categories[<n>].sort`) |
| "`publications` and `other-outputs` rows ship `sort: [stage, year, title]`" | item 3 |
| "the Settings help, the vocab comment and `docs/HELP.md` say so" | items 5 and 6 |
| "A full step" | Size line |
| "(ruling 643)" | `plan.md:3464`, option (d) |

Every part of the line has a requirement. The brief also asks for things the line does not: the one-word text, the repeated word, the wrong-kind value, the `vocab.ts` shape and `templates.md`. Each fits the ruling.

## Premises

Rerun with `sed -n`, `grep -n` and `wc -l` on the files named. Everything holds except the points below.

- **P1 (wrong, blocks item 2).** `items.ts:23` already imports from facets.ts at run time: `import { sliceValue, sliceWord } from './facets.ts';`. Item 2 puts the ordering function in `items.ts`, so `cardSections` in `facets.ts` would have to import `items.ts`. That closes the runtime cycle items.ts -> facets.ts -> items.ts.
  - `tests/checks/imports/cycles.test.ts`, 'holds no cycle', expects `findCycles(importGraph(SRC, 'lib/'))` to be `[]`. `test:quick` runs the tests under `tests/checks` (spec.md:26), so it goes red.
  - `presets.ts` imports neither `items.ts` nor `facets.ts` (`grep -n "^import" presets.ts`, lines 14-30). Both files already import `stageRank` from it (lines 320-323), so it is a home without a cycle. It is not in the write list.
- **Small line-range slips (no effect):**
  - `Category` is at `categories.ts:16-29`, not 17-31.
  - `categoryRow` is at `vocab.ts:309-328` (doc at 309, `});` at 328), not 309-327.
  - `fromWords` is at `fields.ts:399-410` (line 398 is blank).
  - The 'the card sections' describe runs to `board-rules.test.ts:287`, not 286.
- **Holds as stated:**
  - `compare` at 180-187; `boardItems` at 215-226; `itemOf` at 122,153; `cardSections` at 333-352.
  - `stageRank` at `presets.ts:320-323`; `union.categories` at `presets.ts:525,570,607`.
  - `Projects.svelte:76-85,187,222-224,319,448-450,463`; `BoardList.svelte:97` (Table `sort` starts null, `Table.svelte:35`).
  - `workbench-keys.svelte.ts:394`; `selectors.svelte.ts:364-367` with its readers `Collection.svelte:177`, `Map.svelte:97` and `rail-badges.svelte.ts:159,171,327`.
  - `vocab.yml:262-272` (comment 262-264, rows 266-272); `vocab.yml:4`; `vocab.yml:171`.
  - Options `vocab.yml:318-342` and `159-163`; `options.ts:58-63,107`; `MultiSelect.svelte:108,120`.
  - `boards.ts:34,55-67,223-260`; `boards.test.ts:193-247`; `board-fixture.ts:44-46`.
  - `normalise.ts:169-176,292` (`wholeShape`: an integer of 0 or more, or undefined).
  - `HELP.md:307`, `templates.md:445-452`, `data-map.md:117`.
- **Sizes** (`wc -l`): 244, 352, 137, 260, 533, 665, 247. All match.
- **Missing premise.** The whole-file shape check also reads every `categories` row (see Other checks). The brief never names it, although item 5 changes the shape it reads.
- **Missing premise.** `presets.ts:570` is `awaitingPreset`, with `cards: 'sections'` and the same union rows. `Projects.svelte:183-185` draws that board too, so the Awaiting box's tab gets the new order. The brief does not name it.

## Cases and checks

My expected results, worked from item 1's rule with oculus's stage order (`vocab.yml:64-77`: `accepted` comes before `published`):

| Case | Expected | Brief |
|---|---|---|
| C1 | zeta (accepted), then published by year descending with the 2025 tie broken by title: aardvark, beta, alpha, gamma | correct |
| C2 | alpha, zeta, aardvark, beta, gamma | correct |
| C3 | b-poster (2023), a-thesis (2018) | correct |
| C4 | in-flight has no `sort`, so stage (exploring before building), then title: a, b, c | correct |
| C5 | w (2026), then y and x tied at 2025, broken by stage: w, y, x | correct |
| C13 | the order part (stage, then title) matches item 1 | correct |
| C14 | `multiProblem` gives `{ kind: 'words' }` for 3 (`value-rule.ts:170-175`), one finding | correct |
| C15 | `[year, year]` has no stray word, so no finding (`value-rule.ts:178-180`) | correct |

No stated result is wrong.

Cases at odds with the rules:

- **Guard rows cannot fail first.** Line 39 says every case is "written first, run on the unchanged code, and its failing line quoted" (spec.md:69 says the same of each new test). C4, C7, C9, C10, C11 and C12 pass on the unchanged tree, since they assert today's order or no finding. No failing line exists for them. The brief should name them as guard rows and say the report quotes their passing first run.
- **C6** gives no projects. It can pass on data whose title order equals the stage order.
- **C7 and C11** give no projects either.
- **C9** is a row of 'the card sections'. That unit takes a config, so "a hub's row laid over oculus's" reduces there to "a row with no `sort`", the same as the no-sort case. The replacement of a whole row is the hub merge (`in-place.ts:99`, guarded by G126), which this step does not change. As written, C9 checks a place the step does not change.
- **C10.**
  - The grid board never draws `cardSections`. `Projects.svelte:448-450` draws `projects(shown)`.
  - A `cardSections` row on a grid preset would therefore make the builder add a branch no view uses (spec.md:89, YAGNI).
  - A row on `boardItems` passes on the unchanged tree.
  - What C10 really checks is `Projects.svelte:448-450`, which the step does not change.
- **C13** is a row of 'categoriesFindings' but also asserts an order, which is the card-sections unit (spec.md:60: one test per unit). It also leaves out what the added row needs:
  - a key no earlier row holds and a `color`, else extra findings (`boards.test.ts:209-245`);
  - blocks that hold projects no earlier row holds, so the order part has cards.
- **C16** asks for a reading of `Projects.svelte:319,448-466` and `workbench-keys.svelte.ts:394`. The step changes neither place.
- **C1 to C5** do not say the fixture projects need `tier: 'research'` and a lead (as `CASES.c14` has, `board-fixture.ts:40`). The archive and projects boards take only `tier: research`, `role: lead` (`layout.yml:216-221,259-264`), and `project(id, over)` replaces `CASES[id]` whole.

## The question

Could each pass without a category's cards being ordered by that category's own `sort:`?

- **C1, C3:** they could pass if all cards were sorted by `[stage, year, title]` whatever the row, but C4 catches that. Together they hold.
- **C2:** no. It ties the pin to the row's order.
- **C4:** it guards against a global year sort. It cannot show the goal.
- **C5, C8:** no. They need the config's own words read. C8 needs C5's data, which the brief implies.
- **C6:** yes, on data whose title order equals the stage order (no data is given).
- **C7, C9, C11, C12:** yes. They pass on the unchanged tree.
  - C12 passes even if item 5's catalog field is missing: `categoriesFindings` skips a field whose spec is undefined, as it does for `CATEGORY_BLOCKS` (`boards.ts:252-254`).
- **C10:** yes. No data is given, and the grid draws `shown`. It needs projects in `publications` whose `[stage, year, title]` order differs from the board order, asserted on `boardItems`, so it fails a builder who sorts inside `boardItems`. That is item 2's "boardItems and compare keep their order".
- **C13, C14, C15:** no for the findings. They need the catalog spec.
- **C16, C17:** reading and the look on landing. They hold.
- **Items 1 and 3:** no, given C1-C5 and C8.
- **Item 2:** yes for several hubs. No case checks that a section takes its row from `preset.categories` (the union) and not from each card's own hub.
- **Item 4:** yes for the real tree. No case runs the whole-file shape check, so the second finding item 5 creates passes every case.
- **Item 5:** yes. A shape that refuses `sort: year` passes every case.
- **Item 6:** reading.

## Implied inputs

1. **Several hubs whose rows differ.** Missing, and costly. The section takes the union row, which is the first hub holding the key, the primary first (`vocab-keys.ts:233-266`, `presets.ts:518-525`). Each card's category, by contrast, comes from its own hub (`items.ts:122`).
   - Expected: say the primary's `publications` row has `sort: [title]` and a second hub's has `[stage, year, title]`. Then both hubs' cards in that section go by title.
   - A builder who reads each card's own hub row would mix two orders in one section.
   - This is a design choice the brief takes in item 2 but does not list under Decisions.
2. **A stage outside the stage order.** `stageRank` puts it last. Not missing: it is reused, and with oculus's rows no sorted row can hold one.
3. **Ties.** The year tie is in C1. A full tie falls back to `boardItems`' order, whose input is filled in sorted id order (`normalise.ts` `byId`). Not missing.
4. **A pinned project without a year, and two pinned projects.** Missing. "Pinned first, then the row's sort" can be read as "the pinned group in board order".
   - Expected for `publications`: pinned alpha (2016), then pinned gamma (no year), then the unpinned cards by `[stage, year, title]`.
5. **The list mode.** C16, by reading. Not missing.
6. **The Awaiting box's tab** (`awaitingPreset`, sections). Missing from the brief and from item 6's documents.
   - Expected: the same order inside a section as on a board.
   - Cost is low, but it is a visible change the look should name.
7. **A hub that removes a row** (`{ key: publications, removed: true }`). Journal papers fall to "other" and keep the board order. C11 covers this. Not missing.
8. **A hub that re-colours `publications`.** Missing, and costly to readers. Its row replaces oculus's row whole (`vocab.yml:4`), so it loses `sort` with no finding.
   - Expected: stage, then title, as in C9.
   - Item 6's `templates.md` comment should say that a row named there replaces oculus's row whole, `sort` included. Line 447 says "replaces oculus's row of that key", without "whole".
9. **Values of the wrong kind.**
   - `sort: 3` is C14.
   - `sort:` with no value (YAML null) is missing. `multiProblem(null)` gives `{ kind: 'words' }`, so item 4 reports it, but item 1's "a row with no `sort:`" leaves unclear whether null is none. Expected: one finding naming `categories[<n>].sort`, and read as no `sort`.
   - `sort: [stage, 3]` gives the same `words` finding.
   - `sort: 'stage year'` (one text with a space) is a stray word, so a finding. The rule covers it.
10. **`year: 0`.** `wholeShape` accepts 0 (`normalise.ts:161`). A test on truthiness would read 0 as no year. Not happened, low cost.
11. **Years of different digit counts sorted as text.** If the builder sorted by `BoardItem.year` (a string, `items.ts:164`), they would compare as text. Item 1 says `project.year`, so not missing.
12. **A second row with a repeated key carrying `sort`.** It is not read (`categories.ts:54`), and the repeated-key finding exists. Not missing.

## ADRs

`ls docs/adr` prints "ls: docs/adr: No such file or directory". No ADR exists. `ls docs/glossary.md` prints "No such file or directory", which matches the report part on terms.

## Dictated text

`grep -n 'sort: \[stage, year, title\]\|options: \[stage, year, title\]\|control: multi\|categories\[<n>\].sort\|categories\[7\].sort'` on the brief:

- **Line 32**, `sort: [stage, year, title]` on the two rows: holds. It is ASCII and valid inside the flow-map rows, and stays one line per row.
- **Line 34**, `control: multi` with `options: [stage, year, title]`: holds. It follows `behavior.yml:141-142` and `260`. A `multi` keeps the order of the picks and refuses a repeated pick (`MultiSelect.svelte:104`).
- **Lines 33, 53, 54**, the finding key `categories[<n>].sort` / `categories[7].sort`: holds. It matches the form `refusedBy` produces (`boards.ts:62-63`). Index 7 is the first added row, after oculus's 7.
- **Line 34**, "`sort`, a list of the three words": not words for a file, but a shape. It breaks item 1 and C8 (see Other checks).

`LC_ALL=C grep -n '[^ -~]'` on the brief prints nothing.

## Other checks (would a wrong `sort` already be reported elsewhere?)

Yes. The whole-file shape check reports a category row's `sort` value. With item 5's shape it reports every wrong value a second time, and it refuses a value item 1 accepts.

- **The shape check reads every row.**
  - `catalog-files.ts:33` gives `catalogs/vocab.yml` the shape `vocabFileShape` with `owned: under()`, which owns no path.
  - `shape-issues.ts:28-55` turns each zod issue into a finding: `invalid_value` to `value` and `invalid_type` to `type`.
  - Oculus's own file is checked in `merge/text.ts:71`. A hub's `categories` is checked in `hub-layer.ts:613-624`, through `hubFileOf('categories')`, which is `catalogs/vocab.yml` (`hub-names.ts:735`), over the merged rows.
  - `categoryRow` is a `z.strictObject` (`vocab.ts:310`).
- **What item 5's shape (`sort` as a list of an enum) does there:**
  - `sort: [stage, nonsense]` is one shape finding at `categories.7.sort.1`, plus item 4's at `categories[7].sort`: two findings.
  - `sort: 3` is a shape `type` finding at `categories.7.sort`, plus item 4's: two findings.
  - `sort: year`, legal by item 1 and C8, is a shape `type` finding ("expected array") for a value nothing else refuses.
- **Precedent.** The Focus clusters' `sort` is reported by the shape alone (`focus-clusters.ts:16-18`, `vocab.ts:122-127`). A wrong-kind block (`stages: 3`) is today refused both by the shape (`wordBlock` is strict) and by `mapFindings` (`boards.ts:89-93`). I read that rather than ran it.
- **The other checks do not report `sort`:**
  - `value-rule.ts` `multiProblem` (lines 161-181) is the rule item 4 would use, and it agrees with items 1 and 4: a one-word text is fine, a repeat is fine, a stray word is `choice`, and a non-word is `words`.
  - The hub layer's dropping of removed words acts only on fields with `from:` (`hub-layer.ts:3-12,327`). `sort` uses `options:`, so no finding there.
  - `settingFindings` (`catalogs.ts:318-342`, `settings/problems.ts`) covers `behavior.yml` and the editor's options only. `settings/rows/check.ts` covers reader and links rows only.
  - So there is no third reporter.
- **The fix** is my judgment. The shape keeps the words for the editor as a union of one word and a list of words. The vocab file's `owned` in `catalog-files.ts` covers the paths `categories.<n>.sort` (and `.sort.<i>`) with a predicate, since `under` takes prefixes and cannot name an index. Then `categoriesFindings` gives the one finding, as `catalog-files.ts:24-27` says `owned` is for.
  - That widens the write list by `src/lib/data/shapes/catalog-files.ts`, and possibly `catalog-files/common.ts` for the predicate.
  - The other route is to drop item 4's check and leave the finding to the shape, as the Focus clusters do. It goes against item 4 and G124's Test line.
  - A third route makes the shape accept any value for `sort`. It loses the editor's completion.
  - Leaving both findings, or naming the double only in the report, is the lazy option.

## Declined to judge

- **A second hub's wrong `sort`.** `categoriesFindings` runs on the primary hub's merged config only (`readerFindings` is called with `open.primaryDir` at `server/root/process/context/findings.ts:52` and `watch/portfolio/payload.ts:91`). Whether another hub's `categories` rows reach any finding (its own merge's shape check through `readHubVocab`, `data/index.ts:806-810`) is not verified. It decides whether the `owned` route leaves a second hub's wrong `sort` with no finding. One run of `loadConfig` with a second hub would settle it.
- **The catalog key for `config/options/catalogs/vocab.yml`** (`vocab.yml` or `catalogs/vocab.yml`) that `categoriesFindings` must look the `sort` spec up under. It is not verified. `readCatalog` keys entries by the file key of `config.options` (`options.ts:594-613`). It affects how item 4 is written, not whether it can be.
- **The existing double for `stages: 3`.** I read it but did not run it, and it is outside this step.

Usage: aad602adef6203102, claude-opus-5-5, 229764 tokens, 91 tool uses, 11 min 50 s.

## Closed

- Premises P1 (the import cycle): item 2 puts the comparison of each word in `presets.ts` beside `stageRank`, used by `compare` and by the section order, with the cycle premise and `tests/checks/imports/cycles.test.ts` named under "What is on the tree" and in Verify 3; `presets.ts` added to the paths.
- Premises, the small line-range slips: `Category` 16-29, `categoryRow` 309-328, `fromWords` 399-410, the describe to 287, corrected.
- Premises, the missing premises: the whole-file shape check (`catalog-files.ts:33`, `shape-issues.ts`, `merge/text.ts:71`, `hub-layer.ts:613-624`) and the Awaiting box's tab (`awaitingPreset`, `Projects.svelte:183-185`) named under "What is on the tree"; the tab named in item 6 and HELP's sentence.
- Other checks (the second finding and the refused one-word text): item 4 has `owned` in `catalog-files.ts` claim `categories.<n>.sort` and `.sort.<i>` by a predicate, so `categoriesFindings` gives the one finding; item 5's shape is a word or a list of words; C19 and Verify 2 a case-run program showing one finding per wrong value on oculus's file and a hub's rows; `catalog-files.ts` added to the paths.
- Names: the head comments of `items.ts`, `facets.ts`, `categories.ts`, `boards.ts` and `presets.ts` named in item 6; the project strip's id order (`cross-links.ts:265-270`) named under "What is on the tree" as unchanged.
- Cases, guard rows: C4, C9, C10, C11 and C14 named as guard rows whose passing first run the report quotes.
- Cases C6, C7, C11 given projects (now C7, C9, C11); C9 (the hub row) dropped as the merge's unit, with C10 (a row naming no `sort`) in its place; C10 (grid) rewritten as C11 on `boardItems`; C13 split into C12 (the order of a refused `sort`, a card-sections row) and C15 (the finding alone, its row given a key, a colour and a block); C16 (reading of unchanged places) dropped; every project's `tier` and `lead` given.
- Implied inputs 1 (two hubs): Decision 4 and item 2 say a section goes by the union's row. 4 (two pinned cards): item 1 and C3. 6 (the Awaiting tab): item 6. 8 (a hub row replacing oculus's whole): item 6's `templates.md` sentence. 9 (null): item 1, item 4 and C17. 10 (year 0): item 1 and C13. 11 (`BoardItem.year` a text): named under "What is on the tree".
- Declined to judge, a second hub's rows: item 4 asks the builder to show with C19's run whether a second hub's rows reach any check; that reach is the same for every field of those rows and is not this step's change.
