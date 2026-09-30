# D13c landing

Position: oculus/migration (the migration plan), D13c the code theme key and its control, landed 2026-09-30; next: Q84's review, then Q102's when its builder reports, then Q88b once both have landed.

## Open items

- Z71, the rules file's sentence on steps in flight contradicts Z34 and the skill (raised 2026-09-30 by Q88b's brief check). `agents/spec.md:83` says several packages run at once only when "their briefs name disjoint paths and different views" and "a brief that lists a path another in-flight brief lists is not dispatched". Z34 (a) (ruled 2026-09-28) says a shared file is judged "by how simply they merge", the `plan-orchestration` skill's "Two steps in flight" says the same, and the loop has run on that reading since (`shared_paths:` in the dispatch entries of D13b, Q83, Q86c, Q103 and now Q102, `git log --oneline -S"shared_paths:" -- orchestrator-state.md`). Options: (a) `spec.md:83` rewritten to the skill's rule: steps run at once when merging their shared files at landing is simple, the orchestrator's judgment written in the later step's `shared_paths:`, a step waiting otherwise; (b) keep `spec.md:83` as written, so the loop runs only steps with disjoint paths and different views (D13c and Q102 share `config/text/ui.yml`, `ui.svelte.ts`, `DESIGN.md` and `HELP.md` and would not have run together). Recommended (a): it is what Z34 ruled and what the loop does, and under (b) about one step in three runs at a time. Keeping the stale sentence is the lazy option. Until Axel rules, the loop keeps the reading Z34 ruled.

## The check of Steps 1

`ListAgents` before the landing listed no D13c builder and D13c's reviewer over round 1 as completed; only Q102's and Q84's builders were running.

## NOT DONE

- The repaint in place of an open source tab, diff and merge editor after a pick, without a reload, was not seen: `repaint` runs on `requestAnimationFrame`, which the hidden Chrome tab never runs. Booked in the state file's Booked section as a look owed with the tab in front.

## What landed

The code theme key and its control (the booking in `plan.md` under D13c has the whole list): `config/appearance.yml` gains `code_theme: tokens`; `data/helpers/code-themes.ts` lists `tokens` and Shiki's 65 bundled themes; `themeFindings` reports a bad value; the ui store keeps the viewer's pick as `codeTheme`, null until picked; the Settings view has a Code theme menu; the painter loads a picked theme once and paints its scoped rules over the tokens' chrome; `paintCode` catches a failed load.

Verification on main from `tools/oculus` after `npm run diagrams` (no change): `npm test` 339 files passed, 19 skipped, 5149 tests passed, 557 skipped; `npm run test:checks` 27 files, 365 tests; `npm run check` 0 errors, 0 warnings over 2346 files; build; format; lint; the ASCII grep; `checks: 7 commands passed`.

## What was found

- Fixes at landing, three, from the refutation over round 1: the P8 paint test's fixed 500 ms race replaced by a zero-delay turn and the loader's record (tests of the file 609 ms to 107 ms, red under its revert); the `paintCode` comment and the report's item 1 saying a second pick of the same theme does not repaint; the report's citation `code-themes.ts:32`.
- The look on TEST, read from the DOM: the Settings row "Code theme" reading "From the theme"; the menu with 66 items, "From the theme" first and current; a Nord pick saved and shown; after a reload the source tab painted in Nord's colours on the UI theme's white background; "From the theme" gave the token colours back; the stored pick removed afterwards and the look's two tabs closed.
- Not raised: after a failed theme load, a second pick of the same theme does not repaint; a reload or another pick does.

## Next

Q84: its builder reported item 4 (`post.ts` folded into `writes`) not built, because the import-order check keeps `state/client` above the store folders, and it moved the helper to `state/shared/stores/`. The review runs next, and the orchestrator rules on that finding. Q102 is building.

## Usage

Brief check 63 tool uses, 183k tokens, 9 min; builder 89 tool uses, 290k tokens, 41 min, and round 1 14 tool uses, 306k tokens, 8 min; reviewer 44 tool uses, 187k tokens, 13 min, and over round 1 26 tool uses, 150k tokens, 10 min. Builders claude-sonnet-5-5, reviewers and the brief check claude-opus-5-5. The builder's first report did not pass its bar; three fixes at landing.
