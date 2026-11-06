# O166, the round-0 ruling on the cases

The builder's first run found two cases the brief's rules get wrong, read on main at feb1d1354:

- `lineMembers` and `domainMembers` (`src/lib/state/boards/structure/lines.ts:85-94`, `:190-199`) and the venue page's `venueUsers` over `realProjects` (`RegistryPageCard.svelte:74-79`) drop every project of a row with `archival: true`. `referrersOf` (`src/lib/state/forms/referrers.ts:129-131`) keeps them.
- A project with no `stage:` has the empty slice (`src/lib/state/boards/board/items.ts:168`, `facets.ts:205-207`).

## Ruling 1: the dead-ends button on a pillar's, a domain's and a venue's page (C13, item 2, decision 7)

Option B. On a pillar's, a domain's and a venue's page, the row and the record's board count every project whose `pillarIds`, `domainIds` or `venueId` names the record, the join `referrersOf` uses, so a dead-end project gets its `dead-ends` button and its board holds it. The card keeps its real members everywhere, its page included: its tags, the pillar metrics and the dormant look stay as on the Pillars, Domains and Venues views. The report's before-and-after names the page where the card's member count and the row's total differ, and by how many. Option A, counting as written so the button never appears on those three pages, was the lazy option. Option C was not taken: the page's card would show numbers that differ from the same card on its view.

## Ruling 2: a project with no stage (item 2, decision 7, C4)

Option a. A category's button counts only the projects that carry a slice; a project with no stage is counted in the total alone, and the board the total opens shows it. A category none of whose projects carries a slice gets no button. Option b, accepting a button whose board shows other projects than it counts, was the lazy option; option c, a new board key, is ruled out by decision 2.

## The other points of the hand-back

- `src/lib/views/shared/forms/entry/card/EntryFields.svelte` joins the path list for item 7. The column split is a decision of the brief, reversible: the prose fields in the left column; the short ones (people, pairs, tags, links, deadline, the Website group) in the right.
- `Settings.svelte` is at 520 lines: the reveal moves into a new file beside it, named in the report with its line count, and `Settings.svelte` does not grow.
- The reveal picks the scope from the asked row's layer: the Workspace scope for `layout.yml:rail`, as today; the primary hub's Hub scope for `behavior.yml:slurm.resource`. C6 is read that way at landing.
