# O103 landing

Position: the migration plan (`.scratch/migration/plan.md`), step O103, the command center's applications and position leads as two groups and a task's subtasks under it in Focus Tasks, landed on main. In flight: O99, building. Next: O99's report, /refute and /land; then /spec O101, then O102.

## Open items

None.

## Check of Steps 1

The runner's agent listing showed one subagent, O99's builder a4c10c31eedf15f05, running, and none of O103's builder (a34a055d6cb7b30b9), brief check (adb3d9f9523ef6aca) or reviewers (abb1b8f406af77f0a, a88430fe571dffe66).

## NOT DONE

Nothing of the brief.

## What landed

The whole range `d364c1b7e..migration-O103` (one wip commit c93eebd37 of the builder's work and its repair round 1), with the Doc text: 10 paths.

- `config/catalogs/vocab.yml`: the ticker category `lead` after `position`.
- `config/text/views/boards/focus.yml`: `dlcat_position: applications`, `glyph_position: inbox`, and `dlcat_lead: position leads`, `glyph_lead: scout`, `word_lead_deadline: lead deadline`.
- `config/defaults/sources.yml` and the demo hub's `config.yml`: the leads entry's `ticker: { category: lead }`.
- `src/lib/state/boards/ticker.ts`: `taskGroups` gives the Tasks group as tasks each with its own subtasks; a subtask goes under the line whose target names the same hub, collection and entry and carries `task: true`.
- `src/lib/ui/display/ticker/ticker-rows.ts` and `Ticker.svelte`: the row fields `heading` and `under`.
- `src/lib/views/boards/focus/Tasks.svelte`: a task with open subtasks drawn as a heading row, its subtasks under it labelled by their own text.
- `docs/HELP.md:295` and `docs/templates.md:90`: the Doc text.

## Verification

In the gate worktree at main's head 450085989, `npm run diagrams && npm run docs:palette && npm run test:quick`:

```
test:quick: 10 changed file(s), from git since HEAD
test:quick: 14 test file(s)
ok      prettier (1.8 s): All matched files use Prettier code style!
ok      ASCII gate (2.2 s)
ok      svelte-kit sync (6.4 s)
ok      vitest (18.3 s): Duration  10.82s (transform 11.52s, setup 0ms, import 21.26s, tests 6.57s, environment 1ms)
ok      svelte-check (28.4 s): 1793288135650 COMPLETED 560 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      eslint (30.6 s)
ok      vitest checks (43.7 s): Duration  36.02s (transform 18.36s, setup 0ms, import 48.04s, tests 56.34s, environment 2ms)
test:quick: 50.3 s; every command passed
```

The diagrams and the palette page were unchanged. Main's `git diff --cached --binary` and the gate's compared equal with `cmp`. The gate's and main's git each held a stale sequencer of an earlier landing (main's todo `pick 615ed71e5 wip`), cleared with `git cherry-pick --quit` on clean trees. No A/B: the configuration block names no bench.

## The look

On 8790, in a new Chrome tab, over the research hub:

| View | Seen |
|---|---|
| Command center | "applications" with the inbox glyph: Defensie, Reservist Officer, position deadline in 84d; "position leads" with the scout glyph: three leads, lead deadline in 3d and 6d |
| Focus Tasks | "Main Tasks" in bold with its done button; its five subtasks set in under it, each labelled by its own text (Oculus, the scaling-book link, Paper2Agent, Position leads, Emails) |
| Heading on hover | the task row's buttons: todo, done, dropped, agent, 1w, 1mo, hide, Remove |
| Subtasks group | not drawn, holding nothing |

The tab is closed.

## Found

- The builder's two probe runs and the case-run program's temporary-folder copies, closed under the ruling "Unapproved builder scripts" in repair round 1; nothing they produced is used beyond the case-run program's quoted output.

## Agents

- Brief check adb3d9f9523ef6aca (claude-opus-5-5): 223910 tokens, 74 tool uses, 10 min 1 s.
- Builder a34a055d6cb7b30b9 (claude-opus-5-5): round 0 280381 tokens, 118 tool uses, 20 min 56 s; round 1 307920 tokens, 24 tool uses, 4 min 50 s.
- Reviewer abb1b8f406af77f0a (claude-opus-5-5): 187340 tokens, 43 tool uses, 8 min 56 s.
- Reviewer over round 1 a88430fe571dffe66 (claude-opus-5-5): 160915 tokens, 27 tool uses, 5 min 33 s.

The builder's first report did not pass its bar: the review's findings went back in repair round 1. Fixes at landing: the HELP.md dated-first sentence, the report's stale `vocab.yml:255`, and the builder's vitest cache in the scratchpad removed.

## Next

O99's report, /refute and /land; then /spec O101 and /spec O102.
