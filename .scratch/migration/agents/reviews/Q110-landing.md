# Q110 landing

Position: the oculus migration plan (`tools/oculus/.scratch/migration/plan.md`), step 194 of 295, Q110, an undo gives a replaced manifest value back as the file held it. Next: /spec E3 (the apps section's text to Z103 (b) and Z106 (a)) and /spec Q106 (Close pane on two tabs) into the free slots; Q111 once they are prepared; X3d's review runs.

## Open items

None.

## Agents stopped

`ListAgents` at the start of the landing listed one subagent running, a2a724fb5c78af633 (X3d's reviewer), and none of Q110's.

## NOT DONE

Nothing of the brief.

## What landed

From base 6f6e047f, one wip commit on `Q110-land` cherry-picked by `land.sh` (5 files changed, 292 insertions(+), 12 deletions(-)), plus the fixes at landing:

- `src/lib/server/edit/writes/manifest.ts`: `writeManifest(hub, config, id, fields, reading: ValueReading = 'form')`; under `'record'` each value is written as the record holds it, so `[]`, `''`, `false` and a value `coerce` would normalise come back as the file held them, and `null` removes the field; `readonly`, `keymap` and an unknown type are refused under both readings through `unwritable`. `currentOf` is no longer exported.
- `src/lib/server/edit/writes/undo.ts`: the manifest row of `apply` passes `'record'`.
- `tests/routes/edit/undo.test.ts`: the describe "taking a manifest write back exactly", the whole text compared. `tests/server/edit/writes.test.ts`: the record reading's refusal of an unknown type.
- `tests/server/edit/coerce.test.ts` (new, a fix at landing): the five pure `coerce` cases moved out of the slow-tagged `writes.test.ts`, so `npm test` runs them and the unknown-type guard at `manifest.ts:82` is exercised by the standing verify list.
- `DESIGN.md` line 313: the citation `writes/manifest.ts:350`.

## Verification on main

`npm run diagrams` (exit 0, no file changed), then `sh ~/.claude/skills/land/templates/checks.sh .scratch/migration/orchestrator-state.md` from `tools/oculus` (`land.sh` runs it from the repository root, where npm finds no `package.json`):

```
$ npm test
 Test Files  350 passed | 19 skipped (369)
      Tests  5347 passed | 559 skipped (5906)
$ npm run test:checks
 Test Files  27 passed | 2 skipped (29)
      Tests  365 passed | 9 skipped (374)
$ npm run check
1790793218103 COMPLETED 2474 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
$ npm run build
built in 6.32s
built in 15.42s
$ npm run format:check
All matched files use Prettier code style!
$ npm run lint
$ ! LC_ALL=C grep -rna '[^ -~]' src tests
checks: 7 commands passed
```

The step's groups by name, `npx vitest run tests/routes/edit tests/server/edit`: `Test Files  11 passed (11)`, `Tests  304 passed (304)`. `npx vitest run --tagsFilter '!slow' tests/server/edit/coerce.test.ts tests/server/edit/writes.test.ts`: `Tests  5 passed | 24 skipped (29)`, the five moved cases under `npm test`'s filter.

## The look

None taken. The step changes no view; the change is seen through History's Undo on a manifest, and a look would write a real project manifest of the hub. The whole-text tests stand for it.

## Found, and the fixes at landing

- First review: ST1 (a head comment false for `currentOf`), SP1 (the unknown-type refusal of the record reading untested), B1 (the normalised values not named) sent as repair round 1 and closed there, reproduced by the round review; P1 (a record value of the wrong shape is written as it is) ruled no change, since a shape check would refuse the undo of `pin: on`.
- Round review PR1: the SP1 case sits in a slow-tagged file `npm test` skips. Fixed at landing by moving the pure `coerce` cases to `tests/server/edit/coerce.test.ts`; the round review showed "refuses a type it does not know" fails with `manifest.ts:82` removed.
- Round review BR1: the report's line 88 read as if `pin: on` came back byte for byte wherever it stood; it comes back at the end of the file when `pin` was not the last line, which is Z105's case (step Q111). Fixed at landing in `agents/reviews/Q110-report.md` line 88.

## Usage

- Brief check: claude-opus-5-5, 166,632 tokens, 31 tool uses, 6.1 min.
- Builder: claude-sonnet-5-5, 157,740 tokens, 21 tool uses, 13.0 min; round 1: 178,815 tokens, 13 tool uses, 6.8 min.
- First review (abdca2fd478b9f797): claude-opus-5-5, 176,879 tokens, 41 tool uses, 11.4 min. Round review (a4bf44d5d493a4c20): claude-opus-5-5, 161,971 tokens, 39 tool uses, 11.1 min.
- The builder's first report did not pass its bar (three findings sent as a round). Two fixes at landing: the moved `coerce` cases and the report's line 88.
