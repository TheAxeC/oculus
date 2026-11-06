# Step O155 refuter report (on /Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O155, base 8a157c780)

A page this report cites (the rules file, a standard, a skill's text) is named with its section, never with a line number, since a page's lines move and a section's name does not. A finding in code keeps its `file:line`.

The report is written in the rules file's character set. A character outside it in a quoted line is written by its name in angle brackets, such as `<tab>` or `<em dash>`.

## Verification (rerun by the reviewer)

```
$ shasum docs/diagrams/* docs/palette.md > before.sha; npm run diagrams; npm run docs:palette; shasum ... > after.sha; diff before.sha after.sha
diagrams and palette byte-identical        (the committed diagrams and palette match the source; the run changed no byte)

$ npm run test:quick -- --base 8a157c780
ok      prettier (1.0 s): All matched files use Prettier code style!
ok      ASCII gate (1.1 s)
ok      svelte-kit sync (2.3 s)
ok      eslint (2.9 s)
ok      svelte-check (10.4 s): 1793975691552 COMPLETED 584 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest checks (161.5 s): Duration  147.69s (transform 86.67s, setup 0ms, import 183.74s, tests 328.88s, environment 5ms)
ok      vitest (180.3 s): Duration  167.53s (transform 82.05s, setup 0ms, import 229.29s, tests 403.38s, environment 9.85s)
ok      vitest slow (260.8 s): Duration  248.21s (transform 22.52s, setup 0ms, import 129.20s, tests 854.68s, environment 15ms)
test:quick: 263.2 s; every command passed

$ npx vitest run tests/data/sources/present.test.ts tests/routes/edit/deck-slides.test.ts tests/server/edit/deck tests/state/boards tests/data/shapes/catalog-files/vocab.test.ts tests/data/sources/config/boards.test.ts tests/data/sources/config/layers/hub-vocab.test.ts tests/checks/config/config-folder.test.ts --reporter=dot
 Test Files  14 passed (14)
      Tests  306 passed | 2 skipped (308)
$ npx vitest run tests/data/hubs/decks.test.ts --reporter=dot
 Test Files  1 passed (1)
      Tests  2 passed (2)

$ C15 greps
grep -rn "field_sort\|value_sort\|group\.sort\|'folder' | 'title'" src config tests docs --exclude=local.yml     (nothing)
grep -n "^ *sort_unknown: group" config/text/findings.yml                                                        (nothing)
grep -n "'sort'" History.svelte deck-keys.ts arrange.ts                                                           (nothing)
grep -n "sort" model-deck.ts deck-edit.ts config/schemas/deck-schema.yml                                          (nothing)
grep -n "sort" docs/decks.md
128:2. With `discover: true`, then every deck `find:` keeps that no group of the deck names, in the deck order: ... inside a category by the row's `sort:`, as the boards order the cards of its section; ...   (a category row's sort, not a group's)

$ LC_ALL=C perl ... $(find src tests bin config -type f ! -name local.yml)
find: bin: No such file or directory          (no other line)
$ the same perl check over every path of git status --short (bash)
(nothing)

$ wc -l of every changed file: largest source files present.test.ts 878, hub-names.ts 858, config-folder.test.ts 850, read.ts 833; components History.svelte 492, RuleForm.svelte 145; new order.ts 97. All at or under 880 / 520.

$ sh utils/unused-exports.sh > <scratchpad>/unused.txt; diff ../O155-base/unused-exports.txt <scratchpad>/unused.txt
(no difference)
$ sh utils/folder-check.sh
(nothing) rc=0

$ history-word grep over the added lines of src tests config and order.ts
hits: hub-layer.ts head comment "the hub's values no longer give" (existing sentence, rewrapped); in-place.ts "before oculus's, and any other after them" (a place); present.test.ts title "a year before none" (a place); order.ts:49 "the words before it leave" (a place). No hit compares with an earlier state.

Commands the builder's report quotes as evidence, rerun:
$ grep -n "pin" src/lib/data/shapes/boards/order.ts src/lib/data/sources/deck/groups.ts
order.ts:4, :25, :50 and groups.ts:133, comment lines only (matches the report's C7)
$ the report's read-only probe of the research hub's decks (bash, from ~/workspace/research-hub)
24 decks listed; the two no group's slides: names are projects/manuscripts/ecg-readable-substrate/present (submitted, year 2026) and projects/archive/published/2026/hccnet-fl/present (accepted, conference, 2026) (matches the report)
$ grep -n "^categories\|^deck_order" ~/workspace/research-hub/.oculus/config.yml
(nothing) rc=1
$ HUB_LIST keys against the data-map key list (sorted, diffed)
69 keys each, the same set; the base data-map list held 65 keys (the three deposit.zenodo.* missing) while its sentence said 68 (matches the report)
$ diff of the base copy's decks.test.ts, deck-hub.ts, present.test.ts against git show 8a157c780
base copy intact for all three
```

## Verdicts

Items of the brief's "What to build", in its numbering:

- 1: holds. `src/lib/data/shapes/boards/order.ts` holds `stageRank`, `BOARD_SORT`, the private `byWord` and the exported `compareProjects(left, right, words, order)` over `{ stage?, year?, title }` with no pin; `compareCards` (`presets.ts:335-344`) keeps the pin and calls `compareProjects`; `items.ts:30`, `facets.ts:35`, `card-order.ts:11` import from `order.ts`; `presets.ts` re-exports nothing (grep). The boards' tests (`tests/state/boards`) are unchanged in the diff and pass in the rerun. See Standards 5 on the exported `Ordered`.
- 2: holds. `deck_order` in `config/catalogs/vocab.yml:280` with its comment, the options entry (`config/options/catalogs/vocab.yml:347`, boards, Vocabulary, `control: list`), `vocab.ts` `z.array(text)`, `VOCAB_SHAPES` `deck_order: TEXTS`, `HUB_LIST`, `OWN_HUB_KEYS`, `config-folder.test.ts`, `docs/data-map.md` (69, key listed), and every whole-list sentence (`vocab.yml:4`, options `:4`, `templates.md:471`, `HELP.md:587`, G126). The departure to `{ kind: 'whole', texts: true }` is required by the brief's own rule (decision 5): at the base `{ kind: 'whole' }` is the shape `layInPlace` applies as written (no `repeatedRows` without a `field`) and the shape-issue path in `mergeHub` skips it (`shape.field === undefined` -> continue), so a key named twice would be applied and a row of the wrong kind would stand. Other lists are untouched: `toldApart` returns the old predicate for every shape without `texts`, and `repeatedRows(value, (row) => rowKey(row, field))` is the old call. The finding of a key no category holds is raised in `mergeHub` (`hub-layer.ts:685-687`, `orderNamingRows` `:532-551`), which `loadConfig` runs for every hub (`merge.ts:204`), and `readOtherHub` returns `loaded.findings` whether or not the hub sets `categories`; each row of the new boards.test describe compares the finding's file with `join(dir, HUB_FILE)` for the primary and for `lab`. Oculus's list losing a removed category is silent (no `orderNamingRows` when the hub sets no `deck_order`; `deckCategories` passes the key over).
- 3: holds. `inDeckOrder` (`groups.ts:135-157`) replaces `sorted`; categories by `deckCategories`, inside one by `[...category.sort, ...BOARD_SORT]` through `compareProjects` under the hub's `vocabKeys(stages)`, then the decks in no category, ties and the uncategorised by `doc.path`; `categoryOf` over the merged config; no pin; `slides:` members first unchanged; the Add tile's `sight.found` unchanged; `DeckProject.year` set in `deckProject`; `DeckContext.order` built once in `deckReader` from `hub.config.merged`; the tests' three `createReader` inputs give it. See Spec 1 on the resolved order.
- 4: holds. C15 greps print nothing; `GroupSpec.sort`, its read, `findings.deck.sort_unknown`, `DeckKeys.sort`, `readKeys`, `deck-edit.ts:20-21`, `deck-keys.ts` (head comment, `KEY_FIELDS`, `GROUP_KEYS`, `takes`, `takenWords`), `server.deck_slides.value_sort`, `groupKey`'s type, the Sort field, `DECK_KEYS`, the six `field_sort*` texts, the schema field and help, `templates.md:1927`, the demo fixture line are gone; the deck-slides rows are rewritten to `discover` and named in the report.
- 5: holds. `present.yml` `rule_adds: '{0}, and adds what it finds.'` and `rule_edit_tip: 'Set which decks {0} finds and whether it adds them'`; `ruleSentence` returns `t('present.rule_adds', finds)`; its doc comment reads "then whether it adds what it finds".
- 6: holds. `decks.md` (`:88`, `:100`, `:119`, `:130`, `:139`), `HELP.md:308`, `:337-338`, the head comments of `groups.ts`, `presets.ts`, `items.ts`, `facets.ts`, `categories.ts`, `arrange.ts`, `deck-keys.ts`, `decks.ts`, `RuleForm.svelte` say what is true now; G124's Code line names `order.ts` and `orderNamingRows`; G32's Test line names the order rows. See Standards 7 on the pin.
- 7: holds. G32, G124, G126 carry the wording and the Test lines; the rows are in the files the brief names; `config-folder.test.ts` gains `deck_order`; the boards' tests pass unchanged; each new row's base failure is in the report (see Proof 1 for C12a and C17).

Cases of the brief's "Cases":

- C1: met, present.test.ts row 'C1: ...' (d 2025, e 2023, c submitted, b exploring, a nascent), passing; base failure quoted.
- C2: met, row 'C2: ...' (project titles Alpha/Zeta against deck titles a/b; 2020 before no year).
- C3: met, row 'C3: ...' (exploring Ann, exploring Zed, building; folders reversed).
- C4: met, row 'C4: ...' (z, y from `slides:`, then b, c, a).
- C5: met, row 'C5: ...' (a deck of no project and a project at `accepted` with no form, which no row holds, after the categorised, by folder).
- C6: met, row 'C6: ...' (idea before released after the listed ones).
- C7: met, by reading: `DeckProject` has no pin, `deckProject` copies none, `inDeckOrder` and `compareProjects` read no pin.
- C8: met, row 'C8: ...' (kept a, b, c in the deck order).
- C9: met, boards.test row 'a key no row of categories holds' (one finding `deck_order.1` naming the hub's file, the merged list `['publications']`; `deckCategories` then gives the rest in the order of `categories:`).
- C10: met, hub-vocab row "keeps oculus's deck order with no finding when the hub takes out a category it names" and present.test row 'C10: ...'.
- C11: met, hub-vocab row "replaces oculus's deck order whole with the hub's own".
- C12a: met, boards.test rows 'a key named twice', 'a text', 'a map', 'a list holding a map', each one finding in the hub's file and oculus's list standing.
- C12b: met, row 'C12b: ...'.
- C12c: met, decks.test.ts row (d-alpha 2020 before c-zeta 2025 under the hub's `sort: [title]`).
- C12d: met, the two 'C12d: ...' rows.
- C12: met, `tests/state/boards` unchanged and passing in the rerun.
- C13: met by reading (`RuleForm.svelte` draws Find and Discover only; `ruleSentence` and the texts); the drawn form is the look's at landing.
- C14: met, deck-slides row "a group's sort, which the Overview does not set".
- C15: met, greps above.
- C16: met, decks.test.ts describe 'the order of the decks a group of a hub discovers', through `buildReaders` -> `deckReader`; base failure quoted.
- C16b: met by reading `server/content/deck/read.ts:82-100` (`owner?.config ?? source.config`, passed to `deckReader`) and `deckReader`'s `deckOrderOf(hub.config.merged)`.
- C17: met, boards.test row 'a file setting only a key no row holds' run through `readOtherHub` with `other: 'lab'`.
- C18: met, the same rows run with `other` undefined.
- C19: met, config-folder.test.ts passes in the rerun.
- C20: not verifiable here, the look at landing settles it (Present Overview of the research hub's deck; Settings, boards, Vocabulary).

## 1. Spec

- `src/lib/data/sources/deck/groups.ts:136`: "const ranked = deckCategories(order);"; what is wrong: item 3 says `DeckContext` gains "the resolved order of their keys ... built once in `deckReader`"; `DeckOrder` carries the raw `keys` (`order.ts:81`, `keys: strings(config.deck_order)`) and the categories are resolved again in every call of `inDeckOrder`, once per discovering group per read. The report's decision 3 describes `DeckOrder` but does not name this as a departure from the brief's shape; failure scenario: none in output (the result is the same on every read); a reader of `DeckContext` following the brief looks for a resolved order and finds keys; verdict: none (item 3 holds).

## 2. Proof

- `.scratch/migration/agents/reviews/O155-report.md`, "The cases' first run", C12a and C17: "the rows 'a key named twice', 'a text', 'a map' and 'a list holding a map' failed, each on the `hub_key_unknown` finding" and "failed on `hub_key_unknown`"; what is wrong: the rules file ("What every package obeys") asks for each new test's failing line on the unchanged tree; these rows get a description, and only C9 quotes the finding's text. The cause given (the key unknown at the base) is consistent with the base, where `deck_order` is in no `HUB_LIST`; failure scenario: a reader of the report cannot see from it that each of those rows failed on its own assertion rather than on a shared setup error; verdict: none (item 7 holds; read from the report as the brief allows).

## 3. Standards

- `src/lib/data/sources/config/merge/in-place.ts:20`: "// and oculus's list stands. The hub layer (hub-layer.ts)"; what is wrong: the rules file ("What every package obeys": a comment edited by the step is rewrapped as a whole paragraph at 100 columns, so no line inside a sentence ends short); the line is 57 columns in the middle of a sentence that runs on at `:21` (98 columns); failure scenario: the next reader of the head comment meets a ragged break mid-sentence and the comment-width check does not catch it (it checks only over 100); verdict: none.
- `docs/templates.md:471`: "# of stages, one word in `deck_order`), is a finding, and oculus's list stands; `focus_clusters` is read row by row, such a"; what is wrong: the same rewrap rule; the edited comment line of the hub template is 123 columns where the block around it is wrapped at 100 (`:469` 95, `:470` 98, base `:471` 97); failure scenario: a user who copies the hub template into `.oculus/config.yml` gets one overlong comment line in a block wrapped at 100; verdict: none.
- `tests/data/sources/present.test.ts:740`-`:786`: "row: 'C1: the publications newest first, ...'" (and C2 to C12d); what is wrong: the rules file ("No history in code or comments", which holds for test titles too) bans pointers to a package; the titles open with the O155 brief's case ids, which name nothing once the brief is archived (builder's decision 6). The base has 51 titles of the form 'case N:' but none of the form 'C<n>:'; failure scenario: a reader of a failing row looks for "C12d" and finds it only in an archived brief; G32's Test line names the describe, so dropping the ids loses nothing; verdict: none.
- `tests/data/sources/present.test.ts:32-39`: "function orderOf(config: Record<string, unknown>) { return { categories: categoriesOf(config), keys: strings(config.deck_order), stages: vocabKeys(config.stages), vocab: config }; }"; what is wrong: the rules file ("The principles every package is judged on": a parser, a fold or a rule exists once and is reused); it is `deckOrderOf` (`order.ts:78-85`) copied into the test; failure scenario: a change to how `deckOrderOf` reads `deck_order` or the stages leaves the reader rows passing over a copy that no longer matches the code `deckReader` runs; verdict: none.
- `src/lib/data/shapes/boards/order.ts:14`: "export type Ordered = { stage?: string; year?: number; title: string };"; what is wrong: the same principles section (an export with no importer outside its own file and its tests is removed or made local); `grep -rnw "Ordered" src tests` hits only `order.ts`; the unused-exports diff is empty because the tool does not list it; failure scenario: none at run time; a reader takes `Ordered` for a shared type that some caller depends on; verdict: none.
- `.scratch/migration/agents/reviews/O155-report.md`, "Runs of the verify list": "One earlier start of it was stopped before it printed a result, since comment edits followed it."; what is wrong: the rules file ("Token discipline") says the list runs once after the last change and that a run beyond that is a finding of the review; a start before the last change is such a run, even if stopped; failure scenario: none to the code; the step's cost is above what the rules file allows; verdict: none.
- `docs/decks.md:128`, `docs/HELP.md:337`, `config/catalogs/vocab.yml:279`, `config/options/catalogs/vocab.yml:347` (help), `docs/templates.md:556-558`: "inside a category by the row's `sort:`, as the boards order the cards of its section" / "as on the boards"; what is wrong: the boards put pinned cards first (`compareCards`, `HELP.md:308`), and the step line (`plan.md:1696`) says "board pins not read"; none of these sentences says that a deck reads no pin, so "as the boards order the cards" reads as pinned first; failure scenario: a user pins a project on its board and expects its deck to open the discovering group's decks, and it does not; verdict: none (item 6 holds on its listed sentences).

## 4. Behaviour

- `src/lib/data/sources/deck/read.ts:568-595` (the grid cards and summary rows map `drawnOf(found)`, the group's members): what is wrong: the deck order changes not only the Overview's tiles but the order of a discovering group's slides (`{ slides: <group> }`), its summary rows and its grid cards, in the pane, the presenter screen, the audience window and the PDF; the report's "What the look should show" states the Overview tiles only; for the research hub's `more` group the order is the same before and after (hccnet-fl, publications, then ecg-readable-substrate, in review; folder order gives the same), so the look there shows no difference; failure scenario: the orchestrator at the look sees no change on the research hub and has no stated case where the slides and summary order differ; a hub whose discovered decks' folder order differs from the deck order sees its slides and summary reordered with no line of the report saying so; verdict: none.

## Declined to judge

- Each new row's failing run on the unchanged tree, read from the report and not rerun, since the reviewer runs nothing on a changed copy; the base copy's three test files are byte-identical to the base (diff above).
- The look cases C13 (the Edit Rule form drawn, the Discover checkbox on its own line once `.line` is gone) and C20 (Settings, boards, Vocabulary drawing `deck_order` as a list; the research hub deck's `more` and `ideas`): the orchestrator's at landing; judged only by reading.
- Whether a hub of the workspace other than the research hub holds a group `sort:` key, which the schema check reports as `not_declared` after landing: not checked, since it would read other hubs' files beyond those the brief names.
- The research hub's `deck/present.yml` line `sort: folder` in `more`: the landing's data change, not the step's.
- The two skipped rows of the named test run (the report says config-folder.test.ts's real-hub rows under `OCULUS_TEST_HUB`) and the integrity case over the real hub: not run here.
- The growth of `docs/diagrams/writes.dot` (306411 to 331814 bytes): sampled by its node set, which gains nodes for `hub-layer.ts`'s import of `shapes/boards/categories.ts` and `catalog/options.ts`, and by the label counts of `layer-data.dot`, `layer-state.dot`, `layer-views.dot` and `layers.dot` (44 to 48 data/sources to data/shapes, 1103 to 1102 views to ui, consistent with the new imports and `RuleForm.svelte` dropping `Select`); the regeneration matches the source byte for byte; a regeneration on the base, which would settle that every hunk comes from this step, would write into the base copy and was not run.
- The builder's probes: the base-copy assembly for C16 (a copy outside the worktree, the base copy found intact), the read-only shell loop over the hub's manifests (grep and sed without `-i`, printing only; its output summarised in the report rather than quoted whole, reproduced above), and `sh utils/unused-exports.sh > unused-now.txt` (a scratch output, no step file) change no file of the step; none is a script under the rules file's definition, which covers a program that edits a file. No finding.

Reviewer usage: a01664c3d86b25a7b, claude-opus-5-5, 250112 tokens, 75 tool uses, 18.7 min.

## Repair round 1, refuted

The round's delta, read against the whole diff since `8a157c780`. `files.txt` lists the 50 paths of `git status --short`, and the worktree's status today lists the same 50. Running `diff -q` of each snapshot copy against the worktree shows 12 paths changed in the round: `config/catalogs/vocab.yml`, `config/options/catalogs/vocab.yml`, `docs/HELP.md`, `docs/decks.md`, `docs/templates.md`, `docs/diagrams/writes.dot`, `docs/diagrams/writes.svg`, `src/lib/data/sources/config/merge/in-place.ts`, `src/lib/data/sources/deck/groups.ts`, `src/lib/data/sources/deck/read.ts`, `src/lib/data/shapes/boards/order.ts` and `tests/data/sources/present.test.ts`. No path changed now is missing from `files.txt`. The worktree's `.scratch/migration/agents/guarded.md` differs from `git show 8a157c780:` in G124, G126 and G32 (lines 186-188, 192 and 276-278). The snapshot holds no copy of it, so it was read whole against the base.

```
$ shasum docs/diagrams/* docs/palette.md > before.sha; npm run diagrams; npm run docs:palette; shasum ... > after.sha; diff before.sha after.sha
diagrams rc 0
palette rc 0
diff rc 0            (the committed diagrams and palette match the source; the run changed no byte)

$ ps -Ao command | grep -E 'vitest|svelte-check' | grep -v grep      (nothing, before the run)
$ npm run test:quick -- --base 8a157c780
test:quick: 53 changed file(s), from git since 8a157c780
test:quick: 228 test file(s)
ok      prettier (1.0 s): All matched files use Prettier code style!
ok      ASCII gate (1.0 s)
ok      svelte-kit sync (2.3 s)
ok      eslint (2.7 s)
ok      svelte-check (10.6 s): 1793978191608 COMPLETED 584 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest checks (170.3 s): Duration  155.90s (transform 90.70s, setup 0ms, import 191.64s, tests 344.56s, environment 5ms)
FAILED  vitest (191.3 s)
 FAIL  |unit| tests/server/machine/runs/schedules/commands.test.ts > the commands a schedule runs > reads a hand change of the commands file into the payload
Error: Test timed out in 5000ms.
 Test Files  1 failed | 166 passed | 45 skipped (212)
      Tests  1 failed | 2469 passed | 592 skipped (3062)
ok      vitest slow (275.2 s): Duration  262.39s (transform 24.23s, setup 0ms, import 135.72s, tests 902.80s, environment 14ms)
test:quick: 277.7 s; failed: vitest
$ ps -Ao command | grep -E 'vitest|svelte-check' | grep -v grep      (right after the run)
.../migration-O157/node_modules/vitest/vitest.mjs run tests/data/hubs/decks.test.ts --tagsFilter !sl...
.../migration-O157/node_modules/vitest/vitest.mjs run tests/data/hubs/decks.test.ts --tagsFilter slo...
.../migration-O157/node_modules/vitest/vitest.mjs run tests/checks/source/catalog-file-keys.test.ts
.../migration-O157/node_modules/.bin/svelte-check --incremental --tsconfig ./tsconfig.json
$ diff -q ../O155-base/tests/server/machine/runs/schedules/commands.test.ts tests/server/machine/runs/schedules/commands.test.ts
(nothing) diff rc 0          (unchanged since the base; test:quick lists it as "imports at depth 2")
(waited 30 s for O157's runs to end, then:)
$ npx vitest run tests/server/machine/runs/schedules/commands.test.ts --reporter=dot
 Test Files  1 passed (1)
      Tests  3 passed (3)

$ npx vitest run tests/data/sources/present.test.ts tests/routes/edit/deck-slides.test.ts tests/server/edit/deck tests/state/boards tests/data/shapes/catalog-files/vocab.test.ts tests/data/sources/config/boards.test.ts tests/data/sources/config/layers/hub-vocab.test.ts tests/checks/config/config-folder.test.ts --reporter=dot
 Test Files  14 passed (14)
      Tests  306 passed | 2 skipped (308)
   (the ps check before it showed a new O157 vitest run of tests/checks/config; this run overlapped it)
$ npx vitest run tests/data/hubs/decks.test.ts --reporter=dot      (after a 6 s wait; an O157 boundaries.test.ts run had started by then)
 Test Files  1 passed (1)
      Tests  2 passed (2)
$ npx vitest run --reporter=verbose tests/data/hubs/hub-portfolio.test.ts      (nothing else running)
 <check mark> |unit| tests/data/hubs/hub-portfolio.test.ts > a workspace of several hubs, every record under its hub and its key > finds the page of an entry of the one hub that holds it and writes that hub's file (C6) 3313ms
 Test Files  1 passed (1)
      Tests  16 passed (16)

$ C15 greps
grep -rn "field_sort\|value_sort\|group\.sort\|'folder' | 'title'" src config tests docs --exclude=local.yml     (nothing)
grep -n "^ *sort_unknown: group" config/text/findings.yml                                                        (nothing)
grep -n "'sort'" History.svelte deck-keys.ts arrange.ts                                                          (nothing)
grep -n "sort" model-deck.ts deck-edit.ts config/schemas/deck-schema.yml                                         (nothing)
grep -n "sort" docs/decks.md
128:2. With `discover: true`, then every deck `find:` keeps that no group of the deck names, in the deck order: category ...   (a category row's sort, not a group's)

$ LC_ALL=C perl ... $(find src tests bin config -type f ! -name local.yml)
find: bin: No such file or directory          (no other line)
$ the same perl check over every path of git status --short but the .svg files, the report and guarded.md
(nothing)

$ wc -l of every changed path: the largest are present.test.ts 866, hub-names.ts 858, config-folder.test.ts 850, read.ts 836; order.ts 108; components History.svelte 492, RuleForm.svelte 145. All at or under 880 / 520.
$ sh utils/unused-exports.sh > <scratchpad>/unused.txt; diff ../O155-base/unused-exports.txt <scratchpad>/unused.txt
ue rc 0, (no difference) diff rc 0
$ sh utils/folder-check.sh
(nothing) fc rc 0

$ history-word grep (before|used to|no longer|still|anymore|previously|formerly|always|as before|O155|step N|C<n>) over the round's added lines
in-place.ts: "takes a word the hub's values no longer give"   (the existing sentence, rewrapped; it names a word the hub's values lack)
present.test.ts: 'publications of one stage and year by the project title, a year before none'   (a place in the order)
$ git diff 8a157c780 -- tests | grep '^+' | grep -nE "\bC[0-9]+[a-z]?\b|O155"
(nothing) rc 1

$ awk 'length($0)>100' over in-place.ts, order.ts, groups.ts, read.ts
read.ts:140: 159          (a regex literal, at the base's :134 with the same length)
$ awk 'NR>=465 && NR<=475 && length($0)>100' docs/templates.md; the same over 550-566
(nothing)
$ sed -n 6,24p in-place.ts | awk '{print length($0)}'
100 97 87 87 95 94 96 93 95 99 100 99 98 97 100 99 95 43   (the :87 lines end at a list item's comma; the last line ends the paragraph)

Commands the builder's report quotes as evidence, rerun:
$ grep -rn "deckCategories" src tests docs                               (nothing) rc 1
$ grep -c "deckOrderOf" tests/data/sources/present.test.ts               5
$ grep -nw "orderOf" tests/data/sources/present.test.ts                  (nothing) rc 1
$ grep -nE "'C[0-9]+[a-z]?:" tests/data/sources/present.test.ts          (nothing) rc 1
$ grep -rnw Ordered src tests                                            order.ts:14 (`type Ordered = ...`, not exported), :33, :53, :54 only
$ grep -rn "reads no pin" docs config --exclude=local.yml
docs/templates.md:559, docs/HELP.md:337, docs/decks.md:128, config/options/catalogs/vocab.yml:350, config/catalogs/vocab.yml:279
$ grep -n "deckOrderOf\|placedRows\|placed:" order.ts; grep -n "const ranked" groups.ts
order.ts:80 placed, :92 placedRows, :100 deckOrderOf, :104 placed: placedRows(...); groups.ts:135 const ranked = order.placed;
$ sed -n 395,417p tests/data/sources/config/boards.test.ts
the describe's one assertion over the findings ends `).toEqual(...)` at :412 (consistent with the quoted `boards.test.ts:412:19` of the C12a and C17 first runs)
$ the cited lines of "What the look should show": read.ts:22-30 (the slides, summary rows and grid cards follow the kept members), read.ts:384-385 (`drawnOf` -> `keptMembers`), show/+page.svelte:144 and print/+page.svelte:103 (`readDeck`), present.svelte.ts:261-267, deck-hub.ts:351-352 (`sort: [title]`, `deck_order: [idea, publications, in-flight]`)
matches the report
```

On `tests/data/hubs/hub-portfolio.test.ts`, the row that timed out at 20 s in the builder's first run: nothing in the step's diff can slow or break that row. Its imports reach these changed files:
- `hub-names.ts`: `HUB_LIST` gains the `deck_order` entry.
- `config.ts`, through `mergeHub`. `orderNamingRows` runs only when a hub's own file sets `deck_order`, which the demo-hub copies do not, and when it runs it is one `categoriesOf` over seven rows.
- `buildOneHub`, through `withDecks` and `readDecks`. `deckReader` now calls `deckOrderOf` once per hub read, and `inDeckOrder` sorts the few decks that the demo deck's one discovering group `projects` finds.
- The demo fixture's `deck/present.yml`, which only loses `sort: folder`.

All of this is linear work over at most a few dozen items. The row passed inside this run's `vitest slow`, and alone in 3313 ms. The 20 s timeout is consistent with machine load: the builder's report puts three of its own vitest processes on the machine at once.

On this run's red `vitest` line: the timed-out row is in `tests/server/machine/runs/schedules/commands.test.ts`. That file is unchanged since the base. It waits on a filesystem watcher, and O157's vitest and svelte-check processes were running when the list ended. Run alone it passes 3 of 3. Under the rules file ("Verify before you report") it is not the step's and is not a finding. This run's `npm run test:quick` therefore did not print `every command passed`; the builder's second run did, as its report quotes.

### Verdicts

Items of the brief's "What to build":

- 1: holds. `order.ts` holds `stageRank`, `BOARD_SORT`, the private `byWord` and the exported `compareProjects` over `Ordered` (now local to the file), with no pin. `compareCards` keeps the pin. `items.ts`, `facets.ts` and `card-order.ts` import from `order.ts`, which none of the round's changes touched. `tests/state/boards` passes inside the related run.
- 2: holds. The round did not change the `deck_order` key, its shape, `TEXTS`, `HUB_LIST`, `OWN_HUB_KEYS`, `data-map.md` or `orderNamingRows`. The vocab.yml comment, the options help and `templates.md:556-564` gained only the pin sentence and the board's order. boards.test.ts, hub-vocab.test.ts and config-folder.test.ts pass.
- 3: holds. `DeckOrder.placed` (`order.ts:80`) holds the rows resolved once by `placedRows` in `deckOrderOf` (`order.ts:92-108`). `inDeckOrder` reads `order.placed` (`groups.ts:135`). `ranked.indexOf(category)` always finds the row, since `placed` holds the same `Category` objects that `categoryOf` returns from `order.categories`. `deckReader` builds the order once (`decks.ts:93`), and the tests' four `createReader` inputs read `deckOrderOf`.
- 4: holds. The C15 greps print nothing (above), and the round touched none of the item's paths.
- 5: holds. The round left it unchanged; the texts and `ruleSentence` are as in the first run.
- 6: holds, with Standards 1 below. `decks.md:128`, `HELP.md:337`, `vocab.yml:279`, the options help at `:350` and `templates.md:559` each say that a deck reads no pin. The doc comments of `DeckOrder`, `DeckContext.order`, `Finder.order` and `inDeckOrder` say what each holds. G32's Test line names the describe 'the order of the decks a group discovers', every row.
- 7: holds. G32, G124 and G126 carry the wording. The order rows drop the case ids and keep their inputs and expectations unchanged (round diff of present.test.ts). The related run and decks.test.ts pass.

Cases of the brief's "Cases":

- C1: met. Row 'the publications newest first, then in review, in flight and idea' passes; its failure on the base is quoted.
- C2: met. Row 'publications of one stage and year by the project title, a year before none'.
- C3: met. Row 'in flight, a row with no sort, by the stage order and then the title'.
- C4: met. Row 'the decks slides names first in its order, then the discovered ones'.
- C5: met. Row 'a deck of no project and a project no row holds after every category, by folder'.
- C6: met. Row 'the categories deck_order leaves out after the listed ones, in the order of categories'.
- C7: met, by reading. `DeckProject` and `deckProject` carry no pin, and `inDeckOrder` and `compareProjects` read none; the five user-facing sentences now say so.
- C8: met. Row 'the decks a filter keeps, in the deck order'.
- C9: met. boards.test describe "the deck_order of the primary hub and of a hub that is not the primary", row 'a key no row holds'; passes.
- C10: met. The hub-vocab row and the present.test row 'a key of deck_order no row of categories holds, passed over'.
- C11: met. hub-vocab row "replaces oculus's deck order whole with the hub's own".
- C12a: met. boards.test rows 'a key named twice', 'a text', 'a map' and 'a list holding a map'. Their failing assertion on the base is now quoted (`boards.test.ts:412:19`, with the expected and received pairs).
- C12b: met. Row 'an empty deck_order, every category in the order of categories'.
- C12c: met. The decks.test.ts row under the fixture hub's `sort: [title]`.
- C12d: met. Rows 'ties under the words of a category, then a project with no stage and a deck of no project, by folder' and 'decks of no project by folder, a sort key left in the group not read'.
- C12: met. `tests/state/boards` is unchanged and passes.
- C13: met by reading. The round left `RuleForm.svelte` and `ruleSentence` unchanged; the drawn form is the look's.
- C14: met. deck-slides row "a group's sort, which the Overview does not set" passes.
- C15: met (greps above).
- C16: met. The decks.test.ts describe 'the order of the decks a group of a hub discovers' passes.
- C16b: met by reading. `server/content/deck/read.ts:82-100` and `deckReader`'s `deckOrderOf(hub.config.merged)` are unchanged in the round.
- C17: met. The boards.test row 'a file setting only a key no row holds', through `readOtherHub` with `other: 'lab'`; its failing assertion on the base is now quoted.
- C18: met. The same rows run for the primary hub.
- C19: met. config-folder.test.ts passes in the related run.
- C20: not verifiable here. The look at landing settles it: the Present Overview of the research hub's deck, and Settings, boards, Vocabulary.

### Findings

#### 1. Spec

none

#### 2. Proof

- `.scratch/migration/agents/reviews/O155-report.md`, "Runs of the verify list": "that related run printed `Test Files  1 failed | 13 passed (14)`, `Tests  2 failed | 304 passed | 2 skipped (308)`, and its dot output did not name the two rows".
  - What is wrong: the rules file ("Token discipline") says a red line in a file the step changed is fixed and that file rerun alone. All 14 files of that list are files the step changes or whose units it changes. The report leaves the two red rows unnamed and gives no run of the failing file alone. A later whole run of the list passed. This rerun of the list also passes (306 passed | 2 skipped), and so does decks.test.ts, so no decision rests on the two rows beyond the record.
  - Failure scenario: a reader of the report cannot tell whether one of the step's new order or finding rows fails under load, for example on the 5000 ms default timeout while three vitest processes share the machine, and so cannot judge whether the step adds a flaky row.
  - Verdict: none.

#### 3. Standards

- `src/lib/data/sources/deck/groups.ts:8-10`, head comment: "the decks of a category by its row's `sort:` as the boards order a section's cards, then the decks in no category, by folder".
  - What is wrong: this is the sentence form of the first review's Standards 7. The boards order a section's cards pinned first (`compareCards`, `HELP.md:308`), while the deck reads no pin and follows the row's `sort:` and then `BOARD_SORT`. Round item 6 named five places and the builder fixed each. This head comment, in a file the round edited, keeps "as the boards order a section's cards" with no word on the pin. The rules file ("What every package obeys", a sentence in a head comment the change makes false) applies. The doc comment of `inDeckOrder` in the same file, at `:131-132`, says "No pin is read".
  - Failure scenario: a developer reading the file's head comment expects a pinned project's deck first in a discovering group, and writes a test or a change to that expectation.
  - Verdict: none. The fix is small and inside the brief: "as the boards order a section's cards" becomes "and then the board's order, stage then title, with no pin read".
- `.scratch/migration/agents/reviews/O155-report.md`, "Runs of the verify list": `npm run test:quick` ran twice in the round, and the related list of V2 (with decks.test.ts) ran beside the first run in two more vitest processes and again after it.
  - What is wrong: the round brief ("the brief's 'Verify before you report' once, at the end of the round; no other run of the list") and the rules file ("Token discipline": a run of the list beyond what that paragraph allows is a finding of the review). The report states the second `test:quick` run as a departure. It does not state as a departure the related list run three times, once at the same moment as its own `test:quick`. Its own concurrent runs are the likeliest load behind the 20 s timeout in `hub-portfolio.test.ts` (judged above).
  - Failure scenario: none to the code. The step's cost is above what the rules allow, and the first `test:quick` run's red line came from the builder's own parallel runs.
  - Verdict: none.

#### 4. Behaviour

none. The round's "What the look should show" now states that the slides of a `{ slides: <group> }` entry, the summary rows and the grid cards follow the deck order in the pane, the presenter screen, the audience window and the PDF. It cites `read.ts:22-30` and `:384-385`, both read and true. It also gives a case whose order differs: the fixture deck `talks/order`, a-review, b-flight, c-zeta, d-alpha, e-idea before, and e-idea, d-alpha, c-zeta, b-flight, a-review after, matching `deck-hub.ts:351-352` and `decks.test.ts:345-346`. The round changes nothing a user sees beyond the docs and help wording on the pin, and the report states that wording.

### Declined to judge

- The failing lines of C12a and C17 on the unchanged tree: read from the report's record and not rerun, since a run on the base needs the new rows copied into a copy of the base tree. The quoted place `boards.test.ts:412:19` matches the describe's one findings assertion.
- Whether the timed-out row of `tests/server/machine/runs/schedules/commands.test.ts` in this run came from O157's concurrent runs: not settled. It is unchanged since the base, it passes alone, and under the rules file it is not the step's.
- The look cases C13 and C20, and the order of the research hub deck's `more` and `ideas` tiles: these are the orchestrator's at landing, and were judged here only by reading.
- The research hub's `deck/present.yml` line `sort: folder`, and any other hub holding a group `sort:`: these are the landing's data check and change, as the round brief rules.
- The two skipped rows of the related run (config-folder.test.ts's real-hub rows under `OCULUS_TEST_HUB`) and the integrity case over the real hub: not run here.
- `docs/diagrams/writes.dot` and `writes.svg`, changed in the round: the regeneration matches the source byte for byte (above). Whether every hunk comes from this step would take a regeneration on the base, which would write into the base copy, and was not run.

Reviewer usage: ad5773f9238f2e526, claude-opus-5-5, 203404 tokens, 56 tool uses, 13.1 min.

## Closed

- Round 1, Proof 1 (the two red rows of a related run left unnamed): closed at landing. The plan's whole verify list runs on main with no other test process on the machine, and its lines are quoted in the booking; the reviewer's own rerun of the related list passed 306 of 306 with 2 skipped. The unnamed rows are recorded in the booking.
- Round 1, Standards 1 (`groups.ts:8-10`, the head comment with no word on the pin): fixed at landing, "as the boards order a section's cards" replaced by "and then the board's order, stage then title, with no pin read".
- Round 1, Standards 2 (verify runs beyond the round brief's one run): recorded in the booking; no change to the code.
- Round 1, C20 (the look): settled at the landing's look on 8797.
