# Step O70 brief check (on main at aa79b883)

The report of the fresh agent of the `spec` skill's "Steps / The brief check", on `agents/briefs/O70.md`. A page this report cites (the rules file, a standard, a skill's text) is named with its section, never with a line number, since a page's lines move and a section's name does not. A line of code or a hit of a grep keeps its `file:line`.

The report is written in the rules file's character set. A character outside it in a quoted line is written by its name in angle brackets, such as `<tab>` or `<em dash>`.

Brief check of O70 (`/Users/axelfaes/workspace/oculus/.scratch/migration/agents/briefs/O70.md`), read as it stood after its on-disk update during this check (item 7 now names `focus.career_in_day`, `career_in_days`, `career_day_ago`, `career_days_ago`; write list now has `focus.yml lines 1-20`). Tree: main at aa79b883 (`git log --oneline -3`: "aa79b883 Land O60 ..."); `git status --short` shows only ledger files modified plus untracked briefs O69.md and O70.md. `plan.md` has no `## Goal` section (`grep -n "^## " plan.md`: Steps, Could run in parallel, Rulings, Agents, Blocked), so the goal used is the one the task gives: card facts that say what they are, and the career banner redrawn as the Step 0 line says.

## 1. Names

Commands: `for n in CardStatus foldedLine daysLeft career_heading career_next career_milestone career_funding career_record_line in_days days_ago LinkedItem laneShape laneRow LaneHead; do grep -rn "$n" src tests config docs --exclude=local.yml; done`, `grep -rn -i "career strategy\|career banner\|folded to one line\|funding obtained" src tests config docs README.md --exclude=local.yml`, `grep -rn "ProjectCard" src tests docs config --exclude=local.yml`, `grep -n "^focus_lanes:\|key: idea, \|key: run, " config/catalogs/vocab.yml`.

The hits below are outside "Paths this step writes". The first eight are made false by the change:
1. `config/options/sources.yml:74`: "whose title, goal, next milestone with its day, situation and order of work surface on the Focus board's Career strategy banner". This becomes false. With `foldedLine` gone, the title surfaces nowhere on the banner (its only reader besides the banner is `src/lib/state/forms/page-entry.ts:200`, the editor), and the banner is named Career.
2. `config/defaults/sources.yml:52`: "the title, the goal, ... are drawn by the Focus board's Career strategy banner". This becomes false for the same two reasons.
3. `docs/templates.md:92`: "drawn by Focus's Career strategy banner". The name becomes false.
4. `docs/templates.md:1415`: "drawn by Focus's Career strategy banner: the title, the goal, ...". Both the name and "the title" become false.
5. `src/lib/data/model/model-collections.ts:198-200`: "which the Focus board's career banner reads: its title, ...". "Its title" becomes false.
6. `src/lib/data/snapshot/normalise-parts/career.ts:1-3` and `:57`: "The career strategy as the Focus board's career banner reads it, ...: the title, ...". "The title" becomes false.
7. `tests/fixtures/hubs/demo/.oculus/data/academic/career.yml:1`: "drawn by the Focus board's "Career strategy" banner". The banner's name becomes false.
8. `config/catalogs/vocab.yml:181-182`: the `build` and `idea` rows. Item 1 must write them (icons `build` and `idea`), but the write range is "lines 168-180". The real places are the head comment at 171, `focus_lanes:` at 172 and the rows at 173-182. Without a fix, the two rows are written outside the write list.

These hits are not made false or broken:
9. `docs/HELP.md:207` ("the career strategy" in the views table) is still a true description (judgment).
10. `src/lib/views/boards/focus/Band.svelte:97` keeps reading `focus.in_days` and `focus.days_ago`, which stay.
11. `src/lib/views/boards/focus/rows.ts:262-263` reads the different keys `focus.command.in_days` and `focus.command.days_ago`.
12. `src/lib/views/boards/focus/Band.svelte:11,113,133` pass a glyph to `LaneHead`.
13. `src/lib/state/boards/board/index.ts:21` re-exports `LinkedItem`; adding a field does not break it. O69 also writes this file.
14. `src/lib/state/sources/repositories/graph-lanes.ts:37` and `views/sources/repositories/graph/Graph.svelte:74,172` hold `laneRows`/`LaneRow`, a different construct with a similar name.
15. These comments name `ProjectCard.svelte` and stay true: `src/lib/views/boards/projects/Projects.svelte:51,69`, `src/lib/views/boards/project/Project.svelte:27,55,124`, `CardBrief.svelte:5`, `Subtasks.svelte:13`, `Followups.svelte:15`.
16. `tests/checks/tree/allow-styling.ts:60-77` cites `ProjectCard.svelte:392/399/403`, which are already stale on main (the rules are at 446, 453 and 457). The entries are keyed on the `line` text, which the step does not change.
17. `presets.ts:166-168` (the `chips` doc, "the words the card's status row draws") and `tones.ts:315-320` stay true.
18. `.when` is also used by the Order of work rows (`CareerPanel.svelte:171`), so it stays. Item 7's "where nothing else uses them" covers this, but premise line 17 describes `.when` only as the milestone's date box.

## 2. The step line

Ruling 328 (a): `plan.md:2661`. Step line: `plan.md:794`. Step 0 lines: `plan.md:795-796`.
1. "each row of `focus_lanes` gains `icon:`, a glyph name as a stage row has": item 1.
2. "drawn before the lane's label on the card": item 3, the lane fact.
3. "drawn in the lane's heading on Focus": item 2.
4. "every fact of the card's top row (...) carries a glyph that says its kind": item 3. Partly unserved: a form or chip whose vocab row names no `icon`, or a lane row with none, gets no glyph (item 3 "its chip as today"; item 1 "draws its words alone"). Only compute gets a fallback (`hpc`). Either the step line's "every fact" holds only for rows that name an icon, or a fallback is needed. The brief does not say which.
5. "a hover title naming the kind": item 3 (Tooltip per fact).
6. "the venue leaves the top row for a labelled line Venue": item 4.
7. Step 0 line 1 (held until O60 lands): no requirement needed. O60 has landed (head commit "Land O60").
8. Step 0 line 2:
   - "the heading is the word Career": item 5.
   - "unfolded, its sections stand side by side ... each a column of the Focus board's own section look, wrapping ... only when the pane is narrow": item 6.
   - "one plain line ... no date box, no tag and no second box": item 7.
   - "a small table, a row per role and a column per record row ..., with Funding obtained as a row": item 8.
   - "Looked at on TEST at O70's landing": the Cases paragraph (`O70.md:58`).
   - Every part maps. Part with an unclear requirement: "each a column of the Focus board's own section look". Premise `O70.md:18` says the `.lbl` is "a glyph and the label", and every `.lbl` of the command center carries a `Glyph` (`CommandCenterView.svelte:121,130,159,207,242`). Item 6 names only "extra-small bold uppercase in the accent colour". Whether each column heading carries a glyph, and which glyph and key, is left open. If one is drawn, five glyph keys are needed, which the `career_`-only rule and the write list do not foresee.

## 3. Premises

Rerun commands: `wc -l` of the named files, `cat -n`/`sed -n` of each range, `grep -n` as listed.
1. `ProjectCard.svelte` is 502 lines: holds. Limit 520 at `spec.md:47`: holds (and `tests/checks/tree/size.test.ts:28-29`). The top row "`:381-401`": the row `<div class="row">` is at 382-402, and 381 is the folder line. Off by one; the content description holds.
2. `CardStatus.svelte` is 23 lines and draws one `Chip` per `item.chips` with `chipLabel`/`chipGlyphName`: holds.
3. `codeLabel` and glyph `project.card.code_glyph` = `published` (`project.yml:46`): holds. `repro_glyph` = `check` (`project.yml:92`): holds. `roles.lead_glyph` = `author` (`config/text/views/shared/roles.yml:6`): holds.
4. `resourceGlyph` at `schema.ts:208-213`, returning undefined outside cluster, machine and storage: holds.
5. Tag props `label`, `glyph`, `tone`, `wrap` and no title: holds. Chip draws `title` only with `onclick`, through `Tooltip` (`Chip.svelte:73-90`): holds. Tooltip with the empty string draws no bubble (`Tooltip.svelte:40`): holds.
6. `CardLinks.svelte` is 184 lines: holds. `kinds` "(`:51-82`)": actual 52-83, off by one. `LinkedItem` at `presets.ts:98-101`: holds. `grep -rln CardLinks src` prints only `ProjectCard.svelte`: holds. `BoardItem.venue` at `presets.ts:113`: holds. `venue: diamond` (`icons.yml:87`): holds.
7. "`config/catalogs/vocab.yml:168-180`, the head comment of `focus_lanes` and ten rows": WRONG. `grep -n` gives the head comment at 171, `focus_lanes:` at 172 and the rows at 173-182 (the same at base: `git show aa79b883:config/catalogs/vocab.yml | grep -n "^focus_lanes:"` prints `172:focus_lanes:`). The write-list range 168-180 also misses rows 181-182 (see Names 8). "a `stages` row has `icon` (`:65-78`)": actual `stages:` at 64 and rows 65-77, off by one. No row has `icon`: holds.
8. `laneRow` is a `strictObject` at `vocab.ts:28-62` (comment from 27, `const laneRow` at 32, end at 62): holds.
9. `Lane` at `focus.ts:62-70` and `laneShape` at `:158-176`: hold.
10. Option `focus_lanes` at `config/options/catalogs/vocab.yml:146-168`, with stage `icon` as `control: glyph` at `:22-24`: holds.
11. `LaneHead` takes an optional `glyph`: holds, but its guard is `{#if glyph !== undefined}` (`LaneHead.svelte:35`). An empty string reaches `<Glyph name="">`, and `glyph()` throws for a name the catalog lacks (`text.ts:86`; `Glyph.svelte:25` "An unknown name throws"). Item 1 gives `Lane.icon` as "the empty string when the row names none", so item 2 must not pass it through as is. The brief does not say this. `Lanes.svelte:226` draws no glyph: holds.
12. Glyph names, from `grep -n "^ *$n:"` over `icons.yml`/`glyphs.yml`: live zap "~"; draft pen-line "[e]"; edit pencil "[e]"; stale hourglass "(t)"; overdue ban "(!)"; snooze moon "zZ"; compass compass "[F]"; flag flag "|>"; idea lightbulb "(i)". All hold. `build` exists in neither: holds. `hammer` only for `latex_build` (`icons.yml:244`): holds. `[B]` not taken (the grep prints nothing): holds. Not stated in the brief: `draft` and `edit` share the stand-in "[e]".
13. `CareerPanel.svelte` is 355 lines with `FoldHead title={foldedLine(career)}` and `name={t('focus.career_heading')}`; "Career strategy" is at `focus.yml:11`: holds. The section order and the `.milestone`/`.when`/`Tag`/`facts`/note markup as described: holds.
14. `career.ts` is 122 lines with `foldedLine`, `daysLeft` and `trackRecord`: holds. `grep -rn "foldedLine\|daysLeft" src tests` gives only `career.ts` and `CareerPanel.svelte`: holds. `Band.svelte:97` reads `focus.in_days`/`focus.days_ago`: holds.
15. Section look at `CommandCenterView.svelte:292-315` (`.grp` 292, `.lbl` 301-312, `summary.lbl` 313-315): holds.
16. G124, G12 and G13 as described: hold (`agents/guarded.md:183-186`, `:216-221`). G12's Code line names `src/lib/data/shapes/catalog-files.ts` and `config/catalogs/`, which the step changes.
17. `docs/HELP.md:287` quote: holds.
18. O69's brief on disk, with paths that overlap this step's: `presets.ts` (O69 whole file), `config/text/views/boards/project.yml` (both whole), `icons.yml`/`glyphs.yml` (both whole), `config/catalogs/vocab.yml` (O69 line 52). These are left to the session's Steps 5, as the brief says.
19. Verify list: `.agents/plan.yaml:4` `verification: .scratch/migration/orchestrator-state.md`. The state file's `verify:` is `npm run test:quick` (`orchestrator-state.md:6-7`), and the brief's item 1 matches: holds.
20. ADR line: see ADRs.
21. Not a premise of the brief, but a fact it rests on: `ProjectCard.svelte` has two users, `src/lib/views/boards/projects/Projects.svelte:69` (the board, imported as `Card`) and `src/lib/views/boards/project/Project.svelte:55` (the project view). Line 14 says `ProjectCard.svelte` is CardLinks' one user, which is true, but no line says the card itself is drawn in two views.

## 4. Cases and checks

1. Case 5's expected words do not match oculus's vocabulary. `chipLabel` returns the row's `label` (`tones.ts:311-313`), and `config/catalogs/vocab.yml` gives `journal: { label: "journal article" }` and `parked: { label: "parked (not being worked)" }`. So the row reads "journal article" and "parked (not being worked)", and the titles read "Form: journal article" and "Status: parked (not being worked)". The case says "journal", "parked", "Form: journal" and "Status: parked". It also says the row reads "Reproduced", but the tag's label is `board.repro_yes` = "reproduced" (`config/text/views/boards/projects.yml:47`). Item 3's examples "Form: journal" and "Status: parked" carry the same error.
2. Case 3 leaves its expected result to the builder ("the finding the catalogs give an unknown glyph name in a stage row (read on the tree ... first ...)"). It asks the builder to read and state a place the step does not change, the stage `icon` rule. Its "no broken drawing" conflicts with the code as it is: `Glyph.svelte:25` and `text.ts:86` throw on an unknown name, and the brief names no guard. `hasGlyph` (`text.ts:95`) is the tree's own guard "for a caller handed a name by data it cannot trust".
3. Case 13 asks the builder to check `Band.svelte`, which the step does not change. It guards keys the step keeps, so a grep is enough. It is flagged under the criterion given.
4. Cases 2 to 4 are to be checked "by G12's and G13's tests". No row of those tests feeds a hub `focus_lanes` row with a missing, unknown or non-text `icon`. The G13 shape case runs over shipped files: `tests/checks/config/config-folder.test.ts`, 'words a part of %s its shape refuses'. These tests do not exercise the cases.
5. Against `spec.md:59` ("A step whose change touches an entry's code runs that entry's test"): G12's Code line covers `config/catalogs/` and `catalog-files.ts`, which the step changes. The verify list names only G124's test (`O70.md:132`). `npm run test:quick` picks tests by import and by name (`tests/tiers/quick.mjs:148-190`, `RELATED_DEPTH = 2`). A changed `.yml` is imported by nothing, and no test is named `vocab.test.ts`, `icons.test.ts` or `glyphs.test.ts` (`find tests -name ...` printed only `tests/data/sources/career.test.ts`). G12's `tests/checks/config/config.test.ts` and `config-folder.test.ts` may therefore not run. Whether `catalog-files/vocab.ts` reaches them within depth 2 is not verified. The verify list should name them.
6. Against `spec.md:52` ("a table with plain cells is `ui/Table.svelte`, and only a table whose cell is a bar or a control is hand-drawn"): item 8's track record is a table of plain cells, and the brief does not name `ui/display/table/Table.svelte`. Its "Libraries checked" line says "a table with the project's own ... markup". The Funding obtained cell "spanning the record columns" cannot be drawn by `Table.svelte`, which has no colspan (`grep -n "colspan\|span" src/lib/ui/display/table/Table.svelte src/lib/ui/display/table/table-rows.ts` prints nothing). This is a clash between the dictated layout and the rules file, and the brief neither names it nor resolves it.
7. The Cases paragraph says "a scratch hub copy" without saying which hub. `spec.md:38` holds tests to synthetic fixtures and keeps the real hub read only. The demo fixture `tests/fixtures/hubs/demo` would avoid copying the real hub's data. This is minor.
8. No other case is inconsistent with `spec.md`. Case 11 (look only, with the grid rule stated) matches `spec.md:64`.

## 5. The question

The goal tested is the one this step delivers: card facts that say what they are, and the career banner redrawn as the Step 0 line says. Each answer is a judgment.

Cases:
1. Case 1: no. The look on TEST at landing shows the glyph, the title and the heading.
2. Case 2: yes, for its drawing half. A config-loader run proves "no finding". It does not reach `LaneHead`, where an empty `icon` hits `<Glyph name="">` and throws (`LaneHead.svelte:35`, `text.ts:86`). Only reading or the look shows it.
3. Case 3: yes. Its expected finding is left open. "No broken drawing" is checked by no run, and G12 and G13 have no lane row.
4. Case 4: no, provided the loader run is quoted. The shape finding is a config fact.
5. Case 5: it can pass on the look while the brief's own expected words are wrong (see Cases 1). A builder matching the brief's words might hard-code them.
6. Case 6: no (reading and the look).
7. Case 7: yes. The `hpc` fallback is likely written in `CardFacts.svelte`'s markup. A "run of the functions" over `resourceGlyph` prints `undefined` whether or not the card falls back. Only reading proves it, unless the fallback lives in a function the run calls.
8. Case 8: partly. A run of `daysLeft` proves the day words. The composed line "{0} on {1}, {2}", and "the milestone alone" without a day, are proven only if the composition is a function the run calls.
9. Case 9: no (the look).
10. Case 10: yes, as specified. `trackRecord` is "unchanged" and keeps zero-count lines (`career.ts:105-111`). A run of it cannot show that a record row no role holds draws no column, or that Funding obtained is one spanning cell, if both live in the component.
11. Case 11: no (the look).
12. Case 12: yes. No function decides which sections draw. The "run of the functions" proves nothing, and reading plus the look are the proof.
13. Case 13: no (the keys are greppable).

Step line's check: "Looked at on TEST at O70's landing" cannot pass without the goal being seen. The look should cover both views that draw the card, the Projects board and the project view (`Project.svelte:124`). The brief says "a card", not which views.

Items:
1. Item 1: no. Shape, option and rows are file facts. It can pass while an empty `icon` crashes the heading (see item 2).
2. Item 2: yes. "passes the lane's icon to `LaneHead`" passes with `icon: ''` handed through, which throws.
3. Item 3: partly. A form or chip without an icon, and a lane without one, leave a fact with no glyph while every item line is met. Keyboard readers get no title unless the wrapper is `focusable` (`Tooltip.svelte:53-58`), which the brief does not decide.
4. Item 4: yes, for a long venue. `item.venue.text` joins name, quartile, JIF and APC with " | " (`presets.ts:383-390`). A `Tag` without `wrap` cuts it with an ellipsis (`Tag.svelte:26-28`) and has no title, so the venue can be unreadable while the item is met.
5. Item 5: no.
6. Item 6: partly. The section look's glyph is left open (see The step line).
7. Item 7: no.
8. Item 8: no for the layout, but it cannot be built as written under `spec.md:52` (see Cases 6).
9. Item 9: yes. It names only `HELP.md:287` and five head and doc comments. The false sentences in Names 1 to 7 stay, so "the words that state these are made true" passes while seven places still say the banner is the "Career strategy" banner and draws the title. Also, `HELP.md:287` is the Focus bullet, but the card's facts belong to the Projects board's and the project view's card. The nearest bullets are `HELP.md:288` (Projects) and `:290` (Lead badge), which are outside the write list (and O69 writes `:290`).

Verify item 4: the grep `career_funding'` does not match the YAML key `career_funding: 'funding obtained: {0}'` (`focus.yml:8`). A leftover YAML key passes this check. The orphan-key test would catch it only if it runs (see Cases 5).

## 6. Implied inputs

Each item is an input missing from "Cases", with the expected result. The expected results are judgments.
1. A hub lane row with `icon: ""`. Expected: no finding, or the option's glyph finding, and the lane drawn with its words alone on the card and in the heading, with no throw. Today `LaneHead.svelte:35` passes `''` to `Glyph`, which throws.
2. A hub lane row naming an unknown glyph (`rocket`, case 3). Expected: a finding naming the hub's file and key, and the lane drawn with its words alone, guarded by `hasGlyph` (`text.ts:95`). Without the guard, `Glyph` throws on the card and in the Focus heading.
3. The project view (`src/lib/views/boards/project/Project.svelte:124`) draws the same card. Expected: the same top row, titles and Venue line as on the board. The look should open it.
4. The list mode of a project board (`Projects.svelte:258-266`): the Focus column draws `projectLane(...).label` with no icon, and the venue column draws `item.venue?.short`. Expected: unchanged, since ruling 328 names the card and the lane heading. Item 1's "wherever it is drawn" could be read as asking for icons there, and `Projects.svelte` is O69's path.
5. The Move to menu of a Focus lane card (`Lanes.svelte:127-144`) lists lanes by label. Expected: unchanged, or an icon per menu row. The brief should say which; `menuFor` is also changed by O71.
6. Terminal themes (ASCII stand-ins). `draft` and `edit` are both "[e]" (`glyphs.yml:26,28`), so Push and Revise draw the same mark, and `build` adds "[B]". Expected: either accepted and stated in decision 1, or a distinct name chosen for one of the two lanes.
7. Two hubs with the same lane key and different `icon`s, or one with and one without. The heading reads the union row (`Lanes.svelte:73`, `lanes(vocabOf())`), while the card reads its own hub's row (`ProjectCard.svelte:125`). Expected: the heading draws the union row's icon, as it already draws its label and tone, and each card draws its own hub's. Not stated.
8. A hub form or chip whose vocab row names no `icon` (`legendRowShape` gives `''`, `tones.ts:97-113`). Expected, by the step line "every fact ... carries a glyph": a glyph for the fact (a fallback as for compute), or a stated exception.
9. A long venue text (name, quartile, JIF, APC, `presets.ts:383-390`). Expected: the whole text readable, through `Tag`'s `wrap` (`Tag.svelte:26-28`) or a title.
10. Funding obtained with no project of the user in any record row. `trackRecord` returns `{ roles: [], funding: n }` (`career.ts:112,121`). Expected: a table holding the Funding obtained row and its count in one cell. The brief's "cell spanning the record columns" spans zero columns.
11. Keyboard reach of the facts' titles: a `Tooltip` around non-control content opens on keyboard focus only with `focusable` (`Tooltip.svelte:53-58`). Expected: a decision, either a tab stop per fact (seven or more per card) or none. `spec.md:60` counts tab stops as visible. Not decided.
12. A milestone holding a web address: today it is a link (`CareerPanel.svelte:150`, `LinkedText`; head comment `:10-12`). Expected: the one-line Next keeps the address a link.
13. The YAML values `{0} on {1}, {2}` and `{0} days ago` begin with `{`. Written unquoted they parse as a flow mapping. Expected: quoted, as `focus.yml:12` (`'{0} ({1})'`) already is.

Covered by existing cases: a record row with a zero count everywhere (case 10), a career file without `self` (no Track record column, under item 6's "A section with nothing to draw draws no column"), and an invalid `milestone_date` (already dropped upstream, `model-collections.ts` doc of `milestoneDate`, "absent when it is not" a day).

## 7. ADRs

1. `ls docs/adr` printed "ls: docs/adr: No such file or directory". The brief's statement holds.

## 8. Dictated text

Each line below was found in the brief with `grep -n` over `O70.md` (the matches printed `O70.md:26`, `:29` to `:36`, `:38`, `:39`). `LC_ALL=C grep -n '[^ -~]' O70.md` printed nothing, so every dictated line is ASCII.
1. `O70.md:26`: the `laneRow` description "The glyph name the lane is drawn with, a key of glyphs.yml.". Holds. It matches the `keyed` row's wording (`vocab.ts:15`).
2. `O70.md:26`: `icons.yml` `build: hammer`. Holds. `hammer` is shipped, since `latex_build` uses it at `icons.yml:244`.
3. `O70.md:26`: `glyphs.yml` `build: "[B]"`. Holds: three printable ASCII characters, as `findings.config.glyph_not_ascii` asks. The shared-stand-in issue is in Implied inputs 6.
4. `O70.md:29`: `project.card.lead_tip` `Role: {0}`. Holds.
5. `O70.md:30`: `project.card.lane_tip` `Focus lane: {0}`. Holds.
6. `O70.md:31`: `project.card.form_tip` `Form: {0}`. Holds. The example "Form: journal" is wrong (Cases 1).
7. `O70.md:31`: `project.card.chip_tip` `Status: {0}`. Holds. The example "Status: parked" is wrong (Cases 1).
8. `O70.md:32`: `project.card.code_tip` `Code: {0}`. Holds.
9. `O70.md:33`: `project.card.repro_tip` "Reproduced". Holds. It differs in case from the tag's own label "reproduced" (`projects.yml:47`).
10. `O70.md:34`: `project.card.compute_tip` `Compute: {0}`. Holds.
11. `O70.md:35`: `project.card.venue` "Venue". Holds.
12. `O70.md:36`: `focus.career_heading` "Career". Holds. "Fold Career" and "Unfold Career" come from the existing `focus.fold` "Fold {0}" and `focus.unfold` "Unfold {0}" (`focus.yml:90,120`): holds.
13. `O70.md:38`: `focus.career_next_line` `{0} on {1}, {2}`. Holds. It must be quoted in YAML (Implied inputs 13).
14. `O70.md:38`: the day words "in 1 day", "in {0} days", "today", "1 day ago", "{0} days ago". Hold. "{0} days ago" must be quoted in YAML. "today" reuses `focus.today` (`focus.yml:119`).
15. `O70.md:39`: `focus.career_funding_row` "Funding obtained". Holds.

## Declined to judge

- Whether a hub `stages` row with an unknown `icon` gives a finding today, and through which reader. I read `catalogs.ts` `iconFindings`, `value-rule.ts:217-223`, `schemas/options.ts:149-152` and `workspace-layer.ts:221-247`, and did not find the hub-file path for a row field. Settling it takes a loader run over a hub fixture, which this check may not write. Not verified.
- Whether `npm run test:quick` selects `tests/checks/config/config.test.ts` and `config-folder.test.ts` for this diff: the import chain from `catalog-files/vocab.ts` within depth 2 was not traced. Not verified.
- Whether the merge of O69's and O70's shared files is simple: left to the session's Steps 5, as the brief says.
- Decision 1's choice of glyph per lane ("closest to the lane's sub-line"): a design judgment for Axel's look, not a rules question.

Agent usage: a702302861796c9d4, claude-opus-5-5, 258092 tokens, 102 tool uses, 11 min 10 s.

## Closed (the session's change to the brief for every finding above, and each dictated line added after the check, made before the preparation commit)

- Names 1 to 7: item 9 names each sentence, made to name the banner Career and drop the title; the write list gains `config/options/sources.yml` line 74, `config/defaults/sources.yml` line 52, `docs/templates.md` lines 92 and 1415, `model-collections.ts` lines 198-200, `normalise-parts/career.ts` lines 1-3 and 57 and the demo fixture's `career.yml` line 1; verify item 4's grep holds "Career strategy".
- Names 8 and Premises 7: the write range is `config/catalogs/vocab.yml` lines 171-182, and "What is on the tree" gives the comment at 171, the key at 172 and the rows at 173-182, and `stages:` at 64 with rows 65-77.
- Names 18: item 7 keeps `.when` for the Order of work rows and removes `.milestone`.
- The step line 4 and Implied 1, 2 and 8: item 1 draws a lane whose row names no icon or an unknown one with the glyph `focus`, item 3 a form or chip with none with `tag`, both through `hasGlyph`; decision 7; cases 2, 3 and 14.
- The step line 8 (the section look's glyph): item 6 gives each column heading a glyph through new `career_` keys (`flag`, `calendar`, `info`, `list`, `book`, existing names), inside the `career_` block of `focus.yml`; decision 8.
- Premises 1 and 6: the references read `:382-402` and `:52-83`.
- Premises 11: "What is on the tree" states `LaneHead`'s guard and that `Glyph` throws on an unknown name; item 2 passes the row's icon only where `hasGlyph` knows it.
- Premises 12 and Implied 6: decision 9 states that Push and Revise share `[e]` under a terminal theme and differ by their label.
- Premises 18: "What is on the tree" names O69's and O71's shared files and the lines each writes; `vocab.ts` narrows to lines 27-62 and the ranges keep an unchanged line between this step's hunks and O71's; the dispatch entry records `shared_paths:`.
- Premises 21 and Implied 3: "What is on the tree" names both views that draw the card; case 5 and the Cases paragraph have the look open the project view too.
- Cases and checks 1: item 3 and case 5 read "journal article", "parked (not being worked)" and the tag "reproduced"; the titles "Form: journal article" and "Status: parked (not being worked)".
- Cases and checks 2: case 3 expects the lane drawn with `focus`, nothing thrown, and the loader's output quoted as printed; it asks for no reading of the stage rule.
- Cases and checks 3: case 13 is the grep of the two keys in `focus.yml`.
- Cases and checks 4: cases 2 to 4 are runs over a copy of the demo fixture with the lane rows of each case, and a reading of the guards.
- Cases and checks 5: verify item 2 names `tests/checks/config/config.test.ts` and `config-folder.test.ts`, G12's and G13's tests.
- Cases and checks 6: item 8 draws the track record with `Table.svelte`, not sortable, Funding obtained a last row with its count in the first count column; decision 5; case 10.
- Cases and checks 7: the case runs copy the demo fixture `tests/fixtures/hubs/demo`.
- The question, cases 7, 8, 10 and 12: items 3, 7 and 8 put the compute glyph choice, the Next line and the table's columns and rows in functions the case runs call.
- The question, item 9: closed with Names 1 to 7, and the write list gains `docs/HELP.md` line 288, the Projects bullet, for the card's facts.
- The question, verify item 4: the grep matches `career_funding\b` and the YAML keys `career_next:` and `career_funding:`.
- Implied 4 and 5: item 1 says the list mode and the move menu draw the lanes as today; case 16.
- Implied 7: item 2 says the heading reads the union row and each card its own hub's.
- Implied 9: item 4 draws the venue tag with `wrap`.
- Implied 10: item 8 and case 10 give the table with no role row.
- Implied 11: item 3 makes the facts no tab stops; decision 10.
- Implied 12: item 7 keeps the milestone in `LinkedText`; case 15.
- Implied 13 and Dictated text 13 and 14: item 7 quotes the values that begin with `{`.
- Added after the check: `focus.career_goal_glyph` `flag`, `focus.career_next_glyph` `calendar`, `focus.career_situation_glyph` `info`, `focus.career_order_glyph` `list`, `focus.career_record_glyph` `book`: hold; each value is a glyph name both catalogs hold (`grep -nE` over `glyphs.yml`), each key a `career_` key.
- Added after the check: the titles "Form: journal article" and "Status: parked (not being worked)": hold; ASCII, filled from `Form: {0}` and `Status: {0}`.
- Changed with O71's brief-check finding on the same sentence: "What is on the tree" names the worktree, how the base is read and the base's unused-exports output, and the verify section no longer names an output filter, which `spec.md` does not hold.
