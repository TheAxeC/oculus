# O143 landing

Roadmap entry: the cockpit-to-oculus migration. Step O143, a `stopped` status (ruling 669). Next: O142's landing, then O144's /spec; O141 waits on open item 672.

## Open items

- 672 (2026-11-04, O141's builder hand-back, ruling 667, `agents/reviews/O141-report.md`): ruling 667 rests on a lane colour in `vocab.yml` being able to bring every Focus pair that touches with every cluster open to a CIEDE2000 of 10 in every theme, and that is wrong. The builder's case-run program, rerun by the orchestrator with the same output, finds 7 such pairs under 10 on the base (Funding-Jobs, Funding-Run, Jobs-Push, Run-Push, Run-Review, Review-Scope, Scope-Idea), and its search over every set of recoloured headers and all 29 palette tones finds 0 assignments that meet the brief's three bars (bar 1, every open pair at 10 or more; bar 2, no pair at 10 or more falls under 10 and no pair under 10 gets closer, collapsed layouts included; bar 3, no theme token changes). Part of the cause is in the theme blocks: dracula gives `--c-blue`, `--c-slate` and `--c-grey` one value, `#6272a4` (`singles.css:97,106,107`), so Jobs-Push measures 0.0 there, and kanagawalotus puts gold and grey-d 4.9 apart. (a) O141 widened to the theme sheets: the theme blocks where two lane hues alias or sit under 10 get hues of their own, alongside lane recolours where they help, until every open pair is at 10 or more in every theme, bar 2 kept, each changed hue also measured at 10 or more against every status token on the hue and on `-txt` as O140 measured, and each touched head comment naming where its added hues come from. Pros: ends the cause, with the bars as ruled. Cons: authored theme colours change in several themes, and the other users of those hues (status chips, the git graph, the calendar) change with them; a look at landing in each touched theme. (b) Recolour under bar 1 alone, dropping bar 2: one of the 36 assignments that meet bar 1 (Jobs and Run in the red family, Scope teal). Pros: no theme file changes. Cons: Jobs and Run sit beside Blocked's red and Scope on Teaching's and Build's teal, so collapsed layouts get pairs at 0.0. (c) Only the comments rewritten to the measured state (7 open pairs and 19 collapsed-only pairs under 10): the lazy option; the headers stay too close. Recommended: (a).

## Steps 1

The runner's agent listing showed one subagent running, the reviewer of O142 over round 1 (aa17a11de3b868799), which is not O143's; none of O143's agents (the builder ad9f5539c272f5968, the reviewers a0173c7cce622909c and a8f3618bbe491b67a) was listed, and the stop tool found none of them running.

## Not done

Nothing of the step.

## What landed

The whole range from base 9cdccce4e (the builder's first run and repair round 1, in the wip commit c4c4f7afd): 2 paths, 4 insertions and 3 deletions.

- `config/catalogs/vocab.yml:147`: `statuses:` gains `stopped: { color: "#9ca3af", closes_deadline: true }`, after `not-applied`, with its grey and its flag.
- `docs/templates.md:1407`: the Funding template's options end `withdrawn, stopped`; its entry comment (`:1436-1437`) names `stopped`, filled at 100 columns.

Fixes at landing, from the review over round 1, in `agents/reviews/O143-report.md`:

- P-r1-1: the account of `git -C /dev/null status` names its `2>/dev/null`, as the builder's transcript holds the command, so "printed nothing" is the redirect's doing.
- P-r1-2: the sentence on the two maps names the five further files a wider grep finds (`tones.ts`, `focus-lanes.ts`, `snapshot/validate.ts`, `config/catalog/options.ts`, `data/index.ts`), each keeping `statuses` and `stages` apart.

Breach recorded (Sp-r1-1): in round 1 the builder ran `git -C /dev/null status 2>/dev/null`, which `agents/spec.md:33` does not allow; it reached no repository and nothing in the diff rests on it.

## Verification

In the gate worktree at main's head f42115c20, `npm run diagrams && npm run docs:palette && npm run test:quick`, exit 0:

```
test:quick: 2 changed file(s), from git since HEAD
test:quick: 2 test file(s)
ok      prettier (1.2 s): All matched files use Prettier code style!
ok      ASCII gate (1.3 s)
ok      svelte-kit sync (2.8 s)
ok      svelte-check (9.9 s): 1793756391808 COMPLETED 581 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest checks (12.4 s): Duration  1.09s (transform 428ms, setup 0ms, import 929ms, tests 18ms, environment 0ms)
ok      vitest (20.8 s): Duration  9.44s (transform 1.40s, setup 0ms, import 2.35s, tests 6.95s, environment 0ms)
test:quick: 23.8 s; every command passed
test:quick: not covered: tests that reach no changed file within the import depth,
```

On main the same range cherry-picked; each of the 2 staged paths equal under `cmp` to the gate's. The verify list equals the page's commands. No A/B: the configuration names no bench.

## The look

A scratch server on 8797 from the gate, its scratch hub's `funding.yml` replaced by the research hub's (two entries at `stopped`):

- The Findings view holds no status finding for `funding.yml`.
- The Focus board's Deadlines & dates lists "FWO Senior Postdoctoral Fellowship 2026 funding deadline in 13d" with that entry at `in-prep`, and no longer once it is set to `stopped`.
- The Funding view's status chips read planned 2, submitted 2, contributing 3, awarded 1, rejected 3, stopped 3, the last in grey.
- The server is stopped, 8797 is free, the scratch file is put back.

## Agents

The builder's first report did not pass its bar: the first review found S1, Sp1, Sp2, P1, P2 and B1, closed by repair round 1. The review over round 1 found Sp-r1-1 (recorded), P-r1-1 and P-r1-2 (fixed at landing).

- Builder ad9f5539c272f5968 (claude-opus-5-5): first run 183010 tokens, 65 tool uses, 9 min 21 s; round 1 228295 tokens, 29 tool uses, 3 min 47 s.
- Brief check a8d6da3737d3eb6cc (claude-opus-5-5): 179203 tokens, 68 tool uses, 7 min 54 s.
- Reviewer a0173c7cce622909c (claude-opus-5-5): 148258 tokens, 46 tool uses, 7 min 24 s.
- Reviewer over round 1 a8f3618bbe491b67a (claude-opus-5-5): 137562 tokens, 24 tool uses, 5 min 2 s.

## Next

O142's landing, then O144's /spec on main's head.
