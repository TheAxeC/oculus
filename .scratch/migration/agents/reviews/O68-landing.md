# O68 landing

Position: migration (cockpit to oculus), step O68, the Focus board after O55 (lane card marks without the cap of two, the career banner of ruling 301). Next: /spec O60 from main's head; O63 in repair round 1.

## Open items

- 322: the hub's career rewrite is written in the hub on disk and not committed: `.oculus/data/academic/career.yml` in the new shape (`goal`, `milestone: "FWO Senior"`, `milestone_date: "2026-11-17"`, the hosts, host criteria, eligibility and empty dropped sections removed), `.oculus/config.yml` without `career_host_status`, `career_score_dims` and `career_score_tones`, and a new `funding/2026-fwo-senior-transplant/hosts.md` with the 15 hosts, their notes, the host criteria and the eligibility. (a) commit it in the hub as it stands; (b) change it first. Recommended (a); leaving it uncommitted is the lazy option.
- 320: the board top bar (rework, the Filter menu only, or leave it). Recommended (a), the rework; (c), leave it, is the lazy option.

## Check of Steps 1

No agent of O68 was running (`ListAgents` listed one subagent, ac5dee728ec212f4c, O63's builder).

## NOT DONE

- The hub rewrite is not committed in the hub (open item 322).
- The look was taken in the light theme only.

## What landed

O68 from base 048821f9, the whole range (wip commit 95be59c1), 69 files with the fixes at landing. A Focus lane card draws every mark its lane does not already say, wrapping onto a second line (`LaneCard.svelte`, `laneMarks`). The career banner draws the situation, the goal, the next milestone with its day and the days left, the order of work, and the track record per role with the funding obtained. The host pipeline, the host editor, the awaiting box's hosts, `scoreTier`'s hub words and the three `career_*` keys are removed with their text keys and refusals.

## Verification

In the gate worktree, `npm run diagrams && npm run test:quick` (69 changed files, 295 test files):

```
ok      ASCII gate (1.4 s)
ok      prettier (1.9 s): All matched files use Prettier code style!
ok      svelte-kit sync (4.2 s)
ok      svelte-check (16.5 s): COMPLETED 537 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      eslint (119.0 s)
ok      vitest checks (156.4 s)
ok      vitest (187.4 s)
FAILED  vitest slow (221.9 s)
```

The one red row is `tests/server/machine/apps/tools/languages.test.ts` ('join their answers the way VS Code joins them', timed out in 40000 ms), a file the step does not change and already tagged slow; alone it passes (`npx vitest run tests/server/machine/apps/tools/languages.test.ts`: 15 passed). The first run's only red row, a 5000 ms timeout in `tests/routes/sessions/terminal-actions.test.ts`, a file the step does not change, passes alone (33 passed) and is tagged slow as a fix at landing.

On main: `git diff --cached` compared under `cmp` with the gate's: SAME, 69 files.

## The look

On a scratch server on 8797 over a copy of the hub with the rewrite applied, through headless Chrome driven by the DevTools protocol (the Chrome extension cannot act on the page): the folded line "Career strategy | Next: FWO Senior (2026-11-17)"; the open banner with the situation, the goal, "Next FWO Senior 2026-11-17 in 24d", the order of work, and the track record (lead 8 in review, 16 in flight, 10 publications, 9 other outputs; supervisor 4 in review; collaborator 1 in review, 2 in flight, 6 publications, 6 other outputs; funding obtained: 1); the Run, Push and Revise lanes with their card marks. Nothing wrong was seen.

## What was found and fixed at landing

- `src/desktop/app.ts:161`: "the default session" in place of "this session", the history check's red row, red on the base too.
- `src/lib/server/edit/writes/undo.ts`: `valueNow`'s comment no longer names a host.
- `tests/routes/sessions/terminal-actions.test.ts`: tagged slow.
- `agents/guarded.md` G8, G9 and G32 name the renamed and new rows.

The builder's first report did not pass its bar: its review raised findings sent back in repair round 1; the review over the round found none.

## Usage

- Brief check a99f4849a5a9ad88d, claude-opus-5-5: 294960 tokens, 125 tool uses, 13 min 31 s.
- Builder a3f1cbcf242aaddd8, claude-opus-5-5: 257007 tokens, 281 tool uses, 44 min 13 s; round 1: 361399 tokens, 168 tool uses, 17 min 25 s.
- Reviewer a7eeb12398f1acb96, claude-opus-5-5: 294870 tokens, 70 tool uses, 15 min 22 s.
- Reviewer over round 1 ae2fda2f81136a0ae, claude-opus-5-5: 262385 tokens, 71 tool uses, 12 min 57 s.

## Next

/spec O60 from main's head; O63's review over round 1 when its builder reports, then its landing.
