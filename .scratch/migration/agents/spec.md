# Standing specification for every oculus package

Every agent dispatched on an oculus package runs under this file plus one brief in `briefs/`. The brief names the package, the files to read in full, the exact deliverable, and the verification commands with their expected output. Nothing in a brief overrides anything here.

## Read first, before changing anything

1. The brief for this package. It names the sections of `tools/oculus/DESIGN.md` the package is measured against; read those sections and not the whole file. Where the brief and the design disagree, stop and report the disagreement; do not pick a side.
2. The files the brief lists, and only those; where the brief gives a line range, read the range. Read them in one turn, not one per turn: every turn carries the whole context again, so the number of turns is what a package costs.
3. Do not read the hub's instruction file (`CLAUDE.md`, also reachable as `AGENTS.md`); the rules that bind you are the ones below.

## The working rules that bind every package (from the hub's CLAUDE.md)

- Never take the lazy option. The lazy option is the one that costs less to do now and leaves the work undone: a limitation written instead of a fix, a case deferred, a check loosened, a test fitted to its revert, a sentence that excuses an absence, a smaller job than the brief. Work inside the brief is done in the step, never handed back as a gap or a later item; work outside it is named in the report with what it is and why it is outside. A shortcut is a finding against the step that took it.
- A report states the end state: what is NOT done first, then a DONE / NOT DONE ledger naming the command that proves each row. No narration of wrong turns taken and backed out. Never present partial work as complete; never state a measurement not taken.
- Every claim about behaviour, cost or timing names the command that produced it, or says "not verified".
- A test never asserts a known defect, and no threshold is loosened to make a check pass; a check that passes only after loosening is a finding to report.
- A risk you name is a task you own: fix it, or say plainly and prominently that it is unfixed. Pick a check by asking whether it would fail if the risk were real.
- No silent design decisions: a user-visible shape (a config key, a wire format, a vocabulary) the brief does not name is reported as a decision the orchestrator may reverse, not baked in quietly. Internal, reversible details are chosen freely and listed.
- Verify before asserting: read the source, cite `file:line`; never repeat another agent's summary as a fact.
- Prose: plain, ASCII, no em dashes, no quips; name the actual function, file and line.
- The cockpit is a cautionary reference, never a justification; every oculus choice is justified from `DESIGN.md`.

## Token discipline

- While working, run only the test files that cover what you are changing (`npx vitest run tests/<file>`), never the whole suite. The full verify list (`checks.sh`) runs once, after your last change. A red line in a file the step changed is fixed and that file rerun alone, then the list runs once more. A red line in a file the step does not change is rerun alone and named with that run in the report, and the list is not run again for it. Use the dot reporter for whole runs, and the verbose reporter only for the lines the report quotes.
- Batch independent reads into one turn. Do not re-read a file you wrote; the harness holds it.
- Do not paste whole files into your reasoning or your report; quote the lines the report needs.

## Where you work

- In the git worktree the brief names, never in the main checkout. The worktree was created at main's head by the orchestrator. Every path in the brief is relative to that worktree.
- You never run a git command. Not `add`, not `commit`, not `stash`, not `checkout`, not `status`. The orchestrator reads your diff and lands it.
- You never edit anything under `tools/oculus/.scratch/`. The plan, the state file and the briefs are the orchestrator's.
- You never write under `feeds/`, `projects/`, `registries/`, `funding/` or any other hub data folder, and never a `project.yml`. Tests use synthetic fixtures in a temporary directory and assert the resolved path is inside it before any write. Four things read the real hub and nothing else, all read only: `tests/checks/config/integrity.test.ts`, `tests/server/edit/entry-edit.test.ts`, `tests/server/edit/yaml-edit.test.ts` and `tests/data/real-hub.probe.ts`; a finding any of them produces is reported, never repaired. The three cases skip where the hub carries no data, which `tests/fixtures/real-hub.ts` answers by asking whether the config's registries file and one scan folder are filled, so a checkout without the hub's folders skips them rather than failing on a count of nothing.
- You never start a server on port 8787, and never kill, signal or restart the process that holds it. The oculus dev server uses the port the brief names. You never send a signal to any pid found in `~/.claude/sessions/`.

## What every package obeys

- No history in code or comments: a comment says what the code does and why, never which package, session, date, earlier bug or reverted attempt it came from. A comment naming a package id (O17, Q14, D19c) or a date is a defect.

- One source file under 1000 lines. A file approaching it is split by concern.
- At most ten tracked items in a folder under `src`, `tests`, `bin` or `config`; `bin/folder-check.sh` holds it. A folder that would pass that is split into folders named for what they hold, and a new file goes where its concern already lives.
- Four-space indentation everywhere. Prettier is pinned in `.prettierrc`; run `npm run format` on what you wrote and `npm run format:check` before you report. Never hand-format to satisfy the check.
- ASCII only in every file you author. Glyphs come from `config/catalogs/glyphs.yml`; every user-facing string from a catalog file under `config/text/` through `t("group.key")`, in a component and in a state module alike; colours from `themes/tokens.css`. A literal string, a raw hex or a literal glyph anywhere a reader sees it is a defect. A catalog group lives in exactly one file: a new key joins its group where that group already is, and a group is never declared in two.
- Every module and component you add opens with the head comment the tree's files open with: its layer ("Layer 2, server" and so on), what it is, and why it is shaped as it is. A file without one is a defect.
- Every control a reader presses is a `ui/` primitive (`ToolButton`, `Chip`, `Confirm`, `Table`, `Meter`, `Menu`, `Search`, the inputs), never a raw `<button>`, `<input>` or `<select>`; a table with plain cells is `ui/Table.svelte`, and only a table whose cell is a bar or a control is hand-drawn.
- Svelte markup is written one element per line, as every view in the tree is; a component compacted onto long lines is reformatted before you report.
- A value that has a config key (a host, a port, a cadence, a path) is read from the config through `loadConfig` or `loadLocal` and is never hardcoded beside it as a fallback; the default lives in the config file.
- The layer boundaries in `DESIGN.md`: `ui/` imports no state and no view; `shell/` imports no view by name; `views/` imports no shell and no other view; nothing client-side imports `lib/server/`. `tests/checks/tree/boundaries.test.ts` enforces them and must pass.
- One line per paragraph or bullet in any Markdown or YAML you edit. No hard wrapping.
- No dependency the brief did not name, and every library the brief names is used for what it names rather than code written beside it. `npm install` of something new is a report, not an action: a library you find that would cover part of your work is named in the report with what it would replace.
- The tests are the unit suite (`npm test`) and the tree checks (`npm run test:checks`), and nothing else: there is no browser suite and no revert directive, and a step adds neither. A file tagged slow (`// @module-tag slow`) is left out of both, and a step never runs `npm run test:slow`.
- A step whose change a reader can see is looked at on screen before it is booked: the orchestrator opens the views it touches on the workbench page named TEST in Axel's own Chrome, on his running server, and the landing report says what was seen there. Your report's "before and after" section is what the look is read against, so it names the view, the state to put it in and what should differ.
- A test never asserts a known defect. A threshold is never loosened to make a check pass; a check that only passes after loosening is a finding to report.
- The cockpit under `tools/cockpit` is a cautionary reference for what its code got wrong, never a justification. Port its facts (the transcript format, the registry, the grouping clamp, the four git commands), not its structure.
- A behaviour that needs a DOM (a press, a focus, an effect) is seen at the look on landing. The unit suite renders to a string, so an assertion over source text, over a label alone or over a constant proves nothing and is reported as an audit, never as coverage.
- After changing a name, a construct or a shape, grep it across `src`, `tests`, `config`, `HELP.md`, `DESIGN.md` and `README.md`, carry the change to every hit or say why not, and quote that grep in the report. A sentence in a document or a head comment that the change makes false is a defect of the change.
- Every id or key a package introduces is exercised empty, duplicated, and colliding with a configured or reserved key. Every asynchronous path is exercised in flight, after close, and superseded by a later one. A value from the hub or a feed that reaches HTML or a shell is untrusted.
- A write that edits a file's text re-parses its own result and refuses when the reparse is not what was asked. A write that cannot verify itself does not land.

## Verify before you report

Run every command the brief lists, from `tools/oculus` in the worktree, and fix until each passes. At minimum: `npm test`, `npm run test:checks`, `npm run check`, `npm run build`, `npm run format:check`. Then `LC_ALL=C grep -n '[^ -~]'` over every file you touched, which must print nothing.

The tests that count are the ones the step can influence: the test files it adds, changes or deletes, and the tests that exercise the files it changes. A failure or timeout in any other test file (`tests/server/core/git.test.ts` is the usual one) is not the step's: the report names it in one line, and nobody reruns it, investigates it, or changes code, a test, a timeout or any configuration because of it, since several suites run on this machine at once. A reviewer does not count such a failure as a finding.

## Report

First line: anything NOT done, or "Everything in the brief is done". Then a DONE / NOT DONE table, one row per deliverable in the brief, each naming the command that proves it and its output. Then: files changed with line counts; every judgment call the brief did not cover, as a decision the orchestrator may reverse; anything in the brief or the design that turned out wrong or impossible, said plainly; every limitation, sharp edge or compromise you know of, however small. Never present partial work as complete; never state a measurement you did not take.

## The principles every package is judged on

- No globals. No `globalThis`, no module-level mutable state shared across module graphs, no process-wide bridge; a dependency is passed in (a context object, a constructor argument, a function parameter) and a route reaches the server's objects through the request's locals, never through a global. A package that adds one is not landed.
- SOLID, DRY, KISS, YAGNI, separation of concerns, high cohesion and low coupling: a module has one reason to change; a new view, channel or key extends by registration, never by editing consumers; a parser, a fold or a rule exists once and is reused; nothing is built for a need the plan does not name; a file stays under 1000 lines and a component under about 600, split by responsibility before it grows past that; a reader-visible behaviour is state, not a DOM side effect; a check reads a fact (a file, a field, a version) rather than scraping a screen.
- Every config file and catalog is oculus's own, laid out for oculus: no cockpit-only key, group or comment; every catalog key has a reader in the tree (a test fails on an orphan key).

## Nothing left undone, no yes for a fix, reported means booked

- Nothing inside a brief is left undone. A miss the read, the reviewer or the checks find is repaired by the worker or fixed by the orchestrator at landing; a package is not ticked while any acceptance item, test or convention of its brief is short. A landing report never lists a miss inside the brief as a gap or a sharp edge, unless it is a stop (the skill's Stops section), and then it is booked.
- A fix of a defect in delivered work needs no yes from Axel, whatever the fix makes visible. Only a real user-visible shape he has not asked for, a premise found wrong or a clash between two rules goes to him.
- What goes to him is booked the moment it is raised (a `plan.md` line or the state file's open-items list) and repeated in every report until he has ruled. Memory does not count; the ledger does.

Several packages may be in flight at once when the state file's block sets `workers_at_once` above 1 and their briefs name disjoint paths and different views; each runs in its own worktree under its own brief and knows nothing of the other; a brief that lists a path another in-flight brief lists is not dispatched. The orchestrator is one; the landings are one at a time.

The reviewer stage runs per package by the state file's `review: earned` rule, decided from the ledger's rows and the diff; the checks and the orchestrator's read of the whole diff run on every package regardless; a second review after a repair only when the repair went beyond the misses it was sent. The rows record which branch a package took.

The ASCII gate: under `config/` an accented Latin letter in a real name (Linköping) is allowed, the rest of the gate unchanged; the check is `LC_ALL=C perl -ne 'my $l = $_; $l =~ s/\xC3[\x80-\xBF]//g if $ARGV =~ m{^config/}; print "$ARGV:$.:$_" if $l =~ /[^\x20-\x7E\n]/; close ARGV if eof' $(find src tests bin config -type f ! -name local.yml)` from `tools/oculus`, with `config/catalogs/glyphs.yml` held to it like every other file,, which must print nothing, and it replaces the `grep '[^ -~]'` form wherever a brief or a check names it.

A port carries what the reader sees and does on the cockpit's tab, never the cockpit's mechanism. Every mechanism is built on DESIGN.md's structure: machine-local state under `~/.oculus/`, the write chain, the change log, instance state saved with the layout, one file browser, one editor. Where the cockpit's mechanism contradicts that structure (browser storage for a fact about the hub, a per-tab control for something the file browser reaches, a literal list where content decides), the oculus form is built and the difference is one line of the report. A brief states the oculus mechanism before any cockpit reference, and a cockpit reference says what the reader got, not how the cockpit made it.

A package whose brief names a hub data path it rewrites (a registry file renamed, a manifest key migrated on every `project.yml`) writes there, in the worktree's copy, through the script the brief names and by nothing else; the write ban above stands for every path the brief does not name, and the brief lists the paths so the orchestrator can check the diff against them. A reviewer reads git state with `git diff <base>` and `git status --short` only; a builder runs no git command at all, since the orchestrator reads its diff.
