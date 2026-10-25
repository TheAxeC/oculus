# O75 builder report: the bar, the section headings and the list of a project board

Everything in the brief is done. Two things the orchestrator must act on at landing: G92's Test line still names the describe 'the filter menu on a workspace of two hubs', which this step kept (judgment 20), and two files outside the step's paths were changed (`src/lib/ui/controls/Chip.svelte`, and the sentence at `src/lib/data/shapes/catalog-files/vocab.ts:241`), each in "Judgment calls" with its reason.

## Open items of the state file, verbatim

From `.scratch/migration/orchestrator-state.md`, section "## Open items (only what Axel must rule on; every report tells him these in plain words, decisions first, until he has ruled)":

> An entry leaves this list for the closed log the moment Axel rules on it. What a review or a look found and no brief covered is not an open item: it is folded into an existing step in `plan.md` (Z468), never booked as a step of its own.

The section holds no entry.

## The cases' first run, on the unchanged tree

Run through a scratch case file (source kept at `/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/caserun/before.test.ts`), copied into `tests/state/boards/board/o75-caserun.test.ts` for the run and removed right after, run by `npx vitest run tests/state/boards/board/o75-caserun.test.ts`. Each `it` prints and asserts nothing, so vitest marks every row "expected any number of assertion, but got none"; the printed lines are the result. The boards are the shipped ones plus a scratch board `ws` taking every research project.

- Case 2 (`facets` over archive, projects with forms and chips): `facet keys: ["stage","category","year","funding","status","compute","reproduced","code","sessions"]`; `status: [["journal","journal article",1],["conference","conference paper",1],["poster","poster",1],["blocked","blocked (external)",1],["parked","parked (not being worked)",1]]`; `form: undefined`. The Status group lists the forms; there is no Form facet.
- Case 3: `slices export: "undefined"`; `FACETS: ["stage","category","role","year","domain","pillar","funding","dataset","status","compute","reproduced","code","sessions"]`; `sections: [["in-review","in review"],["in-flight","in flight"],["publications","publications"]]`. No slices exist.
- Case 4 (`applyFilters` with `{ slice: [...] }`): `kept: ["c","b","a"]`. The slice filter is ignored.
- Case 6, second part: `filters: {"stage":["nascent"],"category":["idea"]}`. Both kept.
- Cases 7 and 8 (`stats` over 16 projects, 3 dated, 2 blocked): `stats: {"active":16,"submitReady":0,"blocked":2,"dated":3,"venues":[]}`; `stats, none blocked: 0`.
- Case 9 (`venue_conc_warn: 4`): `mixed: [{"id":"v1","short":"BSPC","name":"Biomedical Signal Processing and Control","count":5,"warn":true}]`; `archive: [{"id":"v2","short":"Other Journal","name":"Other Journal","count":4,"warn":true}]`. The Archive board warns on four published papers.
- Case 17 (config check over a board column naming `status`): `findings: []`.
- Case 18: `venue: undefined`. No venue facet.
- Case 19: `folded: undefined`, `columns: undefined`.
- Case 20, first part: `role facet offered: false`; `kept under role lead: []`. A saved role with no `self` empties the board.
- Case 21 (a hub writing `submit_ready: true`): `hub findings: []`, `own findings: []`.
- Case 22: `pillar tags: [{"id":"pl","label":"Blue line"},{"id":"pn","label":"Plain"}]`. No colour.
- Case 16: `npx vitest run tests/state/boards/board/board-rules.test.ts tests/state/boards/board/hub-facets.test.ts` printed `Test Files  2 passed (2)`, `Tests  85 passed (85)`.
- Cases 1, 5, 10 to 15: read in `Projects.svelte`, `FilterBar.svelte` and `Stats.svelte` of the base: one Filter menu, the in-force chip line, Expand all and Collapse in the header, Mine only drawn only where `offersMine`, one Table for the list with a sticky header and the Authors, Status and Focus columns, no folding headings. Each is what the brief's "What is on the tree" describes.
- No case was found that the brief's own rules get wrong.

The new G124 row, run on the unchanged code before the code changed (`npx vitest run tests/state/boards/board/board-rules.test.ts -t 'case 32'`):

```
 FAIL  |unit| tests/state/boards/board/board-rules.test.ts > a saved slice filter > case 32: a slice the board holds is kept and a slice it does not hold is dropped
TypeError: sliceGroups is not a function
 <HEAVY RIGHT-POINTING ANGLE QUOTATION MARK ORNAMENT> tests/state/boards/board/board-rules.test.ts:498:24
```


## The cases after the change

Same method, source at `/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/caserun/after.test.ts`, copied into `tests/state/boards/board/o75-caserun.test.ts`, run, removed (`ls tests/state/boards/board/` afterwards: `board-rules.test.ts hub-facets.test.ts items.test.ts`). Printed lines:

- Case 2: `facet keys: ["slice","form","status","year","funding","compute","reproduced","code","sessions"]`; `status: [["blocked","blocked (external)",1,null],["parked","parked (not being worked)",1,null]]`; `form: [["journal","journal article",1,null],["conference","conference paper",1,null],["poster","poster",1,null]]`.
- Case 3: `FACETS: ["slice","form","status","role","year","domain","venue","pillar","funding","dataset","compute","reproduced","code","sessions"]`; `slices: [["in-review","in review","sky",[{"value":"in-review/submitted","label":"submitted / under review","tip":"submitted / under review","tone":"sky"}]],["in-flight","in flight","green",[{"value":"in-flight/de-risking","label":"de-risking","tip":"de-risking (feasibility experiment)","tone":"green"}]],["publications","publications","rose",[{"value":"publications/journal","label":"journal article","tip":"journal article","tone":"rose"}]]]`.
- Case 4: `kept: ["b","a"]` (journal and submitted kept, nascent dropped); with `year: ['2026']` also in force: `slice counts under year 2026: [["in-review/submitted","submitted / under review",1,"sky"],["idea/nascent","nascent",1,"violet"],["publications/journal","journal article",0,"rose"]]`.
- Case 6, second part: `filters: {}`.
- Cases 7 and 8: `stats: {"projects":16,"blocked":2,"dated":3,"warnAt":4,"venues":[]}`; `deadline words: "deadline 3"`; `end of line 2, all shown: "16 projects"`; `end of line 2, five shown: "5 of 16 shown"`; `end of line 2, one project: "1 project"`; `blocked badge: "2 blocked"`; none blocked: `""`; `no dated project: "deadline 0"`.
- Case 9: `mixed venues: [{"id":"v1","short":"BSPC","count":5}]`; `mixed tip: "BSPC: 5 live projects, the warning is 4"`; `archive venues: []`; archive tip `""`.
- Case 17: `findings: ["boards.ws.columns[0].cell must be one of title, stage, venue, lane, next, with, domain, pillar, funding; it is not read"]` (the scratch board's `lane` and `with` columns give none); `shipped findings: []`.
- Case 18 (a venue in two hubs, `v1` and `look-hub2:v1`; `v2` "B Journal", `v3` "A Journal"; one project with no venue): `venue: [["v1","JA",2,null],["v3","A Journal",1,null],["v2","B Journal",1,null]]`.
- Case 19: `folded: ["idea",""]`; `columns: ["title","next"]`; `columns of ["status"]: "absent"`.
- Case 20: `role facet offered: false`; `applied with no self: {}`; `kept: ["b","a"]`; a picked domain no project holds: `domain group: {"id":"domain","heading":"Domain","tone":"teal","items":[{"id":"gone","label":"gone","count":0,"active":true,"tone":"teal"}]}`.
- Case 21: `hub findings: ["key stages.submit-ready.submit_ready is not a key this file takes"]`; `own findings: []`.
- Case 22: `pillar tags: [{"id":"pl","label":"Blue line","color":"#2563eb"},{"id":"pn","label":"Plain"}]`; `pillar facet: [["pl","Blue line",1,"blue"],["pn","Plain",1,null]]`; `pillar choices: [{"id":"pl","label":"Blue line","count":1,"active":true,"tone":"blue"},{"id":"pn","label":"Plain","count":1,"active":false,"tone":"cyan"}]`.
- The Columns menu's data: `cells, default: [["title","Project",true],["stage","Stage",true],["venue","Venue",true],["lane","Lane",true],["next","Next",true],["with","With",true],["domain","Domain",false],["pillar","Pillar",false],["funding","Funding",false]]`; `hide venue: ["title","stage","lane","next","with"]`; `show venue back: "absent"`; `press project: "absent"`.

## DONE / NOT DONE

| Item | State | Proof |
|---|---|---|
| 1 Facets (FACETS order, form, venue, status = own chips, Situation, value orders) | DONE | case run 2, 3, 18 above |
| 2 Slices in `facets.ts`, slice facet, `parseBoardState` drops unknown slices | DONE | case run 3, 4, 6; G124 case 32 passes |
| 3 Line 1 (`FilterBar.svelte`) | DONE | read; `deadlineWords`, `groupWords`, `moreWords` in case run; look at landing |
| 4 Group list (`PickMenu.svelte`, Popover + Command) | DONE | read; look at landing |
| 5 Counts on the controls, `Stats.svelte` and `submit_ready` removed | DONE | case run 7, 8, 9, 21; grep below |
| 6 Colours of the picks, pillar `color` | DONE | case run 3, 22; read; look at landing |
| 7 Line 2 (`SliceLine.svelte`) | DONE | read; `shownWords` in case run; look at landing |
| 8 Section headings (`FoldHead` moved, `tone`, `count`, `folded`, sticky) | DONE | read; case run 19; look at landing |
| 9 List view (`BoardList.svelte`, Columns menu, `columns`) | DONE | read; case run 19 and Columns data; look at landing |
| 10 Columns config | DONE | case run 17 |
| 11 The words | DONE | grep below |
| 12 Tests | DONE | runs below |
| Verify 1: `npm run diagrams && npm run test:quick` | DONE | last run: `test:quick: 65.1 s; every command passed` |
| Verify 2: the two test files | DONE | `Test Files  2 passed (2)`, `Tests  85 passed (85)` |
| Verify 3: new row failing on the unchanged tree | DONE | quoted above |
| Verify 4: unused exports | DONE | no new unused export, diff below |
| Verify 5: grep of removed names | DONE | below |
| Verify 6: prose read | DONE | below |

Verify 1, last run, its summary lines as printed:

```
test:quick: 39 changed file(s), from git since HEAD
test:quick: 19 test file(s)
ok      prettier (1.1 s): All matched files use Prettier code style!
ok      ASCII gate (1.2 s)
ok      svelte-kit sync (2.5 s)
ok      eslint (13.1 s)
ok      svelte-check (13.5 s): 1792931004630 COMPLETED 539 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest (36.0 s): Duration  25.34s (transform 31.36s, setup 0ms, import 54.67s, tests 22.22s, environment 633ms)
ok      vitest slow (38.1 s): Duration  27.26s (transform 7.20s, setup 0ms, import 19.84s, tests 7.18s, environment 0ms)
ok      vitest checks (62.5 s): Duration  51.69s (transform 19.03s, setup 0ms, import 56.49s, tests 35.35s, environment 1ms)
test:quick: 65.1 s; every command passed
test:quick: not covered: tests that reach no changed file within the import depth,
            the build, the lint of unchanged files
```

`npm run diagrams` rewrote `docs/diagrams/layer-views.{dot,svg}`, `layers.{dot,svg}` and `writes.{dot,svg}` (the writes diagram's line numbers of `catalog-files/vocab.ts` moved by the removed flag line).

Verify 2 after the change: `npx vitest run tests/state/boards/board/board-rules.test.ts tests/state/boards/board/hub-facets.test.ts` printed `Test Files  2 passed (2)`, `Tests  85 passed (85)`. Edits to existing assertions: none. G124's describe 'a saved category filter' (row 'case 32: a value naming no row of categories is dropped', asserting `held.filters` `{}` and every item kept) is replaced by 'a saved slice filter', row 'case 32: a slice the board holds is kept and a slice it does not hold is dropped', asserting `held.filters` `{ slice: ['in-review/submitted'] }` and `applyFilters(...)` ids `['sub']`; the file's head comment line 9 says "a saved slice filter". G92's fixture items gain `venue: null` and `chips: []` in `project`, no assertion changed. `tests/state/shared/hub-words.test.ts:80` title only: "orders and labels the stage facet from the union" became "orders and labels the stages of the slices from the union".

Verify 4: `sh utils/unused-exports.sh` against `.agents/worktrees/O75-base/unused-exports.txt`:

```
125,126c125,126
< src/lib/state/boards/board/filter-menu.ts: facetHeading, valueLabel, filtersInForce
< src/lib/state/boards/board/index.ts: FACETS, NONE, venueText, facetHeading, filtersInForce, valueLabel, emptyBoardState, facetValues
---
> src/lib/state/boards/board/filter-menu.ts: facetHeading, valueLabel
> src/lib/state/boards/board/index.ts: FACETS, NONE, venueText, facetHeading, valueLabel, emptyBoardState, facetValues
232c232
< Unused exported types (111)
---
> Unused exported types (109)
283,285c283
< src/lib/state/boards/board/filter-menu.ts: FilterChoice
< src/lib/state/boards/board/index.ts: BoardColumn, Facet, FacetValue, LabelMode, SessionsOf, VenueCount, FilterChoice, WaitingLine
< src/lib/state/boards/board/presets.ts: BoardColumn
---
> src/lib/state/boards/board/index.ts: BoardColumn, FacetValue, LabelMode, SessionsOf, VenueCount, WaitingLine
```

Every line is a name leaving the list; none is added.

Verify 5, each removed name over `src tests docs config README.md` (`--exclude=local.yml`, `docs/diagrams/` left out as generated), after the change: "Filter menu", "stage facet", "category facet", "Expand all", "expand_all", "board.collapse", "totals line", "statistics strip", "board statistics", "Authors column", "Authors cell", "Status column", "cell: authors", "cell: status", "cell: focus", "submit_ready", "submitReady", "STATS_VENUES", "filterChips", "filterLabel", "InForceChip", "filtersInForce", "Stats.svelte": each printed nothing. "filter menu" printed the Settings header and the Sessions list (their own filter menus) and `tests/state/boards/board/hub-facets.test.ts:1` and `:43` (judgment 20). "Focus column" hits are the Focus board's columns of `behavior.yml`, unrelated.

Other checks: the ASCII gate of the rules file over `src tests config` printed nothing (`bin` does not exist in this repository, so `find` named it as missing and the gate ran over the rest); every `t('board.<key>')` of `src` is a key of `config/text/views/boards/projects.yml` and every key there has a reader (a loop over the keys, nothing printed); the glyph names used (`sliders`, `clear_all`, `check`, `warn`, `stale`) are in `config/catalogs/icons.yml` and `glyphs.yml`; folder counts by `git ls-files -co --exclude-standard`: `src/lib/views/shared` 10, `src/lib/views/shared/card` 10, `src/lib/views/boards/projects` 7, `src/lib/state/boards/board` 10, `src/lib/ui/menu` 10, `src/lib/views/boards/focus` 10; no line over 100 columns in a comment I wrote (`awk 'length > 100'`; the hits left are eslint-disable lines and markup indentation).

Verify 6, the prose read. History-word grep over the added lines (`git diff -U0 | grep '^+' | grep -i -E 'before|used to|no longer|still|always has been|always had|as before|previously|the step adds|after this package lands'`): "before any filter" (eight hits: the counts are taken over the projects as the board holds them, not a time), "before them", "before the next", "before it is first drawn" (places in a row or a moment at run time), "Before the first snapshot the venues are empty" (a moment at run time), and "is still the board saying" in `facets.ts` (a sentence of the base rewrapped, "still" meaning "even so"). None is history. Departures from the prose rules I found: none.

Head and doc comments touched: rewritten: `Projects.svelte` (script head), `FilterBar.svelte`, `FoldHead.svelte`, `CareerPanel.svelte` (the path), `Chip.svelte` (one sentence added), `facets.ts`, `filter-menu.ts`, `presets.ts` (head, `categories`, `BoardTag`, `teamLine`, `chips`, `BoardState`), `state.ts` (`facetValues`, `offersMine`, `parseBoardState`), `stats.ts` (head and `stats`), `items.ts` (head), `team.ts:4`, `categories.ts:4`, `selectors.svelte.ts` (`boardStats`), the board-rules head line 9. New: `PickMenu.svelte`, `SliceLine.svelte`, `BoardList.svelte`. Still true, unchanged: `index.ts` head, `state.ts` head, the hub-facets head (judgment 20), the `Projects.svelte` module script head.

## Files with line counts

- `config/catalogs/vocab.yml`: 244
- `config/defaults/layout.yml`: 335
- `config/options/behavior.yml`: 838
- `config/options/catalogs/vocab.yml`: 295
- `config/options/layout.yml`: 282
- `config/text/views/boards/projects.yml`: 108
- `docs/HELP.md`: 568
- `docs/diagrams/layer-views.dot`: 189, `layer-views.svg`: 855, `layers.dot`: 101, `layers.svg`: 556, `writes.dot`: 1303, `writes.svg`: 4412 (generated)
- `src/lib/data/shapes/boards/categories.ts`: 151
- `src/lib/data/shapes/catalog-files/vocab.ts`: 364
- `src/lib/state/boards/board/facets.ts`: 316
- `src/lib/state/boards/board/filter-menu.ts`: 313
- `src/lib/state/boards/board/index.ts`: 73
- `src/lib/state/boards/board/items.ts`: 242
- `src/lib/state/boards/board/presets.ts`: 464
- `src/lib/state/boards/board/state.ts`: 195
- `src/lib/state/boards/board/stats.ts`: 143
- `src/lib/state/boards/board/team.ts`: 33
- `src/lib/state/client/selectors.svelte.ts`: 803
- `src/lib/ui/controls/Chip.svelte`: 265 (outside the paths, judgment 2)
- `src/lib/views/boards/focus/CommandCenterView.svelte`: 347
- `src/lib/views/boards/focus/Tasks.svelte`: 140
- `src/lib/views/boards/focus/career/CareerPanel.svelte`: 404
- `src/lib/views/boards/projects/FilterBar.svelte`: 258
- `src/lib/views/boards/projects/Projects.svelte`: 441
- `src/lib/views/boards/projects/PickMenu.svelte`: 284 (new)
- `src/lib/views/boards/projects/SliceLine.svelte`: 273 (new)
- `src/lib/views/boards/projects/BoardList.svelte`: 136 (new)
- `src/lib/views/shared/card/FoldHead.svelte`: 121 (moved from `views/boards/focus/`)
- `src/lib/views/boards/focus/FoldHead.svelte`: deleted (moved)
- `src/lib/views/boards/projects/Stats.svelte`: deleted
- `tests/state/boards/board/board-rules.test.ts`: 668
- `tests/state/boards/board/hub-facets.test.ts`: 81
- `tests/state/shared/hub-words.test.ts`: 132

## Judgment calls the brief left open

1. A board item carries its slice value (`BoardItem.slice`, `items.ts`), worked out once with its category, so `facetValues(item, 'slice')` reads one field. This widens `items.ts` beyond the pillar colour and line 4; the slice rule itself (`sliceWord`, `sliceValue`) is in `facets.ts`.
2. `src/lib/ui/controls/Chip.svelte` gains `disabled` (the button's `disabled`, half opacity, no hover border, head comment sentence), since Mine only must be drawn disabled with a tip and Chip had no disabled state. Outside the step's paths; the alternative, a ToolButton, would change the toggle's look on every board.
3. `src/lib/data/shapes/catalog-files/vocab.ts:241` ("which a board filter stores") rewritten to "which a board's slice filter and its folded sections store", the one false sentence item 11's grep found outside the listed lines.
4. Pillar, funding and dataset values read by the words a card draws for them (their record's title) rather than by their key, through the same `recorded` map compute and venue use (`NAMED_RECORDS` in `facets.ts`). The base listed them by key ("pl" for a pillar titled "Blue line"); the group lists drawn by this step would show that. Reversible by taking the three out of `NAMED_RECORDS`.
5. A domain with an empty tone (G92's fixture) or the unknown tone gives its value no tone, so it is drawn in the Domain facet's teal.
6. A pillar's tone comes from `paletteTone(color)`: a `#rrggbb` that is a palette colour gives its hue; another hex gives none, and the value is drawn in More's cyan.
7. A project in a category with a `forms:` block but no form is in no slice, so it shows only while no slice is picked, as the brief says of a project with no stage.
8. Venues tie-break by their short name, so the order does not depend on load order.
9. A role saved while no `self` is named stays in the saved state and narrows nothing (`appliedFilters`); Clear all takes it out.
10. The "other" slices are headed "other" (`board.section_other`), in the muted colour, each slice in its stage's colour.
11. The Venue list's bar is drawn after the count, as long as the count against the largest of the list (48 px at most).
12. The Columns menu lists all nine cells, the board's own columns first in their order and under their headings, then the others under `board.cell_<x>`; the title cell is checked and disabled, its tip "<heading> is always shown" (`board.columns_always`). A choice equal to the board's own columns is saved as absent, so a later change to the board's `columns:` reaches it. The Menu primitive closes after each pick. Its glyph is `sliders`, since the glyph catalog has no columns glyph and adding one would widen the step to `icons.yml` and `glyphs.yml`.
13. A category's label on line 2 is a `RowButton` holding the words in small capitals in the category's colour.
14. A slice chip reads "journal article 9" through a new key `board.slice_words: '{0} {1}'`.
15. In a group list a picked value is ticked and its words are drawn as a pill filled in its hue (`--c-<hue>` with `--on-c-<hue>`, the pair a filled Chip paints); a value not picked has its dot only.
16. The sticky section heading paints `--panel`, and over a wallpaper `--panel-on-wall` with the wall blur, as a staying table header does; `z-index: 2`.
17. List columns share the width in proportion to their minimums (percent widths); a cell's text is cut by a block of width 0 and minimum width 100%, so no rule styles the Table primitive's classes.
18. The Table primitive draws its header sticky on every table (see "wrong or impossible" 1); the list's box clips (`overflow: hidden`), so the header has nothing to stick to and scrolls with its rows.
19. A section heading's count is the section's projects on screen, after the filters.
20. `tests/state/boards/board/hub-facets.test.ts` keeps its head comment and its describe 'the filter menu on a workspace of two hubs': G92's Test line in `agents/guarded.md` names that title, so a rename needs that line rewritten at landing, and the brief limits this file to its fixture. I judge "filter menu" still a fair generic name for the group lists (a menu of filter values, `PickMenu`).
21. The folding of line 1 and line 2 measures as the header Toolbar does (`fit`, `watchToolbar`), with a search minimum of 120 px, More taken at 64 px and "+n" at 40 px until first drawn; a category label whose slices all fold folds with them.
22. Next in the list is its first sentence uncut (`firstSentence(next, Infinity)`), the cut being the cell's ellipsis.
23. Mine only while disabled keeps its pressed look when the saved state holds it on.
24. New keys of `config/text/views/boards/projects.yml`: `blocked_badge`, `cell_*` (nine), `columns`, `columns_always`, `count`, `count_one`, `count_shown`, `facet_form`, `facet_venue`, `facet_*_tone` (thirteen), `group_picked`, `group_picked_more`, `mine_all`, `more`, `more_count`, `pick_search`, `slice_words`, `slices`, `slices_more`, `venue_warn`, `venue_warn_join`, `venue_warn_one`, `warn_glyph`, `with`; `quick_deadline` is now "deadline {0}" and `facet_status` "Situation". Removed: `collapse`, `expand_all`, `facet_category`, `facet_stage`, `filter`, `filter_chip`, `filter_count`, `filter_remove`, `filter_tick_glyph`, `stats`, every `stat_*`, `venue_dist_glyph`. Each new key was checked for a reader and against the existing keys of the group; none collides.

## What the look on landing should see (before / after)

All on Projects of TEST's hub unless named.

- The bar, line 1. Before: Search, one "Filter" menu, stale, deadline, Mine only only where it changes the board; under it, while values are picked, a line of chips with remove buttons and Clear all. After: Search, stale, "deadline <n>", Mine only (on every board while `self` is named; disabled with the tip "Every project here is yours" where it changes nothing), then Form, Situation, Role, Year, Domain, Venue, More. At a 532 px pane the last group buttons fold into More, and More's list heads them first. No chip line.
- The bar, line 2 (new). Category labels in small capitals in their colour, each followed by its slices as chips "<words> <count>" in the stage's colour (publications slices in rose); a press on a slice fills it; a press on "publications" picks all its slices, a second press takes them out. At 532 px the slices past the width fold into "+<n>". It ends "16 projects", or "5 of 16 shown" under a filter, and Clear all while a value is picked.
- Each group list. Before: one DropdownMenu with every facet headed. After: a popover with a Search field, the values with a dot, words and a count; a picked value ticked and its words filled in its hue; Venue rows with a bar after the count; typing "bs" in Venue leaves the venues whose words hold "bs"; a pick leaves the list open; Escape closes it and the focus returns to the button.
- The counts on the controls. Before: the totals line under the header ("16 active, 0 submit-ready, ..." with venue chips). After: no totals line; "deadline 3" on the toggle; a red "2 blocked" beside Situation while projects are blocked; an amber mark beside Venue while a venue reaches the warning, its tip "BSPC: 5 live projects, the warning is 4". On Archive no amber mark for published papers.
- The section headings. Before: an `h3` with the label and count in the category's colour, not folding, scrolling away. After: a chevron, the label in the category's colour and a count badge; a press folds the section; the fold survives a reload; the heading stays at the pane's top while the section's cards scroll under it. A `cards: grid` board shows no heading.
- The list view. Before: one table, a sticky header, columns Project, Authors, Venue, Status (icon marks), Focus, Next. After: one table per section under the same headings, each header row scrolling with its rows; columns Project, Stage (a filled chip in the stage's colour, words cut at " ("), Venue, Lane, Next, With; rows one line, a cut cell's whole text on hover; at 532 px Project, Stage, Venue and Lane, at 1400 px all six; no sideways scroll.
- The header. Before: New project, Expand all, Collapse, Cards, List, Full titles. After: New project (where offered), Cards, List, Full titles, and in list mode a Columns menu (the sliders glyph) with a checked item per cell, Project disabled; hiding Venue removes the column and survives a reload.
- Focus: the career banner, the command center and the tasks headings draw as before (FoldHead moved, same markup with a glyph).

## Anything in the brief that was wrong or impossible

1. "Table draws its header row sticky (`stays`, `Table.svelte:27`)": the header row is sticky on every table; `stays` changes only the wallpaper backgrounds. Evidence: `src/lib/ui/display/table/Table.svelte:103-106` (`th { position: sticky; top: 0; z-index: 1; ...}`, unconditional) and `:131-144` (the `.stays` rules, all under `body.wall`). The step does not change the primitive; judgment 18 says how the list's header scrolls.
2. Nothing else found wrong or impossible.

## Runs of the verify list and whole-suite commands

- `npm run diagrams && npm run test:quick` ran twice, both green (`test:quick: 85.2 s; every command passed`, then `test:quick: 65.1 s; every command passed`). The first run came before the last change (the filled pick in `PickMenu.svelte`), so it was run again after it; no red line was met.
- One command over more than named files ran: before any change, `npx vitest run --project unit --dir <the scratchpad folder>`, meant to run the case file from outside the tree, ran the unit project's test files of the tree instead (the config's include is `tests/**`) for about two and a half minutes until I stopped it. Its result was not used. From then on the case file was copied into `tests/state/boards/board/` for each run and removed after it, which is a departure from the brief's "in a folder outside the tree": vitest here runs only files under `tests/`.
- Separate named runs: `npx vitest run` of the two test files (on the unchanged tree, on the new row alone, and twice after the change), the two case runs, `npx svelte-check`, `npx eslint` and `npx prettier` over the changed files.
- Edits were made with the Edit and Write tools and, for a few mechanical substitutions, inline `python3`, `perl` and `sed` commands; no script file was written or kept.

# Repair round 1

Nothing in the round is left undone. Three things for the orchestrator at landing:

1. `tests/checks/config/config-folder.test.ts` changed beyond the lines that list the vocabulary's keys. Its flag-count row ('describes every flag of stages, forms, chips, statuses, lead_statuses and tiers ...') was red after the first build, which removed the stage flag `submit_ready`: `expected [ { key: 'stages.idea', ...(1) }, ...(32) ] to have a length of 34 but got 33`. The first build's verify list did not select that file. The row now reads `// 12 stage flags, ...` and `expect(keys).toHaveLength(33)` (`config-folder.test.ts:693-695`), the count with the schema's twelve stage flags (`src/lib/data/shapes/catalog-files/vocab.ts:88-124`, `stageWord`: idea, live, terminal, dead, on_map, placed, public, negative, dead_end, pauses_countdown, deadline_met, new_idea; `submit_ready` gone). No threshold or predicate was loosened.
2. G92's Test line in `agents/guarded.md` names the describe title of `tests/state/boards/board/hub-facets.test.ts`. The new title, exactly: `the group lists on a workspace of two hubs`.
3. `src/lib/ui/controls/Chip.svelte` gains a second prop in this round (`outlined`, item 3), beside the `disabled` of the first build.

## Items

| Item | State | Proof |
|---|---|---|
| 1 Scripts of the first build listed | DONE | section "Scripts of the first build" below, from the transcript's Bash calls |
| 2 Facet tones into the vocabulary | DONE | case run below: own values pink/amber, hub `teal` gives teal/amber, `roze` gives grey (the unknown tone); grep of `facet_tones` below |
| 3 An unpicked slice outlined | DONE | `Chip.svelte` prop `outlined`, passed only by `SliceLine.svelte:142`; grep below |
| 4 No sentence names the Filter menu | DONE | hub-facets run below, 3 passed under 'the group lists on a workspace of two hubs' |
| 5 HELP header sentence removed | DONE | `grep -n "A card opens and closes in place" docs/HELP.md` prints nothing |
| 6 The fold written once | DONE | `src/lib/ui/frame/toolbar/FoldRun.svelte`, used by `FilterBar.svelte` and `SliceLine.svelte`; grep below |
| 7 `stays` doc comment | DONE | `Table.svelte:21-29`, quoted below; no code changed (`git diff src/lib/ui/display/table/Table.svelte`) |
| 8 Case-run sources quoted | DONE | section "Case-run sources" below |
| 9 Behaviour changes in the look list | DONE | section "What the look on landing should see, round 1" below |
| Verify: `npm run diagrams && npm run test:quick -- --base e0687c50` | DONE | last run `test:quick: 155.2 s; every command passed` |
| Verify: the four named test files | DONE | `Test Files  4 passed (4)`, `Tests  169 passed | 2 skipped (171)` |
| Verify: folder check, character set, unused exports | DONE | below |
| Verify: history-word grep | DONE | below |

### Item 2

`facet_tones` sits after `focus_lane_tones` in `config/catalogs/vocab.yml:193-207`, its comment line: "The colour of each filter group of a project board's bar, by the group, as a palette tone: the group's heading in the More list, and the dot, the fill and the Venue bar of a value with no colour of its own." The thirteen `facet_<group>_tone` keys are gone from `config/text/views/boards/projects.yml`. `filter-menu.ts:71-85`:

```ts
/** The `facet_tones` of config/catalogs/vocab.yml: a hue name for each filter group. */
const facetTonesShape = mapOfShape(wordShape);

/**
 * A facet's own hue, which a value with none of its own is drawn in: its row of `facet_tones` in
 * the words of the board's hub, the hub its rule names or, for a board over several hubs, the
 * union of every hub's words, as a palette hue (`namedTone`). A facet the map does not name, and a
 * name that is no palette hue, are the unknown tone.
 */
function facetTone(facet: string, preset: BoardPreset): string {
    const hub = preset.rule.hub ?? undefined;
    const tones = readAs(facetTonesShape, preset.words(hub).config.facet_tones) ?? {};
    return namedTone(byKey(tones, facet) ?? '', hub);
}
```

`preset.words(hub)` is the board's hub's words when its rule names a hub, and the union of every hub's words otherwise, the same words `focus-lanes.ts:210` reads `focus_lane_tones` from. A hub's words reach the page as the keys of `VOCAB_SHAPES` (`src/lib/data/index.ts:616-621`, `hubWords`), where `in-place.ts:55` now lists `facet_tones: MAP`.

`grep -rn --exclude=local.yml facet_tones src tests config docs README.md | grep -v "^docs/diagrams"` prints:
- `src/lib/state/boards/board/filter-menu.ts:71`, `:75`, `:82`
- `src/lib/data/shapes/catalog-files/vocab.ts:323`
- `src/lib/data/sources/config/merge/in-place.ts:55`
- `src/lib/data/helpers/hub-names.ts:395`
- `tests/checks/config/config-folder.test.ts:224`
- `config/options/catalogs/vocab.yml:4` and `:191`
- `config/catalogs/vocab.yml:4` and `:194`
- `docs/templates.md:239` and `:241`
- `docs/data-map.md:107`
- `docs/HELP.md:522`

`grep -rln --exclude=local.yml focus_lane_tones src tests config docs README.md | grep -v "^docs/diagrams"` lists twelve files. Nine of them name `facet_tones` too. The other three are `src/lib/state/shared/words/tones.ts` (`:203`, a doc comment naming the key as an example), `src/lib/state/boards/focus-lanes.ts` and `src/lib/views/boards/focus/Band.svelte`, the Focus band's own readers, which list no keys.

The item's cases, run by the program `r1-tones.case.ts` (source in "Case-run sources") with `npx vitest run --config <scratchpad>/caserun/caserun.config.mts --reporter=verbose <scratchpad>/caserun/r1-tones.case.ts`, exit 0. Printed lines:

```
facet_tones of the config: {"code":"cyan","compute":"cyan","dataset":"cyan","domain":"teal","form":"pink","funding":"cyan","pillar":"cyan","reproduced":"cyan","role":"blue","sessions":"cyan","status":"purple","venue":"amber","year":"slate"}
group tones: [["form","pink"],["year","slate"],["venue","amber"],["funding","cyan"],["compute","cyan"],["reproduced","cyan"],["code","cyan"],["sessions","cyan"]]
  hub findings: []
group tones: [["form","teal"],["year","slate"],["venue","amber"],["funding","cyan"],["compute","cyan"],["reproduced","cyan"],["code","cyan"],["sessions","cyan"]]
  hub findings: []
group tones: [["form","grey"],["year","slate"],["venue","amber"],["funding","cyan"],["compute","cyan"],["reproduced","cyan"],["code","cyan"],["sessions","cyan"]]
 Test Files  1 passed (1)
      Tests  3 passed (3)
```

The three blocks are oculus's own values, a hub writing `facet_tones:\n  form: teal\n`, and a hub writing `form: roze`. `grey` is `UNKNOWN_TONE` (`tones.ts:34`).

### Item 3

The rule is in `Chip.svelte`, behind a new prop, so every other toned chip is drawn as before:

```svelte
/* An outlined chip that is not filled draws its border in its hue as well as its words; the
   hover's accent border below marks the one under the pointer, as on any toggle chip. */
.chip.toned.outlined:not(.filled) {
    border-color: var(--tone);
}
```

A view cannot reach the chip's border from its own style without a `:global` rule on a primitive's class, which the rules file forbids. `grep -rn -w outlined src` outside `Chip.svelte` prints, among comments of other files on code words and LaTeX outlines, only `src/lib/views/boards/projects/SliceLine.svelte:5` (its head comment) and `:142` (the prop). The files that draw a `<Chip` with `tone=`, by `grep -rln "<Chip" src | xargs grep -ln "tone="`, are:
- `academic/present/parts/Project.svelte`
- `boards/collection/Collection.svelte`
- `boards/projects/BoardList.svelte`
- `boards/projects/PickMenu.svelte`
- `boards/projects/SliceLine.svelte`
- `shared/card/project/CardFacts.svelte`
- `shared/card/project/ProjectCard.svelte`
- `shared/forms/entry/card/EntryCard.svelte`
- `structure/map/Controls.svelte`
- `structure/map/Legend.svelte`
- `system/gallery/Gallery.svelte`
- `system/workbench/Catalogue.svelte`

None of them but SliceLine passes `outlined`. `tests/checks/look/contrast.test.ts` passes in the four-file run below.

### Item 4

`tests/state/boards/board/hub-facets.test.ts`:
- The head comment opens "The group lists of the Projects board's bar on a workspace of two hubs".
- It says "The items are synthetic and hold only what the facets read, their `slice` empty since the preset has no categories", and ends "It does not cover the group lists drawing the rows, which the look does."
- The fixture gains `slice: ''`.

`npx vitest run --reporter=verbose tests/state/boards/board/hub-facets.test.ts`:

```
tests/state/boards/board/hub-facets.test.ts > the group lists on a workspace of two hubs > lists a value both hubs name once, counted over both 2ms
tests/state/boards/board/hub-facets.test.ts > the group lists on a workspace of two hubs > keeps both hubs' projects under a filter on that value 0ms
tests/state/boards/board/hub-facets.test.ts > the group lists on a workspace of two hubs > counts that value over both hubs' projects another facet's value leaves 7ms
 Test Files  1 passed (1)
      Tests  3 passed (3)
```

### Item 6

The grep before writing the helper (`grep -rn -e "fit(" -e "watchToolbar(" -e "frame/toolbar/fit" -e "frame/toolbar/watch" -e "from './fit" -e "from './watch" -e "gapOf" -e "columnGap" src`) printed, for the fold:
- `ui/frame/toolbar/Toolbar.svelte:39,40,113,114,136`
- `FilterBar.svelte:13,28,29,90,96,97,104,119,131,132`
- `SliceLine.svelte:12,25,26,97,103,104,114,121,135,136`

It also printed unrelated hits: `zones.ts` and `output.ts` local `fit` functions, `present.ts` `fit`, `forces.ts`, `Stage.svelte`, the terminal's `fit.fit()`, the server's `./watch` modules, and `columnGap` reads in `reveal.svelte.ts` and `CardActions.svelte`. `Toolbar.svelte` measures one run inside a header room span and folds into its own popover, so it keeps its own measure.

The helper is `src/lib/ui/frame/toolbar/FoldRun.svelte` (a component, so the `.run`, `.slot` and `.slot.clipped` rules are written once there under Svelte's scoping). It takes:
- `items`, `key` and `item` (a snippet);
- `box`, the line;
- `room(gap)`, which returns the room and the opener's width, or null while a box it reads is not drawn;
- `keep(fits)`, SliceLine's rule that no category label ends the run;
- `bind:shown`.

It holds `gapOf`, the widths, the run's width, the measure over `fit()`, `clipped` and the two `watchToolbar` calls. FilterBar's `room` is the line less `SEARCH_MIN`, the toggles, the gaps and More where More holds facets of its own, with More as the opener only while it holds nothing else. SliceLine's `room` is the line less the end and a gap, with "+n" as the opener. These are the arithmetic each line had. The toolbar folder holds 4 items (`ls src/lib/ui/frame/toolbar | wc -l`). Whether each line folds as case 1 says is the look's.

### Item 7

`Table.svelte:21-30`:

```ts
        /**
         * Every table's header row is sticky: it stays at the top of the box that scrolls the
         * table up and down, and scrolls away with its rows inside a box that never scrolls up or
         * down. `stays` sets the grounds over a wallpaper of a table whose header row stays over
         * its rows while they scroll under it (Problems, Gallery): the header row and the rows
         * paint the panel at the wallpaper's opacity with the wallpaper's blur behind them, the
         * rows painting nothing inside a surface.
         * Without it, the header row over a wallpaper paints nothing.
         */
        stays?: boolean;
```

This matches `th { position: sticky; ... }` and the `body.wall` rules at the foot of the file.

## Scripts of the first build

Every command of the first build that changed a file other than through the Edit and Write tools is listed here, read from the first build's transcript (its Bash calls filtered for `python3 -`, `perl -pi`, `perl -0pi`, `perl -CSD`, `sed -i`, `cat >>`, `cp`, `mv`, `rm` and `prettier --write`). Lines are of the tree as it stands after this round. Where this round replaced a hunk, it says so.

1. In the scratchpad only, it changed `<scratchpad>/caserun/before.test.ts` and nothing in the worktree:

```
S=/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad; cd $S/caserun && python3 - <<'EOF'
import re
f='before.test.ts'
s=open(f).read()
s=s.replace("const preset = (id: string, config = CONFIG) => board.presetFor(id, config);",
"/** A board taking every research project, whatever its stage or role. */\nconst ALL = { ...CONFIG, boards: { ...(CONFIG.boards as object), ws: { tier: 'research' } } };\nconst preset = (id: string, config = ALL) => board.presetFor(id, config);")
s=s.replace("], 'projects');\n        say('slices export'","], 'ws');\n        say('slices export'")
s=s.replace("say('sections', board.cardSections(its, preset('projects'))","say('sections', board.cardSections(its, preset('ws'))")
s=s.replace("p('c', { stage: 'nascent' })]);\n        say('kept'","p('c', { stage: 'nascent' })], 'ws');\n        say('kept'")
open(f,'w').write(s)
EOF
grep -n "'ws'" before.test.ts
```

2. `src/lib/state/boards/board/presets.ts`, eleven exact replacements, each asserted to match once. The lines it made now stand at:
- `:7-8` (head comment, "slices")
- `:55-56` (`categories` doc)
- `:91-95` (`BoardTag` with `color`)
- `:132` (`team` doc, "With column")
- `:139-143` (`slice` field)
- `:174` (`chips` doc sentence)
- `:183-187` (`FacetValue` with `tone`)
- `:208-219` (`mine` doc, `folded`, `columns`)
- `:222-243` (`BoardStats`, `VenueCount`)
- `:257-292` (`FACETS`, `LIST_CELLS`)
- `:437-445` (`shortWords`)

```
cd /Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O75 && python3 - <<'EOF'
p='src/lib/state/boards/board/presets.ts'
s=open(p).read()
rep=[
("""// of its own hub, and draws its sections, facets and stage order from the union of every hub's
// words. This module holds no table of boards.""",
"""// of its own hub, and draws its sections, slices, facets and stage order from the union of every
// hub's words. This module holds no table of boards."""),
("""    /**
     * The rows of `categories` of every hub's words, in their order, which the board's sections
     * and its category facet are drawn by.
     */""",
"""    /**
     * The rows of `categories` of every hub's words, in their order, which the board's sections
     * and its slices are drawn by.
     */"""),
("""/** A tag on a card: the id a filter names it by, and the words the chip carries. */
export type BoardTag = { id: Id; label: string };""",
"""/**
 * A tag on a card: the id a filter names it by, the words the chip carries, and, for a pillar whose
 * entry writes one as `#rrggbb`, its `color`, which a picked pillar is filled in.
 */
export type BoardTag = { id: Id; label: string; color?: string };"""),
("""    /** The team as one line (`teamLine`), which the Authors column draws. */""",
"""    /** The team as one line (`teamLine`), which the list's With column draws. */"""),
("""    category: string;
    /**
     * The key of the user's role""",
"""    category: string;
    /**
     * The project's slice of the board's second bar line, `<category key>/<stage or form>`
     * (facets.ts, `sliceValue`), or the empty string for a project with no stage.
     */
    slice: string;
    /**
     * The key of the user's role"""),
("""    /**
     * The project's form, when it has one, then its chips: the words the card's status row draws.
     */
    chips: string[];""",
"""    /**
     * The project's form, when it has one, then its chips: the words the card's status row draws.
     * The Form and Situation facets read the form and the chips apart, from `project`.
     */
    chips: string[];"""),
("""/** One value of one facet: what a filter stores, what the menu says, and how many carry it. */
export type FacetValue = { value: string; label: string; count: number };""",
"""/**
 * One value of one facet: what a filter stores, the words its list says, how many carry it, and the
 * hue of a value that has a colour of its own (a slice, a domain, a pillar).
 */
export type FacetValue = { value: string; label: string; count: number; tone?: string };"""),
("""    /**
     * Mine only: only the projects whose role fields name the user and those naming no one. On
     * until the reader switches it off; applied only where the board draws it, which is while the
     * workspace names a `self` and one of the board's projects is one it does not keep (state.ts,
     * `offersMine`).
     */
    mine: boolean;
};""",
"""    /**
     * Mine only: only the projects whose role fields name the user and those naming no one. On
     * until the reader switches it off; drawn while the workspace names a `self`, and applied only
     * where one of the board's projects is one it does not keep (state.ts, `offersMine`).
     */
    mine: boolean;
    /** The keys of the folded sections, the empty key for the "other" section. */
    folded: string[];
    /**
     * The cells of the list's columns the reader shows, in the board's order, and absent for the
     * board's own `columns`.
     */
    columns?: string[];
};"""),
("""/** The counts of the strip above the board, and the venues the board's projects aim at. */
export type BoardStats = {
    /** How many projects the board holds, before any filter. */
    active: number;
    submitReady: number;
    /** How many carry a chip whose word of `chips` carries the flag `blocked`. */
    blocked: number;
    /** How many carry a deadline. */
    dated: number;
    venues: VenueCount[];
};

/**
 * One venue of the stats strip: how many of the board's projects aim at it, and whether that warns.
 */
export type VenueCount = {
    id: Id;
    /** The registry's short name, which is what the chip carries. */
    short: string;
    /** The registry's full name, which is what the chip's tooltip carries. */
    name: string;
    count: number;
    /**
     * True from `venue_conc_warn` under `focus:` of config/defaults/behavior.yml up: too much of
     * the board on one venue.
     */
    warn: boolean;
};""",
"""/** The counts the board's controls carry, over the board's projects before any filter. */
export type BoardStats = {
    /** How many projects the board holds. */
    projects: number;
    /** How many carry a chip whose word of `chips` carries the flag `blocked`. */
    blocked: number;
    /** How many carry a deadline. */
    dated: number;
    /** `venue_conc_warn` under `focus:` of config/defaults/behavior.yml. */
    warnAt: number;
    /** The venues that many projects at a stage flagged `live` aim at, most aimed at first. */
    venues: VenueCount[];
};

/** One venue the board warns on: how many of its live projects aim at it. */
export type VenueCount = {
    id: Id;
    /** The registry's short name, its full name where it has none. */
    short: string;
    count: number;
};"""),
("""/** The facets, in the order the filter menu offers them. */
export const FACETS = [
    'stage',
    'category',
    'role',
    'year',
    'domain',
    'pillar',
    'funding',
    'dataset',
    'status',
    'compute',
    'reproduced',
    'code',
    'sessions'
];""",
"""/**
 * The facets, in the order the bar offers them: the slices of its second line, then the group
 * buttons of its first line, then the groups its More list holds.
 */
export const FACETS = [
    'slice',
    'form',
    'status',
    'role',
    'year',
    'domain',
    'venue',
    'pillar',
    'funding',
    'dataset',
    'compute',
    'reproduced',
    'code',
    'sessions'
];

/**
 * The cells a board's list can draw, in the order its Columns menu lists those its `columns` do
 * not name; config/options/layout.yml offers the same cells to `columns`.
 */
export const LIST_CELLS = [
    'title',
    'stage',
    'venue',
    'lane',
    'next',
    'with',
    'domain',
    'pillar',
    'funding'
];"""),
("""/**
 * The first sentence of a paragraph, cut to `limit`.""",
"""/**
 * The words of a label up to its first " (", so "de-risking (feasibility experiment)" reads
 * "de-risking": what a slice and the list's stage chip draw, the whole label being their tip.
 */
export function shortWords(label: string): string {
    const at = label.indexOf(' (');
    return at < 0 ? label : label.slice(0, at);
}

/**
 * The first sentence of a paragraph, cut to `limit`."""),
]
for a,b in rep:
    assert s.count(a)==1, a[:60]
    s=s.replace(a,b)
open(p,'w').write(s)
EOF
```

3. The FoldHead imports, after the move of item 4 below. The lines are `src/lib/views/boards/focus/Tasks.svelte:17`, `src/lib/views/boards/focus/CommandCenterView.svelte:13` and `src/lib/views/boards/focus/career/CareerPanel.svelte:38`:

```
cd /Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O75 && sed -i '' "s#import FoldHead from './FoldHead.svelte';#import FoldHead from '../../shared/card/FoldHead.svelte';#" src/lib/views/boards/focus/Tasks.svelte src/lib/views/boards/focus/CommandCenterView.svelte && sed -i '' "s#import FoldHead from '../FoldHead.svelte';#import FoldHead from '../../../shared/card/FoldHead.svelte';#" src/lib/views/boards/focus/career/CareerPanel.svelte && grep -rn "FoldHead" src/lib/views/boards/focus/ ; sed -n 1,8p src/lib/views/boards/focus/career/CareerPanel.svelte
```

4. A move and a deletion. The move put `FoldHead.svelte` where `src/lib/views/shared/card/FoldHead.svelte` stands now; the deletion removed `src/lib/views/boards/projects/Stats.svelte`:

```
cd /Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O75 && mv src/lib/views/boards/focus/FoldHead.svelte src/lib/views/shared/card/FoldHead.svelte && ls src/lib/views/shared/card | wc -l; grep -rn "class=\"count\"\|\.badge\b" src/lib/views/boards/focus/*.svelte | head -5
```

```
cd /Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O75 && rm src/lib/views/boards/projects/Stats.svelte && grep -rn "Stats.svelte\|filterChips\|filterLabel\|InForceChip\|filtersInForce\|submitReady\|STATS_VENUES\|board\.stat\|expand_all\|board\.collapse\|facet_category\|facet_stage\|filter_chip\|filter_count\|filter_remove\|filter_tick_glyph\|venue_dist_glyph" src tests docs config README.md --exclude=local.yml | grep -v "^docs/diagrams" | head -30
```

5. `src/lib/views/boards/projects/FilterBar.svelte`: the measure function, a `toggles` element, the toggles wrapped in a span, and two CSS rules. What stands now: the `toggles` state at `:74`, the `<span class="toggles" bind:this={toggles}>` block at `:122-146` and the `.toggles` rule at `:188-193`. The measure function and the `.groups, .more { flex: none; }` rule it wrote were rewritten by the Edit tool later in the first build, and replaced in this round by `FoldRun.svelte` (item 6).

```
cd /Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O75 && python3 - <<'EOF'
import re,io
p='src/lib/views/boards/projects/FilterBar.svelte'
s=open(p).read()
old_measure=s[s.index('    /** How many group buttons fit beside'):s.index('    $effect(() => {')]
new_measure='''    /** How many group buttons fit beside the controls before them, and More after them. */
    function measure(): void {
        if (line === null || run === null || toggles === null) return;
        if (line.getClientRects().length === 0) return;
        const gap = gapOf(line);
        const buttons = Array.from(run.children).filter(
            (one): one is HTMLElement => one instanceof HTMLElement
        );
        widths = buttons.map((one) => one.getBoundingClientRect().width);
        if (moreBox !== null) moreWidth = moreBox.getBoundingClientRect().width;
        // The search, the toggles and the run, and More where it holds facets of its own, each
        // with a gap before the next.
        const always = ownGroups.length > 0;
        const room =
            line.getBoundingClientRect().width -
            SEARCH_MIN -
            toggles.getBoundingClientRect().width -
            gap * (always ? 3 : 2) -
            (always ? moreWidth : 0);
        const result = fit(widths, room, always ? 0 : moreWidth, gap);
        shown = result.opener ? result.shown : null;
        buttons.forEach((one, at) => {
            const clipped = shown !== null && at >= shown;
            one.toggleAttribute('data-clipped', clipped);
            one.inert = clipped;
        });
    }

'''
s=s.replace(old_measure,new_measure)
s=s.replace('''    let moreBox: HTMLElement | null = $state(null);''','''    let toggles: HTMLElement | null = $state(null);
    let moreBox: HTMLElement | null = $state(null);''')
old_chips=s[s.index('    <Chip\n        label={t(\'board.quick_stale\')}'):s.index('    <div\n        class="groups"')]
body=old_chips.replace('\n    ','\n        ')
body='        '+body.lstrip()
body=body.rstrip()+'\n'
new_chips='''    <span
        class="toggles"
        bind:this={toggles}
    >
'''+body+'''    </span>
'''
s=s.replace(old_chips,new_chips)
s=s.replace('''    .line > :global(*) {
        flex-shrink: 0;
    }

    .line > .search {
        flex-shrink: 1;
    }
''','''    .toggles {
        display: inline-flex;
        flex: none;
        align-items: center;
        gap: 6px;
    }
''')
s=s.replace('''    .search {
        display: flex;
        flex: 1 1 0;
        min-width: 120px;
    }''','''    .search {
        display: flex;
        flex: 1 1 0;
        min-width: 120px;
    }

    .groups,
    .more {
        flex: none;
    }''')
open(p,'w').write(s)
EOF
sed -n 95,240p src/lib/views/boards/projects/FilterBar.svelte
```

6. An append to `src/lib/state/boards/board/filter-menu.ts`. It now stands at `:255-316`: `ListCell` `:256`, `cellHeading` `:262-272`, `listCells` `:274-296`, `pickCell` `:298-316`. The appended `pickCell(cells, key)` named two helpers it never defined; the Edit tool replaced it later in the first build with today's `pickCell(columns, saved, key)`.

```
cd /Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O75 && cat >> src/lib/state/boards/board/filter-menu.ts <<'EOF'

/** One cell of a board's list as a choice of its Columns menu: whether it is drawn, and how. */
export type ListCell = { key: string; label: string; shown: boolean };

/**
 * A cell's own heading, for a cell the board's `columns` do not name. The keys are literal for the
 * same reason as the headings'.
 */
function cellHeading(cell: string): string {
    if (cell === 'stage') return t('board.cell_stage');
    if (cell === 'venue') return t('board.cell_venue');
    if (cell === 'lane') return t('board.cell_lane');
    if (cell === 'next') return t('board.cell_next');
    if (cell === 'with') return t('board.cell_with');
    if (cell === 'domain') return t('board.cell_domain');
    if (cell === 'pillar') return t('board.cell_pillar');
    if (cell === 'funding') return t('board.cell_funding');
    return t('board.cell_title');
}

/**
 * Every cell a board's list can draw, in the order its Columns menu lists them: the cells of the
 * board's `columns` in their order and under their headings, then the other cells of `LIST_CELLS`
 * under their own. A cell is drawn when the saved choice (`saved`) names it, or, with none, when
 * the board's `columns` do; Project (`title`) is drawn always. A column of `columns` naming no cell
 * of `LIST_CELLS` is left out, as the config check reports it.
 */
export function listCells(columns: BoardColumn[], saved: string[] | undefined): ListCell[] {
    const own = columns.filter((one) => LIST_CELLS.includes(one.key));
    const named = new Set(own.map((one) => one.key));
    const cells = [
        ...own,
        ...LIST_CELLS.filter((cell) => !named.has(cell)).map((cell) => ({
            key: cell,
            label: cellHeading(cell)
        }))
    ];
    const drawn = new Set(saved ?? own.map((one) => one.key));
    return cells.map((cell) => ({
        ...cell,
        shown: cell.key === 'title' || drawn.has(cell.key)
    }));
}

/**
 * The saved choice of a board's columns after one cell is shown or hidden: the cells drawn, in the
 * Columns menu's order, or nothing when they are the board's own `columns`, so a board whose
 * `columns` change later draws the new ones.
 */
export function pickCell(cells: ListCell[], key: string): string[] | undefined {
    const next = cells
        .filter((cell) => (cell.key === key ? !cell.shown || key === 'title' : cell.shown))
        .map((cell) => cell.key);
    const own = cells.filter((cell) => cell.label !== '' && isOwn(cell, cells));
    return sameCells(next, own) ? undefined : next;
}
EOF
echo
```

7. `src/lib/state/boards/board/index.ts:52` (`listCells,`), `:54` (`pickCell,`) and `:60` (`ListCell` in the type export). The `picksOf,` line it matched was taken out by command 11:

```
cd /Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O75 && perl -0pi -e 's/    groupWords,\n    moreWords,/    groupWords,\n    listCells,\n    moreWords,/; s/    picksOf,\n/    pickCell,\n    picksOf,\n/; s/export type \{ FilterChoice, FilterGroup \} from/export type { FilterChoice, FilterGroup, ListCell } from/' src/lib/state/boards/board/index.ts && sed -n 44,62p src/lib/state/boards/board/index.ts
```

8. `tests/state/shared/hub-words.test.ts:80`, the title:

```
cd /Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O75 && sed -i '' 's/orders and labels the stage facet from the union", () => {/orders and labels the stages of the slices from the union", () => {/' tests/state/shared/hub-words.test.ts && sed -n 80p tests/state/shared/hub-words.test.ts
```

9. `tests/state/boards/board/board-rules.test.ts:9`, the head comment:

```
cd /Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O75 && sed -i '' 's|^// with the config check, a saved category filter, and the roles of a collection. The projects are$|// with the config check, a saved slice filter, and the roles of a collection. The projects are|' tests/state/boards/board/board-rules.test.ts && sed -n 9p tests/state/boards/board/board-rules.test.ts && grep -n "facet\|status\|columns\|cell\|submit\|stats\|category" tests/state/boards/board/board-rules.test.ts | head -40
```

10. The element bindings. They now stand at `FilterBar.svelte:73-75` and `SliceLine.svelte:77-79`. Each file's `run` line it wrote was taken out in this round, since `FoldRun.svelte` holds the run:

```
cd /Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O75 && perl -pi -e 's/let (\w+): HTMLElement \| null = \$state\(null\);/let $1 = \$state<HTMLElement | null>(null);/' src/lib/views/boards/projects/FilterBar.svelte src/lib/views/boards/projects/SliceLine.svelte && grep -n 'state<HTMLElement' src/lib/views/boards/projects/FilterBar.svelte src/lib/views/boards/projects/SliceLine.svelte
```

11. `config/text/views/boards/projects.yml:19` (`columns_always: '{0} is always shown'`) and `src/lib/views/boards/projects/Projects.svelte:321` (`t('board.columns_always', cell.label)`):

```
cd /Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O75 && sed -i '' "s/        columns_always: The Project column is always shown/        columns_always: '{0} is always shown'/" config/text/views/boards/projects.yml && sed -i '' "s/title: cell.key === 'title' ? t('board.columns_always') : cell.label/title: cell.key === 'title' ? t('board.columns_always', cell.label) : cell.label/" src/lib/views/boards/projects/Projects.svelte && grep -n "columns_always" config/text/views/boards/projects.yml src/lib/views/boards/projects/Projects.svelte
```

12. `src/lib/state/boards/board/filter-menu.ts` and `index.ts`:
- It removed the `MORE_FACETS` constant and its doc line (nothing stands in their place, between `LINE_FACETS` `:49` and the `facetHeading` doc).
- It un-exported `facetTone` (that function was replaced in this round, `:80`) and `picksOf` (`:171`).
- It removed `LIST_CELLS,`, `MORE_FACETS,` and `picksOf,` from `index.ts`'s export list.
- It rewrote the `LINE_FACETS` doc line, `filter-menu.ts:48`.

```
cd /Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O75 && perl -0pi -e 's|/\*\* The facets the More list holds, in its order: every facet neither a slice nor on line 1\. \*/\nexport const MORE_FACETS = [^\n]*\n\n||; s/^export function facetTone\(/function facetTone(/m; s/^export function picksOf\(/function picksOf(/m' src/lib/state/boards/board/filter-menu.ts && perl -0pi -e 's/    LIST_CELLS,\n//; s/    MORE_FACETS,\n//; s/    picksOf,\n//' src/lib/state/boards/board/index.ts && sed -i '' 's|^/\*\* The facets whose group buttons line 1 of the bar draws, in its order. \*/$|/** The facets whose group buttons line 1 of the bar draws, in its order; More holds the rest. */|' src/lib/state/boards/board/filter-menu.ts && sed -n 44,50p src/lib/state/boards/board/filter-menu.ts && grep -n "MORE_FACETS\|picksOf\|LIST_CELLS" src/lib/state/boards/board/index.ts
```

13. This report, `.scratch/migration/agents/reviews/O75-report.md`. What stands now:
- the marker line `:38` (the character written by its name);
- judgment 18, `:192`;
- the runs line, `:222`, "on the new row alone".

It also removed one line, a note on the marker character. Its fourth substitution (`-t .case 32.\)`) matched nothing, so `:33` still names `-t 'case 32'`.

```
cd /Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O75 && f=.scratch/migration/agents/reviews/O75-report.md && perl -CSD -pi -e 's/\x{276F} tests/<HEAVY RIGHT-POINTING ANGLE QUOTATION MARK ORNAMENT> tests/; s/^\(The marker before the path is the character <HEAVY RIGHT-POINTING ANGLE QUOTATION MARK ORNAMENT> in vitest.s output\.\)\n//; s/18\. The Table primitive draws its header sticky always \(judgment of item "wrong" 1 below\);/18. The Table primitive draws its header sticky on every table (see "wrong or impossible" 1);/; s/-t .case 32.\)/run alone, 81 rows skipped)/; s/on the new row alone with `-t .case 32.`/on the new row alone/' $f && LC_ALL=C grep -n '[^ -~]' $f; echo "non-ascii check exit $?"; grep -n "case 32\|HEAVY\|judgment 18\|^18\." $f | head
```

14. The formatter, which the rules file asks for on the files written. It changes layout only. Four runs, over every changed file of the first build:

```
cd /Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O75 && git status --short && export PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH && FILES=$(git status --short | awk '$1!="D"{print $2}' | grep -v "/$"); npx prettier --write $FILES src/lib/views/boards/projects/PickMenu.svelte src/lib/views/boards/projects/SliceLine.svelte src/lib/views/boards/projects/BoardList.svelte src/lib/views/shared/card/FoldHead.svelte 2>&1 | tail -40
```

```
cd /Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O75 && export PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH && git status --short --untracked-files=all | awk '$1!="D"{print $2}' | xargs npx prettier --write 2>&1 | tail -40
```

```
cd /Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O75 && export PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH && npx prettier --write src/lib/views/boards/projects/Projects.svelte config/text/views/boards/projects.yml >/dev/null && sh utils/unused-exports.sh > /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/unused-after.txt 2>&1; diff /Users/axelfaes/workspace/oculus/.agents/worktrees/O75-base/unused-exports.txt /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/unused-after.txt; echo "diff exit $?"; wc -l /Users/axelfaes/workspace/oculus/.agents/worktrees/O75-base/unused-exports.txt /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/unused-after.txt
```

```
cd /Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O75 && export PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH && npx prettier --write src/lib/views/boards/projects/PickMenu.svelte && npx eslint src/lib/views/boards/projects/PickMenu.svelte && awk 'length > 100 {print FILENAME": "FNR}' src/lib/views/boards/projects/PickMenu.svelte
```

15. `npm run diagrams`, in the two verify runs of the first build, which rewrote `docs/diagrams/layer-views.{dot,svg}`, `layers.{dot,svg}` and `writes.{dot,svg}`:

```
cd /Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O75 && export PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH && (npm run diagrams && npm run test:quick) > /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/verify-1.txt 2>&1; echo "exit $?"; tail -60 /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/verify-1.txt
```

```
cd /Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O75 && export PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH && (npm run diagrams && npm run test:quick) > /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/verify-2.txt 2>&1; echo "exit $?"; grep -E "^(ok|FAIL|fail|test:quick)" /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/verify-2.txt; tail -3 /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/verify-2.txt
```

16. The case-run file, copied into `tests/state/boards/board/o75-caserun.test.ts` and removed by the same command, five times. `ls tests/state/boards/board/` prints `board-rules.test.ts hub-facets.test.ts items.test.ts` now. The five commands:

```
S=/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad; W=/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O75; rm -rf $S/caserun/tests; cp $S/caserun/before.test.ts $W/tests/state/boards/board/o75-caserun.test.ts && cd $W && export PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH; timeout 300 npx vitest run tests/state/boards/board/o75-caserun.test.ts 2>&1 | grep -v "^$" | grep -v "^ *at \|node_modules" | head -80; rm $W/tests/state/boards/board/o75-caserun.test.ts
```

```
S=/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad; W=/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O75; cp $S/caserun/before.test.ts $W/tests/state/boards/board/o75-caserun.test.ts && cd $W && export PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH; npx vitest run tests/state/boards/board/o75-caserun.test.ts 2>&1 | grep -v "^$" | grep -v "^ *at \|node_modules" | head -80; rm $W/tests/state/boards/board/o75-caserun.test.ts
```

```
S=/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad; W=/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O75; cp $S/caserun/before.test.ts $W/tests/state/boards/board/o75-caserun.test.ts && cd $W && export PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH; npx vitest run tests/state/boards/board/o75-caserun.test.ts -t "case [234]$" 2>&1 | grep -A4 "^stdout"; rm $W/tests/state/boards/board/o75-caserun.test.ts
```

```
cp after.test.ts /Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O75/tests/state/boards/board/o75-caserun.test.ts && cd /Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O75 && export PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH && npx vitest run tests/state/boards/board/o75-caserun.test.ts 2>&1 | grep -v "^$" | grep -v "^ *at \|stdout |" | head -120; rm tests/state/boards/board/o75-caserun.test.ts; ls tests/state/boards/board/
```

```
cd /Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O75 && export PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH && cp /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/caserun/after.test.ts tests/state/boards/board/o75-caserun.test.ts && npx vitest run tests/state/boards/board/o75-caserun.test.ts 2>&1 | grep -E "^[a-zA-Z ,\"\[\]0-9()/-]+: " | grep -v "^Error\|^ FAIL\|Duration\|Start at\|Test Files\|Tests " > /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/caserun/after-output.txt; rm tests/state/boards/board/o75-caserun.test.ts; ls tests/state/boards/board/; cat /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/caserun/after-output.txt
```

17. In the scratchpad only, two heredocs wrote files there: `caserun/tests/probe.test.ts` (a three-line file printing `FACETS`, removed by the `rm -rf $S/caserun/tests` of the first command of item 16) and `caserun/after.test.ts` (`cd <scratchpad>/caserun && cat > after.test.ts <<'EOF'`, its body the source quoted under "Case-run sources").

In this round the worktree's files were changed only by the Edit and Write tools, the formatter and `npm run diagrams`:

```
cd /Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O75 && export PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH && npx prettier --write src/lib/ui/frame/toolbar/FoldRun.svelte src/lib/views/boards/projects/FilterBar.svelte src/lib/views/boards/projects/SliceLine.svelte src/lib/ui/controls/Chip.svelte && npx svelte-check --tsconfig ./tsconfig.json --output human 2>&1 | tail -15 && npx eslint src/lib/ui/frame/toolbar/FoldRun.svelte src/lib/views/boards/projects/FilterBar.svelte src/lib/views/boards/projects/SliceLine.svelte src/lib/ui/controls/Chip.svelte
```

```
cd /Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O75 && export PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH && npx prettier --write src/lib/state/boards/board/filter-menu.ts config/catalogs/vocab.yml config/options/catalogs/vocab.yml src/lib/data/shapes/catalog-files/vocab.ts tests/state/boards/board/hub-facets.test.ts src/lib/ui/display/table/Table.svelte config/text/views/boards/projects.yml docs/templates.md docs/data-map.md docs/HELP.md 2>&1 | grep -v unchanged; npx vitest run tests/state/boards/board/board-rules.test.ts tests/state/boards/board/hub-facets.test.ts tests/checks/look/contrast.test.ts tests/checks/config/config-folder.test.ts 2>&1 | tail -25
```

`npm run diagrams` ran inside the two verify runs quoted under "Verify". In the scratchpad, `cp $S/after.test.ts $S/after.case.ts` made the case file this round edits with the Edit tool, and `mv $S/caserun.config.ts $S/caserun.config.mts` renamed the config.

The list above was read from the transcript's Bash calls by `jq -r 'select(.type=="assistant") | .message.content[]? | select(.type=="tool_use" and .name=="Bash") | .input.command'` over the builder's transcript, filtered for `python3 -`, `perl -pi`, `perl -0pi`, `perl -CSD`, `sed -i`, `cat >`, `cp `, `mv `, `rm ` and `prettier --write`. Each quoted command was compared with the transcript's text by `diff`, and every one matched.

Four more commands of the first build wrote files, all in the scratchpad and none in the worktree, added at landing from the review over round 1 (Proof 1), each with its Bash call number and its line in the builder's transcript:

- Call 123 (L905): `head -30 src/lib/views/boards/projects/Projects.svelte > <scratchpad>/projects-head.txt`.
- Call 168 (L1352): `sh utils/unused-exports.sh > <scratchpad>/unused-after.txt`.
- Call 173 (L1381): `... > <scratchpad>/keys.txt`.
- Call 195 (L1546): `sh utils/unused-exports.sh > <scratchpad>/unused-after.txt`.

## Case-run sources

All live in `/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/caserun/`.

`before.test.ts` and `after.test.ts` ran in the first build, copied into `tests/state/boards/board/o75-caserun.test.ts`; their relative imports are written for that place. This round runs every case file from the scratchpad through `caserun.config.mts`, with absolute imports:
- `after.case.ts`, which is `after.test.ts` with its head and imports changed;
- `r1-tones.case.ts`.

The command is `npx vitest run --config <dir>/caserun.config.mts --reporter=verbose <dir>/<file>.case.ts`, from the worktree's root. Nothing is written into the worktree (`git status --short --untracked-files=all` after the runs lists only the step's files).

`caserun.config.mts`:

```ts
// Case-run config: the worktree's own vite config with its three test projects replaced by one
// node project whose only file is the case-run file named on the command line, kept here in the
// scratchpad. Each case prints and asserts nothing, so requireAssertions is off.
import base from '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O75/vite.config.ts';

const W = '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O75';
const S = '/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/caserun';

type Made = Record<string, unknown> & { test: Record<string, unknown> };

export default async (env: { mode: string; command: string }) => {
    const made = (await (base as unknown as (one: unknown) => Promise<Made> | Made)(env)) as Made;
    const { projects: _projects, ...test } = made.test;
    return {
        ...made,
        root: W,
        test: {
            ...test,
            name: 'caserun',
            environment: 'node',
            expect: { requireAssertions: false },
            include: [`${S}/*.case.ts`]
        }
    };
};
```

`before.test.ts` (first build, on the unchanged tree):

```ts
// Case-run of O75's cases on the unchanged tree: prints each case's result, asserts nothing.
import { describe, it } from 'vitest';
import type { Id, Project, Snapshot } from '../../../../src/lib/data/model/index.ts';
import { HUB_FILE } from '../../../../src/lib/data/helpers/hub-names.ts';
import { engineDir, loadConfig, textCatalog } from '../../../../src/lib/data/sources/config.ts';
import { boardsFindings } from '../../../../src/lib/data/sources/config/sections/boards.ts';
import * as board from '../../../../src/lib/state/boards/board/index.ts';
import { setCatalog } from '../../../../src/lib/state/shared/words/text.ts';
import { setVocab } from '../../../../src/lib/state/shared/words/tones.ts';
import { NO_FEEDS, fixtureProject } from '../../../fixtures/entities-fixture.ts';
import { it as scratchIt, plantScratch } from '../../../fixtures/scratch.ts';

const { config: CONFIG } = loadConfig(engineDir());
const CATALOG = textCatalog(CONFIG);
setCatalog(CATALOG);
setVocab({ primary: null, lists: {}, order: [], own: CONFIG });
const SELF = 'me';
const say = (name: string, value: unknown): void => console.log(`${name}: ${JSON.stringify(value)}`);

function p(id: string, over: Partial<Project>): Project {
    return fixtureProject({ id, title: id, folder: id, file: `${id}/project.yml`, tier: 'research', lead: [SELF], ...over });
}
function snap(projects: Project[], extra: Record<string, unknown> = {}, self = true): Snapshot {
    return {
        version: 1,
        entities: {
            projects: Object.fromEntries(projects.map((one) => [one.id, one])),
            venues: {}, pillars: {}, domains: {}, funding: {},
            people: self ? { [SELF]: { id: SELF, name: 'Me', self: true } } : {},
            organisations: {}, resources: {}, collections: {}, datasets: {}, feeds: NO_FEEDS, career: null,
            ...extra
        },
        relations: { projectRelated: [], projectVenue: [] },
        findings: []
    } as unknown as Snapshot;
}
/** A board taking every research project, whatever its stage or role. */
const ALL = { ...CONFIG, boards: { ...(CONFIG.boards as object), ws: { tier: 'research' } } };
const preset = (id: string, config = ALL) => board.presetFor(id, config);
const items = (projects: Project[], id = 'archive', extra = {}, self = true) =>
    board.boardItems(snap(projects, extra, self), preset(id));
const facetOf = (found: board.Facet[], key: string) =>
    found.find((one) => one.key === key)?.values.map((one) => [one.value, one.label, one.count]);
const slices = (board as Record<string, unknown>).slices;

describe('O75 cases, first read', () => {
    it('case 2', () => {
        const its = items([
            p('a', { stage: 'published', form: 'journal', chips: ['blocked'] }),
            p('b', { stage: 'published', form: 'conference', chips: ['parked'] }),
            p('c', { stage: 'published', form: 'poster' })
        ]);
        const found = board.facets(its, preset('archive'));
        say('facet keys', found.map((one) => one.key));
        say('status', facetOf(found, 'status'));
        say('form', facetOf(found, 'form'));
    });
    it('case 3', () => {
        const its = items([p('a', { stage: 'published', form: 'journal' }), p('b', { stage: 'submitted' }), p('c', { stage: 'de-risking' })], 'ws');
        say('slices export', typeof slices);
        say('FACETS', board.FACETS);
        say('sections', board.cardSections(its, preset('ws')).map((one) => [one.key, one.label]));
    });
    it('case 4', () => {
        const its = items([p('a', { stage: 'published', form: 'journal' }), p('b', { stage: 'submitted' }), p('c', { stage: 'nascent' })], 'ws');
        say('kept', board.applyFilters(its, { slice: ['publications/journal', 'in-review/submitted'] }, '').map((one) => one.id));
    });
    it('case 6, second part', () => {
        const keys = preset('projects').categories.map((one) => one.key);
        say('filters', board.parseBoardState({ filters: { stage: ['nascent'], category: ['idea'] } }, 'short', [], keys).filters);
    });
    it('cases 7 and 8', () => {
        const ps = Array.from({ length: 16 }, (_, at) =>
            p(`p${at}`, { stage: 'exploring', deadline: at < 3 ? '2026-12-01' : undefined, chips: at >= 14 ? ['blocked'] : [] }));
        const its = items(ps, 'projects');
        say('stats', board.stats(its, {}, CONFIG));
        const none = items(ps.map((one) => ({ ...one, chips: [] })), 'projects');
        say('stats, none blocked', board.stats(none, {}, CONFIG).blocked);
    });
    it('case 9', () => {
        const venues = { v1: { id: 'v1', name: 'Biomedical Signal Processing and Control', short: 'BSPC' }, v2: { id: 'v2', name: 'Other Journal' } };
        const ps = [
            ...Array.from({ length: 5 }, (_, at) => p(`l${at}`, { stage: 'exploring', venueId: 'v1' })),
            ...Array.from({ length: 4 }, (_, at) => p(`d${at}`, { stage: 'published', form: 'journal', venueId: 'v2' }))
        ];
        const config = { ...CONFIG, focus: { ...(CONFIG.focus as object), venue_conc_warn: 4 } };
        say('mixed', board.stats(items(ps, 'projects', { venues }), venues, config).venues);
        const archive = ps.slice(5);
        say('archive', board.stats(items(archive, 'archive', { venues }), venues, config).venues);
    });
    it('case 17', () => {
        const config = { ...CONFIG, boards: { ...(CONFIG.boards as object), ws: { tier: 'research', columns: [{ cell: 'status', label: 'S' }] } } };
        say('findings', boardsFindings(config, () => 'layout.yml', CATALOG).map((one) => one.message));
    });
    it('case 18', () => {
        const venues = { v1: { id: 'v1', name: 'Journal A', short: 'JA' }, 'look-hub2:v1': { id: 'look-hub2:v1', name: 'Journal A', short: 'JA' }, v2: { id: 'v2', name: 'B Journal' } };
        const ps = [p('a', { venueId: 'v1', stage: 'exploring' }), p('b', { venueId: 'v2', stage: 'exploring' }), p('c', { stage: 'exploring' })];
        say('venue', facetOf(board.facets(items(ps, 'projects', { venues }), preset('projects')), 'venue'));
    });
    it('case 19', () => {
        const held = board.parseBoardState({ folded: ['idea', '', 3], columns: ['title', 'status', 'next'] }) as unknown as Record<string, unknown>;
        say('folded', held.folded);
        say('columns', held.columns);
    });
    it('case 20', () => {
        const its = items([p('a', { stage: 'exploring' }), p('b', { stage: 'nascent' })], 'projects', {}, false);
        say('role facet offered', board.facets(its, preset('projects'), false).some((one) => one.key === 'role'));
        say('kept under role lead', board.applyFilters(its, { role: ['lead'] }, '').map((one) => one.id));
    });
    scratchIt('case 21', () => {
        const hub = plantScratch('oculus-o75-case21-', {
            [HUB_FILE]: 'stages:\n  submit-ready: { label: "submit-ready", icon: green, color: "#ea580c", live: true, submit_ready: true }\n'
        });
        say('hub findings', loadConfig(engineDir(), { hub }).findings.map((one) => one.message));
        say('own findings', loadConfig(engineDir()).findings.map((one) => one.message));
    });
    it('case 22', () => {
        const pillars = { pl: { id: 'pl', title: 'Blue line', color: '#2563eb', fundingIds: [], projectIds: [] }, pn: { id: 'pn', title: 'Plain', fundingIds: [], projectIds: [] } };
        const its = items([p('a', { stage: 'exploring', pillarIds: ['pl', 'pn'] as Id[] })], 'projects', { pillars });
        say('pillar tags', its[0].pillars);
    });
});
```

`after.test.ts` (first build, after the change) is `after.case.ts` below with these eleven head lines in place of its twelve:

```ts
// Case-run of O75's cases after the change: prints each case's result, asserts nothing.
import { describe, it } from 'vitest';
import type { Id, Project, Snapshot } from '../../../../src/lib/data/model/index.ts';
import { HUB_FILE } from '../../../../src/lib/data/helpers/hub-names.ts';
import { engineDir, loadConfig, textCatalog } from '../../../../src/lib/data/sources/config.ts';
import { boardsFindings } from '../../../../src/lib/data/sources/config/sections/boards.ts';
import * as board from '../../../../src/lib/state/boards/board/index.ts';
import { setCatalog } from '../../../../src/lib/state/shared/words/text.ts';
import { setVocab } from '../../../../src/lib/state/shared/words/tones.ts';
import { NO_FEEDS, fixtureProject } from '../../../fixtures/entities-fixture.ts';
import { it as scratchIt, plantScratch } from '../../../fixtures/scratch.ts';
```

`diff after.test.ts after.case.ts` shows only those lines.

`after.case.ts` (this round, on the repaired tree):

```ts
// Case-run of O75's cases after the change, run from the scratchpad over the worktree by absolute
// paths: prints each case's result, asserts nothing.
import { describe, it } from 'vitest';
import type { Id, Project, Snapshot } from '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O75/src/lib/data/model/index.ts';
import { HUB_FILE } from '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O75/src/lib/data/helpers/hub-names.ts';
import { engineDir, loadConfig, textCatalog } from '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O75/src/lib/data/sources/config.ts';
import { boardsFindings } from '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O75/src/lib/data/sources/config/sections/boards.ts';
import * as board from '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O75/src/lib/state/boards/board/index.ts';
import { setCatalog } from '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O75/src/lib/state/shared/words/text.ts';
import { setVocab } from '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O75/src/lib/state/shared/words/tones.ts';
import { NO_FEEDS, fixtureProject } from '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O75/tests/fixtures/entities-fixture.ts';
import { it as scratchIt, plantScratch } from '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O75/tests/fixtures/scratch.ts';

const { config: CONFIG } = loadConfig(engineDir());
const CATALOG = textCatalog(CONFIG);
setCatalog(CATALOG);
setVocab({ primary: null, lists: {}, order: [], own: CONFIG });
const SELF = 'me';
const say = (name: string, value: unknown): void => console.log(`${name}: ${JSON.stringify(value)}`);

function p(id: string, over: Partial<Project>): Project {
    return fixtureProject({ id, title: id, folder: id, file: `${id}/project.yml`, tier: 'research', lead: [SELF], ...over });
}
function snap(projects: Project[], extra: Record<string, unknown> = {}, self = true): Snapshot {
    return {
        version: 1,
        entities: {
            projects: Object.fromEntries(projects.map((one) => [one.id, one])),
            venues: {}, pillars: {}, domains: {}, funding: {},
            people: self ? { [SELF]: { id: SELF, name: 'Me', self: true } } : {},
            organisations: {}, resources: {}, collections: {}, datasets: {}, feeds: NO_FEEDS, career: null,
            ...extra
        },
        relations: { projectRelated: [], projectVenue: [] },
        findings: []
    } as unknown as Snapshot;
}
/** A board taking every research project, whatever its stage or role. */
const ALL = { ...CONFIG, boards: { ...(CONFIG.boards as object), ws: { tier: 'research' } } };
const preset = (id: string, config = ALL) => board.presetFor(id, config);
const items = (projects: Project[], id = 'archive', extra = {}, self = true) =>
    board.boardItems(snap(projects, extra, self), preset(id));
const facetOf = (found: board.Facet[], key: string) =>
    found.find((one) => one.key === key)?.values.map((one) => [one.value, one.label, one.count, one.tone]);

describe('O75 cases, after the change', () => {
    it('case 2', () => {
        const its = items([
            p('a', { stage: 'published', form: 'journal', chips: ['blocked'] }),
            p('b', { stage: 'published', form: 'conference', chips: ['parked'] }),
            p('c', { stage: 'published', form: 'poster' })
        ]);
        const found = board.facets(its, preset('archive'));
        say('facet keys', found.map((one) => one.key));
        say('status', facetOf(found, 'status'));
        say('form', facetOf(found, 'form'));
    });
    it('case 3', () => {
        const its = items([p('a', { stage: 'published', form: 'journal' }), p('b', { stage: 'submitted' }), p('c', { stage: 'de-risking' })], 'ws');
        say('FACETS', board.FACETS);
        say('slices', board.sliceGroups(its, preset('ws')).map((group) => [group.key, group.label, group.tone, group.slices]));
    });
    it('case 4', () => {
        const its = items([
            p('a', { stage: 'published', form: 'journal', year: '2025' }),
            p('b', { stage: 'submitted', year: '2026' }),
            p('c', { stage: 'nascent', year: '2026' })
        ], 'ws');
        const filters = { slice: ['publications/journal', 'in-review/submitted'] };
        say('kept', board.applyFilters(its, filters, '').map((one) => one.id));
        const counted = board.facets(its, preset('ws'), true, { filters: { ...filters, year: ['2026'] }, search: '' });
        say('slice counts under year 2026', facetOf(counted, 'slice'));
    });
    it('case 6, second part', () => {
        const its = items([p('a', { stage: 'nascent' })], 'ws');
        const values = board.sliceGroups(its, preset('ws')).flatMap((group) => group.slices.map((one) => one.value));
        say('filters', board.parseBoardState({ filters: { stage: ['nascent'], category: ['idea'] } }, 'short', [], values).filters);
    });
    it('cases 7 and 8', () => {
        const ps = Array.from({ length: 16 }, (_, at) =>
            p(`p${at}`, { stage: 'exploring', deadline: at < 3 ? '2026-12-01' : undefined, chips: at >= 14 ? ['blocked'] : [] }));
        const its = items(ps, 'projects');
        const stats = board.stats(its, {}, CONFIG);
        say('stats', stats);
        say('deadline words', board.deadlineWords(stats));
        say('end of line 2, all shown', board.shownWords(16, stats.projects));
        say('end of line 2, five shown', board.shownWords(5, stats.projects));
        say('end of line 2, one project', board.shownWords(1, 1));
        say('blocked badge', board.blockedBadge(stats));
        const none = board.stats(items(ps.map((one) => ({ ...one, chips: [], deadline: undefined })), 'projects'), {}, CONFIG);
        say('none blocked, badge', JSON.stringify(board.blockedBadge(none)));
        say('no dated project', board.deadlineWords(none));
    });
    it('case 9', () => {
        const venues = { v1: { id: 'v1', name: 'Biomedical Signal Processing and Control', short: 'BSPC' }, v2: { id: 'v2', name: 'Other Journal' } };
        const ps = [
            ...Array.from({ length: 5 }, (_, at) => p(`l${at}`, { stage: 'exploring', venueId: 'v1' })),
            ...Array.from({ length: 4 }, (_, at) => p(`d${at}`, { stage: 'published', form: 'journal', venueId: 'v2' }))
        ];
        const config = { ...CONFIG, focus: { ...(CONFIG.focus as object), venue_conc_warn: 4 } };
        const mixed = board.stats(items(ps, 'ws', { venues }), venues, config);
        say('mixed venues', mixed.venues);
        say('mixed tip', board.venueWarning(mixed));
        const archive = board.stats(items(ps.slice(5), 'archive', { venues }), venues, config);
        say('archive venues', archive.venues);
        say('archive tip', JSON.stringify(board.venueWarning(archive)));
    });
    it('case 17', () => {
        const config = { ...CONFIG, boards: { ...(CONFIG.boards as object), ws: { tier: 'research', columns: [{ cell: 'status', label: 'S' }, { cell: 'lane', label: 'L' }, { cell: 'with', label: 'W' }] } } };
        say('findings', boardsFindings(config, () => 'layout.yml', CATALOG).map((one) => one.message));
        say('shipped findings', boardsFindings(CONFIG, () => 'layout.yml', CATALOG).map((one) => one.message));
    });
    it('case 18', () => {
        const venues = { v1: { id: 'v1', name: 'Journal A', short: 'JA' }, 'look-hub2:v1': { id: 'look-hub2:v1', name: 'Journal A', short: 'JA' }, v2: { id: 'v2', name: 'B Journal' }, v3: { id: 'v3', name: 'A Journal' } };
        const ps = [
            p('a', { venueId: 'v1', stage: 'exploring' }),
            p('b', { venueId: 'v2', stage: 'exploring' }),
            p('c', { stage: 'exploring' }),
            p('d', { venueId: 'look-hub2:v1' as Id, stage: 'exploring' }),
            p('e', { venueId: 'v3', stage: 'exploring' })
        ];
        say('venue', facetOf(board.facets(items(ps, 'projects', { venues }), preset('projects')), 'venue'));
    });
    it('case 19', () => {
        const held = board.parseBoardState({ folded: ['idea', '', 3], columns: ['title', 'status', 'next'] });
        say('folded', held.folded);
        say('columns', held.columns);
        say('columns of ["status"]', board.parseBoardState({ columns: ['status'] }).columns ?? 'absent');
    });
    it('case 20', () => {
        const its = items([p('a', { stage: 'exploring' }), p('b', { stage: 'nascent' })], 'projects', {}, false);
        const pst = preset('projects');
        say('role facet offered', board.facets(its, pst, false).some((one) => one.key === 'role'));
        const saved = { role: ['lead'] };
        const applied = board.appliedFilters(saved, false);
        say('applied with no self', applied);
        say('kept', board.applyFilters(its, applied, '').map((one) => one.id));
        const counted = board.facets(its, pst, false, { filters: { domain: ['gone'] }, search: '' });
        const groups = board.filterGroups(counted, { domain: ['gone'] }, pst, false);
        say('domain group', groups.find((one) => one.id === 'domain'));
    });
    scratchIt('case 21', () => {
        const hub = plantScratch('oculus-o75-case21-', {
            [HUB_FILE]: 'stages:\n  submit-ready: { label: "submit-ready", icon: green, color: "#ea580c", live: true, submit_ready: true }\n'
        });
        say('hub findings', loadConfig(engineDir(), { hub }).findings.map((one) => one.message));
        say('own findings', loadConfig(engineDir()).findings.map((one) => one.message));
    });
    it('case 22', () => {
        const pillars = { pl: { id: 'pl', title: 'Blue line', color: '#2563eb', fundingIds: [], projectIds: [] }, pn: { id: 'pn', title: 'Plain', fundingIds: [], projectIds: [] } };
        const its = items([p('a', { stage: 'exploring', pillarIds: ['pl', 'pn'] as Id[] })], 'projects', { pillars });
        say('pillar tags', its[0].pillars);
        const found = board.facets(its, preset('projects'));
        say('pillar facet', facetOf(found, 'pillar'));
        say('pillar choices', board.filterGroups(found, { pillar: ['pl'] }, preset('projects'), true).find((one) => one.id === 'pillar')?.items);
    });
    it('columns menu', () => {
        const pst = preset('projects');
        say('cells, default', board.listCells(pst.columns, undefined).map((one) => [one.key, one.label, one.shown]));
        say('hide venue', board.pickCell(pst.columns, undefined, 'venue'));
        say('show venue back', board.pickCell(pst.columns, ['title', 'stage', 'lane', 'next', 'with'], 'venue') ?? 'absent');
        say('press project', board.pickCell(pst.columns, undefined, 'title') ?? 'absent');
    });
});
```

Its output on the repaired tree, exit 0, `Tests  13 passed (13)`. Every line equals the first build's "The cases after the change". The `pillar choices` value `pn` is still `cyan`, now read from `facet_tones`:

```
facet keys: ["slice","form","status","year","funding","compute","reproduced","code","sessions"]
status: [["blocked","blocked (external)",1,null],["parked","parked (not being worked)",1,null]]
form: [["journal","journal article",1,null],["conference","conference paper",1,null],["poster","poster",1,null]]
FACETS: ["slice","form","status","role","year","domain","venue","pillar","funding","dataset","compute","reproduced","code","sessions"]
slices: [["in-review","in review","sky",[{"value":"in-review/submitted","label":"submitted / under review","tip":"submitted / under review","tone":"sky"}]],["in-flight","in flight","green",[{"value":"in-flight/de-risking","label":"de-risking","tip":"de-risking (feasibility experiment)","tone":"green"}]],["publications","publications","rose",[{"value":"publications/journal","label":"journal article","tip":"journal article","tone":"rose"}]]]
kept: ["b","a"]
slice counts under year 2026: [["in-review/submitted","submitted / under review",1,"sky"],["idea/nascent","nascent",1,"violet"],["publications/journal","journal article",0,"rose"]]
filters: {}
stats: {"projects":16,"blocked":2,"dated":3,"warnAt":4,"venues":[]}
deadline words: "deadline 3"
end of line 2, all shown: "16 projects"
end of line 2, five shown: "5 of 16 shown"
end of line 2, one project: "1 project"
blocked badge: "2 blocked"
none blocked, badge: "\"\""
no dated project: "deadline 0"
mixed venues: [{"id":"v1","short":"BSPC","count":5}]
mixed tip: "BSPC: 5 live projects, the warning is 4"
archive venues: []
archive tip: "\"\""
findings: ["boards.ws.columns[0].cell must be one of title, stage, venue, lane, next, with, domain, pillar, funding; it is not read"]
shipped findings: []
venue: [["v1","JA",2,null],["v3","A Journal",1,null],["v2","B Journal",1,null]]
folded: ["idea",""]
columns: ["title","next"]
columns of ["status"]: "absent"
role facet offered: false
applied with no self: {}
kept: ["b","a"]
domain group: {"id":"domain","heading":"Domain","tone":"teal","items":[{"id":"gone","label":"gone","count":0,"active":true,"tone":"teal"}]}
hub findings: ["key stages.submit-ready.submit_ready is not a key this file takes"]
own findings: []
pillar tags: [{"id":"pl","label":"Blue line","color":"#2563eb"},{"id":"pn","label":"Plain"}]
pillar facet: [["pl","Blue line",1,"blue"],["pn","Plain",1,null]]
pillar choices: [{"id":"pl","label":"Blue line","count":1,"active":true,"tone":"blue"},{"id":"pn","label":"Plain","count":1,"active":false,"tone":"cyan"}]
cells, default: [["title","Project",true],["stage","Stage",true],["venue","Venue",true],["lane","Lane",true],["next","Next",true],["with","With",true],["domain","Domain",false],["pillar","Pillar",false],["funding","Funding",false]]
hide venue: ["title","stage","lane","next","with"]
show venue back: "absent"
press project: "absent"
```

`r1-tones.case.ts` (this round, item 2):

```ts
// Case-run of O75 repair round 1, item 2: the filter groups' colours from `facet_tones` of the
// vocabulary. Prints each case's result, asserts nothing.
import { describe } from 'vitest';
import type { HubVocabs, Project, Snapshot } from '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O75/src/lib/data/model/index.ts';
import { HUB_FILE } from '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O75/src/lib/data/helpers/hub-names.ts';
import { engineDir, loadConfig, textCatalog } from '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O75/src/lib/data/sources/config.ts';
import * as board from '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O75/src/lib/state/boards/board/index.ts';
import { setCatalog } from '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O75/src/lib/state/shared/words/text.ts';
import { setVocab, vocabOf } from '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O75/src/lib/state/shared/words/tones.ts';
import { NO_FEEDS, fixtureProject } from '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O75/tests/fixtures/entities-fixture.ts';
import { it, plantScratch } from '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O75/tests/fixtures/scratch.ts';

const { config: CONFIG } = loadConfig(engineDir());
setCatalog(textCatalog(CONFIG));
const say = (name: string, value: unknown): void => console.log(`${name}: ${JSON.stringify(value)}`);

const venues = { v1: { id: 'v1', name: 'Journal A', short: 'JA' } };
function snap(projects: Project[]): Snapshot {
    return {
        version: 1,
        entities: {
            projects: Object.fromEntries(projects.map((one) => [one.id, one])),
            venues, pillars: {}, domains: {}, funding: {}, people: {},
            organisations: {}, resources: {}, collections: {}, datasets: {}, feeds: NO_FEEDS, career: null
        },
        relations: { projectRelated: [], projectVenue: [] },
        findings: []
    } as unknown as Snapshot;
}
const projects = [
    fixtureProject({ id: 'a', title: 'a', folder: 'a', file: 'a/project.yml', tier: 'research', stage: 'published', form: 'journal', venueId: 'v1' }),
    fixtureProject({ id: 'b', title: 'b', folder: 'b', file: 'b/project.yml', tier: 'research', stage: 'exploring', venueId: 'v1' })
];

/** Each group's tone on the Archive board, read under the words installed and the config given. */
function tones(config: Record<string, unknown>): [string, string][] {
    const preset = board.presetFor('archive', config, vocabOf);
    const its = board.boardItems(snap(projects), preset);
    const groups = board.filterGroups(board.facets(its, preset), {}, preset, false);
    return groups.map((one) => [one.id, one.tone]);
}

/** The words of a hub planted with `body` as its hub file, installed as the only hub. */
function hubConfig(body: string): Record<string, unknown> {
    const hub = plantScratch('oculus-o75-r1-', { [HUB_FILE]: body });
    const loaded = loadConfig(engineDir(), { hub });
    say('  hub findings', loaded.findings.map((one) => one.message));
    setVocab({
        primary: 'h',
        lists: { h: { words: loaded.config, domains: {}, venue_themes: [], data_themes: [], collections: [] } },
        order: ['h'],
        own: CONFIG
    } as unknown as HubVocabs);
    return loaded.config;
}

describe('O75 round 1, item 2', () => {
    it("oculus's own values", () => {
        setVocab({ primary: null, lists: {}, order: [], own: CONFIG } as unknown as HubVocabs);
        say('facet_tones of the config', CONFIG.facet_tones);
        say('group tones', tones(CONFIG));
    });
    it('a hub setting facet_tones: { form: teal }', () => {
        const config = hubConfig('facet_tones:\n  form: teal\n');
        say('group tones', tones(config));
    });
    it('a hub setting facet_tones: { form: roze }', () => {
        const config = hubConfig('facet_tones:\n  form: roze\n');
        say('group tones', tones(config));
    });
});
```

Its output is quoted under item 2.

## What the look on landing should see, round 1

Added to the first build's list:

- **A pillar in its group list.** Before: the More list's Pillar section listed a pillar by its key ("pl"). After: by its title ("Blue line"), as the card draws it; funding schemes and datasets read by their titles the same way.
- **The other boards' list columns** (`config/defaults/layout.yml`):
  - Supervision, Coauthor and Archive. Before: Paper, Authors, Venue, Domain, Pillar, Funding. After: Paper, Stage, Venue, Lane, Next, With.
  - Software. Before: Software, Authors, Venue, Domain, Pillar, Funding. After: Software, Stage, Venue, Lane, Next, With.
  - Personal. Before: Project, Authors, Venue, Status, Focus, Next. After: Project, Stage, Venue, Lane, Next, With.
  - On each of these boards, Domain, Pillar and Funding stay in the Columns menu, unchecked.
- **Sorting in list mode.** Before: one table, and a press on a column heading sorted the whole list. After: a press on a heading sorts the rows of that section's table only; each section has its own headings and sorts on its own.
- **The slice line.** Before: a slice not picked had a grey border with its words in the stage's hue. After: its border is in the stage's hue too; a picked slice is filled as before. Every other chip of the app keeps its grey border.
- **The bar's folding.** It is now done by `FoldRun.svelte` for both lines, with the same arithmetic. The look checks line 1 into More and line 2 into "+n" at 532 px and 1400 px, as case 1 says.

## Verify

`npm run diagrams && npm run test:quick -- --base e0687c50` ran twice in this round.

The first run printed `test:quick: 210.0 s; failed: vitest checks`, one red row in `tests/checks/diagrams/diagrams.test.ts`, a file this step does not change:

```
 FAIL  |unit| tests/checks/diagrams/diagrams.test.ts > the committed diagrams > are named stale, every one at once, when an import and a publish are added
AssertionError: expected [ Array(3) ] to deeply equal [ Array(2) ]
  [
    "lib/server/root/watch/git.ts",
+   "lib/ui/controls/Chip.svelte",
    "lib/ui/html.ts",
  ]
```

I edited a comment in `Chip.svelte` while that run was going. My judgment is that the row counted the file it saw change on disk, which the file's own stale-file check reports. Rerun alone as `npm run test:checks` runs it (`npx vitest run --testTimeout=0 tests/checks/diagrams/diagrams.test.ts`) it printed `Test Files  1 passed (1)`, `Tests  47 passed (47)`. Rerun without `--testTimeout=0`, its two whole-tree rows timed out at 5000 ms, a limit the checks tier does not set.

The second run, after the last change, printed:

```
test:quick: 50 changed file(s), from git since e0687c50
test:quick: 134 test file(s)
ok      ASCII gate (0.5 s)
ok      prettier (0.8 s): All matched files use Prettier code style!
ok      svelte-kit sync (2.0 s)
ok      svelte-check (69.6 s): 1792933897545 COMPLETED 540 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      eslint (76.0 s)
ok      vitest (102.3 s): Duration  94.89s (transform 83.67s, setup 0ms, import 159.50s, tests 186.16s, environment 27.33s)
ok      vitest checks (115.1 s): Duration  107.69s (transform 72.32s, setup 0ms, import 190.74s, tests 188.85s, environment 2ms)
ok      vitest slow (152.9 s): Duration  145.67s (transform 12.21s, setup 0ms, import 83.89s, tests 490.01s, environment 8ms)
test:quick: 155.2 s; every command passed
test:quick: not covered: tests that reach no changed file within the import depth,
```

The other runs:
- `npx vitest run tests/state/boards/board/board-rules.test.ts tests/state/boards/board/hub-facets.test.ts tests/checks/look/contrast.test.ts tests/checks/config/config-folder.test.ts` printed `Test Files  4 passed (4)` and `Tests  169 passed | 2 skipped (171)`. Before the flag-count fix, the same four-file run printed `Tests  1 failed | 168 passed | 2 skipped (171)`, the row quoted at the top; `tests/checks/config/config-folder.test.ts` alone then printed `Tests  28 passed | 2 skipped (30)`.
- `sh utils/folder-check.sh`: exit 0.
- `sh utils/unused-exports.sh` against `.agents/worktrees/O75-base/unused-exports.txt`: the same diff the first build quotes. Every line is a name leaving the list; none is added.
- `LC_ALL=C grep -n '[^ -~<tab>]'` over the seventeen files of this round printed nothing, exit 1. The ASCII gate of test:quick is ok.
- The history-word grep over the comment lines and titles added in this round (`git diff -U0 ... | grep '^+' | grep -i -E "before|used to|no longer|still|always has been|always had|as before|previously|the step adds|after this package lands|\bO[0-9]+\b"`, plus the same words over `FoldRun.svelte`) found:
  - `vocab.yml:4` and `options/catalogs/vocab.yml:4`: "values no longer give", a base sentence about a hub's data, where only `facet_tones` was added.
  - `Chip.svelte`: "before it is pressed", a moment at run time.
  - `FilterBar.svelte`: "controls before them", "before any filter", "before it is first drawn" and "a gap before the next", places and moments at run time.
  - None of them is history. A "still" in my new Chip comment was reworded away.
- Runs of the list in this round: 2. Whole-suite commands: none.

## Files changed in this round, with line counts

- `src/lib/ui/frame/toolbar/FoldRun.svelte`: 126 (new)
- `src/lib/views/boards/projects/FilterBar.svelte`: 199
- `src/lib/views/boards/projects/SliceLine.svelte`: 225
- `src/lib/ui/controls/Chip.svelte`: 280
- `src/lib/ui/display/table/Table.svelte`: 203 (the `stays` doc comment only)
- `src/lib/state/boards/board/filter-menu.ts`: 316
- `src/lib/data/shapes/catalog-files/vocab.ts`: 369
- `src/lib/data/sources/config/merge/in-place.ts`: 288
- `src/lib/data/helpers/hub-names.ts`: 497
- `tests/checks/config/config-folder.test.ts`: 814 (the key list, and the flag count, see the top)
- `tests/state/boards/board/hub-facets.test.ts`: 83
- `config/catalogs/vocab.yml`: 260
- `config/options/catalogs/vocab.yml`: 304
- `config/text/views/boards/projects.yml`: 95
- `docs/templates.md`: 1468
- `docs/data-map.md`: 262
- `docs/HELP.md`: 568
- `docs/diagrams/`, generated by `npm run diagrams` (`git status --short docs/diagrams` lists eight files): `layer-state.dot` 173 and `layer-state.svg` 855, new in this round's list since `FoldRun.svelte` is a new module; `layer-views.dot` 189, `layer-views.svg` 855, `layers.dot` 101, `layers.svg` 556, `writes.dot` 1303, `writes.svg` 4412
- `.scratch/migration/agents/reviews/O75-report.md`: this section

In the scratchpad, never in the worktree: `caserun/caserun.config.mts`, `caserun/after.case.ts`, `caserun/r1-tones.case.ts`, and their outputs `r1-tones.out` and `after-r1.out`.
