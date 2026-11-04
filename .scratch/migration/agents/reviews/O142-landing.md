# O142 landing

Roadmap entry: the cockpit-to-oculus migration. Step O142, a nested group's heading one level down (ruling 668). Next: O144's /spec on main's head; O141 waits on open item 672.

## Open items

- 672 (2026-11-04, O141's builder hand-back, ruling 667, `agents/reviews/O141-report.md`): ruling 667 rests on a lane colour in `vocab.yml` being able to bring every Focus pair that touches with every cluster open to a CIEDE2000 of 10 in every theme, and that is wrong. The builder's case-run program, rerun by the orchestrator with the same output, finds 7 such pairs under 10 on the base (Funding-Jobs, Funding-Run, Jobs-Push, Run-Push, Run-Review, Review-Scope, Scope-Idea), and its search over every set of recoloured headers and all 29 palette tones finds 0 assignments that meet the brief's three bars (bar 1, every open pair at 10 or more; bar 2, no pair at 10 or more falls under 10 and no pair under 10 gets closer, collapsed layouts included; bar 3, no theme token changes). Part of the cause is in the theme blocks: dracula gives `--c-blue`, `--c-slate` and `--c-grey` one value, `#6272a4` (`singles.css:97,106,107`), so Jobs-Push measures 0.0 there, and kanagawalotus puts gold and grey-d 4.9 apart. (a) O141 widened to the theme sheets: the theme blocks where two lane hues alias or sit under 10 get hues of their own, alongside lane recolours where they help, until every open pair is at 10 or more in every theme, bar 2 kept, each changed hue also measured at 10 or more against every status token on the hue and on `-txt` as O140 measured, and each touched head comment naming where its added hues come from. Pros: ends the cause, with the bars as ruled. Cons: authored theme colours change in several themes, and the other users of those hues (status chips, the git graph, the calendar) change with them; a look at landing in each touched theme. (b) Recolour under bar 1 alone, dropping bar 2: one of the 36 assignments that meet bar 1 (Jobs and Run in the red family, Scope teal). Pros: no theme file changes. Cons: Jobs and Run sit beside Blocked's red and Scope on Teaching's and Build's teal, so collapsed layouts get pairs at 0.0. (c) Only the comments rewritten to the measured state (7 open pairs and 19 collapsed-only pairs under 10): the lazy option; the headers stay too close. Recommended: (a).

## Steps 1

The runner's agent listing showed no subagent running; none of O142's agents (the builder a14726c8e3496ad88, the brief check a9d682e40ef0d4ed4, the reviewers a987dd72ad0cf6880 and aa17a11de3b868799) was listed.

## Not done

Nothing of the step.

## What landed

The whole range from base 261dc20b2 (the builder's first run and repair round 1, in the wip commit 3c9bc0240), with the fix at landing: 2 paths, 34 insertions and 9 deletions.

- `src/lib/ui/controls/heads/GroupHead.svelte`: a group whose section stands in another group's body draws its label at the small size and its strip's words one level in. The body passes `--group-label: var(--fs-sm)` and `--group-indent` (the parent's inset plus one fold control's box and `--group-gap`, 6 px) to the groups inside it; the section carries the indent as `--group-inset`; the strip pads by it, so its `--panel` band still starts at the group's left edge. The head comment and the comments over `.body` and `.strip` say so.
- `docs/HELP.md:295`: the Groups bullet says a group inside another group's body reads one level under it, its words indented by one fold control and the gap after it.

Premise correction: the brief named 5 `.body` elements besides GroupHead's own; the base holds 15, and none of the other ten holds a `GroupHead`, so the mechanism is unaffected.

Fixes at landing, from the review over round 1:

- Standards: `docs/HELP.md:295` names the gap as well as the fold control, since the indent per level is both (28 px at text scale 1).
- Proof: `agents/reviews/O142-report.md` gives the positions after the round, 264 lines and +32 -8, the diff as `git diff 261dc20b2 -- src/lib/ui/controls/heads/GroupHead.svelte` prints it, and labels its first run's output as before the round.

## Verification

In the gate worktree at main's head 85e161ad0, after the fix, `npm run diagrams && npm run docs:palette && npm run test:quick`, exit 0:

```
test:quick: 2 changed file(s), from git since HEAD
test:quick: 9 test file(s)
ok      prettier (1.4 s): All matched files use Prettier code style!
ok      ASCII gate (1.5 s)
ok      svelte-kit sync (3.0 s)
ok      eslint (11.0 s)
ok      svelte-check (11.5 s): 1793756846330 COMPLETED 581 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest checks (45.0 s): Duration  31.63s (transform 12.19s, setup 0ms, import 25.80s, tests 41.36s, environment 2ms)
test:quick: 48.2 s; every command passed
test:quick: not covered: tests that reach no changed file within the import depth,
```

On main the same range cherry-picked with the fix; each of the 2 staged paths equal under `cmp` to the gate's. The verify list equals the page's commands. No A/B: the configuration names no bench.

## The look

A scratch server on 8797 from the gate, measured with scripts in the page:

- Findings view: the Audit strip's label 13 px, its fold control at 8 px from the group's edge. Missing data, Hub conventions and Website: label 12 px, count 12 px, left padding 36 px, fold control at 36 px, the same x as the Audit label; the strip's band starts at the group's edge (0 px).
- Status view, Gallery unfolded: the Gallery strip as the Audit strip; its eight sections (Cards, Chips, Tags, Meters, Table, Confirm dialog, Ticker, Empty state) as the Audit kinds. Gallery folded again after.
- No console error. The server is stopped and 8797 is free.

## Agents

The builder's first report did not pass its bar: the first review's six findings were closed by repair round 1. The review over round 1 found two, fixed at landing.

- Builder a14726c8e3496ad88 (claude-opus-5-5): first run 169221 tokens, 55 tool uses, 9 min 52 s; round 1 215970 tokens, 26 tool uses, 3 min 16 s.
- Brief check a9d682e40ef0d4ed4 (claude-opus-5-5): 204165 tokens, 70 tool uses, 9 min 13 s.
- Reviewer a987dd72ad0cf6880 (claude-opus-5-5): 182086 tokens, 40 tool uses, 9 min 35 s.
- Reviewer over round 1 aa17a11de3b868799 (claude-opus-5-5): 153451 tokens, 26 tool uses, 5 min 16 s.

## Next

O144's /spec on main's head.
