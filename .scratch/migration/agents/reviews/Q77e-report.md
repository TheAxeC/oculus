# Q77e report

Everything in the brief is done.

One timing is close to its limit: generating the engine once takes 1.35 to 1.76 s at load 7.1 to 7.6 over eight runs, and the first two runs at load 6.1 took 2.04 and 2.10 s. The brief's limit is 2 s. Details are under "Timings".

## DONE / NOT DONE

| Row | Status | Command and output |
|---|---|---|
| 1. `parseReader` in `bin/diagrams/parsed.mjs` | DONE | `node bin/revert-check.mjs tests/checks/diagrams/parsed.test.ts` gave `5 reverts, 0 unproven, 0 unchecked` |
| 2. Every parse goes through one reader | DONE | Verification 1 and 2 below. A temporary log in `generate` counted 2 engine generations (one per test file) and 1 copy generation; the log is removed (`grep -c GENCOUNT` gives 0). |
| 3. The tests share one cache | DONE | A temporary miss log in `parsed.mjs` over the byte-for-byte and changed-copy cases gave 628 parses: the 626 engine files, then `lib/server/root/watch/git.ts` and `lib/ui/html.ts` again. The log is removed (`grep -c PARSEMISS` gives 0). |
| 4. `tests/checks/diagrams/parsed.test.ts` | DONE | 4 cases pass, and each revert directive turns its case red (quoted below) |
| Case: `npm run diagrams` changes no drawing | DONE | `npm run diagrams` exit 0, then `diff -r <scratch>/diagrams-before docs/diagrams` printed nothing, exit 0 |
| Case: one generation under 2 s | DONE, close to the limit | see Timings |
| Case: changed-copy case under 5 s | DONE | 1755 ms run with its own file, 1158 ms in the verification run (loads under Timings) |
| Case: whole diagrams folder passes | DONE | `Test Files 6 passed (6)`, `Tests 96 passed (96)` |
| V1 `npx vitest run tests/checks/diagrams tests/checks/imports --reporter=verbose` | DONE | `Test Files  6 passed (6)` / `Tests  96 passed (96)` / `Duration  9.55s`. Changed-copy case: `✓ ... are named stale, every one at once, when an import and a publish are added 1158ms`. Per file, from the same run repeated with `--reporter=json`: diagrams.test.ts 4184 ms (46 cases), parsed.test.ts 8 ms (4), readable.test.ts 3397 ms (17), augments.test.ts 1410 ms, cycles.test.ts 1554 ms, order.test.ts 7536 ms. The verbose reporter prints no per-file durations, so those come from the JSON run. |
| V2 `npm run diagrams` + `diff -r` | DONE | no output |
| V3 `npm run check` | DONE | `COMPLETED 1512 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS` |
| V4 `npm run format:check` | DONE | `All matched files use Prettier code style!` |
| V5 `npm run lint` | DONE | exit 0 |
| V6 ASCII gate (perl form from the rules file) | DONE | no output, exit 0 |
| V7 `sh bin/size-check.sh`, `sh bin/folder-check.sh` | DONE | both exit 0, no output. `bin/diagrams` now holds 9 files. |
| V8 `node bin/revert-check.mjs tests/checks/diagrams/parsed.test.ts tests/checks/diagrams/diagrams.test.ts` | DONE | `55 reverts, 0 unproven, 0 unchecked`, exit 0 |

The parsed.test.ts revert lines:
```
red  parses a path asked twice with the same text once, and gives the same result (revert bin/diagrams/parsed.mjs:42)
red  parses a path asked twice with the same text once, and gives the same result (revert bin/diagrams/parsed.mjs:47)
red  parses a path again when the text given differs, and gives the new file (revert bin/diagrams/parsed.mjs:33)
red  shares its parses with another reader over the same cache (revert bin/diagrams/parsed.mjs:29)
red  keeps a cache of its own when it is given none (revert bin/diagrams/parsed.mjs:29)
```
`readable.test.ts` is outside the brief's revert-check list, but two of its revert directives now point at changed lines, so I ran it as well. `node bin/revert-check.mjs tests/checks/diagrams/readable.test.ts` gave `19 reverts, 0 unproven, 0 unchecked`, including `graphs.mjs:456` and `writes.mjs:176` red.

## What changed, per item

1. `bin/diagrams/parsed.mjs` (new, 51 lines):
   - It opens with a Layer 4 head comment on what the module is and why.
   - `parseReader(cache = new Map())` is at :29. It keeps one entry per path holding `{ text, imports?, code? }`.
   - An entry is reused only when `held.text === text` (:33); a different text replaces it.
   - `imports` (:42) and `code` (:47) each fill their own field once with `??=`.
   - It exports the typedefs `Parsed` and `Reader`.
2. Every parse now reads through the reader. Each function below takes it as a new last parameter, defaulting to `parseReader()`:
   - `bin/diagrams/graphs.mjs`: `runtimeImports` :104, which calls `read.imports` at :133; `layersDot` :165, passing it on at :176; `layerDot` :229, passing it on at :237; `channelsDot` :436, which calls `read.code` at :456. The direct imports of `codeOf` and `importsOf` are removed.
   - `bin/diagrams/writes.mjs`: the write chain's own `importsOf` wrapper takes the reader and calls `read.imports` at :81. `writesDot` :169 calls `read.code` at :176, passes the reader to the wrapper at :184, and calls `read.imports` at :186. `writesDrawn` :465 passes it to each round at :469. `writesDot`'s local module loader is renamed from `read` to `load` (:173) so it does not shadow the parameter. The `readImports` alias and the `codeOf` import are removed.
   - `bin/diagrams/diagrams.mjs`: `generate(engine, cache = new Map())` is at :137 and makes one reader at :139, passed at :143, :147, :149 and :151 (with `WRITE_ROUTE`, now imported). `staleFiles(engine, drawn, cache)` is at :168 and passes the cache at :170. `parseReader` is re-exported at :50. The head comment and `generate`'s doc now mention parsed.mjs and the cache. `main()` is unchanged.
3. The tests share one cache:
   - `tests/checks/diagrams/diagrams.test.ts`: one `parses` cache for the file (:51); `engineDrawn()` generates with it (:54). The changed-copy case awaits `engineDrawn()` first (:90) and calls `staleFiles(dir, undefined, parses)` (:97).
   - Three revert directives followed the changed lines: diagrams.test.ts:175 now targets `read.imports(path, text)`, diagrams.test.ts:662 now targets `load(target.path)`, and readable.test.ts:270 and :280 now target `read.code(...)`.
   - `tests/checks/diagrams/readable.test.ts`: `engineDrawn()` passes a `parses` cache of its own (:194, :197).
4. `tests/checks/diagrams/parsed.test.ts` (new, 84 lines):
   - `vi.mock` wraps `importsOf` and `codeOf` in `vi.fn` counters that call the real functions, so each case checks how many times a file was parsed as well as what the parse gave.
   - There are four cases, each with its revert directive in the tree's form.

The grep of `src config bin tests DESIGN.md HELP.md README.md docs` for the changed function names finds no other caller. The `runtimeImports` hits in `tests/checks/imports/graph.ts` and `boundaries.test.ts` are a different function in graph.ts.

## Timings, with the load beside each

- **Profiling script:** `<scratch>/Q77e/diag-prof.mjs` runs `generate(ENGINE)` on the worktree twice per process. Runs 1 and 2 of each process:
  - load 6.11: 2035 ms and 2104 ms
  - load 7.60: 1721 and 1345 ms, then 1602 and 1463 ms
  - load 7.31: 1763 and 1502 ms
  - load 7.13: 1744 and 1380 ms
- **Same script against main's checkout (read only), for comparison:** load 7.53 gave 8086 and 4414 ms; load 7.92 gave 4024 and 3864 ms.
- **Stage breakdown with a shared reader** (`diag-stages.mjs`, load 7.98):
  - the one imports pass: 569 to 749 ms
  - the one code pass: 644 ms
  - `writesDrawn`: about 280 ms (most of it the write diagram's layout rounds)
  - `layersDot`, the six `layerDot` and `channelsDot` together: under 100 ms
  - The two parse passes are now the cost. Each file is still parsed twice (once in imports.mjs for its imports and once in code.mjs for its comments). Sharing that one parse would mean changing those two files, which are outside this step's paths.
- **Changed-copy case:** 1755 ms with its own file (`npx vitest run tests/checks/diagrams/diagrams.test.ts --reporter=verbose`, load 8.33 before and 9.18 after); 1158 ms in the V1 run (load 9.96 before and 9.70 after).

## Judgment calls the brief did not cover (each reversible)

- The changed-copy case calls `await engineDrawn()` before generating the copy, so the cache is full even when the case runs alone (`-t` or revert-check). In the file run the engine generation has already finished, so this adds nothing there. When the case runs alone, its time includes one engine generation.
- The reader parameter is named `read`, as the brief writes it. `writesDot` already had a local closure called `read`, which is renamed to `load`, and the one revert directive that named it (diagrams.test.ts:662) follows the rename.
- `generate` passes `WRITE_ROUTE` explicitly to `writesDrawn`, rather than `undefined`, so the reader can come fourth.

## Anything in the brief that was wrong

Nothing wrong. The brief's path list includes `readable.test.ts` without saying that two of its revert directives name lines this change rewrites (`codeOf(path, raw)` in graphs.mjs and `codeOf(path, sources.get(path) ?? '')` in writes.mjs). The same holds for diagrams.test.ts:175 and :662. All four directives are updated, and revert-check proves each one red.

## Limitations

- `imports` returns the cached array itself. A caller that changed it would change it for every later reader. No caller in `bin/diagrams` changes it (they all iterate), but nothing enforces that.
- The cache only grows. A path deleted from the tree stays in it until the caller drops the Map. Both callers (a test file and one generation) are short-lived.

## Files changed

- new: `bin/diagrams/parsed.mjs` (51 lines), `tests/checks/diagrams/parsed.test.ts` (84 lines)
- changed: `bin/diagrams/diagrams.mjs` (now 197 lines), `bin/diagrams/graphs.mjs` (515), `bin/diagrams/writes.mjs` (516), `tests/checks/diagrams/diagrams.test.ts` (877), `tests/checks/diagrams/readable.test.ts` (351)

## Round 1 (continuation builder, after the first was stopped by an interrupt)

Everything in round 1 is done.

All four fixes are on disk in /Users/axelfaes/workspace/research-hub/.agents/worktrees/Q77e/tools/oculus. Every check in the brief's verification list passes, and I ran each one after the last edit.

## Fixes

| # | Fix | Status | Where |
|---|---|---|---|
| 1 | Counted-Map case in diagrams.test.ts, with revert directives | DONE | tests/checks/diagrams/diagrams.test.ts:49-72, 94-116 |
| 2 | Head comment of diagrams.mjs within 100 columns | DONE | bin/diagrams/diagrams.mjs:2-28 |
| 3 | "Parsed once" wording replaced | DONE | bin/diagrams/diagrams.mjs:14, :135-137; bin/diagrams/parsed.mjs:4-10 |
| 4 | Unused parseReader re-export removed | DONE | bin/diagrams/diagrams.mjs:39-51 |
| - | tree.ts meets the rules | DONE | tests/checks/diagrams/tree.ts |

**Fix 1.** The changed-copy case "are named stale, every one at once, when an import and a publish are added" (diagrams.test.ts:94) now does all of the following:
- The file's shared cache is `parses = new CountedCache<...Parsed>()` (:61). CountedCache records every `set`.
- `engineDrawn()` (:65) generates the engine into that cache once. It records the paths `importsOf` and `codeOf` were called with during that generation.
- The case asserts `[...parses.sets].sort()` equals `[...readSources(ENGINE).keys()].sort()`, so there is exactly one set per source file. It also asserts that `importsOf` and `codeOf` were each called once per file (`engineParsed` equals `[files, files]`).
- It then runs `staleFiles(dir, undefined, parses)` over a copy with `lib/ui/html.ts` and `lib/server/root/watch/git.ts` changed. It asserts that the new sets are exactly those two paths, and that each parser was called for exactly those two.

The parser counts are there because a set count alone stays green when only `layersDot` gets `parseReader()`: the `layerDot` calls still fill the shared Map.
- The two parsers are wrapped by `vi.mock` at :49 and :53. Each wrapper calls the real function, so no drawing changes.
- The file carries seven revert directives in all. The six new ones target diagrams.mjs lines 140, 144, 148, 150, 152 and 171:
  - `parseReader(cache)` changed to `parseReader()` in `generate`;
  - the reader passed to `layersDot`, `layerDot`, `channelsDot` and `writesDrawn` changed to `parseReader()`;
  - `generate(engine, cache)` changed to `generate(engine)` in `staleFiles`.
- revert-check shows all seven red.

This engine-generation case used to be in parsed.test.ts and is no longer there. parsed.test.ts keeps its four reader cases, and its head comment points to diagrams.test.ts for the generation case.

**Fix 2.** `awk 'length > 100 && /^ *\/\/ / && !/revert:/'` over bin/diagrams/*.mjs and tests/checks/diagrams/*.ts printed nothing. diagrams.mjs lines 70 and 117 are longer than 100, but they are code (a CSS string and a regex), not comments.

**Fix 3.**
- diagrams.mjs:14 reads "parsed.mjs computes each file's imports and its code once per generation for all of them".
- The comment on `generate` (:135-137) reads "each file's imports and its code are each computed once".
- parsed.mjs:5-6 reads "each file's imports and its code are each computed once per generation".
- `grep -rn "parsed once\|parses each file once" bin tests` finds only diagrams.test.ts:7, which reads "parses each file once for its imports and once for its code". That is accurate.

**Fix 4.** diagrams.mjs:35 imports `parseReader`, and the export block at :39-51 has no `parseReader` re-export.

**tree.ts.** It is a helper used by diagrams.test.ts and meets the rules:
- It has a Layer 4 head comment and no history, and it passes the ASCII gate.
- It exports `ENGINE`, `copyOfTree`, `CountedCache` (:33) and `parsedSince` (:43).
- Keeping it, rather than folding it back, is what keeps diagrams.test.ts under the size line: the file is 897 lines, against a line of 900.
- `find tests/checks/diagrams -type f | wc -l` gives 4, and folder-check exits 0.

## Checks

| # | Check | Status | Output |
|---|---|---|---|
| 1 | `npx vitest run tests/checks/diagrams tests/checks/imports --reporter=verbose` | DONE | see below |
| 2 | `npm run diagrams`, then `diff -r` | DONE | exit 0, no output |
| 3 | `npm run check` | DONE | `COMPLETED 1513 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS` |
| 4 | `npm run format:check` | DONE | `All matched files use Prettier code style!` |
| 5 | `npm run lint` | DONE | exit 0 |
| 6 | ASCII gate of spec.md | DONE | no output, exit 0 |
| 7 | `sh bin/size-check.sh`, `sh bin/folder-check.sh` | DONE | exit 0 and exit 0 |
| 8 | `node bin/revert-check.mjs` over parsed.test.ts and diagrams.test.ts | DONE | `61 reverts, 0 unproven, 0 unchecked`, exit 0 |

**Check 1**, run at load 6.85 (8.08 after the run):
- `Test Files  6 passed (6)` / `Tests  96 passed (96)` / `Duration  10.69s`.
- The changed-copy case: `✓ ... are named stale, every one at once, when an import and a publish are added 1293ms`.
- Per-file times from the json reporter: diagrams.test.ts 5324 ms, parsed.test.ts 7 ms, readable.test.ts 3689 ms, augments.test.ts 1997 ms, cycles.test.ts 1668 ms, order.test.ts 7836 ms.

**Check 2.** The copy of docs/diagrams was taken in this round, before `npm run diagrams`, not before the stopped builder's changes. No file under bin/diagrams was changed after that copy was taken.

**Check 8.** Running parsed.test.ts on its own gives `5 reverts, 0 unproven, 0 unchecked`.

## Files changed in this round
- tests/checks/diagrams/diagrams.test.ts: now 897 lines. The head comment is reflowed, the two parser counters, the counted cache and the engine parse record were added, and the case gained six directives and five asserts.
- tests/checks/diagrams/parsed.test.ts: now 85 lines. The generation case, its helpers and its imports were removed.
- tests/checks/diagrams/tree.ts: now 52 lines. `CountedCache` and `parsedSince` were added and the head comment updated.
- bin/diagrams/diagrams.mjs and bin/diagrams/parsed.mjs: fixes 2 to 4 were already on disk from the stopped builder, and I confirmed them with the greps above.

## Sharp edges
- diagrams.test.ts is 897 lines against the 900 line, so there is little room for new cases there.
- Every case in diagrams.test.ts now runs with `importsOf` and `codeOf` wrapped by `vi.fn` around the real functions. The case "reads imports with the one reader the import checks read them with" still holds, because both imports resolve to the same wrapper, and its revert is still red.
- The engine's parse record depends on the changed-copy case being the only case that adds entries to the shared cache after the engine generation. That holds today.
