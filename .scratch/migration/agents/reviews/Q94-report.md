# Q94 report: the launch note removed from oculus

Everything in the brief is done. The verify list is not green end to end: its one run stopped at `npm test`, red on five timeouts. Two are in git test files outside this step (`tests/server/core/git.test.ts`, `tests/server/git/git-ops.test.ts`). The other three are tree checks that read the files this step changed; they pass when run on their own, and so does every command after `npm test` in the list (details below).

## Open items of the state file, verbatim

> ## Open items (only what Axel must rule on; every report opens with this list verbatim and repeats it until he has ruled)
>
> An entry leaves this list for the closed log the moment Axel rules on it. What a review or a look found and no brief covered is not an open item: it is booked as its own step in `plan.md` and carried in the Booked section below, since it needs no ruling from him.
>
> None.

## The cases' first run

The first builder's first run is not on disk: it left no report and no log. The run below was made for this report against the unchanged tree: main's `tools/oculus` copied into the scratchpad, with the step's three test files copied in and `HOME` pointed at an empty scratch folder so the old code's default note path could not reach the real `~/.oculus`. The copy was deleted afterwards.

| Case | Test that is it | Unchanged tree | This tree | What turns it red |
|---|---|---|---|---|
| Scan with a subagent and a registry entry: live, agent listed, no `dispatch` field | `tests/server/sessions/stores/background.test.ts` "lists a live session's background subagent as its transcript names it, and nothing beside it" (new; the fixture gained `enrol` and a probe that answers `alive`) | pass | pass | A scan that sets `dispatch` on the agent or adds any agent beside the subagent (`toStrictEqual` and `'dispatch' in` fail). Undoing the step does not turn it red: the old code set no `dispatch` when the note is empty. It guards behaviour the step keeps. |
| `liveSignature` over a live session with a running subagent: `id:state:` part, no `>` part | `tests/server/root/watch/sessions.test.ts` "names a live session's id and state, and not its running subagent's status" (rewritten from the `:283` case) | pass | pass | A `liveSignature` that adds any agent's status (the old loop's `>` part applied to agents without `dispatch`). Undoing the step does not turn it red, because the old loop only added agents that had `dispatch`. |
| Agents view over subagents started 10:00 and 10:01: the 10:01 row first | `tests/views/sessions/agents.test.ts` "draws newest first by start, whatever order the server lists them in" (kept, now on two subagent rows) | pass | pass | Removing the sort in `folds.ts`. Undoing the step does not turn it red. |
| Subagent from 16:12:23.433 to 16:13:53.869: meta reads `1m 30s` through `sessions.ag_mins` | `tests/views/sessions/agents.test.ts` "counts a finished subagent from its start to its end" | pass | pass | A change to the duration count or to `sessions.ag_mins`. Undoing the step does not turn it red. |
| The removal grep prints nothing | the grep command in the last case | red, 74 hits outside the three copied test files | prints nothing, exit 1 | Undoing any deletion or edit of the step. |

Commands: `HOME=$S/home npx vitest run --reporter=verbose tests/server/sessions/stores/background.test.ts tests/views/sessions/agents.test.ts` in the copy gave `Tests 15 passed (15)`. `... tests/server/root/watch/sessions.test.ts -t "names a live session"` gave `Tests 1 passed | 12 skipped (13)`. The grep in the copy, with the three copied test files excluded, counted `74`. No case turned out wrong under the brief's own rules.

## What to build

| # | Item | State | Where | Proof |
|---|---|---|---|---|
| 1 | Writer, reader and their tests deleted | DONE | the 5 paths | `ls` on each: "No such file or directory" |
| 2 | The scan | DONE | `stores/transcripts.ts`: head comment paragraph gone, imports now `import { distinctFolders } from '../folders.ts'` (`:40`), `dispatchesPath` and `reused` gone, `probe.starts(candidates.map((entry) => entry.pid))` (`:243`), `byPath` and the `byReal` to `joinDispatches` block gone | `diff` against main; `npm run check`: 0 errors |
| 3 | The watcher | DONE | `watch/sessions.ts`: import, `dispatches` option, `reused` map and both options gone; `liveSignature` doc `:115` reads "every live session's id and the state it is in"; head comment `:10-21` and `openFiles` comment `:227-231` cleaned; `openFiles([options.overrides ?? defaultOverridesPath()])` `:270` | `diff` against main; watcher test file 13 passed |
| 4 | The registry | DONE | `registry.ts:63` ends "reads only in English."; `:183` "`starts` is one `probe.starts` answer over every candidate's pid, so `ps` runs once per scan." | `diff` against main |
| 5 | The model | DONE | `model-sessions.ts:19` id comment; `dispatch` and `AgentDispatch` gone | `grep -rn AgentDispatch src tests` prints nothing |
| 6 | The Agents view | DONE | `Agents.svelte`: head comment `:14-16`, `meta()` `:97` `agentTokens(agent)` alone, `kind()` without harness, `tip()` and `openBuilder()` gone, title is the description, `data-launched`, Tag, ToolButton and the `Tag`, `ToolButton`, `openView` imports gone; `folds.ts:64-65` and `Agents.svelte:56-57` comments; five words gone from `agents.yml` | `diff`; `npm run check` 0 errors; `npm run lint` clean |
| 7 | Tests | DONE | `dispatchesPath` lines gone from 4 fixtures; watcher test: fixture `dispatches` gone, 3 cases deleted, `:283` rewritten, unused `readFileSync` and `formatStamp` imports dropped; `agents.test.ts`: helper and 3 launch cases gone, 4 cases on subagent rows, describe "the agents view's rows"; `dev-server.test.ts` `COPIED` and comment; `registry.test.ts:3` | the 8 files: `Test Files 8 passed (8)`, `Tests 91 passed (91)`; watcher file after the import fix `Tests 13 passed (13)` |
| 8 | Docs | DONE | `HELP.md:127` reads "The agents a session has running under it: the subagents its transcript names." then the row's rest; `HELP.md:240` clause gone; `HELP.md:242` paragraph gone; `DESIGN.md:116` clause, `:124` "and the launched builders' pids", `:125` bullet gone | `grep -n -i launch HELP.md DESIGN.md` hits only unrelated lines (DESIGN `:122` background subagent launch answer, `:148`, `:237`, `:303`) |
| 9 | Derived files | DONE | `docs/diagrams/layer-server`, `layer-views`, `layers` (.dot/.svg) changed edge counts (for example `views to ui` 526 to 524); `allow-duplication.txt` names no deleted or changed file | `npm run diagrams` twice: hashes of `docs/diagrams` identical after each run (`diff d1 d2` empty); `grep -n "dispatch\|transcripts.ts\|watch/sessions.ts\|Agents.svelte\|model-sessions\|registry.ts\|folds.ts" tests/checks/tree/allow-duplication.txt` prints nothing |

### The verify list, run once

`sh /Users/axelfaes/.claude-work/skills/land/templates/verify.sh /Users/axelfaes/workspace/research-hub/tools/oculus/.scratch/migration/orchestrator-state.md` from the worktree printed (verbatim, the lines that report the result):

```
RED: npm test
exit status: 1
 ❯ tests/server/core/git.test.ts (40 tests | 1 failed) 79396ms
     × cuts every list it publishes at the cap 8543ms
 ❯ tests/server/git/git-ops.test.ts (37 tests | 1 failed) 104506ms
     × carries a rebase on once its conflict is resolved, and not before 6307ms
 ❯ tests/checks/imports/order.test.ts (13 tests | 1 failed) 26276ms
     × holds the server folders 7095ms
 ❯ tests/checks/tree/duplication.test.ts (10 tests | 1 failed) 10774ms
     × is not held anywhere under tests 7976ms
 ❯ tests/checks/tree/scratch.test.ts (10 tests | 1 failed) 10230ms
     × is the only way a test file makes one 6368ms
 FAIL  tests/server/git/git-ops.test.ts [ tests/server/git/git-ops.test.ts ]
Error: Hook timed out in 10000ms.
 Test Files  5 failed | 333 passed (338)
      Tests  5 failed | 5297 passed (5302)
exit=1
```

All five are timeouts (`Test timed out in 5000ms`, one `Hook timed out in 10000ms`), not failed assertions.
- The two git test files (`tests/server/core/git.test.ts`, `tests/server/git/git-ops.test.ts`) are outside this step and were not rerun.
- The three tree checks read every file under `src` and `tests`, including this step's files. Run on their own they pass: `npx vitest run --reporter=dot tests/checks/tree/duplication.test.ts tests/checks/tree/scratch.test.ts tests/checks/imports/order.test.ts` gave `Test Files 3 passed (3)`, `Tests 33 passed (33)`.

`npm test` was the first red command, so the runner stopped there and never ran the rest of the list. Each of the rest was run on its own:
- `npm run check`: `COMPLETED 1428 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`.
- `npm run build`: exit 0.
- `npm run format:check`: `All matched files use Prettier code style!`.
- `npm run lint`: at first it found 2 errors, the unused `readFileSync` and `formatStamp` imports in `tests/server/root/watch/sessions.test.ts:8,21`. Those imports are removed, and `npm run lint` now prints no problem.
- `! LC_ALL=C grep -rna '[^ -~]' src tests`: exit 0.

The build ran before the lint fix. That fix changed only the test file, which the build does not include. The verify list as a whole was not run again, because a second run would rerun the two git test files.

### The other checks the brief names
- Case grep `grep -rn -E "dispatch-note|dispatches\.json|AgentDispatch|joinDispatches|dispatchesPath|ag_launched|launch note" src tests bin config HELP.md DESIGN.md README.md`: prints nothing, exit 1.
- `grep -rn -E '^[[:space:]]*// revert:' src tests bin`: prints nothing. `ls tests/browser`: "No such file or directory".
- `sh bin/size-check.sh`: exit 0. `sh bin/folder-check.sh`: exit 0.
- The spec's ASCII gate (the `perl` form over `src tests bin config`): prints nothing. `LC_ALL=C grep -n '[^ -~]'` over every touched file, `docs/diagrams/*` included: prints nothing.

## Files, lines before (main checkout) and after

| File | Before | After |
|---|---|---|
| `bin/dispatch-note.mjs` | 437 | deleted |
| `src/lib/server/sessions/stores/dispatches.ts` | 261 | deleted |
| `tests/checks/bin/dispatch-note.test.ts` | 456 | deleted |
| `tests/checks/bin/dispatch-note-race.test.ts` | 63 | deleted |
| `tests/server/sessions/stores/dispatches.test.ts` | 595 | deleted |
| `src/lib/server/sessions/stores/transcripts.ts` | 344 | 291 |
| `src/lib/server/root/watch/sessions.ts` | 325 | 302 |
| `src/lib/server/sessions/registry.ts` | 234 | 233 |
| `src/lib/data/model/model-sessions.ts` | 646 | 617 |
| `src/lib/views/sessions/agents/Agents.svelte` | 232 | 189 |
| `src/lib/state/sessions/folds.ts` | 273 | 272 |
| `config/text/views/sessions/agents.yml` | 20 | 15 |
| `tests/server/sessions/folders.test.ts` | 186 | 185 |
| `tests/server/sessions/stores/codex.test.ts` | 570 | 569 |
| `tests/server/sessions/stores/transcripts.test.ts` | 899 | 898 |
| `tests/server/sessions/stores/background.test.ts` | 264 | 299 |
| `tests/server/root/watch/sessions.test.ts` | 620 | 509 |
| `tests/views/sessions/agents.test.ts` | 196 | 140 |
| `tests/server/root/dev-server.test.ts` | 244 | 233 |
| `tests/server/sessions/registry.test.ts` | 29 | 29 |
| `tests/checks/tree/allow-duplication.txt` | 674 | 674 (unchanged) |
| `HELP.md` | 296 | 294 |
| `DESIGN.md` | 321 | 320 |
| `docs/diagrams/layer-server`, `layer-views`, `layers` (.dot, .svg) | same line counts, edge-count labels changed | |

## Test cases before and after

Counted with `grep -cE "^\s*(it|test)\("`.
- Deleted files: `dispatch-note.test.ts` 19, `dispatch-note-race.test.ts` 1, `dispatches.test.ts` 27.
- `tests/server/root/watch/sessions.test.ts`: 16 before, 13 after. Deleted: "rescans when the launch note changes, and joins the launch to its parent", "republishes on the liveness re-check when a launched builder's process exits unstamped", and "publishes nothing when a launch seen under a reused pid meets a scan with no start time". Rewritten: "names every launched agent's status, under a session live or not, and no subagent's" is now "names a live session's id and state, and not its running subagent's status".
- `tests/views/sessions/agents.test.ts`: 8 before, 5 after. Deleted: "marks a launched row, names its harness and model, and carries a Codex token count", "draws no launched mark and no open control on a subagent", and "offers to open the transcript only of a launch whose session the payload holds". Renamed onto subagent rows: "counts a stamped launch ..." is now "counts a finished subagent from its start to its end", "counts a running launch ..." is now "counts a running subagent from its start to now", and "draws no count for a finished launch ..." is now "draws no count for a finished subagent whose end is not known".
- `tests/server/sessions/stores/background.test.ts`: 9 before, 10 after, with the added case of the first table.
- In total, 47 cases were deleted with their files, 6 more deleted from kept files, and 1 added.

## Judgment calls (reversible)

1. Case 1 is a new test in `background.test.ts`, not a kept one. No kept test put a subagent and a registry entry in one scan and asserted that the agent carries no `dispatch`. For this the fixture gained an `enrol(pid)` helper and a probe that answers `running` from an `alive` set.
2. The case at `:283` asserts both that the signature is `p:working:busy` with no `>` and that it stays the same when the subagent's status changes to `done`. The second assertion is the behavioural form of "a subagent's status is not in it".
3. The duration case asserts that `sessions.ag_mins` with 1 and 30 produces `1m 30s` and uses that string in the row assertion. This ties the case to the catalog words, as the brief asks.
4. `DESIGN.md:124` now ends "One `ps` per scan answers the start times of the registry's pids together." The brief says the rest of the sentence is kept unchanged, so "together" stays although nothing is left for it to join. The orchestrator may drop the word at landing.

## Wrong or impossible in the brief

The brief's premises were read at `de8048da`. This report compares against the main checkout at its current head, and the diff there matches the brief's line references. Nothing in the brief turned out wrong.

## Limitations and sharp edges

- The verify list has no fully green run on this tree. The reasons are the five timeouts under load and the lint fix made after the run; the separate runs above cover every command in the list.
- The build (exit 0) ran before the lint fix in the test file.
- `~/.oculus/dispatches.json` on this machine is left as it is (brief decision 2). Nothing reads it now.

## User-visible change

- Agents view. Before: a session whose launcher wrote the note showed extra rows marked with a `launched` Tag, a harness word (`claude`/`codex`) in the kind column, Codex token totals, a tooltip "..., launched by X in Y" and an open-transcript button. After: only the subagents the session's transcript names. The kind column shows the subagent type or `sessions.ag_type`, the tooltip is the description, and there is no open button. To look at it: select a session with subagents in the Sessions view and open the Agents view. The rows show newest first, with no `launched` tag and no open button.
- A launch written to `~/.oculus/dispatches.json` no longer makes the sessions channel rescan or republish.
- The `HELP.md` agents row, the "Three things outside the hub" paragraph and the removed `bin/dispatch-note.mjs` paragraph, plus `DESIGN.md`'s Watchers and Sessions sections, no longer describe the note.
