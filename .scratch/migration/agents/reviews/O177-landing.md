# O177 landing

Position: the oculus migration, step O177 (the stage umbrella) landed. Next: the review of O176 over repair round 1, then its landing.

Open items: none.

## Check of Steps 1

The runner's agent listing showed no agent of the step running; the builder and both reviewers had ended.

## Not done

The hub side is not committed: it stands in `/Users/axelfaes/workspace/research-hub/.agents/worktrees/migration-O177` at 76cf0c5f9 and needs Axel's word.

## What landed

The whole range from base 12f08efdc.

Two fixes at landing, both found at the look and inside the brief. (1) `config/catalogs/vocab.yml`: the stage label `umbrella (parent of other projects)` wrapped the deck's facts footer to a second line, so the ECG-AF deck ran 1% past its frame; the label is `umbrella`, after which that deck carries no too-tall finding. (2) Hub side, on Axel's message that the research approach needs updating: `docs/figures/gen_figures.py` `_category` read a category's `label` as a string where the vocabulary holds `{one, other}`, which crashed the lifecycle figure; the stage grid takes eight columns so 15 stages fit; `docs/figures/project-lifecycle.svg` and `research-programme.svg` regenerated; `accepted` added to the stage list of `docs/RESEARCH-APPROACH.md`. `docs/AGENT-APPROACH.md` names no stage, lane or moved folder and its four figures regenerate byte-identical, so it is unchanged.

## The look

Looked at on a scratch server from main, pointed at the hub worktree: Focus (Umbrella section between Incubation and Idea, count 2, both projects sorted by title, sub line drawn; Parked and Incubation folded; Synthwave, Everforest Dark and Kanagawa Lotus: `--c-blue` moved and the section reads under each), Projects (pill and section umbrellas 2 before ideas), Pillars, Domains (each card keeps its total and gains an umbrella chip), Present (ECG-AF and Math-Primitives decks with Stage `umbrella`, portfolio order places them at tiles 72 and 73, before the first nascent deck at 74), Editor (Stage select offers umbrella after scoping and holds it for Math-Primitives; nothing saved), Funding, Help (Research approach: lifecycle figure and hub map). Before (O176's hub worktree, both projects at `exploring`) and after: Projects in flight 15 to 13; the Projects rail 51 to 45, since the rail sums the Projects, Supervision and Coauthor boards and on the scratch home each of the three holds both projects; Tensor card in flight 20 to 18; its unrated tier row 7 to 5; No funding 24 to 23. No Domains card has only these two as members. The two remaining Findings rows on the scratch home are the missing website folder, which that home does not carry.

## Verification

On main, with `TMPDIR` unset: `npm run diagrams && npm run docs:palette && npm run test:quick`: prettier, ASCII gate, svelte-kit sync, eslint, svelte-check (591 files, 0 errors, 0 warnings), vitest slow, vitest and vitest checks ok; `test:quick: 100.1 s; every command passed`. It does not cover tests that reach no changed file within the import depth, the build, or the lint of unchanged files. A/B: `bench: []`, none.

## Agents

Builder ad215e14fdd46d365 (claude-opus-5-5): 96637 tokens, 129 tool uses, 1801 s; round 1: 157079 tokens, 26 tool uses, 341 s. Brief check a602a835ac6d57075: 227351 tokens, 28 tool uses, 664 s. Reviewer ab2166d2af0bc3b1a: 219077 tokens, 37 tool uses, 815 s. Reviewer over round 1 af4c821052153f0eb: 196601 tokens, 38 tool uses, 1813 s. The first report did not pass its bar: repair round 1 closed the review's findings, and the review over the round found nothing.
