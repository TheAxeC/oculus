# Step O59 refuter report (on /Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O59, base cd00ebb1)

A page this report cites (the rules file, a standard, a skill's text) is named with its section, never with a line number, since a page's lines move and a section's name does not. A finding in code keeps its `file:line`.

The report is written in the rules file's character set. A character outside it in a quoted line is written by its name in angle brackets, such as `<tab>` or `<em dash>`.

## Verification (rerun by the reviewer)

All from the worktree's root with `PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH`, each read by its own exit.

```
$ npx vitest run tests/checks/config/config-folder.test.ts tests/checks/tree/boundaries.test.ts      (exit 1)
 <heavy right-pointing angle> |unit| tests/checks/tree/boundaries.test.ts (11 tests | 1 failed) 5610ms
     <multiplication sign> holds across src/lib 4284ms
+   "state/boards/collection.ts imports data/snapshot/normalise-parts/plans",
+   "views/shared/forms/Followups.svelte imports data/model",
 Test Files  1 failed | 1 passed (2)
      Tests  1 failed | 40 passed | 2 skipped (43)

$ npx prettier --check config/catalogs/vocab.yml src/lib/data/shapes/catalog-files/vocab.ts src/lib/state/boards/focus.ts src/lib/state/boards/ticker.ts src/lib/views/shared/forms/entry/task-card.ts src/lib/views/boards/focus/rows.ts      (exit 0)
All matched files use Prettier code style!

(npm run diagrams not run; the diagram changes were read in the diff, see "Declined to judge" and the three opening claims below.)

$ npm run test:quick -- --base cd00ebb1      (exit 0)
test:quick: 15 changed file(s), from git since cd00ebb1
test:quick: 9 test file(s), 9 essential
ok      prettier (0.8 s): All matched files use Prettier code style!
ok      ASCII gate (1.0 s)
ok      svelte-kit sync (2.5 s)
ok      eslint (2.4 s)
ok      svelte-check (9.3 s): 1792661974118 COMPLETED 533 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest (24.3 s): Duration  16.00s (transform 18.12s, setup 0ms, import 28.86s, tests 14.86s, environment 1.11s)
test:quick: 26.9 s (limit 45.0 s); every command passed

$ LC_ALL=C perl -ne '...' <the six changed files, as Verify 3 names them>      (exit 0)
(prints nothing)

$ grep -n "terminal" config/catalogs/vocab.yml      (line numbers)
52 62 67 68 69 70 71 72 74 241
$ grep -c "closes_deadline: true" config/catalogs/vocab.yml
25
$ awk over statuses: to focus_lanes: of the base copy for `terminal: true`, and of the worktree for `closes_deadline: true`, keys only; wc -l; diff
25 / 25; diff prints nothing (exit 0)
$ diff <(sed 's/closes_deadline: true/terminal: true/; s/`closes_deadline`/`terminal`/' config/catalogs/vocab.yml) <base copy>/config/catalogs/vocab.yml
only lines 82 and 83 differ (the two reworded comment lines); every status row is the base row with the key swapped, other flags and order unchanged

$ grep -rn "'terminal'" src | wc -l        -> 33 (base copy: 34); the one hit naming a vocabulary key is rules.ts:192 flagged('types', 'terminal'), the type flag
$ grep -rn "\bterminal(" src               -> menu-answer.ts:96-99 (page.terminal) and review-comment.ts:104 (deps.terminal()); no call of the old reader
$ grep -rn "closes_deadline\|closesDeadline" src tests config docs --exclude=local.yml
ticker.ts:38, 221, 249, 351, 370, 408, 430; focus.ts:76, 77, 78, 111; vocab.ts:45, 49, 52; task-card.ts:5, 10, 29; rows.ts:13; vocab.yml:81, 82, 83 and the 25 status rows
$ grep -rn "terminal" src tests config docs README.md --exclude=local.yml | wc -l
3317 (src 2593, tests 501, config 143, docs 75, README.md 5)
$ ... | grep -v "\.svg:" | grep -iE "status|flag|vocab|deadline|radar|ticker|chip|statuses|wordFlag|types|closes" | wc -l
72; each read: the type flag (rules.ts:37-38, 192, projects.ts:388, vocab.ts:111, 215, vocab.yml:52, 62-74, 241, audit.yml:61-62), terminal sessions and exit statuses, the terminal theme's chips and tags, schedule fixtures; none is the status flag
$ grep -rnE "(statusFlag|wordFlag|wordsWith)\(" src | grep -vE "'[a-z_]+'\)"
the non-literal readers are rules.ts:181 (flagged, called only with literals), leads.ts:22/27 (called with lead_* and default_lead only) and the helpers themselves; none can reach the status `terminal`
$ grep -rn "terminal" docs/*.md README.md | grep -iE "status|flag|vocab|deadline|radar|chip|closed|closes"
docs/apps.md:706 (exitStatus of a VS Code terminal), docs/HELP.md:468 (apps add terminals); neither names the flag
$ grep -rln "terminal" ~/workspace/research-hub/.oculus --exclude=local.yml
.oculus/workspaces/research-hub.yml:22 (`terminal:` settings block), .oculus/data/literature/radar.yml:6480 (prose); the hub's config.yml has no statuses: or types: key

$ sh utils/unused-exports.sh > <scratchpad>/unused-now.txt      (exit 0)
342 lines; base copy's unused-exports.txt 342 lines; diff prints nothing (exit 0)

$ git diff cd00ebb1 -- src config | added comment and description lines | grep -nE "before|used to|no longer|still|always has been|always had|as before|previously|the step adds|after this package lands|O[0-9]+|Q[0-9]+|20[0-9][0-9]-"
(prints nothing, exit 1)

Commands the report quotes, rerun:
$ npx prettier --check src/lib/server/content/wallpaper.ts src/lib/views/shared/forms/entry/edit/EntryForm.svelte      (exit 1)
[warn] src/lib/server/content/wallpaper.ts
[warn] src/lib/views/shared/forms/entry/edit/EntryForm.svelte
[warn] Code style issues found in 2 files. Run Prettier with --write to fix.
$ npx prettier --check .      (exit 1; the same two files and no other)
$ cmp of wallpaper.ts, EntryForm.svelte, state/boards/collection.ts, views/shared/forms/Followups.svelte, tests/checks/tree/boundaries.test.ts, server/edit/writes/undo.ts, server/edit/writes/subtasks.ts, server/edit/writes.ts against the base copy: all identical
$ grep -rn "'terminal'" src | wc -l and grep -rn "\bterminal(" src on the base copy: 34, and the hits the report lists (focus.ts:77, ticker.ts:221, 249, 351, 369, 406, 427, task-card.ts:29, menu-answer.ts:96-99, review-comment.ts:104)
$ grep -n "terminal" on the base copy's vocab.yml: 52 62 67-72 74 81 82 83 101 102 111 124 146-164 166 167 241; grep -c "closes_deadline: true": 0
$ wc -l: ticker.ts 601, focus.ts 418, task-card.ts 41, rows.ts 412, vocab.ts 321, vocab.yml 268
$ git diff cd00ebb1 --stat: vocab.yml 28/28, vocab.ts 3/3, focus.ts 6/6, ticker.ts 11/7, task-card.ts 5/5, rows.ts 2/2, layer-state 1/1 each, layer-views 5/5 each, layers 3/3 each, writes.dot 8/8, writes.svg 12/12 (matches the report's table)
```

The three things the report puts first, checked:

- Boundaries test red on the base for two files outside the step: true by reading. The two violating imports are `src/lib/state/boards/collection.ts:41` (`import { followups } from '../../data/snapshot/normalise-parts/plans.ts';`) and `src/lib/views/shared/forms/Followups.svelte:33` (`import type { Followup } from '$lib/data/model';`); both files and the test file are byte-identical to the base copy, and the step's import changes (`ticker.ts` from `./focus.ts`, `task-card.ts` from `$lib/state/boards/focus`) keep the same modules and add no violation. A run on the base itself was not made (the base copy has no node_modules).
- Two files `npm run format` would rewrite outside the write list, left as on the base: true. `npx prettier --check .` over the worktree names exactly `wallpaper.ts` and `EntryForm.svelte`, both identical to the base copy, and neither is in `git status --short`.
- Eight diagram files changed by source already on the base: true by reading. The diagram tool counts runtime imports per pair of folder ends (`utils/diagrams/graphs.mjs`, the count at line 113); the step keeps every import statement's source and target, so it moves no count. The changed labels come from base source the step does not touch: `undo.ts:315` `mapShape.safeParse(` and `undo.ts:502` `workspaceValueShape.parse(` are at those lines in the base copy, `writeFollowup` is exported at base `writes.ts:216` and imported at base `undo.ts:72`, and the `state/boards to layer data` count 49 to 50 matches base `collection.ts:41`.

## Verdicts

Items of the brief's "What to build", in its numbering:

- 1: holds. The 25 status rows carry `closes_deadline: true` where `terminal: true` was, other flags and order unchanged (the sed-swap diff above); line 81 names `closes_deadline` with the same description; lines 82 and 83 no longer use "terminal" for the status; the 8 type rows, line 52 and line 241 are unchanged (C1 grep).
- 2: holds. `vocab.ts:45` declares `closes_deadline` with the same description; `:49` and `:52` reworded; `:111` (type flag) and `:215` unchanged.
- 3: holds. `focus.ts:76-79` `closesDeadline` returns `statusFlag(config, status, 'closes_deadline')`; doc comments at `:76` and `:108-113` use the new name, the `settled` paragraph rewrapped at 100 columns.
- 4: holds. `ticker.ts:38` import and the six calls at `:221, 249, 351, 370, 408, 430`; `task-card.ts:10` import, `:29` call, head comment `:1-6` reworded and rewrapped.
- 5: holds. `rows.ts:13-14` names `closes_deadline`, rest of the sentence as on the base.

Cases of the brief's "Cases":

- C1: met, the greps and the word diff above.
- C2: met, by reading: `vocab.yml:152` `rejected: { color: "#dc2626", closes_deadline: true }`, `ticker.ts:249` skips on `closesDeadline(config, status)`, which goes through `statusFlag` to `wordFlag` (`vocab-keys.ts:137-143`).
- C3: met, by reading: the four conditions at `ticker.ts:351-352, 370-371, 408-409, 430-431` are `closesDeadline(...) && !statusFlag(config, status, 'live_subtasks')`, and the `ongoing` row carries both flags, so the condition is false for it as on the base.
- C4: met, by reading `task-card.ts:29` and the `done` row (`closes_deadline: true`).
- C5: met, C1 grep (8 type rows with `terminal: true`) and `vocab.ts:111` in `typeWord`.
- C6: met, by reading: `statusWord` is `z.strictObject` (`vocab.ts:34`) without `terminal`; `shape-issues.ts:37-40` turns the unrecognized key into an `unknown` issue; `hub-layer.ts:83-85` pushes it as a finding with the file, `:87-92` still merges the value; no reader takes the flag name from data that could reach `terminal` (the non-literal grep above).
- C6b: met, by reading the shape and `focus.ts:78`.
- C6c: met, by reading `typeWord` (`vocab.ts:97`, `z.strictObject`, no `closes_deadline`).
- C6d: met, by reading: `shapeSchema` is `z.toJSONSchema(shape, ...)` (`src/lib/data/snapshot/schema/json.ts:42`) over `statuses: z.record(z.string(), statusWord)` and `types: z.record(z.string(), typeWord)` (`vocab.ts:235-243`). The report gives no first run of this case on the unchanged tree (Spec 1).
- C7: met, the two greps above.
- C8: met, `config-folder.test.ts` passes in the paired run above (the one failing file is `boundaries.test.ts`, for base files).

## 1. Spec

- `.scratch/migration/agents/reviews/O59-report.md`, "The cases' first run", the C6d bullet: "C6d, read after the change: the editor's schema is `z.toJSONSchema(shape, ...)` ..."; what is wrong: the brief asks for the first run of every case on the unchanged tree with its result noted, and every other case gives one (C6b and C6c say what the first read gave), while C6d gives only the read after the change; failure scenario: a reader of the report cannot tell from it whether the base schema offered `terminal` under a status, so the before half of the editor change in "Host- or user-visible change" rests on no quoted read; verdict: none (C6d is met by this review's reading).

## 2. Proof

- none.

## 3. Standards

- `.scratch/migration/agents/reviews/O59-report.md`, first line and the DONE / NOT DONE row "Verify 1, the two test files | DONE (config-folder green; boundaries red on the base for files outside the step) | `Test Files  1 failed | 1 passed (2)`"; what is wrong: `spec.md`, "Report", says "a row whose run is red or missing is NOT DONE, and then the first line is not 'Everything in the brief is done'", and the brief's Verify 1 says "each must hold"; the row's run is red and the row is marked DONE under the first line "Everything in the brief is done". The red is not the step's (Verification above), and the report does say so in its second paragraph, so the fault is the row's label and the first line, not the work; failure scenario: an orchestrator reading the first line and the ledger takes Verify 1 as green, and at landing `npm run test:landing` on main goes red on `tests/checks/tree/boundaries.test.ts` with no row that says NOT DONE pointing at it; verdict: none.

## 4. Behaviour

- none. The report states the host-visible change with its before and after ("Host- or user-visible change, before and after"): a hub status with `closes_deadline: true` leaves the deadline radar, `terminal: true` on a status gives a finding naming the hub's `config.yml` and `statuses.<word>.terminal` and takes nothing off the radar, and the editor offers `closes_deadline` under a status and `terminal` only under a type. This review's reading agrees.

## Declined to judge

- The report says the builder ran `git log --oneline -1`, `git status --short`, `git diff --stat`, `git diff` and `git diff --numstat`, under an allowance in the dispatch message. `spec.md`, "Where you work", says a builder runs no git command, `log` named among them. The dispatch message is not on disk for this review to read, so whether these runs were inside its allowance is the orchestrator's call; the git commands were not rerun (only `git diff cd00ebb1`, `git status --short` and `git show` are this review's), and their figures were checked through `git diff cd00ebb1 --stat` instead.
- Whether `tests/checks/tree/boundaries.test.ts` is red on the base by a run: settled here by reading (identical files, same two violations), not by a run on the base, which would need a checkout of cd00ebb1 with node_modules.
- Whether `tests/checks/diagrams/diagrams.test.ts` is red on the base (the committed diagrams were stale against base source): not run, since `npm run diagrams` writes files and the test is outside the brief's verify list; a run of `npx vitest run tests/checks/diagrams/diagrams.test.ts` in the worktree and on a base checkout would settle it.
- The builder's `test:quick` time of 57.4 s against the 45 s limit: not reproduced; this review's run took 26.9 s. Machine load at the builder's run is not knowable here.
- The look on landing (the Focus board's ticker and a `done` task's card on TEST) is the orchestrator's, as `spec.md` says; no page was started.

Reviewer usage: a829b81915b79ee67, claude-opus-5-5, 178609 tokens, 53 tool uses, 6 min 16 s.
