# O46, the builder's prompt

The orchestrator passes the text under "Prompt" to the builder word for word: the Agent tool, `subagent_type: ordo-high`, `model: opus`, `run_in_background: true`, description "Builder of step O46". Right after the launch it reads the served model from the agent's transcript (`claude-opus-5-5` is the only one accepted), writes the agent id into the O46 dispatch entry's `session_id`, and makes the launch commit.

## Prompt

You are the builder of step O46 of the oculus migration plan: the settings oculus keeps per browser become options written to the open workspace file (or, for a key of the hub list, to the primary hub's `config.yml`), oculus's own config moves to `config/defaults/` and `config/options/` and is never written by Settings, the state oculus records (the page arrangement, each tab's view state, breakpoints and watches) moves from browser storage to files the server writes under the state folder, `bookmarks`, `schedules` and `apps_dir` move to the hub's `config.yml`, and every key the editor completes carries a description.

Where you work: only in `/Users/axelfaes/workspace/research-hub/.agents/worktrees/migration-O46`. You never run a git command of any kind, read-only ones included, except `git status --short docs/diagrams` from the worktree as the brief's Verify 8 says; a scratch repository a test builds under `$TMPDIR` through the tree's own helpers is the test's. Files move with plain `mv` and are deleted with `rm` (the landing records both). You never write in the main checkout (`/Users/axelfaes/workspace/research-hub` outside `.agents/worktrees/migration-O46`), never in the base copy `.agents/worktrees/O46-base`, never in another step's worktree (`.agents/worktrees/migration-O44`, step O44 is under review beside you), and never outside the worktree in any user data: `~/.oculus`, `~/.claude`, `~/.claude-work`, `~/data`, `~/.netrc`, `~/.kaggle`, any browser profile and any `secrets` folder are neither read nor written; every test of a state file runs on a folder under `$TMPDIR`. No `local.yml` is ever read, printed, grepped or hashed (`--exclude=local.yml` on every grep). Inside the worktree you write only the paths the brief's "Paths this step writes" lists. In the worktree's copy of the ledger (`tools/oculus/.scratch/migration/`) you write only your report, `agents/reviews/O46-report.md`. You never start the app, Electron, a dev server or a browser, never touch ports 8787 or 8790, never connect to the cluster (`ssh`, `rsync`, `scp`, `sbatch`), and never call a live web API. Scratch fixtures live under `$TMPDIR`.

Diagnosis is banned: you never run `/diagnose`, never start a diagnosis agent or any other agent, and never ask for, offer or suggest one. You never break code on purpose to see a test fail, in the tree or in a copy.

No script is written for this step other than the code the brief builds: no one-off in Perl, Python, Node or shell that edits files. Edit files with your editing tools. The node probes the brief names are commands run from a scratch folder under `$TMPDIR` and quoted, never files of the repository. A figure the report gives comes from a command the brief names, or from `grep`, `wc`, `ls`, `diff` and the like run as plain commands.

Read, in this order, before changing anything:
1. `tools/oculus/.scratch/migration/agents/spec.md`, the rules every step runs under.
2. The brief, `tools/oculus/.scratch/migration/agents/briefs/O46.md`, whole: "What is on the tree", the twelve items of "What to build", the decisions, every case, "Paths this step writes", "Verify before you report" and the report shape. Its line numbers are those of the base, which this worktree holds.
3. The ruling "Open item 180" and the self-rules Z952, Z954, Z955, Z956 and Z957 in `tools/oculus/.scratch/migration/plan.md`'s Rulings section.
4. `tools/oculus/.scratch/migration/agents/reviews/O46-brief-check.md` whole with its "Closed" heading. Where it differs from the brief, the brief holds.
5. `tools/oculus/.scratch/migration/agents/guarded.md` entries G8, G12, G13, G29, G31, G54, G61, G83, G96, G102, G109 and G116.

The worktree is at the base, the preparation commit a28047138. `npm ci` and `svelte-kit sync` have run in `tools/oculus`. The base copy is `.agents/worktrees/O46-base/tools/oculus` (`src`, `tests`, `utils`, `config` without `local.yml`, `package.json` and `tsconfig.json` at the base; its `node_modules` links to the worktree's), and the base's output of `sh utils/unused-exports.sh` is `.agents/worktrees/O46-base/unused-exports.txt`. The step adds no dependency.

What you deliver:
- Your first task, before any change: the first run of every case on the unchanged tree, a run or a reading as the case says, each result noted. A case the brief's rules get wrong stops you there, before any code changes: hand back the first run and that case, with the rule and the result it gives.
- Every item of the brief, every case with its result. This is one step: no part of it is left for later, split off or handed back as a gap.
- The tests the brief names under its guarded entries, each seen failing on the unchanged tree first where it checks a behaviour the step adds or changes, and each test title you add or rename listed with its entry in the report (the orchestrator writes `agents/guarded.md` at the landing).
- The three `help:` lines of the bookmarks scaffold in the report, for the orchestrator to put into `.oculus/bookmarks.yml` at the landing.
- No path outside "Paths this step writes"; a file the change needs outside it is named in the report with its reason.
- No code that reads an older form of stored data: nothing reads the old browser keys, not even to move them.
- A shortcut, a deferral, a narrower reading of an item, a loosened check or a test fitted to its result is a finding against you; work inside the brief is never handed back as a later item.

Tests while you work (`agents/spec.md`): run only the test files that cover what you change (`npx vitest run tests/<file> ...`, several in one call), never the whole suite. After your last change run `npm run diagrams && npm run test:quick` once, plus one rerun only after a red line in a file you changed (fix it, rerun that file alone, then the list once more), and the other checks "Verify before you report" names, each once, from `tools/oculus` in the worktree with `PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH`. Report the number of `test:quick` runs and every whole-suite command. Then the ASCII check in the brief's form over every file you changed.

The report: write it at `tools/oculus/.scratch/migration/agents/reviews/O46-report.md` in the worktree, in the shape the brief's "Report" gives, in ASCII. Your final message is the report itself.
