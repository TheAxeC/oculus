# Step O190 landing report

Position: the cockpit-to-oculus migration, step O190 (the date a paper was submitted, on its cards), landed; next: the twelve `submitted:` dates in the hub's manifests, then the app rebuilt and replaced (ruling App rebuild after O190). No step is queued.

## Open items

- Open item 780 (2026-11-25, O190's Doc text): (a) write the `docs/data-map.md:383` row and the line after `docs/HELP.md:102` as O190's report gives them; (b) leave both pages as they are. Recommended (a); (b) is the lazy option. In full in `orchestrator-state.md`.

## Agents stopped

The builder ad8dd68930c3d6154 and the reviewer aa9a5aa6c5f75b4e3 had finished; the runner's agent listing shows no agent of the step.

## NOT DONE

- The twelve `submitted:` dates are not in the hub's manifests yet; they are written after this commit and committed on Axel's word.
- The app is not rebuilt yet.

## What landed

The whole range from base e2fbf2161 (wip commit 446037aaf), 22 paths, 192 insertions and 58 deletions, with one fix at landing: `config/defaults/layout.yml` `software: { tab: true, rail: true }` (ruling 779). What it builds is booked under O190 in `plan.md`.

## Verification

In the gate at main's head fc0243bc4 with the range and the fix, at normal priority, `npm run diagrams && npm run docs:palette && npm run test:quick`:

```
test:quick: 21 changed file(s), from git since HEAD
test:quick: 239 test file(s)
ok      prettier (0.6 s): All matched files use Prettier code style!
ok      ASCII gate (0.6 s)
ok      svelte-kit sync (2.3 s)
ok      eslint (2.9 s)
ok      svelte-check (12.3 s): COMPLETED 593 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest checks (231.4 s)
 Test Files  4 failed | 182 passed | 33 skipped (219)
 Test Files  2 failed | 45 passed (47)
test:quick: 317.8 s; failed: vitest, vitest slow
```

The 7 failing tests each ended in `Test timed out` (5000 ms or 20000 ms) under a load average near 12. The six files run again: 129 of 130 passed with one timeout in `tests/routes/edit/rail.test.ts`, which alone passed 5 of 5. Main's staged diff equals the gate's (`cmp`). Not covered: tests that reach no changed file within the import depth. A/B: none, `bench: []`.

## The look

A scratch server on port 8797 over a scratch hub (the twelve submitted manifests with their dates, and look cards), Oculus Light and VS Code Dark Modern. The Review lane goes oldest first (BSA-ECoG 2026-10-22 | 34d to RAW-PLS 2026-11-19 | 6d), then a card submitted today `| 0d`, FLKit `submitted 2026-11-26` with no days, and `submitted: soon` with no fact, last; cards of one day and of one deadline go by title; Revise cards draw no fact and go older first. Board cards and the project page draw the fact after the lane tag. Edit Manifest shows Submitted in Dates as a date field with its help words. The Projects rail badge went from 12 to 13 when an in-flight software project was added.

## Usage

Builder ad8dd68930c3d6154 (claude-opus-5-5) 286779 tokens, 164 tool uses, 3576 s; brief check aabe2d223f6b3f8cf (claude-opus-5-5) 219777 tokens, 80 tool uses, 662 s; reviewer aa9a5aa6c5f75b4e3 (claude-opus-5-5) 220759 tokens, 75 tool uses, 1114 s. The builder's first report passed its bar; one fix at landing (ruling 779).
