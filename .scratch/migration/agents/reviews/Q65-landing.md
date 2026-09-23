# Q65 landing

## Open items, verbatim from the state file

- O31's launch note from the plan skills (raised 2026-09-23 at O31's landing). The brief planned to change the plan-orchestration skill's launch recipes at landing to call oculus's `bin/dispatch-note.mjs`, but the plan skills name no project ("It carries no project name and no vendor name; those are in `.agents/plan.yaml`"), so they cannot call an oculus path: two rules clash. Options: (a) an optional key in `.agents/plan.yaml`, `launch_note:`, holding the command that records a launch (here `node tools/oculus/bin/dispatch-note.mjs`), which the launch recipes run at start, when the transcript is known and at the end, and skip when the key is empty; (b) leave the recipes as they are, so only a launcher that calls the script by hand records its builder. Recommended (a): it is the plan skills' own way to carry a project specific, and a Codex worker launched by the loop is the case the note exists for. (b) is the lazy option. Tonight's builders are Claude agents of this session, which the Agents view already draws, so nothing waits on it tonight.
- O31, a launched builder whose launcher dies before `end` (raised 2026-09-23 by O31's review, `agents/reviews/O31-refuter.md`, Spec 3). When the builder's own transcript is known, its row follows that session's own liveness, which the repair round builds. When no transcript was ever recorded, nothing in the ruled record says whether the builder still runs, so its row reads `running` for good. Options: (a) add the builder's process id to the record (`--pid` on `start`, checked the way `sessions/registry.ts` checks a registry pid), so a launch with no transcript is known dead once its process is; (b) leave the record as ruled, and a launch with no transcript and no `end` reads `running` until someone ends it. Recommended (a): the row otherwise tells the reader something false, and a pid is the one fact that answers it; it is one optional field and the writer already runs where the launcher knows the child's pid. (b) is the lazy option. O31 lands without it either way; (a) would be a small step of its own. Found at O31's landing: (a) also closes the one case the landing's rule leaves, a Codex launcher with a Codex builder, whose rows read done once both rollouts have been silent for two minutes.
- Q65, the work a hidden tab keeps doing (raised 2026-09-23 by Q65's review, `agents/reviews/Q65-refuter.md`, Behaviour). A pane now keeps every tab it has shown mounted, and a hidden tab does the same work as a shown one. Measured over one minute each on the served build (Q65-report.md, round 1, item 9): a hidden Files tab with four folders open re-read every open folder on one bookmark write, 9 requests, 0.42 to 0.44 s of server CPU and 4 `check-ignore` runs, the same as shown; a hidden Transcript following a line every 5 s made 24 requests and 25 socket frames and 127 ms of page work, against 211 ms shown. A running Terminal hidden is not measured, since the served test layer has no tmux. Repeated listings of one folder by several Files tabs within two seconds now share one `check-ignore` run (fixed at Q65's landing). Options: (a) a hidden tab defers its re-reads and its follow until it is shown again, and then catches up once, while a Terminal keeps its stream so no output is lost; (b) a hidden tab keeps working as a shown one does. Recommended (a): the work of a hidden tab has no reader, and its cost grows with every tab a reader has opened; (a) is a step of its own, since it touches the store and every view that follows. (b) is the lazy option.

Booked list: none.

## NOT DONE

Nothing in the brief. A running Terminal kept in a hidden tab was not measured, since the served test layer has no tmux; it is named in the third open item.

## What landed

Q65, cherry-picked from `.agents/worktrees/Q65` at base `fbe3c308` onto main by `tools/oculus/.scratch/migration/land.sh Q65 fbe3c308` (+2,424 -570 over 80 files before the Doc text).

- The Files view's header carries two toggles, `hidden files` and `ignored files`, off until pressed and kept per tab. They reach the server as `hidden=1` and `ignored=1`; the ignored names come from `git check-ignore --stdin -z` through `server/git/git.ts`'s one call site, and a folder listed again with the same entries within two seconds reuses the answer before.
- In development a component's stylesheet is served compiled whichever the page asks for first (`src/lib/server/core/style-first.ts`), which is the cause of the white page with serif text.
- A pane keeps the view of every tab it has shown mounted and hidden. A confirm left open in a hidden tab holds no workbench key and takes the keyboard again when its tab shows; the Map measures its labels again when it shows (`onShown` in `ui/shown.ts`).
- Save, Revert, Preview and the file's star share the pane's bar in a source tab; the Notes and Bookmarks heads draw their add control at all times; the refresher line reads `ok, last HH:MM, next HH:MM`; the Terminal bar's `new terminal` opens a tab with a terminal of its own; Transcript and Session open one tab per session.
- DESIGN.md and HELP.md carry the Doc text for all of the above.

## What was found

The first review found the blank page's cause undiagnosed, a confirm in a hidden tab blocking the workbench keys, tab-switch cases whose premise the step removed, a tenth git form outside the git module, and Map labels measured while hidden; the repair round closed each. The run over the round found two git gates that failed when run alone, a false head comment in `fs.ts`, `check-ignore` blocking the server once per folder per tab, and a confirm that kept no focus when its tab showed again; each is closed at this landing. The look on TEST found both Files toggles drawn the same pressed as unpressed; they are now drawn filled when on, with a case red under its revert. Every finding is under the Closed heading of `agents/reviews/Q65-refuter.md`.

## Verified on main

```
npm test -- --reporter=dot          Test Files 280 passed (280); Tests 4513 passed (4513)
npm run check                       COMPLETED 1299 FILES 0 ERRORS 0 WARNINGS
npm run build                       exit 0
npm run format:check                All matched files use Prettier code style!
npm run lint                        exit 0
the ASCII gate                      prints nothing
sh bin/size-check.sh                exit 0
sh bin/folder-check.sh              exit 0
npm run test:browser                311 passed (7.4m); files-sections.spec.ts again after the toggle fix, 9 passed
node bin/revert-check.mjs           git.test.ts 6 reverts, 0 unproven; duplication.test.ts 9, 0 unproven;
                                    kept-tabs and map specs 9, 0 unproven; files-sections spec 7, 0 unproven
ls -d $TMPDIR/oculus-* | wc -l      7015 before and after
```

## The look, on the TEST page

The dev server on 8790 was restarted with its dependency cache cleared, since the server context it builds at start holds the new ignored-names cache. The page draws in its dark theme with its own fonts. Files: both toggles in the header; pressed, the tree lists `.agents`, `.git`, `node_modules` and `.DS_Store`, and each toggle is drawn filled (after the fix above); both were turned off again. `icons.yml`: Save, Revert and the star in the pane bar, the YAML highlighted. Terminal: `new terminal` in the bar. Map: the graph with its labels. Usage: `refresher: ok, last 05:57, next 06:07` on both Claude accounts. A Usage tab opened through the palette stays on TEST.

## What is next

L3, alone.
