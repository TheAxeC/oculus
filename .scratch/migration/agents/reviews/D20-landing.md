# D20 landing

Position: roadmap entry oculus/migration (the cockpit-to-oculus migration); D20, an agent started from a task or in a new worktree with the terminal, graph, git and transcript defects booked on it, landed. Next: /spec D23 (language servers), D44 (Submit on a `.slurm` file) and A3 (scheduled Update runs), whose briefs are rechecked against main with D20.

## Open items (verbatim)

None.

## Not done

Nothing inside the brief. The look cases that pick a permission mode or start an agent (12, 20, 23, 24, 25, 27, 28a, 43, 63) count as done under Z551 without being taken. `bench: []`, so no A/B.

## The check of Steps 1

`ListAgents` listed no subagent of D20.

## What landed

From base 87c0a7a81, 108 files (+4426 -1446, `git diff --cached --stat`): the task agent (the Focus line's `agent`, the Tasks card's Start Agent, the seed built on the server with its approval, the composer with a task), Claude or Codex in a new worktree, the armed Kill and every pressed bare button, the Terminal tab while its shell starts, Claude's scrollback kept (`CLAUDE_CODE_DISABLE_ALTERNATE_SCREEN=1`), the checked-out branch's pill menu, git commands that run hooks with no time limit and a Cancel for them, a failed git command saying why (G41), Cancel naming the merge, rebase or cherry-pick it left in progress (G44), and a transcript above the string limit read in pieces with a streamed export.

Fixes at landing:
- The eight findings of the run over round 1, as `agents/reviews/D20-refuter.md` "Closed" lists them, the diagnosis's fix among them (`endWith` in `server/core/git/running.ts`, `agents/reviews/D20-diagnosis.md`).
- A merge defect with D38: D20 moved `Segment.svelte` into `ui/controls/segment/` and D38's `views/feeds/literature/Head.svelte` imported the old path, so the page drew nothing and `check`, `build` and two check files failed (`Cannot find module '$lib/ui/controls/Segment.svelte'`). The import now names `$lib/ui/controls/segment/Segment.svelte`.

## Verification

In `.agents/worktrees/gate` at d67982033 with D20's landing patch applied (`git apply --3way --index`; only the six diagram files conflicted, taken from main and regenerated), after `npm run diagrams && npm run test:landing`:

```
ok      ASCII gate (5.2 s)
ok      npm run format:check (31.5 s): All matched files use Prettier code style!
ok      npm run lint (47.7 s)
ok      npm run check, then npm run build (199.2 s)
FAILED  npm run test:checks (226.1 s)
FAILED  npm test (240.7 s)
ok      npm run test:slow (255.5 s): Duration  243.81s
```

`test:checks` failed on the diagrams test's 60 s timeout and `npm test` on two Lit Watch tests' 5 s timeouts, each while the other commands ran. Rerun alone: `npm test` exit 0 (`Test Files 87 passed | 16 skipped (103)`, `Tests 345 passed | 62 skipped (407)`); `npm run test:checks` exit 0 (`Test Files 15 passed | 1 skipped (16)`, `Tests 226 passed | 3 skipped (229)`). Main's 108 staged files are byte-equal to the gate's (`cmp`), and the two path sets are equal (`comm -3`).

## The look

On TEST (`localhost:8790`, page 9b8276a4): the Focus view's subtask line "EEG-sAAD: Register" draws `agent` on hover; pressing it opens a Terminal tab with the composer seeded "Task: Register", "Part of: Cross-Dataset Selective Auditory Attention Decoding (ICASSP 2027 Grand Challenge)", "Deadline: 2026-09-20" and "Written in projects/active/eeg-saad-challenge/project.yml; read that file for its context.", in `eeg-saad-challenge` (case 2); the placeholder reads "Anything to add to the task" (case 11); Permissions shows "Manual permissions" (case 19); the agent list offers Claude and Codex only (case 54). Nothing was started. The look is complete under Z551.

## Agents

Builder a65b04c696467576e (claude-sonnet-5-5): first run handed back case 62, 298,835 tokens, 76 tool uses, 14.2 min; after the cases ruling 257,839 tokens, 501 tool uses, 93.3 min; round 1 261,365 tokens, 168 tool uses, 43.3 min. Brief check aba2fdc1ad025072b (claude-opus-5-5): 317,222 tokens, 96 tool uses, 15.5 min; its closing a8fd060ce54f0ef7c: 293,050 tokens, 87 tool uses, 19.5 min. Reviewer a4074e57a1552c160 (claude-opus-5-5): 167,719 tokens, 110 tool uses, 22.1 min; over round 1 a1d2b19ab1091cd56: 307,540 tokens, 99 tool uses, 20.1 min. Diagnosis a5f48ddcdb6f0ab3f (claude-opus-5-5): 227,892 tokens, 76 tool uses, 27.8 min. The first report did not pass its bar. Fixes at landing: nine.
