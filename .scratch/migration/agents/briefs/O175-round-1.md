# O175 repair round 1

Rules: `.scratch/migration/agents/spec.md`, as for the step. The brief `agents/briefs/O175.md` stays in force. The review is `.scratch/migration/agents/reviews/O175-refuter.md`, also in the worktree's ledger at the same path. Its findings are ruled below.

## 1. A tile waiting on a later layout writes a measure (Behaviour 1, item 6)

`src/lib/views/academic/present/screen/Framed.svelte:54-57` holds a measure only until the first layout of a `drawing`. After a text size, theme, font or image change, a laid-out tile whose new layout is waiting in the queue writes its measure at once, so it can show a false Too tall mark and Findings row until its turn.

Change: a slide drawn with `turns` holds its measure from the moment any layout is asked until that layout has run, and then reports the latest measure. So a tile with a layout waiting writes nothing, whichever trigger asked for it, its earlier mark and Findings row stay as they were until the layout has run, and a tile destroyed while waiting writes nothing. How `Slide.svelte` tells `Framed.svelte` that a layout has been asked is yours; a slide with no `turns` reports exactly as it does now.

## 2. A sentence in the head comment of `Framed.svelte` (Standards 1, item 11)

`:20-21` says that a tile waiting its turn writes no measure. Finding 1 makes the sentence true; check that the head comments of `Framed.svelte` and `Slide.svelte` then say what the code does.

## Left as built

Spec 1, a waiting job asked again keeps its place: no change.

## Verify before you report

The brief's "Verify before you report" items 1 to 4, once after the last change, with `TMPDIR` unset. The report appends a section "Repair round 1": what changed, and the verify lines.
