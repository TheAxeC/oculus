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
