# O173 repair round 1

Rules: `.scratch/migration/agents/spec.md`, as for the step. The brief `agents/briefs/O173.md` stays in force. The review is `.scratch/migration/agents/reviews/O173-refuter.md`, also in the worktree's ledger at the same path. Every finding of the review is ruled below. This round adds one path to the step's list: `tests/data/sources/config/layers/layers-fixture.ts`.

## 1. A comment false of the tree (Standards 1)

The comment above `tiersBlock` at `src/lib/server/content/audit/setting.ts:119-120` says a tier carries no flags. `config/catalogs/vocab.yml:250` holds `research: { label: Research, unmarked: true, default: true }`, so a tier row has flag fields. The comment says the true reason: the list `FLAG_SOURCES` names no flag source for `tiers`, so the form offers no flags for a `tiers` block and the config check refuses them (`schemas/options.ts:173`), and a block naming flags is therefore not of this shape. The code does not change.

## 2. The findings helper written twice (Standards 2)

`findingsNaming` in `tests/server/edit/config-value.test.ts:376-384` repeats the body of `readerFindings` in `tests/data/sources/config/layers/layers-fixture.ts:46-52`, whose head comment says there is one copy. `readerFindings` takes the engine folder as an optional third argument, `engineDir()` when it is left out, and accepts what both `loadConfig` and `loadLayers` return, typed by the two fields it reads. `findingsNaming` calls it for the reader findings. Every existing caller is unchanged and its result is the same.

The report quotes the grep of `src` and `tests` for each new helper's name and key call that `spec.md` asks for: `tierMeets`, `tiersBlock`, `TierRow`, `findingsNaming`.

## 3. What the new key does when empty, duplicated or colliding (Standards 3)

The report states, under `spec.md`'s rule on a new key, what the code does in each of these, each with the run or the reading that shows it: `tiers: {}`, `tiers: { words: [] }` (the row then holds for no project, as `stages: { words: [] }` does), `tiers: null`, a tier word no vocabulary row holds, and the key `tiers` named twice in one row. The case for the key named twice is run through the setting's reader by a case-run program in `.agents/scratch/`, removed before the report. No code changes for this item.

## Verify before you report

The brief's "Verify before you report" list, once after the last change, with `TMPDIR` unset and the path list widened by the fixture. The report appends a section "Repair round 1": per item what changed, and the verify lines.
