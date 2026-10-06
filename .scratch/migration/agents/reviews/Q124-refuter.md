# Q124 review (refute): the tree checks' limits are removed, and vitest runs started together no longer race on their deps cache

**Verdict.** The step holds. Every item of "What to build" holds, apart from three comment sentences that are inaccurate (S1 to S3 below). Every case I could run is met. The deps-cache race is ended at its cause, in `vite.config.ts`, and I confirmed it against the installed vite 8.3.0, vitest 4.1.11 and vite-plugin-svelte 7.3.0 sources. Over 40 concurrent starts after the change there were 0 cache errors, and no `deps___vitest__` or `_temp_` folder was created. The three comment fixes are small enough to make at landing. The builder's finding of a second race, on `.svelte-kit/types`, is real and outside this brief. I reproduced it in a second form, which makes it an item for Axel (B1).

## What to build

1. **Every tree check runs under `npm run test:checks` with no per-case limit: holds.**
   - `grep -rnE "\}, [0-9_]+\);|timeout: *[0-9]|\{ *timeout|setConfig|testTimeout|hookTimeout" tests/checks` prints nothing (exit 1).
   - `package.json:14` reads `"test:checks": "vitest run tests/checks --testTimeout 0 --hookTimeout 0"`, and `:18` reads `"test:slow": "vitest run --tagsFilter slow --exclude 'tests/checks/**' --testTimeout 20000"`.
   - Each of the three justifying comments was removed with its limit. `@module-tag slow` stays at `claude-usage.test.ts:3`.
   - The slow-tag grep prints one file, `tests/checks/utils/claude-usage.test.ts`. The report names what it runs.
   - The six diagram limits map to the right titles: the base copy's `it(` lines 83, 87, 788, 818, 830 and 840 each match a removed limit.
2. **The deps cache race ends: holds.**
   - **Mechanism:** a plugin, `noVitestDepsCache` (`vite.config.ts:25-36`), with a `configEnvironment` hook ordered `post`. For `__vitest__` only, it sets `optimizeDeps.noDiscovery = true` and `include = []`.
   - **Vite source:** `isDepOptimizationDisabled` (`vite/dist/node/chunks/node.js:27803-27804`) reads that pair as disabled, so no optimizer is created (`:36341`). The hook's in-place change persists, because each handler receives `environments[name]` itself (`:37537-37551`). `resolveDepOptimizationOptions` (`:36818-36824`) keeps `noDiscovery: true` and the empty include.
   - **Svelte plugin:** its hook (`setup-optimizer.js:34-55`) has no order, so a `post` hook runs after it. It is what put `SVELTE_IMPORTS` into the server environments' `include`.
   - **Vitest:** its own `configEnvironment` returns at once for `__vitest__` (`cli-api.CnMVyzaz.js:10235`).
   - **Before and after:** main's own cache (read only) holds `deps___vitest__` in all three `node_modules/.vite/vitest/<hash>/` folders. After my 40 starts, no `deps*` or `_temp_` folder was new under `vitest/` in any round.
   - **Dev server:** untouched. The hook returns for every name except `__vitest__`, and `cacheDir` is not set anywhere in `vite.config.ts`. I read this from the source and did not run the builder's `resolveConfig` probe.
   - **results.json:** the read is guarded at its caller (`cli-api:13214-13216`) and the write too (`:13663-13665`). It only orders files (`coverage.DM_a_rWm.js:48-73`).
   - **Leftovers from a killed run:** no new folders are made. Stale-cache rounds left the cloned `deps___vitest__` folders unmodified.
   - **Where it applies:** the change is in the config, so it covers `landing.mjs`, `quick.mjs` and a person's shell alike.
   - **Excluded fixes:** none was used. There is no retry, sleep, stagger, serial order, environment variable or caught error.
3. **Comments and documents say what is true: holds, with S1 to S3.**
   - `README.md:17`, `HELP.md:372-373`, `vite.config.ts:57-67` and `quick.mjs:251-254` are correct.
   - `essential.txt:9` and `DESIGN.md:354` are still true. I grepped every mention of `test:slow`, `test:checks`, `tagsFilter` and `module-tag slow` outside `node_modules`.

## Cases

1. **Failure on the unchanged tree: met by the builder's quoted rounds; I did not reproduce it.**
   - The builder recorded 2 ENOTEMPTY starts in 20, on `.../vitest/0df9.../deps___...`.
   - Reproducing it needs the unchanged tree, and I may not edit the worktree. The base copy holds no `src`.
   - The `deps___vitest__` folders in main's cache back the mechanism.
2. **Same rounds after the change: met.** I ran 5 rounds per starting state per pair, every run to its end (`scratchpad/q124/rounds/*.log`). That is 40 starts, with 0 ENOTEMPTY, EEXIST or `deps___vitest` lines.
   - `npm test` exited 1 in five rounds, each on a 5 s test timeout of its own: `workspaces.test.ts`, `manifest.test.ts` "a folder of 501 files" (three times), `undo.test.ts` and `watch.test.ts`. Under `spec.md`'s "Verify before you report" these do not count.
   - `test:checks` passed in every round (16 files, 230 tests).
   - `test:quick` passed in every round with "every command passed", at 29 to 130 s.
   - In one round (`checks-empty-2-a.out:5`), `npm test` printed `ENOENT: no such file or directory, stat '.../.svelte-kit/types/src/routes/proxy+page.server.ts'` and exited 0 (see B1).
3. **`npm run test:checks` passes: met.** Exit 0, `Test Files  16 passed (16)`, `Tests  230 passed (230)`, `Duration  119.37s`.
   - All nine cases pass, the three in `claude-usage.test.ts` included.
   - "are named stale, every one at once..." took 71980 ms, over its old 60_000 limit under load, so removing the limit is needed.
4. **Greps: met** (quoted under item 1).
5. **`npm test` and `npm run test:quick` pass: met.**
   - `npm test`: exit 0, `Test Files  103 passed | 17 skipped (120)`, `Tests  608 passed | 72 skipped (680)`.
   - `npm run test:quick`: exit 0, `test:quick: 54.5 s (limit 45.0 s); every command passed`, then `over the time limit`. The overrun is machine load, and `quick.mjs:284-287` does not fail on time.
6. **Cache folder ignored: met.** The step adds no folder.
7. **The nine cases on the four files: met after the change.** Exit 0, `Test Files  4 passed (4)`, `Tests  53 passed (53)`, all nine titles ✓. The unchanged-tree half is the builder's run, which I did not reproduce, for the reason under case 1.

**Verify list:** `sh utils/unused-exports.sh` printed 381 lines, none naming a changed file, and `noVitestDepsCache` is not exported. The ASCII gate printed nothing (exit 0), and `grep '[^ -~]'` over the ten changed files printed nothing.

## Findings

**Spec:** none.

**Proof:**
- **P1, the report's citation for the svelte-check race:** the report cites `@sveltejs/kit/src/exports/vite/index.js:449` as the vitest-start path. That line sits inside `if (is_build)` (`:434`). The paths a vitest start takes are `exports/vite/dev/index.js:65` (`sync.init`) and `:116` (`sync.create` -> `write_all_types`). The finding stands; only that citation is wrong.

**Standards (comments that are not true, which `spec.md` counts as a defect):**
- **S1, `tests/tiers/landing.mjs:10`:** "They share no folder that two of them write". This is false: `npm test` and `test:checks` both write `node_modules/.vite/vitest/da39a3ee.../results.json` and `_svelte_metadata.json`. The sentence then names `results.json` as an exception, so it contradicts itself. "written whole" (`:12`) is also too strong: a plain `writeFile` from two processes at once can leave a torn file. It is harmless only because the reader is guarded.
  - Failure scenario: a reader trusts the comment and adds a shared cache file that must not tear.
  - Fix: say that the one folder two runs rename into is turned off, and that the other shared files are guarded hints.
- **S2, `tests/tiers/quick.mjs:11-12`:** "so a run of npm test beside it reads whole files". `npm test` never reads `.experimental-vitest-cache`: only quick's own run passes `--experimental.fsModuleCache` (`quick.mjs:265`), and `vite.config.ts` does not set it. Another quick run is the only reader.
  - Fix: drop the clause, or name another `test:quick` run as the reader.
- **S3, `quick.mjs:128`:** "which npm test leaves out and test:slow runs". This is false for a slow file under `tests/checks`, which `test:checks` now runs.

**Behaviour:**
- **B1, open item for Axel.** The `.svelte-kit/types` race is real and wider than the report says.
  - **Cause:** every vitest start runs SvelteKit's `sync.create`, which writes and unlinks `.svelte-kit/types` files (`write_types/index.js:46-54`, `:359-370`).
  - **What the builder saw:** svelte-check failing once, in `test:quick` beside `npm test`.
  - **What I saw:** a run of two vitest starts together (`checks-empty-2-a.out:5`) printed an ENOENT on a `proxy+page.server.ts` there, with exit 0 that time.
  - **Where it can hit:** the landing lane 3's `npm run check`, and `test:quick` itself, whose own vitest run beside its own svelte-check has the same race.
  - **Scope:** it is outside Q124's brief (a different folder and writer) and is reported prominently as unfixed.
  - **Recommendation:** book it as its own step.
- **B2:** none in the step's code. The mechanism changes nothing for `vite dev`, `vite build` or `svelte-kit sync`, and both suites pass with the optimizer off for `__vitest__`.

## Judging the builder's two findings

- **The svelte-check race:** correctly kept outside the brief and correctly flagged as unfixed. It recurs in another form (B1).
- **The `results.json` premise:** correct. `readFromCache` itself has no guard (`cli-api:546-563`), but its only caller wraps it in `try {} catch {}` (`:13214-13216`), and the write is guarded too. A torn file cannot fail a start. Item 2's constraint "results.json is covered" therefore holds by vitest's own guard, with no extra mechanism.

## Declined to judge

- Case 1 and the unchanged-tree half of case 7: reproducing them needs the unchanged tree, and I may not edit the worktree.
- The landing's three lanes together: `npm run test:landing` is forbidden to me.
- Whether the `test:quick` time overruns would occur on an idle machine: the machine was loaded by other worktrees.

## Usage

claude-opus-5-5. About 75k tokens of context and about 45 tool uses. Wall time was about 75 minutes, mostly the 20 concurrent rounds.

## Repair round 1, refuted

Q124 refuter over repair round 1. Worktree: `.agents/worktrees/Q124`. Base: `4ddcc08b7`. Reviewed without changing any file. The worktree's `git status --short` still prints 11 lines, the same as at the start. One side effect of my stale-cache rounds: the worktree's `node_modules/.vite` now holds a `cp -cR` clone of main's cache.

**How I identified the delta.** The builder made no commit, so I read `git diff 4ddcc08b7` and compared it with what the first refuter report says it reviewed:
- `noVitestDepsCache` at `vite.config.ts:25-36` and the tag comment at `:57-67`;
- `landing.mjs:10` "They share no folder that two of them write";
- `quick.mjs:11-12` "so a run of npm test beside it reads whole files";
- `quick.mjs:128` "which npm test leaves out and test:slow runs".

What the diff holds now that the first report does not describe is the round:
- in `vite.config.ts`: the head comment's `syncTypesOnce` clause (`:3-6`), the `node:fs` and `node:path` imports (`:8-9`), `KIT_SERVER_PLUGIN` and `syncTypesOnce` (`:41-70`), `const kit = await sveltekit(...)` (`:72-78`) and the plugins line (`:81`). `noVitestDepsCache` moved to `:28-39` and the tag comment to `:88-93`, shifted and unchanged;
- `landing.mjs:9-17`;
- `quick.mjs:11-12` and `:128-131`.

Nothing else in the diff differs from the first report's description. A byte comparison with the first run's tree is not possible, since no copy of it exists.

```
grep -rnE "\}, [0-9_]+\);|timeout: *[0-9]|\{ *timeout|setConfig|testTimeout|hookTimeout" tests/checks
grep exit 1
grep -n '"test:checks"\|"test:slow"' package.json
14:        "test:checks": "vitest run tests/checks --testTimeout 0 --hookTimeout 0",
18:        "test:slow": "vitest run --tagsFilter slow --exclude 'tests/checks/**' --testTimeout 20000",
grep -rln "@module-tag slow\|tags: \['slow'\]" tests/checks
tests/checks/utils/claude-usage.test.ts
spec ASCII gate (LC_ALL=C perl ... $(find src tests bin config -type f ! -name local.yml))
bfs: error: bin: No such file or directory.   (no bin folder in the tree)
ascii gate exit 0
LC_ALL=C grep -n '[^ -~]' <the ten changed files>
nonascii grep exit 1
npm run test:quick -- HELP.md README.md package.json tests/checks/diagrams/diagrams.test.ts tests/checks/source/comment-width.test.ts tests/checks/source/history.test.ts tests/checks/utils/claude-usage.test.ts tests/tiers/landing.mjs tests/tiers/quick.mjs vite.config.ts
ok      svelte-check (5.5 s): 1791290656827 COMPLETED 390 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest (7.3 s): Duration  4.73s (transform 4.32s, setup 0ms, import 7.99s, tests 2.30s, environment 2ms)
test:quick: 15.6 s (limit 45.0 s); every command passed
exit 0
NO_COLOR=1 npx vitest run tests/checks/diagrams/diagrams.test.ts tests/checks/source/history.test.ts tests/checks/source/comment-width.test.ts tests/checks/utils/claude-usage.test.ts --testTimeout 0 --hookTimeout 0 --reporter=verbose
exit 0
 Test Files  4 passed (4)
      Tests  53 passed (53)
 (the nine titles each with a check mark: claude-usage "preserves an existing target..." 913ms; comment-width "ends by the hundredth column..." 2921ms; history "names no package id, date or session in any comment" 2949ms; diagrams "are what the source gives now..." 21221ms, "are named stale, every one at once..." 22230ms, "reads a label node by the box...", "are clear of every other arrow..." 11ms, "has no colour of its own..." 4ms, "carries the functions a write edge calls..." 5ms)
stat -f '%m %N' .svelte-kit/non-ambient.d.ts .svelte-kit/types/src/routes/$types.d.ts .svelte-kit/tsconfig.json .svelte-kit/generated/root.svelte, before and after that vitest run
1791290651 for all four, before and after (unchanged)
NO_COLOR=1 npm run test:checks -- --reporter=verbose
exit 0
 Test Files  16 passed (16)
      Tests  230 passed (230)
   Duration  51.26s
 (nine cases and claude-usage's other two cases among the passes; grep -ci "ENOENT|ENOTEMPTY" prints 0)
NO_COLOR=1 npm test -- --reporter=dot
exit 0
 Test Files  103 passed | 17 skipped (120)
      Tests  608 passed | 72 skipped (680)
 (grep -ci "ENOENT|ENOTEMPTY" prints 0; the types' mtimes still 1791290651 afterwards)
sh utils/unused-exports.sh
exit 0, 381 lines, no line naming vite.config.ts, tests/tiers, syncTypesOnce or noVitestDepsCache, no ERROR line
Concurrent rounds (driver scratchpad/pair.sh: two commands started at once per round, every run to its end; "cachelines" counts lines matching ENOTEMPTY|ENOENT|EEXIST|deps___vitest|_temp_|.svelte-kit/types|route_meta_data|Cannot find module), reduced count:
 types pair, as is, 6 rounds: npm test -- tests/server/machine/commands/run.test.ts beside npm run test:checks -- <2 files> (the script's tests/checks filter makes it the whole 230): 12 starts, all rc=0, cachelines=0
 deps pair, empty cache, 2 rounds: npm test beside npm run test:checks: 4 starts, all rc=0, cachelines=0, no deps* or _temp_ folder under node_modules/.vite/vitest afterwards
 deps pair, stale cache (main's .vite cloned), 2 rounds: 4 starts, all rc=0, cachelines=0
 quick pair, empty cache, 2 rounds: npm run test:quick -- tests/tiers/run.mjs beside npm test: 4 starts, all rc=0, cachelines=0 (quick 43.9 s and 11.4 s, every command passed)
 quick pair, stale cache, 2 rounds: 4 starts, cachelines=0; npm test rc=1 once on "manifest.test.ts > ... a folder of 501 files, and one of more than 20 MB  Error: Test timed out in 5000ms." (a test of its own under load, not the step's under spec.md)
 diff -rq main's node_modules/.vite/vitest/<hash>/deps___vitest__ against the worktree's after the stale quick rounds: identical for all three hashes (nothing rebuilt); _temp_ count 0
 check pair, as is, 3 rounds: npm run check beside npm test -- <2 files>: 6 starts, all rc=0, cachelines=0, svelte-check "0 ERRORS" each time
Fresh checkout (a cp -c clone of the worktree's tools/oculus in my scratchpad without .svelte-kit; config/local.yml does not exist in the worktree):
 npx vitest run tests/server/machine/commands/run.test.ts: "Tests  6 passed (6)", exit 0; ls .svelte-kit afterwards: ambient.d.ts env.d.ts generated non-ambient.d.ts tsconfig.json types
 6 rounds of two vitest starts at once from no .svelte-kit: 12 starts, 0 cache lines (the history check's rc=1 in three rounds is my own run's default 5000 ms limit, "Test timed out in 5000ms")
node scratchpad/probe.mjs (vite resolveConfig for serve and build):
 serve cacheDir ./node_modules/.vite environments client,ssr compile plugins 1 wrapped true preview hook function order oculus:component-before-style,vite-plugin-sveltekit-compile,oculus-server,oculus:no-vitest-deps-cache
 build cacheDir ./node_modules/.vite environments client,ssr compile plugins 1 wrapped true preview hook function order oculus:component-before-style,vite-plugin-sveltekit-compile,oculus:no-vitest-deps-cache
History words over the round's added lines (diff base worktree | grep '^>' | grep -inE "before|used to|no longer|still|always|as before|previously|the step adds|after this|Q[0-9]+|[A-Z][0-9]{2}[a-z]?\b|20[0-9]{2}"):
 vite.config.ts: plugins line (componentBeforeStyle matches "before"; code, not a comment)
 tests/tiers/landing.mjs: "// .svelte-kit/types. The files the runs still share, each project's results.json and"
```

### Verdicts

Items of "What to build":
- 1: **holds.**
  - The greps print nothing, and `package.json:14` and `:18` read as the brief asks.
  - `test:checks` runs 16 files and 230 tests, `claude-usage.test.ts`'s three cases among them.
  - `@module-tag slow` stays at `claude-usage.test.ts:3`.
- 2: **holds.**
  - 16 deps-pair and quick-pair starts across both starting states printed 0 cache lines.
  - The empty-cache rounds left no `deps*` or `_temp_` folder. After the stale rounds the cloned `deps___vitest__` folders are byte-identical to main's.
  - The dev server's `cacheDir` is still `./node_modules/.vite` (probe).
  - `results.json`'s reader is guarded at its caller (`cli-api.CnMVyzaz.js:13214-13216`).
  - The mechanism lives in the config, so every place a vitest run starts reads it.
- 3: **violated in part** (Standards R1-2): two sentences of the rewritten `landing.mjs` head comment are not true. The rest holds:
  - S2 (`quick.mjs:11-12`) is true: the cache is at `node_modules/.experimental-vitest-cache` (`cli-api:640`) and is written by `atomicWriteFile` (`:701`, `:838`).
  - S3 (`quick.mjs:128-131`) is true against `package.json:14`/`:18`.
  - `quick.mjs:252` now prints the right command.
  - P1 is closed: `index.js:449` is cited nowhere. The `dev/index.js:65`, `:116`, `:328`, `index.js:1203-1204` and `sync.js:40` citations match the source.

Cases:
- Case 1: **met on the builder's quoted rounds** (2 ENOTEMPTY in 20). Not reproduced, since no unchanged tree with `src` exists.
- Case 2: **met.** 2 rounds per starting state per pair, all run to the end: 16 starts and 0 cache lines. The one `npm test` rc=1 was a `manifest.test.ts` 5000 ms timeout.
- Case 3: **met.** Exit 0, `Test Files  16 passed (16)`, `Tests  230 passed (230)`, all nine titles pass.
- Case 4: **met** (quoted above).
- Case 5: **met.**
  - `npm test`: exit 0, `608 passed | 72 skipped (680)`.
  - `npm run test:quick`: exit 0, `15.6 s ... every command passed`.
- Case 6: **met.** The mechanism adds no folder, and `.gitignore:1` is `node_modules/`.
- Case 7: **met after the change** (`Tests  53 passed (53)`, the nine titles pass). The unchanged-tree half is the builder's quoted run.

### 1. Spec

None.
- The round touched only `vite.config.ts`, `landing.mjs`, `quick.mjs` and the report, all in the write list.
- The wrapper is the cause-level fix the round message asked for.
- No dependency was added.

Whether skipping SvelteKit's dev `configureServer` under vitest drops anything the tests rely on, read in `dev/index.js`:
- **`installPolyfills()` (`:37`):** does nothing on Node v24.21.0, since `crypto` and `File` already exist (`polyfills.js`).
- **`globalThis.__SVELTEKIT_TRACK__` and the `globalThis.fetch` wrapper (`:42-62`):** set in vitest's main process. Test files run in forked workers that never saw them.
- **`sync.init`/`sync.create` (`:65`, `:116`, `:328`):** write `.svelte-kit`. No file under `tests/` reads it (`grep -rn "svelte-kit" tests` finds only `quick.mjs` and `landing.mjs`).
- **Route watchers, middlewares, `loadEnv` and the adapter's `emulate` (`:334-444`):** serve HTTP or watch for changes, and a vitest run does neither. oculus's `emulate` only defines `platform` (`vite-plugin.ts:49-57`).
- **The guard plugin's `sync.all` (`index.js:744`):** returns early under `process.env.TEST === 'true'`, which vitest sets (`cli-api:14648`).

So nothing the tests use is lost. The 608 and 230 passes agree with this reading.

The development server, build and preview still run the original hook:
- The serve config has environments `client,ssr` and no `__vitest__` (probe), so the wrapper calls `original`.
- The build calls no `configureServer`.
- `configurePreviewServer` is carried over by `...found` (probe: "preview hook function").

### 2. Proof

None. The B1 closure reproduces:
- 0 cache lines over 12 types-pair starts, 6 check-pair starts and 8 quick-pair starts;
- with the marker present, a vitest run left the mtimes of `non-ambient.d.ts`, `types/src/routes/$types.d.ts`, `tsconfig.json` and `generated/root.svelte` unchanged;
- a fresh clone's first vitest run passed and wrote the types.

### 3. Standards

- **R1-1, `vite.config.ts:49-50`.**
  - Quoted: "so the types are written by `svelte-kit sync` (run by `npm run check`, `npm run test:quick` and the landing's check lane) and by nothing else."
  - What is wrong: `vite build` also writes `.svelte-kit/types`, through `sync.all` under `is_build` (`@sveltejs/kit/src/exports/vite/index.js:434`, `:449`). The development server writes them too, through the hook the comment's own last sentence says is unchanged. spec.md ("What every package obeys") counts a sentence a change makes false as a defect.
  - Failure scenario: a reader trusts "by nothing else" and puts a reader of `.svelte-kit/types` beside `npm run build` or the dev server, which gives the same race.
  - Fix at landing: name the three writers.
- **R1-2, `tests/tiers/landing.mjs:13-15`.**
  - Quoted: "so only `svelte-kit sync` (in the lane that runs npm run check) writes .svelte-kit/types. The files the runs still share, each project's results.json and _svelte_metadata.json".
  - What is wrong, first sentence: `npm run build`, in the same lane, also writes the types (`index.js:449`). The claim's point holds, because the lane is serial and vitest no longer writes, but the sentence as written is false.
  - What is wrong, "each project's results.json": there is one `results.json`, in the root's folder. `ls node_modules/.vite/vitest/*` shows it only under `da39a3ee...`, and vitest keeps one path per root (`cli-api:13213`, `setConfig(resolved.root, ...)`).
  - "still share" is a hit of spec.md's history-word list that the round's report does not quote or judge. Read here it contrasts with the folder turned off in the same sentence, not with an earlier state; "The files the runs share" removes the doubt.
  - Failure scenario: a reader looks for per-project `results.json` files, or believes the build lane leaves the types alone.
  - Verdict: item 3 violated in part. Fix at landing, as comment text.
- **R1-3, the report** (`agents/reviews/Q124-report.md`).
  - Sections the round made false were not re-taken. spec.md, "The working rules": "Every count, line count, timing and `file:line` in the report is taken after your last change".
  - Line 66: the history-grep row says it "prints nothing"; over the round's lines it prints the `still` hit above.
  - Line 98: "it is written whole with one `writeFile`" is the claim S1 found too strong.
  - Line 116: the `quick.mjs` row says "why a parallel `npm test` reads whole files".
  - Lines 135-138: the file table gives 61, 287 and 104 lines. `wc -l` prints 64, 290 and 135, which the round section's own figures match.
  - Line 188: quotes the removed sentence "They share no folder that two of them write".
  - Line 221: says the corrected citation sits in "Findings outside the brief", but it is in the round's B1 "Cause" bullet.
  - Failure scenario: the landing booking copies the file table's line counts, or a reader trusts the history-grep row.
  - Fix at landing: correct or annotate these lines.
- **R1-4, the report's first line against its round section.**
  - The first line says "the `.svelte-kit/types` race is ended at its cause". Under "What the repair does not cover", the round section names two forms that stay open: two vitest starts at once on a checkout with no `.svelte-kit` (both run the original hook), and two `svelte-kit sync` runs at once.
  - spec.md, "The working rules": a named risk is fixed, or said "plainly and prominently" to be unfixed.
  - My 12 fresh-clone starts showed no cache line, so the window was not reproduced.
  - Failure scenario: the orchestrator books B1 as closed outright. A newly created gate worktree's first `npm run test:landing` then starts `npm test` and `npm run test:checks` with no marker, beside lane 3's `svelte-kit sync`, and meets the original race once.
  - Fix at landing: the first line names the two forms.

### 4. Behaviour

- **R1-5, `vite.config.ts:63-66`.**
  - Quoted: "if ('__vitest__' in server.environments && existsSync(synced)) return;"
  - What a person sees change:
    - Before: every vitest start rewrote `.svelte-kit` (`tsconfig.json`, `ambient.d.ts`, `generated/`, `types/`) through `dev()`.
    - After: a vitest start writes nothing there while `.svelte-kit/non-ambient.d.ts` exists.
  - The round section states the after ("Where types are written now"). The report's "Host- or user-visible changes" table, the section the look and the landing read, has no row for it.
  - Failure scenario: with no dev server running, Axel adds a route and runs `npm test`. The editor's `./$types` import for the new route stays unresolved until `npm run check` or `npx svelte-kit sync`. Before the round, the test run would have fixed it.
  - Fix at landing: add the row.

### Merge with main (a fact for landing, not a finding)

Main's `vite.config.ts` (O30b, `4ce24363b`) is now `defineConfig(({ mode }) => { ... })`:
- `sveltekit({ outDir: folders.kit, ... })` is inside the function (`:39-46`);
- the head comment has a second paragraph (`:4-9`);
- a `build-folders.ts` import was added;
- the `test` block is indented one level deeper.

The round's change does not merge simply. A cherry-pick conflicts in the head comment, the imports, the plugins block and the re-indented tag comment and description. Re-applying it means:
- making the config function `async`;
- moving `const kit = await sveltekit({ outDir: folders.kit, ... })` inside it, which drops the top-level `await`;
- keeping `...syncTypesOnce(kit)` and `noVitestDepsCache` in `plugins`;
- deciding the marker path. `.svelte-kit` is correct for every vitest run, since vitest never runs under mode `app`. On main, though, the doc comment and the builder's judgment call 2 ("the checkout sets no other outDir") become false unless the marker uses `folders.kit` or the comment says why it does not.

`landing.mjs`: main rewrote base `:3-7`, and the round rewrote base `:9-12` with only line 8 between them, so expect a conflict that is resolved by hand. Lane 3's sentence on main (the app build writes `.svelte-kit-app/`) still leaves `npm run build` as a writer of `.svelte-kit/types`, which is R1-2.

`diagrams.test.ts`: main changed it at `:167` only, away from the six limits (main's `:85`, `:111`, `:820`, `:837`, `:849`, `:866`).

Not verified: that vitest 4.1.11 runs this `projects` block under an async config function.

### Declined to judge

- **Case 1 and the unchanged-tree half of case 7:** no unchanged tree with `src` exists, and I may not edit the worktree.
- **The before-repair half of the types race:** it needs the tree as it was when the round was sent. The builder's figure is 2 of 30 starts.
- **Whether the fresh-checkout window of R1-4 deserves a code fix rather than a stated limit:** it opens only on a checkout's first start of two vitest runs together and did not show in 12 starts, so whether a fix is worth its cost is the orchestrator's call.
- **A torn read of `.svelte-kit/tsconfig.json`:** `svelte-kit sync` rewrites it while a vitest transform resolves `tsconfig.json`. It was not observed (6 check-pair starts) and the race predates the step, so I did not pursue it.
- **The throw on a missing plugin and the top-level `await`:** I judge both sound and do not count either as a finding.
  - The throw stands where TypeScript requires the object-hook form of `configureServer` to be handled. Its alternative, returning the plugins unwrapped, would bring the race back silently after a SvelteKit upgrade. Its cost is a loud config error on such an upgrade.
  - The top-level `await` loads under Vite's bundled loader, `--configLoader runner` (`test:quick` passed) and knip (`unused-exports` exit 0, no ERROR). It goes away in the merge.
- **The landing's three lanes together:** `npm run test:landing` is forbidden to me.
- **Round counts:** reduced from the builder's 15, 12 and 10 per pair to 6, 2+2, 2+2 and 3.

Reviewer usage: agent id not known to me, claude-opus-5-5, about 200k tokens, about 40 tool uses, about 45 minutes (not measured).

## Closed

First run (sent to the builder as repair round 1):

- B1: closed in round 1 at its cause (`syncTypesOnce` in `vite.config.ts`), reproduced by the run over round 1 (0 cache lines over 26 concurrent starts, the types' mtimes unchanged by a vitest run).
- S1, S2, S3: comments rewritten in round 1; S2 and S3 held over round 1, S1 carried into R1-2.
- P1: closed in round 1, the citation corrected.
- B2: none.

Run over round 1 (fixed at landing on the gate, never sent to the builder):

- R1-1: the `syncTypesOnce` comment in `vite.config.ts` names every writer of the types (`svelte-kit sync`, `vite build`, the development server) and says no vitest run writes them once they exist.
- R1-2: `tests/tiers/landing.mjs`'s head comment says the third lane's `svelte-kit sync` and build write the types one after the other, names the one `results.json`, and drops "still".
- R1-3: the report's false lines corrected under "Corrections at landing (the orchestrator)" in `agents/reviews/Q124-report.md`.
- R1-4: the fresh-checkout window closed for the commands that start vitest runs together: `npm run test:quick` makes vitest wait for its `svelte-kit sync` when `.svelte-kit/non-ambient.d.ts` is missing, and `npm run test:landing` runs one `svelte-kit sync` before its commands in that case. Two starts by hand at once on a checkout with no types still both write them; this is stated in the report's corrections.
- R1-5: the row added to the report's corrections.
- The merge with main (O30b): the config stays a plain function of the mode (an `async` one is refused by the type of `vitest/config`'s `defineConfig`, as the landing's `npm run check` showed); `sveltekit({ outDir: folders.kit, ... })` is passed as its promise to `syncTypesOnce(kit, folders.kit)`, an async function that Vite awaits as a plugin entry, reading the marker in the mode's kit folder; no top-level `await` is left; `noVitestDepsCache` in `plugins`; the tags comment as the round wrote it.
