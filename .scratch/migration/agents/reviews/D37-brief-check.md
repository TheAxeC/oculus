# D37 brief check

Agent: ordo-high on claude-opus-5-5, 259,613 tokens, 81 tool uses, 10.2 min. Read on main at 7cc898b4f; changed nothing.

## Findings (as reported)

1. Names: `SearchFailure.reason` carries only English text, so a timed-out root cannot be told apart without a wire field; `startTerminal`'s joined invocation changes G35 assertions (`terminal.test.ts:88,100-101`, `terminal-actions.test.ts:143-145`) and the fixture `terminal-fixture.ts:106-135`; `row-menu.ts:212-214`'s comment made false; the terminal route's refusals are English constants (`edit.ts:30,33`); `HELP.md:181` (Dismiss) made false.
2. Step line: "every refusal of the terminal route is a word" narrowed to resize and tmux failures; the plan-line quote dropped text without an elision mark.
3. Premises: confirmed, with small line-range differences; the catalog grep of the write list finds no catalog (the route has none).
4. Cases: case 10 fills ripgrep's text into a sentence, against spec.md and Z317; item 4 names no refusal pattern; G35 assertion edits have no case; guarded entries G35, G28, G3 cover written files; `TerminalGrid.svelte` 516/520 and `terminals.svelte.ts` 819/880 not named.
5. Could pass without the goal: `rowAfter` keyed by line and place loses the focus (cases 1, 2); no record of a dismissed hit exists (case 5); a refused answer carries no `paths` (case 7); case 8 needs a way to make a root time out; case 21 misses folders under `build`; `problem_counts` keeps "1 errors".
6. Implied inputs: a kept terminal never leaves the list, so `confirm` never ends a build (stuck `building`); kept terminals pile up per save; LaTeX errors read twice as command diagnostics; the job's `source` and `repo` unstated; re-read failure, capped re-read, two Search tabs, Search in a float, bookmarks-only message, empty roots, the mounting component, two menu reads in either order.
7. ADRs: none.

Declined to judge: TEST's pane reading, L4's cause, the picture's layout, partial hits of a timed-out root, `sessions.test.ts` against real tmux, the unused-exports baseline.

## Closed

Every finding is closed in the brief's section "Changes from the brief check", items 1 to 16 and cases 32 to 35, and in its "Paths this step writes" (`edit.ts`, `run.ts`, `terminals.svelte.ts`, `pty-io.ts`, `commands.svelte.ts`, `answers.ts`, `terminal.yml`, `model-search.ts`, `model-sessions.ts`, `search.ts`, `words.ts`, `Rows.svelte`, `row-menu.ts`, `terminal-fixture.ts`). Two sessions' Search tabs: the other tab's Replace on a written file is refused `changed` with its sentence, as today. The plan-line quote now carries the dropped words.
