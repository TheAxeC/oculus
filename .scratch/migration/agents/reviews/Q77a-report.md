# Q77a report (continuation builder; the first builder was stopped by an interrupt before it reported)

Everything in the brief is done.

Two things in the brief were wrong. Case 1 names `tests/state/config/config-folder.test.ts`, which does not exist; the file is `tests/checks/config/config-folder.test.ts` (checked with `find tests -name "config-folder*"`), and every Case 1 run below uses that path. Premise 6's "58 cases" is the count of every `it(` string, including the ones inside fixture strings. The real count on main is 30 (`grep -c "^\s*it(" .../tools/oculus/tests/checks/bin/revert-check.test.ts`) and 36 now.

## DONE / NOT DONE

| Item | Status | Proof (output verbatim) |
| --- | --- | --- |
| 1. In-memory path: one Vitest instance, a baseline run per case, only a red counts, everything else goes to the copy, refusals answer first | DONE | verification 8 below, where the four in-memory directives are red |
| 2. Browser directives unchanged | DONE | `bin/revert-check.mjs:877` sends a browser directive straight to `checkOne()`. The case "removes its copy of the tree when it is stopped by a signal" is red under its revert |
| 3. Output word for word unchanged | DONE | dispatch-note, original script vs new: `diff` prints `DISPATCH-IDENTICAL-TO-ORIGINAL`. Case 1 files, twice: `IDENTICAL` |
| 4. The run's own TMPDIR folder, removed at the end and on a signal | DONE | cases "leaves no folder of its own..." and "removes its run folder when it is stopped by a signal" are both red under their reverts. A hand probe sent SIGTERM mid-run: `after SIGTERM, check alive: no`, `child 61421 alive: no`, `tmp after: []` |
| 5. No parallel cases | DONE | `main()` awaits each directive in turn (`:876-882`) |
| 6. Head comment | DONE | `bin/revert-check.mjs:31-48` |
| 7. The five fixture tests, each red under its revert | DONE | verification 8, lines 26-30 |
| V1 `npx vitest run tests/checks/bin --reporter=dot` | DONE | `Test Files  8 passed (8)`, `Tests  83 passed (83)` |
| V2 Case 1 (audit, venues, config-folder) | DONE | `19 reverts, 0 unproven, 80 unchecked`, `236.46 real`. Per-line verdicts are identical to the original script over the same files (`diff` prints IDENTICAL, twice) |
| V2 Case 2 (diagrams) | DONE | `50 reverts, 0 unproven, 0 unchecked`, red lines: 50, `110.77 real` |
| V2 Case 3 (dispatch-note) | DONE | new: `20 reverts, 0 unproven, 0 unchecked`, `118.49 real`. Original copy-only script: same file, `78.19 real`. `diff` prints `DISPATCH-IDENTICAL-TO-ORIGINAL` |
| V2 temp folder check | DONE | each case ran with TMPDIR set to a fresh folder: `before: []` and `after: []` for all three |
| V3 `npm run check` | DONE | `COMPLETED 1511 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS` |
| V4 `npm run format:check` | DONE | `All matched files use Prettier code style!` |
| V5 `npm run lint` | DONE | `lint exit 0` |
| V6 ASCII gate | DONE | no output |
| V7 `sh bin/size-check.sh`, `sh bin/folder-check.sh` | DONE | `size exit 0`, `folder exit 0` |
| V8 `node bin/revert-check.mjs tests/checks/bin/revert-check.test.ts` | DONE | `36 reverts, 0 unproven, 0 unchecked`, 36 red lines, `247.73 real`, temp folder `after: []` |

## What changed, per item (file:line)

- **Head comment:** `bin/revert-check.mjs:31-39` describes the two paths and why a case that reads disk or runs a process needs the copy. `:46-48` covers the run folder.
- **In-memory path:**
  - `memoryRun()` is at `:726-826`, and its run folder uses `RUN_PREFIX` (`:682`).
  - The plugin (`:738-744`) is `enforce: 'pre'` and answers only the target's exact id. The current target and text live in a `swap` value the run makes, not in module state.
  - Vitest is started lazily through `createVitest` (`:749`) and closed in `close()` (`:819`), which `main()` calls in a `finally` (`:884`).
  - Baseline: `passes()` (`:772`), cached per `file::caseName`.
  - The revert is served by `red()` (`:801-817`), with the target invalidated before and after. A result counts only when there is exactly one, and it failed.
- **Refusals first:** `checkUnit()` (`:833-858`) runs `refusal()`, `applied()`/`editRefusal()`, the link check, and the `node --check` of a reverted `.mjs`/`.cjs`/`.js` before trying memory. Every non-red outcome, and anything thrown, falls to `checkOne()` (`:857`), which is unchanged.
- **Temporary directory:**
  - `within()` (`:697-715`) sets `process.env` to `caseEnv(runFolder)` and chdirs to the root only while Vitest work runs, then puts both back.
  - The signal handlers are at `:728-735`. `caseEnv()` is unchanged.
- **Tests:**
  - `tests/checks/bin/revert-check.test.ts:642-745` holds the in-memory describe block: the five brief cases plus the run-folder signal case.
  - `tests/checks/bin/revert-fixture.ts` (new, 193 lines) holds the fixture helpers, including `oneCase`, `RULE_IMPORT`, `stoppedAt`, `unwritableTemp` and `withLockedFile`.
  - Line counts: `bin/revert-check.mjs` 896, test file 851, fixture 193; `tests/checks/bin` holds 9 items.

## Timings, with the load beside each

| Run | Real time | Load, start to end |
| --- | --- | --- |
| Case 1, new, run 1 | 236.46 s | 13.56 to 15.40 |
| Case 1, original, run 1 | 205.53 s | 13.19 to 7.99 |
| Case 1, new, run 2 | 211.64 s | 7.12 to 11.54 |
| Case 1, original, run 2 | 269.29 s | 11.54 to 11.16 |
| Case 1, premise 2 (main, orchestrator's run) | 199.41 s | 6.25 to 8.71 |
| Case 2 (diagrams), new | 110.77 s | 10.05 to 7.40 |
| Case 2 (diagrams), probe in premise 4 | 58.2 s | not given in the brief |
| Case 3 (dispatch-note), new | 118.49 s | 7.40 to 9.40 |
| Case 3 (dispatch-note), original | 78.19 s | 11.94 to 11.17 |
| V8 | 247.73 s | 11.09 to 9.60 |

Q77e was running its own revert-check beside these runs (seen in `ps`), so the load was high.

These runs show no speed-up for the change. The two Case 1 pairs point in opposite directions, and dispatch-note was slower in the one pair I ran. One likely cause, not verified: a directive whose case reads disk or runs a process pays for a baseline run, an in-memory run and then the copy. Premise 4 puts 10 of config-folder's 13 and 16 of dispatch-note's 20 directives in that group. The output does not say which path proved a line, so I did not measure the split myself.

## Decisions the orchestrator may reverse

1. The in-memory name pattern is anchored at the end only, the same `exactly()` the copy path gives `-t`, and the result is then read by its exact name. I did not anchor the start because Vitest matches the pattern against the full name, including describe titles.
2. The fixture now writes its own `vitest.config.mjs` (`export default {};`), at `revert-fixture.ts` in `fixture()`. Without it, a fixture sitting inside the check's copy of this project (under `.case-tmp`) picks up the project's `vite.config.ts` by Vitest's upward config search. Its `include: ['tests/**/*.test.ts']` then drops the fixture's `.js` cases. That made "never calls red a case that fails with no revert" stay GREEN under its revert in V8, and I reproduced it by hand in a copy. With the config it is red.
3. The existing case "is said and not thrown over when the case left it unremovable" now runs its check with its own temporary directory from `unwritableTemp()`. `sweepFixtures()` makes that folder writable again and removes it even when the case fails. Before, the cleanup ran only when the assertions passed, so V8 left a copy with an unwritable `src` in the system temp folder.

## Limitations

- On a signal, the in-memory run removes its folder and exits without calling `vitest.close()`. The hand probe above showed the Vitest worker gone 3 s after SIGTERM, with nothing left in the temp folder.
- Outside the three Cases, other oculus-revert folders appeared in the shared system temp directory while I worked. They came from Q77e's concurrent run (its command line in `ps` names its own worktree). That is why every Case ran with its own TMPDIR.
- Everything I made in `$TMPDIR` is removed: `ls -A $TMPDIR | grep -c q77a` prints 0.

## Round 1

Everything in round 1 is done.

One deviation from the letter of finding 1: the reference listing is taken once Vitest has started over the run copy, not right after the copy is made. A probe printed what the start writes into the copy: `.svelte-kit`, `.svelte-kit/ambient.d.ts`, `.svelte-kit/generated/client/app.js`, and so on. That is SvelteKit's plugin writing as it starts. With a listing taken right after the copy, every in-memory run would have restarted the instance. Over audit.test.ts and venues.test.ts, a listing taken after the start never differed after a run (no restart was printed). The reason is stated at `bin/revert-check.mjs:759`.

## DONE / NOT DONE

| Item | Status | Proof (output verbatim) |
| --- | --- | --- |
| 1. In-memory path runs on one run copy, remade after a case writes into it | DONE | check 8: both directives of "runs cases on a copy of its own, made again after a case wrote into it" are `red` (`:773` and `:793`) |
| 2. Swap set inside the `try` | DONE | `bin/revert-check.mjs:775`: the swap is set in the `try` whose `finally` (`:786`) clears it. No test, as instructed |
| 3. Reverted case runs first; baseline only after a `failed`, cached | DONE | `:816-823`. Check 8: "never calls red a case that fails with no revert" is `red` under `return base !== null && ...` => `return true;` |
| 4. No second `node --check` on fallback | DONE | `checkOne(root, directive, parsed = false)` at `:617`, skip at `:641`, `checkUnit` passes it at `:855` and `:861`. A browser directive still calls `checkOne(base, directive)`, so it keeps its own check |
| `npx vitest run tests/checks/bin --reporter=dot` | DONE | `Test Files  8 passed (8)`, `Tests  84 passed (84)` |
| `npm run check` | DONE | `COMPLETED 1511 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS` |
| `npm run format:check` | DONE | `All matched files use Prettier code style!` |
| `npm run lint` | DONE | `lint exit 0` |
| ASCII gate | DONE | no output |
| `sh bin/size-check.sh`, `sh bin/folder-check.sh` | DONE | `size exit 0`, `folder exit 0`. `bin/revert-check.mjs` is 900 lines, the limit |
| `node bin/revert-check.mjs tests/checks/bin/revert-check.test.ts` | DONE | `38 reverts, 0 unproven, 0 unchecked`, 38 `red`, `174.72 real` |
| dispatch-note, new and original | DONE | both `20 reverts, 0 unproven, 0 unchecked`, `dispatch DIFF EMPTY` |
| diagrams, new and original | DONE | both `50 reverts, 0 unproven, 0 unchecked`, 50 `red` each, `diagrams DIFF EMPTY` |
| No new oculus-revert folder in the system temp directory | DONE | before and after every run above: `[oculus-revert-vwIMNl ]`, which was there before this round began |

## Changes (file:line)

**Finding 1: `bin/revert-check.mjs`**
- `listing()` (`:695-714`) lists every path under the copy except `node_modules`, each file with its size and mtime. A folder is listed by name only, so the syntax file written and removed beside a target does not count as a change. A copy it cannot read lists as `''`, which differs.
- `memoryRun()` (`:722-832`):
  - The run copy is `join(folder, 'tree')` (`:733`), made by `copyTree(root, tree)` in `start()` (`:745`).
  - The Vitest `root` (`:751`), the working directory of every `within()` (`:773`) and the plugin target (`:775`) are all the copy's real path.
  - After each run, `if (listing(run.base) !== run.listed) await restart();` (`:793`) closes the instance. The next run makes the copy and the instance again. The red of that run still counts.
- `close()` goes through `restart()`, then removes the run folder. The signal handler is unchanged.
- The head comment (`:31-41`) says the in-memory path runs on one copy per run and why.

**Finding 1: tests**
- `tests/checks/bin/revert-fixture.ts:203` adds `withNoteWriter()`: `src/note.mjs`, `tests/note.test.js` (the writer, revert `const out = 'note.txt';`), and `tests/clean.test.js` with a breaking and a harmless directive.
- The new case at `tests/checks/bin/revert-check.test.ts:753` runs `clean`, `note`, `clean`. That order makes the cached baseline able to show a missed remake. Its assertions:
  - the clean-case lines are exactly `red`, `GREEN`, `red`, `GREEN`, and the writer line is `red`;
  - the summary is `5 reverts, 2 unproven, 0 unchecked`;
  - the fixture holds no `note.txt`.
- Its two reverts, both red in check 8:
  - `return await within(env, run.base, async () => {` => `... within(env, root, ...`
  - `if (listing(run.base) !== run.listed) await restart();` => delete

**Finding 2**
- `inMemory()` (`:769-795`) sets the swap and does the first `invalidateFile` inside the inner `try`, and the `finally` always clears it.

**Finding 3**
- `red()` (`:816-823`) runs the reverted case first. The baseline runs only when that run returns exactly one `failed`, and it is cached per `file::caseName`.

**Finding 4**
- `run.unparsable()` (`:804-814`) writes the reverted text beside the target in the run copy, so the package files decide how a `.js` file parses, and removes it before any case runs. It returns `undefined` when no copy could be made, and `checkOne` then does its own check.

**Needed by the run copy (my change)**
- The in-memory run copy is made with `copyTree`, so a fixture file locked from the start would make it fail as well. `withLockedFile` became `withLockingCase()` (`revert-fixture.ts:108`) with `LOCK_IMPORTS` (`:156`). The case itself locks the fixture's `locked.txt` while it runs in memory, after the run copy exists, so only the fallback copy cannot copy it.
- Test directives renamed to the changed lines:
  - "proves red in memory": `if (proven) return { ok: true, line: \`red       ${whereOf(directive)}\` };` => delete (this keeps the in-memory run, so the lock still happens);
  - "sends a case that reads its target from disk": `return checkOne(root, directive, parsed);`;
  - "GREEN both ways": `if (held === null || held.length !== 1 || held[0] !== 'failed') return false;`;
  - "never calls red a case that fails with no revert": the baseline line;
  - "leaves no folder of its own": `"await restart();" +1 => delete`;
  - "calls a case red ... GREEN": `if (run.green) return failed(\`GREEN     ${where}\`);`.
- To stay at 900 lines, the repeated `{ ok: false, line }` objects became `failed()` (`:557`) and `unproven()` (`:563`). `outsideCopy()` is replaced by `unproven(directive, ', which is outside the copy')`. The lines printed are unchanged (both diffs above are empty).

**Line counts**
- `bin/revert-check.mjs` 900, `tests/checks/bin/revert-check.test.ts` 885, `tests/checks/bin/revert-fixture.ts` 257.

## Timings (back to back, `/usr/bin/time`, `--root` at the worktree's tools/oculus; "original" is main's `bin/revert-check.mjs` copied under $TMPDIR)

| Run | Real | Load, start to end |
| --- | --- | --- |
| dispatch-note, new | 70.98 s | 7.47 to 7.62 |
| dispatch-note, original | 63.58 s | 7.62 to 6.97 |
| diagrams, new | 96.29 s | 6.97 to 5.03 |
| diagrams, original | 263.66 s | 5.03 to 7.77 |
| revert-check.test.ts (check 8), new | 174.72 s | 4.81 to 10.07 |

On dispatch-note the new script is still no faster: most of its cases read from disk or spawn a process, so they fall back to the copy. On diagrams it is 2.7 times faster.

## Limitations

- When a case writes into the run copy, the next in-memory run pays for a new copy and a new Vitest start (the reviewer measured the start at 1.25 s). The number of such remakes on the real suite is not measured.
- The copy of main's script I placed in $TMPDIR is removed (`ls -A $TMPDIR | grep -c q77a` prints 0).
