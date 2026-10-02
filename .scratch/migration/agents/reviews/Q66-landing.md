# Q66 landing report

Position: oculus/migration, step Q66 (a hidden tab defers its work) landed. In flight: L4 (ready to land, one fix at landing), D35 and M4 (repair round 1), X3a and D24 (building). Next: /land L4.

## Open items

None. The "Open items" section of `orchestrator-state.md` holds no entry.

## Agents stopped

Q66's builders (a4af80915516453ed, then the continuation a7c7904a6d1025f78) and both reviewers (a93e9f989b66e2e0d, a7413ffd5185cc0e1) had finished before the landing. `ListAgents` at 04:45 listed acf8c525dec67af39 (X3a), aad5c8302bdcacd63 (D24), a1fc727999ec8d0d1 (D35's reviewer) and af927a2e2e0450a91 (L4's round reviewer), none of them Q66's.

## NOT DONE

- Look items 16 (needs a bookmark written to Axel's bookmarks), 17 (a running session's Transcript), 19 (a command typed into a terminal), and the Changes and Graph resets on a session switch (no session picked on TEST) were not looked at.

## What landed

- `tabScope` and `shownGate` in `src/lib/state/client/use.ts` and the scoped reads of `queries.svelte.ts`: a tab the pane hides takes no re-read and follows nothing until it is shown, then asks once. `TabView.svelte` provides the scope for its subtree.
- The gated readers: Files (`fs.svelte.ts`, `files.svelte.ts`), the transcript, the LaTeX build, the docs store, and the effects of the source tab, the diff, Graph, Changes and a File tab's address (`File.svelte`'s `drawn` state).
- Tests: `tests/shell/panes/tab-view.test.ts`, `tests/shell/panes/tab-scope.client.test.ts`, cases in `queries.test.ts` and `client-state.test.ts`, with the helpers `ShownProbe.svelte` and `scope-watch.svelte.ts`.
- `DESIGN.md` and the regenerated diagrams.

On main: 29 files, 1169 insertions and 125 deletions (`git diff --cached --shortstat` before the commit).

## Fixes at landing

- `land.sh` stopped on a conflict in the worktree's cherry-pick, in three generated diagram files (`layer-shell.svg`, `layers.dot`, `layers.svg`). They were taken from the step's side and regenerated with `npm run diagrams`, then the cherry-pick was continued and the range staged on main with `git cherry-pick -n main..Q66-land`.
- No code fix.

## Verification on main

The commands ran from `tools/oculus`. This was the second run of the list.

```
$ npm test
 Test Files  429 passed | 22 skipped (451)
      Tests  11244 passed | 621 skipped (11865)
$ npm run test:checks
 Test Files  29 passed | 2 skipped (31)
      Tests  442 passed | 9 skipped (451)
$ npm run check
COMPLETED 2965 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
$ npm run build
$ npm run format:check
All matched files use Prettier code style!
$ npm run lint
$ ! LC_ALL=C grep -rna '[^ -~]' src tests
checks: 7 commands passed
```

The first run stopped at `npm run test:checks` at a load average of 21: `tests/checks/source/comment-width.test.ts` timed out at 30000 ms. Q66 does not change that file. Run alone it passed, `Tests 2 passed (2)` in 18.8 s.

There was no A/B: the configuration has no `bench:` line.

## The look

On TEST (localhost:8790), main's tree with Q66 staged, a `fetch` counter installed after a reload and the browser's network panel:

| What | Seen |
|---|---|
| Item 20: Files and Changes switched back and forth, nothing changed | no request either way |
| Item 18: the source tab `gen_figures.py` hidden while a file of the repository was deleted | no request from it while hidden (only the shown diff tab asked `/api/git` diff); shown: one `/api/git` marks request |
| Behaviour B1: a shown File tab from `research-programme.svg` to `project-lifecycle.svg` | one request, `/api/file/.../project-lifecycle.svg`; nothing for the old file |
| Behaviour B1: the same tab from that picture to `funding/2026-nwo-enw-xs/proposal-ls/main.pdf` | one request, for the PDF; the PDF drawn in its frame |
| Console | no errors |

A file written into an open folder from outside oculus does not appear in the Files tree, shown or hidden. That is the design `fs.svelte.ts` states: a folder whose contents changed on disk is re-read by closing and opening it. Q66 does not change it.

## Findings and their dispositions

Every finding of the first run was closed by repair round 1. Every finding of the run over round 1 was closed at landing, as `agents/reviews/Q66-refuter.md`'s Closed heading says:

- Proof P1: B1 has no test that can mount the File tab. The look above covers it.
- Proof P2: two of the round's three new tests pass without the round's change. They guard the loading branch against over-correction and test no added behaviour.
- Standards S1: the live reads left in `File.svelte` are kept. They act on the tab's own file, and the pass in which they follow the other file ends before the browser paints and asks for no address.
- Standards S2: the two helper files are listed once here.
- Standards S3, Behaviour B1 and B2: no change, as the Closed heading says.

## Agents' usage

- Brief check: claude-sonnet-5-5, 330,279 tokens, 118 tool uses, 18.7 min.
- Builder (claude-sonnet-5-5):
  - first builder a4af80915516453ed, stopped: its usage is not in the dispatch block;
  - continuation builder a7c7904a6d1025f78 to the report: 249,200 tokens, 87 tool uses, 43.3 min (2 full-list runs, the last passed);
  - repair round 1: 303,337 tokens, 31 tool uses, 53.0 min (2 full-list runs, the last passed).
- Reviewer, first run: claude-sonnet-5-5, 197,616 tokens, 55 tool uses, 43.5 min. Findings: 3 Spec, 2 Proof, 2 Standards, 2 Behaviour.
- Reviewer over round 1: claude-sonnet-5-5, 210,648 tokens, 50 tool uses, 46.0 min. All findings closed at landing.

The builder's first report did not pass its bar: the review found 9 findings and a repair round was sent. There were no code fixes at landing, only the diagram regeneration.
