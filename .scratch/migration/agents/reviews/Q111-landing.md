# Q111 landing

Position: roadmap entry oculus/migration (the cockpit-to-oculus migration); step Q111, Undo gives a cleared field's lines back. Next: Q107 and Q106 refuted and landed when their builders report; X3d prepared again from its diagnosis; /spec S3 when a slot frees.

## Open items (verbatim)

An entry leaves this list for the closed log the moment Axel rules on it. What a review or a look found and no brief covered is not an open item: it is booked as its own step in `plan.md` and carried in the Booked section below, since it needs no ruling from him.

(none)

## Not done

Nothing inside the brief. The step has no look: it changes no view (History draws a record with `removed` as any other, case 21), and what a reader sees is a manifest's text after an undo, which the route tests compare byte for byte. `bench: []`, so no A/B.

## The check of Steps 1

The runner's agent listing (ListAgents) showed three subagents running (X3d's diagnosis, Q107's builder, Q106's builder) and none of Q111's builder a08829fc931771f1b or reviewers a540291c88c1458ad and a3574f271682c433f.

## What landed

Main at 82357c57 plus the step: `src/lib/server/edit/yaml-edit.ts` (`SetFieldsResult`, the removed text taken at each splice, `insertRemoved` with its places and tie rule), `src/lib/server/core/changes.ts` (`RemovedText`, `removed?`), `src/lib/server/edit/writes/manifest.ts` and `undo.ts` (the undo puts the removed text back before any value write), `DESIGN.md` lines 140 and 376, `HELP.md` line 254, and the tests `tests/routes/edit/undo-removed.test.ts`, `tests/server/edit/yaml-edit-removed.test.ts`, `tests/routes/edit/undo.test.ts`, `tests/routes/edit/write-fixture.ts`, `tests/server/edit/yaml-edit.test.ts`, `tests/checks/tree/allow-duplication.txt`.

The worktree's cherry-pick onto main conflicted in `DESIGN.md`'s change-log paragraph: main held E3's "writes nothing when the file already holds an equal value (above), and otherwise writes", and the step changed two line references (`writes/undo.ts:181` to `:184`, `writes/manifest.ts:350` to `:415`). Resolved by keeping E3's text with the step's two references; `sed -n 184p src/lib/server/edit/writes/undo.ts` prints `if (change.undo === 'none') return { error: 'nothing' };` and `sed -n 415p src/lib/server/edit/writes/manifest.ts` prints `undo: 'none'`.

## Fixes at landing (the round 1 refutation's three findings, each small and inside the brief, and one standing rule)

1. Standards 1: the head comments of `writes/manifest.ts` and `writes/undo.ts` said the value comes back "as a new line"; both now say it is written as any value is, on a new line or inside its line for text removed from a flow map, as DESIGN.md:140 says.
2. Proof 1: case 26's `id` and `type` rows carried text that could never fit, so they did not guard `insertRemoved`'s settable check. Each row now has its own `next` and fitting text (`id: beta\n# ` before `id: alpha`, `type: idea\n# ` before `type: manuscript`). With the check replaced by `{ path: pathOf(field) ?? [field] }`: `AssertionError: expected 200 to be 400`, `Tests 1 failed | 34 skipped (35)`; restored: `Tests 1 passed | 34 skipped (35)`.
3. Proof 2: the report's sentence on case 14's variants said `no next` and `a next that is a number` do not depend on the validation; corrected in `agents/reviews/Q111-report.md` to say they guard it.
4. `tests/ui/theme/colours.test.ts` tagged slow (`// @module-tag slow` in its head), since it timed out once under load in the builder's run (Axel agreed). `npx vitest run --tagsFilter '!slow' tests/ui/theme/colours.test.ts`: `1 skipped (1)`; run alone: `npx vitest run --tagsFilter slow tests/ui/theme/colours.test.ts`: `Tests 13 passed (13)`.

## Verification on main (from `tools/oculus`, `npm run diagrams` exit 0, then checks.sh)

```
$ npm test
 Test Files  351 passed | 20 skipped (371)
      Tests  5395 passed | 572 skipped (5967)
$ npm run test:checks
 Test Files  27 passed | 2 skipped (29)
      Tests  365 passed | 9 skipped (374)
$ npm run check
1790802746005 COMPLETED 2476 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
$ npm run build
$ npm run format:check
All matched files use Prettier code style!
$ npm run lint
$ ! LC_ALL=C grep -rna '[^ -~]' src tests
checks: 7 commands passed
```

## Agents

- Builder a08829fc931771f1b, claude-sonnet-5-5: 297,174 tokens, 87 tool uses, 29.6 min; repair round 1 332,697 tokens, 19 tool uses, 14.1 min.
- Reviewer a540291c88c1458ad, claude-opus-5-5: 230,315 tokens, 51 tool uses, 17.6 min. Round 1 reviewer a3574f271682c433f, claude-opus-5-5: 195,526 tokens, 39 tool uses, 13.5 min.
- Brief check, claude-opus-5-5: 197,316 tokens, 41 tool uses, 10.0 min.
- The builder's first report did not pass its bar: the first review's findings took one repair round of seven rulings. Fixes at landing: four, above.
- No diagnosis record for this step.
