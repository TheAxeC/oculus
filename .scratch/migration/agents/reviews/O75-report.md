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
