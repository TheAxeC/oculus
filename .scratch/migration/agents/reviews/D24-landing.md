# D24 landing

Plan oculus/migration, step D24 "a Personal board: side projects drawn as cards". Next: X3a's repair round 1, D18's builder, /spec M3.

## Open items

- **Z241 (2026-10-02 06:50, Q88c): Delete Branch on a branch git calls not fully merged.** VS Code runs `git branch -d`, and when git refuses because the branch is not fully merged it asks "The branch '{0}' is not fully merged. Delete anyway?" and runs `git branch -D`. Oculus's `DESIGN.md:128` says "no form carries `--force`", the `git-write.ts` comment on push says "Nothing is ever forced", and `tests/server/git/git-write.test.ts:571-575` asserts no file of `server/git` contains `--force`. `-D` is `--delete --force`, so VS Code's retry meets that rule. Q88c is built with `-d` only: an unmerged branch is refused with git's reason and kept.
  - (a) Keep `-d` only. Pro: the no-force rule stands as written; nothing that holds commits no other branch holds is deleted from a button. Con: VS Code's "Delete anyway?" path is absent; an unmerged branch is deleted at a terminal.
  - (b) Add VS Code's retry: after git's "not fully merged" refusal, VS Code's question, then `git branch -D <name>`, listed in `CONFIRMED`; `DESIGN.md:128` amended to "no form carries `--force` except `branch -D` after its question", and the gate's test keeps refusing the `--force` spelling. Pro: VS Code parity; the commits stay reachable through the reflog for git's expiry period. Con: a rule written for every write gets one exception.
  - Recommendation: (b), since the parity ruling asks for every capability VS Code has, the question stands between the reader and the loss, and the exception is one named form under its own confirmation. It would be added to Q88c in a repair round or at landing, with no new step.

## The check of Steps 1

The runner's agent listing before the landing showed Q88c's builder (aaefbd170dbbfe70a), X3a's reviewer (a6e768689ba25b71d) and D18's brief check (af145655a83599a5a). D24's builder aad5c8302bdcacd63 and its reviewers a2488867fcf7ea624 and ad56b78a1dc9c9c51 were not in it.

## NOT DONE

- Whether `fs.watch` on a root's parent folder reports the root's removal on Linux is not verified; the test of a root removed whole runs on macOS.
- No A/B: the configuration block names no `bench:`.

## What landed

The Personal board, the Projects page's fourth tab, draws a card for each side project: the hub's `side-projects/<slug>/project.yml` (id `side:<slug>`) and each Files root's `.oculus/project.yml` (id `root:<key>`), with a search, status toggles for idea, building, running and parked, and the manifest opened in the editor. `personalRoots` in `src/lib/server/root/watch/portfolio.ts` is the one place that decides which roots are read: the `hub` and `engine` keys, a key seen before, and a directory whose native real path is the hub's, the engine config folder's or an earlier root's are dropped. Each root's `.oculus` folder and its parent folder are watched, so a manifest written, edited or removed, or a root removed whole, rebuilds the board; the workspaces file is polled. The side tier is its own entity kind `personal` and is on no other board, lane or audit.

The six manifests drafted in the builder's report were written to the repositories and committed there by path, no push: cathedra fc105f3f, game-engine 4f45a69, ordo 1428d06, scotoma 9ce4590, officium e201aa1, youtube-downloader a012ba5 (with `!.oculus/project.yml` added to its `.gitignore`, whose `*.yml` would otherwise ignore the manifest; `git status --short` there shows `.oculus/` untracked before the commit).

Base bca66b3c, cherry-picked by `land.sh` (wip ca7c8cb2 on D24-land). Conflicts in `src/lib/server/root/context.ts` and four diagram files: `context.ts` keeps D35's start functions and builds the portfolio watcher in `startPortfolio` with D24's `roots` and `workspacesFile`; the diagrams were taken from D24 and regenerated.

Changed files outside the brief's path list: `HELP.md`, `config/text/app.yml`, `config/text/findings.yml`, `src/lib/data/model/index.ts`, `src/lib/data/snapshot/normalise-personal.ts` (new), `normalise.ts`, `validate.ts`, `src/lib/server/core/paths.ts` (a fix at landing), `src/lib/server/root/context.ts`, `src/lib/state/boards/career.ts`, `src/lib/state/client/selectors.svelte.ts`, `src/lib/state/shared/words/status-rows.ts` (new), `src/lib/state/workbench/navigation/registry.ts`, `src/lib/state/workbench/rail-badges.svelte.ts`, and 50 test files.

## What was found, and the fixes at landing

The run over repair round 1 found 0 Spec, 2 Proof, 1 Standards and 1 Behaviour findings; each is closed on main, as `agents/reviews/D24-refuter.md`'s Closed heading lists:

1. Proof 1: `D24-report.md` opens with a note naming the four statements of its first part that the round superseded.
2. Proof 2: `roots.test.ts` "draws one card for a directory listed twice, by a link or under the hub" runs the duplicate roots through the watcher. Red without the real-path check: `expected [ 'root:again', 'root:link', ...(2) ] to deeply equal [ 'root:tool' ]`.
3. Standards 1: `openRootParent` calls `watchFile`, and `identityOf` calls `realPath` from `server/core/paths.ts`.
4. Behaviour 1: `realPath(path, native)` resolves with `realpathSync.native` when asked, and `identityOf` asks, so two letter cases of one directory are one root on a case-insensitive file system. Red without it: `expected [ { key: 'upper', ...(1) }, ...(1) ] to deeply equal [ { key: 'upper', ...(1) } ]`.

Two red lines on main, each fixed:

5. `tests/state/workbench/navigation/arrangement.test.ts` called `resetPages(rail)`, written on a base before L4 added the floats argument: `TypeError: specs is not iterable`. It passes `[]` now; the file's 105 tests pass.
6. The size check: `arrangement.test.ts` reached 912 lines. The six tests of "the floats of the config" moved to `tests/state/workbench/layout/pages.test.ts` (713 lines); both folders were at ten files, so no new file.

## Verification on main

```
$ npm test
 Test Files  450 passed | 23 skipped (473)
      Tests  11725 passed | 626 skipped (12351)
$ npm run test:checks
 Test Files  29 passed | 2 skipped (31)
      Tests  445 passed | 9 skipped (454)
$ npm run check
1790921938555 COMPLETED 3005 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
$ npm run build
$ npm run format:check
$ npm run lint
$ ! LC_ALL=C grep -rna '[^ -~]' src tests
checks: 7 commands passed
```

The third run of the list. The first stopped at fix 5, the second at fix 6.

## The look

On TEST at localhost:8790, the Personal view opened from the Views list: nine cards, Cathedra, Officium, Ordo, yt-downloader (running), Missal, scotoma (building), GPU Game Boy, Residual, Scripted OS (idea), each with its status chip, its folder and its explanation clamped with Show more; the four status toggles at the head; no console error on the tab. Under the current theme only.

## Agents

- Builder aad5c8302bdcacd63, claude-sonnet-5-5 at ordo-high: to the report 90,664 tokens, 416 tool uses, 207.5 min (3 full-list runs, none printing `checks: n commands passed`); repair round 1 263,812 tokens, 89 tool uses, 36.5 min (2 full-list runs, the second passing).
- Reviewer a2488867fcf7ea624, claude-sonnet-5-5: 322,372 tokens, 79 tool uses, 33.9 min; 5 Spec, 4 Proof, 2 Standards, 2 Behaviour findings.
- Reviewer over round 1 ad56b78a1dc9c9c51, claude-sonnet-5-5: 254,852 tokens, 65 tool uses, 27.4 min; 0 Spec, 2 Proof, 1 Standards, 1 Behaviour findings.
- Brief check: claude-sonnet-5-5, 318,451 tokens, 121 tool uses, 16.6 min.
- The first report did not pass its bar (13 findings in the first review). Fixes at landing: 6.
- Review branch: under `review: earned` the reviewer ran, since D24 changes a server module, a state layer and a wire shape.
- D24 is the 15th landing reviewed by Sonnet, so the three-way Opus and Sonnet comparison is ready to be asked for.

## Next

X3a's repair round 1 (its review found 14); D18's brief-check findings closed in its brief, then its builder; /spec M3.
