# T1e landing

Position: plan oculus/migration, step T1e (the test sweep of `tests/routes/`, `tests/data/`, `tests/checks/` and `tests/fixtures/`) landed. In flight: T1d (`tests/views/`, `shell/`, `ui/`, `themes/`), stopped at its first run on Z389. Next: T1d on Axel's ruling of Z389; T1a after it.

## Open items

- Z389 (2026-10-04, T1d's first run): the audits check as ruled in Z376 (b) clashes with how `tests/` is laid out. `tests/` mirrors `src/lib/` (`themes`, `shell`, `views`, `ui`, `state`, `server`, `data`, plus `checks`, `fixtures`, `routes`: 10 items, the folder limit), and `src/lib/views/` holds plain `.ts` modules (menu builders, press handlers, layout functions) beside its components. Their tests sit in `tests/views/` and render nothing: the builder's scan of the rewritten check over the unchanged tree flags 494 cases in 74 files, 393 of them in 47 files that test such a module (`repositories-menu.test.ts`'s 36 cases of `changeMenu` and `hasMenu` among them, menus the user relies on). Z376 (b) moves them to "the folder of the code they call", which is `tests/views/` itself, and a new folder for them would make `tests/` 11 items. Options: (a) the check reads only the test files under `tests/views/` that import a `.svelte` component, and fails each case there that reaches no `render(`, no `mount(` and no name bound to one, with no title escape and no allow list; a file that imports no component tests a view-layer module and stays where it is; pros: one fact a machine computes, the mirror and the folder limit hold, nothing moves; cons: it narrows what Z376 (b) said, and a source-text case in a file with no component is caught only by the sweep's reading under `spec.md:61`. (b) A new folder for tests of view-layer modules (for example `tests/view-modules/`, mirroring `src/lib/views/`), with `tests/themes/derive.test.ts` folded into `tests/ui/theme/` so `tests/` stays at 10; pros: Z376 (b) as written; cons: about 47 files and 393 cases move, the mirror between `tests/` and `src/lib/` breaks for `themes` and for the view modules, and many `allow-duplication.txt` entries change path. (c) Keep the allow list and the "audits" titles, the lazy option, which keeps what Z354 removes. Recommendation: (a), since it holds the rule Z376 (b) set (a view test draws its view) without moving tests away from the code they test.

## NOT DONE

Nothing of T1e's brief.

## Check of the agents

T1e's builder `ab51f46426a84a1f0` and its reviewers `a83115633ce9293bf` and `a56c176fd85283a46` are not running: `ListAgents` listed no subagent, only the idle peer session ordo-01.

## What landed

T1e, one commit on main (the commit that carries this file), from base 812eb07c2: the sweep of its four folders as `agents/briefs/T1e.md` and its round-1 rulings say. Counted with `find <folder> -name '*.ts' | wc -l` and `cat | wc -l` on main against the base copy:

| Folder | Files before | Files after | Lines before | Lines after |
|---|---|---|---|---|
| routes | 50 | 49 | 14,435 | 13,750 |
| data | 44 | 43 | 10,613 | 9,625 |
| checks | 44 | 43 | 11,188 | 10,409 |
| fixtures | 10 | 10 | 731 | 727 |

The deletions, folds and slow tags are listed file by file in `agents/reviews/T1e-report.md`.

## Fixes at landing

1. `tests/checks/tree/allow-duplication.txt` conflicted with T1b's change: main's side taken, with the marks the round reviewer listed removed. `tests/routes/machine/commands.test.ts` keeps main's line 8.
2. Round Spec 1: `tests/routes/edit/roots.test.ts`'s case 'records the add and the remove, and the undo of each puts the list back' is untagged, since its whole-file minimum is 79.6 ms; its head no longer names a slow case.
3. Round Standards 1: the false sentence about a slow case removed from `tests/routes/files/file-undo.test.ts`'s head.
4. Round Standards 2: `tests/data/demo-hub.test.ts`'s head says the join is asserted by the pairs the demo names and that counts are not pinned.
5. `tests/server/core/changes.test.ts` imports `deckTarget` from `tests/routes/edit/write-fixture.ts` in place of its own `DECK`, `slideProject` and `deckTarget`; `slideProject` is no longer exported, and duplication entries 20c1f0a1f3eb and b1c8135285d1 are removed.
6. `tests/server/git/refs/detached.test.ts:6-7` names `tests/routes/git/git.test.ts` as the confirm's test.
7. `CONFIRMED` in `src/lib/server/git/git-routes.ts` is no longer exported; its one use is in the same file.

## What was found

- Round Proof 1: ten src removals run on main, each file restored and checked with `cmp`. Every row of `file-ops.test.ts:19`, `agents-catalog.test.ts:41`, `personal.test.ts:196`, `present.test.ts:230` and `editor-options.test.ts:190` fails with its behaviour removed, so none is deleted. The removal for each row is under "Closed" in `agents/reviews/T1e-refuter.md`.
- Round Proof 2 and 3: closed there as well; no tag changes.
- Round Standards 3: the builder's writes outside its worktree (the hub-root `node_modules/`, `tests/zz/` and four /tmp files) are gone (`ls` of each prints "No such file or directory").
- The fixture exports the four sweeps leave unused are removed at T1d's landing, the last sweep (Booked in the state file).

## Verification on main

`sh ~/.claude/skills/land/templates/checks.sh .scratch/migration/orchestrator-state.md` from `tools/oculus`, after every fix, with `npm run diagrams` before it: `checks: 7 commands passed`.

- npm test: 583 files passed, 41 skipped; 12154 tests passed, 843 skipped.
- test:checks: 30 files passed, 2 skipped; 412 tests passed, 33 skipped.
- check: 3375 files, 0 errors, 0 warnings.
- build, format:check, lint and the ASCII gate passed.
- The run took from 11:20:28 to 11:25:56, load average 9.53 at the start and 5.64 at the end.

There is no look, since the step changes tests and comments only, and no A/B, since the block names no `bench:`.

## Usage

| Agent | Model | Tokens | Tool uses | Time |
|---|---|---|---|---|
| Builder `ab51f46426a84a1f0` | claude-sonnet-5-5 | 365,620 | 760 | 252.7 min |
| Builder, round 1 | claude-sonnet-5-5 | 100,604 | 758 | 262.8 min |
| Reviewer `a83115633ce9293bf` | claude-opus-5-5 | 99,803 | 138 | 41.3 min |
| Reviewer over round 1, `a56c176fd85283a46` | claude-opus-5-5 | 363,333 | 125 | 43.1 min |
| Brief check | claude-opus-5-5 | 250,547 | 78 | 10.2 min |

The first report did not pass its bar, and there were seven fixes at landing. Review: `review: earned`; the reviewer ran, since the brief touches the route tests of server modules.

## Next

T1d on Axel's ruling of Z389, then its landing with the unused fixture exports removed; T1a after the four sweeps.
