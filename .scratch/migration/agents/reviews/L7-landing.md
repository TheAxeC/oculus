# L7 landing (2026-09-28)

Plan oculus/migration. Step L7, the rail and pages rebuilt to Axel's table. Next: Q94, the launch note removed.

## Open items

- Z11, Microsoft accounts: the university's IT has not answered on forwarding Axel's mail; the published UTwente calendar link waits for Q92's reader.

## Agents of the step

The builders and both reviewers had finished before the landing; `ListAgents` listed none of them (only the separate Ordo session).

## NOT DONE

Nothing of L7. The check at landing ran in headless Chrome on a built server on 8791, which is not the look; the look was owed and was taken 2026-09-28 on the TEST page, under "The look owed" below.

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

## The headless check at landing (not the look; light theme)

- Key sheet (`?`): the exact ranges above, no `v` row.
- Views catalogue: System `y1`-`y6`, Help `h1`-`h5`, every entry keyed.
- System page: Status to Gallery, Help, HPC how-to on the left; Research approach, Agent approach, Memories on the right.
- Position Leads, `applied` on the first lead: the Applications tab opened beside it, marked unsaved, with title, subtitle, url, deadline 2026-10-03 and status `not applied`. Nothing was saved.
- Reset of Incoming from the Pages view: "Reset Incoming to its arrangement?", then "Close this tab and lose its unsaved changes?" with "Tab: Applications, on Incoming."; Cancel left the page's six tabs as they were. The same from the rail's right-click Reset.
- Explorer: the right pane empty, reading "Files and documents you open on this page appear here."

## Next

`/spec Q94`, then Q92, Q89, Q79, Q80 and the queue of `plan.md`.

## The look owed, done 2026-09-28

On the TEST page of Axel's Chrome on 8790, light theme, unless a line says otherwise:

- Key sheet (`?`): the exact ranges f1-f3, m1-m7, p1-p3, e1-e5, s1-s3, c1-c6, l1-l3, r1-r4, t1, y1-y6, h1-h5, w1-w4, and no `v` row.
- Views catalogue (opened by `w1`): System y1-y6 (Status, Findings, Audit, History, Config, Gallery), Help h1-h5 (Help, Memories, Research approach, Agent approach, HPC how-to), Views and Settings w1-w4; every entry keyed.
- Pages view (opened by `w4`): Reset shown only on rail pages; TEST and Page 1 carry none.
- Position Leads (opened by `e3`): one `decline` per lead, "Show declined (35)", and `applied` on the first lead opening the Applications form beside it, marked unsaved, with the title, the institution, the URL and status `not applied`, as the brief sets. Cancel closed the form and the lead still offered `applied`.
- On Axel's Incoming page, as he asked: the Applications form opened from a lead, then the rail's right-click Reset: "Reset Incoming to its arrangement?" with "Rebuilt: Incoming."; after Confirm, "Close this tab and lose its unsaved changes?" with "Tab: Applications, on Incoming."; Cancel left the page's tabs and the form as they were. The form was then cancelled and the Applications tab closed. The hub's `applications/` and `feeds/` show no change (`git status --short -- applications feeds`).
- Reset of Incoming from the Pages view on TEST: the same first question; Cancel changed nothing.
- The System and Explorer pages as built, on a second server over the demo hub on 8791 (its own browser storage), since Axel's saved System page keeps its old layout until reset: System left Status, Findings, Audit, History, Config, Gallery, Help, HPC how-to, right Research approach, Agent approach, Memories; Explorer's right pane empty, reading "Files and documents you open on this page appear here."; eleven rail buttons in the table's order.
- Nothing found. On the demo hub the three document tabs draw their missing-file line, since the demo hub has no `docs/`, which `config/layout.yml` states as the designed behaviour.
