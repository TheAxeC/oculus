# O87 round 1: the review's findings

Rules: `agents/spec.md`, `agents/guarded.md` and the step's brief `agents/briefs/O87.md`, which stay in force except where this file says otherwise. The review is `agents/reviews/O87-refuter.md`. Each item below is a ruling: build it as written.

## What to build

1. **A wrong-kind row of a list replaced whole lets oculus's list stand (S6, P1).** G126 (`agents/guarded.md:189`) rules: a value of the wrong kind is a finding naming the file and the dotted key, and oculus's entry stands. In the merge of the lists replaced whole (`src/lib/data/sources/config/merge/in-place.ts`, every key of its whole-replaced set: `focus_lanes`, `roles`, `fund_stages`, `venue_categories`, `venue_tiers`, `radar_buckets` and the step's `position_stages` and `teaching_stages`), a hub list with a row of the wrong kind (a `color: 5`, a `statuses` that is not a list of texts) gives that finding and the merged value is oculus's list, as `rail_color` (`hub-vocab.test.ts:265`) and a map written as a list (`:323`) already behave. The row at `tests/data/sources/config/layers/hub-vocab.test.ts:234-236` asserts oculus's list, not the hub's row; its first run on the round's starting tree is quoted red.
2. **Two rows naming one key are a finding (S3).** G126 rules that two rows naming one key are findings naming the file and the dotted key, and oculus's entry stands. In the same merge, a hub list replaced whole whose rows name one key twice (the `key` of a row, or the `label` of a stage row, which has no key) gives a finding naming the file and the dotted key of the second row, and the merged value is oculus's list. Step O88 adds `pillar_kinds` to the same set and relies on this rule, so it is built once, in the merge, for every key of the set.
3. **The G126 rows (S5).** The `it.for` at `hub-vocab.test.ts:222-238` runs over every key of the whole-replaced set, one row per key, each with the wrong-kind input and the repeated-key input, since each key is wired into the set on its own; the report names each row and quotes its first run.
4. **Sentences the change makes false (T1, T2, T4, T6).**
   - `src/lib/views/boards/focus/Focus.svelte:18-19`: the head comment says what the command center and the tasks section hold now.
   - `config/defaults/sources.yml:31`, `config/options/sources.yml:109` and `:112`: the `ticker:` text says that the lines of the file flagged `tasks` are lines of the Tasks section, whose category gives them only their glyph.
   - `src/lib/data/shapes/catalog-files/vocab.ts:215-217`: the `deadline_met` description says what `config/catalogs/vocab.yml:102` says, the application in the Awaiting box included.
   - `docs/HELP.md:294`: a snoozed subtask, follow-up or task is drawn in the Command Center's Snoozed group, and the sentence says so.
5. **The report (S1, S4, P2, P3, T3, B1).** Append to the report:
   - what the heredoc probe of S1 computed and whether any result the step relied on came from it; a probe of this round is a case-run program quoted whole as `spec.md:65` says;
   - the `docs/templates.md` hunk at base line 279, with the item it serves, in place of "Every other hunk is inside its range";
   - the failing line of `tests/checks/config/config-folder.test.ts:232-233` on the unchanged tree, from a run against the base copy `.agents/worktrees/O87-base`;
   - the before/after table of every edited assertion of `hub-vocab.test.ts`, made from a `diff` of the file, one row per changed line;
   - the history-word grep of `spec.md:44`, the head-comment list of `spec.md:71` and the helper grep of `spec.md:88`, each quoted with its hits judged;
   - B1 under "Before and after": a snoozed entry of the tasks file dated beyond `deadline_horizon_days`, drawn nowhere before and in the Command Center's Snoozed group after.

## Cases (first run on the round's starting tree quoted before the result)

1. A hub `teaching_stages` row `{ label: Bad, color: 5, statuses: [planned] }`: the finding `teaching_stages.0.color must be a text` and the merged `teaching_stages` equal to oculus's. Red on the starting tree.
2. A hub `position_stages` with two rows labelled `Open`, the second naming `applied`: a finding naming `position_stages.1` and the file, and the merged `position_stages` equal to oculus's. Red on the starting tree.
3. A hub `venue_categories` with two rows of key `a`: a finding naming `venue_categories.1` and the file, and the merged list oculus's. Red on the starting tree.
4. Every case of the step's brief still met.

## Paths this round writes

The step's paths, and:
- `src/lib/views/boards/focus/Focus.svelte` lines 1-40
- `config/defaults/sources.yml` line 31
- `config/options/sources.yml` lines 105-115
- `src/lib/data/shapes/catalog-files/vocab.ts`
- the merge or validation file that reads the stage lists, named in the report

## Verify before you report

From the worktree's root, once after the last change:
1. `npm run diagrams && npm run test:quick`: every command passed.
2. `npx vitest run tests/data/sources/config/layers/hub-vocab.test.ts tests/checks/config/config-folder.test.ts tests/data/sources/config/layers/catalogs.test.ts`: passes.
3. The ASCII gate over every file this round changes and the report: nothing printed.

The plan's whole verify list runs once, at landing on main.

## Report

Append a section "Round 1" to `.scratch/migration/agents/reviews/O87-report.md` in the worktree's copy of the ledger: each item with DONE or NOT DONE and the evidence, the cases' first run, then the result table, the verification lines, and anything handed back with its reason.
