# Step O127 brief check (on main at 3973a7801)

The report of the fresh agent of the `spec` skill's "Steps / The brief check", on `agents/briefs/O127.md`. A page this report cites (the rules file, a standard, a skill's text) is named with its section, never with a line number, since a page's lines move and a section's name does not. A line of code or a hit of a grep keeps its `file:line`.

The report is written in the rules file's character set. A character outside it in a quoted line is written by its name in angle brackets, such as `<tab>` or `<em dash>`.

Head: `git log -1 --format='%H %s'` printed `3973a7801a48bea6d65bcdf0ff8aa33f5a31609b Book O126 under review and ruling 641`. `plan.md` has no `## Goal` section (`grep -n "^#" .scratch/migration/plan.md` lists `# Plan: migration (cockpit to oculus)`, `## Steps, in execution order`, `## Could run in parallel`, `## Rulings`, `## Agents`, `## Blocked, and by what`); "the goal" below is the brief's own sentence: "a project card of an accepted or published paper says in its facts row the year the paper appeared, and no other card shows a year".

## 1. Names

- `CardFacts` / `CardFacts.svelte`: `git grep -n "CardFacts" -- . ':!.scratch' ':!*local.yml'` printed four hits. Outside the write list: `src/lib/views/boards/focus/lanes/LaneCard.svelte:10` "(views/shared/card/project/CardFacts.svelte): each a glyph and its words, wrapped in" (lines 9-16 say the lane card's tags are drawn as the facts row draws its facts). Still true after the change: a year tag is also a glyph and its words in a Tooltip. Inside the paths: `ProjectCard.svelte:6`, `:42`, `:366`.
- `card.ts`: `git grep -n -E "shared/card/card'|from '\.\./card'|from '\./card'|card/card\.ts|card\.ts" -- . ':!.scratch' ':!*local.yml'` printed 24 hits, all importers or mentions of existing helpers (`focus.ts:126`, `attention.ts:3`, `LaneCard.svelte:35`, `LaneHead.svelte:9,23`, `CardDocs.svelte:39`, `LeadCard.svelte:60`, `literature-card.ts:13`, `literature-save.svelte.ts:20`, `CardDetails.svelte:16`, `CardLinks.svelte:37`, `CardSessions.svelte:8,41`, `CardActions.svelte:2,4`, `record-menu.ts:22`, `DomainCard.svelte:16`, `LineCard.svelte:19`, `VenueCard.svelte:45`, `ArchivalCard.svelte:14`, `EntryFields.svelte:16,49`, plus `Post.svelte:23` naming another file, `post-card.ts`). Adding a function makes none of them false. Inside the paths: the head comment `card.ts:1-3` lists what the file holds ("Project-card path, label and deadline calculations, the glyph each fact of the card's top row is drawn with, what a session press on the card opens, and the shape of a card's control"). Once the year rule is in the file this list is incomplete. The brief's item 2 names the head comments of `CardFacts.svelte` and `ProjectCard.svelte` but not this one.
- `ProjectCard` / `ProjectCard.svelte`: `git grep -n "ProjectCard" -- . ':!.scratch' ':!*local.yml'` printed hits in `Listing.svelte:30,115,130`, `Person.svelte:33,64,271,286`, `Project.svelte:27,63,137`, `Projects.svelte:74,94,104`, `CardBrief.svelte:7`, `CardFacts.svelte:8`, `CardGrid.svelte:15`, `ProjectCards.svelte:4,9,65`. The change makes none of them false. They do show that `ProjectCard` is drawn on the Person page (`Person.svelte:271,286`) and on the Listing page (Archival, Orphans, No funding; `Listing.svelte:115,130`), both through `ProjectCards.svelte:65`. The brief's premise and Decision 4 do not name either page (see 3).
- `project.card.year_glyph`, `project.card.year_tip`: `git grep -n -E "year_glyph|year_tip" -- . ':!*local.yml'` printed nothing (exit 1). Neither key exists yet, so neither collides.
- The facts list (every place that lists the card's facts or describes the flags that will decide the tag): `git grep -n -i -E "compute resource|code status|facts row|top row" -- src docs README.md config tests ':!*local.yml' ':!docs/diagrams'` printed, outside the paths, `docs/HELP.md:303` ("the facts row"), `RecordCard.svelte:21` ("the facts row (`facts`)") and `LaneCard.svelte:9`. All three stay true. `docs/HELP.md:296` ("as a project board card draws its facts") stays true. The help text of `config/schemas/manifest-schema.yml:60`, "The year of the paper or of the project, as a whole number.", stays true.
- The flags `terminal` and `public`, which the step makes decide a card's year: `grep -n -E "^# - \`(terminal|public|placed)\`" config/catalogs/vocab.yml` and `grep -n -A4 -E "^\s+(terminal|public): flag" src/lib/data/shapes/catalog-files/vocab.ts` printed:
  - `config/catalogs/vocab.yml:55`: "`terminal`: the done group, a done or closed outcome: the boards that take or leave out done work by it (...), quick add, which offers no such project, and the Focus chip lanes, which hold none; the audit lists such a project that carries a chip of a chip lane."
  - `config/catalogs/vocab.yml:59`: "`public`, `negative`, `dead_end`: whether the website lists the paper of a project at the stage. ..."
  - `src/lib/data/shapes/catalog-files/vocab.ts:153-155` (the same `terminal` text as the shape's description) and `:168-170` (`public`: "A public outcome: a manifest at the stage that carries `publication:` is written into the website's publications, ...").

  Each of these lists what its flag decides. After the change both flags also decide whether a card draws the year, so each list leaves out one thing the flag decides. A reader of the vocabulary who takes `public` off a stage would not learn that the cards at that stage lose their year. `spec.md`, "What every package obeys", asks for every catalog paragraph that describes the behaviour to be re-read and kept true, and none of these four places is in "Paths this step writes".

Findings:
- `config/catalogs/vocab.yml:55` and `:59` and `src/lib/data/shapes/catalog-files/vocab.ts:153-155` and `:168-170` describe what `terminal` and `public` decide. The change adds a reader of both flags, and these paths are not in the write list. Recommend adding the four ranges to "Paths this step writes" and to "What to build".
- `src/lib/views/shared/card/card.ts:1-3`: the head comment's list of what the file holds needs the year rule. The file is in the write list, but "What to build" does not name this comment.

## 2. The step line

The step line (`grep -n -- "- O127" .scratch/migration/plan.md`, line 1633): "O127 a card shows the year a paper appeared: a year tag (its glyph and the number, tip "Year: 2025") in the facts row of the project board card, drawn from the manifest's `year` only at the stages that carry both `terminal` and `public` (accepted and published), so it always reads as the year the paper appeared; the Focus lane card is left out, since no Focus lane takes a project at a `terminal` stage (premise corrected at /spec) (ruling 641)".

- "a year tag (its glyph and the number, ...)": item 2 (a `Tag` with the glyph of `year_glyph` and the year as its words) and item 3 (`year_glyph: calendar`).
- "tip "Year: 2025"": item 2 (`Tooltip` with `year_tip`) and item 3 (`year_tip: 'Year: {0}'`).
- "in the facts row of the project board card": item 2 (`CardFacts.svelte`, drawn after the chips and before the code status).
- "drawn from the manifest's `year`": item 1.
- "only at the stages that carry both `terminal` and `public` (accepted and published)": item 1 (read with `hasWord` in the project's own hub's words).
- "so it always reads as the year the paper appeared": item 1's doc comment and item 4.
- "the Focus lane card is left out, since no Focus lane takes a project at a `terminal` stage": no requirement. It is an exclusion, which C9 checks. Its premise holds only for the lanes configured today (see 3).
- Ruling 641 (`grep -n "Open item 641" .scratch/migration/plan.md`, line 3459): "(a), step O127, a year tag on the project board card and the Focus lane card at the accepted and published stages only; ... (the user)". The user's ruling names the Focus lane card. The step line drops the lane card on the strength of a premise correction made at /spec.

Findings: the step line's exclusion of the Focus lane card narrows ruling 641 (a), which is the user's. It rests on the premise "no Focus lane takes a project at a `terminal` stage", which 3 finds true of every hub's configuration today but not guaranteed by the code. Under the spec skill's Steps 2, a correction that changes the part the step builds is a stop unless the plan can absorb it. The session should either put the lane card back into the step, as the ruling says, or raise the narrowing to the user. Options:
- (a) Build the tag on the lane card too, under the same rule. `LaneCard.svelte` already imports from `card.ts` (`LaneCard.svelte:35`). Its tags are the lane facts of `focus.ts` (`LaneFact`), so the write list would widen to `LaneCard.svelte` and to `focus.ts` or the lane-facts code. The tag would show on no lane card today, and would show on the lane card of any hub whose lane lists `accepted` or `published`.
- (b) Keep the lane card out, and book the narrowing as an open item for the user, since it departs from his ruling.
- Recommended (a): it follows the ruling and covers a hub that lists a done stage on a lane. (b) is the lazy option.

## 3. Premises

- The facts row is `CardFacts.svelte`, 138 lines, drawing Lead, Focus lane, form and chips, code, Reproduced, compute and folder at lines 73-119, with its head comment at lines 2-25: `wc -l` printed `138 src/lib/views/shared/card/project/CardFacts.svelte`, and `cat -n` shows that order at lines 73-119 and the comment at 2-25. Matches.
- "`CardFacts` has one caller, `ProjectCard.svelte:366` (`grep -rln CardFacts src`)": `grep -rln CardFacts src` printed two paths, `src/lib/views/shared/card/project/ProjectCard.svelte` and `src/lib/views/boards/focus/lanes/LaneCard.svelte`. `git grep -n CardFacts 3973a7801 -- src` shows the LaneCard hit is the comment line `LaneCard.svelte:10`, and the one import is `ProjectCard.svelte:42`, used at `:366`. The claim holds, but the command prints two files, not the one the brief implies.
- ProjectCard's head comment lines 4-6 list the facts: `sed -n '2,8p'` shows the paragraph that holds the list runs over lines 2-7 ("The row of facts (the Lead badge, the Focus" starts on line 4 and the sentence ends on line 7, "BLOCKED and the cross-links ... CardLinks.svelte."). Matches as a location. The write range is a separate matter, see 4.
- "`ProjectCard` draws a project wherever a board, the project page or the Awaiting tab draws one": the greps in 1 show it is also drawn on the Person page (`Person.svelte:271,286`) and the Listing page (`Listing.svelte:115,130`), through `ProjectCards.svelte:65`. The list is incomplete.
- No lane of `focus_lanes` (`vocab.yml:181-190`) lists `accepted` or `published`: `grep -n "" config/catalogs/vocab.yml | sed -n '175,195p'` shows lines 181-190 with stages `exploring`, `in-prep, submit-ready`, `revision`, `submitted`, `scoping`, `de-risking`, `building`, `nascent`, and the chip lanes `blocked` and `parked`. Matches.
- "a project at a `terminal` stage is sent to no chip lane (`focus.ts:319-334`)": `focus.ts:327` reads `return lane.chips.length === 0 || !hasWord(config, 'stages', 'terminal', project.stage);`, and `focus.ts:334` reads "a project at a `terminal` stage is on no chip lane, and on whatever lane its stage gives." Matches. The second half of `:334` means a stage lane listing a terminal stage would hold the project.
- `docs/HELP.md:296` says "An accepted, published, released, failed or stopped project sits on no lane": `grep -n "" docs/HELP.md | sed -n '290,300p'` shows the sentence at line 296. Matches, as a statement about oculus's lanes.
- Can a hub's own lanes take an accepted or published project? A hub may name its own `focus_lanes`: `src/lib/data/shapes/hub-keys.ts:26` lists `'focus_lanes'` among the hub keys, and `tones.ts:9-10` says each hub's words are vocab.yml "with that hub's settings laid over them". A lane row may list any stage word. `vocab.ts:89-98` (`laneRows`) refuses only a stage held by two rows. `git grep -n -E "lane.*terminal|terminal.*lane" -- src tests ':!*local.yml'` shows no rule refusing a terminal stage on a stage lane; its only audit is `audit.msg_terminal_lane_chip` (`projects.ts:430`), which is about chips. No hub does this today. For each workspace hub (`workspaces/research-hub.yml:3-13`), `grep -rln --exclude=local.yml -E "^focus_lanes:|^stages:" <hub>/.oculus` printed "no focus_lanes or stages key" for research-hub, cathedra, game-engine, ordo, oculus, theaxec.github.io, scotoma, officium and youtube-downloader; `~/.claude` and `~/.oculus` have no `.oculus` folder. The research hub's `.oculus/config.yml` names `stages` only inside `audit` and `website.kinds` rows (lines 32, 37, 44-50), never as the `stages:` or `focus_lanes:` map. The brief's "a year tag there could never be drawn" is therefore true of every configuration today and false in general. See the finding in 2.
- `accepted` and `published` carry `terminal` and `public`, and `released`, `failed` and `stopped` carry `terminal` without `public` (`vocab.yml:73-77`): lines 73-77 show exactly that. Matches.
- `hasWord` (`vocab-keys.ts:122-129`): lines 122-129 hold `export function hasWord(config, key, flag, word)`, returning `word !== undefined && wordsWith(config, key, flag).includes(word)`. Matches. `CardFacts.svelte:54` reads `const words = $derived(vocabOf(hub));`. Matches.
- `year`: `manifest-schema.yml:60` reads `year: { label: "Year", type: text, section: Core, help: "The year of the paper or of the project, as a whole number." }`; `normalise.ts:278` reads `year: num(manifest.year),`; `model-entities.ts:426` reads `year?: number;`; `takes.ts:94` reads `year: (project) => (project.year === undefined ? [] : [String(project.year)])`. All match. Not stated in the brief: `num` is `numberShape.safeParse(value).data` with `numberShape = z.number()` (`normalise.ts:161-166`), so a quoted string year reads as nothing and a fractional year passes (see 6).
- `grep -rn 'year' src/lib/views/shared/card` printed only `feed/RadarCard.svelte:23` and `:141`. Matches.
- Hub counts: `/usr/bin/python3 years.py ~/workspace/research-hub ...` (a `yaml.safe_load` over every `project.yml`, script in the scratchpad at `/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/years.py`) printed:
  - 120 manifests in all.
  - With a year: accepted 3 of 3 (2026), published 30 of 30 (2016 to 2026), submitted 12 of 12, revision 2 of 2, in-prep 1 of 1, exploring 1 of 7, stopped 1 of 4.
  - With no year: failed 0 of 4, released 0 of 19, and every scoping, de-risking, nascent and building manifest.
  - `non-int years []`, `accepted/published without year []`, `no stage with year []`.
  - The case files: `hccnet-fl ('accepted', 2026)`, `bachelor-network-ids ('published', 2016)`, `raw-pls ('submitted', 2026)`.

  All match the brief.
- The tips under `project.card` in `config/text/views/boards/project.yml` from line 51, with `lane_tip` at line 96 and `repro_glyph` and `repro_tip` at lines 123-124: `grep -n "" ... | sed -n '49,56p;92,130p'` shows `card:` at line 51, `lane_tip: 'Focus lane: {0}'` at 96, `repro_glyph: check` at 123 and `repro_tip: Reproduced` at 124. Matches. The glyph `calendar`: `grep -n -E "^\s*calendar:" config/catalogs/icons.yml config/catalogs/glyphs.yml` printed `glyphs.yml:106: calendar: "[d]"` and `icons.yml:105: calendar: calendar-days`. Matches.
- `card.ts` is 244 lines and holds `laneGlyph`, `wordGlyph`, `computeGlyph` and `codeLabel`: `wc -l` printed 244, and `grep -n "^export"` shows them at lines 168, 176, 184 and 189. Matches.
- `docs/HELP.md:298` ("A project card"): line 298 holds the top-row list as quoted. Matches.
- No test covers these files, and `guarded.md` names none of them: `grep -n "CardFacts\|card/card.ts\|boards/project.yml" .scratch/migration/agents/guarded.md` printed nothing. A wider grep that adds `ProjectCard` and `views/shared/card` printed only `guarded.md:220` (VenueCard, an unrelated entry). `git grep -n "CardFacts"` shows no hit under `tests/`. Matches.
- O126 in flight, writing `docs/HELP.md` lines 295 and 340-341 and `docs/diagrams/`: `sed -n '/## Paths this step writes/,/^## /p' .scratch/migration/agents/briefs/O126.md` lists `docs/HELP.md` line 295, lines 340-341 and `docs/diagrams/`, and `orchestrator-state.md:27` reads `- step: O126`. Matches.
- No ADR folder: `ls docs/adr` printed "ls: docs/adr: No such file or directory". Matches.

Findings:
- "`CardFacts` has one caller (`grep -rln CardFacts src`)": the command prints two files. The second, `LaneCard.svelte:10`, is a comment. The claim holds, and the brief should quote the second hit so the builder does not read it as a contradiction.
- "`ProjectCard` draws a project wherever a board, the project page or the Awaiting tab draws one" (and Decision 4): the Person page (`Person.svelte:271,286`) and the Listing page (`Listing.svelte:115,130`) draw it too. The report's before-and-after list and the look on landing should name them.
- "a year tag there could never be drawn": true of every hub's configuration today, false in general, because of `hub-keys.ts:26`, `vocab.ts:89-98` and `focus.ts:334`. See 2.

## 4. Cases and checks

- C1, C2, C3, C4, C5, C6, C7, C8: each is consistent with the rules file in what it expects. How the brief says to check them is not. The brief says "the cases are checked by reading" and "here each case is read". The spec skill's Steps 4 says "A case of a code step is a test only where the rules file's test rule calls for one, and otherwise a run the report quotes", and only "A case of a text or judgment step is checked by reading". This is a code step: item 1 is a pure function in `card.ts` whose inputs C1 to C8 name. `spec.md`, "What every package obeys", allows a case-run program that writes nothing into the diff, with its source and output quoted. C1 to C8 should be runs of the item 1 function over those inputs, with the vocabulary read from `config/catalogs/vocab.yml` and, for C7, a hub override, rather than readings. The test rule (`spec.md`, "What every package obeys", a test only as an entry of `guarded.md`) is applied correctly: no test.
- C9 ("The Focus page's lane cards draw no year tag, and no other fact of any card changes its order or its words"): its first half asks the builder to check `LaneCard.svelte`, which is not in the write list, a place the step does not change. Its expectation also holds only while no hub's lane lists a terminal stage (see 2).
- C10: it checks the three places the step writes (`HELP.md:298` and the two head comments), and is consistent. One related point: the write list gives `ProjectCard.svelte` lines 4-6, but `spec.md`, "What every package obeys", says "A comment edited by the step is rewrapped as a whole paragraph at 100 columns". The paragraph that holds the facts list runs over lines 2-7 (`sed -n '2,8p'`, line widths 98, 100, 95, 101, 96, 98), and adding "the year" to it overflows and rewraps into lines 2-3 and 7. The write list should read lines 2-7.
- Verify 1 (`npm run diagrams` then `npm run test:quick`), verify 3 (unused exports) and verify 4 (reading the comments against the `spec.md` prose rule): consistent with `spec.md`, "Token discipline" and "What every package obeys".

Findings:
- C1 to C8 are set to be checked by reading. For a code step, the spec skill's Steps 4 asks for a run the report quotes (a case-run program, as `spec.md`, "What every package obeys", allows).
- C9 asks the builder to check `LaneCard.svelte`, a place the step does not change.
- `ProjectCard.svelte` "lines 4-6" in the write list is narrower than the paragraph that `spec.md`'s rewrap rule makes the step rewrite (lines 2-7).

## 5. The question

"Could this pass without the goal being reached?", the goal being the brief's sentence quoted at the head of this report.

- C1, C2: no. Each fails unless the tag with that year and tip is drawn at that stage.
- C3, C4, C5: on its own each passes on the unchanged tree. Its part of the goal is "no other card shows a year", and with C1 and C2 it pins the rule down. No, read as a set.
- C6, C8: no. Each pins down an empty input.
- C7: no, provided it is run. Read only, a rule that reads the primary hub's words (`vocabOf()` with no hub) could be judged correct by a reader who misses the argument. That is the reason in 4 to run it.
- C9: yes. In a hub whose lane lists `published`, the lane card of a published paper draws no year, against the goal's "a project card of an accepted or published paper says ... the year", and C9 passes.
- C10: no.
- The step-line check (verify 2, `grep -rn "year" src/lib/views/shared/card` printing only the added lines and `RadarCard.svelte:23,141`): yes. It passes for any added line that holds the word, whatever rule the function applies. It sees nothing outside `src/lib/views/shared/card`, so it would not see a year added to `LaneCard.svelte` or a board's list rows. It shows only that no other card file in that folder mentions a year.
- Item 1 (the rule): yes, while C1 to C8 are only read. A rule that tests `public` alone, or `terminal` alone, passes `npm run test:quick` (type check, lint, the tests that import the changed files, of which there are none) and could pass a reading. The case-run program in 4 closes this.
- Item 2 (the tag): no, given the look on landing (`spec.md`, "What every package obeys"), which the report's before-and-after list feeds. `npm run test:quick` alone does not see it.
- Item 3 (the words): no. The orphan-key and missing-key checks of the tree read the keys against their readers.
- Item 4 (the page): no. It is checked by reading the line against the drawn order.

Findings:
- C9 can pass while a hub's lane card shows a published paper without its year (see 2).
- Verify 2 can pass with a wrong rule, and it does not see outside `src/lib/views/shared/card`.
- Item 1 can pass with a wrong flag test while C1 to C8 are only read.

## 6. Implied inputs

This is a code step.
- A year written as a string, `year: "2025"`: missing from Cases. A manifest form write makes a number only when the field already holds one. `src/lib/server/edit/writes/manifest.ts:218-220` reads `if (typeof current === 'number' && /^-?\d+(?:\.\d+)?$/.test(text)) return { value: Number(text) }; return { value: text };`, and the schema's `type: text` (`manifest-schema.yml:60`) means a year typed into a manifest that had none is written as text. `renderScalar` (`collection-text.ts:33-47`) writes such text through `yaml.stringify`, which quotes a numeric-looking string. `num` (`normalise.ts:161-166`, `z.number()`) then reads it as nothing. It has not happened in the hub (`years.py` printed `non-int years []`). The wrong answer costs something: a published paper whose year was typed through the form silently shows no year. Expected result: as the code stands, no tag, since `project.year` is undefined. The brief should state that, and name the form's text write of `year` as a defect of a different concern (the manifest write, not the card), to be booked.
- A year that is not a whole number (`year: 2025.5`, `year: 0`): missing. `z.number()` accepts it, so the tag would read "2025.5". It has not happened (`non-int years []`), and the wrong answer costs little. Expected result: no tag for a value that is not a whole number, following the schema's "as a whole number", or the value drawn as written. The brief should take one.
- A project of a hub other than the primary: listed (C7).
- The same card on the project page, the Awaiting tab's board, the Person page and the Listing page: missing as a case. Decision 4 names the boards, the project page and the Awaiting tab only. The tag follows `CardFacts` everywhere, so the wrong answer costs little, but the look on landing reads the report's before-and-after list. Expected result: an accepted or published project with a year draws the tag on each of these views, and the Listing page's Archival set (failed and stopped) draws none.
- A hub stage carrying `terminal`, `public` and `negative` or `dead_end`: not listed. It has not happened (no hub names `stages`, see 3) and costs little. Noted only.

Findings: the string `year: "2025"` that the manifest form writes into a manifest with no year (expected: no tag, plus the write's defect named and booked as a different concern); the non-whole year (expected: the brief takes one result); the Person and Listing pages drawing the same card (expected: the tag drawn there, Archival none).

## 7. ADRs

- `ls docs/adr` printed "ls: docs/adr: No such file or directory". `grep -n "adr" .agents/plan.yaml` printed nothing, and `grep -n -E "^adr" .scratch/migration/orchestrator-state.md` printed nothing, so the folder is the default `docs/adr`. No record exists.

Findings: none.

## 8. Dictated text

- `year_glyph: calendar`: `grep -n "year_glyph" .scratch/migration/agents/briefs/O127.md` finds lines 30 and 31. Holds: a sibling of `repro_glyph: check` (`project.yml:123`), the glyph exists (`glyphs.yml:106`, `icons.yml:105`), ASCII.
- `year_tip: 'Year: {0}'`: `grep -n "year_tip: 'Year: {0}'"` finds line 31. Holds: single-quoted as its siblings `tier_tip: 'Tier: {0}'` (`project.yml:135`) and `lane_tip: 'Focus lane: {0}'` (`:96`), which a value holding ": " needs. "In the file's key order" places it after `workbench_glyph` (`:145`), the group's last key.
- The tip "Year: {0}": `grep -n '"Year: {0}"'` finds line 30. Holds: the same words as the key above, and the tips' pattern "Kind: {0}".
- The HELP.md words "the year the paper appeared ("Year: 2025"), drawn only at a stage that carries both `terminal` and `public` (accepted and published in oculus's words)": `grep -n 'the year the paper appeared ("Year: 2025")'` finds line 32. Holds against `spec.md`'s prose rule ("plain, ASCII, no em dashes, no quips, no 'not X but Y' construction") and its HELP.md rule, and fits the form of line 298's list ("its Focus lane ("Focus lane: Review")").
- The doc comment's reason "the year of a paper in flight is not the year it appeared": `grep -n "the year of a paper in flight is not the year it appeared"` finds line 29. This states what the comment must say, so it is not strictly dictated. Read as prose, it holds.
- `LC_ALL=C grep -n '[^ -~]' .scratch/migration/agents/briefs/O127.md` printed nothing (exit 1): the brief is ASCII.

Findings: none.

## Declined to judge

- Whether the lane card goes back into the step or the narrowing goes to the user (finding of 2): the user's call under ruling 641. A recommendation is given in 2.
- Which result a non-whole year gets (6): a choice for the brief.
- Whether "no other card shows a year" in the brief's goal sentence means no other project card: `RadarCard.svelte:23,141` already draws a literature item's year, and the brief excludes it in verify 2. I read the goal as being about project cards and did not judge this further.

Agent usage: ad6df2830a9462837, claude-opus-5-5, 184411 tokens, 66 tool uses, 8 min 47 s.

## Closed

Each finding is closed by a change to the brief `agents/briefs/O127.md`, held line by line against the tree after the change.

- The Focus lane card (2): the lane card stays in the step under ruling 641's option (a), since a hub's own `focus_lanes` may list a done stage (`hub-keys.ts:26`, `focus.ts:334`). The plan's step line names both cards again (`diff` of `plan.md` against its copy from before this /spec prints nothing). The rule moves to `src/lib/state/boards/focus.ts` beside `laneFacts` (decision 3), `LaneFact` gains the kind `year`, drawn first among the facts (What to build 3), C9 is rewritten to a hub lane that lists `published`, and the paths add `focus.ts` and `LaneCard.svelte`.
- The flags' descriptions (3): What to build 6 and the paths add `config/catalogs/vocab.yml` lines 55 and 59 and `src/lib/data/shapes/catalog-files/vocab.ts` lines 153-155 and 168-170, read at those lines after the change.
- The head comments (4): the rule's file is now `focus.ts`, whose head comment names it (What to build 1); `ProjectCard.svelte`'s facts paragraph is named as lines 2-7.
- The `CardFacts` grep (1): "What is on the tree" quotes both hits, the import at `ProjectCard.svelte:42` and the comment at `LaneCard.svelte:10`.
- The other pages (6): decision 5 and C11 name the project page, the Person page (`Person.svelte:271,286`) and the Listing pages (`Listing.svelte:115,130`), with the Archival listing drawing none.
- The cases' runs (5): C1 to C10 are run by one case-run program under `spec.md:66`, its source and both outputs quoted; Verify 2 is the snapshot test and Verify 3 the case-run program.
- The text year (6): not in the brief. Reading a text of digits as the year widens the step's paths, adds a requirement and a case beyond the step's line and changes which projects the boards' year filter takes, so under the ruling Brief check scope it is open item 642. It is a defect of the manifest reader that exists without this step (the form writes `'2025'` into a manifest with no year, `manifest.ts:218-220`, and `normalise.ts:278` reads it as nothing), so the step goes on without it; no manifest of the hub holds a year as text today. "What is on the tree" names the item.
- The non-whole year (6): `num` reads a fraction as a number today; no manifest holds one, and open item 642's option (a) reads it as nothing.
- `docs/HELP.md:296` beside O126's line 295: "What is on the tree" says the landing takes each step's paragraph whole; the dispatch entry's `shared_paths` records it.
- Dictated text, held after the change: `year_glyph: calendar` and `year_tip: 'Year: {0}'` (What to build 4, brief line 34) sit with `repro_glyph: check` (`project.yml:123`) and `tier_tip: 'Tier: {0}'` (`:135`); the HELP.md words of What to build 6 (line 36) are unchanged from the check; `LC_ALL=C grep -n '[^ -~]'` over the brief prints nothing.
