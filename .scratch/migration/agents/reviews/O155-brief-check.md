# Step O155 brief check (on main at 2fb7177ad)

## 1. Names

Commands run from `~/workspace/oculus`:
- (a) `grep -rn "field_sort\|value_sort\|sort_unknown\|groupKey\|'sort'" src config tests docs --exclude=local.yml` (the brief's own grep)
- (b) `grep -rnE "deck_order|GroupSpec|\bsorted\(mine|stageRank|BOARD_SORT|byWord|compareCards|field_sort|rule_adds|rule_edit_tip|sort_unknown|value_sort|DeckProject|DeckContext|groupKey|DeckKeys" src tests config docs utils README.md .scratch/migration/agents/guarded.md --exclude=local.yml | cut -d: -f1 | sort | uniq -c` (`bin` does not exist: `ls bin` prints "No such file or directory")
- (c) `grep -rn "sort" src/lib/data/sources/deck/ src/lib/state/life/arrange.ts src/lib/server/edit/writes/config/lists/deck/ src/lib/data/sources/documents/decks.ts src/lib/server/content/deck/ | grep -v "\.sort("`
- (d) `grep -rn "DeckKeys" src tests`
- (e) `grep -rln "radar_buckets" src tests docs config utils README.md --exclude=local.yml` (every place that lists the vocab.yml keys, which `deck_order` joins)
- (f) `grep -rn "rule_adds\|rule_edit_tip\|sorted(" src tests`

Hits outside "Paths this step writes", each with whether the change makes it false:
- `src/lib/data/model/model-deck.ts:293-302`: `DeckKeys` is defined here, not in `spec.ts`. The doc comment names "each group's `find`, `sort` and `discover`" (`:296`), and the type is `groups: { name: string; find: unknown; sort: unknown; discover: unknown }[]` (`:301`). Item 4 ("`DeckKeys`' `sort` ... go") cannot be built without this file, and the change makes `:296` false. The file is not in the write list.
- `src/lib/server/edit/deck-edit.ts:20-21`: the head comment says "a group's `find`, `sort` and `discover`". The change makes it false. Not in the write list.
- `src/lib/server/edit/writes/config/lists/deck/deck.ts:45`, `:250` import `KEY_FIELDS`. The list gets shorter, so these stay true.
- `src/lib/views/academic/present/arrange/Group.svelte:160`, `t('present.rule_edit_tip', name)`. The new text keeps one hole, so this stays true.
- `src/lib/data/model/index.ts:465` (re-export of `DeckKeys`) and `src/lib/server/content/deck/read.ts:10`, `:96` (`DeckProject.id` comment and the `deckReader` call) stay true while `DeckInput` keeps its shape.
- `tests/state/boards/board/board-rules.test.ts:289` (`key !== 'sort'`) is the categories' `sort`, so it stays true. `findings.schema.sort_unknown` (`src/lib/data/snapshot/schema/run.ts:374`, `config/text/findings.yml:349`, `tests/data/snapshot/schema-rules.test.ts:678`) stays, as the brief says.
- The other `groupKey` functions (`src/lib/state/boards/structure/cross-links.ts:59`, `src/lib/views/shared/links/CrossLinks.svelte:19-94`, `src/lib/views/sources/files/sections/OpenEditors.svelte:95-227`) and the other `sorted` functions (`deck.ts:196`, `ui/display/table/Table.svelte:48`, `snapshot/references/rename.ts:220`, `state/sources/repositories/diff/diff-hunks.ts:172`) are other functions and stay true.
- `History.svelte:134` and `config/text/views/system/history.yml:60` (`history.kind_deck_order: deck order`, the History word for a write of a deck's `order:`) stay true. The words "deck order" now name two things, though: this History kind and the new vocab key.
- `.scratch/migration/agents/guarded.md:74` (G8's Code line names `deck.ts`) stays true. guarded.md has no group-sort sentence: `grep -n "sort" .scratch/migration/agents/guarded.md | grep -i "deck\|group\|discover\|folder or title"` prints nothing.
- The vocab key lists. Adding `deck_order` to `config/catalogs/vocab.yml` makes these false, incomplete or red:
  - `src/lib/data/helpers/hub-names.ts:712-760` (`HUB_LIST`). `docs/data-map.md:82` says a hub's `.oculus/config.yml` "may set these 68 keys and no others; any other key is a finding and is not applied". Without `deck_order` in this list, a hub's `deck_order:` is a finding and is not applied.
  - `src/lib/data/shapes/hub-keys.ts:11-53` (`OWN_HUB_KEYS`). A hub other than the primary reads its own value only for a key named here; for any other key `primaryOnly` gives a finding.
  - `tests/checks/config/config-folder.test.ts:229-253`, the expected keys of `catalogs/vocab.yml` in 'holds exactly the expected top-level keys, and no more'. It goes red as soon as vocab.yml holds `deck_order`.
  - `docs/data-map.md:82` (the count 68) and its key list `:95-130`.
  - `docs/HELP.md:586`, which lists the lists replaced whole and the two-rows rule. Only lines 308 and 331-337 of HELP.md are in the write list.
  - `.scratch/migration/agents/guarded.md:192` (G126 names the lists replaced whole one by one). Not in the write list.
  - `docs/templates.md:469-472` (the "lists below are replaced whole" paragraph) is only partly inside the written range 450-470.
- `src/lib/data/sources/config/catalog/options.ts:742` (`configItems`) and `:785`. If item 2's removal path adds a source of the category keys to `SOURCES`, `hub-layer.ts:85-92` (`sourceWords`) resolves every source through `configItems`, so this file needs the new source too. Not in the write list.
- `src/lib/data/index.ts:605-623` (`readOtherHub`) runs `categoriesFindings` only when the hub's file sets `categories` (`:622`). A `deck_order` finding put inside `categoriesFindings` is never raised for a non-primary hub that sets only `deck_order`. Not in the write list.
- `src/lib/data/shapes/vocab-keys.ts:205-217` (`UNION_FIELD`: "A list not named here is a list of texts") stays true for `deck_order`. `tests/checks/tree/layer-rows.ts:129-134` (what `data/shapes/boards/**` holds) stays true.

Findings: `model-deck.ts` and `deck-edit.ts:21` are needed by item 4 and are missing from the write list. `hub-names.ts` (`HUB_LIST`), `hub-keys.ts` (`OWN_HUB_KEYS`), `config-folder.test.ts`, `docs/data-map.md`, `docs/HELP.md:586` and `guarded.md:192` (G126) are needed by item 2 and are missing; without the first two, no hub can set `deck_order`, so C6, C9 (a hub's list), C10 and C11 cannot hold. `options.ts` is missing for item 2's removal path, and `index.ts` for the finding in a non-primary hub. All of these are path widenings inside the step's own requirements (ruling "Brief check scope", open item 374 (a)).

## 2. The step line

The step line is `plan.md:1696`. Each part, mapped to the requirement that serves it:
- "a list `deck_order:` in `config/catalogs/vocab.yml`": item 2.
- "described in `config/options/catalogs/vocab.yml`": item 2.
- "`[publications, other-outputs, in-review, in-flight, released, idea, dead-ends]`": item 2, the same list.
- "the order a deck places the categories of `categories:` in": item 3.
- "inside a category a deck orders its project decks by that row's `sort:`, as the project boards do (`docs/HELP.md:308`)": items 1 and 3; item 6 for `:308`.
- "board pins not read": item 3 ("No pin is read"), C7.
- "a category the list leaves out comes after the listed ones in the order of `categories:`": item 3, C6.
- "a group's `slides:` list still places the decks it names first ... the decks `discover: true` adds follow in this order": item 3, C4.
- "the group key `sort:` removed from the deck reader, the deck schema, the Overview's Edit Rule form, `docs/decks.md`, `docs/HELP.md` and the tests": items 4, 5, 6, 7.
- "built by a builder agent (ruling Deck order)": the dispatch; no requirement needed.

The brief also requires things the line does not name, each written as a decision of the brief: the place of the decks in no category (decision 2), the folder-path tie (decision 3), the Add tile's order (decision 4), and the `deck_order` findings (decision 5).

Findings: none. Every part of the line has a requirement.

## 3. Premises

Each command of "What is on the tree", rerun:
- Step line and ruling: `grep -n "^- O155" .scratch/migration/plan.md` prints `1696:- O155 the deck order: ...`, and `grep -n "Deck order" .scratch/migration/plan.md` prints `3582:- Deck order (2026-11-06): ...`. Both hold.
- `wc -l src/lib/data/sources/deck/groups.ts` prints `219`. The read lines hold: `:142-155` (slides), `sorted` `:113-122`, called at `:192`, candidates `:196-198`.
- `spec.ts:33` holds `sort: 'folder' | 'title';`. The read `:158-165` holds, and `findings.yml:121` holds `sort_unknown: group {0} sorts by {1}, ...`.
- The brief's grep (Names (a)) reproduces every hit the brief lists. It does not reach these:
  - `src/lib/data/model/model-deck.ts:296`, `:301`. The brief says "`spec.ts:102`, `readKeys` holds `sort` ... in `DeckKeys`", but `DeckKeys` is declared in `model-deck.ts:298-302` (`grep -rn "DeckKeys" src tests`).
  - `src/lib/server/edit/deck-edit.ts:21`.
  - `tests/routes/edit/deck-slides.test.ts:245` (the test title "...a group's sort, discover and find..."), `:268` (`'groups.pillars.sort'`), `:311` (row `'a sort of another word'`) and `:313` (its reason). Found by `grep -rn "sort" tests/routes/edit/deck-slides.test.ts`.
- History log: `grep -h '"deck-slides"' ~/.oculus/history/* ~/.oculus/changes.jsonl | grep -c '"field":"sort"'` prints `0`, preceded by 20 lines `grep: ... Is a directory`, because the entries under `~/.oculus/history/` are folders. A recursive rerun, `grep -rh '"deck-slides"' ~/.oculus/history ~/.oculus/changes.jsonl | grep -c 'sort'`, prints `0`, and `grep -c 'deck-slides' ~/.oculus/changes.jsonl` prints `0`. The premise holds, but no deck-slides record exists at all, and the brief's command does not read the history folders.
- The text lines hold: `present.yml:69-74`, `:126` and `:130`, `server.yml:151`, `deck-schema.yml:27`, `:30`. So do the docs lines `decks.md:88`, `:100`, `:119`, `:130`, `:139`, `HELP.md:337`, `:308`, `:331` and `templates.md:1927` (`sed -n '1925,1930p' docs/templates.md` prints `#     sort: folder           # folder or title`), and the tests lines `deck-slides.test.ts:221-222`, `:253`, `:283`, `:312`, `:327` and `tests/fixtures/hubs/demo/deck/present.yml:9`.
- "Hits that stay" hold. The Focus clusters are at `vocab.yml:175-179` (brief: `:174-179`).
- `sed -n '1,60p' ~/workspace/research-hub/deck/present.yml` shows line 19 `        sort: folder` in group `more`. Holds.
- `grep -rn "discover" tests --include='*.ts' -l` prints only `tests/server/edit/deck/deck-edit.test.ts` and `tests/routes/edit/deck-slides.test.ts`, and `wc -l tests/data/sources/present.test.ts` prints `749`. Holds.
- Boards order: `presets.ts` is 721 lines; `stageRank` `:331-334`, `BOARD_SORT` `:337`, `byWord` `:344-361`, `compareCards` `:368-381`. The callers are at `items.ts:195`, `facets.ts:233`, `:347`, `:354` and `card-order.ts:11`, `:69` (`grep -rn "stageRank\|BOARD_SORT\|byWord\|compareCards" src ...`). `vocabKeys` is at `presets.ts:585`, `:630`, `:667` and is defined at `vocab-keys.ts:61`. Holds.
- Categories: `categories.ts` is 158 lines and holds. The claim "The rows are `config/catalogs/vocab.yml:280-287`" does not hold: `grep -n "^categories:\|in-review, \|dead-ends, " config/catalogs/vocab.yml` prints `270:categories:`, `271: - { key: in-review, ...` and `277: - { key: dead-ends, ...`, so the rows are `:271-277`. The read range in "Read" (`:270-290`) is right. `grep -n "^categories" ~/workspace/research-hub/.oculus/config.yml` prints nothing (rc=1). Holds.
- `DeckProject` `kinds.ts:30-59` holds, with no `year` and no `pin`. `model-entities.ts:427` is `year?: number;`. `decks.ts` is 125 lines and `deckProject`/`deckReader` are at `:61-92`. `createReader` is at `read.ts:202`; `DeckContext` spans `:78-97` (the brief says `:78-110`, which runs into `DeckReader`). The callers hold (`grep -rn "createReader(\|deckReader(" src tests`).
- Vocabulary files: `vocab.yml:4` and `options/catalogs/vocab.yml:4`, `VOCAB_SHAPES` `in-place.ts:82-108`, `vocab.ts` (547 lines, `categorySort` `:316`, `categoryRow` `:319`), `categoriesFindings` `boards.ts:225-262`, the options `categories` entry `:318`, and `SOURCES` (no category-key source, `catalog-words.ts:67-95`) all hold.
- `grep -rn "deck_order" src config docs tests --exclude=local.yml` prints only `History.svelte:134` and `history.yml:60`. Holds.
- Folders: `git ls-files src/lib/data/sources/deck | wc -l` prints `10`, `ls tests/data/sources | wc -l` prints `10`, and `git ls-files src/lib/data/shapes/boards | wc -l` prints `8`. Holds.
- Guarded rows: G124 is `guarded.md:186-188` (`sed -n '188p'` is its Test line, which names `tests/data/sources/config/boards.test.ts` describe 'categoriesFindings' every row). The brief says `:186-187`. G32 `:276-278` holds.
- "The verify list of the state file equals the commands of its verification page": the brief gives no command for this; not verified.
- A premise stated without a command does not hold: item 4's "No code reads, refuses or reports a leftover `sort:` key in a group". Once `sort` leaves `config/schemas/deck-schema.yml`, the schema check reports it:
  - `projectFileSchemas` (`src/lib/data/snapshot/schema/static.ts:80-84`) holds every project deck and the portfolio deck to `deck_schema`;
  - a records field's record is `additionalProperties: false` (`record.ts:243-246`, `:350`);
  - an extra key is `findings.schema.not_declared` (`check.ts:226-229`; `findings.yml:327`: "key {0} is not declared by the schema of this file").
  - So the research hub's `deck/present.yml:19` raises that finding on the worktree until the landing change, and the real-hub case 'validates with no findings' (`tests/checks/config/integrity.test.ts:199-201`) goes red there. This comes from reading the code; it was not run.

Findings: the vocab.yml rows are at `:271-277`, not `:280-287`. `DeckKeys` lives in `model-deck.ts`. The brief's grep misses `model-deck.ts:296`/`:301`, `deck-edit.ts:21` and `deck-slides.test.ts:245`, `:268`, `:311`, `:313`. G124 ends at `:188`. The history command errors on 20 folders and finds no deck-slides record at all. "No code ... reports a leftover `sort:` key" is false: the schema check reports `not_declared`, so the real-hub integrity case goes red before the landing change.

## 4. Cases and checks

- Item 2 and C9 conflict with an established rule. "A key listed twice is read at its first place, and the second is a finding" breaks the rule stated for every list replaced whole, which the brief puts `deck_order` among: "a hub's list other than focus_clusters ... with two rows naming one `key` ... is a finding and oculus's list stands". That rule is in `config/catalogs/vocab.yml:4`, `config/options/catalogs/vocab.yml:4`, `docs/templates.md:469-472`, `docs/HELP.md:586` and G126 (`guarded.md:192`). The brief must either name `deck_order` as a second exception beside `focus_clusters` in each of those places, or follow the whole-list rule.
- Item 2's merge shape is left open. `WHOLE` is `{ kind: 'whole', field: 'key' }` (`in-place.ts:64`) and tells rows apart by `key`. A list of texts is `{ kind: 'whole' }` (`READ_BY_ROW` `:76`; `WHOLE_LIST` `hub-layer.ts:79`). "Replaced whole" does not say which, and the choice decides C9's duplicate behaviour.
- Item 2: the options entry names no control, and `SOURCES` has no source of category keys. The Settings row for `deck_order` is a user-visible shape the brief leaves to the builder (rules file, "The working rules ...", No silent design decisions).
- Item 4: under the "Premises" finding above, the brief should state that the real-hub `not_declared` finding is expected until the landing change, and that the schema field is not kept to avoid it.
- Test rule (rules file, "What every package obeys": a test exists only as the test of one entry of guarded.md):
  - C1-C8 rows go to G32, but G32's statement (`guarded.md:276`) does not state the deck order, and item 6 only names G32's Test line.
  - The `deck_order` findings (C9) would sit in G124's describe 'categoriesFindings' (`tests/data/sources/config/boards.test.ts:199`), whose statement `:186` does not state them. `grep -rln "categoriesFindings\|categories_row" tests` prints only that file; item 7 does not name it, and the write list covers it only as "the vocabulary and config test files item 7 names".
  - C10 and C11 are merge behaviour of G126, whose test is `tests/data/sources/config/layers/hub-vocab.test.ts` (rows `:198` 'replaces the lists whose order is their meaning whole' and `:358` 'lays the categories over oculus's by key ...'). Neither that file nor G126's lines are in the write list or in item 7.
- Item 7 says "or a new file beside the deck tests where that folder has room; `tests/data/sources` is full". It names no folder with room. `tests/checks/tree/size.test.ts:56` measures `tests` too, so `present.test.ts` (749 lines) has 131 lines of room for eight table rows and their fixtures.
- C13: `grep -rln "ruleSentence\|RuleForm" tests` prints nothing and no guarded entry names `arrange.ts`, so C13 is reading and the look. That is consistent with the rules.
- C14 is consistent with G8 (`deck-slides.test.ts` describe "writing a deck's keys", every row). The row at `:327` ("a group the deck does not have") names `sort` and must move to another key; item 4 covers that.
- C2 does not say which title: the project's (`DeckProject.title`, `kinds.ts:44`), which the boards compare, or the deck's (`Doc.title`, `groups.ts:37`).
- C16 asks the builder to check a place the step does not change: the research hub's deck, read only, whose `sort:` line the orchestrator changes at landing. The integrity case it names checks members only (`integrity.test.ts:256-263`, `group.missing`). The before-and-after order needs a case-run program, which the brief does not mention.
- C17: the diagrams count imports per folder (`docs/diagrams/layer-data.dot:27`, `"folder data/sources to folder data/shapes" [label="44", ...]`). No diagram names the moved functions, so "the diagrams the moved functions appear in" names nothing.
- C12 quotes G124's tests over `presets.ts`, which the step changes. That is consistent.

Findings: the duplicate rule of item 2 and C9 conflicts with the whole-list rule in five places. The merge shape and the Settings control are unnamed. The expected real-hub schema finding is not stated. C1-C8, C9, C10 and C11 rows fall under entries whose statements, files or lines are not in the brief (G32 `:276`, G124 `:186`, `boards.test.ts`, G126 `hub-vocab.test.ts` and `guarded.md:192-194`). Item 7's alternative test file has no folder. C2 names no title source. C16 checks the hub's deck, which the step does not change, with a case that asserts no order. C17 names diagrams that do not exist.

## 5. The question

The goal here is a deck ordering its project decks by `deck_order` and the rows' `sort:`, with the group `sort:` key gone.

- C1: yes. The row runs through `createReader` with a context the test builds. Item 3 builds that context in `deckReader` from `hub.config.merged` (`decks.ts:81-92`), and no case goes through `deckReader`, so the row passes with that wiring wrong.
- C2: yes. With project titles equal to deck titles it passes whichever title is compared, and it passes on the base wherever folder order coincides with the expected order. Only C1 is asked to fail on the base.
- C3: yes, for the same coincidence. The rules file ("What every package obeys") asks each new row's failing line on the unchanged tree, but the brief does not ask for fixture folders whose folder order runs against the expected order.
- C4: no, provided the discovered folders sort against the deck order.
- C5: yes, if the no-project and no-row decks' folders sort last on the base.
- C6: yes. The resolution (left-out categories appended in `categories:` order) is built in `deckReader` (item 3, "the resolved order of their keys"), so a `createReader` row handed a resolved order tests none of it.
- C7: yes. `DeckProject` carries no `pin` (`kinds.ts:30-59`), so the row cannot fail.
- C8: no, given C1 (`keptMembers` keeps the order, `groups.ts:216-219`).
- C9: partly yes. A key no category holds has no decks, so "the key is not read" never shows in an order; only the finding is observable.
- C10: yes for the order part when it is a merge-only row; no for the finding.
- C11: no for the merge; yes for the goal, since no row joins the merged list to a deck read.
- C12: yes. G124's tests pass whether or not the decks use the shared function.
- C13: no, by reading and the look.
- C14: no.
- C15: yes. `findings.deck.sort_unknown` cannot match the YAML key at `findings.yml:121` (nested `sort_unknown:` under `deck:`, shown by `sed -n '119,122p' config/text/findings.yml`). No pattern matches `History.svelte:125` `'sort'`, `deck-keys.ts:14`, `:20`, `:77-78`, `model-deck.ts:301` or `deck-edit.ts:21` either.
- C16: yes. Nothing asserts the order.
- C17: yes. It is unrelated to the goal.
- The check on the step's line: the line names none, and the brief's verify list (`npm run test:quick`, the named vitest files, C15) passes with `deckReader`'s wiring wrong (C1's reason). Yes.
- Item 1: no. G124's tests are unchanged, and `compareCards` calls the shared function, which reading shows.
- Item 2: yes. No case checks that a hub may set the key (`HUB_LIST`, `OWN_HUB_KEYS`), so a hub's `deck_order` can be refused while every `createReader` row passes.
- Item 3: yes (C1).
- Item 4: yes (C15).
- Item 5: no (the texts are read word for word).
- Item 6: yes. It is reading only.
- Item 7: yes (C1-C8 go through `createReader` only).

Findings: C1, C2, C3, C5, C6, C7, C9, C10, C11, C12, C15, C16, C17, the line's check and items 2, 3, 4, 6 and 7 could pass without the goal. The widest gap is that no case reads a deck through `deckReader` with a hub's merged config, so the place where `deck_order` reaches the order is never exercised. One table row through `deckReader` (or `tests/data/hubs/decks.test.ts`'s fixture) closes it. Each row should also fail on the base by its folder names.

## 6. Implied inputs

These are not in "Cases"; each with its expected result:
- A hub whose own `categories:` replace a row, for example `publications` with `sort: [title]`: the deck orders that category by the hub's row, read from the merged config. Missing.
- A portfolio deck of a hub other than the primary, and a deck under a root that is no hub (`server/content/deck/read.ts:82-87` falls back to `source.config` and the primary): ordered by that hub's merged categories, `deck_order` and stage order, and under a non-hub root by the primary's. Missing.
- A deck whose project has no stage: every row has a `stages` block (`vocab.yml:271-277`), so it falls in no category and goes to the tail by folder. Missing; C5 does not say no stage.
- The Settings view drawing and writing `deck_order`: drawn under boards / Vocabulary with oculus's list as default, a write storing the hub's whole list in its `.oculus/config.yml`, and whether it can be reordered. The control is unnamed. Missing; a look item.
- A hub that sets `deck_order` to something that is not a list (a text, a map, null): one finding naming the hub's file and `deck_order`, and oculus's list stands (G126's wrong-kind rule). Missing. An entry that is not a text: a shape finding of `vocab.ts`, and the entry is not read. Missing.
- `deck_order: []`: every category in `categories:` order. Missing.
- A hub other than the primary that sets `deck_order` with an unknown key: a finding naming that hub's settings file. This needs `HUB_LIST`, `OWN_HUB_KEYS` and `readOtherHub` (`index.ts:622` runs `categoriesFindings` only when the file sets `categories`). Missing.
- A hub that removes a category and names it in its own `deck_order`: one finding at the word's place in the hub's file, and the word is not read (G126). Missing.
- A hub that adds a category row its `deck_order` leaves out: it comes after the listed ones, in `categories:` order (new rows last). Partly covered by C6.
- Two decks tied under a category's words: by folder path (decision 3). Missing as a row.
- A discovering group whose decks are all no project's: folder order (decision 2). Missing.
- A project title different from its deck title, for `title`: expected the project's title, as the boards do (my judgment; the brief does not say). Missing.
- The real hub's leftover `sort:` before the landing change: `findings.schema.not_declared`, with the real-hub 'validates with no findings' red. Missing.
- The boards' tests depending on the moved functions' import paths: `grep -rn "stageRank\|BOARD_SORT\|byWord\|compareCards" ... tests` has no hit in `tests`, so no test imports them. Not a gap.
- The layer-boundary check for the new file: `data/shapes/boards/**` is in the state row (`tests/checks/tree/layer-rows.ts:324`) and `data: ['data/**']` (`:371`). The check passes while the new file imports only `data/`. Not a gap.

Findings: twelve implied inputs above are missing from "Cases".

## 7. ADRs

- `test -d docs/adr || echo "no docs/adr"` prints `no docs/adr`.
- `ls docs | grep -i adr` prints nothing.
- `find . -maxdepth 3 -type d -iname "*adr*" -not -path "./node_modules/*" -not -path "./.agents/*"` prints nothing.
- The state file's configuration block has no `adr` key (`sed -n '1,60p' .scratch/migration/orchestrator-state.md`).

Findings: none. The brief's statement holds.

## 8. Dictated text

- `grep -n "rule_adds: \|rule_edit_tip: \|deck_order: \[\|and adds what it finds\.\"" .scratch/migration/agents/briefs/O155.md` prints lines 19, 38, 42, 43 and 63.
- Brief line 42, `rule_adds: '{0}, and adds what it finds.'`: holds. It reads "Finds <...>, and adds what it finds." with `rule_finds: 'Finds {0}'` (`present.yml:131`); plain, ASCII, no dash, no 'not X but Y'.
- Brief line 43, `rule_edit_tip: 'Set which decks {0} finds and whether it adds them'`: holds. One hole, as `Group.svelte:160` passes one argument; it has no closing period, like the text it replaces.
- Brief line 38, `deck_order: [publications, other-outputs, in-review, in-flight, released, idea, dead-ends]`: holds. It equals the ruling's list at `plan.md:3582` word for word.
- Brief line 63, the C13 quote "..., and adds what it finds.": holds. It is an elision inside the brief, not text for a file.
- `LC_ALL=C grep -n '[^ -~]' .scratch/migration/agents/briefs/O155.md` prints nothing.

Findings: none.

## Declined to judge

- Whether G32's statement covers the order of discovered decks, or the deck order needs a new guarded entry (that needs Axel's yes under the test rule). The session decides.
- Which Settings control `deck_order` gets, and whether it can be reordered: a user-visible shape for Axel.
- Whether the schema finding on a leftover `sort:` is wanted (it fits the no-migration-code rule) or should be stated as a decision.
- Whether 131 lines of room in `present.test.ts` are enough for the rows.
- Path overlap with O157's brief, which is in flight beside this one (`orchestrator-state.md:30`): not checked, outside this check.

Agent usage: af5bb92a343ab966d, claude-opus-5-5, 260942 tokens, 105 tool uses, 16.7 min.

## Closed

Each finding with the change to the brief that closes it (the orchestrator, automode, booked in `choices.md`).

- 1. Names: `model-deck.ts`, `deck-edit.ts:20-21`, `hub-names.ts` (`HUB_LIST`), `hub-keys.ts` (`OWN_HUB_KEYS`), `config-folder.test.ts`, `docs/data-map.md` 82-130, `docs/HELP.md:586`, `docs/templates.md` widened to 450-475, `guarded.md` G126 and `src/lib/data/index.ts` (`readOtherHub`) added to "Paths this step writes" and to item 2 or 4. `options.ts` is not added: item 2 now says no new source joins `SOURCES`, so `configItems` is untouched. The two meanings of "deck order" are named in "What is on the tree".
- 3. Premises: the vocab rows corrected to `:271-277`; `DeckKeys` placed in `model-deck.ts:293-302`; the `deck-slides.test.ts` lines `:245`, `:268`, `:311`, `:313` added to item 4; G124 given as `:186-188`; the history command replaced by the recursive grep with its result; the schema check's `findings.schema.not_declared` on the hub's `deck/present.yml:19` stated as expected until the landing removes the line, the schema field not kept for it.
- 4. Cases and checks: the duplicate rule follows the whole-list rule (decision 5, C12a); the merge shape is `{ kind: 'whole' }` and the Settings control `list` (item 2, decisions 5 and 8); the G32, G124 and G126 statements and Test lines get the wording of the new rows (item 7, decision 9, `guarded.md` lines in the path list); the alternative test file removed, the rows in `present.test.ts` within its 131 lines of room; C2 names the project's title; C16 rewritten as a `deckReader` row and the hub's deck moved to the orchestrator's look (C20); C17 rewritten to a finding of a non-primary hub, the diagram case dropped.
- 5. The question: a `deckReader` row over a fixture hub's merged config (C16, C12c) and fixture folder names sorted against the expected order, so every order row fails on the base; C7 (pins) became a reading of `DeckProject`, which carries no pin; C17 and C18 check that a hub may set the key (`HUB_LIST`, `OWN_HUB_KEYS`), C19 that the config folder names it.
- 6. Implied inputs: added as C12a (wrong kind, a key twice), C12b (`[]`), C12c (a hub's own row), C12d (no stage, ties, no project), C16b (a non-primary hub, a root that is no hub), C17 and C18 (unknown key in a non-primary and the primary hub), C20 (Settings at the look). The hub that adds a category row its list leaves out stays under C6.
- Declined to judge: G32 covers the order of discovered decks, so no new entry is needed; the `list` control is taken as decision 8 (the existing control of an ordered list of texts, `config/options/behavior.yml:41`); the schema finding is expected (no migration code); the room in `present.test.ts` is stated; the overlap with O157 is the orchestrator's compare (Steps 5).
