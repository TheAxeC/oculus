# O44, the builder's prompt

The orchestrator passes the text under "Prompt" to the builder word for word: the Agent tool, `subagent_type: ordo-high`, `model: opus`, `run_in_background: true`, description "Builder of step O44". Right after the launch it reads the served model from the agent's transcript (`claude-opus-5-5` is the only one accepted), writes the agent id into the O44 dispatch entry's `session_id`, and makes the launch commit.

## Prompt

You are the builder of step O44 of the oculus migration plan: the header toolbar that flips between two layouts on a wide pane (Part 1), every text over a wallpaper on one surface with no second translucent layer, across all 66 views (Part 2), and the Focus board's row sizes (Part 3).

Where you work: only in `/Users/axelfaes/workspace/research-hub/.agents/worktrees/migration-O44`. You never run a git command of any kind, read-only ones included; a scratch repository a test builds under `$TMPDIR` through the tree's own helpers is the test's. Files move with plain `mv` and are deleted with `rm` (the landing records both). You never write in the main checkout (`/Users/axelfaes/workspace/research-hub` outside `.agents/worktrees/migration-O44`), never in the base copy `.agents/worktrees/O44-base`, never in the other step's worktree (`.agents/worktrees/migration-O45`, step O45 runs beside you), and never outside the worktree in any user data: `~/.oculus`, `~/.claude`, `~/.claude-work`, `~/data`, `~/.netrc`, `~/.kaggle` and any `secrets` folder are neither read nor written. No `local.yml` is ever read, printed, grepped or hashed (`--exclude=local.yml` on every grep). Inside the worktree you write only the paths the brief's "Paths this step writes" lists. In the worktree's copy of the ledger (`tools/oculus/.scratch/migration/`) you write only your report, `agents/reviews/O44-report.md`. You never start the app, Electron, a dev server or a browser, never touch ports 8787 or 8790, never connect to the cluster (`ssh`, `rsync`, `scp`, `sbatch`), and never call a live web API. Scratch fixtures live under `$TMPDIR`.

Diagnosis is banned: you never run `/diagnose`, never start a diagnosis agent or any other agent, and never ask for, offer or suggest one. You never break code on purpose to see a test fail, in the tree or in a copy.

No script is written for this step other than the code the brief builds: no one-off in Perl, Python, Node or shell that edits files. Edit files with your editing tools. A figure the report gives comes from a command the brief names (its Python scan of `<Pane ...>` openings is one), or from `grep`, `wc`, `ls`, `diff` and the like run as plain commands.

Read, in this order, before changing anything:
1. `tools/oculus/.scratch/migration/agents/spec.md`, the rules every step runs under.
2. The brief, `tools/oculus/.scratch/migration/agents/briefs/O44.md`, whole: "What is on the tree", the three parts of "What to build", every case, "Paths this step writes", the decisions, "Verify before you report" and the report shape. Its line numbers are those of the base, which this worktree holds.
3. `tools/oculus/.scratch/migration/agents/reviews/O44-brief-check.md` whole with its "Closed" heading. Where it differs from the brief, the brief holds.
4. `tools/oculus/src/lib/themes/tokens.css` lines 200-260 and `tools/oculus/DESIGN.md` lines 240-260, the wallpaper surface rule.

The worktree is at the base, the preparation commit 8ebf9f093. `npm ci` and `svelte-kit sync` have run in `tools/oculus`. The base copy is `.agents/worktrees/O44-base/tools/oculus` (`src`, `tests`, `utils`, `config` without `local.yml`, `package.json` and `tsconfig.json` at the base; its `node_modules` links to the worktree's), and the base's output of `sh utils/unused-exports.sh` is `.agents/worktrees/O44-base/unused-exports.txt`. The step adds no dependency.

What you deliver:
- Your first task, before any change: the first run of every case on the unchanged tree, a run or a reading as the case says, each result noted. A case the brief's rules get wrong stops you there, before any code changes: hand back the first run and that case, with the rule and the result it gives.
- Every part of the brief, every case with its result. A case the brief gives to the look on landing is named in your report as the look's, with what the code shows for it.
- No test: no case of this step falls under an entry of `agents/guarded.md`. Each case is a run or a reading the report quotes, or the look's on landing.
- No path outside "Paths this step writes"; a file the change needs outside it is named in the report with its reason.
- A shortcut, a deferral, a narrower reading of a part, a loosened check or a test fitted to its result is a finding against you; work inside the brief is never handed back as a later item.

Tests while you work (`agents/spec.md`): run only the test files that cover what you change (`npx vitest run tests/<file> ...`, several in one call), never the whole suite. After your last change run `npm run diagrams && npm run test:quick` once, plus one rerun only after a red line in a file you changed (fix it, rerun that file alone, then the list once more), and the other checks "Verify before you report" names, each once, from `tools/oculus` in the worktree with `PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH`. Report the number of `test:quick` runs and every whole-suite command. Then the ASCII check in the brief's form over every file you changed.

The report: write it at `tools/oculus/.scratch/migration/agents/reviews/O44-report.md` in the worktree, in the shape the brief's "Report" gives, in ASCII. Your final message is the report itself.
