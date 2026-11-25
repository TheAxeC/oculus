# Repair round 1 of step O192, exclude in the board filters

The brief `agents/briefs/O192.md` and `agents/spec.md` govern this round unchanged. The review is `agents/reviews/O192-refuter.md` (copied beside this file's reviews folder). Each item below is a ruling: do what it says, in this worktree only, and write the round's report as a section "Repair round 1" appended to `.scratch/migration/agents/reviews/O192-report.md`, item by item, with the checks' lines as printed. No script is written for this round: every change is made with Edit or Write, and a program run only to print (a `python3 -c`, a `node -e`) is no more allowed than one that writes.

The guarded entry the brief calls G151 is renumbered G153 in `agents/guarded.md`, since G151 was already taken; the orchestrator made that change. No test title or comment names the number, so nothing in the worktree changes for it.

## Paths this round writes, beyond the brief's list

- `src/lib/state/boards/record-board.ts`
- `src/lib/views/shared/card/record/RecordCounts.svelte`
- `src/lib/ui/display/Unseen.svelte` (new)
- `src/lib/ui/forms/choice/select/FieldSelect.svelte`
- `src/lib/views/academic/present/parts/project/Facts.svelte`
- the files `npm run diagrams` rewrites

## Items

1. **The record board's count buttons (review Spec 1 and Standards 1).** `pressedState` (`src/lib/state/boards/record-board.ts:267-279`) sets the tab's whole filter state so the board shows exactly the projects the button counts, and it now keeps a saved `excluded` map. It writes `excluded: {}` beside `filters`. Its head comment (`record-board.ts:261-266`), the file's head comment (`:21-24`) and `RecordCounts.svelte:9-13` say the press takes out every include and every exclude; each paragraph rewrapped whole at 100 columns. A row in `exclude.test.ts`, in a table of its own for `pressedState`, holds it: a saved state with `excluded: { slice: [...], status: ['paused'] }` pressed on a button of slices gives `excluded: {}` and the button's slices under `filters.slice`. The row is run on the round's start tree (this worktree before the item 1 change) and fails there; the report quotes the failure, then the pass after.

2. **The Role and Hub drop reached through the bars (review Proof 1).** The two rows of the board table that call `appliedFilters` in the test are replaced by rows that go through `boardFilter` (`filter-menu.ts`) with a saved state holding `excluded: { role: ['lead'] }` and `named` false, and `excluded: { hub: ['lab'] }` on a workspace of one hub, and through `mapBar` with the same two inputs; each asserts the projects shown (`shown`, `kept`) are all of them. Each row is quoted passing after the change. A run on the unchanged base tree is not asked for (the behaviour is preserved there, since the base has no exclude), as the refute skill's Proof heading allows for a preserved behaviour.

3. **A card with no project and an exclude alone (review Behaviour 1).** Under item 1's rule, a record with no value for a facet is never hidden by its exclude. In `collectionBar` (`collection/bar.ts:490-493`), an entry whose strip holds no project is hidden by the Projects section only while one of its groups has an included value, as on the base; while the section holds only excluded values, such an entry stays, and an entry whose strip held projects is hidden when the excludes leave none of them. The No funding card follows the same rule. The file's head comment and `Collection.svelte`'s say it. A row in the collection table holds it: an entry with no strip beside the two with strips, `excluded: { project_form: ['article'] }`, the entry with no strip kept; and a second row with `filters: { project_form: ['journal'] }`, the entry with no strip hidden. Each run on the round's start tree first (the first fails there, quoted), then passing.

4. **Shift+Enter in a list with no "not" press (review Behaviour 2).** In `PickMenu.svelte`, `shiftEnter` returns at once, cancelling nothing, when `onexclude` is undefined, so in the Map's Show menu Shift+Enter is the row press as on the base. The file's head comment says so in place of "Shift+Enter does nothing there". The report's Show menu line gives the before and after: Shift+Enter toggled the row before and toggles it now; in every other list Shift+Enter was the row press and is now the "not" press.

5. **One visually hidden text primitive (review Standards 3).** The block `.unseen { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }` is in `FieldSelect.svelte`, `Facts.svelte` and now `PickMenu.svelte`. It becomes one component, `src/lib/ui/display/Unseen.svelte`, a `<span>` holding its children, with a head comment saying what it is for; the three places draw it and drop their copies. The report quotes `grep -rn "clip-path: inset(50%)" src` after the change, one hit.

6. **The report's missing checks (review Standards 2).** The round's report quotes the grep for each new exported name and type (`facetKeeps`, `listsOf`, `noPicks`, `withCategory`, `withExclude`, `withoutExcluded`, `FilterPicks`, `FacetLists`, `excludedPillars`, `Unseen`) over `src` and `tests`, each showing no other definition, and states for the saved key `excluded` of `BoardState`, `CollectionState`, `MapState` and the Present state what the code does when it is empty, duplicated (a value in both lists) or colliding with another key, each with the line that does it.

7. **Programs (review Spec 2).** The orchestrator closes the first build's inline `python3` edit and the printing `python3 -c` calls under the standing ruling "Unapproved builder scripts"; nothing they produced reaches the tree. This round runs none.

## Verify before you report

The brief's "Verify before you report" 1, 2, 4 and 5, rerun from the worktree root over every file the step and the round change, the new and changed rows of items 1 to 3 included, `exclude.test.ts` run verbose. The report quotes the lines they print.
