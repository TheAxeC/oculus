# Step O76 brief check (on main at 65dec745)

This check reads `.scratch/migration/agents/briefs/O76.md` against `plan.md` step O76 (`grep -n "^- \[ \] O76" .scratch/migration/plan.md` gives line 808), the Rulings "Open item 349" (plan.md:2693) and "Steps O75 and O76" (plan.md:2695), closed item 349 (orchestrator-state.md:224), `.scratch/migration/agents/spec.md` and the tree at 65dec745 (`git log --oneline -1` prints `65dec745 Launch the builder of step O73`). I changed nothing.

The finding that matters most: the ruled sentence "Off-pillar lines carry no counts." is false against the code. Every registry card, an off-pillar one included, draws a project-count Tag in its meta row (`src/lib/views/shared/forms/registry/RegistryCard.svelte:79`, `<Tag label={projectCount(projects.length)} />`). That finding belongs to Axel under ruling "Brief check scope". The second finding: the brief makes the tip a raw `title`, although the tree has a Tooltip primitive that its own head comment says replaces `title`.

## 1. Names

- `pillars.intro`, `orphans_blurb`, `no_orphans_blurb`, `archival_blurb`, `offpillar_note`, `provisional_note`, `pillars.untagged`, `counts_tip`: `for k in ...; grep -rn --exclude=local.yml -F "$k" src tests config docs README.md bin utils | grep -v "^config/text/views/structure/pillars.yml"`. The only hits are the four Pillars files, which are in the write list: `Pillars.svelte:85`, `:114`, `:146`; `OrphansCard.svelte:21`, `:30`; `ArchivalCard.svelte:44`. `counts_tip` has no hit (it is new).
- The terms the step retires: `grep -rn --exclude=local.yml -i "method tag\|maps to a pillar\|map to a pillar\|untagged\|pillar membership" src tests config docs README.md bin utils`. The relevant hits are all in paths the step writes (`pillars.yml:5,7,9,14`, `OrphansCard.svelte:30`). The `untagged` hits in `relay-join.ts:158`, `relay-route.ts:46,219` and `search.svelte.ts:233-234` are unrelated identifiers, and the change does not make them false.
- Docs that describe the view: `grep -rn --exclude=local.yml -i "method tag\|orphan\|off-pillar\|in-flight\|in flight" docs README.md config | grep -i "pillar\|orphan\|tier"`, plus `grep -n -i pillar docs/*.md README.md`. Hits: `docs/templates.md:244`, `config/catalogs/vocab.yml:54,202,217`, `config/options/catalogs/vocab.yml:32,204`, `config/schemas/manifest-schema.yml:35`, `docs/HELP.md:214` ("The research pillars and their projects."), `docs/data-map.md:38,70`. Each still matches the code (`lines.ts:69-122`) and the new text, so the change makes none of them false.
- A hit inside the step's own paths that the brief does not name, though item 6 covers it:
  - `OrphansCard.svelte:30` `t('pillars.untagged', ...)`: the tag reads "<n> untagged". Under the code and the new Orphans note, an orphan can carry a `pillars:` that names an unknown key. `normalise.ts:278` reads `manifest.pillars`; `links.ts:87-88,163` keeps only the ids `entities.pillars` holds. Such an orphan is not untagged, so the key `untagged: '{0} untagged'` (`pillars.yml:20`) is false. Closed item 349 states this same fact about the Orphans note.

Findings:
- 1.1 `pillars.untagged` (`pillars.yml:20`, drawn at `OrphansCard.svelte:30`) is false by the fact ruling 349 corrects in the Orphans note. The brief does not list it under "What is on the tree", and item 6 leaves its new words to the builder. That produces a user-visible label with no dictated words. The session can dictate them inside item 6 and the same path.

## 2. The step line

- "the Pillars view's text made true and short": items 1 to 6, with item 6 for the remaining keys and comments.
- the intro "The research pillars ... names it.": item 1.
- the hover tip on a card's counts: item 2.
- the Orphans note: item 3.
- the Archival note: item 4.
- the Off-pillar note adding "Off-pillar lines carry no counts.": item 5.

Findings: none. Every part has a requirement. Item 6 and its `no_orphans_blurb` sentence come under "made true" in the line's head.

## 3. Premises

- Ruling 349 (b) and "Steps O75 and O76": `grep -n "Open item 349\|Steps O75 and O76" .scratch/migration/plan.md` prints 2693 and 2695. Closed item 349 is at `orchestrator-state.md:224` with options (a) and (b). Matches.
- `pillars.yml` has 23 lines: `wc -l` prints `23`. Matches.
- The keys sit at the lines the brief gives (`cat -n config/text/views/structure/pillars.yml`): archival_blurb `:5`, intro `:7` ("through its <code>pillars:</code> method tag", "map to no pillar, provisional line or off-pillar line"), no_orphans_blurb `:9`, offpillar_note `:12`, orphans_blurb `:14` ("<b>no</b> <code>pillars:</code> tag"), provisional_note `:18`. All match.
- `lines.ts` (`cat -n src/lib/state/boards/structure/lines.ts | sed -n 1,170p`):
  - `inFlight` is at 69-78 and filters on `hasWord(..., 'stages', 'live', ...)`.
  - `tierStrip` starts at 84 and counts over `inFlight(members, ...)` (`:96`), with a project that has no venue or no rated venue counted under the fallback row (`:93-98`).
  - `orphans` is at 110-122: `realProjects`, then not in `skippedTiers`, then no `pillarIds` known.
  - `archival` starts at 124 and groups by the `dead` stages.
  All match.
- `skip_tiers` is `[personal]`: `grep -n skip_tiers config/catalogs/vocab.yml` prints `203:research_audit: { skip_tiers: [personal] }`. Matches. `vocab.yml:76-77` holds `failed` (`dead: 1`) and `stopped` (`dead: 2`), and `:225` is the `dead-ends` row with `archival: true`. Matches.
- `realProjects` leaves out the archival category: `venues.ts:37-47` uses `!isArchival(...)`. Matches.
- `LineCard.svelte` has 151 lines (`wc -l` prints 151). `.metrics` is at 74-84 (`{#if !muted}` at 74, the div from 75). `muted` is passed at `Pillars.svelte:163`, inside the LineCard at 155-167. The intro is at `:85`, the notes at `:114` and `:146`, OrphansCard's words at 17-21 and ArchivalCard's at `:44`. Matches.
- "it draws no counts while `muted`": true of LineCard's `.metrics` row only. `RegistryCard.svelte:79` draws `<Tag label={projectCount(projects.length)} />` in the meta row of every card, muted ones included, and `card.ts:207-208` makes that tag "<n> project(s)". **Differs**: an off-pillar card carries a count.
- No test names these keys: `grep -rn "pillars.orphans_blurb\|pillars.intro\|archival_blurb\|offpillar_note" tests` prints nothing (rc=1). Matches.
- The rules file names no output filter: `grep -n -i "filter" .scratch/migration/agents/spec.md` prints nothing. Matches.
- O72, O73 and O75 are in flight and write none of this step's paths. The dispatch block (`sed -n 24,70p .scratch/migration/orchestrator-state.md`) lists O72, O73, O75 and O76. The "Paths this step writes" of `briefs/O72.md`, `O73.md` and `O75.md` (awk over that section) name no `pillars` file. Matches.
- The verify list: `grep -n verification .agents/plan.yaml` prints `4:verification: .scratch/migration/orchestrator-state.md`. The state file's `verify:` is `npm run test:quick` and `verify_landing:` is `npm run diagrams && npm run test:quick`. The brief's "npm run diagrams && npm run test:quick" follows spec.md "Token discipline", which runs diagrams right before each run of the list. Matches.
- The ADR folder: `ls docs/adr` prints `ls: docs/adr: No such file or directory`. Matches.

Findings:
- 3.1 The brief says LineCard "draws no counts while `muted`". On screen, an off-pillar card still shows the "<n> projects" Tag from `RegistryCard.svelte:79`. The premise holds for the `.metrics` row only, and finding 8.1 rests on it.

## 4. Cases and checks

- Case 1 (intro): consistent.
- Case 2 ("an off-pillar card has no counts and no tip"): inconsistent with the code (`RegistryCard.svelte:79`). The tip as briefed, a raw `title`, also departs from the tree's tip primitive. `src/lib/ui/menu/Tooltip.svelte` says in its head comment: "The browser's own `title` is what this replaces. That one waits about a second, cannot be styled, and never appears for a control reached by keyboard". The tree wraps a non-control tag the same way: `VenueCard.svelte:208`, `<Tooltip text={t('venues.conc_tip')} focusable>` around a `Tag`. spec.md "What every package obeys" lists the accessible name and keys among the visible things. A `title` on a non-focusable `div` gives a keyboard reader nothing.
- Case 3 (Orphans card, with and without orphans): consistent.
- Case 4 (Archival note): consistent.
- Case 5 (the note ends with the sentence): consistent as a check of presence. The sentence it checks is false (finding 8.1).
- Case 6 (each sentence true against `lines.ts`): this case is consistent with spec.md, but it names only `lines.ts`. Whether the Off-pillar sentence and the tip are true depends on `LineCard.svelte` and `RegistryCard.svelte`, which the case does not name.
- The brief's "Paths this step writes" against item 6: item 6 asks for "every comment of the four Pillars files" made true, while three of those paths are limited to "only a head comment". The LineCard style comment at `LineCard.svelte:105`, "An off-pillar line and a dormant line are archival", is false under the view's own term: Archival is the dead-ends card. LineCard's path has no limit, so that one is writable. The limit and item 6 still disagree for `Pillars.svelte`, `OrphansCard.svelte` and `ArchivalCard.svelte`.
- spec.md "What every package obeys" requires an `unused-exports.sh` comparison with "the base's, which the brief names". The brief names no base output. O72's brief names one at `.agents/worktrees/O72-base/unused-exports.txt`. The step adds no export, so the comparison would be empty, but the rule is unaddressed.
- No case asks the builder to check, quote or explain a place the step does not change.

Findings:
- 4.1 Case 2 states that an off-pillar card has no counts, and the code contradicts it (`RegistryCard.svelte:79`).
- 4.2 Item 2 dictates a raw `title`, where the tree's tip primitive `ui/menu/Tooltip.svelte` with `focusable` (as at `VenueCard.svelte:208`) draws a tip that keyboard and screen-reader users get. The fix stays inside `LineCard.svelte` and changes the brief's decision 1 only, so it does not widen the step.
- 4.3 Item 6 covers every comment of the four files, but three of the write-list paths are limited to head comments.
- 4.4 The brief names no base `unused-exports.sh` output, which spec.md asks for.

## 5. The question

- Case 1: no. The words are ruled, and the one exception to "on a line when its manifest's `pillars:` names it" (dead-ends, which `lineMembers` leaves out through `realProjects`) is stated by the Archival note.
- Case 2: yes. A read passes on seeing the tip on a pillar card's counts, while a keyboard reader never reaches a `title` on a `div`. Its "no counts" half cannot pass truthfully at all (finding 4.1).
- Case 3: no.
- Case 4: no.
- Case 5: yes. It checks that the sentence is present, and the sentence can be present while false.
- Case 6: yes. It reads the sentences against `lines.ts` only, so "Off-pillar lines carry no counts." passes the read while `RegistryCard.svelte:79` draws a count.
- The check on the step's line (the look on landing): yes. A look that confirms the sentences appear passes with the off-pillar card's "<n> projects" tag on screen, unless the brief names it.
- Item 1's check: no.
- Item 2's check: yes, for keyboard readers, as in case 2.
- Item 3's check: no.
- Item 4's check: no.
- Item 5's check: yes, as in case 5.
- Item 6's check ("each named in the report with its before and after"): yes. The builder can name the keys it found and miss others. The brief names none of the false places it already holds: `pillars.untagged` (finding 1.1); `provisional_note`'s "Its promotion trigger is in its entry of the pillars file" (the pillars schema at `docs/templates.md:962-970` has no trigger field, and the hub keeps its trigger in a file comment at `research-hub/.oculus/data/pillars/pillars.yml:19`, not in an entry); `OrphansCard.svelte:2-3`, "the clean confirmation when every real project names a registry line", which is false while a personal-tier project names none; and `LineCard.svelte:105`.
- Verify 1 (`npm run diagrams && npm run test:quick`): checks the YAML parse, the reader of the new key and the ASCII gate. It cannot show that the text is true, and the brief does not claim it does.

Findings:
- 5.1 Cases 5 and 6 and the look can pass while "Off-pillar lines carry no counts." is false.
- 5.2 Case 2 and item 2 can pass while the tip is unreachable by keyboard.
- 5.3 Item 6 can pass with `pillars.untagged`, `provisional_note`'s trigger sentence, `OrphansCard.svelte:2-3` and `LineCard.svelte:105` left false. The brief should name each one.

## 6. Implied inputs

This is a code step: a Svelte change and a catalog.

- A provisional line's card. It is not muted (`Pillars.svelte:123-134`), so it draws the counts and gets the tip. Missing from the cases. Expected: the tip shows on its counts as on a pillar's.
- Keyboard focus and a screen reader on the counts row. Missing. Expected: the tip shows on keyboard focus and is the row's description (`aria-describedby`), as `Tooltip.svelte` gives it.
- A pillar card with no member in flight: "0 in flight <n> total" with no tier tags. Missing. Expected: the tip still shows. Low cost.
- A hub whose `research_audit.skip_tiers`, `dead` stages or archival category differ from oculus's words. Then "Personal projects", "dead-ends" and "failed or stopped" are false, because the code reads those words from the vocabulary (`lines.ts:119`, `:140`). This has not happened: `grep -n "skip_tiers\|research_audit\|^stages\|^categories" research-hub/.oculus/config.yml` prints no override. A wrong answer would cost a false sentence on screen. Missing. Expected: the sentences hold for the vocabulary in force, or the brief states that they describe oculus's own words.

Findings:
- 6.1 The keyboard and screen-reader input for the tip is missing (ties to 4.2).
- 6.2 The provisional card's tip is missing.

## 7. ADRs

- `ls docs/adr` prints `ls: docs/adr: No such file or directory`. `grep -n adr .agents/plan.yaml` prints nothing. No record.

Findings: none.

## 8. Dictated text

`LC_ALL=C grep -n '[^ -~]' .scratch/migration/agents/briefs/O76.md` prints nothing, so every dictated line is ASCII.

- Item 1, the intro (`grep -n "word for word as ruled" <brief>`, line 22): holds. Plain, ASCII, no em dash, no contrast construction. True: the collection key is `pillars` (`Pillars.svelte:59`) and membership is `pillarIds` (`lines.ts:64-66`), with the dead-end exception carried by the Archival note. The value holds `'`, so it stays a double-quoted scalar, as `pillars.yml:7` is today.
- Item 2, `in flight: projects at a live stage; venue tiers: the venues of those projects` (`grep -n "counts_tip" <brief>`, line 23): ruled words.
  - True for "in flight" (`lines.ts:76`).
  - "venue tiers: the venues of those projects" is loose: a chip counts the in-flight projects by their venue's tier, and a project with no venue or no rated venue counts under `unrated` (`lines.ts:93-98`, `vocab.yml:238`).
  - "live stage" names a vocabulary flag that no stage label on screen shows.
  - The value contains `: `, so it must be quoted in YAML, as `pillars.yml:10` and `:18` are.
  Holds as ruled.
- Item 3, the Orphans note (`grep -n "Personal projects and dead-ends are never orphans" <brief>`, line 24): holds. True for oculus's words (`lines.ts:117-120`, `vocab.yml:203`, `:225`).
- Item 4, the Archival note (`grep -n "count toward no line" <brief>`, line 25): holds. True: `realProjects` leaves the archival category out of `lineMembers` and `orphans` (`venues.ts:43-46`), and the dead stages are failed and stopped (`vocab.yml:76-77`).
- Item 5, "Off-pillar lines carry no counts." (`grep -n "Off-pillar lines carry no counts" <brief>`, lines 26 and 35): breaks spec.md "The working rules that bind every package", "Verify before asserting", and "What every package obeys", where a sentence the change makes false is a defect. The off-pillar card draws "<n> projects" (`RegistryCard.svelte:79`, `card.ts:207-208`). Only the in-flight, total and tier row is withheld (`LineCard.svelte:74`).
  - The kept sentence, "...so this work files here rather than reading as an orphan." (`pillars.yml:12`), is true: `orphans` is given all lines (`Pillars.svelte:68`). Its "rather than" clause is close to the contrast construction spec.md "Prose" bans; the ruling keeps the sentence, so it is noted only.
- Item 6, `Every project but personal projects and dead-ends is on a line of the pillars file.` (`grep -n "Every project but personal" <brief>`, line 27): holds. True when `orphans` is empty, for oculus's words. Plain and ASCII.

Findings:
- 8.1 "Off-pillar lines carry no counts." is false against `RegistryCard.svelte:79`. It is ruled text, and closing it needs one of two things, so it goes to Axel under ruling "Brief check scope":
  - (a) Reword the sentence, for instance "Off-pillar lines carry no in-flight or venue-tier counts." This changes his ruled words but stays in the same path.
  - (b) Draw no count tag on a muted card. This adds `RegistryCard.svelte` to the paths and a behaviour beyond the line.
  My recommendation is (a), as a judgment: it states what the card does, and (b) removes a count a reader uses.

## Declined to judge

- Whether the looseness of the ruled tip ("the venues of those projects" for venue tiers; "live stage" as a reader's term) should go back to Axel. These are his words, and the brief keeps them as ruled. The point is noted under section 8 only.
- Whether ruled sentences that name oculus's vocabulary words ("personal", "dead-ends", "failed or stopped") should be drawn from the vocabulary instead. That is a design call for Axel, and no hub overrides those words today.
- Whether the tip needs a bullet in `docs/HELP.md`, which spec.md asks for "what a user does". It adds no action, and adding the path would widen the step.
- `provisional_note`'s "drawn apart so it is seen without counting as one". I did not trace whether any surface counts pillars, so I did not judge it true or false.

Agent usage: a3823758f5f3e72f3, claude-opus-5-5, 165169 tokens, 37 tool uses, 5 min 25 s.

## Closed

- 1.1, 5.3 (`pillars.untagged`): open item 361, closed under automode as Z998: the tag reads `'{0} on no line'`. Item 6 names it with its words.
- 5.3 (`provisional_note`'s trigger sentence): open item 362, closed under automode as Z999: the sentence "Its promotion trigger is in its entry of the pillars file." is dropped, since oculus cannot know whether a hub writes a trigger, and where. Item 6 names it.
- 5.3 (`OrphansCard.svelte:2-3`, `LineCard.svelte:105`): item 6 names both comments as false, the builder makes each true.
- 4.2, 5.2, 6.1 (the tip as a raw `title`): open item 363, closed under automode as Z1000: the counts row is wrapped in `ui/menu/Tooltip.svelte` with `focusable`, as `VenueCard.svelte:208` does. Item 2, decision 1 and case 2 say so, case 2 with the keyboard focus.
- 6.2 (the provisional card): case 2 names it.
- 4.3 (path limits): the limits of `Pillars.svelte`, `OrphansCard.svelte` and `ArchivalCard.svelte` read "only a comment item 6 finds false".
- 4.4 (base unused exports): the brief names `.agents/worktrees/O76-base/unused-exports.txt` and adds the comparison to "Verify before you report".
- 3.1, 4.1, 5.1, 8.1 ("Off-pillar lines carry no counts." is false; case 2's "no counts"): raised to Axel as open item 360, since the words are his ruling. Item 5 and case 2 wait for it; the step is not dispatched until he rules.
- 6 (a hub with other vocabulary words): no hub overrides them today; the brief states that the sentences describe oculus's own words.
