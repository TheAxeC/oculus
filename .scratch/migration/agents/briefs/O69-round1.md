# O69, repair round 1

The refutation of your build is `agents/reviews/O69-refuter.md`: items 1 to 8 hold, cases 10, 11 and 17 are partial, and it raises the points below. Work in `.agents/worktrees/migration-O69` only, under `agents/briefs/O69.md`, this file and `agents/spec.md`. Run no git command but `git status`, `git diff` and `git show`, read only. Never open, print, grep or hash `config/local.yml`; every grep over `config/` carries `--exclude=local.yml`. Never read the hub's `.oculus/local.yml`. Never curl ports 8787 or 8790, start no app server and run no browser. No breakage testing of any kind: never break, revert or remove code to see a test fail. Write no script the brief does not build: a case-run is a command, its source and output quoted in the report, and nothing it needs is left on disk at the report. Run no whole-suite command: only the test files that cover what you change, and the verify list once at the end. Rewrite the report `agents/reviews/O69-report.md` whole for the state after this round, with a section "Repair round 1" that answers each item below by its number.

A shortcut is a finding: a narrower reading of an item, or work inside the round called outside it, is done or handed back with the reason before the report.

The path list of the brief widens for this round by `tests/state/shared/hub-words.test.ts` and `tests/state/boards/board/hub-facets.test.ts` (beyond its fixture), each named in the report.

## Items

1. **G127's test checks `stageLabel` (refutation Spec 1; cases 11 and 17).** `tests/state/shared/hub-words.test.ts`, the row at `:77` that installs `lab` and `home`, gains assertions on `stageLabel` (`src/lib/state/shared/words/tones.ts:245`): with no hub it gives the label of the first hub that holds the stage (`stageLabel('exploring')` is `Experimenting`), with a hub it gives that hub's own label (`stageLabel('exploring', 'home')` is `exploring`), and for a hub whose `chips` also lists the stage word with another label, `stageLabel` gives the stage's label where `chipLabel` gives the chip's (case 17: `exploring` against `a chip word`). Where the last needs its own install, it is its own row of the same test.
2. **The row's title says what it checks (refutation Standards 2).** The title of the row at `hub-words.test.ts:77` names the stage facet's order, not "the board's buttons", which this step removes.
3. **G92's test checks the counts with a filter in force (refutation Spec 1; case 10).** `tests/state/boards/board/hub-facets.test.ts` gains a row calling `facets(ITEMS, PRESET, false, { ... })` with a value of another facet in force, and asserting that the shared domain is counted over both hubs (`methods 2` in the case program's terms) and that the values listed are still the whole board's.
4. **Comments rewrapped (refutation Standards 3).** Each paragraph the refutation names is rewrapped whole at 100 columns, so no line inside a sentence ends short: `presets.ts:192`, `tones.ts:117`, `tones.ts:118`, `tones.ts:120`, `facets.ts:1`, `facets.ts:2`, `facets.ts:137`, `facets.ts:138`, `filter-menu.ts:135` and `FilterBar.svelte:9`. The words do not change.
5. **The report quotes the reuse greps (refutation Standards 5).** The report quotes, for `stageLabel`, `byStage`, `without`, `offersMine` and `InForce`, a grep of `src` and `tests` for the name and its key call, with what it printed.

## Not sent

- G92's Code line in `agents/guarded.md`: rewritten by the orchestrator at landing.
- The whole-suite command of the first build (refutation Standards 4): recorded in the booking.
- What is drawn (the chips line, the remove control, the header buttons and their pressed state): the orchestrator's look at landing.

## Verify before you report

From the worktree's root, after the last change: `npm run diagrams && npm run test:quick`, every command passes; the brief's other checks of "Verify before you report" as the brief gives them, the character-set check and the unused-exports comparison among them; `npx vitest run tests/state/shared/hub-words.test.ts tests/state/boards/board/hub-facets.test.ts tests/state/boards/board/board-rules.test.ts`, quoted. Each new row's run after the change is quoted. A row of item 1 cannot run on the unchanged tree, where `stageLabel` does not exist; the report says so. The row of item 3 is run on the unchanged tree only if you can build a base replica with `git show add19ad5:<path>` into a scratch copy, quoted, and the copy removed after; otherwise the report says it was not run there. The plan's whole verify list runs once, at landing on main.
