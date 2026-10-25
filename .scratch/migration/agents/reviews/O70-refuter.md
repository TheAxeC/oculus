# Step O70 refuter report (on .agents/worktrees/migration-O70, base f5818542)

A page this report cites (the rules file, a standard, a skill's text) is named with its section, never with a line number, since a page's lines move and a section's name does not. A finding in code keeps its `file:line`.

The report is written in the rules file's character set. A character outside it in a quoted line is written by its name in angle brackets, such as `<tab>` or `<em dash>`.

There is no ADR folder in oculus: `ls /Users/axelfaes/workspace/oculus/docs/adr` and the same in the worktree both print "No such file or directory", and `.agents/plan.yaml` has no `adr` key. No ADR governs the step. The task names `.agents/worktrees/O7x-base/unused-exports.txt`, which does not exist (`ls ../O7x-base`: "No such file or directory"). The brief names `.agents/worktrees/O70-base/unused-exports.txt`, and that is the file compared below.

## Verification (rerun by the reviewer)

```
# Verify 1, from the worktree root (the state file's reviewer form adds --base)
md5 of docs/diagrams/* before: 02949c02fca9872a6b0a1d946278ed8b
npm run diagrams   (regenerated docs/diagrams/*.dot and *.svg)
md5 of docs/diagrams/* after:  02949c02fca9872a6b0a1d946278ed8b   (the committed diagrams match the source; nothing changed)
npm run test:quick -- --base f5818542
test:quick: 32 changed file(s), from git since f5818542
test:quick: 86 test file(s)
        tests/checks/source/keys.test.ts: imports at depth 1
        tests/checks/config/integrity.test.ts: imports at depth 2
        tests/checks/diagrams/diagrams.test.ts: imports at depth 2
        tests/checks/tree/boundaries.test.ts: imports at depth 2
ok      ASCII gate (0.8 s)
ok      prettier (0.9 s): All matched files use Prettier code style!
ok      svelte-kit sync (2.2 s)
ok      eslint (16.1 s)
ok      svelte-check (25.4 s): 1792898197972 COMPLETED 537 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest (35.1 s): Duration  27.07s (transform 26.48s, setup 0ms, import 67.38s, tests 37.55s, environment 2.62s)
ok      vitest checks (59.7 s): Duration  51.55s (transform 21.18s, setup 0ms, import 62.67s, tests 55.03s, environment 1ms)
ok      vitest slow (60.3 s): Duration  52.38s (transform 9.00s, setup 0ms, import 44.43s, tests 106.09s, environment 4ms)
test:quick: 62.7 s; every command passed
test:quick: not covered: tests that reach no changed file within the import depth,
(tests/checks/tree/size.test.ts was not chosen by the list; the size limits are checked with wc below)

# Verify 2
npx vitest run tests/state/boards/board/board-rules.test.ts tests/checks/config/config.test.ts tests/checks/config/config-folder.test.ts
 Test Files  3 passed (3)
      Tests  153 passed | 2 skipped (155)

# Verify 3
sh utils/unused-exports.sh > <scratch>/o70-unused.txt   (exit 0)
diff ../O70-base/unused-exports.txt <scratch>/o70-unused.txt
diff exit 0   (343 lines at the base, none added)

# Verify 4
grep -rn "CardStatus\|foldedLine\|career_next\b\|career_next:\|career_milestone\|career_funding\b\|career_funding:\|career_record_line\|class=\"venue\"\|Career strategy" src tests config docs --exclude=local.yml
tests/server/edit/writes.test.ts:339:    'title: Career strategy',
tests/server/edit/writes.test.ts:441:    const NO_SCHEMA = 'title: Career strategy\nmilestone: Veni 2026\n';
tests/state/forms/page-entry.test.ts:48:    title: 'Career strategy',
tests/state/forms/page-entry.test.ts:192:            title: 'Career strategy',
tests/fixtures/hubs/demo/.oculus/data/academic/career.yml:2:title: Career strategy
tests/data/sources/career.test.ts:19:const CAREER = `title: Career strategy
tests/data/sources/career.test.ts:72:        expect(held?.title).toBe('Career strategy');
tests/routes/edit/undo/undo.test.ts:698:        const second = await made(into, { kind: 'career', fields: { title: 'Career strategy' } });
tests/routes/edit/undo/undo.test.ts:700:        expect(career()).toContain('title: Career strategy');
tests/routes/edit/undo/undo.test.ts:705:        expect(career()).toContain('title: Career strategy');
docs/templates.md:1433:title: Career strategy
(the same 11 lines the report quotes)

# Verify 5
wc -l: ProjectCard.svelte 473, CardFacts.svelte 82, CardLinks.svelte 202, CareerPanel.svelte 389, LaneHead.svelte 85, Lanes.svelte 379, career.ts 183, focus.ts 599, presets.ts 424, card.ts 220, catalog-files/vocab.ts 368, model-collections.ts 257, normalise-parts/career.ts 87
(the report gives CareerPanel.svelte 387; base 355 + 158 - 124 from `git diff f5818542 --numstat` is 389; no decision rests on it, since both are under 520)
sh utils/folder-check.sh   -> prints nothing, exit 0

# Verify 6: the step adds or changes no test (git diff f5818542 --stat lists under tests/ only the demo fixture's career.yml)

# The rules file's checks
LC_ALL=C grep -n '[^ -~]' CardFacts.svelte .scratch/migration/agents/reviews/O70-report.md   -> nothing, exit 1
history-word grep over every added line and CardFacts.svelte: hits only "drawn before the lane's label" (vocab.yml head comment, options help), "before the day" (career.ts), "drawn before the words" (LaneHead.svelte), "before its controls" (CardFacts.svelte), and the example date 2026-11-17 in docs/HELP.md; each describes a place or a time of the thing, none is history.

# The report's case-run program, recreated from its quoted source in the reviewer's scratchpad, run as quoted:
npx vitest run --config <scratch>/cases/vitest.cases.config.mts --root . --reporter=verbose
case 1 lane run: icon="live" glyph=live
case 1 lane push: icon="draft" glyph=draft
case 1 lane revise: icon="edit" glyph=edit
case 1 lane review: icon="stale" glyph=stale
case 1 lane blocked: icon="overdue" glyph=overdue
case 1 lane backburner: icon="snooze" glyph=snooze
case 1 lane scope: icon="compass" glyph=compass
case 1 lane derisk: icon="flag" glyph=flag
case 1 lane build: icon="build" glyph=build
case 1 lane idea: icon="idea" glyph=idea
== case 2a: a row naming no icon
findings: none
lane review: icon="" glyph=focus
== case 2b: a row with icon: ""
findings: none
lane review: icon="" glyph=focus
== case 3: a row with icon: rocket
findings: none
lane review: icon="rocket" glyph=focus
== case 4: a row with icon: 3
finding: <hub>/.oculus/config.yml | focus_lanes.0.icon | focus_lanes.0.icon must be a text
lane review: icon="" glyph=focus
== case 4 reference: a stage with icon: 3
finding: <hub>/.oculus/config.yml | stages.submitted.icon | stages.submitted.icon must be a text
case 14 icon "": wordGlyph=tag
case 14 icon "rocket": wordGlyph=tag
case 14 icon "writing": wordGlyph=writing
case 14 icon "done": wordGlyph=done
case 7 kind "cluster": resourceGlyph=hpc computeGlyph=hpc
case 7 kind "machine": resourceGlyph=host computeGlyph=host
case 7 kind "storage": resourceGlyph=data computeGlyph=data
case 7 kind "gpu": resourceGlyph=undefined computeGlyph=hpc
case 7 kind "": resourceGlyph=undefined computeGlyph=hpc
case 8 on 2026-10-24: nextLine=FWO Senior on 2026-11-17, in 24 days
case 8 on 2026-11-16: nextLine=FWO Senior on 2026-11-17, in 1 day
case 8 on 2026-11-17: nextLine=FWO Senior on 2026-11-17, today
case 8 on 2026-11-18: nextLine=FWO Senior on 2026-11-17, 1 day ago
case 8 on 2026-11-20: nextLine=FWO Senior on 2026-11-17, 3 days ago
case 8 no milestone_date: nextLine=FWO Senior
case 8 bad date: nextLine=FWO Senior
case 10 Lead 2/0/3, Supervisor 0/1/0, funding 1: columns=["","in review","in flight","publications"]
case 10 Lead 2/0/3, Supervisor 0/1/0, funding 1: row ["Lead",2,0,3]
case 10 Lead 2/0/3, Supervisor 0/1/0, funding 1: row ["Supervisor",0,1,0]
case 10 Lead 2/0/3, Supervisor 0/1/0, funding 1: row ["Funding obtained",1,"",""]
case 10 same, funding 0: columns=["","in review","in flight","publications"]
case 10 same, funding 0: row ["Lead",2,0,3]
case 10 same, funding 0: row ["Supervisor",0,1,0]
case 10 no role row, funding 2: columns=["",""]
case 10 no role row, funding 2: row ["Funding obtained",2]
      Tests  6 passed (6)
(each line equals the report's "cases after the change". The reviewer left out the stage reference rows for "" and rocket and added one "bad date" row.)

# Case 13
grep -n "in_days\|days_ago" config/text/views/boards/focus.yml
9:        career_days_ago: '{0} days ago'
16:        career_in_days: 'in {0} days'
34:            days_ago: '{0}d ago'
57:            in_days: in {0}d
94:        days_ago: '{0}d ago'
102:        in_days: in {0}d

# Case 16
git diff f5818542 --stat -- src/lib/views/boards/projects src/lib/views/boards/focus/lanes/Lanes.svelte src/lib/ui/controls/Tag.svelte src/lib/ui/controls/Chip.svelte
 src/lib/views/boards/focus/lanes/Lanes.svelte | 2 +-   (line 226 only)
```

## Verdicts

Items of the brief's "What to build", in its numbering:

- 1: holds. Evidence:
  - `laneRow` gains `icon` with the dictated description (`vocab.ts:36-38`), and `Lane.icon` and `laneShape.icon` are added (`focus.ts`, the empty string when the row names none).
  - The option field `icon` has `control: glyph` and a help line in the stages' shape (`config/options/catalogs/vocab.yml`).
  - The ten rows carry the dictated icons. `build: hammer` and `build: "[B]"` sit right after `idea` in both glyph catalogs, and the `focus_lanes` head comment names the key.
  - The fallback to `focus` goes through `laneGlyph` (`card.ts`, `hasGlyph(icon) ? icon : LANE_GLYPH`).
  - The case run gives 1 to 4. List mode and the move menu are unchanged (case 16).
- 2: holds. `Lanes.svelte:226` passes `glyph={one.icon}` from the union rows, and `LaneHead.svelte` draws `<Glyph name={laneGlyph(glyph)} />`.
- 3: holds. Evidence:
  - `CardFacts.svelte` is new and `CardStatus.svelte` is deleted. Each fact is wrapped in `Tooltip` without `focusable`, in the brief's order, with the eight new `project.card.*_tip` keys.
  - The form is told apart by place (`items.ts:158` builds `[form, ...chips]`).
  - The form and chip glyphs go through `wordGlyph`, with fallback `tag`. The compute glyph goes through `computeGlyph`, with fallback `project.card.hpc_glyph` = `hpc`. Both are functions of `card.ts` that the case run calls.
  - `Tag.svelte` and `Chip.svelte` are unchanged (diff stat above).
  - `card.ts` is outside the write list, but item 3 names it as the home of the compute glyph function. The omission is the brief's, and the change does not count against the builder.
- 4: holds. `CardLinks.svelte` draws a `venue` kind after Related: one tag with `id: item.venue.id`, `label: item.venue.text` and `wrap: true`. The tag has no press, since `linkView('venue')` returns `''` (`card.ts:78-82`). The line is drawn only with a venue. The `.venue` style and markup are gone from `ProjectCard.svelte`, and `LinkedItem` gains `'venue'` (`presets.ts:101-104`).
- 5: holds. `career_heading: Career`. `FoldHead` gets `title` and `name` both `t('focus.career_heading')`, so the fold control is named "Fold Career" or "Unfold Career". `foldedLine`, `career_next` and `career_milestone` are gone (verify 4 has no hit for them).
- 6: holds. The `.sections` grid is `repeat(auto-fit, minmax(min(calc(240px * var(--text-scale, 1)), 100%), 1fr))`, in the order Goal, Next, Situation, Order of work, Track record. Each column is headed by `.lbl`, which has the same declarations as `CommandCenterView.svelte`'s `.lbl`, and carries the five `career_*_glyph` keys. Each section sits in its own `{#if}`, and the Edit control stays above the grid.
- 7: holds. `nextLine` (`career.ts`) gives "FWO Senior on 2026-11-17, in 24 days" and the full day words through the new `career_` keys, which are quoted where they begin with `{`. The line is drawn through `LinkedText`. `.milestone` is gone and `.when` is kept for the order rows. `focus.in_days` and `focus.days_ago` stay.
- 8: violated, Spec 1. The table is `Table.svelte`, not sortable, and `recordTable` gives the right columns and rows (case 10). The heading labels are not in the section look, though. The table scrolls sideways where the brief asks it to stay inside its column with wrapping cells.
- 9: violated, Standards 1. Every sentence the brief lists is rewritten. One more sentence that the step makes false, `docs/templates.md:1419`, is left as it was.

Cases of the brief's "Cases":

- 1: met. The run gives `lane review: icon="stale" glyph=stale`. Reading `CardFacts.svelte:50-54` gives the title `t('project.card.lane_tip', lane.label)`, and `LaneHead.svelte` draws the same glyph in the heading. The drawing is checked at the look.
- 2: met. The run gives `findings: none` and `glyph=focus` for both a missing icon and `icon: ""`.
- 3: met. The run gives `findings: none` and `icon="rocket" glyph=focus`, and nothing reaches `Glyph` unguarded (`laneGlyph` in both callers).
- 4: met. The finding reads `focus_lanes.0.icon must be a text`, the same wording as the stage reference.
- 5: met by reading `CardFacts.svelte`: the order, glyphs and titles as listed. The venue is out of the row, and one component draws both views (`Projects.svelte:69`, `Project.svelte:124`). The drawing is checked at the look.
- 6: met by reading `CardLinks.svelte`: no venue gives no tags and so no line, and a venue alone makes `tagged` true with the Venue line alone.
- 7: met. The run gives `kind "gpu": ... computeGlyph=hpc`.
- 8: met. The run gives each of the five day lines and the bare milestone.
- 9: met by reading `CareerPanel.svelte`: the `FoldHead` title is `t('focus.career_heading')`, "Career". The drawing is checked at the look.
- 10: met. The run gives the columns, the rows, the missing Funding obtained row and the one-column table as the case states.
- 11: met by reading. The grid rule is the one above. The builder's arithmetic, which the reviewer reproduced and which is not a measurement, gives five columns at 1400 px and stacking at 500 px. The look checks it.
- 12: met by reading. Each section is behind its own `{#if}`, and `auto-fit` collapses empty tracks. The Track record column also draws when `self` names the user, since it reads the snapshot and not the file. The report states this.
- 13: met. The grep above still lists `in_days: in {0}d` and `days_ago: '{0}d ago'` under `focus.`.
- 14: met. The run gives `wordGlyph=tag` for `""` and `rocket`, and `CardFacts.svelte:63` draws `wordGlyph(chipGlyphName(chip, hub))`.
- 15: met by reading. `<LinkedText text={next} />` draws the whole Next line.
- 16: met. `Projects.svelte` is unchanged, and only `Lanes.svelte:226` changes (diff stat above).

Points the builder raised, judged:

- Verify item 4's 11 lines: the brief's grep is too wide. Each hit is the career file's `title:` value, as test input, fixture data or template example data. None names the banner, and none is a sentence the step makes false. The sentence the step does make false sits two lines above the template example (Standards 1), and the grep does not reach it.
- `card.ts` outside the write list: item 3 names the file. The write list is the brief's omission, so this is no finding.
- `writes.dot` and `writes.svg` line numbers: `npm run diagrams` makes them again from the merged source at each landing, and the state file's `shared_paths` says so. No finding.
- `LaneHead`'s `glyph` made required: there are three callers. One is `Lanes.svelte:226` (`one.icon`, always a string after `laneShape`). Two are in `Band.svelte`: `:113` passes the `column` snippet's `glyph: string`, and `:133` passes `t('focus.funding_glyph')`. Every one of them passes a string, and svelte-check passes. Band's known glyph names go through `laneGlyph` unchanged. No finding.
- The nine judgment calls are each acceptable:
  - Literal glyph names in code follow the tree's own convention (`ProjectCard.svelte:166-197` writes `'copy'`, `'chat'`, `'folder'`, and `CommandCenterView.svelte:115` writes `glyph="hpc"`).
  - `repro_tip` repeats the words of `project.card.reproduced`, as the brief dictates.
  - Telling the form apart by place is correct against `items.ts:158`.
  - `nextLine`'s fallback for a day that does not parse is one ternary.
- Hover titles reach the pointer only: this is the brief's decision 10, and item 3 words it so ("its title is the pointer's hover"). It is not the builder's choice. Whether screen-reader users should get the kind words is a call for the user (Declined to judge).

## 1. Spec

- `src/lib/views/boards/focus/career/CareerPanel.svelte:343-346` with `src/lib/ui/display/table/Table.svelte:103-117`.
  - The quoted hunk: `.record { min-width: 0; overflow-x: auto; }`, and in `Table.svelte` the `th` has `background: var(--panel); ... color: var(--muted-txt, var(--muted)); white-space: nowrap;`.
  - What is wrong: item 8 asks for the table "with the board's own table text size (`--fs-xs`), the labels in the section look, and stays inside the column (a cell's words wrap)". Only the row labels (`.record .role`, accent capitals) approach the section look. The column headings ("in review", "in flight", "publications") are drawn in `Table.svelte`'s own header look: muted grey on a `--panel` strip that differs from the banner's `--chip` background, as the builder's own report says. Those headings keep `white-space: nowrap`, so the table does not stay inside its column. It scrolls sideways (`overflow-x: auto`), which replaces the wrapping the brief named.
  - Failure scenario (estimated, not measured): a pane of 1400 px gives each of the five columns about 263 px ((1380 - 4 x 16) / 5). Case 10's track record (in review, in flight, publications, at 11 px bold capitals with 0.04em spacing and 8 px padding a side) needs about 300 px of unwrappable heading width. So the Track record column draws a horizontal scrollbar with its last column cut off. Its headings read as a grey band of another colour under the accent section heading, where the user expects the board's section look.
  - Small to fix at landing: a scoped `.record :global(th)` rule giving the headings the section look's colour, a transparent background and `white-space: normal`, so the headings wrap.
  - Verdict: item 8 violated.

## 2. Proof

none

## 3. Standards

- `docs/templates.md:1419`.
  - The quoted hunk: `  - { field: title, type: text, help: "Banner title." }`.
  - What is wrong: a sentence the diff makes false (the rules file's "What every package obeys", the rule on grepping a changed name across `docs`, where a sentence the change makes false is a defect). After the step the banner draws "Career" and never the file's `title:`. The title is read only by the career editor's page (`src/lib/state/forms/page-entry.ts:200`, `title: career.title`). The line sits in the same template block whose paragraph at `:1415` the step rewrote. The brief's item 9 asks for "the sentences that ... say it draws the file's title" to be made true, and the verify 4 grep does not reach this one.
  - Failure scenario: a hub author copying the career template reads "Banner title.", sets `title:` to what they want on the Focus banner, and it never appears there.
  - Small to fix at landing (for example "The title of the career file's editor page.").
  - Verdict: item 9 violated.
- `src/lib/views/shared/card/project/CardFacts.svelte:10` and `:14`.
  - The quoted hunks: `    // Review", "Code: deposited"), which the pointer's rest shows. The wrappers take no tab stop, so` and `    // card.ts `laneGlyph`, `wordGlyph` and `computeGlyph`, which give a stand-in otherwise, so every`, each 101 columns (awk `length($0)>100`).
  - What is wrong: the rules file's "What every package obeys" says a comment is wrapped as a whole paragraph at 100 columns. Every other changed comment holds to it.
  - Failure scenario: an editor ruler at 100 shows these two lines over it, and the next rewrap of the paragraph moves words on unrelated lines.
  - Small to fix at landing by rewrapping the two paragraphs.
  - Verdict: none (it makes no item or case fail).

## 4. Behaviour

none. The report's "Host- or user-visible changes" gives the before and after for the project card in both views, the Focus lane headings, the folded and unfolded banner (the table's header strip included), and the Settings glyph field of `focus_lanes`. The reviewer found no visible change the report leaves out.

## Declined to judge

- How every changed view draws on screen: cases 1, 5, 6, 9, 11, 14, 15 and 16, the 1400 px and 500 px wrap points, and the table-width estimate in Spec 1. The reviewer runs no page. The look on TEST settles these.
- Whether a fact's kind should also reach a screen reader. Each fact `Tooltip` sits without `focusable`, so `describedControl` returns null and no `aria-describedby` is set. This follows the brief's decision 10 and is a call for the user.
- The render cost of about seven more `Tooltip` roots per card on a large project board was not measured. A profile of the Projects board with its full card set would settle it.
- The merge of the files O69 and O71 also write, and the `docs/diagrams/writes.*` conflict. That judgment and its regeneration belong to the orchestrator at landing (`shared_paths` in the dispatch entry).
- Whether the brief's verify item 4 should be narrowed for the next brief that greps "Career strategy". That is the orchestrator's text. The reviewer's judgment is that the 11 hits are data values and none of them is false.

Reviewer usage: a62a519088c12adcb, claude-opus-5-5, 272838 tokens, 65 tool uses, 12 min 40 s.

## Closed

No repair round was sent: each finding is small and inside the brief, and is fixed at landing.

- Spec 1 (item 8: the track record table's headings in `Table.svelte`'s header strip and kept on one line, so the table scrolls sideways): fixed at landing. `CareerPanel.svelte` gives `.record :global(th)` the section look's accent colour, a transparent ground and wrapping words; the look on TEST checks it.
- Standards 1 (item 9: `docs/templates.md:1419` "Banner title."): fixed at landing; the help reads "The title of the career file's editor page."
- Standards 2 (`CardFacts.svelte:10` and `:14` at 101 columns): fixed at landing, both paragraphs rewrapped whole at 100 columns.
