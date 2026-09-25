# Q71 landing

## Open items

None.

Booked: 4 (Q72, Q73, O33, O32).

## NOT DONE

Nothing of Q71's brief. The last review's findings that were too large for a fix at landing are booked as Q73, next in the queue: the `state/life` folder folded into `state/feeds`, the import reader's pattern crossing a comment, the `declare module` check blind to a lower module's empty interface filled from above and to augmentations across layers, `BadgeClient` restating its signatures, the overview's lost-import box and dropped `routes -> assets` arrow, one view fold left, the `/index` and `.js` rules of the checks untested, and the overview's `views -> ui` label crossed by an arrow.

## What landed

Q71, cherry-picked from `.agents/worktrees/Q71` at base `28a63283` by `tools/oculus/.scratch/migration/land.sh Q71 28a63283 <runs> --no-browser` (+7,898 -7,205 over 588 files), then fixed at landing (+28 -24 over 13 files), the browser suite run by hand. The commit follows this report.

- No runtime import cycle under `src`; `tests/checks/imports/cycles.test.ts` names any new one in order.
- Each layer's folders in a declared order (`tests/checks/imports/order.ts`), checked over runtime imports, type-only imports and `declare module` blocks, with no exception rows. The composition roots head their layers (`server/root`, `state/client`, the shell's `Workbench.svelte`, `data` itself); the shared modules sit at the foot (`server/core`, `state/stores/shapes.ts`, `state/words`, `data/model/index.ts`). `file-poll.ts` is in `server/core`.
- State imports nothing of `ui` or `views`: the view registry is `state/workbench/navigation/registry.ts`, and the page makes the tooltip counter.
- What views computed over store data is in state, each with a unit test; the builder's table and its kept list are in `agents/reviews/Q71-report.md`.
- `locals.server.host` carries the host info, read once at server start; no route imports the composition root.
- The diagrams: `layers` is an overview of the layers with import counts, and `layer-<layer>` draws each layer's folders in order; the writes diagram lost its "reached, writes nothing" group.
- Main's `tests/server/sessions/stores/dispatches.test.ts`, red from 2026-09-25 on fixed launch dates (7 of 27, rerun on main by the round-2 reviewer), now dates its launches from the run.

Verification on main after the fixes at landing, from `tools/oculus`:

- `npm test`: `Test Files  310 passed (310)` / `Tests  4853 passed (4853)`
- `npm run check`: `COMPLETED 1391 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`
- `npm run build`: exit 0
- `npm run format:check`: `All matched files use Prettier code style!`
- `npm run lint`: exit 0
- `LC_ALL=C grep -rna '[^ -~]' src tests | wc -l`: 0
- `sh bin/size-check.sh`, `sh bin/folder-check.sh`: exit 0
- `node bin/revert-check.mjs` over the four test files changed at landing: `49 reverts, 0 unproven, 22 unchecked`
- `npm run build` then `npm run test:browser`: `386 passed (6.4m)`

## The look

On the TEST page of the dev server on 8790, under vscode-dark-modern (Q71 changes no theme), the Help view: the manual renders with its nine diagrams (`[data-diagram]` count 9: layers, the six layer diagrams, channels, writes). Seen: the overview reads at the pane's width with its counts, the entry node and the dashed lost-import box (booked in Q73), and the `views -> ui` label crossed by an arrow (booked in Q73); `layer-state` reads with its folders top down and the dashed arrows to data; the writes diagram is wider than the pane and scrolls sideways (`overflow-x: auto` on `.diagram`). The page was put back on References.

## What was found

The first review found the data order held only because type imports were not counted, six view computations missed, a duplicate rehashed on the allow list, four weak proofs and a cluttered overview; round 1 closed each. The run over round 1 found acceptance item 2 met only in its letter in two places (the store shapes filed under `state/words`, the `BadgeClient` declaration merge hiding an import of `state/client`); round 2, the round beyond the cap, closed both. The run over round 2 found the `state/life` fold misnamed, the import reader's pattern crossing a comment and gaps in the new augmentation check; those and the other large findings are Q73, the small ones fixed here. Every finding is under the Closed heading of `agents/reviews/Q71-refuter.md`.

The builder's one read-only `git -C . status` in round 1 and the round-2 reviewer's one read-only `git show` broke their no-git rule; both were disclosed, and neither changed anything.

The builder, the three reviewers and the round replies are ended: `ListAgents` lists no subagent of this session.

## Next

Q73 through /spec, then S2.
