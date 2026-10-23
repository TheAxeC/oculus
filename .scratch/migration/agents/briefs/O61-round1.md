# O61, repair round 1

The rules file and `agents/briefs/O61.md` still hold. This round closes the findings of `agents/reviews/O61-refuter.md`, one ruling each below. A shortcut is a finding: a narrower reading of a ruling, or work inside it reported as outside it, is done or handed back with the reason before the report.

The rules file's "Where you work" holds in full: you run no git command, read-only ones included; the base copy `.agents/worktrees/migration-O61-base/` is where the unchanged tree is read and run. No script, probe file or program is written to check a case (open item 262 is not ruled); a case is checked by a test row the step has or by reading, and the report says which for every case.

## Rulings

1. **S1, the audit's head comments (item 7).** `src/lib/server/content/audit/projects.ts:3` and `src/lib/views/system/audit/Audit.svelte:20` no longer describe a status chip that the project's tier and type contradict; each says what the audit checks now, the stage word or form written as a chip (item 8) among it, in stage words. Grep `contradict`, `terminal_live`, `live_chips` and `tier and type` across `src`, `docs`, `config` (with `--exclude=local.yml`) and `tests`, and make every other false hit true.

2. **S2, comment lines over 100 columns.** Rewrap at 100 columns the added comment lines the review lists: `src/lib/data/shapes/catalog-files/vocab.ts:89`, `src/lib/data/sources/deck/groups.ts:54`, `src/lib/data/sources/deck/kinds.ts:40`, `src/lib/server/content/audit/rules.ts:36` and `:51`, `src/lib/state/boards/board/presets.ts:120` and `:186`, `src/lib/state/boards/board/stats.ts:121`, `src/lib/state/boards/focus-lanes.ts:89`, `src/lib/state/workbench/rail-badges/rail-badges.ts:94`, `src/lib/views/academic/present/parts/Project.svelte:21`, `src/lib/views/shared/card/project/CardStatus.svelte:3` and `:4`, `tests/checks/config/config-folder.test.ts:688`. Then check every file the step changes under `src` and `tests` for a comment line over 100 columns that the step wrote (compare with the base copy) and rewrap it too; the report gives the command and its output.

3. **S3, one name per export.** The new `statusWords` of `src/lib/state/shared/words/tones.ts` is renamed `projectStatusWords`, every caller with it, so it no longer shares its name with `statusWords` of `src/lib/state/workbench/navigation/status.ts`.

4. **S4.** `stageLabel` goes; `ProjectCard.svelte` calls `chipLabel` (or the label reader ruling 5 needs).

5. **B1, the stage glyph on a board card (item 6).** A board card draws the stage chip with the stage's label and its glyph, as LaneCard and the Projects list draw it through `projectStatusWords`, so a project shows on its board card the glyph it shows today (a `submitted` project its brown mark). The report gives the before and after of a board card for `stage: submitted` and for `stage: in-prep, form: journal` (C14).

6. **B2, the report only.** "Before and after" lists each stage word whose status-mark hue changes, with the base colour and the new one, as the review's B2 gives them. No code change: open item 264 is Axel's.

7. **P2, the report.** Every file the step changed outside "Paths this step writes" is named with why, and for each file under "any other file under `src/`", what it reads (a moved flag, or a word renamed only).

8. **At landing, no work here:** P3 (G32's title in `agents/guarded.md`). After this round's last change the verify list runs once, and the report says how many times it ran.

## Paths this round writes

Every path of `agents/briefs/O61.md`'s "Paths this step writes", every path the first report named outside it, and:

- `src/lib/views/system/audit/Audit.svelte`
- `src/lib/server/content/audit/projects.ts`
- any other file ruling 1's grep finds false
- the callers of `statusWords` from `tones.ts`
- `.scratch/migration/agents/reviews/O61-report.md` (a section "# Repair round 1" appended)

## Report

Append "# Repair round 1" to `.scratch/migration/agents/reviews/O61-report.md`: each ruling with DONE or NOT DONE, its diff and the check that shows it; each case with the test row or the reading that checks it; the verify lines.
