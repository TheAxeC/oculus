# O128 landing

Roadmap entry: the cockpit-to-oculus migration. Step O128, a category sets the order of its cards. Next: O129, the Status view's line count removed whole, reviewed; its repair round.

## Open items

- Open item 646: in a hub's `.oculus/config.yml` the editor's schema of every `multi` field holds only a list to the field's words, so a wrong word written as one text (`sort: nonsense`) gets no mark there, though the whole-file shape still reports it. It was so for every `multi` field before O128. (a) recommended: a new step that gives the text form a pattern of the field's words; (b) no change, the lazy option.
- Open item 645: the category rows of a hub other than the primary are held to the whole-file shape only, never to `categoriesFindings`, so a wrong stage word or a row with no `color` there gives no finding. (a) recommended: a new step that runs `categoriesFindings` over each other hub; (b) no change, the lazy option.

## Steps 1

The runner's agent listing showed none of O128's agents running: the builder a1f38c408a7b19f9c, the brief check aad602adef6203102 and the reviewers adc685d3ef30c1258 and a2208500727bd6a9d had each sent their completion notice.

## Not done

Nothing in the brief is left undone. Not seen on the look: a pinned card (no copied manifest pins one; settled by C2 and C3), the Awaiting box's tab (the same `cardSections`, settled by the board rows), and the Settings multi-pick of `sort` and the editor's completion (settled by reading the options entry and the round's schema run).

## What landed

The whole range from base 8ae9afb82 (the builder's work after the cases ruling, repair round 1, wip commit d76fa6984), 14 paths. A row of `categories:` takes `sort:`, a word or a list of `stage`, `year` (newest first, no year last) and `title`, read after the pinned projects; a row with none goes by stage, then title. `publications` and `other-outputs` ship `sort: [stage, year, title]`. One comparison, `compareCards` in `presets.ts`, serves the board's order and each section's. A wrong `sort` is a finding of the whole-file shape in every hub and reads as no `sort`. The Settings help, the vocab comment, `docs/HELP.md` and `docs/templates.md` say so. In the editor, `vocab.yml` and a hub's `.oculus/config.yml` now offer `sort` with its three words.

Verification in the gate, `npm run diagrams && npm run docs:palette && npm run test:quick`: `test:quick: 67.7 s; every command passed`; the staged diffs of main and the gate are equal under `cmp`. The verify list equals the page's commands. No A/B: the configuration names no bench.

Fixes at landing in code: none. `agents/guarded.md` G124 rewritten: a wrong `sort` is a finding of the whole-file shape, and its Code names `categorySort`.

The look (scratch server on 8797 from the gate, scratch HOME with a copy of the hub's `.oculus` without `local.yml` and 14 manifests copied in): on the Archive board, publications reads HCCNet-FL, ERP Signatures (accepted, 2026, by title), Robust-XAI-ECG (published 2026), FERMAT, Sign-Language ECoG (2025, by title), NN Connectivity, BTTR Finger Decoding (2022, by title), eLORETA Source Reduction (2021); other outputs reads 2026, 2018, 2017, 2016; no console error. The server is stopped.

## Usage

Builder a1f38c408a7b19f9c: first run (cases hand-back) 229973 tokens, 78 tool uses, 10 min 12 s; build after the cases ruling 342176 tokens, 82 tool uses, 12 min 20 s; round 1 361537 tokens, 20 tool uses, 2 min 20 s. Brief check aad602adef6203102: 229764 tokens, 91 tool uses, 11 min 50 s. Reviewer adc685d3ef30c1258: 189945 tokens, 39 tool uses, 8 min 14 s. Reviewer over round 1 a2208500727bd6a9d: 180294 tokens, 34 tool uses, 6 min 53 s. All claude-opus-5-5. The first report did not pass its bar: one repair round.

## Next

O129's repair round for the review's one finding, its review over the round, then its landing.
