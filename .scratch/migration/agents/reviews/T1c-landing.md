# T1c landing

Position: plan oculus/migration, step T1c (the test sweep of `tests/server/`) landed. In flight: T1b (`tests/state/`) and T1e (`tests/routes/`, `data/`, `checks/`, `fixtures/`), building. T1d (`tests/views/`, `shell/`, `ui/`, `themes/`) waits for Z376. Next: T1b's and T1e's reviews and landings; T1a after the four sweeps.

## Open items

- Z314 (2026-10-03, the owed look Q81): a Confirm drawn over the update tray, shown only while `tasks.skip_permissions` is on in `config/behavior.yml`; the classifier refuses the edit. Options: (a) Axel sets `skip_permissions: true` himself, the look is taken, and Axel sets it back; (b) the point is dropped from the look. Recommendation (a); (b) is the lazy option.
- Z376 (2026-10-04, /spec T1d): `tests/checks/tree/audits.test.ts` requires a non-rendering case under `tests/views/` to be titled "audits", against Z354. Options: (a) T1d deletes the check and its list; (b) T1d rewrites it to fail on any case under `tests/views/` whose body reaches no render, no mount and no helper bound to one, with no title escape and no allow list, the kept cases moved to the folder of the code they call, T1d after T1b; (c) the titles keep "audits". Recommendation (b); (c) is the lazy option.
- Z377 (2026-10-04, the recurring pass): the size check refusing over 880 lines and 520 for a component, built in T1a; 13 files on main are over those numbers today. Options: (a) the check moved; (b) the rule stays text only. Recommendation (a); (b) is the lazy option.

## NOT DONE

Nothing of T1c's brief.

## Check of the agents

T1c's builder `ac23a216933c977fe` and its reviewers `a194094e84c8be37a` and `a5365c1e9236a9b55` are not running: `ListAgents` listed the round reviewer as completed and the two running agents as T1b's and T1e's builders.

## What landed

T1c, one commit on main (the commit that carries this file), from base d160d13f: the sweep of `tests/server/` as `agents/briefs/T1c.md` and its round-1 rulings say. The folder holds 139 test files and 47,506 lines after the sweep, against 138 and 49,184 before (`find tests/server -name '*.test.ts' | wc -l`, and the `.ts` lines through `cat | wc -l`). The deletions, folds and slow tags are listed file by file in `agents/reviews/T1c-report.md`. `allow-duplication.txt` merged with X3c's change without a conflict.

## Fixes at landing

1. Spec 1: in `edit/config-value.test.ts`, the case "refuses local.yml before any file is read" moved into an untagged describe of its own. The builder's own runs put it at 76 ms, and its tag contradicted that reading. The head comment now says which cases are slow.
2. Spec 2, Standards 1 and 2, Proof 1: the three tests the round put back without a ruling are deleted. They are `git/git-write.test.ts` "refuses a path that is not a worktree of the root", `machine/hpc/host.test.ts` "holds the five sentences, ...", and `root/watch/portfolio/roots.test.ts` "reads the roots once per change of the workspaces file, not once per tick".
3. Standards 3: `tmuxOptions` dropped from `tmux-fixture.ts`'s re-export.
4. Standards 4: `requireProgram` returns nothing.
5. Standards 5: `core/changes.test.ts`'s head comment made true.
6. Standards 6: `machine/pty/channel.test.ts`'s head comment made true.
7. `subscriptionChannels`, which has no importer, removed from `src/lib/server/root/socket.ts`.
8. T1c's Doc text applied to these files:
   - `src/lib/server/root/hooks.ts`;
   - `tests/routes/machine/commands.test.ts` (the path of the origin guard's test);
   - `vite.config.ts`, `README.md`, `HELP.md` and `agents/spec.md:56` (the slow tier described as tagged tests).

## What was found

- Every finding of the run over round 1 is closed under "Closed" in `agents/reviews/T1c-refuter.md`.
- Proof 3, the warm-up hooks, is kept: T1c's brief, item 3, asked for a cold start in a `beforeAll`. The briefs of T1b, T1d and T1e count a hook's time with the tests it serves.
- Proof 2: a removal's holder is named in the report by its error text. The holding test is `context.test.ts:491`.
- D1, the 100 ms line, is ruled by Z379: the builder's measured tags stand, and T1a chooses the quick list.
- D2 (`core/paths.test.ts`, red on main too) is Z364, fixed in T1a.
- D3 (the `git-ops.test.ts` timeout) is load-bound.
- `root/watch/portfolio/roots.test.ts` keeps two cases that wait 400 ms on real time to see that no message came (`:105`, `:255`). They watch real file-system events, which a fake clock does not drive. The file is tagged slow.
- The builder ran read-only git commands against the no-git rule, as its report lists; the recurring pass of 2026-10-04 ends that cause with a base copy in every brief.

## Verification on main

`sh ~/.claude/skills/land/templates/checks.sh .scratch/migration/orchestrator-state.md` from `tools/oculus`, after every fix, with `npm run diagrams` before it: `checks: 7 commands passed`.

- npm test: 589 files, 13979 passed, 828 skipped.
- test:checks: 31 files, 471 passed, 9 skipped.
- check: 3375 files, 0 errors, 0 warnings.
- build, format:check, lint and the ASCII gate passed.
- The run took 414 s, with load average 7.65 9.40 9.78 after it.

`land.sh` itself ran the list from the repository root, where `npm test` finds no `package.json`. The list was run from `tools/oculus` instead. There is no look, since the step changes tests and comments only, and no A/B, since the block names no `bench:`.

## Usage

| Agent | Model | Tokens | Tool uses | Time |
|---|---|---|---|---|
| Builder `ac23a216933c977fe` | claude-sonnet-5-5 | 187,752 | 744 | 261.4 min |
| Builder, round 1 | claude-sonnet-5-5 | 368,506 | 377 | 183.1 min |
| Reviewer `a194094e84c8be37a` | claude-opus-5-5 | 79,507 | 146 | 39.3 min |
| Reviewer over round 1, `a5365c1e9236a9b55` | claude-opus-5-5 | 344,258 | 91 | 32.2 min |
| Brief check | claude-opus-5-5 | 204,893 | 70 | 9.4 min |

The first report did not pass its bar, and there were eight fixes at landing. Review branch: `review: every`.

## Next

T1b's and T1e's reviews and landings; T1d on Axel's ruling of Z376; T1a after the four sweeps.
