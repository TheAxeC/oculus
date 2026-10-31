# O108 report, one desktop app

Everything in the brief is done.

One defect outside the step needs the orchestrator before anything else: the server does not start on this tree, with or without this step. It is the first section below.

## Defect outside the step: the server does not start on this tree

`src/lib/server/content/audit/website/cv.ts:141` is `constructor(private readonly input: CvInput) {`, a TypeScript parameter property. `src/server.ts` runs unbuilt under Node's type stripping, which refuses that syntax, so every start of the server from source ends with exit code 1. That covers `npm run app` and the app `npm run app:release` makes, whose `src/` is the same file.

Evidence, each run on this worktree after the last change; neither `cv.ts` nor anything it or `src/lib/server/root/context.ts` imports is in the step's diff, and `git show HEAD:src/lib/server/content/audit/website/cv.ts | grep -n 'constructor(private'` prints the same line 141 at the base:

```
$ node -e "import('./src/lib/server/root/context.ts').then(()=>console.log('loaded'),e=>console.log(e.code,e.message))"
ERR_UNSUPPORTED_TYPESCRIPT_SYNTAX TypeScript parameter property is not supported in strip-only mode

$ tar -xzOf release/oculus-1.0.0-linux-x64.tar.gz oculus-linux-x64/resources/app/src/lib/server/content/audit/website/cv.ts | grep -n 'constructor(private'
141:    constructor(private readonly input: CvInput) {
```

`npx vitest run tests/server/desktop/start.test.ts` on the worktree (file tagged slow; it starts `app-harness.ts` by its path, `tests/server/desktop/start.test.ts:29`, and imports neither that file nor `app.ts`, so test:quick does not choose it): `Tests  5 failed (5)`. Its Electron rows end on the dialog `The oculus server ended (exit code 1): SyntaxError [ERR_UNSUPPORTED_TYPESCRIPT_SYNTAX]: TypeScript parameter property is not supported in strip-only mode`.

The fix is outside the step's write list, so `cv.ts` is unchanged in this worktree. The whole fix:

```ts
    private at = 0;
    private readonly input: CvInput;

    constructor(input: CvInput) {
        this.input = input;
        for (const person of input.people) this.people.set(bareId(person), person);
    }
```

With exactly that edit in a scratch copy of the changed tree (rsync of the worktree into the session scratchpad, `node_modules` linked, copy deleted afterwards), `npx vitest run tests/server/desktop/start.test.ts --reporter=verbose` printed `Tests  5 passed (5)`. So the five rows hold on this step's `app.ts`, and the one line above is the only thing keeping them red.

Not verified: whether the app now in `~/Applications/oculus.app` carries this line and fails to start, since the builder does not touch that folder. To check: `grep -n 'constructor(private' ~/Applications/oculus.app/Contents/Resources/app/src/lib/server/content/audit/website/cv.ts`.

## Open items of the state file, verbatim

`.scratch/migration/orchestrator-state.md`, "## Open items", read in this session, holds no entry; its whole text is the one paragraph:

> An entry leaves this list for the closed log the moment Axel rules on it. What a review or a look found and no brief covered is not an open item: it is folded into an existing step in `plan.md` (Z468), never booked as a step of its own.

## The cases' first run, on the unchanged tree

| Case | First run |
| --- | --- |
| `grep -n '"app:package"' package.json` (the script itself was not run) | `27:        "app:package": "node src/desktop/package.ts",` |
| `grep -n '"app"' package.json` | `26:        "app": "electron .",` |
| the wide grep with the brief's exclusions | hits in `package.json:27`, `src/desktop/package.ts`, `src/desktop/release.ts:3` and `:42`, `tests/server/desktop/platform-steps.test.ts:3,10,13,18,44`, `tests/server/desktop/script-args.test.ts:1,2,8` |
| `grep -rn startedAsProgram src/desktop` | `src/desktop/package.ts:227` and `:235` |
| `npm run app:release -- --platform nosuch` | `Error: there is no oculus app for the platform nosuch`, at `appPlatform (.../src/desktop/package.ts:72:11)` |
| `npm run app:release -- --platfrom linux` | `Error: unknown argument --platfrom`, at `scriptArgs (.../src/desktop/package.ts:58:42)` |
| `npm run app:release -- --platform linux --arch x64` | exit 0, `release/oculus-1.0.0-linux-x64.tar.gz`, 41053 entries; `tar -tzf` lists `oculus-linux-x64/resources/app/src/desktop/package.ts` and no `release-steps.ts` |
| `npm run app:release -- --platform darwin --arch arm64` (the brief allowed leaving this out; it was run) | exit 0, `release/oculus-1.0.0-darwin-arm64.zip`; `unzip -l` lists `oculus.app/Contents/Resources/app/src/desktop/package.ts` and no `release-steps.ts` |
| the two test files, `npx vitest run ... --reporter=verbose` | `Tests  11 passed (11)` |
| `grep -rn not_built src/desktop config/text/desktop.yml` | `src/desktop/app.ts:354`, `config/text/desktop.yml:11` |
| `sh utils/unused-exports.sh` | status 0, 337 lines, no line under `src/desktop/` |

No case came out against the brief's own rules.

Changed test files on the unchanged code: with the new rows and the `iconSteps`, `signSteps` and `archiveStep` form written, the import still on `package.ts` and `package.ts` byte-equal to the base (`diff -q`), the same command printed `Tests  11 passed (11)`.

## DONE / NOT DONE

| Deliverable | State | Command and output |
| --- | --- | --- |
| `app:package` script removed | DONE | `grep -n '"app:package"' package.json`: no output, exit 1. `npm run app:package`: `npm error Missing script: "app:package"` |
| `npm run app` unchanged | DONE | `grep -n '"app"' package.json`: `26:        "app": "electron .",` |
| `src/desktop/release-steps.ts` holds the helpers, `Step`, `NAME`, `checkout`; no launcher code | DONE | wide grep below: no output, exit 1 |
| `src/desktop/package.ts` deleted | DONE | `git status --short`: ` D src/desktop/package.ts` |
| `release.ts` imports from `./release-steps.ts`; head comment says what the app is | DONE | `grep -n -iE 'moved\|formerly\|used to\|no longer\|previously\|launcher\|stub'` over the four files: no output, exit 1 |
| No reference to the removed names | DONE | `grep -rn -E 'app:package\|desktop/package\|package\.ts\|writeStub\|finishSteps\|defaultOut\|main\.cjs' . --exclude-dir=node_modules --exclude-dir=.scratch --exclude-dir=.agents --exclude-dir=release --exclude-dir=.svelte-kit --exclude-dir=.git --exclude=local.yml --exclude=package-lock.json`: no output, exit 1. `grep -rn startedAsProgram src/desktop`: no output, exit 1 |
| Refusal of a platform | DONE | `npm run app:release -- --platform nosuch`: `Error: there is no oculus app for the platform nosuch`, at `appPlatform (.../src/desktop/release-steps.ts:54:11)` |
| Refusal of an argument | DONE | `npm run app:release -- --platfrom linux`: `Error: unknown argument --platfrom`, at `scriptArgs (.../src/desktop/release-steps.ts:40:42)` |
| Linux archive | DONE | `npm run app:release -- --platform linux --arch x64`: exit 0, last line `.../release/oculus-1.0.0-linux-x64.tar.gz`; `tar -tzf`: 41053 entries, `oculus-linux-x64/resources/app/src/desktop/release-steps.ts`, no `package.ts` |
| macOS archive | DONE | `npm run app:release -- --platform darwin --arch arm64`: exit 0, last line `.../release/oculus-1.0.0-darwin-arm64.zip`, codesign steps passed inside the script (a failed step stops `runSteps`); `unzip -l`: 83170 lines, `oculus.app/Contents/Resources/app/src/desktop/release-steps.ts`, no `package.ts` |
| Changed test files | DONE | verify 4 below |
| `not_built` gone | DONE | `grep -rn not_built src/desktop config/text/desktop.yml`: no output, exit 1 |
| Verify 1 | DONE | `npm run diagrams`, exit 0, then `npm run test:quick`, exit 0, quoted below |
| Verify 2 | DONE | `sh utils/unused-exports.sh`, status 0; `diff` of the base's output with the last run's: no difference |
| Verify 3 | DONE | as in the `release.ts` row |
| Verify 4 | DONE | `npx vitest run tests/server/desktop/platform-steps.test.ts tests/server/desktop/script-args.test.ts tests/checks/tree/boundaries.test.ts --reporter=dot`: `Test Files  3 passed (3)`, `Tests  22 passed (22)` |
| Verify 6 | DONE | before the change 11 passed with the import of `package.ts`, both forms, see above; after it, verify 4 |

`npm run test:quick`, as printed:

```
test:quick: 8 changed file(s), from git since HEAD
test:quick: 10 test file(s)
ok      prettier (0.6 s): All matched files use Prettier code style!
ok      ASCII gate (0.7 s)
ok      svelte-kit sync (2.2 s)
ok      eslint (11.5 s)
ok      vitest (13.2 s): Duration  505ms (transform 371ms, setup 0ms, import 681ms, tests 7ms, environment 1ms)
ok      svelte-check (34.1 s): 1793480455741 COMPLETED 576 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest checks (43.8 s): Duration  30.94s (transform 20.95s, setup 0ms, import 39.01s, tests 48.41s, environment 3ms)
test:quick: 46.2 s; every command passed
test:quick: not covered: tests that reach no changed file within the import depth,
            other than the checks under tests/checks/source and tests/checks/tree,
            which run for any change under src, tests or utils; the build, the lint
            of unchanged files
```

The verify list ran once. No whole-suite command ran. `tests/server/desktop/start.test.ts`, which test:quick did not choose, was run alone in the worktree and once in the scratch copy, for the section at the top.

`LC_ALL=C grep -n '[^ -~]'` over the seven changed files: no output, exit 1.

`npm run diagrams` changed no tracked file: `git status --short` lists the eight paths below and nothing else.

## Files

From `diff -rq` against the base copy and `git status --short`. All are on the write list.

| Path | Lines at the base | Lines now |
| --- | --- | --- |
| `package.json` | 134 | 133 |
| `config/text/desktop.yml` | 88 | 87 |
| `src/desktop/app.ts` | 398 | 393 |
| `src/desktop/package.ts` | 235 | deleted |
| `src/desktop/release-steps.ts` | new | 125 |
| `src/desktop/release.ts` | 148 | 146 |
| `tests/server/desktop/platform-steps.test.ts` | 63 | 56 |
| `tests/server/desktop/script-args.test.ts` | 43 | 43 |

## Edits to existing assertions and predicates

From `diff` of each changed test file against the base copy. No allow list changed.

| File | Before | After |
| --- | --- | --- |
| `platform-steps.test.ts` | `const finish = finishSteps(platform, 'arm64', '/work/out/made', '/apps');` and `return [...icon.steps, ...finish.steps].map(...)` | `const sign = platform === 'darwin' ? signSteps('/work/out/oculus.app') : [];`, `const archive = archiveStep(platform, '/work/out/made', '/r/archive');`, `return [...icon.steps, ...sign, archive].map(...)` |
| `platform-steps.test.ts` | `const linux = finishSteps('linux', 'arm64', '/work/out/made', '/apps');` | removed |
| `platform-steps.test.ts` | `expect(linux.target).toBe('/apps/oculus-linux-arm64');` | removed: `target` was `finishSteps`' own result |
| `platform-steps.test.ts` | `expect(linux.steps).toEqual([{ program: 'tar', args: ['-czf', '/apps/oculus-linux-arm64.tar.gz', '-C', '/apps', 'oculus-linux-arm64'] }]);` | `expect(archiveStep('linux', '/apps/oculus-linux-arm64', '/apps/oculus-linux-arm64.tar.gz')).toEqual({ program: 'tar', args: [the same five] });` |

The mac assertions (`sips`, `iconutil`, `ditto`, `codesign`, ten `sips`), the `linux` `['tar']` assertion, the two icon assertions and the `darwin` `archiveStep` row are unchanged. No test title changed, so G85's and the other titles stand. `script-args.test.ts` changed its head comment and its import, no row.

Failing line on the unchanged tree: none to quote. The brief's verify item 6 replaces it for this step: the tests hold behaviour the change preserves, and they pass before and after. The new Linux row is left to be judged by reading.

## Judgment calls the orchestrator may reverse

1. `NAME` and `checkout` are exported from `release-steps.ts` and `release.ts` imports them, in place of a second copy of each in `release.ts`. The brief asks only that the helpers have them; a second copy of a constant in a file that already imports from the first breaks the rule that a fact exists once. `BUNDLE_ID` stays in `release.ts`, its only reader.
2. `Step` is not exported: nothing outside `release-steps.ts` imports it (`grep -rn -E "\bStep\b" src/desktop` hits that file alone), and verify 2 asks for such an export to be made local.
3. The darwin first run was taken though the brief allowed leaving it out.
4. In the head of `release.ts` "reads nothing of the checkout" reads "reads none of the checkout", so that `vite build --mode app` stays whole on one line at 100 columns. The sentence means the same.
5. `programs` in `platform-steps.test.ts` holds `platform === 'darwin' ? signSteps(...) : []`, since `signSteps` takes no platform; it mirrors `src/desktop/release.ts:127`, which signs on macOS alone.
6. `appPlatform` and `appArch` comments: "Check that `platform` is one the app is packaged for, refusing one with no app." and the same for `arch`.

## User-visible changes

| Change | Before | After |
| --- | --- | --- |
| `npm run app:package` | builds a launcher into `~/Applications/oculus.app` | `npm error Missing script: "app:package"` |
| The app with no built handler | dialog `The oculus server is not built. Run npm run app from the checkout once, then start the app again.` | no such dialog; the server ends with its own line |

The second row: `node src/server.ts --handler /nonexistent/handler.js` printed `oculus: /nonexistent/handler.js is no file, so there is no handler to load`, exit 1. That the app shows this line in its `desktop.dialog.server_exited` dialog is read from `src/desktop/app.ts` and from the rows above, where a server that ended with exit 1 reached that dialog with its error line; the exact dialog for a missing handler was not run, since the unit suite cannot damage a bundle and no builder breaks one. Only a damaged bundle reaches it. There is nothing to look at on localhost:8790 for this step.

Unchanged: `npm run app`, and `npm run app:release`'s paths and last printed line. The Linux archive's list differs from the first run in `release-steps.ts` for `package.ts` and in the hashed names under `build-app/`; the count is 41053 in both (`diff` of the two `tar -tzf` lists).

## Documents and comments

| Text | State |
| --- | --- |
| `src/desktop/release.ts` head comment | rewritten |
| `src/desktop/release-steps.ts` head comment | new |
| `appPlatform` and `appArch` doc comments | rewritten |
| `tests/server/desktop/platform-steps.test.ts` and `script-args.test.ts` head comments | rewritten |
| `programs` doc comment in the test | rewritten |
| `src/desktop/app.ts` head comment, `begin` | still true |
| `src/desktop/server/build.ts:1-6` | still true |
| `src/lib/server/root/process/start/first-run.ts:176` | still true |
| `src/lib/data/places/shipped.ts:3` | still true |
| `docs/HELP.md:13` and `:32` | still true |
| `README.md:74` and `:79` | still true |

History-word grep of the spec over the four files (`grep -n -iE "before|used to|no longer|still|always has been|always had|as before|previously|the step adds|after this package"`): one hit, `tests/server/desktop/script-args.test.ts:3`, `anything else stops the script before it builds`, an order of events in the script, unchanged wording, kept.

`sh utils/unused-exports.sh`: no line added.

No key or id is introduced. No helper is new: every function in `release-steps.ts` is one that was in `package.ts`. No library would cover the work and none was added. No script was written; the scratch copy took one Edit and was deleted.

## Limitations and sharp edges

- The defect at the top: every server start from source fails until `cv.ts` is fixed.
- `tests/server/desktop/start.test.ts` is the only test that starts the real app, and test:quick does not choose it for a change to `src/desktop/app.ts`, since it names the harness by path and imports nothing of the app. A green list therefore stands beside a server that cannot start.
- `release/` in the worktree holds the two archives (570 MB) and `build-app/` the last build; both are git-ignored.
- G85's Code line still names `src/desktop/package.ts`; `.scratch/migration/agents/guarded.md` is the orchestrator's at landing, as the brief says.

## Wrong or impossible in the brief

Nothing in the brief was wrong. Its premises reproduced, `app.ts` and the catalog line among them. Decision 1 says the server's own start error reports a missing handler, and the run in "User-visible changes" holds that for the server's line.

The brief's "What is on the tree" does not mention that the server fails to start; that is the first section.

## Repair round 1

Everything in `.scratch/migration/agents/briefs/O108-round-1.md` is done. Where this section differs from the sections above, this section holds. S1 is ruled with no change: `NAME` and `checkout` stay exported.

The defect in `cv.ts` at the top of this report is unchanged: it is outside this round too.

Open items of the state file: as above, none.

### What changed

| Finding | Path | Before | After |
| --- | --- | --- | --- |
| P1 | `src/desktop/release-steps.ts:113` | `export function signSteps(bundle: string): Step[] {` | `export function signSteps(platform: AppPlatform, bundle: string): Step[] {`, first line `if (platform === 'linux') return [];` |
| P1 | `src/desktop/release-steps.ts:109-112` doc comment | `The steps that sign a macOS bundle ad hoc and verify the signature, deep and strict.` | adds `and no step on Linux, which has no codesign` |
| P1 | `src/desktop/release.ts:127` | `if (platform === 'darwin') runSteps(signSteps(folder));` | `runSteps(signSteps(platform, folder));` |
| P1 | `tests/server/desktop/platform-steps.test.ts:18` | `const sign = platform === 'darwin' ? signSteps('/work/out/oculus.app') : [];` | `const sign = signSteps(platform, '/work/out/oculus.app');` |
| P1 | `tests/server/desktop/platform-steps.test.ts:41-44` | no such assertion | `expect(signSteps('darwin', '/apps/oculus.app')).toEqual([...])`: `['--force', '--deep', '--sign', '-', '/apps/oculus.app']`, then `['--verify', '--deep', '--strict', '/apps/oculus.app']`, both `codesign`, in that order |
| St1 | `tests/server/desktop/platform-steps.test.ts:3-4` | head comment | unchanged, and true now that the platform is passed to `signSteps` |
| St2 | `src/desktop/release-steps.ts:1-4` | `... finding Electron's version, and the programs the script runs.` | `... finding Electron's version, and the icon, signing and archive steps and running them.`, rewrapped; the rest of the comment unchanged |

Judgment 5 above is gone with the branch it described. No test title changed. Linux signing is held by the existing `expect(programs('linux')).toEqual(['tar'])`, which now reads the code's branch.

Lines now: `src/desktop/release-steps.ts` 129, `src/desktop/release.ts` 146, `tests/server/desktop/platform-steps.test.ts` 61 (`wc -l`). The other rows of the Files table stand. All paths are on the write list.

The archives in the worktree's `release/` were built before this round and were not rebuilt, as the round's brief says. `release.ts:127` and `signSteps` therefore have not run in a real build in their new form; the macOS and Linux steps they give are held by the test.

### Report rows corrected (B1, B2)

These two rows replace the rows of "User-visible changes".

| Change | Before | After |
| --- | --- | --- |
| `npm run app:package` | built a launcher into `~/Applications/oculus.app` on macOS and into `~/.local/share/oculus/oculus-linux-<arch>` with its `.tar.gz` on Linux, or into the folder `--out` named | `npm error Missing script: "app:package"`; `--out` and both outputs go with it |
| The app with no built handler | a dialog with one button, Quit, `The oculus server is not built. Run npm run app from the checkout once, then start the app again.`, shown before the login environment is read | the login environment and `machineLacks` run first, so a missing required program shows `desktop.dialog.lack_refused`; otherwise the `desktop.dialog.server_exited` dialog, `The oculus server ended (exit code 1): oculus: <path> is no file, so there is no handler to load`, with Restart and Quit; Restart forks the same missing handler and brings the same dialog back |

Read from `src/desktop/app.ts:333-340` (`ended`) and `:353-370`, the base's `app.ts:353-357`, and the base's `package.ts:92-94`, `:170-171` and `:188`. Only a damaged bundle reaches the second row. That dialog with this text was not run, as above.

### Checks on the final tree

`npm run diagrams`, exit 0, then `npm run test:quick`, exit 0, run once in this round:

```
test:quick: 10 changed file(s), from git since HEAD
test:quick: 10 test file(s)
ok      prettier (0.8 s): All matched files use Prettier code style!
ok      ASCII gate (0.9 s)
ok      svelte-kit sync (2.5 s)
ok      svelte-check (9.6 s): 1793482037911 COMPLETED 576 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      eslint (9.9 s)
ok      vitest (11.8 s): Duration  326ms (transform 210ms, setup 0ms, import 387ms, tests 7ms, environment 1ms)
ok      vitest checks (41.7 s): Duration  29.97s (transform 12.85s, setup 0ms, import 26.38s, tests 35.09s, environment 2ms)
test:quick: 44.4 s; every command passed
```

The ten changed files are the eight of the Files table and two under `.scratch`, this report and the round's brief.

`npx vitest run tests/server/desktop/platform-steps.test.ts tests/server/desktop/script-args.test.ts --reporter=dot`, a passing run after the change, as the round asks; no run on the unchanged tree:

```
 Test Files  2 passed (2)
      Tests  11 passed (11)
```

| Check | Output |
| --- | --- |
| `sh utils/unused-exports.sh` | status 0; `diff` with the base's output: no difference |
| `LC_ALL=C grep -n '[^ -~]'` over the seven changed files | no output, exit 1 |
| `grep -n -iE 'moved\|formerly\|used to\|no longer\|previously\|launcher\|stub'` over the four files | no output, exit 1 |
| history-word grep over the four files | the one hit above, `script-args.test.ts:3`, kept |
| `grep -rn signSteps src tests docs README.md config --exclude=local.yml` | every call passes the platform: `release.ts:127`, `platform-steps.test.ts:18` and `:41`; the other hits are the definition, the imports and the head comment |

No whole-suite command ran.
