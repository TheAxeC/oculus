# Q77b report

Everything in the brief is done. One exception is a verdict of the brief's first Case: with `--base`, 39 of the 42 directives of `revert-check.test.ts` print `unchanged`, not all 42. The other 3 are proven `red`, because their target is `bin/revert-check/revert-check.mjs`, which item 1 of this same brief changes. The rule of item 2 has to prove those 3 again. The evidence is under "Brief wrong" below.

## DONE / NOT DONE

| Item | State | Command and output (verbatim) |
|---|---|---|
| 1. `--base <dir>` flag, usage exit 2 | DONE | `revert-base.test.ts` case "answers a --base with no folder after it, or naming a file, with the usage" passes (in the run of check 1) |
| 2. Rule that leaves out an unchanged directive, in `base.mjs` | DONE | cases 1 to 8 and 11 to 13 of `revert-base.test.ts` pass |
| 3. `unchanged` line, `, <n> unchanged` summary, unchecked limited to cases that changed | DONE | cases "leaves out a directive..." and "lists a new case with no directive..." pass. Without `--base` the output is word for word today's: `npx vitest run tests/checks/bin/revert-check.test.ts` gives `Tests  41 passed (41)` |
| 4. Head comment and usage | DONE | `revert-check.mjs:62-78` (comment); usage in `main()` at `:156-160` |
| 5. Tests in `tests/checks/bin/revert-base.test.ts`, each red under its revert | DONE | check 8 below: `13 reverts, 0 unproven, 0 unchecked` |
| Check 1: `npx vitest run tests/checks/bin --reporter=dot` | DONE | `Test Files  9 passed (9)` / `Tests  101 passed (101)` |
| Case 1: `--base <copy of the unchanged tree>` over `revert-check.test.ts` | DONE, 3 lines `red` rather than `unchanged` (see "Brief wrong") | `42 reverts, 0 unproven, 0 unchecked, 39 unchanged`, exit 0. Per-word count: `3 red`, `39 unchanged`. `17.73 real`, load averages 2.49 before and 3.77 after |
| Case 2: the same run without `--base` | DONE | `42 reverts, 0 unproven, 0 unchecked`, exit 0, `42 red`. `229.62 real`, load 3.42 before and 7.06 after. The check run on the base copy itself gives `42 reverts, 0 unproven, 0 unchecked` (`214.80 real`, load 6.58 before and 4.99 after). A `diff` of the two outputs with the `(revert ...)` part removed is empty: the verdict is the same for every directive. The copy is removed (`rm -rf ...q77b-base` printed `removed`) |
| Check 3: `npm run check` | DONE | `COMPLETED 1516 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS` |
| Check 4: `npm run format:check` | DONE | `All matched files use Prettier code style!` |
| Check 5: `npm run lint` | DONE | `lint exit 0` |
| Check 6: ASCII gate (perl form) | DONE | no output |
| Check 7: `sh bin/size-check.sh`, `sh bin/folder-check.sh` | DONE | `size exit 0`, `folder exit 0` |
| Check 8: `node bin/revert-check/revert-check.mjs tests/checks/bin/revert-base.test.ts` | DONE | all 13 lines `red`, then `13 reverts, 0 unproven, 0 unchecked`, exit 0. `77.09 real`, load 2.91 before and 6.44 after |

## What changed

- **`bin/revert-check/base.mjs` (new, 142 lines).**
  - Layer 4 head comment at `:1-14`.
  - `textIn()` at `:25` reads a file in a folder, or gives null.
  - `rootOf()` at `:36` finds the identifier a callee is built on. It walks through property access, calls and tagged templates, so `it.each(x)(` and `test.skip` count as cases.
  - `caseOf()` at `:51` reads the case name as the raw text between the quotes, which is how `directives.mjs` spells it.
  - `casesOf()` at `:66` parses with `parsed()` from `bin/diagrams/imports.mjs`, the tree's existing TypeScript parse (script kind from the extension). It returns null where `parseDiagnostics` is not empty. It does not walk into a case. Each case's text is its `getFullText()`, and it also returns the file's text with every case taken out.
  - `baseline(root, base)` at `:98` returns `directiveUnchanged()` and `caseUnchanged()`. It keeps parses in a Map that belongs to the one run, not to the module.
- **`bin/revert-check/revert-check.mjs` (203 lines).**
  - Imports at `:67,70`.
  - `readArgs()` at `:92` reads `--base`; a `--base` with nothing after it is read as `''`.
  - `isFolder()` at `:109`.
  - `leftOut()` at `:151`.
  - In `main()`: the usage and exit 2 at `:156-160`, `baseline` built at `:166`, the `unchanged` line in the order of directives at `:175-178`, unchecked limited to changed cases at `:192`, the summary suffix at `:196`.
  - The resolved root variable in `main()` is renamed from `base` to `tree`, because `base` is now the flag.
- **`tests/checks/bin/revert-fixture.ts` (403 lines).** Added `runArgs(args, env)` at `:117` and `runOver(dir, base, files)` at `:139`. `run()` now calls `runArgs()`, with the same spawn as before.
- **`tests/checks/bin/revert-base.test.ts` (new, 245 lines).** 13 cases: the 10 the brief lists (the missing-from-base bullet split into a test-file case and a target case), plus the 2 decisions below. Each case pairs a root fixture with a base fixture, carries an anchored revert directive, and runs `sweepFixtures()` after it.

## Decisions the orchestrator may reverse

1. **A refused directive is never left out.** `leftOut()` runs `refusal()` first (`revert-check.mjs:151-152`), so a directive that is refused keeps its refusal line even when the base holds it unchanged. Such a directive was never proven on the base either. Test: "reports a refused directive the base holds unchanged as it is refused".
2. **The directive's own line must lie inside the case the parse finds** (`base.mjs:135-137`). Without this, the regular-expression case reader can place a directive in the wrong case. Example: a directive inside `it.skip.each([1])('...')`, which the pattern `(?:\.\w+)?` does not match, is attributed to the case above. That case can be unchanged while the case the directive sits in changed, and the new directive would be left out. Test: "proves a directive the reader places in a case other than the one it sits in".
3. **The parse is reused from `bin/diagrams/imports.mjs`** rather than written a second time. This means `revert-check` now loads `svelte/compiler` through that module's imports. `imports.mjs` itself is not edited.

## Brief wrong

- **Case 1 cannot print all 42 directives as `unchanged`.** `grep -c 'revert: bin/revert-check/revert-check.mjs' tests/checks/bin/revert-check.test.ts` gives `3`. Item 1 changes that target file, so item 2's rule ("the target file's text is the same string in both") requires those 3 directives to be proven. The 3 `red` lines name `revert-check.mjs:194`, `:140` and `:144`. Loosening the rule so they read `unchanged` would be a loosened check, so it was not done.
- **The rules file and the brief conflict on the suite.** The rules file's "Verify before you report" asks for `npm test` and `npm run build`. The brief and the dispatch forbid the whole unit suite, so neither was run. Not verified: the rest of the unit suite and the build.

## Limitations

- As the head comment states, a change to a module the case imports, other than its target, still leaves the directive out.
- A case named by a template with substitutions is never found by the parse, so it is always proven. Its directives are safe, but they cost a run.
- A test file with two cases of one name is always proven, including the case with no directive, which is listed as `unchecked` as before.
- No new dependency. No git command was run.
