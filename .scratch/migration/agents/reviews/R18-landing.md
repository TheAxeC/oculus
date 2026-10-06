# R18 landing

## Open items, verbatim from the state file

None.

Booked list: none.

## NOT DONE

- No case proves that `Diagram.svelte` hands each fetch's stop to its effect's cleanup. The node tests render components on the server, where effects do not run, and in the running app neither path the cleanup guards can be observed (a changed manual remounts every figure; an answer after close changes nothing a page can see). The helper it calls, `newestAnswer`, is proven by two cases.
- A call through a parameter or a local alias is not followed by the write reader; the head comment of `bin/diagrams.mjs` and the Doc text say so.
- The standalone `.svg` under a dark colour scheme was not looked at again after its dark ground was added; the case holds the rule in the file.
- The light theme was checked by computed colour, not by picture: the browser window reported itself hidden, and the capture tool moved the Help pane's scroll with each capture and click, so its pictures stopped matching the page.

## What landed

R18, cherry-picked from `.agents/worktrees/R18` at base `bb4e25a0` onto main by `tools/oculus/.scratch/migration/land.sh R18 bb4e25a0` (+6,973 -28 over 28 files before the landing fixes).

- `node bin/diagrams.mjs` reads the source and writes `docs/diagrams/layers`, `channels` and `writes`, each as a Graphviz `.dot` file and the `.svg` rendered from it by `@viz-js/viz` 3.30.0 (a pinned dev dependency, no system install). What a reader cannot place or follow is drawn with its file and line in a dashed group named "not placed"; a module the write trace reaches that writes nothing is in a dashed group of its own.
- `tests/checks/diagrams/diagrams.test.ts` fails, naming every stale file, while a committed diagram differs from the source.
- The Help view draws the three diagrams inline in the page's text colour, read through `api/diagrams/<name>.svg`, which serves only a `.svg` file directly inside the engine directory's own `docs/diagrams/` and refuses a same-origin miss, a bad name, a link and a linked folder. An edge's title names the functions it calls. Outside oculus each file draws in its own greys.
- The one-off migrations moved to `bin/migrations/`.
- HELP.md gains "How the code fits together" with the three diagrams; DESIGN.md shows each beside its section and names the route, the generator and the folder.

## What was found

The first review found the write diagram cutting ten placed modules without saying so, readers skipping what they could not follow, the after-close and superseded guard unproven, the manual gate read by a regex, a linked docs folder served, the stale test stopping at its first file, two SVG profiles repeating each other, edge names lost in the Help view and the files unreadable in a dark viewer; the repair round closed each. The run over the round found the readers still dropping six patterns and the Doc text claiming more than the code, three lost paths with no case, one directive changing two things, and a standalone file drawn light on white under a dark scheme; each is closed at this landing, except the component wiring above. Every finding is under the Closed heading of `agents/reviews/R18-refuter.md`.

## Verified on main

```
npm test -- --reporter=dot          Test Files 282 passed (282); Tests 4552 passed (4552)
                                    (the run before it: watch/git.test.ts "reads a root added to the
                                    workspaces file while it is running" failed once right after the
                                    browser run, passed alone three times out of three)
npm run check                       COMPLETED 1309 FILES 0 ERRORS 0 WARNINGS
npm run build                       exit 0
npm run format:check                All matched files use Prettier code style!
npm run lint                        exit 0
the ASCII gate                      prints nothing
sh bin/size-check.sh                exit 0 (bin/diagrams.mjs 899 lines)
sh bin/folder-check.sh              exit 0
npm run test:browser                317 passed (8.8m)
node bin/diagrams.mjs, twice        identical bytes
node bin/revert-check.mjs           diagrams.test.ts 25 reverts, 0 unproven; with help.test.ts and
                                    system.spec.ts 39 reverts, all red after one directive repointed
ls -d $TMPDIR/oculus-* | wc -l      7015 before and after
```

## The look, on the TEST page

The Help view on TEST, dark theme (`vscode-dark-modern`): the three diagrams under "How the code fits together", each drawn in the prose colour `rgb(204, 204, 204)` with no `<style>` left in the page; the layer diagram 5,352 px wide in a 1,348 px pane, scrolling sideways and dense (361 edges); the channel diagram reads cleanly; the write diagram shows its dotted arrows and the "reached, writes nothing" group. Light theme (`vscode-light-modern`): each diagram takes `rgb(59, 59, 59)` on a transparent ground, read from the page. The theme was set back to dark afterwards.

## What is next

L3 and O32 side by side.
