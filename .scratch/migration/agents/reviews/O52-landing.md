# O52 landing

Position: plan migration (cockpit to oculus), step O52 (the Focus board's section headings take one shape), landed 2026-10-22. Next: /land O50, then /spec O54, O61 and O53; /land O49; O57 is building.

## Open items

None.

## Not done

- The look did not cover the dark theme or a narrow pane, and no find-in-page was run on the folded career banner; its unfold on a match is by reading `CareerPanel.svelte` (`hidden="until-found"` and `onbeforematch`).

## The check of Steps 1

The runner's agent listing showed one agent running, O57's builder; none of O52's builder (a705c557e720c4b27), brief check (a95389eccf26b9f17) or reviewers (aa46c6d7fba77e682, a71c9aeb58e432ce4) was running.

## What landed

From base d7625582, the range replayed in the gate worktree `.agents/worktrees/gate` (ruling 241 (b)) and then on main, the two staged diffs equal under `cmp`: `src/lib/views/boards/focus/FoldHead.svelte` (new), `CommandCenterView.svelte`, `Tasks.svelte`, `career/CareerPanel.svelte` and `config/text/views/boards/focus.yml`, with the diagrams `layer-views` and `layers` regenerated. The three headings draw the fold control, the glyph and the title at one x each, 22 px high, and the career banner folds its body hidden until found.

## Fixes at landing

- The replay's conflicts in the diagrams `layer-views` and `writes`: main's copies taken, then `npm run diagrams` regenerated them.
- The round-1 review's B1 and P1: `CareerPanel.svelte` draws the body's 4 px top padding only while it is shown, so the folded career box is 32 px, the command center's. P2: a note under the report's DONE table.
- Ruling 240 (a): `tests/tiers/quick.mjs` runs only the tests that name or import a changed file and the changed tests, those under `tests/checks` and those tagged slow included, in three vitest runs (the unit tests, their slow tests with the slow time limit, the tree checks with none), with no essential list and no time limit; `tests/tiers/essential.txt` is deleted; `agents/spec.md`'s verify paragraph and Z492's line in the state file say the same.

## What was found

The review (`agents/reviews/O52-refuter.md`) with one repair round and a run over it; every finding is closed under its Closed heading. The builder's first report did not pass its bar.

## The look

Read only on the Focus page, since the Focus view cannot be opened on TEST; the page was put back on Repositories afterwards, and `git status --short -- .oculus` in the hub prints nothing. Measured in the page: the fold controls of Career strategy, Command center and Tasks at x 76, each 22 px high, labelled "Unfold Career strategy", "Fold Command center" and "Fold Tasks", each with a tooltip; the folded career box 32 px, its body `hidden="until-found"` with 0 px padding and 0 px height. Seen: the glyphs and titles of the three headings on one line each, at the same x. Defects: none.

## Verification in the gate

```
$ npm run diagrams && npm run test:quick
test:quick: 11 changed file(s), from git since HEAD
test:quick: 0 test file(s)
ok      prettier (0.6 s): All matched files use Prettier code style!
ok      ASCII gate (0.7 s)
ok      svelte-kit sync (2.1 s)
ok      svelte-check (6.8 s): 1792685623389 COMPLETED 536 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      eslint (7.3 s)
test:quick: 9.5 s; every command passed
```

No test names or imports a changed file: `grep -rln` over `tests` for the four components finds only `tests/checks/tree/boundaries.test.ts`, whose hits are fixture strings for other paths. A/B: none, `bench: []`.

## Agents

- Builder a705c557e720c4b27, claude-opus-5-5: 197523 tokens, 51 tool uses, 23 min 27 s; round 1 228747 tokens, 16 tool uses, 6 min 6 s.
- Brief check a95389eccf26b9f17, claude-opus-5-5: 172686 tokens, 43 tool uses, 5 min 59 s.
- Reviewer aa46c6d7fba77e682, claude-opus-5-5: 180969 tokens, 41 tool uses, 12 min 24 s.
- Reviewer over round 1 a71c9aeb58e432ce4, claude-opus-5-5: 140872 tokens, 30 tool uses, 7 min 39 s.
