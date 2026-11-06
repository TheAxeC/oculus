# Brief check: O166

Usage: af52cf6c33a07ae89, claude-opus-5-5, 267934 tokens, 87 tool uses, 13.2 min

The brief check of O166 (`.scratch/migration/agents/briefs/O166.md`), read against main. Main's head was 74deadb1f at the check; `git diff --stat 2ba2827a3 HEAD -- src tests config docs README.md` printed nothing, so the tree the brief was written against is the tree on main. Nothing was edited.

Four findings needed a decision before dispatch:

- (A) C1 and C2 are tests of a new file, and `agents/guarded.md` has no entry for it. `spec.md:60`: a step that needs a new entry stops and asks Axel. `guarded.md:3`: "A new entry needs Axel's yes."
- (B) Item 4 and C6 have the setting tag open "Settings at that setting as `Referrers.svelte` opens it today". `Referrers.svelte` opens no setting (`:42`, `:43-54`, `:70-71`), and Settings reveals only the rail row (`settingsReveal`, `state/system/config/typed.ts:131`, read at `Settings.svelte:265`).
- (C) The only version of open item 710 in git (`git show ee78ced25:.scratch/migration/orchestrator-state.md`, lines 228-235) holds D1 to D6 and no D7, and differs from the brief on D2, D5 and D6.
- (D) `Listing.svelte` and `Career.svelte` draw through `RecordPage` and draw `GroupHead` bars; `RecordPage.svelte:2-3` calls them record pages; neither the step line nor the brief covers them.

## Names

Each hit outside "Paths this step writes", from `grep -rn '<name>' src tests config docs README.md --exclude=local.yml`:

- `Referrers`: `DeleteAsk.svelte:11,36-39,53-55` uses `referrersOf` and `entry_form.delete_used`; stays true. `tests/state/forms/referrers.test.ts` covers `referrersOf`; stays true. `referrers.ts:41-44` `listsReferrers` has one caller, `Entry.svelte:169`; if the tag line does not use it, it becomes an unused export that `spec.md:89` asks to remove, which the write range "lines 1-60, the head comment only" forbids.
- `GroupHead.svelte:81-82` ("A folder's files drawn under a heading of their own (views/shared/links/FolderFiles.svelte) take it through their `heading` snippet.") lies outside the range 70-80 and becomes false; the list runs `:64` to `:82`. O161 writes lines 49-57 of the same file; no overlap.
- `RecordPage`: `Career.svelte:17,45,149`, `Post.svelte:17,30,72`, `Listing.svelte:18,34,91` draw through the frame and do not break if the new props are optional. `Listing.svelte:29,108` and `Career.svelte:40,180` draw `GroupHead` bars.
- `CrossLinks`: `ArchivalCard.svelte:6`, `CardLinks.svelte:30`, `ProjectCard.svelte:28` stay true. `tests/checks/tree/allow-styling.ts:24-33` cites `CrossLinks.svelte:163` and `:169` in its `why` text; the entries are keyed on `line`.
- Fold keys: `Entry.svelte:197-198` keeps `folded` across a key change (`instanceFolded`); `instanceFolded` keeps other callers (`Editor.svelte:117`, `radar.ts:141`).
- `RadarCard.svelte:129,346` passes `projects={links}` (`crossLinksOf`, `state/feeds/radar.ts:126`): a Lit Watch paper's card draws a project strip, on its page too (`Entry.svelte:348-357`). Item 1 and Decision 5 say such a page holds no projects; false. `RadarCard.svelte` is not in the write list. `LeadCard` names no project.
- Words: `config/text/views/shared/entry-form.yml:1` becomes false (in the list). `config/text/views/boards/entry.yml:4,14,21-27` is not in the list.
- Docs: `docs/HELP.md:359` (the Person paragraph) becomes false; `:272` (the entry page's Website group) may under item 7. Check 6's grep finds neither.
- `src/lib/views/boards/projects/Projects.svelte` is also in O161's write list; the brief names no shared path.

## The step line

Every part of `plan.md:1719` and of ruling 710 maps to an item. Gaps: the set pages, Career and Post are neither in nor out; a setting and a keyless funding scheme have no page to open (`Referrers.svelte:36-40,70-73` draws both as words).

## Premises

Rerun on main; all hold except:

- (B) above.
- "A lead's and a Lit Watch paper's page hold no projects of their own" is false for the paper (`RadarCard.svelte:129,346`; `radar.ts:126-134`).
- `LineCard.svelte:94-106`: the metrics are `:90-103`.
- The base line "main at 2ba2827a3" is stale; src, tests, config and docs are identical.

## Cases and checks

- (A) above.
- C6 needs Settings' reveal, outside the write list.
- C11's first grep cannot print nothing (`listsReferrers`, `personReferrers`, `organisationReferrers` stay); a precise form is `grep -rn "Referrers.svelte\|<Referrers" src`.
- Check 6's grep prints only `HELP.md` 87, 298 and 310 and misses `:359`, `:307` and `:272`; O165 in flight rewrites `docs/HELP.md`, so line numbers will move.

## The question

Could each pass without the goal?

- C1: yes, if the test compares the count function with itself; it should assert literal ids per fixture record.
- C2: in part. Mine only is on by default (`state.ts:157`; `offersMine`, `:142-144`; `filter-menu.ts:243`), and Focus sets `mine` explicitly (`Focus.svelte:196`); a button reading "3 in flight" can open a board showing 2. A project in "other" with no `stage:` has no slice (`facets.ts:205`); none of the hub's 120 manifests lacks a `stage:`.
- C3: no; but no case checks the two-column layout of an `EntryCard` page.
- C4: yes; it does not state a project outside the user's team.
- C8: yes for the documents block: item 6's "each list is a plain list" lets a builder turn the document viewer (`Project.svelte:171-181`, `EntryFolder.svelte:104-114`) into a list of names.
- C11: yes; bars could return through `RecordDetails` or `RecordCounts`.
- Item 3: yes if the tab's `id` is not kind-qualified (`opening.ts:260,284-295` reuses a tab by `stateId`).
- Item 4: yes for the setting and a keyless scheme.
- Item 8: yes, for `GroupHead.svelte:81-82`.
- `npm run test:quick`: proves none of the goal.

## Implied inputs

1. A record whose projects include one the marked user is not on (Mine only): the board shows exactly the counted projects.
2. A person's "Projects of" and "Waiting on" tabs both open: two tabs.
3. Records of one key in two hubs: two boards.
4. Records of different kinds with one key: two tabs.
5. A record whose projects all sit in an archival row: `groupProjects` drops them (`cross-links.ts:274`), and with Referrers gone the entry page names none of them, though `referrersOf` lists them today.
6. A tab restored after the record was renamed or deleted: says gone.
7. A tab opened from the palette with no state: the empty line.
8. A second press with a search typed or another facet picked: not stated.
9. A funding scheme with no key: plain words.
10. A Lit Watch paper naming projects: drawn once on its page.
11. A hub `boards:` row keyed with the new view's id: the preset skips its own id as `awaitingPreset` does (`presets.ts:577`).
12. A project in "other" with no `stage:`.

## ADRs

`ls docs/adr` prints "No such file or directory".

## Dictated text

The six dictated strings are at brief lines 30, 31 and 33, ASCII, to go into `config/text`. "<n> projects" reads "1 projects" at one; `projectCount` (`src/lib/views/shared/card/card.ts:242-244`) gives the singular.

## Declined to judge

- Whether the set pages, Career and Post are inside "every record page".
- Which version of D2, D5 and D6 Axel agreed to.
- Whether one tag line meets D4's "tag lines by kind".

## Closed

- (A) Closed in the brief: no entry of `agents/guarded.md` covers a board's join (`grep -n "cross-links\|person.ts\|personJoin" .scratch/migration/agents/guarded.md` prints only `:196`, `lines.ts`'s `venueTierMark`), the Awaiting board has no test (`grep -n awaiting` over `board-views.test.ts` and `board-rules.test.ts` prints nothing), and a wrong count on a view is none of the costs a test exists for (lost work, a broken installation, a wrong configuration accepted). C1 and C2 become readings by the builder and looks at landing; the test file leaves the path list; checks 2 and 5 change with them. No entry is asked for.
- (B) Closed in the brief: Settings' rail ask (`reveal: 'rail'`, `typed.ts:78`, `Settings.svelte:53-55`, `:405-414`) is widened to name any row by its id, as `RAIL_ROW` (`state/system/config/groups.ts:63`) names the rail's; the setting tag opens Settings with the ask for the `slurm.resource` row. D4, as put to Axel, has each tag open its page; this is that page. `typed.ts` and `Settings.svelte` join the path list. A keyless funding scheme stays plain words, as today.
- (C) Closed: the text put to Axel (the transcript of this session, the message that raised items 710 and 711) holds D1 to D7 word for word as the brief's "Ruling 710" premise gives them, and `plan.md:3625` books "agreed, D1 to D7 as recommended". The state-file version read by the check was an earlier draft.
- (D) Closed: the same message defines "Record" as "every page of a project, person, pillar, domain, venue, dataset, funding scheme or compute resource". The set pages, Career and Post are outside the ruling; the brief says so, and their optional-prop compatibility is a requirement.
- `listsReferrers`: the range of `referrers.ts` widens to lines 1-60 whole, so an export the change leaves unused is removed.
- `GroupHead.svelte`: the range widens to lines 64-82.
- Lit Watch paper: item 1 and decision 5 corrected; the paper's page keeps its card with its project strip and draws no row, and `RecordCard`'s strip is dropped only on pages that draw the row.
- C11's grep: the precise form is used, and a third grep covers `RecordPage`, `RecordCounts` and `RecordDetails`.
- Check 6: the builder reads the HELP paragraphs of the project, person and entry pages (at the base `docs/HELP.md:272`, `:298`, `:307`, `:310`, `:359`) and names each sentence the change makes false, by its text, since O165 moves the lines.
- Projects.svelte: named as a path shared with O161 in the dispatch entry, judged simple to merge (O161 changes the grid call at `:276`; O166 adds a registration beside `:18-27` and the live ids beside `:155-172`).
- Mine only, the second press, the tab id, the archival row, the preset's own id, the documents viewer, the two-column look of an `EntryCard` page and `projectCount`: written into items 2, 3 and 6 and cases C4 and C12.
- The base line: updated to main at 250d09ec4.
