# Step O81 brief check (on main at ae4ee2de)

The brief says it was read on main at 6807fcd2. Since then main has one commit, and it touches only `.scratch/` files. `git log --oneline 6807fcd2..HEAD` printed `ae4ee2de Send O83's repair round 1`, and `git diff --stat 6807fcd2 HEAD` listed three files, all under `.scratch/migration/`. Brief read from disk at `/Users/axelfaes/workspace/oculus/.scratch/migration/agents/briefs/O81.md`. `LC_ALL=C grep -n '[^ -~]'` over the brief printed nothing.

## 1. Names

- `venue_categories`: `git grep -n "venue_categories" -- ':!config/local.yml'`. Hits outside "Paths this step writes" and outside the item 9 doc lines are listed below. The `.scratch/` hits are records of earlier steps and are not listed.
  - `config/catalogs/vocab.yml:4` (venue_categories is among the lists "replaced whole"): stays true, since the merge stays whole.
  - `config/options/catalogs/vocab.yml:4` (same rule, and word removal through a `from`): stays true.
  - `docs/HELP.md:524` (the same merge rule): stays true.
  - `docs/data-map.md:80` and `:186` (`category: vocab venue_categories`): stay true.
  - `docs/templates.md:888`, the help `"journal, conference, thesis or meeting."`: stays true.
  - `src/lib/data/helpers/hub-names.ts:701` (the comment saying the key is laid whole) and `:747` (the `HUB_LIST` row): stay true.
  - `src/lib/data/sources/config/merge/in-place.ts:76` `venue_categories: WHOLE`: stays true.
  - `tests/checks/config/config-folder.test.ts:241` (the key in the expected key list): stays true.
  - `tests/data/snapshot/normalise.test.ts:202` `from: 'vocab.venue_categories'`: stays true. `vocabKeys` (`src/lib/data/shapes/vocab-keys.ts:61-74`) reads a row's `key`.
  - Not a name hit, but made wrong by the change: `src/lib/data/shapes/vocab-keys.ts:205-213` `UNION_FIELD` names `focus_lanes`, `roles`, `categories`, `venue_tiers`, `radar_buckets`, `fund_stages` and `manifest_fields`, and not `venue_categories`. Once `venue_categories` holds rows, `unionWords` (`:229-262`) tells its rows apart by `JSON.stringify(row)` (`rowName`, `:216-221`). Two hubs that both name `journal` with different labels or ribbon flags then give two `journal` rows in `vocabOf()`. Item 5 and decision 6 read the sections from that union.
- `FoldHead`: `git grep -n FoldHead -- src config tests docs README.md`. Hits outside the paths:
  - `CareerPanel.svelte:6`, `:46` and `:196`: stay true.
  - `CommandCenterView.svelte:18` and `:200`, `Tasks.svelte:18` and `:87`: stay true.
- `GroupHead`: same grep. The only hits are bits-ui's `Command.GroupHeading`/`DropdownMenu.GroupHeading` (`ArgumentRows.svelte:111`, `MenuList.svelte:235`, `FocusFilter.svelte:169`, `PickMenu.svelte:139`) and `vscode-map.ts:107`. These are different names, so nothing collides.
- `roleBoard`, `boardOf`, `venuesByCategory`, `journalsOpen`, `conferencesOpen`, `venues.journals`, `venues.conferences` and `cards_group`: `grep -rn "roleBoard\|boardOf\|venuesByCategory\|journalsOpen\|conferencesOpen\|venues\.journals\|venues\.conferences\|cards_group" src config tests docs README.md --exclude=local.yml`. Every hit is in a written path (`career.ts`, `career-rows.ts`, `CareerPanel.svelte`, `venues.ts`, `Venues.svelte`, `Band.svelte`). The one exception is `config/text/views/boards/focus.yml:7` `cards_group: Funding | positions | teaching`, which the band keeps using. No hit in tests or docs.
- `FoldKey`, `foldOpen` and `foldToggled`: hits only in `focus.ts:682-699` and `Focus.svelte:62-68`, `:210-211`, `:252`, `:262`, `:272`, all in the paths.
- `venues.intro`: `Venues.svelte:106`, and `tests/checks/source/html-sites.test.ts:257` (`['a catalog key', "t('venues.intro')"]`). That test names the key only, so it stays true. The rewording has to stay HTML the `trusted` Intro takes.
- `track_record`: no hit anywhere. `section_other`: `board.section_other` (`projects.yml:69`, `facets.ts:211`, `Projects.svelte:243`) is another group, so the new `venues.section_other` does not collide.
- The Venues view's own sentences: `git grep -n -i "journals and conferences\|journal cards\|conference timing\|two disclosures\|month ribbon\|Venues view"`. Hits outside the paths:
  - `config/text/views/sources/files.yml:104` `make_collection_line_venues: The journals and conferences a project may aim at.`: not made false by this step, since theses and meetings were already categories.
  - `src/lib/views/sources/venues/Ribbon.svelte:2` and `VenueCard.svelte:2`: stay true.

Findings:
- `UNION_FIELD` in `src/lib/data/shapes/vocab-keys.ts:205-213` lacks `venue_categories`. Once the key holds rows, a workspace whose hubs give one key different rows gets two sections with the same key. This path is not in "Paths this step writes", and no premise or item names it. See section 6, input A.

## 2. The step line

Plan line `.scratch/migration/plan.md:827` (`grep -n "O81 the grouping" .scratch/migration/plan.md`), and the rulings it names (`plan.md:2759`, `:2763-2765`, `:2767`, `:2769`, `:2800`, `:2810`):

- "one heading for every grouping (the label in its colour at `--fs-md`, its count, a fold chevron before it, folding remembered)": item 1.
- "on a project board's category sections": item 2.
- "the Focus cluster and band headings": item 3.
- "and the Venues sections": item 5.
- "Career, Command center and Tasks keeping `FoldHead`": item 1 (the head comment), case 23 and verify 7.
- "the Venues view one section per word of `venue_categories` in its order": items 4 and 5.
- "a flag on the word drawing the month ribbon, set on `conference`": item 4 (`ribbon: true` on `conference`).
- "after O80": the brief's "What is on the tree" header says main holds O80. `plan.md:825` shows `[x] O80`, and `git log` shows `39b7b688 Land O80`.
- "a role row of the Focus career track record opens a transient board of exactly the projects it counts, one section per count line": item 6.
- Ruling 395 (a) (sections per word in place of `venuesByCategory`): item 5.
- Ruling 399 (a) (the ribbon flag set on `conference`): item 4.
- Ruling 400 (a) (the earlier heading with a chevron before it, folding and its memory kept): items 1 and 2.
- Ruling 401 (a) (one component for the board sections, the cluster headings and the band; Career, Command center and Tasks keep `FoldHead`): items 1 to 3.
- Ruling 403 (a):
  - The Venues sections take the heading: item 5.
  - The cross-link groups, Audit's muted findings and History's held changes keep `Disclosure`: no requirement. None of those files is in the write list, so they keep it unchanged.
- Ruling 423 (a):
  - The transient board, whatever boards exist, held by no `boards:` row: item 6.
  - "a row with nothing counted is plain": no requirement. It holds already, because `trackRecord` leaves out a role with no count (`career.ts`, `.filter((role) => role.lines.some((line) => line.count > 0))`).
- Ruling 434 (a) (rows `{ key, label, ribbon? }`, an "other" section last): items 4 and 5.
- Ruling "Steps O78 to O81" (O81 after O80): as for "after O80".

Findings: none.

## 3. Premises

- Premise 1: `grep -n "FoldHead\|folded" src/lib/views/boards/projects/Projects.svelte` printed `:53` (the comment), `:75` (the import), `:155`, `:212-214` and `:380-389`. `wc -l` gives 438. `cardSections` is at `facets.ts:318-330`, `toggleFold` at `:209-216`, and `state.ts:143` is `folded: []`. The heading CSS is at `:407-421`. Holds.
- Premise 2: `git show 1283d0ac^:src/lib/views/boards/projects/Projects.svelte` gives the `<h3 class="heading" style=--section...>`, `<span class="count">` and the CSS `display: flex; align-items: baseline; gap: 6px; margin: 0 0 8px; font-size: var(--fs-md); color: var(--section, var(--muted-txt))`, `.count { font-size: var(--fs-sm) }`. Holds.
- Premise 3: `grep -rln FoldHead src` printed `CommandCenterView.svelte`, `Projects.svelte`, `CareerPanel.svelte` and `Tasks.svelte`. Holds. The head comment runs `:2-17`; its list of users is `:2-12`.
- Premise 4: `Lanes.svelte` has 358 lines. `heading` is at `:238-247`, columns at `:251-262`, full_width at `:263-274` and `LaneHead` at `:200-206`. `focus_clusters` has `now`, `parked` (no glyph), `incubate` (columns) and `idea` (full_width). Holds. The Lane object carries `tone` (`focus.ts:248`, `toneOf(row.color)`), which is the hue name item 3 needs.
- Premise 5: `grep -n "details\|summary" Band.svelte` printed `130`, `131`, `133`, `180` and `184`. The markup is `<details class="cluster" open><summary><Surface inline>{t('focus.cards_group')}</Surface></summary>`, and Band.svelte has 310 lines. Holds.
- Premise 6: `grep -rn "foldOpen\|foldToggled\|FoldKey" src tests` printed `focus.ts:682`, `:688` and `:693`, and `Focus.svelte:62`, `:63`, `:68`, `:210`, `:211`, `:252`, `:262` and `:272`; no tests. Lanes is at `:310-318` and Band at `:304`. `CareerPanel.svelte:207-208` is `hidden={open ? false : 'until-found'}` and `onbeforematch={unfold}`. Holds.
- Premise 7: `venues.ts:181` holds `venuesByCategory` and `:183-184` the literals. `journalsOpen` and `conferencesOpen` are at `:25-26`, `:161-162` and `:171-172`. `venues.yml:8` holds `conferences` and `:17` `journals`. `grep -rn "venues.journals\|venues.conferences" src config tests docs --exclude=local.yml` printed `Venues.svelte:118` and `:156` only. The intro begins "Journals and conferences". Holds.
- Premise 8: `config/catalogs/vocab.yml:272` is `venue_categories: [journal, conference, thesis, meeting]`, with `venue_tiers`'s comment directly above it at `:271`. Options are at `:346-350` (`control: list`), `vocab.ts:471` is `z.array(text)`, `in-place.ts:76` is `WHOLE` and `hub-names.ts:747` maps the key to its file. Holds.
  - Side note: to give the key a comment of its own, the builder has to move the tiers comment so it sits over `venue_tiers:` at `:273`. That is one line past the stated range `lines 270-272`.
- Premise 9: `python3 -I` over the hub's `venues.yml` `entries` printed `76 Counter({'journal': 46, 'conference': 27, 'thesis': 2, 'meeting': 1})`. `grep -c venue_categories .oculus/config.yml` printed `0`, and a grep of `tests/fixtures/hubs/demo` printed no file. Holds.
- Premise 10: `hub-vocab.test.ts:188-210` lays `'venue_categories: [journal]'` and expects `['journal']` with `said(read)` empty. `config-folder.test.ts:241` is `'venue_categories',`. Holds.
- Premise 11: `career.ts` has 125 lines. `trackRecord` is at `:68-108`, not `:68-104`, and `roleBoard` at `:110-125`, not `:106-124`. The substance holds. In `career-rows.ts`, `boardOf` is at `:78` and `recordRows` at `:214-235`. In `CareerPanel.svelte`, `roleBoard` is passed at `:108-112` and `pick` is at `:160-170`. Holds.
- Premise 12: `openView` is at `opening.ts:152-170`, with a doc comment on `id`. `Person.svelte:5-13` has `group: '', listed: false`. `card.ts:112` is `client.layout.openView(view, { label })`, and tab words come from `instanceLabel(instance.state)` (`strip-tab.ts:47`). Holds.
  - Not stated in the brief, and it matters for item 6: the board's own writes go to the UI instance-state map (`ui.svelte.ts:463`, `setInstanceState`), while openView's `{ id, label }` lives on the layout's `instance.state`. So a board write does not drop the role.
- Premise 13: `views.ts:75-82` holds `moduleViewIds`, `:92-95` `pageBoards` and `taken`, and `:119-133` `registerBoards` with its loop that unregisters every view of `drawer.default` not in `wanted`. `selectors.svelte.ts` has 839 lines, with `boardPreset` at `:343-345`. The count hooks are in `src/lib/state/workbench/rail-badges/rail-badges.svelte.ts:155`, `:166` and `:322`; the brief names the file without its folder. Holds.
- Premise 14: `takes.ts:131-150` `boardTakes` reads the role through `projectRole` only while `context.self.size > 0`, which is the same `projectRole` that `trackRecord` uses. `roles.ts:96-103` holds `isMine`. Holds with one imprecision: `new-project.ts:88` is `offersNewProject(rule, context, hub?)`, while `offersNewProject(preset)` is the selector's form (`selectors.svelte.ts:211`, `:799`).
- Premise 15: `ls tests/checks/tree/boundaries.test.ts` shows the file exists. Holds.
- Premise 16: `docs/HELP.md:287` holds the cluster-heading sentence and the Track record sentence ("so Lead opens Projects, Supervisor Supervision and Collaborator Coauthor"). `:292` holds the board-heading sentence, `:217` is `| venues | Venues | The venue catalogue. |`, `docs/data-map.md:117` and `docs/templates.md:335-338` are as quoted, and `docs/apps.md:421` is the `hpc` row. The O79 brief lists `docs/templates.md`, `docs/data-map.md`, `docs/HELP.md` and `docs/apps.md` among its paths. Holds.
- Premise 17: `grep -n "FoldHead\|Venues\|track record\|venue_categories\|cluster" .scratch/migration/agents/guarded.md` printed `:158`, `:189`, `:245` and `:353-361`; none of them is about the headings, folds, Venues sections or track record. Holds as far as it goes. But it leaves out G124 (`guarded.md:183-185`), whose Code line names `src/lib/state/boards/board/` (`presets.ts`, `items.ts`, `new-project.ts`). The step writes `presets.ts` (the record preset of item 6). G124's text says "A board offers New project only when its rule takes the project the write makes". The record board's rule takes only a role (`tiers` null), so G124's rule would offer New project there, and decision 5 has it offer none (see section 4).

Findings:
- Premise 17 is incomplete. G124 covers `presets.ts`, which item 6 writes, and the record board departs from G124's stated New project rule. The brief names neither the entry nor the departure.
- The brief does not state the fact behind section 1's finding: `unionWords` keys rows by `UNION_FIELD`, and `venue_categories` is not in it.
- Line drift only: `trackRecord` is at `:68-108` and `roleBoard` at `:110-125`.

## 4. Cases and checks

- Cases 1, 3, 9, 11, 12, 13, 15, 16, 18, 21, 22 and 23: consistent with `spec.md`. A case that only a page shows names the look; the others are runs.
- Case 2: consistent. Its wording "each headed by `GroupHead` with its glyph and words" fits Parked loosely, since `focus_clusters` gives Parked no glyph (`vocab.yml:174`).
- Case 4: consistent with `spec.md` "No migration code". The key `career` is unchanged, so no conversion is involved.
- Case 5: consistent with the rules. Its check is weak (section 5).
- Case 6: consistent with "A behaviour that needs a DOM ... is seen at the look on landing". The O74 booking (`plan.md:810`) records that the find bar could not be driven at the look, so the proof falls back to reading.
- Cases 7 and 14 ("on the hub (scratch copy)", "on the scratch hub"): `spec.md` "Where you work" says "Four things read the real hub and nothing else, all read only" and names four test files. The brief does not say who makes the scratch copy or from where. A builder copying the hub's `venues.yml`, or the hub, for a case-run program reads the real hub outside the four named readers.
- Case 8: consistent with ruling 434 (a).
- Case 10: consistent in intent. But "the word not read" holds only for the reader that parses rows by shape. The hub layer applies the value whole and only adds the shape finding (`hub-layer.ts:583`, `:593-595`, then `setAt(config, path, value)` at `:599`). So `config.venue_categories` is `['journal']`, and `vocabKeys` would still offer `journal` in the venue form. The case leaves open which readers drop the bare word.
- Case 17: consistent. Its "tab keeps its role through every write" holds by construction (premise 12 note).
- Case 18 against G124: decision 5's "no New project" contradicts G124's text ("A board offers New project only when its rule takes the project the write makes"). Under `spec.md`'s test rule, G124's test (`tests/state/boards/board/board-rules.test.ts`, 'New project on a board') covers `presets.ts`, and the step changes that file. The brief does not say whether G124's text gains the record board's exception or whether the record board's New project is decided outside `offersNewProject`.
- Case 19: consistent with the rules. Its check is weak (section 5).
- Case 20: consistent with the rules. Its check allows a read only (section 5).
- The brief's checks:
  - Verify 5, `grep -rn "'journal'\|'conference'\|\"journal\"\|\"conference\"" src` "after the change prints nothing". On main it prints 8 hits outside the step, which no item changes, so the check cannot pass:
    - `src/lib/server/content/literature/sources/openalex.ts:41`, `semantic-scholar.ts:40`, `crossref.ts:38`, `wos.ts:35` and `scopus.ts:38`
    - `src/lib/data/model/model-search.ts:113`
    - `src/lib/views/feeds/literature/words.ts:89`
  - Verify 7, `grep -rn "FoldHead" src` expecting "CareerPanel.svelte, CommandCenterView.svelte, Tasks.svelte and FoldHead.svelte itself only". This contradicts item 1: GroupHead's head comment names `FoldHead`, so `GroupHead.svelte` will be a hit. `FoldHead.svelte` itself holds no "FoldHead" text today, since `grep -rln FoldHead src` does not list it.
  - Verify 10 uses `LC_ALL=C grep -n '[^ -~]'`. `spec.md` (the ASCII gate paragraph) says the perl gate "replaces the `grep '[^ -~]'` form wherever a brief or a check names it".

Findings:
- Verify 5 cannot print nothing: 8 hits on main fall outside the step.
- Verify 7's expected file list contradicts item 1 and the tree.
- Verify 10 names the grep form that `spec.md` replaces with the perl ASCII gate.
- Cases 7 and 14 imply a builder reading the real hub, which `spec.md` "Where you work" limits to four named readers. The brief does not say the orchestrator supplies the copy.
- Case 18 and decision 5 depart from G124's stated New project rule on a file G124 covers (`presets.ts`). Neither the brief nor `guarded.md` records the departure.
- Case 10's "the word not read" leaves open which readers drop a bare word. The merged config keeps it (`hub-layer.ts:599`), and `vocabKeys` would offer it as a venue category.

## 5. The question

"The goal" here is the part of the plan's goal this step delivers.

- Case 1: no. The look shows the heading, the chevron and the fold.
- Case 2: no, taken with the look. The run alone would pass with Lanes wired to other keys, since it hands `foldOpen`/`foldToggled` keys written by hand.
- Case 3: as case 2.
- Case 4: no.
- Case 5: yes. "The run" can hand-write `cluster:career` and `career` to `foldOpen`/`foldToggled` and pass while `Lanes.svelte` or `Focus.svelte` passes the bare cluster key. The check has to run the function that makes a cluster's key, the one the view calls.
- Case 6: yes. Reading `hidden="until-found"` and `beforematch` is no run, and the look may not be able to drive find-in-page (`plan.md:810`).
- Cases 7 to 13: no.
- Case 14: no, provided the run builds the items with the record preset through `boardItems` and `cardSections`. The look covers Projects picking that preset.
- Case 15: no.
- Case 16: no.
- Case 17: no.
- Case 18: no.
- Case 19: yes. `boardViews(source, catalog, taken)` takes `taken` as an argument, so a case-run that puts `track_record` in it passes even when the page's `taken` (`pageBoards`, `moduleViewIds`, `views.ts:75-95`) lacks the id. The check has to run `pageBoards`, as `tests/checks/config/arrangements.test.ts:43` does.
- Case 20: yes. "or a read of `registerBoards` ... quoted" lets it pass with no run. `registerBoards` can be run twice with different `given` views over a registry, as `arrangements.test.ts:43` and `keys.test.ts:69` do, to show the record view is still registered.
- Case 21: no, taken with the look. `careerRows`' target type today carries only `view` (`career-rows.ts`, `CareerTarget`). A run shows the role's target but not the `{ id, label }` state `pick` passes, which the look shows.
- Cases 22 and 23: no.
- The check on the step's line: the line names no check.
- Item checks:
  - Verify 1 to 4, 6, 8, 9 and 11: no.
  - Verify 5: cannot pass on any tree (section 4).
  - Verify 7: its expected output is wrong (section 4).
  - Verify 10: no, though it uses the replaced form.

Findings:
- Case 5's run can pass with the view wired to unprefixed keys.
- Case 6 rests on reading.
- Case 19's run of `boardViews` takes its `taken` set from the case-run, not from the page.
- Case 20 allows a read in place of a run that is possible.

## 6. Implied inputs

This is a code step. Inputs the step implies that `Cases` does not hold:

- A. Two hubs whose `venue_categories` rows share a key with a different `label` or `ribbon`, for example the primary `{ key: journal, label: Journals }` and a second hub `{ key: journal, label: Journal papers, ribbon: true }`. Today `unionWords` keeps both rows (`vocab-keys.ts:205-221`, no `UNION_FIELD` entry), so the section function gives two sections keyed `journal`. In a keyed `{#each}` that is a duplicate-key error, and the venues are drawn twice. Expected result: one Journals section with the first hub's row, as G127 states ("each word once with the row of the first hub that holds it"). That needs `venue_categories: 'key'` in `UNION_FIELD`.
- B. One `venue_categories` list naming a key twice, and a row with `key: ''`. `text` is `z.string()` (`common.ts:8`), so an empty key passes the shape and collides with the "other" section's key `''`. `spec.md` requires every key the step introduces to be checked empty, duplicated and colliding. Expected result: each a finding naming the hub's file and the row's place, the row not read, and one section per key with "other" alone under `''`.
- C. A saved `track_record` tab restored while the workspace names no `self`, or names a role that `roles:` no longer holds. `boardTakes` applies a role rule only while a `self` is named (`takes.ts:136`). With no `self`, the record board's rule takes every project, and the board would show every project in a record row. Expected result: the board shows no project and its empty message, matching the track record, which `trackRecord` does not draw without a `self` (`career.ts:75`).
- D. A `track_record` tab with no `id` in its state, from a stale layout. Expected result: an empty board saying it was opened for no role, as `Person.svelte`'s registration comment describes for a view opened bare.
- E. A `collections:` entry keyed `track_record`. Decision 4 allows the id to be held in either `moduleViewIds` or the `taken` set. Only `moduleViewIds` also keeps a collection view of that key from registering (`views.ts:155-163`). Expected result: the collection is left out with its existing finding, and the record view unchanged.
- F. Settings editing `venue_categories` after item 4 turns `control: list` into rows with a `ribbon` toggle. This is a visible change in the Settings view. Expected result: Settings shows the rows with key, label and a ribbon toggle; an edit writes rows to the hub's `config.yml` that read back with no finding; and the case names the Settings view in the look.

Findings: A, B, C, D, E and F are missing from "Cases".

## 7. ADRs

- No record. `ls docs/adr` printed `ls: docs/adr: No such file or directory`. `grep -c "adr" .agents/plan.yaml` printed `0`, and `.agents/plan.yaml` names `rules:` and `standards:` (`.scratch/migration/agents/spec.md`) and no `adr`.

Findings: none.

## 8. Dictated text

- "Fold <name>" / "Unfold <name>" (item 1, the fold control's name, the existing `focus.fold`/`focus.unfold` at `focus.yml:119` and `:150`): `grep -n '"Fold <name>"' .scratch/migration/agents/briefs/O81.md` finds `:36`. Holds.
- `<role label>: track record` (item 6 and decision 4, the record tab's words): `grep -n ": track record"` finds `:41` and `:109`. Holds. The wording is plain and ASCII and breaks no rule of `spec.md` "Prose".
- The labels `journal` (Journals), `conference` (Conferences), `thesis` (Theses) and `meeting` (Meetings) (item 4): `grep -n "(Journals)"` finds `:39`. Holds.
- The fold keys `cluster:<key>`, `lane:<lane key>` and `band`, and the five real keys `cluster:now`, `cluster:parked`, `cluster:incubate`, `lane:idea` and `band` (decision 2): `grep -n "cluster:<key>"` finds `:107`. Holds. They match `vocab.yml:173-176` and `:190`.
- `folded: string[]` (item 5, the Venues tab's state key): `grep -n "folded: string\[\]"` finds `:40`. Holds.
- The view id `track_record` (decision 4): ``grep -n '`track_record`'`` finds `:109`. Holds, and nothing on the tree uses the id (section 1).
- The text key `venues.section_other` (item 5): `grep -n "venues.section_other"` finds `:40`. Holds. It is a new key in the `venues` group, which lives in one file.

Findings: none.

## Declined to judge

- Whether a builder may read the real hub to make the scratch copy for cases 7 and 14, or whether the orchestrator supplies it. That is the session's reading of `spec.md` "Where you work".
- Whether G124's text should gain the record board's exception or decision 5 should change. That is a ruling for the session or the user.
- The overlap of O81's paths with the briefs in flight (O79, O83). The `spec` skill gives that comparison to the session. I read O79's list: it shares no file with O81's write list.
- I ran no test file. No premise needed a run, and I settled the shape and merge behaviour by reading `hub-layer.ts:560-600` and `in-place.ts:225-246`.

Agent usage: a5d05f8c3ea7e30b0, claude-opus-5-5, 269017 tokens, 92 tool uses, 11 min 20 s.

## Closed (the session's change to the brief for every finding above, and each dictated line added after the check, made before the preparation commit)

- 1, `UNION_FIELD` lacks `venue_categories`: item 4 has `UNION_FIELD` name `venue_categories: 'key'`; premise 18 states the fact; the path `src/lib/data/shapes/vocab-keys.ts` lines 200-213 added; case 24. Taken in automode as an internal widening the ruled design needs (choices.md Z1030).
- 3, premise 17 leaves out G124: premise 17 names G124, its Code line and its test; item 6 makes the record board's New project answer come from G124's rule unchanged, with a row of 'New project on a board'; decision 5 rewritten; the path `tests/state/boards/board/board-rules.test.ts` (that describe only) added; verify 2 runs the file (Z1030).
- 3, the union fact not stated: premise 18 added.
- 3, line drift: premise 11 reads `trackRecord` `:68-108` and `roleBoard` `:110-125`; premise 13 names `src/lib/state/workbench/rail-badges/rail-badges.svelte.ts`; premise 14 gives `offersNewProject`'s two forms and where the board's writes and the opener's state live.
- 3, side note on the `venue_tiers` comment: the `config/catalogs/vocab.yml` path range is lines 270-273.
- 4, verify 5 cannot pass: narrowed to `src/lib/state/sources/registries` and `src/lib/views/sources/venues`, the literature publication types named as staying.
- 4, verify 7's list: `grep -rln`, the three `FoldHead` users and `GroupHead.svelte` where its comment names it, no board, cluster, band or Venues file.
- 4, verify 10's form: the ASCII gate of `spec.md` in its perl form over the changed files, the grep form over the report only.
- 4, cases 7 and 14 read the real hub: "Where you work" names the orchestrator's scratch copy `o81-hub` (no `.git`, no `local.yml`), which cases 7, 14 and 26 read, and the builder never reads the hub itself.
- 4, case 18 against G124: closed with finding 3 above.
- 4, case 10's "the word not read": case 10 states what each reader does with a bare word, premise 19 states the hub layer applies the value whole.
- 5, case 5's run: it calls the one exported function that makes a grouping's fold key, the one the views call.
- 5, case 6 rests on reading: the look tries a find-in-page; where it cannot, the report and the landing say the case rests on the reading.
- 5, case 19: run through `pageBoards`.
- 5, case 20: `registerBoards` run twice over one registry, the record view's registration printed after each.
- 6 A: case 24. 6 B: item 4's key of at least one character, item 5's first row per key, case 25 (spec.md's rule asks what the code does, which the case states; no new finding word). 6 C: item 6's no-`self` board, case 26. 6 D: item 6's no-role message, case 27. 6 E: decision 4 holds the id in `moduleViewIds`, case 28. 6 F: case 29, the Settings view on the TEST page.
- Dictated lines added after the check: `venue_categories: 'key'` (item 4), a code line of `UNION_FIELD`'s shape: holds. No other line is dictated; the no-role message is worded by the builder.
