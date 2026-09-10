# Orchestrator state (read this first after any context compaction)

The orchestrator's own catch-up note for the cockpit-to-oculus migration. Rewritten at every package. Everything here is also derivable from `plan.md`, `tools/oculus/DESIGN.md`, the hub `CLAUDE.md` and `git log`, but slower. Read this, then `plan.md`, then the tail of the transcript.

## The standing demands (from Axel, in force)

- The hub `CLAUDE.md` "Working rules" section, in full. The ones that bite here: reports open with what is NOT done and carry a DONE / NOT DONE ledger naming the proving command; every measurement names its command or says not verified; a risk named is a task owned; no question boxes; surface rule clashes and stop; show code, not prose about code; references are not justifications (the cockpit never justifies an oculus choice); every change rewinds.
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
- The hub data the migration reads: `projects/**/project.yml` (91 manifests on 2026-09-10: 50 in the flat tiers ideas 31, active 4, manuscripts 15; 16 under `coauthor/<category>/`; 25 under `archive/<category>/`; counted with `find projects -name project.yml`), `registries/*.yml`, the collections named in `tools/cockpit/data/config/layout.yml`, and the feeds in hub-root `feeds/` since C12. Never written by an agent.
- Claude Code's own stores, read-only: transcripts `~/.claude/projects/<slug>/<id>.jsonl`; the live registry `~/.claude/sessions/<pid>.json`. No signal to any registry pid other than the liveness probe.
- tmux 3.7c is installed (`/opt/homebrew/bin/tmux`). The hub's `.claude/settings.local.json` allows `git add`, `commit`, `checkout`, `stash`, `branch`, `cherry-pick`, `worktree` and `reset --soft` without a prompt.

## Current position (rewrite at every package)

- 2026-09-10. C1 to C13, R1 and O0 are done and committed: fc6d299 (C12 and C13, one commit because H1 and H2 both touched eight of the same files) and f8af492 (R1 and O0). Working tree clean after both.
- Verified before fc6d299: `python3 build.py --selftest` PASS, `python3 build.py --dummy` builds, `bash tests/run.sh` PASS (5 + 29 + 24 + 19 Python tests, 11 JS modules). `grep -rn os.environ tools/cockpit/src tools/cockpit/build.py` finds only the `ANTHROPIC_API_KEY` read. The 8787 server answers 200 with zero `COCKPIT_` variables in its environment.
- S1 landed 2026-09-10, commit 7c0ab4f (worktree `s1`, wip ec22009, cherry-pick onto main); the skill's file-tool rule was removed afterwards by Axel's instruction (5aaa29e, 72dd725). The skill is visible to the harness as `plan-orchestration`.
- O1 landed 2026-09-10 from worktree `o1` (wip 7231940, cherry-pick onto main); the commit follows this rewrite, then the worktree and branch are removed. Verified on main after `npm ci` (104 packages from the committed lockfile): `npm test` 3 files 10 tests, `npm run check` 0 errors 0 warnings, `npm run build` done, `node src/server.ts` served `<title>oculus</title>` on 8790 and was stopped, 8787's holder pid 88197 unchanged, ASCII clean. Toolchain facts for every later package: node and npm at `/Users/axelfaes/.nvm/versions/node/v23.11.0/bin`; `npm ci` on a fresh checkout; `node src/server.ts` after `npm run build` is the production entry; a `.ts` file runs under plain `node` (type stripping, with an ExperimentalWarning); `vite-node` does not exist under Vitest 4; `svelte-check` needs `@types/node`.
- Sharp edges from O1, unresolved and for Axel to weigh: npm 10.9.2 crashes on Vitest 4.1's peer graph (`edgesOut`), so the lockfile was generated once with `--legacy-peer-deps` (recorded in `tools/oculus/README.md`); Node 23.11.0 is outside the declared engines of Vite 8 and Vitest 4 (`^20 || ^22 || >=24`), so `.npmrc` carries `engine-strict=false` and every install prints EBADENGINE warnings. Moving to Node 24 (LTS) through nvm would remove both; that is his machine and his call.
- Usage table: S1, one Opus agent, 100522 tokens, 20 tool uses, 289 s. O1, one Opus agent, 152310 tokens, 74 tool uses, 990 s.
- Next package: O2 (data sources, manifests and registries), brief written and its premises checked on the tree (91 manifests, registry shapes, no `vite-node`, relative `.ts` imports under plain `node`).
- O1 brief written (`agents/briefs/O1.md`, not yet committed) while S1 runs. O1 bakes three user-visible decisions, put to Axel before dispatch and recorded in `DESIGN.md`: `local.yml` keys `hub` and `port` with default port 8790; verification commands `npm test`, `npm run check`, `npm run build`; the text catalog reaching the browser as page data.
- The three O1 decisions were agreed by Axel on 2026-09-10; decision 3 reworded: page data at load, socket push afterwards from O6, the server reads the catalog per request until then.
- O16's hooks are on disk since 2026-09-10 in the hub's `.claude/settings.local.json` (project scope, port 8790, `-m 1`, `|| true`, timeout 5; verified by parsing all four settings files). Open on Axel's side: whether to move the block to `~/.claude/settings.json` so sessions in other repositories report hook state too.

## Journal

No night log is running. Nothing has been left for Axel to read here.
