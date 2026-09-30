# Q108 landing

Position: the oculus migration plan (`tools/oculus/.scratch/migration/plan.md`), step 192 of 294, Q108, the four fixes kept as `agents/reviews/inline-fixes-2026-09-30.patch` applied and reviewed as a step. Next: /spec Q106 (Close pane on two tabs) into the freed slot; X3d builds; Q110's round is under review.

## Open items

- Z106, changes to the unbuilt apps design beyond Z103 (b) (raised 2026-09-30 20:04 on Axel's question whether anything else in E2's 42 shapes should change; read against `DESIGN.md` lines 236-327). Three changes recommended, each a text change to the section and to its row in `agents/reviews/E2-report.md`: (1) Row 18, the store rides in every row of the `apps` channel: a channel publish sends the whole payload to every subscriber (`src/lib/server/core/channels.ts:103-134`), so each `setStore` of any app, up to 30 a minute per frame, re-sends every app's store, up to 256 KB each, to every page. Change to the report's own alternative: the row carries the store's size and a version, and the page fetches one app's store by a GET route when that app's version changes. (2) Row 36 carried further: a machine app's `open({ file })` rejects `closed` for a path with a dot-led segment (`.env`, `.ssh`, `.oculus/`, `.git/`), the rule the app file server already applies, so no app can put a hidden credential file on screen or learn whether one exists (a missing file answers `missing`). (3) Rows 32 and 42: whether Chrome's policy lets `connect-src https://host` also admit `wss://host` is not settled in the section, and row 32's reason for refusing `wss:` rests on it; the build step's Chrome measurements (row 42) add it, and the section states the result. The other 38 rows: no change recommended. Options: (a) The three changes, made with Z103 (b)'s row 36 by one small step E3 (the apps section's text), dispatched now. For: the section says what will be built, and the 256 KB push is not built in; against: one more step. (b) The three changes and row 36 left to the apps build step's `/spec`. For: no step now; against: the section stays false against your ruling until then, and a builder may read it as it stands. (c) Z103 (b) alone by E3, none of the three. For: smaller; against: the push cost and the dot-file exposure get built. Recommended (a). The lazy option is (b).

## Agents stopped

`ListAgents` at the start of the landing listed two subagents running, ab6d7c7cab135b864 (X3d's builder) and a4bf44d5d493a4c20 (Q110's round reviewer), and none of Q108's: its builder and both its reviewers had finished.

## NOT DONE

Nothing of the brief.

## What landed

Commit on main after 009ca601 (this commit), from base a6efe87c, one wip commit on `Q108-land` cherry-picked with `git cherry-pick -n a6efe87c..Q108-land`, 16 files, 317 insertions, 24 deletions:

- `src/lib/ui/controls/editor/zones.ts`: a bar's room is made again on every model change (`room()`, an `onDidChangeModel` listener disposed in `unmount`), so Monaco's dropped view zones come back.
- `tests/ui/controls/editor/zones.test.ts`: a fake editor faithful to Monaco (no zone without a model), cases 1 to 5 and 11 to 14.
- `src/lib/views/system/hpc/Jobs.svelte`: the empty queue line through `Empty`; `tests/views/system/hpc.test.ts` case 6.
- `tests/shell/workbench.test.ts`: the drop mark counted by `class="mark[^"]*" aria-hidden="true"`.
- The five kit tests moved to `tests/ui/controls/editor/kit/`, with `kit/colours.ts:12` and `tests/ui/theme/colours.test.ts:611` naming the moved `theme.test.ts`.
- `docs/diagrams/` as `npm run diagrams` writes them.

## Verification on main

`npm run diagrams` (exit 0), then `sh ~/.claude/skills/land/templates/checks.sh .scratch/migration/orchestrator-state.md` from `tools/oculus` (`land.sh` runs it from the repository root, where npm finds no `package.json`):

```
$ npm test
 Test Files  349 passed | 19 skipped (368)
      Tests  5329 passed | 563 skipped (5892)
$ npm run test:checks
 Test Files  27 passed | 2 skipped (29)
      Tests  365 passed | 9 skipped (374)
$ npm run check
1790792318134 COMPLETED 2473 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
$ npm run build
built in 11.97s
built in 28.94s
$ npm run format:check
All matched files use Prettier code style!
$ npm run lint
$ ! LC_ALL=C grep -rna '[^ -~]' src tests
checks: 7 commands passed
```

The slow-tagged `tests/shell/workbench.test.ts` by name: `Tests  53 passed (53)`. The step's own groups, `npx vitest run tests/ui/controls/editor tests/views/system/hpc.test.ts tests/ui/theme/colours.test.ts`: `Test Files  11 passed (11)`, `Tests  107 passed (107)`.

## The look, on TEST in the orchestrator's tab

- Case 9, the merge editor: a temporary repository in the session's scratch folder with a merge in progress and a conflicted file (`UU notes.txt`), added through the Files view's add-folder control, the file opened in the merge editor. The screenshot shows each conflict's Accept bar drawn above its lines in Incoming and in Current. The repository was then taken out through the root row's remove control and the in-app confirm; `grep -c look-repo ~/.oculus/workspaces.json` prints 0, and the folder is deleted.
- Case 10, Live HPC opened from the status bar item "0 running, 0 pending": the page read gives one element holding "No jobs in the queue for you right now.", a `P` of class `empty svelte-dorw7t`, padding `10px 0px`, colour `rgb(95, 111, 133)`, font size 12.5px, and no bare `<p>` holding the words (`bare: 0`).
- Seen on the way: a click of the Files rail button switched to that rail group's page and created it, "Explorer rail: explorer", which stays in the Pages list; the tab was returned to TEST. The dev server reloaded the page while the verify run built.

## Found, and the fixes at landing

- The first review: two tests that could not fail (the empty-queue absence check, case 13's zone assertion); both closed in the one repair round and reproduced by the round review.
- The round review: the report's case 13 row and its Verify 4 row still called case 13 an audit, while in its final form it fails on main's `zones.ts` (`expected 2 to be 1`). Fixed at landing in `agents/reviews/Q108-report.md` lines 29 and 53, a text fix inside the brief.

## Usage

- Brief check: claude-opus-5-5, 158,436 tokens, 37 tool uses, 7.0 min (the removed dispatch entry's `brief_check`).
- Builder: claude-sonnet-5-5, 164,490 tokens, 48 tool uses, 14.2 min; round 1: 175,323 tokens, 8 tool uses, 5.6 min.
- First review: claude-opus-5-5, 152,342 tokens, 37 tool uses, 13.3 min. Round review (a1ce91d40deb763dd): claude-opus-5-5, 108,892 tokens, 21 tool uses, 8.1 min (its completion notice, 485,275 ms).
- The builder's first report did not pass its bar: two tests could not fail. One fix at landing, in the report's text.
