# L3 landing

## Open items, verbatim from the state file

None.

Booked list: 1, carried for O32: O32's launch recipes in the Ordo plan skills, waiting on the Ordo session.

## NOT DONE

- A page adopted by name on the first press of its rail button changes that button's badges from its arrangement's views to the adopted page's own views; this follows from the two rules as built and is not changed.
- The status words module sits under `state/workbench/navigation/`, since a module of its own under `state/workbench/` would put that folder over ten items.
- The light theme was not looked at; the look ran under the dark theme only.

## What landed

L3, cherry-picked from `.agents/worktrees/L3` at base `138afb83` onto main by `tools/oculus/.scratch/migration/land.sh L3 138afb83 --no-browser` (+7,985 -5,659 over 174 files before the landing fixes; the browser suite was run by hand afterwards).

- The rail is the thirteen buttons of `rail:` in `config/layout.yml`, each `{ label, glyph, page }` naming an arrangement, each showing its page, made the first time from its arrangement and kept as left. Each button draws the badges of its page's views in tab order, on a row under it. The page strip is gone. The digits 1 to 9 show the rail pages; the move keys are gone.
- The Views and Settings page holds the Views catalogue (every view and hub document under its `nav_groups` group, with the chords), the Settings view (theme, text size, CRT, wallpaper, glyphs, and the rail list saved to `layout.yml` through the write chain, with undo and a History kind) and the Pages view (show, rename, close, New page). A catalogue press opens on the page the reader came from; one moved onto another page opens there.
- A browser with no saved layout draws no page until the configuration names the first rail page, and starts on it.
- The status bar along the foot: server, usage, HPC, `live sessions: N`, `unsaved tabs: N`, each opening its view.
- One bookmarks list, `~/.oculus/bookmarks.yml`; `layout.yml`'s `bookmarks:` key is gone, and this machine's file holds the two manuals it carried.
- `.agents/plan.yaml` and the state file name the TEST page as shown from the Pages view.
- DESIGN.md and HELP.md describe all of the above.

## What was found

The first review found the server rewriting the tracked `layout.yml`, a fresh browser on a page no button owns, status words chosen for the tests, three rail parsers with an unknown glyph drawn, a duplicated Confirm block, untested toggles, the status bar placed as a view, and many false comments; the repair round closed each and built Axel's two rulings (badges on the rail, the catalogue opening on the page the reader came from). The run over the round found the manuals' move unbooked, the catalogue target read too wide, weak badge and catalogue cases, a Status page mounted before Focus on a fresh browser, and six stale comments; each is closed at this landing. The look found the badges drawn over the button names, fixed at landing. Every finding is under the Closed heading of `agents/reviews/L3-refuter.md`. The "sessions waiting count" in the badges open item was the orchestrator's wrong premise: no view badge carries one.

## Verified on main

```
npm test -- --reporter=dot          Test Files 292 passed (292); Tests 4611 passed (4611)
npm run check                       COMPLETED 1330 FILES 0 ERRORS 0 WARNINGS
npm run build                       exit 0
npm run format:check                All matched files use Prettier code style!
npm run lint                        exit 0
the ASCII gate                      prints nothing
sh bin/size-check.sh                exit 0
sh bin/folder-check.sh              exit 0
npm run test:browser                331 passed (7.7m), before the badge row fix; pages and rail
                                    specs after it: 14 passed
node bin/revert-check.mjs           the six affected node files: 64 reverts, 0 unproven; views,
                                    pages, layout and tabs specs: 25 reverts, 0 unproven after
                                    one directive was rewritten; pages spec after the badge row:
                                    9 reverts, 0 unproven
ls -d $TMPDIR/oculus-* | wc -l      7015 before and after
```

## The look, on the TEST page

The dev server on 8790 was restarted with its dependency cache cleared. Under the dark theme: no page strip; the thirteen rail buttons, Projects with 52 16 25 and Academic Life with 3 1 4 3 under their names after the fix (drawn over the names before it), Feeds 1, Info/more 71; the BOOKMARKS group with `settings.json`, `cathedra manual` and `game-engine manual`; the status bar reading `server: up`, `usage: ok`, `HPC: unreachable`, `live sessions: 4`, `unsaved tabs: 0`. The Views and Settings page drew the catalogue, Settings and Pages side by side. TEST was shown from the Pages view, Views and Settings pressed, and Usage pressed in the catalogue: TEST came back on screen with Usage activated on it. The Pages list also held rail pages this look did not open (Calendar, Inbox, Info/more, Sessions, Explorer), which Axel's other tab on the same server made, since the two tabs share the browser's storage.

## What is next

The plan is paused, as Axel asked. When he lifts the pause: L4, then Q66 and Q35.
