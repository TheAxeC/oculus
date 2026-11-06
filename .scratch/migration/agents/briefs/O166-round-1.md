# O166, repair round 1

The review is `.scratch/migration/agents/reviews/O166-refuter.md` in the main checkout; read it whole first. Each item below is closed in this round. The brief, its cases ruling and the rules stand.

1. **B1, the repeated ask.** In `src/lib/views/system/workbench/reveal.svelte.ts`, the scope chosen for an ask is reset when that ask ends, so a second ask for the same row in a mounted Settings tab picks the row's scope again, as the base's rail reveal did for the rail row whenever its scope was not Workspace.
2. **S4, the superseded ask.** `show` ends only the ask it showed: after its awaits it removes the ask from the state only when the state still asks for that same row; an ask for another row written meanwhile is shown in its turn.
3. **B2, one project once.** `recordProjects` (or `namedProjects`) gives each project once, by its id, so a `related:` list naming one project twice, by key and hub-qualified, counts it once and the board shows the same number.
4. **S2, two head comments.** `src/lib/views/shared/card/pane-fold.ts:5-6` and `src/lib/views/shared/card/record/sets/ProjectCards.svelte:2-3` are rewritten to what calls them now. Both files join the path list.
5. **S4 and B3, the report.** The report states, for `RECORD_VIEW`, the tab id and the widened `reveal` ask, the empty, duplicated and colliding case and the in-flight, after-close and superseded path, each with what the code does. Its "User-visible changes" gains, page by page, the `dead-ends` button on every record page that has a dead-end project (funding scheme, organisation, resource, every other entry and the project page), and the project page's held dead-end related project moving from the Related line to that button.

S1 (`docs/palette.md`) is regenerated at landing by `npm run docs:palette`; S3 needs no change. Every edit is made with Edit and Write only. Then `npm run test:quick` once after the last change, the brief's checks 2 to 4 rerun, and the report rewritten to its final state with each item closed.
