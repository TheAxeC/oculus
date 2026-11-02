# O115, repair round 1

Rules as the brief and `agents/spec.md`. Write list: the brief's, plus `tests/checks/source/html-sites.test.ts` and `docs/diagrams/layers.{dot,svg}`, `layer-views.{dot,svg}` as they stand. Each ruling below says what to change. Findings not listed are closed as they are.

1. B1, the zoom after a fetched theme. Replace the one-frame retake in `TranscriptBody.svelte`: a `MutationObserver` on `document.body`'s `class` and `style` attributes, set up in the effect and disconnected in its cleanup, retakes `zoom`. A theme drawn from a fetch then lands however late it is. The effect still retakes `zoom` when the font setting or text scale changes.
2. B2, the person's bar. `border-left: 3px solid var(--accent-txt, var(--accent))`, as `Markdown.svelte:391` draws its bar, since that token is held at 4.5:1.
3. B3, a choice when a first read's window moves. `chosen` is keyed by a `runKey(row)` in `turn-rows.ts`: the index of the run's first turn and that call's stamp, so a moved window misses the old choices. The each key stays `row.first`. Correct the head comment of `turn-rows.ts`.
4. B4, the foot after a press or a zoom. After a press on a run, once drawn (`tick()`), re-read `stuck`, so a reader who opened the last run is not carried past it by the next append. After a zoom change, once drawn, a reader who was at the foot is put back at it.
5. B5, outcome placement. One wrapper holds both tags, `margin-left: auto` on it and `flex: none`, so a failed and a running call stand together. `.calls` takes `max-width: 80ch`, so a tag stands near its name on a wide pane.
6. T2. The clearing effect reads `session` and `agent` and calls `chosen.clear()`; `chosenFor` goes. The first run on mount clears an empty map.
7. T3 and B6. The report gains: what the code does for `runKey` and the observer on each path, and the before and after of these visible changes: the steer box narrower by 8px, a Codex export line with no exit code reading ok, no browser menu on an answer, a `#fragment` link going through `jump.ts`.

Verify: `npx vitest run tests/server/sessions/transcripts.test.ts`, then `npm run test:quick` once after the last change. Add a "Repair round 1" section to the report at `.scratch/migration/agents/reviews/O115-report.md` in the worktree.
