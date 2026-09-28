# Q95 landing (2026-09-28)

Plan oculus/migration. Step Q95, "Add a button" in the Settings view's Rail section no longer takes the page down. Next: Q97 (its round is built, its second review owed) and Q94 (reviewed, fixes at landing).

## Open items

None.

## Agents of the step

The builder and the reviewer had finished before the landing; `ListAgents` listed the reviewer as completed and no Q95 builder.

## NOT DONE

Nothing of Q95.

## What landed

- `src/lib/views/system/workbench/RailEditor.svelte`: a row's mark draws `<Glyph>` only when `hasGlyph(row.glyph)` holds; otherwise the mark stays, empty, and the rule's line names what the row lacks. One head-comment sentence.
- `tests/views/system/workbench/settings.test.ts`: the Add draft (12 rows, empty mark, "button 12 has no label", Save held back), a row naming an unknown glyph, a row naming a held glyph.

## What a reader sees differently

- Before: pressing Add a button threw, the Rail section never drew the row, and every reload threw again. After: a 12th row with an empty mark and "button 12 has no label", the same after a reload, and "button 12 names no glyph" once a label is typed.

## Found

- The Q97 merge note named one number in `settings.test.ts`; the Add case counts the saved rail in three places. Q97's `shared_paths` entry is corrected.

## Checks on main

`sh ~/.claude-work/skills/land/templates/verify.sh <state file>` from `tools/oculus`: `RED: npm test`, `Test Files 2 failed | 339 passed (341)`, `Tests 2 failed | 5356 passed (5358)`, both `Test timed out in 5000ms` in `tests/checks/tree/duplication.test.ts` and `tests/checks/tree/size.test.ts`, which scan the step's files; run on their own, `Tests 20 passed (20)`. Then by hand: `npm run check` `COMPLETED 1433 FILES 0 ERRORS 0 WARNINGS`, `npm run build` rc 0, `npm run format:check` `All matched files use Prettier code style!`, `npm run lint` rc 0, the ASCII grep rc 0.

## The look

On the TEST page of Axel's Chrome on 8790, light theme: Settings opened there from the Views catalogue; Add a button drew the 12th row with an empty mark, "button 12 has no label" and Save disabled; after a reload the same; with "Look" typed, "button 12 names no glyph"; Revert put the list back to 11 rows. Nothing was saved (`git status --short tools/oculus/config` empty).

## Next

Q97's repair round is built; its review over the round runs, then its landing. Q94 lands with the four wording fixes its review names.
