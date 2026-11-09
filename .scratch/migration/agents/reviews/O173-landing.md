# O173 landing

Position: the oculus migration, step O173 (the audit asks every research project for a deck) landed. Next: O151's review over round 2 when its builder reports.

Open items: none.

## Check of Steps 1

The builder aca21d5a391ac3483, the brief check a3b6a980fe45e6b36 and the reviewers a0a900d566b589741 and a89ad68a5efc4538f had ended before the landing; the runner's agent listing showed only O151's builder a69da2be8a76365d5, which is not of this step.

## Not done

Nothing inside the brief. The hub row `{ file: present/present.yml, tiers: { words: [research] } }` under `audit.required_files` of the hub's `.oculus/config.yml` is the hub's own change (`plan.md` Rulings, open item 733): it waits for O151's hub commit and Axel's word.

## What landed

A row of `audit.required_files` takes a `tiers` word block (`words`, `not_words`), held against the project's tier as `stages` is against its stage: `src/lib/server/content/audit/setting.ts`, `projects.ts` and `rules.ts`, the field and its help in `config/options/behavior.yml`, the row's description and an example in `docs/templates.md`, tests in `tests/routes/docs/audit.test.ts` and `tests/server/edit/config-value.test.ts`. `tests/checks/imports/` joins `SCANNERS` in `tests/tiers/quick.mjs` (open item 734). `docs/diagrams/writes.dot` and `.svg` are regenerated for a moved line. G125 in `agents/guarded.md` names the tier.

Behaviour to know: `tiers: { words: [] }` holds for no project and gives no finding, as `stages` does; a hand-written unknown tier word is taken with no finding; a key named twice in a row makes the hub's config fail to parse.

## The look

Scratch server on 8797 from the gate, the Primary hub layer of Settings, `audit.required_files`, Light Modern and Dark Modern. Seen: the `tiers` control after `stages` on each row; `research`, `personal` and `software` under one of these words and none of these words; "no choices" under the two flag lists; pressing `research` moves it to a chip with its remove mark, says 1 unsaved change and leaves `personal` and `software` offered; removing the chip returns to no unsaved change. Nothing was saved; the scratch hub's config compares equal to its backup under `cmp`.

The look found the name `tiers` in the vertical middle of its four-list block. Fixed at landing and seen on the page: the name's top and the block's top are both 209 px, the `folder` row beside it stays centred, and in a column too narrow for the block the name stands above it as before.

## Verification

In the gate worktree, `npm run diagrams && npm run docs:palette && npm run test:quick` (`.agents/worktrees/gate-O173c.log`):

    ok      svelte-check: 591 FILES 0 ERRORS 0 WARNINGS
    ok      vitest
    ok      vitest slow
    ok      vitest checks
    test:quick: 83.5 s; every command passed

Not covered by that list: tests that reach no changed file within the import depth, the build, the lint of unchanged files. `cmp` of the staged diffs of the gate and main exits 0. No A/B: `bench: []`.

## Agents

Builder aca21d5a391ac3483, claude-opus-5-5: 212085 tokens, 69 tool uses, 19.7 min; round 1: 250084 tokens, 31 tool uses, 7.3 min. Brief check a3b6a980fe45e6b36, claude-opus-5-5: 176663 tokens, 18 tool uses, 6.1 min. Reviewer a0a900d566b589741, claude-opus-5-5: 195803 tokens, 27 tool uses, 12.8 min. Over round 1, a89ad68a5efc4538f, claude-opus-5-5: 176698 tokens, 23 tool uses, 9.8 min.

The builder's first report did not pass its bar: the first review had Standards 1, 2 and 3, closed in round 1; the review over round 1 found nothing. Fixes at landing: one, the name of a word block at the block's top (`src/lib/views/system/workbench/editors/Cards.svelte`).

## Next

O151's review over round 2 when its builder reports, the measurement of every deck, its landing, then its hub commit and the hub row on Axel's word.
