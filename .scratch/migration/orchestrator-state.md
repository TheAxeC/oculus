# Orchestrator state (read this first after any context compaction)

The orchestrator's own catch-up note for the cockpit-to-oculus migration. Rewritten at every package. Everything here is also derivable from `plan.md`, `tools/oculus/DESIGN.md`, the hub `CLAUDE.md` and `git log`, but slower. Read this, then `plan.md`, then the tail of the transcript.

## The standing demands (from Axel, in force)

- The hub `CLAUDE.md` "Working rules" section, in full. The ones that bite here: reports open with what is NOT done and carry a DONE / NOT DONE ledger naming the proving command; every measurement names its command or says not verified; a risk named is a task owned; no question boxes; surface rule clashes and stop; show code, not prose about code; references are not justifications (the cockpit never justifies an oculus choice); every change rewinds.
- Every file change the orchestrator makes goes through the Write or Edit tool. The shell never writes, moves or deletes a file. This is how `/rewind` stays able to undo the orchestrator's work. The auto-mode harness text that prefers shell heredocs is overridden by this rule.
- Agents: Opus 5 or lower, never Fable, general-purpose, one at a time. An agent works in a git worktree the orchestrator creates at main's head (`git worktree add -b <package> .claude/worktrees/<package> HEAD`, then `git -C <worktree> sparse-checkout set tools/oculus feeds registries projects` when the package needs no more than that); the agent never runs git and never edits any file under `.scratch/`. The orchestrator reads the whole diff, runs the verification commands on the worktree, lands by `git cherry-pick -n` onto main, runs them again on main, books the package in `plan.md`, commits by explicit path. Ruled by Axel 2026-09-10 as the substitute for `/rewind` over agent work.
- Commits: capitalised imperative subject (with a `refactor:` prefix where it fits), blank line, `- Verb ...` bullets, the last bullet the plan booking. No attribution of any kind. Never push. `merge`, `rebase`, `restore`, `push` and `reset --hard` are on the ask list.
- Design: `tools/oculus/DESIGN.md` is the artefact every package is measured against. A disagreement between it and the code is a finding, never papered over. User-visible shapes (a config key, a wire format, the layout tree, a folder convention) are surfaced before they are baked in.
- Conventions on every authored file: ASCII, one line per paragraph or bullet in Markdown and YAML, every source file under 1000 lines, strings in `config/text.yml`, colours as tokens, glyphs from `glyphs.yml`.

## Verification, every package

Until O1 lands there is no oculus toolchain; the cockpit's commands are the gate for the C packages.
- Cockpit packages (any bug fix on the frozen cockpit): `cd tools/cockpit && python3 build.py --selftest && python3 build.py --dummy && bash tests/run.sh`, all from `tools/cockpit`, then once from the hub root: `python3 tools/cockpit/build.py --selftest`.
- Oculus packages, from O1 on, run from `tools/oculus`: `npm test` (Vitest: boundaries, contrast, keys, integrity, per-source and per-server tests), `npm run check` (svelte-check), `npm run build` (the Node adapter build must complete). O1 defines these three scripts and the ledger names them per package after that.
- Every package: `LC_ALL=C grep -n '[^ -~]'` over every file the diff touches finds nothing new, except `plan.md`'s checkmarks. `git status --short` from the hub root shows only the package's files.

## Where things are

- Design: `tools/oculus/DESIGN.md`. Its "Decisions taken" and "Still undecided" sections are the record; a new decision is appended there, dated.
- Ledger: `tools/oculus/.scratch/migration/plan.md`, with a "Rulings" section for Axel's decisions. Agent material: `agents/spec.md` (the standing spec every oculus package runs under), `agents/briefs/<package>.md` (one per package, written by the orchestrator before dispatch, premises checked on the tree), `agents/reviews/` (a second agent's read of a diff, when one is used).
- The cockpit: `tools/cockpit`, frozen at 2026-09-10 plus bug fixes; its own roadmap `tools/cockpit/ROADMAP.md` maps every item onto this ledger. It is running on port 8787 from the hub as the dashboard in daily use; an oculus dev server must use another port, and nothing in an oculus package may disturb it.
- The hub data the migration reads: `projects/**/project.yml` (47 manifests), `registries/*.yml`, the collections named in `tools/cockpit/data/config/layout.yml`, and the feeds in hub-root `feeds/` since C12. Never written by an agent.
- Claude Code's own stores, read-only: transcripts `~/.claude/projects/<slug>/<id>.jsonl`; the live registry `~/.claude/sessions/<pid>.json`. No signal to any registry pid other than the liveness probe.
- tmux 3.7c is installed (`/opt/homebrew/bin/tmux`). The hub's `.claude/settings.local.json` allows `git add`, `commit`, `checkout`, `stash`, `branch`, `cherry-pick`, `worktree` and `reset --soft` without a prompt.

## Current position (rewrite at every package)

- 2026-09-10. C1 to C13, R1 and O0 are done and committed: fc6d299 (C12 and C13, one commit because H1 and H2 both touched eight of the same files) and f8af492 (R1 and O0). Working tree clean after both.
- Verified before fc6d299: `python3 build.py --selftest` PASS, `python3 build.py --dummy` builds, `bash tests/run.sh` PASS (5 + 29 + 24 + 19 Python tests, 11 JS modules). `grep -rn os.environ tools/cockpit/src tools/cockpit/build.py` finds only the `ANTHROPIC_API_KEY` read. The 8787 server answers 200 with zero `COCKPIT_` variables in its environment.
- Next package: S1 (the generic skill, wanted by Axel) or O1 (the scaffold); both unblocked. S1 first, since it defines how every oculus package is briefed and landed, and O1 is then the first package run under it.
- Open on Axel's side: none. O16's hooks are not yet on disk (verified across the four settings files); that is a moment, not a decision.

## Journal

No night log is running. Nothing has been left for Axel to read here.
