# Q95 report

Everything in the brief is done, except that the verify runner does not end with `verify: 6 commands passed`: it stopped red at `npm test` on 13 tests in four test files this step does not touch (all timeouts; listed below). The five commands after it were run one by one and each exits 0.

## Open items of the state file, verbatim

"None."

(`sed -n 116,120p tools/oculus/.scratch/migration/orchestrator-state.md` on the main checkout.)

## The cases' first run

The first run on the unchanged tree was made by the previous builder, who wrote no record of it. It was run again for this report without touching the worktree: a copy of the worktree in the session scratchpad (`rsync` without `node_modules`, `.scratch`, `build`; `node_modules` linked), with `RailEditor.svelte` replaced by the main checkout's unguarded file (0 hits for `hasGlyph`), then `npx vitest run tests/views/system/workbench/settings.test.ts`:

```
     x draws a row "Add a button" appended, with an empty mark and the line naming its label 12ms
     x draws a row whose glyph the vocabulary lacks with an empty mark and names it 1ms
Error: glyph not in config/catalogs/glyphs.yml: 
Error: glyph not in config/catalogs/glyphs.yml: nonesuch
      Tests  2 failed | 11 passed (13)
```

The first two cases fail on the throw from `glyph()` (`src/lib/state/shared/words/text.ts:81`), as the brief expects. The third case passes on the unchanged tree, as it should: it guards the glyph still being drawn. No case was found that the brief's own rules get wrong.

Which change turns each test red when undone:

- "draws a row "Add a button" appended...": the `{#if hasGlyph(row.glyph)}` guard around `<Glyph>` (`RailEditor.svelte:144-146`). Undone, `Glyph` throws for the empty name (the run above).
- "draws a row whose glyph the vocabulary lacks...": the same guard. Undone, `Glyph` throws for `nonesuch` (the run above).
- "draws the glyph in the mark of a row whose glyph the vocabulary holds": the `<Glyph name={row.glyph} />` inside the guard. With the guard made `{#if false}` in the scratch copy (the mark always empty), the run gives `x draws the glyph in the mark of a row whose glyph the vocabulary holds` and `Tests  1 failed | 12 passed (13)`.

## What to build

| Item | State | File and line | Proof |
|---|---|---|---|
| 1. Mark draws `Glyph` only when `hasGlyph(row.glyph)`, `span.mark` kept empty otherwise; `hasGlyph` imported beside `t`; head comment sentence | DONE | `src/lib/views/system/workbench/RailEditor.svelte:11-13` (comment), `:36` (import), `:143-147` (mark) | `npx vitest run tests/views/system/workbench/settings.test.ts`: `Tests  13 passed (13)` |
| 2. The three cases in the rail half's `describe` | DONE | `tests/views/system/workbench/settings.test.ts:146-181`, helper `markOf` `:39-49`, `configRail` import `:12` | same command, `Tests  13 passed (13)`; first run above |

The verify list, from the worktree's `tools/oculus`:

`sh /Users/axelfaes/.claude-work/skills/land/templates/verify.sh /Users/axelfaes/workspace/research-hub/tools/oculus/.scratch/migration/orchestrator-state.md` printed, verbatim:

```
RED: npm test
exit status: 1
...
 Test Files  4 failed | 337 passed (341)
      Tests  13 failed | 5345 passed (5358)
```

The four failing files, all `Error: Test timed out in 5000ms`, none added, changed or exercising a file this step changes:

- `tests/server/core/git.test.ts` (5 failed), `tests/server/git/git-ops.test.ts` (6 failed): git suites, not this step's.
- `tests/checks/imports/order.test.ts` (1 failed, timeout): whole-tree import order check; this step adds no import path, only a name to an existing import of `text`.
- `tests/checks/source/comment-width.test.ts` (1 failed, timeout): whole-tree comment width check. Not rerun, per the rules; the step's own comment lines were checked by `awk 'length > 100'` over both changed files, which prints only lines 74 and 146 of the test file, both `it(` code lines (74 existing, 146 new), no comment line; prettier accepts both.

The runner stops at its first red command, so the other five were run one by one from the same directory:

```
npm run check rc=0      COMPLETED 1433 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
npm run build rc=0
npm run format:check rc=0   All matched files use Prettier code style!
npm run lint rc=0
! LC_ALL=C grep -rna '[^ -~]' src tests   rc=0
```

## Files

- `src/lib/views/system/workbench/RailEditor.svelte`: 256 -> 262 lines.
- `tests/views/system/workbench/settings.test.ts`: 139 -> 188 lines.

Grep of the construct: `grep -rn "hasGlyph" src tests HELP.md DESIGN.md README.md` gives `appearance.ts:15,146`, `text.ts:90`, `RailEditor.svelte:36,144`; `grep -rni "add a button\|rail_add"` over HELP.md, DESIGN.md, README.md, src and the catalog gives only the catalog key and `RailEditor.svelte:198`. No document sentence is made false.

## Judgment calls

1. The tests read a row's mark through a helper `markOf` that cuts the markup from the row's `class="mark"` to its label field's accessible name (`workbench.rail_label` with the row's place), and it returns empty when the mark is missing, so each case also asserts the mark is still drawn (`not.toBe('')`), which holds the brief's "the span.mark stays" as well as "holds no data-glyph".
2. The Add case builds its draft from `configRail(config)`, the saved rail list, plus the new row, so it is exactly what an Add press writes over the saved list.

## Limitations

- The unit suite renders to a string: it cannot press "Add a button" or reload, so the cases render the state an Add press writes, which is the state a reload draws from (brief, premise 5). The press itself is seen at the look.
- The first run was made by the previous builder and not recorded; the run quoted above is a re-run on a scratch copy with the main checkout's `RailEditor.svelte`.

## User-visible change

View: Settings, Rail section.

- Before: pressing "Add a button" throws in the section; the new row is never drawn, and since the draft is kept in the tab's state, every reload throws again and the page stays down. A draft row naming a glyph not in `glyphs.yml` does the same.
- After: pressing "Add a button" draws a 12th row with an empty mark (the column kept, nothing in it), empty fields, the line "button 12 has no label" under the list, and Save held back. Reloading shows the same. Once a label is typed, the line becomes "button 12 names no glyph"; picking a glyph draws it in the mark. Rows whose glyph the vocabulary holds are drawn as before.
