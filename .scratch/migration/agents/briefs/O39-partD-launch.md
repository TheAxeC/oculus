# O39 part D, the builder's prompt

The orchestrator passes the text under "Prompt" to the builder word for word: the Agent tool, `subagent_type: ordo-high`, `model: opus`, `run_in_background: true`, description "Builder of step O39 part D". Right after the launch it reads the served model from the agent's transcript (`claude-opus-5-5` is the only one accepted), writes the agent id into the dispatch entry's `session_id`, and commits the entry.

## Prompt

You are the builder of part D of step O39 of the oculus migration plan: the oculus repository's `README.md` rewritten for a first reader, its reference paragraphs moved to a new page `docs/reference.md`, and `HELP.md` and `DESIGN.md` moved into `docs/` with every reference updated (rulings 193 and 194).

Where you work: only in `/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O39`. You never run a git command of any kind, read-only ones included. You never write in the main checkout (`/Users/axelfaes/workspace/oculus` outside `.agents/worktrees/migration-O39`), never in the hub (`~/workspace/research-hub`), never in `~/.oculus`, `~/.claude` or any other user data, and never in the ledger files other than your report. You never open, print or grep a `local.yml` that holds secrets (`config/local.yml`, `.oculus/local.yml`); `config/options/local.yml` is a catalog and may be read. You start no server, no app and no browser, and you never use the ports 8787 or 8790. You start no agent and invoke no skill.

No script is written for this step: no one-off in Perl, Python, Node or shell that edits files or computes a figure, in the tree or under `$TMPDIR`. Move and edit files with your editing tools, file by file (a new file written whole and the old one deleted is a move). No deliberate breaking of code to watch a test fail, in any form.

Read, in this order, before changing anything:
1. `.scratch/migration/agents/spec.md`, the rules every step runs under.
2. The brief, `.scratch/migration/agents/briefs/O39-partD.md`, whole. Its line numbers are those of the base.
3. `.scratch/migration/agents/reviews/O39-partD-brief-check.md` with its "Closed" heading. Where it differs from the brief, the brief holds.
4. `.scratch/migration/agents/guarded.md`, entries G2 and G74 and the test rule.

The worktree is at the base, the preparation commit 65dbd0b3, with `node_modules` in place and `svelte-kit sync` run.

What you deliver:
- Your first task, before any change: the first run of every case on the unchanged tree, a run or a reading as the case says, each result noted. A case the brief's rules get wrong stops you there, before any change: hand back the first run and that case, with the rule and the result it gives.
- Every item of "What to build", every case with its result.
- A test only where a case says "a test", run on the unchanged tree first and again after the change, both runs quoted.
- No path outside "Paths this step writes"; a file the change needs outside it is named in the report with its reason.
- A shortcut, a deferral, a narrower reading of an item, a loosened check, a sentence of the old README dropped, or a test fitted to its result is a finding against you; work inside the brief is never handed back as a later item.

Tests while you work: run only the test files that cover what you change (`npx vitest run tests/<file> ...`, several in one call), never the whole suite. After your last change run `npm run format`, then `npm run diagrams && npm run test:quick` once, plus one rerun only after a red line in a file you changed (fix it, rerun that file alone, then the list once more).

The report: write it at `.scratch/migration/agents/reviews/O39-partD-report.md` in the worktree, in the shape the brief's "Report" gives, in ASCII. Your final message is the report itself.
