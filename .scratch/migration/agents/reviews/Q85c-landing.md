# Q85c landing report

Position: oculus/migration, step Q85c (zod in `src/lib/data`) landed; in flight U3 (repair round 1 building) and D27 (brief check in); next D27's builder and D35 prepared again on the new main.

## Open items

None. The "Open items" section of `orchestrator-state.md` holds no entry.

## Agents stopped

Q85c's builder (a5d6f19f5a6360b3b) and both reviewers (a4424239736fa1dee, ad09686ce9cc473e2) had finished before the landing: `ListAgents` lists one subagent, a2609b2bc8bd7786d (U3's builder), and none of Q85c's.

## NOT DONE

- No look: the step changes no view, style or markup file; it changes how `src/lib/data` reads its inputs. `JSON.stringify(buildPortfolio(demo, config))` is byte-identical before and after (43256 bytes, `cmp` silent, the round-1 reviewer's run).

## What landed

`zod` schemas at the inputs of `src/lib/data`: the readers answer from `safeParse(...).data`, `readAs` or `readOr`; `sources/yaml-file.ts` replaces five copies of the YAML file reader; `snapshot/compact.ts` and `snapshot/normalise-career.ts` split `normalise.ts` and `validate.ts` under the size limit; the hand checks the schemas replace are deleted. Answers changed only where an own `__proto__` key reached a map: `flattenText` (so the text catalog), `loadConfig`'s merge, and the `meta` and `fields` maps of `sources/collections.ts`, `sources/registries.ts` and `snapshot/normalise.ts` (Z173) skip it; the eleven changed answers, each with its before and after, are in `agents/reviews/Q85c-report.md` under ruling 5. 54 files against the base 8db30ca2 (`git diff --cached --stat`: 3619 insertions, 904 deletions) before the fixes below. The cherry-pick merged `DESIGN.md` with D31's lines without a conflict.

Verification on main, from `tools/oculus`, after `npm run diagrams` (rc 0) and the fixes below:

```
$ npm test
 Test Files  413 passed | 22 skipped (435)
      Tests  10840 passed | 618 skipped (11458)
$ npm run test:checks
 Test Files  29 passed | 2 skipped (31)
      Tests  442 passed | 9 skipped (451)
$ npm run check
1790876396585 COMPLETED 2929 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
$ npm run build
$ npm run format:check
$ npm run lint
$ ! LC_ALL=C grep -rna '[^ -~]' src tests
checks: 7 commands passed
```

Full verify-list runs at landing: two, both passing; the second after the last change to the tree. `land.sh`'s own run stopped at its first command, since it runs from the repository root, where no `package.json` is.

## Fixes at landing

1. Standards 1 of the run over round 1: the `shapes.ts` head comment names the data folder among the readers, `itemsShape` as a list of anything and `optionalItemsShape` as an optional list of strings.
2. Behaviour 1: the nested `__proto__` answer added to the report's list as item 11, and a case over a text and a number leaf below the top level in `tests/data/sources/config/merge.test.ts`. It fails with the skip limited to the top level and passes on the landed `merge.ts`; `tests/data`: 34 files, 673 tests passed.

Standards 2 (`tiersShape.parse(held)` after the loop in `usageTiers`) is kept as built, with the reason under the Closed heading of `agents/reviews/Q85c-refuter.md`: the `.parse` cannot throw after the loop, and an answer through `readAs` needs a branch for a `null` that cannot occur, the dead fallback the first run's Standards 3 removed.

## Agents' usage

- Brief check: claude-sonnet-5-5, 272,378 tokens, 80 tool uses, 13.3 min.
- Builder (claude-sonnet-5-5): 138,304 tokens, 236 tool uses, 69.7 min (1 full-list run); round 1 211,570 tokens, 63 tool uses, 17.0 min (2 full-list runs, the first red at `npm test` on a config-key timeout, green alone and in the second).
- Reviewer, first run: claude-sonnet-5-5, 339,515 tokens, 88 tool uses, 35.5 min; 3 Spec, 2 Proof, 9 Standards, 1 Behaviour findings.
- Reviewer over round 1: claude-sonnet-5-5, 204,734 tokens, 61 tool uses, 23.3 min; 0 Spec, 0 Proof, 2 Standards, 1 Behaviour findings.
- The builder's first report did not pass its bar (15 findings, one repair round). Two fixes at landing. Z163 and Z173 ruled in automode.

## Next

D27's brief findings are closed in its brief, then its preparation commit and builder; D35 is prepared again on the new main from its draft brief and its brief check's closures; U3's round review follows its round.
