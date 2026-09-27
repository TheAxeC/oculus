# Step Q77a refuter report (on .agents/worktrees/Q77a, base 8ca4ca00)

## Verification (rerun by the reviewer)

All commands were run from `.agents/worktrees/Q77a/tools/oculus`. Before any run, `ls -A $TMPDIR | grep oculus-revert` listed one folder that was already there, `oculus-revert-vwIMNl`. After every run below it listed only that folder. `git status --short` in the worktree printed nothing, both at the start and at the end.

- `npx vitest run tests/checks/bin --reporter=dot`: `Test Files  8 passed (8)`, `Tests  83 passed (83)`, real 39.28 s. Load 3.71 at the start, 3.02 at the end.
- `npm run check`: `COMPLETED 1511 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`
- `npm run format:check`: `All matched files use Prettier code style!`
- `npm run lint`: exit 0.
- ASCII gate (the perl form in spec.md): no output.
- `sh bin/size-check.sh`: exit 0. `sh bin/folder-check.sh`: exit 0. `bin/revert-check.mjs` is 896 lines; `tests/checks/bin` holds 9 files.
- `node bin/revert-check.mjs tests/checks/bin/revert-check.test.ts`: `36 reverts, 0 unproven, 0 unchecked`, 36 `red` lines, real 195.50 s, load 4.66 to 7.44. The seven new or changed directives are all `red`: lines 23 and 26 to 31 of the output (the copy-signal case, the five in-memory cases, and the run-folder signal case).
- Timings, back to back, each with its load. "Original" means main's `bin/revert-check.mjs` (identical to 8ca4ca00's; `git diff --stat 8ca4ca00 HEAD` on that file is empty), copied into a scratch folder and run with `--root` set to the worktree's tools/oculus.

| Run | Output | Real time | Load, start to end |
| --- | --- | --- | --- |
| original, dispatch-note | `20 reverts, 0 unproven, 0 unchecked` | 88.61 s | 4.07 to 12.03 |
| new, dispatch-note | `20 reverts, 0 unproven, 0 unchecked` | 92.90 s | 11.31 to 9.83 |
| new, timed scratch copy, dispatch-note | `20 reverts, 0 unproven, 0 unchecked` | 76.10 s | 9.93 to 7.15 |
| new, diagrams | `50 reverts, 0 unproven, 0 unchecked`, 50 `red` | 96.30 s | 8.86 to 5.29 |
| original, diagrams, same worktree file | `50 reverts, 0 unproven, 0 unchecked` | 304.85 s | 4.94 to 11.10 |

- `diff` between the original's and the new script's output printed nothing, for dispatch-note and for diagrams, so the lines are word for word the same.
- The worktree's diagrams file holds 50 directives. The orchestrator's 56 were measured on main, after Q77e changed that file, so the 373.05 s figure is not the same input. On the same input the new script is 3.2 times faster (304.85 s against 96.30 s).
- On dispatch-note there is no gain: 88.61 s against 92.90 s, within the noise of the load.

**Where the time of a directive that falls back goes.** I added timing lines to a scratch copy of the new script and ran it over dispatch-note:
- 4 of the 20 directives were proven red in memory, at 603 ms each on average (2.41 s in total).
- 16 fell back to the copy. Together they took 73.62 s:
  - copy path (`checkOne`): 57.49 s, 3.59 s per directive;
  - baseline runs in memory: 7.00 s, 437 ms per directive (each case has one directive here, so the cached baseline is almost never reused);
  - revert runs in memory, all `passed`: 7.35 s, 459 ms per directive;
  - the `node --check` in memory: 0.5 s, 32 ms per directive, which `checkOne` then repeats;
  - Vitest start: 1.25 s, paid once;
  - the remaining 2.0 s: reading the target, the refusals, and swapping the environment and output in `within`.

The in-memory path adds about 1.0 s to each directive that falls back (16.13 s over 16), against a copy that costs 3.6 s. That is about 28 percent on top of the copy.

## 1. Spec

- **The two wrong premises in the report are both confirmed.**
  - `find tests -name 'config-folder*'` prints `tests/checks/config/config-folder.test.ts`; the path in the brief does not exist.
  - The case count: at 8ca4ca00 (and at 192979e1), `grep -c 'it('` gives 58 and `grep -c '^\s*it('` gives 30. The new tree has 36.
- **The fixture's own `vitest.config.mjs`** (`tests/checks/bin/revert-fixture.ts`, in `fixture()`) is needed. Vitest finds its configuration by walking up from the root. The note in `node_modules/vitest/dist/chunks/cli-api.CnMVyzaz.js:11404` says "simulates how `findUp` works in packages/vitest/src/node/create.ts". So a fixture under a copy's `.case-tmp` would take the copy's `vite.config.ts`, whose `include: ['tests/**/*.test.ts']` drops the fixture's `.js` cases. I did not rerun V8 without the file.
- **The rewritten "unremovable" case** (`revert-check.test.ts:747-775`) is needed. The in-memory path runs with the working directory set to the real fixture, so the old body's `chmodSync(join(process.cwd(), 'src'), 0o500)` would take the write bit off the fixture itself instead of off a copy. Its move to `unwritableTemp()` is also justified: the old cleanup ran only when the assertions passed.
- **The copy-signal case now uses a browser spec** (`:548-576`). This is a change no item asks for, and it is needed: a unit case now goes through memory first, so a browser case is the only way left to hold only a copy.
- **A sixth in-memory case** ("removes its run folder when it is stopped by a signal", `:735-744`). It covers item 4's "and on a signal", which the brief's list of five tests did not name.
- **The name pattern** is anchored at the end only (`exactly()`, `:428-431`), where the brief says "anchored to the whole case name". The brief's own probe does the same, and the report lists it as decision 1. Results are filtered by exact name, so a second case matched by the pattern does not change the verdict.
- No item marked DONE is missing from the diff.

## 2. Proof

- **Finding (the main one): in memory, a case runs against the real tree, so a revert can write into it, and that write can make a later directive `red` where the copy-only script says `GREEN`.**
  - The cause: `within()` (`bin/revert-check.mjs:697-715`) does `process.chdir(root)`, and the module paths are the tree's own. So reverted code that writes relative to the working directory, or to a path derived from the module's location, writes into the tree being checked. On the copy path it writes into the copy, which is then removed.
  - Reproduced with a scratch fixture whose `src/w.mjs` has `save(dir)` do `writeFileSync(join(dir, 'note.txt'))`, and directive `src/w.mjs "const out = join(dir, 'note.txt');" => const out = 'note.txt';`:
    - new script: `red`, and the fixture root now holds `note.txt`;
    - original script: `red`, and the fixture root is clean.
  - Adding a second case with a harmless directive (`src/a.mjs "export const a = () => 1;" => export const a = () => 1 + 0;`) that asserts `existsSync('note.txt')` is false:
    - new script: `red ... leaves the tree clean (revert src/a.mjs:1)`, `2 reverts, 0 unproven`;
    - original script: `GREEN ... leaves the tree clean (revert src/a.mjs:1)`, `2 reverts, 1 unproven`.
  - So a run of revert-check can now change the working tree it checks, and what that leaves behind reaches later directives on both paths, the copies included.
  - The head comment (`:31-48`) and the report do not mention this. The rewrite of the "unremovable" case is the builder meeting this same mechanism.
  - `grep` lists more than 20 unit test files under `tests/` that both write files and use `process.cwd()` or `import.meta.url`. I did not check which of them could write into the tree under a revert.
- **Finding (minor): after an exception, the swap can stay set.** In `red()` (`:806-816`), `swap.target = target; swap.text = text; vitest.invalidateFile(target);` run before the `try`. If `invalidateFile` throws, `swap.target` is never cleared, and every later run serves the reverted text for that path, including the baselines and revert runs of later directives, until another directive overwrites the swap. The outer `.catch(() => false)` sends only the current directive to the copy. The assignments belong inside the `try`. No test covers this.
- **No leak between runs in the one Vitest instance, in two scratch probes:**
  - one case, first directive reverting `src/b.mjs` (reached through `src/c.mjs`), second directive a harmless edit of `src/a.mjs`: `red` then `GREEN`, so the reverted b did not survive into the second run;
  - module-level `let n`, `globalThis.__seen` and `process.env.SEEN_BY_CASE`, each asserted to be first-seen, under a harmless directive: `GREEN`, so none of them carried over between the baseline run and the revert run.
- **Environment and working directory are restored after each piece of work:** `within()` puts both back in `finally`. On a signal, `stop` puts the output back and exits without restoring them, which does not matter because the process is ending.
- **The plugin answers only the exact target path** (`id === swap.target`, `:743`). A query id such as a `?raw` import or a Svelte style module gets the file from disk, so the case stays green and goes to the copy, which is the safe direction.
- The five brief tests and the sixth are each red under their own revert (V8 output lines 26 to 31, above). No test covers `within()` restoring the environment and working directory, or the swap being cleared after a throw.
- **The report's timings:** its dispatch-note pair (118.49 s new against 78.19 s original) is not reproduced as a slowdown. My pair was 92.90 s against 88.61 s at load 4 to 12. Its diagrams figure of 110.77 s is close to my 96.30 s.

## 3. Standards

- No comment line in the three changed files passes 100 columns (checked with `awk`).
- No package id, date or history in the changed comments. "no longer" at `:531` is in the older `caseEnv` doc comment and is not history.
- ASCII gate clean. File sizes 896, 851 and 193 lines. Folder check exit 0.
- No module-level mutable state in `bin`: the swap state lives in `memoryRun()`, and `RUN_PREFIX` is a constant string.
- `tests/checks/bin/revert-fixture.ts` has module-level arrays (`made`, `locked`, `opened`). This is test code, and the `made` array was already in the test file, so it is not a new pattern.
- No `README.md`, `DESIGN.md` or `HELP.md` mentions revert-check (grep found none), so nothing there needed a change.

## 4. Behaviour

- **A caller's tree can now be changed** by a run of revert-check (see Proof, first finding). Before this step, a run never wrote under `--root`.
- **Cost.** On a file where most cases read their target from disk or run it as a process, each such directive now costs about 1 s more (the baseline and revert runs, 437 + 459 ms), plus 1.25 s once for Vitest's start. On dispatch-note the gain from the 4 directives proven in memory cancels it out.
  - The baseline run could come after the revert run, only when that run returns `failed`. That keeps the guarantee that a red is only ever a case that passed without its revert, and saves about 437 ms on every directive that falls back (about 7 s on dispatch-note). The brief lists the baseline first, so this ordering is the orchestrator's call.
  - The `node --check` of a `.mjs` target runs twice on every fallback, once in memory and once in `checkOne`, at about 30 ms each.
- The output is unchanged: the `diff`s above were empty on both files. The exit status matched on all my runs (0 each time).
- A run over browser specs only never imports `vitest/node`.
- `vitest/node` is imported from the script's own folder, not from `--root`, so a script run from a place with no `node_modules` above it falls back to the copy for every directive (`start()` catches the failure and returns null). Callers only ever run it from `bin/`, where `vitest/node` is found.

## Not checked

- Case 1 of the brief (audit, venues, config-folder) was not rerun by me.
- Which of the more than 20 test files that write and use the working directory or module path could write into the tree under a revert.
- What happens to Vitest's workers on a signal during an in-memory run: `stop` exits without `vitest.close()`. Only the fixture signal case covers this, and it asserts only that the temp folder is empty.
- A Svelte target served in memory together with `componentBeforeStyle`: I read the code only; no probe.
- V8 without the fixture's `vitest.config.mjs`.

Reviewer usage: 35 tool uses, about 23 minutes.

## Repair round 1, refuted
```
$TMPDIR before any run: oculus-revert-vwIMNl (there before this round); after every run below: the same single folder. `git status --short` in the worktree: empty at the start and at the end.

npx vitest run tests/checks/bin --reporter=dot
  Test Files  8 passed (8) | Tests  84 passed (84) | 27.62 real | load 4.18 -> 6.40
npm run check
  COMPLETED 1511 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS   (load 6.52)
npm run format:check
  All matched files use Prettier code style!
npm run lint
  lint exit 0
ASCII gate (spec.md perl form)
  no output
sh bin/size-check.sh / sh bin/folder-check.sh
  size exit 0 / folder exit 0 (wc -l: bin/revert-check.mjs 900, revert-check.test.ts 885, revert-fixture.ts 257)
node bin/revert-check.mjs tests/checks/bin/revert-check.test.ts
  38 reverts, 0 unproven, 0 unchecked | exit 0 | 185.22 real | load 3.92 -> 10.58
  output lines 9, 23, 26-33 (the changed and new directives, incl. both of "runs cases on a copy of its own..." at bin/revert-check.mjs:773 and :793) all `red`
timed scratch copy of the new script, dispatch-note:  20 reverts, 0 unproven, 0 unchecked | 73.18 real | load 4.95 -> 7.41
timed scratch copy of the new script, diagrams:      50 reverts, 0 unproven, 0 unchecked | 95.35 real | load 7.41 -> 7.21
copy-only script (8ca4ca00, rebuilt by reverse patch, 661 lines), dispatch-note: 20 reverts, 0 unproven, 0 unchecked | 66.62 real | load 5.78 -> 9.77
diff copy-only vs new, dispatch-note: DIFF EMPTY
```

Restart cost (timed scratch copy, never in the worktree):
- dispatch-note: 1 start (2663 ms), 0 restarts, 24 listings, 1239 ms total, max 81 ms.
- diagrams: 1 start (2095 ms), 0 restarts, 96 listings, 4745 ms total (5 percent of the run), max 304 ms.
- One `listing()` of the run copy: 1701 entries, 43 to 49 ms right after the start.

Probes, run over four scratch fixtures. Each ran `clean, writer, clean`, where `clean` holds one breaking and one harmless directive over `src/a.mjs` and asserts that the writer's residue is absent:

| Writer's revert writes | New script, 4th clean line | Copy-only, 4th clean line |
| --- | --- | --- |
| into the working directory's copy through `new URL('../n.txt', import.meta.url)` | GREEN | GREEN |
| into `join(process.cwd(), '.svelte-kit')` | GREEN | GREEN |
| a folder left in `tmpdir()` (a reverted `rmSync` sweep) | **red** | GREEN |
| `chmodSync('data.txt', 0)` on a copy file | **red** | GREEN |

In all four, the fixture root was untouched afterwards (`ls -A`) on both scripts.

### Spec
- **Finding: the run copy closes finding 1 only for writes that change a path, size or mtime inside the copy. A write to the case's temporary directory, or a mode change, still reaches later directives and gives a `red` that the copy-only script calls GREEN.**
  - `bin/revert-check.mjs:732` `const env = caseEnv(folder);` makes one TMPDIR (`<run folder>/.case-tmp`), outside `tree` and so outside the listing, and it is shared by every in-memory run. The copy path gives each directive a fresh one.
  - `listing()` (`:696-711`) records `${full} ${held.size} ${held.mtimeMs}`. A chmod changes neither value.
  - Mechanism: a directive whose case failed in memory caches a `passed` baseline (`red()`, `:819-823`). A later harmless directive of that case then fails on the residue and is called red.
  - Real exposure: `tests/checks/bin/revert-check.test.ts:546` filters `readdirSync(tmpdir())` by prefix, and ten test files use `chmodSync` (`grep -rln chmodSync tests src`).
- The four fixes are otherwise present. The swap is set inside the `try` (`:775-779`) and cleared in the `finally` (`:785-789`). The reverted run comes first and the baseline only after one `failed`, cached per case (`:816-823`). The second `node --check` is skipped only when the in-memory parse returned null (`checkUnit` `:853-855`, `checkOne` `:641`). A browser directive still calls `checkOne(base, directive)` with its own parse.
- Beyond the four fixes:
  - `failed()`, `unproven()` and `at()` (`:557-564`) and the removal of `outsideCopy()` print the same text, since both diffs are empty. Their only purpose is the 900-line limit.
  - `withLockingCase` is needed. The run copy is made by `copyTree`, so a file locked beforehand would fail the in-memory start as well.
  - The renamed directives follow the changed lines. All are red (V8 above).
  - The listing taken after Vitest's start rather than after the copy is needed. The builder's probe shows SvelteKit writing `.svelte-kit/*` at start, and 0 restarts over 70 directives confirms that nothing else writes per run on these two files.

### Proof
- The new case "runs cases on a copy of its own, made again after a case wrote into it" (`revert-check.test.ts:753-777`) covers only a write into the working directory. No case covers the TMPDIR or mode residue above. Both probes turn red in the new script only.
- `withLockingCase` (`revert-fixture.ts:108-112`) proves "red in memory where the copy cannot copy" by having the case chmod the real fixture file through an absolute path during the in-memory run. The test depends on a case writing outside the run copy, which is the behaviour the round exists to contain. It holds only because the listing does not cover the real tree. It is a valid test device, but a reader of `:104-106` is not told that this is why it works.
- No test covers the swap being cleared after a throw (fix 2). The report says this was as instructed.

### Standards
- `bin/revert-check.mjs:759` is 101 columns, a new line in this round. The brief says comments end by the hundredth column:
  `            // Listed once started, as the tree's plugins write their own output there as they start.`
- The head comment `:37-38` states more than the code does: "a run after which the copy's files changed has it made again, so no case sees an earlier one's write". The TMPDIR and mode probes show a case that sees an earlier one's write.
- What was cut or merged to fit 900 lines:
  - `outsideCopy`'s doc comment (the link explanation) is gone from `checkOne`'s `!inside(dir, write)` path (`:638`). It survives only in `checkUnit`'s doc (`:833-835`).
  - `within()`'s doc lost "as a case of the copy path runs".
  - Nothing a reader needs to follow the logic is missing otherwise.
- ASCII, format, lint and size are clean (above).

### Behaviour
- A run can still print `red` where the copy-only script prints GREEN, through the case's temporary directory or a mode change (probes above). Working-directory and `import.meta.url` writes into the tree, and `.svelte-kit` writes, now match the copy-only script and leave the tree clean.
- Cost: 0 restarts on dispatch-note and diagrams. Listing adds about 50 ms per in-memory run, up to 304 ms, which is 5 percent of the diagrams run. On dispatch-note the new script is not faster than the copy-only one (73.18 s timed copy against 66.62 s, load 5 to 10).

Not checked:
- Case 1 of the brief (audit, venues, config-folder).
- The restart count on any file other than dispatch-note and diagrams.
- Workers on a signal during an in-memory run.
- A write through a path outside both the copy and TMPDIR (such as `cwd/..`, which is the run folder in memory and the system temp directory on the copy path).
- A Svelte target served in memory.

Reviewer usage: 17 tool uses, about 14 minutes.

## Repair round 2, refuted
```
$TMPDIR before any run: oculus-revert-vwIMNl (there before this step). After every run below: the same single folder. `git status --short` in the worktree: empty at the end.

npx vitest run tests/checks/bin tests/views/whole/type-scale.test.ts --reporter=dot
  Test Files  9 passed (9) | Tests  319 passed (319) | real 36.04 | load 2.67 -> 4.59
npm run check
  COMPLETED 1511 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS   (load 4.31)
npm run format:check
  All matched files use Prettier code style!
npm run lint
  lint exit 0
ASCII gate (spec.md perl form)
  no output
sh bin/size-check.sh / sh bin/folder-check.sh
  size exit 0 / folder exit 0 (wc -l: copy.mjs 326, directives.mjs 262, memory.mjs 214, revert-check.mjs 152, revert-check.test.ts 879, revert-fixture.ts 337)
node bin/migrations/revert-anchors.mjs --check
  0 directives converted in 0 files written, 0 refused | exit 0
grep -rn "bin/revert-check.mjs" --exclude-dir=node_modules --exclude-dir=.scratch .
  no output (exit 1); the same grep over the whole worktree minus .git/.scratch: no output
node bin/revert-check/revert-check.mjs tests/checks/bin/revert-check.test.ts tests/checks/bin/revert-anchors.test.ts
  49 reverts, 0 unproven, 0 unchecked | 49 `red` lines | exit 0 | real 216.87 | load 4.51 -> 10.54
  the 8 memory.mjs directives (output lines 28-35) all red
diagrams, new entry:   50 reverts, 0 unproven, 0 unchecked | 50 red | real 103.49 | load 11.06 -> 4.90
diagrams, main's script (copied to realpath $TMPDIR, --root worktree): 50 reverts, 0 unproven, 0 unchecked | real 322.52 | load 4.65 -> 8.53
diagrams, new entry, right after main's: 50 reverts, 0 unproven, 0 unchecked | real 99.04 | load 8.53 -> 5.11
diff new vs main output (both new runs): DIFF EMPTY
```

Main's script copied to `$TMPDIR` has to be run by its realpath (`/private/var/...`). Run as `/var/...`, its `process.argv[1] === fileURLToPath(import.meta.url)` guard is false, and it prints nothing in 0.05 s.

Split, checked by command:
- Every top-level function and const of `3c4dbb4e:bin/revert-check.mjs` was extracted and compared by name with the four new modules (a scratch script).
  - Only `listing`, `memoryRun` and `main` changed.
  - `main` changed only in the `'..', '..'` default root and the usage path.
  - The head comment changed only at `:36-46` (item 4 and the module names) and in the usage line.
- Retargeted directives: of the 38 `bin/revert-check.mjs` directives at 3c4dbb4e, 37 resolve (with `resolveAnchor`) to a byte-identical line range in the same enclosing function of the new module. The 38th follows its changed line (`listing(folder, skipped)`). The anchors test's one directive is also the same line.
- Directives per module, counted with `grep -ho ... | uniq -c`: copy 16, directives 14, memory 8, revert-check 3. The report says "9 now" for memory.mjs; the count is 8.
- Each new module's head comment matches its code: `directives.mjs` spawns nothing; `copy.mjs` holds the refusals and report lines both paths use.

Probes. Each fixture ran `clean, writer, clean`, and in each the fixture root was untouched afterwards (`ls -A`):

| Writer's revert | New entry, 4th clean line (harmless) | Main's script |
| --- | --- | --- |
| note.txt in cwd | GREEN | GREEN |
| `new URL('../n.txt', import.meta.url)` | GREEN | GREEN |
| folder left in `tmpdir()` | GREEN | GREEN |
| chmod on data.txt | GREEN | GREEN |
| write into `cwd/.svelte-kit` | GREEN | GREEN |
| write into `join(tmpdir(), '..', '.vitest-tmp')` | **red** (`5 reverts, 1 unproven`) | GREEN (`2 unproven`) |
| write into `join(process.cwd(), '..', 'up.txt')` | GREEN | **red**, and leaves `up.txt` in the system $TMPDIR |
| transform cache: t2 red, t1 reverts b.mjs, then t2's harmless edit | GREEN | GREEN |

### Spec
- The two additions beyond the five items are needed:
  - **Keeping `.vitest-tmp` out of the listing.** A scratch copy with `.vitest-tmp` put back into the listing printed `RESTART` after every in-memory run: 9 restarts over 5 directives on the fx-cache fixture.
  - **The lock writer's module only reads the file.** This is test fixture shape; no check was loosened.
- The rewrite of the note case into `afterWriter()` keeps every assertion of the old case: the four clean lines, the writer's `red`, `5 reverts, 2 unproven, 0 unchecked`, and `note.txt` absent. Nothing was loosened.
- Orchestrator files still name the old path: `grep -ln "bin/revert-check.mjs"` prints `plan.md` and `orchestrator-state.md` under `tools/oculus/.scratch/migration/`. These are outside the builder's paths; they are to update at landing.

### Proof
- **Item 1c has no test, and the report's reason for that does not hold.**
  - The report says "No fixture case for it: a write outside the copy on the copy path lands in the system temporary directory". The test does not need main's agreement.
  - A writer whose revert writes `join(process.cwd(), '..', 'up.txt')`, with a clean case asserting `!existsSync('../up.txt')`, gives the harmless line `GREEN` with the current code.
  - A scratch copy whose `memory.mjs:123` loop was replaced by `for (const one of ['tree', '.vitest-tmp']) rmSync(join(folder, one), { recursive: true, force: true });` gives that line `red` (`5 reverts, 1 unproven`).
  - So the restart's clearing of the run folder can be proven red under a revert, and no case in the tree does it.
- **The listing does not cover `.vitest-tmp`, so a case's write there reaches later directives.** It produced `red` where main prints GREEN (the probe table above). The path is contrived, since a case has to write through `tmpdir()/..`, but it is a residue inside the run folder that the check does not see.
- Report figures not reproduced: `revert-fixture.ts` is 337 lines by `wc -l`, not the 333 the report gives. memory.mjs holds 8 directives, not 9.

### Standards
- **Item 3 is not met for the test files.** Comment lines over 100 columns that are not directive lines:
  - `tests/views/whole/type-scale.test.ts:335` (111 columns, new this round; it was 98 at 8ca4ca00): `// bin/revert-check/revert-check.mjs, which resolves a case by its name: drop \`font-size: var(--fs-lg)\``
  - `tests/checks/bin/revert-check.test.ts:467` (111 columns, new this round): `// Revert: in real of bin/revert-check/directives.mjs, compare the path as written instead of following the`
  - `tests/checks/bin/revert-check.test.ts:789` (101 columns, from round 1 and not fixed): `// it; there, with the revert in the file, it takes the write bit off a folder of its`
  - No comment line in `bin/revert-check/*.mjs` or `bin/migrations/revert-anchors.mjs` passes 100 columns (checked with `awk`).
- **Item 4: the head comment still claims more than the code does.**
  - `revert-check.mjs:37-40`: "a run after which a path of the run's folder outside it was added, removed, or changed ... has the folder emptied ...; a write outside the run's folder, through an absolute path, is not seen."
  - `.vitest-tmp` is inside the run's folder and is skipped by the listing (`memory.mjs:104`), so a write there is not seen either. The `.vitest-tmp` probe above shows it.
  - The comment names only writes outside the run folder as unseen.
- No package ids, dates or history in the changed comments. The ASCII, format, lint, size and folder checks are clean.

### Behaviour
- **A case that leaves an unremovable folder in its temporary directory breaks the in-memory path for the rest of the run, leaves the run folder in the system $TMPDIR, and adds an output line that main does not print.**
  - Probe: the writer's revert leaves `residue-*/f` in a folder of mode 0o500. On an instrumented scratch copy, every later directive printed `CAUGHT Error: ENOTEMPTY ... oculus-revert-run-.../.case-tmp` and took the copy. The verdicts matched main's.
  - At the end, `close()` printed `kept      .../oculus-revert-run-z90eWq: Error: ENOTEMPTY ...`, and that folder stayed in $TMPDIR.
  - Main's script over the same fixture prints one `kept` line, for its own copy. The new entry prints that line plus the `oculus-revert-run-` line.
  - Cause: `emptyTemp()` (`memory.mjs:106-109`) and `close()` (`:208-212`) remove without the `chmod -R u+rwx` that `start()` does at `:122`. The report lists this as a limitation. The fix is the same one line, so it is a defect to repair, not a limitation.
  - I removed the three leftover folders my probes made.
- The cwd/.. probe: the new entry prints `GREEN` where main prints a spurious `red`, and main leaves `up.txt` in $TMPDIR. The new entry is the correct one here, but its output differs from main's on that fixture.
- Timing: diagrams 99.04 s and 103.49 s against main's 322.52 s. Output identical.

Not checked:
- Case 1 of the brief (audit, venues, config-folder) and dispatch-note, which were not rerun this round.
- Restart counts on real tree files other than diagrams. I checked only that the diagrams time did not regress.
- Workers on a signal during an in-memory run.
- A Svelte target served in memory.
- chmod -R's handling of the node_modules link on Linux. I ran it on macOS only.

Reviewer usage: 30 tool uses, about 22 minutes.

## Closed

First review:
- Spec, the two wrong premises (the config-folder path, the case count): confirmed; both were errors of the brief, recorded in the booking.
- Spec, the fixture's own `vitest.config.mjs`, the rewritten "unremovable" case, the browser spec in the copy-signal case, the sixth in-memory case: accepted, each needed.
- Proof, a revert writing into the tree checked: closed in round 1 (one copy per run) and round 2 (the listing of the whole run folder), proven by the note, up and temporary-directory writer cases.
- Proof, the swap left set after a throw: closed in round 1, the swap set inside the `try` (`bin/revert-check/memory.mjs`, `inMemory`).
- Behaviour, the baseline run before the revert run: closed in round 1, the baseline runs only after a `failed`.
- Behaviour, `node --check` run twice on a fallback: closed in round 1.

Round 1, refuted:
- The shared case temporary directory and the mode left out of the listing (both from the orchestrator's own brief and round text): closed in round 2, each with a writer case.
- The 101-column line, the head comment claiming more than the code does, the `withLockingCase` comment: closed in round 2.

Round 2, refuted:
- A folder a case left locked in its temporary directory broke the in-memory path and left the run folder behind: fixed at landing, `unlock()` gives the owner's permissions back before every removal; the case "removes what a case left locked in its temporary directory" is red under its revert.
- A write into Vitest's kept temporary directory went unseen: fixed at landing, that directory now sits beside the run's folder under one folder of the run, outside what a case reaches from its temporary directory, and the head comment says a write outside the run's folder is not seen.
- The restart's clearing of the run folder had no test: fixed at landing, the case "empties its run folder of what a case wrote beside the copy" is red under its revert.
- Three comment lines over 100 columns: fixed at landing.
- The plan files named the old path: the live references updated at landing (the dispatch comment, L7's draft brief); the logs keep the path they were written with.
- Two figures of the round 2 report are wrong (`memory.mjs` holds 8 directives, `revert-fixture.ts` 337 lines): recorded here; the code is unaffected.
