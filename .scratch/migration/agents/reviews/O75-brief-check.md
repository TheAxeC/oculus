# Step O75 brief check (on main at 65dec745)

The report of the fresh agent of the `spec` skill's "Steps / The brief check", on `agents/briefs/O75.md`. A page this report cites (the rules file, a standard, a skill's text) is named with its section, never with a line number. A line of code or a hit of a grep keeps its `file:line`. All commands ran from `/Users/axelfaes/workspace/oculus` on main at 65dec745 (`git log --oneline -1`: "65dec745 Launch the builder of step O73"). Nothing was changed.

## 1. Names

- Facets `stage` and `category` removed, `status` heading renamed: `grep -rn "FACETS\|facetValues\|parseBoardState\|cardSections\|filterChips\|InForceChip\|filterLabel\|facetHeading" src tests config docs README.md --exclude=local.yml` printed no hit outside the write paths. The words of the facets, `grep -rn -i "category facet\|stage facet\|status facet" src config docs README.md tests --exclude=local.yml`, outside the paths:
  - `src/lib/data/shapes/boards/categories.ts:4` "The board cards and their sections, the category facet, the rail's count ..." : made false (no category facet).
  - `config/catalogs/vocab.yml:52` "in the order a board's stage facet, the board statistics, the Map and the project form list stages in" : made false twice (no stage facet, no board statistics).
  - `config/catalogs/vocab.yml:214` (categories comment) "A board shows the rows that hold at least one of its projects, in this order: its card sections, its category facet and the counts of its tab" : made false.
  - `docs/HELP.md:523` "A list drawn over the records of several hubs (a board's stage facet, the filters, the legends) ..." : made false. O73 writes `docs/HELP.md:524`, the next line.
  - `tests/state/shared/hub-words.test.ts:80` title "draws each hub's cards in its own stage words and orders and labels the stage facet from the union" (G127's test) : the title becomes false. The row asserts only `stageOrder` and `stageLabel`, so it stays green with a false title.
- `submitReady` and the `submit_ready` flag: `grep -rn "submit_ready\|submit-ready" src config docs README.md tests --exclude=local.yml`. Once `stats()` stops counting it (item 5), `stats.ts:85` is the flag's only reader and it is gone, so the flag has no reader and its descriptions become false:
  - `config/catalogs/vocab.yml:60` "- `submit_ready`: a stage the board statistics count as ready to go out."
  - `src/lib/data/shapes/catalog-files/vocab.ts:118` "submit_ready: flag('A stage the board statistics count as ready to go out.')"
  - `config/options/catalogs/vocab.yml:58` "help: a stage the board statistics count as ready to go out"
  The brief does not say whether the flag is kept with no reader or removed from the vocabulary (a config shape).
- The totals line ("board statistics", "statistics strip", the venue flag): `grep -rn -i "statistics strip\|stats strip\|board statistics\|totals line\|the strip above\|venue_conc_warn" src config docs README.md tests --exclude=local.yml`, outside the paths:
  - `config/catalogs/vocab.yml:91` "a board's statistics strip counts in its blocked number" : made false (now the Situation badge).
  - `src/lib/data/shapes/catalog-files/vocab.ts:143` (same sentence) : made false.
  - `src/lib/data/shapes/catalog-files/vocab.ts:280` and `config/options/catalogs/vocab.yml:18` "in the order the boards, the Map, the board statistics and the form list them" : made false. Line 18 is in O72's write list (`config/options/catalogs/vocab.yml line 18`, O72 brief "Paths this step writes").
  - `config/options/behavior.yml:170` "the board statistics flag the venue" : made false (the Venue button marks it).
- The Authors column: `grep -rn "Authors column" src config docs` outside the paths:
  - `src/lib/state/boards/board/team.ts:4` "The card's tags, the Authors column, the Map's people ..." : made false (the With column).
  - `src/lib/state/boards/board/items.ts:4` "the card's team tags and the Authors column leave out the person ..." : made false.
- Mine only, drawn only where it changes the board: `config/catalogs/vocab.yml:206` "a project board draws the toggle only where one of its projects is one the toggle does not keep" : made false (it is drawn on every board while `self` is named, disabled where it changes nothing).
- `FoldHead.svelte` moved to `views/shared/fold/`: `grep -rln FoldHead src/lib` printed the three Focus users only, all in the paths. The import counts in the generated diagrams change: `docs/diagrams/layer-views.dot:23` `"folder views/boards to folder views/shared" [label="49", ...]` counts the imports from `views/boards` into `views/shared`, and the step adds at least four (three Focus users and the board). `npm run diagrams`, which verify item 1 runs, rewrites `docs/diagrams/layer-views.dot` and `.svg`, and probably `layer-ui.*` because of PickMenu's imports. Neither is in the write list.
- New items in folders that are full. `git ls-files -co --exclude-standard -- <dir>` counted per folder: `src/lib/views/shared: 10`, `src/lib/state/boards/board: 10`, `src/lib/ui/menu: 10`. The brief adds `views/shared/fold/` (11th), `state/boards/board/slices.ts` (11th) and `ui/menu/PickMenu.svelte` (11th). Each breaks the rule of at most ten tracked items per folder, which `utils/folder-check.sh` enforces (spec.md, "What every package obeys"). Each needs a split into folders named for what they hold, and those paths are not in the write list.
- Text keys `board.stats`, `board.stat_*`, `board.expand_all`, `board.collapse`, `board.facet_stage`, `board.facet_category`, `board.filter`, `board.filter_count`, `board.filter_chip`, `board.filter_remove`, `board.filter_tick_glyph`, `board.venue_dist_glyph`: `grep -rn` of each over `src tests config docs README.md --exclude=local.yml` printed hits only in `Stats.svelte`, `Projects.svelte`, `filter-menu.ts` and `config/text/views/boards/projects.yml`, all in the paths. `board.warn_glyph` is also read by `src/lib/views/shared/card/CardDocs.svelte:134`, so it stays.
- Cells `authors`, `status`, `focus`: `grep -rn "status, focus\|authors, venue" ...` printed only `config/options/layout.yml:232` and `config/defaults/layout.yml:226`, both in the paths.
- `stats()`, `BoardStats`, `VenueCount`, `STATS_VENUES`, `VENUE_WARN`, `humanSize`: `grep -rn` printed users only in the paths, plus `ticker.ts:21` (VENUE_WARN) and `CardDocs.svelte:29`, `ProcessTable.svelte:10`, `File.svelte:100` and `submit-job.svelte.ts:17` (humanSize). Those keep working.
- New `BoardState` fields `folded` and `columns`: neither collides with an instance-state field (`src/lib/state/workbench/layout/instance.ts:27-42`: cursor, id, collection, hub, key, session, agent, root, path, label; `reveal` in `storedState`).

Findings:
1. `categories.ts:4`, `vocab.yml:52`, `vocab.yml:214`, `HELP.md:523` and the title at `hub-words.test.ts:80` become false (stage and category facets).
2. `vocab.yml:60`, `vocab.ts:118` and `options/catalogs/vocab.yml:58` become false, and the `submit_ready` flag is left with no reader. The brief must say whether the flag is removed, a vocabulary shape.
3. `vocab.yml:91`, `vocab.ts:143`, `vocab.ts:280`, `options/catalogs/vocab.yml:18` (an O72 line) and `options/behavior.yml:170` become false (board statistics).
4. `team.ts:4` and `items.ts:4` become false (Authors column).
5. `vocab.yml:206` becomes false (Mine only drawn only where it changes the board).
6. `docs/diagrams/layer-views.*` (and likely `layer-ui.*`) are rewritten by `npm run diagrams` and are not in the write list.
7. `views/shared`, `state/boards/board` and `ui/menu` hold ten items each, so the three new items break the folder rule.

Item 11 hands these sentences back "for the orchestrator to widen the paths". They are known now, so they belong in the write list before dispatch.

## 2. The step line

`grep -n "^- \[ \] O75" .scratch/migration/plan.md` gives line 807.

- Bar in at most two lines: items 3 and 7.
- Line 1 (search, stale, "deadline 3", Mine only, the group buttons Form to More): item 3.
- Each group button reads its picks ("Form: journal article +1"): item 3.
- Each group button opens its values with colour dots, counts and a search: item 4.
- Situation red blocked badge: item 5.
- Venue amber mark with the venue in its tip: item 5.
- Line 2 category labels with stage chips, a chip per form under publications and other outputs: items 2 and 7.
- A press on a category name picks all its chips: item 7.
- Only the categories and stages the board holds are drawn: item 2.
- "16 projects" / "5 of 16 shown": item 7.
- Clear all while anything is picked: item 7.
- A picked value filled in its own colour, else in its facet's colour: item 6.
- Form its own group, Status only the chips of `chips`: item 1.
- A Venue group with counts: items 1 and 4.
- Mine only on every board while `self` is named, greyed with the tip: item 3.
- Cards, List and Full titles in the header as now: case 14, no item. Item 8 removes Expand all and Collapse and leaves these.
- Totals line no longer drawn, venue warning over live stages only: item 5.
- Section headings as in Focus, folding, saved per board, sticky: item 8.
- No Expand all / Collapse all button: item 8.
- "the cards no longer opening in place (ruling 352)": no requirement. Item 8 says the opposite: "a card still opens and closes in place by its own control". `plan.md:809` gives the card change to O77 ("on a project board a card no longer opens in place ... after O75"), but O75's line still carries it and the brief does not say the part belongs to O77.
- List view under the same headings, folding: item 9.
- Rows one line high: item 9.
- The stage as a chip in its colour with its words: item 9.
- Columns Project, Stage, Venue, Lane, Next, With: items 9 and 10.
- Header menu to choose columns, saved per board: item 9.
- Columns past the width dropped right to left, no sideways scroll: item 9.

Findings:
1. "the cards no longer opening in place (ruling 352)" has no requirement, and item 8 contradicts it. Either the step line is amended to leave that part to O77, or the brief carries it. The brief does neither.

## 3. Premises

- Step line tags and the 354/352 correction: `sed -n 807p plan.md` ends "(ruling 345) (ruling 354) (ruling 355) (ruling 348) (ruling 350) (ruling 351) (ruling 352) (ruling Steps O75 and O76)". Matches. Ruling 352 (b) (`plan.md:2699`): "the Expand all / Collapse all button of 354 is not drawn". Matches.
- `Projects.svelte` lines: `wc -l` printed 466. Toolbar at `:298-345`, `bulk()` at `:198-200`, `<Stats ...>` at `:370`, sections at `:392-410`, `Table` at `:378-383`, `row()` at `:240-263`, `statusCell` at `:266-280`, `write()` at `:162-164` with `storedState(..., ['expanded', 'more'])` (`cat -n`). Matches.
- `FilterBar.svelte` 114 lines, with Search, one Menu with `filterLabel`, Chips stale and deadline, `{#if mine}`, the in-force chips and Clear all `onwrite({ filters: {} })` (`cat -n`). Matches.
- `FACETS` at `presets.ts:247-261` with the 13 facets and no form or venue facet (`cat -n presets.ts`). Matches. `facetValues` at `state.ts:32-66` gives `status` as `item.chips`, and `items.ts:159` is `chips: project.form === undefined ? project.chips : [project.form, ...project.chips]`. Matches. `CardFacts.svelte:40-56` draws `item.chips` with the form first. Matches.
- `parseBoardState` at `state.ts:140-170`: unknown facet dropped at `:158`, category filtered at `:164-165`. The test is at `board-rules.test.ts:492-501`. Matches.
- `facetHeading` at `filter-menu.ts:43-57`; `projects.yml:23` is `facet_status: Status` and `:46` is `quick_deadline: deadline`; `roles.mine` and `roles.mine_tip` are in `config/text/views/shared/roles.yml`, also read by `Collection.svelte:392-393`. Matches.
- `offersMine` at `state.ts:102-104`. Matches.
- Categories at `vocab.yml:218-225`, stages at `:64-80` with `color`, forms at `:81-87` with none, `item.category` at `items.ts:145` (`grep -n`, `sed`). Matches.
- Stage labels long; `ProjectCard.svelte:354` reads `label={chipLabel(item.project.stage, rootOf(item.project))}`. Matches.
- `stats()` at `stats.ts:72-112` counts over every project. `ticker.ts:170` is `liveProjects = projects.filter(... 'live' ...)`, `:485` is `venueLoad: venueLoad(liveProjects, ...)`, and `venueLoad` spans `:520-541`. `boardStats` at `selectors.svelte.ts:348-350`. Matches. `humanSize` is used by `submit-job.svelte.ts:17` and also by `CardDocs.svelte:29`, `ProcessTable.svelte:10` and `File.svelte:100` (`grep -rn humanSize src`). The brief's list is incomplete; nothing depends on it, since humanSize stays.
- FoldHead and its three users (`grep -rln FoldHead src/lib`). Matches.
- bits-ui pinned at `package.json:83` "2.19.3", `node_modules/bits-ui/package.json` license MIT, author huntabyte; Popover in `Toolbar.svelte:35`, Command in `Palette.svelte:64`. Matches.
- `fit()` in `fit.ts:21`. Matches.
- Pane scroller: `Pane.svelte:89` is `<div class="body" class:flush data-scroll>`. Matches. But `:222` is `overflow-y: auto` of `.viewbar` (the bar's box, `max-height: 50%`), not of `.body`. `.body` has `overflow: auto` at `:237` and `padding: 10px 12px` at `:238`. The conclusion (sticky inside the body) holds, but the cited line is wrong.
- Columns at `layout.yml:227-298` with cells in `config/options/layout.yml:232` (`sed -n`). Matches. `grep -rl "cell:" ~/workspace/research-hub/.oculus --exclude=local.yml` printed nothing (exit 1). Matches.
- `docs/HELP.md:289-295` (`sed -n 284,297p`). Matches.
- G124 and G92 test files (`guarded.md:183-185`, `:287-289`). Matches.
- Line counts (`wc -l`): 466, 114, 191, 168, 170, 424, 149. Matches, but "all under the 880 limit" applies the source-file limit to the two Svelte components. Their limit is 520 (spec.md, "What every package obeys"), and `Projects.svelte` has 54 lines of room.
- `grep -n -i "filter" spec.md` printed nothing. Matches. The worktree `.agents/worktrees/migration-O75` and the base copy `.agents/worktrees/O75-base/` do not exist yet (`ls .agents/worktrees/`: gate, migration-O72, migration-O73, O72-base, O73-base). /spec makes them after the check.
- O72 and O73 in flight (state file `dispatch:` block): matches. Their write lists, from `awk '/^## Paths this step writes/,...' briefs/O72.md briefs/O73.md`, are wider than the brief says. O72 also writes `config/catalogs/vocab.yml lines 101 and 158`, `config/options/catalogs/vocab.yml line 18`, `docs/data-map.md line 199` and `tests/data/sources/config/layers/hub-vocab.test.ts`. O73 also writes `config/schemas/manifest-schema.yml line 86`, `config/options/schemas/manifest-schema.yml line 4` and `docs/templates.md lines 305-310`. "This step writes ... none of their other paths" holds for the brief's list. Widened as finding 3 of Names requires, it reaches `config/options/catalogs/vocab.yml:18`, which is O72's line.
- The verify list (`.agents/plan.yaml` `verification:` names the state file, whose `verify_landing:` is `npm run diagrams && npm run test:quick`). Matches.

Findings:
1. `Pane.svelte:222` is `.viewbar`'s overflow, not `.body`'s. `.body`'s `overflow: auto` is at `:237`.
2. The Svelte files are held to 880 in the brief; their limit is 520.
3. O72's and O73's write lists are given incompletely. O72's `config/options/catalogs/vocab.yml line 18` is a line this step must also make true (Names finding 3), so the two steps share a line.

## 4. Cases and checks

- Case 1: by reading and the look, consistent with spec.md "What every package obeys" (a builder runs no page). It asserts "the bar is two lines at a 532 px pane". Item 7 says line 2 "wraps when it does not fit". On TEST's hub the Projects board holds seven slices (`grep -rh "^stage:" projects | sort | uniq -c`: submitted 14, nascent 18, scoping 7, exploring 7, de-risking 5, revision 2, in-prep 1), so three labels, seven chips and the count line. That is roughly 1000 px (a judgment), which wraps at 532 px into a third line. Case 1 contradicts item 7.
- Case 2: a case-run. Consistent.
- Case 3: a case-run. It says `in-review/submitted` is "worded "submitted"". Item 2 cuts a label at the first " (", and `vocab.yml:72` labels submitted "submitted / under review", which has no " (". The rule gives "submitted / under review". The case contradicts item 2.
- Case 4: a case-run. Consistent.
- Case 5: reading and look. Consistent.
- Case 6: the test plus a case-run. Consistent with the guarded-test rule (spec.md, "What every package obeys").
- Case 7: a run plus the look. Consistent.
- Case 8: consistent.
- Case 9: consistent.
- Case 10: consistent.
- Case 11: "a picked publications slice in pink". Item 6 draws a form slice in its category's colour, and publications is `#db2777` (`vocab.yml:222`), which the palette maps to `c-rose` (`vocab.yml:44`), not pink (`#ec4899` maps to `c-pink`, `vocab.yml:43`). The case contradicts item 6 and the palette.
- Case 12: consistent.
- Case 13: consistent.
- Case 14: consistent.
- Case 15: "the columns Project, Stage, Venue, Lane and Next fit and With is dropped" at 532 px. Item 9's minimums give Project 160 + Stage 90 + Venue 90 + Lane 90 + Next 200 = 630 px, more than 532 less the body's 24 px padding (`Pane.svelte:238`). The rule drops With and then Next, and the case's "a cut Next whole in its tip" then has no Next. The hedge "or as many as fit from the left" lets the case pass whatever is drawn. The case contradicts item 9.
- Case 16: consistent in form. It cannot hold as written; see Implied inputs (G92's fixture).
- Case 17: consistent.
- Item 11 asks the builder to "name in the report" the sentences it makes false outside the paths. That asks the builder to quote places the step does not change, instead of the brief carrying them in its write list (the rules file, "Never take the lazy option": "widen it rather than book").

Findings:
1. Case 1 contradicts item 7 (line 2 wraps at 532 px on TEST's Projects).
2. Case 3 contradicts item 2 ("submitted" against "submitted / under review").
3. Case 11 contradicts item 6 (publications is rose, not pink).
4. Case 15 contradicts item 9's minimum widths and is hedged so that it passes whatever is drawn.
5. Item 11 asks for places outside the step to be named in the report instead of being in the write list.

## 5. The question

"The goal" is O75's line.

- Case 1: by the look; reading alone could pass with wrong fitting. Yes, by reading; the look settles it.
- Case 2: no. A run of `facets` over projects with forms and chips shows the Situation group without forms.
- Case 3: no as a rule check. Its expected words are wrong (section 4).
- Case 4: no.
- Case 5: by the look only.
- Case 6, first part (the G124 row): yes. On the unchanged tree `slice` is not in `FACETS`, so `parseBoardState` drops `{ slice: ['publications/poster'] }` at `state.ts:158` and the row passes there. It "fails on the unchanged tree" only through an import of a missing `slices.ts`. After the change it would pass even if the slice facet were never read. A row that also keeps a slice value the board holds (for example `in-review/submitted` kept, `publications/poster` dropped) could not pass without the slice facet being read.
- Case 6, second part: no. On the unchanged tree `stage: ['nascent']` is kept.
- Case 7: yes for "whatever the filters". A run of `stats()` takes the items it is given, so it passes whether the view hands it the board's items or `shown`. Only the look or the markup decides.
- Case 8: no for the count; the badge is by the look.
- Case 9: no.
- Cases 10 to 15: by reading and the look.
- Case 16: no, given G92 passes after (see Implied inputs).
- Case 17: no.
- Check on the step's line: the brief's verify list (test:quick, the two test files, unused exports, item 11's grep, the prose read) exercises none of the bar, the slices line, the headings or the list. All could pass with none of them built. By spec.md, DOM behaviour is proven at the look on landing. Yes, the verify list could pass without the goal; the look is the proof.
- Item 1: yes for the venue facet. No case or run checks its value (`keyOf(item.venue.id)`), its order (by count, then by name) or a venue two hubs share, and G92 gets no row for it. The form order is not run either.
- Item 2: no for membership and words (cases 3, 4), apart from case 3's error. "A slice keeps its place at 0" is not run: yes.
- Item 3: by the look. The fold of buttons into More by `fit()` is not run: yes.
- Item 4: by the look.
- Item 5: no (cases 7 to 9 runs).
- Item 6: by the look.
- Item 7: by the look. "Clear all leaves the search and the toggles" is not checked: yes.
- Item 8: the `folded` field read by `parseBoardState` has no run: yes.
- Item 9: the `columns` field read and the fit arithmetic have no run (case 15 is hedged): yes.
- Item 10: no (case 17).
- Item 11: no (verify item 5's grep).
- Item 12: yes, as for case 6's first part.

Findings:
1. Item 12 / case 6's first row passes on the unchanged tree apart from an import failure, and after the change whether or not the slice facet is read.
2. Case 7's "whatever the filters" cannot be shown by a run of `stats()`.
3. The venue facet's value, order and two-hub key (item 1) have no check.
4. The read of `folded` and `columns` (items 8 and 9) has no check.

## 6. Implied inputs

This is a code step.

- G92's fixture items (`tests/state/boards/board/hub-facets.test.ts:19-36`) carry no `venue` and a `project` with no `chips` (`project: { id }`). Item 1 makes `facetValues` read `item.project.chips` for status and `item.venue` for venue. `countValues` iterates `facetValues(...)` (`facets.ts:70`), so `facets(ITEMS, PRESET)` throws ("not iterable", or reading `id` of undefined) and G92's three rows go red. The brief allows edits to that file "only where a row reads a facet this step removes", and G92 reads domain, compute and funding. Missing. Expected: the brief allows the fixture to gain `venue: null` and `project.chips: []`, or names how G92 stays green; case 16 then holds.
- `folded` read "like `expanded`" (item 8): `expanded` is read by `recordItemsShape` (`shapes.ts:256-261`, objects `{ hub, key }` with `key` min 1) and written through `storedState`'s `lists`, which maps each item to a record field (`instance.ts:114-123`). Category keys are plain strings, and "other" is the empty key. Built literally, every fold is dropped on read and "other" can never fold. Missing. Expected: `folded` (and `columns`) read as string lists, the empty key kept, and neither passed in `storedState`'s `lists`.
- A picked value with no button to show it. A role value saved while no `self` is named: `facets` skips role (`facets.ts:156`), but `applyFilters` still applies it (`state.ts:87-92`). A picked value no project holds any more: the value list holds only values with a count (`facets.ts:84`). Today `filterChips` exists so that "every value that narrows the board has a chip that takes it out" (`filter-menu.ts:132-138`). Item 7 removes that line, and item 3 draws a button only "per facet that has values". Missing. Expected: such a value still reads on its facet's button (or More) and can be taken out, or a value of a facet not offered is not applied.
- A narrow pane where Situation or Venue folds into More. Item 3 folds the last group buttons into More first, and Venue is the last, so at narrow widths Venue's amber mark (and at narrower widths Situation's red badge) is inside More and not on line 1. Missing. Expected: More carries the mark and the badge of the facets it holds.
- A board whose `cards:` says `grid` (offered by `config/options/layout.yml:239-242`, read by `presets.ts:342-344`). Items 8 and 9 head "each section" and draw the list "under the same headings as the cards". A grid board has no sections. Missing. Expected: whether a grid board's card view and list are headed, and whether `folded` applies.
- A pillar with its own `color` (`Pillar.color` at `model-entities.ts:583`; the pillars schema has a `color` field, and the hub writes none today: `grep -c "color:" .oculus/data/pillars/pillars.yml` printed 0). Ruling 348 (a) (state file closed item 348) names "a stage's, a category's, a pillar's, a domain's" own colour. Item 6 names slices and domains only, so a coloured pillar would be drawn in More's cyan. `BoardTag` carries no colour, and `items.ts` is not in the write list. Missing. Expected: a picked pillar with a `color` filled in it.
- A project in no category with no stage (the schema requires a stage, `config/schemas/manifest-schema.yml:35`; none on the hub, `grep -rL "^stage:" projects` printed nothing). Item 2 gives it the value `"/"` with empty words. Missing, low cost. Expected: a named slice (for example "no stage") or no slice, stated.
- A saved `columns` list naming no cell of the board, or empty. Missing. Expected: unknown cells dropped, Project always shown.
- The deadline count at zero ("deadline 0", or "deadline"). Missing. Expected: stated.
- A venue with no registry short name. Item 1 says the label is "the key where it has none", but `item.venue.short` falls back to the venue's full name (`items.ts:135-136`), and the board item carries no registry short field. Expected: one rule, stated.
- The facet tone keys `facet_<key>_tone` (item 6). The keys gate (`tests/checks/source/keys.test.ts`) accepts only literal reads or a registered computed prefix (`COMPUTED_PREFIXES`, `:200`), and `filter-menu.ts:40-42` writes its headings as literals for that reason. A computed read needs `keys.test.ts`, which is not in the write list. Expected: the brief says the tone keys are read as literals.
- Section headings at `top: 0` beside `Table`'s own sticky header (`stays`, `Table.svelte:27`). With one table per section, each table draws its header row. Missing, low cost. Expected: whether each section's table draws a header row, and whether it stays.

Findings:
1. G92's fixture breaks under item 1, and the brief forbids the edit that fixes it.
2. `folded` "like `expanded`" drops every fold and the empty key.
3. A picked value with no button (role without `self`, a value no project holds).
4. The mark and badge are lost when Venue or Situation fold into More.
5. Grid boards.
6. A pillar's own colour (ruling 348 (a)).
7. A project with no stage.
8. A saved `columns` naming nothing.
9. Deadline 0.
10. The venue label rule.
11. The literal reads of the tone keys.
12. The table header beside the sticky heading.

## 7. ADRs

- `ls docs/adr` printed "ls: docs/adr: No such file or directory". The configuration block names no `adr` folder. No record.

Findings: none.

## 8. Dictated text

`LC_ALL=C grep -n '[^ -~]' briefs/O75.md` printed nothing: the brief is ASCII. Each line was found with `grep -n -F "<words>" .scratch/migration/agents/briefs/O75.md`.

- "Every project here is yours" (lines 37, 61): holds.
- "deadline 3" (lines 37, 58): holds.
- "Form: journal article +1", "<Facet>: <first picked value's words>" and " +<n>" (line 37): holds.
- More reads "More" and the count of its picks (line 37): holds.
- "Situation" (line 35): holds.
- Form and Venue headings (line 35): holds.
- "2 blocked" (lines 39, 59): holds.
- "BSPC: 5 live projects, the warning is 4", clauses joined by "; " (line 39): holds.
- "16 projects", "1 project", "5 of 16 shown" (lines 41, 58, 124): holds.
- "with " and the team line, as "with Liesbet Peeters" (line 43): holds.
- The Columns menu label "Columns" (line 43): holds.
- The column headings Project, Paper, Software, Stage, Venue, Lane, Next, With (line 44): holds.
- The tone names "Form pink, Situation purple, Role blue, Year slate, Domain teal, Venue amber, ... cyan" (line 40): holds. Each of `c-pink`, `c-purple`, `c-blue`, `c-slate`, `c-teal`, `c-amber` and `c-cyan` is in the palette (`vocab.yml:10-50`) and in `src/lib/themes/tokens.css`.
- The describe title 'a saved slice filter' (lines 46, 48): holds (no history words).
- The "other" section words (lines 36, 42): an existing key, holds.

Findings: none.

## Declined to judge

- Whether G124's text and Code line (`guarded.md:183-185`, Code naming `presets.ts`, `items.ts` and `new-project.ts`, not `state.ts` or `slices.ts`) cover the replaced row on the saved slice filter, or whether that is a new entry needing Axel's word. That is the orchestrator's call on the ledger.
- Whether "saved per board" (rulings 354, 355) is met by per-instance state (`BoardState` is "per view instance", `presets.ts:180`), as the board's other saved controls are. That is a reading of the ruling.
- Whether the venue facet should key venues by registry key (item 1) while the warning counts them by name (`stats.ts:90`, `venueLoad` `ticker.ts:525`), which can differ for a journal two hubs catalogue under two keys. This is a design choice; no such pair exists on the hub as far as was checked (not verified).
- Whether `FoldHead` in `views/shared/` should keep reading the `focus.fold` and `focus.unfold` keys of the Focus catalog group. Rules allow it; it is a naming choice.
- Whether O74, which waits on open item 357 and rewrites `CareerPanel.svelte`, merges simply with this step's import change there. O74 is not in flight.
- Whether tone names in a text catalog (decision 8) fit "colours from themes/tokens.css" (spec.md, "What every package obeys"). The brief records it as a reversible decision.

Agent usage: a695ad7391dc25a0a, claude-opus-5-5, 263818 tokens, 80 tool uses, 11 min 11 s.

## Closed

- Names 1, 3, 4, 5 and Cases 5 (sentences the step makes false outside its paths): raised to Axel as open item 364 (1), since widening the paths is his under ruling Brief check scope; ruled (a): item 11 says how each place is made true and the paths hold each line.
- Names 2 (the `submit_ready` flag left with no reader): raised to Axel as open item 364 (2); ruled (a): item 5 removes the flag, the paths hold its lines, case 21 checks a hub that writes it.
- Implied 6 (a picked pillar in its own colour, ruling 348 (a), needs `items.ts`): raised to Axel as open item 364 (3); ruled (a): item 6 gives `BoardTag` an optional `color` filled in `items.ts`, case 22.
- Names 6 (the diagrams `npm run diagrams` rewrites): `docs/diagrams/` is in the paths as generated output, no hand edit.
- Names 7 (three full folders): the slices go into `facets.ts`, PickMenu into `src/lib/views/boards/projects/`, FoldHead into `src/lib/views/shared/card/`; "What is on the tree", items 2, 4 and 8, the paths and decision 9 say so.
- Step line 1 (the cards no longer opening in place): premise corrected in `plan.md`, the words taken out of O75's line since O77's line carries them; "What is on the tree" records it.
- Premises 1 (`Pane.svelte` line), 2 (the 520-line limit), 3 (O72's and O73's paths): corrected in "What is on the tree"; O72 and O73 land before O75's base is taken.
- Cases 1 (line 2 wraps): open item 365, closed under automode as Z1001, line 2 folds its slices into a "+<n>" list; item 7 and case 1 say so.
- Cases 2 (case 3's words): case 3 now expects "submitted / under review".
- Cases 3 (case 11's pink): case 11 now expects rose (`#db2777`, `c-rose`).
- Cases 4 (case 15's widths and hedge): case 15 now gives the arithmetic and the exact columns at 532 px and 1400 px.
- Cases 5 (item 11 asks for a report instead of the paths): item 11 and the paths line now wait on open item 364.
- Question 1 (the G124 row passes without the slice facet): item 12's row keeps one slice the board holds and drops one it does not.
- Question 2 (case 7 by a run of `stats()`): case 7 checks by reading the markup that the view hands `stats()` the board's items.
- Question 3 (the venue facet unchecked): new case 18.
- Question 4 (`folded` and `columns` read unchecked): new case 19.
- Implied 1 (G92's fixture): item 12 and the paths allow the fixture items `venue: null` and `project.chips: []`, no assertion changed.
- Implied 2 (`folded` like `expanded`): items 8 and 9 read both as lists of strings, the empty key kept, not passed in `storedState`'s `lists`; case 19.
- Implied 3 (a picked value with no button): open item 366, closed under automode as Z1002; item 3 and case 20.
- Implied 4 (badge and mark in More): open item 367, closed under automode as Z1003; item 3.
- Implied 5 (grid boards): open item 368, closed under automode as Z1004; item 8.
- Implied 7 (a project with no stage): item 2, in no slice and shown only while no slice is picked.
- Implied 8 (a saved `columns` naming nothing): item 9.
- Implied 9 (deadline 0): open item 369, closed under automode as Z1005; item 3.
- Implied 10 (the venue label): item 1 reads `item.venue.short`, the venue's name where it has none.
- Implied 11 (the tone keys): item 6 reads each by a whole literal key.
- Implied 12 (the table header under the sticky heading): open item 370, closed under automode as Z1006; item 9.
- Declined 1 (G124's Code line): the landing rewrites G124's text and Code line to name the slice filter and `facets.ts`.
- Declined 2 to 6: no change; "saved per board" is the board's instance state as the board's other saved controls are.
