# Q79d cases ruling (round 0, 2026-09-28)

The builder handed back one case of the brief that the brief's own item 2 and decision 2 make impossible.

## The case

"What to build" check and "Verify before you report" item 2: `grep -rn "isRecord\|function inside\|insideRepo\|function real(\|function localDay\|function basename" src` prints nothing. Item 2 names the new server helper `inside` in `server/core/paths.ts`, so the pattern `function inside` always matches it. Three functions that are not server path containment also match: `edit/writes/manifest.ts:128` `insideHub` (the manifest-path rule, which calls `below`), `accounts/calendar/ics.ts:82` `inside` (a calendar time window) and `views/sources/repositories/merge/MergeSide.svelte:38` `inside` (a conflict looked up by line). Checked in the worktree with the same grep, which prints those four lines and nothing else.

## Ruling

The case becomes: the grep prints exactly these four lines, `server/core/paths.ts`'s `export function inside(path: string, dir: string)`, `insideHub`, `ics.ts`'s `inside` and `MergeSide.svelte`'s `inside`. The audit case "the copies the shared helpers replaced" in `tests/server/core/paths.test.ts` asserts that exact list, so a new copy of path containment, or any new function named `inside...`, turns it red until the list is read again. `ics.ts` and `MergeSide.svelte` are not renamed: they are outside the step and not path containment. The lazy option was dropping the case.

## The builder's other widenings, accepted

- `tests/checks/tree/boundaries.test.ts` (the state row and its comment) and the `state/` row of `DESIGN.md:169` name `data/helpers/paths`, which decision 1 requires; both are added to the step's paths.
- Views reach the helpers through state re-exports (`state/sources/file-type`, `state/sessions/folds.ts`, `state/life/calendar`), since views may not import `data/`.
- The yaml library's `isMap` is imported as `isYamlMap` in `yaml-edit.ts`, `entry-edit/lines.ts`, `entries.ts`, `subtasks.ts` and `accounts/connect/rows.ts`, so `isMap` means the guard everywhere.
- `selectors.svelte.ts`'s helper is `inFolder`; `sessions/group.ts` keeps a local `within` over core `inside`.
- An empty folder holds nothing in `pathUnder`; `statusRecords` reads a `from` when either column is R or C. Both behaviour changes go in the report under the user-visible changes with their before and after, and each has a case.
