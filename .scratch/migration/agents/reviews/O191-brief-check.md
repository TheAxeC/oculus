# Step O191 brief check (on main at 029be4018)

The report of the fresh agent of the `spec` skill's "Steps / The brief check", on `agents/briefs/O191.md`. All reads and commands ran in `/Users/axelfaes/workspace/oculus`. The brief and the ledger files were read as they are on disk, uncommitted. `git log --oneline -1` printed `029be4018 Document the submission date in the data map and the help`.

## 1. Names

- `facetValues`: `grep -rn "facetValues" src tests config docs README.md --exclude=local.yml`. Hits outside the paths:
  - `src/lib/state/boards/board/index.ts:78` (re-export): not made false.
  - `src/lib/state/boards/collection/bar.ts:58,272` (the Projects section's rules): not made false. Its Form and Pillar groups gain the value for none, which the brief's item 5 names.
  - `tests/state/boards/board/hub-facets.test.ts:2` (head comment: "over the values state.ts's facetValues reads"): not made false.
- `orderValues`: `grep -rn "orderValues" ...`. The only hits outside `facets.ts` are `src/lib/server/edit/deck-edit.ts:87,100,136,159`, an unrelated local function of the same name. Not made false.
- `valueLabel`: `grep -rn "valueLabel" ...`. The only hit outside the paths is `src/lib/state/boards/board/index.ts:67` (re-export). Not made false.
- `NONE` and its literal: `grep -rnw "NONE" src tests` and `grep -rn "__none__" src tests config docs README.md --exclude=local.yml`. The board's `NONE` outside the paths:
  - `src/lib/state/boards/board/presets.ts:44` `/** The value a facet gives what has none: no year, no funding, no compute, no code deposit. */`. **Made false.** The list becomes incomplete once seven more facets give `NONE`, and `presets.ts` is not in "Paths this step writes".
  - `src/lib/state/boards/board/presets.ts:363` (`CODE_VALUES`): not made false.
  - `src/lib/data/snapshot/normalise.ts:445-446` ("The keys no resource may have: the board's NONE value ..."): stays true. Note that only resource keys reserve `__none__`; see 6.
  - `src/lib/state/boards/collection/bar.ts:52,248,255,301,303` (the Category group's own `NONE`): not made false.
  - Every other `NONE` hit (`apps.svelte.ts`, `reader.ts`, `debug/routes.ts`, test-local constants) is an unrelated local name.
- The new keys `no_situation`, `no_domain`, `no_waiting`, `no_venue`, `no_pillar`, `no_dataset`, `no_form`: `grep -rn -i "situation\|No situation\|Not waiting\|no_situation\|no_domain\|no_waiting\|no_venue\|no_pillar\|no_dataset\|no_form" src tests config docs README.md --exclude=local.yml`.
  - No hit for any of the seven keys. `audit.msg_no_venue` (`config/text/views/system/audit.yml:32`) is in another group, so there is no collision.
  - Situation hits stay true: `stats.ts:23`, `presets.ts:195`, `FilterBar.svelte:12`, `BoardBar.svelte:8`, `Map.svelte:24`, `vocab.yml:91-92`, `manifest-schema.yml:55`.
- The phrase "no value": `grep -rn -i "no value" src tests config docs README.md --exclude=local.yml`.
  - Board hits outside the paths: `src/lib/state/boards/collection/bar.ts:314` ("A group with no value is not drawn") stays true. `src/lib/state/boards/collection/card-order.ts:23,56,81` is about collection field sorting and is not made false.
  - Inside the paths: `state.ts:31,33` (rewritten by item 1) and `filter-menu.ts:161` (stays true).
- Docs: `grep -n -i "situation\|waiting on\|facet\|filter" docs/HELP.md`, `grep -n -i "facet\|filter" docs/data-map.md` and the same grep on `docs/decks.md` and `docs/templates.md`.
  - `HELP.md:105,110,112,372,472` and `data-map.md:95,340` all stay true.
  - No sentence of `HELP.md`, `data-map.md`, `decks.md`, `templates.md` or `README.md` states a facet's values for an empty field.
- Other consumers of a facet's values. `grep -rln "boardFilter\|filterGroups\|applyFilters\|\bfacets(" src` lists `map-bar.ts`, `present.ts` and `acts/filter.svelte.ts` besides the board and the collection.
  - **The Map** (`src/lib/state/boards/structure/map-bar.ts:167-172`, `MAP_LINE` at `:51-62`) counts and filters through `facets`, `filterGroups` and `applyFilters`. Its Form, Situation, Domain, Venue and Pillar buttons and its More groups gain the value for none. A Pillar pick also reaches the graph: `Map.svelte:119` passes `held.filters[PILLAR_FACET]` as `pillars`, and `graph.ts:277-281` keeps only pillar nodes whose key is picked.
  - **The Present view** (`present.ts`, through `boardFilter`) draws the same groups.
  - **The saved board state** (`parseBoardState`, `state.ts:200-212`) keeps a picked `__none__` under the seven facets unchecked; only compute and slice picks are filtered.
  - **A saved pick no project holds any more** is listed at 0 by `filterGroups` (`filter-menu.ts:176-178`). It is labelled `facetLabel` (raw `__none__`, `facets.ts:115`) and then relabelled by `valueLabel` through `choicesOf` (`:144`), so it gets the new words.
  - **The Awaiting box's links** open a board by project ids (`awaitingPreset`, `presets.ts:601-605`) and set no filter. `grep -rn "filters: {\|filters\[" src` finds no code that opens a board with a facet filter, so the Awaiting box is not reached.
  - **The Situation badge** (`blockedBadge`, `filter-menu.ts:341-343`, reading `stats.blocked`) is not reached.
  - The brief names neither the Map nor the Present view.

Findings:
- 1.1 `src/lib/state/boards/board/presets.ts:44` is made false and lies outside the paths. Item 6 forbids writing it. The fix widens the paths by one comment line.
- 1.2 The Map's bar and graph, and the Present view's bar, are consumers the change reaches. "What to build", "What does not change" and the report's before and after do not name them. No code there needs to change, but the look and the before/after must cover them.

## 2. The step line

- "the facets Situation (`status`), Domain, Waiting on, Venue, Pillar, Datasets and Form ... give a project with nothing in that field the value for none (`NONE`, ... `facetValues`)": item 1.
- "listed last in the facet's choices (`facets.ts` `orderValues`)": item 2, plus the general branch the brief cites.
- "drawn with the words No situation, No domain, Not waiting, No venue, No pillar, No dataset and No form (`filter-menu.ts`, `config/text/views/boards/projects.yml`)": item 3.
- "picked and counted like any value": item 4.
- "as Year, Funding, Compute and Code do now": item 1 ("exactly as Year, Funding, Compute and Code do now"), with case 9.
- "the docs and tests that state the facets' values follow": item 6. It is served only partly, because the head comment at `presets.ts:44` lies outside the paths (finding 1.1). No test states the seven facets' values: `grep -rln "facets(\|filterGroups(\|boardFilter(\|applyFilters(\|facetLabel(\|valueLabel" tests` finds only `hub-facets.test.ts` and `board-rules.test.ts`, and neither asserts a value for an empty field of the seven.
- `plan.md` has no "Goal" heading. Its opening paragraph is the ledger's purpose, so the part of the goal this step delivers was read as the step line together with Rulings "Open item 781" (`plan.md:3792`).

Findings: none beyond finding 1.1.

## 3. Premises

- `grep -n "NONE" src/lib/state/boards/board/*.ts`: prints `state.ts:48,62,68,72` and `presets.ts:45 export const NONE = '__none__';`. Matches.
- `sed -n 38,79p src/lib/state/boards/board/state.ts`: the seven facets are at the lines the brief gives (`form` 43-44, `domain` 49-50, `venue` 51-52, `waiting` 53-54, `pillar` 59-60, `dataset` 63-64, `status` 65-66), each returning `[]` or an empty list. Matches.
- `grep -rn "facetValues(" src tests`: prints the definition plus `bar.ts:272`, `facets.ts:129` and `state.ts:109`. Matches three callers. `PROJECT_FACETS = ['form', 'tier', 'role', 'pillar']` is at `bar.ts:78`. Matches.
- `orderValues` is `facets.ts:141-185`, with `status` at `:151` and `form` at `:152`. The general branch's `NONE` handling is at `:180-184` (`:178` is the `words` helper). Matches, a line apart.
- `valueLabel` is `filter-menu.ts:120-131` (doc comment at 120, function 121-131); `no_year`, `no_funding` and `compute_none` are at `:122-124`; `facetLabel` returns the raw value at `facets.ts:115`. `cat -n config/text/views/boards/projects.yml` prints `no_funding: No funding` at 64 and `no_year: No year` at 65, under `board:`, which is sorted by key. Matches, the range one line apart.
- Counts of empty fields, rerun with a `yaml.safe_load` program over `~/workspace/research-hub/**/project.yml` (archive excluded) and `~/workspace/*/.oculus/project.yml`. It printed `manifests 91` and `{'chips': 77, 'waiting-on': 87, 'form': 79, 'datasets': 65, 'venue': 37, 'pillars': 33, 'domain': 32}`. **Differs on chips: 77 now, the brief says 78.** Every other count matches. The hub's working tree has `projects/active/sandpile-operator/project.yml` modified, and the 14 manifests that carry chips were listed; the cause of the difference was not traced.
- The five manifests of Decision 1 (`hccnet-revision`, `game-engine`, `cirrhosis-digital-twin`, `flkit`, `ordo`), read with `yaml.safe_load`: each lacks exactly the fields the brief names. Matches.
- `grep -n -i "facet" .scratch/migration/agents/guarded.md`: G92 at 323-325 names `facets`, `facetValues`, `applyFilters` and `tests/state/boards/board/hub-facets.test.ts` with describe 'the group lists on a workspace of two hubs'. Matches. No guarded entry names `filter-menu.ts`, `orderValues`, `collection/bar.ts` or `projects.yml` (same grep with those names).
- The head comment of `facetValues` is `state.ts:29-37` and states the tier rule "under no value". Matches.
- `ls docs/adr`: `No such file or directory`. The configuration block lists `standards: [.scratch/migration/agents/spec.md]` and no `adr` or glossary. Matches.
- File sizes, from `wc -l`: `state.ts` 255, `facets.ts` 362, `filter-menu.ts` 415. All are under 880.
- Case 3's premise that a domain key no registry holds gives `item.domain === null` holds. `normalise-parts/links.ts:87-89` keeps a domain id only when `entities.domains.has(id)`, `:152` sets `domainIds` from that table, and `items.ts:150-153` gives `null` for no id.

Findings:
- 3.1 The count of manifests with no chip is 77, not 78. Nothing in the build rests on it.

## 4. Cases and checks

- Cases 1 to 8: consistent with `spec.md` "What every package obeys". They are case runs, which the case-run rule allows. No guarded entry covers the value for none, so no test is kept, as the test rule says.
- Case 9 (Year, Funding, Compute, Code unchanged), case 10 (Hub, Tier, Role unchanged) and case 12 (G92's test) check places the step does not change. They are regression guards, consistent with the rules.
- Case 11 checks the collection's Projects section in `bar.ts`, which the step does not change. The change reaches it through `facetValues` and `filterGroups`.
- "Verify before you report" says "each output piped through the filter the rules file names". `grep -n -i "pipe\|filter\|secret" .scratch/migration/agents/spec.md` prints nothing, so the rules file names no such filter.
- Verify item 5 reads each sentence "against the standards pages' rules on list items and sentence length". `grep -n -i "sentence length\|list item\|words long\|long sentence" .scratch/migration/agents/spec.md` exits 1, and `spec.md` is the only standards page. No such rule exists.
- `spec.md` "Where you work" says the brief names the worktree and a base copy. "The principles" says the brief names the base's `sh utils/unused-exports.sh` lines. The brief names neither, and its verify list has no `sh utils/unused-exports.sh` step. Other briefs carry this, for example `briefs/O180.md:9`.
- The step rewrites the `facetValues` head comment, which `spec.md` ("A comment edited by the step is rewrapped ... at 100 columns") governs. `tests/checks/source/comment-width.test.ts` checks that width but is not in the verify list; `history.test.ts` is.

Findings:
- 4.1 The verify list's "filter the rules file names" refers to a filter `spec.md` does not name.
- 4.2 Verify item 5 refers to rules on list items and sentence length that the only standards page does not hold.
- 4.3 The brief names no worktree, no base copy and no base unused-exports lines, and its verify list lacks `sh utils/unused-exports.sh`.
- 4.4 `tests/checks/source/comment-width.test.ts` is missing from the verify list although the step edits a head comment.
- 4.5 Cases 9, 10, 11 and 12 check places the step does not change, named as the template asks. They are regression guards and need no change.

## 5. The question

- Case 1: no, as long as the run loads the vocabulary. If `chipKeys()` is empty in the run, the Situation list is only `No situation` and the "after the chips" clause reads as met. The case should name the full expected list, for example `blocked`, then `No situation`.
- Case 2: no. It needs the OR within the facet over `NONE`.
- Case 3: **yes for its second half.** A case run that builds a `BoardItem` with `domain: null` by hand never exercises the unknown-key path (`links.ts:87-89`), so it passes whatever that path does. It has to run through `boardItems` over a snapshot whose manifest names a domain the registry lacks, as `board-rules.test.ts` builds items from `snapshotOf`.
- Case 4: no.
- Case 5: **yes for "listed last"** when the run's board has no project holding a venue, pillar or dataset: the list is `NONE` alone and "last" is vacuous. It should require a named value before `NONE` in each facet.
- Case 6: as case 1. With no forms vocabulary loaded (`formOrder()` empty) or no project holding a form, the order clause is vacuous. It should name the expected list, for example `journal`, then `No form`.
- Case 7: yes. It passes on the unchanged tree. It guards against over-listing and is no check of the goal.
- Case 8: no.
- Cases 9 and 10: yes, they pass without the goal. They are guards.
- Case 11: no for Form. Pillar in the Projects section has no case, though item 5 names it.
- Case 12: yes, it passes without the goal. G92's fixtures give every item a domain, a compute and a waiting, and the test reads only the domain, compute, waiting and funding rows, so no new `NONE` path is reached.
- The check on the step line (cases 1 to 11): no, given the fixes to cases 1, 3, 5 and 6 above.
- Item 1: no (cases 1 to 6).
- Item 2: yes, through the vacuous orders of cases 1, 5 and 6, unless the expected lists are named.
- Item 3: no. `keys.test.ts` ('has a reader for every catalog key', 'names a catalog key in every literal read') and the labels of cases 1 to 6 check it.
- Item 4: no (cases 2 and 8).
- Item 5: no for Form. Yes for Pillar, which no case checks.
- Item 6: **yes.** Its grep can pass while `presets.ts:44` stays false, since the path list excludes that file (finding 1.1).

Findings:
- 5.1 Case 3's unknown-key half can pass on a hand-built item and should be run from a snapshot.
- 5.2 The order clauses of cases 1, 5 and 6 can pass vacuously and should name their expected lists, with a named value before the value for none and the vocabulary loaded.
- 5.3 Item 5's Pillar has no case.
- 5.4 Item 6's grep cannot repair `presets.ts:44`.

## 6. Implied inputs

This is a code step.

- **A board where no project has the field.** Before, the facet drew no group. After, it draws a group holding the value for none alone, counted over every project. The hub has this case today: a per-tier count of the manifests printed `personal projects 27 with form 0 with datasets 0 waiting 1` and `software projects 7 with form 0 with datasets 1 waiting 0`. So the Personal and Software boards gain a line-1 Form button holding only `No form` (Form is in `LINE_FACETS`, `filter-menu.ts:65`); the Software board gains a Waiting on button holding only `Not waiting`; and the Personal board's More gains a Datasets group holding only `No dataset`. This is user-visible and missing from "Cases" and from "What does not change" (which names only the group order). Expected result: the group is drawn with the one row, as Year's `No year` is today.
- **The Venue list's share bars.** `choicesOf` gives every Venue choice `share = count / most` (`filter-menu.ts:140,149`), drawn as a bar in `PickMenu.svelte:130-131`. The `No venue` row gets a bar, and wherever it is the largest count, every venue's bar is rescaled against it. On boards whose projects mostly lack a venue (Personal, Software) it fills the bar alone. This is missing; the expected result is a user-visible choice the brief does not make (see "Declined to judge").
- **A saved pick of the value for none after no project lacks the field any more.** `filterGroups` lists it at 0 through `gone` (`filter-menu.ts:176-178`) with the new words, so it can still be taken out, and the board shows no project. Missing; expected result as stated.
- **The waiting toggle on together with `Not waiting` picked.** `applyFilters` gives no project, and the `Not waiting` row counts 0, since counts apply the quick filters (`facets.ts:288-291`). Missing; expected result as stated.
- **On the Map, `No pillar` picked.** The Map keeps the projects with no pillar and draws no pillar node (`graph.ts:277-281`). With Connected only on, `graph.ts:282-288` removes every such project, so the Map is empty. Missing; expected result as stated.
- **A record or value whose key is `__none__`** (a domain, venue, pillar or dataset key, a `waiting-on:` value written `__none__`, or a chip or form `__none__`) would merge with the value for none. `spec.md` "What every package obeys" asks for every key to be checked against reserved keys. Only resource keys reserve `__none__` (`normalise.ts:446`). `grep -rl "__none__"` over the hub's `.oculus/data`, `.oculus/config.yml`, `projects` and `side-projects` prints nothing, so it has not happened and costs little. Missing; the expected result should be stated, for example "merges with the value for none, as for funding today".
- **A project whose only chips, or whose form, are words no vocabulary holds.** It is under no listed value, because `chipKeys().filter(has)` and `formOrder().filter(has)` drop the word, and not under the value for none, because the field is not empty. A check of every manifest's chips and form against oculus's `vocab.yml` plus the hub's `config.yml` chips found none outside them. It has not happened. Missing; expected result: as today, not listed.
- **A venue, pillar or dataset key no registry holds.** It is dropped to `NONE` the same way as case 3's domain (`links.ts:81-86`, `:160`). Only the domain form is under "Cases". Expected result: it carries the value for none.

Findings:
- 6.1 A board where no project has the field (Form, Waiting on and Datasets groups appearing with the value for none alone) is missing from "Cases" and from the before/after.
- 6.2 The `No venue` row's share bar and the rescaling of the Venue bars are missing.
- 6.3 A saved pick of the value for none no project carries is missing.
- 6.4 The waiting toggle with `Not waiting` is missing.
- 6.5 The Map's `No pillar` pick, alone and with Connected only, is missing.
- 6.6 A key or value `__none__` in the seven facets' sources is missing.
- 6.7 Venue, pillar and dataset keys no registry holds are missing beside case 3's domain.

## 7. ADRs

- No record. `ls docs/adr` prints `No such file or directory`, and the configuration block in `orchestrator-state.md` names no `adr` key.

Findings: none.

## 8. Dictated text

- `- Situation: \`No situation\`` (`grep -n "No situation" .scratch/migration/agents/briefs/O191.md`, line 28): holds.
- `- Domain: \`No domain\`` (line 29): holds.
- `- Waiting on: \`Not waiting\`` (line 30): holds. It is not the banned "not X but Y" construction of `spec.md` "The working rules", and the ruling fixes the words.
- `- Venue: \`No venue\`` (line 31): holds.
- `- Pillar: \`No pillar\`` (line 32): holds.
- `- Datasets: \`No dataset\`` (line 33): holds.
- `- Form: \`No form\`` (line 34): holds.
- The keys `no_situation`, `no_domain`, `no_waiting`, `no_venue`, `no_pillar`, `no_dataset`, `no_form` (line 35): hold. They are ASCII, follow the catalog's `no_year` and `no_funding` form, collide with no key (section 1), and sort into the file's key order.
- The catalog lines these imply (`no_situation: No situation` and the six others) are plain YAML scalars holding no colon. They hold against `spec.md` "What every package obeys" (ASCII, one group in one file).
- `LC_ALL=C grep -n '[^ -~]' .scratch/migration/agents/briefs/O191.md` prints nothing.

Findings: none.

## Declined to judge

- Whether the `No venue` row should carry a share bar, and whether the Venue bars should be scaled over the named venues only (finding 6.2). This is a user-visible shape the brief and ruling 781 do not settle, so the user or the orchestrator decides.
- Whether findings 1.1, 6.1 to 6.7 and 5.3 widen the step under the standing demand "A brief check never widens a step" (`orchestrator-state.md:39`). Each could be internal and taken in automode, or added cases that go to Axel. That is the session's call.
- The cause of the chip count difference (77 against 78). It needs the hub's history, and no decision rests on it.
- No case run was done, since that is the builder's first task, and no test was run, under the brief-check limits.

Agent usage: a501a225694f4340a, claude-opus-5-5, 213152 tokens, 81 tool uses, 570 s.
