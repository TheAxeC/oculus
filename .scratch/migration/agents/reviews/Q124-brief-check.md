# Brief check: Q124

The brief `agents/briefs/Q124.md`, on main at 10ac00c69. The checker changed no file, ran no git command that changes state, no vitest and no npm script.

## Names

1. `grep -rnE "\}, [0-9_]+\);|timeout: *[0-9]|\{ *timeout|setConfig|testTimeout|hookTimeout" tests/checks` prints the nine limits as the brief lists them.
2. The rule is stated at `vite.config.ts:34-36`, `README.md:17` and `HELP.md:372`; all stay true after item 1, but `tests/checks/utils/claude-usage.test.ts:3` is `// @module-tag slow`, so `test:checks` never runs it; `test:slow` runs it under `--testTimeout 20000` (`package.json:18`). `HELP.md:370-373` describes `npm test`, `test:checks` and `test:slow` and goes false if the mechanism changes what they run or cover; HELP.md is not in the write list, nor README.md:17.
3. `agents/spec.md:25` stays true; `:56` ("A test tagged slow ... is left out of both" `npm test` and `test:checks`) goes false if the claude-usage limit is ended by `test:checks` running slow-tagged tree checks.
4. `tests/tiers/essential.txt:5,9`: stays true.
5. `DESIGN.md:354`: stays true.
6. `node_modules/.vite`, `cacheDir`, `cache.dir`: no hit outside the ledger (`plan.md:261,637,640` and past briefs, records of their time).
7. `LIST`: `landing.mjs:21,44,46` and unrelated constants; `landing.mjs` is referenced outside the ledger only at `package.json:16`.
8. `tests/server/machine/pty/sessions.test.ts:27` `vi.setConfig({ testTimeout: 30000 })`: a unit test, outside the step.

## The step line

`grep -n "^- Q124" plan.md` prints 640.

1. "every per-case limit under `tests/checks/` dropped": item 1, which cannot reach the stated end for claude-usage, which runs under `test:slow`'s 20 s with or without its own limit.
2. "corrected at /spec": Decision 1.
3. "(ruling Z628)": quoted at line 13; matches `plan.md:1367` apart from its tail.
4. "the vitest runs ... no longer race on the shared deps cache": item 2.
5. "(ENOTEMPTY at startup in two landing runs, Z468)": half-sourced. The second run is `agents/reviews/D44-landing.md:32`: "`test:slow` failed on vite's dependency-cache rename race (`ENOENT ... rename .../deps___vitest__`)", an ENOENT, from when `test:slow` ran beside the other lanes (`git show 97e03827c:tools/oculus/tests/tiers/landing.mjs`). The brief should cite it and both error forms.
6. Item 3 has no part of the step line behind it; `spec.md:66` requires it.

## Premises

1. `package.json` lines 13, 14 and 18 hold.
2. `vite.config.ts:34-36` and `README.md:17` hold.
3. Wrong: "three vitest processes start together". `landing.mjs:29` runs `npm run check; ...; npm run build; ...; npm run test:slow` in sequence in one lane; only `npm test` (`:22`) and `npm run test:checks` (`:23`) start at once (`plan.md:637` agrees).
4. `O30-landing.md:26` holds; the second record is D44's.
5. `quick.mjs` already leaves tree checks out: `isUnitTest` (`:122-125`) rejects `tests/checks/`, a changed tree check goes to `left` (`:190`) and prints "changed, run by npm run test:checks or test:slow" (`:252`), the import picks skip them (`:195`), and `essential.txt` names no file under `tests/checks`.
6. The justifying comments are at `history.test.ts:128`, `comment-width.test.ts:56`, `claude-usage.test.ts:16`; the six diagram limits carry none.
7. A recount over `retry`, `vi.waitFor`, `setTimeout`, `AbortSignal.timeout`, `killSignal`, number arguments of `beforeAll`/`it`, `tags:` and `tests/fixtures/scratch.ts` finds nothing beyond the nine (`config-folder.test.ts:524`'s `1000` is an argument). `--testTimeout 0` means no limit (`@vitest/runner/dist/chunk-artifact.js:2262`).
8. Wrong: line 15's "Each overrides the `--testTimeout 0` of `npm run test:checks`" is false for `claude-usage.test.ts` (slow-tagged, run only in `test:slow` at 20000).
9. The brief names no worktree and no base copy (`spec.md:31-34`, `:83`; compare `E4g.md:7`).

## Cases and checks

1. Cases 1, 2, 3 and 5 depart from `spec.md:25` ("never the whole suite"; the landing list is run by no builder or reviewer) without saying so: about 25 full runs beside up to six steps in flight. The brief must state the departure and consider stopping a run once vitest is past startup.
2. The third run of cases 1 and 2 departs from `spec.md:56` ("a step never runs `npm run test:slow`") unnamed. Only `tests/server/desktop/start.test.ts` starts Electron (`:13`, `:26`, `:158`); `window-guard.test.ts:2` imports nothing from electron; `pty/sessions.test.ts` uses a private tmux socket; no slow file names 8787 or 8790. The exclude covers every row that starts Electron.
3. Case 3 is impossible for `claude-usage.test.ts`, never among `test:checks`'s passes.
4. Case 6 checks a place the step need not change: the quick tier never runs a changed tree check; `quick.mjs` belongs in the write list only for item 3's comments or if the mechanism reaches its vitest run (`:265`).
5. Case 7 and item 2's "so `git status` stays clean" contradict `spec.md:32`; the builder can show the folder lies under `node_modules/`, ignored by `tools/oculus/.gitignore:1` (`git check-ignore -v`, read-only), or the orchestrator runs case 7.
6. Cases 1 and 2 start from an empty cache; the landing failures started from a stale one: the gate's `node_modules` is a `cp -c` clone of main's (`orchestrator-state.md:96`), and vite's `getConfigHash` hashes `root` (`vite/dist/node/chunks/node.js:28401`), so a fresh gate finds the cache stale, removes it (`node.js:27880-27883`) and re-optimizes. Add rounds from a stale cache.
7. Five rounds can show nothing (the window between `existsSync` and `renameSync`, `node.js:27959-27974`); no rule for case 1 producing no failure.
8. Case 1 assumes the worktree's `node_modules` is its own clone; if shared, emptying `node_modules/.vite` removes the `deps` of Axel's running `vite dev`. The brief should name the worktree and say its `node_modules` is a clone.
9. `spec.md:63` asks for each changed test's failing line on the unchanged tree; nine tests change, and the brief does not say how this applies to a change that only removes a limit.
10. Verify item 1's "filter the rules file names" points nowhere (`grep -n -i "filter\|pipe" agents/spec.md` prints nothing).

## The question

1. Item 1, case 4 and the step line can pass with the goal unmet: `claude-usage.test.ts`, a tree check (G27, `guarded.md:144`), still runs only under `test:slow`'s 20 s; case 4's grep never sees `package.json:18`. Ending it needs a decision, for example `test:checks` drops `--tagsFilter '!slow'` and `test:slow` excludes `tests/checks/**`, which makes `spec.md:56` false.
2. Item 2 and cases 1 and 2 can pass with the goal unmet: (a) no stale-cache start; (b) a mechanism in `landing.mjs` alone passes nothing the builder can run; (c) `npm run test:quick` beside `npm test` is not covered; (d) the results cache is not covered.
3. Vitest 4.1.11, vite 8.3.0, vite-plugin-svelte 7.3.0. Vitest puts a project's cache at `<cacheDir>/vitest/sha1(project name)` (`vitest/dist/chunks/cli-api.CnMVyzaz.js:607-609`, `:10086-10093`); `npm test` and `test:checks` both run projects `unit` and `client`, so they share two folders. The optimizer runs in the `__vitest__` environment; vite-plugin-svelte's top-level `optimizeDeps.include` (`options.js:387`) pre-bundles svelte there. No CLI flag sets the cache folder (`--cache.dir` throws as deprecated, `cac.uFydS1Z4.js:1127-1136`); vite's `cacheDir` is not a vitest CLI option. Mechanism A: a per-process `cache.dir` or `cacheDir` in the `test` block (e.g. from `process.pid`); works in any shell; every run re-optimizes and per-process folders pile up (vite cleans only `_temp_` folders older than 24 h, `node.js:28473-28490`). Mechanism B: one vitest start in `landing.mjs` before `Promise.all`; holds only there; whether a start with no test file commits the cache is not verified. Mechanism C: no deps cache for `__vitest__` (`environments.__vitest__.optimizeDeps`); top-level config, outside "the test block only"; not verified. Verdict: A is workable within the constraints; the brief should widen the write list to the top-level config or accept A's costs.

## Implied inputs

1. Two worktrees running `test:landing` at once on one `node_modules` clone race and remove each other's cache as stale (`node.js:27869-27883`). Whether builders' worktrees get their own clone is not verified.
2. `npm run test:quick` beside `npm test`: `quick.mjs:256-265` starts vitest with `--configLoader runner` and `--experimental.fsModuleCache` on the same projects and cache; `test:warm` (`package.json:17`) starts it after an install.
3. A cache left by a killed run: no `deps___vitest__` or a `_temp_` folder; the next start re-optimizes; a mechanism B testing only for the folder's existence is fooled.
4. The results cache: `node_modules/.vite/vitest/<sha1("")>/results.json` is written with a plain `writeFile` at each run's end (`cli-api:582-591`) and parsed with no guard at the next start (`:546-549`).
5. Axel's dev server in main: a mechanism that moves the top-level `cacheDir` also moves the running `vite dev`'s `deps`.
6. The landing's real start: two runs at once from a stale cloned cache.

## ADRs

`ls tools/oculus/docs/adr` fails; `find . -type d -iname '*adr*'` outside `node_modules` prints nothing; `grep -n "adr" .agents/plan.yaml` exits 1. None.

## Dictated text

The brief dictates no text.

## Declined to judge

1. How often the race happens on the unchanged tree.
2. Whether `--configLoader runner`'s config hash equals the default loader's.
3. Whether a vitest start with no selected file commits the `__vitest__` deps cache.
4. Whether `environments.__vitest__.optimizeDeps` overrides vite-plugin-svelte's top-level include.

Usage: a637e9ef56264db07, claude-opus-5-5, 202,225 tokens, 63 tool uses, 9.0 min.

## Closed

Every finding is closed by a change to `agents/briefs/Q124.md`, under the orchestrator's rulings. Line numbers in the brief were checked on main at 7813074e8 with `grep -n` and `sed -n`; `git diff --stat 10ac00c69 7813074e8 -- tools/oculus ':!tools/oculus/.scratch' ':!tools/oculus/config/local.yml'` prints nothing.

### Names

1. Holds; no change.
2. Closed by What to build item 1 (`test:checks` drops `--tagsFilter '!slow'`, `test:slow` gains `--exclude 'tests/checks/**'`) and item 3, which has `vite.config.ts:31-37`, `README.md:17` and `HELP.md:371-373` say what the scripts run; both documents join the write list. The ruling named `HELP.md:370-373`; `:370` is a blank line, so the write list names `:371-373` and the read list `:369-373`.
3. Closed by "Where this brief departs from the rules file" item 2: `spec.md:56` becomes false and the orchestrator rewrites it at landing; the builder never edits `.scratch/`.
4. to 8. Hold; `essential.txt:9` and `DESIGN.md:354` are named as staying true under "What is on the tree".

### The step line

1. Closed with Question 1 below.
2. to 4. Hold; no change.
5. Closed: "What is on the tree" cites `D44-landing.md:32` beside `O30-landing.md:26`, with both error forms (ENOTEMPTY and ENOENT).
6. Closed: item 3 rests on `spec.md:66`, and now names the documents item 1 makes false.

### Premises

1. and 2. Hold; `vite.config.ts:31-37` is cited for the whole statement of the tag and the rule.
3. Closed: the brief says two vitest runs start at once (`landing.mjs:22`, `:23`), with `test:slow` after check and build in one lane (`:29`); "three" is gone from the premises, item 2 and the cases.
4. Closed with step line 5.
5. Closed with Cases 4.
6. Closed, and corrected: the `comment-width.test.ts` comment is at `:55` (`grep -n "default limit" tests/checks/source/comment-width.test.ts` prints 55); the brief said `:56`.
7. Holds; no change.
8. Closed: the correction paragraph says the ninth limit sits in a slow-tagged file run only under `test:slow`, and item 1 brings it under `test:checks`.
9. Closed: the brief names the worktree `.agents/worktrees/Q124` and the base copy `.agents/worktrees/Q124-base/tools/oculus/`, unpacked with `git archive <base> tools/oculus/tests tools/oculus/package.json tools/oculus/vite.config.ts tools/oculus/README.md tools/oculus/HELP.md`; since the base copy holds no `utils`, the base's `utils/unused-exports.sh` output (`spec.md:83`) is the worktree's run before the first change, added as verify item 3.

### Cases and checks

1. Closed: departure 1 names `spec.md:25` and why (the step's subject is the start of these runs); each run may be stopped once vitest has reported its first test file, never while results are written.
2. Closed: the third run (`--tagsFilter slow` with the desktop rows left out) is gone, since only two vitest runs start at once at landing; the builder runs no slow run. The `spec.md:56` departure that remains is departure 2.
3. Closed: case 3 includes `claude-usage.test.ts`, which `test:checks` runs after item 1.
4. Closed: case 6 is dropped; `quick.mjs` stays in the write list for its comments, and its vitest run (`:256-265`) only if the mechanism must reach it. The cases are renumbered 1 to 7.
5. Closed: item 2's "so `git status` stays clean" is gone; case 6 (the old case 7) is shown by the folder's path and `tools/oculus/.gitignore:1`, and `git status --short` is the orchestrator's at landing.
6. Closed: case 1 has two starting states, an emptied cache and a stale one (main's `node_modules/.vite` cloned with `cp -cR` into the worktree's), the stale state explained by `getConfigHash` hashing `root` (`vite/dist/node/chunks/node.js:28401`) and the removal at `:27883-27884`.
7. Closed: five rounds per starting state, raised to twenty if none fails, then the stop rule before any change; the stop paragraph names this case.
8. Closed: the worktree's `node_modules` is its own `cp -c` clone, never linked, so emptying it never touches Axel's dev server.
9. Closed: case 7 runs the nine changed tests on the unchanged tree and after, from a verbose run filtered to their titles, and says per `spec.md:63` that a removed limit has no failing line.
10. Closed: verify reads "each read by its own exit status".

### The question

1. Closed by item 1 and Decision 2 (the lazy option named), with case 4 also grepping `package.json` for the two scripts.
2. Closed by item 2's constraints: (a) stale-cache rounds; (b) a mechanism in `landing.mjs` alone is not accepted; (c) `npm run test:quick` beside `npm test` is covered and has rounds in cases 1 and 2; (d) the results cache is covered by the same mechanism.
3. Closed: the write list has `vite.config.ts` whole, so a per-process, a no-cache or an `__vitest__` environment setting is open, under the constraint that the top-level `cacheDir` of the dev server does not move and per-process folders are cleared; the report names the mechanism with the vitest and vite source lines. The source lines the brief cites as leads were rechecked: `cli-api.CnMVyzaz.js:608`, `:10092`, `:546-550`, `:582-591`, `node.js:27971`, `:27974`, `:28473-28490`.

### Implied inputs

1. Closed: each worktree has its own `node_modules` clone, stated in the worktree paragraph, with no case.
2. to 6. Closed under item 2's constraints and case 1's stale-cache state, as in The question 2.

### Dictated text

The brief dictates two script values by their change (`test:checks` with no `--tagsFilter`, `test:slow` with `--exclude 'tests/checks/**'`) and the commands of cases 1, 4 and 7. Each was held against `agents/spec.md`: ASCII, one line per paragraph and bullet, no history, and no limit or check loosened (`--testTimeout 0` in case 7 is the setting `test:checks` already runs under). The brief dictates no comment or document text.

Closed in the brief by ad1758291d4f08a72 (claude-opus-5-5; 123,025 tokens, 19 tool uses, 4.4 min), read whole by the orchestrator, who also changed line 5 to call `agents/guarded.md` the guarded entries and their tests rather than the configuration's standards list.
