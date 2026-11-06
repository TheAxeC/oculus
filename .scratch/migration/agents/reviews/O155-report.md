# O155 report: the deck order

Everything in the brief is done.

## Open items of the state file

Copied from `.scratch/migration/orchestrator-state.md`, section "Open items":

> None.

## The cases' first run

Every new and changed test row was run on the unchanged source before any source change (the tests written first, `src/` and `config/` as the base). C16's row was run against the base source on a scratch copy assembled from `.agents/worktrees/O155-base` (`src`, `config`, `tests`, `utils`) with the worktree's `tests/data/hubs/decks.test.ts` and `tests/fixtures/hubs/deck-hub.ts` copied in and `node_modules` linked, the command `npx vitest run tests/data/hubs/decks.test.ts` run in it; the copy wrote nothing into the step's diff and was removed before this report. Its fixture plants the five projects under `side-projects/`, a scan folder of `config/defaults/sources.yml:12` that the demo hub leaves empty, so each deck has its project.

- C1. `npx vitest run tests/data/sources/present.test.ts` on the base: `<multiplication sign> |unit| tests/data/sources/present.test.ts > the order of the decks a group discovers > 'C1: the publications newest first, th<ellipsis>'` (vitest's own truncation of the title), with `expected [ 'a', 'b', 'c', 'd', 'e' ] to deeply equal [ 'd', 'e', 'c', 'b', 'a' ]`. The base orders by folder path.
- C2. Same run: `'C2: publications of one stage and yea<ellipsis>'` failed with `expected [ 'a', 'b', 'c', 'd' ] to deeply equal [ 'b', 'a', 'd', 'c' ]`.
- C3. Same run: `'C3: in flight, a row with no sort, by<ellipsis>'` failed with `expected [ 'a', 'b', 'c' ] to deeply equal [ 'c', 'b', 'a' ]`.
- C4. Same run: `'C4: the decks slides names first in i<ellipsis>'` failed with `expected [ 'z', 'y', 'a', 'b', 'c' ] to deeply equal [ 'z', 'y', 'b', 'c', 'a' ]`.
- C5. Same run: `'C5: a deck of no project and a projec<ellipsis>'` failed with `expected [ 'a', 'b', 'c', 'd' ] to deeply equal [ 'c', 'd', 'a', 'b' ]`.
- C6. Same run: `'C6: the categories deck_order leaves <ellipsis>'` failed with `expected [ 'a', 'b', 'c', 'd' ] to deeply equal [ 'd', 'c', 'b', 'a' ]`.
- C7. Checked by reading. `DeckProject` (`src/lib/data/sources/deck/kinds.ts`) holds no `pin`, `deckProject` in `src/lib/data/sources/documents/decks.ts:64-82` copies none, and `inDeckOrder` in `groups.ts:135-157` reads the project's stage, year and title through `compareProjects` (`order.ts`), which reads no pin. `compareCards` (`presets.ts`) keeps the pin for the boards alone. `grep -n "pin" src/lib/data/shapes/boards/order.ts src/lib/data/sources/deck/groups.ts` prints only comment lines: `order.ts:4` and `:25` (the boards' pinned cards), `order.ts:50` ("No pin is read here: a board puts its pinned cards first itself.") and `groups.ts:133` ("No pin is read.").
- C8. Same run: `'C8: the decks a filter keeps, in the <ellipsis>'` failed with `expected [ 'a', 'b', 'c' ] to deeply equal [ 'c', 'b', 'a' ]`.
- C9. `npx vitest run tests/data/sources/config/boards.test.ts` on the base: the row 'gives the findings of a key no row of categories holds, naming the settings file it is in' failed; every row of the new describe failed on the base because `deck_order` is no key of the hub list: the finding read `key deck_order is not one the hub's settings file takes; it is not applied`. 39 rows passed, 7 failed.
- C10. `npx vitest run tests/data/sources/config/layers/hub-vocab.test.ts` on the base: "keeps oculus's deck order with no finding when the hub takes out a category it names" failed with `the given combination of arguments (undefined and string) is invalid for this assertion` (oculus ships no `deck_order` on the base). The reader row 'C10: a key of deck_order no row of ca<ellipsis>' of present.test.ts failed with `expected [ 'a', 'b' ] to deeply equal [ 'b', 'a' ]`.
- C11. Same hub-vocab run: "replaces oculus's deck order whole with the hub's own" failed with `expected [ Array(1) ] to deeply equal []` (the `hub_key_unknown` finding).
- C12a. boards.test.ts on the base: the rows 'a key named twice', 'a text', 'a map' and 'a list holding a map' failed, each on the `hub_key_unknown` finding.
- C12b. present.test.ts on the base: `'C12b: an empty deck_order, every cate<ellipsis>'` failed with `expected [ 'a', 'b', 'c', 'd' ] to deeply equal [ 'd', 'c', 'b', 'a' ]`.
- C12c. The publications row of C16's fixture hub sets `sort: [title]`; the C16 row checks it (`c-zeta` 2025 "Zeta" after `d-alpha` 2020 "Alpha", where oculus's row would put 2025 first).
- C12d. present.test.ts on the base: `'C12d: ties under the words of a categ<ellipsis>'` failed with `expected [ 'a', 'b', 'c', 'd', 'z' ] to deeply equal [ 'z', 'c', 'd', 'a', 'b' ]`, and `'C12d: decks of no project by folder, <ellipsis>'` failed with `expected [ 'b', 'a' ] to deeply equal [ 'a', 'b' ]` (the base orders that group by title, from its `sort: title`).
- C12. `npx vitest run tests/state/boards tests/data/shapes/catalog-files/vocab.test.ts tests/server/edit/deck` on the base: 9 files, 178 tests passed. After the change the same files pass unchanged (the verify run below).
- C13. `grep -rln "ruleSentence\|RuleForm" tests` prints nothing on the base and now, so no test row covers the form or the sentence. Checked by reading: `RuleForm.svelte` draws the Find field and the Discover checkbox and no Sort field; `ruleSentence` (`arrange.ts:488-510`, the return at `:509`) returns `t('present.rule_adds', finds)` for a discovering group, and `config/text/views/academic/present.yml` holds `rule_adds: '{0}, and adds what it finds.'` and `rule_edit_tip: 'Set which decks {0} finds and whether it adds them'`, the brief's words. The look is the orchestrator's.
- C14. `npx vitest run tests/routes/edit/deck-slides.test.ts` on the base: 'refuses a key the Overview does not set, a value the key does not take, a base the file does not hold, and a group it does not have' failed with `expected [ 'groups.pillars.sort' ] to deeply equal []`: the base takes `groups.pillars.sort` as a key the Overview sets.
- C15. On the base, the five greps printed the hits in `base-c15.txt`: `deck-keys.ts:94`, `arrange.ts:358`, `:512`, `groups.ts:114`, `:192`, `spec.ts:33`, `RuleForm.svelte:124-131`, `present.yml:69-74`, `server.yml:151`; `findings.yml:121`; `History.svelte:125`, `deck-keys.ts:14`, `:20`, `:77`, `:93`, `arrange.ts:342`, `:358`; `model-deck.ts:296`, `:301`, `deck-edit.ts:21`, `deck-schema.yml:27`, `:30`; `decks.md:88`, `:100`, `:119`, `:130`. Now each prints nothing but one line of `decks.md` about a category's `sort:` (the DONE table).
- C16. `npx vitest run tests/data/hubs/decks.test.ts` on the base copy with the fixture as it is now: `<multiplication sign> orders them by the hub's own deck_order and its own publications row, read from its merged settings` with `AssertionError: expected [ 'a-review', 'b-flight', <ellipsis>(3) ] to deeply equal [ 'e-idea', 'd-alpha', 'c-zeta', <ellipsis>(2) ]`; `Tests  1 failed | 1 passed (2)`. Its `findings` assertion (`[]`) passed on the base; the members assertion failed by the order.
- C16b. Checked by reading `src/lib/server/content/deck/read.ts:82-100`: `const owner = (source.hubs ?? []).find((one) => one.key === root); const config = owner?.config ?? source.config;` and, at `:96-97`, `const reader = deckReader({` with `hub: { key: hub.key, dir: hub.dir, config },`. `deckReader` builds the order from `hub.config.merged` (`decks.ts:93`, `order: deckOrderOf(hub.config.merged)`), so a deck of a hub other than the primary is ordered by that hub's merged config and a deck under a root that is no hub by the primary's. The build's read (`readDecks`, `decks.ts:112-130`) passes each hub's own config.
- C17. boards.test.ts on the base: the row 'a file setting only a key no row holds' failed on `hub_key_unknown`; the row runs once for the primary (`other` undefined) and once through `readOtherHub` with `other: 'lab'`.
- C18. The same rows run for the primary hub, the finding's file compared with `join(dir, HUB_FILE)`.
- C19. `npx vitest run tests/checks/config/config-folder.test.ts` on the base with `deck_order` added to the expected keys: 'holds exactly the expected top-level keys, and no more' failed with `expected [ 'agents', 'app_theme', <ellipsis>(113) ] to deeply equal [ 'agents', 'app_theme', <ellipsis>(114) ]`, and 'reads each file on its own and finds its own keys there and nowhere else' failed with `expected [ 'categories', 'chips', <ellipsis>(22) ] to deeply equal [ 'categories', 'chips', <ellipsis>(23) ]`. Both pass now.
- C20. The orchestrator's look; what to expect is under "What the look should show".

No case of the brief was found wrong.

## DONE / NOT DONE

| Item | State | Check |
| --- | --- | --- |
| 1. The order rule in layer 1 | DONE | `src/lib/data/shapes/boards/order.ts` (`stageRank`, `BOARD_SORT`, `compareProjects`, `DeckOrder`, `deckOrderOf`, `deckCategories`); `presets.ts` `compareCards` keeps the pin and calls `compareProjects`; `items.ts`, `facets.ts`, `card-order.ts` import from `order.ts`. The boards' tests pass unchanged (verify 2). |
| 2. `deck_order` in vocab.yml | DONE | `config/catalogs/vocab.yml` after `categories:`; `config/options/catalogs/vocab.yml` entry (boards, Vocabulary, `control: list`); `catalog-files/vocab.ts` `z.array(text)`; `VOCAB_SHAPES` `deck_order: TEXTS` (`{ kind: 'whole', texts: true }`); `HUB_LIST`; `OWN_HUB_KEYS`; `config-folder.test.ts`; `docs/data-map.md`; the whole-list sentences of `vocab.yml:4`, `options/catalogs/vocab.yml:4`, `docs/templates.md`, `docs/HELP.md:587`, G126. Findings: boards.test.ts describe "the deck_order of the primary hub and of a hub that is not the primary", 7 rows, each for the primary and for `lab`. |
| 3. The deck reader orders by it | DONE | `inDeckOrder` in `groups.ts`; `Finder.order`; `DeckContext.order`; `DeckProject.year`; `deckReader` builds it once. present.test.ts describe 'the order of the decks a group discovers', 11 rows; decks.test.ts describe 'the order of the decks a group of a hub discovers', 1 row. |
| 4. The group key `sort:` goes | DONE | C15 greps below; `spec.ts`, `model-deck.ts`, `deck-edit.ts`, `deck-keys.ts`, `arrange.ts`, `RuleForm.svelte`, `History.svelte`, the texts, `deck-schema.yml`, `docs/templates.md`, the demo fixture. |
| 5. Rule sentence and tip | DONE | `present.yml:120` `rule_adds: '{0}, and adds what it finds.'`, `:124` `rule_edit_tip: 'Set which decks {0} finds and whether it adds them'`; `ruleSentence` returns `t('present.rule_adds', finds)`. |
| 6. Docs and comments | DONE | listed under "Head comments, doc comments and docs". |
| 7. Tests and guarded entries | DONE | G32 (`guarded.md:276-278`), G124 (`:186-188`), G126 (`:192`). |
| V1. diagrams, palette, quick | DONE | `npm run diagrams && npm run docs:palette` exit 0, then `npm run test:quick` exit 0, its last lines: `ok      prettier (1.1 s): All matched files use Prettier code style!`, `ok      ASCII gate (1.1 s)`, `ok      svelte-kit sync (2.5 s)`, `ok      eslint (14.6 s)`, `ok      svelte-check (51.9 s): 1793974756388 COMPLETED 584 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`, `ok      vitest checks (230.4 s): Duration  208.59s (transform 90.53s, setup 0ms, import 236.31s, tests 532.33s, environment 7ms)`, `ok      vitest (338.3 s): Duration  320.86s (transform 320.09s, setup 0ms, import 559.47s, tests 632.79s, environment 21.59s)`, `ok      vitest slow (425.3 s): Duration  407.91s (transform 57.11s, setup 0ms, import 318.56s, tests 1291.96s, environment 18ms)`, `test:quick: 428.0 s; every command passed`, and its note `test:quick: not covered: tests that reach no changed file within the import depth, other than the checks under tests/checks/source and tests/checks/tree, which run for any change under src, tests or utils; the build, the lint of unchanged files`. |
| V2. related tests | DONE | `npx vitest run --reporter=dot tests/data/sources/present.test.ts tests/routes/edit/deck-slides.test.ts tests/server/edit/deck tests/state/boards tests/data/shapes/catalog-files/vocab.test.ts tests/data/sources/config/boards.test.ts tests/data/sources/config/layers/hub-vocab.test.ts tests/checks/config/config-folder.test.ts`: `Test Files  14 passed (14)`, `Tests  306 passed \| 2 skipped (308)` (the two skipped are config-folder.test.ts's rows of the real hub, run only under `OCULUS_TEST_HUB`); `npx vitest run --reporter=dot tests/data/hubs/decks.test.ts`: `Test Files  1 passed (1)`, `Tests  2 passed (2)`. |
| V3. C15 greps | DONE | each below |
| V4. ASCII gate | DONE | The spec's perl form over `$(find src tests bin config -type f ! -name local.yml)` printed nothing but `find: bin: No such file or directory` (the repository has no `bin/`); the same perl check over every touched file and this report prints nothing. |
| V5. `wc -l` | DONE | table under "Files"; each source file at or under 880, each component at or under 520 (`History.svelte` 492, `RuleForm.svelte` 145) |
| V6. unused exports | DONE | `sh utils/unused-exports.sh > unused-now.txt; diff .agents/worktrees/O155-base/unused-exports.txt unused-now.txt` prints nothing; `diff exit 0` |
| V7. folder check | DONE | `sh utils/folder-check.sh` printed nothing, exit 0 |
| V8. history words | DONE | below |
| V9. prose | DONE | below |

### V3, the C15 greps (now)

```
$ grep -rn "field_sort\|value_sort\|group\.sort\|'folder' | 'title'" src config tests docs --exclude=local.yml
$ grep -n "^ *sort_unknown: group" config/text/findings.yml
$ grep -n "'sort'" src/lib/views/system/history/History.svelte src/lib/server/edit/writes/config/lists/deck/deck-keys.ts src/lib/state/life/arrange.ts
$ grep -n "sort" src/lib/data/model/model-deck.ts src/lib/server/edit/deck-edit.ts config/schemas/deck-schema.yml
$ grep -n "sort" docs/decks.md
128:2. With `discover: true`, then every deck `find:` keeps that no group of the deck names, in the deck order: category by category, the categories of `categories:` in the order `deck_order` gives (`config/catalogs/vocab.yml`, which a hub's settings file replaces with its own) and then the categories it leaves out, in the order of `categories:`; inside a category by the row's `sort:`, as the boards order the cards of its section; then the decks whose project no row holds, and the decks of no project, by folder. A deck's category is its project's, the first row that holds it, as on the boards; two decks the words do not tell apart go by folder.
```

The four first greps print nothing. The one line of `decks.md` names a category row's `sort:`, not a group's.

### V8, the history-word grep

`git diff -U0` of every changed file and `src/lib/data/shapes/boards/order.ts` whole, the added lines, through `grep -inwE "before|used to|no longer|still|anymore|previously|formerly|O155|step [0-9]"`. Each hit:

- `guarded.md` G126, `vocab.yml:4`, `options/catalogs/vocab.yml:4`, `HELP.md:587`, `data-map.md:82`: "a new failure row read before oculus's", "A word a hub's value no longer gives". Both are the lines' existing wording, unchanged by the step (the step added `deck_order` to the lists in them); "before" is a place in a list and "no longer gives" names a word the hub's value lacks, not a past state.
- `hub-layer.ts` head comment: "A word the hub's values no longer give", the comment's existing sentence, rewrapped because the step's sentence lengthened the line before it.
- `in-place.ts`: "before oculus's, and any other after them" (the type's doc comment, a place in a list).
- present.test.ts: 'C2: publications of one stage and year by the project title, a year before none' (a place in the order).
- `order.ts:49`: "breaking the ties the words before it leave" (a place in the list of words).

No hit compares with an earlier state.

### V9, prose

Every new and changed sentence was read against the prose rule: ASCII, no dash standing in for a punctuation mark (the dash grep over the added lines hits only YAML list items, a subtraction and code), one name per thing (the deck order, `deck_order`, the category, the row's `sort:`), no history. Comments are wrapped at 100 columns: `awk 'length($0)>100 && /^ *(\/\/|\*|\/\*\*)/'` over the changed `.ts` and `.svelte` files prints nothing. No departure.

## Files

`diff -rq` of `src`, `tests`, `config` and `utils` against `.agents/worktrees/O155-base` (which holds only those four folders), with `wc -l`:

| File | Lines |
| --- | --- |
| `src/lib/data/shapes/boards/order.ts` (new, item 1) | 97 |
| `src/lib/data/shapes/boards/categories.ts` | 159 |
| `src/lib/state/boards/board/presets.ts` | 684 |
| `src/lib/state/boards/board/items.ts` | 254 |
| `src/lib/state/boards/board/facets.ts` | 362 |
| `src/lib/state/boards/collection/card-order.ts` | 102 |
| `src/lib/data/sources/deck/groups.ts` | 256 |
| `src/lib/data/sources/deck/spec.ts` | 213 |
| `src/lib/data/sources/deck/kinds.ts` | 399 |
| `src/lib/data/sources/deck/read.ts` | 833 |
| `src/lib/data/sources/documents/decks.ts` | 130 |
| `src/lib/data/shapes/catalog-files/vocab.ts` | 553 |
| `src/lib/data/sources/config/merge/in-place.ts` | 412 |
| `src/lib/data/sources/config/merge/hub-layer.ts` | 688 |
| `src/lib/data/helpers/hub-names.ts` | 858 |
| `src/lib/data/shapes/hub-keys.ts` | 68 |
| `src/lib/data/model/model-deck.ts` | 340 |
| `src/lib/server/edit/deck-edit.ts` | 249 |
| `src/lib/server/edit/writes/config/lists/deck/deck-keys.ts` | 114 |
| `src/lib/state/life/arrange.ts` | 528 |
| `src/lib/views/academic/present/arrange/RuleForm.svelte` | 145 |
| `src/lib/views/system/history/History.svelte` | 492 |
| `config/catalogs/vocab.yml` | 315 |
| `config/options/catalogs/vocab.yml` | 425 |
| `config/schemas/deck-schema.yml` | 32 |
| `config/text/findings.yml` | 505 |
| `config/text/server.yml` | 633 |
| `config/text/views/academic/present.yml` | 152 |
| `tests/data/sources/present.test.ts` | 878 |
| `tests/data/hubs/decks.test.ts` | 370 |
| `tests/fixtures/hubs/deck-hub.ts` | 412 |
| `tests/fixtures/hubs/demo/deck/present.yml` | 14 |
| `tests/routes/edit/deck-slides.test.ts` | 338 |
| `tests/data/sources/config/boards.test.ts` | 417 |
| `tests/data/sources/config/layers/hub-vocab.test.ts` | 546 |
| `tests/checks/config/config-folder.test.ts` | 850 |

Outside the base copy's folders, from `git status --short`: `docs/HELP.md` (643), `docs/data-map.md` (311), `docs/decks.md` (430), `docs/templates.md` (1940), `docs/diagrams/layer-data.dot`, `layer-state.dot`, `layer-views.dot`, `layers.dot`, `writes.dot` and their `.svg` (by `npm run diagrams`), `.scratch/migration/agents/guarded.md` (lines 186-188, 192, 276-278), and this report.

Paths outside the write list's ranges, each with its reason:

- `docs/templates.md:556-564`, the commented `deck_order` block. The brief names `:450-475` for the whole lists; the whole lists run on to `radar_buckets` at `:550-555`, so the block sits after it, in the section its sentence at `:469-472` heads.
- `docs/data-map.md:151-153`, the three keys `deposit.zenodo.address`, `deposit.zenodo.timeout_s` and `deposit.zenodo.auth`. The list said "these 68 keys" and listed 65: the three keys of `HUB_LIST` (`hub-names.ts:779-781`) were missing from it (a sorted comparison of the list with `HUB_LIST`'s keys printed exactly those three). The count now reads 69 and the list holds the 69.

Not changed though named in the write list: `src/lib/data/sources/config/sections/boards.ts`, `src/lib/data/index.ts` and `tests/data/shapes/catalog-files/vocab.test.ts`. The `deck_order` key finding is raised in the merge (`hub-layer.ts`), which `loadConfig` runs for the primary and `readOtherHub` runs for every other hub, so neither of the two other files needed a change; the shape test needed none since the new key is a plain optional list.

## Decisions taken in the build (each reversible)

1. The finding of a `deck_order` key no category holds is raised at the end of `mergeHub` (`orderNamingRows` in `hub-layer.ts`), after the hub's own values are laid in, as `rowsNamingLists` is for `manifest_fields`: one place covers the primary hub and every other hub, held to the hub's merged `categories:`, and the key is taken out of the merged list. It runs only when the hub's own `deck_order` was applied (`hubValues`), so oculus's list is never checked and a key a hub's `categories` takes out leaves oculus's list silently (C10).
2. A whole list of texts is a new shape variant, `{ kind: 'whole', texts: true }` (`TEXTS` in `in-place.ts`): a text named twice is the existing `settings_row_repeated` problem at its place, and `toldApart` lets a shape issue of such a list leave oculus's list standing, as for the lists told apart by a field. The brief wrote `{ kind: 'whole' }`; that shape would apply a list naming one key twice and let a list holding a map stand, against the brief's own rule that both are findings with oculus's list standing.
3. The finder gives the reader's order to `resolveGroups` (`Finder.order`), and `DeckContext.order` is a `DeckOrder`: the categories as `categoriesOf` reads them, the keys of `deck_order`, the stage order and the config the rows' blocks are held against.
4. C16's fixture (`orderHub` in `tests/fixtures/hubs/deck-hub.ts`) copies the demo hub, gives its settings a `publications` row with `sort: [title]` and `deck_order: [idea, publications, in-flight]`, plants five projects under `side-projects/`, and reads the config through `readOtherHub` and the deck through the build's own `buildReaders`.
5. `RuleForm.svelte` lost the `.line` wrapper with its style: it held the Sort field and the Discover checkbox side by side, and with one control left the checkbox sits in the form's column as the Find field does (`KeyForm.svelte` lays its children out in a column with a gap of 8px).
6. The test titles of the order rows open with their case id ("C1:"), so a reader finds the brief's case.
7. A reader row for C10 (a key of the reader's `deck_order` that no row holds is passed over) is added to present.test.ts beside the merge row, so the silent leave-out is run at the reader too.

## What the look should show

The research hub's `deck/present.yml` was read, and the decks its groups find were listed from the manifests, read only, by this probe run in `~/workspace/research-hub`:

```
for d in projects/*/*/present projects/archive/published/*/*/present; do [ -f "$d/present.yml" ] || continue; p=$(dirname "$d"); m="$p/project.yml"; [ -f "$m" ] || m="$p/.oculus/project.yml"; id=$(grep -m1 "^id:" "$m" 2>/dev/null | sed 's/^id: *//'); tier=$(grep -m1 "^tier:" "$m" | sed 's/^tier: *//'); stage=$(grep -m1 "^stage:" "$m" | sed 's/^stage: *//'); form=$(grep -m1 "^form:" "$m" | sed 's/^form: *//'); year=$(grep -m1 "^year:" "$m" | sed 's/^year: *//'); title=$(grep -m1 "^title:" "$m" | sed 's/^title: *//' | cut -c1-50); echo "$d|id=$id|tier=$tier|stage=$stage|form=$form|year=$year|$title"; done
```

It listed 24 decks; the two no group's `slides:` names are `projects/manuscripts/ecg-readable-substrate/present|id=ecg-readable-substrate|tier=research|stage=submitted|form=|year=2026` and `projects/archive/published/2026/hccnet-fl/present|id=hccnet-fl|tier=research|stage=accepted|form=conference|year=2026`; every other deck is named by `pillars`, `more` or `ideas`. The hub's `.oculus/config.yml` sets neither `categories` nor `deck_order` (`grep -n "^categories\|^deck_order"` prints nothing), so oculus's rows and order apply.

- C1, C16, the Present view on the research hub's portfolio deck, Overview (`O`): the group `more` names six decks in `slides:` and discovers the two decks no group names, `hccnet-fl` (accepted, conference, so publications) and `ecg-readable-substrate` (submitted, so in review). Before, by folder path: `projects/archive/published/2026/hccnet-fl` then `projects/manuscripts/ecg-readable-substrate`. After, by the deck order (publications before in review): `hccnet-fl` then `ecg-readable-substrate`. The order is the same before and after for this deck; the group's tiles after its six named decks read hccnet-fl, then ecg-readable-substrate. The group `ideas` names all nine idea decks and discovers none, so its order is its `slides:` order before and after.
- Until the orchestrator takes line 19 (`sort: folder`) out of the hub's `deck/present.yml`, the Findings view lists the schema check's `not_declared` finding on that line.
- C13, the Overview, a group's heading, Edit Rule: the form shows Find and Discover and no Sort; under a discovering group's heading (`more`) the sentence ends with ", and adds what it finds." and names no sort; the Edit Rule button's tip reads "Set which decks more finds and whether it adds them".
- C20, Settings, boards, Vocabulary: a `deck_order` row drawn as a list of seven texts, publications, other-outputs, in-review, in-flight, released, idea, dead-ends, with the help line of `config/options/catalogs/vocab.yml`.

## Edits to existing assertions

From `diff .agents/worktrees/O155-base/<file> <file>`:

- `tests/routes/edit/deck-slides.test.ts`:
  - The fixture text, in `textWith`: the lines `if (has('groups.pillars', 'sort')) {` and `text = text.replace('            - alpha\n', '            - alpha\n        sort: title\n');` became `if (has('groups.pillars', 'discover')) {` and `text = text.replace('            - alpha\n', '            - alpha\n        discover: false\n');` (the second written over four lines by prettier).
  - The title "sets the title, the tag tones and a group's sort, discover and find, changing only their lines, a record each, each undone" became "sets the title, the tag tones and two groups' discover and a group's find, changing only their lines, a record each, each undone"; its write `[['groups', 'pillars', 'sort'], null, 'title']` became `[['groups', 'pillars', 'discover'], null, false]`, the changed key `'groups.pillars.sort'` became `'groups.pillars.discover'`, and the record `['groups.pillars', 'sort', null, 'title']` became `['groups.pillars', 'discover', null, false]`. The row tests the writing of several keys, so it writes another key.
  - The refusal row `row: 'a sort of another word', key: [['groups', 'pillars', 'sort'], null, 'date'], reason: 'groups.pillars.sort cannot hold that value: it takes folder or title'` became `row: "a group's sort, which the Overview does not set", key: [['groups', 'pillars', 'sort'], null, 'title'], reason: "groups.pillars.sort is not a key the Present view's Overview sets"` (C14).
  - The row of a group the deck does not have: `key: [['groups', 'nothing', 'sort'], null, 'title']` became `key: [['groups', 'nothing', 'discover'], null, true]`, so it tests a missing group and not a refused key.
- `tests/checks/config/config-folder.test.ts`: `'deck_order',` added to the expected keys after `'categories',`.
- `tests/data/sources/present.test.ts`: no assertion changed; the three existing `createReader` inputs gain `order: orderOf(VOCAB)` and read `frame` and `catalog` from one `VOCAB`.
- `tests/data/hubs/decks.test.ts`, `boards.test.ts`, `hub-vocab.test.ts`: rows added, none changed.

## Head comments, doc comments and docs

- `src/lib/data/shapes/boards/order.ts` head comment: new.
- `categories.ts` head comment: rewritten (names the words a deck orders by).
- `presets.ts:12-16`, `items.ts:6-10`, `facets.ts:11-15`: rewritten (name `order.ts`).
- `groups.ts:4-12` head comment and the doc comment of `inDeckOrder`: rewritten.
- `spec.ts` head comment: still true.
- `read.ts` head comment: still true; `DeckContext.order` doc comment new.
- `decks.ts` head comment: rewritten (the order read once under the hub's merged settings).
- `kinds.ts` `DeckProject.year`: new doc comment.
- `in-place.ts` head comment, `InPlace`, `toldApart`, `TEXTS`, `repeatedRows`, `layInPlace` doc comments: rewritten or new.
- `hub-layer.ts` head comment and `mergeHub` doc comment: rewritten; `orderNamingRows` new.
- `hub-names.ts` `HUB_LIST` doc comment: rewritten (names `deck_order`).
- `model-deck.ts` `DeckKeys`, `deck-edit.ts:20-21`, `deck-keys.ts:1-8`, `arrange.ts:17-19` and `ruleSentence`'s doc comment, `RuleForm.svelte:2-7`: rewritten.
- `config/catalogs/vocab.yml:4` and the new `deck_order` comment; `config/options/catalogs/vocab.yml:4` and the new entry: rewritten or new. The `categories:` comment of `vocab.yml`: still true.
- `config/schemas/deck-schema.yml` `groups` help: rewritten.
- `docs/decks.md:87-137`, `docs/HELP.md:308`, `:337-338`, `:587`, `docs/templates.md:469-472`, `:556-564`, `:1935`, `docs/data-map.md:82`, `:118`, `:151-153`: rewritten.
- `.scratch/migration/agents/guarded.md` G32, G124, G126: rewritten.

## Anything in the brief that was wrong or impossible

- Item 2 gives `deck_order` the merge shape `{ kind: 'whole' }`. With that shape a hub list naming one key twice is applied and a list holding a map stands, while the same item requires both to be findings with oculus's list standing. The build follows the item's rule with the `texts` variant (decision 2).
- `docs/data-map.md:82` counted 68 keys while its list held 65; fixed in the same edit (Files).

## Runs of the verify list

`npm run test:quick` ran once after the last change, with its result above. One earlier start of it was stopped before it printed a result, since comment edits followed it. No other whole-suite command ran.
