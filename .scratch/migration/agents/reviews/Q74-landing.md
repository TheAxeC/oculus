# Q74 landing

## Open items

None.

Booked: 4 (Q72, Q75, O33, O32).

## NOT DONE

Nothing of Q74's brief. The channels diagram, outside the brief, carries 178 pairs of arrows running along each other and reads badly (a trunk up the state cluster, a fan into views); booked as Q75, next in the queue.

## What landed

Q74, cherry-picked from `.agents/worktrees/Q74` at base `a48c7e98` by `tools/oculus/.scratch/migration/land.sh Q74 a48c7e98 <runs> --no-browser` (+3,150 -2,042 over 26 files), then fixed at landing (+252 -11 over 7 files), the browser suite run by hand. The commit follows this report.

- Each layer diagram is a column of the layer's folders; every count on an arrow between two folders stands inside the layer's box, halfway along its arrow; each folder draws its own dashed arrow to a box of each other layer it reaches.
- `arrowsAlong()` in `bin/diagrams/labels.mjs` names two arrows that run within 1.5 pt of each other for more than 40 pt, each piece of a curve at most 0.5 pt; `tests/checks/diagrams/readable.test.ts` holds the overview, the six layer diagrams and the writes diagram to none.
- The write diagram parts two arrows of one module that run together by giving the later a tail port of its own (`writesDrawn()`), and a pair it cannot part is left for the test to name.
- The channel and write readers blank comments through the TypeScript and Svelte parsers (`bin/diagrams/code.mjs`); the channel and write drawings came out unchanged.

Measured by the round's reviewer (pairs along / labels across): the overview 0/0; data, server, state, ui, shell, views 0/0 each, from 0, 28, 29, 7, 3, 41 pairs before; writes 0/0, from 1; channels 178/0, unchanged.

Verification on main after the fixes at landing, from `tools/oculus`:

- `npm test`: `Test Files  312 passed (312)` / `Tests  4901 passed (4901)`
- `npm run check`: `COMPLETED 1398 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`
- `npm run format:check`: `All matched files use Prettier code style!`
- `npm run lint`: exit 0
- `LC_ALL=C grep -rna '[^ -~]' src tests bin DESIGN.md | wc -l`: 0
- `sh bin/size-check.sh`, `sh bin/folder-check.sh`: exit 0
- `node bin/revert-check.mjs tests/checks/diagrams/readable.test.ts`: `19 reverts, 0 unproven, 0 unchecked`
- `npm run build` then `npm run test:browser`: `386 passed (6.5m)`, the case the round's reviewer saw fail once (`files.spec.ts:789`) passing

## The look

On the TEST page of the dev server on 8790, under vscode-dark-modern (Q74 changes no theme), the Help view with its nine diagrams (`[data-diagram]` count 9). Seen: `layer-state` draws its folders as a column inside the state box, each count on its own arrow inside the box, each folder's short dashed arrow to its own "data" box on the right; the server layer diagram, rasterised before the landing, reads the same way. The drawings are tall and narrow, and the box of another layer repeats per folder, as `HELP.md` says. The page was put back on References.

## What was found

The first review found the writes pair real and clearable by a port, a JSDoc at the end of a file still read as code, two behaviours of the comment blanking held by no case, the piece bound of the measure stated and not held, and an unused re-export; the repair round closed each and moved the counts halfway along their arrows. The run over the round found the port rule held only by the real hub's pair, a DESIGN sentence claiming more than the rule does, a re-export with no reader, and `Entry`'s doc comment stranded in the wrong file; each is fixed here. Every finding is under the Closed heading of `agents/reviews/Q74-refuter.md`.

The builder and both reviewers are ended: `ListAgents` lists no subagent of this session.

## Next

Q75 through /spec, then S2.
