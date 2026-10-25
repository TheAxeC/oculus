# O76 builder report: the Pillars view's text made true and short

Everything in the brief is done.

## Open items of the state file, verbatim

From `.scratch/migration/orchestrator-state.md`, section "## Open items" (read with `awk` from line 166 to the next `## `):

- 364 (2026-10-25, step O75, its paths; `agents/reviews/O75-brief-check.md` Names findings 1 to 5 and Implied input 6; ruling Brief check scope, a widening of the step's paths). Three parts, each a set of files the step needs that its paths do not hold. (1) Sentences the step makes false outside its paths: the category and stage facets named in `src/lib/data/shapes/boards/categories.ts:4`, `config/catalogs/vocab.yml:52` and `:214`, `docs/HELP.md:523` and the title of `tests/state/shared/hub-words.test.ts:80`; the board statistics in `config/catalogs/vocab.yml:91`, `src/lib/data/shapes/catalog-files/vocab.ts:143` and `:280`, `config/options/catalogs/vocab.yml:18` and `config/options/behavior.yml:170`; the Authors column in `src/lib/state/boards/board/team.ts:4` and `items.ts:4`; Mine only drawn only where it changes the board in `config/catalogs/vocab.yml:206`. (a) The paths widen to these lines and the step makes each true. Pros: no false sentence ships; each is a line of text. Cons: 13 more places in the step. (b) Left as they are. Cons: 13 sentences that say what the board no longer does. Recommended (a); (b) is the lazy option. (2) The stage flag `submit_ready`: once the totals line goes (ruling 351 (a)), nothing reads it (`stats.ts:85` is its only reader; no hub file writes it). (a) The flag is removed: its line on the `submit-ready` stage in `config/catalogs/vocab.yml:71`, its description at `:60`, `src/lib/data/shapes/catalog-files/vocab.ts:118` and `config/options/catalogs/vocab.yml:57-58`. Pros: the vocabulary holds no flag that decides nothing. Cons: a hub that wrote it later would get an unknown-key finding. (b) The flag kept with no reader, its three descriptions rewritten to say it decides nothing. Cons: a setting that does nothing. Recommended (a); (b) is the lazy option. (3) A picked pillar in its own colour, which ruling 348 (a) names: a board item's pillar tag carries no colour today (`BoardTag`, built in `src/lib/state/boards/board/items.ts`). (a) The paths widen to `items.ts` and `BoardTag`'s type, so a pillar with a `color` is drawn in it when picked. Pros: the ruling is carried out whole. Cons: one more file; no pillar of this hub writes a `color` today, so nothing changes on screen until one does. (b) Picked pillars drawn in More's cyan. Cons: against ruling 348 (a). Recommended (a); (b) is the lazy option. O75 is not dispatched until you rule. Parts (1) and (3) ruled (a) by Axel (2026-10-25, "364 (1) (a)", "364 (3) (a), and I would like for you to also add colors to the pillars of this hub"); (b) was the lazy option of each. The hub's nine pillars carry a palette `color` in `.oculus/data/pillars/pillars.yml` (blue, teal and rose for the three pillars; purple and indigo for the provisional lines; lime, mauve, dark cyan and slate for the off-pillar lines), on disk in the hub and not committed, since that file holds two other uncommitted lines. Part (2) open: Axel asked (2026-10-25) "isn't submit-ready, along with in-prep, kind of important?". The answer given: the stages `submit-ready` and `in-prep` stay, with their labels, colours and flags; under O75 each is a slice of line 1 of the bar with its own count ("submit-ready 2") and its stage colour, pickable to show those projects alone. Only the flag `submit_ready` would go, whose one reader is the "<n> submit-ready" count of the totals line that ruling 351 (a) removes (`stats.ts:85`, `Stats.svelte:37`). (a) remove the flag, (b) keep it with no reader, as above; (c) keep the flag and draw "<n> submit-ready" as a count on the controls beside "16 projects", so the number is seen without opening the slices. Recommended (a), a judgment: the slice already shows the count in the stage's colour. (b) is the lazy option.

## The cases' first read, on the unchanged tree

Read before any change, from the base files (`cat -n config/text/views/structure/pillars.yml`, the four Pillars files, `lines.ts` 1-160, `RegistryCard.svelte:79`, `Tooltip.svelte`, `VenueCard.svelte:208`). No case is one the brief's own rules get wrong.

1. The intro read "The research pillars, and any <b>provisional</b> line below them, from the file the <code>pillars</code> entry ... A project joins a pillar through its <code>pillars:</code> method tag." (`pillars.yml:7`). It is not the ruled sentence.
2. The counts row (`LineCard.svelte:74-84` at the base) was a bare `div.metrics` with no tip of any kind: no Tooltip, no `title`, no tab stop. A pillar card, a provisional card (not muted, `Pillars.svelte:123-134`) and a card with 0 in flight all drew the row and showed no tip. An off-pillar card (`muted`, `Pillars.svelte:163`) drew no `.metrics` row (`{#if !muted}`).
3. With orphans the card read "Real work with <b>no</b> <code>pillars:</code> tag yet; everything should map to a pillar or an off-pillar line. Tag it, or ..." (`pillars.yml:14`); with none, "Every project maps to a pillar or an off-pillar line." (`pillars.yml:9`), false while personal projects and dead-ends are left out of the card (`lines.ts:117-120`).
4. The Archival card read "Dead-ends (failed / stopped), kept for provenance and excluded from pillar membership." (`pillars.yml:5`).
5. The Off-pillar note read only "Deliberately outside the current programme, kept as an explicit marker so this work files here rather than reading as an orphan." (`pillars.yml:12`). An off-pillar card drew its "<n> projects" Tag (`RegistryCard.svelte:79`, `<Tag label={projectCount(projects.length)} />`) and no in-flight or tier row (`LineCard.svelte:74`).
6. Against the code: the intro's "method tag" and "map to no pillar, provisional line or off-pillar line" wording, the Orphans note's "no `pillars:` tag" (an orphan may carry a `pillars:` that names no line; `normalise.ts:278` reads it, `links.ts:163` keeps only known ids), "Every project maps to a pillar ..." (false for personal projects and dead-ends), "excluded from pillar membership" (true in substance), `untagged` (false for such an orphan) and `provisional_note`'s trigger sentence (no trigger field in the pillars schema, per the brief) were the false or loose places; `OrphansCard.svelte:2-3` and `LineCard.svelte:105` were false as the brief says.
7. The Orphans tag read "<n> untagged" (`pillars.yml:20`, drawn at `OrphansCard.svelte:30` at the base).

## DONE / NOT DONE

| Item | State | Proof (command and output) |
| --- | --- | --- |
| 1 Intro, word for word | DONE | `git diff config/text/views/structure/pillars.yml`: `+        intro: "The research pillars and the projects on each, from the pillars file the <code>pillars</code> entry of the hub's collections list names; a project is on a line when its manifest's <code>pillars:</code> names it."` Drawn at `Pillars.svelte:85`. Look on landing is its on-screen proof. |
| 2 Tip on a card's counts | DONE | `pillars.yml:6` `counts_tip: 'in flight: projects at a live stage; venue tiers: the venues of those projects'`; `grep -n "if !muted\|<Tooltip\|</Tooltip>" LineCard.svelte` prints `76: {#if !muted}`, `77: <Tooltip text={t('pillars.counts_tip')} focusable>`, `88: </Tooltip>`. Pointer and keyboard behaviour: look on landing. |
| 3 Orphans note, word for word | DONE | diff line `+        orphans_blurb: Projects whose <code>pillars:</code> names no line of the pillars file. Personal projects and dead-ends are never orphans.` |
| 4 Archival note, word for word | DONE | diff line `+        archival_blurb: Dead-ends (failed or stopped), kept for provenance; they count toward no line.` |
| 5 Off-pillar note, ruled sentence added | DONE | diff line `+        offpillar_note: Deliberately outside the current programme, ... rather than reading as an orphan. Off-pillar lines carry no in-flight or venue-tier counts.` `RegistryCard.svelte` unchanged (`git status --short` does not list it). |
| 6 Other words made true | DONE | diff lines `no_orphans_blurb: Every project but personal projects and dead-ends is on a line of the pillars file.`, `untagged: '{0} on no line'`, `provisional_note` without its trigger sentence; comments in `OrphansCard.svelte:2-4`, `LineCard.svelte:109-111`, `ArchivalCard.svelte:3`, `LineCard.svelte:2-4` (table below). |
| Cases 1 to 7 | DONE by reading; on-screen proof is the look on landing | Second read below. |
| Verify 1 `npm run diagrams && npm run test:quick` | DONE | Exit 0. Summary lines: `ok prettier (0.7 s): All matched files use Prettier code style!`, `ok ASCII gate (0.8 s)`, `ok svelte-kit sync (2.5 s)`, `ok eslint (38.1 s)`, `ok svelte-check (51.4 s): ... 537 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`, `test:quick: 54.2 s; every command passed`. It ran `0 test file(s)`: no test imports a changed file. |
| Catalog reader check for the new key | DONE | `npx vitest run tests/checks/source/keys.test.ts --reporter=dot`: `Test Files  1 passed (1)`, `Tests  10 passed (10)`; it holds 'has a reader for every catalog key'. |
| Verify 2 unused exports | DONE | `sh utils/unused-exports.sh > <scratchpad>/o76-unused.txt; diff .agents/worktrees/O76-base/unused-exports.txt <scratchpad>/o76-unused.txt` prints nothing, exit 0 (343 lines both). No export added. |
| Verify 3 prose read | DONE | Section "Prose read" below. |
| ASCII of touched files | DONE | `LC_ALL=C grep -n '[^ -~]'` over `pillars.yml` and the four Pillars files prints nothing (exit 1). |
| History words in added lines | DONE | `git diff -U0 \| grep '^+[^+]' \| grep -i -E "\bbefore\b\|used to\|no longer\|\bstill\b\|always has been\|always had\|as before\|previously\|the step adds\|after this package\|\bO[0-9]+\b\|\bZ[0-9]+\b\|20[0-9][0-9]-"` prints nothing (exit 1). |

The step adds or changes no test.

### Second read of the cases, after the change

- Case 1: `pillars.intro` is the ruled sentence. True: the file is the collection `pillars` (`Pillars.svelte:59-60`, `registryFile(client, 'pillars', 'pillars')`, `registryLines(portfolio(), 'pillars', ...)`); membership is `project.pillarIds.includes(line.id)` (`lines.ts:57-67`), `pillarIds` read from `manifest.pillars` (`normalise.ts:278`). The dead-end exception is stated by the Archival note.
- Case 2: the counts row of every non-muted card (pillar, provisional, 0 in flight alike, since the row is drawn whenever `!muted`, `LineCard.svelte:76`) is wrapped in `Tooltip` with `focusable` (`:77-88`). The wrapper holds no focusable control (a `strong`, a `span`, `Tag`s), so `describedControl` gives the wrapper itself (`tooltip-rules.ts:24-28`), which takes `tabindex=0` and `aria-describedby` (`Tooltip.svelte:215-225`, `:259`). An off-pillar card is `muted` (`Pillars.svelte:163`) and draws neither the row nor the tip.
- Case 3: with orphans `orphans_blurb` (item 3) is drawn, with none `no_orphans_blurb` (item 6) (`OrphansCard.svelte:22`).
- Case 4: `archival_blurb` is item 4's sentence (`ArchivalCard.svelte:44`).
- Case 5: `offpillar_note` ends with "Off-pillar lines carry no in-flight or venue-tier counts."; `RegistryCard.svelte:79` is untouched, and the muted card draws no `.metrics` row (`LineCard.svelte:76`).
- Case 6: tip "in flight": `inFlight` keeps stages with `live` (`lines.ts:69-78`; `live: true` on de-risking to revision, `vocab.yml:67-73`); "venue tiers": `tierStrip` counts over `inFlight(members, ...)` (`lines.ts:96`). Orphans note: `orphans` keeps `realProjects` (no `archival: true` category, `venues.ts:37`), outside `skip_tiers` (`[personal]`, `vocab.yml:203`), whose `pillarIds` name no line of all kinds (`lines.ts:110-122`, `Pillars.svelte:68`). Archival note: `archival` groups the `archival: true` category (`dead-ends`, `vocab.yml:225`) by the `dead` stages failed and stopped (`vocab.yml:76-77`, `lines.ts:130-146`); `lineMembers` leaves them out through `realProjects` (`lines.ts:64`). `no_orphans_blurb`: drawn only when `orphans` is empty, so every real project outside `skip_tiers` names a known line and is that line's member. These describe oculus's own words; a hub overriding `skip_tiers`, the `dead` stages or the archival category would make them false (the brief states this).
- Case 7: `OrphansCard.svelte:31` draws `t('pillars.untagged', projects.length)`, which now reads "<n> on no line".

## Files changed

From `git status --short` and `git diff --stat`, after the last change:

| File | Lines now (`wc -l`) | Diff | In write list |
| --- | --- | --- | --- |
| `config/text/views/structure/pillars.yml` | 24 | +8 -7 | yes |
| `src/lib/views/structure/pillars/LineCard.svelte` | 155 | +18 -14 | yes |
| `src/lib/views/structure/pillars/OrphansCard.svelte` | 47 | +3 -2 | yes (comment only) |
| `src/lib/views/structure/pillars/ArchivalCard.svelte` | 120 | +1 -1 | yes (comment only) |
| `docs/diagrams/layer-views.dot`, `.svg`, `docs/diagrams/layers.dot`, `.svg` | n/a | +1 -1 each | no: written by `npm run diagrams`, the command the brief runs before the list; the import counts "views/structure to layer ui" 31 to 32 and "views to ui" 1041 to 1042 follow from the new `Tooltip` import |
| `.scratch/migration/agents/reviews/O76-report.md` | this file | new | yes |

`Pillars.svelte` is unchanged: its head comment (`:14-18`) and its other comments read true.

### Comments and keys of the four files and `pillars.yml`, before and after

| Place | Before | After |
| --- | --- | --- |
| `OrphansCard.svelte:2-4` head | "The portfolio-fit callout: unmatched real projects, or the clean confirmation when every real project names a registry line." | "The Orphans card: the real projects outside the tiers `research_audit.skip_tiers` names whose `pillars:` names no line of the pillars file, or the confirmation when there are none." |
| `LineCard.svelte:109-111` style | "An off-pillar line and a dormant line are archival, so they are faded; ..." | "An off-pillar line and a dormant line, one with no member at a stage on the map, are faded; ..." (dormant per `isDormant`, `lines.ts:148-160`) |
| `ArchivalCard.svelte:2-4` head | "... with one collapsible category at a time and project links inside it." | "... with one stage's group open at a time and project links inside it." (what opens is one stage's group, `ArchivalCard.svelte:46-53`; a category is a row of `categories:`) |
| `LineCard.svelte:2-4` head | "One registry-line card (RegistryCard.svelte) with its portfolio metrics and registry prose." | same, followed by "The metrics row is one Tooltip that says what its counts count, in the tab order so the keyboard reaches the words as the pointer does." |
| `pillars.provisional_note` | "... drawn apart so it is seen without counting as one. Its promotion trigger is in its entry of the pillars file." | "... drawn apart so it is seen without counting as one." |
| `pillars.untagged` | `'{0} untagged'` | `'{0} on no line'` |
| `pillars.no_orphans_blurb` | "Every project maps to a pillar or an off-pillar line." | "Every project but personal projects and dead-ends is on a line of the pillars file." |

Kept as true: `archival`, `in_flight`, `no_orphans`, `not_active` ("{0} not active", the dead-end count), `offpillar_h` ("Off-pillar / archival": the section holds the off-pillar lines and the Archival card, `Pillars.svelte:141-177`), `orphans`, `project`, `projects`, `provisional_h`, `total`, `views.pillars`, `views.pillars_glyph`; the remaining sentence of `provisional_note` (the provisional lines are drawn in their own section, `Pillars.svelte:109-139`, and `lineKinds` keeps them out of `pillars`, `lines.ts:229-232`); `ArchivalCard.svelte:30` doc comment and `:75-76` style comment; `Pillars.svelte:2`, `:14-18`.

Docs that describe the view, read after the change: `docs/HELP.md:214` ("The research pillars and their projects.") still true; `config/catalogs/vocab.yml:202` and the `archival` flag note of the categories comment still true; `config/text/views/structure/map.yml:17` "pillar membership" is the Map view's edges, still true. Grep: `grep -rn --exclude=local.yml -i "untagged\|method tag\|pillar membership\|maps to a pillar\|promotion trigger\|portfolio-fit\|counts_tip\|collapsible category" src tests config docs README.md utils` gives only `OrphansCard.svelte:31` (the key name, see judgment 1), `LineCard.svelte:77` and `pillars.yml:6,21` (the new words), `map.yml:17` (true), and the unrelated identifiers in `relay-join.ts`, `relay-route.ts`, `search.svelte.ts`.

## Judgment calls the brief left open (each reversible)

1. The key `pillars.untagged` keeps its name while its words become "{0} on no line". A rename (to `on_no_line`, say) needs `OrphansCard.svelte:31`, whose write-list entry is limited to a comment. The orchestrator may rename it at landing; the catalog check would catch a key left without a reader.
2. The Tooltip is used as `VenueCard.svelte:208` uses it, `focusable` without `block`. The wrapper is an `inline-flex` span (`Tooltip.svelte:301-304`) around the block `div.metrics`, so the pointer area is the width of the counts, and the row now sits in a line box inside the card body (`Card.svelte:221-225`, a plain block). I expect no visible change of the row's height (a judgment; the look settles it). `block` would make it a full-width flex box, but its own doc is "for a control in the activity rail's fixed-width column".
3. `ArchivalCard.svelte`'s head comment was rewritten ("collapsible category" to "stage's group"), judged false against oculus's term category; the brief named only the two other comments.
4. `LineCard.svelte`'s head comment gained one sentence naming the tip, since the file now draws it.
5. `docs/HELP.md` gets no bullet: the tip is no action a user takes, and the file is outside the write list.

## Before and after, for the look on landing (the Pillars view)

- Head of the view: the intro reads the item 1 sentence in place of the three-sentence text that named provisional lines, in-flight counts and the "method tag".
- A pillar card and a provisional card: rest the pointer on the "<n> in flight <n> total <tier tags>" row; after about 150 ms a bubble below it reads "in flight: projects at a live stage; venue tiers: the venues of those projects". Same on a card with "0 in flight". Press Tab through a card: the counts row is a new tab stop on every pillar and provisional card, its focus ring shows and the same bubble opens; a screen reader reads the words as the row's description. Check that the row's height and the gap to the goal paragraph below it look as before.
- An off-pillar card: no counts row and no bubble; its "<n> projects" tag in the header row is there as before.
- Off-pillar / archival section note: ends with "Off-pillar lines carry no in-flight or venue-tier counts."
- Orphans card with orphans: the note reads item 3's two sentences; the header tag reads "<n> on no line" in place of "<n> untagged". With no orphans: "Every project but personal projects and dead-ends is on a line of the pillars file."
- Archival card: "Dead-ends (failed or stopped), kept for provenance; they count toward no line."
- Provisional line section note: ends at "... without counting as one." with no sentence about a promotion trigger.

## Prose read (verify 3)

Each changed sentence was read against spec.md "Prose": ASCII, plain, no em dash, no quip. Places that depart, each kept because it is ruled: `offpillar_note`'s kept first sentence has the "rather than" construction; `counts_tip` starts lower case and its "venue tiers: the venues of those projects" is loose (a tier chip counts in-flight projects by their venue's tier, with no venue or no rated venue under `unrated`, `lines.ts:93-98`); "live stage" names a vocabulary flag no stage label shows. The new comments hold none of these.

## Wrong or impossible in the brief

Nothing. Every premise reproduced on the base tree (the line numbers, the keys, `RegistryCard.svelte:79`, `VenueCard.svelte:208`, `skip_tiers: [personal]`, `vocab.yml:76-77`), and no test names the changed keys (`grep -rln "LineCard\|OrphansCard\|ArchivalCard\|structure/pillars/Pillars" tests` prints nothing).

Limitations: the sentences of items 3, 4 and 6 name oculus's own vocabulary words (personal, dead-ends, failed or stopped); a hub that overrides `research_audit.skip_tiers`, the `dead` stages or the `dead-ends` category would make them false on its screen, as the brief records. The four diagram files changed by `npm run diagrams` are outside the write list.

## Runs

The verify list (`npm run diagrams && npm run test:quick`) ran once, after the last change. One named test file ran alone: `npx vitest run tests/checks/source/keys.test.ts`, for the catalog reader of the new key. No whole-suite command ran (`npm test`, `npm run test:checks`, `npm run test:landing`, `npm run test:slow`, `npx vitest run` with no file: none).
