# L7 landing (2026-09-28)

Plan oculus/migration. Step L7, the rail and pages rebuilt to Axel's table. Next: Q94, the launch note removed.

## Open items

- Z11, Microsoft accounts: the university's IT has not answered on forwarding Axel's mail; the published UTwente calendar link waits for Q92's reader.

## Agents of the step

The builders and both reviewers had finished before the landing; `ListAgents` listed none of them (only the separate Ordo session).

## NOT DONE

Nothing of L7. The look was not on the TEST page of Axel's Chrome: the Chrome extension was not connected (`list_connected_browsers` returned an empty list), so it ran in headless Chrome with a scratch profile against a built server on port 8791 over an engine copy. Axel's server on 8790 was not touched.

## What landed

- `config/layout.yml`: eleven rail buttons, every view on one page, the Incoming and System pages, an empty pane on the Explorer page, and the `help` catalogue group (chord `h`: Help, Memories, Research approach, Agent approach, HPC how-to), which adds no rail button; those five stay on the System page.
- Where an opened tab lands: `state/workbench/layout/open/landing.ts`.
- Reset per page (Pages view and the rail's right-click menu) and Reset all pages (Settings). Each asks the reset's question, then the close question of each tab holding unsaved text, one at a time, with a line naming the tab and its page. A Cancel on any of them leaves every page as it was.
- Position Leads: one `decline` control; declined leads hidden behind the toggle; the `applied` control opens the Applications add form prefilled from the lead, and a saved form sets the lead to `applied`. State in `state/feeds/lead-application.ts`.
- HELP.md and `config/text/app.yml`: every chord row gives the exact range (`f1-f3`, `m1-m7`, `p1-p3`, `e1-e5`, `s1-s3`, `c1-c6`, `l1-l3`, `r1-r4`, `t1`, `y1-y6`, `h1-h5`, `w1-w4`); the `v1-v9` row is gone, since every view sits in a lettered group and `v` reaches none.

## What a reader sees differently

- A page already saved in the browser keeps its layout until its Reset or Reset all is pressed.
- The System catalogue section lists six entries (`y1`-`y6`); Help, Memories and the three documents are under Help (`h1`-`h5`).
- An applied lead offers no decline; declined leads are hidden by default; `applied` is shown on declined and expired leads too, and saving its form sets them `applied`.

## Fixes at landing (7)

1. The per-tab reset question named only the page: it now names the tab and its page, drawn by `CloseQuestion` with a new `detail` line; `HeldQuestion.svelte` is deleted.
2. The key-table cases accepted `x1-x9` for smaller groups: they require the exact range, and a case asserts no row for a letter that reaches nothing.
3. The head comment of `navigation/pages.ts` and `DESIGN.md:305` corrected.
4. The `readChord` comment in `navigation/catalogue.ts` corrected.
5. Three comment lines wrapped at column 100.
6. Diagrams regenerated; a second run changes nothing.
7. `allow-duplication.txt`: 15 reasons set to where the first shared window starts. 7 of them were already wrong at Q93's landing, whose booking said 0 were left; that count is corrected in L7's booking.

## Checks on main

`sh ~/.claude-work/skills/land/templates/verify.sh <state file>` from `tools/oculus`: Test Files 341 passed, Tests 5354 passed, `COMPLETED 1433 FILES 0 ERRORS 0 WARNINGS`, both builds, `All matched files use Prettier code style!`, `verify: 6 commands passed`. The per-tab case fails with the tab name removed from the question (1 failed, 43 passed); the key-table cases fail on a `y1-y9` row (2 failed) and on a `v1-v9` row (1 failed).

## The look (light theme; the step changes no theme)

- Key sheet (`?`): the exact ranges above, no `v` row.
- Views catalogue: System `y1`-`y6`, Help `h1`-`h5`, every entry keyed.
- System page: Status to Gallery, Help, HPC how-to on the left; Research approach, Agent approach, Memories on the right.
- Position Leads, `applied` on the first lead: the Applications tab opened beside it, marked unsaved, with title, subtitle, url, deadline 2026-10-03 and status `not applied`. Nothing was saved.
- Reset of Incoming from the Pages view: "Reset Incoming to its arrangement?", then "Close this tab and lose its unsaved changes?" with "Tab: Applications, on Incoming."; Cancel left the page's six tabs as they were. The same from the rail's right-click Reset.
- Explorer: the right pane empty, reading "Files and documents you open on this page appear here."

## Next

`/spec Q94`, then Q92, Q89, Q79, Q80 and the queue of `plan.md`.
