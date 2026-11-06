# O150 landing

Position: roadmap entry "migration" (the oculus migration plan); step O150, the hub's portfolio deck, landed; next: O158's landing (its design to Axel first), O151 building, then O159, O160 and O161.

## Open items

- Open item 701 (2026-11-06, O151's brief check, C-4): how the slides marked Too tall reach O151's builder. (a) Inside the build, before the review, repeated until none is marked (a resume outside the skill's round flow, needing Axel's yes); (b) in repair round 1 beside the review's findings. Recommended (a); (b) is the lazy option.
- Open item 702 (2026-11-06, O151's brief check, C-6): the `cirrhosis-digital-twin` deck, whose idea comes from a proposal shared in confidence. (a) Name, stage and the manifest's facts not taken from the proposal; (b) the idea in Axel's words from the README's opening paragraph; (c) no deck. Recommended (a) until Axel says the idea may be shown.
- Open item 703 (2026-11-06, O150's review over round 1): the engine slide's heading "Composable with constraints" over four settings, one of them no constraint. (a) Keep it; (b) "Composable with other settings"; (c) "Carried into new settings". Recommended (c).

## Check of Steps 1

The runner's agent listing showed none of O150's agents (the builder a4c188eb9a1319932 and the reviewers a6f3e70c7f1e62756 and aeed84f6aa7d43a48 finished); the two agents listed are O158's reviewer and O151's builder.

## NOT DONE

- The hub commit of the four `deck/` changes waits on Axel's word: `git status --short deck` in the hub prints ` M deck/engine.md`, ` M deck/present.yml`, ` M deck/title.md`, ` D deck/transition.md`.

## What landed

- No oculus file: the range d46fcfa2e..migration-O150 holds no commit and the worktree's changes are all under the ledger.
- In the research hub, on disk: `deck/present.yml` (title 'Research projects', one group `projects` finding `projects/**/present` for the research tier with `discover: true`, order title.md, engine.md, `{ slides: projects }`, closing.md), `deck/title.md` (kicker "Research portfolio | technical briefing", `legend: projects`, heading "Research projects", lede "Research projects that have a deck of their own, each in its own slides."), `deck/engine.md` (lines 4, 6, 10 and 12 redrafted), `deck/transition.md` removed.
- Fix at landing, one: engine line 12 reads "Each slide from here to the closing slide comes from a research project's own deck: a project slide shows its project's governing equation, specs, method and results, each where the slide states it.", true when the filter keeps no deck (review over round 1, Spec 1).

## What was found

- Verification in the gate worktree at main's head 5929e2e0b: "test:quick: 0 changed file(s)", "ok ASCII gate", "ok svelte-check (11.1 s): ... 584 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS", "test:quick: 15.9 s; every command passed", `npm run build` exit 0. On the real hub, `npx vitest run tests/checks/config/integrity.test.ts`: "Tests 7 passed | 7 skipped (14)".
- The look on the scratch server on 8797: the deck reads "Research projects", 28 slides, "25 projects", the dead-ends label holding "failed 1"; the title and engine slides drawn whole in the frame; "submitted / under review" gives "11 of 25 shown"; the Overview marks 16 slides Too tall (3 to 15, 17, 18 and 27), every one a project deck's own slide, which O151 rewrites.
- Recorded, no change: the builder's report copied open item 700 as open after it was closed; the slices' wording in the report.

## Agents

- Builder a4c188eb9a1319932 (claude-opus-5-5): first run 218920 tokens, 53 tool uses, 11.2 min; after the cases ruling 315676 tokens, 33 tool uses, 9.8 min; round 1 111622 tokens, 21 tool uses, 8.6 min.
- Brief check a29f2fa39393ed95d (claude-opus-5-5): 226538 tokens, 67 tool uses, 13.2 min.
- Reviewer a6f3e70c7f1e62756 (claude-opus-5-5): 210433 tokens, 47 tool uses, 9.7 min.
- Reviewer over round 1 aeed84f6aa7d43a48 (claude-opus-5-5): 193071 tokens, 44 tool uses, 7.0 min.
- The first report did not pass its bar (the title, the lede and engine lines 10 and 12 did not hold for every deck); round 1 closed it; one fix at landing.

## Next

O158's landing with its screenshots to Axel; O151 building; then /spec O159, O160 and O161.
