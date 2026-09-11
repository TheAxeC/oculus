# Standing specification for every oculus package

Every agent dispatched on an oculus package runs under this file plus one brief in `briefs/`. The brief names the package, the files to read in full, the exact deliverable, and the verification commands with their expected output. Nothing in a brief overrides anything here.

## Read first, before changing anything

1. The brief for this package. It names the sections of `tools/oculus/DESIGN.md` the package is measured against; read those sections and not the whole file. Where the brief and the design disagree, stop and report the disagreement; do not pick a side.
2. The files the brief lists, and only those; where the brief gives a line range, read the range. Read them in one turn, not one per turn: every turn carries the whole context again, so the number of turns is what a package costs.
3. Do not read the hub's instruction file (`CLAUDE.md`, also reachable as `AGENTS.md`); the rules that bind you are the ones below.

## The working rules that bind every package (from the hub's CLAUDE.md, 2026-09-10)

- A report states the end state: what is NOT done first, then a DONE / NOT DONE ledger naming the command that proves each row. No narration of wrong turns taken and backed out. Never present partial work as complete; never state a measurement not taken.
- Every claim about behaviour, cost or timing names the command that produced it, or says "not verified".
- A test never asserts a known defect, and no threshold is loosened to make a check pass; a check that passes only after loosening is a finding to report.
- A risk you name is a task you own: fix it, or say plainly and prominently that it is unfixed. Pick a check by asking whether it would fail if the risk were real.
- No silent design decisions: a user-visible shape (a config key, a wire format, a vocabulary) the brief does not name is reported as a decision the orchestrator may reverse, not baked in quietly. Internal, reversible details are chosen freely and listed.
- Verify before asserting: read the source, cite `file:line`; never repeat another agent's summary as a fact.
- Prose: plain, ASCII, no em dashes, no quips; name the actual function, file and line.
- The cockpit is a cautionary reference, never a justification; every oculus choice is justified from `DESIGN.md`.

## Token discipline

- While working, run the one test file that covers what you are changing (`npx vitest run tests/<file>`), not the whole suite. Run `npm test` once at the end; use `npx vitest run --reporter=dot` for that, and the verbose reporter only for the lines the report quotes.
- Batch independent reads into one turn. Do not re-read a file you wrote; the harness holds it.
- Do not paste whole files into your reasoning or your report; quote the lines the report needs.

## Where you work

- In the git worktree the brief names, never in the main checkout. The worktree was created at main's head by the orchestrator. Every path in the brief is relative to that worktree.
- You never run a git command. Not `add`, not `commit`, not `stash`, not `checkout`, not `status`. The orchestrator reads your diff and lands it.
- You never edit anything under `tools/oculus/.scratch/`. The plan, the state file and the briefs are the orchestrator's.
- You never write under `feeds/`, `projects/`, `registries/`, `funding/` or any other hub data folder, and never a `project.yml`. Tests use synthetic fixtures in a temporary directory and assert the resolved path is inside it before any write. Two things read the real hub and nothing else: `tests/integrity.test.ts` and `tests/data/real-hub.probe.ts`, both read only; a finding either of them produces is reported, never repaired.
- You never start a server on port 8787, and never kill, signal or restart the process that holds it. The oculus dev server uses the port the brief names. You never send a signal to any pid found in `~/.claude/sessions/`.

## What every package obeys

- One source file under 1000 lines. A file approaching it is split by concern.
- Four-space indentation everywhere. Prettier is pinned in `.prettierrc`; run `npm run format` on what you wrote and `npm run format:check` before you report. Never hand-format to satisfy the check.
- ASCII only in every file you author. Glyphs come from `config/glyphs.yml`; every user-facing string from `config/text.yml` or `config/text-oculus.yml` through `t("group.key")`, in a component and in a state module alike; colours from `themes/tokens.css`. A literal string, a raw hex or a literal glyph anywhere a reader sees it is a defect. A catalog group lives in exactly one of the two files: a new key joins its group where that group already is, and a group is never declared in both.
- Every module and component you add opens with the head comment the tree's files open with: its layer ("Layer 2, server" and so on), what it is, and why it is shaped as it is. A file without one is a defect.
- Every control a reader presses is a `ui/` primitive (`ToolButton`, `Chip`, `Confirm`, `Table`, `Meter`, `Menu`, `Search`, the inputs), never a raw `<button>`, `<input>` or `<select>`; a table with plain cells is `ui/Table.svelte`, and only a table whose cell is a bar or a control is hand-drawn.
- Svelte markup is written one element per line, as every view in the tree is; a component compacted onto long lines is reformatted before you report.
- A value that has a config key (a host, a port, a cadence, a path) is read from the config through `loadConfig` or `loadLocal` and is never hardcoded beside it as a fallback; the default lives in the config file.
- The layer boundaries in `DESIGN.md`: `ui/` imports no state and no view; `shell/` imports no view by name; `views/` imports no shell and no other view; nothing client-side imports `lib/server/`. `tests/boundaries.test.ts` enforces them and must pass.
- One line per paragraph or bullet in any Markdown or YAML you edit. No hard wrapping.
- No dependency the brief did not name. `npm install` of something new is a report, not an action.
- A test never asserts a known defect. A threshold is never loosened to make a check pass; a check that only passes after loosening is a finding to report.
- The cockpit under `tools/cockpit` is a cautionary reference for what its code got wrong, never a justification. Port its facts (the transcript format, the registry, the grouping clamp, the four git commands), not its structure.

## Verify before you report

Run every command the brief lists, from `tools/oculus` in the worktree, and fix until each passes. At minimum: `npm test`, `npm run check`, `npm run build`, `npm run format:check`. Then `LC_ALL=C grep -n '[^ -~]'` over every file you touched, which must print nothing.

## Report

First line: anything NOT done, or "Everything in the brief is done". Then a DONE / NOT DONE table, one row per deliverable in the brief, each naming the command that proves it and its output. Then: files changed with line counts; every judgment call the brief did not cover, as a decision the orchestrator may reverse; anything in the brief or the design that turned out wrong or impossible, said plainly; every limitation, sharp edge or compromise you know of, however small. Never present partial work as complete; never state a measurement you did not take.
