# O138 landing

Roadmap entry: the cockpit-to-oculus migration. Step O138, an `interview` and an `offered` status (rulings Interview status, Offered status, 657, 659, 660, 663 and 664). Next: O137 and O139, whose reviews run.

## Open items

None.

## Steps 1

The runner's agent listing (ListAgents) showed two subagents running: O137's reviewer a7e642347c27ccca6 and O139's reviewer a6778fc60b885525b. None of O138's agents (the builder a9e9bc2ddc2eda74a, the brief check a3acca86b4a0aeeaa, the reviewer afc96bfed496776c2) was listed.

## Not done

Nothing of the step.

## What landed

The whole range from base ceb3622c0 (the builder's work under the cases ruling `agents/briefs/O138-cases.md`, in the wip commit eb3ed4e44): 3 paths, 14 insertions and 10 deletions, with no fix at landing.

- `config/catalogs/vocab.yml` `statuses:` gains `interview` (`#7c3aed`, `c-purple`) and `offered` (`#0d9488`, `c-teal`), each with `closes_deadline`, `deadline_met` and `live_subtasks`. `position_stages` gains the rows Interview and Offered after Applied.
- `docs/templates.md` orders the Applications options and comment as active, applied, interview, offered, accepted, not-applied, declined, rejected, withdrawn; the Education options `[ongoing, planned, completed]`; the Tasks options `[doing, todo, done, dropped]`; each comment to match.
- `docs/HELP.md:296` names the Interview and Offered stacks of the Focus board.
- The research hub, commit 1c0d40fdd: `.oculus/data/academic/applications.yml` takes the Applications order and its `ugent-bioml-doctor-assistent` entry `status: interview`; `education.yml` and `tasks.yml` take the Education and Tasks orders.

## Verification

In the gate worktree, `npm run diagrams && npm run docs:palette && npm run test:quick`:

```
test:quick: 3 changed file(s), from git since HEAD
test:quick: 2 test file(s)
ok      prettier (5.4 s): All matched files use Prettier code style!
ok      ASCII gate (6.4 s)
ok      svelte-kit sync (10.9 s)
ok      svelte-check (30.4 s): 1793737642241 COMPLETED 582 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest checks (36.0 s): Duration  2.65s
ok      vitest (50.7 s): Duration  17.44s
test:quick: 62.1 s; every command passed
```

On main, `git diff --cached --binary` equals the gate's under `cmp`. The verify list equals the page's commands. No A/B: the configuration names no bench.

## The look

A scratch server on 8797 from the gate, with a scratch copy of the research hub carrying the hub edits:

- The Applications view's slices show "interview 1" in purple, and its badge reads 7.
- The UGent card has a purple `interview` chip and a purple edge.
- The Focus board's Job applications column stacks Active, Applied and Interview; the Interview stack is edged purple (`rgb(124, 58, 237)`) and holds the UGent entry.
- The awaiting box lists the UGent entry under Applications.
- The Teaching column stacks Ongoing before Planned.
- No console error. The server is stopped and 8797 is free.

## Agents

The builder's first report passed its bar: the review found nothing. No fix at landing.

- Builder a9e9bc2ddc2eda74a (claude-opus-5-5): first run 224715 tokens, 78 tool uses, 14 min 49 s.
- Brief check a3acca86b4a0aeeaa (claude-opus-5-5): 220970 tokens, 97 tool uses, 11 min 7 s.
- Reviewer afc96bfed496776c2 (claude-opus-5-5): 168827 tokens, 46 tool uses, 9 min 43 s.

## Next

/refute O137 and O139 finish, then their repair rounds or landings.
