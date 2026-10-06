# Q59 landing

## Open items, verbatim from the state file

Nothing is waiting on a ruling.

Booked list: three entries. Two of them are new here. The three landings that name no TEST-page look (Q30, Q45, D22) stay as they were. The two entries Q59 carried, the audits scan's three holes and the sixteen revert lines that prove nothing, are closed by this landing. Added: four lines of `plan.md` over the 400-character limit that file's own rule sets, each committed at an earlier landing in that state, which is the ledger's own hygiene rather than a step's tree work.

## NOT DONE

Nothing of the brief. One thing outside it is booked rather than done: the four over-length `plan.md` lines above.

## What landed

Q59, cherry-picked from `.agents/worktrees/Q59` at base `bdc6aad1` onto main by `tools/oculus/.scratch/migration/land.sh Q59 bdc6aad1`, which exited 0: +7,231 -4,207 over 551 files at that point, and the landing fix above on top of it. Nothing outside `tools/oculus/` is touched.

Every item of the brief, the list whole in `agents/briefs/Q59.md` and one row each in `agents/reviews/Q59-report.md`: the comment width of the whole tree with a check that holds it; the tree and tab-badge measures as tokens; the glyph catalog's orphans with a reader scan tightened to the four shapes the source names a glyph in; the browser cleanup moved out of the case bodies into `keepServedFiles()`, which also puts back the notes a case writes; the orientation cap; the unborn branch; the test scratch and the signal cleanup of `bin/revert-check.mjs`; the served run's layout in one helper; the sash reach measured at five device-pixel ratios and its sliver token; the six view findings; the four state findings; the seven test and document findings; the audits scan reading code alone with its floor held to what the scan still finds; the write timeout Axel ruled in, worded from `app.write_timed_out`; the project tab's absent-document tags Axel ruled in; the type-scale guard over `src/lib/ui`; and every revert directive of the tree pointed at the line its prose names.

## The tool the last gate broke on, and the fix

The whole-tree `node bin/revert-check.mjs` run crashed on main: `Error: ENOTEMPTY, Directory not empty: $TMPDIR/oculus-revert-ku84Ps at checkOne (bin/revert-check.mjs:439:9)`. This step moved each case's temporary directory inside the case's copy of the tree, so a child of the case that outlives it writes there while the removal walks the copy, and puts the path back after it has gone. `removeCopy` now retries inside one pass, takes the copy again while it keeps coming back, removes it once more as the run exits, and says `kept <dir>` rather than stopping the run. A case plants a test that takes the write bit off its own copy and reads the run's summary; its revert, the body back to the bare `rmSync`, turns it red. `node bin/revert-check.mjs tests/checks/bin/revert-check.test.ts` gives 18 reverts, 0 unproven, 0 unchecked, and `$TMPDIR/oculus-*` counts 7015 before and after it.

The first attempt at that case imported the script straight into the test, which pulled a plain-JavaScript file into `svelte-check`'s graph and turned 47 pre-existing "implicitly any" errors red; typing a 470-line script is not this step's work, so the case drives the script through its command line instead and `npm run check` reads 1284 files, 0 errors.

Nine copies that earlier runs of the older tool and one killed run had left in the system temporary directory were removed, which is why the count reads 7015 rather than 7022.

## What was found

Two reviews ran, both in `agents/reviews/Q59-refuter.md`. The first raised 22 findings over its four headings, the run over repair round 1 raised 8 more; all 30 are closed in the tree, none booked, each named with its closure under that file's Closed heading. The ones that changed what a reader sees: a tree row's controls and count now follow its name instead of the pane's far edge, the row's own space answers a press, and the row's words open while the pointer is anywhere over the row, through `Tooltip`'s new `over` prop; the write timeout's words come from the catalog for every surface that writes, not only the entry form; a picture that failed is asked for again at `&again=<n>`, named in DESIGN.md.

One fix was made at the landing, the one above: the cleanup of `bin/revert-check.mjs`, with its case and the repointing of the eighteen directives that name that file. Everything else was closed in the worktree before the cherry-pick.

## Verified on main

```
npx vitest run --reporter=dot       Test Files 274 passed (274); Tests 4452 passed (4452)
npm run check                       COMPLETED 1284 FILES 0 ERRORS 0 WARNINGS
npm run build                       exit 0
npm run format:check                All matched files use Prettier code style!
npm run lint                        exit 0
the ASCII gate (the brief's perl)   prints nothing
sh bin/size-check.sh                exit 0
sh bin/folder-check.sh              exit 0
npm run test:browser                291 passed (9.5m), on a tree whose src and config are
                                    identical to main's now (`diff -r -q`)
sh .../land.sh Q59 bdc6aad1         exit 0, all of the above in order
node bin/revert-check.mjs         over the files whose directives or targets this step moved
                                  after the clean whole-tree run: 19 reverts, 0 unproven, 0
                                  unchecked over comment-width, audits, add-forms and writes;
                                  18 / 0 / 0 over the tool's own test file
```

## The look, on the TEST page in vscode dark modern

The Focus board and the Files view were opened on the TEST page of the running server, never a page Axel works on. The Focus board draws its cards, lane bands and coloured accents as before. In the Files view a file row's star and open controls sit beside the name rather than at the pane's far edge, a section's count does the same, and resting the pointer on the row's empty space opens the row's words ("Open behavior.yml as a tab") while the name keeps its own button.

Axel's own dev server on port 8790 was serving every component's styles as the raw text of its `.svelte` file, so the page drew light surfaces in a dark theme and fell back to a serif font. Measured in the page: the layout's `<style>` held 1,307 characters and parsed to 0 rules, its text starting with `<`; `getComputedStyle(document.body)` gave `font: 16px Times`, `background: rgba(0, 0, 0, 0)`, `color: rgb(0, 0, 0)`. A dev server started fresh on another port from the same tree did the same, and one started with `--force`, which clears vite's dependency cache under `node_modules/.vite`, did not. The cache was removed and the server restarted: `layoutRules=2`, `font=-apple-system, ...`, `bg=rgb(24, 24, 24)`, `color=rgb(204, 204, 204)`, theme class `vscode-dark-modern`. The tree is sound; the cache was stale.

## What is next

The plan is paused after Q59, as Axel asked: nothing later is specced, dispatched or landed until he says to continue. The next in the queue is Q65 + O31.
