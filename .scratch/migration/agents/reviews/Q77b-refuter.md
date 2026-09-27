# Q77b refutation

Verification lines (run from the worktree's `tools/oculus`):

- `npx vitest run tests/checks/bin --reporter=dot`: `Test Files  9 passed (9)` / `Tests  101 passed (101)`
- `npm run check`: `COMPLETED 1516 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`
- `npm run format:check`: `All matched files use Prettier code style!`
- `npm run lint`: `lint exit 0`
- ASCII gate (the rules file's perl form): no output, `ascii exit 0`
- `sh bin/size-check.sh`: `size exit 0`; `sh bin/folder-check.sh`: `folder exit 0`
- Scratch copy (rsync of the worktree's `tools/oculus` without node_modules, node_modules linked, under the scratchpad), `node bin/revert-check/revert-check.mjs --base <copy> tests/checks/bin/revert-base.test.ts`: 13 `unchanged` lines, then `13 reverts, 0 unproven, 0 unchecked, 13 unchanged`, exit 0. The copy is removed: `ls` on it afterwards gives `No such file or directory`.
- `grep -c 'revert: bin/revert-check/revert-check.mjs' tests/checks/bin/revert-check.test.ts`: `3`

## Spec

1. The skip rule in `base.mjs` holds in every branch I checked against brief item 2:
   - Target missing or different: `base.mjs:138-139`.
   - Test file missing: `:113`.
   - Parse error: `:68`, `:114`.
   - Text outside the cases changed: `:115`.
   - Not exactly one case of the name in each folder: `:116-118`.
   - Case text changed: `:119`.
   - A case the parse does not find: in `:116-118`, a filter that finds nothing leaves length 0, so the case is proven.

   Without `--base`, `same` is null, `kept` is `''` (`revert-check.mjs:196`) and the unchecked loop is unchanged. `tests/checks/bin/revert-check.test.ts` passes, and it asserts exact output. The only change without the flag is the usage text, which item 4 asks for. The unchecked listing under `--base` (`revert-check.mjs:192`, through `caseUnchanged`, which uses the same `sameCase`) follows item 3.

2. The builder's decision 1 adds a condition the brief does not list. Brief item 2 says a directive is left out when all the listed conditions hold, "and proven exactly as today otherwise". `leftOut()` adds one more condition:
   `return same !== null && refusal(tree, directive) === null && same.directiveUnchanged(directive);` (`revert-check.mjs:152`).
   It only proves more than the brief asks, never less, and a refusal on main would otherwise be hidden as `unchanged`. I agree with it, but it is a deviation from the brief's rule, and the orchestrator has to accept it explicitly. `refusal()` now runs twice for every unit directive, the second time in `checkUnit()`. That is harmless.

3. The builder's decision 2 also adds a condition. The directive's line must lie inside the case the parse finds (`base.mjs:135-137`).
   - The hole it closes is real: `CASE = /^\s*(?:it|test)(?:\.\w+)?\s*\(/` at `directives.mjs:24` does not match `it.skip.each([1])(`, so `caseAbove()` gives the directive to the case above it.
   - The brief's rule alone would leave out a new directive in a changed case.
   - It only proves more, and a test covers it. Accept it.

4. The builder's decision 3 reuses `parsed()` from `bin/diagrams/imports.mjs` (`base.mjs:19`).
   - The rules file's "a parser ... exists once and is reused" favours reuse over a second `ts.createSourceFile` call.
   - `kindOf()` at `imports.mjs:85-88` reads the script kind from the extension, as the brief asks. It maps `.tsx` and `.jsx` to TS. `find tests -name '*.test.tsx' -o -name '*.spec.tsx' -o -name '*.test.jsx'` prints nothing, so no current file is affected.
   - Cost: revert-check now loads `svelte/compiler` on every run, with or without `--base`, because `base.mjs` is imported statically. `node -e "await import('./bin/revert-check/base.mjs')"` takes 0.33, 0.34 and 0.35 s real; `import('typescript')` alone takes 0.13, 0.13 and 0.14 s (load averages 5.30 4.65 4.85). That is about 0.2 s per run. The report does not state this cost.
   - Coupling: the test tool `bin/revert-check` now depends on `bin/diagrams`. The head comment of `imports.mjs:1-3` ("The one reader of a module's imports, which the import checks under tests/checks/imports/ and the diagrams of bin/diagrams/ both call") does not name the new caller. It only uses `parsed()`, so the sentence is not strictly false, but it is incomplete.

5. The brief premise that is wrong: Case 1 cannot print all 42 as `unchanged`. My grep reproduces the builder's evidence: 3 directives of `revert-check.test.ts` target `bin/revert-check/revert-check.mjs`, which this step changes. Printing those 3 as `red` is correct under item 2. I did not rerun Case 1 itself (see "Not checked").

6. `bin/revert-check/base.mjs:68` depends on `source.parseDiagnostics`, which is TypeScript's internal field. `grep -n parseDiagnostics node_modules/typescript/lib/typescript.d.ts` prints nothing, so the field is not in the public typings, and nothing else in the tree uses it.
   - If a `typescript` upgrade removes it, `.length` on undefined throws inside `leftOut()`. `main()` then crashes instead of proving the directive "as today", as brief item 2 requires for a file that fails to parse.
   - `revert-base.test.ts` would catch it, but the rule would still rest on an undeclared API.
   - A public route exists: `ts.transpileModule(text, { reportDiagnostics: true, ... }).diagnostics`, or a program's `getSyntacticDiagnostics`.

## Proof

1. I checked three directives by hand against the code. Each turns its case red.
   - "proves a directive whose case body changed", revert `base.mjs:119` => delete: the case is found once in each folder, the text outside the cases is equal, the directive line is inside the case and the target is equal. The directive becomes `unchanged`, and the expected `red` line fails.
   - "proves a directive the reader places in a case other than the one it sits in", revert `base.mjs:137` => delete: `caseAbove()` names 'refuses a size under the limit', which is unchanged between the folders. The directive sits in the `it.skip.each` case. With the line deleted the directive becomes `unchanged`, so the case goes red.
   - "proves a directive whose test file the base does not hold", revert `:113` to `if (here === null) return null;`: `there.cases` throws a TypeError out of `leftOut()`, so `main()` crashes and the expected lines are missing. The case goes red, but through a crash and not through the proving path. The directive still shows the guard is load-bearing.

   I read the other ten reverts and each one leaves out or lists what the case expects to be proven or unlisted, so none stays green. The builder's check-8 output (`13 reverts, 0 unproven, 0 unchecked`, all red) is consistent with this. I did not rerun it.

2. No test proves that a case with no directive is listed as `unchecked` when its body changed, or when the file around it changed. The one listing test only covers a new case name (`theirs.length === 0`). The shared lines of `sameCase` are covered through the directive tests (3 and 4), so a revert of those lines is caught. A change confined to `caseUnchanged` (`base.mjs:125`) that skipped them would not be caught by any case.

3. No count in the report disagrees with my runs. The report's Case 1 and Case 2 figures (`39 unchanged`, `229.62 real`, `42 red`) I did not reproduce.

## Standards

1. Comment line over the hundredth column, which the brief's Conventions forbid ("end by the hundredth column"). `base.mjs:7` is 101 characters (`awk 'length > 100'`): `// all three are compared as text. A case is a whole call statement that opens with \`it(\` or \`test(\`,`. The other lines over 100 in the new test file are revert directives, which stay one line by the tree's form.

2. Rules file: "Every id or key a package introduces is exercised empty, duplicated, and colliding with a configured or reserved key."
   - Empty: tested (`--base` alone).
   - Duplicated: `--base a --base b` is not tested. The last one wins (`revert-check.mjs:100-102`).
   - Colliding: `--base` naming the tree itself is not tested and not refused. Every directive then prints `unchanged` and the run exits 0 having proven nothing.

   Neither case is exercised, and the report does not mention either.

3. Head comment `revert-check.mjs:75-76` ("the files to read are the argument list, which is what `git diff --name-only <base>` prints") now uses "base" for a git commit next to the new `--base <dir>` folder. The sentence is not false, but a reader can confuse the two.

4. No history in comments. No non-ASCII (the gate is clean). Sizes are 142, 203, 245 and 403 lines. `tests/checks/bin` now holds ten tracked items, which is the limit, and folder-check passes.

## Behaviour

1. Every revert-check run, with or without `--base`, now loads `svelte/compiler`. That costs about 0.2 s per start (measurement in Spec 4), and the report does not state it.

2. `--base` naming the root folder silently turns every directive of the file list into `unchanged`, with exit 0. The report does not state this.

3. The report says the output without `--base` is "word for word today's". The usage line did change without the flag. Item 4 asks for that change and the report lists it under item 4, so this is imprecise but not hidden.

4. Under `--base`, a directive whose case imports a helper this same step changes is left out. The step's own change to `revert-fixture.ts`, which `revert-check.test.ts` imports, is an instance: the builder's Case 1 printed those directives as `unchanged` even though `run()` was rewritten. This is the documented limitation of item 4, and the report states it only in general terms.

## Not checked

- The builder's Case 1 and Case 2 runs (42 directives, about 18 s and 230 s) and their timings.
- Check 8 (`revert-check.mjs tests/checks/bin/revert-base.test.ts` without `--base`): I proved three directives by hand only.
- The whole unit suite, `npm test`, `npm run build` and the browser suite.
- Whether any caller outside the tree passes an argument named `--base` as a file. Inside the tree, grep finds no caller of revert-check with arguments other than the fixture helpers.

## Repair round 1, refuted

Verification lines, verbatim, run from the worktree's `tools/oculus`:

- `npx vitest run tests/checks/bin --reporter=dot`: `Test Files  9 passed (9)` / `Tests  105 passed (105)`
- `npm run check`: `COMPLETED 1516 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`
- `npm run format:check`: `All matched files use Prettier code style!`
- `npm run lint`: `lint exit 0`
- ASCII gate (the rules file's perl form): no output, `ascii exit 0`
- `sh bin/size-check.sh`: `size exit 0`. `sh bin/folder-check.sh`: `folder exit 0`
- `node bin/revert-check/revert-check.mjs --base . --base . tests/checks/bin/revert-base.test.ts`: `usage: node bin/revert-check/revert-check.mjs [--root <dir>] [--base <dir>] <file> [<file> ...]`, `exit 2`
- `node bin/revert-check/revert-check.mjs --base . tests/checks/bin/revert-base.test.ts`: `usage: node bin/revert-check/revert-check.mjs [--root <dir>] [--base <dir>] <file> [<file> ...]`, `exit 2`
- `node bin/revert-check/revert-check.mjs tests/checks/bin/revert-base.test.ts`: 17 lines `red`, then `17 reverts, 0 unproven, 0 unchecked`, `exit 0`, `real 82.84` (load averages 2.95 before, 5.88 after).
- `git status --short` at the end: the same five paths as at the start (3 `M`, 2 `??`).

## Closures

1. **Syntax errors from `transpileModule`: closed.** At `base.mjs:67-68`: `const options = { fileName: file, reportDiagnostics: true, compilerOptions: {} };` / `if (ts.transpileModule(text, options).diagnostics.length > 0) return null;`. A probe with `ts.transpileModule` (typescript `6.0.3`):
   - `it("x", () => { expect(1 }); });` as `.js` gives `[ 1005, 1128, 1128 ]`.
   - A clean `.js` or `.ts` case gives `[]`.
   - A type error (`const x: number = "s"`) gives `[]`, so no semantic check leaks in.
   - Over all 408 `*.test.ts`, `*.spec.ts` and `*.test.js` files under `tests`, `408 files 0 with diagnostics`, so no current test file is newly treated as unparsable.
   - The case's directive at `base.mjs:68` reverts red in the run above.
2. **Dynamic import: closed.**
   - `grep` of the imports: `revert-check.mjs:82-87` imports only `node:*`, `./directives.mjs`, `./copy.mjs` and `./memory.mjs`. `base.mjs` is loaded only at `:180`, `(await import('./base.mjs'))`, when `bases.length !== 0`.
   - No other module imports `base.mjs`.
   - `/usr/bin/time -p node bin/revert-check/revert-check.mjs README.md` gives `real 0.04`, `0.02` and `0.02`. The first review measured 0.33 s for loading `base.mjs` alone.
3. **Head comment of `imports.mjs`: closed.** `:3` reads `module apart; bin/revert-check/base.mjs reuses its parsed() to find the cases of a test file.`
4. **Rewrap of the `base.mjs` head comment: closed for the head comment** (`:1-14`, every line 100 or less). The builder's width proof does not hold for the file as a whole: see Standards 1.
5. **`--base` twice, or naming the tree: closed.**
   - `badBase()` is at `revert-check.mjs:122-127` and is called at `:170`.
   - My two runs above give the usage line and exit 2.
   - Test "answers a --base given twice with the usage": the revert `if (bases.length > 1) return true;` => delete lets the run proceed with the one folder. `UNDER` is the same in both fixtures, so the directive prints `unchanged` and no usage appears. Red, confirmed by the run (`revert-check.mjs:124`).
   - Test "answers a --base naming the tree checked, by its path or through a link": the revert `return real(bases[0]) === real(tree);` => `return false;` compares the tree with itself, so every line is `unchanged` and there is no usage. Red, confirmed (`:126`). The symlink variant exercises `realpathSync` through `real()` (`directives.mjs:250-253`).
6. **Two tests of the unchecked listing: closed.**
   - "lists a case with no directive whose body changed": the revert `caseUnchanged: () => true` skips the changed case, so the expected `unchecked` line is missing. Red (`base.mjs:126`).
   - "lists a case with no directive in a file whose text outside its cases changed": the revert `if (same !== null) continue;` skips every case without a directive. Red (`revert-check.mjs:206`).
   - I also checked the second test against a deletion of the `outside` comparison at `base.mjs:116`. The case's full text is `"\n\nit(..."` in both fixtures, so the case compares equal, it goes unlisted, and the test is red there too.
7. **`<commit>`: closed.** `revert-check.mjs:78` reads "`git diff --name-only <commit>` prints".
8. **Timeout: acceptable, not a loosening.**
   - `vite.config.ts` sets no `testTimeout` (grep prints nothing), so the Vitest default of 5 s applies. The builder reports 4297 ms for one case; I did not re-measure it.
   - It is the tree's pattern: `revert-check.test.ts:53` has `const LONG = { timeout: 180000 };`, with `{ timeout: 60000 }` at `:230` and `{ timeout: 120000 }` at several other cases.
   - `grep -c ", LONG, "` gives `10`. The seven cases without it (`:184, 202, 222, 258, 271, 279, 287`) are exactly those that start no Vitest run: usage, refusal, a directive printed `unchanged`, or no directive.
   - It bounds run time only. No assertion or predicate changed.
   - The builder's cause (a 5 s timeout on the one failed run) is not verified, as the report says.

## Spec
None. The round's changes are the seven items plus the timeout. `bin/diagrams/imports.mjs` is outside the brief's path list, but the round's item 3 asked for that change.

## Proof
None. All 17 directives are red in the revert-check run above, including the four new ones (`revert-check.mjs:124`, `:126`, `:206` and `base.mjs:126`) and the retargeted ones (`base.mjs:68`, `revert-check.mjs:170`).

## Standards
1. **`bin/revert-check/base.mjs:63` is 109 characters**, a comment line this round wrote when it reworded the `casesOf` doc comment for item 1: `     * every case taken out; null where the compiler reports a syntax error. A case is not walked into, so a call`. The brief's Conventions require comments to "end by the hundredth column".
   - The builder's width proof, `awk 'length > 100 && /\/\// && !/revert:/'`, only matches `//` lines, so it cannot see a JSDoc line, and its "prints nothing" does not cover this file.
   - `awk 'length > 100'` finds the line.
   - Other lines over 100 in the diff:
     - revert directives, which the tree keeps on one line;
     - `revert-base.test.ts:287` (101), a code line that Prettier (printWidth 100) produces and passes.
2. Otherwise none. Checked:
   - ASCII gate clean.
   - Sizes (`wc -l`): `base.mjs` 143, `revert-check.mjs` 217, `revert-base.test.ts` 297, `revert-fixture.ts` 403.
   - Folders: `tests/checks/bin` holds 10 entries and `bin/revert-check` holds 5; folder-check passes.
   - No history in comments.
   - The head comments of `revert-check.mjs:73-75` and `revert-base.test.ts:5-7` name the new refusals. No sentence I read is made false.

## Behaviour
None that is a defect.
- `casesOf` now parses each file twice: once inside `transpileModule` and once through `parsed()`.
- On `revert-check.test.ts` (898 lines), `transpileModule` takes 44.5, 12.9 and 9.1 ms against 2.7, 1.8 and 1.5 ms for `createSourceFile`, once per file per folder per run. This is noted, not a finding.
- `transpileModule` also reports TypeScript-only syntax in a `.js` file (code 8010 class) as a syntax error. Such a file is then proven, never left out, which is the safe direction.

## Not checked
- The whole unit suite, `npm test`, `npm run build` and the browser suite.
- The brief's Case 1 and Case 2 runs over `revert-check.test.ts`, with and without `--base`.
- Whether the builder's single failed run was a timeout.
- One incident: during a probe, a command of mine copied a scratch script to `tools/oculus/.probe-review.mjs` in the worktree. I deleted it straight away; `ls -a | grep -c probe-review` gives `0`, and `git status --short` shows the same five paths as at the start.

## Closed

- First review, Spec 2 and 3 (the builder's two added conditions): accepted as built; they only prove more.
- First review, Spec 4 and Behaviour 1 (svelte/compiler on every run; the imports.mjs head comment): closed in round 1 (items 2 and 3).
- First review, Spec 6 (parseDiagnostics): closed in round 1 (item 1).
- First review, Proof 2 (unchecked listing untested): closed in round 1 (item 6).
- First review, Standards 1 (base.mjs:7 width): closed in round 1 (item 4).
- First review, Standards 2 and Behaviour 2 (--base twice, --base naming the tree): closed in round 1 (item 5).
- First review, Standards 3 (base in the git sentence): closed in round 1 (item 7).
- First review, Spec 5 (Case 1 cannot print 42 unchanged): the brief was wrong; 39 unchanged and 3 red is correct.
- First review, Behaviour 3 and 4: the usage line change is item 4; the imported-helper limit is stated in the head comment, as the brief asked.
- Round review, Standards 1 (base.mjs:63 at 109 columns): fixed at landing.
