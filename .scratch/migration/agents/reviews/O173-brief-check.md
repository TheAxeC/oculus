# Brief check of step O173 (main at 3d5b3da7d)

Six defects to settle before dispatch; each is detailed under its check:

- **D1:** the comments of `blockHolds` and the head of `words.ts` become false, and that file is outside the write list.
- **D2:** C8 needs runs of `test:quick` that the rules file forbids.
- **D3:** a `flags` block on `tiers` is held by the audit and refused by the config check.
- **D4:** C5's place contradicts item 7.
- **D5:** brief line 98 names a filter the rules file does not hold.
- **D6:** no case shows the hub's own row passing the config check.

`plan.md` has no `## Goal` section: `grep -c '^## Goal' .scratch/migration/plan.md` prints `0`. The goal used is the one in the task.

## Names

Command: `git grep -n <name> -- ':!.scratch' ':!config/local.yml'`, with `-w` for `RequiredFile` and `-E 'tests/checks/(source|tree|imports)'` for the folders.

**`required_files`, hits outside the write list:**

| Hit | False after the change? |
|---|---|
| `config/defaults/behavior.yml:28,30` | no, names parts of `audit:`, not a row's keys |
| `docs/data-map.md:117` | no, names no field |
| `src/lib/data/helpers/hub-names.ts:763` | no, key |
| `src/lib/data/shapes/hub-keys.ts:46` | no, key |
| `src/lib/data/model/index.ts:355` | no |
| `src/lib/server/root/watch/portfolio/audited.ts:9` (and `:41`, the row reader) | no, a `tiers` block adds no watched path |
| `src/lib/views/system/findings/AuditSection.svelte:6` | no |
| `tests/server/edit/config-value.test.ts:422` | no, row `{ file: README.md }` |

**`RequiredFile`:** `setting.ts:25,35,140` only. All in the write list.

**`FILE_FIELDS`, outside:** `src/lib/data/file-ops.ts:356,375` and `src/lib/server/edit/writes/file-undo.ts:39,88`. A different constant of the same name, not affected.

**`AuditRules`, outside:** `src/lib/server/content/audit/scan.ts:76` and `website/papers.ts:12,20` (a `Pick` of other keys). Not false. No test or other source builds the type as a literal: the only constructor is `auditRules` at `rules.ts:144`, so a required `tiers` field breaks nothing.

**`SCANNERS`:** `tests/tiers/quick.mjs:46,47,49,195,201` only. `SCANNED` at `tests/server/root/watch/glob-drop.test.ts:165` is another constant.

**Scanner folder sentences:** the only hits listing the folders as the chooser's set are `quick.mjs:11,32,47,307`. Every other hit names one file, for example `tests/checks/tree/boundaries.test.ts:3`, and stays true. Run-time comment at `quick.mjs:201`: true of all three, see Premises.

**Terms the name greps miss, found by `git grep -n -E 'word block|blockHolds'`:**

- **D1, false after the change, outside the write list, not reached by Verify 3's grep.** `src/lib/data/shapes/boards/words.ts:77-78`: "`vocabulary` being that map of the merged config (`stages`, `chips` or `forms`)". `tiers` becomes a fourth map. `words.ts:2-3` says the same: "held against a project's words of one vocabulary map (its stage, its chips or its form)". Rules file line 72 makes a false head comment a defect of the change. The file needs adding to "Paths this step writes" and to item 5.
- `src/lib/data/shapes/catalog-files/vocab.ts:299-300`: "A category's `stages:` and `forms:` are one, and so is the `stages` of a row". Still literally true, but incomplete.
- **Outside the scope, excluded by `.scratch/` in the grep:** `.scratch/migration/agents/guarded.md:189` (G125) reads "(the stage, the folder in the project, the hub folders)". That list goes short by the tier. The file is the orchestrator's; the brief does not say who changes it.

## The step line

Command: `grep -n '^- O173' .scratch/migration/plan.md` (line 1711).

| Part of the line | Requirement |
|---|---|
| "the audit asks every research project for a deck" (title) | no requirement. The line's last sentence and brief line 33 place the hub's row outside this step |
| "alongside O151's repair round 2" | no build requirement; premise at brief line 21 |
| row takes a `tiers` block, shape of `stages` | item 1 |
| held against the tier as `stages` against the stage; can name or leave out | item 2, C1 to C4 |
| `setting.ts`, `projects.ts` | items 1, 2, 5 |
| `rules.ts` carries `tiers:` | item 2 |
| the field and its help in `behavior.yml` | item 3 |
| the rows' description in `docs/templates.md` | item 4 |
| a test of the row in `audit.test.ts` | item 7 |
| `docs/data-map.md:117` stays true | premise at brief line 17, not in the write list |
| `tests/checks/imports/` joins `SCANNERS` at `:47` | item 6 |
| the three sentences at `:11`, `:32`, `:307` | item 6, written as `:10-12`, `:32-33`, `:306-308` |
| "built by a builder agent" | "Size: a full step"; no item |
| hub's own row outside this diff, after O151 | brief line 33 |

No part is left without a requirement other than the title and the "alongside" and builder clauses.

## Premises

Commands: `cat -n` / `sed -n` of each file, `grep -n` as named, `wc -l`.

| Brief's fact | Result |
|---|---|
| `setting.ts` 167 lines, `RequiredFile` :25, `FILE_FIELDS` :110, unknown field a problem and row off | holds (`:90-97`) |
| `projects.ts` 592 lines, `stageMeets` :263, `requiredFiles` :272, comment :267-271 | holds |
| `rules.ts` `stages` :52, set :163, no `tiers` field | holds (`grep -n -E 'stages|tiers|skip_tiers|skipTiers'` shows only `skipTiers`) |
| plan's path list names `rules.ts` | holds (line 1711) |
| `blockHolds` `words.ts:80`, `wordList` :97, `wordBlock` `vocab.ts:302` strict | holds |
| `tiers:` `vocab.yml:249` three words, `research_audit` :256 | holds |
| `behavior.yml:24-44`, `help` :27, field `stages` :33-35 | **slightly off**: the field heading is :32 (help :33, control :34, from :35), and the row ends at :41 |
| `from: tiers` a source; `FLAG_SOURCES` no `tiers` | holds (`catalog-words.ts:79,105-108`, `options.ts:771`, `options/catalogs/vocab.yml:306`) |
| "so the form offers no flags" | holds but is **incomplete**, see D3 |
| `docs/templates.md:291-295` and :305 | **slightly off**: the row description is :291-294 (:295 starts `required_sections`), and :305 is the key, the example rows at :306-307 |
| `docs/data-map.md:117` | holds |
| `audit.test.ts` 699 lines, :121, `projectAt` :42, helpers | holds |
| `SCANNERS` :47; sentences :10-12, :32-33, :306-308; `imports/` three tests | holds; the folder also holds `augments.ts`, `graph.ts`, `order.ts`, which `TEST_FILE` at `:53` leaves out |
| imports checks read the imports of the whole tree | holds for `src` (`graph.ts:103` reads source with `readFileSync`), so "read the text of the tree" stays true of all three |
| no ADR folder | holds (`ls docs/adr`: "No such file or directory") |
| O151's paths, disjoint | holds. `git -C .agents/worktrees/migration-O151 status --short` shows `slide.css`, `Slide.svelte`, `Facts.svelte`, `Project.svelte` and no path of this brief; `Project.svelte` is in no O151 brief (`grep -n 'parts/project/Project.svelte' .scratch/migration/agents/briefs/O151*.md` prints nothing) but is in the worktree |

**D5.** Brief line 98 says "each output piped through the filter the rules file names". `grep -n -i 'filter' .scratch/migration/agents/spec.md` prints nothing, so the sentence names something that does not exist.

## Cases and checks

**Against the rules file:**

- **C1 to C6 have an entry.** G125's Test line names "every row of the describes 'the required files of the audit' ... and 'the shape of the audit setting'" (`guarded.md:191`), so no new entry is needed (rule line 60).
- **D2, C8 breaks rule line 26.** C8 asks for a run on the unchanged tree and a `docs/`-only run. The list runs once after the last change, and "a run of the list beyond what this paragraph allows, is a finding of the review". The chooser cannot be run alone: `chooseTests` is not exported and `quick.mjs` runs everything when it loads. Together with the post-change run that is at least three runs. Line 66's case-run program cannot reach it without copying the logic. Workable form: the unchanged-tree and `docs/` halves checked by reading `quick.mjs:47,195,212`, and the src half by the list Verify 1 prints at `:261`.
- **D4, C5 against item 7.** Item 7 puts C5 in `describe('the required files of the audit'`. The shape helper `shapeKeys` that C5's "shape the tests at `:627-636` read" uses is declared inside `describe('the shape of the audit setting'`, out of that describe's scope. Either C5 moves to the shape describe, which G125 also covers, or item 7 changes.
- **C2 and C6 against rule line 60** ("one row per input that gives a different outcome"). C2 gives C1's outcome (research finding, software none). C6 gives the outcome of the existing row at `:226` (personal, no finding). A row of C6 does distinguish a row naming the skipped tier, so see "Declined to judge".
- **C3** is consistent: `grep -n exactOptional tsconfig.json` prints nothing and other tests use `tier: undefined`.
- **C9** is consistent with rules lines 61 and 65.

**Cases that check, quote or explain a place the step does not change:**

- C5 reads the existing tests at `:627-636`.
- C7 quotes a run of the existing tests. Its range `:121-215` stops short of the describe's end at `:233`; `:226` is a row with no `tiers`. Verify 2 runs the whole file.
- C8's "on the unchanged tree it does not" checks existing behaviour.

## The question

Could this pass without the goal being reached?

- **The step line:** it has no separate check; "a test of the row" is item 7.
- **C1:** no, it fails on the unchanged tree because the row is off.
- **C2:** no, same reason.
- **C3:** no, its `not_words` half needs a working block; its `words` half passes on the unchanged tree.
- **C4:** no, needs a finding only on the project meeting both.
- **C5:** yes. On the unchanged tree `tiers` is already the problem `audit.required_files.0.tiers`. It guards the shape once the goal is reached.
- **C6:** yes. It passes on the unchanged tree with the row off; it guards `isPersonal` over a named tier.
- **C7:** yes, a regression run only.
- **C8:** no for a change under `src`, since it needs `imports/` in `SCANNERS`. For `tests/` and `utils/` it proves nothing; the `SCANNED` gate at `:212` is unchanged and read.
- **C9:** yes. A control shown says nothing of a row being held; it checks item 3 only.
- **Item 1** (C1, C5): no.
- **Item 2** (C1 to C4, C6): no.
- **Item 3** (C9 and reading): yes, a surface of the goal.
- **Item 4** (Verify 5 reading): yes, documentation only.
- **Item 5** (Verify 3 and reading): yes. Its grep does not reach `words.ts` (D1).
- **Item 6** (C8): no for the list; the sentences are checked by reading only.
- **Item 7** (Verify 2, 4): no.

## Implied inputs

Missing from "Cases", with a cost:

- **D3, `tiers: { flags: [default] }`.** `flagsOf(config.tiers)` gives `unmarked` and `default`. `setting.ts` accepts the block (`wordBlock`) and the audit holds it: `flagWords` gives `research`. The config check refuses it:
  - `src/lib/data/sources/config/catalog/schemas/options.ts:174` sets `maxItems: 0` ("A block drawn from a list whose words carry no flags takes none").
  - `value-rule.ts:203-206` gives `{ kind: 'flag' }`, through `config-fit.ts:220,387`.

  Decision 1 mentions only the form. Expected result: not stated by the brief. It needs either the audit to refuse flags on `tiers` too (the problem `audit.required_files.<n>.tiers`), or a `FLAG_SOURCES` entry so that both accept them. This is a user-visible shape for the orchestrator.
- **D6, the hub's own row through the config check.** `{ file: present/present.yml, tiers: { words: [research] } }` in a hub's `.oculus/config.yml` gives no finding of the config channel and no refusal on a Settings write. `findingsOf` in `audit.test.ts` does not go through that check, and the row is the next action of ruling 733. Expected: no finding, no refusal.
- **A `tests/` or `utils/` path for C8.** Expected: the three import checks chosen. Low cost, read from `:212`.

Implied and not needing a case, each by the code path shared with `stages`:

- `tiers: {}` (holds for all).
- `tiers: { words: [] }` (holds for none).
- A word not in the vocabulary (held by word; the value rule at `value-rule.ts:200` names it).
- A tier of `''` (`wordList` gives `[]`, as C3).
- A workspace repository project.
- A secondary hub's merged `tiers`.

## ADRs

`docs/adr` does not exist (`ls docs/adr`: "No such file or directory"). No record is touched.

## Dictated text

| Text | `grep -n` line in the brief | Result |
|---|---|---|
| `tiers: wordBlock`, `tiers?: WordBlock` | 25 | holds |
| `blockHolds(block, wordList(project.tier), input.rules.tiers)` | 26 | holds; 95 columns in a `return` of the shape of `:264` (`awk` length) |
| `control: words`, `from: tiers` | 27 | holds |
| "Everything in the brief is done" | 110 | holds; rules line 84 gives it |
| fixture rows of C1 to C6, for the test file | 37 to 42 | holds (ASCII, no history) |

The brief gives no sentence of help, comment or documentation word for word. `LC_ALL=C grep -n '[^ -~]' .scratch/migration/agents/briefs/O173.md` prints nothing.

## Declined to judge

- Which way D3 should go: it is a user-visible shape for the orchestrator.
- Whether C2 and C6 stay as rows or become checks by a run.
- What the three import checks add to a `test:quick` run in time: not measured, and not run here because I change nothing.

Usage: a3b6a980fe45e6b36, claude-opus-5-5, 176663 tokens, 18 tool uses, 6.1 min

# Closed (the session's change to the brief for every finding above, made before the preparation commit)

- D1: `src/lib/data/shapes/boards/words.ts` joins "Paths this step writes"; item 5 names its head comment and the comment of `blockHolds`.
- D2: C8 is checked by reading `quick.mjs:47,195,212` for the unchanged tree and for a change under `docs/` alone, and by the test list Verify 1 prints for a change under `src`.
- D3: the rule of `schemas/options.ts:174`, that a block drawn from a list whose words carry no flags takes none, holds in the audit too: item 1 reads `tiers` as `words` and `not_words` only, flags being the problem `audit.required_files.<n>.tiers`. New case C10. Decision 1 rewritten. No flag is added to tiers.
- D4: C5 stands in `describe('the shape of the audit setting'`; item 7 says so.
- D5: the sentence on a filter is removed from the brief's "Verify".
- D6: new case C11, a row of `LAB_ROWS` in `tests/server/edit/config-value.test.ts`, which joins the paths.
- Premises: `behavior.yml` field `stages` at :32-35, the row ends at :41; `docs/templates.md` row description at :291-294, example rows at :306-307; both corrected.
- C2 merged into C3, whose `not_words` row now holds a research, a software and a no-tier project (rule line 60). C6 stays: a row naming the skipped tier is a different input. C7's range corrected to the describe's end at :233.
- `agents/guarded.md:189` (G125) is the orchestrator's: the report gives its replacement under "Doc text".
