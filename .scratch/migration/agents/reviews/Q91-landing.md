# Q91 landing

Position: plan oculus/migration, step Q91 (the project view and its manifest editor reworked) landed; in flight X3c (repair round 1 in review) and D25 (its landing next); next queued Q116 (the Status view's count of everything under `src/`), T1 held (Z356).

## Open items

- Z251 (fewer repair rounds): Q91 is the tenth landing since X3a, so the count Axel set is reached and Z251 is his to rule now. Every one of the ten had at least one repair round; S4 and D17 had two.
- Z314 (the owed look Q81): unchanged, waiting on Axel setting `tasks.skip_permissions` himself.

## NOT DONE

Nothing of Q91's brief. Not looked at on real data: the follow-up editor with several notes, since no manifest in the hub holds a list of two or more notes (`grep -rn "^followup:" projects side-projects --include=project.yml` prints three lines: two maps and one bare note, hccnet-fl's); its read-only sentence is covered by the schema test.

## Check of the agents

Q91's builder `aa0dc0b58528fb2a9` and its reviewers `a7ac5b16bbf539b33` and `a0e0b8588d3a75500` are not running: `ListAgents` lists one subagent of this session, `afe977eb85adbd5f1` (X3c's round reviewer), and none of Q91's.

## What landed

Q91, one commit on main (the commit that carries this file), from base 2dbe1a72: the project view and its manifest editor reworked, as `agents/briefs/Q91.md` says. The explorer tree moved to `views/shared/explorer/` and is drawn by the Files view and by every project card, each card's tree keeping its own state; the follow-up field written in each shape the hub holds (a bare note, a map, a list of one), a list of several shown read-only; the undo of a rewritten note; the owed-look defects M3-1 to M3-3 and Q88c-18 (Z289) and the Focus view's narrow-pane wrapping (Z296).

## Fixes at landing

The findings of the run over round 1 and the test rule, each listed with its proof under "Closed" in `agents/reviews/Q91-refuter.md`:
1. The undo of a rewritten note after an edit above it (B-R1-1): `insertReplaced` in `server/edit/writes/restore.ts` finds the written lines nearest the recorded offset; new test red with the exact-offset check, green with the fix.
2. `ReplacedText` is `{ offset, before, after }`, the shape D25 uses too, so D25's landing meets one type.
3. `yaml-edit.ts`, `yaml-values.ts` and `yaml-ranges.ts` moved to `server/edit/yaml/` (S-R1-1), imports, head comments, `utils/migrations/rename-program-to-pillar.ts` and DESIGN.md following.
4. Two head comments rewrapped so each path sits on one line (S-R1-2); a test title (S-R1-3).
5. A bare note that is not text (`followup: 5`) refuses a key set under it and keeps the file as it was; new test red before, green after.
6. The test rule (Z354, Z355): `overflow-wrap.test.ts` and `multi-select.test.ts` deleted, and cases of ten other test files that tested markup, labels, stylesheet text or duplicated logic tests; 576 lines removed.
7. The slow tag on `placeholders.test.ts` and `task.test.ts` (Z350), each seen timing out in two or more full runs.
8. The look's defect in the Focus view's awaiting strip, fixed in `views/boards/focus/Focus.svelte` and the Tag primitive's `wrap` prop (below).
9. Two comment lines past 100 columns after the path changes, rewrapped.

## The look

On TEST at localhost:8790, the theme as found.
- hccnet-fl's project card: the file tree rooted at the project's folder, its head open.
- hccnet-fl's manifest editor: the bare note "Register for FLTA 2026" in the follow-up's text field, the date field empty and editable.
- btfno's manifest editor (no note): the date field read-only with the line "a date needs a note; type the text of the follow-up first" (`config/text/views/boards/editor.yml:8`).
- The Focus view in a narrow pane (277 px): the awaiting strip's tags held a long venue name on one line and crossed the strip's border, so the pane scrolled sideways. Fixed at landing (`.seg` `min-width: 0`, `max-width: 100%`; the strip's tags take the Tag primitive's new `wrap` prop, `ui/controls/Tag.svelte`, so a long name wraps); after the fix the pane's `scrollWidth` 277 equals its `clientWidth` 277 and the JMIR and NWO tags wrap. A probe of every element of the pane after the fix finds no lane note and no career panel text crossing the pane's edge.
- Found, outside Q91's brief: a Focus ticker row cut by its ellipsis hides its end ("deadline in 66d") and its `button.name` has no tooltip (31 rows, none with a `title`). Booked as Z358 into X3e.
- Found, already booked: a palette row with a long title draws over the next row on main; X3c builds the one-line row with an ellipsis (Z292, X3c report item 13, `shell/keys/PaletteRow.svelte`).

## Verification on main, after the fixes

Run from `tools/oculus` with `sh ~/.claude/skills/land/templates/checks.sh .scratch/migration/orchestrator-state.md`, 14:06 to 14:13, load averages 9.87 at the start and 5.47 at the end:

- `npm test`: `Test Files  569 passed | 26 skipped (595)`, `Tests  13974 passed | 661 skipped (14635)`
- `npm run test:checks`: `Test Files  31 passed | 2 skipped (33)`, `Tests  471 passed | 9 skipped (480)`
- `npm run check`: `COMPLETED 3316 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`
- `npm run build`, `npm run format:check` (`All matched files use Prettier code style!`), `npm run lint`, the ASCII gate: each exit 0
- `checks: 7 commands passed`

What it does not cover: the browser suite, which the verify list does not run; the Focus fix and the editor states are covered by the look.

## Usage, bar and breaches

- Builder `aa0dc0b58528fb2a9`, claude-sonnet-5-5 at ordo-high: 223,331 tokens, 539 tool uses, 221.5 min to the report; round 1 295,221 tokens, 166 tool uses, 58.6 min.
- Reviewer `a7ac5b16bbf539b33`, claude-opus-5-5: 286,609 tokens, 81 tool uses, 22.3 min. Reviewer over round 1 `a0e0b8588d3a75500`, claude-opus-5-5: 277,277 tokens, 66 tool uses, 28.2 min.
- Brief check, claude-opus-5-5: 240,437 tokens, 84 tool uses, 11.5 min.
- The first report did not pass its bar. Fixes at landing: 9, listed above.
- Breach: the builder ran the full verify list 9 times against `agents/spec.md`'s one (Z348 (b)).
- No A/B: the configuration block names no `bench:`.

## Next

D25's landing (its `ReplacedText` merge with this commit's shape; X3c then merges `picks.svelte.ts`'s move to `views/shared/explorer/tree/control/` and `Files.svelte`'s imports and `selectRow`), X3c's landing after its round review, then Q116.
