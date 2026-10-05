# D42 landing: a file's history

Plan oculus/migration, step D42 landed on main; next: the /spec of D45 (LaTeX as VS Code's LaTeX Workshop) and X3e (Files lists reordered by drag), which waited for D42.

## Open items

- None.

## Agents stopped before the landing

`ListAgents` before the commit listed no agent of D42; the two running were the X3f round-2 brief and the Q119 closing for S5.

## Not done

Nothing of D42.

## What landed

From base 81c779ac2, 40 files, +1150 -318: the Timeline section of the Files view, following the file tab shown last on the page; Open Timeline in the Files row menu and the file tab menu; `git log --follow` paged by one ordering read from HEAD (Z474); each row opening the diff of the file at that commit against its parent; the commit's short hash (git's `%h`) in the diff tab's label and its failure line.

## Fixes at landing

1. Refuter round 1, finding 1: `commitDiff`'s listed `show` read without `--relative`, so from a served root below the repository's top a rename row opened as a file created. `--relative` added in `src/lib/server/core/git/reads.ts`; proved on a scratch repository with a sub-folder root, the row opening old to new.
2. Finding 2: a commit diff opened from the graph carried no short hash, so its failure showed git's text. `Graph.svelte` passes the commit's `short` to `CommitFiles.svelte`, which puts it in the subject and the label.
3. Finding 3: `run.ts`'s form list named a form the code does not run. It now lists the forms run.
4. The landing gate's comment-width line: two comment lines of `run.ts` over 100 columns, rewrapped.

## Gate

Run in the gate worktree `.agents/worktrees/gate` (Z492), not in main's checkout: `npm run diagrams && npm run test:landing` printed `test:landing: 182.3 s; every command passed`. `cmp` of the gate's `git diff HEAD -- tools/oculus` and main's printed nothing.

## Look on TEST

Ten files of different types, each opened with Open Timeline from the Files row menu, each Timeline equal to `git log --follow` in count and subjects:

| File | Type | Commits |
|---|---|---|
| `applications/applications.yml` | YAML | 15 |
| `docs/DATA-MAP.md` | Markdown in the Doc view | 1 |
| `applications/postdoc_applications_with_details.xlsx` | binary | 1 |
| `funding/2026-nwo-enw-xs/proposal-ls/main.tex` | LaTeX | 7 |
| `funding/2026-nwo-enw-xs/proposal-ls/main.pdf` | PDF | 7 |
| `skills-lock.json` | JSON | 2 |
| `AGENTS.md` | a symlink to `CLAUDE.md` | 1 |
| `tools/oculus/config/catalogs/options.yml` | the engine root | 18 |
| `src/lib/ui/controls/editor/bars/LineBars.svelte` | Svelte, renamed | 3 |
| `src/lib/ui/controls/editor/bars/zones.ts` | TypeScript, renamed | 4 |

- `fa95b7540` on `applications.yml` opened its diff at `@@ -35,7`, line 38 removed and added, as `git show`.
- The oldest row of `zones.ts`, `f6403f406`, opened as the file added, as `git show -M --name-status` reports (`A`).
- HELP.md drew 50 rows, 100 after Load more and 117 after a second, its last two the oldest two of `git log --follow`.
- A later page's full walk on HELP.md, timed three times from `tools/oculus`: 0.38 s, 0.39 s, 0.38 s, against the 5 s timeout.
- Cases 20 and 47: closing the followed tab falls back to the file tab the pane showed before, the round's ruling and VS Code's behaviour.
- The shown ages floor the elapsed time (21 days less some hours shows "2 weeks ago" where `git log` rounds to "3 weeks ago").
- `~/.oculus/changes.jsonl` held 40 lines before and after: the look wrote nothing.

## Agents

| Agent | Role | Model | Tokens | Tool uses | Time |
|---|---|---|---|---|---|
| a1b7636f1c4ff68ca | builder | claude-sonnet-5-5 | 232,542 + 335,813 (round 1) | 163 + 148 | 30.3 + 21.7 min |
| a5f84259f8e93e657 | brief check | claude-opus-5-5 | 207,414 | 81 | 10.3 min |
| a6b4415611d2a417e | reviewer | claude-opus-5-5 | 258,282 | 81 | 13.0 min |
| a98bacc4b6be077d1 | reviewer over round 1 | claude-opus-5-5 | 242,696 | 51 | 9.3 min |

The first review raised Spec 2, Proof 0, Standards 4, Behaviour 2; the review over round 1 raised four findings, closed at landing. The builder's first report did not pass its bar; full-list runs: 3, then 2 in round 1. Fixes at landing: 4.

## What is next

The /spec of D45 and X3e, which waited for D42, and D20, filling the free slots; X3f's repair round 2 and S5's repair round 1 when their briefs are in.
