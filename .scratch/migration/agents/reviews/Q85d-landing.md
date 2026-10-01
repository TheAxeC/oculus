# Q85d landing report

Position: oculus/migration, step Q85d (zod in the views, `ui/`, `shell/` and the routes) landed; in flight Q66 and Q35 (continuation builders) and L4 (review); next /spec D35 under Axel's D35 redo ruling, then /spec X3a.

## Open items

None. The "Open items" section of `orchestrator-state.md` holds no entry.

## Agents stopped

Q85d's builder (a9259df1ca448b16b) and both reviewers (a1869e27b7f463b00, a92dbded06a6276fd) had finished before the landing: `ListAgents` listed three subagents, Q66's and Q35's builders and L4's reviewer, and none of Q85d's.

## NOT DONE

Nothing in the brief.

## What landed

`zod` readers at the inputs of the views, `ui/`, `shell/` and the routes: 35 files and 66 check lines of `typeof`, `Array.isArray`, `isMap` and `isRecord` are left, from 64 files and 137 lines, each remaining line one the brief names. The instance-state readers live once in `state/workbench/layout/instance.ts`; `bookmarkRows` in `state/sources/fs.ts` decides which view a bookmark opens; the boundary test lets the shell and the views import `data/shapes/shapes`; ten repository test files moved into `diff/`, `history/` and `view/`. 90 files on main, 2459 lines added and 1010 removed (`git diff --cached --shortstat`).

`land.sh` stopped on a conflict in the worktree's cherry-pick: `DESIGN.md`'s layer table and six diagram files, where D27 had added `data/helpers/files/languages` to the `state/` row. The table keeps Q85d's `shell/` and `views/` rows and main's `state/` row; the diagrams were regenerated with `npm run diagrams`.

Verification on main, from `tools/oculus`, after `npm run diagrams` and the fixes below:

```
$ npm test
 Test Files  426 passed | 22 skipped (448)
      Tests  11193 passed | 621 skipped (11814)
$ npm run test:checks
 Test Files  29 passed | 2 skipped (31)
      Tests  442 passed | 9 skipped (451)
$ npm run check
COMPLETED 2960 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
$ npm run build
$ npm run format:check
All matched files use Prettier code style!
$ npm run lint
$ ! LC_ALL=C grep -rna '[^ -~]' src tests
checks: 7 commands passed
```

Full verify-list runs at landing: one passing run after the last change; `land.sh`'s own run stopped at the conflict before it.

## The look

On TEST: the Files view with its tree, the source editor, Sessions, Customizations, Memories and the rail's Bookmarks menu (its rows from `bookmarkRows`) render as before; `read_console_messages` with errors only reports none.

## Fixes at landing

1. Standards 1 of the run over round 1: the `shapes.ts` head comment names the shell, the views and the routes among its readers and lists `textOrNumber`; `textOrNumber`'s doc comment says it reads `textOrNumberShape` once.
2. Standards 2 of the run over round 1: the `fs.ts` comment above `BookmarkRow` says `bookmarkRows` sets the view and the page hands the rows to the rail.

## Agents' usage

- Brief check: claude-sonnet-5-5, 311,875 tokens, 104 tool uses, 15.7 min.
- Builder (claude-sonnet-5-5): 290,982 tokens, 229 tool uses, 82.8 min (4 full-list runs); round 1 368,588 tokens, 54 tool uses, 24.4 min (3 full-list runs, the first two red at `npm test` on timeouts under load).
- Reviewer, first run: claude-sonnet-5-5, 282,135 tokens, 76 tool uses, 25.0 min; 2 Spec, 1 Proof, 5 Standards, 0 Behaviour findings.
- Reviewer over round 1: claude-sonnet-5-5, 254,729 tokens, 67 tool uses, 33.6 min; 0 Spec, 0 Proof, 2 Standards, 0 Behaviour findings.
- The builder's first report did not pass its bar (8 findings, one repair round). Two fixes at landing.

## Next

/spec D35 under Axel's D35 redo ruling (builder at ordo-high), then /spec X3a with Z187 (f), Z188 redone and Q114 folded in.
