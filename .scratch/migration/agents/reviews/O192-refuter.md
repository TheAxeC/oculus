# Step O192 refuter report (on /Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O192, base 7b57cb7f5)

A page this report cites (the rules file, a standard, a skill's text) is named with its section, never with a line number, since a page's lines move and a section's name does not. A finding in code keeps its `file:line`.

The report is written in the rules file's character set. A character outside it in a quoted line is written by its name in angle brackets, such as `<tab>` or `<em dash>`.

## Verification (rerun by the reviewer)

Every command was run from the worktree root, in the foreground, at background priority (`taskpolicy -b nice -n 19`), vitest with `TMPDIR` and `GIT_CEILING_DIRECTORIES` set to `.agents/scratch`. The reviewer's `.agents/scratch/` folder (vitest's compile cache and the unused-exports listing) was removed after the runs: `ls .agents` prints `plan.yaml`. The rerun of `npm run diagrams` rewrote the six diagram files with the content they held: `git diff 7b57cb7f5 --stat -- docs/diagrams` printed the same `6 files changed, 8 insertions(+), 8 deletions(-)` before and after it, and `git status --short` lists the same paths.

```
$ npm run diagrams
> node utils/diagrams/diagrams.mjs
docs/diagrams/layers.dot ... (18 paths listed, layers through writes.svg)
diagrams exit=0
$ git diff 7b57cb7f5 --stat -- docs/diagrams
 docs/diagrams/layer-state.dot | 2 +-
 docs/diagrams/layer-state.svg | 2 +-
 docs/diagrams/layer-views.dot | 2 +-
 docs/diagrams/layer-views.svg | 2 +-
 docs/diagrams/layers.dot      | 4 ++--
 docs/diagrams/layers.svg      | 4 ++--
 6 files changed, 8 insertions(+), 8 deletions(-)

$ npx vitest run tests/state/boards/board/exclude.test.ts tests/state/boards/board/hub-facets.test.ts tests/state/boards/board/board-rules.test.ts tests/state/boards/board/board-views.test.ts tests/checks/source/keys.test.ts tests/checks/source/history.test.ts tests/checks/source/comment-width.test.ts tests/checks/tree/size.test.ts tests/checks/tree/boundaries.test.ts --maxWorkers 2 --testTimeout 0 --reporter dot
 Test Files  9 passed (9)
      Tests  183 passed (183)

$ npx prettier --check config/catalogs/glyphs.yml config/catalogs/icons.yml config/text/views/boards/projects.yml docs/HELP.md src/lib/state/boards/board/facets.ts src/lib/state/boards/board/filter-menu.ts src/lib/state/boards/board/index.ts src/lib/state/boards/board/presets.ts src/lib/state/boards/board/state.ts src/lib/state/boards/collection/bar.ts src/lib/state/boards/collection/index.ts src/lib/state/boards/structure/graph.ts src/lib/state/boards/structure/map-bar.ts src/lib/state/life/present.ts src/lib/ui/controls/Chip.svelte src/lib/views/boards/collection/Collection.svelte src/lib/views/shared/forms/bar/BoardBar.svelte src/lib/views/shared/forms/bar/FilterBar.svelte src/lib/views/shared/forms/bar/PickMenu.svelte src/lib/views/shared/forms/bar/SliceLine.svelte src/lib/views/structure/map/Map.svelte tests/state/boards/board/exclude.test.ts
Checking formatting...
All matched files use Prettier code style!
prettier exit=0
(A first form that passed the list through an unquoted zsh variable printed "[error] No files matching the pattern were found: ..." for the list as one word; that is the shell, not the files.)

$ npx eslint <the 18 changed .ts and .svelte files above>
eslint exit=0   (no output)

$ npm run check
1795636346821 COMPLETED 4688 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS

$ printf '%s\0' <the 22 changed source, config, doc and test files, the 6 diagram files and the report> | xargs -0 env LC_ALL=C perl -ne 'print "$ARGV:$.\n" if /[^\x20-\x7E\n]/; close ARGV if eof'
ascii exit=0   (no output)

$ python3 -c "import yaml,sys;[yaml.safe_load(open(f)) for f in sys.argv[1:]]" config/catalogs/glyphs.yml config/catalogs/icons.yml config/text/views/boards/projects.yml
yaml exit=0

$ npx svelte-kit sync; sh utils/unused-exports.sh > .agents/scratch/unused-now.txt; diff /Users/axelfaes/workspace/oculus/.agents/worktrees/O192-unused-base.txt .agents/scratch/unused-now.txt
exit=0
diff exit=0
     336 .agents/scratch/unused-now.txt
     336 /Users/axelfaes/workspace/oculus/.agents/worktrees/O192-unused-base.txt

$ wc -l <changed source files>
     386 src/lib/state/boards/board/facets.ts
     477 src/lib/state/boards/board/filter-menu.ts
      90 src/lib/state/boards/board/index.ts
     734 src/lib/state/boards/board/presets.ts
     392 src/lib/state/boards/board/state.ts
     596 src/lib/state/boards/collection/bar.ts
     787 src/lib/state/boards/collection/index.ts
     430 src/lib/state/boards/structure/graph.ts
     273 src/lib/state/boards/structure/map-bar.ts
     804 src/lib/state/life/present.ts
     320 src/lib/ui/controls/Chip.svelte
     468 src/lib/views/boards/collection/Collection.svelte
     111 src/lib/views/shared/forms/bar/BoardBar.svelte
     238 src/lib/views/shared/forms/bar/FilterBar.svelte
     459 src/lib/views/shared/forms/bar/PickMenu.svelte
     285 src/lib/views/shared/forms/bar/SliceLine.svelte
     288 src/lib/views/structure/map/Map.svelte
     506 tests/state/boards/board/exclude.test.ts

Commands the builder's report quotes as evidence, rerun:

$ npx vitest run tests/state/boards/board/exclude.test.ts tests/state/boards/board/hub-facets.test.ts --maxWorkers 2 --testTimeout 0 --reporter verbose
 <check mark> |unit| tests/state/boards/board/hub-facets.test.ts > the group lists on a workspace of two hubs > lists a value both hubs name once, counted over both 6ms
 <check mark> |unit| tests/state/boards/board/hub-facets.test.ts > the group lists on a workspace of two hubs > keeps both hubs' projects under a filter on that value 1ms
 <check mark> |unit| tests/state/boards/board/hub-facets.test.ts > the group lists on a workspace of two hubs > counts that value over both hubs' projects another facet's value leaves 36ms
 Test Files  2 passed (2)
      Tests  39 passed (39)
$ git diff 7b57cb7f5 --stat -- tests/state/boards/board/hub-facets.test.ts
(no output: G92's test is unchanged)

$ cd .agents/worktrees && diff -rq --exclude=node_modules --exclude=.svelte-kit --exclude=.agents --exclude=.git O192-base migration-O192
(28 lines: the 27 modified paths of `git status --short`, "Only in migration-O192/tests/state/boards/board: exclude.test.ts", and "Only in migration-O192/.scratch/migration/agents/reviews: O192-report.md"; the same set as the report's files table)

$ grep -rn "withPicks" src tests docs README.md; grep -rn --exclude=local.yml "withPicks" config
grep exit=1   (no output)

$ grep -n "G151" .scratch/migration/agents/guarded.md   (main checkout)
411:- G151. A period is read as EDTF level 0 ...
451:- G151. An excluded filter value hides every project that carries it, ...

$ grep -n "article" config/catalogs/vocab.yml
83:  journal:     { label: "journal article", icon: journals }

$ ls docs/adr
ls: docs/adr: No such file or directory
```

The case-run program (`.agents/scratch/cases.case.ts` and `cases.config.ts`) was removed by the builder, as spec.md asks. Its quoted output for cases 1 to 22 was not rerun; every case the G151 tables hold was rerun through those tables (above), and the rest (cases 6, 9, 10's other units, 11, 14, 22's Map half) are judged below by reading the code.

## Verdicts

Items of the brief's "What to build", in its numbering:

- 1: holds. `facetKeeps` (`src/lib/state/boards/board/state.ts:105-112`) is the one rule; `applyFilters` (state.ts:137-138), `meets` (collection/bar.ts:243-253), `stageKeeps` (map-bar.ts:119-130, terminal rule kept: line 129 returns `lists.included.length > 0 || stage === undefined || !terminal(...)`) and `sliceKeepsCard` (bar.ts:549-550) all call it. A record with no value passes the exclude test (`values.some` over an empty list is false). The G151 rows pass.
- 2: holds. `applyFilters` takes `excluded` as a fifth optional argument and `InForce` an optional `excluded`; `hub-facets.test.ts` is unchanged and passes.
- 3: holds. `BoardState.excluded` (presets.ts:228-233), read by `readPicks` under the rules of `filters` and then `withoutExcluded` (state.ts:282-283); `CollectionState` and `MapState` read it with `z.record(...).catch({})` and `withoutExcluded` (collection/index.ts:164,181-183; graph.ts:387,424-426); `PresentBar` and `barFields` carry it (present.ts:91-94,129-132). No reader of an older form.
- 4: holds for every writer the brief lists (BoardBar, Collection, Map, SliceLine through `withPick`, `withExclude`, `withCategory`, `noPicks`; the Present bar through `barFields({ ...filter.held, ...next })`). A writer the brief does not list is left on the include-only form: Spec, finding 1.
- 5: holds. `facets`' `left` drops both of the facet's lists (facets.ts:303-316); `boardFilter` and `mapBar` pass `excluded` through `appliedFilters`; `leftBy` and the Map's Stage counts (`stageGroup(items, others, ...)`, `others` with `excluded`) follow.
- 6: holds. `FilterChoice.excluded` is set by `choicesOf`, `groupOf`, `stageGroup`, `sliceChoices` and `showGroup` (always `false`); `filterGroups` and `withGone` list both lists' values no project holds at 0; the `NONE`-only group is drawn while `NONE` is in either list (filter-menu.ts:217-223).
- 7: holds. `groupWords` (filter-menu.ts:325-336), `picksOf` counts both lists; SliceLine's `picking` and `foldedPicks` count both (SliceLine.svelte:111-113,131).
- 8: holds by reading; the DOM half is the look's. The minus `ToolButton` is drawn only under `{#if onexclude !== undefined}`; its click calls `event.stopPropagation()` before `onexclude` (PickMenu.svelte:133-137). Shift+Enter: `onkeydown={shiftEnter}` on `Command.Root` calls `preventDefault()`; bits-ui's root merges the caller's props first (`mergeProps(restProps, rootState.props)`, `node_modules/bits-ui/dist/bits/command/components/command.svelte:120`) and svelte-toolbelt's `composeHandlers` returns before the next handler once `e.defaultPrevented` is set (`node_modules/svelte-toolbelt/dist/utils/compose-handlers.js:11-12`), so bits-ui's Enter case (command.svelte.js:928-940, `item?.click()`) does not run. The item's `data-selected` attribute the CSS reads exists (`"data-selected": boolToEmptyStrOrUndef(this.isSelected)`, command.svelte.js:1200). The Map's Show menu passes no `onexclude` (Map.svelte:220). `onexclude` is required in FilterBar and SliceLine Props.
- 9: holds by reading, with the keyboard half not verifiable here (Declined to judge). `pressSlice` reads `event.altKey`; `Chip.svelte` gains `excluded`, `aria-pressed={excluded ? false : pressed}`, the red line and the struck words; SliceLine titles an excluded chip `Stop excluding <value>`; the category head passes `event.altKey` to `withCategory`; `onfilters` hands back both maps.
- 10: holds for the places the brief names (project boards, Present view by reading `parsePresentState` and `acts/filter.svelte.ts:191`, the Map with `excludedPillars` in `context` for both `buildGraph` and `showGroup`, a collection's own groups and Projects section, the No funding card). The record board's count buttons are not reached: Spec, finding 1. A Projects-section exclude also hides cards that hold no project: Behaviour, finding 1.
- 11: holds. glyphs.yml:72 `exclude: "-"`, icons.yml:71 `exclude: minus`, each beside `check`.
- 12: holds. The five keys, word for word, in the `board` block of projects.yml (lines 29-31 and 50-51), each read by a literal `t('board....')`; `keys.test.ts` passes.
- 13: holds for what the item lists: the two HELP.md bullets are the ruled text word for word, lines 372 and 417 are rewritten and stay true, and every head comment the item names is rewritten. Two head comments outside the item's list are made false: Standards, finding 1.
- 14: holds. `tests/state/boards/board/exclude.test.ts` holds one table per unit of G151's Code line, its titles free of history (`history.test.ts` passes; my grep of the file for the history words prints nothing); the report quotes the unchanged-tree run (31 failed, 5 passed of 36) with failure messages. The two rows that test the Role and Hub drop do not reach the wiring: Proof, finding 1.

Cases of the brief's "Cases":

- 1: met, G151 row "an include and an exclude of one facet keep what carries the one and not the other", rerun passing.
- 2: met, row "an exclude alone keeps every project not carrying it".
- 3: met, row "an exclude of the value for none keeps the projects with a value".
- 4: met, row "an exclude of one of several values hides a project carrying it among others".
- 5: met, the Role and Hub rows of the board table and the report's quoted `boardFilter` run (`case 5 named true: ["c8","c2"]`, `case 5 one hub: {"shown":["c8","c1"],"excluded":{"hub":["lab"]}}`); see Proof, finding 1.
- 6: met, by reading `facets` (facets.ts:296-316: `left(facet)` drops the facet's key from both maps) and the report's quoted run (`case 6 status: [["paused",1],["__none__",1]]`, `case 6 form: [["article",1],["chapter",1]]`); not rerun.
- 7: met, the three `parseBoardState` rows, rerun passing.
- 8: met, the press rows, rerun passing.
- 9: met, by reading `groupWords` (`single`, `more = picksOf(group) - (single ? 1 : 2)`) and the report's quoted run (`Situation: blocked, not paused +2`, `More 4`).
- 10: met, by reading `filterGroups`, `withGone`, `categoryGroup`, `projectGroups`, `stageGroup` and `sliceChoices`, the Map table's row "an excluded stage no project is at is listed at 0", the Hub row of the collection table, and the report's quoted run.
- 11: met, by reading `parsePresentState` (present.ts:143, `barFields(parseBoardState(value))`), `barFields`, `boardFilter` and SliceLine's Clear all (`onfilters(noPicks())`, which BoardBar writes through the Present `write`).
- 12: met, the collection table's five rows for it, rerun passing.
- 13: met, the Map stage table, rerun passing.
- 14: met, by reading `showGroup` (`drawnOf` builds the graph over `context`, which holds `excludedPillars`) and Map.svelte:126-145,220, and the report's quoted run (`["pillars",1,false]`).
- 15: met, the graph table's row "drops the pillar nodes of an excluded key of every hub".
- 16: met, row "a value saved in both lists of a facet hides the projects carrying it".
- 17: met, `hub-facets.test.ts` unchanged and passing, and row "an exclude of a value both hubs share hides the projects of both hubs".
- 18: met, the three category rows.
- 19: met, row "drops an excluded compute value no facet offers and a slice no board holds".
- 20: met, the `withExclude` rows for the press, and the reading of bits-ui and svelte-toolbelt under item 8 for the row press not running; the key itself is the look's.
- 21: met, row "a Hub exclude hides the entries of that hub and lists both hubs".
- 22: met, the collection rows through `parseCollectionState` for its half, and the reading of `parseMapState` (graph.ts:420-429) for the Map's.
- 23: not verifiable here; it is the look at landing (the views and states the brief's case names).

## 1. Spec

- `src/lib/state/boards/record-board.ts:267-279`: "export function pressedState(saved: unknown, slices: readonly string[]): Record<string, unknown> { return { ...(isMap(saved) ? saved : {}), search: '', filters: slices.length === 0 ? {} : { slice: [...slices] }, stale: false, ... }"; what is wrong: a press on a record page's count button sets the record board's whole filter state by spreading the saved state and resetting `filters`, the search and the toggles, and it now keeps a saved `excluded` map, since the change added that map to `BoardState` and no one resets it here. The brief's writer list under "What is on the tree" does not name this writer (a premise the reviewer's grep does not reproduce: `grep -rnE "\bfilters\s*:" src` finds `src/lib/state/boards/record-board.ts:271`), and spec.md's "What every package obeys" asks that after a change of shape every hit be carried or named; the report names neither. The fix is one line (`excluded: {}`) in a file outside the write list, which the report should have named before writing it; failure scenario: a person's record board is open, the reader excludes the slice `publications/journal` on line 2 (or Situation `paused`); back on the person's page they press "3 publications", whose slices include `publications/journal`; `pressedState` writes `filters: { slice: [..., 'publications/journal'] }` and keeps `excluded: { slice: ['publications/journal'] }`; `parseBoardState` reads the value saved in both lists as excluded (state.ts:282-283), so the board shows fewer projects than the button counted, none of that slice's; with `paused` excluded it hides the paused projects the button counted; verdict: item 10 holds for the places it names, and this is a project board it leaves on the include-only reset.
- `.agents/scratch/cases.case.ts` (removed), report section "The case program": "one inline `python3` program changed `.agents/scratch/cases.case.ts` ... The `python3 -c` textwrap commands of the build only printed rewrapped comment paragraphs"; what is wrong: the case-run program itself is the kind spec.md's "What every package obeys" allows; the inline `python3` program that edited it is a script under the same rule ("an inline `python3` ... that changes a file is a script, needs that approval"), and the brief says "No script is written for this step ... other than a script the step builds", with no Rulings line approving one; the printing `python3 -c` textwrap programs are other scripts the brief does not approve. The report names them, so nothing is hidden, and no file of the diff was touched by them; failure scenario: the case program's source as quoted is the reviewer's only copy, and an edit made outside Edit leaves no record of its exact change, so the reviewer reruns a reconstruction on the builder's word for that edit; verdict: none.

## 2. Proof

- `tests/state/boards/board/exclude.test.ts:133-151`: "excluded: appliedFilters({ role: ['lead'] }, false)" ... "excluded: appliedFilters({ hub: ['lab'] }, true, [])"; what is wrong: the two rows that hold "a saved Role or Hub exclude narrows nothing while its group is not drawn" call `appliedFilters` (unchanged code) in the test and hand its result to `applyFilters`, so the lines the step wrote for that guarantee, `const excluded = appliedFilters(held.excluded, named, hubs)` (`src/lib/state/boards/board/filter-menu.ts:294`) and `appliedFilters(input.excluded, input.named, input.hubs)` (`src/lib/state/boards/structure/map-bar.ts:177`), are held by no test; both rows pass on the unchanged tree (the report's first run marks them passed). The brief's case 5 wording names `appliedFilters`, and the report's quoted case run does reach `boardFilter`, so the case is met; the finding is that the kept test does not hold the wiring; failure scenario: a later edit writes `const excluded = held.excluded` in `boardFilter`; G151's tables stay green, and a Role exclude saved while a user was marked hides every Lead project once the user mark is removed, with no Role group drawn to take it out; verdict: none (case 5 met).

## 3. Standards

- `src/lib/state/boards/record-board.ts:21-24` and `:261-266`, `src/lib/views/shared/card/record/RecordCounts.svelte:9-13`: "A press sets the tab's whole board state (`pressedState`): the slices it picks, no search, no other facet or toggle ... so the board shows exactly the projects the button counts" and "each press setting the tab's whole board state so the board shows exactly the projects the button counts"; what is wrong: spec.md's "What every package obeys" (a sentence in a head comment the change makes false is a defect of the change) and the brief's item 13: with a saved `excluded` kept, these sentences are false; the report's head-comment table does not list either file; failure scenario: a maintainer reads that a press resets every facet and trusts the count button, and the board disagrees with it as Spec finding 1 shows; verdict: none (item 13's list does not name these files).
- Report, section "Judgment calls the brief left open": "`FilterPicks` for the pair of maps (the name `Picks` is taken by ...)"; what is wrong: spec.md's "The principles every package is judged on" asks that the grep for a new helper's or type's name be quoted, and "What every package obeys" asks that a key the step introduces (the saved `excluded` key of four states) be checked empty, duplicated and colliding with the report stating what the code does in each case; the report quotes neither; by reading, `excluded` collides with no key of `BoardState`, `CollectionState`, `MapState` or `PresentState`, and an empty or wrong-typed value reads as `{}`; failure scenario: none at run time; the reader of the report cannot see the check was made; verdict: none.
- `src/lib/views/shared/forms/bar/PickMenu.svelte:392-399`: ".unseen { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }"; what is wrong: the same visually hidden block is now in three components (`src/lib/ui/forms/choice/select/FieldSelect.svelte:101-108`, `src/lib/views/academic/present/parts/project/Facts.svelte` near line 201, and here), against spec.md's principle that a rule exists once and is reused; a judgment that a shared `ui/` primitive or class would serve; failure scenario: a change to how screen-reader-only text is hidden reaches two of the three copies; verdict: none.

## 4. Behaviour

- `src/lib/state/boards/collection/bar.ts:490-493`: "const picking = itemRules.some((rule) => hasPicks(lists(rule.id))); ... entryPasses(entry, but) && (!picking || stripOf(entry).some(narrows))"; what is wrong: on the base (`bar.ts:459`) `picking` was true only while a project group had an include; it is now true for an exclude alone, so an exclude in the Projects section hides every card whose strip holds no project at all, though such a card carries none of the excluded value; item 1's rule says a record with no value is never hidden by an exclude, and the report's before/after line ("hides a card whose strip it leaves empty") does not state this case; failure scenario: on the Funding view, with many schemes that name no project, the reader excludes Form `article` in the Projects section; every scheme with no project disappears from the page beside the ones whose strips held only articles; verdict: none (case 12 met as written); whether a card with no strip should stay while only excludes are in force is a decision for the orchestrator to put to Axel or to rule under item 1.
- `src/lib/views/shared/forms/bar/PickMenu.svelte:125-130` with `src/lib/views/structure/map/Map.svelte:220`: "if (event.key !== 'Enter' || !event.shiftKey || event.isComposing) return; event.preventDefault(); ... if (row !== undefined) onexclude?.(row[0], row[1]);"; what is wrong: in the Map's Show menu Shift+Enter toggled the keyboard's row before (bits-ui's Enter clicks the selected item with Shift held or not), and now does nothing; in every other list Shift+Enter was the row press and is now the "not" press. The brief asks for both, and the report states the second, but its Show menu line ("the same, with no minus button and no Shift+Enter exclude") does not give the before and after of the first; failure scenario: a reader who toggled Pillars with Shift+Enter sees nothing happen; verdict: none.

## Declined to judge

- Whether Alt+Enter and Alt+Space on a focused slice chip reach `pressSlice` with `altKey` set. No browser is run here. A judgment from reading: the HTML specification's synthetic click sets its modifier keys from the key input device, and Chromium copies them from the key event, so Alt+Enter is likely to work; on macOS, Option+Space reports a key other than a plain space (the no-break space), and whether Chromium then activates the button at all is not known from here. The look at landing settles it.
- Case 23 and every drawn property (the red row and chip in each theme, the hover and keyboard-row visibility of the minus button, the tooltip, focus after a click on the minus button, what a screen reader announces for an option holding a button): the look at landing settles them.
- Rerunning the removed case-run program: the reviewer changes no file and wrote no copy of it; the cases it alone covers were judged by reading, as named per case above.
- The duplicate id G151 in `.scratch/migration/agents/guarded.md` (lines 411 and 451, quoted above): a ledger file, the orchestrator's to renumber; the builder's report names it correctly.
- The other three items of the report's "Anything in the brief that was wrong or impossible" were checked and hold: item 14 and case 22 differ in how case 22 is checked and both forms were done; the first HELP bullet, as ruled, does not say that a click on an included value turns it off; `article` is not a word of the shipped vocab (`config/catalogs/vocab.yml:83`, quoted above).
- That the diagram files after the rerun are byte-identical to the builder's: `git diff --stat` and `git status --short` are unchanged; a byte comparison would need the builder's copies, which `git show` does not hold for uncommitted work.

Reviewer usage: a383043f4b1ec814a, claude-opus-5-5, 276208 tokens, 76 tool uses, 1119 s.

## Repair round 1, refuted

```
All commands were run from the worktree root (/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O192) at background priority. Vitest and `npm run check` ran with TMPDIR and GIT_CEILING_DIRECTORIES set to .agents/scratch/tmp, which was removed afterwards: `ls -A .agents/scratch` prints nothing, and `git status --short | wc -l` prints 38, as before the runs.

$ npm run diagrams
NOT RERUN: the permission classifier refused it ("Destructive or Unwanted Actions"), since it rewrites tracked files and this review changes nothing.
$ git diff 7b57cb7f5 --stat -- docs/diagrams
 docs/diagrams/layer-state.dot | 2 +-
 docs/diagrams/layer-state.svg | 2 +-
 docs/diagrams/layer-ui.dot    | 2 +-
 docs/diagrams/layer-ui.svg    | 2 +-
 docs/diagrams/layer-views.dot | 4 ++--
 docs/diagrams/layer-views.svg | 4 ++--
 docs/diagrams/layers.dot      | 4 ++--
 docs/diagrams/layers.svg      | 4 ++--
 8 files changed, 12 insertions(+), 12 deletions(-)
(Read against the delta: "folder ui/forms to folder ui/display" 5 -> 6 is FieldSelect's import of Unseen; "views/academic to layer ui" 66 -> 67 is Facts'; "views/shared to layer ui" 262 -> 263 is PickMenu's; "views to ui" 1108 -> 1110 is the two view imports.)

$ npx vitest run tests/state/boards/board/exclude.test.ts tests/state/boards/board/hub-facets.test.ts tests/state/boards/board/board-rules.test.ts tests/state/boards/board/board-views.test.ts tests/checks/source/keys.test.ts tests/checks/source/history.test.ts tests/checks/source/comment-width.test.ts tests/checks/tree/size.test.ts tests/checks/tree/boundaries.test.ts --maxWorkers 2 --testTimeout 0 --reporter dot
 Test Files  9 passed (9)
      Tests  188 passed (188)

$ npx vitest run tests/state/boards/board/exclude.test.ts tests/state/boards/board/hub-facets.test.ts --maxWorkers 2 --testTimeout 0 --reporter verbose
(the reporter's tick is written v, its ellipsis <horizontal ellipsis>)
 v |unit| tests/state/boards/board/hub-facets.test.ts > the group lists on a workspace of two hubs > lists a value both hubs name once, counted over both 10ms
 v |unit| tests/state/boards/board/hub-facets.test.ts > the group lists on a workspace of two hubs > keeps both hubs' projects under a filter on that value 1ms
 v |unit| tests/state/boards/board/hub-facets.test.ts > the group lists on a workspace of two hubs > counts that value over both hubs' projects another facet's value leaves 57ms
 v ... > the board's filter with excluded values > 'an include and an exclude of one face<horizontal ellipsis>' 7ms
 v ... > the board's filter with excluded values > 'an exclude alone keeps every project <horizontal ellipsis>' 1ms
 v ... > the board's filter with excluded values > 'an exclude of the value for none keep<horizontal ellipsis>' 0ms
 v ... > the board's filter with excluded values > 'an exclude of one of several values h<horizontal ellipsis>' 1ms
 v ... > the board's filter with excluded values > 'a value saved in both lists of a face<horizontal ellipsis>' 0ms
 v ... > the board's filter with excluded values > 'an exclude of a value both hubs share<horizontal ellipsis>' 0ms
 v ... > a saved Role or Hub exclude through the bars > 'a Role exclude with no user marked hi<horizontal ellipsis>' 12ms
 v ... > a saved Role or Hub exclude through the bars > 'a Role exclude with a user marked hid<horizontal ellipsis>' 4ms
 v ... > a saved Role or Hub exclude through the bars > 'a Hub exclude on a workspace of one h<horizontal ellipsis>' 3ms
 v ... > a saved board state with excluded values > (4 rows)
 v ... > the presses on a filter value > (10 rows)
 v ... > a collection's rule with excluded values > 'a field exclude hides the entries car<horizontal ellipsis>' ... 'a Projects-section exclude narrows ea<horizontal ellipsis>'
 v ... > a collection's rule with excluded values > 'a Projects-section exclude alone keep<horizontal ellipsis>' 2ms
 v ... > a collection's rule with excluded values > 'a Projects-section include hides a ca<horizontal ellipsis>' 2ms
 v ... > a collection's rule with excluded values > 'a Projects-section exclude alone keep<horizontal ellipsis>' 2ms
 v ... > a collection's rule with excluded values > 'a Projects-section include hides the <horizontal ellipsis>' 2ms
 v ... > a collection's rule with excluded values > 'a Hub exclude hides the entries of th<horizontal ellipsis>', 'excluded values of the wrong type are<horizontal ellipsis>', 'a value saved in both lists is read a<horizontal ellipsis>'
 v ... > the Map's stage rule with excluded stages > (3 rows)
 v ... > the Map's graph with excluded pillars > (2 rows)
 v ... > a press on a record page's count button > 'takes out every excluded value and in<horizontal ellipsis>' 1ms
 Test Files  2 passed (2)
      Tests  44 passed (44)
(The "..." and "(n rows)" above shorten the reviewer's own quote of passing rows. Every row printed v. 44 = 41 rows of exclude.test.ts + 3 of hub-facets.test.ts.)

$ git diff 7b57cb7f5 --stat -- tests/state/boards/board/hub-facets.test.ts
(no output)

$ npx prettier --check <27 files: the three YAML files, docs/HELP.md, the 22 changed .ts/.svelte files under src including Unseen.svelte, exclude.test.ts>
Checking formatting...
All matched files use Prettier code style!
prettier exit=0
$ npx eslint <the 23 changed .ts and .svelte files>
eslint exit=0   (no output)

$ npm run check
1795639530936 COMPLETED 4689 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS

$ printf '%s\0' <36 paths: git status --short without the round brief and the first review> | xargs -0 env LC_ALL=C perl -ne 'print "$ARGV:$.\n" if /[^\x20-\x7E\n]/; close ARGV if eof'
ascii exit=0   (no output)

$ python3 -c "import yaml,sys;[yaml.safe_load(open(f)) for f in sys.argv[1:]]" config/catalogs/glyphs.yml config/catalogs/icons.yml config/text/views/boards/projects.yml
yaml exit=0

$ npx svelte-kit sync; sh utils/unused-exports.sh | diff /Users/axelfaes/workspace/oculus/.agents/worktrees/O192-unused-base.txt -
sync exit=0
diff exit=0   (no output; 336 lines each)

$ wc -l <changed src and tests files>
 386 facets.ts | 477 filter-menu.ts | 90 board/index.ts | 734 presets.ts | 392 state.ts | 606 collection/bar.ts | 787 collection/index.ts | 280 record-board.ts | 430 graph.ts | 273 map-bar.ts | 804 present.ts | 320 Chip.svelte | 114 FieldSelect.svelte | 242 Facts.svelte | 469 Collection.svelte | 88 RecordCounts.svelte | 111 BoardBar.svelte | 238 FilterBar.svelte | 452 PickMenu.svelte | 285 SliceLine.svelte | 288 Map.svelte | 32 Unseen.svelte | 598 exclude.test.ts
(all under 880 for a source file and 520 for a component)

$ history words over the round's added lines (snapshot diffs, git diff of the four files outside files.txt, Unseen.svelte whole): grep -iE "\bbefore\b|used to|no longer|\bstill\b|always has been|always had|as before|previously|the step adds|after this package|\bO[0-9]+|G15[13]"
history exit=1   (no output)
$ the same added lines, awk 'length > 101' (the diff's + counted)
(no output)

Commands the round's report quotes as evidence, rerun:

$ grep -rn "clip-path: inset(50%)" src
src/lib/ui/display/text/Unseen.svelte:29:        clip-path: inset(50%);
$ grep -rnE "(function|const|let|type|interface|class) <name>\b|^\s+<name>\??:" src tests, per name
facetKeeps: state.ts:105 | facetListsOf: state.ts:300 | noPicks: state.ts:379 | withCategory: state.ts:357 | withExclude: state.ts:343 | withoutExcluded: state.ts:238 | FilterPicks: state.ts:291 plus four import lines | FacetLists: state.ts:297 plus three import lines | excludedPillars: map-bar.ts:202, graph.ts:71, Map.svelte:129 | Unseen: no line (a component file)
(the same lines the report quotes)
$ the same grep for listsOf
src/lib/state/system/config/editors/sources.ts:157:export function listsOf(inputs: ListInputs): Lists {
src/lib/data/snapshot/schema/lists.ts:128:export function listsOf(
src/lib/data/sources/config/settings/reader.ts:77:function listsOf(entry: CatalogEntry, config: Record<string, unknown>): RuleLists {
$ grep -rn "\blistsOf\b" src/lib/state/boards tests/state/boards src/lib/views/shared/forms
listsOf exit=1   (no output; the report says it "prints only lines of this report's first part")
$ grep -rn facetListsOf src tests docs README.md | wc -l
      12
$ grep -rn "Shift+Enter does nothing\|does nothing there" src docs
src/desktop/windows/bridge.ts:236:    // size to change, so the press does nothing there.
$ find src tests -name "Unseen*"; grep -rnw Unseen src tests
src/lib/ui/display/text/Unseen.svelte
(three imports and three uses: FieldSelect.svelte:21,70, PickMenu.svelte:42,182, Facts.svelte:33,132)
$ ls src/lib/ui/display
file-icons.ts FileIcon.svelte Glyph.svelte hues.ts icon-theme meters table text ThumbGrid.svelte ticker   (10 items)
$ grep -c "a press on a record page's count button" tests/state/boards/board/exclude.test.ts
1
$ grep -n "G153" -A2 .scratch/migration/agents/guarded.md   (main checkout)
451:- G153. An excluded filter value hides every project that carries it, ...
452:  Code: `applyFilters`, `parseBoardState` and the press helpers in `src/lib/state/boards/board/state.ts`; `meets` in `src/lib/state/boards/collection/bar.ts`; `stageKeeps` in `src/lib/state/boards/structure/map-bar.ts`; `filterGraph` in `src/lib/state/boards/structure/graph.ts`.
$ grep -n "archival: true" config/catalogs/vocab.yml   (with --exclude=local.yml over config)
282:  - { key: dead-ends, ..., stages: { flags: [dead] }, color: "#9ca3af", archival: true }
```

The round's delta was read in full: `diff -u` of the snapshot against the worktree for the 13 files of files.txt that changed (HELP.md, layer-views and layers diagrams, filter-menu.ts, board/index.ts, state.ts, collection/bar.ts, map-bar.ts, Collection.svelte, PickMenu.svelte, exclude.test.ts), `git diff 7b57cb7f5` for record-board.ts, RecordCounts.svelte, FieldSelect.svelte, Facts.svelte and layer-ui.dot, and Unseen.svelte whole.

### Verdicts

Items of the brief's "What to build", for the whole diff since the base:

- 1: holds. `facetKeeps` (state.ts:105-112) is the one rule; the round's `stripKeeps` (collection/bar.ts:499-500) applies item 1's "a record with no value is never hidden by an exclude" to a card with no project.
- 2: holds; hub-facets.test.ts is unchanged and passes.
- 3: holds (state.ts:204, :282-283; collection/index.ts:165, :182; graph.ts:387, :425-426; present.ts:143, each read).
- 4: holds. The record board's count press, which the brief's writer list did not name, now writes `excluded: {}` (record-board.ts:272).
- 5: holds.
- 6: holds.
- 7: holds.
- 8: holds, with the round's ruling. Item 8 said Shift+Enter "does nothing" in a list without `onexclude`; round item 4 makes it the row press there (PickMenu.svelte:129, `if (onexclude === undefined) return;` before `preventDefault`), and the head comment and the prop doc say so.
- 9: holds by reading; the keyboard half is the look's (see "Declined to judge").
- 10: holds. The record board's count buttons are reached through `pressedState`. A Projects-section exclude alone keeps a card with no project (bar.ts:499-504, :592).
- 11: holds.
- 12: holds; keys.test.ts passes.
- 13: holds. record-board.ts:21-24 and :261-266 and RecordCounts.svelte:10-17 are rewritten and true. The HELP.md:374 sentence keeps the rewritten line 372 true under round item 3. Two head comments are not true: Unseen.svelte:4-5 (Standards 1) and NoFundingCard.svelte:7-8 (Standards 2).
- 14: holds. The Role and Hub rows now go through `boardFilter` and `mapBar`. The ledger's Code line does not name the units the round's tables test: Spec 2.

Cases of the brief's "Cases":

- 1, 2, 3, 4: met. The board table's rows pass on rerun.
- 5: met. Rows "a Role exclude with no user marked hides no project", "a Role exclude with a user marked hides the projects at that role" and "a Hub exclude on a workspace of one hub hides no project" run through `boardFilter(...).shown` and `mapBar(...).kept` and pass. Read: c1 carries `lead` (the named-true row hides it) and the hub `lab` (`rootOf` reads `root`, hub-names.ts:38-39). Without the drop at filter-menu.ts:294 or map-bar.ts:177, each of these rows would fail.
- 6: met, by reading `facets` (unchanged by the round).
- 7: met, the parseBoardState rows.
- 8: met, the press rows.
- 9: met, by reading `groupWords` (unchanged by the round).
- 10: met, by reading. The rename to `facetListsOf` is the only change to these units.
- 11: met, by reading.
- 12: met. The five rows pass, and the article-only card row still hides its card.
- 13: met, the Map stage table.
- 14: met, by reading `showGroup` and Map.svelte. The Show menu still passes no `onexclude`.
- 15: met, the graph table.
- 16: met.
- 17: met. hub-facets.test.ts is unchanged and passing, and the shared-hub row passes.
- 18: met, the three category rows.
- 19: met.
- 20: met, by reading. In a list given `onexclude`, `shiftEnter` cancels the event before bits-ui's Enter (command.svelte.js:928-940, `item?.click()` on any Enter), and the key itself is the look's.
- 21: met.
- 22: met, the collection rows, and graph.ts:420-429 by reading.
- 23: not verifiable here; it is the look at landing.

Items of the round brief:

- 1: holds. record-board.ts:272 writes `excluded: {}`. The three comments are rewritten, whole paragraphs at 100 columns. The table "a press on a record page's count button" (exclude.test.ts:580-598) has one row and passes. Read against the snapshot's `pressedState`, which spread the saved state and kept `excluded`, the quoted start-tree failure (`expected { <horizontal ellipsis>(2) } to deeply equal {}`) is the one that code gives.
- 2: holds. The three rows that called `appliedFilters` are gone, and the test no longer imports `appliedFilters`. The new rows run through both bars, and each passes.
  - The Hub row's start-tree failure, `expected [ 'c1', 'c8' ] to deeply equal [ 'c8', 'lab:c1' ]`, came from its fixture. `project('lab:c1', { ...project('c1'), root: 'lab' })` spreads `id: 'c1'` over the id, as `project` puts `over` last (board-fixture.ts:44-46).
  - The new fixture (exclude.test.ts:156) keeps id `c1` with `root: 'lab'`, and the expectation `['c1', 'c8']` is "every project", which the round brief asks for.
  - The fix is right: the start tree already gave `c1` kept, which shows the drop held there, and the row still fails if the drop is removed, since `c1` carries `lab`.
  - The third, named-true Role row is a row with a different outcome. It keeps the table from passing with no exclude in force, and stays within G153's "one row per input".
- 3: holds.
  - The rule: `including` (bar.ts:493) and `stripKeeps` (:499-500) hide an empty strip only while a project group includes a value. A strip with projects is kept while one of them passes. The No funding card gets the same rule through `stripKeeps(unfunded)` (:592). For a non-empty strip, `!picking || strip.some(narrows)` equals the snapshot's `!picking || unfundedLeft > 0`.
  - The counts: the entry groups and the status slices of entries count over `leftBy`, that is `passes`, that is `stripKeeps` (:502-504), so they count over what the card rule keeps. The Projects section's groups count projects of the cards `entryPasses` keeps (:567), and a card with no project adds none, so they are unchanged. The No funding slice counts projects (`unfundedLeft`, :550), which differs from the card rule only in the state of Behaviour 1.
  - The doc text: the head comments of bar.ts (:26-33) and Collection.svelte (:48-52), and HELP.md:374, say the rule. The four rows pass. The two exclude rows' quoted start-tree failures agree with the snapshot's `passes` and `card` expressions.
- 4: holds by reading. In the Show menu, an uncancelled Shift+Enter reaches bits-ui's Enter, which clicks the selected item, so the row press runs, as on the base. The report gives the before and after.
- 5: holds, at another path than the round brief's, and the departure is right.
  - `src/lib/ui/display` holds 10 items (the `ls` above), so an eleventh fails size.test.ts, as the report says.
  - `display/text/` holds the primitives that draw text (CodeText, LinkedText), so the file sits where its concern lives, as spec.md asks. Its imports point downward (ui/forms to ui/display), and boundaries.test.ts passes.
  - The three copies are gone: the clip-path grep prints one hit, and no `.unseen` or `.read` selector is left in Facts, PickMenu or FieldSelect.
  - The optional `id` prop is needed for FieldSelect's `aria-labelledby`, so it does not reach beyond the finding.
  - The head comment has one false clause: Standards 1.
- 6: holds. The definition greps are quoted and reproduce. The saved key `excluded` is stated for the four states with the lines that handle it, and every cited line was read and says what the report says.
  - The rename `listsOf` to `facetListsOf` is right. The grep finds three other definitions of `listsOf` in unrelated modules with other signatures (`ListInputs`, a schema list reader, a settings reader's local function), so there is nothing to reuse, and keeping the name would leave a reader four meanings. The rename is mechanical, and every call site, import and re-export moved.
  - No `listsOf` is left in docs/, src comments or tests; the only remaining hits are lines of the report's first part (Proof 1).
- 7: violated. The round ran one shell heredoc that appended to exclude.test.ts: Spec 1.

### Findings

#### 1. Spec

- `tests/state/boards/board/exclude.test.ts:580-598` and the round report's opening paragraph: "the `pressedState` describe block of `tests/state/boards/board/exclude.test.ts` was first appended with a shell heredoc (`cat >> ... <<'EOF'`); that block was removed with Edit and written again with Edit"; under Spec. What is wrong:
  - The round brief says "No script is written for this round: every change is made with Edit or Write", and spec.md's "What every package obeys" counts "a shell redirect that changes a file" as a script.
  - What reached the tree: the file holds one copy of the block (`grep -c` prints 1), at its end, prettier-clean and ASCII. Whether the Edit's text differs from what the heredoc wrote cannot be checked, since the heredoc's text is in no file.
  - The report's "Item 7" then says "This round ran no program of its own: no `python3`, no `node -e`, no script written", which contradicts its own first paragraph.

  Failure scenario: a reader of Item 7 alone takes the round to be script-free. Verdict: round item 7 violated. It is the orchestrator's to close under the standing ruling "Unapproved builder scripts".
- `.scratch/migration/agents/guarded.md:452` (main checkout): "Code: `applyFilters`, `parseBoardState` and the press helpers ...; `meets` ...; `stageKeeps` ...; `filterGraph` ..."; under Spec. What is wrong:
  - exclude.test.ts now holds a table for the Role and Hub drop through `boardFilter` (filter-menu.ts) and `mapBar` (map-bar.ts), and a table for `pressedState` (record-board.ts), as the round brief ruled.
  - spec.md's "What every package obeys" keeps a test as the test of an entry, with one test per unit its text and Code line name. G153's Code line names none of these three units.
  - The builder never edits the ledger, so the fix is the orchestrator's, at landing.

  Failure scenario: a later step changes `pressedState` or `boardFilter`, finds no guarded entry naming them, and treats the table as unguarded or obsolete. Verdict: none.

#### 2. Proof

- `.scratch/migration/agents/reviews/O192-report.md:874`: "`grep -rn "\blistsOf\b" src/lib/state/boards tests/state/boards src/lib/views/shared/forms` prints only lines of this report's first part"; under Proof. What is wrong:
  - The rerun prints nothing (exit 1). The report sits under `.scratch/`, outside the grep's paths, so the sentence misdescribes the output.
  - The substance holds: the old name has no use left in the step's code.
  - The report's first part still names `listsOf` as an export the step adds (O192-report.md:662, :681, :712), which is no longer true. No decision rests on either line.

  Failure scenario: a reader checking the exports against the first part looks for `listsOf` and does not find it. Verdict: none.
- O192-report.md:898, the round's verify table: "`npx prettier --check` over the changed non-Markdown files"; under Proof. What is wrong:
  - The brief's verify item 1 runs prettier over the files the step changes, and the round changed docs/HELP.md, which this run left out.
  - The YAML check was not run in the round. The three YAML files show no difference from the snapshot, so the round did not touch them.
  - The reviewer's rerun covers both: prettier over the 27 files including HELP.md prints "All matched files use Prettier code style!", and the YAML check exits 0.

  Failure scenario: none at run time, since both pass. Verdict: none.

#### 3. Standards

- `src/lib/ui/display/text/Unseen.svelte:4-5`: "and the state of a filter value a list marks by colour alone (views/shared/forms/bar/PickMenu.svelte)"; under Standards. What is wrong:
  - PickMenu marks an excluded row by struck-through words, a red chip and the minus glyph in place of the tick (PickMenu.svelte:23-25, :184-188). The mark is not colour alone.
  - The span exists because every one of those marks is drawn only to the eye (`.check` is `aria-hidden`). The clause is false, and a false sentence in a head comment is a defect under spec.md's "What every package obeys".
  - The fix is one clause at landing, for example "a filter value's state a list draws only to the eye".

  Failure scenario: a maintainer takes the span for a colour-blind fallback and drops it once a non-colour mark is added, leaving a screen reader with no word for the state. Verdict: none.
- `src/lib/views/shared/card/record/sets/NoFundingCard.svelte:7-8`: "and, while a group of the bar's Projects section has a pick, a project of the card the picks leave"; under Standards. What is wrong:
  - Under round item 3's rule, a No funding card with no project in its strip is kept while the section holds only excluded values (collection/bar.ts:499-500, :592). bar.ts's head comment (:28-30) now says so, and this comment states the earlier rule.
  - The file is outside the round's paths, but spec.md's "What every package obeys" makes a head comment the change makes false a defect of the change.
  - The state is narrow. It needs `noFunding > 0` with `strips.unfunded` empty, and the shipped vocab cannot produce it: the unfunded projects are live, and the one archival row, `dead-ends`, holds the dead stages (vocab.yml:282). Only a hub's words that put a live stage under an archival row reach it.

  Failure scenario: a reader compares the two head comments and finds two rules for one card. Verdict: none.
- `tests/state/boards/board/exclude.test.ts:156`: "project('c1', { tier: 'research', lead: [SELF], stage: 'revision', root: 'lab' })"; under Standards. What is wrong: the line copies `CASES.c1` (board-fixture.ts:21) field by field. `{ ...CASES.c1, root: 'lab' }` would reuse it, which spec.md's principle that a rule exists once and is reused asks for in a fixture too. Failure scenario: `CASES.c1` changes (its stage or lead), the Hub row's `c1` silently stops being the Role rows' `c1`, and the table's rows no longer run over one project. Verdict: none.

#### 4. Behaviour

- `src/lib/state/boards/collection/bar.ts:592` with `:550` and `:582`, and `src/lib/views/boards/collection/Collection.svelte:230`: "card: sliceKeepsCard && stripKeeps(unfunded)", "const unfundedLeft = picking ? unfunded.filter(narrows).length : input.noFunding", "if (!picking) return true;"; under Behaviour. What is wrong:
  - In the state of Standards 2, with `noFunding > 0` and `strips.unfunded` empty, an exclude alone in the Projects section keeps the No funding card.
  - The card is then drawn with `unfundedShown = unfunded.filter(filtered.strip)`, which is empty, since `strip` returns false under any pick for a project not in `items`.
  - Its Tag and the No funding slice therefore read 0, where they read n with no pick. On the first build the card was hidden in this state.
  - The report's before and after for item 3 does not state the case.

  Failure scenario: a hub whose words put a live stage under an archival row has three live unfunded projects all in that row. The reader excludes Form `article` in the Projects section, and the No funding card stays with the count 0 and the slice at 0, though none of its projects is an article. With the shipped config it is not reached. Verdict: none (round item 3 met as written).

### Declined to judge

- `npm run diagrams`, rerun: refused by the permission classifier. The committed diagram changes agree, by reading, with the three new imports of Unseen, but that they match a fresh run is not verified. The landing gate's run settles it.
- The start-tree runs of the round's new rows (verify item 5): not rerun, since a run on the start tree would need a copy of it with the new test, which this review does not write. Each quoted failure was read against the snapshot's code (`pressedState`, `passes`, `card`, and the Hub fixture's id spread) and is the failure that code gives.
- Alt+Enter and Alt+Space on a slice chip, and case 23 with every drawn property (the red row and chip, the minus button's hover and keyboard-row visibility, focus after its click, what a screen reader announces for the Unseen span inside an option, Shift+Enter in the Show menu toggling the row): the look at landing settles them.
- Whether the HELP.md:374 sentence needed a ruling beyond the brief: the brief's item 13 has line 372 rewritten so it stays true, and without the sentence it would be false for a card with no project under an exclude alone. spec.md bars a reviewer from raising a missing or unchanged line of HELP.md, and the added line was read and is true against bar.ts:499-500.

Reviewer usage: a506384da442b8238, claude-opus-5-5, 221555 tokens, 54 tool uses, 984 s.

## Closed

First run:

- Spec 1 (`pressedState` keeps a saved exclude): sent in repair round 1, item 1; closed, `pressedState` writes `excluded: {}` and its row in `exclude.test.ts` passes (the gate's vitest run).
- Spec 2 (the first build's inline `python3` edit and printing `python3 -c` calls): closed by the orchestrator under the standing ruling "Unapproved builder scripts"; nothing they produced reached the tree, and the booking names them.
- Proof 1 (the Role and Hub rows through `appliedFilters`): sent in round 1, item 2; closed, the rows go through `boardFilter` and `mapBar`.
- Standards 1 (the press comments): sent in round 1, item 1; closed.
- Standards 2 (the report's missing greps and key checks): sent in round 1, item 6; closed in the round report.
- Standards 3 (three copies of the visually hidden block): sent in round 1, item 5; closed, one `Unseen.svelte` primitive.
- Behaviour 1 (a card with no project under an exclude alone): sent in round 1, item 3; closed.
- Behaviour 2 (Shift+Enter in the Map's Show menu): sent in round 1, item 4; closed, and seen at the look (Shift+Enter toggles the Team row there).

Repair round 1:

- R1 Spec 1 (the heredoc into `exclude.test.ts`): closed under the standing ruling "Unapproved builder scripts"; the block in the tree was read whole at landing and kept, and the booking names the breach.
- R1 Spec 2 (G153's Code line): fixed at landing in `agents/guarded.md`; the line names `boardFilter`, `mapBar` and `pressedState`.
- R1 Proof 1 (the `listsOf` grep line, and the first part naming `listsOf`): a report line with no decision on it; the booking names the rename to `facetListsOf`.
- R1 Proof 2 (prettier left HELP.md out, the YAML check not run in the round): the reviewer's rerun and the landing gate ran both green; the booking names it.
- R1 Standards 1 (Unseen's "by colour alone"): fixed at landing, "draws only to the eye".
- R1 Standards 2 (NoFundingCard's head comment): fixed at landing, the comment states the included, excluded and exclude-only rule.
- R1 Standards 3 (the Hub fixture copied field by field): fixed at landing, `project('c1', { ...CASES.c1, root: 'lab' })`.
- R1 Behaviour 1 (the No funding card at 0 under an exclude alone with an empty strip): fixed at landing in `collection/bar.ts`, the count under excludes alone is `noFunding` less the read projects the excludes drop, and a project the section does not read is kept by excludes alone in the strip; two rows of `exclude.test.ts` hold it.
