# O174 repair round 1

Rules: `.scratch/migration/agents/spec.md`, as for the step. The brief `agents/briefs/O174.md` stays in force. The review is `.scratch/migration/agents/reviews/O174-refuter.md`, also in the worktree's ledger at the same path. Its one finding is ruled below.

## 1. Two comments say more than the code does (Standards 1, item 6)

The head comment of `src/lib/views/shared/card/text/Clamp.svelte` at :11-13 and the `.text.cut` comment at :166-167 say nothing is sliced above the control. The code answers the clamp's height when no box fits whole (`clampCutHeight` in `card-layout.ts`), so a text that opens with a block taller than the cut is still cut at four lines. Each of the two comments says so, in the terms of `clampCutHeight`'s own comment: nothing is sliced except where the first box itself is taller than the cut, which keeps the cut at four lines. The code does not change.

## Verify before you report

The brief's "Verify before you report" items 1 and 5, once after the last change, with `TMPDIR` unset. The report appends a section "Repair round 1": what changed, and the verify lines.
