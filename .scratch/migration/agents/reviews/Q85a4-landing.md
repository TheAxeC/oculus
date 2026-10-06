# Q85a4 landing

Position: roadmap entry oculus/migration (the cockpit-to-oculus migration); Q85a4, `zod` for the untyped input of `src/lib/server/machine`, `accounts`, `files`, `content` and `git`, landed; 246 of the 294 package lines of `plan.md` are ticked (`sed -n 5,460p plan.md | grep -c '^- '` and `grep -c '^- ✅'`). Next: U2's landing, then the freed slot.

## Open items (verbatim)

None.

## Not done

Nothing inside the brief. `bench: []` in `.agents/plan.yaml`, so no A/B. The step changes no view, so it has no look.

## The check of Steps 1

`ListAgents` at 10:30 listed no builder or reviewer of Q85a4: the builder a344f53186c6712f8, the first reviewer aa1dc822a80854f94 and the round reviewer a240111e66250a2d8 were absent or completed. The two running agents were Q85a2's builder and U2's round reviewer.

## What landed

From base ec247019, 74 paths staged by the cherry-pick (3139 insertions, 851 deletions; `git diff --cached --shortstat`), plus the fixes at landing below.

- Every reader of untyped input in the five folders reads through a module-level `...Shape` schema held with `satisfies z.ZodType`: request bodies (the terminal, git, deposit, file-browser write, source, open, account add, mail triage, memories upload), the cloc, ripgrep and `gh` output, the usage and account files, the provider answers of the mail and calendar accounts, and the run-time configuration readers.
- The hand checks the schemas replace are gone: the loop count fell from 222 lines to 99 in 35 files.
- Every fallback of an array or an object is a fresh value per call.
- The stash and patch modes refuse an inherited property name (`constructor`, `toString`, `__proto__`) with their existing sentences, where a `TypeError` was thrown before.
- `writeNote` refuses the thread id `__proto__`, and `readTriage` skips it.
- `DESIGN.md:148` names the bodies read through a schema.

## Verification on main

From `tools/oculus`, with the step and the fixes at landing on main. `land.sh` ran `checks.sh` from the repository root, where `npm` finds no `package.json`; the list was then run from `tools/oculus`, as for the earlier landings.

```
$ npm test
 Test Files  371 passed | 20 skipped (391)
      Tests  5976 passed | 600 skipped (6576)
$ npm run test:checks
 Test Files  29 passed | 2 skipped (31)
      Tests  442 passed | 9 skipped (451)
$ npm run check
COMPLETED 2838 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
$ npm run build
$ npm run format:check
All matched files use Prettier code style!
$ npm run lint
$ ! LC_ALL=C grep -rna '[^ -~]' src tests
checks: 7 commands passed
```

The slow-tagged files the step changed run by name before the full list: `npx vitest run tests/server/core/paths.test.ts tests/server/root tests/server/git/git-ops.test.ts tests/server/git/git-write.test.ts --testTimeout 0` gave `Test Files 19 passed (19)`, `Tests 318 passed (318)`. `npm run diagrams` regenerated `layer-server` and `layers` (.dot and .svg).

## Fixes at landing (four)

1. `tests/server/core/paths.test.ts`: the test "are written nowhere under src" failed on main before this landing (the reviewer reproduced it on the unchanged tree), since `insideFolder` (`state/sources/repositories/change-tree.ts:148`) matches `function inside` and tests a row id's prefix, not a path. The list gains it by name and the comment names it as the fourth match. The first verify run after the change failed `comment-width.test.ts` on the comment's line 74, which was rewrapped.
2. `src/lib/server/root/hooks.ts`: `DEFAULT_NOTIFY` was handed out as the fallback itself and through its `events` list (found by the builder in round 1). It is now `defaultNotify()`, a fresh value per call, as round 1's ruling 5 rules for every fallback. Its one reader (`hooks.ts`, the `includes` call in the notify path) mutates nothing, so no test is added.
3. The run over round 1, Standards 2: `git-refs.ts` and `git-index.ts` read their flag tables through `byKey` from `data/helpers/guards.ts`, the shared own-key reader, in place of an inline `Object.hasOwn`. The inherited-mode cases of `git-ops.test.ts` are the check; they fail without an own-key read.
4. The run over round 1, Standards 1: the head comment of `tests/server/git/git-write.test.ts` names the gate describe and says what the two describes after it read.

## What was found

- The first review (Opus): Spec 3, Proof 0, Standards 1, Behaviour 1 as numbered findings (the inline schemas, `composeRequest`'s widened parameter, `DESIGN.md:148`; the copies of `scalar`; the shared fallbacks), all closed in round 1.
- Round 1's ruling 8 clashed with `tests/checks/tree/scratch.test.ts:349`, which refuses a file that takes the scratch fixture and declares cases with vitest's `it`; the builder moved the two repository cases to `git-write.test.ts`, and the round reviewer reproduced the clash and judged the move to hold the cases.
- The run over round 1 (Sonnet): Spec 0, Proof 0, Standards 2, Behaviour 0, both fixed at landing (items 3 and 4 above).

## Agents' usage

- Brief check: claude-opus-5-5, 322,964 tokens, 100 tool uses, 15.8 min.
- Builder a344f53186c6712f8 (claude-sonnet-5-5):

  | Run | Tokens | Tool uses | Time |
  |---|---|---|---|
  | First run | 316,920 | 350 | 100.4 min |
  | Repair round 1 | 185,933 | 75 | 35.9 min |

- Reviewers:

  | Run | Reviewer | Model | Tokens | Tool uses | Time | Findings (Spec / Proof / Standards / Behaviour) |
  |---|---|---|---|---|---|---|
  | First review | aa1dc822a80854f94 | claude-opus-5-5 | 118,315 | 88 | 20.9 min | 3 / 0 / 1 / 1 |
  | Over round 1 | a240111e66250a2d8 | claude-sonnet-5-5 | 258,005 | 79 | 16.5 min | 0 / 0 / 2 / 0 |

- The bar: the builder's first report did not pass it. One repair round, four fixes at landing.

## Next

U2's landing, with its grouping and the choices it names brought to Axel; Q85a2's round 1, then its review and its landing, which hand-merges the shared files with this step.
