# Step O69 brief check (on main at aa79b883)

The report of the fresh agent of the `spec` skill's "Steps / The brief check", on `agents/briefs/O69.md`. A page this report cites (the rules file, a standard, a skill's text) is named with its section, never with a line number, since a page's lines move and a section's name does not. A line of code or a hit of a grep keeps its `file:line`.

The report is written in the rules file's character set. A character outside it in a quoted line is written by its name in angle brackets, such as `<tab>` or `<em dash>`.

Read on main at aa79b883 (`git log --oneline -1`: "aa79b883 Land O60: ...") plus the uncommitted ledger (`git status --short`: plan.md, orchestrator-state.md, queue.md, choices.md modified; briefs/O69.md untracked). I changed no file.

`plan.md` has no `## Goal` section: `grep -n '^## ' plan.md` lists only "Steps, in execution order", "Could run in parallel", "Rulings", "Agents" and "Blocked, and by what". I took the goal from the brief prompt: a project board's bar reworked as ruling 320 (a) says. The step line is `plan.md:791`. Its Step 0 lines are `:792-793`. Ruling 320 is at `:2659`, Z994 at `:2658` and the state file's Closed item 320 at `orchestrator-state.md:189`. The step line and the ruling match the brief's line 11.

## 1. Names

Command: `grep -rn -- "<name>" src tests config docs README.md --exclude=local.yml`, run for each of hiddenStages, stageCounts, StageCount, QuickFilters, ModeSwitch, toggleStage, stage_toggle_tip, board.labels, board.view, board.view_cards, board.view_list, view_cards_glyph, view_list_glyph, helper.short, helper.full, FACETS, facets(, filterGroups, applyFilters, filterLabel, filtersInForce, facetHeading and valueLabel. A second grep for the words that describe the bar: `grep -rn -i "stage button|stage toggle|stage chip|Mine only|title length|Short/Full|Cards/List|cards or a table|Aa toggle|toggle overrides" ...`.

1. **Two glyph text keys are left with no reader.** `config/text/views/boards/projects.yml:69` `view_cards_glyph: cards` and `:71` `view_list_glyph: list` are read only by `src/lib/views/shared/card/ModeSwitch.svelte:19-20`, which the step deletes. Item 6 gives the new buttons "glyph `cards`" and "glyph `list`", which reads as the glyph names written directly. Item 6 removes `board.view`, `board.labels`, `project.helper.short` and `project.helper.full`, but not these two keys. Unless the new ToolButtons read `t('board.view_cards_glyph')` and `t('board.view_list_glyph')`, both keys become orphans, and `tests/checks/source/keys.test.ts:560` ("has a reader for every catalog key") fails. Verify item 4's grep does not name them. The file is in the write list, so a clarifying sentence in item 6 is enough.
2. **Two config sentences name the title-length control by a word it will not carry.** `config/defaults/layout.yml:226` and `config/options/layout.yml:236` both say "The board's Aa toggle overrides it for the viewer". `options/layout.yml:236` is the Settings help text a user reads. The step moves this control to the header and names it Full titles. Neither file is in the write list, and item 8 does not name them. Fixing them widens the step's paths, so under the standing demand "A brief check never widens a step" this goes to Axel as an open item.
3. `src/lib/state/boards/board/stats.ts:1` (head comment: "Board statistics, waiting lines, stage counts, sizes ...") becomes false once `stageCounts` is removed. The file is in the write list, but item 8 does not name this comment.
4. `src/lib/state/boards/board/presets.ts:236` ("The quick filters and stage toggles applyFilters is given beside the facets.") becomes false. It is in the write list, but item 8 names only the `BoardState` doc comments, not `QuickFilters`.
5. `src/lib/ui/controls/Chip.svelte:13-14` ("Given an `onclick` it is a toggle with `aria-pressed` ...") has to describe the new remove control. It is in the write list, but item 8 does not name it.
6. **The generated diagrams change and are not in the write list.** `docs/diagrams/layer-views.dot` and `layer-views.svg` count imports between folders: `layer-views.dot:23` has "folder views/boards to folder views/shared" label "49". Deleting the `ModeSwitch` import (`Projects.svelte:70`) and adding `FilterBar.svelte` change these counts, and `npm run diagrams` runs before the verify list (`spec.md:25`). In my judgment these files will change; which ones exactly is not verified. Like item 2, this widens the paths.
7. **G92's test fixture cannot take a stage facet.** These test calls change only if a signature changes, and the write list allows exactly that: `facets(` at `tests/state/boards/board/hub-facets.test.ts:42` and `board-rules.test.ts:254`, `:269`; `applyFilters` at `hub-facets.test.ts:49` and `board-rules.test.ts:248-249`, `:499`. But the fixture `PRESET = { categories: [], roles: [] }` at `hub-facets.test.ts:38` has no `stageOrder`. If the stage facet's ordering reads `preset.stageOrder` inside `facets`, G92's test throws a TypeError. The write list allows that file only "where a signature it calls changes", which does not cover the fixture.
8. `src/lib/state/client/selectors.svelte.ts:180` ("only then is a Mine only toggle ... drawn") stays true, since a `self` remains a necessary condition. `src/lib/data/shapes/boards/roles.ts:122`, `:153`, `:174`, `:180` are about collections and stay true. `docs/HELP.md:208` and `README.md:35` ("as cards or a list") stay true.
9. Hits that share a name but are separate code, and are unaffected: `src/lib/state/boards/structure/graph.ts:320,375,376` (its own `stageCounts`), `graph.ts:7` and `src/lib/views/structure/map/Legend.svelte:11` (the Map's stage chips), and `src/lib/views/sessions/session-list/session-list.ts:96` (its own `filterGroups`).

Every other hit is inside the write list.

## 2. The step line

Each part of the step line (`plan.md:791`) and of ruling 320 (a) maps to an item of "What to build":

- The stage as a facet of the one Filter menu, drawn with its label: item 1, with item 2 removing the stage chips.
- Each facet's counts taken over the projects the other filters leave: item 3.
- The values in force as removable chips under the bar, with Clear all: item 4.
- Mine only drawn only where it can change what is shown: item 5.
- Cards/List and Short/Full moved to the pane's toolbar beside Expand all and Collapse: item 6. Short/Full becomes one Full titles toggle, stated as decision 5.

No part of the step line is left without a requirement. Items 7 and 8 serve the rules file, not the step line.

## 3. Premises

1. **ModeSwitch's line count is off by one.** Brief line 14 says 28 lines; `wc -l src/lib/views/shared/card/ModeSwitch.svelte` prints `29`.
2. **Several line references are a few lines off.**
   - The bar snippet: the brief says `:333-391`, but `{#snippet bar()}` runs from `:333` to `{/snippet}` at `:388`. Line 390 is `<Pane ...>`.
   - The Mine only chip: the brief says `:363-370`, but the block is `{#if named}` to `{/if}` at `:364-371`.
   - The head comment of `Projects.svelte`: the brief says `:33-55`, but it runs from `:32` to `:53`.
   - `Pane.svelte`: the brief says `:7-12`, but the sentence it quotes ("It holds icon actions only ... go in the bar") is at `:10-13`.
3. **"No other step is in flight" is false.** Brief line 27 says the dispatch block holds O69 alone. `sed -n 20,60p orchestrator-state.md` prints a dispatch block with three steps: O69 (brief_check "running: a22fb5ba62b399f71"), O70 (brief_check "running: a702302861796c9d4") and O71 (landing: preparing). O70's brief (`briefs/O70.md`, its "Paths this step writes") shares these paths with O69:
   - `config/catalogs/icons.yml`
   - `config/catalogs/glyphs.yml`
   - `config/text/views/boards/project.yml`
   - `src/lib/state/boards/board/presets.ts` (O70 lines 97-101; O69 the whole file)
   - `docs/HELP.md` (O70 line 287; O69 lines 290 and 518)

   No `shared_paths:` judgment is recorded for them (`grep -n shared_paths orchestrator-state.md` prints nothing).
4. **The state folder has no room for a new file.** `src/lib/state/boards/board/` already holds 10 items (`ls | wc -l`: 10: facets.ts, filter-menu.ts, index.ts, items.ts, new-project.ts, presets.ts, state.ts, stats.ts, team.ts, ticker-lines.ts). The write list's line "one new file, when item 3 or item 5 needs its own" would make 11. `utils/folder-check.sh:40-41` refuses a folder over ten, and `spec.md:48` then requires the folder to be split, which widens the step. Item 3's other condition ("when `facets.ts` would pass its limit") cannot arise, since `facets.ts` is 174 lines of 880. Both the counting and the Mine only rule have room in the existing files.
5. Every other fact holds, each by `wc -l`, `sed -n` or `grep -n`:
   - Line counts: `Projects.svelte` 497, `facets.ts` 174, `filter-menu.ts` 130, `state.ts` 126, `Chip.svelte` 197.
   - Line references: `stageCounts` at `stats.ts:125-139`, exported at `index.ts:52`, read at `Projects.svelte:126`; `labelModes` `:155-158`; `toggleStage` `:195-202`; the stage chips `:372-379`; `ModeSwitch` `:380`; `tools` `:305-331`.
   - `presets.ts`: `hiddenStages` at `:199` and `:242`, `FACETS` at `:251-264` with no stage, `BoardItem.mine` at `:144`.
   - `tones.ts`: `chipLabel` at `:311`, `vocabOf` at `:185`.
   - `facets.ts`: values with a count of 0 are dropped (`:101`, `has`), except that every role is listed (`:104`).
   - `ToolButton.svelte:52-53` (`iconOnly`, `tip`).
   - `grep -rln "onremove\|removable" src/lib/ui` prints nothing.
   - The glyph rows: `glyphs.yml:31-33,101,197`; `icons.yml:30-32,196`. `ls node_modules/lucide-static/icons/whole-word.svg` finds the file.
   - The text keys: `projects.yml:24-27,28,65,67-71`; `project.yml:118`, `:121`.
   - `docs/HELP.md:290`, `:518` and `config/catalogs/vocab.yml:52` say what the brief quotes.
   - G124's row is at `board-rules.test.ts:246-250`.
   - `npx vitest run tests/state/boards/board/hub-facets.test.ts tests/state/boards/board/board-rules.test.ts` prints "Test Files 2 passed (2) / Tests 84 passed (84)" on the unchanged tree.

## 4. Cases and checks

1. **Verify item 7 cites a rule the standards page lacks.** It asks for a read "against the standards pages' rules on list items and sentence length". `spec.md` has no sentence-length rule: `grep -n -i "sentence\|short bullet\|list item" spec.md` finds only `:45` (rewrap at 100 columns) and `:71` ("as short bullets").
2. **No state function holds the chips line.** Brief line 57 has cases 1 to 6 checked by a run of the state functions. But case 4 (the chips, their order and their words) and case 6's "the chip reads `Stage: retired-stage`" depend on the list of values in force, in menu order and pick order, with their labels. The brief names no state function for that list, so if it is built in `FilterBar.svelte`, no state run reaches those parts of cases 4 and 6. `spec.md:90` says "a reader-visible behaviour is state, not a DOM side effect". Item 4 should name the function, in `filter-menu.ts`.
3. **Case 11's wording is imprecise.** It says "the first hub in the workspace's order", where Z977 (`plan.md:2641`) says "the primary first, then the others in the workspace's order". It comes to the same thing, because `hubVocabs` puts the primary first (`src/lib/data/index.ts:672-690`).
4. **Case 5 is consistent with `spec.md:43` (no migration code).** `boardStateShape` is a plain `z.object` (`state.ts:76`), which drops any field it does not name, and no code names the old field. The next write stores `{ ...held, ...next }` (`Projects.svelte:161`), so `hiddenStages` is gone after it.
5. **Verify item 4's grep does not cover the YAML keys item 6 removes.** It finds none of `labels:` (`projects.yml:28`), `view:` (`:67`), `short:` and `full:` (`project.yml:118,121`). It also omits `toggleStage`, `StageCount` and the two `*_glyph` keys. The orphan-key row of `keys.test.ts` inside `npm run test:quick` covers the YAML keys in effect, but the grep the brief offers does not show it.
6. **Adding the bar's text as a new bullet in `docs/HELP.md` is outside the write list.** `spec.md:71` asks for "short bullets", but the write list allows `docs/HELP.md` "line 290" and "line 518" only.
7. No case asks the builder to check, quote or explain a place the step does not change.

## 5. The question

- **The step line's check:** the step line names none, and the look at landing is its proof. Verify items 1 to 7 are hygiene checks (tests, unused exports, a grep, line counts). All of them could pass without the bar being reworked, so whether the goal is reached rests on the case runs and the look.
- **Case 1:** cannot pass without the stage facet: it needs the Stage group, with labels, in stage order.
- **Case 2:** checks that a facet's own pick does not narrow its counts and that another facet's pick does. It can pass while search, stale, deadline and Mine only are left out of the counting, so the counts would still not say what a pick will show. No case covers those four inputs (Implied inputs 1).
- **Case 3:** cannot pass without counts taken under the other filters.
- **Case 4:** cannot pass at the look without the chips and Clear all. Its state part has no named function (Cases and checks 2).
- **Case 5:** cannot pass while `hiddenStages` stays in the shape.
- **Case 6:** cannot pass without a chip for a stored value the board no longer offers.
- **Case 7:** G124's row tests `applyFilters` with `mine`, not item 5's rule. It passes today and would pass with item 5 unbuilt; only the extra run the brief asks for proves the rule.
- **Case 8:** describes today's behaviour and passes with nothing built. It is a regression check only.
- **Case 9:** is proved only at the look. It cannot pass there without the header buttons.
- **Case 10:** **can pass without the goal.** `hub-facets.test.ts` calls `facets` only (`:42`). If item 3's counting is a new function the view calls, G92's test no longer touches the counts the menu draws, and two hubs' values could be counted wrongly while the test stays green. G92's Code line (`agents/guarded.md:288`) names `facets`, `facetValues` and `applyFilters` and no counting function.
- **Cases 11 and 12:** cannot pass without the stage facet's label and value rules.
- **Case 13:** is proved only at the look.
- **Item 1:** proved by cases 1, 11 and 12.
- **Item 2:** proved by verify item 4 and case 5. They cannot pass with the chips left in place.
- **Item 3:** cases 2 and 3 do not prove that search, stale, deadline and Mine only feed the counts (see case 2).
- **Item 4:** proved by cases 4, 6 and 13 at the look.
- **Item 5:** proved by case 7 and the run the brief asks for.
- **Item 6:** proved by case 9 at the look and the `ModeSwitch` grep.
- **Item 7:** proved by `wc -l`.
- **Item 8:** **can pass while sentences stay false.** Verify item 7 reads only the changed sentences, so `layout.yml:226`, `options/layout.yml:236` and the `stats.ts:1` head comment can stay false and still pass.

## 6. Implied inputs

1. **A search, stale, deadline or Mine only in force.** Expected: each facet's counts drop by the projects it removes. On case 1's board, a search matching 2 of the 4 `in-prep` projects reads `in preparation 2`. Mine only counts only while drawn: on a board where item 5 does not draw it, a saved `mine: true` leaves the counts unchanged. No case covers this.
2. **A board with no projects.** Expected: no Stage group, no chips line, no Mine only chip (`items.some` is false), the header's buttons drawn, and `board.empty`.
3. **A saved `role` filter on a workspace that names no `self`.** `applyFilters` still applies `role` (`state.ts:49-53`) while the Role facet is not offered (`facets.ts:140`), so the board is empty with no menu row to undo it. Expected: a chip "<Role heading>: <role label>" is drawn and its remove control brings the projects back. This is the same kind of input as case 6.
4. **A stage word a hub also lists under `chips` or `forms`.** `chipLabel` reads the legend, where "a word of a later list taking the place of one of an earlier list" applies (`tones.ts:118-120`), so the Stage value would carry the chip's label. Expected: the `stages` row's label. oculus's own `vocab.yml` has no such overlap (a Python set intersection printed empty sets), so this arises only through a hub.
5. **A Chip given both `onclick` and `onremove`.** `Chip.svelte` draws a `<button>` for a chip with `onclick` (`:71-80`), so a remove button inside it would be a button nested in a button. Expected: never nested. Either the remove control is drawn only on a chip that is no toggle, or the two are drawn as siblings. The brief does not say which.
6. **A press on Cards or List while that mode is already in force.** The button is `aria-pressed` true. Expected: nothing changes and it stays pressed. The brief does not say.
7. **A project whose stage is the empty string.** `stageCounts` skips `''` (`stats.ts:129`). Item 1's "or none for a project with no stage" can be read as the `NONE` value (`'__none__'`, `presets.ts:26`), which the year, funding and compute facets list as a menu row. Expected, per case 12: no value at all (`[]`), with `''` treated as no stage.
8. **The free facets' order.** Domain, pillar, funding and dataset are sorted by count (`facets.ts:125-126`). Expected: they are still sorted by the whole board's counts, so the menu does not reflow (decision 2). No case covers it.
9. **The `cards: grid` boards and the list mode.** Expected: the same header buttons; Cards pressed draws the grid, List pressed draws the table. Case 9 covers list mode on the sections layout only.

## 7. ADRs

1. None apply. `ls docs/adr` printed "ls: docs/adr: No such file or directory", as the brief's line 5 says.

## 8. Dictated text

`grep -n 'board.facet_stage\|board.filter_remove\|board.filter_clear\|board.full_titles\|full_titles: \|<facet heading>: <value label>\|Remove <facet heading>' O69.md` finds brief lines 32, 35 and 37. `LC_ALL=C grep -n '[^ -~]' O69.md` prints nothing.

1. `board.facet_stage` "Stage" (brief :32): holds.
2. `board.filter_remove` "Remove {0}" (brief :35): holds.
3. `board.filter_clear` "Clear all" (brief :35): holds.
4. `board.full_titles` "Full titles" (brief :37): holds.
5. `icons.yml` `full_titles: whole-word` (brief :37): holds. The svg exists, and the name `full_titles` is not taken in either catalog.
6. `glyphs.yml` `full_titles: "Aa"` (brief :37): holds. It is printable ASCII, and stand-ins need not be unique (a Python count of the values finds 20 shared by two or more names, `[c]` among them).
7. **The chip label `<facet heading>: <value label>` (brief :35) breaks `spec.md:50`.** The ": " is text a reader sees, and the brief gives it no catalog key. The tree writes this shape as a key, `'{0}: {1}'` (`config/text/app.yml:317`, `config/text/views/system/history.yml:92`, `config/text/views/sessions/terminal.yml:87`). As the brief stands, the builder either hard-codes the colon (a defect) or adds a key the brief does not name (a silent decision).
8. `Remove <facet heading>: <value label>` (brief :35): holds once item 7's key exists, since it is "Remove {0}" filled with the chip label.
9. `docs/HELP.md:518` "a board's stage buttons" becomes "the stage facet" (brief :39): holds.

## Declined to judge

- Whether two `aria-pressed` buttons for Cards and List in the header fit `Pane.svelte:10-13` ("a segment ... go in the bar"). Ruling 320 (a) puts them in the header, and decision 5 records the form chosen. It is a design point, not a premise.
- Which `docs/diagrams` files change and by how much: I did not run `npm run diagrams`, which writes files.
- The first run of the cases: that is the builder's task. I ran only the two guarded test files above.
- Whether the header's overflow popover keeps the pressed state. I read `Toolbar.svelte` only far enough to see that clipped controls move into a popover (`:190`, `:222`).

Agent usage: a22fb5ba62b399f71, claude-opus-5-5, 208122 tokens, 56 tool uses, 8 min 58 s.

## Closed (the session's change to the brief for every finding above, and each dictated line added after the check, made before the preparation commit)

- Names 1: item 6 has the buttons take the glyph names `cards` and `list` as the prop and removes `board.view_cards_glyph` and `board.view_list_glyph` with the other keys; verify item 4's grep names both.
- Names 2: the step line is about this control, so the sentences it makes false are inside the step; the write list gains `config/defaults/layout.yml` line 226 and `config/options/layout.yml` line 236, item 8 names both, and "What is on the tree" quotes them. No open item: the path list is widened, not the step.
- Names 3, 4 and 5: item 8 names the head comments `stats.ts:1`, `presets.ts:236` (`QuickFilters`) and `Chip.svelte:13-14`; "What is on the tree" quotes them.
- Names 6: the write list gains `docs/diagrams/` files `npm run diagrams` regenerates, and verify item 1 is `npm run diagrams && npm run test:quick`.
- Names 7: item 3 has the fixture of `hub-facets.test.ts:38` gain `stageOrder: []`, and the write list names that line.
- Premises 1 and 2: the line count reads 29 and the references read `:333-388`, `:364-371`, `:32-53` and `Pane.svelte:10-13` throughout.
- Premises 3: "What is on the tree" names O70 and O71 in flight and each file shared with them, the lines each step writes and that the generated diagrams are regenerated at each landing; the dispatch entry records `shared_paths:`.
- Premises 4: the line allowing a new file in `src/lib/state/boards/board/` is removed; the counting is in `facets` (item 3) and the Mine only rule in `state.ts` (item 5); "What is on the tree" states the folder's ten files.
- Cases and checks 1: verify item 7 reads against `spec.md:45` and `:71`, the rules the page holds.
- Cases and checks 2: item 4 has the chips list, its order and its words a function of `filter-menu.ts`, read by the view.
- Cases and checks 3: case 11 says the primary hub first, then the others in the workspace's order.
- Cases and checks 5: verify item 4's grep names `StageCount`, `toggleStage`, both `*_glyph` keys and "Aa toggle", and names the removed YAML keys with the orphan-key row of `keys.test.ts` that checks them.
- Cases and checks 6: the write list allows the bullets item 8 places right after `docs/HELP.md:290`.
- The question, case 2 and item 3: case 14 covers search, stale, deadline and a drawn Mine only feeding the counts.
- The question, case 10: item 3 has the counting done by `facets` itself through an optional argument, so G92's test runs the function the menu draws, and case 10 adds a run with another facet's value in force.
- The question, item 8: closed with Names 2 to 5, which name every sentence the grep found false.
- Implied 1: case 14. Implied 2: case 15. Implied 3: item 4 (a chip for a stored value of a facet the menu does not offer), decision 9 and case 16. Implied 4: item 1 reads a stage's label from its `stages` row through a new `stageLabel` in `tones.ts` (on the write list), decision 10 and case 17. Implied 5: item 4 draws the remove control only on a chip with no `onclick`, decision 8. Implied 6: item 6 and case 19. Implied 7: item 1 gives no value for `stage: ''` and no `none` row, case 12. Implied 8: item 3 and case 18. Implied 9: item 6 and case 19.
- Dictated text 7: item 4 names the key `board.filter_chip` ("{0}: {1}").
- `board.filter_chip` "{0}: {1}", added after the check: holds; ASCII, the shape `config/text/app.yml:317` already uses, a key of `config/text/` as `spec.md:50` asks.
