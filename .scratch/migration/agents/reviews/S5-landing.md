# S5 landing

Position: roadmap entry oculus/migration (the cockpit-to-oculus migration); S5, the Settings view's controls and headings (with Q119 and Q122 folded in by Z468), landed; 293 lines of `plan.md` ticked (`grep -c "^- ✅" plan.md`). Next: X3f round 3 (building), then X3e, D45, D23, A3, D38, D11 and M6, which waited on S5.

## Open items (verbatim)

None booked in `orchestrator-state.md`.

## Not done

Look row 19 (`local.yml` `port: x`) was not run: a wrong port takes 8790, the port of Axel's own server, so it rests on S5's quoted cases 25 and 29. Look rows 5, 6, 7, 10, 11, 14, 15, 17, 20 and 21 were not run on the page; they rest on S5's quoted cases and the review's reruns. `bench: []`, so no A/B.

## The check of Steps 1

`ListAgents` listed two subagents running, abb2cc439fd4f1181 (X3f's builder) and a65b04c696467576e (D20's builder). None of S5's agents was listed.

## What landed

From base 6005baee6, 113 files (+9323 -3201, `git diff --cached --stat`): every option and field of a family takes the control its value needs; the Settings view's twelve subject headings; a wrong value in `behavior.yml` or `local.yml` takes its default with a finding instead of stopping the server (Q119); oculus's port default 8790; Q122's catalog checks.

Fixes at landing:
- The cherry-pick conflicted with main in three text files: `DESIGN.md` (S5's line on views drawn from one file kept, main's LaTeX line kept), `src/lib/server/machine/pty/routes.ts` (main's `refusal(...)` answers kept with S5's `loadLocal`, then prettier), `src/lib/state/sessions/latex.svelte.ts` (the head comment merged: S5's catalog-default sentence with main's terminal-ended rules). The diagram files were regenerated with `npm run diagrams`.
- Review round 1, Proof 1: `tests/data/sources/config/settings.test.ts` calendar rows reordered so the title's second `%s` takes `kind` (`npx vitest run tests/data/sources/config/settings.test.ts --reporter=verbose` now prints "answers the default for a days_back with a whole problem").
- Review round 1, Standards 3: `src/lib/ui/controls/editor/options.ts` takes `wordWrap` and `renderWhitespace` from `Monaco.editor.IEditorOptions`.
- Kept and stated, review round 1, Behaviour 1: a `.tex` save before the page holds the options catalog builds nothing (`buildsOnSave` answers false while `latexAutoBuild` cannot read), since the page cannot yet tell `on_save` from `never`.
- Review round 1's report-level findings (the report's diagrams row count, two read-only `git` calls by the builder, the staged `fetch-period.ts` deletion, which is item 1.5's and has no remaining reference: `grep -rn fetch-period src tests` prints nothing) need no change to the code.

## Verification

In `.agents/worktrees/gate` after `npm run diagrams && npm run test:landing`:

```
ok      ASCII gate (9.4 s)
ok      npm run format:check (46.3 s): All matched files use Prettier code style!
ok      npm run lint (62.9 s)
ok      npm run check, then npm run build (214.9 s)
ok      npm run test:checks (225.9 s)
ok      npm test (228.3 s)
FAILED  npm run test:slow (244.9 s)
```

The two slow rows that failed (`tests/server/git/git-ops.test.ts` hook timed out in 10000 ms; `tests/routes/git/git.test.ts` "refuses each asking action unconfirmed" timed out in 20000 ms) ran while five agents ran. `npm run test:slow -- tests/server/git/git-ops.test.ts tests/routes/git/git.test.ts`: `Test Files 2 passed`, `Tests 17 passed | 3 skipped`. `npm run test:slow` alone: `Test Files 22 passed | 88 skipped`, `Tests 62 passed | 465 skipped`. The staged diff on main is `cmp`-equal to the gate's.

## The look (Z507)

A scratch oculus served from a copy of the gate's tree, its own `config/` with wrong values, a `local.yml` of `hub` (a scratch hub), `port: 8795` and `hpc_host: ''`, `HOME` and `TMUX_TMPDIR` under the scratchpad. Screenshots are refused on that origin by the browser extension, so the page was read through scripts.

- The server started with `slurm.poll_min: 0`, `slurm.days: 1.5`, `calendar: [1]`, `usage_refresh_min: x`, `editor.paint_limit_kb: 0`, `editor.tab_size: 9`, `latex.formatter: prettier` and `hpc_host: ''`. The Findings view listed each with its sentence, for example "slurm.poll_min must be a number from 1 to 35791; the default is used" and "calendar must be a map; each of its keys takes its default" (rows 1 to 4, 8, 16, 18).
- `poll_min: 20` written by hand: its finding gone, 43 to 42 findings (row 9).
- Settings, Cluster, `slurm.days` holding `1.5`: the box has a 1px red outline (`rgb(204, 32, 32)`, none on `slurm.poll_min`) and the title "It must be a whole number." (row 12).
- `2.5` typed and Enter: not written, `behavior.yml:77` still `days: 1.5` (row 13). `3` typed and Enter: written (`days: 3`), 41 findings.
- No "Not chosen" anywhere in the Settings view's text (row 20).

The scratch server was stopped (`lsof -iTCP:8795` lists nothing) and its tab closed.

## Agents

Builder a6db7168e2d955eea (claude-sonnet-5-5): 289,845 tokens, 407 tool uses, 82.1 min; round 1 136,854 tokens, 679 tool uses, 112.8 min. Brief check a3ca7570713047701 and its closing aa2ac51de06275004 (claude-opus-5-5): 273,684 tokens, 104 tool uses, 12.6 min for the check. Q119 brief check a5b40ed74302680f1: 280,042 tokens, 91 tool uses, 15.1 min; Q119 closing ad7f5c6d3c49f4f40: 298,145 tokens, 160 tool uses, 36.9 min. Reviewer ab608db77fb2265cd: 365,219 tokens, 97 tool uses, 22.0 min. Reviewer over round 1 a78d8970b3fff491c: 191,100 tokens, 114 tool uses, 20.1 min. The first report did not pass its bar; the review's findings went to round 1. Two fixes at landing beside the merge.
