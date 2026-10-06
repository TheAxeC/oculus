# Step Q77e refuter report (on .agents/worktrees/Q77e, base 0ec6659f)

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

- Most line citations in the brief's "What is on the tree" section (for example diagrams.mjs:132 and graphs.mjs:103/163/226/432/452) were not re-verified at the base. My brief allowed only `git diff 0ec6659f` and `git status --short`. Outside that allowance I ran `git ls-tree` once (the 8-file count above) and one `git show` loop, which failed on a shell quoting error and printed nothing.
- The report's stage breakdown and its comparison timings against main (`diag-stages.mjs`, `diag-prof.mjs`) were not reproduced, because those scripts are not in the worktree.
- The report's 628-parse and generation-count logs cannot be re-run, since they were removed.
- The browser suite and the whole unit suite were not run, per the brief.

Reviewer usage: 14 tool uses, about 15 minutes.

## Repair round 1, refuted
```
uptime (before): load averages: 9.16 10.70 9.56
npx vitest run tests/checks/diagrams tests/checks/imports --reporter=verbose
  Test Files  6 passed (6)
       Tests  96 passed (96)
    Duration  14.26s (transform 4.92s, setup 0ms, import 20.40s, tests 23.40s, environment 2ms)
  ✓ ... are named stale, every one at once, when an import and a publish are added 2227ms
uptime (after): load averages: 9.16 10.64 9.56
cp -R docs/diagrams $TMPDIR/q77e-r1/before; npm run diagrams -> exit 0; diff -r -> no output, exit 0
git status --short -> no output
npm run check -> COMPLETED 1513 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
npm run format:check -> All matched files use Prettier code style!
npm run lint -> exit 0
ASCII gate (perl form of spec.md) -> no output, exit 0
sh bin/size-check.sh -> exit 0
sh bin/folder-check.sh -> exit 0
node bin/revert-check.mjs tests/checks/diagrams/parsed.test.ts tests/checks/diagrams/diagrams.test.ts
  61 reverts, 0 unproven, 0 unchecked (exit 0; load 8.13 before, 16.22 after)
```

Reverts I ran myself, one at a time, in a scratch copy at $TMPDIR/q77e-r1/tree (node_modules and .svelte-kit symlinked), each run with `npx vitest run tests/checks/diagrams/diagrams.test.ts -t 'are named stale'`. The unreverted baseline passed (`1 passed | 45 skipped`). Every revert below turned the case red (`1 failed | 45 skipped`):
- D1: in `generate`, `parseReader(cache)` changed to `parseReader()`. Failure: `expected [] to deeply equal [ 'app.d.ts', …(625) ]`.
- D2: `layerDot(..., read)` changed to `parseReader()`. The importsOf count was 4382 against the expected 626.
- D3: in the test, `staleFiles(dir, undefined, parses)` changed to `staleFiles(dir)`. Failure: `expected [] to deeply equal [ Array(2) ]`.
- A (not a directive): writes.mjs:81, the write chain's importsOf wrapper, reads through `parseReader()`. Count 716 against 626.
- B (not a directive): writes.mjs:186, the whole re-export loop, uses `parseReader()`. Count 716.
- C (not a directive): graphs.mjs:237, `runtimeImports(sources, end)` with the default reader. Count 4382.
- E (not a directive): writes.mjs, `writesDrawn`'s rounds call `writesDot` without `read`. Count 716.
- F (not a directive): parsed.mjs, the text comparison dropped (`held !== undefined` alone). The copy set was `[]`.
- G (not a directive): parsed.mjs, `held.imports ??=` changed to `=`. Count 4562.
- H (not a directive): in the test, `engineDrawn`'s `generate(ENGINE, parses)` changed to `generate(ENGINE)`. The set was `[]`.

I found no revert of generate's reader sharing, and no revert of the test's cache argument, that leaves the new case green.

### Spec
- The round adds `tests/checks/diagrams/tree.ts` (new file, 52 lines). That path is on neither the brief's path list nor the round's four fixes.
  - It holds `ENGINE` and `copyOfTree`, which moved out of diagrams.test.ts, plus the two counting helpers `CountedCache` (tree.ts:33) and `parsedSince` (tree.ts:43).
  - It is needed. Without it diagrams.test.ts (897 lines) would pass the 900-line limit.
  - The size is kept honestly. `git diff 0ec6659f c5f85652` adds and removes no `it(` or `describe(` in diagrams.test.ts or readable.test.ts. No revert directive was dropped: the four `-` directives each come back with the renamed call (`read.imports`, `read.code`, `load(target.path)`).
  - A helper `.ts` beside a folder's tests is the tree's form (tests/checks/imports/order.ts, augments.ts, graph.ts). `tests/fixtures` already holds 10 items.
  - Its only importer is diagrams.test.ts:44.
- The `vi.mock` wrappers of `importsOf` and `codeOf` (diagrams.test.ts:49-56) cover every case of the file, because vitest mocks per file. They are needed for fix 1: reverts D2, A, B, C, E and G are caught only by the parser counts, since a set count of the shared Map stays at 626 under them.
- The generation case was put in diagrams.test.ts to reuse `engineDrawn()`. The brief's item 3 needs that case to pass the file's cache anyway. At 6e390733 parsed.test.ts had no generation case: the round's diff of that file touches only the head comment (parsed.test.ts:3-9).
- No other defects under this heading.

### Proof
- None for the round's four fixes. All seven directives on the changed-copy case are red under revert-check, and the ten reverts above are red.
- Outside the round, left over from the step: readable.test.ts:193-197 creates `parses` and passes it to one `generate` call only; `grep -n "parses\|generate(" readable.test.ts` shows no second reader of it. So the brief's "readable.test.ts passes a cache of its own" has no effect that any check could observe, and no directive. It is inert rather than wrong.

### Standards
- The round report misstates the end state in two places:
  - "tests/checks/diagrams/tree.ts: now 52 lines. `CountedCache` and `parsedSince` were added and the head comment updated". Against 6e390733 the file is new: `git diff --stat 6e390733 c5f85652` shows `tree.ts | 52 +++`, as a new file.
  - "This engine-generation case used to be in parsed.test.ts and is no longer there". No committed state held it there, so the sentence narrates an in-round wrong turn, not the end state.
- Comment width is clean. `awk 'length>100'` over diagrams.mjs, parsed.mjs, tree.ts, parsed.test.ts and the added diagrams.test.ts lines finds only revert directives and the two code lines at diagrams.mjs:70 and :117.
- The "parsed once" wording is fixed: a grep over bin, tests, src, DESIGN.md, HELP.md, README.md and docs finds only "computed once" and diagrams.test.ts:7 ("parses each file once for its imports and once for its code"), which are accurate.
- The unused re-export is gone (diagrams.mjs:48-51).

### Behaviour
- None. `npm run diagrams` followed by `diff -r` gives no output, and the `--stat` of the whole diff touches nothing under docs/diagrams.

Not checked:
- The builder's per-file json-reporter timings and its load figures. I quote my own run instead.
- The whole unit suite and the browser suite, per the brief.
- Whether `vi.fn`'s record of every `(path, text)` call across the whole diagrams.test.ts matters for memory. It was not measured.

I made one git call outside my allowance: a `git show <commit>:<path> | wc -l` loop. It printed nothing usable, and nothing in this report rests on it.

Reviewer usage: 19 tool uses, about 15 minutes.

## Closed

First review:
- Spec 1, plan.md:188 names a content-hash cache and "faster at every landing": fixed at landing, the plan line rewritten to what the brief decided and the step built (a cache of parses held in memory by the caller, reused while a file's text is the same string; `npm run diagrams` faster because each file is parsed once per run).
- Spec 2, the unused `parseReader` re-export: closed in the round, `bin/diagrams/diagrams.mjs:48-51` holds no such export.
- Spec 3, premises not re-checked: a note of what the review did not check, not a finding.
- Proof 1 to 3, nothing proved the shared reader or the cache reuse: closed in the round, the changed-copy case in `tests/checks/diagrams/diagrams.test.ts` counts the cache's sets and each parser's calls; its seven directives are red under revert-check (`61 reverts, 0 unproven, 0 unchecked`), and the round's reviewer turned ten further reverts red by hand.
- Proof 4: a note, not a finding.
- Standards 1, the head-comment line at column 146: closed in the round, `bin/diagrams/diagrams.mjs:14-16` reflowed; the round's reviewer found no comment line over 100 columns.
- Standards 2, "parsed once": closed in the round, `diagrams.mjs:14` and `:130-132` and `parsed.mjs:1-10` say each file's imports and its code are each computed once.
- Behaviour 2, the changed-copy case waits for the engine generation: that wait is now what the case's cache assertions read, so it is needed.

Round 1:
- Spec, `tests/checks/diagrams/tree.ts` outside the path list: accepted, it keeps `diagrams.test.ts` under 900 lines without dropping a case, in the tree's form for a helper beside its tests.
- Proof, `readable.test.ts`'s own cache is inert: no change; the brief's item 3 asked for it and it is harmless.
- Standards, two sentences of the round report are wrong: `tree.ts` is new in the round (begun by the stopped builder, finished by the continuation), and no committed state held the generation case in `parsed.test.ts`. Recorded in the landing report; the code is unaffected.
