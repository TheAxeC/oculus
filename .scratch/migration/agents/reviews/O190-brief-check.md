# Step O190 brief check (on main at d45c297a6)

This is the fresh agent's report from the `spec` skill's brief check on `.scratch/migration/agents/briefs/O190.md`. `git log -1 --format=%h` printed `d45c297a6`. `git status --short` printed ` M .scratch/migration/orchestrator-state.md`, ` M .scratch/migration/plan.md`, ` M .scratch/migration/queue.md` and `?? .scratch/migration/agents/briefs/O190.md`. I changed nothing.

The checks that matter most are 1 (eight places outside the write list, one of which the board card cannot be drawn without), 4 (case 9 cannot run on the unchanged tree) and 6 (the project form opens the new field empty).

## 1. Names

- **`laneOrder`**: `grep -rn -w laneOrder src tests config docs README.md utils --exclude=local.yml` printed only `src/lib/state/boards/focus.ts:314` and `:441`, both inside the write list. No test calls `laneOrder`, `laneItems` or the lane order (`grep -rn -e 'laneFacts\|laneItems\|cardYear\|pausesCountdown' tests` printed nothing). However, the lane order is written out in words in four places, and three of them are outside the paths. `grep -rn -i -e 'deadline, then title' -e 'deadline then title' -e 'by deadline' -e 'deadline first' src config docs README.md utils --exclude=local.yml` printed:
  - `config/catalogs/vocab.yml:176`: "`sort: title` orders a lane's cards by title; with no `sort` they go by deadline, then title." **Made false**: the order becomes deadline, then `submitted`, then title. Not in the paths.
  - `config/options/catalogs/vocab.yml:163`: `help: title orders a lane's cards by title; with none they go by deadline, then title`. **Made false.** Not in the paths. This is the Settings help line.
  - `src/lib/data/shapes/catalog-files/vocab.ts:126`: `"title orders a lane's cards by title; with none they go by deadline, then title."`. **Made false.** Not in the paths.
  - `src/lib/state/boards/focus.ts:86` (the `Cluster` doc comment: "sort by title rather than by deadline then title") and `:421` (the `laneItems` doc comment). Both are in the paths, but the brief does not name them.
- **`laneFacts` signature**: `grep -rn -w laneFacts ...` printed `focus.ts:3`, `:621`, `LaneCard.svelte:65`, `Lanes.svelte:15`, `:42` and `:236`. There is one caller, `Lanes.svelte:236` (`facts={laneFacts(project, wordsAt(project), known.self, known.venues)}`), and it is in the paths. No test calls `laneFacts`. No hit outside the paths.
- **`LaneFact` kind**: hits at `focus.ts:592`, `:626`, `:627` and `LaneCard.svelte:46`, `:67`, `:130` (`FACT_GLYPHS: Record<LaneFact['kind'], string>`) and `:138` (`factTip`, whose last branch falls through to `venue_tip`). All are in the paths.
- **`cardYear`, as the model for the new function**: hits at `focus.ts:3`, `:603`, `:615`, `:628` and `CardFacts.svelte:7`, `:44`, `:85`, all in the paths. The new function counts days, so it needs `now`, and **`CardFacts.svelte` has no `now`**. Its props are `item` and `onfolder` (`CardFacts.svelte:57-63`). Its one parent, `src/lib/views/shared/card/project/ProjectCard.svelte:390`, draws `<CardFacts {item} onfolder={showFolder} />`, although ProjectCard itself holds `now` (`ProjectCard.svelte:93`, `:111`, `:124`). `grep -rln CardFacts src` printed `ProjectCard.svelte`, `PressBox.svelte` and `LaneCard.svelte`. **`ProjectCard.svelte` is not in the write list, and item 3 cannot be built without passing `now` to CardFacts.** ProjectCard's head comment (lines 4-6) also lists the facts row in full ("the Lead badge, the Focus lane, the form and chips, the year the paper appeared, the code status, reproduced, the compute resources and the folder"). That list is made incomplete.
- **Manifest key `submitted`**: `grep -rn -E '\.submitted\b|\bsubmitted\?:|\bsubmitted: *[0-9"'"'"']|manifest\.submitted|\[.submitted.\]' src tests config docs README.md utils --exclude=local.yml` printed only stage-word hits in tests (`decks.test.ts:40`, `:259`, `boards.test.ts:226`, `hub-vocab.test.ts:216`, `counts.test.ts:40`). There is no key collision in code. The places that list manifest fields:
  - **`src/lib/state/forms/schema.ts:443-501` `fieldValues`**: this is the project form's opening values, one entry per schema field name (`deadline: project.deadline` at `:480`, `snooze: project.snooze` at `:461`). The form draws every schema field (`formFields`, `schema.ts:188-211`) and shows `values[field.field]` (`src/lib/views/boards/editor/editor-target.ts:113`, `:127`). **Without `submitted: project.submitted` here, the project editor draws a Submitted date box that is empty for a manifest that holds a date.** Not in the paths. `fieldValues` is named in G32's Code line (`agents/guarded.md:280`).
  - `src/lib/data/shapes/boards/takes.ts:78-95` `MATCH_FIELDS` holds no date field (no `deadline`), so nothing is needed there.
  - `src/lib/data/shapes/boards/order.ts` orders by `stage`, `year` and `title` only. Nothing is needed.
  - `src/lib/data/snapshot/schema/manifest.ts` builds the JSON Schema from the schema's `fields:` ("no other key allowed"), so the new field becomes a known key and a `date` gets the `ISO_DATE` pattern (`record.ts:190-191`). Nothing to write.
  - There is no wire or client snapshot shape that lists `Project` fields: `grep -rn -w statusLine src` printed only `normalise.ts:284` and `model-entities.ts:478`.
  - `src/lib/data/snapshot/normalise.ts` builds every project in one function (`manifestProject`, line 261). That file is in the paths.
  - `tests/data/snapshot/normalise.test.ts:307` is G32's test ("fills a project from the manifest keys of the same meaning", `agents/guarded.md:281`). It is a `toEqual` over a fixture holding `deadline: '2026-11-17'` (line 84) and `snooze`, but no `submitted`. It keeps passing, because `str(undefined)` is `undefined`, but it reads no `submitted`. Not in the paths. See check 4.
- **The `pauses_countdown` flag, whose effects grow**: three descriptions of the flag would no longer list everything it does. None is in the paths. `config/catalogs/vocab.yml:60` ("a stage that stops a card's and a lane's countdown, and that the Focus board's awaiting box counts as submitted work held at its venue"), `config/options/catalogs/vocab.yml:58` and `src/lib/data/shapes/catalog-files/vocab.ts:178`. They stay true but no longer say that the flag draws the submission date. Under `agents/spec.md` "What every package obeys" (the grep-after-rename rule), each catalog paragraph describing the behaviour has to be listed as still true or rewritten.
- **New text-catalog keys**: `grep -rn -i submit config/text/views/boards/project.yml` printed nothing. `grep -rn -E '^\s+(submitted|submission)[a-z_]*:' config/text --exclude=local.yml` printed only `config/text/views/boards/focus.yml:75: submission_deadline: ...`, a different group. The `project` group lives only in `config/text/views/boards/project.yml` (`grep -rln -E '^project:' config/text` printed nothing; the group sits under `text:`). The brief names no keys. No collision.
- **Hub `manifest_fields`**: `config/options/schemas/manifest-schema.yml:4` makes a hub row "naming a field oculus's form has" a finding. `grep -n -A15 manifest_fields ~/workspace/research-hub/.oculus/config.yml` printed nothing, so no hub collides today.

Findings:
- `config/catalogs/vocab.yml:176`, `config/options/catalogs/vocab.yml:163` and `src/lib/data/shapes/catalog-files/vocab.ts:126` are made false by item 5 and are not in the write list.
- `src/lib/views/shared/card/project/ProjectCard.svelte:390` has to pass `now` to CardFacts, or item 3 cannot count days. Its head comment's list of facts (lines 4-6) also has to be updated. Not in the write list.
- `src/lib/state/forms/schema.ts` `fieldValues` lacks `submitted`, so the project form shows the field empty. Not in the write list.
- `tests/data/snapshot/normalise.test.ts` (G32) does not exercise the new key. Not in the write list. See check 4.
- `config/catalogs/vocab.yml:60`, `config/options/catalogs/vocab.yml:58` and `vocab.ts:178` describe `pauses_countdown` without its new effect. These are not in the write list, and the brief does not name them for the builder's still-true-or-rewritten list.

## 2. The step line

The plan's line is at `grep -n '^- O190 ' .scratch/migration/plan.md`, line 1755.

- (1) The manifest key `submitted`, type date, section Dates, in `config/schemas/manifest-schema.yml`, with its help words: served by item 1.
- (2) A project card's top row draws it: item 3. A Focus lane card draws it: item 4.
- (2) The date and the days since, "submitted 2026-10-24 | 32 d" in the words of the text catalog: served by item 3 and decision 1, but decision 1 gives the label `2026-10-24 | 32d`. That drops the word "submitted" from the drawn label, which the step line's example carries, and moves the word into the tip. The brief records this as a decision. It does not say that the decision departs from the step line's example.
- (2) Only while the stage carries `pauses_countdown` in its own hub's `stages`, read with `hasWord`: item 2.
- (2) None with no date, or with a value that is not a date: item 2.
- (3) A lane sorted by deadline then title orders cards of equal deadline by that date, oldest first, before the title, so the Review lane puts the longest-waiting paper on top: item 5 and case 7.
- (3) A lane of a cluster with `sort: title` is unchanged: item 5 and case 8.
- (4) The project.yml block of `docs/templates.md` shows the key (G83): item 6.
- (4) Any line `docs/HELP.md` or `docs/data-map.md` needs goes in the report as Doc text: item 7.
- Built by a builder agent: "Size: a full step".
- The ruling "Submission date" also has the orchestrator write the twelve hub manifests' dates at landing. That is orchestrator work and is not the brief's, so no item of the brief serves it, correctly. The ruling "App rebuild after O190" is post-landing orchestrator work and is likewise not the brief's.

Findings: none unserved. One note: the departure of decision 1's label from the step line's example ("submitted 2026-10-24 | 32 d") is not stated as a departure.

## 3. Premises

- Schema: `grep -n -i submit config/schemas/manifest-schema.yml` printed line 51 (`stage`, with `submitted` inside its help) and line 76 (`deadline`, whose help contains "such as submitted"). The brief says `submitted` occurs "only inside the help words of `stage` (line 51)", but line 76's help also holds the word. This is minor; no key exists either way. Dates section: `deadline` 76, `followup` 77, `snooze` 78, `subtasks` 104. Matches.
- No hub manifest has `submitted:`: `grep -rln --include=project.yml -E '^submitted:' ~/workspace/research-hub/projects ~/workspace/research-hub/side-projects` printed nothing (exit 1). Matches. Twelve at `stage: submitted`: `grep -rl --include=project.yml -E '^stage: *submitted *$' ... | wc -l` printed `12`. Matches.
- `config/catalogs/vocab.yml:72`: `submitted:    { label: "submitted / under review", ... placed: true, public: true, pauses_countdown: true, deadline_met: true }`. Line 112: `submitted:     { color: "#b45309", deadline_met: true, waiting: true }`. Matches.
- `normalise.ts`: `wc -l` printed 713. Line 290 is `deadline: str(manifest.deadline),` and line 293 is `snooze: str(manifest.snooze),`. `guards.ts:30` is `export function str(value: unknown): string | undefined`. `node -e "...typeof Y.parse('d: 2026-10-24').d..."` printed `string`. Matches.
- `config/text/findings.yml:348` is `not_a_date: '{0} is {1}, which is not a day written YYYY-MM-DD'`, and `src/lib/data/snapshot/schema/check.ts:298` holds `'findings.schema.not_a_date',`. Matches.
- `model-entities.ts`: 847 lines; line 484 is `deadline?: string;` and line 498 is `snooze?: string;`. Matches.
- `focus.ts`: 815 lines. Line 213 is `export function pausesCountdown(`, 314 `function laneOrder(`, 324 `function titleOrder(`, 425 `export function laneItems(`, 441 the sort, 592 `export type LaneFact = { kind: 'year' | 'role' | 'tier' | 'venue'; ... }`, 603 `export function cardYear(`, 621 `export function laneFacts(`. Matches.
- Review lane: `vocab.yml:190` is `- { key: review, ... cluster: parked, stages: [submitted], ... }`, and `:179` is `- { key: parked, ... layout: columns, awaiting: true }`, with no `sort`. Matches.
- `CardFacts.svelte`: 158 lines; `cardYear` at line 85. **The year tag is at lines 118-122** (`{#if year !== undefined}` at 118, `year_tip` at 119, `year_glyph` at 120). The brief says 114-118; line 114 is the chip tone expression. **Mismatch.**
- `Lanes.svelte`: line 95 is `let { now, cursor, items, ... }: Props =`, line 121 is `const days = daysUntil(date, now);` and line 236 is the `laneFacts` call. `LaneCard.svelte`: 353 lines; `FACT_GLYPHS` at 130 and `factTip` at 138. Matches.
- `presets.ts:391` is `export function daysUntil(date: string, now: number): number | null`, which measures UTC midnight of the date against the reader's local calendar day (`midnight` and `today`, lines 375-384). Matches.
- `config/text/views/boards/project.yml`: 196 lines. `year_glyph: calendar` at 146, `year_tip: 'Year: {0}'` at 147, `waiting_glyph: waiting` at 143, `stale_behind: '{0}d behind'` at 136. `repositories.yml:34-35` is `one: '{0} day ago'` and `other: '{0} days ago'`. Matches.
- G83 is at `agents/guarded.md:61`. `docs/templates.md:1238` is `# deadline: YYYY-MM-DD` and `:1240` is `# snooze: YYYY-MM-DD    # off the ticker until this date`. Matches.
- No guarded entry for `focus.ts`, `laneFacts`, `cardYear`, `laneItems` or `laneOrder`: the grep printed nothing. Matches as stated. However, G32 covers `src/lib/data/snapshot/`, `src/lib/data/model/` and `schema.ts (fieldValues)` (`agents/guarded.md:280`), and the step changes two of those three. See check 4.
- `docs/data-map.md:383` is `` | `deadline`, `snooze` | the next deadline, and the day before which the project stays off the ticker | ``. Matches. On `agents/spec.md`'s HELP rule: the rule is the paragraph on `docs/HELP.md`, `docs/data-map.md` and `docs/decks.md` under "What every package obeys", and it is at line 72 as the brief cites. Matches.
- ADRs: `ls docs/adr` printed `ls: docs/adr: No such file or directory`. The configuration block has no `adr` key (`sed -n 1,30p .scratch/migration/orchestrator-state.md`). Matches.
- `standards: [.scratch/migration/agents/spec.md]` is at `orchestrator-state.md:11`. Matches.
- Decision 1 says "Five real dates from the hub's manifests". A grep of each date over the twelve submitted manifests finds 2026-10-24 (four manifests), 2026-11-19 (two), 2026-11-04 (one) and 2026-10-22 (one). **2026-11-26 is in no manifest.** flkit's manifest says only "Submitted to JMIR Formative Research ... revision and re-review requested 2026-11-09, due 2026-11-30". That date comes from Axel's ruling ("No, flkit is submitted, since 11-26"). Minor mismatch.

Findings:
- `CardFacts.svelte` year tag: the brief says lines 114-118; the tree has 118-122.
- "Five real dates from the hub's manifests": four are from manifests, and 2026-11-26 is from the ruling.
- "found `submitted` only inside the help words of `stage` (line 51)": line 76's help also holds the word.

## 4. Cases and checks

- Case 1 (submitted 2026-10-24, today 2026-11-25, 32 days on both cards): the arithmetic holds (Oct 24 to Nov 25 is 32 days). The board-card half is drawn only by `CardFacts.svelte`, which a case-run program over "the changed functions" cannot render. `agents/spec.md` "What every package obeys" (a builder runs no page, and a case only a page shows names the look on landing as its proof) asks this half to be checked by reading and by the look. The brief says every case other than G83's is "a run the report quotes" and names no look. Inconsistent in part.
- Cases 2, 3, 5 and 6: these are consistent for the function and `laneFacts`. The board-card half of each has the same gap as case 1.
- Case 4 (`soon`, no fact, and the `not_a_date` finding names the field): consistent. The finding comes from the schema check over the changed schema.
- Case 7 (D, B, A, C): consistent. On the unchanged tree, `laneOrder` gives D, A ("Alpha"), C ("Beta"), B ("Zeta"), so the case tells the two trees apart.
- Case 8 (Idea lane, title order): consistent, a preservation run.
- Case 9 ("`docs/templates.md` without the new line, with the schema field added: the test fails on `submitted`; with the line, it passes"):
  - It cannot be run on the unchanged tree, because it needs the schema field added. The brief nonetheless makes "the first run of every case above on the unchanged tree" the builder's first task, before any change.
  - It asks for a run with a line held out so as to watch G83's test go red. `agents/spec.md` "What every package obeys" says "Code is never deliberately broken to see whether a test catches it: no run with the behaviour removed, no mutation, no fault injected into a copy. A test is judged by reading it."
  - G83's test is not changed by the step, so the rule on quoting a changed test's failing line on the unchanged tree does not call for this run either.
  - Inconsistent.
- The test rule: the brief says "Under `agents/spec.md:60` only G83's test is a test of this step". `agents/spec.md` "What every package obeys" (the `agents/guarded.md` paragraph) says "A step whose change touches an entry's code runs that entry's test." The step changes `src/lib/data/snapshot/normalise.ts` and `src/lib/data/model/model-entities.ts`, both under G32's Code line (`agents/guarded.md:280`: `src/lib/data/snapshot/`, `src/lib/data/model/`, `schema.ts (fieldValues)`). G32's test row for the parser is "fills a project from the manifest keys of the same meaning" (`tests/data/snapshot/normalise.test.ts:307`). The entry keeps "one row per input that gives a different outcome", and the parser's new key has no input in that fixture. Inconsistent: G32's test has to be named, run, and given `submitted` in its fixture and expected object, which also puts `tests/data/snapshot/normalise.test.ts` on the write list.
- Verify item 3, `LC_ALL=C grep -n '[^ -~]'`: `agents/spec.md` "The ASCII gate" paragraph says the perl form "replaces the `grep '[^ -~]'` form wherever a brief or a check names it". Inconsistent with the rules file; the brief should give the perl form.
- Verify items 1, 2 and 4, and the file size rule (880 and 520): consistent with "Token discipline" and "What every package obeys".
- The docs rule: item 7 keeps `docs/HELP.md` and `docs/data-map.md` as Doc text. Consistent.

Findings:
- Case 9 cannot run on the unchanged tree, and it asks for a run with the template line held out to see the test fail, against the no-breakage rule in `agents/spec.md` "What every package obeys".
- The brief excludes G32 although the step changes G32's code. G32's test is not named, run or extended, and `tests/data/snapshot/normalise.test.ts` is missing from the paths.
- Cases 1, 2, 3, 5 and 6 ask for a quoted run of the board card, which only a page shows. The brief names no look as their proof.
- Verify item 3 gives the grep form, which the rules file's ASCII-gate paragraph replaces with the perl form.

## 5. The question

The goal: Axel sees, on each paper under review, the date it was submitted and how long it has waited, on its board card and its Focus lane card, and the Review lane puts the longest-waiting first.

- Case 1: **yes.** A case run of the new function and `laneFacts` passes while CardFacts draws nothing, for example because it has no `now` (check 1). Only the look closes this, and the brief does not name it.
- Case 2: **yes.** It passes on the unchanged tree. It is a guard, not evidence of the goal.
- Case 3: no for the function, since the date must be given with no days. The board-card half is yes, as in case 1.
- Case 4: **yes** for the no-fact half, which passes on the unchanged tree. The finding half needs the schema field.
- Case 5: **yes.** It passes on the unchanged tree.
- Case 6: no. It needs the flag read in the hub's own words.
- Case 7: no. The unchanged tree gives D, A, C, B.
- Case 8: **yes.** A preservation check passes on the unchanged tree.
- Case 9: **yes.** The template line is not the goal.
- The step line's check, which is the brief's verify list (the plan line names no command): **yes.** `npm run test:quick`, the templates test, the ASCII grep and `wc -l` all pass with no fact drawn anywhere, because the step adds no test of the new behaviour.
- Item 1 (the key): **yes** taken alone. A key and a field that nothing draws.
- Item 2 (the function): **yes** taken alone, if no view calls it.
- Item 3 (the board card): no, provided it draws. As briefed it cannot count days without the ProjectCard change (check 1).
- Item 4 (the lane card): no.
- Item 5 (the lane order): no.
- Item 6 (the template): **yes.** Not the goal.
- Item 7 (the Doc text): **yes.** Not the goal.
- Across all items: "on each paper under review" needs the twelve hub manifests to hold `submitted:`. The ruling has the orchestrator write those at landing. The brief does not say that the look needs a hub copy with those dates, so a look on the hub as it is shows no fact on any card.

Findings:
- Cases 1, 2, 3 (board half), 4 (no-fact half), 5, 8 and 9, and the verify list, can pass without the goal being reached. The only proof of the drawn cards is a look, which the brief does not name, with the view, the state and the expected words.
- Item 3 cannot reach the goal without a change to `ProjectCard.svelte`, which is outside the paths.
- The look needs a hub copy holding the dates that the ruling's landing write gives, and the brief does not say so.

## 6. Implied inputs

This is a code step. Each implied input below is missing from "Cases" unless marked otherwise.

- **A hub whose `stages` gives no word `pauses_countdown`**: missing. Expected: no submission fact on any card; the lane order still sorts by `submitted`.
- **A value `daysUntil` reads that the schema calls not a date, such as `2026-10-24T10:00:00+02:00`**: missing, and it costs something. The `midnight` regex `^\d{4}-\d{2}-\d{2}` is not anchored at the end (`presets.ts:375-377`). `node -e` shows `yaml` reading that value as the string `"2026-10-24T10:00:00+02:00"`, and `ISO_DATE` (`^\d{4}-\d{2}-\d{2}$`, `dates.ts:18`) gives it `not_a_date`. Item 2 draws a fact for any "value is a date `daysUntil` reads", with "the date as written". So the card would draw the whole timestamp as the date, beside a finding that calls it not a date. Expected: no fact, as for `soon`, or the brief names the rule.
- **An impossible day, `2026-02-30`**: missing. It matches `ISO_DATE` (no finding), and `Date.parse('2026-02-30T00:00:00Z')` printed `1772409600000`, which is 2026-03-02. The days would be counted from March 2. This holds for `deadline` today too. Expected: the brief names it as accepted, or gives no fact.
- **A date equal to today**: missing. Expected: `2026-11-25 | 0d` and a tip in the plural form for 0, or a stated alternative.
- **The tip of a future date**: missing. Decision 1 gives only the label (`2026-11-26`). Expected: a stated tip, such as the kind and the date with no days.
- **A time near midnight**: missing. `daysUntil` takes the reader's local calendar day against UTC midnight of the date, so the count turns at local midnight, as the deadline badges do (decision 4). Expected: 32 at 00:05 local time on 2026-11-25, and 31 at 23:55 on 2026-11-24.
- **Quoted against unquoted, and a YAML date from another writer**: missing. `node -e` printed `string` for `d: 2026-10-24` and `{"d":"2026-10-24"}` for `d: '2026-10-24'`, so both read alike. Low cost. Expected: the same fact for both.
- **Two projects with the same `submitted` date**: missing. Expected: title order between them.
- **Two projects with the same non-empty deadline and different dates**: missing. Case 7 covers only "no deadline". Item 5 names both. Expected: the older date first.
- **A `submitted` that is not a date (`soon`) in the lane order**: missing. Item 5 does not say how it sorts. Expected: as no date, after the dated cards.
- **A project on another sorted lane (Revise, stage revision) with a `submitted` date**: missing. Item 5 applies the order to every lane without `sort: title`. Expected: Revise cards of equal deadline ordered by the date, with no fact drawn.
- **The project form writing the field back**: missing, and it costs something. `fieldValues` (`src/lib/state/forms/schema.ts:443-501`) has no `submitted`, so the editor opens the Submitted box empty for a manifest that holds a date. Expected: the form opens with the manifest's date, and a save that leaves it untouched leaves it as written.
- **A lane move onto Review** (`move_writes: { stage: submitted }`, `vocab.yml:190`), which writes no date: missing. Expected: no fact until a date is written, and nothing written by the move.
- **A hub's `manifest_fields` row naming `submitted`**: missing (spec's "checked empty, duplicated, and colliding" rule). Expected: the existing finding for a row naming a field oculus's form has, with the row left out. No hub does this today.
- **A hub stage carrying both `pauses_countdown` and `terminal` plus `public`**: missing. Both facts would draw, after the year on the board card (item 3) and before it on the lane card (decision 3). Expected: one order on both cards, or the difference stated.

Findings: each item above is missing from "Cases". The two that cost something are the timestamp value drawn as a date beside a `not_a_date` finding, and the project form opening the field empty.

## 7. ADRs

- `ls docs/adr` printed `ls: docs/adr: No such file or directory`.
- `find . -name '[0-9][0-9][0-9][0-9]-*.md' -not -path './node_modules/*'` printed nothing (exit 0).
- The configuration block in `.scratch/migration/orchestrator-state.md` lines 5-22 holds no `adr` key.
- No record exists.

Findings: none.

## 8. Dictated text

`LC_ALL=C grep -n '[^ -~]' .scratch/migration/agents/briefs/O190.md` printed nothing (exit 1), so the brief is ASCII.

- `` `label: "Submitted"` ``: `grep -n 'label: "Submitted"' .scratch/migration/agents/briefs/O190.md` gives line 34. Holds.
- `` `# submitted: YYYY-MM-DD` ``: `grep -n '# submitted: YYYY-MM-DD' ...` gives line 39. Holds; it matches the `# deadline: YYYY-MM-DD` line of the block.
- `` `2026-10-24 | 32d` `` and the other four labels: `grep -n '2026-10-24 | 32d' ...` gives line 89. These hold under the writing rules (ASCII, ` | ` separator, the catalog's `{0}d` form of `due_days`, `overdue` and `stale_behind`). They depart from the step line's example ("submitted 2026-10-24 | 32 d"), as check 2 says.
- `"Submitted 2026-10-24, 32 days ago"`: `grep -n 'Submitted 2026-10-24, 32 days ago' ...` gives line 89. It holds under `agents/spec.md` "The working rules" (prose) and the plural rule. One judgment, not a rule break: every other card tip has the form "Kind: value" (`'Year: {0}'`, `'Tier: {0}'`, `'Focus lane: {0}'`, `'Role: {0}'`, `project.yml:96-147`), and this one does not.

Findings: none that break a rule.

## Declined to judge

- `plan.md` has no section named Goal (`grep -n -i -E '^(#+ *goal|\*\*goal|goal:)' .scratch/migration/plan.md .scratch/migration/orchestrator-state.md` printed nothing). Check 5 uses the goal as the brief-check prompt states it.
- Decision 2 reuses the glyph `waiting` for the fact. `LaneCard.svelte:244` and `CardLinks.svelte:107` already draw that glyph for the WAITING ON line, so a submitted paper that also waits on a person shows the glyph twice with two meanings on one card. Whether that reads clearly is a design call for the orchestrator.
- Where the label and tip words are composed: `LaneFact` carries only `label` and `whole` strings, and `focus.ts` holds no words (head comment, lines 6-9). The fact therefore needs a days number, and both `CardFacts.svelte` and `LaneCard.svelte` would compose `date | Nd` and the plural tip. The rules file's "a rule exists once and is reused" points to one shared formatter, for example in `src/lib/views/shared/card/card.ts`, which `LaneCard.svelte:41` already imports and which is not in the paths. I did not judge which file it belongs in.

Agent usage: aabe2d223f6b3f8cf, claude-opus-5-5, 219777 tokens, 80 tool uses, 662 s.

## Closed

- Names, the lane order's five sentences: item 6 rewrites them, and `config/catalogs/vocab.yml`, `config/options/catalogs/vocab.yml` and `vocab.ts` join the paths by line range; a sentence the change makes false is a defect of the change (`agents/spec.md:72`), so this stays inside the step's line.
- Names, `ProjectCard.svelte` and `now`: item 4 passes `now` from `ProjectCard.svelte:390` and updates its head comment; the file joins the paths (open item 776, automode).
- Names, `fieldValues`: item 1 gives the form `submitted`; `src/lib/state/forms/schema.ts` joins the paths (open item 776, automode).
- Names, `pauses_countdown` descriptions: item 7 adds the new effect to the three.
- Names and Cases, G32: item 9 and case 18; `tests/data/snapshot/normalise.test.ts` joins the paths, and G32 is named in the brief's reading list.
- Step line, the label's departure: decision 1 now follows the ruled example's words, `submitted 2026-10-24 | 32d`, in the catalog's `{0}d` form.
- Premises: the year tag is at `CardFacts.svelte:118-122`; `deadline`'s help at line 76 also holds the word; the date 2026-11-26 is named as the ruling's.
- Cases, case 9: removed; G83's test is run after the change (case 19, verify 2), with no run that holds a line out.
- Cases and the question, the board card: the brief names the orchestrator's look at landing as the proof of what the cards draw, on a hub copy holding the twelve dates, in Oculus Light and a dark theme.
- Cases, the ASCII check: verify 3 gives the perl form.
- Implied inputs: cases 4 (today), 6 (a timestamp, no fact, by the `YYYY-MM-DD`-only rule of item 2), 7 (quoted), 10 (no `pauses_countdown`), 12 (same deadline), 13 (same date), 14 (not a date in the order), 15 (Revise lane) and 3's tip (decision 1) are added; the impossible day is decision 4; the order of year and fact is decision 3; a lane move onto Review writes only the stage, which no change of this step touches, so it is no case; a hub's `manifest_fields` row naming `submitted` meets the existing finding for a row naming a field oculus has, which no change of this step touches, so it is no case.
- Declined, the glyph: decision 2 takes `stale`, the Review lane's hourglass, in place of `waiting`.
- Declined, the words' place: item 3 puts one formatter in `src/lib/views/shared/card/card.ts`, which joins the paths (open item 776, automode).
