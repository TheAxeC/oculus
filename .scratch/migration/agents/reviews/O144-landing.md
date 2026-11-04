# O144 landing

Plan: migration (cockpit to oculus), step 363 of 366, O144, a `period` type for when an entry happens. Next: O141, the Focus lane colours measured in every theme, which waits on open item 672.

## Open items

- 672 (2026-11-04, O141's builder hand-back, ruling 667, `agents/reviews/O141-report.md`): no lane colour in `vocab.yml` can bring every Focus pair that touches to a CIEDE2000 of 10 in every theme, because some theme blocks give two lane hues one value (dracula's `--c-blue`, `--c-slate` and `--c-grey` are all `#6272a4`). (a) O141 widened to the theme sheets, the aliased or close hues given values of their own, with bar 2 kept and each changed hue measured against the status tokens; (b) bar 1 alone, dropping bar 2, which puts collapsed pairs at 0.0; (c) only the comments rewritten to the measured state, the lazy option. Recommended: (a).
- 673 (2026-11-04, O144's landing): the research hub's side of O144 is on disk and not committed, since a hub commit is made only on Axel's word: 25 files, the six academic files, 16 `project.yml` manifests, `.oculus/tasks/scout.md`, and `.oculus/data/literature/literature.yml` and `radar.yml` (`agents/reviews/O144-hub-rewrite.patch`). Oculus on main already reads `when`, so the hub's history holds a shape the code no longer reads until the commit; the working tree is right. `applications.yml` also holds Axel's own uncommitted `note` change on `maastricht-clinical-epidemiology`. (a) One hub commit of the 25 files, "Store every period of the hub once in when", with Axel's `note` hunk left unstaged; (b) the same commit with that hunk included; (c) left uncommitted for Axel, the lazy option. Recommended: (a).

## The check of Steps 1

The builder abe622183bd8e8a7b, the brief-check agent aa81eb9066685f0b8 and both reviewers (ac632786ca06c2f07, a1f249a028eeefda3) had finished before the landing; none is running.

## Not done

Nothing inside the brief. The hub's side waits on open item 673 for its commit.

## What landed

From base 069decb7c, the whole range (the first run and repair round 1, in the wip commit b91d6d409): 74 paths, 957 insertions and 415 deletions with the fixes at landing.
- The field type `period` (EDTF level 0 and level 1's open end): `readPeriod`, `periodValueOrder`, `periodYear` and `PERIOD_FORM` in `src/lib/data/helpers/dates.ts`, with the table test G151.
- The schema check's `x-period` keyword gives `findings.schema.not_a_period`. A write is refused with `server.entries.type_period`, and the manifest editor's `coerce` refuses the same values.
- The editor draws a `period` field as one line of text with the hint "2025, 2025-09, 2026-10-27 or 2025-09/2026-09", marked while the typed text is no period.
- The Events, Education, Funding and Applications views sort newest first by `when` within each status (`src/lib/state/boards/collection/card-order.ts`).
- The templates and the demo hub use `when` and no `date` or `duration`. The manifest schema has `cv.when`, and `year` is a period. The Literature and radar `year` fields are periods.
- Leads' `deadline` is a `date`, with a `rolling` checkbox and a `note`. A lead card's line reads, for example, "2026-12-15 | Rolling".
- The portfolio payload names a funding scheme's period `when`.

Fixes at landing:
- T6: `docs/HELP.md:351`, the award period on the website's CV and on an employer CV.
- T7: `docs/HELP.md:277` reads "a day written year-month-day"; `docs/data-map.md:255` names `+HH:MM` and `-HH:MM`.
- T8: `docs/apps.md:402`, `yearWritten` as "a period or any other text".
- T9: `writtenPeriod` renamed `writtenYear` in `src/lib/data/snapshot/normalise.ts`, at its definition and its one call.
- Oculus's own `.oculus/project.yml`: `cv.duration: '2026 - Current'` became `when: '2026/..'`, and line 16 was requoted for prettier.
- From the look: `src/lib/ui/theme/field.css` now borders a field with `aria-invalid='true'` in `--c-red`, the rice theme's line included. Until now `TextInput.svelte` set `aria-invalid` and a title but no stylesheet drew a mark, so a refused value looked like any other. This applies to every refused text box: the period field, the record-name and row-label fields of the entry editor, and the clone, app and worktree name boxes.
- P5 and T10 are report text and were left as they are. P5's clause is true by reading the base (`normalise.ts:530`), and T10's last run came after the round's last change.

The research hub's side is on disk and not committed (open item 673):
- The six academic files and 16 manifests were spliced line by line from the builder's rewrite: 511 values changed, comments and layout kept, and each file read back equal to the rewrite.
- `.oculus/tasks/scout.md`: `deadline` is a date, with `rolling` and `note`.
- The `year` lines of `literature.yml` and `radar.yml` are `type: period`, with the demo hub's help text. Item 10 named both files and the rewrite had left them out. The radar's 678 years are integers from 2022 to 2026.
- The live check, `npx tsx <scratch>/o144-land/check/cases.mts C18` run from main against the hub, finds 1 finding before and after (the copy's deck folder, which comes from making the copy) and 0 naming when, deadline, rolling or note.

## Verification

In the gate `.agents/worktrees/gate` at main's head with the range and the fixes, `npm run diagrams && npm run docs:palette && npm run test:quick`: before the field.css fix every command passed ("test:quick: 238.5 s; every command passed", `../gate-O144.log`); after it, prettier, ASCII gate, svelte-kit sync, eslint, svelte-check (581 files, 0 errors, 0 warnings), vitest checks and vitest ok, and vitest slow failed on one timeout, `tests/server/machine/apps/tools/languages.test.ts` "several servers of one language" ("Test timed out in 40000ms"), a file the step does not reach, run at a load average near 10; rerun alone it passed (`Test Files  1 passed (1)`, `Tests  15 passed (15)`) (`.agents/worktrees/gate-O144-r2.log`). The staged diffs of main and the gate are equal under `cmp`. The verify list equals the page's commands. No A/B: the configuration names no bench.

## The look

On 8797, from the gate, with the rewritten academic files in the scratch hub, restored afterwards (each file `cmp`-equal to its backup):
- Funding: within each status newest first. Planned shows 2027, then 2026. Contributing shows 2026/.., then 2024/2026-01, then 2023/2025. Rejected shows 2025/.., then 2024, then 2022.
- Talks & Events: completed starts with 2026-10-27/2026-10-30 and 2026-10-27T11:00:00, then the years from 2026 down to 2016.
- Education & Service: completed shows 2026, then 2025-09/2026-09, 2025-09/2025-12, 2025/2026 and on down to 2013-09/2016-07.
- Applications: within each status newest first.
- The editor's `when` field on a funding scheme shows the hint "When it happens: a year, a month, a day or a span, such as 2025-09/2026-09 or 2025/..". The value `2026-13` sets `aria-invalid` with the title "not a period such as ...". Before the field.css fix nothing was drawn; after it the field has a red border. The edit was reverted unsaved ("nothing changed").
- Position Leads: a declined lead's line reads "2026-12-15 | Rolling | declined".
- Literature: with three temporary entries (2024, 2025, 2025), the bar offers the year filter, listing 2025 (2) and then 2024 (1). The entries were removed afterwards.
- Focus: none of the four dated events draws a radar line. Three of their days are past, and the Linkoping visit is the month 2027-03, which has no day.

## Usage

- Builder abe622183bd8e8a7b (claude-opus-5-5): first run 250351 tokens, 635 tool uses, 80 min 24 s; round 1 336484 tokens, 95 tool uses, 14 min 43 s.
- Brief check aa81eb9066685f0b8 (claude-opus-5-5): 248970 tokens, 104 tool uses, 14 min 45 s.
- Reviewer ac632786ca06c2f07 (claude-opus-5-5): 362152 tokens, 96 tool uses, 19 min 5 s.
- Reviewer over round 1 a1f249a028eeefda3 (claude-opus-5-5): 218028 tokens, 76 tool uses, 16 min 3 s.

The first report did not pass its bar: item 6 was violated (B2), and 13 findings went to repair round 1, all closed there.

## Next

O141 waits on open item 672. The hub's side of O144 waits on open item 673.
