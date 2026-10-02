# X3a landing

Plan oculus/migration, step X3a "the Files view brought to VS Code's Explorer". Next: A1's and D18's repair rounds, then /spec D32, D14 and D17.

## Open items

- **Z251 (2026-10-02 09:40, all steps): fewer repair rounds.** Axel, 2026-10-02: (d) taken through Z253; (a) stands meanwhile; Z251 is ruled after ten steps have landed under the new rules. Count: 0 of 10 (X3a was briefed and reviewed before the Z253 rules).

## The check of Steps 1

The runner's agent listing showed four agents: M3's builder (a4af0ef105f4b6e97), A1's reviewer (a32324e09cd16a4a4), D18's reviewer (a4303ec6fd987a4dd) and Q88c's builder (aaefbd170dbbfe70a). X3a's builder acf8c525dec67af39 and its reviewers a6e768689ba25b71d and a54ccd7f0b17bf46c were not in it.

## NOT DONE

- Not looked at in a browser: drag and drop, multi-select operations, the Delete question and an undo of a delete, since each writes real files of the hub; the macOS folder panel, which opens a system window; Seti on a light theme, since the theme on TEST is not changed. These are covered by the step's unit tests only.
- No A/B: the configuration block names no `bench:`.

## What landed

The Files view as VS Code's Explorer: the workspace header with New File, New Folder, Refresh and Collapse Folders; Open Editors; Outline from Markdown and LaTeX headings; Timeline from the local history and the file's commits; multi-select, drag and drop and the macOS keys (Enter renames, Cmd+Down opens); git decorations on the `--c-scm-*` tokens; file nesting from `config/catalogs/file-nesting.yml`; compact folders; the fuzzy toggle; folder bookmarks; Show in Files and Open Folder; the macOS folder panel through `osascript`; the Files operations recorded in History with undo; `files.confirm_delete`; Seti derived darker on the light themes.

Base fab398d6. `land.sh` stopped at a conflict in the worktree's cherry-pick (wip 1780a332 on X3a-land) in `DESIGN.md`, `HELP.md`, `config/catalogs/options.yml`, `shell/Workbench.svelte`, `state/client/context.ts` and the diagrams. Each was resolved by keeping both sides: main's floats, live `local.yml` reading and window hosts with X3a's palette request, `history` key, `openView` and `showFolderInFiles`, and the moved `catalog/agents.ts` path; the diagrams regenerated. The resolved commit 2585627e was staged on main with `git cherry-pick -n main..X3a-land`.

## What was found, and the fixes at landing

The run over repair round 1 found 2 Spec, 4 Proof, 3 Standards and 1 Behaviour findings, each closed under the Closed heading of `agents/reviews/X3a-refuter.md`. Fixes at landing, 9:

1. Red line on main: `history` added to `FIELDS` of `src/lib/server/root/watch/local.ts`. Red before: `tests/server/root/context-reload.test.ts` "reports history when its value changes", `expected [] to deeply equal [ 'history' ]`.
2. B1 and P3 (Z254): `src/lib/server/files/fs/history.ts` keeps `deletes.json`, the index of the delete copies, so a delete reads the index and the folders of the copies it removes and no other folder. Red without it: 5 failed in `history.test.ts` and `file-undo.test.ts`. The two cases the review timed at 4.9 to 17.6 s ran 308 ms and 291 ms under load 15.
3. P1: `nestingFindings` tested, in its words and through the config push. Red with the value sentence swapped and the portfolio call removed: 2 failed.
4. P2: `history` tested in `loadLocal` and `checkLocal`. Red with the reader line removed: 3 failed.
5. `DESIGN.md`: `history` "held at once when the file changes", and the delete index.
6. `undo-said.ts`, `ask.ts` and `AskConfirm.svelte` moved into `src/lib/views/shared/writes/`: after the merge `state/shared/words` held 11 items. `state/shared` admits only its two sub-folders, and one view may not import another, so the words went to the views layer's shared folder, which they share with the question before a write.
7. The history test helper moved to `tests/server/files/history-fixture.ts`: `tests/fixtures` held 11 items.
8. Two comment lines rewrapped at 100 columns (`history.ts`, `Deposit.svelte`).
9. One cast in the helper for `@typescript-eslint/no-unsafe-return`.

A finding outside the brief: a `~/` value of a `local.yml` path key is resolved under `config/` (`local.ts`, the path-key loop), while an account's `dir` expands it (`accountDir`). Z255 (automode) folds the fix into M3's repair round.

Premise correction: none at landing.

## Verification on main

```
$ npm test
 Test Files  473 passed | 24 skipped (497)
      Tests  12091 passed | 637 skipped (12728)
$ npm run test:checks
 Test Files  29 passed | 2 skipped (31)
      Tests  446 passed | 9 skipped (455)
$ npm run check
1790934028470 COMPLETED 3088 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
$ npm run build
$ npm run format:check
$ npm run lint
$ ! LC_ALL=C grep -rna '[^ -~]' src tests
checks: 7 commands passed
```

Six full runs on main; runs 1 to 5 were red on the lines fixed above.

## The look

On TEST at localhost:8790, the Files view opened from the Views catalogue: the header "Configured roots" with its four actions under the pointer; Open Editors expanded with three rows and its actions; Collapse Folders folding every folder of `hub`; `hub` and `tools` in the deleted hue, since main holds staged deletions under `tools`; README.md opened by one press as a preview tab; Outline listing its four headings with their lines; Timeline listing 18 commits with a Compare tooltip; the palette's `:workspace-save ` with Enter staying open and saying "Type a name for the workspace." No console error on the tab. Under the current dark theme only.

## Agents

- Builder acf8c525dec67af39, claude-sonnet-5-5 at ordo-high: to the report 318,310 tokens, 1,446 tool uses, 365.6 min (4 full-list runs); repair round 1 352,537 tokens, 183 tool uses, 67.9 min (3 full-list runs; two read-only git commands against the round's rule).
- Reviewer a6e768689ba25b71d, claude-sonnet-5-5: 297,143 tokens, 170 tool uses, 26.1 min; 3 Spec, 6 Proof, 3 Standards, 2 Behaviour findings.
- Reviewer over round 1 a54ccd7f0b17bf46c, claude-sonnet-5-5: 238,093 tokens, 64 tool uses, 25.1 min; 2 Spec, 4 Proof, 3 Standards, 1 Behaviour findings.
- Brief check: 306,645 tokens, 101 tool uses, 12.7 min.
- The first report did not pass its bar (14 findings in the first review). Fixes at landing: 9.
- Review branch: under `review: earned` the reviewer ran, since X3a changes server modules, state layers and wire shapes.

## Next

A1's and D18's round 1 briefs from their Opus reviews; Q88c's round 1 reply, its round review and landing; M3's report and review, its round carrying Z255; /spec D32 (with the two Z253 scripts), D14 and D17; S4.
