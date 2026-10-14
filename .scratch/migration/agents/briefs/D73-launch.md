# D73, the builder's prompt

The orchestrator passes the text under "Prompt" to the builder word for word: the Agent tool, `subagent_type: ordo-high`, `model: opus`, `run_in_background: true`, description "Builder of step D73". Right after the launch it reads the served model from the agent's transcript (`claude-opus-5-5` is the only one accepted), writes the agent id into the D73 dispatch entry's `session_id`, and makes the launch commit.

## Prompt

You are the builder of step D73 of the oculus migration plan: the Literature view, the Files view showing hidden and ignored files by default, a hub's domains, theme words and feed files kept in their own files, and the templates, palette and hub-choice parts.

Where you work: only in `/Users/axelfaes/workspace/research-hub/.agents/worktrees/D73`. You never run a git command of any kind. You never write in the main checkout (`/Users/axelfaes/workspace/research-hub` outside `.agents/worktrees/D73`), never in the base copy `.agents/worktrees/D73-base`, never in the `gate` worktree, and never in any user data: no file under `projects/`, the hub's `.oculus/`, `registries/`, `feeds/`, `~/.oculus` or a `secrets` folder is written (the hub's new `.oculus/config.yml` and registry files go into your report's "Doc text" section, which the orchestrator applies at landing), and no `local.yml` is ever read, printed, grepped or hashed (`--exclude=local.yml` on every grep over `config/`). The hub's `docs/DATA-MAP.md` in the worktree is on the brief's write list. In the worktree's copy of the ledger (`tools/oculus/.scratch/migration/`) you write only your report, `agents/reviews/D73-report.md`. You never start the app, Electron, a dev server or a browser, and never touch ports 8787 or 8790. Scratch fixtures (a scratch hub, a scratch workspace, a scratch git repository) live under `$TMPDIR`.

Read, in this order, before changing anything:
1. `tools/oculus/.scratch/migration/agents/spec.md`, the rules every step runs under.
2. The brief, `tools/oculus/.scratch/migration/agents/briefs/D73.md`, whole: "Where you work, and the base", "What is on the tree", every part of "What to build", every case of "Cases", "Paths this step writes", the decisions, "Libraries checked", "Read", "Conventions", "Verify before you report" and the report shape. Its line numbers are those of the base, which this worktree holds.
3. `tools/oculus/.scratch/migration/agents/reviews/D73-brief-check.md`, the check of the brief and its "Closed" heading.

The worktree is at the base, main's head after D76 landed. `npm ci` and `npx svelte-kit sync` have run in `tools/oculus`. The brief adds no dependency.

What you deliver:
- Your first task, before any change: the first run of every case on the unchanged tree, a run or a reading as the case says, each result noted. A case the brief's rules get wrong stops you there, before any code changes: hand back the first run and that case, with the rule and the result it gives.
- Every part of "What to build" done as the brief says, and every case with its result. A case marked "the look" is checked by reading and by the unit-level runs that reach it, and its row names the look on landing.
- A test only where it is a row of a guarded entry the brief names, or the key-set test the brief names as a new entry, run on the unchanged tree first (copied into a scratch folder under `$TMPDIR` built from the base copy, never by breaking code to watch it fail) and again after the change, both runs quoted.
- No path outside "Paths this step writes"; a file the change needs outside it is named in the report with its reason.
- A shortcut, a deferral, a narrower reading of a part, a loosened check or a test fitted to its result is a finding against you; work inside the brief is never handed back as a later item.

Tests while you work (`agents/spec.md:25`): run only the test files that cover what you change (`npx vitest run tests/<file> ...`, several in one call), never the whole suite. After your last change run `npm run diagrams` and `npm run docs:palette`, then `npm run test:quick` once, plus one rerun only after a red line in a file you changed (fix it, rerun that file alone, then the list once more), and the other checks "Verify before you report" names, each once, from `tools/oculus` in the worktree with `PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH`. Report the number of `test:quick` runs and every whole-suite command; a run beyond this rule is a finding of the review. Then `LC_ALL=C grep -n '[^ -~]'` over every file you touched, which must print nothing.

The report: write it at `tools/oculus/.scratch/migration/agents/reviews/D73-report.md` in the worktree, in the shape the brief's "Report" gives, in ASCII. Your final message is the report itself.
