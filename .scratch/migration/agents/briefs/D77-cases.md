# D77, the ruling on the cases (round 0)

The builder stopped after the first run because case 18 rests on a premise the tree contradicts. The orchestrator checked the hand-back on main at 0f23da35d and rules below. Every other part of the brief stands as written.

## What the orchestrator checked

- `src/lib/data/model/model-sessions.ts:24`: "The tool-use id on a Claude transcript, the agent's path on a Codex rollout." A Codex agent's `id` is its agent path (`/root/<name>`), no file path.
- `src/lib/server/sessions/stores/codex.ts:118-131`: `itemShape` reads `agent_path` and `kind` and no `agent_thread_id`; `git grep -n -e parent_thread -e agent_thread_id -e thread_source -- src` prints nothing.
- `~/.codex/sessions`, read only: `grep -rl parent_thread_id ~/.codex/sessions | wc -l` gives 20. The child rollout `2026/09/20/rollout-2026-09-20T12-32-25-01a0be5f-d163-7291-8667-027dcec4bd6f.jsonl` opens with `session_meta` `{'id': '01a0be5f-d163-7291-8667-027dcec4bd6f', 'parent_thread_id': '01a0be4f-0cf4-7a62-9172-5e1a0d9c6f0b', 'thread_source': 'subagent', 'agent_path': '/root/q36_finish'}`, and its parent's rollout names each child on a `SubAgentActivity` item as `"agent_thread_id":"<uuid>","agent_path":"/root/<name>"`.
- `src/lib/server/sessions/transcript-routes.ts:46-47`: the route finds a record by id through `recordFor`, which answers a session record of the last published payload; a Codex session's id is its `session_meta` id (`codex.ts:205`).

## The ruling (Z892, self-rule)

1. Case 18's premise is replaced. The Codex fold keeps, for each agent, the `agent_thread_id` a `SubAgentActivity` item (or another item that names the agent) gives, as the agent's `agentId`, the same field part 5 adds for Claude, empty when no item names one. `itemShape` reads the field.
2. For a Codex agent the record lists with a non-empty `agentId`, the route reads the file of the session record whose id is that `agentId` (through `recordFor`, so the file is one a session record of the last published payload names, as G84 says), and only when that record's tool is `codex`. An agent with no such record is refused (404) like the other refusals. Nothing of the request is joined into a path, and no folder of the Codex store is searched.
3. Case 18 now reads: "A Codex session whose rollout holds a `SubAgentActivity` item naming a child's `agent_thread_id`, and the child's rollout read as its own session record: the parent record's agent carries that `agentId`, and `/api/transcript?id=<parent>&agent=/root/<name>` answers the child's turns; the child's record absent from the payload gives 404." It is a row of G84 in `tests/server/sessions/transcript-routes.test.ts`, run on the unchanged tree first.
4. The brief's premise line 38 and part 5's two Codex sentences are read as this ruling says.

The lazy option was B: no agent id, no press and "not available" for every Codex agent, which drops part 5 for Codex.

## The other points of the hand-back

- The name "Command Center": the strip's control keeps VS Code's name, as the brief says; `HELP.md` tells it apart from the Focus board's "Command center" panel in one sentence.
- These paths join "Paths this step writes", each for the reason the hand-back gives: `src/lib/data/sources/config/catalogs.ts` (`localText`, the new problem's words), `src/lib/server/root/watch/local.ts` (`FIELDS`), `src/lib/state/workbench/layout/tabs/reopen.svelte.ts` (Back to a closed tab), `src/lib/shell/panes/floats/FloatLayer.svelte` (the dock toggles), `src/lib/shell/panes/PaneView.svelte` (the editor actions moving to the window strip, Z891), and `src/lib/server/sessions/stores/codex.ts` (this ruling). `PaneView.svelte` holds 518 lines and stays at or under 520.
- A Codex subagent's rollout is also listed as a session of its own: no code reads `thread_source` or `parent_thread_id` (the grep above), so the store folds a child rollout like any other. This step keeps that list as it is (Z893, self-rule), and ruling 2 relies on it.

## Your next task

Resume from your first run: build every part of "What to build" as the brief and this ruling say, run case 18 again on the unchanged tree as restated, and write your final report in the brief's shape, with this ruling named under "Anything in the brief that was wrong or impossible".
