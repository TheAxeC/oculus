# D77, part 9: the rail pages (open item 111)

Size: added to the full step D77 by Axel's ruling on open item 111 ("(a) Fold it into D77 (recommended). => yes"). Every rule of the brief, the launch prompt and `agents/briefs/D77-cases.md` holds for this part. Line numbers are as on main at the base abe5c9651.

## What is on the tree

- `config/layout.yml`: `rail:` (lines 9-22) holds twelve buttons, References eighth (`page: references`, glyph `venue`) and Present ninth; `nav_groups:` (25-38) gives `references` the chord `r` and `academic` the chord `c`; the `incoming` arrangement (89-105) holds Inbox, Lit Watch (`radar`), Position Leads, LinkedIn, Literature search and Literature in one pane and Calendar in a second; `academic` (121-130) six collection tabs; `references` (138-147) six tabs; `help` (153-161) holds Memories last.
- The views' groups: `literature-search` is `incoming` order 5 (`src/lib/views/feeds/literature/Literature.svelte:7-12`, its head comment says it follows the Calendar "so the chords of the views before it stay"), `radar` `incoming` order 1 (`src/lib/views/feeds/radar/Radar.svelte:5-10`), `memories` `help` order 1 (`src/lib/views/personal/memories/Memories.svelte`); the collection `literature` is `incoming` order 6 and every unplaced collection falls back to `references` (`src/lib/views/boards/collection/Collection.svelte:9-26`); Venues and Data name `references` (`src/lib/views/sources/venues/Venues.svelte`, `src/lib/views/sources/data/Data.svelte`).
- The key help row (`config/text/app.yml:26`) names "e1-e6 | ... Incoming", "c1-c6 | ... Academic Life", "r1-r4 | ... References" and "h1-h9 | ... the Memories wall".
- The collection label `tasks: Tasks & Service` (`config/text/views/boards/collection.yml:66`); the demo hub fixture `tests/fixtures/hubs/demo/records/tasks.yml:1-4` says "Tasks & Service"; the hub's `tasks/tasks.yml:1` says "Tasks & service".
- Free chord letters: `l` is Pillars; `i`, `j`, `k`, `o`, `g`, `n` are keys of their own (`config/text/app.yml:26`); `b` is used by nothing.
- A unique view an arrangement names is moved into a page made from that arrangement from the page that holds it (`withPage`, `rebuiltPage`, `resetAll` and `startedOn` in `state/workbench/layout/open/float/pages.ts`, DESIGN.md "Unique views"); a saved page keeps its saved tabs until Reset (DESIGN.md "Workbench pages" and the arrangements comment of `config/layout.yml`).

## What to build

1. **A Literature rail page** (Axel: agreed (a)): page key `literature`, label "Literature", chord prefix `b`, placed right after Registries, so pages 1 to 8 keep their digits and Present loses its `9` (Axel: agreed). Its arrangement is a split row, sizes `[0.6, 0.4]`: the left pane Literature search then Lit Watch, the right pane Literature (Z894), every tab pinned. The three views' group becomes `literature`, in that order (`b1`, `b2`, `b3`); they leave the Incoming arrangement and group, whose remaining views keep their order (Inbox, Position Leads, LinkedIn, Calendar). The glyph of the rail button and of the group heading are existing glyph names (the group heading's one no view of the group carries, as `nav_groups:`' comment requires).
2. **References renamed Registries** (Axel: agreed): page key `registries`, label "Registries", chord `r` kept; every view and the collection fallback that name the group `references` name `registries`. The Explorer's References view (Find All References) is unchanged.
3. **Tasks & Service renamed Tasks** (Axel: agreed): the collection label, the demo fixture's header and title. The hub's own `tasks/tasks.yml` line 1 is the user's data: the builder writes its new first line into the report's "Doc text" section ("# Tasks - standalone to-dos that are not a paper/project: reviews, admin and committee work.", or the file's wording with "& service" taken out), and the orchestrator applies it at landing.
4. **Memories on Academic Life** (Axel: "Yes, this is the case, lets do this"): group `academic`, last, so `c` then `7`; the last tab of the `academic` arrangement; out of the Help arrangement and group, the Help group's documents moving up one digit.
5. **The words**: the key help row of `config/text/app.yml:26` (the new `b1-b3` Literature row after the Registries row, `e1-e4`, `c1-c7`, `r1-r6` as the group holds, `h` without the Memories wall), `HELP.md` wherever it names Incoming's, Academic Life's, References' or Help's views or chords, the head comments of the moved views (`Literature.svelte`, `Radar.svelte`, `Memories.svelte`, `Collection.svelte`), `DESIGN.md` where it names these places, and `docs/palette.md` as `npm run docs:palette` writes it.
6. **Saved layouts**: a page renamed (References to Registries) or new (Literature) is made from its arrangement on its first open, and the unique views it names move into it as the tree already does; the saved Incoming, Help and Academic Life pages keep their saved tabs until Reset, with no code that rewrites a saved layout (the rules file's "No migration code"). The report states, with the run that shows it, what Axel's saved pages show after the change and which Reset gives each the new arrangement.

## Cases

30. The rail: thirteen buttons, the ninth Literature, the eighth Registries; `b1`, `b2`, `b3` open Literature search, Lit Watch and Literature; `r1` opens Venues; `c7` opens Memories; `e1` to `e4` open Inbox, Position Leads, LinkedIn and Calendar in that order (a unit run of the catalogue and the chords).
31. A fresh layout: the Literature page holds the three views in the arrangement above; Incoming holds none of them; Help holds no Memories (a unit run of the arrangements).
32. A saved layout with Literature search on Incoming: opening the Literature page moves it there when the view is unique, and the report says which of the three are unique and what happens to one that is not (a unit run).
33. `docs/palette.md` and the key help row name the new groups and chords (`npm run docs:palette`, a reading).
34. The look: the rail, the Literature page, Registries, Academic Life with Memories, the Collection label "Tasks".

## Paths this part adds

- `config/layout.yml`, `config/text/app.yml`, `config/text/views/boards/collection.yml`
- `src/lib/views/feeds/literature/Literature.svelte`, `src/lib/views/feeds/radar/Radar.svelte`, `src/lib/views/personal/memories/Memories.svelte`, `src/lib/views/boards/collection/Collection.svelte`, `src/lib/views/sources/venues/Venues.svelte`, `src/lib/views/sources/data/Data.svelte`
- `tests/fixtures/hubs/demo/records/tasks.yml`, and each test whose expected chords or groups the change moves (named in the report, run on the unchanged tree first)
- `HELP.md`, `DESIGN.md`, `docs/palette.md`
