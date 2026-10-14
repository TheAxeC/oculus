# D77, the builder's prompt

The orchestrator passes the text under "Prompt" to the builder word for word: the Agent tool, `subagent_type: ordo-high`, `model: opus`, `run_in_background: true`, description "Builder of step D77". Right after the launch it reads the served model from the agent's transcript (`claude-opus-5-5` is the only one accepted), writes the agent id into the D77 dispatch entry's `session_id`, and makes the launch commit.

## Prompt

You are the builder of step D77 of the oculus migration plan: the Sessions view and the title bar (the Transcript flicker ended, the commit message's session and account, a New worktree choice in the composer, Pin offering every hub's projects, an agent's own transcript, a title bar strip as VS Code's, and the Session details' text size).

Where you work: only in `/Users/axelfaes/workspace/research-hub/.agents/worktrees/D77`. You never run a git command of any kind. You never write in the main checkout (`/Users/axelfaes/workspace/research-hub` outside `.agents/worktrees/D77`), never in the base copy `.agents/worktrees/D77-base`, never in the `gate` worktree, and never in any user data: no file under `projects/`, the hub's `.oculus/`, `registries/`, `feeds/`, `~/.oculus`, `~/.claude`, `~/.claude-backup`, `~/.claude-work` or a `secrets` folder is written, and no `local.yml` is ever read, printed, grepped or hashed (`':!config/local.yml'` or `--exclude=local.yml` on every grep over `config/`). In the worktree's copy of the ledger (`tools/oculus/.scratch/migration/`) you write only your report, `agents/reviews/D77-report.md`. You never start the app, Electron, a dev server or a browser, and never touch ports 8787 or 8790. Scratch fixtures (a scratch hub, a scratch workspace, a scratch git repository, the diagnosis's harness, a stub `claude` program) live under `$TMPDIR`. A stub program is the only `claude` you run; the real `claude` is never started.

Read, in this order, before changing anything:
1. `tools/oculus/.scratch/migration/agents/spec.md`, the rules every step runs under.
2. The brief, `tools/oculus/.scratch/migration/agents/briefs/D77.md`, whole: "Where you work, and the base", "What is on the tree", every part of "What to build" with its folders paragraph, every case of "Cases", "Paths this step writes", the decisions, "Libraries checked", "Read", "Conventions", "Verify before you report" and the report shape. Its line numbers are those of the base, which this worktree holds.
3. `tools/oculus/.scratch/migration/agents/reviews/D77-brief-check.md`, the check of the brief and its "Closed" heading.
4. `tools/oculus/.scratch/migration/agents/reviews/D77-diagnosis.md`, the cause of part 1 and the harness you run as case 1.

The worktree is at the base, the preparation commit on main after D73 landed. `npm ci` and `npx svelte-kit sync` have run in `tools/oculus`. The brief adds no dependency.

What you deliver:
- Your first task, before any change: the first run of every case on the unchanged tree, a run or a reading as the case says, each result noted. A case the brief's rules get wrong stops you there, before any code changes: hand back the first run and that case, with the rule and the result it gives.
- Every part of "What to build" done as the brief says, all eight, and every case with its result. A case marked "the look" is checked by reading and by the unit-level runs that reach it, and its row names the look on landing.
- A test only where it is a row of a guarded entry the brief names (G13 for case 7, G84 for case 17), run on the unchanged tree first (copied into a scratch folder under `$TMPDIR` built from the base copy, never by breaking code to watch it fail) and again after the change, both runs quoted. The diagnosis's harness is run in a scratch copy and never added to the worktree.
- No path outside "Paths this step writes"; a file the change needs outside it is named in the report with its reason.
- A shortcut, a deferral, a narrower reading of a part, a loosened check or a test fitted to its result is a finding against you; work inside the brief is never handed back as a later item.

Tests while you work (`agents/spec.md:25`): run only the test files that cover what you change (`npx vitest run tests/<file> ...`, several in one call), never the whole suite. After your last change run `npm run diagrams` and `npm run docs:palette`, then `npm run test:quick` once, plus one rerun only after a red line in a file you changed (fix it, rerun that file alone, then the list once more), and the other checks "Verify before you report" names, each once, from `tools/oculus` in the worktree with `PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH`. Report the number of `test:quick` runs and every whole-suite command; a run beyond this rule is a finding of the review. Then the ASCII gate in the rules file's perl form over every file you touched, which must print nothing.

The report: write it at `tools/oculus/.scratch/migration/agents/reviews/D77-report.md` in the worktree, in the shape the brief's "Report" gives, in ASCII. Your final message is the report itself.
