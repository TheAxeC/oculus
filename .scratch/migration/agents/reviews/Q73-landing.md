# Q73 landing

## Open items

None.

Booked: 4 (Q72, Q74, O33, O32).

## NOT DONE

Nothing of Q73's brief. The layer diagrams read worse with the word nodes than before (a count between two folders of a layer stands outside the layer's box; the counts into another layer gather in a row and their halves overlap), seen on the TEST page for `layer-server` and measured by the round's reviewer; booked as Q74, next in the queue, with `uncomment()`, the comment blanking the channel and write readers still use.

## What landed

Q73, cherry-picked from `.agents/worktrees/Q73` at base `359e1ee9` by `tools/oculus/.scratch/migration/land.sh Q73 359e1ee9 <runs> --no-browser` (+6,030 -2,659 over 404 files), then fixed at landing (+67 -3 over 3 files), the browser suite run by hand. The commit follows this report.

- `state/life` is a folder of its own again; `state/shared/words` and `state/shared/stores` sit under one foot folder with an inner order the order check reads.
- One import reader, `bin/diagrams/imports.mjs`, on the TypeScript compiler API and `svelte/compiler`, serves the cycle, order, boundary and augmentation checks and the diagram tool; the reviewer compared it with `ts.preProcessFile` over the 563 files of `src` and found it agreeing on 3,015 of 3,016 imports, the one difference the built handler of `src/server.ts` it reads on purpose.
- A `declare module` or a `/// <reference path>` naming a module of the tree is refused in any direction and across layers; a package augmentation stays allowed.
- `BadgeClient` is built from Picks of `CalendarStore`, `HpcStore` and `RailBadgesStore`, with no cast.
- The overview draws the entry's arrow to routes and routes' arrow to its assets; every count and call list is a word node on its arrow, an exact test holds every drawing clear of labels across other arrows, and `npm run diagrams` no longer needs Node's type stripping and cannot fail on layout.
- `CommandCenterView`'s `anything`, the usage history rows, the next refresh time and six folds in Files, Slides and Pages are state functions with tests.

Verification on main after the fixes at landing, from `tools/oculus`:

- `npm test`: `Test Files  311 passed (311)` / `Tests  4884 passed (4884)`
- `npm run check`: `COMPLETED 1396 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`
- `npm run format:check`: `All matched files use Prettier code style!`
- `npm run lint`: exit 0
- `LC_ALL=C grep -rna '[^ -~]' src tests bin | wc -l`: 0
- `sh bin/size-check.sh`, `sh bin/folder-check.sh`: exit 0
- `node bin/revert-check.mjs tests/checks/imports/cycles.test.ts tests/checks/diagrams/diagrams.test.ts`: `59 reverts, 0 unproven, 0 unchecked`
- `npm run build` then `npm run test:browser`: `386 passed (6.1m)`

## The look

On the TEST page of the dev server on 8790, under vscode-dark-modern (Q73 changes no theme), the Help view with its nine diagrams (`[data-diagram]` count 9). Seen: the overview reads well, each count a word box on its own arrow, the entry's arrow to routes and routes' to assets drawn; `layer-server` draws counts of arrows between server folders outside the server box and its arrows tangle, as the reviewer measured (booked as Q74). The page was put back on References.

## What was found

The first review found the hand lexer still reading comments as code on some inputs and missing a markup `import()`, a reference directive with a leading attribute let through, a sampled label test that stepped over two real crossings, a layout search that could fail `npm test` on an unrelated import, and two view folds; the repair round closed each, replacing the lexer with the parsers and the edge labels with word nodes. The run over the round found the word nodes making the layer diagrams read worse (booked as Q74), a removed test case still guarding a property, a colon in an arrow's name breaking the label ownership rule, and an arrowhead check that missed a label it holds; the last three are fixed here. Every finding is under the Closed heading of `agents/reviews/Q73-refuter.md`.

The builder and both reviewers are ended: `ListAgents` lists no subagent of this session.

## Next

Q74 through /spec, then S2.
