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