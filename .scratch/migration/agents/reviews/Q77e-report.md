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
