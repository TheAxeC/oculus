# Q69 landing

## Open items, verbatim from the state file

None.

Booked list: 4, carried for O32 (its skill half, waiting on the Ordo release that carries plan 2.B), Q70 (watchers under file-event load, and a browser boot that times out under load), Q71 (the architecture made sound) and Q72 (its re-read before the release).

## NOT DONE

- Axel's dev server on 8790 still runs the server code it started with: the sessions watcher is long-lived, so the fixes to it (the stamp that never waits, queued notices, the resumed subagent) reach the running cockpit only when that server restarts. It was not restarted, since it is Axel's. The fixed code was run read-only over the real transcript store instead (below).

## What landed

Q69, cherry-picked from `.agents/worktrees/Q69` at base `695861af` by `tools/oculus/.scratch/migration/land.sh Q69 695861af <runs> --no-browser` (+2,751 -1,143 over 50 files), then fixed at landing (+290 -107 over 15 files), the browser suite run by hand.

- The Views catalogue is never covered: a view moved out of the catalogue's pane leaves that pane showing the catalogue.
- A diagram's fetch is aborted when its Help view closes.
- The diagram tool, now `bin/diagrams/` run by `npm run diagrams`, follows a call through a local alias and a function passed by name, across modules too.
- A reused pid stamps its launch ended in the launch note, through the writer's own lock tried once and never waited for; until the stamp is written the sessions watcher holds the launch as ended and tries again at each scan. Before the fix at landing, a held lock froze the whole server for 2 s.
- Prose code paints no layer of its own over a wallpaper, so nothing around a wrapped code span is blurred; Help and hub documents draw on a tinted box.
- Six session views and the Terminal name the Sessions view, with an Open the Sessions view button, instead of the rail.
- The Agents view: a background subagent reads running until its completion notice, a notice that reached a busy session included; `killed` reads stopped; a subagent resumed after its notice reads running again; a launched builder counts from its start to its end.

## What was found

The first review found killed read as error, a notice matched by one id, the real launch shape without a case, a clash in the brief between item 3 and its decision 2 (resolved by revising the decision), the reused mark lost with the cache, and five proof gaps; the round closed each. The run over the round found that the round's stamp blocked the server for 2 s on a held lock, that a failed stamp could still flip a row, that a resumed subagent read done while it ran, and three smaller gaps; each is fixed at landing. The landing's look on real data found one more: a completion notice that reaches a busy session is recorded as the attachment of a queued command, which nothing read, so a stopped builder read done and the round's own reviewer read running; the fold reads it now, and the cache version is 4 so every transcript is folded once more. Every finding is under the Closed heading of `agents/reviews/Q69-refuter.md`. Also recorded: item 9 was already fixed by Q65's landing, which the orchestrator's check had wrongly called unbooked.

## Verified on main

```
npx vitest run --reporter=dot       Test Files 298 passed (298); Tests 4747 passed (4747)
npm run check                       COMPLETED 1369 FILES 0 ERRORS 0 WARNINGS
npm run build                       exit 0
npm run format:check                All matched files use Prettier code style!
npm run lint                        exit 0
LC_ALL=C grep -rna '[^ -~]' src tests bin | wc -l    0
sh bin/size-check.sh                exit 0
sh bin/folder-check.sh              exit 0
npm run diagrams                    docs/diagrams/ unchanged
npx playwright test                 384 passed, 1 failed (unsaved-forms.spec.ts:425 at boot, load average 15); that file alone 21 passed, three runs of three
node bin/revert-check.mjs           dispatches.test 27 reverts 0 unproven; watch/sessions.test 6 / 0; dispatch-note.test 20 / 0; dispatch-note-race.test 1 / 0; background.test 9 / 0; system.spec 8 / 0
scan() over ~/.claude-work/projects, read-only, cache in the scratchpad    "Refute Q69 repair round" done 2026-09-24T20:57:45Z; "Build L6 status bar" stopped; the first Q68 reviewer stopped
ls -d $TMPDIR/oculus-* | wc -l      7015 before and after
ListAgents                          no subagent listed
```

The browser failure is the boot timing booked in Q70, not a case this step touched.

## The look, on the TEST page

Under vscode-dark-modern and mocha, on Axel's dev server (the page code is served fresh; the sessions watcher is not):
- The catalogue with Usage already a tab of its own pane: Open on this page moved Usage to the other pane, and the catalogue's pane showed the catalogue.
- Help under mocha: 60 code spans, none with a fill or a backdrop filter; the wrapped `{label, glyph, page}` in the rail section drew crisp, the prose around it unblurred.
- The Terminal view with nothing picked: "No terminal is selected. Start one, or pick one in the Sessions view." and an Open the Sessions view button, which opened the Sessions view. The Agents view with no session picked: "No session is picked. Pick one in the Sessions view." with the same button.
- The Agents view with this session picked showed the old watcher's reading, which the running server keeps until it restarts; the fixed reading is the scan above.

Theme and page put back to vscode-dark-modern and References.

## What is next

Q70: the mail poller's folder watch, three watcher cases seen failing under a saturated fseventsd, a bookmark added by hand that does not reach an open page, and a browser boot that times out under load.
