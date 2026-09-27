# Step Q77e refuter report (on .agents/worktrees/Q77e, base 15a88e95)

## Verification (rerun by the reviewer)

All commands were run from `.agents/worktrees/Q77e/tools/oculus`.

1. `npx vitest run tests/checks/diagrams tests/checks/imports --reporter=verbose`
   - Result: `Test Files  6 passed (6)` / `Tests  96 passed (96)` / `Duration  12.34s`.
   - Changed-copy case: `✓ ... are named stale, every one at once, when an import and a publish are added 1870ms`.
   - Load: `uptime` gave 4.13 before the run and 4.02 after.
2. `npm run diagrams`
   - It exited 0.
   - I copied `docs/diagrams` to `$TMPDIR/q77e-refute/before` beforehand. `diff -r` against that copy printed nothing and exited 0.
   - `git status --short` printed nothing.
3. `npm run check`: `COMPLETED 1512 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`.
4. `npm run format:check`: `All matched files use Prettier code style!`.
5. `npm run lint`: exit 0.
6. The ASCII gate (the perl form in spec.md): no output, exit 0.
7. `sh bin/size-check.sh` exited 0 and `sh bin/folder-check.sh` exited 0.
8. `node bin/revert-check.mjs tests/checks/diagrams/parsed.test.ts tests/checks/diagrams/diagrams.test.ts tests/checks/diagrams/readable.test.ts`: `74 reverts, 0 unproven, 0 unchecked`, exit 0.
9. One timed generation, run three times (`node -e "...generate(process.cwd())..."`):

   | Run | Time | Load |
   |---|---|---|
   | 1 | 1917.7 ms | 9.26 |
   | 2 | 1730.0 ms | 8.76 |
   | 3 | 1828.0 ms | 8.76 |

   All three are under 2 s at a load of about 9. That agrees with the report's 1.35 to 1.76 s at load 7.1 to 7.6.

## 1. Spec

1. The brief departs from plan.md:188, and the builder followed the brief.
   - plan.md:188 says the parsed imports are "cached by its content hash" and that `npm run diagrams` gets "faster at every landing".
   - The brief's decisions 1 and 2 replace this with a comparison of the whole text in an in-memory cache. Nothing is kept across runs, so `npm run diagrams` is faster only within one run, not at every landing.
   - The brief records this as a decision. The ledger line was not updated to match it, so the orchestrator should check it against Axel's Z7 (a).
2. `bin/diagrams/diagrams.mjs:50` adds `export { parseReader } from './parsed.mjs';`. No item of the brief asks for this re-export and no caller in the tree uses it; parsed.test.ts imports parsed.mjs directly. It is a small change outside the brief. The report does list it under item 2.
3. The premises in "What is on the tree" are only partly re-checked. `bin/diagrams` held 8 tracked files at the base and holds 9 now; the rest is under "Not checked".

## 2. Proof

1. **Nothing proves that `generate()` shares one reader across the eight diagrams.**
   - Revert tried in a scratch copy under `$TMPDIR/q77e-refute/tree`: in `bin/diagrams/diagrams.mjs:143,147,149,151`, pass `parseReader()` instead of `read` to `layersDot`, `layerDot`, `channelsDot` and `writesDrawn`.
   - Result: `npx vitest run tests/checks/diagrams` gave `Test Files 3 passed (3)`, `Tests 67 passed (67)`. The changed-copy case took 6592 ms at load 7.71 and was still green.
   - The brief's central mechanism therefore has no red test. The only sign of the revert is wall time, which no check asserts.
2. **Nothing proves that the changed-copy case reuses the cache.**
   - Revert B: `tests/checks/diagrams/diagrams.test.ts:97` `staleFiles(dir, undefined, parses)` changed to `staleFiles(dir)`. All 67 cases passed, and the changed-copy case took 2601 ms at load 9.09.
   - Revert C: `bin/diagrams/diagrams.mjs:139` `const read = parseReader(cache);` changed to `parseReader();`. All 67 cases passed, and the changed-copy case took 2769 ms at load 9.6.
   - Under both reverts the case is also still under the brief's 5 s limit. So the row "changed-copy case under 5 s" does not show that the cache is used: the case meets the limit with the one shared reader alone.
   - The only evidence for item 3 is the report's "temporary miss log ... 628 parses". That log was removed and I cannot re-run it.
   - A check that would fail under reverts A to C: generate the engine into a Map whose `set` is counted and assert that it was called once per source file. Then run `staleFiles` over the copy with the same Map and assert that exactly the two changed paths are set again. Revert A leaves the Map empty; reverts B and C leave the second count at 0 or at every file.
3. Item 2 has no durable proof either. The report says "A temporary log in `generate` counted 2 engine generations ... and 1 copy generation". It is a removed log, not a test. `grep -rc -E "GENCOUNT|PARSEMISS" bin tests` finds no leftover, which only confirms the removal.
4. The four parsed.test.ts cases are red under their reverts (revert-check above). They prove the reader in isolation, not how the generator uses it.

## 3. Standards

1. **A head-comment line exceeds the hundredth column.** `bin/diagrams/diagrams.mjs:14` is 146 columns:

   ```
   +// parsed.mjs parses each file once for all of them, and source.mjs holds what they share. A module no layer row places is drawn in a dashed group
   ```

   The brief's conventions say comments "end by the hundredth column". The paragraph was not reflowed, and Prettier does not wrap comments, so format:check passes over it. The other lines over 100 columns among the added lines are revert directives, and the tree already writes those past 100 (for example the existing diagrams.test.ts:84 at 208 columns).
2. **Two comments make a false statement.** `bin/diagrams/diagrams.mjs:14` ("parsed.mjs parses each file once for all of them") and `bin/diagrams/parsed.mjs:5` ("each file is parsed once") both say one parse per file. The builder's own report says: "Each file is still parsed twice (once in imports.mjs for its imports and once in code.mjs for its comments)". The reader calls `importsOf` and `codeOf`, and each makes its own TypeScript or svelte parse. The sentence should say the file is parsed once for its imports and once for its code.
3. The grep of the changed names across `DESIGN.md`, `HELP.md`, `README.md`, `docs`, `src`, `config`, `tests` and `bin` (names: codeOf, importsOf, readImports, staleFiles, parseReader, parsed.mjs, bin/diagrams, `generate(`) finds nothing the diff makes false.
   - DESIGN.md:175 "the diagrams read imports through the same reader" still holds, since parsed.mjs calls importsOf.
   - The `codeOf` hits in `src/lib/server/accounts/connect/api.ts` and `tests/server/git/deposit.test.ts` are unrelated local functions.
4. I found no module-level mutable state in bin: `parseReader`'s cache is a default parameter per call. I found no history in comments and no non-ASCII (gate above). The files are under the size limit and `bin/diagrams` holds 9 files.

## 4. Behaviour

1. `generate(engine, cache)` and `staleFiles(engine, drawn, cache)` gain an optional parameter. Their output is unchanged: the `diff -r` after `npm run diagrams` printed nothing.
2. When the changed-copy case runs alone (`-t` or revert-check), it now first waits for a full engine generation (`diagrams.test.ts:90`, `await engineDrawn();`). The report states this as a judgment call. Given Proof 2, that wait buys nothing any check observes.
3. No change a reader can see in the app.

## Not checked

- Most line citations in the brief's "What is on the tree" section (for example diagrams.mjs:132 and graphs.mjs:103/163/226/432/452) were not re-verified at the base. My brief allowed only `git diff 15a88e95` and `git status --short`. Outside that allowance I ran `git ls-tree` once (the 8-file count above) and one `git show` loop, which failed on a shell quoting error and printed nothing.
- The report's stage breakdown and its comparison timings against main (`diag-stages.mjs`, `diag-prof.mjs`) were not reproduced, because those scripts are not in the worktree.
- The report's 628-parse and generation-count logs cannot be re-run, since they were removed.
- The browser suite and the whole unit suite were not run, per the brief.

Reviewer usage: 14 tool uses, about 15 minutes.
